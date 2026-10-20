// Teacher login, the first screen (demo, src/auth.tsx). Idea from DhwaniSarathi audiometer/app/Screens/Login.js
// (Apache-2.0, the DhwaniSarathi team): app name, a picture, then the sign-in card. Ours: our design, a teacher name and
// a PIN kept on this phone instead of Firebase; no student branch, sign-up or "Skip to home".
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Arch, Muggu, SetuLine } from '@/art';
import { useAuth } from '@/auth';
import { db } from '@/db';
import { kvGet } from '@/db/store';
import { useT } from '@/i18n';
import { Btn, C, Card, F, LangToggle, Note, s } from '@/ui';

export default function Login() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [name, setName] = useState(() => kvGet(db, 'teacher_name') ?? '');
  const [pin, setPin] = useState('');
  const [wrong, setWrong] = useState(false);
  const firstTime = kvGet(db, 'teacher_pin') === null;

  const signIn = () => {
    if (!login(name.trim(), pin)) return setWrong(true);
    setPin('');
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.night }} behavior="padding">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled">
        <Muggu color={C.marigold} opacity={0.12} />
        <View style={st.lang}><LangToggle onNight /></View>
        <View style={st.hero}>
          <Arch width={150} height={186} bg={C.indigo} border={C.marigold} source={require('../../assets/images/peeps/home-teacher.png')}
            imgWidth={128} imgHeight={172} offset={-6} />
          <Text style={st.name} accessibilityRole="header">Shravan Setu</Text>
          <Text style={st.sub}>{t('login.tagline')}</Text>
        </View>
        <SetuLine color={C.marigold} height={50} />
        <View style={{ paddingHorizontal: 20, marginTop: -6 }}>
          <Card style={{ gap: 12, padding: 20 }}>
            <Text style={s.h}>{t('title.teacherLogin')}</Text>
            <Text style={s.muted}>{t(firstTime ? 'login.firstTime' : 'teacher.demoNote')}</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('teacher.name')} autoComplete="name"
              accessibilityLabel={t('teacher.name')} />
            <TextInput style={s.input} value={pin} onChangeText={(p) => { setPin(p); setWrong(false); }} secureTextEntry
              keyboardType="number-pad" maxLength={8} placeholder={t('teacher.pin')} accessibilityLabel={t('teacher.pin')} />
            {wrong && <Note icon="triangle-alert" color={C.warnText} text={t('teacher.wrongPin')} />}
            <Btn icon="user-round" title={t('teacher.login')} onPress={signIn} disabled={!name.trim() || pin.length < 4} />
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  lang: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 18 },
  hero: { alignItems: 'center', gap: 4, paddingHorizontal: 24, paddingTop: 8 },
  name: { color: C.white, fontFamily: F.title, fontSize: 36, lineHeight: 52, marginTop: 10 },
  sub: { color: C.bandText, fontFamily: F.ui, fontSize: 16, lineHeight: 27, textAlign: 'center' },
});
