// Line illustrations for the detailed test, results and teacher screens, drawn by Team JL in the Direction B v2 style
// (docs/DESIGN.md): Night ink at icon weight, palette washes, the setu arch behind with muggu dots, the setu line under.
// Glyphs are Lucide shapes (ISC) drawn through <Glyph>. They replace the original DhwaniSarathi pictures and our
// first flat redraws of them (scripts/make_art.py, removed). Static; nothing animates.
import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Circle, Ellipse, G, Line, Path, Rect, Svg, Text as SvgText } from 'react-native-svg';

import { Muggu, SetuLine } from '@/art';
import { Glyph } from '@/icons';
import { C, EAR, F } from '@/ui';

const INK = C.night;
const OUTCOME_TINT = '#FCE6D9'; // = OUTCOME.REFER.tint, the right ear's wash
const SETU = 'M14 108c7 0 9-6 15-6s8 8 14 8 9-11 15-11c6 0 8 5 13 5 16-13 26-13 35-3';

/** The arch window every scene stands in: a tinted arch, five muggu dots along its top, the setu line at its foot. */
function Scene({ size, tint, children, label }: { size: number; tint: string; children: ReactNode; label?: string }) {
  return (
    <View accessible={!!label} accessibilityLabel={label} accessibilityRole={label ? 'image' : undefined}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Path d="M14 116V60a46 46 0 0 1 92 0v56z" fill={tint} />
        {[-60, -30, 0, 30, 60].map((a) => {
          const r = (a * Math.PI) / 180;
          return <Circle key={a} cx={60 + 54 * Math.sin(r)} cy={60 - 54 * Math.cos(r)} r={2.2} fill={C.marigold} />;
        })}
        {children}
        <Path d={SETU} fill="none" stroke={C.marigold} strokeWidth={2.4} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/** Make sure: a quiet place (a house at night). */
export const QuietPlace = memo(function QuietPlace({ size = 96 }: { size?: number }) {
  return (
    <Scene size={size} tint={C.indigoTint}>
      <Glyph name="house" x={30} y={40} size={56} color={INK} fill={C.white} stroke={1.3} />
      <Glyph name="moon" x={74} y={22} size={24} color={INK} fill={C.dawn} stroke={1.4} />
    </Scene>
  );
});

/** Make sure: wired earphones, plugged into the phone. */
export const WiredEarphones = memo(function WiredEarphones({ size = 96 }: { size?: number }) {
  return (
    <Scene size={size} tint={C.marigoldTint}>
      <Rect x={38} y={56} width={13} height={18} rx={4} fill={C.coral} />
      <Rect x={69} y={56} width={13} height={18} rx={4} fill={C.coral} />
      <Glyph name="headphones" x={30} y={24} size={60} color={INK} stroke={1.3} />
      <Path d="M80 76c2 10 14 4 14 14" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <Glyph name="smartphone" x={82} y={86} size={24} color={INK} fill={C.white} stroke={1.5} />
    </Scene>
  );
});

/** Make sure: notifications off. */
export const NotificationsOff = memo(function NotificationsOff({ size = 96 }: { size?: number }) {
  return (
    <Scene size={size} tint={C.indigoTint}>
      <Circle cx={60} cy={66} r={28} fill={C.dawn} />
      <Glyph name="bell-off" x={33} y={38} size={54} color={INK} stroke={1.3} />
    </Scene>
  );
});

/** Make sure: equalizer neutral (every slider in the middle). */
export const EqualizerNeutral = memo(function EqualizerNeutral({ size = 96 }: { size?: number }) {
  return (
    <Scene size={size} tint={C.marigoldTint}>
      <Rect x={30} y={38} width={60} height={56} rx={10} fill={C.white} stroke={INK} strokeWidth={2.2} />
      <Line x1={34} y1={66} x2={86} y2={66} stroke={C.marigold} strokeWidth={2} strokeDasharray="3 4" />
      {[42, 54, 66, 78].map((x) => (
        <G key={x}>
          <Line x1={x} y1={46} x2={x} y2={86} stroke={INK} strokeWidth={2} opacity={0.3} strokeLinecap="round" />
          <Circle cx={x} cy={66} r={5} fill={C.indigo} stroke={INK} strokeWidth={1.6} />
        </G>
      ))}
    </Scene>
  );
});

/** Make sure: nobody talking nearby. */
export const NoTalking = memo(function NoTalking({ size = 96 }: { size?: number }) {
  return (
    <Scene size={size} tint={C.indigoTint}>
      <Circle cx={60} cy={66} r={28} fill={OUTCOME_TINT} />
      <Glyph name="message-circle-off" x={34} y={40} size={52} color={INK} stroke={1.3} />
    </Scene>
  );
});

/** Make sure: noise cancelling off (the switch on the earphones is off). */
export const NoiseCancelOff = memo(function NoiseCancelOff({ size = 96 }: { size?: number }) {
  return (
    <Scene size={size} tint={C.marigoldTint}>
      <Glyph name="headphones" x={22} y={30} size={50} color={INK} stroke={1.5} />
      <Rect x={56} y={74} width={38} height={22} rx={11} fill={C.lilac} stroke={INK} strokeWidth={2} />
      <Circle cx={67} cy={85} r={7.5} fill={C.white} stroke={INK} strokeWidth={2} />
    </Scene>
  );
});

/** Room-noise check: a microphone with sound rings, `rings` of the three lit in `color`. */
export const MicMeter = memo(function MicMeter({ size = 150, rings, color }: { size?: number; rings: number; color: string }) {
  return (
    <Scene size={size} tint={C.indigoTint}>
      {[16, 26, 36].map((r, i) => (
        <G key={r} opacity={i < rings ? 1 : 0.18}>
          <Path d={`M${60 - r} ${46 - r * 0.7}a${r} ${r} 0 0 0 0 ${r * 1.4}`} fill="none" stroke={i < rings ? color : INK}
            strokeWidth={3} strokeLinecap="round" transform={`translate(${-8} 18)`} />
          <Path d={`M${60 + r} ${46 - r * 0.7}a${r} ${r} 0 0 1 0 ${r * 1.4}`} fill="none" stroke={i < rings ? color : INK}
            strokeWidth={3} strokeLinecap="round" transform={`translate(${8} 18)`} />
        </G>
      ))}
      <Glyph name="mic" x={36} y={36} size={48} color={INK} fill={C.white} stroke={1.4} />
    </Scene>
  );
});

/** Which ear: a pair of earbuds marked L and R with a question between them. */
export const WhichEarArt = memo(function WhichEarArt({ size = 170 }: { size?: number }) {
  return (
    <Scene size={size} tint={C.marigoldTint}>
      <Path d="M38 74c0 16 22 18 22 34M82 74c0 16-22 18-22 34" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      {([['L', 38, EAR.left], ['R', 82, EAR.right]] as const).map(([k, x, c]) => (
        <G key={k}>
          <Rect x={x - 4} y={60} width={8} height={16} rx={3} fill={C.white} stroke={INK} strokeWidth={2} />
          <Circle cx={x} cy={52} r={12} fill={c} stroke={INK} strokeWidth={2} />
          <SvgText x={x} y={57} textAnchor="middle" fontFamily={F.uiBold} fontSize={13} fill={C.white}>{k}</SvgText>
        </G>
      ))}
      <Circle cx={60} cy={30} r={11} fill={C.marigold} stroke={INK} strokeWidth={2} />
      <SvgText x={60} y={35} textAnchor="middle" fontFamily={F.uiBold} fontSize={14} fill={INK}>?</SvgText>
    </Scene>
  );
});

/** Start of the detailed test: earphones over a tone. */
export const TestStart = memo(function TestStart({ size = 170 }: { size?: number }) {
  return (
    <Scene size={size} tint={C.indigoTint}>
      <Rect x={36} y={50} width={13} height={18} rx={4} fill={EAR.left} />
      <Rect x={71} y={50} width={13} height={18} rx={4} fill={EAR.right} />
      <Glyph name="headphones" x={28} y={18} size={64} color={INK} stroke={1.3} />
      <Glyph name="audio-waveform" x={40} y={74} size={40} color={C.indigo} stroke={2} />
    </Scene>
  );
});

// Head in profile, facing right: we see its right ear. Mirrored, it faces left and shows the left ear.
const HEAD = 'M46 112C45 102 38 96 34 86 28 72 28 54 38 40 46 29 58 23 72 23c18 0 30 12 30 28l6 13c1 2 0 4-3 4l-1 5c1 2 0 4-2 4v4c0 6-5 9-12 9h-6v22';
const HAIR = 'M34 82C28 68 28 54 38 40 46 29 58 23 72 23c16 0 27 9 29 23-9-5-21-6-31-3-8 2-14 5-18 9-6 6-8 18-18 30z';
const EAR_PATH = 'M58 54c6-4 12 1 11 8-1 6-6 7-8 12-1 3-6 3-6-1';

/** The ear under test: a head in profile with that ear lit, in the ear's colour. */
export const HeadEar = memo(function HeadEar({ ear, size = 170, sound = true }: { ear: 'left' | 'right'; size?: number; sound?: boolean }) {
  return (
    <Scene size={size} tint={ear === 'left' ? C.indigoTint : OUTCOME_TINT}>
      <G transform={ear === 'left' ? 'translate(120 0) scale(-1 1)' : undefined}>
        <Path d={HEAD} fill={C.white} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        <Path d={HAIR} fill={INK} />
        <Path d="M90 50h4M98 81h-4" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        <Circle cx={62} cy={63} r={13} fill={C.marigold} opacity={0.35} />
        <Path d={EAR_PATH} fill="none" stroke={EAR[ear]} strokeWidth={3.2} strokeLinecap="round" />
        {sound && [20, 28].map((r) => (
          <Path key={r} d={`M${62 - r * 0.5} ${63 + r * 0.87}A${r} ${r} 0 0 1 ${62 - r} ${63}`} fill="none" stroke={EAR[ear]}
            strokeWidth={2.6} strokeLinecap="round" />
        ))}
      </G>
    </Scene>
  );
});

const COVERS = [C.indigo, '#006B7A', C.night, '#8F2A00'];
/** Cover strip for a classroom or an assignment: a colour picked from the id, muggu, the setu line, and a glyph. */
export function Cover({ seed, height = 64, children }: { seed: string; height?: number; children?: ReactNode }) {
  const n = [...seed].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return (
    <View style={{ height, backgroundColor: COVERS[n % COVERS.length], overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 14 }}>
      <Muggu color={C.white} opacity={0.12} size={18} dot={1.6} />
      <SetuLine color={C.marigold} height={Math.min(28, height * 0.45)} stroke={2.5} style={{ position: 'absolute', bottom: -6, left: 0, right: 0 }} />
      {children}
    </View>
  );
}

/** Small round ear badge for result cards. */
export function EarBadge({ ear, size = 44 }: { ear: 'left' | 'right'; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Circle cx={22} cy={22} r={21} fill={ear === 'left' ? C.indigoTint : OUTCOME_TINT} />
      <G transform={ear === 'left' ? 'translate(44 0) scale(-1 1)' : undefined}>
        <Glyph name="ear" x={10} y={10} size={24} color={EAR[ear]} stroke={2} />
      </G>
      <Ellipse cx={22} cy={40} rx={10} ry={1.5} fill={C.marigold} />
    </Svg>
  );
}
