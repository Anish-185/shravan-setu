# Phase 1 device spike

Throwaway screen `screener/src/app/spike.tsx` (route `/spike`). Purpose: remove the biggest technical unknowns
before building the test engine. **SPIKE DATA is not a hearing measurement.** Metering values are relative only.

## 1. Expo SDK choice

**Changed to SDK 57 (ERR-014).** The Play Store Expo Go on the test phone does not run SDK 58, so `screener/`
is on SDK 57 (expo 57.0.30, React Native 0.86.3, React 19.2.3), the SDK the Play Store build supports.
The notes below are the original SDK 58 reasoning, kept for the record.

- Expo Go download page (https://expo.dev/go, checked 2026-10-17) lists **SDK 58 (latest)** for Android.
- SDK version table (https://docs.expo.dev/versions/latest/): SDK 58 = React Native 0.88, React 19.3.0, Node ≥ 22.13.
- The Expo troubleshooting page (https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/) warns that the
  Google Play build "can also lag behind a new SDK release". If the phone's Expo Go does not support SDK 58,
  install the SDK 58 build of Expo Go from https://expo.dev/go (free, no account).
- `screener/` is scaffolded with `create-expo-app` (default template, reset to blank) on SDK 58 with expo-router.
  Routes live in `screener/src/app/` (the current template's layout), so the spike is `src/app/spike.tsx`.

## 2. What the expo-audio docs say (read for SDK 58; recheck against SDK 57)

Source: https://docs.expo.dev/versions/v58.0.0/sdk/audio/ (read 2026-10-17). After the SDK 57 downgrade, the
installed expo-audio 57.0.5 types still have `isMeteringEnabled` and `RecorderState.metering`; the spike typechecks. Also checked against the installed
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
   and the Expo Go version (Expo Go → Settings), then stop and report it (do not sideload a different Expo Go).
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

## 5. Results (device run, 2026-10-17)

**SPIKE DATA.** One phone, one pair of wired earphones, one tester, one quiet room, one corridor. Metering is raw
expo-audio output (behaves like dB re: mic full scale, uncalibrated). Relative comparisons only, not a hearing measurement.

Setup reported by the tester: Redmi `2201117TI`, Android 13 (from the export), Play Store Expo Go on SDK 57, wired
earphones (model not given), media volume setting not given (`TODO(owner)`). Part d tone clips are ~8 s (the tone
files are 10 s and stop on their own; the mic was started just after PLAY TONE). For the **vol 1.00** clips the
earphones were **held near the ears, not worn**.

### 5.1 Answers to the checklist

| Step | Result | Consequence |
|---|---|---|
| 4 | App opens in Play Store Expo Go on SDK 57 | ERR-014 closed |
| 5 | No errors, mic permission granted | |
| 7 | Metering keeps updating while a tone plays (built-in and H2W wired input) | `during_tone` gating is possible |
| 8 | Starting the mic does not stop a playing tone | Mic can run for the whole test |
| 9 | Inputs: `2201117TI` (MicrophoneBuiltin) ×2, `H2W` (MicrophoneWired) | |
| 10–11 | Switching inputs works; scratching moves the reading with **every** input selected | We can't tell which physical mic is metered; gate on whatever Android routes |
| 12 | Unplug/replug: spike to about −1.0 (plug click) with −160.0 dropouts around it, then normal (−18 to −29). "Current input" stayed `H2W` (MicrophoneWired) **with the earphones unplugged** | The reported input **cannot** detect earphones. Use audio-device/route-change events instead |
| 12 | First sample after START MIC was −160.0; one −160.0 appeared during playback | −160 is a no-data floor, not silence |
| 16 | Skipped (input label unreliable) | |

### 5.2 Which file is which, redo rule, label check

- `data/raw/spike/part-d-spike-1792258113094.json`: part d (`quiet-off`, `quiet-on-*`). Renamed with a `part-d-` prefix.
- `data/raw/spike/part-e-spike-1792258822119.json`: part e (`quiet-baseline`, `corridor-baseline`).
- Both found in `~/Downloads` (not the repo root as reported), moved to `data/raw/spike/`; `git check-ignore` confirms
  `.gitignore:110 data/raw/` covers them, and they are in no commit.
- Redo rule applied: `quiet-on-4kR-0.10` and `quiet-on-1kR-1.00` are dropped; their `-redo` clips are used.
- Label vs logged `tone play` event and the samples' `tone` field, every clip:
  - `quiet-on-4kR-0.10` (dropped): **played 4k L**, not 4k R. The redo played 4k R. This is the mistake the redo fixed.
  - `quiet-on-1kR-1.00` (dropped): played 1k R as labelled, but the mic ran 21 s (half the clip has no tone).
  - `quiet-on-1kL-1.00`: the tester reported it actually played 4k R at vol 1.00, but **the log says `tone play 1k L
    vol=1.00`** and the samples' tone field is `1k L`. The app logs the same state variable that picks the WAV
    (`spike.tsx` `TONES[tone]`, a new player per tone), so the app did start the 1k L file. There is no `-redo` for
    this label. **Unresolved, `TODO(owner)`**: please recheck. The conclusions below do not change if this clip is excluded.
  - All other clips match their labels. In `quiet-on-4kL-0.10` and `quiet-on-4kR-0.10-redo` the tone was started
    ~0.5 s before the mic (not a mismatch).

### 5.3 Numbers

Produced by `python scripts/analyze_spike.py data/raw/spike/*.json` with `config/screening.json` `noise.*`
(invalid ≤ −100, saturated ≥ −1.5, mic settle 1000 ms, gate +10 over the quiet median, tone windows of 1000 ms).

| Clip | Tone played (log) | Floor | Settle | Valid | Saturated | Median tone-on | Median tone-off | Tone-on minus baseline | p10 / p90 | 1 s windows gated |
|---|---|---|---|---|---|---|---|---|---|---|
| quiet-off | none | 1 | 7 | 168 | 0 | - | -32.8 (n=168) | - | -35.8 / -29.8 | 0/19 |
| quiet-on-1kL-0.10 | 1k L 0.10 | 1 | 7 | 71 | 0 | -33.8 | - | -1.1 | -36.9 / -31.4 | 0/8 |
| quiet-on-1kR-0.10 | 1k R 0.10 | 1 | 6 | 88 | 0 | -31.9 | -34.3 (n=5) | +0.9 | -34.7 / -29.2 | 1/10 |
| quiet-on-4kL-0.10 | 4k L 0.10 | 1 | 6 | 81 | 0 | -33.0 | -34.4 (n=5) | -0.3 | -35.4 / -30.0 | 0/9 |
| quiet-on-4kR-0.10-redo | 4k R 0.10 | 1 | 7 | 81 | 0 | -36.8 | -35.7 (n=5) | -4.0 | -38.3 / -35.2 | 0/9 |
| quiet-on-1kL-1.00 (disputed) | 1k L 1.00 | 1 | 7 | 88 | 0 | -33.5 | -34.0 (n=6) | -0.8 | -35.0 / -29.5 | 0/10 |
| quiet-on-1kR-1.00-redo | 1k R 1.00 | 1 | 6 | 88 | 0 | -34.6 | -35.7 (n=5) | -1.8 | -36.6 / -31.6 | 1/10 |
| quiet-on-4kL-1.00 | 4k L 1.00 | 1 | 7 | 86 | 0 | -35.2 | -36.3 (n=5) | -2.4 | -36.8 / -33.5 | 0/10 |
| quiet-on-4kR-1.00 | 4k R 1.00 | 1 | 7 | 87 | 0 | -32.9 | -36.1 (n=6) | -0.2 | -34.8 / -31.8 | 0/10 |
| quiet-baseline (part e) | none | 1 | 7 | 264 | 0 | - | -30.3 (n=264) | - | -32.8 / -26.2 | 0/30 |
| corridor-baseline (part e) | none | 1 | 7 | 258 | 57 | - | -15.5 (n=258) | - | -29.8 / -1.0 | 26/29 |

Baseline for part d = `quiet-off` median (−32.8); for part e = `quiet-baseline` median (−30.3).

Mic start-up, n-th sample across all 13 clips (same script):

| Sample # | Mean ms after mic start | Median metering | Clips at floor |
|---|---|---|---|
| 0 | 193 | -160.0 | 13/13 |
| 1 | 300 | -35.9 | 0/13 |
| 2 | 407 | -19.6 | 0/13 |
| 3 | 530 | -19.8 | 0/13 |
| 4 | 633 | -25.7 | 0/13 |
| 5 | 749 | -31.2 | 0/13 |
| 6 | 870 | -31.0 | 0/13 |
| 7 | 985 | -35.3 | 0/13 |
| 8 | 1094 | -35.2 | 0/13 |
| 9 | 1209 | -33.7 | 0/13 |

What the data shows:

1. **Mic start-up (SPK-01).** In all 13 clips (mic sessions) the first sample (~0.2 s) is −160, and samples 2–4
   (~0.4–0.63 s) form a hump (medians −19.6 to −25.7) before settling by ~0.75 s, in no-tone clips too, so it is the recorder starting, not the tone.
   Counting that hump as ambient would wrongly flag a quiet room as noisy. Discard the first 1000 ms.
2. **Floor and ceiling (SPK-01, SPK-02).** −160 is the only floor value seen; the lowest real sample is about −40.
   The ceiling is about −1.0: 57 of 258 valid corridor samples sit there, and plug clicks hit it too. Floor =
   invalid; ceiling = saturated, so too loud.
3. **No measurable tone leakage (SPK-03).** With earphones worn at vol 0.10, tone-on medians are −4.0 to +0.9 from
   the quiet-off median. That is inside the room's own drift (the same "quiet" condition measured −32.8 and −30.3
   in two sessions). At vol 1.00 held near the ears, −2.4 to −0.2. Within-clip tone-on vs the ~0.5 s tail after the
   tone stopped is +0.5 to +3.2, but each tail has only 5–6 samples.
4. **Quiet vs corridor (SPK-04).** Medians differ by 14.8 (re: mic full scale). Corridor noise comes in bursts:
   p10 −29.8 is close to quiet, p90 is the −1.0 ceiling.
5. **A +10 during-tone gate (SPK-05)** rejects 0/49 one-second windows in the quiet no-tone clips, 2/76 in the
   quiet tone clips, and 26/29 in the corridor.

### 5.4 Noise-gating decision: `during_tone`

`config/screening.json` → `noise.gating_strategy = "during_tone"`. Reasons:

- It is possible: metering keeps running during playback, and starting the mic doesn't stop the tone (steps 7, 8).
- It is safe: the tone itself does not raise the metering beyond the room's normal variation (finding 3), so the
  gate won't reject tones because of the tone itself, even at vol 1.00, far louder than a screening level.
- It is what matters: corridor noise is bursty (finding 4). `between_tones` would sample the gaps and miss a burst
  that lands on the tone the child is supposed to hear. `during_tone` measures the noise that actually overlapped
  the tone and replays exactly those tones.
- The pre-test quiet-baseline measurement stays (it sets the gate reference and the 500 Hz policy).

Design rules that follow (Phase 4):

- The mic runs for the whole test, so the 1000 ms settle discard happens once at the start, not per tone.
- Samples ≤ −100 (or missing) are invalid. A tone with fewer than `min_valid_samples_per_tone` valid samples is
  replayed: noise unknown, not quiet.
- A tone is masked if any valid sample is ≥ the saturation ceiling or > baseline + `gate_db_above_baseline`.
- Earphone presence comes from audio-device / route-change events, never from `getCurrentInput()`. Any change pauses
  the test, invalidates the tone in progress, and discards samples within `plug_guard_ms`. If no wired output is
  confirmed, no test tone is played (never through the loudspeaker).

Limits: one device, one tester, one session per condition, earphone model unknown, which physical mic was metered
is unknown (step 11), and vol 1.00 clips used held, not worn, earphones. The gate value stays PLACEHOLDER until the
Phase 6 team tests.
