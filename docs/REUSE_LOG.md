# Reuse log

Every reuse search and decision (protocol in `CLAUDE.md`). Newest phase at the bottom.

Format per entry: feature, queries run, candidates (licence, last commit/release), decision, reason.

## Phase 0

### Loading Django settings from a `.env` file

- Queries: none run. Plumbing choice between well-known packages (no feature search needed).
- Candidates:
  - `python-dotenv` 1.2.4: BSD-3-Clause, no network calls, pure Python.
  - `django-environ`: MIT; adds typed parsing we don't need.
  - Plain `os.environ`: no dependency, but then `.env.example` only helps if the user exports variables by hand.
- Decision: (a) dependency on `python-dotenv`.
- Reason: one call (`load_dotenv`) makes `server/.env` work on Linux, macOS and Windows without shell tricks.
  Real environment variables still take precedence.
