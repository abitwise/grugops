# Phase 34 deferred items

Items found during execution that are out of scope for the plan that found them. Each names the plan,
the finding and why it was not fixed there.

## From plan 34-04

### No derived class test installs over a user file planted at every write path

- **Found by:** mutation (i) of plan 34-04 Task 2. The Pi template's `ok` branch was changed to
  overwrite the existing file (a `"w"` write plus a ledger record) instead of skipping it. All five
  derived class test files stayed green: installer-never-installed, installer-user-edit,
  installer-special-files, installer-cross-version and record-truth (261/261).
- **Why they miss it:** the never-installed test plants a user file at every derived write path and
  then runs only uninstall, never install. The user-edit test edits after install and then uninstalls;
  it never re-installs. The special-file and hard-link tests plant shapes that readForWrite blocks. No
  class test plants a regular user file at every derived write path and then installs.
- **What catches it for the Pi path today:** the targeted case in install/install.test.ts, "a
  user-authored template already at the path is skipped, keeps its bytes, gets no ledger entry, and
  survives uninstall unchanged". It and two other Pi cases went red under that mutation. This covers
  only the Pi path, not the class.
- **Why it was not fixed in 34-04:** a class-wide "install over a planted user file" test has a different
  expected outcome for each path. CLAUDE.md and the Copilot file get a block appended, the Gemini and
  Claude settings files are merged, kit files go through the kit plan and its backups, and the
  sentinel-free files are skipped. Writing it means stating that outcome per path, which is new test
  design beyond this plan's scope (re-pin the existing class tests).
- **Suggested owner:** a later gap or backlog item. Its scope would be "install never overwrites a
  regular user file at any derived write path except through a declared, recorded merge", derived from
  `deriveWritePaths`.

## From plan 34-06

### `.planning/research/STACK.md` carries no per-host table, so the CLAUDE.md § 6 table has no live GSD source

- **Found by:** plan 34-06 Task 2, which planned to add the Pi row to the CLAUDE.md § 6 table and "the
  identical row" to `.planning/research/STACK.md`, the source CLAUDE.md's stack block names
  (`<!-- GSD:stack-start source:research/STACK.md -->`).
- **Measured:** STACK.md holds no table row whose first cell is a bold host name. The entry-file table
  left it in commit `84b791bf` (the v1.1 research rewrite), and the current file is the v2.1 research
  (board projector, browser testing, STE). A GSD regeneration would therefore replace CLAUDE.md's whole
  stack block, dropping the § 6 table, not only revert the Pi row.
- **What holds it now:** `install/host-tools.test.ts` ("every per-host table equals the registry")
  requires CLAUDE.md to stay in the derived per-host table set, so a regeneration that drops the table
  fails red by name. STACK.md is scanned as a declared extra by the same rule, so a per-host table
  written there later is checked automatically.
- **Suggested owner:** the next `/gsd-new-milestone` or a docs task that decides whether CLAUDE.md's
  stack block is regenerated or hand-maintained.

### A host count implied in caveman prose in `agent-factory/packaging/adapters.md`

- Line 7 reads "grug build factory once. grug not build it five times." The "five" is the old host
  count. It is caveman voice and does not match the host-noun count-word pattern, so plan 34-06 left
  it. Suggested owner: plan 34-09's derived prose scan (decide whether "N times" next to the per-host
  build sentence is in scope), or a one-word edit with the voice guards run.

## From plan 34-09

### Six watched-corpus clauses changed by plans 34-06 and 34-08 carry no disposition row

- **Found by:** plan 34-09 Task 1, running `node scripts/check-diff-disposition.js` (a CI gate, wired
  in `.github/workflows/ci.yml`) before and after its own markdown edits.
- **Measured:** the gate exits 1 on the tree at `6aaf0917` (before plan 34-09) with 6 findings, all
  "no disposition row": `README.md:4` and `README.md:48` (removed), and `agent-factory/README.md:39`
  (added and removed), `:42` and `:58` (removed). These are the count-free host rewrites of plans
  34-06 and 34-08 (D-11). Plan 34-09's own clauses (role-switch protocol, workflow 16) are
  dispositioned in `docs/audit/29-style-dispositions/34-09.md`, and the gate reports exactly the 6
  pre-existing findings afterwards.
- **Why it was not fixed in 34-09:** the rows record what plans 34-06 and 34-08 decided. Each plan writes
  its own disposition file (`docs/audit/29-style-dispositions/README.md`), so the rows belong in a
  `34-06.md` and a `34-08.md` written from those plans' summaries, not in this plan's file.
- **Suggested owner:** plan 34-10 or the phase 34 verification gap round. Add `34-06.md` and
  `34-08.md` with one row per finding (rule `34 D-11`), then re-run the gate.

### The caveman lines that implied a host count are fixed by hand, not by the scan

- `agent-factory/packaging/adapters.md` line 7 ("grug not build it five times", the 34-06 item above)
  and `install/README.md` line 3 ("grug not install it five different hard ways") now say "for each
  tool". The derived scan's Rule A does not match "N times" or "N … ways", and was not widened to:
  those nouns are not host nouns, and widening would add false positives across the tree. A future
  caveman line of that shape is not caught by the scan.

## From plan 34-16

### The minimal path is stated as working on every supported tool, with no run on the newer hosts

- **Found by:** plan 34-16 Task 2, re-running the WR-06 search. `install/README.md` §1 says "The
  floor works for every supported tool", and `agent-factory/README.md` (registered claim
  `C-28-034`) says the minimal markdown-copy path "works for any tool". The claim registry measures
  `C-28-034` and `C-28-026` against the minimal path's mechanism (the kit is in the repository at
  the path `AGENTS.md` names), not against a run on each host.
- **Why it is a question:** plan 34-16's caveat in `install/README.md` "Using grugops on Pi" says,
  as its plan required, that no Pi run has confirmed the minimal path either. The two statements do
  not contradict each other (a mechanism can hold without a run), but DOC-1 asks that a sentence
  about what a host does be backed by code or a run.
- **Why it was not fixed in 34-16:** the plan's scope is kit discovery after a scripted install
  (WR-06, D-20). Both sentences are about the minimal path, and `C-28-034` is a registered claim
  whose text change needs a registry companion edit and a human judgement on what backs it.
- **Suggested owner:** human triage, with backlog 999.4 (a per-host run would answer both).

## From gap round 1 (D-20)

Plan 34-17 recorded the code review's dispositions (`34-REVIEW-DISPOSITION.md`). Under decision D-20,
gap round 1 fixes WR-03 (plan 34-15), WR-06 (plan 34-16) and WR-07 (plan 34-17) and changes no code
for the nine rows below. Each is `deferred` in the disposition ledger with the same reason. The
findings are quoted from `34-REVIEW.md`.

### WR-01: host detection reads grugops's own writes as proof that a host is in use

- **Finding:** `detectTools()` counts any `.pi`, `.github` or `.gemini` entry as the host being in
  use, and the installer writes into all three, so from the second install on every repository reports
  those hosts. The registry docstring at `install/host-tools.ts:54` ("its presence means the host is
  in use there") states the opposite of what happens.
- **Why not fixed in round 1:** the `tools detected:` line drives no write. A fix changes the HOST-01
  detection contract for three hosts at once, and D-20 keeps it out of this round. The docstring is a
  DOC-1 member left for the same fix.
- **Suggested owner:** a later gap round or backlog triage, together with the detection contract.

### WR-02: a non-directory `.pi` entry makes every install exit 3

- **Finding:** the Pi template write is unconditional, so a regular file or symlink named `.pi` at the
  target root turns a clean install into `install INCOMPLETE` with exit code 3.
- **Why not fixed in round 1:** the unconditional write is decision D-17. Reporting that case as
  `skipped` changes the installer's exit-code contract and needs a human decision. Nothing is
  overwritten, so the install stays additive (threat T-34-47, accepted).
- **Suggested owner:** human decision on the D-17 exit contract, then a later gap round.

### WR-04: raw control bytes from config keys reach printed refusal text

- **Finding:** effort refusals interpolate config keys without quoting, so control bytes or newlines
  in `.grugops/factory.config.json` reach the installer's and the guards' output.
- **Why not fixed in round 1:** this is the P32.1 published-message class. It predates phase 34 in the
  `models` block and was copied into `models.effort`. Both blocks should be fixed together through
  `quoteValue` in `scripts/model-tiers.ts`. Accepted for this round as threat T-34-46; the config file
  is in the user's own repository.
- **Suggested owner:** a later gap round, fixing the `models` and `models.effort` refusals in one change.

### WR-05: the installer's closing safety line derives "documentation only" from `dispatch`

- **Finding:** the line keys on the registry's `dispatch` attribute, not on whether the host gets ask
  rules.
- **Why not fixed in round 1:** the line is correct today, because the hosts with no ask rules are
  exactly the sequential ones. An `askRules` registry field is a HOST-01 contract change.
- **Suggested owner:** backlog triage, with the next host-registry change.

### IN-01: three implementations of "a per-host table row" disagree

- **Finding:** three separate matchers read per-host table rows and disagree on the same bytes.
- **Why not fixed in round 1:** all three fail closed today. They should be unified in one module,
  together with IN-02.
- **Suggested owner:** backlog triage.

### IN-02: the validator only warns on an unrecognisable dispatch table

- **Finding:** `scripts/validate-agent-factory.ts` warns when it cannot recognise the dispatch-map
  table, while the UAT oracle fails red on the same input. Its comment ("never passed silently")
  overstates what it does.
- **Why not fixed in round 1:** it belongs with IN-01's unification. The comment is a DOC-1 member left
  for the same change.
- **Suggested owner:** backlog triage, with IN-01.

### IN-03: the Pi template is create-only

- **Finding:** a later change to `PI_PROMPT_TEXT` (`install/install.ts`) never reaches a repository
  that already has the template.
- **Why not fixed in round 1:** this round changes documentation, not `PI_PROMPT_TEXT`, so no installed
  template is stale. A refresh rule belongs with the next template change.
- **Suggested owner:** the plan that next changes `PI_PROMPT_TEXT`.

### IN-04: a blank `effortRationale` also refuses the model `tiered` preset

- **Finding:** the effort-rationale floor sits inside `tieredTableRefusals` (`scripts/model-tiers.ts`),
  so it couples the model preset to the effort rows.
- **Why not fixed in round 1:** every effort row is complete today, so nothing is refused. The fix is to
  split the check or to document the shared floor.
- **Suggested owner:** backlog triage.

### IN-05: the structure validator does not validate the `models` / `models.effort` block

- **Finding:** `scripts/validate-agent-factory.ts` does not ask `readModelsConfig`.
- **Why not fixed in round 1:** pre-existing for the model dial and widened by effort. The block is
  read through `readModelsConfig` by the adapter generator (`scripts/generate-role-adapters.ts`) and
  the foundation guards (`scripts/check-foundation-guards.ts`), so it is checked there; the
  structure validator does not read it.
- **Suggested owner:** backlog triage.

## From the gap round 1 code review (34-REVIEW.md, 2026-10-09)

Triaged by the human on 2026-10-09. WR-08, WR-09 and WR-10 stay `open` in 34-REVIEW-DISPOSITION.md
as gap round 2 inputs; the ledger tool clears the Source cell of an `open` row on every run, so the
round 2 notes live here.

### WR-08 (gap round 2): a dropped `effort:` line passes when the level set does not change

- **Finding:** the effort arm of the installer cross-check compares only the set of distinct levels
  (`install/install.ts:5052-5068`), so one adapter losing `effort: high` while another keeps it installs
  at session effort with no refusal; three comments say such a drop is refused.
- **Round 2 direction:** compare `readRenderedDials` on the rendered and the transformed text member by
  member; fold IN-07 in, so both dials go through one shape check.

### WR-09 (gap round 2): `isAbsoluteMarkerPath` sits outside the WIN-1 census

- **Finding:** `install/install-marker.ts:1154-1155` is a second hand-written absoluteness rule over
  recorded paths; the census in `install/path-spelling-census.test.ts` lists its comparison sites by hand
  and misses it, although `install/user-file.ts:298-299` says the census holds the rule.
- **Round 2 direction:** bring it under the census (derive the comparison sites rather than list them),
  together with WINDOWS.md row 319.

### WR-10 (gap round 2): no end-to-end test reaches the uninstall pointer-file mode check

- **Finding:** since the read-only user mode edit, the `CLAUDE.md` and `.github/copilot-instructions.md`
  rows of `install/record-truth.test.ts` pass through the write-failure path, not the mode check at
  `install/uninstall.ts:899-901`.
- **Round 2 direction:** add one row with a writable, mode-changed pointer file.

### IN-06, IN-07, IN-08: deferred

Reasons are recorded in the ledger rows. IN-06 is the same item as R15 and waits on its backlog triage.

### Out of scope, found during 34-19 (2026-10-09): the fs census does not classify `openAsBlobSync`

- **Finding:** `install/installer-fs-census.test.ts` ("every node:fs export whose name may mark a content
  read is classified") fails on this machine: `UNCLASSIFIED node:fs export openAsBlobSync`. The local
  runtime is Node v26.11.0, whose `node:fs` exports `openAsBlobSync` (`typeof` is `function`). No file
  this test reads was changed by 34-19 (it fails the same way when run alone), so it is the runtime, not
  this plan.
- **Direction:** read what `openAsBlobSync` does and classify it in `CONTENT_READER` or
  `NOT_CONTENT_READER` (DC-3); not fixed in 34-19 (scope boundary).

## From gap round 2 (D-21, D-22, D-23, D-24)

Recorded by plan 34-24. Gap round 2 (plans 34-19 to 34-23) fixed WR-08, WR-09, WR-10 and IN-07; the
disposition ledger records each as `fixed` with its plans and commits, and `open: 0`. This section
records what the round closed outside the ledger and what it leaves open. Under D-21 there is no
windows-latest measurement in this round, so nothing below is a Windows result (WIN-3).

### (1) Case (B) of the effort cross-check: CLOSED (D-24)

- **Finding:** the verifier's reproduction (34-VERIFICATION.md gap 2): a generator patched to drop the
  `effort:` line of one adapter (`grugops-architect-design`), with config `models.effort.preset: tiered`
  plus one role at `inherit`, installed all 17 adapters at exit 0 because the installer compared only the
  set of distinct levels.
- **How it was closed:** plan 34-19 made the generator announce the per-role map of both dials
  (`byAdapter`), with one serialiser and one validator in `scripts/model-tiers.ts`, and the freshness gate
  reads that map (commits `37e98a97`, `90b044ff`). Plan 34-20 made the installer compare each adapter's
  value, read from the rendered text and from the text about to be written, with the announced map,
  member by member. The reproduction is now the committed refusal row (f) in `effortRefusalRows`
  (`install/install.test.ts`): exit 3, 0 adapters installed (commits `c0fa273c`, `92333ee1`). Before the
  change, the pre-plan `install.js` ran row (f) to `status=0` (34-20-SUMMARY.md, Task 1).
- **Model dial:** the model dial got the same per-member check and the same rows (RC-1; 34-20-SUMMARY.md
  deviation 3, rows (3) and (5) run on both dials).
- **Status:** closed by plans 34-19 and 34-20 (D-24); nothing of case (B) stays open.
- **Suggested owner:** none.

### (2) The POSIX consequence of WR-09's one absoluteness rule

- **Finding:** the install marker check now asks `isRecordedAbsolute`, the path flavor's own
  `isAbsolute` (plan 34-21, commit `03428cc1`). On a POSIX host a marker whose target is spelled `C:/x`
  now reads as not install's marker ("target is not an absolute path"). Under the old hand-written
  predicate it read as absolute, and so as a marker written for another directory. Both readings fail
  closed: the marker is refused either way, and nothing is deleted. 34-21-SUMMARY.md, Accomplishments
  ("`C:/x` is now refused under posix") and mutation m1, records it.
- **Why not changed:** this is the intended effect of one rule per flavor (D-23, WR-09). A `C:/x` target
  is not a path a POSIX install writes, so no install on POSIX produces it.
- **Suggested owner:** none needed; recorded so that a later reader does not take the changed refusal
  sentence for a regression.

### (3) IN-06 and IN-08 stay deferred

- **IN-06:** the per-adapter install line names the model but not the effort level that was read. It is
  the same item as R15 and waits on its backlog triage (reason in the ledger row).
- **IN-08:** `canonicalPathSpelling` does not fold the `\\.\` device-namespace prefix. Such a path fails
  closed (no false match), and no current write path records that spelling (reason in the ledger row).
- **Suggested owner:** backlog triage.

### (4) `UNKNOWN - verify` until the human's windows-latest run (D-21)

- **The Windows readback of a product link (isOwnLink reach, WINDOWS.md row 319).** isOwnLink now
  compares through `sameRecordedPath` (34-21), but the installer's own link cases
  (`uninstall-removal.test.ts`, skipped where `canSymlink` is false, which is win32) do not run on
  windows-latest, so no run reads back a link the installer made. If the readback spelling differs,
  uninstall fails closed (it leaves the link). The 34-21 isOwnLink host cases (WINDOWS.md row 320) are
  predicted to run there, not measured.
- **The 34-22 pointer-file rows' Windows skip (WINDOWS.md row 321).** The writable chmod-only rows are
  gated on the capability "POSIX permission bits beyond read-only" and are predicted to print their skip
  on windows-latest, so uninstall's pointer-file mode comparison is not reached end to end on Windows.
- **Node 22 readlink and symlink internals.** `preprocessSymlinkDestination` was read from local Node
  v24.12.0 only (34-23). The leg runs Node v22.23.3; its copy was not read.
- **Two related items from the round's SUMMARYs:** whether the protected-path denylists
  (`install.ts` isPruneProtected, `uninstall.ts` isProtected, `p === TARGET`) catch a path composed with
  a native backslash join on Windows (34-21-SUMMARY.md deviation 2, recorded for human triage); and the
  34-VALIDATION.md "Gap round 2 (D-21): prediction for the deferred run" list (`ln` on the runner, the
  20,001-file walk's time bound).
- **Suggested owner:** the human's deferred windows-latest run (D-21), read against the 34-VALIDATION.md
  prediction; HOST-02 stays unchecked until then.

## From gap round 3 (D-25, D-26)

Recorded by plan 34-31. Gap round 3 (plans 34-25 to 34-30) fixed G-34-4 (WR-12 and its siblings A, B
and C, D-25) and built the marker route for G-34-2 (D-26). The disposition ledger records WR-12 and IN-03
as `fixed` with their plans and commits, the other six round-3 rows as `deferred`, and `open: 0`. Under
D-25 Windows is out of scope during active development, so nothing below is a Windows result (WIN-3), and
no live host run was made by an agent.

### (1) IN-03: CLOSED by plan 34-28

- **Finding:** the Pi template was create-only, so a later change to `PI_PROMPT_TEXT` never reached a
  repository that already had it (34-REVIEW-ROUND0.md IN-03).
- **How it was closed:** plan 34-28 made re-install refresh install's own unedited Pi template and
  `AGENTS.md` copy (commit `2fe47e93`), and install's own unedited CLAUDE.md and Copilot blocks through one
  shared span finder (commit `f25fecb3`). A user's carrier that lacks the route gets a note naming the
  hosts it leaves out (commit `513aced4`). The ledger row reads `fixed`.
- **Status:** closed; D-26 point 2.
- **Suggested owner:** none.

### (2) writeMarker reports `created` for `.grugops/install.json` on every write

- **Finding:** `install/install.ts` writeMarker prints `created .grugops/install.json (marker)` after
  every successful write, including a re-install that replaced an existing marker. The G-34-4 diagnosis
  found it (.planning/debug/ask-rules-banner-fabrication.md, Evidence 19:40:30Z, "Adjacent, outside the
  banner scope", scratch scenarios s0-fresh #2, s2, s4, s6 and s7). The `report("created", …)` call is
  still at install.ts:4868 at the round-3 head.
- **Why not fixed:** it is a per-action report label, not a closing-banner sentence. D-25 fixed the
  closing-claim class (WR-12 and siblings A, B and C) and named no per-action label. Changing it changes a
  user-visible report line, which needs a human decision on the label (for example `updated` or
  `replaced` when a marker was already there).
- **Suggested owner:** human backlog triage.

### (3) WR-11: deferred with Windows support

- **Finding:** on a POSIX checkout, a marker written on Windows (`C:/` spelling in `grugopsHome`,
  `kitRoot` and `target`) fails the shape check, so install leaves it unchanged, writes no ask rules and
  exits 3 on every run until a hand edit; the printed reason ("not an absolute path") is false on the host
  that wrote it (34-REVIEW.md WR-11). Nothing is deleted.
- **Why not fixed:** Windows is out of scope during active development (human, 2026-10-09, D-25; 34-UAT.md
  test 4 decision). IN-13 (the `isRecordedAbsolute` docstring and table omit the win32 rooted, drive-less
  spelling) is deferred with it for the same reason.
- **Suggested owner:** the Windows support work, when the human brings Windows back into scope.

### (4) The live Pi re-run (34-UAT.md test 2): the human's act

- **Finding:** 34-UAT.md test 2 failed before round 3: Pi expanded `/grugops`, then read
  `agent-factory/roles/orchestrator.md` under the repository and got ENOENT, because the kit lives in the
  shared home after a scripted install (.planning/debug/pi-grugops-kit-not-found.md).
- **What round 3 did:** plans 34-27 to 34-29 gave the Pi template, the Copilot and CLAUDE.md pointers and
  the kit's `AGENTS.md` the route to the kit through the `kitRoot` field of `.grugops/install.json`
  (`KIT_ROUTE`), made install refresh its own stale carriers, and made `--check` print one reach line per
  host. An offline follower test reads the same route (34-27, `install/kit-route.test.ts`).
- **Status:** `UNKNOWN - verify` until the human re-runs test 2 on a real Pi. No agent ran Pi, and no
  record claims a result. The steps are in 34-VALIDATION.md, "Gap round 3 (D-25, D-26)".
- **Suggested owner:** the human, at `/gsd-verify-work 34`.

### (5) Live runs on Copilot, Codex, OpenCode and Gemini after a scripted install

- **Finding:** the route is carried by `AGENTS.md` and the installer-written pointers on every host, and
  `--check` prints a reach line per host, but no live session on any of these four hosts has been run
  after a scripted install.
- **Status:** each is `UNKNOWN - verify`: Copilot `UNKNOWN - verify`, Codex `UNKNOWN - verify`, OpenCode
  `UNKNOWN - verify`, Gemini `UNKNOWN - verify`.
- **Suggested owner:** backlog 999.4 (ROADMAP.md), re-scoped by plan 34-30 to these live per-host runs.

## From gap round 4 (D-27)

Recorded by plan 34-36. Gap round 4 (plans 34-32 to 34-36, the last round on the four-round cap) fixed the
doctor class of the round-3 review (VERDICT-1 and AUTH-1, 34-GAP-PLANNING-BRIEF.md §4): CR-01, WR-01,
WR-02 and WR-03, with the riders IN-01 and IN-06. The human deferred WR-04, WR-05 and IN-02 to IN-05 (D-27
point 5). The disposition ledger records the six fixed rows with their plans and commits, the six deferred
rows with a reason, and `open: 0`; 34-REVIEW-DISPOSITION-ROUND3.md keeps a copy. Under D-25 Windows is out
of scope during active development, so nothing below is a Windows result, and no live host run was made by
an agent.

### (1) Closed rows, with plans and commits

- **CR-01** (`--check` said Gemini CLI reaches through AGENTS.md without asking whether Gemini reads it):
  plan 34-32. The registry row's entryGates and the one owner hostReadsCarrier, with ENTRY_GATE_CHECKS
  reading this repository's `.gemini/settings.json` through readGeminiContext; the remedy reads
  geminiMergePlan (commits `242a55fb`, `d8b6b2da`).
- **IN-01** (the kitRouteFindings header said readUserFile never opens a link): plan 34-32, the header's
  step-1 sentence now says a link is followed, as a host would follow it (commit `242a55fb`).
- **WR-02** (a note or WARN said a host gets no route while the same run's reach line said it reaches)
  and **WR-03** (`--check --strict` failed when the optional Copilot pointer or Pi template was deleted):
  plan 34-33. One derivation, strandedBy over RouteFacts; the doctor counts a carrier only when it strands
  a host, and install's route notes ask the same derivation over the state the run leaves, DRY_RUN
  included (commits `1327ac26`, `e6a36b9d`).
- **WR-01** (the doctor's own-stale verdict disagreed with install on links, so its FAIL never cleared):
  plan 34-34. One predicate, refreshable, decides refresh for refreshOwnFile, ensureBlock and the doctor;
  the absent arm asks readForWrite (commits `1b91bc2d`, `10bcf91f`).
- **IN-06** (the install guide's AGENTS.md bullet said "only when the target has none"): plan 34-36, the
  bullet says the file is refreshed when it is install's own unedited copy, bound by a doc-truth case
  (commits `e7492436`, `2305ff21`).
- Plan 34-35 added the brief §4 class matrix over the three owners (commits `0c4bb92e`, `d7b4e8ff`); it
  closes no row by itself.

### (2) WR-04: block-carrier facts typed in several places

- **Finding:** ROUTE_BLOCKS (install.ts), BLOCK_RELS (install-marker.ts), ROUTE_POINTERS (host-tools.ts)
  and the sentinels in install.ts and uninstall.ts state the block carriers separately, with no test
  binding them (34-REVIEW.md WR-04).
- **Why not fixed:** deferred by the human (D-27 point 5). Today the sets agree, and the 34-35
  install-and-doctor agreement assertion (assertion 5 of the class matrix) turns red if install and the
  doctor classify a carrier differently.
- **Suggested owner:** backlog triage.

### (3) WR-05: the read-gate-write window in refreshOwnFile

- **Finding:** refreshOwnFile decides ownership from one read and writes using a second read it does not
  re-check (34-REVIEW.md WR-05).
- **Why not fixed:** deferred (D-27 point 5). The window is shorter than the documented writeTargetFile
  residual, and plan 34-34 kept refreshOwnFile's read order (owns, then readForWrite) without widening it;
  ensureBlock decides and splices on one read.
- **Suggested owner:** an installer write-path hardening backlog item.

### (4) IN-02: whether to commit `.grugops/install.json`

- **Finding:** the marker route sends every host to `.grugops/install.json`, which holds a per-machine
  absolute `kitRoot`, and nothing says whether the file is committed (34-REVIEW.md IN-02).
- **Why not fixed:** deferred (D-27 point 5). Both failure modes (a committed marker naming another
  machine's kit, an uncommitted one sending the agent to the repository's own `agent-factory/`) fail
  closed into STOP, and the policy is a human decision about shared state.
- **Suggested owner:** human triage.

### (5) IN-03: the INCOMPLETE closings drop facts

- **Finding:** the `--update` INCOMPLETE banner under DRY_RUN omits the DRY_RUN tag, and the
  already-migrated `--migrate` INCOMPLETE branch omits the backup and leftover-kit advice (34-REVIEW.md
  IN-03).
- **Why not fixed:** deferred (D-27 point 5). No false claim is printed, and adding the facts changes
  user-visible output.
- **Suggested owner:** backlog.

### (6) IN-04: a dead updateKeptMarker call in uninstall

- **Finding:** the uninstall malformed-ledger arm calls updateKeptMarker, which returns `"unchanged"` at
  its first line there, and discards the result (34-REVIEW.md IN-04).
- **Why not fixed:** deferred (D-27 point 5). Harmless, and in uninstall.ts, which this round does not
  touch.
- **Suggested owner:** backlog.

### (7) IN-05: the "preserved (never touched)" heading

- **Finding:** the uninstall closing prints `-- preserved (never touched) --` before a line that can say
  the marker was removed by this run (34-REVIEW.md IN-05).
- **Why not fixed:** deferred (D-27 point 5). Cosmetic; the marker line under the heading is accurate.
- **Suggested owner:** backlog.

### (8) Sibling-search findings for human triage, not fixed

- **Fallback context files are not modelled.** Per 34-RESEARCH.md §B, Pi reads `CLAUDE.md` in a directory
  with no `AGENTS.md`, and OpenCode's fallback is `UNKNOWN - verify`. The registry names only the entry
  files each host reads first, so the verdict errs toward CANNOT reach with a WARN, never toward a false
  "reaches".
- **Gemini's default and user-level context are not read.** `--check` reads only this repository's
  `.gemini/settings.json`; Gemini's default `GEMINI.md` and any user-level Gemini settings are not read,
  so the Gemini verdict is about this repository's files.
- **The no-`kitRoot` FAIL in kitRouteFindings is not reached** by a marker without `kitRoot`: the marker
  shape check (markerUnreadable) stops such a marker earlier (the planner's probe for 34-36).
- **Suggested owner:** human triage.

### (9) Live runs: the human's

The live Pi re-run (34-UAT.md test 2) and the live runs on Copilot, Codex, OpenCode and Gemini after a
scripted install stay the human's. Each is `UNKNOWN - verify`; no agent ran a live host in round 4, and no
record claims a result (34-VALIDATION.md, "Gap round 3 (D-25, D-26)", steps (a) and (b)).
