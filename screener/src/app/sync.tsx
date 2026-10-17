// Teacher taps Sync when online. Safe to retry; each queued record shows its own status.
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { db } from '@/db';
import { kvGet, outbox } from '@/db/store';
import { syncNow } from '@/db/sync';
import { Btn, P, s } from '@/ui';

export default function Sync() {
  const [rows, setRows] = useState(() => outbox(db));
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function run() {
    const baseUrl = kvGet(db, 'server_url');
    const school = kvGet(db, 'school_id');
    const token = await SecureStore.getItemAsync('api_token');
    if (!baseUrl || !school || !token) return setMsg('Set up the backend and school in Settings first.');
    setBusy(true);
    setMsg('Syncing…');
    try {
      const r = await syncNow(db, { baseUrl, token, school });
      setMsg(`Sent ${r.pushed}, failed ${r.failed}, case updates received ${r.pulled}.`);
    } catch (e) {
      setMsg(`${String(e)}. Nothing was lost; try again when connected.`);
    } finally {
      setBusy(false);
      setRows(outbox(db));
    }
  }

  const pending = rows.filter((r) => r.status !== 'synced').length;
  return (
    <View style={[s.screen, { flex: 1 }]}>
      <P>{pending} record(s) waiting to sync.</P>
      <Btn title={busy ? 'Syncing…' : 'Sync now'} onPress={run} disabled={busy} />
      {!!msg && <P>{msg}</P>}
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.seq)}
        renderItem={({ item }) => (
          <Text style={item.status === 'error' ? s.warn : item.status === 'synced' ? s.ok : undefined}>
            {item.type} {item.id.slice(0, 8)}: {item.status}{item.error ? ` (${item.error})` : ''}
          </Text>
        )}
      />
    </View>
  );
}
