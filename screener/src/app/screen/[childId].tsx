// One screening session: consent -> device check -> left/right check -> room noise -> test (child mode) -> result
// -> triage (on REFER). Screening only, never a diagnosis. Everything is saved locally first and queued for sync.
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useScreeningAudio } from '@/audio/useScreeningAudio';
import { isPlaceholder, useVoice } from '@/audio/voice';
import { Arch, Stepper } from '@/art';
import { Celebration, ChildMode } from '@/child';
import { cfg, CONFIG_VERSION } from '@/config';
import { db } from '@/db';
import { get, kvGet, put } from '@/db/store';
import { createEngine, type Engine, type Snapshot } from '@/engine/engine';
import { useT, type Key } from '@/i18n';
import { Icon } from '@/icons';
import { ambientLevel, apply500HzPolicy, v, type Ear, type Sample } from '@/rules';
import { ResultStep } from '@/result';
import { saveSession } from '@/session';
import { Banner, Btn, C, Card, Check, Chips, F, H, P, Pill, s, VoiceBtn } from '@/ui';

type Step = 'consent' | 'device' | 'lr' | 'ambient' | 'test' | 'result';
const STEPS: Key[] = ['consent.h', 'device.h', 'lr.h', 'ambient.h', 'test.h']; // the bridge-arch stepper's posts
type Audio = ReturnType<typeof useScreeningAudio>;
type Voice = ReturnType<typeof useVoice>;
const GIVEN_BY = ['parent', 'guardian'] as const;
const METHODS = ['written', 'verbal', 'school_form'] as const;

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
  const [ambient, setAmbient] = useState<{ db: number | null; include500: boolean; reason: string } | null>(null);
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
  const stepNo = ['consent', 'device', 'lr', 'ambient', 'test'].indexOf(step) + 1;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: !childMode && !celebrating }} />
      {childMode ? (
        <ChildMode snap={snap} error={audio.error ?? ''} onTap={() => engine.current?.onTap(Date.now())} />
      ) : (
    <ScrollView contentContainerStyle={s.screen}>
      <Banner />
      {step === 'result' ? <H>{child.display_name}</H> : (
        <View style={st.who}>
          <Icon name="user-round" size={20} color={C.dusk} />
          <Text style={st.whoText}>{child.display_name}</Text>
        </View>
      )}
      {stepNo > 0 && <Stepper current={stepNo} label={t(STEPS[stepNo - 1])} />}
      {!!audio.error && <Text style={s.warn}>{audio.error}</Text>}
      {step === 'consent' && (
        <ConsentStep childId={childId} onDone={(id) => { setConsentId(id); setStep('device'); }} />
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
          calibrated={audio.calibrated}
          onSave={() => {
            if (saved.current) return saved.current;
            const log = engine.current?.log();
            audio.stopMic();
            saved.current = saveSession(db, {
              childId, school: child.school, consentId, startedAt, lrPassed, ambientDb: ambient?.db ?? null,
              calibrated: audio.calibrated, result: snap.result!, log, ambientReason: ambient?.reason ?? '',
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

function ConsentStep({ childId, onDone }: { childId: string; onDone: (consentId: string) => void }) {
  const t = useT();
  const [by, setBy] = useState<(typeof GIVEN_BY)[number] | null>(null);
  const [method, setMethod] = useState<(typeof METHODS)[number] | null>(null);
  return (
    <View style={st.step}>
      <H>{t('consent.h')}</H>
      <Text style={s.muted}>{t('consent.p')}</Text>
      <Card>
        <Chips options={GIVEN_BY} value={by} onChange={setBy} label={(o) => t(`consent.by.${o}`)} />
        <View style={st.rule} />
        <Chips options={METHODS} value={method} onChange={setMethod} label={(o) => t(`consent.method.${o}`)} />
      </Card>
      <Btn icon="signature" title={t('consent.continue')} disabled={!by || !method} onPress={() => {
        const id = Crypto.randomUUID();
        put(db, 'consent', id, { child: childId, given_by: by, method, given_at: new Date().toISOString() });
        onDone(id);
      }} />
      <Btn kind="plain" title={t('consent.stop')} onPress={() => router.back()} />
    </View>
  );
}

function DeviceStep({ audio, onMic, onDone }: { audio: Audio; onMic: (t: number) => void; onDone: () => void }) {
  const t = useT();
  const [volumeOk, setVolumeOk] = useState(false);
  const [btOff, setBtOff] = useState(false);
  const earphone = kvGet(db, 'earphone_model');
  const volume = kvGet(db, 'volume_setting');

  useEffect(() => {
    // The mic runs from here to the end of the session: earphone detection and noise gating both need it.
    audio.startMic().then((ms) => ms !== null && onMic(ms)).catch(() => {}); // the error is shown via audio.error
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={st.step}>
      <H>{t('device.h')}</H>
      <Card>
        <P>{t('device.phone', { model: Device.modelName ?? '?' })}</P>
        <P>{t('device.earphones', { model: earphone || t('device.notSetSettings') })}</P>
        <P>{t('device.volume', { setting: volume || t('device.notSetSettings') })}</P>
      </Card>
      {audio.micOn && audio.earphones
        ? <Pill icon="headphones" text={t('device.detected')} tint={C.okTint} color={C.okText} />
        : <Text style={s.warn}>{audio.micOn ? t('device.notDetected') : t('device.micStarting')}</Text>}
      <Check label={t('device.volumeOk', { setting: volume || '?' })} value={volumeOk} onChange={setVolumeOk} />
      <Check label={t('device.btOff')} value={btOff} onChange={setBtOff} />
      <Btn title={t('common.continue')} onPress={onDone}
        disabled={!audio.earphones || !volumeOk || !btOff || !earphone || !volume} />
    </View>
  );
}

// Left/right check, idea ported from the original DhwaniSarathi EarTest screen (Apache-2.0, see ATTRIBUTION.md).
function LrStep({ audio, voice, onDone }: { audio: Audio; voice: Voice; onDone: (ok: boolean) => void }) {
  const t = useT();
  const trials: number = v(cfg, 'earphone_check', 'trials');
  const [side, setSide] = useState<Ear | null>(null);
  const [n, setN] = useState(0);
  const [msg, setMsg] = useState('');

  function play() {
    if (!audio.earphones) return setMsg(t('lr.plugIn'));
    const ear: Ear = Math.random() < 0.5 ? 'left' : 'right';
    setSide(ear);
    setMsg('');
    audio.port.play(ear, 1000);
  }

  function answer(a: Ear) {
    if (!side) return;
    if (a !== side) {
      setN(0);
      setSide(null);
      return setMsg(t('lr.wrong'));
    }
    setSide(null);
    if (n + 1 >= trials) return onDone(true);
    setN(n + 1);
    setMsg(t('lr.correct', { n: n + 1, total: trials }));
  }

  return (
    <View style={st.step}>
      <H>{t('lr.h')}</H>
      <Text style={s.muted}>{t('lr.p')}</Text>
      <VoiceBtn onPress={() => voice.play(['lr'])} placeholder={isPlaceholder(['lr'])} />
      <Btn icon="play" title={t('lr.play')} onPress={play} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Btn title={t('lr.left')} disabled={!side} onPress={() => answer('left')} /></View>
        <View style={{ flex: 1 }}><Btn title={t('lr.right')} disabled={!side} onPress={() => answer('right')} /></View>
      </View>
      {!!msg && <P>{msg}</P>}
    </View>
  );
}

function AmbientStep({ audio, voice, micStart, onDone }: {
  audio: Audio; voice: Voice; micStart: number;
  onDone: (a: { db: number | null; include500: boolean; reason: string }) => void;
}) {
  const t = useT();
  const [result, setResult] = useState<{ db: number | null; include500: boolean; reason: string } | null>(null);
  const [measuring, setMeasuring] = useState(false);

  function measure() {
    const samples: Sample[] = [];
    setMeasuring(true);
    audio.setListeners({ onSample: (dB, at) => samples.push({ t: at, db: dB }) });
    void audio.warmUp(); // silent (volume 0), done well within the measurement; cuts the first tone's start delay
    const wait = Math.max(0, micStart + v(cfg, 'noise', 'mic_settle_ms') - Date.now()) + v(cfg, 'noise', 'ambient_measure_ms');
    setTimeout(() => {
      audio.setListeners({});
      const amb = ambientLevel(samples, micStart, audio.deviceChanges(), cfg);
      const pol = apply500HzPolicy(amb.db_re_reference, cfg);
      setResult({ db: amb.db_re_reference, include500: pol.include, reason: pol.reason });
      setMeasuring(false);
    }, wait);
  }

  const noisy = result?.db != null && result.db > v(cfg, 'noise', 'gate_db_above_baseline');
  return (
    <View style={st.step}>
      <H>{t('ambient.h')}</H>
      <Text style={s.muted}>{t('ambient.p')}</Text>
      <VoiceBtn onPress={() => voice.play(['quiet'])} placeholder={isPlaceholder(['quiet'])} />
      <Btn title={t(measuring ? 'ambient.measuring' : 'ambient.measure')} onPress={measure} disabled={measuring} />
      {result && (
        <>
          <Card>
            <P>{result.db === null ? t('ambient.couldNot') : t('ambient.value', { value: result.db.toFixed(1) })}</P>
            <Text style={s.muted}>{t.reason(result.reason)}</Text>
          </Card>
          {noisy && <Text style={s.warn}>{t('ambient.noisy')}</Text>}
          <Btn title={t('ambient.continue')} onPress={() => onDone(result)} />
        </>
      )}
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
  rule: { height: 1, backgroundColor: C.lilac },
  quote: { color: C.night, fontFamily: F.quote, fontSize: 20, lineHeight: 34, borderLeftWidth: 4, borderLeftColor: C.marigold,
    paddingLeft: 14, paddingVertical: 4, marginVertical: 10 },
});
