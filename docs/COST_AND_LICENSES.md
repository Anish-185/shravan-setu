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

## Mobile app (`screener/`)

Expo SDK 58. Licences read from each package's installed `package.json` (Phase 1). Runs in the free Expo Go app;
no Expo account needed for local development.

| Package | Version | Licence | Cost | Network calls |
|---|---|---|---|---|
| expo | 58.0.14 | MIT | 0 | Dev server only (laptop ↔ phone on LAN). None in the app code |
| expo-router | 58.0.23 | MIT | 0 | None |
| expo-audio | 58.0.9 | MIT | 0 | None (local assets) |
| expo-file-system | 58.0.9 | MIT | 0 | None (local files) |
| expo-sharing | 58.0.19 | MIT | 0 | None (opens the Android share sheet) |
| expo-device | 58.0.5 | MIT | 0 | None |
| expo-asset | 58.0.16 | MIT | 0 | None (required peer of expo-audio, flagged by expo-doctor) |
| expo-constants, expo-font, expo-image, expo-linking, expo-splash-screen, expo-status-bar, expo-symbols, expo-system-ui, expo-web-browser, expo-glass-effect, @expo/ui | 58.x | MIT | 0 | None (template defaults; unused ones may be removed later) |
| react / react-dom | 19.3.0 | MIT | 0 | None |
| react-native | 0.88.0 | MIT | 0 | None |
| react-native-gesture-handler, -reanimated, -worklets, -safe-area-context, -screens, -web | template | MIT | 0 | None |
| typescript (dev) | 6.0.3 | Apache-2.0 | 0 | None |
| eslint, eslint-config-expo (dev) | 9.39.5 / 58.0.4 | MIT | 0 | None |
| jest, jest-expo, @types/jest, @types/node (dev) | 30.5.2 / 58.0.11 / 30.0.0 / 26.6.5 | MIT | 0 | None |

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

These are not software costs but they are real. Values are TODO(source) until we have local prices; the
cost model (Phase 6) takes them as inputs.

| Item | Cost | Notes |
|---|---|---|
| Android phone (`[PHONE_MODEL]`) | TODO(source) | One per screening team; amortised over its lifespan |
| Wired earphones (`[EARPHONE_MODEL]`) | TODO(source) | Replacement rate TODO |
| Teacher / screener time | TODO(source) | Minutes per child × local wage |
| Laptop for the backend | TODO(source) | Often already available at the school or block office |
| SMS / IVR reminders | TODO(source) | Future cost only; stubbed (logged, not sent) in this version |

npm 11 blocks dependency install scripts by default. Two are blocked in `screener/`: `unrs-resolver` (postinstall that
fetches a fallback native binary for ESLint's import resolver) and `@parcel/watcher` (build-from-source fallback; the
prebuilt binary is used). Both left blocked; lint and jest work without them.
