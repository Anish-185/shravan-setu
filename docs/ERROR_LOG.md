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
