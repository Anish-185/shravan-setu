"""Draw the images used by the original DhwaniSarathi screens (screener/assets/images/original/), replacing the
originals, whose source and licence were unknown (ATTRIBUTION.md). Same file names, sizes and subjects.

Made by Team JL: simple flat SVG in our palette (screener/src/ui.tsx) with the setu line (screener/src/art.tsx).
Glyphs marked lu(...) are Lucide 1.59.0 shapes (ISC, screener/licenses/lucide-LICENSE.txt), copied untouched.
No people photos; the figures are generic cartoons.

    python scripts/make_art.py   (needs rsvg-convert and ImageMagick `magick`; dev tools only, not shipped)
"""
import math
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "screener" / "assets" / "images" / "original"

NIGHT, INDIGO, MARIGOLD, CORAL, TEAL = "#1D1A4E", "#3B35B8", "#F4A300", "#EF4E3A", "#006B7A"
LAVENDER, DAWN, PAPER, TINT, SKIN, SKIN2 = "#D9D4FF", "#FFE1A8", "#F7F7FB", "#EEEDF8", "#B97A50", "#9A6038"
SETU = ("M0 70c14 0 18-14 30-14s16 22 30 22 16-30 30-30 18 18 26 18c10 0 18-6 26-12 40-30 90-30 130 0 8 6 16 12 "
        "26 12 12 0 18-10 42-10")  # 360 wide, from src/art.tsx

LUCIDE = {  # lucide-static 1.59.0, icons/<name>.svg, inner markup
    "ear": '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/>',
    "mic": '<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>',
    "audio-lines": '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
    "book-open": '<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>',
    "pencil": '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    "ruler": '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
    "apple": '<path d="M12 6.528V3a1 1 0 0 1 1-1h0"/><path d="M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    "backpack": '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8"/><path d="M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
    "calculator": '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
    "palette": '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
    "music": '<path d="M21 16V3a1 1 0 0 0-1.28-.96l-10 2.917a1 1 0 0 0-.72.96V19"/><circle cx="18" cy="16" r="3"/><circle cx="6" cy="19" r="3"/>',
    "graduation-cap": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    "alarm-clock": '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/>',
    "scissors": '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
    "lightbulb": '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    "flask-conical": '<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/>',
    "star": '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    "notebook-pen": '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
    "shapes": '<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/>',
}


def lu(name, x, y, size, color, sw=2.0, rot=0, flip=False, opacity=1):
    """A Lucide glyph, top-left at (x, y), `size` px square."""
    s = size / 24
    m = f" translate(24 0) scale(-1 1)" if flip else ""
    return (f'<g transform="translate({x} {y}) rotate({rot} {size / 2} {size / 2}) scale({s}){m}" fill="none" '
            f'stroke="{color}" color="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" '
            f'opacity="{opacity}">{LUCIDE[name]}</g>')


def setu(x, y, width, color, sw=3, opacity=1):
    return (f'<path d="{SETU}" transform="translate({x} {y}) scale({width / 360})" fill="none" stroke="{color}" '
            f'stroke-width="{sw * 360 / width}" stroke-linecap="round" opacity="{opacity}"/>')


def waves(cx, cy, r0, n, step, color, sw, a0, a1):
    """Concentric sound arcs around (cx, cy) from angle a0 to a1 (degrees, 0 = right, clockwise)."""
    out = []
    for i in range(n):
        r = r0 + i * step
        p = [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in (a0, a1)]
        out.append(f'<path d="M{p[0][0]:.1f} {p[0][1]:.1f} A{r} {r} 0 0 1 {p[1][0]:.1f} {p[1][1]:.1f}" fill="none" '
                   f'stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>')
    return "".join(out)


def mirror(w, body):
    return f'<g transform="translate({w} 0) scale(-1 1)">{body}</g>'


# A head in profile facing left (500 x 500 box): forehead, nose, lips, chin, neck.
HEAD = ("M290 62C385 62 440 132 440 228C440 298 412 338 402 378L402 470L252 470L252 420C228 422 204 420 188 412"
        "C174 404 176 386 174 372C172 360 156 356 158 344C160 334 170 332 166 324C156 318 148 308 156 298L136 268"
        "C130 260 134 252 142 248L160 236C160 136 206 62 290 62Z")

# Simple flat bell, 128 box.
BELL = "M64 18C42 18 30 36 30 58V78L20 94H108L98 78V58C98 36 86 18 64 18Z"


def make_sure_icons():
    yield "shh.png", 128, 128, None, f'''
      <circle cx="64" cy="66" r="44" fill="{SKIN}"/>
      <path d="M22 58C22 30 40 18 64 18S106 30 106 58C96 44 82 38 64 38S32 44 22 58Z" fill="{NIGHT}"/>
      <circle cx="18" cy="68" r="8" fill="{SKIN}"/><circle cx="110" cy="68" r="8" fill="{SKIN}"/>
      <path d="M42 62q7 5 14 0M72 62q7 5 14 0" stroke="{NIGHT}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M54 90h20" stroke="{NIGHT}" stroke-width="4" stroke-linecap="round"/>
      <rect x="58" y="74" width="12" height="32" rx="6" fill="{SKIN2}" stroke="{NIGHT}" stroke-width="3"/>
      <rect x="50" y="100" width="28" height="22" rx="10" fill="{SKIN2}" stroke="{NIGHT}" stroke-width="3"/>'''
    yield "headphones.png", 128, 128, None, f'''
      <path d="M22 76V62a42 42 0 0 1 84 0v14" fill="none" stroke="{INDIGO}" stroke-width="10" stroke-linecap="round"/>
      <rect x="12" y="66" width="26" height="40" rx="9" fill="{CORAL}" stroke="{NIGHT}" stroke-width="4"/>
      <rect x="90" y="66" width="26" height="40" rx="9" fill="{CORAL}" stroke="{NIGHT}" stroke-width="4"/>
      <path d="M25 106c0 10 8 12 14 16s4 8 4 8" fill="none" stroke="{NIGHT}" stroke-width="4" stroke-linecap="round"/>'''
    yield "mute.png", 128, 128, None, f'''
      <path d="{BELL}" fill="{MARIGOLD}" stroke="{NIGHT}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M52 100a12 12 0 0 0 24 0Z" fill="{MARIGOLD}" stroke="{NIGHT}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="58" y="10" width="12" height="10" rx="4" fill="{NIGHT}"/>
      <path d="M18 112L110 20" stroke="white" stroke-width="16" stroke-linecap="round"/>
      <path d="M18 112L110 20" stroke="{CORAL}" stroke-width="9" stroke-linecap="round"/>'''
    knobs = "".join(f'<path d="M{x} 40V108" stroke="{INDIGO}" stroke-width="5" stroke-linecap="round" opacity=".45"/>'
                    f'<rect x="{x - 9}" y="66" width="18" height="12" rx="4" fill="{INDIGO}"/>' for x in (34, 54, 74, 94))
    yield "equalizer.png", 128, 128, None, f'''
      <rect x="10" y="12" width="108" height="106" rx="14" fill="{TINT}" stroke="{INDIGO}" stroke-width="5"/>
      <path d="M10 30h108" stroke="{INDIGO}" stroke-width="5"/>
      <circle cx="26" cy="21" r="3" fill="{INDIGO}"/><circle cx="38" cy="21" r="3" fill="{INDIGO}"/>
      <path d="M22 72h84" stroke="{MARIGOLD}" stroke-width="3" stroke-dasharray="4 5"/>{knobs}'''
    yield "silence.png", 128, 128, None, f'''
      <path d="{HEAD}" transform="translate(22 12) scale(.21)" fill="{SKIN}"/>
      {waves(54, 84, 8, 3, 8, TEAL, 4, 130, 230)}
      <circle cx="64" cy="64" r="52" fill="none" stroke="{CORAL}" stroke-width="10"/>
      <path d="M27 27L101 101" stroke="{CORAL}" stroke-width="10" stroke-linecap="round"/>'''
    burst = "M40 8L52 30L76 14L72 40L100 38L80 58L104 74L76 76L84 102L60 86L44 108L40 82L14 90L26 66L4 52L30 44L18 20Z"
    yield "noise-pollution.png", 128, 128, None, f'''
      <path d="{burst}" fill="{MARIGOLD}" opacity=".9"/>
      <path d="M40 104V88a32 32 0 0 1 64 0v16" fill="none" stroke="{INDIGO}" stroke-width="8" stroke-linecap="round"/>
      <rect x="30" y="92" width="20" height="30" rx="7" fill="{INDIGO}"/>
      <rect x="94" y="92" width="20" height="30" rx="7" fill="{INDIGO}"/>'''


def test_images():
    yield "microphone.png", 400, 400, None, f'''
      <circle cx="200" cy="200" r="150" fill="{TINT}"/>
      {lu("mic", 104, 92, 192, NIGHT, 1.6)}
      {lu("audio-lines", 20, 160, 70, INDIGO, 2.2)}{lu("audio-lines", 310, 160, 70, INDIGO, 2.2)}
      {waves(200, 180, 120, 2, 22, MARIGOLD, 8, -140, -100)}{waves(200, 180, 120, 2, 22, CORAL, 8, -80, -40)}
      {setu(20, 300, 360, MARIGOLD, 6)}'''
    head = f'''
      <circle cx="250" cy="250" r="232" fill="{TINT}"/>
      <path d="{HEAD}" fill="{INDIGO}"/>
      {waves(330, 232, 64, 3, 22, LAVENDER, 6, -60, 80)}
      {lu("ear", 282, 168, 120, MARIGOLD, 2.4)}
      {setu(40, 410, 200, MARIGOLD, 6, .8)}'''
    yield "left_ear.png", 500, 500, None, head
    yield "right_ear.png", 500, 500, None, mirror(500, head)
    yield "leftear.png", 320, 320, None, lu("ear", 30, 20, 280, NIGHT, 2.4)
    yield "rightear.png", 320, 320, None, mirror(320, lu("ear", 30, 20, 280, NIGHT, 2.4))
    yield "questionmark.jpg", 500, 500, DAWN, f'''
      <circle cx="130" cy="250" r="104" fill="{CORAL}"/><circle cx="370" cy="250" r="104" fill="{TEAL}"/>
      {lu("ear", 66, 180, 128, "white", 2.2)}{mirror(500, lu("ear", 66, 180, 128, "white", 2.2))}
      <path d="M250 40V460" stroke="{NIGHT}" stroke-width="5" stroke-dasharray="14 12" stroke-linecap="round"/>
      <circle cx="250" cy="250" r="62" fill="white" stroke="{NIGHT}" stroke-width="5"/>
      <text x="250" y="284" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="96" font-weight="700"
            fill="{INDIGO}" text-anchor="middle">?</text>
      {setu(70, 380, 360, INDIGO, 5, .5)}'''
    yield "atest_icon.jpg", 500, 500, PAPER, f'''
      <circle cx="250" cy="236" r="170" fill="{INDIGO}"/>
      {lu("ear", 196, 120, 200, "white", 2.2)}
      {waves(206, 230, 60, 3, 26, MARIGOLD, 10, 140, 220)}
      {setu(70, 400, 360, MARIGOLD, 7)}'''
    dots = "".join(f'<circle cx="{x}" cy="{y}" r="5" fill="{INDIGO}" opacity=".18"/>'
                   for x in range(30, 600, 60) for y in range(30, 600, 60))
    yield "ears.jpg", 600, 600, LAVENDER, f'''
      {dots}
      <circle cx="300" cy="300" r="230" fill="white"/>
      {lu("ear", 312, 140, 250, INDIGO, 2.2)}{mirror(600, lu("ear", 312, 140, 250, CORAL, 2.2))}
      <path d="M300 110V490" stroke="{NIGHT}" stroke-width="5" stroke-linecap="round"/>
      {setu(120, 430, 360, MARIGOLD, 7)}'''


def teacher_images():
    doodles = [("pencil", 900, 30, -20, CORAL), ("palette", 1040, 120, 10, MARIGOLD), ("globe", 1060, 330, 0, TEAL),
               ("ruler", 760, 20, 15, INDIGO), ("book-open", 960, 520, -10, INDIGO), ("star", 620, 40, 0, MARIGOLD),
               ("flask-conical", 30, 330, -10, TEAL), ("alarm-clock", 50, 820, 10, CORAL),
               ("lightbulb", 40, 560, 0, MARIGOLD), ("scissors", 280, 1040, 20, INDIGO),
               ("music", 30, 100, 0, CORAL), ("shapes", 1060, 760, 0, TEAL)]
    yield "background.png", 1200, 1200, None, "".join(lu(n, x, y, 120, c, 1.8, r) for n, x, y, r, c in doodles)
    yield "profile.png", 300, 300, None, f'''
      <circle cx="150" cy="150" r="146" fill="white" stroke="{LAVENDER}" stroke-width="6"/>
      <clipPath id="c"><circle cx="150" cy="150" r="140"/></clipPath>
      <g clip-path="url(#c)">
        <path d="M60 300C60 236 96 204 150 204S240 236 240 300Z" fill="{INDIGO}"/>
        <path d="M128 190h44v26a22 22 0 0 1-44 0Z" fill="{SKIN2}"/>
        <circle cx="150" cy="140" r="48" fill="{SKIN}"/>
        <path d="M100 136C100 100 122 84 150 84S200 100 200 136C190 116 174 108 150 108S110 116 100 136Z" fill="{NIGHT}"/>
        <path d="M132 160q18 14 36 0" stroke="{NIGHT}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="132" cy="138" r="5" fill="{NIGHT}"/><circle cx="168" cy="138" r="5" fill="{NIGHT}"/>
      </g>'''
    names = ["book-open", "pencil", "ruler", "apple", "globe", "backpack", "calculator", "palette", "music",
             "graduation-cap", "notebook-pen", "shapes"]
    for i, (bg, fg) in enumerate([(NIGHT, MARIGOLD), (TEAL, "white"), (INDIGO, LAVENDER), (MARIGOLD, NIGHT)]):
        cells = [lu(names[(r * 5 + c + i * 3) % len(names)], c * 160 + (80 if r % 2 else 0) + 30, r * 160 + 30,
                    84, fg, 1.6, (r * 37 + c * 23) % 50 - 25, opacity=.75)
                 for r in range(5) for c in range(-1, 5)]
        yield f"AssignmentImages/{[0, 1, 2, 4][i]}.jpg", 800, 800, bg, "".join(cells)


def render(name, w, h, bg, body, tmp):
    rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    svg = Path(tmp) / "a.svg"
    svg.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
                   f'{rect}{body}</svg>')
    png = Path(tmp) / "a.png"
    subprocess.run(["rsvg-convert", "-w", str(w), "-h", str(h), "-o", png, svg], check=True)
    out = OUT / name
    args = ["-strip", "-quality", "82"] if name.endswith(".jpg") else ["-strip", "-define", "png:compression-level=9"]
    subprocess.run(["magick", png, *args, out], check=True)
    return out


def images():
    yield from make_sure_icons()
    yield from test_images()
    yield from teacher_images()


if __name__ == "__main__":
    only = set(sys.argv[1:])
    with tempfile.TemporaryDirectory() as tmp:
        for name, w, h, bg, body in images():
            if not only or name in only:
                print(render(name, w, h, bg, body, tmp).relative_to(ROOT))
