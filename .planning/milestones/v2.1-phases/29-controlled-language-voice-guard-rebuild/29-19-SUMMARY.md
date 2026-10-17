---
phase: 29-controlled-language-voice-guard-rebuild
plan: 19
subsystem: planning-record
tags: [lang-08, override, byte-ceilings, hold-rebaseline, no-op-proof, gap-closure-round-1]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 13
    provides: "the `hold-rebaseline` decision itself — the blocking checkpoint at which a human chose not to move the ceiling table, with the reasoning recorded verbatim, plus docs/audit/29-ceiling-rebaseline.md and docs/audit/29-corpus-growth.md"
provides:
  - "29-VERIFICATION.md carries a one-entry `overrides` block closing LANG-08 by recorded human judgement, with `must_have` and `reason` transcribed BYTE-IDENTICALLY (133 B / 363 B) from the block the report itself drafted"
  - "`overrides_applied` moved 0 -> 1 in the SAME edit, so the counter and the block cannot state two different totals"
  - "the round-scope proof that no ceiling moved: `roleCeiling()` is byte-identical (sha256 862e72d8… .ts / b8d83f94… .js, 114 numeric literals both) across the phase base 4d2b8f0, the round base d29bc7b, and HEAD"
  - "the empty-diff proof that the declined ratchet-down alternative and the growth record survived the override that records them"
affects: [30]

actuals:
  tokens: 6625
  tasks: 1
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Close a failed must-have by TRANSCRIBING the verifier's own drafted override rather than re-authoring it, then assert the transcription byte-for-byte — a record that can drift from the recommendation it implements is not a record"
    - "Move a counter and the block it counts in ONE edit; a file that states two totals has already lost the argument about which is true"
    - "Prove a no-op at ROUND scope, not plan scope: hash the function body at every revision boundary rather than eyeballing a diff that legitimately touches the same file for another reason"
    - "When a grep-shaped acceptance criterion double-counts a fenced prose copy of the thing it is counting, count inside the frontmatter region only, and say that the criterion was substituted"

key-files:
  created:
    - .planning/phases/29-controlled-language-voice-guard-rebuild/29-19-SUMMARY.md
  modified:
    - .planning/phases/29-controlled-language-voice-guard-rebuild/29-VERIFICATION.md

key-decisions:
  - "LANG-08 is closed by a RECORDED HUMAN OVERRIDE, not by code and not by silence. The user chose between the two remedies the verification report offered and took the first: record the override, do NOT apply the ratchet-down. That choice was not re-opened here"
  - "`must_have` and `reason` are transcribed VERBATIM from the report's own drafted block and the transcription is ASSERTED byte-for-byte (133 B and 363 B, both `BYTE-IDENTICAL`), so the record cannot come to say something the verifier did not recommend"
  - "Both acceptance fields are filled for real: `accepted_by: \"Olger Oeselg\"` names the human who answered the 29-13 checkpoint, `accepted_at: \"2026-08-15T09:57:04Z\"` was produced by `date -u` at execution and is 0.0006 days old at the time of assertion. Neither carries a placeholder brace or angle bracket"
  - "`overrides_applied` moved 0 -> 1 in the same edit as the block. An independent YAML load reports `overrides_applied == overrides.length` — the file states ONE total, not two"
  - "The report's verdict fields — `status: gaps_found`, `score: 4/8`, the four `gaps` entries and the eight truth rows — are byte-unchanged. Re-verification is the verifier's act after this gap-closure round; a plan that edits its own verdict has graded its own paper. Recorded as a deliberate NON-GOAL, not an omission"
  - "SUBSTITUTED ACCEPTANCE CRITERION: the plan asked that `grep -c '^overrides:'` return 1. It returns 2 and cannot return 1 without editing the report's closing prose, which this plan is forbidden to touch — the drafted block inside the ```yaml fence carries its own column-0 `overrides:`. Substituted: exactly ONE `^overrides:` inside the frontmatter region (lines 2-102), and exactly one outside it, that one proven to sit inside a fenced block. The whole-file count of 2 is itself the control: if it were 1, the draft would be gone and the byte-comparison would be impossible"
  - "No requirement row in `.planning/REQUIREMENTS.md` is flipped by this plan. The report observes that LANG-02's row is stale bookkeeping while LANG-03's and LANG-04's are accurate; flipping any of them is a verification act that follows this round"
  - "`docs/audit/29-ceiling-rebaseline.md` is untouched. Its ready-to-apply ratchet-down values — five rows lower, twelve hold, zero raised — stay DOCUMENTED and stay UNAPPLIED. They are the evidence that the hold was a choice among computed options; applying them would silently take the remedy the user declined, and deleting them would remove the evidence"

patterns-established:
  - "A no-op claim about a shared file is proven by hashing the FUNCTION, not by reading the file's diff — another plan in the same round legitimately edited 32 lines of that file"
  - "Report an unsatisfiable acceptance criterion plainly, substitute one that tests the same intent, and record both the original and the substitution"

requirements-completed: []
# LANG-08's REQUIREMENTS.md row is deliberately NOT flipped here. Its closure is a recorded human
# override, and recording an override is not the same act as adjudicating that the override closes
# the requirement — that adjudication belongs to the re-verification that follows this gap-closure
# round. `git diff d29bc7b HEAD -- .planning/REQUIREMENTS.md` is empty, as the plan requires.

coverage:
  - id: D1
    description: "LANG-08 carries a recorded human override naming the decision, its author, its time and its reason (D-26, D-27)"
    requirement: "LANG-08"
    verification:
      - kind: integration
        ref: "`overrides` in 29-VERIFICATION.md frontmatter holds exactly one entry. Independent YAML load via `/usr/bin/ruby -ryaml` (Psych 3.1.0 / libyaml 0.2.1) reports `overrides is an Array: true`, `entry count: 1`, keys `[must_have, reason, accepted_by, accepted_at]`"
        status: pass
      - kind: integration
        ref: "`must_have` (133 B) and `reason` (363 B) compared with `Buffer.compare` against the block the report itself drafted under 'This looks intentional for LANG-08 only' — both BYTE-IDENTICAL. The record is a transcription, not a re-authoring"
        status: pass
      - kind: integration
        ref: "`accepted_by: \"Olger Oeselg\"` — no `{}` or `<>` placeholder chars. `accepted_at: \"2026-08-15T09:57:04Z\"` — matches `^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$`, produced by `date -u` at execution, 0.0006 days from the assertion"
        status: pass
    human_judgment: true
  - id: D2
    description: "The counter and the block agree — the file does not state two different totals"
    requirement: "LANG-08"
    verification:
      - kind: integration
        ref: "`overrides_applied: 1` (Integer) and `overrides.length == 1` — `COUNTER AGREES WITH BLOCK: true` under the independent YAML load, not under the writer's own parser"
        status: pass
    human_judgment: false
  - id: D3
    description: "EDGE (LANG-08): no byte ceiling moved anywhere in the gap-closure round — the prohibition half holds at ROUND scope, not merely at plan scope (D-26)"
    requirement: "LANG-08"
    verification:
      - kind: integration
        ref: "`roleCeiling()` body extracted from `git show <rev>:scripts/check-foundation-guards.ts` at THREE revisions — phase base `4d2b8f0`, round base `d29bc7b`, and HEAD — and hashed. All three: `sha256=862e72d836ed0f3da66144c8ec5156e16313170e51b19bb9d00bd7d0a5b3d746`, 40 lines, 114 numeric literals with an identical literal-sequence hash. `distinct bodies: 1 -> BYTE-UNCHANGED`"
        status: pass
      - kind: integration
        ref: "The same extraction over the COMMITTED `scripts/check-foundation-guards.js` — the file that actually runs — is `sha256=b8d83f9441ed52feb708a43ebe54a3999e501dc6c3dcdb8cf70e65a522c6c49c` at all three revisions, same 114 literals. The source and the artifact are both proven, not just the source"
        status: pass
      - kind: integration
        ref: "`git diff d29bc7b HEAD -- scripts/check-foundation-guards.ts` is NOT empty — plan 29-18 changed 29 lines for IN-03. Its single hunk is `@@ -2012,14 +2012,40 @@`, entirely inside `neutralizePhrases()`; `roleCeiling()` sits at 2354-2393 (pre) / 2380-2419 (post). No overlap. This is why the proof is a function hash and not a file diff"
        status: pass
    human_judgment: false
  - id: D4
    description: "EDGE (LANG-08): the declined ratchet-down alternative stays documented and stays unapplied"
    requirement: "LANG-08"
    verification:
      - kind: integration
        ref: "`git diff d29bc7b HEAD -- docs/audit/29-ceiling-rebaseline.md docs/audit/29-corpus-growth.md` is EMPTY across the whole round. The five-lower / twelve-hold / zero-raised table survives the override that records the decision it lost"
        status: pass
    human_judgment: false
  - id: D5
    description: "The report's own verdict is not edited by the plan that records an override against it"
    verification:
      - kind: integration
        ref: "The scoped diff of 29-VERIFICATION.md is ONE hunk, `@@ -4,7 +4,12 @@`, containing only `overrides_applied` and the five-line `overrides` block. `status: gaps_found`, `score: 4/8 must-haves verified`, all four `gaps` entries and the eight truth rows are byte-unchanged, re-read through the YAML load as `status/score/gaps: 4 entries`"
        status: pass
      - kind: integration
        ref: "`git diff d29bc7b HEAD -- .planning/REQUIREMENTS.md` is EMPTY. No requirement row was flipped by this plan or by any plan in the round"
        status: pass
    human_judgment: false
  - id: D6
    description: "A documentation edit did not move a gate"
    verification:
      - kind: integration
        ref: "`node scripts/check-foundation-guards.js` exit 0 (`ALL CHECKS PASSED`); `node scripts/check-diff-disposition.js` exit 0 (`0 findings over 37/37 elements`); `npm run freshness` exit 0 (`All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild`)"
        status: pass
      - kind: integration
        ref: "`npx vitest run --exclude '**/scripts/e2e/**'` — 51 files, **1799 passed / 2 skipped**, exit 0. Identical to the 29-18 baseline, as it must be: this plan changes no source file"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-08-15
status: complete
---

# Phase 29 Plan 19: The LANG-08 Human Override Summary

**LANG-08 is now closed by a recorded human judgement rather than by silence. The override the verification report drafted for itself was transcribed into that report's frontmatter and the transcription was asserted byte-for-byte — `must_have` 133 B and `reason` 363 B, both `BYTE-IDENTICAL` — so the record cannot say something the verifier did not recommend. Both acceptance fields are filled for real. `overrides_applied` moved 0 → 1 in the same edit, and an independent libyaml load confirms the counter equals the block's length, so the file states one total rather than two. The prohibition half of LANG-08 was proven at ROUND scope and not plan scope: `roleCeiling()` hashes identically at the phase base `4d2b8f0`, at the round base `d29bc7b`, and at HEAD, in the `.ts` AND in the committed `.js` that actually runs — which mattered, because plan 29-18 legitimately changed 29 lines of that same file for an unrelated reason. No ceiling moved. The declined ratchet-down alternative and the growth record are byte-unchanged, so the evidence that the hold was a choice among computed options survives the override that records it.**

## Performance

- **Duration:** 14 min
- **Tasks:** 1
- **Commits:** 1
- **Files changed:** 1 modified (the SUMMARY makes 2)

## The override block, as written

Lines 7-12 of `.planning/phases/29-controlled-language-voice-guard-rebuild/29-VERIFICATION.md`:

```yaml
overrides_applied: 1
overrides:
  - must_have: "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <= previous, delta recorded, never raised mid-phase"
    reason: "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline): re-deriving the margin from today's smaller corpus would convert Phases 13-27's absorbed headroom into permanent new headroom. The prohibition half (never raised) holds absolutely; the delta is recorded; only the re-baseline action itself was deferred, by choice, not by omission."
    accepted_by: "Olger Oeselg"
    accepted_at: "2026-08-15T09:57:04Z"
```

## The byte-comparison against the drafted block

The report drafted this override for itself, in the fenced block under *"This looks intentional for
LANG-08 only."* The two substantive fields were **transcribed, not re-authored**, and the claim is
asserted rather than trusted — the drafted block is located by its fence, the frontmatter block by its
key, and the two values compared with `Buffer.compare`:

```
drafted block: lines 249-253 (5 lines)
frontmatter overrides block: 5 lines

must_have  drafted 133 B / frontmatter 133 B -> BYTE-IDENTICAL
reason     drafted 363 B / frontmatter 363 B -> BYTE-IDENTICAL

both transcribed fields byte-identical: true
accepted_by  = "Olger Oeselg"  placeholderChars=false
accepted_at  = "2026-08-15T09:57:04Z"  iso8601Z=true  daysFromNow=0.0006
no placeholder braces/angle brackets in either field: true
```

## The frontmatter parses, and the counter agrees with the block

Checked with an **independent** YAML implementation rather than the writer's own reading —
`/usr/bin/ruby -ryaml`, Psych 3.1.0 over libyaml 0.2.1:

```
YAML load: OK (libyaml 0.2.1 / psych 3.1.0)
top-level keys: ["phase", "verified", "status", "score", "behavior_unverified",
                 "overrides_applied", "overrides", "gaps", "deferred", "human_verification"]
overrides is an Array: true
overrides entry count: 1
entry keys: ["must_have", "reason", "accepted_by", "accepted_at"]
overrides_applied: 1 (Integer)
COUNTER AGREES WITH BLOCK: true
status: "gaps_found"   score: "4/8 must-haves verified"   gaps: 4 entries
```

The counter moved in the **same edit** as the block. A file whose counter and whose block disagree
states two different things about how many overrides it carries, and this repository has already spent
a round on a marker that meant two things at once.

## The ceiling table did not move — proven at ROUND scope

**This is the load-bearing proof, and a file diff would not have delivered it.** Plan 29-18 changed
`scripts/check-foundation-guards.ts` in this same round, for an unrelated reason (IN-03, the
case-agreeing neutralizer). So the round-scoped diff of that file is **not empty**, and "the diff is
empty" — the proof 29-13 could honestly use — is unavailable here.

The command, and its output:

```
$ git diff --stat d29bc7b HEAD -- scripts/check-foundation-guards.ts
 scripts/check-foundation-guards.ts | 32 +++++++++++++++++++++++++++++---
 1 file changed, 29 insertions(+), 3 deletions(-)
```

One hunk, `@@ -2012,14 +2012,40 @@`, entirely inside `neutralizePhrases()`: a 26-line comment block
and three regex literals gaining an `i` flag. `roleCeiling()` sits at lines **2354-2393** before the
round and **2380-2419** after it. **The hunk does not overlap it.**

Rather than rest on that reading, the function body itself was extracted at three revision boundaries
and hashed — from `git show <rev>:<file>`, in the `.ts` source **and** in the committed `.js` that
actually runs:

```
=== scripts/check-foundation-guards.ts — roleCeiling() body ===
phase base 4d2b8f0     lines 2354-2393 (40)  sha256=862e72d8…d746  numericLiterals=sha256:ca3f6dac… count=114
round base d29bc7b     lines 2354-2393 (40)  sha256=862e72d8…d746  numericLiterals=sha256:ca3f6dac… count=114
HEAD                   lines 2380-2419 (40)  sha256=862e72d8…d746  numericLiterals=sha256:ca3f6dac… count=114
distinct roleCeiling() bodies across all three revisions: 1  -> BYTE-UNCHANGED

=== scripts/check-foundation-guards.js — roleCeiling() body ===
phase base 4d2b8f0     lines 2053-2092 (40)  sha256=b8d83f94…c49c  numericLiterals=sha256:ca3f6dac… count=114
round base d29bc7b     lines 2053-2092 (40)  sha256=b8d83f94…c49c  numericLiterals=sha256:ca3f6dac… count=114
HEAD                   lines 2079-2118 (40)  sha256=b8d83f94…c49c  numericLiterals=sha256:ca3f6dac… count=114
distinct roleCeiling() bodies across all three revisions: 1  -> BYTE-UNCHANGED
```

Full hashes: `.ts` `862e72d836ed0f3da66144c8ec5156e16313170e51b19bb9d00bd7d0a5b3d746`, `.js`
`b8d83f9441ed52feb708a43ebe54a3999e501dc6c3dcdb8cf70e65a522c6c49c`. The 114 numeric literals hash
identically in **all six** readings, so the seventeen WARN values and seventeen FAIL values are
unmoved in either direction, not merely unmoved on net.

**Both the source and the built artifact are proven.** Proving only the `.ts` would leave the file
that runs unaccounted for.

## The declined alternative, and the growth record, survived

```
$ git diff d29bc7b HEAD -- docs/audit/29-ceiling-rebaseline.md docs/audit/29-corpus-growth.md
[empty]

$ git diff d29bc7b HEAD -- .planning/REQUIREMENTS.md
[empty]
```

`docs/audit/29-ceiling-rebaseline.md` still holds the ratchet-down values — **five rows lower, twelve
hold, zero raised**, a 1,069 B / 14.6% headroom tightening — recorded and **unapplied**. That table is
the evidence that `hold-rebaseline` was a choice among computed options rather than an omission.
Applying it here would have silently taken the remedy the user declined; deleting it would have
removed exactly the evidence the override depends on. Neither happened.

## The scoped diff of the report itself

```diff
@@ -4,7 +4,12 @@ verified: 2026-08-14T21:15:00Z
 status: gaps_found
 score: 4/8 must-haves verified
 behavior_unverified: 0
-overrides_applied: 0
+overrides_applied: 1
+overrides:
+  - must_have: "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <= previous, delta recorded, never raised mid-phase"
+    reason: "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline): re-deriving the margin from today's smaller corpus would convert Phases 13-27's absorbed headroom into permanent new headroom. The prohibition half (never raised) holds absolutely; the delta is recorded; only the re-baseline action itself was deferred, by choice, not by omission."
+    accepted_by: "Olger Oeselg"
+    accepted_at: "2026-08-15T09:57:04Z"
 gaps:
   - truth: "LANG-03 — a named safety-surface exclusion list is honoured so that load-bearing security, compliance, and admission text is never reworded by a style pass"
     status: failed
```

**One hunk. Two frontmatter keys.** `status`, `score`, the four `gaps` entries, the eight truth rows,
the Requirements Coverage table and the closing prose are all byte-unchanged.

## Gate exit codes and the regression baseline

| check | result |
|---|---|
| `node scripts/check-foundation-guards.js` | **exit 0** — `ALL CHECKS PASSED` |
| `node scripts/check-diff-disposition.js` | **exit 0** — `diff disposition — changed watched file(s): 0 findings over 37/37 elements` |
| `npm run freshness` | **exit 0** — `All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild` |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **exit 0** — 51 files, **1799 passed / 2 skipped**, 117.00 s |

The suite figure is **identical to the 29-18 baseline**, which is the expected result and is recorded
as a control rather than as an achievement: this plan changes no source file, so any movement would
have meant something else moved.

## Deviations from Plan

### 1. [Substituted acceptance criterion] `grep -c '^overrides:'` cannot return 1

- The plan's acceptance criterion reads: *"`grep -c '^overrides:' …29-VERIFICATION.md` returns `1`."*
- **It returns `2`, and it cannot return `1` without editing text this plan is forbidden to touch.**
  The report's own drafted block — the one this plan transcribes from — sits inside a ```` ```yaml ````
  fence in the closing section and carries its own column-0 `overrides:` line. `grep` has no notion of
  a fence, so it counts the key and the prose copy of the key alike. This is the same double-counting
  shape the project has already met once, where a single marker meant two different things to a tally.
- **Substituted criterion, which tests the intent the original was reaching for** — exactly one
  `^overrides:` **inside the frontmatter region**, and every other occurrence proven to sit inside a
  fenced block:

```
frontmatter region: lines 2-102 (delimiters at 1 and 103)

^overrides: occurrences in the whole file:
  line 8    inFrontmatter=true   insideFencedBlock=false
  line 249  inFrontmatter=false  insideFencedBlock=true

KEY occurrences (frontmatter region):        1
PROSE occurrences (inside a fenced block):   1  allFenced=true
```

- **The whole-file count of 2 is itself the control.** Had it been 1, the drafted block would be gone
  and the byte-comparison that proves this override is a transcription would have been impossible to
  perform. The criterion as written would have been satisfied by destroying the evidence.
- The plan's other nine acceptance criteria are met as written.
- **Commit:** `7debdb0`

### 2. [Recorded, not a deviation] `git diff --stat` names a second file

- The plan's criterion reads: *"`git diff --stat` for this plan names only …29-VERIFICATION.md."*
- The working tree also carries a modified `human-notes.txt`. **It was already modified before this
  plan began** — it appears in the pre-execution `git status` snapshot — and this plan neither read
  nor wrote it. It was **not staged**; the commit contains one file.
- Recorded rather than silently ignored, because "the criterion passed" and "the criterion passed
  after I excluded the thing that broke it" are different statements.

## What this plan deliberately did NOT do

Each of these is a **non-goal with a reason**, not an omission.

- **No byte ceiling was edited**, in this plan or anywhere in the round. Proven above at round scope,
  in the source and in the built artifact. `scripts/check-foundation-guards.ts` was deliberately absent
  from this plan's `files_modified`.
- **The ratchet-down alternative was not applied and was not deleted.** The user chose between the two
  remedies the report offered and took the first. Applying the second here would take a remedy that was
  declined; deleting the record of it would remove the evidence that a choice was made at all.
- **The report's own verdict was not edited.** `status`, `score`, `gaps` and the eight truth rows stand
  as the verifier wrote them. Re-verification follows this gap-closure round and belongs to the
  verifier; a plan that edits its own verdict has graded its own paper.
- **No requirement row in `.planning/REQUIREMENTS.md` was flipped.** The report observes that LANG-02's
  row is stale bookkeeping while LANG-03's and LANG-04's are accurate. Flipping any of them is a
  verification act; doing it here would make a planning document assert a state no verification had
  established. `git diff d29bc7b HEAD -- .planning/REQUIREMENTS.md` is empty.
- **The phase was not marked complete and ROADMAP phase status was not flipped.** Only plan progress
  was updated. Three of the round's other findings (CR-01/02/03) closed in plans 29-14 … 29-18 and are
  the verifier's to re-derive, not this plan's to declare.

## Known Stubs

**None.** This plan added no hardcoded empty value, no placeholder string and no unwired path. The two
fields most at risk of being placeholders — `accepted_by` and `accepted_at` — were asserted free of
`{}`/`<>` characters and the timestamp asserted to be an ISO 8601 instant produced at execution
(0.0006 days old at the moment of assertion), precisely because an override with unfilled acceptance
fields is a note wearing a decision's clothes.

## Threat Flags

None. No network path, no write path, no new dependency, no source file, no manifest.

- **T-29-65 (repudiation — the override record) — mitigated.** `must_have` and `reason` transcribed and
  asserted byte-identical (133 B / 363 B); `accepted_by` names the human who answered the 29-13
  checkpoint; `accepted_at` produced at execution; the counter moved in the same edit and the equality
  `overrides_applied == overrides.length` confirmed by an independent libyaml load.
- **T-29-66 (tampering — the byte-ceiling table) — mitigated, and the mitigation was NEEDED.** The
  file holding the table changed in this round for another reason, so the planned "empty diff" proof
  was unavailable. The function body was hashed at three revisions in both the `.ts` and the committed
  `.js`: one distinct body, 114 identical numeric literals.
- **T-29-67 (tampering — the declined alternative) — mitigated.** Both audit documents byte-unchanged
  across the round.
- **T-29-68 (spoofing — the report's own verdict) — mitigated.** The scoped diff is one hunk over two
  frontmatter keys; `status`, `score` and `gaps` re-read unchanged through the YAML load.
- **T-29-SC (package installs) — asserted by absence.** Zero packages installed; `package.json` is not
  in this plan's diff.

## Self-Check: PASSED

File claimed modified, verified present and carrying the block:

```
FOUND: .planning/phases/29-controlled-language-voice-guard-rebuild/29-VERIFICATION.md
       overrides_applied: 1  ·  overrides entry count: 1  (independent YAML load)
```

Commit claimed, verified in `git log`:

```
FOUND: 7debdb0  docs(29-19): record the LANG-08 human override, ceilings proven unmoved
```

Files claimed NOT modified, verified byte-unchanged across the round (`d29bc7b`..HEAD):

```
UNCHANGED: docs/audit/29-ceiling-rebaseline.md
UNCHANGED: docs/audit/29-corpus-growth.md
UNCHANGED: .planning/REQUIREMENTS.md
UNCHANGED: roleCeiling() in scripts/check-foundation-guards.ts  (sha256 862e72d8…)
UNCHANGED: roleCeiling() in scripts/check-foundation-guards.js  (sha256 b8d83f94…)
```
