---
phase: quick-261018-hs8
plan: 01
subsystem: installer, host adapters, generator, docs, licensing
tags: [launch-agent, opencode, copilot-cli, antigravity-cli, pi, per-agent-ownership, mit-license]
status: complete
requires:
  - "install/host-tools.ts registry (HOST_TOOLS, ROUTE_POINTERS, ADAPTER_FOOTPRINT)"
  - "scripts/generate-host-entries.ts (ENTRY_SHAPES, POINTER_LINE)"
  - "install.ts writeWholeFileEntry (the whole-file entry rule) and materializeRunnable (RUNNABLES)"
provides:
  - "HostTool.launchAgent on all six rows; hostPointers(h) and hostFootprint(h)"
  - "LAUNCH_SHAPES, launchShapeProblem, frontmatterProblem, renderedEntryRels in the generator"
  - "four committed launch files named grugops-orchestrator (Antigravity CLI, OpenCode, GitHub Copilot CLI, Pi)"
  - "agent-factory/LICENSE and agent-factory/NOTICE (byte copies of the root files)"
  - "tools/grugops/LICENSE written by a per-repo install (a fifth RUNNABLES row)"
  - "package.json and the lockfile root declare license MIT"
affects:
  - install/install.ts, install/uninstall.ts, install/install-marker.ts, install/host-tools.ts
  - scripts/generate-host-entries.ts, scripts/host-entries-freshness.ts, scripts/check-banned-claims.ts
  - README.md, install/README.md, agent-factory/packaging/adapters.md, examples/01-greenfield-bootstrap.md, CHANGELOG.md
tech-stack:
  added: []
  patterns:
    - "one registry field (launchAgent) joined to the per-kind tables only through two helpers; a syntax-tree census pins the per-kind table accesses at 3"
    - "committed byte copies of a single-source file, held equal by a byte-equality test"
key-files:
  created:
    - .agents/agents/grugops-orchestrator.md
    - .opencode/agents/grugops-orchestrator.md
    - .github/agents/grugops-orchestrator.agent.md
    - .pi/grugops-orchestrator.md
    - agent-factory/LICENSE
    - agent-factory/NOTICE
    - .planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-BASE-FAILURES.txt
  modified:
    - install/host-tools.ts
    - install/install-marker.ts
    - install/install.ts
    - install/uninstall.ts
    - scripts/generate-host-entries.ts
    - scripts/host-entries-freshness.ts
    - scripts/check-banned-claims.ts
    - package.json
    - package-lock.json
    - README.md
    - install/README.md
    - agent-factory/packaging/adapters.md
    - agent-factory/packaging/subagent.frontmatter.md
    - examples/01-greenfield-bootstrap.md
    - CHANGELOG.md
decisions:
  - "Launch files are route carriers (PD-1): --check counts each as a carrier of its host, so a host whose launch file holds the route is not stranded by a missing other entry"
  - "The banned-claims exact exclusions are spread from renderedEntryRels() (PD-2); admission of the generated entries as a scanned part (34.1 DI-01) stays open"
  - "The kit carries LICENSE and NOTICE as committed byte copies inside agent-factory/, not as an install-time copy of root files (that would make --update keep a spurious backup each run)"
  - "A per-repo install writes only tools/grugops/LICENSE (next to the copied programs), through the existing RUNNABLES rule; no NOTICE and no other license file goes into the repository"
  - "The Task 4 CHANGELOG entry sits under [Unreleased] ### Fixed (the orchestrator's instruction; the plan text said ### Added)"
metrics:
  duration: "about 6 h wall clock over 4 executor dispatches (base run 14:11, last commit 19:59 local); Task 4 about 1 h 30 min, two full-suite runs of about 30 min each"
  completed: 2026-10-18
  tasks: 4
  files_changed: 49
commits: 4
plan_head_before: eba46ad51767b1bd190391f33341ff35f6ded2ac
plan_head_after: 1e8b3c2c8c10a56e80233271be8dbdfd52367ff3
actuals:
  tokens: 81216
  tasks: 4
  commits: 4
---

# Phase quick-261018-hs8 Plan 01: Launch agents and the shipped MIT license Summary

Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi now each get a `grugops-orchestrator` launch file. Each one is a thin pointer rendered by the generator, written under the whole-file entry rule, owned and removed per agent through `HostTool.launchAgent`, and reported by `--check`. Codex CLI gets none and is unchanged. Separately, every kit copy now carries the MIT `LICENSE` and `NOTICE`, a per-repo install writes `tools/grugops/LICENSE` next to the programs it copies, and `package.json` declares MIT.

`actuals.tokens` is chars/4 over `git diff eba46ad5..HEAD` (Task 4 alone: 9880).

## Commits

| Task | Commit | Subject |
|------|--------|---------|
| 1 | 30992e0d | feat(quick-261018-hs8): Antigravity CLI launch agent end to end |
| 2 | daf5d111 | feat(quick-261018-hs8): launch agents for OpenCode, Copilot CLI and Pi |
| 3 | f48262c2 | docs(quick-261018-hs8): launch forms in invoke text and docs |
| 4 | 1e8b3c2c | fix(quick-261018-hs8): ship the MIT license and NOTICE with the kit |

`git rev-list --count eba46ad5..HEAD` = 4 (ledger `.git/gsd-plan-head-before-quick-261018-hs8-01` = eba46ad5).

## What each task did

- **Task 1 (tracer).** `LAUNCH_AGENT_NAME`, `ANTIGRAVITY_AGENT_REL`, a required `launchAgent` on all six rows, and `hostPointers`/`hostFootprint`, which every consumer now reads (wholeFileEntryRels, entryLabel, installedSplit, the nothing-installed note, agentClosingLines, reportDirCandidates, entryOwners, routeCarriers). The generator gained `LAUNCH_SHAPES` (with a two-sided `launchShapeProblem`), `frontmatterProblem`, one path check, an unfenced render for an empty frontmatter, `RenderedEntry.owner` and `renderedEntryRels()`. `.agents/agents/grugops-orchestrator.md` is committed generator output. The banned-claims exclusions are spread from `renderedEntryRels()`. The census pins the per-kind table accesses at 3. The base failure list was committed.
- **Task 2.** `OPENCODE_AGENT_REL`, `COPILOT_AGENT_REL`, `PI_LAUNCH_REL` and their shapes: OpenCode `description` + `mode: primary`; Copilot `name` + `description`; Pi with no frontmatter. Each launch agent has a per-agent removal row, and the Copilot row keeps a user's `.github/workflows/ci.yml`. There is no `default_agent`/`agent` key in `opencode.json`, and nothing is written at `.pi/SYSTEM.md`, `.pi/APPEND_SYSTEM.md` or `.pi/settings.json`. The generator renders 7 entries.
- **Task 3.** Each host's `invoke` text gives its launch form (built from `LAUNCH_AGENT_NAME`/`PI_LAUNCH_REL`). README.md Start a session rows, install/README.md (touch list, kit-route paragraph, the four usage sections with sources retrieved 2026-10-18, §6 Degraded, the no-default-setting rule), adapters.md, subagent.frontmatter.md, the greenfield example and a CHANGELOG `### Added` bullet. The docs tests are derived from `hostPointers`/`launchAgent`.
- **Task 4.** `agent-factory/LICENSE` and `agent-factory/NOTICE` (made with `cp` from the root files). The row `["LICENSE", "tools/grugops/LICENSE"]` was added to `RUNNABLES` and `RUNNABLES_MIRROR`, with the reasoning comment. `"license": "MIT"` went into package.json and the lockfile root entry. Also: install/README.md §1 and the `tools/grugops/` touch-list bullet, a CHANGELOG `### Fixed` entry, and the tests below.

## Failure-set counts (full non-e2e suite, `npx vitest run --exclude '**/scripts/e2e/**'`)

| Run | Tests | Failure keys | New keys against B |
|-----|-------|--------------|--------------------|
| base (B, eba46ad5) | 8256 | 21 | n/a |
| after1 | 8304 | 23 | board-watch-live flake only (reported by Task 1) |
| after2 | 8394 | 23 | board-watch-live flake only (reported by Task 2) |
| after3 | 8395 | 22 | board-watch-live flake only (reported by Task 3) |
| after4 (first Task 4 run) | — | — | 6 hand-typed pins + 1 path-fold finding in the new test + 2 board-watch-live keys; all fixed, see Deviations |
| after4b (final, before commit, tree identical to 1e8b3c2c) | 8414 | 23 (8389 passed, 2 pending) | 2 keys, both in `scripts/board-watch-live.test.ts` |

after4b's two new keys are `board-dashboard live — a watch failure is a DIAGNOSABLE state ... publishes the failed directory's record, then DROPS it` and `board-dashboard live — the DEBOUNCE ... coalesces 5 atomic-rename writes`. When that file is rerun alone (`npx vitest run scripts/board-watch-live.test.ts`), both pass, and the only failure is the base key `the EVENT path ... delivers an atomic-rename edit in less than one poll period`, which is already in B. That file is the known flake, so they are not regressions. No base key cleared.

## Task 4: mutation transcripts

1. **One byte of `agent-factory/NOTICE`** (first byte set to `X`):
   - `npx vitest run install/installer-kit-home.test.ts -t 'byte copy of the root'` exits 1. Output: `× agent-factory/NOTICE is a byte copy of the root NOTICE` / `AssertionError: agent-factory/NOTICE differs from the root NOTICE; run: cp NOTICE agent-factory/NOTICE: expected false to be true`.
   - Restored with `cp NOTICE agent-factory/NOTICE` (`cmp` clean). The rerun exits 0 (`Tests 2 passed`).
2. **The `RUNNABLES_MIRROR` row removed** from install/uninstall.ts, then `npm run build`:
   - `npx vitest run install/install.test.ts -t 'are the same mapping'` exits 1. Output: `× runnable removal: the installer's RUNNABLES and the uninstaller's RUNNABLES_MIRROR are the same mapping` / `AssertionError: expected [ …(4) ] to deeply equal [ 'tools/grugops/LICENSE', …(4) ]`.
   - The row was restored and the build rerun. `install/uninstall.js` is byte-identical to the pre-mutation build, and the rerun exits 0.

Neither mutation was committed.

## Task 1: ownership mutation transcripts (re-run by the Task 4 executor on 2026-10-18 against 1e8b3c2c, then reverted)

The Task 1 executor's own transcripts are not on disk, so both mutations were re-run here:

1. **T1-M1: `hostFootprint` returns `ADAPTER_FOOTPRINT[h.adapter]` alone** (ownership falls back to per kind):
   - The converse row `uninstall Antigravity while Codex stays: ...` exits 1 with `AssertionError: .agents/agents/grugops-orchestrator.md is still there after Antigravity CLI was removed`.
2. **T1-M2: `ANTIGRAVITY_AGENT_REL` added to `ADAPTER_FOOTPRINT["agent-skill"]`:**
   - **The plan's predicted red did not occur on the row it named.** The extended tracer row `uninstall Codex while Antigravity stays: ...` stays green (`Tests 1 passed`). Under this mutation Codex CLI co-owns the file, and Antigravity CLI is still installed, so the shared-file rule keeps it, which is what that row asserts.
   - The mutation does go red on the converse row: `uninstall Antigravity while Codex stays` fails with `AssertionError: .agents/agents/grugops-orchestrator.md is still there after Antigravity CLI was removed`.
   - It also goes red on two host-tools.test.ts registry cases: `each launch path is ... in no kind's ROUTE_POINTERS or ADAPTER_FOOTPRINT` and `the launch file and the directory install makes for it belong to their one row`.
   - So the per-agent ownership property is mutation-proven, but by the converse row and the registry cases, not by the tracer row.
3. **Reverted.** `install/host-tools.ts` and `.js` are byte-identical to the committed files, both rows are green (`Tests 2 passed`), and `npm run check:build-parity` passes.

**Task 2's mutation transcripts** (from scratch logs `$S/mut-M*.log`):
- **M1: `hostFootprint` ignores the row's launchAgent.** Each of `uninstall --opencode|--copilot|--pi while Claude Code stays` goes red with `<launch path> is still there after <host> was removed`.
- **M2: the launch path is put in the `claude-kit` footprint.** The same three rows go red the same way.
- **Restored.** `Tests 4 passed`.

## Task 4: plugin cache listing and per-repo license reasoning

- **Plugin cache, observed 2026-10-18.** `~/.claude/plugins/cache/grugops/grugops/2.1.0/` lists `agent-factory AGENTS.md brand CHANGELOG.md CLAUDE.md CONTRIBUTING.md docs examples hooks human-notes.txt install LICENSE memory-bank node_modules NOTICE package-lock.json package.json plans README.md scripts skills tsconfig.fixtures.json tsconfig.json tsconfig.tests.json vitest.config.ts`. The plugin holds the repository root, so it already carried `LICENSE` and `NOTICE`, and `.claude-plugin/plugin.json` already says `"license": "MIT"`. Nothing changed for the plugin form. With this commit, its `agent-factory/` carries them as well.
- **Kit home before this change.** `~/.grugops/agent-factory` (read-only listing) holds no `LICENSE` and no `NOTICE`. The new kit-home tests show that a fresh install, and `--update` after both files are deleted, leave both files at the marker's `kitRoot`, byte-identical to the root.
- **Per-repo reasoning.** Install copies grugops program files (the four runnables under `tools/grugops/`) into the user's repository, and those copies stay there when the repository is shared. The MIT license asks that its notice go with every copy, and a license in the kit home does not travel with the repository. So `tools/grugops/LICENSE` goes next to the programs, by the RUNNABLES rule: written only where nothing is, recorded kit-false, removed only while it holds install's bytes, never written over a user's file. NOTICE is not copied into the repository, because MIT does not ask for it and it travels with the kit. The absence test asserts that, after an install, the only license-like file in the target is `tools/grugops/LICENSE`.
- **Lockfile.** One line was added to the root entry `packages[""]`. `npm install --package-lock-only --ignore-scripts` then left package-lock.json byte-identical to the hand edit (`cmp` clean), so the lockfile is consistent. `npm ls --depth=0` exits 0, and `git diff --numstat` gives `1 0` for package.json and `1 0` for package-lock.json. No dependency entry changed, and no package was installed.

## Adapted premise tests

**Task 1 and Task 2.** Each premise was "this host has one entry". Each test now acts on every path the registry gives the host: ROUTE_POINTERS plus launchAgent.
- **install/message-references.test.ts, M3 and the Pi-stranding note case.** Before: refusing the Pi template alone stranded Pi. After: a directory is planted at the Pi launch path too, so every Pi write is refused or every Pi carrier is gone.
- **install/message-references.test.ts, M4 and M9.** Before: deleting the template emptied Pi. After: the launch file is deleted too.
- **install/agents-record.test.ts, R35 and the :1053 row.** Before: deleting the Pi template left Pi holding nothing. After: both Pi files are deleted, with a premise assertion that Pi has a launch file.
- **install/kit-route.test.ts.** carriersOf, hasSomethingInstalled and the carrier axis add the row's launchAgent, read from registry data and never through hostPointers.
- **install/host-tools.test.ts.** expectedCarriers is an independent oracle that adds the launchAgent field.
- **install/install.test.ts.** The Pi `.pi` file set is derived from hostPointers, with explicit absence checks for `SYSTEM.md`, `APPEND_SYSTEM.md` and `settings.json`.
- **install/installer-write-set.test.ts.** Uses hostPointers. Exact before and after wording is in the Task 1 and Task 2 commits.

**Task 4.** These consumers inspect a mapping destination as a program. The plan says to restrict those to `.js` destinations without weakening anything:
- **install/install.test.ts, the mapping-equality case.** Before: every source under `scripts/runnable-ref/`, with count 4. After: count 5. The 4 program rows are still asserted under `scripts/runnable-ref/`, the one non-program row is pinned exactly as `[["LICENSE", "tools/grugops/LICENSE"]]`, and every destination is still under `tools/grugops/`.
- **install/install.test.ts, "leaves no runnable behind".** Before: every destination is gone and has the `grugops runnable` label. After: every destination is still asserted gone. The `grugops runnable` label is asserted for each program row, and the plain `(recorded in the install ledger)` label is asserted for the license row.
- **install/install.test.ts, the user-modified, source-no-longer-shipped and DRY_RUN cases.** Before: `RUNNABLE_RELS[0]`/`[1]`. After: `PROGRAM_RELS[0]`/`[1]`. Under the sort, `tools/grugops/LICENSE` became `RUNNABLE_RELS[0]`, and these cases plant `.js` bodies and assert the program label. `PROGRAM_RELS[0]` is the same row as before (`host-protection.js`).

## Moved pins, with reasons

| Pin | File | Moves | Reason |
|-----|------|-------|--------|
| ENTRY_COUNT | generate-host-entries.test.ts, host-entries-freshness.test.ts, host-entries.test.ts | 3 → 4 → 7 | Rendered entries gain each launch agent (T1, T2) |
| TABLE_CARRIERS | host-tools.test.ts | 6 → 7 → 10 | Each launch agent is a route carrier (PD-1) |
| LAUNCH_AGENT_COUNT | host-tools.test.ts | 1 → 4 | Launch-bearing rows |
| banned-claims `exact.length` | check-banned-claims.test.ts | 11 → 12 → 15 | Exclusions spread from renderedEntryRels() |
| RECORDED_FILE_COUNT | installer-cross-version.test.ts | 34 → 35 → 38 → **39** | T1/T2: launch agents. T4: `tools/grugops/LICENSE` |
| never-installed `rec.files` | install.test.ts | 10 → 11 → 14 → **15** | Same |
| WRITE_PATH_COUNT | installer-never-installed.test.ts | 94 → 96 → 101 → **102** | T4: one file, `tools/grugops` already a dir |
| READ_PATH_COUNT | installer-special-files.test.ts | 63 → 64 → 67 → **68** | T4: the license destination is asked through readForWrite |
| INSTALLED_FILE_COUNT | installer-user-edit.test.ts | 61 → 62 → 65 → **66** | T4: one more installed file |
| REMOVABLE_COUNT | record-truth.test.ts | 36 → 37 → 40 → **41** | T4: recorded and removable |
| CREATED / REMOVED_DIRS | ledger-provenance.test.ts | CREATED 10 → 11 → 14 → **15**; REMOVED_DIRS 19 → 20 → 22 (unchanged in T4) | T4: `tools/grugops/LICENSE`, test title updated to say so |
| RUNNABLES mapping size | install.test.ts | 4 → **5** (programs stay 4) | T4: the license row |

Each Task 4 pin carries a dated (2026-10-18) reason line in its existing comment style.

## Other measurements

- **Banned-claims residue of the launch frontmatter**, measured with the gate's own matcher: 0 occurrences (Tasks 1 and 2).
- **Exhaustive-table duration.** The host-tools.test.ts case `every combination and every installed host set: reachVia equals the oracle's carriers ...` takes **9979 ms** at TABLE_CARRIERS = 10 in the after4b full-suite run, against about 450 ms at 6 carriers before. That is within the 180 s testTimeout.
- **check-diff-disposition** (measured, not gated): base 52 findings; 58 after Task 3; **58 after Task 4** (`FAIL diff disposition — changed watched file(s): 58 finding(s) over 40 elements`). Task 4 added none.

## Checked and deliberately not edited

- **CLAUDE.md, the per-tool table.** It is GSD-generated from `.planning/research/STACK.md`, no row claims exclusivity, and "no command" is still literally true for Copilot.
- **agent-factory/README.md:58-60.** It names entry files with "(+ ...)".
- **agent-factory/packaging/slash-command.template.md:105.** It makes no "only" claim.
- **The plugin form** (`.claude-plugin/`). It already carried LICENSE and NOTICE (listing above).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A hand path fold in a new test.**
- **Found during:** Task 4, first full-suite run.
- **Issue:** The new `licenseLikeFiles` helper folded a path with `.split("\\").join("/")`, which `install/path-spelling-census.test.ts (t2)` refuses.
- **Fix:** It now uses the shared `pathText` helper (installer-paths.test-support.ts).
- **Files modified:** install/install.test.ts.
- **Commit:** 1e8b3c2c.

**2. [Rule 3 - Blocking] Hand-typed counts of recorded, written, read and installed files.**
- **Found during:** Task 4, first full-suite run.
- **Issue:** Five counts went red: WRITE_PATH_COUNT, READ_PATH_COUNT, INSTALLED_FILE_COUNT, REMOVABLE_COUNT and ledger-provenance CREATED. The never-installed `rec.files` pin went red in the targeted run.
- **Fix:** Each moved by one, with a dated reason, as the plan directs. No assertion was removed.
- **Commit:** 1e8b3c2c.

**3. [Instruction] CHANGELOG section.**
- **Issue:** The plan text puts Task 4's bullet under `### Added`. The orchestrator's brief says to use `### Fixed` when that section exists in `[Unreleased]`, and it does.
- **Fix:** The entry is the last bullet of `[Unreleased] ### Fixed`, which also matches the `fix(...)` commit type.
- **Wording:** The bullet states that the Claude Code plugin already carried both files. The plan's wording ("the kit, the plugin and the minimal copy carry") was kept true for the plugin rather than implying the plugin had lacked them.

**4. [Rule 2 - Hard constraint] HOME in the new install.test.ts cases.**
- **Issue:** The existing `runInstall`/`runUninstall` helpers in install.test.ts set GRUGOPS_HOME but not HOME.
- **Fix:** The three new tools/grugops/LICENSE cases spawn through a local helper that sets HOME as well as GRUGOPS_HOME to scratch directories, per the brief.

**5. [Finding, not fixed] Task 1's second mutation does not discriminate on its named row.**
- **Issue:** See the Task 1 transcripts. The tracer row stays green under T1-M2, and the property is held by the converse row and two registry cases.
- **Status:** No test was weakened or changed for this. It is reported for the verifier.

## Known Stubs

None. No stub, placeholder or unwired value was added. The live host runs (OpenCode TUI `--agent`, `agy --agent`, Copilot CLI, Pi) remain `UNKNOWN - verify` by design and are documented as such. They are not stubs.

## Open items

- **34.1 DI-01: admission of the generated host entries as a scanned banned-claims part.** It stays open. The exclusion is now derived from `renderedEntryRels()` (PD-2), with residue measured 0, but the entries are still excluded rather than admitted.
- **`scripts/board-watch-live.test.ts`.** It is still a timing flake (backlog 999.11 names it).

## Threat Flags

None beyond the plan's threat model. Task 4 adds one file write in the target (`tools/grugops/LICENSE`, T-hs8-08, mitigated by the existing RUNNABLES rule and the user-file case) and no new network, auth or schema surface.

## Self-Check: PASSED

- FOUND: agent-factory/LICENSE, agent-factory/NOTICE (`cmp` equal to the root files)
- FOUND: .agents/agents/grugops-orchestrator.md, .opencode/agents/grugops-orchestrator.md, .github/agents/grugops-orchestrator.agent.md, .pi/grugops-orchestrator.md
- FOUND commits in HEAD's history: 30992e0d, daf5d111, f48262c2, 1e8b3c2c
- `.temp/` is empty. No scratch output was written in the repository.

## Fix pass (D-06)

Executed 2026-10-18 on main, after review 261018-hs8-REVIEW.md. Decision D-06 (human, 2026-10-18) reverses planner decision PD-1: a launch file is not a route carrier for the reach and strand verdicts. The same pass fixes WR-01, WR-02 and WR-03. Commits `bbc8cc08` (D-06, CR-01, plus WR-03) and `8add25a0` (WR-01, WR-02). Plan head before the pass: `1e8b3c2c`.

### What changed

- **CR-01 / D-06.**
  - `install/host-tools.ts`: `routeCarriers` is again `entryFiles` plus the kind's `ROUTE_POINTERS`, which is what a default session reads.
  - New `launchCarriers(host)` (the row's `launchAgent`, or nothing).
  - New registry field `launchForm`, the one spelling of each launch form, and `launchInvoke(host)`. `invoke` now holds only the default-session text.
  - `install.ts` `kitRouteFindings` step (f) prints one line per launch file of an installed agent, worded "a session started with <launchForm>":
    - ok when the file carries the route;
    - FAIL for install's own stale copy (remedy: re-run install.js);
    - WARN when install will not write the route into it, or when the file could not be read;
    - an uncounted note when it is absent.
  - Reach, strandedBy and install's route note (`noteStrandingCarriers`) no longer see launch files. That follows from `routeCarriers` alone, so no consumer changed.
- **WR-03.** `launchClosingClause` adds `; or start the session as the Orchestrator with <launchForm>` only when install owns the launch file after the run. Ownership is checked with `owns` on the record after the run; under DRY_RUN, `PLANNED_BYTES` or the starting record counts. Otherwise the line says `no launch form is offered, because install neither wrote nor owns <rel> here`.
- **WR-01.** In `subagent.frontmatter.md`, the scope sentence and the Antigravity clause are reworded. `SCOPE_SENTENCE` and `UNKNOWN_CLAUSE` in `scripts/model-dial-consistency.test.ts` are re-pinned verbatim, with a dated note. The superseded wording is recorded here verbatim, as that test's header asks:
  - scope sentence, before: "The model and effort dials reach Claude Code only, and that is a fact about this kit rather than about the other host CLIs: grugops generates per-agent adapters at `.claude/agents/` alone, so although Codex CLI, OpenCode and GitHub Copilot CLI each accept a per-agent `model` field in their own agent-definition formats, this kit emits no agent definition for any of them, and neither dial has anywhere to write there."
  - Antigravity clause, before: "Whether Antigravity CLI accepts a per-agent `model` field is `UNKNOWN - verify`, and this kit emits no agent definition for it either."
- **WR-02.** A plain warning that `--append-system-prompt` reads the repository file into Pi's system prompt without Pi's project-trust check, so only use it in a repository you trust. It is in five places: the install/README.md Pi section (in bold) and its touch-list bullet, the README.md Pi row, adapters.md, and the CHANGELOG entry.
- **Docs.**
  - The install/README.md kit-route section lists only the default-session carriers. A new "The launch files" bullet replaces the PD-1 sentences.
  - The closing-notes paragraph states the WR-03 rule.
  - The CHANGELOG "counts each as one of its host's route carriers" sentence is corrected.
  - README.md and adapters.md made no launch-as-carrier claim.

### The new case, RED on 1e8b3c2c, then GREEN

The D-06 cases were added to install/kit-route.test.ts before the code changed and run on HEAD `1e8b3c2c`:
```
× Pi: the template absent, Pi's launch file present with the route, the user's own AGENTS.md without it: a counted WARN for the template naming Pi; Pi CANNOT reach; exit 0, and 1 with --strict
× GitHub Copilot CLI: the Copilot instructions without install's block, Copilot CLI's launch file present with the route, the user's own AGENTS.md without it: a counted WARN for the instructions naming Copilot CLI; Copilot CLI CANNOT reach; exit 0, and 1 with --strict
  note  kit route: .pi/prompts/grugops.md is not present; no host is left without a route by it: the hosts that would read it have the route another way (Pi through .pi/grugops-orchestrator.md). Re-run install.js, ...
  reach Pi: reaches the Orchestrator through .pi/grugops-orchestrator.md
  note  kit route: .github/copilot-instructions.md has no install block and no kit route; install appends its block, which carries the route; no host is left without a route by it: the hosts that read it here have the route another way (GitHub Copilot CLI through .github/agents/grugops-orchestrator.agent.md). ...
  reach GitHub Copilot CLI: reaches the Orchestrator through .github/agents/grugops-orchestrator.agent.md
Tests  2 failed | 173 skipped (175)
```
After the fix: `Tests 2 passed` for those two cases. The whole of kit-route.test.ts gives `Tests 162 passed (162)`. A scratch run of the Pi case (`--pi`, then the template deleted, then `--check --strict`) exits 1:
```
  WARN  kit route missing from AGENTS.md (it leaves Pi without a route to the Orchestrator): ...
  WARN  kit route: .pi/prompts/grugops.md (it leaves Pi without a route to the Orchestrator) is not present, so it gives those hosts no grugops pointer here. Re-run install.js, ...
  reach Pi: CANNOT reach the Orchestrator: AGENTS.md has no kit route, and install will not write the route into it; .pi/prompts/grugops.md is not present
  ok    launch file .pi/grugops-orchestrator.md carries the kit route: a session started with `pi --append-system-prompt .pi/grugops-orchestrator.md` from the repository root reads it (Pi). A default Pi session does not read it, so no reach line counts it
2 WARNING(S) (--strict: promoted to failure)
```

### Restored premises (compared against eba46ad5)

Each change below drops the launch-file step that Tasks 1 and 2 had added:
- kit-route.test.ts, cases:
  - the "variant: the same edit while the user's own AGENTS.md has no route" case (dropRouteFromLaunch dropped);
  - the "variant: install's own template and install's own AGENTS.md" FAIL case (the launch staging, and the launch path in the ok loop, dropped);
  - :316, "variant: an absent template while the user's own AGENTS.md has no route" (rmSync of the launch file dropped). Its title is consistent again.
- kit-route.test.ts, rows and helpers:
  - `carriersOf` (the oracle) no longer adds launchAgent;
  - NOTE_ROWS n4, n6 and n10 (titles and notes are the eba46ad5 text);
  - the agent-skill rows case, replaced with its eba46ad5 text (2 WARNs);
  - `stageAllEarlier`;
  - the Copilot link case and WR-13 (dropRouteFromLaunch dropped).
- kit-route.test.ts, WR-17 and IN-21:
  - WR-17 row A (rmSync of the launch file dropped, and the extra launch-file assertion dropped with it);
  - WR-17 refused row (blockLaunch dropped);
  - IN-21 "an installed Pi template deleted" (rmSync of the launch file dropped).
- message-references.test.ts: M3 (blocked launch directory dropped) and M4 (rmSync of the launch file dropped).
- host-tools.test.ts: `expectedCarriers` without the launch file, `TABLE_CARRIERS` 10 -> 6 (dated), the per-row routeCarriers titles, and the kit-route docs case.
- host-entries.test.ts: `readsOf` without the launch file. The launch tracer and per-launch rows now assert the separate launch line and that the reach line does not name the file.

Kept on purpose. These are ownership premises ("nothing of install's for Pi" or "Pi owns no holding entry"), not route premises: install writes and records the launch file, so the original premise is false without the extra step. Each one's title and comment now say so:
- agents-record R18 (retitled: "template and launch-file writes are refused") and R35 (retitled: "Pi's template and launch file deleted");
- kit-route IN-21 "refused" (the `.pi` blocker; retitled);
- IN-21 "the user's own Pi template and launch file" (retitled);
- WR-19 (comment only).

### Tests added

- D-06: the two RED-first cases above.
- Launch lines:
  - a fresh install gives one ok line per launch file, and no kit-route line or reach line names a launch file;
  - own-stale gives a FAIL, and the re-run makes it ok;
  - a user's edit gives a WARN (exit 1 under --strict);
  - the user's own file before install gives a WARN;
  - an absent file gives a note (--strict exit 0);
  - a blocked path gives a WARN with NO VERDICT.
- WR-03:
  - a fresh install offers the launch form for every launch row, under DRY_RUN too;
  - with the user's own file at every launch path, no row offers it (real run and DRY_RUN);
  - with Pi's launch write refused, Pi's row does not offer it.
- Registry:
  - routeCarriers holds no launch file;
  - launchCarriers is the launch file alone;
  - launchForm is non-null exactly when launchAgent is, is absent from invoke, and is what launchInvoke offers;
  - the kit-route docs section names each launch file, says "not a route carrier" and no longer carries the PD-1 sentence;
  - the usage-section docs test also checks the launchForm tokens.

### Moved pins (dated 2026-10-18 in the files)

- `TABLE_CARRIERS` 10 -> 6: launch files left the derived carrier set.
- Per-kind table census 3 -> 4: `host-tools.ts@routeCarriers` reads `ROUTE_POINTERS` by kind on purpose.
- MSG-1 census (message-references.test.ts):
  - install.ts fragments 40 -> 41;
  - "builder in the same expression" 13 -> 14 (COMMAND_TABLE) and 18 -> 19 (RERUN_TABLE);
  - install-side re-run fragments 64 -> 65.
  All of these come from one new fragment, the launch-file WARN's by-hand remedy. Its stale-copy FAIL reuses the carrier lines' remedy through one const, `ownStaleRemedy`, so it adds no fragment.

### Gates (after both commits, HEAD 8add25a0)

`npm run build` exit 0; `npm run check:build-parity` PASS 0 findings over 76/76; `npm run typecheck` exit 0; `npm run freshness` "All build outputs fresh: 76 committed .js file(s)"; `npm run freshness:host-entries` "7 entries compared, 0 byte difference(s), entry set equal"; check-banned-claims, check-claim-anchors (47/47 byte-identical), check-public-docs-vocabulary, check-kit-refs, check-nul-bytes (2954 files) and check-foundation-guards all ALL CHECKS PASSED. check-diff-disposition: `FAIL diff disposition — changed watched file(s): 59 finding(s) over 40 elements` (58 before; the one new clause is the README.md Pi row's trust warning, "flag reads file into system prompt without pi s project trust check so only use it in repository you trust"; measured, not gated, as before).

### Full suite (once, `npx vitest run --exclude '**/scripts/e2e/**'`)

- **Self-test of `failures.mjs`.** All four checks behaved as expected:
  - `keys base.json` equals BASE-FAILURES.txt without its `# base` header line;
  - `new B base.json` exits 0;
  - `new B after4b.json` exits 1 with the two known board-watch-live keys;
  - `keys empty.json` exits 2.
- **Result.** 8405 tests: 23 failed, 8380 passed, 2 skipped. There are 23 failure keys.
- **New keys against B.** Two, both in `scripts/board-watch-live.test.ts`: `a watch failure is a DIAGNOSABLE state ... DROPS it` and `the DEBOUNCE ... coalesces 5 atomic-rename writes`. These are the same two keys as after4b. No base key cleared.
- **board-watch-live rerun alone, 3 times.** Each run failed, with a different set: 3, 3 and 4 failures out of 6 (load average about 6). The file imports only node built-ins, `./board-dashboard.js` and `./board-model.js`, and no file this pass changed. So these failures are the known timing flake (backlog 999.11), not a regression.

### Deviations

1. **[Scope] Not every listed premise was restored.** R18, R35, IN-21 (refused, user's own) and WR-19 keep their launch-file step, because those premises are about ownership, not about the route (see "Kept on purpose"). Their titles and comments were changed to match.
2. **[Rule 3 - Blocking] Two fixes the census forced.**
   - The launch WARN first called `linkOwnership` a second time in `kitRouteFindings`, which broke the owner-call census. It now goes through the existing `userRemedy` closure, which gained an `otherwise` argument.
   - Its remedy fragment needed MSG-1 classification. One row was added to each of COMMAND_TABLE and RERUN_TABLE, and the counts moved with dated reasons.
3. **[Wording] One sentence was split.** A docs sentence that named both Codex CLI and `/grugops` tripped the Codex-invocation scan, so "Codex CLI has none" is now its own sentence.
4. **[Design] `invoke` and `launchForm`.** `invoke` lost its launch clause, and the clause moved to `launchForm` (WR-03). Copilot CLI's invoke text now opens "ask for the work you want done: ...". Its closing line no longer names `/agent`; install/README.md still does.
5. **[Wording] WR-02 does not say `--check` proves the file is unedited.** The review's suggested sentence said `--check` names the file `ok` only while it holds install's own unedited copy. That is not true: a user's own file that carries the route is also `ok`. The docs instead say to read the file first in a repository someone else can change.

