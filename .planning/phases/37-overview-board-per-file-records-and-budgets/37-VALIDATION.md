---
phase: "37"
slug: "overview-board-per-file-records-and-budgets"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-21"
---

# Phase 37 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.8 (`globals: false`) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run build && npx vitest run <changed test files>` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` (never bare `npm test`: it runs the live e2e lane) |
| **Estimated runtime** | quick ~30 seconds; full non-e2e ~30 minutes |

---

## Sampling Rate

- **After every task commit:** Run the quick command on the touched test files
- **After every plan wave:** Run the plan's targeted tests plus the freshness gates, `node scripts/check-state-paths.js`, `node scripts/check-foundation-guards.js`, and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`
- **Targeted tests (every plan):** the touched test files plus the census and pin tests the plan could move, named in each plan's verify and verification sections; for prose and version-bump plans the set is derived with `git grep -l` over `*.test.ts` (excluding `scripts/e2e/**`) for the names the plan edits, and an empty derivation fails the step. Executors run the related tests while coding, then the plan's layered set once
- **Full non-e2e suite (`npx vitest run --exclude '**/scripts/e2e/**'`), four runs in the phase (revised 2026-10-21 at checker iteration 2 on the user's direction: the phase gate plus at most two mid-phase runs):**
  - 37-01: the baseline capture before any edit (37-BASELINE.md). It is the reference every later comparison needs, not a regression run, and was not among the runs the direction trimmed
  - 37-08: mid-phase run 1. It closes the embed and trace slice (plans 37-02 to 37-08: the generator, three censuses, the trace model move, the own traceability.md swap, the context-io R1 case), the plans that move the most shared test files
  - 37-13: mid-phase run 2. It closes the code side of the phase: the roll (37-10, 37-11), the reader's SCHEMA_VERSION bump (37-12, whose own derived pin run covers every test that names the version, the source set or the golden) and the installer and seed (37-13). The user's example put one run after the bump and one after the installer; they are adjacent plans, so the run after the installer covers the bump one plan later and the other slot moved earlier to 37-08 to localize failures in the larger first half
  - 37-19: the phase gate, which also covers the prose block (37-14 to 37-18)
  - A plan that carries a full run fixes and records, with the plan it belongs to, any failure traced to an earlier plan's files since the previous full run
- **Before `/gsd-verify-work`:** Full non-e2e suite green against the captured baseline of known failures
- **Max feedback latency:** 60 seconds for the quick command

---

## Per-Task Verification Map

Filled by the planner per task. Requirement → test map from 37-RESEARCH.md § Validation Architecture:

| Plan/Task | Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-----------|-------------|----------|-----------|-------------------|-------------|--------|
| 37-01 T3 | SPLIT-01, SPLIT-04, SPLIT-07 | Contract budget table equals BUDGETS both ways; BUDGET_COUNT pinned; parent-plus-one-segment rule; the record rule (dot-entries such as `.gitkeep` are not records) stated in the contract | unit | `npx vitest run install/state-layout.test.ts scripts/board-model.test.ts scripts/board-tracer.test.ts` | ✅ extend | ⬜ pending |
| 37-02 T1 | SPLIT-04, SPLIT-01 | Board bytes WARN without marker, ERROR with it, invalid marker named; own tree green bare and strict | unit + spawn | `npx vitest run scripts/state-rules.test.ts scripts/validate.test.ts` | ❌ W0 (state-rules.test.ts) | ⬜ pending |
| 37-02 T2 | SPLIT-04 | Every BUDGETS key has a planter (Record over keys, count = BUDGET_COUNT); boundary values; FIFO named; `.gitkeep` in the ticket, NFR and trace directories never measured | unit + spawn | `npx vitest run scripts/state-rules.test.ts scripts/validate.test.ts scripts/board-model.test.ts` | ✅ extend | ⬜ pending |
| 37-03 T1 | SPLIT-05, SPLIT-04 | Embedded regions equal fresh derivation; non-builtin closure, name collision and legacy root refused; state-check alone in a bare dir exits 0/1/2 on the board budget | unit + spawn | `npx vitest run scripts/generate-runnable-embeds.test.ts scripts/runnable-ref/state-check.test.ts scripts/check-state-paths.test.ts scripts/nonblocking-reader-parity.test.ts` | ❌ W0 | ⬜ pending |
| 37-04 T1 | SPLIT-05, SPLIT-04 | state-check checks every budget; --json; sanitized output; read-only syntax tree; keepers never measured | spawn | `npx vitest run scripts/runnable-ref/state-check.test.ts scripts/state-rules.test.ts scripts/validate.test.ts` | ✅ extend | ⬜ pending |
| 37-05 T1 | SPLIT-02, SPLIT-05 | NFR index↔file integrity both directions; link derived from the identifier; recordEntryNames owns the entry set, so `.gitkeep` and `.DS_Store` in nfr/ are never bad names or unindexed | unit + spawn | `npx vitest run scripts/state-rules.test.ts scripts/runnable-ref/state-check.test.ts` | ✅ extend | ⬜ pending |
| 37-05 T2 | SPLIT-06, SPLIT-02 | Dated progress entries; ROLLABLE report; move-only copy finding; keepers in live and archive folders are neither copies nor counted; NFR edge cases | unit + spawn | `npx vitest run scripts/state-rules.test.ts scripts/runnable-ref/state-check.test.ts` | ✅ extend | ⬜ pending |
| 37-06 T1 | SPLIT-03 | Per-ticket render from two roots on a bare host; byte-reproducible; writer census admits the embedded writer by rule | unit + spawn | `npx vitest run scripts/trace-model.test.ts scripts/runnable-ref/trace-render.test.ts scripts/trace-render.test.ts scripts/context-io-writer-set.test.ts` | ❌ W0 | ⬜ pending |
| 37-07 T1 | SPLIT-03 | --check compare; hand-written refusal; case-fold collision; skip counts; ownedTraceEntries owns the trace tree, so `.gitkeep` and `.DS_Store` are never read, refused or removed | spawn | `npx vitest run scripts/trace-model.test.ts scripts/runnable-ref/trace-render.test.ts scripts/trace-render.test.ts scripts/trace-freshness.test.ts scripts/context-io-writer-set.test.ts scripts/nonblocking-reader-parity.test.ts scripts/context-io.test.ts` | ✅ extend | ⬜ pending |
| 37-08 T1 | SPLIT-03 | Directory-compare freshness gate, no vacuous pass, CI wiring; own index is the render; fresh with traceability/.gitkeep present (plus mid-phase full run 1) | spawn | `npx vitest run scripts/trace-freshness.test.ts scripts/trace-render.test.ts` | ✅ rewrite | ⬜ pending |
| 37-09 T1 | SPLIT-05, SPLIT-03 | state-check trace freshness from both roots, read-only, `trace.compared` honest; keepers never trace-stale (split from old 37-08 T2 at checker iteration 2) | spawn | `npx vitest run scripts/runnable-ref/state-check.test.ts scripts/generate-runnable-embeds.test.ts scripts/trace-model.test.ts scripts/nonblocking-reader-parity.test.ts scripts/context-io-writer-set.test.ts` | ✅ extend | ⬜ pending |
| 37-10 T1 | SPLIT-06, SPLIT-01 | Done roll with conservation proof; faulty-io rollback restores bytes | unit + spawn | `npx vitest run scripts/state-rules.test.ts scripts/runnable-ref/state-roll.test.ts` | ❌ W0 | ⬜ pending |
| 37-11 T1 | SPLIT-06 | Progress roll oldest first; refusals; dry run; re-run after interruption refuses | unit + spawn | `npx vitest run scripts/state-rules.test.ts scripts/runnable-ref/state-roll.test.ts` | ✅ extend | ⬜ pending |
| 37-12 T1 | SPLIT-01 | Archived Done row keeps its ticket placed; SCHEMA_VERSION 3; golden regenerated | unit | `npx vitest run scripts/board-model.test.ts scripts/board-tracer.test.ts scripts/board-read.test.ts` | ✅ extend | ⬜ pending |
| 37-12 T2 | SPLIT-01, SPLIT-07 | Duplicate and unreadable-archive cases; WIP immunity; key set stays eight; body edges; every test pinning the version, the source set or the golden | unit | `npx vitest run scripts/board-model.test.ts scripts/board-read.test.ts scripts/board-dashboard.test.ts scripts/board-watch.test.ts` and the derived pin run (`git grep -l` for SCHEMA_VERSION, schemaVersion, SOURCE_COUNT, SOURCE_NAMES, FIXED_SUBPATHS, expected-snapshot) | ✅ extend | ⬜ pending |
| 37-13 T1 | SPLIT-05 | Install materializes three runnables; uninstall removes them (GRUGOPS_HOME temp) | spawn | `npx vitest run install/install.test.ts install/record-truth.test.ts install/uninstall-removal.test.ts` | ✅ extend | ⬜ pending |
| 37-13 T2 | SPLIT-01, SPLIT-02, SPLIT-06 | v3 seed; marker only on `fresh` (path re-pointed to D-14 if needed); fresh install, seed keepers included, passes state-check in FAIL mode (plus mid-phase full run 2) | spawn | `npx vitest run install/install.test.ts install/installer-never-installed.test.ts` | ✅ extend | ⬜ pending |
| 37-14 T1-T3 | SPLIT-03, SPLIT-02, SPLIT-01 | Ten roles carry no hand-trace instruction; NFR one file each; Orchestrator states the overview rule; generators fresh | gates + derived tests | `npm run freshness:adapters && npm run freshness:catalog && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` and the test files that name an edited role (45 at planning) | ✅ existing gates | ⬜ pending |
| 37-15 T1-T2 | SPLIT-03 | The other seven roles and the commit convention carry no hand-trace instruction | gates + derived tests | `npm run freshness:catalog && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` and the test files that name an edited file | ✅ existing gates | ⬜ pending |
| 37-16 T1-T3 | SPLIT-05, SPLIT-06, SPLIT-03, SPLIT-01, SPLIT-02 | WF05 render then state-check with D-12 mapping; WF09 roll, dated progress, move-only; WF12, WF16, WF00, WF13; WF01-WF04 trace sentences | gates + derived tests | `npm run freshness:catalog && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` and the test files that name an edited workflow | ✅ existing gates | ⬜ pending |
| 37-17 T1-T2 | SPLIT-03 | The other nine workflows carry no hand-trace instruction; WF18's bound paragraph intact | gates + derived tests | `npm run freshness:catalog && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict && npx vitest run scripts/context-io-writer-set.test.ts` | ✅ existing gates | ⬜ pending |
| 37-18 T1-T2 | SPLIT-03, SPLIT-02 | Substrate, kit docs, contract wording and checklists describe the rendered trace and one file per NFR | gates | `npm run freshness:catalog && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` | ✅ existing gates | ⬜ pending |
| 37-18 T3 | SPLIT-03 | Zero append-to-traceability instructions over a derived, counted kit file set | unit + derived tests | `npx vitest run scripts/trace-instructions.test.ts` and the test files that name a file the plan edits (47 at planning) | ❌ W0 | ⬜ pending |
| 37-19 T1 | SPLIT-04, SPLIT-05 | Own marker (D-06); FAIL-mode control on a copy of the own state; own-tree state-check in CI | unit + spawn | `npx vitest run scripts/validate.test.ts scripts/runnable-ref/state-check.test.ts` | ✅ extend | ⬜ pending |
| 37-19 T2 | all | Full non-e2e regression against 37-BASELINE.md; every gate; the scratch-host human-check recorded as pending (non-blocking) | suite | `npx vitest run --exclude '**/scripts/e2e/**'` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/state-rules.test.ts` — budget, index-line, marker, progress-entry, Done-roll and conservation predicates
- [ ] `scripts/generate-runnable-embeds.test.ts` — derivation, non-builtin closure refusal, drift detection
- [ ] `scripts/runnable-ref/state-check.test.ts`, `trace-render.test.ts`, `state-roll.test.ts` — spawn and host-emulation cases
- [ ] `scripts/trace-instructions.test.ts` — derived scan set, zero append instructions
- [ ] Baseline capture of the known failing tests before the first plan

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PR gate and daily-sweep workflows call `state-check.js` on a real host | SPLIT-05 | Needs a live CI run on a host repo | Install into a scratch host repo (GRUGOPS_HOME temp), push a branch, confirm the workflow step runs `node tools/grugops/state-check.js`. Non-blocking for phase completion: plan 37-19 Task 2 records it under `## Human verification pending` and /gsd-verify-work runs it |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
