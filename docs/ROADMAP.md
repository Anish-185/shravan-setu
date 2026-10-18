# Roadmap (future work)

Items planned for later rounds; none of them is built in this version.

- **Development build with a local audio-route module (ERR-019).** The demo runs in Expo Go and requires wired
  earphones with an inline mic, because expo-audio only sees earphones through the input-device list. A
  development build (`npx expo prebuild` + Gradle, local, no EAS paid plan) would allow a ~60-line local Expo module
  using `AudioManager.registerAudioDeviceCallback` and `ACTION_AUDIO_BECOMING_NOISY`, which detects earphones without an inline mic and
  stops tones on unplug without polling. Needs a JDK and the Android SDK on the laptop (cost 0).
- **Real SMS / IVR reminders.** Stubbed (logged, not sent) today; a future running cost, listed in
  `docs/COST_AND_LICENSES.md`.
