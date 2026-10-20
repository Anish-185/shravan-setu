# Telugu batch 5: login, home, assignments, history, results, analytics
**Status: drafted with Claude, reviewed and approved by Anish, native Telugu speaker, 20-10-2026.** Edit any line before applying.
Covers all 56 strings still marked TODO_TE at commit dd9c168. `home.welcome` keeps no space after the comma, as in the English ({name} starts with a line break).

| # | ID | English | Telugu |
|---|---|---|---|
| 1 | `title.history` | Child's tests | విద్యార్థి పరీక్షలు |
| 2 | `login.tagline` | School hearing screening and referral | పాఠశాల వినికిడి స్క్రీనింగ్ మరియు రిఫరల్ |
| 3 | `login.firstTime` | First time on this phone: type your name and choose a PIN of 4 to 8 digits. Demo login: it stays on this phone. | ఈ ఫోన్‌లో మొదటిసారి: మీ పేరు టైప్ చేసి, 4 నుండి 8 అంకెల PIN ఎంచుకోండి. డెమో లాగిన్: ఇది ఈ ఫోన్‌లోనే ఉంటుంది. |
| 4 | `home.welcome` | Welcome,{name} | స్వాగతం,{name} |
| 5 | `home.screenSub` | Pick a child, then start the test | ఒక విద్యార్థిని ఎంచుకుని, తర్వాత పరీక్ష ప్రారంభించండి |
| 6 | `home.openCases` | Open cases | తెరిచి ఉన్న కేసులు |
| 7 | `home.newClass` | New classroom | కొత్త తరగతి |
| 8 | `home.classLine` | Strength {strength} · {kids} on this phone | విద్యార్థుల సంఖ్య {strength} · ఈ ఫోన్‌లో {kids} |
| 9 | `home.lastRound` | {name}: {done} of {total} tested | {name}: {total} లో {done} మందికి పరీక్ష పూర్తయింది |
| 10 | `assign.sub` | Screening rounds for each class, with a deadline | ప్రతి తరగతికి గడువుతో కూడిన స్క్రీనింగ్ రౌండ్లు |
| 11 | `assign.listH` | Assignments ({n}) | అసైన్‌మెంట్లు ({n}) |
| 12 | `assign.filter.open` | Open | కొనసాగుతున్నవి |
| 13 | `assign.filter.past` | Past deadline | గడువు దాటినవి |
| 14 | `assign.filter.all` | All | అన్నీ |
| 15 | `assign.pastDeadline` | Deadline passed: {date} | గడువు దాటింది: {date} |
| 16 | `assign.needClass` | Create a classroom first (Home → New classroom). | ముందుగా ఒక తరగతిని సృష్టించండి (హోమ్ → కొత్త తరగతి). |
| 17 | `assign.weeks` | {n} weeks | {n} వారాలు |
| 18 | `assign.deadline` | Deadline | గడువు |
| 19 | `class.addHint` | Tap a child to put them in this classroom. | ఈ తరగతిలో చేర్చడానికి విద్యార్థిని నొక్కండి. |
| 20 | `class.notTested` | not tested yet | ఇంకా పరీక్షించలేదు |
| 21 | `create.preview` | Preview of the classroom card | తరగతి కార్డు ముందుచూపు |
| 22 | `create.namePlaceholder` | e.g. 5A | ఉదా. 5A |
| 23 | `children.sub` | {n} children on this phone | ఈ ఫోన్‌లో {n} మంది విద్యార్థులు |
| 24 | `children.empty` | No children yet. Add the first child above. | ఇంకా విద్యార్థులు లేరు. పైన మొదటి విద్యార్థిని జోడించండి. |
| 25 | `history.class` | Class {label} | తరగతి {label} |
| 26 | `history.screenAgain` | Screen again | మళ్ళీ స్క్రీనింగ్ చేయండి |
| 27 | `history.openCase` | Open the referral case | రిఫరల్ కేసును తెరవండి |
| 28 | `history.testsH` | Tests ({n}) | పరీక్షలు ({n}) |
| 29 | `history.empty` | No tests yet. Tap Screen to start this child's first test. | ఇంకా పరీక్షలు లేవు. ఈ విద్యార్థి మొదటి పరీక్ష ప్రారంభించడానికి స్క్రీనింగ్ నొక్కండి. |
| 30 | `history.screening` | Screening | స్క్రీనింగ్ |
| 31 | `history.inRound` | In assignment: {name} | అసైన్‌మెంట్‌లో: {name} |
| 32 | `history.individual` | Individual test | వ్యక్తిగత పరీక్ష |
| 33 | `history.view` | View result | ఫలితం చూడండి |
| 34 | `result.childTests` | All tests of this child | ఈ విద్యార్థి అన్ని పరీక్షలు |
| 35 | `results.earsH` | Left and right ear | ఎడమ, కుడి చెవి |
| 36 | `results.bandsH` | Audiogram with grade bands | గ్రేడ్ బ్యాండ్లతో ఆడియోగ్రామ్ |
| 37 | `results.shareNote` | All three make the same PDF and open your phone's share menu. | మూడూ ఒకే PDF ని తయారు చేసి, మీ ఫోన్ షేర్ మెనూను తెరుస్తాయి. |
| 38 | `results.shareFailed` | Could not make the PDF: {error} | PDF తయారు చేయలేకపోయాం: {error} |
| 39 | `analytics.tested` | tested | పరీక్షించినవారు |
| 40 | `analytics.outerRing` | Outer ring: screening result | బయటి వలయం: స్క్రీనింగ్ ఫలితం |
| 41 | `analytics.innerRing` | Inner ring: estimated grade from the detailed test (WHO 2021 grades, dB re: team baseline) | లోపలి వలయం: వివరమైన పరీక్ష నుండి అంచనా గ్రేడ్ (WHO 2021 గ్రేడ్‌లు, టీమ్ బేస్‌లైన్‌తో పోలిస్తే dB) |
| 42 | `analytics.tapHint` | Tap a slice or a colour to see only those children. | ఆ విద్యార్థులను మాత్రమే చూడటానికి ఒక భాగాన్ని లేదా రంగును నొక్కండి. |
| 43 | `analytics.filtered` | Showing: {name}. Tap it again to show everyone. | చూపిస్తున్నది: {name}. అందరినీ చూడటానికి దాన్ని మళ్ళీ నొక్కండి. |
| 44 | `analytics.childrenH` | Children ({n}) | విద్యార్థులు ({n}) |
| 45 | `analytics.clear` | Show all | అందరినీ చూపించు |
| 46 | `analytics.untestedH` | Not tested yet ({n}) | ఇంకా పరీక్షించనివారు ({n}) |
| 47 | `chart.noResponse` | not heard up to {max} dB | {max} dB వరకు వినిపించలేదు |
| 48 | `chart.notHeard` | not heard (at the loudest level played) | వినిపించలేదు (ప్లే చేసిన అత్యధిక స్థాయిలో) |
| 49 | `chart.tapColumn` | Tap a frequency to read its values. | విలువలు చూడటానికి ఒక ఫ్రీక్వెన్సీని నొక్కండి. |
| 50 | `chart.earBarsLabel` | Left and right ear, softest tone heard at each frequency | ఎడమ, కుడి చెవి: ప్రతి ఫ్రీక్వెన్సీ వద్ద వినిపించిన అతి మెల్లని టోన్ |
| 51 | `chart.earBarsNote` | Longer bar = a louder tone was needed (dB re: team baseline). | పొడవైన బార్ = మరింత పెద్ద టోన్ అవసరమైంది (టీమ్ బేస్‌లైన్‌తో పోలిస్తే dB). |
| 52 | `settings.sub` | Teacher, school, earphones and data | ఉపాధ్యాయులు, పాఠశాల, ఇయర్‌ఫోన్లు, డేటా |
| 53 | `settings.teacherH` | Teacher | ఉపాధ్యాయులు |
| 54 | `settings.teacherLine` | Logged in as {name} · School: {school} | లాగిన్ అయినవారు: {name} · పాఠశాల: {school} |
| 55 | `settings.logout` | Log out | లాగ్ అవుట్ |
| 56 | `assign.week` | 1 week | 1 వారం |
