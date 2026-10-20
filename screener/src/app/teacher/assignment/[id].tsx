// Assignment analytics. Ideas from DhwaniSarathi audiometer/app/Screens/Educator/AssignmentAnalytics.js (Apache-2.0, the
// DhwaniSarathi team): a donut of the class, tap a slice to filter, colour-coded child cards with "More Details".
// Ours: drawn with react-native-svg (src/charts.tsx); two rings, the outer for the screening outcome (PASS / RETEST /
// REFER), the inner for the estimated grade of the worse ear from a detailed test (config hearing_grades, WHO 2021);
// legend chips with counts that filter too; children not yet tested listed apart; tapping a child opens their tests,
// "More details" opens this round's result. Data from this phone.
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Donut, type Slice } from '@/charts';
import { cfg } from '@/config';
import { db } from '@/db';
import { get } from '@/db/store';
import { useT, type Key } from '@/i18n';
import { grades } from '@/original/hearing';
import { classChildren, roundResults, strength, type Assignment } from '@/teacher/data';
import { Bar, C, Card, F, GRADE, LinkBtn, OUTCOME, PostRow, s, SectionH } from '@/ui';

const OUTCOMES = ['PASS', 'RETEST', 'REFER'] as const;

export default function Analytics() {
  const t = useT();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const load = useCallback(() => {
    const a = get<Assignment>(db, 'assignment', id);
    return a ? { a, rows: roundResults(a), kids: classChildren(a.class_label), total: strength(a.class_label) } : null;
  }, [id]);
  const [data, setData] = useState(load);
  const [selected, setSelected] = useState<string | null>(null);
  useFocusEffect(useCallback(() => setData(load()), [load]));
  if (!data) return <ScrollView contentContainerStyle={s.screen}><Text style={s.p}>{t('screen.notFound')}</Text></ScrollView>;
  const { a, rows, kids, total } = data;

  type Row = (typeof rows)[number];
  const outcomeOf = (r: Row) => r.result?.outcome ?? null;
  const gradeOf = (r: Row) => r.detailed?.grade ?? null;
  const outer: Slice[] = OUTCOMES.map((o) => ({ key: o, value: rows.filter((r) => outcomeOf(r) === o).length, color: OUTCOME[o].fill }));
  const inner: Slice[] = grades(cfg).map((g) => ({ key: g.grade, value: rows.filter((r) => gradeOf(r) === g.grade).length, color: GRADE[g.grade] }));
  const hasGrades = inner.some((x) => x.value > 0);
  const pick = (k: string) => setSelected((prev) => (prev === k ? null : k));
  const shown = rows.filter((r) => !selected || outcomeOf(r) === selected || gradeOf(r) === selected);
  const untested = kids.filter((k) => !rows.some((r) => r.child.id === k.id));
  const name = (k: string) => (k in OUTCOME ? k : t(`ds.grade.${k}` as Key));
  const pct = (n: number) => `${Math.round((100 * n) / Math.max(1, rows.length))}%`;

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Card style={{ alignItems: 'center' }}>
        <Text style={st.title}>{a.name}</Text>
        <Text style={s.muted}>{`${a.class_label || t('teacher.noClass')} · ${t('teacher.deadline', { date: a.deadline })}`}</Text>
        <View style={{ alignSelf: 'stretch', gap: 6 }}>
          <Text style={s.p}>{t('teacher.progress', { done: rows.length, total })}</Text>
          <Bar value={total ? rows.length / total : 0} />
        </View>
        {rows.length === 0 ? <Text style={[s.muted, { textAlign: 'center' }]}>{t('teacher.noResults')}</Text> : (
          <>
            <Donut rings={hasGrades ? [outer, inner] : [outer]} selected={selected} onSelect={pick} size={Math.min(260, width - 80)}
              centre={String(rows.length)} caption={t('analytics.tested')} />
            <Legend title={t('analytics.outerRing')} slices={outer} selected={selected} onPick={pick} name={name} pct={pct} />
            {hasGrades && <Legend title={t('analytics.innerRing')} slices={inner} selected={selected} onPick={pick} name={name} pct={pct} />}
            <Text style={st.note}>{t(selected ? 'analytics.filtered' : 'analytics.tapHint', { name: selected ? name(selected) : '' })}</Text>
          </>
        )}
      </Card>

      {shown.length > 0 && <SectionH title={t('analytics.childrenH', { n: shown.length })}
        action={selected ? <LinkBtn icon="x" title={t('analytics.clear')} onPress={() => setSelected(null)} /> : undefined} />}
      {shown.map((r) => {
        const o = outcomeOf(r);
        const g = gradeOf(r);
        const more = () => router.push(r.detailed
          ? { pathname: '/results/[testId]', params: { testId: r.detailed.id } }
          : { pathname: '/teacher/result/[sessionId]', params: { sessionId: r.sessionId! } });
        return (
          <PostRow key={r.child.id} color={o && o in OUTCOME ? OUTCOME[o as keyof typeof OUTCOME].fill : GRADE[g ?? ''] ?? C.lilac}
            title={r.child.display_name}
            sub={[t('teacher.age', { age: r.child.age_band }), o, g && `${name(g)} (${t('ds.estimated')})`].filter(Boolean).join(' · ')}
            onPress={() => router.push({ pathname: '/child/[childId]', params: { childId: r.child.id } })}
            footer={<LinkBtn icon="chart-pie" title={t('teacher.moreDetails')} onPress={more} />} />
        );
      })}

      {untested.length > 0 && !selected && (
        <>
          <SectionH title={t('analytics.untestedH', { n: untested.length })} />
          {untested.map((k) => (
            <PostRow key={k.id} color={C.lilac} title={k.display_name} sub={t('class.notTested')}
              onPress={() => router.push({ pathname: '/child/[childId]', params: { childId: k.id } })} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function Legend({ title, slices, selected, onPick, name, pct }: {
  title: string; slices: Slice[]; selected: string | null; onPick: (k: string) => void; name: (k: string) => string; pct: (n: number) => string;
}) {
  return (
    <View style={{ alignSelf: 'stretch', gap: 6 }}>
      <Text style={st.legendH}>{title}</Text>
      <View style={st.legend}>
        {slices.filter((x) => x.value > 0).map((x) => (
          <Pressable key={x.key} accessibilityRole="button" accessibilityState={{ selected: selected === x.key }} onPress={() => onPick(x.key)}
            style={[st.chip, selected === x.key && st.chipOn]}>
            <View style={[st.swatch, { backgroundColor: x.color }]} />
            <Text style={st.chipText}>{`${name(x.key)}  ${x.value} (${pct(x.value)})`}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  title: { color: C.night, fontFamily: F.title, fontSize: 24, lineHeight: 38, textAlign: 'center' },
  note: { color: C.dusk, fontFamily: F.ui, fontSize: 14, lineHeight: 24, textAlign: 'center' },
  legendH: { color: C.dusk, fontFamily: F.uiBold, fontSize: 14, lineHeight: 24 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5,
    borderColor: C.lilac, backgroundColor: C.white },
  chipOn: { borderColor: C.night, backgroundColor: C.indigoTint },
  swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(29,26,78,0.25)' },
  chipText: { color: C.night, fontFamily: F.uiMed, fontSize: 14, lineHeight: 24 },
});
