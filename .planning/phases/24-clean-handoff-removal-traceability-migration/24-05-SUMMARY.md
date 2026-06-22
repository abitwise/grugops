---
phase: 24-clean-handoff-removal-traceability-migration
plan: 05
subsystem: tooling-gates
tags: [handoff-removal, check-kit-refs, validator, oracle, freshness, D-15, atomic-deletion]
status: complete
requires:
  - "Wave 1 (24-01/24-02): role/workflow/packaging/AGENTS.md rewired off handoffs to WF16 (the backpressure precondition)"
  - "24-03: the note-derived plans/traceability.md render the validator trace check re-points at"
  - "24-04: install.ts seed plans/handoffs/ mkdir already removed (this plan never touches install.ts)"
provides:
  - "check-kit-refs.ts Assertion 2 flipped to ZERO agent-factory/handoffs/ refs (the grep-to-zero gate)"
  - "scripts/check-kit-refs.test.ts — the gate's first test harness with the D-15 both-direction proof"
  - "validate-agent-factory.ts FROZEN_HANDOFFS dropped; trace-completeness check re-pointed (not removed)"
  - "check-uat-oracles.ts adjusted off deleted handoff filenames (oracle NOT retired)"
  - "17 handoff templates + 8 fixture handoffs/ dirs deleted; catalog confirmed clean"
affects:
  - scripts/check-kit-refs.ts
  - scripts/validate-agent-factory.ts
  - scripts/check-uat-oracles.ts
  - scripts/check-foundation-guards.ts
tech-stack:
  added: []
  patterns:
    - "Atomic flip + both-direction adversarial RED-vs-committed-.js proof (the WR-05 discipline)"
    - "Explicit SCAN set, never a repo-wide grep (D-13 token economy)"
key-files:
  created:
    - scripts/check-kit-refs.test.ts
  modified:
    - scripts/check-kit-refs.ts
    - scripts/check-kit-refs.js
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
    - scripts/check-uat-oracles.ts
    - scripts/check-uat-oracles.js
    - scripts/check-uat-oracles.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - .claude/agents/grugops-orchestrator.md
    - ".claude/skills/* + skills/* (15 adapter SKILL.md invariant blockquotes rewired)"
  deleted:
    - "agent-factory/handoffs/*.md (17 templates, incl. frontend-handoff.md)"
    - "scripts/fixtures/*/agent-factory/handoffs/ (8 dirs, 128 files)"
decisions:
  - "D-14 honored: ONE atomic deletion change; the check-kit-refs flip lands inside it as the backpressure"
  - "D-13: Assertion 2 ALLOW ERE + filters dropped → ZERO-refs; explicit SCAN set preserved (no repo-wide grep)"
  - "D-04: validator trace-completeness check RE-POINTED at the note-derived render, never removed"
  - "Pitfall 5: check-uat-oracles adjusted off deleted handoff filenames; oracle NOT retired (Phase 26 owns equivalence retirement)"
  - "Scope: example docs (examples/*.md) and the install.ts surface are out of this plan; the gate correctly excludes examples (frozen narrative artifacts)"
metrics:
  duration: ~70m
  completed: 2026-06-23
  tasks: 3
  files_changed: 170
  templates_deleted: 17
  fixture_dirs_deleted: 8
---

# Phase 24 Plan 05: Atomic Handoff-Template Deletion & check-kit-refs Grep-to-Zero Flip — Summary

STAGE 2 of the two-stage cut-over (D-12): one atomic change deleted all 17 static handoff templates
(incl. the 17th, `frontend-handoff.md`, invisible to both frozen lists) and the 8 fixture
`handoffs/` dirs, flipped `check-kit-refs.ts` Assertion 2 from a 16-template allowlist to "ZERO
`agent-factory/handoffs/` refs", dropped `FROZEN_HANDOFFS` from the validator while re-pointing its
trace-completeness check at the note-derived render, adjusted the UAT oracle off deleted handoff
filenames (without retiring it), and confirmed the catalog clean — all proven RED-vs-the-committed-`.js`
independently.

## What was built

| Task | What | Commit |
|------|------|--------|
| 1 | `scripts/check-kit-refs.test.ts` — the gate's FIRST test (it had none, Pitfall 2): spawnSync the committed `.js`, hermetic `CHECK_ROOT` mirror, D-15 GREEN/RED/backpressure/round-trip cases. Authored BEFORE the flip so it RED-proved the flip. | `1002d07` |
| 2 | The atomic deletion + flip (D-14): rm 17 templates + 8 fixture dirs; flip Assertion 2 to zero-refs; drop FROZEN_HANDOFFS + re-point the trace check; adjust the oracle; clean catalog; rebuild all edited committed `.js`. | `2e44c31` |
| 3 | Full suite + all freshness gates + the three gate scripts + the independent D-15 adversarial RED-vs-`.js` reproduction + input-surface code-review. (Pure verification — no file changes.) | (no commit) |

## The backpressure worked (D-14)

The flip is the proof the rewire is complete. On first run the flipped `check-kit-refs.js` went
**RED**, catching a real Wave-1 gap: 15 adapter `SKILL.md` / orchestrator-agent invariant
blockquotes still carried the OLD "Read handoff templates from `agent-factory/handoffs/`, write
instances to `plans/handoffs/<ID>-<stage>.md`" phrasing — while `AGENTS.md` and
`agent-factory/roles/orchestrator.md` had already been rewired to the WF16 phrasing in Wave 1. The
gate named all 15 stray files. I rewired them to the canonical WF16 phrasing AGENTS.md already
carries ("Roles pull shared context and publish typed notes per Workflow 16 — referenced, never
restated"), preserving the SC2 MARKER substring (`If the kit dir is absent, STOP — do not hunt.`)
so the marker check stayed green. The gate then went green — only because the rewire is genuinely
complete.

## D-15 both-direction adversarial proof vs the COMMITTED `scripts/check-kit-refs.js` (MANDATORY)

A green unit suite is NOT proof on this trace/safety surface
([[grugops-safety-invariant-green-suite-insufficient]]). Reproduced INDEPENDENTLY against the
committed `.js` (not the `.ts`, not only vitest), in hermetic `CHECK_ROOT` mirrors built from the
real rewired tree:

| Direction | Setup | Expected | Actual |
|-----------|-------|----------|--------|
| GREEN | clean rewired mirror (zero handoff refs) | exit 0 | **exit 0** ✓ |
| RED | plant `agent-factory/handoffs/anything.md` into `roles/orchestrator.md` | exit 1 + names the stray | **exit 1**, named `agent-factory/roles/orchestrator.md:101` ✓ |
| RED (discriminating) | plant a KNOWN former-template name `architecture-handoff.md` into `workflows/04-ticket-to-pr.md` | exit 1 (pre-flip this PASSED the 16-template allowlist) | **exit 1** ✓ |
| GREEN again | clean mirror, no plant | exit 0 | **exit 0** ✓ |

`D-15 RESULT: GREEN=0 RED=1 RED_known=1 GREEN_again=0`. The discriminating known-template RED case is
the load-bearing one: pre-flip it passed via the ALLOW ERE; post-flip it fails — that is the proof
the flip actually changed behavior, not just that an obviously-stray name fails. The Task-1 test
confirms the same in CI: it FAILED (exit 0 not 1) against the pre-flip committed `.js` and PASSES
against the post-flip `.js`.

## Input-surface code-review (the Phase-23 CR-01 lesson — a logic-probe is not the input-surface review)

Reviewed the flipped Assertion 2 + the SCAN set for input-surface blind spots:

- **Detection is a plain `String.includes("agent-factory/handoffs/")`** over the SCAN-walked lines —
  no regex anchoring, no allowlist, no filters. It catches MORE than the old code, never fewer; the
  old code's blind spot (the ALLOW allowlist + backtick/placeholder filters could permit a
  known-template name) is gone. **No CR-01-class fence blind spot**: a fenced or commented
  `agent-factory/handoffs/` still fails — the gate is fence-agnostic in the SAFE direction (unlike
  the Phase-23 `guard_wr05` where a fenced example slipped through).
- **SCAN set unchanged** from the proven Phase-7 design (roles/workflows/checklists/packaging +
  `_commit-convention.md` + `.claude/skills` + `.claude/agents/grugops-orchestrator.md` + `skills` +
  `AGENTS.md`); `walk()` recurses dirs and silently skips absent paths. The D-15 RED proof exercised
  both a role-dir file and a workflow-dir file. No repo-wide grep (D-13 token economy preserved).
- `examples/*.md` and `scripts/fixtures/` are deliberately excluded — the example docs' historical
  handoff-filename narrative correctly does not trip the gate (frozen narrative artifacts, not
  shipped kit). This is intentional, not a miss.

## Trace-completeness preserved (D-04 / Pitfall 4)

`validate-agent-factory.ts` dropped the `FROZEN_HANDOFFS` array + its existence loop, but the
per-ticket trace-completeness check (`checkTickets` → `trace.includes(id)` over `plans/traceability.md`)
is RE-POINTED, never removed — same path, same ticket-id key, only the row source is now the
note-derived render (24-03). Confirmed live: `grep -c FROZEN_HANDOFFS` in the live code is 0 (the
one remaining hit is a comment), and `grep -q traceability.md` succeeds. The validator exits 0 on
the real tree.

## Oracle adjusted, not retired (Pitfall 5)

`check-uat-oracles.ts` dropped its `FROZEN_HANDOFFS = ["implementation-handoff.md", "qe-handoff.md"]`
parity-filename assertion (it asserted against now-deleted artifacts). The oracle is NOT retired —
A3/DOG-02 equivalence retirement is Phase 26, out of scope. Its surviving live anchors are the two
dispatch-column shape + the frozen verdict; the test that asserted on a deleted handoff filename was
re-pointed to a dispatch-column case (still proves the oracle fails red).

## Deviations from Plan

### Auto-fixed (Rule 3 — blocking issues surfaced by the backpressure gate)

**1. [Rule 3 — Blocking] Rewired 15 adapter invariant blockquotes off the deleted templates.**
- **Found during:** Task 2 (the flipped gate's first run went RED).
- **Issue:** Wave 1 rewired AGENTS.md + orchestrator.md invariant blocks to WF16 phrasing but left
  the same blockquote in the 15 `.claude/skills/*`, `.claude/agents/grugops-orchestrator.md`, and
  `skills/*` adapters still naming `agent-factory/handoffs/`. These are in the SCAN set → the flip
  could not go green until they matched.
- **Fix:** Replaced the handoff sentence with the canonical WF16 phrasing AGENTS.md already carries;
  preserved the SC2 MARKER substring so the marker check stayed green.
- **Commit:** `2e44c31`.

**2. [Rule 3 — Blocking] Dropped the deleted `security-nfr-handoff.md` from `check-foundation-guards.ts` `SEC_VOICE_FILES`.**
- **Found during:** Task 2 (the full suite + the real foundation-guards aggregator went RED:
  "required voice file missing").
- **Issue:** `check-foundation-guards.ts` (NOT in the plan's files_modified) named the deleted
  `agent-factory/handoffs/security-nfr-handoff.md` as a voice-discipline surface — a ghost consumer
  (T-24-05-GHOST). Its test (`check-foundation-guards.test.ts`) also mirrored the file and asserted
  a voice violation against it.
- **Fix:** Dropped the deleted file from `SEC_VOICE_FILES`; removed it from the test's `GUARD_INPUTS`
  and removed the now-obsolete handoff voice case. The two surviving security surfaces
  (`15-security-audit.md`, `security-nfr-checklist.md`) still prove `guard_voice` fails red on a SEC
  surface. Rebuilt the committed `.js`.
- **Commit:** `2e44c31`. (D-14 mandates every consumer of a deleted artifact is updated in the SAME
  atomic change — this is exactly that.)

### Notes / scope clarifications (not deviations)

- The plan frontmatter named `agent-factory/catalog.md`; the actual generated catalog is
  `docs/catalog/README.md` (per CLAUDE.md's docs catalog + `generate-catalog.js`). Regeneration
  produced ZERO diff — `generate-catalog.ts` already has no handoff refs (A1), so the catalog was
  already clean. `freshness:catalog` exits 0.
- `examples/*.md` carry historical handoff-filename narrative; they are deliberately excluded from
  the gate's SCAN set (frozen narrative artifacts, out of this plan's scope — not in any Phase-24
  plan's files_modified). Left unchanged by design.

## Verification evidence

- `node scripts/check-kit-refs.js` → exit 0 (flipped gate green via backpressure)
- `VALIDATE_KIT_ROOT=$(pwd) node scripts/validate-agent-factory.js` → exit 0
- `node scripts/check-foundation-guards.js` → exit 0 (incl. `guard_context_writes` WR-01 green on rewired prose)
- `node scripts/check-uat-oracles.js` → exit 0
- `npx vitest run --exclude '**/scripts/e2e/**'` → 469 passed, 1 skipped (23 files)
- `npm run freshness` → 20 committed `.js` match a fresh rebuild (0 drift)
- `npm run freshness:catalog` / `:context` / `:queue` / `:traceability` → all exit 0
- `ls agent-factory/handoffs/` → empty (17 deleted); `ls -d scripts/fixtures/*/agent-factory/handoffs/` → empty (8 deleted)
- `grep -c FROZEN_HANDOFFS scripts/validate-agent-factory.ts` → 0 live (1 comment); `grep -q traceability.md` → present
- Commit `2e44c31` deletions: 145 files, ALL under `handoffs/` (intentional); no untracked files

## Requirements

- **MIGR-02** — the static handoff relay is removed (templates + seed already gone via 24-04;
  validator/oracle/gate consumers updated); the trace survives as the note-derived render.

## Self-Check: PASSED

- scripts/check-kit-refs.test.ts — FOUND
- 24-05-SUMMARY.md — FOUND
- commit 1002d07 — FOUND
- commit 2e44c31 — FOUND
- agent-factory/handoffs/ — empty (0); fixture handoffs/ dirs — empty (0)
