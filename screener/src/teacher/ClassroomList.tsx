// Searchable classroom list for the teacher's home. Idea from DhwaniSarathi audiometer/app/Components/ClassroomList.js
// (Apache-2.0, the DhwaniSarathi team): a search box and one card per classroom with its name and "Classroom
// Strength". Ours: classrooms from this phone (src/teacher/data.ts); each card is a ticket with a muggu cover, the
// children on this phone and the latest round's progress; tap opens the classroom.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useT } from '@/i18n';
import { Icon } from '@/icons';
import { Cover } from '@/illustrations';
import { assignments, classChildren, classrooms, roundResults } from '@/teacher/data';
import { Bar, C, F, s } from '@/ui';

function load() {
  return classrooms().map((c) => {
    const rounds = assignments(c.label);
    const last = rounds.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    return { ...c, kids: classChildren(c.label).length, last: last ? { name: last.name, done: roundResults(last).length } : null };
  });
}

export default function ClassroomList() {
  const t = useT();
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(load);
  // Back from creating a classroom, adding children or a test: counts may have moved.
  useFocusEffect(useCallback(() => setRows(load()), []));
  const name = (label: string) => label || t('teacher.noClass');
  const shown = rows.filter((r) => name(r.label).toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <View style={{ gap: 12 }}>
      {rows.length > 3 && (
        <View style={st.search}>
          <Icon name="search" size={20} color={C.dusk} />
          <TextInput style={st.searchInput} placeholder={t('teacher.search')} placeholderTextColor={C.dusk} value={query}
            onChangeText={setQuery} accessibilityLabel={t('teacher.search')} />
        </View>
      )}
      {rows.length === 0 && <Text style={s.muted}>{t('teacher.noClassrooms')}</Text>}
      {shown.map((r) => (
        <Pressable key={r.label} accessibilityRole="button" accessibilityLabel={`${name(r.label)}, ${t('ds.classStrength', { n: r.count })}`}
          onPress={() => router.push({ pathname: '/teacher/class', params: { label: r.label } })}
          style={({ pressed }) => [st.ticket, pressed && s.pressed]}>
          <Cover seed={r.label || '-'} height={58}>
            <Text style={st.title} numberOfLines={1}>{name(r.label)}</Text>
          </Cover>
          <View style={st.body}>
            <View style={st.line}>
              <Icon name="users" size={18} color={C.dusk} />
              <Text style={st.meta}>{t('home.classLine', { strength: r.count, kids: r.kids })}</Text>
              <Icon name="chevron-right" size={18} color={C.dusk} />
            </View>
            {r.last && (
              <View style={{ gap: 6 }}>
                <Text style={st.meta}>{t('home.lastRound', { name: r.last.name, done: r.last.done, total: r.count })}</Text>
                <Bar value={r.count ? r.last.done / r.count : 0} />
              </View>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.lilac,
    borderRadius: 999, paddingHorizontal: 16, minHeight: 50 },
  searchInput: { flex: 1, color: C.night, fontFamily: F.ui, fontSize: 16, minHeight: 48 },
  ticket: { backgroundColor: C.white, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.lilac },
  title: { color: C.white, fontFamily: F.title, fontSize: 24, lineHeight: 38 },
  body: { padding: 14, gap: 10 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { flex: 1, color: C.night, fontFamily: F.ui, fontSize: 15, lineHeight: 25 },
});
