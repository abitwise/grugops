---
phase: 41-orchestrator-flow-guidance
reviewed: 2026-11-08T18:26:21Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - CHANGELOG.md
  - agent-factory/contracts/context-note.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/17-task-claim.md
  - docs/audit/29-style-dispositions/41-14.md
  - docs/audit/29-style-dispositions/41-16.md
  - docs/audit/29-style-dispositions/41-17.md
  - docs/audit/29-style-dispositions/41-18.md
  - docs/audit/41-residuals.md
  - hooks/admission-guard.test.ts
  - scripts/admission-server.test.ts
  - scripts/admission-server.ts
  - scripts/checkpoints.ts
  - scripts/compactor.test.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/flow-guidance-text.test.ts
  - scripts/generate-runnable-embeds.ts
  - scripts/runnable-ref/note-read-sites.test.ts
  - scripts/runnable-ref/note.js
  - scripts/runnable-ref/note.ts
  - scripts/runnable-ref/note.test.ts
findings:
  critical: 1
  warning: 6
  info: 5
  total: 12
status: issues_found
---

# Phase 41: Code Review Report

**Reviewed:** 2026-11-08T18:26:21Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I reviewed the changes since `1786df78`, from gap plans 41-13 to 41-18:

- the fail-closed root ladder in `scripts/context-io.ts` (`undeterminedRoot`, `WALK_DID_NOT_RUN`, `WALK_STARTED_ABOVE_HOME`, `namedRootAnswers`, `occupied`);
- the supersession block added to `admit()`, and the `canonicalRoleName` fold;
- the hand-written part of `note.ts`, the admission server's `try`, and the kit text, changelog, residual and disposition records.

For `note.js` I read the generated region only where the hand-written part depends on it.

The ladder change holds up. I traced every way a named root can yield to the walk. A root with no configuration reads the lean defaults, and the walk cannot answer with anything weaker, so the yield never lowers `human_admission` or `audit_retention`. The supersession block also held against padded and whitespace variants of `--supersedes`, reproduced on a lone host copy. Every variant was refused.

The main concerns:

- **WR-14:** the CR-02 fix removes the only sanctioned way to clear a duplicate green verdict. The refusal now promises "a named human resolves the duplicate", and no route exists for that.
- **WR-15:** the changelog and Workflow 16 state the supersession rules without the limits R-41-09 records. This confirms the 2026-11-08 security audit's flag.

**How findings were checked.** "Reproduced" means a run against a scratch copy of the committed `scripts/runnable-ref/note.js`, or against `scripts/context-io.js` in-process, in a temporary repository that has since been removed. Everything else comes from reading the code. I ran no test suite.

**Earlier findings.** Ids stay stable so the disposition ledger keeps its decisions.

- **Carried forward, re-checked at this head:** CR-03, WR-09, WR-10, WR-12, WR-13, IN-09, IN-10 and IN-13. Each is still present in a file in this scope, and each is restated briefly below. The full text is in the 2026-11-05 review at `1786df78`.
- **CR-02** reads fixed for the route it named. Its remaining routes are recorded in R-41-09, and WR-15 covers how the text describes them.
- **Not re-checked:** WR-05, WR-06, WR-07, WR-08, WR-11, IN-02 to IN-07, IN-11 and IN-12. They sit in files outside this review's scope (`scripts/claim.ts`, `scripts/runnable-ref/claim.ts`, `scripts/runnable-ref/state-check.ts`, `agent-factory/config/factory.config.md`, `agent-factory/roles/*`, `install/README.md`). The ledger will flag them "not in the current review". That flag means they were out of scope, not that they were fixed.

**Not repeated:**

- The recorded limits R-41-07 (including T-41-74), R-41-08 and R-41-09.
- The D-38 cost: a lean named root with a working directory above `HOME` refuses.

**No findings** in:

- `scripts/admission-server.ts`: the root read now sits inside the `try`, and the end-to-end test proves the server keeps answering;
- `scripts/checkpoints.ts`;
- `scripts/generate-runnable-embeds.ts`;
- the `canonicalRoleName` fold and the `--by` check.

The changed test files show no weakened assertion. Every removed expectation was replaced by a stricter one with a recorded reason.

## Critical Issues

### CR-03: No scripted host can write a green gate verdict, so `§14-gate#<id>` findings and every `artifact-ref` are refused on every host (carried forward)

**File:** `agent-factory/workflows/16-context-read-write.md:31`, `agent-factory/workflows/16-context-read-write.md:41`, `agent-factory/workflows/17-task-claim.md:62`, `scripts/runnable-ref/note.ts` (the `add` verb is the only verb)

**Issue:** Unchanged at this head. Workflow 16 line 41 still calls the gate route "The workhorse path", and Workflow 17 step 6 still names `note.js` as the writer of an `artifact-ref`. Both depend on a live green verdict. Only `emitVerdict` writes one, and a host has neither `scripts/context-io.js` nor a verdict verb in `note.js`. Plan 41-15 adds a second reason a verdict matters on a host: `admit()` now refuses to supersede one, so a verdict is permanent once it exists.

**Fix:** Unchanged, and it needs a human decision. Either ship a host verb for `emit-verdict` and record that a verdict becomes agent-mintable on a host, or state in Workflows 05, 16 and 17 that a scripted host has no gate stamp, and remove the "every host" reading from the `artifact-ref` text.

## Warnings

### WR-14: A duplicate green verdict can no longer be cleared by any sanctioned route, and the refusal says a named human will resolve it

**File:** `scripts/context-io.ts:4415-4424` (the D-03 duplicate clause), `scripts/context-io.ts:4494-4531` (the supersession block), `scripts/context-io.ts:4169-4218` (`emitVerdict`)

**Issue:** Reproduced in-process against `scripts/context-io.js`, in a repository at `human_admission: off`:

1. `emitVerdict("t1", "run1", "clean", sha, store)` twice wrote two live green verdicts for `§14-gate#run1`. `emitVerdict` does not check whether the run id already has a live verdict, so a retried emission step in one gate run is enough.
2. An `artifact-ref` with `gate_run: run1` was refused: `more than one live green §14-gate verdict exists ... until a named human resolves the duplicate.`
3. A `claim` by a routine role with `supersedes: <second verdict>` was refused: `may be superseded only through a named human's disposition`.
4. `admitAndAppend` with a `human:olger` stamp was refused under `off` (W3): a note that is not gated may not carry a human stamp.

Before plan 41-15 the duplicate cleared through one supersession. Now every route that reaches `admit()` refuses a target with `by === GATE_IDENTITY`, at every dial. The only route left is the gated branch of `admitAndAppend`. That branch exists only on Claude Code, only behind the hook, and only when the dial gates the new note. So under `off`, and on the five hosts with no hook, a duplicate verdict blocks every `artifact-ref` for that run permanently. The message's "a named human resolves the duplicate" then names no action except editing the store by hand, which Workflow 16 forbids. The same applies to "Only a named human's disposition retires one" in Workflow 16 step 3 and in `context-note.md:42-43` for any verdict on those hosts and dials.

**Fix:** Stop the duplicate at its source, outside the frozen span. In `emitVerdict`, before composing:

```ts
const live = currentState(readContext(task, contextRoot));
if (live.some((n) => isLiveGreenVerdict(n, id))) return null; // or throw a named refusal
```

Return or throw according to the emitter's existing contract, and add a test that a second `emitVerdict` for the same run id writes nothing. For a duplicate already in a store, name the human route in Workflow 16 and in the S4 message: what the human runs, and on which hosts. A fix that lets one verdict supersede another of the same run id would change `admit()`. That needs a named human's word and a re-base of `ADMIT_FROZEN_SHA256`.

### WR-15: The changelog and Workflow 16 state the supersession rules without the limits R-41-09 records (confirms the 2026-11-08 audit flag)

**File:** `CHANGELOG.md:141-143`, `agent-factory/workflows/16-context-read-write.md:31`, `docs/audit/29-style-dispositions/41-18.md:23`

**Issue:** Confirmed against the code and the pinned `LIMIT (R-41-09)` case in `scripts/runnable-ref/note.test.ts`.

- `CHANGELOG.md:143` says "A note whose `supersedes` target is in the store and cannot be read is refused at every dial." This is false for a note file that was renamed and cannot be read. `admit()` matches a skipped entry only by `${supersededId}.md` (`context-io.ts:4515-4518`), so a renamed file reads as naming no note. The claim is admitted, and the finding folds out once the file reads again.
- `CHANGELOG.md:141-142` says "A note can no longer supersede a green gate verdict or a finding the dial gates". That is also unqualified. A note naming an id that arrives later still folds it out on arrival, and a retirement admitted at `off` stands after the dial is raised. Both are recorded in R-41-09, and the changelog never points there.
- Workflow 16 line 31 places its R-41-09 pointer on the sentence about a target that names no note. The next sentence, "A target in the store that cannot be read is refused.", stands unqualified. The 41-18 disposition row names the renamed-file route only in its comparison cell, which a role never reads.

These lines sit under `### Security`, and the project rule is never to overstate a control. A reader takes them as complete.

**Fix:** In `CHANGELOG.md`, end the two bullets with "Residual R-41-09 records the routes that stay open: a target that arrives later, a dial raised after a retirement, and a note file that was renamed and cannot be read." In Workflow 16 step 3, write "A target in the store that cannot be read is refused, unless its file was renamed (R-41-09)." Add a disposition row for the changed clause.

### WR-09: An exit-1 `refused` line still covers I/O faults, and plan 41-13 adds a second exit-1 class that means "stop" (carried forward)

**File:** `scripts/runnable-ref/note.ts:2877-2879`, `scripts/runnable-ref/note.ts:14-19`, `agent-factory/workflows/16-context-read-write.md:31`

**Issue:** `isWriterRefusal` still matches any message that starts with `context-io`, so an unrecordable admission and an `EIO` from `publishNoteExclusive` still print `refused`, exit 1. Plan 41-13 adds `undeterminedRoot`, deliberately prefixed `context-io.trustedRepoRoot` so that it lands in the same class. The header now carves out that exception by message text. Exit 1 therefore means "change the note" for some lines and "stop, nothing about the note is wrong" for others, and the only way to tell them apart is the wording. Workflow 16 step 3 still sends every exit-1 line to step 4. The root refusal is the exception, through the new stop bullet at line 51.

**Fix:** As before, give the writer a typed refusal for the decisions that judge the note (validate, `admit()` findings, size ceiling), and test `instanceof` in `note.ts`. Map `undeterminedRoot` and the I/O faults to exit 2, or to a distinct printed prefix such as `stopped FOLDER: REASON` that Workflow 16 names.

### WR-10: A link on `.grugops/audit` still sends the audit ledger outside the repository (carried forward)

**File:** `scripts/runnable-ref/note.ts:2890-2905` (`runAdd`)

**Issue:** Unchanged. `runAdd` asks the root-chain owner about `.grugops` and the path to `notes/` only. The ledger append under `retained` follows a link at `.grugops/audit`.

**Fix:** As before, run `refuseUnusableStore(root, \`${GRUGOPS_DIR_REL}/audit\`)` before the write, refuse a link at `admissions.jsonl`, and add a case beside the T-41-33 link cases.

### WR-12: Workflows 16 and 17 name a read route no role on a host can run (carried forward)

**File:** `agent-factory/workflows/16-context-read-write.md:19`, `agent-factory/workflows/16-context-read-write.md:27`, `agent-factory/workflows/17-task-claim.md:60`

**Issue:** Unchanged. Each still says to read through `context-io.ts` (`readContext` / `render`), which a host does not have, and `note.js` still has only `add`. Plan 41-18 makes this more pressing: a role is now told that an unreadable target is refused, but it has no supported way to see which notes are sealed and current before it names one.

**Fix:** As before, add a `read FOLDER` verb to `note.js`, or state the `index.md`-first rule in step 1.

### WR-13: Under an active dial, a spawned high-severity role has no route to admit a finding (carried forward)

**File:** `agent-factory/workflows/16-context-read-write.md:43`, `agent-factory/workflows/16-context-read-write.md:49`

**Issue:** Unchanged. Plan 41-15 adds a twin. The supersession refusal tells a role to "ask a named human", and Workflow 16 still says nothing about who then writes the note, as which `by`, or with which tool. On a host with no hook the answer is that no one can (see WR-14).

**Fix:** As before, name the route in step 4 for Claude Code, and state for the other hosts that no route exists.

## Info

### IN-14: The text says an undeterminable `HOME` refuses every note, but a named root with a configuration still admits

**File:** `CHANGELOG.md:135`, `agent-factory/workflows/16-context-read-write.md:65`, `docs/audit/41-residuals.md:19` (R-41-07, second limit)

**Issue:** Reproduced. In a repository set to `human_admission: all`, with `HOME=/nonexistent` and `CLAUDE_PROJECT_DIR` naming that repository, `note.js add t1 --kind observation ...` printed `noted`, exit 0. With no name set, the same run was refused. `trustedRepoRoot` returns a named root that carries a configuration (`context-io.ts:6077`) before it reads the home directory, so the refusal applies only when no named root carries one.

- `CHANGELOG.md:135` says "every note is refused until it is repaired".
- R-41-07 says "A host where the home directory cannot be determined refuses every note".
- Workflow 16 line 65 says an undeterminable home "stops the order ... every admission is refused".

On Claude Code, which sets `CLAUDE_PROJECT_DIR` for every Bash call, none of these holds for a configured repository. The 41-17 disposition row draws this distinction for the above-`HOME` case, but these sentences do not. The error runs in the safe direction: more is said to be refused than is.

**Fix:** Qualify each sentence with "when no named root carries a factory configuration".

### IN-15: The root refusal and its stop name a cause narrower than the code's, and the refusal is labelled `trustedRepoRoot` when `governanceRootOf` throws it

**File:** `scripts/context-io.ts:5466-5472`, `scripts/context-io.ts:3659-3667`, `agent-factory/workflows/16-context-read-write.md:51`

**Issue:** `occupied` and `refuseUnlessAbsent` throw `undeterminedRoot` from `projectRootFromWorkingDirectory`. That function is also reached through `governanceRootOf`, from `actionOwnerRoot` (the ledger-owner default of `appendNote` and `admitAndAppend`) and from `originIsTrusted` in `promoteAdmitted`. There the message says `context-io.trustedRepoRoot: refusing to name a governance root ... The human_admission dial is UNKNOWN`, even when the dial root was read and the failed read was under a different store's anchor. The stop at line 51 tells the role "A human repairs `HOME` or the working directory". But the causes in code also include any failed read on the walk, such as a dangling `.grugops` link, an `EACCES` directory, or a non-directory where a candidate's parent should be. The 41-14 disposition row already asks a human to check whether those two causes are enough. This is from reading the code, not reproduced.

**Fix:** Pass the asking function into `undeterminedRoot`, or word it as "the governance root ladder", and include the path that failed. Change the stop to "A human repairs `HOME`, the working directory, or the path the refusal names."

### IN-09: The `index.md` banner on a host names a program no host has (carried forward)

**File:** `scripts/context-io.ts:4818`

**Issue:** Unchanged. The banner still reads `Re-run: node scripts/context-io.js render <task>`.
**Fix:** As before.

### IN-10: A body that opens with two dashes stops the role (carried forward)

**File:** `agent-factory/workflows/16-context-read-write.md:31`

**Issue:** Unchanged. Step 3 still mentions `--body-file` only for a long body.
**Fix:** As before.

### IN-13: Workflow 16 does not carry WR-01's exit 1 fix to `note.js` (carried forward)

**File:** `agent-factory/workflows/16-context-read-write.md:31`

**Issue:** Unchanged. Step 3 has no "Exit 1 without that line is a genuine failure" clause.
**Fix:** As before.

---

_Reviewed: 2026-11-08T18:26:21Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
