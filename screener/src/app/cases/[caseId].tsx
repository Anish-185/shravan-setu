// One referral case: status, triage, full history, and buttons for the legal next moves only (shared transition
// table). Screening follow-up, not a diagnosis.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { events, moveCase, remindersFor, type CaseRec, type Facility } from '@/cases';
import { cfg } from '@/config';
import { db } from '@/db';
import { get } from '@/db/store';
import { useLang, useT } from '@/i18n';
import { LOST, nextStatuses, TREATMENTS } from '@/rules';
import { TriageForm } from '@/triage';
import { Banner, Btn, Chips, H, P, s } from '@/ui';

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
      <Banner />
      <H>{name}</H>
      <P>{t('case.status', { status: t(`status.${c.status}` as never) })}</P>
      {c.triage_route
        ? <P>{t('case.route', { route: c.triage_route, facility: facility?.name ?? t('triage.noFacility') })}</P>
        : <>
          <P>{t('case.noTriage')}</P>
          <TriageForm caseId={caseId} onSaved={() => refresh((n) => n + 1)} />
        </>}

      <H>{t('case.history')}</H>
      {events(db, caseId).map((e, i) => (
        <P key={i}>{t('case.event', {
          at: e.at.slice(0, 16).replace('T', ' '), from: t(`status.${e.from_status}` as never), to: t(`status.${e.to_status}` as never),
        })}{e.treatment ? ` (${t(`treatment.${e.treatment}` as never)})` : ''}{e.reason ? ` (${e.reason})` : ''}</P>
      ))}

      {next.length === 0 ? <P>{t('case.final')}</P> : <P>{t('case.move')}</P>}
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

      {remindersFor(db, caseId).length > 0 && <H>{t('case.reminders')}</H>}
      {remindersFor(db, caseId).map((r, i) => (
        <P key={i}>{t('case.wouldSend', { text: lang === 'te' ? r.text_te : r.text_en })}</P>
      ))}
    </ScrollView>
  );
}
