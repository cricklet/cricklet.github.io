#!/usr/bin/env python3
"""Generate count-1.mp3 .. count-N.mp3 via edge-tts (Microsoft's neural TTS,
free, no API key). Each clip is trimmed of leading + trailing silence with
ffmpeg, time-stretched with atempo (pitch-preserved), and faded at each edge
so playback lands precisely on the beat with no click.

Setup (once, from sites/):
  brew install ffmpeg                    # if not already installed
  python3 -m venv .venv                  # create local venv
  source .venv/bin/activate              # activate it
  pip install edge-tts                   # install into venv

Subsequent runs:
  source .venv/bin/activate
  python3 gen-counts.py                  # default: en-IE-EmilyNeural, 32 files
  deactivate

Options:
  python3 gen-counts.py --max 12                       # only 1..12
  python3 gen-counts.py --voice en-US-AriaNeural       # US female (smooth)
  python3 gen-counts.py --voice en-US-GuyNeural        # US male
  python3 gen-counts.py --voice en-GB-SoniaNeural      # UK female
  python3 gen-counts.py --voice en-IE-ConnorNeural     # Irish male
  python3 gen-counts.py --speed 1.5                    # faster diction (default 1.35)
  python3 gen-counts.py --digits                       # send '4' to TTS instead of 'four'
  python3 gen-counts.py --list-voices                  # print every available voice
  python3 gen-counts.py --list-voices | grep -i en-    # filter to English
"""
import argparse
import asyncio
import os
import shutil
import subprocess
import sys
import tempfile

import edge_tts

OUT_DIR = "counts"
SILENCE_THRESHOLD = "-30dB"
FADE_S = 0.005   # 5 ms fade at each edge to prevent clicks from trim cuts

_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
_TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
          "sixteen", "seventeen", "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]


def num_to_words(n: int) -> str:
    """1..99 → English words. Some TTS voices (e.g. en-IE-EmilyNeural) mangle
    bare digits like '4' but say the spelled-out word cleanly. n > 99 falls
    back to digit form."""
    if n < 0 or n > 99:
        return str(n)
    if n < 10:
        return _ONES[n]
    if n < 20:
        return _TEENS[n - 10]
    tens, ones = divmod(n, 10)
    return _TENS[tens] if ones == 0 else f"{_TENS[tens]}-{_ONES[ones]}"


def trim(in_path: str, out_path: str, speed: float) -> None:
    """Trim silence at both ends (silenceremove + areverse trick), time-stretch
    pitch-preserved (atempo), then short fades on each edge so the trim cuts
    don't click. detection=peak handles sharp consonants better than RMS."""
    parts = [
        f"silenceremove=start_periods=1:start_threshold={SILENCE_THRESHOLD}:detection=peak",
        "areverse",
        f"silenceremove=start_periods=1:start_threshold={SILENCE_THRESHOLD}:detection=peak",
        "areverse",
    ]
    # atempo accepts 0.5..100.0 per stage; chain for ratios outside [0.5, 2.0].
    remaining = speed
    while remaining > 2.0:
        parts.append("atempo=2.0")
        remaining /= 2.0
    while remaining < 0.5:
        parts.append("atempo=0.5")
        remaining /= 0.5
    if abs(remaining - 1.0) > 1e-3:
        parts.append(f"atempo={remaining:.4f}")
    # Fade-in on the head; areverse + fade-in + areverse = fade-out on the
    # tail, without needing the (post-stretch) clip duration.
    parts += [
        f"afade=t=in:st=0:d={FADE_S}",
        "areverse",
        f"afade=t=in:st=0:d={FADE_S}",
        "areverse",
    ]
    flt = ",".join(parts)
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-i", in_path, "-af", flt, "-b:a", "64k", out_path],
        check=True,
    )


async def synthesize(text: str, voice: str, out_path: str) -> None:
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_path)


async def list_voices_async() -> None:
    voices = await edge_tts.list_voices()
    voices.sort(key=lambda v: (v.get("Locale", ""), v.get("ShortName", "")))
    for v in voices:
        print(f"  {v.get('ShortName', '?'):32s} {v.get('Locale', '?'):8s} {v.get('Gender', '?')}")


async def amain(args) -> int:
    if args.list_voices:
        await list_voices_async()
        return 0

    if not shutil.which("ffmpeg"):
        print("error: ffmpeg not found (brew install ffmpeg)", file=sys.stderr)
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)

    for n in range(1, args.max + 1):
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            raw_path = f.name
        try:
            text = str(n) if args.digits else num_to_words(n)
            await synthesize(text, args.voice, raw_path)
            out_path = os.path.join(OUT_DIR, f"count-{n}.mp3")
            trim(raw_path, out_path, args.speed)
            print(f"  -> {out_path}  ({text!r})")
        finally:
            os.unlink(raw_path)

    print(f"\nDone. {args.max} files in {OUT_DIR}/ (voice={args.voice}, speed={args.speed}x, text={'digits' if args.digits else 'words'})")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--max", type=int, default=32, help="generate count-1..count-MAX (default 32)")
    parser.add_argument("--voice", default="en-IE-EmilyNeural", help="edge-tts voice (default en-IE-EmilyNeural)")
    parser.add_argument("--speed", type=float, default=1.35, help="pitch-preserved time-stretch factor (default 1.35; 1.0 = no stretch)")
    parser.add_argument("--list-voices", action="store_true", help="list all available edge-tts voices and exit")
    parser.add_argument("--digits", action="store_true", help="send '4' etc. to TTS instead of the spelled-out word (default: spell out)")
    args = parser.parse_args()
    if args.speed <= 0:
        print("error: --speed must be > 0", file=sys.stderr)
        return 1
    return asyncio.run(amain(args))


if __name__ == "__main__":
    sys.exit(main())
