# Cost and licences

Rule: the software costs nothing to build, run, demo, or hand to a school. Every dependency is listed with its
licence, its cost (must be 0) and whether it makes network calls.

## Server (`server/requirements.txt`)

Licences read from each package's installed metadata (Phase 0).

| Package | Version | Licence | Cost | Network calls |
|---|---|---|---|---|
| Django | 5.2.18 | BSD-3-Clause | 0 | None (serves HTTP only) |
| djangorestframework | 3.18.3 | BSD-3-Clause | 0 | None |
| django-cors-headers | 4.9.0 | MIT | 0 | None |
| python-dotenv | 1.2.4 | BSD-3-Clause | 0 | None |
| asgiref | 3.12.1 | BSD-3-Clause | 0 | None |
| sqlparse | 0.6.0 | BSD-3-Clause | 0 | None |
| tzdata (Windows only) | 2026.5 | Apache-2.0 | 0 | None |

Dev only (`server/requirements-dev.txt`): pytest 9.1.1 (MIT), pytest-django 4.14.0 (BSD-3-Clause), plus their
dependencies pluggy (MIT), iniconfig (MIT), packaging (Apache-2.0 OR BSD-2-Clause), pygments (BSD-2-Clause). No network calls.

Not added: reportlab (would pull in Pillow, ~26 MB installed). The camp-request PDF uses our own writer, `referrals/pdf.py`.

Removed from the original pins: `pytz` and `typing_extensions` (no longer required by Django 5.2 or our code).

Runtime: Python 3.12 + SQLite on a laptop. No cloud hosting, no database service.

### Evaluation only (`requirements-eval.txt`, laptop, never the app or server runtime)

| Package | Version | Licence | Cost | Network calls |
|---|---|---|---|---|
| pandas | 3.0.6 | BSD-3-Clause | 0 | None (reads local XPT files) |
| numpy (pandas dependency) | 2.5.4 | BSD-3-Clause (bundled libraries: BSD/MIT-style) | 0 | None |
| python-dateutil (pandas dependency) | 2.9.0.post0 | Apache-2.0 OR BSD-3-Clause | 0 | None |
| six (dateutil dependency) | 1.17.0 | MIT | 0 | None |
| `scripts/eval_nhanes.py --download` | ours | Apache-2.0 | 0 | **Only when run with `--download`**: 8 public files from `wwwn.cdc.gov` (NHANES), checked against pinned SHA-256. No account or key |

~110 MB installed (over the 5 MB rule; owner-approved 2026-10-19 because it never ships). `scripts/simulate_district.py`
and `scripts/cost_model.py` use the standard library only.

## Mobile app (`screener/`)

Expo SDK 57 (downgraded from 58 for Play Store Expo Go, ERR-014). Licences read from each package's installed `package.json`. Runs in the free Expo Go app;
no Expo account needed for local development.

| Package | Version | Licence | Cost | Network calls |
|---|---|---|---|---|
| expo | 57.0.30 | MIT | 0 | Dev server only (laptop ↔ phone on LAN). None in the app code |
| expo-router | 57.0.28 | MIT | 0 | None |
| expo-audio | 57.0.5 | MIT | 0 | None (local assets) |
| expo-file-system | 57.0.7 | MIT | 0 | None (local files) |
| expo-sharing | 57.0.23 | MIT | 0 | None (opens the Android share sheet) |
| expo-device | 57.0.2 | MIT | 0 | None |
| expo-sqlite | 57.0.4 | MIT | 0 | None (local database file) |
| expo-crypto | 57.0.4 | MIT | 0 | None (`randomUUID()` for client-generated ids) |
| expo-secure-store | 57.0.4 | MIT | 0 | None (stores the backend token in Android Keystore) |
| App code: sync and downloads (`src/db/sync.ts`, `src/app/settings.tsx`, `src/app/camp.tsx`) | ours | Apache-2.0 | 0 | **Only when the teacher taps Log in, Sync or Download PDF**: HTTP to the team's own laptop backend on the LAN (`/api/token/`, `/api/schools/`, `/api/facilities/`, `/api/sync/`, `/api/cases/`, `/api/camp-requests/<id>/pdf/`). No third-party host |
| expo-asset | 57.0.20 | MIT | 0 | None (required peer of expo-audio, flagged by expo-doctor) |
| expo-constants, expo-font, expo-image, expo-linking, expo-splash-screen, expo-status-bar, expo-symbols, expo-system-ui, expo-web-browser, expo-glass-effect, @expo/ui | 57.x | MIT | 0 | None (template defaults; unused ones may be removed later) |
| react / react-dom | 19.2.3 | MIT | 0 | None |
| react-native | 0.86.3 | MIT | 0 | None |
| react-native-gesture-handler, -reanimated, -worklets, -safe-area-context, -screens, -web | template | MIT | 0 | None |
| typescript (dev) | 6.0.3 | Apache-2.0 | 0 | None |
| eslint, eslint-config-expo (dev) | 9.39.5 / 57.0.2 | MIT | 0 | None |
| jest, jest-expo, @types/jest, @types/node (dev) | 29.7.0 / 57.0.6 / 29.5.14 / 26.6.5 | MIT | 0 | None |
| react-native-svg (design pass, `docs/DESIGN.md`) | 15.15.4 | MIT | 0 | None (draws icons and artwork on the phone) |
| @noble/hashes (Phase 7 audit log) | 2.4.0 | MIT | 0 | None (synchronous SHA-256 on the phone; no dependencies, no install scripts) |
| Fonts: Hind Guntur (3 weights), Tiro Telugu (+ Italic), Baloo Tammudu 2 SemiBold, bundled in `assets/fonts/` (2.6 MB) | — | SIL OFL 1.1 | 0 | None (loaded from the app bundle) |
| Lucide icon shapes in `src/icons.tsx` | 1.59.0 | ISC (+ MIT for Feather-derived icons) | 0 | None |

The design pass (Direction B v2) added one dependency, `react-native-svg` (in Expo Go). fontTools was used once on
the laptop to make the Baloo SemiBold instance and is not shipped.

Phase 5 added **no new dependency**. Not added, on purpose: `expo-print` (the camp request PDF is made by the server),
i18next / react-i18next (a ~40-line helper covers two languages), `@expo-google-fonts/noto-sans-telugu` (Android's
system Telugu font first; see `docs/REUSE_LOG.md`). Voice lines are plain MP3 recordings played by `expo-audio` (already a
dependency); no network call.

**Transitive packages with licences outside our allowlist** (all build or dev tooling pulled in by Expo, Babel or
ESLint; none added by us; none is GPL-only). Pending owner approval:

| Package | Licence | Pulled in by | Assessment |
|---|---|---|---|
| lightningcss (+ platform binary) | MPL-2.0 | `@expo/metro-config` (bundler) | File-level weak copyleft. Build tool only, used unmodified |
| node-forge | BSD-3-Clause OR GPL-2.0 | `@expo/cli` (code signing) | Dual licence; we take it under BSD-3-Clause |
| caniuse-lite | CC-BY-4.0 | Babel `browserslist` | Data file, build time only. CC-BY is allowed for media |
| argparse | Python-2.0 | `js-yaml` ← ESLint | Permissive. Dev only |
| glob, minimatch, minipass, path-scurry, lru-cache, sax | BlueOak-1.0.0 | various CLI tools | Permissive (similar to MIT) |
| jsc-safe-url | 0BSD | Metro | Public-domain-like |

## Original app (`audiometer/`, not used by us)

For transparency: the original app depends on Firebase (account + project), the Clarifai API (API key) and a
third-party Hugging Face Space (network). All three are banned by our zero-cost policy and none are used in `screener/`.

## Real deployment costs (not hidden)

These are not software costs but they are real. Proposed plan for a future pilot (not tested in any school); full
model and scenarios: `docs/COST_MODEL.md`, numbers from `scripts/cost_model.py` (inputs in `config/cost_model.json`).

| Item | Cost | Notes |
|---|---|---|
| Budget Android phone | Rs 10,000, assumed lifespan 3 years | Team estimate, online retail price, Oct 2026. Scenario A (recommended) buys one per ~250 students |
| Wired earphones with inline mic | Rs 400, assumed lifespan 1 year | Team estimate, online retail price, Oct 2026. Replacements must be the same model |
| Teacher / screener time | ~5 min per child (planning input) | Reported in minutes; rupee value TODO(source), optional (screening may be part of existing school-health duties) |
| Laptop for the backend | TODO(source) | Often already available at the school or block office |
| SMS / IVR reminders | TODO(source) | Future cost only; stubbed (logged, not sent) in this version |
| Telugu text and voice recordings | TODO(source) | [TELUGU_SPEAKER]'s time: 160+ UI texts, 5 triage questions, 1 reminder, 5 voice lines (`docs/TELUGU_STRINGS.md`, `docs/VOICE_SCRIPT.md`); one-off |

npm 11 blocks dependency install scripts by default. Two are blocked in `screener/`: `unrs-resolver` (postinstall that
fetches a fallback native binary for ESLint's import resolver) and `@parcel/watcher` (build-from-source fallback; the
prebuilt binary is used). Both left blocked; lint and jest work without them.
