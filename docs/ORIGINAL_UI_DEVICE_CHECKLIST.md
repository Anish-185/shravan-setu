# Original UI phone checklist (Redmi 2201117TI, Samsung wired earphones, Expo Go)

After `git pull` and a reload of the app. Use fake children only (Student T1, T2 ...). Report pass / fail and anything
odd for each number. Plan: `docs/INTEGRATION_PLAN.md`.

## A. Bottom tabs
1. Tabs show Home, Children, Cases, Teacher, Settings; each opens its screen and the current tab is highlighted.
2. Children and Cases show the banner (red strip over the doodle background, picture on the right).
3. During a screening and a detailed test the tab bar is hidden; it comes back on the result screen.

## B. Make sure → Check your surrounding → Which ear (start a screening for Student T1)
1. After consent: "Make sure.." with six pictures in three rows (quiet place, headphones, notifications off, equalizer
   neutral, no talking, noise-cancel off). Next.
2. Check your surrounding: microphone picture, one timed measurement, a coloured bar (red too noisy, amber 500 Hz left
   out, blue fine). Continue → "Test Confirmation" dialog with our value and reason; Stop and Continue both work.
3. Which ear: two-ears picture, Play, then Left / Right / None?. A right answer adds to "Correct in a row: n of N"; a
   wrong one says to switch the earphones and restarts the count; None? shows the no-sound message. Answers do
   nothing before Play.

## C. The screening test still works as before
1. Finish the screening: tones, tapping and timing feel the same as before this version.
2. The result shows PASS / RETEST / REFER with the same reasons as before, and the provisional-calibration line.
3. A REFER still creates a case (Cases tab), and sync to the laptop still works.

## D. Detailed hearing test
1. On a REFER result: "Detailed hearing test (optional)" opens it. Also from Teacher → a classroom → a child → Detailed
   hearing test.
2. Flow: consent → Make sure (progress bar) → device check → Check your surrounding → Which ear → "Pure Tone
   Audiometry Test" start card → Start Test. The first tone plays on Start.
3. Each tone: ear label and head picture match the ear being tested; the threshold bar and dB chip go up in 10 dB
   steps after No; Yes moves on; Replay plays the same tone again.
4. **Unplug the earphones mid-test:** the tone stops at once, the "Plug in the wired earphones" line shows, and Yes /
   No / Replay are disabled. Nothing plays through the speaker. Plug back in and tap Replay: the test continues from the same tone.
5. Say No to every tone at one frequency: the test moves on after the loudest level (30 dB at 500 Hz, 60 dB at 1-4
   kHz).

## E. Your Results
1. The ear cards show the average in dB and **"Estimated: <grade>"**; the line "Estimated from a phone test with
   provisional calibration." shows.
2. The categories table has the header "Range (WHO, dB HL)" and the WHO source line under it.
3. Both audiograms draw: the line/scatter one (both ears, legend) and the coloured-band one. A frequency never heard
   shows as **▼**, with the ▼ note under the chart, and the average shows "≥".
4. Share icon → menu with Export to PDF, Share on WhatsApp, Share with doctor, Cancel. Each opens the Android share
   sheet with a PDF; open the PDF: numbers, table, WHO source and "Screening and referral tool, not a diagnosis."

## F. Teacher view
1. Teacher tab → demo login → Teacher Profile Page: avatar, your name, the school from Settings.
2. Create Classroom: name 5A, strength 30 → "Classroom created successfully"; it appears in the list and in search.
3. Open 5A → "Add children to this classroom": add two children; Remove takes one out again. Adding a child with
   class 5A on the Children screen also puts them in 5A.
4. Create New Assignment: name + deadline (empty = 7 days; a bad date shows the format message). The card shows a
   cover, the deadline, class strength and progress n/30; screening a child of 5A raises n by one.
5. Open the assignment → Assignments Analytics: the pie chart shows the categories with percentages and a legend with
   counts; tapping a slice or a legend colour filters the child cards; tapping again clears the filter.
6. More details on a child card opens the detailed results (or the screening result if there is no detailed test).

## G. Telugu
1. Switch to Telugu and repeat a quick pass of A, B, D, E and F: every new screen, button, dialog, tab name and
   banner is in Telugu, with no `[TODO_TE]` marker and no English left except PASS / RETEST / REFER, dB, Hz, WHO, PDF,
   WhatsApp and dates.
2. Placeholders are filled (counts, dates, grades), not shown as `{n}`.
3. Long lines (legend note, WHO source, the ▼ note) wrap without being cut off.

## H. Pictures (redrawn by Team JL)
1. Every picture in A–F shows (no blank boxes) and looks sharp, not stretched.
