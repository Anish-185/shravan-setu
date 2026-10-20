# Telugu batch 3: reviewed strings for Shravan Setu
**Status: drafted with Claude, reviewed and approved by Anish, native Telugu speaker, [date].** Edit any line before applying.
Covers every string still marked TODO_TE at commit 878bc57 (57 strings: calibration titles, audit log, quiet-spot finder, teacher view).
One English change: `teacher.meaning.REFER` is reworded to match the app's rule (REFER only after a missed tone is confirmed on rescreen).

| # | ID | English | Telugu |
|---|---|---|---|
| 1 | `title.calibrate` | Calibration (team only) | క్యాలిబ్రేషన్ (టీమ్ కోసం మాత్రమే) |
| 2 | `home.calibrate` | Calibration (team only) | క్యాలిబ్రేషన్ (టీమ్ కోసం మాత్రమే) |
| 3 | `settings.auditH` | Audit log | ఆడిట్ లాగ్ (మార్పుల రికార్డు) |
| 4 | `settings.auditP` | Consent, results, referrals and status changes are chained together, so a later change to any of them shows up here. | సమ్మతి, ఫలితాలు, రిఫరల్స్, స్థితి మార్పులు అన్నీ ఒకదానికొకటి అనుసంధానించబడి ఉంటాయి; కాబట్టి తర్వాత వీటిలో దేనినైనా మార్చితే అది ఇక్కడ బయటపడుతుంది. |
| 5 | `settings.auditVerify` | Verify audit log | ఆడిట్ లాగ్‌ను తనిఖీ చేయండి |
| 6 | `settings.auditOk` | Audit log OK: {n} entries. Last code {head}. | ఆడిట్ లాగ్ సరిగ్గా ఉంది: {n} ఎంట్రీలు. చివరి కోడ్ {head}. |
| 7 | `settings.auditBroken` | Audit log check failed at entry {at}. Tell the team lead. | ఆడిట్ లాగ్ తనిఖీ {at}వ ఎంట్రీ వద్ద విఫలమైంది. టీమ్ లీడ్‌కు తెలియజేయండి. |
| 8 | `title.rooms` | Find a quiet room | నిశ్శబ్దమైన గదిని కనుగొనండి |
| 9 | `rooms.p` | Earphones plugged in, phone where the child will sit, everyone quiet for a few seconds. Measure each room at the hours you might screen; the quietest room and hour come first. Levels are relative to the reference quiet room, not decibels. | ఇయర్‌ఫోన్లు ప్లగ్ చేసి, విద్యార్థి కూర్చునే చోట ఫోన్ ఉంచి, కొన్ని సెకన్లు అందరూ నిశ్శబ్దంగా ఉండండి. స్క్రీనింగ్ చేయగల ప్రతి సమయంలో ప్రతి గదిని కొలవండి; అత్యంత నిశ్శబ్దమైన గది, సమయం ముందుగా కనిపిస్తాయి. ఈ విలువలు నిశ్శబ్ద రిఫరెన్స్ గదితో పోలిస్తే సాపేక్షమైనవి, డెసిబెల్స్ కావు. |
| 10 | `rooms.name` | Room (for example Library) | గది (ఉదా. లైబ్రరీ) |
| 11 | `rooms.measure` | Measure this room now | ఈ గదిని ఇప్పుడు కొలవండి |
| 12 | `rooms.best` | Quietest so far: {room}, {slot} | ఇప్పటివరకు అత్యంత నిశ్శబ్దం: {room}, {slot} |
| 13 | `rooms.row` | {room}, {slot}: {value} ({n} readings) | {room}, {slot}: {value} ({n} కొలతలు) |
| 14 | `rooms.noisy` | too noisy for screening | స్క్రీనింగ్‌కు శబ్దం చాలా ఎక్కువ |
| 15 | `rooms.none` | No readings yet. | ఇంకా కొలతలు లేవు. |
| 16 | `children.classPlaceholder` | Class label (optional), e.g. 5A | తరగతి (ఐచ్ఛికం), ఉదా. 5A |
| 17 | `home.teacher` | Teacher view | ఉపాధ్యాయుల విభాగం |
| 18 | `title.teacherLogin` | Demo login | డెమో లాగిన్ |
| 19 | `title.teacher` | Teacher view | ఉపాధ్యాయుల విభాగం |
| 20 | `title.class` | Classroom | తరగతి |
| 21 | `title.round` | Screening round | స్క్రీనింగ్ రౌండ్ |
| 22 | `title.childResult` | Screening result | స్క్రీనింగ్ ఫలితం |
| 23 | `teacher.demoNote` | Demo login: the name and PIN stay on this phone. No account. The first login sets the PIN. | డెమో లాగిన్: పేరు, PIN ఈ ఫోన్‌లోనే ఉంటాయి. ఖాతా అవసరం లేదు. మొదటిసారి లాగిన్ అయినప్పుడు PIN సెట్ అవుతుంది. |
| 24 | `teacher.name` | Teacher name | ఉపాధ్యాయుల పేరు |
| 25 | `teacher.pin` | PIN | PIN |
| 26 | `teacher.login` | Log in | లాగిన్ అవ్వండి |
| 27 | `teacher.wrongPin` | Wrong PIN for this phone. | ఈ ఫోన్‌కు ఇది తప్పు PIN. |
| 28 | `teacher.welcome` | Welcome | స్వాగతం |
| 29 | `teacher.date` | Date: {date} | తేదీ: {date} |
| 30 | `teacher.addChildren` | Add children | విద్యార్థులను జోడించండి |
| 31 | `teacher.classrooms` | Classrooms | తరగతులు |
| 32 | `teacher.search` | Search | వెతకండి |
| 33 | `teacher.strength` | Class strength: {n} | విద్యార్థుల సంఖ్య: {n} |
| 34 | `teacher.noClass` | No class label | తరగతి పేర్కొనలేదు |
| 35 | `teacher.noClassrooms` | No classrooms yet. Add children with a class label. | ఇంకా తరగతులు లేవు. తరగతి పేరుతో సహా విద్యార్థులను జోడించండి. |
| 36 | `teacher.roundsH` | Screening rounds | స్క్రీనింగ్ రౌండ్లు |
| 37 | `teacher.deadline` | Deadline: {date} | గడువు: {date} |
| 38 | `teacher.progress` | Progress: {done}/{total} screened | పురోగతి: {total} మందిలో {done} మందికి స్క్రీనింగ్ పూర్తయింది |
| 39 | `teacher.noRounds` | No screening rounds yet. | ఇంకా స్క్రీనింగ్ రౌండ్లు లేవు. |
| 40 | `teacher.newRoundH` | Create new screening round | కొత్త స్క్రీనింగ్ రౌండ్ సృష్టించండి |
| 41 | `teacher.roundName` | Round name, e.g. "Term 1" | రౌండ్ పేరు, ఉదా. "మొదటి టర్మ్" |
| 42 | `teacher.createRound` | Create round | రౌండ్ సృష్టించండి |
| 43 | `teacher.noResults` | No child in this class has been screened in this round yet. | ఈ రౌండ్‌లో ఈ తరగతిలో ఇంకా ఏ విద్యార్థికీ స్క్రీనింగ్ జరగలేదు. |
| 44 | `teacher.pieHint` | Tap a slice to show only that outcome. Tap it again to show all. | ఒక ఫలితాన్ని మాత్రమే చూడటానికి ఆ భాగాన్ని నొక్కండి. అందరినీ చూడటానికి మళ్ళీ నొక్కండి. |
| 45 | `teacher.age` | Age: {age} | వయస్సు: {age} |
| 46 | `teacher.moreDetails` | More details | మరిన్ని వివరాలు |
| 47 | `teacher.outcomesH` | What the outcomes mean | ఫలితాల అర్థం |
| 48 | `teacher.meaning.PASS` | PASS: every tone tested was heard. | PASS: పరీక్షించిన ప్రతి టోన్ వినిపించింది. |
| 49 | `teacher.meaning.RETEST` | RETEST: not clear yet (noise, a tone not tested or unreliable taps). Test again. | RETEST: ఇంకా స్పష్టంగా లేదు (శబ్దం, పరీక్షించని టోన్ లేదా నమ్మదగని స్పందనలు). మళ్ళీ పరీక్షించండి. |
| 50 | `teacher.meaning.REFER` | REFER: a tone was not heard, even when tested again. Refer for a full hearing check. | REFER: మళ్ళీ పరీక్షించినా ఒక టోన్ వినిపించలేదు. పూర్తి వినికిడి పరీక్ష కోసం రిఫర్ చేయండి. |
| 51 | `teacher.leftEar` | Left ear | ఎడమ చెవి |
| 52 | `teacher.rightEar` | Right ear | కుడి చెవి |
| 53 | `teacher.tonesH` | Each tone | ప్రతి టోన్ |
| 54 | `teacher.tonesP` | Tones are played at one fixed screening level. These are not hearing thresholds. | టోన్లు ఒకే నిర్ణీత స్క్రీనింగ్ స్థాయిలో ప్లే అవుతాయి. ఇవి వినికిడి పరిమితులు (థ్రెషోల్డ్స్) కావు. |
| 55 | `teacher.heard` | Heard | వినిపించింది |
| 56 | `teacher.notHeard` | Not heard | వినిపించలేదు |
| 57 | `teacher.notTested` | Not tested | పరీక్షించలేదు |
