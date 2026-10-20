// One classroom: its children (tap for a child's tests), adding children to it, and its assignments. Ideas from
// DhwaniSarathi audiometer/app/Screens/Educator/AssignmentList.js (Apache-2.0, the DhwaniSarathi team): the class's
// assignments with deadline and progress, and "Create New Assignment". Ours: our design; children are put in a
// classroom through their class label (synced with the child); "Copy Assignment ID" left out (children have no app
// of their own to type it into).
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/i18n';
import { Cover } from '@/illustrations';
import { AssignmentCard, CreateAssignment } from '@/teacher/Assignments';
import { allChildren, assignChild, assignments, latestOutcomes, strength } from '@/teacher/data';
import { C, Check, F, LinkBtn, OUTCOME, PostRow, s, SectionH } from '@/ui';

export default function Classroom() {
  const t = useT();
  const { label = '' } = useLocalSearchParams<{ label?: string }>();
  const load = useCallback(() => ({
    count: strength(label), rounds: assignments(label), children: allChildren(), outcomes: latestOutcomes(),
  }), [label]);
  const [data, setData] = useState(load);
  const [adding, setAdding] = useState(false);
  useFocusEffect(useCallback(() => setData(load()), [load]));
  const inClass = data.children.filter((c) => (c.class_label ?? '') === label);
  const others = data.children.filter((c) => (c.class_label ?? '') !== label);

  return (
    <ScrollView style={{ backgroundColor: C.paper }} contentContainerStyle={{ paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
      <Cover seed={label || '-'} height={96}>
        <Text style={st.title}>{label || t('teacher.noClass')}</Text>
        <Text style={st.sub}>{t('home.classLine', { strength: data.count, kids: inClass.length })}</Text>
      </Cover>
      <View style={s.screen}>
        <SectionH title={t('ds.classChildren', { n: inClass.length })}
          action={label !== '' && others.length > 0
            ? <LinkBtn icon={adding ? 'x' : 'user-plus'} title={t(adding ? 'ds.hideAddChildren' : 'ds.addChildrenToClass')} onPress={() => setAdding(!adding)} />
            : undefined} />
        {adding && (
          <View style={st.adding}>
            <Text style={s.muted}>{t('class.addHint')}</Text>
            {others.map((c) => (
              <Check key={c.id} label={`${c.display_name} · ${c.age_band}${c.class_label ? ` (${c.class_label})` : ''}`} value={false}
                onChange={() => { assignChild(c, label); setData(load()); }} />
            ))}
          </View>
        )}
        {inClass.length === 0 && <Text style={s.muted}>{t('ds.noChildrenInClass')}</Text>}
        {inClass.map((c) => {
          const o = data.outcomes.get(c.id);
          return (
            <PostRow key={c.id} color={o ? OUTCOME[o].fill : C.lilac} title={c.display_name}
              sub={`${c.age_band} · ${o ?? t('class.notTested')}`}
              onPress={() => router.push({ pathname: '/child/[childId]', params: { childId: c.id } })} />
          );
        })}

        <SectionH title={t('ds.assignments')} />
        {data.rounds.length === 0 && <Text style={s.muted}>{t('teacher.noRounds')}</Text>}
        {data.rounds.map((a) => <AssignmentCard key={a.id} a={a} />)}
        <CreateAssignment labels={[label]} fixed={label} onCreated={() => setData(load())} />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  title: { color: C.white, fontFamily: F.title, fontSize: 30, lineHeight: 46 },
  sub: { color: C.white, fontFamily: F.ui, fontSize: 15, lineHeight: 25, opacity: 0.9 },
  adding: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1.5, borderColor: C.marigold, borderStyle: 'dashed', padding: 14,
    gap: 4 },
});
