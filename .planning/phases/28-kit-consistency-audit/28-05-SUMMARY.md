---
phase: 28-kit-consistency-audit
plan: 05
subsystem: public-docs
status: complete
tags: [audit-02, audit-03, d-08, d-10, d-11, d-12, d-24, d-25, drift-reconciliation, green-transition]

requires:
  - scripts/check-public-docs-vocabulary.js (28-01's drift guard, watched failing RED at 18 hits)
  - docs/audit/28-claim-registry.md (28-04's registry, the eight rows this plan flips)
  - docs/audit/28-disposition-register.md (28-03's register, the prose section this plan fills)
  - scripts/check-claim-anchors.js (28-04's D-16 bijection and verbatim gate)
provides:
  - "the D-24 green transition: exit 1 / 18 hits -> exit 0 / PASS line, documents changed, gate untouched"
  - "five registry rows flipped to `true` (C-28-021, C-28-022, C-28-027, C-28-029, C-28-033)"
  - "three registry rows flipped false -> overstated/accepted (C-28-001, C-28-010, C-28-038)"
  - "the Phase 33 / GAP-D1 coupling record, WITH a named partial overlap"
  - "the two hygiene-directory deletion records, with measured installer indifference"
affects:
  - 28-07 (the register's prose section now has content; its 19 blank workflow rows are untouched)
  - 29 (LANG rewrites prose against the corrected text, not the drifted text)
  - 30 (the claim registry's status column is now the measured post-fix truth)
  - 33 (CAP-01 must work from the rewritten examples/03-ticket-to-pr.md and close the named overlap)

tech-stack:
  added: []
  patterns:
    - "turn a gate green by changing the documents, never by changing the gate"
    - "re-narrate, never path-swap — a resolving path over a dead mechanism is worse than honest staleness"
    - "measure the hypothesis; do not conclude it from reading the code"
    - "record the overlap rather than guess at disjointness"
    - "a capture is a historical record: restate its vocabulary, never rewrite its verdicts"

key-files:
  created:
    - .planning/phases/28-kit-consistency-audit/28-05-SUMMARY.md
  modified:
    - README.md
    - CLAUDE.md
    - AGENTS.md
    - agent-factory/README.md
    - .claude-plugin/plugin.json
    - examples/01-greenfield-bootstrap.md
    - examples/02-brownfield-bootstrap.md
    - examples/03-ticket-to-pr.md
    - examples/04-sprint-cycle.md
    - examples/05-release-run.md
    - docs/audit/28-claim-registry.md
    - docs/audit/28-disposition-register.md
  deleted:
    - agent-factory/handoffs/.gitkeep
    - agent-factory/examples/.gitkeep

decisions:
  - "Three drift rows landed `overstated`/`accepted` rather than `true`, because each is a multi-assertion region whose own worst-of rule now lands on the irreducible `always` residual already accepted at C-28-023. The plan explicitly permits this; recording `true` would have required asserting a status the row's own rule refuses."
  - "The Phase 33 coupling went into the register's PROSE section, not Table B — the task action says so and names the mechanism (readRegister() refuses a Table B row whose file is absent from Table A). The task's own acceptance criterion said Table B; it is a stale leftover and following it would have broken the D-03 equalities."
  - "examples/03-ticket-to-pr.md was found NOT fully disjoint from GAP-D1. The overlap was characterised precisely and the overlapping lines were left untouched rather than guessed at; zero `pending human` lines changed."
  - "The two REAL captures (examples/01, 03) had their memory-channel vocabulary restated and their vintage recorded in clear voice; no captured verdict, command, count or gate result was rewritten."
  - "D-12's code-context note is corrected in the register: the uninstaller is indifferent by CONSTRUCTION (it never touches the kit tree), not by derivation."

metrics:
  duration: ~19m
  tasks: 3
  commits: 3
  files-changed: 14
  completed: 2026-08-12

actuals:
  tokens: 16755
  tasks: 3
  commits: 3
---

# Phase 28 Plan 05: Drift Reconciliation Summary

The eight documents a user actually reads now describe decompose-and-enqueue over a shared queue
with the shared verified context as the only memory between roles, and the drift guard that was
watched failing in wave 1 exits 0 — because the documents changed, not because the gate did.

## The D-24 transition, before and after

**BEFORE** (`node scripts/check-public-docs-vocabulary.js`, measured at plan start, 2026-08-11):

```
  FAIL  AUDIT-02 drift total: 18 hit(s) across 8 of the 10 public document(s) scanned, from
        1 retired path form(s) and 2 retired prose form(s) read from scripts/dead-vocabulary.ts

== Result ==
19 CHECK(S) FAILED
EXIT=1
```

**AFTER** (same command, same tree, no gate edit):

```
[check_public_docs_vocabulary] public documents carry no retired grugops vocabulary (AUDIT-02 / D-09)
  PASS  AUDIT-02: 10 public document(s) carry zero retired vocabulary — root 4, examples 5,
        kitReadme 1; 1 exempted by name (CHANGELOG.md — Keep a Changelog historical record; its
        retired vocabulary describes what the project used to ship, which is what a changelog is
        for); 1 retired path form(s) and 2 retired prose form(s) checked, both read whole from
        scripts/dead-vocabulary.ts

== Result ==
ALL CHECKS PASSED
EXIT=0
```

**The green is a property of the tree, not of the gate.** `git diff 97ef52f..HEAD --name-only --
scripts/ install/ hooks/ package.json` is **empty**. `PUBLIC_DOCS_SCAN_COUNT` is still `10`,
`RETIRED_PATH_FORMS` is still `["agent-factory/handoffs/"]`, and `RETIRED_PROSE_FORMS` still holds
exactly `"handoff packet"` and `"the handoff is the only memory"`. Nothing was removed from a scan
set and no file was exempted to reach zero.

## The descending per-file hit count

Re-measured after every file, as required. The guard's `N CHECK(S) FAILED` line is hits + 1 (the
total line is itself a check), so both columns are given.

| After | Hits | `CHECK(S) FAILED` | What moved |
|---|---|---|---|
| baseline | **18** | 19 | — |
| task 1 (4 top-level docs) | **14** | 15 | all 4 `handoff packet` prose hits gone |
| `examples/01` | **11** | 12 | 3 path hits |
| `examples/02` | **9** | 10 | 2 path hits |
| `examples/03` | **7** | 8 | 2 path hits |
| `examples/04` | **2** | 3 | 5 path hits |
| `examples/05` | **0** | 0 (PASS) | 2 path hits |

Independently confirmed by `grep -rc "agent-factory/handoffs/" examples/`: **0 for all five files.**
`grep -ric "handoff packet" README.md CLAUDE.md AGENTS.md agent-factory/README.md`: **0 for all four.**

## Task 1 — the four top-level documents and the manifest

### The AGENTS.md internal contradiction is resolved

Both lines quoted verbatim from the committed tree, as the acceptance criterion requires:

- `AGENTS.md:6` — *"One Orchestrator (the head grug) **decomposes each request into subtasks and
  enqueues them on a shared queue**; a few single-job grug agents **claim** that work and execute
  within hard limits."*
- `AGENTS.md:26` — *"The shared context is the inter-role memory; the Orchestrator **sequences by
  decompose→enqueue**."*

They asserted different topologies before. They assert the same one now.

### The routing verb was not banned — D-10's three live sites, quoted

- `CLAUDE.md:83` (the platform fact, unchanged): *"**`description` drives auto-routing:** Claude
  reads it to decide when to delegate. Write it as a clear "Use for / Use when ..." with "use
  proactively" if you want eager routing."*
- `agent-factory/roles/orchestrator.md:54`: `### Routing matrix (subtask → role)`
- `.claude/agents/grugops-orchestrator.md:3`: *"Decompose each request into subtasks, **route** each
  to the right role agent within hard limits…"*

All three stand. The drift was one claim, not a token.

### The registry flip, in the same commit — verified from git, not asserted

`git log -1 --name-only` for `51f1892` lists `README.md`, `AGENTS.md`, `CLAUDE.md`,
`agent-factory/README.md`, `.claude-plugin/plugin.json` **and** `docs/audit/28-claim-registry.md`.
That is D-25's requirement discharged on a real commit.

| Claim | Before | After | Why |
|---|---|---|---|
| C-28-001 `README.md:4` | false / fixed | **overstated / accepted** | drift fixed; the `always` residual is C-28-023's |
| C-28-010 `AGENTS.md:6` | false / fixed | **overstated / accepted** | contradiction fixed; the *"humans decide"* residual is C-28-023's |
| C-28-021 `agent-factory/README.md:4-6` | false / fixed | **true** | closed |
| C-28-022 `agent-factory/README.md:8-11` | false / fixed | **true** | closed |
| C-28-027 `agent-factory/README.md:40-43` | false / fixed | **true** | closed |
| C-28-029 `agent-factory/README.md:55-58` | false / fixed | **true** | closed |
| C-28-033 `agent-factory/README.md:85-94` | overstated / fixed | **true** | closed — the third D-10 arrow chain |
| C-28-038 `.claude-plugin/plugin.json:4` | false / deferred → 28-05 | **overstated / accepted** | deferral discharged; the `always` residual is C-28-023's |

`node scripts/check-claim-anchors.js` exits **0**: 38 rows, 37 markdown, 1 unanchorable, 37 verbatim
comparisons all byte-identical, all 4 safety floors mapped.

### C-28-038 — the one that could have escaped, and did not

`.claude-plugin/plugin.json` is JSON, so it cannot carry an HTML comment and is outside the D-16
bijection by construction. **Nothing would have gone red had it been forgotten.** Its `description`
was rewritten by hand in the same commit as the four anchored documents, the manifest was re-parsed
as JSON, and the row's verbatim block was diffed against the file character for character. The
residual itself is unchanged for the next editor, and the registry now says so explicitly.

### The five-tool dispatch table — recorded, NOT fixed

`agent-factory/README.md`'s dispatch table (registered as C-28-028, `overstated`/`accepted`) is
**byte-unchanged by this plan** — `git diff` shows zero changed lines among its seven. It predates
the three-tier spawn vocabulary Phase 27 established (Full / Reduced / Degraded) and still uses a
two-mode *spawn versus sequential-load* split. `28-CONTEXT.md`'s deferred list records that this
falls out of the D-07 category-1 rubric as a **finding to be dispositioned**, not as something
pre-decided here. It is recorded as a finding; it was not fixed.

## Task 2 — the five examples, re-narrated

Each file was read start to finish after its rewrite and reads as a continuous narrative. One
restructured passage per file is named below — this is the evidence of re-narration rather than
substitution (T-28-27's mitigation).

| File | Restructured passage (not substituted) |
|---|---|
| `01-greenfield-bootstrap.md` | § *Expected files and handoffs* → § *Expected files and published notes*. The three handoff bullets were **deleted as bullets** and replaced by a clear-voice vintage paragraph plus three `decision`-note bullets naming what each role publishes and where, closing on the non-relay invariant and the `finding` admission rule. |
| `02-brownfield-bootstrap.md` | The `# Security/NFR Handoff` fenced document was replaced by a real **context-note frontmatter block** (`id` / `kind: decision` / `by` / `at` / `verified_by`) per `agent-factory/contracts/context-note.md`, with a following paragraph explaining why a verdict is a `decision` and not a stamped `finding`. |
| `03-ticket-to-pr.md` | § *Handoffs produced (real files)* → § *What the two roles published (real results)*. The sentence *"Under `agent-factory/handoffs/` on the sample tree:"* was **deleted**, not repointed, and replaced by the claim/publish/pull description. |
| `04-sprint-cycle.md` | The line-106 passage naming two artifacts by filename was rewritten end to end into the enqueue → claim → publish → pull → gate sequence, naming `17-task-claim.md` and `16-context-read-write.md` as the mechanisms. |
| `05-release-run.md` | *"and the handoff `…/release-handoff.md` carrying the version, scope, evidence…"* became *"and it publishes the same version, scope, evidence and approval record as typed notes… the traceability trail is **rendered from those notes** rather than transcribed out of a passed-along file."* |

### The `examples/04` line-106 filenames now all resolve

Every filename the rewritten passage names was checked on disk:

```
  RESOLVES  agent-factory/workflows/04-ticket-to-pr.md
  RESOLVES  agent-factory/workflows/05-pr-quality-gate.md
  RESOLVES  agent-factory/workflows/16-context-read-write.md
  RESOLVES  agent-factory/workflows/17-task-claim.md
```

The two artifacts it used to name (`implementation-handoff.md`, `qe-handoff.md`) are gone from the
file. They have no replacement filename, because the mechanism changed rather than the filename —
which is exactly why the passage was rewritten rather than repointed.

### The two REAL captures were restated, never falsified

`examples/01` and `examples/03` are marked *"Real run — captured 2026-06-03"*. A capture is a
historical record, and rewriting one to claim it produced artifacts it did not produce would be
fabricating a run result. So:

- **No gate verdict, command, exit code, diffstat, test count or board snapshot was changed** in
  either file.
- Each carries a **clear-voice paragraph** recording that the memory-channel vocabulary was
  restated, that the capture predates Phase 24's replacement of the relay, and exactly which line
  moved.

## Task 3 — the two hygiene directories

### Both shipped to every user — measured, not inferred

An installer run against a scratch target with `GRUGOPS_HOME` redirected produced, in the installed
kit: `./agent-factory/examples`, `./agent-factory/examples/.gitkeep`, `./agent-factory/handoffs`,
`./agent-factory/handoffs/.gitkeep`. The listing was read. D-12's premise holds.

### The installer output diff, before vs after — it contains no line other than the expected two

```
================ diff: installer OUTPUT before vs after ================
(IDENTICAL — zero lines differ)
================ diff: KIT listing before vs after ================
@@ -24,10 +24,6 @@
 ./agent-factory/contracts/context-note.md
 ./agent-factory/contracts/task-notes.template.md
-./agent-factory/examples
-./agent-factory/examples/.gitkeep
-./agent-factory/handoffs
-./agent-factory/handoffs/.gitkeep
 ./agent-factory/packaging
================ diff: TARGET listing before vs after ================
(IDENTICAL)
================ diff: uninstaller OUTPUT before vs after ================
(IDENTICAL — zero lines differ)
================ diff: TARGET post-uninstall before vs after ================
(IDENTICAL)
```

Exit codes: installer `0` → `0`, uninstaller `0` → `0`. No new warning, no new unreadable-path
finding, no changed exit code. The only difference anywhere is the four expected lines.

### The literal grep, recorded with its result

**Zero hits** name either directory as a path that is read, written, required or removed by
`install/`, `scripts/` or `hooks/`. Every hit falls into four harmless classes: the
`RETIRED_PATH_FORMS` literal (which asserts *zero* occurrences and is therefore **strengthened** by
the deletion); synthetic RED fixtures in `*.test.ts` that plant the string into hermetic mirrors;
Phase 24 and wave-1 comments; and `check-kit-refs.ts:55`, a comment noting `agent-factory/examples/`
is excluded **by not being listed**.

**Two near-misses are recorded because scoring them as hits would have been wrong:**

- `install/install.ts:735` — `join(TARGET, "plans", "handoffs")`. That is `plans/handoffs/` in the
  target repo's per-repo STATE, a different path. Untouched, and it must stay.
- `scripts/check-public-docs-vocabulary.ts:97` — `const EXAMPLES_DIR = "examples"`. That is the
  **repository-root** `examples/` directory, not `agent-factory/examples/`. Confusing the two would
  have predicted this deletion empties the drift guard's scan set. It does not: the guard still
  derives five members and `PUBLIC_DOCS_SCAN_COUNT` is still 10.

### One correction to D-12's code-context note

The note says the installer's `cpSync` and *"the uninstall mirror"* both track by derivation. The
`cpSync` half is right. The uninstall half is **stronger and differently shaped**: `uninstall.ts`
never touches the kit tree at all — its header states it never deletes the shared kit at
`$GRUGOPS_HOME`, and removing it is a manual `rm`. It is indifferent **by construction**, not by
derivation, and could not have carried a literal for either directory. Recorded in the register.

### Where the deletions are recorded, and why there

Both go in `docs/audit/28-disposition-register.md` § *Recorded couplings and out-of-set notes*, in
prose. **A directory has no Table A row** — Table A is derived from `listRoles()` and
`listWorkflows()` and its `kind` is the closed set `role | workflow | protocol` — and
`readRegister()` refuses a Table B row whose `file` is absent from Table A. Forcing a row would have
broken the D-03 equalities this phase built.

## Deviations from Plan

### 1. [Rule 4-adjacent, resolved by the plan's own text] Three rows landed `overstated`, not `true`

- **Found during:** Task 1.
- **Issue:** C-28-001, C-28-010 and C-28-038 are each a hard-wrapped region carrying more than one
  assertion, and each row's `mechanism` has said since 28-04 that the row *takes the WORST of them*.
  Fixing the drift assertion in each still leaves the *"humans always hold merge and deploy"* /
  *"humans decide; agents execute"* absolute, which C-28-023 measures `overstated` against an
  irreducible same-uid / no-hook / direct-filesystem forgery residual.
- **Resolution:** Recorded `overstated` / `accepted`, with the residual named and cross-referenced
  to C-28-023 / F-28-208 in every row. The plan's task-1 action explicitly permits this: *"set
  `status` to `true` — or to `overstated` with a disposition, if the corrected sentence is still
  stronger than its mechanism supports."* The alternative — rewording the absolute — was declined
  because C-28-023 registers the identical claim as an `accepted` row this plan is instructed not
  to touch, and recording `true` would have asserted a status the row's own rule refuses.
- **Commit:** `51f1892`.

### 2. [Plan-internal contradiction, resolved toward the action] The Phase 33 coupling went in prose

- **Found during:** Task 2.
- **Issue:** Task 2's `<action>` says the coupling *"goes in prose, not in Table B, and the reason
  matters"*, naming the mechanism (`readRegister()` refuses a Table B row whose `file` is absent
  from Table A; `examples/03-ticket-to-pr.md` has no Table A row). Task 2's `<acceptance_criteria>`
  then says *"A finding row … exists in … Table B with disposition `accepted`"*.
- **Resolution:** The action was followed. It is explicit, reasoned, and names the exact mechanism a
  Table B row would break; the acceptance criterion is a stale leftover, and satisfying it would
  have made the register unparseable and broken the D-03 equalities. Verified after the edit:
  `readRegister()` still returns 37 rows and 15 findings.
- **Commit:** `d891c9e`.

### 3. [Real finding — the overlap the plan told me to look for] `examples/03` is NOT fully disjoint from GAP-D1

- **Found during:** Task 2, by the reading the plan required.
- **Issue:** The § *Dual-path parity (DOG-02)* table's intro sentence (*"the same ticket, the **same
  handoff filenames**, and the same gate verdict"*) and its `Handoff filenames produced` row's LEFT
  cell both carry retired relay vocabulary. The **right** cells of that table are precisely what
  GAP-D1 fills with captured live-run output. The overlap is at **row granularity: one row, two
  owners.**
- **Resolution:** Those two lines were **deliberately left untouched**, and the overlap is
  characterised line by line in the register with an explicit statement of what Phase 33 must do.
  Rewriting a parity dimension's left cell while its right cell reads *"expect the SAME filenames"*
  would assert a parity between a rewritten dimension and an unrun capture — a contradiction this
  plan cannot resolve, because resolving it needs the live run Phase 33 owns. **`git diff` for this
  plan changed zero `pending human` lines**, which is the mechanical evidence.
- **Commit:** `d891c9e`.

### 4. [Rule 3 - Blocking] The installer writes to the user's real `$HOME` by default

- **Found during:** Task 3, on the first scratch run.
- **Issue:** The installer uses the shared two-root layout: the kit goes to `~/.grugops/agent-factory`,
  not into the `--target`. The first measurement run therefore created a real
  `~/.grugops/agent-factory` tree on the user's machine, and `uninstall.ts` deliberately never
  removes it.
- **Fix:** The created tree was removed by hand (`~/.grugops` itself pre-existed, born 2026-06-07, and
  was left alone; only the `agent-factory` subtree, born during this run, was removed). Both the
  before and after measurement pairs were then re-run hermetically with
  `GRUGOPS_HOME=<scratch>/…/home`, so nothing outside the scratch directory was written. `$HOME` was
  re-checked after the final run and contains only the pre-existing empty `~/.grugops`.

### 5. [Rule 3 - Blocking] A verification command with a false premise, caught and re-run

- **Found during:** the final verification pass.
- **Issue:** A "did this plan touch `scripts/`?" check was written against `663c03e`, taken from the
  session's opening git snapshot. That snapshot was stale: the real parent of this plan's first
  commit is `97ef52f`. The check therefore reported 22 files and 7,074 insertions in `scripts/` —
  other plans' work, attributed to this one.
- **Fix:** Re-run against `97ef52f`. `git diff --name-only 97ef52f..HEAD -- scripts/ install/ hooks/
  package.json` is **empty**. Recorded because asserting a verification harness's own premise is a
  standing lesson in this repository, and this instance would otherwise have produced a false claim
  in this very SUMMARY.

### 6. [Recorded, not fixed] The `git add` that aborted, and the amend

Task 3's `git add` named the two `.gitkeep` paths, which `git rm` had already staged and removed
from disk; `git add` exits fatal on a non-existent pathspec and aborts the **whole** add, so
`docs/audit/28-disposition-register.md` was silently left out of `cde40c3`. Caught by reading
`git log -1 --name-status` rather than trusting the exit chain. Amended into `91264c5` (unpushed,
own commit, `main`, no protected-ref rewind).

## Findings recorded rather than fixed

These are real drift found while executing, outside this plan's worklist. None was fixed.

| # | Where | What | Why not fixed here |
|---|---|---|---|
| 1 | `agent-factory/README.md:46-52` | the five-tool dispatch table predates Phase 27's three-tier vocabulary | `28-CONTEXT.md` § Deferred records it must fall out of the D-07 rubric as a finding, not be pre-decided. Registered as C-28-028. |
| 2 | `CLAUDE.md:33` | the stack table's *"All roles, workflows, **handoffs**, checklists…"* still names the retired concept | Inside the GSD-generated `<!-- GSD:stack-start source:research/STACK.md -->` block; not a guard hit, not a registry row, and editing generated content adds regeneration-drift surface for a bare word no gate holds. |
| 3 | `CLAUDE.md:6,10` | the two lines this plan **did** fix sit inside `<!-- GSD:project-start source:PROJECT.md -->` | `.planning/PROJECT.md` still carries the pre-fix text, so a GSD docs regeneration would reintroduce the drift. **This fails loudly, not silently** — `check-public-docs-vocabulary.js` scans `CLAUDE.md` and would go red. `PROJECT.md` was deliberately not edited: it is out of this plan's `files_modified` and it is a member of `WR05_SCAN`. |
| 4 | `examples/01:27` | `sh install/install.sh` — that installer was retired by D-13 and does not exist | It is a **capture** of what actually ran on 2026-06-03. Rewriting it to `node install/install.js` would falsify the record. |
| 5 | `examples/01:130`, `examples/03:143` | `scripts/validate-agent-factory.mjs` — the file is `.js` now | Same reason: captured command text. |
| 6 | `examples/03:157-181` | the DOG-02 parity table's relay vocabulary | Overlaps GAP-D1's edit surface — see Deviation 3. Owned by Phase 33 / CAP-01. |

## Verification

| Check | Result |
|---|---|
| `node scripts/check-public-docs-vocabulary.js` | **exit 0**, PASS line naming its counts |
| `node scripts/check-claim-anchors.js` | **exit 0**, 37 verbatim comparisons byte-identical |
| `node scripts/check-foundation-guards.js` | exit 0, ALL CHECKS PASSED |
| `node scripts/check-kit-refs.js` | exit 0, ALL CHECKS PASSED |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0, ALL CHECKS PASSED |
| `npm run freshness` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — 44 files, 1525 passed, 2 skipped |
| `grep -rc "agent-factory/handoffs/" examples/` | 0 for all five |
| `grep -ric "handoff packet" README.md CLAUDE.md AGENTS.md agent-factory/README.md` | 0 for all four |
| `test ! -d agent-factory/handoffs && test ! -d agent-factory/examples` | both gone |
| `git status --porcelain agent-factory/` | the two deletions and nothing else |
| `git diff --stat CHANGELOG.md docs/initial/ docs/design/` | empty — exemptions untouched |
| `git diff --stat package.json` | empty — T-28-32 confirmed, no install occurred |
| `node scripts/check-audit-register.js` | exit 1 — the **same 2 pre-existing** failures (19 blank workflow rows), diffed against the pre-edit baseline and byte-identical. **28-07's, not forced green here.** |

## Known Stubs

None. This plan wrote no placeholder, no empty return, and no unwired component.

The two skipped tests in the suite are pre-existing and were not introduced, modified or skipped by
this plan — no test file was touched (`git diff --name-only 97ef52f..HEAD -- scripts/` is empty).

## Threat Flags

None. This plan added no network endpoint, no auth path, no file-access pattern and no schema
change. It deleted two empty directories and rewrote prose. `package.json` is byte-unchanged, so
T-28-32's accepted basis (no install occurs, no manifest touched) held.

## Self-Check: PASSED

Files claimed created/modified, verified on disk:

```
FOUND: .planning/phases/28-kit-consistency-audit/28-05-SUMMARY.md
FOUND: README.md  CLAUDE.md  AGENTS.md  agent-factory/README.md
FOUND: .claude-plugin/plugin.json
FOUND: examples/01…05 (all five)
FOUND: docs/audit/28-claim-registry.md  docs/audit/28-disposition-register.md
GONE (as intended): agent-factory/handoffs/  agent-factory/examples/
```

Commits claimed, verified in `git log`:

```
FOUND: 51f1892  docs(28-05): reconcile the four top-level documents and the plugin manifest…
FOUND: d891c9e  docs(28-05): re-narrate all five examples onto the shared verified context
FOUND: 91264c5  chore(28-05): delete the two hygiene directories, measure the installer's indifference
```
