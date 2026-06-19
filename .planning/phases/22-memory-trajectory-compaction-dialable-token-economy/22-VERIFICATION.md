---
phase: 22-memory-trajectory-compaction-dialable-token-economy
verified: 2026-06-19T15:10:00Z
status: gaps_found
score: 6/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
round: 6
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  previous_round: 5
  gaps_closed:
    - "Multi-note thread file (the 5th-bypass shape) is closed FOR ID-FIRST NOTES: a §14-gate-verified finding buried as note #2+ with id-first frontmatter ordering is now recovered via splitNotes and its drop refused (RED→GREEN vs committed .js, 22-07-RED/GREEN evidence, independently re-confirmed)."
    - "IN-01: composeThreadNote reuses the exported noteId; no inline id formula remains (grep-confirmed)."
    - "trailingMalformed leading-scratch remainder routed to NoteDirResult.unparseable fail-closed channel."
  gaps_remaining:
    - "splitNotes/parseNote DO drift: the boundary predicate is /^id:/ (id-first only, context-io.ts:273) — a STRICT SUBSET of parseNote's recognized-line set, NOT the shared grammar the must_have requires. A kind-first / indented-id / trailing-space-boundary note #2 is folded silently into note #1's body (no fail-closed signal) → a §14-gate-verified finding dropped at exit 0. This is the 6th distinct CMP-02 bypass, independently reproduced end-to-end through the committed CLI and reachable via the sanctioned writeThread free-scratch path."
  regressions: []
gaps:
  - truth: "splitNotes and parseNote share ONE recognized-line set (a single source-of-truth boundary grammar, IN-02) ... splitNotes cannot drift from parseNote ... if they could drift, that would be the 6th bypass."
    status: failed
    reason: >
      The implementation does NOT share parseNote's recognized-line set. The note boundary is
      `column-0 ---` followed specifically by an `id:` line (isNoteOpeningLine = /^id:/, context-io.ts:273),
      a STRICT SUBSET of parseNote's grammar — not "the SAME set." This IS the drift the must_have
      names as "the 6th bypass." Independently reproduced end-to-end through the committed
      `node scripts/compactor.js check`: a two-note thread file whose note #2 is KIND-FIRST (id on the
      second frontmatter line) folds the §14-gate-verified finding (verified_by: §14-gate#RUN7) into
      note #1's body. splitNotes returns count=1, trailingMalformed=null, malformedLines=[] (NO
      fail-closed signal), and the CLI exits 0 "carve-out intact" while the verified finding is dropped
      from the promoted set. Same silent drop reproduced for an indented `id:` and a `--- `
      (trailing-space) boundary line. This violates SC2 ("Compaction never drops a load-bearing field —
      verified_by ... survive compaction") and the plan's CLASS-level round-trip invariant (must_have
      truth #1). Crucially this is worse than the reviewer's WR-01 framing ("latent / not
      writer-reachable"): the writeThread no-`note` free-scratch path glues ARBITRARY agent body bytes
      into the same threads/<agent>.md, and the plan's own threat model (22-07-PLAN.md:519) declares
      that file an adversarial boundary ("a single file holds MANY adversary-authored note fences; the
      oracle must recover EVERY note"). A kind-first fence in free scratch is adversary-authored note
      content and is dropped silently. Two sanctioned writeThread calls reproduce the exact file.
    artifacts:
      - path: "scripts/context-io.ts"
        issue: "isNoteOpeningLine (line 273) = /^id:/ is column-0-and-id-first only; isBoundaryAt (line 324) requires lines[i] === '---' (exact). Any boundary miss (kind-first, indented id, trailing-space ---) folds the note into a prior body with NO malformedLines / NO trailingMalformed / NO parse-null — it bypasses ALL round-4/5 fail-closed gates because the buried note never becomes a parsed fence. There is no guard or test coupling the writers' field order to the splitter (grep-confirmed)."
      - path: "scripts/compactor.ts"
        issue: "readNoteDir (lines 190-203) trusts splitNotes' boundary recognition; when splitNotes returns count=1 for a real two-note file, the buried verified finding never reaches the id-keyed required-survival set, so checkCarveOut cannot refuse its drop."
    missing:
      - "EITHER restore a genuinely SHARED boundary grammar: a boundary is `column-0 ---` followed by ANY recognized parseNote frontmatter line, so splitNotes cannot drift from parseNote — disambiguating a body's embedded `---key:value---` block by fence STRUCTURE (a true note's opening fence CLOSES with a `---` and the inter-fence region is its frontmatter), NOT by the id-first shortcut, so the body-`---` test still passes."
      - "OR keep id-first but make the invariant SELF-CHECKING and fail-closed: (a) a structural guard/test asserting BOTH composeNote and composeThreadNote emit `id:` as the first frontmatter line (so a future field-reorder fails red, not silent); AND (b) splitNotes must FAIL CLOSED — route to trailingMalformed/unparseable — whenever a `---` line is followed by a frontmatter-looking line (`<key>:` at any indent) that is NOT a recognized id-first boundary, instead of silently absorbing it into a body."
      - "A held-out RED-first test (against the committed pre-fix .js) for the kind-first / indented-id / trailing-space-`---` buried-verified-finding shapes, driven end-to-end through `node scripts/compactor.js check`, asserting exit 1 naming the dropped id."
  - truth: "Fail closed, never silent: a trailing non-blank, non-fence remainder ... is surfaced as trailingMalformed and routed into NoteDirResult.unparseable (WR-01)"
    status: partial
    reason: >
      The fail-closed channel works ONLY for a LEADING un-fenced remainder (scratch-then-fence).
      Round-6 test #3 was reframed from scratch-LAST to scratch-FIRST and NO LONGER discriminates the
      fix — it passes against the PRE-FIX committed .js (22-REVIEW.md WR-02). I confirm the executor's
      safety claim is TRUE for FREE scratch (the no-`note` path carries no fenced provenance field, so
      trailing free scratch cannot smuggle a load-bearing field) — so this is NOT itself a load-bearing
      drop. BUT the same byte-absorption is the mechanism by which a buried kind-first FENCED note is
      swallowed (gap #1). Listed as partial because test #3 is non-discriminating filler and must not
      be counted as evidence of the round-6 closure.
    artifacts:
      - path: "scripts/compactor.test.ts"
        issue: "round-6 test #3 (scratch-then-fence) passes against pre-fix code → does not discriminate the fix; non-discriminating filler."
    missing:
      - "Replace test #3 with a RED-first multi-note case that exercises the new read path (note #1 fenced, a non-boundary fence-shaped remainder after note #2, refused naming <agent>.md, RED against the pre-fix .js), plus an explicit comment that trailing FREE scratch carries no provenance by construction (deliberate safe non-goal)."
deferred:
  - truth: "WR-03: a faithful note whose body legitimately contains `---\\nid:` is falsely refused (writer-reachable false-positive; fails SAFE)"
    addressed_in: "follow-up round (out of scope per 22-07-PLAN.md; fails in the SAFE direction — refuse not admit)"
    evidence: "22-REVIEW.md WR-03 — usability defect to track, not a security bypass"
  - truth: "WR-02 (readContext fail-OPEN) and broader IN-02 (unknown-key allowlist in validate())"
    addressed_in: "explicitly deferred by 22-07-PLAN.md OUT OF SCOPE block"
    evidence: "22-07-PLAN.md:122-128 — readContext untouched (confirmed); validate() got no unknown-key allowlist (confirmed)"
---

# Phase 22: Memory & Trajectory Compaction Verification Report (Round 6, plan 22-07)

**Phase Goal:** Bound the multi-agent token tax with two-tier memory — verbose local trajectory stays in the agent's thread; only compact, re-verified distillations promote to the shared context — landed before parallel fan-out makes the cost real.

**Verified:** 2026-06-19T15:10:00Z
**Status:** gaps_found
**Re-verification:** Yes — round 6, after the 5th-bypass (multi-note thread file) gap closure.

## Goal Achievement

Round 22-07 touches ONLY CMP-02 / SC2 (the load-bearing-field carve-out). CMP-01 and CMP-03 were verified earlier and are confirmed untouched. Verification focus: SC2 as a SAFETY INVARIANT bypassed FIVE times across rounds 1–5. Green tests are necessary but NOT sufficient — proof is RED→GREEN reproduction against the committed scripts/compactor.js plus a CLASS-level invariant.

### Observable Truths (the 22-07 must_have set)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CLASS INVARIANT: read path recovers EXACTLY the per-note set the write path emitted, or fails closed | ✗ FAILED | Holds for id-first notes only. A kind-first note #2 yields count=1 / trailing=null → verified finding dropped at exit 0 (reproduced end-to-end through committed CLI). |
| 2 | Round-trip: writeThread×2 → readNoteDir recovers the exact id-set (RED→GREEN vs committed .js) | ✓ VERIFIED | 5 round-6 tests RED→GREEN against committed .js (22-07-RED/GREEN; orchestrator independently re-confirmed). Valid **for id-first notes**. |
| 3 | Body-byte round-trip (body-consuming splitter); body survival required for exit 0 | ✓ VERIFIED | splitNotes is body-consuming; `notes.join('')+(trailingMalformed??'')` round-trips byte-for-byte (independently re-confirmed). |
| 4 | splitNotes and parseNote share ONE recognized-line set; cannot drift; drift = 6th bypass | ✗ FAILED | **They DO drift.** Boundary = /^id:/ (strict subset, context-io.ts:273), not parseNote's set. The 6th bypass is live and reproduced. Decisive gap. |
| 5 | Body `---` is not a boundary; a buried §14-gate note #2 after a body block is still recovered | ⚠️ PARTIAL | The body-`---`/embedded-block case (note #2 id-first) is correctly handled. But the same narrow precision excludes a real kind-first note #2 (gap #1). |
| 6 | Fail closed, never silent: a trailing/leading non-fence remainder → unparseable | ⚠️ PARTIAL | Leading scratch fails closed (works). Trailing free scratch absorbed as body (safe for free scratch; same absorption hides kind-first fences — gap #1). Test #3 non-discriminating. |
| 7 | IN-01 closed: composeThreadNote reuses exported noteId; no inline id formula | ✓ VERIFIED | `export function noteId` (context-io.ts:524); composeThreadNote calls noteId(note) (compactor.ts:588); inline `.replace(/[-:]/g` count = 0. |
| 8 | RED→GREEN reproducible against the COMMITTED compactor.js | ✓ VERIFIED | 22-07-RED-baseline.txt (exit 0 "carve-out intact") → 22-07-GREEN-proof.txt (exit 1 naming dropped id); independently re-confirmed; freshness exit 0; 409 passed / 1 skipped. |

**Score:** 6/8 truths verified (truths #1 and #4 FAILED; both turn on the same id-first/no-drift defect).

## The decisive adjudication (the two findings)

### Finding 1 (id-first boundary deviation) — does the codebase satisfy "share ONE grammar so they CANNOT drift"?

**No. It satisfies only the weaker "they don't drift today because writers happen to be id-first" — and even that weaker claim fails in practice because the raw thread file accepts arbitrary agent bytes via the free-scratch path.**

I did not rubber-stamp the SUMMARY. I independently reproduced a LIVE exit-0 drop of a §14-gate-verified finding through the committed CLI:

- `splitNotes(id-first note1 + kind-first note2)` → `count=1, trailingMalformed=null, malformedLines=[]`. The verified finding (`verified_by: §14-gate#RUN7`) is folded into note #1's body.
- `node scripts/compactor.js check <raw> <promoted>` with the finding dropped from the promoted set → **`carve-out intact ... EXIT=0`**. The verified finding was silently dropped.
- The file is producible by **two sanctioned `writeThread` calls** (note #1 structured path; note #2 via the no-`note` free-scratch path with kind-first bytes the agent chose). Writer-reachable, not merely hand-authored.
- Same silent drop for an indented `id:` and a `--- ` trailing-space boundary line.

This is the **6th distinct CMP-02 bypass**, in exactly the family the plan's own must_have #4 names ("if they could drift, that would be the 6th bypass"). The closure rests on an **undocumented, untested, unguarded** "every writer emits id: first" invariant — no structural guard, no test (grep-confirmed). A benign field-reorder of composeNote, or any free-scratch the agent shapes as a kind-first fence, re-opens the hole with a fully green suite. An unguarded coupling is NOT an acceptable foundation for an "un-cheatable mechanical floor." SC2 does not hold as stated.

### Finding 2 (test #3 reframe) — does the non-discriminating test weaken the SC2 proof?

**Yes, as test-integrity. The underlying safety claim is TRUE, but the test must not be counted as evidence.**

I confirm: trailing FREE scratch (no-`note` path) carries no fenced provenance field, so it cannot smuggle a load-bearing field — that gap is safe. But test #3 (reframed scratch-then-fence) passes against the PRE-FIX code (22-REVIEW.md WR-02), so it does not discriminate the fix. More importantly, the very byte-absorption that makes trailing scratch "safe" is the SAME mechanism that hides a kind-first FENCED note (gap #1): splitNotes silently absorbs unrecognized fence-shaped content into a body instead of failing closed. The SC2 proof is weakened both by the filler test and by the structural gap beside it.

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/context-io.ts` | exported splitNotes sharing parseNote grammar; exported noteId | ⚠️ HOLLOW | splitNotes + noteId exported and wired, BUT splitNotes does NOT share parseNote's grammar (boundary = /^id:/ subset) — the artifact's stated `provides` ("sharing parseNote's fence grammar") is not met. |
| `scripts/context-io.js` | byte-fresh tsc build | ✓ VERIFIED | `npm run freshness` exit 0. |
| `scripts/compactor.ts` | readNoteDir iterates splitNotes; per-note keying; trailingMalformed→unparseable; composeThreadNote reuses noteId | ✓ VERIFIED | splitNotes( in readNoteDir; noteId( ×4; unparseable ×18; inline id formula = 0. |
| `scripts/compactor.js` | byte-fresh tsc build | ✓ VERIFIED | freshness exit 0. |
| `scripts/compactor.test.ts` | FIVE held-out RED-first multi-note tests | ⚠️ PARTIAL | 5 exist, 4 genuinely RED→GREEN; test #3 non-discriminating (passes pre-fix). NONE cover the kind-first / indented-id boundary-miss shape — the corpus blind spot that hid the 6th bypass. |
| `scripts/context-io.test.ts` | splitNotes unit + shared-grammar proof | ⚠️ PARTIAL | 9 tests incl. body-`---`. The "shared-grammar (splitNotes∘parse == parseNote)" assertion exercises only id-first notes, so it does NOT prove no-drift for the failing shapes. |
| `22-07-RED-baseline.txt` | RED evidence | ✓ VERIFIED | exit 0 "carve-out intact" + 5 failing tests recorded. |
| `22-07-GREEN-proof.txt` | GREEN evidence | ✓ VERIFIED | exit 1 naming dropped id + freshness exit 0 + 409 passed. |

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| compactor.ts readNoteDir | context-io.ts splitNotes | readNoteDir iterates splitNotes(fileText).notes | ✓ WIRED | compactor.ts:190-203 |
| context-io.ts splitNotes | context-io.ts parseNote recognized-line set | shared recognized-line set (single source) | ✗ NOT_WIRED | splitNotes uses isNoteOpeningLine (/^id:/), a separate narrower predicate — NOT parseNote's recognized-line set. This is the gap. |
| compactor.ts composeThreadNote | context-io.ts noteId | reuses exported noteId | ✓ WIRED | composeThreadNote calls noteId(note); inline formula removed |
| compactor.ts readNoteDir | compactor.ts checkCarveOut unparseable | trailingMalformed → NoteDirResult.unparseable | ✓ WIRED | leading remainder routed; works for scratch-then-fence only |

## Behavioral Spot-Checks (independent, against committed .js)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build + freshness | `npm run build && npm run freshness` | All 17 committed .js fresh; exit 0 | ✓ PASS |
| splitNotes on id-first 2-note file | `node` repro | count=2, both notes recovered | ✓ PASS |
| splitNotes on kind-first note #2 | `node` repro | **count=1, trailing=null — finding HIDDEN** | ✗ FAIL (6th bypass) |
| End-to-end CLI drop of kind-first verified finding | `node scripts/compactor.js check` | **EXIT=0 "carve-out intact"** while finding dropped | ✗ FAIL (live SC2 violation) |
| Kind-first note reachable via writeThread free-scratch | `node` repro (2× writeThread) | file produced; splitNotes count=1 | ✗ FAIL (writer-reachable) |
| Indented-id / `--- ` boundary note #2 | `node` repro | count=1, trailing=null | ✗ FAIL (same class) |

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CMP-02 | 22-07 | Load-bearing-field carve-out; RED test fails if any dropped | ✗ BLOCKED | SC2 violated — verified_by finding dropped at exit 0 via the 6th bypass (kind-first / boundary-miss). The "RED test" corpus does not cover this shape. |
| CMP-01 | earlier (22-01/22-02) | Two-tier compaction | ✓ SATISFIED (untouched) | 22-07 commits touch only the 6 declared script files; no dial/two-tier/Workflow-18 change. CMP-01 tests green within the 409-suite. |
| CMP-03 | earlier (22-01/22-02) | context.compaction dial + re-verify + Workflow 18 | ✓ SATISFIED (untouched) | readContext untouched; dial/re-verify unchanged (diff scope confirmed). |

All three phase requirement IDs accounted for. No orphaned requirements.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| scripts/context-io.ts | 273 | Safety invariant depends on an undocumented/unguarded/untested cross-module "id-first" writer contract | 🛑 Blocker | A field-reorder or free-scratch kind-first fence silently re-opens the bypass with a green suite |
| scripts/context-io.ts | 318-325 | splitNotes silently ABSORBS an unrecognized `---`+frontmatter-looking region into a body instead of failing closed | 🛑 Blocker | Boundary miss = silent note drop, bypassing all round-4/5 fail-closed gates (the note never becomes a parsed fence) |
| scripts/compactor.test.ts | round-6 test #3 | Non-discriminating test (passes pre-fix) counted as closure evidence | ⚠️ Warning | Weakens the SC2 proof; replace with a RED-first case |

No `TBD`/`FIXME`/`XXX` debt markers in the modified files.

## CMP-01 / CMP-03 Untouched (confirmed)

`git diff --name-only 76d4347~1 08d1716` shows only the 6 declared script files + 2 evidence files. No change to the `context.compaction` dial, two-tier separation, re-verify, Workflow 18, or `readContext`. The write-path representation (single multi-note threads/<agent>.md) is unchanged — read-path-only as scoped. CMP-01/CMP-03 tests remain green within the 409-test non-e2e suite.

## Gaps Summary

Round 6 made real, verifiable progress: it genuinely closes the multi-note bypass **for id-first notes**, handles the body-`---`/embedded-block case, closes IN-01, and 4 of 5 tests are honest RED→GREEN against the committed .js. The mechanical scaffolding (splitNotes export, per-note readNoteDir keyed `<file>#<n>`, trailingMalformed→unparseable, byte-fresh .js) is all present and wired.

But SC2 — the un-cheatable mechanical floor — does **not** hold as stated. The boundary predicate `/^id:/` is a strict subset of parseNote's grammar, which is precisely the splitNotes/parseNote DRIFT the plan's must_have #4 forbids ("that would be the 6th bypass"). I independently reproduced, end-to-end through the committed CLI, a §14-gate-verified finding silently dropped at exit 0 when buried as a kind-first note #2 — reachable via the sanctioned writeThread free-scratch path, which the plan's own threat model declares an adversarial boundary. This is the 6th distinct CMP-02 bypass. The suite was green precisely because the corpus never authored a kind-first / boundary-miss note — the same structural test blindness that hid rounds 1–5.

This is consistent with, and stronger than, the deep code review (22-REVIEW.md WR-01, rated WARNING because it judged the shape "not writer-reachable today"; my free-scratch reproduction shows it IS reachable). Combined with WR-04 (same root cause) and the non-discriminating test #3 (WR-02), the round-6 closure of SC2 cannot be certified.

**Round-7 closure must** either (a) restore a genuinely shared boundary grammar that still passes the body-`---` test (disambiguating embedded blocks by fence STRUCTURE, not the id-first shortcut), OR (b) keep id-first but make it self-checking: a structural guard + test that both writers emit id-first AND a fail-closed splitNotes that refuses (routes to unparseable) any `---`+frontmatter-looking region it does not recognize as a clean boundary — never silently absorbing it into a body. Plus a held-out RED-first test for the kind-first / indented-id / trailing-space-`---` buried-verified-finding shapes driven through `node scripts/compactor.js check`.

---

_Verified: 2026-06-19T15:10:00Z_
_Verifier: Claude (gsd-verifier)_
