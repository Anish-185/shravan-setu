// Ear-health triage checklist (yes/no, big buttons). Routes with the shared triage rule: likely treatable cause ->
// nearest PHC, otherwise DEIC. Triage, not diagnosis. Questions and their Telugu live in config/screening.json.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { saveTriage, type Facility } from '@/cases';
import { cfg } from '@/config';
import { db } from '@/db';
import { useT } from '@/i18n';
import { v } from '@/rules';
import { Btn, H, P, s } from '@/ui';

type Q = { id: string; en: string; te: string };

export function TriageForm({ caseId, onSaved }: { caseId: string; onSaved?: () => void }) {
  const t = useT();
  const questions: Q[] = v(cfg, 'triage', 'questions');
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<{ route: string; reason: string; facility: Facility | null } | null>(null);
  const complete = questions.every((q) => q.id in answers);

  return (
    <View style={s.screen}>
      <H>{t('triage.h')}</H>
      <Text style={s.warn}>{t('triage.label')}</Text>
      <P>{t('triage.p')}</P>
      {questions.map((q) => (
        <View key={q.id} style={{ gap: 6 }}>
          <P>{t.x(q)}</P>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[true, false].map((yes) => (
              <Pressable key={String(yes)} accessibilityRole="button" accessibilityState={{ selected: answers[q.id] === yes }}
                onPress={() => setAnswers({ ...answers, [q.id]: yes })}
                style={[s.btn, { flex: 1, paddingVertical: 18 }, answers[q.id] !== yes && s.btnPlain]}>
                <Text style={[s.btnText, answers[q.id] !== yes && s.btnPlainText]}>{t(yes ? 'common.yes' : 'common.no')}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Btn title={t('triage.save')} disabled={!complete} onPress={() => {
        setSaved(saveTriage(db, cfg, caseId, answers));
        onSaved?.();
      }} />
      {saved && (
        <>
          <Text style={s.ok}>{t('triage.saved')}</Text>
          <P>{t(saved.route === 'PHC' ? 'triage.routePHC' : 'triage.routeDEIC', { facility: saved.facility?.name ?? t('triage.noFacility') })}</P>
          <P>{saved.reason}</P>
        </>
      )}
    </View>
  );
}
