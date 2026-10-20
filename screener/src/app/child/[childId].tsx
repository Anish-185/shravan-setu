// A child's tests over time. Idea from DhwaniSarathi: the home screen's row of result cards (HomeNew.js + UDCard.js,
// Apache-2.0, the DhwaniSarathi team) from /results/<UID>/, which merged UserOnlyResults and UserAssignmentResults, each
// card "Self Test" or the classroom name, the date and "View Results". Ours: one timeline per child, every screening
// and detailed test with its date, type, round, outcome or estimated grade, a link to the full result, and buttons to
// screen again or run the detailed test. Data from this phone (screenings sync; detailed tests stay local).
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Band } from '@/art';
import type { CaseRec } from '@/cases';
import { db } from '@/db';
import { get, list } from '@/db/store';
import { useT, type Key } from '@/i18n';
import { childHistory, type Child, type HistoryItem } from '@/teacher/data';
import { Btn, C, F, GRADE, OUTCOME, P, Pill, PostRow, s, SectionH, StatusPill } from '@/ui';

const when = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} `
    + `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function ChildHistory() {
  const t = useT();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const load = useCallback(() => ({
    child: get<Child>(db, 'child', childId),
    items: childHistory(childId),
    kase: list<CaseRec>(db, 'case').find((k) => k.child === childId) ?? null, // newest first
  }), [childId]);
  const [data, setData] = useState(load);
  useFocusEffect(useCallback(() => setData(load()), [load])); // back from a new test
  const { child, items, kase } = data;
  if (!child) return <ScrollView contentContainerStyle={s.screen}><P>{t('screen.notFound')}</P></ScrollView>;

  const open = (h: HistoryItem) => router.push(h.kind === 'screening'
    ? { pathname: '/teacher/result/[sessionId]', params: { sessionId: h.id } }
    : { pathname: '/results/[testId]', params: { testId: h.id } });

  return (
    <ScrollView style={{ backgroundColor: C.paper }} contentContainerStyle={{ paddingBottom: 28 }}>
      <Band title={child.display_name}
        sub={[t('teacher.age', { age: child.age_band }), child.class_label ? t('history.class', { label: child.class_label }) : ''].filter(Boolean).join(' · ')}
        figure={{ source: require('../../../assets/images/peeps/test-intro.png'), w: 56, h: 118 }}>
        {kase && (
          <View style={{ alignSelf: 'flex-start', marginTop: 6 }}>
            <StatusPill status={kase.status} text={`${t('title.case')}: ${t(`status.${kase.status}` as Key)}`} />
          </View>
        )}
      </Band>
      <View style={s.screen}>
        <View style={st.actions}>
          <View style={{ flex: 1 }}>
            <Btn icon="ear" title={t(items.some((h) => h.kind === 'screening') ? 'history.screenAgain' : 'ds.screen')}
              onPress={() => router.push({ pathname: '/screen/[childId]', params: { childId } })} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn kind="plain" icon="headphones" title={t('ds.detailedTest')}
              onPress={() => router.push({ pathname: '/detailed/[childId]', params: { childId } })} />
          </View>
        </View>
        {kase && <Btn kind="plain" icon="folder-heart" title={t('history.openCase')}
          onPress={() => router.push({ pathname: '/cases/[caseId]', params: { caseId: kase.id } })} />}

        <SectionH title={t('history.testsH', { n: items.length })} />
        {items.length === 0 && <Text style={s.muted}>{t('history.empty')}</Text>}
        {items.map((h) => (
          <PostRow key={h.id} onPress={() => open(h)}
            color={h.kind === 'screening' ? (h.outcome && h.outcome in OUTCOME ? OUTCOME[h.outcome as keyof typeof OUTCOME].fill : C.lilac) : GRADE[h.grade ?? ''] ?? C.lilac}
            title={`${t(h.kind === 'screening' ? 'history.screening' : 'ds.detailedTest')} · ${when(h.at)}`}
            sub={h.round ? t('history.inRound', { name: h.round }) : t('history.individual')}
            label={`${t(h.kind === 'screening' ? 'history.screening' : 'ds.detailedTest')}, ${when(h.at)}, ${h.outcome ?? h.grade ?? ''}`}>
            <View style={st.result}>
              {h.kind === 'screening' && h.outcome && h.outcome in OUTCOME
                ? <Pill icon={OUTCOME[h.outcome as keyof typeof OUTCOME].icon} text={h.outcome} tint={OUTCOME[h.outcome as keyof typeof OUTCOME].tint}
                  color={OUTCOME[h.outcome as keyof typeof OUTCOME].onTint} />
                : h.grade && <Text style={st.grade}>{t('ds.estimatedGrade', { grade: t(`ds.grade.${h.grade}` as Key) })}</Text>}
              <Text style={st.view}>{t('history.view')}</Text>
            </View>
          </PostRow>
        ))}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  result: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  grade: { color: C.night, fontFamily: F.uiBold, fontSize: 15, lineHeight: 25 },
  view: { color: C.indigo, fontFamily: F.uiBold, fontSize: 14, lineHeight: 24 },
});
