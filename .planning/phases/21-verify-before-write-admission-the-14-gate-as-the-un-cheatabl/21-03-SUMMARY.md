---
phase: 21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl
plan: 03
subsystem: context-io-protocol-doc
tags: [workflow, single-source, admission, vfy, context-io, role-pointer]
requires:
  - "agent-factory/workflows/05-pr-quality-gate.md Step-4 self_fix_attempts + Step-5 verdict emission (Plan 02)"
  - "scripts/context-io.ts admit()/emitVerdict() + the §14-gate#<id> grammar (Plan 01)"
  - "agent-factory/contracts/context-note.md provenance schema (Phase 20)"
provides:
  - "agent-factory/workflows/16-context-read-write.md — the single-source read-before-act / write-after-verify / admission protocol (D-13, VFY-03)"
  - "one terse WF16 pointer in every one of the 17 role files (D-14, SC-3 honestly TRUE)"
  - "context-note.md flipped from Phase-20 hedge to the enforced Phase-21 admission rule, doc↔code in lockstep"
  - "roleCeiling() bumped in lockstep for the 9 roles the pointer pushed over their FAIL ceiling (D-07)"
affects:
  - "Phase 24 — the deep per-role rewiring + 17 handoff-template deletions + guard_context_protocol_single_source (NOT done here; WF16 coexists with handoffs)"
tech-stack:
  added: []
  patterns:
    - "single-source charter sentence (05/04 shape): one protocol named once, referenced not restated"
    - "ceilings-flip-with-the-change: roleCeiling() bumped in lockstep, committed .js freshness-checked, harness re-run"
    - "generated-catalog regen: a new kit file forces a deterministic docs/catalog/README.md rebuild + test-literal update"
key-files:
  created:
    - "agent-factory/workflows/16-context-read-write.md"
  modified:
    - "agent-factory/contracts/context-note.md"
    - "agent-factory/roles/agents-md-scribe.md (+16 other role files — 17 total)"
    - "scripts/check-foundation-guards.ts"
    - "scripts/check-foundation-guards.js"
    - "docs/catalog/README.md"
    - "scripts/generate-catalog.test.ts"
decisions:
  - "WF16 H1 display name = 'context read/write' (the catalog row + the contract grammar stay in lockstep)"
  - "Pointer placed just before each role's closing 'Follow the 12 coding rules in AGENTS.md' line (agents-md-scribe, which owns the rules, gets it appended after its final parenthetical)"
  - "9 roles crossed their FAIL ceiling (pointer is ~189 B, longer than the plan's 70-120 B estimate); all 9 bumped in lockstep keeping +12%/+6% (ba-pm +20%/+12%)"
metrics:
  duration: 8m
  completed: 2026-06-17
---

# Phase 21 Plan 03: Workflow 16 Single-Source Context I/O Protocol Summary

Made VFY-03 honestly TRUE at phase close: authored `16-context-read-write.md` as the single-source
read-before-act / write-after-verify / admission protocol (D-13), wired a one-line pointer into all 17
roles so SC-3 is real (D-14), and flipped `context-note.md` from its Phase-20 "out of scope here" hedge
to the now-enforced Phase-21 admission rule — keeping the worked-example grammar in lockstep with the
Plan-01 validator regex.

## What was built

- **`agent-factory/workflows/16-context-read-write.md` (NEW, D-13)** — ordinal 16 continuing the frozen
  00-15 sequence. Clear professional voice. Frontmatter `kind: workflow` / `order: 16` / `cadence: both`,
  H1 `# Workflow: context read/write`, and the standard section spine (`## When to use`, `## Steps`,
  `## Stop conditions`, `## Done condition`, `## Commit`). It carries the 05/04 single-source charter
  sentence (this workflow is the single source; every other workflow and role references it rather than
  restating it) and the full admission narrative: READ-BEFORE-ACT (via `context-io.ts`
  `readContext`/`render`) → DO THE WORK → WRITE-AFTER-VERIFY (notes ONLY via `context-io.ts`; a `finding`
  only with a real `§14-gate#<id>` (Posture B live-green cross-check) or `human:<name>` stamp; soft
  results as `claim`/`observation`, D-08) → ADMISSION + ESCAPE HATCH (a refused finding is hard-rejected,
  never silently rewritten; the agent earns a real stamp inside the EXISTING `05` `self_fix_attempts`
  bounded loop — referenced, not restated, D-12 — OR honestly re-records as a `claim` with
  `confidence: UNKNOWN - verify`, D-11). The three admission outcomes are stated once (gate-verifiable →
  finding; not gate-verifiable + low-stakes → claim; high-stakes / disagreement → `human:<name>`).

- **`agent-factory/contracts/context-note.md` flipped (D-05)** — the `verified_by` provenance-fence row
  now states the enforced rule (a `finding` must carry a real `§14-gate#<id>` or `human:<name>` stamp);
  the "Empty in Phase 20 … out of scope here" deferral block is replaced with the present-tense
  refuse-self FAIL set + Posture-B live-green cross-check + the reserved `by: §14-gate` carve-out; the
  `claim`-KIND forward-reference is now the enforced "a claim can never satisfy a finding's admission"
  statement. The worked-example note keeps `verified_by: §14-gate#ABC-001`, confirmed to match the
  Plan-01 validator regex `^§14-gate#[A-Za-z0-9._-]+$` byte-for-byte (`grep -c "out of scope here\|not
  implemented here"` is now 0).

- **One terse WF16 pointer in all 17 role files (D-14, literal-SC-3-light)** — clear-voice, one line per
  role in the orchestrator-pointer idiom: "Context I/O: read and write the shared context per
  `agent-factory/workflows/16-context-read-write.md` — that workflow is the single source; this role
  references it and does not restate it." Placed just before each role's closing "Follow the 12 coding
  rules in `AGENTS.md`" line; `agents-md-scribe` (which authors rather than inherits those rules) gets the
  pointer appended after its final parenthetical. Purely additive: `git diff --stat` shows 17 files,
  34 insertions, 0 deletions; no handoff template deleted; no deep per-role rewiring (all Phase 24).

- **`roleCeiling()` bumped in lockstep for 9 over-FAIL roles (D-07)** — the pointer is ~189 B (longer than
  the plan's 70-120 B estimate), so 9 roles (not just `software-engineer.md`) crossed their FAIL ceiling.
  Each was bumped from its new post-edit size as the new baseline, keeping the documented relationship
  (FAIL = +12% / WARN = +6%; `ba-pm.md` keeps its PERS-02 +20% / +12%). The committed
  `check-foundation-guards.js` was rebuilt and freshness-checked; the fail-proof harness re-runs green.

## roleCeiling() bumps (FAIL WARN), baseline = new post-edit byte size

| Role | New baseline (B) | New FAIL WARN | Multiplier |
|------|------------------|---------------|------------|
| ba-pm.md | 3483 | `4180 3901` | +20% / +12% (PERS-02) |
| brownfield-mapper.md | 2540 | `2845 2693` | +12% / +6% |
| factory-coach.md | 3427 | `3839 3633` | +12% / +6% |
| greenfield-mapper.md | 2718 | `3045 2882` | +12% / +6% |
| incident-responder.md | 3394 | `3802 3598` | +12% / +6% |
| qe-e2e.md | 3412 | `3822 3617` | +12% / +6% |
| software-engineer.md | 3487 | `3906 3697` | +12% / +6% |
| system-analyst.md | 2830 | `3170 3000` | +12% / +6% |
| uat-planner.md | 3160 | `3540 3350` | +12% / +6% |

The other 8 roles stayed under their existing FAIL ceiling (some crossed WARN — advisory only, no change).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adding the 17th workflow broke the generated docs catalog gate**
- **Found during:** Post-Task-2 full regression run.
- **Issue:** `16-context-read-write.md` is the 17th workflow. The generated `docs/catalog/README.md` and
  the `generate-catalog.test.ts` contract (hardcoded `WORKFLOW_NAMES` list + "exactly 16 workflow rows"
  assertion + a `catalog-freshness` byte-parity check) all assumed 16 workflows, so 4 tests failed.
  This is a direct, blocking consequence of the WF16 file the plan creates — not pre-existing breakage.
- **Fix:** Regenerated the committed `docs/catalog/README.md` (deterministic, byte-reproducible — the
  generator auto-discovers the workflow dir, so it picked up WF16 and emitted "17 workflows"). Added
  `"context read/write"` to `WORKFLOW_NAMES`, updated the row-count assertion 16 → 17, and updated the two
  stale "16 workflows" comments. The generator `.ts`/`.js` were untouched (no logic change needed).
- **Files modified:** `docs/catalog/README.md`, `scripts/generate-catalog.test.ts`
- **Commit:** `af8aa61`

**2. [Rule 1 - Plan-estimate correction] 9 roles crossed FAIL, not just software-engineer.md**
- **Found during:** Task 2, after adding the pointer.
- **Issue:** The plan named only `software-engineer.md` as crossing FAIL. The pointer line is ~189 B
  (the plan estimated 70-120 B), and several other roles already sat near their FAIL ceiling, so 9 roles
  crossed FAIL. Under D-07 ("ceilings flip WITH the change in lockstep") every crossing role's ceiling
  must be bumped, not just one.
- **Fix:** Bumped all 9 `roleCeiling()` constants in lockstep (table above), keeping the documented
  +12%/+6% relationship (ba-pm +20%/+12%), rebuilt the committed `.js`, re-ran freshness + the harness.
  This is the locked "ceilings flip with the change" rule applied to the actual set, not a silent
  loosening.
- **Files modified:** `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`
- **Commit:** `0c4253e`

## Threat surface scan

No new security-relevant surface beyond the plan's `<threat_model>`. T-21-10 (doc↔code drift) is
mitigated — the context-note.md worked-example grammar is confirmed to match the validator regex
byte-for-byte. T-21-11/12 (a role restating or smuggling a raw write) are mitigated — each role carries
ONE terse prose pointer, `guard_context_writes` stays green (the pointer names the workflow file, no write
token co-occurs a `.grugops/context/` path). T-21-13 (silent ceiling loosening) is mitigated — the 9
bumps are documented, the committed `.js` is freshness-checked, the harness re-runs. T-21-14 (Phase-24
scope creep) — git diff confirms no handoff deletions and no deep rewiring.

## Verification

- `test -f agent-factory/workflows/16-context-read-write.md` → present; `order: 16`, H1
  `# Workflow: context read/write`, 28 non-frontmatter lines.
- WF16 greps: `context-io` = 7, `05-pr-quality-gate|self_fix_attempts` = 3, `UNKNOWN - verify` = 3,
  `§14-gate#` = 4 (all ≥ 1). No caveman markers (clear-voice by inspection).
- context-note.md: `out of scope here|not implemented here` = 0; `§14-gate#` = 3; worked-example grammar
  matches `^§14-gate#[A-Za-z0-9._-]+$` (verified via node regex test).
- All 17 roles: exactly one `16-context-read-write` reference each (no MISSING, no count ≠ 1).
- `npm run build && npm run freshness` → exit 0 (committed `.js` is a faithful build, D-15).
- `node scripts/check-foundation-guards.js` → ALL CHECKS PASSED, exit 0 (guard_role_size: no FAIL, only
  advisory WARNs; guard_voice green; guard_context_writes green; one pre-existing A3 Tier-2 WARN).
- `npx vitest run scripts/check-foundation-guards.test.ts` → 25 passed (harness green after the bumps).
- `npx vitest run scripts/generate-catalog.test.ts scripts/catalog-freshness.test.ts` → 8 passed.
- `npx vitest run --exclude '**/scripts/e2e/**'` → 185 passed, 1 skipped (no regression).
- `git diff --stat agent-factory/roles/` → 17 files, 34 insertions, 0 deletions; no `agent-factory/handoffs/`
  deletions.

## Self-Check: PASSED

- FOUND: `agent-factory/workflows/16-context-read-write.md`
- FOUND: `.planning/phases/21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl/21-03-SUMMARY.md`
- FOUND: commit `c6eb563` (feat — WF16 + context-note.md)
- FOUND: commit `0c4253e` (feat — 17 role pointers + 9 ceiling bumps)
- FOUND: commit `af8aa61` (fix — catalog regen for the 17th workflow)
