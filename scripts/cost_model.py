"""PROPOSED deployment cost model per school: phones needed, screening days, cost per child per year.

    python scripts/cost_model.py          (prints Markdown)

Inputs: config/cost_model.json (team estimates, Oct 2026; TODO(source) where unsourced). A plan for a future pilot,
not something we did or measured: we have not tested in any school. Software is Rs 0 in every scenario; deployment
costs are shown separately. Equipment is spread over its lifespan (straight line); one screening per child per year.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COST = json.loads((ROOT / "config" / "cost_model.json").read_text())


def v(key, cfg=COST):
    return cfg[key]["value"]


def params(**over):
    p = {k: v(k) for k in COST if not k.startswith("_")}
    p.update(over)
    return p


def throughput(p, students, per_phone):
    """Children per phone per day, and school days to screen everyone with ceil(students / per_phone) phones."""
    per_day = p["screening_hours_per_phone_per_day"] * 60 / p["minutes_per_child"]
    phones = math.ceil(students / per_phone) if students else 0
    busiest = min(students, per_phone)  # the phone with the most children
    return {"children_per_phone_per_day": per_day, "phones": phones,
            "days": busiest / per_day if per_day else math.inf,
            "teacher_minutes": students * p["minutes_per_child"]}


def scenario_cost(p, name, students, per_phone):
    s = p["scenarios"][name]
    t = throughput(p, students, per_phone)
    per_kit = per_phone if s["kits"] == "per_phone_guideline" else p["students_per_class"]
    kits = math.ceil(students / per_kit) if students else 0
    # kits screen in parallel, so the school finishes when the busiest kit does
    days = min(students, per_kit) / t["children_per_phone_per_day"]
    phone_year = p["phone_price_inr"] / p["phone_life_years"] if s["buys_phone"] else 0
    ear_year = p["earphone_price_inr"] / p["earphone_life_years"]
    upfront = kits * ((p["phone_price_inr"] if s["buys_phone"] else 0) + p["earphone_price_inr"])
    per_year = kits * (phone_year + ear_year)
    rate = p["teacher_cost_inr_per_hour"]
    return {"kits": kits, "days_to_finish": days, "upfront_inr": upfront, "equipment_per_year_inr": per_year,
            "per_child_per_year_inr": per_year / students if students else None,
            "software_inr": p["software_cost_inr"],
            "teacher_minutes": t["teacher_minutes"],
            "teacher_cost_inr": None if rate is None else t["teacher_minutes"] / 60 * rate}


def future_sms(p, referred):
    price = p["future_sms_cost_inr_per_message"]
    return None if price is None else referred * p["future_sms_messages_per_referral"] * price


def run():
    p = params()
    per = p["students_per_phone"]
    return {
        "params": p,
        "planning": [{"students_per_phone": n, **throughput(p, n, n)} for n in (per["recommended"], per["acceptable"], 1000)],
        "costs": [{"students": n, "scenario": name, **scenario_cost(p, name, n, per["recommended"])}
                  for n in p["school_sizes"] for name in p["scenarios"]],
    }


def inr(x, digits=0):
    return "TODO(source)" if x is None else f"Rs {x:,.{digits}f}"


def markdown(r):
    p = r["params"]
    lines = [
        "### PROPOSED deployment cost model",
        "",
        "**Proposed** plan for a future school pilot (SFIC field-testing support). Not tested or measured in any school. "
        f"Software: **{inr(p['software_cost_inr'])}** in every scenario. Prices: team estimate, online retail price, Oct 2026 "
        f"(phone {inr(p['phone_price_inr'])}, {p['phone_life_years']} years; wired earphones {inr(p['earphone_price_inr'])}, "
        f"{p['earphone_life_years']} year).",
        "",
        f"Planning inputs: {p['minutes_per_child']} min per child including setup, {p['screening_hours_per_phone_per_day']} h "
        "of screening per phone per day. Each student misses about that many minutes once a year; the students-per-phone "
        "guideline limits how long a screening round runs, not student time.",
        "",
        "| Students on one phone (PROPOSED) | Children per phone per day | School days to finish |",
        "|---|---|---|",
    ]
    for row in r["planning"]:
        lines.append(f"| {row['students_per_phone']:,} | {row['children_per_phone_per_day']:.0f} | {row['days']:.0f} |")
    lines += [
        "",
        f"Guideline (PROPOSED): about {p['students_per_phone']['recommended']} students per calibrated phone, acceptable up to "
        f"{p['students_per_phone']['acceptable']}. Phones needed = ceil(students / {p['students_per_phone']['recommended']}).",
        "",
        "| School size | Scenario (PROPOSED) | Kits | School days to finish | Upfront | Equipment per year | Per child per year | Software | Teacher time | Teacher cost |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for c in r["costs"]:
        lines.append(f"| {c['students']:,} | {p['scenarios'][c['scenario']]['label']} | {c['kits']} | {c['days_to_finish']:.1f} | {inr(c['upfront_inr'])} | "
                     f"{inr(c['equipment_per_year_inr'])} | {inr(c['per_child_per_year_inr'], 1)} | {inr(c['software_inr'])} | "
                     f"{c['teacher_minutes']:,} min | {inr(c['teacher_cost_inr'])} |")
    lines += ["", "Scenario notes:", ""]
    lines += [f"- **{s['label']}**: {s['notes']}" for s in p["scenarios"].values()]
    lines += ["", f"Future cost, not in the totals: SMS reminders ({p['future_sms_messages_per_referral']} per referred child "
              f"at {inr(p['future_sms_cost_inr_per_message'])} per message). Reminders are stubbed today.",
              f"Scenario C counts class teachers as ceil(students / {p['students_per_class']}) (class size TODO(source))."]
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    print(markdown(run()))
