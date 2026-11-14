---
phase: 41-orchestrator-flow-guidance
reviewed: 2026-11-14T09:56:14Z
depth: standard
diff_base: 8353b557eefff946b11209345385c27d49c17867
files_reviewed: 4
files_reviewed_list:
  - CHANGELOG.md
  - agent-factory/workflows/06-uat-pack.md
  - docs/audit/29-style-dispositions/41-29.md
  - scripts/flow-guidance-text.test.ts
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 41: Code Review Report (incremental, plan 41-29)

**Reviewed:** 2026-11-14T09:56:14Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

This review covers the delta `8353b557..HEAD` for the four files of gap-closure plan 41-29. The plan closes WR-01 of the
2026-11-13T19:23:49Z review. It adds one sentence, "At `high-severity` it gates only a finding by `security-nfr`,
`architect-design` or `release-manager`.", to Workflow 06 line 37 and to the plan 41-27 CHANGELOG Security bullet. It pins
the sentence in `scripts/flow-guidance-text.test.ts` and records two disposition rows in `41-29.md`.

What was checked against the code:

- `scripts/context-io.ts:4305` holds `HIGH_SEVERITY_ROLES = ["security-nfr", "architect-design", "release-manager"]`.
- `scripts/context-io.ts:6741` returns `isHighSeverityRole(by)` at `high-severity`, and line 6735 returns false for every
  kind but `finding`.
- `hooks/admission-guard.ts:315-316` calls `allow()` whenever `isGatedNote` is false.
- Workflow 06's "Agents involved" lists only UAT Planner, BA/PM and QE/E2E, so the witness finding is not normally by a
  high-severity role.

The new sentence is accurate and does not overstate the control. The line numbers in `41-29.md` are correct: CHANGELOG
line 194 for the new sentence, the `note.js` sentence moved to 195 and the install-guide sentence to 197. So is the
recipe's matching sentence at `browser-uat-recipe.md:458`.

`node scripts/check-diff-disposition.js` exits 0 with "0 findings over 28/28 elements". The new test passes:
`vitest run scripts/flow-guidance-text.test.ts -t "high-severity dial"` gave 1 passed.

One readability problem comes from the insertion itself. In Workflow 06, the sentence that follows the new one ends
"nothing binds it either", and its "either" now points back across a sentence that says the dial *does* gate some
findings. The disposition row notes the two "it"s but not the "either".

The prior review's WR-02, WR-03 and IN-01 to IN-07 stay deferred by the human. This delta does not change them, so they
are not raised again.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Workflow 06's "nothing binds it either" now follows a sentence that says the dial gates something

**File:** `agent-factory/workflows/06-uat-pack.md:37`
**Issue:** Before plan 41-29, the sentence order was:

> At the default `off` the dial gates no note, so nothing binds the name. For a note written with
> `tools/grugops/note.js`, and on any other install, a standalone Claude Code install included, nothing binds it either
> (residual R-41-06).

There, "it" (the name) and "either" (nothing binds it in this case too) both pointed to the sentence right before. The
insertion puts this sentence in between:

> At `high-severity` it gates only a finding by `security-nfr`, `architect-design` or `release-manager`.

That sentence says the dial does gate some findings, which is the case where the name *is* bound. The next sentence's
"nothing binds it either" now follows a statement about gating, not about nothing being bound. A reader can take
"either" to mean that nothing binds the name at `high-severity` even for a finding by those three roles. That is wrong:
the hook checks the stamp for those findings (`hooks/admission-guard.ts:315-330`).

On top of that, "it" now has two referents in a row: the dial in the new sentence and the name in the next. This is a
statement about a security control, and CLAUDE.md requires plain English there. The CHANGELOG has no such problem,
because its next sentence names "a `human:<name>` stamp" and uses no "either". Neither does the recipe, whose next
sentence reads "A note written with `tools/grugops/note.js` passes no hook, so nothing binds its stamp to a human."

The `41-29.md` row for line 37 points out the two "it"s to the named human. It does not mention the "either", and it
keeps the sentence because the `41-28.md` row for it was accepted in test 12. The problem is still one the delta
created, so it needs a named human's ruling, not a silent pass.

**Fix:** Have the named human choose one of these. Either changes one sentence that has an accepted `41-28.md` row, so
it needs a new row and the human's ruling. Option (a) is the smaller change.

(a) Drop the dangling contrast and name the noun:
```text
At `high-severity` it gates only a finding by `security-nfr`, `architect-design` or `release-manager`. For a note written
with `tools/grugops/note.js`, and on any other install, a standalone Claude Code install included, nothing binds the name
(residual R-41-06).
```
(b) Say what follows from the new sentence, as the default-`off` sentence does, so that "either" has a negative to
point back to:
```text
At `high-severity` it gates only a finding by `security-nfr`, `architect-design` or `release-manager`, so a witness
finding by any other role binds nothing. For a note written with `tools/grugops/note.js`, ... nothing binds the name
either (residual R-41-06).
```
In both cases, update the `flow-guidance-text.test.ts` pin at lines 1685-1689 (its third part ends at "on any other
install,", so it would still pass) and add a `not.toContain("nothing binds it either")` if the old wording is retired.

## Info

### IN-01: "gates only" leaves out the hook's fail-closed refusals at `high-severity`

**File:** `agent-factory/workflows/06-uat-pack.md:37`, `CHANGELOG.md:194-195`
**Issue:** At `high-severity`, `hooks/admission-guard.ts:261` sets `dialIsActive`. Lines 294-303 then refuse any
`finding` whose `by` is empty, whatever its role. A config file that exists but cannot be read makes `isGatedNote`
return true for every finding (`scripts/context-io.ts:6737`). "Gates only a finding by ..." is therefore narrower than
what the hook does. The sentence never overstates the control, because a refusal binds no name and an unreadable config
is not "at `high-severity`". It is still an absolute, "only", that the code does not strictly bear out. The sentence was
the prior review's suggested wording word for word, so this is informational.
**Fix:** No change is needed for this plan. If the sentence is revisited under WR-01, "it gates a finding only by ..."
or a pointer to the recipe for the fail-closed cases would be exact.

### IN-02: The CHANGELOG sentence is pinned twice

**File:** `scripts/flow-guidance-text.test.ts:1669` and `scripts/flow-guidance-text.test.ts:1691-1695`
**Issue:** Plan 41-29 put the new sentence into the full-bullet `toContain` of the plan 41-28 test, "the changelog
Security bullet states the dial condition for the witness's name (CR-01; plan 41-28)". It also added its own CHANGELOG
assertion to the new test. One CHANGELOG edit now fails two tests, and the 41-28 test's title no longer describes all
the text it pins.
**Fix:** Keep one of the two. Either remove the new sentence from the 41-28 test's full-bullet string and let the 41-29
test own it (its three-part `toContain` already proves the sentence is adjacent to both neighbours), or drop the CHANGELOG
assertion from the 41-29 test.

---

_Reviewed: 2026-11-14T09:56:14Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
