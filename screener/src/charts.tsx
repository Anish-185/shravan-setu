// Charts drawn with react-native-svg (already used by the art and the child mode, so they render on the phone):
// the analytics donut, the audiogram (plain, or over the grade bands) and the left-vs-right ear bars. Replaces
// victory-native, which was only ever checked in jest. Marks follow the dataviz rules: thin lines, 2 px surface gaps
// between fills, markers of 8 px or more, a legend with counts or labels next to every chart, text in ink colours.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Circle, G, Line, Path, Rect, Svg, Text as SvgText } from 'react-native-svg';

import { useT } from '@/i18n';
import type { Point } from '@/original/hearing';
import { C, EAR, F } from '@/ui';

export type Slice = { key: string; value: number; color: string };

const polar = (r: number, a: number) => [r * Math.sin(a), -r * Math.cos(a)] as const;
/** Annular sector from angle a0 to a1 (radians, clockwise from 12 o'clock) between radii r0 and r1. */
function sector(a0: number, a1: number, r0: number, r1: number) {
  if (a1 - a0 >= 2 * Math.PI - 1e-6) a1 = a0 + 2 * Math.PI - 1e-4; // a full ring still needs two distinct ends
  const big = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(r1, a0); const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1); const [x3, y3] = polar(r0, a0);
  return `M${x0} ${y0}A${r1} ${r1} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${big} 0 ${x3} ${y3}Z`;
}

/** Donut with one ring per list (outer first). Tap a slice to select it; the rest fade. The centre shows `centre`. */
export function Donut({ rings, selected, onSelect, size = 230, centre, caption }: {
  rings: Slice[][]; selected: string | null; onSelect: (key: string) => void; size?: number; centre: string; caption: string;
}) {
  const R = size / 2 - 4;
  const width = rings.length > 1 ? R * 0.28 : R * 0.36;
  return (
    <Svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
      {rings.map((ring, i) => {
        const r1 = R - i * (width + 6);
        const total = ring.reduce((a, s) => a + s.value, 0);
        let a = 0;
        return total > 0 && ring.filter((s) => s.value > 0).map((s) => {
          const a0 = a;
          a += (2 * Math.PI * s.value) / total;
          return (
            <Path key={s.key} d={sector(a0, a, r1 - width, r1)} fill={s.color} stroke={C.white} strokeWidth={2}
              opacity={selected && selected !== s.key ? 0.3 : 1} onPress={() => onSelect(s.key)} />
          );
        });
      })}
      <SvgText y={4} textAnchor="middle" fontFamily={F.title} fontSize={30} fill={C.night}>{centre}</SvgText>
      <SvgText y={26} textAnchor="middle" fontFamily={F.ui} fontSize={13} fill={C.dusk}>{caption}</SvgText>
    </Svg>
  );
}

export type Band = { grade: string; lo: number; hi: number; color: string };
const fLabel = (f: number) => (f >= 1000 ? `${f / 1000}k` : String(f));

/** Audiogram: frequency across the top, level down the side (louder lower), left ear ✕ in indigo, right ear ○ in coral,
 *  ▽ at the loudest level played when a tone was never heard (not joined by the line). With `bands`, the grade bands
 *  sit behind. Tap a column to read its values under the chart. */
export function Audiogram({ points, freqs, width, bands }: { points: Point[]; freqs: number[]; width: number; bands?: Band[] }) {
  const t = useT();
  const [col, setCol] = useState<number | null>(null);
  const [L, T, Rm, B] = [40, 26, 14, 10];
  const h = 300;
  const yMin = -10;
  const yMax = 120;
  const x = (i: number) => L + ((i + 0.5) * (width - L - Rm)) / freqs.length;
  const y = (db: number) => T + ((db - yMin) * (h - T - B)) / (yMax - yMin);
  const at = (ear: 'left' | 'right', f: number) => points.find((p) => p.ear === ear && p.frequency === f);
  const line = (ear: 'left' | 'right') => {
    const pts = freqs.map((f, i) => [i, at(ear, f)] as const).filter(([, p]) => p && p.threshold !== null);
    return pts.map(([i, p], k) => `${k ? 'L' : 'M'}${x(i)} ${y(p!.threshold!)}`).join('');
  };
  const mark = (ear: 'left' | 'right', i: number, p: Point) => {
    const cx = x(i) + (ear === 'left' ? -3 : 3); // a little apart, so equal values stay readable
    if (p.threshold === null) {
      const cy = y(p.max);
      return <Path key={ear + i} d={`M${cx - 6} ${cy - 5}h12l-6 10z`} fill={C.white} stroke={EAR[ear]} strokeWidth={2} strokeLinejoin="round" />;
    }
    const cy = y(p.threshold);
    return ear === 'left'
      ? <Path key={ear + i} d={`M${cx - 5} ${cy - 5}l10 10m0-10l-10 10`} stroke={EAR.left} strokeWidth={2.5} strokeLinecap="round" />
      : <Circle key={ear + i} cx={cx} cy={cy} r={5.5} fill={C.white} stroke={EAR.right} strokeWidth={2.5} />;
  };
  const read = (ear: 'left' | 'right', f: number) => {
    const p = at(ear, f);
    return !p ? '-' : p.threshold === null ? t('chart.noResponse', { max: p.max }) : `${p.threshold} dB`;
  };
  return (
    <View>
      <Svg width={width} height={h}>
        {bands?.map((b) => (
          <Rect key={b.grade} x={L} y={y(Math.max(b.lo, yMin))} width={width - L - Rm} height={y(Math.min(b.hi, yMax)) - y(Math.max(b.lo, yMin))}
            fill={b.color} opacity={0.5} />
        ))}
        {[-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map((db) => (
          <G key={db}>
            <Line x1={L} x2={width - Rm} y1={y(db)} y2={y(db)} stroke={bands ? C.white : C.lilac} strokeWidth={db === 0 ? 1.6 : 1} />
            {db % 20 === 0 && <SvgText x={L - 6} y={y(db) + 4} textAnchor="end" fontFamily={F.ui} fontSize={11} fill={C.dusk}>{db}</SvgText>}
          </G>
        ))}
        {freqs.map((f, i) => (
          <G key={f}>
            <Rect x={x(i) - (width - L - Rm) / freqs.length / 2} y={T} width={(width - L - Rm) / freqs.length} height={h - T - B}
              fill={col === i ? C.marigold : 'transparent'} opacity={0.18} onPress={() => setCol(col === i ? null : i)} />
            <Line x1={x(i)} x2={x(i)} y1={T} y2={h - B} stroke={bands ? C.white : C.lilac} strokeWidth={1} />
            <SvgText x={x(i)} y={T - 9} textAnchor="middle" fontFamily={F.uiBold} fontSize={12} fill={C.night}>{fLabel(f)}</SvgText>
          </G>
        ))}
        <Path d={line('left')} fill="none" stroke={EAR.left} strokeWidth={2} />
        <Path d={line('right')} fill="none" stroke={EAR.right} strokeWidth={2} />
        {freqs.map((f, i) => (['left', 'right'] as const).map((e) => { const p = at(e, f); return p && mark(e, i, p); }))}
      </Svg>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 4 }}>
        <Legend shape="✕" color={EAR.left} text={t('teacher.leftEar')} />
        <Legend shape="○" color={EAR.right} text={t('teacher.rightEar')} />
        <Legend shape="▽" color={C.dusk} text={t('chart.notHeard')} />
      </View>
      <Text style={{ color: C.dusk, fontFamily: F.ui, fontSize: 14, lineHeight: 24, textAlign: 'center', marginTop: 4 }}>
        {col === null ? t('chart.tapColumn')
          : `${freqs[col]} Hz · ${t('teacher.leftEar')} ${read('left', freqs[col])} · ${t('teacher.rightEar')} ${read('right', freqs[col])}`}
      </Text>
    </View>
  );
}

function Legend({ shape, color, text }: { shape: string; color: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ color, fontFamily: F.uiBold, fontSize: 16, lineHeight: 26 }}>{shape}</Text>
      <Text style={{ color: C.night, fontFamily: F.ui, fontSize: 14, lineHeight: 24 }}>{text}</Text>
    </View>
  );
}

/** Left vs right, one row per frequency: each ear's bar grows out from the middle, longer = a louder tone was needed. */
export function EarBars({ points, freqs }: { points: Point[]; freqs: number[] }) {
  const t = useT();
  const max = Math.max(60, ...points.map((p) => p.threshold ?? p.max));
  const bar = (ear: 'left' | 'right', f: number) => {
    const p = points.find((q) => q.ear === ear && q.frequency === f);
    const db = p ? (p.threshold ?? p.max) : null;
    const pct = db === null ? 0 : (100 * (db + 10)) / (max + 10);
    const label = !p ? '-' : p.threshold === null ? `>${p.max}` : String(p.threshold);
    const fill = <View style={{ width: `${pct}%`, height: 14, borderRadius: 7, backgroundColor: EAR[ear], opacity: p?.threshold === null ? 0.45 : 1 }} />;
    const num = <Text style={{ color: C.night, fontFamily: F.uiBold, fontSize: 13, lineHeight: 22, minWidth: 38, textAlign: ear === 'left' ? 'right' : 'left' }}>{label}</Text>;
    return (
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: ear === 'left' ? 'flex-end' : 'flex-start', gap: 6 }}>
        {ear === 'left' ? <>{num}{fill}</> : <>{fill}{num}</>}
      </View>
    );
  };
  return (
    <View style={{ gap: 8 }} accessible accessibilityLabel={t('chart.earBarsLabel')}>
      <View style={{ flexDirection: 'row' }}>
        <Text style={[earHead, { color: EAR.left, textAlign: 'right' }]}>{t('teacher.leftEar')}</Text>
        <View style={{ width: 52 }} />
        <Text style={[earHead, { color: EAR.right }]}>{t('teacher.rightEar')}</Text>
      </View>
      {freqs.map((f) => (
        <View key={f} style={{ flexDirection: 'row', alignItems: 'center' }}>
          {bar('left', f)}
          <Text style={{ width: 52, textAlign: 'center', color: C.dusk, fontFamily: F.uiBold, fontSize: 13, lineHeight: 22 }}>{fLabel(f)} Hz</Text>
          {bar('right', f)}
        </View>
      ))}
      <Text style={{ color: C.dusk, fontFamily: F.ui, fontSize: 13, lineHeight: 22, textAlign: 'center' }}>{t('chart.earBarsNote')}</Text>
    </View>
  );
}
const earHead = { flex: 1, fontFamily: F.uiBold, fontSize: 15, lineHeight: 25 } as const;
