// Referral cases on this phone, filtered by status. Tick referred/rescheduled cases to put them in a camp request.
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { caseRows, casesCsv, type CampRec } from '@/cases';
import { db } from '@/db';
import { list } from '@/db/store';
import { useT } from '@/i18n';
import { TRANSITIONS } from '@/rules';
import { shareText } from '@/share';
import { Banner, Btn, Check, Chips, H, P, s } from '@/ui';

const STATUSES = ['all', ...Object.keys(TRANSITIONS)] as const;
const CAMPABLE = ['referred', 'rescheduled'];

export default function Cases() {
  const t = useT();
  const [rows, setRows] = useState(() => caseRows(db));
  const [camps, setCamps] = useState(() => list<CampRec>(db, 'camp_request'));
  const [filter, setFilter] = useState<string>('all');
  const [picked, setPicked] = useState<string[]>([]);
  // Back from a case or a camp request: statuses may have moved.
  useFocusEffect(useCallback(() => {
    setRows(caseRows(db));
    setCamps(list<CampRec>(db, 'camp_request'));
    setPicked([]);
  }, []));

  const shown = rows.filter((r) => filter === 'all' || r.status === filter);
  const label = (st: string) => (st === 'all' ? t('cases.all') : t(`status.${st}` as never));
  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Banner />
      <Chips options={STATUSES.filter((x) => x === 'all' || rows.some((r) => r.status === x))} value={filter}
        onChange={setFilter} label={label} />
      {shown.length === 0 && <P>{t('cases.empty')}</P>}
      {shown.some((r) => CAMPABLE.includes(r.status)) && <P>{t('cases.selectHint')}</P>}
      {shown.map((r) => (
        <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {CAMPABLE.includes(r.status) && (
            <Check label="" value={picked.includes(r.id)}
              onChange={(on) => setPicked(on ? [...picked, r.id] : picked.filter((x) => x !== r.id))} />
          )}
          <Link href={{ pathname: '/cases/[caseId]', params: { caseId: r.id } }} style={{ fontSize: 18, paddingVertical: 8, flex: 1 }}>
            {t('cases.row', { name: r.name, status: label(r.status), route: r.triage_route || '-' })}
          </Link>
        </View>
      ))}
      <Btn title={t('cases.createCamp', { n: picked.length })} disabled={!picked.length}
        onPress={() => router.push({ pathname: '/camp', params: { cases: picked.join(',') } })} />
      <Btn kind="plain" title={t('cases.shareCsv')} disabled={!shown.length}
        onPress={() => shareText('referral-cases.csv', casesCsv(db, shown))} />
      {camps.length > 0 && <H>{t('cases.camps')}</H>}
      {camps.map((c) => (
        <Link key={c.id} href={{ pathname: '/camp', params: { id: c.id } }} style={{ fontSize: 18, paddingVertical: 8 }}>
          {t('cases.campRow', { date: c.camp_date, n: c.cases.length })}
        </Link>
      ))}
    </ScrollView>
  );
}
