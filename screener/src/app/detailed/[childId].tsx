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
import { ScrollView, Text, View } from 'react-native';

import { useScreeningAudio } from '@/audio/useScreeningAudio';
import { cfg, CONFIG_VERSION } from '@/config';
import { db } from '@/db';
import { get, kvGet, put } from '@/db/store';
import { useT } from '@/i18n';
import AudiometryTest from '@/original/AudiometryTest';
import type { Point } from '@/original/hearing';
import MakeSure from '@/original/MakeSure';
import QuietPlaceDetection, { type Ambient } from '@/original/Surrounding';
import WhichEar from '@/original/WhichEar';
import { ConsentStep, DeviceStep } from '@/steps';
import { C, F, P, s } from '@/ui';

const PRE = ['ds.makeSure', 'ds.checkSurrounding', 'ds.whichEar'] as const;

/** Where the teacher is before the test: Make sure → Check your surrounding → Which ear (the original's progress bar). */
function PreSteps({ current }: { current: number }) {
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessible accessibilityLabel={t(PRE[current])}>
      {PRE.map((k, i) => (
        <View key={k} style={{ flex: 1, gap: 4 }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: i <= current ? C.indigo : C.lilac }} />
          <Text numberOfLines={2} style={{ color: i === current ? C.night : C.dusk, fontFamily: i === current ? F.uiBold : F.ui, fontSize: 12, lineHeight: 20 }}>{t(k)}</Text>
        </View>
      ))}
    </View>
  );
}

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

  const pre = ['checklist', 'ambient', 'lr'].indexOf(step === 'device' ? 'checklist' : step);
  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Text style={{ color: C.dusk, fontFamily: F.uiBold, fontSize: 16, lineHeight: 27 }}>{child.display_name}</Text>
      {pre >= 0 && <PreSteps current={pre} />}
      {!!audio.error && <Text style={s.warn}>{audio.error}</Text>}
      {step === 'consent' && <ConsentStep childId={childId} onDone={(id) => { setConsentId(id); setStep('checklist'); }} />}
      {step === 'checklist' && <MakeSure onNext={() => setStep('device')} />}
      {step === 'device' && <DeviceStep audio={audio} onMic={setMicStart} onDone={() => setStep('ambient')} />}
      {step === 'ambient' && (
        <QuietPlaceDetection audio={audio} micStart={micStart} onContinue={(a) => { setAmbient(a); setStep('lr'); }} />
      )}
      {step === 'lr' && <WhichEar audio={audio} onDone={(ok) => { setLrPassed(ok); setStep('test'); }} />}
      {step === 'test' && <AudiometryTest audio={audio} onDone={save} />}
    </ScrollView>
  );
}
