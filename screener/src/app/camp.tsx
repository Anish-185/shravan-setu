// Camp request: made on the phone from referred/rescheduled cases (offline), shared as CSV. The printable PDF is
// made by the laptop server after sync (GET /api/camp-requests/<id>/pdf/); the phone only downloads it.
import { File, Paths } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';

import { caseRows, casesCsv, createCamp, type CampRec, type Facility } from '@/cases';
import { cfg } from '@/config';
import { db } from '@/db';
import { get, kvGet, list } from '@/db/store';
import { useT } from '@/i18n';
import { shareText } from '@/share';
import { Btn, Card, Chips, H, P, s } from '@/ui';

const inAWeek = () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

export default function Camp() {
  const t = useT();
  const params = useLocalSearchParams<{ id?: string; cases?: string }>();
  const [id, setId] = useState(params.id ?? '');
  const [date, setDate] = useState(inAWeek);
  const facilities = list<Facility>(db, 'facility');
  const [facility, setFacility] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const camp = id ? get<CampRec>(db, 'camp_request', id) : null;
  const caseIds = camp?.cases ?? (params.cases ?? '').split(',').filter(Boolean);
  const rows = caseRows(db).filter((r) => caseIds.includes(r.id));

  function create() {
    const school = kvGet(db, 'school_id');
    if (!school) return setMsg(t('children.pickSchool'));
    try {
      setId(createCamp(db, cfg, school, caseIds, date, facility));
      setMsg(t('camp.created'));
    } catch (e) {
      setMsg(String(e).includes('bad date') ? t('camp.badDate') : String(e));
    }
  }

  async function pdf() {
    try {
      const base = kvGet(db, 'server_url');
      const token = await SecureStore.getItemAsync('api_token');
      if (!base || !token) throw new Error(t('sync.setup'));
      const file = await File.downloadFileAsync(`${base}/api/camp-requests/${id}/pdf/`,
        new File(Paths.cache, `camp-request-${id}.pdf`), { headers: { Authorization: `Token ${token}` }, idempotent: true });
      await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf' });
    } catch (e) {
      setMsg(t('camp.pdfFailed', { error: String(e) }));
    }
  }

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <H>{t('camp.h')}</H>
      <Card><P>{t('camp.cases', { n: rows.length, names: rows.map((r) => r.name).join(', ') })}</P></Card>
      {!camp ? (
        <>
          <TextInput style={s.input} value={date} onChangeText={setDate} placeholder={t('camp.date')} />
          <Text style={s.muted}>{t('camp.facility')}</Text>
          <Chips options={facilities.map((f) => f.id)} value={facility} onChange={setFacility}
            label={(fid) => facilities.find((f) => f.id === fid)?.name ?? fid} />
          <Btn icon="tent" title={t('camp.create')} onPress={create} disabled={!rows.length} />
        </>
      ) : (
        <>
          <P>{camp.camp_date}{camp.facility ? ` · ${get<Facility>(db, 'facility', camp.facility)?.name ?? ''}` : ''}</P>
          <Btn kind="plain" icon="share-2" title={t('camp.shareCsv')} onPress={() => shareText(`camp-request-${id}.csv`, casesCsv(db, rows))} />
          <Btn kind="plain" icon="file-down" title={t('camp.pdf')} onPress={pdf} />
          <Btn title={t('result.done')} onPress={() => router.back()} />
        </>
      )}
      {!!msg && <Text style={s.p}>{msg}</Text>}
    </ScrollView>
  );
}
