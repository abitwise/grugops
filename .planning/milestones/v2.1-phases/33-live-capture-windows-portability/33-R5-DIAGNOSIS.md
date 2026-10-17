# 33.1-15 DIAGNOSIS: why the round-5 live capture reads `OUTCOME: fail`, from the committed artifacts

Plan 33.1-15, Task 3 (fail branch, D-12). This note is in clear professional voice because it bears on
a safety record: it covers the pinned permission mode and the single-writer route into the shared context.

**Token spend for this note: zero.** There was no second run and no `claude -p` call. Every fact below
comes from one of these sources:

- the two committed transcripts and the runner's summary (commit `b35d4aed`);
- the held round-4 set under `round-4-held/`, for comparison;
- the repository at `7bb21b0d` (`install/install.ts`, the adapter files under `.claude/agents/`,
  `agent-factory/workflows/17-task-claim.md` and `16-context-read-write.md`);
- read-only listings of the kept kit home and target, taken before they were removed by hand;
- the one `claude plugin list` the plan names, which is a local listing and makes no model call.

Nothing was fixed, nothing was re-run, and the transcripts were not edited (D-12). A second go needs a
new human decision.

The subject is the run recorded in `33-CAPTURE-SUMMARY.md`, `33-CAPTURE-A.jsonl` and
`33-CAPTURE-B.jsonl` (commit `b35d4aed`, checkout `7bb21b0d736aa7b8fbbf3ad53f1eefcbb678f310`, platform
`2.1.283 (Claude Code)`). `A:<n>` and `B:<n>` are 1-based line numbers in those transcripts, the same
numbers the runner's `jsonl:<n>` citations use. `R4-A:<n>` and `R4-B:<n>` are line numbers in
`round-4-held/33-CAPTURE-A.jsonl` and `round-4-held/33-CAPTURE-B.jsonl`.

---

## 0. The run table

| Field | Run A (no agent flag) | Run B (`--agent grugops-orchestrator`) | Round 4, for comparison |
|---|---|---|---|
| Exit | status 0, signal null, timed out false, wall 155 397 ms | status 0, signal null, timed out false, wall 128 902 ms | A 621 098 ms, B 436 179 ms, both status 0 |
| Bound | 1 200 000 ms per call, not reached | same | same bound, not reached |
| `permissionMode` in `system/init` | `default` (A:12) | `default` (B:12, and again at B:517) | `auto` (R4-A:12, R4-A:1056, R4-B:12) |
| Provenance before the spawn | MET: digest `8805be0e…25db` equals the checkout's; registry `gitCommitSha` `7bb21b0d…` | MET, same digest and sha | MET (digest `c56b5470…`) |
| Provenance after the run | MET (same digest) | MET | MET |
| Uninstall | exit 0 | exit 0 | exit 0 / exit 0 |
| `result` frames | A:594 `total_cost_usd` 1.1143862, 32 turns, `duration_ms` 153 061 | B:557 0.9541958, 28 turns, 93 208 ms; B:558 0.9541958, 3 turns, 24 907 ms (same `session_id`) | A 2.6734784 (runner-cited), B 1.7273906 |
| `system/permission_denied` frames | 7 (A:41, A:84, A:278, A:365, A:476, A:491, A:552) | 4 (B:29, B:265, B:384, B:451) | not counted in round 4 |
| Agent spawns of granted roles | 1: `grugops-brownfield-mapper` at A:344 | 2: `grugops-brownfield-mapper` at B:358, `grugops-security-nfr` at B:386 | A: coordinator-as-subagent plus nested roles; B: both sides held |
| CAP-03 (runner, D-02) | side (a): 1 distinct granted role with own-session evidence, 2 required; side (b): no note stamped by a granted role | side (b): no note stamped by a granted role (side (a) holds) | A: side (a) red (coordinator non-member, since exempted by D-33-R4-04); B: both sides held |
| Parity (D-07) | 3 named differences (§ 3) | | 5 named differences |

Total reported cost: 2.0685820 USD from the two runner-cited frames (A:594 plus B:557). B:558 repeats
B:557's value exactly after 3 more turns. Whether B's two result frames are cumulative is
`UNKNOWN - verify`. If they were additive, the total would be 3.0227778 USD.

---

## 1. Axis 1: CAP-03 side (b) on both paths. No role agent wrote a note

### 1.1 What the transcripts show

- Every note under the two context roots is stamped `orchestrator`: 2 on A and 3 on B (summary,
  "Target observations"). All five reached disk through `propose_note`, called by the main-thread
  coordinator (A:258, A:577, B:453, B:531, B:541).
- On both paths, every role agent stopped before it claimed its subtask, so none of them reached a
  note-writing step:
  - A's mapper tried `mkdir` for the WF17 claim twice. Both were denied with "This command requires
    approval" (A:465 → A:476/A:477 and A:480 → A:491/A:492). Its hand-back (A:524) says it would not
    fall back to a non-atomic `Write`-based claim, and it stopped.
  - B's mapper and security role each had their first Bash call denied, with `decision_reason_type`
    `asyncAgent` and the message "Permission prompts are not available in this context" (B:384,
    B:451). Both stopped without claiming (B:514; B's orchestrator notes at B:531 and B:541).
- The coordinator tried to find the claim and context scripts in the installed kit home, and found
  none: A:185 → A:190 "No files found"; B:169 → B:174 "No files found".

### 1.2 Cause class: KIT (the installed kit gives role agents no reachable write route), exposed by the SUITE's pinned mode

There are two halves, and the observation needs both.

**KIT half.** The copy-mode install ships only `agent-factory/` into the kit home (`install/install.ts`,
`KIT_ROOT = resolve(GRUGOPS_HOME, "agent-factory")`, line 155). The kept kit homes of this run held
`agent-factory/` and no `scripts/` directory. Yet WF17 names `scripts/claim.js` `claimTask` as the claim
mechanism (`17-task-claim.md` lines 26, 36, 38, 42, 44), and WF16 names `scripts/context-io.js` as
the only sanctioned writer (`16-context-read-write.md` line 11). The role adapters do not list
`propose_note`: `.claude/agents/grugops-brownfield-mapper.md` line 4 reads `tools: Read, Grep, Glob,
Edit, Write, Bash`, and `grugops-security-nfr.md` line 4 adds only `WebFetch, WebSearch`. So on this
install, a role agent has no granted tool that reaches the shared context:
- not `propose_note`, which is absent from the role adapters;
- not `node <kit>/scripts/context-io.js`, because the file is not at the kit root;
- not a plain `Write`, which WF16 forbids.

**SUITE half.** Round 4 hit the same absence and routed around it. Under `permissionMode: auto`, a
round-4 subagent used unrestricted Bash `find` to locate the plugin-cache copy at
`<home>/.claude/plugins/cache/grugops/grugops/2.1.0/scripts` (R4-A:173, R4-A:213) and then read
`claim.js` and `context-io.js` there (R4-A:233, R4-A:252, R4-A:272). This round pins
`--permission-mode default` with the grant `Bash(node *)` (D-33-R4-05, plan 33.1-13). Under that
pin, the discovery commands (`ls`, `test`, `find` in compound form: A:84, A:365, B:29) and the claim
fallback (`mkdir`: A:476, A:491, A:552) all need approval, and approval is unavailable in `-p` mode.
The pin measured what it was meant to measure: out-of-grant writes are denied. That same pin also
closes the only route round 4's role agents had into the context.

**What tells this class apart from the next one.** The deny is the platform correctly enforcing the
grant the runner passed, so this is not a HOST defect: A:12 and B:12 both report `permissionMode:
default`, as the argv requested. It is not model variance either, because every role agent on both
paths stopped at the same step (the claim), for the same reason (a denied or unavailable `mkdir`),
and cited the same WF17 stop condition. A model-variance cause would predict that some role agents on
some paths get through. None did.

### 1.3 Rider: B's role agents ran as async agents, and every Bash call was denied

B:384 and B:451 carry `decision_reason_type: "asyncAgent"`. The platform denied all Bash for those
subagents, not only out-of-grant commands, even though B:358 and B:386 do not set
`run_in_background`. B carries `system/background_tasks_changed` frames from B:363 onward. Whether
`--agent grugops-orchestrator` makes the coordinator's spawns asynchronous is `UNKNOWN - verify`. On
this evidence, a B-path role agent could not run even the granted `Bash(node *)`. So on path B, even a
shipped `context-io.js` would not have been reachable through Bash.

---

## 2. Axis 2: CAP-03 side (a) on path A. Only one granted role was spawned

### 2.1 What the transcript shows

A's coordinator spawned only `grugops-brownfield-mapper` (A:344, `run_in_background: false`), waited
for its hand-back (A:524), and then stopped the pipeline. Its failed-attempt note (A:577) records
"Per WF17 stop condition … the mapper stopped without mapping. All three subtasks remain in
`.grugops/queue/pending/`." The design and security subtasks were queued at A:300 and A:320, but
the coordinator never spawned them.

### 2.2 Cause class: downstream of axis 1 (KIT + SUITE); coordinator ordering is model-chosen

A's decision note (A:258) orders the work as mapper first, with the others after it ("others read its
notes"). When the first claim failed, the stop condition fired, so no second role was spawned. B's
coordinator launched both roles before either returned (B:358, B:386), which met the two-role bar for
side (a). The ordering is a model choice. The reason the ordering mattered is axis 1: had the mapper's
claim succeeded, A's documented plan would have spawned the next two roles. The D-33-R4-04 exemption
did not enter here, because no coordinator-as-subagent spawn occurred on either path.

---

## 3. Axes 3-5: D-07 parity

The runner named three differences:

| Axis | A | B | Class | Citation |
|---|---|---|---|---|
| orchestrator note count | 2 (decision, failed-attempt) | 3 (decision, failed-attempt ×2) | SUITE (model-chosen: B records one failed-attempt per stopped role; A stopped after one role) | A:258, A:577; B:453, B:531, B:541 |
| `propose_note` blocks | 2 | 3 | the same cause as the row above; one block per note | same |
| indirect write-shaped blocks naming the context root | 1 | 0 | SUITE (the axis counts issued blocks, not effects). A:267 is a compound `mkdir -p … ; printf … > .grugops/queue/pending/$id.md …; ls … .grugops/context/ARCH-AUDIT-001`. It names the context root only in its trailing `ls`. The platform denied it ("Contains expansion", A:278/A:279), so it wrote nothing | A:267, A:278 |

The same run shape (roles that could not write) produced all three. Direct writes into the context root
were 0 on both paths. The replay comparator's diff (task id `ARCH-AUDIT-001` against `arch-audit`) is
informational and does not enter the outcome word.

The round-4 values are shown beside this round's in § 0. Round 4 had 5 differences, driven by role
notes that the role agents wrote (architect-design, brownfield-mapper). This round has no role notes,
so its parity differences involve the coordinator only.

---

## 4. Observations that do not enter the outcome word

### 4.1 The permission-mode pin held as measured (D-11 (a))

- The init frames report `permissionMode: default` (A:12, B:12, B:517). This settles the
  `UNKNOWN - verify` that the 33.1-13 SUMMARY recorded for the operator's `defaultMode: "auto"`:
  the CLI flag overrode it on 2.1.283. Whether `default` is a stable alias, given that `--help` names
  `manual`, is still `UNKNOWN - verify`. On 2.1.283 it was accepted.
- No `Write` or `Edit` outside the target appears in either transcript. The permission-denied frames
  were all Bash calls, plus one `Skill` call (A:41, where the model tried the `grugops` skill, which is
  not in the grant).
- In-target `Write` calls ran under the scoped `Edit(//<target>/**)` rule (A:280, A:300, A:320;
  B:294, B:314, B:334), which matches the 33.1-13 in-target control.

### 4.2 The plugin list after the run

`claude plugin list` ran once at 2026-09-28T16:43:31Z and exited 0. It lists **no** `grugops@grugops`
row. The two stale `0.1.0` rows recorded in round 4 are absent, and this run left no row of its own.

---

## 5. What this note does not do, and the decisions it hands to the human

It does not fix, re-run, or edit a transcript (D-12). There are three decisions for the human. Each
one needs a new plan and a new go:

1. **KIT: role agents need a reachable write route on an installed kit.** Options: ship `scripts/claim.js`
   and `scripts/context-io.js` (with their import closure) into the kit home; grant `propose_note` to
   the role adapters; or point WF16/WF17 at `${CLAUDE_PLUGIN_ROOT}/scripts`. Each option changes
   an installer or adapter contract. That is why this note records the options and does not choose.
2. **SUITE: the grant and the WF17 claim protocol do not fit together.** The claim relies on an
   atomic `mkdir`, and the grant is `Bash(node *)`. A `node`-driven claim (`node <kit>/scripts/claim.js`)
   would fit inside the grant, but only if the script ships (decision 1).
3. **Platform: B's async role agents cannot use Bash at all under `-p` (B:384, B:451).** A path-B pass
   needs either a non-Bash write route (decision 1, the `propose_note` option) or a measured answer on
   how `--agent` spawns behave.

The GAP-D1 flip or hold is plan 33.1-16's decision. On this evidence nothing flips.
