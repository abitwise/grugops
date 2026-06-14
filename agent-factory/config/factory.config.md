# factory.config.json — field reference

`.grugops/factory.config.json` is the per-repo configuration dial for grugops. The Orchestrator reads it first on every run, and every role honors it when it is present. The file is visible and editable: change a value here and the whole factory adjusts. This document is the field-by-field reference for that config; the kit ships the lean default as the seed source at `agent-factory/seed/.grugops/factory.config.json` (the installer walks `seed/**` and seeds it into `.grugops/`; D-01/D-02). The copy beside this reference at `agent-factory/config/factory.config.json` is a byte-identical companion to this document.

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
| `bdd` | `off`, `lean`, `strict` | `lean` | Behaviour-driven given-when-then depth at the acceptance/UAT layer (the business→engineer contract). `off` = no BDD scaffolding; `lean` = given-when-then on acceptance criteria; `strict` = executable BDD specs required. |
| `quality` | object | see below | Quality gate settings (keys: `coverage_threshold`, `self_fix_attempts`, `mandatory_gates`, `ui_e2e`, `tdd`, `lint`, `test_integrity`, `gate_enforcement`). |
| `nfr` | object | see below | Non-functional-requirement targets (keys: `a11y_target`, `perf_p95_ms`, `availability`). |
| `security` | object | see below | Security-audit settings anchored to OWASP ASVS (keys: `asvs_level`, `block_on`). |
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
| `ui_e2e` | `ui-or-critical-path` | When UI / end-to-end tests run. Allowed: `off`, `ui-or-critical-path`, `always`. |
| `tdd` | `encouraged` | Test-first (red-green) discipline at the unit layer. Allowed: `off`, `encouraged`, `required`. |
| `lint` | `{ strict: false, autofix: true }` | Linting policy: `strict` toggles fail-on-warning; `autofix` toggles auto-applying safe fixes. Complementary to the `lint` entry in `mandatory_gates` (that controls gate presence; this controls strictness). At the gate, `autofix:true` runs the linter's safe autofix inside the bounded `self_fix_attempts` loop (lint is agent-fixable), and when no linter is configured the lint step records `UNKNOWN - verify` non-blocking — never a faked pass. |
| `test_integrity` | `warn` | Policy for unjustified skipped/disabled tests. Allowed: `warn`, `block` — **never `off`** (TINT-03 trace-integrity safety carve-out; the gate must never silently accept a hollowed-out test suite). The gate's test-integrity step is **human-only** and checks the human-owned `.grugops/test-skips.md` registry: the agent may not self-author a justification, so an unjustified or expired skip short-circuits to `BLOCKED_NEEDS_FIX` (it does not spend a self-fix attempt). |
| `gate_enforcement` | `blocking` | Whether a failing quality gate blocks or only advises. Allowed: `advisory`, `blocking`. `advisory` composes with `test_integrity: block`: it downgrades the pipeline ACTION uniformly while the finding is **still emitted loudly** in clear voice — the trace stays intact, never silent (D-10). |

### `nfr` sub-fields

| Key | Default | Meaning |
|-----|---------|---------|
| `a11y_target` | `WCAG-2.2-AA` | Accessibility conformance target. |
| `perf_p95_ms` | `300` | 95th-percentile latency budget in milliseconds. |
| `availability` | `99.9%` | Availability target. |

### `security` sub-fields

| Key | Default | Meaning |
|-----|---------|---------|
| `asvs_level` | `L1` | OWASP ASVS verification level the security audit targets. Allowed: `L1`, `L2`, `L3`. `L1` = baseline; higher levels add depth for sensitive or regulated systems. |
| `block_on` | `high` | Lowest severity that blocks the gate on a security finding. Allowed: `none`, `low`, `medium`, `high`. `high` = only high-severity findings block; lower values are stricter (more findings block). |

## Config-dial contract (lean → enterprise)

This is the escalation contract for the gate / test-first / security dials. Each row states the key, its allowed values, the **lean default** (what zero-config gives you), and the **Enterprise escalation** (the direction a regulated team turns the dial). Phase 10 documents this contract; the behaviour behind each key is wired in later milestones (BDD/TDD, UI/E2E, ASVS) — turning a dial up does not, by itself, change behaviour until that capability ships.

| Key | Allowed values | Lean default | Enterprise escalation |
|-----|----------------|--------------|------------------------|
| `bdd` | `off`, `lean`, `strict` | `lean` | `strict` — executable given-when-then specs required as the business→engineer contract. |
| `quality.tdd` | `off`, `encouraged`, `required` | `encouraged` | `required` — red-green test-first is mandatory at the unit layer. |
| `quality.lint` | `{ strict, autofix }` | `{ strict: false, autofix: true }` | `{ strict: true }` — lint warnings fail the gate. |
| `quality.ui_e2e` | `off`, `ui-or-critical-path`, `always` | `ui-or-critical-path` | `always` — UI / E2E runs on every change, not only UI or critical-path work. |
| `quality.test_integrity` | `warn`, `block` | `warn` | `block` — unjustified skipped/disabled tests block the gate. **Never `off`** (TINT-03 trace-integrity safety carve-out): trace integrity cannot be dialled away in any mode. |
| `quality.gate_enforcement` | `advisory`, `blocking` | `blocking` | `blocking` — already strict at the lean default; there is no looser-than-lean enterprise setting (`advisory` is the relaxed direction, not the escalation). |
| `security.asvs_level` | `L1`, `L2`, `L3` | `L1` | `L2`, then `L3` with named human sign-off — deeper ASVS verification for sensitive or regulated systems. |
| `security.block_on` | `none`, `low`, `medium`, `high` | `high` | `medium`, then `low` — more security findings block the gate as the bar rises. |

## Zero-config defaults

grugops runs with zero configuration. When no `factory.config.json` is present, the factory runs the lean baseline:

- `mode=lean`
- `cadence=kanban`
- `autonomy=pr`

The same holds for the gate / test-first / security dials documented above: every one of the eight keys (`bdd`, `quality.tdd`, `quality.lint`, `quality.ui_e2e`, `quality.test_integrity`, `quality.gate_enforcement`, `security.asvs_level`, `security.block_on`) degrades to its documented lean default when the key — or the whole file — is absent. A missing key is never an error; it is read as its lean default. (The single safety floor is `quality.test_integrity`, which has no `off` value in any mode — TINT-03.)

These documented defaults — not the file alone — are what you can rely on. Every role reads the config first and honors it when present, and falls back to these same lean defaults when the file is absent. The shipped `factory.config.json` is simply this lean baseline made visible and editable; deleting it does not change the default behavior.
