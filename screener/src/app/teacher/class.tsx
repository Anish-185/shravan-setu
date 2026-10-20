// One classroom's screening rounds (the original "assignments") with progress, and a form for a new round. Adapted
// from DhwaniSarathi audiometer/app/Screens/Educator/AssignmentList.js (Apache-2.0, the DhwaniSarathi team). Changed
// by us: rounds are local records on this phone instead of /classrooms/<CID>/assignments/; progress = children of the
// class screened in the round ÷ class strength, from our screening sessions; react-native-paper cards, FontAwesome
// icons and the random cover images → our design system; "Copy Assignment ID" and the unwired deadline box removed.
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useT } from '@/i18n';
import { Icon, type IconName } from '@/icons';
import { addAssignment, assignments as loadAssignments, classChildren, roundResults } from '@/teacher/data';
import { Btn, C, Card, F, H, s } from '@/ui';

const AssignmentList = () => {
  const t = useT();
  const params = useLocalSearchParams<{ label?: string }>();
  const label = params.label ?? '';
  const Count = classChildren(label).length;

  const load = useCallback(() => loadAssignments(label).map((a) => ({ ...a, SubmittedCount: roundResults(a).length })),
    [label]);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState(load);
  const [assignmentName, setAssignmentName] = useState('');
  // Back from a test: progress may have moved.
  useFocusEffect(useCallback(() => setAssignments(load()), [load]));

  const handleNewAssignment = () => {
    addAssignment(label, assignmentName.trim());
    setAssignmentName('');
    setAssignments(load());
  };

  const renderAssignmentCard = (item: ReturnType<typeof load>[number]) => (
    <Card key={item.id} style={{ padding: 0 }}>
      <Link href={{ pathname: '/teacher/assignment/[id]', params: { id: item.id } }} asChild>
        <Pressable style={st.card}>
          <View style={st.titleRow}>
            <Text style={st.cardTitle}>{item.name}</Text>
            <Icon name="chevron-right" size={20} color={C.dusk} />
          </View>
          <Field icon="calendar-clock" text={t('teacher.deadline', { date: item.deadline })} />
          <Field icon="users" text={t('teacher.strength', { n: Count })} />
          <Field icon="circle-check" text={t('teacher.progress', { done: item.SubmittedCount, total: Count })} />
          <View style={st.progressBar}>
            <View style={[st.progress, { width: `${Count ? Math.min(100, (item.SubmittedCount / Count) * 100) : 0}%` }]} />
          </View>
        </Pressable>
      </Link>
    </Card>
  );

  const searchFilter = (item: { name: string }) => item.name.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <H>{label || t('teacher.noClass')}</H>
      <Text style={st.title}>{t('teacher.roundsH')}</Text>
      <TextInput style={s.input} placeholder={t('teacher.search')} value={searchQuery} onChangeText={setSearchQuery} />
      {assignments.length === 0 && <Text style={s.muted}>{t('teacher.noRounds')}</Text>}
      {assignments.filter(searchFilter).map(renderAssignmentCard)}

      <Card>
        <Text style={st.title}>{t('teacher.newRoundH')}</Text>
        <TextInput style={s.input} placeholder={t('teacher.roundName')} value={assignmentName} onChangeText={setAssignmentName} />
        <Btn title={t('teacher.createRound')} onPress={handleNewAssignment} disabled={!assignmentName.trim()} />
      </Card>
    </ScrollView>
  );
};

function Field({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={st.field}>
      <Icon name={icon} size={16} color={C.indigo} />
      <Text style={[s.muted, { flex: 1 }]}>{text}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  title: { color: C.night, fontFamily: F.uiBold, fontSize: 18, lineHeight: 30 },
  card: { padding: 16, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, color: C.night, fontFamily: F.uiBold, fontSize: 18, lineHeight: 30 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { backgroundColor: C.lilac, borderRadius: 5, height: 10, marginTop: 6, overflow: 'hidden' },
  progress: { height: 10, backgroundColor: C.indigo, borderRadius: 5 },
});

export default AssignmentList;
