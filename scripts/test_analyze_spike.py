import analyze_spike as a


def session(t0, label, metering, play=None):
    events = [{"t": t0, "event": "mic start"}]
    if play:
        events.append({"t": t0 + 50, "event": f"tone play {play}"})
    samples = [{"t": t0 + 100 * (i + 1), "metering": m, "tone": play and play[:4], "volume": 0.1, "label": label}
               for i, m in enumerate(metering)]
    events.append({"t": t0 + 100 * (len(metering) + 1), "event": "mic stop"})
    return events, samples


def export(*sessions):
    return {"events": [e for s in sessions for e in s[0]], "samples": [x for s in sessions for x in s[1]]}


def test_redo_floor_settle_saturation_and_label_check():
    quiet = [-160] + [-20] * 9 + [-33] * 20 + [-1.0]
    ex = export(
        session(0, "quiet-on-4kR-0.10", quiet, play="4k L vol=0.10"),  # wrong tone, superseded below
        session(10_000, "quiet-on-4kR-0.10-redo", quiet, play="4k R vol=0.10"),
    )
    cs = a.clips(ex)
    kept, dropped = a.apply_redo(cs)
    assert dropped == ["quiet-on-4kR-0.10"] and [c["label"] for c in kept] == ["quiet-on-4kR-0.10-redo"]
    vals, floor, settle, sat = a.classify(kept[0])
    assert floor == 1  # -160 is invalid, never quiet
    assert settle == 8  # samples at 200..900 ms fall inside the 1000 ms settle window
    assert sat == 1 and len(vals) == 22
    assert a.label_check(cs[0]) and not a.label_check(cs[1])
