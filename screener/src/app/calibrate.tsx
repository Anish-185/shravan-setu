// Team-only biological calibration (docs/TEAM_TEST_PROTOCOL.md): threshold search per ear and frequency on the
// standard phone + earphones, with consenting adult volunteers. English only, like the spike screen: adults on the
// team, never children. Exports JSON for scripts/calibrate.py. Not a screening, not a diagnosis.
import * as Device from 'expo-device';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { useScreeningAudio } from '@/audio/useScreeningAudio';
import { cfg, CONFIG_VERSION } from '@/config';
import { db } from '@/db';
import { kvGet } from '@/db/store';
import { judge, startSearch, step, volumeAt, type Search } from '@/engine/calibration';
import { v, type Ear } from '@/rules';
import { Btn, H, P, s } from '@/ui';

type Point = { ear: Ear; freq: number };
type Done = Point & { threshold_db: number | null; result: Search['result']; presentations: Search['presentations'] };

// 1000 Hz first and again at the end of each ear (a within-run repeat check), then the others.
const ORDER = [1000, 2000, 4000, 500, 1000];
const POINTS: Point[] = (['left', 'right'] as Ear[]).flatMap((ear) => ORDER.map((freq) => ({ ear, freq })));

export default function Calibrate() {
  const audio = useScreeningAudio(cfg);
  const [code, setCode] = useState('');
  const [run, setRun] = useState('1');
  const [mediaVolume, setMediaVolume] = useState('');
  const [phase, setPhase] = useState<'setup' | 'running' | 'done'>('setup');
  const [idx, setIdx] = useState(0);
  const [level, setLevel] = useState<number | null>(null);
  const [results, setResults] = useState<Done[]>([]);
  const [msg, setMsg] = useState('');
  const started = useRef('');
  const taps = useRef<number[]>([]);
  const strayTaps = useRef(0);
  const playStart = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const earphones = useRef(false); // latest value for the timer callbacks below
  useEffect(() => { earphones.current = audio.earphones; }, [audio.earphones]);

  useEffect(() => {
    audio.startMic().catch(() => {}); // for earphone detection only; the error shows below
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per screen
  }, []);

  // One point: present, wait for the window, step the search, repeat until it is done.
  useEffect(() => {
    if (phase !== 'running') return;
    let search = startSearch(cfg);
    const [lo, hi] = v(cfg, 'response', 'inter_stimulus_interval_ms');
    const windowMs = v(cfg, 'response', 'response_window_ms');
    const point = POINTS[idx];
    audio.setListeners({ onPlaybackStart: (t) => { if (playStart.current === null) playStart.current = t; } });

    const present = () => {
      if (!earphones.current) {
        setMsg('Plug in the earphones. This frequency starts again.');
        search = startSearch(cfg);
        timer.current = setTimeout(present, 1000);
        return;
      }
      setMsg('');
      setLevel(search.level);
      taps.current = [];
      playStart.current = null;
      audio.playAt(point.ear, point.freq, volumeAt(search.level));
      timer.current = setTimeout(() => {
        const heard = judge(taps.current, playStart.current, windowMs);
        if (heard !== null) search = step(search, heard, cfg);
        if (search.done) {
          setResults((r) => [...r, { ...point, threshold_db: search.threshold, result: search.result, presentations: search.presentations }]);
          if (idx + 1 < POINTS.length) setIdx(idx + 1);
          else setPhase('done');
          return;
        }
        timer.current = setTimeout(present, lo + Math.random() * (hi - lo));
      }, v(cfg, 'response', 'max_play_latency_ms') + windowMs);
    };
    timer.current = setTimeout(present, lo + Math.random() * (hi - lo));
    return () => { if (timer.current) clearTimeout(timer.current); audio.port.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restarts per point only
  }, [phase, idx]);

  function tap() {
    const t = Date.now();
    if (playStart.current === null && taps.current.length === 0 && level !== null) strayTaps.current++;
    taps.current.push(t);
  }

  async function exportJson() {
    const out = {
      kind: 'calibration',
      note: 'Biological calibration, team volunteers (adults). Levels in dB re the tone file full scale at player volume 1.0. Not a hearing test result.',
      volunteer: code.trim(), run: Number(run), started_at: started.current, finished_at: new Date().toISOString(),
      device: { brand: Device.brand, model: Device.modelName, os: `${Device.osName} ${Device.osVersion}` },
      earphone_model: kvGet(db, 'earphone_model') ?? '', media_volume_steps: mediaVolume.trim(),
      config_version: CONFIG_VERSION, stray_taps: strayTaps.current, results,
    };
    const file = new File(Paths.document, `calibration-${out.volunteer}-run${out.run}-${Date.now()}.json`);
    file.write(JSON.stringify(out, null, 1)); // kept on the phone too, in case sharing fails
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
  }

  const ready = /^V\d+$/.test(code.trim()) && ['1', '2'].includes(run) && mediaVolume.trim() !== '' && audio.earphones;
  return (
    <ScrollView contentContainerStyle={s.screen}>
      <H>Biological calibration (team only)</H>
      <P>Consenting adult volunteers only (docs/TEAM_TEST_PROTOCOL.md). Quiet room, earphones worn properly, fixed
        media volume. Tap the big button whenever you hear a beep, however faint.</P>
      {phase === 'setup' && (
        <>
          <P>Volunteer code (V1, V2, ...; no names)</P>
          <TextInput value={code} onChangeText={setCode} autoCapitalize="characters" style={s.input} />
          <P>Run (1 or 2: the second run is the retest)</P>
          <TextInput value={run} onChangeText={setRun} keyboardType="number-pad" style={s.input} />
          <P>Media volume setting (steps from zero, as set on the phone)</P>
          <TextInput value={mediaVolume} onChangeText={setMediaVolume} keyboardType="number-pad" style={s.input} />
          <Text style={audio.earphones ? s.ok : s.warn}>
            {audio.earphones ? 'Wired earphones detected.' : 'Wired earphones not detected.'}
          </Text>
          {!!audio.error && <Text style={s.warn}>{audio.error}</Text>}
          <Btn title="Start" disabled={!ready} onPress={() => {
            started.current = new Date().toISOString();
            void audio.warmUp().then(() => setPhase('running'));
          }} />
        </>
      )}
      {phase === 'running' && (
        <>
          <P>{`${POINTS[idx].ear} ear, ${POINTS[idx].freq} Hz  (${idx + 1} of ${POINTS.length})`}</P>
          <P>{level === null ? '' : `level ${level} dB re full scale`}</P>
          {!!msg && <Text style={s.warn}>{msg}</Text>}
          <View style={{ height: 24 }} />
          <Btn title="I heard a beep" onPress={tap} />
        </>
      )}
      {phase === 'done' && (
        <>
          <P>Done. Export the file and copy it to data/raw/calibration/ on the laptop.</P>
          {results.map((r, i) => (
            <P key={i}>{`${r.ear} ${r.freq} Hz: ${r.threshold_db ?? '-'} (${r.result})`}</P>
          ))}
          <Btn title="Export calibration JSON" onPress={() => void exportJson()} />
        </>
      )}
    </ScrollView>
  );
}
