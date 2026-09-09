---
phase: 31-autonomous-manual-testing
plan: 21
subsystem: shared-verified-context
tags: [security, fail-closed, denial-of-service, audit-trail, derived-axes, gap-closure-round-5]
status: complete
requires:
  - "31-18 (CR-11): the append-only destination check at the write chokepoint, whose unguarded read is CR-12"
  - "30-11 round 2 (RA1-2): the O_NONBLOCK/fstat/regular-file discipline this plan extracts"
  - "31-09 (D-19 (4)): the no-duplicate-ledger-event rule the fail-closed look protects"
provides:
  - "readRegularFileOrNull — the module's ONE non-blocking file read"
  - "appendRegularFileLine — the module's ONE non-blocking file append"
  - "CANONICAL_READ_POSITION / NOTE_PATH_NOT_REGULAR_FILE_CLAUSE / LEDGER_PATH_NOT_REGULAR_FILE_CLAUSE / UNRECORDABLE_ADMISSION_REFUSAL"
  - "PROMOTE_ADMITTED_DECLINES['unreadable-audit-ledger']"
  - "the derived filesystem-primitive axis (PART SIX-F) and the derived note-then-ledger order axis (PART SIX-G)"
affects:
  - scripts/context-io.ts
  - scripts/context-io.js
  - hooks/hook-entry.ts
  - agent-factory/workflows/18-context-compaction.md
tech-stack:
  added: []
  patterns:
    - "one authority per primitive, not one habit per function"
    - "derive the set AND the count, two-sided, with a watched-fail mirror"
    - "prose bound to a derived set rather than to a second hand-typed list"
key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/18-context-compaction.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
decisions:
  - "D-24: every read and every append on a caller-influenced filesystem position goes through ONE non-blocking authority, and a property asserted in prose is asserted over the DERIVED set of routes that have it"
metrics:
  duration: ~1h20m
  completed: 2026-09-09
commits: 6
plan_head_before: 49dfa2651795c850ae20a4633cf7a7b34dd6990a
actuals:
  tokens: 46481
  tasks: 3
  commits: 6
---

# Phase 31 Plan 21: One Non-Blocking Reader, Ledger-Before-Note at Every Route Summary

Closed CR-12 and WR-22 by extracting the module's O_NONBLOCK/fstat discipline into a single read
authority and a single append authority, inverting the note/ledger order at both derived routes, and
binding the corrected workflow prose to that derivation — plus two blocking positions the review
never named and one of this plan's own stated premises, both measured false and closed.

## What shipped

| Artifact | Kind | Where |
|---|---|---|
| `readRegularFileOrNull` | NEW module-private reader: `O_NONBLOCK` open, `fstat` on the descriptor, regular-file refusal, size ceiling, bounded read, `closeSync` in `finally`; `null` only for ENOENT | `scripts/context-io.ts` |
| `appendRegularFileLine` | NEW module-private appender: `O_WRONLY\|O_APPEND\|O_CREAT\|O_NONBLOCK` + `fstat` + `writeSync` | `scripts/context-io.ts` |
| `CANONICAL_READ_POSITION` | NEW exported frozen string — `absent, or a regular file` | `scripts/context-io.ts` |
| `NOTE_PATH_NOT_REGULAR_FILE_CLAUSE` | NEW exported frozen clause `note-path-not-a-regular-file` | `scripts/context-io.ts` |
| `LEDGER_PATH_NOT_REGULAR_FILE_CLAUSE` | NEW exported frozen clause `audit-ledger-path-not-a-regular-file` | `scripts/context-io.ts` |
| `UNRECORDABLE_ADMISSION_REFUSAL` | NEW exported sentence, ONE spelling across three writer sites | `scripts/context-io.ts` |
| `NOTE_FILE_MAX_BYTES` / `AUDIT_LEDGER_MAX_BYTES` | NEW stated ceilings (8 MiB / 64 MiB), per artifact rather than shared by accident | `scripts/context-io.ts` |
| `"unreadable-audit-ledger"` | NEW `PROMOTE_ADMITTED_DECLINES` member (9 → 10) | `scripts/context-io.ts` |
| the inverted order | CHANGED `promoteAdmitted` AND `admitAndAppend`: ledger append precedes the note write | `scripts/context-io.ts` |
| PART SIX-F | NEW derived filesystem-primitive axis: members, count, dispositions, two-sided mirrors | `scripts/context-io-writer-set.test.ts` |
| PART SIX-G | NEW derived note-then-ledger writer set + per-member order axis + prose binding | `scripts/context-io-writer-set.test.ts` |
| the corrected sentence | CHANGED `18-context-compaction.md` trace paragraph, route-named and retention-scoped | `agent-factory/workflows/18-context-compaction.md` |
| **D-24** | NEW dated gap-closure decision | `31-CONTEXT.md` |

## Task 1 — one non-blocking reader (CR-12)

### RED, quoted verbatim, against the committed `scripts/context-io.js` at `49dfa26`

Control first, so the probe is known to measure something:

```
timeout 10 node <probe> <ctx> <repo> 20260909T050000Z-qe-observation-deadbeef
EXIT=0   stdout: WROTE 20260909T050000Z-qe-observation-deadbeef   stderr bytes: 0
```

The verifier's own probe (`31-VERIFICATION.md` behavioral spot-check row 7):

```
mkfifo .temp/31-21-probe/ctx/T-9/notes/20260909T050000Z-qe-observation-cafe0001.md
timeout 10 node <probe> ... 20260909T050000Z-qe-observation-cafe0001
EXIT=124  wall=10s
stdout bytes: 0
stderr bytes: 0
```

The review's second probe (a FIFO at `<repoRoot>/.grugops/audit/admissions.jsonl`):

```
timeout 15 node <probe> <base>
EXIT=124  wall=15s
stdout: SEEDED 20260908T010000Z-security-nfr-finding-c50f73d4
        DEST-BEFORE []
stderr bytes: 0
DEST at kill: 20260908T010000Z-security-nfr-finding-c50f73d4.md
```

**The destination note file EXISTED at kill time and the ledger held nothing** — verbatim the
repudiation `18-context-compaction.md:83` claimed could never happen.

*Harness note (first instance of a false premise in this plan).* The first ledger-probe run installed
a `SIGTERM` handler to report the destination at kill time. A process blocked in a synchronous
`open(2)` never runs its handler, so `timeout 15` could not kill it and the probe ran past 120 s. The
handler was removed and the destination read from the shell instead. Without that correction the
probe would have reported an unkillable process rather than exit 124.

### GREEN, measured

| Probe | Pre-fix | Post-fix | Wall |
|---|---|---|---|
| FIFO at a note path | exit 124, 0 bytes both streams | `REFUSED` naming `note-path-not-a-regular-file` + the resolved position; position still a FIFO | **0.06 s** |
| FIFO at the ledger path | exit 124, note already written | `DECLINED (unreadable-audit-ledger)`, `DEST=[]` | **0.05 s** |
| Directory at a note path | refused, naming the **wrong** condition (`already holds a DIFFERENT note`) | refused naming `note-path-not-a-regular-file` | < 0.1 s |
| Symlink → `/dev/zero` | hung | refused, same clause | < 0.1 s |
| CLI `validate <fifo>` | would block | refused, named, exit 1 | **0.05 s** |

### The read count

```
$ grep -v '^\s*[/*]' scripts/context-io.ts | grep -c 'readFileSync('
5      (before)
0      (after)
```

`readFileSync` is **absent from the module's `node:fs` import list entirely**, so the blocking
primitive is not in scope to be reached for by accident. Every surviving blocking-capable call is
enumerated by the derived axis below.

### The two positions CR-12 did not name

Probing every read rather than the two the finding cited found two more live hangs. Both are closed
in this plan; closing only the named two would have left D-24's own rule false.

1. **`readRawNotes`' directory walk.** Reached by `readContext`, `render`, `currentState` **and
   `promoteAdmitted`'s destination-liveness clause**. Measured after the first two were closed:
   `mkfifo <ctx>/T-9/notes/<anything>.md` → `timeout 10` → **exit 124**, `"READING …"` then zero
   further bytes. Disposition: **skip** the non-regular position (the walk already skips a file that
   does not parse; throwing would let one planted FIFO deny `render` for a whole task). The write
   side stays loud — the chokepoint refuses that position by name, asserted by a case.
2. **The two CLI argv note reads.** Routed through the same reader via `readCliNoteFileOrExit`.

### Controls, re-measured unmoved

| Control | Result |
|---|---|
| CONTROL 1 — identical destination bytes | idempotent no-op; same id returned, file byte-unchanged |
| CONTROL 2 — different bytes, same id (verification row 5) | refuses `destination-id-occupied`, destination **byte-unchanged** |
| CONTROL 3 — legitimate human-disposed promotion (row 6, CR-08's case) | writes cleanly, same id, `ledgerLines=1` |
| CONTROL 4 — config reader after the extraction | ENOENT → absent/lean · regular file → reads · **symlink→regular file → reads** · EACCES → `unreadable` · FIFO → `unreadable` in 2 ms · oversize → `unreadable`. Identical to pre-extraction. |
| EMPTY | a **zero-byte** existing note is the append-only refusal, not the idempotent case; an **absent** path proceeds |

### Mutation proof

Mutant: the `fstat` regular-file refusal removed from `readRegularFileOrNull`.

```
MUTANT:   3 failed | 12 passed
  × GREEN 1  (FIFO at a note path)            45ms   — falls through to the WRONG clause
  × GREEN 1c (symlink to a character device)  37ms
  × GREEN 2  (FIFO at the ledger path)      8017ms   — TIMED OUT: the block moved to the WRITE
REVERTED: 18 passed
```

The mutant is informative beyond discrimination: with the `fstat` arm gone, `O_NONBLOCK` alone stops
the *read* from hanging but the FIFO then wedges `appendFileSync`. That observation is what sent
PROBE 4 to measure the write side, and is how R-31-21-03 below was found.

### Frozen floors

```
$ git hash-object hooks/guard.ts
669725bc1c616ab57123e22090d93d57eff1b001   == FROZEN_GUARD_BLOB   (not re-based)

DECIDER_MANIFEST scripts/context-io.js:
  2ccb662815e1346c57ba1cb1f9f713d9b92fec3a241e3ce35b054a188671cfd6   (before)
  -> MOVED via `npm run generate:hook-manifest`, never relaxed

ADMIT_FROZEN_SHA256: 08df9e5c…09e9   UNCHANGED — admit()'s span is not touched (see below)

$ git diff --stat 49dfa26..HEAD -- package.json
(empty)
```

## Task 2 — ledger-before-note at every derived route (WR-22)

### The writer set is DERIVED, and it has two members

The review named `promoteAdmitted:1704`. The derivation, run **before** any fix was written, returned
**two**:

```
promoteAdmitted   ledgerMin=126582  writes=appendNote@113830(tail),appendPreAdmittedNote@126922
admitAndAppend    ledgerMin=250285  writes=appendPreAdmittedNote@250779,appendPreAdmittedNote@253746
admit             NOT A MEMBER — appends a ledger event, writes no note (shown by the derivation)
```

Both were inverted. `admitAndAppend`'s gated branch carries the identical pair, with `disposed_by`
derived from the very `human:NAME` stamp that makes the note human-disposed — so a fix touching only
`promoteAdmitted` would have left the corrected sentence false at the other route.

**No value is carried backwards on either route.** `promoteAdmitted`'s persisted id IS `sourceId`;
`admitAndAppend`'s is the frozen `id` its own comment already says is frozen for this identity
reason. Both now carry an internal identity guard asserting the write returned the id the ledger event
was keyed on.

### Order axis, recorded per member

| Member | ledger offset | note-write offset | ledger first? | transposed mirror |
|---|---|---|---|---|
| `promoteAdmitted` | 126582 | 126922 | yes | RED |
| `admitAndAppend` | 250285 | 250779 | yes | RED |

The order assertion is generated **from** the derivation, so the set that is derived and the set that
is consumed are the same object.

*Harness note (second false premise).* `admitAndAppend`'s first transpose anchor
(`const persistedId = appendPreAdmittedNote(task, note, body, contextRoot, id);`) occurs **twice** —
gated and non-gated. The mirror's one-occurrence PREMISE caught it (`expected 2 to be 1`) rather than
a mirror silently transposing nothing and reporting a pass. The anchor now carries its following line.

### Two-sided cardinality

| Mirror | Derived cardinality |
|---|---|
| live tree | **2** (`admitAndAppend`, `promoteAdmitted`) |
| + a seeded third both-writer | 3, named `seededBothWriter` |
| − `admitAndAppend`'s ledger call | 1, and `admitAndAppend` gone |
| `appendAuditLedger` renamed away | **0** — the PREMISE guard is proven able to fire rather than passing vacuously |

### The derived filesystem-primitive axis (PART SIX-F)

| Site | Count |
|---|---|
| `readRegularFileOrNull:openSync`, `readRegularFileOrNull:readSync`, `appendRegularFileLine:openSync`, `appendRegularFileLine:writeSync`, `atomicWrite:writeFileSync` | **5** |
| + one seeded unguarded read | 6, named, and absent from the disposition register |
| − an authority's own `writeSync` | 4 |

Every member carries a written disposition. `atomicWrite:writeFileSync` is the only site outside an
authority and its disposition is *not aimable*: the destination carries a random UUID no caller can
predict, and the following `renameSync` replaces rather than opens.

Two further cases assert `readFileSync` and `appendFileSync` are **absent from the module**, on the
source rather than inferred from the site set — because the site set would also be satisfied by them
appearing inside an authority, where neither belongs.

The fs-import alphabet moved **15 → 14**, classified with a written reason rather than bumped.

### The fail-closed ledger look

`ledgerRecordsId` no longer answers `false` for a present-but-unreadable ledger. The caller's response
to "not recorded" is to APPEND, so a fail-open read manufactured the duplicate event D-19 (4) exists
to prevent. It now throws; `promoteAdmitted` raises `unreadable-audit-ledger` **before anything is
written**. D-19 (4) is unchanged: when the id is already recorded, nothing is appended
(measured in PROBE 6: `ledgerLines=1 (no duplicate)` on an idempotent re-promotion).

`PROMOTE_ADMITTED_DECLINES` cardinality: **9 → 10**, with members, count, probe and the
`31-CONTEXT.md` disposition row all moved deliberately.

### The corrected workflow sentence

Quoted verbatim from `agent-factory/workflows/18-context-compaction.md`:

> Under `audit_retention: retained`, two routes write both a note and a GOV-02 ledger event. The
> routes are the re-binding route (`promoteAdmitted`) and the admit-then-persist route
> (`admitAndAppend`). On both routes the ledger event is appended before the note is written. A
> re-binding first looks in the destination repository's ledger. When that ledger already records the
> id, the re-binding appends nothing. When it does not, the re-binding appends one event marked
> `re_bound`. The mark keeps the event distinguishable from a fresh admission. Because the append
> precedes the write, the destination never holds a human-disposed finding with no ledger line. The
> converse is reachable, and is the deliberately safe direction. A crash or a refused write between
> the two steps can leave a ledger line for an unwritten note. A stray ledger line is an over-record:
> legible, and reconcilable against the notes directory. A note with no ledger line would instead be
> a repudiation. The two steps cannot be made atomic, so the ordering chooses which asymmetry is
> possible. A destination ledger that is present and cannot be read refuses the promotion by name.
> The refusal is deliberate: the response to "not recorded" is to append, and a wrong answer would
> manufacture a duplicate event. Under any other `audit_retention` value no ledger is kept, and this
> paragraph says nothing about that case.

Derived member list beside it: **`admitAndAppend`, `promoteAdmitted`** — the reader can check the two
agree.

**The pairing is asserted by a case**: `31-21 — the corrected workflow sentence names exactly the
routes the derivation returns` › *every DERIVED note-then-ledger route is NAMED in the paragraph*.
That case iterates the derivation and asserts the cardinality **in the same case**, so if the
derivation later returns a third member both halves fail together. The remedy is to invert the new
route and name it — never to relax either assertion. A companion case mirrors the paragraph with one
route name removed and proves the binding is a control.

The workflow **stop-bullet count was RE-DERIVED: 42**, unmoved (the edit is in *Trace updates*, not
*Stop conditions*); `assertLiveCorpusCardinality` passes.

### D-24

Appended to `31-CONTEXT.md`.

```
$ grep -c '^#### Gap-closure decision — D-' 31-CONTEXT.md
7    (before)
8    (after)          delta = 1

$ git diff --numstat 49dfa26..HEAD -- .../31-CONTEXT.md
127  0                 additions only, no existing decision edited or renumbered
```

Mirrored in the one-reader header in `scripts/context-io.ts` and in this summary's key-decisions —
the three places that must agree.

## Task 3 — the six standing probes, run against this plan's own fix

### PROBE 1 — how is this gate REACHED

Caller set **DERIVED** by AST across `scripts/context-io.ts`, `scripts/compactor.ts`, `hooks/guard.ts`,
`hooks/admission-guard.ts`, `scripts/admission-server.ts` (command: `node .temp/31-21-probe/p1-callers.mjs`).
**14 call sites**:

```
writeNoteFile (3)                 appendNote, appendPreAdmittedNote, emitTrusted
ledgerRecordsId (1)               promoteAdmitted
appendAuditLedger (3)             admit, admitAndAppend, promoteAdmitted
readGovernanceConfigCandidate (1) readGovernanceConfig
readRegularFileOrNull (5)         ledgerRecordsId, readCliNoteFileOrExit,
                                  readGovernanceConfigCandidate, readRawNotes, writeNoteFile
appendRegularFileLine (1)         appendAuditLedger
```

Each entry point driven with a **legitimate** input against the rebuilt `.js`, and against the
**pre-fix tree materialised from `49dfa26`** as the control:

```
POST-FIX:      CALLERS DRIVEN: 14  OK: 14  REFUSED: 0
PRE-FIX CTRL:  CALLERS DRIVEN: 14  OK: 14  REFUSED: 0
```

**VERDICT: PASS.** No caller refuses an input that succeeded pre-fix.

*First run recorded 3 refusals on BOTH trees* — `emitVerdict`, `emitCheckpointNote` and
`compactor.promoteAdmitted`. Identical pre and post, so probe-input errors (wrong argument shapes;
the compactor pass-through has no `repoRoot` seam by design and needs the trusted-root env var).
Corrected and re-run to 14/14. Running the pre-fix control is what distinguished "my probe is wrong"
from "my fix broke a caller".

### PROBE 2 — derive BOTH axes: 3 positions × 5 shapes

```
POSITION              SHAPE                       OUTCOME    ms     DETAIL
governance config     absent                      PROCEEDED  0      source=absent human_admission=off
governance config     regular file                PROCEEDED  0      source=ok human_admission=all
governance config     not-a-regular-file (FIFO)   REFUSED    2      source=unreadable (fail closed)
governance config     unopenable (EACCES)         REFUSED    1      source=unreadable (fail closed)
governance config     oversize                    REFUSED    14     source=unreadable (fail closed)
ledger path           absent                      PROCEEDED  2      promoted …435aecd3 destNotes=1
ledger path           regular file                PROCEEDED  2      promoted …f5dbbbb5 destNotes=1
ledger path           not-a-regular-file (FIFO)   REFUSED    3      DECLINED (unreadable-audit-ledger)
ledger path           unopenable (EACCES)         REFUSED    1      DECLINED (unreadable-audit-ledger)
ledger path           oversize                    PROCEEDED  11     promoted …04e8b528 destNotes=1
note path             absent                      PROCEEDED  1      wrote …aaaa0002
note path             regular file                REFUSED    0      already holds a DIFFERENT note
note path             not-a-regular-file (FIFO)   REFUSED    3      note-path-not-a-regular-file
note path             unopenable (EACCES)         REFUSED    0      note-path-not-a-regular-file
note path             oversize                    REFUSED    4      note-path-not-a-regular-file
CELLS MEASURED: 15 of 15   slowest: 14ms
```

Two cross-position differences, **both with a stated reason**:

- *regular file*: the note path refuses (APPEND-ONLY — a destination already holding a **different**
  note), while the ledger and config positions read and proceed. Different rule, correctly named:
  the refusal quotes `already holds a DIFFERENT note`, not the FIFO clause.
- *oversize (9 MiB)*: the ledger **proceeds**, because its ceiling is deliberately 64 MiB — an
  append-only trail grows without bound in ordinary use, so the ceiling is per-artifact rather than
  shared. **The ceiling was verified real** rather than assumed absent: at 64 MiB + 1 byte,
  `DECLINED (unreadable-audit-ledger)` in **0 ms**, `destNotes=0`.

**VERDICT: PASS.** No cell hangs, none answers with an unnamed exception, both differences are
stated and the second is measured on both sides.

The ordering change's other axis (a forced failure at each step) is covered by the order axis and its
per-member transposed mirrors, and by PROBE 4/5's ledger rows: a refused ledger append leaves
`notes=0`.

### PROBE 3 — what is the predicate's input assembled from (symlinks)

```
symlink -> FIFO            [resolves: fifo]     REFUSED     1ms  still a symlink   note-path-not-a-regular-file
symlink -> regular file    [resolves: file]     REFUSED     0ms  still a symlink   already holds a DIFFERENT note
DANGLING symlink           [resolves: dangling] PROCEEDED   1ms  REPLACED by a regular file
symlink -> DIRECTORY       [resolves: dir]      REFUSED     0ms  still a symlink   note-path-not-a-regular-file
```

Discriminating follow-ups, because "refused" at a symlink-to-regular-file could mean the read never
happened:

```
(a) symlink -> IDENTICAL regular file : PROCEEDED | returned …cccc0001
    position after      : still a symlink (nothing written — the idempotent no-op)
    target bytes intact : true
(b) DANGLING symlink write            : wrote …cccc0002
    landed INSIDE notes/ : true
    ESCAPED to target    : false
```

**The answer, stated rather than assumed:** `fstat` on the OPEN descriptor stats **through** a
symlink. A note delivered through a symlink to a regular file **is read** — proven by (a), where
identical bytes reach the decided idempotent no-op and nothing is written; had the read not followed
the link, the reader would have answered "absent" and the write would have proceeded. A symlink to a
FIFO is refused for **what it points at**, not for being a symlink. A dangling symlink is a bounded
ENOENT absence, and the write **replaces the link itself** rather than following it to an arbitrary
caller-chosen location — `renameSync` does not follow symlinks, so this is not a write-escape.

**VERDICT: PASS** on all four criteria (symlink-to-FIFO refused; symlink-to-regular-file read;
dangling → bounded absence; directory refused).

*Third false premise, and the one this probe exists to catch.* The first run used **relative** symlink
targets, which resolve against the **link's own directory** — so all four cases were dangling links
and all four `PROCEEDED` results were the right answer to a question nobody asked. The probe now uses
absolute targets and **asserts the shape each link actually resolves to** before driving the writer.
Without that assertion this probe would have reported "symlink-to-FIFO is ACCEPTED" — a false FAIL —
or, on a different fix, a false PASS.

### PROBE 4 — at which positions is the predicate even asked; and the converse, the WRITE sites

Every write site in `scripts/context-io.ts`, by line:

| Line | Call | Disposition (MEASURED) |
|---|---|---|
| 903 | `writeFileSync(tmp, …)` in `atomicWrite` | not aimable — random-UUID temp name |
| 905 / 915 | `renameSync(tmp, finalPath)` | replaces; does **not** open, so cannot block on a FIFO |
| 911 / 919 | `unlinkSync` | Windows branch + temp cleanup; bounded |
| 1079 | `writeSync` in `appendRegularFileLine` | the write authority; `fstat`-guarded |
| 1221 | `mkdirSync(notesDir, …)` | recursive; EEXIST/ENOTDIR are bounded errors |
| 1222 | `atomicWrite(finalPath, text)` — the note | protected by the chokepoint's append-only read |
| 2714 | `mkdirSync(auditDir, …)` | recursive; bounded |
| 2846 / 2905 | `atomicWrite(index.jsonl / index.md)` | **derived artifact**, regenerated and freshness-gated |

`appendFileSync` on the ledger path — the plan's named question — **no longer exists**. Its measured
disposition is R-31-21-03 below, and its replacement is a derived register member
(`appendRegularFileLine:openSync` / `:writeSync`) with its own written disposition, not prose.

### PROBE 5 — what does each write path do to a pre-existing destination

4 write sites × 3 pre-existing shapes. **Slowest cell: 3 ms. No hangs.**

| WRITE SITE | pre-existing regular file | pre-existing FIFO | pre-existing directory |
|---|---|---|---|
| `atomicWrite@1222` (note) | **REFUSED** — append-only, destination intact | **REFUSED** — named clause, intact | **REFUSED** — named clause, intact |
| `appendRegularFileLine@1079` (ledger) | PROCEEDED — pre-existing **KEPT** (appended after it) | **REFUSED**, `notes=0` | **REFUSED**, `notes=0` |
| `mkdirSync@1221/2714` (notes/ dir) | REFUSED (`ENOTDIR` via the named clause) | REFUSED (same) | PROCEEDED (recursive no-op) |
| `atomicWrite@2846/2905` (index.md) | PROCEEDED — content **replaced** | PROCEEDED — FIFO replaced, no hang | REFUSED — raw `EISDIR` from rename |

**VERDICT: PASS**, with two stated dispositions rather than defects:

- `index.md` is **replaced without comparison**. It is a *derived* artifact — deterministically
  regenerated from `notes/` and freshness-gated — and `atomicWrite`'s own comment already names this
  as the single-writer derived-artifact path. No note is at risk: the shared verified context is
  protected by `writeNoteFile`, which refuses at all three shapes above.
- `index.md` at a pre-existing **directory** refuses with a raw `EISDIR` from `renameSync` rather
  than a grugops clause. Bounded and loud, on the derived-artifact path only. Recorded as a named
  residual rather than closed, because adding a grugops clause to the derived-artifact write would
  put a second refusal vocabulary on a path whose contract is "replace whatever is there".

No write site silently replaces a pre-existing **note** it did not compare, none hangs on a
pre-existing FIFO, and every refusal names the condition that actually held — the directory case that
used to say `already holds a DIFFERENT note` now says `note-path-not-a-regular-file`.

### PROBE 6 — every decline clause probed with a LEGITIMATE input

```
DECLINE CLAUSE                          LEGIT INPUT     ms     DETAIL
empty-source-id                         PASSED          3      promoted …5544004e
unreadable-governance-config            PASSED          1      config source=ok, promoted …214d79c9
no-such-origin-note                     PASSED          1      origin note present, promoted …a313a59c
origin-note-not-live                    PASSED          8      origin live among 2 notes, promoted …67fbfe99
field-differs-from-origin               PASSED          1      fields identical, promoted …18f84b32
body-differs-from-origin                PASSED          1      body byte-identical, promoted …8415282a
human-stamp-not-gated-at-destination    PASSED          1      dial gates the note, promoted …2c3563cc
origin-outside-trusted-store            PASSED          1      origin is a recognised store, promoted …74dc2d2
destination-id-occupied                 PASSED          1      idempotent re-promotion PROCEEDED, byte-identical, ledgerLines=1 (no duplicate)
unreadable-audit-ledger                 PASSED          2      absent ledger -> c76e8766 | readable ledger -> 7d65ba87, lines=2
CLAUSES IN REGISTER: 10  PROBED: 10  KEY-SET EQUAL: true
PASSED: 10  FIRED-ON-LEGITIMATE: 0
```

Each case is built at its clause's **boundary**: a minimal non-empty id, a destination occupied by
**identical** bytes, a ledger that is present and readable, an origin that is live **among two
notes**. The new `unreadable-audit-ledger` clause is probed on **both** legitimate shapes — an absent
ledger and a present readable one — and fires on neither.

**VERDICT: PASS.** No clause is unreachable, and none fires on the legitimate case it must let
through. This is CR-08's lesson (round 3) and CR-11's blast-radius lesson (round 4) applied to this
plan's own new clause.

### Did any probe find a defect?

**Yes — three, all fixed inside this plan, and all three re-probed after the fix.** "None" would only
have been acceptable with all six probes run.

1. **PROBE 4 found R-31-21-03** — the plan's own stated premise about `appendFileSync` was false, and
   the position was a live hang on two routes. Closed (see below), then re-measured at 0.05 s.
2. **The `readRawNotes` walk** (Task 1) — a third blocking read the review never named. Closed, then
   re-probed with a FIFO and a directory beside a genuine note.
3. **The two CLI argv reads** — closed, then driven with a regular file, a missing file and a FIFO.

Three *harness* premises were also caught by their own assertions rather than by a later round: the
SIGTERM handler, the non-unique transpose anchor, and the relative symlink targets.

### Probe residue

```
$ test ! -e .temp/31-21-probe                                   PASS
$ find . -path ./node_modules -prune -o -type p -print          (prints nothing)
$ git status --short scripts hooks agent-factory docs .planning  (only pre-existing, non-plan files)
```

**`git status --short .temp` is NOT the check.** `.temp/` is gitignored at `.gitignore:19`, so that
command prints nothing however full the directory is and can never fail — which is why the directory
still holds 57 artifacts from rounds 3 to 5 and why the previous rounds' `git status`-based residue
gate never fired once. `test ! -e .temp/31-21-probe` plus the FIFO sweep is what actually observes it.
Every artifact this plan created lived under the single root `.temp/31-21-probe/` and that root is
gone. The pre-fix control tree carried a **symlink** to `node_modules`; `rm -rf` removed the link, and
`node_modules` is verified intact.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 2 — missing critical functionality] `readRawNotes`' walk was a third unguarded read**
- **Found during:** Task 1, enumerating the surviving `readFileSync` sites for the acceptance criterion.
- **Issue:** the plan required a *stated reason why each survivor is not caller-influenced*. A notes
  directory's contents are exactly what a caller can add a name to, and the read was measured hanging
  (`exit 124`). Closing only CR-12's two named reads would have left D-24's own truth #1 false.
- **Fix:** routed through the one reader; a non-regular position is skipped with a written reason.
- **Commit:** `34f6989`

**2. [Rule 2] the two CLI argv note reads**
- **Fix:** `readCliNoteFileOrExit`, so the rule is TOTAL for the module (0 `readFileSync`) rather
  than a count with two footnotes.
- **Commit:** `34f6989`

**3. [Rule 1 — bug] the GOV-02 ledger APPEND blocks; the plan's stated premise was false**
- **Found during:** Task 3 PROBE 4, prompted by the mutation run.
- **Issue:** plan `must_haves.truths` asserted `appendFileSync` to a FIFO "exits 0 IMMEDIATELY … the
  event is silently discarded". Measured: **exit 124** through both `admit` and `admitAndAppend`.
- **Fix:** `appendRegularFileLine`; an admission that cannot be recorded under `retained` is REFUSED.
- **Commit:** `ee72409`

**4. [Rule 3 — blocking] the corrected prose violated the Phase 29 writing profile**
- **Issue:** `guard_sentence_form` refused four descriptive sentences (30/39/32/41 words, bound 25)
  and one bare-demonstrative subject.
- **Fix:** the paragraph was **split**, not the scan set narrowed — `GOVERNED_CORPUS_COUNT` is
  two-sided pinned precisely so reaching green by removing a member is unavailable.
- **Commit:** `b3f666f`

### Design deviation from the plan's stated approach

**The ledger-write refusal lives in the WRITERS, not in `admit()`.** The plan implied the refusal
would sit where the ledger is appended. Placing it inside `admit()` was implemented, measured, and
**reverted**: it changed `admit()`'s frozen byte-span (`ADMIT_FROZEN_SHA256`) and added a member to
the derived refusal-family axis whose every other member is about the *note* — 10 cases went red.
`admit()` decides whether a note is **admissible**; "can this admission be recorded" is a fact about
the filesystem. So `admit()` throws (bounded) and each writer converts it to its own refusal shape.
`ADMIT_FROZEN_SHA256` is therefore **not re-based**, and `UNRECORDABLE_ADMISSION_REFUSAL` gives the
sentence one spelling across the three writer sites.

### Derived axes moved deliberately, none relaxed

| Axis | Before | After | Reason |
|---|---|---|---|
| `node:fs` import alphabet | 15 | 14 | `readFileSync` removed — classified, not bumped |
| `PROMOTE_ADMITTED_DECLINES` | 9 | 10 | `unreadable-audit-ledger`; members, count, probe and disposition row all moved |
| unhelped-throw bound in the re-binding route | 1 | 2 | the id-identity guard; each asserted to say `internal` |
| mirror anchors (`AUTHORITY_CALL`, `KIND_SCOPED_AUTHORITY`) | declaration | call expression | the try/catch wrap; their one-occurrence PREMISE caught the drift |
| neutralize replacement | `const admission = []` | `admission = []` | matches the anchor's new assignment form |
| workflow stop bullets | 42 | **42** | re-derived, unmoved |

## Key decisions

**D-24 (2026-09-09, gap-closure round 5, plan 31-21)** — *mirrored verbatim in `31-CONTEXT.md` and in
the one-reader header in `scripts/context-io.ts`; the three must agree.*

> Every read and every append this module performs on a caller-influenced filesystem position goes
> through ONE non-blocking authority, and a property asserted in prose is asserted over the DERIVED
> set of routes that have it, never over the route a reviewer happened to name.

Three sub-decisions: **(1)** one non-blocking reader and one non-blocking appender, with the canonical
form `absent, or a regular file` stated once and everything else refused by name; **(2)** the GOV-02
ledger event is appended BEFORE the note is written at **every** member of the derived
note-then-ledger writer set, with a fail-closed look; **(3)** the corrected prose names the routes it
covers and a case binds it to that derived set.

**Which register failed** — two, neither touched before: *which primitive a read uses* (four rounds of
derived axes over this module, none asking what a read is made of), and *how many routes a property is
asserted over* (the review named one; the derivation returned two).

**What D-24 does NOT establish:** four residuals, `R-31-21-01` (`atomicWrite`'s unaimable temp write),
`R-31-21-02` (a non-regular file inside `notes/` is skipped, not refused loudly), `R-31-21-03` (this
plan's own `appendFileSync` premise, measured false and closed), `R-31-21-04` (both derivations are
syntactic; the tail-delegation exclusion is written down rather than widened per counter-example).

## Verification

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **62 files, 3747 passed, 2 skipped, 0 failed** |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` |
| `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `npm run typecheck` | clean (`tsc --noEmit` + tests + fixtures) |
| `npm run check:imperative-lexicon` | sentence form 0 findings over 48/48 |
| `git hash-object hooks/guard.ts` | `669725bc…` = `FROZEN_GUARD_BLOB` |
| `git diff --stat 49dfa26..HEAD -- package.json` | empty |
| probe residue | `test ! -e .temp/31-21-probe` PASS; FIFO sweep empty |

## Known Stubs

None. No stub, skipped test or unrun `<verify>` was left by this plan.

## Threat Flags

None. This plan removes surface (two blocking primitives) and adds no endpoint, auth path or schema
change at a trust boundary.

## Commits

| Commit | Message |
|---|---|
| `0b64074` | `test(31-21)`: RED — a FIFO, a directory or a character device at a note path or at the ledger path is not refused |
| `34f6989` | `fix(31-21)`: GREEN — one non-blocking reader for the whole module (CR-12) |
| `ee72409` | `fix(31-21)`: GREEN — the GOV-02 ledger APPEND cannot block either |
| `8cde300` | `feat(31-21)`: two DERIVED axes, a route-bound workflow sentence, and D-24 (WR-22) |
| `b3f666f` | `docs(31-21)`: bring the corrected trace paragraph inside the Phase 29 writing profile |
| `8dad230` | `docs(31-21)`: complete one-non-blocking-reader / ledger-before-note plan (SUMMARY + STATE + ROADMAP) |

## Self-Check: PASSED
