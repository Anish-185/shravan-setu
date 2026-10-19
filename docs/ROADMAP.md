# Roadmap (future work)

Items planned for later rounds; none of them is built in this version.

- **Stage 2: quieter 1–4 kHz tone set (about 20 dB), recalibrate with volunteers, then a clinical audiometer check.**
  Today's calibration is provisional (ERR-044, `docs/CLAIMS.md` CAL-01..03): at 1-4 kHz the phone's playback floor
  stopped the threshold search, so the baseline there is an upper bound and those tones may be louder than intended;
  the screen may miss milder loss until this is done.

- **Development build with a local audio-route module (ERR-019).** The demo runs in Expo Go and requires wired
  earphones with an inline mic, because expo-audio only sees earphones through the input-device list. A
  development build (`npx expo prebuild` + Gradle, local, no EAS paid plan) would allow a ~60-line local Expo module
  using `AudioManager.registerAudioDeviceCallback` and `ACTION_AUDIO_BECOMING_NOISY`, which detects earphones without an inline mic and
  stops tones on unplug without polling. Needs a JDK and the Android SDK on the laptop (cost 0).
- **Real SMS / IVR reminders.** Stubbed (logged, not sent) today; a future running cost, listed in
  `docs/COST_AND_LICENSES.md`.
- **Per-model calibration.** Today one phone+earphone model is calibrated (biological calibration with volunteers,
  `docs/TEAM_TEST_PROTOCOL.md`). Calibrating each further phone model would make teachers' own phones usable
  (cost scenarios B and C in `docs/COST_MODEL.md`); until then those scenarios are not recommended.
- **Quick check for each extra unit of the calibrated model (future procedure).** Calibration is done once per
  phone+earphone model; every extra unit of the same model (and every replacement earphone of the same model) gets a
  short check against the reference unit before use, e.g. two volunteers with known results from the reference unit
  repeat the threshold-search step on the new unit, and the unit is used only if their results agree within a
  tolerance set from team-test retest data. Not designed in detail or tested yet.
- **School pilot (via SFIC field-testing support).** The deployment plan in `docs/COST_MODEL.md` (students per phone,
  scenarios, classroom tips) is proposed, not tested; a pilot would measure minutes per child, coverage and follow-up.
