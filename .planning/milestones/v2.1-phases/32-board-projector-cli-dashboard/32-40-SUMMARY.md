---
phase: 32-board-projector-cli-dashboard
plan: 40
subsystem: testing
tags: [adversarial-review, red-team, gap-closure, dash-06, specifier-partition, import-closure, containment-seam, ticket-census]

# Dependency graph
requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "the eight unverified post-verification fix commits (d276f4e3 … 3e2f254a), plan 32-38's contract/branch-set work and plan 32-39's rename and prototype-lookup work — all of them CLAIMS this plan re-measures rather than cites"
provides:
  - "32-40-ADVERSARIAL-REVIEW.md — the round-4 evidence base: a three-part harness premise plus a FOURTH that failed; 60 derived reproductions with 39 re-run and 21 recorded unmeasured; ten live write plants and an unplanted control; the four questions answered per fix; a measured verdict on the principal cross-fix hypothesis; nine findings F-14..F-22 with reproductions, blast-radius bounds and created-versus-inherited verdicts; a manifest-derived gate sweep; a 20-row ledger asserted total"
  - "A FALSIFICATION of the plan's own principal hypothesis, by measurement: a recovery miss on a blanked span is unreachable, so the widened `bare` arm cannot turn one into a silent skip"
  - "Two demonstrated, real, working second ticket-frontmatter authorities (a namespace import and a two-hop re-export) that the new WR-04 refusal does not see"
  - "The created-versus-inherited ratio for round 4, stated as a number beside rounds 1, 2 and 3: it ROSE, from 2 of 5 to 5 of 8"
affects: [32-41, board-projector verification round 4, the human decision checkpoint at the 4-round cap]

actuals:
  tokens: 20176   # chars/4 over the one file this plan wrote (80707 chars)
  tasks: 3
  commits: 2      # MEASURED: git rev-list --count a305dfa2..HEAD — ede812e8 (the report) + this metadata commit
plan_head_before: a305dfa27f8faa22479327e51a42bbeda8a82f70

tech-stack:
  added: []
  patterns:
    - "Assert the harness's own premise before reporting — and when it fails, record the failure as a finding rather than repairing it quietly (this round: a probe built its fixture with a JavaScript object literal `{ __proto__: … }`, which sets the prototype and writes no key, and reported a closed defect as open)"
    - "Derive the reproduction population from the source documents, count it, and mark every row either re-run-with-a-transcript or explicitly unmeasured — never cited as closed"
    - "For a plant battery, record whether the write-detection PREMISE case is among the failures, not only a failed-case count: a count cannot distinguish a guard that detected the writer from a guard that broke"
    - "Ask a predicate the four questions — what its INPUT is assembled from, at WHICH POSITIONS it is asked, which SET it ENUMERATES, and what its UNION with its sibling arms still refuses — and carry the falsifying hypothesis beside each answer"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-40-ADVERSARIAL-REVIEW.md
  modified: []

key-decisions:
  - "The plan's PRINCIPAL HYPOTHESIS was tested and FALSIFIED, and the falsification is reported as prominently as a confirmation would have been. A recovery miss cannot yield blanked text: every terminated literal is recorded at exactly the offset the capture's `d` flag reports, and an unterminated one is blanked to end-of-line where the newline-excluding capture can never reach a closing quote. The fallback is reachable only for spans that were never blanked — regular-expression interiors — and there the raw bytes ARE the text."
  - "The three tasks produced ONE artifact and were committed ONCE rather than three times. The plan's `files_modified` names a single file and all three tasks write into it; three commits would have required committing a deliberately partial document twice, which is the truncation hazard the write contract exists to avoid. Recorded as the plan's only deviation."
  - "21 of the 60 derived reproductions were NOT re-run, and each is named with its reason rather than quietly folded into the 39 that were. The plan's own prohibition — never record a reproduction as closed on the strength of reading a fix report — applies to the round's own omissions too."
  - "The created-versus-inherited ratio is reported as 5 of 8 — a RISE against round 3's 2 of 5 — with three measurable qualifications stated beside it and none of them allowed to change the number. A flattering ratio at the last round of a hard cap would corrupt exactly the decision the cap exists to force."
  - "No source file was touched, no requirement checkbox moved, no status decided. Ten write plants, one aliased-read plant and five untracked probe modules were created and every one removed, with a clean-tree check recorded per row."

patterns-established:
  - "Two-instrument corpus sizing: derive the denominator by a route the suite does not use (commit tree and a filesystem walk against the index) and state both numbers — a vacuity floor catches an EMPTY denominator but never a silently short one"
  - "Probe the surfaces the PREVIOUS FIX created before probing the surfaces it closed: four of this round's five created findings are in rules that did not exist a week ago"

requirements-completed: []  # DASH-01..DASH-08 are DECLARED by this plan but deliberately NOT marked. This plan's own prohibition reserves that call for the round-4 verifier, and a premature flip already had to be reverted once in this phase (f8c84e06 / 1b8e0eab).

coverage:
  - id: D1
    description: "A three-part harness premise is asserted before anything is reported (faithful build, clean tree, a runnable regression lane), and a FOURTH premise that failed mid-round is recorded as a failure rather than absorbed"
    requirement: DASH-06
    verification:
      - kind: other
        ref: "npm run build && npm run check:build-parity && npx tsc --noEmit && npm run freshness"
        status: pass
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 75 files, 5163 passed, 2 skipped"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every recorded reproduction from 32-VERIFICATION.md, 32-REVIEW.md and 32-37-ADVERSARIAL-REVIEW.md is dispositioned: the population is derived at 60, 39 carry this round's own transcript and verdict, and 21 are recorded unmeasured with a reason each"
    requirement: DASH-03
    verification: []
    human_judgment: true
    rationale: "Whether 39 of 60 is sufficient coverage for a final round, and whether the 21 named omissions are the right ones to leave unmeasured, is a judgment the round-4 verifier makes from the stated reasons — no test can assert it"
  - id: D3
    description: "Ten live DASH-06 write plants plus an unplanted control, each recording exit code, failed count, passed count, whether the acquisitions PREMISE case is among the failures, and a clean-tree check; no live write bypass found"
    requirement: DASH-06
    verification:
      - kind: integration
        ref: "npm run check:dashboard-readonly under ten plants into scripts/board-read.js — exit 1 on all ten; unplanted control exit 0 at 175 passed (175)"
        status: pass
      - kind: other
        ref: "git diff --exit-code -- scripts/ agent-factory/ install/ hooks/ docs/ package.json"
        status: pass
    human_judgment: false
  - id: D4
    description: "The principal cross-fix hypothesis — that a specifier recovery miss meeting the widened `bare` arm turns a refusal into a silent skip — is tested and FALSIFIED by measurement, with the reachable half of the fallback (regular-expression interiors) recorded as F-16 instead"
    requirement: DASH-06
    verification:
      - kind: other
        ref: "eleven specifier shapes measured against a real TypeScript parse; plants S7, S8, S9, S10 measured against the live guard"
        status: pass
    human_judgment: false
  - id: D5
    description: "Two real, working second ticket-frontmatter authorities (namespace import; two-hop re-export) are built, RUN against the fixture's deliberate-disagreement ticket, and measured invisible to the new WR-04 refusal, with the renamed-named-import control measured red"
    requirement: DASH-01
    verification:
      - kind: integration
        ref: "npx vitest run scripts/validate.test.ts — exit 0 130/130 with both evasion readers planted; exit 1 1 failed/129 with the renamed-import control added"
        status: pass
    human_judgment: false
  - id: D6
    description: "Nine findings F-14..F-22, each with a severity, the requirement it bears on, a runnable reproduction with actual output, a measured blast-radius bound and an explicit created-versus-inherited verdict; the ratio stated as a number beside rounds 1, 2 and 3"
    requirement: DASH-02
    verification: []
    human_judgment: true
    rationale: "Severity assignment and the created-versus-inherited verdict per finding are judgments; the human at plan 32-41's checkpoint decides what the ratio means for whether one more fix would converge"
  - id: D7
    description: "A gate sweep whose row set is derived from package.json (33 scripts: 20 rows run + 13 named omissions), the carried failing gate re-measured by two agreeing instruments at 78 with an overlap of 0 against this round's changed files, and a round ledger asserted total at 20 rows against a 20-item inventory"
    requirement: DASH-08
    verification:
      - kind: other
        ref: "19 gates run individually; npm run check:diff-disposition headline 78 and per-finding line count 78; comm -12 of the changed set and the finding set produced no output"
        status: pass
    human_judgment: false

# Metrics
duration: 39 min
completed: 2026-09-16
status: complete
---

# Phase 32 Plan 40: Gap-Closure Round 4 Adversarial Review Summary

**A red-team pass over the eight unverified fix commits and this round's two source plans that found no live DASH-06 write bypass across ten plants, closed the last round-3 gap by independent reproduction, falsified its own principal cross-fix hypothesis by measurement, and still raised five findings created by the previous round's fixes — a ratio that ROSE from 2 of 5 to 5 of 8.**

## Performance

- **Duration:** 39 min
- **Started:** 2026-09-16T19:23:55Z
- **Completed:** 2026-09-16T20:03:12Z
- **Tasks:** 3
- **Files modified:** 1 created (`32-40-ADVERSARIAL-REVIEW.md`, 80,707 bytes), 0 source files touched

## Accomplishments

- **The harness asserted its own premise, and a fourth premise failed mid-round and is recorded as a failure.** Build, parity, typecheck and freshness all exit 0 (65 committed `.js` match a rebuild); the tree is clean apart from the four paths round 3 already recorded; the regression lane runs at **75 files, 5163 passed, 2 skipped** — equal to `32-39-GREEN-proof.txt`'s number. Then the round's own prototype-key probe reported **IN-02 still open**, and the result was **false**: the probe built the dial with a JavaScript object literal `{ __proto__: 3 }`, which sets the prototype and creates no own property, so the key never reached disk. Rewritten to write literal JSON text, the subject's real answer is the opposite. Recorded as § 0.4 and as finding F-22 — the fifth own-harness premise failure across four rounds of this phase, and the reason the plan demanded the assertion.
- **The last round-3 gap is CLOSED, reproduced independently from the verifier's own description rather than from the committed case.** A hand-built two-file duplicate-identifier contest now produces a `conflicts[]` sentence (`… which plans/tickets/ABC-901.md claimed first, so it is joined under no identifier`) that AGREES with the `duplicate-id` read error three fields over. A **three-way** contest — an arm no prior round built — answers correctly for both losers, and the third sentence branch stays unreachable. This independent run agrees with plan `32-38`'s committed case; there is no disagreement to report.
- **Ten live write plants and an unplanted control, and no live DASH-06 bypass.** Every plant exits 1. Seven red the acquisitions PREMISE case — the write-detection MECHANISM, recorded per row precisely because a failed-case count cannot tell a guard that detected the writer from a guard that broke. Four of the ten are NEW shapes no prior round planted, including a **template-literal dynamic import** that `moduleSpecifiers` does not see at all and that the AST acquisitions rule refuses anyway (exit 1, 19 failed / 156). The unplanted control is green at **175 passed (175)**, up from round 3's 171.
- **The plan's principal hypothesis was FALSIFIED by measurement, and the falsification is reported as prominently as a confirmation would have been.** A recovery miss cannot yield blanked text: every terminated literal is recorded at exactly the offset the capture's `d` flag reports, and an unterminated one is blanked to end-of-line where the newline-excluding capture can never reach a closing quote. Where the fallback IS reachable — regular-expression interiors, which the scan skips without blanking or recording — the raw bytes are that span's own text, and the consequence is a fabricated specifier (F-16), not a blank one.
- **Two real, working second ticket-frontmatter authorities were BUILT, RUN and measured invisible.** A namespace import and a two-hop re-export each read `{"status":"in-review","column":"In Review"}` out of the fixture's deliberate-disagreement ticket, and the census stays at **exit 0, 130 passed (130)** with either on the tree. The renamed-named-import control reds with the offender named. The new WR-04 refusal enumerates exactly one import shape (F-15).
- **The two-authority question was asked outside the range the pin covers, and came back clean.** `visible()` and `sanitizeCell()` escape and delete the same **65** code points over `U+0000`–`U+00A5`, are both inert on every probe from `U+00A6` to `U+02FF` and on `U+200B`, `U+2028`, `U+202E`, `U+FEFF` and a lone surrogate. What is NOT clean is the sibling claim: the set the RENDERER deletes and the GRAMMAR does not refuse has **34** members, not the one the assertion names — and a ticket identifier carrying one of the 32 C1 members is quoted, unescaped, into a conflict sentence the renderer then strips (F-14).
- **The ledger is asserted total and the arithmetic balances.** Inventory derived at **20** items (1 gap + 2 advisories + 4 anti-pattern rows + 8 fix claims + 3 Info findings + 2 source plans); the table has **20** rows; both numbers are printed and equal. Seven rows carry an OPEN clause and every one names the finding that carries it. The reproduction arithmetic balances too: **39 re-run + 21 recorded unmeasured = 60 derived**.
- **The gate sweep's row set is derived from the manifest, not recalled.** `package.json` carries **33** scripts; 20 rows were run and 13 omissions are named with reasons (six of them GENERATORS, which a plan forbidden to modify source must not run — their freshness counterparts are run instead and are all exit 0). The carried failing gate re-measures at **78** by both its headline and a per-finding line count — they AGREE this round, where `32-37` recorded them disagreeing by one — and the overlap between its five finding files and this round's 17 changed source files is **0**.

## Task Commits

The three tasks produced ONE artifact and were committed once:

1. **Tasks 1–3: the round-4 adversarial review report** — `ede812e8` (docs)

**Plan metadata:** the `docs(32-40): complete the round-4 adversarial review plan` commit that carries this file (its hash is this commit's own, so it is named by subject rather than by a hash the commit cannot contain).

**Measured commit count:** `git rev-list --count a305dfa2..HEAD` = **2**. The plan's whole diff is
`git diff --name-only a305dfa2..HEAD` → `.planning/ROADMAP.md`, `.planning/STATE.md`,
`32-40-ADVERSARIAL-REVIEW.md`, `32-40-SUMMARY.md` — **no file outside `.planning/`**.

## Files Created/Modified

- `.planning/phases/32-board-projector-cli-dashboard/32-40-ADVERSARIAL-REVIEW.md` — the round-4 evidence base: harness premise (§ 0), 60 derived reproductions (§ 1), ten write plants and a control (§ 2), the independent DASH-03 reproduction including a three-way contest (§ 3), the parser oracle's corpus measured three ways (§ 4), the four questions per fix (§ 5), the cross-fix interaction verdict and eleven probed specifier shapes (§ 6), the derived escaping site set and the two-authority probes (§ 7), the containment seam's implementations and consumers (§ 8), the census's import shapes with two working readers (§ 9), the step counter's alphabet (§ 10), the widened partition's moved members (§ 11), nine findings (§ 12), the ratio (§ 13), the gate sweep (§ 14), the carried failing gate (§ 15), the 20-row ledger (§ 16), the probe arithmetic (§ 17), and what the document does not say (§ 18)

**No source file was modified.** `git diff --exit-code -- scripts/ agent-factory/ install/ hooks/ docs/ package.json` exits 0, and `git status --porcelain -- .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/STATE.md` produced no output.

## Findings raised (detail in the report)

| ID | Severity | Requirement | One line | Created by a round-3 or fix-pass change? |
|---|---|---|---|---|
| F-14 | medium | DASH-03, DASH-07 | a ticket identifier carrying a C1 byte is quoted unescaped into `row-without-file` / `ticket-unplaced`, and the renderer deletes it — the document quotes an identifier the file does not declare | no (inherited surface; the WR-02 fix's site derivation is what missed it) |
| F-15 | medium | DASH-01, DASH-02 | the split-reader refusal enumerates one import shape; a namespace import and a two-hop re-export each deliver a real working second authority at census exit 0 | **yes** (`7aea94f0`) |
| F-16 | low | DASH-06 | CR-01's fix blanks string literals and not regular-expression interiors, so the recovery fallback fabricates a specifier from regex text | no (inherited) |
| F-17 | low | DASH-06 | a template-literal dynamic import is invisible to the scanner AND to the two-sided oracle's own "independent" authority, which asks the same `isStringLiteral` question | **yes**, for the oracle half (`d276f4e3`) |
| F-18 | info | DASH-06 | the `bare` widening relocates the refusal for the members it moved onto a single predicate; measured not to weaken any recorded spelling | **yes** (`3e2f254a`) |
| F-19 | info | DASH-02 | the IN-03 one-authority rule enumerates reads by the register's identifier TEXT; an aliased unguarded read passes at exit 0, 300/300 | **yes** (`c5fc977a`) |
| F-20 | info | DASH-04, DASH-05 | one consumer of the containment decision (`deps.exists(dir)`) still uses the unresolved spelling; the handle does not | no (inherited) |
| F-21 | info | DASH-02 | the step counter's separator alphabet excludes five ordinary shell shapes; all five hypothetical on the live manifest | **yes** (`c5163183`) |
| F-22 | harness | — | this round's own probe produced a false "IN-02 still open" before its premise was asserted; IN-02 is confirmed CLOSED | n/a (outside the ratio) |

**Ratio: 5 created of 8 tree defects.** Round 1: 1 of 3. Round 2: 4 of 5. Round 3: 2 of 5. **Round 4: 5 of 8 — the ratio ROSE.** Every created finding is informational-or-medium with zero live instances, and four of the five are the identical class: a set enumerated over one spelling of the thing it is about.

## Decisions Made

- **The principal hypothesis was falsified and reported as such.** A round that only reports confirmations is a round that was never at risk of being wrong.
- **One commit for three tasks.** All three tasks write into one file that the plan's `files_modified` names; splitting it would have meant committing a deliberately partial document twice. Recorded as the plan's only deviation.
- **21 unmeasured reproductions are named, not folded.** The plan's prohibition against recording a closure from a fix report applies to the round's own omissions too.
- **The ratio is reported without softening**, with three measurable qualifications beside it and none of them allowed to change the number.
- **No status decided.** `REQUIREMENTS.md`, `ROADMAP.md` and `STATE.md` were read and not touched; the eight requirement IDs this plan declares are deliberately left unmarked for the round-4 verifier.

## Deviations from Plan

### 1. [Process] The three tasks were committed as ONE commit rather than three

- **Found during:** Task 1, on reaching the first commit boundary
- **Issue:** The plan's `files_modified` names a single artifact and all three tasks write into it. Committing per task would have required writing and committing a knowingly partial document twice, which is the truncation hazard the executor's own write contract exists to prevent.
- **Fix:** One `docs(32-40)` commit (`ede812e8`) carrying the whole report, with the three tasks' sections all present and each task's `<verify>` run before it.
- **Files modified:** none beyond the report itself
- **Verification:** all three tasks' `<verify>` blocks run and green — `git diff --exit-code` over the source set exit 0; `npm run check:dashboard-readonly` exit 0 at 175 passed; `npm run check:nul-bytes` exit 0 with no line naming the report; `npx vitest run --exclude '**/scripts/e2e/**'` exit 0 at 5163 passed; `grep -c 'hypothetical\|LIVE'` = 16 (the plan's floor is 5); `git status --porcelain` over the three status files empty
- **Committed in:** `ede812e8`

---

**Total deviations:** 1 (process). **Impact on plan:** none on the evidence. Every acceptance criterion of all three tasks is met in the single artifact, and no source file was touched.

## Issues Encountered

- **The round's own harness produced a false result once.** See F-22 and § 0.4. Caught by asserting the premise the probe depended on (that the fixture actually carried the key it claimed to plant) before reading the subject's answer. The false reading would have reported a CLOSED defect as OPEN — a false positive, the less dangerous direction, but a fabricated finding either way.
- **A plant battery on `scripts/board-read.js` and one on `scripts/check-foundation-guards.test.ts` temporarily modified tracked files.** Every one was restored with `git checkout --` and the clean-tree check is recorded per row; five untracked probe modules under `scripts/` and two temporary build directories were removed. Final `git status --short` is byte-identical to the pre-run state apart from the report itself.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **The round-4 verifier has its evidence base.** Every one of the eight unverified fix commits has been re-measured rather than read; the last round-3 gap is independently reproduced CLOSED; the principal cross-fix hypothesis has a measured verdict; nine findings carry reproductions, blast-radius bounds and created-versus-inherited verdicts; the gate sweep is derived from the manifest; the ledger is asserted total.
- **The number the decision turns on is § 13's.** The created-versus-inherited ratio rose from 2 of 5 to 5 of 8 while severity fell — four of the five created findings are informational with zero live instances, and the class behind four of them is the same one this phase has shipped every round. That is the input to plan `32-41`'s checkpoint, where the human decides whether one more fix would converge or move the defect one register over.
- **Blockers/concerns carried, using this repository's phrasing for anything not measured:** the live claude-CLI end-to-end lane is `UNKNOWN - verify` and was not run; 21 of the 60 derived reproductions are unmeasured this round, each named with a reason; `scripts/board-watch-live.test.ts`'s delivery band on `windows-latest` is not measurable from this host.
- **Nothing is decided here.** No requirement checkbox moved, no phase status changed, no verdict reached.

## Self-Check: PASSED

| Claim | Check | Result |
|---|---|---|
| the report exists on disk | `[ -f .planning/phases/32-board-projector-cli-dashboard/32-40-ADVERSARIAL-REVIEW.md ]` | **FOUND** (80,707 bytes) |
| the report's commit exists | `git log --oneline --all \| grep ede812e8` | **FOUND** |
| the metadata commit exists | `git log --oneline ${plan_head_before}..HEAD` names it as HEAD | **FOUND** |
| no source file was modified | `git diff --exit-code a305dfa2..HEAD -- scripts/ agent-factory/ install/ hooks/ docs/ package.json` | **exit 0** |
| the status files were not touched by the plan's own tasks | `git status --porcelain -- .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/STATE.md` was empty at the end of Task 3; `ROADMAP.md`/`STATE.md` moved afterwards only through the `gsd-tools` state verbs, and `REQUIREMENTS.md` never moved | **PASS** |
| the working tree is byte-identical to its pre-run state apart from this plan's own files | `git status --short` | the same four pre-existing paths (`.planning/milestone.lock`, `human-notes.txt`, `.gsd/`, `.planning/state.json`) |
| `check:nul-bytes` names no file under this phase directory | `npm run check:nul-bytes` | **exit 0, ALL CHECKS PASSED** |
| the regression lane is green | `npx vitest run --exclude '**/scripts/e2e/**'` | **75 files, 5163 passed, 2 skipped, exit 0** |
| the phase status was not prematurely flipped | `ROADMAP.md` row for phase 32 | `33/34 · In Progress` — **not Complete** |

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-16*
