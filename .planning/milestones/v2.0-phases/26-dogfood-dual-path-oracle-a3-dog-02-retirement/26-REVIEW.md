---
phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement
reviewed: 2026-07-02T14:27:28Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - scripts/dual-path-equivalence.ts
  - scripts/check-uat-oracles.ts
  - scripts/check-uat-oracles.test.ts
  - scripts/convergence-spine.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/measure-cost.ts
  - scripts/measure-cost.test.ts
  - scripts/worktree-dogfood.test.ts
  - scripts/e2e/uat-live.test.ts
findings:
  critical: 1
  warning: 3
  info: 4
  total: 8
status: issues_found
---

# Phase 26: Code Review Report

**Reviewed:** 2026-07-02T14:27:28Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the DOGF-01/02/03 dogfood + cost harness set and the `oracleParity → oracleDualPathEquivalence`
replacement. The honesty machinery is largely sound: `measure-cost.ts` never fabricates a number and defaults
to `UNKNOWN - verify` across every branch; the aggregator wiring in `check-foundation-guards.ts` folds the
oracle fail-count in lockstep (`FAILS += uatOracleFails()`) with no short-circuit path; `uat-live.test.ts`
stays gated behind a fail-closed `claudePresentAndAuthed` probe and asserts on-disk verdict/note-set rather
than deleted handoff filenames; the `assertEquivalent` RED non-vacuity test genuinely exercises divergence.

However, adversarial scrutiny of the review's HIGH-VALUE properties surfaced three real gaps:

1. **A cross-platform false-green (BLOCKER):** the standalone entry-point check in `check-uat-oracles.ts` uses
   a hand-built `file://` URL instead of the canonical `pathToFileURL` idiom every other script in `scripts/`
   uses. On Windows (a documented-supported platform) `node scripts/check-uat-oracles.js` silently runs **no**
   oracle and exits 0 — a fabricated green for a no-fabrication safety tool.
2. **A vacuity gap in the oracle's done/ sub-check (WARNING):** the done/ artifact equivalence compares path A
   to path B only for equality, never against the expected task set, so a `transition` no-op regression would
   pass with an empty done/ set on both sides.
3. **A non-total sort key in the single-source comparator (WARNING):** `projectTaskState` sorts by `(at, body)`
   only, which is order-fragile when two notes tie on those fields.

## Structural Findings (fallow)

No `<structural_findings>` block was provided with this review; none to normalize.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Standalone oracle entry-point check silently disabled on Windows / non-POSIX paths → false green

**File:** `scripts/check-uat-oracles.ts:510-518`
**Issue:** The direct-invocation guard is built by string-concatenating a `file://` URL:

```ts
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;
```

Every other script in `scripts/` (claim.ts:325, context-io.ts:1527, compactor.ts:660,
admission-server.ts:270) uses the canonical `import.meta.url === pathToFileURL(process.argv[1]).href`.
The hand-built form is not equivalent: on Windows `process.argv[1]` is `C:\...\check-uat-oracles.js`, so
`new URL("file://C:\\...")` normalizes to a different href than `import.meta.url`
(`file:///C:/.../check-uat-oracles.js`). The comparison is therefore **false**, `runAll()` never runs, and
`node scripts/check-uat-oracles.js` exits 0 having executed **zero** oracles and printed nothing — a silent
green for a tool whose entire purpose is no-fabrication. Windows is an explicitly supported platform (CLAUDE.md
tech-stack: "cross-platform execution ... including Windows where POSIX shell cannot run"). The primary gate
(`check-foundation-guards.js`) is unaffected because it runs its exit tail unconditionally and imports the
oracle bodies — but the standalone lane is documented (`node scripts/check-uat-oracles.js`) and spawned by the
test harness, so on Windows it produces a fabricated pass.
**Fix:**
```ts
import { pathToFileURL } from "node:url";
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
```

## Warnings

### WR-01: `oracleDualPathEquivalence` done/ artifact check is vacuously satisfiable

**File:** `scripts/check-uat-oracles.ts:447-452`
**Issue:** The done/ artifact equivalence compares the two paths only relative to each other:

```ts
const doneA = readdirSync(join(a.queueRoot, "done")).sort();
const doneB = readdirSync(join(b.queueRoot, "done")).sort();
if (JSON.stringify(doneA) !== JSON.stringify(doneB)) { divergence += ... }
```

It never asserts `doneA` equals the expected `["t1.md","t2.md","t3.md"]`. If `transition` (claim.ts:143,
`atomicRename`) ever regressed to a silent no-op — or if the seed never reached `done/` for any reason common
to both modes — then `doneA === doneB === []` and this sub-check passes on two **empty** sets. The verdict/stamp
checks (lines 463-472) are positive and would still catch a broken `appendNote`, but the done/ artifact claim —
one of the three convergence properties this oracle advertises ("same done/ artifact") — is not proven
non-vacuously. Note the sibling test `convergence-spine.test.ts:163` DOES make the positive assertion
(`expect(canonA.done).toEqual(["t1.md","t2.md","t3.md"])`), but the actual gate (the oracle) does not.
**Fix:** add a positive floor before/alongside the equality compare:
```ts
const expected = EQUIV_TASKS.map((t) => `${t}.md`).sort();
if (JSON.stringify(doneA) !== JSON.stringify(expected)) {
  divergence += `\n  done/ set on path A is not the seeded task set: ${JSON.stringify(doneA)}`;
}
// then keep the A===B compare as before
```

### WR-02: `projectTaskState` sort key `(at, body)` is not total → order-fragile comparator

**File:** `scripts/dual-path-equivalence.ts:51-53`
**Issue:** The projection sorts by `at` then `body` only:

```ts
.sort((a, b) => (a.at !== b.at ? a.at.localeCompare(b.at) : a.body.localeCompare(b.body)));
```

`assertEquivalent` then compares the two arrays index-by-index (line 67). If two surviving notes tie on both
`at` and `body` but differ in `kind`/`verified_by`/`confidence`/`refs`, `Array.prototype.sort` (stable) leaves
them in their pre-sort input order. Because the two replay modes feed notes in different orders, the two
projected arrays can end up index-misaligned, and the comparator would report a **false divergence** (a
spurious red) even though the two note-sets are equal as multisets — undermining the "order-independent"
guarantee this comparator exists to provide. The current fixtures avoid the tie (two notes per task with
distinct `at`), so it is latent, but the comparator is single-sourced into both the oracle and
`convergence-spine.test.ts`, so any future fixture with an `(at, body)` collision would flake.
**Fix:** make the sort total by extending the tiebreak chain over the remaining projected fields (e.g. append
`|| a.kind.localeCompare(b.kind) || a.verified_by.localeCompare(...) || JSON.stringify(a.refs).localeCompare(...)`),
or sort by a full deterministic serialization of the projected note.

### WR-03: `guard_context_writes` write-token regex matches a bare `>` → false-positive risk in prose

**File:** `scripts/check-foundation-guards.ts:578-583`
**Issue:** The write-token alternation includes `>>?`, which matches a single `>`:

```ts
const CTX_TOKEN = String.raw`writeFileSync|appendFileSync|\bWrite\b|>>?|\becho\b`;
const CTX_WRITE_RE = new RegExp(`(${CTX_PATH}.*(${CTX_TOKEN}))|((${CTX_TOKEN}).*${CTX_PATH})`);
```

Any scanned role/workflow line that both mentions `.grugops/context/` and contains a bare `>` anywhere on the
line — a markdown blockquote (`> note`), a prose arrow (`role -> .grugops/context/`, `flow --> context`), or an
HTML/XML fragment — will FIRE `guard_context_writes` and fail the build as a "raw context write," even though no
write is happening. The guard's own comment claims token-vs-prose care, but a bare `>` is exactly the kind of
prose punctuation that co-occurs with a path in documentation. The real-tree smoke test passes only because no
such line exists today; the calibration is fragile. (Pre-existing from Phase 20, but present in the reviewed
file and directly relevant to the guard's honesty claim.)
**Fix:** require redirect context rather than a bare `>` — e.g. match a redirect only when followed by a path
token (`>>?\s*\S`) and anchored away from arrows, or drop `>`/`>>` from the token set and rely on
`writeFileSync|appendFileSync|\bWrite\b|\becho\b` plus an explicit `\s>>?\s` redirect sub-pattern that excludes
`-?->`.

## Info

### IN-01: Unused `warn` helper in `check-uat-oracles.ts`

**File:** `scripts/check-uat-oracles.ts:80-82`
**Issue:** `const warn = (m: string) => { ... }` is declared but never called anywhere in the module (only
`pass`/`fail` are used). Dead code; also a latent `noUnusedLocals` snag if that flag is enabled.
**Fix:** remove the `warn` helper, or use it for the advisory paths it was intended for.

### IN-02: Projection silently drops `by` and `supersedes` — divergence confined to those fields is invisible

**File:** `scripts/dual-path-equivalence.ts:41-50`
**Issue:** `projectTaskState` maps each NoteRecord to `{kind, at, verified_by, confidence, refs, body}`,
dropping the author (`by`) and `supersedes` pointer. Dropping the nonce `id` is correct and documented; dropping
`by`/`supersedes` is not called out. Two dispatch paths that admit otherwise-identical notes under different
authors would be treated as equivalent. Defensible for the current "same admitted note-set" definition (the
fixture uses `by: "engineer"` for both paths), but worth an explicit comment so the omission is a decision, not
an accident.
**Fix:** either document that `by`/`supersedes` are intentionally excluded from the equivalence definition, or
include `by` in the projection if author is part of "the same admitted note-set."

### IN-03: Single-digit task-index assumption in the `at` template

**File:** `scripts/check-uat-oracles.ts:383-401` (also `convergence-spine.test.ts:80`, `worktree-dogfood.test.ts:176`)
**Issue:** `const n = task.replace(/[^0-9]/g, "") || "0";` is interpolated as `2026-06-21T10:0${n}:00.000Z`.
For a two-digit task index (e.g. `"t10"`, `n="10"`) this yields `10:010:00.000Z`, an invalid timestamp that
`Date.parse` would reject and that breaks the deterministic sort. `EQUIV_TASKS` is fixed to `t1/t2/t3`, so it is
latent, but the pattern is copied across three files and would silently misbehave if the seed grew past 9 tasks.
**Fix:** zero-pad and build a valid time component, e.g. derive minutes/seconds from the index safely
(`String(i).padStart(2,"0")`) or use a Date constructed from an integer offset.

### IN-04: Stale test-tag comment references the retired "parity" name

**File:** `scripts/check-uat-oracles.test.ts:15`
**Issue:** The header comment says cases are runnable by `-t "parity"`, but the equivalence cases are tagged
`"equivalence"` (lines 216, 227); no case matches `-t "parity"` after the `oracleParity → oracleDualPathEquivalence`
rename. Minor doc drift left over from the replacement.
**Fix:** update the comment to `-t "wording" / -t "wiring" / -t "equivalence"`.

---

_Reviewed: 2026-07-02T14:27:28Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
