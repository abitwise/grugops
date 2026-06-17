---
phase: 21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl
verified: 2026-06-17T17:10:00Z
status: gaps_found
score: 3/4 must-haves verified
overrides_applied: 0
gaps:
  - truth: "A finding carrying verified_by: §14-gate#<id> (a real gate verdict), a passing test reference, or a named human is admitted; a finding with no such stamp is refused."
    status: partial
    reason: "The admission mechanism exists and works under LF line endings. However, CR-01 (confirmed empirically) means a CRLF-normalized verdict note — which git autocrlf=true on Windows will produce — becomes invisible to readContext/admit. A legitimate finding stamped against a real green verdict is wrongly refused when the verdict file has CRLF endings. CLAUDE.md names Windows as a first-class target. The 'admit' guarantee is not reliably TRUE on Windows without the parseNote normalization fix."
    artifacts:
      - path: "scripts/context-io.ts"
        issue: "parseNote() anchors its fence regex on LF only (/^---\\n/). A CRLF-encoded note returns null from parseNote; readContext silently skips it (line 410 `if (!parsed) continue`); admit() therefore sees no live green verdict and wrongly refuses the finding. Empirically confirmed: a CRLF verdict produces 'admission FAIL: no live green §14-gate verdict found' for a valid finding."
    missing:
      - "Normalize line endings in parseNote before matching the fence: `const normalized = text.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n');` then match on `normalized`."
      - "Add a CRLF round-trip test to context-io.test.ts covering readContext/admit (a CRLF green verdict must admit a matching finding)."
---

# Phase 21: Verify-Before-Write Admission Verification Report

**Phase Goal:** Wire the differentiator mechanically — a `finding` is admitted to the shared context only with a real, non-self verification stamp — so the replacement memory is trustworthy before it becomes the sole memory.
**Verified:** 2026-06-17T17:10:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A `finding` carrying `verified_by: §14-gate#<id>` (a real gate verdict), a passing test reference, or a named human is admitted; a `finding` with no such stamp is refused. | PARTIAL | LF path: 26/26 tests pass including the workhorse GREEN admit (D-01). CRLF path: empirically confirmed that a CRLF-normalized verdict note causes `admit()` to wrongly refuse a valid finding — "admission FAIL: no live green §14-gate verdict found" — on Windows (git autocrlf=true). The `admit()` contract is not reliably true cross-platform. |
| 2 | A `finding` whose `verified_by` is missing, `self`, or the writing agent is a validator structural FAIL — a RED fixture proves a hollow/self-authored stamp fails (mirroring the prod-deploy hook's refuse-self-set). | VERIFIED | `validate()` implements the full D-09 refuse-self FAIL set: empty stamp, literals `self`/`me`/`agent`, `verified_by == by` self-stamp, DeLM phrase list, and non-grammar. D-02 reserved-identity rule implemented. 8 RED fixtures in the `verify-before-write admission` describe block cover each fail mode. TDD commits: RED `9cd5051`, GREEN `1228383`. All 26 context-io tests pass. |
| 3 | A role following Workflow 16 (`16-context-read-write.md`) reads the shared context before acting and writes only after verification, and every other role references that single-source protocol rather than restating it. | VERIFIED | `agent-factory/workflows/16-context-read-write.md` exists with frontmatter `order: 16`, H1 `# Workflow: context read/write`, 38 non-frontmatter lines (>= 25 required). All 17 role files carry exactly one `16-context-read-write` reference (verified by grep count). WF16 references `context-io`, `05-pr-quality-gate`, `self_fix_attempts`, and `UNKNOWN - verify`. No role restates the protocol. |
| 4 | The §14 gate's bounded `self_fix_attempts` loop drives a bounded verify→regenerate cycle, and the `claim` / `UNKNOWN - verify` escape hatch is honest and explicitly non-load-bearing (a `claim` can never satisfy a `finding`'s admission). | VERIFIED | WF05 Step 5 explicitly states: "No faked pass (escape hatch). Because the verdict is emitted only from a real green result, a non-green result emits no green verdict. A finding whose admission is refused therefore degrades honestly to a `claim` carrying `confidence: UNKNOWN - verify`." WF16 Step 4 restates it by reference. `context-note.md` updated to state "a `claim` can NEVER satisfy a finding's admission requirement" (now enforced, VFY-04). |

**Score:** 3/4 truths verified (SC-1 is PARTIAL due to CR-01)

---

## SC-1 Detail: The Known Open Finding (CR-01)

The code review BLOCKER CR-01 is not cosmetic. Empirical proof:

```
# Test: CRLF-normalized verdict → wrongly refused finding
# Result: REFUSED (BUG)
# stderr: admission FAIL: no live green §14-gate verdict found for "§14-gate#RUN-CRLF-TEST"
#         under task "crlf-task". A finding stamped §14-gate#RUN-CRLF-TEST is admitted only
#         when a real green gate verdict with that per-run id exists in the task context (Posture B).
```

**Root cause:** `parseNote()` (line 184) anchors its frontmatter fence on `\n`:
```ts
const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
if (!m) return null;
```
A CRLF file produces `---\r\n` which does not match `---\n`. `readContext` (line 410) silently skips the null result (`if (!parsed) continue`), so the verdict is invisible to `admit()`.

**Impact on SC-1:** SC-1 requires "a finding carrying `verified_by: §14-gate#<id>` … is admitted." On Windows with git `autocrlf=true` or any CRLF editor, a committed verdict note will be read as CRLF, and `admit()` will refuse the finding despite a real green verdict existing on disk. The guarantee SC-1 asserts is materially false in that path.

**Impact on SC-2:** SC-2 ("a finding whose stamp is missing/self is a structural FAIL") still holds — `validate()` is called before `readContext` in `admit()`, and a structural fail exits before the CRLF-affected path. SC-2 is not impacted by CR-01.

**Judgment:** CR-01 blocks SC-1. The fix is a one-liner in `parseNote` (normalize before match). This is a correctness gap against the phase goal, not a robustness gap: the admission guarantee that the phase exists to establish is unreliable on a named first-class platform. It must be fixed before the phase is marked complete.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/context-io.ts` | Extended `validate()` with D-09/D-02 FAIL set + `admit()` context-aware cross-check + `emitVerdict()` carve-out | VERIFIED | All functions present and substantive. `GATE_STAMP_RE`, `HUMAN_STAMP_RE`, `DELM_INVALID_EVIDENCE`, `REFUSE_SELF_LITERALS` all defined. `validate()` is pure text (D-10). `admit()` is the only context-reading path. `emitVerdict()` is the sole D-04 carve-out path. |
| `scripts/context-io.js` | Committed compiled build of context-io.ts (D-15) | VERIFIED | `npm run freshness` exits 0 — 16 committed `.js` files byte-match a fresh `tsc` rebuild. |
| `scripts/context-io.test.ts` | RED-then-GREEN vitest cases for VFY-01/VFY-02; all Phase-20 cases preserved | VERIFIED | 26 tests pass. The `verify-before-write admission (VFY-01/VFY-02)` describe block contains 12 new cases covering every D-09 fail mode, D-02 impersonation, D-01 no-verdict fail, and D-01 workhorse GREEN. `§14-gate#` count >= 2. |
| `agent-factory/workflows/05-pr-quality-gate.md` | Verdict-emission step on READY_FOR_HUMAN_REVIEW; references context-io.ts by name; `self_fix_attempts` reference; `UNKNOWN - verify` floor | VERIFIED | grep counts confirmed: `§14-gate#` = 2, `context-io` = 3, `self_fix_attempts` = 4, `UNKNOWN - verify` = 5. Emission explicitly tied to `READY_FOR_HUMAN_REVIEW` only. No raw `.grugops/context/` write. `check-foundation-guards.test.ts` passes (25/25). |
| `agent-factory/workflows/16-context-read-write.md` | Single-source context I/O protocol; >= 25 lines; `order: 16`; references `context-io`, `05-pr-quality-gate`, `UNKNOWN - verify` | VERIFIED | 38 non-frontmatter lines. All required references present. Clear professional voice. Single-source charter sentence present. |
| `agent-factory/contracts/context-note.md` | Phase-20 hedges removed; `§14-gate#` example present; "out of scope here" = 0 | VERIFIED | `grep -c "out of scope here\|not implemented here"` = 0. `§14-gate#` = 3 (the worked example at line 157 carries `verified_by: §14-gate#ABC-001`). Admission rules stated in present tense. |
| All 17 role files | One terse `16-context-read-write` pointer each | VERIFIED | All 17 roles: exactly 1 reference each (agents-md-scribe through uat-planner). No MISSING line. |
| `scripts/check-foundation-guards.ts` / `.js` | roleCeiling() bumped for 9 over-FAIL roles; freshness exits 0 | VERIFIED | 9 roles bumped per 21-03-SUMMARY.md table. `npm run freshness` exits 0. `node scripts/check-foundation-guards.js` exits ALL CHECKS PASSED. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `validate()` in context-io.ts | DeLM phrase list + two grammar regexes | `==` / `startsWith` + non-alpha boundary (never `.includes()`) | VERIFIED | `DELM_INVALID_EVIDENCE` const array defined at line 120. `isInvalidEvidencePhrase()` uses the non-substring matcher. `GATE_STAMP_RE` / `HUMAN_STAMP_RE` anchored at lines 111-112. False-positive test `§14-gate#R-ftbdui-001` (embedding `tbd`) passes. |
| `admit()` in context-io.ts | `readContext` / `currentState` (Phase-20 read path) | `readContext(task, contextRoot)` at line 542 inside `admit()` | VERIFIED | `admit()` lines 523-553 call `readContext` then `currentState`. `validate()` body (lines 233-310) confirmed to contain no `readContext` or `readdirSync` call. D-10 separation holds. |
| WF05 Step 5 (READY_FOR_HUMAN_REVIEW) | `emitVerdict` in context-io.ts | Named reference "calling the `emitVerdict` carve-out in `scripts/context-io.ts`" | VERIFIED | WF05 line 47 names `emitVerdict` and `scripts/context-io.ts` explicitly. No inlined raw write. |
| Each of the 17 role files | `agent-factory/workflows/16-context-read-write.md` | One terse pointer line | VERIFIED | All 17 roles verified. Each count = 1. |
| WF16 | WF05 `self_fix_attempts` + context-io.ts | Named references | VERIFIED | WF16 Step 4 references "the EXISTING bounded `self_fix_attempts` loop in `agent-factory/workflows/05-pr-quality-gate.md`". |

---

## Data-Flow Trace (Level 4)

This phase produces TypeScript/markdown, not a UI rendering data. The critical data flow is the admission chain: `emitVerdict` → verdict note on disk → `readContext` / `currentState` → `admit()`.

| Segment | Variable | Source | Produces Real Data | Status |
|---------|----------|--------|--------------------|--------|
| `emitVerdict(task, id, ...)` | verdict note file | `atomicWrite` to `notes/*.md` | Yes — deterministic composition from `VERDICT_GREEN_MARKER` + per-run id | VERIFIED (LF) / BROKEN (CRLF) |
| `readContext(task, ...)` | `NoteRecord[]` | `readdirSync` + `parseNote` per file | Yes — but CRLF notes return null from `parseNote` and are silently skipped | BROKEN on CRLF (CR-01) |
| `admit(task, text, ...)` | `string[]` (findings) | `currentState(readContext(...))` | Data reaches function — but verdict is invisible when CRLF | PARTIAL |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 26 context-io tests all pass | `npx vitest run scripts/context-io.test.ts` | 26 passed | PASS |
| Full non-e2e suite stays green | `npx vitest run --exclude '**/scripts/e2e/**'` | 185 passed, 1 skipped | PASS |
| Foundation guards exit 0 | `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED | PASS |
| Freshness check exits 0 | `npm run freshness` | 16 committed .js files match fresh rebuild | PASS |
| CRLF verdict wrongly refused (CR-01 confirmed) | Custom probe (see CR-01 section) | `admission FAIL: no live green §14-gate verdict found` | FAIL — CR-01 materialized |

---

## Probe Execution

No phase-declared probes. Conventional probes scanned — none found in `scripts/*/tests/probe-*.sh` path.

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VFY-01 | 21-01 + 21-02 | A `finding` admitted only with real gate verdict, test reference, or named human | PARTIAL | LF-path fully implemented and tested. CRLF-path broken (CR-01) — the admission guarantee is not reliably true on Windows. |
| VFY-02 | 21-01 | Refuse-self-set structural FAIL; RED fixture proves hollow/self stamp fails | VERIFIED | Full D-09 FAIL set implemented, 8 RED-then-GREEN fixtures, all 26 tests pass. |
| VFY-03 | 21-03 | Workflow 16 as single-source protocol; all roles reference it, none restate it | VERIFIED | WF16 exists with correct structure. All 17 roles carry exactly one pointer. |
| VFY-04 | 21-02 + 21-03 | Bounded `self_fix_attempts` loop used for verify→regenerate; `claim`/`UNKNOWN - verify` is honestly non-load-bearing | VERIFIED | WF05 Step 5 states this explicitly. WF16 references WF05 Step 4 by name. `context-note.md` enforces the claim-cannot-satisfy-finding rule. |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/context-io.ts` | 183-185, 410 | CRLF line-ending gap in `parseNote` silently drops CRLF notes in `readContext` | BLOCKER (CR-01) | A CRLF-normalized green verdict is invisible to `admit()` — wrongly refuses a valid finding on Windows |

No `TBD`, `FIXME`, or `XXX` debt markers found in any phase-21 modified file.

---

## Human Verification Required

No human verification items were identified. The gap is mechanically verifiable and confirmed.

---

## Gaps Summary

**One gap blocks SC-1 (VFY-01): the CR-01 CRLF line-ending asymmetry in `parseNote`.**

`parseNote` anchors its frontmatter fence match on `\n` only. A file with `\r\n` line endings returns `null` and is silently skipped by `readContext`. Since `admit()` relies on `readContext` to find the live green verdict, a CRLF-normalized verdict file causes `admit()` to refuse any finding stamped against it — even though the verdict legitimately exists on disk.

CLAUDE.md designates Windows as a first-class target. Git `autocrlf=true` (the Windows default) and many Windows editors will CRLF-normalize committed notes. The concrete failure is "a real green verdict becomes invisible on Windows, and `admit()` wrongly blocks a legitimate verified finding" — this is the exact availability/correctness defect the phase's trust model must not have.

**Fix required (one-liner + one test):**

In `parseNote` (line 183), normalize before matching:
```ts
function parseNote(text: string): ParsedFrontmatter | null {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  // ... rest of function operating on `normalized` instead of `text`
```

Add a CRLF round-trip test to `context-io.test.ts`: plant a CRLF verdict via `emitVerdict` then overwrite it with CRLF bytes, then `admit` a matching finding — expect exit 0. Also test that `validate <crlf-file>` handles CRLF consistently with `readContext` (both accept or both reject — the current split where validate rejects CRLF but readContext silently drops it is the defect).

**No other gaps.** SC-2, SC-3, SC-4, the DeLM phrase matcher, the grammar regexes, the D-02 reserved-identity rule, the D-11 strict-reject path, the D-10 separation, the WF16 single-source protocol, the 17-role pointer rollout, and the freshness/foundation-guards gate are all VERIFIED.

---

_Verified: 2026-06-17T17:10:00Z_
_Verifier: Claude (gsd-verifier)_
