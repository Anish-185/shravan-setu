// Original artwork for Direction B v2 (docs/DESIGN.md): the muggu lattice, the setu line, arch windows and the
// bridge-arch stepper. Static drawings; nothing here animates.
import { useId, type ReactNode } from 'react';
import { Image, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { Circle, Defs, G, Line, Path, Pattern, Rect, Svg, Text as SvgText } from 'react-native-svg';

import { C, F } from '@/ui';

/** Muggu-inspired lattice: a dot grid with a looping line passing between the dots. Fills its parent. */
export function Muggu({ color, opacity, size = 22, dot = 2.2 }: { color: string; opacity: number; size?: number; dot?: number }) {
  const id = `muggu${useId().replace(/:/g, '')}`;
  const r = size / 2;
  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity }} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <Pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          {[[0, 0], [size, 0], [0, size], [size, size]].map(([x, y]) => <Circle key={`${x}${y}`} cx={x} cy={y} r={dot} fill={color} />)}
          <Rect x={r - r * 0.62} y={r - r * 0.62} width={r * 1.24} height={r * 1.24} rx={r * 0.42}
            transform={`rotate(45 ${r} ${r})`} fill="none" stroke={color} strokeWidth={1.3} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** The setu line: a sound wave rising into a bridge arch. Stretches to its width. */
const SETU = 'M0 70c14 0 18-14 30-14s16 22 30 22 16-30 30-30 18 18 26 18c10 0 18-6 26-12 40-30 90-30 130 0 8 6 16 12 26 12 12 0 18-10 42-10';
export function SetuLine({ color, height, stroke = 3, style }: { color: string; height: number; stroke?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 340 90" preserveAspectRatio="none" style={style} pointerEvents="none">
      <Path d={SETU} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </Svg>
  );
}

/** Rounded-top window (the setu arch) holding a figure, standing on its bottom edge. */
export function Arch({ width, height, bg, border, source, imgHeight, imgWidth, offset = 0, children }: {
  width: number; height: number; bg: string; border?: string; source: ImageSourcePropType; imgHeight: number;
  imgWidth: number; offset?: number; children?: ReactNode;
}) {
  return (
    <View style={{ width, height, backgroundColor: bg, borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2,
      borderBottomLeftRadius: 18, borderBottomRightRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end',
      ...(border ? { borderWidth: 2, borderBottomWidth: 0, borderColor: border } : {}) }}>
      {children}
      <Image source={source} style={{ width: imgWidth, height: imgHeight, marginBottom: offset }} accessible={false} />
    </View>
  );
}

/** The five test steps as posts on a bridge arch: done = indigo with a tick, current = marigold with a halo. */
export function Stepper({ current, label }: { current: number; label: string }) {
  const [w, h, x0, x1, y0] = [300, 64, 22, 278, 50];
  const pt = (t: number) => [x0 + (x1 - x0) * t, y0 - 36 * Math.sin(Math.PI * t)] as const;
  const arc = (n: number) => 'M' + Array.from({ length: n + 1 }, (_, i) => pt(i / 40).map((v) => v.toFixed(1)).join(' ')).join(' L');
  return (
    <View accessible accessibilityLabel={label}>
      <Svg width="100%" height={h + 14} viewBox={`0 0 ${w} ${h + 14}`}>
        <Path d={arc(40)} fill="none" stroke={C.lilac} strokeWidth={3} strokeLinecap="round" />
        {current > 1 && <Path d={arc(Math.round((40 * (current - 1)) / 4))} fill="none" stroke={C.indigo} strokeWidth={3} strokeLinecap="round" />}
        {[0, 1, 2, 3, 4].map((i) => {
          const [x] = pt(i / 4);
          return <Line key={`l${i}`} x1={x} y1={pt(i / 4)[1]} x2={x} y2={h} stroke={C.lilac} strokeWidth={2} />;
        })}
        {[0, 1, 2, 3, 4].map((i) => {
          const [x, y] = pt(i / 4);
          const n = i + 1;
          if (n < current) return (
            <G key={n}>
              <Circle cx={x} cy={y} r={13} fill={C.indigo} />
              <Path d={`M${x - 5} ${y}l3.5 3.5 6.5-7`} fill="none" stroke={C.white} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </G>
          );
          const cur = n === current;
          return (
            <G key={n}>
              {cur && <Circle cx={x} cy={y} r={19} fill={C.marigold} opacity={0.25} />}
              <Circle cx={x} cy={y} r={cur ? 14 : 13} fill={cur ? C.marigold : C.white} stroke={cur ? undefined : C.lilac} strokeWidth={2} />
              <SvgText x={x} y={y + 5} textAnchor="middle" fontFamily={F.uiBold} fontSize={cur ? 14 : 13} fill={cur ? C.night : C.dusk}>{n}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
