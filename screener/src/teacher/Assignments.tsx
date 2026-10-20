// Assignment (screening round) card and "Create assignment" form, used by the Assignments tab and a classroom's page.
// Ideas from DhwaniSarathi audiometer/app/Screens/Educator/AssignmentList.js (Apache-2.0, the DhwaniSarathi team):
// a cover, the name, the deadline, the class strength, a progress bar, and a name + deadline form. Ours: our design, a
// cover drawn from the id instead of their stock photos, a past-deadline mark, quick deadline chips; local records.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useT } from '@/i18n';
import { Icon } from '@/icons';
import { Cover } from '@/illustrations';
import { addAssignment, roundResults, strength, ymd, type Assignment } from '@/teacher/data';
import { Bar, Btn, C, Card, Chips, F, s } from '@/ui';

export function AssignmentCard({ a, showClass }: { a: Assignment & { id: string }; showClass?: boolean }) {
  const t = useT();
  const done = roundResults(a).length;
  const total = strength(a.class_label);
  const past = a.deadline < ymd(new Date());
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/teacher/assignment/[id]', params: { id: a.id } })}
      style={({ pressed }) => [st.card, pressed && s.pressed]}>
      <Cover seed={a.id} height={54}>
        <Text style={st.title} numberOfLines={1}>{a.name}</Text>
      </Cover>
      <View style={st.body}>
        <View style={st.row}>
          {showClass && (
            <View style={st.chip}><Text style={st.chipText}>{a.class_label || t('teacher.noClass')}</Text></View>
          )}
          <Icon name="bell" size={16} color={past ? C.warnLine : C.dusk} />
          <Text style={[st.meta, past && { color: C.warnText }]}>
            {t(past ? 'assign.pastDeadline' : 'teacher.deadline', { date: a.deadline })}
          </Text>
          <Icon name="chevron-right" size={18} color={C.dusk} />
        </View>
        <Text style={st.meta}>{t('teacher.progress', { done, total })}</Text>
        <Bar value={total ? done / total : 0} color={done >= total && total > 0 ? '#006B7A' : C.indigo} />
      </View>
    </Pressable>
  );
}

const WEEKS = ['1', '2', '4'] as const;

/** Name + deadline (YYYY-MM-DD, or 1 / 2 / 4 weeks from today; 7 days if left empty, as the original server set it). */
export function CreateAssignment({ labels, fixed, onCreated }: { labels: string[]; fixed?: string; onCreated: () => void }) {
  const t = useT();
  const [label, setLabel] = useState<string | null>(fixed ?? (labels.length === 1 ? labels[0] : null));
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [weeks, setWeeks] = useState<(typeof WEEKS)[number] | null>(null);
  const [inAWeek] = useState(() => ymd(new Date(Date.now() + 7 * 86400000)));
  const ok = deadline === '' || (/^\d{4}-\d{2}-\d{2}$/.test(deadline) && !isNaN(Date.parse(deadline)));
  const ready = label !== null && !!name.trim() && ok;

  return (
    <Card>
      <Text style={st.formH}>{t('ds.createAssignment')}</Text>
      {fixed === undefined && (
        labels.length ? <Chips options={labels} value={label} onChange={setLabel} label={(l) => l || t('teacher.noClass')} />
          : <Text style={s.muted}>{t('assign.needClass')}</Text>
      )}
      <TextInput style={s.input} placeholder={t('ds.assignmentName')} placeholderTextColor={C.dusk} value={name} onChangeText={setName}
        accessibilityLabel={t('ds.assignmentName')} />
      <Chips options={WEEKS} value={weeks} label={(w) => (w === '1' ? t('assign.week') : t('assign.weeks', { n: w }))} onChange={(w) => {
        setWeeks(w);
        setDeadline(ymd(new Date(Date.now() + Number(w) * 7 * 86400000)));
      }} />
      <TextInput style={s.input} placeholder={t('ds.deadlinePlaceholder', { date: inAWeek })}
        placeholderTextColor={C.dusk} value={deadline} onChangeText={(d) => { setDeadline(d); setWeeks(null); }} maxLength={10}
        accessibilityLabel={t('assign.deadline')} />
      {!ok && <Text style={s.warn}>{t('ds.deadlineFormat')}</Text>}
      <Btn icon="plus" title={t('ds.createAssignment')} disabled={!ready} onPress={() => {
        addAssignment(label!, name.trim(), deadline || undefined);
        setName('');
        setDeadline('');
        setWeeks(null);
        onCreated();
      }} />
    </Card>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.lilac },
  title: { color: C.white, fontFamily: F.title, fontSize: 21, lineHeight: 34 },
  body: { padding: 14, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { flex: 1, color: C.night, fontFamily: F.ui, fontSize: 15, lineHeight: 25 },
  chip: { backgroundColor: C.marigoldTint, borderRadius: 999, paddingHorizontal: 10 },
  chipText: { color: C.amber, fontFamily: F.uiBold, fontSize: 13, lineHeight: 23 },
  formH: { color: C.night, fontFamily: F.title, fontSize: 20, lineHeight: 32 },
});
