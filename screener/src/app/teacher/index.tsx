// Teacher home: welcome band, today's date and the classrooms. Adapted from DhwaniSarathi
// audiometer/app/Screens/Educator/EducatorHome.js (Apache-2.0, the DhwaniSarathi team). Changed by us: teacher name
// from the demo login and institute = the school picked in Settings, instead of /educators/<EID>; header images →
// our Night band and icon tile; "Create Classroom" → "Add children" (classrooms come from class labels);
// react-native-virtualized-view → ScrollView; our design system.
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { db } from '@/db';
import { kvGet } from '@/db/store';
import { useT } from '@/i18n';
import ClassroomList from '@/teacher/ClassroomList';
import { Btn, C, F, H, P, s, Tile } from '@/ui';

export default function EducatorHome() {
  const t = useT();
  const profile = { EducatorName: kvGet(db, 'teacher_name'), InstituteName: kvGet(db, 'school_name') };

  // The current date, DD-MM-YYYY
  const [currentDate] = useState(() => {
    const date = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  });

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <View style={st.header}>
        <Tile name="user-round" tint={C.marigold} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={st.name}>{t('teacher.welcome')}</Text>
          <Text style={st.userInfo}>{profile.EducatorName}</Text>
          <Text style={st.institute}>{profile.InstituteName || t('children.pickSchool')}</Text>
        </View>
      </View>

      <Text style={s.muted}>{t('teacher.date', { date: currentDate })}</Text>
      <Btn kind="plain" icon="user-plus" title={t('teacher.addChildren')} onPress={() => router.push('/children')} />

      <H>{t('teacher.classrooms')}</H>
      {kvGet(db, 'school_id') ? <ClassroomList /> : <P>{t('children.pickSchool')}</P>}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.night, borderRadius: 22, padding: 18 },
  name: { color: C.bandText, fontFamily: F.title, fontSize: 18, lineHeight: 30 },
  userInfo: { color: C.white, fontFamily: F.uiBold, fontSize: 22, lineHeight: 34 },
  institute: { color: C.white, fontFamily: F.ui, fontSize: 16, lineHeight: 27 },
});
