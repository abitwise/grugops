---
phase: 32-board-projector-cli-dashboard
plan: 16
subsystem: infra
tags: [typescript, board-projector, grammar, encoding, byte-order-mark, documented-non-grammar]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-12's routing of `checkTickets` through `parseTicketDocument`, which turned a refusal into a hard validator error"
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-15's total tickets partition and its `REFUSAL_SPELLINGS` table, which this plan updates in place"
provides:
  - "`normalizeDocument` — the ONE authority that strips a single leading byte-order mark and folds Windows line endings, called by both grammars"
  - "A recorded byte-order-mark answer for every document class the reader consumes, derived from `SOURCE_NAMES` rather than hand-listed"
  - "A tab refused as `unrecognized-line` at all four positions, with a reason that is true of a tab"
  - "`TICKET_CONTROL` exported and pinned by two independent derivations over code points 0-31 plus 127"
  - "The builder specification's delimiter-less ticket template named as documented non-grammar in both documents, with a pairing case"
affects: [board projector, dashboard renderer, structure validator, any agent writing a ticket from the builder specification]

actuals:
  tokens: 164775
  tasks: 3
  commits: 5
plan_head_before: f2e84ecca94e8beb87c2f9a7c1a1857acd683663

tech-stack:
  added: []
  patterns:
    - "One authority per predicate, pinned mechanically: the module's own source is read and the non-comment occurrences of the rule are counted, so a second spelling is a red rather than a silent divergence"
    - "Two derivations, compared: a character class's membership and the rule that actually fires are derived separately over the same alphabet and asserted to agree"
    - "Probe the sibling positions of the rule you narrowed: narrowing one predicate widened the next one along, in two positions the plan did not name"
    - "Disposition table over a DERIVED set: one row per document class, the coverage taken from `SOURCE_NAMES` minus the grammar-owned sources, every row carrying an observed answer"

key-files:
  created: []
  modified:
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/board-model.test.ts
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-read.test.ts
    - agent-factory/contracts/board.md
    - docs/initial/agent_factory_builder_spec_v2.md

key-decisions:
  - "A SECOND byte-order mark is content, not an artefact: the grammar refuses it through the rules that already exist rather than looping until the document starts with something it likes"
  - "`ignoreBOM: true` at the read seam is unchanged, and now says why in both directions — the seam keeps the bytes so its own byte-count agreement test stays honest, and the grammar decides what the first line is"
  - "The tab leaves `TICKET_CONTROL` AND the key pattern's value capture excludes it in the same edit: narrowing the class alone would have ADMITTED two shapes the grammar refused the day before"
  - "The builder specification is not rewritten — one additive pointer line beside the fence, because `docs/initial/` is the historical input and `scripts/board-corpus.ts` replays eight live rows out of it"
  - "`TICKET_CONTROL` is exported so its membership can be derived in a case rather than transcribed beside one"

patterns-established:
  - "Pin the single spelling of a normalization by reading the module as text, filtering comment lines, and asserting the count is exactly one inside the named function"
  - "After narrowing a predicate, probe every position its neighbour consumes — the widening shows up one rule over, not where the edit landed"
  - "A documented-non-grammar disagreement is recorded in BOTH documents and paired by a case that reads both, each asserted non-empty first"

requirements-completed: [DASH-01, DASH-02]

coverage:
  - id: D1
    description: "One normalization authority: `normalizeDocument` strips a single leading byte-order mark and folds Windows line endings, is called by both `parseBoard` and `parseTicketDocument`, and neither carries a fold of its own."
    requirement: "DASH-01"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#admits a mark-led ticket document, with the SAME values as the same document without it"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#returns the column of a board whose first line is a heading led by a mark"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#carries EXACTLY ONE non-comment line-ending fold, and it is inside `normalizeDocument`"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#strips at MOST one mark: a document led by two is answered by the rules that already exist"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every non-grammar document class the reader consumes has a recorded byte-order-mark answer: the claim record, the context index, the traceability matrix and the dial, with the table's coverage derived from `SOURCE_NAMES`."
    requirement: "DASH-01"
    verification:
      - kind: integration
        ref: "scripts/board-read.test.ts#PREMISE: the table names EXACTLY the sources the two grammars do not own"
        status: pass
      - kind: integration
        ref: "scripts/board-read.test.ts#queue: a mark-led record carrying TWO `at:` lines is still reported `tampered`"
        status: pass
      - kind: integration
        ref: "scripts/board-read.test.ts#context: counts the note on a mark-led index line instead of reporting it as malformed"
        status: pass
      - kind: integration
        ref: "scripts/board-read.test.ts#config: reads a mark-led dial instead of falling back to the lean view"
        status: pass
      - kind: integration
        ref: "scripts/board-read.test.ts#traceability: reads a mark-led header row — immune by construction, and pinned"
        status: pass
    human_judgment: false
  - id: D3
    description: "A tab inside a ticket frontmatter region is refused as `unrecognized-line` at all four positions with the line quoted, the comment names the rule that fires, and the control class is pinned by two independent derivations."
    requirement: "DASH-02"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#REFUSES a tab after the colon as an unrecognized line, quoting the line"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#REFUSES a tab INSIDE a value, and a tab TRAILING one — the two positions the key pattern nearly admitted"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#derives the class MEMBERSHIP over every probed code point, rather than transcribing it"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#derives which RULE FIRES for each probed code point, and it agrees with the membership"
        status: pass
      - kind: integration
        ref: "VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js"
        status: pass
    human_judgment: false
  - id: D4
    description: "The builder specification's delimiter-less ticket template is named as documented non-grammar in `agent-factory/contracts/board.md` § Ticket documents, the specification carries one additive pointer back, and a case keeps the two paired."
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#the contract's § Ticket documents names the specification, the refusal code, and the fix"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#the specification's pointer names the contract, beside the template it is about"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#a document in the specification's template shape is REFUSED, which is why the pairing exists"
        status: pass
    human_judgment: true
    rationale: "The mechanical half is proven — both documents name each other, and the grammar confirms the shape is refused and the corrective shape admitted. What no test asserts is whether the new paragraph sits in the SAME REGISTER as the `## Blocked (2)` paragraph it copies, which is the plan's stated standard and a prose judgment a human makes by reading both."

duration: 34 min
completed: 2026-09-15
status: complete
---

# Phase 32 Plan 16: Refusal Correctness — One Normalization, a True Tab Reason, and a Named Disagreement Summary

**A byte-order mark is now answered once for every document class the projector reads, a tab is refused by the rule the code's own comment always claimed refused it, and the two kit documents that disagree about the ticket shape say so in each other's words.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-09-15T08:12:00Z
- **Completed:** 2026-09-15T08:46:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- `normalizeDocument` is the ONE place a leading byte-order mark is stripped and Windows line endings are folded. Both grammars call it; neither carries a fold of its own; a case reads the module as text, filters comment lines, and asserts exactly one non-comment fold remains, inside that function.
- All six document classes the projector reads now have a recorded answer to the mark. Three were closed at their own parse points (the claim record, the context index, the dial); one was already immune by construction (`plans/traceability.md`, because `String.prototype.trim` treats U+FEFF as whitespace) and is now pinned so a later edit that drops the trim is a red.
- **A security defect nobody had reported was closed on the way.** A mark ahead of a first-line `at:` made `AT_KEY_LINE` count ONE over a claim record carrying two, so the single-`at:` tamper discipline passed and `AT_VALUE` then matched the SECOND. Three bytes turned the T-32-05 forged-claim detector off. It is now driven by a case.
- A tab is refused as `unrecognized-line` with the line quoted, at all four positions, and the comment beside `TICKET_CONTROL` names the rule that fires and gives the true reason (renderer-dependent width in an indentation-significant region), not the two false clauses it carried.
- `TICKET_CONTROL` is exported and pinned by two independent derivations over code points 0–31 plus 127 — the pattern's membership, and the rule that actually fires — asserted to agree with each other.
- The builder specification's delimiter-less ticket template is named as documented non-grammar in the contract, in the register the `## Blocked (2)` paragraph established, with one additive pointer line in the specification and a pairing case that reads both files.

## Task Commits

1. **Task 1 RED: the mark defect, measured** — `57439b8a` (test)
2. **Task 1 GREEN: one normalization authority** — `e9dd029e` (feat)
3. **Task 2 RED: the untrue tab reason, measured** — `ca4e0735` (test)
4. **Task 2 GREEN: the tab reaches the key pattern** — `2b348982` (fix)
5. **Task 3: the disagreement named in both documents** — `0b535076` (docs)

## Files Created/Modified

- `scripts/board-model.ts` — `normalizeDocument` added and exported; both grammars call it; `TICKET_CONTROL` narrowed, documented and exported; `TICKET_KEY_LINE`'s value capture excludes the tab
- `scripts/board-model.js` — rebuilt committed twin
- `scripts/board-model.test.ts` — three new blocks: the normalization authority (6 cases), the derived control class (6 cases), the documentation pairing (3 cases)
- `scripts/board-read.ts` — `normalizeDocument` applied at the claim-record, context-index and dial parse points; the `ignoreBOM` docblock now points forward to the grammar's answer
- `scripts/board-read.js` — rebuilt committed twin
- `scripts/board-read.test.ts` — the byte-order-mark disposition table (6 cases); `REFUSAL_SPELLINGS` updated (REF-003's code, REF-004's spelling, a new REF-008), pin 7 → 8
- `agent-factory/contracts/board.md` — the two refusal codes told apart, the normalization stated, the delimiter-less-template paragraph added
- `docs/initial/agent_factory_builder_spec_v2.md` — one additive pointer line beside the § 6.1 ticket template (`git diff --numstat` read `1 0`)

## Measured before/after

| Probe | Before | After |
|---|---|---|
| ticket led by U+FEFF | REFUSED `no-opening-delimiter`, quoting a line that renders as `---` | ADMITTED, same values as the unmarked document |
| board heading led by U+FEFF | the column VANISHES into `preamble`; rows below become unparsed with a null column | the column and its rows are returned |
| claim record led by U+FEFF | the claim vanishes from the screen | joined normally |
| claim record led by U+FEFF with TWO `at:` lines | TRUSTED, and the forged second `at:` is read as the value | reported `tampered`, skipped on both lines |
| `index.jsonl` line led by U+FEFF | reported as a malformed index line, naming valid JSON | counted as the note it is |
| dial led by U+FEFF | source badges `unreadable`, kit drops to the lean view | read, `id_prefix` honoured |
| `plans/traceability.md` led by U+FEFF | already read correctly (trim) | unchanged, now pinned |
| `status:<TAB>value` | REFUSED `control-character`, reason untrue of a tab | REFUSED `unrecognized-line`, line quoted |
| value line indented by a TAB | REFUSED `control-character` | REFUSED `unrecognized-line`, line quoted |
| `title: a<TAB>b` | REFUSED `control-character` | REFUSED `unrecognized-line` (see deviation 1) |
| `title: ab<TAB>` | REFUSED `control-character` | REFUSED `unrecognized-line` (see deviation 1) |
| NUL / ESC / DEL in the region | REFUSED `control-character` | unchanged |

## Decisions Made

- **A second byte-order mark is content.** `normalizeDocument` strips at most one. A document whose second character is another mark is not a Windows save, and it is refused through the rules that already exist rather than by looping. The 32-15 refusal table's `REF-004` row moved from one mark to two so the boundary of the normalization is what is pinned.
- **`ignoreBOM: true` stays.** The seam preserves the bytes so its own byte-count agreement test stays honest; the grammar decides what a document's first line is. Both docblocks now say so, pointing at each other. `scripts/validate-agent-factory.ts` reads a ticket's bytes itself and calls the grammar directly, which is the second reason the normalization cannot live at the seam.
- **The tab left the control class AND the value capture in one edit** (see deviation 1).
- **The builder specification is not rewritten.** One additive pointer line; no `- [ID]` row touched; the corpus's eight live rows from that file and its 141-row total are unmoved and were re-measured after the edit.
- **`TICKET_CONTROL` is exported.** The module already exports its grammar constants so a consumer can iterate them; exporting this one is what lets a case derive its membership instead of transcribing it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Narrowing `TICKET_CONTROL` alone would have WIDENED the grammar in two positions the plan did not name**

- **Found during:** Task 2, by probing the sibling positions of the rule that was narrowed
- **Issue:** The plan states that with the tab out of the control class it "reaches `TICKET_KEY_LINE`, which does not admit it in either position". That is true of the two positions the review measured — after the colon, and indenting the line — and false of two others. The value capture was `(.*)`, so `title: a<TAB>b` came back **ADMITTED** with the tab carried into the model and onto the board, and `title: ab<TAB>` came back admitted with the tab silently trimmed off. Both were refused the day before, so the fix as written would have traded an untrue refusal reason for a grammar that admits more.
- **Fix:** The value capture excludes the tab (`([^\t]*)`), which is the exact complement of what the control class stopped covering. All four positions are now refused `unrecognized-line` with the line quoted. The change is documented at the pattern, and a case covers both newly-probed positions.
- **Files modified:** `scripts/board-model.ts`, `scripts/board-model.test.ts`
- **Verification:** the four-position probe, plus the two-derivation agreement case over code points 0–31 and 127
- **Committed in:** `2b348982`

**2. [Rule 2 - Missing Critical] The claim record's byte-order-mark row is a forged-claim bypass, not only a display defect**

- **Found during:** Task 1, driving the disposition table
- **Issue:** The plan's Task 1 asks for an observed answer per document class. The observed answer for the claim record turned out to be a security one: `AT_KEY_LINE` is anchored at a line start, so a mark ahead of a first-line `at:` made the count read ONE over a record carrying two. The single-`at:` discipline — the on-disk signature of a `by`-injection that smuggled a forged `at:` (T-32-05) — passed, and `AT_VALUE` then matched the SECOND line. A tampered record was reported as running work with the forged timestamp.
- **Fix:** the claim text is normalized once, before any line-anchored pattern touches it, and the reason is written above it. A dedicated case drives the two-`at:` record with a mark and asserts `tampered`.
- **Files modified:** `scripts/board-read.ts`, `scripts/board-read.test.ts`
- **Verification:** `scripts/board-read.test.ts#queue: a mark-led record carrying TWO `at:` lines is still reported `tampered`` — RED before the fix (the record was trusted), green after
- **Committed in:** `e9dd029e`

**3. [Rule 3 - Blocking] Plan 32-15's `REFUSAL_SPELLINGS` table asserted two dispositions this plan invalidates**

- **Found during:** Tasks 1 and 2
- **Issue:** The table pins seven refusal spellings two-sided and derives its code coverage from `TICKET_REFUSAL_CODES`. `REF-004` (a single mark) is now ADMITTED, and `REF-003` (a tab) now reports a different code — and with the tab gone, `control-character` would have been reached by no planted document at all, which is the shape a narrowing that emptied the class would also produce.
- **Fix:** `REF-004` became a DOUBLE mark (still `no-opening-delimiter`, and it pins the boundary of the new normalization); `REF-003` kept its spelling and took the new code; a new `REF-008` plants a null byte so `control-character` is still reached by a document. The pin moved 7 → 8 deliberately, with the reason written beside it, and the derived code-coverage assertion is unchanged and still passes.
- **Files modified:** `scripts/board-read.test.ts`
- **Verification:** `scripts/board-read.test.ts#pins the refusal table two-sided and reaches EVERY refusal code the grammar declares`
- **Committed in:** `e9dd029e` (REF-004), `2b348982` (REF-003 and REF-008)

---

**Total deviations:** 3 auto-fixed (1 bug, 1 missing critical, 1 blocking)
**Impact on plan:** No scope creep. Deviation 1 prevents the plan's own fix from widening the grammar; deviation 2 is the observed answer the plan asked for, which happened to be a live bypass; deviation 3 is the sibling table the plan's changes invalidate by construction.

## Issues Encountered

- The plan's Task 2 `<verify>` line reads `node scripts/validate-agent-factory.js`. That command exits 1 on any tree — the validator refuses to default its kit root (`VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`), independently of this plan's changes. The correct invocation, as `docs/audit/30-redteam-surface-b.md` records it, is `VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js`; run that way it reports `ALL CHECKS PASSED` at exit 0, naming no ticket refusal for any document under `plans/tickets/`.

## Verification Run

| Check | Result |
|---|---|
| `scripts/board-model.test.ts` + `scripts/board-read.test.ts` | 245 passed (222 before this plan, +23 cases) |
| `scripts/board-oracle.test.ts` + `scripts/board-corpus.test.ts` | 48 passed; the per-source premise still reads 8 live rows from the builder specification and **141** in total |
| `scripts/validate.test.ts` | green; the three `bad-ticket-*` fixtures still produce their recorded codes |
| `VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED`, exit 0 |
| `npm run build` / `npm run typecheck` | exit 0 |
| `npm run check:build-parity` | "no tracked build output moved when tsc ran" |
| `npm run freshness` | 65 committed `.js` all match a rebuild |
| `npm run freshness:context` | vacuous pass (no `.grugops/context/` tree) |
| `check:public-docs`, `check:imperative-lexicon`, `check:banned-claims`, `check:claim-anchors`, `check:nul-bytes` | all `ALL CHECKS PASSED` |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **74 files, 4860 passed, 2 skipped** |

The live claude-CLI e2e lane was NOT run (it spends tokens and can hang); it is excluded by the project's own test command.

## Known Stubs

None.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema was introduced; the plan's threat register entries T-32-16-01 through T-32-16-04 are each mitigated by the tasks that name them, and `package.json` is byte-unchanged (T-32-16-SC).

## Requirements

`DASH-01` and `DASH-02` are recorded in this SUMMARY's `requirements-completed` because the plan declares them, and they were **deliberately NOT flipped to Complete** in `REQUIREMENTS.md` — the plan's own success criteria forbid it, and plans `32-21` and `32-23` still declare `DASH-01` with no SUMMARY on disk. `requirements.mark-complete` was not run.

## Next Phase Readiness

- The three refusal-correctness findings from `32-REVIEW.md` (WR-03, WR-04, WR-11) are closed with reproductions on both sides.
- Two residuals a later round may want: the refusal message for a document led by two marks still quotes a line that renders as `---` (accepted — a second mark is content, and the quoting behaviour is unchanged for every other refusal); and IN-02's two silent queue skips (`claim.md` absent, `at:` absent) are untouched by this plan, which only removed a THIRD way for a record to vanish silently.
- Seven plans in this phase remain without a SUMMARY.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-15*

## Self-Check: PASSED

- All six commits resolve in `git log --oneline --all`: `57439b8a`, `e9dd029e`, `ca4e0735`, `2b348982`, `0b535076`, `6259ac12`.
- Every file named in `key-files.modified` exists on disk.
- `commits: 5` is MEASURED — `git rev-list --count f2e84ecc..HEAD` at SUMMARY write, before this metadata commit.
