// Teacher profile page: header banner with illustrations, avatar, "Welcome <name>, <institute>", date box, Create
// Classroom, the "Classrooms" bar and the classroom list. Copied from DhwaniSarathi
// audiometer/app/Screens/Educator/EducatorHome.js (Apache-2.0, the DhwaniSarathi team), with its background.png and
// profile.png. Changed by us: name from the demo login and institute = the school picked in Settings, instead of
// /educators/<EID>; react-native-virtualized-view → ScrollView; the unused classroom form state removed; texts via
// useT().
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { db } from '@/db';
import { kvGet } from '@/db/store';
import { useT } from '@/i18n';
import { DS } from '@/original/paper';
import ClassroomList from '@/teacher/ClassroomList';

export default function EducatorHome() {
  const t = useT();
  const profile = { EducatorName: kvGet(db, 'teacher_name'), InstituteName: kvGet(db, 'school_name') };

  // Function to get the current date
  const [currentDate] = useState(() => {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1; // Month is zero-indexed
    return `${day < 10 ? '0' + day : day}-${month < 10 ? '0' + month : month}-${date.getFullYear()}`;
  });

  return (
    <ScrollView style={styles.container2}>
      <View style={styles.header}>
        <View style={[styles.content, { backgroundColor: DS.red }]}>
          <Text style={[styles.text, styles.heading, { color: 'white', padding: 2 }]}>{t('ds.teacherProfile')}</Text>
        </View>
        <ImageBackground source={require('@/assets/images/original/background.png')} style={styles.backgroundImage}>
          <View style={styles.headerContent}>
            <Image style={styles.avatar} source={require('@/assets/images/original/profile.png')} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{t('teacher.welcome')}</Text>
              <Text style={styles.userInfo}>{profile.EducatorName}</Text>
              <Text style={styles.userInfo}>{profile.InstituteName || t('children.pickSchool')}</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.body}>
        <Pressable style={[styles.RectangleShapeView, { marginTop: 20, marginBottom: 10 }]}>
          <Text style={styles.headtText}>{t('teacher.date', { date: currentDate })}</Text>
        </Pressable>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/teacher/create')}>
          <Text style={styles.btnText}>{t('ds.createClassroom')}</Text>
        </TouchableOpacity>
        <View style={styles.bar}>
          <Text style={styles.barText}>{t('teacher.classrooms')}</Text>
        </View>
        {kvGet(db, 'school_id') ? <ClassroomList /> : <Text style={styles.text}>{t('children.pickSchool')}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: DS.navy, justifyContent: 'center' },
  headerContent: { padding: 24, alignItems: 'center', flexDirection: 'row', gap: 16, marginTop: 10 },
  avatar: { width: 100, height: 100, borderRadius: 63, borderWidth: 2, borderColor: 'white', marginBottom: 10 },
  name: { fontSize: 22, color: DS.sky, fontWeight: 'bold' },
  headtText: { color: 'grey', fontWeight: 'bold', marginTop: 10, alignSelf: 'center', fontSize: 16, padding: 2 },
  userInfo: { fontSize: 20, color: 'white', fontWeight: 'bold', textShadowColor: DS.navy, textShadowRadius: 4 },
  btn: { backgroundColor: DS.red, borderRadius: 10, width: '80%', borderColor: DS.sky, borderWidth: 1, padding: 10, marginTop: 5 },
  btnText: { color: 'white', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  bar: { width: '90%', backgroundColor: DS.navy, minHeight: 50, justifyContent: 'center', marginTop: 12, borderWidth: 1, borderRadius: 30 },
  barText: { textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: 20 },
  body: { backgroundColor: 'white', flex: 1, alignItems: 'center', paddingBottom: 24 },
  RectangleShapeView: {
    width: '60%', backgroundColor: 'white', borderRadius: 10, borderColor: 'black', borderWidth: 1, elevation: 3, padding: 10,
    paddingTop: 1,
  },
  backgroundImage: { height: 200, width: '100%' },
  content: { justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: 'black', margin: 10 },
  heading: { fontWeight: 'bold', marginTop: 10 },
  container2: { flex: 1, backgroundColor: 'white' },
});
