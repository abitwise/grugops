---
phase: 34-model-effort-dial-pi-support
reviewed: 2026-10-10T18:50:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - CHANGELOG.md
  - install/README.md
  - install/host-tools.js
  - install/host-tools.test.ts
  - install/host-tools.ts
  - install/install.js
  - install/install.ts
  - install/installer-fs-census.test.ts
  - install/kit-route.test.ts
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 34: Code Review Report (gap round 4)

**Reviewed:** 2026-10-10T18:50:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Scope: the round-4 diff `d0c90d6f..HEAD` (plans 34-32..34-36). That covers HostTool.entryGates, ENTRY_GATE_CHECKS, readGeminiContext, geminiMergePlan, hostReadsCarrier, reachVia/strandedBy, classifyCarrier and the read-then-print doctor, noteStrandingCarriers/PLANNED_BYTES/adapterRouteAfterRun, refreshable, the class-matrix tests and the README/CHANGELOG updates. install.ts was read through its diff and the helpers the new code calls: ensureBlock, refreshOwnFile, writePiPromptTemplate, linkOrCopy, mergeGemini, the AGENTS.md step and the doctor's D-03 adapter read.

Verification done:
- `npm run -s freshness`: all 73 committed `.js` files match a rebuild.
- `TMPDIR=<scratch> npx vitest run install/host-tools.test.ts`: 61/61 pass.
- Scratch reproductions, each with its own `GRUGOPS_HOME`, all removed afterwards: a clean install followed by the edits named below, then `--check`, a re-install and `--check` again. Also a fresh-target `DRY_RUN` and a real install, compared for route notes. They agree, so PLANNED_BYTES and adapterRouteAfterRun hold in that case.

What holds:
- The geminiMergePlan refactor behaves exactly like the round-3 mergeGemini. Same order (ledger, then blocked, then create, then shape), same `why` texts, same GEMINI_SEEN updates.
- reachVia and strandedBy match the brute-force oracle.
- The stated counting invariant holds in every case I built: a counted kit-route line exists exactly when a `reach` line says CANNOT.
- CR-01's two reproductions now report Gemini CLI as unable to reach, with a counted WARN.
- WR-03's deletion case is an uncounted `note`, and `--check --strict` exits 0.

What does not hold. These are members of the two classes the round targets, on states the class matrix does not build:
- **WR-13 (AUTH-1/VERDICT-1).** When the install block has been taken out of `CLAUDE.md` or the Copilot pointer, the doctor says "install will not refresh it ... install leaves it as it is". A re-install then appends the block, route included, and the WARN clears. refreshable owns "would install refresh X", but nothing owns "would install write the route into X". ensureBlock's append arm answers the second question and the doctor never asks it.
- **WR-14 (VERDICT-1).** The Gemini gate reports "Gemini CLI does not read AGENTS.md here" for every settings shape install refuses to merge. That includes one whose own reason, printed on the same line, says which `context` Gemini reads is not known.
- **WR-15 (AUTH-1).** A linked `.gemini/settings.json` that lists AGENTS.md: the doctor says Gemini reads it and reaches. Install, on the same file, exits 3 with "add AGENTS.md to context.fileName by hand if you want Gemini CLI to read it".
- **WR-16 (AUTH-1).** Install's own `--symlink` AGENTS.md link: the doctor says "a link a --symlink install made". On the same file, the re-install's verify says "a link it did not create". The doctor's by-hand remedy edits a file inside a grugops checkout, outside the target.

None of these repeats a round-3 ID. WR-04 and WR-05 (deferred) are not re-raised.

## Warnings

### WR-13: The doctor says install will not write a block carrier whose install block is gone, but install re-appends the block and the WARN clears (one rule, two derivations)

**File:** `install/install.ts:1457-1459` (refreshable block arm: `no("it holds no install block")`), `install/install.ts:1508-1514` (classifyCarrier maps every not-ok answer to `user`), `install/install.ts:1479` (`user: "has no kit route, and install will not refresh it"`), `install/install.ts:1695-1698` (the WARN: "install will not refresh it ... so --check reports it and install leaves it as it is"), versus `install/install.ts:3017` and `3046-3078` (ensureBlock: no open sentinel, so the block is appended). Docs: `install/README.md:375-377` ("any other file without the route (your own, ...) is a WARN that gives the reason install will not refresh it"), `CHANGELOG.md:324-326` ("names the re-run only when install would refresh or create the file, and otherwise gives the reason and the sentence to add by hand"). Test gap: `install/kit-route.test.ts:1716-1719`.

**Issue:** The brief's §4 rule says the doctor's remedy names what an install run on that state actually does. refreshable answers only "would install *refresh* install's own block". For a block carrier (`CLAUDE.md`, `.github/copilot-instructions.md`) that is present but holds no open sentinel, it answers not-ok ("it holds no install block"). The doctor then calls the file `user`, says install leaves it as it is, and gives a by-hand remedy. But ensureBlock appends a fresh block, route included, to any regular file without the open sentinel. Reproduced with a scratch `GRUGOPS_HOME`:
1. Clean install. Replace `AGENTS.md` with `# My agents ...` (no route). Replace `.github/copilot-instructions.md` with `# Copilot notes / Use tabs.` (the user dropped the block).
2. `--check` prints `WARN kit route missing from .github/copilot-instructions.md (it leaves GitHub Copilot CLI without a route to the Orchestrator): install will not refresh it (it holds no install block), so --check reports it and install leaves it as it is. Add this sentence after its start-here sentence: ...`. It also prints `reach GitHub Copilot CLI: CANNOT reach ... .github/copilot-instructions.md has no kit route, and install will not refresh it`.
3. The re-install prints `created .github/copilot-instructions.md (optional Copilot pointer)`. The file now ends with the Copilot block and KIT_ROUTE.
4. `--check` now prints `ok kit route carried by .github/copilot-instructions.md` and `GitHub Copilot CLI: reaches the Orchestrator`.

So the line's verdict ("install leaves it as it is") and its remedy were both not earned. The README and CHANGELOG sentences above state the same false rule. For `CLAUDE.md` the same state gives an uncounted `note` with the same false sentence, because Claude Code's adapters give the route. The class matrix never builds this state: `user-without-route` for a block carrier keeps the open sentinel and adds a user line inside the block. So assertion (5), which would catch this, never sees it.

**Fix:** Give the question "what would install write into route carrier X here" one owner, and have the doctor ask it. That owner covers refresh, append and create. For example:
```ts
type InstallWrite = { act: "refresh" | "append" | "create" } | { act: "none"; why: string; link: boolean };
function installWouldWrite(ledger: LedgerRead, rel: string, cur?: UserWriteRead): InstallWrite {
  const r = refreshable(ledger, rel, cur);
  if (r.ok) return { act: "refresh" };
  const sentinels = ROUTE_BLOCKS.get(rel);
  const now = cur ?? readForWrite(TARGET, join(TARGET, ...rel.split("/")));
  if (sentinels !== undefined && now.state === "ok" && !now.text.includes(sentinels.open)) return { act: "append" };
  if (now.state === "create") return { act: "create" };   // absentRemedy's rule, folded in
  return { act: "none", why: r.why, link: r.link };
}
```
classifyCarrier should map `append` to a state whose line says "Re-run install.js: it appends install's start-here block, which carries the route", and keep `user` for `none`. ensureBlock should branch on the same answer. Add a `user-without-block` carrier state to CARRIER_STATES, applied to block carriers, so assertion (5) covers it. Correct README:375 and CHANGELOG:324-326 to match.

### WR-14: The Gemini gate says "Gemini CLI does not read AGENTS.md here" for every settings shape install refuses to merge, including one whose own reason says which `context` Gemini reads is not known

**File:** `install/install.ts:1342-1343` (ENTRY_GATE_CHECKS: `if (ctx.state === "refused") return { reads: false, unread: false, ... }`), `install/install.ts:1713` (the head is chosen by `unread`), `install/install.ts:1203-1230` (readGeminiContext's refusals are install's merge refusals); `install/README.md:364-367` ("or cannot be read as a settings file install can merge, Gemini CLI has no file that gives it the route")

**Issue:** readGeminiContext is install's reader. It refuses every shape install will not *splice* and *reverse*. The gate reuses that refusal as a fact about what Gemini CLI *reads*, with `unread: false`, so the line head is "does not read" rather than "is not counted as reading". Reproduced with `.gemini/settings.json` = `{"context":{"fileName":["GEMINI.md"]},"context":{"fileName":["AGENTS.md"]}}`:
```
WARN  kit route: Gemini CLI does not read AGENTS.md here: this repository's .gemini/settings.json has more than one "context" key, so which one Gemini CLI reads is not known. ... Add "AGENTS.md" to context.fileName ... by hand
reach Gemini CLI: CANNOT reach the Orchestrator: AGENTS.md is not read by Gemini CLI here (... so which one Gemini CLI reads is not known)
```
The line asserts a verdict and, in the same sentence, says no verdict was reached. Node's `JSON.parse` keeps the last `context` (`{ fileName: [ 'AGENTS.md' ] }` for this file). Whether Gemini CLI's loader does the same is `UNKNOWN - verify`. The `not-strict-json` refusal has the same shape: a settings file with a `//` comment that lists AGENTS.md is reported as "does not read". Whether Gemini CLI's settings loader accepts comments is also `UNKNOWN - verify`. README:364-367 states the conflation as fact. Counting the host as not reaching (fail closed) is defensible. Saying Gemini "does not read" the file is a verdict the run did not earn (VERDICT-1).

**Fix:** In the gate, a refused shape is a state where no verdict was reached, not a "does not read":
```ts
if (ctx.state === "refused") return { reads: false, unread: true, why: `${here} ${ctx.why}, so no verdict was reached on what Gemini CLI reads`, remedy: remedy() };
```
This keeps the counted WARN and gives the head "is not counted as reading". Also consider having the `reach` line for a host whose only gate is `unread` say "is not shown to reach" instead of "CANNOT reach". Reword README:364-367 to "cannot be read as a settings file install can merge, `--check` does not count Gemini CLI as reading AGENTS.md".

### WR-15: A linked `.gemini/settings.json` that lists AGENTS.md: the doctor says Gemini reads it and reaches, while install on the same file exits 3 and says to add AGENTS.md by hand

**File:** `install/install.ts:1260-1264` (geminiMergePlan refuses `blocked` before reading), `install/install.ts:3379-3380` (mergeGemini's verify: "add AGENTS.md to context.fileName by hand if you want Gemini CLI to read it"), `install/install.ts:1328` (the gate reads through readUserFile, which follows the link), `install/install.ts:3196-3197` (noteStrandingCarriers' comment: a verify is printed when the run leaves the file *not listing* AGENTS.md)

**Issue:** "Does Gemini read AGENTS.md here" now has two answers in one tool. The doctor's gate follows the link and answers yes. Install's geminiMergePlan never reads a blocked path, so it prints a counted verify whose remedy is already done. Reproduced: a clean install, then `.gemini/settings.json` replaced by a link to a file holding `{"context":{"fileName":["AGENTS.md","GEMINI.md"]}}`. `--check` prints `ok kit route: Gemini CLI reads AGENTS.md here` and `reach Gemini CLI: reaches the Orchestrator through AGENTS.md`, exit 0. The re-install prints `verify .gemini/settings.json: ... is a symbolic link, and the installer never writes through a link it did not create — left untouched; add AGENTS.md to context.fileName by hand if you want Gemini CLI to read it.`, exit 3. The install's remedy was not earned, and a CI job that re-runs install fails on a target where every host reaches.

**Fix:** In mergeGemini's `blocked` arm, before the verify, read the path through readUserFile (DC-3 bounded, follows the link as Gemini does). When readGeminiContext answers `listed`, report `skipped .gemini/settings.json (a link install does not write through; it already lists AGENTS.md)` instead of a counted verify. Leave GEMINI_SEEN at null, because the link target is not install's to carry. Keep the verify for a blocked path that does not list it. Better still, have one function answer "does the file Gemini reads list AGENTS.md" for both the gate and mergeGemini.

### WR-16: Install's own `--symlink` AGENTS.md link: the doctor says install made it, the re-install's verify says install did not, and the by-hand remedy edits a file outside the target

**File:** `install/install.ts:1446-1449` (refreshable: owns answers owned and the record is a link, giving "it is a link a --symlink install made"), `install/install.ts:1669` (remedy "(in the file the link points to)"), versus `install/install.ts:6136-6144` (the AGENTS.md step: `isOwnLink(agentsDest, agentsSrc)` against the *current* source only, then readForWrite `blocked`, whose wording is `install/user-file.ts:216` "a link it did not create"), and `install/install.ts:3229-3233` (install's note: "add this sentence to it")

**Issue:** Reproduced: a `--symlink` install, then AGENTS.md re-pointed at another checkout's AGENTS.md without the route, with the ledger's link record updated to match. This is the realistic case of a target installed from a checkout that has since moved. `--check` prints `WARN kit route missing from AGENTS.md (...): install will not refresh it (it is a link a --symlink install made, ...). Add this sentence after its start-here sentence (in the file the link points to): ...`. The re-install prints `verify AGENTS.md: ... is a symbolic link, and the installer never writes through a link it did not create.` (exit 3) and a `note` telling the user to add the sentence to AGENTS.md. "Whose link is this" gets two answers in one tool, and install's answer contradicts its own ledger (this is the remark in round-3 WR-01, still present). The by-hand remedy, followed literally, edits `AGENTS.md` inside a grugops checkout outside the target. A `git pull` there reverts it, and other targets linked to that checkout change too. The remedy that works is to remove the link and re-run install.js: readForWrite then answers `create`, and the step links or copies the current kit AGENTS.md.

**Fix:** For a whole-file carrier whose owns answer is a `link:` record, give the remedy "Remove the link at AGENTS.md and re-run install.js, which links or copies the current kit AGENTS.md", not "edit the file the link points to". In the AGENTS.md step's `blocked` arm, ask `owns(PREVIOUS_LEDGER, TARGET, "AGENTS.md", "file")`. When it holds a link record, use the same reason and remedy as refreshable, so install and doctor give one answer and the verify no longer says install did not create the link.

## Info

### IN-14: `hostsReading` is now a dead product export, and it gives the ungated "could read" answer

**File:** `install/host-tools.ts:215-222`
**Issue:** Since plan 34-33 nothing in product code calls `hostsReading`. Only host-tools.test.ts does, and the census pins zero install.ts calls. It answers "which hosts read X" without entryGates, which is exactly the CR-01 mistake. A future caller who finds it by name gets the wrong answer, and the census catches that only in install.ts.
**Fix:** Delete it, or move it to test support. If it stays, rename it `hostsThatCouldRead` and add a census over every product module, not only install.ts.

### IN-15: The Gemini gate's `why` states what Gemini CLI reads without reading user-level settings

**File:** `install/install.ts:1335` ("this repository has no .gemini/settings.json, so Gemini CLI reads its default context file, not AGENTS.md"), `install/install.ts:1346`
**Issue:** README:368-369 says `--check` reads no user-level Gemini settings, which is a fair scope. But the WARN text says what Gemini CLI then reads. If the user's own Gemini settings list AGENTS.md, that sentence is false. The verdict is stated beyond what the run read (VERDICT-1, wording only).
**Fix:** Say "this repository has no .gemini/settings.json listing AGENTS.md (user-level Gemini settings are not read)".

### IN-16: An absent carrier's uncounted note says "the hosts that read it here"

**File:** `install/install.ts:1356-1358` (hostReadsCarrier answers `reads: true` for any ungated carrier, present or not), `install/install.ts:1679-1680`
**Issue:** Reproduced after deleting the Pi template: `note kit route: .pi/prompts/grugops.md is not present; no host is left without a route by it: the hosts that read it here have the route another way (Pi through AGENTS.md)`. No host reads a file that is not there.
**Fix:** For `absent` and `unread` states, say "the hosts that would read it".

### IN-17: The by-hand remedy says "after its start-here sentence" for files that have none

**File:** `install/install.ts:1669`
**Issue:** The `user` remedy is printed for the user's own AGENTS.md and for a Copilot file with no block (WR-13's reproduction). Neither has a start-here sentence, so the instruction cannot be followed as written.
**Fix:** "Add this sentence (after the start-here sentence, if the file has one)". Or, for a block carrier, take the WR-13 append remedy.

---

_Reviewed: 2026-10-10T18:50:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
