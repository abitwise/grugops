# Phase 41: Orchestrator flow guidance - Pattern Map

**Mapped:** 2026-11-04
**Files analyzed:** 20
**Analogs found:** 19 / 20 (the WF17 session-compaction text has no direct analog)

All analog paths below were checked with `git ls-files`. Line numbers for `install/install.ts`, `install/uninstall.ts`, `generate-runnable-embeds.ts`, `check-imperative-lexicon.ts`, `checkpoints.ts` and `tier-kit-text.test.ts` come from 41-RESEARCH.md and were not re-read here; confirm them before editing.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/runnable-ref/claim.ts` (new) | utility (host CLI) | file-I/O, request-response | `scripts/runnable-ref/state-roll.ts` | exact |
| `scripts/runnable-ref/claim.js` (new, built) | build output | n/a | `scripts/runnable-ref/state-roll.js` | exact |
| `scripts/runnable-ref/claim.test.ts` (new) | test | integration, spawn | `scripts/runnable-ref/state-roll.test.ts` | exact |
| `scripts/runnable-ref/runnable-exit-contract.test.ts` | test | fault injection | itself (add a row) | exact |
| `scripts/claim.ts` / `.js` | service (authority) | file-I/O | itself | exact |
| `scripts/claim.test.ts`, `scripts/now-running-freshness.test.ts` | test | unit | themselves | exact |
| `scripts/context-io.ts` | service (authority) | file-I/O | itself (export the task-name rule) | exact |
| `scripts/generate-runnable-embeds.ts` (+ test) | config (embed row) | transform | its state-roll row | exact |
| `install/install.ts` `RUNNABLES` | config | batch | existing rows | exact |
| `install/uninstall.ts` `RUNNABLES_MIRROR` | config | batch | existing rows | exact |
| `install/uninstall-removal.test.ts`, `installer-cross-version.test.ts`, `installer-never-installed.test.ts`, `installer-special-files.test.ts` | test | count pins | themselves | exact |
| `agent-factory/workflows/17-task-claim.md` | kit text | guidance | itself | exact, except session compaction |
| `agent-factory/workflows/04-ticket-to-pr.md` | kit text | guidance | itself | exact |
| `agent-factory/roles/orchestrator.md` | kit text | guidance | itself | exact |
| `agent-factory/roles/tech-lead.md` (optional) | kit text | guidance | itself | exact |
| `agent-factory/roles/_role-switch-protocol.md` | kit text | guidance | itself, step 4 | exact |
| `agent-factory/README.md` line 106 | doc | guidance | itself | exact |
| `agent-factory/config/factory.config.md` § queue | doc | config | itself | exact |
| `scripts/tier-kit-text.test.ts` or new `scripts/flow-guidance-text.test.ts` | test | text pins | `scripts/tier-kit-text.test.ts` | exact |
| `docs/audit/29-style-dispositions/41-NN.md` (new, one per plan) | audit record | n/a | `docs/audit/29-style-dispositions/40-24.md` | exact |

## Pattern Assignments

### `scripts/runnable-ref/claim.ts` (utility, file-I/O)

**Analog:** `scripts/runnable-ref/state-roll.ts`

**Header contract** (lines 1-40, 70-82): open with WHAT IT IS, then THE D-12 CONTRACT listing exit 0/1/2, then OUTPUT IS SANITIZED, BUILTINS ONLY and NOTHING HERE IS RETYPED.

**Imports and generated region** (lines 84-91): namespace imports keep hand-written names apart from the region's imports.
```typescript
import * as nodeFs from "node:fs";
import * as nodePath from "node:path";

// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`
...
// </runnable-embeds>
```

**Unexpected-throw handler** (lines 1385-1387, 1397-1411): register before argv is read.
```typescript
process.on("uncaughtException", (e) => stoppedUnexpectedly(e));
```

**Output helpers** (around lines 1425-1438):
```typescript
const USAGE = `Usage: node state-roll.js <repo-root> [${DRY_RUN_FLAG}]`;

function printable(value: string): string {
  return stripControlChars(value, false);
}

function couldNotRun(message: string): never {
  process.stderr.write(`Error: ${printable(message)} Nothing was rolled.\n`);
  process.exit(2);
}
```

**Differences from the analog:**
- Subcommands instead of one action, and current directory with optional `--root` instead of a positional root. Refuse exit 2 when `<root>/.grugops` is absent.
- Exit 1 is an outcome to act on: `lost <task>` and `not-done <task>: ...`.
- Create `pending/`, `claimed/` and `done/` under a root-chain check before a claim, because `claimTask` uses a non-recursive `mkdirSync`.
- Use the CLI table in 41-RESEARCH.md for exact lines and codes.

---

### `scripts/claim.ts` (authority, file-I/O)

**Analog:** itself. Today's CLI (lines 324-336) stays as the kit CLI:
```typescript
const isMain = isEntrypoint(import.meta.url);

if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  try {
    if (cmd === "now-running") {
      const queueRoot = rest[0]; // optional explicit root (tests / the gate pass a temp root)
      renderNowRunning(queueRoot ?? DEFAULT_QUEUE_ROOT);
```

**Required changes:**
- Remove the `DEFAULT_QUEUE_ROOT` default from `renderNowRunning` (line 277). Otherwise `ROOT` (lines 60-61, `import.meta.dirname`) enters the embed closure.
- Resolve the duplicate `TASK_NAME_RE` and `assertSafeTask` (lines 68-69; also `context-io.ts:127-128`). The generator refuses one name twice in a target.
- Keep context-io's `atomicWrite` out of the roots, as `atomicWrite` and `cell` exist in both modules.
- Add `completeTask` (rename to `done/`, remove `claimed/<task>/`, render), the free count, the config parse and a defaults constant. These names are proposals.
- Extend the record at lines 130-135 with optional `agent:` and `level:`, keeping the CR/LF guard at lines 116-120.
- Make the render's "Re-run" comment correct on a host (line 308), and extend its table for D-03. The header is pinned in `now-running-freshness.test.ts:113`.
- Make `sweepStale` report a claim already in `done/` as released, not reclaimed (lines 205-213).

---

### `scripts/runnable-ref/claim.test.ts` (test)

**Analog:** `scripts/runnable-ref/state-roll.test.ts` lines 68-80
```typescript
function hostCopy(): string {
  const host = mkTmp("grugops-state-roll-host-");
  const js = join(host, "state-roll.js");
  copyFileSync(ROLL_JS, js);
  return js;
}

const HOST_JS = hostCopy();

function run(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [HOST_JS, ...args], { encoding: "utf8", cwd: dirname(HOST_JS) });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}
```
Difference: `claim.js` defaults to the current directory, so `cwd` must be the fixture repository, or pass `--root`. Add `package.json` beside the copy, per the research host-copy case.

---

### `scripts/runnable-ref/runnable-exit-contract.test.ts` (test)

Add `"claim"` to the list and a `STOPPED` entry (lines 54-60). `Record<Runnable, ...>` makes the compiler demand the entry.
```typescript
const RUNNABLES = ["trace-render", "state-check", "state-roll"] as const;
```
The stderr line must start `Error: ` and end with the runnable's own could-not-run sentence. Stdout stays empty and the exit is 2.

---

### `scripts/generate-runnable-embeds.ts` (embed row)

**Analog:** the state-roll row (lines 310-340)
```typescript
{
  target: "scripts/runnable-ref/state-roll.ts",
  authorities: [
    { module: "install/state-layout.ts", roots: ["BOARD_REL", "ARCHIVE_REL", "BOARD_DONE_ARCHIVE_REL", "PROGRESS_REL", "PROGRESS_ARCHIVE_REL", "BUDGETS"] },
    // ...
    { module: "scripts/context-io.ts", roots: ["readRegularFileOrNull", "atomicWrite", "rootChainPresence", "isWithin", "ROOT_CHAIN_LINK_REFUSAL"] },
  ],
},
```
Add the claim row with the roots listed in RESEARCH § Supporting. Move `EMBED_SPEC_COUNT` 4 to 5 (line 392) in the same commit. A stamped row changes `RUNNABLE_SET`, so the stamp in the other three runnables regenerates too (see Open Question 4).

---

### `install/install.ts` and `install/uninstall.ts` (row pair)

**Analog:** `install.ts:6044-6070` and `uninstall.ts:2795-2808`. Add the same row to both, after state-roll:
```typescript
["scripts/runnable-ref/state-roll.js", "tools/grugops/state-roll.js"],
["scripts/runnable-ref/claim.js", "tools/grugops/claim.js"],
```
**Count pins:** `RUNNABLE_PATH_COUNT = 7` to 8 (`uninstall-removal.test.ts:112`), and "7 runnables" (`installer-cross-version.test.ts:67`). Run the four installer tests red first, then move each pin by the measured number.

---

### `agent-factory/workflows/17-task-claim.md` (kit text)

**Analog:** itself. Sections by line: seam 23, Platform depth and width 31, Steps 42, Stop conditions 57, Board moves 62, Trace updates 65, Done condition 68, Commit 71.

**Text to replace:**
- Step 2 (line 47) and step 3 (line 49): `claimTask` and `transition` become one `claim` command run by the Orchestrator at dispatch. Record the D-04 reversal.
- Step 5 (line 53): becomes the agent's `done <task>`, which also releases the claim directory.
- Step 6 (line 55): "periodically" becomes session start only (D-11).
- Line 35: "caps 20 concurrent subagents and 200 per session" is stale. Use 20 by default, no session total, and resumes skip the check.
- Stop conditions (lines 58-59) name `claimTask`; a changed bullet count moves `WORKFLOW_STOP_BULLET_COUNT = 48`.
- Done condition (line 69): "wall-clock sweep" wording follows D-11.

**Capability keying, from `orchestrator.md` lines 30-31:**
```markdown
6. Where the `Agent` spawn tool exists, spawn role agents up to `queue.wip_limit` at once.
7. Where it does not, drain the same queue one subtask at a time through `_role-switch-protocol.md`.
```

**Checkpoint commit (D-17):** point to the existing Commit section at line 71. Do not restate it.

**Sweep wording:** after an in-session compaction there is no sweep, per RESEARCH Pitfall 4 and assumption A4. Confirm this with the human.

---

### `agent-factory/workflows/04-ticket-to-pr.md` (kit text)

**Analog:** itself. Step 4 (line 31) already holds the spawn rule; add the claim before it, one instruction per sentence:
```markdown
Spawn that adapter by name as a non-fork sub-agent. Pass no `model` or `effort` parameter on the spawn call. Never re-decide the level.
```
- Add the indented numbered "Stop precedence" list to step 15. `numbered()` in `tier-kit-text.test.ts:119-135` keeps an indented `1.` list inside a step.
- State ask-once once and replace scattered sentences (D-21, D-27).
- Keep `exhaust_self_fix_budget` exactly once in the file.
- Update pinned sentences in `tier-kit-text.test.ts:866-1100` in the same commit.

---

### `agent-factory/roles/orchestrator.md` (kit text)

**Current text** (responsibilities 6-10):
```markdown
6. Where the `Agent` spawn tool exists, spawn role agents up to `queue.wip_limit` at once.
7. Where it does not, drain the same queue one subtask at a time through `_role-switch-protocol.md`.
8. Have each role claim, work and close its subtask per Workflow 17.
9. Run the gate before a ticket advances.
10. Sweep claims older than `queue.stale_ttl_minutes` back to `pending/`.
```
**Target:** keep item 9 as its own item, because it is not flow text (Pitfall 6). The pointer must name role activation, which registry claims C-28-013 and C-28-025 measure:
```markdown
Start role agents, claim, refill, sweep and compact per `agent-factory/workflows/17-task-claim.md`.
```
Add the D-13 sentence to `## Hard limits`, qualified for hosts without `Agent` (Pitfall 11). Stay under WARN 6,195 B. Hard limits edits need a disposition row and a human read.

---

### `agent-factory/roles/_role-switch-protocol.md` and `agent-factory/README.md`

Both carry wording D-04 makes wrong:
- `_role-switch-protocol.md:23`: "When the work was queued, claim the subtask per Workflow 17 … first." The Orchestrator has now claimed; the role runs `done`.
- `README.md:106`: "each role claims its subtask".

---

### `docs/audit/29-style-dispositions/41-NN.md` (audit record)

**Analog:** `docs/audit/29-style-dispositions/40-24.md`. Use a title naming the plan, a section on how the rows were made, and a `## Dispositions` table with seven columns:
```markdown
| file | line | before | after | rule | disposition | companion |
```
`before` is the removed side and `after` the added side, with `—` for an empty side. Each disposition cell stays pending until the named human reads it.

## Shared Patterns

### Exit codes
**Source:** `scripts/runnable-ref/state-roll.ts` lines 17-37; `runnable-exit-contract.test.ts` lines 4-7
**Apply to:** `claim.ts` host program
Exit 0 is done, 1 is an outcome to act on, and 2 is could not run or refused. An escaped throw is always exit 2, never 1.

### Authority embedding
**Source:** `scripts/generate-runnable-embeds.ts`
**Apply to:** every rule the host program uses
Never retype a rule. Run `npm run build && npm run generate:runnable-embeds`, then `npm run freshness:runnable-embeds`.

### Safe reads and printed values
**Source:** `scripts/context-io.ts` (`readRegularFileOrNull`, `rootChainPresence`, `isWithin`, `readRawNotesWithSkips`); `scripts/state-rules.ts` (`stripControlChars`)
**Apply to:** every path, config read, note read and printed value in `claim.js`

### Kit text gates
**Source:** `scripts/check-imperative-lexicon.ts` lines 548-601
**Apply to:** all WF17, WF04, role and protocol edits
- Start each `## Steps` bullet with an approved verb. "Spawn", "Refill", "Close", "Sweep" and "Pause" are not approved; use Run, Claim, Hand, Read, Mark or Transition.
- Keep procedural sentences to 20 words and descriptive ones to 25.
- Use no modal in a procedural step, and do not chain two approved verbs.
- Avoid token-saving claims (`npm run check:banned-claims`).
- Say "session compaction", and never "compacts at 400k".
- Keep host names to the operator tips and platform blocks.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| WF17 session-compaction and operator-tips section | kit text | guidance | No kit text covers host session compaction. Use D-14 to D-20 and the RESEARCH host-facts table. WF18 is a naming collision, not a model. |

## Open Items for the Planner

- **RESEARCH Open Question 1 blocks the `done` task:** only the Claude Code plugin can write sealed notes, so D-07 could refuse forever on five hosts.
- **Baseline red:** one `check-foundation-guards.test.ts` case fails because of the untracked `~` directory. It is user content; do not delete it.
- **Unrelated local change:** `docs/audit/28-prepass-evidence.md` is modified in the working tree. Leave it out of phase commits unless the human says otherwise.

## Metadata

**Analog search scope:** `scripts/`, `scripts/runnable-ref/`, `install/`, `agent-factory/roles/`, `agent-factory/workflows/`, `docs/audit/29-style-dispositions/`
**Files read directly:** `state-roll.ts`, `state-roll.test.ts`, `runnable-exit-contract.test.ts`, `claim.ts` (parts), `40-24.md`, `orchestrator.md` (part), `17-task-claim.md` (parts)
**Pattern extraction date:** 2026-11-04
