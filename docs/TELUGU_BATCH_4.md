# Telugu batch 4: original-UI screens
**Status: drafted with Claude, reviewed and approved by Anish, native Telugu speaker, 20-10-2026.** Edit any line before applying.
Covers all 89 strings still marked TODO_TE at commit c8fdab9. Kept in English on purpose: PASS / RETEST / REFER, dB, dB HL, Hz, kHz, WHO, PDF, WhatsApp, YYYY-MM-DD.
Note: "Make sure" and "Test confirmation" avoid the word నిర్ధారణ, which also means "diagnosis".

| # | ID | English | Telugu |
|---|---|---|---|
| 1 | `ds.makeSure` | Make sure.. | ఇవి సరిచూసుకోండి.. |
| 2 | `ds.quietPlace` | Quiet Place | నిశ్శబ్ద ప్రదేశం |
| 3 | `ds.headphones` | Headphones | ఇయర్‌ఫోన్లు |
| 4 | `ds.notificationsOff` | Notifications Off | నోటిఫికేషన్లు ఆఫ్ |
| 5 | `ds.equalizerNeutral` | Equalizer Neutral | ఈక్వలైజర్ సాధారణంగా (న్యూట్రల్) |
| 6 | `ds.noTalking` | No Talking | మాట్లాడకూడదు |
| 7 | `ds.noiseCancelOff` | Noise-Cancel Off | నాయిస్-క్యాన్సిల్ ఆఫ్ |
| 8 | `ds.next` | Next | తర్వాత |
| 9 | `ds.checkSurrounding` | Check Your Surrounding | మీ పరిసరాలను తనిఖీ చేయండి |
| 10 | `ds.testConfirmation` | Test Confirmation | పరీక్షకు ముందు తనిఖీ |
| 11 | `ds.checkFirst` | Please check the surrounding sound before you proceed for the test | పరీక్షకు వెళ్ళే ముందు దయచేసి చుట్టుపక్కల శబ్దాన్ని తనిఖీ చేయండి |
| 12 | `ds.stop` | Stop | ఆపండి |
| 13 | `ds.notMeasured` | Not measured yet | ఇంకా కొలవలేదు |
| 14 | `ds.measureAgain` | Measure again | మళ్ళీ కొలవండి |
| 15 | `ds.whichEar` | Which ear do you hear the sound in? | శబ్దం మీకు ఏ చెవిలో వినిపిస్తోంది? |
| 16 | `ds.play` | Play | ప్లే చేయండి |
| 17 | `ds.none` | None? | ఏ చెవిలోనూ లేదా? |
| 18 | `ds.noneHeard` | No sound in either ear? Check the earphones are plugged in and the media volume is up, then play again. | రెండు చెవుల్లోనూ శబ్దం రాలేదా? ఇయర్‌ఫోన్లు ప్లగ్ చేశారో, మీడియా వాల్యూమ్ పెంచి ఉందో చూసి, మళ్ళీ ప్లే చేయండి. |
| 19 | `ds.correctSoFar` | Correct in a row: {n} of {total} | వరుసగా సరైనవి: {total} లో {n} |
| 20 | `ds.ptaTitle` | Pure Tone Audiometry Test | ప్యూర్ టోన్ ఆడియోమెట్రీ పరీక్ష |
| 21 | `ds.startTest` | Start Test | పరీక్ష ప్రారంభించండి |
| 22 | `ds.canYouHear` | Can you hear the sound? | మీకు శబ్దం వినిపిస్తోందా? |
| 23 | `ds.progress` | Progress | పురోగతి |
| 24 | `ds.threshold` | Threshold | థ్రెషోల్డ్ (వినికిడి పరిమితి) |
| 25 | `ds.thresholdHelp` | Loudness of this tone, in dB re: team baseline. It goes up in 10 dB steps until the child hears it. | ఈ టోన్ శబ్ద స్థాయి, టీమ్ బేస్‌లైన్‌తో పోలిస్తే dB లో. విద్యార్థికి వినిపించే వరకు ఇది 10 dB చొప్పున పెరుగుతుంది. |
| 26 | `ds.replay` | Replay | మళ్ళీ వినిపించండి |
| 27 | `ds.earphonesNeeded` | Plug in the wired earphones. Tones play through earphones only. | వైర్డ్ ఇయర్‌ఫోన్లను ప్లగ్ చేయండి. టోన్లు ఇయర్‌ఫోన్ల ద్వారా మాత్రమే వినిపిస్తాయి. |
| 28 | `ds.needsCalibration` | The detailed test needs a calibrated phone (config calibration). This phone has no calibration, so the detailed test is off. | వివరమైన పరీక్షకు క్యాలిబ్రేట్ చేసిన ఫోన్ అవసరం (config calibration). ఈ ఫోన్‌కు క్యాలిబ్రేషన్ లేదు, కాబట్టి వివరమైన పరీక్ష ఆఫ్‌లో ఉంది. |
| 29 | `ds.detailedTest` | Detailed hearing test | వివరమైన వినికిడి పరీక్ష |
| 30 | `ds.detailedOffer` | Detailed hearing test (optional) | వివరమైన వినికిడి పరీక్ష (ఐచ్ఛికం) |
| 31 | `ds.yourResults` | Your Results | మీ ఫలితాలు |
| 32 | `ds.share` | Share | షేర్ చేయండి |
| 33 | `ds.exportPdf` | Export to PDF | PDF గా ఎగుమతి చేయండి |
| 34 | `ds.shareWhatsApp` | Share on WhatsApp | WhatsApp లో షేర్ చేయండి |
| 35 | `ds.shareDoctor` | Share with doctor | డాక్టర్‌తో షేర్ చేయండి |
| 36 | `ds.cancel` | Cancel | రద్దు చేయండి |
| 37 | `ds.estimateLine` | Estimated from a phone test with provisional calibration. | తాత్కాలిక క్యాలిబ్రేషన్‌తో చేసిన ఫోన్ పరీక్ష ఆధారంగా అంచనా. |
| 38 | `ds.estimatedGrade` | Estimated: {grade} | అంచనా: {grade} |
| 39 | `ds.estimated` | estimated | అంచనా |
| 40 | `ds.rangeLine` | Average hearing level in the {range} dB range (dB re: team baseline). | సగటు వినికిడి స్థాయి {range} dB పరిధిలో ఉంది (టీమ్ బేస్‌లైన్‌తో పోలిస్తే dB). |
| 41 | `ds.info.Normal` | You can hear a whisper, rustling leaves, and ticking clocks. | మీకు గుసగుసలు, ఆకుల సవ్వడి, గడియారం టిక్‌టిక్ వినిపిస్తాయి. |
| 42 | `ds.info.Mild` | You can hear a conversation in a quiet room, but may have difficulty hearing a whisper or soft sounds. | నిశ్శబ్ద గదిలో మాటలు వినిపిస్తాయి, కానీ గుసగుసలు లేదా మెల్లని శబ్దాలు వినడం కష్టంగా ఉండవచ్చు. |
| 43 | `ds.info.Moderate` | You may have difficulty hearing some quieter conversations. | కొన్ని మెల్లని సంభాషణలు వినడం కష్టంగా ఉండవచ్చు. |
| 44 | `ds.info.Moderately severe` | You may have difficulty hearing a normal conversation. You may lip-read or use hearing aids to help with communication. | సాధారణ సంభాషణ వినడం కష్టంగా ఉండవచ్చు. పెదవుల కదలికలు చూడటం లేదా వినికిడి యంత్రాలు మాట్లాడుకోవడానికి సహాయపడవచ్చు. |
| 45 | `ds.info.Severe` | You can understand speech only if the speaker is close by. | మాట్లాడేవారు దగ్గరగా ఉంటేనే మాటలు అర్థమవుతాయి. |
| 46 | `ds.info.Profound` | You may have problems understanding speech, and may not hear loud sounds such as lawn mowers or passing cars. | మాటలు అర్థం చేసుకోవడంలో ఇబ్బంది ఉండవచ్చు; లాన్ మూవర్లు లేదా వెళ్ళే వాహనాల వంటి పెద్ద శబ్దాలు కూడా వినిపించకపోవచ్చు. |
| 47 | `ds.grade.Normal` | Normal | సాధారణం |
| 48 | `ds.grade.Mild` | Mild | స్వల్పం |
| 49 | `ds.grade.Moderate` | Moderate | మధ్యస్థం |
| 50 | `ds.grade.Moderately severe` | Moderately severe | మధ్యస్థ-తీవ్రం |
| 51 | `ds.grade.Severe` | Severe | తీవ్రం |
| 52 | `ds.grade.Profound` | Profound | అతి తీవ్రం |
| 53 | `ds.categories` | Categories | వర్గాలు |
| 54 | `ds.rangeHeader` | Range (WHO, dB HL) | పరిధి (WHO, dB HL) |
| 55 | `ds.whoCite` | Grades: WHO World report on hearing (2021), average of 500, 1000, 2000 and 4000 Hz, in dB HL. Our values are dB re: team baseline, so the grade is an estimate. | గ్రేడ్‌లు: WHO వరల్డ్ రిపోర్ట్ ఆన్ హియరింగ్ (2021), 500, 1000, 2000, 4000 Hz సగటు, dB HL లో. మా విలువలు టీమ్ బేస్‌లైన్‌తో పోలిస్తే dB లో ఉన్నాయి, కాబట్టి గ్రేడ్ ఒక అంచనా మాత్రమే. |
| 56 | `ds.average` | Average | సగటు |
| 57 | `ds.audiogramH` | Your Audiogram | మీ ఆడియోగ్రామ్ |
| 58 | `ds.audiogramP` | An audiogram shows how loud sounds need to be at different frequencies for you to hear them. | వేర్వేరు ఫ్రీక్వెన్సీల వద్ద శబ్దాలు మీకు వినిపించడానికి ఎంత పెద్దగా ఉండాలో ఆడియోగ్రామ్ చూపిస్తుంది. |
| 59 | `ds.noResponseNote` | ▼ = not heard up to the loudest level the phone can play; the average counts it at that level (≥). | ▼ = ఫోన్ ప్లే చేయగల అత్యధిక స్థాయి వరకు వినిపించలేదు; సగటులో దాన్ని ఆ స్థాయిగా (≥) లెక్కిస్తారు. |
| 60 | `ds.floorNote` | Values near 0 dB at 1-4 kHz may be limited by the phone's playback floor, so the true level may be lower. | 1-4 kHz వద్ద 0 dB దగ్గరి విలువలు ఫోన్ అతి తక్కువ ప్లేబ్యాక్ స్థాయి వల్ల పరిమితమై ఉండవచ్చు; అసలు స్థాయి ఇంకా తక్కువగా ఉండవచ్చు. |
| 61 | `ds.pdfNotDiagnosis` | Screening and referral tool, not a diagnosis. Refer for a full hearing assessment by a qualified professional. | ఇది స్క్రీనింగ్ మరియు రిఫరల్ సాధనం, వ్యాధి నిర్ధారణ కాదు. అర్హత ఉన్న నిపుణుల వద్ద పూర్తి వినికిడి పరీక్ష కోసం రిఫర్ చేయండి. |
| 62 | `ds.teacherProfile` | Teacher Profile Page | ఉపాధ్యాయుల ప్రొఫైల్ పేజీ |
| 63 | `ds.createClassroom` | Create Classroom | తరగతిని సృష్టించండి |
| 64 | `ds.classroomName` | Classroom Name | తరగతి పేరు |
| 65 | `ds.classroomStrength` | Classroom Strength | తరగతిలో విద్యార్థుల సంఖ్య |
| 66 | `ds.classroomStrengthLabel` | Classroom Strength:  | తరగతిలో విద్యార్థుల సంఖ్య:  |
| 67 | `ds.classroomCreated` | Classroom created successfully | తరగతి విజయవంతంగా సృష్టించబడింది |
| 68 | `ds.classStrength` | Class Strength: {n} | విద్యార్థుల సంఖ్య: {n} |
| 69 | `ds.assignments` | Assignments | అసైన్‌మెంట్లు |
| 70 | `ds.createAssignment` | Create New Assignment | కొత్త అసైన్‌మెంట్ సృష్టించండి |
| 71 | `ds.assignmentName` | Assignment Name | అసైన్‌మెంట్ పేరు |
| 72 | `ds.deadlinePlaceholder` | Deadline (YYYY-MM-DD, default {date}) | గడువు (YYYY-MM-DD, డిఫాల్ట్ {date}) |
| 73 | `ds.deadlineFormat` | Deadline must be a date like 2026-10-31. | గడువు 2026-10-31 లాంటి తేదీగా ఉండాలి. |
| 74 | `ds.classChildren` | Children in this classroom ({n}) | ఈ తరగతిలోని విద్యార్థులు ({n}) |
| 75 | `ds.noChildrenInClass` | No children in this classroom yet. | ఈ తరగతిలో ఇంకా విద్యార్థులు లేరు. |
| 76 | `ds.screen` | Screen | స్క్రీనింగ్ |
| 77 | `ds.removeFromClass` | Remove | తొలగించండి |
| 78 | `ds.addChildrenToClass` | Add children to this classroom | ఈ తరగతికి విద్యార్థులను జోడించండి |
| 79 | `ds.hideAddChildren` | Hide the list | జాబితాను దాచండి |
| 80 | `ds.analytics` | Assignments Analytics | అసైన్‌మెంట్ల విశ్లేషణ |
| 81 | `ds.screeningWas` | Screening: {outcome} | స్క్రీనింగ్: {outcome} |
| 82 | `ds.legendNote` | * Estimated grade from the detailed test (WHO 2021 grades, dB re: team baseline). PASS / RETEST / REFER: screening result, for children with no detailed test. Tap a slice or a colour to filter. | * వివరమైన పరీక్ష నుండి అంచనా గ్రేడ్ (WHO 2021 గ్రేడ్‌లు, టీమ్ బేస్‌లైన్‌తో పోలిస్తే dB). PASS / RETEST / REFER: వివరమైన పరీక్ష జరగని విద్యార్థులకు స్క్రీనింగ్ ఫలితం. ఫిల్టర్ చేయడానికి ఒక భాగాన్ని లేదా రంగును నొక్కండి. |
| 83 | `tab.home` | Home | హోమ్ |
| 84 | `tab.children` | Children | విద్యార్థులు |
| 85 | `tab.cases` | Cases | కేసులు |
| 86 | `tab.teacher` | Teacher | ఉపాధ్యాయులు |
| 87 | `tab.settings` | Settings | సెట్టింగ్స్ |
| 88 | `ds.bannerChildren` | Add each child once, then tap a name to start a screening. | ప్రతి విద్యార్థిని ఒకసారి జోడించండి, తర్వాత స్క్రీనింగ్ ప్రారంభించడానికి పేరును నొక్కండి. |
| 89 | `ds.bannerCases` | Referral cases: {n}. Tap a case to update its status. | రిఫరల్ కేసులు: {n}. స్థితిని మార్చడానికి కేసును నొక్కండి. |
