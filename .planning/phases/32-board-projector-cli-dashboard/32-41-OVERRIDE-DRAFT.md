# Phase 32 — Ready-to-paste `overrides:` blocks for every still-open must-have

**Drafted:** 2026-09-16, by plan `32-41`, Task 2, against `main` at HEAD `b6f6bd45`.
**What this document is:** text a human may accept verbatim. It is a DRAFT. Nothing here is
applied, and this plan applies nothing. `accepted_by` and `accepted_at` are placeholders because a
human fills those and an agent must not.

**How to use it:** if the human chooses Option A at plan `32-41`'s Task 3 checkpoint, the verifier
pastes the chosen blocks into a future verification's frontmatter, with the placeholders filled. The
verifier applies an accepted override in its own pass; this plan does not.

**Every control character named in this file is written as escape TEXT.**

---

## 0. Is an override needed at all?

Yes. `32-40-ADVERSARIAL-REVIEW.md` § 12 records **nine** findings, of which **eight are OPEN**
(F-14 through F-21) and one is CLOSED (F-22, a harness finding). Option D — "nothing is open" — is
therefore **NOT available**, and this document does not offer it as a single line saying no override
is needed.

**One thing has changed since the verifier drafted its own block, and it is stated first because it
would otherwise mislead.** `32-VERIFICATION.md` drafted an override for the DASH-03 must-have
covering the duplicate-id-loser self-contradiction. **That gap is now measured CLOSED** —
`32-40-ADVERSARIAL-REVIEW.md` § 3.1 and § 3.2 reproduced it independently and found `readErrors` and
`conflicts` stating the same join state, for a two-file and a three-file contest. The verifier's
drafted block is for a residual that no longer exists and **should not be pasted as written**. Block
B below occupies the same must-have but covers a DIFFERENT residual (F-14), and says so.

---

## 1. The five phase must-haves, and which findings bear on each

The must-have texts are `ROADMAP.md`'s Phase 32 Success Criteria, quoted verbatim.

| # | Must-have | Reqs | Open findings bearing on it | Block |
|---|---|---|---|---|
| 1 | board-model.ts is the only board grammar; grammars pinned by spec + parse-oracle fuzz | DASH-01, DASH-02 | F-15, F-19, F-21 | **A** |
| 2 | one typed FactorySnapshot surfaces disagreement in `conflicts[]` | DASH-03 | F-14 | **B** |
| 3 | live follow via directory `fs.watch` + polling floor + debounce; never a torn/partial/ENOENT board | DASH-04, DASH-05 | F-20 | **C** |
| 4 | the dashboard CANNOT write; an import-graph guard proves it | DASH-06 | F-16, F-17, F-18 | **D** |
| 5 | `--json`/`--once`/non-TTY; degrades visibly; stable shape; zero deps, no socket | DASH-07, DASH-08 | F-14 (render path) | **E** |

All five carry at least one open finding. F-14 bears on two must-haves and appears in blocks B and E.

---

## 2. The blocks

Paste the block or blocks the human accepts. Each is valid YAML under an `overrides:` key.

### Block A — must-have 1 (DASH-01, DASH-02)

```yaml
overrides:
  - must_have: "scripts/board-model.ts is the only board grammar in the tree — the column-heading parser is extracted from and deleted in validate-agent-factory.ts with the WR-03 prefix-match hardening ported verbatim — and the ticket-row and WIP-number grammars are pinned by a written spec plus a parse-oracle fuzz suite whose adversarial corpus includes the board's own large HTML-comment documentation block. (DASH-01, DASH-02)"
    reason: "WHAT THE RESIDUAL IS: three detection-robustness defects in the PROOF that one grammar is the only grammar, each an enumerated set one spelling wide. F-15: the split-reader census reads named imports only, so a second ticket reader assembled through a namespace import or a two-hop re-export is invisible — both were built as REAL WORKING READERS returning {status:in-review,column:In Review} while the census exited 0 at 130/130. F-19: the one-authority rule for TOOLCHAIN_CHECK_SCRIPTS matches reads by the identifier's literal text, so a second unguarded read reached through an alias passes both the count pin and the every-read-is-guarded assertion. F-21: the check-target step counter's separator alphabet excludes a single pipe, a newline, a leading parenthesis, a wrapper command, a background separator and a command substitution. F-15, F-19 and F-21 are all CREATED BY this round's own fixes (7a3ae592, c5fc977a, c5163183). WHAT THE RESIDUAL IS NOT: it is not a live second board grammar and not a live second ticket-frontmatter reader. The census's own verdict on the tracked tree is exactly-one-authority; NOT_A_SECOND_AUTHORITY_COUNT is pinned two-sided at 9 and did not move; no alias of the register exists; and all 11 check:* scripts were measured entry by entry with zero instances of any excluded separator shape. NOTHING IS HIDDEN FROM THE OPERATOR by these three: none of them changes what the dashboard prints. What they weaken is the PROOF, not the property — a future second authority added through one of the named shapes would not be caught by the gate that exists to catch it, and would have to be found by reading. That is the cost being accepted, stated without softening."
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

### Block B — must-have 2 (DASH-03)

```yaml
overrides:
  - must_have: "One typed FactorySnapshot joins board, ticket frontmatter, queue state, context notes, and traceability, and surfaces board-vs-frontmatter disagreement in a conflicts[] field rather than silently resolving it. (DASH-03)"
    reason: "THIS IS NOT THE RESIDUAL 32-VERIFICATION.md DRAFTED A BLOCK FOR. That one — the duplicate-id loser's conflicts[] entry contradicting its own readErrors — is measured CLOSED by 32-40-ADVERSARIAL-REVIEW.md sections 3.1 and 3.2, independently reproduced for a two-file and a three-file contest. WHAT THE RESIDUAL IS: F-14, one field over. TICKET_CONTROL, the grammar's refusal class, is /[\\x00-\\x08\\x0b-\\x1f\\x7f]/ and does not cover the C1 block, so a ticket whose id carries U+0085 is ADMITTED; RENDER_STRIPPED, the render class, is /[\\u0000-\\u001F\\u007F-\\u009F]/g and DELETES it. presenceActual and the ticket-unplaced arm then state, twice in one snapshot, that the file declares an identifier it does not declare. The difference set between what the grammar refuses and what the renderer deletes is measured at 34 code points, 32 of them admissible in a ticket value. WHAT THE RESIDUAL IS NOT: it does not silently RESOLVE a disagreement — the conflict is still raised and still reaches the operator, so the must-have's own verb is satisfied. No byte leaves the tree, no write capability is involved, and no ticket is dropped from the snapshot. IS ANYTHING HIDDEN FROM THE OPERATOR? PARTLY, AND THAT IS THE HONEST ANSWER RATHER THAN A COMFORTABLE ONE. Unlike the closed round-3 gap, where both the true state and the false clause appeared in the same document, here the true identifier appears NOWHERE: the C1 byte is deleted on every channel, so the operator sees a misquoted identifier with no second field to correct it. A reader who searches the tree for the printed identifier finds nothing; a reader who re-types it produces a different identifier. This is narrower in population than the closed gap (only ids carrying a C1 character) but it is NOT the same shape, and a block that called it 'both facts visible' would be overstating its own harmlessness."
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

### Block C — must-have 3 (DASH-04, DASH-05)

```yaml
overrides:
  - must_have: "The dashboard follows a live run using directory-level fs.watch plus a mandatory polling floor and debounce, and never renders a torn read, a partial parse, or an ENOENT as an empty board — a stale snapshot shows a visible stale badge over the last good read. (DASH-04, DASH-05)"
    reason: "WHAT THE RESIDUAL IS: F-20. Commit 70cbd447 moved the watch HANDLE onto the resolved path (deps.watch(decision.real, ...) at board-dashboard.ts:1189), but one consumer of the same containment decision still uses the unresolved spelling — the liveness gate at :1184 reads if (!deps.exists(dir)). A check-then-open window therefore remains between the two calls. INHERITED, not created by this round: the gate was never part of the finding and was not moved. WHAT THE RESIDUAL IS NOT: it is not a path-traversal escape and not a way to make the dashboard read outside its root. The blast radius was measured rather than argued: existsSync follows symlinks, so :1184 returns the same answer as decision.real would EXCEPT across a swap landing between the two calls; the thing that can hold a path open — the handle — is already decision.real; and the watch callback ignores its filename argument entirely, so no content crosses the seam in any case. The reader performs its own independent containment check on every actual read. NOTHING IS HIDDEN FROM THE OPERATOR: the rendering behaviour, the stale badge and the watch-failure record are all unaffected; the residual is a liveness decision taken on a stale spelling, not a wrong thing printed. The cost being accepted is that a future change which makes the callback consume filename, or which gives the :1184 arm a side effect, would inherit an unresolved-path consumer nobody re-examined."
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

### Block D — must-have 4 (DASH-06)

```yaml
overrides:
  - must_have: "The dashboard cannot write: an import-graph guard proves its module tree holds no mutating node:fs symbol, so read-only is mechanically enforced rather than asserted in prose. (DASH-06)"
    reason: "WHAT THE RESIDUAL IS: three defects in the guard's SCANNER and in the ORACLE built to check the scanner. F-16: the CR-01 fix blanks string literals but not REGULAR-EXPRESSION literals, so a tracked .js carrying a from-clause inside a regex interior fabricates a specifier and makes the closure refuse an edge nobody wrote. F-17: a template-literal dynamic import is invisible to the scanner, AND the two-sided parser oracle asks ts.isStringLiteral on the same argument — THE SAME QUESTION — so the instrument built to prove the scanner cannot detect this class of miss; the oracle half is CREATED BY d276f4e3, this round. F-18: the WR-06 widening relocated the refusal for the members it moved, so a bare-specifier writer is now refused by ONE predicate (the ALLOWED_BUILTIN_SPECIFIERS equality) where a foreign one is refused by TWO. WHAT THE RESIDUAL IS NOT: it is NOT a live write bypass, and that was tested rather than assumed. Ten write plants were run through the guard this round and all ten exit 1; the unplanted control exits 0 at 175 of 175; plant S8 puts F-17's exact template-literal shape into the committed scripts/board-read.js and the guard exits 1 at 19 failed of 156 with the acquisitions PREMISE case red; plants S7 and S9 exercise F-18's moved members and both exit 1. The two-sided oracle over all 65 tracked .js/.mjs reports fabricated 0, missed 0. F-16's failure direction is OVER-refusal — a gate that cannot start — not silent under-detection. NOTHING IS HIDDEN FROM THE OPERATOR: the dashboard's read-only behaviour is unchanged and the guard still refuses every write shape anyone has planted. THE COST BEING ACCEPTED, NAMED: F-18 leaves one class of specifier defended by a single predicate rather than two, and 32-40 surfaced that as a decision rather than a measurement precisely because whether one predicate suffices is a judgment nobody has made yet. Accepting this block accepts that judgment by default."
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

### Block E — must-have 5 (DASH-07, DASH-08)

```yaml
overrides:
  - must_have: "--json, --once, and non-TTY modes work for CI and piping; the renderer degrades visibly rather than showing a confident wrong board; the snapshot shape is stable enough for a future web renderer to consume unchanged; and the dashboard adds zero runtime dependencies and opens no listening socket this milestone. (DASH-07, DASH-08)"
    reason: "WHAT THE RESIDUAL IS: F-14 reaching this must-have through the RENDER path rather than the join path. RENDER_STRIPPED deletes a C1 character from a ticket identifier on the way out, so the --json document and the terminal render both carry a misquoted identifier. The affected fields are the ticketId and actual of the row-without-file and ticket-unplaced conflicts. WHAT THE RESIDUAL IS NOT: it is not a mode failure and not a degradation failure. --json, --once and non-TTY all work; the stale badge and the visible-degradation behaviour are untouched; the snapshot SHAPE is unchanged, so a future web renderer consuming it is unaffected; and the zero-dependency and no-socket halves were re-measured this round and both hold — package.json has NO dependencies key at all, devDependencies is exactly three dev-and-CI-only entries, and zero server or socket API occurrences were found across the three modules. IS ANYTHING HIDDEN FROM THE OPERATOR? YES, FOR THIS NARROW POPULATION, AND IT IS STATED PLAINLY: the deleted C1 byte appears on NO channel, so the operator cannot recover the true identifier from the document. The renderer is not degrading visibly here — it is rendering confidently, and what it renders is one character short. That is the shape this must-have's own words exist to prevent, and calling it cosmetic would be softening it. What bounds it is the population: only identifiers carrying one of 32 admissible C1 code points are affected, and no such ticket exists on the tree today."
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

---

## 3. The open-item balance

An item may be OPEN; an item may never be ABSENT. The two totals below are counted from the sources
rather than asserted.

**ITEMS STILL OPEN, derived from the findings register and the ledger:**

```
findings register (32-40-ADVERSARIAL-REVIEW.md § 12), OPEN rows ......  8   (F-14 … F-21)
carried ledger items re-measured this round (deferred-items.md) ......  6
undecidable items from 32-REVIEW-FIX.md § `UNKNOWN - verify` .........  3
new residual produced by this round (plan 32-41, Task 2) .............  1
                                                                      ---
                                                                       18
```

**HOMES WRITTEN FOR THEM this round:**

```
override blocks drafted in this document ............................   5
rows written into deferred-items.md by plan 32-41 ...................  10
rows appended to .planning/WINDOWS.md by plan 32-41 (ids 200–210) ...  11
```

**THE MAPPING, so the equality is checkable rather than asserted.** Every one of the 18 open items
is named below with the home or homes it has. A home is an override block, a `deferred-items.md`
row, a `WINDOWS.md` ledger row, or a combination.

| # | Open item | Override block | deferred-items.md | WINDOWS.md row |
|---|---|---|---|---|
| 1 | F-14 control byte deleted from a quoted identifier | B and E | — | 200 |
| 2 | F-15 split-reader refusal is one import shape wide | A | — | 201 |
| 3 | F-16 regex literals are not blanked | D | — | 202 |
| 4 | F-17 template-literal dynamic import invisible to scanner and oracle | D | — | 203 |
| 5 | F-18 the bare arm's refusal relocated onto one predicate | D | — | 204 |
| 6 | F-19 the one-authority rule enumerates reads by identifier text | A | — | 205 |
| 7 | F-20 one consumer still uses the unresolved spelling | C | — | 206 |
| 8 | F-21 the step counter's separator alphabet | A | — | 207 |
| 9 | carried: `check:diff-disposition` RED | — | yes | 176 |
| 10 | carried: the live claude-CLI e2e lane, `UNKNOWN - verify` | — | yes | 183 |
| 11 | carried: WR-07's CI-topology half | — | yes | 186, 193 |
| 12 | carried: the production-file census exemption | — | yes | 194 |
| 13 | carried: a key spelling assembled at RUNTIME | — | yes | 184 |
| 14 | carried: `board-tracer.test.ts` as the 9th registry exemption | — | yes | 210 |
| 15 | undecidable: runtime writer value / future dependency | — | yes | 208 |
| 16 | undecidable: the `windows-latest` delivery band | — | yes | 186, 193 |
| 17 | undecidable: a module reached through a nested runner | — | yes | 207 (= F-21) |
| 18 | NEW: `32-40` attributes the WR-04 fix to the wrong commit | — | yes | 209 |

```
items enumerated .................................................... 18
items with at least one home ........................................ 18
items ABSENT from every home ........................................  0
```

**THE TWO TOTALS AGREE.** The row counts differ from 18 by construction and the reason is stated
rather than hidden: eight findings share five override blocks (F-14 has two, and three findings
share block A and three share block D); item 17 shares ledger row 207 with item 8, because a module
reached through an unrecognised runner IS F-21's alphabet gap seen from the other side; and items 11
and 16 share rows 186 and 193 for the same reason. Counting rows would therefore over- or
under-count items. Counting ITEMS AGAINST HOMES is the equality that matters, and it is 18 against
18 with zero absent.

---

## 4. What this document does not do

It applies no override. It marks no requirement checkbox, sets no roadmap phase status, and changes
no line of `STATE.md`. It reaches no verdict on whether Phase 32 is complete, and it recommends no
option — plan `32-41`'s Task 3 checkpoint puts that choice in front of a human, with these blocks
read as written.

```
$ git status --porcelain -- .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/STATE.md
(no output)
```

---

_Drafted by plan `32-41`, Task 2. Round 4 of 4. Applies nothing, decides nothing._
