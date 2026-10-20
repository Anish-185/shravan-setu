// Children on this phone. Pseudonymous names only ("Student A1"); no real child data in demos. Each child stands on a
// post in the colour of their latest screening outcome; tapping one opens their tests (and from there a new test).
import * as Crypto from 'expo-crypto';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Band } from '@/art';
import type { CaseRec } from '@/cases';
import { db } from '@/db';
import { kvGet, list, put } from '@/db/store';
import { useT, type Key } from '@/i18n';
import { Icon } from '@/icons';
import { latestOutcomes, type Child } from '@/teacher/data';
import { Btn, C, Card, Chips, F, OUTCOME, P, PostRow, s, SectionH, StatusPill } from '@/ui';

const AGE_BANDS = ['6-8', '9-11', '12-14', '15-18'] as const;

function load() {
  const cases = new Map<string, CaseRec & { id: string }>();
  for (const k of list<CaseRec>(db, 'case')) if (!cases.has(k.child)) cases.set(k.child, k); // newest first
  const outcomes = latestOutcomes();
  return list<Child>(db, 'child').map((c) => ({ ...c, outcome: outcomes.get(c.id) ?? null, kase: cases.get(c.id) ?? null }));
}

export default function Children() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const school = kvGet(db, 'school_id');
  const [children, setChildren] = useState(load);
  // Back from a test or a case: a new outcome or status may exist.
  useFocusEffect(useCallback(() => setChildren(load()), []));
  const [name, setName] = useState('');
  const [age, setAge] = useState<(typeof AGE_BANDS)[number] | null>(null);
  const [label, setLabel] = useState(''); // optional class, e.g. "5A"; kept for the next child of the same class
  const [query, setQuery] = useState('');
  const shown = children.filter((c) => `${c.display_name} ${c.class_label ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()));

  function add() {
    put(db, 'child', Crypto.randomUUID(), { school, display_name: name.trim(), age_band: age, class_label: label.trim() });
    setName('');
    setAge(null);
    setChildren(load());
  }

  return (
    <ScrollView style={{ backgroundColor: C.paper }} contentContainerStyle={{ paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
      <Band top={insets.top} title={t('title.children')} sub={t('children.sub', { n: children.length })}
        figure={{ source: require('../../assets/images/peeps/test-intro.png'), w: 56, h: 118 }} />
      <View style={[s.screen, { paddingTop: 16 }]}>
        {!school && <P>{t('children.pickSchool')}</P>}
        <Card>
          <Text style={st.formH}>{t('children.addH')}</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('children.namePlaceholder')}
            placeholderTextColor={C.dusk} accessibilityLabel={t('children.namePlaceholder')} />
          <Chips options={AGE_BANDS} value={age} onChange={setAge} />
          <TextInput style={s.input} value={label} onChangeText={setLabel} maxLength={20} autoCapitalize="characters"
            placeholder={t('children.classPlaceholder')} placeholderTextColor={C.dusk} accessibilityLabel={t('children.classPlaceholder')} />
          <Btn icon="user-plus" title={t('children.add')} onPress={add} disabled={!school || !name.trim() || !age} />
        </Card>

        <SectionH title={t('children.listH')} />
        {children.length > 6 && (
          <View style={st.search}>
            <Icon name="search" size={20} color={C.dusk} />
            <TextInput style={st.searchInput} placeholder={t('teacher.search')} placeholderTextColor={C.dusk} value={query}
              onChangeText={setQuery} accessibilityLabel={t('teacher.search')} />
          </View>
        )}
        {children.length === 0 && <Text style={s.muted}>{t('children.empty')}</Text>}
        {shown.map((c) => (
          <PostRow key={c.id} color={c.outcome ? OUTCOME[c.outcome].fill : C.lilac} title={c.display_name}
            sub={[c.age_band, c.class_label, c.outcome ?? t('class.notTested')].filter(Boolean).join(' · ')}
            onPress={() => router.push({ pathname: '/child/[childId]', params: { childId: c.id } })}>
            {c.kase && <StatusPill status={c.kase.status} text={`${t('title.case')}: ${t(`status.${c.kase.status}` as Key)}`} />}
          </PostRow>
        ))}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  formH: { color: C.night, fontFamily: F.title, fontSize: 20, lineHeight: 32 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.lilac,
    borderRadius: 999, paddingHorizontal: 16, minHeight: 50 },
  searchInput: { flex: 1, color: C.night, fontFamily: F.ui, fontSize: 16, minHeight: 48 },
});
