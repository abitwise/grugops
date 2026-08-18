---
phase: 29-controlled-language-voice-guard-rebuild
plan: 60
subsystem: audit-record
tags: [disposition-register, phase-close, reconciliation, sweep, LANG-04, D-58]
status: complete

requires:
  - "29-56-SUMMARY.md — D-55's published-claim narrowing and §1's derived claim-site table"
  - "29-57-SUMMARY.md — D-56's hard-wrap disclosure, V-29-57-01 and §4"
  - "29-58-SUMMARY.md — D-55's honesty-floor narrowing, V-29-58-01 and §2"
  - "29-59-SUMMARY.md — D-57's build-parity repair, V-29-59-01/-02 and §5.1-§5.3"
  - ".planning/phases/29-controlled-language-voice-guard-rebuild/29-REVIEW.md (round 7, 6 findings)"
  - ".planning/phases/29-controlled-language-voice-guard-rebuild/29-VERIFICATION.md (round 7, 2 failed truths)"
  - "docs/audit/29-round7-residuals.md — the predecessor register's section shape and its published numbers"
provides:
  - "docs/audit/29-round8-residuals.md §3 — every round-7 finding and verification bullet dispositioned with a decision id"
  - "docs/audit/29-round8-residuals.md §5.4 — six new V- ids (V-29-60-01 .. V-29-60-06)"
  - "docs/audit/29-round8-residuals.md §6 — the V- roll-up in both directions, carried count 0"
  - "docs/audit/29-round8-residuals.md §7 — the Phase 29 close: what it claims and what it does not"
  - "docs/audit/29-round8-residuals.md §8 — the requirement recommendation that applies nothing, and the scope-fence proof"
  - "docs/audit/29-round8-residuals.md §9 — the final-tree sweep, four reproductions, the reconciliation and the prohibitions"
affects:
  - "no source file, no test file, no kit document, no workflow, no requirement row"

tech-stack:
  added: []
  patterns:
    - "derive the ELEMENT SET and diff it; never assert from a count over a pattern"
    - "reproduce a predecessor's published number at the predecessor's own tree before publishing a disagreement with it"
    - "read WHICH SUBJECT a red is about, never the exit code alone"
    - "list the disagreeing row ids inside the reconciliation count so the count can be checked against them"

key-files:
  created: []
  modified:
    - "docs/audit/29-round8-residuals.md (+1358 / -4; §3, §5.4, §6, §7, §8, §9 added)"

decisions:
  - "V-29-60-05 is RECORDED, not fixed. The sweep found and reproduced one surviving address where the gate's published sentence is wider than its mechanism — the exact class D-55 removes. D-58 fences round 8 and this plan's own contract forbids source edits, so it carries an id, a direction, a live count, a reproduction, a named remedy and an owner, and is recommended as the FIRST item of the follow-up."
  - "requirements.mark-complete was NOT run for LANG-04, despite this plan's `requirements:` frontmatter naming it. House rule 9, the plan's own prohibition, and this phase's record of an automated marker inverting these rows from exactly that field all forbid it. `requirements-completed:` is empty and REQUIREMENTS.md is byte-unchanged."
  - "The four out-of-scope round-7 findings (WR-01, WR-02, WR-03, IN-01) are dispositioned as decisions with ids rather than as omissions. A fence decides who does the work next; it does not decide whether the work exists."
  - "Two disagreements with round-7-published numbers (V-29-51-02's 19 -> 20 of 45, and the WINDOWS.md membership claim) are published with both values rather than reconciled, and round 7's own figures were reproduced at round 7's own tree first."
  - "The `actuals.commits` self-reference defect is confirmed a second time (four more short-by-one values) and is NOT corrected in the committed SUMMARYs. A trail is not a tidy state; the remedy recommended is to name the commit RANGE."

metrics:
  duration: "~2h20m"
  completed: "2026-08-18"

actuals:
  tokens: 29885
  tasks: 3
  commits: 4
---

# Phase 29 Plan 60: The Round-8 Disposition Record, the Phase Close, and the Final-Tree Sweep — Summary

Round 8's decisions are now readable from the tree rather than from a planning conversation: every
round-7 finding and verification bullet carries a disposition with a decision id and a re-measured live
count, every `V-` marker is rolled up in both directions against a round-7 count reproduced at round 7's
own tree, Phase 29's claim about itself is written at the granularity of a mechanism with twelve open
axes named and counted, no requirement row moved, and every number the round published was taken again.

**Commit range: `0b6e1f6..HEAD` — three task commits (`41b116e`, `8a7d0e3`, `cea6a1c`) plus the closing
metadata commit that carries this file.** The range is named rather than only counted, per §9.4 row 30's
own recommendation about `actuals.commits`.

## What was built

| symbol | file | kind |
|---|---|---|
| §3 the round-7 disposition table | `docs/audit/29-round8-residuals.md` | 14 rows — 6 review findings, 2 failed truths, 6 `missing:` bullets — each with a decision id, a mechanism or reason, and a live count re-measured on the final tree |
| §3.4 the two findings the derivation produced | same | `V-29-60-05` and `V-29-60-06`, neither in the review nor in the verification |
| §5.4 six new `V-` ids | same | `V-29-60-01` .. `-04` for the fence's out-of-scope findings, `V-29-60-05` and `-06` for the sweep's own; each with direction, live count, named remedy and inheriting owner |
| §6 the `V-` roll-up in both directions | same | 40 markers derived; round 7's 35 re-derived **at round 7's own tree**; 5 entrants named individually; 0 departures; the three-way equality shown |
| §6.4 the carried-count assertion | same | re-measured: every status. Carried from a SUMMARY: **0** |
| §6.5 the false-harness log | same | 6 false results caught, 5 premises asserted, 0 shipped |
| §7 the phase close | same | all five roadmap criteria against their mechanisms; the `LANG-08` override verbatim; twelve things Phase 29 does NOT claim, each directed and counted; the honesty-floor comparison |
| §8 the requirement recommendation | same | all 8 `LANG` rows and all 8 traceability rows printed from the file; the authority for each movement named; **nothing applied** |
| §8.4 the scope-fence proof | same | 19 changed paths, 19 matched to a decision id, **0 unmatched**; the three out-of-scope items each confirmed absent by command |
| §8.5 the follow-up list | same | 12 items ordered by distance from `LANG-04`'s own subject |
| §9 the final-tree sweep | same | 21 commands derived and executed, four reproductions, the reconciliation table, the marker recount, six prohibitions asserted |

## Task-by-task

### Task 1 — the round-7 findings disposed and every marker reconciled (`41b116e`)

**Precondition asserted before any row was written**, because a register composed before its evidence
exists is the thing the document is supposed to make impossible: all four predecessor SUMMARYs present,
and `git log e848052..HEAD` showing 14 commits across plans 29-56 .. 29-59.

**Both denominators were read out of the source documents mechanically** rather than decided by the
person writing the table: `29-REVIEW.md` frontmatter → `critical 2, warning 3, info 1, total 6`;
`29-VERIFICATION.md` → 2 failed-truth entries carrying 3 `missing:` bullets each. **14 rows, and each
count equals the count in its source.**

Dispositions: **CR-01 closed by mechanism** (`D-57`); **CR-02 SPLIT** — its framing closed by
`V-29-57-01` and the in-source premise correction, its matcher fix **declined with a written reason**
(`D-56`); **WR-01, WR-02, WR-03, IN-01 out of scope under `D-58` and carried as ids**, never as
omissions. On the verification side, five bullets closed, one rejected with its reason, **one recorded
NOT SATISFIABLE on its own terms** (`G1-c`: the verifier makes re-running the reproduction against a fix
a precondition of recommending `LANG-04 → Complete`, and `D-56` declines the fix), and one overtaken by
the round doing more than the bullet asked.

**The marker roll-up was derived with round 7's own command, at round 7's own tree first.** That order
matters: round 7 published 35, and a re-derivation that disagreed would have been worthless until it
could reproduce that number. It reproduced exactly — 35 on a fresh `git archive d460a87` extract, 40 at
HEAD — so the entrants are a `diff` of two sorted sets rather than a subtraction. **5 entrants named
individually, 0 departures, `35 + 5 - 0 = 40`.**

**One carried marker moved without any plan intending it, and it is published.** `V-29-51-02` — the
registry's advisory `line:` fields — read 19 of 45 at round 7 and reads **20 of 45** here. The predicate
was reconstructed from round 7's own detail (a START **or** LENGTH disagreement), validated by
reproducing 19 at round 7's tree, and only then applied to HEAD. Cause identified and inside this round:
plan `29-58` inserted twelve lines into the exemption region, moved `C-28-042`'s own `line:` field
correctly, and left the two rows below it declaring positions eight lines above their anchors.

**A second disagreement with round 7:** its §4.7c states that all eight of its opened ids are in
`.planning/WINDOWS.md`. `V-29-49-01` is not, and neither are round 8's two `29-59` ids; the ledger
carries 23 of the tree's 40 markers. Recorded, not corrected — appending to the ledger from inside the
register that measures it destroys the measurement.

### Task 2 — the phase close and the requirement rows recommended but not moved (`8a7d0e3`)

**Written against the roadmap's five success criteria, not against the plan list.** Sixty plans executed
is a measurement of effort; the criteria are the measurement of the thing. Each criterion carries the
gate that holds it and that gate's numbers quoted from a live run, and each says **which half is not
mechanical**:

- **Criterion 1** — the Technical Names set is derived (`76 = 17+19+21+6+13`, checked by hand) and the
  disclaimer is frozen in 6 registry-anchored blocks. **What no gate holds** is that no part of the ASD
  dictionary is vendored; that is a first-hand negative record in `C-28-043`, and the close says so.
- **Criterion 2** — the corpus is derived in four parts (`19+13+13+2 = 47`) and the caveman blocks are
  excluded by construction with their own guard. **The safety-surface list is honoured by REVIEW, not by
  a gate**: 41 generated entries, and nothing reds if a listed file's prose is reworded.
- **Criterion 3** — the guard names are true and were never in doubt. The prohibition half is stated at
  the gate's own header, and **the criterion's own wording (*"nowhere in the kit is … claimed"*) is
  wider than the mechanism, which is the defect `D-55` was taken to remove.** The distance is named,
  counted and directed at §7.3 items 1, 2 and 3.
- **Criterion 4** — all three halves mechanical; the RED-on-17 acceptance evidence is durable in
  `C-28-003`'s `mechanism:` field (`:100` — the row id was checked, not remembered).
- **Criterion 5** — two of three mechanical; **byte ceilings are met by a standing human override**,
  quoted verbatim with its acceptor and date and re-checked live: `guard_role_size` reports 16 within
  ceiling, 1 WARN, 0 FAIL, and `16 + 1 = 17`. No role file was touched by any round-8 plan.

**§7.3 is the longer list and that is the honest shape of it** — twelve entries, each with a direction
and a live count, including the one this plan's own sweep found.

**§7.4 puts the profile's honesty floor and this close's claim sentence side by side** and shows this one
asserts the same or less: both quantify over single lines, over pinned literals, outside the one region;
this one adds two derived numbers that narrow the sets rather than widening them, and *"the
registry-anchored blocks of"*, which is narrower than the profile's *"this section"*.

**§8 applies nothing.** All 8 `LANG` rows and all 8 traceability rows printed from the file; the
authority for each recommended movement named (`29-VERIFICATION.md:119-134` for the six stale rows, the
standing human override for `LANG-08`, a future verifier for `LANG-04`); and five per-plan
`git diff --numstat .planning/REQUIREMENTS.md` checks, run individually, **all five reporting no
change**, plus the range check.

**§8.4 matches all 19 changed paths to the decision that authorised them, with 0 unmatched.** One row
needed its authority stated rather than assumed: the six parity paths are outside `LANG-01..08`'s text,
which the fence's clause (c) forbids, and they are in scope because `D-58`'s in-scope list names `D-57`'s
repair explicitly. The three out-of-scope items are each confirmed absent by command — `0` `wrapJoined`
identifiers, `lineHits` sha256 identical on both sides of the round, the 22-member literal list
byte-identical, and `package-lock.json` unchanged.

### Task 3 — the sweep on the final tree, and every published number re-taken (`cea6a1c`)

**The command list was derived, not typed**, from `.github/workflows/ci.yml` and `package.json`. The
difference between the two authorities is itself the finding behind `V-29-60-06`. **21 derived, 21
executed, all exit 0**, suite `52 files / 2138 passed / 2 skipped`, and **`npm test` was not run** — its
absence is a decision, named, because it spawns the live e2e lane.

**Three freshness gates are recorded as VACUOUS rather than green.** They pass because the trees they
compare do not exist, and two of the three are `V-29-60-06`'s worst case.

**Four reproductions, each with its premise asserted first, no mirror or clone reused, and §9.3.0
records which harness each needs and why** — an archive extract is not a git repository, which is why
the build-parity reproduction needs clones:

1. **The single-line, count-preserving plant** inside `C-28-046`'s frozen block reds with **4 checks
   failed**: the block named by id, both cardinality pins moved from their declared values, and 3
   findings at `file:line:column`. Clean control on a separately re-extracted mirror: green.
2. **The unpaired frozen-block edit reds in BOTH directions**, each on its own mirror, both naming
   `C-28-046`; the **paired** control — the same byte change applied to both files — is green.
3. **The hard-wrap bypass, re-run UNCHANGED**, still passes at exit 0 with the planted file never named
   — and the same run shows the narrowed header TRUE and the second PASS line FALSE on the same tree.
   That is the demonstration behind `V-29-60-05`.
4. **The planted stale committed output reds by name on a clone**, after the in-place build has run,
   with an **independent** discrimination pair: the same plant on a clone of the pre-fix tree exits 0 and
   never names the file; on the post-fix tree it exits 1 naming `hooks/guard.js`.

**§9.4 reconciles 30 rows: 24 agreeing, 6 disagreeing, 10 individual number disagreements, 0 reconciled
away, 0 numbers carried.** Two disagreements (rows 9 and 10) are one cause — derived corpus quantities
that a later plan of the same round legitimately grew — and neither plan did anything wrong; carrying a
corpus measurement forward as a constant is what would have been wrong. **Numbers published with no
recorded command: 0.**

**§9.5 checks the 46-marker prediction §6.2d wrote down before this plan's ids landed: derived 46,
predicted 46.**

**§9.6 asserts all six prohibitions with a command and a result, 0 without.**

## Deviations from Plan

### Auto-fixed and in-plan decisions

**1. [Rule 2 — missing critical record] `V-29-60-05` opened and NOT fixed, with the reason recorded**

- **Found during:** Task 1, confirmed by reproduction in Task 3.
- **Issue:** `D-55` narrowed the gate's published claim, and §1's disposition table named the addresses
  it moved — the `runAll()` header and the module docblock. The gate's **second PASS line**
  (`scripts/check-banned-claims.ts:2607`) was not among them and still opens with a per-DOCUMENT
  quantifier over a per-LINE mechanism. Demonstrated, not argued: on one planted tree, the header is
  true and the second PASS line is false.
- **Root cause worth more than the fix:** §1 derived its site set over FILES by command, then enumerated
  addresses inside each file **by hand**. A derivation that is derived at the file level and hand-written
  at the address level is a hand-written set wearing a derivation's name — this repository's second
  diagnosed systemic failure class, one level inside the remedy for the first.
- **Disposition:** recorded with a direction, a live count, a reproduction, a named remedy and an owner;
  recommended as the **first** item of the follow-up. **Not fixed**, because `D-58` fences round 8 and
  this plan's own contract states that no source file moves.
- **Files modified:** `docs/audit/29-round8-residuals.md` only.

**2. [Rule 2 — missing critical record] `V-29-60-06` opened from the sweep's own derivation**

- **Found during:** Task 3, deriving §9's command list rather than typing one.
- **Issue:** `check-uat-oracles.js`, `freshness:queue` and `freshness:traceability` are named by no
  workflow step; they run in CI only because their own `.test.ts` files spawn them — the "borrowed, not
  wired" pattern `ci.yml`'s own comments name as a defect and fix by hand for two other gates. 3 of 17,
  derived. Two of the three have never run against this repository's own tree at all.
- **Disposition:** recorded and recommended; not fixed (fence, and this plan changes no workflow).

**3. [In-plan decision] `requirements.mark-complete` was NOT run**

- The plan's frontmatter carries `requirements: [LANG-04]`, and the standard execution flow would mark
  it complete. **It was not run.** House rule 9, this plan's own prohibition, the phase's standing rule
  that no requirement is marked by a plan, and this phase's recorded history of an automated marker
  inverting these exact rows from exactly that field all forbid it. Running it would also have falsified
  §8.3, which this plan publishes. `requirements-completed:` is empty and `.planning/REQUIREMENTS.md` is
  byte-unchanged — asserted five times individually and once over the range.

**4. [In-plan decision] The `.planning/WINDOWS.md` ledger gaps were recorded, not filled**

- Three ids in the tree are absent from the ledger (`V-29-49-01`, `V-29-59-01`, `V-29-59-02`), and the
  ledger carries 23 of 40 markers. Appending from inside the register that measures the discrepancy
  would destroy the measurement, and `D-58` fences this plan to one file. Recorded at §6.3 and
  recommended at §8.5 row 10.

### Corrections made inside this plan and left visible

**5. Six false harness results, caught and recorded at §6.5, none shipped**

Two were pattern-broader-than-subject greps that would have published a false *"the matcher is
unchanged"* and a false *"the declined remedy was built"*. One was a build-parity discrimination that
exited 1 **for the wrong file** because the harness had made its own subject stale — the exit code was
right and the verdict was wrong. Two were summary lines composed from the narrative instead of derived
from the rows they summarise, one of which **round 7 got wrong in the identical place**. One was the
premise plan `29-58` was handed and falsified. **Five premises asserted, six false results caught, zero
shipped.**

## Known Stubs

None. This plan writes a record; it ships no code, no placeholder and no unwired component.

## Threat Flags

None. This plan created no network endpoint, no auth path, no file-access pattern and no schema change.
`T-29-60-SC` is discharged by asserted absence: `package-lock.json` is byte-unchanged across the round's
entire commit range and no package was installed.

## Verification

| check | result |
|---|---|
| `npm run freshness` | exit 0 — 48 committed `.js` fresh; set equality with the walk 0/0 |
| `npx tsc --noEmit` / `npm run typecheck` | exit 0 |
| `npm run check:build-parity` | exit 0 — no tracked build output moved |
| six further freshness gates | exit 0 (three recorded VACUOUS) |
| ten repository gates | exit 0, `ALL CHECKS PASSED` each |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — 52 files, 2138 passed, 2 skipped |
| `git diff --numstat .planning/REQUIREMENTS.md` | no output, for each of the five plans individually and over the range |
| `git diff --numstat docs/audit/29-round{4,5,6,7}-residuals.md` | no output — all four byte-unchanged |
| `git status --porcelain` | only pre-existing unrelated paths; every mirror and clone deleted |

## Self-Check: PASSED

```
FOUND: docs/audit/29-round8-residuals.md            (2121 lines; §3, §5.4, §6, §7, §8, §9 present)
FOUND: .planning/phases/29-controlled-language-voice-guard-rebuild/29-60-SUMMARY.md
FOUND: 41b116e   docs(29-60): the round-7 findings disposed and every marker reconciled
FOUND: 8a7d0e3   docs(29-60): the phase close, and the requirement rows recommended but not moved
FOUND: cea6a1c   docs(29-60): the sweep on the final tree, every number re-taken
```

**One number in this block was published stale and is corrected here rather than left.** The line count
first read `2109`, taken before the §6.5 correction that added rows 5 and 6 to the false-harness table.
Re-taken: `wc -l` → **2121**. It is the seventh false result this plan caught, and it is the same shape
as §6.5 rows 4 and 6 — a figure written from an earlier state of the artifact it describes. Recorded so
this SUMMARY holds itself to the rule it spent three tasks asserting.

**The commit count in `actuals` is 4 and the range is `0b6e1f6..HEAD`.** Three task commits are listed
above; the fourth is the metadata commit carrying this file, `STATE.md` and `ROADMAP.md`. The range is
stated because §9.4 row 30 establishes that a commit count written into a commit cannot include the
commit that carries it — this SUMMARY applies its own finding rather than reproducing it.

## What a reader should take from this plan

**The verdict on `LANG-04` belongs to the verifier and is not taken here.** This register records the
evidence: `D-55`'s narrowing is real and is demonstrated true at the gate's header on a tree carrying the
round-7 bypass; two matcher-completeness axes stay open at 0 live with directions and ids; one further
address inside the same gate still publishes the wider wording, found and reproduced by this round's own
sweep; and `29-VERIFICATION.md`'s own precondition for recommending `LANG-04 → Complete` — re-running the
reproduction against a fix — is **not met on its own terms**, because `D-56` declines the fix.

**`D-58` holds: there is no round 9.** §8.5 is the twelve-item list a backlog or a follow-up phase
inherits, ordered by how close each sits to `LANG-04`'s own subject.
