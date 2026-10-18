// Saves one finished screening session: session + result (+ case and its first event on REFER), all synced, and the
// full engine log (local only, export). Screening only, never a diagnosis.
import * as Crypto from 'expo-crypto';

import { kvGet, put, type Db } from '@/db/store';
import type { decideOutcome } from '@/rules';

export type SessionInput = {
  childId: string; school: string; consentId: string; startedAt: string; lrPassed: boolean | null;
  ambientDb: number | null; ambientReason: string; calibrated: boolean;
  result: ReturnType<typeof decideOutcome>; log: Record<string, unknown> | undefined;
  device: { brand: string | null; model: string | null; os: string }; appVersion: string; configVersion: string;
};

export function saveSession(db: Db, x: SessionInput) {
  const sessionId = Crypto.randomUUID();
  const resultId = Crypto.randomUUID();
  let caseId: string | null = null;
  db.tx(() => {
    put(db, 'screening_session', sessionId, {
      child: x.childId, consent: x.consentId, started_at: x.startedAt,
      device_model: x.device.model ?? 'unknown', earphone_model: kvGet(db, 'earphone_model') ?? '',
      volume_confirmed: true, volume_setting: kvGet(db, 'volume_setting') ?? '',
      app_version: x.appVersion, config_version: x.configVersion,
      calibrated: x.calibrated, ambient_db_re_reference: x.ambientDb, lr_check_passed: x.lrPassed,
    });
    put(db, 'screening_result', resultId, {
      session: sessionId, outcome: x.result.outcome, ear_outcomes: x.result.ear_outcomes,
      frequency_results: x.result.point_status, reliability_score: x.result.reliability.score,
      noise_events: (x.log?.noise_events as unknown[]) ?? [], reasons: x.result.reasons,
    });
    // Full engine log stays on the phone (export only): trials, metering numbers, device changes. Never audio.
    put(db, 'session_log', sessionId, {
      note: 'Screening session log. Screening only, not a diagnosis. Metering is relative and uncalibrated.',
      device: x.device, config_version: x.configVersion, calibrated: x.calibrated,
      ambient_db_re_reference: x.ambientDb, ambient_reason: x.ambientReason, lr_check_passed: x.lrPassed,
      result: x.result, ...x.log,
    });
    if (x.result.outcome === 'REFER') {
      caseId = Crypto.randomUUID();
      put(db, 'case', caseId, { child: x.childId, school: x.school, screening_result: resultId, status: 'referred' });
      put(db, 'case_event', Crypto.randomUUID(), {
        case: caseId, from_status: 'screened', to_status: 'referred', at: new Date().toISOString(),
      });
    }
  });
  return { sessionId, caseId: caseId as string | null };
}
