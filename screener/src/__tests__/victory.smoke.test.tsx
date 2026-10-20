// The original DhwaniSarathi screens use react-native-paper and victory-native (SVG line, v37); both must render
// under our React 19 / RN 0.86 (docs/INTEGRATION_PLAN.md). Paper's icons come from our own set (src/ds/paper.tsx).
import { Text } from 'react-native';
import { Button, Card, ProgressBar, Provider as PaperProvider } from 'react-native-paper';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { VictoryAxis, VictoryChart, VictoryLegend, VictoryLine, VictoryPie, VictoryScatter } from 'victory-native';

test('victory-native and react-native-paper render', () => {
  let r: ReactTestRenderer | undefined;
  act(() => {
    r = create(
      <PaperProvider settings={{ icon: () => null }}>
        <Card><Card.Cover source={1} /><ProgressBar progress={0.3} /><Button mode="contained" icon="play-circle"><Text>x</Text></Button></Card>
        <VictoryPie data={[{ x: 'a', y: 1 }, { x: 'b', y: 2 }]} innerRadius={45} />
        <VictoryChart>
          <VictoryAxis /><VictoryAxis dependentAxis invertAxis />
          <VictoryLine data={[{ x: '500', y: 10 }, { x: '1000', y: 20 }]} />
          <VictoryScatter data={[{ x: '500', y: 10 }]} /><VictoryLegend data={[{ name: 'L' }]} />
        </VictoryChart>
      </PaperProvider>,
    );
  });
  expect(JSON.stringify(r!.toJSON())).toContain('"x"');
});
