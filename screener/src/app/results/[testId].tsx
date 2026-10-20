// "Your Results" for a detailed test. Ideas from DhwaniSarathi audiometer/app/Screens/Results.js (Apache-2.0, the
// DhwaniSarathi team): the overall category with its description, the category table, left / right ear cards with dB
// and grade, the audiogram with both ears, the coloured-band audiogram, and a share menu (PDF, WhatsApp, doctor).
// Ours:
// - data: the stored detailed test (dB re: team baseline, our calibration); grades from config hearing_grades (WHO 2021),
//   always labelled estimates; one line says the values come from a phone test with provisional calibration;
// - design: our bands, cards and colours; a left-vs-right bar comparison per frequency; charts drawn with
//   react-native-svg (src/charts.tsx), frequency on top, a tone never heard shown as ▽ at the loudest level played;
//   tap a column to read it; the band audiogram uses the WHO boundaries (their picture's bands disagreed with the table);
// - share: all three options make the same PDF (expo-print) and open the phone's share sheet (expo-sharing); their
//   "Share with Doctor" did nothing. The PDF says screening only, not a diagnosis.
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Audiogram, EarBars } from '@/charts';
import { cfg } from '@/config';
import { db } from '@/db';
import { get } from '@/db/store';
import { useT, type Key } from '@/i18n';
import { Icon, type IconName } from '@/icons';
import { EarBadge } from '@/illustrations';
import { calculateAverage, determineHearingCategory, grades, type Point } from '@/original/hearing';
import { v } from '@/rules';
import { C, Card, EAR, F, GRADE, GRADE_ON, Note, s, SectionH } from '@/ui';

export type DetailedTest = { child: string; finished_at: string; points: Point[]; calibration_provisional: boolean };

const FREQS: number[] = v(cfg, 'detailed_test', 'frequencies_hz');
const gradeKey = (g: string) => `ds.grade.${g}` as Key;
const infoKey = (g: string) => `ds.info.${g}` as Key;

export default function Results() {
  const t = useT();
  const { width } = useWindowDimensions();
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const test = get<DetailedTest>(db, 'detailed_test', testId);
  const child = test && get<{ display_name: string }>(db, 'child', test.child);
  const [sheet, setSheet] = useState(false);
  const [error, setError] = useState('');
  if (!test) return <ScrollView contentContainerStyle={s.screen}><Text style={s.p}>{t('screen.notFound')}</Text></ScrollView>;

  const avg = { left: calculateAverage(test.points, 'left'), right: calculateAverage(test.points, 'right') };
  const info = (a: { db: number } | null) => a && determineHearingCategory(a.db, cfg);
  const overall = avg.left && avg.right && determineHearingCategory((avg.left.db + avg.right.db) / 2, cfg);
  const dB = (a: { db: number; atLeast: boolean } | null) => (a ? `${a.atLeast ? '≥ ' : ''}${a.db} dB` : '-');
  // ERR-044: at 1-4 kHz the baseline is an upper bound set by the playback floor, so 0 there may read too low.
  const floorLimited = test.points.some((p) => p.frequency >= 1000 && p.threshold === 0);
  const bands = grades(cfg).map((g, i, all) => ({ grade: g.grade, lo: g.min_db, hi: all[i + 1]?.min_db ?? 120, color: GRADE[g.grade] }));
  const chartWidth = Math.min(width - 72, 440);

  const share = async (dialogTitle: string) => {
    setSheet(false);
    setError('');
    try {
      const { uri } = await Print.printToFileAsync({ html: reportHtml(test, child?.display_name ?? '-', t) });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle });
    } catch (e) {
      setError(t('results.shareFailed', { error: String(e) }));
    }
  };

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <View style={[st.hero, { backgroundColor: overall ? GRADE[overall.category] : C.white }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[st.who, { color: overall ? GRADE_ON(overall.category) : C.night }]}>
            {`${child?.display_name ?? '-'} · ${test.finished_at.slice(0, 10)}`}
          </Text>
          {overall && <Text style={[st.grade, { color: GRADE_ON(overall.category) }]}>
            {t('ds.estimatedGrade', { grade: t(gradeKey(overall.category)) })}
          </Text>}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('ds.share')} onPress={() => setSheet(true)} style={st.shareBtn}>
          <Icon name="share-2" size={22} color={C.night} />
        </Pressable>
      </View>
      {overall && (
        <Card>
          <Text style={s.p}>{`${t('ds.rangeLine', { range: overall.formattedRange })} ${t(infoKey(overall.category))}`}</Text>
          {test.calibration_provisional && <Note icon="info" color={C.amber} text={t('ds.estimateLine')} />}
        </Card>
      )}
      {!!error && <Text style={s.warn}>{error}</Text>}

      <SectionH title={t('results.earsH')} />
      <View style={st.ears}>
        {(['left', 'right'] as const).map((ear) => {
          const g = info(avg[ear]);
          return (
            <View key={ear} style={[st.ear, { borderTopColor: EAR[ear] }]}>
              <EarBadge ear={ear} size={48} />
              <Text style={[st.earName, { color: EAR[ear] }]}>{t(ear === 'left' ? 'teacher.leftEar' : 'teacher.rightEar')}</Text>
              <Text style={st.earDb}>{dB(avg[ear])}</Text>
              {g && (
                <View style={[st.gradePill, { backgroundColor: GRADE[g.category] }]}>
                  <Text style={[st.gradePillText, { color: GRADE_ON(g.category) }]}>{t(gradeKey(g.category))}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
      <Card><EarBars points={test.points} freqs={FREQS} /></Card>

      <SectionH title={t('ds.audiogramH')} />
      <Card>
        <Text style={s.muted}>{t('ds.audiogramP')}</Text>
        <Audiogram points={test.points} freqs={FREQS} width={chartWidth} />
        <Text style={st.cite}>{t('ds.noResponseNote')}</Text>
        {floorLimited && <Text style={st.cite}>{t('ds.floorNote')}</Text>}
      </Card>

      <SectionH title={t('results.bandsH')} />
      <Card>
        <Audiogram points={test.points} freqs={FREQS} width={chartWidth} bands={bands} />
      </Card>

      <SectionH title={t('ds.categories')} />
      <Card style={{ gap: 0, paddingVertical: 8 }}>
        {grades(cfg).map((g) => (
          <View key={g.grade} style={[st.row, overall?.category === g.grade && st.rowOn]}>
            <View style={[st.swatch, { backgroundColor: GRADE[g.grade] }]} />
            <Text style={st.cellName}>{t(gradeKey(g.grade))}</Text>
            <Text style={st.cellRange}>{g.max_db === null ? `${g.min_db}+` : `${g.min_db} to ${g.max_db}`}</Text>
          </View>
        ))}
        <Text style={[st.cite, { marginTop: 8 }]}>{`${t('ds.rangeHeader')}. ${t('ds.whoCite')}`}</Text>
      </Card>

      <Modal animationType="slide" transparent visible={sheet} onRequestClose={() => setSheet(false)}>
        <Pressable style={st.scrim} onPress={() => setSheet(false)} accessibilityLabel={t('ds.cancel')} />
        <View style={st.sheet}>
          <View style={st.grab} />
          <Text style={s.h}>{t('ds.share')}</Text>
          <ShareRow icon="file-down" text={t('ds.exportPdf')} onPress={() => share(t('ds.exportPdf'))} />
          <ShareRow icon="message-circle" text={t('ds.shareWhatsApp')} onPress={() => share(t('ds.shareWhatsApp'))} />
          <ShareRow icon="stethoscope" text={t('ds.shareDoctor')} onPress={() => share(t('ds.shareDoctor'))} />
          <Text style={st.cite}>{t('results.shareNote')}</Text>
          <Pressable accessibilityRole="button" onPress={() => setSheet(false)} style={st.cancel}>
            <Text style={st.cancelText}>{t('ds.cancel')}</Text>
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ShareRow({ icon, text, onPress }: { icon: IconName; text: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [st.shareRow, pressed && { opacity: 0.7 }]}>
      <View style={st.shareIcon}><Icon name={icon} size={22} color={C.indigo} /></View>
      <Text style={[s.p, { flex: 1 }]}>{text}</Text>
      <Icon name="chevron-right" size={18} color={C.dusk} />
    </Pressable>
  );
}

/** The PDF behind all three share options: the same numbers as the screen, plus the screening-only statement. */
function reportHtml(test: DetailedTest, name: string, t: ReturnType<typeof useT>) {
  const esc = (x: string) => x.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const cell = (ear: 'left' | 'right', f: number) => {
    const p = test.points.find((q) => q.ear === ear && q.frequency === f);
    return !p ? '-' : p.threshold === null ? `&gt; ${p.max}` : String(p.threshold);
  };
  const row = (ear: 'left' | 'right') => {
    const a = calculateAverage(test.points, ear);
    const g = a && determineHearingCategory(a.db, cfg).category;
    return `<tr><th>${esc(t(ear === 'left' ? 'teacher.leftEar' : 'teacher.rightEar'))}</th>${FREQS.map((f) => `<td>${cell(ear, f)}</td>`).join('')}`
      + `<td>${a ? `${a.atLeast ? '&ge; ' : ''}${a.db}` : '-'}</td><td>${g ? esc(t(gradeKey(g))) : '-'}</td></tr>`;
  };
  return `<html><head><meta charset="utf-8"><style>body{font-family:sans-serif;color:${C.night};padding:24px}
h1{background:${C.night};color:#fff;padding:10px 14px;border-bottom:4px solid ${C.marigold}}table{border-collapse:collapse;width:100%;margin:12px 0}
td,th{border:1px solid ${C.lilac};padding:6px;text-align:center}.note{font-size:12px;color:${C.dusk}}</style></head><body>
<h1>${esc(t('ds.yourResults'))}</h1><p><b>${esc(name)}</b> &middot; ${esc(test.finished_at.slice(0, 10))}</p>
<p class="note">${esc(t('ds.estimateLine'))}</p>
<table><tr><th>dB</th>${FREQS.map((f) => `<th>${f} Hz</th>`).join('')}<th>${esc(t('ds.average'))}</th><th>${esc(t('ds.categories'))}</th></tr>
${row('left')}${row('right')}</table>
<table><tr><th>${esc(t('ds.categories'))}</th><th>${esc(t('ds.rangeHeader'))}</th></tr>
${grades(cfg).map((g) => `<tr><td>${esc(t(gradeKey(g.grade)))}</td><td>${g.max_db === null ? `${g.min_db}+` : `${g.min_db} to ${g.max_db}`}</td></tr>`).join('')}</table>
<p class="note">${esc(t('ds.whoCite'))}</p><p class="note">${esc(t('ds.noResponseNote'))}</p>
<p class="note">${esc(t('ds.floorNote'))}</p><p class="note"><b>${esc(t('ds.pdfNotDiagnosis'))}</b></p></body></html>`;
}

const st = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: 'rgba(29,26,78,0.12)' },
  who: { fontFamily: F.uiMed, fontSize: 15, lineHeight: 25 },
  grade: { fontFamily: F.title, fontSize: 24, lineHeight: 38 },
  shareBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  ears: { flexDirection: 'row', gap: 12 },
  ear: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: C.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.lilac,
    borderTopWidth: 5 },
  earName: { fontFamily: F.uiBold, fontSize: 16, lineHeight: 27 },
  earDb: { color: C.night, fontFamily: F.title, fontSize: 26, lineHeight: 40 },
  gradePill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 2 },
  gradePillText: { fontFamily: F.uiBold, fontSize: 14, lineHeight: 24, textAlign: 'center' },
  cite: { color: C.dusk, fontFamily: F.ui, fontSize: 13, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 12 },
  rowOn: { backgroundColor: C.indigoTint },
  swatch: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(29,26,78,0.2)' },
  cellName: { flex: 1, color: C.night, fontFamily: F.uiMed, fontSize: 16, lineHeight: 27 },
  cellRange: { color: C.night, fontFamily: F.uiBold, fontSize: 15, lineHeight: 25 },
  scrim: { flex: 1, backgroundColor: 'rgba(29,26,78,0.45)' },
  sheet: { backgroundColor: C.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32, gap: 10 },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: C.lilac },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, backgroundColor: C.white, borderRadius: 16,
    paddingHorizontal: 14, borderWidth: 1, borderColor: C.lilac },
  shareIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.indigoTint, alignItems: 'center', justifyContent: 'center' },
  cancel: { alignSelf: 'center', minHeight: 48, justifyContent: 'center', paddingHorizontal: 20 },
  cancelText: { color: C.indigo, fontFamily: F.uiBold, fontSize: 16, lineHeight: 27 },
});
