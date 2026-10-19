# Cost model and deployment plan (PROPOSED)

**Everything in this file is a proposed plan for a future school pilot, through SFIC's field-testing support. We
have not tested in any school.** Students per phone, scenarios and classroom tips are planning inputs, not
measurements. The numbers come from `scripts/cost_model.py` (inputs: `config/cost_model.json`) and are regenerated
into `eval/results.md` by `python -m eval.report`.

Software costs **Rs 0** in every scenario: free and open-source dependencies, no paid service, no API key, backend on
a school laptop (`docs/COST_AND_LICENSES.md`). Deployment costs are separate and all visible.

## Inputs (team estimate, online retail price, Oct 2026)

- Budget Android phone: Rs 10,000, assumed lifespan 3 years.
- Wired earphones with inline mic: Rs 400, assumed lifespan 1 year.
- Teacher time is reported in minutes. Its rupee value is an optional input, TODO(source), because screening may be
  part of existing school-health duties.
- Future cost, not in the totals: SMS reminders (stubbed today), TODO(source).

## Planning guideline (proposed)

About **250 students per calibrated phone** (recommended), acceptable up to **400**.

How it is derived (all inputs can be changed in `config/cost_model.json`):

- About 5 minutes per child including setup. The test itself took about 2 to 2.5 minutes in our device trials; the
  setup time is a team estimate. Team tests will re-measure it.
- 1 hour of screening per phone per school day, so about 12 children per phone per day.
- 250 students take about 21 school days (about a month) on one phone; 400 take about 33; 1,000 would take about 83.
- Phones needed = ceil(students / students per phone).

Each student misses only about 5 minutes, once a year. The guideline limits how long a screening round runs, not
student time.

## Scenarios

| Scenario | What the school buys | Recommendation |
|---|---|---|
| **A. School phone** | Phone + earphones (Rs 10,400 per kit) | **Recommended.** One calibrated phone+earphone pair gives consistent test levels; child data stays on a school device |
| **B. Teacher's own phone** | Earphones only (Rs 400) | Cheapest, but not recommended until per-model calibration exists (roadmap). Each phone model needs its own calibration, test levels vary across models until then, and child data sits on a personal phone |
| **C. One kit per class teacher, own phones** | Earphones per class teacher | Advantage is **speed, not cost**: each class teacher screens their own class at the same time, so the whole school finishes in about the days one class takes (a class of 40 at 1 h a day: about 3 school days vs about 21 for scenario A, CLAIMS COST-06). Costs more than B (one kit per class instead of one per 250 students), less than A. The same calibration and privacy issues as B, multiplied by the number of phone models, and less convenient to manage |

Cost per child per year for schools of 250, 400 and 1,000 students: see the cost table in `eval/results.md`.

## Several phones: one model

- Schools that need more than one phone should buy phones of **the same model** with **the same earphone model**.
- Calibration is done once per phone+earphone model, with volunteers (`docs/TEAM_TEST_PROTOCOL.md`). Each extra unit
  gets a quick check against the reference unit. This is a future procedure, in `docs/ROADMAP.md`, not designed or
  tested yet.
- Replacement earphones must be the same model.
- More than one phone also means no single point of failure: if one phone breaks, screening continues.

## Classroom tips (proposed)

- One child at a time, while the class continues with its lesson.
- Use free periods.
- Go class by class.
- A quiet corner or empty room: the app measures room noise and will ask for a retest when it is too noisy.
