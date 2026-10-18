// One-time phone setup: backend URL, teacher login (token kept in expo-secure-store), school, standard device.
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';

import { db } from '@/db';
import { kvGet, kvSet } from '@/db/store';
import { Btn, H, P, s } from '@/ui';

export default function Settings() {
  const [url, setUrl] = useState(() => kvGet(db, 'server_url') ?? 'http://192.168.1.10:8000');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [school, setSchool] = useState(() => kvGet(db, 'school_name') ?? '');
  const [earphone, setEarphone] = useState(() => kvGet(db, 'earphone_model') ?? '');
  const [volume, setVolume] = useState(() => kvGet(db, 'volume_setting') ?? '');
  const [msg, setMsg] = useState('');

  const base = url.replace(/\/+$/, '');

  async function login() {
    setMsg('Connecting…');
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
      setMsg('Logged in. Pick your school.');
    } catch (e) {
      setMsg(String(e));
    }
  }

  function pickSchool(sc: { id: string; name: string }) {
    kvSet(db, 'school_id', sc.id);
    kvSet(db, 'school_name', sc.name);
    setSchool(sc.name);
    setSchools([]);
    setMsg(`School set: ${sc.name}.`); // replaces "Logged in. Pick your school."
  }

  function saveDevice() {
    kvSet(db, 'earphone_model', earphone.trim());
    kvSet(db, 'volume_setting', volume.trim());
    setMsg('Device settings saved.');
  }

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <H>Backend</H>
      <P>The laptop running the server, on the same Wi-Fi. Only needed for sync.</P>
      <TextInput style={s.input} value={url} onChangeText={setUrl} autoCapitalize="none" placeholder="http://laptop-ip:8000" />
      <TextInput style={s.input} value={user} onChangeText={setUser} autoCapitalize="none" placeholder="username" />
      <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="password" />
      <Btn title="Log in and load schools" onPress={login} disabled={!user || !password} />
      {schools.map((sc) => <Btn key={sc.id} kind="plain" title={sc.name} onPress={() => pickSchool(sc)} />)}
      <P>School: {school || 'not set'}</P>

      <H>Standard device</H>
      <P>Recorded with every test. Use the same wired earphones and the same media-volume setting every time.</P>
      <TextInput style={s.input} value={earphone} onChangeText={setEarphone} placeholder="Earphone model (wired)" />
      <TextInput style={s.input} value={volume} onChangeText={setVolume}
        placeholder='Media volume, e.g. "zero, then up 8 steps"' />
      <Btn title="Save device settings" onPress={saveDevice} disabled={!earphone.trim() || !volume.trim()} />
      {!!msg && <Text style={s.p}>{msg}</Text>}
    </ScrollView>
  );
}
