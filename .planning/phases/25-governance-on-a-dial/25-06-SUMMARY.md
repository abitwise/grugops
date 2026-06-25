---
phase: 25-governance-on-a-dial
plan: 06
subsystem: governance / admission-guard (GOV-01 un-forgeable human-admission tier)
tags: [gap-closure, round-3, GOV-01, admission-guard, command-resolution, anti-whack-a-mole, D-12]
requires:
  - "25-01 config foundation (readGovernanceConfigResult, human_admission dial)"
  - "25-02 admission-guard.ts hook (PreToolUse) + 25-03 admit() / GOV-02 audit ledger"
  - "25-04 shell-segment tokenizer (liveTokens segmentation)"
  - "25-05 effective-command-word resolution (GAP-A/B/C/D)"
provides:
  - "ONE liveAdmitSegments per-segment resolution+classification authority (Classes A/B/E/F closed)"
  - "the naive tokenize + noteFileFromCommand second walk DELETED (single authority, no drift)"
affects:
  - "hooks/admission-guard.ts / hooks/admission-guard.js (the un-forgeable GOV-01 tier)"
tech-stack:
  added: []
  patterns:
    - "unify-matcher-and-classifier-into-one-walk (P22 round-8 'the boundary IS the parser', applied to command-RESOLUTION)"
    - "synthetic DYNAMIC_COMMAND_WORD token for a token-start $()/backtick substitution → fail-closed"
    - "per-segment classify-and-gate-if-any (Class E multi-admit shield)"
    - "validate()-consistent hook note read via parseNote duplicateKeys/malformedLines (Class F)"
key-files:
  created:
    - "25-06-RED-baseline.txt"
    - "25-06-GREEN-proof.txt"
  modified:
    - "hooks/admission-guard.ts"
    - "hooks/admission-guard.js"
    - "hooks/admission-guard.test.ts"
    - "scripts/floor-invariance.test.ts"
decisions:
  - "Class B: detect a token-start $()/backtick command substitution in the TOKENIZER (emit a synthetic DYNAMIC_COMMAND_WORD token, consume the balanced span as data) rather than in the resolver — keeps the resolver a uniform leading-run walk and lets the existing fail-closed branch handle it."
  - "Class F: consult parseNote's recorded duplicateKeys/malformedLines for the `by` key specifically (option b), NOT call validate() (option a) — the hook's note re-read only needs `by` to classify severity, and validate()'s full required-field set (kind/at/confidence) would over-reach on the hook's narrower contract. scripts/context-io.ts is UNCHANGED."
metrics:
  duration: "~1h"
  completed: 2026-06-25
  tasks_completed: 3
  tasks_total: 4
status: in-progress-blocked-at-checkpoint
---

# Phase 25 Plan 06: UNIFY matcher+classifier into ONE liveTokens authority (round-3 gap closure) Summary

Round-3 GOV-01 gap closure: replaced the admission guard's TWO diverging command walks (the `liveTokens` matcher + a naive `tokenize`/`noteFileFromCommand` second walk) with ONE `liveAdmitSegments` per-segment resolution+classification authority, closing the four round-3 bypass classes (A path-form modifier / B `$()`+backtick command word / E multi-admit shield / F duplicate-or-indented `by`) the 25-05 independent red-team found against the committed `.js`.

## Status

Tasks 25-06-01, 25-06-02, 25-06-03 are COMPLETE and committed atomically on `main`. **Task 25-06-04 is a `checkpoint:human-verify` with `gate="blocking"` — HARD-STOPPED, NOT self-approved.** The independent both-angle opus red-team (D-12) is run by the ORCHESTRATOR, not the authoring executor. This summary records the author's proof; SC1 closure is NOT declared on the author's green suite.

## The ONE liveAdmitSegments authority (structure)

`liveAdmitSegments(cmd): AdmitSegment[]` walks the live tokens once and yields, per LIVE command segment, `{ noteFile, unresolvable }`. It replaced both `isAdmitInvocation` (the launcher-membership matcher) and `noteFileFromCommand` + the standalone `tokenize` (the naive note-file second walk that read only the FIRST `admit`). Per segment:

- **Class A — command-word resolution over EVERY leading-run token.** `isCommandPrefix` now resolves each leading-run token's EFFECTIVE word (`effectiveCommandWord` basename + the tokenizer's de-quote) before the modifier test, and the prefix-skip loop also skips a modifier's option flag (`env -S`, `env -i`) once a modifier has been skipped. So a path-form `/usr/bin/env` / `/usr/bin/nice` / `./nice` resolves to `env`/`nice` and is skipped exactly like the bare form, and the trailing `node` becomes the effective command word. (Root: the prior `isCommandPrefix` tested the RAW token, so a path-form modifier escaped the skip and `node` read as an argument.)
- **Class B — a `$( … )`/backtick command word fails CLOSED.** The tokenizer emits a synthetic `DYNAMIC_COMMAND_WORD` token for a token-start substitution (`matchCommandSubstitution` consumes the whole balanced span, counting nested `$( … )`), then keeps the segment open so the trailing `…admit NOTE` is still scanned. When the segment carries the admit shape, the resolver marks it `unresolvable: true` → gate. This closes the `$X`-fails-closed-but-`$(…)`-fails-open asymmetry. Narrow trigger: a substitution with NO admit shape is not an admit segment (no over-block).
- **Class E — the classifier IS the segment walk.** EVERY live admit segment is enumerated (not just the first `admit`); the note file is the second live token after that segment's `admit` verb (`noteFileInSegment`). The main flow classifies each segment (`classifySegmentOrDeny`) and the command gates if ANY segment resolves to a gated severity — so a high-severity admit shielded behind a routine admit DENIES regardless of order/separator. A routine-only multi-admit under `high-severity` stays ALLOWED (no blunt gate-any-multi-admit rule).
- **Class F — validate()-consistent per-segment note read.** Before reading `parsed.scalars.by` (last-wins), the hook consults `parsed.duplicateKeys` and `parsed.malformedLines` for the provenance `by` — the SAME structural signals `validate()` (context-io.ts:542-557) rejects — and gate-or-stricter on a duplicate / indented `by`. The hook and `admit()` now classify the identical note identically.

## Second walk DELETED + byte-frozen confirmations

- `grep -cE "function tokenize|noteFileFromCommand" hooks/admission-guard.ts` → **0** (single authority; two parsers cannot drift).
- `grep -c "function liveAdmitSegments" hooks/admission-guard.ts` → **1**.
- `git diff --quiet hooks/guard.ts` → **exit 0** (byte-frozen, blob `3501810e21308e4b7e219679a6ca30dace9b5d66`, D-02).
- `git diff --quiet scripts/context-io.ts` → **exit 0** (UNCHANGED — GAP-C/GAP-D + GOV-02 ledger preserved; the Class F fix reuses the exported `parseNote` signals only).
- `npm run freshness` → **0 drift** (21 committed `.js` match a fresh tsc rebuild). Post-fix `admission-guard.js` blob `a65a93c58a975b7b4a9fbc54641fc5207062f222`.

## Fuzz matrix (scripts/floor-invariance.test.ts, round-3 additions)

Anti-whack-a-mole CLASS invariant over three NEW dimensions × {LF, CRLF} (round-2 sweeps PRESERVED, not duplicated):

- **Class A** — {modifier ∈ env/nice/xargs/nohup/stdbuf/timeout/command/exec} × {path prefix ∈ /usr/bin/, /bin/, ./} × {optional flag, doubled chain} → DENY; inert path-form modifier (`/usr/bin/env ls`) → ALLOW.
- **Class B** — {`$(echo node)`, backtick, `$(printf node)`, `$(basename …)`, nested, in-modifier-slot, path-modifier+substitution} on the admit shape → GATE; {`$(echo hi) ls`, bare backtick, `$(printf foo) echo bar`} → ALLOW.
- **Class E** — a 3-segment chain with the high-severity admit in each of three positions × {`;`, `&&`, `||`, `|`, `&`} → DENY under high-severity; routine-only 2/3-chain → ALLOW under high-severity, DENY under `all`; the GAP-B self-set floor holds behind a path-form modifier.

## RED → GREEN proof artifacts (D-12, vs the committed .js)

- `25-06-RED-baseline.txt` — captured FIRST, before any edit: the PRE-FIX committed `admission-guard.js` (blob `1b822df14daba4cd85d19a1231fe34be283b2633`, HEAD `d4a90e2` = same content as `a43c962`, the plan commits were docs-only) ALLOWs every round-3 class (16 bypass rows live).
- `25-06-GREEN-proof.txt` — captured after each fix: the POST-FIX committed `.js` DENIES/GATES every class naming the note; the routine-only multi-admit / inert heredoc-quoted-comment / no-admit-shape `$()`/backtick / zero-config absent lean / approved-stamp controls all ALLOW; the round-2 GAP-A/B/C/D closures still DENY.

## Verification commands run (author suite — necessary, not sufficient)

- `npm run build && npm run freshness` → 0 drift.
- `npx vitest run hooks/admission-guard.test.ts` → **120 passed** (63 `it` cases ≥ guard.test.ts's 27; Class A/B/E/F added).
- `npx vitest run scripts/floor-invariance.test.ts` → **156 passed**.
- `npx vitest run scripts/check-foundation-guards.test.ts` → **28 passed** (WR-01 no false-positive on the resolver edits / new artifacts).
- `npx vitest run --exclude '**/scripts/e2e/**'` → **792 passed | 1 skipped**, 0 failures (full non-e2e regression; bare `npm test` deliberately NOT run — it triggers the live claude-CLI e2e lane).

## Deviations from Plan

**None affecting behavior.** Two in-plan decisions exercised (both explicitly offered by the plan):
1. **Class B implementation site** — detected the substitution command word in the TOKENIZER (synthetic `DYNAMIC_COMMAND_WORD` token) rather than the resolver; the plan's `<action>` invited this choice ("Decide whether the cleanest implementation tracks command-word-position substitutions in the tokenizer or detects them in the per-segment resolver; state the choice"). Rationale: keeps the resolver a uniform leading-run walk; the existing fail-closed branch handles the synthetic token.
2. **Class F via option (b)** — consulted `parsed.duplicateKeys`/`parsed.malformedLines` for `by` directly rather than calling `validate()` (option a). Rationale (stated in the plan's option-(b) clause): the hook's note re-read only needs `by`; `validate()`'s full required-field set would over-reach. `scripts/context-io.ts` is byte-unchanged.

**Added beyond the literal enumerated red-team forms (Rule 2 — anti-whack-a-mole discipline):** an `env -i`/`env -S` modifier-flag skip and a `path-modifier + substitution` compound in the fuzz, to test the resolver as ONE authority rather than an anchor list.

## Preserved (no regression)

SC2 (audit_retention 3-surface lockstep), the GOV-02 audit ledger, and the round-2 LOGIC closures GAP-B (self-set behind a wrapper) / GAP-C (non-string/corrupt/absent dial canonicalization, context-io.ts untouched) / GAP-D (case-insensitive HIGH_SEVERITY_ROLES) are all unchanged and stay green in their sweeps. The four named floor invariants (refuse-self / no-fabrication / `quality.test_integrity` no `off` / `hooks/guard.ts` byte-frozen) hold.

## Checkpoint 25-06-04 — BLOCKING, awaiting independent red-team

Per D-12 and [[grugops-safety-invariant-green-suite-insufficient]] (the 8th green-suite-insufficient catch of v2.0), the author's 120+156 green cases are NECESSARY-BUT-NOT-SUFFICIENT. SC1 closure REQUIRES an INDEPENDENT both-angle (LOGIC + INPUT-SURFACE, the P23 split) opus-grade red-team to reproduce (a)–(d) vs the committed `admission-guard.js` (blob `a65a93c5…`) — inventing an un-enumerated obfuscation shape per angle — before the floor is considered proven. That red-team is the orchestrator's to dispatch; the executor HARD-STOPPED here without self-approving.

## Self-Check: PASSED

- `25-06-RED-baseline.txt`, `25-06-GREEN-proof.txt` exist.
- `25-06-SUMMARY.md` exists (this file).
- Commits `4ba29f2`, `8d5b263`, `2f99cde` exist on `main`.
