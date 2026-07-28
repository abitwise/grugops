# Phase 16: §14 Gate Convergence — Lint, UI/E2E & Test-Integrity - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Converge lint, automated UI/E2E + visual-regression, and an un-cheatable structured-justification test-integrity check into the **single-source §14 quality gate** (`agent-factory/workflows/05-pr-quality-gate.md` only), all config-dialed, preserving the bounded `self_fix_attempts` loop and the three terminal results (`READY_FOR_HUMAN_REVIEW` / `BLOCKED_NEEDS_FIX` / `SPLIT_REQUIRED`). The test-integrity check is a cross-platform **TypeScript** routine riding the Phase-15 kit-shipped-runnable convention (authored `.ts` → committed `.js` → installer materializes into the host repo → host CI runs it with only Node).

**In scope:** wiring `quality.{lint, ui_e2e, test_integrity}` + `self_fix_attempts` + `gate_enforcement` into gate behavior; a committed TS test-integrity checker + a RED fixture; a human-owned skip registry format; reference artifacts (Playwright/axe recipe, per-stack linter table); satisfying UIQA-01/02, TINT-01/02/03, LINT-01/02.

**Out of scope (new capabilities → other phases):** new config keys (all dials already exist, Phase 10 — wire behavior, add none); forking gate logic into workflows 14/15; `install --migrate`/`--update` (Phase 17); the docs catalog (Phase 18).

</domain>

<decisions>
## Implementation Decisions

### Pre-locked (carried from 16-PRE-DECISIONS.md — do NOT re-open)
- **D-PL1: Test-integrity enforcement = committed TS checker + RED fixture**, not a gate-prose rule an agent applies. Mirrors `scripts/runnable-ref/reference-check.ts`. A fixture with a hollow justification must fail RED (proves SC3).
- **D-PL2: The checker validates grugops's OWN justification format + a skip-count comparison — stack-agnostic.** No foreign-test-syntax parsing. Un-cheatable part = the format validator.
- **D-PL3: Checker language = TypeScript on the Phase-15 foundation**, shipped via the kit-shipped-runnable convention (D-11/D-12). Installer materializes the compiled `.js` to a host-committed path (e.g. `tools/grugops/`); host runs `node <path>/<checker>.js [args]`; exit `0`/`1`/`2`; stdout = clear-voice findings.

### Area 1 — Skip-justification design (TINT-01/02)
- **D-01: The skip registry lives at `.grugops/test-skips.md`** in the host repo — human-owned, alongside `factory.config.json` in the state/config dir.
- **D-02: Un-cheatability = the "process floor" (no brittle identity machinery).** The registry is a human-owned artifact AND test-integrity sits **outside the agent self-fix lane** (human-only, see D-08). An agent hitting an unjustified skip physically cannot clear its own gate by writing a justification — it must STOP and hand to a human who owns the registry. The committed checker validates **format only**: owner present + non-placeholder + category in the closed list + not expired. (Git-authorship/signoff verification was considered and rejected — too fragile when agent and human share git config.)
- **D-03: Entry format = a markdown table** (consistent with `board.md` / `traceability.md`), columns: `Test ID | Reason | Owner | Ticket/REQ | Expiry (YYYY-MM-DD) | Category`. Deterministically parseable column-by-column; human-editable.
- **D-04: Closed-list categories (the only legitimate skip reasons) = 5:**
  - `flaky-quarantine` — the **non-blocking lane**; still requires owner + ticket + expiry; **never silent-deleted**.
  - `external-dependency` — a service/credential/network absent in this environment.
  - `wip-behind-flag` — feature incomplete, behind a flag, tracked to a ticket.
  - `platform-specific` — only valid on certain OS/arch.
  - `deprecated-pending-removal` — slated for deletion, tracked.
- **D-05: Blocking rule (when `test_integrity: block`).** The gate fails when **host-skips > count of valid (unexpired, well-formed) justifications**, OR when **any entry is expired**. A valid+unexpired `flaky-quarantine` entry counts as justified → does NOT block (the non-blocking lane); on expiry it blocks like any other.

### Area 2 — Content placement (single-source)
- **D-06: Reference-not-embed.** The gate step in `05-pr-quality-gate.md` stays lean — it states WHEN each new step runs (config-dialed), the bounded self-fix, and the terminal-result mapping — and POINTS to sibling reference artifacts for the bulky how-to. Single-source governs the gate *logic*, which stays in 05; pointing to a recipe is not a fork.
- **D-07: Reference artifacts live in `agent-factory/checklists/` (reuse, no new dir).** Extend `accessibility-checklist.md` for the axe-core a11y bits; add new sibling files for (a) the Playwright `toHaveScreenshot` flake-resistance recipe and (b) the per-stack linter table. No new top-level directory for the validator/installer to learn.
- **D-08a: `14-ui-design-to-build.md` stays tool-neutral.** The UI tool names (Playwright `toHaveScreenshot`, axe-core) — deferred here by Phase 13 D-08 — are named **once**, at the gate (05) and its referenced recipe. Workflow 14 keeps deferring verification to 05 (which it already references). No fork of the tooling source-of-truth.

### Area 3 — Self-fix loop & terminal-result mapping
- **D-08: Fix-lane classification ("code yes, goalposts no").**
  - **Lint** → agent-fixable (autofix then recheck, inside `self_fix_attempts`).
  - **UI/E2E** → agent-fixable for **code/a11y defects** (broken locator, axe-core violation, functional failure), BUT **visual-baseline acceptance is human-only** — an agent updating a baseline to make a red screenshot pass is goalpost-moving (the same cheat as self-authoring a justification).
  - **Test-integrity** → **always human-only** (locked; agent may not self-author a justification — TINT-01).
- **D-09: Human-only failures short-circuit to `BLOCKED_NEEDS_FIX`** with the specific reason — they do NOT consume `self_fix_attempts` (the agent can't fix them; spending budget is wasteful and tempts a cheating "fix"). The bounded loop runs only for agent-fixable failures; exhausting it → `BLOCKED_NEEDS_FIX`. All-pass → `READY_FOR_HUMAN_REVIEW`. `SPLIT_REQUIRED` stays size-driven, unchanged.
- **D-10: Dial composition.** `gate_enforcement: advisory` **composes with** `test_integrity: block` — it downgrades the pipeline ACTION to advice uniformly while the finding is still emitted loudly in clear professional voice (trace intact). The TINT-03 floor forbids *silently accepting* a hollow suite (never `off`, never hidden), NOT forcing a hard pipeline stop; advisory is not silent.

### Area 4 — Lint step specifics (SC1)
- **D-11: Per-stack linter table** (recommendations, dialed by `quality.lint`):
  - JS/TS/**Vue → ESLint 9 flat config** (default; matches grugops's own stack).
  - **Biome** — noted as a faster all-in-one alternative, with a caveat (narrower rule coverage / younger ecosystem).
  - Python → **Ruff**. Go → **golangci-lint**.
  - Unknown/other stack → `UNKNOWN - verify` (never fake a linter).
- **D-12: `quality.lint` wiring.** `strict:true` → lint warnings fail the gate (fail-on-warning); `strict:false` → warnings reported in clear voice, only errors fail. `autofix:true` → run the linter's **safe** autofix first, recheck, then report residue; `autofix:false` → report only. Autofix runs inside the bounded `self_fix_attempts` loop (agent-fixable per D-08).
- **D-13: No-linter handling — honest UNKNOWN, non-blocking** (reconciles the no-fabrication hard constraint with "don't wedge the gate"). When no linter is configured in the AGENTS.md command slot, the lint step **always records `UNKNOWN - verify`** in the trace (never a fake "passed" — honors no-fabrication + trace-is-proof) **but treats that UNKNOWN as non-blocking/surfaced**, so a repo with genuinely no applicable linter can still reach `READY_FOR_HUMAN_REVIEW`. The constraint governs what is *recorded* (never fabricate a pass); whether an honest UNKNOWN blocks is the separable, configurable choice — here, non-blocking.

### Skip-count acquisition (surfaced during discussion)
- **D-14: Explicit count input.** The stack-agnostic checker does NOT parse host test output. The **gate captures the host runner's reported skip count** via a configured AGENTS.md command/pattern slot (commands come from AGENTS.md, never invented) and passes the integer into the checker as an input arg (D-12 contract). The checker validates the registry (format/owner/expiry/category) and compares the provided count against the valid-justification count (D-05). If the skip count cannot be determined, record `UNKNOWN - verify` (no-fabrication), never a silent zero.

### Claude's Discretion (for research/planning, not user decisions)
- Exact host-committed path + filename the checker materializes to (inherit the Phase-15 convention; likely `tools/grugops/`).
- The RED fixture's exact shape and home (mirror `scripts/runnable-ref/fixtures/` + `*.test.ts`); what a "hollow justification" looks like.
- Exact AGENTS.md command-slot name/shape for the skip-count capture, and the per-stack example patterns.
- Precise wording/structure of the two new `checklists/` reference files and the `accessibility-checklist.md` extension.
- How the gate step orders the new steps relative to the existing `install → lint → typecheck → unit → build → e2e` sequence.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 16 section (Goal, Depends-on 12/13/14/15, SC1–SC4, requirements UIQA-01/02, TINT-01/02/03, LINT-01/02).
- `.planning/REQUIREMENTS.md` — the seven requirement IDs above (full text).
- `.planning/phases/16-14-gate-convergence-lint-ui-e2e-test-integrity/16-PRE-DECISIONS.md` — the three pre-locked decisions (D-PL1/2/3) and the carry-forward context from Phases 10/12/13/14.

### The single-source gate + the only shipped files that change
- `agent-factory/workflows/05-pr-quality-gate.md` — **the only workflow that changes.** All gate logic (lint, UI/E2E, test-integrity steps; terminal mapping; dial wiring) lands here.
- `agent-factory/workflows/14-ui-design-to-build.md` — stays tool-neutral (D-08a); confirm it still only *references* 05, never names tools.
- `agent-factory/checklists/accessibility-checklist.md` — extended for axe-core (D-07); plus two NEW sibling files (Playwright recipe, per-stack linter table).

### Config dials (wire behavior; add NO keys)
- `agent-factory/config/factory.config.json` — the `quality` block: `lint {strict,autofix}`, `ui_e2e`, `test_integrity`, `self_fix_attempts`, `coverage_threshold`, `mandatory_gates`, `gate_enforcement`.
- `agent-factory/config/factory.config.md` — dial semantics + lean-default fallback table (incl. the TINT-03 floor: `test_integrity` has no `off`).

### The kit-shipped-runnable foundation the checker rides
- `.planning/phases/15-typescript-tooling-migration/15-CONTEXT.md` — D-11 (installer materializes compiled routine into host repo) and D-12 (uniform `node <path>/<routine>.js [args]`; exit `0`/`1`/`2`; stdout clear-voice findings; optional `--json`).
- `scripts/runnable-ref/reference-check.ts` + `scripts/runnable-ref/reference-check.js` + `scripts/runnable-ref/fixtures/` — the reference implementation + RED-fixture pattern the test-integrity checker mirrors.
- `install/install.ts` — the installer that materializes kit-shipped runnables into the host repo (the checker becomes a second materialized routine).
- `scripts/check-foundation-guards.ts` + `scripts/generate-asvs-checklist.ts` — sibling committed-`.js` + freshness-checked tooling the checker joins.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`scripts/runnable-ref/reference-check.ts`** — the proven D-11/D-12 contract. The test-integrity checker is the second kit-shipped runnable; copy its structure (node: builtins only, exit-code result, clear-voice stdout, `--json` block, fail-closed `exit 2` on bad input).
- **`scripts/runnable-ref/fixtures/{clean,bad}.txt` + `reference-check.test.ts`** — the RED-fixture + Vitest harness pattern for proving the checker fails red on a hollow justification (SC3).
- **`freshness.ts` / committed-`.js` build + freshness gate** (D-02) — the checker's `.ts`→`.js` build joins this exact pattern.

### Established Patterns
- **Single-source / no-fork** — gate changes only in `05-pr-quality-gate.md`; **never write literal "§14" into a shipped file** (Phase 12 D-12). Reference siblings by filename.
- **Two-voice** — caveman in role prompts; **clear professional voice** in test-integrity verdicts, skip rules, lint findings, and all gate output (safety/quality surface).
- **No-fabrication / `UNKNOWN - verify`** — never fake a passing gate (drives D-13 and D-14).
- **Config-first with lean defaults** — every dial degrades to its documented lean default when absent; `test_integrity` has the only safety floor (no `off`).

### Integration Points
- `install.ts` gains a second materialized runnable (the checker) → host-committed `tools/grugops/`-style path.
- The gate step (05) invokes the materialized checker via `node <path> [args]`, passing the captured host skip count (D-14) and the `.grugops/test-skips.md` path; branches on exit code.
- The host's AGENTS.md command slots supply the lint command and the skip-count capture command (never invented).

</code_context>

<specifics>
## Specific Ideas

- The test-integrity checker is deliberately the **second** kit-shipped runnable — Phase 15 left the contract proven precisely so Phase 16 plugs into a demonstrated-working interface. Keep the checker's shape a near-clone of `reference-check.ts`.
- The un-cheatable guarantee is **structural, not cryptographic**: the registry is human-owned and test-integrity is human-only, so the agent can never resolve its own skip. The checker only needs to validate format + expiry + compare counts — it does not need to prove "a human wrote this."
- The non-blocking quarantine lane is modeled as a **category**, not a separate file — `flaky-quarantine` entries are valid justifications (so they don't block) but still carry owner+ticket+expiry (so they can't rot forever).

</specifics>

<deferred>
## Deferred Ideas

- **Git-authorship/signoff verification of registry entries** — considered for un-cheatability, rejected as too fragile (agent and human share git config); revisit only if a stronger guarantee is ever demanded.
- **Native per-framework skip-syntax parsing** — explicitly rejected (D-PL2/D-14); the explicit-count-input model keeps grugops stack-agnostic.
- **Biome as the default linter** — kept as a caveated alternative, not the default; revisit if its ecosystem matures.

None of the above is scope creep — all stayed within the phase domain. No new capabilities were requested.

</deferred>

---

*Phase: 16-14-gate-convergence-lint-ui-e2e-test-integrity*
*Context gathered: 2026-06-14*
