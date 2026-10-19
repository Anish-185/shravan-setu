# Telugu text for Shravan Setu: reviewed and approved
**Status: Reviewed by Anish, native Telugu speaker, 18-10-2026. Approved for use in the app.**
**Machine checks by Claude, 18-10-2026 (three passes plus a final check). 30 lines changed compared with the first draft: 8 for meaning, medical safety or privacy (⚠️), 14 for grammar or clarity (✏️), and 8 where "triage" became ప్రాథమిక పరిశీలన at the reviewer's request (✅). Final check found no further errors. Automated checks passed: all 167 IDs, English texts and {placeholders} unchanged; protected English terms (PASS/RETEST/REFER, PHC, DEIC, CSV, PDF, JSON, Wi-Fi, L/R) kept; the voice-line table matches #156–#160 exactly; the "not a diagnosis" wording is identical in #1, #104 and #167; ట్రయాజ్ no longer appears anywhere.**
**Developer action still needed: #167 needs the app to insert a Telugu-style date such as "24-10-2026 న", or nothing at all.**
Drafted by Claude (Anthropic) from `docs/TELUGU_STRINGS.md` at commit 4d6326c. All 167 texts are included, in the same order and with the same IDs. Rows #168–#185 (rule reasons) were added on 18-10-2026, written by Anish. Row #186 (reminder date form) was added on 18-10-2026, approved by Anish.
## How to review
1. Read every Telugu line aloud. Ask: is it correct, natural, and easy for a government-school teacher (or, for the voice lines, a 6–10-year-old child) to understand?
2. If a line is wrong or awkward, edit it directly in the **Telugu** column. Don't touch the ID or English columns.
3. Keep every `{placeholder}` exactly as written, including the curly brackets. The app fills them in. You may move a placeholder within the sentence if Telugu word order needs it.
4. Keep PASS / RETEST / REFER, PHC, DEIC, CSV, PDF, JSON, Wi-Fi and L/R in English.
5. Pay special attention to the medical lines: #1, #98, #103–#110, #128–#131, #162–#167. "Not a diagnosis" must stay clearly "not a diagnosis".
6. Check the **Notes** column where it has something.
7. When done, change the status line at the top to: `Reviewed by <your name>, native Telugu speaker, <date>`.

## All texts
| # | ID | English | Where it appears | Telugu | Notes |
|---|---|---|---|---|---|
| 1 | `banner` | Screening only, not a diagnosis | Yellow banner on every screen that shows a result | ఇది స్క్రీనింగ్ మాత్రమే, వ్యాధి నిర్ధారణ కాదు | 🔍 Second check: correct. Uses the same phrase as #104 and #167 (వ్యాధి నిర్ధారణ కాదు). |
| 2 | `lang.switchToTe` | Telugu | Header button on every screen: switches the app to Telugu | తెలుగు |  |
| 3 | `lang.switchToEn` | English | Header button on every screen: switches the app to English | English | Kept in English on purpose, so an English reader can always find the switch. |
| 4 | `common.continue` | Continue | Button: go to the next step | కొనసాగించండి |  |
| 5 | `common.yes` | Yes | Answer button | అవును |  |
| 6 | `common.no` | No | Answer button | లేదు | లేదు (not కాదు), because the questions ask whether something is present. |
| 7 | `common.notSet` | not set | Shown when a setting is empty | సెట్ చేయలేదు |  |
| 8 | `title.home` | Hearing screening | Screen title in the header | వినికిడి స్క్రీనింగ్ |  |
| 9 | `title.children` | Children | Screen title in the header | విద్యార్థులు |  |
| 10 | `title.screen` | Screening test | Screen title in the header | స్క్రీనింగ్ పరీక్ష |  |
| 11 | `title.sync` | Sync | Screen title in the header | సింక్ |  |
| 12 | `title.settings` | Settings | Screen title in the header | సెట్టింగ్స్ |  |
| 13 | `title.spike` | Audio spike (developer) | Screen title in the header | ఆడియో స్పైక్ (డెవలపర్) |  |
| 14 | `title.cases` | Referral cases | Screen title in the header | రిఫరల్ కేసులు |  |
| 15 | `title.case` | Case | Screen title in the header | కేసు |  |
| 16 | `title.camp` | Camp request | Screen title in the header | క్యాంప్ అభ్యర్థన |  |
| 17 | `home.intro` | School hearing screening and referral. Works offline; sync when you have a connection. | Home screen, intro line | పాఠశాల వినికిడి స్క్రీనింగ్ మరియు రిఫరల్. ఇంటర్నెట్ లేకుండా పనిచేస్తుంది; కనెక్షన్ ఉన్నప్పుడు సింక్ చేయండి. |  |
| 18 | `home.screen` | Screen a child | Home screen link | విద్యార్థికి స్క్రీనింగ్ చేయండి |  |
| 19 | `home.cases` | Referral cases | Home screen link | రిఫరల్ కేసులు |  |
| 20 | `home.sync` | Sync | Home screen link | సింక్ |  |
| 21 | `home.settings` | Settings | Home screen link | సెట్టింగ్స్ |  |
| 22 | `home.spike` | Audio spike (developer) | Home screen link (developer tool) | ఆడియో స్పైక్ (డెవలపర్) |  |
| 23 | `children.pickSchool` | Pick your school in Settings first. | Children screen, before a school is set | ముందుగా సెట్టింగ్స్‌లో మీ పాఠశాలను ఎంచుకోండి. |  |
| 24 | `children.addH` | Add a child | Children screen heading | విద్యార్థి వివరాలు జోడించండి | ✏️ Changed. Old: విద్యార్థిని జోడించండి. As a heading on its own, విద్యార్థిని can also be read as "female student". |
| 25 | `children.namePlaceholder` | Pseudonym, e.g. "Student A1" | Children screen, name box hint | కోడ్ పేరు (అసలు పేరు కాదు), ఉదా. "Student A1" | "Student A1" stays in English: it's an example of the pseudonym format. ⚠️ Changed in 3rd check (privacy). Old మారుపేరు usually means "nickname", so a teacher might type the child's real nickname, which identifies the child. New text: "code name (not the real name)". |
| 26 | `children.add` | Add | Children screen button | జోడించండి |  |
| 27 | `children.listH` | Children | Children screen heading | విద్యార్థులు |  |
| 28 | `children.row` | {name} ({age}) → screen | Children list row; {name} = pseudonym, {age} = age band | {name} ({age}) → స్క్రీనింగ్ |  |
| 29 | `sync.pending` | {n} record(s) waiting to sync. | Sync screen | సింక్ కోసం వేచి ఉన్న రికార్డులు: {n}. | ✏️ Changed. Old text read "1 రికార్డులు ... ఉన్నాయి" when n = 1 (plural noun and verb with one). The label form works for any number. |
| 30 | `sync.now` | Sync now | Sync screen button | ఇప్పుడు సింక్ చేయండి |  |
| 31 | `sync.busy` | Syncing… | Sync screen, while syncing | సింక్ అవుతోంది… |  |
| 32 | `sync.setup` | Set up the backend and school in Settings first. | Sync screen, before setup | ముందుగా సెట్టింగ్స్‌లో బ్యాకెండ్ మరియు పాఠశాలను సెటప్ చేయండి. |  |
| 33 | `sync.done` | Sent {pushed}, failed {failed}, case updates received {pulled}. | Sync screen, after sync | పంపినవి {pushed}, విఫలమైనవి {failed}, అందిన కేసు అప్‌డేట్లు {pulled}. |  |
| 34 | `sync.failed` | {error}. Nothing was lost; try again when connected. | Sync screen, sync error ({error} stays in English) | {error}. మీ డేటా అంతా ఫోన్‌లోనే సురక్షితంగా ఉంది; కనెక్షన్ ఉన్నప్పుడు మళ్ళీ ప్రయత్నించండి. | ⚠️ Changed (meaning). Old ఏదీ పోలేదు can also be read as "nothing was sent" (పోవు = go), the opposite of the reassurance intended. New text: "All your data is safe on the phone". |
| 35 | `settings.backendH` | Backend | Settings heading | బ్యాకెండ్ |  |
| 36 | `settings.backendP` | The laptop running the server, on the same Wi-Fi. Only needed for sync. | Settings | సర్వర్ నడుస్తున్న ల్యాప్‌టాప్. ఇది ఈ ఫోన్ ఉన్న Wi-Fi లోనే ఉండాలి. సింక్ కోసం మాత్రమే అవసరం. | ✏️ Changed in 3rd check. Old "అదే Wi-Fi" didn't say the same Wi-Fi as what. Now: "on the same Wi-Fi as this phone". |
| 37 | `settings.username` | username | Settings, login box hint | యూజర్‌నేమ్ |  |
| 38 | `settings.password` | password | Settings, password box hint | పాస్‌వర్డ్ |  |
| 39 | `settings.login` | Log in and load schools | Settings button | లాగిన్ చేసి పాఠశాలలను లోడ్ చేయండి |  |
| 40 | `settings.connecting` | Connecting… | Settings, while logging in | కనెక్ట్ అవుతోంది… |  |
| 41 | `settings.loggedIn` | Logged in. Pick your school. | Settings, after login | లాగిన్ అయ్యారు. మీ పాఠశాలను ఎంచుకోండి. |  |
| 42 | `settings.schoolSet` | School set: {name}. | Settings, after picking a school | పాఠశాల సెట్ అయింది: {name}. |  |
| 43 | `settings.school` | School: {name} | Settings | పాఠశాల: {name} |  |
| 44 | `settings.deviceH` | Standard device | Settings heading | ప్రామాణిక పరికరం |  |
| 45 | `settings.deviceP` | Recorded with every test. Use the same wired earphones and the same media-volume setting every time. | Settings | ఈ వివరాలు ప్రతి పరీక్షతో పాటు నమోదు అవుతాయి. ప్రతిసారీ అవే వైర్డ్ ఇయర్‌ఫోన్లు, అదే మీడియా వాల్యూమ్ సెట్టింగ్ వాడండి. | ✏️ Changed in 3rd check. Added the subject ("These details are recorded…"); the old sentence didn't say what is recorded. |
| 46 | `settings.earphone` | Earphone model (wired) | Settings, box hint | ఇయర్‌ఫోన్ మోడల్ (వైర్డ్) |  |
| 47 | `settings.volume` | Media volume, e.g. "zero, then up 8 steps" | Settings, box hint | మీడియా వాల్యూమ్, ఉదా. "సున్నా, తర్వాత 8 స్టెప్స్ పైకి" |  |
| 48 | `settings.saveDevice` | Save device settings | Settings button | పరికర సెట్టింగ్స్ సేవ్ చేయండి |  |
| 49 | `settings.deviceSaved` | Device settings saved. | Settings, after saving | పరికర సెట్టింగ్స్ సేవ్ అయ్యాయి. |  |
| 50 | `screen.notFound` | Child not found. | Screening screen error | విద్యార్థి వివరాలు కనబడలేదు. | ⚠️ Changed (meaning). Old విద్యార్థి కనబడలేదు can be read as "the child is missing". New text: "the child's record was not found". |
| 51 | `consent.h` | 1. Consent | Screening step heading | 1. సమ్మతి |  |
| 52 | `consent.p` | Consent must be recorded before any test. Who gave it, and how? | Consent step | ఏ పరీక్షకైనా ముందు సమ్మతి నమోదు చేయాలి. ఎవరు ఇచ్చారు, ఎలా ఇచ్చారు? |  |
| 53 | `consent.by.parent` | Parent | Consent step choice | తల్లి/తండ్రి |  |
| 54 | `consent.by.guardian` | Guardian | Consent step choice | సంరక్షకులు |  |
| 55 | `consent.method.written` | Written | Consent step choice | లిఖితపూర్వకంగా |  |
| 56 | `consent.method.verbal` | Verbal | Consent step choice | మౌఖికంగా |  |
| 57 | `consent.method.school_form` | School form | Consent step choice | పాఠశాల ఫారం ద్వారా | ✏️ Changed in 3rd check. #52 asks "how" (ఎలా); #55–#56 answer with adverbs, so this now reads "through the school form" to match. |
| 58 | `consent.continue` | Consent given: continue | Consent step button | సమ్మతి ఇచ్చారు: కొనసాగించండి |  |
| 59 | `consent.stop` | No consent: stop | Consent step button | సమ్మతి లేదు: ఆపండి |  |
| 60 | `device.h` | 2. Device check | Screening step heading | 2. పరికర తనిఖీ |  |
| 61 | `device.phone` | Phone: {model} | Device check | ఫోన్: {model} |  |
| 62 | `device.earphones` | Earphones: {model} | Device check | ఇయర్‌ఫోన్లు: {model} |  |
| 63 | `device.volume` | Media volume: {setting} | Device check | మీడియా వాల్యూమ్: {setting} |  |
| 64 | `device.notSetSettings` | not set (Settings) | Device check, missing setting | సెట్ చేయలేదు (సెట్టింగ్స్) |  |
| 65 | `device.detected` | Wired earphones detected. | Device check, status | వైర్డ్ ఇయర్‌ఫోన్లు గుర్తించబడ్డాయి. |  |
| 66 | `device.notDetected` | No wired earphones detected. Plug them in. Tones never play through the speaker. | Device check, status | వైర్డ్ ఇయర్‌ఫోన్లు గుర్తించబడలేదు. వాటిని ప్లగ్ చేయండి. టోన్లు ఎప్పుడూ ఫోన్ స్పీకర్‌లో ప్లే కావు. | ✏️ Changed. Now matches #65 (గుర్తించబడ్డాయి / గుర్తించబడలేదు); "play" instead of "come" for the tones. |
| 67 | `device.micStarting` | Starting microphone… | Device check, status | మైక్రోఫోన్ ప్రారంభమవుతోంది… |  |
| 68 | `device.volumeOk` | Media volume is at the fixed setting: {setting} | Device check, tick box | మీడియా వాల్యూమ్ నిర్ణీత సెట్టింగ్‌లో ఉంది: {setting} |  |
| 69 | `device.btOff` | Bluetooth is off | Device check, tick box | బ్లూటూత్ ఆఫ్‌లో ఉంది |  |
| 70 | `lr.h` | 3. Left / right check | Screening step heading | 3. ఎడమ / కుడి తనిఖీ |  |
| 71 | `lr.p` | Play a beep. The child points to the ear that heard it; tap that side. | Left/right check | ఒక బీప్ ప్లే చేయండి. విద్యార్థి ఏ చెవిలో విన్నారో ఆ చెవిని చూపిస్తారు; ఆ వైపును నొక్కండి. |  |
| 72 | `lr.play` | Play beep | Left/right check button | బీప్ ప్లే చేయండి |  |
| 73 | `lr.left` | Left | Left/right check button | ఎడమ |  |
| 74 | `lr.right` | Right | Left/right check button | కుడి |  |
| 75 | `lr.plugIn` | Plug in the wired earphones first. | Left/right check message | ముందుగా వైర్డ్ ఇయర్‌ఫోన్లను ప్లగ్ చేయండి. |  |
| 76 | `lr.wrong` | Wrong side. Check the L/R marks on the earphones, then start again. | Left/right check message | తప్పు వైపు. ఇయర్‌ఫోన్లపై ఉన్న L/R గుర్తులు చూసి, మళ్ళీ మొదలుపెట్టండి. |  |
| 77 | `lr.correct` | Correct ({n} of {total}). | Left/right check message | సరైన వైపు ({total} లో {n}). | Telugu order is "{total} లో {n}" ("n of total"). ✏️ Changed. Old సరైనది ("it is correct"); now సరైన వైపు, pairing with తప్పు వైపు in #76. |
| 78 | `ambient.h` | 4. Room noise | Screening step heading | 4. గదిలో శబ్దం |  |
| 79 | `ambient.p` | Everyone quiet for a few seconds. Earphones on the child. | Room noise step | కొన్ని సెకన్లు అందరూ నిశ్శబ్దంగా ఉండండి. ఇయర్‌ఫోన్లు విద్యార్థి చెవుల్లో ఉండాలి. |  |
| 80 | `ambient.measure` | Measure room noise | Room noise step button | గదిలో శబ్దాన్ని కొలవండి |  |
| 81 | `ambient.measuring` | Measuring… | Room noise step, while measuring | కొలుస్తోంది… |  |
| 82 | `ambient.value` | Room noise: {value} re: reference quiet room (relative, uncalibrated) | Room noise step result; {value} is a number | గదిలో శబ్దం: {value} (నిశ్శబ్ద రిఫరెన్స్ గదితో పోలిస్తే; సాపేక్ష విలువ, క్యాలిబ్రేట్ చేయలేదు) |  |
| 83 | `ambient.couldNot` | Room noise: could not measure | Room noise step result | గదిలో శబ్దం: కొలవలేకపోయాం |  |
| 84 | `ambient.noisy` | The room is noisy: many tones may be discarded. Move somewhere quieter if you can. | Room noise step warning | గదిలో శబ్దం ఎక్కువగా ఉంది: చాలా టోన్లు రద్దు కావచ్చు. వీలైతే నిశ్శబ్దమైన చోటికి వెళ్ళండి. |  |
| 85 | `ambient.continue` | Continue to the test | Room noise step button | పరీక్షకు వెళ్ళండి | ✏️ Changed. Old పరీక్షకు కొనసాగించండి is grammatically awkward. New: "Go to the test". |
| 86 | `test.h` | 5. Test | Screening step heading | 5. పరీక్ష |  |
| 87 | `test.teacher` | Play the voice instructions, or tell the child: “Tap the balloon every time you hear a beep, even a very quiet one.” Then hand over the phone. | Test step, for the teacher | వాయిస్ సూచనలు ప్లే చేయండి, లేదా విద్యార్థికి ఇలా చెప్పండి: “బీప్ వినిపించిన ప్రతిసారీ, చాలా మెల్లగా వినిపించినా సరే, బెలూన్‌ను నొక్కు.” తర్వాత ఫోన్‌ను విద్యార్థికి ఇవ్వండి. | Teacher-facing (polite), but the quoted sentence speaks to the child (informal, నొక్కు). |
| 88 | `test.playVoice` | Play voice instructions (Telugu) | Test step button and the speaker buttons in other steps | వాయిస్ సూచనలు ప్లే చేయండి (తెలుగు) |  |
| 89 | `test.voicePlaceholder` | voice placeholder | Developer tag shown when a voice file is still a silent placeholder | వాయిస్ ప్లేస్‌హోల్డర్ |  |
| 90 | `test.start` | Start test | Test step button | పరీక్ష ప్రారంభించండి |  |
| 91 | `test.pausedChanged` | Paused after an earphone change. The interrupted beep will be repeated. | Test paused | ఇయర్‌ఫోన్లలో మార్పు వల్ల పరీక్ష తాత్కాలికంగా ఆగింది. మధ్యలో ఆగిన బీప్ మళ్ళీ వినిపిస్తుంది. | ✏️ Changed. Added తాత్కాలికంగా so it reads "paused", not "stopped". "Interrupted beep" is now మధ్యలో ఆగిన బీప్. |
| 92 | `test.disconnected` | Earphones disconnected. Plug them back in. | Test paused | ఇయర్‌ఫోన్లు డిస్‌కనెక్ట్ అయ్యాయి. మళ్ళీ ప్లగ్ చేయండి. |  |
| 93 | `test.resume` | Resume | Test paused button | మళ్ళీ కొనసాగించండి |  |
| 94 | `test.progress` | {done} of {total} | Child mode, small progress text | {total} లో {done} | Telugu order is "{total} లో {done}". |
| 95 | `test.balloon` | I heard a beep | Child mode balloon (read by screen readers) | నాకు బీప్ వినిపించింది |  |
| 96 | `result.h` | Result: {outcome} | Result step; {outcome} stays PASS / RETEST / REFER | ఫలితం: {outcome} |  |
| 97 | `result.ears` | Left ear: {left} · Right ear: {right} | Result step; values stay PASS / RETEST / REFER | ఎడమ చెవి: {left} · కుడి చెవి: {right} |  |
| 98 | `result.uncalibrated` | UNCALIBRATED test level (development volume). Not valid for real screening yet. | Result step warning | హెచ్చరిక: పరీక్ష స్థాయి క్యాలిబ్రేట్ చేయబడలేదు (డెవలప్‌మెంట్ వాల్యూమ్). ఈ ఫలితం నిజమైన స్క్రీనింగ్‌కు ఇంకా చెల్లదు. | ⚠️ Changed (medical). The old text did not say WHAT is not valid; it now says "this result is not valid". Telugu has no capital letters, so హెచ్చరిక ("Warning") replaces the English UNCALIBRATED in capitals. |
| 99 | `result.refer` | A referral case was created on this phone. Do the ear-health triage now, then sync. | Result step, REFER | ఈ ఫోన్‌లో రిఫరల్ కేసు సృష్టించబడింది. ఇప్పుడే చెవి ఆరోగ్య ప్రాథమిక పరిశీలన చేసి, తర్వాత సింక్ చేయండి. | ✅ Reviewer decision, 18-10-2026: "triage" is ప్రాథమిక పరిశీలన everywhere (#99, #103, #104, #106, #110, #133–#135); ట్రయాజ్ is no longer used. |
| 100 | `result.retest` | Retest this child, ideally in a quieter room. | Result step, RETEST | ఈ విద్యార్థికి మళ్ళీ పరీక్ష చేయండి, వీలైతే మరింత నిశ్శబ్దమైన గదిలో. |  |
| 101 | `result.export` | Export session JSON | Result step button | సెషన్ JSON ఎగుమతి చేయండి |  |
| 102 | `result.done` | Done | Result step button | పూర్తయింది |  |
| 103 | `triage.h` | Ear-health triage | Triage heading | చెవి ఆరోగ్య ప్రాథమిక పరిశీలన | ✅ Reviewer decision, 18-10-2026: "triage" is ప్రాథమిక పరిశీలన everywhere (#99, #103, #104, #106, #110, #133–#135); ట్రయాజ్ is no longer used. |
| 104 | `triage.label` | Triage, not diagnosis | Triage label (always shown) | ప్రాథమిక పరిశీలన మాత్రమే, వ్యాధి నిర్ధారణ కాదు | 🔍 Second check: correct. Same "not a diagnosis" phrase as #1 and #167. ✅ Reviewer decision, 18-10-2026: "triage" is ప్రాథమిక పరిశీలన everywhere (#99, #103, #104, #106, #110, #133–#135); ట్రయాజ్ is no longer used. "Not a diagnosis" part unchanged. |
| 105 | `triage.p` | Ask the child (and the parent if present). Tap Yes or No for each question. | Triage instructions | విద్యార్థిని (తల్లి/తండ్రి ఉంటే వారిని కూడా) అడగండి. ప్రతి ప్రశ్నకు “అవును” లేదా “లేదు” నొక్కండి. | ⚠️ Changed (medical). Added quote marks around the button names. Without them, అవును లేదా లేదు ("Yes or No") is easy to misread, because లేదా ("or") and లేదు ("No") look almost the same. ✏️ Changed in 3rd check. English says "the parent" (one); తల్లిదండ్రులు means both parents. Now matches #53 (తల్లి/తండ్రి). |
| 106 | `triage.save` | Save triage | Triage button | ప్రాథమిక పరిశీలన సేవ్ చేయండి | ✅ Reviewer decision, 18-10-2026: "triage" is ప్రాథమిక పరిశీలన everywhere (#99, #103, #104, #106, #110, #133–#135); ట్రయాజ్ is no longer used. |
| 107 | `triage.routePHC` | Route: nearest PHC ({facility}) | Triage result | పంపాల్సిన చోటు: సమీప PHC ({facility}) |  |
| 108 | `triage.routeDEIC` | Route: DEIC ({facility}) | Triage result | పంపాల్సిన చోటు: DEIC ({facility}) |  |
| 109 | `triage.noFacility` | no facility list: log in once in Settings | Triage result, no facility loaded | ఆరోగ్య కేంద్రాల జాబితా లేదు: సెట్టింగ్స్‌లో ఒకసారి లాగిన్ చేయండి |  |
| 110 | `triage.saved` | Triage saved on the case. | Triage, after saving | ప్రాథమిక పరిశీలన కేసులో సేవ్ అయింది. | ✅ Reviewer decision, 18-10-2026: "triage" is ప్రాథమిక పరిశీలన everywhere (#99, #103, #104, #106, #110, #133–#135); ట్రయాజ్ is no longer used. |
| 111 | `cases.all` | All | Case list filter | అన్నీ |  |
| 112 | `cases.empty` | No cases on this phone yet. | Case list | ఈ ఫోన్‌లో ఇంకా కేసులు లేవు. |  |
| 113 | `cases.row` | {name}: {status} · {route} | Case list row | {name}: {status} · {route} |  |
| 114 | `cases.createCamp` | Create camp request ({n} selected) | Case list button | క్యాంప్ అభ్యర్థన సృష్టించండి ({n} ఎంచుకున్నారు) |  |
| 115 | `cases.selectHint` | Tick referred or rescheduled cases to put them in one camp request. | Case list hint | రిఫర్ చేసిన లేదా తిరిగి షెడ్యూల్ చేసిన కేసులను టిక్ చేసి, ఒకే క్యాంప్ అభ్యర్థనలో చేర్చండి. |  |
| 116 | `cases.shareCsv` | Share CSV | Case list button | CSV షేర్ చేయండి |  |
| 117 | `cases.camps` | Camp requests | Case list heading | క్యాంప్ అభ్యర్థనలు |  |
| 118 | `cases.campRow` | {date}: {n} case(s) | Camp request row | {date}: {n} కేసు(లు) | ✏️ Changed. Mirrors English case(s), so it is correct when n = 1. |
| 119 | `status.screened` | Screened | Case status name | స్క్రీనింగ్ పూర్తయింది |  |
| 120 | `status.referred` | Referred | Case status name | రిఫర్ చేశారు |  |
| 121 | `status.camp_scheduled` | Camp scheduled | Case status name | క్యాంప్ షెడ్యూల్ అయింది |  |
| 122 | `status.missed` | Missed camp | Case status name | క్యాంప్‌కు రాలేదు |  |
| 123 | `status.rescheduled` | Rescheduled | Case status name | తిరిగి షెడ్యూల్ చేశారు |  |
| 124 | `status.seen` | Seen at camp | Case status name | క్యాంప్‌లో పరీక్షించారు |  |
| 125 | `status.treated` | Treated / onward care | Case status name | చికిత్స చేశారు / తదుపరి సంరక్షణకు పంపారు | ⚠️ Changed in 3rd check (medical). Old తదుపరి సంరక్షణ is only "next care" and doesn't say the child was sent on for it. New: "treated / sent for further care", matching the past-tense style of #120–#124. |
| 126 | `status.closed` | Closed | Case status name | ముగిసింది |  |
| 127 | `status.closed_lost_to_followup` | Closed: lost to follow-up | Case status name | ముగిసింది: ఫాలో-అప్ సాధ్యం కాలేదు |  |
| 128 | `treatment.wax_removed` | Wax removed | Treatment choice when marking a case treated | గులిమి తొలగించారు | గులిమి = earwax. |
| 129 | `treatment.infection_treated` | Infection treated | Treatment choice when marking a case treated | ఇన్ఫెక్షన్‌కు చికిత్స చేశారు |  |
| 130 | `treatment.hearing_aid` | Hearing aid | Treatment choice when marking a case treated | వినికిడి యంత్రం |  |
| 131 | `treatment.further_audiology` | Further audiology | Treatment choice when marking a case treated | మరిన్ని వినికిడి పరీక్షలు (ఆడియాలజీ) |  |
| 132 | `case.status` | Status: {status} | Case detail | స్థితి: {status} |  |
| 133 | `case.route` | Triage: {route} · {facility} | Case detail | ప్రాథమిక పరిశీలన: {route} · {facility} | ✅ Reviewer decision, 18-10-2026: "triage" is ప్రాథమిక పరిశీలన everywhere (#99, #103, #104, #106, #110, #133–#135); ట్రయాజ్ is no longer used. |
| 134 | `case.noTriage` | Triage not done yet. | Case detail | ప్రాథమిక పరిశీలన ఇంకా చేయలేదు. | ✅ Reviewer decision, 18-10-2026: "triage" is ప్రాథమిక పరిశీలన everywhere (#99, #103, #104, #106, #110, #133–#135); ట్రయాజ్ is no longer used. |
| 135 | `case.doTriage` | Do triage | Case detail button | ప్రాథమిక పరిశీలన చేయండి | ✅ Reviewer decision, 18-10-2026: "triage" is ప్రాథమిక పరిశీలన everywhere (#99, #103, #104, #106, #110, #133–#135); ట్రయాజ్ is no longer used. |
| 136 | `case.history` | Status history | Case detail heading | స్థితి చరిత్ర |  |
| 137 | `case.event` | {at}: {from} → {to} | Case detail history row | {at}: {from} → {to} |  |
| 138 | `case.move` | Move to: | Case detail, before the status buttons | స్థితి మార్చండి: |  |
| 139 | `case.final` | This case is closed. | Case detail, no more moves | ఈ కేసు ముగిసింది. |  |
| 140 | `case.reason` | Reason (required) | Case detail, reason box hint for lost to follow-up | కారణం (తప్పనిసరి) |  |
| 141 | `case.why.illegal` | That move is not allowed from this status. | Case detail error | ఈ స్థితి నుండి ఆ మార్పు అనుమతించబడదు. |  |
| 142 | `case.why.needs_treatment` | Pick a treatment first. | Case detail error | ముందుగా చికిత్సను ఎంచుకోండి. |  |
| 143 | `case.why.needs_reason` | Write a reason first. | Case detail error | ముందుగా కారణం రాయండి. |  |
| 144 | `case.reminders` | Reminders (stubbed: logged, not sent) | Case detail heading | రిమైండర్లు (ప్రస్తుతం నమోదు మాత్రమే అవుతాయి, పంపబడవు) | ✏️ Changed in 3rd check. Old నమూనా ("sample") would confuse teachers, and పంపలేదు ("didn't send") sounds like a failure. New: "currently only recorded, not sent". |
| 145 | `case.wouldSend` | Would send: {text} | Case detail reminder row | పంపితే ఈ సందేశం వెళ్తుంది: {text} | ✏️ Changed in 3rd check. Old పంపబడేది means "what WILL be sent", which contradicts #144 (reminders are never sent). New: "If sent, this message would go". |
| 146 | `camp.h` | Camp request | Camp request heading | క్యాంప్ అభ్యర్థన |  |
| 147 | `camp.cases` | {n} case(s): {names} | Camp request | {n} కేసు(లు): {names} | ✏️ Changed. Mirrors English case(s), so it is correct when n = 1. |
| 148 | `camp.date` | Camp date (YYYY-MM-DD) | Camp request, date box hint | క్యాంప్ తేదీ (YYYY-MM-DD) |  |
| 149 | `camp.badDate` | Enter the date as YYYY-MM-DD. | Camp request error | తేదీని YYYY-MM-DD రూపంలో రాయండి. |  |
| 150 | `camp.facility` | Facility | Camp request, facility choice heading | ఆరోగ్య కేంద్రం |  |
| 151 | `camp.create` | Create camp request | Camp request button | క్యాంప్ అభ్యర్థన సృష్టించండి |  |
| 152 | `camp.created` | Saved on this phone. Sync to send it; the laptop makes the PDF after sync. | Camp request, after saving | ఈ ఫోన్‌లో సేవ్ అయింది. పంపడానికి సింక్ చేయండి; సింక్ తర్వాత ల్యాప్‌టాప్ PDF తయారు చేస్తుంది. |  |
| 153 | `camp.pdf` | Download PDF (after sync) | Camp request button | PDF డౌన్‌లోడ్ చేయండి (సింక్ తర్వాత) |  |
| 154 | `camp.pdfFailed` | Could not get the PDF: {error}. Sync first, and check the laptop is reachable. | Camp request error | PDF పొందలేకపోయాం: {error}. ముందుగా సింక్ చేయండి, ల్యాప్‌టాప్ అందుబాటులో ఉందో చూడండి. |  |
| 155 | `camp.shareCsv` | Share CSV | Camp request button | CSV షేర్ చేయండి |  |
| 156 | `voice.intro` | Hello! You will hear some beeps in your earphones. | Child mode: first line when the teacher taps 'Play voice instructions' | నమస్తే! నీ ఇయర్‌ఫోన్లలో కొన్ని బీప్ శబ్దాలు వినిపిస్తాయి. | Voice lines speak to the child informally (నీ / నొక్కు / చూపించు), which is how teachers usually address young pupils. |
| 157 | `voice.tap` | Every time you hear a beep, even a very quiet one, tap the balloon. | Child mode: second line, right after intro | బీప్ వినిపించిన ప్రతిసారీ, చాలా మెల్లగా వినిపించినా సరే, బెలూన్‌ను నొక్కు. |  |
| 158 | `voice.lr` | Point to the ear that heard the beep. | Left/right check: the teacher taps the speaker button before 'Play beep' | బీప్ ఏ చెవిలో వినిపించిందో ఆ చెవిని చూపించు. |  |
| 159 | `voice.quiet` | Please sit very quietly for a few seconds. | Room noise step: the teacher taps the speaker button, then 'Measure room noise' after it ends | దయచేసి కొన్ని సెకన్లు చాలా నిశ్శబ్దంగా కూర్చో. | 🔍 3rd check: a 6-year-old may not understand సెకన్లు ("seconds"). కాసేపు ("a little while") is more natural for young children. If you change it, change the voice-line table at the bottom too. ✅ Reviewer decision, 18-10-2026: keep as is. |
| 160 | `voice.done` | All done. Well done! | Child mode: when the test finishes | అయిపోయింది. చాలా బాగా చేశావు! |  |
| 161 | `common.playVoice` | Play voice line | Speaker button (read by screen readers) | వాయిస్ లైన్ ప్లే చేయండి |  |
| 162 | `triage.ear_discharge` | Is there fluid or discharge from the ear? | Triage checklist question (yes/no) | చెవి నుండి నీరు, చీము లేదా ఏదైనా ద్రవం కారుతోందా? | ⚠️ Changed (medical). చీము means pus only. "Discharge" also covers blood or other fluid, so a narrow question could miss a child who should be referred. Added లేదా ఏదైనా ద్రవం ("or any fluid"). |
| 163 | `triage.ear_pain` | Does the child have ear pain? | Triage checklist question (yes/no) | విద్యార్థికి చెవి నొప్పి ఉందా? |  |
| 164 | `triage.recent_cold` | Has the child had a cold or blocked nose recently? | Triage checklist question (yes/no) | విద్యార్థికి ఇటీవల జలుబు గానీ ముక్కు దిబ్బడ గానీ ఉండిందా? | ⚠️ Changed (medical). Old ఉందా asks "does the child have it NOW"; English asks "has the child had it recently". Changed to past tense ఉండిందా. Also uses గానీ…గానీ instead of లేదా, so the word "or" isn't confused with the "No" button. Native reviewer: please confirm ఉండిందా sounds natural. ✅ Reviewer decision, 18-10-2026: keep as is. |
| 165 | `triage.blocked_feeling` | Does the child say the ear feels blocked or full? | Triage checklist question (yes/no) | చెవి మూసుకుపోయినట్లు లేదా బరువుగా ఉన్నట్లు విద్యార్థి చెబుతున్నారా? | 🔍 Second check: is బరువుగా ("heavy") the word a child or teacher would use for a "full" ear? దిమ్ముగా may be more natural. Native reviewer to decide. ✅ Reviewer decision, 18-10-2026: keep as is. |
| 166 | `triage.asks_for_repetition` | Teacher: does the child often ask for things to be repeated? | Triage checklist question (yes/no) | ఉపాధ్యాయులకు: విద్యార్థి తరచుగా చెప్పినదాన్ని మళ్ళీ చెప్పమని అడుగుతారా? | ✏️ Changed. Old విషయాలను is a word-for-word "things" and sounds unnatural. New: "ask for what was said to be said again". |
| 167 | `reminders.missed_camp` | Reminder: {child} ({school}) missed the ear-check camp{date}. Please contact the class teacher to book a new date. This is a screening follow-up, not a diagnosis. | Stubbed reminder text when a case is marked missed (logged, never sent) | రిమైండర్: {child} ({school}) {date} చెవి పరీక్ష క్యాంప్‌కు హాజరు కాలేదు. కొత్త తేదీ కోసం దయచేసి తరగతి ఉపాధ్యాయులను సంప్రదించండి. ఇది స్క్రీనింగ్ ఫాలో-అప్ మాత్రమే, వ్యాధి నిర్ధారణ కాదు. | {date} has moved BEFORE "చెవి పరీక్ష క్యాంప్‌కు", because Telugu word order differs. The app must insert a Telugu-friendly date here, e.g. "24-10-2026 న", or nothing. Tell Claude Code (see the prompt at the end). 🔍 Second check: the note above refers to "the prompt at the end", but this file has no prompt at the end. Make sure the {date} change reaches the developer some other way. ✅ Reviewer decision, 18-10-2026: keep as is. |
| 168 | `reason.fewCatch` | Retest: only {n} silent check trials were done ({needed} needed). | Screening result, list of reasons | మళ్ళీ పరీక్ష అవసరం: బీప్ లేని తనిఖీ రౌండ్లు {n} మాత్రమే జరిగాయి ({needed} అవసరం). | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 169 | `reason.unreliable` | Retest: responses were not reliable, so this test cannot refer. | Screening result, list of reasons | మళ్ళీ పరీక్ష అవసరం: స్పందనలు నమ్మదగినవిగా లేవు, కాబట్టి ఈ పరీక్ష ఆధారంగా రిఫర్ చేయలేం. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 170 | `reason.falseAlarms` | {n} of {total} silent check trials got a tap. | Screening result, list of reasons, after the 'not reliable' line | బీప్ లేని {total} తనిఖీ రౌండ్లలో {n} సార్లు నొక్కారు. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 171 | `reason.outOfWindow` | {n} of {total} tone trials got a tap outside the response window. | Screening result, list of reasons, after the 'not reliable' line | {total} బీప్ రౌండ్లలో {n} సార్లు నిర్ణీత సమయం వెలుపల నొక్కారు. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 172 | `reason.notHeardConfirmed` | {ear} ear {freq} Hz: not heard, confirmed on rescreen. | Screening result, list of reasons ({ear} = Left or Right, shown with the Telugu word from the left/right check; {freq} = tone in Hz) | {ear} చెవి {freq} Hz: వినిపించలేదు; రెండోసారి పరీక్షించినప్పుడూ వినిపించలేదు. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 173 | `reason.notHeard` | {ear} ear {freq} Hz: not heard. | Screening result, list of reasons ({ear} = Left or Right, shown with the Telugu word from the left/right check; {freq} = tone in Hz) | {ear} చెవి {freq} Hz: వినిపించలేదు. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 174 | `reason.heardOnRescreen` | {ear} ear {freq} Hz: missed at first, heard on rescreen. | Screening result, list of reasons ({ear} = Left or Right, shown with the Telugu word from the left/right check; {freq} = tone in Hz) | {ear} చెవి {freq} Hz: మొదట వినిపించలేదు, రెండోసారి పరీక్షించినప్పుడు వినిపించింది. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 175 | `reason.noisy` | {ear} ear {freq} Hz: too noisy to test ({n} tones discarded for noise). | Screening result, list of reasons ({ear} = Left or Right, shown with the Telugu word from the left/right check; {freq} = tone in Hz) | {ear} చెవి {freq} Hz: శబ్దం ఎక్కువగా ఉండి పరీక్షించలేకపోయాం (శబ్దం వల్ల {n} టోన్లు రద్దయ్యాయి). | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 176 | `reason.notTested` | {ear} ear {freq} Hz: not tested. | Screening result, list of reasons ({ear} = Left or Right, shown with the Telugu word from the left/right check; {freq} = tone in Hz) | {ear} చెవి {freq} Hz: పరీక్షించలేదు. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 177 | `reason.rescreenMissing` | {ear} ear {freq} Hz: missed in the first round and not rescreened yet. | Screening result, list of reasons ({ear} = Left or Right, shown with the Telugu word from the left/right check; {freq} = tone in Hz) | {ear} చెవి {freq} Hz: మొదటి రౌండ్‌లో వినిపించలేదు, ఇంకా రెండోసారి పరీక్షించలేదు. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 178 | `reason.allHeard` | All tones were heard in both ears. | Screening result, list of reasons (PASS) | రెండు చెవుల్లోనూ అన్ని టోన్లు వినిపించాయి. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 179 | `reason.500.always` | 500 Hz policy: always tested. | Room noise step, after measuring | 500 Hz విధానం: ఎప్పుడూ పరీక్షిస్తాం. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 180 | `reason.500.never` | 500 Hz policy: never tested. | Room noise step, after measuring | 500 Hz విధానం: ఎప్పుడూ పరీక్షించం. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 181 | `reason.500.noMeasure` | 500 Hz skipped: no room noise measurement. | Room noise step, after measuring | 500 Hz వదిలేశాం: గదిలో శబ్దం కొలవలేదు. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 182 | `reason.500.quiet` | 500 Hz tested: room noise below the limit. | Room noise step, after measuring | 500 Hz కూడా పరీక్షిస్తాం: గదిలో శబ్దం పరిమితి కంటే తక్కువగా ఉంది. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 183 | `reason.500.noisy` | 500 Hz skipped: room too noisy for low tones. | Room noise step, after measuring | 500 Hz వదిలేశాం: తక్కువ పిచ్ టోన్లకు గదిలో శబ్దం ఎక్కువగా ఉంది. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 184 | `reason.triage.likely_treatable_cause` | Likely treatable cause reported (for example wax or infection): PHC first. Triage, not diagnosis. | Triage result after saving the checklist (route to PHC). English must match config/screening.json triage.rules | చికిత్స చేయగల కారణం ఉండే అవకాశం ఉంది (ఉదా. గులిమి లేదా ఇన్ఫెక్షన్): ముందుగా PHC కి. ప్రాథమిక పరిశీలన మాత్రమే, వ్యాధి నిర్ధారణ కాదు. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 185 | `reason.triage.default` | No likely treatable cause reported: DEIC for further hearing assessment. Triage, not diagnosis. | Triage result after saving the checklist (route to DEIC). English must match config/screening.json triage.default_reason | ప్రశ్నల్లో చికిత్స చేయగల కారణం ఏదీ కనిపించలేదు: తదుపరి వినికిడి పరీక్ష కోసం DEIC కి. ప్రాథమిక పరిశీలన మాత్రమే, వ్యాధి నిర్ధారణ కాదు. | Added 18-10-2026 (ERR-030). Written by Anish, native Telugu speaker. |
| 186 | `reminders.missed_camp.date` |  on {date} | Fills {date} in the reminder (#167) when a camp date is known ({date} = 24 Oct 2026 in English, 24-10-2026 in Telugu) | {date} న | Added 18-10-2026 (ERR-029); the form suggested in #167. Approved by Anish, native Telugu speaker, 18-10-2026. |
| 187 | `settings.devH` | Developer | Settings: heading of the section with the audio spike and calibration screens (team only) | డెవలపర్ | Added 19-10-2026 (design pass). Written by Anish, native Telugu speaker. |
| 188 | `test.wellDone` | Well done! | Child mode: the silent celebration after the last tone (same for every outcome) | చాలా బాగా చేశావు! | Added 19-10-2026 (design pass). Same wording as the approved voice line `voice.done` (#160). Approved by Anish, native Telugu speaker. |

## Voice lines to record (same text as #156–#160)

Record in a quiet room, phone about 20 cm away, calm and friendly, slow and clear, about 1 second of silence before and after. Save each file with exactly these names (`.m4a` or `.mp3` both work; Claude Code converts if needed). Record the **reviewed** text.

| File | Telugu (read this) | English meaning |
|---|---|---|
| `intro.m4a` | నమస్తే! నీ ఇయర్‌ఫోన్లలో కొన్ని బీప్ శబ్దాలు వినిపిస్తాయి. | Hello! You will hear some beeps in your earphones. |
| `tap.m4a` | బీప్ వినిపించిన ప్రతిసారీ, చాలా మెల్లగా వినిపించినా సరే, బెలూన్‌ను నొక్కు. | Every time you hear a beep, even a very quiet one, tap the balloon. |
| `lr.m4a` | బీప్ ఏ చెవిలో వినిపించిందో ఆ చెవిని చూపించు. | Point to the ear that heard the beep. |
| `quiet.m4a` | దయచేసి కొన్ని సెకన్లు చాలా నిశ్శబ్దంగా కూర్చో. | Please sit very quietly for a few seconds. |
| `done.m4a` | అయిపోయింది. చాలా బాగా చేశావు! | All done. Well done! |
