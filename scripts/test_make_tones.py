import array
import wave

import make_tones as mt


def read(path):
    with wave.open(str(path)) as w:
        data = array.array("h", w.readframes(w.getnframes()))
        return w.getframerate(), w.getnchannels(), data[0::2], data[1::2]


def test_tones_have_ramps_correct_channel_and_level(tmp_path):
    mt.main(tmp_path)
    rate = mt.v("tone", "sample_rate_hz")
    ramp = round(rate * mt.v("tone", "ramp_ms") / 1000)
    peak = 32767 * 10 ** (mt.v("tone", "peak_dbfs") / 20)
    files = sorted(tmp_path.glob("*.wav"))
    assert len(files) == 2 * len({500, *mt.v("frequencies_hz")})
    for f in files:
        r, ch, left, right = read(f)
        on, off = (left, right) if "_left" in f.name else (right, left)
        assert (r, ch) == (rate, 2)
        assert len(on) == round(rate * mt.v("tone", "duration_ms") / 1000)
        assert not any(off), f"{f.name}: other ear must be silent"
        assert max(abs(s) for s in on) <= peak + 1
        assert max(abs(s) for s in on) > 0.95 * peak
        # No click: first and last samples are ~0 and the envelope grows through the ramp.
        assert abs(on[0]) <= 1 and abs(on[-1]) <= 1
        cycle = max(1, round(rate / 500))
        windows = [max(abs(s) for s in on[i:i + cycle]) for i in range(0, ramp - cycle, cycle)]
        assert windows == sorted(windows) and windows[0] < 0.1 * peak
