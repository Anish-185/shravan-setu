# screener/

Our offline-first Expo app (Expo SDK 57, expo-router). All new mobile work goes here.
Screening and referral tool, not a diagnostic device.

- Screens/routes: `src/app/` (every file is a route). Non-route code goes in `src/`.
- Rules port (Phase 3): `src/rules/`, must pass every fixture in `../shared/fixtures/`.
- Tones: `assets/tones/` (from the original DhwaniSarathi app, Apache-2.0; see `../ATTRIBUTION.md`).

## Run

```
npm install
npx expo start        # scan the QR code with Expo Go from the Play Store (SDK 57) on an Android phone on the same Wi-Fi
npx tsc --noEmit      # typecheck
npx expo lint         # lint
```

Scaffolded with `create-expo-app` (default template, then `npm run reset-project`). `LICENSE` in this folder is the
template's MIT licence from Expo.
