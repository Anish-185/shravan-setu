# Android APK (local build, no account)

The app normally runs in Expo Go. For the demo and for schools it can also be installed as a standalone APK, built
on the laptop with free tools: no Expo account, no EAS, no Play Store. The APK is shared directly (USB or file
transfer) and is never committed to git.

## Build

Laptop tools (free, not shipped in the app; downloaded 2026-10-21, checksums verified):

- Eclipse Temurin JDK 17.0.20.1 (GPL-2.0 with Classpath Exception) in `~/android-toolchain/jdk17`
- Android SDK command-line tools 23.0 (Android SDK licence) in `~/android-toolchain/sdk`, then once
  (ERR-061: `sdkmanager --licenses` no longer writes the licence file Gradle checks):

  ```
  yes | sdkmanager --install "ndk;27.1.12297006" "platforms;android-36" "build-tools;36.0.0" "platform-tools"
  ```

```
SETU_KEY_PASSWORD=$(cat ~/android-toolchain/keystore-password.txt) bash scripts/build_apk.sh
```

**This APK is arm64-v8a only** (the Redmi Note 11 and most phones from the last few years are arm64), which halves
the native compile. Other ABIs can be added later: `ABIS=arm64-v8a,armeabi-v7a,x86_64 bash scripts/build_apk.sh`.
Extra arguments go to Gradle (for example `--info` to see each download).

The script runs `npx expo prebuild --platform android --clean`, signs with a release key in
`~/android-toolchain/shravan-setu-release.jks` (created on the first run; it and its password file stay outside the
repo), runs `./gradlew assembleRelease`, and copies the APK to `shravan-setu-v1.0.apk` in the repo root (gitignored)
with its SHA-256. `screener/android/` is generated and gitignored. **Keep the keystore and password safe:** an update
to an installed APK must be signed with the same key.

App settings that matter for the APK (`screener/app.json`): package `io.github.anish185.shravansetu`;
`usesCleartextTraffic` so sync to the laptop over plain HTTP on the LAN works; `allowBackup: false` so Android cloud
backup never copies children's records.

## Install and smoke check on the Redmi

The APK is a separate app with its own empty database; the children and cases in Expo Go stay in Expo Go.

1. Copy `shravan-setu-v1.0.apk` to the phone (USB file transfer). Open it in Files → allow "install unknown apps" for
   Files when asked → Install. If Play Protect warns about an unknown developer, choose "Install anyway".
2. App icon and name: "Shravan Setu", Setu Line icon; the night-indigo splash shows, then the login screen.
   **No grey Expo Go gear button** anywhere.
3. Log in (new name + PIN; first login sets the PIN). Add a fake child (Student T1, 9-11).
4. Plug in the wired earphones: the "Wired earphones detected" line shows in the device check. Allow the microphone
   when asked (room-noise check).
5. Screen Student T1 to a result: each tone plays in the ear being tested, child mode and the balloon work, the voice
   instruction clip plays, and the result shows PASS / RETEST / REFER with the provisional-calibration line.
6. Telugu button: Home and the result switch to Telugu; fonts look the same as in Expo Go.
7. Detailed test: one frequency, then Your Results: audiograms draw; Share → Export to PDF opens the share menu.
8. Settings → Backend: laptop server URL and login → Sync now succeeds (server running, same Wi-Fi). This checks the
   plain-HTTP setting.
9. Settings → Verify audit log: "Audit log OK".
10. Turn on airplane mode: screening, a case status change and the quiet-spot finder still work; Sync fails politely.
11. Close the app from recents and reopen: still logged in, Student T1 and the result are still there.

Report pass / fail for each number, and anything odd.

### Results (owner, 2026-10-21): all 11 passed

Build tested: the 14:55 build, SHA-256 `b2e0296df6f8bfcccec41623767e12841b843dafc9c4c07fe27467e6de1ab8a7` (arm64-v8a,
unused permissions removed). Redmi 2201117TI, Samsung wired earphones, fake children only. Steps 1-11 passed,
including step 8: sync to the laptop over plain HTTP on the LAN works in the release APK.

The final build (`531b4695…`, build record below) differs from the tested one only by the removal of the
descriptive sentence under the estimated grade on the results screen (same key, same 6 permissions, same manifest
flags; the sentence and its string keys are absent from the bundle). It was not re-run through the 11 steps; a
quick look at Your Results after installing it is enough.

## Build record: v1.0 (2026-10-21)

| | |
|---|---|
| File | `shravan-setu-v1.0.apk` (laptop only, not in git) |
| ABI | arm64-v8a only |
| Size | 60,281,615 bytes (57.5 MiB) |
| SHA-256 | `531b46954e0c234de99e9159516c3b94d8d7bc04624f1e070fe3e7d25a1ffe06` (final, 2026-10-21 15:30: unused permissions removed, descriptive grade sentences removed) |
| Signing certificate SHA-256 | `0725d69d23ab85af536893c2a1d88bde782ca8eb7ec9b3cdef50dd885ca5cca7` (CN=Shravan Setu demo) |
| Package / version | `io.github.anish185.shravansetu`, versionName 1.0.0, versionCode 1; targetSdk 36, minSdk 24 |
| Checked with | `apksigner verify` (signature OK); `aapt2 dump`: `allowBackup=false`, `usesCleartextTraffic=true`, not debuggable |
| Build time | first build 39 min (downloads + 4 ABIs); arm64-only rebuild with a warm cache about 5-6 min |

For phones that aren't arm64, build with `ABIS=arm64-v8a,armeabi-v7a,x86,x86_64` (about 2.2x the size).

**Permissions (checked with `aapt2 dump badging`)**: only these six remain, each needed:

| Permission | Why |
|---|---|
| `RECORD_AUDIO` | Room-noise check and quiet-spot finder (the temporary recording is deleted after each check; only the noise level numbers are kept) |
| `MODIFY_AUDIO_SETTINGS` | expo-audio: audio routing for tone playback through the wired earphones |
| `INTERNET` | Sync, login and the camp PDF, to the team's laptop on the LAN only |
| `ACCESS_NETWORK_STATE` | Required by the networking and image libraries (React Native, expo-image) |
| `WAKE_LOCK` | Required by the media player library (androidx.media3, used by expo-audio) during playback |
| `…DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | Internal to androidx.core (signature-level, protects the app's own receivers); not a user permission |

Removed in `screener/app.json` (none is used by our code): `SYSTEM_ALERT_WINDOW` (display over other apps, React
Native template), `USE_BIOMETRIC` and `USE_FINGERPRINT` (androidx.biometric via expo-secure-store; we never ask for
biometric unlock), `VIBRATE`, `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` (we only use the app's private
cache and documents folders) via `android.blockedPermissions`; and `FOREGROUND_SERVICE` /
`FOREGROUND_SERVICE_MEDIA_PLAYBACK` with expo-audio's background-playback service, via the expo-audio plugin option
`enableBackgroundPlayback: false` (tones only play while the test screen is open). These settings only affect the
APK; Expo Go keeps its own permissions.
