---
phase: 25-governance-on-a-dial
plan: 07
subsystem: governance / admission-guard (GOV-01 un-forgeable human-admission tier)
tags: [gap-closure, round-4, GOV-01, admission-guard, command-resolution, invert-the-default, anti-whack-a-mole, D-12]
requires:
  - "25-06 ONE liveAdmitSegments resolution+classification authority (Classes A/B/E/F closed)"
  - "25-05 effective-command-word resolution (GAP-A/B/C/D)"
  - "25-04 shell-segment tokenizer (liveTokens segmentation)"
  - "25-01 config foundation (readGovernanceConfigResult, human_admission dial)"
provides:
  - "leading-run resolver fails CLOSED on the unresolvable tail (modifier-operand / unlisted-wrapper / leading-redirection command word)"
  - "the round-4 invert: an admit shape behind a non-launcher command word is gated, not silently dropped"
affects:
  - "hooks/admission-guard.ts / hooks/admission-guard.js (the un-forgeable GOV-01 tier)"
tech-stack:
  added: []
  patterns:
    - "invert-the-default-on-the-unresolvable-tail (P22 round-8 'the boundary IS the parser, fail closed on the unresolvable tail', applied to leading-run resolution)"
    - "severity-classified gate behind a wrapper (read the live note positional like a launcher; routine ALLOWs under high-severity, high DENIES)"
    - "dynamic-eval-word-scoped raw-text fail-closed (an executed quoted body behind an operand gates; an inert quoted/heredoc/comment mention behind a plain wrapper allows)"
key-files:
  created:
    - "25-07-RED-baseline.txt"
    - "25-07-GREEN-proof.txt"
    - "25-07-SUMMARY.md"
  modified:
    - "hooks/admission-guard.ts"
    - "hooks/admission-guard.js"
    - "hooks/admission-guard.test.ts"
    - "scripts/floor-invariance.test.ts"
decisions:
  - "Round-4 invert disposition: a LIVE admit shape behind an unresolved leading-run command word is pushed as a RESOLVABLE segment ({noteFile: noteFileInSegment(...), unresolvable: false}) and classified by the (readable) note severity — NOT the literal plan's {noteFile: null, unresolvable: true}. Rationale: the literal blanket-gate would over-block a routine admit behind a wrapper under high-severity, failing the plan's OWN over-block must_have; reading the live note positional behind the wrapper is safe (the note's `by` cannot be forged downward) and satisfies both the threat (high-severity → DENY) and the dial contract (routine → ALLOW under high-severity, DENY under all)."
  - "The rawTextHasAdmitShape fallback in the invert is SCOPED to a dynamic-eval word in the segment's leading run (segmentHasDynamicEvalWord), NOT applied unconditionally as the plan action suggested. Rationale: an unconditional raw-text check would over-block an inert quoted/heredoc/comment admit mention behind a plain wrapper (e.g. `timeout 5 echo \"…admit…\"`), failing the plan's over-block must_have and existing tests; raw-text is only safe where the quoted body is actually EXECUTED (eval/sh -c/bash -c/$X)."
metrics:
  duration: "~50m"
  completed: 2026-06-25
  tasks_completed: 3
  tasks_total: 4
status: gaps_pending_redteam
checkpoint_25_07_04: BLOCKING — author tasks 01-03 complete + all author gates green; the INDEPENDENT both-angle opus red-team (D-12) has NOT yet been dispatched by the orchestrator. SC1 closure is NOT declared on the author suite. See "Checkpoint 25-07-04" below.
---

# Phase 25 Plan 07: INVERT the default on the unresolvable leading-run tail (round-4 gap closure) Summary

Round-4 GOV-01 gap closure: the leading-run resolver in the ONE `liveAdmitSegments` authority now FAILS CLOSED on the unresolvable tail — an admit shape behind a command word that does not resolve to a recognized launcher (a modifier OPERAND the prefix-skip stopped at, an UNLISTED wrapper, or a LEADING REDIRECTION the tokenizer read as the command word) is treated as a live admit and gated, exactly as Class B already does for a dynamic command word, instead of being silently dropped (the round-3 default-ALLOW hole the 25-06 independent both-angle red-team found).

## Status

Tasks 25-07-01, 25-07-02, 25-07-03 are COMPLETE and committed atomically on `main`. **Task 25-07-04 is a `checkpoint:human-verify` with `gate="blocking"` — HARD-STOPPED, NOT self-approved.** Per D-12 and [[grugops-safety-invariant-green-suite-insufficient]] (this is round 4 / the 8th green-suite-insufficient catch of v2.0 — the author's suites passed and STILL missed a class across rounds 1, 2, 3, and the round-3 fix), the INDEPENDENT both-angle opus red-team is the closure gate and is the ORCHESTRATOR's to dispatch, not the authoring executor's to self-report. This summary records the author's proof + the executor's own adversarial probing; SC1 closure is NOT declared on the author's green suite.

## The structural INVERT inside `liveAdmitSegments` (admission-guard.ts)

After the leading-run prefix-skip resolves the segment's command word, the prior code followed one of three branches — the synthetic `DYNAMIC_COMMAND_WORD` (Class B), a launcher, or a dynamic-eval / `$X` word — and SILENTLY DROPPED any segment matching none of them (the default-ALLOW hole). The round-4 edit adds a `continue` to the existing dynamic-eval branch (behavior-preserving — it previously fell through to loop end) and a NEW fail-closed catch-all for the remaining non-launcher command words:

- **A LIVE admit shape** (`segmentHasAdmitShape`) behind the unresolved command word → the note positional is itself a live token (the wrapper/operand/redirection sits in FRONT of `node …context-io admit NOTE`), so the segment is pushed as RESOLVABLE (`{ noteFile: noteFileInSegment(...), unresolvable: false }`) and classified by the note's actual severity exactly like a launcher: a high-severity admit DENIES, a routine admit is gated only under `all` (never under `high-severity`). When the note positional is absent, `noteFileInSegment` returns null → fail closed downstream.
- **No live admit shape, but a dynamic-eval word in the leading run** (`segmentHasDynamicEvalWord`) AND the RAW segment text carries the admit shape (an admit hidden inside an EXECUTED quoted body, e.g. `timeout 5 sh -c "node …admit NOTE"`) → pushed as `{ noteFile: null, unresolvable: true }` → fail closed.
- **Otherwise** (a non-admit wrapper, or an inert quoted/heredoc/comment mention behind a plain wrapper) → NOT pushed → ALLOW (the over-block fail-safe).

This closes sub-roots (a) modifier-operand, (b) unlisted wrapper, (c) leading redirection, the dial-`all` routine-behind-wrapper leak, and the Class-E reopening — all from ONE admit-shape-triggered branch. `COMMAND_MODIFIERS` is NOT widened; no operand/redirection grammar is enumerated; the `liveTokens` tokenizer body is byte-identical (only the leading-run DISPOSITION on the unresolved tail changed). One helper (`segmentHasDynamicEvalWord`) was added; it reuses the existing `DYNAMIC_EVAL_WORDS` / `isEnvIndirectedWord` recognizers and is a scan within the one authority, not a second walk.

## Single-authority + byte-frozen confirmations

- `grep -cE "function tokenize|noteFileFromCommand" hooks/admission-guard.ts` → **0** (second walk stays deleted; two parsers cannot drift).
- `grep -c "function liveAdmitSegments" hooks/admission-guard.ts` → **1** (the one authority).
- `COMMAND_MODIFIERS` membership = `{command, exec, builtin, nice, time, nohup, stdbuf, timeout, xargs}` — **UNCHANGED** from the committed set (no widening; the closed-enumeration anti-pattern was avoided).
- `git diff --quiet hooks/guard.ts` → **exit 0** (byte-frozen, blob `3501810e21308e4b7e219679a6ca30dace9b5d66`, D-02).
- `git diff --quiet scripts/context-io.ts` → **exit 0** (UNCHANGED — GAP-C/GAP-D + the GOV-02 audit ledger preserved byte-identically; the entire fix lives in the hook's command resolution).
- `npm run build && npm run freshness` → **0 drift** (the committed `admission-guard.js` is a fresh, byte-faithful tsc build).

## RED → GREEN proof artifacts (D-12, vs the committed .js)

- `25-07-RED-baseline.txt` — captured FIRST, before any edit: the PRE-FIX committed `admission-guard.js` (blob `a65a93c58a975b7b4a9fbc54641fc5207062f222`) ALLOWs all 31 bypass rows (9 sub-root a + 6 sub-root b + 3 sub-root c + 3 compounding + 4 invented + the preserved-control deltas), while the 10 over-block-clean controls correctly ALLOW and the 5 preserved round-3/round-2 controls are correct.
- `25-07-GREEN-proof.txt` — captured after the fix (build + freshness 0): the POST-FIX committed `.js` DENIES every bypass row (each sub-root, the dial-`all` leak, the Class-E reopening, all four invented shapes) while every over-block-clean control still ALLOWs and every preserved round-3/round-2 control holds. Both files extend the 25-05/25-06 row format and reference the committed `.js`, never the `.ts` and never the author suites.

## Fuzz matrix (scripts/floor-invariance.test.ts, round-4 additions)

Anti-whack-a-mole CLASS invariant over NEW dimensions (round-2 + round-3 sweeps PRESERVED, not duplicated):
- **modifier-operand** — {timeout, nice, exec, xargs, env, nohup} × {bare `5`, `-n 5`, `-a foo`, `-I {}`, `-C /tmp`, `-u PATH`, `-k 1 5`, quoted `'-n' '5'`} × {bare, `/usr/bin/`, `./`} behind an admit shape → DENY; the same prefix with no admit shape → ALLOW.
- **unlisted-wrapper** — {sudo, doas, setsid, ionice, chrt, taskset} × {no flag, `-c2`, `-f 1`, `0x1`} on an admit shape → DENY; on a non-admit command → ALLOW.
- **leading-redirection** — {`>/dev/null`, `1>/dev/null`, `2>/dev/null`, `2>&1`, `&>/dev/null`} on an admit shape → DENY; on a non-admit command → ALLOW.
- **dial × admit-ordering** — routine-behind-wrapper DENIES under `all`, ALLOWs under `off`; a wrapped high-severity admit in any position/separator (2- and 3-admit chains) DENIES under high-severity; a routine-only wrapped chain ALLOWs under high-severity, DENIES under `all`.
- **LF | CRLF** and **invented un-enumerated shapes** (path-form modifier+flag+operand, redirection between wrapper and launcher, 3-admit shield, stacked operand+eval, doubled wrapper, operand-then-wrapper) caught structurally; the four named floor invariants + guard.ts byte-frozen re-asserted.

## Verification commands run (author suite — necessary, NOT sufficient per D-12)

- `npm run build && npm run freshness` → **0 drift**.
- `npx vitest run hooks/admission-guard.test.ts` → **162 passed** (≥ guard.test.ts's 27; round-4 sub-root/compounding/over-block/invented cases added; round-3 A/B/E/F + round-2 GAP-B/D hold).
- `npx vitest run scripts/floor-invariance.test.ts` → **168 passed** (round-4 fuzz added; round-2 + round-3 sweeps preserved).
- `npx vitest run scripts/check-foundation-guards.test.ts` → **28 passed** (WR-01 no false-positive on the resolver edit / new artifacts).
- `npx vitest run --exclude '**/scripts/e2e/**'` → **846 passed | 1 skipped**, 0 failures (full non-e2e regression; bare `npm test` deliberately NOT run — it triggers the live claude-CLI e2e lane, MEMORY grugops-npm-test-triggers-live-e2e).
- `git diff --quiet hooks/guard.ts` → exit 0; `git diff --quiet scripts/context-io.ts` → exit 0.

## Executor's own adversarial probing (NOT a substitute for the independent red-team)

The executor's child-spawn probe (vs the committed `.js`, both directions) reproduced the RED → GREEN flip for every documented sub-root + compounding leak, AND invented un-enumerated shapes the plan did not enumerate — confirmed caught STRUCTURALLY post-fix:
- `/usr/bin/timeout -k 1 5 node …admit <hi>` (path-form modifier + flag + operand chain) → DENY.
- `timeout 5 2>/dev/null node …admit <hi>` (a redirection BETWEEN the wrapper and the launcher) → DENY.
- `node …admit <rt> ; node …admit <rt> ; sudo node …admit <hi>` (3-admit shield behind two routines) → DENY.
- `timeout 5 sh -c "node …admit <hi>"` (a stacked operand + EXECUTED-eval body — the admit hidden inside `sh -c`'s quoted string behind the `timeout` operand) → DENY via the dynamic-eval-scoped raw-text branch. **This form is NOT in the documented sub-roots; the executor found it RED (pre-fix ALLOW) and closed it.**
- Over-block fail-safe held: `timeout 5 echo "…admit…"`, `timeout 5 cat <<EOF…EOF`, `timeout 5 ls # …admit…`, a routine-only multi-admit behind a wrapper under high-severity → all ALLOW.

This is the AUTHORING executor's probing and is necessary-but-not-sufficient (D-12); it does not satisfy the independent-adversary requirement.

## Deviations from Plan

Two deviations from the plan's LITERAL `<action>` text — both are Rule-1 corrections required to satisfy the plan's OWN `must_haves` over-block controls (the literal text was internally inconsistent with the over-block truths). Behavior matches every documented sub-root, compounding leak, and over-block control.

1. **Invert disposition for a LIVE admit shape: severity-classified gate, not blanket unresolvable.** The plan action prescribed pushing `{ noteFile: null, unresolvable: true }` (a blanket fail-closed gate). That would DENY a routine admit behind a wrapper under `high-severity`, contradicting the plan's over-block must_have ("a routine-only multi-admit under high-severity … ALLOW", with the literal example `node …admit <r1> ; timeout 5 node …admit <r2>`). Instead, a live admit shape is pushed RESOLVABLE and classified by the readable note severity (the note positional is a live token behind the wrapper; the note's `by` cannot be forged downward, so this is safe). Result: high-severity wrapped admit DENIES (threat closed), routine wrapped admit ALLOWs under high-severity / DENIES under `all` (dial contract honored). A wrapped admit with no locatable note still fails closed (`noteFileInSegment` → null).
2. **Raw-text fail-closed scoped to a dynamic-eval word, not unconditional.** The plan action suggested also checking `rawTextHasAdmitShape` unconditionally "so an admit shape inside a quoted operand is still caught". Unconditionally, that would DENY an inert quoted/heredoc/comment admit mention behind a plain wrapper (`timeout 5 echo "…admit…"`), contradicting the over-block must_have and breaking existing inert-mention tests. Instead, the raw-text check fires ONLY when a dynamic-evaluation word (`eval`/`sh -c`/`bash -c`/`$X`) sits in the segment's leading run (`segmentHasDynamicEvalWord`) — i.e. only where the quoted body is actually EXECUTED. This closes the stacked operand+eval form (`timeout 5 sh -c "…admit…"`) while leaving inert mentions behind a plain wrapper ALLOW.

`scripts/context-io.ts` was NOT edited (the entire fix lives in the hook). One small helper (`segmentHasDynamicEvalWord`) was added to the hook; it is a scan within the one `liveAdmitSegments` authority reusing the existing dynamic-eval recognizers, not a second walk.

## Preserved (no regression)

The round-3 closures (Class A path-form launcher / Class B `$()`-backtick command word / Class E per-segment multi-admit / Class F validate()-consistent `by`), the round-2 LOGIC closures (GAP-B self-set behind a wrapper / GAP-C non-string/corrupt/absent dial canonicalization / GAP-D case-insensitive HIGH_SEVERITY_ROLES), SC2 (audit_retention 3-surface lockstep), the GOV-02 audit ledger, and the 25-04/25-05/25-06 segmentation are all unchanged and stay green in their sweeps. The four named floor invariants (refuse-self / no-fabrication / `quality.test_integrity` no `off` / `hooks/guard.ts` byte-frozen) hold at every dial value.

## Checkpoint 25-07-04 — BLOCKING, awaiting the independent both-angle red-team

Per D-12 and [[grugops-safety-invariant-green-suite-insufficient]] (the 8th green-suite-insufficient catch of v2.0), the author's 162 + 168 + 28 + 846 green cases are NECESSARY-BUT-NOT-SUFFICIENT. SC1 round-4 closure REQUIRES an INDEPENDENT opus-grade both-angle (LOGIC + INPUT-SURFACE, the P23 split) red-team to reproduce (a)–(d) of Task 25-07-04 vs the committed `admission-guard.js` — inventing an un-enumerated obfuscation shape PER angle — before the floor is considered proven. That red-team is the orchestrator's to dispatch; the executor HARD-STOPPED here without self-approving. The phase is NOT marked complete and the ROADMAP phase status is NOT flipped to Complete pending this checkpoint.

## Self-Check: PASSED (author tasks 01–03)

- `25-07-RED-baseline.txt`, `25-07-GREEN-proof.txt`, `25-07-SUMMARY.md` exist.
- Commits `67d4d17` (invert + proofs), `c581a2e` (oracle), `01e8b72` (fuzz) exist on `main`.
- `hooks/admission-guard.js` is a fresh tsc build (freshness 0); `hooks/guard.ts` byte-frozen `3501810e…`; `scripts/context-io.ts` unchanged.
