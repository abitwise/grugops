# Erratum to `32-40-ADVERSARIAL-REVIEW.md`

**Issued by:** phase 32.1, plan `32.1-11`, 2026-09-18. Ledger row **209**.
**Subject:** the round-4 adversarial review attributes the WR-04 fix to the wrong commit, in five
places.
**Scope of the correction:** a commit hash. **No finding, no severity and no number moves.**

The document this erratum is about is **left byte-unchanged**. An evidence document is the record of
what was measured and when; correcting it in place would replace that record with a later reader's
version of it. This note stands beside it instead.

---

## 1. What the original says, and where

`32-40-ADVERSARIAL-REVIEW.md` names **`7aea94f0`** as the commit that created `splitReaderOffenders`
— the WR-04 fix — at five places:

| # | Section | Line | How it reads |
|---|---------|------|--------------|
| 1 | § 5, "The four questions, asked of every fix" — the fix table | 289 | the row's first cell, ``**WR-04** `7aea94f0` — the split reader is refused by name`` |
| 2 | § 12 / F-15, "Created by a round-3 or fix-pass change?" | 653 | ``**YES** — `7aea94f0` is the commit that created this`` |
| 3 | § 13, the created-versus-inherited ratio table | 864 | ``**5** — F-15 (`7aea94f0`), F-17's oracle half …`` |
| 4 | § 16, the round ledger, row 2 (Advisory 1) | 1018 | the commit column, ``7aea94f0`` |
| 5 | § 16, the round ledger, row 12 (Fix claim WR-04) | 1028 | the commit column, ``7aea94f0`` |

**A sixth use of `7aea94f0` in the same document is CORRECT and is NOT part of this erratum.** § 16
row 19, at line 1035, uses it as the END of the range `d5486262..7aea94f0` for plan `32-38`, which is
what it is. A reader grepping the document for the hash will find six hits; five are wrong and one
is right, and this table is how to tell them apart.

## 2. The correct commit

The commit that created `splitReaderOffenders` is **`7a3ae592`**
(`7a3ae5923697f2bc826916530c6d5d51c78dc68d`).

Read every occurrence of `7aea94f0` in the five rows above as `7a3ae592`.

## 3. The evidence, measured rather than asserted

**The commit the review names cannot have created the rule — it touches no source file at all.**

```
$ git log -1 --format='%H%n%s%n%ad' 7aea94f0
7aea94f0b2e2634a855a2625dd69ea9700f2d00b
docs(32-38): record plan 32-38 in STATE and ROADMAP (31/34 plans)
Wed Sep 16 21:29:01 2026 +0300

$ git show --stat --format='' 7aea94f0
 .planning/ROADMAP.md                               |  4 ++--
 .planning/STATE.md                                 | 22 +++++++++++++---------
 .../32-38-SUMMARY.md                               |  9 ++++++---
 3 files changed, 21 insertions(+), 14 deletions(-)
```

Three files, all under `.planning/`. Nothing under `scripts/`. It is a documentation commit.

**The commit that did create the rule touches exactly the file the rule lives in.**

```
$ git log -1 --format='%H%n%s%n%ad' 7a3ae592
7a3ae5923697f2bc826916530c6d5d51c78dc68d
fix(32): WR-04 refuse the split-across-files ticket reader, and own-property the exemption lookup
Wed Sep 16 19:02:58 2026 +0300

$ git show --stat --format='' 7a3ae592
 scripts/validate.test.ts | 306 ++++++++++++++++++++++++++++++++++++++++++++++-
 1 file changed, 304 insertions(+), 2 deletions(-)
```

**And the identifier's own history names it first**, which is the measurement that decides the
question rather than the commit subjects, which could say anything:

```
$ git log -S 'splitReaderOffenders' --oneline --reverse -- scripts/validate.test.ts
7a3ae592 fix(32): WR-04 refuse the split-across-files ticket reader, and own-property the exemption lookup
4aa28f00 test(32.1-04): the split-reader join resolves declarations and is asked both ways
```

The first commit to add the identifier is `7a3ae592`; the second is phase 32.1's own cutover, which
rewrote the same rule to resolve declarations.

**One corroborating fact, stated because it is cheap and it is the kind of thing a reader checks
next.** `7a3ae592` landed at 19:02 and `7aea94f0` at 21:29 on the same day — the fix precedes the
documentation commit that records the plan, which is the ordinary order and the opposite of what the
original's attribution would require.

## 4. What does NOT move, asserted rather than left to inference

`7a3ae592` sits inside the same fix-pass window as every other commit the created-versus-inherited
ratio counts — between the round-3 verification `5ec7d085` and plan `32-38`'s first commit
`d5486262`. F-15 therefore remains **created-by-a-fix-pass-change**, and **§ 13's ratio stays 5 of
8**, with F-15 still among the five. § 5's fix table, § 12's finding text, § 16's two ledger rows and
every severity in the document are unaffected except in the single cell that holds the hash.

Anyone reasoning about round 4's provenance should take the ratio, the finding set and the severities
exactly as the original states them.

## 5. This is a NEW convention on this tree, and saying so is the point

**No `*-ERRATUM*` file is tracked anywhere in this repository.** Measured:

```
$ git ls-files | grep -i erratum
(no output)
```

**The convention actually in use today is a note in the OWNING document.** This same correction was
first recorded that way, by plan `32-41`, in
`.planning/phases/32-board-projector-cli-dashboard/deferred-items.md` § "New residual PRODUCED by
this round (plan 32-41, Task 2)" — the row-209 block, which carries the same measurement and the
same "the verdict does not move" statement. That block is where the correction has lived since
2026-09-16 and it is not superseded by this file; this file is the version that stands **beside the
document it corrects**, so a reader who opens the review and nothing else finds it.

`32.1-CONTEXT.md` D-15 and its `<code_context>` describe the erratum-beside-the-original shape as
though it were an established practice on this tree. `32.1-RESEARCH.md` § Contradictions row 9
measured that it is not, and graded the discrepancy LOW with the instruction to record it as new.
That is what this section does. A convention somebody assumed and a convention this repository
follows are different things, and an erratum whose own first sentence borrows authority it does not
have is a poor start for a document about a misattributed citation.

---

*Corrects: `.planning/phases/32-board-projector-cli-dashboard/32-40-ADVERSARIAL-REVIEW.md` (left byte-unchanged)*
*Issued: 2026-09-18, phase 32.1 plan 32.1-11 — ledger row 209*
