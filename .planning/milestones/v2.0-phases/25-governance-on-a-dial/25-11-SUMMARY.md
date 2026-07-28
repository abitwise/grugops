# 25-11 SUMMARY — round-6 honest closeout + independent red-team (GAPS_FOUND)

**Plan:** 25-11 (round 6, MOVE-THE-GATE-TO-POINT-OF-EFFECT)
**Outcome:** checkpoint 25-11-03 NOT approved → **gaps_found** (round 6, the 11th green-suite-insufficient catch). SC1 round-6 closure NOT declared. Phase 25 NOT complete; ROADMAP NOT flipped; GOV-01 NOT marked complete.

## What executed (tasks 01–02)
- **25-11-01** (`1b28852`): WF16 step 3 + `context-note.md` `verified_by` lines rewritten to the round-6 model — on Claude Code the sanctioned admission path is the STRUCTURED `mcp__grugops__propose_note` tool, gated by the PER-CALL `admission-guard` hook (final structured args, fresh per-call session env, per-note `human:<name>` stamp binding). `context-io.ts` remains the single writer (`admitAndAppend → appendNote`). Non-CC CLIs degrade to the in-script `admit()` refusal + prompt-level stop (D-04/D-05).
- **25-11-02** (`e331c7b`): SC1 restated (ROADMAP Phase 25 SC1 + 25-CONTEXT §A′) to the achievable per-note invariant; same-uid direct-write residual documented (incl. `node -e appendNote`/`admitAndAppend`/`emitVerdict`).
- Foundation guards green (no WR-01 false-positive), freshness 0, all four source files byte-frozen. The executor HARD-STOPPED at the blocking 25-11-03 checkpoint without self-approving (correct).

## Checkpoint 25-11-03 — independent bash-grounded red-team (the D-12 gate) → GAPS_FOUND
The orchestrator dispatched TWO independent opus red-teams vs the COMMITTED `.js` (channel-forge angle + preservation/new-hole angle) and self-reproduced the cleanest finding.

**SOLID / preserved (confirmed):** SC1's core human-gate held — under an ACTIVE dial no gated high-severity finding admits through the per-call hook without a real human-set env + matching `human:<name>` stamp (full negative+positive kind×by×dial×stamp×env matrix correct); SC3 garbage/typo/corrupt-config fail-closed; positive per-note D-07 path works; `guard.ts`/`admit()` frozen; `liveTokens` parser deleted (grep=0); single-source `isGatedNote` used by both hook and combiner (no allow-forge cell); SC2 + GOV-02 ledger untouched; freshness 0.

**Three channel-reachable defects (see 25-VERIFICATION.md post-25-11 banner for full repros + fixes):**
1. **GAP-R6-1 (decisive, NEW)** — path traversal through the sanctioned writer: agent-controlled `by` → `noteId` → filename with no containment guard; via `propose_note` with a SOFT kind (hook doesn't engage) `by:"x/../../../VICTIM/notes/INJECTED"` writes into another task's context. Orchestrator-confirmed. Round-6 exposed (first agent-facing write path to `appendNote`).
2. **GAP-R6-2** — config-root divergence: server reads the dial/root from agent-supplied `repoRoot`/`contextRoot`, diverging from the hook's `CLAUDE_PROJECT_DIR`; off-mode defeats W3 → forged `human:eve` note in the real context. RT-1 bash-grounded.
3. **GAP-R6-3** — per-session ≠ per-note: env grant has no nonce/consumption; SC1's "per-note" is a capability, not enforced (disposed_by over-attribution). Safety-posture scoping — a human decision.

## Next
`/gsd-plan-phase 25 --gaps` (round 7): fix GAP-R6-1 (path-containment + charset guard in `appendNote`) + GAP-R6-2 (server derives root from `CLAUDE_PROJECT_DIR`; forbid agent `repoRoot`/`contextRoot`); resolve GAP-R6-3 per the human's scoping choice (enforce per-note nonce vs honest-scope SC1 to session-grant). Re-prove with the independent bash-grounded opus red-team protocol (green suite ≠ proof — 11 straight times).

_Authored 2026-06-26 by the orchestrator from the red-team reproductions (no-fabrication: checkpoint not approved, verdict authored from the bypass, not a green author suite)._
