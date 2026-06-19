---
phase: 22-memory-trajectory-compaction-dialable-token-economy
reviewed: 2026-06-19T00:00:00Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - scripts/context-io.ts
  - scripts/compactor.ts
  - scripts/context-io.test.ts
  - scripts/compactor.test.ts
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 22: Code Review Report (round-6, CMP-02 multi-note read-path)

**Reviewed:** 2026-06-19
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The round-6 change closes the **5th CMP-02 bypass** (multi-note thread file) by introducing a
shared body-consuming splitter `splitNotes()` in `context-io.ts` and a per-note `readNoteDir()` in
`compactor.ts` that keys each recovered note `<file>#<n>`. I verified the fix empirically against
both the committed `.js` and a freshly-compiled **pre-fix** build (commit `14bb3ee~1`).

**No live 6th bypass was found.** I could not construct any writer-reachable corpus that drops a
load-bearing provenance field (`verified_by` / `supersedes` / `by` / `at` / a required
`failed-attempt` id) at exit 0. Specifically I confirmed, by running the compiled artifacts:

- splitNotes recovers buried note #2 in the body-`---` fixture (count 2, no malformed lines).
- The byte round-trip property (`notes.join("") + (trailingMalformed ?? "") === normalized`) holds exactly.
- `idx:` / `id_foo:` / inline body `id:` do NOT spawn false boundaries.
- Both note-emitting paths — `composeNote` (context-io.ts:504) and `composeThreadNote`
  (compactor.ts:592), and therefore `appendNote` / `emitVerdict` — emit `id:` as the FIRST
  frontmatter line. So the executor's `isNoteOpeningLine = /^id:/` deviation from the plan's IN-02
  "ANY recognized frontmatter line" contract is **safe given the current writers**.
- Free trailing scratch (no-`note` `writeThread`) is glued into a body and carries no fenced
  provenance field — it genuinely cannot smuggle a load-bearing field (test #3's claim is correct).
- The build-output freshness gate is green: the committed `.js` is a faithful build of the `.ts`.
- Full suite: 225/225 pass (compactor + context-io); all 5 round-6 tests pass against committed code.

However, the safety invariant now rests on an **undocumented, untested, unguarded cross-module
ordering contract** ("every note-emitting writer must place `id:` first"). I reproduced the exact
5th-bypass shape — a §14-gate-verified finding silently dropped at exit 0 — by perturbing only that
ordering (WR-01 below). It is not reachable through a sanctioned writer today, so it is a WARNING,
not a Critical; but it is precisely the regression the plan warned `splitNotes` drifting from
`parseNote` "would be the 6th bypass." The fix should be hardened so a benign field-reorder cannot
silently re-open the hole. Two further WARNINGs concern test-integrity (a non-discriminating round-6
test) and a writer-reachable false-refusal.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: `splitNotes` boundary couples the safety invariant to an unguarded "id-first" writer contract; a field reorder silently re-opens the 5th bypass

**File:** `scripts/context-io.ts:273-275` (`isNoteOpeningLine`), `:324-325` (`isBoundaryAt`)
**Issue:**
The round-6 executor narrowed the note-boundary predicate to `---` followed by a column-0 `id:`
line (`isNoteOpeningLine = /^id:\s*(.*)$/`), a strict subset of the plan's IN-02 contract
(`---` + ANY recognized frontmatter line). This is correct ONLY because both current writers freeze
`id:` first. The invariant is not enforced anywhere — there is no guard, no test, and no comment
coupling the two writers' field order to the splitter.

I reproduced the resurrected bypass directly (compiled `.js`): a thread file whose note #1 is
id-first (a real boundary) and whose note #2 is **kind-first** (a §14-gate-verified finding, `id:`
on the second frontmatter line) folds note #2 entirely into note #1's body:

```
splitNotes(note1_idFirst + note2_kindFirst)
  => note count = 1, trailingMalformed = null
     note[0] kind=observation, validateFindings=0   (the verified finding is now body text — HIDDEN)
```

`readNoteDir` then records ONE note, the required-survival set never includes the finding, and
`checkCarveOut` returns exit 0 "carve-out intact" while a verified finding was dropped — byte-for-byte
the 5th bypass. A future refactor of `composeNote`'s field order, or any new writer that does not
emit `id:` first, silently regresses the safety oracle with a fully green suite.

**Fix:** Restore the plan's IN-02 contract — make the boundary predicate `---` followed by ANY
recognized frontmatter line (reuse `parseNote`'s recognized-line set, not just `/^id:/`), so the
splitter cannot drift from the parser. AND add a fail-closed test that a non-`id`-first note (e.g.
kind-first) buried as note #2 is either recovered or refused — never folded into a prior body.
Minimum hardening if the `id:`-only predicate is kept: a single fail-closed test asserting the
mixed-ordering case refuses, plus a structural guard/comment that both `composeNote` and
`composeThreadNote` emit `id:` first.

### WR-02: round-6 test #3 (scratch-then-fence) is NOT RED-first — it passes against the pre-fix code, so it does not discriminate the bypass

**File:** `scripts/compactor.test.ts:1874-1927`
**Issue:**
Running all five round-6 tests against a freshly-compiled **pre-fix** build (`14bb3ee~1`) yields
4 RED (correctly failing) and **1 GREEN**: test #3, "a scratch-then-fence thread file fails closed."
It passes before the fix because the pre-fix `parseNote`-once read path already returns null on the
leading un-fenced scratch and fails closed for an unrelated reason — it does not exercise the
multi-note read-path fix at all. A test that passes against the code it is meant to pin proves
nothing about the fix. The other four round-6 tests are genuinely discriminating (verified RED→GREEN).

The reframing from scratch-LAST to scratch-FIRST (documented in the test's own comment,
:1864-1873) sidesteps a real seam: trailing free-scratch glued after a real note is
byte-indistinguishable from a longer body, so it cannot be detected. I confirmed that gap is
**safe** — trailing scratch lives in a body and carries no fenced provenance field — so the carve-out
contract is not weakened. The defect is test-integrity only: #3 is a non-discriminating filler that
should not be counted as evidence of the round-6 closure.

**Fix:** Either delete test #3 or replace it with a genuinely RED-first case that exercises the new
read path (e.g. a multi-note file where note #1 is fenced and a non-boundary remainder follows note
#2, asserting the file is refused naming `<agent>.md`, RED against the pre-fix .js). Add an explicit
comment that trailing free-scratch carries no provenance field by construction, so its
non-detectability is a deliberate, safe non-goal rather than an untested gap.

### WR-03: a faithful note whose body legitimately contains the literal sequence `\n---\nid:` is falsely refused (writer-reachable false-positive)

**File:** `scripts/context-io.ts:324-347` (`isBoundaryAt` / note slicing), consumed at `scripts/compactor.ts:191-208`
**Issue:**
The body is arbitrary agent text. An agent that distills a thread quoting another note, or documents
the note schema, can legitimately write a body containing `---\nid: <example>`. splitNotes treats
that body line as a real boundary and splits one faithful note into two; the second slice has no
closing fence, `parseNote` returns null, and `readNoteDir` routes it to `unparseable` → exit 1
"carve-out FAIL." I reproduced this through the real `writeThread`:

```
writeThread(body = "... A note looks like:\n---\nid: ...EXAMPLE\nkind: finding\n...")
  => splitNotes count = 2; note[1] = (null parse) -> fail closed (false refusal)
```

This fails in the SAFE direction (refuse, not admit), so it is not a security bypass — but it blocks
an otherwise-correct compaction and surfaces as a confusing "no valid frontmatter fence" error on a
note the agent wrote correctly. Likelihood is non-trivial precisely because these scripts' job is to
manage notes, so note-shaped text in bodies is plausible.

**Fix:** Document the body restriction in the `context-note.md` contract and the splitter comment
(a note body must not contain a column-0 `---` line immediately followed by a column-0 `id:` line),
and ideally have the WRITE path (`composeThreadNote` / `appendNote`) detect such a body at compose
time so the failure names the real cause ("body contains a fence-like sequence") rather than
surfacing downstream as an unparseable-note refusal.

### WR-04: an indented / non-column-0 `id:` opening line silently hides a buried note (latent, not writer-reachable today)

**File:** `scripts/context-io.ts:273-275` (`isNoteOpeningLine` is column-0 only)
**Issue:**
`isNoteOpeningLine` matches `id:` only at column 0. A note whose frontmatter opens with an indented
`id:` (e.g. ` id:`) is not recognized as a boundary; the entire note (including a §14-gate-verified
finding) is folded into the prior note's body with **no malformed-line signal and a passing
validate()** — count drops by one and the buried note is invisible:

```
splitNotes(obs + "\n---\n id: <finding>\nkind: finding\nverified_by: §14-gate#RUN7\n...")
  => note count = 1, malformedLines = [], validateFindings = 0   (the finding is HIDDEN in the body)
```

This is NOT reachable through a sanctioned writer (both writers emit a column-0 `id:`), so it is
latent. It is closely related to WR-01: both show that when the splitter's boundary recognition fails
to fire, the note is dropped silently rather than failing closed. The round-4/5 hardening added
malformedLines/validate gates that fail closed on a recognized-but-malformed in-fence line, but a
note hidden because its opening line was never recognized as a boundary bypasses those gates entirely
(its frontmatter never becomes a parsed fence).

**Fix:** Same root remediation as WR-01 — broaden the boundary predicate to the parser's recognized
line set, and/or have splitNotes treat a `---` line whose successor looks like frontmatter
(`<key>:` at any indent, or a `key : value` shape) but is not a clean boundary as a fail-closed
remainder rather than silently absorbing it into a body. Add a unit test for the indented-id shape.

## Info

### IN-01: round-6 source change sits outside the declared diff base

**File:** review config `diff_base: 5bb15cd`
**Issue:** The configured diff base `5bb15cd` is a docs commit; the actual round-6 read-path change
is `14bb3ee` (splitNotes + per-note readNoteDir) and `b30243a` (noteId export). Reviewing strictly
against `5bb15cd..HEAD` would conflate planning churn with the code change. I reviewed the full
current state of the four files and verified RED-first against `14bb3ee~1` instead. No action needed
beyond noting the diff base for downstream consumers.

### IN-02: `readContext` and `render` (context-io.ts) still read one `parseNote` per `notes/<id>.md`, by design

**File:** `scripts/context-io.ts:567-597` (`readContext`)
**Issue:** The multi-note splitNotes path is applied only in the compactor's `readNoteDir`. The
promoted `notes/` tier is one-note-per-file (appendNote writes a fresh `<id>.md` each call), so the
single-`parseNote` read there is correct and not a buried-note risk. Confirmed for completeness — no
defect. (The previously-deferred readContext fail-open and id/filename divergence remain out of
round-6 scope; the round-6 change did not make them newly reachable.)

---

_Reviewed: 2026-06-19_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
