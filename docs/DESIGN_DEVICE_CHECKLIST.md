# Phone checklist: design pass + N–T + V–Y, one sitting (NEEDS YOU)

Redmi 2201117TI, Samsung wired earphones, your fixed media volume. Pseudonyms only. Reply with the number and
yes/no, plus a screenshot of anything cut off, overlapping or red.

**Setup:**
1. `git pull`.
2. `cd screener && npm install` (new: react-native-svg).
3. Restart `runserver`.
4. Fully close Expo Go, reopen it and reload.

**Telugu rule for every screen below:** look at it in English, tap the language pill, then look again in Telugu.
Anything cut off, overlapping or squeezed is a fail.

1. **Home.**
   - Night band with "Shravan Setu", the figure in an arch and the marigold wave.
   - "Screen a child" card, then Referral cases, Sync and Settings rows with count bubbles.
   - In Telugu, scroll to the bottom: nothing is cut off.
2. **Settings.**
   - Backend, Standard device and Developer cards. Developer is డెవలపర్ in Telugu.
   - **X**: Settings → Developer → Calibration (it's no longer on Home), then the rest of X as written in
     `PHASE6_DEVICE_CHECKLIST.md`.
   - **Y**: loudness safety.
3. **Children (S).**
   - The add-child card, then a card per child. A child with a case shows "Case" plus a coloured status chip, and
     it opens the case.
   - After a status move, the chip has updated. Tapping the name still starts a test.
4. **Test 1, honest tapping (V, W).**
   - Steps 1–5 each show the arch stepper: done steps indigo with ✓, the current one marigold.
   - **V**: while "Measure room noise" runs, nothing is audible.
   - Step 5 shows the teacher's words in italics beside a figure.
   - Child mode:
     - Sky, kites and hills stay still. The balloon drifts slowly.
     - A tap gives one quick white ring. No sounds except the beeps and voice lines.
     - It's smooth on the Redmi: no stutter, and the beeps don't sound late or choppy.
   - After the last beep, a silent "Well done!" / చాలా బాగా చేశావు! shows for about 1.5 s, then the result.
   - **W**: export the session JSON to `data/raw/phase6/` and paste the `analyze_phase4.py` table.
5. **Test 2, REFER with reduce motion (N).**
   - Turn on Android Settings → Accessibility → Remove animations.
   - Run a test without tapping for one ear: the balloon doesn't drift, a tap gives only a brief fade, and the
     "Well done!" is static.
   - It's the same celebration as for a PASS.
   - **N**: on the result:
     - the REFER badge, then the ear pills
     - UNCALIBRATED directly under the ears
     - the reasons
     - triage cards and "Export session JSON"
     - no red or yellow box
   - Turn Remove animations off again.
6. **Cases (O, P, Q, R).**
   - **O**: each case is a card with a status chip and a route chip; the checkbox fills indigo with ✓ and clears again.
   - **P**: tapping the card opens the case; the history times are IST.
   - **Q**: on a referred case only the legal moves show, and lost-to-follow-up without a reason says "Write a reason
     first."
   - **R**: Missed camp shows the reminder in both languages, then Rescheduled works.
   - The camp request screen and buttons look right.
7. **Sync and T.**
   - The Sync screen shows the figure in an arch with the big count. Sync.
   - **T**: Download the PDF; it shows IST times, no Class column, and "not done" for a case without triage.

Optional, APK build only: the launcher icon (marigold wave on Night) and the Night splash. Expo Go shows its own
loader.
