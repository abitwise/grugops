---
phase: 28-kit-consistency-audit
fixed_at: 2026-08-12T14:33:00Z
review_path: .planning/phases/28-kit-consistency-audit/28-REVIEW.md
iteration: 1
findings_in_scope: 17
fixed: 17
skipped: 0
status: all_fixed
---

# Phase 28: Code Review Fix Report

**Fixed at:** 2026-08-12
**Source review:** `.planning/phases/28-kit-consistency-audit/28-REVIEW.md`
**Iteration:** 1
**Dispatch:** sequential on `main`, no worktree isolation (standing guidance for this repo)

**Summary:**
- Findings in scope: 17 (CR-01…CR-04, WR-01…WR-13; no Info findings existed)
- Fixed: 17
- Skipped: 0
- Commits: 15 (`cf131de`…`c42b9e5`), each with its `.ts` source and its compiled `.js` twin in the same commit

**Four of the seventeen need a human decision confirmed, not just a diff read** — they changed
gate POLICY or overrode a review suggestion. They are marked `requires human verification` below
and collected in a checklist at the end.

## Verification — the actual output

Every command below was run in the **main checkout** (no worktree was created; this repo's standing
guidance is sequential-on-`main`), against `HEAD` = `c42b9e5`, after the final commit. Numbers are
transcribed from the runs, not from memory.

| command | result |
|---|---|
| `npm run typecheck` | **exit 0** (`tsc --noEmit && tsc -p tsconfig.tests.json`, no output) |
| `npm run freshness` | **exit 0** — `All build outputs fresh: 43 committed .js file(s) match a fresh tsc rebuild.` |
| `npm run check:public-docs` | **exit 0** |
| `npm run check:claim-anchors` | **exit 0** |
| `npm run check:audit-register` | **exit 0** |
| `npm run check:nul-bytes` | **exit 0** |
| `npm run generate:safety-surface` | **exit 0** |
| `node scripts/check-foundation-guards.js` | **exit 0** |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **46 files / 1596 passed / 2 skipped (1598)**, 85.09s |

**Suite delta against the handoff baseline:** 46 files / 1561 passed / 2 skipped → 46 files /
**1596** passed / 2 skipped. **+35 tests, zero new skips, zero failures.** The 2 skips are the
pre-existing ones; the new `it.skipIf` loader case RAN here because Ruby 3.1.0 is present on this
box (it is the case that will now show as a *skip* rather than a false pass on an image without it).

**`npm test` was NOT run** — it triggers the live claude-CLI e2e lane. The e2e lane is therefore
**unverified by this pass** (`UNKNOWN - verify`).

**Working tree at exit:** only the pre-existing ` M human-notes.txt` and `?? .gsd/`, neither staged.
`docs/audit/28-prepass-evidence.md` was regenerated once during investigation and **reverted** — see
WR-04.

## How each fix was proven, and the one place that discipline could not reach

Every blocker and every warning that changes a gate's verdict carries a test that **was run against
the PRE-FIX committed `.js` and observed failing**, then passes after. Where a RED-before was not
achievable, that is stated explicitly rather than papered over. Three cases could not be RED-before,
and all three say so:

- **WR-06** — the fix required exporting the function under test, so a pre-fix run fails with
  `is not a function` rather than with the defect. Replaced by a direct measurement of the pre-fix
  predicate vs the post-fix one over identical input (recorded below).
- **WR-10** — the helper being fixed lives in the test file itself, so "pre-fix" and "post-fix"
  cannot coexist in one run. Replaced by an old-vs-new measurement over the discriminating inputs.
- **WR-11 point 2** (`-z` on the `--eol` twin) — **passes on both builds**, and the review's stated
  hazard was measured to be *wrong*. Labelled in the test as a control on the premise, not a
  regression test. See WR-11.

## The structural decision, taken once instead of four times

The review named the class: *a vacuity floor that exists at the collection level but not at the
element level*. CR-01, CR-03 and CR-04 are that shape, and CR-04 was **the third disagreeing
definition of "blank" inside one phase**.

Rather than patch three call sites, `audit-model.ts` now declares **one element-level blank
authority** — `BLANK_MARKERS` (a closed set with a two-sided pinned cardinality) behind the exported
`isBlank` — and `check-audit-register`, `check-claim-anchors` and `readRegistry`'s own empty-verbatim
refusal all **consume** it. A structural control asserts that no other `scripts/` source re-derives
the predicate, and asserts positively that both gates import it. The control's bound is stated in
the test: it catches the shape that was actually shipped three times, not the class.

The same "derive the set, assert the count" move was applied twice more, beyond what the findings
asked for:

- **WR-05** — instead of fixing only the file the review named, a control scans every `scripts/`
  source declaring an `isEntry` guard, **pins the cardinality two-sided at 7**, and asserts both
  idioms across all of them. That surfaced a divergence the review did not name
  (`check-nul-bytes.ts`'s `NUL_SCAN_ROOT ??`), fixed in the same commit.
- **WR-12** — the uncounted arm is **SET-equal to `[PROTOCOL_FILE]` in both directions**, taken from
  `audit-prepass`'s single declaration rather than retyped, instead of a bare count.

## Fixed Issues

### CR-01: `oracleWr05Wording` passed vacuously when a 5-tool-table row was deleted

**Files modified:** `scripts/check-uat-oracles.ts`, `scripts/check-uat-oracles.js`, `scripts/check-uat-oracles.test.ts`
**Commit:** `cf131de`
**Applied fix:** `if (rows.length === 0) continue;` → two-sided presence (`rows.length !== 1`),
matching the shape the beat scan in the same function already uses. The justifying comment
("README's table omits headers some rows carry") was **re-measured and is false** — both
`adapters.md` and `agent-factory/README.md` carry exactly one bold-tool-name row for each of the five
CLIs (5/5 in each file, measured 2026-08-12) — so it was removed rather than preserved.

**RED-before:** the new deleted-row case run against the pre-fix committed `.js` failed with
`expected +0 not to be +0` — the gate exited **0** with the Claude Code row removed from both tables,
having printed `PASS  WR-05 wording: … the flip is asymmetric`. A second new case pins the `>1`
direction so the `!== 1` form did not trade one blind spot for another.

---

### CR-02: `readRegistry()` silently last-wins on a duplicate metadata key

**Files modified:** `scripts/audit-model.ts`, `scripts/audit-model.js`, `scripts/audit-model.test.ts`
**Commit:** `adc2325`
**Applied fix:** the metadata region now refuses a duplicate key and refuses an unrecognised line,
both naming the claim id and the line. Blank lines stay legal (the region carries them). This makes
`readRegistry` consistent with `readRegister` (which already refuses duplicate `file` keys and
duplicate `finding_id`s) and with `context-io.parseNote`.

**RED-before:** both refusal cases run against the pre-fix committed `.js` failed with an **empty
error message** — nothing was thrown. A third case ("still admits the blank lines the region
legitimately carries") passed before and after, so the refusal discriminates rather than blanket-
rejecting.

---

### CR-03: an EMPTY verbatim fence passed the D-16 byte comparison

**Files modified:** `scripts/audit-model.ts`, `scripts/audit-model.js`, `scripts/audit-model.test.ts`
**Commit:** `7a1d9dd` (with CR-04 — one structural change closes both)
**Applied fix:** refused in the parse authority via the shared `isBlank`, so an empty, whitespace-only
or placeholder-glyph fence cannot reach any consumer of `readRegistry()`. Refusing at the gate
instead would have left the hole open for the next consumer.

**RED-before:** three new cases (empty / whitespace-only / placeholder glyph) run against the pre-fix
committed `.js` all failed. A fourth pins that a real one-line claim still parses.

---

### CR-04: `check-audit-register` did not treat `—`/`-` as a blank observation

**Files modified:** `scripts/audit-model.ts` (+`.js`, `.test.ts`), `scripts/check-audit-register.ts` (+`.js`, `.test.ts`), `scripts/check-claim-anchors.ts` (+`.js`)
**Commit:** `7a1d9dd`
**Status:** **fixed: requires human verification** — the fix widens two policy sets.
**Applied fix:** `isBlank` exported as the single element-level authority; both gates consume it.
Two set widenings, each a judgement call a human should confirm:

- `BLANK_MARKERS` gained the **en dash `–`** (the review measured it passing all three predicates;
  it is a placeholder glyph in the same class as the em dash). This also tightens `readRegister`'s
  `deferred`/`accepted` obligations. **Measured safe on the live artifacts:** the committed register
  contains exactly one en dash and it is inside prose, never a whole cell.
- `BARE_OBSERVATIONS` gained **`?`, `tbd`, `todo`** — bare NON-answers, deliberately kept out of
  `isBlank` because `isBlank` also decides whether a `deferred` row named a target phase, and "tbd"
  as a target phase is a different question from "tbd" as an observation.

**RED-before:** the placeholder-glyph observation case and the extended bare-word loop both failed
against the pre-fix committed `.js`.

---

### WR-01: `check-public-docs-vocabulary` crashed with ENOENT when `agent-factory/README.md` was absent

**Files modified:** `scripts/check-public-docs-vocabulary.ts` (+`.js`, `.test.ts`)
**Commit:** `0a5977b`
**Applied fix:** `kitReadmeMembers()` records a named derivation refusal and returns `[]`. This also
makes the per-part vacuity floor **reachable for this part for the first time** — a one-element
literal can never trip a length-zero floor, so the crash had been the only way the gate could notice
the file was gone.

**RED-before:** the new case run against the pre-fix committed `.js` failed with the ENOENT stack
trace on stderr.

---

### WR-02: `Number.parseInt` accepted trailing garbage in `findings` and `category`

**Files modified:** `scripts/audit-model.ts` (+`.js`, `.test.ts`)
**Commit:** `f786671`
**Applied fix:** an anchored `NON_NEGATIVE_INT_RE` over the **raw cell**, following the
`ParsedRegisterRow` idiom the file already declares for `counted`; Table B gained the matching
`ParsedFindingRow`. The existing `Number.isInteger` check is kept — the two answer different
questions (what the author WROTE vs what the value IS). The ordered refusal sequence is unchanged:
duplicate keys still precede every value check.

**RED-before:** both refusal cases failed against the pre-fix committed `.js` (nothing thrown).
A third pins that `0` and `10` still parse.

**One correction made during the fix, recorded because it is a fact about the parser:** a padded
cell (`" 1"`) is deliberately **not** in the refused set. `splitRow()` trims every cell before the
value is seen, because padding is markdown table formatting and not part of the value. My first
draft of the test asserted otherwise and was wrong; the code was right.

---

### WR-03: `auditSetFiles()`'s `join()` rationale was inverted

**Files modified:** `scripts/audit-prepass.ts` (+`.js`, `.test.ts`)
**Commit:** `1657a21`
**Applied fix:** `/` template, and the rationale corrected to the truth. The **test encoded the same
wrong assumption** (it built its expectation with `join`) and is corrected; a new case asserts the
property on the VALUES (no backslash, anchored repo-relative shape) so it runs on a posix runner, and
asserts the two Phase-28 modules' derivations are set-equal.

Functional impact on darwin is nil (`join` already emits `/`), so
`docs/audit/28-prepass-evidence.md` is byte-unchanged by this commit.

---

### WR-04: the pre-pass evidence artifact's determinism claim was false

**Files modified:** `scripts/audit-prepass.ts` (+`.js`, `.test.ts`)
**Commit:** `c570c36`
**Status:** **fixed: requires human verification** — the review offered two options and I chose (b)
against (a), on the merits. A human should confirm the reasoning.

**Applied fix — option (b), and why (a) was declined.** Option (a) was: drop the date line and fold a
freshness compare into `check-audit-register` the way `renderSafetySurface` already is. **Declined.**
This artifact is a **dated point-in-time record** of the D-06 mechanical pre-pass under a human read
that happened once. Phase 29 rewrites the very prose it quotes, so a freshness gate would red on
every unrelated edit — the failure mode the claim registry's own `line` section says trains people to
ignore a red gate — and the only way to clear it would be to **regenerate rows nobody adjudicated**
and publish them as the evidence for a read that did not re-happen. That is fabricating evidence,
which CLAUDE.md forbids outright.

**A NEW FACT MEASURED WHILE FIXING THIS, recorded rather than gated.** The committed
`docs/audit/28-prepass-evidence.md` **has already drifted**: regenerating it today changes the date
**and at least one row**, because a later plan rewrote kit prose the committed rows quote
(`brownfield-mapper.md:35`, "Phase-4 brownfield bootstrap workflow" → "brownfield bootstrap
workflow"). The regeneration was **reverted**; the artifact is left as committed and the module now
says plainly that it is not freshness-gated, that it has drifted, and which single line a reader must
discount before reading a divergence as a tree change.

The `"re-runs BYTE-IDENTICALLY"` case asserted a property the module does not have and passed only
because both runs land on one calendar day. It now discounts the date line **by name** and asserts
exactly one line is discounted (so the discount cannot hide real drift); a new case asserts
byte-identity where it genuinely holds — on `runPrepass()`'s rows.

---

### WR-05: `check-claim-anchors` used a different `isEntry` and `ROOT` idiom from every sibling

**Files modified:** `scripts/check-claim-anchors.ts` (+`.js`, `.test.ts`), `scripts/check-nul-bytes.ts` (+`.js`)
**Commit:** `5c95685`
**Applied fix:** both idioms adopted; the comment that cited a precedent the file did not follow is
corrected. Paired with the derived, count-pinned control described above — which surfaced
`check-nul-bytes.ts`'s `NUL_SCAN_ROOT ??`, a divergence the review did not name, fixed in the same
commit for the same reason.

---

### WR-06: `grepSubstringInsensitive` lowercased the subject but not the needle

**Files modified:** `scripts/check-public-docs-vocabulary.ts` (+`.js`, `.test.ts`)
**Commit:** `a484789`
**Applied fix:** the needle is lowercased at the point of use, so the invariant is enforced on the
CONSUMER rather than assumed on the data. The function is exported so the case can drive it with a
synthetic mixed-case needle — driving it through `RETIRED_PROSE_FORMS` would have meant mutating the
very list the D-10 control freezes.

**No RED-before was possible** (the export did not exist pre-fix, so a pre-fix run fails with
`is not a function`). **Measured instead**, pre-fix predicate vs post-fix predicate over `README.md`:

| needle | pre-fix hits | post-fix hits |
|---|---|---|
| `"grugops"` | 11 | 11 |
| `"GRUGOPS"` | **0** | 11 |
| `"GrUgOpS"` | **0** | 11 |

---

### WR-07: the registry's `line:` field was required, never format-validated, never consumed

**Files modified:** `scripts/audit-model.ts` (+`.js`, `.test.ts`)
**Commit:** `e55d83c`
**Status:** **fixed: requires human verification** — **one half of the review's fix was declined on
the record.**

**Declined:** comparing the declared number against the anchor's actual index.
`docs/audit/28-claim-registry.md` already documents the opposite in a section of its own — *"Why
`line` is recorded and not checked"*: Phase 29 rewrites prose for a living, and an assertive line
number would go red on every unrelated edit above a claim, *"training people to ignore a red gate,
which is the failure mode this milestone has spent itself fighting."* Overturning a documented
decision to buy a gate that reds on edits it is not about is not an improvement.

**Applied:** the genuinely missing half — a **required key that was never validated at all**, so
`line: banana` parsed green while reading to a human as authoritative provenance. Now held to
`N` or `N-M`, the same canonical-form-plus-refusal doctrine the ids carry. Both shapes are live
(measured on the committed registry 2026-08-12: 38 rows, 19 single values and 19 ranges), and a
second case pins that both still parse. The `ClaimRow.line` field now states at the code that its
value is advisory, citing the registry's section and its reason.

**RED-before:** the refusal case failed against the pre-fix committed `.js` (nothing thrown).

---

### WR-08: non-markdown registry rows were exempt from ALL verification

**Files modified:** `scripts/check-claim-anchors.ts` (+`.js`, `.test.ts`), `docs/audit/28-claim-registry.md`
**Commit:** `d1fbb8e`
**Status:** **fixed: requires human verification** — it edits a committed audit artifact's prose.
**Applied fix:** the gate reads the named file as raw bytes and refuses when the row's verbatim block
is not present (`Buffer.includes` — the same byte exactness as the anchored comparison), counting the
row as a performed comparison. On the real tree the PASS line moves from 37 to **38** verbatim
comparisons. The PASS line's "its freshness is held by its registry row alone" clause is narrowed to
"its POSITION is unheld; its verbatim text is still PRESENCE-checked".

**The registry prose is corrected in the same commit**, because the fix made a committed sentence
false: *"The residual is unchanged for the next editor. A future rewrite of `README.md:4` that
forgets the manifest will still pass every gate in this repository green."* A false sentence left
standing in an audit artifact is the exact defect this phase exists to remove. The section now states
what changed **and what residual remains**: presence is not position and not uniqueness, and a
position check for JSON would need a path expression rather than a line number (`UNKNOWN - verify`).

**RED-before:** all three new cases failed against the pre-fix committed `.js`, **including the
adjacency half** (a present verbatim must PASS and be counted), so the check is not merely
always-red.

---

### WR-09: the byte-fidelity fuzz's "documented blank drop" carve-out was broader than its contract

**Files modified:** `scripts/context-io.test.ts`
**Commit:** `c42b9e5` (with WR-13 — the WR-13 fix restructures the case this predicate lives in)
**Applied fix:** extracted as a named `isDocumentedBlankDrop` stating the contract directly — the
remainder was nulled, the loss is a **prefix** of the input, that prefix is blank, and its byte length
accounts for the whole delta. The prefix conjunct is what closes the hole.

**Measured, old vs new**, on a real recovered note with its trailing `\n` dropped (delta −1):

| predicate | excuses a truncated ADMITTED note? |
|---|---|
| old (`output.trim() === input.trim()`) | **true** — the regression was excused |
| new (`isDocumentedBlankDrop`) | **false** |

**A fact the review did not have, measured and pinned:** the corpus **never reaches this branch** —
all 200 cells have delta 0. So the count is pinned at **zero** with a message explaining what a
non-zero value would mean, and the predicate is exercised **directly in both directions** by a new
case rather than relying on a corpus that cannot reach it. Corpus unchanged: same digest
`7cc39f5580332c08`, same 200 cells, same loader result.

---

### WR-10: `consumingRemainder()` treated zero-width assertions as consuming atoms

**Files modified:** `scripts/check-uat-oracles.test.ts`
**Commit:** `993ebc3`
**Applied fix:** the classifier's premise was false **twice over**, and the review named only one
half. (1) `^`, `$`, `\b`, `\B` survived the lookaround strip and are all zero-width. (2) The
membership prefilter was `/^\(\?[=!<]/` — *"the body STARTS with a lookaround"* — so the review's own
example `/\b(?=.*a)(?=.*b)/` was excluded **before** the remainder was computed. Membership is now
"contains a lookaround AND consumes nothing".

The `.trim()` is dropped, **measured rather than reasoned**: a literal space IS a consuming atom, and
`String.trim()` also eats U+FEFF, so `/^<U+FEFF>/` (two real sites in `frontmatter.test.ts`) read as
consuming nothing. Trimming produced a false positive in one direction while the missing zero-width
strip produced a false negative in the other.

**Re-ran the scan after widening, as the review asked:** it still finds **exactly one** site, the
already-sanctioned `String.split()` separator in `compactor.test.ts`. **No new site surfaced, so no
new named exemption was needed** — and that is a measurement, not an assumption.

**Old vs new**, measured on the discriminating inputs:

| body | old remainder | old flags? | new remainder | new flags? |
|---|---|---|---|---|
| `\b(?=.*a)(?=.*b)` | `\b` | no | `""` | **yes** |
| `^(?=.*a)$` | `^$` | no | `""` | **yes** |
| `(?=x) ` (literal space) | `""` | **yes** (false positive) | `" "` | no |

---

### WR-11: `check-nul-bytes` could die outside a git worktree; its `--eol` parse contradicted its own `-z` rationale

**Files modified:** `scripts/check-nul-bytes.ts` (+`.js`, `.test.ts`)
**Commit:** `74d0930`
**Applied fix, three points:**

1. One `git()` helper throws a named refusal; `runAll()` reports it through `fail()`. Both
   derivations were unguarded, so a non-repository root made the gate die with a Node stack trace.
2. `-z` on the `--eol` twin — **and the stated reason is now the measured one, which is not the
   review's.** The review named the hazard as `out.split("\n")` breaking on a newline in a filename.
   **Measured on this box, that is NOT the hazard:** `git ls-files --eol` C-quotes such a path
   (`"a\nb.md"`, on one line, with or without `core.quotePath=false`), so the row count survived. The
   real divergence is that same quoting: with `-z` git emits the path RAW, so `trackedPaths()`
   (already `-z`) and this twin named **different strings for the same file**, and `runAll()` compares
   those strings as sets. The module header and the test are corrected to the measurement.
3. `unreadable` split into "MISSING FROM THE WORKING TREE" and "PRESENT BUT UNREADABLE", both still
   failing closed, both saying "This is not a NUL finding".

**RED-before:** the non-repository case and the missing-path case both failed against `HEAD`'s
committed `.js`. **The `-z` case passes on BOTH builds** and is labelled in the test as what it is —
a control on the premise, not a regression test — with the pre-fix asymmetry (`"a\nb.md"` vs
`a\nb.md`) asserted explicitly so the fix is measured rather than claimed.

**Live PASS line after the fix:** `1455 tracked file(s) scanned as raw bytes, ZERO carrying a NUL
byte … 0 path(s) missing from the working tree and 0 path(s) present but unreadable`.

---

### WR-12: equality one constrained only `counted: yes` rows, leaving uncounted rows unbounded

**Files modified:** `scripts/check-audit-register.ts` (+`.js`, `.test.ts`)
**Commit:** `559969f`
**Status:** **fixed: requires human verification** — it changes gate policy (a second uncounted row
now reds).
**Applied fix, two arms, both reported independently of equality one so the failures stay
distinguishable in one run:** every row's file must exist on disk; and the uncounted arm is
**SET-equal, both directions, to exactly `[PROTOCOL_FILE]`**, taken from `audit-prepass`'s single
declaration rather than retyped. A bare count would pass while a decoy displaced the protocol row.

**The pre-existing "SECOND uncounted row" case keeps its point and inverts its assertion.** It exists
to show equality one FILTERS on `counted: yes`, and it used to show that by asserting the whole gate
stayed green — which also asserted that an uncounted row was constrained by nothing. It now asserts
equality one stayed **silent** while the pin fired, which is the sharper demonstration.

**RED-before:** both new/inverted cases failed against `HEAD`'s committed `.js`; the missing-file
case failed with `expected +0 to be 1` — the pre-fix gate exited **0** with an uncounted row naming a
file that does not exist.

---

### WR-13: the meaning oracle was bound to a hardcoded `/usr/bin/ruby` and degraded to a green pass

**Files modified:** `scripts/context-io.test.ts`
**Commit:** `c42b9e5`
**Applied fix:** the interpreter resolves through `PATH` (overridable via `YAML_ORACLE_RUBY`), and
the loader oracle is its **own case gated with `it.skipIf`**, so an image without Ruby reports a SKIP
in the suite summary. **Split rather than `ctx.skip()` inside the combined case, deliberately:** the
primary byte-count oracle must keep reporting its own green, and `ctx.skip()` would have discarded
that signal along with the loader's. A third, always-running case records which interpreter was
probed and what it answered, so absence is never silent.

Observed on this box: `[28-08 residual-2 fuzz] loader interpreter=ruby available=true psych=3.1.0`
and `loader=ruby/Psych 3.1.0 loader-rejected=84 meaning-divergences=0` — identical to the pre-fix
numbers, so the restructure did not change what the oracle measures.

## Skipped Issues

None. All 17 in-scope findings were fixed.

Two carry a **deliberate deviation from the review's suggested fix**, argued in the record above and
in the commit messages rather than silently applied — WR-04 (option (b) chosen over option (a)) and
WR-07 (the line-VALUE assertion declined; the line-FORM validation applied).

## What a human should confirm before this phase advances

- [ ] **CR-04** — the two set widenings are policy: `BLANK_MARKERS` gaining the en dash `–` (which
      also tightens `readRegister`'s `deferred`/`accepted` obligations), and `BARE_OBSERVATIONS`
      gaining `?` / `tbd` / `todo`.
- [ ] **WR-04** — the choice of option (b) over option (a), and the decision to leave the **measured
      drift** in `docs/audit/28-prepass-evidence.md` recorded rather than gated or regenerated.
- [ ] **WR-07** — the refusal to assert the `line` VALUE, on the grounds that the registry documents
      the opposite decision with a reason.
- [ ] **WR-08** — the edit to `docs/audit/28-claim-registry.md`'s prose (a committed audit artifact),
      correcting a sentence the fix made false.

Two further items are **not** review findings but were measured during this pass and are recorded so
they are not lost:

- `docs/audit/28-prepass-evidence.md` is **stale against the live tree** (WR-04). Nothing gates it,
  by decision.
- The **e2e lane is unverified** by this pass — `npm test` was deliberately not run (`UNKNOWN -
  verify`).

---

_Fixed: 2026-08-12_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
