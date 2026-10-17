---
phase: 29-controlled-language-voice-guard-rebuild
plan: 28
subsystem: tooling
tags: [typescript, fence-parser, section-locator, claim-registry, safety-surface, gap-closure]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "frontmatter.ts's ONE-SECTION-LOCATOR block (sectionEndIndex / unfencedHeadingIndex, plan 29-20, D-24) and FENCE_DELIMITER_LINE / fencedLineFlags — the one fence toggle and its delimiter class"
provides:
  - "unfencedMatchIndices — the ONE authority's answer to `which unfenced lines match this caller-supplied line predicate`, so a consumer never scans raw lines for a bounding heading"
  - "readRegistry's block START and END both come from that one call; audit-model.ts tests no heading pattern at a bounding position"
  - "parseClaimBlock decides `is this line a fence delimiter` through FENCE_DELIMITER_LINE; the private equality is deleted, not corrected"
  - "a NAMED refusal on an unterminated fence (odd delimiter count) in the registry, naming the last delimiter's line and stating the consequence"
  - "a NAMED refusal on a verbatim that swallowed a claim heading — the even-count shape document-level parity cannot see"
  - "Registry publishes its own denominator: headingShapedLines and headingShapedFenced, derived by two separate expressions, carried to check-claim-anchors' PASS line"
affects: [29-29, 29-30, 29-31, 29-32, audit-register, claim-anchors, safety-surface, LANG-02]

actuals:
  tokens: 79000
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A shared authority takes a CALLER-SUPPLIED predicate and owns only the fence verdict — domain vocabulary stays in the consumer, so unification does not drag registry ids into the parser"
    - "A parser that is a PROJECTION publishes its own denominator, derived by two separate expressions over the same text, never one expression minus its own output"
    - "A document-level PARITY check cannot see two errors that cancel; pair it with a point-of-effect check on the artifact the parity was protecting"
    - "A shared authority refuses a `g`/`y` flagged RegExp by name rather than resetting lastIndex — repairing the caller's object hides the mistake at its next use"

key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.test.ts
    - scripts/audit-model.ts
    - scripts/audit-model.test.ts
    - scripts/check-claim-anchors.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "CLAIM_HEADING_RE stays declared in audit-model.ts — it captures a claim id validated against C-28-NNN ten lines later, so it is DOMAIN vocabulary; what moved is its USE, into the authority"
  - "unfencedMatchIndices is a THIRD function beside the two locators, not a widening of either: three predicates, one fence toggle beneath all three"
  - "The live verbatim pin is an equality against a SECOND extraction rather than a frozen digest — a digest would red the day a claim is legitimately added, making it a false-red generator"
  - "The unterminated-fence condition is decided from the delimiter class's own arithmetic (odd count) rather than a second state machine"
  - "The swallow refusal was added beyond the plan because Task 3's own done-criterion forbids the shape this plan's adversarial pass found — a regression Task 1 introduced"
  - "check-audit-register never reads the registry, so it gained no output: recorded UNKNOWN - verify rather than bolting a tally onto a gate this plan does not own"

patterns-established:
  - "When you unify a consumer onto a shared authority, ask which EXISTING assertions were telling things apart by the old divergence — and re-run the adversarial battery against your OWN fix, because a parity invariant can be cancelled by a second instance of the same error."
  - "A harness that runs a gate with CHECK_ROOT unset measures the MIRROR, not the mutated tree. Assert the harness's own premise before believing an `exit=0`."

requirements-completed: [LANG-03, LANG-07]

coverage:
  - id: D1
    description: "A claim block written inside a fenced example produces no row, and adds no file to safetySurfaceUnion — asserted at the parser AND at the point of effect, both sides"
    requirement: LANG-03
    verification:
      - kind: unit
        ref: "scripts/audit-model.test.ts#a claim block written INSIDE a fenced example produces NO row — documentation is not live data"
        status: pass
      - kind: unit
        ref: "scripts/audit-model.test.ts#the SAME block OUTSIDE a fence DOES produce a row — the other side of fence-awareness"
        status: pass
      - kind: integration
        ref: "scripts/audit-model.test.ts#the fenced phantom adds NOTHING to safetySurfaceUnion — asserted where the consequence lands"
        status: pass
      - kind: integration
        ref: "scripts/audit-model.test.ts#an UNFENCED `kind: safety` claim DOES reach safetySurfaceUnion — the union's other side"
        status: pass
    human_judgment: false
  - id: D2
    description: "unfencedMatchIndices is a projection of the one toggle: ascending, fence-excluding in both directions, empty-safe, complete against an independently derived set, and refusing a g/y regex"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/frontmatter.test.ts#answers in ASCENDING order and never returns a line the fence toggle flags"
        status: pass
      - kind: unit
        ref: "scripts/frontmatter.test.ts#the SAME lines outside a fence ARE returned — the other side of fence-exclusion"
        status: pass
      - kind: unit
        ref: "scripts/frontmatter.test.ts#returns EVERY unflagged matching line, against a set derived without running it"
        status: pass
      - kind: unit
        ref: "scripts/frontmatter.test.ts#THE COMPLETENESS PIN IS PROVEN ABLE TO FAIL: a first-match-only locator reds, naming the missed indices"
        status: pass
      - kind: unit
        ref: "scripts/frontmatter.test.ts#refuses a `g`/`y` flagged RegExp BY NAME rather than returning a silently short answer"
        status: pass
    human_judgment: false
  - id: D3
    description: "audit-model.ts answers the fence-delimiter question exactly once, through the shared class; both disagreement axes pinned in both directions and the two answers proven to converge"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/audit-model.test.ts#AXIS 1 — a delimiter carrying an INFO STRING opens the block, as it does for every other consumer"
        status: pass
      - kind: unit
        ref: "scripts/audit-model.test.ts#AXIS 2 — a THREE-SPACE-INDENTED delimiter is not a delimiter here either, matching the rest of the tree"
        status: pass
      - kind: unit
        ref: "scripts/audit-model.test.ts#the two answers AGREE on every axis, derived rather than tabulated by hand"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the parser's non-test consumer list is NON-EMPTY and unchanged in size — a DEMOTION, never a deletion"
        status: pass
    human_judgment: false
  - id: D4
    description: "An unterminated fence in the registry is a named refusal rather than a silently shorter claim list; asserted in both directions and the hazard reproduced pre/post"
    requirement: LANG-03
    verification:
      - kind: unit
        ref: "scripts/audit-model.test.ts#an ODD delimiter count is a NAMED refusal, and it names the last delimiter's line number"
        status: pass
      - kind: unit
        ref: "scripts/audit-model.test.ts#an EVEN delimiter count parses normally — the direction a one-sided assertion would miss"
        status: pass
      - kind: unit
        ref: "scripts/audit-model.test.ts#the refusal fires INSTEAD of a short parse — the same bytes, both outcomes named"
        status: pass
      - kind: other
        ref: "the pre/post hermetic-mirror reproduction below — claims 42 -> 20, union 41 -> 39, three gates exit 0 under the pre-task-3 build; all three exit 1 after"
        status: pass
    human_judgment: false
  - id: D5
    description: "The parse publishes its own denominator, derived by two separate expressions, pinned two-sided over the live registry with a planted-member probe seen moving it"
    requirement: LANG-03
    verification:
      - kind: unit
        ref: "scripts/audit-model.test.ts#the LIVE registry's excluded-heading tally is pinned against a count derived here"
        status: pass
      - kind: unit
        ref: "scripts/audit-model.test.ts#THE TALLY PIN IS PROVEN ABLE TO FAIL: a planted fenced claim heading moves it, and the plant is named"
        status: pass
      - kind: integration
        ref: "node scripts/check-claim-anchors.js — the PASS line now carries `42 registry row(s) parsed from 42 claim-heading-shaped line(s), 0 of them EXCLUDED as fenced documentation`"
        status: pass
    human_judgment: false
  - id: D6
    description: "The even-count swallow shape the parity check cannot see — a regression Task 1 introduced — is a named refusal, two-sided, with live reachability measured at zero"
    requirement: LANG-03
    verification:
      - kind: unit
        ref: "scripts/audit-model.test.ts#two blocks each carrying ONE unclosed delimiter sum to an EVEN count and are refused anyway"
        status: pass
      - kind: unit
        ref: "scripts/audit-model.test.ts#a well-formed pair of blocks with the same ids parses — the refusal is about the SWALLOW"
        status: pass
      - kind: unit
        ref: "scripts/audit-model.test.ts#the LIVE registry reaches this refusal ZERO times — it refuses nothing that exists today"
        status: pass
    human_judgment: false
  - id: D7
    description: "The two fence-GRAMMAR residuals this plan deliberately does not repair (V-29-26-03 prefix test, V-29-26-04 column-zero anchor), re-measured live and recorded at the site"
    requirement: LANG-07
    verification:
      - kind: other
        ref: "the re-measurement command and its output below — 0 four-plus-backtick delimiters, 4 indented delimiters (README.md:31,33,40,42) across the 40-document derived corpus"
        status: pass
    human_judgment: true
    rationale: "Whether to carry these tree-wide fence-grammar floors forward is a human judgment; the plan explicitly forbids repairing them here, because a plan that repairs what it measures has graded its own paper."

duration: 51min
completed: 2026-08-16
status: complete
---

# Phase 29 Plan 28: One authority for the registry's block boundaries, one fence recogniser, and a refusal for every way the fix could shorten the list

**`readRegistry` was the sixth and last fence-blind section locator in the tree, and a claim block written inside a fenced example was reaching the D-18 exclusion list as a live `kind: safety` row — documentation read as live data, in the phase whose founding rule is that it must not be. The scan now happens inside the one authority, the module's second fence recogniser is deleted, and both fail-opens the fix opened are named refusals.**

## Performance

- **Duration:** 51 min
- **Started:** 2026-08-16T01:12:00Z
- **Completed:** 2026-08-16T02:03:00Z
- **Tasks:** 3 (plus one unplanned closure found by the mandated adversarial pass)
- **Files modified:** 6 (+ their committed `.js`)

## Accomplishments

- **CR-02 closed structurally, and proven at its POINT OF EFFECT.** `PHANTOM.md` was in `safetySurfaceUnion` before and is not after — measured on hermetic mirrors, not asserted.
- **WR-02 closed by deletion.** The private `trim() === ` equality is gone; the reproduction table shows the two answers *converging* rather than merely changing, with `fencedLineFlags`' verdict printed beside each row.
- **The hazard the fix opened is closed in the same plan.** An unterminated fence took the live registry from 42 claims to 20 and the exclusion list from 41 files to 39 **while three gates printed green**. It is now a named refusal.
- **A second fail-open, found by attacking my own fix, is also closed.** Document-level delimiter parity cannot see two errors that cancel; a `kind: safety` claim was silently dropped with an even delimiter count. That shape is now refused at the point of effect.
- **The parse publishes its own denominator.** `check-claim-anchors`' PASS line went from `42 registry row(s)` to `42 registry row(s) parsed from 42 claim-heading-shaped line(s), 0 of them EXCLUDED as fenced documentation`.

## Task Commits

1. **Task 1 (TDD): the registry's block boundaries come from the ONE authority** — `3a16647` (fix)
2. **Task 2 (TDD): one fence recogniser in the module that carried two** — `f3f85ee` (fix)
3. **Task 3 (TDD): an unterminated fence cannot silently shorten the claim list** — `ec47fda` (fix)
4. **Adversarial-pass closure: the swallow shape parity cannot see** — `a6e7a82` (fix)

## Files Created/Modified

- `scripts/frontmatter.ts` — `unfencedMatchIndices`, declared inside the existing ONE-SECTION-LOCATOR block with the three-predicates-one-toggle distinction and a named refusal for `g`/`y` regexes
- `scripts/frontmatter.test.ts` — 7 new cases including the completeness pin and its falsifiability probe
- `scripts/audit-model.ts` — `readRegistry` rewired; two new named refusals; `Registry` gains its parse tally; `parseClaimBlock`'s private delimiter equality deleted
- `scripts/audit-model.test.ts` — 20 new permanent cases across four describe blocks
- `scripts/check-claim-anchors.ts` — the denominator carried to the PASS line
- `scripts/check-foundation-guards.test.ts` — the `audit-model.ts` import pin moved 3 → 5; `LOCATOR_FUNCTIONS` gains the new export

---

## Task 1 — the RED-first transcript

Written before the fix and run against the committed (pre-fix) build. Verbatim:

```
$ npx vitest run scripts/audit-model.test.ts

 ❯ scripts/audit-model.test.ts (65 tests | 3 failed) 90ms
     × a claim block written INSIDE a fenced example produces NO row — documentation is not live data
     × a fenced example BETWEEN two real blocks donates NO metadata to the block above it
     × the fenced phantom adds NOTHING to safetySurfaceUnion — asserted where the consequence lands

AssertionError: expected [ 'C-28-001', 'C-28-999' ] to deeply equal [ 'C-28-001' ]
  [
    "C-28-001",
+   "C-28-999",
  ]

AssertionError: expected [ 'PHANTOM.md' ] to not include 'PHANTOM.md'

 Test Files  1 failed (1)
      Tests  3 failed | 62 passed (65)
```

**Honest note on the frontmatter unit cases.** `unfencedMatchIndices` did not exist before this plan, so its seven cases could only red as an unresolved import rather than as a wrong answer. That is a weaker RED and it is recorded as such. The *meaningful* REDs for Task 1 are the three above, which are assertion failures against real shipped behaviour.

## Task 1 — ADVERSARIAL SELF-REPRODUCTION: the parser

Hermetic mirrors (`git archive HEAD | tar -x`), never the live tree. The fixture is `29-REVIEW.md § CR-02`'s, rebuilt with the illustration's outer fence **closed** so the document carries an even delimiter count — the reviewer's transcription left it open, which this plan's own unterminated-fence refusal would refuse for a *different* reason, and a fixture that fails for the wrong reason proves nothing about the right one. The shape is preserved exactly: a `### C-28-999` heading plus a full metadata block, inside a fenced example, with their own delimiter pair inside it.

```
=== PRE-FIX BUILD (mirror of HEAD = 0ec8b61) ===
readRegistry -> [{"id":"C-28-001","file":"README.md","kind":"architecture"},{"id":"C-28-999","file":"PHANTOM.md","kind":"safety"}]
=== POST-FIX BUILD (mirror of the working tree) ===
readRegistry -> [{"id":"C-28-001","file":"README.md","kind":"architecture"}]
```

The pre-fix line is byte-for-byte the array the review reported.

## Task 1 — the same reproduction AT ITS POINT OF EFFECT

A parser-only assertion would leave the exclusion list — the thing LANG-02 actually consults — untested.

```
=== PRE-FIX: the D-18 exclusion list ===
safetySurfaceUnion -> ["PHANTOM.md"]
=== POST-FIX: the D-18 exclusion list ===
safetySurfaceUnion -> []
```

A file became untouchable by the controlled-language pass on the strength of a code sample. It does not any more.

## Task 1 — the live registry is unmoved

```
$ node -e "import('$SP/pre/scripts/audit-model.js').then(m=>console.log('PRE :', m.readRegistry('$R').claims.length))"
PRE : 42
$ node -e "import('$SP/post/scripts/audit-model.js').then(m=>console.log('POST:', m.readRegistry('$R').claims.length))"
POST: 42
```

Derived in this session against both builds on the same bytes, not transcribed from the plan. The fix closes a route; it moves no number on correct bytes.

## Task 1 — the completeness pin, SEEN FAILING

The rule is written once, so the probe runs *the rule* over a broken locator rather than a second spelling of it.

```
SHIPPED  -> null
BROKEN   -> expected indices [1, 11, 16] but got [1] — missing [11, 16], unexpected []
```

The failure names the missed indices. The broken direction is deliberately the *shortening* one — the fail-open direction for every consumer.

## Task 1 — acceptance greps

```
$ grep -a -v '^\s*[/*]' scripts/audit-model.ts | grep -acE 'headingIdx\.push|CLAIM_HEADING_RE\.test'
0
$ grep -a -c 'unfencedMatchIndices' scripts/audit-model.ts
3
$ grep -a -c 'export function unfencedMatchIndices' scripts/frontmatter.ts
1
```

Zero heading patterns tested at a bounding position, comments filtered.

---

## Task 2 — the RED-first transcript

```
$ npx vitest run scripts/audit-model.test.ts
     × AXIS 1 — a delimiter carrying an INFO STRING opens the block, as it does for every other consumer
     × AXIS 2 — a THREE-SPACE-INDENTED delimiter is not a delimiter here either, matching the rest of the tree
     × the two answers AGREE on every axis, derived rather than tabulated by hand

Error: audit-model: refusing to parse docs/audit/28-claim-registry.md — claim C-28-001's fenced
       block opened at line 15 and was never closed
AssertionError: expected [Function] to throw an error
AssertionError: delimiter spelling "```text": expected false to be true

 Tests  3 failed | 68 passed (71)
```

**A correction to the review, recorded rather than smoothed over.** The review predicted the info-string case would be refused *"carries no fenced block"*. Measured, the pre-fix build refused **"opened at line 15 and was never closed"** — because the private equality did not recognise the *opening* ```` ```text ```` but did recognise the plain closing delimiter, so the close was mistaken for the open. Same defect class, different message; the message here is the measured one.

## Task 2 — ADVERSARIAL SELF-REPRODUCTION: both axes, four outcomes

`fencedLineFlags`' answer is printed beside each row, so the table shows the two answers **converging** rather than merely changing.

```
AXIS / BUILD                       | the shared class's answer        | parseClaimBlock's outcome
-----------------------------------|---------------------------------|--------------------------
info-string   PRE  (HEAD)          | fencedLineFlags: delimiter true  | REFUSED (opened at line 15 and never closed…)
info-string   POST (fixed)         | fencedLineFlags: delimiter true  | PARSES  ("A claim sentence.")
indented-3sp  PRE  (HEAD)          | fencedLineFlags: delimiter false | PARSES  ("A claim sentence.")
indented-3sp  POST (fixed)         | fencedLineFlags: delimiter false | REFUSED (carries no fenced block…)
```

Pre-fix, the parser disagrees with the shared class on **both** rows. Post-fix it agrees on both. That is the property, and it is asserted rather than tabulated: the permanent case reconstructs the deleted equality as the only place it still exists, sweeps nine delimiter spellings against the shared class, asserts the disagreement set is **non-empty** and contains both recorded axes, and then requires the shipped parser's *parse outcome* to follow the shared class on every one.

## Task 2 — zero delta on the live registry, PROVEN

```
PRE  (HEAD, private equality)  claims=42  verbatim-digest=7cbd7480cab654822383ef2de592c101
POST (shared class)            claims=42  verbatim-digest=7cbd7480cab654822383ef2de592c101
```

The digest is length-prefixed per claim, so a text that moved a line boundary could not compare equal by concatenation accident. Both numbers equal; the escalation condition is not met.

## Task 2 — the two residuals this task does NOT close, RE-MEASURED

```
$ node -e '…safetySurfaceUnion() markdown members, per-line delimiter scan…'
{"docs":40,
 "V-29-26-03 four_plus_backtick_delims":0,
 "column_zero_three":42,
 "V-29-26-04 indented_delims":4,
 "where":["README.md:31","README.md:33","README.md:40","README.md:42"]}
```

Re-run in this session rather than transcribed from round 3's measurement, which reported the same 4. Both are tree-wide fence-**grammar** residuals, not this module's; this task makes the module *agree with the rest of the tree* about them, which is what LANG-07 asks for. Both are recorded at the site with these counts.

## Task 2 — acceptance greps

```
$ grep -a -v '^\s*[/*]' scripts/audit-model.ts | grep -ac "trim() === \"$(printf '\140\140\140')\""
0
$ grep -a -c 'FENCE_DELIMITER_LINE' scripts/audit-model.ts
3
```

---

## Task 3 — ADVERSARIAL SELF-REPRODUCTION of the hazard, and a correction to my own first attempt

**The first attempt produced a FALSE result, and it is reported rather than deleted.** I ran the gates as `cd <mutated-tree> && node <mirror>/scripts/<gate>.js` and read `exit=0` as "the hazard is invisible to every gate". It was not: these gates resolve their root from `import.meta.dirname` (or `CHECK_ROOT`), never from cwd, so all three had been reading the **mirror's own clean registry**. The `exit=0` was the harness measuring itself. This is the sixth instance in this phase's record of a verification harness producing a false result, and it was caught by asserting the harness's own premise. Corrected below with `CHECK_ROOT`.

The mutation is the realistic authoring mistake: a prose section carrying **one unclosed example fence**, inserted at a block boundary (so no real claim's verbatim is corrupted and the hazard is isolated), with the exclusion list regenerated afterwards as an author naturally would.

```
PREMISE: 42 blocks; inserted "## How to write a claim block" + an unclosed ``` at a block boundary

=== PRE-TASK-3 build (hermetic mirror of HEAD~1) ===
  claims = 20 (live: 42)
  union  = 39 (live: 41)
  -- regenerate the exclusion list, as an author naturally would --
  generate-safety-surface   exit=0
  check-claim-anchors       exit=0     PASS  20 registry row(s) — 20 markdown, 0 unanchorable …
  check-audit-register      exit=0
  check-diff-disposition    exit=1     ← a MIRROR ARTIFACT, not a detection (see below)

=== POST-TASK-3 build, the SAME tree ===
  check-claim-anchors       exit=1
  check-audit-register      exit=1
  generate-safety-surface   exit=1
  FAIL  the claim registry could not be parsed, so NO check below was performed — audit-model:
        refusing to parse docs/audit/28-claim-registry.md — it carries 85 fence delimiter line(s),
        an ODD number, so a fence is still open at end of file — the last delimiter is at line …
```

**22 claims and 2 exclusion-list files gone, and the gate that exists to count claims printed a green `PASS 20 registry row(s)`** — with no denominator for 20 to be short against. That sentence is the whole argument for D-08.

`check-diff-disposition`'s exit 1 is honestly *not* a detection: its message is `` `git rev-parse --verify --quiet <sha>` failed `` — the temp mirror is not a git repository. It detected nothing about the mutation, and is reported that way rather than counted as a save.

An earlier, cruder mutation (deleting a closing delimiter *inside* a block) also shortened the list 42 → 20 but was caught incidentally by `check-claim-anchors`, because it corrupted a claim's verbatim and broke the anchor comparison. That is why the block-boundary variant above is the one presented: it isolates the hazard from that confound.

## Task 3 — the denominator, published

```
$ node scripts/check-claim-anchors.js | grep PASS
  PASS  42 registry row(s) parsed from 42 claim-heading-shaped line(s), 0 of them EXCLUDED as
        fenced documentation (the denominator: a claim list that shortened would be short against
        this number rather than against nothing) — 41 markdown, 1 unanchorable …
```

The two tallies are derived by **two separate loops** over the same text — one counting the shape over raw lines with no fence verdict at all, one counting the shape only on lines the toggle flags. Neither reads `headingIdx`. A third named refusal fires if `shaped − fenced` disagrees with the shared locator's answer, because a denominator that has drifted from its numerator bounds nothing.

`check-audit-register` never calls `readRegistry` at all (verified: no reference in the module), so it prints no claim tally and gained no output here. Per the plan's instruction that is recorded as **`UNKNOWN - verify`** rather than treated as done: whether the disposition register's gate should also publish a registry denominator is a question for a plan that owns that gate.

## Task 3 — the tally pin, and its planted-member probe

Re-derived live in this session, not transcribed: **42 claim-heading-shaped lines, 0 fenced.** The pin is two-sided (`headingShapedLines` and `headingShapedFenced` both equal counts derived here; `fenced` is pinned at 0; and `claims.length === shaped − fenced`). The probe plants one fenced claim heading in a mirror of the live registry, first asserting the plant added **exactly one** fenced shaped line, then showing the pin failing and naming the moved count — and finally that the planted phantom reached no claim row, which is the two halves of this plan agreeing on one document.

---

## THE ADVERSARIAL PASS ON MY OWN FIX — and the second fail-open it found

This repository's standing rule is that a green suite is not proof for a safety invariant. Five bypass shapes were attacked against the shipped build:

| # | attack | outcome | disposition |
|---|---|---|---|
| B1 | a **closed** fenced example spanning two real claim blocks (even count, no parity trip) | `claims=2 shaped=4 fenced=2` | **correct by the fence grammar** — those blocks genuinely are inside a fence, which is CR-02's own rule. Made visible by the denominator, and the live pin at `fenced === 0` reds. |
| B2 | fence opened at column 0, "closed" with a 3-space-indented delimiter | **REFUSED** (odd count) | closed |
| B3 | a four-backtick fence hiding a heading (V-29-26-03's floor) | `claims=2 shaped=3 fenced=1` | same as B1 — the disclosed prefix-test floor, visible in the denominator, 0 live instances |
| B4 | **two blocks each carrying ONE unclosed delimiter** → EVEN total | **PARSED `claims=1`**, a `kind: safety` claim dropped, verbatim corrupted | **A REGRESSION TASK 1 INTRODUCED. Closed in `a6e7a82`.** |
| B5 | a `g`-flagged RegExp into the shared authority | **REFUSED** by name | closed |

**B4 is the finding.** Document-level delimiter parity cannot see two errors that *cancel*. Measured on the same bytes:

```
PRE-PLAN (0ec8b61)     -> REFUSED: claim C-28-001's fenced block opened at line 11 and was never closed
POST-TASK-3 (HEAD)     -> PARSED claims=1 | verbatim[0]="text\n### C-28-002\n\n- file: README.md\n- line: 4\n- kin…"
```

A loud named refusal became a silent shortening that drops a `kind: safety` claim and returns a verbatim that is not the text it names. Task 3's own `done` says *"making the registry fence-aware cannot silently shorten the claim list"*, so this was closed rather than recorded as an accepted residual: a claim's verbatim may not contain a claim-heading-shaped line. Decided from the domain recogniser this module already declares — no new grammar, no second fence opinion — at the point of effect where the verbatim is built. **Live reachability measured before it was added: 0 of 42 claims.** After the fix, B4 refuses by name and the whole battery re-runs clean.

## Verification

| check | command | result |
|---|---|---|
| build + freshness | `npm run build && npm run freshness` | `All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.` |
| the six gates | `node scripts/check-{audit-register,claim-anchors,diff-disposition,foundation-guards,nul-bytes}.js`, `generate-safety-surface.js` | all exit **0** |
| exclusion list | `node scripts/generate-safety-surface.js && git diff --stat docs/audit/28-safety-surface-exclusions.md` | **empty** — byte-unchanged by this plan |
| NUL bytes | `node scripts/check-nul-bytes.js` | exit **0**, 1558 files — the counting greps above are trustworthy |
| regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | **1917 passed / 2 skipped across 52 files** (plan 29-27 baseline: 1890 / 2 / 52 — **+27**, no file lost) |
| working tree | `git status --porcelain` | no source file modified by a reproduction; only the pre-existing `human-notes.txt`, `.gsd/`, `.planning/phases/29.1-…` |

Suite delta accounting, so a silently shrinking suite would be visible: `frontmatter.test.ts` **+7**; `audit-model.test.ts` **+20** (5 CR-02 + 2 union + 1 live-count + 6 WR-02 + 6 Task 3 + 3 swallow, minus 3 counted twice across the describe splits — measured 65 → 85 in-file). 1890 + 27 = 1917.

## Decisions Made

1. **`CLAIM_HEADING_RE` stays in `audit-model.ts`.** It captures a claim id validated against `C-28-NNN` ten lines later — domain vocabulary, not a section grammar. What moved is its *use*, into the authority. Stated at the declaration so the next reader does not "finish the job" by relocating it.
2. **A third function, not a widened one.** `unfencedHeadingIndex` answers a `trimEnd()` equality; `sectionEndIndex` answers a bounded level; this one answers a caller-supplied predicate. Three questions, three functions, one toggle beneath all three.
3. **A `g`/`y` RegExp is refused, not repaired.** Resetting `lastIndex` would hide the mistake at the one call site while leaving the caller's regex broken at its next use — and the failure mode is a *silently short* answer, which is fail-open for every consumer.
4. **The live verbatim pin is an equality against a second extraction, not a frozen digest.** A digest would red the day a claim is legitimately added, making it a false-red generator rather than a pin. The pre/post digest equality is a one-off measurement and lives in this SUMMARY, where a one-off measurement belongs.
5. **The unterminated-fence condition is the toggle's own arithmetic.** The toggle flips once per delimiter line, so odd ⟺ open at EOF. No second state machine.
6. **B4 was closed rather than recorded.** Task 3's own done-criterion forbids the shape, and it is a regression this plan introduced — recording it as an accepted residual would have been grading my own paper.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `check-foundation-guards.test.ts` is outside the plan's `files_modified` and had to change twice**

- **Found during:** Tasks 1 and 2
- **Issue:** `importedSymbols("audit-model.ts", "frontmatter")` is an exact `toEqual` pin. Adding `unfencedMatchIndices` and then `FENCE_DELIMITER_LINE` made it red — which is the pin working, exactly as its own comment says. The plan's `files_modified` did not list this file.
- **Fix:** The pin moved 3 → 4 → 5, each with the direction checked first and the reason recorded at the site. `LOCATOR_FUNCTIONS` also gained `unfencedMatchIndices`, because that list keys the CONSUMER derivation and a locator function missing from it is a module that could adopt the authority and be counted as having adopted nothing — the hand-maintained-set drift this repository has corrected four times. Verified the consumer set is unchanged today, which is the check that this widening is a floor and not a re-measurement.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Committed in:** `3a16647`, `f3f85ee`

**2. [Rule 1 - Bug] The plan's Task 1 fixture is unparseable as transcribed**

- **Found during:** Task 1
- **Issue:** `29-REVIEW.md § CR-02`'s fixture carries **five** fence delimiters (its illustration's outer fence is left open) and `depends_on: none`, which is outside `SAFETY_FLOORS`. As written it cannot produce the two-row output the review reports, and Task 3's own refusal would refuse it for an unrelated reason.
- **Fix:** The illustration's outer fence is closed (six delimiters, even) and `depends_on` is a real floor. The *shape* the review reproduced is preserved exactly, and the pre-fix build reproduces the review's array byte-for-byte.
- **Files modified:** `scripts/audit-model.test.ts` (fixture only)
- **Committed in:** `3a16647`

**3. [Rule 1 - Bug] A NUL byte was written into `scripts/audit-model.test.ts`, and `grep` reported zero matches without warning**

- **Found during:** Task 2
- **Issue:** An edit landed `join("\0")` where `join(" ")` was intended. One NUL byte reclassified the whole file as binary: `file -b` reported `data`, and `grep -n "createHash"` returned **nothing at all** on a file that plainly contained the string. Two subsequent `Edit` calls then failed to match text that was visibly present.
- **Fix:** The offending case was rewritten byte-precisely (and replaced with the better second-extraction equality — see Decision 4). `node scripts/check-nul-bytes.js` confirms 1558 tracked files, zero NUL-bearing, so every counting grep in this SUMMARY is trustworthy.
- **Files modified:** `scripts/audit-model.test.ts`
- **Committed in:** `f3f85ee`

**4. [Rule 1 - Bug] My first gate-level reproduction produced a FALSE `exit=0`**

- **Found during:** Task 3
- **Issue:** Running `cd <mutated-tree> && node <mirror>/scripts/<gate>.js` measures the **mirror**, not the mutated tree — these gates resolve their root from `import.meta.dirname` or `CHECK_ROOT`, never cwd. I briefly had evidence that "all gates exit 0" which was an artifact of the harness.
- **Fix:** Re-run with `CHECK_ROOT` and a full mutated mirror. The corrected result still demonstrates the hazard — three gates green over 20 of 42 claims — but the *reason* one gate exited 1 is now correctly reported as a mirror artifact rather than a detection.
- **Files modified:** none (evidence, not code)
- **Committed in:** `ec47fda` (the corrected transcript is in this SUMMARY)

**5. [Rule 2 - Missing Critical] The even-count swallow shape (B4)**

- **Found during:** the mandated adversarial pass, after Task 3
- **Issue:** See the adversarial-pass section. A regression Task 1 introduced; parity cannot see two errors that cancel.
- **Fix:** A named refusal at the point of effect, two-sided, with live reachability measured at 0 of 42 before it was added.
- **Files modified:** `scripts/audit-model.ts`, `scripts/audit-model.test.ts`
- **Committed in:** `a6e7a82`

---

**Total deviations:** 5 auto-fixed (2 bugs in the plan's / review's own inputs, 2 bugs in my own work and harness, 1 missing-critical closure).
**Impact on plan:** Deviation 5 is the one that matters — the plan's Task 3 closed the fail-open it *predicted*, and attacking the result found a second one of the same class that the predicted fix could not see. Deviations 3 and 4 are both instances of this repository's recorded harness-premise failure class, self-inflicted within one session, and both were caught only by checking the premise rather than the result.

## Issues Encountered

- No auth gates, no package installs, no architectural decisions.
- No checkpoint was reached: the plan declares `autonomous: true` and every task is `type="auto"`.

## Known Stubs

None. Every new assertion has been seen failing against a build where the property does not hold, except the seven `unfencedMatchIndices` unit cases, whose pre-fix state was an unresolved import rather than a wrong answer — disclosed above rather than presented as a RED.

## Recorded Residuals (not closed, by name and with live counts)

| id | what | direction | live count |
|---|---|---|---|
| V-29-26-03 | `FENCE_DELIMITER_LINE` is a PREFIX test, so a four-backtick run carrying a three-backtick line truncates a block | fail-open, visible in the published tally | **0** four-plus-backtick delimiters across the 40-document derived corpus |
| V-29-26-04 | the class is COLUMN-ZERO anchored, so an indented delimiter is invisible to every consumer alike | fail-closed | **4**, all `README.md` lines 31, 33, 40, 42 |
| B1 / B3 | a **well-formed** fenced example may legitimately hide claim blocks; that is CR-02's own rule, not a defect | visible: `headingShapedFenced` moves off 0 and the live two-sided pin reds | **0** on the live registry |
| — | `check-audit-register` publishes no registry denominator because it never reads the registry | `UNKNOWN - verify` | n/a |

## Threat Flags

None. The plan's `<threat_model>` covers every surface touched. `T-29-28-SC` (package installs) remains an empty input set — this plan installs nothing, per the zero-runtime-dependency constraint. Every `critical` and `high` row is dispositioned `mitigate` and landed: T-29-28-01 and -02 in `3a16647`, T-29-28-03 in `f3f85ee`, T-29-28-04 and -05 in `ec47fda`. T-29-28-06 remains `accept` with its live counts re-measured above.

## Next Phase Readiness

- **LANG-07's "never two grammars over the same bytes" now holds for `audit-model.ts`** — the last module of the class. The section-extent owner set is still `["frontmatter.ts"]`, re-derived, and the fence-machine set is still 3.
- **LANG-03's exclusion list is no longer feedable from documentation**, and the two ways the fix could have narrowed it are named refusals.
- **A note for 29-29 / 29-30 / 29-31 / 29-32:** `unfencedMatchIndices` exists now. Any consumer scanning raw lines for a bounding heading should compose it rather than declare a seventh predicate — and adding it to a module's import list will red the `importedSymbols` pin in `check-foundation-guards.test.ts`, which is intended.
- **Carried forward for the round's own record:** the two harness-premise failures in Deviations 3 and 4. `grep` returning zero on a NUL-bearing file, and a gate binary reading its own mirror instead of the tree under test, are both shapes that produce a *confident wrong answer* rather than an error.

## Self-Check: PASSED

All six modified source files exist on disk. All four task commits (`3a16647`, `f3f85ee`, `ec47fda`, `a6e7a82`) exist in git history.

---
*Phase: 29-controlled-language-voice-guard-rebuild*
*Completed: 2026-08-16*
