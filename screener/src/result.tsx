// Result of one screening (PASS / RETEST / REFER), then triage on REFER. Screening only, never a diagnosis.
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SetuLine } from '@/art';

import { db } from '@/db';
import { get } from '@/db/store';
import type { Snapshot } from '@/engine/engine';
import { useT } from '@/i18n';
import { TriageForm } from '@/triage';
import { Icon } from '@/icons';
import { Btn, C, Card, F, Note, OUTCOME, P, Pill, s } from '@/ui';

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
    <View style={st.wrap}>
      <Badge outcome={r.outcome} label={t('result.h', { outcome: r.outcome ?? '-' })} />
      <Ears left={r.ear_outcomes.left} right={r.ear_outcomes.right} />
      {!calibrated && <Note icon="triangle-alert" color={C.amber} text={t('result.uncalibrated')} />}
      <SetuLine color="#C9C6E8" height={34} stroke={2} style={{ marginHorizontal: -20, marginVertical: -6 }} />
      {r.reasons.length > 0 && (
        <Card>
          {r.reasons.map((x) => (
            <View key={x} style={st.reason}><View style={st.dot} /><Text style={[s.p, { flex: 1 }]}>{t.reason(x)}</Text></View>
          ))}
        </Card>
      )}
      {r.outcome === 'REFER' && <P>{t('result.refer')}</P>}
      {r.outcome === 'RETEST' && <P>{t('result.retest')}</P>}
      {ids?.caseId && <TriageForm caseId={ids.caseId} />}
      {ids && <Btn kind="plain" icon="share-2" title={t('result.export')} onPress={() => exportSession(ids.sessionId)} />}
      <Btn title={t('result.done')} onPress={() => router.back()} />
    </View>
  );
}

type Outcome = keyof typeof OUTCOME;
const known = (o: string | null | undefined): o is Outcome => !!o && o in OUTCOME;

/** The outcome as a big pill: colour + icon + word, so it never rests on colour alone. */
function Badge({ outcome, label }: { outcome: string | null; label: string }) {
  if (!known(outcome)) return <Text style={s.h}>{label}</Text>;
  const o = OUTCOME[outcome];
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={label} style={[st.badge, { backgroundColor: o.fill }]}>
      <Icon name={o.icon} size={30} color={o.on} stroke={2.2} />
      <Text style={[st.badgeText, { color: o.on }]}>{outcome}</Text>
    </View>
  );
}

/** "Left ear: PASS · Right ear: REFER" as two rows with small outcome pills. Labels come from result.ears itself. */
function Ears({ left, right }: { left?: string | null; right?: string | null }) {
  const t = useT();
  const parts = t('result.ears', { left: '\u0000', right: '\u0000' }).split('\u0000');
  if (parts.length !== 3) return <P>{t('result.ears', { left: left ?? '-', right: right ?? '-' })}</P>;
  const row = (lab: string, o?: string | null) => (
    <View style={st.ear}>
      <Text style={[s.muted, { flex: 1 }]}>{lab.replace(/^[\s·]+|[\s·:]+$/g, '')}</Text>
      {known(o)
        ? <Pill icon={OUTCOME[o].icon} text={o} tint={OUTCOME[o].tint} color={OUTCOME[o].onTint} />
        : <Text style={s.p}>{o ?? '-'}</Text>}
    </View>
  );
  return (
    <Card style={{ paddingVertical: 6, gap: 0 }}>
      {row(parts[0], left)}
      <View style={{ height: 1, backgroundColor: C.lilac }} />
      {row(parts[1], right)}
    </Card>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 12, borderRadius: 999, paddingVertical: 14,
    paddingHorizontal: 30 },
  badgeText: { fontFamily: F.uiBold, fontSize: 30, lineHeight: 40, letterSpacing: 0.6 },
  ear: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  reason: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.marigold, marginTop: 10 },
});

export async function exportSession(sessionId: string) {
  const file = new File(Paths.cache, `session-${sessionId}.json`);
  file.write(JSON.stringify(get(db, 'session_log', sessionId), null, 1));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
}
