// Create Classroom (name + strength). Copied from DhwaniSarathi audiometer/app/Screens/Educator/EducatorCreate.js
// (Apache-2.0, the DhwaniSarathi team), with its header banner. Changed by us: the classroom is saved on this phone
// instead of POST /classrooms/; strength must be a whole number; back to the teacher page instead of pushing a new
// copy of it; the two alerts → one; texts via useT().
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useT } from '@/i18n';
import { DS } from '@/original/paper';
import { addClassroom } from '@/teacher/data';

export default function EducatorCreate() {
  const t = useT();
  const [classroomName, onChangeName] = useState('');
  const [classroomStrength, onChangeStrength] = useState('');
  const strength = Number(classroomStrength);
  const valid = !!classroomName.trim() && Number.isInteger(strength) && strength > 0;

  const handleCreateClassroom = () => {
    addClassroom(classroomName.trim(), strength);
    Alert.alert(t('ds.classroomCreated'));
    router.back();
  };

  return (
    <ScrollView style={styles.container2} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={[styles.content, { backgroundColor: DS.red }]}>
          <Text style={[styles.text, styles.heading, { color: 'white', padding: 2 }]}>{t('ds.teacherProfile')}</Text>
        </View>
        <ImageBackground source={require('@/assets/images/original/background.png')} style={styles.backgroundImage}>
          <View style={styles.headerContent}>
            <Image style={styles.avatar} source={require('@/assets/images/original/profile.png')} />
            <Text style={styles.name}>{t('teacher.welcome')}</Text>
          </View>
        </ImageBackground>
      </View>
      <View style={styles.body}>
        <View style={styles.form}>
          <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 20, marginBottom: 13 }}>{t('ds.createClassroom')}</Text>
          <TextInput style={styles.input} placeholder={t('ds.classroomName')} onChangeText={onChangeName} value={classroomName}
            maxLength={20} />
          <TextInput style={styles.input} placeholder={t('ds.classroomStrength')} onChangeText={onChangeStrength}
            value={classroomStrength} keyboardType="number-pad" maxLength={3} />
          <TouchableOpacity style={[styles.btn, !valid && { opacity: 0.4 }]} disabled={!valid} onPress={handleCreateClassroom}>
            <Text style={styles.btnText}>{t('ds.createClassroom')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: DS.navy, justifyContent: 'center' },
  headerContent: { padding: 24, alignItems: 'center', flexDirection: 'row', gap: 16, marginTop: 10 },
  avatar: { width: 100, height: 100, borderRadius: 63, borderWidth: 2, borderColor: 'white', marginBottom: 10 },
  name: { fontSize: 22, color: DS.sky, fontWeight: 'bold' },
  btn: { backgroundColor: DS.red, borderRadius: 10, width: '80%', borderColor: DS.sky, borderWidth: 1, padding: 10, marginTop: 5 },
  btnText: { color: 'white', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  body: { backgroundColor: 'white', flex: 1, alignItems: 'center' },
  form: {
    width: '90%', flexDirection: 'column', alignItems: 'center', borderWidth: 1, padding: 5, paddingVertical: 15, borderRadius: 10,
    marginVertical: 10,
  },
  backgroundImage: { height: 200, width: '100%' },
  content: { justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: 'black', margin: 10 },
  heading: { fontWeight: 'bold', marginTop: 10 },
  container2: { flex: 1, backgroundColor: 'white' },
  input: { borderWidth: 1, padding: 10, marginVertical: 3, width: '80%', borderRadius: 10, borderColor: 'grey', color: 'black', textAlign: 'center' },
});
