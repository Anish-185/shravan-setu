# Citations needed

Each row: the citation we need, the exact numbers or wording it would support, and where they are used. Until a
source arrives the value stays `TODO(source)` (or `PLACEHOLDER`) and every output that uses it says so.

## Already cited (read from the primary document, 2026-10-19)

| Source | Supports | Used in |
|---|---|---|
| American Academy of Audiology (2011), *Childhood Hearing Screening Guidelines*, Summary of recommendations, pure tone screening items 3, 6, 7 | 1000, 2000, 4000 Hz at 20 dB HL; no response at any frequency in either ear = failure; rescreen immediately | `config/screening.json` (frequencies, screening-level note, rescreen); `scripts/eval_nhanes.py` assumption A1 |
| WHO (2021), *World report on hearing*, Table 1.3 (ISBN 978-92-4-002048-1) | Grades by better-ear average of 500/1000/2000/4000 Hz: normal < 20 dB, mild 20 to < 35, ...; "unilateral": < 20 better ear, >= 35 worse ear; grades "for epidemiological use and applicable to adults" | `scripts/eval_nhanes.py` reference definitions (A2) |
| CDC NHANES data documentation: AUX_D, AUX_E, AUX_F, AUX_G, AUX_I, AUX_J | Which cycles tested which ages; variable names; 666 = no response, 888 = could not obtain; use MEC exam weights for population estimates | `scripts/eval_nhanes.py` |

Not reachable: the ASHA (1997) *Guidelines for Audiologic Screening* page (`asha.org/policy/GL1997-00199/`) returns
"page not found" today, so we cite AAA (2011) instead.

## Needed from you (the owner)

| # | Citation needed | Numbers / wording it supports | Where used |
|---|---|---|---|
| 1 | The study behind the brief's **prevalence** | 14.14% of school children (and its hearing-loss definition, age range, setting, method) | `config/district_model.json` `prevalence`; SIM-01..04 |
| 2 | The study behind the brief's **follow-up with SMS reminders only** | 39.4% of referred children followed up (and what "followed up" means, setting, sample size) | `config/district_model.json` `follow_up.sms_only`; SIM-01, SIM-03, SIM-04 |
| 3 | The study behind the brief's **follow-up with school ear camps** | 88.5% followed up when camps were held at school (same details) | `config/district_model.json` `follow_up.school_camp`; SIM-02..04 |
| 4 | A threshold-audiometry guideline (for example, ASHA *Guidelines for Manual Pure-Tone Threshold Audiometry*, or ISO 8253-1) | "Down 10, up 5" bracketing; threshold = lowest level with responses on 2 ascending presentations; rise/fall time of the tone (we use 25 ms ramps) | `config/screening.json` `calibration.step_down_db`, `step_up_db`, `heard_needed`, `tone.ramp_ms` |
| 5 | A source for the **psychometric slope** and **lapse rate** of pure-tone detection in children (or adults) | Our SIMULATED model uses a logistic spread of 2 dB and 2% lapses | `scripts/eval_nhanes.py` `SLOPE_DB`, `LAPSE`; NH-04..06 |
| 6 | Clinician review (not a citation, but needed before any field use) | Triage questions, the "likely treatable cause → PHC" rule, the DEIC default wording | `config/screening.json` `triage.*` |
| 7 | Typical class size in the target schools (or a government statistic) | 40 students per class (placeholder) | `config/cost_model.json` `students_per_class`; scenario C kit count (COST-03) |
| 8 | Optional: teacher cost per hour, and SMS price per message | Rupee value of ~5 min per child; future SMS cost | `config/cost_model.json` |
| 9 | Optional: an Indian school hearing-screening protocol (state or national programme, e.g. RBSK) | Would let us cite a local screening level and frequencies alongside AAA (2011) | `config/screening.json`, `scripts/eval_nhanes.py` |
