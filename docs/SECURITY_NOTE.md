# Security note

## Credentials in the original repository

The original DhwaniSarathi repository (https://github.com/S1ddh4rthaG/DhwaniSarathi) contains credentials and a test
database committed by the original team. We do not print them anywhere.

| What | Where (original code) | In this repo |
|---|---|---|
| Firebase project configuration (6 values) | `audiometer/FirebaseConfig.js` | Values replaced with `REDACTED` |
| Clarifai API token | `audiometer/app/Screens/JewelleryDetection.js` | Replaced with `REDACTED` |
| Django `SECRET_KEY` (hardcoded) | `server/backend/settings.py` | Replaced with `REDACTED`; now read from the environment (Phase 0) |
| Clarifai token in an `audiometer/.env.example` | original history only (added and later removed upstream) | Not present: we import the `80e990f` snapshot, which doesn't contain the file |
| `server/db.sqlite3` with test accounts (one institutional email, a password hash) | original history | Not present in any commit |

What we do:

- **We do not use any of these credentials.** Our app (`screener/`) uses no Firebase and no Clarifai, and the server
  reads `DJANGO_SECRET_KEY` from the environment.
- **History rewrite, 2026-10-17.** This repo was first pushed with the full original history (ERR-010 in
  `docs/ERROR_LOG.md`). The same day it was rebuilt: one import commit from the original `80e990f` snapshot with the
  values above redacted and the database removed, then our 8 commits replayed with their messages and dates, then
  force-pushed. Verification (gitleaks over all history, a direct search for each original secret value,
  `git log --all -- server/db.sqlite3`) is recorded in ERR-010.
- **Residual exposure.** For about 30 minutes the old history was public in `Anish-185/shravan-setu`. GitHub can keep
  unreferenced commits reachable by their SHA for a while after a force-push. The values were already public in the
  original repository, so this added no new exposure. Removing cached commits requires a GitHub Support request.
  TODO (human): decide whether to file one.
- `.gitleaks.toml` allowlists one false positive only: Django migration dependency names such as
  `('apigateway', '0012_alter_assignment_deadline')`, which gitleaks' generic-api-key rule flags in `gitleaks dir`
  scans. gitleaks does not detect the Clarifai token or the Django key format, so the rewrite was also verified by
  searching for each original value directly (ERR-010).
- **TODO (human):** inform the original team (via a GitHub issue on the original repo, without quoting any secret)
  that these credentials are public and should be rotated. Record the date and link here once done.

## Other known issues inherited from the original server

- No authentication on any `apigateway` endpoint. Fixed in Phase 2: DRF token auth is required on every endpoint
  (`REST_FRAMEWORK` defaults in `server/backend/settings.py`), including the original ones. Side effect: the original
  `audiometer/` app, which sends no token, can no longer talk to this server. That is accepted; we don't run it.
- `CORS_ALLOW_ALL_ORIGINS = True`. Acceptable for a laptop-on-LAN demo; revisit before any real deployment.
- `DEBUG` now defaults to off and `ALLOWED_HOSTS` comes from the environment (Phase 0).
