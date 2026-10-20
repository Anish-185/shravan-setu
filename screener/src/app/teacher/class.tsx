// A classroom's assignments (screening rounds): cover image, name, deadline, class strength and progress bar, search,
// and "Create New Assignment" (name + deadline). Copied from DhwaniSarathi
// audiometer/app/Screens/Educator/AssignmentList.js (Apache-2.0, the DhwaniSarathi team), with its AssignmentImages
// covers. Changed by us: assignments are local records on this phone instead of /classrooms/<CID>/assignments/;
// progress = children tested in the round (screening or detailed test) ÷ class strength; the deadline box is wired
// (YYYY-MM-DD, default 7 days as their server set); the cover is picked from the assignment id, not at random on
// every render; covers 3 and 5 not used (watermarked stock previews); "Copy Assignment ID" removed (children have no
// app of their own to type it into); FontAwesome → our icons. Added by us: the classroom's children, to put children
// in the classroom and start a screening or the detailed test.
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Card, Paragraph, Title } from 'react-native-paper';

import { useT } from '@/i18n';
import { Icon } from '@/icons';
import { DS } from '@/original/paper';
import {
  addAssignment, allChildren, assignChild, assignments as loadAssignments, defaultDeadline, roundResults, strength,
} from '@/teacher/data';
import { Check } from '@/ui';

const images = [
  require('@/assets/images/original/AssignmentImages/0.jpg'),
  require('@/assets/images/original/AssignmentImages/1.jpg'),
  require('@/assets/images/original/AssignmentImages/2.jpg'),
  require('@/assets/images/original/AssignmentImages/4.jpg'),
];
const coverFor = (id: string) => images[parseInt(id.slice(0, 2), 16) % images.length];

const AssignmentList = () => {
  const t = useT();
  const params = useLocalSearchParams<{ label?: string }>();
  const label = params.label ?? '';

  const load = useCallback(() => ({
    Count: strength(label),
    assignments: loadAssignments(label).map((a) => ({ ...a, SubmittedCount: roundResults(a).length })),
    children: allChildren(),
  }), [label]);
  const [data, setData] = useState(load);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [showAll, setShowAll] = useState(false);
  // Back from a test: progress may have moved.
  useFocusEffect(useCallback(() => setData(load()), [load]));
  const { Count, assignments } = data;

  const deadlineOk = deadline === '' || /^\d{4}-\d{2}-\d{2}$/.test(deadline) && !isNaN(Date.parse(deadline));
  const handleNewAssignment = () => {
    addAssignment(label, assignmentName.trim(), deadline || defaultDeadline());
    setAssignmentName('');
    setDeadline('');
    setData(load());
  };

  const renderAssignmentCard = (item: (typeof assignments)[number]) => (
    <Card key={item.id} style={{ margin: 10, padding: 5 }}>
      <Card.Cover source={coverFor(item.id)} />
      <Link href={{ pathname: '/teacher/assignment/[id]', params: { id: item.id } }} asChild>
        <TouchableOpacity style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>{item.name}</Title>
            <Paragraph style={styles.cardDate}><Icon name="bell" size={14} color="#eb4557" />  {t('teacher.deadline', { date: item.deadline })}</Paragraph>
            <Paragraph style={styles.cardField}><Icon name="user" size={14} color="#eb4557" />  {t('ds.classStrength', { n: Count })}</Paragraph>
            <View style={styles.progressBarContainer}>
              <Paragraph style={styles.cardField}>
                <Icon name="check" size={14} color="#eb4557" />  {t('teacher.progress', { done: item.SubmittedCount, total: Count })}
              </Paragraph>
              <View style={styles.progressBar}>
                <View style={{
                  width: `${Count ? Math.min(100, (item.SubmittedCount / Count) * 100) : 0}%`, height: 10, backgroundColor: '#eb4557',
                  borderRadius: 5,
                }} />
              </View>
            </View>
          </Card.Content>
        </TouchableOpacity>
      </Link>
    </Card>
  );

  const searchFilter = (item: { name: string }) => item.name.toLowerCase().includes(searchQuery.toLowerCase());
  const inClass = data.children.filter((c) => (c.class_label ?? '') === label);
  const others = data.children.filter((c) => (c.class_label ?? '') !== label);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>{label || t('teacher.noClass')}</Text>
      <Text style={styles.title}>{t('ds.assignments')}</Text>
      <TextInput style={styles.searchInput} placeholder={t('teacher.search')} value={searchQuery} onChangeText={setSearchQuery}
        placeholderTextColor="grey" />
      {assignments.length === 0 && <Text style={styles.muted}>{t('teacher.noRounds')}</Text>}
      {assignments.filter(searchFilter).map(renderAssignmentCard)}

      <Text style={styles.title}>{t('ds.createAssignment')}</Text>
      <TextInput style={styles.searchInput} placeholder={t('ds.assignmentName')} placeholderTextColor="grey" value={assignmentName}
        onChangeText={setAssignmentName} />
      <TextInput style={styles.searchInput} placeholder={t('ds.deadlinePlaceholder', { date: defaultDeadline() })}
        placeholderTextColor="grey" value={deadline} onChangeText={setDeadline} maxLength={10} />
      {!deadlineOk && <Text style={styles.warn}>{t('ds.deadlineFormat')}</Text>}
      <TouchableOpacity style={[styles.button, (!assignmentName.trim() || !deadlineOk) && { opacity: 0.4 }]}
        disabled={!assignmentName.trim() || !deadlineOk} onPress={handleNewAssignment}>
        <Text style={styles.buttonText}>{t('ds.createAssignment')}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { marginTop: 24 }]}>{t('ds.classChildren', { n: inClass.length })}</Text>
      {inClass.length === 0 && <Text style={styles.muted}>{t('ds.noChildrenInClass')}</Text>}
      {inClass.map((c) => (
        <Card key={c.id} style={{ marginVertical: 6, padding: 8 }}>
          <Text style={styles.childName}>{c.display_name} · {c.age_band}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Button mode="contained" compact onPress={() => router.push({ pathname: '/screen/[childId]', params: { childId: c.id } })}>
              {t('ds.screen')}
            </Button>
            <Button mode="outlined" compact onPress={() => router.push({ pathname: '/detailed/[childId]', params: { childId: c.id } })}>
              {t('ds.detailedTest')}
            </Button>
            <Button mode="text" compact onPress={() => { assignChild(c, ''); setData(load()); }}>{t('ds.removeFromClass')}</Button>
          </View>
        </Card>
      ))}
      {label !== '' && others.length > 0 && (
        <>
          <Button mode="text" onPress={() => setShowAll(!showAll)}>{t(showAll ? 'ds.hideAddChildren' : 'ds.addChildrenToClass')}</Button>
          {showAll && others.map((c) => (
            <Check key={c.id} label={`${c.display_name} · ${c.age_band}${c.class_label ? ` (${c.class_label})` : ''}`} value={false}
              onChange={() => { assignChild(c, label); setData(load()); }} />
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10, backgroundColor: 'white', flexGrow: 1 },
  heading: { fontSize: 18, fontWeight: 'bold', color: 'white', backgroundColor: DS.navy, textAlign: 'center', padding: 8, borderRadius: 10, marginBottom: 10 },
  title: { fontSize: 25, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#eb4557' },
  muted: { textAlign: 'center', color: 'grey', marginBottom: 10 },
  warn: { color: '#B23C00', marginBottom: 8 },
  searchInput: { height: 44, borderWidth: 1, borderRadius: 5, borderColor: DS.navy, marginBottom: 15, paddingHorizontal: 10, color: 'black' },
  card: { marginBottom: 10, paddingVertical: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardDate: {},
  cardField: { marginTop: 5 },
  progressBarContainer: { marginTop: 5 },
  progressBar: { backgroundColor: 'lightgrey', borderRadius: 5, marginTop: 5 },
  button: { backgroundColor: '#EB455F', borderRadius: 5, padding: 10, marginTop: 10 },
  buttonText: { textAlign: 'center', fontWeight: 'bold', color: 'white' },
  childName: { fontSize: 17, fontWeight: 'bold', color: DS.navy, marginBottom: 6 },
});

export default AssignmentList;
