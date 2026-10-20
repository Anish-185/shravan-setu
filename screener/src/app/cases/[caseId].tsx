// One referral case: status, triage, full history, and buttons for the legal next moves only (shared transition
// table). Screening follow-up, not a diagnosis.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { events, moveCase, remindersFor, type CaseRec, type Facility } from '@/cases';
import { cfg } from '@/config';
import { db } from '@/db';
import { get } from '@/db/store';
import { useLang, useT } from '@/i18n';
import { exportSession } from '@/result';
import { LOST, nextStatuses, TREATMENTS } from '@/rules';
import { TriageForm } from '@/triage';
import { Icon } from '@/icons';
import { Btn, C, Card, Chips, F, H, P, s, StatusPill } from '@/ui';

export default function CaseDetail() {
  const t = useT();
  const { lang } = useLang();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const [, refresh] = useState(0);
  const [treatment, setTreatment] = useState<(typeof TREATMENTS)[number] | null>(null);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const c = get<CaseRec>(db, 'case', caseId);
  if (!c) return <P>{t('screen.notFound')}</P>;
  const name = get<{ display_name: string }>(db, 'child', c.child)?.display_name ?? '?';
  const facility = c.facility ? get<Facility>(db, 'facility', c.facility) : null;
  const next = nextStatuses(c.status);
  // The full engine log exists only for sessions run on this phone (not for cases pulled from the server).
  const session = c.screening_result ? get<{ session: string }>(db, 'screening_result', c.screening_result)?.session : undefined;
  const hasLog = !!session && !!get(db, 'session_log', session);

  function move(to: string) {
    // camp_scheduled goes through a camp request, so the camp list and the PDF stay complete
    if (to === 'camp_scheduled') return router.push({ pathname: '/camp', params: { cases: caseId } });
    const v = moveCase(db, cfg, caseId, to, { treatment: treatment ?? '', reason });
    if (!v.allowed) return setMsg(t(`case.why.${v.why}` as never));
    setMsg('');
    setReason('');
    refresh((n) => n + 1);
  }

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${name}, ${t('result.childTests')}`}
        onPress={() => router.push({ pathname: '/child/[childId]', params: { childId: c.child } })} style={st.child}>
        <H>{name}</H>
        <View style={{ flex: 1 }} />
        <Icon name="history" size={18} color={C.indigo} />
        <Text style={st.childLink}>{t('result.childTests')}</Text>
      </Pressable>
      <View accessible accessibilityLabel={t('case.status', { status: t(`status.${c.status}` as never) })}>
        <StatusPill status={c.status} text={t(`status.${c.status}` as never)} />
      </View>
      {c.triage_route
        ? (
          <Card style={st.route}>
            <Icon name="hospital" size={22} color={C.dusk} />
            <Text style={[s.p, { flex: 1 }]}>{t('case.route', { route: c.triage_route, facility: facility?.name ?? t('triage.noFacility') })}</Text>
          </Card>
        )
        : <>
          <P>{t('case.noTriage')}</P>
          <TriageForm caseId={caseId} onSaved={() => refresh((n) => n + 1)} />
        </>}

      <H>{t('case.history')}</H>
      {events(db, caseId).map((e, i) => (
        <View key={i} style={st.event}>
          <View style={st.dot} />
          <Text style={[s.p, { flex: 1 }]}>{t('case.event', {
            at: localTime(e.at), from: t(`status.${e.from_status}` as never), to: t(`status.${e.to_status}` as never),
          })}{e.treatment ? ` (${t(`treatment.${e.treatment}` as never)})` : ''}{e.reason ? ` (${e.reason})` : ''}</Text>
        </View>
      ))}

      {next.length === 0 ? <Text style={s.muted}>{t('case.final')}</Text> : <Text style={s.muted}>{t('case.move')}</Text>}
      {next.includes('treated') && (
        <Chips options={TREATMENTS} value={treatment} onChange={setTreatment} label={(o) => t(`treatment.${o}`)} />
      )}
      {next.includes(LOST) && (
        <TextInput style={s.input} value={reason} onChangeText={setReason} placeholder={t('case.reason')} />
      )}
      <View style={{ gap: 8 }}>
        {next.map((to) => (
          <Btn key={to} kind={to === LOST ? 'danger' : 'primary'} title={t(`status.${to}` as never)} onPress={() => move(to)} />
        ))}
      </View>
      {!!msg && <Text style={s.warn}>{msg}</Text>}

      {hasLog && <Btn kind="plain" icon="share-2" title={t('result.export')} onPress={() => exportSession(session!)} />}

      {remindersFor(db, caseId).length > 0 && <H>{t('case.reminders')}</H>}
      {remindersFor(db, caseId).map((r, i) => (
        <Card key={i}><Text style={s.muted}>{t('case.wouldSend', { text: lang === 'te' ? r.text_te : r.text_en })}</Text></Card>
      ))}
    </ScrollView>
  );
}

/** "2026-10-19 00:18" in the phone's own time zone (events are stored as UTC ISO strings). */
function localTime(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16).replace('T', ' ');
}

const st = StyleSheet.create({
  child: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  childLink: { color: C.indigo, fontFamily: F.uiBold, fontSize: 15, lineHeight: 25 },
  route: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  event: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderLeftWidth: 2, borderLeftColor: C.lilac, marginLeft: 5,
    paddingLeft: 14, paddingBottom: 8 },
  dot: { position: 'absolute', left: -7, top: 9, width: 12, height: 12, borderRadius: 6, backgroundColor: C.indigo },
});
