// One screening session: consent -> "Make sure.." checklist -> device check -> left/right check -> room noise -> test
// (child mode) -> result -> triage (on REFER). Screening only, never a diagnosis. Everything is saved locally first and queued for sync.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useScreeningAudio } from '@/audio/useScreeningAudio';
import { isPlaceholder, useVoice } from '@/audio/voice';
import { Arch, Stepper } from '@/art';
import { Celebration, ChildMode } from '@/child';
import { cfg, CONFIG_VERSION } from '@/config';
import { db } from '@/db';
import { get } from '@/db/store';
import { createEngine, type Engine, type Snapshot } from '@/engine/engine';
import { useT, type Key } from '@/i18n';
import { Icon } from '@/icons';
import BeforeTest1 from '@/original/MakeSure';
import QuietPlaceDetection, { type Ambient } from '@/original/Surrounding';
import EarTest from '@/original/WhichEar';
import { ResultStep } from '@/result';
import { saveSession } from '@/session';
import { ConsentStep, DeviceStep } from '@/steps';
import { Btn, C, F, H, P, s, VoiceBtn } from '@/ui';

type Step = 'consent' | 'checklist' | 'device' | 'lr' | 'ambient' | 'test' | 'result';
const STEPS: Key[] = ['consent.h', 'device.h', 'lr.h', 'ambient.h', 'test.h']; // the bridge-arch stepper's posts
type Audio = ReturnType<typeof useScreeningAudio>;
type Voice = ReturnType<typeof useVoice>;

export default function Screen() {
  const t = useT();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const child = get<{ display_name: string; school: string }>(db, 'child', childId);
  const audio = useScreeningAudio(cfg);
  const voice = useVoice(cfg);
  const [step, setStep] = useState<Step>('consent');
  const [consentId, setConsentId] = useState('');
  const [micStart, setMicStart] = useState(0);
  const [lrPassed, setLrPassed] = useState<boolean | null>(null);
  const [ambient, setAmbient] = useState<Ambient | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [startedAt, setStartedAt] = useState('');
  const engine = useRef<Engine | null>(null);
  const saved = useRef<{ sessionId: string; caseId: string | null } | null>(null);
  const [celebrated, setCelebrated] = useState(false);
  const endCelebration = useCallback(() => setCelebrated(true), []);

  // Leaving mid-session stops the engine's timers. useScreeningAudio itself stops the mic, deletes the recording
  // and releases the recorder on unmount, in that order (ERR-021).
  useEffect(() => () => engine.current?.abort(), []);

  if (!child) return <P>{t('screen.notFound')}</P>;

  // Child mode and the celebration fill the screen (no header); the result is mounted, and saved, under the
  // celebration as before, so leaving early never loses a session.
  const childMode = step === 'test' && !!snap && snap.phase !== 'paused';
  const celebrating = step === 'result' && !celebrated;
  // The original "Make sure.." checklist sits on the device post of the stepper.
  const stepNo = ['consent', 'device', 'lr', 'ambient', 'test'].indexOf(step === 'checklist' ? 'device' : step) + 1;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: !childMode && !celebrating }} />
      {childMode ? (
        <ChildMode snap={snap} error={audio.error ?? ''} onTap={() => engine.current?.onTap(Date.now())} />
      ) : (
    <ScrollView contentContainerStyle={s.screen}>
      {step === 'result' ? <H>{child.display_name}</H> : (
        <View style={st.who}>
          <Icon name="user-round" size={20} color={C.dusk} />
          <Text style={st.whoText}>{child.display_name}</Text>
        </View>
      )}
      {stepNo > 0 && <Stepper current={stepNo} label={t(STEPS[stepNo - 1])} />}
      {!!audio.error && <Text style={s.warn}>{audio.error}</Text>}
      {step === 'consent' && (
        <ConsentStep childId={childId} onDone={(id) => { setConsentId(id); setStep('checklist'); }} />
      )}
      {step === 'checklist' && (
        <BeforeTest1 onNext={() => setStep('device')} />
      )}
      {step === 'device' && (
        <DeviceStep audio={audio} onMic={setMicStart} onDone={() => setStep('lr')} />
      )}
      {step === 'lr' && (
        <LrStep audio={audio} voice={voice} onDone={(ok) => { setLrPassed(ok); setStep('ambient'); }} />
      )}
      {step === 'ambient' && (
        <AmbientStep audio={audio} voice={voice} micStart={micStart} onDone={(a) => { setAmbient(a); setStep('test'); }} />
      )}
      {step === 'test' && ambient && (
        <TestStep
          snap={snap}
          voice={voice}
          onStart={() => {
            setStartedAt(new Date().toISOString());
            const e = createEngine(cfg, audio.port, {
              include500: ambient.include500, micStartMs: micStart, earphones: audio.earphones,
              deviceChangesMs: audio.deviceChanges(),
            }, (sn) => {
              setSnap(sn);
              if (sn.phase === 'done') {
                voice.play(['done']);
                setStep('result');
              }
            });
            engine.current = e;
            audio.setListeners({ onSample: e.onSample, onEarphones: e.onEarphones, onPlaybackStart: e.onPlaybackStart });
            e.start();
          }}
          onResume={() => engine.current?.resume()}
        />
      )}
      {step === 'result' && snap?.result && (
        <ResultStep
          snap={snap}
          childId={childId}
          calibrated={audio.calibrated}
          provisional={audio.provisional}
          onSave={() => {
            if (saved.current) return saved.current;
            const log = engine.current?.log();
            audio.stopMic();
            saved.current = saveSession(db, {
              childId, school: child.school, consentId, startedAt, lrPassed, ambientDb: ambient?.db ?? null,
              calibrated: audio.calibrated, provisional: audio.provisional, result: snap.result!, log, ambientReason: ambient?.reason ?? '',
              device: { brand: Device.brand, model: Device.modelName, os: `${Device.osName} ${Device.osVersion}` },
              appVersion: Constants.expoConfig?.version ?? '', configVersion: CONFIG_VERSION,
            });
            return saved.current;
          }}
        />
      )}
    </ScrollView>
      )}
      {celebrating && <Celebration onEnd={endCelebration} />}
    </View>
  );
}

// Left/right check and room noise: the original DhwaniSarathi "Which ear" and "Check your surrounding" screens
// (src/original/), running our logic, with our voice line above.
function LrStep({ audio, voice, onDone }: { audio: Audio; voice: Voice; onDone: (ok: boolean) => void }) {
  return (
    <View style={st.step}>
      <VoiceBtn onPress={() => voice.play(['lr'])} placeholder={isPlaceholder(['lr'])} />
      <EarTest audio={audio} onDone={onDone} />
    </View>
  );
}

function AmbientStep({ audio, voice, micStart, onDone }: {
  audio: Audio; voice: Voice; micStart: number; onDone: (a: Ambient) => void;
}) {
  return (
    <View style={st.step}>
      <VoiceBtn onPress={() => voice.play(['quiet'])} placeholder={isPlaceholder(['quiet'])} />
      <QuietPlaceDetection audio={audio} micStart={micStart} onContinue={onDone} />
    </View>
  );
}

// Step 5, before the test: the teacher reads the instruction aloud (quote style), then hands over the phone. The
// running test is child mode (src/child.tsx), drawn by the screen above; a pause comes back here for the teacher.
function TestStep({ snap, voice, onStart, onResume }: {
  snap: Snapshot | null; voice: Voice; onStart: () => void; onResume: () => void;
}) {
  const t = useT();
  if (!snap) {
    const parts = t('test.teacher').split(/[“”]/); // [before, the words to say, after]
    return (
      <View style={st.step}>
        <H>{t('test.h')}</H>
        {parts.length === 3 ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.muted}>{parts[0].trim()}</Text>
              <Text style={st.quote}>“{parts[1]}”</Text>
              <Text style={s.muted}>{parts[2].trim()}</Text>
            </View>
            <Arch width={96} height={178} bg={C.dawn} source={require('../../../assets/images/peeps/test-intro.png')}
              imgWidth={109} imgHeight={230} offset={-60} />
          </View>
        ) : <P>{t('test.teacher')}</P>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}><Btn kind="plain" title={t('test.playVoice')} onPress={() => voice.play(['intro', 'tap'])} /></View>
          <VoiceBtn onPress={() => voice.play(['intro', 'tap'])} placeholder={isPlaceholder(['intro', 'tap'])} />
        </View>
        <Btn icon="play" title={t('test.start')} onPress={onStart} />
      </View>
    );
  }
  return (
    <View style={st.step}>
      <Text style={s.warn}>{t(snap.earphones ? 'test.pausedChanged' : 'test.disconnected')}</Text>
      <Btn title={t('test.resume')} onPress={onResume} disabled={!snap.earphones} />
    </View>
  );
}

const st = StyleSheet.create({
  step: { gap: 14 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  whoText: { color: C.dusk, fontFamily: F.uiBold, fontSize: 16, lineHeight: 27 },
  quote: { color: C.night, fontFamily: F.quote, fontSize: 20, lineHeight: 34, borderLeftWidth: 4, borderLeftColor: C.marigold,
    paddingLeft: 14, paddingVertical: 4, marginVertical: 10 },
});
