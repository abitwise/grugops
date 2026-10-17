# Phase 33 — Round-2 dry-run report (plan 33-21, Task 1; D-10)

The zero-token readiness evidence D-10 requires BEFORE any go is asked for, for gap-closure round 2.
Filed 2026-09-21 by plan 33-21 Task 1 against checkout `c675b73dc2a17bcd097926775f3e002cdae00202`.
Two halves: this preamble (the state of the tree, the gates, the manifest check, the one row that
is not met and why) and, under "The runner's report, verbatim", the report
`scripts/capture-live.js --dry-run` wrote into a session scratch directory, appended byte for byte.
The fixture-derived JSONL the dry run also wrote stays in scratch — it is not a capture.

No model call was made anywhere in this task. Every platform invocation is a metadata one
(`--version`, `--help`, `plugin marketplace list`, `plugin list`). The runner's completion wording,
quoted exactly as printed on its last stdout line:

> `DRY RUN COMPLETE — no model call was made`

The runner exited 0. Exit 0 is the runner's COMPLETION contract, not readiness; readiness is the
separate `GO-READINESS` line in the runner's report, and a dry run's outcome word is the no-go word
(exactly one such line, at the end of the runner's report).

## 1. The readiness line, read honestly

The runner's precondition table has eleven rows. **Ten read MET. One reads UNMET — the pushed-sha
row** — and the readiness line therefore reads `not-ready`, naming that row alone.

The unmet row's own detail: `HEAD c675b73dc2a1 is 3 commit(s) ahead of origin/main 9e1c1131cec8`.
Those three commits are plan 33-20's Task 3 and docs commits (`4c72d8b0`, `2e8bf64b`, `c675b73d`),
which the human chose to keep local ("skip pushing until the finish"). They change nothing under
`scripts/`, `hooks/` or `install/` (`git diff --stat 9e1c1131..c675b73d -- scripts hooks install`
is empty); the row is unmet because the marketplace install resolves the pushed sha, and the pushed
sha is not this HEAD.

What this means for the round, stated plainly:

- The machinery is ready: every instrument row (platform, five flags, precheck, marketplace row,
  plugin listing, approval key absent) is MET; the fixture build and both installer runs completed;
  the derivation produced the new `Dual-path parity (D-07) — path-invariant projection` section,
  the `installed plugin provenance (D-05, …)` row and the two `transcript location` rows the round-2
  instrument fixes (33-12, 33-13) added.
- No go can be asked for against this report (D-10). The pushed-sha row's only input is
  `HEAD == origin/main`; after a human push of this tree the dry run is re-run at zero tokens and
  re-filed here, and only a report whose readiness line reads ready authorizes plan 33-21's Task 3.
- This plan's Task 1 commit (this report, the `round-1-held/` rename, the diagnosis annotation)
  moves HEAD one further ahead of `origin/main`; the plan's own design has the human push Task 1's
  commits before the go (Task 3), so the ahead count is a sequencing fact, not a defect.

## 2. The offline gates, exit statuses quoted

| command | exit | evidence |
|---|---|---|
| `npx tsc --noEmit` | 0 | no output |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 | `Test Files 78 passed (78)`, `Tests 5375 passed \| 2 skipped (5377)`, 494.79 s |
| `npm run check:nul-bytes` | 0 | `ALL CHECKS PASSED` |
| `npm run build` | 0 | `tsc`, no output |
| `npm run check:build-parity` | 0 | `ALL CHECKS PASSED` |
| `node scripts/capture-live.js --dry-run --out <scratch>` | 0 | the report below; readiness `not-ready` on the pushed-sha row only |
| `node scripts/check-flip-manifest.js` | 0 | `ALL CHECKS PASSED`; `declared set (14)` naming `.planning/PROJECT.md` first |

`npm test` was not run (it would start the live e2e lane).

## 3. The manifest's declared set, checked offline (pre-capture state)

`node scripts/check-flip-manifest.js` prints, in the pre-capture state:

- `[derivation] live-surface parts: publicDocs 12, docsTree 7, planningLedgers 5, archivedRecords 4, runtimeEvidence 1; overlap 1; derived total 28, pinned 28`
- `PASS  every declared locator resolves in the pre-capture state: 62 flip row(s), 10 correction row(s), 2 exemption anchor(s)`
- `[derivation] declared set (14): .planning/PROJECT.md, .planning/REQUIREMENTS.md, .planning/ROADMAP.md, .planning/STATE.md, .planning/WINDOWS.md, .planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-HUMAN-UAT.md, .planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md, .planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md, .planning/milestones/v2.0-phases/20-shared-context-substrate-concurrency-foundation/20-HUMAN-UAT.md, .planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md, .planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md, docs/audit/28-disposition-register.md, docs/dogfood-human-runbook.md, examples/03-ticket-to-pr.md`

The commit-set rule's converse case, `CONVERSE: an explicit --range over exactly the declared set
passes in the discharged state` (`scripts/check-flip-manifest.test.ts:585`), passes:
`npx vitest run scripts/check-flip-manifest.test.ts -t CONVERSE` → 4 passed, 33 skipped. Plan 33-22
carries `.planning/PROJECT.md` in its file list on this evidence (33-FLIP-MANIFEST.md § 6, last
paragraph).

## 4. The held round-1 capture, preserved

The three files 33-DIAGNOSIS.md cites were moved with `git mv` into `round-1-held/` under this
directory, unedited (D-11). Blob shas, at commit `c7be6d0d` and on disk after the rename:

| file | blob at `c7be6d0d` | blob under `round-1-held/` |
|---|---|---|
| `33-CAPTURE-A.jsonl` | `5d4e6522d37469359da208d8ff3b60674d9735d2` | `5d4e6522d37469359da208d8ff3b60674d9735d2` |
| `33-CAPTURE-B.jsonl` | `e54de6d5547cef869d082eef6d076528fadfe4a4` | `e54de6d5547cef869d082eef6d076528fadfe4a4` |
| `33-CAPTURE-SUMMARY.md` | `5e99f30a91acc05690918d980c9771541620c928` | `5e99f30a91acc05690918d980c9771541620c928` |

33-DIAGNOSIS.md carries one annotation line under its title naming the move; `git diff --stat` for
that file against HEAD reads `1 insertion(+)`. The phase root now carries neither
`33-CAPTURE-SUMMARY.md` nor `33-DRY-RUN-FROM-FIXTURE-REPORT.md`, so the runner's
"exactly one report" rule (`verifyArtifacts`) is satisfiable by the round-2 capture set.

## 5. The tree at filing time

- `git rev-parse HEAD` → `c675b73dc2a17bcd097926775f3e002cdae00202` (before this plan's Task 1 commit)
- `git rev-parse origin/main` → `9e1c1131cec8943e2ac96233ed7e624720ced14b`
- `git status --porcelain --untracked-files=no` → empty before the Task 1 edits; the two untracked
  entries `.planning/milestone.lock` and `.planning/phases/34-model-effort-dial-pi-support/` were
  present at dispatch (as at plan 33-10) and are not touched by this plan.
- No `GRUGOPS_` variable is defined in the executor's environment (`env | grep -c GRUGOPS_` → 0).

---

## The runner's report, verbatim

# grugops live-capture report — DRY RUN (fixture-derived)

Generated 2026-09-21T09:39:12.189Z by scripts/capture-live.js (mode: dry-run). Every row of a "claim" table cites the transcript line it was derived from; a row with no citation is withheld, not written.

## Run

| field | value |
|---|---|
| mode | dry-run |
| checkout sha | c675b73dc2a17bcd097926775f3e002cdae00202 |
| platform version | 2.1.278 (Claude Code) |
| per-call bound (ms) | 1200000 |
| bound actually used | not applied — no platform call was made |
| approval key in child env | absent; asserted on the constructed child environment before every spawn |
| installed plugin provenance (D-05, content digest over 2441 tracked files) | UNKNOWN - verify — the installed copy's digest could not be derived: the path the init frame names for grugops was not accepted under the plugin cache root (it must be an existing directory strictly inside <redacted>/.claude/plugins, not dash-prefixed, judged on its real path) |
| plugin under test per system/init | grugops 2.1.0 at /tmp/fixture-plugin-cache/grugops |
| run A transcript | 33-DRY-RUN-FROM-FIXTURE.jsonl (15 line(s), 15 frame(s), 0 partial line(s)) |
| run A transcript location | runner-owned scratch, outside every target and outside the run's working directory |
| run A argv | ["(dry run: no platform invocation)"] |
| run A claim rows withheld (no citation) | 0 |
| run B transcript | 33-DRY-RUN-FROM-FIXTURE.jsonl (15 line(s), 15 frame(s), 0 partial line(s)) |
| run B transcript location | runner-owned scratch, outside every target and outside the run's working directory |
| run B argv | ["(dry run: no platform invocation)"] |
| run B claim rows withheld (no citation) | 0 |

## Preconditions

| precondition | state | detail |
|---|---|---|
| platform version readable | MET | 2.1.278 (Claude Code) |
| coordinator-resolution precheck | MET | PRECONDITIONS HOLD: every observable precondition of the coordinator-resolution check is satisfied on this tree. The two runtime steps above are NOT PERFORMED by this command, and SPAWN-03's runtime half stays unverified until a human observes it and records the observation in .planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md. |
| flag --include-hook-events in --help | MET | present in the help text |
| flag --agent in --help | MET | present in the help text |
| flag --plugin-dir in --help | MET | present in the help text |
| flag --output-format in --help | MET | present in the help text |
| flag --forward-subagent-text in --help | MET | present in the help text |
| marketplace row grugops | MET | the row is present in the marketplace listing (D-05 route 2 source) |
| plugin listing readable | MET | the listing names grugops |
| pushed sha (local HEAD equals the remote default branch head) | UNMET | HEAD c675b73dc2a1 is 3 commit(s) ahead of origin/main 9e1c1131cec8 — the unpushed head cannot be the sha a marketplace install resolves (read from the remote-tracking ref as last fetched; no network was used) |
| prod-deploy approval key absent from the environment | MET | absent from the parent environment and asserted absent on every constructed child environment |

GO-READINESS: not-ready — pushed sha (local HEAD equals the remote default branch head): UNMET — HEAD c675b73dc2a1 is 3 commit(s) ahead of origin/main 9e1c1131cec8 — the unpushed head cannot be the sha a marketplace install resolves (read from the remote-tracking ref as last fetched; no network was used)

## Target build (D-03)

- target A: the installer ran cleanly into a fresh copy of the fixture project with an isolated kit home; nothing outside those two directories was written
- target B: the installer ran cleanly into a fresh copy of the fixture project with an isolated kit home; nothing outside those two directories was written

## Transcript claims — run A (33-DRY-RUN-FROM-FIXTURE.jsonl)

| claim (run A, 33-DRY-RUN-FROM-FIXTURE.jsonl) | value | citation |
|---|---|---|
| frame kind system/init | 1 frame(s) | jsonl:1 |
| frame kind assistant/(none) | 6 frame(s) | jsonl:2 |
| frame kind user/(none) | 2 frame(s) | jsonl:4 |
| frame kind system/task_notification | 1 frame(s) | jsonl:8 |
| frame kind system/hook_started | 2 frame(s) | jsonl:10 |
| frame kind system/hook_response | 2 frame(s) | jsonl:11 |
| frame kind result/success | 1 frame(s) | jsonl:15 |
| D-02 side (a): Agent spawn of grugops-architect-design | toolu_fixture_arch_01; evidence nested-frames (2 nested frame(s), first at jsonl:4) | jsonl:3 |
| D-02 side (a): Agent spawn of grugops-security-nfr | toolu_fixture_sec_02; evidence task-notification (task_notification at jsonl:8) | jsonl:7 |
| D-04 prod-deploy deny observed in a hook_response.stdout | yes — hook PreToolUse:Bash; 1 hook_response frame(s) examined up to the match | jsonl:11 |
| D-05 plugins loaded per system/init | grugops 2.1.0 at /tmp/fixture-plugin-cache/grugops | jsonl:1 |
| D-05 plugin_errors per system/init | none | jsonl:1 |
| result: total_cost_usd | 0.4321 | jsonl:15 |
| result: duration_ms | 18342 | jsonl:15 |
| result: duration_api_ms | 15210 | jsonl:15 |
| result: num_turns | 6 | jsonl:15 |

## Target observations — run A

| observation (run A) | value | citation |
|---|---|---|
| install | the installer ran cleanly into a fresh copy of the fixture project with an isolated kit home; nothing outside those two directories was written | path:.claude/agents |
| derived grant | 16 granted name(s); 17 adapter name(s); coordinator grugops-orchestrator; prefix "grugops-"; the two derivations agree: census 17 = grant 16 + the coordinator | path:.claude/agents |
| D-02 side (b) author stamps | no live note under .grugops/context | path:.grugops/context |
| verdict marker READY_FOR_HUMAN_REVIEW | absent from every live note | path:.grugops/context |

## CAP-03 verdict (D-02) — run A

- side (b): no live note exists under the target's context root, so no author stamp can be read

## Transcript claims — run B (33-DRY-RUN-FROM-FIXTURE.jsonl)

| claim (run B, 33-DRY-RUN-FROM-FIXTURE.jsonl) | value | citation |
|---|---|---|
| frame kind system/init | 1 frame(s) | jsonl:1 |
| frame kind assistant/(none) | 6 frame(s) | jsonl:2 |
| frame kind user/(none) | 2 frame(s) | jsonl:4 |
| frame kind system/task_notification | 1 frame(s) | jsonl:8 |
| frame kind system/hook_started | 2 frame(s) | jsonl:10 |
| frame kind system/hook_response | 2 frame(s) | jsonl:11 |
| frame kind result/success | 1 frame(s) | jsonl:15 |
| D-02 side (a): Agent spawn of grugops-architect-design | toolu_fixture_arch_01; evidence nested-frames (2 nested frame(s), first at jsonl:4) | jsonl:3 |
| D-02 side (a): Agent spawn of grugops-security-nfr | toolu_fixture_sec_02; evidence task-notification (task_notification at jsonl:8) | jsonl:7 |
| D-04 prod-deploy deny observed in a hook_response.stdout | yes — hook PreToolUse:Bash; 1 hook_response frame(s) examined up to the match | jsonl:11 |
| D-05 plugins loaded per system/init | grugops 2.1.0 at /tmp/fixture-plugin-cache/grugops | jsonl:1 |
| D-05 plugin_errors per system/init | none | jsonl:1 |
| result: total_cost_usd | 0.4321 | jsonl:15 |
| result: duration_ms | 18342 | jsonl:15 |
| result: duration_api_ms | 15210 | jsonl:15 |
| result: num_turns | 6 | jsonl:15 |

## Target observations — run B

| observation (run B) | value | citation |
|---|---|---|
| install | the installer ran cleanly into a fresh copy of the fixture project with an isolated kit home; nothing outside those two directories was written | path:.claude/agents |
| derived grant | 16 granted name(s); 17 adapter name(s); coordinator grugops-orchestrator; prefix "grugops-"; the two derivations agree: census 17 = grant 16 + the coordinator | path:.claude/agents |
| D-02 side (b) author stamps | no live note under .grugops/context | path:.grugops/context |
| verdict marker READY_FOR_HUMAN_REVIEW | absent from every live note | path:.grugops/context |

## CAP-03 verdict (D-02) — run B

- side (b): no live note exists under the target's context root, so no author stamp can be read

## Dual-path parity (D-07) — path-invariant projection

Per role: the admitted-note count and the kind multiset; then the frozen verdict marker and the route the notes took to disk. `at` stamps, note bodies, task ids and refs are model-chosen and do not enter (33-DIAGNOSIS § 1.2).

Run A:

| role | notes | kinds |
|---|---|---|
| (no live note) | 0 | |
| verdict marker READY_FOR_HUMAN_REVIEW | absent | |
| note route: direct writes into the context root | 0 | |
| note route: propose_note tool-use blocks | 0 | |

Run B:

| role | notes | kinds |
|---|---|---|
| (no live note) | 0 | |
| verdict marker READY_FOR_HUMAN_REVIEW | absent | |
| note route: direct writes into the context root | 0 | |
| note route: propose_note tool-use blocks | 0 | |

- parity: the two projections are equal

## Replay comparator (informational — task-id keyed, deterministic replay only)

The DOGF-01 replay comparator keeps `at`, `refs` and `body` and keys on the task id; over two independent live sessions its grammar guarantees a diff (33-DIAGNOSIS § 1.2). Its output is recorded and is not an input to the outcome.

- assertEquivalent over the two targets' context roots returned no diff

## Completion

Outcome reason: no model call was made — a dry run is not a capture (D-10, D-11)
DRY RUN COMPLETE — no model call was made

OUTCOME: no-go
