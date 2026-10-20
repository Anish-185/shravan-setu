// The detailed (threshold) test screen. Ideas from DhwaniSarathi audiometer/app/AudiometryTest.js (Apache-2.0, the
// DhwaniSarathi team): a start card, "Can you hear the sound?", a progress bar, the ear under test with a head
// picture, a threshold bar with help, frequency / Replay / dB chips, and Yes / No. Ours: tones play through OUR
// calibrated player (team baseline + level, src/original/Audiometry.ts) and only while wired earphones are detected
// (never through the speaker); the first tone plays on Start; no masked phase; results go to onDone; progress covers
// both ears; our design and drawings (src/illustrations.tsx).
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ScreeningAudio } from '@/audio/useScreeningAudio';
import { cfg } from '@/config';
import { volumeAt } from '@/engine/calibration';
import { useT } from '@/i18n';
import { Icon } from '@/icons';
import { HeadEar, TestStart } from '@/illustrations';
import { Audiometry } from '@/original/Audiometry';
import type { Point } from '@/original/hearing';
import { Bar, Btn, C, Card, EAR, F, Note, s } from '@/ui';

export default function AudiometryTest({ audio, onDone }: { audio: ScreeningAudio; onDone: (results: Point[]) => void }) {
  const t = useT();
  const [playing, setPlaying] = useState(false);
  const [, setTick] = useState(0); // re-render after the state machine moves
  const [over, setOver] = useState(false);
  const [help, setHelp] = useState(false);
  const earphones = audio.earphones;
  const [audiometry] = useState(() => new Audiometry(cfg));
  const playTone = () => {
    const tone = audiometry.tone();
    if (tone && audio.earphones) audio.playAt(tone.ear, tone.freq, volumeAt(tone.dbfs)); // wired earphones only
  };

  // Earphones pulled out: stop at once. Nothing plays until they are back (then Replay).
  // eslint-disable-next-line react-hooks/exhaustive-deps -- audio is a new object each render; stop() is stable
  useEffect(() => { if (!earphones) audio.port.stop(); }, [earphones]);

  const start = () => {
    audiometry.start();
    setPlaying(true);
    playTone();
  };

  const respond = (heard: boolean) => {
    audio.port.stop();
    const done = audiometry.regResponse(heard);
    setOver(done);
    setTick((n) => n + 1);
    if (done) onDone(audiometry.getResults());
    else playTone();
  };

  if (!playing) return (
    <View style={{ gap: 16, alignItems: 'center' }}>
      <TestStart size={190} />
      <Text accessibilityRole="header" style={[st.title, { textAlign: 'center' }]}>{t('ds.ptaTitle')}</Text>
      {!earphones && <Note icon="headphones" color={C.warnText} text={t('ds.earphonesNeeded')} />}
      <View style={{ alignSelf: 'stretch' }}><Btn icon="play" title={t('ds.startTest')} onPress={start} disabled={!earphones} /></View>
    </View>
  );
  if (over) return <ActivityIndicator animating color={C.indigo} size="large" />;

  const ear = audiometry.getEar();
  const progress = (audiometry.Eptr * audiometry.MAX_F + audiometry.Fptr) / (audiometry.MAX_E * audiometry.MAX_F);
  return (
    <View style={{ gap: 14 }}>
      <Text accessibilityRole="header" style={st.title}>{t('ds.canYouHear')}</Text>
      <View style={{ gap: 6 }}>
        <Text style={st.small}>{t('ds.progress')}</Text>
        <Bar value={progress} />
      </View>
      <View style={st.earRow}>
        <HeadEar ear={ear} size={150} />
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={[st.earName, { color: EAR[ear] }]}>{t(ear === 'left' ? 'teacher.leftEar' : 'teacher.rightEar')}</Text>
          <View style={st.chip}><Text style={st.chipText}>{`${audiometry.getFrequency()} Hz`}</Text></View>
          <View style={st.chip}><Text style={st.chipText}>{`${audiometry.getThreshold()} dB`}</Text></View>
        </View>
      </View>
      <Card style={{ gap: 8 }}>
        <View style={st.helpRow}>
          <Text style={[st.small, { flex: 1 }]}>{t('ds.threshold')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('ds.threshold')} hitSlop={10} onPress={() => setHelp(!help)}>
            <Icon name="circle-help" size={22} color={C.indigo} />
          </Pressable>
        </View>
        <Bar value={(audiometry.Aptr + 1) / audiometry.MAX_A} color={EAR[ear]} />
        {help && <Text style={s.muted}>{t('ds.thresholdHelp')}</Text>}
      </Card>
      {!earphones && <Note icon="headphones" color={C.warnText} text={t('ds.earphonesNeeded')} />}
      <Pressable accessibilityRole="button" disabled={!earphones} onPress={playTone}
        style={({ pressed }) => [st.replay, !earphones && { opacity: 0.4 }, pressed && s.pressed]}>
        <Icon name="circle-play" size={22} color={C.indigo} />
        <Text style={st.replayText}>{t('ds.replay')}</Text>
      </Pressable>
      <View style={st.answers}>
        <Pressable accessibilityRole="button" disabled={!earphones} onPress={() => respond(true)}
          style={({ pressed }) => [st.answer, { backgroundColor: C.indigo }, !earphones && { opacity: 0.4 }, pressed && s.pressed]}>
          <Icon name="check" size={26} color={C.white} stroke={2.4} />
          <Text style={[st.answerText, { color: C.white }]}>{t('common.yes')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={!earphones} onPress={() => respond(false)}
          style={({ pressed }) => [st.answer, st.no, !earphones && { opacity: 0.4 }, pressed && s.pressed]}>
          <Icon name="x" size={26} color={C.night} stroke={2.4} />
          <Text style={st.answerText}>{t('common.no')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  title: { color: C.night, fontFamily: F.title, fontSize: 26, lineHeight: 40 },
  small: { color: C.dusk, fontFamily: F.uiBold, fontSize: 14, lineHeight: 24 },
  earRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  earName: { fontFamily: F.title, fontSize: 24, lineHeight: 38 },
  chip: { alignSelf: 'flex-start', backgroundColor: C.night, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 4 },
  chipText: { color: C.white, fontFamily: F.uiBold, fontSize: 16, lineHeight: 27 },
  helpRow: { flexDirection: 'row', alignItems: 'center' },
  replay: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: C.indigo,
    borderRadius: 999, paddingHorizontal: 20, minHeight: 48, backgroundColor: C.white },
  replayText: { color: C.indigo, fontFamily: F.uiBold, fontSize: 16, lineHeight: 27 },
  answers: { flexDirection: 'row', gap: 12 },
  answer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 72, borderRadius: 22 },
  no: { backgroundColor: C.white, borderWidth: 2, borderColor: C.night },
  answerText: { color: C.night, fontFamily: F.uiBold, fontSize: 20, lineHeight: 32 },
});
