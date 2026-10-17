---
phase: 34-model-effort-dial-pi-support
reviewed: 2026-10-10T12:01:12Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - AGENTS.md
  - CHANGELOG.md
  - README.md
  - agent-factory/README.md
  - agent-factory/packaging/adapters.md
  - agent-factory/packaging/slash-command.template.md
  - docs/audit/28-claim-registry.md
  - docs/audit/29-style-dispositions/34-27.md
  - docs/audit/29-style-dispositions/34-30.md
  - docs/design/shared-install.md
  - install/README.md
  - install/closing-claims.test.ts
  - install/host-tools.js
  - install/host-tools.test.ts
  - install/host-tools.ts
  - install/install-marker.js
  - install/install-marker.ts
  - install/install.js
  - install/install.ts
  - install/installer-fs-census.test.ts
  - install/kit-route.test.ts
  - install/mode-census.test.ts
  - install/path-spelling-census.test.ts
  - install/uninstall.js
  - install/uninstall.ts
findings:
  critical: 1
  warning: 5
  info: 6
  total: 12
status: issues_found
---

# Phase 34: Code Review Report (gap round 3)

**Reviewed:** 2026-10-10T12:01:12Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Scope: the round-3 diff `ed08edd3..HEAD` (plans 34-25..34-31: WR-12 and its siblings under D-25; the D-26 marker route, carrier refresh, missing-route notes and `--check` reach lines). install.ts was reviewed through its diff plus the helpers that the new code calls (`owns`, `readUserFile`, `readForWrite`, `writeTargetFile`, `nextLedgerEntries`, `writeAskRules`).

Verification done:
- `npm run -s freshness`: all 73 committed `.js` files match a rebuild.
- `npx vitest run --exclude '**/scripts/e2e/**' install/kit-route.test.ts install/closing-claims.test.ts install/host-tools.test.ts`: 123/123 pass.
- Scratch reproductions, each with its own `GRUGOPS_HOME`: a round-2 install (worktree at `ed08edd3`) followed by a HEAD install and then uninstall; a fresh HEAD install; a `--symlink` install; Gemini settings variants; an edited block; deleted optional pointers. The scratch worktree was removed afterwards.

What holds (probe a): the refresh never wrote a user byte in any reproduction. A round-2 install upgraded by HEAD refreshed all four carriers. `# My notes / keep me` in a user's `CLAUDE.md` survived both the refresh and the uninstall. Uninstall then removed exactly the refreshed block and the files install had created. An edited block was left alone and a note was printed. `DRY_RUN` printed `would-refresh` and wrote nothing. The ask-rules closing notes (WR-12) and the `--update` and `--migrate` closings are built from what the run did.

What does not hold:
- **Probe (d), blocker.** `--check` prints `Gemini CLI: reaches the Orchestrator through AGENTS.md` and `ALL CHECKS PASSED` while Gemini's own settings never load `AGENTS.md`.
- **Probe (c).** The doctor's "install's own, stale" verdict is a second copy of the refresh rule, and the two disagree on links. Install notes and the doctor's WARN also say a host gets no route when the same output's `reach` line says it does.
- **Strict mode.** `--check --strict` now fails a target whose user deleted the optional Copilot pointer or Pi template.

None of these repeats a round-2 finding (34-REVIEW-ROUND2.md WR-11, WR-12, IN-09..IN-13). WR-12's class is closed for the ask-rules notes. CR-01 and WR-02 are the same "a closing or verdict sentence the run did not earn" class (27-13), moved to the new `reach` and `note` surfaces.

## Critical Issues

### CR-01: `--check` says Gemini CLI reaches the Orchestrator through AGENTS.md without checking whether Gemini reads AGENTS.md at all

**File:** `install/install.ts:1276-1290` (kitRouteFindings host loop); `install/host-tools.ts:120-127` (Gemini row, `entryFiles: ["AGENTS.md"]`), `install/host-tools.ts:170` (`"gemini-settings": []`)

**Issue:** Gemini CLI reads `GEMINI.md` by default. It reads `AGENTS.md` only when `.gemini/settings.json` lists it in `context.fileName`, which is exactly what the `gemini-settings` adapter (mergeGemini) exists to add. kitRouteFindings treats `host.entryFiles` as fact. For Gemini it counts `AGENTS.md` as a route carrier without asking whether the settings list it. The doctor never reads `.gemini/settings.json`; a grep of the doctor body (lines 1293-1760) finds no `gemini` or `fileName` check. The counted findings are all about AGENTS.md, which is fine, so nothing counted backs a stranded Gemini. This breaks D-26 point 4 ("reports, per registry host, whether that host reaches the Orchestrator") and the kitRouteFindings header's own invariant.

Reproduced twice, each with a scratch `GRUGOPS_HOME`:
1. The target's `.gemini/settings.json` has two `"context"` keys. Install correctly refuses the merge with a `verify` and exit 3, and leaves the file untouched. Then `--check` prints `reach  Gemini CLI: reaches the Orchestrator through AGENTS.md` and `ALL CHECKS PASSED`.
2. After a clean install, the user sets `context.fileName` to `["GEMINI.md"]`. `--check` again prints `Gemini CLI: reaches the Orchestrator through AGENTS.md`. The only two warnings were for unrelated files, and the exit code is 0.

`install/README.md:359`, `docs/design/shared-install.md:46`, `agent-factory/packaging/adapters.md:55-60` and the CHANGELOG all promise a `reach` line that says whether each host reaches the Orchestrator. For Gemini that line is not earned.

**Fix:** Make "this host actually reads entry file X" part of the derivation, owned in one place. For example, give `HostTool` an optional entry gate. For `gemini-settings`, `AGENTS.md` counts as a carrier only when `.gemini/settings.json` parses through the same reader mergeGemini uses and the `context.fileName` that Gemini will read contains `AGENTS.md`. When it does not, emit a counted finding and drop `AGENTS.md` from Gemini's carriers before computing `via`:
```ts
// in kitRouteFindings, before the host loop
const geminiReadsAgents = geminiListsAgentsMd(); // same parser as mergeGemini; null when unreadable
if (geminiReadsAgents !== true) {
  docWarn(`kit route: .gemini/settings.json ${geminiReadsAgents === null ? "could not be read" : "does not list AGENTS.md in context.fileName"}, so Gemini CLI does not read AGENTS.md here. Re-run install.js, or add "AGENTS.md" to context.fileName`);
}
// ...
const carriers = routeCarriers(host).filter((rel) => !(host.adapter === "gemini-settings" && rel === "AGENTS.md" && geminiReadsAgents !== true));
```
Add a kit-route.test.ts row for each case: a duplicate `context` key, and `fileName` without `AGENTS.md`. Each must produce `CANNOT reach` for Gemini and a counted WARN or FAIL.

## Warnings

### WR-01: The doctor's "install's own, stale" verdict is a second copy of the refresh rule, and it disagrees with install on links (its remedy is false and the FAIL never clears)

**File:** `install/install.ts:1191-1212` (carrierFinding own-stale decision) vs `install/install.ts:2705-2711` (refreshOwnFile gates), `install/install.ts:5696-5704` (AGENTS.md step) and `install/install.ts:2570-2584` (ensureBlock)

**Issue:** For a whole file, carrierFinding calls a carrier `own-stale` (a FAIL telling the user to "Re-run install.js: it replaces install's own unedited copy") on `owns(ledger, TARGET, rel, "file").owned` alone. refreshOwnFile writes only when four things hold: `owns` answers owned, the record is a `sha256:` file record and not a `link:` record, `readForWrite` answers `ok` (a regular file, not a link), and the kit source can be read. The AGENTS.md step skips refreshOwnFile entirely for a link that is not `isOwnLink` against the current source. For blocks, the doctor reads through `readUserFile` (it follows links), while ensureBlock goes through `readForWrite` (it refuses them). The comment at 2702 says refreshOwnFile is a function declaration "so the doctor can share it", but the doctor does not call it.

Reproduced: a `--symlink` install from the round-2 checkout, then `--check` with HEAD. The result was `FAIL kit route missing from AGENTS.md ... Re-run install.js: it replaces install's own unedited copy`. Re-running install as told printed `verify AGENTS.md: ... is a symbolic link, and the installer never writes through a link it did not create`. That line also contradicts the ledger, which records that install did create the link. `--check` still FAILs on the same line, so following the remedy can never clear it. The same split applies to a `CLAUDE.md` that the user replaced with a link to a file that still holds install's recorded block.

**Fix:** Have one predicate, for example `refreshable(ledger, rel): { ok: true } | { ok: false; why: string }`, own the refresh conditions. Use it in refreshOwnFile, in ensureBlock's refresh arm and in carrierFinding. The doctor should FAIL with "re-run install.js" only when `refreshable` is ok. Otherwise it should WARN with the manual remedy (the KIT_ROUTE sentence, or replace the link).

### WR-02: Install's `note` and the doctor's WARN say a host "gets no route to the kit" while the same run's `reach` line says that host reaches it

**File:** `install/install.ts:2738-2753` (noteMissingRoute), `install/install.ts:1213-1218` (carrierFinding `user` WARN)

**Issue:** noteMissingRoute narrows the hosts it names only for `AGENTS.md` (to hosts whose only carrier is AGENTS.md). For any other file it names every host in `hostsReading(rel)`. It ignores the host's other carriers and, for Claude Code, its adapters. Reproduced after a user edit inside the `CLAUDE.md` block. Install printed `note CLAUDE.md (left as it is, with no kit route in it: Claude Code get no route to the kit after a scripted install; ...)`. `--check` printed `WARN ... A host reading it gets no route to the kit after a scripted install`, and on the next line `reach Claude Code: reaches the Orchestrator through AGENTS.md, its adapters' KIT= line`. Under D-26 point 5, Claude Code resolves the kit through its adapter. The same false claim is made about Copilot when the user's own `.github/copilot-instructions.md` lacks the route but `AGENTS.md` carries it (Copilot combines both files). Because the doctor's line is a counted WARN, `--check --strict` exits 1 for a host that reaches. Also "Claude Code get" is ungrammatical for a single host. One rule ("which hosts does this file leave without a route") now has two derivations (the `AGENTS.md` special case and everything else), and both disagree with the `reach` computation.

**Fix:** Derive the stranded hosts once, from the same inputs as the `reach` loop: the hosts in `hostsReading(rel)` for which no other carrier is `route` and that have no adapter route. Use that list in both noteMissingRoute and carrierFinding. When the list is empty, report the carrier as uncounted (or `ok` with "other carriers give the route"), not as a WARN.

### WR-03: `--check --strict` now fails a target whose user deleted the optional Copilot pointer or Pi template, even though every host reaches the Orchestrator

**File:** `install/install.ts:1172-1179` (carrierFinding `absent` arm)

**Issue:** Install always writes `.github/copilot-instructions.md`, which install/README.md calls "an optional ... pointer", and `.pi/prompts/grugops.md` ("written in every install whether or not you use Pi"). A user who does not use Copilot or Pi and deletes them now gets two counted WARNs. Reproduced: `--check --strict` exited 0 before the deletion and printed `2 WARNING(S) (--strict: promoted to failure)` with exit 1 after it. In that same run, every `reach` line said the host reaches, because AGENTS.md carries the route. Before round 3, `--check` did not look at these files, so this is a new strict-mode failure in CI pipelines that run `--check --strict`.

**Fix:** Count an absent carrier only when some host is left without a route because of it, using the same derivation proposed in WR-02. Otherwise print it as an uncounted informational line, as the `reach` lines are.

### WR-04: Block-carrier facts are hand-typed in several places with no test binding them (ROUTE_BLOCKS vs BLOCK_RELS, the Copilot path, the sentinels)

**File:** `install/install.ts:1114-1117` (ROUTE_BLOCKS), `install/install-marker.ts:589` (BLOCK_RELS), `install/host-tools.ts:167-173` (ROUTE_POINTERS), `install/install.ts:1072-1090` and `install/uninstall.ts:218-225` (sentinels)

**Issue:** Probe (c), one owner per rule. ROUTE_BLOCKS is a hand-written map whose keys must equal BLOCK_RELS. No test asserts that: grep finds no reference to `ROUTE_BLOCKS` or `BLOCK_RELS` in any test. The Copilot path is spelled as a literal in four modules (`COPILOT_REL`, `BLOCK_RELS`, `ROUTE_POINTERS["copilot-pointer"]`, the Copilot `entryFiles`). The open and close sentinels are spelled twice, in install.ts and uninstall.ts, with a comment saying "must match". If a block path is added to BLOCK_RELS but not to ROUTE_BLOCKS, carrierFinding sends that file to the whole-file arm. `owns(..., "file")` then answers not-owned, so install's own stale block becomes a user WARN instead of a FAIL, while ensureBlock would refresh it: install and doctor disagree. If ROUTE_POINTERS drifts from `COPILOT_REL`, the doctor asks about a file install never writes.

**Fix:** Move `{rel, open, close}` for both blocks into install-marker.ts as one exported table. Derive BLOCK_RELS, ROUTE_BLOCKS and uninstall's sentinels from it. Make ROUTE_POINTERS import the Copilot path, or add a test asserting `ROUTE_BLOCKS` keys equal `BLOCK_RELS` and that every `ROUTE_POINTERS` path is one install writes.

### WR-05: refreshOwnFile decides ownership from one read and overwrites using a second read it never re-checks

**File:** `install/install.ts:2705-2722`

**Issue:** Probe (a). `owns(ledger, TARGET, rel, "file")` reads the file (checkRecord) and answers owned. refreshOwnFile then reads it again through `readForWrite` and writes `wantBytes` with flag `"w"`. It compares `cur.bytes` with `want` but never with the record. A user edit (an editor save, a `git checkout`) between the two reads is overwritten without a trace. ensureBlock does not have this gap: it takes its spans and their record match from the same `cur.bytes` it splices. The `writeTargetFile` header documents a residual between gate and write. This is a second, avoidable window that sits in front of it.

**Fix:** Compare the bytes and mode you are about to replace with the record, from the same read:
```ts
const cur = readForWrite(TARGET, file);
if (cur.state !== "ok") return "left";
if (!recordMatches(own.entry.content, cur.bytes, cur.mode).holds) return "left"; // the bytes this write replaces are install's
```

## Info

### IN-01: The kitRouteFindings header says readUserFile never opens a link; readUserFile follows links

**File:** `install/install.ts:1227-1228`; see `install/user-file.ts:124-130`
**Issue:** The header says the route is "read through readUserFile (DC-3: a FIFO, a device or a link there is never opened)". `readUserFile` calls `statSync`, which follows a link, and it then opens the target. Following the link is arguably right here, since a host follows it too, but the comment states the opposite of what the code does. That matters in a codebase whose DC-3 rules are about links.
**Fix:** Change the comment to "a link is followed, as a host would; a FIFO, a device or an oversized file is never read".

### IN-02: The marker route depends on a per-machine absolute path, and nothing says whether `.grugops/install.json` is committed

**File:** `install/host-tools.ts:84-85` (KIT_ROUTE); `install/README.md:340-365`
**Issue:** D-26 rejected writing the absolute kit root into the pointers because "the pointer files are committed and shared, so a per-machine path is wrong on every other machine". The route it adopted sends every host to `.grugops/install.json`, which holds the same per-machine absolute `kitRoot` and a bound `target`. `.grugops/` is documented as committed-style STATE. On a teammate's clone, a committed marker sends the agent to another user's kit path, and an uncommitted one makes AGENTS.md say the kit is the repository's own `agent-factory/`. Both fail closed into STOP, which is safe. Neither is documented, and a committed marker churns on every install on every machine.
**Fix:** In "How a host finds the kit after a scripted install", say whether to commit `.grugops/install.json`, and say that each machine re-runs install.js to bind the route.

### IN-03: The INCOMPLETE closings drop facts the complete branches print

**File:** `install/install.ts:1789-1797` (`--update`), `install/install.ts:5176-5181` (already-migrated `--migrate`)
**Issue:** `--update` under `DRY_RUN` with a counted verify prints `== update INCOMPLETE ... ==` without the `(DRY_RUN — nothing changed)` tag that the `--migrate` INCOMPLETE banner carries. The already-migrated `--migrate` INCOMPLETE branch also leaves out the `plans/handoffs/` backup it may have made and the leftover-kit advice. Neither is a false claim, but the user loses facts the run earned.
**Fix:** Add the DRY_RUN tag to the update banner, and print the backup and leftover lines before the INCOMPLETE banner.

### IN-04: The uninstall malformed-ledger arm calls updateKeptMarker for nothing

**File:** `install/uninstall.ts:1533-1534`
**Issue:** The new comment says updateKeptMarker "leaves this one", and in that arm it does return `"unchanged"` at its first line. The call and its discarded result are dead code that suggests the marker might be rewritten.
**Fix:** Remove the call, or keep it and use its result so the marker line reflects it.

### IN-05: The uninstall "preserved (never touched)" heading now precedes a line that can say the marker was removed

**File:** `install/uninstall.ts:2186-2190`
**Issue:** The closing reads `-- preserved (never touched) --` and then `.grugops/install.json (the install marker): removed by this run.` The line before explains this, but the heading still says "never touched".
**Fix:** Retitle the block `-- preserved, and the marker --`, or print the marker line under its own heading.

### IN-06: The install guide's AGENTS.md bullet still says "only when the target has none"

**File:** `install/README.md:263-266`
**Issue:** The bullet says AGENTS.md is "copied from the kit ... only when the target has none". The paragraph below it, and the code at `install/install.ts:5698-5704`, also replace install's own unedited copy on a re-install.
**Fix:** Change the bullet to "copied when the target has none, and refreshed when it is install's own unedited copy (see below)".

---

_Reviewed: 2026-10-10T12:01:12Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
