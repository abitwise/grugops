# Feature Research

**Domain:** Decentralized multi-agent systems with a shared verified context — re-architecting grugops (a file-based, markdown agentic-SDLC kit) from a centralized Orchestrator + static handoff packets to parallel agents claiming work from a queue and building on one shared, verified, **auditable + human-gated** context. (v2.0 "Decentralized Factory")
**Researched:** 2026-06-16
**Confidence:** HIGH on prior-art patterns (blackboard, stigmergy, AutoGen/CrewAI/LangGraph/Swarm/Anthropic guidance, and DeLM's own mechanics are all well-documented and cross-verified). HIGH on the differentiation thesis (DeLM's verifier validates *grounding*, not *correctness*, and the paper explicitly has NO human-in-the-loop/audit — verified from the paper itself; that gap is grugops's wedge). MEDIUM on exact mapping to grugops's lean→enterprise dial and on file-concurrency tactics for the 5 host CLIs (design choices, not external facts).

> **Framing.** grugops ships **NO runtime, DB, or queue** (PROJECT.md Out of Scope, hard). Every "feature" below is something grugops ENCODES as markdown (role text, workflow steps, a context-note schema, a file-based queue convention) + its zero-runtime-dep TypeScript tooling layer (committed `.js`, Node 22+) + the `factory.config.json` dial. Read "feature" as "a coordination/verification primitive grugops realizes in files." The two-voice rule still applies (caveman in role prompts; clear professional English in safety/audit/governance). The v2.0 decisions are LOCKED: parallel-first / Claude Code primary (4 others degrade to sequential, never break); clean replacement of static handoffs by the shared context; extract best-of-DeLM and differentiate on auditable + human-gated.

---

## Existing grugops capabilities this milestone builds on (the dependency substrate)

Every feature below is rated for **complexity** AND **dependency on existing grugops capabilities**. The reusable substrate already shipped:

- **§14 quality gate** (`05-pr-quality-gate.md`) + **no-fabrication / `UNKNOWN - verify`** + **test-integrity checker** — this is grugops's ready-made **verifier**. DeLM has to *build* a verifier (string-match + cheap-LLM grounding check); grugops already ships a stronger, un-cheatable one. **The single biggest reuse.**
- **Traceability trail** (`plans/traceability.md`) + **board-as-state** (`plans/board.md`, WIP-limited) + **handoff packets** (`plans/handoffs/<ID>-<stage>.md`) — the board is a primitive queue/state plane today; the handoffs are the thing being *replaced* by the shared context.
- **Config dial** (`factory.config.json`, lean→enterprise on one flag) — the scaling mechanism for every new knob.
- **Mechanical prod-deploy hook** (PreToolUse, fails closed) + **humans-hold-merge/deploy** — UNCHANGED, the hard floor.
- **TS tooling layer** (zero-runtime-dep committed `.js`, freshness-checked, Node 22+) — where any atomic-claim / context-validation / compaction helper must live (markdown can't enforce atomicity; a tiny runnable can).
- **Caveman = token economy** — terse role text IS the cost-reduction mechanism; DeLM's "~50% cost" win and grugops's token-economy ethos are the same goal from two angles (compact context + compact prose).

---

## Prior Art: how decentralized shared-context multi-agent systems actually work

Survey beyond DeLM, with the reusable pattern extracted for each.

### 1. Classic BLACKBOARD architecture (the original shared-context AI pattern, 1970s Hearsay-II)
Three elements: the **blackboard** (central shared store of facts + partial solutions), **knowledge sources** (independent expert agents that don't know each other exists), and a **control component** (monitors the blackboard, decides which KS to fire next).
- **Got right:** decoupling (KSs coordinate *only* through the shared store, never directly — exactly grugops's "no agent-to-agent bus" goal); incremental/opportunistic solution-building; the control component is a *scheduler*, not a router that data flows through.
- **Concurrency/conflict:** if two KSs operate on different keys they run concurrently with **per-key locks or optimistic concurrency**; when KSs produce conflicting/overlapping solutions a **conflict-resolution step in the control component** reconciles and picks the most promising. This is the canonical answer to "how do parallel writers not corrupt the store."
- **Reusable for grugops:** the **shared verified context = the blackboard**; the **§14 gate + verifier = admission control onto the blackboard**; the **shrunk Orchestrator = the control component** (a scheduler/decomposer + human-gate holder, NOT a data router). Per-key (= per-note / per-task) locking maps cleanly to a **per-file** convention. Conflict resolution maps to "last-verified-write-wins on a note label, with an append-only history so nothing is lost."

### 2. STIGMERGY (indirect coordination through the shared environment; ant pheromone trails → file-system traces)
Agents coordinate by leaving **traces in a shared environment** that trigger the next action — no central plan, no direct messaging. Software example from the literature: agent A drops a file in an output dir; agent B watches that dir and starts when files appear. Reported as **scalable, robust to single-point failure, low overhead** — but **hard to debug and hard to guarantee global coherence**.
- **Reusable for grugops:** the shared context *is* the environment; a verified note is a pheromone trail ("this path failed → treat as a constraint," exactly DeLM's failure-as-constraint). A **claimed task file** is a trace that suppresses duplicate work. grugops's existing **board + file conventions are already a stigmergic medium** — this milestone formalizes it. The honest caveats (debuggability, global coherence) map directly to grugops's differentiators: the **audit trail (git log over append-only files) IS the debuggability answer**, and the **human gate IS the global-coherence backstop**.

### 3. Modern LLM-agent frameworks (current 2026 capabilities, verified)

| Framework | Shared context | Task distribution / handoff | Verification | Memory / compaction | Parallel vs sequential |
|---|---|---|---|---|---|
| **AutoGen** (Microsoft) | Conversation history, in-memory by default | `GroupChat` conversational orchestration | None built-in | In-memory conversation, no compaction primitive | Conversational; weak true-parallel |
| **CrewAI** | Task outputs passed sequentially | Role-based crews + process types; handoffs as structured JSON | None built-in | Sequential output passing | Mostly sequential; role-team model |
| **LangGraph** | **Persistent state graph + checkpointing (time-travel)**; **reducer logic merges concurrent updates** | Directed graph w/ conditional edges; deterministic | None built-in (you wire it) | Checkpoints; durable state | Strongest concurrency control (reducers resolve concurrent writes) |
| **OpenAI Swarm → Agents SDK** | **Stateless between calls**; `context_variables` must carry ALL state forward — "no hidden memory" | `handoff` = a function returning the next agent; "routines" | None built-in | None (stateless); SDK is the production successor to the Oct-2024 Swarm experiment | Lightweight; handoff-driven, sequential |
| **Anthropic multi-agent research** (orchestrator-worker) | **Subagents get a fresh context window and DON'T know each other exists**; lead agent decomposes upfront | Lead agent assigns self-contained subtasks (objective + output format + boundaries) | "people testing agents find edge cases evals miss" — verification is human + evals, not a primitive | Agents "store essential info in external memory before proceeding"; resume-from-checkpoint, retry logic | **Parallel** subagents, **but explicitly: less effective for tightly-interdependent tasks like coding** |

**Cross-framework facts that matter for grugops:**
- **None of the five ships a built-in correctness verifier.** Verification is left to the user. grugops already HAS one (the §14 gate). This is the recurring gap.
- **LangGraph's reducer** is the cleanest concurrent-write-merge answer in the field — the file-based analog grugops needs is "per-note last-verified-write-wins + append-only history," realized as a file convention + a tiny TS merge/lock helper.
- **OpenAI Swarm's "no hidden memory, every handoff carries all context"** is the *opposite* of grugops's target (shared persistent context); it's the design grugops is moving *away from* (it's basically the static-handoff model). Useful as a contrast.
- **Anthropic's two hard warnings:** multi-agent uses **~15× the tokens** of a single chat, and is **less effective for tightly-interdependent work like coding** (many inter-agent dependencies, real-time coordination is weak). grugops's domain IS coding/SDLC — so the DeLM bet (shared *verified* context lets agents build on each other's *checkpointed* progress instead of coordinating in real time, and *cuts* cost ~50%) is precisely the mechanism that makes multi-agent viable for coding. grugops must lean on the **shared-verified-context + queue** design, NOT real-time agent chatter, and must keep the context **compact** (caveman/compaction) to avoid the 15× blow-up.

### 4. What makes DeLM genuinely NOVEL — and where grugops differentiates

**DeLM's actual mechanics (verified from arXiv 2606.10662):**
- **Shared verified context** stores compact `(label, gist)` entries; agents read **lock-free snapshots at dispatch time** (later commits visible only on next snapshot); **write-before-publish ordering** so later agents see only fully-verified entries. Tags seen in traces: `FACT`, `FAIL`, `PATCH_SUMMARY`, `CONSTRAINT` (no formal JSONL schema published).
- **Task queue** is **dependency-aware** (`[deps:…]`); agents asynchronously draw tasks; when exhausted, **one agent takes a queue lock and generates more subtasks**. (No fine-grained concurrent-claim locking is disclosed — a real gap to design around.)
- **Verifier (two-stage):** Stage-1 is **programmatic string-match** (a bullet's head+tail words must appear verbatim, in order, in the source — i.e. it verifies the note is *grounded in the source*, not that it's *correct*); Stage-2 is a **cheap LLM** (e.g. DeepSeek-V4-Flash) checking hallucination/semantic-drift/missing-qualifiers. Rejected writes are regenerated with feedback up to a retry limit.
- **Memory compaction = hierarchical summarization** (Stage-1 atomic ref-tagged bullets → Stage-2 highly-compact gists; agents read gists by default and **selectively unfold** to summary/raw only when needed). **Cost saving comes from three sources:** shared failures become reusable constraints (no private dead-ends); compact patch-summaries replace full traces; selective unfolding amortizes detailed reads.
- **Numbers (verified):** SWE-bench Verified — **65.7% Avg@1 / 72.9% Pass@2 / 77.4% Pass@4**, **+9.3pp Avg@1** over the strongest baseline (AOrchestra-Parallel), **~$0.12/task ≈ half the cost** of the strongest agentic baselines. LongBench-v2 Multi-Doc QA — **+ up to 5.7pp** (GPT-5.4), best/tied-best in most domain-model combos. (The milestone brief's "+up to 10.5pp / ~50% cost" is the headline-abstract figure; the per-table SWE-bench gain is +9.3pp — cite both honestly.)
- **DeLM's stated limitations:** admission-time verification adds overhead; quality is bounded by decomposition quality (coarse splits → under-specified subtasks); model-family-specific prompts. **Critically: the paper makes NO mention of human-in-the-loop review, audit mechanisms, or governance** (confirmed directly from the paper).

**The honest novelty of DeLM:** the *combination* of (a) admission-time **verification before a write is published** (most frameworks let any agent write anything), (b) **failure-as-shared-constraint** (turning private dead-ends into collective progress), and (c) **compaction-for-cost** baked into the substrate. That trio is what buys "+ task success AND −50% cost simultaneously," which is rare.

**Where grugops differentiates (the defensible niche):** DeLM's verifier proves a note is **grounded** (string-matches the source) and **non-hallucinated** — it does NOT prove the note is **correct**, **tested**, **secure**, or **release-worthy**, and it has **no human gate and no audit story**. grugops's existing machinery answers exactly those:
  - **Verified means PASSED THE §14 GATE** (lint + typecheck + unit + build + Playwright UI/E2E + visual-regression + test-integrity), not just "grounded in a source." A write to the shared context is admitted only with gate evidence — the **un-cheatable, behavior-level verifier DeLM lacks**.
  - **Auditable by construction:** append-only verified-context files under git → **`git log` is a free, tamper-evident audit trail** (a recognized 2026 pattern — Squad's `decisions.md` drop-box, ESAA event-sourcing for agents). The requirement→code→test→release **trace is the proof**; DeLM has no trace.
  - **Human-gated:** humans still hold merge/deploy (mechanical hook, unchanged); the shrunk Orchestrator is the **human-gate holder**. A regulated team can require named human admission of high-severity context entries. DeLM is fully autonomous.
  - **Dialable lean→enterprise:** one flag scales from "solo builder, verify-then-write, no ceremony" to "regulated, named-human context admission + full ASVS gate + retained audit." No competitor offers governance-on-a-dial over a decentralized substrate.

> **Differentiation thesis (sharp + honest):** "**Verifiable, gated, auditable decentralized agentic delivery**" is a defensible niche. DeLM proved the *decentralized + verified-context + cheap* mechanism works for coding; grugops's edge is that its "verified" is **behavior-tested and human-gated**, its substrate is **plain files with a git audit trail**, and its depth is **dialable to enterprise governance** — none of which DeLM, AutoGen, CrewAI, LangGraph, Swarm, or Anthropic's research system provides as a packaged whole. **What grugops does NOT get to claim:** novel coordination science (that's DeLM's), or the raw benchmark numbers (those are DeLM's on its harness; grugops's gains are unproven until dogfooded — `UNKNOWN - verify` until then). The edge is **trust + auditability + governance over a borrowed, sound mechanism**, not a better benchmark.

---

## Feature Landscape

### Table Stakes (must have to be a credible decentralized shared-context system)

Missing any of these = the re-architecture isn't actually decentralized, or isn't safe to trust.

| Feature | Why Expected | Complexity | Dependency on existing grugops |
|---|---|---|---|
| **Shared verified context substrate** — typed notes (e.g. `FACT` / `FAIL` / `CONSTRAINT` / `PATCH_SUMMARY` / `DECISION`), read-before-act, write-after-verify; the sole inter-role memory | This IS the architecture; it replaces handoffs (PROJECT.md). Without it there's no shared context | HIGH | NEW file schema; reuses `plans/` state-plane location + traceability ID scheme + handoff field knowledge (handoffs are *removed*, their content migrates here) |
| **Verify-before-write admission control** | Unverified writes = context pollution = cascading failure (the #1 documented multi-agent failure mode). Every credible design (blackboard control component, DeLM verifier) gates admission | MEDIUM | **HIGH reuse** — the §14 gate + `UNKNOWN - verify` + test-integrity checker ARE the verifier; mostly wiring, not new verification |
| **File-based task queue + atomic async claim** | Decentralized agents must claim work without a central router and without double-claiming. Blackboard per-key locks, DeLM async draw, the file-based "one read per claim, O(1)" pattern all confirm this is table stakes | HIGH | Board-as-state exists as a coarse queue; needs an **atomic claim** primitive — markdown can't guarantee atomicity, so a tiny TS helper (rename-based / lockfile / `O_EXCL`) on the existing tooling layer |
| **Parallel agents on Claude Code (sub-agent spawn) + graceful sequential degradation on the other 4 CLIs** | Locked v2.0 decision; true async parallelism needs spawning (only Claude Code provides it reliably). The other four must run the SAME shared context sequentially, never break | HIGH | Reverses the v1.1 no-spawn decision **for Claude Code only**; reuses single-source role text + adapter-pointer model; the 4 sequential CLIs reuse today's single-window role-load |
| **Memory / trajectory compaction** | Without it, shared context grows unbounded → context rot / lost-in-the-middle / 15× token blow-up (Anthropic's warning). Compaction is what makes DeLM both better AND cheaper | MEDIUM | Aligns with **caveman = token economy**; compaction is "write the compact verified gist, keep raw in a referenced file." A small TS compaction helper + a note-write discipline |
| **Append-only, git-tracked context history (audit trail)** | A decentralized store with no history is undebuggable (stigmergy's known weakness) and unauditable. Append-only + git log is the recognized 2026 answer | LOW–MEDIUM | Reuses git + the markdown-only ethos; the trace/traceability discipline already exists. "Free audit trail via `git log`" |
| **Orchestrator redefinition** — from sole router/bottleneck → bootstrap + decompose + human-gate holder (the blackboard "control component" / scheduler) | A central router that all data flows through recreates the bottleneck DeLM exists to kill. The Orchestrator must schedule + gate, not relay | MEDIUM | Rewrites `orchestrator.md`; reuses its existing routing-matrix/WIP/DoR/XL-split knowledge, recast as decompose+schedule+gate |
| **Clean removal of static handoff packets** + rewire every role/workflow to read/write the shared context | Locked decision; two memory models (handoffs + context) = drift and the retired A3/DOG-02 dual-path problem. One substrate only | MEDIUM–HIGH | Touches ~all 17 roles + 14 workflows + handoff templates (deletion + rewire); honestly retires UAT-AUTO-04 |
| **Humans hold merge/deploy — UNCHANGED, mechanical** | The hard safety floor; decentralization must not erode it | NONE (preserve) | The prod-deploy PreToolUse hook is untouched |

### Differentiators (grugops's edge — where it beats DeLM and the frameworks)

| Feature | Value Proposition | Complexity | Dependency on existing grugops |
|---|---|---|---|
| **"Verified" = passed the §14 behavior gate**, not just "grounded in a source" | DeLM's verifier proves grounding/non-hallucination; grugops proves **lint+type+unit+build+UI/E2E+visual+test-integrity**. A context note carrying gate evidence is trustworthy at a level no surveyed system offers | MEDIUM | **HIGH reuse** — the gate exists; the new work is "a write to context REQUIRES a gate verdict, and the verdict + evidence ride in the note" |
| **Auditable verified context — git-log trace as tamper-evident proof** | The requirement→code→test→release trace *is* the value prop; over an append-only context it becomes a per-decision audit trail (who/what/when/which gate). DeLM has none; this is grugops's identity | LOW–MEDIUM | Reuses traceability + git; the discipline already exists, now applied to context writes |
| **Human-gated context admission (dialable)** — agent *proposes* a verified note; for high-severity entries a named human *admits* it (same agent-proposes / human-disposes pattern as the prod-deploy hook) | "Humans decide, agents execute" extended to memory itself. Regulated teams can require human admission of security/architecture/release notes. No competitor gates the shared memory | MEDIUM | Reuses the prod-deploy hook pattern + dial; new is a severity→admission rule on context writes |
| **Governance-on-a-dial over the decentralized substrate** (lean: verify-then-write, zero ceremony; enterprise: named-human admission + full-ASVS verifier + retained audit + WIP/queue policy) | One flag scales a decentralized factory from solo-sane to regulated-audit-grade. This is grugops's whole thesis applied to the new architecture — and it's the unique combination | MEDIUM | Reuses `factory.config.json`; new knobs hang off `mode`/`compliance_regime` |
| **Failure-as-shared-constraint, encoded honestly** (a verified `FAIL` note becomes a `CONSTRAINT` other agents must honor — DeLM's key cost-win, made auditable + with no-fabrication floor) | Turns private dead-ends into collective, *recorded* progress; the no-fabrication rule means a `FAIL` can't be hand-waved away. Both a cost win and a trust win | LOW–MEDIUM | New note types; reuses `UNKNOWN - verify` / no-fabrication discipline |
| **Board-as-state stays the human-readable queue + dashboard** | The queue isn't a hidden runtime structure (DeLM/LangGraph) — it's the visible, WIP-limited markdown board a human can read at a glance. Decentralized *and* legible | LOW–MEDIUM | The board exists; recast it as the human-facing view of the file-based queue |
| **Zero-runtime-dep, plain-files substrate** (no DB, no queue server, no hosted service) | DeLM/LangGraph/AutoGen need a Python runtime + libraries; grugops's whole context+queue+audit is files + committed `.js`, droppable onto a CLI you already run. Lowest-friction decentralized factory | MEDIUM | Reuses the TS tooling layer + markdown-only ethos; the atomic-claim/merge helpers must respect zero-runtime-dep |
| **Compaction as a first-class, dialable token-economy control** (DeLM's compaction + grugops's caveman ethos, exposed on the dial so enterprises can keep more raw context, solo keeps it tight) | Directly attacks Anthropic's 15× token warning; makes the ~50% cost story configurable rather than fixed | MEDIUM | Aligns caveman = token economy; new compaction knob + helper |

### Anti-Features (avoid — tie back to grugops Out of Scope and to documented failure modes)

| Anti-Feature | Why tempting | Why problematic | Alternative |
|---|---|---|---|
| **A central message bus / orchestrator that all updates route through** | "Coordinate everything in one place" | Recreates the exact bottleneck DeLM exists to eliminate; the Orchestrator becomes the integration choke point again. Documented "full-state rebroadcast" pattern is a known scaling failure | Shrink the Orchestrator to a scheduler + gate (blackboard control component); agents coordinate **only** through the shared context, never agent-to-agent or via a relay |
| **Unbounded shared context (append everything, never compact)** | "Keep all the history; don't lose anything" | Context rot, lost-in-the-middle, 15× token blow-up (Anthropic), exponential cost with run length — the dominant multi-agent failure mode | Compact verified gists by default + selective-unfold to referenced raw; append-only **history** is fine on disk (git), but the **active context** an agent reads must be compact |
| **A hosted platform, database, queue server, or custom LLM runtime** | "A real queue needs a real broker / DB" | Directly violates PROJECT.md Out of Scope ("not a platform, runtime, database, queue, or hosted service"); something to operate, breaks "boring on purpose" | File-based queue + atomic claim via a tiny committed-`.js` helper (rename/`O_EXCL`/lockfile), git for history. Zero infra to run |
| **Autonomous merge/deploy or autonomous high-severity context admission** | "Decentralized + fast = let agents finish the job" | Crosses the hard safety floor; "humans decide, agents execute" must stay mechanical; an agent can't be held accountable | Mechanical prod-deploy hook UNCHANGED; agent *proposes* verified notes, human *admits* the high-severity ones (dialable) |
| **Direct agent-to-agent real-time chatter / negotiation** | "Agents should just talk to coordinate" | Anthropic: LLMs "are not yet great at coordinating in real time"; tightly-coupled coding work is exactly where this fails; adds non-determinism and token cost | Indirect coordination through the verified context only (blackboard/stigmergy discipline) — leave a verified trace, don't hold a conversation |
| **A correctness verifier that only checks grounding/format (DeLM-style) and calls it "verified"** | "DeLM does it, it's enough" | "Grounded in a source" ≠ "correct/tested/secure." Calling a string-matched note "verified" would forfeit grugops's entire trust differentiator | "Verified" must mean **passed the §14 behavior gate**; grounding/format checks are necessary but not sufficient |
| **Optimistic let-anyone-write, reconcile-conflicts-later** | "Faster, fewer locks" | Concurrent unverified writes + late reconciliation = the overwrite/pollution failure (agents overwriting each other's context — a documented top failure) | Verify-before-write admission + per-note (per-file) atomic claim + last-verified-write-wins with append-only history (blackboard per-key concurrency, LangGraph reducer analog) |
| **Forcing strict 5-tool parity onto the parallel design** | "Don't abandon the other CLIs" | Already retired (locked decision); forcing parity to the lowest common denominator forfeits the whole DeLM speed/cost win | Claude Code primary (parallel); the other four degrade to **sequential over the same shared context** — same substrate, slower lane, never broken |
| **A bespoke audit-log database / event-sourcing framework** | "Auditing needs real event sourcing" | More infra to run; violates Out of Scope; reinvents what git already gives free | Append-only markdown context files under git → `git log` is the audit trail (recognized 2026 pattern; no framework needed) |

## Feature Dependencies

```
Orchestrator redefinition (bootstrap + decompose + schedule + human-gate)
    └──enables──> File-based task queue + atomic async claim
                      └──requires──> atomic-claim helper on the TS tooling layer (markdown can't guarantee atomicity)
                      └──feeds──> Parallel agents (Claude Code spawn) ── degrades to ──> Sequential agents (other 4 CLIs)
                                       └──all read/write──> Shared verified context substrate (typed notes)
                                                                 └──gated by──> Verify-before-write admission
                                                                                    └──IS──> §14 quality gate + test-integrity + UNKNOWN-verify (EXISTS)
                                                                                    └──for high-severity──> Human-gated context admission (dialable)
                                                                 └──kept compact by──> Memory/trajectory compaction (dialable)
                                                                 └──recorded as──> Append-only git-tracked history (audit trail)
                                                                                        └──surfaced by──> Board-as-state (human-readable queue view)

Clean removal of static handoff packets ──requires──> Shared verified context substrate (the replacement must exist first)
                                          ──rewires──> all 17 roles + 14 workflows
                                          ──retires──> A3/DOG-02 dual-path handoff-parity (UAT-AUTO-04, now moot)

Governance-on-a-dial ──reads──> factory.config (mode + compliance_regime) [EXISTS]
                      ──scales──> verifier depth + human-admission + compaction + queue/WIP policy

Humans hold merge/deploy (prod-deploy hook) ──UNCHANGED, gates──> release; conflicts with──> any autonomous-merge/deploy anti-feature
```

### Dependency Notes

- **Shared verified context must land before handoffs are removed.** The clean replacement is only safe once the substrate exists and roles read/write it — otherwise the factory loses its memory mid-pivot. Roadmap: substrate first, then rewire, then delete handoffs.
- **Verify-before-write IS the §14 gate** — this is the highest-leverage reuse and the core differentiator in one. Wiring "a context write requires a gate verdict + carries the evidence" is mostly plumbing on existing machinery, not new verification science.
- **Atomic claim is the one place markdown is insufficient.** A file-based queue needs a real atomicity primitive (rename-based claim / `O_EXCL` / lockfile) — it belongs in the committed-`.js` tooling layer, must stay zero-runtime-dep, and must work cross-platform (Windows included, the reason TS was adopted).
- **Compaction is not optional polish** — it's the guard against the 15× token blow-up and the enabler of the ~50% cost story; without it the shared context rots. Couple it to the caveman/token-economy ethos and the dial.
- **Orchestrator redefinition gates the decentralization** — if the Orchestrator stays a router, nothing else is actually decentralized. Recast it as scheduler + gate (blackboard control component) early.
- **Parallel (Claude Code) and sequential (4 CLIs) share ONE substrate** — design the context + queue file conventions tool-neutrally; spawning is an execution detail layered on top, not a fork of the data model. This is what keeps "degrade, never break" true.
- **Audit trail is near-free given git + append-only** — lowest-risk, can land alongside the substrate; it's a discipline + file convention, not a build.

## Lean → Enterprise Config Dial Mapping

| Theme | Lean (default-on, solo-sane) | Enterprise / `compliance_regime` non-empty | Config knob (proposed) |
|---|---|---|---|
| Context admission | Agent verifies (§14 gate) then writes; no human in the loop for routine notes | Named-human admission required for high-severity notes (security/architecture/release) | `context.human_admission: off \| high-severity \| all` |
| Verifier depth | Existing §14 lean gate (lint/type/unit/build); grounding+format checks on notes | Full ASVS L2/L3 + UI/E2E + visual as the admission bar | reuse `quality.*` + `security.asvs_level` |
| Compaction | Aggressive compact-gist default (token economy) | Retain more raw/summary context for audit; longer history | `context.compaction: aggressive \| balanced \| retain-raw` |
| Queue / WIP | Light WIP cap; simple atomic claim | Strict WIP + dependency-ordered queue + claim audit | reuse board WIP; new `queue.wip_limit`, `queue.dependency_ordered` |
| Audit retention | git history (free) | git history + retained per-note evidence + provenance header | `context.audit_retention: git \| retained` |
| Parallelism | Claude Code parallel where present; else sequential | same (capability-driven, not policy) | none (capability-detected) |

> **Safety carve-out (NOT dialable down):** verify-before-write (no unverified note enters context), no-fabrication / `UNKNOWN - verify`, test-integrity floor, and humans-hold-merge/deploy. These are the trace's integrity and the safety boundary — on at every level, matching the existing un-dialable floors.

## MVP Definition (for the v2.0 milestone)

### Launch With (v2.0 core)

- [ ] **Shared verified context substrate** (typed notes, read-before-act / write-after-verify, the sole inter-role memory) — the architecture itself
- [ ] **Verify-before-write admission = the §14 gate** (a context write requires a gate verdict + carries evidence; `UNKNOWN - verify` floor) — the core differentiator, highest reuse
- [ ] **File-based task queue + atomic async claim** (committed-`.js` claim helper, zero-runtime-dep, cross-platform) — decentralization needs a non-colliding claim
- [ ] **Orchestrator redefinition** (bootstrap + decompose + schedule + human-gate; no longer a data router) — un-bottlenecks the design
- [ ] **Parallel agents on Claude Code + graceful sequential degradation on the other 4 CLIs** over one substrate — the locked execution model
- [ ] **Memory/trajectory compaction (dialable)** — guards the 15× token blow-up, enables the ~50% cost story
- [ ] **Append-only, git-tracked context audit trail** + board-as-state as its human-readable view — the auditability differentiator
- [ ] **Clean removal of static handoff packets** + rewire all roles/workflows; retire A3/DOG-02 (UAT-AUTO-04 moot) — the bold end-state
- [ ] **Humans hold merge/deploy — preserved unchanged** (prod-deploy hook untouched) — the hard floor

### Add After Validation (v2.x)

- [ ] **Human-gated high-severity context admission** promoted from a documented option to default-on for enterprise — once routine verify-then-write is trusted
- [ ] **Dependency-aware queue ordering** (`[deps:…]`, DeLM-style) — once the flat queue is proven non-colliding
- [ ] **Compaction tuning knobs** (aggressive/balanced/retain-raw) — once the default compaction is validated for token cost

### Future Consideration (beyond v2.0)

- [ ] **Benchmark grugops's own success/cost gain** vs the v1.x centralized model (grugops's analog of DeLM's SWE-bench result) — currently `UNKNOWN - verify`; needs a real dogfood harness
- [ ] **Carry-ins from v1.2** (SKEW-01 kit-version pin, FIX-01 doctor --fix, PLUGIN-01) — unrelated to decentralization, schedule opportunistically

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| Shared verified context substrate | HIGH | HIGH | P1 |
| Verify-before-write = §14 gate | HIGH | MEDIUM (high reuse) | P1 |
| File-based task queue + atomic claim | HIGH | HIGH | P1 |
| Orchestrator redefinition | HIGH | MEDIUM | P1 |
| Parallel (CC) + sequential degrade (4 CLIs) | HIGH | HIGH | P1 |
| Memory/trajectory compaction | HIGH | MEDIUM | P1 |
| Append-only git audit trail | HIGH | LOW–MEDIUM | P1 |
| Clean removal of static handoffs | HIGH | MEDIUM–HIGH | P1 |
| Humans hold merge/deploy (preserve) | HIGH | NONE | P1 |
| Human-gated context admission (dialable) | MEDIUM | MEDIUM | P2 |
| Governance-on-a-dial | HIGH | MEDIUM | P2 |
| Board-as-state as queue view | MEDIUM | LOW–MEDIUM | P2 |
| Benchmark grugops's own gain | MEDIUM | HIGH | P3 |

## Competitor Feature Analysis

| Feature | DeLM (the model) | AutoGen / CrewAI / Swarm | LangGraph | Anthropic multi-agent research | grugops v2.0 approach |
|---|---|---|---|---|---|
| Shared context | Verified `(label,gist)`, lock-free snapshots, write-before-publish | Conversation history / sequential output / stateless-handoff | Persistent state graph + checkpoints | Fresh per-subagent window, no sharing | **Verified typed notes in plain files**, read-before-act/write-after-verify, append-only + git |
| Verification | Grounding string-match + cheap-LLM semantic check (NOT correctness) | None built-in | None built-in (you wire it) | Human testing + evals | **§14 behavior gate** (lint/type/unit/build/UI-E2E/visual/test-integrity) + `UNKNOWN-verify` |
| Task distribution | Dependency-aware queue, async draw, single-lock refill | Conversational / role-team / handoff-function | Directed graph + conditional edges | Lead-agent upfront decomposition | **File-based queue, atomic async claim**, WIP-limited board as the human view |
| Concurrent-write conflict | Write-before-publish ordering (fine-grained locking undisclosed) | N/A (mostly sequential) | **Reducers merge concurrent updates** | Workers isolated, no shared writes | **Per-note atomic claim + last-verified-write-wins + append-only history** |
| Memory / compaction | Two-stage hierarchical summarization + selective unfold | None / in-memory | Checkpointing | "Store to external memory before proceeding" | **Dialable compaction** (caveman/token-economy), compact gist + referenced raw |
| Audit / governance | **None** | None | None (state is inspectable, not audit-designed) | Human-in-loop testing, not audit | **git-log audit trail + human-gated admission + governance-on-a-dial** |
| Runtime footprint | Python framework | Python framework | Python framework | Internal system | **Plain files + zero-runtime-dep committed `.js`** on the CLI you already run |
| Safety floor | Not addressed | Not addressed | Not addressed | Human testing | **Mechanical prod-deploy hook; humans hold merge/deploy (unchanged)** |

## Sources

- [Decentralized Multi-Agent Systems with Shared Context (DeLM) — arXiv 2606.10662 abstract](https://arxiv.org/abs/2606.10662) (HIGH)
- [DeLM full text — arXiv 2606.10662 HTML](https://arxiv.org/html/2606.10662) (HIGH — verifier two-stage mechanics, write-before-publish, dependency-aware queue, per-table numbers, "no human-in-the-loop/audit" confirmed)
- [DeLM source — github.com/yuzhenmao/DeLM](https://github.com/yuzhenmao/DeLM/tree/main/src/) (HIGH)
- [What is a blackboard system (AI)? — Klu](https://klu.ai/glossary/blackboard-system) (HIGH)
- [Blackboard Architecture in Agentic AI — DataFlair](https://data-flair.training/blogs/blackboard-architecture-in-agentic-ai/) (MEDIUM)
- [Collaborative Problem-Solving in Multi-Agent Systems with the Blackboard Architecture — Engineering Notes](https://notes.muthu.co/2025/10/collaborative-problem-solving-in-multi-agent-systems-with-the-blackboard-architecture/) (MEDIUM — per-key locks / optimistic concurrency / conflict-resolution in control component)
- [Stigmergy — Wikipedia](https://en.wikipedia.org/wiki/Stigmergy) (HIGH)
- [Coordination Mechanisms in Multi-Agent Systems — apxml](https://apxml.com/courses/agentic-llm-memory-architectures/chapter-5-multi-agent-systems/coordination-mechanisms-mas) (MEDIUM — file-in/out-dir stigmergy software example)
- [How we built our multi-agent research system — Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system) (HIGH — 15× token multiplier, coding-is-tightly-interdependent warning, subagents-don't-talk, external-memory + resume)
- [LangGraph vs CrewAI vs AutoGen 2026 — Towards AI](https://pub.towardsai.net/langgraph-vs-crewai-vs-autogen-which-ai-agent-framework-should-your-enterprise-use-in-2026-3a9ebb407b09) (MEDIUM — orchestration models, reducer concurrent-merge, checkpointing)
- [CrewAI vs LangGraph vs AutoGen 2026 — Pooya Golchian](https://pooya.blog/blog/crewai-vs-langgraph-autogen-comparison-2026/) (MEDIUM — handoffs as structured JSON, state-persistence differences)
- [OpenAI Swarm: routines and handoffs — VentureBeat](https://venturebeat.com/ai/openais-swarm-ai-agent-framework-routines-and-handoffs) (HIGH — handoff = function returning next agent)
- [openai/swarm — GitHub](https://github.com/openai/swarm) (HIGH — stateless, context_variables carry all state, superseded by Agents SDK)
- [Why Multi-Agent LLM Systems Fail — Galileo](https://galileo.ai/blog/multi-agent-llm-systems-fail) (HIGH — 79% of failures are specification/coordination; overwriting context)
- [Why Multi-Agent LLM Systems Fail — Redis](https://redis.io/blog/why-multi-agent-llm-systems-fail/) (MEDIUM — context poisoning/pollution, unbounded context, full-state rebroadcast bottleneck, context rot / lost-in-the-middle)
- [Why Multi-Agent Systems Need Memory Engineering — MongoDB/Medium](https://medium.com/mongodb/why-multi-agent-systems-need-memory-engineering-153a81f8d5be) (MEDIUM)
- [How Squad runs coordinated AI agents inside your repository — GitHub Blog](https://github.blog/ai-and-ml/github-copilot/how-squad-runs-coordinated-ai-agents-inside-your-repository/) (HIGH — append-to-decisions.md drop-box, git log = free audit trail, file-claim O(1))
- [ESAA: Event Sourcing for Autonomous Agents in LLM-Based Software Engineering — arXiv 2602.23193](https://arxiv.org/pdf/2602.23193) (MEDIUM — append-only logs, attribution of state changes under concurrency)
- [mcp_agent_mail — GitHub (Dicklesworthstone)](https://github.com/dicklesworthstone/mcp_agent_mail) (MEDIUM — advisory file leases, per-agent JSONL inboxes — a counter-example bus pattern to avoid)
- [TRiSM for Agentic AI — arXiv 2506.04133](https://arxiv.org/pdf/2506.04133) (MEDIUM — trust/risk/security management framing for the governance angle)

**Open / `UNKNOWN - verify`:**
- grugops's own task-success / cost gain from decentralization is UNVERIFIED — DeLM's +9.3pp/~50% are on DeLM's harness, not grugops's. Do NOT claim grugops's numbers until a real dogfood benchmark exists. The differentiation thesis rests on **auditability + gating + governance**, which are demonstrable, not on benchmark superiority.
- DeLM discloses **no fine-grained concurrent-claim locking** (only a single-lock queue refill). grugops must DESIGN its atomic-claim primitive (rename/`O_EXCL`/lockfile on the TS layer) — this is novel-to-grugops engineering, `UNKNOWN - verify` the cross-platform behavior (esp. Windows) until tested.
- Whether plain-file atomic claim is robust enough under true Claude-Code parallel spawn (vs needing advisory leases) is a dogfood question — verify during implementation; the mcp_agent_mail "file lease" pattern is the fallback if naive claim races.

---
*Feature research for: decentralized multi-agent systems with a shared verified context — grugops v2.0 Decentralized Factory*
*Researched: 2026-06-16*
