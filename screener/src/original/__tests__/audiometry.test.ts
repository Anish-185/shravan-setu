import { cfg } from '@/config';
import { Audiometry } from '@/original/Audiometry';
import { calculateAverage, determineHearingCategory, worseEarGrade } from '@/original/hearing';

test('ascending 10 dB steps per ear and frequency, first Yes = threshold, capped by calibration', () => {
  const played: [string, number, number][] = [];
  const a = new Audiometry(cfg);
  a.start();
  // left: 500 Hz heard at 20; 1000 never (no response up to 60); 2000 at 0; 4000 at 10. right: all at 0.
  const left: Record<number, number | null> = { 500: 20, 1000: null, 2000: 0, 4000: 10 };
  let over = false;
  while (!over) {
    const tn = a.tone()!;
    played.push([tn.ear, tn.freq, tn.dbfs]);
    const ear = a.getEar();
    const t = ear === 'left' ? left[a.getFrequency()] : 0;
    over = a.regResponse(t !== null && a.getThreshold() >= t);
  }
  const base = cfg.calibration.baseline_dbfs.value;
  expect(played[0]).toEqual(['left', 500, base['500']]); // level 0 = the team baseline
  expect(Math.max(...played.filter((p) => p[1] === 500).map((p) => p[2]))).toBeLessThanOrEqual(0); // never above full scale
  expect(a.results.filter((r) => r.ear === 'left')).toEqual([
    { ear: 'left', frequency: 500, threshold: 20, max: 30 }, // baseline -35 dBFS: 40 would be above full scale
    { ear: 'left', frequency: 1000, threshold: null, max: 60 },
    { ear: 'left', frequency: 2000, threshold: 0, max: 60 },
    { ear: 'left', frequency: 4000, threshold: 10, max: 60 },
  ]);
  expect(calculateAverage(a.results, 'left')).toEqual({ db: 23, atLeast: true }); // (20 + 60 + 0 + 10) / 4
  expect(calculateAverage(a.results, 'right')).toEqual({ db: 0, atLeast: false });
  expect(worseEarGrade(a.results, cfg)).toBe('Mild');
});

test('WHO grade boundaries', () => {
  expect([-10, 19, 20, 34, 35, 49, 50, 64, 65, 79, 80, 200].map((d) => determineHearingCategory(d, cfg).category)).toEqual([
    'Normal', 'Normal', 'Mild', 'Mild', 'Moderate', 'Moderate', 'Moderately severe', 'Moderately severe', 'Severe', 'Severe',
    'Profound', 'Profound']);
});
