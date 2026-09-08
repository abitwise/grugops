---
phase: 31-autonomous-manual-testing
plan: 14
subsystem: infra
tags: [governance, admission, compaction, context-io, typescript, derived-sets]

requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-09's unconditional admission call in appendNote (the CR-05 closure this plan must not undo), admitAndAppend's gated pre-admitted branch, and the derived writer/caller assertions in scripts/context-io-writer-set.test.ts"
  - phase: 31-autonomous-manual-testing
    provides: "31-10's derived refusal-family axis and the (writer x family) matrix the new writer column joins"
provides:
  - "promoteAdmitted — an exported, proof-gated re-binding route in scripts/context-io.ts that carries an already-admitted note forward byte-identically, gated by a proof over the origin's own stored bytes rather than by any caller-settable flag"
  - "A thin promoteAdmitted pass-through in scripts/compactor.ts; promote() is byte-unchanged and pinned by test"
  - "PROMOTE_ADMITTED_DECLINES — an exported register that is the single source of every decline sentence, with its key set asserted equal to the clause set derived from the route's own parsed body, in both directions"
  - "PROMOTE_ADMITTED_RESIDUALS — the two trust boundaries the route does not close, published rather than left silent"
  - "A cross-file, alias-resolving caller derivation for both promotion routes"
  - "Workflow 18 steps 4/5/6 and its stop/trace/done sections rewritten to describe the two routes that now exist"
  - "D-19, recorded in .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md and mirrored beside the route in source"
affects: [context-compaction, governance-dial, admission, phase-32]

actuals:
  tokens: 45071
  tasks: 4
  commits: 6
plan_head_before: e89daab418c149ee08425d8c4eb1dd6408f8d4cb

tech-stack:
  added: []
  patterns:
    - "A safety skip is granted by a PROOF over bytes that already exist, never by a parameter a caller can set"
    - "A route's own decline set is derived from its parsed body and bound to an exported register in both directions"
    - "A cross-file caller derivation resolves import aliases, because a renamed binding is the same callee"

key-files:
  created:
    - docs/audit/29-style-dispositions/31-14.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/compactor.ts
    - scripts/compactor.js
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - scripts/context-io.test.ts
    - scripts/compactor.test.ts
    - scripts/context-io-writer-set.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/18-context-compaction.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md

key-decisions:
  - "D-19: promotion of an already-admitted note is a RE-BINDING, decided by a proof over the origin's own stored bytes — never by a parameter, flag or option a caller can set. The entry set is the human-disposition stamp and is decided FIRST; every other shape falls through to full admission byte-identically to promote() today. The skip is scoped to the human-stamp arm, never to the authority: the same discriminated governance read fails closed here. A re-binding appends no GOV-02 audit event, because the origin's event already keys this exact id."
  - "add-alongside, accepted as debt: the re-binding case is NOT promoted into admit() as a new arm, because that arm is frozen by an earlier phase's forged-stamp backstop and editing it is a strictly larger blast radius than the gap requires."
  - "CR-08's alternative (promotion must re-adjudicate through the hook on every compaction) is REJECTED with rationale: it converts a routine, non-semantic operation into a human gate at compaction frequency."
  - "The compared field set is derived from the store's own read-back projection rather than hand-typed, so the four scalars the verifier named are members by construction and every other stored field is compared too."

patterns-established:
  - "Ask how a gate is REACHED, not only what it refuses: a re-write reaches a predicate built only to decide new admissions."
  - "When a route joins a derived set, move BOTH axes — the set it joins and the set it introduces."
  - "A derived premise that FIRES on your own change is the derivation working; move the constant with a written reason, in the same commit as the cause."

requirements-completed: [UATX-01, UATX-04]

coverage:
  - id: D1
    description: "A note a named human already disposed at the origin promotes UNCHANGED to a fresh destination and is byte-identical there — the exact CR-08 sequence the round-3 verifier watched being refused."
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#GREEN 1: the identical note promotes through the proof-gated route and is BYTE-IDENTICAL at the destination"
        status: pass
      - kind: integration
        ref: "scripts/compactor.test.ts#CR-08 end-to-end through the compactor: the origin write is admitted and the promotion is NOT refused"
        status: pass
      - kind: manual_procedural
        ref: "the verifier's own child-process probe re-run against the rebuilt committed .js — pre-fix and post-fix output quoted verbatim below"
        status: pass
    human_judgment: false
  - id: D2
    description: "The round-trip holds under every value of the human_admission dial, with the dial absent, and under both audit_retention values."
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#GREEN 2 — the round-trip holds under {6 dial cases}"
        status: pass
      - kind: unit
        ref: "scripts/compactor.test.ts#LEGITIMATE: the compactor's re-binding writes under human_admission {5 values} x audit_retention {git,retained}, plus the absent dial"
        status: pass
    human_judgment: false
  - id: D3
    description: "CR-05 is not reopened: a fabricated §14-gate stamp is refused through the unchanged route AND through the new route with an unbacked source id, with zero files written in both."
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#CR-05 probe 1 / CR-05 probe 2"
        status: pass
      - kind: integration
        ref: "scripts/compactor.test.ts#CR-05 stays closed through the compactor: a fabricated §14-gate stamp is refused on BOTH routes, zero files"
        status: pass
    human_judgment: false
  - id: D4
    description: "Provenance re-binding is untouched: a §14-gate-stamped finding and an artifact-ref do NOT take the proof route; each re-admits at the destination against a live green verdict there and is refused when that verdict is absent."
    requirement: "UATX-04"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#a §14-gate-stamped finding does NOT take the proof route / an artifact-ref does NOT take the proof route"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#a note carrying a §14-gate stamp falls THROUGH to full admission"
        status: pass
    human_judgment: false
  - id: D5
    description: "Both axes are derived: promoteAdmitted joins the derived writer set (4->5), the derived pre-admitted caller set (1->2 members, 2->3 sites) and the derived appendNote call-site count (4->5); and the set of shapes its own proof declines is derived from its parsed body, bound to the exported register in both directions, and exercised clause by clause."
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#PART SIX / PART SIX-B / PART SIX-C / PART SIX-D (35 cases)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Workflow 18 steps 4, 5 and 6 and its stop, trace and done sections describe the two routes accurately, with honest degradation scoped to a note that CHANGED and a stop-and-escalate posture for a refused faithful promotion."
    verification:
      - kind: other
        ref: "npm run check:imperative-lexicon && npm run check:banned-claims && npm run check:public-docs && npm run check:claim-anchors — ALL CHECKS PASSED"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js — ALL CHECKS PASSED, no FAIL line names 18-context-compaction.md"
        status: pass
      - kind: other
        ref: "npm run check:diff-disposition — 0 findings name 18-context-compaction.md (was 10)"
        status: pass
    human_judgment: true
    rationale: "The gates decide FORM — verb position, sentence length, banned literals, disposition coverage. Whether the rewritten prose actually stops an agent from downgrading a human's adjudicated disposition is a reading judgment no gate makes, and it is the whole point of the rewrite."

duration: 41 min
completed: 2026-09-08
status: complete
---

# Phase 31 Plan 14: The proof-gated re-binding route Summary

**`promoteAdmitted` — an exported route that carries an already-admitted note forward byte-identically, gated by a proof over the origin's own stored bytes rather than by any flag a caller can set, closing the CR-08 regression 31-09 introduced while correctly closing CR-05.**

## Performance

- **Duration:** 41 min
- **Tasks:** 4
- **Files modified:** 15 (1 created)
- **Commits:** 6 (measured: `git rev-list --count e89daab..HEAD`)

## Accomplishments

- Reproduced the round-3 verifier's CR-08 sequence against the committed `.js` BEFORE any source
  change, and re-ran the identical probe against the rebuilt `.js` afterwards. Both outputs are
  quoted verbatim below.
- Added `promoteAdmitted` to `scripts/context-io.ts` and a thin pass-through to
  `scripts/compactor.ts`. `promote()` is byte-unchanged and pinned by test.
- Moved BOTH derived axes: the writer/caller sets the route joins, and the decline set it
  introduces — each read off the parse and each with a written reason.
- Rewrote Workflow 18 steps 4, 5 and 6 plus its stop, trace and done sections, and recorded a
  disposition row for all 46 clauses the rewrite changed.
- Drove every derived caller with a LEGITIMATE input — the probe the round that created CR-08
  skipped — under every dial value and both audit-retention values.

## Task Commits

1. **Task 1 (tracer) RED: the verifier's own CR-08 probe** — `7aae9e0` (test)
2. **Task 1 (tracer) GREEN: promoteAdmitted, the proof-gated route, and D-19** — `dba100a` (feat)
3. **Task 2: derive BOTH axes** — `ad36fc1` (test)
4. **Task 3: Workflow 18 steps 4/5/6 and the stop/trace/done sections** — `892deca` (docs)
5. **Task 4: self-red-team — the legitimate input under every dial** — `9897513` (test)
6. **Hook manifest regenerated for the moved checkpoint constants** — `b45e417` (chore)

_The tracer task carries two commits (RED then GREEN), which is the TDD commit-scope contract._

## The RED baseline, quoted verbatim

Run in a child process with `CLAUDE_PROJECT_DIR` pointing at a temp project carrying
`{ human_admission: "high-severity", audit_retention: "retained" }` and **no approval grant in its
environment** — both preconditions asserted before any output was recorded.

```
PRECONDITION GRUGOPS_ADMISSION_APPROVED_BY = null
PRECONDITION CLAUDE_PROJECT_DIR = "/tmp/cr08-proj-2i7YK0"
PRECONDITION trustedRepoRoot() = /tmp/cr08-proj-2i7YK0

--- ORIGIN (admitAndAppend, gated branch) ---
origin id       : "20260908T020000Z-security-nfr-finding-93ce7d56"
origin findings : []
origin notes    : ["20260908T020000Z-security-nfr-finding-93ce7d56.md"]

--- PROMOTION (compactor.promote, same note, same body, fresh destination) ---
promote id      : null
promote THREW   : context-io.appendNote: refusing to write a note the admission authority did not accept. Nothing was written:
admission REFUSED (human_admission: high-severity): a high-severity governance entry authored by "security-nfr" (security, architecture, or release) carries a self-authored human disposition stamp (verified_by: human:alice) that this in-script tier cannot verify was placed by a real human. A high-severity admission is granted ONLY through the un-forgeable admission-guard hook (a human exports the approval in the launching shell); a self-authored human:NAME stamp does not satisfy it. Admission is refused until a named human disposes it through the hook. This is the in-script defense-in-depth tier; on Claude Code the un-forgeable gate is the separate admission-guard hook.
dest notes      : []

--- promoteAdmitted (the proof-gated re-binding route) ---
exported by context-io : undefined
exported by compactor  : undefined
```

The suite RED at the same moment: **16 failed | 496 passed (512)** across
`scripts/context-io.test.ts` and `scripts/compactor.test.ts`. The two cases that PASSED are the
controls — no approval grant leaks into this process, and the unchanged full-admission route refuses.

## The GREEN measurement, same probe, rebuilt `.js`

```
--- promoteAdmitted (the proof-gated re-binding route) ---
exported by context-io : function
exported by compactor  : function
promoteAdmitted id    : "20260908T020000Z-security-nfr-finding-228f9abe"
promoteAdmitted THREW : (nothing)
dest2 notes           : ["20260908T020000Z-security-nfr-finding-228f9abe.md"]
destination bytes === origin bytes : true
destination note text:
---
id: 20260908T020000Z-security-nfr-finding-228f9abe
kind: finding
by: security-nfr
at: 2026-09-08T02:00:00Z
verified_by: human:alice
confidence: high
refs:
  - REQ-SEC-01
supersedes:
---

Session cookie is missing the Secure attribute on the checkout host.
```

The frozen id is carried forward, so the destination file **is** the origin file. That also keeps
the compaction carve-out's id-keyed raw-to-promoted match intact.

## CR-05 is not reopened — both probes, quoted

The round that created CR-08 probed promotion with a fabricated stamp ONLY. This round drives that
probe through BOTH routes.

```
--- CR-05 probe 1: fabricated §14-gate stamp through compactor.promote ---
promote id      : null
promote THREW   : context-io.appendNote: refusing to write a note the admission authority did not accept. Nothing was written:
admission FAIL: no live green §14-gate verdict found for "§14-gate#fabricated-run-id" under task "TICKET-CR08". A finding stamped §14-gate#fabricated-run-id is admitted only when a real green gate verdict with that per-run id exists in the task context (Posture B).
dest3 notes     : []

--- CR-05 probe 2: fabricated stamp through promoteAdmitted, no admitted origin ---
promoteAdmitted id    : null
promoteAdmitted THREW : context-io.appendNote: refusing to write a note the admission authority did not accept. Nothing was written:
admission FAIL: no live green §14-gate verdict found for "§14-gate#fabricated-run-id" under task "TICKET-CR08". A finding stamped §14-gate#fabricated-run-id is admitted only when a real green gate verdict with that per-run id exists in the task context (Posture B).
dest4 notes           : []
```

Probe 2 is the one the previous round could not have run: the fabricated stamp is not a human
disposition, so it never enters the proof at all — it falls through to full admission and is refused
by the authority. Zero files in both.

## The derivations, before and after, with the reason each moved

Every constant below moved because the derivation was **re-run and its output read**, never adjusted
until a case passed.

| derivation | before | after | reading that moved it | reason |
|---|---|---|---|---|
| `EXPECTED_NOTE_WRITERS` | 4 members | 5 members | `["admitAndAppend","appendNote","emitCheckpointNote","emitVerdict","promoteAdmitted"]` | the route is exported and reaches the write chokepoint on both its paths, so it is a note writer and the matrix gains a column |
| `EXPECTED_NOTE_WRITER_COUNT` | 4 | 5 | same reading | asserted separately so a member change and a cardinality change read differently |
| `EXPECTED_PRE_ADMITTED_CALLERS` | 1 member | 2 members | `[["admitAndAppend",2],["promoteAdmitted",1]]` | the route is the second function permitted to skip the human-stamp arm — a decision (D-19), not a widened constant |
| `EXPECTED_PRE_ADMITTED_CALL_SITES` | 2 | 3 | same reading | the route's single post-proof write |
| `EXPECTED_APPEND_NOTE_CALL_SITES` | 4 | 5 | `[["scripts/check-uat-oracles.ts",2],["scripts/compactor.ts",1],["scripts/context-io.ts",2]]` | the fifth is the route's FALL-THROUGH, which is how a gate-stamped finding still reaches full admission |
| WR-10's `trustedRepoRoot()` default count | 2 | 3 | the premise FIRED on this change | the third writer default is the route's governance seam, moved in the same change as the caller — as 31-09 moved the first two together |
| `WORKFLOW_STOP_BULLET_COUNT` | 38 | 39 | the two-sided anchor fired | Workflow 18's new stop condition |
| `CHECKPOINT_SITE_COUNTS.escalate_unadjudicable_result` | 1 | 2 | the id-to-sites map fired | the new stop condition reuses the EXISTING id at a second site |
| `RECORDED_TOTAL_SITES` | 16 | 17 | the independent total fired | moved in the same commit as the tag, per the 30-05 precedent in that file |
| `EXPECTED_ADMIT_REFUSAL_SITE_COUNT` | 8 | 8 | re-read, unchanged | the authority gained no refusal; this plan adds a route beside it |
| `EXPECTED_AGENT_FACTORY_MENTIONS` | 4 | 4 | re-read, unchanged | Workflow 18 still names `appendNote` |
| node:fs binding count | 14 | 14 | re-read, unchanged | no import was added |

### Derived decline clauses and their dispositions

Derived from `promoteAdmitted`'s own parsed body (six clauses), bound to the exported
`PROMOTE_ADMITTED_DECLINES` register in BOTH directions, and each exercised by a probe that reaches
exactly it and asserts zero files written.

| clause | disposition | acceptance evidence |
|---|---|---|
| `empty-source-id` | **decided** — a re-binding names the note it re-binds; an empty or blank id names nothing | probe drives `"   "` as the source id; refusal names the clause; zero files |
| `unreadable-governance-config` | **decided** — the skip is scoped to the human-stamp arm, never to the authority, so an unknowable dial fails closed here as it does in `admit()` | probe drives a corrupt `factory.config.json` at the governing root; zero files |
| `no-such-origin-note` | **decided** — with no origin record the proof has no left operand, and the promotion is a new admission | probe names an id no origin note carries; also the shape reached by a different task id and by an empty origin context |
| `origin-note-not-live` | **decided** — liveness is the deterministic replay, never file position or mtime; a superseded disposition is one a later note withdrew | probe writes a superseding note at the origin, then promotes the superseded id |
| `field-differs-from-origin` | **decided** — a note whose provenance changed is a new note, and a new note is a new admission | probe alters the disposition stamp (`human:mallory`); the same clause is reached by an altered author, timestamp, refs or confidence, naming the differing key |
| `body-differs-from-origin` | **decided** — a compaction that CHANGED the note is not a re-binding; it is the case Workflow 18 step 6 is for | probe appends a sentence to the body; refusal names the clause; zero files |

### Named residuals of the re-binding route

Two boundaries are **named residuals** rather than decline clauses, published in the exported
`PROMOTE_ADMITTED_RESIDUALS`. They are deliberately kept out of the enumeration above, because that
enumeration is asserted equal to the derived clause set and a residual is not a clause.

| residual | disposition | reason |
|---|---|---|
| `T-31-14-03` — a note HAND-WRITTEN into the origin `notes/` directory and then promoted | **named residual**, accept | the origin store is trusted here exactly as far as every other reader trusts it; workflows 16 and 18 forbid hand-authoring a context path, and the un-forgeable tier remains the per-call admission-guard hook. What would force it open: a mechanism that can attest the origin directory's own integrity |
| `R-37` — the compared field set is the store's read-back projection plus the body | **named residual**, accept | a frontmatter key the parser accepts and that projection drops is not compared — and is also not read by `admit()` or `render()`, so the boundary is the store's view of a note rather than this route's |

### The entry set, named

The proof route can be ENTERED only by a note whose `verified_by` is a `human:NAME` disposition
stamp, through one of the derived callers below. Every other shape — a `§14-gate#<id>` stamp, an
empty stamp — falls THROUGH to full admission. Asserted in both directions: a gate-stamped finding
falls through and is refused by the AUTHORITY (the message is `admission FAIL`, not `DECLINED`), and
a soft note with no stamp falls through and WRITES with a NEW id, so the fall-through is not a
disguised refusal.

## The caller table — every caller driven with a LEGITIMATE input

Derived across the tracked non-test corpus under `scripts/`, `hooks/` and `install/`, with import
aliases resolved. This is the table `31-09`'s blast-radius table should have been: its rows were
dispositioned from a fabricated-stamp probe only, and the omission is visible by contrast in the
first column.

| caller (derived) | legitimate input | outcome | illegitimate input | outcome |
|---|---|---|---|---|
| `scripts/compactor.ts::promoteAdmitted` (the only in-repo caller of the re-binding route) | a human-disposed finding with a matching live origin | **writes**, id `=== sourceId`, destination bytes `===` origin bytes, under every dial x retention | the same note with `verified_by: human:mallory` | **refused** `DECLINED (field-differs-from-origin)`, zero files |
| `scripts/context-io.ts::promoteAdmitted` (the route itself, driven directly) | same | **writes**, byte-identical | `sourceId` naming no origin note | **refused** `DECLINED (no-such-origin-note)`, zero files |
| `scripts/compactor.ts::promote` (full-admission route) | an admissible note of **every one of the six kinds**, the `finding` earned against a real seeded green verdict | **writes** all six, six distinct ids | a fabricated `§14-gate#fabricated-run-id` finding | **refused** `admission FAIL: no live green §14-gate verdict found`, zero files |
| `scripts/context-io.ts::promoteAdmitted` -> `appendNote` (the fall-through) | a soft note with no stamp | **writes**, with a NEW id | a gate-stamped finding with no live verdict | **refused** by the authority, zero files |
| `scripts/context-io.ts::appendNote` (the writer the fall-through lands on) | covered by the six-kind converse case | **writes** | the human-disposed finding under an active dial | **refused** `admission REFUSED (human_admission: high-severity)`, zero files — the CR-08 regression, deliberately still true on this route |
| `scripts/context-io.ts::admitAndAppend` (the other caller of the private pre-admitted route) | the human-disposed finding under an active dial | **writes** (the gated branch) | the same note with no disposition stamp | **refused** `admission REFUSED`, zero files |
| `scripts/check-uat-oracles.ts::equivDoWork` (third derived `appendNote` caller) | not a promotion route caller | out of this table's scope | — | its own suite (`check-uat-oracles`) reports `ALL CHECKS PASSED` |

### The dial matrix, measured

The legitimate re-binding was driven under **every** dial value crossed with **both** retention
values, plus the absent dial — one case per combination, never one case looping a list:

| `human_admission` | `audit_retention: git` | `audit_retention: retained` |
|---|---|---|
| `"off"` | writes, byte-identical | writes, byte-identical |
| `"high-severity"` | writes, byte-identical | writes, byte-identical |
| `"all"` | writes, byte-identical | writes, byte-identical |
| a present typo string | writes, byte-identical | writes, byte-identical |
| a present NON-STRING (gate-or-stricter) | writes, byte-identical | writes, byte-identical |
| ABSENT (no configuration file at all) | writes, byte-identical | n/a — absence has no retention |

**Why the origin writer is chosen by the module's own predicate, not by a hand-typed dial list:**
under an ACTIVE dial a human-stamped high-severity finding is gated, so the combiner's pre-admitted
branch is the only route that writes it; under the LEAN dial the same note is NOT gated and the
combiner REFUSES a `human:NAME` stamp on a non-gated note (W3), while `appendNote` admits it.
Hard-coding either writer would have made the matrix measure the writer's precondition instead of
the promotion.

### The retained-mode ledger, quoted and reconciled against D-19

After the origin write, the ledger holds exactly one event:

```json
{"id":"<origin id>","kind":"finding","by":"security-nfr","severity":"high","verified_by":"human:alice","disposed_by":"human:alice","at":"2026-09-08T02:00:00Z"}
```

After the promotion, the ledger is **byte-identical** — the assertion is `toEqual(afterOrigin)`, not
merely a count. This **agrees** with D-19's stated behaviour: a re-binding decides no admission, so
it records none, and a second line keyed by the origin's own id would be the duplicate `31-09`
collapsed rather than widened. No disagreement to resolve. Under the lean `git` retention no ledger
file is created at all, also measured.

## Watched-fail results

| control | result |
|---|---|
| seeded EXTRA decline clause vs. the un-seeded source | derived count `6 -> 7`, seeded key present, and the seeded key reported UNBOUND against the register. Watched FAILING with the seed neutralized: `AssertionError: expected 6 to be 7` at the count assertion |
| RENAMED re-binding route | `declarationFound === false`, zero sites, and `assertDeclinePremise` THROWS `/PREMISE/` — a derivation that measured nothing fails as a premise, never as a member disagreement |
| seeded SECOND pre-admitted caller vs. the new baseline | live `{"callers":["admitAndAppend","promoteAdmitted"],"sites":3}` -> mirror `{"callers":["admitAndAppend","promoteAdmitted","seededSecondPreAdmittedCaller"],"sites":4}` — still discriminates, count moves by exactly one |
| seeded EXTRA note writer vs. the new baseline | live 5 members -> mirror 6 members including `seededImpostorNoteWriter` |
| the neutralized-authority mirror (31-05/31-10) | still inverts every behavioural cell of the sanctioned writer — unchanged by this plan |

## Files Created/Modified

- `scripts/context-io.ts` — `promoteAdmitted`, `PROMOTE_ADMITTED_DECLINES`,
  `PROMOTE_ADMITTED_RESIDUALS`, `declineRebinding`; `readContext` refactored onto one reader
  (`readRawNotes`) and one projection (`recordFromParsed`) so the proof reads no second walk and no
  second id rule.
- `scripts/compactor.ts` — the `promoteAdmitted` pass-through and its alias import. `promote()` is
  byte-unchanged.
- `scripts/checkpoints.ts` — three recorded numbers moved with the tag that moved them.
- `scripts/context-io.test.ts` — the CR-08 block (17 cases).
- `scripts/compactor.test.ts` — the compactor CR-08 block and the self-red-team dial matrix.
- `scripts/context-io-writer-set.test.ts` — PART SIX (the derived decline axis), SIX-B (its
  controls), SIX-C (the clause probes and the entry-set converse), SIX-D (the cross-file caller
  derivation and the SUMMARY binding).
- `agent-factory/workflows/18-context-compaction.md` — steps 4, 5, 6 and the stop, trace and done
  sections.
- `docs/audit/29-style-dispositions/31-14.md` — 46 disposition rows, with a companion edit for every
  frozen `## Stop conditions` clause.
- `hooks/hook-entry.{ts,js}` — the frozen module manifest, regenerated.
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — D-19 appended; D-01, D-02, D-03,
  D-04, D-17 and D-18 byte-unchanged (the diff is 75 insertions, 0 deletions).

## Review Dispositions Ledger

| Finding | Severity | Disposition | Acceptance evidence |
|---|---|---|---|
| CR-08 — compaction can no longer promote a human-disposed high-severity finding | Critical | **incorporated** | The verifier's own probe, RED then GREEN, quoted above; 512/512 in the two suites |
| CR-08 `Fix:` (a) — an exported proof-gated route writing via the pre-admitted path | Critical (sub-clause) | **incorporated** | `promoteAdmitted` in `scripts/context-io.ts`; liveness + byte-equality asserted; `appendPreAdmittedNote` still not exported |
| CR-08 `Fix:` (b) — extend the derived caller-set assertion with a watched-fail mirror | Critical (sub-clause) | **incorporated** | Caller set 1->2, sites 2->3, mirror re-run against the new baseline and quoted above |
| CR-08 `Fix:` (c) — drive the high-severity origin-then-promote case | Critical (sub-clause) | **incorporated** | GREEN 1, the six dial cases, and the 11-case compactor dial matrix |
| CR-08 `Fix:` (d) — rewrite Workflow 18 steps 4 and 6 | Critical (sub-clause) | **incorporated** | Extended to step 5 and to the stop/trace/done sections so all four agree |
| CR-08's alternative (promotion must re-adjudicate) | Critical (alternative) | **rejected, with rationale** | Recorded in D-19: it converts a routine operation into a human gate at compaction frequency, and the verifier's own `missing:` prescribes the proof route |
| IN-07 — WF18 step 5's "carry no stamp and pass through" is no longer exact | Info | **incorporated** | Step 5 now reads "admitted without a cross-check", and names the D-14 unreadable-config refusal explicitly |

## Decisions Made

**D-19** (recorded in full in `31-CONTEXT.md` and mirrored beside the route in
`scripts/context-io.ts`): promotion of an already-admitted note is a RE-BINDING, decided by a proof
over bytes that already exist at the origin — never by a parameter, flag or option a caller can set.
Four sub-decisions: (1) the entry set is the human-disposition stamp and is decided FIRST, so every
other shape falls through to full admission; (2) the proof requires the named source note to be
present AND live in the origin's deterministic replay, and the promoted input to recompose to
exactly the record stored there, with the frozen id carried forward; (3) the skip is scoped to the
human-stamp arm and the same discriminated governance read fails CLOSED here; (4) a re-binding
appends NO GOV-02 audit event. `add-alongside` is accepted as debt, with the two conditions that
would force a later promote into the authority. Reversibility: **costly**.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The frozen hook manifest had to be regenerated**
- **Found during:** Task 1 (GREEN)
- **Issue:** `hooks/hook-entry.{ts,js}` freezes a hash of every hook module, `scripts/context-io.js`
  among them. Changing the module made the wrapper deny with "does not match the frozen manifest",
  failing two `hooks/guard.test.ts` cases for a reason unrelated to what they measure.
- **Fix:** `npm run generate:hook-manifest`, then rebuild. The manifest moves with the module it
  verifies.
- **Verification:** `hooks/admission-guard.test.ts` + `hooks/guard.test.ts` — 303 passed.
- **Committed in:** `dba100a`

**2. [Rule 3 - Blocking] The WR-10 derived premise fired on this change**
- **Found during:** Task 1 (GREEN)
- **Issue:** `scripts/context-io.test.ts`'s reverted-default mirror asserts the
  `repoRoot = trustedRepoRoot())` default occurs EXACTLY twice in the committed `.js`. The new
  route's governance seam made it three.
- **Fix:** Moved the premise 2 -> 3 with the reason written at the site. This is the derivation
  working, not breaking: the third writer default must have the same one trusted answer, so it moves
  in the same change as the caller — exactly as 31-09 moved the first two together.
- **Verification:** the case passes and its mirror still reverts every occurrence.
- **Committed in:** `dba100a`

**3. [Rule 3 - Blocking] Three checkpoint-roster constants had to move with the new stop condition**
- **Found during:** Task 4
- **Issue:** Workflow 18's new stop condition carries `checkpoint: escalate_unadjudicable_result`,
  which moved the two-sided anchors in `scripts/checkpoints.ts`: the live corpus derived 39 stop
  bullets against a recorded 38, and the id-to-sites map disagreed.
- **Fix:** `WORKFLOW_STOP_BULLET_COUNT` 38 -> 39, `escalate_unadjudicable_result` 1 -> 2,
  `RECORDED_TOTAL_SITES` 16 -> 17, with the reason recorded in that file's own precedent paragraph.
  The EXISTING id is reused rather than a new one added: the case IS an unadjudicable result.
- **Verification:** `scripts/checkpoints.test.ts` — 147 passed.
- **Committed in:** `9897513`, with the frozen hook manifest regenerated in `b45e417` because `scripts/checkpoints.js` is inside the hook deciders' module closure.

**4. [Rule 1 - Bug] The plan's own test fixture pointed governance at a root the compactor cannot read**
- **Found during:** Task 1 (GREEN)
- **Issue:** The first compactor case passed an explicit `repoRoot` to `mod.promote`, which takes
  none — it is a pass-through, and a compactor that could choose the governance root would be the
  seam 31-09 removed from the writer. The dial was therefore inactive and the case measured nothing.
- **Fix:** The compactor cases set `CLAUDE_PROJECT_DIR` and restore it, which is how a host actually
  sets the dial and how the round-3 verifier reproduced CR-08.
- **Verification:** the case now observes the D-04 refusal it claims to be causing.
- **Committed in:** `dba100a`

**5. [Deliberate] Committed on `main`**
- The GSD executor protocol halts on a commit to the default branch absent an
  `git.allow_default_branch_commits` override, which this project's `config.json` does not carry.
  The orchestrator's dispatch explicitly directs sequential execution on `main`
  (`use_worktrees: false`, `branching_strategy: "none"`), and every prior plan in this phase —
  `31-13` included — is committed on `main`. Recorded here rather than silently.

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 bug) + 1 recorded posture.
**Impact on plan:** every auto-fix was a derived assertion firing on this change and being answered
with a moved constant and a written reason. No scope creep.

## Issues Encountered

- **`npm run check:diff-disposition` exits non-zero for a PRE-EXISTING reason.** Measured before this
  plan touched any prose: 75 findings over 39 elements, of which 10 named
  `18-context-compaction.md`. After `docs/audit/29-style-dispositions/31-14.md` landed: **0 findings
  name `18-context-compaction.md`**, and the remaining 65 name
  `05-pr-quality-gate.md`, `06-uat-pack.md` and `17-task-claim.md` — three workflows this plan does
  not touch. The task's `fails_when` clause that is actionable ("an undispositioned changed clause
  reported for `18-context-compaction.md`") is satisfied; the non-zero exit is the pre-existing
  remainder, already logged in `deferred-items.md` by `31-09` and re-measured there by this plan.
- **Two SUMMARY-binding cases were RED in commit `9897513`** and green in the SUMMARY commit that
  follows it. The binding is fail-closed on a missing SUMMARY by design — an empty enumeration would
  equal an empty derived set and report coverage nobody wrote down.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired component was introduced.

## Threat Flags

None. The plan's `<threat_model>` covers every surface this change introduces
(`T-31-14-01` through `T-31-14-07`), and the two accepted residuals are published in the exported
`PROMOTE_ADMITTED_RESIDUALS` register rather than left as prose.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Round-3 gap 2 (`CR-08`) is closed at the coordinates the verifier measured, and the closure is
  checkable from the committed `.js` rather than from this summary's word: re-run the probe.
- `CR-05`'s closure is intact and re-measured through both routes.
- A future third re-write route cannot land silently: it arrives as a derived caller, a derived
  writer with an undecided matrix column, and an unbound decline clause, and reds three separate
  cases naming themselves.
- Still open for round 3: gap 1 (`UATX-06`, owned by `31-13`) and the `31-15` findings. Do NOT flip
  the `UATX-*` requirement rows to `Complete` here — only a verification round may.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-08*

## Self-Check: PASSED

- Every file named in `key-files` exists on disk (`[ -f ]`, 8/8 spot-checked including the created
  disposition file and this SUMMARY).
- All six task commits resolve in `git log --oneline --all`.
- Every task's `<acceptance_criteria>` was re-run after the last change: the two CR-08 suites
  (512 passed), the writer-set suite (109 passed), the hook suites and `floor-invariance`
  (366 passed), `checkpoints` (147 passed), and the whole regression lane.
- Plan-level `<verification>`: `npx vitest run --exclude '**/scripts/e2e/**'` — **3529 passed,
  2 skipped, 0 failed across 62 files** (the 2 skips are the pre-existing pair, unchanged by this
  plan). `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness` —
  exit 0, `Build parity: no tracked build output moved`, `All build outputs fresh: 60 committed .js
  file(s) match a rebuild of their sources`.
- `npm run check:diff-disposition` exits non-zero for the PRE-EXISTING reason recorded under
  "Issues Encountered"; 0 of its findings name `18-context-compaction.md`.
