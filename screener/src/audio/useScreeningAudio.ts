// Real audio layer for the engine: tone players, the mic meter, and earphone detection.
// Earphones are detected from the live audio device list (expo-audio getAvailableInputs = AudioManager.getDevices),
// never from getCurrentInput(), which the spike showed stays "H2W" after unplugging (docs/SPIKE.md §5.1).
import {
  createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, RecordingPresets,
  type AudioPlayer,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { Port } from '@/engine/engine';
import { v, type Config, type Ear } from '@/rules';

// Click-free tones from scripts/make_tones.py (config tone.*), one ear each.
const TONES: Record<string, number> = {
  'left-500': require('@/assets/tones/generated/tone_500Hz_left.wav'),
  'right-500': require('@/assets/tones/generated/tone_500Hz_right.wav'),
  'left-1000': require('@/assets/tones/generated/tone_1000Hz_left.wav'),
  'right-1000': require('@/assets/tones/generated/tone_1000Hz_right.wav'),
  'left-2000': require('@/assets/tones/generated/tone_2000Hz_left.wav'),
  'right-2000': require('@/assets/tones/generated/tone_2000Hz_right.wav'),
  'left-4000': require('@/assets/tones/generated/tone_4000Hz_left.wav'),
  'right-4000': require('@/assets/tones/generated/tone_4000Hz_right.wav'),
};

/** Player volume. Calibrated levels come in Phase 6; until then every session is marked uncalibrated. */
export function playback(cfg: Config) {
  if (v(cfg, 'screening_level_db_re_team_baseline') !== null) {
    throw new Error('Calibrated playback is not implemented yet (Phase 6).');
  }
  return { volume: v(cfg, 'tone', 'uncalibrated_player_volume') as number, calibrated: false };
}

type Listeners = { onSample?: (db: number | null, t: number) => void; onEarphones?: (on: boolean, t: number) => void };

export function useScreeningAudio(cfg: Config) {
  const recorder = useAudioRecorder({ ...RecordingPresets.LOW_QUALITY, isMeteringEnabled: true });
  const players = useMemo(
    () => Object.fromEntries(Object.entries(TONES).map(([k, src]) => [k, createAudioPlayer(src)])) as Record<string, AudioPlayer>,
    [],
  );
  const [micOn, setMicOn] = useState(false);
  const [earphones, setEarphones] = useState(false);
  const [error, setError] = useState('');
  const listeners = useRef<Listeners>({});
  const changes = useRef<number[]>([]);

  useEffect(() => () => Object.values(players).forEach((p) => p.remove()), [players]);

  // One tick: a metering sample and an earphone check. Bluetooth is never accepted (CLAUDE.md: wired only).
  useEffect(() => {
    if (!micOn) return;
    let prev: boolean | null = null;
    const id = setInterval(() => {
      const t = Date.now();
      listeners.current.onSample?.(recorder.getStatus().metering ?? null, t);
      const inputs = recorder.getAvailableInputs();
      const wired = inputs.some((i) => i.type === 'MicrophoneWired') && !inputs.some((i) => i.type.startsWith('Bluetooth'));
      if (wired !== prev) {
        if (prev !== null) changes.current.push(t);
        prev = wired;
        setEarphones(wired);
        listeners.current.onEarphones?.(wired, t);
      }
    }, v(cfg, 'noise', 'meter_poll_ms'));
    return () => clearInterval(id);
  }, [micOn, recorder, cfg]);

  const stopAll = () => Object.values(players).forEach((p) => p.pause());

  const setVolume = (p: AudioPlayer, volume: number) => {
    // expo-audio's documented volume API is assignment on the native player object (see ERR-004).
    p.volume = volume;
  };

  const { volume, calibrated } = playback(cfg);

  const port: Port = {
    now: () => Date.now(),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    random: Math.random,
    play(ear: Ear, freq: number) {
      stopAll();
      const p = players[`${ear}-${freq}`];
      setVolume(p, volume);
      p.seekTo(0);
      p.play();
    },
    stop: stopAll,
  };

  return {
    port,
    earphones,
    micOn,
    error,
    calibrated,
    deviceChanges: () => [...changes.current],
    setListeners: (l: Listeners) => { listeners.current = l; },
    /** Starts the mic for the rest of the session. Returns the mic start time (for the settle window). */
    async startMic() {
      try {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) throw new Error('Microphone permission denied');
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setMicOn(true);
        return Date.now();
      } catch (e) {
        setError(String(e));
        throw e;
      }
    },
    /** Stops the mic and deletes the recording: we keep metering numbers only, never audio. */
    async stopMic() {
      stopAll();
      setMicOn(false);
      await recorder.stop();
      const file = recorder.uri ? new File(recorder.uri) : null;
      if (file?.exists) file.delete();
    },
  };
}

export type ScreeningAudio = ReturnType<typeof useScreeningAudio>;
