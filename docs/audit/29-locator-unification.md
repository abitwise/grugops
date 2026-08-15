# The section-locator unification, as a transcript

Phase 29's gap-closure round 2 deleted five private "where does this section start, and where does it
end" predicates and replaced them with one authority. This file is the record of that, and of what
happened when the round's own claims were attacked.

**It is a transcript of measurements, not a summary of intentions.** Every number below was produced
by a command run in the session that wrote the line beside it. Every command is re-runnable against
the committed build. **Nothing here is inferred**, and where a measurement produced a different
answer from the one a plan predicted, the measured answer is what is written down.

## Method

| what | how |
|---|---|
| the predicates that existed | read at the file and line the round-2 code review (`29-REVIEW.md` § WR-08) names, at the tree as it stood before plan 29-20 |
| the authority that replaced them | read from `scripts/frontmatter.ts` on the working tree |
| the owner and consumer lists | taken from plan 29-25's derived scans in `scripts/check-foundation-guards.test.ts`, **not** re-derived here with a second scan |
| the oracle's axes and cell count | read from `scripts/section-locator-oracle.test.ts`, whose own case asserts the count twice by different means |
| the reproductions | run from the recipes in `29-REVIEW.md`, against the committed `.js` — never from a plan's restatement of them |
| the adversarial variants | invented at execution against the committed `.js`; none is copied from any plan or review |
| live-corpus reachability | walked through `listRoles()` and `safetySurfaceUnion()` read via `import()`, never a directory listing retyped |

## 1. The five predicates that existed

As identified by the round-2 code review's WR-08 table, plus the fifth that no round-1 or round-2
document enumerated and that plan 29-25's tree-wide scan found.

| # | module | heading equality | section close | found by |
|---|---|---|---|---|
| 1 | `scripts/voice-model.ts:74`, `:102` | `/^## Caveman prompt$/`, anchored, no trailing tolerance | `/^## /`, **fence-blind** | 29-REVIEW WR-08 |
| 2 | `scripts/check-diff-disposition.ts:532`, `:535` | `lines[i].trimEnd() !== heading` | `startsWith("## ")`, fence-aware | 29-REVIEW WR-08 |
| 3 | `scripts/check-banned-claims.ts:448`, `:498` | `lines[i] === heading`, exact | `/^## /`, fence-aware | 29-REVIEW WR-08 |
| 4 | `scripts/check-imperative-lexicon.ts:478`, `:488`, `:627` | `lines[i] === heading` / `/^## Steps\s*$/` | `/^#{1,2} /` | 29-REVIEW WR-08 |
| 5 | `scripts/check-diff-disposition.ts:1206` (`readDispositionRows`) | `body.indexOf(DISPOSITION_HEADING)`, a substring search | none — the scan ran to EOF | plan 29-22, by derivation |
| 6 | `scripts/audit-model.ts` (`tableUnder`) | `lines.findIndex((l) => l.trim() === heading)` | `startsWith("## ")`, fence-blind | plan 29-25, by tree-wide scan |

Predicate 5 is the one that matters most about method. The review named four; a derivation over the
module's own source found a fifth, because the review's two-construct sketch describes a heading
EQUALITY and a heading PREFIX and `readDispositionRows` used neither — it located its section with a
substring search. A derivation built to the sketch would have re-found the four somebody had already
written down and re-missed the fifth, inside the fix written to stop that happening.

Predicate 6 was logged as out of scope by plan 29-22, re-logged by 29-23, and named by 29-24 as "the
ONLY known remaining member of the class". Plan 29-25 closed it rather than adding it to an expected
list.

## 2. The one authority that replaced them

`scripts/frontmatter.ts`, declared beside `fencedLineFlags` and consuming it.

```ts
export function unfencedHeadingIndex(text: string, heading: string): number;
export function sectionEndIndex(text: string, from: number, level: 1 | 2): number;
```

`unfencedHeadingIndex` returns the 0-based index of the first line that is not inside a fence and
whose `trimEnd()` equals `heading`, or `-1`. `sectionEndIndex` returns the 0-based index of the first
line at `from` or later that is not inside a fence and is an ATX heading of level at most `level`, or
`text.split("\n").length` — the array LENGTH and not the last index, so a caller slicing `[from, end)`
gets the whole tail.

Three axes were reconciled, each answered once: heading equality is `trimEnd()`-normalized and
column-zero; the close is any unfenced heading of level at most `level`, so `### ` structures a
section rather than leaving it; and the search is bounded by the caller's `from` and terminates at the
line count. There is no opt-out parameter and the module's header forbids adding one.

Two floors are disclosed at the declaration: a bare `#` line (a legal empty h1) does not close a
section, and up-to-three-space-indented ATX is not recognised. Both keep the authority
byte-compatible with the predicates it replaces.

## 3. The derived owner and consumer lists

Taken from plan 29-25's scans in `scripts/check-foundation-guards.test.ts`; this document does not
re-derive them with a second scan.

**Owners** — modules that DECLARE a section-extent predicate:

```
non-test modules scanned: 41
=== frontmatter.ts
   sectionEndIndex :: if (!flags[i] && closes.test(lines[i])) return i;
TOTAL SITES: 1
```

`SECTION_EXTENT_OWNERS = ["frontmatter.ts"]`, `SECTION_EXTENT_OWNER_COUNT = 1`. Before the fifth
locator was closed the same scan over the same tree reported **two**, the extra being
`audit-model.ts :: tableUnder`.

**Consumers** — modules that IMPORT the authority. **Five**, where the plan predicted four:

```json
["audit-model.ts", "check-banned-claims.ts", "check-diff-disposition.ts",
 "check-imperative-lexicon.ts", "voice-model.ts"]
count: 5
```

The two sets are asserted disjoint: no module may both declare a section-extent predicate and import
the shared one. That is the shape that let `voice-model.ts` be fence-aware in one half and
fence-blind in the other at plan 29-20.

One predicate is exempted, and the exemption is STRUCTURAL rather than a name on an allow-list.
`check-imperative-lexicon.ts`'s `HEADING_LINE` is a heading RECOGNISER whose only use is
`if (HEADING_LINE.test(raw)) continue;`. A section-extent construct is a conjunction — a recogniser
USED in a position that terminates or bounds a scan — and `continue` does neither, so no module is
exempted by name anywhere.

## 4. The oracle's axes and cell count

`scripts/section-locator-oracle.test.ts`. Seven axes, not the six plan 29-26 names: the requested
LEVEL is added, because every invariant is phrased "at most the requested level" and a sweep that
asks one of the parameter's two legal values tests half of it.

| # | axis | members | labels |
|---|---:|---:|---|
| 1 | heading level | 5 | level-one, level-two, level-three, a hash run with no following space, not a heading at all |
| 2 | fencing | 3 | outside any fence, inside a terminated fence, inside an unterminated fence running to EOF |
| 3 | trailing residue | 4 | none, one space, one tab, one carriage return |
| 4 | leading residue | 3 | none, one space, four spaces |
| 5 | position | 5 | at `from` itself, three lines after `from`, the last line, absent with `from` at zero, absent with `from` equal to the line count |
| 6 | document shape | 4 | an empty string, a single blank line, the candidate is the first line, an ordinary multi-section document |
| 7 | requested level | 2 | level 1, level 2 |

**Cell count 7200**, derived twice by different means and compared: the product of the seven pinned
axis lengths, and a counter incremented by the loop that walks the generated corpus. The generated
array's own length is asserted as a third witness. The cells carry **2058** distinct
`(text, from, level)` triples over **724** distinct documents; both are pinned as numbers, because a
generator that started emitting one document would pass a bare cell count.

Every cell is checked against six invariants that are properties of the ANSWER — no expected output
is transcribed and no reference implementation exists in the file except the two deliberately broken
ones. I3 is the founding defect of the phase stated as a property: no line in `[from, answer)` is
both unfenced and a heading of level at most the requested level, so a predicate satisfying it cannot
adopt bytes belonging to a later section.

**The sweep is proven able to fail**, twice, against reproductions of defects the tree really had:

| probe | the defect it reproduces | cells failed of 7200 |
|---|---|---:|
| a close recognising `## ` and nothing else | CR-02 | **1836** |
| an anchor scan reading raw lines | WR-01 | **1440** |

A failing cell names every axis value that produced it. Verbatim, from the level-two-only probe:

```
I2 violated — the line the section ENDS at is not a heading of level at most 1: "## A later real
section"; end=3 from=0 lineCount=5 level=[a level-one heading] fencing=[outside any fence]
trailing=[no trailing residue] leading=[no leading residue] position=[the candidate is AT `from`
itself] shape=[the candidate is the document's FIRST line] request-level=[level 1]
```

and from the fence-blind probe:

```
I4 violated — the located line is fenced or is not the requested heading: "# Candidate"; at=1
heading="# Candidate" level=[a level-one heading] fencing=[inside a TERMINATED fence] trailing=[no
trailing residue] leading=[no leading residue] position=[the candidate is AT `from` itself]
shape=[the candidate is the document's FIRST line] request-level=[level 1]
```

**What the sweep does not cover** is named at the module header in seven items: setext headings,
heading text containing a fence delimiter run, fence delimiters other than exactly three backticks at
column zero, non-line-feed documents, inputs larger than the generated cells, a `from` outside
`[0, lineCount]`, and anything to do with the file system. It is a floor over the shapes the five
deleted predicates plausibly differed on, never a proof of correctness — and two of those seven
uncovered shapes turned into findings the moment they were probed by hand (§6).

## 5. The reproductions, before and after

Run from the recipes in `29-REVIEW.md`, against the committed `.js`.

### CR-02 — the level-one bypass

```
$ node -e 'import("./scripts/voice-model.js").then(m=>console.log(JSON.stringify(m.readCavemanFence(
    ["## Caveman prompt","You senior prose here with no fence at all.","","# Appendix",
     "Some later top-level section.","```","grug club rock cave smash","```",""].join("\n")))))'
```

| | verdict |
|---|---|
| the review, before | `{"ok":true,"inside":"grug club rock cave smash","outside":"You senior prose here with no fence at all.\n\n# Appendix\nSome later top-level section.\n"}` |
| **this session, after** | **`{"ok":false,"reason":"missing"}`** |

Fails closed. The wrong-bytes measurement is gone and the refusal names a reason.

### WR-01 — the quoted anchor false red

```
$ node -e 'import("./scripts/voice-model.js").then(m=>console.log(JSON.stringify(m.readCavemanFence(
    ["# Role","## Caveman prompt","```","You grug smash rock and club.","```","","## Notes",
     "Example of the required section:","```","## Caveman prompt","```",""].join("\n")))))'
```

| | verdict |
|---|---|
| the review, before | `{"ok":false,"reason":"multiple"}` |
| **this session, after** | **`{"ok":true,"inside":"You grug smash rock and club.", …}`** |

The correct document is no longer refused by name, and the block located is the real one.

### CR-01 — the watched-corpus narrowing, three live steps

The review's own sequence, replayed on the working tree.

**Step 1** — reword the frozen sentence in `agent-factory/roles/uat-planner.md`'s `## Hard limits`
(`Never self-sign or fake a pass; mark anything unverified` → `Never self-sign or fabricate a pass
result; mark whatever stays unverified`):

```
1 CHECK(S) FAILED        node scripts/check-diff-disposition.js -> exit=1
```

**Step 2** — with the reword in place, flip the fourth cell of the register's `uat-planner` row from
`yes` to `no` and regenerate. The row's premise is asserted through the parse before the edit — field
1 is `agent-factory/roles/uat-planner.md`, field 4 is `yes` — and re-read after it:

```
Wrote docs/audit/28-safety-surface-exclusions.md — 40 entries.
```

The 40 matches the review's step 2 exactly: the union went from 41 entries to 40.

**Step 3** — re-run every gate the review ran.

| gate | the review, before | **this session, after** |
|---|---|---|
| `check-diff-disposition` | exit 0, `ALL CHECKS PASSED` | **exit 1** |
| `check-audit-register` | exit 0 | **exit 1** |
| `check-claim-anchors` | exit 0, `ALL CHECKS PASSED` | exit 0 |
| `check-foundation-guards` | exit 0, `ALL CHECKS PASSED` | exit 0 |

Both new refusals name the member:

```
FAIL  1 of the 36 derived kit file(s) are NOT in the watched corpus —
      agent-factory/roles/uat-planner.md. The corpus derived 39 markdown file(s) from the 40-entry
      safety-surface union, and the derived kit alone is 36 (17 roles + 19 workflows), so this gate
      is about to report a verdict over LESS than the kit it exists to watch. …
```

```
FAIL  equality three (derived but NOT flagged): 1 derived kit file(s) are absent from the set of
      counted rows flagged `safety_surface: yes` — agent-factory/roles/uat-planner.md. …
```

The measured `39` against a `36` minimum is the number that proves the review's own suggested fix —
a bare cardinality floor — would have stayed green on this exact tree. The corpus legitimately
carries four public documents beyond the kit, so a floor at 36 leaves four files of slack while the
attack narrows by one. Plan 29-21 replaced the floor with per-member set containment for that reason
and proved it by mutation.

**Revert.** `git checkout --` on the three touched files, then:

```
$ git status --porcelain
 M human-notes.txt
?? .gsd/
?? .planning/phases/29.1-per-role-model-assignment/
$ node scripts/check-diff-disposition.js  -> exit=0
$ node scripts/check-audit-register.js    -> exit=0
$ node scripts/check-claim-anchors.js     -> exit=0
$ node scripts/check-foundation-guards.js -> exit=0
```

The three surviving entries are the pre-existing out-of-scope ones. No plant was left behind.

## 6. The adversarial variants

Thirty-two, invented at execution and aimed at the questions this project has recorded as the ones
that catch a bypass: what BOUNDS the predicate's input rather than which characters it accepts; at
WHICH POSITIONS it is consulted; which SET it enumerates; which NUMBER the specification anchors on
versus which one the code had in hand; and what its input is ASSEMBLED from.

**Variants that found nothing are listed too.** A variant list carrying only successes is a list
somebody curated, and a short list is the shape a curated one takes.

### A — the caveman section bound (`readCavemanFence`, CR-02 / WR-01, LANG-06)

| # | the variant | outcome |
|---|---|---|
| A1 | a thematic break `---` between the anchor and a later fenced block | `ok:true`, adopts. **Nothing** — a thematic break opens no section, so the bytes still belong to the caveman section |
| A2 | an HTML comment as the bound | `ok:true`, adopts. **Nothing** — same reason |
| A3 | a `###### ` heading between the anchor and a later fence | does not close. **Nothing** — a level-six heading structures a level-two section |
| A4 | the anchor is the document's last line | `missing`. **Nothing** — fail-closed |
| A5 | the anchor line carries a trailing tab | located. **Nothing** — the `trimEnd()` widening, pinned by plan 29-20 |
| A6 | the anchor spelled inside a quoted frontmatter value | not taken as an anchor. **Nothing** — the whole-line equality holds |
| A7 | a fence delimiter run inside a quoted frontmatter value | no toggle. **Nothing** — the delimiter class is column-zero anchored |
| A8 | a second anchor inside an unterminated fence | not counted, `ok:true` on the real block. **Nothing** — fence-aware |
| A9 | the anchor spelled with a leading tab | `missing`. **Nothing** — the column-zero convention |
| **A10** | a **setext** level-two heading between the anchor and a later fenced block | **`ok:true`, adopts the later section's block — FINDING V-29-26-01** |
| A11 | a column-zero anchor line inside a malformed frontmatter region, with a real anchor below | `multiple` — a false red. **Nothing** — fail-closed, and it needs frontmatter that no YAML writer produces |
| A12 | a column-zero fence delimiter inside a malformed frontmatter region | `missing` — a false red. **Nothing** — fail-closed, same precondition |
| A13 | the anchor below a `### ` subsection | located. **Nothing** |
| **A14** | a fence opened with **four** backticks carrying a three-backtick line inside | **`ok:true` with a TRUNCATED block; the rest of the caveman prose leaks into the clear-voice remainder — FINDING V-29-26-03** |
| **A15** | the opening delimiter indented by two spaces (legal CommonMark) | **`missing` — a false red on a well-formed document — part of FINDING V-29-26-04** |
| A16 | the delimiter carrying an info string (```` ```text ````) | located. **Nothing** |
| A17 | a `## ` line inside a four-space-indented code block below the anchor | does **not** close. **Nothing** — and this is the good news that BOUNDS Residual 4: the indented-code-block blindness reaches the depth-unbounded list markers and does **not** reach the section locator, because an indented line fails the column-zero heading test |

### B — the disposition-row bound (`locateSection` / `readDispositionRows`, WR-03 / IN-01, LANG-03)

| # | the variant | outcome |
|---|---|---|
| B1 | an indented `## ` inside the section | `{from:2,to:5}` — does not close. **Nothing** |
| B2 | the section heading carrying a trailing tab | located. **Nothing** — the pinned widening |
| B3 | the section heading carrying a leading space | `null`. **Nothing** — fail-closed |
| B4 | malformed rows over the live register | `rows 1532, malformed 0, files 53`. **Nothing** — the IN-01 refusal still has an empty input set |

### C — the exemption's reach (`locateExemptRegion`, WR-02, LANG-04)

| # | the variant | outcome |
|---|---|---|
| **C1** | an **unterminated fence opened inside the exemption region**, with a real `## ` section appended after it | `endBefore` moves 6 → 7: the appended section is swallowed into the safety exemption. **Nothing NEW** — the two-sided `BANNED_CLAIM_EXEMPT_SUPPRESSED` pin reds the moment the swallowed text carries a banned claim. It reaches, by a new route, the residual plan 29-23 already recorded: **the reach pin measures OCCURRENCES, not extent**, so swallowing a section that carries none is still silent |
| C2 | the control — the same document with the fence terminated | `endBefore` 6. Correct |
| C3 | the region heading duplicated inside a fence below the real one | `endBefore` 6, region located at the real heading. **Nothing** — fence-aware |

### D — narrowing the watched corpus by a route other than a cell flip (CR-01, LANG-03)

| # | the variant | outcome |
|---|---|---|
| D1 | the review's own route — flip the `safety_surface` cell | both gates exit 1. Closed (§5) |
| **D2** | **delete the register row outright** | both gates exit 1, and `check-audit-register`'s equality ONE names the member: `the register's counted rows are not exactly what the listers derive — missing [agent-factory/roles/uat-planner.md]`. **Nothing** — the narrowing is refused by a different equality than the one built for the flip, which is what a two-sided derived pin buys |

### E — the scope of the derived scans (WR-08, LANG-07)

| # | the variant | outcome |
|---|---|---|
| **E1** | run the owner classifier over every tracked non-test `.ts` the live scan never reads | the scan reads **41 of 49**; **8** modules are unread. Owners found in the unread set: **0**. **FINDING V-29-26-02** — the answer is right and the SCOPE is narrower than the claim |
| **E2** | run the duplicate-assertion classifier over every tracked `*.test.ts` the tripwire never reads | the tripwire reads **47 of 53**; **6** modules are unread, **three of them under `scripts/`**. Pairs found in the unread set: **0**, over 556 classified assertion lines. Part of **FINDING V-29-26-02** |
| E3 | does any unread non-test module import the locator authority? | none. **Nothing** — the consumer list is unaffected by the scope gap |

Both E1 and E2 assert their own premise before their claim: the transcribed classifier is first run
over the SAME set the live case reads and required to reproduce the live case's published answer —
`41 modules, 1 owner, 1 site` and `47 modules, 4751 assertion lines, 0 barren, 0 pairs` — before it is
trusted on any new input. A transcription that did not reproduce the known answer would have been
measuring its own transcription errors.

### F — the harness fixes (WR-05 / WR-06 / WR-07 / IN-03)

| # | the variant | outcome |
|---|---|---|
| F1 | a duplicate assertion pair separated by a comment, and by a blank line | both invisible to the tripwire. **Nothing NEW** — plan 29-25 discloses both at the classifier |
| F2 | is `ROLE_COUNT` — the number WR-05's fix pins the role list against — itself derived or a literal? | a literal at `kit-model.ts:107`, but `kit-model.test.ts:267` pins `listRoles().length === ROLE_COUNT` two-sided. **Nothing** — the fix rests on a pinned number rather than a drifting one |
| F3 | IN-03's acceptance grep, re-run | exactly three lines: the one declaration at `:141` and the two deliberately-literal expected values at `:4445` and `:4447`. **Nothing** — matches plan 29-25's published answer |

### The four findings, stated

**V-29-26-01 — a setext section boundary is not a boundary to this authority (LANG-06, LANG-07).**
Direction: **fail-open**, a measured number about the wrong bytes.

```
readCavemanFence(["## Caveman prompt","You senior prose here with no fence at all.",
                  "Appendix","---","Some later top-level section.",
                  "```","grug club rock cave smash","```",""].join("\n"))
→ {"ok":true,"inside":"grug club rock cave smash", …}
```

`Appendix` over a run of hyphens is a level-two heading in CommonMark and a real section boundary.
The authority recognises ATX only, so the caveman section runs past it and adopts the later section's
fenced block — the founding defect of this phase, reached through a heading spelling rather than
through a heading level.

Measured reachability: **0 setext headings in the bodies of all 40 governed and watched documents.**
The first run of that measurement reported **37** and was WRONG — it counted each document's
frontmatter TERMINATOR, which always follows a non-blank key line and therefore satisfies the setext
form. The corrected scan excludes the frontmatter region. That correction is the finding's most
useful fact: **37 of 40 documents carry a line that a setext-aware authority would read as a
level-two heading**, so the structural remedy is not free — it needs a frontmatter carve-out the
authority does not have, because `readCavemanFence` is handed raw file text. Whether the carve-out
would move a live verdict was measured separately and the answer is no: **0 live `sectionEndIndex`
ranges span a frontmatter terminator.**

**V-29-26-02 — the derived scans that prove LANG-07 are `scripts/`-scoped and non-recursive, while
the case name, the refusal wording and plan 29-25's summary all call them tree-wide (LANG-07).**
Direction: **no live bypass; a scope claim wider than the assertion behind it**, which is this
repository's own recorded second systemic failure class.

| scan | reads | tree | unread | found in the unread set |
|---|---:|---:|---:|---:|
| section-extent OWNERS | 41 | 49 | 8 | **0 owners** |
| duplicate-assertion tripwire | 47 | 53 | 6 | **0 pairs** over 556 assertion lines |

The unread modules are `hooks/admission-guard.ts`, `hooks/guard.ts`, `install/install.ts`,
`install/kit-source.ts`, `install/uninstall.ts`, `vitest.config.ts` and — the sharper half —
`scripts/runnable-ref/reference-check.ts` and `scripts/runnable-ref/test-skip-integrity.ts`, which
live **under `scripts/`** and are missed because `readdirSync` does not recurse. So even the narrower
claim "every module under `scripts/`" is short.

The tripwire's whole stated justification was that "a five-member literal is the set-literal drift
this repository has corrected three times". It replaced the literal with a derivation whose SCOPE is
a second hand-choice, short by six of fifty-three. When a set literal becomes a derivation, the
derivation's scope is a new degree of freedom — the same lesson this phase already recorded for a
section-anchored reader that searched to EOF.

**V-29-26-03 — the one fence authority toggles on any run of three or more backticks, so a longer
fence is closed early by a shorter run inside it (LANG-06).** Direction: **fail-open**, a truncated
block measured as the whole one.

```
readCavemanFence(["# Role","## Caveman prompt","````","grug club rock","```","grug smash cave",
                  "````",""].join("\n"))
→ {"ok":true,"inside":"grug club rock","outside":"# Role\ngrug smash cave\n````\n"}
```

CommonMark closes a four-backtick fence only on a run of four or more. `FENCE_DELIMITER_LINE` is
`/^```/`, a prefix test, so the inner three-run closes it. Half the caveman block leaks into the
clear-voice remainder and both guards publish a number about the wrong bytes.

Measured reachability: **0 four-or-more-backtick runs** across the 40 documents, against 42
column-zero three-backtick delimiter lines. Empty input set today.

**V-29-26-04 — the one fence authority does not see an indented fence delimiter, and six lines of a
watched document are misclassified today (LANG-03, LANG-06).** Direction: **fail-closed** as it
stands — documentation is scanned as governed prose, so the risk is a false red rather than a silent
pass. **This is the only one of the four with a non-empty input set.**

CommonMark allows a fence delimiter to be indented up to three spaces. `/^```/` is column-zero
anchored. Measured across the 40 documents: **4 indented delimiters, all in `README.md`** (lines 31,
33, 40, 42). Compared line by line against a CommonMark-faithful toggle:

```
lines: 67  DIVERGING LINES: 6
    31  live=false commonmark=true  "   ```bash"
    32  live=false commonmark=true  "   node install/install.js"
    33  live=false commonmark=true  "   ```"
    40  live=false commonmark=true  "   ```text"
    41  live=false commonmark=true  "   /grugops \"bootstrap this repo and propose safe first tick"
    42  live=false commonmark=true  "   ```"
```

`README.md` is a member of the LANG-03 watched corpus and of the banned-claims public-document scan,
so those six lines — two CLI examples — are treated as governed prose by every gate that reads them.
Nothing reds today. The reason the direction stays fail-closed is an **accident of the corpus rather
than a mechanism**: the four delimiters happen to pair up, so the toggle re-synchronises. An odd
number of indented delimiters in any document would desynchronise the toggle for that document's
whole tail, and the direction would invert.

## 7. The residual set

Presented to a human at plan 29-26's blocking checkpoint. Closure is a human act because an agent
cannot be held accountable for accepting a residual.

| id | residual | direction | live input set | recorded at |
|---|---|---|---|---|
| R1 | **Residual 4** — depth-unbounded list markers admit lines inside four-space-indented code blocks, which the one fence authority cannot see. The structural remedy reverses round 1's shipped CR-03 fix for the same guard | fail-closed | **0** indented list-marker lines under any `## Steps`; **0** indented ordered-marker lines in the 47 governed documents | `scripts/check-imperative-lexicon.ts`, plan 29-24 |
| R2 | **seven round-1 carry-overs** the round-2 review re-listed as known-open and out of scope: WR-01 (line numbers from the filtered remainder), WR-03 (three near-identical directory walks), WR-04 (`GENERATED_EXEMPT` pinned by cardinality only), WR-07 (`indexOf` source scrape + `root === ROOT` identity cache), WR-08 (two remaining path-literal spellings), IN-02 (`rows` computed and discarded), IN-04 (`countWords` replacement loop). None is charged against a failed LANG truth and none is fail-open | — | all verified still present at HEAD by the round-2 review | `29-REVIEW.md`, "Known-open from round 1" |
| R3 | **T-29-23-05** — the banned-claim exemption's level widening. It can only shorten the exemption, so more is checked | fail-closed | no shortening occurs on the live corpus | `scripts/check-banned-claims.ts`, plan 29-23 |
| R4 | **the four adversarial variants that survived §6** — V-29-26-01 setext, V-29-26-02 scan scope, V-29-26-03 fence run length, V-29-26-04 fence indentation | 01 and 03 fail-open; 02 is a scope claim; 04 fail-closed | 01: **0**; 02: **0** owners and **0** pairs in the unread sets; 03: **0**; **04: 6 lines of `README.md`, live** | this document, §6 |

Four further residuals are recorded by the plans that made them and are not re-argued here: the
authority's disclosed ATX floor (a bare `#` and indented ATX are not headings); the derived scans are
floors rather than proofs, with six and four unseen shapes named at their classifiers respectively;
`tsc --noEmit` does not read test modules, because `tsconfig.json` excludes `**/*.test.ts`, so a
broken harness surfaces as zero collected tests rather than as a red; and the exemption reach pin
measures occurrences rather than extent (reached again by variant C1 above).

**Nothing in §6 was repaired by the plan that measured it.** A measurement plan that repairs what it
measures has graded its own paper, and the human checkpoint is where the round decides whether to
reopen.

## 8. The decision taken on that residual set

The set in §7 was presented at plan 29-26's blocking checkpoint. The decision is recorded here
because §7 states the residual set "as presented at the checkpoint", and a residual set with no
recorded answer beside it reads, later, as one that was accepted by silence.

**Decision: `reopen-for-survivors` — "Reopen for the surviving adversarial variants only."**

**Made by:** the human operator (repo owner, Olger Oeselg).
**When:** 2026-08-15, through the orchestrator's checkpoint presentation during
`/gsd-execute-phase 29`.

What the human was shown, and accepted:

- All three original reproductions (CR-02, WR-01, CR-01) re-run from the round-2 review's own
  recipes and now failing closed, with `git status --porcelain` confirming the tree clean of plants
  (§5).
- **R4 as NON-EMPTY** — the four surviving variants of §6: V-29-26-01 (setext heading, fail-open,
  0 live), V-29-26-02 (the LANG-07 scans read 41/49 and 47/53 while the case name, the refusal
  wording and plan 29-25's summary all call them tree-wide; 0 found in the unread sets),
  V-29-26-03 (`FENCE_DELIMITER_LINE` is a prefix test, fail-open, 0 live) and V-29-26-04 (indented
  fence delimiter; **6 live lines of `README.md` classified as governed prose today**, fail-closed
  only by the accident that the four indented delimiters pair up, so an odd count in any document
  inverts the direction to fail-open).
- **R5** — the nineteen further residuals the plan's own checkpoint text did not enumerate. That
  count is the orchestrator's, taken at the checkpoint; this document does not re-derive it, and §7's
  closing paragraph names four of them in prose rather than all nineteen.

The reason recorded for the recommendation: this round's own standard refuses to close while a
reproduced bypass is on the record; V-29-26-04 is live today with an accidental rather than a
mechanical safe direction; V-29-26-01 and V-29-26-03 reach the CR-02 defect SHAPE by a different
route; and -01, -03 and -04 all live in the FENCE authority's grammar rather than in the section
locator, so they are plausibly ONE follow-up plan rather than four.

**Consequence: gap-closure round 2 does NOT close.** The round reopens for the surviving variants.
Phase 29 is not complete, no LANG requirement is verified or closed by this round, and re-verification
does not run on this tree.

## Every command in this document is re-runnable

The reproductions in §5 are the review's own recipes. The variants in §6 are `node -e` calls against
the committed `.js` and, for E1 and E2, a transcribed classifier that asserts it reproduces the live
case's published answer before it is trusted on new input. The corpus measurements walk
`listRoles()` and `safetySurfaceUnion()` through `import()`. The oracle's numbers come from
`npx vitest run scripts/section-locator-oracle.test.ts`, whose own case derives the cell count twice
and compares the two.
