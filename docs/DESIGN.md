# Design brief: Shravan Setu visual polish (Step 1, awaiting owner's pick)

Scope is visual and interaction design only. No changes to test logic, rules, config, data, sync or timing. The
starting point is tagged `pre-polish` (commit `bbb435314c7e7fb871481791a5513eb6afeed37a`, pushed). Every polish
commit uses the `style:` prefix, so the whole pass can be rolled back with one `git revert` range or a branch from the
tag.

This is a screening and referral tool, never a diagnosis. Nothing in this pass changes that wording or hides it.

## 1. Research

### Awwwards: how work is judged

From Awwwards' own evaluation page (awwwards.com/about-evaluation, read 2026-10-19):

- Four criteria, weighted: **Design 40%, Usability 30%, Creativity 20%, Content 10%.**
- At least 18 jury members score each site. The three scores furthest from the average are dropped.
- Honorable Mention needs a jury score of 6.5 or more. Site of the Day goes to the highest-scored site of the day.
  Developer Award needs a developer-jury score above 7.
- The most recent annual winners page lists Site of the Year: Lando Norris; Developer Site of the Year: Messenger.
- **Awwwards has no app category.** "Awwwards for apps" means applying the same four criteria to a phone app.

I couldn't view winning sites visually: the Chrome extension wasn't connected this session. So the lessons below
come from the rubric itself, not from an analysis of winners:

| Criterion | What it rewards | What it means for us |
|---|---|---|
| Design 40% | Visual craft: typography, colour, spacing, consistency, detail | One type family that is as good in Telugu as in English. A real token system. Nothing default-looking |
| Usability 30% | Navigation, speed, accessibility, works on the target device | Budget Android, 48 dp targets, AA contrast, no jank, no cut-off Telugu. A teacher finishes a child in ~5 min |
| Creativity 20% | A memorable idea that belongs to this product | One signature idea about sound and hearing, used with restraint, not decoration everywhere |
| Content 10% | Clear, useful words | Plain teacher language, almost no words in child mode, honest result wording |

The point we take most seriously: award-level work spends its boldness in **one** place and keeps everything else
disciplined. For us that place is child mode (the balloon and the sky). Teacher screens stay calm.

### Sarvam AI and ElevenLabs: principles, not copies

I downloaded both home pages and their stylesheets to read the actual fonts, colours and radii (not to reuse them):

| | Sarvam (sarvam.ai) | ElevenLabs (elevenlabs.io) |
|---|---|---|
| Type | Matter (sans) for text, Season Mix for display, a mono for code | Waldenburg (display), Inter (text), Geist Mono (small labels) |
| Base colours | Near-neutral greys: #131313, #F5F5F5, #FAFAFA, #F0F0F0 | Warm off-whites and greys: #FDFCFC, #F5F3F1, #EBE8E4, #D7D2CC, #777169 |
| Accent | Pastel tints (#BED2FF blue, #C8E4B0 green, #FFF7F0 peach) plus one strong orange #F9730C | Mostly monochrome, with saturated blues (#2B7FFF, #0A59D2) used sparingly |
| Shape | Pill buttons (999px), large card radii | Pill buttons (9999px), radii from 8 to 24 px, depending on the element |

Principles we take:

1. **Confident type does the work.** Both let large, well-set headings carry the page, with few boxes or lines.
   We do the same with a Telugu-first family.
2. **Neutral base, colour with a job.** Both sit on a quiet base and spend saturated colour only where it means
   something. For us that's the outcome badges and child mode.
3. **Generous space.** Few elements per screen, big gaps between groups and small gaps within them.
4. **Shape hierarchy.** Pills for actions and chips, larger soft radii for cards. Radius is not one value
   everywhere.
5. **Sound made visible, quietly.** Voice companies show sound as calm forms, not equaliser clichés. We use soft
   ripples and curves.

What we won't take: their logos, wordmarks, illustrations, product imagery, page layouts or proprietary fonts
(Matter, Season Mix and Waldenburg are commercial; we use OFL fonts only).

### Tools used

- **frontend-design skill** (Anthropic, Apache-2.0): already installed here as a Claude Code plugin
  (`frontend-design@claude-plugins-official`) and used for this brief. Its process shaped the brief: build a token
  plan first, check it against common AI-design defaults, spend boldness in one place.
- **apple-design skill**: already installed locally. Used for motion principles: springs, interruptible animation,
  reduced motion.
- No other skill would genuinely help, so none were installed.

## 2. Constraints that shape every choice

- **Test integrity comes first.**
  - No animation may delay a tone, a tap timestamp or the engine's timers. Animations run on the UI thread
    (Reanimated worklets or native-driver Animated); the engine's JS timers stay untouched.
  - The tap is recorded in `onPressIn` before any visual feedback, as today.
  - The balloon's hit area is fixed and large; only the drawing inside it floats.
- **Silence.** No UI sounds. **No haptics during the tone test**: a phone's vibration motor is audible next to an
  earphone and could mask a faint tone. Light haptics only on teacher screens (for example, result saved).
- **Budget Android.**
  - Static fonts and SVG only, no blur effects, no images over about 200 KB.
  - Total new assets under 3 MB (estimate in section 5).
  - Must be smooth on the Redmi 2201117TI.
- **Telugu is first-class.**
  - Telugu glyphs stack vowel signs and conjuncts above and below the line, so line heights are set for Telugu and
    English uses the same, never the other way round.
  - No fixed heights on text, no letter-spacing on Telugu text, no all-caps labels.
  - Every text container can grow; long labels wrap instead of truncating.
- **Accessibility.**
  - WCAG AA contrast or better for all text: 4.5:1 for normal text, 3:1 for large.
  - 48 dp minimum tap targets. Body text at least 16 dp.
  - Outcomes always use colour + icon + text.
  - Reduced-motion setting respected.
- **Never softened.** The "Screening only, not a diagnosis" banner and the UNCALIBRATED warning keep at least their
  current prominence on every screen they're on now.
- **Offline.** Every font, icon and picture is bundled. No remote URLs.

## 3. Shared across both directions

### Outcome system (colour-blind tested)

| Outcome | Badge fill | Text on fill | Tint (cards) | Text on tint | Icon |
|---|---|---|---|---|---|
| PASS | #006B7A teal | white, 6.2:1 | #DDF2F4 | #005F6B, 6.3:1 | check in a circle |
| RETEST | #F2B33D amber | ink #13294B, 7.8:1 | #FFF0D1 | #7A4F00, 6.3:1 | circular arrow |
| REFER | #B23C00 vermillion | white, 5.9:1 | #FCE6D9 | #A33A00, 5.5:1 | arrow out of a box (sent onward) |

Why teal and not green for PASS:

- I simulated the colours for colour-blind viewers (Machado et al. 2009 matrices).
- With a bluish green (#00785A), PASS and REFER became close for protan viewers (colour difference ΔE 35).
- Teal raises that to 61, and to 77 for deutan viewers.
- RETEST is told apart from REFER mainly by lightness (pale amber with dark text against deep vermillion with white
  text) and by its icon.
- These are design checks, not claims. Step 2 adds `scripts/check_contrast.py`, which checks every token pair for
  AA, so the figures can be reproduced.

The outcome word stays in English capitals in both languages ("PASS / RETEST / REFER") because that is how the
strings define it today. The Telugu explanation sits under it, from `strings.json`.

### Banners

- **Screening only:** a full-width rounded strip at the top of the screen.
  - Info icon, ink text on a pale tint, and a 1.5 dp ink-tinted border.
  - Same position on every screen that has it now.
- **UNCALIBRATED:** a vermillion-bordered block with a warning-triangle icon and bold dark-vermillion text.
  - It sits directly under the outcome badge, before the reasons. Never collapsed, never below the fold on the
    result screen.

### Test flow structure

- Step indicator with five numbered dots, as today: 1 Consent, 2 Earphones, 3 Left/right, 4 Quiet room, 5 Test.
  - Only the current step's label is written out, on its own full-width line, so long Telugu labels never squeeze.
  - Done steps get a tick. Accessibility label: "Step 3 of 5, Left/right".
- During the test: a thin rounded progress bar from `snap.done / snap.total`, under the balloon.

### Strings and Telugu

- New visible strings get `te: "TODO_TE"` and fall back to English visibly, per CLAUDE.md. They're listed for the
  Telugu reviewer.
  - Examples: "Developer", the five step labels if they don't exist yet, "Well done!".
  - The Telugu form of the app name "Shravan Setu" is also a human task.
- I write no Telugu.

### Not used, and why

- **Lottie:** `lottie-react-native` 7.3.8 is in Expo Go, but every animation here is simple enough for Reanimated.
  Most free Lottie files carry the "Lottie Simple License" rather than an allowlisted licence. Skipped.
- **unDraw:** its own custom licence, not on our allowlist, and its style is widely recognisable.
- **Open Peeps** (CC0): fine to use, but we don't need people. CLAUDE.md also points away from showing children.
- All illustration is original SVG drawn for this app: sky, clouds, balloon, ripples, the app icon.

## 4. Two directions

### Direction A: "Open Sky" (recommended)

**Mood:** a clear morning outside a school. Calm, airy and trustworthy on teacher screens. In child mode the same sky
opens up in full colour with a big balloon. One world, two moods: teacher screens are the pale, high sky; child mode
is the whole sky down to a warm horizon.

**Signature idea:** sound as **ripples**: soft concentric arcs spreading from a point. They appear in three places
only:

- the Home header
- the app icon
- the "heard it" echo when a child taps the balloon

**Palette**

| Role | Name | Hex |
|---|---|---|
| Text, icons | Ink | #13294B (13.5:1 on Mist) |
| Background | Mist | #F2F7FC |
| Surfaces, cards | Cloud | #FFFFFF |
| Primary actions | Monsoon | #2456C9 (white text 6.5:1) |
| Secondary text | Slate | #4E6280 (5.8:1 on Mist) |
| Lines, borders | Haze | #D9E4F1 |
| Child sky, top | Sky | #BEE1FF |
| Child sky, horizon | Dawn | #FFE3CC |
| Sun | Sun | #FFD36E |
| Balloon | Coral | #E8553F, highlight #FF8A70, shade #C23B2A |

**Fonts**

- **Anek Telugu** (Ek Type, OFL) for all teacher UI, in both scripts.
  - Ek Type designed its Telugu and Latin together, so mixed lines (a Telugu sentence with "PASS" or a phone model)
    look like one voice.
  - We'd make static Regular 400, Medium 500 and SemiBold 600 files from the variable font with fontTools, because
    variable axes are unreliable in React Native on Android. That still needs checking on the phone.
- **Baloo Tammudu 2** (Ek Type, OFL), SemiBold, only in child mode and the end celebration.
  - Rounded and friendly, with Telugu and Latin. Same foundry, so shaping matches.
- Scale (dp, size/line height, line height set for Telugu):

  | Style | Size / line height | Weight |
  |---|---|---|
  | Display | 32/44 | SemiBold |
  | Title | 24/34 | SemiBold |
  | Heading | 20/30 | Medium |
  | Body | 17/28 | Regular |
  | Small | 14/22, the minimum | Regular |
  | Child word | 28/40 | Baloo |

- Weights are separate font families, never `fontWeight`, which Android ignores for custom fonts.

**Icons:** Phosphor (MIT). Regular weight on all screens; Duotone with a Monsoon fill only on the three Home cards.
Rounded line ends match Anek's soft corners. About 16 icons, copied as SVG paths into one file with the licence
header. No icon font.

**Illustration:** flat, original vector shapes with soft curves. No outlines, no gradients except the child-mode sky.

- Clouds are three overlapping circles.
- The balloon is a rounded teardrop with a highlight crescent and a curly string.

**Motion principles**

- Springs for anything the user touches: buttons scale to 0.97 and spring back.
- One orchestrated moment per screen at most. On Home: one slow ripple when it opens (1.2 s), then still.
- Step changes: an 8 dp slide plus crossfade, 220 ms.
- Progress bar: the width animates over 300 ms.
- Child mode:
  - The balloon floats ±6 dp with a ±1.5° sway on a 3.2 s sine loop, on the UI thread.
  - Tap: squash to 0.9, spring back, and one ripple ring spreads from the balloon (400 ms).
  - End: the balloon drifts up, 14 paper confetti pieces in palette colours fall, and "Well done!" appears in Baloo.
    About 1.5 s, silent.
- Reduced motion: no float, no confetti. A static star badge instead.

**Home**

```
┌──────────────────────────────────┐
│ ◌◌◌ (ripples, Haze, top-right)   │
│ Shravan Setu          [EN | తె]  │ ← Display, Ink; the toggle is a pill
│ School hearing screening and     │ ← Body, Slate
│ referral. Works offline.         │
│ ┌ⓘ Screening only, not a diagnosis┐│
│ ┌──────────────────────────────┐ │
│ │ (ear icon)  Screen a child   │ │ ← primary card: Monsoon fill, white text
│ └──────────────────────────────┘ │
│ ┌─────────────┐ ┌──────────────┐ │
│ │ (folder)    │ │ (cloud-sync) │ │ ← Cloud cards, Ink
│ │ Referral    │ │ Sync         │ │   (stack into one column when the
│ │ cases  [3]  │ │ 2 waiting    │ │    Telugu label is long)
│ └─────────────┘ └──────────────┘ │
│ (gear) Settings                  │ ← quiet row; Developer section inside
└──────────────────────────────────┘
```

**Result**

```
┌──────────────────────────────────┐
│ ┌ⓘ Screening only, not a diagnosis┐│
│ Student A1                       │
│        ╭──────────────╮          │
│        │   ⤴  REFER   │          │ ← big pill badge: icon + word, vermillion
│        ╰──────────────╯          │
│ Left ear: REFER   Right ear: PASS│ ← small badges with the same icon system
│ ┌⚠ UNCALIBRATED test level ... ┐ │ ← never hidden
│ ┌ Why ─────────────────────────┐ │
│ │ • No response at 4000 Hz …   │ │ ← reasons card, Cloud, Body
│ └──────────────────────────────┘ │
│ (triage form, as today)          │
│ [ Export session ]  ( Done )     │
└──────────────────────────────────┘
```

**Child mode**

```
┌──────────────────────────────────┐
│  sky gradient (Sky → Dawn)       │
│   ☁            ☀            ☁    │ ← clouds drift slowly; sun still
│            ╭──────╮              │
│           │ ◜     │              │ ← big coral balloon floats gently
│           │        │             │   (whole upper area is the tap target)
│            ╰──┬───╯              │
│               ﹏                  │ ← curly string
│      I heard a beep              │ ← Baloo, 28 dp, Ink
│   ▓▓▓▓▓▓▓▓░░░░░░░  7 / 18        │ ← progress, rounded
└──────────────────────────────────┘
```

**Why it fits:**

- Calm teacher screens read as a health tool: a blue-led, cool, clean palette.
- The sky ties the two moods together.
- Anek Telugu gives Telugu the same care as English.
- The ripple is about hearing, and it appears only three times.

### Direction B: "Setu Line"

**Mood:** editorial and warm, like a beautifully printed school book. More expressive teacher screens; a soft
dawn-lit child mode.

**Signature idea:** one continuous hand-drawn-feeling line, a sound wave that rises into a bridge arch (setu means
bridge). It's used in five places:

- **Logo:** the line is the logo.
- **Home:** it runs across the header.
- **Step indicator:** the steps sit on the arch like posts, and a dot travels along it.
- **Result card:** it divides the outcome from the reasons.
- **Child mode:** the line becomes the balloon's string.

It ties the visual to the pitch: the bridge from screening to treatment.

**Palette**

| Role | Name | Hex |
|---|---|---|
| Text, header band | Night indigo | #1D1A4E (15.0:1 on Paper) |
| Background | Paper (cool, not cream) | #F7F7FB |
| Surfaces | White | #FFFFFF |
| Primary actions | Indigo | #3B35B8 (white text 8.8:1) |
| Accent | Marigold | #F4A300 (only with indigo text, 7.7:1) |
| Secondary text | Dusk | #5B5A7A (6.2:1) |
| Lines | Lilac line | #E2E1EE |
| Child sky | Lavender to marigold dawn | #D9D4FF → #FFE1A8 |
| Balloon | Coral | #EF4E3A |

**Fonts**

- **Tiro Telugu** (Tiro Typeworks, OFL), a serif with calligraphic Telugu and matching Latin, for titles at 22 dp and
  up only.
- **Hind Guntur** (Indian Type Foundry, OFL), five static weights so no instancing is needed, for body and UI.
- **Baloo Tammudu 2** for child mode, as in A.
- Same scale as A, with titles in Tiro.

**Icons:** Lucide (ISC), thin 1.75 px lines, to match the drawn line.

**Illustration:** the line itself plus flat shapes. Child mode: a lavender dawn, a marigold sun, coral balloon.

**Motion principles:**

- On Home open, the line draws itself once (stroke animation, 900 ms).
- In the step indicator, a dot glides along the arch to the next post.
- Child mode: the same float, tap and celebration as A, with marigold confetti.

**Home:** an indigo header band with the line drawn across it and "Shravan Setu" in Tiro, set in Marigold and
white; a full-width "Screen a child" card below, then text-led rows for cases, sync and settings, divided by thin
lilac lines.

**Result:** the same outcome badge system; the card divided by a short arch of the line; Tiro for the child's name.

**Child mode:** a lavender-to-marigold dawn, a marigold sun low on the horizon, and the balloon with the line as its
string.

**Risks:**

- Tiro Telugu has one weight, so hierarchy rests on size alone.
- A serif Telugu at small sizes is harder to read on a budget screen, which is why it's limited to 22 dp and up.
- An indigo-and-marigold editorial look reads less like a clinical tool to teachers.
- The self-drawing line needs animated SVG paths: more work, more to test on the phone.
- Two Telugu families from different foundries can mismatch in mixed lines.

## 5. Recommendation: Direction A, "Open Sky"

It is stronger on the criteria that carry the most weight:

- **Usability (30%):** a calm, clinical-feeling teacher UI; one harmonised family for Telugu and English, with three
  real weights.
- **Design (40%):** a consistent system with less risk.

It still has a clear creative idea: the sky that opens up in child mode, and the ripple as the mark of hearing.

B's bridge line is the more conceptual idea. If you like it, it can be A's app-icon mark (ripples closing into an
arch) without taking B's editorial style. Say so when you pick.

**Asset estimate for A (target under 3 MB):**

| Asset | Estimate |
|---|---|
| Anek Telugu, 3 static weights | ~1.2–1.5 MB (measured after instancing; I'll subset to Latin + Telugu if larger) |
| Baloo Tammudu 2, 1 weight | ~0.4 MB |
| Icons (SVG paths in code) | < 20 KB |
| Illustrations (SVG in code) | < 15 KB |
| New app icon and splash PNGs | ~0.2 MB, replacing the current ones |

**New dependencies for Step 2:**

- `react-native-svg` (MIT, in Expo Go)
- `expo-haptics` (MIT, in Expo Go)

Both are installed with `npx expo install`, logged in `docs/REUSE_LOG.md` and `docs/COST_AND_LICENSES.md`. Neither
makes a network call.

Gradients use react-native-svg, so `expo-linear-gradient` isn't needed. The fontTools library is used once on the
laptop to make the static font files and isn't shipped.

## 6. Step 2 plan (after your pick)

1. Design tokens and components in `screener/src/ui.tsx`, with fonts loaded under the splash screen.
2. Home, with Audio spike and Calibration moved to Settings → Developer.
3. Test flow: step indicator, transitions, progress bar.
4. Child mode: balloon, float, tap echo, silent celebration.
5. Result: outcome badges.
6. Cases, camp request, sync and settings: chips and cards.
7. App icon and splash.
8. `scripts/check_contrast.py`.

Each piece is its own `style:` commit. All suites run before each push. No change to engine, rules, config, db, sync
or timing files.
