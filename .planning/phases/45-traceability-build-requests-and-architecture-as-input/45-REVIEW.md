---
phase: 45-traceability-build-requests-and-architecture-as-input
reviewed: 2026-11-26T00:00:00Z
depth: standard
files_reviewed: 101
files_reviewed_list:
  - agent-factory/config/factory.config.md
  - agent-factory/contracts/board.md
  - agent-factory/contracts/build-request.md
  - agent-factory/contracts/upstream.md
  - agent-factory/roles/architect-design.md
  - agent-factory/roles/ba-pm.md
  - agent-factory/roles/designer.md
  - agent-factory/roles/greenfield-mapper.md
  - agent-factory/roles/system-analyst.md
  - agent-factory/seed/memory-bank/50-decisions/ADR-template.md
  - agent-factory/seed/memory-bank/plans/build-requests/.gitkeep
  - agent-factory/workflows/00-bootstrap-greenfield.md
  - agent-factory/workflows/03-epic-to-tickets.md
  - agent-factory/workflows/09-daily-sweep.md
  - agent-factory/workflows/17-task-claim.md
  - agent-factory/workflows/20-upstream-sources.md
  - docs/audit/29-style-dispositions/45-02.md
  - docs/audit/29-style-dispositions/45-10.md
  - docs/audit/29-style-dispositions/45-11.md
  - docs/reference/agents/architect-design.md
  - docs/reference/agents/ba-pm.md
  - docs/reference/agents/greenfield-mapper.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/archive/.gitkeep
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/board.md
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/epics/.gitkeep
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/features/.gitkeep
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/.layout
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/metrics.md
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/nfr-catalog.md
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/nfr/.gitkeep
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/releases/.gitkeep
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/sprints/.gitkeep
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/tickets/ABC-1.md
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/tickets/.gitkeep
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/traceability/.gitkeep
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/traceability.md
  - install/fixtures/v3.0-blocked-board/memory-bank/plans/uat/.gitkeep
  - install/fixtures/v3.0-blocked-board/README.md
  - install/installer-cross-version.test.ts
  - install/installer-never-installed.test.ts
  - install/installer-special-files.test.ts
  - install/installer-user-edit.test.ts
  - install/install.test.ts
  - install/migrate-v3-states.test.ts
  - install/mode-census.test.ts
  - install/README.md
  - install/state-layout.js
  - install/state-layout.ts
  - install/state-migrate.js
  - install/state-migrate.ts
  - memory-bank/50-decisions/ADR-template.md
  - scripts/build-request-fixture.test-support.ts
  - scripts/build-request-model.js
  - scripts/build-request-model.test.ts
  - scripts/build-request-model.ts
  - scripts/check-banned-claims.js
  - scripts/check-banned-claims.test.ts
  - scripts/check-banned-claims.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-imperative-lexicon.js
  - scripts/check-imperative-lexicon.test.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/checkpoints.js
  - scripts/checkpoints.ts
  - scripts/context-io.js
  - scripts/context-io.ts
  - scripts/flow-guidance-text.test.ts
  - scripts/generate-runnable-embeds.js
  - scripts/generate-runnable-embeds.ts
  - scripts/runnable-ref/claim.js
  - scripts/runnable-ref/claim.ts
  - scripts/runnable-ref/note.js
  - scripts/runnable-ref/note.ts
  - scripts/runnable-ref/read-sites.test.ts
  - scripts/runnable-ref/runnable-exit-contract.test.ts
  - scripts/runnable-ref/state-check.js
  - scripts/runnable-ref/state-check.test.ts
  - scripts/runnable-ref/state-check.ts
  - scripts/runnable-ref/state-roll.js
  - scripts/runnable-ref/state-roll.ts
  - scripts/runnable-ref/trace-render.js
  - scripts/runnable-ref/trace-render.ts
  - scripts/runnable-ref/upstream.js
  - scripts/runnable-ref/upstream.test.ts
  - scripts/runnable-ref/upstream.ts
  - scripts/state-rules.js
  - scripts/state-rules.test.ts
  - scripts/state-rules.ts
  - scripts/trace-instructions.test.ts
  - scripts/upstream-git.js
  - scripts/upstream-git.test.ts
  - scripts/upstream-git.ts
  - scripts/upstream-model.js
  - scripts/upstream-model.test.ts
  - scripts/upstream-model.ts
  - scripts/validate-agent-factory.js
  - scripts/validate-agent-factory.ts
  - scripts/validate-read-sites.test.ts
  - scripts/validate.test.ts
findings:
  critical: 0
  warning: 5
  info: 9
  total: 14
status: issues_found
---

# Phase 45: Code Review Report

**Reviewed:** 2026-11-26
**Depth:** standard
**Files Reviewed:** 101
**Status:** issues_found

## Summary

I reviewed the phase 45 diff (`a044f0c8..HEAD`). The review covered the new build-request grammar (`scripts/build-request-model.ts`), the git module moved out of the reader (`scripts/upstream-git.ts`), the changes to `scripts/upstream-model.ts` (`escalation_days`, the `## Upstream` statement, the citation decision, the changed-ID rule), the hand-written `requests` verb in `scripts/runnable-ref/upstream.ts`, the build-request pass in `state-check`, the citation and build-request checks in the structure validator, the budget and embed bookkeeping, and the contracts, workflows and roles. I treated each committed `.js` as the build of its `.ts`. The three hashes in `hooks/hook-entry.ts` (`DECIDER_MANIFEST`) match the committed `install/state-layout.js`, `scripts/checkpoints.js` and `scripts/context-io.js`.

The runnable code holds up under tracing:
- Every value passed to git passes `UPSTREAM_OBJECT_ID_RE` or `isManifestPath` first.
- The ancestry call layers `GIT_GRAFT_FILE` over the scrubbed environment.
- Refusals are value-silent.
- The History state machine matches the lifecycle table in the contract.
- The exit codes match the report contract.

I found no blocker. The defects that remain:
- Edge cases in the date and wait arithmetic: a future-dated request never escalates.
- An unguarded number allocation for parallel BA/PM writes.
- Two procedure-ordering mistakes in the workflow text, which is the product's instruction surface.
- A midnight-UTC flake in the new date-relative tests.
- Several places where a contract or doc claim says more than the code does.

## Warnings

### WR-01: A future-dated build request never escalates: negative wait ages pass silently

**File:** `scripts/build-request-model.ts:603-612, 758-765`; `scripts/runnable-ref/upstream.ts:2269, 2299`
**Issue:** The grammar requires `raised` to be a calendar date, the first History entry to carry that date, and dates never to decrease. Nothing bounds any of them by today. `buildRequestAgeDays` is documented as "Negative when `from` is later", and `buildRequestIsOverdue` compares `days > threshold`, so a request whose last status move is in the future never prints a `wait` line. A plausible BA/PM typo (`2062-11-26` for `2026-11-26`, or a `carried` entry dated next year) silently turns off the `upstream.escalation_days` escalation for that request forever. The bullet is also exempt from `blocked_escalation_days` (Workflow 09 step 7, Workflow 20), so the blocked ticket has no escalation path at all. The test suite itself writes a future `raised` (`2026-12-01` in `scripts/runnable-ref/upstream.test.ts:1976`), and nothing flags it. The validator, state-check and `requests` all admit such a file without comment.
**Fix:** Make a future last move visible in the one place that has a clock. In `requestItems`, before the wait check, emit an `unknown` item:
```ts
const days = buildRequestWaitDays(doc, today);
if (days !== null && days < 0) {
  items.push({ kind: "unknown", id: doc.id, source: doc.source,
    reason: `its last status move is dated after today (${today})` });
} else if (days !== null && buildRequestIsOverdue(days, threshold)) { ... }
```
This exits 2, so Workflow 20's stop on `UNKNOWN - verify` surfaces it to a human. Also add a sentence to the contract's History rules: "No entry is dated after the day it is written."

### WR-02: Build-request numbering has no guard against two parallel BA/PM subtasks taking the same number

**File:** `agent-factory/contracts/build-request.md:20-21`; `agent-factory/workflows/20-upstream-sources.md:77`
**Issue:** The contract says "A new request takes the highest number in the folder plus one", and Workflow 20 step 4 says to number it "as the contract says". The phase plans for parallel BA/PM subtasks: the overlap line exists "so a duplicate filed by a parallel BA/PM subtask is shown to the next BA/PM pass" (`build-request-model.ts` `buildRequestOverlaps`, D-09). Two subtasks that each read the folder and then write `BR-<max+1>.md` pick the same name:
- In one working tree, the second write replaces the first request. Its question, blocks and History are lost, and its tickets carry a `## Blocked` bullet naming a request that now asks something else.
- In separate worktrees, it becomes a merge conflict on a file only BA/PM may write.
The overlap line cannot catch this, because only one file survives.
**Fix:** Give the procedure an existence check right before the write. In Workflow 20 step 4, add: "Before writing, confirm `BR-<n>.md` does not exist. If it does, take the next number." Better still, have the Orchestrator run build-request writes one at a time (one BA/PM build-request subtask in flight per repository). State the rule in the contract's File section.

### WR-03: The unblock rule ignores a ticket's other blockers

**File:** `agent-factory/workflows/20-upstream-sources.md:85, 102`
**Issue:** Step 12 says: "Transition a ticket out of `Blocked` only when every request its bullets name is `answered` or `withdrawn` (BA/PM). Move it to `Backlog`". The Board moves paragraph says the same ("back to `Backlog` once every request it waits on is answered or withdrawn"). A ticket's `## Blocked` section can hold other bullets as well, for example the fixture's `waiting on ADR-0007 (owner: Architect/Design)` (`install/fixtures/v3.0-blocked-board/.../ABC-1.md`). As written, BA/PM moves such a ticket to `Backlog` as soon as its build request is answered, while the ADR blocker is still open. The ticket then leaves `Blocked` and stops aging under `blocked_escalation_days`. The rule is an instruction to an agent, and agents follow the literal text.
**Fix:** Reword both places so that the build request is one condition among the ticket's blockers:
> 12. When every request a ticket's bullets name is `answered` or `withdrawn`, remove those bullets (BA/PM). Move the ticket to `Backlog` only when its `## Blocked` section holds no other bullet, and re-plan it with the answer per Workflow 03.

### WR-04: Workflow 00 step 1 writes into `greenfield-plan.md` before step 2 drafts that file

**File:** `agent-factory/workflows/00-bootstrap-greenfield.md:27-28`
**Issue:** The new step 1 ends: "Record in `memory-bank/greenfield-plan.md` which source and pin gave each item." Step 2 then says: "Draft `memory-bank/greenfield-plan.md` from the raw idea (Greenfield Mapper) — the project plan of record." Run literally, the Greenfield Mapper creates the file in step 1, then drafts the plan of record "from the raw idea" in step 2. That can replace the provenance lines step 1 wrote, or keep them as orphan text outside the plan's structure. Either way, the record of which source and pin decided each stack item is not reliably in the plan of record. That record is the only place that provenance lives (Workflow 20, Upstream architecture).
**Fix:** Keep the read where it is, and move the recording into the draft step:
> 1. Read each stack or architecture decision of a source that owns `architecture` … Apply each decision over `default_stack` item by item. Upstream decides the items it names, and `default_stack` fills only the rest.
> 2. Draft `memory-bank/greenfield-plan.md` from the raw idea and the stack from step 1 (Greenfield Mapper). Name the source and pin that gave each upstream stack item. …

### WR-05: The new date-relative tests can fail at UTC midnight

**File:** `scripts/runnable-ref/upstream.test.ts:2182-2188` (used by the `wait` boundary cases at 2237-2285); `install/installer-cross-version.test.ts:453-456`
**Issue:** `upstream.js requests` reads `new Date()` once in the child process. The tests compute their own "today" at a different instant:
- `utcDaysAgo(n)` runs before the spawn. If the child starts after UTC midnight, it counts one more day. "raised 10 days ago prints no wait line" then sees 11 days and prints `wait … for 11 days`, and the equality assertion fails.
- `installer-cross-version.test.ts` computes `today` after `await Promise.all(...)`, so the race runs the other way.
Both failures are rare, unrelated to the code under test, and look like real regressions. Since 2026-12-01, the second test also takes the branch that prints `wait`, so it runs the day-count comparison on every run.
**Fix:** Read today's date immediately before and after the child runs. If the two differ, re-run the case once, or accept either expected output:
```ts
const before = utcToday();
const r = upstream(product, env, "requests");
const after = utcToday();
if (before !== after) return; // crossed UTC midnight; the case is not decidable on this run
```
Alternatively, give the runnable a test-only clock input that the tests set. That needs a documented, non-host seam.

## Info

### IN-01: The config doc overstates which requests print `UNKNOWN - verify` when no source is declared

**File:** `agent-factory/config/factory.config.md:313`
**Issue:** The doc says that with no `upstream` key, `requests` "prints an `UNKNOWN - verify` line for any build request on file". `requestsReport` only builds items for `open` and `carried` requests. An `answered` or `withdrawn` file prints nothing, so a folder of closed requests gives `no build request needs a human (<n> on file)` at exit 0.
**Fix:** Say "for any `open` or `carried` build request".

### IN-02: The report contract claims every printed value is grammar-checked, but `UNKNOWN - verify` reasons are not

**File:** `agent-factory/contracts/build-request.md:127-128`; `scripts/runnable-ref/upstream.ts:92-94` (header)
**Issue:** "Every value it prints is a build-request id, a source id, a date, a status, a number, an upstream ID or a commit id." The `unknown` reasons that `answerItems` passes through from `upstreamGitManifestAt`, `upstreamGitListedBlobs` and `upstreamGitDescends` can carry two kinds of text:
- The configured `source.path` (`path ../design does not exist`).
- The first line of git's stderr (`upstreamGitComplaint`, with only pathspecs masked).

The `BuildRequestReportItem` doc comment admits this ("except `unknown`'s reason"). The contract and the runnable header do not.
**Fix:** Add the exception to both sentences: "…or, in an `UNKNOWN - verify` reason, a configured source path or a git message, as `check` prints them."

### IN-03: The validator prints git-derived reasons unsanitized, unlike the runnable

**File:** `scripts/validate-agent-factory.ts:1087, 1138, 1496`
**Issue:** `upstream.js` passes every stdout line through `printable` (it strips C0, C1 and DEL). The validator writes `UNKNOWN - verify <source>@<commit>: <reason>` with the raw reason from `upstreamGitManifestAt`, which can hold the first line of git's stderr run against an untrusted checkout. The validator already JSON-quotes a non-printable task name (`taskUnreadLine`), so it intends to sanitize here too. Git rejects control characters in ref names and `source.path` refuses them, which keeps the practical risk low.
**Fix:** Apply `stripControlChars(text, false)` (from `scripts/state-rules.ts`) to each `unknowns` line and each citation finding before printing.

### IN-04: `stateConfigAbs` silently falls back to the working directory

**File:** `scripts/validate-agent-factory.ts:653-657`
**Issue:** `resolve(candidates[KINDS.indexOf("repository-state-plane")] ?? "")`: if the kind name is ever renamed, `indexOf` returns -1, the lookup yields `undefined`, and `resolve("")` is the process working directory. No config file then matches, `stateUpstream` stays null, and the citation check stops running without any message. That is a check that reports a pass it did not perform.
**Fix:** Fail closed when the lookup misses:
```ts
const i = GOVERNANCE_CONFIG_CANDIDATE_KINDS.indexOf("repository-state-plane");
if (i < 0) throw new Error("context-io no longer names the repository-state-plane candidate");
```

### IN-05: The validator and state-check do not run the grammar on a build-request file over 64 KiB

**File:** `scripts/validate-agent-factory.ts` (`checkBuildRequests`, the `entry.value.size > BUILD_REQUEST_READ_MAX_BYTES` skip); `scripts/runnable-ref/state-check.ts` (`buildRequestFindings`, the same skip); `agent-factory/contracts/build-request.md:187-188`
**Issue:** The contract says both programs "parse every file with the grammar". A file over the reader ceiling is skipped and only gets the budget finding, which is a WARNING on an unmarked tree. On the same file, `upstream.js requests` prints `refused BR-<n>.md: above-ceiling` and exits 2. The two tools then disagree about whether the folder is healthy.
**Fix:** In both programs, report such a file as a grammar refusal with code `above-ceiling`, as `requests` does, or narrow the contract sentence.

### IN-06: A frontmatter line of only VT or FF skips the control-character refusal

**File:** `scripts/build-request-model.ts:310-313`
**Issue:** `if (line.trim() === "") continue;` runs before `BUILD_REQUEST_CONTROL.test(line)`. JavaScript's `trim()` removes `\x0b` and `\x0c`, so a frontmatter line made only of those characters is admitted as blank. The same line in the body is refused, because the body's control check runs first. The impact is nil today, since no value is printed, but the two regions follow different rules.
**Fix:** Test `BUILD_REQUEST_CONTROL` before the blank-line skip.

### IN-07: The ancestry read trusts the upstream checkout's commit-graph

**File:** `scripts/upstream-git.ts:494`
**Issue:** `merge-base --is-ancestor` uses the checkout's commit-graph file and its generation numbers when `core.commitGraph` is on (the default). Grafts and replace refs are turned off, but a crafted `.git/objects/info/commit-graph` in the untrusted checkout can still change the answer. The answer only drives the `not-descendant` warning, so the impact is small.
**Fix:** Run the ancestry call as `["-c", "core.commitGraph=false", "merge-base", ...]`. That places a `-c` before the subcommand, so `upstreamGitRun` would have to put it after `-C <dir>`. Otherwise, record the residual next to the grafts note in the module header.

### IN-08: The `answered` pin is never compared with the declared pin

**File:** `scripts/build-request-model.ts` (`buildRequestHistory`, `answered` branch)
**Issue:** The grammar checks only that the answer pin has the raising pin's length and differs from it. No reader compares it with `upstream.sources[].commit`. Once a request is `answered`, it leaves the live set, so a mistyped pin on the answer line goes unnoticed. The claim note in Workflow 20 step 11 then cites `@<new pin>` refs that may not match the pin the repository builds from.
**Fix:** In the validator, warn when an `answered` request's last answer pin is neither the declared pin nor an ancestor of it. Or document this as an accepted prose-tier gap next to the `human:<name>` disclaimer.

### IN-09: The ADR status vocabulary mixes cases

**File:** `agent-factory/seed/memory-bank/50-decisions/ADR-template.md:17`; `memory-bank/50-decisions/ADR-template.md:17`
**Issue:** `<proposed | accepted | Accepted (upstream) | deprecated | …>`: every status is lowercase except the new one. A role filling the template can write `accepted (upstream)`, and Workflow 20's done condition looks for the exact `Accepted (upstream)`.
**Fix:** Pick one case for the whole list and use it in Workflow 20 as well.

---

_Reviewed: 2026-11-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
