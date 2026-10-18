# server/

Django 5.2 LTS + DRF + SQLite, runs on a laptop. `apigateway/` is the original team's app; `referrals/` is ours.
Screening and referral tool, not a diagnostic device.

```
uv venv -p 3.12 .venv                                  # or: python3.12 -m venv .venv
uv pip install -p .venv/bin/python -r requirements-dev.txt
cp .env.example .env                                   # then set DJANGO_SECRET_KEY
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo                   # fake demo school; prints an API token
.venv/bin/python manage.py runserver 0.0.0.0:8000      # reachable from a phone on the same Wi-Fi (see below)
.venv/bin/python -m pytest                             # tests (no .env needed)
```

`requirements.in` lists direct dependencies; `requirements.txt` is the pinned lock
(`uv pip compile --universal requirements.in -o requirements.txt`).

**Phone on the same Wi-Fi.** Two one-time steps, or the phone cannot reach the laptop:

1. Add the laptop's LAN IP (the `192.168.x.x` or `10.x.x.x` address from `ip -4 addr show scope global`, or
   `hostname -I` where available) to `DJANGO_ALLOWED_HOSTS` in `server/.env`, e.g.
   `DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,192.168.29.165`. Re-check it if the router gives the laptop a new address.
2. Open the port in the firewall: `sudo ufw allow 8000/tcp`.
