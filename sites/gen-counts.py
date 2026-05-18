#!/usr/bin/env python3
"""Generate count-1.mp3 .. count-N.mp3 via gTTS (Google Translate TTS).
Each clip is trimmed of leading + trailing silence with ffmpeg so playback
lands precisely on the beat.

Setup (once, from sites/):
  brew install ffmpeg                    # if not already installed
  python3 -m venv .venv                  # create local venv
  source .venv/bin/activate              # activate it
  pip install gtts                       # install into venv (no global pollution)

Subsequent runs:
  source .venv/bin/activate
  python3 gen-counts.py                  # default: 32 files, US English
  deactivate                             # when done

Options:
  python3 gen-counts.py --max 12         # only 1..12
  python3 gen-counts.py --tld co.uk      # UK accent (com.au, ca, ie, ...)
  python3 gen-counts.py --lang fr --tld fr  # French numbers
  python3 gen-counts.py --slow           # slower diction
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

from gtts import gTTS

OUT_DIR = "counts"
SILENCE_THRESHOLD = "-40dB"


def trim(in_path: str, out_path: str) -> None:
    """Trim silence from both ends using ffmpeg's silenceremove +
    areverse trick. detection=peak handles sharp consonants ("two", "three")
    better than RMS-based detection."""
    flt = (
        f"silenceremove=start_periods=1:start_threshold={SILENCE_THRESHOLD}:detection=peak,"
        f"areverse,"
        f"silenceremove=start_periods=1:start_threshold={SILENCE_THRESHOLD}:detection=peak,"
        f"areverse"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-i", in_path, "-af", flt, "-b:a", "64k", out_path],
        check=True,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--max", type=int, default=32, help="generate count-1..count-MAX (default 32)")
    parser.add_argument("--lang", default="en", help="language code (default en)")
    parser.add_argument("--tld", default="com", help="Google TLD for accent: com, co.uk, com.au, ca, ie (default com)")
    parser.add_argument("--slow", action="store_true", help="slower speech")
    args = parser.parse_args()

    if not shutil.which("ffmpeg"):
        print("error: ffmpeg not found (brew install ffmpeg)", file=sys.stderr)
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)

    for n in range(1, args.max + 1):
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            raw_path = f.name
        try:
            tts = gTTS(text=str(n), lang=args.lang, tld=args.tld, slow=args.slow)
            tts.save(raw_path)
            out_path = os.path.join(OUT_DIR, f"count-{n}.mp3")
            trim(raw_path, out_path)
            print(f"  -> {out_path}")
        finally:
            os.unlink(raw_path)

    print(f"\nDone. {args.max} files in {OUT_DIR}/ (lang={args.lang}, tld={args.tld})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
