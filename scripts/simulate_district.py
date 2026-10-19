"""SIMULATED district funnel: enrolled -> screened -> referred -> reached care, per follow-up model.

    python scripts/simulate_district.py [--seed 2026] [--svg eval/funnel_simulated.svg]

Inputs: config/district_model.json (brief figures are TODO(source)). Every number this prints is SIMULATED. It shows
what the brief's follow-up rates imply for a district; it is not a measurement of this app. Stops at "reached care":
we have no treatment-outcome data. Stdlib only (random.binomialvariate, Python 3.12+).
"""
import argparse
import json
import random
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL = json.loads((ROOT / "config" / "district_model.json").read_text())


def v(*path, cfg=MODEL):
    node = cfg
    for key in path:
        node = node[key]
    return node["value"]


def params(cfg=MODEL, **over):
    p = {k: v(k, cfg=cfg) for k in ("children", "screening_coverage", "prevalence", "screen_sensitivity",
                                     "screen_specificity", "follow_up")}
    p.update(over)
    return p


def funnel(p, model):
    """Expected counts (no randomness)."""
    screened = p["children"] * p["screening_coverage"]
    with_loss = screened * p["prevalence"]
    true_ref = with_loss * p["screen_sensitivity"]
    false_ref = (screened - with_loss) * (1 - p["screen_specificity"])
    rate = p["follow_up"][model]
    return {"children": p["children"], "screened": screened, "with_loss": with_loss,
            "referred": true_ref + false_ref, "referred_with_loss": true_ref,
            "reached_care": (true_ref + false_ref) * rate, "reached_care_with_loss": true_ref * rate,
            "missed_by_screen": with_loss - true_ref}


def draw(p, model, rng):
    """One stochastic district: binomial counts at every stage."""
    b = rng.binomialvariate
    screened = b(p["children"], p["screening_coverage"])
    with_loss = b(screened, p["prevalence"])
    true_ref = b(with_loss, p["screen_sensitivity"])
    false_ref = b(screened - with_loss, 1 - p["screen_specificity"])
    rate = p["follow_up"][model]
    care_true = b(true_ref, rate)
    return {"children": p["children"], "screened": screened, "with_loss": with_loss,
            "referred": true_ref + false_ref, "referred_with_loss": true_ref,
            "reached_care": care_true + b(false_ref, rate), "reached_care_with_loss": care_true,
            "missed_by_screen": with_loss - true_ref}


def monte_carlo(p, seed, mc=None):
    """Parameter uncertainty + binomial noise. Same parameter draw for both models in a run (paired comparison)."""
    mc = mc or v("monte_carlo")
    rng = random.Random(seed)
    out = {m: [] for m in p["follow_up"]}
    gain = []
    for _ in range(mc["runs"]):
        q = dict(p, prevalence=rng.uniform(*mc["prevalence_range"]),
                 screen_sensitivity=rng.uniform(*mc["sensitivity_range"]),
                 screen_specificity=rng.uniform(*mc["specificity_range"]),
                 follow_up={m: min(1.0, max(0.0, r + rng.uniform(-mc["follow_up_spread"], mc["follow_up_spread"])))
                            for m, r in p["follow_up"].items()})
        run = {m: draw(q, m, rng)["reached_care_with_loss"] for m in q["follow_up"]}
        for m, x in run.items():
            out[m].append(x)
        gain.append(run["school_camp"] - run["sms_only"])
    summary = {m: spread(xs) for m, xs in out.items()}
    summary["camp_minus_sms"] = spread(gain)
    return summary


def spread(xs):
    """Median and 5th-95th percentile."""
    if not xs:
        return {"median": None, "p5": None, "p95": None}
    q = statistics.quantiles(xs, n=20, method="inclusive") if len(xs) > 1 else [xs[0]] * 19
    return {"median": statistics.median(xs), "p5": q[0], "p95": q[-1]}


SWEEPS = {
    "prevalence": [0.05, 0.10, 0.1414, 0.18],
    "screen_sensitivity": [0.7, 0.8, 0.9, 1.0],
    "screen_specificity": [0.85, 0.90, 0.95, 1.0],
}


def sweeps(p):
    """One-way sweeps: expected children with hearing loss reaching care, per model."""
    rows = []
    for key, values in SWEEPS.items():
        for x in values:
            q = dict(p, **{key: x})
            rows.append({"param": key, "value": x,
                         **{m: funnel(q, m)["reached_care_with_loss"] for m in p["follow_up"]},
                         "referred": funnel(q, "sms_only")["referred"]})
    return rows


def run(seed=2026):
    p = params()
    rng = random.Random(seed)
    return {"params": p, "seed": seed,
            "expected": {m: funnel(p, m) for m in p["follow_up"]},
            "one_draw": {m: draw(p, m, rng) for m in p["follow_up"]},
            "sweeps": sweeps(p),
            "monte_carlo": monte_carlo(p, seed)}


def n(x):
    return f"{round(x):,}"


def markdown(r):
    p, names = r["params"], v("models")
    e = r["expected"]
    lines = [
        "### SIMULATED district funnel",
        "",
        f"SIMULATED, not measured. {n(p['children'])} children; prevalence {p['prevalence']:.2%} and follow-up rates "
        f"from the challenge brief (TODO(source)); ideal screen (sensitivity {p['screen_sensitivity']:.0%}, "
        f"specificity {p['screen_specificity']:.0%}) so only follow-up differs. Stops at reaching care: no treatment "
        "data.",
        "",
        "| Stage (SIMULATED, expected counts) | " + " | ".join(names[m] for m in e) + " |",
        "|---|" + "---|" * len(e),
    ]
    for key, label in (("children", "Enrolled"), ("screened", "Screened"), ("with_loss", "With hearing loss (brief prevalence)"),
                       ("referred", "Referred"), ("reached_care_with_loss", "Children with hearing loss who reach care"),
                       ("missed_by_screen", "Missed by the screen")):
        lines.append(f"| {label} | " + " | ".join(n(e[m][key]) for m in e) + " |")
    s, c = e["sms_only"]["reached_care_with_loss"], e["school_camp"]["reached_care_with_loss"]
    lines += ["", f"Difference (SIMULATED): {n(c - s)} more children with hearing loss reach care per {n(p['children'])} "
              "enrolled with school camps than with SMS reminders only, if the brief's rates hold here.", "",
              f"One seeded stochastic district (seed {r['seed']}, SIMULATED): " + "; ".join(
                  f"{names[m]}: {n(r['one_draw'][m]['reached_care_with_loss'])} reach care" for m in r["one_draw"]) + ".", "",
              "#### SIMULATED one-way sweeps (children with hearing loss reaching care, expected)", "",
              "| Parameter | Value | " + " | ".join(names[m] for m in e) + " | Referred |",
              "|---|---|" + "---|" * len(e) + "---|"]
    for row in r["sweeps"]:
        lines.append(f"| {row['param']} | {row['value']} | " + " | ".join(n(row[m]) for m in e) + f" | {n(row['referred'])} |")
    mc, cfg = r["monte_carlo"], v("monte_carlo")
    lines += ["", f"#### SIMULATED Monte Carlo ({cfg['runs']} runs, seed {r['seed']})", "",
              f"Assumed ranges (illustrative, not data): prevalence {cfg['prevalence_range']}, sensitivity "
              f"{cfg['sensitivity_range']}, specificity {cfg['specificity_range']}, follow-up +/- {cfg['follow_up_spread']}.",
              "", "| Children with hearing loss reaching care (SIMULATED) | Median | 5th percentile | 95th percentile |",
              "|---|---|---|---|"]
    for m, label in [*names.items(), ("camp_minus_sms", "School camp minus SMS only")]:
        lines.append(f"| {label} | {n(mc[m]['median'])} | {n(mc[m]['p5'])} | {n(mc[m]['p95'])} |")
    return "\n".join(lines) + "\n"


def svg(r):
    """Hand-written funnel chart, title says SIMULATED. Two bars per stage (one per model)."""
    e, names = r["expected"], v("models")
    stages = [("screened", "Screened"), ("with_loss", "With hearing loss"), ("referred_with_loss", "Referred"),
              ("reached_care_with_loss", "Reached care")]
    top = max(e[m]["screened"] for m in e) or 1
    w, bar, gap, left = 640, 18, 22, 150
    colors = {"sms_only": "#9a9a9a", "school_camp": "#2a6fdb"}
    h = 70 + len(stages) * (2 * bar + gap) + 30
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="sans-serif" font-size="12">',
           f'<rect width="{w}" height="{h}" fill="#ffffff"/>',
           f'<text x="10" y="22" font-size="15" font-weight="bold">SIMULATED district funnel ({n(r["params"]["children"])} children)</text>',
           '<text x="10" y="40" fill="#555">Brief figures, TODO(source). Not measured. Bar widths are linear.</text>']
    y = 60
    for key, label in stages:
        out.append(f'<text x="10" y="{y + bar + 4}">{label}</text>')
        for m in ("sms_only", "school_camp"):
            x = e[m][key]
            bw = max(1, (w - left - 90) * x / top)
            out.append(f'<rect x="{left}" y="{y}" width="{bw:.1f}" height="{bar - 2}" fill="{colors[m]}"/>')
            out.append(f'<text x="{left + bw + 6:.1f}" y="{y + bar - 6}">{n(x)}</text>')
            y += bar
        y += gap
    lx = 10
    for m in ("sms_only", "school_camp"):
        out.append(f'<rect x="{lx}" y="{h - 22}" width="12" height="12" fill="{colors[m]}"/>')
        out.append(f'<text x="{lx + 16}" y="{h - 12}">{names[m]}</text>')
        lx += 300
    out.append("</svg>")
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--svg", type=Path)
    a = ap.parse_args()
    res = run(a.seed)
    print(markdown(res))
    if a.svg:
        a.svg.write_text(svg(res))
