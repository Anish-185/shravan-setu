// Phase 1 throwaway spike: play a tone while metering the mic, and log samples to a shareable JSON file.
// Answers: does metering keep updating during playback, which mic is used, does the tone leak into the mic.
// Values are raw expo-audio metering (unit not documented; expected dBFS). Relative comparisons only.
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  type RecordingInput,
} from 'expo-audio';
import * as Device from 'expo-device';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

// Tones from the original DhwaniSarathi app (Apache-2.0), see ATTRIBUTION.md.
const TONES = {
  '1k L': require('@/assets/tones/tone_1000Hz_left_um.wav'),
  '1k R': require('@/assets/tones/tone_1000Hz_right_um.wav'),
  '4k L': require('@/assets/tones/tone_4000Hz_left_um.wav'),
  '4k R': require('@/assets/tones/tone_4000Hz_right_um.wav'),
};
type ToneKey = keyof typeof TONES;

type Sample = { t: number; metering: number | null; tone: ToneKey | null; volume: number; label: string };

type LogEvent = { t: number; event: string };

const METER_POLL_MS = 100;
// Wall-clock timestamp for log entries. Only called from handlers and intervals, never during render.
const now = () => Date.now();

export default function Spike() {
  const [tone, setTone] = useState<ToneKey>('1k L');
  const [volume, setVolume] = useState(0.1);
  const [label, setLabel] = useState('quiet room');
  const [inputs, setInputs] = useState<RecordingInput[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [error, setError] = useState('');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [recording, setRecording] = useState(false);
  const [metering, setMetering] = useState<number | null>(null);

  const player = useAudioPlayer(TONES[tone]);
  const playerStatus = useAudioPlayerStatus(player);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });

  // expo-audio sets volume by assignment on a native object (documented API); `player` is not React state.
  const setPlayerVolume = (v: number) => {
    // eslint-disable-next-line react-hooks/immutability
    player.volume = v;
  };

  const log = (event: string) => setEvents((es) => [...es, { t: now(), event }]);

  useEffect(() => {
    (async () => {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) setError('Microphone permission denied');
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    })().catch((e) => setError(String(e)));
  }, []);

  // One sample per poll while the mic is on.
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      const m = recorder.getStatus().metering ?? null;
      setMetering(m);
      setSamples((s) => [...s, { t: now(), metering: m, tone: player.playing ? tone : null, volume, label }]);
    }, METER_POLL_MS);
    return () => clearInterval(id);
  }, [recording, recorder, player, tone, volume, label]);

  const refreshInputs = async () => {
    setInputs(recorder.getAvailableInputs());
    const cur = await recorder.getCurrentInput();
    setCurrentInput(`${cur.name} (${cur.type})`);
  };

  const startMic = async () => {
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
      log('mic start');
      await refreshInputs();
    } catch (e) {
      setError(String(e));
    }
  };

  const stopMic = async () => {
    setRecording(false);
    await recorder.stop();
    log('mic stop');
  };

  const playTone = () => {
    setPlayerVolume(volume);
    player.seekTo(0);
    player.play();
    log(`tone play ${tone} vol=${volume.toFixed(2)}`);
  };

  const stopTone = () => {
    player.pause();
    log('tone stop');
  };

  const pickInput = async (inp: RecordingInput) => {
    try {
      await recorder.setInput(inp.uid);
      log(`input set ${inp.name} (${inp.type})`);
      await refreshInputs();
    } catch (e) {
      setError(String(e));
    }
  };

  const exportLog = async () => {
    const file = new File(Paths.cache, `spike-${now()}.json`);
    file.write(
      JSON.stringify(
        {
          note: 'SPIKE DATA. Raw expo-audio metering, relative only. Not a hearing measurement.',
          device: { brand: Device.brand, model: Device.modelName, os: `${Device.osName} ${Device.osVersion}` },
          meterPollMs: METER_POLL_MS,
          events,
          samples,
        },
        null,
        1,
      ),
    );
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
  };

  const clearLog = () => {
    setSamples([]);
    setEvents([]);
  };

  const step = (d: number) => {
    const v = Math.min(1, Math.max(0, Math.round((volume + d) * 100) / 100));
    setVolume(v);
    setPlayerVolume(v); // applies immediately if a tone is playing
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.banner}>SPIKE: technical test only. Not a screening.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.h}>Tone</Text>
      <View style={styles.row}>
        {(Object.keys(TONES) as ToneKey[]).map((k) => (
          <Button key={k} title={k} color={k === tone ? '#1a7f37' : undefined} onPress={() => setTone(k)} />
        ))}
      </View>
      <View style={styles.row}>
        <Button title="-0.1" onPress={() => step(-0.1)} />
        <Button title="-0.01" onPress={() => step(-0.01)} />
        <Text style={styles.big}>vol {volume.toFixed(2)}</Text>
        <Button title="+0.01" onPress={() => step(0.01)} />
        <Button title="+0.1" onPress={() => step(0.1)} />
      </View>
      <View style={styles.row}>
        <Button title="Play tone" onPress={playTone} />
        <Button title="Stop tone" onPress={stopTone} />
        <Text>{playerStatus.playing ? 'PLAYING' : 'stopped'}</Text>
      </View>

      <Text style={styles.h}>Microphone</Text>
      <View style={styles.row}>
        <Button title="Start mic" onPress={startMic} disabled={recording} />
        <Button title="Stop mic" onPress={stopMic} disabled={!recording} />
      </View>
      <Text style={styles.big}>
        metering: {recording && metering != null ? metering.toFixed(1) : '--'}
      </Text>
      <Text>Current input: {currentInput || '(start mic first)'}</Text>
      <View style={styles.row}>
        {inputs.map((inp) => (
          <Button key={inp.uid} title={`${inp.name} (${inp.type})`} onPress={() => pickInput(inp)} />
        ))}
      </View>

      <Text style={styles.h}>Log</Text>
      <Text>Condition label (saved with every sample):</Text>
      <TextInput style={styles.input} value={label} onChangeText={setLabel} />
      <Text>
        {samples.length} samples, {events.length} events
      </Text>
      <View style={styles.row}>
        <Button title="Export JSON" onPress={exportLog} />
        <Button title="Clear log" onPress={clearLog} />
      </View>
      {events.slice(-5).map((e) => (
        <Text key={e.t + e.event} style={styles.small}>
          {new Date(e.t).toLocaleTimeString()} {e.event}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 8 },
  banner: { backgroundColor: '#fff3cd', padding: 8, fontWeight: '600' },
  error: { color: '#b00020' },
  h: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  big: { fontSize: 20, fontVariant: ['tabular-nums'] },
  input: { borderWidth: 1, borderColor: '#999', padding: 8, borderRadius: 4 },
  small: { fontSize: 12, color: '#555' },
});
