// Ear-health triage checklist (yes/no, big buttons). Routes with the shared triage rule: likely treatable cause ->
// nearest PHC, otherwise DEIC. Triage, not diagnosis. Questions and their Telugu live in config/screening.json.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { saveTriage, type Facility } from '@/cases';
import { cfg } from '@/config';
import { db } from '@/db';
import { useT } from '@/i18n';
import { v } from '@/rules';
import { Btn, C, Card, H, P, Pill, s, Warn } from '@/ui';

type Q = { id: string; en: string; te: string };

export function TriageForm({ caseId, onSaved }: { caseId: string; onSaved?: () => void }) {
  const t = useT();
  const questions: Q[] = v(cfg, 'triage', 'questions');
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<{ route: string; reason: string; facility: Facility | null } | null>(null);
  const complete = questions.every((q) => q.id in answers);

  return (
    <View style={{ gap: 14 }}>
      <H>{t('triage.h')}</H>
      <Warn>{t('triage.label')}</Warn>
      <Text style={s.muted}>{t('triage.p')}</Text>
      {questions.map((q) => (
        <Card key={q.id}>
          <P>{t.x(q)}</P>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[true, false].map((yes) => (
              <Pressable key={String(yes)} accessibilityRole="button" accessibilityState={{ selected: answers[q.id] === yes }}
                onPress={() => setAnswers({ ...answers, [q.id]: yes })}
                style={[s.btn, { flex: 1 }, answers[q.id] !== yes && s.btnPlain]}>
                <Text style={[s.btnText, answers[q.id] !== yes && s.btnPlainText]}>{t(yes ? 'common.yes' : 'common.no')}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ))}
      <Btn title={t('triage.save')} disabled={!complete} onPress={() => {
        setSaved(saveTriage(db, cfg, caseId, answers));
        onSaved?.();
      }} />
      {saved && (
        <Card>
          <Pill icon="circle-check" text={t('triage.saved')} tint={C.okTint} color={C.okText} />
          <P>{t(saved.route === 'PHC' ? 'triage.routePHC' : 'triage.routeDEIC', { facility: saved.facility?.name ?? t('triage.noFacility') })}</P>
          <Text style={s.muted}>{t.reason(saved.reason)}</Text>
        </Card>
      )}
    </View>
  );
}
