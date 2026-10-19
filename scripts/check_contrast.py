"""WCAG 2.x contrast of every text/background pair the app uses (Direction B v2, docs/DESIGN.md). Colours are read
from screener/src/ui.tsx, so the table can't drift from the code. Exit 1 if any pair is below its minimum
(4.5 normal text, 3.0 large text 24 dp+ or bold 19 dp+).

    python scripts/check_contrast.py
"""
import re
import sys
from pathlib import Path

UI = Path(__file__).resolve().parents[1] / "screener" / "src" / "ui.tsx"

# (foreground, background, minimum, where). Names are keys of C in ui.tsx, OUTCOME.<X>.<field>, or a literal #hex.
PAIRS = [
    ("night", "paper", 4.5, "body text, headings"),
    ("night", "white", 4.5, "text in cards"),
    ("dusk", "white", 4.5, "secondary text in cards"),
    ("dusk", "paper", 4.5, "secondary text on the page"),
    ("white", "indigo", 4.5, "primary button, selected chip"),
    ("indigo", "white", 4.5, "outline button, language pill"),
    ("indigo", "paper", 4.5, "language pill in the header"),
    ("night", "indigoTint", 4.5, "Screening-only banner"),
    ("indigo", "indigoTint", 4.5, "Referred / Seen chip, count pill"),
    ("night", "marigold", 4.5, "icon on the marigold tile"),
    ("marigold", "night", 4.5, "language pill on the Home band"),
    ("white", "night", 4.5, "app name on the Home band"),
    ("bandText", "night", 4.5, "Home band subtitle"),
    ("#7A4F00", "marigoldTint", 4.5, "Camp scheduled / Rescheduled chip"),
    ("okText", "okTint", 4.5, "Treated chip, earphones detected, triage saved"),
    ("warnText", "warnBg", 4.5, "UNCALIBRATED and triage warning blocks"),
    ("dusk", "routeTint", 4.5, "route chip, Closed chip"),
    ("night", "lavender", 4.5, "child mode, top of the sky"),
    ("night", "dawn", 4.5, "child mode, bottom of the sky"),
    ("night", "#F7F6FF", 4.5, "banner on the 85% white strip over the sky (approx.)"),
    ("OUTCOME.PASS.on", "OUTCOME.PASS.fill", 3.0, "PASS badge (30 dp)"),
    ("OUTCOME.RETEST.on", "OUTCOME.RETEST.fill", 3.0, "RETEST badge (30 dp)"),
    ("OUTCOME.REFER.on", "OUTCOME.REFER.fill", 3.0, "REFER badge (30 dp)"),
    ("OUTCOME.PASS.onTint", "OUTCOME.PASS.tint", 4.5, "PASS ear pill"),
    ("OUTCOME.RETEST.onTint", "OUTCOME.RETEST.tint", 4.5, "RETEST ear pill"),
    ("OUTCOME.REFER.onTint", "OUTCOME.REFER.tint", 4.5, "REFER ear pill, Missed chip"),
]


def palette(src):
    c = dict(re.findall(r"(\w+): '(#[0-9A-Fa-f]{6})'", src[src.index("export const C = {"):src.index("};")]))
    for name, body in re.findall(r"(PASS|RETEST|REFER): \{([^}]*)\}", src):
        for k, v in re.findall(r"(\w+): ('#[0-9A-Fa-f]{6}'|C\.\w+)", body):
            c[f"OUTCOME.{name}.{k}"] = c[v[2:]] if v.startswith("C.") else v.strip("'")
    return c


def luminance(hex_):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (int(hex_[i:i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def ratio(fg, bg):
    a, b = sorted((luminance(fg), luminance(bg)), reverse=True)
    return (a + 0.05) / (b + 0.05)


def check(src=None):
    c = palette(src if src is not None else UI.read_text())
    col = lambda n: n if n.startswith("#") else c[n]
    return [(fg, bg, round(ratio(col(fg), col(bg)), 1), need, where) for fg, bg, need, where in PAIRS]


def main():
    rows = check()
    print("| Text | Background | Ratio | Needs | Where |\n|---|---|---|---|---|")
    for fg, bg, r, need, where in rows:
        print(f"| {fg} | {bg} | {r} | {need} | {where} |")
    bad = [r for r in rows if r[2] < r[3]]
    print(f"\n{len(rows) - len(bad)}/{len(rows)} pairs pass WCAG AA")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
