# Phone checklist: Phase 4 leftovers (A–E) + Phase 5 (F–M) (NEEDS YOU)

Same phone (Redmi 2201117TI), same Samsung wired earphones with inline mic, media volume "zero, then 6 steps",
laptop on the same Wi-Fi. Pseudonyms only. Uncalibrated volume: trial data, not hearing measurements.

**Setup:** `git pull`. Laptop: `cd ~/sfic/server && .venv/bin/python manage.py migrate && .venv/bin/python manage.py
runserver 0.0.0.0:8000`. Phone: `cd ~/sfic/screener && npx expo start`, reload in Expo Go. In Settings, **log in
again** (this now also loads the facility list) and pick the school again (this stores its mandal).

Reply with the letter and yes/no (+ a note where something looks wrong). Screenshots of anything red help.

## Phase 4 leftovers

- **A. Earphone detection (ERR-019).** Device check screen: earphones in → "Wired earphones detected"? Unplug →
  "No wired earphones detected" within ~1 s? Plug back in → detected again?
- **B. Unplug mid-test (ERR-019).** During a beep, unplug. Beep stops, "Earphones disconnected", no more beeps? Any
  sound from the phone speaker (yes / a click / no)? Plug in, Resume: does it carry on?
- **C. Leaving the screen (ERR-021).** (1) finish a test, tap Done; (2) start a test, press Back mid-test; (3) finish a
  test and press Back straight away. Any red or yellow error box in any of the three?
- **D. Titles and Settings (ERR-022/023).** Every screen has a proper title (no "index", no "[childId]")? Picking a
  school shows "School set: …"?
- **E. Sync (steps 9–10).** Sync with the laptop reachable → all "synced"; Sync again → "Sent 0". Wi-Fi off, screen one
  child, Sync → fails with "Nothing was lost"; Wi-Fi on, Sync → synced.

## Phase 5

- **F. Audio start delay (ERR-026).** One full test on any child, honest tapping, then **Export session JSON** and send
  it (or put it in `data/raw/phase5/`). I run `scripts/analyze_phase4.py` on it to read the play latency.
- **G. Language.** Tap "Telugu" in the header on three different screens: does every text switch to `[TODO_TE] …`
  and back with "English"? Does the choice stay after closing and reopening the app?
- **H. Child mode.** Test step: "Play voice instructions (Telugu)" plays without an error (silent for now). In a dev
  build, the yellow "voice placeholder" tag shows next to the 🔊 buttons? During the test: is the red balloon easy to
  tap, does it bounce, and does a tap on it still count (the result looks like before)?
- **I. Triage.** Get a REFER (child doesn't tap for one ear). Below the result: "Ear-health triage", "Triage, not
  diagnosis", five Yes/No questions with big buttons. Answer "Ear pain = Yes" → "Route: nearest PHC (SAMPLE-PHC-1 …)".
  Answer all "No" on another REFER → "Route: DEIC (…)".
- **J. Cases.** Home → Referral cases: filter chips by status work? Open a case: history, triage, and only legal buttons
  (a referred case shows "Camp scheduled" and "Closed: lost to follow-up" only)? "Closed: lost to follow-up" without a
  reason → "Write a reason first."?
- **K. Camp request + PDF.** Tick a referred case → Create camp request → date + facility → Create: the case becomes
  "Camp scheduled"? "Share CSV" opens the share sheet? Sync, then "Download PDF (after sync)": does the PDF open?
- **L. Close the loop.** On that case: Seen at camp → Treated (pick "Wax removed"; without picking one → "Pick a
  treatment first.") → Closed. Sync. On the laptop, `http://localhost:8000/admin/` shows the case as Closed?
- **M. Missed + reminder.** Another referred case: camp request → "Missed camp": the case shows "Reminders (stubbed:
  logged, not sent)" with the reminder text? Then "Rescheduled" works?
