# Original UI phone checklist (Redmi 2201117TI, Samsung wired earphones, Expo Go)

Updated 2026-10-20 for the fix-and-finish pass (login first, five tabs, child's tests, our design). After `git pull`
and a reload of the app. Use fake children only (Student T1, T2 ...). Report pass / fail and anything odd for each
number. Plan and parity table: `docs/INTEGRATION_PLAN.md`.

## A. Login first
1. Fresh start of the app opens the **login** (night screen, teacher in the arch). No tab bar yet.
2. Type a name and a 4-digit PIN → Log in → **Home**: "Welcome," and your name, the school, today's date.
3. Close Expo Go fully and reopen: you are still logged in (Home, not login).
4. Settings → Log out → back on the login. A wrong PIN shows "Wrong PIN for this phone."; the right one logs in.

## B. Tabs and Home
1. Tabs: Home, Children, Assignments, Cases, Settings; each opens, the current one is highlighted with a marigold arch.
2. Home → New classroom → type "5A", strength 30: the card preview updates while you type; Create → 5A on Home.
3. **Tap a classroom card: no crash** (the old Teacher-tab crash, ERR-054). The classroom page opens.

## C. Classroom, assignments, child's tests
1. Classroom → Add children to this classroom → tick two children: they appear in the list.
2. Assignments tab → pick 5A, name "Term 1", tap "2 weeks" → Create: the card shows the deadline and 0 of 30.
3. Tap a child (Children tab, classroom, analytics, or the name on a case): **Child's tests** opens with Screen again
   and Detailed test buttons; after a test the new row appears at the top with date, type, assignment and result.
4. "View result" on a row opens the full result.

## D. Make sure → Check your surrounding → Which ear (detailed test for Student T1)
1. Six drawings with labels; Next. The three-step bar on top moves as you go.
2. Measure room noise: the mic rings light up (teal quiet / amber 500 Hz left out / rust too noisy); Continue shows
   the confirmation card with the reason.
3. Which ear: Play, then Left / Right; the dots fill; a wrong answer resets them.

## E. Detailed test
1. Start Test plays the first tone in the earphones. The head shows the ear under test (left ear: head faces left).
2. Hz and dB chips change; Replay plays again; Yes / No move on. Pull the earphones out: Yes, No, Replay grey out;
   plug back in, tap Replay.

## F. Your Results and analytics (the charts must draw on the phone)
1. Results: grade card, left / right ear cards, the left-vs-right bars, the audiogram (✕ left, ○ right, ▽ not heard),
   the band audiogram, the category table. Tap a frequency column: its values show under the chart.
2. Share icon → bottom sheet → Export to PDF / WhatsApp / doctor each open the share menu with a PDF.
3. Assignments → Term 1 → analytics: the donut draws (outer ring outcomes, inner ring grades); tap a slice and a
   legend chip: the list filters; "More details" opens the result; tapping the child opens their tests.

## G. Telugu
1. Switch to Telugu and repeat a quick pass of A–F: nothing cut off or overlapping, and no `[TODO_TE]` marker anywhere
   (batch 5 filled the last 56 strings, `docs/TELUGU_BATCH_5.md`). English left on purpose: PASS / RETEST / REFER,
   dB, Hz, WHO, PDF, WhatsApp, PIN, dates.
2. Home shows "స్వాగతం," with your name on the next line.
