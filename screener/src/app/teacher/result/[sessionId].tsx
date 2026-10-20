// One child's screening result: outcome, what it means, each ear side by side, and each tone. Layout idea from
// DhwaniSarathi audiometer/app/Screens/Results.js (Apache-2.0, the DhwaniSarathi team): result box, two ear cards,
// then the detail. Ours: our screening plays one fixed level and measures no thresholds, so the outcome (PASS /
// RETEST / REFER) and a heard / not heard grid per tone take the place of dB values and grades; our design; a link to
// the child's tests. Screening only, never a diagnosis.
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { cfg } from '@/config';
import { db } from '@/db';
import { get, list } from '@/db/store';
import { useT, type Key } from '@/i18n';
import { Icon, type IconName } from '@/icons';
import { EarBadge } from '@/illustrations';
import type { Child, Result } from '@/teacher/data';
import { Btn, C, Card, EAR, F, OUTCOME, Pill, s, SectionH } from '@/ui';

const outcomes = ['PASS', 'RETEST', 'REFER'] as const;
type Outcome = (typeof outcomes)[number];
const known = (o: string | null | undefined): o is Outcome => !!o && o in OUTCOME;

// Engine point statuses (src/rules) → the three things a teacher needs.
const TONE: Record<string, { key: Key; icon: IconName; color: string }> = {
  heard: { key: 'teacher.heard', icon: 'circle-check', color: OUTCOME.PASS.fill },
  heard_on_rescreen: { key: 'teacher.heard', icon: 'circle-check', color: OUTCOME.PASS.fill },
  not_heard: { key: 'teacher.notHeard', icon: 'x', color: OUTCOME.REFER.fill },
  not_heard_confirmed: { key: 'teacher.notHeard', icon: 'x', color: OUTCOME.REFER.fill },
};

export default function ScreeningResult() {
  const t = useT();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const session = get<{ child: string; started_at: string }>(db, 'screening_session', sessionId);
  const child = session && get<Child>(db, 'child', session.child);
  const result = list<Result>(db, 'screening_result').find((r) => r.session === sessionId);
  if (!result || !session) return <ScrollView contentContainerStyle={s.screen}><Text style={s.p}>{t('screen.notFound')}</Text></ScrollView>;

  const freqs = [...new Set([...cfg.frequencies_hz.value as number[],
    ...Object.keys(result.frequency_results ?? {}).map((k) => Number(k.split('-')[1]))])].sort((a, b) => a - b);
  const o = known(result.outcome) ? OUTCOME[result.outcome] : null;

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <View style={[st.hero, { backgroundColor: o?.fill ?? C.white }]}>
        <Text style={[st.who, { color: o?.on ?? C.night }]}>{`${child?.display_name ?? '-'} · ${session.started_at.slice(0, 10)}`}</Text>
        <View style={st.heroRow}>
          {o && <Icon name={o.icon} size={30} color={o.on} />}
          <Text style={[st.outcome, { color: o?.on ?? C.night }]}>{result.outcome ?? '-'}</Text>
        </View>
        {known(result.outcome) && <Text style={[st.meaning, { color: o!.on }]}>{t(`teacher.meaning.${result.outcome}`)}</Text>}
      </View>

      <View style={st.ears}>
        {(['left', 'right'] as const).map((ear) => {
          const eo = result.ear_outcomes?.[ear];
          return (
            <View key={ear} style={[st.ear, { borderTopColor: EAR[ear] }]}>
              <EarBadge ear={ear} size={48} />
              <Text style={[st.earName, { color: EAR[ear] }]}>{t(ear === 'left' ? 'teacher.leftEar' : 'teacher.rightEar')}</Text>
              {known(eo) ? <Pill icon={OUTCOME[eo].icon} text={eo} tint={OUTCOME[eo].tint} color={OUTCOME[eo].onTint} /> : <Text style={s.p}>-</Text>}
            </View>
          );
        })}
      </View>

      <SectionH title={t('teacher.tonesH')} />
      <Card style={{ gap: 0 }}>
        <Text style={[s.muted, { marginBottom: 8 }]}>{t('teacher.tonesP')}</Text>
        <View style={st.row}>
          <Text style={[st.cell, st.th, { flex: 0.8 }]}>Hz</Text>
          <Text style={[st.cell, st.th, { color: EAR.left }]}>{t('teacher.leftEar')}</Text>
          <Text style={[st.cell, st.th, { color: EAR.right }]}>{t('teacher.rightEar')}</Text>
        </View>
        {freqs.map((f) => (
          <View key={f} style={st.row}>
            <Text style={[st.cell, st.th, { flex: 0.8 }]}>{f}</Text>
            {(['left', 'right'] as const).map((ear) => {
              const tone = TONE[result.frequency_results?.[`${ear}-${f}`]];
              return (
                <View key={ear} style={[st.cell, st.toneCell]}>
                  {tone && <Icon name={tone.icon} size={18} color={tone.color} stroke={2.2} />}
                  <Text style={st.toneText}>{t(tone?.key ?? 'teacher.notTested')}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </Card>

      <Card>
        <Text style={st.h}>{t('teacher.outcomesH')}</Text>
        {outcomes.map((k) => (
          <View key={k} style={st.meaningRow}>
            <Pill icon={OUTCOME[k].icon} text={k} tint={OUTCOME[k].tint} color={OUTCOME[k].onTint} />
            <Text style={[s.muted, { flex: 1 }]}>{t(`teacher.meaning.${k}`)}</Text>
          </View>
        ))}
      </Card>
      {child && <Btn kind="plain" icon="history" title={t('result.childTests')}
        onPress={() => router.push({ pathname: '/child/[childId]', params: { childId: session.child } })} />}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  hero: { borderRadius: 22, padding: 18, gap: 4 },
  who: { fontFamily: F.uiMed, fontSize: 15, lineHeight: 25 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  outcome: { fontFamily: F.uiBold, fontSize: 32, lineHeight: 46, letterSpacing: 0.6 },
  meaning: { fontFamily: F.ui, fontSize: 16, lineHeight: 27 },
  ears: { flexDirection: 'row', gap: 12 },
  ear: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: C.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.lilac,
    borderTopWidth: 5 },
  earName: { fontFamily: F.uiBold, fontSize: 16, lineHeight: 27 },
  h: { color: C.night, fontFamily: F.uiBold, fontSize: 17, lineHeight: 28 },
  meaningRow: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.lilac, paddingVertical: 8 },
  cell: { flex: 1, color: C.night, fontFamily: F.ui, fontSize: 15, lineHeight: 25 },
  th: { fontFamily: F.uiBold },
  toneCell: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toneText: { flexShrink: 1, color: C.night, fontFamily: F.ui, fontSize: 15, lineHeight: 25 },
});
