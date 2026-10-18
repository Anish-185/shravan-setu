// Telugu voice instructions (MP3, recorded by a native Telugu speaker; docs/VOICE_SCRIPT.md).
// Played through the earphones between steps, never during a test tone or the room-noise measurement.
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useEffect, useMemo, useRef } from 'react';

import strings from '@/i18n/strings.json';
import { v, type Config } from '@/rules';

const FILES = {
  intro: require('@/assets/voice/te/intro.mp3'),
  tap: require('@/assets/voice/te/tap.mp3'),
  lr: require('@/assets/voice/te/lr.mp3'),
  quiet: require('@/assets/voice/te/quiet.mp3'),
  done: require('@/assets/voice/te/done.mp3'),
};
export type VoiceLine = keyof typeof FILES;

/** True while any of these lines is still a silent placeholder (shown as a tag in dev builds). */
export const isPlaceholder = (lines: VoiceLine[]) =>
  lines.some((l) => !(strings as Record<string, { recorded?: boolean }>)[`voice.${l}`]?.recorded);

/** Plays lines one after another. A new play() cancels the previous sequence. */
export function useVoice(cfg: Config) {
  const players = useMemo(() => {
    const out = {} as Record<VoiceLine, AudioPlayer>;
    for (const k of Object.keys(FILES) as VoiceLine[]) out[k] = createAudioPlayer(FILES[k]);
    return out;
  }, []);
  const queue = useRef<VoiceLine[]>([]);
  const playRef = useRef<(lines: VoiceLine[]) => void>(() => {});

  useEffect(() => {
    const start = (line?: VoiceLine) => {
      if (!line) return;
      const p = players[line];
      p.volume = v(cfg, 'voice', 'player_volume');
      p.seekTo(0);
      p.play();
    };
    const subs = (Object.keys(players) as VoiceLine[]).map((k) => players[k].addListener('playbackStatusUpdate', (st) => {
      if (st.didJustFinish && queue.current[0] === k) {
        queue.current.shift();
        start(queue.current[0]);
      }
    }));
    playRef.current = (lines: VoiceLine[]) => {
      Object.values(players).forEach((p) => p.pause());
      queue.current = [...lines];
      start(queue.current[0]);
    };
    return () => {
      subs.forEach((x) => x.remove());
      queue.current = [];
      Object.values(players).forEach((p) => p.remove());
    };
  }, [players, cfg]);

  return { play: (lines: VoiceLine[]) => playRef.current(lines) };
}
