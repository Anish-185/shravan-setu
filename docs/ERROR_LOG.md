# Error log

Every error hit while working, fixed or not (format in `CLAUDE.md`). Step 0 of each phase fixes every entry
that is OPEN, WORKAROUND or NEEDS-HUMAN.

### ERR-001: CORS middleware placed after CommonMiddleware, CommonMiddleware listed twice
- Phase / date: Phase 0 / 2026-10-17
- Symptom: wrong configuration found while reading `server/backend/settings.py`: `corsheaders.middleware.CorsMiddleware` was near the end of `MIDDLEWARE` and `CommonMiddleware` appeared twice.
- Where: `server/backend/settings.py`
- Root cause: inherited from the original repo. django-cors-headers requires `CorsMiddleware` above `CommonMiddleware` so it can add headers to responses that CommonMiddleware returns early (e.g. redirects).
- Fix: moved `CorsMiddleware` directly above `CommonMiddleware` and removed the duplicate entry.
- Status: FIXED
- Verification: `python manage.py check` reports no issues; a preflight `OPTIONS /users/` returns 200 with `access-control-allow-origin: *`.
- Lesson: follow each middleware's documented position instead of appending to the end of the list.

### ERR-002: DisallowedHost in a shell smoke test after moving ALLOWED_HOSTS to the environment
- Phase / date: Phase 0 / 2026-10-17
- Symptom: `django.core.exceptions.DisallowedHost: Invalid HTTP_HOST header: 'testserver'` (all requests returned 400).
- Where: ad-hoc `django.test.Client()` smoke test run through `manage.py shell`.
- Root cause: `ALLOWED_HOSTS` now defaults to `localhost,127.0.0.1` instead of `*`. The test client sends host `testserver`, which only `manage.py test`/pytest-django add automatically. Not a bug in the app.
- Fix: smoke test uses `Client(SERVER_NAME="localhost")`. Real use: add the laptop's LAN IP to `DJANGO_ALLOWED_HOSTS` in `server/.env` (documented in `.env.example`).
- Status: FIXED
- Verification: `/users/`, `/classrooms/`, `/admin/login/` return 200 on a fresh DB.
- Lesson: phones on the LAN hit the server by IP, so the IP must be in `DJANGO_ALLOWED_HOSTS`; remember this in Phase 4 sync testing.

Note: the Django 5.0 → 5.2.18 upgrade and a fresh-DB `migrate` (all 18 `apigateway` migrations) produced no errors,
and `makemigrations --check` reports no model changes.

### ERR-003: `expo lint` reported ESLint too old right after installing it
- Phase / date: Phase 1 / 2026-10-17
- Symptom: `CommandError: npx expo lint requires ESLint version 8.57.0 or greater.` printed right after "Installed eslint@^9.0.0".
- Where: first run of `npx expo lint` in `screener/`
- Root cause: on its first run `expo lint` installs ESLint and then checks the version in the same process, before the new package is resolvable. ESLint 9.39.5 was installed correctly (`node -e "require('eslint/package.json').version"`).
- Fix: none needed; the second run works. No version pinning.
- Status: FIXED
- Verification: `CI=1 npx expo lint` exits 0.
- Lesson: after a tool self-installs a dependency, rerun before treating a version error as real.

### ERR-004: React Compiler lint errors in the spike screen (refs read during render, impure calls, hook value mutation)
- Phase / date: Phase 1 / 2026-10-17
- Symptom: 7 errors from `react-hooks/refs`, `react-hooks/purity` and `react-hooks/immutability` in `src/app/spike.tsx`, e.g. "Cannot access refs during render", "Cannot call impure function during render", "`player` cannot be modified".
- Where: `screener/src/app/spike.tsx`
- Root cause: the template enables the React Compiler (`app.json` → `experiments.reactCompiler`), which memoises render output. Reading refs or calling `Date.now()` where the compiler can't prove it's outside render gives stale UI. Mutating a hook's return value (`player.volume = …`) breaks its immutability assumptions.
- Fix: logs moved from refs to state; samples come from a `setInterval` polling `recorder.getStatus()` (not render); `Date.now()` lives in a module-level `now()` called only from handlers and intervals. `player.volume` assignment is expo-audio's only documented volume API and `player` is a native shared object, not React state, so it sits in one helper with a targeted `eslint-disable-next-line react-hooks/immutability` and a comment explaining why.
- Status: FIXED
- Verification: `npx tsc --noEmit` and `CI=1 npx expo lint` both exit 0; `npx expo export --platform android` bundles (4 WAV assets included).
- Lesson: with the React Compiler on, keep anything time-based or mutable in effects, intervals or handlers, never in render.

### ERR-005: Original tones have no onset/offset ramp (audible clicks)
- Phase / date: Phase 1 / 2026-10-17
- Symptom: `tone_1000Hz_left_um.wav` reaches full scale (peak 32766/32767) within the first 10 samples and stays there until the last sample.
- Where: `screener/assets/tones/*.wav` (copied from `audiometer/app/assets/puretones/`)
- Root cause: the original generator wrote a plain sine with no ramp. Abrupt start and stop make broadband clicks a child may hear and respond to even when the tone itself is inaudible, which would inflate PASS results.
- Fix (proposed; do it in Phase 3 together with `config/screening.json`, which it depends on — Phase 2 Step 0 should leave it OPEN): add `scripts/make_tones.py` (Python stdlib `wave` + `math`) to generate per-ear tones with raised-cosine ramps. Ramp length, duration, sample rate and peak level go in `config/screening.json` with a `source` field (ramp duration: TODO(source), cite a pure-tone audiometry standard). Add a test that checks the first and last ramp windows rise and fall smoothly.
- Status: OPEN
- Verification: (to add) test on the generated WAVs.
- Lesson: check stimulus files, not just code, when reusing audio assets.

### ERR-006: pytest could not load settings (`ImportError: Set DJANGO_SECRET_KEY`)
- Phase / date: Phase 2 / 2026-10-17
- Symptom: `ImportError: Set DJANGO_SECRET_KEY (copy server/.env.example to server/.env).` when running pytest without a `.env`.
- Where: `server/conftest.py` (first attempt)
- Root cause: pytest-django imports the settings module during plugin start-up, before the root `conftest.py` that set a test key was executed.
- Fix: `server/backend/test_settings.py` sets a throwaway key and then imports the real settings; `server/pytest.ini` points `DJANGO_SETTINGS_MODULE` at it. The production rule (no key = refuse to start) is unchanged.
- Status: FIXED
- Verification: `env -u DJANGO_SECRET_KEY .venv/bin/python -m pytest` passes with no `server/.env`.
- Lesson: anything needed at settings-import time must live in the settings module chain, not in conftest.

### ERR-007: camp export URLs returned 301 redirects
- Phase / date: Phase 2 / 2026-10-17
- Symptom: `assert (301 == 200)`; redirect to `.../export.csv/`.
- Where: `referrals/views.py` `@action(url_path="export.csv")`, tests in `referrals/tests/test_api.py`
- Root cause: DRF's DefaultRouter adds a trailing slash to every route, and Django's `APPEND_SLASH` redirected the slash-less URL.
- Fix: routes renamed to `/api/camp-requests/<id>/csv/` and `/pdf/` (with the router's slash).
- Status: FIXED
- Verification: `test_camp_export_csv`, `test_camp_export_pdf` pass; checked against a live `runserver`.
- Lesson: let the router own URL shape; don't put file extensions in DRF action paths.

### ERR-008: two API tests encoded wrong expectations
- Phase / date: Phase 2 / 2026-10-17
- Symptom: (1) `'not allowed' in 'Case matching query does not exist.'`; (2) CSV first line was `"SCREENING, NOT DIAGNOSIS"` with quotes.
- Where: `referrals/tests/test_api.py`
- Root cause: (1) the test broke a consent, which correctly made every dependent record (session, result, case, event) fail too, so the illegal event never reached the state machine. (2) Correct CSV quotes a field that contains a comma; the test compared raw lines.
- Fix: (1) split into `test_sync_reports_per_record_errors` (mixed batch against an existing case) and a new `test_sync_dependent_records_fail_together` (failure cascades, then succeeds on retry). (2) the test parses with `csv.reader`. Code unchanged in both cases; the tests were wrong.
- Status: FIXED
- Verification: 119 passed.
- Lesson: when a test fails, check whether the expectation or the code is wrong before changing either.

### ERR-009: `pkill -f` / `pgrep -f` killed its own shell (exit 144)
- Phase / date: Phase 2 / 2026-10-17
- Symptom: shell exited with code 144 while stopping a test `runserver`.
- Where: ad-hoc shell command during the end-to-end check
- Root cause: the `-f` pattern also matched the shell command line that contained the same text.
- Fix: use a bracket pattern such as `pgrep -f "[r]unserver 127.0.0.1:8765"`.
- Status: FIXED
- Verification: server confirmed stopped.
- Lesson: never `pkill -f` with a pattern that appears literally in your own command.
