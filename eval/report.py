"""Regenerate every quotable number into eval/results.md and the generated block of docs/CLAIMS.md.

    python -m eval.report            write eval/results.md, eval/funnel_simulated.svg and the CLAIMS block
    python -m eval.report --check    exit 1 if docs/CLAIMS.md disagrees with freshly computed numbers (run by pytest)

Sources: scripts/simulate_district.py (SIMULATED), scripts/eval_nhanes.py (NHANES rule logic; only if the CDC files
are downloaded), scripts/cost_model.py (PROPOSED), scripts/analyze_phase4.py and scripts/calibrate.py on raw device
files (only if present on this laptop). Rows whose inputs are missing here are skipped by --check, never guessed.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import analyze_phase4  # noqa: E402
import calibrate  # noqa: E402
import cost_model  # noqa: E402
import eval_nhanes  # noqa: E402
import simulate_district  # noqa: E402

CLAIMS = ROOT / "docs" / "CLAIMS.md"
BEGIN, END = "<!-- BEGIN GENERATED: python -m eval.report -->", "<!-- END GENERATED -->"
PHASE5 = ROOT / "data" / "raw" / "phase5"
PHASE6_CHILD = ROOT / "data" / "raw" / "phase6" / "childtest.json"


def compute():
    """All results, plus claim rows {id: row text}. NHANES / device rows only when their raw files exist."""
    sim = simulate_district.run()
    cost = cost_model.run()
    nh = eval_nhanes.evaluate(*eval_nhanes.load()) if eval_nhanes.available() else None
    p5 = sorted(PHASE5.glob("session-*.json"))
    cal = sorted((ROOT / "data" / "raw" / "calibration").glob("*.json"))
    return {"sim": sim, "cost": cost, "nhanes": nh, "phase5": p5, "calibration": cal,
            "claims": claim_rows(sim, cost, nh), "device_checks": device_checks(p5, PHASE6_CHILD, cal)}


def row(cid, claim, value, condition, script, kind):
    return f"| {cid} | {claim} | {value} | {condition} | {script} | {kind} |"


def claim_rows(sim, cost, nh):
    e, mc = sim["expected"], sim["monte_carlo"]
    n = simulate_district.n
    sim_cond = (f"{n(sim['params']['children'])} children, brief prevalence {sim['params']['prevalence']:.2%} and follow-up "
                "rates (TODO(source)), ideal screen, config/district_model.json")
    rows = {
        "SIM-01": row("SIM-01", "Children with hearing loss who reach care, referral + SMS reminders only",
                      n(e["sms_only"]["reached_care_with_loss"]), sim_cond, "`scripts/simulate_district.py`", "SIMULATED"),
        "SIM-02": row("SIM-02", "Children with hearing loss who reach care, referral + school ear camp",
                      n(e["school_camp"]["reached_care_with_loss"]), sim_cond, "`scripts/simulate_district.py`", "SIMULATED"),
        "SIM-03": row("SIM-03", "Extra children reaching care with school camps vs SMS only",
                      n(e["school_camp"]["reached_care_with_loss"] - e["sms_only"]["reached_care_with_loss"]), sim_cond,
                      "`scripts/simulate_district.py`", "SIMULATED"),
        "SIM-04": row("SIM-04", "Same difference under parameter uncertainty: median (5th-95th percentile)",
                      f"{n(mc['camp_minus_sms']['median'])} ({n(mc['camp_minus_sms']['p5'])}-{n(mc['camp_minus_sms']['p95'])})",
                      f"{simulate_district.v('monte_carlo')['runs']} runs, seed {sim['seed']}, illustrative ranges (not data)",
                      "`scripts/simulate_district.py`", "SIMULATED"),
    }
    pc = {(c["students"], c["scenario"]): c for c in cost["costs"]}
    plan = {r["students_per_phone"]: r for r in cost["planning"]}
    cost_cond = "Team estimate, online retail price, Oct 2026; equipment over its lifespan; not tested in any school"
    for cid, (size, sc, label) in {"COST-01": (250, "A_school_phone", "A (school phone, recommended)"),
                                   "COST-02": (250, "B_teacher_phone", "B (teacher's own phone)"),
                                   "COST-03": (250, "C_kit_per_class_teacher", "C (kit per class teacher)"),
                                   "COST-04": (1000, "A_school_phone", "A (school phone, recommended)")}.items():
        c = pc[(size, sc)]
        rows[cid] = row(cid, f"Equipment cost per child per year, scenario {label}, {size:,}-student school",
                        f"Rs {c['per_child_per_year_inr']:.1f} (software Rs 0)", cost_cond, "`scripts/cost_model.py`", "PROPOSED")
    a1k, c1k = pc[(1000, "A_school_phone")], pc[(1000, "C_kit_per_class_teacher")]
    rows["COST-06"] = row("COST-06", "School days to finish a 1,000-student school: scenario A vs scenario C",
                          f"{a1k['days_to_finish']:.0f} vs {c1k['days_to_finish']:.1f}",
                          f"A: {a1k['kits']} phones of 250 students in parallel; C: one kit per class of "
                          f"{cost['params']['students_per_class']} (class size TODO(source)); 5 min per child, 1 h per kit per day",
                          "`scripts/cost_model.py`", "PROPOSED")
    rows["COST-05"] = row("COST-05", "School days to screen 250 students on one phone",
                          f"{plan[250]['days']:.0f}", "5 min per child incl. setup, 1 h per phone per day (planning inputs)",
                          "`scripts/cost_model.py`", "PROPOSED")
    if nh:
        pct = eval_nhanes.pct
        ideal, ideal500, simd = nh["ideal"]["no_500"], nh["ideal"]["with_500"], nh["simulated"]["no_500"]
        g10 = next(g for g in nh["guessing"] if g["guess"] == 0.1)
        o5, o0 = (next(o for o in nh["offset"] if o["offset_db"] == x) for x in (-5, 0))
        cond = ("NHANES 2005-10 + 2017-18, ages 6-18, unweighted, US; rule logic only; assumed 20 dB HL at 1/2/4 kHz "
                "(AAA 2011); reference WHO 2021 Table 1.3")
        t = ideal["who_any_grade"]
        rows.update({
            "NH-01": row("NH-01", "Children analysed", f"{nh['n']:,} ({nh['excluded']} excluded for a missing threshold)",
                         cond, "`scripts/eval_nhanes.py`", "Real (public survey data)"),
            "NH-02": row("NH-02", "Rule-logic sensitivity / specificity of REFER, reference WHO any grade incl. unilateral, ideal responses",
                         f"{pct(t['sensitivity'])} ({eval_nhanes.ci(t['sensitivity_ci'])}) / {pct(t['specificity'])} "
                         f"({eval_nhanes.ci(t['specificity_ci'])})", cond + "; ideal = heard iff threshold <= 20",
                         "`scripts/eval_nhanes.py`", "Real data, ideal responses"),
            "NH-03": row("NH-03", "Children with worse-ear PTA4 >= 20 dB HL (our assumption) who PASS without / with 500 Hz",
                         f"{pct(ideal['worse_ear_20']['pos_passed'])} / {pct(ideal500['worse_ear_20']['pos_passed'])}",
                         cond + "; ideal responses", "`scripts/eval_nhanes.py`", "Real data, ideal responses"),
            "NH-04": row("NH-04", "With a 10% guess tap per trial: sensitivity (WHO any grade) and RETEST rate",
                         f"{pct(g10['sensitivity'])}, RETEST {pct(g10['retest_rate'])} (no guessing: "
                         f"{pct(nh['guessing'][0]['sensitivity'])}, {pct(nh['guessing'][0]['retest_rate'])})",
                         cond + f"; 4 catch trials; slope {eval_nhanes.SLOPE_DB} dB, lapse {eval_nhanes.LAPSE:.0%} (placeholders)",
                         "`scripts/eval_nhanes.py`", "SIMULATED responses on real audiograms"),
            "NH-05": row("NH-05", "REFER rate when tones play 5 dB softer than intended vs correct level",
                         f"{pct(o5['refer_rate'])} vs {pct(o0['refer_rate'])}", cond + "; calibration error model",
                         "`scripts/eval_nhanes.py`", "SIMULATED responses on real audiograms"),
            "NH-06": row("NH-06", "Rule-logic sensitivity of REFER, WHO any grade, SIMULATED measurement error (no guessing)",
                         f"{pct(simd['who_any_grade']['sensitivity'])} ({eval_nhanes.ci(simd['who_any_grade']['sensitivity_ci'])})",
                         cond + f"; slope {eval_nhanes.SLOPE_DB} dB, lapse {eval_nhanes.LAPSE:.0%} (placeholders)",
                         "`scripts/eval_nhanes.py`", "SIMULATED responses on real audiograms"),
        })
    return rows


def device_checks(p5_files, p6_child, cal_files=()):
    """Hand-written device-trial rows rechecked against their raw files when present: {claim id: expected text}."""
    fmt = lambda t: f"min {t[0]} ms, median {t[1]} ms, max {t[2]} ms"  # noqa: E731
    out = {}
    for prefix, f in [("P5", p5_files[0] if p5_files else None), ("P6", p6_child if p6_child.exists() else None)]:
        if f:
            s = analyze_phase4.summary(json.loads(f.read_text()))
            out |= {f"{prefix}-01": fmt(s["latency_ms"]), f"{prefix}-02": fmt(s["tap_from_start_ms"]),
                    f"{prefix}-03": s["over_limit"].replace("/", " of ")}
    if cal_files:
        data = [json.loads(p.read_text()) for p in cal_files]
        c = calibrate.analyse(data)
        firsts = [(f, x) for d in data for (_, f), x in calibrate.thresholds(d)[0].items() if x is not None]
        lo = [x for f, x in firsts if f == 500]
        hi = [x for f, x in firsts if f != 500]
        out |= {"CAL-01": f"median {c['baseline'][500]} ({c['n'][500]} ears, range {min(lo)} to {max(lo)})",
                "CAL-02": " / ".join(str(c["baseline"][f]) for f in (1000, 2000, 4000))
                          + f"; {hi.count(-60)} of {len(hi)} ear-frequency thresholds exactly -60",
                "CAL-03": f"{len(c['excluded'])} of {len(c['volunteers'])} excluded"}
    return out


def git_state():
    head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    dirty = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    return head + (" (plus uncommitted changes)" if dirty else "")


def results_md(r):
    cfg = json.loads((ROOT / "config" / "screening.json").read_text())["config_version"]
    parts = [
        "# Evaluation results",
        "",
        f"Generated by `python -m eval.report` from commit `{git_state()}`, config_version {cfg}. Do not edit by hand.",
        "",
        "Labels: **SIMULATED** = model output, not measured. **PROPOSED** = plan for a future pilot, not done. "
        "**PROVISIONAL** = the team calibration in use: 7 adult volunteers, one phone and earphone model, 1-4 kHz "
        "upper bounds (ERR-044). NHANES "
        "rows use real public US survey audiograms to test the rule logic only. None of this is accuracy of the app in "
        "Indian children. Screening and referral tool, not a diagnosis.",
        "",
        simulate_district.markdown(r["sim"]),
        "![SIMULATED district funnel](funnel_simulated.svg)",
        "",
        eval_nhanes.markdown(r["nhanes"]) if r["nhanes"] else
        "### NHANES rule-logic evaluation\n\nNot run here: CDC files missing (`python scripts/eval_nhanes.py --download`).\n",
        cost_model.markdown(r["cost"]),
    ]
    if r["phase5"]:
        parts.append("### Device trial sessions (Phase 5, raw files on this laptop)\n")
        parts.append(capture(lambda: analyze_phase4.main([str(p) for p in r["phase5"]])))
    if r["calibration"]:
        parts.append(calibrate.markdown(calibrate.analyse([json.loads(p.read_text()) for p in r["calibration"]])))
    return "\n".join(parts)


def capture(fn):
    import contextlib
    import io
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        fn()
    return buf.getvalue()


def claims_block(rows):
    return "\n".join([BEGIN, "", "| ID | Claim | Value | Condition | Script | Real / SIMULATED |", "|---|---|---|---|---|---|",
                      *rows.values(), "", END])


def write(r):
    (ROOT / "eval" / "results.md").write_text(results_md(r))
    (ROOT / "eval" / "funnel_simulated.svg").write_text(simulate_district.svg(r["sim"]))
    text = CLAIMS.read_text()
    block = claims_block(r["claims"])
    text = re.sub(re.escape(BEGIN) + ".*?" + re.escape(END), lambda _: block, text, flags=re.S) if BEGIN in text \
        else text.rstrip("\n") + "\n\n## Generated claims\n\n" + block + "\n"
    CLAIMS.write_text(text)


def check(r):
    """Problems as text; empty list = CLAIMS.md agrees with the numbers computable on this laptop."""
    text = CLAIMS.read_text()
    problems = []
    if BEGIN not in text:
        return ["docs/CLAIMS.md has no generated block: run python -m eval.report"]
    block = text.split(BEGIN, 1)[1].split(END, 1)[0]
    have = {m.group(1): m.group(0) for m in re.finditer(r"^\| ([A-Z0-9]+-\d+) \|.*$", block, re.M)}
    for cid, line in r["claims"].items():
        if have.get(cid) != line:
            problems.append(f"{cid}: CLAIMS.md has {have.get(cid)!r}, computed {line!r}")
    complete = r["nhanes"] is not None
    for cid in set(have) - set(r["claims"]):
        if complete or not cid.startswith("NH-"):
            problems.append(f"{cid}: in CLAIMS.md but no longer produced")
    for cid, expected in r["device_checks"].items():
        line = next((ln for ln in text.splitlines() if ln.startswith(f"| {cid} |")), "")
        if expected not in line:
            problems.append(f"{cid}: expected {expected!r} from the raw device file, CLAIMS.md row is {line!r}")
    return problems


if __name__ == "__main__":
    res = compute()
    if "--check" in sys.argv:
        bad = check(res)
        print("\n".join(bad) or "CLAIMS.md matches the computed results"
              + ("" if res["nhanes"] else " (NHANES rows skipped: data not downloaded)"))
        sys.exit(1 if bad else 0)
    write(res)
    print("wrote eval/results.md, eval/funnel_simulated.svg, docs/CLAIMS.md generated block")
