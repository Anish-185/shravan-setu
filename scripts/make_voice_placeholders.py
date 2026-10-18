"""Create a silent placeholder .m4a for every voice line that has no recording yet. Never overwrites a file.

    python scripts/make_voice_placeholders.py      (needs ffmpeg on the laptop; not a project dependency)

Voice lines are the entries with a "file" in screener/src/i18n/strings.json. Real recordings by [TELUGU_SPEAKER]
replace these files one for one; then set "recorded": true for that entry so the "voice placeholder" tag goes away.
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STRINGS = ROOT / "screener" / "src" / "i18n" / "strings.json"
OUT = ROOT / "screener" / "assets" / "voice" / "te"


def voice_files():
    return [v["file"] for v in json.loads(STRINGS.read_text()).values() if "file" in v]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name in voice_files():
        path = OUT / name
        if path.exists():
            print(f"kept {path.relative_to(ROOT)}")
            continue
        subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.5",
                        "-c:a", "aac", "-b:a", "32k", str(path)], check=True)
        print(f"made silent placeholder {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
