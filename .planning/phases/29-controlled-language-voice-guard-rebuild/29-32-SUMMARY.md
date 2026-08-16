---
phase: 29-controlled-language-voice-guard-rebuild
plan: 32
subsystem: tooling
tags: [typescript, section-locator, safety-exemption, fence-parser, gap-closure, LANG-07]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "frontmatter.ts's ONE-SECTION-LOCATOR block (unfencedHeadingIndex / sectionEndIndex, plan 29-20, D-24) and fencedLineFlags — the one fence toggle beneath all of them"
provides:
  - "locateExemptRegion derives ONE array from `text` and both the COUNT and the LOCATE walk it — the two-array shear that made a `-1` reachable is deleted, not defended"
  - "a NAMED refusal when the caller's array disagrees with `lines.join(\"\\n\")` about line boundaries, because the returned indices are spent against the caller's array"
  - "a NAMED refusal on the authority's `-1`, placed before the index reaches sectionEndIndex or the body slice, naming both halves and forbidding the default-to-zero repair"
  - "frontmatter.ts states the `-1` CONTRACT at the authority's declaration: a legal answer, never an index, checked by every consumer before use"
  - "frontmatter.test.ts derives every call site tree-wide and classifies it GUARDED or UNGUARDED — two-sided, vacuity-floored, probes proven both ways, with a before/after pair against the pre-fix source"
  - "BANNED_CLAIM_EXEMPT_EXTENT — how far the one named exemption region reaches, published on every run and pinned two-sided beside (never folded into) the occurrence reach"
  - "a point-of-effect refusal: a region whose LAST LINE is inside a fenced block did not end at a heading, which catches the count-preserving swallow no number can see"
affects: [audit-open, safety-exemption, banned-claims, section-locator, LANG-07]

actuals:
  tokens: 24886
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "When two traversals must agree, DERIVE ONE FROM THE OTHER'S SOURCE rather than guarding their disagreement — a guard on a disagreement that can still occur is a smaller fix than a disagreement that cannot"
    - "An index-returning helper's answer is spent in the CALLER's coordinate system; a function that returns indices must refuse a caller whose array disagrees with the text it was asked about"
    - "A published cardinality is blind to membership by construction; pair it with a POINT-OF-EFFECT check on the structure the number was standing in for"
    - "A classifier window over comment-stripped source must count CODE lines, not source lines — otherwise the budget is spent on prose and the scan is blind to guards that argue for themselves"

key-files:
  created: []
  modified:
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.test.ts
    - scripts/frontmatter.ts
    - scripts/frontmatter.test.ts

key-decisions:
  - "The drift route is DELETED (one array under both traversals) and the `-1` guard is kept as belt and braces, stated at the site as unreachable-today-but-contractual"
  - "A THIRD refusal was added beyond the plan: the caller's array must round-trip through `lines.join(\"\\n\")`, because returning text-coordinate indices to a caller holding a different array is a widening the two guards cannot see"
  - "The delimiter-neutralised projection was NOT hoisted and NO second copy was written — the swallow is caught quantitatively and at the point of effect instead, and the reasoning is recorded"
  - "The extent pin's reflow-noise cost is accepted and stated: reach is a question a line count answers badly, extent is a question ONLY a line count answers"
  - "V-29-32-01 (the CLOSED-fence count-preserving compensating edit) is RECORDED, not closed — it is indistinguishable from the legitimate WR-06 case plan 29-18 established on purpose"

patterns-established:
  - "Ask what a returned index is SPENT ON. Two guards can both be satisfied in the coordinate system the function computed in, while the caller applies the answer in a different one."
  - "After adding a quantitative pin, attack it with a COMPENSATING edit. If the attack works, the pin needs a structural partner, not a bigger number."

requirements-completed: [LANG-07]

coverage:
  - id: D1
    description: "The COUNT and the LOCATE traverse ONE array, so the authority's `-1` is unreachable by arithmetic; the drift is refused by name and the live boundary is provably unmoved"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#FIXTURE PREMISE: the drift array really does shear the two coordinate systems apart"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the drift is REFUSED BY NAME — never a region whose exemption test is true from line zero"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the returned `headingAt` is NEVER negative — asserted directly, not inferred from a null"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#ZERO DELTA on correct bytes: the live region equals what the authority answers, independently derived"
        status: pass
      - kind: other
        ref: "the pre/post hermetic-mirror reproduction below — PRE returns {headingAt:-1,endBefore:7} with every line exempt from zero; POST returns null"
        status: pass
    human_judgment: false
  - id: D2
    description: "The `-1` refusal exists, is reachable on a build where the disagreement can occur, and names both halves"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#THE `-1` GUARD IS SEEN FIRING: a build with the two traversals restored refuses, naming BOTH halves"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#CONTROL: the SHIPPED build refuses the same bytes at the ASSEMBLY check, before any index exists"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the existing two-sided heading-count refusal still fires in BOTH directions, wording unchanged"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every non-test consumer of the authority honours the `-1` contract, derived tree-wide, counted, two-sided, vacuity-floored, with probes proven in both directions"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/frontmatter.test.ts#the consumer set and its call-site count are DERIVED, sorted and pinned two-sided"
        status: pass
      - kind: unit
        ref: "scripts/frontmatter.test.ts#the UNGUARDED set over the live tree is EMPTY, and every site names its guard distance"
        status: pass
      - kind: unit
        ref: "scripts/frontmatter.test.ts#THE VACUITY FLOOR FIRES: a scan over an empty module set fails BY NAME"
        status: pass
      - kind: unit
        ref: "scripts/frontmatter.test.ts#THE CLASSIFIER DISCRIMINATES IN BOTH DIRECTIONS: a planted guarded call passes, a planted unguarded call is NAMED"
        status: pass
      - kind: unit
        ref: "scripts/frontmatter.test.ts#THE SCAN MEASURES THE DEFECT PLAN 29-32 CLOSED: the pre-fix source of check-banned-claims.ts is reported UNGUARDED"
        status: pass
      - kind: unit
        ref: "scripts/frontmatter.test.ts#THE DISCLOSED SCAN-SCOPE SHORTFALL (V-29-26-02) IS RE-MEASURED, and the unread modules are named"
        status: pass
    human_judgment: false
  - id: D4
    description: "The exemption publishes its EXTENT and a swallowed section carrying no banned claim reds — including the shapes a delimiter-parity check cannot see"
    requirement: LANG-07
    verification:
      - kind: integration
        ref: "scripts/check-banned-claims.test.ts#the gate PUBLISHES the exemption's extent, and the number is PINNED against a live derivation"
        status: pass
      - kind: integration
        ref: "scripts/check-banned-claims.test.ts#VARIANT C1: an unterminated fence swallowing a section that carries NO banned claim REDS on the extent"
        status: pass
      - kind: integration
        ref: "scripts/check-banned-claims.test.ts#CONTROL: the same document with the fence TERMINATED stays GREEN — the pin is not refusing everything"
        status: pass
      - kind: integration
        ref: "scripts/check-banned-claims.test.ts#THE PARITY-BLIND SHAPE IS CAUGHT TOO: a properly CLOSED fence whose close lands PAST the boundary heading"
        status: pass
      - kind: integration
        ref: "scripts/check-banned-claims.test.ts#FALSIFIABLE, direction DOWN: a region one line SHORTER also reds — the extent pin is two-sided"
        status: pass
      - kind: integration
        ref: "scripts/check-banned-claims.test.ts#THE TWO PINS ANSWER DIFFERENT QUESTIONS: each fires with the other green, in both directions"
        status: pass
      - kind: other
        ref: "the variant C1 pre/post hermetic reproduction below — PRE exit 0 with the reach pin green while the region reaches 62 -> 69; POST exit 1 naming the moved extent"
        status: pass
    human_judgment: false
  - id: D5
    description: "The count-preserving compensating swallow — found by attacking this plan's own extent pin — is caught at the point of effect, with the legitimate closed-example case still green"
    requirement: LANG-07
    verification:
      - kind: integration
        ref: "scripts/check-banned-claims.test.ts#THE COUNT-PRESERVING COMPENSATING EDIT IS CAUGHT AT THE POINT OF EFFECT, not by the number"
        status: pass
      - kind: integration
        ref: "scripts/check-banned-claims.test.ts#CONTROL for that check: a region containing a properly CLOSED fenced example stays GREEN"
        status: pass
      - kind: other
        ref: "the A1 reproduction below — both pins on their numbers and exit 0 before the check, exit 1 after, on the same bytes"
        status: pass
    human_judgment: false
  - id: D6
    description: "The residuals this plan does NOT close, named with re-measured live counts"
    requirement: LANG-07
    verification:
      - kind: other
        ref: "the A2 reproduction and the residual table below — V-29-32-01 (0 live), V-29-26-01 setext (0 live), V-29-26-04 indented (0 live against 4 column-zero delimiters)"
        status: pass
    human_judgment: true
    rationale: "Whether to carry V-29-32-01 forward is a human judgment. Closing it would revert plan 29-18's deliberate WR-06 decision that a `## ` line quoted inside a closed fenced example is documentation, which this plan does not own."

duration: 26min
completed: 2026-08-16
status: complete
---

# Phase 29 Plan 32: One array under both traversals, a `-1` refused by name, and an exemption that publishes how far it reaches

**`locateExemptRegion` counted the exemption's heading over the caller's array and located it over a string built from that array, consulting a fence-flag array indexed in the second coordinate system at an index from the first. Reproduced on a hermetic mirror, the shear returns `{headingAt: -1, endBefore: 7}` and the scan's exemption test is TRUE FOR EVERY LINE FROM ZERO — the tree's one named safety exemption widened to a whole document through a legal answer nobody read. The route is deleted, the answer is refused by name, the class is asserted tree-wide, and the exemption now publishes how far it reaches so a swallowed section moves a number.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-08-15T23:59:06Z
- **Completed:** 2026-08-16T00:25:28Z
- **Tasks:** 3
- **Files modified:** 4 (+ their committed `.js`)

## Accomplishments

- **WR-04 closed structurally, not defended.** Both traversals walk one array derived from `text`; a count of exactly one now *implies* a valid index by arithmetic rather than by inspection. The `-1` guard is kept as contract and is watched firing on a build with that one expression reverted.
- **A third fail-open, found while writing the fix, is closed in the same commit.** The returned indices are spent against the CALLER's array. Deriving the count from `text` makes count and locate agree — and leaves a caller whose array disagrees with `text.split("\n")` applying a correct region at the wrong offset. Refused by name.
- **IN-02's correctness edge is gone at this site.** The exemption document is now read ONCE and every question is asked of that one string.
- **LANG-07's contract is a MEASUREMENT, not a sentence.** 5 consumers, 7 call sites, 0 unguarded, derived tree-wide, counted by a second independent expression, floored in both directions, with planted probes proven both ways and a before/after pair against the reconstructed pre-fix source.
- **Variant C1 closed, and the "nothing new" dismissal answered.** The exemption publishes its extent; a section swallowed into it while carrying no banned claim moves that number and reds. The shape a delimiter-parity check cannot see — a properly closed fence whose close lands past the boundary — is caught too.
- **The adversarial pass beat this plan's own extent pin, and the bypass is closed.** A count-preserving compensating edit held both published numbers on their pins while swallowing a section. Closed at the point of effect from the one imported fence toggle.

## Task Commits

1. **Task 1 (TDD): one array under both traversals, and the locator's `-1` refused by name** — `694d541` (fix)
2. **Task 2 (TDD): the `-1` is a CLASS, derived tree-wide and asserted with a count** — `a5062fa` (test)
3. **Task 3 (TDD): the exemption publishes its EXTENT, and a swallow is caught where it happens** — `970209e` (fix)

## Files Created/Modified

- `scripts/check-banned-claims.ts` — `scanLines` derived from `text` and walked by both traversals; the assembly refusal; the `-1` refusal with its contract paragraph; `BANNED_CLAIM_EXEMPT_EXTENT` with its accepted cost and three named residuals; the region-ends-inside-a-fence refusal; one read of the exemption document
- `scripts/check-banned-claims.test.ts` — 15 new permanent cases across two describe blocks; `profileDoc` pads every mirror to the declared extent, derived from the pin rather than typed
- `scripts/frontmatter.ts` — the `-1` CONTRACT at the authority's declaration, with the forbidden "repair" named and the two scans distinguished
- `scripts/frontmatter.test.ts` — the derived tree-wide guarded/unguarded classifier, its two-sided pins, its two vacuity floors, both planted probes, the before/after pair and the re-measured V-29-26-02 shortfall

---

## Task 1 — the RED-first transcript

Written before the source was touched and run against the committed (pre-fix) build. Verbatim:

```
$ npx vitest run scripts/check-banned-claims.test.ts

 × the drift is REFUSED BY NAME — never a region whose exemption test is true from line zero
 × the returned `headingAt` is NEVER negative — asserted directly, not inferred from a null
 × THE `-1` GUARD IS SEEN FIRING: a build with the two traversals restored refuses, naming BOTH halves
 × CONTROL: the SHIPPED build refuses the same bytes at the ASSEMBLY check, before any index exists

AssertionError: a caller array that disagrees with the authority about line boundaries produced a
REGION — at HEAD that region was {headingAt: -1}, which exempts every line of the document from zero
  { "endBefore": 7, "headingAt": -1 }

AssertionError: the drift array: expected -1 to be greater than or equal to 0
AssertionError: expected '{"headingAt":-1,"endBefore":7}' to be 'null'

 Test Files  1 failed (1)
      Tests  4 failed | 44 passed (48)
```

## Task 1 — ADVERSARIAL SELF-REPRODUCTION: the drift, forced through the PUBLIC signature

The plan allowed forcing the drift through a local copy of the function if the public signature could not reach it. **It can**, so no local copy was used. The fixture is a caller array assembled on a different newline rule — one element carrying embedded separators, which is what `split("\r\n")` over a document with one bare LF produces. Hermetic mirrors (`git archive HEAD | tar -x`), never the live tree.

```
$ node probe.mjs $SP/pre/scripts/check-banned-claims.js     # mirror of HEAD (4e5be39)
=== PRE (mirror of HEAD, the shipped defect) ===
returned: {"headingAt":-1,"endBefore":7}
exemption test true for lines: 0,1,2,3,4
line 0 exempt? true

$ node probe.mjs $SP/post/scripts/check-banned-claims.js    # this plan's build
=== POST ===
  FAIL  the exemption document was handed to `locateExemptRegion` as 5 line(s) while
        `lines.join("\n")` splits back into 7 — the caller's array was assembled on a different
        newline rule from the one the shared locator uses…
returned: null
```

**The exemption test is true for every line of the document**, which is WR-04's predicted fail-open reproduced exactly. The shear is not hypothetical: `lines` has 5 elements, `lines.join("\n").split("\n")` has 7, the heading sits at LINES index 2 (where the fence flag belongs to an unrelated line and reads false, so the COUNT reaches one) and at TEXT index 4 (where the flag really is true, so the LOCATE answers `-1`).

## Task 1 — the `-1` refusal, SEEN FIRING

After the structural half, no input reaching the function through its public signature can produce a `-1` — a case that could reach it would be evidence the structural half had not landed. So the guard is exercised on a scratch build with **one expression** reverted (`const scanLines = text.split("\n")` → `const scanLines = lines`), which restores HEAD's two-array shape exactly and leaves the guard in place. A git-hash checkout was deliberately not used: keying a permanent case to a commit rots the first time the file moves (plan 29-27, decision 5).

```
patch applied: scanLines now aliases the caller array (HEAD shape)
  FAIL  the exempt heading `## Disclaimer and honesty floor` in `agent-factory/writing-profile.md`
        was COUNTED once and LOCATED zero times — the count predicate and the shared locator
        disagree about which lines are the region's heading. `-1` is the authority's legal answer
        for "no such unfenced line", never an index, so the gate is refusing rather than exempting
        from line 0. Do NOT repair this by defaulting the index to zero: that turns a one-section
        exemption into a whole-document one, which is the exact failure this guard exists to prevent
returned: null
```

Both halves named. The harness asserts the patch **changed** the source before believing the result — a replace that matched nothing would have produced an unmodified build and a probe that proved exactly nothing while reporting a clean pass.

## Task 1 — the two traversals are provably ONE

Comments filtered. The count loop's bound and the locate's argument now derive from the same identifier, `scanLines`, which is itself derived from `text` — the same string `unfencedHeadingIndex` is asked about.

```
$ grep -a -v '^\s*//' scripts/check-banned-claims.ts | grep -a -nE 'const scanLines = |for \(let i = 0; i < scanLines\.length|scanLines\[i\]\.trimEnd|unfencedHeadingIndex\(|^\s+text,$|scanLines\.slice'
322:  const scanLines = text.split("\n");
339:  for (let i = 0; i < scanLines.length; i++) {
342:      scanLines[i].trimEnd() === BANNED_CLAIM_EXEMPT_REGION.heading
356:  const headingAt = unfencedHeadingIndex(
357:    text,
373:  const body = scanLines.slice(headingAt + 1, endBefore);
```

The two lines side by side: `for (let i = 0; i < scanLines.length; i++)` bounds the COUNT, and `unfencedHeadingIndex(text, …)` is the LOCATE — with `scanLines === text.split("\n")` by the line above them both. No traversal over the caller's `lines` survives inside this function.

## Task 1 — ZERO DELTA on correct bytes

```
=== live exemption boundary, PRE build ===
{"headingAt":219,"endBefore":281} extent = 62
=== live exemption boundary, POST build ===
{"headingAt":219,"endBefore":281} extent = 62
```

Byte-identical. The fix closes a route; it moves nothing on bytes that were never drifted. The plan's escalation condition (either number moving) is not met. `node scripts/check-banned-claims.js` exits **0** on the live tree and the `BANNED_CLAIM_EXEMPT_SUPPRESSED` behaviour is unchanged — its four harness cases (reach published and pinned, harness premise, direction UP, direction DOWN) all pass, and Task 3's `THE TWO PINS ANSWER DIFFERENT QUESTIONS` re-runs both directions again.

---

## Task 2 — the derived scan, run in this session

Every number below was produced by running the derivation, not transcribed:

```
modules read: 40
consumers   : ["audit-model.ts","check-banned-claims.ts","check-diff-disposition.ts",
               "check-imperative-lexicon.ts","voice-model.ts"]
consumer cnt: 5
site count  : 7
unguarded   : []
guard distances: ["audit-model.ts:472=1","check-banned-claims.ts:588=4",
                  "check-diff-disposition.ts:566=1","check-diff-disposition.ts:1260=1",
                  "check-imperative-lexicon.ts:738=1","check-imperative-lexicon.ts:776=1",
                  "voice-model.ts:224=1"]
furthest    : 4 of window 24
```

Both numbers are pinned two-sided (`CONTRACT_CONSUMERS` / `CONTRACT_CONSUMER_COUNT` = 5, `CONTRACT_SITE_COUNT` = 7). **The element count is derived by a second expression that never runs the classifier** — a regex sweep over the same comment-stripped sources — and the two are compared, because a vacuity floor catches an empty denominator but never a silently short one.

The window is measured rather than trusted: the furthest live guard sits **4 code lines** below its call against a window of 24, so the empty answer above does not depend on the constant.

## Task 2 — the vacuity floors, SEEN FAILING

```
contractScan([], …)                    -> Error: … was handed ZERO modules — every claim it could
                                          make about unguarded consumers would be true of an empty set
contractScan(["a.ts","b.ts"], stub)    -> Error: … read 2 module(s) and derived ZERO call sites of
                                          the locator — either the classifier stopped matching or the
                                          tree stopped consuming the authority
```

Two floors, because a scan that reads nothing and a scan that matches nothing produce the same clean answer for different reasons.

## Task 2 — BOTH planted probes, both outcomes shown

Run through THE RULE over a temp directory, never a second spelling of it. The plants are assembled from the split locator name so this file's own source carries no call-shaped occurrence of it.

```
planted sites                 -> 2                       (premise: both plants produced a site)
planted.filter(!guarded)      -> ["unguarded-plant.ts"]  (the unguarded plant is REPORTED, by name)
planted.filter(guarded)       -> ["guarded-plant.ts"]    (the guarded plant is NOT)
```

A probe demonstrated on one side only is half a probe; both sides are asserted.

## Task 2 — the before/after pair

The scan must be shown measuring the defect Task 1 closed rather than an invented one — the standard `PLANTED_SIXTH_LOCATOR` is held to. The pre-fix source is **reconstructed** from the shipped source by deleting the guard block (with the deletion asserted to have changed the text), not checked out of a commit.

```
shipped source of check-banned-claims.ts  -> unguarded: []
reconstructed pre-fix source              -> unguarded: [{ module: "check-banned-claims.ts",
                                                           bound: "headingAt", guarded: false }]
```

## Task 2 — V-29-26-02 re-measured, with the unread modules named

```
$ node -e '…git ls-files "*.ts" minus tests/d.ts, against readdirSync("scripts")…'
V-29-26-02 (this scan): reads 40 of 49 tracked non-test .ts
unread: hooks/admission-guard.ts, hooks/guard.ts, install/install.ts, install/kit-source.ts,
        install/uninstall.ts, scripts/frontmatter.ts, scripts/runnable-ref/reference-check.ts,
        scripts/runnable-ref/test-skip-integrity.ts, vitest.config.ts
```

40 rather than 29-27's 41 because this scan additionally excludes the **authority itself** — it declares the function, it does not consume it. The shortfall is asserted as a list, printed on failure, so it is actionable rather than an adjective.

## Task 2 — this scan is NOT `LOCATOR_CONSUMERS`

Stated here so a later reader does not merge two predicates into one scan:

| scan | file | question it answers |
|---|---|---|
| `LOCATOR_CONSUMERS` | `check-foundation-guards.test.ts` | **WHO consumes the authority** — membership, so a module cannot adopt the locator unnoticed |
| the `-1` contract scan | `frontmatter.test.ts` | **whether each consumer honours the `-1` contract** — a property of each call site |

Merging them would produce one predicate that answers neither. Both sets happen to be the same five modules today; that is a coincidence of this tree, not an identity, and a module could join one without joining the other (a consumer of `unfencedMatchIndices` alone belongs to the first and not the second).

---

## Task 3 — ADVERSARIAL SELF-REPRODUCTION of variant C1

Hermetic mirror of `HEAD`, the live document mutated with the recorded C1 shape: an unterminated fence opened inside the exemption region, a real `## ` section appended after it, and **no banned claim anywhere in the swallowed text**.

```
PREMISE: region heading at line 220 | appended a section after an unterminated fence

=== PRE-TASK-3 build over the C1 tree ===
  region: {"headingAt":219,"endBefore":288} | extent = 69
  gate exit=0
  ALL CHECKS PASSED
  suppresses 10 banned-claim occurrence(s), pinned at 10

=== POST-TASK-3 build over the SAME tree ===
  region: {"headingAt":219,"endBefore":288} | extent = 69
  gate exit=1
  FAIL  the one named exemption region … reaches 69 line(s), and BANNED_CLAIM_EXEMPT_EXTENT in
        scripts/check-banned-claims.ts declares 62. An extent that has moved means the exemption
        now covers different bytes than the ones it was measured over — which is what a section
        SWALLOWED into the region looks like when it carries no banned claim of its own…
```

The two `endBefore` values are **281 on the clean tree (extent 62)** and **288 on the C1 tree (extent 69)**. Before this task the gate printed `ALL CHECKS PASSED` with the occurrence pin sitting exactly on `10 of 10` while the exemption reached seven lines further and had swallowed `## Notes for maintainers`. That transcript is the whole argument against round 2's "nothing NEW": **the reach pin measures occurrences, and a cardinality is blind to membership by construction.**

## Task 3 — the extent, published

```
$ node scripts/check-banned-claims.js | grep PASS
  PASS  LANG-04: 82 document(s) … 1 exemption region (agent-factory/writing-profile.md § ## Disclaimer
        and honesty floor — …), which suppresses 10 banned-claim occurrence(s), pinned at 10, and
        reaches 62 line(s), pinned at 62 (two numbers, two questions: how much prohibition the region
        lifts, and how far it reaches — a section swallowed into it moves only the second); …
```

The pinned 62 was derived in this session through the gate's own locator (`{"headingAt":219,"endBefore":281}` → `281 − 219`), with a non-vacuity floor requiring it to exceed 1 before the equality is believed. The occurrence pin is **untouched** — same constant, same wording, same two-sided behaviour — and `THE TWO PINS ANSWER DIFFERENT QUESTIONS` proves each fires with the other green, in both directions, so neither subsumes the other.

Every mirror in the harness is padded to the declared extent, with the pad **derived from the pin rather than typed** — the same argument the existing `need` arithmetic already makes for the reach, and it throws a named error rather than under-padding if a fixture's region is already longer than the pin.

## THE ADVERSARIAL PASS ON MY OWN FIX — and the bypass it found

This repository's standing rule is that a green suite is not proof for a safety invariant. Six shapes were attacked against the shipped build:

| # | attack | outcome | disposition |
|---|---|---|---|
| A1 | **count-preserving compensating edit**: swallow K lines behind an unclosed fence, delete K neutral lines from the disclaimer | **BOTH pins green, gate exit 0**, `## Notes for maintainers` inside the exemption | **THE FINDING. Closed in `970209e`.** |
| A2 | the same, with the fence properly **CLOSED** and prose after it | both pins green, exit 0 | **RECORDED as V-29-32-01** — indistinguishable from WR-06's deliberate legitimate case; see below |
| A3 | closed fence whose close lands **past** the boundary heading (even delimiter count) | extent moves → **exit 1** | closed; the shape delimiter parity cannot see |
| A4 | fence opened **before** the region heading | heading flagged fenced → `occurs 0 time(s)` refusal | closed by an existing guard |
| A5 | region one line shorter / one occurrence more | both pins red, each naming its own numbers | closed, two-sided |
| A6 | exemption document deleted | named refusal, no stack trace | closed by an existing guard |

**A1 is the finding, and it defeated this plan's own extent pin.** Measured on a hermetic mirror of the live tree:

```
A1 PREMISE: deleted 7 neutral line(s) from inside the region; appended 7 line(s) behind an
            unterminated fence
A1 region: {"headingAt":219,"endBefore":281} extent = 62 | swallowed heading inside region? true
A1 gate exit=0
ALL CHECKS PASSED
reaches 62 line(s), pinned at 62
```

Extent on its pin, reach on its pin, gate green, and a section nobody reviewed inside the tree's one named safety exemption. **A number is blind to membership by construction** — the sentence this repository has now paid for three times.

Closed at the **point of effect** rather than by a bigger number: a region whose LAST LINE is inside a fenced block did not end at a heading; it ended because the document ran out while a fence was still open, so every heading between that open delimiter and end of file was hidden from the bound. Decided from the **one fence toggle this module already imports** — no heading pattern declared here, no delimiter class re-declared, no second projection built, and no delimiter parity counted (plan 29-28 measured what parity cannot see). Same bytes, after the fix:

```
A1 region: {"headingAt":219,"endBefore":281} extent = 62 (still on the pin)
  gate exit=1
  1 CHECK(S) FAILED
  FAIL  … ENDS INSIDE A FENCED BLOCK — its last line (line 281) is flagged by the shared fence
        toggle … every section after it has been SWALLOWED into a safety exemption …
```

The number never moved. The check that caught it is not a number.

**A2 is the residual, and it is recorded rather than closed.** With the fence properly closed and prose after it, the region's last line is unflagged and the point-of-effect check is silent **by design**:

```
A2 PREMISE: deleted 6 neutral line(s); appended a CLOSED fenced block hiding a ## heading, plus tail prose
  region: {"headingAt":219,"endBefore":281} extent = 62 | last region line fenced? false
        | ## Notes inside region? true
  A2 gate exit=0
  ALL CHECKS PASSED
```

That shape is **indistinguishable from the legitimate case plan 29-18 established on purpose**: a `## ` line QUOTED inside a closed fenced example is documentation, and the region deliberately continues past it (WR-06). Refusing it would revert a decision this plan does not own. It is not free either — the deleted K lines must also carry zero banned-claim occurrences or the reach pin reds — so the residual is exactly that intersection: a deliberate, coordinated two-part edit, never an accident. Recorded at the site as **V-29-32-01** with its live count of **0**.

## Task 3 — THE STANDING PROHIBITION, ANSWERED

The plan required a stated decision, and a silent third option is a failed task.

**Decision: the delimiter-neutralised projection was NOT hoisted, and no second copy was written.**

Reason. The projection answers "what would the section bound be if the fence toggle were blind", and that is not the question this task needed. Asked here it would have been *wrong*: the blind bound and the fence-aware bound legitimately disagree on the live design — that disagreement **is** WR-06's deliberate widening (a `## ` quoted inside a closed example does not end the region), so a blind-versus-aware comparison would refuse the correct document. What the swallow needed instead was (a) a **quantity** — how far the region reaches, which the extent pin publishes and pins two-sided — and (b) a **structural fact at the point of effect** — whether the boundary was decided by a fence that had not closed, which is one array lookup into `fencedLineFlags`, the class this module already imports.

Verified mechanically:

```
$ grep -a -c 'blindText\|delimiterBlind' scripts/check-banned-claims.ts
0
$ grep -a -c 'blindText' scripts/voice-model.ts
3
$ grep -a -c '^export ' scripts/frontmatter.ts
33          # unchanged by this plan — no new export was added
```

Plan 29-27's projection remains exactly where it was, private to `voice-model.ts`, with no sibling anywhere. What the extent pin plus the point-of-effect check catch instead: variant C1 (odd parity), the closed-fence-past-boundary shape (even parity, invisible to a parity check), the two-sided extent movement in both directions, and the count-preserving compensating swallow with an unclosed fence.

## Verification

| check | command | result |
|---|---|---|
| build + freshness | `npm run build && npm run freshness` | `All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.` |
| the seven gates | `node scripts/check-{audit-register,claim-anchors,diff-disposition,foundation-guards,nul-bytes,banned-claims}.js`, `generate-safety-surface.js` | **0, 0, 0, 0, 0, 0, 0** |
| NUL bytes | `node scripts/check-nul-bytes.js` | exit **0** — the counting greps above are trustworthy |
| regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | **1971 passed / 2 skipped across 52 files** (plan 29-30 baseline: 1950 / 2 / 52 — **+21**, no file lost) |
| working tree | `git status --porcelain` | no source file modified by a reproduction; only the pre-existing `human-notes.txt`, `.gsd/`, `.planning/phases/29.1-…` |

Suite delta accounting, so a silently shrinking suite would be visible: `check-banned-claims.test.ts` **+7** (Task 1) **+8** (Task 3), `frontmatter.test.ts` **+6** (Task 2). 1950 + 21 = 1971. In-file counts measured 48 → 56 and 287 → 293.

## Decisions Made

1. **The drift route is deleted; the `-1` guard is belt and braces.** A guard on a disagreement that can still occur is a strictly smaller fix than a disagreement that cannot. Both are stated at the site, including that the guard is unreachable through the public signature today — which is why it is exercised by a scratch-build revert rather than by a case that would, if it passed, be evidence the structural half had not landed.
2. **A third refusal was added beyond the plan: the caller's array must round-trip.** Deriving the count from `text` makes count and locate agree in TEXT coordinates — and the indices are spent in the CALLER's. Both guards can be satisfied while the region is applied at the wrong offset. Refused rather than reconciled: reconciling would pick a winner between two disagreeing assemblies of one document, which is a second grammar with extra steps.
3. **The exemption document is read once.** Re-reading it for the boundary check would have been this plan's own subject — two expressions assembling one document twice — at the same address.
4. **The extent pin's reflow noise is accepted and named.** The reach pin's own doc-comment argues against line counts, and it is right about reach: reach is a question a line count answers badly. Extent is a question ONLY a line count answers. The remedy wording says restore or re-measure deliberately, never widen.
5. **The classifier's window counts CODE lines, not source lines.** The first draft spent its budget on blanked comment lines and reported `check-banned-claims.ts` UNGUARDED against the very source that guards it — a window measured in prose length, in a tree whose modules argue for themselves at length. Recorded at the constant.
6. **V-29-32-01 is recorded, not closed.** Closing it would revert plan 29-18's WR-06 decision, which this plan does not own.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The caller's array can disagree with the text the authority is asked about**

- **Found during:** Task 1, while writing the structural half
- **Issue:** The plan's fix makes the COUNT and the LOCATE agree by deriving both from `text`. It does not make the *returned indices* agree with the array the caller spends them on. A caller holding `["a\nb", "## Disclaimer…", "claim", "## Next"]` gets `{headingAt: 2, endBefore: 4}` in text coordinates and slices its own 4-element array — exempting `## Next`, which is outside the region. Both new guards are satisfied; the widening is silent.
- **Fix:** A named refusal when `lines.join("\n").split("\n").length !== lines.length`, placed before the count, stating that every returned index is spent against the caller's array so the two must be one array.
- **Files modified:** `scripts/check-banned-claims.ts`, `scripts/check-banned-claims.test.ts`
- **Verification:** the `CONTROL: the SHIPPED build refuses the same bytes at the ASSEMBLY check` case, plus the pre/post reproduction above
- **Committed in:** `694d541`

**2. [Rule 1 - Bug] The contract classifier's window was measured in source lines and reported a guarded site as unguarded**

- **Found during:** Task 2, first run
- **Issue:** Comment lines are blanked because the property is about code, and the first draft then spent its 24-line budget on the blanks. The `-1` guard in `check-banned-claims.ts` sits below a twenty-two-line explanation of why it exists, so the classifier reported the shipped source UNGUARDED — a false measurement against the very source that guards it.
- **Fix:** The budget increments only on non-blank lines. Re-measured: the furthest live guard is 4 code lines below its call, against a window of 24, so the answer no longer depends on the constant and the case asserts that.
- **Files modified:** `scripts/frontmatter.test.ts`
- **Verification:** `the UNGUARDED set over the live tree is EMPTY, and every site names its guard distance`, which asserts the furthest distance directly
- **Committed in:** `a5062fa`

**3. [Rule 1 - Bug] "Two unclosed fences summing to an EVEN count" is not a reachable shape for a single-document toggle**

- **Found during:** Task 3, first GREEN run
- **Issue:** The parity-blind case was drafted with two `` ``` `` opens, on the analogy of plan 29-28's B4. For a single document with one toggle, a second opening delimiter **closes** the first, so the fixture produced a well-formed document and the case failed on its own premise (`expected 62 to be greater than 62`). 29-28's B4 is reachable only because that parser bounds *blocks* separately.
- **Fix:** The case was narrowed to the shape that genuinely is parity-blind here — a properly CLOSED fence (even delimiter count) whose close lands past the boundary heading — with the even count asserted as its premise. The false arm was deleted rather than weakened.
- **Files modified:** `scripts/check-banned-claims.test.ts`
- **Verification:** the case now asserts `delimiters % 2 === 0`, `delimiters > 0`, the boundary heading flagged fenced, zero occurrences in the swallowed text, and the extent moving
- **Committed in:** `970209e`

**4. [Rule 2 - Missing Critical] The count-preserving compensating swallow (A1)**

- **Found during:** the mandated adversarial pass, after Task 3
- **Issue:** See the adversarial-pass section. Both published pins held while a section entered the safety exemption.
- **Fix:** A point-of-effect refusal on the region's last line being inside a fenced block, decided from the already-imported fence toggle.
- **Files modified:** `scripts/check-banned-claims.ts`, `scripts/check-banned-claims.test.ts`
- **Verification:** the compensating-edit case with both pins asserted to be EXACTLY on their numbers before the verdict, plus the closed-example GREEN control, plus the A1 pre/post reproduction on the same bytes
- **Committed in:** `970209e`

---

**Total deviations:** 4 auto-fixed (2 missing-critical closures, 1 bug in my own harness, 1 bug in my own fixture).
**Impact on plan:** Deviations 1 and 4 are the ones that matter — in both cases the plan's predicted fix closed the predicted hole and attacking the result found another of the same class one step sideways, which is now the fourth of five plans in this round where that has happened. Deviation 2 is another instance of the recorded harness-premise failure class: a scan that produced a confident wrong answer rather than an error, caught only because its result was checked against a source I already knew the answer for.

## Issues Encountered

- No auth gates, no package installs, no architectural decisions, no checkpoints (the plan declares `autonomous: true` and every task is `type="auto"`).
- `npm test` was never run: this repository's `test` script triggers the live claude-CLI e2e lane. Every suite run used `npx vitest run --exclude '**/scripts/e2e/**'`.

## Known Stubs

None. Every new assertion was seen failing against a build where the property does not hold: Task 1's four cases as assertion failures against the shipped build, Task 2's two discriminating cases against the shipped classifier, and Task 3's five cases against the pre-pin gate.

## Recorded Residuals (not closed, by name and with live counts)

| id | what | direction | live count |
|---|---|---|---|
| **V-29-32-01** | a count-preserving compensating edit paired with a **CLOSED** fence — a real `## ` section hidden inside a properly closed fenced example, matched by a deletion of the same number of neutral lines | fail-open, but requires a deliberate two-part edit whose deleted lines must also carry zero banned-claim occurrences | **0**; the live exemption document carries **0** fenced lines inside the region at all |
| V-29-26-01 | a setext boundary — the ATX-only authority cannot see `Heading` / `-------` | fail-open | **0** setext level-two underlines in the exemption document's body |
| V-29-26-04 | an indented boundary — the delimiter class and the heading test are both column-zero anchored | fail-closed | **0** indented fence delimiters against **4** column-zero ones in the exemption document |
| V-29-26-02 | the contract scan's module set is a non-recursive `scripts/` read | scope claim, not a verdict | reads **40 of 49** tracked non-test `.ts`; the nine unread are named in the case's failure message |
| — | a region legitimately ENDING on a fenced example's closing delimiter would trip the point-of-effect check | false-red | **0** live; the refusal names the one-blank-line remedy |

## Threat Flags

None. The plan's `<threat_model>` covers every surface touched. Every `high` row is dispositioned `mitigate` and landed: T-29-32-01 in `694d541`, T-29-32-02 in `a5062fa`, T-29-32-03, T-29-32-04 and T-29-32-05 in `970209e`. T-29-32-06 remains `accept` with its live counts re-measured above. `T-29-32-SC` (package installs) remains an empty input set — this plan installs nothing, per the zero-runtime-dependency constraint.

## Next Phase Readiness

- **LANG-07's "one authority" claim now extends to the authority's CONTRACT**, and it is a derived, counted, two-sided measurement rather than a sentence. A consumer landing tomorrow with an unguarded call reds `frontmatter.test.ts` on the day it lands.
- **A note for any later plan touching `unfencedHeadingIndex`:** adding a consumer moves TWO pins in two files — `CONTRACT_CONSUMERS`/`CONTRACT_SITE_COUNT` in `frontmatter.test.ts` and `LOCATOR_CONSUMERS` in `check-foundation-guards.test.ts`. They answer different questions and must not be merged; the distinction is written down in both places.
- **A note for any later plan touching `agent-factory/writing-profile.md`:** the exemption region's extent is now pinned at 62 lines. A deliberate edit to the disclaimer will red `guard_banned_claims`, and the correct response is to re-measure and say in the commit which lines entered or left the region — never to widen the pin until it stops firing.
- **Carried forward for the round's own record:** the harness-premise failure in Deviation 2. A comment-stripping scan whose *window* is measured in source lines is a scan that gets quieter the more carefully a guard is documented — a confident wrong answer, not an error, and the class this phase keeps re-encountering.

## Self-Check: PASSED

All four modified source files (and their committed `.js`) exist on disk. All three task commits (`694d541`, `a5062fa`, `970209e`) exist in git history.

---
*Phase: 29-controlled-language-voice-guard-rebuild*
*Completed: 2026-08-16*
</content>
</invoke>
