// Result of one screening (PASS / RETEST / REFER), then triage on REFER. Screening only, never a diagnosis.
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { db } from '@/db';
import { get } from '@/db/store';
import type { Snapshot } from '@/engine/engine';
import { useT } from '@/i18n';
import { TriageForm } from '@/triage';
import { Btn, H, P, s } from '@/ui';

type Saved = { sessionId: string; caseId: string | null };

export function ResultStep({ snap, calibrated, onSave }: { snap: Snapshot; calibrated: boolean; onSave: () => Saved }) {
  const t = useT();
  const r = snap.result!;
  const [ids, setIds] = useState<Saved | null>(null);
  // Saving stops the mic, which sets the parent screen's state, so it must run after render, not during it
  // (ERR-032). onSave returns the same ids on every call. The effect does real external work (SQLite write, native
  // mic stop); the state only records its result.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setIds(onSave()), [onSave]);
  return (
    <View style={s.screen}>
      <H>{t('result.h', { outcome: r.outcome ?? '-' })}</H>
      <P>{t('result.ears', { left: r.ear_outcomes.left ?? '-', right: r.ear_outcomes.right ?? '-' })}</P>
      {r.reasons.map((x) => <P key={x}>• {t.reason(x)}</P>)}
      {!calibrated && <Text style={s.warn}>{t('result.uncalibrated')}</Text>}
      {r.outcome === 'REFER' && <P>{t('result.refer')}</P>}
      {r.outcome === 'RETEST' && <P>{t('result.retest')}</P>}
      {ids?.caseId && <TriageForm caseId={ids.caseId} />}
      {ids && <Btn kind="plain" title={t('result.export')} onPress={() => exportSession(ids.sessionId)} />}
      <Btn title={t('result.done')} onPress={() => router.back()} />
    </View>
  );
}

export async function exportSession(sessionId: string) {
  const file = new File(Paths.cache, `session-${sessionId}.json`);
  file.write(JSON.stringify(get(db, 'session_log', sessionId), null, 1));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
}
