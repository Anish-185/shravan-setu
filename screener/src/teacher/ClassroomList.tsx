// Searchable classroom cards. Adapted from DhwaniSarathi audiometer/app/Components/ClassroomList.js (Apache-2.0, the
// DhwaniSarathi team). Changed by us: classrooms come from this phone's children grouped by class label (strength =
// number of children) instead of /educators/<EID>/classrooms/; cards link to /teacher/class; FlatList → map (the list
// sits inside the screen's ScrollView); our design system.
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useT } from '@/i18n';
import { Icon } from '@/icons';
import { classrooms as loadClassrooms } from '@/teacher/data';
import { C, Card, F, s, Tile } from '@/ui';

const ClassroomList = () => {
  const t = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [classrooms, setClassrooms] = useState(loadClassrooms);
  // Back from adding children: the classes and their strength may have changed.
  useFocusEffect(useCallback(() => setClassrooms(loadClassrooms()), []));

  const name = (label: string) => label || t('teacher.noClass');

  const renderClassroomCard = (item: { label: string; count: number }) => (
    <Card key={item.label} style={{ padding: 0 }}>
      <Link href={{ pathname: '/teacher/class', params: { label: item.label } }} asChild>
        <Pressable style={st.card}>
          <Tile name="users" tint={C.marigoldTint} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={st.cardTitle}>{name(item.label)}</Text>
            <Text style={s.muted}>{t('teacher.strength', { n: item.count })}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={C.dusk} />
        </Pressable>
      </Link>
    </Card>
  );

  const searchFilter = (item: { label: string }) => name(item.label).toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <View style={{ gap: 12 }}>
      <TextInput style={s.input} placeholder={t('teacher.search')} value={searchQuery} onChangeText={setSearchQuery} />
      {classrooms.length === 0 && <Text style={s.muted}>{t('teacher.noClassrooms')}</Text>}
      {classrooms.filter(searchFilter).map(renderClassroomCard)}
    </View>
  );
};

const st = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 64 },
  cardTitle: { color: C.night, fontFamily: F.uiBold, fontSize: 18, lineHeight: 30 },
});

export default ClassroomList;
