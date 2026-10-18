// Real audio layer for the engine: tone players, the mic meter, and earphone detection.
// Earphones are detected from the live audio device list (expo-audio getAvailableInputs = AudioManager.getDevices),
// never from getCurrentInput(), which the spike showed stays "H2W" after unplugging (docs/SPIKE.md §5.1).
import {
  AudioModule, createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync, RecordingPresets,
  type AudioPlayer, type AudioRecorder,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { useEffect, useMemo, useRef, useState } from 'react';

import { createMic } from '@/audio/mic';
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

// Not useAudioRecorder: that hook releases the recorder in its own cleanup, before ours can stop it (ERR-021).
// Options flattened for Android exactly as useAudioRecorder does (expo-audio build/utils/options.js).
function newRecorder(): AudioRecorder {
  const { extension, sampleRate, numberOfChannels, bitRate, android } = RecordingPresets.LOW_QUALITY;
  // eslint-disable-next-line import/namespace -- AudioModule is the native module object, not an ES namespace; tsc checks this
  return new AudioModule.AudioRecorder({ extension, sampleRate, numberOfChannels, bitRate, isMeteringEnabled: true, ...android });
}

/** Tone players, the recorder and its lifecycle. Created once per screening screen, freed on unmount. */
function newAudio() {
  const recorder = newRecorder();
  return {
    players: Object.fromEntries(Object.entries(TONES).map(([k, src]) => [k, createAudioPlayer(src)])) as Record<string, AudioPlayer>,
    recorder,
    mic: createMic({
      recorder,
      setup: async () => {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) throw new Error('Microphone permission denied');
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      },
      deleteFile: (uri) => {
        const f = new File(uri);
        if (f.exists) f.delete();
      },
      now: () => Date.now(),
      // console.log, not warn: a warning toast must not cover the screen during a demo.
      warn: (msg, e) => console.log(`[audio] ${msg}:`, e),
    }),
  };
}

type Listeners = {
  onSample?: (db: number | null, t: number) => void;
  onEarphones?: (on: boolean, t: number) => void;
  onPlaybackStart?: (t: number) => void;
};

export function useScreeningAudio(cfg: Config) {
  const { players, recorder, mic } = useMemo(() => newAudio(), []);
  const [micOn, setMicOn] = useState(false);
  const [earphones, setEarphones] = useState(false);
  const [error, setError] = useState('');
  const listeners = useRef<Listeners>({});
  const changes = useRef<number[]>([]);

  const disposed = useRef(false);

  // Actual playback start (ERR-026): the player's status says playing (ExoPlayer onIsPlayingChanged); the start
  // is the event's arrival minus the position already played. Periodic "playing" updates repeat this; the engine
  // keeps only the first per tone.
  useEffect(() => {
    const subs = Object.values(players).map((p) => p.addListener('playbackStatusUpdate', (st) => {
      if (st.playing) listeners.current.onPlaybackStart?.(Date.now() - st.currentTime * 1000);
    }));
    return () => subs.forEach((x) => x.remove());
  }, [players]);

  // Leaving the screen: free the players, then stop the mic, delete the recording and release it, in that order.
  useEffect(() => () => {
    disposed.current = true;
    Object.values(players).forEach((p) => p.remove());
    void mic.dispose();
  }, [players, mic]);

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

  const stopAll = () => {
    if (!disposed.current) Object.values(players).forEach((p) => p.pause()); // players are gone after unmount
  };

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
    /** Starts the mic for the rest of the session. Returns the mic start time (for the settle window), or null if
     *  the screen was left while starting. */
    async startMic() {
      try {
        const t = await mic.start();
        if (t !== null) setMicOn(true);
        return t;
      } catch (e) {
        setError(String(e));
        throw e;
      }
    },
    /** Stops the mic and deletes the recording: we keep metering numbers only, never audio. Never rejects. */
    stopMic() {
      stopAll();
      setMicOn(false);
      return mic.stop();
    },
  };
}

export type ScreeningAudio = ReturnType<typeof useScreeningAudio>;
