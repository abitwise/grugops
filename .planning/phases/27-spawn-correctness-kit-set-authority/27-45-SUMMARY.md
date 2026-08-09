---
phase: 27-spawn-correctness-kit-set-authority
plan: 45
subsystem: frontmatter-authority
tags: [spawn-grant, yaml, fence-authority, loader-oracle, safety-invariant, gap-closure-round-8]
status: complete
requires:
  - "27-43 (the region-location change is measured against the scanner D-51 shipped)"
  - "27-44 (the D-52 loader-differential harness is re-run over the same corpus digest after this edit)"
  - "D-53 (WR-02 = FIX with honest scoping; IN-01 = FIX with 27-42's remedy; IN-05 = RECORD-DON'T-FIX)"
provides:
  - "scripts/frontmatter.ts — parseFrontmatter deletes NO line: normalize, LOCATE the region, flatten. The fence authority is not consulted there at all."
  - "scripts/frontmatter.ts — FENCE_DELIMITER_LINE, the fence-delimiter line class declared exactly once and read by both the strip and the region scan"
  - "scripts/frontmatter.ts — a NAMED REFUSAL for a column-0 fence delimiter line inside the located region"
  - "scripts/frontmatter.ts — checkGrantOccurrenceBalance, the balance comparison as an exported pure function; GrantOccurrenceKind / GRANT_OCCURRENCE_KINDS / GrantOccurrence exported with their stated reason"
  - "scripts/frontmatter.ts — the multi-document-stream disposition inside the three-outcomes partition argument"
  - "scripts/frontmatter.test.ts — 14 new cases: the WR-02 refusals with their loader column, the body-fence control, the source-inspection invariant, the fourth-kind balance case, the behaviour-preservation transcript, and the stream decision pin"
affects:
  - "scripts/check-foundation-guards.ts (prose checks byte-unaffected; gate output BYTE-IDENTICAL, md5 ff1fe13004e1436e743e5a928cb86d03 before and after)"
  - "scripts/generate-role-adapters.test.ts (its unterminated-block case split in two — see Deviations)"
tech-stack:
  added: []
  patterns:
    - "an operation that DELETES lines must never run before the boundary that decides which lines belong to which grammar"
    - "the strip's scope SHRANK rather than the refusal widening — documentation is kept out of the region by a REFUSAL, not by a deletion"
    - "a character CLASS hoisted and shared is not a second parser; a second STATE MACHINE would be"
    - "an unreachable floor gets an export boundary with its reason recorded in source, so a case can reach the arm production cannot"
    - "a disposition ships with both measured columns, an explicit UNKNOWN - verify and an explicit non-claim, inside the argument that had enumerated everything else"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - scripts/generate-role-adapters.test.ts
decisions:
  - "D-53 / WR-02 closed STRUCTURALLY rather than by narrowing the strip: parseFrontmatter deletes no line at all. The whole class 'content removed, remainder reported' is gone from the entry point because there is no removal left in it."
  - "The fence-in-region case is a REFUSAL, not a skip and not a strip: a column-0 fence line is not a legal node in a top-level block mapping and libyaml rejects such a document outright."
  - "D-53 / IN-01 closed with 27-42's precedent (an exported pure predicate a case can reach) rather than a second shape."
  - "D-53 / IN-05 recorded, not fixed. The module is NOT changed to read further regions; widening what it reports over on a premise no measurement supports is the wrong direction."
  - "MEASURED, NOT ACTED ON, NOT DROPPED: the carried-forward validate-agent-factory.ts question is outside this plan's scope. 27-44's recommendation to RETIRE 27-43's criterion stands and is repeated below."
metrics:
  duration: "~1h30m"
  completed: 2026-08-09
  tasks: 3
  commits: 3
actuals:
  tokens: 21000
  tasks: 3
  commits: 3
---

# Phase 27 Plan 45: The Region Is Located Before Anything Is Deleted From It — Summary

WR-02 is closed by removing the deletion, not by narrowing it: `parseFrontmatter` no longer strips
anything, and a column-0 code fence inside the located region is a named refusal. IN-01's unreachable
floor gets an export boundary and a case that fires it by name. IN-05 is a recorded decision with both
its measured columns attached and its uncertainty stated. All eight round-7 findings now close in
round 8 with none deferred.

## What shipped

| Artifact | Change |
|---|---|
| `scripts/frontmatter.ts` parse entry point | the fence strip DELETED from it; normalize → locate → flatten. A fence delimiter line inside the located region is a named refusal. The `of the fence-stripped body` line number in the unterminated refusal corrected to `of the document`. |
| `scripts/frontmatter.ts` `FENCE_DELIMITER_LINE` | the class hoisted verbatim out of `stripFencedBlocks`, declared once, read by both. The strip's body is byte-unchanged. |
| `scripts/frontmatter.ts` header | the one-fence-authority paragraph rewritten to state which text is stripped and which is not, with the honest scoping and the loader column |
| `scripts/frontmatter.ts` partition argument | a FOURTH "the partition MOVED and did not grow" paragraph, plus the multi-document-stream disposition |
| `scripts/frontmatter.ts` `checkGrantOccurrenceBalance` | the count identity extracted verbatim as an exported pure function; three declarations exported with their stated reason |
| `scripts/frontmatter.test.ts` | 14 new cases (140 → 149 in this file across tasks 1–3, plus 5 more in task 2's block) |
| `scripts/generate-role-adapters.test.ts` | the unterminated-block case split in two (see Deviations) |

## Commits

| Task | Commit | Subject |
|---|---|---|
| 1 (tracer) | `c766bb2` | locate the frontmatter region before anything is deleted from it (D-53, WR-02) |
| 2 | `338dc10` | make the spawn-occurrence balance arm reachable from a case (D-53, IN-01) |
| 3 | `9d490cf` | disposition the multi-document stream in the header, measured (D-53, IN-05) |

---

## Task 1 — WR-02

### BEFORE / AFTER / loader, verbatim

BEFORE was captured against the **committed `scripts/frontmatter.js` on a `git archive HEAD` mirror**
(`b24d980`-descendant `625d0b7`), not against the working tree.

```
--- d1 ---   `---` / `name: r` / ``` / `tools: Read, Agent(grugops-orchestrator)` / ``` / `---`
BEFORE {"id":"d1","arm":"ok","keys":{"name":["r"]},"grant":false}
       ^ the WHOLE `tools` key VANISHED
AFTER  {"id":"d1","arm":"REFUSE","reason":"the frontmatter block opened at line 1 of the document
        carries the code-fence delimiter line ````` at line 3, before any closing `---` delimiter —
        a line beginning with three backticks is not a legal node in a top-level block mapping, so
        the region carries content this module cannot account for; it is refused as unreadable
        rather than having those lines DELETED and the shorter remainder reported as a value —
        never read as \"carries no grant\""}

--- d2 ---   `---` / `name: r` / `tools: Read,` / ``` / `  Agent(grugops-orchestrator)` / ``` / `---`
BEFORE {"id":"d2","arm":"ok","keys":{"name":["r"],"tools":["Read,"]},"grant":false}
       ^ the TOKEN DELETED from the value
AFTER  REFUSE, same named refusal, "at line 4"

--- d3 ---   `---` / `name: r` / `tools: "Read` / ``` / `Agent(...)` / ``` / `"` / `---`
BEFORE {"id":"d3","arm":"REFUSE","reason":"cannot read `\"` as a frontmatter key line or as a
        continuation of the previous key"}
AFTER  REFUSE (the fence in the region is reached first). SUBSTANCE UNCHANGED: this document never
       reaches the success arm, before or after.

--- control --- a fenced frontmatter example in the BODY of a document with a real region
BEFORE {"arm":"ok","keys":{"name":["r"],"tools":["Read"]},"grant":false}
AFTER  identical — the example still contributes nothing.
```

**Loader column**, `/usr/bin/ruby -ryaml`, `loader ruby=2.6.10 psych=3.1.0 libyaml=0.2.1`, over each
document's region **as written**:

```
d1       REJECT   Psych::SyntaxError: found character that cannot start any token
                  while scanning for the next token at line 2 column 1
d2       REJECT   Psych::SyntaxError: ... at line 3 column 1
d3       ACCEPT   {"name"=>"r", "tools"=>"Read ``` Agent(grugops-orchestrator) ``` "}   <- a GRANT
control  ACCEPT   {"name"=>"r", "tools"=>"Read"}
```

So the refusal direction for `d1`/`d2` **is the loader's direction**, and `d3` is the pre-existing
safe divergence — the module refuses where the loader grants — which stays.

### The re-measurement, with the MODULE'S OWN CLASSIFIER

The planner's numbers were taken with an exact-payload region locator. They were re-taken with an
instrumented compile of `scripts/frontmatter.ts` itself — the same source, two extra exports appended,
nothing else changed — so the classifier under test is the one that ships.

```
corpus (derived from git ls-files '*.md')                              1142
files whose LOCATED REGION differs strip-first vs locate-first            0
files opening with a legal raw delimiter (locate-first)                 563
of those, files carrying a column-0 fence line INSIDE the region          0
```

The planner approximated 1136 / 557 / 0 / 0. **Both non-trivial counts are ZERO, so there are no named
files and the loader-adjudication list is empty** — there is nothing on this repository for the
decision rule to arbitrate. The three packaging templates open with a raw `---` at byte 0 and carry no
in-region fence.

### The value-map diff — three counts, both corpus sizes derived this session

```
corpus size BEFORE (derived this session): 1142
corpus size AFTER  (derived this session): 1142
corpus sizes equal: YES
scan size BEFORE: 33   AFTER: 33

arms changed:   0
values changed: 0
new refusals:   0

spawn-grant scan members (33): grant verdicts changed: 0
scan members reaching the KEYLESS SUCCESS arm: 0
```

`new refusals` is `0` over the whole corpus, so trivially `0` over documents the loader accepts.

### The foundation gate's output is BYTE-IDENTICAL

```
$ md5 gate-before.txt gate-t3.txt
ff1fe13004e1436e743e5a928cb86d03
ff1fe13004e1436e743e5a928cb86d03
7060 bytes, 88 lines, tail:
  PASS  dual-path equivalence: parallel-spawn-sim and sequential-drain replays converge ...

  == Result ==
  ALL CHECKS PASSED
```

Same digest before the first edit and after the last commit. That is the proof the guards' prose
checks were unaffected: they still call `stripFencedBlocks` directly on the whole file they read as
prose, and only `parseFrontmatter`'s input changed.

### The 27-44 differential harness, re-run

| | 27-44 recorded | this plan, after the edit |
|---|---|---|
| corpus digest | `4ccc987f19323055` | `4ccc987f19323055` |
| cells enumerated | 312 | 312 |
| loader-rejected (skipped) | 97 | 97 |
| disagreements | 32 | 32 |

```
D-52 loader differential — loader ruby=2.6.10 psych=3.1.0 libyaml=0.2.1 | corpus 4ccc987f19323055 |
cells enumerated 312 | loader-rejected (skipped) 97 | disagreements 32 | 65ms
```

**Not one cell moved.** The disagreement set is still asserted EQUAL to the two named exemptions, and
that assertion passed — so a fence-ordering change that moved a cell would have failed on an
expectation this plan did not compute.

### The corrected fence paragraph, quoted

```
// THIS IS ALSO THE ONE FENCE AUTHORITY, AND THE TEXT IT IS APPLIED TO IS NOW STATED PRECISELY
//   WHICH TEXT IT IS APPLIED TO: the PROSE BODY the guards check. ... their behaviour is byte-unchanged.
//   WHICH TEXT IT IS NOT APPLIED TO: the FRONTMATTER REGION. `parseFrontmatter` no longer strips
//   anything; it locates the region on normalized text and hands the region's lines to the flattener
//   as written. A COLUMN-0 FENCE LINE IS NOT A LEGAL NODE IN A TOP-LEVEL BLOCK MAPPING — libyaml
//   rejects such a document outright with a syntax error — so a fence inside the region is content
//   this module CANNOT ACCOUNT FOR rather than documentation ...
//   WHAT THE ARGUMENT ABOVE REPLACED. ... The SECOND half of that is still true and still
//   load-bearing for the packaging templates ... What was wrong was the FIRST half as a mechanism —
//   deleting lines is how the example was kept out, and a deletion applied before the region was
//   located deleted lines INSIDE the region too. ... The strip's scope SHRANK; it was not widened.
//   SCOPED HONESTLY: THIS IS A CONTRACT DEFECT AND NOT A CONFIRMED LIVE BYPASS, and a later reader
//   must not escalate it into one. ... No platform impact was demonstrated and none is claimed.
```

**No platform impact is claimed anywhere in it.**

---

## Task 2 — IN-01

### The fourth-kind case fires the refusal BY NAME, with both counts

Observed refusal text (three occurrences, one of them a fourth kind, so two classify):

```
the spawn-token accounting over `Agent(a), Agent(x, Task` does not balance: 3 occurrence(s) of the
grant token were found but 2 were classified as scoped, unscoped or neither; an accounting that
cannot balance is a check that was NOT performed, so the value is refused rather than read as a name
list — a name is never silently dropped or altered
```

### The wording is byte-unchanged — restricted diff

```
$ git show HEAD~2:scripts/frontmatter.ts | grep -F 'reason: `the spawn-token accounting over' \
    | sed 's/excerpt(v)/excerpt(value)/;s/^ *//'  > before
$ grep -F 'reason: `the spawn-token accounting over' scripts/frontmatter.ts | sed 's/^ *//' > after
$ diff before after
RESTRICTED DIFF EMPTY (modulo the parameter rename v -> value)   [388 bytes]
```

The only difference is the interpolated identifier name, forced by the parameter rename. Stated
honestly: the **rendered** text could not be compared across builds, because on the pre-extraction
build the arm was unreachable and produced no text at all — which is IN-01 restated.

### Purity, by construction

The extracted function's body contains no `readFileSync`, `readdirSync`, `existsSync`, `execFileSync`,
`process.` or `derive(` — asserted by a source-inspection case — and the fourth-kind case calls it with
hand-written arguments only. Same arguments, same answer, asserted.

### Behaviour preservation — a transcript captured from the PRE-EDIT build as data

A 17-value corpus (4 `tools`-key values derived from the live tree at capture time, 13 adversarial
multi-token spellings; 8 carry ≥2 spawn-token occurrences) was run through an instrumented compile of
the **pre-extraction** source and again through the post-extraction one:

```
BUCKET ASSIGNMENT + NAMES TRANSCRIPT: BYTE-IDENTICAL BEFORE vs AFTER
```

Both `keysGrantedAgentNames`'s result and the three-bucket assignment for every value are identical, so
the extraction touched the balance comparison and not the accounting. The pre-edit values are also
embedded in the committed case as data, so a future build that computes a different answer fails by
name rather than by comparing itself to itself.

### Each export carries its stated reason in source, quoted

```
// (Plan 27-45, D-53 — 27-REVIEW-GAPS-7 § IN-01) THE THREE DECLARATIONS BELOW ARE EXPORTED, FOR ONE
// STATED REASON AND NO OTHER. ... A case must therefore be able to construct an occurrence whose kind
// is OUTSIDE the declared three, and that is the only way the arm can be reached at all.
// These are NOT part of the parsing API. No consumer outside this module's tests reads them, exactly
// as with `DQ_ESCAPE_ALLOWLIST` and `ENUMERATION_LEGAL_CHARS` ...

// EXPORTED (plan 27-45, D-53) so a case can CONSTRUCT an occurrence at the test boundary. Production
// occurrences are only ever produced by `accountSpawnOccurrences`, which remains module-private ...

// THE ARM REMAINS UNREACHABLE IN PRODUCTION AND IS NOW EXERCISED BY A CASE — the disclosure and the
// assertion ship together, because either alone is the shape this module keeps correcting.
```

The count identity is computed in exactly one place: `grep -c 'GRANT_OCCURRENCE_KINDS.reduce'` over the
non-comment source returns **1**, asserted by a case.

---

## Task 3 — IN-05

### The stream, measured in this session, both columns

```
=== the document ===          (three regions; the SECOND carries the token)
---            ---            ---
name: r1       name: r2       name: r3
tools: Read    tools: Read, Agent(grugops-orchestrator)    tools: Write
---            ---            ---

=== MODULE column ===
{"arm":"ok","keys":{"name":["r1"],"tools":["Read"]},"grant":false}

=== LOADER column (/usr/bin/ruby -ryaml, Psych.parse_stream) ===
loader ruby=2.6.10 psych=3.1.0 libyaml=0.2.1
documents read: 6
  doc1 = {"name"=>"r1", "tools"=>"Read"}
  doc2 = nil
  doc3 = {"name"=>"r2", "tools"=>"Read, Agent(grugops-orchestrator)"}
  doc4 = nil
  doc5 = {"name"=>"r3", "tools"=>"Write"}
  doc6 = "body"
```

**Recorded honestly:** the round-7 review reported *3 documents, doc1 carrying the grant*. This
session's measurement over this session's document reads **6 documents, doc3 carrying the grant** —
libyaml treats each bare `---` between regions as opening a further (empty) document, and reads the
trailing `body` as a document too. The numbers are the ones measured here, not the ones remembered.

### The header paragraph, quoted

```
// AND WHAT A SECOND DOCUMENT IN THE STREAM MEANS — RECORDED, NOT FIXED (plan 27-45, D-53 —
// 27-REVIEW-GAPS-7 § IN-05). Everything above enumerates DELIMITER SPELLINGS exhaustively and never
// once says what happens when a document carries MORE THAN ONE region. That silence is why this
// paragraph exists: an unconsidered adjacency is how the WR-05 arms came to be written one rule
// short ...
//   WHAT THIS MODULE DOES ... It reads ONE region: from the opening delimiter to the FIRST legal
//   closing delimiter, and then it stops. ... There is no stream parser here and no lookahead past
//   the first close.
//   MEASURED IN BOTH COLUMNS ... module: ... the FIRST region only / libyaml: 6 documents ... doc3 =
//   {"name"=>"r2", "tools"=>"Read, Agent(grugops-orchestrator)"} — the SECOND region carries the grant
//   `UNKNOWN - verify`, CARRIED FROM THE REVIEWER RATHER THAN ERASED: most markdown frontmatter
//   readers also take only the first delimiter-to-delimiter region ... That was NOT confirmed against
//   Claude Code.
//   IT IS NOT CLAIMED AS A BYPASS AND A LATER READER MUST NOT ESCALATE IT INTO ONE. ...
//   THE DECISION: THE PLATFORM READS ONE BLOCK, A STREAM IS OUT OF SCOPE, AND THE MODULE IS NOT
//   CHANGED TO READ FURTHER REGIONS. ... Refusing to widen is the answer that cannot be wrong. If the
//   platform is ever measured reading a second region, THAT measurement is what reopens this ...
```

**Agreement with `27-CONTEXT.md` § D-53 item 6**, read side by side: the item requires the disposition
to live in the module header, to carry `UNKNOWN - verify`, to be explicitly **not** claimed as a
bypass, to state "the platform reads one block; a stream is out of scope", and to give the WR-05
one-rule-short reason. The paragraph carries all five, in those words, and contradicts none of them.

### The module was NOT changed to read further regions — restricted diff

```
$ git diff --stat -- scripts/frontmatter.ts       (task 3 only)
 scripts/frontmatter.ts | 39 +++++++++++++++++++++++++++++++++++++++
 1 file changed, 39 insertions(+)
$ git diff -U0 -- scripts/frontmatter.ts | grep -E '^\+' | grep -vc '^\+//'
 1     <- the `+++ b/scripts/frontmatter.ts` header line only
```

**All 39 added lines are comment lines.** Nothing inside the closing scan moved. A case additionally
asserts the non-comment source contains no `parse_stream` / `parseStream` / `documents` /
`nextRegion` / `secondRegion`, and that exactly one `break scan;` exists.

---

## Adversarial reproduction against this plan's OWN work

**A green suite is never evidence of absence** — this module's history is eight consecutive bypasses
shipped green. Four attacks were run before anything was called done.

### Attack 1 — swap the pre-fix committed `.js` under the REAL vitest run

```
× a FENCED `---` cannot close a real unterminated block — the region refuses at the fence ...
× WR-02 d1: a fence around a whole `tools` key REFUSES ...
× WR-02 d2: a fence around a CONTINUATION line REFUSES ...
AssertionError: expected 'frontmatter block opened at line 1 of…' to contain 'carries the code-fence
delimiter line'
      Tests  3 failed | 137 passed (140)
```

**Pin held.** The tree was restored and verified byte-identical. Stated honestly: `d3` and the body
control did **not** go red — `d3` was already refused pre-fix and the control was already correct.
Both are **controls, not pins**, and are labelled as such in source.

### Attack 2 — fifteen fence positions, each adjudicated against libyaml

This is the attack that mattered, and it found **five more truncated-success shapes no review
reported**:

| shape | BEFORE | AFTER | libyaml |
|---|---|---|---|
| a1 fence around a whole key | OK, `tools` VANISHED | REFUSE | REJECT |
| a2 fence around a continuation | OK, `tools=["Read,"]` | REFUSE | REJECT |
| a3 fence in a double-quoted scalar | REFUSE | REFUSE | **ACCEPT** (pre-existing safe divergence) |
| a4 fence in a single-quoted scalar | REFUSE | REFUSE | **ACCEPT** (pre-existing safe divergence) |
| **a5 fence after a literal block scalar** | **OK, `tools=["Read"]` truncated** | REFUSE | REJECT |
| **a6 fence after a folded block scalar** | **OK, `tools=["Read"]` truncated** | REFUSE | REJECT |
| a7 INDENTED fence (not column 0) | OK, value **equals libyaml's** | unchanged | ACCEPT |
| a8 tilde fence `~~~` | REFUSE | REFUSE | REJECT |
| **a9 fence with an info string** | **OK, key VANISHED** | REFUSE | REJECT |
| **a10 four backticks** | **OK, key VANISHED** | REFUSE | REJECT |
| a11 fence as the only region line | REFUSE | REFUSE | REJECT |
| **a12 fence inside a flow sequence** | **OK, `tools=["[Read,"]` MANGLED** | REFUSE | REJECT |
| a13 unterminated fence in the region | REFUSE | REFUSE | REJECT |
| **a14 fence after a complete key set** | **OK, grant=true** | REFUSE | REJECT |
| a15 backtick text, no fence | OK, equals libyaml | unchanged | ACCEPT |

**ZERO new refusals on loader-accepted content.** The only two module-refuse / loader-accept rows
(a3, a4) both **pre-date** this change, so the fix creates no false red. No row is in the unsafe
direction.

### Attack 3 — seven multi-region shapes, against the IN-05 disposition

Could the module ever read a region **other** than the first, which would make the header paragraph a
false statement? Seven shapes (plain, `...`-closed first region, **empty** first region, blank line
between regions, same key in both, unterminated first region, trailing-space close): **all seven read
exactly the first region.** The paragraph states what the code does, not what it intends.

**Recorded from this attack, sharper than the plan's own example and NOT escalated:** shape `s3` — an
**empty** first region followed by a second region carrying the grant — reaches the keyless SUCCESS arm
with `keys={}`. That is the silent-no-grant shape in miniature. It remains **record-don't-fix** for the
same reason the disposition gives: no platform measurement supports reading further regions, and no
shipped surface carries a second region. It is written down here so a later reader inherits the sharp
form rather than the mild one.

### Attack 4 — could a second fence opinion drift in?

The invariant case asserts the fence-delimiter class is written out **exactly once in non-comment
source** and that `parseFrontmatter`'s non-comment body never names `stripFencedBlocks`. Both go red if
a future phase moves a strip back in front of the region location.

### What could still defeat this, stated plainly

The fence class is `/^```/` — **column-0 backticks only**. An indented fence (a7) and a tilde fence
(a8) are outside it. Neither is a gap: nothing is deleted any more, so an indented fence simply becomes
ordinary in-region text whose value **agrees with libyaml exactly** (a7, measured), and a tilde fence
refuses through the ordinary unreadable-key-line rule (a8, measured). The structural claim this plan
actually earns is narrower and stronger than "fences are handled": **`parseFrontmatter` deletes no
line, so the class "content removed, remainder reported" cannot recur there through any construct** —
not just not through backtick fences. A green run of the suite is reported as a floor and is not
offered as evidence that no bypass remains.

## Deviations from Plan

### 1. [Rule 1 — a test needle pinning a diagnosis that legitimately moved] `generate-role-adapters.test.ts` case split in two

`refuses an unterminated frontmatter block as UNREADABLE` deletes the closing `---` from a fixture role
file whose **body carries a code fence**. Pre-fix, the strip removed the fenced block and the region
ran to EOF unterminated; post-fix the region meets the fence first and gets the fence refusal. Both are
the failure arm and the case's intent ("unreadable, not empty capabilities") still holds, but the
second needle (`is never closed by a \`---\` delimiter`) pinned a diagnosis that legitimately moved.

Resolved by **splitting rather than loosening**: the original case now filters the fixture's fence lines
out first (asserting the fixture really did carry some), so it keeps pinning the UNTERMINATED diagnosis
byte-for-byte; a new sibling case leaves the fences in place and pins the FENCE refusal by name. Two
findings, two cases. `scripts/generate-role-adapters.test.ts`, commit `c766bb2`.

### 2. [Rule 2 — a stale claim shipped beside a correct assertion] the `frontmatter.test.ts` fence case title

`a FENCED \`---\` cannot close a real unterminated block — the fence strip runs before the block scan`
still passed after the change, but its title and comment asserted the **mechanism this plan deleted**.
A passing case carrying a false explanation is how a later reader re-introduces the defect. Retitled to
`— the region refuses at the fence before it can reach one`, with the mechanism change recorded in the
comment and the new refusal asserted by name. Commit `c766bb2`.

### 3. [Measured, not acted on, and NOT dropped] the carried-forward validator question

`scripts/validate-agent-factory.ts` is still not a spawn-grant surface. **This plan's scope does not
cover it** — its objective, tasks, `must_haves` and threat register are WR-02, IN-01 and IN-05 only, and
it merely *runs* `validate-agent-factory.js` as one of six gate commands. So it is left recorded, not
silently dropped, exactly as the execution brief requires.

**27-44's recommendation stands and is repeated here for a human to take or refuse:** retire 27-43's
criterion "validator goes exit 0 → non-zero". Satisfying it means either importing `guard_wr05`'s answer
(coupling a structure validator to a safety gate for a question it does not ask) or minting a second
spawn-grant predicate beside it — the weaker-duplicate shape this module deletes on sight and the shape
D-51 was written to remove. The honest close is to strike the criterion.

## Threat register outcome

| Threat ID | Disposition | Outcome |
|---|---|---|
| T-27-08-13 | mitigate | **Closed.** The region is located before any line is dropped — in fact no line is dropped at all. Both measured documents move to the named refusal and every changed shape is adjudicated per document against libyaml |
| T-27-08-14 | mitigate | **Closed.** Value map: 0 arms, 0 values, 0 new refusals over 1142 files. Zero new refusals on loader-accepted content across the 15-shape adversarial probe; the only two module-refuse/loader-accept rows pre-date this change |
| T-27-08-15 | mitigate | **Closed.** The check is a pure exported function a case reaches with a fourth kind; the refusal fires by name with both counts, and the wording is proven byte-unchanged |
| T-27-08-16 | mitigate | **Closed.** The stream disposition carries a module transcript and a `Psych.parse_stream` transcript taken in this session, plus an explicit `UNKNOWN - verify` and an explicit non-claim |
| T-27-08-17 | mitigate | **Closed.** The body-fence argument is retained and asserted by a control case; all 33 scan verdicts byte-unchanged, none reaching the keyless arm; gate output byte-identical (md5 `ff1fe13004e1436e743e5a928cb86d03`) |
| T-27-08-18 | accept | Unchanged. The excerpt is bounded and the content is already tracked |
| T-27-08-SC | mitigate (asserted absence) | `git diff --stat -- package.json package-lock.json` is **empty** across all three tasks. No package-manager install ran and no dependency was added — the YAML loader is the pre-existing system `/usr/bin/ruby`. The package-legitimacy audit has nothing to audit; recorded so the empty audit does not read as a skipped one |

## Verification

```
npm run build                                            exit 0
npm run freshness                                        exit 0  (32 committed .js match a fresh tsc rebuild)
npx vitest run --exclude '**/scripts/e2e/**'             35 files, 1215 passed | 2 skipped
node scripts/check-foundation-guards.js                  exit 0  ALL CHECKS PASSED   (0.46s)
  md5 of full output, before-image vs final              ff1fe13004e1436e743e5a928cb86d03  (identical)
node scripts/coordinator-resolution-precheck.js          exit 0
node scripts/check-kit-refs.js                           exit 0
VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js  exit 0
git diff --stat -- package.json package-lock.json        (empty)
value map BEFORE vs AFTER over 1142 derived files        0 arms / 0 values / 0 new refusals
27-44 harness, same digest 4ccc987f19323055              312 cells / 97 skipped / 32 disagreements
STATE.md longest line                                    5345 bytes (line 17); 0 double-backslash lines
```

The suite moved 1200 → 1215. **It is reported as a floor and is never offered as evidence that no
bypass remains** — this suite was green in every one of the eight rounds in which a defect was later
found, and green again against the five extra truncated-success shapes attack 2 surfaced in this plan.

## Known Stubs

None.

## What the fourth entry in this round teaches

The earlier entries were about a rule's CONTENTS, ARMS, JURISDICTION, ALPHABET, UNIT, the SET its arms
covered, and WHO COMPUTES THE ANSWER. This one is about **when**.

> Every predicate in this module was correct about the text it was handed. WR-02 is the first defect
> where nothing was wrong with any predicate at all — an operation that DELETED LINES simply ran before
> the boundary that decides which lines belong to which grammar. The question to ask of a pipeline is
> not only "is each stage right?" but **"does any stage destroy information a later stage needs to be
> right, and does it run before or after the decision that would have told it not to?"**

And the corollary the 15-shape probe paid out: **the honest fix removed the operation rather than
narrowing it**, and that is why five shapes nobody reported were closed by the same edit. Narrowing a
deletion closes the spellings you enumerate. Deleting the deletion closes the class.

## Self-Check: PASSED

Artifacts on disk: `scripts/frontmatter.ts` — FOUND; `scripts/frontmatter.js` — FOUND;
`scripts/frontmatter.test.ts` — FOUND; `scripts/generate-role-adapters.test.ts` — FOUND.
Commits in git: `c766bb2` — FOUND; `338dc10` — FOUND; `9d490cf` — FOUND.
