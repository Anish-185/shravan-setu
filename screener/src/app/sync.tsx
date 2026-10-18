// Teacher taps Sync when online. Safe to retry; each queued record shows its own status.
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { db } from '@/db';
import { kvGet, outbox } from '@/db/store';
import { syncNow } from '@/db/sync';
import { useT } from '@/i18n';
import { Btn, P, s } from '@/ui';

export default function Sync() {
  const t = useT();
  const [rows, setRows] = useState(() => outbox(db));
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function run() {
    const baseUrl = kvGet(db, 'server_url');
    const school = kvGet(db, 'school_id');
    const token = await SecureStore.getItemAsync('api_token');
    if (!baseUrl || !school || !token) return setMsg(t('sync.setup'));
    setBusy(true);
    setMsg(t('sync.busy'));
    try {
      const r = await syncNow(db, { baseUrl, token, school });
      setMsg(t('sync.done', { pushed: r.pushed, failed: r.failed, pulled: r.pulled }));
    } catch (e) {
      setMsg(t('sync.failed', { error: String(e) }));
    } finally {
      setBusy(false);
      setRows(outbox(db));
    }
  }

  const pending = rows.filter((r) => r.status !== 'synced').length;
  return (
    <View style={[s.screen, { flex: 1 }]}>
      <P>{t('sync.pending', { n: pending })}</P>
      <Btn title={t(busy ? 'sync.busy' : 'sync.now')} onPress={run} disabled={busy} />
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
