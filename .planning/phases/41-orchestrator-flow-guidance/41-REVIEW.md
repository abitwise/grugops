---
phase: 41-orchestrator-flow-guidance
reviewed: 2026-11-05T15:15:02Z
depth: standard
files_reviewed: 45
files_reviewed_list:
  - CHANGELOG.md
  - agent-factory/config/factory.config.md
  - agent-factory/packaging/subagent.frontmatter.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/17-task-claim.md
  - docs/audit/41-residuals.md
  - install/README.md
  - install/install.test.ts
  - install/install.ts
  - install/installer-cross-version.test.ts
  - install/installer-never-installed.test.ts
  - install/installer-special-files.test.ts
  - install/installer-user-edit.test.ts
  - install/ledger-provenance.test.ts
  - install/record-truth.test.ts
  - install/uninstall-removal.test.ts
  - install/uninstall.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/chrome-lane-bar.test.ts
  - scripts/claim.test.ts
  - scripts/claim.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.test.ts
  - scripts/fault-inject.test-support.ts
  - scripts/flow-guidance-text.test.ts
  - scripts/generate-role-adapters.ts
  - scripts/generate-runnable-embeds.test.ts
  - scripts/generate-runnable-embeds.ts
  - scripts/runnable-ref/claim-read-sites.test.ts
  - scripts/runnable-ref/claim.test.ts
  - scripts/runnable-ref/claim.ts
  - scripts/runnable-ref/note-read-sites.test.ts
  - scripts/runnable-ref/note.test.ts
  - scripts/runnable-ref/note.ts
  - scripts/runnable-ref/read-sites.test.ts
  - scripts/runnable-ref/role-route.test.ts
  - scripts/runnable-ref/runnable-exit-contract.test.ts
  - scripts/runnable-ref/state-check.test.ts
  - scripts/runnable-ref/state-check.ts
  - scripts/runnable-ref/state-roll.ts
  - scripts/runnable-ref/trace-render.ts
  - scripts/tier-kit-text.test.ts
findings:
  critical: 2
  warning: 9
  info: 11
  total: 22
status: issues_found
---

# Phase 41: Code Review Report

**Reviewed:** 2026-11-05T15:15:02Z
**Depth:** standard
**Files Reviewed:** 45
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I reviewed the changes since `324bd965`: the new host note writer `scripts/runnable-ref/note.ts` (its hand-written part, and the generated region only where that part relies on it), the sweep and render changes in `scripts/claim.ts`, the row-sibling rule in `scripts/generate-runnable-embeds.ts`, the kit text, the installers and the changed tests.

`note.js` gives a spawned role a route to a sealed note, and the exit contract, the argument parsing and the field guards held up. The main concerns are what that route now exposes and what it leaves out:

- **CR-02:** `--supersedes` lets any role retire a human-disposed security finding with an unstamped note, under `human_admission: all`.
- **CR-03:** no scripted host can write a green gate verdict, so a `§14-gate#<id>` finding and every `artifact-ref` are refused on every host, while the text describes that as the workhorse path.
- **WR-09:** an I/O failure in the writer prints `refused`, exit 1, which tells the role to change a note that has nothing wrong with it.
- **WR-10:** a link on `.grugops/audit` sends the audit ledger outside the repository, exit 0.
- **WR-11:** Workflow 17 says a later sweep clears a row with an empty `by`. For a stray file or an unsafe name it never does.

**How findings were checked.** Findings marked "Reproduced" were run against scratch copies of the committed `scripts/runnable-ref/note.js` and `claim.js`, in a temporary repository that is now removed. The rest come from reading the code and text. No test suite was run.

**Earlier findings.** Ids stay stable so the disposition ledger keeps its decisions: WR-05 to WR-08 and IN-02 to IN-07 keep their ids and titles, and each was re-checked at this head and still stands. New findings start at CR-02, WR-09 and IN-09.

- **CR-01 is not re-reported.** Its static claim no longer holds: `tools/grugops/note.js` is a route, and `role-route.test.ts` runs it from the kit text. The live run is still owed, and R-41-01 tracks it. CR-01's ledger row should stay open until that run, because this review shows the route exists on paper and nothing about a host's permission model.
- **WR-01, WR-02, WR-03, IN-01 and IN-08** read as fixed. **WR-04** is fixed for claim directories; WR-11 is the part that remains.

Known items T-41-55, T-41-30, T-41-43, T-41-20 and the false `note.ts` header sentence are not repeated here.

**No findings** in `install/install.ts`, `install/uninstall.ts`, `scripts/generate-role-adapters.ts`, the `realpathSync.native` handling in `scripts/fault-inject.test-support.ts`, or the sibling rule in `scripts/generate-runnable-embeds.ts`. The changed test files show no weakened assertion. The moved pins each carry a measured reason.

## Critical Issues

### CR-02: Any role can retire a human-disposed security finding with an unstamped note, under `human_admission: all`

**File:** `scripts/runnable-ref/note.ts:2682`, `agent-factory/workflows/16-context-read-write.md:31`, authority in `scripts/context-io.ts` (`admit()`, `currentState`)

**Issue:** Reproduced. In a repository with `human_admission: all` and `audit_retention: retained`, I seeded a sealed `finding` by `security-nfr`, stamped `human:olger`. Then:

```
node tools/grugops/note.js add t1 --kind claim --by software-engineer --confidence low \
  --supersedes <the finding's id> --body "nothing to see"
```

This ended `noted`, exit 0. `index.md` `## Current state` then held only the new `claim`, and the security finding moved to `## Superseded (history)`.

`admit()` never reads `supersedes`, and `currentState` drops any note a later note names. So:

- The dial guards writing a high-severity finding, while removing one from the current state needs no stamp and no human. The per-call hook does not help either, because `isGatedNote` gates only `finding` notes.
- `--supersedes` also retires a green `§14-gate` verdict, because `isLiveGreenVerdict` reads `currentState`. Later gate-stamped findings for that run are then refused.
- A target that does not exist is accepted: `--supersedes nosuchid` ended `noted`.

This does not need a hostile agent. Workflow 18 and `context-note.md` name supersession as the honest way to update a note, so a role that believes it fixed a security finding can do this in good faith.

The hole exists in the authority, but `propose_note` reached it only through the Orchestrator. `note.js` hands it to every spawned role on every host. It is the same class as T-41-30 and T-41-55, which the register holds at high: a routine role gets past what the dial protects. The history section and the ledger line keep it detectable, so this is a loss of the control and not of the record.

**Fix:** Decide it in `admit()` in `scripts/context-io.ts`, then regenerate. `note.ts` must stay free of predicates.

```ts
const target = (scalars.supersedes ?? "").trim();
if (target !== "") {
  const prior = readContext(task, contextRoot).find((n) => n.id === target);
  if (prior === undefined) {
    return [`admission FAIL: supersedes "${target}" names no note under task "${task}".`];
  }
  const isVerdict = prior.by === GATE_IDENTITY;
  const isGoverned = prior.kind === "finding" && isHighSeverityRole(prior.by) && gov.human_admission !== "off";
  if (isVerdict || isGoverned) {
    return [`admission REFUSED: note "${target}" may be superseded only through a human disposition.`];
  }
}
```

Check Workflow 18's promotion routes against this before it lands, because they carry `supersedes` too. Add the case to `note.test.ts`, and add a residual if a human accepts a narrower rule.

### CR-03: No scripted host can write a green gate verdict, so `§14-gate#<id>` findings and every `artifact-ref` are refused on every host

**File:** `agent-factory/workflows/16-context-read-write.md:31`, `agent-factory/workflows/16-context-read-write.md:37`, `agent-factory/workflows/16-context-read-write.md:41`, `agent-factory/workflows/17-task-claim.md:62`, `scripts/runnable-ref/note.ts:7-8`, `scripts/runnable-ref/note.test.ts:267`

**Issue:** Reproduced. Workflow 16 step 3 now says to write a note "on every host" with `note.js`, and Workflow 17 step 6 says the writer of an `artifact-ref` is `note.js`. Both are admitted only against a live green verdict, and a verdict comes only from `emitVerdict`. Workflow 05 runs that as `node scripts/context-io.js emit-verdict`.

- A host has no `scripts/context-io.js`. `RUNNABLES` in `install/install.ts:6044` does not carry it, the kit home holds only `agent-factory/`, and running that command on a host copy gave `MODULE_NOT_FOUND`, exit 1.
- `note.js` has no verdict verb, and a `by: §14-gate` note is refused, rightly.
- So the route Workflow 16 line 41 calls "the workhorse path" can never succeed on a scripted host. `--sha`, `--gate-run` and `--content-hash` are flags that cannot produce an admitted note there.
- Step 4's first honest route, "Run or fix the §14 gate to earn the real `§14-gate#<id>` stamp", sends a role into the `self_fix_attempts` loop for a stamp that cannot exist, and Workflow 05 itself stops at its emission step.
- The test hides this in the way CR-01 described. `note.test.ts:267` stages the verdict with the kit's own `context-io.js`, and `role-route.test.ts` only exercises an `observation`.

This fails closed: nothing false enters the context, and a task can still close on a `claim` or `observation`. But it leaves a governed host with no gate-verified finding at all, so `human:<name>` is the only stamp left, and on this route that stamp is unbound (R-41-06).

**Fix:** This needs a human decision, because the plain fix has a cost. `scripts/chrome-lane-bar.test.ts` treats an embedded emitter as a real route to the machine stamp, and a host program any agent can run would let any agent mint a green verdict.

1. Ship a host verb for `emit-verdict`, and record as a residual that the verdict is then agent-mintable on a host.
2. Or keep the emitter off hosts and say so. State in Workflows 05, 16 and 17 that a scripted host has no gate stamp, that a gate-verifiable result there is a `claim` with `confidence: UNKNOWN - verify` or a `human:<name>` finding, and remove the "every host" reading from the `artifact-ref` text.

In either case add a host-copy test that uses no kit file, so the route is proved the way `role-route.test.ts` proves the note route.

## Warnings

### WR-05: `claim` accepts a subtask that `done` will refuse, and `done` exit 2 has no instruction

**File:** `scripts/claim.ts:245-262`, `scripts/runnable-ref/claim.ts:1345-1348`, `agent-factory/workflows/17-task-claim.md:64`

**Issue:** Reproduced again at this head. A pending file with no `ref:` line claimed with exit 0, and `done` then printed `Error: the subtask carries 0 ref: lines, not one.`, exit 2. Plan 41-11 added "Exit 1 without that line is a genuine failure" to step 7, but exit 2 is still unmentioned there and `## Stop conditions` covers `claim` exit 2 only. A role has no instruction, and the subtask must not be moved by hand.

**Fix:** In `claimPending`, read the pending entry with the same regular-file rule and run `subtaskRefFolder` before `takeClaim`, refusing with exit 2. Change step 7's sentence to "Any other exit, or exit 1 without that line, is a genuine failure: stop, surface it and leave the claim in place."

### WR-06: A re-queued subtask has no naming rule, and the natural name stops the Orchestrator

**File:** `agent-factory/workflows/17-task-claim.md:50`, `agent-factory/workflows/04-ticket-to-pr.md:55`, `scripts/claim.ts:256-258`

**Issue:** Step 1 now says a re-queued subtask "keeps the `ref:` of its per-task context" and still says nothing about its id. Workflow 04 steps 15 to 17 queue several later subtasks for one ticket, and step 16 forbids re-pending a `done/` subtask. Reusing the ticket-shaped name meets `done/<task>.md already exists` at `claim`, which is exit 2 and a stop.

**Fix:** Add to step 1: "A re-queued subtask takes a new id, such as `abc-104-r2`." Point Workflow 04 step 16 at it.

### WR-07: `sweep` silently replaces an existing `pending/<task>.md`

**File:** `scripts/claim.ts:379`, `scripts/runnable-ref/claim.ts:303`

**Issue:** Reproduced again at this head. With `claimed/z/` stale and a newer `pending/z.md` naming `.grugops/context/NEW/`, `sweep` printed `reclaimed z`, and `pending/z.md` then held the old `ref: .grugops/context/OLD/`. Plan 41-10 widened this: the sweep now also reclaims claims with no usable record, so more entries reach this unguarded rename.

**Fix:** Check the destination first. When `pending/<task>.md` exists, keep it, leave the claimed copy in place and report the task instead of counting it as reclaimed.

### WR-08: A new sentence changes who the pronoun means, so `factory.config.md` says the Orchestrator makes the hand-back

**File:** `agent-factory/config/factory.config.md:222`

**Issue:** The `block` bullet still reads "The Orchestrator asks the human to approve or reject a `Fundamental:` proposal. On approval it hands the ticket back ... On rejection it applies the move the human names". Workflow 04 step 15 gives that move to the Tech Lead.

**Fix:** Write "On approval the Tech Lead hands the ticket back ...; on rejection the Tech Lead applies the move the human names ...".

### WR-09: An I/O failure in the writer prints `refused`, exit 1, and tells the role to change a sound note

**File:** `scripts/runnable-ref/note.ts:2740-2742`, `scripts/runnable-ref/note.ts:2775-2779`, `scripts/runnable-ref/note.ts:16-17`, `agent-factory/workflows/16-context-read-write.md:31`

**Issue:** Reproduced twice. `isWriterRefusal` treats every message that starts with `context-io` as the writer's decision. Plenty of those are filesystem faults:

- With a FIFO at `.grugops/audit/admissions.jsonl` under `retained`, the run printed `refused t2: context-io.appendNote: refusing to write — the admission could not be decided or could not be recorded...`, exit 1.
- With `linkSync` failing EIO, the run printed `refused t3: context-io.publishNoteExclusive: refusing to publish (EIO)...`, exit 1. That message's own text covers a filesystem without hard links, where every note on that disk would be refused this way.

The header says exit 1 means "The writer decided this, so the note must change", and Workflow 16 sends the role to step 4 for it. Nothing about the note is wrong, so a role will spend `self_fix_attempts`, or degrade an honest finding to a `claim`, which also fails. The contract's own class for this is exit 2.

The second case also breaks "nothing was written". Under `retained` the ledger went from 1 line to 2 while no note was published, so a GOV-02 record stands for a note that does not exist, and stdout says otherwise. The ledger-first order is an accepted residual for a lost race (`appendNote`'s comment); it is not accepted for a printed denial.

**Fix:** Stop matching a prefix. Give the writer a typed refusal in `scripts/context-io.ts`, for the validate, `admit()` findings and size-ceiling refusals only, and test `instanceof` in `note.ts`. The unrecordable-admission and publish failures then reach `throw e`, exit 2, under the existing `noteStands` line. Until then, exclude them by the embedded constant:

```ts
return e instanceof Error && e.message.startsWith("context-io")
  && !e.message.startsWith("context-io.publishNoteExclusive")
  && !e.message.includes(UNRECORDABLE_ADMISSION_REFUSAL);
```

Add both cases to `note.test.ts`, which has no case for a write-side fault.

### WR-10: A link on `.grugops/audit` sends the audit ledger outside the repository, exit 0

**File:** `scripts/runnable-ref/note.ts:2732-2738`, `scripts/runnable-ref/note.ts:2766`, `scripts/runnable-ref/note.ts:10-11`, `scripts/runnable-ref/note.ts:34-39`

**Issue:** Reproduced. With `audit_retention: retained` and `.grugops/audit` a symbolic link to a directory outside the repository, `note.js add` printed `noted`, exit 0, and `admissions.jsonl` appeared in the outside directory. The repository's own trail got no line. `appendAuditLedger` runs `mkdirSync` and an append that follows links, and the hand-written root check asks `rootChainPresence` about the path to `notes/` only.

The header says the program writes only under `.grugops/context/` and to the ledger, and "THE ROOT IS A BOUNDARY". T-41-33 covers notes and not this write. Any agent that can make a link can route GOV-02 records away from the repository with no message.

**Fix:** In `runAdd`, ask the root-chain owner about the ledger path before the write, so a link there is exit 2 with nothing written:

```ts
refuseUnusableStore(root, `${GRUGOPS_DIR_REL}/audit`);
```

A link at the file itself needs `leaf: "entry"` on `.grugops/audit/admissions.jsonl`, refused when `presence.entry.isSymbolicLink()`. Add a case beside the T-41-33 link cases.

### WR-11: Workflow 17 says a later sweep reclaims a row with an empty `by`, but a stray file or an unsafe name is never reclaimed

**File:** `agent-factory/workflows/17-task-claim.md:86`, `scripts/claim.ts:359-365`, `scripts/claim.ts:416-420`

**Issue:** Reproduced. With a stray file `claimed/stray` and a directory `claimed/bad+name`, both dated 2020, `sweep` printed `swept 0`, `free` read 1 instead of 3, and both stayed as rows with an empty `by`. `claimed/stray` and `claimed/bad+name` hold those slots permanently.

The code means this: `scripts/runnable-ref/claim.test.ts` asserts "What stays: the live claim, a stray file and a name the sweep never joins." Yet Session start step 3 tells the Orchestrator "Leave a row with an empty `by`: it names no adapter, and a later sweep reclaims it." So the Orchestrator waits for something that never happens, while step 7's "Never move a subtask by hand" leaves no way out. This is the remainder of WR-04: the count and the table now agree, and the slot is still lost.

**Fix:** Correct the sentence and give the case an owner: "A row with an empty `by` and a directory holding no record clears at a later sweep. A stray file or an unsafe name never clears: stop and name it, so a human removes it." Better still, have `sweep` print each entry it cannot judge, so the session sees it.

### WR-12: Workflows 16 and 17 name a read route no role on a host can run, and the full note text is only in the unfiltered `notes/` folder

**File:** `agent-factory/workflows/16-context-read-write.md:19`, `agent-factory/workflows/16-context-read-write.md:27`, `agent-factory/workflows/17-task-claim.md:60`, `scripts/runnable-ref/note.ts:1921-1923`

**Issue:** Step 1 of Workflow 16 and step 5 of Workflow 17 say to read through `context-io.ts` (`readContext` / `render`). Plan 41-07 shipped the write half only: a host has no `scripts/context-io.js`, and `note.js` has one verb, `add`. The write text was updated and the read text was not.

A role therefore falls back on one of two files:

- `index.md` holds only the first line of each body (`bodyExcerpt`), and `index.jsonl` holds no body. Workflow 04 depends on lines further down, such as `To:`, `Cause-id:` and `Approved:`, so neither file is enough.
- `notes/*.md` has the full text, and this is the view the seal filter does not cover. A hand-written note there reads exactly like a sealed one. I planted one by `security-nfr` stamped `human:eve`: only the `## Skipped entries` section of `index.md` tells them apart, and nothing tells a role to read it.

So T-41-18's control holds for `done` and for `render`, and it does not hold for what a role reads on a host.

**Fix:** Add a read verb to `note.js`, for example `read FOLDER`, printing each sealed note in `currentState` order through the embedded walk, and point both steps at it. Otherwise state the rule in step 1: read `index.md` first, open only the notes its `## Current state` lists, and treat anything under `## Skipped entries` as not a note.

### WR-13: Under an active dial, a spawned high-severity role has no route to admit a finding, even with a real human answer

**File:** `agent-factory/workflows/16-context-read-write.md:32`, `agent-factory/workflows/16-context-read-write.md:43`, `agent-factory/workflows/16-context-read-write.md:49`, `scripts/runnable-ref/note.ts:24-26`

**Issue:** `admit()` refuses every `finding` by `security-nfr`, `architect-design` or `release-manager` when `human_admission` is not `off`, including one carrying a true `human:<name>` stamp. The refusal says the admission is granted "through the hook". `note.js` runs outside the hook, a spawned role does not hold `propose_note`, and the other five hosts have no hook.

Workflow 16 tells such a role to "escalate to a named human (`human:<name>`)", and the text stops there. After the human says yes, nothing says who writes the finding, under what `by`, or by which tool. The Orchestrator is the only holder of the tool on a plugin install, but `## Hard limits` says it never does a task's work, and no text tells it to author a note as `security-nfr`. On a host with no hook the finding cannot be admitted at all.

The role then degrades a confirmed security finding to a `claim`, which Workflow 16 calls "explicitly non-load-bearing". That is the strictest dial producing the weakest record, exactly where the user asked for more.

**Fix:** Name the route in Workflow 16 step 4. On Claude Code: the role stops and publishes a `claim`, the Orchestrator asks the human, and the Orchestrator calls `propose_note` with the role's `by` under the human's grant. Elsewhere: state that a high-severity finding is not admissible under an active dial, and what the record is instead. R-41-06 should name this as well, since it now covers the stamp only.

## Info

### IN-02: `--level` is not tied to the adapter

**File:** `scripts/claim.ts:248-253`

**Issue:** Reproduced again. `claim c --by grugops-software-engineer-junior --level senior` exited 0.
**Fix:** When `by` ends in `-junior`, `-mid` or `-senior`, require `--level` to match it, and refuse `--level` otherwise.

### IN-03: The `not-done` line is silent about sealed notes older than the claim

**File:** `scripts/runnable-ref/claim.ts:1306-1314`, `scripts/claim.ts:499-503`

**Issue:** The line says "no sealed note" while the folder may hold older sealed notes, as a re-queued task's folder always does.
**Fix:** Add `; N sealed note(s) predate the claim` to the line.

### IN-04: Three descriptions of the subtask file disagree

**File:** `agent-factory/roles/orchestrator.md:32`, `agent-factory/workflows/17-task-claim.md:50`, `scripts/claim.ts:8-9`

**Issue:** The role says "holding only a `ref:`", Workflow 17 says exactly two lines, and the `claim.ts` header still says "self-contained" with what-to-do and the originating ticket.
**Fix:** Have the role point at Workflow 17 step 1, and update the header.

### IN-05: The role-switch step lost its condition

**File:** `agent-factory/roles/_role-switch-protocol.md:24-25`

**Issue:** "Run `node tools/grugops/claim.js done <task>` once its notes are published" reads as unconditional, while the protocol also covers roles activated with no queued task.
**Fix:** Start the line with "When the work was queued".

### IN-06: The render banner names a path that does not exist in the kit repository

**File:** `scripts/claim.ts:645`, `scripts/now-running-freshness.ts:154`

**Issue:** The shared render prints `node tools/grugops/claim.js now-running`, and the freshness gate still says `node scripts/claim.js now-running`.
**Fix:** Keep the host path in the banner, and name the difference in the gate's message.

### IN-07: The render is no longer single-writer

**File:** `scripts/claim.ts:508`, `scripts/runnable-ref/claim.ts:13`

**Issue:** The `atomicWrite` comment calls `now-running.md` single-writer, and the host header says the log "cannot go stale between steps". Parallel agents each run `done`, so two renders can overlap. `index.md` now has the same shape when two `note.js add` runs share a folder.
**Fix:** Correct both comments. Workflow 17 already treats the disk count as the truth.

### IN-09: The `index.md` banner on a host names a program no host has

**File:** `scripts/context-io.ts:4767`, `scripts/runnable-ref/note.ts:1965`

**Issue:** Reproduced. Every `index.md` written by `note.js` opens with `Re-run: node scripts/context-io.js render <task>`, which fails on a host with `MODULE_NOT_FOUND`. A role that follows it meets WR-12's gap.
**Fix:** Say what is true on both, for example "Rendered by the note writer; do not hand-edit."

### IN-10: A body that opens with two dashes stops the role

**File:** `scripts/runnable-ref/note.ts:2630`, `agent-factory/workflows/16-context-read-write.md:31`

**Issue:** `--body "-- ..."` or a markdown `---` is exit 2. The message says to use a file, but Workflow 16 says any exit other than 0 and 1 is a genuine failure: stop and surface it. A role following the text stops on an ordinary note, and the `--body-file` sentence in step 3 mentions only length.
**Fix:** In step 3, write "Pass `--body-file <path>` in place of `--body` for a long body, or one that opens with `--`."

### IN-11: The README says `note.js` applies the same admission rules as the kit

**File:** `install/README.md:459-460`

**Issue:** "through the same writer and admission rules as the kit" is true of the in-script tier only. The hook tier does not apply, so under `human_admission: all` a routine role's `human:<name>` stamp is unbound (R-41-06). A reader setting that dial would take this line to mean otherwise. T-41-40 and T-41-50 fixed the same overstatement in Workflows 04 and 16.
**Fix:** Write "through the same writer and the in-script admission tier; it runs outside the Claude Code hook."

### IN-12: Two comments no longer match the code

**File:** `scripts/claim.ts:417`, `scripts/runnable-ref/state-check.ts:80`

**Issue:** `claim.ts:417` says `free` and the log "cannot disagree", while line 602 of the same file and the "but for the tampered record" test say a tampered record is counted with no row. The SIBLINGS comment in `state-check.ts` lists four programs, and `RUNNABLE_SET` holds five.
**Fix:** Add "but for a tampered record" at line 417, and name `note.js` in the header.

### IN-13: Workflow 16 does not carry WR-01's exit 1 fix to `note.js`

**File:** `agent-factory/workflows/16-context-read-write.md:31`

**Issue:** Workflow 17 now reads exit 1 by its line for `claim` and `done`. Workflow 16 says "Exit 1 prints `refused <folder>: <reason>`" with no such clause, so Node's own exit 1 on a damaged program sends a role to read a reason that was never printed.
**Fix:** Add "Exit 1 without that line is a genuine failure."

---

_Reviewed: 2026-11-05T15:15:02Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
