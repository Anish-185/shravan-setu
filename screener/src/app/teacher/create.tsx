// Create Classroom (name + strength). Idea from DhwaniSarathi audiometer/app/Screens/Educator/EducatorCreate.js
// (Apache-2.0, the DhwaniSarathi team). Ours: our design with a live preview of the classroom's cover; saved on this
// phone instead of POST /classrooms/; strength must be a whole number; back to Home afterwards. With no school set yet,
// the school name is asked here too (pre-filled for demos), so a new teacher is never sent to Settings first.
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { db } from '@/db';
import { kvGet } from '@/db/store';
import { useT } from '@/i18n';
import { Cover } from '@/illustrations';
import { DEMO_SCHOOL, SchoolInput, typeSchool } from '@/school';
import { addClassroom } from '@/teacher/data';
import { Btn, C, Card, F, s } from '@/ui';

export default function CreateClassroom() {
  const t = useT();
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [school, setSchool] = useState(() => (kvGet(db, 'school_id') ? null : DEMO_SCHOOL)); // null: already set
  const n = Number(strength);
  const valid = !!name.trim() && Number.isInteger(n) && n > 0 && school?.trim() !== '';

  return (
    <ScrollView contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled">
      <View style={st.preview} accessible accessibilityLabel={t('create.preview')}>
        <Cover seed={name.trim() || '-'} height={76}>
          <Text style={st.title} numberOfLines={1}>{name.trim() || t('ds.classroomName')}</Text>
        </Cover>
        <Text style={st.meta}>{t('ds.classStrength', { n: valid ? n : '-' })}</Text>
      </View>
      <Card>
        {school !== null && <SchoolInput value={school} onChange={setSchool} />}
        <Text style={st.label}>{t('ds.classroomName')}</Text>
        <TextInput style={s.input} placeholder={t('create.namePlaceholder')} placeholderTextColor={C.dusk} onChangeText={setName}
          value={name} maxLength={20} accessibilityLabel={t('ds.classroomName')} />
        <Text style={st.label}>{t('ds.classroomStrength')}</Text>
        <TextInput style={s.input} placeholder="30" placeholderTextColor={C.dusk} onChangeText={setStrength} value={strength}
          keyboardType="number-pad" maxLength={3} accessibilityLabel={t('ds.classroomStrength')} />
        <Btn icon="plus" title={t('ds.createClassroom')} disabled={!valid} onPress={() => {
          if (school !== null) typeSchool(db, school.trim());
          addClassroom(name.trim(), n);
          router.back();
        }} />
      </Card>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  preview: { backgroundColor: C.white, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.lilac },
  title: { color: C.white, fontFamily: F.title, fontSize: 26, lineHeight: 40 },
  meta: { color: C.dusk, fontFamily: F.ui, fontSize: 15, lineHeight: 25, padding: 14 },
  label: { color: C.night, fontFamily: F.uiBold, fontSize: 15, lineHeight: 25 },
});
