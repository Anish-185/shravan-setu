// Child mode (docs/DESIGN.md, B v2): a still Sankranti sky, one big balloon, almost no text, and a silent
// celebration after the last tone that is the same for every outcome.
//
// Test integrity: the tap is recorded in onPressIn before any visual feedback; every animation runs on the UI thread
// (Reanimated) and never touches the engine, its timers or the audio. During tones the sky is still and the balloon
// only drifts a few dp over seconds; the tap echo (400 ms) is the only quick motion. No sounds, no haptics. With the
// system's reduce-motion setting on, nothing moves: the echo becomes a brief fade and the celebration is static.
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Svg } from 'react-native-svg';

import type { Snapshot } from '@/engine/engine';
import { useT } from '@/i18n';
import { Banner, C, F, s } from '@/ui';

const BALLOON = 300; // fixed, large hit area; only the drawing inside it moves

export function ChildMode({ snap, onTap, error }: { snap: Snapshot; onTap: () => void; error: string }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const pct = snap.total ? Math.round((100 * snap.done) / snap.total) : 0;
  return (
    <View style={st.fill}>
      <Sky />
      <View style={[st.layer, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 14 }]}>
        <Banner onSky />
        {!!error && <Text style={[s.warn, st.onSky]}>{error}</Text>}
        <View style={st.center}>
          <Balloon onTap={onTap} label={t('test.balloon')} />
          <Text style={st.word}>{t('test.balloon')}</Text>
        </View>
        <View style={st.progress}>
          <View style={st.track}><View style={[st.bar, { width: `${pct}%` }]} /></View>
          <Text style={st.progressText}>{t('test.progress', { done: snap.done, total: snap.total })}</Text>
        </View>
      </View>
    </View>
  );
}

function Balloon({ onTap, label }: { onTap: () => void; label: string }) {
  const reduce = useReducedMotion();
  const float = useSharedValue(0);
  const echo = useSharedValue(1); // 0 -> 1 over 400 ms after each tap
  const squash = useSharedValue(1);

  useEffect(() => {
    if (!reduce) float.set(withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [reduce, float]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -5 + 10 * float.get() }, { scale: squash.get() }] }));
  const echoStyle = useAnimatedStyle(() => ({
    opacity: 0.9 * (1 - echo.get()),
    transform: [{ scale: reduce ? 1 : 1 + 0.18 * echo.get() }],
  }));

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={st.hit} onPressIn={() => {
      onTap(); // tap time first; everything below is only feedback
      echo.set(0);
      echo.set(withTiming(1, { duration: 400, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.Never }));
      if (!reduce) squash.set(withSequence(withTiming(0.94, { duration: 60 }), withTiming(1, { duration: 240 })));
    }}>
      <Animated.View style={[st.ring, echoStyle]} pointerEvents="none" />
      <Animated.View style={[st.art, floatStyle]} pointerEvents="none">
        <DotRing />
        <BalloonArt width={176} />
      </Animated.View>
    </Pressable>
  );
}

const DotRing = memo(function DotRing() {
  return (
    <Svg width={BALLOON} height={BALLOON} style={StyleSheet.absoluteFill} viewBox="0 0 300 300">
      <Circle cx={150} cy={136} r={118} fill="none" stroke={C.white} strokeWidth={3} opacity={0.7} />
      {Array.from({ length: 24 }, (_, i) => (i * Math.PI) / 12).map((a, i) => (
        <Circle key={i} cx={150 + 132 * Math.cos(a)} cy={136 + 132 * Math.sin(a)} r={2.6} fill={C.white} opacity={0.9} />
      ))}
    </Svg>
  );
});

const BalloonArt = memo(function BalloonArt({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * 1.6} viewBox="0 0 200 320" style={{ alignSelf: 'center', marginTop: 36 }}>
      <Path d="M100 8C150 8 186 48 186 100c0 62-50 112-86 118C64 212 14 162 14 100 14 48 50 8 100 8z" fill={C.coral} />
      <Path d="M100 218c22-4 70-44 82-104 4 58-40 104-82 104z" fill="#C4382A" opacity={0.55} />
      <Path d="M58 48c14-14 34-20 50-18-22 6-40 22-48 44-6-6-8-18-2-26z" fill="#FF9A8B" opacity={0.95} />
      <Path d="M92 216h16l-4 12h-8z" fill="#C4382A" />
      <Path d="M100 228c-10 10-20 10-26 22s4 20 12 26 22 12 14 30" fill="none" stroke={C.night} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
});

/** Lavender-to-dawn sky with two paper kites, three birds, layered hills, a marigold sun and the setu bridge. Still. */
export const Sky = memo(function Sky() {
  const kite = (x: number, y: number, k: number, color: string, rot: number) => (
    <G transform={`translate(${x} ${y}) scale(${k}) rotate(${rot} 0 30)`}>
      <Path d="M0 0 22 26 0 60-22 26z" fill={color} />
      <Path d="M0 0v60M-22 26h44" stroke={C.white} strokeWidth={1.4} opacity={0.7} />
      <Path d="M0 60c8 10-8 18 0 28s-8 18 0 28" fill="none" stroke={C.night} strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />
      <Path d="M-6 80l6 4 6-4-6-4z M-6 104l6 4 6-4-6-4z" fill={C.coral} />
    </G>
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.lavender} />
            <Stop offset="0.48" stopColor="#EADCF5" />
            <Stop offset="1" stopColor={C.dawn} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#sky)" />
      </Svg>
      <Svg width="100%" height={260} viewBox="0 0 360 260" preserveAspectRatio="xMidYMin slice" style={{ position: 'absolute', top: 70 }}>
        {kite(46, 40, 1, C.coral, -14)}
        {kite(316, 120, 0.7, C.indigo, 12)}
        {[[230, 90], [262, 72], [70, 190]].map(([x, y]) => (
          <Path key={x} d={`M${x} ${y}q6-6 12 0q6-6 12 0`} fill="none" stroke={C.night} strokeWidth={1.8} strokeLinecap="round" opacity={0.45} />
        ))}
      </Svg>
      <Svg width="100%" height={200} viewBox="0 0 322 200" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0 }}>
        <Circle cx={230} cy={150} r={58} fill={C.marigold} opacity={0.9} />
        <Path d="M0 120c60-40 120-40 170-10s110 20 152-20v110H0z" fill="#C8BFF3" />
        <Path d="M0 150c70-30 140-20 200 0s90 0 122-14v64H0z" fill="#A99CEB" />
        <Path d="M-4 128c60 0 70-52 166-52s106 52 166 52" fill="none" stroke={C.night} strokeWidth={2.2} opacity={0.55} />
        {Array.from({ length: 9 }, (_, i) => 30 + 36 * i).map((x) => (
          <Path key={x} d={`M${x} ${(128 - 52 * Math.sin((Math.PI * (x + 4)) / 330)).toFixed(0)}V150`} stroke={C.night} strokeWidth={1.6} opacity={0.4} />
        ))}
      </Svg>
    </View>
  );
});

const PETALS = Array.from({ length: 14 }, (_, i) => ({
  x: (i * 53) % 100, delay: (i * 97) % 500, rot: (i * 61) % 180, color: [C.marigold, '#FFC94D', C.coral, C.white][i % 4],
}));

/** After the last tone: the balloon drifts up, petals fall, a ring of muggu dots appears around "Well done!". Silent,
 *  about 1.5 s, identical for every outcome; the result underneath is for the teacher, after this. */
export function Celebration({ onEnd }: { onEnd: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const p = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (!reduce) p.set(withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) }));
    const h = setTimeout(onEnd, 1600);
    return () => clearTimeout(h);
  }, [reduce, p, onEnd]);

  const up = useAnimatedStyle(() => ({ opacity: 1 - p.get(), transform: [{ translateY: -140 * p.get() }, { rotate: `${-6 * p.get()}deg` }] }));
  const ring = useAnimatedStyle(() => ({ opacity: Math.min(1, p.get() * 3), transform: [{ scale: 0.9 + 0.1 * Math.min(1, p.get() * 3) }] }));

  return (
    <View style={[st.fill, st.over]} accessibilityLiveRegion="polite">
      <Sky />
      <View style={[st.layer, { paddingTop: insets.top + 8 }]}>
        <Banner onSky />
        <View style={st.center}>
          {!reduce && <Animated.View style={up}><BalloonArt width={120} /></Animated.View>}
          <Animated.View style={[st.well, ring]}>
            <Svg width={300} height={170} viewBox="0 0 300 170" style={StyleSheet.absoluteFill}>
              {Array.from({ length: 28 }, (_, i) => (i * Math.PI) / 14).map((a, i) => (
                <Circle key={i} cx={150 + 140 * Math.cos(a)} cy={85 + 76 * Math.sin(a)} r={3.2} fill={C.marigold} />
              ))}
            </Svg>
            <Text style={st.wellText}>{t('test.wellDone')}</Text>
          </Animated.View>
        </View>
      </View>
      {!reduce && PETALS.map((q, i) => <Petal key={i} {...q} />)}
    </View>
  );
}

function Petal({ x, delay, rot, color }: { x: number; delay: number; rot: number; color: string }) {
  const y = useSharedValue(0);
  useEffect(() => { y.set(withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.in(Easing.quad) }))); }, [y, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, (y.get() - 0.75) * 4), // gone by the end, never resting in a row
    transform: [{ translateY: -30 + 900 * y.get() }, { rotate: `${rot + 200 * y.get()}deg` }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: `${x}%` }, style]}>
      <Svg width={16} height={8}><Ellipse cx={8} cy={4} rx={7} ry={3.6} fill={color} /></Svg>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.lavender },
  over: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
  layer: { flex: 1, paddingHorizontal: 20, gap: 10 },
  onSky: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 12, padding: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  hit: { width: BALLOON, height: BALLOON + 64, alignItems: 'center' },
  // the echo ring is centred on the balloon's body (y = 136 in the 300 x 364 hit area)
  ring: { position: 'absolute', top: 14, left: (BALLOON - 244) / 2, width: 244, height: 244, borderRadius: 122, borderWidth: 4,
    borderColor: C.white },
  art: { width: BALLOON, height: BALLOON + 64, alignItems: 'center' },
  word: { color: C.night, fontFamily: F.child, fontSize: 28, lineHeight: 46, textAlign: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 999,
    paddingVertical: 8, paddingHorizontal: 14 },
  track: { flex: 1, height: 10, borderRadius: 99, backgroundColor: C.lilac, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 99, backgroundColor: C.indigo },
  progressText: { color: C.night, fontFamily: F.uiBold, fontSize: 15, lineHeight: 25 },
  well: { width: 300, height: 170, paddingHorizontal: 35, alignItems: 'center', justifyContent: 'center' }, // Telugu wraps to 2 lines inside the ring
  wellText: { color: C.night, fontFamily: F.child, fontSize: 36, lineHeight: 54, textAlign: 'center' },
});
