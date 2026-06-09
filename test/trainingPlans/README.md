# Training Plan Simulations

This folder is the output target for training plan simulations.

## Matrix design

Each sport gets **100 cases** (default, configurable via `--cases-per-sport`).

The four highest-impact dimensions are fully enumerated so that every combination
of experience, training goal, competition period, and equipment is covered:

| Dimension | Values | Count |
|---|---|---|
| experience | beginner, intermediate, advanced | 3 |
| desiredTraining | strength_power, endurance, strength_power_endurance | 3 |
| competitionPeriod | off_season, pre_season, fight_camp, in_season | 4 |
| equipment | full_gym, home_minimal, bodyweight_only | 3 |

That gives **108 enumerated rows** per sport. The cap of 100 drops the last 8
(advanced × strength_power_endurance × last periods/equipment).

Lower-impact dimensions cycle round-robin across the 100 rows so all their values
appear without multiplying the total:

| Dimension | Values | Coverage in 100 cases |
|---|---|---|
| primaryStyle | sport-specific (see table below) | ~33 each |
| sessionsPerWeek | 1–5 | 20 each |
| focusEmphasis | mixed, more_sparring, more_conditioning | ~33 each |
| sessionDuration | 30_min, 45_min, 60_min, 75_min, 90_min, no_time_limit | ~17 each |

Not all four primary-style options apply to every sport:

| Sport | Valid styles |
|---|---|
| Boxing | balanced, striking, clinching |
| Wrestling | balanced, grappling |
| BJJ | balanced, grappling |
| Muay Thai / Kickboxing | balanced, striking, clinching |
| Judo | balanced, grappling, clinching |
| MMA | balanced, striking, grappling, clinching |

**Total: 100 cases × 6 sports = 600 scenarios.**

Free-text fields (`weightClass`, `injuries`) are not enumerable; the simulation uses
a sport-specific default weight class, an empty injuries array, and
`daysPerWeek = sessionsPerWeek`.

## Usage

```bash
npm run simulate:training-plans
npm run simulate:training-plans -- --run --limit 10
npm run simulate:training-plans -- --run --sport Boxing,MMA --concurrency 2
npm run simulate:training-plans -- --run --cases-per-sport 50
```

## API key resolution (`--run` only)

Resolved in this order — no manual key copying needed if you have `firebase login`:

1. `OPENAI_API_KEY` environment variable (or `functions/.secret.local`)
2. `firebase functions:secrets:access` — uses your `firebase login` session
3. `gcloud secrets versions access` — fallback if gcloud is available
4. GCP Secret Manager REST API — fallback for service-account / GCP VM environments

## Outputs

- `manifest.json` tracks the requested cases and the run summary
- one JSON file per scenario under a sport-specific subfolder
- each scenario file stores the questionnaire input, the generated plan, and validation notes
