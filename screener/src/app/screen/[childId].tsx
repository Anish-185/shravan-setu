// One screening session: consent -> device check -> left/right check -> room noise -> test -> result.
// Screening only, never a diagnosis. Everything is saved locally first and queued for sync.
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { File, Paths } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useScreeningAudio } from '@/audio/useScreeningAudio';
import { cfg, CONFIG_VERSION } from '@/config';
import { db } from '@/db';
import { get, kvGet, put } from '@/db/store';
import { createEngine, type Engine, type Snapshot } from '@/engine/engine';
import { ambientLevel, apply500HzPolicy, v, type Ear, type Sample } from '@/rules';
import { Banner, Btn, Check, Chips, H, P, s } from '@/ui';

type Step = 'consent' | 'device' | 'lr' | 'ambient' | 'test' | 'result';
const GIVEN_BY = ['parent', 'guardian'] as const;
const METHODS = ['written', 'verbal', 'school_form'] as const;

export default function Screen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const child = get<{ display_name: string; school: string }>(db, 'child', childId);
  const audio = useScreeningAudio(cfg);
  const [step, setStep] = useState<Step>('consent');
  const [consentId, setConsentId] = useState('');
  const [micStart, setMicStart] = useState(0);
  const [lrPassed, setLrPassed] = useState<boolean | null>(null);
  const [ambient, setAmbient] = useState<{ db: number | null; include500: boolean; reason: string } | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [startedAt, setStartedAt] = useState('');
  const engine = useRef<Engine | null>(null);
  const sessionId = useRef('');

  // Leaving mid-session stops the engine's timers. useScreeningAudio itself stops the mic, deletes the recording
  // and releases the recorder on unmount, in that order (ERR-021).
  useEffect(() => () => engine.current?.abort(), []);

  if (!child) return <P>Child not found.</P>;

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Banner />
      <H>{child.display_name}</H>
      {!!audio.error && <Text style={s.warn}>{audio.error}</Text>}
      {step === 'consent' && (
        <ConsentStep childId={childId} onDone={(id) => { setConsentId(id); setStep('device'); }} />
      )}
      {step === 'device' && (
        <DeviceStep audio={audio} onMic={setMicStart} onDone={() => setStep('lr')} />
      )}
      {step === 'lr' && (
        <LrStep audio={audio} onDone={(ok) => { setLrPassed(ok); setStep('ambient'); }} />
      )}
      {step === 'ambient' && (
        <AmbientStep audio={audio} micStart={micStart} onDone={(a) => { setAmbient(a); setStep('test'); }} />
      )}
      {step === 'test' && ambient && (
        <TestStep
          snap={snap}
          onStart={() => {
            setStartedAt(new Date().toISOString());
            const e = createEngine(cfg, audio.port, {
              include500: ambient.include500, micStartMs: micStart, earphones: audio.earphones,
              deviceChangesMs: audio.deviceChanges(),
            }, (sn) => {
              setSnap(sn);
              if (sn.phase === 'done') setStep('result');
            });
            engine.current = e;
            audio.setListeners({ onSample: e.onSample, onEarphones: e.onEarphones });
            e.start();
          }}
          onTap={() => engine.current?.onTap(Date.now())}
          onResume={() => engine.current?.resume()}
        />
      )}
      {step === 'result' && snap?.result && (
        <ResultStep
          snap={snap}
          calibrated={audio.calibrated}
          onSave={() => {
            if (sessionId.current) return sessionId.current;
            const log = engine.current?.log();
            audio.stopMic();
            sessionId.current = saveSession({
              childId, school: child.school, consentId, startedAt, lrPassed, ambientDb: ambient?.db ?? null,
              calibrated: audio.calibrated, result: snap.result!, log, ambientReason: ambient?.reason ?? '',
            });
            return sessionId.current;
          }}
        />
      )}
    </ScrollView>
  );
}

function ConsentStep({ childId, onDone }: { childId: string; onDone: (consentId: string) => void }) {
  const [by, setBy] = useState<(typeof GIVEN_BY)[number] | null>(null);
  const [method, setMethod] = useState<(typeof METHODS)[number] | null>(null);
  return (
    <View style={s.screen}>
      <H>1. Consent</H>
      <P>Consent must be recorded before any test. Who gave it, and how?</P>
      <Chips options={GIVEN_BY} value={by} onChange={setBy} />
      <Chips options={METHODS} value={method} onChange={setMethod} />
      <Btn title="Consent given: continue" disabled={!by || !method} onPress={() => {
        const id = Crypto.randomUUID();
        put(db, 'consent', id, { child: childId, given_by: by, method, given_at: new Date().toISOString() });
        onDone(id);
      }} />
      <Btn kind="plain" title="No consent: stop" onPress={() => router.back()} />
    </View>
  );
}

function DeviceStep({ audio, onMic, onDone }: {
  audio: ReturnType<typeof useScreeningAudio>; onMic: (t: number) => void; onDone: () => void;
}) {
  const [volumeOk, setVolumeOk] = useState(false);
  const [btOff, setBtOff] = useState(false);
  const earphone = kvGet(db, 'earphone_model');
  const volume = kvGet(db, 'volume_setting');

  useEffect(() => {
    // The mic runs from here to the end of the session: earphone detection and noise gating both need it.
    audio.startMic().then((t) => t !== null && onMic(t)).catch(() => {}); // the error is shown via audio.error
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={s.screen}>
      <H>2. Device check</H>
      <P>Phone: {Device.modelName ?? 'unknown'}</P>
      <P>Earphones: {earphone || 'not set (Settings)'}</P>
      <P>Media volume: {volume || 'not set (Settings)'}</P>
      <Text style={audio.earphones ? s.ok : s.warn}>
        {audio.micOn
          ? audio.earphones ? 'Wired earphones detected.' : 'No wired earphones detected. Plug them in. Tones never play through the speaker.'
          : 'Starting microphone…'}
      </Text>
      <Check label={`Media volume is at the fixed setting: ${volume || '?'}`} value={volumeOk} onChange={setVolumeOk} />
      <Check label="Bluetooth is off" value={btOff} onChange={setBtOff} />
      <Btn title="Continue" onPress={onDone}
        disabled={!audio.earphones || !volumeOk || !btOff || !earphone || !volume} />
    </View>
  );
}

// Left/right check, idea ported from the original DhwaniSarathi EarTest screen (Apache-2.0, see ATTRIBUTION.md).
function LrStep({ audio, onDone }: { audio: ReturnType<typeof useScreeningAudio>; onDone: (ok: boolean) => void }) {
  const trials: number = v(cfg, 'earphone_check', 'trials');
  const [side, setSide] = useState<Ear | null>(null);
  const [n, setN] = useState(0);
  const [msg, setMsg] = useState('');

  function play() {
    if (!audio.earphones) return setMsg('Plug in the wired earphones first.');
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
      return setMsg('Wrong side. Check the L/R marks on the earphones, then start again.');
    }
    setSide(null);
    if (n + 1 >= trials) return onDone(true);
    setN(n + 1);
    setMsg(`Correct (${n + 1} of ${trials}).`);
  }

  return (
    <View style={s.screen}>
      <H>3. Left / right check</H>
      <P>Play a beep. The child points to the ear that heard it; tap that side.</P>
      <Btn title="Play beep" onPress={play} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Btn title="Left" disabled={!side} onPress={() => answer('left')} /></View>
        <View style={{ flex: 1 }}><Btn title="Right" disabled={!side} onPress={() => answer('right')} /></View>
      </View>
      {!!msg && <P>{msg}</P>}
    </View>
  );
}

function AmbientStep({ audio, micStart, onDone }: {
  audio: ReturnType<typeof useScreeningAudio>; micStart: number;
  onDone: (a: { db: number | null; include500: boolean; reason: string }) => void;
}) {
  const [result, setResult] = useState<{ db: number | null; include500: boolean; reason: string } | null>(null);
  const [measuring, setMeasuring] = useState(false);

  function measure() {
    const samples: Sample[] = [];
    setMeasuring(true);
    audio.setListeners({ onSample: (db, t) => samples.push({ t, db }) });
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
    <View style={s.screen}>
      <H>4. Room noise</H>
      <P>Everyone quiet for a few seconds. Earphones on the child.</P>
      <Btn title={measuring ? 'Measuring…' : 'Measure room noise'} onPress={measure} disabled={measuring} />
      {result && (
        <>
          <P>Room noise: {result.db === null ? 'could not measure' : `${result.db.toFixed(1)} re: reference quiet room (relative, uncalibrated)`}</P>
          <P>{result.reason}</P>
          {noisy && <Text style={s.warn}>The room is noisy: many tones may be discarded. Move somewhere quieter if you can.</Text>}
          <Btn title="Continue to the test" onPress={() => onDone(result)} />
        </>
      )}
    </View>
  );
}

function TestStep({ snap, onStart, onTap, onResume }: {
  snap: Snapshot | null; onStart: () => void; onTap: () => void; onResume: () => void;
}) {
  if (!snap) {
    return (
      <View style={s.screen}>
        <H>5. Test</H>
        <P>Tell the child: “Tap the big button every time you hear a beep, even a very quiet one.”</P>
        <Btn title="Start test" onPress={onStart} />
      </View>
    );
  }
  if (snap.phase === 'paused') {
    return (
      <View style={s.screen}>
        <Text style={s.warn}>
          {snap.earphones ? 'Paused after an earphone change. The interrupted beep will be repeated.' : 'Earphones disconnected. Plug them back in.'}
        </Text>
        <Btn title="Resume" onPress={onResume} disabled={!snap.earphones} />
      </View>
    );
  }
  return (
    <View style={s.screen}>
      <P>Round {snap.round} · {snap.done} of {snap.total}</P>
      <Pressable accessibilityRole="button" accessibilityLabel="I heard a beep" onPressIn={onTap} style={st.tap}>
        <Text style={st.tapText}>TAP when you hear a beep</Text>
      </Pressable>
    </View>
  );
}

function ResultStep({ snap, calibrated, onSave }: { snap: Snapshot; calibrated: boolean; onSave: () => string }) {
  const r = snap.result!;
  const [sessionId] = useState(onSave);
  return (
    <View style={s.screen}>
      <H>Result: {r.outcome}</H>
      <P>Left ear: {r.ear_outcomes.left} · Right ear: {r.ear_outcomes.right}</P>
      {r.reasons.map((x) => <P key={x}>• {x}</P>)}
      {!calibrated && <Text style={s.warn}>UNCALIBRATED test level (development volume). Not valid for real screening yet.</Text>}
      {r.outcome === 'REFER' && <P>A referral case was created on this phone. Sync to send it.</P>}
      {r.outcome === 'RETEST' && <P>Retest this child, ideally in a quieter room.</P>}
      <Btn kind="plain" title="Export session JSON" onPress={() => exportSession(sessionId)} />
      <Btn title="Done" onPress={() => router.back()} />
    </View>
  );
}

function saveSession(x: {
  childId: string; school: string; consentId: string; startedAt: string; lrPassed: boolean | null;
  ambientDb: number | null; ambientReason: string; calibrated: boolean;
  result: NonNullable<Snapshot['result']>; log: ReturnType<Engine['log']> | undefined;
}) {
  const sessionId = Crypto.randomUUID();
  const resultId = Crypto.randomUUID();
  put(db, 'screening_session', sessionId, {
    child: x.childId, consent: x.consentId, started_at: x.startedAt,
    device_model: Device.modelName ?? 'unknown', earphone_model: kvGet(db, 'earphone_model') ?? '',
    volume_confirmed: true, volume_setting: kvGet(db, 'volume_setting') ?? '',
    app_version: Constants.expoConfig?.version ?? '', config_version: CONFIG_VERSION,
    calibrated: x.calibrated, ambient_db_re_reference: x.ambientDb, lr_check_passed: x.lrPassed,
  });
  put(db, 'screening_result', resultId, {
    session: sessionId, outcome: x.result.outcome, ear_outcomes: x.result.ear_outcomes,
    frequency_results: x.result.point_status, reliability_score: x.result.reliability.score,
    noise_events: x.log?.noise_events ?? [], reasons: x.result.reasons,
  });
  // Full engine log stays on the phone (export only): trials, metering numbers, device changes. Never audio.
  put(db, 'session_log', sessionId, {
    note: 'Screening session log. Screening only, not a diagnosis. Metering is relative and uncalibrated.',
    device: { brand: Device.brand, model: Device.modelName, os: `${Device.osName} ${Device.osVersion}` },
    config_version: CONFIG_VERSION, calibrated: x.calibrated, ambient_db_re_reference: x.ambientDb,
    ambient_reason: x.ambientReason, lr_check_passed: x.lrPassed, result: x.result, ...x.log,
  });
  if (x.result.outcome === 'REFER') {
    const caseId = Crypto.randomUUID();
    put(db, 'case', caseId, { child: x.childId, school: x.school, screening_result: resultId, status: 'referred' });
    put(db, 'case_event', Crypto.randomUUID(), {
      case: caseId, from_status: 'screened', to_status: 'referred', at: new Date().toISOString(),
    });
  }
  return sessionId;
}

async function exportSession(sessionId: string) {
  const file = new File(Paths.cache, `session-${sessionId}.json`);
  file.write(JSON.stringify(get(db, 'session_log', sessionId), null, 1));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
}

const st = StyleSheet.create({
  tap: { height: 320, borderRadius: 160, backgroundColor: '#0a58ca', alignItems: 'center', justifyContent: 'center' },
  tapText: { color: 'white', fontSize: 24, fontWeight: '700', textAlign: 'center', padding: 24 },
});
