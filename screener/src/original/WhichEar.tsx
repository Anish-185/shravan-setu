// "Which ear do you hear the sound in?". Idea from DhwaniSarathi audiometer/app/Screens/EarTest.js (Apache-2.0, the
// DhwaniSarathi team): a picture, Play, then Left / Right / None. Ours: OUR left/right check logic (was LrStep in
// src/app/screen/[childId].tsx): a random ear each Play, a 1000 Hz tone at our calibrated screening level through
// wired earphones only, config earphone_check.trials correct answers in a row, a wrong answer starts the count again,
// answers wait for a Play; their left.wav / right.wav replaced by that tone; inline feedback instead of alerts; our
// design and drawing (earbuds marked L and R, the way the child wears them).
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ScreeningAudio } from '@/audio/useScreeningAudio';
import { cfg } from '@/config';
import { useT, type Key } from '@/i18n';
import { Icon } from '@/icons';
import { WhichEarArt } from '@/illustrations';
import { v, type Ear } from '@/rules';
import { Btn, C, EAR, F, Note, s } from '@/ui';

export default function WhichEar({ audio, onDone }: { audio: ScreeningAudio; onDone: (ok: boolean) => void }) {
  const t = useT();
  const trials: number = v(cfg, 'earphone_check', 'trials');
  const [ear, setEar] = useState<Ear | null>(null);
  const [n, setN] = useState(0);
  const [note, setNote] = useState<{ key: Key; vars?: Record<string, number>; ok: boolean } | null>(null);

  function play() {
    if (!audio.earphones) return setNote({ key: 'lr.plugIn', ok: false });
    const side: Ear = Math.random() < 0.5 ? 'left' : 'right';
    setEar(side);
    setNote(null);
    audio.port.play(side, 1000);
  }

  function answer(a: Ear) {
    audio.port.stop();
    if (!ear) return;
    setEar(null);
    if (a !== ear) {
      setN(0);
      return setNote({ key: 'lr.wrong', ok: false });
    }
    if (n + 1 >= trials) return onDone(true);
    setN(n + 1);
    setNote({ key: 'lr.correct', vars: { n: n + 1, total: trials }, ok: true });
  }

  return (
    <View style={{ gap: 16 }}>
      <Text accessibilityRole="header" style={st.title}>{t('ds.whichEar')}</Text>
      <View style={{ alignItems: 'center' }}><WhichEarArt size={170} /></View>
      <View style={st.dots} accessible accessibilityLabel={t('ds.correctSoFar', { n, total: trials })}>
        {Array.from({ length: trials }, (_, i) => <View key={i} style={[st.dot, i < n && st.dotOn]} />)}
        <Text style={s.muted}>{t('ds.correctSoFar', { n, total: trials })}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={play} style={({ pressed }) => [st.play, pressed && s.pressed]}>
        <Icon name="play" size={26} color={C.night} />
        <Text style={st.playText}>{t('ds.play')}</Text>
      </Pressable>
      <View style={st.answers}>
        {(['left', 'right'] as const).map((e) => (
          <Pressable key={e} accessibilityRole="button" accessibilityState={{ disabled: !ear }} disabled={!ear} onPress={() => answer(e)}
            style={({ pressed }) => [st.answer, { borderColor: EAR[e], backgroundColor: e === 'left' ? C.indigoTint : '#FCE6D9' },
              !ear && { opacity: 0.4 }, pressed && s.pressed]}>
            <Text style={[st.answerLetter, { backgroundColor: EAR[e] }]}>{e === 'left' ? 'L' : 'R'}</Text>
            <Text style={st.answerText}>{t(e === 'left' ? 'lr.left' : 'lr.right')}</Text>
          </Pressable>
        ))}
      </View>
      <Btn kind="plain" title={t('ds.none')} onPress={() => {
        audio.port.stop();
        setEar(null);
        setN(0);
        setNote({ key: 'ds.noneHeard', ok: false });
      }} />
      {note && <Note icon={note.ok ? 'circle-check' : 'info'} color={note.ok ? C.okText : C.warnText} text={t(note.key, note.vars)} />}
    </View>
  );
}

const st = StyleSheet.create({
  title: { color: C.night, fontFamily: F.title, fontSize: 26, lineHeight: 40 },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.indigo },
  dotOn: { backgroundColor: C.indigo },
  play: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.marigold, borderRadius: 999,
    paddingHorizontal: 28, minHeight: 60 },
  playText: { color: C.night, fontFamily: F.uiBold, fontSize: 18, lineHeight: 30 },
  answers: { flexDirection: 'row', gap: 12 },
  answer: { flex: 1, alignItems: 'center', gap: 6, borderWidth: 2, borderRadius: 20, paddingVertical: 14, minHeight: 96 },
  answerLetter: { color: C.white, fontFamily: F.uiBold, fontSize: 18, lineHeight: 34, width: 34, height: 34, borderRadius: 17,
    textAlign: 'center', overflow: 'hidden' },
  answerText: { color: C.night, fontFamily: F.uiBold, fontSize: 17, lineHeight: 28 },
});
