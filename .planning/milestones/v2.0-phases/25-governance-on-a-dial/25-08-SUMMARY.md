---
phase: 25-governance-on-a-dial
plan: 08
subsystem: testing
tags: [admission-guard, GOV-01, governance, hook, allowlist, structural-detection, bash-fuzz, D-12]

requires:
  - phase: 25-07
    provides: the round-4 leading-run command-RESOLUTION invert + the ONE liveAdmitSegments authority
  - phase: 25-01
    provides: the shared readGovernanceConfig + the human_admission dial
provides:
  - STRUCTURAL admit-SHAPE detection via an ALLOWLIST tokenIsFinalLiteral (replaces the literal substring test)
  - SCRIPT-anchored RULE 1 (position-free literal context-io) / RULE 2 (direct-runner pin vs forwarding-runner any-unresolvable)
  - JS_RUNNERS {bun,bunx,deno,ts-node} + STDIN_ARGV_FEEDERS {xargs} capability sets
  - commandHasLiveAdmitShape derived from the one authority (D-01 floor holds behind a rewrite)
  - a BASH-GROUNDED anti-whack-a-mole property fuzz (oracle independent of the detector)
affects: [25-governance-on-a-dial, GOV-01, admission-guard]

tech-stack:
  added: []
  patterns:
    - "Prove-final-literal via an ALLOWLIST of inert characters, never a denylist of dangerous ones"
    - "A safety oracle GROUNDED IN ACTUAL BASH BEHAVIOR, not in the detector under test (anti-circularity)"

key-files:
  created:
    - .planning/phases/25-governance-on-a-dial/25-08-RED-baseline.txt
    - .planning/phases/25-governance-on-a-dial/25-08-GREEN-proof.txt
  modified:
    - hooks/admission-guard.ts
    - hooks/admission-guard.js
    - hooks/admission-guard.test.ts
    - scripts/floor-invariance.test.ts

key-decisions:
  - "Detection is an ALLOWLIST ^[A-Za-z0-9/._:=,-]$ of provably-inert chars + raw free of $/backtick — catches extglob/any future metachar without enumeration"
  - "JS_RUNNERS is a NEW SEPARATE JS-execution-capability set, NOT a widening of COMMAND_MODIFIERS or LAUNCHERS"
  - "scripts/context-io.ts kept byte-frozen — the un-forgeable hook tier re-closes the dial-all rewrite; the self-settable in-script tier adds no un-forgeable defense"
  - "The fuzz oracle SPAWNS bash (printf + a controlled-temp-dir glob/extglob probe), independent of tokenIsFinalLiteral — fixing the rev-1 self-referential circularity"
  - "SC1 closure is SCOPED to command-string shape-hiding and is NOT declared until the independent both-angle red-team (Task 25-08-04) reproduces it — D-12 necessary-not-sufficient"

patterns-established:
  - "Allowlist prove-final-literal: a script/verb token outside the inert set is UNRESOLVABLE → fail closed"
  - "Bash-grounded fuzz: the oracle is what bash actually does, so a gap inside the predicate fails the suite"

requirements-completed: [GOV-02]
# GOV-01 NOT complete — SC1 round-5 closure FAILED: the orchestrator-dispatched independent red-team reproduced a real bash-grounded in-scope bypass (extglob-fragmentation via self-enabled extglob). See "Independent Both-Angle Red-Team" section below. Routes to round 6.

coverage:
  - id: D1
    description: "Structural admit-SHAPE detector closes the round-5 shell-rewrite bypasses (glob/arg-cmd-sub/param/xargs/extglob/brace/quote-removal/process-sub/JS-runner/shebang/wrapped compounds) vs the committed admission-guard.js"
    requirement: GOV-01
    verification:
      - kind: unit
        ref: "hooks/admission-guard.test.ts#26-29 (25-08 round-5)"
        status: pass
      - kind: unit
        ref: "scripts/floor-invariance.test.ts#SC1 anti-whack-a-mole (25-08) BASH-GROUNDED"
        status: pass
    human_judgment: true
    rationale: "SC1 closure for a mechanically-un-forgeable SAFETY guard requires the INDEPENDENT both-angle opus red-team at Task 25-08-04 (D-12, [[grugops-safety-invariant-green-suite-insufficient]]) — a green author suite is necessary-but-not-sufficient. The red-team has NOT yet run; this deliverable must route to the human/orchestrator."
  - id: D2
    description: "Bounded over-block + disclosed residuals (forwarding-runner over-block GATES under active gov / ALLOWs under off; qjs unknown-runtime, name-resolution forge, and the extglob+dynamic-command-word/quoted-body residual ALLOW explicitly)"
    requirement: GOV-01
    verification:
      - kind: unit
        ref: "hooks/admission-guard.test.ts#27-29 (forwarding over-block / name residual / extglob residual)"
        status: pass
    human_judgment: true
    rationale: "The disclosed residuals (T-25-40 unknown-runtime, T-25-41 name-resolution, and the round-5 extglob-fragmentation residual) are accepted gaps that the independent red-team must confirm behave EXACTLY as stated and that SC1 is not overstated."
  - id: D3
    description: "Preserved invariants: round-1..4 closures, the four floor invariants, single authority, COMMAND_MODIFIERS/LAUNCHERS unwidened, liveTokens byte-identical, guard.ts + context-io.ts byte-frozen, freshness 0"
    requirement: GOV-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (919 passed | 1 skipped)"
        status: pass
      - kind: other
        ref: "npm run freshness (0 drift); git diff --quiet hooks/guard.ts && git diff --quiet scripts/context-io.ts (exit 0)"
        status: pass
    human_judgment: false

duration: 75min
completed: 2026-06-26
status: gaps_found
---

# Phase 25 Plan 08: Structural admit-SHAPE Detector (round-5 gap closure) Summary

**The GOV-01 admission guard's command-string detection is now STRUCTURAL — an ALLOWLIST `tokenIsFinalLiteral` + a SCRIPT-anchored RULE 1/RULE 2 disposition + JS_RUNNERS, applied to ANY command word — so shell expansion / quoting / extglob / runner indirection of a context-io reference fails CLOSED instead of walking through the literal substring test. SC1 closure is NOT yet declared: the blocking independent red-team (Task 25-08-04) is pending.**

## Performance

- **Duration:** ~75 min
- **Started:** 2026-06-26T14:13:05Z
- **Tasks:** 3 of 4 (Task 25-08-04 is the blocking checkpoint — PENDING)
- **Files modified:** 4 (+2 proof artifacts created)

## Accomplishments

- **Structural detector (Task 25-08-01):** `tokenIsFinalLiteral(tokens, j, cmd)` is a positive ALLOWLIST `^[A-Za-z0-9/._:=,-]*$` on the de-quoted value + a raw slice free of `$`/backtick + not the dynamic sentinel. Anything else is UNRESOLVABLE → fail closed, structurally catching extglob `@(`, glob, brace, tilde, param, command/process substitution, and any future metachar without enumeration. `segmentAdmitDisposition` is SCRIPT-anchored: RULE 1 (position-free — finds a literal context-io anywhere, closing the npx-value-flag regression → classify the verb), RULE 2 (DIRECT runner pins the script after a value-flag-arity skip; FORWARDING runner {npx} ∪ JS_RUNNERS gates any unresolvable token), a buried-launcher scan for wrapped rewrites, and an unrecognized-command concrete-anchor scan (shebang).
- **Capability sets:** `JS_RUNNERS = {bun,bunx,deno,ts-node}` (a distinct JS-execution-capability set — NOT a COMMAND_MODIFIERS/LAUNCHERS widening) closes `bun $S $V` while `cp $A $B` allows; `STDIN_ARGV_FEEDERS = {xargs}` closes the stdin-fed admit.
- **D-01 floor:** `commandHasLiveAdmitShape` now derives from the one `liveAdmitSegments` authority, so a glob self-set DENIES.
- **Child-spawn oracle (Task 25-08-02):** 107 `it()` cases (≥ guard.test.ts 27) vs the committed `.js` — every round-5 form DENIES; the forwarding-runner over-block GATES under active governance / ALLOWs under `off`; the disclosed residuals ALLOW explicitly.
- **Bash-grounded fuzz (Task 25-08-03):** `bashRewrites(token)` SPAWNS bash (printf + a controlled-temp-dir glob/extglob probe), independent of the detector — fixing the rev-1 self-referential circularity. A bash-rewritten script/verb token forces the committed `.js` to gate; mutation note: allowlisting `(`/`@` would fail the extglob assertions.
- **RED→GREEN proof** captured vs the committed `.js` (blob `756ce508` pre-fix → fresh tsc build post-fix).

## Task Commits

1. **Task 25-08-01: structural detector + RED baseline** — `00a76e1` (feat)
2. **Task 25-08-02: exhaustive oracle + GREEN proof** — `19dd88e` (test)
3. **Task 25-08-03: bash-grounded fuzz** — `8585b92` (test)
4. **Rule-1 deviation: dynamic-command-word + eval-body structural closure** — `e6556c5` (fix)

## Files Created/Modified

- `hooks/admission-guard.ts` / `hooks/admission-guard.js` — the structural detector (kept in lockstep; freshness 0)
- `hooks/admission-guard.test.ts` — round-5 child-spawn oracle (107 cases)
- `scripts/floor-invariance.test.ts` — the bash-grounded property fuzz
- `.planning/.../25-08-RED-baseline.txt` / `25-08-GREEN-proof.txt` — the both-direction proof

## Decisions Made

- Allowlist over denylist (the rev-1 denylist missed extglob — an enumeration trap inverted).
- `scripts/context-io.ts` byte-frozen — the hook tier re-closes the dial-`all` rewrite; the in-script tier is self-settable and adds no un-forgeable defense (preserves GAP-C/GAP-D + the GOV-02 ledger).
- The note positional is read via `noteFileInSegment` and the disk-read fail-closed handles a rewritten note path (a glob note path → ENOENT → deny); RULE 1 additionally gates a non-final-literal note positional as unresolvable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Structural detection behind a DYNAMIC command word + eval body**
- **Found during:** Task 25-08-03 → an executor adversarial self-probe (post-task) inventing un-enumerated compound forms.
- **Issue:** The preserved Class B branch (`$(echo node)` / backtick command word) and the dynamic-eval branch (`sh -c`/`eval`/`$X`) still used the LITERAL `segmentHasAdmitShape`, so a GLOB/param/cmd-sub-obfuscated script behind them (`$(echo node) scripts/context-i*.js admit`, `$X scripts/context-i*.js admit`, `sh -c "node scripts/context-i*.js admit"`) ALLOWed — a structural-on-ANY-command-word gap (BLOCKER-2).
- **Fix:** Added `segmentHasStructuralAdmitShape` (the concrete-anchor predicate) to the Class B and dynamic-eval branches; added `rawBodyHasStructuralAdmitShape` (re-tokenizes the de-quoted eval body with the ONE tokenizer) for an admit hidden in an executed quoted body.
- **Files modified:** hooks/admission-guard.ts, hooks/admission-guard.js, hooks/admission-guard.test.ts (§29), 25-08-GREEN-proof.txt (addendum)
- **Verification:** the cleanest forms now DENY (self-probe 0 unexpected); the main RED harness stayed 0-mismatch (no regression); 236 author cases green; freshness 0.
- **Committed in:** `e6556c5`

**Total deviations:** 1 auto-fixed (Rule 1 — extends the structural detector to dynamic command words; no scope creep, satisfies the plan's own BLOCKER-2 must_have).

## Known Residuals / Threat Flags

The bounded over-block and TWO disclosed residuals from the plan HOLD as stated, plus ONE NEW residual the executor self-probe surfaced (disclosed, not silent):

| Residual | Behavior | Status |
|---|---|---|
| **Forwarding-runner over-block** (T-25-40) | `npx vitest run $FILE` / `bun app.js $ARG` / `deno run server.ts $PORT` / `ts-node $SCRIPT` GATE under active governance, ALLOW under `off` | Accepted, opt-in, avoidable; asserted as an intended GATED control |
| **Unknown-runtime forge** (T-25-40) | `qjs $S $V` / `llrt $S $V` (runner not in LAUNCHERS ∪ JS_RUNNERS, both positions dynamic, no literal anchor) ALLOWs | Accepted, disclosed |
| **Name-resolution forge** (T-25-41) | `node /tmp/<renamed-context-io>.js admit` ALLOWs | PRE-EXISTING substring-anchor limit, out of hook-tier scope, NOT a round-5 regression |
| **extglob-fragmentation (NEW) — ❌ CONFIRMED REAL BYPASS by the red-team** | An EXTGLOB `@( …` script combined with a DYNAMIC command-substitution command word (`$(echo node) scripts/context-i@(o).js admit`) OR a quoted eval body (`bash -c "… context-i@(o).js admit"`) ALLOWs | **NO LONGER a benign residual.** The orchestrator-dispatched independent red-team BASH-GROUNDED this as a real high-severity admission that the guard ALLOWs, and DEFEATED the "extglob must be pre-enabled" mitigation: a single Bash-tool call self-enables extglob via a NEWLINE (`shopt -s extglob⏎$(echo node) scripts/context-i@(o).js admit …` → ledger line appended). This is IN SCOPE for SC1 (command-string shape-hiding) → **gaps_found, round 6.** ROOT unchanged: the byte-frozen liveTokens `(`-segmentation fragments the script token before the allowlist can flag `@(`. |

SC1 is deliberately SCOPED to command-string shape-hiding and is NOT claimed as full un-forgeability (no-fabrication / CLAUDE.md).

## Issues Encountered

- One floor-invariance fuzz assertion was initially wrong (asserted a routine-via-glob chain ALLOWs) — corrected: a glob-rewritten admit is unresolvable, so it fail-closed gates under any active dial even for a routine note (the correct bounded over-block). The assertion now uses a LITERAL routine chain for the no-over-block control.

## Verification Status (author gates — NECESSARY but NOT SUFFICIENT, D-12)

- `npm run build && npm run freshness` → 0 drift (committed `.js` is a fresh tsc build)
- `git diff --quiet hooks/guard.ts` exit 0 (blob `3501810e…`); `git diff --quiet scripts/context-io.ts` exit 0
- `npx vitest run hooks/admission-guard.test.ts` → 236 passed (107 `it()` cases ≥ 27)
- `npx vitest run scripts/floor-invariance.test.ts` → 176 passed (bash-grounded fuzz)
- `npx vitest run --exclude '**/scripts/e2e/**'` → 919 passed | 1 skipped (full non-e2e regression)
- `function tokenize` / `noteFileFromCommand` grep = 0; `COMMAND_MODIFIERS` / `LAUNCHERS` membership unchanged; `JS_RUNNERS` a distinct set; `tokenIsFinalLiteral` an allowlist; `liveTokens` byte-identical (cmp)

## Independent Both-Angle Red-Team (Task 25-08-04 — orchestrator-dispatched) — VERDICT: GAPS_FOUND

Per D-12 / [[grugops-safety-invariant-green-suite-insufficient]], the authoring executor HARD-STOPPED without self-approving, and the orchestrator dispatched an INDEPENDENT opus-grade both-angle red-team against the COMMITTED `hooks/admission-guard.js` (never the `.ts`, never the author suites). It built its own stdin driver + a BASH-GROUNDED oracle (a candidate counts as a forge only if bash actually appends to `.grugops/audit/admissions.jsonl` AND the guard ALLOWs). Verdict: **GAPS_FOUND.**

**The round-5 STRUCTURAL fix is genuinely effective for its enumerated target** — every glob / param / command-substitution / brace / word-split / xargs / eval / `sh -c` / **recognized-launcher**-extglob shape-hiding form fails CLOSED (DENY), dials gate correctly, routine admits are not over-blocked, freshness 0. But the artifact is a STATIC analyzer of the pre-expansion command string, and the red-team reproduced two real, bash-grounded admit-forges that ALLOW a high-severity admission under active governance:

1. **❌ extglob-fragmentation — REAL, IN-SCOPE SC1 BYPASS (decisive gap → round 6).** Minimal repro (bash-grounded; ledger line + `note admitted`):
   ```
   stdin command:  shopt -s extglob\n$(echo node) scripts/context-i@(o).js admit mytask hi.md <ctx> <repo>
   config:         human_admission = "all" (or "high-severity"); GRUGOPS_ADMISSION_APPROVED_BY unset
   guard verdict:  exit 0, no output = ALLOW
   bash reality:   $(echo node)→node; @(o)→o under extglob ⇒ runs node scripts/context-io.js admit … ⇒ REAL high-sev admit
   ```
   The red-team **broke the executor's "extglob must be externally pre-enabled" mitigation**: a single Bash-tool call self-enables extglob via a **newline** (`shopt -s extglob⏎…`) — the `;`-separated form is a bash parse-error, but the newline form executes `shopt` then parses line 2 with extglob live. So this is reachable with NO environmental precondition. `bash -c $'shopt -s extglob⏎node scripts/context-i@(o).js admit …'` also ALLOWs+admits. Root cause: the byte-frozen `liveTokens` tokenizer treats `(` as a hard segment separator (`admission-guard.js:426`), fragmenting `context-i@(o).js` before the allowlist can flag `@(`. This is command-string shape-hiding → squarely in SC1's scope → **the round-5 closure claim does not hold.**

2. **❌ renamed / hardlinked copy — REAL admit, but the DISCLOSED out-of-scope substring-anchor limit (T-25-41).** `cp scripts/context-io.js scripts/ctx2.mjs && node scripts/ctx2.mjs admit mytask hi.md …` → ALLOW + real admit (hardlink identical; `.js`/`.mjs` both work). Real and reachable, but matches its disclosure exactly: a name-resolution under-block (the detector anchors on the literal substring `context-io`, `ADMIT_SCRIPT` at `:80`), out of the string-matcher's scope, NOT a round-5 regression.

**The executor's other disclosures were confirmed ACCURATE:**
- **(ii) `qjs $S $V` — BENIGN** (correctly under-blocks): qjs is absent and `context-io.js` imports `node:crypto`/`node:fs`/`node:path`/`node:url` + `import.meta.dirname` — none exist in QuickJS, so it throws before any admission. No admission effect possible.
- **(i) forwarding-runner over-block — bounded/active-only** as disclosed (`npx vitest run $FILE` GATEs under active gov / ALLOWs under `off`; direct `node build.js $HOME/out` not over-blocked).
- **Incidental defense worth keeping:** `context-io.js`'s `isMain` check (`import.meta.url === pathToFileURL(argv[1])`) defeats symlink and `/dev/stdin` vectors (Node realpaths the main entry) — these would otherwise have been additional bypasses.

**Fix direction for round 6 (both the red-team and the executor's own disclosure converge):** a static tokenizer cannot be complete against bash (extglob `(`-fragmentation, rename, hardlink). Either **move the gate past the shell** — anchor on the actual `context-io.js admit` process / the verified-context write at the point of EFFECT, where argv is already expanded and the real script identity is known (the Phase-22 terminal lesson: make the boundary BE the parser) — **or** narrow SC1's stated guarantee to explicitly exclude self-enabled-extglob and document rename/hardlink as known filesystem-identity limits. The decision is the human's (see orchestrator hand-off).

**SC1 round-5 closure is NOT declared. Phase 25 NOT complete; ROADMAP NOT flipped; GOV-01 NOT marked complete (GOV-02 + the audit ledger remain SATISFIED and untouched).** Next: `/gsd-plan-phase 25 --gaps` for round-6 closure.

---
*Phase: 25-governance-on-a-dial*
*Plan: 08 — implementation complete (tasks 01-03 + 1 Rule-1 deviation); independent red-team (Task 25-08-04) RAN → GAPS_FOUND (extglob-fragmentation in-scope bypass); routes to round 6*

## Self-Check: PASSED

- Files: 25-08-SUMMARY.md, 25-08-RED-baseline.txt, 25-08-GREEN-proof.txt, hooks/admission-guard.ts, hooks/admission-guard.js, scripts/floor-invariance.test.ts — all FOUND.
- Commits: 00a76e1, 19dd88e, 8585b92, e6556c5 — all FOUND.
