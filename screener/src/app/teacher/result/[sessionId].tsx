// One child's screening result: outcome, what the outcomes mean, each ear, and each tone. Adapted from DhwaniSarathi
// audiometer/app/Screens/Results.js (Apache-2.0, the DhwaniSarathi team), keeping its layout (result box, legend box,
// two ear cards, chart box). Changed by us: our app screens at one fixed level and measures no thresholds, so the
// pure-tone average, hearing-loss grades, dB HL ranges and the Victory audiogram are replaced by our outcome
// (PASS / RETEST / REFER) and a per-tone table (heard / not heard / not tested); data from this phone's stored result
// instead of the `results` param; ear images → our icon tiles; the share modal (view-shot, WhatsApp) removed; our
// design system. Screening only, never a diagnosis.
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { cfg } from '@/config';
import { db } from '@/db';
import { get, list } from '@/db/store';
import { useT, type Key } from '@/i18n';
import type { Child, Result } from '@/teacher/data';
import { C, Card, F, H, OUTCOME, Pill, s, Tile } from '@/ui';

const outcomes = ['PASS', 'RETEST', 'REFER'] as const;
type Outcome = (typeof outcomes)[number];
const known = (o: string | null | undefined): o is Outcome => !!o && o in OUTCOME;

// Engine point statuses (src/rules) → the three words a teacher needs.
const TONE: Record<string, Key> = {
  heard: 'teacher.heard', heard_on_rescreen: 'teacher.heard',
  not_heard: 'teacher.notHeard', not_heard_confirmed: 'teacher.notHeard',
};

const Results = () => {
  const t = useT();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const session = get<{ child: string }>(db, 'screening_session', sessionId);
  const child = session && get<Child>(db, 'child', session.child);
  const result = list<Result>(db, 'screening_result').find((r) => r.session === sessionId);
  if (!result) return <ScrollView contentContainerStyle={s.screen}><Text style={s.muted}>-</Text></ScrollView>;

  const freqs = [...new Set([...cfg.frequencies_hz.value as number[],
    ...Object.keys(result.frequency_results ?? {}).map((k) => Number(k.split('-')[1]))])].sort((a, b) => a - b);
  const tone = (ear: string, f: number) => t(TONE[result.frequency_results?.[`${ear}-${f}`]] ?? 'teacher.notTested');

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <H>{child?.display_name ?? '-'}</H>

      <Card style={st.gridItem}>
        {known(result.outcome) && (
          <View style={[st.badge, { backgroundColor: OUTCOME[result.outcome].fill }]}>
            <Text style={[st.badgeText, { color: OUTCOME[result.outcome].on }]}>{result.outcome}</Text>
          </View>
        )}
        {known(result.outcome) && <Text style={s.p}>{t(`teacher.meaning.${result.outcome}`)}</Text>}
      </Card>

      <Card>
        <Text style={st.headerText}>{t('teacher.outcomesH')}</Text>
        {outcomes.map((o) => <Text key={o} style={s.muted}>{t(`teacher.meaning.${o}`)}</Text>)}
      </Card>

      <View style={st.twoColumnContainer}>
        {(['left', 'right'] as const).map((ear) => (
          <Card key={ear} style={st.earGridItem}>
            <Text style={st.headerText}>{t(ear === 'left' ? 'teacher.leftEar' : 'teacher.rightEar')}</Text>
            <Tile name="ear" tint={C.indigoTint} />
            <OutcomePill o={result.ear_outcomes?.[ear]} />
          </Card>
        ))}
      </View>

      <Card>
        <Text style={st.headerText}>{t('teacher.tonesH')}</Text>
        <Text style={s.muted}>{t('teacher.tonesP')}</Text>
        <View style={st.row}>
          <Text style={[st.cell, st.th]}>Hz</Text>
          <Text style={[st.cell, st.th]}>{t('teacher.leftEar')}</Text>
          <Text style={[st.cell, st.th]}>{t('teacher.rightEar')}</Text>
        </View>
        {freqs.map((f) => (
          <View key={f} style={st.row}>
            <Text style={[st.cell, st.th]}>{f}</Text>
            <Text style={st.cell}>{tone('left', f)}</Text>
            <Text style={st.cell}>{tone('right', f)}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const OutcomePill = ({ o }: { o: string | null | undefined }) => known(o)
  ? <Pill icon={OUTCOME[o].icon} text={o} tint={OUTCOME[o].tint} color={OUTCOME[o].onTint} />
  : <Text style={s.p}>-</Text>;

const st = StyleSheet.create({
  gridItem: { alignItems: 'center' },
  badge: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 28 },
  badgeText: { fontFamily: F.uiBold, fontSize: 28, lineHeight: 38, letterSpacing: 0.6 },
  twoColumnContainer: { flexDirection: 'row', gap: 12 },
  earGridItem: { flex: 1, alignItems: 'center' },
  headerText: { color: C.night, fontFamily: F.uiBold, fontSize: 18, lineHeight: 30, textAlign: 'center' },
  row: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.lilac, paddingVertical: 6 },
  cell: { flex: 1, color: C.night, fontFamily: F.ui, fontSize: 15, lineHeight: 25 },
  th: { fontFamily: F.uiBold },
});

export default Results;
