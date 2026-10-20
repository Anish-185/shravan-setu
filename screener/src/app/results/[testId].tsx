// "Your Results" for a detailed test. Copied from DhwaniSarathi audiometer/app/Screens/Results.js (Apache-2.0, the
// DhwaniSarathi team): share menu, title band, category description, category table, left / right ear cards with the
// ear icons, the audiogram with both ears and the coloured-band audiogram. Changed by us:
// - data: the stored detailed test (dB re: team baseline, our calibration) instead of the `results` param, and no
//   sample data when it is missing; grades from config hearing_grades (WHO 2021) for the table, the cards and the bands;
// - wording: grades are labelled estimates; "Range (dB HL)" names WHO as the source of the dB HL ranges; one line
//   says the values come from a phone test with provisional calibration; typos fixed; i18next → useT();
// - charts: x axis = our four frequencies; a tone not heard up to the loudest playable level is drawn at that level
//   as a down triangle; the coloured-band audiogram is drawn with victory bands at the WHO boundaries instead of
//   their audiogram-bg.png + legend.jpeg overlay (that image's bands, 0/20/40/70/90 dB, disagree with the table);
// - share: Export to PDF, Share on WhatsApp and Share with doctor all make a PDF (expo-print) and open the phone's
//   share sheet (expo-sharing), instead of a react-native-view-shot JPEG; their "Share with Doctor" did nothing.
// Screening and referral only, never a diagnosis.
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  VictoryArea, VictoryAxis, VictoryChart, VictoryLegend, VictoryLine, VictoryScatter, VictoryTheme,
} from 'victory-native';

import { cfg } from '@/config';
import { db } from '@/db';
import { get } from '@/db/store';
import { useT, type Key } from '@/i18n';
import { Icon } from '@/icons';
import {
  BAND_COLOR, calculateAverage, determineHearingCategory, grades, type Point,
} from '@/original/hearing';
import { DS } from '@/original/paper';
import { v } from '@/rules';

const { width: screenWidth } = Dimensions.get('window');
export type DetailedTest = { child: string; finished_at: string; points: Point[]; calibration_provisional: boolean };

const FREQS: number[] = v(cfg, 'detailed_test', 'frequencies_hz');
const fLabel = (f: number) => (f >= 1000 ? `${f / 1000}k` : String(f));
const gradeKey = (g: string) => `ds.grade.${g}` as Key;
const infoKey = (g: string) => `ds.info.${g}` as Key;

// Chart data: x = position of the frequency (1..4), y = threshold, or the loudest level played if never heard.
const earData = (points: Point[], ear: 'left' | 'right') => points.filter((p) => p.ear === ear)
  .map((p) => ({ x: FREQS.indexOf(p.frequency) + 1, y: p.threshold ?? p.max, none: p.threshold === null }));

const Results = () => {
  const t = useT();
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const test = get<DetailedTest>(db, 'detailed_test', testId);
  const child = test && get<{ display_name: string }>(db, 'child', test.child);
  const [modalVisible, setModalVisible] = useState(false);
  if (!test) return <ScrollView contentContainerStyle={styles.container}><Text>-</Text></ScrollView>;

  const leftEarData = earData(test.points, 'left');
  const rightEarData = earData(test.points, 'right');
  const leftEarAverage = calculateAverage(test.points, 'left');
  const rightEarAverage = calculateAverage(test.points, 'right');
  const leftEarCategoryInfo = leftEarAverage && determineHearingCategory(leftEarAverage.db, cfg);
  const rightEarCategoryInfo = rightEarAverage && determineHearingCategory(rightEarAverage.db, cfg);
  const combinedCategoryInfo = leftEarAverage && rightEarAverage
    && determineHearingCategory((leftEarAverage.db + rightEarAverage.db) / 2, cfg);
  const dB = (a: { db: number; atLeast: boolean } | null) => (a ? `${a.atLeast ? '≥ ' : ''}${a.db} dB` : '-');
  // ERR-044: at 1-4 kHz the baseline is an upper bound set by the playback floor, so 0 there may read too low.
  const floorLimited = test.points.some((p) => p.frequency >= 1000 && p.threshold === 0);

  const share = async (dialogTitle: string) => {
    setModalVisible(false);
    const { uri } = await Print.printToFileAsync({ html: reportHtml(test, child?.display_name ?? '-', t) });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle });
  };

  const bands = grades(cfg).map((g, i, all) => ({ g: g.grade, lo: g.min_db, hi: all[i + 1]?.min_db ?? 120 }));
  const chartWidth = Math.min(screenWidth - 20, 420);

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.container}>
        <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.option} onPress={() => share(t('ds.exportPdf'))}>
              <Text style={styles.optionText}>{t('ds.exportPdf')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => share(t('ds.shareWhatsApp'))}>
              <Text style={styles.optionText}>{t('ds.shareWhatsApp')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => share(t('ds.shareDoctor'))}>
              <Text style={styles.optionText}>{t('ds.shareDoctor')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>{t('ds.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <View>
          <Text style={styles.title}>{t('ds.yourResults')}</Text>
          <TouchableOpacity style={styles.shareButton} accessibilityRole="button" accessibilityLabel={t('ds.share')}
            onPress={() => setModalVisible(true)}>
            <Icon name="share" size={30} color="white" />
          </TouchableOpacity>
        </View>
        {test.calibration_provisional && <Text style={styles.estimate}>{t('ds.estimateLine')}</Text>}
        {!!child && <Text style={[styles.pText, { textAlign: 'center' }]}>{child.display_name} · {test.finished_at.slice(0, 10)}</Text>}

        {combinedCategoryInfo && (
          <View style={styles.gridItem}>
            <Text style={styles.headerText}>{t('ds.estimatedGrade', { grade: t(gradeKey(combinedCategoryInfo.category)) })}</Text>
            <Text style={styles.pText}>
              {t('ds.rangeLine', { range: combinedCategoryInfo.formattedRange })} {t(infoKey(combinedCategoryInfo.category))}
            </Text>
          </View>
        )}

        <View style={[styles.gridItem, { minHeight: 200 }]}>
          <View style={styles.twoColumnContainer2}>
            <View style={styles.column2}>
              <Text style={styles.columnHeaderText}>{t('ds.categories')}</Text>
              <Text style={styles.columnText}>{grades(cfg).map((g) => t(gradeKey(g.grade))).join('\n')}</Text>
            </View>
            <View style={styles.column2}>
              <Text style={styles.columnHeaderText}>{t('ds.rangeHeader')}</Text>
              <Text style={styles.columnText}>
                {grades(cfg).map((g) => (g.max_db === null ? `${g.min_db}+` : `${g.min_db} to ${g.max_db}`)).join('\n')}
              </Text>
            </View>
          </View>
          <Text style={styles.cite}>{t('ds.whoCite')}</Text>
        </View>

        <View style={styles.twoColumnContainer}>
          {([['left', leftEarAverage, leftEarCategoryInfo], ['right', rightEarAverage, rightEarCategoryInfo]] as const)
            .map(([ear, avg, info]) => (
              <View key={ear} style={styles.earGridItem}>
                <Text style={styles.headerText}>{t(ear === 'left' ? 'teacher.leftEar' : 'teacher.rightEar')}</Text>
                <Image style={styles.image} resizeMode="cover" source={ear === 'left'
                  ? require('@/assets/images/original/leftear.png') : require('@/assets/images/original/rightear.png')} />
                <Text style={styles.resultText2}>{dB(avg)}</Text>
                <Text style={styles.resultText}>{info ? t(gradeKey(info.category)) : '-'}</Text>
              </View>
            ))}
        </View>

        <View style={[styles.gridItem, { minHeight: 420 }]}>
          <Text style={styles.headerText}>{t('ds.audiogramH')}</Text>
          <Text style={styles.pText}>{t('ds.audiogramP')}</Text>
          <VictoryChart theme={VictoryTheme.material} width={chartWidth} height={300} domain={{ x: [0.5, 4.5], y: [-10, 120] }}
            style={{ background: { fill: 'white' } }}>
            <VictoryAxis tickValues={[1, 2, 3, 4]} tickFormat={FREQS.map(fLabel)} orientation="top"
              style={{ tickLabels: { fill: 'grey', padding: 5 }, grid: { stroke: 'grey' } }} />
            <VictoryAxis dependentAxis invertAxis tickValues={[-10, 0, 20, 40, 60, 80, 100, 120]}
              style={{ tickLabels: { fill: 'grey', padding: 5 }, grid: { stroke: 'grey' } }} />
            <VictoryLine data={leftEarData} style={{ data: { stroke: DS.navy, strokeWidth: 2 } }} />
            <VictoryLine data={rightEarData} style={{ data: { stroke: DS.red, strokeWidth: 2 } }} />
            <VictoryScatter data={leftEarData} size={5}
              style={{ data: { fill: DS.navy } }} symbol={({ datum }) => (datum.none ? 'triangleDown' : 'plus')} />
            <VictoryScatter data={rightEarData} size={5}
              style={{ data: { fill: DS.red } }} symbol={({ datum }) => (datum.none ? 'triangleDown' : 'circle')} />
            <VictoryLegend x={Math.max(10, chartWidth / 2 - 90)} y={270} orientation="horizontal" gutter={10}
              style={{ border: { stroke: 'grey' }, labels: { fill: 'grey' } }}
              data={[
                { name: t('teacher.leftEar'), symbol: { fill: DS.navy, type: 'plus' } },
                { name: t('teacher.rightEar'), symbol: { fill: DS.red, type: 'circle' } },
              ]} />
          </VictoryChart>
          <Text style={styles.cite}>{t('ds.noResponseNote')}</Text>
          {floorLimited && <Text style={styles.cite}>{t('ds.floorNote')}</Text>}
        </View>

        <View style={[styles.gridItem, { paddingHorizontal: 0 }]}>
          <VictoryChart width={chartWidth} height={300} domain={{ x: [0.5, 4.5], y: [-10, 120] }}
            padding={{ top: 30, left: 45, right: 20, bottom: 20 }}>
            {bands.map((b) => (
              <VictoryArea key={b.g} data={[{ x: 0.5, y: b.hi, y0: b.lo }, { x: 4.5, y: b.hi, y0: b.lo }]}
                style={{ data: { fill: BAND_COLOR[b.g], stroke: 'black', strokeWidth: 0.5 } }} />
            ))}
            <VictoryAxis tickValues={[1, 2, 3, 4]} tickFormat={FREQS.map(String)} orientation="top"
              style={{ grid: { stroke: 'black', strokeWidth: 0.5 }, tickLabels: { fill: 'black', fontSize: 12 } }} />
            <VictoryAxis dependentAxis invertAxis tickValues={[-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]}
              style={{ grid: { stroke: 'black', strokeWidth: 0.5 }, tickLabels: { fill: 'black', fontSize: 11 } }} />
            <VictoryLine data={leftEarData} style={{ data: { strokeWidth: 4, stroke: DS.navy } }} />
            <VictoryLine data={rightEarData} style={{ data: { strokeWidth: 4, stroke: 'red' } }} />
            <VictoryScatter data={leftEarData} size={6} style={{ data: { fill: DS.navy } }}
              symbol={({ datum }) => (datum.none ? 'triangleDown' : 'cross')} />
            <VictoryScatter data={rightEarData} size={6} style={{ data: { fill: 'red' } }}
              symbol={({ datum }) => (datum.none ? 'triangleDown' : 'circle')} />
          </VictoryChart>
          <View style={styles.legend}>
            {bands.map((b) => (
              <View key={b.g} style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: BAND_COLOR[b.g] }]} />
                <Text style={styles.legendText}>{t(gradeKey(b.g))}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

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
  return `<html><head><meta charset="utf-8"><style>body{font-family:sans-serif;color:#2b3467;padding:24px}
h1{background:#eb4557;color:#fff;padding:8px;text-align:center}table{border-collapse:collapse;width:100%;margin:12px 0}
td,th{border:1px solid #999;padding:6px;text-align:center}.note{font-size:12px;color:#555}</style></head><body>
<h1>${esc(t('ds.yourResults'))}</h1><p><b>${esc(name)}</b> &middot; ${esc(test.finished_at.slice(0, 10))}</p>
<p class="note">${esc(t('ds.estimateLine'))}</p>
<table><tr><th>dB</th>${FREQS.map((f) => `<th>${f} Hz</th>`).join('')}<th>${esc(t('ds.average'))}</th><th>${esc(t('ds.categories'))}</th></tr>
${row('left')}${row('right')}</table>
<table><tr><th>${esc(t('ds.categories'))}</th><th>${esc(t('ds.rangeHeader'))}</th></tr>
${grades(cfg).map((g) => `<tr><td>${esc(t(gradeKey(g.grade)))}</td><td>${g.max_db === null ? `${g.min_db}+` : `${g.min_db} to ${g.max_db}`}</td></tr>`).join('')}</table>
<p class="note">${esc(t('ds.whoCite'))}</p><p class="note">${esc(t('ds.noResponseNote'))}</p>
<p class="note">${esc(t('ds.floorNote'))}</p><p class="note"><b>${esc(t('ds.pdfNotDiagnosis'))}</b></p></body></html>`;
}

const styles = StyleSheet.create({
  scrollViewContainer: { flexGrow: 1, backgroundColor: 'white' },
  container: { flex: 1, alignItems: 'stretch', padding: 10, backgroundColor: DS.grey },
  title: { fontSize: 30, fontWeight: 'bold', color: 'white', textAlign: 'center', paddingTop: 10, paddingBottom: 10, backgroundColor: '#eb4557' },
  estimate: { fontSize: 13, color: '#7A4F00', textAlign: 'center', marginTop: 6 },
  cite: { fontSize: 12, color: 'grey', marginTop: 8, alignSelf: 'stretch' },
  gridItem: { flex: 1, justifyContent: 'center', alignItems: 'center', margin: 7, padding: 10, backgroundColor: 'white', borderRadius: 10 },
  twoColumnContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  twoColumnContainer2: { flexDirection: 'row', justifyContent: 'space-between' },
  column2: { flex: 1, marginHorizontal: 15 },
  columnHeaderText: { fontSize: 16, fontWeight: 'bold', color: DS.red, marginBottom: 5 },
  columnText: { fontSize: 14, color: DS.navy, lineHeight: 22 },
  earGridItem: { flex: 1, justifyContent: 'center', alignItems: 'center', margin: 7, padding: 10, backgroundColor: 'white', borderRadius: 10 },
  headerText: { fontSize: 20, marginBottom: 10, textAlign: 'center', color: '#eb4557' },
  pText: { fontSize: 15, color: DS.navy },
  image: { width: 100, height: 100 },
  resultText: { fontSize: 15, textAlign: 'center', color: DS.red },
  resultText2: { fontSize: 20, textAlign: 'center', color: DS.navy },
  shareButton: { position: 'absolute', top: 10, right: 10, zIndex: 2, borderRadius: 50, padding: 4 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DS.sky },
  option: { padding: 20, borderBottomWidth: 1, borderBottomColor: 'black', width: '100%', alignItems: 'center' },
  optionText: { fontSize: 18, color: 'black' },
  cancelText: { marginTop: 20, fontSize: 18, color: DS.navy },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingHorizontal: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 22, height: 22, borderWidth: 1, borderColor: 'black' },
  legendText: { fontSize: 14, color: 'black' },
});

export default Results;
