// "Check Your Surrounding": microphone illustration, a coloured reading bar, a record button and the "Test
// Confirmation" dialog. Copied from DhwaniSarathi audiometer/app/Screens/QuietPlaceDetection.js (Apache-2.0, the
// DhwaniSarathi team). Changed by us: the reading is OUR relative room-noise measurement (rules ambientLevel and
// apply500HzPolicy, config noise.*), not expo-av's raw metering; the dialog shows our reading and our noise rule
// instead of their fixed -40 / -80 dB bands; the bar colour follows our noise gate; Start/Stop recording → one
// timed measurement; Continue calls onContinue instead of pushing /Screens/EarTest; i18next → useT().
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Button, ProgressBar } from 'react-native-paper';

import { cfg } from '@/config';
import { useT } from '@/i18n';
import { DS } from '@/original/paper';
import { ambientLevel, apply500HzPolicy, v, type Sample } from '@/rules';
import type { ScreeningAudio } from '@/audio/useScreeningAudio';

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

const QuietPlaceDetection = ({ audio, micStart, onContinue, progress }: {
  audio: ScreeningAudio; micStart: number; onContinue: (a: Ambient) => void; progress?: number;
}) => {
  const t = useT();
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<Ambient | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    measureAmbient(audio, micStart, (a) => { setResult(a); setIsRecording(false); });
  };

  const noisy = result?.db != null && result.db > v(cfg, 'noise', 'gate_db_above_baseline');
  // Was calculateRGB(raw metering); now our gate: red = too noisy, amber = 500 Hz left out, blue = quiet enough.
  const barColor = !result ? DS.blue : noisy ? '#d22b2b' : !result.include500 ? '#E0A100' : DS.blue;

  const showAlert = () => {
    if (!result) return Alert.alert(t('ds.testConfirmation'), t('ds.checkFirst'));
    let message = result.db === null ? t('ambient.couldNot') : t('ambient.value', { value: result.db.toFixed(1) });
    message += `\n${t.reason(result.reason)}`;
    if (noisy) message = `${t('ambient.noisy')}\n${message}`;
    Alert.alert(t('ds.testConfirmation'), message, [
      { text: t('ds.stop'), style: 'cancel' },
      { text: t('common.continue'), onPress: () => onContinue(result) },
    ], { cancelable: false });
  };

  return (
    <View>
      {progress !== undefined && <ProgressBar progress={progress} color={DS.navy} style={{ margin: 15 }} />}
      <View style={{ padding: 16 }}>
        <Text style={styles.title}>{t('ds.checkSurrounding')}</Text>
        <Image style={{ width: 200, height: 200, alignSelf: 'center' }} source={require('@/assets/images/original/microphone.png')}
          resizeMode="cover" />
        <View style={[styles.bar, { backgroundColor: barColor }]}>
          <Text style={styles.barText}>
            {isRecording ? t('ambient.measuring') : !result ? t('ds.notMeasured')
              : result.db === null ? t('ambient.couldNot') : t('ambient.value', { value: result.db.toFixed(1) })}
          </Text>
        </View>
        <Button mode="contained" onPress={startRecording} disabled={isRecording} style={{ margin: 5 }}>
          {isRecording ? t('ambient.measuring') : t(result ? 'ds.measureAgain' : 'ambient.measure')}
        </Button>
        <Button mode="contained" onPress={showAlert} disabled={isRecording} style={{ margin: 10 }}>
          {t('common.continue')}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, alignSelf: 'center', fontWeight: 'bold', marginBottom: 24, color: DS.navy }, // marginBottom 40
  bar: {
    marginTop: 20,
    paddingVertical: 30,
    width: '100%',
    minHeight: 90,
    borderColor: 'white',
    borderWidth: 1,
    elevation: 10,
    alignSelf: 'center',
    marginBottom: 30,
    borderRadius: 10,
    justifyContent: 'center',
  },
  barText: { textAlign: 'center', fontSize: 15, fontWeight: 'bold', alignSelf: 'center', color: 'white', paddingHorizontal: 8 },
});

export default QuietPlaceDetection;
