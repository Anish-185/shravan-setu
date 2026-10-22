// The teacher's school. Typed on the phone (works offline: a client UUID, queued so the next sync creates it on the
// server) or picked from the server's list after login. A typed school that never reached the server hands its records
// to the picked one, so nothing is left under a school no one else can see.
import * as Crypto from 'expo-crypto';
import { StyleSheet, Text, TextInput } from 'react-native';

import { kvGet, kvSet, moveSchool, put, type Db } from '@/db/store';
import { useT } from '@/i18n';
import { C, F, s } from '@/ui';

/** Pre-filled for demos; seed_demo uses the same name (src/__tests__/school.test.ts checks). Clearly not a real school. */
export const DEMO_SCHOOL = 'Demo Government School, Hyderabad';

export type ServerSchool = { id: string; name: string; mandal: string };

export function typeSchool(db: Db, name: string) {
  // Renaming a typed school updates the same record; typing over a server school makes a new one.
  const id = (kvGet(db, 'school_local') === '1' && kvGet(db, 'school_id')) || Crypto.randomUUID();
  db.tx(() => {
    put(db, 'school', id, { name });
    kvSet(db, 'school_id', id);
    kvSet(db, 'school_name', name);
    kvSet(db, 'school_mandal', ''); // unknown: triage falls back to the first facility of each type
    kvSet(db, 'school_local', '1');
  });
}

export function pickSchool(db: Db, sc: ServerSchool) {
  const old = kvGet(db, 'school_id');
  const sent = db.all("SELECT 1 FROM outbox WHERE type = 'school' AND id = ? AND status = 'synced'", old).length > 0;
  db.tx(() => {
    if (old && old !== sc.id && kvGet(db, 'school_local') === '1' && !sent) moveSchool(db, old, sc.id);
    kvSet(db, 'school_id', sc.id);
    kvSet(db, 'school_name', sc.name);
    kvSet(db, 'school_mandal', sc.mandal ?? ''); // "nearest" facility = same mandal
    kvSet(db, 'school_local', '');
  });
}

/** "School name" box, shown where a teacher would otherwise be stuck without a school. */
export function SchoolInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT();
  return (
    <>
      <Text style={st.label}>{t('school.label')}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChange} maxLength={200} accessibilityLabel={t('school.label')} />
      <Text style={s.muted}>{t('school.hint')}</Text>
    </>
  );
}

const st = StyleSheet.create({
  label: { color: C.night, fontFamily: F.uiBold, fontSize: 15, lineHeight: 25 },
});
