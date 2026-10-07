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
