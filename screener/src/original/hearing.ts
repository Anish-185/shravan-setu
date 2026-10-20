// Hearing grades and averages for the detailed test. Copied from DhwaniSarathi audiometer/app/Screens/Results.js
// (determineHearingCategory, calculateAverage, categoryInfo) and AudiometryTest.js (pta per ear) (Apache-2.0, the
// DhwaniSarathi team). Changed by us: grade ranges from config hearing_grades (WHO 2021); a frequency not heard up
// to the loudest playable level counts at that level and makes the average "at least" (the original dropped it,
// which lowered the average); typos in the descriptions fixed. Levels are dB re: team baseline, so every grade is an
// estimate. Screening and referral only, never a diagnosis.
import { v, type Config } from '@/rules';

/** One detailed-test point. threshold null = no "Yes" up to `max`, the loudest level played. */
export type Point = { ear: 'left' | 'right'; frequency: number; threshold: number | null; max: number };
export type Grade = { grade: string; min_db: number; max_db: number | null };

export const grades = (cfg: Config): Grade[] => v(cfg, 'hearing_grades');

// ref: https://doi.org/10.2471%2FBLT.19.230367 (as in the original)
export function determineHearingCategory(average: number, cfg: Config) {
  for (const g of grades(cfg)) {
    if (average >= g.min_db && (g.max_db === null || average <= g.max_db)) {
      return { category: g.grade, formattedRange: g.max_db === null ? `${g.min_db}+` : `${g.min_db} to ${g.max_db}` };
    }
  }
  // Below the lowest grade (e.g. -20): shown as the lowest grade, as heard at every level we can play.
  const g = grades(cfg)[0];
  return { category: g.grade, formattedRange: `${g.min_db} to ${g.max_db}` };
}

/** Mean threshold of one ear (the original pta: 500/1000/2000/4000 Hz, our detailed_test frequencies), rounded.
 *  atLeast = some frequency was not heard, so the true average is this or higher. null = no points. */
export function calculateAverage(points: Point[], ear: 'left' | 'right') {
  const mine = points.filter((p) => p.ear === ear);
  if (mine.length === 0) return null;
  const sum = mine.reduce((acc, p) => acc + (p.threshold ?? p.max), 0);
  return { db: Math.round(sum / mine.length), atLeast: mine.some((p) => p.threshold === null) };
}

/** Grade of the worse ear (the original AssignmentAnalytics used max(pta_left, pta_right)). */
export function worseEarGrade(points: Point[], cfg: Config) {
  const avgs = (['left', 'right'] as const).map((e) => calculateAverage(points, e)?.db).filter((x) => x !== undefined);
  return avgs.length ? determineHearingCategory(Math.max(...(avgs as number[])), cfg).category : null;
}

// The original's colours per grade (AssignmentAnalytics.js hearingCategoryColors; "Moderately severe" added by us
// between their Moderate and Severe), and the audiogram band colours (their audiogram-bg.png and legend.jpeg).
export const GRADE_COLOR: Record<string, string> = {
  Normal: '#00FF00', Mild: '#ffbf00', Moderate: '#FFA500', 'Moderately severe': '#F4511E', Severe: '#d22b2b', Profound: '#800080',
};
export const BAND_COLOR: Record<string, string> = {
  Normal: '#00B0F0', Mild: '#FFCCFF', Moderate: '#FFFF99', 'Moderately severe': '#FFE0A0', Severe: '#99FF99', Profound: '#F8CBAD',
};
/** Text colour on a grade colour: the original's white, navy on the three light ones so the name stays readable. */
export const onGrade = (g: string) => (['Normal', 'Mild', 'Moderate'].includes(g) ? '#2b3467' : '#FFFFFF');
