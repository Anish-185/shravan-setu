"""Generate per-ear pure-tone WAVs with raised-cosine onset/offset ramps (fixes ERR-005: clicks in the original tones).

All parameters come from config/screening.json (tone.*, frequencies_hz, plus 500 Hz for the 500 Hz policy).
Stdlib only. Output: one stereo 16-bit WAV per frequency and ear, the other channel silent, plus silence.wav for catch trials.

    python scripts/make_tones.py [out_dir]      (default: screener/assets/tones/generated)
"""
import array
import json
import math
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "config" / "screening.json").read_text())


def v(*path):
    node = CONFIG
    for key in path:
        node = node[key]
    return node["value"]


def tone_samples(freq, duration_ms, ramp_ms, rate, peak_dbfs):
    n = round(rate * duration_ms / 1000)
    ramp = round(rate * ramp_ms / 1000)
    amp = 32767 * 10 ** (peak_dbfs / 20)
    out = []
    for i in range(n):
        edge = min(i, n - 1 - i)
        gain = 0.5 - 0.5 * math.cos(math.pi * edge / ramp) if edge < ramp else 1.0
        out.append(round(amp * gain * math.sin(2 * math.pi * freq * i / rate)))
    return out


def write_tone(path, samples, ear, rate):
    stereo = array.array("h", [0] * (2 * len(samples)))
    stereo[0 if ear == "left" else 1::2] = array.array("h", samples)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(stereo.tobytes())


def main(out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    rate = v("tone", "sample_rate_hz")
    for freq in sorted({500, *v("frequencies_hz")}):
        samples = tone_samples(freq, v("tone", "duration_ms"), v("tone", "ramp_ms"), rate, v("tone", "peak_dbfs"))
        for ear in v("ears"):
            path = out_dir / f"tone_{freq}Hz_{ear}.wav"
            write_tone(path, samples, ear, rate)
            print(path.relative_to(ROOT) if path.is_relative_to(ROOT) else path)
    # Catch trials play this all-zero clip of the same length through the same player path, so their timing
    # reference (reported playback start) is comparable to a tone's (ERR-026).
    path = out_dir / "silence.wav"
    write_tone(path, [0] * round(rate * v("tone", "duration_ms") / 1000), "left", rate)
    print(path.relative_to(ROOT) if path.is_relative_to(ROOT) else path)


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "screener" / "assets" / "tones" / "generated")
