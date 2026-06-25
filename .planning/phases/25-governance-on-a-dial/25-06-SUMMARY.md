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
status: gaps_found
checkpoint_25_06_04: failed — independent both-angle opus red-team reproduced a NEW command-RESOLUTION bypass class vs the committed .js (round 4 / 8th green-suite-insufficient catch); see "Independent Both-Angle Red-Team" below
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

## Self-Check: PASSED (author tasks 01–03)

- `25-06-RED-baseline.txt`, `25-06-GREEN-proof.txt` exist.
- `25-06-SUMMARY.md` exists (this file).
- Commits `4ba29f2`, `8d5b263`, `2f99cde` exist on `main`.

---

## Independent Both-Angle Red-Team (Task 25-06-04, orchestrator-run) — checkpoint does NOT pass: GAPS_FOUND

Per D-12 and [[grugops-safety-invariant-green-suite-insufficient]], the author's green suite (304 governance / 792 non-e2e) is necessary-but-not-sufficient. The orchestrator spot-checked (commits real, `guard.ts` byte-frozen `3501810e…`, `scripts/context-io.ts` UNCHANGED, freshness 0, second walk deleted grep=0, suites independently re-run green) then dispatched **TWO independent opus red-teams** (the P23 LOGIC + INPUT-SURFACE split) against the **COMMITTED `admission-guard.js` (blob `a65a93c5…`)**, plus its own child-spawn probe. **Both angles + the orchestrator probe independently converged on GAPS_FOUND** — a NEW command-RESOLUTION bypass class the round-3 fix introduced. This is **round 4 / the 8th green-suite-insufficient catch of v2.0**, exactly as this plan's prohibition #1 anticipated. The checkpoint HARD-STOP held: the executor did not self-approve; the independent adversary caught the gap.

### CONFIRMED CLOSED by both angles (round 4 need NOT re-touch — the UNIFY landed)
- **Class A** path-form launcher (`/usr/bin/nice node`, `/usr/local/bin/node`, `env -S node`), `command node`, `nodejs`, split-quote `no"de"`, brace-group `{ node …; }` → all DENY.
- **Class B** `$(echo node) …admit`, `` `echo node` …admit `` → GATE (fail-closed); a `$()`/backtick/eval with NO admit shape → ALLOW.
- **Class E** routine-then-high / high-then-routine across `;`/`&&`/`||`/`|`/`&`/newline/subshell, high shielded behind two routines, high interleaved with non-admit commands → DENY; routine-only multi-admit ALLOWs; `all`-dial any multi-admit DENIES. (Reopened ONLY via the new wrapper hole below — the per-segment classifier itself is sound.)
- **Class F** duplicate `by`, indented/tab ` by:`, `by : value` spaced colon, CRLF frontmatter, trailing-whitespace/case-variant value, two fences — a **108-shape hook-vs-`validate()` divergence fuzz found ZERO divergence**; no under-gate of a valid high finding.
- **GAP-B/C/D + floor:** self-set-behind-a-wrapper DENIES (incl. behind `timeout 5`/`nice -n 5` — the broader `commandHasLiveAdmitShape` shape-scan is resolution-independent, so the bypass does NOT reopen the D-01 floor); every typo/garbage/non-string/corrupt/case/whitespace dial gates; absent stays lean. The over-block direction is CLEAN (zero false-positives across both angles).

### THE NEW LIVE CLASS — leading-run command-modifier-operand resolution (SC1 still forgeable)
`liveAdmitSegments` (admission-guard.ts:566-574 / .js:556-566) resolves `<modifier> [-flags] <launcher>` but not the rest of the shell's prefix grammar, and **silently DROPS a segment whose command word doesn't resolve to a launcher (default ALLOW)**. One disease, three sub-roots, 17+ reproduced live forms (gated high-severity admit with a forged `human:eve`, zero real human, through the un-forgeable PRIMARY tier on Claude Code):

| Sub-root | Example (dial=high-severity unless noted) | Actual | Root |
|---|---|---|---|
| **2 — modifier OPERAND not consumed** | `timeout 5 node …admit <hi>` (flagless textbook form), `nice -n 5 node …`, `exec -a foo node …`, `xargs -I {} node …`, `env -C /tmp node …`, `env -u PATH node …`, `timeout -k 1 5 node …`, `/usr/bin/timeout 5 node …`, `nice '-n' '5' node …` | **ALLOW** | the `isModifierFlag` skip (ts:571) consumes a `-flag` but not its separate-word VALUE (`5`/`foo`/`{}`/`/tmp`), nor a bare modifier operand (`timeout`'s duration); the loop breaks at the operand and reads IT as the command word |
| **1 — wrapper not in `COMMAND_MODIFIERS`** | `sudo node …`, `doas node …`, `setsid node …`, `ionice -c2 node …`, `chrt -f 1 node …`, `taskset 0x1 node …` | **ALLOW** | closed enumeration (ts:110-120); an unlisted launcher-runner resolves to itself, not in `LAUNCHERS` → segment dropped |
| **3 — leading redirection** | `>/dev/null node …`, `2>/dev/null node …`, `2>&1 node …` | **ALLOW** | `liveTokens` has no redirection grammar; the operator/target tokenizes as the segment's command word |

**Compounding:** at dial **`all`** even a routine admit slips (`timeout 5 node …admit <routine>`) — the strictest dial's floor leaks; and **Class E is REOPENED** — `node …admit <routine> ; timeout 5 node …admit <hi>` ALLOWs because the wrapper hides the shielded high segment. `timeout 5 node …admit` (no flags) is the most dangerous: the textbook way to run `timeout`, trivially reachable.

### Structural root fix for round 4 (both angles independently converged — anti-whack-a-mole)
Do NOT widen `COMMAND_MODIFIERS` or enumerate operand grammars (`-n`/`-a`/`-I`/bare-duration) one notch at a time — the trap. **INVERT the default exactly as Class B already does for a dynamic command word:** when a segment carries the live admit SHAPE (`segmentHasAdmitShape` — a context-io reference + the `admit` verb) but the leading-run resolution does NOT terminate at a recognized launcher, treat the command word as UNRESOLVABLE and **GATE (fail-closed)** instead of silently dropping the segment. Because the admit shape is the trigger, a new wrapper / option-operand / redirection spelling cannot escape; the over-block direction is proven safe (a non-admit wrapper — `timeout 5 node render`, `sudo ls` — has no admit shape, stays ALLOW). The P22 round-8 "make the boundary BE the parser, fail closed on the unresolvable tail" lesson, applied to modifier-operand consumption — the same UNIFY discipline this plan used for Classes A/B/E, completed for the leading run.

### Preserved + invariants at the stop
`guard.ts` byte-frozen (`3501810e…`), `scripts/context-io.ts` UNCHANGED (GAP-C/GAP-D + GOV-02 ledger intact), `admission-guard.js` blob `a65a93c5…` (red-team edited nothing), freshness 0, second walk deleted, SC2 verified, the four named floor invariants hold, WR-01 no false-positive. Only SC1's command-RESOLUTION surface remains open. **Route:** `/gsd-plan-phase 25 --gaps` (round 4).
