# Stack Research — v2.0 Decentralized Factory (Shared Verified Context)

**Domain:** Markdown-first agent-factory kit gaining a *decentralized* architecture — a shared verified-context substrate + a file-based task queue + parallel agent execution (Claude Code primary; the other four host CLIs degrade to sequential over the *same* files). Zero-runtime-dep, committed-`.js` TypeScript tooling layer (Node 22+).
**Researched:** 2026-06-16
**Confidence:** HIGH for the Claude Code sub-agent API (verified against current `code.claude.com/docs/en/sub-agents`, June 2026) and the `node:fs` concurrency primitives (verified against `nodejs.org/api/fs` v26.x + multiple corroborating sources). MEDIUM where a recommendation is a design *choice* (file format, queue layout) rather than a documented capability.

> **READ THIS FIRST — framing rule (carried from v1.2).** grugops ships **no runtime, DB, queue, or app code**. The only code it ships is the TypeScript tooling layer compiled with `tsc` to committed `.js` that hosts run with **zero runtime dependencies installed** (Node 22+ prerequisite; dev-deps `{typescript, vitest, @types/node}` are dev/CI-only, never shipped). Everything else is markdown.
>
> This milestone is **different in kind** from v1.0–v1.2: those research files were mostly about tools to *reference/recommend to users*. v2.0 is about **primitives grugops itself implements** — the shared-context file format, the atomic file operations, the queue layout, and the Claude Code spawn mechanism. So this STACK is split into two dispositions: **IMPLEMENT** (grugops builds this, in markdown conventions + the existing committed-`.js` TS layer) and **MECHANISM** (a host-CLI capability grugops drives but does not own). There is **no new IMPLEMENT dependency** — the entire decentralization can be built on `node:fs` + markdown + the Claude Code `Agent` tool. That is the headline finding.

---

## TL;DR — the locked answers this milestone needs

1. **Shared-context file format = HYBRID, markdown-first.** Per-task **append-only markdown lessons file** (`.grugops/context/<task-id>.md`) where each verified note is a section with **YAML-ish frontmatter-per-note** (or a fenced metadata block) carrying typed-note kind + provenance, **plus a thin JSONL "index/log"** (`.grugops/context/<task-id>.events.jsonl`) that the TS tooling can parse deterministically for the validator/freshness gate. Markdown is the human-readable/diffable/auditable source of truth; the JSONL is a derived, machine-parsable mirror for the gate. **Do NOT make JSONL the source of truth** — it breaks the "readable, diffable markdown" core value. **(MEDIUM — design choice; aligns with DeLM's own file-based recipe.)**
2. **Concurrency on `node:fs` ONLY — fully sufficient, zero deps.** Atomic publish = **write-temp-then-`fs.renameSync`** (atomic-replace on POSIX; needs an unlink-or-`COPYFILE_EXCL`-style guard on Windows). Atomic claim / advisory lock / compare-and-swap = **`fs.openSync(path, 'wx')` (`O_EXCL`)** — an atomic test-and-set; **or `fs.mkdirSync` for an NFS-safe atomic claim**. Append-only log = **`fs.appendFileSync(path, line, {flag:'a'})`** (single small `write(2)` of a `<PIPE_BUF`-sized line is effectively atomic on local FS). Queue = a **directory of files moved between `pending/`→`claimed/`→`done/` by atomic rename**. **(HIGH — all verified in `node:fs`.)**
3. **Claude Code parallel spawning = the `Agent` tool (renamed from `Task` in v2.1.63).** **Nested spawning IS now supported as of v2.1.172** — this REVERSES the old "subagents can't nest" constraint that shaped the v1.x design. A main-thread Orchestrator (run via `--agent`) spawns role subagents; with nesting, those role subagents can themselves fan out. **Background subagents run concurrently** (the real parallelism). **Subagents share the project filesystem by default** (same CWD) — which is exactly what makes a *file-based* shared context work across parallel agents. `isolation: worktree` is available if you want repo isolation (you mostly do NOT — shared context needs shared files). **(HIGH — verified against current docs.)**
4. **Degraded sequential path needs NO new stack** — just the file conventions. A non-spawning CLI (Codex/Gemini/OpenCode/Copilot) runs one role at a time, but each role does the **same read-before-act / write-after-verify** against the same `.grugops/context/` files via the existing single-window sequential role-load (`_role-switch-protocol.md`). The shared context replaces the static handoff as the memory; sequentiality just means the queue is drained one claim at a time. **(HIGH — it's literally file I/O the host agent already does.)**
5. **What NOT to add (hard):** no SQLite/DB, no queue daemon/broker, no watcher process, no `proper-lockfile`/`gray-matter`/`js-yaml`/any npm runtime dep on hosts, no platform. The whole thing is files + `node:fs` + the host agent's own Read/Write/Bash. **(HIGH — Project constraint + Out-of-Scope list.)**

---

## Recommended Stack

### Core Technologies (the substrate grugops IMPLEMENTS for v2.0)

| Technology | Version | Purpose | Why Recommended | Disposition |
|------------|---------|---------|-----------------|-------------|
| **Markdown (CommonMark) — append-only per-task lessons file** | n/a | The **shared verified context** source of truth: typed notes (claim / finding / decision / failed-attempt / observation / artifact-ref) with provenance, read-before-act, written-after-verify | Keeps the project's #1 value — "readable, diffable, git-native, human-auditable" — for the memory that *replaces handoff packets*. A reviewer (and the host agent) reads the context as prose; git diff shows exactly which verified note each agent added. DeLM's own README frames the file-based adaptation as per-task markdown lessons files. | IMPLEMENT (file-format convention + role/workflow wiring) |
| **JSONL — derived per-task event index** | n/a | A machine-parsable mirror/log of the same notes, so the committed-`.js` validator + a freshness gate can verify the context deterministically (count notes, check provenance fields, detect a note written without a verifier stamp) | JSONL is append-friendly (one self-contained JSON object per line — a partial last line is detectable and skippable), trivial to parse with stdlib `JSON.parse` line-by-line (no YAML lib), and is what DeLM uses for `events.jsonl`. **Derived, not authoritative** — regenerable from the markdown, or written alongside it; the markdown wins on any conflict (same discipline as the docs-catalog freshness gate). | IMPLEMENT (TS tooling: writer helper + validator/gate parser) |
| **`node:fs` (Node 22+ stdlib)** | Node **22+** | All concurrency primitives: atomic publish (`renameSync`), atomic claim / CAS / advisory lock (`openSync` `'wx'` / `mkdirSync`), append-only log (`appendFileSync`), directory-scan queue | **Zero runtime deps** — already the only thing the committed `.js` tooling uses. Every primitive the DeLM architecture needs (verify-before-write, atomic queue claim, append-after-verify) maps to a stdlib call. No `proper-lockfile`, no `flock` binding, no broker. Preserves the spirit of the former no-npm-deps rule. | IMPLEMENT (shared TS helpers in `scripts/` → committed `.js`) |
| **Claude Code `Agent` tool + background subagents** | CC **v2.1.x** (`Agent` since v2.1.63; **nested spawn since v2.1.172**) | The **parallel execution mechanism** for the primary target: a `--agent` main-thread Orchestrator spawns role subagents (foreground or **background = concurrent**); with nesting, role agents can fan out further | This is what makes "parallel agents claim from a queue and build on shared verified context" real on Claude Code. Background subagents run concurrently; all subagents share the project working directory, so the file-based context is the shared memory between them. **Reverses the v1.1 D-08 no-spawn stance for Claude Code only**, exactly as the v2.0 decisions require. | MECHANISM (drive via the standalone `.claude/agents/` wrappers + `--agent`/`agent` setting; the kit ships the agent defs) |
| **Single-window sequential role-load (`_role-switch-protocol.md`)** | existing | The **degraded path** for the four non-spawning CLIs: one role at a time, each reading/writing the same `.grugops/context/` files | Already shipped and portable. No new stack — the only change is that the role reads/writes the shared context instead of a frozen handoff packet. "Degrade, never break": same files, same protocol, no parallelism. | IMPLEMENT (rewire the protocol's step-4 to context read/write instead of handoff read/write) |

### Supporting conventions / helpers (the only new code)

| Helper / Convention | Where it lives | Purpose | Notes | Disposition |
|---------|---------|---------|-------------|-------------|
| **`atomicWrite(path, data)`** | `scripts/` shared TS → committed `.js` | write to `path + '.tmp.<pid>.<rand>'` then `renameSync` over the target | The single safe-publish primitive every writer uses. Windows guard: `rename` over an existing file is not POSIX-atomic on Windows — `unlinkSync(target)` immediately before `rename` in a try/catch, or accept the small non-atomic window for files only one writer touches. Document the Windows caveat. | IMPLEMENT |
| **`claim(taskFile)` via `openSync(lockPath,'wx')` or `mkdirSync(claimDir)`** | `scripts/` shared TS → committed `.js` | atomic test-and-set so two parallel agents never claim the same subtask | `'wx'`/`O_EXCL` returns `EEXIST` to the loser → that agent picks the next pending item. `mkdirSync` is the **NFS-safe** variant (recommend it if `$GRUGOPS_HOME`/state may live on a network mount). Stamp the claim file/dir with agent-id + ISO timestamp for the audit trail + stale-claim reclaim. | IMPLEMENT |
| **`appendNote(taskFile, note)`** | role/workflow convention + a TS writer helper | append a verified typed note (markdown section + mirrored JSONL line) only **after** the verify step passes | The "write-after-verify" half. Keep each note ≤ a small line for the JSONL mirror so the append is a single atomic `write(2)`. Markdown body can be longer (the prose); the JSONL carries the typed metadata + a pointer/hash. | IMPLEMENT |
| **`readContext(taskId)`** | role/workflow convention | read-before-act: every role reads the task's accumulated verified notes first | No code strictly required — it's a `Read` of the markdown file. A TS helper that returns notes-by-kind is a convenience for the gate, not a host dependency. | IMPLEMENT (convention; optional helper) |
| **Two-tier memory: local trajectory (compacted) + shared lessons** | `.grugops/context/threads/<agent-id>.md` (local) + `.grugops/context/<task-id>.md` (shared) | DeLM's cost win: each agent's verbose local trajectory is compacted so it can't dominate the prompt; only **verified** distillations promote to the shared file | The compaction is a *role-prompt instruction* ("compact verified updates"), reinforced by grugops's caveman = token-economy voice — NOT a new library. Claude Code subagents also auto-compact their own context; the grugops convention is about what *promotes to shared*. | IMPLEMENT (convention + role text) |

> **Dependency caveat (hard constraint, unchanged):** Do **not** add `gray-matter`, `js-yaml`, `proper-lockfile`, `chokidar`, a SQLite binding, or any npm runtime dep to grugops. The note metadata is parsed with a tiny hand-rolled reader (frontmatter-per-note) **or** carried in the JSONL mirror parsed by stdlib `JSON.parse` — exactly how the v1.2 catalog generator and ASVS generator stay stdlib-only. The only code is shared TS helpers in `scripts/`, compiled to committed `.js`, freshness-checked like the rest of the tooling layer.

### Development / verification tools (grugops's own gate)

| Tool | Purpose | Notes |
|------|---------|-------|
| `scripts/validate-agent-factory.ts` (committed `.js`) | extend the structure validator to check the **context substrate**: every shared note has a `kind` + provenance (`by`/`at`/`verified_by`) and a JSONL mirror line; no note lacks a verifier stamp | Same no-fabrication discipline — a note written without verification is a structural failure, not a silent pass. The validator is the auditability enforcer. |
| `scripts/check-foundation-guards.ts` (committed `.js`) | add a guard: shared-context writes go through `atomicWrite`/`appendNote`, not raw `writeFileSync`, in the shipped role/workflow text (grep guard, same shape as `guard_wr05`) | Mechanical proof the convention is followed in the kit text. |
| context freshness gate (mirror of `freshness:catalog`) | if the JSONL mirror is committed/derived, a fail-closed drift gate regenerates it from the markdown and `Buffer.equals`-diffs | Only if the JSONL is treated as a committed derived artifact. If JSONL is purely runtime per-repo state, skip — it's not in the kit. |
| `claude --agent grugops-orchestrator` + background subagents | the actual parallel run, dogfooded | The Tier-2 headless E2E harness (Phase 19) extends to assert parallel agents wrote distinct verified notes to the shared file without clobbering. This is where the A3/DOG-02 concern is honestly *retired* (handoffs gone). |

## Installation

> **grugops adds NO runtime dependency for v2.0.** Host machines still run committed `.js` with zero deps installed. The only "install" change is that the kit now ships role/agent definitions that spawn (Claude Code) and a `.grugops/context/` state-plane convention seeded per-repo.

```bash
# grugops's own dev/build deps — UNCHANGED from v1.2 (dev/CI only, never shipped):
npm install -D typescript vitest @types/node

# Hosts run committed .js — nothing to install (Node 22+ prerequisite, already required).
# The v2.0 state plane is seeded by the existing installer (skip-if-exists), e.g.:
#   .grugops/context/                 (shared verified context, per task)
#   .grugops/context/threads/         (per-agent local trajectories, compacted)
#   .grugops/queue/{pending,claimed,done}/   (file-based task queue)
```

```text
# Claude Code parallel form (primary target) — no package install; ship agent defs:
#   .claude/agents/grugops-orchestrator.md   (main thread via `--agent` or `agent` setting)
#   .claude/agents/<role>.md                 (spawnable role subagents)
#   grant the Agent tool ONLY to the orchestrator/coordinator role:
#     tools: Agent(<role1>, <role2>, ...), Read, Write, Bash
#   (REVERSES the v1.1 no-spawn-grant rule for Claude Code only — see Key Decisions D-08 reversal)
```

## The shared-context file format (the headline deliverable)

**Decision: markdown source of truth + JSONL derived index. Per task.**

```
.grugops/context/
  <task-id>.md            # human source of truth: verified typed notes, append-only
  <task-id>.events.jsonl  # derived machine index: one note per line (gate/validator reads this)
  threads/
    <agent-id>.md         # per-agent local trajectory, compacted (DeLM two-tier memory)
```

**Per-note markdown shape (one note = one section with a metadata fence):**

```markdown
## [finding] AUTH-12 token TTL is 15m not 60m
<!-- kind: finding | by: software-engineer | at: 2026-06-16T14:03:11Z
     verified_by: §14-gate | confidence: HIGH | refs: src/auth/jwt.ts:42 -->

The configured access-token TTL is 900s. Confirmed by reading the constant and
the passing unit test `jwt.spec.ts > expires after 15m`. Supersedes the earlier
claim of 60m (note [claim] AUTH-09).
```

**Mirrored JSONL line (derived, what the validator/gate parses — no YAML lib needed):**

```json
{"kind":"finding","id":"AUTH-12","by":"software-engineer","at":"2026-06-16T14:03:11Z","verified_by":"§14-gate","confidence":"HIGH","refs":["src/auth/jwt.ts:42"],"supersedes":"AUTH-09"}
```

**Typed-note kinds (extracted from DeLM, mapped to grugops's SDLC):**

| `kind` | Meaning | Verify-before-write rule |
|--------|---------|--------------------------|
| `claim` | An asserted-but-not-yet-verified statement | Allowed unverified, but **must** carry `confidence` + be marked `UNKNOWN - verify` if not checkable; cannot be relied on by a downstream role until promoted to `finding` |
| `finding` | A verified fact | Requires a `verified_by` stamp (a gate run, a passing test, a human sign-off) — the no-fabrication floor |
| `decision` | A choice made (the D-NN trail) | Requires `by` + rationale in the body; human-gated decisions carry the human's name |
| `failed-attempt` | A tried-and-rejected approach (DeLM's key cost saver — stops re-trying) | Always allowed; the *point* is to record what didn't work so a parallel agent doesn't repeat it |
| `observation` | Context noticed in passing | Low bar; not relied on as a fact |
| `artifact-ref` | A pointer to a produced artifact (PR, file, test, screenshot) | Path/URL must exist (validator can check) |

**Why this format wins for grugops:**
- **Auditable + human-gated (the differentiator):** provenance (`by`/`at`/`verified_by`) is in every note; a reviewer sees who verified what and when. A `finding` without a `verified_by` stamp is a *structural failure* the validator catches — the verify-before-write mechanism is mechanical, not a black-box blackboard. This is grugops's stated differentiation from DeLM.
- **Replaces the handoff cleanly:** a downstream role no longer reads a frozen `product-handoff.md`; it reads the task's accumulated `finding`/`decision` notes. The "memory is the handoff" maxim becomes "memory is the verified context."
- **Degrades trivially:** a sequential CLI reads/writes the same markdown — no parallelism needed to benefit from accumulated verified notes.
- **No new dep:** markdown is read by the host agent; the JSONL mirror is parsed by stdlib `JSON.parse`. The hand-rolled metadata-fence reader is the same class as the v1.2 catalog/ASVS stdlib parsers.

**Alternatives weighed:** pure-JSONL (rejected — breaks human-readable/diffable core value; a reviewer can't scan a blackboard); pure-markdown-no-mirror (acceptable but makes the gate parse markdown — more fragile than parsing JSONL; keep the cheap mirror); one-file-per-note (rejected — directory explosion, harder to read the task narrative, though it *does* sidestep append races; mitigated below by single-writer-per-append + small atomic lines).

## Concurrency primitives on `node:fs` only (verified)

Everything the decentralized architecture needs is in stdlib. **No `proper-lockfile`, no native `flock`, no broker.**

| Need | `node:fs` primitive | Guarantee | Caveat / cross-platform note |
|------|---------------------|-----------|------------------------------|
| **Atomic publish** (replace a file so readers never see a half-write) | `writeFileSync(tmp, data)` then `renameSync(tmp, target)` | **Atomic-replace on POSIX**: a concurrent reader sees the old file or the new file, never a partial. | On **Windows**, native rename **fails if the destination exists** and is not POSIX-atomic — `unlinkSync(target)` immediately before `renameSync` (tiny non-atomic window), or scope atomic-replace to single-writer files. Document it. |
| **Atomic claim / advisory lock / compare-and-swap** | `openSync(lockPath, 'wx')` (`O_CREAT\|O_EXCL`) — succeeds for exactly one caller, throws `EEXIST` for the rest | **Atomic test-and-set** on local filesystems — the canonical lockfile primitive. | **`O_EXCL` is unreliable on NFS** (documented race). For network-mounted state, use **`mkdirSync(claimDir)`** instead — directory creation is atomic and **NFS-safe** (the `proper-lockfile` approach, but stdlib). |
| **Append-only verified log** | `appendFileSync(path, line + '\n', {flag:'a'})` | A single `write(2)` of a line **≤ `PIPE_BUF` (4096 bytes on Linux)** to an `O_APPEND` fd is atomic on local FS — concurrent small appends interleave by whole lines, not bytes. | Keep each JSONL note line small (it's metadata, not the prose body). Large multi-KB appends are **not** guaranteed atomic — that's why the human-prose markdown body uses `atomicWrite`/single-writer, and only the compact JSONL line is appended. |
| **Directory-scan task queue with atomic claim** | a dir of `<subtask>.md` files; `renameSync(pending/x, claimed/x)` to claim, `renameSync(claimed/x, done/x)` to complete | Each move is **atomic on POSIX** — two agents racing to claim the same file: one `rename` wins, the other gets `ENOENT` and moves on. | Same Windows rename caveat. The `pending`→`claimed`→`done` move IS the claim protocol — no separate lock needed because the rename itself is the test-and-set. This is exactly DeLM's "pending→completed via atomic move." |
| **Stale-claim recovery** | timestamp inside the claim file; a sweeper role re-`rename`s `claimed/x` back to `pending/x` if `at` is older than a threshold | Optimistic; no daemon. | A *role/workflow rule*, not a background process (no watcher process allowed). Runs when an agent next scans the queue. |

**Confidence: HIGH.** `fs.rename` POSIX-atomicity / Windows-fails-if-exists, `'wx'`/`O_EXCL` exclusive-create + EEXIST + NFS caveat, `mkdir` as the NFS-safe atomic alternative, and `O_APPEND` small-write atomicity are all verified against the Node docs and multiple corroborating sources (see Sources). One open verify below for exact `PIPE_BUF` portability.

## Claude Code sub-agent spawning (the primary target) — verified current behavior

Verified against `code.claude.com/docs/en/sub-agents` (June 2026, CC v2.1.x):

- **The tool is `Agent`** (renamed from `Task` in **v2.1.63**; `Task(...)` still works as a legacy alias). To spawn, an agent must have `Agent` in its `tools` list; `Agent(worker, researcher)` is an **allowlist** restricting which types it may spawn; omitting `Agent` entirely means it **cannot spawn**. (This is the lever grugops uses: grant `Agent(...)` to the Orchestrator/coordinator only — the WR-05 guard inverts from "no role may have Agent" to "only the coordinator may.")
- **Nesting is NOW supported — as of v2.1.172** ("a subagent can spawn its own subagents"). This **reverses the constraint that shaped the v1.x single-window design.** Depth caveats: **foreground** subagents can spawn at any depth (self-limiting — each blocks its parent); **background** subagents stop receiving the `Agent` tool at **depth 5** (a fixed, non-configurable runaway-prevention cap). For grugops this means a `--agent` Orchestrator can spawn role agents, and a role agent (e.g. a reviewer) can fan out per-finding — within depth 5 for background trees.
- **Parallelism is real via background subagents:** "Background subagents run concurrently while you continue working." The docs' "Run parallel research… spawn multiple subagents to work simultaneously" pattern is the DeLM fan-out. Foreground subagents block; background ones are the parallel lane. `CLAUDE_CODE_FORK_SUBAGENT=1` forces every spawn to background.
- **Shared filesystem by default (the load-bearing fact for a file-based context):** "A subagent starts in the main conversation's current working directory." `cd` doesn't persist, but reads/writes hit the **same project files** — so parallel subagents naturally share `.grugops/context/`. This is precisely why a *file-based* shared context works without IPC. `isolation: worktree` gives an **isolated** repo copy — grugops generally does **NOT** want this for the shared context (it would fork the files); reserve worktree isolation for code-edit agents that must not collide on source, while they still publish verified notes back to the shared (non-isolated) context path. (Verify the worktree↔shared-path interaction during dogfood.)
- **Each subagent has its own context window; only a summary returns** — DeLM's two-tier memory maps directly: the subagent's verbose trajectory stays in its window (auto-compacts on the same logic as main), and it **promotes verified notes to the shared file** before returning. The summary-to-parent is the cheap channel; the shared file is the durable verified channel.
- **Plugin-subagent restriction (unchanged, matters for distribution):** plugin-shipped agents **ignore `hooks`, `mcpServers`, `permissionMode`** for security. The prod-deploy guard and any spawn-related hooks must ship in **standalone `.claude/agents/`** / settings, not the plugin. Ship the spawning Orchestrator standalone.
- **Agent teams (adjacent, FLAG it):** for sessions that *communicate* (not just spawn-and-summarize), `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` enables `SendMessage` + teammate resume. This is the closer analogue to DeLM's "agents build on each other's progress asynchronously," but it is **experimental** — grugops should build on the stable file-based shared context (works everywhere, audit-trailed) and treat agent-teams messaging as an optional accelerant to evaluate, not a dependency. **(MEDIUM — experimental; verify before relying.)**

## The degraded sequential path (the other four CLIs) — what stack support it needs: essentially none

- **Mechanism:** the existing single-window sequential role-load (`_role-switch-protocol.md`). The Orchestrator loads role files into its own context in turn (no spawning on Codex/Gemini/OpenCode/Copilot).
- **What changes for v2.0:** step-4 of the protocol stops reading/writing a frozen handoff packet and instead does **read-before-act (`readContext`) / write-after-verify (`appendNote`)** against the same `.grugops/context/<task-id>.md` + queue files. The shared context is the memory; sequentiality just means the queue drains one claim at a time and there are never two writers (so the concurrency primitives are belt-and-suspenders here, not load-bearing).
- **Stack support required: none new.** It's file Read/Write the host agent already does. The atomic primitives still apply (a crashed sequential run mid-write must not corrupt the context), but contention is zero, so even the lock can be a no-op fast path. "Degrade, never break": same files, same format, same verify discipline — minus parallelism.
- **The honest win:** even sequential, the four CLIs gain the *accumulated verified context* + *failed-attempt memory* over static handoffs. The DeLM speed/cost win is parallelism-driven (Claude Code only), but the *quality/auditability* win from a verified-context substrate accrues to all five.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Markdown source + JSONL mirror** | Pure JSONL (DeLM-style `lessons/`) | Never for grugops — pure JSONL forfeits the readable/diffable/auditable core value. Use the mirror for the gate, keep markdown authoritative. |
| **`openSync('wx')` / `mkdirSync` lock** | `proper-lockfile` npm | Never — it's an npm runtime dep on hosts (forbidden). `proper-lockfile` *itself* uses `mkdir`; grugops just calls `mkdirSync` directly. |
| **Directory-of-files queue + atomic rename** | SQLite queue / Redis / a broker | Never — DB/queue/daemon is explicitly Out of Scope. The dir-rename queue is DeLM's own file-based recipe and needs zero infrastructure. |
| **File-based shared context (works on all 5 CLIs, audit-trailed)** | Claude Code **agent teams** `SendMessage` IPC | Consider agent-teams as an *accelerant* for Claude-Code-only async coordination once it leaves experimental — but never as the substrate (it's CC-only, ephemeral, not auditable, experimental). |
| **`isolation: worktree` only for source-editing agents** | Worktree for everything | Don't isolate the shared context — isolation forks the very files agents must share. Isolate code edits, share the context path. |
| **Stale-claim sweep as a role/workflow rule** | A background watcher daemon (`chokidar`) | Never — no background process / no watcher dep. Reclaim on next queue scan. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Any npm runtime dep on hosts** (`proper-lockfile`, `gray-matter`, `js-yaml`, `chokidar`, SQLite bindings) | Violates zero-runtime-dep constraint; hosts run committed `.js` with nothing installed | `node:fs` stdlib + hand-rolled/JSONL metadata parse |
| **A queue daemon / message broker / watcher process** | "Not a platform/runtime/queue"; nothing to operate is the whole point | Directory-scan queue with atomic `rename`; reclaim on scan |
| **JSONL (or a DB) as the source of truth** | Breaks the readable/diffable/auditable markdown core value | Markdown authoritative; JSONL derived index for the gate |
| **`isolation: worktree` for context-sharing agents** | Forks the shared files → agents stop sharing context | Shared CWD (default); worktree only for colliding source edits |
| **Large multi-KB `appendFileSync` for the verified log** | `O_APPEND` atomicity only holds for small (`≤PIPE_BUF`) writes; big appends can interleave | Append a small JSONL metadata line; put prose in the `atomicWrite`-published markdown |
| **Relying on `fs.rename` atomic-replace on Windows** | Windows native rename fails if dest exists / isn't POSIX-atomic | `unlink`-then-`rename`, or single-writer files; document the caveat |
| **`O_EXCL` (`'wx'`) locks on NFS-mounted state** | `O_EXCL` has a documented NFS race | `mkdirSync` claim (atomic + NFS-safe) when state may be networked |
| **Granting the `Agent` tool to every role** (the inverse mistake) | Uncontrolled fan-out, cost blowup, defeats the coordinator model | Grant `Agent(<allowlist>)` to the Orchestrator/coordinator only; guard it mechanically |
| **Building on agent teams `SendMessage` as the substrate** | Experimental, Claude-Code-only, ephemeral, not auditable | File-based shared context (portable + audit-trailed); treat agent-teams as optional |
| **Re-running the v1.x "subagents can't nest" assumption** | **Stale** — nesting shipped in CC v2.1.172 | Design for optional nested fan-out within the depth-5 background cap |
| `docs.claude.com/...` links | 301-redirect | `code.claude.com/docs/en/*` |

## Stack Patterns by Variant

**Claude Code (primary, parallel):**
- Main thread = `grugops-orchestrator` via `--agent` (or `agent` in `.claude/settings.json`); it holds `Agent(<roles>)` and spawns role subagents **in the background** for true parallelism.
- Each role subagent: own context window, shares `.grugops/context/` via the common CWD; reads-before-act, writes-after-verify, promotes only verified notes to the shared file; its verbose trajectory stays in its window (auto-compacted).
- Optional nested fan-out (e.g. reviewer → per-finding verifier) within the depth-5 background cap.
- Source-editing agents may use `isolation: worktree` to avoid colliding on code, while still publishing verified notes to the shared (non-isolated) context.

**Codex CLI / Gemini CLI / OpenCode / Copilot CLI (degraded, sequential):**
- Single-window sequential role-load; one role at a time drains the queue and reads/writes the same shared context files.
- No spawn, no parallelism — but the same verified-context + failed-attempt memory + auditability. Concurrency primitives are inert (single writer) but harmless.

**State location (carries the v1.1 two-root model):**
- Shared context + queue are **per-repo STATE** (`.grugops/context/`, `.grugops/queue/`), seeded by the installer skip-if-exists — never in the read-only `$GRUGOPS_HOME` kit.
- If per-repo state may live on a network mount, prefer `mkdirSync` claims over `'wx'` locks.

## Version Compatibility

| Item | Compatible With | Notes |
|------|-----------------|-------|
| `Agent` tool | Claude Code **v2.1.63+** | `Task` alias still works on newer versions |
| **Nested subagent spawning** | Claude Code **v2.1.172+** | The constraint reversal; foreground = any depth, background = depth-5 cap. Below v2.1.172, design degrades to a single spawn level (Orchestrator → roles, no role fan-out) — still parallel, just flatter. **Flag the minimum CC version in docs.** |
| `--agent` main-thread / `agent` setting | CC v2.1.x | The Orchestrator-as-main-thread pattern that can spawn |
| Background subagents (concurrency) | CC v2.1.x | `CLAUDE_CODE_FORK_SUBAGENT=1` forces background; `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` disables |
| Agent teams (`SendMessage`) | CC, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | **Experimental** — optional accelerant, not a dependency |
| Plugin-shipped subagents | CC v2.1.x | **Ignore** `hooks`/`mcpServers`/`permissionMode` — ship the spawning Orchestrator + guards **standalone**, not in the plugin |
| `node:fs` atomic primitives | Node **22+** | `rename` (POSIX-atomic / Windows-fails-if-exists), `'wx'`/`O_EXCL` (EEXIST; NFS-unreliable), `mkdir` (atomic, NFS-safe), `O_APPEND` small-write atomicity |
| grugops dev/build deps | `{typescript, vitest, @types/node}` | **Unchanged** from v1.2; dev/CI-only, never shipped. **No new dependency for v2.0.** |

## Conflicts With Project Constraints — checked, none

- **Markdown-only kit (no runtime/DB/queue):** ✅ shared context is markdown; queue is a directory; the only code is stdlib-`node:fs` TS helpers (same class as the existing validator/ASVS/catalog tooling).
- **Zero runtime deps on hosts:** ✅ everything is `node:fs` + the host agent's own tools. No `proper-lockfile`/`gray-matter`/`js-yaml`/broker.
- **Single-source role text + thin adapters:** ✅ the context format + verify discipline live once in the protocol/workflows; adapters stay pointers.
- **Zero-config first + dial:** ✅ shared context defaults on; parallelism is Claude-Code-only and auto (degrades silently elsewhere); compaction depth can be dialed.
- **No fabrication / the trace is the proof:** ✅ a `finding` without a `verified_by` stamp is a structural failure; `claim`/`UNKNOWN - verify` carries unverified statements honestly — the verify-before-write mechanism IS the no-fabrication floor, now mechanical.
- **Safety hard limit unchanged:** ✅ the prod-deploy PreToolUse guard is untouched; spawned/parallel agents still hit it; humans still hold merge/deploy. Spawn grant is restricted to the coordinator and guarded.
- **Voice discipline:** ✅ context notes' prose is clear-voice for findings/decisions/security; caveman voice stays in role framing.

## Open Questions / Flags for Requirements/Roadmap

- **`UNKNOWN - verify` (LOW):** exact `PIPE_BUF` value across target OSes (Linux 4096; macOS/Windows differ) bounding "atomic small append." Resolve by keeping JSONL lines well under 512 bytes (POSIX-minimum `PIPE_BUF`) — or by treating the JSONL mirror as single-writer-per-task (publish via `atomicWrite`) and dropping reliance on append-atomicity entirely. **Recommend the latter as the safe default; append-atomicity is an optimization, not a requirement.**
- **Verify during dogfood (MEDIUM):** the `isolation: worktree` ↔ shared-context-path interaction — confirm a worktree-isolated code agent can still read/write the *non-isolated* `.grugops/context/` (it should, if the path resolves to the main checkout, not the worktree). If worktree re-roots the path, source-editing agents must publish notes via an absolute/main-repo path.
- **Verify during dogfood (MEDIUM):** parallel background subagents actually serialize correctly on `appendNote`/`atomicWrite` under real concurrency (the Tier-2 E2E harness should assert N agents → N distinct verified notes, no clobber, no lost note). This is where A3/DOG-02 is honestly *retired*.
- **Decision needed (human):** JSONL mirror = committed derived artifact (then add a `freshness:context` gate) **or** purely per-repo runtime state (then it's not in the kit, no freshness gate). Recommend **runtime state** (it's per-task, ephemeral, not kit content) — the markdown is the durable record, git is the audit log.
- **Decision needed (human):** minimum Claude Code version to advertise — **v2.1.172** to promise nested fan-out, or **v2.1.63** for flat parallel (Orchestrator→roles) and document nesting as "v2.1.172+". Recommend advertising v2.1.63 floor with nesting as a documented enhancement.
- **Flag for roadmap:** the WR-05 guard *inverts* — from "no role may grant `Agent`" to "only the coordinator may, and via `Agent(<allowlist>)`." The mechanical guard, the packaging templates, and the catalog must all flip together (single coordinated change, like the v1.2 TS pivot).

## Sources

- code.claude.com/docs/en/sub-agents — `Agent` tool (renamed from `Task` in v2.1.63), `Agent(allowlist)` syntax, **nested spawning as of v2.1.172** + depth-5 background cap, background-subagents-run-concurrently, subagent starts in main CWD (shared filesystem), own context window + summary-return, `isolation: worktree`, plugin-subagent ignores hooks/mcpServers/permissionMode, agent teams `SendMessage` experimental flag (HIGH — fetched June 2026)
- nodejs.org/api/fs — file-system flags: `'wx'`/`'ax'` = `O_EXCL` exclusive-create, `'a'`/append, `O_EXCL` unreliable on network filesystems; `appendFileSync`/`renameSync`/`openSync` API surface (HIGH — Node v26.x docs)
- Multiple corroborating sources on `fs.rename` atomicity — POSIX: atomic-replace (reader sees old or new, never partial); Windows: native rename fails if dest exists / not POSIX-atomic; temp-file-then-rename is the cross-platform pattern (MEDIUM, corroborated — medium.com, github node-fs-extra #835, wikipedia Rename(computing))
- Multiple corroborating sources on `O_EXCL`/`'wx'` lockfiles — atomic test-and-set, `EEXIST` on contention, **NFS race**, `mkdir` as the NFS-safe atomic alternative (the `proper-lockfile` approach) (MEDIUM, corroborated — github andrasq/node-fslock, npm proper-lockfile, blog.logrocket.com file locking)
- github.com/yuzhenmao/DeLM — modules `shared_lessons.py` (cross-thread typed notes), `verifier.py` (validate before shared write), `memory_compactor.py` (compact local trajectory); two-tier memory (local per-thread + shared lessons); outputs `lessons/`, `events.jsonl`, `trajectories/` (HIGH for modules; the file-based/markdown adaptation recipe is taken from the milestone-context grounding, MEDIUM as I could not re-confirm that exact README section in this fetch)
- arXiv 2606.10662 (Mao & Mirhoseini 2026, *Decentralized Multi-Agent Systems with Shared Context*) — the three primitives (shared verified context / task queue / parallel agents), +up to 10.5 pp SWE-bench Verified & ~50% cost claims (per milestone grounding — established, not re-derived)
- Project files: `.planning/PROJECT.md` (v2.0 milestone + Key Decisions D-08 reversal, two-root state model), `.planning/milestones/v1.2-research/STACK.md` (committed-`.js` TS tooling baseline, Node 22+, zero-runtime-dep convention) (HIGH — authoritative for the existing baseline)

---
*Stack research for: grugops v2.0 — decentralized shared-verified-context substrate, file-based queue, Claude Code parallel spawning, degraded-sequential path*
*Researched: 2026-06-16*
