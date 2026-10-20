// Pre-test checklist ("Make sure.."). Copied from DhwaniSarathi audiometer/app/Screens/BeforeTest1.js (Apache-2.0,
// the DhwaniSarathi team), with its six images. Changed by us: Next calls onNext instead of pushing
// /Screens/QuietPlaceDetection; the progress bar is shown only when `progress` is given (the screening flow has its
// own stepper); one app-wide PaperProvider; i18next t() → our useT(); unused state and styles removed.
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button, ProgressBar } from 'react-native-paper';

import { useT, type Key } from '@/i18n';
import { DS } from '@/original/paper';

const ITEMS: [number, Key][] = [
  [require('@/assets/images/original/shh.png'), 'ds.quietPlace'],
  [require('@/assets/images/original/headphones.png'), 'ds.headphones'],
  [require('@/assets/images/original/mute.png'), 'ds.notificationsOff'],
  [require('@/assets/images/original/equalizer.png'), 'ds.equalizerNeutral'],
  [require('@/assets/images/original/silence.png'), 'ds.noTalking'],
  [require('@/assets/images/original/noise-pollution.png'), 'ds.noiseCancelOff'],
];

const BeforeTest1 = ({ onNext, progress }: { onNext: () => void; progress?: number }) => {
  const t = useT();
  return (
    <View style={styles.container}>
      {progress !== undefined && <ProgressBar progress={progress} color={DS.navy} style={{ margin: 15 }} />}
      <Text style={styles.title}>{t('ds.makeSure')}</Text>
      {[0, 2, 4].map((row) => (
        <View key={row} style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {ITEMS.slice(row, row + 2).map(([src, label], i) => (
            <View key={label} style={{ padding: 0, margin: 0, width: '50%' }}>
              <Image style={i === 0 ? styles.image1 : styles.image2} source={src} resizeMode="cover" />
              <Text style={styles.title2}>{t(label)}</Text>
            </View>
          ))}
        </View>
      ))}
      <Button style={styles.button} mode="contained" onPress={onNext}>
        <Text style={styles.buttonText}>{t('ds.next')}</Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'flex-start',
    borderColor: 'white',
    borderWidth: 5,
    borderRadius: 10,
  },
  image1: { width: 90, height: 90, alignSelf: 'center', marginBottom: 10 },
  image2: { width: 83, height: 83, alignSelf: 'center', marginBottom: 15 },
  title: { fontSize: 28, marginBottom: 40, textAlign: 'center', fontWeight: 'bold' }, // marginBottom 65 in the original
  title2: { fontSize: 18, fontWeight: 'bold', alignSelf: 'center', textAlign: 'center', marginBottom: 30 }, // 50
  button: { marginTop: 'auto', paddingVertical: 15, width: '100%', borderColor: 'white' },
  buttonText: { fontSize: 20, color: '#fff' },
});

export default BeforeTest1;
