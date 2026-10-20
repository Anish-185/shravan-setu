// The detailed (threshold) test's state machine. Copied from DhwaniSarathi audiometer/app/utils/Audiometry.js
// (Apache-2.0, the DhwaniSarathi team): per ear and frequency, levels go up in 10 dB steps and the first "Yes" is the
// threshold. Changed by us: frequencies and levels from config detailed_test (dB re: team baseline, not their
// MAX_DB = 75 volume mapping); each frequency stops at the loudest level the phone can play under our calibration
// (calibration.baseline_dbfs); a frequency never heard is recorded as no response (they dropped it); the masked phase
// is dropped (config detailed_test.masking); expo-av playback moved to the screen, which plays tone() through our calibrated player.
import type { Point } from '@/original/hearing';
import { v, type Config } from '@/rules';

const EARS = ['left', 'right'] as const;

export class Audiometry {
  results: Point[] = [];
  freq: number[];
  private amps: Record<number, number[]>;
  private base: Record<string, number>;
  Eptr = 0;
  Fptr = 0;
  Aptr = 0;
  MAX_E = 2;
  MAX_F: number;

  constructor(cfg: Config) {
    this.freq = v(cfg, 'detailed_test', 'frequencies_hz');
    this.base = v(cfg, 'calibration', 'baseline_dbfs');
    const levels: number[] = v(cfg, 'detailed_test', 'levels_db_re_team_baseline');
    this.amps = Object.fromEntries(this.freq.map((f) => {
      const b = this.base[String(f)];
      if (b === null || b === undefined) throw new Error(`No calibration baseline for ${f} Hz (config calibration.baseline_dbfs).`);
      return [f, levels.filter((l) => b + l <= 0)]; // never above full scale at player volume 1
    }));
    this.MAX_F = this.freq.length;
  }

  getResults() { return this.results; }

  get MAX_A() { return this.amps[this.getFrequency()]?.length ?? 1; }

  start() {
    this.results = [];
    this.Eptr = 0;
    this.Fptr = 0;
    this.Aptr = 0;
  }

  // Getters for View
  getEar() { return EARS[Math.min(this.Eptr, 1)]; }
  getFrequency() { return this.freq[this.Fptr]; }
  getThreshold() { return this.amps[this.getFrequency()]?.[this.Aptr]; }

  // DFA based on response
  updatePtrs() {
    this.Aptr += 1;
    if (this.Aptr >= this.MAX_A) {
      this.Aptr = 0;
      this.Fptr += 1;
    }
    if (this.Fptr >= this.MAX_F) {
      this.Fptr = 0;
      this.Eptr += 1;
    }
  }

  isTestOver() { return this.Eptr >= this.MAX_E; }

  /** The tone to play now (was playTone): ear, frequency and team baseline + level in dB re the tone file's full
   *  scale. null once the test is over. */
  tone() {
    if (this.isTestOver()) return null;
    const f = this.getFrequency();
    return { ear: this.getEar(), freq: f, dbfs: this.base[String(f)] + this.getThreshold() };
  }

  /** Records a Yes / No for the tone just played. Returns true when the test is over. */
  regResponse(response: boolean) {
    if (this.isTestOver()) return true;
    const amps = this.amps[this.getFrequency()];
    if (response) {
      this.results.push({ ear: this.getEar(), frequency: this.getFrequency(), threshold: this.getThreshold(), max: amps[amps.length - 1] });
      this.Aptr = this.MAX_A - 1; // next updatePtrs() moves on to the next frequency
    } else if (this.Aptr === this.MAX_A - 1) {
      this.results.push({ ear: this.getEar(), frequency: this.getFrequency(), threshold: null, max: amps[amps.length - 1] });
    }
    this.updatePtrs();
    return this.isTestOver();
  }
}
