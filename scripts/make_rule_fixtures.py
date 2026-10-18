"""Write shared/fixtures/*.json: test vectors for the Python AND JS rule engines.

Inputs are built with small helpers (trial lists are long). Every `expected` value is written by hand here,
never computed by the rule engine, so the fixtures are an independent check, not a snapshot.

    python scripts/make_rule_fixtures.py
"""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "shared" / "fixtures"
FREQS = (1000, 2000, 4000)
EARS = ("left", "right")


def tone(rnd, ear, freq, responded=True, ms=600):
    return {"round": rnd, "kind": "tone", "ear": ear, "freq": freq, "responded": responded,
            "response_ms": ms if responded else None}


def catch(responded=False, ms=900):
    return {"round": 1, "kind": "catch", "responded": responded, "response_ms": ms if responded else None}


def noise(rnd, ear, freq, n):
    return [{"round": rnd, "ear": ear, "freq": freq}] * n


def session(miss1=(), miss2=(), rescreen=(), n_catch=4, fa=0, freqs=FREQS, skip=(), noisy1=(), noisy2=(), resp_ms=None):
    """Round 1: two presentations per point; heard unless the point is in miss1. Points in `skip` or `noisy1`
    have no valid round-1 trials. Round 2: two presentations for each point in `rescreen` (missed if in miss2;
    no valid trials if in noisy2). `resp_ms` maps (ear, freq) -> response time of the 2nd presentation."""
    trials = []
    for ear in EARS:
        for f in freqs:
            p = (ear, f)
            if p in skip or p in noisy1:
                continue
            heard = p not in miss1
            trials.append(tone(1, ear, f, heard))
            trials.append(tone(1, ear, f, heard, ms=(resp_ms or {}).get(p, 600)))
    for p in rescreen:
        if p in noisy2:
            continue
        trials += [tone(2, *p, p not in miss2)] * 2
    trials += [catch(responded=i < fa) for i in range(n_catch)]
    return trials


def ps(default="heard", freqs=FREQS, **overrides):
    """Expected point_status: every point `default` unless overridden, e.g. left_4000="not_heard_confirmed"."""
    out = {f"{ear}-{f}": default for ear in EARS for f in sorted(freqs)}
    for k, val in overrides.items():
        ear, f = k.split("_")
        out[f"{ear}-{f}"] = val
    return out


def rel(score, catch_trials=4, false_alarms=0, tone_trials=12, out_of_window=0):
    return {"score": score, "catch_trials": catch_trials, "false_alarms": false_alarms,
            "tone_trials": tone_trials, "out_of_window": out_of_window}


ALL_HEARD = "All tones were heard in both ears."
UNRELIABLE = "Retest: responses were not reliable, so this test cannot refer."
L, R = "left", "right"


def decide(name, trials, expected, noise_events=(), overrides=None):
    case = {"name": name, "input": {"trials": trials, "noise_events": list(noise_events)}, "expected": expected}
    if overrides:
        case["config_overrides"] = overrides
    return case


def out(outcome, ears, points, reliability, reasons):
    return {"outcome": outcome, "ear_outcomes": {L: ears[0], R: ears[1]}, "point_status": points,
            "reliability": reliability, "reasons": reasons}


DECIDE = [
    decide("all heard -> PASS", session(),
           out("PASS", ("PASS", "PASS"), ps(), rel(1.0), [ALL_HEARD])),
    decide("single point missed, fixed by rescreen -> PASS",
           session(miss1={(L, 4000)}, rescreen=[(L, 4000)]),
           out("PASS", ("PASS", "PASS"), ps(left_4000="heard_on_rescreen"), rel(1.0, tone_trials=14),
               ["Left ear 4000 Hz: missed at first, heard on rescreen."])),
    decide("persistent fail after rescreen -> REFER",
           session(miss1={(R, 2000)}, miss2={(R, 2000)}, rescreen=[(R, 2000)]),
           out("REFER", ("PASS", "REFER"), ps(right_2000="not_heard_confirmed"), rel(1.0, tone_trials=14),
               ["Right ear 2000 Hz: not heard, confirmed on rescreen."])),
    decide("fails in both ears -> REFER both",
           session(miss1={(L, 1000), (R, 4000)}, miss2={(L, 1000), (R, 4000)}, rescreen=[(L, 1000), (R, 4000)]),
           out("REFER", ("REFER", "REFER"), ps(left_1000="not_heard_confirmed", right_4000="not_heard_confirmed"),
               rel(1.0, tone_trials=16),
               ["Left ear 1000 Hz: not heard, confirmed on rescreen.",
                "Right ear 4000 Hz: not heard, confirmed on rescreen."])),
    decide("random tapper: 3 of 4 catch trials tapped -> RETEST", session(fa=3),
           out("RETEST", ("RETEST", "RETEST"), {}, rel(0.8125, false_alarms=3),
               [UNRELIABLE, "3 of 4 silent check trials got a tap."])),
    decide("false alarms exactly at the limit (1 of 4) -> still PASS", session(fa=1),
           out("PASS", ("PASS", "PASS"), ps(), rel(0.9375, false_alarms=1), [ALL_HEARD])),
    decide("false alarms just over the limit (2 of 4) -> RETEST", session(fa=2),
           out("RETEST", ("RETEST", "RETEST"), {}, rel(0.875, false_alarms=2),
               [UNRELIABLE, "2 of 4 silent check trials got a tap."])),
    decide("only 2 catch trials -> RETEST", session(n_catch=2),
           out("RETEST", ("RETEST", "RETEST"), {}, rel(1.0, catch_trials=2),
               ["Retest: only 2 silent check trials were done (3 needed)."])),
    decide("no catch trials at all -> RETEST", session(n_catch=0),
           out("RETEST", ("RETEST", "RETEST"), {}, rel(1.0, catch_trials=0),
               ["Retest: only 0 silent check trials were done (3 needed)."])),
    decide("late taps on 4 of 12 tone trials -> RETEST",
           session(resp_ms={(L, 1000): 3000, (L, 2000): 3000, (R, 1000): 3000, (R, 4000): 3000}),
           out("RETEST", ("RETEST", "RETEST"), {}, rel(0.75, out_of_window=4),
               [UNRELIABLE, "4 of 12 tone trials got a tap outside the response window."])),
    decide("anticipation taps on 3 of 12 (at the limit) -> PASS, other presentation heard",
           session(resp_ms={(L, 1000): 100, (R, 2000): 100, (R, 4000): 100}),
           out("PASS", ("PASS", "PASS"), ps(), rel(0.8125, out_of_window=3), [ALL_HEARD])),
    decide("unreliable beats a confirmed fail: RETEST, never REFER",
           session(miss1={(R, 4000)}, miss2={(R, 4000)}, rescreen=[(R, 4000)], fa=3),
           out("RETEST", ("RETEST", "RETEST"), {}, rel(0.8333333333333334, false_alarms=3, tone_trials=14),
               [UNRELIABLE, "3 of 4 silent check trials got a tap."])),
    decide("noise replay limit hit at one point -> RETEST that ear",
           session(noisy1={(L, 2000)}),
           out("RETEST", ("RETEST", "PASS"), ps(left_2000="noisy"), rel(1.0, tone_trials=10),
               ["Left ear 2000 Hz: too noisy to test (3 tones discarded for noise)."]),
           noise_events=noise(1, L, 2000, 3)),
    decide("two noise replays then heard -> PASS", session(),
           out("PASS", ("PASS", "PASS"), ps(), rel(1.0), [ALL_HEARD]),
           noise_events=noise(1, L, 2000, 2)),
    decide("confirmed fail in one ear, noisy point in the other -> REFER",
           session(miss1={(R, 1000)}, miss2={(R, 1000)}, rescreen=[(R, 1000)], noisy1={(L, 4000)}),
           out("REFER", ("RETEST", "REFER"), ps(left_4000="noisy", right_1000="not_heard_confirmed"),
               rel(1.0, tone_trials=12),
               ["Left ear 4000 Hz: too noisy to test (3 tones discarded for noise).",
                "Right ear 1000 Hz: not heard, confirmed on rescreen."]),
           noise_events=noise(1, L, 4000, 3)),
    decide("missed in round 1, rescreen not done -> RETEST",
           session(miss1={(L, 1000)}),
           out("RETEST", ("RETEST", "PASS"), ps(left_1000="rescreen_missing"), rel(1.0),
               ["Left ear 1000 Hz: missed in the first round and not rescreened yet."])),
    decide("rescreen disabled: a round-1 miss -> REFER",
           session(miss1={(L, 1000)}),
           out("REFER", ("REFER", "PASS"), ps(left_1000="not_heard"), rel(1.0), ["Left ear 1000 Hz: not heard."]),
           overrides={"rescreen.enabled": False}),
    decide("point never presented -> RETEST",
           session(skip={(R, 4000)}),
           out("RETEST", ("PASS", "RETEST"), ps(right_4000="not_tested"), rel(1.0, tone_trials=10),
               ["Right ear 4000 Hz: not tested."])),
    decide("500 Hz included and heard -> PASS", session(freqs=(500,) + FREQS),
           out("PASS", ("PASS", "PASS"), ps(freqs=(500,) + FREQS), rel(1.0, tone_trials=16), [ALL_HEARD])),
    decide("500 Hz included, confirmed fail -> REFER",
           session(freqs=(500,) + FREQS, miss1={(L, 500)}, miss2={(L, 500)}, rescreen=[(L, 500)]),
           out("REFER", ("REFER", "PASS"), ps(freqs=(500,) + FREQS, left_500="not_heard_confirmed"),
               rel(1.0, tone_trials=18), ["Left ear 500 Hz: not heard, confirmed on rescreen."])),
    decide("missed, then too noisy on rescreen -> RETEST",
           session(miss1={(L, 4000)}, rescreen=[(L, 4000)], noisy2={(L, 4000)}),
           out("RETEST", ("RETEST", "PASS"), ps(left_4000="noisy"), rel(1.0),
               ["Left ear 4000 Hz: too noisy to test (3 tones discarded for noise)."]),
           noise_events=noise(2, L, 4000, 3)),
    decide("min_hits_per_point=2, one of two heard, no rescreen -> REFER",
           [t if not (t.get("ear") == L and t["freq"] == 1000 and i % 2) else tone(1, L, 1000, False)
            for i, t in enumerate(session())],
           out("REFER", ("REFER", "PASS"), ps(left_1000="not_heard"), rel(1.0), ["Left ear 1000 Hz: not heard."]),
           overrides={"min_hits_per_point": 2, "rescreen.enabled": False}),
    decide("one of two presentations heard (default min 1) -> PASS",
           [t if not (t.get("ear") == R and t["freq"] == 2000 and i % 2) else tone(1, R, 2000, False)
            for i, t in enumerate(session())],
           out("PASS", ("PASS", "PASS"), ps(), rel(1.0), [ALL_HEARD])),
]

RESCREEN = [
    {"name": "nothing missed -> empty plan", "input": {"trials": session(), "noise_events": []}, "expected": []},
    {"name": "one miss -> that point only",
     "input": {"trials": session(miss1={(L, 4000)}), "noise_events": []}, "expected": [[L, 4000]]},
    {"name": "several misses incl. 500 Hz, ordered by ear then frequency; noisy point not rescreened",
     "input": {"trials": session(freqs=(500,) + FREQS, miss1={(R, 1000), (L, 4000), (L, 500)}, noisy1={(R, 2000)}),
               "noise_events": noise(1, R, 2000, 3)},
     "expected": [[L, 500], [L, 4000], [R, 1000]]},
    {"name": "rescreen disabled -> empty plan", "config_overrides": {"rescreen.enabled": False},
     "input": {"trials": session(miss1={(L, 4000)}), "noise_events": []}, "expected": []},
    {"name": "max_rounds 0 -> empty plan", "config_overrides": {"rescreen.max_rounds": 0},
     "input": {"trials": session(miss1={(L, 4000)}), "noise_events": []}, "expected": []},
]


def policy(name, ambient, expected, mode=None):
    case = {"name": name, "input": {"ambient_db_re_baseline": ambient}}
    if mode:
        case["config_overrides"] = {"policy_500hz.mode": mode}
    case.update({"expected_error": True} if expected is None else {"expected": expected})
    return case


POLICY = [
    policy("always", 30, {"include": True, "reason": "500 Hz policy: always tested."}, mode="always"),
    policy("never", 0, {"include": False, "reason": "500 Hz policy: never tested."}, mode="never"),
    policy("quiet room (3 < 6) -> include", 3, {"include": True, "reason": "500 Hz tested: room noise below the limit."}),
    policy("exactly at threshold (6) -> skip", 6, {"include": False, "reason": "500 Hz skipped: room too noisy for low tones."}),
    policy("noisy room (12) -> skip", 12, {"include": False, "reason": "500 Hz skipped: room too noisy for low tones."}),
    policy("no measurement -> skip", None, {"include": False, "reason": "500 Hz skipped: no room noise measurement."}),
    policy("unknown mode -> error", 3, None, mode="sometimes"),
]

PHC = {"route": "PHC", "rule": "likely_treatable_cause",
       "reason": "Likely treatable cause reported (for example wax or infection): PHC first. Triage, not diagnosis."}
DEIC = {"route": "DEIC", "rule": "default",
        "reason": "No likely treatable cause reported: DEIC for further hearing assessment. Triage, not diagnosis."}
TRIAGE = [
    {"name": "ear discharge -> PHC", "input": {"answers": {"ear_discharge": True}}, "expected": PHC},
    {"name": "recent cold only -> PHC", "input": {"answers": {"recent_cold": True, "ear_pain": False}}, "expected": PHC},
    {"name": "pain plus asks for repetition -> PHC", "input": {"answers": {"ear_pain": True, "asks_for_repetition": True}},
     "expected": PHC},
    {"name": "only asks for repetition -> DEIC", "input": {"answers": {"asks_for_repetition": True}}, "expected": DEIC},
    {"name": "all no -> DEIC", "input": {"answers": {q: False for q in
                                                    ("ear_discharge", "ear_pain", "recent_cold", "blocked_feeling",
                                                     "asks_for_repetition")}}, "expected": DEIC},
    {"name": "no answers -> DEIC", "input": {"answers": {}}, "expected": DEIC},
    {"name": "string 'yes' is not a yes (strict booleans) -> DEIC", "input": {"answers": {"ear_discharge": "yes"}},
     "expected": DEIC},
]

RELIABILITY = [
    {"name": "no trials -> score 1", "input": {"trials": []},
     "expected": rel(1.0, catch_trials=0, tone_trials=0)},
    {"name": "1 false alarm + 1 late + 1 missed (a miss is not unreliable)",
     "input": {"trials": [tone(1, L, 1000), tone(1, L, 1000, ms=2600), tone(1, R, 1000, False),
                          catch(True), catch(), catch()]},
     "expected": rel(0.6666666666666667, catch_trials=3, false_alarms=1, tone_trials=3, out_of_window=1)},
    {"name": "window edges are inclusive (150 and 2500 ms count)",
     "input": {"trials": [tone(1, L, 1000, ms=150), tone(1, L, 1000, ms=2500), tone(1, L, 1000, ms=149)]},
     "expected": rel(0.6666666666666667, catch_trials=0, tone_trials=3, out_of_window=1)},
]


# Noise rules. Reference level overridden to -30 so the gate (-20) and medians are exact in binary floating point.
NOISE_CFG = {"noise.reference_quiet_db": -30}


def samples(dbs, t0=2000, step=100):
    return [{"t": t0 + i * step, "db": db} for i, db in enumerate(dbs)]


def nv(name, smp, expected, mic_start=0, changes=(), overrides=None):
    return {"name": name, "config_overrides": {**NOISE_CFG, **(overrides or {})},
            "input": {"samples": smp, "mic_start_ms": mic_start, "device_changes_ms": list(changes)},
            "expected": expected}


NOISE = [
    nv("quiet tone -> ok", samples([-33] * 10), {"verdict": "ok", "valid": 10, "max_db": -33}),
    nv("one loud sample -> noisy", samples([-33] * 9 + [-15]), {"verdict": "noisy", "valid": 10, "max_db": -15}),
    nv("exactly at the gate (-20) -> ok", samples([-33] * 9 + [-20]), {"verdict": "ok", "valid": 10, "max_db": -20}),
    nv("just over the gate (-19.5) -> noisy", samples([-33] * 9 + [-19.5]),
       {"verdict": "noisy", "valid": 10, "max_db": -19.5}),
    nv("saturated (-1.2) is noisy even with a huge gate", samples([-33] * 9 + [-1.2]),
       {"verdict": "noisy", "valid": 10, "max_db": -1.2}, overrides={"noise.gate_db_above_baseline": 50}),
    nv("-160 floor samples are invalid, not quiet -> unknown", samples([-160] * 6 + [-33] * 4),
       {"verdict": "unknown", "valid": 4, "max_db": -33}),
    nv("missing (null) samples are invalid -> unknown", samples([None] * 7 + [-33] * 3),
       {"verdict": "unknown", "valid": 3, "max_db": -33}),
    nv("mic start-up hump inside settle time is ignored -> ok",
       samples([-160, -19, -19, -25, -31] + [-33] * 6, t0=500), {"verdict": "ok", "valid": 6, "max_db": -33}),
    nv("plug click within the guard window is ignored -> ok",
       samples([-33] * 20 + [-1.0] + [-33] * 19, t0=1000), {"verdict": "ok", "valid": 21, "max_db": -33},
       changes=[3000]),
    nv("no samples -> unknown", [], {"verdict": "unknown", "valid": 0, "max_db": None}),
]


def amb(name, smp, expected, mic_start=0, changes=()):
    return {"name": name, "config_overrides": NOISE_CFG,
            "input": {"samples": smp, "mic_start_ms": mic_start, "device_changes_ms": list(changes)},
            "expected": expected}


AMBIENT = [
    amb("odd count: median -32 -> -2 re reference", samples([-33, -31, -32, -30, -34]),
        {"db_re_reference": -2, "valid": 5}),
    amb("even count after dropping the floor: median -25 -> +5", samples([-160, -30, -28, -26, -24, -22, -20]),
        {"db_re_reference": 5, "valid": 6}),
    amb("settle time excluded: only 2 valid (t=1000, 1100) -> no measurement", samples([-33] * 10, t0=200),
        {"db_re_reference": None, "valid": 2}),
    amb("saturated samples count as loud: median -1 -> +29", samples([-1, -1, -1, -15, -20]),
        {"db_re_reference": 29, "valid": 5}),
]


LOST = "closed_lost_to_followup"
# Hand-written from the protocol in referrals/rules (screened -> referred -> camp_scheduled -> seen -> treated -> closed;
# camp_scheduled -> missed -> rescheduled -> camp_scheduled; open statuses -> lost with a reason).
NEXT = [
    {"name": f"from {frm}", "input": {"from_status": frm}, "expected": exp}
    for frm, exp in (
        ("screened", ["referred"]),
        ("referred", ["camp_scheduled", LOST]),
        ("camp_scheduled", [LOST, "missed", "seen"]),
        ("missed", [LOST, "rescheduled"]),
        ("rescheduled", ["camp_scheduled", LOST]),
        ("seen", [LOST, "treated"]),
        ("treated", ["closed"]),
        ("closed", []),
        (LOST, []),
        ("no_such_status", []),
    )
]


def chk(name, frm, to, expected, treatment="", reason=""):
    return {"name": name, "input": {"from_status": frm, "to_status": to, "treatment": treatment, "reason": reason},
            "expected": expected}


OK = {"allowed": True}
CHECK = [
    chk("referred -> camp_scheduled", "referred", "camp_scheduled", OK),
    chk("camp_scheduled -> missed", "camp_scheduled", "missed", OK),
    chk("missed -> rescheduled -> (camp_scheduled ok)", "rescheduled", "camp_scheduled", OK),
    chk("seen -> treated with a treatment", "seen", "treated", OK, treatment="wax_removed"),
    chk("seen -> treated without a treatment", "seen", "treated", {"allowed": False, "why": "needs_treatment"}),
    chk("seen -> treated with an unknown treatment", "seen", "treated", {"allowed": False, "why": "needs_treatment"},
        treatment="magic"),
    chk("lost with a reason", "missed", LOST, OK, reason="moved away"),
    chk("lost with a blank reason", "missed", LOST, {"allowed": False, "why": "needs_reason"}, reason="   "),
    chk("referred -> closed skips the loop", "referred", "closed", {"allowed": False, "why": "illegal"}),
    chk("closed is final", "closed", "referred", {"allowed": False, "why": "illegal"}),
    chk("lost is final", LOST, "referred", {"allowed": False, "why": "illegal"}),
    chk("screened -> lost is not allowed (not referred yet)", "screened", LOST, {"allowed": False, "why": "illegal"},
        reason="x"),
    chk("illegal beats a missing treatment", "referred", "treated", {"allowed": False, "why": "illegal"}),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / "config" / "screening.json", OUT / "fixture_config.json")
    for fn, cases in (("decide_outcome", DECIDE), ("rescreen_plan", RESCREEN), ("apply_500hz_policy", POLICY),
                      ("triage_route", TRIAGE), ("reliability_score", RELIABILITY), ("noise_verdict", NOISE),
                      ("ambient_level", AMBIENT), ("next_statuses", NEXT), ("check_transition", CHECK)):
        path = OUT / f"{fn}.json"
        path.write_text(json.dumps({"function": fn, "cases": cases}, indent=1) + "\n")
        print(f"{path.relative_to(ROOT)}: {len(cases)} cases")


if __name__ == "__main__":
    main()
