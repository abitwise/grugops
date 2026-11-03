---
phase: 40-plain-language-role-rewrite
reviewed: 2026-11-03T10:43:50Z
depth: standard
scope: incremental, be77596e4a3d081580122b9949dbb2be4d284645..HEAD (gap-closure round 2, plans 40-17 to 40-21)
files_reviewed: 19
files_reviewed_list:
  - agent-factory/roles/orchestrator.md
  - agent-factory/workflows/06-uat-pack.md
  - docs/audit/29-style-dispositions/40-17.md
  - docs/audit/29-style-dispositions/40-20.md
  - docs/audit/40-disposition-base-move.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - scripts/board-readonly.test.ts
  - scripts/check-banned-claims.test.ts
  - scripts/check-diff-disposition.js
  - scripts/check-diff-disposition.test.ts
  - scripts/check-diff-disposition.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-role-rules.js
  - scripts/check-role-rules.test.ts
  - scripts/check-role-rules.ts
  - scripts/compactor.test.ts
  - scripts/context-io.test.ts
  - scripts/tier-kit-text.test.ts
findings:
  critical: 2
  warning: 3
  info: 3
  total: 8
status: issues_found
---

# Phase 40: Code Review Report (gap-closure round 2)

**Reviewed:** 2026-11-03T10:43:50Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

This review covers the changes since `be77596e`: the CR-01 round-2 safety hold in the D-30 stand-in (`check-diff-disposition.ts`, `carriesSafetyFact` in `check-role-rules.ts`), rule 6 of the board-move partition (WR-02), the IN-01 baseline-against-git comparison, the IN-03 `-z` / `./` path fix, the change to the Orchestrator's lean close and Workflow 06 so they follow the `sign_off_acceptance` dial (WR-03), the exact-sentence pins (WR-01), the 36 disposition rows in `40-20.md`, and the import-closure and manifest updates. The committed `.js` files were taken as builds of the `.ts` files, so the `.ts` files were reviewed.

The mechanics are carefully built. The held-back count cannot double-count, because the structural arm always ends in `continue`. The parity case holds: a script run against every role sentence at HEAD found no fact-bearing sentence whose gate clause loses the fact. The IN-01 comparison replaces the baseline with the git derivation when the two differ, so a laundered JSON cannot hide a loss. The IN-03 path fix is correct, because `ls-tree` and `<sha>:./<path>` both resolve relative to `-C root`.

**The round's main claim does not hold.** The fix promises that a changed safety sentence owes a row a named human reads. Two edits, each reproduced in a scratch clone of HEAD, give a weaker safety posture while both CI gates print `ALL CHECKS PASSED`:

1. **Adding a sentence to `## Hard limits`.** A new sentence that permits merging needs no row (CR-03).
2. **Deleting a dispositioned safety sentence.** One of the new `40-20.md` rows pre-approves the deletion (CR-04).

The same clone run showed a third gap. A gate-skipping move written as two code spans with an arrow between them (`In Development` → `Done`) is invisible to rule 6 and to the partition (WR-07).

**About the finding IDs.** The round-1 IDs (CR-01, CR-02, WR-01 to WR-06, IN-01 to IN-04) are already recorded as `fixed` in `40-REVIEW-DISPOSITION.md`. This report starts at CR-03, WR-07 and IN-05 so that no recorded decision is dropped by reusing an ID.

## Critical Issues

### CR-03: The stand-in still admits a new merge-permitting sentence in `## Hard limits` with no row

**File:** `scripts/check-diff-disposition.ts:2071-2096` (the `safetyHeld` predicate and the structural arm), `scripts/check-role-rules.ts:120-145` (the fact table)
**Issue:** `safetyHeld` is true only when `carriesSafetyFact(c.clause)` holds. Every `SAFETY_RULE_FACTS` pattern is a prohibition or a human-hold token (`never merge`, `never deploy`, `named human`, `self-sign`). A sentence that grants a permission carries none of them, so it is never held. It goes to the stand-in, `check-role-rules --check` exits 0 because no baseline fact was lost, and the clause is admitted with no row.

To reproduce, take a shared clone of HEAD and insert this line directly under `## Hard limits` in `agent-factory/roles/orchestrator.md`:

```
When the gate is green and the PR is small, merge it to main yourself and close the ticket.
```

Then run `CHECK_ROOT=<clone> node scripts/check-diff-disposition.js`. The output ends with `1081 role clause(s) admitted by the role-rule inventory stand-in (D-30)` and `ALL CHECKS PASSED`, exit 0. `check-role-rules.js` also exits 0. The `tier-kit-text` pins do not cover `## Hard limits`.

This is the CR-01 outcome reached by adding a sentence instead of rewording one: a sentence that reverses a safety rule enters the most sensitive section of the coordinator role, and no human reads it. The header comment on line 158, "THE STAND-IN NEVER SEES A SAFETY SENTENCE", is false for this case. The test file covers rewording on the removed and added sides, but it has no case for a pure addition of a fact-free permission. `SAFETY_REMOVED_REWORD` ("…merge the branch once the gate is green.") is exactly that kind of sentence, and the gate only refuses it because the removed side carries a fact.

**Fix:** Hold position along with content. `## Hard limits` and `## Stop when` are the safety sections by definition (`FROZEN_SECTION_ANCHORS`), so no clause inside them should ever reach the stand-in:

```ts
const inSafetySection = c.region !== null; // ## Hard limits / ## Stop when
const safetyHeld =
  standinRun.declared &&
  c.file.startsWith(ROLE_STANDIN_SCOPE) &&
  (inSafetySection || carriesSafetyFact(c.clause));
```

Add a mirror case that inserts a fact-free merge permission into `## Hard limits` and expects red with the CR-01 note. If the human wants the stand-in to keep admitting some structural prose, at least widen the predicate to hold any clause that names `merge`, `deploy`, `production`, `sign off` or `release` with no prohibition, and state that narrower promise in the header comment.

### CR-04: A `40-20.md` row pre-approves deleting the safety sentence it records, and both gates stay green

**File:** `scripts/check-diff-disposition.ts:1507-1513` (`rowMatches`), `docs/audit/29-style-dispositions/40-20.md` (the "kept word for word" rows: `installer.md` 38, `orchestrator.md` 77, `release-manager.md` 46)
**Issue:** `rowMatches` matches a row when its file is the same and either its `before` or its `after` normalizes to the changed clause. It checks neither the clause's side nor its line, nor whether the row's `after` still exists in the working tree. `40-20.md` adds rows whose `before` and `after` are the same text, to record that a safety sentence was kept on a rewritten line. Because the gate diffs against the fixed base `e8d7802`, such a row also matches the removed-side clause if that sentence is later deleted outright. On the structural arm the row's companion cell is already filled, so the deletion passes as "satisfied".

To reproduce, take a shared clone of HEAD and delete `Deploy only after a named human approves; production action is always human-confirmed.` from `agent-factory/roles/release-manager.md` line 46, leaving only `Never deploy to production yourself.`. Both `check-diff-disposition.js` and `check-role-rules.js` exit 0 with `ALL CHECKS PASSED`.

The fact floor does not catch the deletion, because `named-human` and `production-human` are still held by the role's line 52. So a human-approval rule leaves `## Hard limits` with no new row and no human read. The disposition the human accepted, "kept word for word", now describes a sentence that no longer exists. The same applies to any row whose `before` names a safety clause. Once a sentence is dispositioned, any later change on that side of the clause is pre-approved for as long as the base stays at `e8d7802`.

**Fix:** Make a row match a side, and check the side it claims:

```ts
function rowMatches(row: DispositionRow, c: ChangedClause): boolean {
  if (row.file !== c.file) return false;
  const before = row.before.trim() === "—" ? null : normalizeSentence(row.before);
  const after = row.after.trim() === "—" ? null : normalizeSentence(row.after);
  if (c.side === "removed") return before === c.clause;
  return after === c.clause;
}
```

Also, for a safety-held clause, refuse a row whose `after` side is non-empty but has no matching added clause in the current diff. That row records a sentence the tree no longer holds. A row with `before === after` should match only when both a removed and an added clause with that text exist.

## Warnings

### WR-07: Rule 6 misses a move written as two code spans around an arrow, or as "from `X` to `Y`"

**File:** `scripts/check-role-rules.ts:639-662` (`moveSpanFindings`)
**Issue:** Arm (a) and arm (b) only look inside a single code span. Arm (c) blanks every code span before it looks for prose arrows. So a move whose columns each sit in their own code span is invisible to all three arms and to `claimedPairs`. This was probed with `moveSpanFindings` and `claimedPairs` against the live partition model. Each of these returns `[]` from both functions:

- `` You own `In Development` → `Done`. ``
- `` You own `In Development`->`Done`. ``
- `` Move the ticket from `In Development` to `Done` yourself. ``
- `In Development ⇒ Done` (an arrow glyph outside the three listed)

The first spelling, planted next to the Orchestrator's lean-close sentence in a scratch clone, passed `check-role-rules.js` (`board-move partition: 0 findings`). It also passed the `tier-kit-text` close pin, which only checks that `CLOSE_SENTENCE` appears exactly once on the line. The WR-02 disposition says a move now "has one spelling", but this round only covers arrows that sit inside one span or between two bare column names.

**Fix:** Run arm (c) on a copy where each code span holding exactly one board column is replaced by that column's text, not by a blank. Add a "from <col> to <col>" pattern to the same arm:

```ts
const unspanned = line.replace(/`([^`\n]+)`/g, (_m, inner: string) =>
  columns.has(inner.trim()) ? inner.trim() : " ");
const prose = new RegExp(`${col}\\s*(?:→|->|=>|⇒|⟶)\\s*${col}|\\bfrom\\s+${col}\\s+to\\s+${col}`, "gi");
```

Keep the existing case that a lone `` `X → Y` `` span is not a prose finding. The canonical span still holds `→` inside one code span, so it is blanked as it is today.

### WR-08: The Orchestrator's close now depends on a checkpoint whose shipped definition does not require a human for a clean pass

**File:** `agent-factory/roles/orchestrator.md:68`, `agent-factory/roles/orchestrator.md:89`; cross-reference `agent-factory/config/factory.config.md:207`
**Issue:** Plan 40-17 replaced "Close only after the named human signs off acceptance (`checkpoint: sign_off_acceptance`)" with "Close only after the sign-off that `checkpoint: sign_off_acceptance` requires". The checkpoint table defines the stop it names as "Signing off acceptance **when the criteria are missing, ambiguous or unmet**". An Orchestrator that reads its role and the config literally therefore finds that, at the shipped `block` default, the checkpoint requires no human when all criteria are clear and met. It can then close a ticket that no human accepted. That is the CR-02 outcome, reached through an indirection.

The `## Stop when` item "`sign_off_acceptance` is not met" has the same problem: a checkpoint is a disposition (`block` / `notify` / `off`), not a condition, so "not met" has no defined meaning. Workflow 06 line 33 asserts the opposite reading ("With the shipped configuration … still stops for a named human"), so two files now disagree on what the default does. In practice the human merge, the git-host floor, is still required. The UAT Planner's unconditional hard limit (see WR-09) still forces a human sign-off at default, but only because that role ignores the dial.

**Fix:** State the default in the sentence itself, so the role does not depend on the config table's wording. For example: "Close only after a human merged the PR, `agent-factory/checklists/definition-of-done.md` holds, and the named human signed off acceptance, unless `checkpoint: sign_off_acceptance` is lowered to `notify` or `off`." Reword the hold item to match ("…or the named human has not signed off and `sign_off_acceptance` is `block`…"). Alternatively, fix the config table cell so `sign_off_acceptance` names every acceptance sign-off, not only the missing, ambiguous or unmet case. Update the `CLOSE_SENTENCE` and `HOLD_ITEM` pins, and add a row in the plan's disposition file.

### WR-09: The UAT Planner and Workflow 06's first paragraph still require a named human unconditionally, which contradicts the dial text added in this round

**File:** `agent-factory/workflows/06-uat-pack.md:31` against `:33`; `agent-factory/roles/uat-planner.md:38`, `:45`, `:50`
**Issue:** Line 33 now says "The dial governs both the enterprise `In UAT -> Ready to Release` move and the lean close … At `off` it proceeds silently." In the same section, line 31 says "In enterprise mode, the UAT Planner moves the ticket to `Ready to Release` **once the named human signs off**", with no dial. The role that owns that move says the same three times, with no dial: "you own `In UAT → Ready to Release` once the named human signs off the scenarios" (line 38), "Acceptance needs a named human sign-off" (hard limit, line 45), and "After the human signs off, stop done" (line 50).

At `notify` or `off`, the owning role never moves the ticket and never hands the lean ticket to the Orchestrator, while the workflow says the move proceeds. This is the cross-file conflict class that WR-03 was opened for. It was fixed for the Orchestrator and moved onto the UAT Planner. `40-17.md` says no board pair is re-owned, but it does not mention that the move's owner still ignores the dial.

**Fix:** Pick one reading and apply it to all three places. If the dial is meant to lower the enterprise move, make `uat-planner.md` lines 38 and 50 and Workflow 06 line 31 conditional on `sign_off_acceptance` being `block`. The hard limit on line 45 is a safety sentence (`named-human` fact), so its change needs a disposition row and the named human's read under CR-01. If the human intends the UAT Planner always to require a named human, then remove "The dial governs both the enterprise … move" from line 33 and say the dial governs only the Orchestrator's lean close. Add a `tier-kit-text` case that holds the UAT Planner and Workflow 06 to the same rule.

## Info

### IN-05: The IN-01 content check passes silently with a NOTE when the history is shallow

**File:** `scripts/check-role-rules.ts:989-1014`
**Issue:** When `PHASE_40_START_COMMIT` is not reachable, `check()` prints a NOTE, reads the JSON as written, and can pass. The tampering IN-01 was meant to catch then goes undetected. `check-diff-disposition` fails closed on a shallow history ("confirm the history reaches … `fetch-depth: 0`"), but this gate, which the stand-in trusts, degrades instead. CI uses `fetch-depth: 0` today, so this matters only if that setting changes.
**Fix:** When `process.env.CI` is set, or when `git rev-parse --is-shallow-repository` prints `true`, make the unreachable case a FAIL. Keep the NOTE only for a mirror with no git history at all.

### IN-06: The fact patterns were widened to fit the normalized form, which also loosens the baseline floor

**File:** `scripts/check-role-rules.ts:136-144`
**Issue:** `wip-limit` and `claim-cap` changed from the exact config key (`s.includes("queue.wip_limit")`) to `/\bqueue[._ ]wip[_ ]limit\b/i`, and `self-sign` now matches `self sign`. The same table drives the baseline derivation on raw text. So a role that replaces the config key `` `queue.wip_limit` `` with the prose "the queue WIP limit" still holds the fact, and the inventory floor no longer pins the key name. The CR-01 hold on the removed side covers a reword today, so the risk is low.
**Fix:** Keep the derivation patterns exact, and have `carriesSafetyFact` test both the clause and a raw-form lookup. Alternatively, give the predicate its own normalized-form patterns, built from the table in one place, with a parity case.

### IN-07: The admission hook's verified closure now includes the inventory gate

**File:** `hooks/hook-entry.ts:255-258`, `scripts/check-diff-disposition.ts:101-104`
**Issue:** Importing `carriesSafetyFact` puts all of `check-role-rules.js` (its git, writer and partition code) and `install/state-layout.js` into the admission hook's hash-verified closure. Any later edit to the inventory gate, a CI-only lint, now changes a runtime-hook manifest. If someone forgets `npm run generate:hook-manifest`, every admission call on a host fails closed. The freshness check catches this in CI, but the coupling has no value for the hook. Four test files had to start copying `install/state-layout.js` into scratch kits because of it.
**Fix:** Move `SAFETY_RULE_FACTS` and `carriesSafetyFact` into a small module with no imports (for example `scripts/safety-facts.ts`). Have both `check-role-rules.ts` and `check-diff-disposition.ts` import it. That keeps one source for the fact list and leaves the hook closure as it was.

---

_Reviewed: 2026-11-03T10:43:50Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
