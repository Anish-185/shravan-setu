# Demo video script (2 minutes)

Screening and referral tool, not a diagnostic device. Fake children only (pseudonyms like "Student D1"), "Demo
Government School, Hyderabad" (a made-up demo school) and the fake facility from `seed_demo`. Say nothing that isn't
on screen or in `docs/CLAIMS.md`.

## Setup (before recording)

- Laptop: fresh database, `seed_demo`, server running on the LAN (`docs/DEMO_PATH.md` "Before the demo"). Settings on
  the phone: server URL and server login, so Sync works.
- Phone: Redmi 2201117TI, Samsung wired earphones plugged in, Bluetooth off, media volume zero then 6 steps, Do Not
  Disturb on (no notifications in the shot). Use the APK if it's installed (no Expo Go gear button); otherwise Expo Go.
- Record the phone with Android's built-in screen recorder; record the voice-over separately and lay it over.
  Speed up the waiting parts (checklist, room check, tones) in the edit and show a small "sped up" label.
- Prepare in advance: three fake children in a class; one REFER case already at "camp scheduled" with a missed camp
  and a reschedule (so the case history has a story); one assignment with at least two children tested (so the donut
  has more than one slice).

## Shot list

| Time | Shot (screenshot for reference) | Do | Say |
|---|---|---|---|
| 0:00–0:08 | Login → Home (`01-login`, `02-home`) | Log in with the demo name and PIN | "Others built a hearing test. We built the system that makes sure the child actually gets treated. This is Shravan Setu, on an ordinary Android phone with wired earphones, fully offline." |
| 0:08–0:28 | Screen a child: consent, "Make sure..", room check, instructions, child mode (`05-consent`, `07-pretest-checklist`, `08-room-noise-check`, `09-voice-instructions`, `10-child-mode-balloon`) | Pick Student D1, record consent, run the checks (sped up), play the Telugu voice clip, hand over; tap the balloon on every beep except one frequency, and miss it again in the rescreen | "Consent first. The phone checks the room is quiet enough, then the child hears the instructions in Telugu and taps the balloon on every beep. Silent trials are mixed in, so random tapping can't pass." |
| 0:28–0:40 | REFER result → triage (**record live in the demo video**) | Show REFER; answer the triage questions (for example ear discharge: yes) → route PHC | "A tone missed twice becomes a REFER, and a referral case opens on the spot. Five triage questions route the child: a likely treatable cause goes to the PHC first, otherwise the district early intervention centre. That's triage, not a diagnosis." |
| 0:40–0:48 | Random tapping → RETEST (`11-result-retest-provisional`) | Second child: tap all the time, including the silent clips | "If a child taps at random, the silent trials catch it, and the result is RETEST, not a false PASS." Point at the amber line: "Our calibration is provisional, and the app says so." |
| 0:48–1:05 | Detailed test → results (`12-detailed-ear-check`, `13-detailed-tone`, `14-results-summary`, `15-ear-comparison`, `16-audiogram`) | From the REFER child: Detailed hearing test (sped up), then scroll the results | "After a REFER, the teacher can run the detailed test we kept from DhwaniSarathi: per ear, per frequency. The audiogram and the left-right comparison help the camp doctor. Grades here are estimates, in dB relative to our team baseline." |
| 1:05–1:20 | Case → status history (`21-cases`, `22-case-history`, `23-case-update-reminders`) | Open the prepared case: referred → camp scheduled → missed → rescheduled; show the logged reminder | "This is the part most tools stop before. Every case is tracked: camp scheduled, missed, rescheduled, seen, treated. A missed camp queues a reminder; for now we log it instead of sending an SMS." |
| 1:20–1:35 | Camp request → Sync → PDF (`24-camp-requests`; sync and camp PDF: **record live in the demo video**) | Tick the referred cases, Create camp request, Sync, open the PDF | "The teacher bundles referred children into one camp request, syncs when there's Wi-Fi, and the laptop makes the PDF for the health team." |
| 1:35–1:45 | Teacher view: assignment analytics donut (`19-assignments`, `20-assignment-analytics`) | Open the prepared assignment; tap a slice | "For the class teacher: each screening round has a deadline and a donut of outcomes, and a tap shows which children need follow-up." |
| 1:45–1:52 | Settings → Verify audit log (**record live in the demo video**) | Tap Verify | "Every consent, result and status change goes into a hash-chained audit log. One tap checks nothing was altered." |
| 1:52–2:00 | Switch to Telugu (`26-te-home`, `30-te-case`) | Tap the Telugu button on Home | "The whole app works in Telugu and English. Software cost: zero. A screening and referral tool, not a diagnosis." |

No screenshot exists for six shots, so they are **record live in the demo video** (from the APK, so there is no Expo Go gear button): the
REFER result, triage, sync, the camp-request PDF, audit-log verify, and the quiet-room finder. The quiet-room finder
is not in the 2-minute cut; if time allows, add it as a 3-second cutaway in the 0:00 Home shot (Home → Find a quiet
room → Measure this room now) with the line "The phone can also find the quietest room in the school."

**Optional Telugu line** (already approved by our Telugu reviewer: the quoted part of `test.teacher` in
`screener/src/i18n/strings.json`), said in the 0:08 shot over the child-mode hand-over:

> “బీప్ వినిపించిన ప్రతిసారీ, చాలా మెల్లగా వినిపించినా సరే, బెలూన్‌ను నొక్కు.”
> ("Tap the balloon every time you hear a beep, even a very quiet one.")

Do not add new Telugu lines without the reviewer.

## Backup plan

- **Record the whole flow once in full before the final take** and keep it. If a live take fails, cut from that
  recording instead.
- **Earphones not detected:** unplug and replug, check Bluetooth is off. If it still fails, re-record that shot only.
- **Random tapping lands on PASS instead of RETEST:** tap during every silence, not only on beeps. If it still passes,
  use the pre-recorded take, or show `11-result-retest-provisional.png` and say "here is a RETEST from an earlier run".
- **Sync fails:** same Wi-Fi? `DJANGO_ALLOWED_HOSTS` has the laptop's current IP? Port 8000 open (`sudo ufw allow
  8000/tcp`)? Server URL in Settings correct? If not fixed in 2 minutes, skip the sync shot and show the camp-request PDF
  made earlier from the same seeded data.
- **PDF doesn't open:** sync first (the laptop makes it after sync). Otherwise show the PDF made earlier.
- **Audit log not OK:** don't fake it. Cut the shot and tell the owner (it means a record changed outside the app).
- **Donut has one slice:** test one more child in the assignment before recording, or say only what it shows.
- **Notification or other app appears:** re-record the shot; nothing personal in the video.
