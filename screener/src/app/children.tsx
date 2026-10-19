// Local child list. Pseudonymous names only ("Student A1"); no real child data in demos. Tapping a name starts a new
// test; a child with a referral case also shows its status and a link to the case.
import * as Crypto from 'expo-crypto';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { CaseRec } from '@/cases';

import { db } from '@/db';
import { kvGet, list, put } from '@/db/store';
import { useT } from '@/i18n';
import { Icon } from '@/icons';
import { Btn, C, Card, Chips, F, H, P, s, StatusPill, Tile } from '@/ui';

const AGE_BANDS = ['6-8', '9-11', '12-14', '15-18'] as const;
type Child = { display_name: string; age_band: string; school: string };

export default function Children() {
  const t = useT();
  const school = kvGet(db, 'school_id');
  const [children, setChildren] = useState(() => list<Child>(db, 'child'));
  const [cases, setCases] = useState(latestCases);
  // Back from a test or a case: a new case or status may exist.
  useFocusEffect(useCallback(() => setCases(latestCases()), []));
  const [name, setName] = useState('');
  const [age, setAge] = useState<(typeof AGE_BANDS)[number] | null>(null);

  function add() {
    put(db, 'child', Crypto.randomUUID(), { school, display_name: name.trim(), age_band: age });
    setName('');
    setAge(null);
    setChildren(list<Child>(db, 'child'));
  }

  return (
    <ScrollView contentContainerStyle={s.screen}>
      {!school && <P>{t('children.pickSchool')}</P>}
      <Card>
        <H>{t('children.addH')}</H>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('children.namePlaceholder')} />
        <Chips options={AGE_BANDS} value={age} onChange={setAge} />
        <Btn icon="user-plus" title={t('children.add')} onPress={add} disabled={!school || !name.trim() || !age} />
      </Card>
      <H>{t('children.listH')}</H>
      {children.map((c) => (
        <Card key={c.id} style={{ padding: 0, gap: 0 }}>
          <Link href={{ pathname: '/screen/[childId]', params: { childId: c.id } }} asChild>
            <Pressable style={st.row}>
              <Tile name="ear" tint={C.marigoldTint} size={38} />
              <Text style={st.name}>{t('children.row', { name: c.display_name, age: c.age_band })}</Text>
              <Icon name="chevron-right" size={20} color={C.dusk} />
            </Pressable>
          </Link>
          {cases.has(c.id) && (
            <Link href={{ pathname: '/cases/[caseId]', params: { caseId: cases.get(c.id)!.id } }} asChild>
              <Pressable style={st.caseRow}
                accessibilityLabel={`${t('title.case')} · ${t('case.status', { status: t(`status.${cases.get(c.id)!.status}` as never) })}`}>
                <Text style={s.muted}>{t('title.case')}</Text>
                <StatusPill status={cases.get(c.id)!.status} text={t(`status.${cases.get(c.id)!.status}` as never)} />
                <View style={{ flex: 1 }} />
                <Icon name="chevron-right" size={18} color={C.dusk} />
              </Pressable>
            </Link>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

/** child id -> that child's most recently updated case (list() is newest first, so the first one seen wins). */
function latestCases() {
  const m = new Map<string, CaseRec & { id: string }>();
  for (const k of list<CaseRec>(db, 'case')) if (!m.has(k.child)) m.set(k.child, k);
  return m;
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 64 },
  name: { flex: 1, color: C.night, fontFamily: F.uiMed, fontSize: 17, lineHeight: 28 },
  caseRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingVertical: 10,
    minHeight: 48, borderTopWidth: 1, borderTopColor: C.lilac },
});
