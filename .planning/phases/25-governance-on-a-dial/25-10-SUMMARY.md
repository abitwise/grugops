---
phase: 25-governance-on-a-dial
plan: 10
subsystem: governance
tags: [gov-01, gov-02, admission, pretooluse-hook, structured-channel, mcp, single-source, sc3, d-01, d-07, node22]

# Dependency graph
requires:
  - phase: 25-governance-on-a-dial (plan 25-09)
    provides: "context-io.isGatedNote (single-source full gated predicate, W-A), context-io.isHighSeverityRole (Unicode-robust classifier), readGovernanceConfigResult (discriminated absent/ok/unreadable read, SC3), the mcp__grugops__propose_note structured admission channel"
provides:
  - "hooks/admission-guard retargeted to a PER-CALL structured PreToolUse gate on the mcp__grugops__.* family — the un-forgeable GOV-01 gate on the structured channel (D-01)"
  - "the entire command-string (liveTokens) parser DELETED — the ten-round shell-obfuscation bypass family is gone by construction"
  - "the per-call env+stamp grant (D-07): a gated finding is admitted only when the FRESH session env GRUGOPS_ADMISSION_APPROVED_BY=<name> is present AND tool_input.verified_by === human:<name>"
  - "the both-direction RED->GREEN proof vs the committed .js + the SC3/W1/W3 structured-channel sweep"
affects: [25-11 (independent opus-grade red-team + SC1 restatement — the closure gate, D-12)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Move-the-gate-to-point-of-effect (D-01): the un-forgeable tier reads the FINAL structured tool_input, not a pre-expansion shell string — the obfuscation surface is eliminated by construction, not by recognizing more spellings"
    - "Single-source safety predicate consumed at the gate (W-A): the hook IMPORTS isGatedNote and reconstructs neither the gated composition nor the severity classifier — the gate tier and the persist tier cannot diverge"
    - "Per-call un-forgeable disposition (D-07): a fresh-per-call hook process reads the CURRENT human-set session env and binds the agent-supplied stamp to it per note"
    - "Tool-FAMILY matcher (W3): the PreToolUse matcher is mcp__grugops__.*, so a second/renamed admission tool cannot silently escape the gate"

key-files:
  created:
    - .planning/phases/25-governance-on-a-dial/25-10-RED-baseline.txt
    - .planning/phases/25-governance-on-a-dial/25-10-GREEN-proof.txt
  modified:
    - hooks/admission-guard.ts (+ rebuilt committed hooks/admission-guard.js) — full rewrite to the structured gate; command-string parser deleted
    - hooks/hooks.json — admission matcher swapped Bash -> mcp__grugops__.* (the prod-deploy Bash matcher untouched)
    - hooks/admission-guard.test.ts — structured tool_input fixtures; both-direction proof + per-call stamp-binding + SC3 + W1 + W3
    - scripts/floor-invariance.test.ts — admit()-tier floor invariants preserved; command-string hook sweeps replaced with the structured-channel SC3/per-call/W1/W3 sweep

key-decisions:
  - "Fail-closed posture on the structured channel: a malformed/absent tool_input, an unclassifiable finding (missing kind or by) under an ACTIVE dial, and a corrupt config all DENY; off/absent stays lean (SC2/SC3)"
  - "The hook keys on the NOTE FIELDS, not the exact tool name — so a renamed mcp__grugops__* admission tool delivering the same structured fields is gated identically (W3 is enforced by the hooks.json family matcher, not a hard-coded name in the hook)"
  - "dialIsActive is probed via the imported isGatedNote('security-nfr','finding',config) rather than a local dial composition, so the unclassifiable-note fail-closed decision still routes through the single source (W-A)"
  - "The parseNote import + the on-disk note re-read are GONE — the provenance fields arrive as structured tool arguments"

patterns-established:
  - "Pattern: an un-forgeable PreToolUse gate that reads structured tool_input and imports the single-source gated predicate"
  - "Pattern: per-call env-bound stamp validation (verified_by === human:${fresh-env-name})"

requirements-completed: [GOV-01, GOV-02]

coverage:
  - id: D1
    description: "Per-call structured gate: a gated finding DENIES without the matching fresh env+stamp; ALLOWs with env=alice + verified_by=human:alice; DENIES on mismatch (human:bob) / no stamp / self-stamp-without-env"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "hooks/admission-guard.test.ts#per-call structured gate (planted/positive/mismatch)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Command-string parser DELETED: grep liveTokens/liveAdmitSegments/tokenIsFinalLiteral/segmentAdmitDisposition = 0 in admission-guard.ts AND .js; the hook reads structured tool_input only"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "grep-assert in the task 25-10-01 verify line + the freshness rebuild"
        status: pass
    human_judgment: false
  - id: D3
    description: "Single source (W-A): the hook IMPORTS isGatedNote and reconstructs neither the gated composition nor the severity classifier locally (no local HIGH_SEVERITY_ROLES / NFKC / dial composition)"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "grep-assert (HIGH_SEVERITY_ROLES/NFKC/parser-name = 0) + W1 sweep proving the imported classifier folds near-miss code points"
        status: pass
    human_judgment: false
  - id: D4
    description: "SC3 carried to the structured channel: exactly 'off' is off-equivalent; every other dial value incl garbage/non-string is gate-or-stricter; corrupt config fail-closed; absent config lean"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "scripts/floor-invariance.test.ts#SC3 HOOK-tier (25-10, structured channel) + hooks/admission-guard.test.ts#SC3"
        status: pass
    human_judgment: false
  - id: D5
    description: "W1 non-vacuous: a high-severity by with literal U+00A0 / U+200B / NFKC-compatibility / case variant classifies high-severity and DENIES without env (a bare trim/lowercase would let it through)"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "scripts/floor-invariance.test.ts#W1 NON-VACUOUS + hooks/admission-guard.test.ts#W1"
        status: pass
    human_judgment: false
  - id: D6
    description: "W3 matcher breadth: hooks.json admission matcher == mcp__grugops__.* (the family); a renamed mcp__grugops__* admission tool is still gated; the prod-deploy Bash matcher is unchanged"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "scripts/floor-invariance.test.ts#W3 matcher breadth"
        status: pass
    human_judgment: false
  - id: D7
    description: "Both-direction proof vs the committed .js: the planted high-severity-without-env admit flips ALLOW (pre-retarget) -> DENY (retargeted); positive + mismatch hold on GREEN"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "25-10-RED-baseline.txt + 25-10-GREEN-proof.txt + hooks/admission-guard.test.ts planted/positive/mismatch"
        status: pass
    human_judgment: false
  - id: D8
    description: "byte-freeze + freshness: hooks/guard.ts and scripts/context-io.ts unchanged (git diff --quiet exit 0); committed .js rebuilt; node scripts/freshness.js exit 0"
    requirement: "GOV-01"
    verification:
      - kind: unit
        ref: "git diff --quiet hooks/guard.ts && git diff --quiet scripts/context-io.ts && node scripts/freshness.js"
        status: pass
    human_judgment: false

# Metrics
duration: 13min
completed: 2026-06-26
status: complete
---

# Phase 25 Plan 10: Un-forgeable GOV-01 Gate on the Structured Channel Summary

**Retargeted hooks/admission-guard from a Bash command-string matcher to a PER-CALL structured PreToolUse gate on the mcp__grugops__.* family, DELETED the entire ten-round liveTokens command-string parser, and now decides admission from the FINAL structured tool_input plus the FRESH per-call session env — importing the single-source isGatedNote so the gate tier and the persist tier cannot diverge (W-A), with the SC3 floor carried forward and the whole shell-obfuscation bypass family gone by construction (D-01).**

## Performance
- **Duration:** ~13 min (execution; excludes context read)
- **Started:** 2026-06-26T18:27:54Z
- **Tasks:** 2 (one TDD — the both-direction RED->GREEN proof)
- **Files modified/created:** 6 (hook .ts/.js, hooks.json, 2 test .ts, 2 proof artifacts)

## Accomplishments
- Rewrote `hooks/admission-guard.ts` as a per-call structured gate: it reads the final `tool_input.{by,kind,verified_by,task}` the harness delivers for an `mcp__grugops__*` admission tool call, classifies via the IMPORTED `isGatedNote`, and for a GATED finding DENIES unless BOTH the fresh session env `GRUGOPS_ADMISSION_APPROVED_BY=<name>` is present AND `tool_input.verified_by === human:<name>` (D-07 per-call stamp-binding).
- DELETED the entire command-string parser (tokenizer, launcher resolution, allowlist, admit-shape detection, the SELF_APPROVE regex, the on-disk note re-read). The whole shell-expansion bypass family (glob / brace / param-and-command substitution / word-split / extglob `(`-fragmentation / launcher rename / xargs feed) is eliminated by construction — grep `liveTokens/liveAdmitSegments/tokenIsFinalLiteral/segmentAdmitDisposition` = 0 in both `.ts` and `.js`.
- Single source (W-A): the hook reconstructs NEITHER the gated composition NOR the severity classifier — no local `HIGH_SEVERITY_ROLES`, no NFKC/role logic, no dial composition; the only gated decision is the import. The W1 sweep proves the imported classifier folds the literal U+00A0 / U+200B / NFKC-compatibility / case variants to high-severity.
- Swapped ONLY the admission matcher in `hooks.json` from `Bash` to the `mcp__grugops__.*` FAMILY (W3); the prod-deploy guard's `Bash` matcher and `hooks/guard.ts` are byte-unchanged (D-02), and `scripts/context-io.ts` is byte-frozen this plan.
- Captured the both-direction proof vs the committed `.js`: the planted high-severity-without-env admit ALLOWed on the pre-retarget `.js` (blob `edd0699`, the Bash matcher never saw the MCP call) and DENIES on the retargeted `.js` (blob `7ccd00d`); the positive (env=alice + human:alice -> ALLOW) and the mismatch (env=alice + human:bob -> DENY) hold on GREEN.

## Task Commits
1. **Task 25-10-01: retarget the hook + delete the parser + swap the matcher** — `8ca8a18` (feat)
2. **Task 25-10-02: structured RED->GREEN proof + SC3/W1/W3 sweep (TDD)** — `687852a` (test)

**Plan metadata:** docs commit (this SUMMARY + STATE + ROADMAP + REQUIREMENTS).

## Files Created/Modified
- `hooks/admission-guard.ts` (+ rebuilt `hooks/admission-guard.js`) — full rewrite to the structured per-call gate; imports `isGatedNote` + `readGovernanceConfigResult`; command-string parser deleted.
- `hooks/hooks.json` — admission matcher `Bash` -> `mcp__grugops__.*`; prod-deploy `Bash` matcher untouched.
- `hooks/admission-guard.test.ts` — structured tool_input fixtures; planted/positive/mismatch, SC3 dial sweep, W1 non-vacuous, fail-closed-on-malformed, W3 renamed-tool breadth.
- `scripts/floor-invariance.test.ts` — admit()-tier floor invariants (1-4 + dials-only-tighten) PRESERVED; command-string hook sweeps replaced with the structured-channel SC3 / per-call stamp-binding / W1 / W3 sweep + hooks.json matcher assertion + guard.ts byte-freeze.
- `25-10-RED-baseline.txt` / `25-10-GREEN-proof.txt` — the both-direction proof artifacts.

## Decisions Made
- Fail-closed on the structured channel: a malformed/absent tool_input, an unclassifiable finding under an active dial, and a corrupt config all DENY; off/absent stays lean. The matcher guarantees every invocation is an admission attempt, so a malformed payload is never crash-allowed.
- The hook keys on the note fields, not the exact tool name; W3 breadth is enforced by the `mcp__grugops__.*` family matcher in hooks.json, and the hook gates a renamed tool identically.
- `dialIsActive` is probed via the imported `isGatedNote` (not a local dial composition) so even the unclassifiable-note fail-closed branch routes through the single source.

## Deviations from Plan
None - plan executed exactly as written. (The plan's `<read_first>` line about keeping a local `SELF_APPROVE` regex is superseded by the same plan's instruction to DELETE it with the parser; the refuse-self semantic is preserved on the structured channel as "the stamp alone never grants — env present AND matching stamp required.")

## Issues Encountered
- The hook suites have spawn-heavy fuzz cases that time out at vitest's default 5s on this hardware (a known test-infra quirk, pre-existing, logged in `deferred-items.md`). Run with `--testTimeout=30000`; the full non-e2e suite is then green (724 passed | 1 skipped).

## Next Phase Readiness
- Ready for **25-11**: the INDEPENDENT opus-grade red-team is the closure gate (D-12) — a GREEN suite is necessary but NOT sufficient. The red-team must adversarially reproduce the gate against the committed `.js` on the structured channel before GOV-01 is considered proven for v2.0.
- **Scope honesty:** this plan proves the per-call structured gate and the SC3/W1/W3 sweep on a GREEN suite; the irreducible same-uid direct-FS-write residual and the cross-script homoglyph `by` (D-06 residual, escape via `human_admission: all`) remain documented bounded limits for 25-11 to restate.

## Self-Check: PASSED
- All created/modified files exist on disk (admission-guard.ts/.js/.test.ts, hooks.json, floor-invariance.test.ts, RED/GREEN proof artifacts, this SUMMARY).
- Task commits exist in git history: `8ca8a18` (feat), `687852a` (test).
- grep `liveTokens/liveAdmitSegments/tokenIsFinalLiteral/segmentAdmitDisposition` = 0 in `.ts` and `.js`; `isGatedNote` imported; no local `HIGH_SEVERITY_ROLES`/NFKC.
- `node scripts/freshness.js` exit 0; `git diff --quiet hooks/guard.ts` and `git diff --quiet scripts/context-io.ts` exit 0; full non-e2e suite 724 passed | 1 skipped under `--testTimeout=30000`.

---
*Phase: 25-governance-on-a-dial*
*Completed: 2026-06-26*
