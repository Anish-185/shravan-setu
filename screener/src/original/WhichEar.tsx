// "Which ear do you hear the sound in?": ear illustration, Play, then Left / Right / None?. Copied from DhwaniSarathi
// audiometer/app/Screens/EarTest.js (Apache-2.0, the DhwaniSarathi team). Changed by us: OUR left/right check logic
// (was LrStep in src/app/screen/[childId].tsx): a random ear each Play, a 1000 Hz tone at our calibrated screening
// level through wired earphones only, config earphone_check.trials correct answers in a row, a wrong answer starts
// the count again; their left.wav / right.wav at volume 0.1 replaced by that tone; answers wait for a Play; the
// alerts say our messages; Card / PaperProvider wrappers dropped (one app-wide provider); i18next → useT().
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Button, ProgressBar } from 'react-native-paper';

import { cfg } from '@/config';
import { useT } from '@/i18n';
import { DS } from '@/original/paper';
import { v, type Ear } from '@/rules';
import type { ScreeningAudio } from '@/audio/useScreeningAudio';

const EarTest = ({ audio, onDone, progress }: { audio: ScreeningAudio; onDone: (ok: boolean) => void; progress?: number }) => {
  const t = useT();
  const trials: number = v(cfg, 'earphone_check', 'trials');
  const [ear, setEar] = useState<Ear | null>(null);
  const [n, setN] = useState(0);

  function play() {
    if (!audio.earphones) return Alert.alert(t('lr.plugIn'));
    const side: Ear = Math.random() < 0.5 ? 'left' : 'right';
    setEar(side);
    audio.port.play(side, 1000);
  }

  function answer(a: Ear) {
    audio.port.stop();
    if (!ear) return;
    setEar(null);
    if (a !== ear) {
      setN(0);
      return Alert.alert(t('lr.wrong'));
    }
    if (n + 1 >= trials) return onDone(true);
    setN(n + 1);
    Alert.alert(t('lr.correct', { n: n + 1, total: trials }));
  }

  return (
    <View style={styles.container}>
      {progress !== undefined && <ProgressBar progress={progress} color={DS.navy} style={{ margin: 15, marginVertical: 20 }} />}
      <Text style={styles.titleTest}>{t('ds.whichEar')}</Text>
      <Image style={styles.image} source={require('@/assets/images/original/questionmark.jpg')} />
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Button style={[styles.ButtonNo, { width: '40%', marginBottom: 0, backgroundColor: '#EB455F' }]} mode="contained"
          onPress={play}>
          <Text style={styles.buttonText}>{t('ds.play')}</Text>
        </Button>
      </View>
      <View style={styles.buttonContainer}>
        <Button style={styles.ButtonYes} mode="contained" theme={{ colors: { primary: 'green' } }} disabled={!ear}
          onPress={() => answer('left')}>
          <Text style={styles.buttonText}>{t('lr.left')}</Text>
        </Button>
        <Button style={styles.ButtonNo} mode="contained" theme={{ colors: { primary: 'blue' } }} disabled={!ear}
          onPress={() => answer('right')}>
          <Text style={styles.buttonText}>{t('lr.right')}</Text>
        </Button>
        <Button style={styles.ButtonNo} mode="contained" theme={{ colors: { primary: 'grey' } }}
          onPress={() => { audio.port.stop(); setEar(null); setN(0); Alert.alert(t('ds.noneHeard')); }}>
          <Text style={styles.buttonText}>{t('ds.none')}</Text>
        </Button>
      </View>
      <Text style={styles.count}>{t('ds.correctSoFar', { n, total: trials })}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 2, borderColor: 'white', borderWidth: 5, borderRadius: 10 },
  image: { width: 250, height: 250, alignSelf: 'center', borderWidth: 5, borderColor: 'black', borderRadius: 10, marginBottom: 20 },
  titleTest: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold', color: '#EB455F' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 },
  ButtonYes: { paddingVertical: 1, marginTop: 20, marginHorizontal: 5, width: '30%' },
  ButtonNo: { paddingVertical: 1, marginHorizontal: 5, marginTop: 20, width: '30%' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: 'white' }, // 20 in the original; Telugu labels need room
  count: { textAlign: 'center', fontSize: 15, color: DS.navy },
});

export default EarTest;
