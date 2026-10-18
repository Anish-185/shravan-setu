// One-time phone setup: backend URL, teacher login (token kept in expo-secure-store), school, standard device.
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';

import { db } from '@/db';
import { kvGet, kvSet } from '@/db/store';
import { saveFacilities } from '@/cases';
import { useT } from '@/i18n';
import { Btn, H, P, s } from '@/ui';

type School = { id: string; name: string; mandal: string };

export default function Settings() {
  const t = useT();
  const [url, setUrl] = useState(() => kvGet(db, 'server_url') ?? 'http://192.168.1.10:8000');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [school, setSchool] = useState(() => kvGet(db, 'school_name') ?? '');
  const [earphone, setEarphone] = useState(() => kvGet(db, 'earphone_model') ?? '');
  const [volume, setVolume] = useState(() => kvGet(db, 'volume_setting') ?? '');
  const [msg, setMsg] = useState('');

  const base = url.replace(/\/+$/, '');

  async function login() {
    setMsg(t('settings.connecting'));
    try {
      const r = await fetch(`${base}/api/token/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password }),
      });
      if (!r.ok) throw new Error(`login failed (HTTP ${r.status})`);
      const { token } = await r.json();
      await SecureStore.setItemAsync('api_token', token);
      kvSet(db, 'server_url', base);
      setPassword('');
      const sr = await fetch(`${base}/api/schools/`, { headers: { Authorization: `Token ${token}` } });
      if (!sr.ok) throw new Error(`could not load schools (HTTP ${sr.status})`);
      setSchools(await sr.json());
      // Facilities for triage routing (from the server's local CSV; no maps). Kept on the phone for offline use.
      const fr = await fetch(`${base}/api/facilities/`, { headers: { Authorization: `Token ${token}` } });
      if (!fr.ok) throw new Error(`could not load facilities (HTTP ${fr.status})`);
      saveFacilities(db, await fr.json());
      setMsg(t('settings.loggedIn'));
    } catch (e) {
      setMsg(String(e));
    }
  }

  function pickSchool(sc: School) {
    kvSet(db, 'school_id', sc.id);
    kvSet(db, 'school_name', sc.name);
    kvSet(db, 'school_mandal', sc.mandal ?? ''); // "nearest" facility = same mandal
    setSchool(sc.name);
    setSchools([]);
    setMsg(t('settings.schoolSet', { name: sc.name })); // replaces "Logged in. Pick your school."
  }

  function saveDevice() {
    kvSet(db, 'earphone_model', earphone.trim());
    kvSet(db, 'volume_setting', volume.trim());
    setMsg(t('settings.deviceSaved'));
  }

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <H>{t('settings.backendH')}</H>
      <P>{t('settings.backendP')}</P>
      <TextInput style={s.input} value={url} onChangeText={setUrl} autoCapitalize="none" placeholder="http://laptop-ip:8000" />
      <TextInput style={s.input} value={user} onChangeText={setUser} autoCapitalize="none" placeholder={t('settings.username')} />
      <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholder={t('settings.password')} />
      <Btn title={t('settings.login')} onPress={login} disabled={!user || !password} />
      {schools.map((sc) => <Btn key={sc.id} kind="plain" title={sc.name} onPress={() => pickSchool(sc)} />)}
      <P>{t('settings.school', { name: school || t('common.notSet') })}</P>

      <H>{t('settings.deviceH')}</H>
      <P>{t('settings.deviceP')}</P>
      <TextInput style={s.input} value={earphone} onChangeText={setEarphone} placeholder={t('settings.earphone')} />
      <TextInput style={s.input} value={volume} onChangeText={setVolume}
        placeholder={t('settings.volume')} />
      <Btn title={t('settings.saveDevice')} onPress={saveDevice} disabled={!earphone.trim() || !volume.trim()} />
      {!!msg && <Text style={s.p}>{msg}</Text>}
    </ScrollView>
  );
}
