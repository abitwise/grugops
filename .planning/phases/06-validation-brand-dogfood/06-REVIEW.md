---
phase: 06-validation-brand-dogfood
reviewed: 2026-06-04T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - scripts/validate-agent-factory.mjs
  - scripts/validate.test.sh
  - README.md
  - NOTICE
  - CONTRIBUTING.md
  - docs/faq.md
  - docs/dogfood-human-runbook.md
  - examples/01-greenfield-bootstrap.md
  - examples/02-brownfield-bootstrap.md
  - examples/03-ticket-to-pr.md
  - examples/04-sprint-cycle.md
  - examples/05-release-run.md
  - brand/wordmark.svg
  - brand/wordmark-mono-dark.svg
  - brand/wordmark-mono-light.svg
  - brand/wordmark-lockup.svg
  - brand/icon.svg
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: resolved
resolution:
  fixed: [CR-01, WR-01, WR-02, WR-03, WR-04]
  deferred: [IN-01, IN-02, IN-03, IN-04]
  note: "All Critical + Warning findings fixed atomically (commits 015787a, a8507c5, e3256d9, 6c7dfee, 5b2843f). Validator self-test ALL CHECKS PASSED; validator exits 0 bare + --strict. Info findings left for follow-up."
---

# Phase 06: Code Review Report

**Reviewed:** 2026-06-04
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Reviewed the Phase-6 validation/brand/dogfood deliverables: the Node ESM structure validator
(`scripts/validate-agent-factory.mjs`), its POSIX-sh self-test (`scripts/validate.test.sh`),
six markdown docs (README, NOTICE, CONTRIBUTING, FAQ, dogfood runbook), five worked examples,
and five brand SVGs.

The validator is well-constructed and its self-test runs green (10/10 PASS), but it contains one
real crash path that violates its own stated fail-closed invariant: an unreadable-but-present
`plugin.json` causes an **uncaught `TypeError`** because `JSON.parse(null)` returns `null` (it does
NOT throw, so the surrounding try/catch never fires) and the code then dereferences `manifest.name`.
This crashes the gate instead of producing a finding — a correctness defect in a tool whose whole
value is "the gate can actually fail."

The highest-signal doc finding is a **no-fabrication integrity contradiction**: `examples/01` and
`examples/03` both claim to be REAL captures (both dated 2026-06-03) of the *same* sample app and
*same* ticket ABC-001, yet `01` states the `lint` command slot was honestly left `UNKNOWN - verify`
while `03` reports `lint` as a verified command that ran (`tsc --noEmit -> rc 0`). One of the two
"REAL run" captures is internally inconsistent with the other — exactly the integrity failure the
project's no-fabrication constraint exists to prevent.

Brand/IP checks PASS for all in-scope files: `grugops` is consistently lowercase, no bare `/grug`
command literal appears (only `/grugops` and `/grugops:<op>`), the grugbrain.dev attribution and
non-affiliation disclaimer are intact in README and NOTICE, and all SVG geometry is sound (the
lockup viewBox width 472 = 112px icon shift + 360 wordmark width, exact, no clipping).

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: `JSON.parse(null)` does not throw — unreadable `plugin.json` crashes the validator with an uncaught TypeError

**File:** `scripts/validate-agent-factory.mjs:302-313`
**Issue:** In `checkPackaging()`, when `.claude-plugin/plugin.json` **exists** but `safeRead` returns
`null` (file unreadable — EACCES/permission-denied, a transient I/O error, or the path is a
directory), the code does `JSON.parse(raw)` with `raw === null`. `JSON.parse(null)` coerces `null`
to the string `"null"` and returns the value `null` — **it does not throw**, so the `try/catch` at
lines 304-309 never fires. Execution falls through to line 311 `typeof manifest.name`, dereferencing
`null.name`, which throws an **uncaught `TypeError: Cannot read properties of null (reading 'name')`**
that crashes the entire validator before any findings are rendered or the exit code is set.

This directly violates the invariant stated in the file's own header (lines 22-24): "Every
read/JSON.parse is wrapped in try/catch so a missing or garbled file becomes a finding, never an
unhandled throw." The parallel `checkConfig()` (lines 238-246) is safe only because it `return`s
early when `raw === null` (line 239) — `checkPackaging()` is missing that guard. Verified
empirically: `node -e 'JSON.parse(null)'` returns `null` (no throw), and dereferencing `.name` on it
throws `TypeError`.

**Fix:** Add the same null-guard `checkConfig` uses, before parsing:
```js
const rel = ".claude-plugin/plugin.json";
if (exists(rel)) {
  const raw = safeRead(rel);
  if (raw === null) {
    err(`${rel}: present but unreadable`);
    return;
  }
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch {
    err(`${rel}: not valid JSON`);
    return;
  }
  if (typeof manifest.name !== "string" || manifest.name.trim() === "") {
    err(`${rel}: missing or empty required field "name"`);
  }
}
```

## Warnings

### WR-01: No-fabrication contradiction — `examples/01` and `examples/03` disagree on whether `lint` was a verified command in the same "REAL" capture

**File:** `examples/01-greenfield-bootstrap.md:82-84` and `examples/03-ticket-to-pr.md:107`
**Issue:** Both files are headed `> Real run — captured 2026-06-03` and describe the *same* sample
app and *same* ticket `ABC-001`. `examples/01` (line 83-84) states the AGENTS.md command slots were
filled with "real verified" commands and the unverifiable ones — explicitly "eslint/prettier/e2e" —
were "honestly left `UNKNOWN - verify`, never fabricated." But `examples/03` (line 107) reports the
quality gate running `lint  tsc --noEmit  -> rc 0` using "the commands pulled from the sample's
`AGENTS.md` slots." If the lint slot was honestly `UNKNOWN` at bootstrap (per `01`), there is no
verified lint command for the gate to have run (per `03`); the gate has substituted `tsc --noEmit`
(a typecheck) for lint and reported it as a passing `lint` gate. This is precisely the
no-fabrication failure mode the project guards against: two "REAL" captures of one run that cannot
both be true. (Additionally, `lint`, `typecheck`, and `build` in `03` lines 107-110 all run
`tsc --noEmit`, so the "lint" and "build" gates are not actually linting or building.)
**Fix:** Reconcile the two captures from the actual recorded run. Either (a) `01` should show the
lint slot filled with whatever genuinely ran, or (b) `03` should mark the `lint` (and `build`) gate
rows `UNKNOWN - verify` / "skipped — no lint script" rather than reporting `tsc --noEmit -> rc 0`
under the `lint` label. Do not relabel a typecheck as a passing lint.

### WR-02: Self-test "column" assertion is a false-positive — the `boardHasColumn === false` branch is never exercised

**File:** `scripts/validate.test.sh:77` (validates `scripts/validate-agent-factory.mjs:280-281`)
**Issue:** Line 77 claims to prove a column finding (`BAD bad-ticket-mismatch → nonzero + 'column'`)
but the only finding the `bad-ticket-mismatch` fixture produces is the *status*-mismatch message:
`status "in-review" does not match column "In Development"`. The word "column" the test greps for
appears inside that status message, not in a distinct "column is not a board column" error. The
fixture's ticket column (`In Development`) IS a valid board column, so the
`if (column && !boardHasColumn(column))` branch at validator lines 280-281 is never triggered by any
fixture. The test gives false confidence that the column-membership check is covered; a regression
that breaks `boardHasColumn` would not be caught.
**Fix:** Add a dedicated fixture (e.g. `bad-ticket-bad-column`) with a ticket whose `column:` is not
a board heading (e.g. `column: Nonexistent Column`), and assert the distinct finding
`is not a board column`. Then make line 77 grep that fixture for `not a board column` instead of the
overlapping `column` substring.

### WR-03: `boardHasColumn` prefix match accepts a word-prefix of a real column as valid

**File:** `scripts/validate-agent-factory.mjs:272-273`
**Issue:** `boardHasColumn(col)` returns true when any board line `startsWith("## " + col + " ")`.
Because real columns are followed by ` (WIP …)`, a malformed ticket column that is a *word-prefix*
of a real column falsely validates: `col = "In"` matches `## In Development (WIP 0/3)`, and
`col = "Ready for"` matches `## Ready for Dev (WIP 0/6)` (verified). A genuinely wrong column like
`In` would slip through the membership check instead of being flagged. Severity is limited because
real tickets carry full column names, but it weakens the very contract this check exists to enforce.
**Fix:** Match the column name terminated by the WIP marker or end-of-heading rather than a bare
trailing space, e.g. test against a normalized heading: strip ` (WIP …)` from each `## ` line and
compare for equality with `col`, instead of `startsWith(col + " ")`.

### WR-04: Real person's name used as approver/confirmer in an explicitly *illustrative* (non-captured) release example

**File:** `examples/05-release-run.md:116-117`
**Issue:** The file is headed `> Illustrative run — expected output, not a captured session` and
states (line 8) that `REL-0007` and `<PR-link>` are "obvious placeholders, not real artifacts." But
the approval record fills in a real, identifiable person — "Olger Oeselg (release lead)" approving and
confirming a production action dated 2026-06-20 — in an event that, per the file's own header, never
happened. This attributes a specific production-deploy approval to a named individual in fabricated
content, which sits awkwardly against the no-fabrication posture and is a mild integrity/privacy
concern in a *safety* (deploy-gate) section.
**Fix:** Use an obvious placeholder consistent with the rest of the file, e.g.
`Approved by: <release-lead name> — <date>` / `Confirmed by: <named human> — <date>`, matching the
`<PR-link>` placeholder convention already used on line 134.

## Info

### IN-01: `build` gate runs `tsc --noEmit`, which does not produce a build artifact

**File:** `examples/03-ticket-to-pr.md:110`
**Issue:** The `build` gate row reports `build  tsc --noEmit -p tsconfig  -> rc 0` — identical to the
`typecheck` row (line 108). `tsc --noEmit` explicitly emits nothing, so the "build" gate did not
build anything; it ran a second typecheck. For a "REAL run" capture this slightly overstates what the
build gate verified.
**Fix:** Either show the real build command (e.g. `tsc -p tsconfig` / `npm run build`) or annotate
that the minimal sample has no separate build step and the build gate degenerates to a typecheck.

### IN-02: Capture-date vs ticket-date inconsistency in the greenfield example

**File:** `examples/01-greenfield-bootstrap.md:3` vs `:72`
**Issue:** The header says `captured 2026-06-03`, but the seeded ticket on line 72 (and the trace row
context) carries `since: 2026-06-04` — one day after the run was supposedly captured. Minor, but for a
"REAL run" artifact the dates should agree.
**Fix:** Align the `since:` date with the capture date (or vice versa) to whatever the actual run
recorded.

### IN-03: Unit-test gate command uses `**` globstar, which is off by default in POSIX sh/bash

**File:** `examples/03-ticket-to-pr.md:109`
**Issue:** The unit gate shows `node --test src/**/*.test.ts`. The `**` recursive glob is not enabled
by default in `sh` or in bash without `shopt -s globstar`; in a default shell the literal
`src/**/*.test.ts` (or a single-level expansion) is passed to node, which may not match the intended
files. As a copy-pasteable "command that ran," this is shell-portability-fragile.
**Fix:** Use a portable form, e.g. `node --test 'src/*.test.ts'` matching the actual sample layout
(the diffstat on line 129 shows `src/version.test.ts`, a single-level path), or note the globstar
requirement.

### IN-04: `checkPackaging` re-checks `adapters.md` already covered by `checkRequiredFiles`

**File:** `scripts/validate-agent-factory.mjs:298-300` vs `:208`
**Issue:** `checkRequiredFiles()` already asserts `agent-factory/packaging/adapters.md` exists (line
208), and `checkPackaging()` asserts the same file again (lines 298-300), producing a duplicate
`missing required ... adapters.md` error if it is absent. Harmless dead-duplication, but it muddies
the finding output and the single-responsibility split between the two checks.
**Fix:** Drop the redundant existence check from `checkPackaging()` and let that function own only the
`plugin.json` validation.

---

_Reviewed: 2026-06-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
