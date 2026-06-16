# Architecture Research

**Domain:** grugops v2.0 — integrating a *decentralized* shared-verified-context architecture (DeLM's three primitives, differentiated by an auditable + human-gated verifier) into an existing centralized-Orchestrator + static-handoff markdown agent-factory kit; one substrate, two execution modes (Claude Code parallel primary; four CLIs degraded-sequential).
**Researched:** 2026-06-16
**Confidence:** HIGH on the integration points (grounded in the actual `agent-factory/` + `scripts/` tree, read directly this session) and on the three sibling research files (STACK/FEATURES/PITFALLS, all read). MEDIUM where a recommendation is a *design choice* (queue layout, exact note-section shape, phase boundaries) rather than a documented capability or an existing-file fact.

> **Read first — this is an INTEGRATION study, not greenfield.** grugops ships **no runtime, DB, or queue**. The deliverable is markdown (roles, workflows, a context-note schema, a queue convention) + the zero-runtime-dep committed-`.js` TypeScript tooling layer (Node 22+, dev-deps `{typescript, vitest, @types/node}` never shipped). Every recommendation below is expressed as **which existing file-type gets a NEW file vs a MODIFIED file**, plus the new data-flow (context read/write/claim) that replaces the old one (handoff packets). This file BUILDS ON the three sibling files and contradicts none of them: zero-dep, markdown-first, `node:fs`-only concurrency, Claude-Code nesting-since-v2.1.172, foundation-first ordering. Where they already settled a fact (note schema, atomic primitives, spawn mechanics, pitfall→phase mapping) this file *wires it in*, it does not re-derive it.

---

## The pivot in one sentence

The **handoff packet** (a frozen-format markdown file passed stage-to-stage, the sole inter-role memory) is replaced by the **shared verified context** (per-task append-only typed notes, read-before-act / write-after-verify, the sole inter-role memory); the **Orchestrator** stops being the router every datum flows through and becomes a **bootstrap/decompose + schedule + human-gate** control component; and **Claude Code** gains parallel sub-agent execution while the **other four CLIs** run the *same* files sequentially.

The maxim mutates: **"the handoff is the memory" → "the verified context is the memory."** Everything else (board = state, gate = backpressure, trace = proof, humans decide) is preserved — and the gate becomes load-bearing in a new place: it is now the *admission verifier* for the memory itself.

---

## Standard Architecture

### System Overview — the kit's file-type layers (what v2.0 touches)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ENTRY / DISPATCH   (single-source: content lives ONCE; adapters point)        │
│  AGENTS.md  •  .claude/ adapters (+ NEW: coordinator grants Agent(<allowlist>)) │
│  •  plugin form (spawning Orchestrator ships STANDALONE, never the plugin)      │
│  → v2.0: AGENTS.md gains a "Shared context" rule + context cmd slots; the WR-05  │
│    guard INVERTS (only-the-coordinator-may-spawn); per-tool pointers unchanged   │
├──────────────────────────────────────────────────────────────────────────────┤
│  ROLES  agent-factory/roles/*.md   (18 today incl. _role-switch-protocol)        │
│  orchestrator (router → DECOMPOSER+SCHEDULER+GATE) • 16 specialists (rewired to  │
│  read-context / write-verified-note instead of read/write-handoff) • _role-switch-│
│  protocol (step-4 rewired: handoff → context note; + parallel claim variant)     │
├──────────────────────────────────────────────────────────────────────────────┤
│  WORKFLOWS  agent-factory/workflows/*.md   (16 today)                            │
│  00–13 lifecycle/ceremony + 14 ui + 15 security  → ALL rewired off handoffs onto  │
│  the context substrate                                                            │
│  + NEW workflows: 16 context read/write/verify-admit • 17 task-claim/queue-drain  │
│    • 18 compaction • (decompose folds into orchestrator/00-01 bootstrap)          │
├──────────────────────────────────────────────────────────────────────────────┤
│  CONTRACTS  handoffs/ (17 templates) → REMOVED  •  checklists/ (14)              │
│  ✗ all 17 handoff templates DELETED (clean replacement)                          │
│  + NEW: context-note.md schema/template (typed note + provenance fence)          │
│  + NEW: a verify-admission checklist; DoR/DoD gain context-admission lines        │
├──────────────────────────────────────────────────────────────────────────────┤
│  STATE PLANE (per-repo STATE, seeded skip-if-exists)                             │
│  plans/board.md (= human view of the queue) • plans/traceability.md (REQ chain    │
│  migrates onto notes) • plans/metrics.md                                          │
│  + NEW: .grugops/context/<task>.md + <task>.events.jsonl + threads/<agent>.md     │
│  + NEW: .grugops/queue/{pending,claimed,done}/                                    │
│  ✗ plans/handoffs/ seed REMOVED                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  DIAL  .grugops/factory.config.json  (+ byte-twin .md + seed copy — 3 in lockstep)│
│  + NEW keys: context.{human_admission,compaction,audit_retention} •              │
│    queue.{wip_limit,dependency_ordered}  (reuse quality.*/security.* for verifier) │
├──────────────────────────────────────────────────────────────────────────────┤
│  TS TOOLING LAYER  scripts/*.ts → committed .js (zero-dep, freshness-checked)    │
│  + NEW: context-io.ts (atomicWrite/appendNote/readContext) • claim.ts (queue) •   │
│    compactor.ts                                                                    │
│  MOD: validate-agent-factory.ts (drop 16 handoff names; add note/provenance/      │
│    verify-stamp + board↔queue checks) • check-foundation-guards.ts (invert        │
│    guard_wr05; + guard_context_writes; + guard_verify_stamp) • check-uat-oracles.ts│
│    (replace oracleParity A3 with the dual-path EQUIVALENCE oracle) •               │
│    generate-catalog.ts (document context substrate, not handoffs) • freshness +    │
│    catalog-freshness extend to new helpers                                         │
│  UNCHANGED: hooks/guard.js (prod-deploy PreToolUse) • generate-asvs-checklist.ts   │
├──────────────────────────────────────────────────────────────────────────────┤
│  PACKAGING / INSTALL                                                              │
│  MOD: subagent.frontmatter.md + slash-command.template.md (handoff → context;      │
│    coordinator template grants Agent(<allowlist>)) • adapters.md (parallel vs      │
│    sequential variant note) • install.ts (seed .grugops/context + queue;           │
│    drop plans/handoffs seed; rename-to-backup user handoff state on --migrate)      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities (the decentralized mapping)

This is the blackboard architecture (FEATURES.md §1) realized in files: the **shared verified context = the blackboard**, the **§14 gate = admission control onto the blackboard**, the **shrunk Orchestrator = the control component** (a scheduler/decomposer + human-gate holder, NOT a data router), and per-file claims = the per-key concurrency.

| Component | Responsibility (v2.0) | Implementation (the kit's file-type) | Was (v1.x) |
|-----------|----------------------|--------------------------------------|------------|
| **Shared verified context** | The sole inter-role memory: typed notes (`claim`/`finding`/`decision`/`failed-attempt`/`observation`/`artifact-ref`) with provenance; read-before-act, write-after-verify | `.grugops/context/<task>.md` (markdown SoT, append-only) + `<task>.events.jsonl` (derived index for the gate) — STATE, seeded skip-if-exists | the 17 `handoffs/` templates → `plans/handoffs/<ID>-<stage>.md` instances |
| **Verifier (admission control)** | A `finding` is admitted to context ONLY with a real, checkable `verified_by` (a §14 gate verdict / passing test / named human) — never self-authored | The existing **§14 gate** (`05-pr-quality-gate.md`) + the validator's verify-stamp check + a refuse-self-set rule | the §14 gate existed, but gated PRs — not memory writes |
| **Task queue** | Decentralized async claim with no central router: a directory of subtask files moved `pending/→claimed/→done/` by atomic rename (the rename IS the test-and-set) | `.grugops/queue/{pending,claimed,done}/` + `claim.ts` helper (`mkdirSync`/`renameSync`) — STATE | the **board** was a coarse, human-only queue; no atomic claim |
| **Board (state view)** | The human-readable, WIP-limited projection of the queue + trace — decentralized *and* legible | `plans/board.md` (MOD: documents that it mirrors `.grugops/queue/` columns) | the board WAS the state plane; now it *projects* the file queue |
| **Coordinator / Orchestrator** | Bootstrap + **decompose** the request into queued subtasks (minimizing shared mutable state), set WIP, hold the human merge/deploy gate — schedule, don't relay | `orchestrator.md` (MOD: router → decomposer/scheduler/gate); on Claude Code it holds `Agent(<allowlist>)` and spawns role subagents | the sole router every handoff flowed through (the DeLM bottleneck) |
| **Role agents (16 specialists)** | Claim a task, read the shared context, do the one job, **promote only verified notes** to the shared file; verbose trajectory stays local (compacted) | each `roles/*.md` (MOD: read-context / write-verified-note instead of read/write-handoff); no `Agent` grant | each produced a frozen handoff packet as its memory |
| **Two-tier memory** | Local per-agent trajectory (compacted, never dominates the prompt) + shared verified lessons | `.grugops/context/threads/<agent>.md` (local) + `<task>.md` (shared) + `compactor.ts` | n/a (no compaction; handoffs were the only memory) |
| **Audit trail** | `git log` over append-only context files + per-note `by`/`at`/`verified_by`/`supersedes` → tamper-evident, replayable who-knew-what-when | git + the JSONL index (sort by `at`, follow `supersedes`) | the linear handoff chain + `plans/traceability.md` |
| **Safety floor** | Humans hold merge/deploy — UNCHANGED, mechanical | `hooks/guard.js` PreToolUse (untouched); every spawned agent still hits it | identical |

---

## Recommended Project Structure (deltas only — against today's REAL tree)

```
agent-factory/
├── roles/
│   ├── orchestrator.md                    # MOD — router → decompose+schedule+gate; CC: holds Agent(<allowlist>)
│   ├── _role-switch-protocol.md           # MOD — step-4 handoff→context note; + parallel-claim variant; drop "No Agent tool"
│   └── (16 specialist roles MODIFIED)     # read-context / write-verified-note; no Agent grant
├── workflows/
│   ├── 00-bootstrap-greenfield.md         # MOD — seed .grugops/context + queue; decompose into queued subtasks
│   ├── 01-bootstrap-brownfield.md         # MOD — same
│   ├── 02..13, 14, 15  (16 total)         # MOD — every handoff read/write → context read/write/admit
│   ├── 16-context-read-write.md           # NEW — read-before-act / write-after-verify protocol (single-source)
│   ├── 17-task-claim.md                   # NEW — queue-drain / atomic-claim / stale-claim-sweep protocol
│   └── 18-context-compaction.md           # NEW — two-tier compaction, dialable, load-bearing-fields-exempt
├── handoffs/                              # ✗ DIRECTORY REMOVED (all 17 templates deleted, clean replacement)
├── context/                              # NEW (or under templates/) — schema lives in the KIT
│   └── context-note.md                    # NEW — typed-note template + provenance fence + verify-stamp rule
├── checklists/
│   ├── definition-of-ready.md             # MOD — "input is the admitted finding set," not "the handoff exists"
│   ├── definition-of-done.md              # MOD — "verified notes admitted + trace migrated onto notes"
│   ├── definition-of-done-enterprise.md   # MOD — + human-admission of high-severity notes
│   ├── context-admission.md               # NEW — the verify-before-write admission checklist
│   └── (others unchanged unless they name handoffs)
├── config/
│   ├── factory.config.json                # MOD — new context.* / queue.* keys
│   └── factory.config.md                  # MOD — byte-twin field reference rows
├── packaging/
│   ├── subagent.frontmatter.md            # MOD — handoff→context; coordinator variant grants Agent(<allowlist>)
│   ├── slash-command.template.md          # MOD — handoff→context refs
│   └── adapters.md                        # MOD — note the parallel(CC) vs sequential(4 CLIs) execution variant
└── seed/
    ├── .grugops/factory.config.json       # MOD — same new keys (seed source of truth)
    ├── .grugops/context/.gitkeep          # NEW — seed the context dir (skip-if-exists)
    ├── .grugops/queue/{pending,claimed,done}/.gitkeep   # NEW — seed the queue dirs
    └── plans/handoffs/                     # ✗ REMOVED from the seed

scripts/
├── context-io.ts (+ .js, + .test.ts)      # NEW — atomicWrite / appendNote / readContext (node:fs only)
├── claim.ts      (+ .js, + .test.ts)      # NEW — mkdirSync/renameSync atomic claim + stale-sweep
├── compactor.ts  (+ .js, + .test.ts)      # NEW — two-tier compaction helper (preserves load-bearing fields)
├── validate-agent-factory.ts (+ .js)      # MOD — drop 16 handoff names; add note/provenance/verify-stamp + board↔queue
├── check-foundation-guards.ts (+ .js)     # MOD — invert guard_wr05; + guard_context_writes; + guard_verify_stamp
├── check-uat-oracles.ts (+ .js)           # MOD — replace oracleParity(A3) with the dual-path EQUIVALENCE oracle
├── generate-catalog.ts (+ .js)            # MOD — document the context substrate, not handoffs
├── freshness.ts / catalog-freshness.ts    # MOD — extend the freshness model to the 3 new helpers
└── (generate-asvs-checklist.ts, runnable-ref/*, asvs/  UNCHANGED)

hooks/
└── guard.js                               # UNCHANGED — prod-deploy PreToolUse (the safety floor)

install/
└── install.ts (+ .js)                     # MOD — seed context+queue; drop plans/handoffs seed; rename-to-backup on --migrate
```

### Structure Rationale

- **The note schema lives ONCE in the KIT** (`agent-factory/context/context-note.md` or under a `templates/` sibling), exactly as handoff *templates* did — single-source. Runtime *instances* live in per-repo STATE (`.grugops/context/`), exactly as handoff *instances* lived in `plans/handoffs/`. This preserves the kit-vs-state invariant the whole kit was rewritten to in v1.1 (Phase 7).
- **Three NEW workflows, not inlined steps.** Read/write/verify (16), claim/queue (17), and compaction (18) are single-source workflows that every role and the other workflows *reference*, exactly as `05-pr-quality-gate.md` is referenced not restated. This is the §14 single-source pattern (v1.2 Anti-Pattern 1) applied to the new primitives — otherwise the context protocol drifts across 16 workflows.
- **New workflow ordinals 16/17/18 continue the frozen `00–15` convention** (frontmatter `order:`). Do NOT renumber 00–15 — it ripples through every Orchestrator workflow-map reference (the v1.2 frozen-ordinal rule).
- **Concurrency lives in `scripts/` (committed `.js`), never in markdown.** Markdown cannot enforce atomicity (PITFALLS.md Pitfall 1). `context-io.ts` / `claim.ts` / `compactor.ts` are the *only* new code, all `node:fs`-only, freshness-checked like the rest of the layer. They are the **single sanctioned write path** — a grep guard fails any role/workflow that does a raw `Write`/`writeFileSync` of a context file.
- **Config changes touch THREE files in lockstep** (`config/factory.config.json` + byte-twin `.md` + `seed/.grugops/factory.config.json`) — one atomic edit unit, the v1.2 dial invariant.
- **The handoff directory is DELETED, not deprecated** (locked decision). But deletion is the *last* step of a substrate-first sequence (Phase 24), never the first — see Build Order.

---

## Architectural Patterns

### Pattern 1: Shared verified context replaces the handoff packet (read-before-act / write-after-verify)

**What:** A role no longer reads a frozen `product-handoff.md` and writes an `implementation-handoff.md`. It **reads the task's accumulated verified notes** (`readContext(taskId)`), does its job, and **appends only verified notes** (`appendNote`) — the markdown body via `atomicWrite`, the compact metadata line into the `.events.jsonl` index. One note = one section with a metadata fence (kind + provenance), per STACK.md's locked schema.
**When to use:** Every role activation, on every host CLI, parallel or sequential.
**Trade-offs:** Gains accumulated context + failure memory + auditability over a frozen snapshot; costs an atomic-write discipline (markdown can't enforce it → the `context-io.ts` helper + grep guard do).

**Example (the note shape — from STACK.md, authoritative):**
```markdown
## [finding] AUTH-12 token TTL is 15m not 60m
<!-- kind: finding | by: software-engineer | at: 2026-06-16T14:03:11Z
     verified_by: §14-gate#run-8821 | confidence: HIGH | refs: src/auth/jwt.ts:42 | supersedes: AUTH-09 -->

The configured access-token TTL is 900s. Confirmed by the passing unit test
`jwt.spec.ts > expires after 15m`. Supersedes the earlier claim of 60m.
```
The mirrored JSONL line (what the validator/gate parses — no YAML lib): `{"kind":"finding","id":"AUTH-12","by":"software-engineer","at":"...","verified_by":"§14-gate#run-8821",...}`.

### Pattern 2: Verify-before-write = the §14 gate, un-cheatable and un-self-authorable

**What:** Admission of a `finding` to the shared context is mechanical, mirroring the prod-deploy hook's refuse-self-set: a `finding` REQUIRES a `verified_by` stamp that is a *real, checkable artifact* (a §14 gate verdict ID, a passing test ref, or a named human). `verified_by: self` / `verified_by: <the-writing-agent>` is **rejected by construction** — verifier ≠ verified. The structure validator treats a `finding` with a missing/self-authored/unresolvable stamp as a **structural failure**, proven by a RED fixture (the v1.2 test-integrity-checker discipline).
**When to use:** Every write that claims the status `finding` (the load-bearing, downstream-relied-upon notes). `claim`/`observation`/`UNKNOWN - verify` remain the honest escape hatch for unverifiable statements — but a `claim` can never satisfy a downstream dependency that requires a `finding`.
**Trade-offs:** This is THE differentiator vs DeLM (whose verifier proves only *grounding*, not correctness, with no human gate). The cost is admission-time overhead; the win is that "verified" means behavior-tested, the brand's whole wedge.

**Example (admission rule, single-source in workflow 16, enforced by the validator):**
```text
A note may carry kind: finding ONLY IF verified_by resolves to:
  - a §14 gate verdict (READY_FOR_HUMAN_REVIEW + run id), OR
  - a named passing test reference, OR
  - a named human sign-off (for human-gated/high-severity notes).
verified_by ∈ {self, <writing-agent-id>, absent}  → validator FAILS (structural).   ← RED fixture
Unverifiable? Write it as kind: claim with confidence + `UNKNOWN - verify`. Non-load-bearing.
```

### Pattern 3: File-based task queue — the atomic rename IS the claim (no central lock manager)

**What:** The queue is a directory of subtask files moved `pending/x → claimed/x → done/x` by `renameSync` (or `mkdirSync` claim on networkable state). Two background subagents racing to claim `task-7`: one `rename` wins, the other gets `ENOENT` and takes the next pending item. There is **no central lock manager** — that would rebuild the bottleneck DeLM exists to kill (and a dead lock-holder wedges everyone). Stale claims are reclaimed by a *role/workflow rule* on the next queue scan (no daemon — Out of Scope), keyed on the claim file's `agent-id` + ISO `at`.
**When to use:** Whenever work is decomposed into independently-claimable subtasks (parallel on CC; sequential drains one-at-a-time on the four CLIs — same protocol, contention=0).
**Trade-offs:** Zero infrastructure, deadlock-free, NFS-safe via `mkdirSync`. Cost: stale recovery is optimistic (runs on next scan, not instantly) — acceptable for a no-daemon kit. Dependency-aware queue ordering (`[deps:…]`) is a v2.x add-after-validation; start flat-and-proven-non-colliding.

**Example (claim protocol, single-source in workflow 17):**
```text
claim(task):  mkdirSync(queue/claimed/<task>.lock)  → EEXIST means lost; pick next pending
              then renameSync(pending/<task>, claimed/<task>); stamp {by, at}
complete:     renameSync(claimed/<task>, done/<task>)
sweep (on scan): if claimed/<task>.at older than queue.stale_after → renameSync back to pending/
WIP cap:      coordinator spawns ≤ queue.wip_limit background subagents; rest wait in pending/
```

### Pattern 4: One substrate, two execution modes — convergence on identical on-disk artifacts

**What:** The context + queue file conventions are designed **tool-neutrally**. Spawning is an *execution detail layered on top*, not a fork of the data model. The **sequential path is literally "the parallel path with concurrency = 1"**: same `readContext`/verify/`appendNote`, same claim protocol (inert under a single writer, but not a different code path). There is never a separate sequential note schema or a separate sequential workflow.
**When to use:** Always — this is what keeps "degrade, never break" true and what honestly retires A3/DOG-02.
**Trade-offs:** Forces discipline (no parallel-only shortcuts in the data model), but buys a *testable equivalence*: for the same seeded task, the sequential path must produce a context that satisfies the **same admitted-finding set and the same final acceptance verdict** as the parallel path (it may be slower and reach findings in a different order, but never a worse or contradictory end state). The dual-path oracle asserts this on **on-disk artifacts** (not `--print` stdout — the exact A3 test-design flaw).

**Example (the two modes, converging):**
```text
Claude Code (PRIMARY, parallel):
  --agent grugops-orchestrator (main thread, holds Agent(<allowlist>))
    └─ spawns role subagents in BACKGROUND (concurrent); each: claim → readContext
       → do job → verify → appendNote (atomic) → return summary; trajectory stays local
    (optional nested fan-out within the depth-5 background cap, v2.1.172+)

Codex / Gemini / OpenCode / Copilot (DEGRADED, sequential):
  single-window role-load (_role-switch-protocol.md), concurrency = 1
    └─ one role at a time: claim → readContext → do job → verify → appendNote
       same files, same schema, same claim protocol (contention inert), same verify gate

CONVERGENCE: both write the SAME .grugops/context/<task>.md + .events.jsonl, the SAME
queue done/ set, the SAME §14 verdict. The dual-path oracle (Phase 26) asserts equivalence
on these ON-DISK artifacts. THIS — not deleting handoffs — is what retires A3/DOG-02.
```

### Pattern 5: Two-tier memory + dialable compaction (the token-economy / caveman tie-in)

**What:** Each agent's verbose local trajectory lives in its own window (Claude Code auto-compacts it) + `.grugops/context/threads/<agent>.md`; only **compact, verified distillations promote to the shared file**. The shared context an agent *reads* stays small (read the gist by default; selective-unfold the raw only when a task needs it). Append-only **history** on git is unbounded and free; the **active read-path** is bounded. Compaction is dialable (`context.compaction: aggressive|balanced|retain-raw`) but has a hard carve-out: it may shorten prose but must preserve every `verified_by` stamp, every `failed-attempt`/`constraint`, every `supersedes` link, and all provenance — these are load-bearing and compaction-exempt. A compaction pass is itself a write → it goes through verify-before-write (a compaction that drops/alters a verified finding is a verification failure, not a silent rewrite).
**When to use:** After each verified write that grows the active context; before a parallel fan-out (so the 15× multi-agent tax × a fat context doesn't erase the ~50% cost win).
**Trade-offs:** Directly attacks Anthropic's documented 15× token multiplier and DeLM's context-rot risk. Cost: an aggressive pass can drop load-bearing detail → the exempt-fields rule + re-verification guard against it. This is the caveman = token-economy ethos (terse IS the mechanism) applied to memory, not prose.

---

## Data Flow

### From the OLD linear handoff chain → the NEW decentralized context flow

```
OLD (v1.x, centralized — every datum flows THROUGH the Orchestrator as a handoff):
  BA/PM ─product-handoff→ Orchestrator ─impl-ready→ Engineer ─impl-handoff→ QE
       ─qe-handoff→ Security ─security-nfr-handoff→ UAT ─uat-handoff→ Release
  (linear, ordered, the Orchestrator is the relay — the DeLM bottleneck)

NEW (v2.0, decentralized — agents coordinate ONLY through the shared context):
  ┌─────────────────────────  .grugops/context/<task>.md  (the blackboard)  ─────────────────────────┐
  │   [claim] … [finding ✓gate] … [decision ✓human] … [failed-attempt] … [artifact-ref]              │
  │   + <task>.events.jsonl (derived index)   + threads/<agent>.md (local, compacted)                  │
  └────────▲──────────────▲──────────────▲──────────────▲──────────────▲────────────────────────────┘
   read-before-act │   write-after-verify (admission = §14 gate, refuse-self-set)
           │              │              │              │              │
        BA/PM         Engineer          QE          Security         UAT      ← claim from queue,
        (subagent)    (subagent)     (subagent)    (subagent)     (subagent)    run in PARALLEL (CC)
           │              │              │              │              │         or SEQUENTIAL (4 CLIs)
           └──────────────┴──────────────┴──────────────┴──────────────┘
                                      ▲
                          Orchestrator = DECOMPOSE into queued subtasks (minimize shared
                          mutable state) + set WIP + hold human merge/deploy gate
                          (control component / scheduler — NOT a relay)
```

### Request flow (one ticket, v2.0)

```
/grug <request>
   ↓
Orchestrator: read config + board(=queue view); classify; DECOMPOSE into subtasks → .grugops/queue/pending/
   ↓                                                                    (set queue.wip_limit)
[Claude Code]  spawn ≤WIP background role subagents          [4 CLIs]  single-window role-load, drain 1/scan
   ↓                                                                    ↓
each subagent:  claim(task) [atomic rename]  →  readContext(task) [read-before-act, re-read before publish]
   →  do the one job  →  §14 gate verifies  →  appendNote(finding, verified_by=gate#id) [atomic]  →  done/
   ↓
context compaction (dialable) keeps the active read-path small; threads/<agent>.md holds the raw
   ↓
Orchestrator: release decision reads the admitted finding set + the trace (replayed from at+supersedes)
   ↓
HUMAN GATE (unchanged): merge / deploy require named human confirmation (hooks/guard.js PreToolUse)
```

### Audit / traceability flow (the trace migrates onto notes)

The REQ-ID → finding → code → test → release chain that lived **across handoff packets** + `plans/traceability.md` now lives as `refs`/trace fields **on the context notes**. Logical order is reconstructed from `at` + `supersedes` (not file position — async writes have no positional order); the per-task `events.jsonl` is the machine-replayable index; `git log` over the append-only files is the tamper-evident attribution. The clean handoff removal (Phase 24) must **migrate** the traceability content onto the notes, not drop it. `plans/board.md` stays the human-readable at-a-glance projection so a human can audit without parsing JSONL.

---

## NEW vs MODIFIED — exhaustive component inventory

> Grounded in the REAL tree (18 role files incl. the protocol, 16 workflows, 17 handoff templates, 14 checklists, 3 packaging files, the `scripts/` TS layer, the seed, install). "Handoff refs span all 18 roles + all 16 workflows + 3 packaging templates + AGENTS.md + the installer + the seed" — verified by grep this session, so the rewire blast radius is the whole kit.

### Roles (`agent-factory/roles/`)

| File | Disposition | Change |
|------|-------------|--------|
| `orchestrator.md` | **MODIFIED (heavy)** | Router → **decompose + schedule + human-gate** control component. Routing matrix becomes a *decomposition* matrix (carve subtasks minimizing shared mutable state). On Claude Code: grants `Agent(<allowlist>)` and spawns role subagents (the ONLY role that may spawn). Holds the WIP/queue cap. Still holds the merge/deploy human gate. Stops being the relay every handoff flows through. |
| `_role-switch-protocol.md` | **MODIFIED (heavy)** | Step-4 rewired: read handoff template + write handoff instance → **`readContext` + `appendNote` (verified)**. The invariant flips: "the handoff is the only memory" → "**the verified context is the only memory**." Add a parallel-claim variant (claim → work → write-back). Remove the "No `Agent` tool / no sub-agent spawn" absolute (now: only the coordinator spawns). |
| 16 specialist roles (`ba-pm`, `system-analyst`, `architect-design`, `brownfield-mapper`, `greenfield-mapper`, `software-engineer`, `qe-e2e`, `security-nfr`, `compliance-officer`, `uat-planner`, `release-manager`, `incident-responder`, `factory-coach`, `agents-md-scribe`, `installer`, `frontend-ui`) | **MODIFIED (each)** | "Reads" lines: named input handoff(s) → "the task's admitted findings (`readContext`)." "Output" lines: a handoff instance → a verified context note (`appendNote`). Add the re-read-before-publish + `supersedes` rule. No `Agent` grant. Keep each within its byte ceiling (caveman/token-economy — `guard_role_size`). |

### Workflows (`agent-factory/workflows/`)

| File | Disposition | Change |
|------|-------------|--------|
| `16-context-read-write.md` | **NEW** | Single-source read-before-act / write-after-verify / verify-admission protocol. Every role + workflow references it (like 05). |
| `17-task-claim.md` | **NEW** | Single-source queue-drain / atomic-claim / stale-claim-sweep / WIP-cap protocol. |
| `18-context-compaction.md` | **NEW** | Two-tier compaction, dialable, load-bearing-fields-exempt, compacted-output-re-verified. |
| `00-bootstrap-greenfield.md`, `01-bootstrap-brownfield.md` | **MODIFIED** | Seed `.grugops/context/` + `.grugops/queue/`; decompose the bootstrap into queued subtasks. |
| `02..13` (12 lifecycle/ceremony workflows) | **MODIFIED (each)** | Every handoff read/write → context read/write/admit; "Agents involved" references the claim + context protocols. Gate-referencing unchanged (still point at 05). |
| `04-ticket-to-pr.md` | **MODIFIED** | The verify→appendNote loop; the §14 verdict becomes the note's `verified_by`. |
| `05-pr-quality-gate.md` | **MODIFIED (light)** | The gate's three terminal verdicts now also serve as the **context admission stamp** (`verified_by: §14-gate#id`). The bounded `self_fix_attempts` loop is reused as the bounded verify→regenerate loop. No fork. |
| `06`, `14-ui-design-to-build.md`, `15-security-audit.md` | **MODIFIED** | Same handoff→context rewire. |

### Contracts: handoffs + checklists

| File | Disposition | Change |
|------|-------------|--------|
| `handoffs/` (all 17 templates: `universal`, `business`, `product`, `system`, `architecture`, `implementation`, `implementation-ready-packet`, `ticket-ready-packet`, `qe`, `security-nfr`, `uat`, `frontend`, `release`, `refinement-notes`, `sprint-plan`, `retro-notes`, `incident-postmortem`) | **REMOVED** | Clean replacement (locked). Their *content fields* migrate into the note schema + workflow steps. Deleted LAST in the substrate-first sequence (Phase 24), only after the substrate is wired. |
| `context/context-note.md` (KIT, single-source schema) | **NEW** | The typed-note template + provenance fence + verify-stamp rule. The single-source replacement for the 17 templates. |
| `checklists/context-admission.md` | **NEW** | The verify-before-write admission checklist. |
| `checklists/definition-of-ready.md` | **MODIFIED** | "Input ready" = the prerequisite admitted-finding set exists, not "the input handoff exists." |
| `checklists/definition-of-done.md` + `…-enterprise.md` | **MODIFIED** | DoD: verified notes admitted + trace migrated onto notes. Enterprise: + named-human admission of high-severity notes. |
| other checklists (`accessibility`, `compliance`, `linter-recommendations`, `pr-review`, `release-readiness`, `security-nfr`, `uat`, `observability-slo`, `example-mapping`, `playwright-…`, `00-index`) | **MODIFIED only if they name handoffs** | grep-to-zero pass; most are gate/quality content and untouched. |

### State plane + config (seed + per-repo)

| File | Disposition | Change |
|------|-------------|--------|
| `.grugops/context/<task>.md` + `.events.jsonl` + `threads/<agent>.md` | **NEW (STATE)** | Seeded skip-if-exists; the shared verified context substrate. |
| `.grugops/queue/{pending,claimed,done}/` | **NEW (STATE)** | Seeded skip-if-exists; the file-based queue. |
| `plans/board.md` (seed) | **MODIFIED** | Documents that columns mirror `.grugops/queue/`; stays the human-readable WIP view. |
| `plans/traceability.md` (seed) | **MODIFIED** | The REQ chain references context-note `refs`; the trace replays from `at`+`supersedes`. |
| `plans/handoffs/` (seed) | **REMOVED** | No longer seeded; clean replacement. |
| `config/factory.config.json` + `.md` twin + `seed/.grugops/factory.config.json` | **MODIFIED (3 in lockstep)** | New keys: `context.{human_admission: off\|high-severity\|all, compaction: aggressive\|balanced\|retain-raw, audit_retention: git\|retained}`, `queue.{wip_limit, dependency_ordered, stale_after}`. Verifier depth reuses existing `quality.*` + `security.asvs_level`. Lean defaults: `human_admission:off`, `compaction:aggressive`, small `wip_limit` (3–4), `dependency_ordered:false`. Un-dialable floor: verify-before-write, no-fabrication, test-integrity, humans-hold-merge/deploy. |

### TS tooling layer (`scripts/`) — the only NEW code

| File | Disposition | Change |
|------|-------------|--------|
| `context-io.ts` (+ `.js` + `.test.ts`) | **NEW** | `atomicWrite` (write-temp-then-rename; Windows `unlink`-then-rename guard), `appendNote` (atomicWrite the prose body + small JSONL line), `readContext`. `node:fs` only. RED + concurrency tests. |
| `claim.ts` (+ `.js` + `.test.ts`) | **NEW** | `claim` via `mkdirSync`(NFS-safe)/`renameSync`; stale-sweep; double-claim + crash-injection tests. |
| `compactor.ts` (+ `.js` + `.test.ts`) | **NEW** | Two-tier compaction; load-bearing-field-preservation test (RED on dropped `verified_by`/`failed-attempt`/`supersedes`). |
| `validate-agent-factory.ts` (+ `.js`) | **MODIFIED** | Drop the 16 frozen handoff filenames (lines ~135–148); ADD: every `finding` has provenance (`by`/`at`/`verified_by`) + a JSONL mirror; reject self-authored/absent `verified_by`; keep board↔ticket↔traceability, extend to board↔queue. |
| `check-foundation-guards.ts` (+ `.js`) | **MODIFIED** | **Invert `guard_wr05`**: from "no role grants `Agent`" → "only the coordinator grants `Agent(<allowlist>)`" (over both packaging templates + materialized adapters). ADD `guard_context_writes` (no raw `Write`/`writeFileSync` of context in shipped role/workflow text). ADD `guard_verify_stamp` (no shipped text instructs a self-authored stamp). Keep voice/size/byte-budget guards GREEN. |
| `check-uat-oracles.ts` (+ `.js`) | **MODIFIED** | Replace `oracleParity` (A3/UAT-AUTO-03, asserts the handoff-parity table) with the **dual-path EQUIVALENCE oracle** (assert on-disk context + verdict equivalence parallel vs sequential). Keep `oracleWr05Wording` (re-point to the inverted closure) + `oracleHooksWiring` (unchanged — prod-deploy). |
| `generate-catalog.ts` (+ `.js`) | **MODIFIED** | Self-discover + document the context substrate + new workflows 16/17/18; stop documenting handoffs (else the catalog lies — freshness gate fails red, which is correct). |
| `freshness.ts` / `catalog-freshness.ts` | **MODIFIED** | Extend the source↔output freshness model to the 3 new committed helpers. |
| `hooks/guard.js`, `generate-asvs-checklist.ts`, `asvs/`, `runnable-ref/*`, `check-kit-refs.ts` | **UNCHANGED** (except `check-kit-refs` MAY need its handoff-allowlist updated when the dir is deleted) | Prod-deploy safety floor untouched; ASVS generator unrelated. |

### Packaging + install

| File | Disposition | Change |
|------|-------------|--------|
| `packaging/subagent.frontmatter.md` | **MODIFIED** | handoff→context refs; a **coordinator variant** grants `Agent(<allowlist>)` (the WR-05 inversion lands here too — one coordinated change with the guard + catalog). The spawning Orchestrator ships STANDALONE `.claude/agents/` (plugin agents ignore hooks/permissionMode — STACK.md). |
| `packaging/slash-command.template.md` | **MODIFIED** | handoff→context refs. |
| `packaging/adapters.md` | **MODIFIED** | Document the parallel(CC) vs sequential(4 CLIs) execution variant over the one substrate; "only the dispatch + the spawn capability differ, never the content/schema." |
| `AGENTS.md` | **MODIFIED** | "Kit vs state" + a new "Shared context" rule; context command slots (`UNKNOWN - verify` where a command is host-specific); stay under the Codex 32 KiB cap (`guard_agents_bytes`). |
| `install/install.ts` (+ `.js`) | **MODIFIED** | Seed `.grugops/context/` + `.grugops/queue/{pending,claimed,done}/` skip-if-exists; drop the `plans/handoffs/` seed; on `--migrate`, rename-to-backup any existing user `plans/handoffs/` state (never delete-first — v1.1 CR-01). |

---

## Integration Points (against the REAL existing components)

| Existing component | How v2.0 integrates | Risk if mis-wired |
|--------------------|---------------------|-------------------|
| **§14 gate** (`05-pr-quality-gate.md`) — the ready-made verifier | The gate's verdict becomes the context-admission stamp (`verified_by`); the bounded `self_fix_attempts` loop becomes the bounded verify→regenerate loop. **No fork** — reference, don't restate. | Forking the gate into the new workflows → drift (v1.2 Anti-Pattern 1). |
| **Board-as-state** (`plans/board.md`, WIP-limited) | Recast as the human-readable projection of `.grugops/queue/`; `wip_limits` extends to `queue.wip_limit` (bounds in-flight claims AND background-subagent fan-out — the platform caps depth-5 only, not width). | A hidden queue the human can't see → loses the legible board (UX pitfall). |
| **Traceability** (`plans/traceability.md`) | The REQ chain migrates onto context-note `refs`/trace fields; the matrix references notes; replay from `at`+`supersedes`. | Dropping the trace during the handoff rip-out → the auditability differentiator evaporates (Pitfall 7). |
| **Config dial** (`factory.config.json` × 3) | New `context.*`/`queue.*` keys; verifier depth reuses `quality.*`/`security.asvs_level`; lean defaults, un-dialable safety floor. | Config sprawl / a solo user forced into enterprise ceremony (carry v1.2 dial pitfall). |
| **`guard_wr05`** (foundation guard) | **Inverts** in one coordinated change with the packaging templates + catalog (like the v1.2 TS pivot's coordinated flip). | A half-flipped guard → either blocks the coordinator's legitimate `Agent` grant or lets rogue roles spawn. |
| **Structure validator** (`validate-agent-factory.ts`) | Drop handoff names, add note/verify-stamp/provenance + board↔queue checks — in the SAME change as the handoff deletion. | A validator still expecting handoffs after the rip-out → fails red on absent files (or worse, false-greens). |
| **Docs catalog** (`generate-catalog.ts` + freshness) | Document the substrate, not handoffs — same change as deletion. | A catalog documenting a removed artifact = a lying catalog (v1.2 Pitfall 9). |
| **UAT oracles** (`check-uat-oracles.ts`, `oracleParity` = A3) | Replace the handoff-parity oracle with the dual-path equivalence oracle (on-disk artifacts). | A3/DOG-02 marked "retired" with no equivalence proof = a fabricated closure (Pitfall 6). |
| **Prod-deploy hook** (`hooks/guard.js`) | **UNCHANGED.** Every spawned/parallel agent still hits it; ships STANDALONE (plugin agents ignore hooks). | A spawned subagent deploying without the human gate → the safety floor eroded. |
| **Installer two-root model** (`install.ts`) | Seed context+queue (STATE); never touch the read-only kit; rename-to-backup user state on migrate. | Deleting user `plans/handoffs/` state on `--update`/`--migrate` → "the tool ate my work" (Pitfall 9 / v1.1 CR-01). |
| **`_role-switch-protocol.md`** (the memory mechanism) | Step-4 rewired; the parallel claim variant added; the no-spawn absolute relaxed to coordinator-only. | A separate sequential code path / note schema → the two execution modes diverge (Pitfall 6). |

---

## Anti-Patterns (carry from FEATURES.md + PITFALLS.md, architecture-specific)

### Anti-Pattern 1: A central message bus / relay the Orchestrator routes all updates through
**Why wrong:** Recreates the exact bottleneck DeLM exists to kill; the Orchestrator becomes the integration choke point again. **Instead:** shrink the Orchestrator to a scheduler/decomposer + gate (blackboard control component); agents coordinate ONLY through the shared context — never agent-to-agent, never via a relay. (Reject Claude Code agent-teams `SendMessage` as the substrate — experimental, CC-only, ephemeral, not auditable.)

### Anti-Pattern 2: Letting roles `Write` context files directly (raw `writeFileSync`/`Write`)
**Why wrong:** Lost-update / interleaved-append / torn-read corruption of the *sole* memory under parallelism (Pitfall 1). **Instead:** `atomicWrite`/`appendNote` are the only sanctioned write paths; `guard_context_writes` fails red on any raw write in shipped text.

### Anti-Pattern 3: A separate sequential code path or note schema for the four CLIs
**Why wrong:** "Degrade" silently becomes "diverge"; a bug lives on one path only; A3/DOG-02 re-created (Pitfall 6). **Instead:** one tool-neutral substrate; sequential = concurrency-1 of the same path; prove equivalence on on-disk artifacts.

### Anti-Pattern 4: A self-authored / grounding-only "verified" stamp
**Why wrong:** The differentiator collapses — "grounded in a source" ≠ "tested/correct/secure" (the DeLM-verifier trap). **Instead:** `verified_by` = a §14 gate verdict / passing test / named human; refuse-self-set; RED fixture proves a hollow stamp fails.

### Anti-Pattern 5: Big-bang delete handoffs then rewire
**Why wrong:** The factory loses its memory mid-pivot; a missed downstream reader (validator/catalog/seed/installer) ships broken (Pitfall 9). **Instead:** substrate-first — build (20), verify-wire (21), rewire roles/workflows/protocol (24a), THEN delete templates + seed + update validator/catalog in the same grep-to-zero change (24b), with `git revert` as the one-coordinated-change rollback.

### Anti-Pattern 6: One background subagent per queue item with no WIP cap
**Why wrong:** Claude Code caps spawn *depth* (fixed 5 for background trees) but NOT *width* — unbounded concurrent width × the 15× per-agent tax = a runaway bill (Pitfall 8). **Instead:** `queue.wip_limit` bounds in-flight claims / fan-out; `Agent(<allowlist>)` to the coordinator only; prefer structured depth over flat width within the depth-5 cap.

### Anti-Pattern 7: Unbounded append, compact "later" (or compact away load-bearing fields)
**Why wrong:** Context rot + the 15× tax erases the ~50% cost win; an over-aggressive pass drops the one `failed-attempt`/`constraint`/`supersedes` a parallel agent needed (Pitfall 4). **Instead:** two-tier memory; compact the active read-path; append-only history on git only; load-bearing fields are compaction-exempt; compacted output is re-verified.

---

## Suggested Build Order (dependency-ordered, starting at Phase 20)

> Rationale, aligned with PITFALLS.md's 20→26 spine and made my own: **FOUNDATION FIRST** (the cross-cutting guards + the only-new-code helpers must exist and be mechanized BEFORE any role writes to the shared context — the v1.2 lesson: front-load the foundation guards so drift is caught as it's written). Then admission (the differentiator), then the token-economy control, then parallelism (which makes the races/cost real), then the clean cutover (substrate-first, depends on 20–21), then governance, then the honest dual-path retirement + cost measurement LAST.

**Phase 20 — Shared-Context Substrate & Concurrency Foundation.**
Ship the only new code + the mechanical guards FIRST: `context-io.ts` (`atomicWrite`/`appendNote`/`readContext`, Windows-safe), `claim.ts` (`mkdirSync`/`renameSync` atomic claim + stale-sweep, NFS-safe), the note schema (`context-note.md` with the typed kinds + provenance fence), the validator extension (provenance + JSONL-mirror checks), `guard_context_writes`, and cross-platform behavior tests (Windows/NFS). The substrate exists and is enforced; **no role rewired yet.** *Prevents Pitfalls 1, 5, 7(schema), 10; the schema half of 2. Deps: none (foundation).*

**Phase 21 — Verify-Before-Write Admission (the §14 gate as the un-cheatable verifier).**
Wire "a `finding` requires a real, checkable, non-self `verified_by`" mechanically: the validator's verify-stamp check + refuse-self-set + the RED fixture (hollow/self-set stamp FAILS); workflow 16 (read/write/admit) as single-source; the §14 verdict becomes the admission stamp; the bounded verify→regenerate loop reuses `self_fix_attempts`. *Prevents Pitfall 3 — the milestone's thesis. Must precede the handoff removal (the replacement must verify before it can be the sole memory). Deps: 20.*

**Phase 22 — Memory/Trajectory Compaction (dialable, token-economy).**
`compactor.ts` + workflow 18 + the `context.compaction` dial; two-tier memory (`threads/<agent>.md`); the load-bearing-fields-exempt carve-out; compacted output re-verified. *Prevents Pitfall 4 BEFORE parallel fan-out makes the 15× tax real. Deps: 20–21.*

**Phase 23 — Parallel Execution & Orchestrator-as-Decomposer (one substrate, two modes).**
Redefine `orchestrator.md` (router → decompose+schedule+gate); the coordinator grants `Agent(<allowlist>)`; **invert `guard_wr05`** in one coordinated change with the packaging templates + catalog; `queue.wip_limit` caps width; workflow 17 (claim/queue); the degraded-sequential path as concurrency-1 of the SAME path; `_role-switch-protocol.md` parallel-claim variant. Build BOTH execution paths on the one substrate. *Prevents Pitfalls 8, the decompose half of 2, and BUILDS the equivalence promised in 6. Deps: 20–22.*

**Phase 24 — Clean Handoff Removal & Traceability Migration.**
Substrate-first cutover: (24a) rewire all 18 roles + 16 workflows + 3 packaging templates + AGENTS.md off handoffs onto the context substrate; migrate the REQ→code→test→release trace onto note `refs`; (24b) THEN delete the 17 handoff templates + the `plans/handoffs/` seed, update the validator (drop handoff names) + catalog + installer in the SAME grep-to-zero change; `git revert` is the rollback. *Prevents Pitfalls 7(migration), 9. Hard dep: 20–21 solid, 23 (roles rewired). The substrate must exist and be wired before deletion — never delete-first.*

**Phase 25 — Governance-on-a-Dial.**
`context.human_admission` (off | high-severity | all) — agent proposes, named human disposes (the prod-deploy pattern extended to memory); `context.audit_retention`; verifier depth via `quality.*`/`security.asvs_level`; `queue.dependency_ordered` as a v2.x-ready knob. Lean defaults preserved; safety floor un-dialable. *The enterprise half of Pitfall 3. Deps: 21, 24.*

**Phase 26 — Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement (LAST).**
The dual-path equivalence oracle (`check-uat-oracles.ts`, replacing `oracleParity`): same seeded task, parallel(CC) vs sequential(4 CLIs), assert **on-disk** context + verdict equivalence (same admitted-finding set, same gate result, same artifact). The Tier-2 headless E2E harness asserts N background subagents → N distinct un-clobbered notes + each task claimed once + a stale claim reclaimed. Measure aggregate token cost (so the ~50% claim is demonstrated, not asserted — `UNKNOWN - verify` until then). **This phase — not the handoff deletion — honestly retires the A3/DOG-02 waiver.** *Retires Pitfall 6; measures Pitfall 4. Deps: all of 20–25.*

> **Cross-cutting (every touched phase):** keep all inherited v1.x foundation guards GREEN — `guard_voice`, `guard_caveman_preserved`, `guard_role_size`/`guard_adapter_size`, `guard_agents_bytes`, `check-kit-refs`, the test-integrity checker, the prod-deploy hook. `guard_wr05` flips to coordinator-only in Phase 23's one coordinated change. The freshness model extends to the 3 new helpers in Phase 20.

---

## Constraints the roadmapper MUST carry forward (explicit reminders)

- **Zero-runtime-dep:** the only new code is `context-io.ts`/`claim.ts`/`compactor.ts`, `node:fs`-only, committed `.js`, freshness-checked. NO `proper-lockfile`/`gray-matter`/`js-yaml`/`chokidar`/SQLite on hosts. No queue daemon, no watcher process.
- **Markdown-first / no platform-queue-DB:** the context is markdown (JSONL is a derived index, NOT the source of truth); the queue is a directory; git is the audit log. Nothing to operate.
- **Single-source:** the note schema + context/claim/compaction protocols live ONCE; the 5 adapters stay thin pointers; only AGENTS.md slots + the coordinator template change, and that is single-source too.
- **Cross-platform (the reason TS was adopted, D-13):** Windows `unlink`-then-`rename`; NFS `mkdirSync` claim; behavior tests on Windows/NFS in CI — the freshness check proves source↔output parity, NOT behavior correctness.
- **No-fabrication / trace-is-the-proof:** a `finding` without a real non-self `verified_by` is a structural failure (RED fixture); `UNKNOWN - verify` over a faked stamp; do NOT claim DeLM's +9.3pp/~50% as grugops's — `UNKNOWN - verify` until the Phase-26 dogfood measures it.
- **Safety floor unchanged:** `hooks/guard.js` PreToolUse untouched + STANDALONE; humans hold merge/deploy; the spawn grant is coordinator-only and mechanically guarded.
- **Voice + token economy:** clear professional English in all finding/decision/security note bodies; caveman in role framing; compaction must NOT bloat prose (caveman = token economy).
- **Frozen ordinals:** new workflows are 16/17/18; do NOT renumber 00–15.
- **Substrate-before-handoff-removal:** the shared context must exist AND roles must read/write it before any handoff template is deleted — never delete-first.

---

## Open Questions / Flags for the Roadmapper

- **`UNKNOWN - verify` (LOW):** exact `PIPE_BUF` across target OSes bounding append-atomicity — sidestep by `atomicWrite`-ing the JSONL or keeping lines <512B; do not put it on the correctness path (STACK.md).
- **Verify during dogfood (MEDIUM):** `isolation: worktree` ↔ shared-context-path interaction — confirm a worktree-isolated code agent can still read/write the *non-isolated* `.grugops/context/` (Phase 26).
- **Verify during dogfood (MEDIUM):** naive `mkdir`/rename claim robust enough under true CC parallel spawn vs needing advisory leases (the `mcp_agent_mail` file-lease pattern is the fallback).
- **Decision (human):** JSONL mirror = committed derived artifact (+ a `freshness:context` gate) OR purely per-repo runtime STATE (no freshness gate). Recommend **runtime STATE** — it's per-task ephemeral, the markdown is the durable record, git is the audit log.
- **Decision (human):** minimum advertised Claude Code version — v2.1.172 (nested fan-out) vs v2.1.63 (flat parallel, nesting as a documented enhancement). Recommend the v2.1.63 floor.
- **Decision (design):** where the note schema lives in the KIT — a new `agent-factory/context/` dir vs a `templates/` sibling vs reusing the (soon-empty) `handoffs/` path renamed. Recommend a fresh `context/` dir so the deletion is unambiguous and grep-to-zero is clean.
- **Flag:** the WR-05 inversion + packaging templates + catalog must flip **together** (one coordinated change, Phase 23) — like the v1.2 TS pivot — or the guard half-blocks/half-leaks.

---

## Sources

- grugops repo, read directly this session: `agent-factory/roles/*` (18 incl. `_role-switch-protocol.md`, `orchestrator.md`), `agent-factory/workflows/*` (16), `agent-factory/handoffs/*` (17 templates), `agent-factory/checklists/*` (14), `agent-factory/packaging/*` (3), `agent-factory/config/*`, `agent-factory/seed/**`, `scripts/*` (validator, foundation-guards, uat-oracles, catalog, freshness, runnable-ref), plus a grep enumeration of handoff references across the kit (HIGH — primary, the integration blast radius is measured not assumed)
- `.planning/research/STACK.md` (this session) — the markdown+JSONL note schema with provenance/`verified_by`, `node:fs` concurrency primitives, Claude Code `Agent`/nesting-v2.1.172/depth-5/background-shared-CWD, the degraded-sequential path, the inverted WR-05 guard, Windows/NFS caveats (HIGH — authoritative; this file wires it in, does not re-derive)
- `.planning/research/FEATURES.md` (this session) — blackboard/stigmergy prior art, DeLM verified≠correct (the differentiation wedge), Anthropic's 15× tax + coding-is-tightly-interdependent warning, the table-stakes/differentiator/anti-feature landscape, the substrate-before-handoff-removal dependency, the lean→enterprise dial mapping (HIGH)
- `.planning/research/PITFALLS.md` (this session) — the 10 decentralization pitfalls, the pitfall→phase (20–26) mapping, foundation-first ordering, the dual-path equivalence oracle as the real A3/DOG-02 retirement, the RED-fixture + grep-to-zero + rename-to-backup discipline (HIGH)
- `.planning/milestones/v1.2-research/ARCHITECTURE.md` — the existing component map + the file-type-layer template + the single-source/§14/config-dial/frozen-ordinal patterns this study extends (HIGH)
- `.planning/PROJECT.md` — the v2.0 milestone scope, the 4 locked decisions (parallel-first/CC-primary, clean handoff replacement, no-spawn reversal for CC only, A3/DOG-02 human-waiver), the two-root state model, the hard constraints (HIGH)

---
*Architecture research for: grugops v2.0 — decentralized shared-verified-context integration + dependency-ordered build sequence (Phase 20→26)*
*Researched: 2026-06-16*
