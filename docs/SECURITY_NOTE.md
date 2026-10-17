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
- 2026-10-17: this repo was published as https://github.com/Anish-185/shravan-setu with the full original history
  (owner's decision, option A). The credentials above and the historical `server/db.sqlite3` (test accounts,
  one institutional email, a password hash) are therefore visible there too, as they already are upstream.
  No new secret was added by us.
- **TODO (human):** inform the original team (via a GitHub issue on the original repo, without quoting any secret)
  that these credentials are public and should be rotated. Record the date and link here once done.

## Other known issues inherited from the original server

- No authentication on any `apigateway` endpoint. Fixed in Phase 2: DRF token auth is required on every endpoint
  (`REST_FRAMEWORK` defaults in `server/backend/settings.py`), including the original ones. Side effect: the original
  `audiometer/` app, which sends no token, can no longer talk to this server. That is accepted; we don't run it.
- `CORS_ALLOW_ALL_ORIGINS = True`. Acceptable for a laptop-on-LAN demo; revisit before any real deployment.
- `DEBUG` now defaults to off and `ALLOWED_HOSTS` comes from the environment (Phase 0).
