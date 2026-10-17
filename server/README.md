# server/

Django 5.2 LTS + DRF + SQLite, runs on a laptop. `apigateway/` is the original team's app; `referrals/` is ours.
Screening and referral tool, not a diagnostic device.

```
uv venv -p 3.12 .venv                                  # or: python3.12 -m venv .venv
uv pip install -p .venv/bin/python -r requirements-dev.txt
cp .env.example .env                                   # then set DJANGO_SECRET_KEY
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo                   # fake demo school; prints an API token
.venv/bin/python manage.py runserver 0.0.0.0:8000      # add the laptop's LAN IP to DJANGO_ALLOWED_HOSTS
.venv/bin/python -m pytest                             # tests (no .env needed)
```

`requirements.in` lists direct dependencies; `requirements.txt` is the pinned lock
(`uv pip compile --universal requirements.in -o requirements.txt`).
