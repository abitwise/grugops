---
phase: 29-controlled-language-voice-guard-rebuild
reviewed: 2026-08-15T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - scripts/check-banned-claims.ts
  - scripts/check-banned-claims.test.ts
  - scripts/check-diff-disposition.ts
  - scripts/check-diff-disposition.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/check-imperative-lexicon.test.ts
  - scripts/voice-model.ts
  - scripts/voice-model.test.ts
findings:
  critical: 2
  warning: 9
  info: 3
  total: 14
status: issues_found
---

# Phase 29 (gap-closure round 2): Code Review Report

**Reviewed:** 2026-08-15
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Round 2 closes the three round-1 BLOCKERs in the direction each was reported, and the work is
genuinely stronger than round 1: the carrier attribution in `check-diff-disposition.ts` is a real
per-commit predicate with a three-commit harness behind it, the two new denominators in
`check-imperative-lexicon.ts` are derived by code paths their loops do not run, `isCompanionFilled`
replaces a denylist with a canonical form, and three section-extent locators now consume
`fencedLineFlags` instead of carrying a second grammar.

It does not close the phase's failure class. Two findings below are bypasses I reproduced as
`input → wrong output`, both of them the same shape the phase exists to delete — a guard that is
green while measuring the wrong bytes:

1. **The watched corpus of `guard_diff_disposition` is the one set in the gate that is not pinned
   two-sided**, and it is derived from a hand-maintained register column that no gate constrains.
   Reproduced end to end on the live tree: reword a `## Hard limits` sentence in
   `agent-factory/roles/uat-planner.md`, flip one register cell from `yes` to `no`, regenerate, and
   **all four gates exit 0**. The gate's own finding text says "do NOT narrow the watched corpus" —
   a prohibition with no mechanism, which is precisely what this milestone exists to stop shipping.
2. **CR-01's section bound is closed for `## ` and open for `# `.** `SECTION_END = /^## /` does not
   recognise a level-one heading, so the founding fail-open survives in reduced form: a de-fenced
   caveman section still adopts a fenced block that lives under a later *top-level* heading. The
   same predicate one module over (`check-imperative-lexicon.ts`'s `SECTION_HEADING_LINE`) already
   uses `/^#{1,2} /`, so the tree disagrees with itself about what closes a section.

Beyond those: the WR-06 fix in `check-banned-claims.ts` **widened a safety exemption** while its own
header asserts "NOTHING BELOW IS RELAXED" (measured: 4 exempt lines become 9); `readDispositionRows`
is the fourth locator of the WR-06 class and was not fixed; the new set-equality refusal in
`check-imperative-lexicon.ts` now reds a shape the same file documents as deliberately out of scope;
and three of the new permanent cases assert less than their names and comments claim.

**Known-open from round 1, out of scope for this round** (re-listed, not re-argued): WR-01 (line
numbers from the filtered remainder), WR-03 (three near-identical directory walks), WR-04
(`GENERATED_EXEMPT` pinned by cardinality only), WR-07 (`indexOf` source scrape + `root === ROOT`
identity cache), WR-08 (two remaining path-literal spellings), IN-02 (`rows` computed and
discarded), IN-04 (`countWords` replacement loop). All verified still present at HEAD.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: `guard_diff_disposition`'s watched corpus is unpinned — one register cell flips a frozen `## Hard limits` reword to green

**File:** `scripts/check-diff-disposition.ts:1275-1293` (`watchedCorpus`), consumed at `:1328`,
`:1380-1381`; the only floor is the zero check at `:1337-1345`

**Issue:**
Every other set this gate depends on is pinned two-sided and says so in its own words —
`POSITIVE_GUARD_LITERAL_COUNT` (`:305`), the four `cardinalities` (`:1305-1314`), the
changed-file/clause-file set equality (`:1645-1668`). The **watched corpus is not**. It is
`safetySurfaceUnion(root)` (`generate-safety-surface.ts:73`), which is
`register rows with safety_surface: yes` ∪ `registry rows with kind: safety`, and nothing anywhere
constrains how many rows carry `yes`. `check-audit-register.ts:314` refuses only the unfilled `—`
marker; equality one (`:236`) pins the *row set*, never the column *values*.

So the gate's entire left-hand side can be narrowed by editing one table cell, and the register
itself lives under `docs/` and is therefore not a watched file — no disposition row is owed for the
edit that performs the narrowing.

**Reproduced end to end against the committed `.js` on the live tree** (plants reverted; working
tree unchanged at the end of this review).

Step 1 — reword one sentence inside `agent-factory/roles/uat-planner.md`'s `## Hard limits`
(`Never self-sign or fake a pass; mark anything unverified` →
`Never self-sign or fabricate a pass result; mark whatever stays unverified`). `node
scripts/check-diff-disposition.js`:

```
        37 watched file(s) changed since 4d2b8f0; 1880 changed clause(s) derived; ...
  FAIL  ... FROZEN by structuralSections ... region: `## Hard limits`, lines 44-51
== Result ==
1 CHECK(S) FAILED
```

Step 2 — with the reword still in place, change `docs/audit/28-disposition-register.md:347`'s
fourth cell from `yes` to `no` and run `node scripts/generate-safety-surface.js`:

```
Wrote docs/audit/28-safety-surface-exclusions.md — 40 entries.
```

Step 3 — re-run every gate:

```
$ node scripts/check-diff-disposition.js
        watched corpus: 39 markdown file(s) of the 40-entry LANG-03 safety-surface union
        36 watched file(s) changed since 4d2b8f0; 1867 changed clause(s) derived; ...
  PASS  diff disposition — changed watched file(s): 0 findings over 36/36 elements
== Result ==
ALL CHECKS PASSED

$ node scripts/check-audit-register.js   -> exit 0
$ node scripts/check-claim-anchors.js    -> ALL CHECKS PASSED
$ node scripts/check-foundation-guards.js-> ALL CHECKS PASSED
```

The reworded sentence is the one `docs/audit/28-disposition-register.md:347` itself calls "the least
substitutable [safety text] in the kit". Nothing in the repository caught it.

**Fix:** pin the watched corpus the way every sibling set in this file is pinned, and derive the
expectation from a source the narrowing edit cannot also move:

```ts
// The watched corpus is this gate's entire left-hand side. It is DERIVED, so it must also be
// COUNTED — every other derivation in this file is two-sided, and this is the one an author can
// shrink by editing one table cell in a file that is not itself watched.
export const WATCHED_CORPUS_MIN = ROLE_COUNT + WORKFLOW_COUNT; // 36 derived kit files, at minimum
...
if (corpus.watched.length < WATCHED_CORPUS_MIN) {
  fail(
    `the watched corpus derived ${corpus.watched.length} markdown file(s), and the derived kit ` +
      `alone is ${WATCHED_CORPUS_MIN} (${ROLE_COUNT} roles + ${WORKFLOW_COUNT} workflows). A ` +
      `safety_surface flag flipped to \`no\` removes a file from this gate ENTIRELY and owes no ` +
      `disposition row, because the register is not itself watched. Walk the register's ` +
      `safety_surface column before moving this number`,
  );
}
```

Better still, close the hole at its source: have `check-audit-register.ts` assert set equality
between `rows with safety_surface: yes` and the derived kit (it already computes `derived` at
`:236`), so `no` on a role or workflow row is a named refusal rather than a silent de-scoping. Add a
harness case that flips one flag in a mirror and requires exit 1.

---

### CR-02: `readCavemanFence`'s section bound recognises only `## ` — a level-one heading still leaks the founding fail-open

**File:** `scripts/voice-model.ts:102` (`SECTION_END = /^## /`), consulted at `:148-154`;
consumed at `scripts/check-foundation-guards.ts` `guardVoice` and `guardCavemanVoice`

**Issue:**
The bound's own comment states the rule as *"A DELIMITER UNDER A LATER HEADING BELONGS TO A
DIFFERENT SECTION. That sentence is the whole rule."* The implementation does not implement that
sentence — it implements it for level-two headings only. `voice-model.ts:100-101` justifies
excluding `### ` (correct: a subsection stays inside), but says nothing about `# `, and a level-one
heading unambiguously *ends* a level-two section rather than nesting inside it.

The consequence is the round-1 CR-01 bypass, narrowed but not closed: a role whose caveman section
has been reworded into senior prose still adopts an unrelated later fenced block, provided the
intervening heading is `# ` rather than `## `.

Reproduced against the committed `.js` (pure function, no guard):

```
$ node -e 'import("./scripts/voice-model.js").then(m=>console.log(JSON.stringify(m.readCavemanFence(
    ["## Caveman prompt",
     "You senior prose here with no fence at all.",
     "",
     "# Appendix",
     "Some later top-level section.",
     "```",
     "grug club rock cave smash",
     "```",""].join("\n")))))'

{"ok":true,
 "inside":"grug club rock cave smash",
 "outside":"You senior prose here with no fence at all.\n\n# Appendix\nSome later top-level section.\n"}
```

`ok: true`, the real caveman prose is handed to `guard_voice` as clear-voice remainder, and
`guard_caveman_voice` measures `# Appendix`'s code block — `tokens 5` over five words it never
meant. Exactly the wrong-bytes measurement CR-01 was raised to delete.

The tree already answers this question correctly one module over:
`check-imperative-lexicon.ts:488` declares `SECTION_HEADING_LINE = /^#{1,2} /` with the argument
spelled out ("a `## ` or `# ` starts something else"), and `check-imperative-lexicon.test.ts` carries
a permanent `"a \`# \` heading DOES release them"` control. Two modules, one predicate, two answers.

**Fix:**

```ts
// A section of level two is closed by any heading of level one or two. `### ` structures the
// section and stays inside it; `# ` and `## ` both start something else. This is the same class
// check-imperative-lexicon.ts's SECTION_HEADING_LINE already declares, spelled the same way, so
// the two cannot come to disagree about what closes a section.
const SECTION_END = /^#{1,2} /;
```

Add a permanent case in `scripts/voice-model.test.ts` planting the document above and asserting
`{ ok: false, reason: "missing" }`, plus a full-gate case in `check-foundation-guards.test.ts`
asserting exit 1 — the same pair plan 29-14 already wrote for the `## ` arm.

## Warnings

### WR-01: `readCavemanFence`'s heading scan is the one section locator this round left fence-blind — a quoted anchor reds a correct role file

**File:** `scripts/voice-model.ts:136-139`

**Issue:** Plan 29-16/29-17/29-18 threaded `fencedLineFlags` through `locateSection`,
`tableFirstCellsUnderHeading`/`boardColumns` and `locateExemptRegion`, and the fence-consumer pin
moved 6 → 7 → 8. `readCavemanFence` — the locator this round actually *changed* — still scans raw
lines for the anchor. A role file that quotes `## Caveman prompt` inside a fenced example counts two
headings and is refused `multiple`:

```
$ node -e '...readCavemanFence(["# Role","## Caveman prompt","```","You grug smash rock and club.","```",
            "","## Notes","Example of the required section:","```","## Caveman prompt","```",""].join("\n"))'
{"ok":false,"reason":"multiple"}
```

Both voice guards then refuse a correct document by name. The direction is fail-closed, which is why
this is a WARNING and not a BLOCKER — but the phase's own thesis is that a second grammar over bytes
an authority already answers for is a defect *even when currently consistent*, and this is the
fourth instance of the class in the same round that closed the other three.

**Fix:** consume the toggle for the anchor scan; keep `FENCE_DELIMITER_LINE` for the open/close
scans, which are a different question.

```ts
import { FENCE_DELIMITER_LINE, fencedLineFlags } from "./frontmatter.js";
...
const fenced = fencedLineFlags(text);
for (let i = 0; i < lines.length; i++) {
  // A quoted anchor inside a fenced example is documentation, not this document's own section.
  if (!fenced[i] && CAVEMAN_HEADING_LINE.test(lines[i])) headings.push(i);
}
```

Apply the same flag to the `SECTION_END` scan at `:149-154` for the same reason.

---

### WR-02: the WR-06 fix in `check-banned-claims.ts` WIDENED the safety exemption, while its own header states it did not

**File:** `scripts/check-banned-claims.ts:513-520`, header claim at `:481-484`

**Issue:** The header asserts *"NOTHING BELOW IS RELAXED"* and *"A truncated exemption region causes
MORE of the document to be checked ... Both are fail-CLOSED."* The change makes the region **end
later**, so strictly fewer lines are scanned. That is a relaxation of a safety exemption, and it is
the opposite of what the paragraph tells a reader.

Measured against the committed `.js` (exported `locateExemptRegion`):

```
lines:
  2 ## Disclaimer and honesty floor
  3 grugops does not conform to any standard.
  5 ```
  6 ## Example heading inside a fence
  7 ```
  9 This line sits AFTER the fenced heading.
 11 ## A later real section
 12 The grugops kit conforms to ASD-STE100 Simplified Technical English.

pre-fix  region: headingAt 2, endBefore 6   -> 4 exempt lines
post-fix region: headingAt 2, endBefore 11  -> 9 exempt lines
```

`check-banned-claims.test.ts`'s new case
`"a fenced \`## \` line inside the region does NOT truncate it — the claim below it stays exempt"`
asserts exit 0 with `findingCount === 0` on exactly that shape, so the widening is deliberate and
tested — only the prose denies it.

It is unreachable on the live corpus today only by ordering accident:
`agent-factory/writing-profile.md:155` (`## Disclaimer and honesty floor`) is the file's **last**
`## ` heading, so the region already ran to EOF. The moment a section is appended after it, a fenced
`## ` inside the disclaimer swallows that new section into the exemption.

**Fix:** correct the header to state the actual direction, and bound the exemption so a widening
cannot be open-ended:

```ts
// The region is bounded by the next UNFENCED same-level heading OR by end of file, whichever is
// first. Consuming the toggle makes the region LONGER, not shorter — state that plainly, because
// this is an exemption and a longer exemption is less checking, not more.
```

Then add the paired negative case the test file is missing: a banned claim below a fenced `## ` and
below a *later real* `## ` must still be reported (the existing `PAIRED PLANT` case covers the
second half only).

---

### WR-03: `readDispositionRows` is the fourth WR-06-class locator and was not fixed — fence-blind and section-unbounded, in the fail-open direction

**File:** `scripts/check-diff-disposition.ts:1206` (`body.indexOf(DISPOSITION_HEADING)`),
`:1216-1233` (the row loop)

**Issue:** The table is located by a bare `indexOf` of the literal `## Dispositions` anywhere in the
file (including inside prose or inside a fence), and then **every** line from that offset to EOF
that starts with `|` and splits to exactly 7 cells is admitted as a disposition row. There is no
section bound and no fence check, while `locateSection` twenty lines up in the same file now
consumes `fencedLineFlags` for precisely this question.

Direction: **fail-open**. A stray or quoted 7-column table below `## Dispositions` contributes rows,
and a row is what satisfies the structural companion arm (`:1524`). That arm carries the whole
positional freeze — the one that catches a reword — so extra rows are the one kind of noise this
gate cannot afford.

Currently unreachable: `docs/audit/29-style-dispositions/29-11.md` is the only member with fences
and both sit at lines 39/43, above its `## Dispositions` at 182.

**Fix:**

```ts
const flags = fencedLineFlags(body);
const lines = body.split("\n");
const at = lines.findIndex((l, i) => !flags[i] && l.trimEnd() === DISPOSITION_HEADING);
if (at === -1) { /* the existing named refusal */ }
for (let i = at + 1; i < lines.length; i++) {
  if (flags[i]) continue;                       // a fenced example donates no row
  if (lines[i].startsWith("## ")) break;        // the table lives in ITS section
  if (!lines[i].startsWith("|")) continue;
  ...
}
```

---

### WR-04: the new set-equality refusal reds a shape `check-imperative-lexicon.ts` documents as deliberately out of scope

**File:** `scripts/check-imperative-lexicon.ts:1274-1295` (the `stepSetRefusal` fold) versus the
recorded residual at `:71-74`

**Issue:** Residual 1 states: *"A NON-CONFORMING STEP WRITTEN AS PROSE WITH NO LIST MARKER IS NOT
SEEN. The imperative predicate is scoped to list items under `## Steps`; a paragraph under that
heading is not a bullet and is not measured as one."*

The WR-02 fix now derives `expected` from `stepsFiles` (files whose `## Steps` **heading** was seen)
and `visited` from `bulletFilesVisited`. A workflow whose `## Steps` section is written as
paragraphs — the shape the residual explicitly permits — therefore lands in `changedWithNoClause`'s
sibling set and fails:

```
the step-heading file set and the bullet-bearing file set are not equal ...
carries a `## Steps` heading but NOT contributed a bullet (1): agent-factory/workflows/XX.md
```

That is a red on a document the module says it does not govern. The corpus is green today only
because all 19 `## Steps` sections happen to use markers. The two statements cannot both stand.

**Fix:** pick one and record it. Either the residual is retired (a `## Steps` section must carry
bullets, which is a real and defensible rule — say so in `agent-factory/writing-profile.md` and
delete residual 1), or the denominator counts *files whose `## Steps` section contains at least one
non-blank, non-heading line*, which is still derived by the heading branch and still independent of
the bullet loop:

```ts
// Recorded from the HEADING branch, and only for a section that actually carries content — a
// `## Steps` heading followed by prose is a documented non-target (residual 1), not a lost file.
```

Add a case either way; today neither behaviour is pinned.

---

### WR-05: `voice-model.test.ts`'s live-corpus control asserts `> 0` while its comment promises a denominator

**File:** `scripts/voice-model.test.ts:225`

**Issue:** The comment three lines above reads: *"a short denominator here would let a role slip out
of the control silently."* The assertion is:

```ts
const names = listRoles();
expect(names.length).toBeGreaterThan(0);
```

`listRoles()` **throws** on an empty or missing roles directory (`kit-model.ts`'s `refuseEmpty`), so
`> 0` cannot fail under any input the call survives. It is the floor the comment says is not enough,
and the number it promises to protect is never compared. If sixteen of seventeen roles vanished this
control would pass.

**Fix:**

```ts
import { listRoles, ROLE_COUNT, ROLES_SUBPATH } from "./kit-model.js";
...
expect(names).toHaveLength(ROLE_COUNT);
```

---

### WR-06: the CR-01 gate case duplicates one assertion to stand for two consumers, and hard-codes a name the file already has a constant for

**File:** `scripts/check-foundation-guards.test.ts:4251-4252`, `:4259`

**Issue:** Two problems in the case that is the permanent proof of round-1's CR-01.

1. Lines 4251 and 4252 are **byte-identical**:

```ts
// "Both consumers name the FILE and the REASON"
expect(o).toContain(`${rel}: ## Caveman prompt fence refused — reason missing`);
expect(o).toContain(`${rel}: ## Caveman prompt fence refused — reason missing`);
```

`toContain` is a substring test, not an occurrence count, so the second assertion is satisfied by
whatever satisfied the first. The claim in the comment — that `guard_voice` **and**
`guard_caveman_voice` each name the file and the reason — is not tested. A build in which one
consumer went silent passes this case.

2. Line 4259 hard-codes `brownfield-mapper\.md` in a regex while `MALFORMED_ROLE` is declared at
`:4080` and used at `:4247`. Repointing the constant makes the strongest assertion in the case (the
wrong-bytes measurement line is gone) vacuous.

**Fix:**

```ts
const lines = o.split("\n").filter((l) => l.includes(`${rel}: ## Caveman prompt fence refused — reason missing`));
expect(lines, "both consumers must name the file and the reason").toHaveLength(2);
...
expect(o).not.toMatch(new RegExp(`${MALFORMED_ROLE.replace(".", "\\.")}: tokens \\d+ / content words \\d+`));
```

---

### WR-07: `"asserts the PROPERTY directly"` asserts a source substring, not a property

**File:** `scripts/check-imperative-lexicon.test.ts:1145-1160`

**Issue:** The case name claims to assert the WR-02 property. The body is:

```ts
expect(executable).not.toContain("expected: elements.bullets.length");
expect(executable).not.toContain("expected: elements.sentences.length");
expect(executable).toContain("expected: elements.stepsFiles.length");
```

Three substring tests over the module's own text. Renaming `elements`, extracting
`const n = elements.bullets.length`, or reformatting across a line break all reintroduce the
tautological denominator with the case still green. The property it names — *the denominator is not
read off the array the loop consumes* — is not expressible as a substring, and the case's name says
otherwise.

**Fix:** either rename it to what it is (`"the tautological denominator spellings are absent from
the source"`, an anti-regression tripwire) or assert the property behaviourally: plant a mirror in
which a governed file carries a `## Steps` heading and no bullet, and require `visited !== expected`
to fire. The case directly above it (`"REDs a governed file that opens a \`## Steps\` section and
contributes no bullet"`) already does this — so this one adds a claim it cannot support.

---

### WR-08: four modules answer "where does this section end" four different ways

**File:** `scripts/voice-model.ts:74`, `:102`; `scripts/check-diff-disposition.ts:532`, `:535`;
`scripts/check-banned-claims.ts:448`, `:498`; `scripts/check-imperative-lexicon.ts:478`, `:488`,
`:627`

**Issue:** The phase's founding rule is one authority per predicate. "Which line is this section's
heading, and which line ends it" is one predicate with four implementations that disagree on two
axes:

| module | heading equality | section close |
|---|---|---|
| `voice-model.ts` | `/^## Caveman prompt$/` (anchored, no trailing tolerance) | `/^## /`, fence-blind |
| `check-diff-disposition.ts` | `lines[i].trimEnd() !== heading` | `startsWith("## ")`, fence-aware |
| `check-banned-claims.ts` | `lines[i] === heading` (exact) | `/^## /`, fence-aware |
| `check-imperative-lexicon.ts` | `lines[i] === heading` / `/^## Steps\s*$/` | `/^#{1,2} /` |

The concrete consequences are CR-02 (`# ` handled in one column and not another) and WR-01
(fence-awareness in three and not the fourth). A secondary one: a heading carrying one trailing
space is the section's heading under `trimEnd()` and `\s*$`, and is invisible under `===` and `$`.
CRLF is not a live risk — `.gitattributes` pins every text extension to LF — but trailing whitespace
is not pinned anywhere.

**Fix:** export one locator from `frontmatter.ts` (which already owns the fence toggle) and have all
four consume it:

```ts
/** The 0-based index of the first UNFENCED line whose trimmed text equals `heading`, or -1. */
export function unfencedHeadingIndex(text: string, heading: string): number;
/** The 0-based index of the first UNFENCED heading of level <= `level` after `from`, or lines.length. */
export function sectionEndIndex(text: string, from: number, level: 1 | 2): number;
```

Then pin the consumer list two-sided, exactly as `check-foundation-guards.test.ts` already pins the
eight `fencedLineFlags` consumers.

---

### WR-09: CR-03's depth widening admits indented *code block* lines as `## Steps` bullets, and the fence toggle cannot see them

**File:** `scripts/check-imperative-lexicon.ts:511` (`LIST_MARKER = /^[ \t]*(?:[-*+]|\d{1,3}[.)])\s+/`),
`:519` (`ORDERED_MARKER`)

**Issue:** The widening from `/^ {0,3}/` to `/^[ \t]*/` is correct for CommonMark sub-bullets and is
argued at length. It also admits every line of a **four-space-indented code block** that begins with
a list marker. Indented code blocks are not fenced, so `fencedLineFlags` returns `false` for them and
`deriveElements`' `if (flags[i]) continue` does not fire.

Result: a workflow that documents a shell transcript or a nested list as an indented code block
under `## Steps` gains phantom step bullets — counted in the denominator, classified by
`classifyStep`, and measured against WP-02's 20-word bound. `ORDERED_MARKER` carries the same
widening with no section anchor at all (`:807`), so an indented numbered line **anywhere** in the
governed corpus is now procedural.

Direction is fail-closed (red on correct text), and the corpus is green today because it carries no
indented code blocks under `## Steps`. It is a latent false red the toggle cannot prevent.

**Fix:** either record it as a residual beside residuals 1-3 (the honest minimum), or teach
`fencedLineFlags` the indented-code-block form so the one authority answers for both fence spellings
— which is the structural fix and keeps the "one authority per predicate" claim true for the
`is this line documentation` question rather than only for backtick fences.

## Info

### IN-01: a disposition row containing a `|` disappears with no refusal

**File:** `scripts/check-diff-disposition.ts:1219`

**Issue:** `if (cells.length !== DISPOSITION_COLUMNS) continue;` silently drops any row whose
`before`/`after` cell contains a pipe (a code span such as `` `a | b` `` is entirely plausible in a
before/after column). The only trace is the `seen === 0` refusal at `:1234`, which does not fire
while other rows in the same file parse. The clause then reads as undispositioned — fail-closed, so
the author sees *a* red, but it names the wrong cause. Count the dropped lines and name them.

### IN-02: `rows` is still computed and discarded on two of three frozen-source branches

**File:** `scripts/check-diff-disposition.ts:1514`

**Issue:** Round-1 IN-02, unchanged. `const rows = disposition.rows.filter((r) => rowMatches(r, c));`
runs for every frozen clause; only the `structuralSections` branch at `:1524` reads it. Move it
inside that branch.

### IN-03: the `rolePath` helper the plan introduced is bypassed at one plant site

**File:** `scripts/check-foundation-guards.test.ts:4137`, `:4282`

**Issue:** Plan 29-14 added `rolePath(root, name)` so "the role directory is named in exactly one
more place than the derivation itself". Two sites still spell
`join(m, "agent-factory/roles", MALFORMED_ROLE)` inline. Route them through the helper.

---

_Reviewed: 2026-08-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
