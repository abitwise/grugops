# Phase 16: §14 Gate Convergence — Lint, UI/E2E & Test-Integrity — Research

**Researched:** 2026-06-14
**Domain:** Quality-gate convergence — Playwright/axe a11y recipe, per-stack lint table, skip-count acquisition, and a node-builtins-only test-integrity checker on the Phase-15 kit-shipped-runnable foundation
**Confidence:** HIGH (locked design + verified tool APIs; the two genuinely-unknowable bits — host runner skip flags, golangci config filename — are flagged `UNKNOWN - verify` per project rule)

> **Scope discipline:** This phase is heavily pre-decided. CONTEXT.md locks D-PL1/2/3 + D-01..D-14; 16-PRE-DECISIONS.md locks D-PL1/2/3. This research does **not** re-open any locked decision. It fills the EXTERNAL-KNOWLEDGE gaps the locked design depends on. Every recommended tool/version was verified this session against the npm registry and the tool's official docs.

---

<user_constraints>
## User Constraints (from CONTEXT.md + 16-PRE-DECISIONS.md)

These are LOCKED. The planner MUST honor them verbatim. Research fills gaps **inside** these constraints, never alternatives to them.

### Locked Decisions (CONTEXT.md)

**Pre-locked (carried from 16-PRE-DECISIONS.md — do NOT re-open):**
- **D-PL1:** Test-integrity enforcement = committed TS checker + RED fixture, not a gate-prose rule. Mirrors `scripts/runnable-ref/reference-check.ts`. A fixture with a hollow justification must fail RED (proves SC3).
- **D-PL2:** The checker validates grugops's OWN justification format + a skip-count comparison — stack-agnostic. No foreign-test-syntax parsing. Un-cheatable part = the format validator.
- **D-PL3:** Checker language = TypeScript on the Phase-15 foundation, shipped via the kit-shipped-runnable convention (D-11/D-12). Installer materializes the compiled `.js` to a host-committed path (e.g. `tools/grugops/`); host runs `node <path>/<checker>.js [args]`; exit `0`/`1`/`2`; stdout = clear-voice findings.

**Area 1 — Skip-justification design (TINT-01/02):**
- **D-01:** Skip registry lives at `.grugops/test-skips.md` in the host repo — human-owned, alongside `factory.config.json` in the state/config dir.
- **D-02:** Un-cheatability = the "process floor" (no brittle identity machinery). The registry is human-owned AND test-integrity sits **outside the agent self-fix lane** (human-only, D-08). An agent hitting an unjustified skip cannot clear its own gate by writing a justification — it must STOP and hand to a human who owns the registry. The committed checker validates **format only**: owner present + non-placeholder + category in the closed list + not expired. (Git-authorship/signoff verification considered and rejected — too fragile.)
- **D-03:** Entry format = a markdown table (consistent with `board.md`/`traceability.md`), columns: `Test ID | Reason | Owner | Ticket/REQ | Expiry (YYYY-MM-DD) | Category`. Deterministically parseable column-by-column; human-editable.
- **D-04:** Closed-list categories (the only legitimate skip reasons) = 5:
  - `flaky-quarantine` — the **non-blocking lane**; still requires owner + ticket + expiry; **never silent-deleted**.
  - `external-dependency` — a service/credential/network absent in this environment.
  - `wip-behind-flag` — feature incomplete, behind a flag, tracked to a ticket.
  - `platform-specific` — only valid on certain OS/arch.
  - `deprecated-pending-removal` — slated for deletion, tracked.
- **D-05:** Blocking rule (when `test_integrity: block`): the gate fails when **host-skips > count of valid (unexpired, well-formed) justifications**, OR when **any entry is expired**. A valid+unexpired `flaky-quarantine` entry counts as justified → does NOT block; on expiry it blocks like any other.

**Area 2 — Content placement (single-source):**
- **D-06:** Reference-not-embed. The gate step in `05-pr-quality-gate.md` stays lean (states WHEN each new step runs, the bounded self-fix, the terminal-result mapping) and POINTS to sibling reference artifacts for the bulky how-to.
- **D-07:** Reference artifacts live in `agent-factory/checklists/` (reuse, no new dir). Extend `accessibility-checklist.md` for the axe-core bits; add two NEW sibling files: (a) the Playwright `toHaveScreenshot` flake-resistance recipe, (b) the per-stack linter table.
- **D-08a:** `14-ui-design-to-build.md` stays tool-neutral. UI tool names (Playwright `toHaveScreenshot`, axe-core) are named **once**, at the gate (05) and its referenced recipe. Workflow 14 keeps deferring to 05.

**Area 3 — Self-fix loop & terminal-result mapping:**
- **D-08:** Fix-lane classification ("code yes, goalposts no"):
  - Lint → agent-fixable (autofix then recheck, inside `self_fix_attempts`).
  - UI/E2E → agent-fixable for **code/a11y defects** (broken locator, axe violation, functional failure), BUT **visual-baseline acceptance is human-only** (updating a baseline to make a red screenshot pass is goalpost-moving).
  - Test-integrity → **always human-only** (TINT-01).
- **D-09:** Human-only failures short-circuit to `BLOCKED_NEEDS_FIX` with the specific reason — they do NOT consume `self_fix_attempts`. The bounded loop runs only for agent-fixable failures; exhausting it → `BLOCKED_NEEDS_FIX`. All-pass → `READY_FOR_HUMAN_REVIEW`. `SPLIT_REQUIRED` stays size-driven, unchanged.
- **D-10:** Dial composition. `gate_enforcement: advisory` composes with `test_integrity: block` — it downgrades the pipeline ACTION to advice uniformly while the finding is still emitted loudly in clear voice (trace intact). The TINT-03 floor forbids *silently accepting* a hollow suite, NOT forcing a hard pipeline stop; advisory is not silent.

**Area 4 — Lint step specifics (SC1):**
- **D-11:** Per-stack linter table (dialed by `quality.lint`): JS/TS/Vue → ESLint flat config (default; matches grugops's own stack); Biome → faster all-in-one alternative with a caveat (narrower rule coverage / younger ecosystem); Python → Ruff; Go → golangci-lint; Unknown/other → `UNKNOWN - verify` (never fake a linter).
- **D-12:** `quality.lint` wiring. `strict:true` → lint warnings fail the gate; `strict:false` → warnings reported in clear voice, only errors fail. `autofix:true` → run the linter's **safe** autofix first, recheck, then report residue; `autofix:false` → report only. Autofix runs inside the bounded `self_fix_attempts` loop (agent-fixable per D-08).
- **D-13:** No-linter handling — honest UNKNOWN, non-blocking. When no linter is configured in the AGENTS.md command slot, the lint step **always records `UNKNOWN - verify`** (never a fake "passed") but treats that UNKNOWN as non-blocking/surfaced, so a repo with no applicable linter can still reach `READY_FOR_HUMAN_REVIEW`.
- **D-14:** Explicit count input. The checker does NOT parse host test output. The gate captures the host runner's reported skip count via a configured AGENTS.md command/pattern slot (commands come from AGENTS.md, never invented) and passes the integer into the checker as an input arg. If the skip count cannot be determined, record `UNKNOWN - verify` (no-fabrication), never a silent zero.

### Claude's Discretion (research/planning, not user decisions)
- Exact host-committed path + filename the checker materializes to (inherit Phase-15 convention; likely `tools/grugops/`).
- The RED fixture's exact shape and home (mirror `scripts/runnable-ref/fixtures/` + `*.test.ts`); what a "hollow justification" looks like.
- Exact AGENTS.md command-slot name/shape for the skip-count capture, and the per-stack example patterns.
- Precise wording/structure of the two new `checklists/` reference files and the `accessibility-checklist.md` extension.
- How the gate step orders the new steps relative to the existing `install → lint → typecheck → unit → build → e2e` sequence.

### Deferred Ideas (OUT OF SCOPE)
- Git-authorship/signoff verification of registry entries — rejected as too fragile.
- Native per-framework skip-syntax parsing — rejected (D-PL2/D-14).
- Biome as the **default** linter — kept as a caveated alternative, not the default.
- New config keys (all dials exist from Phase 10 — wire behavior, add none).
- Forking gate logic into workflows 14/15.
- `install --migrate`/`--update` (Phase 17); the docs catalog (Phase 18).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **UIQA-01** | Recommend + template automated UI/E2E + visual-regression (Playwright `toHaveScreenshot` + axe-core), flake-resistance encoded (masking, animations disabled, fixed viewport, CI/Docker baselines) | Gap 1 — verified `toHaveScreenshot` options table, `@axe-core/playwright` `AxeBuilder` integration, the determinism techniques, templated example. Lands in the new Playwright recipe checklist + axe extension to `accessibility-checklist.md`. |
| **UIQA-02** | UI/E2E wired into the §14 gate as a step, config-dialed (off \| ui-or-critical-path \| always), automated to minimize human checkpoints | Gap 1 + Validation Arch — dial-to-behavior map for `quality.ui_e2e`; the gate step in 05 references the recipe (D-06). |
| **TINT-01** | Gate blocks unjustified skips; legitimate skip needs structured justification (reason + named owner + ticket/REQ + expiry + closed-list category); agent may not self-author | Gap 4 — checker shape validates the `.grugops/test-skips.md` registry (D-03 columns, D-04 categories); human-only lane (D-02/D-08). |
| **TINT-02** | Gate fails when unjustified skips > 0 or expired skips > 0; quarantine is a non-blocking lane (never silent deletion); coverage-honesty guidance | Gap 3 + Gap 4 — skip-count acquisition (D-14) + the D-05 blocking rule + `flaky-quarantine` as a valid-but-tracked category. |
| **TINT-03** | Test-integrity never fully dialable off (warn \| block only) | Gap 4 + config (already enforced: `test_integrity` has no `off`; D-10 advisory-composes). |
| **LINT-01** | Lint a first-class §14 step + per-stack linter recommendations table | Gap 2 — verified ESLint/Biome/Ruff/golangci-lint invocations; the new per-stack linter table checklist. |
| **LINT-02** | Lint strictness config-dialed (strict on/off, autofix on/off) | Gap 2 — exact CLI for fail-on-warning (strict) and safe-autofix-then-recheck (autofix), mapped to D-12. |
</phase_requirements>

## Summary

Phase 16 is a **convergence + wiring** phase, not a green-field build. The hard external-knowledge surface is small and was fully verified this session: (1) the current Playwright `toHaveScreenshot` option set and `@axe-core/playwright` `AxeBuilder` API and their flake-resistance levers; (2) the exact lint/safe-autofix/fail-on-warning CLI for ESLint, Biome, Ruff, golangci-lint; (3) how the four common runners report a skipped-test integer; and (4) the precise shape the test-integrity checker must take to be a near-clone of the proven Phase-15 `reference-check.ts` while satisfying SC3's RED-fixture proof.

The test-integrity checker is the **second** kit-shipped runnable. The Phase-15 reference (`scripts/runnable-ref/reference-check.ts` + `.test.ts` + `fixtures/{clean,bad}.txt`) is a fully-proven, demonstrated-working contract: node:builtins-only, `argv`-parsed input path, `--json` toggle, exit `0`/`1`/`2`, clear-voice stdout, fail-closed on bad input, and a Vitest harness that spawns the **committed `.js`** (never the `.ts`) including a bare-temp-dir host-emulation case. The checker reuses this shape verbatim and only swaps the rule: instead of "input must not contain `FORBIDDEN`," it parses the `.grugops/test-skips.md` markdown table, validates each row's format/owner/category/expiry, and compares a passed-in skip-count integer against the count of valid justifications (D-05). It materializes via `install.ts`'s `RUNNABLES` array (one new tuple) into `tools/grugops/`, and its `.ts→.js` build is policed by the existing freshness gate (`scripts/freshness.ts` already watches `scripts/**`).

**Primary recommendation:** Build the checker as a near-clone of `reference-check.ts` under `scripts/runnable-ref/` (or a sibling `scripts/test-integrity/`), commit its `.js`, append one `RUNNABLES` tuple in `install.ts`, and prove SC3 with a `*.test.ts` Vitest harness whose RED fixture is a `test-skips.md` carrying a **hollow justification** (placeholder owner, or expired date, or off-list category). Wire all gate behavior into `05-pr-quality-gate.md` only; push the bulky Playwright recipe and per-stack lint table into two new `agent-factory/checklists/` siblings and extend `accessibility-checklist.md` for axe. Add no config keys. Never write literal "§14" into a shipped file.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Test-integrity enforcement (format + expiry + count compare) | **Kit-shipped runnable** (committed TS `.js`, host-local `tools/grugops/`) | Gate workflow (05) invokes it | D-PL1/D-PL3: mechanical, un-cheatable, runs in bare host CI with only Node — not agent judgment, not gate prose. |
| Skip-count acquisition | **Host AGENTS.md command slot** (host runner emits the integer) | Gate workflow (05) captures + passes to checker | D-14: stack-agnostic; commands come from AGENTS.md, never invented. The checker only consumes the integer. |
| Lint execution + autofix | **Host AGENTS.md command slot** (host's own linter) | Gate workflow (05) sequences + maps results | D-11/D-12/D-13: grugops recommends linters in a table; the host runs its own. grugops never installs a linter into itself. |
| UI/E2E + visual-regression + a11y | **Host test runner** (Playwright + axe in the host repo) | Gate workflow (05) dials when it runs; recipe checklist documents how | UIQA-01/02: grugops templates/recommends; the host owns the runner. |
| Gate logic / dial wiring / terminal mapping | **Single-source workflow** `05-pr-quality-gate.md` | the two recipe checklists (referenced) | D-06: gate *logic* is single-sourced in 05; bulky how-to is referenced, not forked. |
| Materialization of the checker into host repos | **`install/install.ts`** `RUNNABLES` array | freshness gate polices `.ts→.js` | D-11: the installer is the one materialization mechanism; the checker is the second runnable. |

## Standard Stack

> **Critical framing:** grugops ships **zero runtime dependencies** and installs **nothing** into itself (CLAUDE.md hard constraint). The packages below are what grugops **recommends and templates for its *users*** in the two new `checklists/` reference files — they are never added to grugops's own `package.json`. grugops's own dev/build deps stay `{typescript, vitest, @types/node}` exactly as in Phase 15. The test-integrity checker uses **node: builtins only** — no library.

### Core (recommended to grugops users; templated in checklists, not installed into grugops)

| Library | Verified Version | Purpose | Why Standard |
|---------|------------------|---------|--------------|
| `@playwright/test` | **1.60.0** `[VERIFIED: npm registry + playwright.dev]` | UI/E2E + `toHaveScreenshot` visual regression | The locked default e2e tool (`default_stack.e2e: playwright`); native runner gives screenshots, fixtures, parallelism. |
| `@axe-core/playwright` | **4.11.3** (deps `axe-core ~4.11.4`) `[VERIFIED: npm registry + playwright.dev]` | axe-core a11y assertions inside a Playwright test (`AxeBuilder`) | The Playwright-recommended a11y integration; the WCAG 2.2 AA tool deferred to here (Phase 13 D-09). |
| `axe-core` | **4.12.1** (latest standalone) `[VERIFIED: npm registry]` | The underlying a11y engine | `@axe-core/playwright` pins `~4.11.4`; standalone latest noted for reference. |
| ESLint (flat config) | **9.x maintenance = 9.39.4; latest = 10.5.0** `[VERIFIED: npm registry + eslint.org]` | JS/TS/Vue lint (the grugops-own-stack default) | D-11 default. Flat config (`eslint.config.js`) is the **default** in both v9 and v10 — see State of the Art note. |
| Ruff | latest (Astral) `[CITED: docs.astral.sh/ruff]` | Python lint + safe autofix | D-11 Python fallback; fast, safe-fix-by-default. |
| golangci-lint | **v2** `[CITED: golangci-lint.run]` | Go lint aggregator + `--fix` | D-11 Go fallback. v2 config is `version: "2"`. |

### Supporting (caveated alternative)

| Library | Verified Version | Purpose | When to Use |
|---------|------------------|---------|-------------|
| `@biomejs/biome` | **2.5.0** `[VERIFIED: npm registry + biomejs.dev]` | Faster all-in-one JS/TS lint+format | D-11 **caveated alternative, not default**: narrower rule coverage + younger ecosystem; Vue SFC support still experimental (REQUIREMENTS.md "Out of Scope" row). Offer as the non-Vue fast option. |

### Alternatives Considered (already ruled out by locked decisions — do not re-open)

| Instead of | Could Use | Tradeoff / Why Ruled Out |
|------------|-----------|--------------------------|
| ESLint 9 default for Vue | Biome | Biome's Vue SFC support is experimental — REQUIREMENTS.md "Out of Scope". ESLint flat is the Vue default; Biome is the noted non-Vue fast option. |
| Explicit skip-count input (D-14) | Per-framework skip-marker parser | Rejected (D-PL2/D-14): brittle, endless, breaks on unknown stacks. |
| Committed TS checker (D-PL1) | A gate-prose rule the agent applies | Rejected: too skippable to be un-cheatable. |
| Format-only validation (D-02) | Git-authorship/signoff verification | Rejected: too fragile when agent + human share git config. |

**Installation (for grugops *users*, documented in the recipe checklist — NOT run by grugops):**
```bash
# Users run this in THEIR repo; grugops only templates the recommendation.
npm install -D @playwright/test @axe-core/playwright
npx playwright install --with-deps    # browsers; --with-deps for Docker/CI Linux
```

**Version verification (run this session):** `npm view @playwright/test version` → 1.60.0; `npm view @axe-core/playwright version` → 4.11.3 (deps axe-core ~4.11.4); `npm view eslint dist-tags` → latest 10.5.0, maintenance 9.39.4; `npm view @biomejs/biome version` → 2.5.0; `npm view axe-core version` → 4.12.1; `npm view vitest version` → 4.1.8; `npm view jest version` → 30.4.2; `npm view playwright-bdd version` → 9.1.0.

## Package Legitimacy Audit

> grugops installs **none** of these into itself. They are recommended to grugops's *users* in templated checklists. The audit below is therefore advisory-for-users; the planner does NOT need a `checkpoint:human-verify` install task for grugops itself (nothing is installed). slopcheck was unavailable this session; all packages were nonetheless confirmed BOTH via the npm registry AND each tool's official documentation site, which exceeds registry-only confidence.

| Package | Registry | Verified | Source Repo | slopcheck | Disposition |
|---------|----------|----------|-------------|-----------|-------------|
| `@playwright/test` | npm | 1.60.0 | github.com/microsoft/playwright | unavailable | Approved (docs + registry) |
| `@axe-core/playwright` | npm | 4.11.3 | github.com/dequelabs/axe-core-npm | unavailable | Approved (docs + registry) |
| `axe-core` | npm | 4.12.1 | github.com/dequelabs/axe-core | unavailable | Approved (registry) |
| `eslint` | npm | 9.39.4 / 10.5.0 | github.com/eslint/eslint | unavailable | Approved (docs + registry) |
| `@biomejs/biome` | npm | 2.5.0 | github.com/biomejs/biome | unavailable | Approved (docs + registry) |
| Ruff | PyPI/standalone | latest | github.com/astral-sh/ruff | unavailable | Approved (docs) — Python tool, not npm |
| golangci-lint | Go/standalone | v2 | github.com/golangci/golangci-lint | unavailable | Approved (docs) — Go tool, not npm |

**Packages removed due to slopcheck [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram — the §14 gate after convergence

```
        ┌─────────────────────────────────────────────────────────────────┐
        │  05-pr-quality-gate.md  (SINGLE SOURCE of gate logic — D-06)     │
        │  reads .grugops/factory.config.json#quality + AGENTS.md slots    │
        └─────────────────────────────────────────────────────────────────┘
                                   │
   change on a branch ───────────►│  run in order (existing + NEW):
                                   ▼
   install → LINT → typecheck → unit → build → E2E/UI ──► TEST-INTEGRITY
              │                                  │              │
   (NEW step) │ host's own linter   (NEW dial)   │ Playwright   │ (NEW gate step)
              │ from AGENTS.md slot              │ toHaveScreenshot
              │ dialed by quality.lint           │ + axe AxeBuilder
              │ {strict, autofix}                │ dialed by quality.ui_e2e
              │                                  │ (off|ui-or-critical|always)
              ▼                                  ▼              ▼
        ┌──────────────┐               ┌──────────────┐  ┌──────────────────────────┐
        │ AGENT-FIXABLE│               │ code/a11y =  │  │ node tools/grugops/      │
        │ autofix→     │               │ AGENT-FIXABLE│  │   <checker>.js           │
        │ recheck      │               │ baseline =   │  │   .grugops/test-skips.md │
        │ (inside      │               │ HUMAN-ONLY   │  │   --skip-count <N>       │
        │ self_fix)    │               │ (D-08)       │  │ (N from AGENTS.md slot,  │
        └──────────────┘               └──────────────┘  │  D-14; UNKNOWN if absent)│
                                                         │ exit 0/1/2, clear voice  │
                                                         │ ALWAYS HUMAN-ONLY (D-08) │
                                                         └──────────────────────────┘
                                   │
   D-09 routing:                   ▼
   agent-fixable fail → bounded self_fix_attempts loop → exhausted → BLOCKED_NEEDS_FIX
   human-only fail   → SHORT-CIRCUIT (no self_fix spend) → BLOCKED_NEEDS_FIX (+ reason)
   all pass          → READY_FOR_HUMAN_REVIEW
   too big           → SPLIT_REQUIRED (size-driven, unchanged)

   D-10 overlay: gate_enforcement=advisory downgrades the ACTION to advice for the
   WHOLE pipeline (incl. test_integrity:block) — finding still emitted LOUDLY in clear
   voice; trace intact; never silent.
```

### Recommended Project Structure (what changes)

```
agent-factory/
├── workflows/
│   └── 05-pr-quality-gate.md          # ONLY workflow that changes (gate logic, dial wiring, terminal map)
│   └── 14-ui-design-to-build.md       # UNCHANGED tool-neutral (D-08a) — verify it still only references 05
├── checklists/
│   ├── accessibility-checklist.md     # EXTEND for axe-core a11y (D-07)
│   ├── playwright-visual-regression-recipe.md   # NEW sibling (D-07) — toHaveScreenshot flake-resistance
│   └── linter-recommendations.md      # NEW sibling (D-07) — per-stack linter table
├── config/
│   ├── factory.config.json            # NO new keys — wire existing quality.{lint,ui_e2e,test_integrity}
│   └── factory.config.md              # twin — may clarify dial→behavior; no new rows
scripts/
├── runnable-ref/                      # the Phase-15 reference (DO NOT change — it is the proven contract)
│   ├── test-skip-integrity.ts         # NEW checker (near-clone of reference-check.ts) — OR a sibling dir
│   ├── test-skip-integrity.js         # committed compiled output (freshness gate polices it)
│   ├── test-skip-integrity.test.ts    # NEW Vitest RED-fixture harness (proves SC3)
│   └── fixtures/
│       ├── clean-test-skips.md        # GREEN fixture: skips ≤ valid justifications, all well-formed
│       └── hollow-test-skips.md       # RED fixture: a hollow justification → checker exits 1
install/
└── install.ts                         # append ONE RUNNABLES tuple → host tools/grugops/<checker>.js
AGENTS.md (grugops's own + the templated host slot)  # add a skip-count capture command slot pattern
```

> **Discretion call (planner decides):** the checker MAY live in `scripts/runnable-ref/` beside the reference (simplest — the freshness gate already watches `scripts/**`, tsconfig `include` already covers `scripts/**/*.ts`, and `**/*.test.ts` is already excluded from the build) OR in a new `scripts/test-integrity/` sibling. Either works with zero tooling changes. Beside-the-reference is lowest-friction.

### Pattern 1: Kit-shipped-runnable (the D-11/D-12 contract — copy verbatim)
**What:** A node:builtins-only TS routine, compiled to a committed `.js`, materialized into the host's `tools/grugops/`, run as `node tools/grugops/<name>.js <args> [--json]`.
**When to use:** The test-integrity checker IS this pattern's second instance. Mirror `reference-check.ts` exactly.
**Contract (from `reference-check.ts` header + `15-CONTEXT.md` D-12):**
```typescript
// Source: scripts/runnable-ref/reference-check.ts (the PROVEN reference — mirror it)
//   node <repo-local-path>/<name>.js <input> [--json]
//     exit 0 → pass / no findings
//     exit 1 → findings / fail (the gate blocks)
//     exit 2 → error (could not run — distinguishable from a clean "fail")
//     stdout → human-readable findings in CLEAR PROFESSIONAL VOICE (the audit trail)
//     stdout → optional machine-readable { ok, findings } block when invoked with --json
// node: builtins ONLY (runs in bare host CI; no ~/.grugops, no npm, no node_modules)
import { readFileSync } from "node:fs";
const wantJson = process.argv.includes("--json");
// fail-closed: missing/unreadable input → exit 2 (never a silent pass)
```

### Pattern 2: The materialization seam (one-line install change)
**What:** Append a tuple to `install.ts`'s `RUNNABLES` array; `materializeRunnable()` copies it to the host (additive/idempotent/never-overwrite).
**Example:**
```typescript
// Source: install/install.ts line ~700 (RUNNABLES) — append ONE tuple
const RUNNABLES: Array<[string, string]> = [
  ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
  ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"], // NEW
];
```
**Note:** `materializeRunnable()` is already written, additive, idempotent, never-overwrite, DRY_RUN-aware, and writes only under `tools/grugops/`. Adding the tuple is the entire installer change. The freshness gate (`scripts/freshness.ts`, `OUTPUT_DIRS=["install","scripts","hooks"]`) already polices the new committed `.js`.

### Pattern 3: Vitest harness spawns the COMMITTED .js (never the .ts)
**What:** The RED-fixture harness runs the compiled `.js` via `spawnSync("node", [CHECK_JS, ...args])` and asserts exit code + stdout, including a bare-temp-dir host-emulation case.
**Example:** mirror `scripts/runnable-ref/reference-check.test.ts` exactly — same `runCheck()` idiom, same `globals:false` explicit imports, same `mkdtempSync` host-emulation test (copy the `.js` into a no-`node_modules` temp dir and assert it still exits 1 on the RED fixture).

### Pattern 4: Playwright visual-regression flake-resistance (the recipe)
**What:** A `toHaveScreenshot` test that is deterministic across CI/Docker runs.
**Example (templated for users in the new recipe checklist):**
```typescript
// Source: playwright.dev/docs/api/class-pageassertions (toHaveScreenshot options, verified 2026-06-14)
import { test, expect } from '@playwright/test';
test('dashboard renders to baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 }); // FIXED viewport
  await page.goto('/dashboard');
  // role/label/data-testid locators — never brittle CSS/xpath
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page).toHaveScreenshot('dashboard.png', {
    animations: 'disabled',                       // default, but state it — fast-forwards finite, resets infinite
    caret: 'hide',                                // default — hides the text caret
    mask: [page.getByTestId('live-timestamp')],   // overlay volatile regions (default maskColor #FF00FF)
    maxDiffPixels: 100,                           // small absolute tolerance (or maxDiffPixelRatio: 0.01)
    // threshold defaults to 0.2 (YIQ color distance, 0–1); lower = stricter per-pixel
  });
});
```
```typescript
// playwright.config.ts — pin the rendering environment so baselines are reproducible
export default defineConfig({
  use: { viewport: { width: 1280, height: 720 } },
  // Baselines named {name}-{projectName}-{platform}.png — generate them in the SAME
  // container/OS that CI uses (font rendering differs across OS). Update with:
  //   npx playwright test --update-snapshots
});
```
**Determinism rules (verified):** screenshots differ across browsers/platforms/fonts; baselines MUST be generated in the same environment CI runs (recommend the official Playwright Docker image so font rendering matches); use `--update-snapshots` to (re)generate; mask volatile regions; disable animations; pin the viewport. `[CITED: playwright.dev/docs/test-snapshots + /docs/api/class-pageassertions]`

### Pattern 5: axe-core a11y inside a Playwright test (the accessibility-checklist extension)
**Example:**
```typescript
// Source: playwright.dev/docs/accessibility-testing (verified 2026-06-14)
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';   // default export

test('dashboard has no WCAG 2.2 AA a11y violations', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']) // WCAG 2.2 AA bar (Phase 13 D-09)
    .include('#main')          // optional: scope to a region
    .analyze();
  expect(results.violations).toEqual([]);        // zero violations
});
```
`[CITED: playwright.dev/docs/accessibility-testing]` — `@axe-core/playwright`, `AxeBuilder` default export, `.withTags()`, `.include()`/`.exclude()`, `.disableRules()`, `.analyze()` returning `{ violations }`.

### Anti-Patterns to Avoid
- **The checker parsing host test syntax.** Forbidden by D-PL2/D-14 — it consumes an integer, nothing more.
- **Agent self-authoring a justification.** The whole point (D-02/TINT-01). Test-integrity is human-only; never inside `self_fix_attempts`.
- **Writing literal "§14" into any shipped file.** Phase 12 D-12 — reference siblings by filename.
- **Forking gate logic into workflow 14/15.** Single-source: gate logic lives only in 05.
- **Caveman voice in any gate/lint/test-integrity output.** All quality/safety surfaces use CLEAR PROFESSIONAL VOICE.
- **A fake "lint passed" when no linter is configured.** D-13 — record `UNKNOWN - verify`, non-blocking.
- **A silent zero skip-count.** D-14 — record `UNKNOWN - verify` when the count can't be determined.
- **An agent updating a visual baseline to make a red screenshot pass.** D-08 — baseline acceptance is human-only (goalpost-moving).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Visual regression diffing | A custom pixel-diff comparator | Playwright `toHaveScreenshot` (pixelmatch + `maxDiffPixels`/`threshold`) | Built-in masking, animation control, per-platform naming, `--update-snapshots`. |
| a11y rule checking | A hand-written WCAG checker | `@axe-core/playwright` `AxeBuilder` | The deferred-to standard; `.withTags()` maps directly to WCAG 2.2 AA. |
| Lint engines | A grugops-shipped linter | Recommend the host's ESLint/Biome/Ruff/golangci-lint (table) | grugops ships zero runtime deps; the host owns its linter. |
| Skip-count extraction | A per-framework skip-syntax parser | AGENTS.md command slot emits the integer; checker consumes it (D-14) | Stack-agnostic; never breaks on an unknown runner. |
| The checker's plumbing | A new invocation/result convention | The proven D-11/D-12 `reference-check.ts` contract | Phase 15 already proved it end-to-end; mirror it. |
| Markdown table parsing in the checker | A markdown library (gray-matter/etc.) | Plain `String.split("\n")` + `split("|")` column walk (node builtins only) | `reference-check.ts` is builtins-only; the `.grugops/test-skips.md` table is fixed-column and deterministic (D-03). |

**Key insight:** Almost nothing here is novel. The checker is a 50-line rule swap on a proven runnable; the UI/a11y work is *recommending* mature tools, not building them. The only genuinely new artifact is the registry format + its validator — and even that is a deterministic column walk over a fixed-shape markdown table.

## Runtime State Inventory

> Phase 16 is additive (new gate steps, new checker, new checklists, new registry format). It is **not** a rename/refactor/migration. There is no existing stored state, live-service config, OS-registered state, secret, or build artifact carrying an old name to migrate.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `.grugops/test-skips.md` is a NEW host artifact created by users, not migrated. | None. |
| Live service config | None — no external service holds Phase-16 state. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None — the checker reads no secrets; sets no env var (carries the installer's never-set-deploy-var prohibition). | None. |
| Build artifacts | The NEW checker `.js` is a fresh committed build output; the freshness gate (`scripts/freshness.ts`) already polices `scripts/**` so it cannot drift. No stale artifact. | Run `npm run build` + commit the `.js`; freshness gate green. |

**Nothing found in any category** — verified by reading `install.ts`, `freshness.ts`, the config files, and confirming the phase is purely additive.

## Common Pitfalls

### Pitfall 1: Editing the proven reference instead of cloning it
**What goes wrong:** Modifying `scripts/runnable-ref/reference-check.ts` to do test-integrity work, breaking the Phase-15 TOOL-02 proof.
**Why it happens:** It's the obvious file to "reuse."
**How to avoid:** The reference is the *contract proof* and must stay a pristine, trivial checker. Create a **new** file (`test-skip-integrity.ts`) that mirrors its shape. The reference is read-only for Phase 16.
**Warning signs:** `reference-check.test.ts` going red; a freshness mismatch on `reference-check.js`.

### Pitfall 2: The checker reading the wrong "skip count" semantics
**What goes wrong:** Conflating "tests the registry justifies" with "tests the runner skipped." D-05 compares the host's reported skip integer against the count of *valid* registry justifications.
**Why it happens:** Two different counts.
**How to avoid:** Two inputs to the checker: (a) the registry path (`.grugops/test-skips.md`), (b) the host skip-count integer (`--skip-count <N>` or positional). Block when `N > valid-justification-count` OR any entry is expired (D-05). A valid `flaky-quarantine` counts as justified (D-04 non-blocking lane).
**Warning signs:** A green gate with more skips than justifications; a red gate when skips ≤ justifications.

### Pitfall 3: A hollow justification that still "passes" the format check
**What goes wrong:** The RED fixture doesn't actually fail, so SC3 isn't proven.
**Why it happens:** The validator's notion of "hollow" is too lax.
**How to avoid:** Define "hollow" concretely — at least one of: empty/placeholder owner (`TODO`, `TBD`, `-`, `me`, `agent`, blank), off-list category, malformed/empty `Test ID` or `Ticket/REQ`, or an `Expiry` that is past today or unparseable. The RED fixture must trip at least one. (Discretion: pick the placeholder-owner case as the canonical "hollow" — it most directly models the "agent self-authored a fake justification" threat.)
**Warning signs:** `test-skip-integrity.test.ts` RED case asserting exit 1 but getting 0.

### Pitfall 4: `today` non-determinism in the expiry check
**What goes wrong:** The expiry comparison uses `new Date()` (wall clock), making the RED/GREEN fixtures flaky around date boundaries and unreproducible in CI.
**Why it happens:** Naive `Date.now()` in the checker.
**How to avoid:** For the gate path, comparing against the real `today` is correct (expiry is a real-time property). For the **test harness**, inject a fixed reference date — either via an optional `--today YYYY-MM-DD` arg the checker accepts (documented as a testing affordance) or by choosing fixture expiry dates far in the past/future so the boundary is never near `today`. Prefer the far-past/far-future fixture dates to keep the checker's public surface minimal; if an injectable `--today` is added, document it as test-only.
**Warning signs:** A test that passes today and fails next week.

### Pitfall 5: Caveman voice leaking into a quality surface
**What goes wrong:** The checker's stdout, the gate's new step prose, or the recipe checklists use grug voice.
**Why it happens:** grugops's role prompts are caveman by default.
**How to avoid:** All test-integrity verdicts, skip rules, lint findings, gate output, and the two recipe checklists are CLEAR PROFESSIONAL VOICE (CLAUDE.md two-voice rule; `reference-check.ts` already models this). The `guard_voice` foundation guard scans role files, not these — but the rule still applies.
**Warning signs:** "grug", "no merge on green guess", or caveman idioms in the checker output or checklists.

### Pitfall 6: Adding a config key
**What goes wrong:** Inventing `quality.skip_registry_path` or similar.
**Why it happens:** It feels like new behavior needs a new key.
**How to avoid:** All dials exist (Phase 10). The registry path is a fixed convention (`.grugops/test-skips.md`, D-01), not a config value. Wire `quality.{lint, ui_e2e, test_integrity}`, `self_fix_attempts`, `gate_enforcement` — add nothing.
**Warning signs:** A diff to `factory.config.json` / `factory.config.md` / `seed/.grugops/factory.config.json` adding a key; the validator's enum recognition needing a change.

## Code Examples

### The per-stack lint invocations (verified — for the new `linter-recommendations.md`)

```bash
# JS/TS/Vue — ESLint flat config (eslint.config.js is the DEFAULT in v9 and v10).
# Source: eslint.org/docs/latest/use/command-line-interface (verified 2026-06-14)
eslint .                          # lint (exit 1 if errors)
eslint . --max-warnings 0         # STRICT (D-12 strict:true): any warning → exit 1 (fail-on-warning)
eslint . --fix                    # AUTOFIX (D-12 autofix:true): apply fixes in place, output residue
eslint . --fix --fix-type problem,suggestion,layout   # SAFE-scoped autofix (omit 'directive')
# Default --max-warnings is -1 (unlimited). strict:false → warnings reported, only errors exit 1.

# JS/TS — Biome v2 (CAVEATED alternative; not the Vue default).
# Source: biomejs.dev/reference/cli (verified 2026-06-14)
biome lint .                      # lint
biome lint --error-on-warnings .  # STRICT: exit non-zero on any warning
biome lint --write .              # AUTOFIX: applies SAFE fixes only (--write == --fix)
biome lint --write --unsafe .     # (unsafe fixes — NOT used for safe-autofix per D-12)

# Python — Ruff. Source: docs.astral.sh/ruff/linter (verified 2026-06-14)
ruff check .                              # lint (exit 1 if violations, 0 if none/all-fixed)
ruff check --fix .                        # AUTOFIX: SAFE fixes only by default (unsafe needs --unsafe-fixes)
ruff check --fix --exit-non-zero-on-fix . # STRICT-ish: exit 1 even if all auto-fixed (surfaces that issues existed)
# Ruff has no warning/error tier like ESLint; "strict" maps to --exit-non-zero-on-fix so a fixed
# violation still records as a finding (honors no-fabrication: don't hide that something was wrong).

# Go — golangci-lint v2. Source: golangci-lint.run/docs/configuration/cli (verified 2026-06-14)
golangci-lint run                 # lint (exit 1 when issues found; --issues-exit-code default 1)
golangci-lint run --fix           # AUTOFIX: apply fixer-supported fixes in place
# strict/relaxed in golangci-lint is governed by which linters are enabled in the config, not a
# single --max-warnings analog; treat "any issue → exit 1" as the gate signal.
```

### Skip-count acquisition patterns (verified/training — for the AGENTS.md slot + recipe)

> The checker NEVER runs these. The HOST emits the integer via an AGENTS.md command slot (D-14); the gate captures it and passes `--skip-count <N>`. These are **example patterns** documented in AGENTS.md as comments (like the existing BDD slot), never invented hard commands. If a count can't be determined → `UNKNOWN - verify` (never a silent zero).

```bash
# Vitest — JSON reporter to stdout, then read numSkipped.
# (Vitest's JSON output is Jest-compatible: aggregated counts under the top-level summary.)
vitest run --reporter=json | jq '.numPendingTests + .numTodoTests'   # skipped + todo
#   note: Vitest has had reporter quirks around skipped/todo (GH #928/#1179/#2417); the
#   aggregate numPendingTests/numTodoTests are the stable integers to read.   [ASSUMED]

# Jest — same Jest JSON summary shape.
jest --json | jq '.numPendingTests'        # skipped/pending count                         [ASSUMED]

# pytest — terminal summary line, or a JSON plugin.
pytest -q                                  # tail summary: "N passed, M skipped, ..."
pytest --json-report --json-report-file=- | jq '.summary.skipped'   # via pytest-json-report  [ASSUMED]

# go test — JSON event stream; count "skip" actions.
go test -json ./... | jq -s '[.[] | select(.Action=="skip")] | length'                     [ASSUMED]
```

These exact extraction recipes are `[ASSUMED]` (training knowledge + the partial WebSearch confirmation that Vitest emits Jest-compatible JSON to stdout and that skipped-status fields have had reporter bugs). **They are documented as EXAMPLES in the AGENTS.md skip-count slot, never as hard commands** — exactly like the existing `### Acceptance` BDD slot which lists `cucumber-js / behave / bddgen` as examples behind `UNKNOWN - verify`. The host owns the real command. This keeps grugops stack-agnostic and honors the no-fabrication rule.

### The new AGENTS.md skip-count slot (shape mirrors the existing Acceptance slot)

```markdown
### Test integrity
<!-- The host runner's reported skipped-test COUNT (an integer), captured for the §14 gate's
     test-integrity step. Examples by runner (verify against your runner — never fabricated):
       vitest:  vitest run --reporter=json | jq '.numPendingTests + .numTodoTests'
       jest:    jest --json | jq '.numPendingTests'
       pytest:  pytest --json-report --json-report-file=- | jq '.summary.skipped'
       go:      go test -json ./... | jq -s '[.[]|select(.Action=="skip")]|length'
     If the count cannot be determined, the gate records `UNKNOWN - verify` (never a silent 0). -->
- Skip-count capture: `UNKNOWN - verify`
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ESLint `.eslintrc` legacy config | `eslint.config.js` **flat config is the default** | v9.0 (2024), still default in v10 | The locked "ESLint 9 flat config" decision is current. Flat config is the default in BOTH v9 and v10 — naming "9" stays accurate; v10 just exists now. |
| ESLint 9 latest | ESLint **10.5.0 latest; 9.39.4 on `maintenance`** | v10 GA (2026) | D-11 says "ESLint 9 flat config (default)". Flat config is unchanged across v9→v10, so the *recommendation* holds; the table may add a parenthetical "(v9 maintenance / v10 latest; flat config in both)". No re-decision needed — locked. |
| Biome v1 | Biome **v2.5.0** | v2 (2025) | `--write`/`--fix` (safe), `--unsafe`, `--error-on-warnings` are the current flags. Vue SFC support still experimental → stays the caveated non-default. |
| golangci-lint v1 | golangci-lint **v2** (`version: "2"` config) | v2 (2025) | `run --fix`, `--issues-exit-code` default 1 are current. |
| Playwright manual a11y checks | `@axe-core/playwright` `AxeBuilder` default-export + `.withTags()` | stable | WCAG 2.2 AA maps to `.withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa'])`. |

**Deprecated/outdated — do NOT recommend:**
- `.eslintrc*` legacy config (use flat `eslint.config.js`).
- golangci-lint v1 config format (use `version: "2"`).
- Cucumber.js as the BDD runner (playwright-bdd is the chosen runner — REQUIREMENTS.md Out of Scope).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vitest skip count = `numPendingTests + numTodoTests` from `--reporter=json` | Code Examples / skip-count | LOW — documented as an *example* behind `UNKNOWN - verify`; host verifies its own command. Vitest has had reporter quirks (GH #928/#1179/#2417), so the host must confirm. |
| A2 | Jest skip count = `numPendingTests` from `--json` | Code Examples | LOW — example only; host verifies. |
| A3 | pytest skip count via `pytest-json-report` `summary.skipped` (plugin) | Code Examples | LOW — example only; the plugin is third-party; the terminal summary line is the dependency-free fallback. |
| A4 | go test skip count = count of `Action=="skip"` events in `go test -json` | Code Examples | LOW — example only; host verifies. |
| A5 | golangci-lint config filename is `.golangci.yml`/`.yaml`/`.toml` | Standard Stack | LOW — the doc didn't confirm filenames this session; recorded as `UNKNOWN - verify` in the table. The CLI invocation IS verified. |
| A6 | ESLint `--fix-type problem,suggestion,layout` is the right "safe" scope (omit `directive`) | Code Examples | LOW — `--fix-type` values are verified; the *safe* subset is a recommendation. Plain `--fix` (all types) is also acceptable; the table can present `--fix` as the simple default. |

**Note:** Every *tool/version/flag* claim in the Standard Stack and the lint CLI block is `[VERIFIED]`/`[CITED]` (npm registry + official docs this session). Only the skip-count *extraction recipes* (which grugops deliberately treats as host-owned examples, not commands) are `[ASSUMED]`, and they are wrapped in `UNKNOWN - verify` by design — so the assumption never becomes a fabricated grugops command.

## Open Questions

1. **Checker home: beside the reference vs a new sibling dir.**
   - What we know: both work with zero tooling changes (`scripts/**/*.ts` is in tsconfig `include`; `**/*.test.ts` excluded; `freshness.ts` watches `scripts/**`).
   - What's unclear: nothing blocking — pure organization.
   - Recommendation: place it beside the reference in `scripts/runnable-ref/` (lowest friction) unless the planner prefers a self-documenting `scripts/test-integrity/`. Either is fine.

2. **Whether the checker accepts an injectable `--today` for deterministic expiry tests.**
   - What we know: real-time `today` is correct for the gate path; tests need determinism (Pitfall 4).
   - What's unclear: add a test-only `--today` arg, or just use far-past/far-future fixture dates.
   - Recommendation: prefer far-past/far-future fixture expiry dates (keeps the checker's public surface minimal). Add `--today` only if the planner wants a boundary-condition test.

3. **Gate step ordering of the new test-integrity step.**
   - What we know: existing order is `install → lint → typecheck → unit → build → e2e`. Test-integrity logically depends on the unit/e2e run having produced a skip count.
   - What's unclear: exact placement (Claude's discretion per CONTEXT.md).
   - Recommendation: run test-integrity AFTER `unit`/`e2e` (the steps that produce skips) — likely as the final gate step, since it's human-only and short-circuits. Document in 05.

## Environment Availability

> grugops itself needs only Node 22+ (already the floor) and its dev deps `{typescript, vitest, @types/node}` — all present (Phase 15 shipped). The tools below are what grugops *recommends to users*; grugops never installs them.

| Dependency | Required By | Available (in grugops dev env) | Version | Fallback |
|------------|------------|-------------------------------|---------|----------|
| Node | the checker `.js` + build | ✓ (hard floor, Phase 15) | ≥22 | — |
| TypeScript (`tsc`) | compile the checker `.ts→.js` | ✓ (dev dep) | ~6.0.3 | — |
| Vitest | the RED-fixture harness | ✓ (dev dep) | 4.1.8 | — |
| `@playwright/test` | UI/E2E recipe (USERS) | n/a — grugops only templates it | 1.60.0 | recipe documents `npm i -D @playwright/test` |
| `@axe-core/playwright` | a11y recipe (USERS) | n/a — grugops only templates it | 4.11.3 | recipe documents the install |
| ESLint/Biome/Ruff/golangci-lint | lint table (USERS) | n/a — host's own | see table | host provides; else `UNKNOWN - verify` (D-13) |

**Missing dependencies with no fallback:** none for grugops's own build/test (everything is present from Phase 15).
**Missing dependencies with fallback:** the user-facing tools are intentionally not present in grugops — they are recommendations the host installs; D-13 covers the no-linter case (`UNKNOWN - verify`, non-blocking).

## Validation Architecture

> `workflow.nyquist_validation` is not set to `false` in `.planning/config.json` (verified) — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 (`globals:false`, the repo default — import test fns explicitly) |
| Config file | `vitest.config.*` (Phase 15) + `package.json` `"test": "vitest run"` |
| Quick run command | `npx vitest run scripts/runnable-ref/test-skip-integrity.test.ts` |
| Full suite command | `npm test` (`vitest run`) + `npm run freshness` (build-output drift gate) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TINT-01 | Hollow justification (placeholder owner) → checker exits 1 (the SC3 keystone) | unit (spawn committed .js) | `npx vitest run scripts/runnable-ref/test-skip-integrity.test.ts -t "hollow"` | ❌ Wave 0 |
| TINT-01 | Well-formed registry, skips ≤ valid justifications → exit 0 | unit | same harness, GREEN fixture case | ❌ Wave 0 |
| TINT-02 | Expired entry → exit 1 (blocks even if counts balance) | unit | harness, expired-fixture case | ❌ Wave 0 |
| TINT-02 | `flaky-quarantine` valid+unexpired → counts as justified → exit 0 (non-blocking lane) | unit | harness, quarantine-fixture case | ❌ Wave 0 |
| TINT-02 | host-skips > valid justifications → exit 1 | unit | harness, `--skip-count N` > justified | ❌ Wave 0 |
| TINT-03 | `test_integrity` has no `off`; advisory composes (D-10 emits finding loudly) | doc/behavior (gate-prose + config twin) — assert no `off` in config enum | `npm test` (validator enum) + manual read of 05 | partial (validator covers enum) |
| LINT-02 | `strict:true` → `--max-warnings 0` fail-on-warning; `autofix:true` → safe fix then recheck | doc (linter table + gate wiring in 05) — verified by review, not a runner | manual review of `linter-recommendations.md` + 05 | ❌ Wave 0 (doc) |
| LINT-01 | Per-stack table present + accurate | doc | manual review | ❌ Wave 0 (doc) |
| UIQA-01 | Recipe encodes mask/animations/fixed-viewport/CI-Docker baselines + axe `withTags` | doc | manual review of recipe checklist + axe extension | ❌ Wave 0 (doc) |
| UIQA-02 | Gate step dials on `quality.ui_e2e` (off\|ui-or-critical\|always) | doc (gate-prose in 05) | manual review of 05 | ❌ Wave 0 (doc) |
| (cross-cut) | Checker runs in a bare temp dir with no node_modules (host-CI emulation) | unit | harness host-emulation case (mirror `reference-check.test.ts` Test 5) | ❌ Wave 0 |
| (cross-cut) | Missing/unreadable registry → exit 2 (error, not a false pass) | unit | harness, missing-file case | ❌ Wave 0 |
| (cross-cut) | Committed `.js` matches a fresh `tsc` rebuild | build gate | `npm run freshness` | ✓ (freshness.ts exists, watches scripts/**) |

### Sampling Rate
- **Per task commit:** `npx vitest run scripts/runnable-ref/test-skip-integrity.test.ts` (the checker's harness) — fast.
- **Per wave merge:** `npm test` (full Vitest suite — proves the new checker AND that `reference-check.test.ts` is still green, i.e. the reference was not disturbed) + `npm run freshness`.
- **Phase gate:** full suite green + freshness green before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/runnable-ref/test-skip-integrity.ts` — the checker (near-clone of `reference-check.ts`) — covers TINT-01/02.
- [ ] `scripts/runnable-ref/test-skip-integrity.js` — committed compiled output (freshness gate polices it).
- [ ] `scripts/runnable-ref/test-skip-integrity.test.ts` — the RED-fixture Vitest harness (proves SC3); mirrors `reference-check.test.ts` (same `runCheck` idiom + host-emulation case).
- [ ] `scripts/runnable-ref/fixtures/clean-test-skips.md` — GREEN fixture (well-formed, skips ≤ justifications).
- [ ] `scripts/runnable-ref/fixtures/hollow-test-skips.md` — RED fixture (placeholder owner = the canonical hollow justification; SC3 keystone).
- [ ] (optional) `expired-test-skips.md`, `quarantine-test-skips.md` fixtures for the D-05 edge cases.
- [ ] `install/install.ts` — one new `RUNNABLES` tuple (re-build + commit `install.js`).
- [ ] `agent-factory/checklists/playwright-visual-regression-recipe.md` — NEW (UIQA-01).
- [ ] `agent-factory/checklists/linter-recommendations.md` — NEW (LINT-01).
- [ ] `agent-factory/checklists/accessibility-checklist.md` — EXTEND for axe-core (UIQA-01).
- [ ] `agent-factory/workflows/05-pr-quality-gate.md` — wire lint/ui_e2e/test_integrity steps + D-08/D-09/D-10 mapping (no §14 literal; reference siblings by filename).
- [ ] `AGENTS.md` — new skip-count capture slot (mirror the Acceptance/BDD slot shape).
- [ ] Framework install: none — Vitest + tsc + freshness already shipped (Phase 15).

*(The SC3 keystone is `hollow-test-skips.md` → exit 1. Everything else is edge-case coverage and doc review. The reference suite staying green is the regression guard that the proven contract was not disturbed.)*

## Security Domain

> `security_enforcement` is not `false` in config — section included. Phase 16 adds a host-local executable (the checker) and a host-edited registry. The relevant threats are tamper/false-pass on the checker itself.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V1 Encoding / Injection | yes (low) | The checker parses a markdown table with plain string ops (no eval, no shell). Never pass registry content to a shell. |
| V5 Input Validation | yes | Fail-closed on a missing/unreadable/garbled registry → exit 2 (error, not a false pass) — mirrors `reference-check.ts`. |
| V6 Cryptography | no | D-02 explicitly rejected signature/authorship verification; un-cheatability is structural (human-only lane), not cryptographic. |
| V10 Malicious Code | yes | node:builtins-only; no npm deps; no postinstall; the installer never overwrites a host-edited materialized file (T-15-05-Tamper). |
| V14 Config | yes | Add no config keys; `test_integrity` floor (no `off`) is the safety carve-out (TINT-03). |

### Known Threat Patterns for the test-integrity checker

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Agent self-authors a justification to clear its own gate | Elevation of Privilege | D-02/D-08: test-integrity is human-only, outside `self_fix_attempts`; the registry is human-owned; the agent must STOP and hand off. |
| Hollow justification slips past (false pass) | Tampering | The format validator rejects placeholder owner / off-list category / past-or-unparseable expiry; the RED fixture proves it (SC3). |
| Silent-zero skip count hides a hollowed suite | Repudiation | D-14: `UNKNOWN - verify`, never a silent 0; the trace records the unknown. |
| Stale/drifted committed `.js` vs `.ts` | Tampering | The freshness gate rebuilds to a temp dir and fails red on any byte difference. |
| Installer clobbers a host-edited checker | Tampering | `materializeRunnable()` is never-overwrite (T-15-05-Tamper) — an existing host file is left untouched. |
| Advisory mode silently swallows a finding | Repudiation | D-10: advisory downgrades the ACTION only; the finding is still emitted LOUDLY in clear voice (trace intact); never silent. |

## Sources

### Primary (HIGH confidence — verified this session)
- `scripts/runnable-ref/reference-check.ts` + `.test.ts` + `fixtures/` — the proven D-11/D-12 contract to mirror.
- `install/install.ts` (`RUNNABLES`, `materializeRunnable()`) — the one-tuple materialization seam.
- `scripts/freshness.ts` (`OUTPUT_DIRS=["install","scripts","hooks"]`) — already polices the new `.js`.
- `agent-factory/workflows/05-pr-quality-gate.md` — the single-source gate to extend.
- `agent-factory/config/factory.config.{json,md}` — the existing dials (no new keys).
- `tsconfig.json` (`include: scripts/**/*.ts`, `exclude: **/*.test.ts`) + `package.json` (Vitest 4.1.8, tsc ~6.0.3).
- playwright.dev/docs/api/class-pageassertions — full `toHaveScreenshot` option table (animations default 'disabled', threshold default 0.2, mask/maskColor, maxDiffPixels/maxDiffPixelRatio, caret, scale, clip, fullPage). `[CITED]`
- playwright.dev/docs/accessibility-testing — `@axe-core/playwright` `AxeBuilder`, `.withTags/.include/.exclude/.disableRules/.analyze`. `[CITED]`
- playwright.dev/docs/test-snapshots — `--update-snapshots`, per-platform naming, CI/Docker determinism warning. `[CITED]`
- eslint.org/docs/latest/use/command-line-interface — `--fix`, `--fix-type`, `--max-warnings`, flat config default. `[CITED]`
- biomejs.dev/reference/cli — `biome lint`, `--write`/`--fix`, `--unsafe`, `--error-on-warnings`. `[CITED]`
- docs.astral.sh/ruff/linter — `ruff check`, `--fix` (safe by default), `--unsafe-fixes`, `--exit-non-zero-on-fix`, exit codes. `[CITED]`
- golangci-lint.run/docs/configuration/cli — `run`, `--fix`, `--issues-exit-code` default 1, v2. `[CITED]`
- npm registry (`npm view`) — all versions in the Standard Stack table.

### Secondary (MEDIUM confidence)
- WebSearch: golangci-lint v2 exit-code/config (confirmed `--issues-exit-code`, `version: "2"`).
- WebSearch: Vitest emits Jest-compatible JSON to stdout; skipped-status reporter quirks (GH #928/#1179/#2417).

### Tertiary (LOW confidence — `[ASSUMED]`, wrapped in `UNKNOWN - verify` by design)
- The exact per-runner skip-count extraction jq recipes (Vitest/Jest/pytest/go) — documented as host-owned EXAMPLES, never grugops commands.
- golangci-lint config filename (`.golangci.yml/.yaml/.toml`) — not confirmed in-session; recorded `UNKNOWN - verify`.

## Metadata

**Confidence breakdown:**
- Checker shape / kit-shipped-runnable contract: HIGH — read the proven Phase-15 reference + install/freshness code directly.
- Lint CLI (ESLint/Biome/Ruff/golangci-lint): HIGH — verified against each tool's official docs this session.
- Playwright/axe API: HIGH — verified against playwright.dev this session; versions confirmed via npm.
- Skip-count extraction recipes: LOW (by design) — `[ASSUMED]`, wrapped in `UNKNOWN - verify`; the host owns the real command.
- Gate wiring / dial composition / terminal mapping: HIGH — fully locked in CONTEXT.md (D-06..D-14); research only confirmed the existing gate structure.

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 for the tool CLIs (fast-moving — re-verify Playwright/ESLint versions if planning slips a month); indefinite for the locked design + the in-repo contract (stable until the kit changes).
