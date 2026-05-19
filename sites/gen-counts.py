#!/usr/bin/env python3
"""Generate metronome count audio in two stages.

  counts_initial/{voice}/           Raw edge-tts output.
      count-1.mp3 .. count-N.mp3       Individual digits.
      seq.mp3                          Continuous "one two ... eight".
      sub.mp3                          Continuous "one ee and ah".

  counts_final/{voice}/             Cleaned + split versions used by the UI.
      count-1.mp3 .. count-N.mp3       Trimmed + atempo + faded.
      seq-1.mp3 .. seq-8.mp3           Words split out of seq.mp3.
      sub-1.mp3, sub-e.mp3,            Syllables split out of sub.mp3.
        sub-and.mp3, sub-a.mp3
      offsets.json                     Suggested ms offset (peak position)
                                       for every clip in this voice.

  counts_final/index.json           Top-level voice list for the UI to read.

Setup (once, from sites/):
  brew install ffmpeg                 # or skip — imageio-ffmpeg bundles a fallback
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt

Usage:
  python3 gen-counts.py                              # both default voices
  python3 gen-counts.py --voice en-CA-ClaraNeural    # one voice
  python3 gen-counts.py --voice en-CA-ClaraNeural --voice en-US-AvaNeural
  python3 gen-counts.py --max 12                     # only digits 1..12
"""
import argparse
import asyncio
import json
import os
import re
import shutil
import subprocess
import sys

import edge_tts
import numpy as np

# Prefer the bundled ffmpeg from imageio-ffmpeg if present (handy for sandboxes
# without `brew install ffmpeg`). Falls back to PATH ffmpeg otherwise.
try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG = shutil.which("ffmpeg")

DEFAULT_VOICES = ["en-CA-ClaraNeural", "en-US-AvaNeural"]
INITIAL_DIR = "counts_initial"
FINAL_DIR = "counts_final"
COUNT_MAX = 32
SILENCE_THRESHOLD = "-30dB"
FADE_S = 0.005
DEFAULT_SPEED = 1.35

_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
_TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
          "sixteen", "seventeen", "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]


def num_to_words(n: int) -> str:
    if n < 10: return _ONES[n]
    if n < 20: return _TEENS[n - 10]
    if n > 99: return str(n)
    t, o = divmod(n, 10)
    return _TENS[t] if o == 0 else f"{_TENS[t]}-{_ONES[o]}"


# Periods give edge-tts a clear sentence break per word, so silence-detect
# can split reliably afterwards.
SEQ_TEXT = "one. two. three. four. five. six. seven. eight."
SEQ_NAMES = [f"seq-{i + 1}" for i in range(8)]

# "ee" instead of "e" is much more reliably pronounced as /iː/ by neural TTS.
# "ah" gives the schwa-ish /ɑ/ you want for the 16th "a".
SUB_TEXT = "one. ee. and. ah."
SUB_NAMES = ["sub-1", "sub-e", "sub-and", "sub-a"]


def ffmpeg_run(args, quiet=True):
    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error" if quiet else "info", "-y"] + args
    subprocess.run(cmd, check=True)


def ffmpeg_stderr(args):
    """Run ffmpeg and return its stderr (where silencedetect logs)."""
    cmd = [FFMPEG, "-hide_banner"] + args
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.stderr


async def tts(text: str, voice: str, out_path: str) -> None:
    await edge_tts.Communicate(text, voice).save(out_path)


def _atempo_chain(speed: float) -> list[str]:
    """atempo only accepts [0.5, 2.0] per stage; chain for ratios outside."""
    parts = []
    rem = speed
    while rem > 2.0:
        parts.append("atempo=2.0")
        rem /= 2.0
    while rem < 0.5:
        parts.append("atempo=0.5")
        rem /= 0.5
    if abs(rem - 1.0) > 1e-3:
        parts.append(f"atempo={rem:.4f}")
    return parts


def _fade_chain() -> list[str]:
    """Apply tiny fades at both edges to kill any trim-cut clicks."""
    return [
        f"afade=t=in:st=0:d={FADE_S}",
        "areverse",
        f"afade=t=in:st=0:d={FADE_S}",
        "areverse",
    ]


def trim_finalize(in_path: str, out_path: str, speed: float) -> None:
    """For individual-digit files: silenceremove + atempo + edge fades."""
    parts = [
        f"silenceremove=start_periods=1:start_threshold={SILENCE_THRESHOLD}:detection=peak",
        "areverse",
        f"silenceremove=start_periods=1:start_threshold={SILENCE_THRESHOLD}:detection=peak",
        "areverse",
    ]
    parts += _atempo_chain(speed)
    parts += _fade_chain()
    ffmpeg_run(["-i", in_path, "-af", ",".join(parts), "-b:a", "64k", out_path])


SILENCE_RE = re.compile(r'silence_(start|end):\s*([\d.]+)')


def detect_silence_intervals(path: str, threshold_db: int = -30, min_dur: float = 0.08):
    """Return list of (start, end) silence intervals in seconds."""
    out = ffmpeg_stderr([
        "-i", path,
        "-af", f"silencedetect=noise={threshold_db}dB:d={min_dur}",
        "-f", "null", "-",
    ])
    intervals = []
    cur_start = None
    for m in SILENCE_RE.finditer(out):
        kind, val = m.group(1), float(m.group(2))
        if kind == "start":
            cur_start = val
        elif kind == "end" and cur_start is not None:
            intervals.append((cur_start, val))
            cur_start = None
    return intervals


def load_mono_samples(path: str, sr: int = 22050):
    """Decode an audio file to a mono float32 numpy array."""
    raw = subprocess.run(
        [FFMPEG, "-hide_banner", "-loglevel", "error",
         "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(sr), "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0, sr


def get_duration_s(path: str) -> float:
    samples, sr = load_mono_samples(path)
    return len(samples) / sr


def compute_peak_ms(path: str) -> int:
    """Find the position of the loudest 5 ms RMS window in the clip, in ms."""
    samples, sr = load_mono_samples(path)
    if len(samples) == 0:
        return 0
    win = max(1, int(sr * 0.005))
    peak_idx = 0
    peak_rms = 0.0
    for i in range(0, len(samples) - win, win):
        rms = float(np.sqrt(np.mean(samples[i:i + win] ** 2)))
        if rms > peak_rms:
            peak_rms = rms
            peak_idx = i
    return int(peak_idx / sr * 1000)


def split_sentence(in_path: str, out_dir: str, names: list[str], speed: float,
                   threshold_db: int = -30, min_dur: float = 0.08, pad_s: float = 0.015):
    """Split a multi-word utterance into per-word clips by silence detection.
    Each segment goes through atempo + edge fades just like the digit files."""
    silences = detect_silence_intervals(in_path, threshold_db, min_dur)
    duration = get_duration_s(in_path)
    spans = []
    prev = 0.0
    for s, e in silences:
        if s > prev + 0.01:
            spans.append((prev, s))
        prev = e
    if prev < duration - 0.01:
        spans.append((prev, duration))
    spans = [(s, e) for s, e in spans if e - s > 0.05]

    if len(spans) != len(names):
        print(
            f"  WARN: split detected {len(spans)} word(s), expected {len(names)}: "
            + ", ".join(f"{s:.2f}-{e:.2f}" for s, e in spans),
            file=sys.stderr,
        )

    out_paths = []
    for i, name in enumerate(names):
        if i >= len(spans):
            break
        s, e = spans[i]
        s = max(0.0, s - pad_s)
        e = min(duration, e + pad_s)
        out_path = os.path.join(out_dir, f"{name}.mp3")
        parts = [f"atrim=start={s:.4f}:end={e:.4f}", "asetpts=PTS-STARTPTS"]
        parts += _atempo_chain(speed)
        parts += _fade_chain()
        ffmpeg_run(["-i", in_path, "-af", ",".join(parts), "-b:a", "64k", out_path])
        out_paths.append((name, out_path))
    return out_paths


async def process_voice(voice: str, speed: float, count_max: int) -> None:
    initial_dir = os.path.join(INITIAL_DIR, voice)
    final_dir = os.path.join(FINAL_DIR, voice)
    os.makedirs(initial_dir, exist_ok=True)
    os.makedirs(final_dir, exist_ok=True)

    print(f"\n=== {voice} ===")
    offsets: dict[str, int] = {}

    # 1. Individual digits
    for n in range(1, count_max + 1):
        word = num_to_words(n)
        ini = os.path.join(initial_dir, f"count-{n}.mp3")
        fin = os.path.join(final_dir, f"count-{n}.mp3")
        await tts(word, voice, ini)
        trim_finalize(ini, fin, speed)
        offsets[f"count-{n}"] = compute_peak_ms(fin)
    print(f"  + {count_max} individual digits")

    # 2. Sequence "one two three ... eight"
    seq_ini = os.path.join(initial_dir, "seq.mp3")
    await tts(SEQ_TEXT, voice, seq_ini)
    seq_results = split_sentence(seq_ini, final_dir, SEQ_NAMES, speed)
    for name, path in seq_results:
        offsets[name] = compute_peak_ms(path)
    print(f"  + sequence split into {len(seq_results)} words")

    # 3. Subdivision "one ee and ah"
    sub_ini = os.path.join(initial_dir, "sub.mp3")
    await tts(SUB_TEXT, voice, sub_ini)
    sub_results = split_sentence(sub_ini, final_dir, SUB_NAMES, speed)
    for name, path in sub_results:
        offsets[name] = compute_peak_ms(path)
    print(f"  + subdivision split into {len(sub_results)} syllables")

    with open(os.path.join(final_dir, "offsets.json"), "w") as f:
        json.dump(offsets, f, indent=2, sort_keys=True)


async def amain(args) -> int:
    if not FFMPEG:
        print("error: ffmpeg not found (brew install ffmpeg)", file=sys.stderr)
        return 1
    voices = args.voices or DEFAULT_VOICES
    os.makedirs(FINAL_DIR, exist_ok=True)
    os.makedirs(INITIAL_DIR, exist_ok=True)
    for voice in voices:
        await process_voice(voice, args.speed, args.max)

    # Top-level index for the UI to discover available voices.
    with open(os.path.join(FINAL_DIR, "index.json"), "w") as f:
        json.dump({"voices": voices}, f, indent=2)

    print(f"\nDone. {len(voices)} voice(s).")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--voice", action="append", dest="voices",
                   help="edge-tts voice (repeatable; default: Clara + Ava)")
    p.add_argument("--max", type=int, default=COUNT_MAX,
                   help="generate digits 1..MAX (default 32)")
    p.add_argument("--speed", type=float, default=DEFAULT_SPEED,
                   help="time-stretch factor, pitch-preserved (default 1.35)")
    args = p.parse_args()
    return asyncio.run(amain(args))


if __name__ == "__main__":
    sys.exit(main())
