---
phase: 27-spawn-correctness-kit-set-authority
plan: 38
subsystem: frontmatter-parser
status: complete
tags: [security, parser, spawn-grant, enumeration, allowlist, gap-closure, round-6, KIT-03, SPAWN-04]
requires:
  - scripts/frontmatter.ts codePointLabel() + excerpt() (landed by 27-36, reused not rewritten)
  - scripts/kit-model.ts spawnGrantScan() (the ONE scan composition, unchanged)
  - scripts/frontmatter.ts SCOPED_GRANT (byte-unchanged — its truncation is what the check DETECTS)
provides:
  - scripts/frontmatter.ts ENUMERATION_LEGAL_CHARS — the grant enumeration's legal character set, stated once
  - scripts/frontmatter.ts firstOutsideEnumerationLegal() — first offending character + its code-point label
  - scripts/frontmatter.test.ts — the 139-member YAML-indicator + general-category sweep, both directions
  - scripts/frontmatter.test.ts — the escape branch's domination assertion, against the constant
affects:
  - every consumer of grantedAgentNames / keysGrantedAgentNames
  - the KIT-03 closure equality in check-foundation-guards.ts
  - the set equality in coordinator-resolution-precheck.ts
tech-stack:
  added: []
  patterns:
    - "a stated finite LEGAL set replaces a pair of enumerated shape checks; the pair is DELETED because the allowlist is strictly broader"
    - "a comment's claim of unreachability is pinned by a case asserting the dominating constant, never left as prose"
    - "sweep expectations restated INDEPENDENTLY of the module constant, then pinned equal to it, so a widening fails loudly instead of relaxing the sweep"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
decisions:
  - "D-47 item 2 implemented as a PROMOTE: one legal character set, everything else refused by name and code point; the two enumerated checks DELETED, not kept beside it"
  - "The escape-refusal branch is kept and its note corrected to name the allowlist as its dominator — pinned by a case asserting `\\\"`, `'` and `\\\\` are outside the constant"
  - "ENUMERATION_LEGAL_CHARS is EXPORTED rather than module-private, so the domination assertion can be made against the constant itself rather than a re-typed copy (deviation, reasoned below)"
  - "The false-red corpus's measured THINNESS (exactly 1 real enumeration across 33 members) is pinned as a number rather than presented as 33 enumerations swept"
metrics:
  duration_minutes: 30
  completed: 2026-08-04
  tasks: 2
  commits: 2
actuals:
  tokens: 12471
  tasks: 2
  commits: 2
---

# Phase 27 Plan 38: One Stated Legal Character Set for a Grant Enumeration Summary

The grant enumeration now states its legal character set once and refuses every other character by
name and code point; the two checks that each named a character a prior finding happened to report are
deleted, `Agent(alpha[,]b, gamma)` and `Agent(alpha{,}b, gamma)` no longer return split, altered names
on the success arm, and the escape branch's unreachability note is true because a case says so.

## What Was Built

| Task | What | Commit |
|---|---|---|
| 1 (tracer) | `ENUMERATION_LEGAL_CHARS` + `firstOutsideEnumerationLegal()` in `scripts/frontmatter.ts`; the two enumerated checks deleted and replaced by one allowlist refusal; the escape branch's note corrected to name its real dominator; the contract doc block updated; five oracle cases added or rewritten | `5605d64` |
| 2 | The 139-member sweep drawn from the YAML indicator set and the punctuation/symbol general categories, pinned in both directions; the independently-restated legal set with its drift pin; the 33-member false-red control; the coordinator's named case | `3a805ef` |

**Precondition (Task 1).** `git status --porcelain` was **empty** at HEAD `14a5706`, and the mirror's
`scripts/frontmatter.js` was `cmp`-verified byte-identical to the live committed artifact before the
RED capture. Every probe ran on a throwaway `git archive HEAD` mirror; the live tree was never probed
into.

## The rule, as landed

```
legal enumeration character set = letters, digits, underscore, hyphen, period, comma, space  (67 members)
LEGAL   = every character of the captured enumeration is in that set
REFUSE  = any other character, naming the first one and its code-point label
```

Each member's purpose is recorded beside the constant: the **comma is the only structurally
load-bearing member** (it is what the function splits on), the space is its conventional padding, and
the rest are name content. So a later reader can tell which members are load-bearing and which are
latitude.

## Task 1 — enumeration RED/GREEN, ten rows, against the committed `.js`

Run against `scripts/frontmatter.js` on the `git archive HEAD` mirror (HEAD `14a5706`) **before** any
edit, then against the rebuilt committed `.js`. Document = `---` / `name: probe` / `tools: <shown>` /
`---`.

| enumeration | RED (pre-fix committed `.js`) | GREEN (rebuilt committed `.js`) |
|---|---|---|
| `Agent(alpha, gamma)` (control) | `ok:true ["alpha","gamma"]` (2 names) | `ok:true ["alpha","gamma"]` — **unchanged** |
| **`Agent(alpha[,]b, gamma)`** | **`ok:true ["]b","alpha[","gamma"]`** (3 names) | `ok:false` — names `` `[` (U+005B) `` |
| **`Agent(alpha{,}b, gamma)`** | **`ok:true ["alpha{","gamma","}b"]`** (3 names) | `ok:false` — names `` `{` (U+007B) `` |
| **`Agent(alpha:b, gamma)`** | **`ok:true ["alpha:b","gamma"]`** | `ok:false` — names `` `:` (U+003A) `` |
| **`Agent(alpha\|b, gamma)`** | **`ok:true ["alpha\|b","gamma"]`** | `ok:false` — names `` `\|` (U+007C) `` |
| **`Agent(&alpha, gamma)`** | **`ok:true ["&alpha","gamma"]`** | `ok:false` — names `` `&` (U+0026) `` |
| **`Agent(*alpha, gamma)`** | **`ok:true ["*alpha","gamma"]`** | `ok:false` — names `` `*` (U+002A) `` |
| `Agent(alpha, Task(beta), gamma)` (round-4) | `ok:false` — "nested opening parenthesis" | `ok:false` — names `` `(` (U+0028) `` |
| `Agent("alpha, beta", gamma)` (round-4) | `ok:false` — "quote character" | `ok:false` — names `` `"` (U+0022) `` |
| `Read, Agent` (unscoped) | `ok:true []` | `ok:true []` — **unchanged** |

**The two measured flow-collection shapes, precisely.** Each returned **three** names where the
document expresses two: `Agent(alpha[,]b, gamma)` returned `]b` and `alpha[` — two names the document
does not contain — and lost the name `alpha[,]b` it does. Both on the arm whose own doc block promises
that a name is never silently dropped or altered.

**The four characters no finding had named** (`:`, `|`, `&`, `*`) each returned a name no loader
computes. A denylist would have needed four more members. The allowlist needed none — which is the
whole argument for the promote.

### The GREEN reason, verbatim

```
the grant enumeration `alpha[,]b, gamma` carries `[` (U+005B), which is outside the legal character
set of a grant enumeration; a character outside that set means the comma is not reliably the
separator the document expresses, so the names these bytes were read as are not the names the
document expresses, and the enumeration is refused rather than returned split, short or altered —
a name is never silently dropped or altered
```

It names the byte that was found (not merely that something was), quotes the enumeration through the
existing `excerpt` helper, and keeps the module's established closing clause verbatim.

## Task 1 — suite-level RED against the pre-fix build

The updated `scripts/frontmatter.test.ts` copied onto the retained mirror, whose
`scripts/frontmatter.js` was `cmp`-verified as the pre-fix committed artifact:

```
× D-41 item 3 — a grant enumeration carrying a NESTED PARENTHESIS refuses … (now through the ONE allowlist)
× D-41 item 3 — a grant enumeration carrying a QUOTE refuses … (now through the ONE allowlist)
× D-47 item 2 — a FLOW-COLLECTION DELIMITER inside an enumeration refuses instead of returning SPLIT, ALTERED names
× D-47 item 2 — four characters NO FINDING NAMED refuse too …
× D-47 item 2 — the escape branch's UNREACHABILITY is asserted against the constant, not claimed in a comment
 Tests  5 failed | 54 passed (59)
```

After the fix: **59 passed**.

## The domination assertion — and the third path it uncovered

The plan required the escape branch's unreachability to be **asserted by a case**, not claimed in a
comment. The case asserts directly against the constant that `"`, `'` and `\` are each **outside**
`ENUMERATION_LEGAL_CHARS` — the exact premise the note's argument rests on. If a future author adds
any of the three to the legal set, the case fails and the note is corrected rather than silently
becoming false.

**The first draft of that case was WRONG, and the correction is the finding.** It asserted that
`Agent("al\x41pha", gamma)` would be refused by the allowlist naming the quote. It is not — it is
refused **upstream by the value flattener**, which applies the same D-30 escape decision at every
application point, before `keysGrantedAgentNames` runs at all:

```
`tools: Agent("al\x41pha", gamma)` carries the backslash sequence `\x` inside a double-quoted
scalar, and that sequence is not one of the three escapes this module resolves …
```

So the in-function escape branch is dominated **twice over**, not once:

| carrier | what actually refuses it | reason names |
|---|---|---|
| `Agent("al\\x41pha", gamma)` (doubled backslash — allowlisted, survives the flattener) | the **enumeration allowlist** | `` `"` (U+0022) `` |
| `Agent(alpha\b, gamma)` (backslash outside quotes — literal YAML text) | the **enumeration allowlist** | `` `\` (U+005C) `` |
| `Agent("al\x41pha", gamma)` (non-allowlisted escape inside a quoted region) | the **value flattener**, upstream | `` backslash sequence `\x` `` |

All three are recorded in the case with their measured behaviour. The correction was made to match the
measurement rather than the assumption, and the case records that it was.

## Task 2 — the sweep, RED before and GREEN after

**Corpus: 139 members**, asserted as a number — 19 YAML indicator characters listed explicitly with
their YAML meanings, plus 120 stride-sampled members of the punctuation and symbol general categories
(stride 7, cap 60 per class, so the sample is byte-identical on every run and platform).

The corpus is drawn from the **general categories**, not from the findings: `¶` (U+00B6), `฿`
(U+0E3F), `܇` (U+0707) and 117 others are members, and no finding in this phase has ever mentioned
them. That is what makes the completeness claim non-circular.

| Build under test | Members swept | Refused by the allowlist | Refused earlier | **Did NOT refuse** |
|---|---|---|---|---|
| pre-Task-1 committed `.js` (retained mirror) | 137 non-legal | **0** | 2 (both quotes, via the now-deleted check) | **135** |
| rebuilt committed `.js` | 137 non-legal | **137** | 0 | **0** |

**2 refusals out of 137** is what "a denylist that grows one reported spelling at a time" measures as.

Among the 135 that did not refuse, by name: the two measured flow-collection shapes (`[` U+005B,
`{` U+007B) and the four further characters from Task 1's transcript (`:` U+003A, `|` U+007C, `&`
U+0026, `*` U+002A), plus `?`, `]`, `}`, `#`, `!`, `>`, `%`, `@`, `` ` ``, `~`, `¡`, `¨`, `¯`, `¶`, and
116 more — each returning a name carrying the offending character (`alpha?b`, `alpha¶b`, `alpha฿b`, …).

**Both directions are pinned.** The two corpus members that ARE in the legal set — `-` (U+002D, the
YAML block-sequence-entry indicator) and `,` (U+002C, the flow-collection entry separator) — are kept
in the corpus deliberately and asserted **not** to refuse. They are what makes this sweep catch a
narrowing as well as a widening. `2 + 137 = 139` is asserted, so no member can fall out of both arms.

### Non-circularity, and how the expectations are decided

The sweep's expected verdict for each member comes from `LEGAL_AS_DATA` — the legal set **restated
independently in the test file**, never from `ENUMERATION_LEGAL_CHARS` and never by calling the
module's predicate. An expectation taken from the thing under test moves whenever the thing under test
moves, so a widened legal set would relax the sweep in silence.

The two are then **pinned equal** by their own case (`[...LEGAL_AS_DATA].sort()` vs
`[...ENUMERATION_LEGAL_CHARS].sort()`, plus `size === 67`). So the forbidden resolution — widening the
legal set to make a real enumeration pass — fails loudly there instead of dissolving here.

### A structural note recorded rather than left to be rediscovered

`(` and `)` are **not** in the sampled corpus: their code points (0x28, 0x29) are not multiples of the
stride. That is luck, not design — and `)` could not be swept by this construction in any case, because
`)` **terminates** the scoped-grant expression: `Agent(alpha)b, gamma)` carries the complete
enumeration `alpha` and correctly returns the success arm. `(` is swept by its own named case in the
oracle block. Written into the test so a future stride change expects to state that carve-out rather
than quietly widen something.

## False-red cost, measured — and its corpus's thinness named

| Measurement | Result |
|---|---|
| Spawn-grant scan members read (from `spawnGrantScan()`, never a directory list) | **33** = `SPAWN_GRANT_SCAN_COUNT` |
| **Scoped grant enumerations found across all 33** | **1**, in **1** file |
| Granted names returned in total | **16** |
| **Enumeration refusals across all 33 members** | **0** |
| **Altered name lists** (vs an independently-written naive reading) | **0** |
| Coordinator's own enumeration | success arm, 16 names, by count AND by membership |
| Every character of every real granted name inside the legal set | asserted, per character |

**The thinness is the honest headline, and it is pinned as a number.** "Measured zero false reds
across 33 members" must **not** be read as "33 enumerations were exercised". There is exactly **one**
scoped enumeration in this repository — the coordinator's — and the other 32 members either grant
nothing or grant unscoped (for them the control asserts the weaker but still real fact that
`grantedAgentNames` does not refuse and returns an empty list). The counts `enumerationsFound === 1`
and `filesWithEnumerations === 1` are asserted so a **second** enumeration shipping fails the case and
forces a reader to notice the corpus changed, instead of quietly making the control look broader than
it is. That is also why the coordinator's named case is load-bearing rather than decorative.

The control reports what it read in every assertion message
(`read 33 scan members carrying 1 scoped grant enumeration(s) across 1 file(s)`), so a control passing
over a shrunken corpus is visible.

**Membership, not just count.** The control compares each file's returned list against an
independently-written naive comma-split reading of that file's own `tools` / `allowed-tools` values —
which is the reading that is correct precisely when every character is legal. That is what lets it
catch an **altered** name rather than merely a refused one; a count comparison would pass while one
name was substituted for another.

## Consumers — neither needed an edit

Both were read and confirmed, as the plan required:

| Consumer | Branches on the failure arm by hand? | Edit needed |
|---|---|---|
| `scripts/check-foundation-guards.ts` (KIT-03 closure equality) | yes, already | **none** |
| `scripts/coordinator-resolution-precheck.ts` (set equality) | yes, already | **none** |

Both exit 0 on the live tree. The refusal reaches them as a parse artifact exactly as D-32 specified,
so a broadened refusal changes which inputs reach the failure arm, not how either consumer handles it.

## Verification

| Check | Result |
|---|---|
| `npm run build && npm run freshness` | exit 0 — **32 committed `.js` fresh** against a temp rebuild |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1111 passed / 2 skipped**, 35 files (baseline 1104/2 — +7 cases, 0 failures) |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `grep -c 'SCOPED_GRANT' scripts/frontmatter.ts` | **3**, unchanged from its pre-task value; the expression at `:1024` is byte-identical |
| Kit intact | 17 agent adapters, `SPAWN_GRANT_SCAN` = **33** |
| `git diff package.json` | **empty** — zero package-manager install tasks; no legitimacy checkpoint was reachable |
| `.tmp-build/` | removed after every freshness run |
| Live tree | clean apart from this plan's `files_modified` |

**The suite being green is not offered as evidence of anything.** It has been green in every round of
this phase in which a defect was later found. Every closure claim above rests on a transcript that was
RED against the committed `.js` before the edit, or on a measured count.

Note that the **two false-red controls passed against the pre-fix build too** — correctly so. A
false-red control measures a change's COST; it is not a RED/GREEN artifact and was never expected to
be one. Only the seven cases listed above went red before the fix.

## Deviations from Plan

**One affecting a stated constraint, three recorded judgements.**

1. **[Deviation — `ENUMERATION_LEGAL_CHARS` is EXPORTED, not module-private.]** The plan specifies a
   "module-private constant" twice. It is exported. The two requirements are in direct tension: the
   plan ALSO requires the escape branch's domination to be asserted "directly against the allowlist
   constant", and a truly unreachable constant forces the test to re-type the set — which would be a
   second statement of it, the exact drift class this repository's own record names. Exporting follows
   the precedent the plan's own `read_first` points at: `DQ_ESCAPE_ALLOWLIST`, D-30's allowlist and
   "the shape this task copies one function over", is likewise exported and likewise not part of the
   parsing API. The reason is written beside the constant so it is not mistaken for API surface.
2. **[Recorded — the domination case's first draft was wrong.]** It assumed the allowlist refused a
   non-allowlisted escape inside a quoted region; the flattener refuses that upstream. Corrected to
   the measured behaviour, and all three paths are now recorded in the case. Named in full above,
   because a quietly-fixed wrong assumption is indistinguishable from one that was never made.
3. **[Recorded — the round-4 cases' assertions moved.]** The two D-41 item-3 cases asserted the
   deleted checks' wording (`"nested opening parenthesis"`, `"quote character"`). They now assert the
   allowlist refusal's wording and its named character. Leaving the old assertions would have pinned a
   predicate that no longer exists — the same "a tag describing a deleted structure" problem `27-36`
   resolved for `DELIMITER_ROWS`. Both cases still refuse, still by their own named case, and their
   pre-fix RED values are still recorded in-case.
4. **[Recorded — the false-red corpus is 1 enumeration, not 33.]** The plan's truth speaks of "every
   scoped grant enumeration in every one of the 33 members". There is exactly one. Rather than let the
   33-member figure imply a breadth it does not have, the measured counts are asserted as numbers and
   the limitation is stated in both the test and this summary.

**No file outside this plan's `files_modified` was edited.** `.planning/STATE.md` and
`.planning/ROADMAP.md` were not touched.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary was
introduced; the change narrows an existing trust boundary (enumeration text → the granted-name set) and
adds no new surface. `package.json` is byte-unchanged.

Threat register dispositions implemented: **T-27-R6-15** (one stated legal set, the two enumerated
checks deleted), **T-27-R6-16** (a split producing a name the document does not express now refuses;
RED before and GREEN after against the committed `.js`), **T-27-R6-17** (the domination asserted by a
case against the constant), **T-27-R6-18** (the corpus drawn from the YAML indicator set and the
punctuation/symbol general categories, expected verdicts computed from independently-stated data),
**T-27-R6-19** (measured zero refusals across all 33 scan members). **T-27-SC**: zero package-manager
install tasks; `package.json` byte-unchanged.

## Known Stubs

None. `grep -nE "TODO|FIXME|placeholder|coming soon|not available|\.skip\(|\.todo\("` over both changed
source files returns **zero** matches. No test is skipped by this plan; the suite's 2 pre-existing
skips are untouched and unrelated.

## Backstop Truths — status

This plan carried no `UNKNOWN - verify` premise. Every claim above is a measured transcript or a
measured count against the committed `.js`.

## Requirements — deliberately NOT marked complete

The plan carries `requirements: [KIT-03, SPAWN-04]`, and `REQUIREMENTS.md` still shows both as **Gaps
Found** for Phase 27. They were **not** checked off, for the reasons `27-36` and `27-37` both recorded:
round-6 closure is the verifier's call across all three plans, and this plan's own prohibitions forbid
offering a green suite as evidence of closure. The evidence needed is in this summary; the disposition
is left to round-6 verification.

## Actuals

The plan estimated **46,000** tokens. Measured on the same scale (chars/4 over the realized diff,
`git diff 5605d64~1..HEAD -- scripts/` = 49,885 chars): **12,471**. Recorded as measured, not rounded
toward the estimate.

## Self-Check: PASSED

- `scripts/frontmatter.ts` — FOUND
- `scripts/frontmatter.js` — FOUND
- `scripts/frontmatter.test.ts` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-38-SUMMARY.md` — FOUND
- commit `5605d64` — FOUND
- commit `3a805ef` — FOUND
