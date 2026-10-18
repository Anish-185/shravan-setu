// Local child list. Pseudonymous names only ("Student A1"); no real child data in demos.
import * as Crypto from 'expo-crypto';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput } from 'react-native';

import { db } from '@/db';
import { kvGet, list, put } from '@/db/store';
import { useT } from '@/i18n';
import { Btn, Chips, H, P, s } from '@/ui';

const AGE_BANDS = ['6-8', '9-11', '12-14', '15-18'] as const;
type Child = { display_name: string; age_band: string; school: string };

export default function Children() {
  const t = useT();
  const school = kvGet(db, 'school_id');
  const [children, setChildren] = useState(() => list<Child>(db, 'child'));
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
      <H>{t('children.addH')}</H>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('children.namePlaceholder')} />
      <Chips options={AGE_BANDS} value={age} onChange={setAge} />
      <Btn title={t('children.add')} onPress={add} disabled={!school || !name.trim() || !age} />
      <H>{t('children.listH')}</H>
      {children.map((c) => (
        <Link key={c.id} href={{ pathname: '/screen/[childId]', params: { childId: c.id } }} style={{ fontSize: 18, paddingVertical: 8 }}>
          {t('children.row', { name: c.display_name, age: c.age_band })}
        </Link>
      ))}
    </ScrollView>
  );
}
