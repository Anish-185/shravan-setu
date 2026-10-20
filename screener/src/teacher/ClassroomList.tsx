// Searchable classroom cards with a red header and "Classroom Strength". Copied from DhwaniSarathi
// audiometer/app/Components/ClassroomList.js (Apache-2.0, the DhwaniSarathi team). Changed by us: classrooms come from
// this phone (created classrooms plus children's class labels, src/teacher/data.ts) instead of
// /educators/<EID>/classrooms/; cards link to /teacher/class; FlatList → map (the list sits inside the page's
// ScrollView); fixed card width 350 → full width; texts via useT().
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useT } from '@/i18n';
import { DS } from '@/original/paper';
import { classrooms as loadClassrooms } from '@/teacher/data';

const ClassroomList = () => {
  const t = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [classrooms, setClassrooms] = useState(loadClassrooms);
  // Back from creating a classroom or adding children: the list may have changed.
  useFocusEffect(useCallback(() => setClassrooms(loadClassrooms()), []));

  const name = (label: string) => label || t('teacher.noClass');

  const renderClassroomCard = (item: { label: string; count: number }) => (
    <Link key={item.label} href={{ pathname: '/teacher/class', params: { label: item.label } }} asChild>
      <Pressable style={[styles.card, { borderColor: DS.red, borderWidth: 1 }]}>
        <Text style={styles.cardTitle}>{name(item.label)}</Text>
        <Text style={styles.cardCode}>
          <Text style={{ color: DS.red }}>{t('ds.classroomStrengthLabel')}</Text>
          {item.count}
        </Text>
      </Pressable>
    </Link>
  );

  const searchFilter = (item: { label: string }) => name(item.label).toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <View style={styles.container}>
      <TextInput style={styles.searchInput} placeholder={t('teacher.search')} placeholderTextColor="black" value={searchQuery}
        onChangeText={setSearchQuery} />
      {classrooms.length === 0 && <Text style={{ textAlign: 'center', color: 'grey' }}>{t('teacher.noClassrooms')}</Text>}
      <View style={styles.listContainer}>{classrooms.filter(searchFilter).map(renderClassroomCard)}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', borderColor: 'white', borderWidth: 5, borderRadius: 10, width: '100%' },
  listContainer: { paddingHorizontal: 10 },
  searchInput: {
    height: 40, borderWidth: 1, borderRadius: 30, borderColor: DS.navy, paddingHorizontal: 10, marginHorizontal: 30, marginVertical: 10,
  },
  card: { marginBottom: 20, borderRadius: 10, overflow: 'hidden' },
  cardTitle: { fontSize: 24, fontWeight: 'bold', paddingVertical: 5, backgroundColor: DS.red, paddingHorizontal: 10, color: 'white' },
  cardCode: { fontSize: 18, paddingVertical: 5, color: 'black', paddingHorizontal: 10 },
});

export default ClassroomList;
