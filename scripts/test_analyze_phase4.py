import analyze_phase4 as a


def test_summary_counts_only_tone_taps():
    d = {
        "result": {"outcome": "RETEST", "reliability": {"false_alarms": 1, "catch_trials": 2, "out_of_window": 1, "tone_trials": 3}},
        "ambient_db_re_reference": -7.66,
        "events": [{"t": 1000, "event": "start"}, {"t": 61_400, "event": "done"}],
        "noise_events": [{"round": 1, "ear": "left", "freq": 500}],
        "trials": [
            {"kind": "tone", "responded": True, "response_ms": 1500, "play_latency_ms": 120},
            {"kind": "tone", "responded": True, "response_ms": 2900},
            {"kind": "tone", "responded": False, "response_ms": None},
            {"kind": "catch", "responded": True, "response_ms": 40},  # a catch tap is not a tone tap
        ],
    }
    s = a.summary(d)
    assert s["ambient"] == -7.7 and s["duration_s"] == 60 and s["noise_replays"] == 1
    assert s["catch"] == "1/2" and s["out_of_window"] == "1/3"
    assert s["tap_ms"] == (1500, 2200, 2900)
    assert s["latency_ms"] == (120, 120, 120)  # trials without the field (older sessions) are skipped
    assert s["tap_from_start_ms"] == (1380, 1380, 1380)
    assert s["late_start_replays"] == 0
    assert s["over_limit"] == "0/1"


def test_summary_playback_start_origin():
    # Phase 6 sessions: response_ms already runs from playback start; the export says so
    d = {
        "timing_origin": "playback_start",
        "result": {"outcome": "PASS", "reliability": {"false_alarms": 0, "catch_trials": 1, "out_of_window": 0, "tone_trials": 2}},
        "ambient_db_re_reference": 0.0,
        "events": [{"t": 0, "event": "start"}, {"t": 500, "event": "discarded tone (late start +1500ms)"},
                   {"t": 900, "event": "discarded catch (no playback report)"}, {"t": 10_000, "event": "done PASS"}],
        "noise_events": [],
        "trials": [
            {"kind": "tone", "responded": True, "response_ms": 800, "play_latency_ms": 200},
            {"kind": "tone", "responded": True, "response_ms": 1000, "play_latency_ms": 400},
            {"kind": "catch", "responded": False, "response_ms": None, "play_latency_ms": 300},
        ],
    }
    s = a.summary(d)
    assert s["tap_from_start_ms"] == (800, 900, 1000)
    assert s["tap_ms"] == (1000, 1200, 1400)  # from the play() call = from start + latency
    assert s["latency_ms"] == (200, 300, 400)  # catch clips count too
    assert s["late_start_replays"] == 2
    assert s["over_limit"] == "0/3"
