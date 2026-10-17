---
phase: 31-autonomous-manual-testing
plan: 29
subsystem: safety-guards
tags: [context-io, size-ceiling, governance-root, audit-ledger, residual-register, ast-derivation]

requires:
  - phase: 31-21
    provides: "D-24's one non-blocking regular-file reader and its size ceiling — the bound this plan puts on the side that admits, and the note-then-ledger order it re-measures as a control"
  - phase: 31-22
    provides: "D-25's canonical origin form, a CONJUNCTION of shape and root anchoring — the rule this plan applies to the DESTINATION, which D-25 left unconstrained as R-31-22-02"
  - phase: 31-27
    provides: "D-29's tier 0, canonicalDirectoryPath and the `.temp/**` runner exclusion — the root resolution this plan's destination binding is measured against"
provides:
  - "NOTE_FILE_MAX_BYTES and AUDIT_LEDGER_MAX_BYTES exported and enforced on BOTH sides, with the write side refusing at composition before anything is created"
  - "NOTE_ABOVE_CEILING_CLAUSE / LEDGER_ABOVE_CEILING_CLAUSE and a ReadPositionRefusal discriminant — an over-ceiling regular file gets its own honest clause"
  - "governanceRootOf: ONE exported authority for which repository owns a context store, called by the origin end and the destination end alike"
  - "promoteAdmitted's note write and GOV-02 event keyed on one derived destinationRoot, with a destination-outside-governed-store decline"
  - "NOTE_SKIP_ARMS: three named, counted skip arms reported in render's conditional Skipped entries section"
  - "WRITE_PATH_RESIDUALS — the write path's five residuals as an exported register with a two-sided binding"
  - "a recursive, scope-attributing deriveFsBlockingSites plus a derived ceiling-site axis (9 sites, 0 literals)"
  - "decision D-31 in 31-CONTEXT.md, with its rejected alternative named and a 'what D-31 does NOT establish' block"
affects: [31-30, 31-31, context-io, promote-admitted, write-path]

actuals:
  # estimateTokens scale (chars/4) over the realized diff for the WHOLE plan range,
  # e1ca867..HEAD — 252,491 chars. The code-only slice (scripts/ hooks/ agent-factory/ docs/)
  # is 238,343 chars = 59,585. Estimate was 90,000; the plan came in under it.
  tokens: 63122
  tasks: 3
  commits: 6
plan_head_before: e1ca8672bd67c0a9287ca5a4c7f903bca30e3960

tech-stack:
  added: []
  patterns:
    - "a bound is owned by the side that ADMITS — a write that succeeds may never produce an object a reader is required to refuse"
    - "two halves of one action are keyed on ONE variable, derived rather than accepted as two arguments"
    - "one authority for the CONDITION, one register per position for the NAME — a discriminant on the error, never a match on message text"
    - "when a fixture must move for a behaviour change, ask first whether it was passing for the WRONG reason"
    - "a derived axis's WALK is itself a degree of freedom — assert which SCOPES it can see, not only what it counts"

key-files:
  created:
    - docs/audit/29-style-dispositions/31-29.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/compactor.test.ts
    - scripts/nonblocking-reader-parity.test.ts
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/18-context-compaction.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md

key-decisions:
  - "D-31 (1): a bound is enforced on the side that ADMITS. The write side refuses an over-ceiling note at composition time, the read side keeps its own refusal for a file it did not write, and BOTH read one exported constant."
  - "D-31 (2): two halves of one action are keyed on ONE variable. The owning repository is DERIVED from the destination store through governanceRootOf; repoRoot still answers the governance dial and no longer decides where an audit record lands."
  - "D-31 (3): a refusal NAMES the condition that is true. An over-ceiling REGULAR file carries its own clause, distinct from the shape clause, decided by a discriminant rather than by message text."
  - "REJECTED ALTERNATIVE, named at the site and in D-31: leave `to` unconstrained and record that an unanchored destination gets no audit record. It makes the workflow's sentence true by WEAKENING the guarantee — the claim-follows-mechanism move run backwards."
  - "The ledger's ceiling BOUNDS THE APPEND rather than dropping the read ceiling and streaming the look; streaming would remove the operational limit rather than honour it, and would surface exhaustion later than a human can act on it."
  - "MEASURED CORRECTION to WR-28: the forgery price is THREE inside a CONFIGURED repository, TWO inside one carrying a marker and no configuration, TWO outside every repository. The variable is the enclosing repository's configuration, not the fact of being inside one."
  - "MEASURED CORRECTION to this plan's own first spelling of a control: a FIFO ledger is refused at open(2) with ENXIO, one branch EARLIER than the fstat shape branch the case assumed."
  - "31-28's SUMMARY recorded `npm run typecheck` (all three targets) as clean; it was not. A pre-existing error in scripts/runnable-ref/uat-spec-integrity.test.ts failed the gate and is fixed here as a Rule 3 blocker."

patterns-established:
  - "Widening a derived walk is legible, never absorbed: reproduce the OLD walk in a control and assert the new member set loses nothing."
  - "When a behaviour change forces a fixture to move, check whether the fixture was green for the wrong reason before re-aiming it."
  - "Split prose to meet a writing-profile bound; never narrow the scan set to reach green."

requirements-completed: [UATX-01]

coverage:
  - id: D1
    description: "CR-19: an over-ceiling note is refused at the write side with its own clause and nothing written; the read side and the write side agree at ceiling-1, ceiling and ceiling+1."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "scripts/context-io.test.ts#31-29 — CR-19: the note ceiling is enforced on the side that ADMITS"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#31-29 — every byte ceiling is ONE binding, read by both sides"
        status: pass
    human_judgment: false
  - id: D2
    description: "CR-19's second half: an over-ceiling REGULAR file is refused with the ceiling clause and a FIFO/directory with the shape clause; no refusal asserts a condition false of its file."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "scripts/context-io.test.ts#THE CLAUSE NAMES THE CONDITION THAT IS TRUE: three shapes, two clauses, no false sentence"
        status: pass
    human_judgment: false
  - id: D3
    description: "The GOV-02 ledger's append is bounded by the same exported constant its read enforces, with the boundary driven on both sides."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "scripts/context-io.test.ts#31-29 — CR-19: the GOV-02 ledger's two sides agree at the boundary too"
        status: pass
    human_judgment: false
  - id: D4
    description: "CR-20: a promotion's note and its GOV-02 event name ONE repository, derived from the destination; repoRoot can no longer decide where the record lands."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "scripts/context-io.test.ts#GREEN 1+3: with `to` and `repoRoot` under DIFFERENT roots, BOTH halves follow `to`"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#`repoRoot` no longer appears in the ledger path composition — derived from the AST"
        status: pass
    human_judgment: false
  - id: D5
    description: "A destination outside a governed store declines by name with nothing written and a zero ledger delta in every candidate repository."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "scripts/context-io.test.ts#GREEN 2: a `to` under NO governed root DECLINES by name, with nothing written anywhere"
        status: pass
      - kind: integration
        ref: "scripts/context-io.test.ts#R-31-22-02 (CLOSED by 31-29, D-31): the five destination shapes, RE-DECIDED"
        status: pass
    human_judgment: false
  - id: D6
    description: "WR-28: the forged-origin price is measured per position and the three artifacts that carry it state the same three numbers."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "scripts/context-io.test.ts#31-29 — WR-28: the forged-origin price is measured PER POSITION, and the three agree"
        status: pass
    human_judgment: false
  - id: D7
    description: "The two 18-context-compaction.md ledger sentences are true of the mechanism after the single-root binding."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-29 — the two workflow sentences are TRUE of the mechanism"
        status: pass
    human_judgment: false
  - id: D8
    description: "WR-27: the read-site derivation sees arrows, class methods and the entry block, proven by three mirrors each moving the count by exactly one, losing no prior member."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#31-21 — the filesystem-site axis is a control, not a coincidence"
        status: pass
    human_judgment: false
  - id: D9
    description: "IN-14: the three note-skip arms produce three distinct observable results, are counted, and are reported in render output."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "scripts/context-io.test.ts#31-29 — IN-14: a skipped entry is named by its arm, counted, and reported"
        status: pass
    human_judgment: false
  - id: D10
    description: "WRITE_PATH_RESIDUALS is exported with an asserted cardinality and a two-sided binding, both directions named, with a seeded undispositioned member proving it can go red."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-29 — the write path's residuals are an EXPORTED register, bound in both directions"
        status: pass
    human_judgment: false
  - id: D11
    description: "The frozen floors moved with their artifacts and nothing was relaxed: hooks/guard.ts byte-identical to FROZEN_GUARD_BLOB, the DECIDER_MANIFEST digest MOVED, package.json unchanged."
    requirement: UATX-01
    verification:
      - kind: other
        ref: "git hash-object hooks/guard.ts == 669725bc1c616ab57123e22090d93d57eff1b001; git diff --stat e1ca867..HEAD -- package.json EMPTY"
        status: pass
      - kind: unit
        ref: "scripts/floor-invariance.test.ts (136 passed)"
        status: pass
    human_judgment: false

duration: 78 min
completed: 2026-09-10
status: complete
---

# Phase 31 Plan 29: A Bound Is Owned by the Side That Admits Summary

**Both byte ceilings enforced at the admitting side behind one exported constant each, a promotion's note and its GOV-02 event keyed on one derived destination root, three named skip arms replacing one silence, and the read-site axis taught to see every scope it always claimed to.**

## Performance

- **Duration:** 78 min
- **Tasks:** 3
- **Files modified:** 12 (11 modified, 1 created)
- **Commits:** 6 (3 task commits, the SUMMARY, the state advance, and the UATX-01 revert)

## Accomplishments

- **CR-19 closed.** The note ceiling lived on the read side only, so the writer could create an object every one of its own readers was required to refuse. Now enforced at composition, before `mkdirSync` and `atomicWrite`, with both sides reading one exported `NOTE_FILE_MAX_BYTES`. The same reconciliation at the ledger.
- **CR-19's second half closed as its own defect.** An over-ceiling regular file was refused with a clause asserting it "is not absent, or a regular file" — false of the file. It now carries `NOTE_ABOVE_CEILING_CLAUSE`, decided by a `ReadPositionRefusal` discriminant rather than by matching message text.
- **CR-20 closed.** The note write keyed on `to` and the GOV-02 event on `repoRoot`. One exported authority, `governanceRootOf`, now answers for both ends of a promotion, and a destination outside a governed store declines by name before anything is written.
- **WR-28 corrected.** The forgery price is three positions, not two: three ops inside a *configured* repository, two inside one carrying a marker and no configuration, two outside every repository.
- **IN-14 closed.** Three facts stopped sharing one `catch { continue; }` and one silence.
- **WR-27 closed.** The axis that exists to prevent set-literal drift was itself blind to every scope but one.
- **`WRITE_PATH_RESIDUALS` exported** with the same two-sided binding the other three registers carry — the asymmetry round 5's own closing measurement recorded.

## Task Commits

1. **Task 1: One bound, owned by the side that admits (CR-19)** — `043aa9f` (fix)
2. **Task 2: One action, one repository (CR-20, R-31-22-02, WR-28)** — `a81ba78` (fix)
3. **Task 3: The registers and the axis that were supposed to catch this (WR-27, IN-14, D-31)** — `daa5e58` (feat)

## The measurements

### CR-19 — RED against the committed `.js` at HEAD, then GREEN

The round-6 verifier's own probe, re-driven verbatim:

```
body bytes = 9437184
appendNote RETURNED id = 20260910T000000Z-engineer-observation-3e67edaf
notes dir listing = ["20260910T000000Z-engineer-observation-3e67edaf.md"]
on-disk bytes = 9437353 isFile = true
readContext length = 0
```

The byte count matches `31-VERIFICATION.md`'s own CR-19 measurement exactly. The note is not corrupt, not refused and not logged — invisible to `readContext`, `render`, `currentState`, `admit()`'s cross-check and `promoteAdmitted`'s liveness clause alike.

The false refusal, quoted in full beside a `stat` that contradicts it:

```
STAT: isFile = true isFIFO = false isDirectory = false size = 9437353
context-io.writeNoteFile: refusing to write (note-path-not-a-regular-file) — the note
destination "…/20260910T000000Z-engineer-observation-3e67edaf.md" is not absent, or a
regular file, so it is REFUSED rather than waited on and rather than replaced.
```

The clause and the sentence are both false of a 9,437,353-byte regular file. That is a fabricated claim about the mechanism, not a wording problem.

**GREEN, with the directory listing rather than the return value as the witness:**

```
refused clause present = true
notes dir exists after refusal = false
task dir listing = (task dir absent)
```

The refusal precedes `mkdirSync`, so not even the notes directory is created.

**ADJACENCY, driven on BOTH sides** (ids of identical length, so the composed frontmatter overhead — 168 bytes — is constant across the triple; an earlier spelling of this probe calibrated against an auto-generated id and mislabelled the whole triple by one byte):

| target | WRITE side | READ side (planted regular file) |
|---|---|---|
| ceiling−1 = 8,388,607 | ADMITTED, on-disk 8,388,607 | ADMITTED, 8,388,607 chars |
| ceiling = 8,388,608 | ADMITTED, on-disk 8,388,608 | ADMITTED, 8,388,608 chars |
| ceiling+1 = 8,388,609 | REFUSED (`note-above-size-ceiling`), file absent | REFUSED, condition `above-ceiling` |

The two sides agree at every point. The read side is driven on planted files rather than through the writer, so it is measured independently.

**Three shapes, two clauses, no false sentence:**

| planted at the note destination | stat | clause |
|---|---|---|
| over-ceiling REGULAR file | isFile=true | `note-above-size-ceiling` |
| FIFO | isFIFO=true | `note-path-not-a-regular-file` |
| directory | isDir=true | `note-path-not-a-regular-file` |

The ceiling message says "It IS a regular file; what disqualifies it is its size and nothing else," and a case asserts no refusal for a regular file contains "is not absent, or a regular file".

**The ledger's half.** RED, against the committed `.js`:

```
seeded ledger bytes = 67264512  ceiling = 67108864
appendNote RETURNED id (append past the read ceiling succeeded)
ledger bytes before = 67264512  after = 67264690  delta = 178
READ SIDE THREW: … is 67264690 bytes, above the 67108864-byte ceiling — refused rather than read.
```

GREEN: the append is refused with `audit-ledger-above-size-ceiling` and the ledger is byte-unchanged. **Which option was chosen and why:** the append is BOUNDED rather than the read ceiling dropped and the look streamed. Streaming would remove the operational limit rather than honour it, and would surface exhaustion as an unbounded read the next time somebody looked instead of as a named refusal while a human can still rotate the ledger. Recorded at the site.

**The derived ceiling-site axis:** 9 sites, every one a binding, **0 literals** — note ceiling 4, ledger ceiling 2, generic `maxBytes` comparisons 2, config ceiling 1. Three seeded mirrors: a literal in a top-level function (+1, reported `literal`), a literal in an ARROW (+1, seen because this walk is recursive), and the CONVERSE — the write-side ceiling comparison removed, count −1 and the note-ceiling cardinality down to 3.

### CR-20 — three real governance roots

Each of origin, third and dest carries a version-control marker and a governance configuration.

**PRE-FIX**, `promoteAdmitted(from = origin, to = third, repoRoot = dest)` → PROMOTED:

| repository | notes present | ledger lines |
|---|---|---|
| origin | the note | 0 |
| third | **THE NOTE** | **0** |
| dest | (none) | **1** |

The finding landed in THIRD's store and its audit record in DEST's ledger.

**The two `18-context-compaction.md` sentences, measured FALSE against that table:**

> "A re-binding first looks in the destination repository's ledger."
> "Because the append precedes the write, the destination never holds a human-disposed finding with no ledger line."

THIRD holds a human-disposed finding with zero ledger lines. Both false, at exactly the sentences that exist to assert them, in the paragraph rewritten the round before.

**POST-FIX**, same call:

| repository | notes present | ledger lines | delta |
|---|---|---|---|
| origin | the note | 0 | 0 |
| third | the note | 1 | **+1** |
| dest | (none) | 0 | **0** |

Both halves land in the derived destination. `repoRoot`'s ledger delta is zero — it can no longer decide where a record lands, and a case derives that from the module's own AST (`ledgerRecordsId(destinationRoot)`, `appendAuditLedger(destinationRoot)`) rather than by reading.

**The sentences after the fix**, now true of the mechanism:

> "A re-binding derives the destination repository from the destination context store itself, and both halves of the action key on that one answer. The ledger it looks in and the ledger it appends to are that repository's, never a third one named separately. A destination that does not resolve to a governed store is refused by name before anything is written."
> "The append precedes the write, and both steps name the same derived repository. So the destination never holds a human-disposed finding with no ledger line."

**The decline**, driven with a `to` under no governed root: `destination-outside-governed-store`, destination directory listing quoted **EMPTY**, ledger delta **zero in every candidate repository**.

**CONTROLS, all four passing:** CR-16's `origin-outside-trusted-store` with the destination empty; CR-11's `destination-id-occupied` with the destination byte-unchanged; CR-08's legitimate promotion writing cleanly with `to` and the derived root agreeing; WR-22's `unreadable-audit-ledger` fail-closed with nothing written. WR-22's ordering is re-asserted per derived member (cardinality 2, `admitAndAppend` and `promoteAdmitted`) with each member's reversed mirror.

### WR-28 — the price, measured per position by subtraction

| position | full 3 ops | config+store, no marker | marker+store, no config | **price** |
|---|---|---|---|---|
| inside a CONFIGURED repository | ACCEPTED | REFUSED | REFUSED | **3** |
| inside an UNCONFIGURED repository | ACCEPTED | **ACCEPTED** | REFUSED | **2** |
| outside every repository | ACCEPTED | ACCEPTED | REFUSED | **2** |

The middle row is the position the old "three inside this repository" wording was false at: the enclosing boundary carries no configuration, so the walk answers `nearest` with the forged marker absent. All three numbers now appear identically in `T-31-18-01`, in `governanceRootOf`'s docstring and in `18-context-compaction.md`, with a case asserting the three agree.

### WR-27 — the axis was blind to every scope but one

Measured against the pre-fix derivation, with the module's real source and one seeded `openSync` per shape:

| seeded scope | derived count | moved? |
|---|---|---|
| an ARROW function | 5 | **NO** |
| a CLASS method | 5 | **NO** |
| the CLI ENTRY block | 5 | **NO** |
| a TOP-LEVEL function | 6 | yes |

…while the axis's own comment claims "a new blocking call **anywhere in the module** turns this red."

After the recursive, scope-attributing walk: each of the three moves the count by **exactly one** and names its own scope (`seededArrowReader:openSync`, `seededMethodReader:openSync`, `<module>:openSync`). CONTROL 1 (top-level) still moves it by one; the CONVERSE mirror still moves it down by one.

**Newly visible members: NONE.** Before and after are byte-identical sets:

```
appendRegularFileLine:openSync, appendRegularFileLine:writeSync, atomicWrite:writeFileSync,
readRegularFileOrNull:openSync, readRegularFileOrNull:readSync
```

Every blocking call the module has today already lived in a top-level function, so the fix widened what the axis **can** see without moving what it **does** see — no site re-baselined, cardinality unchanged at 5. A CONTROL reproduces the OLD walk verbatim and asserts the new set is a superset losing nothing.

### IN-14 — three facts, one silence

**PRE-FIX**, all three indistinguishable:

| planted fact | readContext len | render index.md rows | any diagnostic |
|---|---|---|---|
| did not PARSE | 0 | 0 | **NO** |
| NOT A REGULAR FILE | 0 | 0 | **NO** |
| VANISHED (absent) | 0 | 0 | **NO** |

**POST-FIX:** three named arms (`unparseable`, `not-a-regular-file`, `vanished`), counted, reported in a conditional `## Skipped entries` section with an `| entry | arm | detail |` table. The over-ceiling entry carries its byte count, so "unreadable" is legible as a size. An empty notes directory renders **no** skip section — a task with nothing skipped renders byte-for-byte what it rendered before. Render stays byte-reproducible with skips present (arms in `NOTE_SKIP_ARMS` order, files sorted within each).

### The registers

`WRITE_PATH_RESIDUALS` exported with cardinality **5**, the same interface shape as the other two registers, both directions of the equality named and asserted against the dispositions written in `31-CONTEXT.md`, and a seeded undispositioned member (`R-31-29-98`) proving the binding can go red.

`PROMOTE_ADMITTED_DECLINES` grew from 10 to **11** — membership and ORDER registers both updated, with a probe reaching exactly the new clause and the `31-CONTEXT.md` enumeration bound to the derived set in both directions.

### Mutation proofs

**Task 1** — the write-side ceiling check removed:
1. mutant applied to the `.ts`
2. rebuilt `.js` grepped: `__GSD_MUTANT_31_29_NO_WRITE_CEILING__` count **1 — MARKER FOUND**, recorded *before* any test result was read
3. three cases RED (the over-ceiling refusal, the write-side adjacency, and the converse site count)
4. reverted, marker count 0
5. cases GREEN

**Task 2** — the ledger keyed back on `repoRoot`:
1. mutant applied
2. rebuilt `.js` grepped: `__GSD_MUTANT_31_29_LEDGER_ON_REPOROOT__` count **1 — MARKER FOUND**, before any result was read
3. two cases RED (the three-root split, and the AST assertion that neither ledger call takes `repoRoot`)
4. reverted, marker count 0
5. cases GREEN

### Frozen floors and hygiene

- `git hash-object hooks/guard.ts` = `669725bc1c616ab57123e22090d93d57eff1b001` = `FROZEN_GUARD_BLOB`. **Unmoved**; the file was not touched.
- `DECIDER_MANIFEST` digest for `scripts/context-io.js` **MOVED**, never relaxed: `8625d976…` → `4035f1ab…` → `656688a3…` → `60f62a48…` (once per task).
- `git diff --stat e1ca867..HEAD -- package.json` → **EMPTY**. No new dependency.
- `npm run check:diff-disposition` → **103**, equal to the count 31-28 recorded and not greater. A disposition file for this plan's own clauses was written at `docs/audit/29-style-dispositions/31-29.md`.
- Probe residue removed: `find .temp -mindepth 1 -print -quit` prints nothing; the named-pipe sweep prints nothing.
- `npm run freshness` → all 60 committed `.js` match a rebuild of their sources. `npm run check:build-parity` → clean. `npm run typecheck` (all three targets) → clean.
- **Whole excluded-e2e suite at one commit: 63 files, 4091 passed, 2 skipped, 0 failed.** A floor, never the proof.

## CLOSE items this plan carries

Each is accepted by design, named by id:

- **`R-31-21-01`** — `atomicWrite`'s destination carries a random UUID no caller can predict, so it is not aimable; the race is bounded by same-uid filesystem access (`T-31-25`).
- **`R-31-21-03`** — plan 31-21's own premise about `appendFileSync` was measured false and closed in that same round; recorded so the id resolves to its measurement rather than to a gap.
- **`R-31-22-01`** — a checkout with a store and no `factory.config.json` is refused as an origin; the cost of pricing the residual at three operations rather than one.
- **`R-31-22-03`** — re-measured this round against 31-27's canonicaliser and **unchanged**: a symlink AT the shaped, anchored position resolves to its root (accepted for where it SITS), a shaped symlink under an unanchored directory answers `null`, and `.GRUGOPS/context` answers `null` — case sensitivity running in the safe direction. A CLOSE item, accepted by design.
- **`R-37`** — the compared field set is the store's own read-back projection; a key that projection drops is read by no consumer.
- **`T-31-14-03` / `T-31-18-01`** — roadmap items needing a keyed note stamp the sanctioned writer emits and this route verifies.
- **`R-31-29-01`** (NEW) — a note already on disk above the ceiling is refused everywhere and neither deleted nor rotated; the context is append-only and removing it would destroy evidence to tidy a listing.

## OPEN items, with owners

- **The signed note-stamp work** (`T-31-14-03` / `T-31-18-01`'s closure criterion) — belongs to the **next milestone**; it has **no owner in this phase**.
- **A type-checker-backed resolution for `R-31-21-04`'s alias and computed-member half** — the S2 cutover shape 31-28 landed for the modifier ban (D-30). Owner: **next milestone**, named rather than assumed.
- **The Windows leg** of everything above (`R-03`) — owner: **`31-30`**.

## Files Created/Modified

- `scripts/context-io.ts` — exported ceilings and clauses, `ReadPositionRefusal`, the write-side ceiling, `governanceRootOf`, the derived destination binding, the new decline, three skip arms, `WRITE_PATH_RESIDUALS`, the corrected `T-31-18-01` price, the rewritten `R-31-22-02`
- `scripts/context-io.js` — rebuilt
- `scripts/context-io.test.ts` — the ceiling corpus on both sides, the clause-discrimination corpus, the cross-root promotion corpus, the WR-28 per-position price, the workflow-sentence cases, the IN-14 arms, the register binding, the ceiling-site axis
- `scripts/context-io-writer-set.test.ts` — the recursive scope-attributing walk, three seeded mirrors, the superset control, the 11-clause registers, the new probe, the moved caller member
- `scripts/compactor.test.ts` — promotion destinations routed through governed stores
- `scripts/nonblocking-reader-parity.test.ts` — the ceiling-definition regex admits the export
- `scripts/runnable-ref/uat-spec-integrity.test.ts` — a blocking pre-existing type error fixed (Rule 3)
- `hooks/hook-entry.ts` / `.js` — the `DECIDER_MANIFEST` digest moved
- `agent-factory/workflows/18-context-compaction.md` — the two ledger sentences made true, the price restated per position
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — D-31, the write-path residual dispositions, the new decline row
- `docs/audit/29-style-dispositions/31-29.md` — **created**; six rows for this plan's own clauses

## Decisions Made

See `key-decisions` in the frontmatter and the D-31 block in `31-CONTEXT.md`. Two are worth surfacing here because they are corrections rather than choices:

- **The forgery price had three positions, not two** (WR-28). Stating it as "three inside a repository" was false wherever the enclosing repository carries no governance configuration.
- **`NOTE_FILE_MAX_BYTES` is the constant the round-6 brief calls `NOTE_MAX_BYTES`.** The existing spelling is KEPT rather than renamed, because a rename here would create the second spelling this module keeps deleting. Recorded at the declaration for any reader arriving from the brief.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A pre-existing type error failed this plan's own `npm run typecheck` gate**

- **Found during:** Task 1, running the plan's `<verify>` gate
- **Issue:** `scripts/runnable-ref/uat-spec-integrity.test.ts:8586` failed `tsc -p tsconfig.tests.json` with TS2352 — a cast of a `getSourceFile`-only view to a `getSourceFiles()` view. The file is unmodified since HEAD and has **no type dependency on `scripts/context-io.ts`** (its only mentions of context-io are in prose comments), so the error is not caused by this plan. It was nonetheless blocking a gate this plan is required to run. `npx tsc --noEmit` alone was clean throughout; only the three-target `npm run typecheck` surfaced it.
- **Fix:** applied the widening the compiler itself names — through `unknown` — with a comment stating why the narrow view cannot express what POINT 2 asserts.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.test.ts`
- **Verification:** `npm run typecheck` (all three targets) clean
- **Committed in:** `043aa9f`
- **Worth recording:** `31-28-SUMMARY.md` line 416 records "`npm run typecheck` (all three targets) | clean". It was not clean at that commit. The claim was inaccurate, and the file that fails is one 31-28 itself last touched (`89c63b1`).

**2. [Rule 1 - Bug] This plan's own first spelling of a CONTROL asserted the wrong branch**

- **Found during:** Task 1
- **Issue:** the FIFO-at-the-ledger control expected the `fstat` SHAPE branch ("is not a regular file"). A FIFO with no reader never reaches it: `O_WRONLY | O_NONBLOCK` fails at `open(2)` with **ENXIO**, one branch earlier — which is exactly what 31-21 built the non-blocking open for.
- **Fix:** the assertion was corrected to the measured mechanism, and a companion DIRECTORY case was added so the `fstat` shape branch is proven **reachable** rather than assumed dead beside the new ceiling branch. The correction is recorded at the case rather than quietly amended.
- **Files modified:** `scripts/context-io.test.ts`
- **Committed in:** `043aa9f`

**3. [Rule 1 - Bug] Two existing fixtures were passing for the WRONG reason after the destination binding**

- **Found during:** Task 2
- **Issue:** constraining `to` moved where the ledger is read and written, which surfaced two tests whose green was no longer evidence. **WR-18's Test 6a** asserted "the re-binding appended nothing" against `repoRoot`'s ledger — but the route had stopped writing to that ledger entirely, so the assertion held while an event was being appended somewhere else. The **round-5 FIFO driver** planted its unreadable ledger at `repoRoot` rather than at the destination whose ledger the route now names, so it would have measured a perfectly readable ledger.
- **Fix:** both were **re-aimed, not re-baselined** — Test 6a's destination store now lives in the repository whose ledger it inspects (which makes its own name true of what it measures), and the driver stages `destproj` as a governance root and plants the FIFO at its audit path.
- **Files modified:** `scripts/context-io.test.ts`
- **Verification:** both cases pass; the FIFO case still reports bounded time and `unreadable-audit-ledger` with zero notes written
- **Committed in:** `a81ba78`

**4. [Rule 3 - Blocking] Probe residue broke five unrelated guard cases**

- **Found during:** Task 1
- **Issue:** `hooks/guard.test.ts`'s `kitCopy()` does a `cpSync` of the whole repository. The CR-19 probes had left a **FIFO** and ~75 MB of fixtures under `.temp/31-29-probe/`, and `cpSync` on a FIFO raised Node's "Unreachable code" — five guard cases failed for reasons that had nothing to do with the change.
- **Fix:** residue removed before any suite run, as the plan's own precondition requires. All five passed immediately afterwards. Recorded because the failure mode is non-obvious: the residue check must run *before* the suite, not only at the end.
- **Committed in:** n/a (no source change)

**5. [Rule 1 - Bug] A docstring transcript inflated a derived call-site count**

- **Found during:** Task 2
- **Issue:** the `appendNote` call-site axis counts `/appendNote\(/g` **textually**, so a reproduction transcript in a docstring quoting `appendNote(task, note, …)` counted as a sixth call site.
- **Fix:** the transcript was reworded to preserve every measured number without the call-shaped text. The **axis was deliberately NOT changed** — narrowing it to AST call expressions would have re-baselined a constant (the declaration site is currently counted) to make this plan's own case pass, which is the "fix the probe shape" pattern this phase exists to refuse. The axis's textual matching is a real weakness, but it is not this plan's subject.
- **Files modified:** `scripts/context-io.ts`
- **Committed in:** `a81ba78`

**6. [Rule 3 - Blocking] Two authored sentences exceeded the WP-03 descriptive bound**

- **Found during:** Task 3, full-suite run
- **Issue:** `guard_sentence_form` measured the per-position price sentence at **30 words** and the rewritten never-holds sentence at **26**, against a bound of 25.
- **Fix:** both were **split**, and the scan set was not narrowed — the remedy the gate itself names ("Do NOT narrow the scan set"). The assertions in `scripts/context-io.test.ts` and the rows in the disposition file were updated to the split forms in the same change.
- **Files modified:** `agent-factory/workflows/18-context-compaction.md`, `scripts/context-io.test.ts`, `docs/audit/29-style-dispositions/31-29.md`
- **Committed in:** `daa5e58`

### Expected fan-out, recorded because it is large

Constraining `to` is a real behaviour change, so destination fixtures across three suites (`context-io`, `context-io-writer-set`, `compactor`) moved from bare temp directories to governed stores, and two derived clause registers moved from 10 to 11 members. None of this is a re-baselining: every moved fixture now stages the store the route actually names, and both register changes are a genuinely new clause with a probe and a written disposition. The two cases in deviation 3 are the ones where the move revealed a false green.

---

**Total deviations:** 6 auto-fixed (3 blocking, 3 bugs — two of them in this plan's own new work, one in a pre-existing fixture)
**Impact on plan:** No scope creep. Deviations 1 and 6 were gates this plan is required to pass; 2, 3 and 5 were false or inflated measurements that would have made this plan's own evidence untrustworthy; 4 was hygiene the plan's precondition already mandated.

## Issues Encountered

- **31-28's recorded typecheck claim was inaccurate** (see deviation 1). Surfaced rather than silently repaired, because a phase whose whole subject is "never fake a passing gate" should not carry an unexamined false gate record.

## Known Stubs

None. No hardcoded empty value, placeholder or unwired data source was introduced. Every `<verify>` command in the plan was run and its output recorded above.

## Threat Flags

None. This plan adds no network endpoint, no auth path and no schema change at a trust boundary. It **narrows** two existing surfaces (the note/ledger write path and the promotion destination) and adds no new one. `T-31-29-SC` (package-manager installs) has no row: no dependency was added and `package.json` is byte-unchanged over the plan range.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `31-30` inherits the Windows leg (`R-03`) of the ceilings, the destination binding and the skip arms — all three are POSIX-measured only.
- `31-31` owns the round's closing measurement and the no-silent-drop coverage equality; this plan's CLOSE and OPEN items are named by id above so that equality can consume them without re-derivation.
- **Concern for the next verification round, stated plainly:** every round of this phase has produced its next Critical at the coordinate the previous fix did not reach, and this round is the sixth. The two coordinates this plan newly created are (a) the `ReadPositionRefusal` discriminant, which is now the single point through which two callers decide which clause to publish, and (b) `governanceRootOf`, which is now the single authority both ends of a promotion consult. A red team should probe those two before anything else — specifically, whether every caller that catches a refusal branches on the discriminant (rather than only the two that do today), and whether every path that writes to a repository derives its root through `governanceRootOf` (rather than only the promotion route). The plan's own doctrine — ask how a chokepoint is REACHED, not only what it refuses — applies to both.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-10*

## Self-Check: PASSED

All 13 claimed files exist on disk. All 3 task commits resolve in `git log --all`
(`043aa9f`, `a81ba78`, `daa5e58`). Every plan-level `<verify>` command was re-run at the
final commit and its output is recorded above: the whole excluded-e2e suite (63 files,
4091 passed, 2 skipped, 0 failed), `npm run typecheck` (all three targets), `npm run
check:build-parity`, `npm run freshness`, `npm run check:claim-anchors`, `npm run
check:residual-citations`, and `npm run check:diff-disposition` (103, equal to 31-28's
baseline). Residue checks print nothing.
