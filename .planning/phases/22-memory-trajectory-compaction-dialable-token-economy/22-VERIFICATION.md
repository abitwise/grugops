---
phase: 22-memory-trajectory-compaction-dialable-token-economy
verified: 2026-06-18T23:55:00Z
status: gaps_found
score: 3/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
round: 5
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  previous_round: 4
  gaps_closed:
    - "WHITESPACE / PARSER-PROJECTION DRIFT (the 4th distinct CMP-02 bypass class) — round-4 gap
      CLOSED in 22-06: parseNote.malformedLines + validate() rejection + two fail-closed gates in
      checkCarveOut (gate (a) malformedLines-reject, gate (b) shared validate()) run on every raw
      AND promoted note's verbatim bytes BEFORE any survival/byte-equal decision. RED->GREEN
      proven against the committed scripts/compactor.js (pre-fix commit 429f01c exit 0 — indented
      `verified_by` bypasses; post-fix exit 1 — refused naming the malformed line + structural
      FAIL). `npm run freshness` exits 0 (17 committed .js byte-fresh). Non-e2e suite: 395
      passed / 1 skipped. Evidence: 22-06-RED-baseline.txt + 22-06-GREEN-proof.txt."
  gaps_remaining:
    - "MULTI-NOTE THREAD FILE — FIFTH DISTINCT CMP-02 BYPASS (newly discovered). Independently
      reproduced this verification against the COMMITTED scripts/compactor.js. The production
      write path (writeThread / composeThreadNote, compactor.ts:517-564) appends each note as a
      `---...---` fence into a SINGLE `threads/<agent>.md` file. The carve-out read path
      (readNoteDir, compactor.ts:160-174) calls readNoteFields -> parseNote ONCE per .md file.
      parseNote's fence regex `/^---\\n([\\s\\S]*?)\\n---\\n?([\\s\\S]*)$/` (context-io.ts:204)
      is non-greedy on the frontmatter group, so for a multi-fence file it parses ONLY the first
      fence — every subsequent note's frontmatter and body is folded into the first note's body
      field (confirmed: `node -e parseNote(twoFenceFile).body` contains the buried second note's
      full text verbatim; malformedLines is empty because the body is not scanned). Both new
      round-5 gates (gate (a) malformedLines, gate (b) validate()) run only on the first note;
      notes #2+ are invisible to the required-survival set, the byte-equal loop, AND both gates.
      A §14-gate-verified finding or an unconditionally-required failed-attempt buried as note #2+
      in a thread file can be silently dropped from the promoted set at exit 0 'carve-out intact'.
      Reproduced: two-note engineer.md (observation note #1 + finding with verified_by:
      §14-gate#RUN7 note #2); promoted set keeps only note #1; `node scripts/compactor.js check`
      exits 0. Also reproduced with a failed-attempt as note #2: same exit 0. The reason the
      395-test suite is green: every carve-out test writes exactly one note per .md file; the
      single test calling writeThread (compactor.test.ts:729) never feeds the result to
      checkCarveOut. The corpus structurally cannot exercise the real production thread shape."
  regressions: []
gaps:
  - truth: "CMP-02 / SC2 — compaction never silently drops a load-bearing field (verified_by /
      failed-attempt / supersedes / by / at) on the way from the raw thread to the promoted notes;
      a §14-gate-verified finding survives compaction UNCONDITIONALLY; a failed-attempt survives
      UNCONDITIONALLY; the carve-out oracle is the un-cheatable mechanical floor (a green unit
      suite is necessary but not sufficient — proof is reproduction against the committed .js)."
    status: failed
    reason: >-
      Independently reproduced against the COMMITTED scripts/compactor.js (freshness: 17
      committed .js files byte-fresh as of this verification). The production raw-thread
      representation is a SINGLE multi-note file: writeThread (compactor.ts:517-542) appends
      each provenance-bearing note as a `---...---` fence into `threads/<agent>.md`. The
      carve-out read path (readNoteDir, compactor.ts:160-174) calls readNoteFields->parseNote
      ONCE per .md file. parseNote's non-greedy fence regex parses ONLY the first fence; every
      subsequent note is swallowed into the first note's body (confirmed via node -e: the second
      note's id/verified_by/kind are in .body, scalars contains only the first note's fields,
      malformedLines is empty). Both round-5 gates run only on the first note; notes #2+ are
      invisible to the required-survival set, both gates, and the byte-equal loop. A §14-gate-
      verified finding buried as note #2 is silently dropped at exit 0 "carve-out intact". A
      failed-attempt buried as note #2 is also silently dropped at exit 0. The entire 395-test
      suite stays green because every carve-out test uses one note per .md file — the corpus is
      structurally blind to the production multi-note thread shape (same "green suite necessary
      but not sufficient" failure mode as rounds 1-4). This is the 5th distinct bypass across 5
      rounds of hardening; each round shipped a fully green suite; each remained bypassable.
    artifacts:
      - path: "scripts/compactor.ts:160-174 (readNoteDir)"
        issue: >-
          Calls readNoteFields(readFileSync(file)) once per .md file. Does not split a multi-note
          file into per-note records before parsing. The module's own contract comment
          (compactor.ts:513-516) promises "each recorded note is appended as an id-BEARING
          structured fence so the compaction step can parse the file into the per-note raw set the
          carve-out reads" — no such splitter exists. The per-note raw set is silently truncated to
          the first note in each thread file.
      - path: "scripts/context-io.ts:204 (parseNote fence regex)"
        issue: >-
          `/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/` is non-greedy on the frontmatter group. For a
          multi-fence file, it matches only the FIRST fence; everything after (including every
          subsequent note's frontmatter + body) becomes `m[2]`, the body of the first note.
          malformedLines is never populated for body text — so both round-5 gates are blind to
          buried notes.
      - path: "scripts/compactor.ts:517-542 (writeThread / composeThreadNote)"
        issue: >-
          Correctly appends each note as an id-bearing structured fence into a single
          threads/<agent>.md file. This is the intended production representation. The mismatch
          is that the READ path (readNoteDir) does not split the file back into per-note records
          before handing to the carve-out.
      - path: "scripts/compactor.test.ts (entire carve-out suite)"
        issue: >-
          395 tests green yet bypassed again. Every carve-out test writes exactly one note per
          .md file. The single writeThread call (compactor.test.ts:729) asserts two-tier
          separation only; it never feeds the multi-note thread result to checkCarveOut. The
          corpus cannot detect the multi-note class.
    missing:
      - >-
        Add a note-splitter to the read path that splits a multi-fence file into per-note
        verbatim byte strings BEFORE parsing, so EVERY note in a thread file reaches both gates
        and the required-survival set. The splitter must use the same fence grammar parseNote
        recognizes (IN-02 single-source principle). A trailing non-blank, non-fence remainder
        must fail closed (it is an unparseable note, never a silent drop).
      - >-
        Suggested shape (context-io.ts, exported so the oracle and any caller share one splitter):
        `export function splitNotes(text: string): { notes: string[]; trailingMalformed: string | null }`
        — splits on fence boundaries, returns each note's verbatim bytes, and surfaces any
        trailing non-fence remainder as trailingMalformed (fail closed in the caller).
      - >-
        Update readNoteDir to iterate splitNotes(fileText).notes, key each by its frozen id (or
        <file>#<n> for id-less entries), run both gates and the byte-equal/required-survival logic
        per note, and push a fail-closed finding for any trailingMalformed remainder.
      - >-
        Add a RED-first held-out test that builds the raw thread via writeThread (two calls) or a
        literal two-fence file, drops the buried verified finding / buried FA from the promoted
        set, and asserts the CLI refuses (exit 1) naming the dropped id. A single-note-per-file
        corpus structurally cannot detect this class.
---

# Phase 22 Verification — Round 5 (gaps_found)

**Phase Goal:** Bound the multi-agent token tax with two-tier memory — verbose local trajectory
stays in the agent's thread; only compact, re-verified distillations promote to the shared context.

**Verified:** 2026-06-18T23:55:00Z
**Status:** gaps_found — **3/4 must-haves verified**
**Re-verification:** Yes — round 5 (after round-4 22-06 gap-closure plan)

## What round 5 (plan 22-06) DID close

The 4th bypass class (whitespace / parser-projection drift) is genuinely closed by 22-06. The
round-5 fix is real and robust for the line-shape class it targets:

| Round-4 gap | Round-5 status | Proof (committed .js) |
|---|---|---|
| **Whitespace / parser-projection drift** — indented or `key : value` `verified_by` silently projects to `""`, `isVerified` flipped, finding foldable | **Closed** — gate (a) malformedLines-reject + gate (b) shared validate() run on every raw+promoted note before any survival/byte-equal decision | pre-fix commit 429f01c exit 0 → post-fix exit 1 naming malformed line + structural FAIL (see 22-06-RED-baseline.txt + 22-06-GREEN-proof.txt) |

Additional round-5 delivery (all intact, untouched by the new bypass):

- `parseNote.malformedLines` — new field recording any non-recognized in-fence line shape
- `validate()` malformedLines rejection loop — symmetric with the existing duplicateKeys loop
- `checkCarveOut` gate (a) (malformedLines-reject) + gate (b) (shared `validate()`) on every raw+promoted note's verbatim on-disk bytes BEFORE any survival/byte-equal decision
- `NoteFields.text` — verbatim readFileSync bytes, never a re-serialization (load-bearing: a re-serialization would normalize an indented/CRLF line away before validate() saw it)
- Table-driven field × kind × line-shape matrix (compactor.test.ts)
- Read-path == write-path IN-02 block (context-io.test.ts)
- `npm run freshness` exits 0 (17 committed .js byte-fresh)
- Non-e2e suite: 395 passed / 1 skipped

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1 — verbose trajectory stays in `threads/<agent>.md`; only compact distillations promote to the shared context; `writeThread` is gitignored, `promote` routes solely through `appendNote` | ✓ VERIFIED | `writeThread` appends to `threads/<agent>.md` (compactor.ts:517-542); `.gitignore` line 12: `**/.grugops/context/*/threads/`; `promote` is a thin pass-through to `appendNote` (compactor.ts:569-576); no forked writer; two-tier separation compiles and tests green |
| 2 | SC2 — CMP-02 carve-out: `verified_by`, `failed-attempt`, `supersedes`, `by`/`at` survive compaction UNCONDITIONALLY; a RED test fails if any is dropped | ✗ FAILED (5th bypass) | 5th distinct bypass independently reproduced: a §14-gate-verified finding buried as note #2 in a multi-fence thread file exits 0 "carve-out intact" (see reproduction below). A failed-attempt buried as note #2 also exits 0. `readNoteDir` calls `parseNote` once per .md file; the non-greedy fence regex parses only the first fence; notes #2+ are invisible to both round-5 gates and the required-survival set. 395-test suite green but structurally blind to the production multi-note thread shape. |
| 3 | SC3 — `context.compaction: aggressive\|balanced\|retain-raw` dial defaults to `aggressive` when absent; documented across all three config surfaces | ✓ VERIFIED | `DEFAULT_DIAL = "aggressive"` (compactor.ts:76); `readCompactionDial` returns `DEFAULT_DIAL` on absent file/key (compactor.ts:492-506); documented in `agent-factory/config/factory.config.md` (lines 26, 91, 107), `agent-factory/config/factory.config.json`, and `agent-factory/seed/.grugops/factory.config.json`; the dial is explicitly un-dialable at the carve-out (D-05) |
| 4 | SC4 — a role following Workflow 18 compacts by the single-source protocol; other roles reference it | ✓ VERIFIED | `agent-factory/workflows/18-context-compaction.md` exists as the single-source protocol; all 17 agent roles reference it by path ("compact the local trajectory and promote per `agent-factory/workflows/18-context-compaction.md` — single source; this role references it and does not restate it"); `_role-switch-protocol.md` is a `kind: protocol`, not an agent role, and correctly does not reference Workflow 18 |

**Score:** 3/4 truths verified (0 present, behavior-unverified)

### The 5th CMP-02 Bypass — Independently Reproduced

```
Raw thread: /tmp/cr01-5th-bypass/thread/engineer.md (ONE file, TWO note fences)
  Fence 1: observation o1 (confidence: low, verified_by: empty)
  Fence 2: finding CRITICAL (verified_by: §14-gate#RUN7, confidence: high)

Promoted: /tmp/cr01-5th-bypass/promoted/o1.md (ONLY fence 1 — the verified finding absent)

$ node scripts/compactor.js check /tmp/cr01-5th-bypass/thread /tmp/cr01-5th-bypass/promoted
carve-out intact: every failed-attempt id survived and all load-bearing provenance fields are present.
EXIT=0

$ node -e "const {parseNote} = require('./scripts/context-io.js'); const fs = require('fs');
  const t = fs.readFileSync('/tmp/cr01-5th-bypass/thread/engineer.md','utf8');
  const r = parseNote(t);
  console.log('scalars.id:', r.scalars.id);
  console.log('scalars.verified_by:', JSON.stringify(r.scalars.verified_by));
  console.log('malformedLines:', r.malformedLines);
  console.log('buried in body:', r.body.includes('§14-gate#RUN7'));"
scalars.id: 20260617T142305Z-engineer-observation-o1
scalars.verified_by: ""
malformedLines: []
buried in body: true
```

The §14-gate-verified finding is buried in `.body`, `malformedLines` is empty (body is not
scanned), and both gates are blind to it. Exit 0 "carve-out intact" with a dropped verified finding.
Same construction with a `failed-attempt` as note #2 also exits 0.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/context-io.ts` | `malformedLines` field + `validate()` rejection | ✓ VERIFIED | `ParsedFrontmatter.malformedLines: string[]` at line 190; validate() malformedLines loop at lines 289-295; `parseNote` records non-recognized in-fence lines |
| `scripts/context-io.js` | Byte-fresh compiled build | ✓ VERIFIED | `npm run freshness` exits 0; 17 committed .js files byte-fresh |
| `scripts/compactor.ts` | `checkCarveOut` gate (a) + gate (b); `validate` imported | ✓ VERIFIED | `validate` imported at compactor.ts:62; gate (a) malformedLines loops at lines 284-303; gate (b) validate() loops at lines 312-327; `NoteFields.text` at line 123 |
| `scripts/compactor.js` | Byte-fresh compiled build | ✓ VERIFIED | `npm run freshness` exits 0 |
| `scripts/compactor.test.ts` | CR-01/CR-02/CR-03 + line-shape matrix | ✓ VERIFIED | Round-5 describe block exists; table-driven field × kind × line-shape matrix; 395 tests pass |
| `scripts/context-io.test.ts` | malformedLines + validate() symmetry; CRLF identity; negative control | ✓ VERIFIED | IN-02 describe block present; read-path == write-path assertions pass |
| `agent-factory/workflows/18-context-compaction.md` | Single-source compaction protocol | ✓ VERIFIED | File exists; all 17 agent roles reference it by path |
| `.planning/phases/22-memory-trajectory-compaction-dialable-token-economy/22-06-RED-baseline.txt` | RED evidence for round-5 bypass | ✓ VERIFIED | File exists; captures pre-fix exit 0 on CR-01 (indented verified_by) fixture |
| `.planning/phases/22-memory-trajectory-compaction-dialable-token-economy/22-06-GREEN-proof.txt` | GREEN evidence for round-5 fix | ✓ VERIFIED | File exists; captures post-fix exit 1 on same CR-01 fixture; freshness exit 0; full suite green |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `checkCarveOut` | `validate` (context-io.ts) | `import { validate }` at compactor.ts:62; gate (b) calls `validate(fields.text)` on every raw+promoted note | ✓ WIRED | Grep-confirmed; `text` is verbatim readFileSync bytes (never re-serialized) |
| `checkCarveOut` | `parseNote.malformedLines` | `readNoteFields` sources `malformedLines: parsed.malformedLines` (compactor.ts:142); gate (a) iterates `fields.malformedLines` | ✓ WIRED | Grep-confirmed; mirrors duplicateKeys block word-shape |
| `validate` | `parseNote.malformedLines` | `validate()` iterates `parsed.malformedLines` and pushes a structural FAIL per entry (context-io.ts:289-295) | ✓ WIRED | Symmetric with duplicateKeys rejection loop |
| `writeThread` / `composeThreadNote` | `readNoteDir` / `parseNote` (read path) | No multi-note splitter exists; `readNoteDir` calls `parseNote` once per .md file; notes #2+ invisible | ✗ BROKEN (root cause of 5th bypass) | `readNoteDir` at compactor.ts:160-174 does not split multi-fence files; `parseNote`'s non-greedy regex swallows notes #2+ into the body |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Line-shape CR-01 bypass CLOSED (indented verified_by) | `node scripts/compactor.js check <thread-with-indented-verified_by> <promoted-missing-finding>` | exit 1 "carve-out FAIL: malformed frontmatter line..." | ✓ PASS (see 22-06-GREEN-proof.txt) |
| Multi-note thread bypass LIVE (verified finding as note #2) | `node scripts/compactor.js check /tmp/cr01-5th-bypass/thread /tmp/cr01-5th-bypass/promoted` | exit 0 "carve-out intact" — §14-gate-verified finding silently dropped | ✗ FAIL — 5th bypass confirmed |
| Failed-attempt as note #2 bypass LIVE | `node scripts/compactor.js check /tmp/cr01-fa/thread /tmp/cr01-fa/promoted` | exit 0 "carve-out intact" — unconditionally-required FA silently dropped | ✗ FAIL — same bypass, FA variant |
| Non-e2e suite | `npx vitest run --exclude '**/scripts/e2e/**'` | 395 passed / 1 skipped / 16 files | ✓ PASS (green, but structurally blind to multi-note shape) |
| Build freshness | `npm run freshness` | All build outputs fresh: 17 committed .js files match a fresh tsc rebuild | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CMP-01 | 22-01/22-02 | Two-tier compaction: verbose trajectory in threads/, compact distillations promote to shared context | ✓ SATISFIED | `writeThread` + gitignore; `promote` via `appendNote`; two-tier separation green in suite; unchanged by round-5 |
| CMP-02 | 22-06 (round 5) | Load-bearing-field carve-out: verified_by / failed-attempt / supersedes / by / at compaction-exempt; RED test fails if any dropped | ✗ BLOCKED | 5th bypass: notes #2+ in a multi-fence thread file invisible to oracle; exit 0 on dropped verified finding / FA; REQUIREMENTS.md status correctly shows "In Progress" |
| CMP-03 | 22-01/22-02 | `context.compaction` dial; compacted output re-verified before write; Workflow 18 single-source protocol | ✓ SATISFIED | Three dial values; `aggressive` default on absent; documented across all config surfaces; Workflow 18 exists; all 17 roles reference it; unchanged by round-5 |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `scripts/compactor.ts:160-174` (readNoteDir) | Calls `parseNote` once per .md file without a multi-note splitter; module contract comment at :513-516 promises per-note raw set but no splitter exists | BLOCKER | Root cause of 5th CMP-02 bypass — notes #2+ in a thread file are invisible to the oracle |
| `scripts/compactor.test.ts` (carve-out suite) | Every test uses one note per .md file; single `writeThread` call (line 729) never feeds multi-note result to `checkCarveOut` | BLOCKER | Corpus structurally cannot detect the multi-note bypass class; suite green does not imply invariant holds |

No unreferenced debt markers (`TBD`, `FIXME`, `XXX`) found in files modified by plan 22-06.

### Human Verification Required

None. All gaps are mechanically demonstrable (reproduced against the committed CLI) and do not
require human judgment to identify.

## Gaps Summary

Round 5 (plan 22-06) closed the 4th bypass class (whitespace/parser-projection drift) with real,
robust fixes: the `malformedLines` gate and shared `validate()` gate together handle the CLASS of
non-recognized in-fence line shapes, not named shapes. The round-5 fix is not in question.

However, a **5th distinct CMP-02 bypass** was independently reproduced against the committed
`scripts/compactor.js` in this verification:

**Root cause:** The production write path (`writeThread`) appends multiple notes into a single
`threads/<agent>.md` file as concatenated `---...---` fences. The carve-out read path
(`readNoteDir`) calls `parseNote` once per file. `parseNote`'s non-greedy fence regex parses only
the first fence; every note after the first is silently folded into the first note's body. Both
round-5 gates and the required-survival set are blind to buried notes. A §14-gate-verified finding
or an unconditionally-required failed-attempt buried as note #2+ in a thread file can be silently
dropped from the promoted set at exit 0 "carve-out intact".

**Why the suite is green:** Every carve-out test writes exactly one note per .md file. The single
`writeThread` call in the test file (compactor.test.ts:729) asserts two-tier separation only and
never feeds the multi-note result to `checkCarveOut`. The corpus is structurally blind to the
production thread shape. This is the same "green suite necessary but not sufficient" failure mode
as rounds 1–4.

**Fix direction for round 6:** Add a `splitNotes` function (exported from context-io.ts for
single-source consistency) that splits a multi-fence file into per-note verbatim byte strings
before parsing. Update `readNoteDir` to iterate the split notes (keyed by frozen id or
`<file>#<n>`), run both gates and the survival/byte-equal logic per note, and fail closed on any
`trailingMalformed` remainder. Add a RED-first test that builds a two-note thread via `writeThread`,
drops the buried verified finding from the promoted set, and asserts exit 1. A single-note-per-file
corpus structurally cannot detect this class.

**Progress across 5 rounds:**

| Round | Bypass closed | New bypass found |
|-------|--------------|-----------------|
| 1 | Baseline oracle | drop-to-empty |
| 2 | drop-to-empty | tuple-collision |
| 3 | tuple-collision | FA-exemption + raw-side collision |
| 4 | FA-exemption + raw-collision | whitespace/parser-projection drift |
| 5 | whitespace/parser-projection drift (line-shape class closed for all shapes and fields) | multi-note thread file (read path parses only note #1; notes #2+ invisible to oracle) |

SC1 (two-tier separation), SC3 (dial), and SC4 (Workflow 18) are verified and untouched across all
five rounds. SC2 (the carve-out oracle — CMP-02) remains the open gap for round 6.

---

_Verified: 2026-06-18T23:55:00Z_
_Verifier: Claude (gsd-verifier)_
_Round: 5 (re-verification after round-4 22-06 gap-closure)_
