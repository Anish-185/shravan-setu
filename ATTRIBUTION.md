# Attribution

This repository is a fork of **DhwaniSarathi** (https://github.com/S1ddh4rthaG/DhwaniSarathi),
built by team **gps4** for Smart India Hackathon 2023, problem statement SIH1403 ("App-Based Audiometer"),
where it was a winning entry.

**Original team** (from the original README):

- Sachin Kumar Sahu
- Palivela Ganesh Priyatham
- Preethi Varsha Marivina
- Siddhartha G
- Swami Ramchandra Kedari
- Sirish Sekhar

The original work is licensed under the **Apache License 2.0**. The `LICENSE` file in the repo root is theirs
and is kept unchanged. The original repo has no `NOTICE` file, so there is none to carry.
Their full git history is preserved in this repo.

The original mobile app lives in `audiometer/` and is **not modified** by us. It is kept for attribution.
The original Django backend lives in `server/apigateway/`; our changes to `server/` are listed in
`docs/ERROR_LOG.md` and the commit history (Phase 0: env-based settings, Django 5.2 upgrade, removal of the committed database).

## Original features (theirs)

| Feature | Where in the original code | Notes |
|---|---|---|
| Pure-tone test | `audiometer/app/AudiometryTest.js`, `audiometer/app/utils/Audiometry.js`, `utils/CONFIG.js`, `assets/puretones/` | Ascending 10-step sweep, pre-generated 10 s stereo WAV tones |
| Results / audiogram view | `audiometer/app/Screens/Results.js` | Pure-tone average and category per ear |
| Classroom / teacher / assignment management with analytics | `audiometer/app/Screens/Educator/*`, `server/apigateway/` | Educator creates classrooms and test assignments |
| Nearest-doctor map | `audiometer/app/Screens/Maps.js` | Placeholder marker data |
| Document digitisation | `audiometer/app/Screens/ML.js` | Embeds a third-party Hugging Face Space in a WebView |
| Jewellery detection | `audiometer/app/Screens/JewelleryDetection.js` | Calls the Clarifai API |
| Preliminary checks: noise detection | `audiometer/app/Screens/QuietPlaceDetection.js` | expo-av recording metering before the test |
| Preliminary checks: headphone orientation | `audiometer/app/Screens/EarTest.js`, `assets/eartest/` | Left/right channel check |
| Noise-standards info | `audiometer/app/Screens/LegalComplianceInformation.js` | Links to pollution control board websites |
| English / Hindi UI | `audiometer/app/locales/` | i18next |

## Our features

Filled in per phase.

- (Phase 0) No features yet: cleanup, attribution, architecture.
- (Phase 1) Throwaway audio spike only (`screener/src/app/spike.tsx`): tone playback with live mic metering and a JSON log.

## Third-party code and assets we reuse

Every entry here must also appear in `docs/REUSE_LOG.md`.

| What | From | Licence | Where in our repo |
|---|---|---|---|
| Pure-tone WAVs: 1000 Hz and 4000 Hz, left-only and right-only, 10 s (`tone_*Hz_*_um.wav`), copied unmodified | DhwaniSarathi `audiometer/app/assets/puretones/` (original team, see above) | Apache-2.0 | `screener/assets/tones/` |
| App scaffold (`create-expo-app` default template, reset to blank) | Expo (650 Industries) | MIT (`screener/LICENSE`) | `screener/` config files, `src/app/_layout.tsx` |
