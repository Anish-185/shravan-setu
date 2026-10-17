"""Screening rule engine: Python reference implementation.

Pure functions, no I/O. Every threshold comes from config/screening.json (passed in as `cfg`).
The JS port in screener/src/rules/ must give identical output for every fixture in shared/fixtures/.
These are screening and triage rules, never a diagnosis.

Input shapes
  trial:       {"round": 1|2, "kind": "tone"|"catch", "ear": "left"|"right", "freq": int,
                "responded": bool, "response_ms": number|None}      (catch trials need no ear/freq)
  noise_event: {"round": 1|2, "ear": ..., "freq": ...}             one tone presentation discarded for noise
  sample:      {"t": ms, "db": number|None}                          one mic metering reading (relative, uncalibrated)
"""
import statistics

POINT_TEXT = {
    "not_heard_confirmed": "{ear} ear {freq} Hz: not heard, confirmed on rescreen.",
    "not_heard": "{ear} ear {freq} Hz: not heard.",
    "heard_on_rescreen": "{ear} ear {freq} Hz: missed at first, heard on rescreen.",
    "noisy": "{ear} ear {freq} Hz: too noisy to test ({n} tones discarded for noise).",
    "not_tested": "{ear} ear {freq} Hz: not tested.",
    "rescreen_missing": "{ear} ear {freq} Hz: missed in the first round and not rescreened yet.",
}


def v(cfg, *path):
    node = cfg
    for key in path:
        node = node[key]
    return node["value"]


def _in_window(trial, cfg):
    ms = trial.get("response_ms")
    return (
        ms is not None
        and v(cfg, "response", "min_response_ms") <= ms <= v(cfg, "response", "response_window_ms")
    )


def reliability_score(trials, cfg):
    """Catch-trial false alarms and tone responses outside the response window.

    score = 1 - (false alarms + out-of-window responses) / (catch trials + tone trials); 1.0 when there are no trials.
    """
    catch = [t for t in trials if t["kind"] == "catch"]
    tones = [t for t in trials if t["kind"] == "tone"]
    false_alarms = sum(1 for t in catch if t["responded"])
    out_of_window = sum(1 for t in tones if t["responded"] and not _in_window(t, cfg))
    total = len(catch) + len(tones)
    return {
        "score": 1.0 if total == 0 else 1 - (false_alarms + out_of_window) / total,
        "catch_trials": len(catch),
        "false_alarms": false_alarms,
        "tone_trials": len(tones),
        "out_of_window": out_of_window,
    }


def _point_status(trials, noise_events, rnd, ear, freq, cfg):
    tones = [t for t in trials if t["kind"] == "tone" and t["round"] == rnd and t["ear"] == ear and t["freq"] == freq]
    if not tones:
        noisy = sum(1 for n in noise_events if n["round"] == rnd and n["ear"] == ear and n["freq"] == freq)
        return ("noisy", noisy) if noisy else ("not_tested", 0)
    hits = sum(1 for t in tones if t["responded"] and _in_window(t, cfg))
    return ("heard", 0) if hits >= v(cfg, "min_hits_per_point") else ("not_heard", 0)


def _points(trials, cfg):
    """Configured ears x frequencies, plus any extra frequency that was actually tested (e.g. 500 Hz)."""
    freqs = set(v(cfg, "frequencies_hz")) | {t["freq"] for t in trials if t["kind"] == "tone"}
    return [(ear, f) for ear in v(cfg, "ears") for f in sorted(freqs)]


def _rescreen_on(cfg):
    return v(cfg, "rescreen", "enabled") and v(cfg, "rescreen", "max_rounds") >= 1


def rescreen_plan(trials, noise_events, cfg):
    """Points to retest right away: those not heard in round 1. Empty if rescreen is off."""
    if not _rescreen_on(cfg):
        return []
    return [
        [ear, freq] for ear, freq in _points(trials, cfg)
        if _point_status(trials, noise_events, 1, ear, freq, cfg)[0] == "not_heard"
    ]


def _valid_db(samples, mic_start_ms, device_changes_ms, cfg):
    """Metering values that can be trusted: not missing or at the floor (-160 = no data, never 'quiet'), not in the
    mic start-up settle time, not within plug_guard_ms of an earphone connect/disconnect."""
    settle, guard = v(cfg, "noise", "mic_settle_ms"), v(cfg, "noise", "plug_guard_ms")
    floor = v(cfg, "noise", "invalid_at_or_below_db")
    return [
        s["db"] for s in samples
        if s["db"] is not None and s["db"] > floor and s["t"] - mic_start_ms >= settle
        and all(abs(s["t"] - d) >= guard for d in device_changes_ms)
    ]


def noise_verdict(samples, mic_start_ms, device_changes_ms, cfg):
    """During-tone noise gate for one presentation: ok | noisy (discard and replay) | unknown (too few valid
    samples to tell, also replayed). Gate = reference quiet level + gate_db_above_baseline; saturation is noisy."""
    db = _valid_db(samples, mic_start_ms, device_changes_ms, cfg)
    peak = max(db) if db else None
    if len(db) < v(cfg, "noise", "min_valid_samples_per_tone"):
        verdict = "unknown"
    elif (peak >= v(cfg, "noise", "saturated_at_or_above_db")
          or peak > v(cfg, "noise", "reference_quiet_db") + v(cfg, "noise", "gate_db_above_baseline")):
        verdict = "noisy"
    else:
        verdict = "ok"
    return {"verdict": verdict, "valid": len(db), "max_db": peak}


def ambient_level(samples, mic_start_ms, device_changes_ms, cfg):
    """Pre-test room noise: median valid metering minus the reference quiet level (input to apply_500hz_policy).
    None if there are too few valid samples."""
    db = _valid_db(samples, mic_start_ms, device_changes_ms, cfg)
    if len(db) < v(cfg, "noise", "min_valid_samples_per_tone"):
        return {"db_re_reference": None, "valid": len(db)}
    return {"db_re_reference": statistics.median(db) - v(cfg, "noise", "reference_quiet_db"), "valid": len(db)}


def apply_500hz_policy(ambient_db_re_baseline, cfg):
    mode = v(cfg, "policy_500hz", "mode")
    if mode == "always":
        return {"include": True, "reason": "500 Hz policy: always tested."}
    if mode == "never":
        return {"include": False, "reason": "500 Hz policy: never tested."}
    if mode != "only_if_ambient_below":
        raise ValueError(f"unknown policy_500hz mode {mode!r}")
    if ambient_db_re_baseline is None:
        return {"include": False, "reason": "500 Hz skipped: no room noise measurement."}
    if ambient_db_re_baseline < v(cfg, "policy_500hz", "ambient_threshold_db_re_baseline"):
        return {"include": True, "reason": "500 Hz tested: room noise below the limit."}
    return {"include": False, "reason": "500 Hz skipped: room too noisy for low tones."}


def decide_outcome(trials, noise_events, cfg):
    """PASS / RETEST / REFER with reasons. Unreliable responses give RETEST, never REFER."""
    ears = v(cfg, "ears")
    rel = reliability_score(trials, cfg)
    result = {"outcome": None, "ear_outcomes": {}, "point_status": {}, "reliability": rel, "reasons": []}

    def everything(outcome, reasons):
        result.update(outcome=outcome, ear_outcomes={e: outcome for e in ears}, reasons=reasons)
        return result

    min_catch = v(cfg, "reliability", "min_catch_trials")
    if rel["catch_trials"] < min_catch:
        return everything("RETEST", [
            f"Retest: only {rel['catch_trials']} silent check trials were done ({min_catch} needed)."])

    fa_bad = rel["false_alarms"] > v(cfg, "reliability", "max_false_alarm_rate") * rel["catch_trials"]
    oow_bad = rel["out_of_window"] > v(cfg, "reliability", "max_out_of_window_rate") * rel["tone_trials"]
    if fa_bad or oow_bad:
        reasons = ["Retest: responses were not reliable, so this test cannot refer."]
        if fa_bad:
            reasons.append(f"{rel['false_alarms']} of {rel['catch_trials']} silent check trials got a tap.")
        if oow_bad:
            reasons.append(f"{rel['out_of_window']} of {rel['tone_trials']} tone trials got a tap outside the response window.")
        return everything("RETEST", reasons)

    ear_flags = {e: set() for e in ears}
    for ear, freq in _points(trials, cfg):
        status, n = _point_status(trials, noise_events, 1, ear, freq, cfg)
        if status == "not_heard" and _rescreen_on(cfg):
            status2, n = _point_status(trials, noise_events, 2, ear, freq, cfg)
            status = {"heard": "heard_on_rescreen", "not_heard": "not_heard_confirmed",
                      "not_tested": "rescreen_missing"}.get(status2, status2)
        result["point_status"][f"{ear}-{freq}"] = status
        if status != "heard":
            result["reasons"].append(POINT_TEXT[status].format(ear=ear.capitalize(), freq=freq, n=n))
        ear_flags[ear].add(status)

    for ear, flags in ear_flags.items():
        if flags & {"not_heard", "not_heard_confirmed"}:
            result["ear_outcomes"][ear] = "REFER"
        elif flags & {"noisy", "not_tested", "rescreen_missing"}:
            result["ear_outcomes"][ear] = "RETEST"
        else:
            result["ear_outcomes"][ear] = "PASS"

    outcomes = set(result["ear_outcomes"].values())
    result["outcome"] = "REFER" if "REFER" in outcomes else "RETEST" if "RETEST" in outcomes else "PASS"
    if result["outcome"] == "PASS" and not result["reasons"]:
        result["reasons"].append("All tones were heard in both ears.")
    return result


def triage_route(answers, cfg):
    """Yes/no checklist -> PHC or DEIC with the rule that fired. Triage, not diagnosis."""
    for rule in v(cfg, "triage", "rules"):
        if any(answers.get(q) is True for q in rule["if_any_yes"]):
            return {"route": rule["route"], "rule": rule["id"], "reason": rule["reason"]}
    return {"route": v(cfg, "triage", "default_route"), "rule": "default", "reason": v(cfg, "triage", "default_reason")}
