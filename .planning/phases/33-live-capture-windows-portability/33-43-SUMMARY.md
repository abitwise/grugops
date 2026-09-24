---
phase: 33-live-capture-windows-portability
plan: 43
subsystem: ledgers (review snapshot, WINDOWS.md, deferred items, requirements, state)
tags: [gap-closure-round-4, cap-reached, ledger-close, windows-ledger, gap-d1, d-20]

requires:
  - phase: 33-live-capture-windows-portability
    provides: the round-4 fix plans 33-35..33-39, the CAP-02 verdict (33-40, NOT MET on run 36035067112), the round-4 capture OUTCOME fail and 33-R4-DIAGNOSIS.md (33-41), the manifest section 9 hold (33-42)
provides:
  - 33-REVIEW-round3.md, a byte-identical snapshot of the round-3 review, committed first and alone
  - WINDOWS.md rows 275-300 (26 appended), rows 272 and 275-279 fixed; every round-3 review id folded or on a row
  - 11 dated Round 4 notes in deferred-items.md (none resolved)
  - CAP-01/CAP-03 coverage rows naming the round-4 hold at the cap; STATE position reading round 4 of 4 executed
affects: [phase-33-close, gap-d1, verify-work-33]

actuals:
  tokens: 21614    # chars/4 over the added lines of bee7865c..HEAD before this SUMMARY's commit (86456 chars); 5858 of it is the review snapshot
  tasks: 3
  commits: 4
plan_head_before: bee7865ccbe93201a429ffd75dec34b27a1526ea

tech-stack:
  added: []
  patterns:
    - "A round-4 finding closed this round is appended with its fix citation in the description, then marked fixed, because `windows fixed` records no reason."
    - "A ledgered class is re-probed against the committed build (model, hooks/guard.js, hooks/hook-entry.js guard.js, scrubbed env) at append time, so the row states a measured decision."

key-files:
  created:
    - .planning/phases/33-live-capture-windows-portability/33-REVIEW-round3.md
    - .planning/phases/33-live-capture-windows-portability/33-43-SUMMARY.md
  modified:
    - .planning/WINDOWS.md
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md

key-decisions:
  - "33-43 records the cap-reached closure and does not perform it: round 4 was the last round under the four-round cap, GAP-D1 is open, and Phase 33 closes by human override (D-20). The ROADMAP phase checkbox stays unflipped."
  - "Round-3 review IN-04 (the CHANGELOG redirection-grammar sentence) is NOT the IN-04 plan 33-38 closed. That one is Phase 31's, docs/audit/31-round4-residuals.md row B8. The round-3 IN-04 is accepted open as row 284."
  - "No deferred item resolves this round. Each resolving condition (a both-legs-green run, a removed plugin row, a flip commit, a round-4 fix) is unmet, so all 11 stay open with dated Round 4 notes."

requirements-completed: []   # plan requirements [CAP-01, CAP-02, CAP-03]; none is complete — all three stay Pending at the cap

coverage:
  - id: D1
    description: "33-REVIEW-round3.md is byte-identical to 33-REVIEW.md and was committed first, alone"
    verification:
      - kind: other
        ref: "cmp 33-REVIEW.md 33-REVIEW-round3.md -> exit 0; git log -1 subject contains 'snapshot' (count 1); 0dae6fa4 touches exactly that one file"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every round-3 review id and every round-4 hand-off is folded by name or a WINDOWS.md row with an owner; counters reconcile"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "gsd-tools windows status -> exit 0; open 259 / waived 3 / fixed 38 / total 300; table rows 300; JSON ids 300; grep -c '33-REVIEW-round3 WR-03' -> 2"
        status: pass
    human_judgment: false
  - id: D3
    description: "The 11 open deferred items each carry a dated Round 4 note; every cited commit sha resolves"
    verification:
      - kind: other
        ref: "grep -c 'Round 4' -> 13 (11 notes + 2 earlier mentions); resolved lines 11 = Resolved by: 11; git cat-file loop exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "CAP-01/CAP-03 rows name the round-4 hold; CAP-02 byte-unchanged; STATE edits confined; guards and loader green"
    requirement: CAP-03
    verification:
      - kind: other
        ref: "node scripts/check-foundation-guards.js -> ALL CHECKS PASSED (0.226 s); STATE longest line 2524; state.load exit 0; guarded-beat diff grep 0; CAP-02 row sha1 1cfd85df at ebddab73 and at HEAD"
        status: pass
    human_judgment: false
  - id: D5
    description: "Phase 33's closure at the cap by human override with GAP-D1 open (D-20)"
    requirement: CAP-01
    verification: []
    human_judgment: true
    rationale: "The override is the human's act. This plan records it as the closure path and performs nothing."

duration: "about 30 min (2026-09-24T19:41:10Z to about 20:11Z), about 12 of them the closing regression run"
completed: 2026-09-24
status: complete
---

# Phase 33 Plan 43: The round-4 ledger close, at the cap Summary

**The round-3 review was snapshotted as `33-REVIEW-round3.md` before anything else. The WINDOWS.md ledger grew from 274 to 300 rows: 26 appended, 6 fixed, open 239 → 259. WR-03, the ledgered guard classes, and the computed-at-run-time residuals are accepted-open rows with owners. All 11 deferred items stay open with dated Round 4 notes. CAP-01 and CAP-03 now name the round-4 hold at the cap. STATE reads round 4 of 4 executed and awaiting verification. Phase 33 is NOT marked complete. It closes by human override with GAP-D1 open (D-20), and that override is the human's to perform.**

This note uses clear voice. It records requirement status, safety residuals of the prod-deploy guard, and a closure decision.

## Performance

- **Duration:** about 30 min, 2026-09-24T19:41:10Z to about 20:11Z. The closing regression run took 693.87 s of that.
- **Tasks:** 3 of 3
- **Files:** 6 (1 snapshot created, this summary, 4 ledgers modified). No source file changed: `git diff --stat bee7865c..HEAD -- scripts install hooks agent-factory .claude CHANGELOG.md docs` is empty.

## Task 1: the snapshot, then every finding fixed-by-name or a row

### The snapshot (first commit, alone)

```
cp 33-REVIEW.md 33-REVIEW-round3.md && cmp 33-REVIEW.md 33-REVIEW-round3.md   -> exit 0 (CMP_OK)
npm run check:nul-bytes                                                          -> ALL CHECKS PASSED
git show --stat 0dae6fa4   -> .../33-REVIEW-round3.md | 250 +++  (1 file changed, 250 insertions)
subject: docs(33-43): snapshot the round-3 review as 33-REVIEW-round3.md before any round-4 re-review
```

Before copying, I confirmed the source was the round-3 review. Its frontmatter reads `reviewed: 2026-09-22T20:05:00Z` and `findings: critical 1, warning 3, info 6, total 10`. Its last commits are `c5c87351` (CR-01 fix status) and `1fbd0879` (the round-3 report).

### Round-3 review ids: 10 ids, 3 folded + 7 rows = 10

| id | Disposition | Plan / task (commit) |
|---|---|---|
| CR-01 | folded, plus row 275 (fixed) for the one-register-over class | the review table: round-3 fixer `7d0aea72`, which the round-3 verifier measured DENY on every row. The opaque × nested class (verifier gap 2): 33-35 T1 RED `b3acece3`, GREEN `312fafa8`; T2 `5d1ceeb3`; T3 `03847360` |
| WR-01 | folded, plus row 278 (fixed); row 272 (the sibling arms) fixed | 33-38 T1 RED `04f6b498`, GREEN `49f50aac`; T2 RED `ded41caf`, GREEN `96ccb4b5`; siblings RED `45c7514b`, GREEN `a9c1331b` |
| WR-02 | folded, plus row 279 (fixed); row 273 stays open | 33-39 T1 RED `d55dec5b`, GREEN `29e09fb4`; T2 `ec891a41`. Row 273 is the bounded fail-safe exception for the human |
| WR-03 | row 280, open | human decision 2 of D-33-R4-01: ledger, not code. `hooks/guard.ts` stayed byte-unchanged through round 4 |
| IN-01 | row 281, open | re-grepped: `scripts/admission-server.ts:4, :12, :56` and `hooks/admission-guard.ts:16` still use the bare spelling |
| IN-02 | row 282, open | re-grepped: six readers still pin `"c7be6d0d"` |
| IN-03 | row 283, open | no commit to `scripts/board-read.ts` or `context-note.md` since `1fbd0879` |
| IN-04 | row 284, open | the only CHANGELOG commit since the review (`7d0aea72`) added the CR-01 sentence, not this one. This is not the IN-04 that 33-38 closed |
| IN-05 | row 285, open | `scripts/capture-live.ts:208` still runs `--untracked-files=all` without `--ignored` |
| IN-06 | row 286, open | `no-such-origin-note` is still the decline at `scripts/context-io.ts:3411` |

### Round-4 hand-offs and verifier classes, each a row

| Row | Class | Kind | Owner |
|---|---|---|---|
| 276 (fixed) | npm unique prefix, LB-01 | deviation | closed by 33-36 T1 `4c57076a` / `4812e5cc` |
| 277 (fixed) | xargs stdin verb, LB-02..LB-04 | deviation | closed by 33-36 T2 `4481fbc6` / `f92574a5`, docblocks `947d02ab` |
| 287 | dashed `git-core/git-push` binary, LB-05 | deviation | round 5+ / a later phase |
| 288 | `git send-pack origin main`, LB-06 | deviation | round 5+ / a later phase |
| 289 | `gh api -X PUT repos/o/r/pulls/12/merge`, LB-07 | deviation | round 5+ / a later phase |
| 290 | git `help.autocorrect` (`psuh`), LB-08 | deviation | round 5+ / a later phase |
| 291 | out-of-table deploy verbs (kubectl replace/create/patch/scale/set/edit, helm rollback/uninstall, terraform destroy, tofu apply, aws s3 cp) | deviation | round 5+ / a later phase |
| 292 | RES-01, a tool computed from a shell variable (plus 33-35's `x=g…it; $x` sibling) | unrun-verify | the human |
| 293 | RES-02, a body from a command substitution | unrun-verify | the human |
| 294 | RES-03, a tool name assembled by an xargs replace string | unrun-verify | the human |
| 295 | a stdin launcher other than xargs (GNU parallel, `UNKNOWN - verify`) | unrun-verify | a later phase |
| 296 | `namesOfVariant` regex throw, an over-denial, not a bypass | deviation | a later milestone |
| 297 | 33-R4-DIAGNOSIS decision 1: CAP-03 membership clause vs D-02 (a), coordinator-as-subagent | unrun-verify | the human |
| 298 | 33-R4-DIAGNOSIS decision 2: no pinned permission mode, `Write` outside the target under `auto` | unrun-verify | the human |
| 299 | 33-R4-DIAGNOSIS decision 4: the D-04 row does not key on the probe | deviation | the human |
| 300 | `docs/audit/31-round4-residuals.md` row B8 annotation owed (outside this plan's files) | deviation | a later docs plan |

**Cross-references, no new row.** Row 259 (`git -c alias.p=push p`) already exists and belongs to the same ledgered push class as 287-290. It stays open. 33-R4-DIAGNOSIS decision 3 (the guard's by-decision `$var`/heredoc refusal) is rows 257 and 269. Row 260 stays `open` as 33-40 left it and was not touched here: its case read green on windows, but the run was red. Row 271 (the `assertNoteScalar` CHANGELOG sentence) stays open because no round-4 plan edited CHANGELOG.md. Row 274 (R4-1) stays open.

### Re-probe at append time (zero tokens, committed build, `env` scrubbed to PATH and HOME)

The scratch probe `probe.mjs` calls `matchCommandCheckpoints` on the committed `scripts/checkpoints.js`, then pipes a Bash payload into `hooks/guard.js` and `hooks/hook-entry.js guard.js`. Its output:

```
RES-01          checkpoints [] untokenizable true   guard=ALLOW entry=ALLOW   K=git; bash -c "$K push origin main"
RES-01 sibling  checkpoints [] untokenizable true   guard=ALLOW entry=ALLOW   (33-35's x=<spliced git>; $x push origin main)
RES-02          checkpoints [] untokenizable true   guard=ALLOW entry=ALLOW   bash -c "$(printf %s gi t) push origin main"
RES-03          checkpoints []                      guard=ALLOW entry=ALLOW   echo pm | xargs -I Q nQ publish
LB-05..LB-08, row 259, parallel, the 11 out-of-table verbs: checkpoints [], guard=ALLOW, entry=ALLOW
WR-03           checkpoints ["protected_branch_merge"] untokenizable true  guard=DENY entry=DENY  git push origin main --tags=$T
control         checkpoints ["protected_branch_merge"]                     guard=DENY entry=DENY  git push origin main
```

The WR-03 deny text read `(the word(s) it would not read: \`--tags=$T\`), so it is matched on the tool name alone and refused rather than guessed at`. The literal pattern and the readable arm already deny that command. The defect reproduces as reviewed.

### The commands, quoted (`scratchpad/ledger-33-43.sh`, run under `set -euo pipefail`)

```
T="node $HOME/.claude/gsd-core/bin/gsd-tools.cjs"
$T windows append --kind deviation --phase 33 --file scripts/checkpoints.ts --line 1467 --description '33-43 round-4 disposition, 33-REVIEW-round3 CR-01 one register over (…) FIXED by plan 33-35 (…)'        # row 275
$T windows append --kind deviation --phase 33 --file scripts/checkpoints.ts --line 680  --description '33-43 round-4 disposition, 33-VERIFICATION live bypass (corpus row LB-01) (…) FIXED by plan 33-36 Task 1 (…)'  # row 276
$T windows append --kind deviation --phase 33 --file scripts/checkpoints.ts --line 1745 --description '33-43 round-4 disposition, 33-VERIFICATION live bypass (corpus rows LB-02..LB-04) (…) FIXED by plan 33-36 Task 2 (…)'  # row 277
$T windows append --kind deviation --phase 33 --file scripts/context-io.ts --line 3230 --description '33-REVIEW-round3 WR-01 (…) FIXED by plan 33-38 (…)'   # row 278
$T windows append --kind deviation --phase 33 --file scripts/capture-live.ts --line 1187 --description '33-REVIEW-round3 WR-02 (…) FIXED by plan 33-39 (…)'   # row 279
$T windows append --kind deviation --phase 33 --file hooks/guard.ts --line 704 --description '33-REVIEW-round3 WR-03 accepted open (round 4, ledgered by decision): the deny text names the wrong mechanism when a literal pattern also matched. (…) Owner: a later round (a later phase; phase 33 is at its four-round cap).'   # row 280
$T windows append --kind deviation --phase 33 --file scripts/admission-server.ts --line 4 --description '33-REVIEW-round3 IN-01 accepted open (…) Owner: a later phase.'              # row 281
$T windows append --kind deviation --phase 33 --file scripts/adapter-byte-baseline.test.ts --line 95 --description '33-REVIEW-round3 IN-02 accepted open (…)'                  # row 282
$T windows append --kind deviation --phase 33 --file scripts/board-read.ts --description '33-REVIEW-round3 IN-03 accepted open (…)'                                            # row 283
$T windows append --kind deviation --phase 33 --file CHANGELOG.md --description '33-REVIEW-round3 IN-04 accepted open (…; this is NOT the Phase 31 IN-04 that plan 33-38 closed …)'  # row 284
$T windows append --kind deviation --phase 33 --file scripts/capture-live.ts --line 208 --description '33-REVIEW-round3 IN-05 accepted open (…)'                               # row 285
$T windows append --kind deviation --phase 33 --file scripts/context-io.ts --line 3411 --description '33-REVIEW-round3 IN-06 accepted open (…)'                                # row 286
$T windows append --kind deviation --phase 33 --file scripts/checkpoints.ts --line 1711 --description '33-43 ledgered class (… LB-05 …) Owner: round 5+ / a later phase (…)'   # row 287
$T windows append --kind deviation --phase 33 --file scripts/checkpoints.ts --line 1580 --description '33-43 ledgered class (… LB-06 … git send-pack …)'                        # row 288
$T windows append --kind deviation --phase 33 --file scripts/checkpoints.ts --line 680  --description '33-43 ledgered class (… LB-07 … gh api … /pulls/12/merge …)'          # row 289
$T windows append --kind deviation --phase 33 --file scripts/checkpoints.ts --line 1728 --description '33-43 ledgered class (… LB-08 … help.autocorrect …)'                    # row 290
$T windows append --kind deviation --phase 33 --file scripts/checkpoints.ts --line 680  --description '33-43 ledgered class (… deploy verbs outside the table …)'             # row 291
$T windows append --kind unrun-verify --phase 33 --file scripts/checkpoints.ts --line 1711 --description '33-43 disclosed guard residual (… RES-01 …) Owner: the human.'       # row 292
$T windows append --kind unrun-verify --phase 33 --file scripts/checkpoints.ts --line 1711 --description '33-43 disclosed guard residual (… RES-02 …) Owner: the human.'       # row 293
$T windows append --kind unrun-verify --phase 33 --file scripts/checkpoints.ts --line 1711 --description '33-43 disclosed guard residual (… RES-03 …) Owner: the human.'       # row 294
$T windows append --kind unrun-verify --phase 33 --file scripts/checkpoints.ts --line 1745 --description '33-43 ledgered class (… stdin-to-argument launcher other than xargs … UNKNOWN - verify …)'  # row 295
$T windows append --kind deviation --phase 33 --file scripts/checkpoints.ts --line 1286 --description '33-43 ledgered over-denial (… namesOfVariant … Invalid regular expression …)'   # row 296
$T windows append --kind unrun-verify --phase 33 --file scripts/capture-live.ts --line 998 --description '33-R4-DIAGNOSIS section 1 and section 5 decision 1 (human) (…)'     # row 297
$T windows append --kind unrun-verify --phase 33 --file scripts/capture-live.ts --line 1868 --description '33-R4-DIAGNOSIS section 3.1 and section 5 decision 2 (human) (…)'  # row 298
$T windows append --kind deviation --phase 33 --file scripts/capture-live.ts --line 2724 --description '33-R4-DIAGNOSIS section 3.3 and section 5 decision 4 (human) (…)'      # row 299
$T windows append --kind deviation --phase 33 --file docs/audit/31-round4-residuals.md --line 599 --description '33-43 ledger note (plan 33-38 deferred item) (…)'           # row 300
for id in 272 275 276 277 278 279; do $T windows fixed $id; done
$T windows status
```

The full description of every row is in `.planning/WINDOWS.md`. The shortened forms above elide only the middle. The descriptions contain no `|`, no `'` and no backslash, so no escaped runs could double. The added lines of the ledger diff have 0 backslash pairs.

### The counters, with the arithmetic

| | open | waived | fixed | total |
|---|---|---|---|---|
| before (`windows status`) | 239 | 3 | 32 | 274 |
| after 26 appends (275-300) | 265 | 3 | 32 | 300 |
| after 6 `fixed` (272, 275, 276, 277, 278, 279) | **259** | 3 | **38** | **300** |

The arithmetic: 239 + 26 − 6 = 259, 32 + 6 = 38, and 259 + 3 + 38 = 300. The entries by status count 259 open, 38 fixed and 3 waived. The markdown table has 300 id rows and the JSON appendix has 300 `"id":` entries. `grep -a -c '33-REVIEW-round3 WR-03' .planning/WINDOWS.md` returns 2 (the table and the JSON). The commit (`c77634e6`) deletes 7 lines: 4 frontmatter lines, row 272's table line, and row 272's JSON `status` and `resolved_at`.

## Task 2: deferred items (11 open, 0 resolved)

| entry | Round 4 disposition | evidence quoted |
|---|---|---|
| ten context-io reds (row-236 class) | open | Part 5 § 5.3 reads **CAP-02 verdict on this run: NOT MET.** (run `36035067112`). The one windows red is R4-1 (row 274), outside this class. The class is green: "`scripts/context-io.test.ts` 689/689 (rows 226, 234, 236)". Row 260 read green but stays open because the run is red |
| stale `0.1.0` plugin rows | open | 33-41's post-run `claude plugin list` (19:28:14Z, exit 0) is quoted verbatim. Both rows are still present, the run left no row of its own, and the human has not removed them |
| GAP-D1 HELD | open | § 9 (`73a755f1`), outcome word `fail`, CAP-02 NOT MET, § 7 amendments NOT paid, cap reached. The phase closes by human override (D-20). This entry records that closure and does not perform it |
| row-259 alias | open | re-probed: checkpoints `[]`, ALLOW, ALLOW. Ledgered class; owner a later phase |
| bare server name sites | open, half closed | the scoped name was passed live and appears in B:12. The bare spelling was never passed, so whether it was *needed* is unmeasured. The docblock lines 4/12/56 are unchanged (row 281) |
| `namesOfVariant` throw | open | carried to row 296 |
| `x=g…it; $x` sibling | open | re-probed ALLOW; carried to row 292 |
| `help.autocorrect` (LB-08) | open | re-probed ALLOW on both forms; row 290 |
| xargs replace string (RES-03) | open | re-probed ALLOW; row 294 |
| non-xargs stdin launcher | open | still `UNKNOWN - verify`; row 295 |
| 31-round4 B8 annotation | open | outside this plan's files; row 300 |

**Equality:** `status: open` was 11 before and 11 after, and 0 `Resolved by:` lines were added, so 11 − 0 = 11. The file has 11 `  status: resolved` entries, and the plan's `-B1 -A1` grep finds 11 `Resolved by:` lines beside them. `Round 4` occurs 13 times: 11 new notes plus 2 earlier mentions. Every `commit \`sha\`` cite resolves with `git cat-file` (exit 0). The diff adds 11 lines and deletes none.

## Task 3: requirement rows and the position

- **CAP-02:** byte-unchanged from plan 33-40's write. The row's sha1 prefix is `1cfd85df` at `ebddab73` (33-40), at `bee7865c` (the plan base) and at HEAD. The rewrite script also asserted this before writing.
- **CAP-01 / CAP-03 (hold branch):** each row now opens with the round-4 hold at the cap. Each carries the capture date, the outcome word, the side-(a) sentence, both provenance states (MET before and after), `33-R4-DIAGNOSIS.md`, § 9, and the closure sentence. CAP-01 also carries the five parity sentences verbatim. The round-3 lead became `Round 3 (HELD 2026-09-22)`, its forward sentence became `Round 3 handed round 4 …`, and "One round remains" became "No round remains". Capture-backed and run-backed citations are not mixed: CAP-01 points at the CAP-02 row and names no run id, and CAP-03 cites no CI run.
- **Checkboxes:** all three still read `- [ ]`. No requirement is marked complete.
- **STATE.md:** only the frontmatter and Current Position changed (hunks at lines 7-10, 15-17, 19, 33-34, 37). `node scripts/check-foundation-guards.js` printed `ALL CHECKS PASSED` in 0.226 s with 0 FAIL lines. The longest line is 2524, unchanged, and there are 0 doubled-backslash runs. `state.load` exits 0. The guarded-beat grep over the commit's diff is 0. `round 4 of 4` appears 4 times. D-33-R4-01 (line 1551) and D-33-R4-03 (line 1552) are in the decision log. Neither was re-added, and no decision line was added, because the plan confines STATE edits.
- **ROADMAP.md:** the Phase 33 checkbox (`- [ ] **Phase 33 …`) is NOT flipped. See Deviations for the progress-row update.

### The three requirement rows at the round's end (round-4 lead of each; the older-round text that follows is unchanged)

````text
- [ ] **CAP-01**: One **captured** live dual-path run (date + verdict) discharges GAP-D1 and flips A3/DOG-02 plus the coupled `examples/03-ticket-to-pr.md` cleanup — a loud skip is never a capture.
- [ ] **CAP-02**: The `windows-latest` CI leg is green (…)
- [ ] **CAP-03**: The spawn fix is proven by a **live captured run** showing role agents executing in their own sessions — not by a green suite, which is exactly what failed to detect the defect.
| CAP-01 | Phase 33 | Pending — gap-closure round 4 of 4 HELD AT THE CAP (2026-09-24). Round 4: one live capture, performed 2026-09-24 (plan 33-41, one go under D-09, against pushed sha `6a2dca38`), reads one outcome line `OUTCOME: fail` (`33-CAPTURE-SUMMARY.md`): run A's CAP-03 section reads `side (a): role grugops-orchestrator (toolu_01PW5KQrMewcEhH4bqXoFZxs) is not a member of the derived grant`; both runs exited 0 and the deny was observed. Parity (D-07, write-shaped routes only since plan 33-39) names five differences: […the five sentences verbatim…]. Provenance, both states this round: `run A/B plugin provenance before the spawn` reads MET on both paths (…), and `installed plugin provenance after the run` reads MET (the same digest). The zero-token diagnosis `33-R4-DIAGNOSIS.md` (plan 33-41, commit `d385295f`) classes the CAP-03 red SUITE, with a platform/KIT rider, and its § 5 hands the human four decisions (WINDOWS.md rows 297–299; rows 257/269 for the third). Nothing flipped; hold record `33-FLIP-MANIFEST.md` § 9 (plan 33-42, commit `73a755f1`), mechanical under D-20, status still `pre-capture`, § 7's two amendments still owed. The flip's second gate (CAP-02) is independently unmet — see the CAP-02 row. Round 4 was the last round under the four-round cap: the cap is reached with GAP-D1 open, and the phase closes by human override with the item open (D-20). That override is the human's act; this row records it as the closure path and does not perform it. Round 3 (HELD 2026-09-22): …
| CAP-02 | Phase 33 | Pending — NOT met: CI run `36035067112` (head `e45202a1`, 2026-09-24), round 4 of 4 (last under the cap) — `test (ubuntu-latest)` conclusion `success` (78/78 files, 5778 passed, 1 skipped of 5779, the gate chain green); `test (windows-latest)` conclusion `failure` (1 file, 1 red of 5779: `scripts/board-watch-live.test.ts` DEBOUNCE burst case, `EPERM` on the test's own `renameSync` over `board.md`, WINDOWS.md row 274 — no round-4 plan's, the same red as intermediate run `35913922871`; the row-260 case and every round-4 module green on both legs). Cap reached: CAP-02 is not met after four gap-closure rounds; the remaining red is for the human's decision. Evidence: `33-CI-MEASUREMENT.md` Part 5 § 5.2–5.4 (plan 33-40). Round 3: …
| CAP-03 | Phase 33 | Pending — gap-closure round 4 of 4 HELD AT THE CAP (2026-09-24). Round 4: one live capture on the corrected instrument, performed 2026-09-24 (plan 33-41, pushed sha `6a2dca38`, platform `2.1.281 (Claude Code)`), reads `OUTCOME: fail`. CAP-03 verdict (D-02): run A `side (a): role grugops-orchestrator (toolu_01PW5KQrMewcEhH4bqXoFZxs) is not a member of the derived grant`; run B `both sides hold: no named reason remains`. The zero-token diagnosis (`33-R4-DIAGNOSIS.md` § 1, commit `d385295f`) classes the run-A red SUITE: D-02 (a)'s bar of two evidenced granted roles is met on path A (mapper and architect-design), and the runner's every-spawn-is-a-member clause is stricter. Its rider: the default session spawned the coordinator adapter as a subagent (A:80), and that subagent spawned the role agents (A:313, A:711). Whether D-02 (a) should forbid that route is the human's decision (WINDOWS.md row 297). The 33-28 `UNKNOWN - verify` is settled: path B's `system/init` `tools[]` carries `mcp__plugin_grugops_grugops__propose_note` (B:12). Provenance, both states this round: (…) MET before the spawn and MET after the run. The requirement is not marked complete. Hold record `33-FLIP-MANIFEST.md` § 9 (plan 33-42, commit `73a755f1`). Round 4 was the last round under the four-round cap: the cap is reached with GAP-D1 open, and the phase closes by human override with the item open (D-20). That override is the human's act; this row records it as the closure path and does not perform it. Round 3 (HELD 2026-09-22): …
````

## Closing verification (the plan's `<verification>` block)

- `npx tsc --noEmit`: exit 0.
- `npx vitest run --exclude '**/scripts/e2e/**'`: `Test Files  78 passed (78)`, `Tests  5777 passed | 2 skipped (5779)`, `Duration  693.87s`, exit 0. The `FAIL` strings in the log are stderr text from checks that tests exercise on purpose.
- `npm run check:nul-bytes`: `ALL CHECKS PASSED`, after Task 1 and again before this summary's commit.
- `node scripts/check-flip-manifest.js` after the REQUIREMENTS edit: `ALL CHECKS PASSED`, status `pre-capture`.
- `npm test` was not run.

## Task Commits

1. **Snapshot:** `0dae6fa4` (docs), `33-REVIEW-round3.md` alone
2. **Task 1:** `c77634e6` (docs), WINDOWS.md: 26 appended, 6 fixed
3. **Task 2:** `a957b111` (docs), deferred-items.md: 11 Round 4 notes
4. **Task 3:** `d20ab0d0` (docs), REQUIREMENTS.md CAP-01/CAP-03 rows, STATE.md frontmatter and position

`commits: 4` is measured: `git rev-list --count bee7865c..HEAD` gives 4 before this summary's commit. All four are local. Nothing was pushed. `human-notes.txt` was not staged, and it is still the human's uncommitted modification.

## Decisions Made

See `key-decisions`. In short: the closure is recorded and not performed; the round-3 IN-04 and the Phase 31 IN-04 are disambiguated; and no deferred item resolves.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - No silent drop] Rows beyond the plan's named list**
- **Found during:** Task 1, reconciling the review ids, the 33-35/33-36/33-38 deferred entries, and 33-R4-DIAGNOSIS § 5 against the ledger.
- **Issue:** the plan names WR-03, the ledgered classes and two residuals. It also requires that nothing from the review, the diagnosis or the tree be dropped. Round-3 IN-01..IN-06 had no row, and neither did RES-03, the non-xargs launcher, the `namesOfVariant` over-denial, three of the diagnosis's four human decisions, or the B8 annotation.
- **Fix:** one row each (281-286, 294-300), with owners. Decision 3 is cross-referenced to rows 257/269 rather than duplicated.
- **Commit:** `c77634e6`

**2. [Rule 1 - Correctness] Round-3 IN-04 is not the IN-04 that 33-38 closed**
- **Issue:** the dispatch note and STATE's 33-38 line both say "IN-04 closed". That IN-04 is Phase 31's, B8 in `docs/audit/31-round4-residuals.md`. The round-3 review's IN-04 (the CHANGELOG redirection-grammar sentence) is still open.
- **Fix:** row 284 says so explicitly. The STATE plan line reads "WR-01 (+ the Phase 31 IN-04)".

### Recorded, not auto-fixed

**3. [Tool shape] `windows fixed` records no reason** (the same as 33-34). The closing citations for rows 275-279 were written into each row's description at append time. Row 272's closure (`a9c1331b`) was already in its own description, and it is also cited in this summary. No row was hand-edited.

**4. [Plan confinement vs executor defaults] STATE tools not run.** The plan confines STATE.md edits to the frontmatter and Current Position. For that reason `state.advance-plan`, `state.record-metric`, `state.record-session` and `state.add-decision` were not run: they write the Performance Metrics, Session Continuity and decision sections. The frontmatter was set by hand to `completed_plans: 312` and `percent: 100` (312 of 312 plans executed). `completed_phases` stays 32, and the status string says awaiting verification, not complete. `requirements.mark-complete` was not run, because CAP-01..03 are not complete.

**5. [ROADMAP] progress row only.** `roadmap.update-plan-progress 33` returned `"updated": true, "plan_count": 43, "summary_count": 43, "status": "In Progress", "complete": false`. Its diff touches 3 lines: `**Plans**: 42/43` → `43/43`, the `33-43-PLAN.md` checkbox `[ ]` → `[x]`, and the progress row `42/43 | In Progress` → `43/43 | In Progress`. The Phase 33 checkbox (line 103) still reads `- [ ]`, so nothing needed reverting. ROADMAP.md is outside this plan's `files_modified`, and it is committed with this summary as the executor's metadata step.

**Total deviations:** 2 auto-fixed (Rule 2, Rule 1), 3 recorded. **Impact:** all are ledger-side. No source, safety invariant or gate changed.

## Issues Encountered

- `gsd-tools windows status` prints `{ok, ledger:{…}}`. My first counter read assumed a flat shape and threw. I re-read `.ledger`, and no ledger state was affected.

## Known Stubs

None. This plan changes ledgers only.

## Threat Flags

None. No new endpoint, auth path or file access. The ledger rows describe existing surfaces.

## Next Phase Readiness

- **Phase 33 is at its cap.** CAP-01, CAP-02 and CAP-03 are Pending. GAP-D1 is open, and the § 9 hold record and `33-R4-DIAGNOSIS.md` are filed. The next step is `/gsd-verify-work 33`. Closure is the human's override (D-20), and this plan did not perform it.
- **For the human:** the four § 5 decisions (rows 297, 298, 299, and 257/269), what to do with R4-1 (row 274), and the guard residual rows that name the human as owner (292-294).
- **Re-review hazard closed for round 3:** a re-review may now overwrite `33-REVIEW.md`, because every round-3 citation resolves against `33-REVIEW-round3.md`.

## Self-Check: PASSED

- FOUND: `33-REVIEW-round3.md` (`cmp` exit 0), `.planning/WINDOWS.md` (300/300/300), `deferred-items.md` (11 Round 4 notes), `.planning/REQUIREMENTS.md`, `.planning/STATE.md`
- FOUND commits: `0dae6fa4`, `c77634e6`, `a957b111`, `d20ab0d0`

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-24*
