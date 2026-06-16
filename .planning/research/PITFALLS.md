# Pitfalls Research

**Domain:** Decentralizing grugops (v2.0) — re-architecting a *portable, file-based markdown agent-factory kit* from a centralized Orchestrator + static handoff packets into a **decentralized multi-agent shared-verified-context system**: parallel agents (Claude Code primary) claim work from a file-based queue and build on one shared, verified, auditable, human-gated context that *replaces* handoffs. Zero-runtime-dep committed-`.js` TS tooling (Node 22+); the other four host CLIs degrade to sequential over the same files.
**Researched:** 2026-06-16
**Confidence:** HIGH on the concurrency primitives (Windows `rename` non-atomicity, `O_EXCL`/NFS, `mkdir` atomic claim, append atomicity — all re-verified June 2026), HIGH on Claude Code spawn limits (re-verified against `code.claude.com/docs/en/sub-agents`, June 2026: nested spawn since v2.1.172, fixed depth-5 background cap, **no documented global concurrent-subagent count cap**), HIGH on the grugops constraint set (PROJECT.md + STACK.md + FEATURES.md this session), MEDIUM where a mitigation is a *design choice* (queue layout, degraded-path equivalence test design) rather than a documented external fact.

> **Framing — read first.** These are pitfalls of **decentralizing a kit that ships no runtime**. grugops emits markdown (role text, workflow steps, a context-note schema, a queue convention) + a tiny zero-runtime-dep `node:fs`-only TS tooling layer (committed `.js`, Node 22+) + the `factory.config.json` dial. The new failure modes are about **concurrent file writes, stale reads, un-cheatable verification, token economy, deadlock-free claim, a degraded path that must not silently diverge, a scrambled audit trail, runaway spawn, a clean-cutover migration, and cross-platform atomicity** — realized in files and prose that some host agent executes. Each pitfall names the grugops hard-constraint it threatens and the **v2.0 phase (≥20)** that owns its mitigation. The v1.2 pitfalls (WR-05 regen, single-source drift, prompt bloat, dial regressions, voice drift, test-integrity loophole) **still apply** and are carried forward in the *Inherited pitfalls* table — they are NOT re-derived here; this file is the **decentralization-specific** layer on top.
>
> **Phase numbering:** v1.x ended at Phase 19. v2.0 phases start at **20**. The phase names below are *themes* (the roadmapper assigns final numbers); the ordering rationale at the bottom is the load-bearing recommendation. The single highest-order constraint: **the cross-cutting guards (atomic-write helper, verify-stamp validator, concurrency cap, degraded-path oracle) must be built and mechanized in the FOUNDATION phase BEFORE roles start writing to the shared context** — exactly as v1.2 front-loaded its foundation guards before the capability phases.

---

## Critical Pitfalls

### Pitfall 1: Race conditions on shared-context writes — lost updates, interleaved appends, two parallel agents clobbering the same note/file

**What goes wrong:**
Two background subagents finish near-simultaneously and both write the shared context. Three concrete corruptions: (a) **lost update** — agent A reads `<task>.md`, agent B reads the same snapshot, both append in memory and `writeFileSync` the whole file; the second write erases the first's note. (b) **Interleaved append** — both `appendFileSync` a multi-KB markdown body; the OS splits the large writes and the two notes interleave at byte granularity into garbage. (c) **Torn read** — a reader `Read`s `<task>.md` mid-write and sees a half-written note (no `kind`, no provenance fence), then *acts on it*. The shared context — the **sole** inter-role memory after handoffs are removed — silently corrupts, and because it's the memory, the corruption propagates to every downstream agent.

**Why it happens:**
Markdown cannot enforce atomicity; the naive instinct is "the agent just Writes the file." Read-modify-write of a whole file is the default LLM pattern and is the classic lost-update race. `appendFileSync` *looks* concurrency-safe but only guarantees atomicity for a single `write(2)` of a line **≤ `PIPE_BUF`** (POSIX-minimum 512 bytes; Linux 4096) — a prose note blows past that. Under v1.x there was exactly one writer (sequential), so this hazard never existed; parallelism on Claude Code creates it for the first time.

**How to avoid:**
- **Make `atomicWrite()` and `appendNote()` the ONLY sanctioned write paths**, shipped as committed-`.js` helpers (per STACK.md). `atomicWrite` = write to `path + '.tmp.<pid>.<rand>'` then `renameSync` over the target (atomic-replace on POSIX). No role/workflow text may instruct a raw `writeFileSync`/`Write` of a context file.
- **Split prose from metadata to dodge the append-size limit:** the long human-readable note body is published as its own `atomicWrite`-replaced markdown (single-writer-per-note-file or rename-publish), and only a **small JSONL metadata line** (well under 512 bytes — the POSIX `PIPE_BUF` floor) is `appendFileSync`-ed to the per-task `events.jsonl`. Treat append-atomicity as an *optimization*, not a correctness dependency — STACK.md's recommended safe default is to `atomicWrite` the JSONL too and drop reliance on append atomicity entirely.
- **One note = one section with a unique label; last-verified-write-wins on a label, append-only history below** (the blackboard per-key / LangGraph-reducer analog from FEATURES.md). Never whole-file read-modify-write of the shared narrative.
- **Mechanical guard (foundation phase):** a grep guard (same shape as `guard_wr05`) over the shipped role/workflow text that fails red if any context write goes through raw `writeFileSync`/`Write` instead of `atomicWrite`/`appendNote`. This makes "atomic-only" mechanical, not a hope.
- **Dogfood assertion:** the Tier-2 headless E2E harness spawns N background subagents that each must write a distinct verified note, then asserts **N distinct notes survive, zero clobbered, zero torn** — this is the empirical proof the primitive holds under real concurrency.

**Warning signs:**
A role/workflow that says "Write the context file" without naming `atomicWrite`/`appendNote`; an `appendFileSync` of a multi-line/multi-KB body; a context file whose note count is less than the number of agents that claimed work; a note with a missing/garbled provenance fence; the Tier-2 harness producing fewer notes than spawned agents.

**Phase to address:**
**Phase 20 — Shared-Context Substrate & Concurrency Foundation** (build `atomicWrite`/`appendNote`/the grep guard *first*, before any role writes). Threatens **no-fabrication / trace-is-the-proof** (a corrupted memory is a lying trace) and **zero-runtime-dep** (the primitive must stay `node:fs`-only).

---

### Pitfall 2: Stale-context reads — an agent acts on a snapshot another agent has already superseded

**What goes wrong:**
Read-before-act is necessary but **not sufficient** under true parallelism. Agent A reads the shared context at dispatch (DeLM's "lock-free snapshot at dispatch time"), sees `[claim] AUTH-09: token TTL is 60m`, and spends its whole run building on it. Meanwhile agent B verifies and publishes `[finding] AUTH-12: TTL is 15m, supersedes AUTH-09`. A never re-reads; it ships work grounded in a fact that was already retracted. The decentralized win (agents build on each other's *checkpointed* progress) inverts into agents building on each other's *stale* progress. Worse: A may publish a *new* verified note that silently contradicts B's, and now the context holds two mutually-exclusive "verified" findings with no reconciliation.

**Why it happens:**
DeLM's own model is dispatch-time snapshots — later commits are visible only on the *next* snapshot, by design. Parallel agents have long-running contexts; a snapshot read once at the start goes stale over a multi-minute run. Markdown has no change-notification; there's no watcher (and a watcher daemon is forbidden — Out of Scope). The `claim`-vs-`finding` distinction exists precisely because a `claim` is retractable, but nothing forces a downstream agent to *notice* a supersession.

**How to avoid:**
- **Rely on `finding` (verified, durable), not `claim` (snapshot-volatile), for cross-agent dependencies.** A `claim` must never be the basis of another agent's irreversible work — the note schema already encodes this (STACK.md: a `claim` "cannot be relied on by a downstream role until promoted to `finding`"). Make this a workflow rule, not just a schema comment.
- **`supersedes` is a first-class, mandatory field.** When a note retracts/replaces another, it carries `supersedes: <label>`; a **re-read-before-publish** step (read the context fresh immediately before the verify-and-write, not just at dispatch) checks whether anything it depended on was superseded since dispatch. If so → re-verify against the current context before publishing. This is the file-based analog of an optimistic-concurrency version check.
- **Decompose to minimize shared mutable state** (the blackboard "different keys run concurrently" rule + Anthropic's "self-contained subtasks" guidance from FEATURES.md): the Orchestrator-as-decomposer should carve subtasks so parallel agents touch *different* context keys/files wherever possible — interdependent subtasks are exactly where Anthropic warns multi-agent coding is weakest, so sequence them, don't parallelize them.
- **Human gate as the global-coherence backstop** (FEATURES.md): for high-severity contradictory findings, the named-human admission step is where two "verified" notes get reconciled — coherence the autonomous DeLM design has no answer for.
- **Degraded sequential path is immune** (this is a feature): one writer at a time → no staleness. Document that the parallel path carries this risk and the sequential path does not — relevant to Pitfall 6's equivalence story.

**Warning signs:**
A role acting on a `claim`-tagged note as if it were a `finding`; two `finding` notes on the same subject with no `supersedes` linking them; an agent's output referencing a fact that a later note retracted; no "re-read before publish" step in the write-after-verify workflow; dogfood runs where parallel agents produce contradictory verified findings.

**Phase to address:**
**Phase 20 — Shared-Context Substrate** (the `claim`/`finding`/`supersedes` schema + re-read-before-publish rule) and **Phase 23 — Parallel Execution & Orchestrator-as-Decomposer** (decompose to minimize shared mutable state). Threatens **no-fabrication** (acting on retracted facts is a fabricated basis).

---

### Pitfall 3: Verification gaps — unverified claims leaking into the shared context (the differentiator collapses if the verifier is bypassable)

**What goes wrong:**
grugops's *entire* differentiation over DeLM (FEATURES.md) is that "verified" means **passed the §14 behavior gate + human-gated + auditable**, not merely "grounded in a source." That collapses the instant an agent can write a `finding` *without* a real `verified_by` stamp — by self-authoring the stamp ("verified_by: me"), by writing a `finding` that should be a `claim`, by citing a gate run that never happened, or by a downstream role treating a low-bar `claim`/`observation` as if it were a verified `finding`. If the verify-before-write admission control is prose-only ("agents should verify before writing"), an agent under pressure to close a task will talk itself past it — exactly the v1.2 test-integrity-loophole failure, now applied to the memory substrate itself. A blackboard that admits unverified writes is "context pollution = cascading failure," the #1 documented multi-agent failure mode (FEATURES.md).

**Why it happens:**
Self-grading is the cheapest path to "done." DeLM's verifier only checks *grounding* (verbatim string-match) + a cheap-LLM hallucination pass — it does NOT check correctness and has **no human gate and no audit** (verified from the paper, FEATURES.md); copying DeLM's bar would silently forfeit grugops's wedge. Verification-as-prose is unenforceable; an LLM will assert it verified.

**How to avoid:**
- **`finding` admission is mechanical, mirroring the prod-deploy hook's refuse-self-set + the v1.2 test-integrity carve-out.** A `finding` REQUIRES a `verified_by` stamp that is a *real, checkable artifact* — a §14 gate verdict ID, a passing test reference, or a named human sign-off — **never the writing agent's own assertion**. The structure validator (committed `.js`) treats a `finding` with a missing, self-authored, or unresolvable `verified_by` as a **structural failure**, not a silent pass (STACK.md). This is "verify-before-write IS the §14 gate," realized as un-cheatable admission control.
- **`verified_by: self` / `verified_by: <the-writing-agent>` is rejected by construction** — the same inversion as the prod-deploy hook ("refuses self-set approval"). The verifier and the verified must be different principals: a gate run, a test, or a human.
- **Keep the `claim` escape hatch honest, not abusable:** unverifiable statements are allowed *as `claim`/`UNKNOWN - verify`* (the no-fabrication floor), but a `claim` can never satisfy a downstream dependency that requires a `finding` (Pitfall 2). The cost of skipping verification is that your note is non-load-bearing — not that it silently passes as fact.
- **Human-gated admission for high-severity notes (dialable, FEATURES.md):** `context.human_admission: off | high-severity | all` — security/architecture/release findings require a named human to admit them at enterprise tiers. Agent *proposes* the verified note; human *disposes* — the prod-deploy pattern extended to memory.
- **RED fixture (mandatory):** a `finding` carrying a hollow/self-authored `verified_by` MUST fail the validator harness — the exact RED-fixture discipline that proved the v1.2 test-integrity checker (SC3 keystone). Without a RED fixture, "un-cheatable" is unproven.

**Warning signs:**
A `finding` with `verified_by` pointing at the writing agent, at a non-existent gate run, or absent; the validator passing a context with unstamped findings; verify-before-write existing only as role prose with no mechanical check; a downstream role consuming a `claim` as a fact; no RED fixture for hollow verification.

**Phase to address:**
**Phase 21 — Verify-Before-Write Admission (the §14 gate as the un-cheatable verifier)** + the validator extension in **Phase 20**. The human-admission dial in **Phase 25 — Governance-on-a-Dial**. Threatens **no-fabrication / trace-is-the-proof** (the core differentiator) and **humans-decide-agents-execute**. **First-class — this is THE pitfall that makes or breaks the milestone's thesis.**

---

### Pitfall 4: Token bloat despite compaction — shared context growing unbounded; compaction that loses load-bearing detail; the 15× multi-agent tax eating the ~50% cost win

**What goes wrong:**
Two opposite failures, both fatal to the "+success AND −50% cost" promise (FEATURES.md):
1. **Unbounded growth → context rot.** Every agent appends; nobody compacts; the active context an agent must read grows until it hits lost-in-the-middle / context-rot, *and* Anthropic's documented **~15× token multiplier** for multi-agent systems (FEATURES.md) compounds against a fat shared file — the ~50% DeLM cost win is erased and then some. grugops's domain is *coding* (tightly-interdependent), exactly where Anthropic warns the multiplier bites hardest.
2. **Over-aggressive compaction → lost load-bearing detail.** A compaction pass that summarizes too hard drops the one constraint a parallel agent needed (a `failed-attempt` it now re-tries, a security caveat, a `supersedes` link), so compaction *causes* the duplicate-work / re-pollution it was meant to prevent. Worse, if compaction is unverified, it can *fabricate* during summarization — silently rewriting a verified finding into something subtly wrong.

**Why it happens:**
"Keep all the history, lose nothing" is the intuitive default (the unbounded-context anti-feature, FEATURES.md). Compaction is hard to do without losing signal; an LLM summarizer optimizes for brevity, not for preserving the exact load-bearing token. The 15× tax is invisible per-agent — each subagent looks cheap; the *aggregate* across a parallel fan-out is what blows the budget.

**How to avoid:**
- **Two-tier memory (STACK.md/FEATURES.md):** verbose per-agent local trajectory lives in the agent's own window (auto-compacted by Claude Code) + `.grugops/context/threads/<agent-id>.md`; only **compact, verified distillations promote to the shared file**. The shared context an agent *reads* stays small; the raw is referenced, not inlined. Selective-unfold: read the gist by default, open the raw only when a task needs it (DeLM's amortization).
- **Append-only HISTORY on disk (git) is fine and free; the ACTIVE context an agent reads must be compact** (FEATURES.md anti-feature distinction). git is the unbounded audit log; the read-path is the bounded working set. These are different things and the design must keep them different.
- **Compaction is dialable, never lossy-by-default of verified facts:** `context.compaction: aggressive | balanced | retain-raw` (FEATURES.md). The safety carve-out: **compaction may shorten prose but must preserve every `finding`'s `verified_by` stamp, every `failed-attempt`/`constraint`, and every `supersedes` link** — these are load-bearing and not summarizable away. Couple to the caveman = token-economy ethos (terse prose is the mechanism, per MEMORY.md — compaction must NOT bloat).
- **Cap the fan-out (see Pitfall 8)** so the 15× multiplier is bounded — token cost is concurrency × context-size; both must be capped.
- **Compacted output is itself a write — so it goes through verify-before-write (Pitfall 3):** a compaction that drops/alters a verified finding is a verification failure, not a silent rewrite. (`UNKNOWN - verify` if the compactor can't preserve a fact faithfully.)
- **Honesty in the pitch:** grugops's own ~50%/+success numbers are `UNKNOWN - verify` until dogfooded (FEATURES.md) — do not claim DeLM's benchmark numbers as grugops's. The cost discipline must be *demonstrated* by the dogfood harness measuring token cost, not asserted.

**Warning signs:**
Shared `<task>.md` growing past a few KB of active (non-history) content; no compaction step in the write-after-verify loop; a compaction pass that drops `failed-attempt`/`constraint`/`verified_by` fields; aggregate token cost rising with agent count (the 15× tax) and no fan-out cap; the pitch citing DeLM's numbers as grugops's own.

**Phase to address:**
**Phase 22 — Memory/Trajectory Compaction (dialable, token-economy)** + the fan-out cap in **Phase 23 — Parallel Execution**. The compaction-preserves-verified-facts carve-out is wired into **Phase 21**'s verify-before-write. Threatens **caveman = token economy** (MEMORY.md), **no-fabrication** (lossy/fabricating compaction), and the milestone's cost thesis.

---

### Pitfall 5: Coordination failures / duplicate work — two agents claim the same task, or no agent claims a task (starvation); deadlock-free claim without a central lock manager

**What goes wrong:**
Decentralized agents must claim work with **no central router** (the bottleneck DeLM exists to kill, FEATURES.md). Two failure shapes: (a) **double-claim** — two background subagents scan `pending/`, both see `task-7`, both start it → wasted tokens + two conflicting context writes (DeLM discloses *no* fine-grained concurrent-claim locking — only a single-lock queue refill; this is a real gap grugops must design around, FEATURES.md/STACK.md). (b) **Starvation/orphan** — an agent claims `task-7`, then crashes/times out mid-run; the task sits in `claimed/` forever, no agent re-picks it, the queue stalls with work that looks done but isn't. (c) **Deadlock-by-accident** — if you reach for a central lock manager to fix double-claim, you've rebuilt the central bottleneck (and a lock holder that dies wedges everyone).

**Why it happens:**
"Just scan the pending dir and pick one" is the obvious queue, and it races. A central lock manager is the obvious fix and it's the exact anti-pattern (a message bus / router all updates route through, FEATURES.md anti-feature). Crash-recovery is invisible until an agent actually dies mid-claim — easy to skip in design.

**How to avoid:**
- **The atomic rename IS the claim — no separate lock needed** (STACK.md): the queue is a directory of files moved `pending/x → claimed/x → done/x` by `renameSync`. Two agents racing to `rename(pending/x, claimed/x)`: one wins, the other gets `ENOENT` and moves to the next pending item. The rename *is* the atomic test-and-set; there is no central lock manager, hence no deadlock and no bottleneck.
- **NFS-safe variant where state may be networked:** `O_EXCL` (`openSync('wx')`) is the local-FS test-and-set, but **`O_EXCL` is unreliable on NFS** (re-verified June 2026 — NFS has no stateful open, the flag can't reach the server). Use **`mkdirSync(claimDir)` — directory creation is atomic and NFS-safe** (re-verified; the classic NFS-locking answer, the approach `proper-lockfile` itself uses, but stdlib). Recommend `mkdirSync`/rename claims as the default since `$GRUGOPS_HOME`/per-repo state may live on a network mount.
- **Stale-claim recovery as a role/workflow rule, NOT a daemon** (STACK.md — no watcher process allowed): stamp every claim file/dir with `agent-id` + ISO `at`; when an agent next scans the queue, it re-`rename`s `claimed/x → pending/x` if `at` is older than a dialed threshold. Optimistic, no background process, no deadlock.
- **Dependency-aware queue ordering** (`[deps:…]`, DeLM-style) is a v2.x add-after-validation (FEATURES.md) — start with a flat queue proven non-colliding, add dependency ordering once the claim primitive is trusted. Don't build the complex queue first.
- **RED/dogfood proof:** the Tier-2 harness spawns N agents against M<N pending tasks and asserts **each task claimed exactly once, zero double-claims**, plus a crash-injection case proving a stale claim is reclaimed on the next scan.

**Warning signs:**
A queue that "reads pending and picks one" with no atomic move; reaching for a central lock manager / lock server; `O_EXCL` claims on network-mounted state; a `claimed/` task with no recovery path; no `agent-id`+timestamp on claims; no double-claim test; a single agent allowed to hold a lock all others wait on.

**Phase to address:**
**Phase 20 — Shared-Context Substrate & Concurrency Foundation** (the atomic-claim primitive `claim()` via `mkdirSync`/rename + stale-claim sweep rule + RED test). Dependency-ordered queue deferred to v2.x. Threatens **no platform/runtime/queue** (Out of Scope — must stay a directory + `node:fs`, no broker) and **zero-runtime-dep**.

---

### Pitfall 6: The degraded-sequential-fallback trap — does sequential-over-shared-context actually preserve correctness, or silently diverge from the parallel path?

**What goes wrong:**
The locked v2.0 decision is "Claude Code parallel primary; the other four CLIs **degrade, never break**" over the *same* shared context. The trap: "degrade" quietly becomes "**diverge**." The sequential path and the parallel path produce *different outcomes* for the same input — a parallel run reconciles two findings via supersession the sequential run never encounters; a sequential run drains the queue in a different order and reaches a different decomposition; the parallel path exercises `atomicWrite`/claim-races the sequential path never hits, so a bug lives only in one path. If divergence is silent, a Codex/Gemini/OpenCode/Copilot user gets *materially different, possibly worse* results than the Claude Code user, while the kit claims parity-by-degradation. **This is precisely the A3/DOG-02 dual-path-parity concern that v1.2 human-waived to this milestone** — removing handoffs doesn't automatically retire it; it *moves* it from "do the two handoff paths match" to "do the two *execution* paths over one shared context match." If you don't test the equivalence honestly, you've waived a concern and then silently re-created it.

**Why it happens:**
"Same files, same format" *feels* like "same behavior," but parallelism introduces ordering, races, and reconciliation that sequentiality never exercises — they are not the same execution. The degraded path is the less-loved path (Claude Code is primary), so it gets less testing. The temptation is to assert parity in prose ("the other CLIs use the same substrate") and never prove it — the same prose-instead-of-proof trap that produced the original A3 waiver.

**How to avoid:**
- **One substrate, designed tool-neutrally** (FEATURES.md/STACK.md): the context + queue file conventions are identical across all five CLIs; spawning is an *execution detail layered on top*, not a fork of the data model. The sequential path is "the parallel path with concurrency = 1" — same `readContext`/verify/`appendNote`, same claim protocol (inert under single-writer but not different). Never write a separate sequential code path or a separate sequential note schema.
- **Define "degrade, never break" as a TESTABLE equivalence, not a slogan.** The honest property is: *for the same task, the sequential path produces a context that satisfies the same verified-finding set and the same final artifact acceptance as the parallel path* — it may be slower and reach findings in a different order, but it must not reach a **worse or contradictory** end state. Pin this as an explicit acceptance criterion the roadmap can verify.
- **A dual-path oracle in the dogfood harness** (this is the honest A3/DOG-02 retirement, STACK.md): run the same seeded task (a) parallel on Claude Code and (b) sequential via the single-window role-load, and assert the **on-disk verified context + final acceptance verdict are equivalent** (same set of `finding`s admitted, same gate result, same artifact). Assert on *on-disk artifacts*, not `--print` stdout — the original A3 test failed because it asserted on `-p` stdout, a test-design limit, not a product defect (Key Decision, 2026-06-16). **This oracle is what actually retires the waiver — not the mere removal of handoffs.**
- **The sequential path is the correctness reference;** because it has one writer, it is immune to Pitfalls 1, 2, 5 races (STACK.md). Treat any parallel-only divergence as a parallel-path bug measured against the sequential reference.

**Warning signs:**
"Degrade, never break" asserted only in prose with no equivalence test; a separate sequential code path / note schema; the dual-path oracle asserting on stdout instead of on-disk artifacts; a bug reproducible on one path only; the sequential path producing fewer/contradictory findings than the parallel path; the A3/DOG-02 waiver marked "retired" with no equivalence proof behind it.

**Phase to address:**
**Phase 23 — Parallel Execution & Graceful Sequential Degradation** (build both paths on one substrate) + **Phase 26 — Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement** (the equivalence test that honestly retires the waiver). Threatens **degrade-never-break** (the locked decision) and **no-fabrication** (a falsely-"retired" waiver is a fabricated closure). **First-class — this is the explicit reason the milestone exists to retire the A3/DOG-02 concern; retiring it requires a real test, not just deleting handoffs.**

---

### Pitfall 7: Losing the auditable trace during decentralization — async writes scrambling the requirement→code→test→release trail

**What goes wrong:**
grugops's identity is the **auditable requirement→code→test→release trace** ("the trace is the proof"). Under a centralized Orchestrator with ordered handoffs, the trail was naturally linear. Decentralized async writes scramble it: notes land in non-deterministic order; two agents write provenance at the same wall-clock second; a `finding` references a `claim` that was later superseded so the lineage is broken; a parallel branch's work isn't attributable to who-did-what-when. If the trail becomes unreconstructable, the auditability differentiator (the whole wedge vs DeLM, FEATURES.md) evaporates — and a regulated user can no longer answer "which verified evidence backed this release decision, and who admitted it."

**Why it happens:**
Linear ordering was a free side-effect of centralization; decentralization removes it without anyone deciding to. Provenance fields feel like boilerplate and get dropped under prose-bloat pressure. "git gives us audit for free" is true *only if* every write is a real, attributable, append-only commit/note — a scrambled or squashed history breaks it.

**How to avoid:**
- **Every note carries full provenance, non-optional** (STACK.md schema): `by` (which role/agent), `at` (ISO timestamp), `verified_by` (the evidence), plus `supersedes`/`refs` for lineage. The structure validator fails any note missing provenance — same no-fabrication discipline as the verify stamp (Pitfall 3). Provenance is load-bearing and **exempt from compaction** (Pitfall 4).
- **Append-only + git is the audit trail** (FEATURES.md — the recognized 2026 pattern, Squad's `decisions.md` drop-box, ESAA event-sourcing): `git log` over the append-only context files is a free, tamper-evident, attributable history. The reconstructability guarantee is "git log + the per-note `by`/`at`/`verified_by`/`supersedes` chain can replay who-knew-what-when." No bespoke audit DB (anti-feature, FEATURES.md).
- **Order is reconstructable from `at` + `supersedes`, not from file position.** Because async writes have no positional order, the *logical* order is carried in the data (timestamps + supersession links), and the per-task `events.jsonl` is the machine-replayable index. The trace is reconstructed by sorting the JSONL by `at` and following `supersedes`, not by reading top-to-bottom.
- **Traceability IDs survive the handoff removal:** the REQ-ID → finding → code → test → release chain that lived across handoff packets now lives as `refs`/trace fields on the context notes. The clean handoff removal (Pitfall 9) must *migrate* the traceability content into the notes, not drop it.
- **Board-as-state stays the human-readable view** (FEATURES.md): the WIP-limited markdown board is the at-a-glance projection of the queue + trace, so a human can audit without parsing JSONL.

**Warning signs:**
A note missing `by`/`at`/`verified_by`; provenance dropped by a compaction pass; lineage broken because a `supersedes` link is absent; the trace only reconstructable by file order (which is non-deterministic under async); git history squashed/rewritten so attribution is lost; a release decision with no linked verified evidence.

**Phase to address:**
**Phase 20 — Shared-Context Substrate** (provenance schema + validator) and **Phase 24 — Clean Handoff Removal & Traceability Migration** (migrate the REQ→code→test→release trace into notes). Threatens **trace-is-the-proof / no-fabrication** and the **auditability differentiator**.

---

### Pitfall 8: Over-spawning cost blowups — unbounded parallel agents; missing concurrency caps; runaway loops

**What goes wrong:**
Claude Code's spawn model has a **fixed depth-5 cap on background subagent trees** (re-verified June 2026 — "a background subagent at depth five does not receive the Agent tool and cannot spawn further … fixed and not configurable, exists to prevent runaway concurrent trees"), **but there is NO documented cap on the *number* of concurrent background subagents at a given level** (re-verified — only `maxTurns` per subagent and `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`). So a coordinator that fans out one background subagent per queue item, per finding, or per file can spawn an unbounded *width* of concurrent agents — multiplying the already-15×-per-agent token tax (Pitfall 4) into a runaway bill. The inverse mistake (STACK.md): granting the `Agent` tool to *every* role → uncontrolled fan-out from everywhere, defeating the coordinator model. And a verify→fail→regenerate→re-verify loop with no bound (DeLM regenerates rejected writes "up to a retry limit") can spin forever burning tokens.

**Why it happens:**
The platform caps *depth* but not *width* — the width cap is **grugops's responsibility, not Claude Code's**, and it's invisible until a real fan-out runs up a bill. "One agent per task" feels natural and scales linearly with queue size. The retry-on-verification-failure loop (Pitfall 3's regeneration) is unbounded unless someone sets a limit. Each subagent looks cheap in isolation; the aggregate is the blowup.

**How to avoid:**
- **grugops sets an explicit, dialable concurrency WIP cap on the queue/fan-out** — the platform won't. Reuse the existing **WIP-limited board** (FEATURES.md — board-as-state is already WIP-limited): `queue.wip_limit` bounds how many tasks may be `claimed/` (in-flight) at once. A coordinator may only spawn up to the WIP cap of background subagents; beyond that, tasks wait in `pending/`. Lean default = a small cap (e.g. 3–4); enterprise may raise it with eyes open.
- **Grant `Agent(<allowlist>)` to the Orchestrator/coordinator ONLY** (STACK.md — the WR-05 guard *inverts* from "no role may have Agent" to "only the coordinator may"). The mechanical guard, packaging templates, and catalog flip together in one coordinated change (STACK.md flag). Every other role has no spawn tool → no rogue fan-out.
- **Bound every loop:** the verify→regenerate→re-verify loop reuses the §14 gate's existing **bounded `self_fix_attempts`** pattern (v1.2, three terminal results) — a verification-rejected write retries a fixed N times then terminates to a human/`UNKNOWN - verify`, never spins. Per-subagent `maxTurns` is a second backstop.
- **Prefer depth over uncontrolled width, within the depth-5 background cap:** structured fan-out (Orchestrator → roles → optional per-finding verifier) inside the cap, not a flat explosion of N background agents. Design for the depth-5 background limit explicitly (STACK.md).
- **Dogfood measures aggregate token cost** (ties to Pitfall 4) — a fan-out that exceeds a cost budget is a caught regression, not a surprise invoice.

**Warning signs:**
A coordinator spawning one background agent per queue item with no WIP cap; the `Agent` tool granted to a non-coordinator role; a regenerate-on-verification-fail loop with no attempt bound; aggregate token cost scaling super-linearly with queue size; no `queue.wip_limit`; designing as if Claude Code caps concurrent width (it does not — only depth-5).

**Phase to address:**
**Phase 23 — Parallel Execution & Orchestrator-as-Decomposer** (the WIP/concurrency cap + Agent-allowlist-to-coordinator + the inverted WR-05 guard) with the bounded retry reusing the Phase 21 verify loop. Threatens **caveman = token economy** (MEMORY.md), the cost thesis, and **humans-decide** (a runaway agent acting unbounded).

---

### Pitfall 9: Clean-handoff-removal breakage — ripping out static handoffs breaks role contracts, downstream readers, the docs catalog, and the validator

**What goes wrong:**
The locked decision is a **clean replacement** of static handoff packets (not additive-then-deprecate) — the shared context becomes the sole inter-role memory; handoff templates + wiring are *removed*. The blast radius is enormous: ~17 roles + 14 workflows + the handoff templates + `_role-switch-protocol.md` step-4 (which reads/writes handoffs) + the **structure validator** (which checks handoff structure) + the **docs catalog** (which documents handoffs) + the install **seed** (which seeds `plans/handoffs/`) + the two-root state model (`plans/handoffs/` is seeded per-repo). A clean rip-out that misses any downstream reader leaves a role pointing at a deleted template, a validator failing on absent handoffs it still expects, a catalog documenting a removed artifact (a *lying* catalog — v1.2 Pitfall 9), or a workflow whose step-4 reads a file that no longer exists. "Clean replacement" is bolder and simpler as an *end state* but still needs a **safe cutover and a rollback story** — even a clean replacement can be done in a sequence that doesn't leave the kit broken mid-pivot.

**Why it happens:**
"Clean" is misread as "just delete the handoff files." The handoff concept is woven through more files than anyone enumerates upfront (the v1.1/v1.2 history shows handoff references in roles, workflows, the protocol, the validator, the catalog, the installer seed, and traceability). FEATURES.md is explicit: **the shared context must land BEFORE handoffs are removed** — "otherwise the factory loses its memory mid-pivot." A big-bang delete-and-rewire in one step maximizes the chance of a missed reader.

**How to avoid:**
- **Substrate-first ordering (FEATURES.md dependency note):** the shared verified context must exist and roles must read/write it *before* the handoffs are deleted. Sequence: (1) build the substrate (Phase 20), (2) wire verify-before-write (21), (3) rewire roles/workflows/`_role-switch-protocol.md` step-4 to read/write context instead of handoffs (24a), (4) *then* delete handoff templates + seed + validator/catalog references (24b). Never delete before the replacement is wired.
- **Enumerate every handoff reader mechanically before deleting** — grep the kit for handoff references (templates, `plans/handoffs/`, validator arrays, catalog discovery, installer seed, traceability, role/workflow prose) and produce a checklist; the deletion is complete only when the grep returns zero stale references (the v1.1 "grep-to-zero gate" pattern).
- **Update the validator and catalog generator in the SAME change as the deletion** (v1.2 single-source + docs-catalog-drift lessons): the validator must stop expecting handoff structure and start checking context structure; the catalog must stop documenting handoffs and document the context substrate — or the freshness gate fails red (which is the desired safety: a stale catalog/validator after a rip-out is caught, not shipped).
- **Migration safety + rollback story (carry the v1.2 migrate/update pitfall):** even though grugops is git-versioned (so rollback = git revert for the *kit*), an *installed user's* per-repo `plans/handoffs/` state must not be silently destroyed by an `--update`/`--migrate` — rename-to-backup, never delete-first (v1.1 CR-01 lesson). Provide a documented rollback: the cutover is one coordinated change so `git revert` restores the working pre-pivot kit cleanly.
- **Honestly retire A3/DOG-02 as part of this** — but the retirement is the equivalence *test* (Pitfall 6), not the mere deletion of handoffs. Deleting handoffs makes the *handoff*-parity test moot; it does NOT make the *execution*-parity question moot.

**Warning signs:**
A plan that deletes handoff files before the context substrate is wired; a role/workflow still referencing `plans/handoffs/` or a handoff template after the rip-out; the validator failing because it still expects handoffs; the catalog documenting a removed artifact; the installer still seeding `plans/handoffs/`; a grep for handoff references returning non-zero after the deletion phase; no rollback story; user per-repo handoff state deleted without backup on `--update`.

**Phase to address:**
**Phase 24 — Clean Handoff Removal & Traceability Migration** (substrate-first, grep-to-zero, validator+catalog updated in the same change, rename-to-backup for user state). Depends on Phases 20–21 landing first. Threatens **single-source** (a missed reader is drift), **no-fabrication** (a lying catalog/validator), and **installers-never-delete-user-content**.

---

### Pitfall 10: Portability / cross-platform — Windows rename/lock non-atomicity, the committed-`.js` freshness model, keeping zero-runtime-dep

**What goes wrong:**
The concurrency primitives (Pitfalls 1, 5) are **POSIX-atomic but NOT Windows-atomic**, and the kit must run on Windows (the entire reason TS was adopted — D-13, "an un-cheatable cross-platform checker must run in host repos including Windows where POSIX shell cannot"). Three concrete cross-platform breaks: (a) **`fs.rename` over an existing file fails on Windows** (re-verified June 2026 — Windows native rename "fails if the destination file already exists" and is "not POSIX-atomic"; throws `EEXIST`/`EPERM`) — so the atomic-publish-by-rename and the rename-claim both break on Windows. (b) **`O_EXCL` is unreliable on NFS** (re-verified — no stateful open; the flag can't reach the server) — so a network-mounted `$GRUGOPS_HOME` breaks the `'wx'` claim. (c) **A network/Windows-specific bug ships green** because the freshness check only proves the committed `.js` matches its `.ts` source — it does NOT prove the *runtime behavior* is correct on Windows/NFS, and the temptation to add a real cross-platform locking dep (`proper-lockfile`) would violate zero-runtime-dep.

**Why it happens:**
POSIX is the developer's default; macOS/Linux dev machines never hit the Windows rename or NFS races, so the bug is invisible until a Windows/network user runs it. The committed-`.js` freshness model guarantees *source↔output parity*, which is mistaken for *behavior correctness*. The obvious cross-platform fix is a battle-tested npm lib — which is forbidden on hosts.

**How to avoid:**
- **Windows-safe atomic publish:** `unlinkSync(target)` (in a try/catch, ignore ENOENT) immediately before `renameSync(tmp, target)` — accepting a tiny non-atomic window — OR scope rename-replace to single-writer files only, OR use the Windows `ReplaceFile`-semantics path where available. **Document the Windows caveat explicitly** in the helper (STACK.md). Test on Windows in CI, not just POSIX.
- **NFS-safe atomic claim:** prefer **`mkdirSync(claimDir)`** (atomic + NFS-safe, re-verified) over `openSync('wx')` for the claim primitive when state may be networked — recommend it as the default since per-repo state location is user-controlled. The `link(2)`-based lock is a documented fallback if needed.
- **Zero-runtime-dep held hard (STACK.md What-NOT-to-Use):** NO `proper-lockfile`, `gray-matter`, `js-yaml`, `chokidar`, or SQLite binding on hosts. grugops calls `mkdirSync`/`renameSync` *directly* (`proper-lockfile` itself just wraps `mkdir`). The note metadata is parsed by stdlib `JSON.parse` (the JSONL mirror) or a hand-rolled fence reader — same class as the v1.2 catalog/ASVS stdlib parsers.
- **The freshness model guards source↔output, NOT behavior — so behavior needs its own cross-platform tests:** keep the `tsc`-to-committed-`.js` + freshness check (D-13) unchanged for the new helpers, AND add behavior tests for the concurrency primitives that run on **Windows + a network/NFS-like mount in CI** (or at minimum document them as `UNKNOWN - verify` until a Windows/NFS dogfood confirms — never claim cross-platform-correct without the test). FEATURES.md flags the Windows atomic-claim behavior as `UNKNOWN - verify` until tested — honor that.
- **Keep `PIPE_BUF` out of the correctness path** (STACK.md open question): don't depend on append-atomicity (which varies by OS); `atomicWrite` the JSONL or keep lines well under 512 bytes — the safe default that needs no per-OS `PIPE_BUF` knowledge.

**Warning signs:**
`renameSync` over an existing target with no Windows `unlink`-first guard; `openSync('wx')` claims with state that may be on NFS; a new host runtime dependency to "fix" cross-platform locking; CI that only runs on Linux/macOS; the freshness gate cited as proof of *behavior* correctness; reliance on `appendFileSync` atomicity for correctness; a cross-platform claim with no Windows/NFS test behind it.

**Phase to address:**
**Phase 20 — Shared-Context Substrate & Concurrency Foundation** (the helpers ship Windows/NFS-safe with cross-platform behavior tests + the freshness model extended to the new helpers). Threatens **zero-runtime-dep** and the **cross-platform (Windows) mandate** that justified the TS pivot (D-13).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Let roles `Write` context files directly instead of via `atomicWrite`/`appendNote` | No helper to build; "the agent just writes" | Lost-update / interleaved / torn-read corruption of the *sole* memory under parallelism | **Never** — atomic-only is the foundation; grep-guard it |
| Verify-before-write as role prose only ("agents should verify") | No mechanical check to build | Self-graded findings pollute the context; the differentiator collapses | **Never** — `finding` admission is mechanical + refuse-self-set, with a RED fixture |
| `O_EXCL`/`'wx'` claim everywhere (ignore NFS) | One primitive, simplest code | Silent claim race on network-mounted state → double-claim/corruption | Only when state is provably local; default to `mkdirSync` (NFS-safe) |
| `renameSync`-replace with no Windows `unlink`-first | Works on the dev Mac/Linux | `EEXIST`/`EPERM` on every Windows user — breaks publish + claim | **Never** — Windows is the reason TS was adopted (D-13) |
| Append unbounded; compact "later" | Ships the substrate faster | Context rot + 15× token tax erases the ~50% cost win; the pitch's thesis fails | Never for the active read-path; append-only *history* on git is fine |
| Compact aggressively, drop "redundant" fields | Smaller context | Drops `verified_by`/`failed-attempt`/`supersedes` → re-pollution, broken lineage, fabrication | Never — those fields are load-bearing and compaction-exempt |
| Big-bang delete handoffs then rewire | Bold, fewer steps on paper | Factory loses its memory mid-pivot; missed readers ship broken | **Never** — substrate-first, grep-to-zero, then delete |
| One background subagent per queue item, no WIP cap | Maximal parallelism, simplest coordinator | Unbounded concurrent *width* (platform caps depth-5 only) → runaway token bill | Never — cap via `queue.wip_limit`; coordinator-only `Agent` grant |
| Assert "degrade, never break" in prose, no equivalence test | Looks done; ships faster | Sequential path silently diverges/worsens; A3/DOG-02 falsely "retired" | **Never** — the equivalence oracle IS the retirement |
| Cite DeLM's +9.3pp / ~50% as grugops's numbers | Strong pitch | Unverified claim; the trace-is-the-proof brand forbids it | Never — `UNKNOWN - verify` until grugops's own dogfood measures it |
| Freshness check cited as proof of cross-platform correctness | No Windows/NFS CI to set up | Source↔output parity ≠ behavior correctness; Windows/NFS bug ships green | Never — behavior needs Windows/NFS behavior tests |

## Integration Gotchas

*(For a decentralized file-based kit, "integrations" = the 5 host CLIs, the file-system/OS substrate, git-as-audit-log, and Claude Code's spawn API — where the parallel/sequential prose actually executes.)*

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `node:fs` `renameSync` on Windows | Atomic-replace assumed; fails `EEXIST`/`EPERM` if dest exists | `unlink`-then-`rename` (or single-writer files); document + Windows-CI test |
| `node:fs` `O_EXCL`/`'wx'` on NFS | Used as the claim lock on network-mounted state; silent race | `mkdirSync` claim (atomic + NFS-safe) as the default |
| `appendFileSync` for the verified note | Multi-KB note appended; interleaves past `PIPE_BUF` | Append a small JSONL metadata line (<512B); `atomicWrite` the prose body |
| Claude Code `Agent` spawn | Assumed to cap concurrent *width*; granted to every role | Platform caps depth-5 only — grugops caps width via WIP; `Agent(<allowlist>)` to coordinator only |
| Claude Code nested spawn (v2.1.172+) | Designed-against the old "can't nest" assumption | Design for optional nested fan-out within the fixed depth-5 background cap |
| The 4 sequential CLIs (Codex/Gemini/OpenCode/Copilot) | Separate sequential code path / note schema | One tool-neutral substrate; sequential = concurrency-1 of the same path |
| git as the audit log | History squashed/rewritten; provenance fields dropped | Append-only, full per-note `by`/`at`/`verified_by`/`supersedes`; `git log` replays the trace |
| Structure validator | Still expects handoff structure after the rip-out | Update validator + catalog in the SAME change as the deletion (grep-to-zero) |
| Installer seed / two-root state | `plans/handoffs/` seed left; user handoff state deleted on update | Re-seed `.grugops/context/`+`.grugops/queue/`; rename-to-backup user state, never delete-first |
| Plugin-shipped subagents | Spawning Orchestrator + hooks shipped in the plugin (ignored for security) | Ship the spawning Orchestrator + guards STANDALONE `.claude/agents/`, not the plugin |

## Performance Traps

*(grugops has no runtime; "performance" here = token cost + agent success rate as the decentralized factory scales with queue size and parallelism.)*

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 15× multi-agent token tax × fat shared context | Aggregate cost rises super-linearly with agent count; ~50% win erased | Two-tier memory (compact promotes to shared); cap fan-out (WIP) | First real parallel fan-out on Claude Code |
| Unbounded shared-context growth (context rot) | Agent output less focused; lost-in-the-middle; cost climbs per task | Compact active read-path; append-only history on git only | As the per-task note count grows over a long task |
| Over-aggressive compaction | Re-tried failed-attempts; broken `supersedes` lineage; subtle fabrication | Compaction-exempt fields; dialable; compacted output re-verified | When compaction summarizes load-bearing fields away |
| Unbounded concurrent background-subagent width | Surprise token invoice; the depth-5 cap doesn't help (it caps depth) | `queue.wip_limit` bounds in-flight claims; coordinator-only spawn | When the coordinator fans out per-item with no WIP cap |
| Unbounded verify→regenerate loop | Tokens spin on a write that never passes verification | Reuse §14 bounded `self_fix_attempts` + per-subagent `maxTurns` | When a note is unverifiable and the loop has no bound |
| Double-claimed work | Two agents do the same task; 2× tokens + conflicting writes | Atomic rename/`mkdir` claim; double-claim dogfood test | Under true Claude Code parallel spawn (never sequential) |

## Security Mistakes

*(Domain-specific to a decentralized verified-context kit, beyond generic web security.)*

| Mistake | Risk | Prevention |
|---------|------|------------|
| Self-authored `verified_by` stamp | Agent grades its own work; fake "verified" finding pollutes memory | Refuse self-set (mirror prod-deploy hook); verifier ≠ verified; validator fails it |
| Autonomous admission of high-severity context notes | Security/architecture/release fact admitted with no human; safety floor eroded | `context.human_admission` dial; agent proposes, named human disposes (enterprise) |
| Spawn (`Agent`) tool granted broadly | Rogue/uncontrolled fan-out; runaway cost; bypasses the coordinator gate | `Agent(<allowlist>)` to coordinator only; inverted WR-05 grep guard |
| Prod-deploy hook bypassed by a spawned/parallel agent | A subagent deploys without the human gate | Hook unchanged + standalone (plugin agents ignore hooks); every spawned agent still hits it |
| Compaction silently rewrites a verified security finding | A security caveat summarized away; gap ships behind a "verified" gist | Compaction-exempt fields; compacted output re-verified; `UNKNOWN - verify` if unfaithful |
| A `claim` consumed as a `finding` for a security decision | Unverified assertion drives a release/security choice | Workflow rule: only `finding` satisfies a security-bearing dependency |
| Caveman voice in a context security/release finding | Human can't act at the safety moment (carry v1.2 Pitfall 3) | Clear professional English in all finding/decision/security note bodies |

## UX Pitfalls

*(UX here = the developer using grugops across solo→enterprise, and across the parallel vs degraded-sequential lanes.)*

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Sequential-CLI user silently gets worse results than Claude Code | "Degrade" became "diverge"; unfair, untrusted | Equivalence oracle proves same verified-finding set + acceptance; document the tradeoff (slower, not worse) |
| Hidden runtime queue/context the user can't see | Decentralization feels like a black box; lost the legible board | Board-as-state stays the human-readable WIP-limited queue view |
| Solo user forced into enterprise context-admission ceremony | Over-taxed; abandons (carry v1.2 dial pitfall) | `context.human_admission` lean default = off; enterprise escalates |
| Surprise token bill from a parallel run | Trust broken; "the tool spent my budget" | WIP-capped fan-out; dogfood measures cost; lean default small concurrency |
| `--update`/`--migrate` deletes user handoff state during the pivot | "The tool ate my work" (carry v1.2 migrate pitfall) | Rename-to-backup, dry-run, reversible; never delete-first |
| A3/DOG-02 marked "retired" with no proof | User can't trust the parity claim; the brand is honesty | Retirement = the equivalence oracle passing, surfaced in the dogfood evidence |

## "Looks Done But Isn't" Checklist

- [ ] **Atomic writes:** Often a raw `Write`/`writeFileSync` of a context file slips in — verify every context write goes through `atomicWrite`/`appendNote`; grep-guard passes; N-agent dogfood produces N distinct un-clobbered notes
- [ ] **Verify-before-write:** Often a self-authored/hollow `verified_by` passes — verify a RED fixture (hollow + self-set stamp) FAILS the validator; verifier ≠ verified is enforced
- [ ] **Stale reads:** Often only a dispatch-time read exists — verify a re-read-before-publish step + `supersedes` handling; a superseded `claim` is never consumed as a fact
- [ ] **Atomic claim:** Often `O_EXCL` used on networkable state — verify `mkdirSync`/rename claim; double-claim test passes; stale-claim reclaimed on next scan
- [ ] **Compaction:** Often drops load-bearing fields — verify `verified_by`/`failed-attempt`/`supersedes`/provenance survive compaction; compacted output is re-verified
- [ ] **Fan-out cap:** Often missing — verify `queue.wip_limit` bounds in-flight claims; `Agent` granted to coordinator only; verify-loop bounded
- [ ] **Degraded path:** Often asserted in prose only — verify the dual-path equivalence oracle (parallel vs sequential) asserts on ON-DISK artifacts, same verified-finding set + acceptance
- [ ] **Handoff removal:** Often a missed reader — verify grep-to-zero of handoff references; validator + catalog updated in the same change; substrate wired before deletion; rollback story exists
- [ ] **Audit trace:** Often provenance dropped / order lost — verify every note has `by`/`at`/`verified_by`; trace reconstructable from `at`+`supersedes` (not file position); git history append-only
- [ ] **Cross-platform:** Often POSIX-only — verify Windows `unlink`-then-`rename`; NFS `mkdir` claim; behavior tests run on Windows/NFS in CI (not just freshness check); no host runtime dep added
- [ ] **A3/DOG-02 retirement:** Often "retired" = handoffs deleted — verify it's the EQUIVALENCE TEST passing, not just the deletion
- [ ] **Carry-forward v1.x guards still green:** WR-05 (now inverted), single-source, AGENTS.md byte budget, voice-lint, test-integrity, prod-deploy hook all still pass after the pivot

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Context corrupted by a write race | MEDIUM | git history is append-only → recover lost notes from `git log`/prior commits; introduce `atomicWrite`/`appendNote` + grep-guard; re-run N-agent dogfood |
| Unverified finding polluted the context | MEDIUM | Re-run the verifier over existing findings; demote unstamped findings to `claim`; add the refuse-self-set check + RED fixture; audit downstream consumers |
| Token blowup from fat context / unbounded fan-out | MEDIUM | Add two-tier compaction + `queue.wip_limit`; re-measure cost in the dogfood; compaction-exempt the load-bearing fields |
| Double-claimed / starved tasks | LOW–MEDIUM | Switch to `mkdirSync`/rename atomic claim; add stale-claim sweep rule; add the double-claim + crash-injection test |
| Degraded path diverged silently | HIGH (trust) | Build the equivalence oracle; treat parallel-only divergence as a bug vs the sequential reference; re-prove A3/DOG-02 retirement |
| Handoff removal broke a downstream reader | MEDIUM | git revert the cutover (it's one coordinated change); re-sequence substrate-first; grep-to-zero before re-deleting; update validator+catalog in the same change |
| Audit trace scrambled / unreconstructable | MEDIUM–HIGH | Backfill provenance fields; rebuild the JSONL index from markdown; enforce provenance in the validator; never squash the audit history |
| Windows/NFS atomicity bug shipped | MEDIUM | Add `unlink`-then-`rename` + `mkdir` claim; add Windows/NFS behavior tests to CI; mark prior cross-platform claims `UNKNOWN - verify` until tested |
| DeLM numbers claimed as grugops's | LOW | Replace with `UNKNOWN - verify`; stand the pitch on auditability+gating+governance (demonstrable), not borrowed benchmarks |

## Pitfall-to-Phase Mapping

*(v2.0 phases start at 20. Ordering rationale below the table. Phase names are themes; the roadmapper assigns final numbers — but the FOUNDATION-before-content ordering is the load-bearing recommendation, mirroring how v1.2 front-loaded its foundation guards.)*

| # | Pitfall | Prevention Phase (theme, ≥20) | Verification |
|---|---------|-------------------------------|--------------|
| 1 | Write races (lost/interleaved/torn) | **20** — Substrate & Concurrency Foundation | grep-guard: no raw context writes; N-agent dogfood → N distinct un-clobbered notes |
| 2 | Stale-context reads | **20** (schema) + **23** (decompose to minimize shared state) | `claim`/`finding`/`supersedes` schema; re-read-before-publish; no `claim` consumed as fact |
| 3 | Verification gaps (un-cheatable verifier) | **21** — Verify-Before-Write Admission (+ validator in 20; human-admission dial in 25) | RED fixture: hollow/self-set `verified_by` FAILS; verifier ≠ verified |
| 4 | Token bloat / lossy compaction | **22** — Memory/Trajectory Compaction (+ fan-out cap in 23) | Active context stays compact; load-bearing fields survive; dogfood measures cost |
| 5 | Coordination / duplicate work / starvation | **20** — Substrate & Concurrency Foundation | `mkdir`/rename atomic claim; double-claim test = each task claimed once; stale reclaim |
| 6 | Degraded-sequential divergence (A3/DOG-02) | **23** (both paths, one substrate) + **26** (dual-path oracle) | Equivalence oracle on ON-DISK artifacts: same verified-finding set + acceptance |
| 7 | Lost auditable trace | **20** (provenance schema) + **24** (traceability migration) | Every note has `by`/`at`/`verified_by`; trace replays from `at`+`supersedes`; git append-only |
| 8 | Over-spawning cost blowup | **23** — Parallel Execution & Orchestrator-as-Decomposer | `queue.wip_limit`; `Agent(<allowlist>)` coordinator-only; inverted WR-05 guard; bounded loop |
| 9 | Clean-handoff-removal breakage | **24** — Clean Handoff Removal & Traceability Migration | Substrate-first; grep-to-zero handoff refs; validator+catalog updated same change; rollback |
| 10 | Cross-platform / zero-dep | **20** — Substrate & Concurrency Foundation | Windows `unlink`-then-`rename`; NFS `mkdir` claim; Windows/NFS behavior tests; no host dep |
| — | Inherited v1.x guards (WR-05 inverted, single-source, byte budget, voice, test-integrity, prod-deploy hook) | Each touched phase (cross-cutting) | All v1.x foundation guards still GREEN after the pivot; WR-05 flips to coordinator-only in one coordinated change |

**Phase ordering rationale (the load-bearing recommendation):**
1. **Phase 20 (Substrate & Concurrency Foundation) MUST come first** and ship the mechanical guards — `atomicWrite`/`appendNote`, the atomic claim primitive, the provenance+verify-stamp validator extension, the grep guard, and the cross-platform behavior tests — **before any role writes to the shared context**. This is the v1.2 lesson applied: front-load the foundation guards so drift is caught as it's written, not after. Pitfalls 1, 5, 7, 10 (and the schema half of 2) are prevented here.
2. **Phase 21 (Verify-Before-Write)** makes the §14 gate the un-cheatable admission verifier with the refuse-self-set carve-out and a RED fixture — Pitfall 3, the milestone's whole thesis. Must precede the handoff removal (the replacement must verify before it can be the sole memory).
3. **Phase 22 (Compaction)** lands the token-economy control — Pitfall 4 — before parallel fan-out makes the 15× tax real.
4. **Phase 23 (Parallel Execution & Orchestrator-as-Decomposer)** introduces spawning with the WIP/concurrency cap, coordinator-only `Agent` grant, inverted WR-05 guard, and the tool-neutral sequential degradation — Pitfalls 6 (build), 8, and the decompose half of 2.
5. **Phase 24 (Clean Handoff Removal & Traceability Migration)** — substrate-first, grep-to-zero, validator+catalog in the same change — Pitfalls 7 (migration) and 9. **Depends on 20–21 being solid.**
6. **Phase 25 (Governance-on-a-Dial)** — human-admission + retention dials — the enterprise half of Pitfall 3.
7. **Phase 26 (Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement)** — the equivalence oracle that honestly retires the waiver (Pitfall 6) and measures token cost (Pitfall 4). **This phase is where "degrade, never break" and "verified means verified" stop being prose and become proof.**

## Sources

- `.planning/PROJECT.md` — v2.0 milestone scope, locked decisions (parallel-first/CC-primary, clean handoff replacement, no-spawn reversal for CC only, A3/DOG-02 human-waiver to this milestone), hard constraints (zero-runtime-dep, no platform/queue, single-source, no-fabrication, humans-hold-merge/deploy, installers-never-delete) (HIGH)
- `.planning/research/STACK.md` (this session) — `node:fs` concurrency primitives (`atomicWrite`/`renameSync`, `openSync('wx')`/`O_EXCL`, `mkdirSync` NFS-safe claim, `appendFileSync`/`PIPE_BUF`), the markdown+JSONL note schema with provenance/`verified_by`, Claude Code `Agent`/nesting/depth-5/background, the degraded-sequential path, the inverted WR-05 guard, the Windows/NFS caveats (HIGH)
- `.planning/research/FEATURES.md` (this session) — DeLM verified≠correct (grounding-only, no human gate/audit), Anthropic's ~15× token tax + coding-is-tightly-interdependent warning, blackboard per-key concurrency + control-component conflict resolution, stigmergy debuggability/coherence caveats, the differentiation thesis (auditable+gated+governance), substrate-before-handoff-removal dependency, the anti-features (central bus, unbounded context, optimistic-write, DeLM-grade verifier, autonomous admission) (HIGH)
- `.planning/milestones/v1.2-research/PITFALLS.md` — the inherited markdown-kit pitfalls (WR-05 regen, single-source drift, prompt/AGENTS.md bloat, dial regressions, voice drift, test-integrity loophole, docs-catalog drift), RED-fixture discipline, grep-to-zero gate, rename-to-backup never-delete-first, sh/Node→TS byte/behavior parity, foundation-guards-before-content ordering (HIGH)
- [Overwriting rename is not atomic — node-fs-extra #835](https://github.com/jprichardson/node-fs-extra/issues/835) + [EPERM when renaming on Windows — nodejs/node #29481](https://github.com/nodejs/node/issues/29481) + [Get ENOENT when rename an existing file — nodejs/node #16140](https://github.com/nodejs/node/issues/16140) + [Rename (computing) — Wikipedia](https://en.wikipedia.org/wiki/Rename_(computing)) + [atomic writing on Windows — Hacker News](https://news.ycombinator.com/item?id=16573770) — Windows `rename` fails if dest exists / not POSIX-atomic; temp-file-then-rename pattern; `ReplaceFile` API (HIGH, re-verified June 2026)
- [On the Brokenness of File Locking — 0pointer.de](http://0pointer.de/blog/projects/locking) + [A full day of file locking — pemungkah.com](https://pemungkah.com/a-full-day-of-file-locking/) + [atomic locking over NFS — Experts Exchange](https://www.experts-exchange.com/questions/10078625/atomic-locking-over-NFS-with-link-2-stat-2.html) + [Unable to lock files on NFS — Red Hat](https://access.redhat.com/solutions/43001) — `O_EXCL` unreliable on NFS (no stateful open); `mkdir()` atomic + NFS-safe; `link(2)` fallback (HIGH, re-verified June 2026)
- [Create custom subagents — code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents) — `Agent` tool, nested spawn since **v2.1.172**, **fixed depth-5 background cap** ("does not receive the Agent tool … fixed and not configurable, exists to prevent runaway concurrent trees"), foreground self-limiting, `maxTurns`, `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`/`CLAUDE_CODE_FORK_SUBAGENT`, **no documented cap on concurrent background-subagent count**, background auto-deny permissions, plugin-subagents ignore hooks (HIGH, re-verified June 2026)
- `~/.claude/.../memory/MEMORY.md` — caveman = token-economy mechanism; grugops sequential role-load history; A3/DOG-02 → next-milestone moot framing; TS pivot ratified (HIGH for project-internal context)

**Open / `UNKNOWN - verify`:**
- grugops's own task-success / cost gain from decentralization is UNVERIFIED — DeLM's +9.3pp/~50% are on DeLM's harness, not grugops's. The pitch stands on auditability+gating+governance (demonstrable), NOT borrowed benchmarks. Resolve only with a real dogfood cost/success measurement (Phase 26).
- Exact `PIPE_BUF` across target OSes bounds append-atomicity — sidestep by `atomicWrite`-ing the JSONL or keeping lines <512B; do not put `PIPE_BUF` on the correctness path (STACK.md).
- Whether `isolation: worktree` code-edit agents can still read/write the *non-isolated* `.grugops/context/` path — verify during dogfood (STACK.md); if worktree re-roots the path, source-editing agents must publish notes via the main-repo path.
- Whether naive `mkdir`/rename atomic claim is robust enough under true Claude Code parallel spawn vs needing advisory leases (the `mcp_agent_mail` file-lease pattern is the documented fallback) — a dogfood question (FEATURES.md).

---
*Pitfalls research for: decentralizing grugops (v2.0) — a portable file-based agent-factory kit moving to a shared verified context + file-based queue + parallel agents (Claude Code primary, four CLIs degrade to sequential)*
*Researched: 2026-06-16*
