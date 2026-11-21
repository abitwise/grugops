---
phase: quick-261018-hs8
reviewed: 2026-10-18T20:20:00Z
depth: deep
diff_range: eba46ad5..1e8b3c2c
files_reviewed: 33
files_reviewed_list:
  - install/host-tools.ts
  - install/install-marker.ts
  - install/install.ts
  - install/uninstall.ts
  - scripts/generate-host-entries.ts
  - scripts/host-entries-freshness.ts
  - scripts/check-banned-claims.ts
  - .agents/agents/grugops-orchestrator.md
  - .github/agents/grugops-orchestrator.agent.md
  - .opencode/agents/grugops-orchestrator.md
  - .pi/grugops-orchestrator.md
  - agent-factory/LICENSE
  - agent-factory/NOTICE
  - agent-factory/packaging/adapters.md
  - agent-factory/packaging/subagent.frontmatter.md
  - examples/01-greenfield-bootstrap.md
  - README.md
  - install/README.md
  - CHANGELOG.md
  - package.json
  - install/host-tools.test.ts
  - install/host-entries.test.ts
  - install/host-entry-docs.test.ts
  - install/uninstall-removal.test.ts
  - install/install.test.ts
  - install/kit-route.test.ts
  - install/installer-dry-run.test.ts
  - install/installer-cross-version.test.ts
  - install/installer-kit-home.test.ts
  - install/agents-record.test.ts
  - install/message-references.test.ts
  - scripts/generate-host-entries.test.ts
  - scripts/host-entries-freshness.test.ts
findings:
  critical: 1
  warning: 4
  info: 11
  total: 16
status: issues_found
---

# Quick Task 261018-hs8: Code Review Report

**Reviewed:** 2026-10-18T20:20:00Z
**Depth:** deep (cross-file, plus scratch install runs)
**Files Reviewed:** 33 (the product `.ts`, the four launch files, the license copies, the docs, and the tests changed in the diff; the committed `.js` builds are treated as the `.ts` they compile from)
**Status:** issues_found

## Summary

Scope: `git diff eba46ad5..1e8b3c2c` (commits 30992e0d, daf5d111, f48262c2, 1e8b3c2c). The review read the CONTEXT, RESEARCH, SUMMARY and CLAUDE.md, the full product diff, and every changed test. It also ran scratch installs (GRUGOPS_HOME and HOME both under `$TMPDIR`, removed afterwards) and two targeted test files (`scripts/generate-host-entries.test.ts`, `scripts/model-dial-consistency.test.ts`: 97 passed).

**Focus 1, the installer contract (user data): holds.** Scratch run with a user file already at all five new paths (`.agents/agents/grugops-orchestrator.md`, `.opencode/agents/grugops-orchestrator.md`, `.github/agents/grugops-orchestrator.agent.md`, `.pi/grugops-orchestrator.md`, `tools/grugops/LICENSE`), then an install for all six agents and a flag-less uninstall. Every user file came back byte-identical (shasum diff clean), and none was recorded in the ledger. Codex and Antigravity sharing `.agents/` holds in both directions:
- `uninstall --antigravity` while Codex stays removed only the launch file. It kept the shared skill.
- It also kept `.agents/agents/` because a user file (`mine.md`) was in it.
- A later `uninstall --codex` left `mine.md` in place.
Ownership is per agent (`hostFootprint`), and directories are removed only when they are empty (`rmdirIfEmpty`). No partial or full run removed anything that install did not record.

**Focus 4, Pi: confirmed for the current registry.** Nothing in install can write `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md`. `PI_LAUNCH_REL` is a constant, and install writes under `.pi/` only through `wholeFileEntryRels`/`hostPointers`. A scratch install for all agents left exactly `.pi/grugops-orchestrator.md` and `.pi/prompts/grugops.md`. The guard is spelled case-sensitively, though (IN-01).

**The main defect is CR-01.** Planner decision PD-1 makes each launch file a route carrier for `--check` and for install's route notes. A launch file is read only by a session the user starts with it. So `--check --strict` now reports `Pi: reaches the Orchestrator` (exit 0) when a default Pi session cannot reach it, and install no longer notes a user's `/grugops` entry that lacks the kit route. About 15 test premises were rewritten to delete or neutralise the launch file too, which hid this regression rather than testing for it (focus 5).

**Focus 2, sets: the code derives correctly.** Every pinned count was re-derived and matches (ENTRY_COUNT 7, TABLE_CARRIERS 10, banned-claims exact 15, RECORDED_FILE_COUNT 39, WRITE_PATH_COUNT 102, READ_PATH_COUNT 68, INSTALLED_FILE_COUNT 66, REMOVABLE_COUNT 41, CREATED 15, REMOVED_DIRS 22). Two hand-typed lists remain unbound: the docs carrier list in `--check`'s section of install/README.md, and the README Start a session table (WR-04).

**Focus 3, docs against code.** One shipped sentence is now false, and a test pins it (WR-01). The Pi launch form skips Pi's project-trust gate, and the docs do not warn about that (WR-02).

## Critical Issues

### CR-01: A launch file counts as a route carrier, so `--check` says a host reaches the Orchestrator when its default session cannot, and install stops noting a broken `/grugops` entry

**File:** `install/host-tools.ts:644-645` (`routeCarriers` now spreads `hostPointers(host)`, launch agent included), consumed by `install/install.ts:1466-1468` (`hostReadsCarrier`), `install/install.ts:1915-2020` (`kitRouteFindings` reach/strandedBy) and the install route-note pass (`noteStrandingCarriers`, `install/install.ts:3665-3730`)

**Issue:** `hostReadsCarrier` treats every route carrier as a file the host reads. A launch file is read only by a session the user starts with it. install/README.md:663-664 says so ("is read only by a session started with it"), and its Pi section (install/README.md:889-904) says Pi "never loads `.pi/grugops-orchestrator.md` on its own". The doctor and install still count it as an ordinary carrier. A default session (plain `pi`, plain `copilot`, a session that types `/grugops`) can lose its route while the launch file still holds one. Then `strandedBy` returns no host, the counted WARN becomes an uncounted `note`, and the reach line names the launch file. Reproduced in scratch:

1. Target with the user's own `AGENTS.md` (no route). `install.js --yes --pi`, then `rm .pi/prompts/grugops.md`. `install.js --check --strict` exits **0** and prints:
   - `note  kit route: .pi/prompts/grugops.md is not present; no host is left without a route by it: ... (Pi through .pi/grugops-orchestrator.md)`
   - `reach  Pi: reaches the Orchestrator through .pi/grugops-orchestrator.md`
2. Target with the user's own `AGENTS.md` and the user's own `.pi/prompts/grugops.md`, neither carrying the route. `install.js --yes --pi` prints **no** route note. Before this change, kit-route.test.ts row n4 required notes for `AGENTS.md` and the Pi template. The closing line still says to type `/grugops <request>`, which runs the user's unrelated template. `--check --strict` exits 0 with `Pi: reaches the Orchestrator`.

The same holds for Copilot CLI. If `.github/copilot-instructions.md` loses its block, a default Copilot session has no route, but `--check` says Copilot reaches through `.github/agents/grugops-orchestrator.agent.md`. It also holds for the Antigravity skill and the OpenCode command.

So `--check` (the INSTALL-05 verifier) reports a pass that is not real, which conflicts with the CLAUDE.md "never fake a passing gate" constraint. The tests did not catch it because their premises were changed. Each of these now also deletes, blocks or strips the launch file, so the old "this entry strands the host" scenario still goes red: kit-route.test.ts:316 (the title still says "an absent template ... WARNs that Pi has no /grugops template", but the case needs the launch file deleted too), n4, n6, n10, stageAllEarlier (:1151), the Copilot link case, WR-13, WR-17, the IN-21 cases, agents-record R18/R35, and message-references M3/M4. No test asserts the property that was lost: a missing or route-less default entry is still reported when a launch file holds the route.

**Fix:** keep launch files out of the reach and stranding facts, and report them on their own. For example, split the carrier sets:
```ts
// host-tools.ts: what a default session of `host` reads (no launch file)
export function routeCarriers(host: HostTool): readonly string[] {
  return [...new Set([...host.entryFiles, ...ROUTE_POINTERS[host.adapter]])];
}
// what a session started with the launch agent reads
export function launchCarriers(host: HostTool): readonly string[] {
  return host.launchAgent === null ? [] : [...new Set([...host.entryFiles, ...ROUTE_POINTERS[host.adapter], host.launchAgent])];
}
```
Have `--check` print one finding per launch file (ok / own-stale FAIL / user WARN / absent note), worded "a session started with `<launch form>`". Keep the reach and strand verdicts on `routeCarriers`. PD-1 was a recorded planner decision, so record the reversal as a decision too. Then restore the original premises in the rewritten tests, and add a case: template absent, launch file present, user AGENTS.md has no route; expect a counted WARN and exit 1 under `--strict`.

## Warnings

### WR-01: A shipped sentence now says the kit emits no agent definition for OpenCode, Copilot CLI or Antigravity CLI, and a test pins it

**File:** `agent-factory/packaging/subagent.frontmatter.md:268`; pinned verbatim by `scripts/model-dial-consistency.test.ts:296-300` (`SCOPE_SENTENCE`)
**Issue:** The sentence says "this kit emits no agent definition for any of them" (Codex CLI, OpenCode, GitHub Copilot CLI) and, of Antigravity CLI, "this kit emits no agent definition for it either". The task now writes `.opencode/agents/grugops-orchestrator.md`, `.github/agents/grugops-orchestrator.agent.md` and `.agents/agents/grugops-orchestrator.md`. These are agent definitions, in the very directories the cited references name. The same file, at lines 255-258, was edited in this task to describe those launch agents, so the document now contradicts itself. The test's own header calls this case a known gap ("a SECOND sentence contradicting this one ... leaves every case here green"). The SUMMARY's sibling search ("Checked and deliberately not edited") missed it. The conclusion (the model and effort dials reach Claude Code only) still holds, because the launch files carry no `model` field. The stated reason is false.
**Fix:** Reword to a reason that is still true, for example: "grugops generates per-role adapters at `.claude/agents/` alone; the one launch agent it writes for OpenCode, GitHub Copilot CLI and Antigravity CLI carries no `model` or effort field, so neither dial has anywhere to write there." Update `SCOPE_SENTENCE` in the same commit, and add the dated superseded-wording annotation the test header asks for.

### WR-02: The Pi launch form reads a repository file into the system prompt without Pi's project-trust gate, and the docs do not warn about it

**File:** `install/README.md:889-904` (the Pi section, "Fourth, the flag's file is read whether or not you granted project trust"); `README.md:66` (Pi row); `install/host-tools.ts` Pi `invoke` (printed by install)
**Issue:** Pi gates `.pi/` discovery on project trust because repository files can carry instructions. `pi --append-system-prompt .pi/grugops-orchestrator.md` skips that gate: Pi appends the file's contents to the **system prompt** whatever the trust state. grugops now prints and documents this command for every Pi repository. In a cloned repository whose `.pi/grugops-orchestrator.md` someone else wrote or changed, the documented command puts that text into the system prompt with no trust prompt. The docs state the fact neutrally as one of "four facts", but never say what follows from it or what to do. CLAUDE.md requires clear voice on security topics.
**Fix:** Add a clear-voice sentence to the Pi section, and a short note in the README row. For example: "Because the flag skips Pi's project-trust check, run it only in a repository you trust. `install.js --check` names `.pi/grugops-orchestrator.md` `ok` only while it holds install's own unedited copy; read the file first if it may have been changed."

### WR-03: The closing line advertises a launch command for a launch file install did not write

**File:** `install/install.ts:7626` (`out.push(\`${at}${h.name}: ${what} — ${h.invoke}\`)`), where `invoke` is fixed text at `install/host-tools.ts` (opencode, copilot and pi rows)
**Issue:** The invoke text now names a launch command built from `LAUNCH_AGENT_NAME`/`PI_LAUNCH_REL`. It is printed whatever happened at the launch path. In the scratch run with a user file at each launch path, install printed `Pi: .pi/prompts/grugops.md — ... or start it as the Orchestrator with \`pi --append-system-prompt .pi/grugops-orchestrator.md\``. Its own file list shows it did not write that file, so the command would append the user's unrelated file. When the write is refused (a directory or a link there), Pi appends the literal path text silently (install/README.md:897-899). OpenCode (`opencode --agent grugops-orchestrator` starts the user's own agent) and Copilot do the same. The `/grugops` part of the line had this weakness before, but the new launch command adds a second "start as the Orchestrator" claim that nothing checks. This is the MSG-1 class: a printed reference to something the run did not produce.
**Fix:** Build the launch clause from the outcome. Print the launch command only when this run created, refreshed or kept install's own copy of `h.launchAgent` (ledger `owns`). Otherwise print, for example: "`.pi/grugops-orchestrator.md` is not install's (see the line above), so the launch form is not offered". Keep `invoke` for the kind entry and move the launch command into a separate field (for example `launchInvoke`), so `agentClosingLines` can decide.

### WR-04: Two hand-typed copies of the launch-path and invocation sets are bound to no test

**File:** `install/README.md:656-664` (the `--check` "files each host reads here" list of all ten route carriers), `README.md:59-66` (the Start a session table)
**Issue:** The kit-route section (`ROUTE_SECTION`) has a two-sided test against `routeCarriers`, and each "Using grugops on" section is checked against `hostPointers` and the `invoke` tokens. The `--check` paragraph at install/README.md:656-664, though, types all ten carriers by hand and no test reads it (grep for its sentence finds no test). The README Start a session table is a third hand-kept copy of every host's start form, and no test binds it to `invoke` either. Both are correct today. The memory notes record this "set-literal drift" class, rotting while the suite stays green, as a repeat cause of defects, and the task's CONTEXT says "derive the set, assert the count".
**Fix:** Add a host-entry-docs case that extracts the backticked paths from the `--check` paragraph and asserts the set equals `HOST_TOOLS.flatMap(routeCarriers)` (and the launch paths, if CR-01 splits them). Add a README case that, for each `HOST_TOOLS` row, finds its table row by `name` and asserts every backticked token of the row's launch form (`LAUNCH_AGENT_NAME`, `PI_LAUNCH_REL`) appears in it.

## Info

### IN-01: The D-02 guard compares exact spellings, but the hazard does not depend on case

**File:** `install/host-tools.test.ts:1250` (`const refused = [".pi/SYSTEM.md", ".pi/APPEND_SYSTEM.md", ".pi/settings.json"]`, `refused.includes(rel)`); `scripts/generate-host-entries.ts:255` (`pathProblem`)
**Issue:** On macOS (APFS default) and Windows, a future `PI_LAUNCH_REL` such as `.pi/system.md` is the same file as `.pi/SYSTEM.md`, which Pi auto-loads. Both the guard and `pathProblem` would accept it. The current value (`.pi/grugops-orchestrator.md`) is safe, so this is robustness only.
**Fix:** Compare `rel.toLowerCase()` against lower-cased refused names, in the test and in `pathProblem` (or in a launch-path check in `renderAll`).

### IN-02: `RECORDED_FILE_COUNT_WHY` says "the 6 files install created" but lists 9

**File:** `install/installer-cross-version.test.ts:48-49`
**Issue:** 17 + 7 + 1 + 4 + 1 + 9 = 39, the pinned count. The text says 6, but lists 2 pointer files, 3 entries and 4 launch agents. The text appears only in a failure message, but it is the stated derivation of a pin.
**Fix:** "the 9 files install created".

### IN-03: The shared-footprint lists in the uninstall docs omit `tools/grugops/LICENSE`

**File:** `install/README.md:973`, `install/README.md:1015`
**Issue:** Both say "the runnables under `tools/grugops/`". The license is not a runnable, so a reader cannot tell it goes only with a flag-less or last-agent uninstall. The touch list (:408-410) does name it.
**Fix:** "the runnables under `tools/grugops/` and `tools/grugops/LICENSE`".

### IN-04: The README Start a session table dropped the repository-root condition for `/grugops` on Pi and OpenCode

**File:** `README.md:64` (OpenCode), `README.md:66` (Pi)
**Issue:** The Pi cell ties "from the repository root" to the flag only. Pi also loads `.pi/prompts/` from the directory it starts in (install/README.md Pi section). The OpenCode cell says "In any session: `/grugops <request>`". Before this change both rows said to start at the repository root.
**Fix:** "From the repository root: `pi --append-system-prompt ...`, or type `/grugops <request>`." Treat the OpenCode cell the same way.

### IN-05: Install labels Pi's file a "launch agent", while the docs call it a "launch file"

**File:** `install/install.ts` `entryLabel` (`${names} launch agent`); compare `agent-factory/packaging/adapters.md:40` ("**Launch file.**") and `install/README.md:537` ("Pi's launch file")
**Issue:** Install prints `created .pi/grugops-orchestrator.md (Pi launch agent)`, but Pi has no agents. The wording is inconsistent, not wrong behavior.
**Fix:** Word the label from the row, for example a `launchNoun` registry field ("launch agent" or "launch file").

### IN-06: Report wording for a user's own file at a new path suggests it came from grugops

**File:** `install/install.ts:5508` ("target has a different copy — left untouched"); uninstall `reportUnrecordedFile` line seen in scratch: "left .pi/grugops-orchestrator.md (it differs from this kit version's file (it may be from an earlier grugops version, or edited) ..."
**Issue:** No earlier grugops version wrote a launch file or `tools/grugops/LICENSE`, so "earlier grugops version" and "a different copy" are wrong for these five paths. This is pre-existing wording, newly reached.
**Fix:** "a file is already there that is not install's — left untouched".

### IN-07: The per-kind table census counts only `X[...]` element accesses

**File:** `install/host-tools.test.ts:1323-1355`
**Issue:** `Object.values(ROUTE_POINTERS)`, `const { [k]: v } = ADAPTER_FOOTPRINT`, or an alias (`const t = ROUTE_POINTERS; t[h.adapter]`) all escape the census. Some forms are already used legitimately in tests (kit-route `expectNamedPathsExist`). This is a residual of the guard and should be stated.
**Fix:** State the residual in the census comment, or also count identifier references to the two tables outside `host-tools.ts`.

### IN-08: Test-coverage notes on the ownership mutation proofs

**File:** `install/uninstall-removal.test.ts:708-742` (tracer), `:806-812` (per-launch loop), `install/kit-route.test.ts:1151` (`stageAllEarlier`)
**Issue:**
- The tracer row cannot tell T1-M2 apart from correct code (SUMMARY Deviation 5). Ownership is still mutation-proven by the converse row and the two host-tools registry cases, which is adequate.
- The per-launch loop's "every removed path is this row's" check uses `entryOwners`, the code under test, as its own oracle, so that check cannot catch a cross-host ownership leak. The registry case `entryOwners({path: h.launchAgent}) == [h.id]` is what catches it.
- `stageAllEarlier` hand-picks `[piHost(), copilotHost()]` instead of deriving from `launchAgent`, yet its doc comment says "every route carrier".
**Fix:** Write the per-launch loop's expected owners from the registry data (`h.launchAgent`, `dirname`), not from `entryOwners`. Derive `stageAllEarlier`'s rows, or reword its comment.

### IN-09: The CLAUDE.md per-tool table no longer lists everything the installer lays down

**File:** `CLAUDE.md` (Technology Stack, §6 table, "Adapter the installer lays down" column)
**Issue:** The column omits the four launch files for Antigravity CLI, OpenCode, Copilot CLI and Pi. The SUMMARY skipped it because the table is generated from `.planning/research/STACK.md`. Agents read CLAUDE.md as project instructions, so the gap matters.
**Fix:** Add the launch file to each of the four rows in `.planning/research/STACK.md`, and regenerate.

### IN-10: Two sentences claim live-host behaviour without `UNKNOWN - verify`

**File:** `install/README.md:1885-1887` (§6 "Degraded": the launch agents "make the Orchestrator pointer the session's main agent when you start the session with one"); `agent-factory/packaging/subagent.frontmatter.md:256-257`
**Issue:** No live run was made on any of the four hosts. The usage sections say so, but these two sentences state the effect as fact.
**Fix:** Write "are documented to make" and add `UNKNOWN - verify`, or point to the usage sections.

### IN-11: `frontmatterProblem` covers only part of what makes a YAML plain scalar unsafe

**File:** `scripts/generate-host-entries.ts:196-206`
**Issue:** The check refuses a colon followed by a space, a space followed by `#`, line breaks, and the OpenCode sequences. It accepts a value that starts with a YAML indicator (`-`, `[`, `{`, `*`, `&`, `!`, `|`, `>`, `'`, `"`, `%`, `` ` ``) or ends with a colon. Every current value is a fixed literal and safe, so this is defense-in-depth.
**Fix:** Also refuse a leading indicator character and a trailing `:`, or quote every value at render time.

---

_Reviewed: 2026-10-18T20:20:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
