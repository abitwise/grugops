# Phase 6: Validation, Brand & Dogfood - Research

**Researched:** 2026-06-03
**Domain:** Structure-validation tooling (Node/ESM), example-run narration, brand/legal collateral assembly, and a hybrid live-plus-runbook dogfood — the acceptance gate for grugops
**Confidence:** HIGH (all assertion targets, harness idioms, and brand source blocks are present and inspected in-repo; no external API surface to verify)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Baseline carried forward (apply without re-asking):**
- **Command surface is `/grugops` everywhere (D-29 — supersedes the brand manual's literal `/grug`):** `/grugops "<request>"` + `/grugops-map|plan|ticket|gate|uat|release` (dash, standalone) is the primary on-brand surface; the plugin form is `/grugops:<op>` (colon). **No literal `/grug` appears in any Phase-6 collateral.**
- **Two-voice discipline (D-21):** clear professional English for README opener/pitch, safety, legal, NOTICE, CONTRIBUTING, FAQ; grug wink only in framing prose. Never let the joke muddy a safety/legal topic.
- **No fabrication (hard, spec §18/§19.9):** the validator never fakes a pass; does **not** create `package.json` if absent; illustrative examples are explicitly labeled; `UNKNOWN - verify` slots stay unfilled.
- **VERSION is `0.1.0` (D-28):** README states `0.1.0`; `agent-factory/VERSION` is canonical, mirrored in `.claude-plugin/plugin.json`.
- **Shipped-kit vs grugops's-own-build identity (D-04):** examples/validator/brand collateral describe the **generic shipped kit**; grugops's own build state stays in `.planning/`. The dogfood sample is a *separate throwaway repo*, not grugops itself.
- **Mandatory non-affiliation:** grugbrain.dev (Carson Gross) attribution + non-affiliation footer ship verbatim from the brand manual's ready-to-paste blocks in README/NOTICE.

**Dogfood execution & proof:**
- **D-38 (Hybrid execution model):** executor drives everything with no live-CC-session dependency live on the sample repo (portable AGENTS.md sequential role-load path; validator run) and captures it as **REAL proof**. It authors a precise human runbook/checklist for parts that require a live CC session: marketplace plugin install + D-31 plugin-cache repo-relative pointer resolution, live PreToolUse hook firing (SAFE-02), and the CC sub-agent spawn path. Honest split: agent-proven vs human-pending.
- **D-39 (Sample repo = minimal real app in grugops's recommended greenfield stack):** small real app in grugops's greenfield default (small **TS/Node+Fastify** or **Vue**), created **fresh in a temp/sibling dir OUTSIDE the grugops repo**; bootstrap + one small real ticket (e.g. add an endpoint/component) idea→PR.
- **D-40 (One real DOGFOOD report = EX-01 example #3):** a single real captured artifact serves double duty — `examples/03-ticket-to-pr.md` shows input → Orchestrator decisions → board moves → handoffs → gate result → PR link, labeled **REAL RUN**, with live-session-dependent checks marked **"pending human."** That same artifact **IS** the EX-01 ticket→PR example.
- **D-41 (Dual-path parity split):** the **sequential AGENTS.md path is agent-run live and captured**; the **CC sub-agent spawn path** (plugin install, `settings.json` `agent:`, sub-agent spawn, hook firing) lives in the **human runbook**. Parity asserted via a **side-by-side checklist**: same ticket, same handoff files produced, same gate verdict.

**Validator scope & strictness:**
- **D-42 (Shipped + dual-purpose self-validation):** validator is the shippable kit check **AND** runs **green against grugops's own `agent-factory/` tree** as a CI/self-test gate. The 6 existing per-phase `.planning/.../check-structure.sh` harnesses **stay as historical build gates** — not replaced, not shipped.
- **D-43 (Pass on empty seeded state — structural, vacuous):** kit ships `board.md`/`traceability.md` seeded with **zero ticket rows**. Ticket/board/traceability checks are **conditional on ticket files existing** — zero tickets → zero violations → fresh install validates green. Structural file/section/config/packaging checks always run and must pass.
- **D-44 (Two-tier strictness + exit codes):** **ERRORS** (missing required file/section; config doesn't parse or lacks mode/cadence/autonomy; `plugin.json` missing `name`; board/ticket status mismatch) → **exit 1**. **WARNINGS** (traceability rows missing tests/UAT; soft gaps) → **reported but exit 0**. A **`--strict` flag promotes warnings to errors** for CI.
- **D-45 (Known-good + known-bad fixtures self-test):** ship a self-test (in the kit's `guard.test.sh`/`install.test.sh` style) running the validator against a tiny **GOOD** fixture tree (expects exit 0) **AND** one or more **BAD** trees (missing section, bad config, `plugin.json` without `name`, board/ticket mismatch → expects nonzero + the correct finding). Invocation is plain `node scripts/validate-agent-factory.mjs` (**no `package.json` created**).

**Example runs:**
- **D-46 (Capture what the dogfood gives; illustrate the rest):** **REAL-captured** — #3 ticket→PR **and** #1 greenfield bootstrap (both fall out of the dogfood run). **ILLUSTRATIVE** (hand-authored, labeled "expected") — #2 brownfield bootstrap, #4 sprint cycle, #5 release run.
- **D-47 (Explicit per-file honesty banner + placeholder IDs):** every **illustrative** example opens with *"Illustrative run — expected output, not a captured session"* and uses obvious placeholder IDs/links (`ABC-001`, `REL-0007`, `<PR-link>`). **Real** captures open with *"Real run — captured 2026-06-03"* and carry actual artifacts/links.
- **D-48 (`examples/` at repo root, structured medium-depth):** one markdown per run in `examples/` (`01-greenfield-bootstrap.md` … `05-release-run.md`, with `03` = the real dogfood ticket→PR). Each: **input → Orchestrator decision/routing → board moves → expected files/handoffs with representative snippets (not full file dumps) → trace/metrics line where relevant.** Sprint run includes board snapshots + a velocity line; release run shows completed traceability rows.

**Brand collateral & naming reconciliation:**
- **D-49 (Render shipped command surface only; never literal `/grug`):** all collateral uses `/grugops "<request>"` + `/grugops-map|plan|ticket|gate|uat|release` (dash standalone) as primary, and notes the plugin colon form `/grugops:*` where distribution/install is discussed. **No literal `/grug` anywhere.** grugbrain.dev attribution + non-affiliation footer ship verbatim.
- **D-50 (Ship the manual's SVGs as-given; derive the variants; light cleanup ok):** use the brand manual's two drop-in SVGs (color wordmark; icon). **Mechanically derive** three variants: **mono-dark** (all-Charcoal), **mono-light/reverse** (all-Bone), and the **horizontal icon+wordmark lockup**. **No new concept.** **Light cleanup allowed** (alignment, `viewBox`, accessibility attrs, optimized paths) — no concept change. Locked palette Charcoal/Bone/Granite + single Ochre; lowercase `grugops`; never resemble the children's-book character.
- **D-51 (Root README = public face linking to internal README):** root `README.md` is the public face — clear-voice opener → grug wink, hero block, install quickstart, Acknowledgements (grugbrain.dev / Carson Gross), non-affiliation footer — and **links to the existing `agent-factory/README.md`** for the deep entry. The internal README stays **untouched**.

### Claude's Discretion
- Exact validator finding messages, the structure of its findings report, and precise fixture-tree contents (as long as GOOD passes, each BAD fails with the right finding, and it self-validates grugops's own tree).
- Specific sample-app shape (which endpoint/component the one dogfood ticket adds) and the one-ticket scope, as long as it's a real idea→PR on the chosen stack.
- Exact wording of the human runbook/checklist and the side-by-side dual-path parity table, as long as they cover D-31 cache-pointer resolution + live hook firing + sub-agent spawn.
- Illustrative-example narrative depth and snippet selection within medium-depth bound; the precise velocity/metrics line and board-snapshot rendering.
- SVG derivation details (exact mono recolors, lockup spacing/proportions, a11y attributes) within D-50's "no concept change."
- Exact README section ordering and FAQ/CONTRIBUTING/NOTICE wording, as long as they reproduce the manual's ready-to-paste blocks and the D-49 command surface.

### Deferred Ideas (OUT OF SCOPE)
- **Live-session human acceptance items (carried into the DOG human runbook, not a new phase):** plugin-cache repo-relative pointer resolution (D-31) and live PreToolUse hook firing (SAFE-02) remain human-run; results land in the Phase-6 human UAT/runbook.
- **Filling real gate/deploy commands** into a project's `AGENTS.md` `UNKNOWN - verify` slots and the guard's per-project pattern list — done per-project at bootstrap/runtime, never fabricated in the kit (the dogfood may fill them for its sample repo only, recorded as that repo's real values).
- **Milestone close / post-dogfood requirement promotion** — moving Active requirements to Validated is a milestone-boundary activity (`/gsd-complete-milestone`), not a Phase-6 build task.

**OUT OF SCOPE (phase boundary):** any edit to the frozen `agent-factory/` core, the Phase-5 packaging/install/hooks layer, `docs/initial/`, `.planning/`, or user files. No new role/workflow/config/handoff/checklist content. No new capabilities — this phase only validates, narrates, brands, and proves what already exists.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VAL-01 | `scripts/validate-agent-factory.mjs` checks structure (files exist; role/workflow section presence; config parses + mode/cadence/autonomy; board↔ticket status match; traceability completeness flagged; packaging present + `plugin.json` has `name`); never fabricates; no `package.json` if absent | Exact assertion targets enumerated in **Standard Stack → Validator Assertion Contract**; harness idioms in **Architecture Patterns**; the line-96 duplicate-header tolerance and zero-row vacuity (D-43) in **Common Pitfalls** |
| EX-01 | Five example runs (greenfield bootstrap, brownfield bootstrap, ticket→PR, sprint cycle with board snapshots + velocity line, release run with completed traceability rows) | §7 flow definitions mapped per-example in **Architecture Patterns → Example Run Map**; honesty-banner + placeholder-ID conventions; real-vs-illustrative split |
| BRAND-01 | `README.md`: clear-voice opener → grug wink, hero block, Acknowledgements (grugbrain.dev / Carson Gross), non-affiliation footer | Exact ready-to-paste blocks (§8.6 hero, §10.4-A/B) reproduced in **Code Examples**; D-49 command-surface reconciliation; D-51 link-to-internal-README structure |
| BRAND-02 | `NOTICE`, `CONTRIBUTING.md`, `docs/faq.md` from the manual's ready-to-paste blocks | §10.4-C NOTICE, §10.3 contributor rules, §8.8 FAQ reproduced verbatim in **Code Examples** |
| BRAND-03 | `brand/wordmark*.svg` (color, mono-dark, mono-light/reverse, icon lockup) + `brand/icon.svg`; original art, lowercase grugops, Charcoal/Bone/Granite + single Ochre | Exact §6.3 wordmark + §6.4 icon SVGs and §6.1 palette hex in **Code Examples**; mechanical derivation recipe (D-50) |
| DOG-01 | grugops installed via `/grugops` on a throwaway sample repo, bootstrapped, one ticket idea→PR; validator passes on the result | Hybrid model in **Architecture Patterns → Dogfood Architecture**; sample-repo shape (D-39); landmines in **Common Pitfalls** |
| DOG-02 | Same roles/handoffs/gates over both the portable AGENTS.md sequential path and the CC sub-agent spawn path — "only the dispatch differs, never the content" | Dual-path parity split (D-41) with the agent-proven/human-runbook boundary; the two Phase-5-deferred live tests to absorb |
</phase_requirements>

## Summary

Phase 6 is the acceptance gate. It writes **no new role/workflow/config/handoff/checklist content** — Phases 1–5 are frozen and immutable. It produces four new top-level deliverables against an already-complete tree: (1) a shipped structure-only Node validator `scripts/validate-agent-factory.mjs` plus its GOOD/BAD fixture self-test, (2) five `examples/0{1..5}-*.md` run narrations (two real-captured from the dogfood, three clearly-labeled illustrative), (3) brand/legal collateral (`README.md`, `NOTICE`, `CONTRIBUTING.md`, `docs/faq.md`, `brand/*.svg`) assembled almost entirely from the brand manual's pre-written ready-to-paste blocks, and (4) a hybrid dogfood proving the chain idea→PR on a throwaway sample repo — agent-run-and-captured for the portable sequential path, human-runbook for the live-CC-session parts.

The good news for the planner: **almost nothing here is invention.** The validator's assertion targets all exist and were inspected (16 roles with 8 sections each, 14 workflows with 9–10 sections each, a parseable config, a zero-row board/traceability, a `name`-bearing `plugin.json`). The brand collateral is pre-written verbatim in `docs/initial/grugops_brand_manual.md` §6/§8/§10 — the only systematic edit is the D-49 swap of literal `/grug` → `/grugops`. The harness idioms (`pass()`/`fail()`, `ALL CHECKS PASSED`, exit-0/1, GOOD/BAD fixtures, temp-dir isolation) are established and proven in `hooks/guard.test.sh` (26/26) and `install/install.test.sh` (13/13). Node 24 is installed; the validator needs **zero npm dependencies** (Node stdlib only, mirroring `install.mjs`/`guard.mjs`).

The two genuine risk areas are both about **honesty under the no-fabrication rule**: the validator must prove it can FAIL (BAD fixtures, D-45), and the dogfood must visibly wear its agent-proven/human-pending split (D-38/D-41) rather than simulate a marketplace install or a real hook interception it cannot actually perform.

**Primary recommendation:** Build the validator as a pure-Node ESM script with a two-tier `errors[]`/`warnings[]` collector, prefix-match section headers (not exact-string), make all ticket/board/traceability checks conditional on `plans/tickets/*.md` existing (vacuous-green on the seeded zero-row state), tolerate the duplicate `## Scope`/`## Risks` in `product-handoff.md` + `implementation-handoff.md` by checking section *presence* not *uniqueness*, and ship a `validate.test.sh` GOOD/BAD harness in the exact `guard.test.sh` idiom. Assemble all brand collateral by copy-pasting the manual's blocks and applying the single `/grug`→`/grugops` reconciliation. Run the dogfood live for the sequential path + validator, and author a precise human runbook for the three live-CC-session items.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Structure validation (VAL-01) | Build tooling (Node ESM script) | — | Reads markdown/JSON across the tree; emits findings + exit code. No runtime, no host-agent dependency. Mirrors `install.mjs`/`guard.mjs` stdlib-only posture. |
| Validator self-test (D-45) | Test harness (POSIX sh) | Node (invokes the validator) | Same tier as `guard.test.sh`/`install.test.sh`: a `.sh` driver pipes fixtures and asserts on exit code + finding text. |
| Example runs (EX-01) | Documentation (markdown) | — | Pure narration of finished flows; no code. Two are *captured artifacts* of the dogfood (a process output, not a tier). |
| Brand SVGs (BRAND-03) | Static asset (SVG markup) | — | Hand-written XML; rendered by browsers/markdown viewers. No build step, no runtime. |
| README / NOTICE / CONTRIBUTING / FAQ (BRAND-01/02) | Documentation (markdown) | — | Public-facing prose assembled from the manual's blocks. |
| Dogfood — sequential path (DOG-01/02 agent half) | Host coding agent (this CC session, acting as Orchestrator on a *sibling* repo) | grugops kit (the thing under test) | The agent loads `AGENTS.md` → `orchestrator.md` and runs the flow against a separate sample repo. The intelligence is the host agent; grugops supplies role/guardrail/state. |
| Dogfood — CC-native path (DOG-02 human half) | Human operator + live Claude Code session | Plugin runtime (marketplace install, plugin cache, PreToolUse hook) | Plugin install, `${CLAUDE_PLUGIN_ROOT}` cache resolution, sub-agent spawn, and live hook firing **cannot be honestly self-driven by an executor sub-agent** — they require a real interactive CC session. Hence the human runbook. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js (ESM) | 18+ LTS (24.12.0 present `[VERIFIED: node --version]`) | Runtime for `scripts/validate-agent-factory.mjs` | The kit's only non-markdown runtime; `install.mjs` + `guard.mjs` already establish Node stdlib-only as the house pattern. No new dependency added. |
| `node:fs` | stdlib | Read files, list dirs, check existence | Used by `install.mjs` (`readFileSync`, `existsSync`, etc.). No third-party fs lib needed. |
| `node:path` | stdlib | Path joining / resolution | Same as `install.mjs`. |
| `node:url` (`fileURLToPath`) | stdlib | Resolve the script's own dir (for self-validating grugops's tree) | `install.mjs` uses `dirname(fileURLToPath(import.meta.url))` — reuse this idiom so the validator finds the repo root regardless of cwd. |
| POSIX `sh` | n/a | `scripts/validate.test.sh` GOOD/BAD harness (D-45) | Mirrors `hooks/guard.test.sh` + `install/install.test.sh` exactly: `#!/usr/bin/env sh`, `set -eu`, `pass()`/`fail()`, `ALL CHECKS PASSED`, exit 0/1, `mktemp -d` + `trap cleanup`. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `JSON.parse` (built-in) | n/a | Parse `factory.config.json` + `plugin.json` | Wrap in try/catch — a parse failure is itself an ERROR finding (D-44). |
| Front-matter parsing (hand-rolled, ~10 lines) | n/a | Extract `column:` / `status:` from ticket `*.md` front-matter | **Do NOT add `gray-matter` or any YAML lib** — the board↔ticket check only needs two fields, and adding an npm dep would force a `package.json` (forbidden, D-45). A 3-line `grep`-equivalent (`/^column:\s*(.+)$/m`) is sufficient. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure-Node validator (`.mjs`) | TypeScript `.ts` + build step | Spec §18 offers `.mjs` **or** `.ts`; `.mjs` needs no compile, no `tsconfig`, no `package.json`. D-45 mandates plain `node scripts/validate-agent-factory.mjs` invocation. Choose `.mjs`. |
| Hand-rolled front-matter regex | `gray-matter` npm package | A dependency forces `package.json`, which §18/D-45 forbid creating. The check needs only `column:`/`status:` — regex wins. |
| Two-tier `errors`/`warnings` arrays | A single boolean pass/fail | D-44 explicitly requires the ERROR/WARNING split + `--strict` promotion. Single pass/fail was a rejected option. |
| `.sh` GOOD/BAD harness | A Node test runner (`node:test`) | `node:test` is viable, but the kit's *proven, consistent* harness idiom is POSIX `.sh` (guard.test.sh, install.test.sh, 6× check-structure.sh). D-45 says "in the kit's existing `guard.test.sh`/`install.test.sh` style." Match it. |

**Installation:**
```bash
# No installation. Node 18+ stdlib only. The validator runs as:
node scripts/validate-agent-factory.mjs            # exit 0 = green, 1 = errors
node scripts/validate-agent-factory.mjs --strict   # warnings promoted to errors
sh scripts/validate.test.sh                        # GOOD/BAD fixture self-test
```

**Version verification:** `node --version` → `v24.12.0` `[VERIFIED: node --version]`. No npm packages required, so no registry verification applies (see Package Legitimacy Audit).

### Validator Assertion Contract (the exact targets — VAL-01)

> All targets below were inspected in-repo on 2026-06-03 and are present/passing. The validator codifies these. `[VERIFIED: in-repo inspection]` unless noted.

**1. Required files exist** (ERROR if missing):

| Set | Count | Path glob | Verified |
|-----|-------|-----------|----------|
| Roles | 16 | `agent-factory/roles/*.md` | 16 present `[VERIFIED]` |
| Workflows | 14 | `agent-factory/workflows/00..13-*.md` | 14 present, no `14-*.md` `[VERIFIED]` |
| Handoffs | 16 | `agent-factory/handoffs/*.md` | 16 present `[VERIFIED]` |
| Checklists | 11 (10 named + `00-index.md`) | `agent-factory/checklists/*.md` | 11 present `[VERIFIED]` |
| Config | 2 | `agent-factory/config/factory.config.{json,md}` | both present `[VERIFIED]` |
| State plane | 4 | `plans/{board,traceability,nfr-catalog,metrics}.md` | all present `[VERIFIED]` |
| Packaging | `adapters.md` + manifests | `agent-factory/packaging/adapters.md`, `.claude-plugin/plugin.json` | present `[VERIFIED]` |
| Substrate | 1 | root `AGENTS.md` | present `[VERIFIED]` |

The exact frozen role/workflow/handoff names are enumerable from the Phase-4 harness (`FROZEN_HANDOFFS`, `WORKFLOWS` vars) — reuse those exact name lists.

**2. Role files contain their 8 sections** (ERROR if any missing). The spec §18 abbreviates; the **actual headers** (match by prefix, `^## <prefix>`):

| Spec §18 name | Actual header in files | Match strategy |
|---------------|------------------------|----------------|
| One job | `## One job` | exact |
| Caveman prompt | `## Caveman prompt` | exact |
| Reads | `## Reads` | exact |
| Responsibilities | `## Responsibilities` | exact |
| Output | `## Output (file + format)` | **prefix** `^## Output` |
| Board moves | `## Board moves (which column transitions this role causes)` | **prefix** `^## Board moves` |
| Trace updates | `## Trace updates (what it must record in plans/traceability.md)` | **prefix** `^## Trace updates` |
| Hard limits | `## Hard limits` | exact |

> **CRITICAL:** Use **prefix matching** (`^## Output`), NOT exact-string equality. All 16 roles were verified to pass under prefix match `[VERIFIED: grep across all 16 roles]`. An exact-string check would false-fail every role.

**3. Workflow files contain their 9 sections** (ERROR if any missing). Spec §18 lists 9 (When, Agents, Inputs, Steps, Board moves, Handoffs, Trace updates, Stop, Done); the actual template has 10 (adds `## Metrics emitted`). Match by prefix:

| Spec §18 name | Actual header | Match |
|---------------|---------------|-------|
| When | `## When to use` | `^## When` |
| Agents | `## Agents involved` | `^## Agents` |
| Inputs | `## Inputs required` | `^## Inputs` |
| Steps | `## Steps` | exact |
| Board moves | `## Board moves` | `^## Board moves` |
| Handoffs | `## Handoffs produced` | `^## Handoffs` |
| Trace updates | `## Trace updates` | `^## Trace updates` |
| Stop | `## Stop conditions` | `^## Stop` |
| Done | `## Done condition` | `^## Done` |

All 14 workflows verified to pass under prefix match `[VERIFIED: grep across all 14 workflows]`. (Checking the 9 §18-named sections is sufficient; `## Metrics emitted` is bonus and need not be asserted, though it may be.)

**4. Config parses and has `mode`/`cadence`/`autonomy`** (ERROR otherwise). `factory.config.json` is valid JSON with `mode: "lean"`, `cadence: "kanban"`, `autonomy: "pr"` `[VERIFIED]`. Implementation: `JSON.parse` in try/catch; on success assert the three keys are present (non-empty strings).

**5. Board↔ticket status match** (ERROR on mismatch; **VACUOUS when zero tickets**, D-43):
- `plans/board.md` exists and declares the 13 columns as `## <Column> (WIP …)` headings `[VERIFIED]`.
- For **each** `plans/tickets/*.md` (currently **none** — dir holds only `.gitkeep` `[VERIFIED]`): parse front-matter `column:` and `status:`. Assert (a) the board has a `## <column>` heading, and (b) `status:` equals the kebab-case form of `column:` (e.g. `column: In Development` ↔ `status: in-development`). The board file documents this contract verbatim (lines 33–45).
- **Zero tickets → zero iterations → zero violations → green.** This is the D-43 vacuity that lets a fresh install pass.

**6. Traceability completeness** (WARNING, not ERROR — D-44):
- `plans/traceability.md` exists with the fixed header row `[VERIFIED]`.
- For each ticket file, assert a matching row exists in the matrix (WARNING if missing).
- Flag rows missing the Tests or UAT column value (WARNING). Spec §18: "flags rows missing tests/UAT" — a **flag**, not a fail. Vacuous on zero tickets.

**7. Packaging presence** (ERROR):
- `agent-factory/packaging/adapters.md` exists `[VERIFIED]`.
- IF `.claude-plugin/plugin.json` exists, it parses and has a non-empty `name` (it does: `"name": "grugops"` `[VERIFIED]`). Spec wording: "if … plugin.json exists, it has a name" — guarded, not unconditional.

**8. No `package.json` creation** (hard rule): the validator and its harness must run with **zero** `package.json`. Verified none exists anywhere in the repo `[VERIFIED: find -name package.json → empty]`. Invocation is bare `node scripts/...mjs`.

## Package Legitimacy Audit

> The Phase-6 validator and its harness install **no external packages** — Node stdlib only (`node:fs`, `node:path`, `node:url`), mirroring the already-shipped `install.mjs` and `guard.mjs`. This is a hard requirement of D-45/§18 (no `package.json` may be created).

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| *(none)* | — | — | — | — | N/A | No external packages by design |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

The Standard Stack table deliberately rejects `gray-matter` / any YAML or test-runner dependency precisely to keep the zero-dependency, zero-`package.json` posture. No registry verification is needed because nothing is installed.

## Architecture Patterns

### System Architecture Diagram

```
                          PHASE 6 — three independent deliverable streams + one convergence
                          (Phases 1-5 tree is FROZEN — read-only input to all of this)

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │ STREAM A — VALIDATOR (VAL-01)                                                     │
  │                                                                                   │
  │  frozen tree ──read──> validate-agent-factory.mjs ──> errors[]/warnings[]         │
  │  (roles, workflows,         │  (prefix-match sections,        │                   │
  │   handoffs, checklists,     │   JSON.parse config,            │                   │
  │   config, board,            │   ticket loop = VACUOUS,        ├─> exit 0 (green)   │
  │   traceability, plugin.json)│   tolerate dup ## Scope/## Risks)├─> exit 1 (errors) │
  │                             │                                  └─> --strict: warn→err│
  │                             ▼                                                       │
  │  scripts/validate.test.sh ──> GOOD fixture (expect 0) + BAD fixtures (expect ≠0    │
  │  (guard.test.sh idiom)         + correct finding text) ──> ALL CHECKS PASSED        │
  │                             └─> ALSO run validator on grugops's OWN tree → green    │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │ STREAM B — BRAND/LEGAL COLLATERAL (BRAND-01/02/03)                                │
  │                                                                                   │
  │  brand_manual §6.3 ──copy──> brand/wordmark.svg (color) ──derive──> mono-dark,     │
  │  brand_manual §6.4 ──copy──> brand/icon.svg              mono-light, icon-lockup    │
  │  brand_manual §8.6 ──copy+reconcile(/grug→/grugops)──> README.md (hero)            │
  │  brand_manual §10.4-A/B ──copy──> README Acknowledgements + non-affiliation footer  │
  │  brand_manual §10.4-C ──copy──> NOTICE   §10.3 ──copy──> CONTRIBUTING.md            │
  │  brand_manual §8.8 ──copy──> docs/faq.md                                           │
  │  README ──links to──> agent-factory/README.md (UNTOUCHED, D-51)                    │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │ STREAM C + CONVERGENCE — DOGFOOD (DOG-01/02) → feeds EX-01 #1 and #3              │
  │                                                                                   │
  │  SAMPLE REPO (fresh, SIBLING dir, TS/Node+Fastify or Vue) — NOT this repo          │
  │      │                                                                            │
  │      ├─ install grugops (sequential AGENTS.md path)                                │
  │      ├─ AGENT-RUN LIVE & CAPTURED ──> bootstrap (00) ──> ticket idea→PR (04→05)    │
  │      │     produces: AGENTS.md, board moves, handoffs, gate verdict, PR            │
  │      │     ──> examples/01-greenfield-bootstrap.md  (REAL RUN)                     │
  │      │     ──> examples/03-ticket-to-pr.md          (REAL RUN = the DOGFOOD report)│
  │      ├─ run validate-agent-factory.mjs on sample ──> must pass                     │
  │      │                                                                            │
  │      └─ HUMAN RUNBOOK (cannot be agent-fabricated):                                │
  │            • plugin marketplace install + D-31 cache-pointer resolution            │
  │            • live PreToolUse hook firing (SAFE-02 deny message)                    │
  │            • CC sub-agent spawn path                                               │
  │            ──> side-by-side parity checklist: same ticket / same handoffs / same   │
  │                gate verdict — agent-proven (sequential) vs human-confirmed (CC)     │
  │                                                                                   │
  │  EX-01 #2 brownfield, #4 sprint, #5 release = ILLUSTRATIVE (labeled "expected")    │
  └─────────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (new paths only — all additive)
```
scripts/
├── validate-agent-factory.mjs   # VAL-01 — the shipped validator (Node ESM, stdlib only)
├── validate.test.sh             # D-45 — GOOD/BAD fixture self-test (guard.test.sh idiom)
└── fixtures/                     # D-45 — tiny trees for the self-test
    ├── good/                     #   minimal valid factory subset → expect exit 0
    └── bad-*/                    #   one mutation each → expect exit ≠0 + correct finding
examples/
├── 01-greenfield-bootstrap.md   # REAL RUN (from dogfood)
├── 02-brownfield-bootstrap.md   # ILLUSTRATIVE (banner + ABC-001 placeholders)
├── 03-ticket-to-pr.md           # REAL RUN = the DOGFOOD report (DOG-01/02 capture)
├── 04-sprint-cycle.md           # ILLUSTRATIVE (board snapshots + velocity line)
└── 05-release-run.md            # ILLUSTRATIVE (REL-0007 + completed traceability rows)
brand/
├── wordmark.svg                 # color (§6.3 as-given + light cleanup)
├── wordmark-mono-dark.svg       # all-Charcoal (derived)
├── wordmark-mono-light.svg      # all-Bone / reverse (derived)
├── wordmark-lockup.svg          # icon + wordmark horizontal (derived)
└── icon.svg                     # §6.4 as-given + light cleanup
docs/
└── faq.md                       # §8.8 FAQ (docs/ already exists — additive)
README.md                        # root public face (links to agent-factory/README.md)
NOTICE                           # §10.4-C
CONTRIBUTING.md                  # §10.3 contributor art/legal rules
```
> The exact `brand/wordmark*.svg` filenames are at Claude's discretion (D-50); the four-variant set (color/mono-dark/mono-light/lockup) + `icon.svg` is required by BRAND-03. The §12 asset checklist names `brand/wordmark*.svg` and `brand/icon.svg`.

### Pattern 1: Two-tier finding collector (D-44)
**What:** Accumulate findings into `errors[]` and `warnings[]`; exit code derives from them.
**When to use:** The validator's core control flow.
**Example:**
```javascript
// Source: derived from spec §18 + D-44; idiom mirrors install.mjs report() pattern
const errors = [];
const warnings = [];
const STRICT = process.argv.includes("--strict");

const err  = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

// ... run all checks, pushing into err()/warn() ...

for (const e of errors)   console.error(`  ERROR    ${e}`);
for (const w of warnings) console.error(`  WARNING  ${w}`);

const failed = errors.length + (STRICT ? warnings.length : 0);
if (failed === 0) { console.log("ALL CHECKS PASSED"); process.exit(0); }
console.error(`${failed} ERROR(S)${STRICT ? " (--strict: warnings promoted)" : ""}`);
process.exit(1);
```

### Pattern 2: Prefix section-presence check (tolerates the line-96 duplicate)
**What:** Assert each required section heading is **present at least once** by prefix; never assert uniqueness.
**When to use:** Role + workflow section checks. This is the mechanism that satisfies the PROJECT.md line-96 tolerance for the duplicate `## Scope`/`## Risks` in `product-handoff.md` + `implementation-handoff.md` — though note those are *handoffs*, which §18 only checks for *existence*, not sections. The principle still governs: presence, not uniqueness.
**Example:**
```javascript
// Source: derived from the verified actual headers (prefix-match table above)
const ROLE_SECTIONS = [
  "## One job", "## Caveman prompt", "## Reads", "## Responsibilities",
  "## Output", "## Board moves", "## Trace updates", "## Hard limits",
];
function checkRoleSections(file, text) {
  const lines = text.split("\n");
  for (const sec of ROLE_SECTIONS) {
    // present if ANY line starts with this prefix (handles "## Output (file + format)")
    if (!lines.some((l) => l.startsWith(sec))) {
      err(`${file}: missing required section "${sec}"`);
    }
  }
}
```

### Pattern 3: Conditional (vacuous-on-empty) ticket loop (D-43)
**What:** Only run board↔ticket and traceability-row checks when `plans/tickets/*.md` exist.
**Why:** The kit ships zero ticket rows; a fresh install must validate green.
**Example:**
```javascript
// Source: D-43 + board.md status/column contract (lines 33-45)
const tickets = listFiles("plans/tickets").filter((f) => f.endsWith(".md"));
for (const t of tickets) {           // zero tickets → loop body never runs → green
  const fm = frontMatter(read(t));   // ~10-line regex extractor, NO yaml dep
  const col = fm.column, status = fm.status;
  if (col && !boardHasColumn(board, col))
    err(`${t}: column "${col}" not a board column`);
  if (col && status && kebab(col) !== status)
    err(`${t}: status "${status}" != kebab("${col}")`);
  if (!traceabilityHasRow(trace, ticketId(t)))
    warn(`${t}: no traceability row`);  // WARNING per §18/D-44
}
```

### Pattern 4: GOOD/BAD fixture self-test (D-45)
**What:** A `.sh` driver that runs the validator against a known-good minimal tree (expect 0) and several known-bad trees (expect ≠0 + the right finding text), plus self-validates grugops's own tree (D-42).
**When to use:** `scripts/validate.test.sh`, run in CI and pre-dogfood.
**Example:** see Code Examples → "validate.test.sh skeleton."

### Example Run Map (EX-01)

| # | Example file | Flow (spec §) | Real or Illustrative | Source of content |
|---|--------------|---------------|----------------------|-------------------|
| 1 | `01-greenfield-bootstrap.md` | §7.1 `00-bootstrap-greenfield` (`idea → Orchestrator → Greenfield Mapper → AGENTS.md Scribe → BA/PM → System Analyst → Architect/Design → initial tickets`) | **REAL** (D-46 — falls out of dogfood) | Captured from the sample-repo bootstrap |
| 2 | `02-brownfield-bootstrap.md` | §7.2 `01-bootstrap-brownfield` (`existing repo → Orchestrator → Brownfield Mapper → AGENTS.md Scribe → Architect review → Security/NFR high-risk scan → safe first tickets`) | **ILLUSTRATIVE** (banner + placeholders) | Hand-authored from §7.2 flow |
| 3 | `03-ticket-to-pr.md` | §7.5 `04-ticket-to-pr` + §7.6 `05-pr-quality-gate` (board `Ready for Dev → In Development → In Review (→ In Security/NFR)`; gate verdict `READY_FOR_HUMAN_REVIEW`) | **REAL = the DOGFOOD report** (D-40) | Captured; live-CC-dependent checks marked "pending human" |
| 4 | `04-sprint-cycle.md` | §7.8→§7.12 (refinement → planning → 2 tickets through ticket-to-pr → daily sweeps → review → retro) + board snapshots + velocity line | **ILLUSTRATIVE** | Hand-authored; metrics from §6.5 (Throughput, Cycle time, Velocity, etc.) |
| 5 | `05-release-run.md` | §7.13 `12-release` (`Ready to Release → Release Manager → approval gate → deploy plan → human-confirmed deploy → Done`); SemVer/changelog/rollback/approval; completed traceability rows | **ILLUSTRATIVE** | Hand-authored; `REL-0007` placeholder; traceability row shape from `traceability.md` line-15 example |

Each example structure (D-48): **input → Orchestrator decision/routing → board moves → expected files/handoffs (representative snippets, not full dumps) → trace/metrics line.** The board-snapshot rendering uses the real column headings (`## In Development (WIP 1/3)` etc.) and the traceability-row shape is the documented `| ABC-012 | FX conversion | EPIC-003 | … | Done |` form.

### Dogfood Architecture (DOG-01/02)

**Agent-run-and-captured half (REAL proof):**
1. Create a fresh sample repo in a **sibling/temp dir OUTSIDE** `/Users/.../grugops` (D-39). Stack: small TS/Node+Fastify (e.g. a single `GET /health` + add one endpoint) or a small Vue app (add one component). Discretion on exact shape.
2. Install grugops onto it via the **sequential AGENTS.md path** — copy `AGENTS.md` + the kit, or run `install/install.sh` with `GRUGOPS_SRC` pointed at this repo and `TARGET` at the sample (the install harness already exercises exactly this env-override pattern).
3. Act as the Orchestrator (read `AGENTS.md` → `orchestrator.md`): run `00-bootstrap-greenfield`, then drive one real ticket idea→PR through `04-ticket-to-pr` → `05-pr-quality-gate`. Capture the real input, Orchestrator decision, board moves, handoff files produced, gate verdict, and PR link.
4. Run `node scripts/validate-agent-factory.mjs` on the sample's resulting tree — **must pass** (DOG-01).
5. Write the capture as `examples/03-ticket-to-pr.md` (REAL RUN banner) and the bootstrap slice as `examples/01-greenfield-bootstrap.md`.

**Human-runbook half (cannot be agent-fabricated — D-38/D-41):** a precise checklist a human runs in a live Claude Code session, absorbing the two Phase-5-deferred tests verbatim in intent (from `05-HUMAN-UAT.md`):
- **Plugin-cache pointer resolution (D-31):** `/plugin marketplace add <owner>/grugops` + `/plugin install grugops@grugops`, then `/grugops:plan` — confirm it produces planning output, not a path error (proves repo-relative pointer text resolves against the user's repo, not the plugin cache).
- **Live PreToolUse hook firing (SAFE-02):** in the live session, attempt a matched deploy (`kubectl apply -f x`) → confirm the deny message fires and the Bash call is refused.
- **CC sub-agent spawn path:** confirm `.claude/agents/grugops-orchestrator.md` spawns and routes to specialist roles (the `Agent` tool path), producing the **same** handoffs and gate verdict as the sequential run.
- **Side-by-side parity table:** same ticket → same handoff filenames produced → same gate verdict; agent-proven column (sequential) vs human-confirmed column (CC-native). This is the decisive "only the dispatch differs, never the content" evidence.

### Anti-Patterns to Avoid
- **Exact-string section matching:** would false-fail every role (actual headers carry parenthetical suffixes). Use prefix match.
- **Asserting section uniqueness:** would false-fail `product-handoff.md`/`implementation-handoff.md` (PROJECT.md line-96 duplicate `## Scope`/`## Risks`). Assert presence ≥1, never ==1.
- **Requiring ≥1 ticket to validate green:** breaks the fresh-install case. D-43: ticket checks are conditional/vacuous.
- **Adding any npm dependency:** forces `package.json`, forbidden by §18/D-45. Stdlib only.
- **Simulating a marketplace install or hook firing in the dogfood report:** fabrication. Those go in the human runbook marked "pending human."
- **Editing `agent-factory/README.md`, the frozen core, or Phase-5 files:** phase boundary violation. Root README *links to* the internal one (D-51); it never overwrites it.
- **Leaving literal `/grug` in any collateral:** D-49 violation. The manual's §8.6 hero literally says `/grug "bootstrap…"` — reconcile to `/grugops`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test-harness scaffolding | A new bespoke reporter | The `guard.test.sh`/`install.test.sh` idiom (`pass()`/`fail()`, `ALL CHECKS PASSED`, `mktemp -d` + `trap cleanup EXIT`, exit 0/1) | Proven 26/26 + 13/13; consistent house style; the planner/checker already recognize it |
| Repo-root resolution in the validator | cwd-relative paths | `dirname(fileURLToPath(import.meta.url))` then `resolve(..)` | Exactly how `install.mjs` finds the source; lets the validator self-check grugops's tree regardless of cwd |
| YAML/front-matter parsing | `gray-matter` or a YAML lib | ~10-line regex for `column:`/`status:` only | Avoids the forbidden `package.json`; the check needs two fields |
| Brand copy (README/NOTICE/FAQ/CONTRIBUTING) | Original prose | The manual's §6/§8/§10 ready-to-paste blocks verbatim + the `/grug`→`/grugops` swap | The collateral is pre-written and legally reviewed; re-authoring risks drift and IP-disclaimer errors |
| SVG art | A new wordmark/icon concept | The manual's §6.3/§6.4 drop-in SVGs + mechanical recolor for variants | D-50 forbids a new concept; the SVGs already read as `/grugops` |
| Example-run flow logic | Inventing flow steps | The §7.1–7.14 Flow/Done-when spines + real frozen filenames | The flows are frozen and authoritative; examples narrate them, never redesign them |

**Key insight:** Phase 6 is ~90% assembly and assertion, ~10% genuine authoring (validator logic + dogfood capture). The single most common failure mode is *re-inventing something that already exists frozen* (a role section name, a brand block, a flow step) and thereby drifting from the locked tree.

## Runtime State Inventory

> Phase 6 is **additive-only** — it creates new top-level paths and reads the frozen tree. It is **not** a rename/refactor/migration phase. The one rename-adjacent activity is the D-49 `/grug` → `/grugops` reconciliation, which applies **only to new Phase-6 collateral being authored** (README, examples, FAQ) — not to any existing runtime state. The inventory below confirms no hidden runtime state is touched.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 6 writes no datastore; reads markdown/JSON files only. The dogfood's sample repo is a throwaway sibling, its data discarded. | None |
| Live service config | None — no external service. The dogfood plugin install touches the user's own Claude Code plugin cache (human-runbook step), not a grugops-owned service. | None (human runbook documents the install) |
| OS-registered state | None — no scheduled tasks, daemons, or OS registrations. | None |
| Secrets/env vars | `GRUGOPS_PROD_DEPLOY_APPROVED` is referenced by the **frozen** `guard.mjs` (Phase 5); Phase 6 only *documents* its existence in examples/runbook, never renames or sets it. The validator and harness set no env vars. | None — reference only |
| Build artifacts | None — no compiled output, no `package.json`, no `egg-info`/binaries. The validator is interpreted `.mjs`. | None |

**Nothing found in any category requiring migration** — verified: Phase 6 is additive markdown + one interpreted Node script + SVGs. The `/grug`→`/grugops` swap is authored-content-only and has zero runtime-state footprint (the actual command surface was already `/grugops` from Phase 5 — D-29).

## Common Pitfalls

### Pitfall 1: Section check uses exact-string equality
**What goes wrong:** The validator reports every role missing `## Output`, `## Board moves`, `## Trace updates` because the real headers carry parenthetical suffixes (`## Output (file + format)`).
**Why it happens:** Spec §18 abbreviates section names; a naive implementer matches the spec's literal strings.
**How to avoid:** Prefix match (`line.startsWith("## Output")`). Verified: all 16 roles + 14 workflows pass under prefix match.
**Warning signs:** The validator fails on grugops's own tree (D-42 self-test goes red) even though the tree is correct.

### Pitfall 2: Duplicate `## Scope`/`## Risks` flagged as an error (PROJECT.md line 96)
**What goes wrong:** `product-handoff.md` (lines 15/20 universal header + 28/32 §5.A body) and `implementation-handoff.md` (15/20 + 35) carry `## Scope`/`## Risks` **twice**. A uniqueness check false-fails them.
**Why it happens:** Phase-2 decision A2 (inline universal header) + D-08 (verbatim §5.A body) intentionally collide; the two spec-verbatim files cannot be disambiguated without breaking a locked decision.
**How to avoid:** §18 only checks *handoff files exist*, not their sections — so the strict reading is the validator never inspects handoff sections at all. If a section check is added defensively, assert presence (≥1) not uniqueness (==1). Treat the universal-header copy as authoritative.
**Warning signs:** Validator red on `product-handoff.md`/`implementation-handoff.md` specifically.

### Pitfall 3: Ticket checks fail on the seeded zero-row state (D-43)
**What goes wrong:** A board↔ticket or traceability-row check that assumes ≥1 ticket throws or reports a false violation on a fresh install (zero tickets).
**Why it happens:** The kit ships `plans/tickets/` empty (`.gitkeep` only) and `board.md`/`traceability.md` with zero data rows.
**How to avoid:** Make the ticket loop conditional — iterate over `plans/tickets/*.md`; zero files → zero checks → green. Structural file/section/config/packaging checks always run.
**Warning signs:** `node scripts/validate-agent-factory.mjs` fails on grugops's own seeded tree.

### Pitfall 4: The dogfood report fabricates the live-CC-session parts
**What goes wrong:** The executor "describes" a marketplace install or a hook firing it never actually performed — a no-fabrication violation (spec §19.9).
**Why it happens:** Pressure to make the dogfood look complete/REAL end-to-end.
**How to avoid:** D-38's hard split — agent runs & captures only the no-live-session-needed path (sequential + validator); everything requiring a live CC session goes in the human runbook marked "pending human." The report wears the split visibly.
**Warning signs:** `examples/03-ticket-to-pr.md` claims a plugin-cache resolution or a PreToolUse deny it cannot prove from a captured tool output.

### Pitfall 5: Sample repo created inside the grugops repo
**What goes wrong:** Bootstrapping the dogfood inside `/Users/.../grugops` pollutes the frozen tree, confuses the validator's self-test, and risks committing throwaway app code.
**Why it happens:** Convenience.
**How to avoid:** D-39 — create the sample in a **sibling/temp dir** (e.g. `/tmp/grugops-dogfood-*` or `../grugops-sample`). Use the install harness's `GRUGOPS_SRC`/`TARGET` env overrides to install *from* this repo *into* the sibling.
**Warning signs:** New files appearing under `agent-factory/`, `plans/`, or a stray app dir in the repo root.

### Pitfall 6: Literal `/grug` leaks into collateral (D-49)
**What goes wrong:** Copy-pasting the manual's §8.6 hero (`/grug "bootstrap…"`) verbatim ships the bare children's-book word as a command — the exact legal-surface the user reduced.
**Why it happens:** The brand manual predates the D-29/D-49 reconciliation.
**How to avoid:** Apply the `/grug`→`/grugops` swap to every copied block. The slash command in collateral is `/grugops "<request>"` (dash standalone primary) and `/grugops:<op>` (plugin colon, where install is discussed). Grep new collateral for `/grug` (not followed by `ops`) before completing.
**Warning signs:** `grep -rE '/grug([^o]|$)' README.md examples/ docs/faq.md` returns hits.

## Code Examples

### Brand: color wordmark (`brand/wordmark.svg` — §6.3 as-given, light cleanup allowed)
```svg
<!-- Source: docs/initial/grugops_brand_manual.md §6.3 (drop-in). Reads as /grugops:
     Ochre "/" + Charcoal "grug" + Granite "ops". D-50: ship as-given; light cleanup ok
     (viewBox/alignment/a11y) — NO concept change. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 96" width="360" height="96" role="img" aria-label="grugops">
  <rect width="360" height="96" fill="none"/>
  <text x="16"  y="64" font-family="'JetBrains Mono','IBM Plex Mono',monospace" font-size="56" font-weight="800" fill="#C8642D">/</text>
  <text x="50"  y="64" font-family="'JetBrains Mono','IBM Plex Mono',monospace" font-size="56" font-weight="800" fill="#2C2A28">grug</text>
  <text x="214" y="64" font-family="'JetBrains Mono','IBM Plex Mono',monospace" font-size="56" font-weight="500" fill="#6B6B6B">ops</text>
</svg>
```
**Derivation recipe (D-50, mechanical, no concept change):**
- `wordmark-mono-dark.svg`: set all three `fill` to `#2C2A28` (Charcoal).
- `wordmark-mono-light.svg` (reverse): set all three `fill` to `#F3ECE0` (Bone) — for dark backgrounds.
- `wordmark-lockup.svg`: place `icon.svg` (scaled to ~the wordmark cap-height) to the left of the wordmark in one horizontal `viewBox`; keep proportions/spacing tasteful (discretion).

### Brand: app/repo icon (`brand/icon.svg` — §6.4 as-given)
```svg
<!-- Source: docs/initial/grugops_brand_manual.md §6.4 (drop-in). Club-on-stone rounded square. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="grugops icon">
  <rect x="4" y="4" width="120" height="120" rx="26" fill="#2C2A28"/>
  <g transform="rotate(38 64 64)">
    <rect x="58" y="20" width="12" height="58" rx="6" fill="#F3ECE0"/>
    <circle cx="64" cy="92" r="26" fill="#C8642D"/>
    <circle cx="55" cy="86" r="4"   fill="#2C2A28" opacity="0.35"/>
    <circle cx="71" cy="95" r="3.4" fill="#2C2A28" opacity="0.35"/>
    <circle cx="62" cy="100" r="3"  fill="#2C2A28" opacity="0.35"/>
  </g>
</svg>
```

### Brand: palette (§6.1) — exact hex
```text
Charcoal  #2C2A28   primary text, dark UI, wordmark ink
Granite   #6B6B6B   secondary text, lines, muted UI
Bone      #F3ECE0   light background, "paper"
Ochre     #C8642D   the single hero accent (cave-painting clay/terracotta)
Moss      #5A6B4A   secondary accent (success / "shipped") — sparingly
Ember     #B23A2E   warnings/blockers only — very sparingly
```
BRAND-03 requires Charcoal/Bone/Granite + single Ochre. Moss/Ember are optional and not part of the required wordmark/icon set.

### Brand: README hero (§8.6) — RECONCILED to `/grugops` (D-49)
```markdown
<!-- Source: brand_manual §8.6, with /grug → /grugops (D-49) and the install line pointing at install/ -->
# grugops

**The simple software factory.** A full software-delivery lifecycle — analysis, design, build, test, security, UAT, release — as a few simple agents that run on top of the coding-agent CLI you already use.

Each agent is grug-brained on purpose: one job, short words, hard limits. Lean by default, enterprise governance on a flag. File-based. No platform. No lock-in.

```bash
# install
sh install/install.sh
# then, in your coding agent:
/grugops "bootstrap this repo and propose safe first tickets"
```

> grug keep it simple.
```

### Brand: Acknowledgements + non-affiliation footer (§10.4-A / §10.4-B) — verbatim
```markdown
## Acknowledgements
grugops is inspired by **The Grug Brained Developer** (https://grugbrain.dev) by Carson Gross —
the philosophy of fighting complexity with simplicity. grugops is an independent project and is
not affiliated with or endorsed by the author; we simply stand in that lineage. Thank you, grug.

---
_grugops is an independent, open-source developer tool. "grugops" uses "grug" in the
software-culture sense (the grug-brained-developer philosophy). grugops is **not affiliated
with, endorsed by, or connected to** the "Grug" children's book series by Ted Prior or its
publishers. All grugops artwork is original._
```

### Brand: NOTICE (§10.4-C) — verbatim (set `<year>`/`<your name / org>`)
```text
grugops
Copyright (c) <year> <your name / org>

This project is inspired by "The Grug Brained Developer" (grugbrain.dev) and the broader
grug-brained-developer philosophy. It is an independent work and is not affiliated with,
sponsored by, or endorsed by that author.

"grug" is used here in its software-culture sense. grugops is not affiliated with, and makes
no claim to, the "Grug" children's book series by Ted Prior or its publishers. No characters,
artwork, or stories from that series are used. All grugops artwork is original.

"grugops" is the project's name for a software tool. No claim is made to the word "Grug" itself.
```
> `plugin.json` lists `"license": "MIT"` and author `Olger Oeselg` — use those for `<year>`/`<your name / org>` (e.g. `2026 Olger Oeselg`). The FAQ (§8.8) and CONTRIBUTING contributor-art rules (§10.3) ship verbatim — both are clear-voice, no `/grug` reconciliation needed (the FAQ contains no commands).

### Validator: repo-root + file helpers (mirrors install.mjs)
```javascript
// Source: install.mjs idiom (dirname(fileURLToPath(import.meta.url)))
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));        // scripts/
const ROOT = process.env.VALIDATE_ROOT
  ? resolve(process.env.VALIDATE_ROOT)                            // lets the harness point at a fixture
  : resolve(SCRIPT_DIR, "..");                                    // default: grugops repo root (D-42 self-validate)

const read   = (rel) => readFileSync(join(ROOT, rel), "utf8");
const exists = (rel) => existsSync(join(ROOT, rel));
const list   = (rel) => (exists(rel) ? readdirSync(join(ROOT, rel)) : []);
```
> An env-overridable root (here `VALIDATE_ROOT`) is the same hermetic-test pattern `install.test.sh` uses (`GRUGOPS_SRC`/`TARGET`). It lets `validate.test.sh` run the validator against a fixture tree without copying the script.

### Validator self-test (`scripts/validate.test.sh`) — GOOD/BAD skeleton (guard.test.sh idiom)
```sh
#!/usr/bin/env sh
# validate.test.sh — D-45 self-test. GOOD tree → exit 0; each BAD tree → exit != 0 + right finding.
# Mirrors hooks/guard.test.sh house style: set -eu, pass()/fail(), mktemp -d, trap cleanup.
set -eu
VALIDATOR="scripts/validate-agent-factory.mjs"
FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
command -v node >/dev/null 2>&1 || { fail "node on PATH"; printf '1 CHECK(S) FAILED\n'; exit 1; }

# D-42: the validator passes on grugops's OWN tree.
if node "$VALIDATOR" >/dev/null 2>&1; then
  pass "validator GREEN on grugops's own tree"
else
  fail "validator RED on grugops's own tree (should be green)"
fi

# GOOD fixture → exit 0.
if VALIDATE_ROOT=scripts/fixtures/good node "$VALIDATOR" >/dev/null 2>&1; then
  pass "GOOD fixture → exit 0"
else
  fail "GOOD fixture did not pass"
fi

# BAD fixture: plugin.json without name → exit != 0 AND the finding mentions 'name'.
out=$(VALIDATE_ROOT=scripts/fixtures/bad-plugin-noname node "$VALIDATOR" 2>&1) && rc=0 || rc=$?
if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -qi 'name'; then
  pass "BAD (plugin.json no name) → nonzero + correct finding"
else
  fail "BAD (plugin.json no name) wrong (rc=$rc)"
fi

# ... further BAD fixtures: missing-role-section, bad-config (no mode), board/ticket mismatch ...

if [ "$FAILS" -eq 0 ]; then printf 'ALL CHECKS PASSED\n'; exit 0; fi
printf '%s CHECK(S) FAILED\n' "$FAILS"; exit 1
```

> **Minimal GOOD fixture design (D-45):** the smallest tree that passes every always-on check — a few role files (each with the 8 sections), a couple workflow files (9 sections), a valid `factory.config.json` (mode/cadence/autonomy), `board.md` with the column headings, `traceability.md` header, `adapters.md`, and a `plugin.json` with a `name`. **Zero tickets** (so ticket checks are vacuous). **BAD fixtures** are GOOD with exactly one mutation each: (a) a role missing `## Hard limits`, (b) config missing `mode`, (c) `plugin.json` without `name`, (d) a ticket whose `status:` ≠ kebab(`column:`). Each must produce exit ≠0 and a finding naming the defect.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Literal `/grug` command (brand manual) | `/grugops` (dash standalone) + `/grugops:<op>` (plugin colon) | Phase 5 D-29 / Phase 6 D-49 | All collateral renders `/grugops`; never literal `/grug`. The brand manual predates this. |
| Per-phase `check-structure.sh` bash gates (build-time only) | A shipped Node validator (`validate-agent-factory.mjs`) | Phase 6 D-42 | The 6 bash harnesses stay as historical build gates; the Node validator is the shippable + self-test gate. Both coexist. |
| Spec §18 abbreviated section names | Actual headers carry parenthetical suffixes | Phases 3–4 authoring | Validator must prefix-match, not exact-match. |

**Deprecated/outdated:**
- `docs.claude.com/en/docs/claude-code/*` links (301-redirect) — use `code.claude.com/docs/en/*` in any generated docs (the Phase-5 harness already enforces this; carry the convention into README/examples if they cite tool docs).
- `Task` tool name → `Agent` (CC v2.1.63+). Collateral/examples that mention sub-agent spawning should say `Agent`. The frozen wrappers already use `Agent`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Spec §18's "handoff/checklist files exist" check inspects only *existence*, not internal sections (so handoff duplicate-header tolerance is moot for the strict reading) | Validator Assertion Contract / Pitfall 2 | LOW — if a planner adds defensive handoff-section checks, Pitfall 2's presence-not-uniqueness rule still covers it. Either reading is safe. |
| A2 | The validator's required handoff set is the 16 present files (spec §18 doesn't enumerate exact handoff names beyond "required") | Validator Assertion Contract row "Handoffs" | LOW — the Phase-4 `FROZEN_HANDOFFS` list (16 names) is the authoritative set; reuse it. |
| A3 | `examples/` lives at repo root (D-48), not `agent-factory/examples/` (which holds a `.gitkeep` placeholder) | Project Structure | NONE — D-48 explicitly locates `examples/` at repo root and rejected `docs/examples/`. The `agent-factory/examples/.gitkeep` is a Phase-1 scaffold placeholder, left untouched. |
| A4 | `<year>/<your name>` for NOTICE = `2026 Olger Oeselg` (from `plugin.json` author + current date) | Code Examples → NOTICE | LOW — cosmetic; the human can adjust the copyright holder. |

**If a planner needs a hard answer on A1/A2:** treat handoff/checklist checks as **existence-only** (the literal §18 text), and reuse the Phase-4 harness's frozen name lists for the exact file sets. This is the safest, drift-free reading.

## Open Questions (RESOLVED)

1. **Which sample-app shape and which single ticket for the dogfood?**
   - What we know: D-39 fixes the stack (small TS/Node+Fastify *or* Vue, fresh sibling dir) and scope (one small real ticket idea→PR); the exact endpoint/component is Claude's discretion.
   - What's unclear: nothing blocking — this is a planning-time choice.
   - Recommendation: smallest credible real change, e.g. Fastify `GET /health` already present → add `GET /version` returning the app's version; or a Vue app → add a small component. Keep the gate (lint/typecheck/unit/build) genuinely runnable so the captured verdict is real.

2. **Exact `brand/wordmark*.svg` variant filenames.**
   - What we know: BRAND-03 + §12 require color/mono-dark/mono-light/icon-lockup + `icon.svg`; the glob is `brand/wordmark*.svg`.
   - What's unclear: the suffix convention (`-mono-dark` vs `.mono-dark`) — discretion (D-50).
   - Recommendation: `wordmark.svg`, `wordmark-mono-dark.svg`, `wordmark-mono-light.svg`, `wordmark-lockup.svg`, `icon.svg`.

3. **Does the validator inspect handoff/checklist *sections* or only existence?** (See Assumptions A1/A2.)
   - Recommendation: existence-only, per the literal §18 text — avoids the line-96 duplicate-header trap entirely.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (ESM) | `validate-agent-factory.mjs` + `validate.test.sh` parity | ✓ | 24.12.0 `[VERIFIED]` | — (Node is non-optional for VAL-01; spec §18 gates the validator on "If Node/TypeScript") |
| POSIX `sh` | `validate.test.sh` harness | ✓ | system `/bin/sh` (used by all existing harnesses) | — |
| `git` | Dogfood PR creation on the sample repo | ✓ (repo is a git checkout) | — | A local branch + diff if no remote; the PR "link" may be a local ref recorded honestly |
| A live Claude Code session | DOG-02 CC-native half (plugin install, hook firing, sub-agent spawn) | ✗ at executor time (by design) | — | **Human runbook** (D-38/D-41) — these are pending-human, not agent-run |
| `claude plugin` CLI / marketplace | Human-runbook plugin-cache test (D-31) | ✗ at executor time | — | Human runbook; absorbs `05-HUMAN-UAT.md` test #1 verbatim in intent |

**Missing dependencies with no fallback:** none that block the agent-run half.
**Missing dependencies with fallback:** the live-CC-session items — fallback is the documented human runbook, which is the *intended* design (not a degradation).

## Validation Architecture

> `workflow.nyquist_validation` was not found as `false` in `.planning/config.json` (config absent/not set), so this section is included. **Honest framing:** formal Nyquist sampling theory does not naturally apply to asserting file/section/config structure — there is no continuous signal being sampled. For this phase, "validation" means **the validator's own GOOD/BAD fixture coverage + self-validation against grugops's frozen tree**, plus the dogfood as the end-to-end behavioral proof.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | POSIX `sh` harness (the kit's house idiom) + `node` invocation — NOT a third-party runner |
| Config file | none — bare `node scripts/validate-agent-factory.mjs` and `sh scripts/validate.test.sh` (no `package.json`, D-45) |
| Quick run command | `node scripts/validate-agent-factory.mjs` (validate grugops's own tree — should be green) |
| Full suite command | `sh scripts/validate.test.sh` (GOOD + BAD fixtures + self-validate) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VAL-01 | Validator passes on a valid tree | smoke | `node scripts/validate-agent-factory.mjs` (green on own tree) | ❌ Wave 0 |
| VAL-01 | Validator FAILS on each broken tree with the right finding | unit | `sh scripts/validate.test.sh` (BAD fixtures) | ❌ Wave 0 |
| VAL-01 | `--strict` promotes warnings to errors | unit | a `validate.test.sh` case running `--strict` on a warning-only fixture, expect ≠0 | ❌ Wave 0 |
| VAL-01 | Vacuous-green on zero-ticket seeded state (D-43) | smoke | `node scripts/validate-agent-factory.mjs` (own tree has zero tickets) | covered above |
| EX-01 | Five example files exist with correct real/illustrative banners | structural | `ls examples/0{1..5}-*.md` + `grep -l 'Illustrative run' / 'Real run'` | ❌ Wave 0 |
| EX-01 | No literal `/grug` (non-`/grugops`) in examples | structural | `! grep -rE '/grug([^o]\|$)' examples/` | ❌ Wave 0 |
| BRAND-01/02 | README/NOTICE/CONTRIBUTING/FAQ exist with the required blocks | structural | `grep -l 'Acknowledgements' README.md`; `test -f NOTICE CONTRIBUTING.md docs/faq.md` | ❌ Wave 0 |
| BRAND-01/02 | No literal `/grug` in collateral (D-49) | structural | `! grep -rE '/grug([^o]\|$)' README.md docs/faq.md` | ❌ Wave 0 |
| BRAND-03 | 5 SVGs exist, original-art palette only | structural | `ls brand/wordmark*.svg brand/icon.svg`; `grep -L '#2C2A28\|#F3ECE0\|#6B6B6B\|#C8642D'` (no off-palette hex) | ❌ Wave 0 |
| DOG-01 | Validator passes on the dogfood sample tree | smoke | `node scripts/validate-agent-factory.mjs` in the sample repo | ❌ Wave 0 (live) |
| DOG-02 | Dual-path parity captured (sequential agent-run + CC human-runbook) | manual | side-by-side parity checklist in `examples/03-ticket-to-pr.md` + human runbook | manual-only (justified: live CC session) |

### Sampling Rate
- **Per task commit:** `node scripts/validate-agent-factory.mjs` (the validator on its own tree stays green) + a `grep` for stray `/grug`.
- **Per wave merge:** `sh scripts/validate.test.sh` (full GOOD/BAD self-test).
- **Phase gate:** validator green on grugops's tree AND on the dogfood sample tree; `validate.test.sh` green; all five examples present with correct banners; brand collateral present and `/grug`-free; dual-path parity checklist filled (agent-proven columns real, human columns marked pending).

### Wave 0 Gaps
- [ ] `scripts/validate-agent-factory.mjs` — the validator itself (VAL-01)
- [ ] `scripts/validate.test.sh` — GOOD/BAD self-test harness (D-45)
- [ ] `scripts/fixtures/good/` + `scripts/fixtures/bad-*/` — minimal fixture trees
- [ ] Framework install: none needed (Node 24 present; no `package.json`)

*The existing per-phase `check-structure.sh` harnesses and `guard.test.sh`/`install.test.sh` cover Phases 1–5; they are NOT modified (D-42 keeps them as historical gates).*

## Security Domain

> `security_enforcement` not set to `false` in config (absent = enabled), so this section is included. Phase 6 ships **no executable application surface** — a read-only validator, static SVGs, and documentation. The security envelope is correspondingly small, but two real concerns apply.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No access control surface |
| V5 Input Validation | yes (mild) | The validator reads untrusted markdown/JSON from a *sample* repo (dogfood). Wrap `JSON.parse` in try/catch (a parse failure is a finding, never a crash). Treat all read content as data, never `eval`/execute it. |
| V6 Cryptography | no | No crypto |
| V12 Files & Resources | yes (mild) | The validator only **reads** files under a resolved root; it must never write, delete, or follow paths outside the root. No path-traversal sink (it never uses ticket content to build a write path). |
| V14 Configuration | yes | The dogfood must NOT set `GRUGOPS_PROD_DEPLOY_APPROVED` and must NOT run any real deploy — the frozen SAFE-02 guard stays mechanical; the dogfood only *documents* its firing in the human runbook. |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Validator crashes on malformed config/JSON (DoS-of-the-gate) | Denial of Service | `try/catch` around `JSON.parse`; a parse failure becomes an ERROR finding, never an unhandled throw (mirrors `guard.mjs` fail-closed posture) |
| Dogfood accidentally performs a real prod action on the sample repo | Elevation / Tampering | autonomy=pr posture; never set the approval env var; sample repo has no real prod target; PR-only, human holds merge/deploy |
| Fabricated proof (fake "REAL RUN", invented PR link, simulated hook firing) | Repudiation (corrupts the audit trail — the whole value prop) | No-fabrication rule: agent-proven vs human-pending split; `UNKNOWN - verify` stays; illustrative examples labeled |
| Brand art accidentally resembling the children's-book IP | (Legal, not STRIDE) | D-50 uses the manual's original geometric SVGs verbatim; CONTRIBUTING §10.3 + NOTICE §10.4-C enforce original-art + non-affiliation |
| Validator writes/deletes outside the read scope | Tampering | Read-only by construction; never derive a write path from file content |

## Sources

### Primary (HIGH confidence)
- `docs/initial/agent_factory_builder_spec_v2.md` §17.3 (examples), §18 (validator check list, "no package.json if absent", "faking forbidden"), §19 (quality rules), §20 (v2 acceptance), §7.1–7.14 (workflow flow definitions), §6.5 (metrics) — read in full for the relevant ranges `[CITED]`
- `docs/initial/grugops_brand_manual.md` §6.1 (palette hex), §6.3 (wordmark SVG), §6.4 (icon SVG), §6.5/6.6 (mascot + visual do/don't), §8.6 (README hero), §8.8 (FAQ), §10.3 (contributor rules), §10.4-A/B/C (Acknowledgements / non-affiliation / NOTICE), §12 (asset checklist) — read in full `[CITED]`
- In-repo inspection (2026-06-03): `hooks/guard.mjs`, `hooks/guard.test.sh`, `install/install.mjs`, `install/install.test.sh`, `.planning/phases/04/check-structure.sh`, `.planning/phases/05/check-structure.sh` (harness idioms); all 16 role files + 14 workflow files (section-header verification via grep); `agent-factory/config/factory.config.json`, `plans/board.md`, `plans/traceability.md`, `plans/metrics.md`, `plans/nfr-catalog.md`; `agent-factory/handoffs/product-handoff.md` + `implementation-handoff.md` (line-96 duplicate confirmed); `.claude-plugin/plugin.json` + `marketplace.json` (`name` present); `.claude/agents/grugops-orchestrator.md` + `.claude/skills/grugops/SKILL.md` (dual-path wrappers) `[VERIFIED: in-repo inspection]`
- `node --version` → `v24.12.0` `[VERIFIED: tool]`; `find -name package.json` → none `[VERIFIED: tool]`
- `.planning/PROJECT.md` line 96 (handoff duplicate-header tolerance directive); `.planning/phases/05-.../05-HUMAN-UAT.md` (the two deferred live-session tests); `05-CONTEXT.md` D-28/D-29/D-31 `[CITED]`

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` Phase 6 goal + 5 success criteria; `.planning/REQUIREMENTS.md` lines 96–111 (VAL/EX/BRAND/DOG exact text) `[CITED]`

### Tertiary (LOW confidence)
- None — all claims in this research are verified by in-repo inspection or cited from the spec/brand manual/CONTEXT. No WebSearch was required (no external API or fast-moving library surface; the Phase-5 research already covered plugin/tool conventions and the relevant findings are frozen).

## Metadata

**Confidence breakdown:**
- Standard stack (validator = Node stdlib, harness = POSIX sh): HIGH — directly mirrors the shipped `install.mjs`/`guard.mjs`/`*.test.sh`; Node 24 verified present; zero external deps by design.
- Validator assertion contract: HIGH — every target inspected in-repo and confirmed present/passing under prefix matching; the line-96 duplicate and zero-row vacuity verified directly.
- Brand collateral: HIGH — all blocks are pre-written verbatim in the brand manual; the only systematic edit (D-49 `/grug`→`/grugops`) is mechanical.
- Example-run map: HIGH — flows are frozen (§7.1–7.14) and authoritative; the real/illustrative split is locked (D-46/D-47).
- Dogfood architecture: HIGH on the split design (D-38/D-41 locked); MEDIUM on the exact captured artifacts (depends on the live run, which is the point).
- Pitfalls: HIGH — each derived from a verified in-repo fact (actual headers, the line-96 duplicate, the empty ticket dir, the `/grug` in §8.6).

**Research date:** 2026-06-03
**Valid until:** 2026-07-03 (stable — the assertion targets are frozen Phase 1–5 artifacts and the brand source is fixed; the only external-facing surface, plugin/tool conventions, is confined to the human-runbook half and already covered by Phase-5 research).
