// "Check your surrounding". Idea from DhwaniSarathi audiometer/app/Screens/QuietPlaceDetection.js (Apache-2.0, the
// DhwaniSarathi team): a microphone picture, a coloured reading, a measure button and a "Test Confirmation" step.
// Ours: OUR relative room-noise measurement (rules ambientLevel and apply500HzPolicy, config noise.*), not expo-av's
// raw metering; the confirmation shows our reading and our noise rule instead of their fixed -40 / -80 dB bands, inline
// instead of an alert; the colour follows our noise gate; one timed measurement; our design and drawing.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cfg } from '@/config';
import { useT } from '@/i18n';
import { MicMeter } from '@/illustrations';
import { ambientLevel, apply500HzPolicy, v, type Sample } from '@/rules';
import type { ScreeningAudio } from '@/audio/useScreeningAudio';
import { Btn, C, Card, F, OUTCOME, s } from '@/ui';

export type Ambient = { db: number | null; include500: boolean; reason: string };

/** Our room-noise measurement, unchanged (was AmbientStep.measure in src/app/screen/[childId].tsx). */
export function measureAmbient(audio: ScreeningAudio, micStart: number, done: (a: Ambient) => void) {
  const samples: Sample[] = [];
  audio.setListeners({ onSample: (dB, at) => samples.push({ t: at, db: dB }) });
  void audio.warmUp(); // silent (volume 0), done well within the measurement; cuts the first tone's start delay
  const wait = Math.max(0, micStart + v(cfg, 'noise', 'mic_settle_ms') - Date.now()) + v(cfg, 'noise', 'ambient_measure_ms');
  setTimeout(() => {
    audio.setListeners({});
    const amb = ambientLevel(samples, micStart, audio.deviceChanges(), cfg);
    const pol = apply500HzPolicy(amb.db_re_reference, cfg);
    done({ db: amb.db_re_reference, include500: pol.include, reason: pol.reason });
  }, wait);
}

export default function QuietPlaceDetection({ audio, micStart, onContinue }: {
  audio: ScreeningAudio; micStart: number; onContinue: (a: Ambient) => void;
}) {
  const t = useT();
  const [measuring, setMeasuring] = useState(false);
  const [result, setResult] = useState<Ambient | null>(null);
  const [confirming, setConfirming] = useState(false);

  const measure = () => {
    setMeasuring(true);
    setConfirming(false);
    measureAmbient(audio, micStart, (a) => { setResult(a); setMeasuring(false); });
  };

  const noisy = result?.db != null && result.db > v(cfg, 'noise', 'gate_db_above_baseline');
  // Our gate: rust = too noisy, amber = 500 Hz left out, teal = quiet enough.
  const [rings, color] = !result ? [measuring ? 1 : 0, C.indigo] : noisy ? [3, OUTCOME.REFER.fill]
    : !result.include500 ? [2, OUTCOME.RETEST.fill] : [1, OUTCOME.PASS.fill];
  const reading = measuring ? t('ambient.measuring') : !result ? t('ds.notMeasured')
    : result.db === null ? t('ambient.couldNot') : t('ambient.value', { value: result.db.toFixed(1) });

  return (
    <View style={{ gap: 16 }}>
      <Text accessibilityRole="header" style={st.title}>{t('ds.checkSurrounding')}</Text>
      <View style={{ alignItems: 'center' }}><MicMeter size={170} rings={rings} color={color} /></View>
      <View style={[st.reading, { borderColor: result ? color : C.lilac }]} accessibilityLiveRegion="polite">
        <View style={[st.dot, { backgroundColor: result ? color : C.lilac }]} />
        <Text style={st.readingText}>{reading}</Text>
      </View>
      {confirming && result ? (
        <Card>
          <Text style={st.h}>{t('ds.testConfirmation')}</Text>
          {noisy && <Text style={s.warn}>{t('ambient.noisy')}</Text>}
          <Text style={s.p}>{t.reason(result.reason)}</Text>
          <Btn title={t('common.continue')} onPress={() => onContinue(result)} />
          <Btn kind="plain" title={t('ds.measureAgain')} onPress={measure} />
        </Card>
      ) : (
        <>
          <Btn kind={result ? 'plain' : 'primary'} icon="mic" title={measuring ? t('ambient.measuring') : t(result ? 'ds.measureAgain' : 'ambient.measure')}
            onPress={measure} disabled={measuring} />
          {result && <Btn title={t('common.continue')} onPress={() => setConfirming(true)} disabled={measuring} />}
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  title: { color: C.night, fontFamily: F.title, fontSize: 26, lineHeight: 40 },
  reading: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderWidth: 2, borderRadius: 18, padding: 16 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  readingText: { flex: 1, color: C.night, fontFamily: F.uiBold, fontSize: 17, lineHeight: 28 },
  h: { color: C.night, fontFamily: F.uiBold, fontSize: 18, lineHeight: 30 },
});
