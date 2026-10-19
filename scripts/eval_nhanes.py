"""Evaluate our screening RULE LOGIC on NHANES youth audiograms. US survey data, not Indian children; it tests the rule
logic (config/screening.json + server/referrals/rules), not the app's accuracy on a phone. Screening, not diagnosis.

    python scripts/eval_nhanes.py --download     fetch the 8 CDC files into data/raw/nhanes/ and verify SHA-256
    python scripts/eval_nhanes.py                print the results as Markdown (needs the files)

Data: NHANES Audiometry (AUX) + Demographics (DEMO), cycles whose audiometry exam covered school ages (CDC data
documentation, read 2026-10-19): 2005-06 (AUX_D), 2007-08 (AUX_E), 2009-10 (AUX_F): ages 12-19; 2017-18 (AUX_J):
ages 6-19. 2011-12 and 2015-16 tested adults 20-69 only. We keep ages 6-18 (our school screening range).
Thresholds: first air-conduction readings, dB HL, 5 dB steps; 666 = no response (treated as not heard at any
level); 888 / missing at a needed frequency = child excluded (counted). Unweighted: these are sample counts, never
US population estimates (CDC says to use MEC exam weights for those).

ASSUMPTIONS (all labelled in the output):
- A1 Screening level 20 dB HL at 1000, 2000, 4000 Hz: American Academy of Audiology (2011), Childhood Hearing
  Screening Guidelines, Summary, "Pure tone screening" items 3 and 6. Our app's level is "dB re: team baseline",
  not dB HL; equating the two is the assumption under test, not a fact.
- A2 Reference definitions from the WHO World Report on Hearing (2021), Table 1.3 (better-ear average of 500, 1000,
  2000, 4000 Hz). WHO notes the grades are "for epidemiological use and applicable to adults".
- A3 SIMULATED measurement model (scenarios beyond "ideal"): see `detect_prob`. Slope, lapse and guessing values
  are placeholders, TODO(source), not measured.
"""
import argparse
import hashlib
import json
import math
import random
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server"))
from referrals.rules import decide_outcome, rescreen_plan, v  # noqa: E402  (pure Python, no Django)

CFG = json.loads((ROOT / "config" / "screening.json").read_text())
RAW = ROOT / "data" / "raw" / "nhanes"
BASE = "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public"
FILES = {  # name: (cycle start year, SHA-256 of the file downloaded 2026-10-19)
    "AUX_D.xpt": (2005, "bf75c39655c1d3618ac8bcdd781aba891f78bb19800ea756b15c86000b692378"),
    "DEMO_D.xpt": (2005, "bf9cc79cce501b2fbe5aa8d5b403b618548d02d4aefeb528335cdd9f4c40a3af"),
    "AUX_E.xpt": (2007, "57e526c6c77ea8fe206038341debb6e0f26d992aebf66a292cc85d88369fd42e"),
    "DEMO_E.xpt": (2007, "02b8e97703d04bc99769c751881bece51ac9ba68cf18a2992a45d3bdfb856147"),
    "AUX_F.xpt": (2009, "ab71c7d6bf85848e981d8c7c005a06913d87496c0eeb777d24806b004980b825"),
    "DEMO_F.xpt": (2009, "78c4d4a6e5eafa9da3bbb24a90d140fef5d8c0cda932a7ff8ee609288d4fae07"),
    "AUX_J.xpt": (2017, "3faf777d4f72058eb53ac94c34d1ccbaa688fceff9dad514f1fb9c96880a22e6"),
    "DEMO_J.xpt": (2017, "c0b46e0345ea19404928656277c8b0d10b0cca348a9b2fe4fc3c67e8b7ee73ec"),
}
CYCLES = {"D": "2005-06", "E": "2007-08", "F": "2009-10", "J": "2017-18"}
FREQS = (500, 1000, 2000, 4000)
COLUMN = {500: "AUXU500", 1000: "AUXU1K1", 2000: "AUXU2K", 4000: "AUXU4K"}  # + R / L
NO_RESPONSE = 666
NOT_HEARD = math.inf
AGES = (6, 18)

LEVEL_DB_HL = 20  # A1
SOURCE_LEVEL = ("American Academy of Audiology (2011), Childhood Hearing Screening Guidelines, Summary of "
                "recommendations, pure tone screening items 3 and 6: 1000, 2000, 4000 Hz at 20 dB HL; no response "
                "at any frequency in either ear is a failure.")
SOURCE_WHO = "WHO (2021) World report on hearing, Table 1.3 (ISBN 978-92-4-002048-1)."
# Measurement model defaults (A3): placeholders, TODO(source)
SLOPE_DB = 2.0   # logistic spread of the detection probability around the threshold
LAPSE = 0.02     # chance of missing a clearly audible tone (attention)
RESPONSE_MS = 900  # every tap lands inside the response window (guess taps too: the hardest case for the catch check)


# ---------- data ----------

def download():
    RAW.mkdir(parents=True, exist_ok=True)
    for name, (year, sha) in FILES.items():
        path = RAW / name
        if not path.exists():
            urllib.request.urlretrieve(f"{BASE}/{year}/DataFiles/{name}", path)
        got = hashlib.sha256(path.read_bytes()).hexdigest()
        if got != sha:
            raise SystemExit(f"{name}: SHA-256 {got} != expected {sha}. CDC may have re-released the file; "
                             "check the release notes before updating the checksum.")
        print(f"ok {name}")


def available():
    return all((RAW / n).exists() for n in FILES)


def load():
    """Children aged 6-18 with thresholds at 500/1000/2000/4000 Hz in both ears, plus exclusion counts."""
    import pandas as pd  # laptop-only (requirements-eval.txt)
    children, excluded = [], 0
    for c, cycle in CYCLES.items():
        aux = pd.read_sas(RAW / f"AUX_{c}.xpt", format="xport")
        demo = pd.read_sas(RAW / f"DEMO_{c}.xpt", format="xport")[["SEQN", "RIDAGEYR"]]
        df = aux.merge(demo, on="SEQN")
        df = df[(df.RIDAGEYR >= AGES[0]) & (df.RIDAGEYR <= AGES[1])]
        for row in df.itertuples(index=False):
            r = row._asdict()
            th = {}
            for ear, side in (("left", "L"), ("right", "R")):
                for f in FREQS:
                    x = r[f"{COLUMN[f]}{side}"]
                    th[(ear, f)] = NOT_HEARD if x == NO_RESPONSE else x
            if any(x is None or (isinstance(x, float) and math.isnan(x)) or x == 888 for x in th.values()):
                excluded += 1
                continue
            children.append({"cycle": cycle, "age": int(r["RIDAGEYR"]), "th": th})
    return children, excluded


# ---------- reference definitions (A2) ----------

def pta4(th, ear):
    return sum(th[(ear, f)] for f in FREQS) / len(FREQS)


def truth(th):
    left, right = pta4(th, "left"), pta4(th, "right")
    better, worse = min(left, right), max(left, right)
    return {
        # WHO Table 1.3: mild or worse = better-ear PTA4 >= 20 dB
        "who_better_ear": better >= 20,
        # WHO Table 1.3 grades plus its "unilateral" row (better < 20, worse >= 35)
        "who_any_grade": better >= 20 or worse >= 35,
        # OUR ASSUMPTION: WHO's 20 dB mild cut-off applied to each ear (catches milder one-sided loss)
        "worse_ear_20": worse >= 20,
    }


DEFINITIONS = {
    "who_better_ear": "WHO 2021 hearing loss: better-ear PTA4 (0.5/1/2/4 kHz) >= 20 dB HL",
    "who_any_grade": "WHO 2021 any grade incl. 'unilateral' (better ear < 20, worse ear >= 35 dB HL)",
    "worse_ear_20": "ASSUMPTION: worse-ear PTA4 >= 20 dB HL (WHO mild cut-off applied per ear)",
}


# ---------- screening through our rules ----------

def detect_prob(level, threshold, slope=SLOPE_DB, lapse=LAPSE):
    """SIMULATED (A3): chance a presentation at `level` is detected by an ear with `threshold` (both dB HL)."""
    if threshold == NOT_HEARD:
        return 0.0
    z = (level - threshold) / slope
    return (1 - lapse) / (1 + math.exp(-max(-50.0, min(50.0, z))))


def screen(th, include500, rng=None, guess=0.0, offset_db=0.0, level=LEVEL_DB_HL):
    """Run one child through our rule engine. rng None = ideal: heard iff threshold <= level, no guessing.
    Otherwise each presentation is detected with detect_prob(level + offset_db, ...), and any trial (tone or
    silent) gets a guess tap with probability `guess`."""
    freqs = list(v(CFG, "frequencies_hz")) + ([500] if include500 else [])
    reps = v(CFG, "presentations_per_point")

    def tap(ear=None, f=None):
        if ear is None:
            return rng is not None and rng.random() < guess
        if rng is None:
            return th[(ear, f)] <= level
        return rng.random() < detect_prob(level + offset_db, th[(ear, f)]) or rng.random() < guess

    def trials_for(rnd, points, catches):
        out = []
        for ear, f in points:
            for _ in range(reps):
                hit = tap(ear, f)
                out.append({"round": rnd, "kind": "tone", "ear": ear, "freq": f,
                            "responded": hit, "response_ms": RESPONSE_MS if hit else None})
        for _ in range(catches):
            hit = tap()
            out.append({"round": rnd, "kind": "catch", "responded": hit, "response_ms": RESPONSE_MS if hit else None})
        return out

    points = [(e, f) for e in v(CFG, "ears") for f in freqs]
    trials = trials_for(1, points, v(CFG, "reliability", "catch_trials"))
    plan = rescreen_plan(trials, [], CFG)
    if plan:
        trials += trials_for(2, plan, v(CFG, "rescreen", "catch_trials"))
    return decide_outcome(trials, [], CFG)["outcome"]


# ---------- statistics ----------

def wilson(k, n, z=1.96):
    """95% Wilson score interval for k successes out of n."""
    if n == 0:
        return (None, None)
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, c - h), min(1.0, c + h))


def tally(children, outcomes, key):
    """Outcome counts for children positive / negative on reference definition `key`."""
    t = {"pos": {"PASS": 0, "RETEST": 0, "REFER": 0}, "neg": {"PASS": 0, "RETEST": 0, "REFER": 0}}
    for ch, out in zip(children, outcomes):
        t["pos" if ch["truth"][key] else "neg"][out] += 1
    pos, neg = sum(t["pos"].values()), sum(t["neg"].values())
    return {
        **t, "n_pos": pos, "n_neg": neg,
        "sensitivity": t["pos"]["REFER"] / pos if pos else None,
        "sensitivity_ci": wilson(t["pos"]["REFER"], pos),
        "specificity": (neg - t["neg"]["REFER"]) / neg if neg else None,
        "specificity_ci": wilson(neg - t["neg"]["REFER"], neg),
        "pos_passed": t["pos"]["PASS"] / pos if pos else None,
        "retest_rate": (t["pos"]["RETEST"] + t["neg"]["RETEST"]) / (pos + neg) if pos + neg else None,
    }


GUESS_LEVELS = (0.0, 0.05, 0.1, 0.2, 0.3, 0.5)
OFFSETS_DB = (-10, -5, 0, 5, 10)


def evaluate(children, excluded, seed=2026):
    for ch in children:
        ch["truth"] = truth(ch["th"])
    out = {"n": len(children), "excluded": excluded,
           "by_cycle": {c: sum(ch["cycle"] == c for ch in children) for c in CYCLES.values()},
           "ages": {"6-11": sum(ch["age"] <= 11 for ch in children), "12-18": sum(ch["age"] >= 12 for ch in children)},
           "positives": {k: sum(ch["truth"][k] for ch in children) for k in DEFINITIONS},
           "ideal": {}, "simulated": {}, "guessing": [], "offset": []}
    for include500 in (False, True):
        outs = [screen(ch["th"], include500) for ch in children]
        out["ideal"]["with_500" if include500 else "no_500"] = {k: tally(children, outs, k) for k in DEFINITIONS}
    rng = random.Random(seed)
    outs = [screen(ch["th"], False, rng) for ch in children]
    out["simulated"]["no_500"] = {k: tally(children, outs, k) for k in DEFINITIONS}
    for g in GUESS_LEVELS:
        rng = random.Random(seed)
        outs = [screen(ch["th"], False, rng, guess=g) for ch in children]
        t = tally(children, outs, "who_any_grade")
        out["guessing"].append({"guess": g, **{k: t[k] for k in ("sensitivity", "specificity", "pos_passed", "retest_rate")},
                                "refer_rate": sum(o == "REFER" for o in outs) / len(outs)})
    for off in OFFSETS_DB:
        rng = random.Random(seed)
        outs = [screen(ch["th"], False, rng, offset_db=off) for ch in children]
        t = tally(children, outs, "who_any_grade")
        out["offset"].append({"offset_db": off, **{k: t[k] for k in ("sensitivity", "specificity", "retest_rate")},
                              "refer_rate": sum(o == "REFER" for o in outs) / len(outs)})
    return out


# ---------- output ----------

def pct(x):
    return "-" if x is None else f"{100 * x:.1f}%"


def ci(pair):
    return "-" if pair[0] is None else f"{100 * pair[0]:.1f}-{100 * pair[1]:.1f}%"


def markdown(r):
    lines = [
        "### NHANES rule-logic evaluation",
        "",
        "US NHANES youth audiograms, unweighted sample counts. Tests the **rule logic** only (config + rule engine), "
        "not the app on a phone, and not Indian children. Screening, not diagnosis.",
        "",
        f"- Children aged 6-18 with all 8 thresholds: **{r['n']}** ({r['excluded']} excluded for a missing threshold). "
        + ", ".join(f"{c}: {n}" for c, n in r["by_cycle"].items()) + f". Ages 6-11: {r['ages']['6-11']} (2017-18 only); 12-18: {r['ages']['12-18']}.",
        f"- **Assumption A1** (screening level): {LEVEL_DB_HL} dB HL. Source: {SOURCE_LEVEL} Our app plays at "
        "'dB re: team baseline'; treating that as 20 dB HL is an assumption.",
        f"- **Assumption A2** (reference): {SOURCE_WHO} WHO says its grades are for epidemiological use and "
        "applicable to adults.",
        "- Sample share positive (unweighted; not a prevalence estimate): "
        + "; ".join(f"{DEFINITIONS[k]}: {n} ({pct(n / r['n'])})" for k, n in r["positives"].items()) + ".",
        "",
        "| Scenario | Reference definition | Positives / negatives | Sensitivity (REFER) 95% CI | Specificity (not REFER) 95% CI | Positives that PASSED | RETEST rate |",
        "|---|---|---|---|---|---|---|",
    ]
    rows = [("Ideal, 1/2/4 kHz", r["ideal"]["no_500"]), ("Ideal, + 500 Hz (quiet room)", r["ideal"]["with_500"]),
            ("SIMULATED measurement error, 1/2/4 kHz", r["simulated"]["no_500"])]
    for name, block in rows:
        for k, t in block.items():
            lines.append(f"| {name} | {DEFINITIONS[k]} | {t['n_pos']} / {t['n_neg']} | {pct(t['sensitivity'])} "
                         f"({ci(t['sensitivity_ci'])}) | {pct(t['specificity'])} ({ci(t['specificity_ci'])}) | "
                         f"{pct(t['pos_passed'])} | {pct(t['retest_rate'])} |")
    lines += [
        "",
        f"Ideal = a tone is heard if the NHANES threshold <= {LEVEL_DB_HL} dB HL; no guessing, no lapses. SIMULATED = "
        f"logistic detection, slope {SLOPE_DB} dB, lapse {LAPSE:.0%}, no guessing (assumption A3, placeholders).",
        "",
        "#### SIMULATED: partial guessing (reference: WHO any grade incl. unilateral)",
        "",
        "Each trial, tone or silent, gets a random in-window tap with the given probability.",
        "",
        "| Guess rate per trial | REFER rate (all) | RETEST rate (all) | Sensitivity | Specificity | Positives that PASSED |",
        "|---|---|---|---|---|---|",
    ]
    for g in r["guessing"]:
        lines.append(f"| {g['guess']:.2f} | {pct(g['refer_rate'])} | {pct(g['retest_rate'])} | {pct(g['sensitivity'])} | "
                     f"{pct(g['specificity'])} | {pct(g['pos_passed'])} |")
    lines += [
        "",
        "#### SIMULATED: calibration error (tones played this many dB louder (+) or softer (-) than intended)",
        "",
        "| Level error (dB) | REFER rate (all) | RETEST rate (all) | Sensitivity | Specificity |",
        "|---|---|---|---|---|",
    ]
    for o in r["offset"]:
        lines.append(f"| {o['offset_db']:+d} | {pct(o['refer_rate'])} | {pct(o['retest_rate'])} | "
                     f"{pct(o['sensitivity'])} | {pct(o['specificity'])} |")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--download", action="store_true")
    a = ap.parse_args()
    if a.download:
        download()
    elif not available():
        raise SystemExit("NHANES files missing: run python scripts/eval_nhanes.py --download")
    else:
        print(markdown(evaluate(*load())))
