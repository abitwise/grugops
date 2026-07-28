---
phase: 21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl
plan: 02
subsystem: pr-quality-gate
tags: [verifier, gate, verdict, context-io, vfy, single-source]
requires:
  - "scripts/context-io.ts emitVerdict()/admit() — the Plan 01 verdict-emission carve-out + admission cross-check"
  - "agent-factory/workflows/05-pr-quality-gate.md Step 4 (self_fix_attempts) + Step 5 (terminal results)"
provides:
  - "05-pr-quality-gate.md Step 5 green-only verdict-emission step: the gate calls emitVerdict in context-io.ts on READY_FOR_HUMAN_REVIEW, authoring a by:§14-gate verdict with a unique node:crypto per-run id"
  - "the producer side of VFY-01 — a real green gate run mints the §14-gate#<id> stamp downstream findings reference as verified_by"
  - "VFY-04 honesty: the verify->regenerate cycle references the existing Step-4 self_fix_attempts (no new dial); non-green emits no green verdict, refused findings degrade to UNKNOWN - verify"
affects:
  - "agent-factory/workflows/16-context-read-write.md (Plan 03 — references this gate's verdict-emission + the admission rules)"
tech-stack:
  added: []
  patterns:
    - "reference-don't-inline: the gate NAMES context-io.ts/emitVerdict for the write (guard_context_writes scan set); no raw .grugops/context write token"
    - "green-only event-driven emission keyed to the READY_FOR_HUMAN_REVIEW terminal result"
    - "no-new-dial verify->regenerate cycle pinned to the existing Step-4 self_fix_attempts budget (D-12)"
key-files:
  created: []
  modified:
    - "agent-factory/workflows/05-pr-quality-gate.md"
decisions:
  - "Verdict-emission text lives in Step 5's green branch (READY_FOR_HUMAN_REVIEW) and explicitly NOT on BLOCKED_NEEDS_FIX / SPLIT_REQUIRED (D-03/D-11)"
  - "The write is delegated to context-io.ts emitVerdict BY NAME — no inlined raw write (D-15 + guard_context_writes)"
  - "VFY-04 made honest by reference, not restatement: the verify->regenerate cycle is the existing Step-4 self_fix_attempts loop (D-12, no new config key)"
  - "Commit/Trace tail updated to note the green §14-gate verdict context note as an emitted artifact (committed on a green result)"
metrics:
  duration: 4m
  completed: 2026-06-17
---

# Phase 21 Plan 02: §14 Gate Verdict Emission Summary

Made the §14 gate the producer of the trust signal Plan 01 enforces: on a GREEN
`READY_FOR_HUMAN_REVIEW` result ONLY, the gate now emits a `by: §14-gate` verdict via
`scripts/context-io.ts` (`emitVerdict`), carrying a unique per-run id from `node:crypto` that downstream
findings reference as `verified_by: §14-gate#<id>` — the root-of-trust self-attestation carve-out
(D-03/D-04), landed single-source in `05-pr-quality-gate.md` with `guard_context_writes` staying green.

## What was built

Edited `agent-factory/workflows/05-pr-quality-gate.md` ONLY (D-15 single-source — no gate logic forked,
`context-io.ts` not touched). Clear professional voice throughout (trace + safety surface).

- **Verdict-emission step in Step 5's GREEN branch (D-03/D-04).** On `READY_FOR_HUMAN_REVIEW` — and only
  on it, never on `BLOCKED_NEEDS_FIX` / `SPLIT_REQUIRED` — the gate calls the `emitVerdict` carve-out in
  `scripts/context-io.ts` (`node scripts/context-io.js` exposes it). The prose NAMES `context-io.ts`/
  `emitVerdict` and explicitly forbids an inlined raw write — so no write token co-occurs a
  `.grugops/context/` path and `guard_context_writes` does not fire. Framed as the D-04 root-of-trust
  carve-out (the gate is the one reserved author allowed to stamp `by: §14-gate`, mirroring the
  prod-deploy hook trusting its human-set env var), which is why the verdict-is-a-finding model does not
  regress into "every finding needs a stamp".

- **The emitted verdict shape (matches Plan 01's recognizer byte-for-byte).** The step states the gate
  mints a **unique per-run id from `node:crypto`** (`randomUUID`), explicitly NOT the ticket id, and that
  `emitVerdict` composes a `kind: finding` authored `by: §14-gate`, carrying `refs: [§14-gate#<id>]` and a
  body containing the green marker `READY_FOR_HUMAN_REVIEW`. That `<id>` is the value a downstream finding
  references as `verified_by: §14-gate#<id>`; the `admit` cross-check confirms the finding against the live
  green verdict before write.

- **VFY-04 made honest by reference (D-11/D-12).** A non-green result emits NO green verdict, so a refused
  finding degrades to a `claim` with `confidence: UNKNOWN - verify` — never a hand-set or faked green. The
  verify→regenerate cycle is pinned to the EXISTING Step-4 `self_fix_attempts` loop (default `2`, "two
  rounds then human") — no new config key, no second loop: record finding → admission refused → spend the
  bounded Step-4 attempts obtaining the real stamp → then stop and hand to a human.

- **Commit/Trace tail updated** to name the green `§14-gate` verdict context note (emitted via
  `emitVerdict`) as a committed artifact on a `READY_FOR_HUMAN_REVIEW` result.

## The emitted verdict-note shape (confirms the 21-01 admission contract)

| Field | Value | Matches 21-01 recognizer |
|-------|-------|--------------------------|
| `kind` | `finding` | yes |
| `by` | `§14-gate` | yes |
| `refs` | includes literal `§14-gate#<id>` | yes |
| body | contains `READY_FOR_HUMAN_REVIEW` | yes (`VERDICT_GREEN_MARKER`) |
| per-run id | unique `node:crypto` id, NOT the ticket id | yes (T-21-07 mitigation) |
| liveness | LIVE (a superseded/withdrawn verdict does not admit) | enforced by `currentState` in `admit` |

The gate calls `context-io.ts emitVerdict` (the canonical emitter from 21-01) rather than inlining a raw
write, so the emitted verdict matches the 21-01-SUMMARY.md recognizer exactly.

## Deviations from Plan

None — plan executed exactly as written. The single Task 1 edit landed in `05-pr-quality-gate.md` only;
all grep acceptance criteria and the foundation-guards vitest passed first time.

## Threat surface scan

No new security-relevant surface beyond the plan's `<threat_model>`. The edit adds prose that delegates
the verdict write to the already-sanctioned `context-io.ts` path; the trust boundaries (§14 gate →
shared context; workflow prose → context-io.ts) are exactly those the threat register covers (T-21-06..09,
T-21-SC), and each is mitigated as planned (green-only emission, unique per-run id, no fork, no raw write).

## Verification

- `grep -c "§14-gate#" 05-pr-quality-gate.md` → 2 (≥1: the per-run-id stamp downstream findings consume).
- `grep -c "context-io" 05-pr-quality-gate.md` → 3 (≥1: write delegated to context-io.ts by name).
- `grep -c "self_fix_attempts" 05-pr-quality-gate.md` → 4 (≥1: existing Step-4 loop referenced; no new key).
- `grep -c "UNKNOWN - verify" 05-pr-quality-gate.md` → 5 (≥1: the no-faked-pass escape hatch is stated).
- Verdict-emission text appears in the `READY_FOR_HUMAN_REVIEW` (Step 5) branch and explicitly NOT on
  blocked/split.
- `grep -nE "\.grugops/context" 05-pr-quality-gate.md` → none (no raw-write fragment co-occurs a context path).
- `npx vitest run scripts/check-foundation-guards.test.ts` → 25 passed (guard_context_writes + guard_voice
  stay green for the edited file).
- `node scripts/check-foundation-guards.js` → ALL CHECKS PASSED (one pre-existing A3 Tier-2 CC-native-parity
  WARN, unrelated to this plan — same WARN recorded in 21-01-SUMMARY.md).
- `git diff --name-only agent-factory/workflows/` → only `05-pr-quality-gate.md` (single-source, D-15).

## Self-Check: PASSED

- FOUND: `.planning/phases/21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl/21-02-SUMMARY.md`
- FOUND: commit `d8279d4` (feat — verdict-emission step)
