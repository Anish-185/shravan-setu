// Teacher demo login. Adapted from DhwaniSarathi audiometer/app/Screens/Login.js (Apache-2.0, the DhwaniSarathi team).
// Changed by us: Firebase sign-in and the /logininfos/ fetch replaced by a demo login (any teacher name + a PIN kept on
// this phone; the first login sets it); student branch, "Skip To Home" and the sign-up card removed;
// react-native-paper replaced by our design system; i18next replaced by useT().
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';

import { db } from '@/db';
import { kvGet, kvSet } from '@/db/store';
import { useT } from '@/i18n';
import { Btn, C, Card, H, Note, s } from '@/ui';

const Login = () => {
  const t = useT();
  const [username, setUsername] = useState(() => kvGet(db, 'teacher_name') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const signIn = () => {
    // Demo only, not authentication: the PIN is stored as typed, on this phone.
    const pin = kvGet(db, 'teacher_pin');
    if (pin !== null && pin !== password) return setError(true);
    if (pin === null) kvSet(db, 'teacher_pin', password);
    kvSet(db, 'teacher_name', username.trim());
    setPassword('');
    router.replace('/teacher');
  };

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Card>
        <H>{t('title.teacherLogin')}</H>
        <Text style={s.muted}>{t('teacher.demoNote')}</Text>
        <TextInput style={s.input} value={username} onChangeText={setUsername} placeholder={t('teacher.name')} />
        <TextInput style={s.input} value={password} onChangeText={(p) => { setPassword(p); setError(false); }}
          secureTextEntry keyboardType="number-pad" maxLength={8} placeholder={t('teacher.pin')} />
        {error && <Note icon="triangle-alert" color={C.warnText} text={t('teacher.wrongPin')} />}
        <Btn icon="user-round" title={t('teacher.login')} onPress={signIn} disabled={!username.trim() || !password} />
      </Card>
    </ScrollView>
  );
};

export default Login;
