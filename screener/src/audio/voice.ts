// Telugu voice instructions (recorded by [TELUGU_SPEAKER]; silent placeholders until then, docs/VOICE_SCRIPT.md).
// Played through the earphones between steps, never during a test tone or the room-noise measurement.
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useEffect, useMemo, useRef } from 'react';

import strings from '@/i18n/strings.json';
import { v, type Config } from '@/rules';

const FILES = {
  intro: require('@/assets/voice/te/intro.m4a'),
  tap: require('@/assets/voice/te/tap.m4a'),
  lr: require('@/assets/voice/te/lr.m4a'),
  quiet: require('@/assets/voice/te/quiet.m4a'),
  done: require('@/assets/voice/te/done.m4a'),
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
