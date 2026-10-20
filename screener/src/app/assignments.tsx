// Assignments tab: every screening round of the school, with deadline and progress, and "Create assignment". The
// original listed assignments inside each classroom (AssignmentList.js); ours also gathers them here, one tap from
// anywhere. Tapping one opens its analytics.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Band } from '@/art';
import { db } from '@/db';
import { kvGet } from '@/db/store';
import { useT } from '@/i18n';
import { AssignmentCard, CreateAssignment } from '@/teacher/Assignments';
import { allAssignments, classrooms, ymd } from '@/teacher/data';
import { C, Chips, s, SectionH } from '@/ui';

const FILTERS = ['open', 'past', 'all'] as const;

export default function Assignments() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const load = () => ({ rows: allAssignments(), labels: classrooms().map((c) => c.label) });
  const [data, setData] = useState(load);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('open');
  useFocusEffect(useCallback(() => setData(load()), []));
  const today = ymd(new Date());
  const shown = data.rows.filter((a) => filter === 'all' || (filter === 'past') === (a.deadline < today));

  return (
    <ScrollView style={{ backgroundColor: C.paper }} contentContainerStyle={{ paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
      <Band top={insets.top} title={t('ds.assignments')} sub={t('assign.sub')}
        figure={{ source: require('../../assets/images/peeps/sync.png'), w: 92, h: 120 }} />
      <View style={[s.screen, { paddingTop: 16 }]}>
        {kvGet(db, 'school_id')
          ? <CreateAssignment labels={data.labels} onCreated={() => { setData(load()); setFilter('open'); }} />
          : <Text style={s.muted}>{t('children.pickSchool')}</Text>}
        <SectionH title={t('assign.listH', { n: shown.length })} />
        <Chips options={FILTERS} value={filter} onChange={setFilter} label={(f) => t(`assign.filter.${f}`)} />
        {shown.length === 0 && <Text style={s.muted}>{t('teacher.noRounds')}</Text>}
        {shown.map((a) => <AssignmentCard key={a.id} a={a} showClass />)}
      </View>
    </ScrollView>
  );
}
