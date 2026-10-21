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
