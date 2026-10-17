---
phase: 27-spawn-correctness-kit-set-authority
plan: 50
subsystem: frontmatter-authority
tags: [spawn-grant, refusal-wording, kit-model, harness-premise, recorded-decisions, kit-03, spawn-02, spawn-04, gap-closure-round-9]
status: complete
requires:
  - "scripts/frontmatter.ts — D-50's labelled leading run and D-44's one total classifier"
  - "scripts/kit-model.ts — 27-46's de-duplicated foreign arm and the extracted claim partition"
  - "scripts/generate-role-adapters.test.ts — 27-45's two sibling refusal cases"
provides:
  - "a leading-residue refusal that names the code point that made the run residue, carried out of the scan that already visits it"
  - "one statement of the markdown-extension fact, with the literal's occurrence count derived and asserted two-sided"
  - "a double-claim arm whose domain is the union of the schema and the claims, so a foreign double-claim is reportable"
  - "two source-slice/fixture premises asserted before inspection, each fired by a constructed input"
  - "two recorded decisions with their reasons in the phase's durable deferred-items artifact"
affects:
  - "scripts/check-foundation-guards.ts's kit-count failure message — richer, and proven byte-identical on the live tree"
  - "nothing else in production: the gate's full output and sha256 are unchanged end to end"
tech-stack:
  added: []
  patterns:
    - "a refusal names the offending byte; a diagnosis that points at a legal character is a defect even when the verdict is right"
    - "carry the fact out of the scan that already stands on it — a second walk for the same answer is a second opinion"
    - "make the impossible state unrepresentable at the type rather than merely untested"
    - "a negative assertion runs only after its slice's PREMISE is asserted; vacuity is the failure mode, not falsity"
    - "a fixture guarded by 'something changed' can silently start exercising a different code path"
    - "ask what a predicate's arm can EXPRESS, not only what it decides — a domain too narrow makes a real multiplicity unreportable"
    - "a decision recorded only in a summary is indistinguishable from an item that was forgotten"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/kit-model.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/generate-role-adapters.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "D-56 items 4 through 10 implemented in full. All eleven round-8 findings close in round 9; nothing is carried into a round 10 except what is recorded OPEN in deferred-items.md with its reason."
  - "WR-05's field is on the RESIDUE arm ALONE. The indentation arm keeps naming the line's first code point, because there the fault is positional and there is no code point outside the declared class to name. The type — not a comment — is what stops a defaulted copy appearing on the other arms."
  - "IN-02's domain is `[...schemaKeys, ...foreign]` rather than `new Set([...schemaKeys, ...claimedKeys])` as the review drafted. `foreign` is already de-duplicated and disjoint from the schema, so the domain is duplicate-free BY CONSTRUCTION and the stated order (schema order, then first-occurrence) survives — a Set would have thrown the order away."
  - "DEVIATION: `scripts/check-foundation-guards.test.ts`'s inline partition restatement had FROZEN at the pre-27-46 predicate and was still green. It is updated and its firing fixture widened, because a control that compares two different predicates and passes is worse than no control."
  - "The 27-43 acceptance criterion is RETIRED, recorded with a MEASURED reason (0 occurrences across a 15-term spawn/frontmatter/WR-05 vocabulary in the validator). `scripts/validate-agent-factory.ts` is deliberately untouched."
  - "SPAWN-03's live-platform capture stays DEFERRED to Phase 33 / GAP-D1 / CAP-01 as `UNKNOWN - verify`. No static gate was invented to stand in for it."
metrics:
  duration: ~95 min
  completed: 2026-08-09
actuals:
  tokens: 21958
  tasks: 3
  commits: 4
---

# Phase 27 Plan 50: The Refusal Names The Right Byte, And The Two Carried Decisions Are Recorded Summary

Closed the last five round-8 findings — **WR-05**, **IN-01**, **IN-02**, **IN-03**, **IN-04** — and
recorded the two dispositions the round-8 verification carried forward as open human decisions.
Eleven findings, four plans, one owner each; **none deferred to a round 10**.

## READ THIS FIRST

- **The module is NOT bypass-free.** The nested-block-scalar family **G/G2** is a LIVE silent-no-grant
  on this build, re-measured below against `b222de9` with its loader column and recorded **OPEN** in
  `deferred-items.md`. `27-50` neither opened nor closed it.
- **A green suite is a FLOOR here and nothing else.** It was green in every one of the nine rounds in
  which a defect was later found. Every claim below carries a transcript, a derived count or a fired
  planted defect.
- **The executor's red team found three things AFTER all three tasks were green**, including a
  **measured correction to the round-8 IN-04 finding's own stated mechanism**. All three are in
  `deferred-items.md`.

## Ownership reconciliation — the commits govern

The prompt's ownership table and this plan's own table agree, and both are confirmed against the
commits rather than assumed:

| Finding | Owner | Landed at | Confirmed how |
|---|---|---|---|
| CR-01 | `27-47` | `e658394..89705ba` | `git log` — 27-50 contains no CR-01 commit |
| CR-02, **WR-03** | `27-48` | `116df72..94bac76` (WR-03 at `208af47`) | reconciled in `27-49-SUMMARY.md`; nothing here touches it |
| WR-01, WR-02, **WR-04** | `27-49` | `4863f87..b222de9` | `git log b222de9` is this plan's base |
| **WR-05, IN-01, IN-02, IN-03, IN-04** | **this plan** | `fd8e63d`, `a5a0037`, `cc43edc` | below |
| the `27-43` acceptance criterion | **this plan** | `cc43edc` | RETIRED, recorded with a measured reason |
| SPAWN-03 live capture | **this plan** | `cc43edc` | DEFERRED to Phase 33 (GAP-D1 / CAP-01), recorded |

**Nothing was duplicated and nothing was dropped.** `git log b222de9..HEAD` contains no CR-01,
CR-02, WR-01, WR-02, WR-03 or WR-04 commit.

## Every finding, accounted for

| Finding | Disposition | Evidence |
|---|---|---|
| **WR-05** | **CLOSED** | RED/GREEN transcripts against the committed build; 98,596-cell derived corpus with 0 verdict moves and 7,536 reason moves, all and only the named shape |
| **IN-01** | **CLOSED** | derived literal count 3 → 1, asserted two-sided; both lister file sets byte-identical |
| **IN-02** | **CLOSED** | RED/GREEN transcripts; gate output and sha256 identical; 4 discriminating shapes + an order case |
| **IN-03** | **CLOSED** | premise asserted before inspection; fired by a constructed truncated slice AND by a planted source reformat |
| **IN-04** | **CLOSED** | fenced blocks removed with contents; premise asserted before writing, fired by three constructed inputs; both sibling diagnoses byte-identical |
| **`27-43` criterion** | **RETIRED, recorded** | validator vocabulary measured at **0** across 15 terms; validator untouched |
| **SPAWN-03 live capture** | **DEFERRED, recorded** | Phase 33 / GAP-D1 / CAP-01, read from `ROADMAP.md`; stays `UNKNOWN - verify` |

---

# WR-05 — the refusal names the code point that made the run residue

## The RED transcript, against the COMMITTED build on a `git archive HEAD` mirror

```
LEGAL-FIRST  ' ' + ZWSP + '---'   (opening)
   REFUSE … its leading residue renders no glyph of its own and begins with U+0020, so the
   delimiter does not begin where the line begins
```

`U+0020` is an ordinary space — inside `DELIMITER_WS_CHAR`, and **not why the line refused**. The
reader is sent to a legal character.

The controls, from the same mirror:

```
OFFENDER-FIRST ZWSP + '---'        -> begins with U+200B
INDENTATION  '  ---'               -> begins with U+0020
NBSP-first  NBSP + ZWSP + '---'    -> begins with U+00A0
TAB-first   '\t' + ZWSP + '---'    -> begins with U+0009      <-- also wrong
ASTRAL      ' ' + U+E0020 + '---'  -> begins with U+0020      <-- also wrong
TRAILING-ONLY '---' + ZWSP         -> the first code point after the payload, U+200B, …
INDENT-CLOSING '---' / '  ---'     -> …never closed by a `---` delimiter (not-a-delimiter)
```

## The GREEN transcript, against the rebuilt committed build

Only the four wrong rows moved; every control is byte-identical:

```
begins with U+0020  ->  U+200B     LEGAL-FIRST
begins with U+200B  ->  U+200B     OFFENDER-FIRST   (control, unchanged)
begins with U+0020  ->  U+0020     INDENTATION      (control, unchanged)
begins with U+0020  ->  U+200B     BOTH (composite)
begins with U+00A0  ->  U+00A0     NBSP-first       (control, unchanged)
begins with U+0009  ->  U+200B     TAB-first
begins with U+0020  ->  U+E0020    ASTRAL
```

## The fix, and why the shape is what it is

```ts
type LeadingRun =
  | { kind: "none"; length: 0 }
  | { kind: "indentation"; length: number }
  | { kind: "residue"; length: number; firstOutsideDeclared: number };
```

Set in the **same walk** that already stood on the offending code point and discarded it. The
boolean `allDeclared` it replaced held strictly less information — `firstOutsideDeclared < 0` **is**
"every code point was declared" — so there is one fact and not two, and no second scan.

**The field is unrepresentable on the other two arms**, which is the load-bearing half. An
`indentation` run has no code point outside the declared class and a `none` run has no code points
at all, so neither can carry a value a later reader could interpolate. The compiler enforces that,
not the comment. Asserted two-sided by a case:

```ts
expect(
  decl.split("firstOutsideDeclared").length - 1,
  "the offending code point is declared on exactly one arm of LeadingRun",
).toBe(1);
```

## Byte-unchanged everywhere else, PROVEN over a derived corpus

A corpus derived at run time — every affix of length 0..2 from a 12-member alphabet, on both sides of
both payloads, at both positions — run against the pre-`27-50` committed build and against the
rebuilt one, cell for cell:

```
cells                                     : 98596
cells whose VERDICT KIND moved (must be 0):     0
cells whose REASON TEXT moved             :  7536
moved cells that are NOT (a RESIDUE run whose FIRST code point is LEGAL) (must be 0): 0
cells of that shape that did NOT move (must be 0)                                   : 0
cells of that shape, total                                                          : 7536
moved cells differing ANYWHERE outside the leading-clause label (must be 0)          : 0
distinct leading-clause label transitions :
  ["U+0009 -> U+00A0","U+0009 -> U+00AD","U+0009 -> U+0301","U+0009 -> U+200B",
   "U+0009 -> U+2028","U+0009 -> U+2060","U+0009 -> U+E0020","U+0009 -> U+FEFF",
   "U+0020 -> U+00A0","U+0020 -> U+00AD","U+0020 -> U+0301","U+0020 -> U+200B",
   "U+0020 -> U+2028","U+0020 -> U+2060","U+0020 -> U+E0020","U+0020 -> U+FEFF"]
```

**Both directions are closed.** Every moved cell is the residue-run-with-a-legal-first-code-point
shape, and every cell of that shape moved. Every transition is FROM a declared-class code point TO a
non-declared one. No moved cell differs anywhere outside the label.

## And the invariant asserted over the whole corpus, not over the rows the fix was written for

```
cells carrying a leading clause, RESIDUE run    : 50868
  naming anything but the first outside code point (must be 0): 0
cells carrying a leading clause, INDENTATION run:  1570
  the labels they name: ["U+0009","U+0020"]
```

The 1,570 indentation cells are a **residual, recorded in `deferred-items.md` as R1** — see the red
team section.

## The clause's words are unchanged and are now TRUE

"Its leading **residue** … begins with X". The residue is the part of the run outside the declared
class, and that begins at the first code point outside it. Under the old interpolation the sentence
was false about a mixed run; under this one it is true about every residue run, and byte-identical
wherever the first code point is itself the offender.

## One shipped case's expectation MOVED, and that move is the finding

`D-50 KIT-03 boundary` carried `{ label: "indentation then residue", line: " <ZWSP>---", names: "U+0020" }`
— a shipped case pinning the defect as expected behaviour. It now reads `"U+200B"`.

## The foundation gate's full output, before and after

```
2e79d7749749421265f97efdfd7cfec209e8f5987e9f2a46722f3ed109a91d69  gate-before.txt
2e79d7749749421265f97efdfd7cfec209e8f5987e9f2a46722f3ed109a91d69  gate-after
```

88 lines, `diff` empty, exit 0 both runs.

---

# IN-03 — the purity slice states what it is before it is inspected

## The premise, stated ONCE and consulted twice

```ts
const assertSliceIsBalanceBody = (body: string, where: string): void => {
  expect(body, `${where}: PREMISE — the slice must contain the count identity this function exists to hold`)
    .toContain("GRANT_OCCURRENCE_KINDS.reduce");
  expect(body, `${where}: PREMISE — the slice must contain the refusal arm`)
    .toContain("balanced: false");
  expect(body.split("\n").length, `${where}: PREMISE — the slice must be a whole function body, not a truncation`)
    .toBeGreaterThan(10);
};
```

Both expressions are **read off `checkGrantOccurrenceBalance`**, not remembered: the reduce over
`GRANT_OCCURRENCE_KINDS` is the count identity the whole extraction exists to hold in one place, and
`balanced: false` is its refusal arm. A shared helper, so the proof case cannot prove something about
a copy.

## Proven load-bearing TWO ways

**In suite**, by a constructed truncated slice: every forbidden-substring assertion passes over it
(the vacuity), and the premise throws `/PREMISE/`. The real body then passes the premise, so it is a
discriminator and not a blanket refusal.

**Out of suite**, by the reformat IN-03 actually names — an object literal broken so a `}` reaches
column 0 inside the function:

```
× the extracted check is PURE BY CONSTRUCTION …
AssertionError: the purity slice: PREMISE — the slice must contain the count identity this
                function exists to hold: expected 'export function checkGrantOccurrenceB…'
                to contain 'GRANT_OCCURRENCE_KINDS.reduce'
```

And the same reformat against the **pre-`27-50`** case, measured:

```
truncated slice line count: 5
every PRE-27-50 forbidden-substring assertion over it:
  readFileSync=true readdirSync=true existsSync=true execFileSync=true process.=true derive(=true
=> the PRE-27-50 case is GREEN over four lines of a function it never inspected.
```

Plant reverted; tree verified clean.

---

# IN-01 — the markdown fact has one statement

## The derived count, with the expression that derived it

```
node -e 'const code = src.split("\n").filter(l => !l.trimStart().startsWith("//")).join("\n");
         code.split("\".md\"").length - 1'
```

| | occurrences of the exact literal `".md"` in comment-filtered code |
|---|---|
| **before** | **3** — `const MARKDOWN_EXT = ".md";`, `listRoles`, `listAgentAdapters` |
| **after** | **1** — the declaration alone |

**What the count enumerates, stated so the number is checkable:** the exact four-character token
`".md"` — quote, dot, m, d, quote. `"SKILL.md"`, `".frontmatter.md"`, `".template.md"` and the
workflow regex `/^\d{2}-.+\.md$/` are deliberately OUTSIDE the set: they are different facts, and
folding them in would be one statement of four facts, the mirror image of the defect.

**Two-sided, and both sides fired.** Planted probes:

| plant | result |
|---|---|
| re-spell `".md"` at one site | `expected 2 to be 1` |
| rename the declaration away (aliased) | `expected '…' to contain 'const MARKDOWN_EXT = ".md";'` |

A one-sided `toBeLessThan(2)` would have gone green precisely when the anti-drift device was gone.

## The comment's claim is corrected AND asserted

It claimed **two** rules turn on the constant while **three** sites spelled the fact. The corrected
comment enumerates all three, and the case asserts each site reaches the constant:

```
f.endsWith(MARKDOWN_EXT) && !f.startsWith        (listRoles)
rel.endsWith(MARKDOWN_EXT)                       (listAgentAdapters)
probe.files.filter((f) => f.endsWith(MARKDOWN_EXT))   (the exempt-directory probe)
```

## Both lister file sets, before and after

```
listRoles          count=17
  ["agents-md-scribe.md","architect-design.md","ba-pm.md","brownfield-mapper.md",
   "compliance-officer.md","factory-coach.md","frontend-ui.md","greenfield-mapper.md",
   "incident-responder.md","installer.md","orchestrator.md","qe-e2e.md","release-manager.md",
   "security-nfr.md","software-engineer.md","system-analyst.md","uat-planner.md"]
listAgentAdapters  count=17
  ["grugops-agents-md-scribe.md", … , "grugops-uat-planner.md"]
```

**`diff` between the pre-build and post-build transcripts shows no change on either lister line.**

---

# IN-02 — a double-claimed foreign key a human can act on

## The RED transcript, against the committed build

```
R1 foreign key claimed by TWO buckets (the IN-02 shape)
   in  [["agents"],["themes"],["themes"],[]]
   out {"unclaimed":["agents"],"doubleClaimed":[],"foreign":["themes"]}
```

`themes` **is** claimed by two buckets. The arm filtered over `schemaKeys`, so it could only ever
name a SCHEMA key claimed twice — the multiplicity was **unreportable**, not reported once.

## The GREEN transcript, against the rebuilt build

```
R1 foreign key claimed by TWO buckets    -> {"unclaimed":["agents"],"doubleClaimed":["themes"],"foreign":["themes"]}
R2 SCHEMA key claimed by TWO buckets     -> {"unclaimed":[],"doubleClaimed":["agents"],"foreign":[]}          (UNCHANGED)
R3 foreign key claimed ONCE              -> {"unclaimed":["agents"],"doubleClaimed":[],"foreign":["themes"]}   (UNCHANGED)
R4 foreign key claimed by THREE buckets  -> {"unclaimed":["agents"],"doubleClaimed":["themes"],"foreign":["themes"]}
R5 ORDER, non-alphabetical, one doubled  -> doubleClaimed ["zeta","alpha"]  foreign ["zeta","alpha","mid"]
R6 unclaimed schema key + doubled foreign-> {"unclaimed":["agents","hooks"],"doubleClaimed":["themes"],"foreign":["themes"]}
```

**The precision edge holds:** R2 and R3 are byte-identical before and after. Widening the domain
neither double-reports the case the arm already handled nor promotes a single claim.

## The implementation, and the ONE deviation from the review's draft

```ts
const foreign = claimedKeys.filter(
  (k, i) => !schemaKeys.includes(k) && claimedKeys.indexOf(k) === i,
);
const claimedTwice = (k: string): boolean =>
  claimedKeys.filter((c) => c === k).length > 1;
return {
  unclaimed: schemaKeys.filter((k) => !claimedKeys.includes(k)),
  doubleClaimed: [...schemaKeys, ...foreign].filter(claimedTwice),
  foreign,
};
```

The review drafted `new Set([...schemaKeys, ...claimedKeys])`. **`[...schemaKeys, ...foreign]` was
used instead**, and the reason is measured rather than stylistic: `foreign` is already
de-duplicated and disjoint from `schemaKeys` **by construction**, so the domain is duplicate-free
without a Set — and a Set would have thrown away the stated order the guard's failure message is
read in. `claimedTwice` is stated once and applied to one domain: the arm did not gain a second
predicate, it gained the rest of its subject.

## The order, over a deliberately non-alphabetical input

```
schema  ["zulu","alpha"]   forbidden ["zeta","alpha","zulu"]
covered ["zeta","mid","alpha"]   exempt ["zulu"]
doubleClaimed  ["zulu","alpha","zeta"]   (schema order, then first-occurrence — NOT sorted)
foreign        ["zeta","mid"]            (first-occurrence — NOT sorted)
```

Both asserted `not.toEqual([...arm].sort())`, and two calls compared for byte-identical arrays.

## Behaviour-preserving on the live tree, proven rather than argued

```
2e79d7749749421265f97efdfd7cfec209e8f5987e9f2a46722f3ed109a91d69  gate-before.txt
2e79d7749749421265f97efdfd7cfec209e8f5987e9f2a46722f3ed109a91d69  gate-after-t2.txt
```

`diff` empty across all 88 lines, including the `kit counts:` PASS line, exit 0 both runs.

## Two shipped expectations MOVED, and both were pins of the blind spot

| case | before | after |
|---|---|---|
| `a foreign key claimed by TWO buckets is reported ONCE by the foreign arm` | `doubleClaimed: []` | `doubleClaimed: ["themes"]` |
| `BOTH arms report each key AT MOST ONCE … (adjacency edge)` | `doubleClaimed: ["agents"]` | `["agents","themes"]` |
| `the VERDICT is invariant under permutation … (ordering edge)` | `doubleClaimed: ["mcpServers"]` | `["mcpServers","themes"]` |

The first is the one the review named: added by the very plan that closed the foreign arm's
duplication, it recorded the arm's **inexpressibility** as the expected answer. **An assertion that
pins what a predicate CANNOT say is not a pin, it is a lock.**

## Planted probe — the widening is load-bearing

Narrowing `doubleClaimed` back to `schemaKeys.filter(claimedTwice)` fires **five** cases:

```
× a foreign key claimed by TWO buckets … — and ONCE by the double-claim arm (27-50, IN-02)
× IN-02 discriminators — schema-and-doubled, foreign-and-doubled, foreign-and-single …
× IN-02 — the widened double-claim arm's ORDER is schema-order then first-occurrence …
× BOTH arms report each key AT MOST ONCE … (adjacency edge)
× the VERDICT is invariant under permutation of each input list (ordering edge)
AssertionError: a FOREIGN key claimed by two buckets — the shape IN-02 named — doubleClaimed:
                expected [] to deeply equal [ 'themes' ]
AssertionError: expected [ 'zulu', 'alpha' ] to deeply equal [ 'zulu', 'alpha', 'zeta' ]
```

---

# IN-04 — the fixture's premise is checked

## The fixture, and the rule it applies

`stripFencedBlockLines` toggles on `/^```/`, never emits the delimiter line, and drops every line
while the toggle is set — the same rule `stripFencedBlocks` applies in `scripts/frontmatter.ts`.
Deliberately **not** an import of the production stripper: a fixture built by calling the code under
test's neighbour makes the input a function of the code the suite is about.

**Derived removal counts, on the live fixture:**

```
fixture removal: lines 7, blocks 1, inFence-at-EOF false
```

`linesRemoved = lines.length - kept.length`, `blocksRemoved` counted on each opening toggle.

## The premise, asserted BEFORE the file is written

```ts
expect(strip.blocksRemoved, "PREMISE — the fixture must really have carried a fenced block").toBeGreaterThan(0);
expect(strip.unterminatedFence, "PREMISE — the fences must be balanced, or the strip swallowed the file's tail").toBe(false);
expect(survivors, "PREMISE — no delimiter line may survive after line 0, or the region does not run to
                   EOF and this case is pinning a different refusal").toEqual([]);
```

**Fired by three constructed inputs, each throwing its own message:**

| constructed input | result |
|---|---|
| a column-0 `---` inside a fenced example | `/no delimiter line may survive after line 0/` |
| an unbalanced fence (`["---","name: x","```","body","more"]`) | `/fences must be balanced/` |
| a file with no fence at all | `/must really have carried a fenced block/` |

…and **non-vacuous**: the shape the case actually builds passes it.

## Determinism, and both sibling diagnoses before and after

```ts
expect(stripFencedBlockLines(lines).kept.join("\n")).toBe(strip.kept.join("\n"));
```

Captured out of suite against the committed generator, BEFORE and AFTER the fixture change:

```
CASE 1 — unterminated-region fixture       exit 1
  qe-e2e.md: frontmatter is unreadable — frontmatter block opened at line 1 of the document and
  is never closed by a `---` delimiter — an unterminated block is unreadable, NOT an absence of keys

CASE 2 — fence-refusal sibling             exit 1
  qe-e2e.md: frontmatter is unreadable — the frontmatter block opened at line 1 of the document
  carries the code-fence delimiter line ````` at line 11, before any closing `---` delimiter — …
```

**Byte-identical in both runs.** Case 1 provably still exercises the **unterminated** refusal; case 2
provably still exercises the **fence** refusal. Case 1 now asserts
`not.toContain("carries the code-fence delimiter line")`, so drift onto the sibling's refusal fails
here rather than passing on the shared `is unreadable` prefix.

---

# The two recorded decisions

Both are written into `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md`
(append-only: **151 insertions, 0 deletions**; every prior entry preserved, 11 sections → 13).

## DECISION 1 — the `27-43` acceptance criterion is RETIRED

Quoted verbatim in the record, from `27-VERIFICATION.md:73`:

> "`scripts/validate-agent-factory.ts` goes from exit 0 to a named non-zero failure on the
> non-coordinator adapter surface"

**REASON, PART ONE — MEASURED AT EXECUTION TIME.** The command is recorded in the artifact itself:

```
node -e 'const code = src.split("\n").filter(l => !l.trimStart().startsWith("//")).join("\n");
         for (const t of [15 terms]) console.log((code.split(t).length-1) + "  " + t);'
```

| term | occurrences |
|---|---|
| `spawn` / `Spawn` / `SPAWN` | 0 / 0 / 0 |
| `Agent(` | 0 |
| `frontmatter` / `Frontmatter` / `parseFrontmatter` | 0 / 0 / 0 |
| `hasSpawnGrant` / `grantedAgentNames` | 0 / 0 |
| `keysHaveSpawnGrant` / `keysGrantedAgentNames` | 0 / 0 |
| `WR-05` / `wr05` / `guard_wr05` | 0 / 0 / 0 |
| `coordinator` | 0 |
| **TOTAL over the 15-term vocabulary** | **0** |

406 lines of code of 584. Its **only** in-repo import is `./kit-model.js` — it does not import
`./frontmatter.js` at all, so it has no way to read a document's frontmatter, let alone adjudicate a
grant in one.

**REASON, PART TWO.** Satisfying the criterion means adding a spawn-grant predicate to a SECOND
file, necessarily weaker than `guard_wr05`'s over the derived 33-member scan. A weaker duplicate that
still votes is what this module's own record calls "worse than none" at four sites.

**`scripts/validate-agent-factory.ts` is UNMODIFIED** — absent from `files_modified`, and
`git diff --name-only b222de9..HEAD` does not list it or its compiled twin.

**What is NOT retired:** the foundation gate's half stands and is exercised every round.

## DECISION 2 — SPAWN-03's live capture stays DEFERRED to Phase 33

Quoted verbatim in the record from `27-VERIFICATION.md:70-72` (test, expected and why_human).

**Owner, read from `ROADMAP.md` rather than from memory:**

| field | value | where |
|---|---|---|
| owning phase | **Phase 33: Live Capture & Windows Portability** | `ROADMAP.md:431` |
| standing obligation | **GAP-D1** — "one captured live dual-path run → flip A3/DOG-02 + the coupled `examples/03-ticket-to-pr.md` edit" | `ROADMAP.md:106` |
| requirement id | **CAP-01** (discharge); the capture itself is **CAP-03** | `ROADMAP.md:435` |

**Status stays `UNKNOWN - verify`.** No static gate was invented. `CLAUDE.md` forbids it by name
("never fake a passing gate, a test result, or a citation — the trace is the proof"), and Phase 33's
own success criterion states **"a loud skip is never accepted as the capture."**

---

# The executor's adversarial red team

Mandatory. Run against the REBUILT committed build after all three tasks were green.

## Planted-defect probes — all fired

| probe | plant | result |
|---|---|---|
| 1 | revert the WR-05 interpolation to `line.codePointAt(0)` | `expected '…' to contain 'begins with U+200B'` |
| 2 | default `firstOutsideDeclared?` onto the INDENTATION arm | the two-sided arm count fires |
| 3 | reformat so `indexOf("\n}")` truncates the purity slice | `PREMISE — the slice must contain the count identity…` |
| 3b | the same reformat against the PRE-`27-50` case | **passes vacuously over 5 lines** — the defect, measured |
| 4 | narrow `doubleClaimed` back to the schema alone | **five** cases fire, each naming its key |
| 5 | re-spell `".md"` at one site | `expected 2 to be 1` |
| 5b | rename the constant's declaration away | `to contain 'const MARKDOWN_EXT = ".md";'` |
| 6 | narrow the guard control's inline restatement back | the byte-faithful control fires on the diverging message |
| 6b | …with the PRE-`27-50` fixture (one `scratchForeign`) | **PASSES over a genuine divergence** — the vacuity |

Every plant was reverted and `git status --porcelain` verified clean.

## Family G/G2, RE-MEASURED on this build — STILL OPEN

```
                                pre-27-50 (b222de9)          post-27-50
G  nested folded block scalar   {"ok":true,"value":false}    {"ok":true,"value":false}   <-- STILL OPEN
G2 block scalar as a seq item   {"ok":true,"value":false}    {"ok":true,"value":false}   <-- STILL OPEN
names on both, both builds      []                           []

loader (/usr/bin/ruby -ryaml, RUBY=2.6.10 PSYCH=3.1.0 LIBYAML=0.2.1):
ACCEPT  G  => {"name"=>"x", "tools"=>{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}}
ACCEPT  G2 => {"name"=>"x", "tools"=>["Read, # x, Agent(grugops-orchestrator)"]}
```

Byte-identical on both builds. **`27-50` neither opened nor closed it.** The WR-05 fix is orthogonal:
it changes which code point a REFUSAL names, and family G/G2 is a document that never refuses at all.

## What the red team FOUND — three findings, all recorded in `deferred-items.md`

### R1 — the leading clause calls an INDENTATION run "residue"

1,570 of 98,596 corpus cells. At the OPENING position an indented `---` still refuses with *"its
leading **residue** … begins with U+0020"*, and U+0020 is inside the declared class.

**Not a WR-05 recurrence, and the distinction is why it is recorded rather than fixed.** On the
indentation arm the fault is POSITIONAL and the code point named is exactly the byte to delete — the
diagnosis is actionable and points at the right character. What is wrong is the **noun**: D-50
declares three run kinds and this clause applies "residue" to a run the module labels `indentation`.
Splitting the clause changes a shipped refusal's wording, which would have destroyed this plan's own
"7,536 reasons moved and every one is the residue shape" proof. Recorded with a suggested direction.

### R2 — a MEASURED CORRECTION to the round-8 IN-04 finding's stated mechanism

The review said the fixture would *"silently start pinning a different refusal … while staying
green"* on a column-0 `---` **or** a column-0 key line. Measured out of suite, planting each shape
inside `qe-e2e.md`'s fenced example and running BOTH fixtures:

| plant | OLD fixture (delimiters only) | NEW fixture |
|---|---|---|
| `---` | **RED, LOUDLY** — the region closes early, diagnosis becomes `cannot read \`Break the feature — …\``; the case's `is never closed by a \`---\` delimiter` needle FAILS | unterminated diagnosis, green |
| `...` | **RED, LOUDLY** — same | unterminated diagnosis, green |
| `tools: Read, Agent(grugops-orchestrator)` | **GREEN, SILENTLY** — same diagnosis, and the case passes over a role file whose frontmatter region now carries a **live spawn grant** it never looks at | removed with the block, green |
| `capabilities: read` | **GREEN, SILENTLY** — same | removed with the block, green |

**The finding's substance holds; its stated mechanism does not.** The delimiter shapes fail LOUDLY.
The genuinely silent shape is a column-0 **key line**, and its worst form is the one measured: the
fixture would have written a live `Agent(grugops-orchestrator)` into a non-coordinator role file's
frontmatter region, inside a suite that exists to detect exactly that, with every assertion green.
The executor's measurement governs, and the correction is recorded rather than repeated.

### R3 — the red team's OWN oracle was defeated by not modelling its input

The first corpus-wide WR-05 invariant reported **1,727 violations**, every one a BOM-leading line.
They were not violations: `parseFrontmatter` strips ONE leading BOM at document position 0
(`frontmatter.ts:2229`), so at the OPENING position the classifier is handed a line the corpus row
does not literally contain. The probe computed its expectation from the RAW row.

**This is `27-47`'s own standing question — "ask what the predicate's INPUT is ASSEMBLED from" —
landing on the red team's oracle instead of on the module**, one round after it was written down. It
was a false RED and could as easily have been a false GREEN; it was caught only because the answer
was implausible.

---

# Prohibition compliance

| prohibition | evidence |
|---|---|
| **NO SECOND OR WEAKER SPAWN-GRANT PREDICATE** | `scripts/validate-agent-factory.ts` and its `.js` twin are absent from `git diff --name-only b222de9..HEAD`. Its spawn/frontmatter/WR-05 vocabulary is measured at **0/15 terms**, recorded with the command. No spawn-grant predicate was added anywhere. |
| **A DEFERRAL IS NEVER A SILENT DROP** | Both records are in `deferred-items.md` with what was decided, why, what was measured, the date and the owner; both are quoted in full above. SPAWN-03 stays `UNKNOWN - verify`. |
| **A REFUSAL NAMES THE OFFENDING BYTE** | The legal-first-character case asserts `begins with U+200B` and `not.toContain("begins with U+0020")`, quoted from both builds. The corpus-wide invariant reports 0 residue cells naming anything else. The indentation residual is measured and recorded as R1 rather than glossed. |
| **AN ASSERTION THAT CAN PASS VACUOUSLY IS A DEFECT** | The purity premise is quoted, and a constructed short slice AND a planted source reformat each fire it; the PRE-`27-50` case is shown green over 5 lines of the same reformat. |
| **A FIXTURE'S PREMISE IS CHECKED, NEVER ASSUMED** | Three constructed inputs fire the three premise clauses; both sibling diagnoses are quoted before and after and are byte-identical; the summary states which refusal each case provably serves. |
| **NO HAND-MAINTAINED SET LITERAL; COUNTS DERIVED AND TWO-SIDED** | The markdown count is `code.split('".md"').length - 1`, asserted `toBe(1)` with both sides fired (probes 5 and 5b). The fixture's removal counts are `lines.length - kept.length` and a toggle count. The 98,596-cell corpus is a run-time cross-product; its cell count is printed, never written down. |
| **A GREEN SUITE IS NEVER OFFERED AS EVIDENCE** | Every claim carries a RED/GREEN transcript, a derived count, an output hash comparison or a fired planted defect. The suite result is stated as a FLOOR, and family G/G2 is stated OPEN. |
| **NO NEW DEV DEPENDENCY** | `git diff --stat -- package.json package-lock.json` is **empty**. |
| Prototype pollution / path traversal | canon; referral only, no assertion authored. |

---

# Deviations from Plan

### 1. [Rule 2 — Correctness, and the largest one] The byte-faithful control's inline restatement had FROZEN at the pre-`27-46` predicate, and was still green

- **Found during:** Task 2, checking who else consumes `doubleClaimed`.
- **Issue:** `scripts/check-foundation-guards.test.ts`'s "INDEPENDENT restatement" — the control
  whose entire purpose is to detect the extracted predicate diverging from an independent statement
  of it — still spelled `foreign` **without** the de-duplication `27-46` added, and
  `doubleClaimed` over the schema alone. **Two arms had moved out from under it and it stayed
  green**, because its only fixture plants each foreign key exactly once, so no input it drives can
  produce a foreign double-claim.
- **Fix:** the restatement now states today's predicate, still in its own idiom
  (`indexOf`/`reduce`/`concat`), and `fireAllThreeArms` appends `scratchForeign` **twice** so the
  widened arm is actually compared. The guard's failure line becomes
  `claimed by more than one [hooks, scratchForeign]`.
- **Proven load-bearing, both directions:** narrowing the restatement back fires the control
  (`expected 'claimed by more than one [hooks, scratchForeign]' … got '[hooks]'`); the same narrowing
  with the PRE-`27-50` one-occurrence fixture **PASSES over that genuine divergence**.
- **Out of `files_modified`, deliberately.** A control comparing two different predicates and passing
  is worse than no control — this module's own standing argument about weaker duplicates, applied to
  the harness. Recorded here rather than silently absorbed. **Commit:** `a5a0037`.

### 2. [Rule 1 — Correctness] IN-02's domain is `[...schemaKeys, ...foreign]`, not the review's `new Set([...schemaKeys, ...claimedKeys])`

The review's draft is correct about membership and wrong about order: a `Set` discards the stated
order the guard's message is read in. `foreign` is already de-duplicated and disjoint from
`schemaKeys` by construction, so the concatenation is duplicate-free without one. Measured on R5:
`doubleClaimed ["zeta","alpha"]` — first-occurrence, not sorted.

### 3. [Rule 2 — Correctness] WR-05's interpolation is a two-arm expression, not an unconditional swap

The plan says "interpolate the carried code point instead of the line's first code point". Taken
literally on both arms this cannot compile — the field does not exist on the indentation arm, which
is the point. The indentation arm keeps `line.codePointAt(0)`, and the site states why: there the
fault is positional and there is no code point outside the declared class to name. The residual noun
imprecision this leaves is measured and recorded as R1.

### 4. [Measured correction to a review claim] IN-04's silent-drift mechanism is a KEY line, not a delimiter

Full write-up in the red-team section and in `deferred-items.md` R2. A delimiter plant makes the old
fixture fail loudly; the silent shape is a column-0 key line, whose worst form plants a live spawn
grant. The finding's substance holds; its stated mechanism does not.

### 5. [Executor's own oracle] The corpus-wide invariant's first run was a false RED

`deferred-items.md` R3. 1,727 apparent violations, all explained by the document-level BOM strip the
probe did not model.

---

# Verification

| gate | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **35 files, 1266 passed, 2 skipped, 0 failed** (baseline 1259) — stated as a FLOOR, explicitly NOT evidence that no bypass remains (family G/G2 does) |
| `npm run typecheck` | exit 0 |
| `npm run build && npm run freshness` | exit 0 — "All build outputs fresh: 32 committed .js file(s) match a fresh tsc rebuild." |
| `node scripts/check-foundation-guards.js` | exit 0, and its full 88-line output + sha256 **byte-identical to the pre-plan baseline** |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `node scripts/adapters-freshness.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 (file itself unmodified) |
| `git diff --stat -- package.json package-lock.json` | empty |
| `git status --porcelain` | clean; every mirror and probe lived outside the working tree |
| `deferred-items.md` | append-only across both commits: **151 + 78 insertions, 0 deletions** |

The live e2e lane was deliberately NOT run (it spends tokens against the real Claude CLI and can
hang); its exclusion is stated rather than implied.

# Known Stubs

None. No hardcoded empty value, placeholder or unwired surface was introduced.

# Threat Flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema change.
The register's `mitigate` rows each have their evidence above — T-27-09-20 (the residue refusal,
RED/GREEN plus the 98,596-cell corpus and the corpus-wide invariant), T-27-09-21 (the markdown fact,
derived count two-sided and both sides fired), T-27-09-22 (the unreportable double-claim, RED/GREEN
plus identical gate output and hash), T-27-09-23 (the vacuous slice, premise fired by a constructed
slice and by a planted reformat), T-27-09-24 (the assumed fixture, premise fired by three
constructed inputs and both sibling diagnoses compared), T-27-09-25 (the second spawn-grant
predicate, validator measured at 0/15 terms and untouched), T-27-09-26 (the fabricated live claim,
SPAWN-03 recorded deferred and still `UNKNOWN - verify`). T-27-09-SC's mitigation is ASSERTED
ABSENCE and is confirmed by the empty `package.json` / `package-lock.json` diff — recorded so an
empty package audit is not read as a skipped one.

# What the next round must own

1. **The OPEN family G/G2 bypass**, re-measured on this build with its loader column.
   `BLOCK_INDICATOR` is still applied at exactly one of the places YAML allows a block-scalar header.
   Close it, then add the nested-block-scalar header to `AXIS_KEY_LINE` **in the same plan**.
2. **R1 — the indentation arm's noun**, with the suggested split and the requirement to re-take the
   corpus comparison stating the changed-reason count for BOTH shapes.
3. **R3's lesson, applied to every future corpus oracle** — drive the expectation through the same
   normalization chain the parser applies, derived from source rather than remembered.
4. **The WR-04 residual**, the eleven value-map cells and the flattener-nesting scope question, all
   still carried from `27-47`, `27-48` and `27-49`: settle once, not three times from three symptoms.
5. **The standing question this round adds.** The last six rounds asked what a predicate's conditions
   come from, what set it enumerates, what its application set is, what its input is assembled from,
   which of two expressions the consumers read, and — from `27-49` — what set a case title's EVIDENCE
   enumerates. This one asks it of an ARM'S DOMAIN and of a CONTROL'S FIXTURE: **ask what a
   predicate's arm can EXPRESS, not only what it decides — and then ask whether the control that
   compares two formulations of it has a fixture capable of telling them apart.** IN-02 was an arm
   that decided correctly over a domain too small to contain its subject, and the byte-faithful
   control agreed with a predicate it no longer stated, for two rounds, because its fixture could not
   reach the disagreement. A control is not a defence against divergence. It only moves the question
   to its fixture.

# A discrepancy this plan surfaces rather than propagates — REQUIREMENTS.md over-claims

`requirements.mark-complete` was **deliberately NOT run** for this plan's `requirements:
[KIT-03, SPAWN-02, SPAWN-04]`, and the reason is a discrepancy a later reader must see:

| requirement | `REQUIREMENTS.md` today | `27-VERIFICATION.md` (round 8) |
|---|---|---|
| **KIT-03** | `- [x]` / traceability **Complete** | criterion 2 **✗ FAILED** — "soundness undermined": the oracle computes its closure through the same parser the round-8 review proves is not total |
| **SPAWN-04** | `- [x]` / traceability **Complete** | criterion 4 **✗ FAILED** — a live `Agent(grugops-orchestrator)` reaches the gate at exit 0 on a non-coordinator surface |
| **SPAWN-02** | `- [ ]` / traceability **Gaps Found** | criterion 3 **✓ VERIFIED** (`adapters-freshness` fail-closed, live-tested) |

**KIT-03 and SPAWN-04 are marked complete while the phase's own verification records them failed,
and family G/G2 is still a live silent-no-grant on this build.** That over-claim is PRE-EXISTING —
it was not set by this plan — and marking anything complete here would have compounded it. Nothing
in `27-50` closes either criterion: this plan fixed a refusal's wording, a constant's call sites, an
arm's domain and two harness premises, and it explicitly did not decide whether any document grants.

Correcting the three rows is a **verification-record decision**, not an executor's call, and it is
surfaced here plus as a `STATE.md` blocker rather than settled mid-plan.

# Self-Check: PASSED

```
FOUND: scripts/frontmatter.ts
FOUND: scripts/frontmatter.js
FOUND: scripts/frontmatter.test.ts
FOUND: scripts/kit-model.ts
FOUND: scripts/kit-model.js
FOUND: scripts/kit-model.test.ts
FOUND: scripts/check-foundation-guards.test.ts
FOUND: scripts/generate-role-adapters.test.ts
FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
FOUND: fd8e63d  fix(27-50): the leading-residue refusal names the offending byte, and the purity slice states what it is (WR-05, IN-03)
FOUND: a5a0037  fix(27-50): one statement of the markdown fact, and a double-claimed foreign key a human can act on (IN-01, IN-02)
FOUND: cc43edc  test(27-50): the fixture's premise is checked, and the two carried decisions are recorded (IN-04, D-56 items 9 and 10)
FOUND: f477904  docs(27-50): three red-team findings recorded, including a measured correction to the IN-04 finding
ABSENT (as required): scripts/validate-agent-factory.ts in git diff --name-only b222de9..HEAD
```
