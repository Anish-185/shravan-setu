# Security note

## Credentials in the original repository

The original DhwaniSarathi repository contains credentials committed by the original team. They remain in this
repo's git history because we keep the original history intact for attribution. We do not print them here.

| What | Where (original code) |
|---|---|
| Firebase project configuration | `audiometer/FirebaseConfig.js` |
| Clarifai API token | `audiometer/app/Screens/JewelleryDetection.js` |
| Django `SECRET_KEY` (hardcoded) | `server/backend/settings.py` before our Phase 0 change |
| A `.env` file, added then reverted | commits `80cc9fa` and `bf16f6a` (2023-12-14) |
| `server/db.sqlite3` with test records | removed from the tree in Phase 0; still in history |

What we do:

- **We do not use any of these credentials.** Our app (`screener/`) uses no Firebase and no Clarifai, and the server
  reads `DJANGO_SECRET_KEY` from the environment. The old hardcoded key is treated as public and is not used.
- We do not modify `audiometer/`; the files stay as the original team left them.
- **TODO (human):** inform the original team (via a GitHub issue on the original repo, without quoting any secret)
  that these credentials are public and should be rotated. Record the date and link here once done.

## Other known issues inherited from the original server

- No authentication on any `apigateway` endpoint. Planned fix: DRF token auth on every endpoint in Phase 2.
- `CORS_ALLOW_ALL_ORIGINS = True`. Acceptable for a laptop-on-LAN demo; revisit before any real deployment.
- `DEBUG` now defaults to off and `ALLOWED_HOSTS` comes from the environment (Phase 0).
