// Referral cases on this phone, filtered by status. Tick referred/rescheduled cases to put them in a camp request.
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Arch } from '@/art';

import { caseRows, casesCsv, type CampRec } from '@/cases';
import { db } from '@/db';
import { list } from '@/db/store';
import { useT } from '@/i18n';
import { TRANSITIONS } from '@/rules';
import { shareText } from '@/share';
import { Icon } from '@/icons';
import { Btn, C, Card, Check, Chips, F, H, Pill, s, StatusPill } from '@/ui';
import { Banner } from '@/original/Banner';

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
      <Banner title={t('title.cases')} text={t('ds.bannerCases', { n: rows.length })} />
      <Chips options={STATUSES.filter((x) => x === 'all' || rows.some((r) => r.status === x))} value={filter}
        onChange={setFilter} label={label} />
      {shown.length === 0 && (
        <View style={st.empty}>
          <Arch width={170} height={200} bg={C.indigoTint} source={require('../../../assets/images/peeps/empty.png')}
            imgWidth={129} imgHeight={190} offset={-4} />
          <Text style={[s.muted, { textAlign: 'center' }]}>{t('cases.empty')}</Text>
        </View>
      )}
      {shown.some((r) => CAMPABLE.includes(r.status)) && <Text style={s.muted}>{t('cases.selectHint')}</Text>}
      {shown.map((r) => (
        <Card key={r.id} style={st.row}>
          {CAMPABLE.includes(r.status) && (
            <Check label="" value={picked.includes(r.id)}
              onChange={(on) => setPicked(on ? [...picked, r.id] : picked.filter((x) => x !== r.id))} />
          )}
          <Link href={{ pathname: '/cases/[caseId]', params: { caseId: r.id } }} asChild>
            <Pressable accessibilityLabel={t('cases.row', { name: r.name, status: label(r.status), route: r.triage_route || '-' })}
              style={{ flex: 1, gap: 8 }}>
              <View style={st.nameRow}>
                <Text style={st.name}>{r.name}</Text>
                <Icon name="chevron-right" size={18} color={C.dusk} />
              </View>
              <View style={st.pills}>
                <StatusPill status={r.status} text={label(r.status)} />
                {!!r.triage_route && <Pill icon="hospital" text={r.triage_route} tint={C.routeTint} color={C.dusk} />}
              </View>
            </Pressable>
          </Link>
        </Card>
      ))}
      <Btn icon="tent" title={t('cases.createCamp', { n: picked.length })} disabled={!picked.length}
        onPress={() => router.push({ pathname: '/camp', params: { cases: picked.join(',') } })} />
      <Btn kind="plain" icon="share-2" title={t('cases.shareCsv')} disabled={!shown.length}
        onPress={() => shareText('referral-cases.csv', casesCsv(db, shown))} />
      {camps.length > 0 && <H>{t('cases.camps')}</H>}
      {camps.map((c) => (
        <Link key={c.id} href={{ pathname: '/camp', params: { id: c.id } }} asChild>
          <Pressable style={st.camp}>
            <Icon name="tent" size={20} color={C.dusk} />
            <Text style={[s.p, { flex: 1 }]}>{t('cases.campRow', { date: c.camp_date, n: c.cases.length })}</Text>
            <Icon name="chevron-right" size={18} color={C.dusk} />
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  empty: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, color: C.night, fontFamily: F.uiBold, fontSize: 17, lineHeight: 28 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  camp: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderBottomWidth: 1, borderBottomColor: C.lilac },
});
