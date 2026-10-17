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

Removed from the original pins: `pytz` and `typing_extensions` (no longer required by Django 5.2 or our code).

Runtime: Python 3.12 + SQLite on a laptop. No cloud hosting, no database service.

## Mobile app (`screener/`)

Not scaffolded yet (Phase 1).

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
