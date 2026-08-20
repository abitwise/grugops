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
| `context` | object | see below | Shared-context memory settings (key: `compaction`). |
| `queue` | object | see below | Parallel-execution queue settings (keys: `wip_limit`, `claim_cap`, `stale_ttl_minutes`). Distinct from `wip_limits` — see below. |
| `models` | object | absent | Per-role model assignment for the generated Claude Code sub-agent adapters. Keys: `preset`, `roles` — see below. The allowed sets are closed — preset allowed set: `none`, `tiered`; alias allowed set: `inherit`, `opus`, `sonnet`, `haiku`. The lean default is the whole block absent, which resolves every role to `inherit` — the session-inheriting value, so a zero-config repository keeps the user's session model choice. This dial governs the `model` field of the generated role adapters and nothing else: it does not change which roles exist, which tools a role holds, the coordinator's spawn grant, or any gate, quality or security setting. |
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

### `context` sub-fields

| Key | Default | Meaning |
|-----|---------|---------|
| `compaction` | `aggressive` | How verbose the trajectory bodies promoted into the shared verified context are, and how much of the raw local trajectory reaches the read-by-default (shared) tier. Allowed: `aggressive`, `balanced`, `retain-raw`. This is a **body-verbosity / how-much-raw-reaches-shared knob only** — it is **never** the carve-out: the durable note set (`finding` / `decision` / `failed-attempt` / `artifact-ref`) and the load-bearing provenance fields (`verified_by` / `supersedes` / `by` / `at`, plus every raw `failed-attempt` id) survive identically at every value and cannot be dialled away (un-dialable, D-05). |
| `human_admission` | `off` | Whether a **named human** must dispose high-severity verified notes before they are admitted into the shared verified context (GOV-01). Allowed: `off`, `high-severity`, `all`. `off` = routine verified notes admit without a human stop (the lean default). `high-severity` = entries an authoring role flags high-severity — security, architecture, and release decisions — require a named human disposition before admission; routine notes still admit automatically. `all` = every verified note awaits a named human disposition before admission. The named human's disposition is what is recorded; the dial only widens *which* entries require that stop. |
| `audit_retention` | `git` | Durability of the admission/disposition **record** — the governance audit trail (GOV-02, D-08). Allowed: `git`, `retained`. `git` = the audit stays implicit in git history (the lean default); the commit log is the record. `retained` = grugops keeps a durable, append-only governance audit ledger under the repo's `.grugops/audit/` directory that an auditor can read end-to-end, independent of git archaeology. This governs record durability only; it does **not** change which entries are admitted or how verbose a note body is. |

### `queue` sub-fields

The `queue` object tunes parallel execution: how many agents may run at once, how many tasks a single delegation may claim, and when a stuck claim is reclaimed. The lean defaults `3 / 2 / 30` are deliberately conservative and dogfood-tunable — turn them up as the factory proves out wider concurrency on real work.

| Key | Default | Meaning |
|-----|---------|---------|
| `wip_limit` | `3` | Maximum concurrent agent **width** the coordinator may run — the cap on how many task agents execute in parallel at one time (CLAIM-03). The Orchestrator never spawns beyond this number; on the four CLIs that cannot spawn sub-agents it drains the queue sequentially at concurrency 1. |
| `claim_cap` | `2` | Maximum number of tasks a single delegation may claim at once (anti-flood). One agent cannot drain the whole queue in a single sweep; it claims at most this many and yields, so work stays spread across the available width. |
| `stale_ttl_minutes` | `30` | Wall-clock TTL, in minutes, after which the coordinator's stale-claim sweep reclaims a claim whose `claim.md` `at` timestamp is older than the TTL. Generous on purpose — it must exceed a real agent turn. No pid/host liveness is read; the sweep is wall-clock only. |

**`queue.wip_limit` (width) is independent from `wip_limits` (per-column flow).** They are two different limits that the Orchestrator respects at the same time, and the near-identical names are deliberate but must not be conflated:

- `wip_limit` (singular, inside `queue`) caps how many **agents run concurrently** — the parallel-execution width across the whole factory.
- `wip_limits` (plural, top-level) caps how many **work items may sit in each board column** — the flow limit per Kanban column (e.g. `In Development` ≤ 3).

A queue `wip_limit` of 3 and a board `In Development` `wip_limits` of 3 are unrelated coincidences of value; changing one never changes the other. (Same naming-collision care Phase 20 applied to the `claim` note-kind versus the queue CLAIM — the Orchestrator honors both, never one as the other.)

**`context.audit_retention` (governance-record durability) is distinct from `context.compaction` (note-body verbosity).** They are two independent context dials that govern different things and must not be conflated:

- `audit_retention` governs the **durability of the governance audit record** — whether the admission/disposition trail is left implicit in git history (`git`) or written to a durable append-only ledger an auditor can read end-to-end (`retained`).
- `compaction` governs the **verbosity of the note bodies** promoted into the shared verified context — how much of the raw local trajectory reaches the shared tier (`aggressive` / `balanced` / `retain-raw`).

`audit_retention: retained` is **not** a duplicate of `compaction: retain-raw`: the former keeps the *governance record* durable (who admitted/disposed what, and when), while the latter keeps the *note bodies* verbose. Turning either dial never changes the other, and the un-dialable carve-out behind `compaction` (the durable note set + load-bearing provenance fields, D-05) is untouched by `audit_retention`.

### `models` sub-fields

The `models` object assigns one model alias to each generated Claude Code sub-agent adapter. The whole block is absent in the lean default, and an absent block resolves every role to `inherit`.

| Key | Default | Meaning |
|-----|---------|---------|
| `preset` | `none` | The base assignment applied to every role. Closed preset allowed set: `none`, `tiered`. `none` gives every role `inherit` — the lean default, and the same answer an absent block gives. `tiered` gives each role the alias recorded for it in the tier table in `scripts/model-tiers.ts`, where every row carries a written rationale beside it. A third preset name is a source change with its rationale table, never a value a configuration file can invent. |
| `roles` | absent | A **sparse** override map keyed on the role filename stem (for example `software-engineer`), never a full map. Closed alias allowed set: `inherit`, `opus`, `sonnet`, `haiku`. A stem the map does not name keeps the preset's answer. |

**Precedence.** A `roles` override wins over `preset` for the role it names; `preset` answers for every other role.

**Refusals.** Four inputs are refused by name, each quoting the legal set back to you: a key inside the `models` block that is not `preset` or `roles`, a `preset` outside the two legal names, a `roles` key that is not a role filename stem in this kit, and an alias outside the four legal values. Membership is exact string equality throughout, so a case-varied key such as `Preset` is refused as an unknown key rather than read as `preset`, and a full model id is refused as an alias. Every offending key is named in one message rather than one per run. The unknown-key refusal is decided before any legal key beside it is read, so a block that pairs a valid `preset` with a misspelled `roles` is refused instead of applying the preset and dropping the overrides. A refusal writes nothing — the adapter generator exits naming the offending value and emits no adapter — and it never falls back to a pinned tier. A `models` block that is present but degenerate (`null`, an array, a string, a number) is refused rather than read as absent, because a user who wrote it meant something by it.

**What is closed, and what is not.** Two key sets are closed: the `models` block's own keys and the `models.roles` keys. The configuration file's **top-level** key set is deliberately open — the same file carries `governance`, `quality`, `queue`, `context` and the other dials documented above, each read by a different consumer — so a near-miss key written at file level rather than inside `models` is not refused. Writing `"model"` instead of `"models"` therefore gives you the zero-config answer, every role `inherit`, with no message; from the outside that is indistinguishable from having configured nothing. Closing the file's top level would require a registry of every reader of this file, which does not exist, so this limitation is stated here rather than left for you to discover. Check the spelling of the `models` key itself; everything inside it is checked for you.

**Host-CLI scope.** The model dial reaches one host CLI only. The single authority for that statement is `agent-factory/packaging/subagent.frontmatter.md`, section "Host-CLI scope of the model dial" — read the scope there. This reference deliberately does not restate it, so the two documents cannot come to say different things about the same capability.

**Where the block is read from, and which file wins.** The resolver looks in exactly two places, in this order: `.grugops/factory.config.json` first, then `agent-factory/config/factory.config.json`. **The first of those two files that EXISTS wins WHOLE** — it is read for the `models` block and the other file is never opened, whether or not the winning file actually carries a `models` key. The consequence is worth stating plainly, because it is the shape you are most likely to meet: a `.grugops/factory.config.json` that exists but contains no `models` key **shadows** a `models` block written into `agent-factory/config/factory.config.json`, and you get the zero-config answer — every role `inherit` — with no message. The seed grugops installs is exactly such a file, so this is the standard installed shape rather than an edge case. Write your `models` block into `.grugops/factory.config.json` and it will be read; write it into the in-kit file while a `.grugops/factory.config.json` exists and it will not. This whole-file precedence is deliberate and matches the `governance` dial's reader, which uses the same two locations in the same order.

**Disclosed limitation — an installed repository (closed by Phase 29.2, Model Assignment Delivery Path).** The model dial is resolved when the kit generates its adapters. Until Phase 29.2 lands, a `models` block written into an installed repository does not change the adapters that repository's session loads: the installer places the adapters the kit shipped, and those carry `model: inherit`. The mechanism itself resolves and emits correctly in-kit — a kit build carrying a `models` block produces adapters holding the resolved aliases — but that resolution does not yet reach an installed target. This is a disclosed limitation of the increment shipped in Phase 29.1, stated here rather than left for a user to discover; it is not a defect.

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
| `context.compaction` | `aggressive`, `balanced`, `retain-raw` | `aggressive` | `retain-raw` — full trajectory bodies admitted to the committed shared context (enterprise/audit: pay the tokens to keep the whole record durable). The body/raw verbosity knob is **all** the dial moves; the durable note set and the carve-out (the load-bearing provenance fields + every raw `failed-attempt` id) are **un-dialable at every value** (D-05) — exactly like `quality.test_integrity` has no `off`. |
| `context.human_admission` | `off`, `high-severity`, `all` | `off` | `high-severity`, then `all` — a named human must dispose ever-more entries before admission (GOV-01). This dial only ever **tightens** admission: each step up *adds* the named-human stop to more entries; it never subtracts a safety floor. The verified-context integrity floor (a note still cannot enter without passing structural validation and provenance) holds at every value — un-dialable, the same trace-integrity reason `quality.test_integrity` has no `off` (SC3 / D-12). |
| `context.audit_retention` | `git`, `retained` | `git` | `retained` — keep a durable append-only governance audit ledger an auditor can read end-to-end (GOV-02). This dial only ever **tightens** record durability (more is kept, never less); it never removes the audit floor that already exists in git history. |

## Zero-config defaults

grugops runs with zero configuration. When no `factory.config.json` is present, the factory runs the lean baseline:

- `mode=lean`
- `cadence=kanban`
- `autonomy=pr`

The same holds for the gate / test-first / security / memory dials documented above: every one of the nine keys (`bdd`, `quality.tdd`, `quality.lint`, `quality.ui_e2e`, `quality.test_integrity`, `quality.gate_enforcement`, `security.asvs_level`, `security.block_on`, `context.compaction`) degrades to its documented lean default when the key — or the whole file — is absent. A missing key is never an error; it is read as its lean default. So a missing `context.compaction` reads as `aggressive`, exactly the read-at-use, default-on-absent precedent the compactor relies on (D-06). (The single safety floor is `quality.test_integrity`, which has no `off` value in any mode — TINT-03; the carve-out behind `context.compaction` is un-dialable for the same trace-integrity reason — D-05.)

The same read-at-use, default-on-absent rule covers the `queue` object: a missing `queue.wip_limit`, `queue.claim_cap`, or `queue.stale_ttl_minutes` key — or the whole `queue` object — degrades to its lean default (`3 / 2 / 30`). A missing queue key is never an error; the coordinator reads it as the lean default, exactly as it reads a missing `context.compaction` as `aggressive`.

The same read-at-use, default-on-absent rule covers the two governance dials: a missing `context.human_admission` reads as `off`, and a missing `context.audit_retention` reads as `git` — exactly as a missing `context.compaction` reads as `aggressive`. A missing governance key — or the whole file — is never an error; it is read as its lean default, so zero-config grugops always runs lean (no human-admission stop, audit implicit in git). Governance is opt-in by turning the dial up; it is never imposed by the absence of configuration.

These documented defaults — not the file alone — are what you can rely on. Every role reads the config first and honors it when present, and falls back to these same lean defaults when the file is absent. The shipped `factory.config.json` is simply this lean baseline made visible and editable; deleting it does not change the default behavior.
