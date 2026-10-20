// Detailed hearing test (second mode, optional): offered after a REFER and from the teacher view. The original
// DhwaniSarathi flow (BeforeTest1 -> QuietPlaceDetection -> EarTest -> AudiometryTest -> Results, Apache-2.0, the
// DhwaniSarathi team) with our consent and device check in front, our room-noise and left/right logic, and our
// calibrated playback. Our screening test stays the default. Screening and referral only, never a diagnosis.
// The result is kept on this phone (record type detailed_test, not synced).
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { useScreeningAudio } from '@/audio/useScreeningAudio';
import { cfg, CONFIG_VERSION } from '@/config';
import { db } from '@/db';
import { get, kvGet, put } from '@/db/store';
import { useT } from '@/i18n';
import AudiometryTest from '@/original/AudiometryTest';
import type { Point } from '@/original/hearing';
import BeforeTest1 from '@/original/MakeSure';
import QuietPlaceDetection, { type Ambient } from '@/original/Surrounding';
import EarTest from '@/original/WhichEar';
import { ConsentStep, DeviceStep } from '@/steps';
import { C, F, P, s } from '@/ui';

type Step = 'consent' | 'checklist' | 'device' | 'ambient' | 'lr' | 'test';

export default function Detailed() {
  const t = useT();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const child = get<{ display_name: string }>(db, 'child', childId);
  const audio = useScreeningAudio(cfg);
  const [step, setStep] = useState<Step>('consent');
  const [consentId, setConsentId] = useState('');
  const [micStart, setMicStart] = useState(0);
  const [ambient, setAmbient] = useState<Ambient | null>(null);
  const [lrPassed, setLrPassed] = useState<boolean | null>(null);
  const [startedAt] = useState(() => new Date().toISOString());

  if (!child) return <P>{t('screen.notFound')}</P>;
  // dB values need a calibration; without one the detailed test has nothing to measure against.
  if (!audio.calibrated) return <ScrollView contentContainerStyle={s.screen}><P>{t('ds.needsCalibration')}</P></ScrollView>;

  function save(points: Point[]) {
    const id = Crypto.randomUUID();
    void audio.stopMic();
    put(db, 'detailed_test', id, {
      child: childId, consent: consentId, started_at: startedAt, finished_at: new Date().toISOString(), points,
      levels: 'dB re: team baseline', calibrated: audio.calibrated, calibration_provisional: audio.provisional,
      ambient_db_re_reference: ambient?.db ?? null, ambient_reason: ambient?.reason ?? '', lr_check_passed: lrPassed,
      device: { brand: Device.brand, model: Device.modelName, os: `${Device.osName} ${Device.osVersion}` },
      earphone_model: kvGet(db, 'earphone_model') ?? '', volume_setting: kvGet(db, 'volume_setting') ?? '',
      app_version: Constants.expoConfig?.version ?? '', config_version: CONFIG_VERSION,
    });
    router.replace({ pathname: '/results/[testId]', params: { testId: id } });
  }

  return (
    <ScrollView contentContainerStyle={[s.screen, { backgroundColor: C.white }]}>
      <Text style={{ color: C.dusk, fontFamily: F.uiBold, fontSize: 16, lineHeight: 27 }}>{child.display_name}</Text>
      {!!audio.error && <Text style={s.warn}>{audio.error}</Text>}
      {step === 'consent' && <ConsentStep childId={childId} onDone={(id) => { setConsentId(id); setStep('checklist'); }} />}
      {step === 'checklist' && <BeforeTest1 progress={0.3} onNext={() => setStep('device')} />}
      {step === 'device' && <DeviceStep audio={audio} onMic={setMicStart} onDone={() => setStep('ambient')} />}
      {step === 'ambient' && (
        <QuietPlaceDetection audio={audio} micStart={micStart} progress={0.6} onContinue={(a) => { setAmbient(a); setStep('lr'); }} />
      )}
      {step === 'lr' && <EarTest audio={audio} progress={1} onDone={(ok) => { setLrPassed(ok); setStep('test'); }} />}
      {step === 'test' && <AudiometryTest audio={audio} onDone={save} />}
    </ScrollView>
  );
}
