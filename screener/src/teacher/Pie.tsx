// Donut chart on react-native-svg, in place of victory-native's VictoryPie used by the original AssignmentAnalytics.js
// (victory-native's maintained SVG line installs 40 MB; docs/INTEGRATION_PLAN.md). Same inputs as their call:
// data of {x, y}, colorScale, outer/inner radius, and a tap on a slice.
import { G, Path, Svg } from 'react-native-svg';

import { C } from '@/ui';

export function Pie({ data, colorScale, outerRadius = 100, innerRadius = 45, onPressSlice }: {
  data: { x: string; y: number }[]; colorScale: string[]; outerRadius?: number; innerRadius?: number;
  onPressSlice?: (x: string) => void;
}) {
  const total = data.reduce((n, d) => n + d.y, 0);
  const at = (r: number, a: number) => `${r * Math.sin(a)} ${-r * Math.cos(a)}`; // 0 rad = 12 o'clock, clockwise
  const turn = (y: number) => (y / total) * 2 * Math.PI;
  const starts = data.map((_, i) => data.slice(0, i).reduce((a, d) => a + turn(d.y), 0));
  return (
    <Svg width={outerRadius * 2} height={outerRadius * 2} viewBox={`${-outerRadius} ${-outerRadius} ${outerRadius * 2} ${outerRadius * 2}`}>
      <G>
        {data.map((d, i) => {
          // A slice of the whole circle can't be one SVG arc; stop just short of it.
          const a0 = starts[i];
          const a1 = a0 + Math.min(turn(d.y), 2 * Math.PI - 1e-4);
          const big = a1 - a0 > Math.PI ? 1 : 0;
          const path = `M ${at(outerRadius, a0)} A ${outerRadius} ${outerRadius} 0 ${big} 1 ${at(outerRadius, a1)} `
            + `L ${at(innerRadius, a1)} A ${innerRadius} ${innerRadius} 0 ${big} 0 ${at(innerRadius, a0)} Z`;
          return <Path key={d.x} d={path} fill={colorScale[i]} stroke={C.white} strokeWidth={2}
            onPress={onPressSlice && (() => onPressSlice(d.x))} />;
        })}
      </G>
    </Svg>
  );
}
