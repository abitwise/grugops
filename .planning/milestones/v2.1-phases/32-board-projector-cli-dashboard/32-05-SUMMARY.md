---
phase: 32-board-projector-cli-dashboard
plan: 05
subsystem: tooling
tags: [typescript, conflict-derivation, golden-fixture, frontmatter, schema-version]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-01's grammar and published FactorySnapshot shape, and plan 32-03's six real source reads with their per-source SourceState"
  - phase: 31-uat-spec-integrity-and-admission
    provides: "the canonical-form admission posture the ticket document class adopts, and the derive-the-set-assert-the-count discipline both derived-set pin moves follow"
  - phase: 27-frontmatter-canonical-form
    provides: "CANONICAL_SCHEMA as the spawn-grant authority, left untouched here rather than widened to carry ticket keys"
provides:
  - "CONFLICT_KINDS / CONFLICT_KIND_COUNT — the closed seven-member conflict set, declared in the pure module in the order the contract lists them, with members and cardinality asserted as two separate cases"
  - "joinSnapshot — a pure function of the six already-read source states, deriving every conflict kind and emitting conflicts[] in one deterministic total order"
  - "parseTicketDocument / TICKET_KEYS — the ticket as a second DOCUMENT CLASS with its own closed eight-key set, answering the schema question plan 32-03 recorded"
  - "parseBoard's idPrefix option — D-02's prefix rule enforced by the parse as an unparsed line, not by an eighth conflict kind"
  - "scripts/fixtures/board-snapshot/ — a miniature repository manufacturing all seven kinds and populating every bucket of the line partition"
  - "scripts/fixtures/board-snapshot/expected-snapshot.json — the schemaVersion 1 golden, rendered byte for byte from committed inputs"
  - "agent-factory/contracts/board.md § Ticket documents, the conflict total order, and two named deferrals"
affects: [32-06, 32-07, 32-08]

actuals:
  tokens: 26020
  tasks: 3
  commits: 8
plan_head_before: ec482fd0f343f6033523c9d0de400b909fb006c8

tech-stack:
  added: []
  patterns:
    - "One grammar per DOCUMENT CLASS, not one grammar per repository: the kit adapter schema stays the spawn-grant authority and the ticket gets its own closed key set, rather than widening a safety constant for a reason unrelated to safety"
    - "A dial value the pure module needs arrives as a PARAMETER from the read seam, so a config-dependent rule is enforced by the parse without the parser ever touching a file"
    - "A golden normalized on exactly two axes — every wall-clock field and every absolute path — so the frozen document is a function of the committed inputs and of nothing else"
    - "The golden's inventory derived FROM THE GOLDEN FILE and compared against the declared set in both directions, behind a PREMISE that the file parsed and is non-empty"
    - "A missing golden is a legible assertion naming its regeneration command, never a collection crash that reports as `no tests ran`"
    - "A derived-set pin whose discriminating property has stopped discriminating is re-derived on a better property, with both halves and both counts left two-sided"

key-files:
  created:
    - scripts/fixtures/board-snapshot/plans/board.md
    - scripts/fixtures/board-snapshot/plans/traceability.md
    - scripts/fixtures/board-snapshot/plans/tickets/ABC-101.md
    - scripts/fixtures/board-snapshot/plans/tickets/ABC-102.md
    - scripts/fixtures/board-snapshot/plans/tickets/ABC-103.md
    - scripts/fixtures/board-snapshot/plans/tickets/ABC-104.md
    - scripts/fixtures/board-snapshot/plans/tickets/ABC-105.md
    - scripts/fixtures/board-snapshot/plans/tickets/ABC-106.md
    - scripts/fixtures/board-snapshot/plans/tickets/ABC-200.md
    - scripts/fixtures/board-snapshot/agent-factory/config/factory.config.json
    - scripts/fixtures/board-snapshot/.grugops/queue/claimed/abc-104-implement/claim.md
    - scripts/fixtures/board-snapshot/.grugops/queue/claimed/abc-105-tampered/claim.md
    - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/index.jsonl
    - scripts/fixtures/board-snapshot/README.md
    - scripts/fixtures/board-snapshot/expected-snapshot.json
  modified:
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-model.test.ts
    - scripts/board-read.test.ts
    - scripts/validate.test.ts
    - scripts/check-foundation-guards.test.ts
    - agent-factory/contracts/board.md

key-decisions:
  - "The TICKET is a second DOCUMENT CLASS with its own closed eight-key set, read by parseTicketDocument in the pure board module. CANONICAL_SCHEMA — the spawn-grant authority closed at Phase 27 round 12 — is left untouched"
  - "D-02's id_prefix rule is enforced by the PARSE as an unparsed line, with the dial's value passed in by the read seam, rather than by an eighth conflict kind that would have bumped schemaVersion"
  - "A board that could not be read produces NO conflicts: a missing source is one badge, not a hundred ticket-unplaced entries restating it"
  - "ticket-duplicated counts ROWS, not distinct columns, so two adjacent rows carrying one identifier under one heading are reported rather than silently deduped"
  - "conflicts[] is sorted by kind in declaration order, then ticket id, then column, then the originating line — the line being a sort key that is never an emitted field"
  - "The golden is normalized on exactly two axes, every wall-clock field and every absolute path, and on nothing else"
  - "A validator fixture repository is now a directory carrying BOTH marks a validator run needs; the retired-key config sweep keeps the wider carries-a-config set so nothing stops being scanned"

patterns-established:
  - "Document class over widened schema: when a second kind of document needs admitting, give it its own closed key set beside the existing authority rather than adding keys to a constant that governs something else"
  - "Config-dependent parse rules take the dial's VALUE as a parameter, keeping the parser pure while the rule is still enforced at parse time"
  - "Golden regeneration behind a named environment seam, with the exact command written next to the data it regenerates"

requirements-completed: [DASH-03, DASH-08]

coverage:
  - id: D1
    description: "CONFLICT_KINDS is a closed seven-member set whose members and cardinality are asserted as two separate cases, with a message that reads as a decision"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#the conflict-kind set has the expected MEMBERS, in the order the contract lists them"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#the conflict-kind set has the expected COUNT"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every conflict carries {kind, ticketId?, column?, expected, actual, source}; unparsed lines are not conflicts and live in unparsed[]"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#a bracket carrying a path separator is UNPARSED, raises no conflict, and builds no path"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#a board row with no ticket file is one `row-without-file` and the row still renders"
        status: pass
    human_judgment: false
  - id: D3
    description: "Board headings define the column set and order; a heading limit disagreeing with the dial is wip-limit, a configured column with no heading is column-missing, and a heading column absent from the dial is legal and noted"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#a heading limit that disagrees with `wip_limits` is one `wip-limit` carrying both numbers"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#a configured column with no heading is one `column-missing`"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#a heading column ABSENT from the dial is legal and noted, never refused (D-08)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The claimed live number is compared against counted rows, the conflict carries claimed, counted and limit, nothing is auto-corrected, and epic rows are excluded"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#a claimed live number that disagrees with the counted rows is one `wip-count`"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#an EPIC row under a limited heading is excluded from the `wip-count` comparison (D-02)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A row whose ticket file names a different column, or whose status is not the kebab of its column, is board-vs-ticket under the same kebab rule the validator applies"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#a row whose ticket file names a DIFFERENT column is one `board-vs-ticket`"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#a ticket whose `status` is not the kebab of its `column` is one `board-vs-ticket`"
        status: pass
    human_judgment: false
  - id: D6
    description: "ticket-unplaced, ticket-duplicated naming both columns with both rows rendering, and row-without-file with the row still rendering"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#a ticket file with NO board row is one `ticket-unplaced`"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#one ID under TWO headings is one `ticket-duplicated` naming both, and BOTH rows render"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#two rows with the same ID under the SAME heading is ONE conflict naming that column twice"
        status: pass
    human_judgment: false
  - id: D7
    description: "The committed fixture tree exercises all seven kinds, and the inventory is asserted two-sided against the golden file"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#holds a distinct conflict-kind set equal to CONFLICT_KINDS, asserted in both directions"
        status: pass
      - kind: integration
        ref: "node scripts/board-dashboard.js scripts/fixtures/board-snapshot --once --json — exit 0, seven distinct kinds, schemaVersion 1"
        status: pass
    human_judgment: false
  - id: D8
    description: "The fixture renders to expected-snapshot.json byte for byte, with a regeneration command that makes a shape change a one-command operation"
    requirement: "DASH-08"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#renders the committed fixture tree to the committed golden, byte for byte"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#serializes to identical bytes when run a second time in one process"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#carries the fixed placeholder in every wall-clock field, never a real timestamp"
        status: pass
    human_judgment: false
  - id: D9
    description: "conflicts[] is emitted in a deterministic total order, stable across filesystem and object key orders"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#emits `conflicts[]` in a deterministic total order, whatever order the sources arrive in"
        status: pass
    human_judgment: false
  - id: D10
    description: "joinSnapshot touches no filesystem — the join is a pure function of already-read values"
    requirement: "DASH-03"
    verification:
      - kind: other
        ref: "grep -vE '^\\s*(//|\\*|/\\*)' scripts/board-model.ts | grep -c 'node:fs' — prints 0"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#a bracket carrying a path separator is UNPARSED, raises no conflict, and builds no path"
        status: pass
    human_judgment: false
  - id: D11
    description: "The ticket document class: a closed eight-key set with refusal by name, resolving the schema question plan 32-03 recorded"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#the ticket key set has the expected MEMBERS and COUNT"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#REFUSES a key outside the closed set by name rather than ignoring it"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#admits a conforming ticket and joins it"
        status: pass
    human_judgment: true
    rationale: "The mechanical half is fully covered, but the DECISION — a second document class beside CANONICAL_SCHEMA rather than a widened spawn-grant schema — inverts an assumption plan 32-03 shipped and touches the Phase 27 safety boundary by adjacency. A human should read the three rejected alternatives recorded at parseTicketDocument and agree with the one taken before the shape is treated as settled."
  - id: D12
    description: "The schemaVersion 1 shape is the published contract a future web renderer consumes unchanged (DASH-08)"
    requirement: "DASH-08"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#pins the published schemaVersion, which no change may move without the golden moving with it"
        status: pass
    human_judgment: true
    rationale: "That the frozen field set is ADEQUATE for a renderer nobody has written yet is a judgment about a future consumer, not a property any test on this tree can assert. The reversibility is one-way (D-19), so a human should read expected-snapshot.json once and agree the shape is the one to be held to."

duration: 35 min
completed: 2026-09-14
status: complete
---

# Phase 32 Plan 05: The seven conflict kinds and the frozen golden — Summary

**Seven named conflict kinds derived from real disagreements between board, tickets and dial, emitted in one deterministic order by a join that touches no filesystem; the ticket frontmatter schema resolved as a second document class rather than a widened spawn-grant authority; and the `schemaVersion: 1` shape frozen by a 611-line golden rendered byte for byte from a committed miniature repository that manufactures every kind.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-09-14T11:04:46Z
- **Completed:** 2026-09-14T11:40:13Z
- **Tasks:** 3
- **Files modified:** 27 (17 created, 10 modified — counting the committed `.js` twins)

## Accomplishments

- **`CONFLICT_KINDS` is closed at seven, in the contract's order, and the order is load-bearing.** `conflicts[]` sorts by kind in declaration order, so reshuffling the array would silently reorder the committed golden — the count case says exactly that: an eighth kind is a decision recorded in `agent-factory/contracts/board.md` first, plus a `SCHEMA_VERSION` bump, plus a regenerated golden, all in one commit.
- **`joinSnapshot` is a pure function of the six already-read source states.** It imports neither `node:fs` nor `node:path`, so the ticket lookup is a match against the ticket LIST the reader produced rather than a path built from a bracket's contents (T-32-02). A named case feeds `- [../../etc/passwd]` and `- [ABC/001]`, asserts both land in `unparsed[]` with no conflict, and then asserts structurally that the module contains no path-building import at all.
- **Nothing is resolved silently, and nothing is hidden to report a conflict about it.** A duplicated identifier renders under both headings and the conflict names both; a row with no ticket file still renders. `ticket-duplicated` counts ROWS rather than distinct columns, so two adjacent rows carrying one identifier under one heading produce `In Development, In Development` — the shape a copy-paste slip makes, and the one a human most needs told about.
- **The fixture manufactures what the wild does not contain.** Research measured zero WIP mismatches across every real board reachable from this machine, so `wip-count` and `wip-limit` would have shipped unexercised. `scripts/fixtures/board-snapshot/` manufactures all seven, populates every bucket of the line partition, reaches the queue tamper skip with a committed artifact, and exercises the supersede fold. Its `README.md` maps each kind to the file and line that makes it.
- **The golden is a function of its committed inputs and of nothing else.** Sorted keys at every level, two-space indent, one trailing newline, and exactly two normalizations: every wall-clock field to `1970-01-01T00:00:00.000Z` and every absolute repository path to `<fixture-root>`. A second serialization in one process must produce identical bytes, and a named case asserts it. On mismatch the failure prints the first differing line number and both lines.
- **The inventory is derived from the golden FILE, in both directions.** Not from the live read — from the committed bytes, behind a `PREMISE:` assertion that the file parsed and its `conflicts[]` is non-empty. A declared kind no fixture reaches fails by name, and so does a kind in the golden that `CONFLICT_KINDS` does not declare. That is the assertion that makes "green over a five-kind golden" impossible.
- **Two open questions carried into this plan were closed with decisions, not paraphrases.** The ticket schema (deviation 1) and the `id_prefix` rule (deviation 2), both recorded in the contract.

## Task Commits

1. **Task 1 (RED): failing cases for the conflict kinds, the join and the ticket grammar** — `a57bd20d` (test)
2. **Task 1 (GREEN): the seven kinds, the pure join, the ticket document class** — `3f6b226a` (feat)
3. **The contract states the ticket class, the conflict order and two deferrals** — `354f2089` (docs)
4. **Task 2: the `board-snapshot` fixture tree** — `84cce3a3` (test)
5. **Task 3 (RED): failing golden, inventory and `schemaVersion` cases** — `f1e1b330` (test)
6. **Task 3 (GREEN): the committed golden** — `6e0c1f34` (feat)

**Plan metadata:** `26a00c8f` (`docs(32-05): complete the seven conflict kinds and golden plan` — the SUMMARY) and the commit that follows it, `docs(32-05): record plan completion in state, roadmap and requirements`, carrying STATE.md, ROADMAP.md and REQUIREMENTS.md. That last one is named by its message rather than its hash because it is the commit this paragraph lives in, and a hash written into a commit cannot be the hash of that commit.

`commits: 8` in the frontmatter is MEASURED with `git rev-list --count ${plan_head_before}..HEAD` against the base recorded beside it, not narrated: six task commits plus the two metadata commits above.

Each RED run was verified with `gsd-tools check tdd-red-evidence` and returned `RED_EVIDENCE_OK` (`target_test_failed`) before its GREEN commit was written. Vitest's TAP reporter indents nested leaf tests and prints no `node --test` summary line, so each record's `output` is that reporter's own bytes dedented, plus the counts the same run reported — a faithful rendering, recorded as such in the record's `note` field.

## Files Created/Modified

- `scripts/board-model.ts` / `.js` — `CONFLICT_KINDS`, `CONFLICT_KIND_COUNT`, `Conflict`, `ConflictKind`, `JoinInputs`, `JoinResult`, `joinSnapshot`, `sourceValue`, `TICKET_KEYS`, `TICKET_KEY_COUNT`, `TICKET_REFUSAL_CODES`, `TicketDocument`, `parseTicketDocument`, `ParseOptions`, and `matchRow`'s prefix arm
- `scripts/board-read.ts` / `.js` — the join wired in after the six reads, the dial read FIRST so the board parse gets `id_prefix`, tickets read through the ticket grammar, `Conflict` re-exported rather than declared twice, and `valueOrNull` collapsed into the single `sourceValue` spelling
- `scripts/board-model.test.ts` — 28 new cases across the closed set, the ticket grammar, all eleven `<behavior>` lines, the prefix rule, and the six golden cases
- `scripts/board-read.test.ts` — the two ticket-admission cases moved to the ticket document class
- `scripts/fixtures/board-snapshot/` — the miniature repository: a board with six columns across all three heading kinds, seven ticket documents, a dial, a queue with one good and one tampered claim, a context task with a supersede, a traceability file with its own comment hazard, and the `README.md` kind-to-line map
- `scripts/fixtures/board-snapshot/expected-snapshot.json` — the 611-line golden
- `agent-factory/contracts/board.md` — `### Ticket documents`, the restated `id_prefix` rule, the conflict total order, and two named deferrals
- `scripts/validate.test.ts` / `scripts/check-foundation-guards.test.ts` — two derived-set pins re-derived

## Decisions Made

1. **The ticket is a second DOCUMENT CLASS, not a widened schema.** See deviation 1. `CANONICAL_SCHEMA` is untouched.
2. **`id_prefix` is enforced by the parse, not by an eighth conflict kind.** See deviation 2.
3. **A board that could not be read produces no conflicts.** With `sources.board` unavailable there is nothing for a ticket to disagree WITH, and reporting every ticket as `ticket-unplaced` would restate one missing source as a hundred disagreements the D-12 badge already reports once. A named case asserts it.
4. **`ticket-duplicated` counts rows rather than distinct columns.** Counting distinct columns would silently dedupe an adjacent pair — a merge in all but name, in the one case a human most needs reported.
5. **The `wip-count` conflict carries all three numbers in its two string fields** (`claimed 2, limit 3` against `counted 3`), so the renderer can show `claimed / counted / limit` without reaching back into the column record. The payload shape stays the fixed six fields D-10 names.
6. **`source` names where the EXPECTATION came from**, never where the disagreement was noticed. A ticket naming a column expects the board to place it there (`tickets`); a dial naming a limit expects the heading to state it (`config`); a row expecting a file is the board's expectation (`board`).
7. **The golden's sort key includes the originating line, and the line is never an emitted field.** Conflicts are assembled as `{conflict, line}` pairs, sorted, then projected — so the order is total without the payload growing a seventh field that `schemaVersion: 1` would then be frozen around.
8. **The golden normalizes exactly two axes.** Any third normalization would be a field the golden has stopped freezing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The ticket frontmatter schema made `board-vs-ticket` underivable**

- **Found during:** Task 1
- **Issue:** Plan 32-03 routed `plans/tickets/*.md` through `admit` from `scripts/canonical-frontmatter.ts` and recorded the consequence rather than smoothing it over: `CANONICAL_SCHEMA` is the KIT ADAPTER schema (`name`, `description`, `tools`, …), so a ticket carrying `status:` or `column:` is refused with `unknown-key`. This plan requires both `board-vs-ticket` arms, and neither can be derived from a reader that refuses every real ticket. The carry-forward named this plan's join layer as the place to resolve it.
- **Fix:** The ticket is a second DOCUMENT CLASS with its own closed eight-key set (`id`, `title`, `status`, `column`, `size`, `priority`, `epic`, `feature`), admitted by `parseTicketDocument` in `scripts/board-model.ts` — the module that already owns every other shape the projector reads and that imports nothing at all. The same refuse-by-name posture applies: an unknown key, a duplicate key, an unrecognized line, an unclosed region and a control character are each refused by their own code. `CANONICAL_SCHEMA` is untouched. Three alternatives are recorded at the function with the reason each was refused: **widening `CANONICAL_SCHEMA`** would add keys to the spawn-grant authority closed at Phase 27 round 12 for a reason that has nothing to do with spawning; **a second `admit` entry point taking a widened alphabet** would contradict `AdmitOptions`'s structural promise that it can only narrow, and would be REQUIRED, because the canonical plain-scalar alphabet carries no `/` and this kit's own configured column `In Security/NFR` does; **leaving tickets refused** makes `board-vs-ticket` underivable and reports a schema mismatch as if it were a malformed document. This adds no spelling of an existing rule: `scripts/validate-agent-factory.ts:712-719` already reads a ticket's `column:` and `status:` with its own regex pair, and plan 32-08 deletes that pair in favour of this function, exactly as D-06 does for `boardColumnName` and `boardHasColumn`.
- **Files modified:** `scripts/board-model.ts`, `scripts/board-read.ts`, `scripts/board-read.test.ts`, `agent-factory/contracts/board.md`
- **Verification:** `scripts/board-model.test.ts`'s three ticket-grammar cases and `scripts/board-read.test.ts`'s two admission cases pass; `scripts/canonical-frontmatter.ts` is unchanged and its 286-case foundation-guard suite is green.
- **Committed in:** `3f6b226a` / `354f2089`

**2. [Rule 1 - Bug] The contract stated an `id_prefix` rule nothing enforced**

- **Found during:** Task 1
- **Issue:** Plan 32-04 found that `agent-factory/contracts/board.md` § Identifiers says "Where `factory.config.json` carries `id_prefix`, a ticket identifier's prefix equals that value. Any other bracket content makes the line unparsed" — and the parser never read a dial, so the rule was prose with no implementation. A normative contract making a false statement about its own reader is the defect, not the missing feature.
- **Fix:** `parseBoard` takes a `ParseOptions` with `idPrefix`, and `scripts/board-read.ts` reads the dial FIRST and passes the value in. The module stays pure — the dial's VALUE arrives as a parameter, not as a file read. A row whose prefix disagrees becomes an unparsed line with its line number, which is the contract's own answer; epic and feature identifiers are exempt because they carry their own fixed prefixes. Deliberately NOT an eighth conflict kind: D-10 closes the set at seven and this plan's golden freezes it, so adding one would have been a `schemaVersion` bump for a rule the contract already answered differently. The contract sentence is restated to say exactly what happens, including the no-dial case.
- **Files modified:** `scripts/board-model.ts`, `scripts/board-read.ts`, `agent-factory/contracts/board.md`
- **Verification:** a named case asserts `- [XYZ-001]` is unparsed and `- [ABC-001]` and `- [EPIC-006]` are admitted under `idPrefix: "ABC"`, and that with no dial both ticket rows are admitted. The committed fixture exercises the refusal on a real artifact (`plans/board.md:37`).
- **Committed in:** `3f6b226a` / `354f2089`

**3. [Rule 3 - Blocking] Two derived-set pins moved, in opposite directions**

- **Found during:** Task 1 (full suite) and Task 2 (fixture landing)
- **Issue:** (a) `scripts/check-foundation-guards.test.ts`'s D-64 cutover set is derived as "non-test modules importing `./canonical-frontmatter.js`". `board-read.ts` ENTERED that set in plan 32-03 and LEAVES it here, because deviation 1 removed the import. (b) `scripts/validate.test.ts` derived "validator fixture repository" from the property "carries `agent-factory/config/factory.config.json`". `board-snapshot` carries one — the board projector reads its `wip_limits` and `id_prefix` — so the pin counted 9 where the table named 8, and the intent table would have demanded a validator run against a tree that has no `AGENTS.md`, no roles and no packaging.
- **Fix:** (a) the cutover list is re-derived and `board-read.ts` removed, with the reason recorded inline. (b) the discriminating property is widened to BOTH marks a validator run needs — the config it reads and the `AGENTS.md` it requires — so it discriminates again. A separate derived list, `FIXTURE_CONFIG_DIRS`, keeps the wider carries-a-config set for the retired-key sweep, because that sweep asks a question about every committed config rather than about the ones the validator can be pointed at; narrowing it would have quietly stopped scanning a config. `board-snapshot` is declared in the non-repository half with its reason, and the reason case now asserts the directory genuinely LACKS one of the two marks rather than agreeing with the derivation about itself. Both halves and all three counts stay two-sided.
- **Files modified:** `scripts/check-foundation-guards.test.ts`, `scripts/validate.test.ts`
- **Verification:** `scripts/check-foundation-guards.test.ts` 286 passed; `scripts/validate.test.ts` 91 passed; full suite 72 files / 4623 passed.
- **Committed in:** `3f6b226a` / `84cce3a3`

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** None widened scope. Two are the open questions the plan and its carry-forwards explicitly handed to this layer, each closed with a recorded decision and a contract sentence rather than a paraphrase. The third is the bookkeeping this repository's derived-set discipline demands of every entrant — and, this time, of a departure as well.

## Issues Encountered

- **The plan's `<verify>` for the fixture read used `require` on an ES module and a stale `r.conflicts` shape in one snippet.** The equivalent checks were run through `import()` and against the actual `SnapshotResult`; every assertion the plan asked for was evaluated, and the results are recorded above.
- **`gsd-tools check tdd-red-evidence` expects `node --test` TAP.** Vitest's TAP reporter indents nested leaf tests, so the anchored `^not ok N - <name>` matcher saw only the file-level line and classified a real assertion failure as `fixture_or_load_failure`; it also prints no `# tests` summary. Both RED records therefore carry that reporter's bytes dedented plus the counts the same run reported, with the translation stated in the record's own `note` field. Neither number was invented — 22 of 77 and 5 of 83 are what the runs printed.
- **The first Task 2 commit message lost a backtick-quoted fragment to shell substitution.** Caught by reading the message back and repaired with `git commit --amend -F`; no content was lost from the tree.

## Known Stubs

None. Every function this plan introduced is reached by a named case and by the committed fixture, and every `<verify>` in the plan was run.

Two items are recorded in `agent-factory/contracts/board.md` as **deliberately not performed this phase**, as decisions rather than omissions: the per-ticket traceability cell join (code, tests, UAT, release cells are read as opaque cells), and any projector opinion about a well-formed ticket identifier absent from the traceability matrix — the validator already warns about that one. `D-19` also records that no JSON Schema file ships this phase.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 32-06 (the import-graph guard):** `scripts/board-read.ts` no longer imports `./canonical-frontmatter.js` — its import closure is now `./board-model.js` (which imports nothing) plus `./kit-model.js`, `node:fs` and `node:path`. `scripts/board-model.ts` imports nothing at all, which is what makes the no-`node:fs` criterion structural rather than narrated. Derive the MUTATING symbol set rather than hand-listing permitted names, as D-21 says and as plan 32-03 flagged.
- **Plan 32-07 (the frame):** `conflicts[]` arrives sorted, so the renderer groups by `kind` without re-sorting; re-sorting would be a second order free to disagree with the golden. `wip-count`'s `expected` and `actual` carry `claimed N, limit M` and `counted K`, which is the `claimed 2 / counted 3 / limit 3` line D-09 asks for. `TicketRecord` now carries `column` and `status`.
- **Plan 32-08 (the validator cutover):** `parseTicketDocument` is the ticket-document authority `scripts/validate-agent-factory.ts:712-719`'s regex pair should be deleted in favour of, and `kebab(column) === status` already runs through the single `kebab` spelling. `checkTickets()`'s two messages are unchanged and must stay so.
- **Full suite green on this tree:** 72 files, 4623 passed, 2 skipped (pre-existing). `npm run typecheck`, `npm run build`, `npm run check:build-parity` and `npm run freshness` all green; freshness compares 65 committed `.js` files against a rebuild with zero drift. All four doc gates pass and name nothing under the new fixture, and the validator run names nothing under it either.
- **One concern carried forward for the fourth consecutive plan.** Two derived-set pins moved again. Every later plan that adds a tracked `.ts` file, a test module, a fixture directory or a new importer of a watched module will move one. Run the full suite before the final commit, not only the plan's own test file.

## Self-Check: PASSED

All twelve named artifacts exist on disk (`scripts/board-model.{ts,js,test.ts}`, `scripts/board-read.{ts,js,test.ts}`, `scripts/validate.test.ts`, `scripts/check-foundation-guards.test.ts`, `agent-factory/contracts/board.md`, `scripts/fixtures/board-snapshot/{expected-snapshot.json,README.md,plans/board.md}`) and all six commit hashes above resolve in `git log`.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*
