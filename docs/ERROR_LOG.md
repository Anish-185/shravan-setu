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
