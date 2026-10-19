// Teacher taps Sync when online. Safe to retry; each queued record shows its own status.
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Arch, Muggu } from '@/art';

import { db } from '@/db';
import { kvGet, outbox } from '@/db/store';
import { syncNow } from '@/db/sync';
import { useT } from '@/i18n';
import { Btn, C, Card, F, s } from '@/ui';

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
    <FlatList
      contentContainerStyle={s.screen}
      data={rows}
      keyExtractor={(r) => String(r.seq)}
      ListHeaderComponent={(
        <View style={{ gap: 14 }}>
          <View style={{ alignItems: 'center', paddingTop: 6 }}>
            <Arch width={190} height={220} bg={C.lavender} source={require('../../assets/images/peeps/sync.png')}
              imgWidth={153} imgHeight={200} offset={-4}>
              <Muggu color={C.indigo} opacity={0.12} size={20} dot={1.8} />
            </Arch>
          </View>
          <Text style={st.count}>{pending}</Text>
          <Text style={[s.muted, { textAlign: 'center' }]}>{t('sync.pending', { n: pending })}</Text>
          <Btn icon="refresh-cw" title={t(busy ? 'sync.busy' : 'sync.now')} onPress={run} disabled={busy} />
          {!!msg && <Card><Text style={s.p}>{msg}</Text></Card>}
        </View>
      )}
      renderItem={({ item }) => (
        <Text style={[st.item, item.status === 'error' ? s.warn : item.status === 'synced' ? s.ok : s.muted]}>
          {item.type} {item.id.slice(0, 8)}: {item.status}{item.error ? ` (${item.error})` : ''}
        </Text>
      )}
    />
  );
}

const st = StyleSheet.create({
  count: { color: C.night, fontFamily: F.title, fontSize: 54, lineHeight: 70, textAlign: 'center', marginBottom: -12 },
  item: { fontSize: 14, lineHeight: 24 },
});
