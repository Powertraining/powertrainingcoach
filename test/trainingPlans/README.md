# Training Plan Simulations

This folder is the output target for exhaustive questionnaire simulations.

The script covers every finite questionnaire choice that currently exists in the app:

- 6 sports
- 5 session-frequency values
- 3 desired-training options
- 3 S&C experience levels
- 1 default safety/confidence capability profile
- 6 session-duration options
- 4 competition-period options
- 3 equipment-access options
- 3 focus-emphasis options

That produces `58,320` combinations before any free-text variants are added.

Free-text fields such as `eventPreparation` and `injuries` are not mathematically enumerable, so the simulation uses:

- an empty `eventPreparation` string
- an empty `injuries` array
- `daysPerWeek = sessionsPerWeek` to stay aligned with the current onboarding flow

Usage:

```bash
npm run simulate:training-plans
npm run simulate:training-plans -- --run --limit 10
npm run simulate:training-plans -- --run --sport Boxing,MMA --concurrency 2
```

Environment:

- `--run` resolves `OPENAI_API_KEY` in this order:
- local `OPENAI_API_KEY`
- Google Cloud Secret Manager via `gcloud`
- Google Cloud Secret Manager via API using metadata credentials or `GOOGLE_APPLICATION_CREDENTIALS`
- `OPENAI_API_MODEL` and `OPENAI_API_TEMPERATURE` are optional overrides
- `--gcp-project`, `--secret-name`, and `--secret-version` can override the Secret Manager lookup target

Outputs:

- `manifest.json` tracks the requested cases and the run summary
- one JSON file per scenario is written under a sport-specific subfolder
- each scenario file stores the questionnaire input, the generated plan, and validation notes
