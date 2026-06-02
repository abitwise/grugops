# factory.config.json — field reference

`agent-factory/config/factory.config.json` is the configuration dial for grugops. The Orchestrator reads it first on every run, and every role honors it when it is present. The file is visible and editable: change a value here and the whole factory adjusts.

This document is the human-readable twin of the JSON. Each top-level field has one row below: its allowed values, its lean default, and a one-line meaning.

## Fields

| Field | Allowed values | Default | Meaning |
|-------|----------------|---------|---------|
| `version` | SemVer string | `0.1.0` | Version of the grugops config schema this file targets. |
| `mode` | `lean`, `enterprise` | `lean` | `lean` = core agents + light Definition of Done; `enterprise` = full role pack + full gates. |
| `cadence` | `kanban`, `scrum` | `kanban` | `kanban` = continuous flow with WIP limits; `scrum` = fixed sprints + ceremonies. |
| `autonomy` | `diff`, `branch`, `pr` | `pr` | `diff` = produce diffs only; `branch` = commit to a branch; `pr` = branch + open a PR (agents never merge). |
| `id_prefix` | short uppercase string | `ABC` | Prefix for work-item IDs (e.g. `ABC-12`). Set this per project; `ABC` is the generic kit placeholder. |
| `repo_strategy` | `mono`, `poly` | `mono` | `mono` = nested `AGENTS.md` per package; `poly` = one `AGENTS.md` per repo plus a root index. |
| `default_stack` | object | TypeScript / node-fastify / Vue / PostgreSQL / Playwright / Docker / kubernetes-ready | Default technology stack the factory recommends for new work (keys: `language`, `backend`, `frontend`, `db`, `e2e`, `container`, `deploy`). |
| `wip_limits` | object of column → integer | per-column lean numbers | Work-in-progress cap for each board column; the board enforces these limits. |
| `sprint_length_days` | integer | `10` | Sprint length in days (used when `cadence` is `scrum`). |
| `sizing` | `tshirt` | `tshirt` | Estimation scheme for work items (T-shirt sizes XS–XL). |
| `priority_scheme` | `P0-P3` | `P0-P3` | Priority scale for work items, P0 (highest) through P3. |
| `quality` | object | see below | Quality gate settings (keys: `coverage_threshold`, `self_fix_attempts`, `mandatory_gates`, `e2e_when`). |
| `nfr` | object | see below | Non-functional-requirement targets (keys: `a11y_target`, `perf_p95_ms`, `availability`). |
| `compliance_regime` | array of strings | `[]` (empty) | Active compliance regimes, e.g. `["GDPR","SOC2"]`. Empty = trigger-only via sensitive-data rules. |
| `environments` | array of strings | `["dev","staging","prod"]` | Deployment environments the factory recognizes. |
| `production_requires_human_confirmation` | boolean | `true` | Must stay `true`: agents never deploy to production alone; a named human always confirms. |
| `blocked_escalation_days` | integer | `2` | Days a work item may stay blocked before it is escalated. |

### `default_stack` sub-fields

| Key | Default |
|-----|---------|
| `language` | `typescript` |
| `backend` | `node-fastify` |
| `frontend` | `vue` |
| `db` | `postgresql` |
| `e2e` | `playwright` |
| `container` | `docker` |
| `deploy` | `kubernetes-ready` |

### `wip_limits` sub-fields

| Column | Default |
|--------|---------|
| `Ready` | `8` |
| `In Analysis` | `2` |
| `In Design` | `2` |
| `Ready for Dev` | `6` |
| `In Development` | `3` |
| `In Review` | `3` |
| `In Security/NFR` | `2` |
| `Ready for UAT` | `4` |
| `In UAT` | `4` |
| `Ready to Release` | `4` |

### `quality` sub-fields

| Key | Default | Meaning |
|-----|---------|---------|
| `coverage_threshold` | `0.8` | Minimum test-coverage fraction required to pass the gate. |
| `self_fix_attempts` | `2` | Bounded number of automatic fix attempts before a work item is reported blocked. |
| `mandatory_gates` | `["lint","typecheck","unit","build"]` | Gates that must pass for every change. |
| `e2e_when` | `ui-or-critical-path` | When end-to-end tests run. |

### `nfr` sub-fields

| Key | Default | Meaning |
|-----|---------|---------|
| `a11y_target` | `WCAG-2.2-AA` | Accessibility conformance target. |
| `perf_p95_ms` | `300` | 95th-percentile latency budget in milliseconds. |
| `availability` | `99.9%` | Availability target. |

## Zero-config defaults

grugops runs with zero configuration. When no `factory.config.json` is present, the factory runs the lean baseline:

- `mode=lean`
- `cadence=kanban`
- `autonomy=pr`

These documented defaults — not the file alone — are what you can rely on. Every role reads the config first and honors it when present, and falls back to these same lean/kanban/pr defaults when the file is absent. The shipped `factory.config.json` is simply this lean baseline made visible and editable; deleting it does not change the default behavior.
