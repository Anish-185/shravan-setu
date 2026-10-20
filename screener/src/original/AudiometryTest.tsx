// The detailed (threshold) test screen. Copied from DhwaniSarathi audiometer/app/AudiometryTest.js (Apache-2.0, the
// DhwaniSarathi team): start card, "Can you hear the sound?", progress bar, ear and head illustration, threshold bar,
// frequency / Replay / dB chips, Yes / No. Changed by us: tones play through OUR calibrated player (team baseline +
// level, src/original/Audiometry.ts) and only while wired earphones are detected (never through the speaker); the
// first tone plays on Start; the masked / unmasked chip and its help are gone with the masked phase; results go to
// onDone instead of a POST to their server and /Screens/Results; the floating help action (unused) removed; one
// app-wide PaperProvider; i18next → useT().
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Button, Card, IconButton, ProgressBar } from 'react-native-paper';

import type { ScreeningAudio } from '@/audio/useScreeningAudio';
import { cfg } from '@/config';
import { volumeAt } from '@/engine/calibration';
import { useT } from '@/i18n';
import { Audiometry } from '@/original/Audiometry';
import type { Point } from '@/original/hearing';
import { DS } from '@/original/paper';

const AudiometryTest = ({ audio, onDone }: { audio: ScreeningAudio; onDone: (results: Point[]) => void }) => {
  const t = useT();
  const [playState, setPlayState] = useState(0); // 0: stopped, 1: playing
  const [, setTick] = useState(0); // re-render after the state machine moves
  const [isTestOver, setIsTestOver] = useState(false);
  const earphones = audio.earphones;
  const [audiometry] = useState(() => new Audiometry(cfg));
  const playTone = () => {
    const tone = audiometry.tone();
    if (tone && audio.earphones) audio.playAt(tone.ear, tone.freq, volumeAt(tone.dbfs)); // wired earphones only
  };

  // Earphones pulled out: stop at once. Nothing plays until they are back.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- audio is a new object each render; stop() is stable
  useEffect(() => { if (!earphones) audio.port.stop(); }, [earphones]);

  const start = () => {
    audiometry.start();
    setPlayState(1);
    playTone();
  };

  const updateResponse = (response: boolean) => {
    audio.port.stop();
    const over = audiometry.regResponse(response);
    setIsTestOver(over);
    setTick((n) => n + 1);
    if (over) onDone(audiometry.getResults());
    else playTone();
  };

  const ear = audiometry.getEar();
  return (
    <Card style={styles.container}>
      {!earphones && <Text style={styles.warn}>{t('ds.earphonesNeeded')}</Text>}
      {playState !== 1 && (
        <View>
          <Image style={styles.imageAudio} source={require('@/assets/images/original/atest_icon.jpg')} />
          <Text style={styles.title}>{t('ds.ptaTitle')}</Text>
          <Button style={styles.Button2} mode="contained" onPress={start} disabled={!earphones}>
            <Text style={styles.buttonText}>{t('ds.startTest')}</Text>
          </Button>
        </View>
      )}

      {isTestOver && <ActivityIndicator animating color={DS.red} />}

      {!isTestOver && playState === 1 && (
        <View>
          <Text style={styles.titleTest}>{t('ds.canYouHear')}</Text>
          <Text style={{ width: '100%', fontStyle: 'italic', fontWeight: 'bold' }}>{t('ds.progress')}</Text>
          <ProgressBar progress={audiometry.Fptr / audiometry.MAX_F} style={styles.FBar} />
          <Text style={styles.titleEar}>{t(ear === 'left' ? 'teacher.leftEar' : 'teacher.rightEar')}</Text>
          <Image style={styles.image} source={ear === 'left'
            ? require('@/assets/images/original/left_ear.png') : require('@/assets/images/original/right_ear.png')} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Card style={{ padding: 2, marginVertical: 16, flex: 1 }}>
              <Text style={{ fontStyle: 'italic', fontWeight: 'bold', paddingHorizontal: 6 }}>{t('ds.threshold')}</Text>
              <ProgressBar progress={(audiometry.Aptr + 1) / audiometry.MAX_A} style={styles.TBar} />
            </Card>
            <IconButton style={{ alignSelf: 'center' }} icon="help-circle-outline" size={25}
              onPress={() => Alert.alert(t('ds.threshold'), t('ds.thresholdHelp'))} />
          </View>
          <View style={styles.buttonContainer2}>
            <Button style={styles.ButtonFT} mode="contained" theme={{ colors: { primary: DS.navy } }}>
              <Text style={styles.buttonTextFT}>{audiometry.getFrequency() + ' Hz'}</Text>
            </Button>
            <Button style={styles.ButtonFT} mode="contained" icon="play-circle" disabled={!earphones}
              onPress={() => playTone()}>
              {t('ds.replay')}
            </Button>
            <Button style={styles.ButtonFT} mode="contained" theme={{ colors: { primary: DS.navy } }}>
              <Text style={styles.buttonTextFT}>{audiometry.getThreshold() + ' dB'}</Text>
            </Button>
          </View>
          <View style={styles.buttonContainer}>
            <Button style={styles.ButtonYes} mode="contained" theme={{ colors: { primary: 'green' } }} disabled={!earphones}
              onPress={() => updateResponse(true)}>
              <Text style={styles.buttonText}>{t('common.yes')}</Text>
            </Button>
            <Button style={styles.ButtonNo} mode="contained" theme={{ colors: { primary: 'red' } }} disabled={!earphones}
              onPress={() => updateResponse(false)}>
              <Text style={styles.buttonText}>{t('common.no')}</Text>
            </Button>
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  FBar: { margin: 10 },
  TBar: { margin: 10 },
  container: { backgroundColor: '#fff', padding: 20, borderColor: 'white', borderWidth: 5, borderRadius: 10 },
  imageAudio: { width: 260, height: 260, alignSelf: 'center', marginBottom: 30, borderWidth: 5, borderColor: 'black', borderRadius: 10 },
  image: { width: 220, height: 220, alignSelf: 'center', borderWidth: 5, borderColor: 'black', borderRadius: 10 },
  title: { fontSize: 24, marginBottom: 30, textAlign: 'center', fontWeight: 'bold' },
  titleTest: { fontSize: 24, marginBottom: 5, textAlign: 'center', fontWeight: 'bold' },
  titleEar: { fontSize: 20, textAlign: 'center', fontStyle: 'italic', fontWeight: 'bold', marginBottom: 10, padding: 10 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 },
  buttonContainer2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  ButtonYes: { paddingVertical: 10, marginTop: 20, width: '41%' },
  ButtonFT: { paddingVertical: 1, width: '32%', borderRadius: 50 },
  buttonTextFT: { fontSize: 15, color: 'white' },
  ButtonNo: { paddingVertical: 10, marginTop: 20, width: '41%' },
  Button2: { paddingVertical: 15, marginTop: 20, width: '100%' },
  buttonText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  warn: { color: '#B23C00', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginBottom: 10 },
});

export default AudiometryTest;
