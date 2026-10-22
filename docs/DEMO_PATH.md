# Demo path (Phase 5)

Screening and referral tool, **not a diagnosis**. Every name is a fake pseudonym ("Student D1"). Results are at an
**uncalibrated** volume until Phase 6.

Automated versions of this path:

- Phone side: `cd screener && npx jest src/__tests__/demoPath.test.ts`: real engine, rules, local store and case
  logic with a fake audio layer; 3 children → 1 REFER → triage → camp request → seen → treated → closed → sync to a
  fake server that replays every move with the shared transition table; plus the missed-camp branch.
- Server side: `cd server && .venv/bin/python -m pytest referrals/tests/test_demo_path.py`: the same records through
  the real `/api/sync/`, the camp request PDF, and the stubbed reminder on "missed".

## Before the demo (laptop)

```
sudo ufw allow 8000/tcp                                   # once
cd ~/sfic/server
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo                      # only on a fresh db.sqlite3
.venv/bin/python manage.py createsuperuser                # once; this is the phone login
.venv/bin/python manage.py runserver 0.0.0.0:8000
```

`server/.env` must list the laptop's LAN IP in `DJANGO_ALLOWED_HOSTS` (`ip -4 addr show scope global`).
Phone: `cd ~/sfic/screener && npx expo start`, open in Expo Go. Settings: server `http://<laptop-ip>:8000`, log in
(loads schools **and the facility list**), pick "Demo Government School, Hyderabad", enter the earphone model and media
volume. Without the laptop, the school name can be typed instead (Settings, or the box on Create Classroom / Add a
child, pre-filled with the same demo name); the next sync creates it on the server, and picking the server school after
login moves the phone's unsent records onto it.

## Script (about 10 minutes)

1. **Language.** Tap "Telugu" in the header. Untranslated text shows `[TODO_TE]` + English until [TELUGU_SPEAKER]'s
   strings are in (`docs/TELUGU_STRINGS.md`). Switch back.
2. **Children.** Add "Student D1", "Student D2", "Student D3" (age 9-11).
3. **Screen D1** (honest tapping): consent → device check → left/right check (🔊 plays the Telugu line) → room noise
   (🔊 first, then Measure) → test: "Play voice instructions (Telugu)", Start, the child taps the **balloon** for every
   beep → PASS. Done.
4. **Screen D2**, the child deliberately does not tap for some beeps in one ear → REFER (after the automatic
   rescreen). The result screen shows the **ear-health triage** ("Triage, not diagnosis"): answer the five yes/no
   questions; with ear pain = Yes the route is the PHC in the school's mandal. Save, Done.
5. **Screen D3** (honest) → PASS.
6. **Referral cases** (home): filter by status; D2 is "Referred" with route PHC. Open it: history, triage, and only
   the legal next moves as buttons.
7. **Camp request:** back in the list, tick D2 → "Create camp request (1 selected)" → date, facility → Create. D2 is now
   "Camp scheduled". "Share CSV" works offline.
8. **Sync** (home → Sync now). Then on the camp request: **"Download PDF (after sync)"** fetches the PDF the laptop
   generated and opens the share sheet. Laptop alternative: log in at `http://localhost:8000/admin/` with the
   superuser, then open `http://localhost:8000/api/camp-requests/<camp id>/pdf/` (the id is in the phone's sync list
   as `camp_request <first 8 chars>`, or at `http://localhost:8000/api/camp-requests/`).
9. **Close the loop** on D2: Seen at camp → Treated / onward care (pick "Wax removed") → Closed. Sync again.
10. **Missed branch (optional):** for another referred child, camp request → "Missed camp": the case shows
    "Reminders (stubbed: logged, not sent)" with the reminder text. Nothing is sent (real SMS is a future cost).

What to say: the test is the start, not the product: the case stays open until the child is seen and treated or a
reason for loss to follow-up is recorded.
