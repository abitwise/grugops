---
phase: 22-memory-trajectory-compaction-dialable-token-economy
reviewed: 2026-06-18T19:10:00Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - scripts/compactor.ts
  - scripts/context-io.ts
  - scripts/compactor.test.ts
  - scripts/context-io.test.ts
findings:
  critical: 3
  warning: 2
  info: 1
  total: 6
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-06-18
**Depth:** deep (cross-file)
**Files Reviewed:** 4
**Status:** issues_found — ROUND-4 ORACLE IS BYPASSABLE (the 4th bypass)

## Summary

The held-out unit suite is fully GREEN (64/64 in `compactor.test.ts`). As warned, a green
suite is necessary but not sufficient. I constructed **a reproducible bypass family that
makes `checkCarveOut()` exit 0 while a §14-gate-verified finding is dropped and while a
failed-attempt's `by`/`at` provenance is laundered.** This is the same failure shape as
rounds 1–3: the round-4 fix closed the *named* attack shapes (FA byte-equal exemption, raw-id
collision) but left a NEW seam — the **read-path parser is loose where the write-path
validator is strict, and the carve-out adopted only the parser, not the validation.**

Root cause (one defect, three exploit forms): `parseNote()` is a tolerant, last-value-wins
frontmatter reader. It only recognizes a `key: value` line when the key is at **column 0**
(`/^([A-Za-z_]+):\s*(.*)$/`, context-io.ts:218). A provenance line that is **indented by one
space/tab**, or written as **`verified_by : value`** (a space before the colon), is silently
**not parsed** — the field becomes `""` with **no duplicate-key signal and no parse failure**.
`validate()` (the write path) would reject the resulting note (a `finding` with empty
`verified_by` is a structural FAIL), but `checkCarveOut()` never runs `validate()` on raw or
promoted notes — it checks only `kind ∈ NOTE_KINDS` and `duplicateKeys`. The oracle's
strongest protection (`isVerified = verified_by !== ""` → unconditional survival,
compactor.ts:338) is therefore keyed on a field an adversary can make the oracle read as empty
while a human/git reading the file sees it intact.

The IN-02 claim — "the path the carve-out parses provably cannot drift from the path the
writer validates" — is only half-true: the two share the *parser* but not the *validator*.
The parser is loose by contract (it must tolerate pre-id notes, last-value-wins); only
`validate()` tightens it. Adopting the shared parser WITHOUT the shared validation re-opened
the seam.

All bypasses below were reproduced against the COMMITTED `scripts/compactor.js` and exit 0
("carve-out intact"). The corresponding `validate()` call on the same raw text returns a
structural FAIL — proving the write path refuses exactly what the oracle accepts.

## Critical Issues

### CR-01: Verified-finding drop laundered via a parse-invisible `verified_by` + raw-side fold

**File:** `scripts/compactor.ts:338` (`const isVerified = fields.verified_by !== "";`),
depending on `scripts/context-io.ts:218` (the column-0-only `kv` regex).

**Issue:** A §14-gate-verified finding present in the raw thread is dropped from the promoted
set, yet the carve-out reports "intact." The raw finding's `verified_by` line is written
**indented** (or as `verified_by : …`). `parseNote` does not match it as a key, so
`fields.verified_by === ""` → `isVerified === false`. A throwaway raw note carrying
`supersedes: <finding-id>` then folds the finding out of `survivingIds`, so
`required = isVerified || isFailedAttempt || survivingIds.has(id)` (compactor.ts:340) is
**false**. The finding is never checked for survival, and its drop from the promoted set is
invisible. This defeats exactly the protection the `RAW-FOLD-VERIFIED` test
(compactor.test.ts:625) claims to guarantee — that test only passes because it writes a
column-0 `verified_by`.

**Reproduction (exits 0 — "carve-out intact"):**

Raw thread `finding.md` (note the single-space indent before `verified_by`):
```
---
id: 20260617T142305Z-engineer-finding-vx
kind: finding
by: engineer
at: 2026-06-17T14:23:05Z
  verified_by: §14-gate#RUN7
confidence: high
refs:
  - A
supersedes: 
---

The auth bypass is fixed.
```
Raw thread `fold.md` (a throwaway note that folds the finding out raw-side):
```
---
id: 20260617T150000Z-attacker-observation-f1
kind: observation
by: attacker
at: 2026-06-17T15:00:00Z
verified_by: 
confidence: low
refs:
  - A
supersedes: 20260617T142305Z-engineer-finding-vx
---

fold
```
Promoted set: **only `fold.md`** (the verified finding is entirely dropped).

`validate()` on the raw `finding.md` returns `["structural FAIL: a finding requires a
verified_by stamp …"]` — proving the write path would reject this note while the carve-out
accepts its silent drop. The `verified_by : value` (space-before-colon) variant reproduces
identically (also confirmed).

**Fix:** Make the carve-out enforce the write-path structural contract on every raw and
promoted note before keying any survival decision on a parsed field — run the shared exported
`validate()` on each note and fail closed on any structural finding; in particular a raw
`finding` must carry a non-empty grammar-valid `verified_by`, so a parse-empty `verified_by`
is refused rather than silently demoting the note to "soft/foldable." Equivalently (and
closing CR-01/CR-02/CR-03 at one choke point), tighten `parseNote` to fail closed on any
non-blank line inside the fence that is neither a recognized column-0 `key: value`, a `refs:`
list `- item`, nor empty — an indented/`key : value` provenance line must be a hard error,
not a silently dropped field.

---

### CR-02: Failed-attempt `by`/`at` provenance laundered via symmetric parse-invisibility

**File:** `scripts/compactor.ts:384-402` (the byte-equal field loop), depending on the same
column-0-only parser at `scripts/context-io.ts:218`.

**Issue:** The byte-equal loop compares `fields[field]` (raw) against `counterpart[field]`
(promoted). If the **same** load-bearing line is indented (or `key : value`-shaped) on **both**
the raw and the promoted note, the parser reads `""` on both sides, the loop sees `"" === ""`,
and the mutation passes — while a human or `git` reading the promoted file sees the altered
authorship. The carve-out's core promise ("`by`/`at`/`verified_by`/`supersedes` survive
compaction byte-equal, including on failed-attempts") is defeated: the oracle byte-compares
the *parser's projection*, not the *file's bytes*.

**Reproduction (exits 0 — "carve-out intact"; human/git sees `by: attacker`):**

Raw `fa.md`:
```
---
id: 20260617T142305Z-engineer-failed-attempt-fa1
kind: failed-attempt
  by: engineer
at: 2026-06-17T14:23:05Z
verified_by: 
confidence: low
refs:
  - A
supersedes: 
---

FA-1: dead end
```
Promoted `fa.md` (same id, FA-token preserved, `by` indented and value flipped to `attacker`):
```
---
id: 20260617T142305Z-engineer-failed-attempt-fa1
kind: failed-attempt
  by: attacker
at: 2026-06-17T14:23:05Z
verified_by: 
confidence: low
refs:
  - A
supersedes: 
---

FA-1: dead end
```
The GENERALIZED mutation sweep (compactor.test.ts:1215) does not catch this because it only
ever writes column-0 fields and perturbs the *value*, never the *line shape*. The oracle
asserts "provenance survives byte-equal" but compares parser-projected scalars, so a byte
change the parser cannot see is invisible. Works for `by`, `at`, and `supersedes` identically.

**Fix:** Same single choke-point as CR-01 — the parser must not silently drop an
indented/malformed provenance line. Either (a) fail closed on any non-blank, non-recognized
line inside the fence, or (b) have the carve-out compare the raw frontmatter bytes of each
load-bearing field region rather than the parser's tolerant projection. Option (a) closes both
CR-01 and CR-02.

---

### CR-03: Oracle never enforces "a finding must be verified" — unverified-finding drop laundered (value-level, no parser trick)

**File:** `scripts/compactor.ts:333-341` (required-set construction). Independent of the
parser — a logic gap in the required-set rules.

**Issue:** The required-survival rule is `required = isVerified || isFailedAttempt ||
survivingIds.has(id)`. A note with `kind: finding` and a genuinely **empty** `verified_by`
(column 0, no parser trickery) is treated as soft and foldable: `isVerified` is false, so a
raw-side `supersedes` link folds it out of the required set and its drop is accepted. But by
the schema (context-note.md), a `finding` MUST carry a real stamp — a `finding` with empty
`verified_by` is structurally invalid and the write path refuses it. The carve-out accepts it
as raw input and silently downgrades it to "soft," which both (a) lets a malformed finding be
dropped and (b) is the value-level analog of CR-01 (the attacker need not indent — just emit
`verified_by:` empty and fold). The oracle treats `kind` as validated (WR-03) but never
cross-checks the kind↔field obligations that `validate()` enforces.

**Reproduction (exits 0):** Identical to CR-01 but with the raw finding's `verified_by:` line
at column 0 and genuinely empty; a throwaway `fold.md` supersedes it; promoted keeps only the
fold. The finding is dropped, carve-out intact. (Confirmed empirically.)

**Fix:** Run the shared `validate()` over every raw and promoted note and fail closed on any
structural finding (this rejects a `finding` with empty/invalid `verified_by` before the
soft-fold logic can demote it). This single change also closes CR-01 and CR-02. The carve-out
must not accept as "raw truth" any note the sanctioned writer would have refused to write.

## Warnings

### WR-01: "altered to empty" vs "altered" message branch misreports the laundered field

**File:** `scripts/compactor.ts:388-400`

**Issue:** When `promVal === ""` the message says the field "was dropped to empty"; otherwise
"was altered … to `<promVal>`." Under the CR-02 indentation trick, the *promoted* value the
oracle reads is `""` even though the on-disk value is non-empty (e.g. `attacker`). In the
partially-caught one-sided-indentation cases, the operator-facing message names the wrong
promoted value (`""`), obscuring the real on-disk forgery during incident response. After the
CR-fixes this is moot, but if only a partial fix lands, the message should echo the bytes on
disk, not the parser's projection.

**Fix:** Surface the raw line bytes (or flag the field as structurally malformed) in the
finding text, not the tolerant-parser scalar.

### WR-02: Test suite never exercises indentation / `key : value` malformation

**File:** `scripts/compactor.test.ts` (entire file); `scripts/context-io.test.ts`

**Issue:** Every fixture writes provenance lines at column 0 with `key: value`. No test feeds
an indented provenance line, a `key : value` (space-before-colon) line, or any line the loose
parser silently drops. The GENERALIZED sweep (line 1215) claims (field × kind) coverage but
only perturbs *values*, never *line shape*, so it structurally cannot detect
CR-01/CR-02/CR-03. The duplicate-key tests pass, but a *single* malformed (non-duplicate) line
is the uncovered seam — and that single line is the entire bypass. The suite therefore does
not genuinely discriminate the round-4 invariant from a parser-trusting one.

**Fix:** Add held-out RED-first cases for the three exploit forms (parse-empty `verified_by`
finding + raw-side fold → exit 1; FA with a load-bearing line indented on both sides → exit 1;
`key : value` space-before-colon variant → exit 1) and a parser-level test that the carve-out
consumer fails closed on any non-blank, non-`key:`, non-`- item` line inside the fence.

## Info

### IN-01: `failedAttemptToken` body regex is a cosmetic label only (no defect)

**File:** `scripts/compactor.ts:167-173`

**Issue:** `failedAttemptToken` only enriches a dropped-FA message; survival is correctly keyed
on the frozen id (WR-01). It reads `parsed.body.trim()`, so a token spanning the fence boundary
is not findable — acceptable for a cosmetic label. No correctness impact.

**Fix:** None required.

---

## What I tried that is genuinely BLOCKED (for honesty)

- **Promoted-side single-field value flip (column 0):** caught by the byte-equal loop.
- **Raw-id collision aliasing two raw notes onto one promoted note:** blocked by the CR-03
  raw-side collision guard (compactor.ts:292-304).
- **Promoted-id collision:** blocked (compactor.ts:276-282).
- **Duplicate provenance key (two `id:`/`kind:`/… lines), even across a blank line:** blocked —
  `parseNote` records every repeat in `duplicateKeys`; the carve-out fails closed
  (compactor.ts:238-255). Confirmed empirically.
- **FORGED-FOLD (promoted-side `supersedes` authorizing a drop):** blocked — the required set
  is the raw-side graph only (compactor.ts:351-354).
- **Relabel kind to an unknown value to route onto a weaker path:** blocked by the up-front
  `kind ∈ NOTE_KINDS` check (compactor.ts:214-231).
- **Unparseable `.md` (no fence) silently dropped:** blocked — surfaced as a fail-closed
  finding (compactor.ts:197-208).
- **Hiding FA-ness by indenting `kind: failed-attempt`:** blocked — kind parses empty →
  WR-03 fail closed.
- **BOM-prefixed note:** `parseNote` returns null → fail-closed unparseable finding (acceptable).
- **Raw-side genuine supersedes fold of a non-verified durable `decision`:** NOT a bypass —
  this is the sanctioned D-03 raw-side collapse; only verified findings and FAs are
  unconditionally protected, and a non-verified durable note losing to a later raw-side
  supersedes is by-design foldable.

The ONE open seam: a provenance line **present in the file but indented or `key : value`-shaped**
is read as empty by the oracle yet seen as present by humans/git, and the carve-out never runs
the write-path `validate()` that would reject the resulting note. That single seam yields
CR-01, CR-02, and (value-level) CR-03.

---

_Reviewed: 2026-06-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
