# Phase 1 device spike

Throwaway screen `screener/src/app/spike.tsx` (route `/spike`). Purpose: remove the biggest technical unknowns
before building the test engine. **SPIKE DATA is not a hearing measurement.** Metering values are relative only.

## 1. Expo SDK choice

- Expo Go download page (https://expo.dev/go, checked 2026-10-17) lists **SDK 58 (latest)** for Android.
- SDK version table (https://docs.expo.dev/versions/latest/): SDK 58 = React Native 0.88, React 19.3.0, Node ≥ 22.13.
- The Expo troubleshooting page (https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/) warns that the
  Google Play build "can also lag behind a new SDK release". If the phone's Expo Go does not support SDK 58,
  install the SDK 58 build of Expo Go from https://expo.dev/go (free, no account).
- `screener/` is scaffolded with `create-expo-app` (default template, reset to blank) on SDK 58 with expo-router.
  Routes live in `screener/src/app/` (the current template's layout), so the spike is `src/app/spike.tsx`.

## 2. What the expo-audio docs say (SDK 58)

Source: https://docs.expo.dev/versions/v58.0.0/sdk/audio/ (read 2026-10-17). Also checked against the installed
type definitions in `node_modules/expo-audio/build/AudioModule.types.d.ts`.

| Question | What the docs say | Status |
|---|---|---|
| Runs in Expo Go? | Page header: "Included in Expo Go" | Documented |
| Recording with metering | `RecordingOptions.isMeteringEnabled`: "audio level information will be part of the status object under the `metering` key". Read from `recorder.getStatus().metering` or `useAudioRecorderState(recorder, intervalMs)` (default poll 500 ms) | Documented |
| Metering unit / range | **Not documented** (no mention of dBFS or a range) | Must measure on device |
| Playback while recording | **Not documented either way.** `allowsRecording` in `setAudioModeAsync` is iOS-only; nothing says Android blocks or allows simultaneous playback | Must test on device (checklist b) |
| Audio mode for both | `setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true })` as in the docs' recording example. On Android `playsInSilentMode: false` would suppress playback in silent/vibrate mode | Documented |
| Choosing the mic | `recorder.getAvailableInputs()` (only after prepare), `getCurrentInput()`, `setInput(uid)`. `RecordingInput` = `{ name, type, uid }` | Documented, no example |
| Player volume | `player.volume`, range 0.0–1.0 (set by assignment) | Documented |
| Left/right pan | **No pan or channel property.** We must keep separate left-only / right-only stereo WAV files | Documented by absence |

Consequence for the design: if checklist (b) shows metering stops during playback, per-tone noise gating
(Phase 4) cannot use the mic during the tone, and we fall back to metering in the gaps between tones.

## 3. What the spike screen does

- Plays one of four tones from the original app (1 kHz / 4 kHz, left / right; 10 s, full-scale sine, one channel only).
  Volume is set with −/+ buttons (0.01 and 0.1 steps) and shown as a number, so a setting can be repeated exactly.
- Mic on/off with live metering, polled every 100 ms with `recorder.getStatus()`.
- Shows the current mic input and a button per available input, to switch between phone mic and earphone mic.
- Every sample is logged as `{t, metering, tone (null when silent), volume, label}`. The free-text **condition label**
  (e.g. `quiet-toneoff-phonemic`) is saved with every sample. "Export JSON" shares the log through the Android share sheet.

Known limitation of the original tones (ERR-005): they start and stop at full amplitude with no ramp, so they click.

## 4. Checklist for you (NEEDS YOU)

Equipment: `[PHONE_MODEL]`, wired `[EARPHONE_MODEL]`, a laptop on the same Wi-Fi. One tester wears the earphones.

**Setup (laptop)**

1. `cd screener && npm install` (first time only), then `npx expo start`.
2. On the phone, install **Expo Go** from the Play Store. Open it and scan the QR code from the terminal.
3. Set the phone's **media volume** to a fixed level and write down how you did it
   (e.g. "volume down to zero, then up 8 steps"). Keep it the same for the whole spike.
   Turn off Bluetooth. Turn on Do Not Disturb.

**a) Does it open in Expo Go?**

4. Does the app open after scanning? If Expo Go says the project's SDK is unsupported, write down the exact message
   and the Expo Go version (Expo Go → Settings), install the SDK 58 build from https://expo.dev/go, then retry.
5. Tap "Open audio spike". Allow the microphone permission. Any red error text? Copy it exactly.

**b) Does metering keep updating while a tone plays?**

6. Plug in the earphones. Tap **Start mic**. The metering number should change every fraction of a second.
7. Tap **Play tone** (1k L, vol 0.10). While it plays, does the metering number keep changing? (Yes / No / freezes / error)
8. Does the tone keep playing after you start the mic, and does starting the mic while a tone plays stop the tone?

**c) Which mic is used with earphones in?**

9. With the mic on, read "Current input". Write down the list of input buttons shown.
10. Tap (gently scratch) the **earphone's inline mic**, then the **phone's bottom mic**. Which one makes the number jump?
11. If more than one input is listed, tap each input button and repeat step 10. Does switching work? Any error?
12. Unplug the earphones while the mic is on, then plug them back in. What happens to "Current input" and the metering?

**d) Does the tone leak into the mic?** (quiet room, earphones worn normally by the tester)

For each step, type the label first, then record about 20 seconds. Keep still and silent.

13. Label `quiet-off`: mic on, no tone.
14. Label `quiet-on-1kL-0.10`: play 1k L at vol 0.10. Repeat for 1k R, 4k L, 4k R (change the label each time).
15. Repeat step 14 at **vol 1.00** (worst case), labels `quiet-on-<tone>-1.00`.
16. If step 11 showed you can switch mics, repeat steps 13–15 on the other mic, adding `-phonemic` or `-earmic` to the labels.
17. Tap **Export JSON**, and save or send the file to the laptop.

**e) Quiet room vs noisy corridor** (relative only)

18. **Clear log.** In the quiet room: label `quiet-baseline`, mic on, no tone, 30 seconds.
19. In a noisy corridor or classroom during a break: label `corridor-baseline`, 30 seconds.
20. Export JSON again.

**What to send back**

- Both JSON files (put them in `data/raw/spike/`, which is gitignored, or attach them).
- Answers to steps 4, 5, 7, 8, 9, 10, 11 and 12, plus the media-volume setting from step 3.
- Phone model, Android version, earphone model, Expo Go version.

I will then analyse the JSON: median metering per label, tone-on vs tone-off difference per mic, and quiet vs
corridor difference. Those numbers go to `docs/CLAIMS.md` only as spike observations, not as accuracy claims.
