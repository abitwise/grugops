# Phase 20: Shared-Context Substrate & Concurrency Foundation - Research

**Researched:** 2026-06-17
**Domain:** Cross-platform filesystem concurrency primitives (`node:fs`) + committed-derived-index freshness gating + foundation-guard grep + typed-note schema/queue layout, on the committed-`.js`+freshness tooling layer (D-13)
**Confidence:** HIGH

> **Framing:** The design is LOCKED in `20-CONTEXT.md` (DeLM verified against `github.com/yuzhenmao/DeLM` this session). This research does NOT re-open it. It nails the **proof mechanics** the planner needs — the cross-platform atomic primitives, the freshness-gate clone shape, the guard clone shape, the schema/queue concreteness — and produces the mandatory **Validation Architecture**.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Per-note files as the write unit.** Each note is its own markdown file, published by atomic write-temp-then-`rename`; **lock-free**. The note files ARE the markdown source of truth. `appendNote` = write one NEW file, never mutate a shared file. (Filesystem-native analog of DeLM's `asyncio.Lock`-serialized append-only list, which does NOT port — DeLM is single-process; grugops agents are separate processes.)
- **Note identity = `<at-compact>-<by>-<kind>-<nonce>.md`** (e.g. `20260617T142305Z-engineer-finding-a1b2.md`). Time-prefix → legible `ls`; `nonce` (`crypto.randomUUID()` slice, `node:crypto`, zero-dep) → lock-free uniqueness so two same-millisecond writers never clobber. **Authoritative order/replay = the `at`+`supersedes` fields per SCTX-04; the filename is storage/convenience only.**
- **Note format = YAML frontmatter + markdown body** (kit-idiomatic CommonMark+frontmatter). Frontmatter carries the SCTX-01 provenance fence: `kind`/`by`/`at`/`verified_by`/`confidence`/`refs` (YAML list)/`supersedes` (note-id ref). JSONL index line = frontmatter→JSON.
- **Per-task folder layout** `.grugops/context/<task>/` with `index.md` (templated consolidated task-notes — HUMAN-FACING, DERIVED, freshness-gated, zero-token), `index.jsonl` (derived machine event index, committed, freshness-gated, SCTX-03), `notes/` (append-only raw note files, the SCTX-04 audit substrate, git-tracked, RETAINED — never pruned on consolidation). Exact filenames planner-final; the *structure* is locked.
- **Consolidation is a DETERMINISTIC TS render** — `context-io.ts` reads `notes/` frontmatter and emits the templated `index.md`, byte-reproducible and freshness-gated. **Zero-token. NOT an LLM summary.** Semantic distillation is Phase 22.
- **Raw notes persist** (never pruned/replaced on consolidation) — preserves the append-only `git log` audit trail.
- **The consolidated task-notes TEMPLATE is a Phase-20 contract artifact**, in `agent-factory/contracts/`, alongside the note-schema doc.
- **Boundary:** Phase 20 ships the render fn + template + freshness gate; *wiring roles to call render-on-done* is Phase 24.
- **Write unit = the claimed task → single-writer common path.** Atomic queue-claim (`mkdirSync`, CLAIM-02) makes each task exclusively owned; within-task writing is normally single-writer; genuine same-folder concurrency only at the **stale-claim reclaim** edge. **The primitive stays safe under concurrency anyway** (SC-2 + DOGF-02) — do NOT weaken SC-2.
- **Queue = `.grugops/queue/{pending,claimed,done}/`;** transitions by atomic rename; no central lock manager. **Claim = `mkdirSync(claimed/<task>/)`** — atomic, NFS-safe, preferred over `O_EXCL`; a second claimant's `mkdir` throws `EEXIST` = claim lost (CLAIM-02).
- **The claim records `by` + `at` + task-ref** in `claimed/<task>/claim.md` (frontmatter) — this IS the "now-running" registry.
- **Staleness = generous, configurable wall-clock TTL, evaluated at an EXPLICIT coordinator-run sweep** — NOT DeLM's 300 s (default must exceed a real agent turn). **pid/host liveness is rejected** (not portable cross-machine / NFS). Heartbeat/lease liveness deferred to v2.x (PAR-05). DOGF-02 is the honest gate.
- **Subtask file in `pending/` = thin but self-contained** — what-to-do + a `ref` to its `.grugops/context/<task>/` folder + the originating ticket — NOT a fat duplicate of the ticket.
- **Windows → real.** Add a `windows-latest` leg to the existing vitest matrix; the `unlinkSync`-then-`renameSync` branch actually executes on real Windows. **NFS → deterministic + honest `UNKNOWN - verify`** — unit-test the logic deterministically, mark true-NFS runtime `UNKNOWN - verify`. DOGF-02 / PAR-05 are the eventual real gates.
- **Build model (D-13, LOCKED):** TS authored → `tsc` to committed `.js` → freshness-checked → vitest-covered. Dev deps stay `{typescript, vitest, @types/node}` — add NOTHING else. `node:fs`-only; **zero host runtime deps.** Clone `scripts/freshness.ts` for `freshness:context`; `scripts/generate-catalog.ts` + `scripts/catalog-freshness.ts` + `*.test.ts` for the new helpers. Register `guard_context_writes` in `scripts/check-foundation-guards.ts`.
- **New helpers:** `context-io.ts` (`readContext` / `appendNote` / `atomicWrite` + deterministic `index.md` render + JSONL index regen) and `claim.ts` (`mkdirSync` claim + explicit stale-sweep). Windows unlink-then-rename in both.
- **Six note kinds:** `claim` / `finding` / `decision` / `failed-attempt` / `observation` / `artifact-ref`.
- **CRITICAL naming distinction:** the `claim` **note-KIND** (a soft, unverified assertion that — per VFY-04, Phase 21 — can NEVER satisfy a `finding`'s admission) is DIFFERENT from the **queue CLAIM** (hard work-ownership via atomic `mkdir`, CLAIM-01/02). Docs/schema MUST NOT blur the two.
- **Voice:** Clear (non-caveman) voice on the schema / validator / guard / freshness surfaces — they touch safety + the trace.

### Claude's Discretion
- Exact nonce length / token format against `node:crypto` specifics.
- Exact derived-artifact filenames (`index.md` vs `<task>.md`; `index.jsonl` vs `events.jsonl`) and per-task vs rolled JSONL granularity (SCTX-03 says per-task — confirm).
- Internal structure of the `index.md` / task-notes template (sections, ordering) — the *existence* of a deterministic template is locked; its exact shape is open.

### Deferred Ideas (OUT OF SCOPE)
- DeLM invalid-evidence phrase list → Phase 21 (VFY-02).
- Per-delegation claim cap (`MAX_CLAIMS_PER_DELEGATION = 2`) → Phase 23.
- Heartbeat / advisory-lease claim liveness (`mcp_agent_mail` pattern) → v2.x (PAR-05).
- Human-facing "now-running" board projection + WIP width cap → Phase 23.
- Semantic (LLM) distillation of task notes → Phase 22 (CMP).
- Rewiring roles/workflows onto the substrate + deleting handoffs; render-on-task-done wiring; `install.ts` seeding of the new dirs → Phase 24.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCTX-01 | Typed-note schema: six kinds + provenance fence (`by`/`at`/`verified_by`/`confidence`/`refs`/`supersedes`); markdown is source of truth | Schema shape & frontmatter→JSON projection (§Note Schema); validator-FAIL on missing field (§Validation Arch SC-1) |
| SCTX-02 | `context-io.ts` — `node:fs`-only `readContext`/`appendNote`/`atomicWrite`, committed `.js`, Windows-safe (unlink-then-rename), freshness-checked | Atomic-write primitive + Windows branch (§Atomic Primitives); clone `generate-catalog.ts`+`*.test.ts` shape |
| SCTX-03 | Committed per-task JSONL index derived from markdown, `freshness:context` drift gate (regen→byte-diff, fail-closed); markdown wins | Clone `freshness.ts`/`catalog-freshness.ts` mirror-spawn (§Freshness Gate); per-task confirmed; deterministic render (§Deterministic Render) |
| SCTX-04 | Append-only git-tracked audit trail; every note carries `by`/`at`/`verified_by`/`supersedes`; trace replays from `at`+`supersedes` (not file position); `git log` = attribution | Replay semantics (§Replay), append-only-via-new-file (§Atomic Primitives) |
| SCTX-05 | `guard_context_writes` — foundation guard fails RED if any shipped role/workflow text writes context by a non-`context-io.ts` path | Clone `guard_wr05` grep shape + planted-fixture test (§Guard Clone) |
| CLAIM-01 | File-based queue `.grugops/queue/{pending,claimed,done}/`; subtask files transition by atomic rename; no central lock manager | Queue layout + rename transitions (§Queue & Claim) |
| CLAIM-02 | `claim.ts` — atomic claim via `mkdirSync` (NFS-safe, preferred over `O_EXCL`) + stale-claim sweep; `node:fs`-only, committed `.js`, cross-platform tested | `mkdirSync`→EEXIST claim primitive + TTL sweep (§Queue & Claim, §Atomic Primitives) |
</phase_requirements>

## Summary

Phase 20 is a **proof-mechanics phase, not a design phase**. The architecture (per-note files + atomic rename for writes, `mkdirSync` for claims, committed-JSONL derived from markdown, a grep guard over shipped role text) is locked and HIGH-confidence. The genuinely open work the planner must nail is: (1) the **exact cross-platform shape** of `atomicWrite` and the `mkdirSync` claim so they are crash-safe and un-clobbered on POSIX AND Windows; (2) **cloning the existing freshness gate** (`freshness.ts` / `catalog-freshness.ts`) precisely for a derived *per-task index* rather than build outputs; (3) **cloning an existing foundation guard** (`guard_wr05`) into `guard_context_writes` with a planted raw-write fixture; and (4) the **concrete frontmatter→JSON projection** and the **`at`+`supersedes` replay** semantics. Every new helper follows the established D-13 template: `node:fs`-only TS → `tsc` to committed `.js` → freshness-checked → spawn-the-compiled-`.js` vitest oracle.

The single load-bearing risk is **cross-platform atomic-write correctness**. `fs.renameSync` atomically replaces an existing destination on POSIX but on Windows uses `MoveFileEx`, is **not atomic, and fails with EPERM/EACCES when the destination is locked or already exists** — which is exactly why the locked design mandates the `unlinkSync`-then-`renameSync` Windows branch. The mitigating fact that makes this far less scary than it sounds: the locked **per-note-file** model means `appendNote` writes to a *fresh, uniquely-named* path (time+by+kind+nonce), so the publish-rename target **never already exists** — the rename-onto-existing-target hazard only applies to the `index.md`/`index.jsonl` derived-artifact regen, which is single-writer (coordinator render, or the owning agent). The `mkdirSync` claim primitive is genuinely cross-platform and NFS-safe by construction (atomic create-or-fail), with `EEXIST` as the unambiguous "claim lost" signal.

The validation architecture maps each of the 5 ROADMAP Success Criteria to a concrete, mostly-deterministic proof: SC-1 a validator structural-FAIL fixture; SC-2 a concurrent-write unit test (plus the real `windows-latest` CI leg for the unlink-then-rename branch); SC-3 a `mkdirSync`-EEXIST exclusivity unit test; SC-4 a freshness-drift test (edit-markdown-without-regen trips the gate); SC-5 a planted-raw-write guard-fires test. True-NFS runtime stays honestly `UNKNOWN - verify` (DOGF-02/PAR-05 are the real gates), mirroring Phase 19's posture.

**Primary recommendation:** Build five artifacts on the D-13 template — `context-io.ts`, `claim.ts`, the `freshness:context` gate (clone `catalog-freshness.ts`'s mirror-spawn), `guard_context_writes` (clone `guard_wr05` into `check-foundation-guards.ts`), and the `agent-factory/contracts/` note-schema doc + task-notes template — each with a spawn-the-compiled-`.js` vitest oracle that proves both PASS and a planted FAIL. Make the publish-rename target always a fresh unique path so the cross-platform hazard collapses to the single-writer derived-artifact regen; add the `windows-latest` matrix leg for real; mark true-NFS `UNKNOWN - verify`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Atomic note publish (`appendNote`/`atomicWrite`) | Tooling layer (`context-io.ts`, committed `.js`) | Filesystem (`node:fs` rename) | The sanctioned write path; the only code allowed to touch `.grugops/context/`. Roles call it, never raw-write. |
| Deterministic `index.md` + `index.jsonl` render | Tooling layer (`context-io.ts`) | Filesystem | Zero-token derived render from `notes/` frontmatter; byte-reproducible so the freshness gate can diff it. |
| `freshness:context` drift gate | Tooling layer (standalone gate script) | CI (`npm run` script) | Proves committed derived index == fresh regen; fail-closed. Markdown is SoT; JSONL is the mirror. |
| Atomic queue claim (`mkdirSync`) + stale sweep | Tooling layer (`claim.ts`, committed `.js`) | Filesystem (`mkdir` atomicity) | Work-ownership without a central lock manager; `EEXIST` = claim lost. NFS-safe by construction. |
| Queue state transitions (`pending→claimed→done`) | Filesystem (atomic rename of subtask files) | Tooling layer (`claim.ts` orchestrates) | No daemon; the directory IS the state. |
| `guard_context_writes` (raw-write detection) | Tooling layer (`check-foundation-guards.ts` aggregator) | CI / §14 gate | Grep over shipped role/workflow text; fails RED on any non-sanctioned write path. Single-source — folds into the existing aggregator, never forks gate logic. |
| Note schema + task-notes template (contract docs) | Markdown (`agent-factory/contracts/`) | Validator | The human + machine contract; markdown is the source of truth everywhere. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs` | Node 22+ stdlib (verified on Node 24.12.0 locally; floor is 22 LTS) | `renameSync` (atomic publish, POSIX), `mkdirSync` (atomic NFS-safe claim → `EEXIST`), `unlinkSync` (Windows pre-rename branch), `writeFileSync`/`readFileSync`/`readdirSync`/`statSync` (note I/O), `rmSync`/`existsSync` | The entire concurrency model. ZERO host runtime deps (the whole point). Already the only thing the committed `.js` tooling uses. `[VERIFIED: node --version → v24.12.0; matches CLAUDE.md Node 22+ floor]` |
| `node:crypto` | Node 22+ stdlib | `randomUUID()` slice for the note-id `nonce` (lock-free same-millisecond uniqueness) | Zero-dep; already used in `install/install.test.ts` (`createHash`). `[VERIFIED: grep node:crypto → install/install.test.ts:46]` |
| `node:path` | Node 22+ stdlib | `join`/`basename`/`sep`/`dirname` path construction; POSIX-normalize findings | Used by every existing script. `[VERIFIED: codebase grep]` |
| `node:child_process` | Node 22+ stdlib | `spawnSync` for the freshness gate's mirror-spawn regen + the vitest oracle's spawn-the-compiled-`.js` | The freshness/test idiom in `freshness.ts`, `catalog-freshness.ts`, every `*.test.ts`. `[VERIFIED: codebase grep]` |
| `node:os` | Node 22+ stdlib | `tmpdir()` for the freshness gate's throwaway mirror + test temp dirs | Used in `freshness.ts`/`catalog-freshness.ts`. `[VERIFIED: codebase grep]` |
| TypeScript | `~6.0.3` (devDep) | Author the helpers; `tsc` to committed `.js` | D-13 locked. `[VERIFIED: package.json devDependencies]` |
| vitest | `~4.1.8` (devDep) | Spawn-the-compiled-`.js` behavioral oracles | The test framework for all `scripts/*.test.ts`. `[VERIFIED: package.json devDependencies]` |
| `@types/node` | `~22` (devDep, type-only) | Types only; never shipped | D-13 locked. `[VERIFIED: package.json devDependencies]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none — no new packages) | — | — | The phase adds ZERO dependencies. Frontmatter parsing reuses the existing stdlib slice+regex parser (`generate-catalog.ts` `parseFrontmatter`), NOT js-yaml/gray-matter. JSONL lines are `JSON.stringify`/`JSON.parse`. `[CITED: generate-catalog.ts:49-59 "stdlib slice+regex — NO js-yaml/gray-matter"]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `mkdirSync` claim | `openSync(path, 'wx')` / `O_EXCL` | `O_EXCL` exclusive-create is documented-unreliable on NFS (the locked design's stated reason `mkdir` is preferred). `mkdir` atomicity holds on NFS. `[CITED: SUMMARY.md Sources — Node v26.x fs flags table + 0pointer.de locking + Red Hat 43001]` |
| Per-note files | Single shared append file + `O_APPEND` | A single shared file reintroduces interleaved-append / torn-read across separate processes; `O_APPEND` atomicity caps at PIPE_BUF and is not cross-process-safe for large notes. Per-note-file rename is the filesystem-native serialization that ports across separate-process agents. `[CITED: CONTEXT.md <specifics> — asyncio.Lock does not port]` |
| stdlib regex frontmatter parser | `js-yaml` / `gray-matter` | Would add a host-shipped dependency (forbidden). The existing flat key:value + YAML-list parse covers the provenance fence. Note: `refs` is a YAML list — confirm the parser handles list syntax or extend it minimally (see Open Questions). |

**Installation:**
```bash
# No installation. Zero new dependencies (host or dev). The dev/build deps
# {typescript, vitest, @types/node} are already present.
```

**Version verification:**
```bash
node --version          # → v24.12.0 (>= Node 22 floor) [VERIFIED this session]
# package.json devDependencies: typescript ~6.0.3, vitest ~4.1.8, @types/node ~22 [VERIFIED]
```

## Package Legitimacy Audit

> **Not applicable.** This phase installs **zero external packages** (host or dev). All code uses Node stdlib (`node:fs`/`node:crypto`/`node:path`/`node:child_process`/`node:os`); the dev/build toolchain (`typescript`, `vitest`, `@types/node`) is unchanged from v1.2 and already audited. There is nothing for slopcheck to evaluate. The zero-runtime-dep constraint (CLAUDE.md) makes any new package a constraint violation, not a research finding.

## Architecture Patterns

### System Architecture Diagram

```
                  ┌─────────────────────────────────────────────────────────┐
                  │  ROLE AGENT (Claude Code subagent / sequential CLI)     │
                  │  — NEVER raw-writes .grugops/context/ —                 │
                  └───────────────┬─────────────────────┬───────────────────┘
            claim a task          │                     │   record a note
                                  ▼                     ▼
        ┌──────────────────────────────┐   ┌──────────────────────────────────────┐
        │ claim.ts                     │   │ context-io.ts (THE sanctioned write   │
        │  claimTask(task):            │   │   path; guard_context_writes enforces) │
        │   mkdirSync(claimed/<task>/) │   │  appendNote(task, note):              │
        │     → EEXIST = claim lost ───┼──▶│   1. compose frontmatter+body          │
        │   write claim.md (by/at/ref) │   │   2. atomicWrite(notes/<id>.md):       │
        │  sweepStale(ttl):            │   │        write notes/.tmp-<id>           │
        │   ls claimed/, read claim.md │   │        rename → notes/<id>.md          │
        │   at+ttl < now → reclaim     │   │        (target ALWAYS fresh/unique)    │
        └──────────────┬───────────────┘   └──────────────────┬───────────────────┘
                       │ atomic rename                          │ append-only NEW file
                       ▼                                        ▼
   .grugops/queue/                              .grugops/context/<task>/
     pending/<task>.md  ──rename──▶               notes/                     ◀── SoT (git-tracked,
     claimed/<task>/    (claim dir)                  <at>-<by>-<kind>-<nonce>.md    append-only, RETAINED)
       claim.md  (now-running registry)           index.md   ◀── DERIVED (deterministic render,
     done/<task>.md    ◀──rename──                              freshness-gated, zero-token, human-facing)
                                                   index.jsonl ◀── DERIVED (frontmatter→JSON, committed,
                                                                    freshness-gated, machine-parsable)
                                                          ▲
                                                          │ regenerate → byte-diff (fail-closed)
                                       ┌──────────────────┴───────────────────────┐
                                       │ freshness:context gate (clone of          │
                                       │ catalog-freshness.ts mirror-spawn):       │
                                       │  regen index.md+index.jsonl from notes/   │
                                       │  byte-compare committed vs fresh          │
                                       │  drift / failed-regen → exit 1 (markdown  │
                                       │  WINS on any conflict)                    │
                                       └───────────────────────────────────────────┘

   guard_context_writes (in check-foundation-guards.ts aggregator → §14 PR-quality gate):
     grep shipped role/workflow .md text for raw context-write patterns (writeFileSync/
     appendFileSync/Write/echo > on .grugops/context/...) NOT routed through context-io.ts
     → any hit = FAIL RED.   [planted raw-write fixture proves it fires]
```

### Recommended Project Structure
```
scripts/
├── context-io.ts            # readContext / appendNote / atomicWrite + deterministic render + JSONL regen
├── context-io.test.ts       # spawn-compiled-.js oracle: concurrent writes un-clobbered; Windows branch
├── claim.ts                 # mkdirSync claim (EEXIST=lost) + explicit TTL stale-sweep
├── claim.test.ts            # exclusivity (2nd claimant EEXIST) + rename transitions + sweep reclaim
├── context-freshness.ts     # freshness:context gate (clone of catalog-freshness.ts mirror-spawn)
├── context-freshness.test.ts# fresh PASS / planted-drift STALE / fail-closed-on-broken-regen
└── check-foundation-guards.ts  # EXTEND: register guard_context_writes (clone guard_wr05)
   (check-foundation-guards.test.ts — EXTEND: planted raw-write fixture → guard fires)

agent-factory/contracts/     # NEW DIR (does not yet exist — create it)
├── context-note.md          # the SCTX-01 note-schema doc (six kinds + provenance fence; clear voice)
└── task-notes.template.md   # the deterministic index.md render template (Phase-20 contract artifact)

.grugops/                    # the runtime substrate (layout DEFINED here; install.ts SEEDING is Phase 24)
├── context/<task>/{notes/,index.md,index.jsonl}
└── queue/{pending/,claimed/,done/}
```

### Pattern 1: Crash-safe atomic publish to a FRESH unique path (`appendNote`)
**What:** Write to a temp sibling, then `rename` onto the *final, never-pre-existing* note path. Because the note-id is unique (`<at>-<by>-<kind>-<nonce>`), the rename target never already exists → the cross-platform rename-onto-existing hazard does not apply to note publication.
**When to use:** Every `appendNote`. This is THE sanctioned write path.
**Example:**
```typescript
// Source: pattern derived from scripts/generate-catalog.ts (writeFileSync + fixed-literal paths)
// + scripts/freshness.ts (node:fs-only) + Node fs.rename semantics (see Common Pitfalls).
import { writeFileSync, renameSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function atomicWrite(finalPath: string, data: string): void {
  const tmp = `${finalPath}.tmp-${process.pid}-${Date.now()}`; // unique temp sibling, same dir/volume
  writeFileSync(tmp, data, "utf8");
  try {
    renameSync(tmp, finalPath);                 // POSIX: atomic replace. Win32: MoveFileEx (see below).
  } catch (e) {
    // Windows MoveFileEx fails (EPERM/EEXIST) when the destination already exists. For appendNote
    // the destination is a FRESH unique id and never pre-exists, so this branch is the DERIVED-
    // ARTIFACT (index.md/index.jsonl) regen case where we overwrite a committed file.
    if ((e as NodeJS.ErrnoException).code === "EPERM" ||
        (e as NodeJS.ErrnoException).code === "EEXIST" ||
        (e as NodeJS.ErrnoException).code === "EACCES") {
      try { unlinkSync(finalPath); } catch { /* not-present is fine */ }
      renameSync(tmp, finalPath);               // retry after removing the destination (Windows branch)
    } else {
      try { unlinkSync(tmp); } catch { /* best-effort temp cleanup */ }
      throw e;
    }
  }
}
```
> **Crash-safety note for the planner:** the `unlink`-then-`rename` Windows branch has a narrow non-atomic window (destination briefly absent between unlink and rename). For the **derived artifacts** (`index.md`/`index.jsonl`) this is acceptable because they are **single-writer** (the owning agent / coordinator render) and **freshness-gated** — a torn render is caught by the byte-diff gate, not consumed as truth. For **note publication** the branch never executes (fresh unique target). This is why the per-note-file model is load-bearing for crash-safety, not just for concurrency.

### Pattern 2: Atomic claim via `mkdirSync` → `EEXIST` (`claim.ts`)
**What:** `mkdirSync(claimed/<task>/)` is atomic create-or-fail on every platform including NFS. The directory's existence IS the claim. A second claimant gets `EEXIST` synchronously.
**When to use:** CLAIM-02 work-ownership. No central lock manager.
**Example:**
```typescript
// Source: Node fs.mkdirSync EEXIST semantics + CONTEXT.md locked claim model.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function claimTask(queueRoot: string, task: string, by: string): boolean {
  const claimDir = join(queueRoot, "claimed", task);
  try {
    mkdirSync(claimDir);                         // atomic; throws EEXIST if already claimed
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") return false; // CLAIM LOST — not an error
    throw e;                                     // ENOENT(parent missing)/EACCES etc. are real errors
  }
  // Won the claim: record the now-running registry entry (by/at/task-ref) for the stale sweep.
  const at = new Date().toISOString();
  writeFileSync(join(claimDir, "claim.md"),
    `---\nby: ${by}\nat: ${at}\ntask: ${task}\n---\n`, "utf8");
  return true;
}
```
> **Distinguish "claim lost" from "real error":** ONLY `EEXIST` means claim-lost (return `false`). Any other code (`ENOENT` = `claimed/` parent missing, `EACCES` = permissions) is a genuine failure and must `throw` — never swallow it into a false "lost".

### Pattern 3: Clone-the-freshness-gate (mirror-spawn regen → byte-diff)
**What:** The `freshness:context` gate regenerates `index.md`+`index.jsonl` from `notes/` into a throwaway temp mirror, byte-compares against the committed files, and fails closed on drift OR on a broken regen. This is `catalog-freshness.ts`'s exact shape, retargeted from `generate-catalog.js`+kit-dirs to `context-io.js`(render mode)+`notes/`.
**When to use:** SCTX-03. Markdown (`notes/`) wins on any conflict — the gate never edits `notes/`, only proves the derived files match a fresh regen.
**Example:** see `catalog-freshness.ts` (cloned verbatim in structure): `mkdtempSync` → `cpSync` the generator `.js` + source dirs into the mirror → `spawnSync` the mirrored generator → `readFileSync` committed vs rebuilt → `committed.equals(rebuilt)` → `process.exit(1)` on mismatch or non-zero regen.

### Anti-Patterns to Avoid
- **Raw `writeFileSync`/`Write`/`echo >` into `.grugops/context/` from role/workflow text:** the exact thing `guard_context_writes` exists to catch. All writes go through `context-io.ts`.
- **Mutating a shared note file:** breaks append-only audit + reintroduces torn-read across processes. `appendNote` = NEW file only.
- **Using file modification time / file position for replay order:** SCTX-04 mandates replay from the `at`+`supersedes` *fields*, not `ls` order or `mtime` (which are not authoritative and not portable).
- **Swallowing non-`EEXIST` errors as "claim lost":** masks real failures (missing queue dir, permissions).
- **Treating the JSONL as authoritative:** the markdown `notes/` is the source of truth; JSONL is the derived mirror (the deliberate inversion of DeLM). On any conflict, regenerate the JSONL from markdown.
- **pid/host liveness in the stale sweep:** rejected (not portable cross-machine/NFS). Wall-clock TTL only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-process write serialization | A custom lockfile manager / mutex | Per-note-file + `renameSync` (POSIX-atomic publish to a fresh path) | A lock manager is exactly what CLAIM-01 forbids ("no central lock manager"); the filesystem rename IS the serialization. |
| Exclusive work-claim | `O_EXCL`/`'wx'` open + lockfile | `mkdirSync` → `EEXIST` | `mkdir` is atomic AND NFS-safe; `O_EXCL` is documented-unreliable on NFS. |
| Build-output / derived-index drift detection | A bespoke hash-manifest checker | Clone `freshness.ts` / `catalog-freshness.ts` (rebuild-to-temp → byte-diff → fail-closed) | The proven, single-source pattern already in the tree; reproduces the fail-closed contract for free. |
| Raw-write detection in shipped text | A new gate script | Register a new guard fn in `check-foundation-guards.ts` (clone `guard_wr05`) | Single-source — folding into the aggregator wires it into the §14 PR-quality gate automatically; a forked gate violates "do NOT fork gate logic". |
| YAML frontmatter parsing | `js-yaml` / `gray-matter` | The existing stdlib slice+regex `parseFrontmatter` (`generate-catalog.ts`) | Adding a host-shipped dep is forbidden. Extend the existing parser minimally for the `refs` YAML list if needed. |
| Note-id uniqueness | A counter / DB sequence | `crypto.randomUUID()` slice as the nonce | Lock-free, zero-dep, collision-safe for same-millisecond writers. |

**Key insight:** Every "hard" concurrency problem in this phase has a `node:fs` stdlib primitive whose failure mode (`EEXIST` on `mkdir`, atomic replace on POSIX `rename`) IS the coordination signal. The custom solutions are not just unnecessary — a lock manager actively violates CLAIM-01, and a new dependency violates the zero-host-dep constraint. The discipline is to lean on the filesystem's own atomicity guarantees and clone the already-proven freshness/guard/test patterns rather than inventing parallel ones.

## Runtime State Inventory

> This is a greenfield substrate (new `.grugops/context/` + `.grugops/queue/` dirs that do not yet exist) — not a rename/refactor. There is no pre-existing stored data, live-service config, OS-registered state, secret, or build artifact carrying an old string to migrate.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `.grugops/` does not exist yet (verified: `ls .grugops` → absent). No prior note store to migrate. | None |
| Live service config | None — no external service holds this layout. | None |
| OS-registered state | None — no tasks/units/processes reference these paths. | None |
| Secrets/env vars | None. The freshness gate honors `CHECK_ROOT` (existing test override) — no new secret/env. | None |
| Build artifacts | New committed `.js` outputs of `context-io.ts`/`claim.ts`/`context-freshness.ts` will be produced by `tsc` and must be committed + covered by `freshness.ts` (the existing build-output gate auto-includes them: `OUTPUT_DIRS` includes `scripts/`). | Run `npm run build`, commit the new `.js`; confirm `freshness.ts` greens. |

**Note on `agent-factory/contracts/`:** CONTEXT.md describes this dir as "currently empty — its natural home," but it **does not yet exist** (verified: `ls -d agent-factory/contracts` → absent). The plan must **create** it, not assume it. `[VERIFIED: ls agent-factory/ — no contracts subdir]`

## Common Pitfalls

### Pitfall 1: Windows `rename` is not atomic and fails when the destination exists
**What goes wrong:** `fs.renameSync(tmp, final)` works on POSIX (atomic replace) but on Windows uses `MoveFileEx`, which is **not atomic, honors Windows sharing modes, and fails with `EPERM`/`EACCES` (or `EEXIST`) when the destination is locked or already present** — e.g. an antivirus/Search-indexer transient lock, or simply because `final` already exists.
**Why it happens:** `MoveFileEx` semantics differ from POSIX `rename(2)`; "newPath will be overwritten" holds on Linux/macOS but not reliably on Windows.
**How to avoid:** The locked `unlinkSync`-then-`renameSync` branch (catch `EPERM`/`EEXIST`/`EACCES` → `unlink` the destination → retry `rename`). **AND** the structural mitigation: make the publish target a **fresh unique path** so the destination never pre-exists for note writes — confining the Windows branch to the single-writer, freshness-gated derived-artifact regen.
**Warning signs:** Green on macOS/Linux CI, red only on `windows-latest`. This is precisely why the locked design adds the real `windows-latest` matrix leg.
**Sources:** `[CITED: github.com/nodejs/node/issues/29481 — "fs.rename ... uses MoveFileEx ... not an atomic operation ... might fail with EACCS or EPERM"]`, `[CITED: github.com/npm/write-file-atomic/issues/227 — EPERM transient locks]`, `[CITED: github.com/nodejs/node/issues/21957 — "overwritten ... happens on Linux/Mac OS X but doesn't appear to happen with Windows"]`

### Pitfall 2: `O_EXCL` exclusive-create is unreliable on NFS
**What goes wrong:** Using `openSync(path, 'wx')` (`O_CREAT|O_EXCL`) as the claim primitive can spuriously succeed for two claimants on NFS (old-NFS `O_EXCL` race).
**Why it happens:** `O_EXCL`+`O_CREAT` atomicity depends on the underlying filesystem; NFS historically does not guarantee it. `mkdir` is the documented NFS-safe alternative.
**How to avoid:** Use `mkdirSync` for the claim (locked). Do not "optimize" to `'wx'` open.
**Warning signs:** Two agents both believe they own the same task under a networked `.grugops/`.
**Sources:** `[CITED: SUMMARY.md Sources — Node v26.x fs flags table; 0pointer.de/blog/projects/locking; Red Hat solutions/43001]` `[ASSUMED: the exact current Node-docs sentence for the NFS caveat — WebFetch returned truncated docs this session; the claim is corroborated by the locked SUMMARY.md verification and the multiple cited locking references]`

### Pitfall 3: Non-deterministic render breaks the freshness byte-diff
**What goes wrong:** If `index.md`/`index.jsonl` render depends on `readdirSync` order, `Date.now()`, object-key iteration, or unstable sort, the regen won't be byte-identical → the freshness gate flaps red on a clean tree.
**Why it happens:** `readdirSync` order is not guaranteed; JSON object key order and float formatting can vary.
**How to avoid:** Sort notes by a **stable key = `at` (ISO-8601 lexicographic) with a deterministic tiebreak** (the note-id, which embeds the nonce). Emit JSONL fields in a fixed key order. Single trailing `\n` (the `lines.join("\n")` + final-empty-element idiom from `generate-catalog.ts`). No timestamps in the rendered output beyond the notes' own `at`.
**Warning signs:** `freshness:context` passes once, fails on the next CI run with no source change.
**Sources:** `[CITED: generate-catalog.ts:194-201 "Deterministic ordering (D-08, mandatory for the byte-diff)"]`

### Pitfall 4: `supersedes` resolution requires deterministic conflict order
**What goes wrong:** When note B `supersedes` note A, the consolidated `index.md` must show B's content and mark A superseded — but if two notes supersede the same target, or a chain exists, the resolution must be deterministic to stay byte-reproducible.
**Why it happens:** `supersedes` is a graph edge; naive last-writer-wins by file order is non-deterministic.
**How to avoid:** Resolve at render time using the stable `at`+note-id sort (NOT file position, NOT mtime). For a supersede chain, the latest `at` (tiebreak note-id) wins; superseded notes remain in `notes/` (retained) but are folded/marked in the render. This is a pure deterministic function of frontmatter — no LLM.
**Warning signs:** Two CI runs render different `index.md` from the same `notes/`.

### Pitfall 5: Blurring the `claim` note-KIND with the queue CLAIM
**What goes wrong:** Docs/schema/code that uses "claim" ambiguously lets a soft `claim`-kind note (unverified assertion) be mistaken for hard work-ownership — collapsing the Phase-21 VFY-04 invariant before it's even built.
**Why it happens:** DeLM conflates them into one TTL'd note; the words collide.
**How to avoid:** In the schema doc and code, name them distinctly: the note KIND is `claim` (a `kind:` value in `notes/`); the queue ownership is the **CLAIM directory** (`claimed/<task>/` + `claim.md`). Never let `claim.md` (queue) and a `kind: claim` note (context) share a code path or a doc sentence. `[CITED: CONTEXT.md <decisions> "CRITICAL naming distinction"]`

## Code Examples

### Note frontmatter → JSONL line projection (SCTX-01 → SCTX-03)
```typescript
// Source: frontmatter shape from CONTEXT.md <decisions>; parse idiom from generate-catalog.ts:49-59
// (stdlib slice+regex — NO js-yaml). The JSONL line is a fixed-key-order projection for byte-determinism.
interface NoteRecord {
  id: string;            // <at-compact>-<by>-<kind>-<nonce>  (storage/convenience; NOT replay order)
  kind: "claim" | "finding" | "decision" | "failed-attempt" | "observation" | "artifact-ref";
  by: string;            // authoring role/agent
  at: string;            // ISO-8601 — THE replay sort key (SCTX-04)
  verified_by: string;   // §14-gate#<id> | <human> | "" (Phase 21 admits findings; Phase 20 records the field)
  confidence: string;    // e.g. high|medium|low|UNKNOWN - verify
  refs: string[];        // YAML list — REQ ids, file paths, ticket refs (trace migration substrate, SCTX-04)
  supersedes: string | null; // note-id this note overrides (replay edge, NOT file position)
  body: string;          // markdown body (NOT in the JSONL line if the line is event-only — Discretion)
}

// Deterministic JSONL line: fixed key order, JSON.stringify (stable for these scalar/array shapes).
function toJsonl(n: NoteRecord): string {
  return JSON.stringify({
    id: n.id, kind: n.kind, by: n.by, at: n.at,
    verified_by: n.verified_by, confidence: n.confidence,
    refs: n.refs, supersedes: n.supersedes,
  }); // emit fields in THIS order every time → byte-reproducible
}
```

### Replay current-state reconstruction (SCTX-04)
```typescript
// Source: SCTX-04 "the trace replays from at + supersedes (not file position)".
// Deterministic: sort by `at` (ISO lexicographic) with note-id tiebreak; apply supersedes edges.
function currentState(notes: NoteRecord[]): NoteRecord[] {
  const ordered = [...notes].sort((a, b) =>
    a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id)); // stable, no mtime/position
  const superseded = new Set(ordered.map(n => n.supersedes).filter((x): x is string => !!x));
  return ordered.filter(n => !superseded.has(n.id)); // a note overridden by a later `supersedes` is folded out
}
```

### Explicit TTL stale-sweep (CLAIM-02, generous configurable wall-clock)
```typescript
// Source: CONTEXT.md <decisions> — generous configurable TTL, EXPLICIT coordinator-run sweep,
// NO pid/host liveness. (The TTL VALUE is read from config in a LATER phase; Phase 20 ships the rule.)
import { readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

function sweepStale(queueRoot: string, ttlMs: number, now = Date.now()): string[] {
  const claimedDir = join(queueRoot, "claimed");
  if (!existsSync(claimedDir)) return [];
  const reclaimed: string[] = [];
  for (const task of readdirSync(claimedDir)) {
    const claimMd = join(claimedDir, task, "claim.md");
    if (!existsSync(claimMd)) continue;
    const at = (readFileSync(claimMd, "utf8").match(/^at:\s*(.+)$/m) ?? [])[1];
    if (at && now - Date.parse(at.trim()) > ttlMs) {
      rmSync(join(claimedDir, task), { recursive: true, force: true }); // release; task returns to pending (rename, not shown)
      reclaimed.push(task);
    }
  }
  return reclaimed; // DOGF-02 asserts a stale claim is reclaimed
}
```

### `guard_context_writes` (clone of `guard_wr05` shape)
```typescript
// Source: clone scripts/check-foundation-guards.ts guardWr05() (lines 99-132) — grepFiles() helper,
// explicit SCAN set (NEVER repo-wide), pass()/fail() into the shared FAILS counter, clear voice.
// Detects raw context-write patterns in SHIPPED role/workflow text that bypass context-io.ts.
const CTX_WRITE_RE =
  /\.grugops[\\/]context[\\/].*(writeFileSync|appendFileSync|\bWrite\b|>>?\s|echo\s)/; // tune to fixtures
const CTX_SCAN = [ /* the shipped role + workflow .md files that may legitimately mention context */ ];

function guardContextWrites(): void {
  process.stdout.write("\n[guard_context_writes] shared context written only via context-io.ts (SCTX-05)\n");
  const hits = grepFiles(CTX_SCAN, CTX_WRITE_RE).join("\n");
  if (hits === "") pass("SCTX-05: no raw context write in shipped role/workflow text");
  else fail(`SCTX-05 raw context write (bypasses context-io.ts):\n${hits}`);
}
// Register in the run-all block alongside guardWr05() etc.; FAILS folds into the existing exit tail.
// NOTE: the regex MUST be calibrated against (a) a PLANTED raw-write fixture that MUST fire, and
// (b) the real shipped text that legitimately NAMES context-io.ts/the path in prose and must NOT fire.
// (Mirror guard_wr05's care: it matches the frontmatter TOKEN, never the prose word.)
```

## State of the Art

| Old Approach (v1.2) | Current Approach (v2.0 Phase 20) | When Changed | Impact |
|--------------------|----------------------------------|--------------|--------|
| Static handoff packets as inter-role memory | Shared verified context substrate (per-note files + derived index) | This milestone | Phase 20 builds the substrate; handoffs deleted in Phase 24 (NOT here). |
| Build-output-only freshness (`freshness.ts`) + catalog freshness (`catalog-freshness.ts`) | + a third freshness gate over a *derived per-task index* (`freshness:context`) | Phase 20 | Same fail-closed mirror-spawn pattern, retargeted to `notes/`→`index.{md,jsonl}`. |
| Six foundation guards in `check-foundation-guards.ts` | + a seventh: `guard_context_writes` | Phase 20 | Single-source extension; auto-wires into the §14 gate. |

**Deprecated/outdated:**
- DeLM's "memory authoritative, `.jsonl` throwaway" model: grugops **inverts** it (markdown SoT, JSONL derived/gated). Do not port DeLM's authority direction.
- DeLM's `asyncio.Lock` + `DEFAULT_CLAIM_TTL_SECONDS = 300`: the Lock does not port (separate processes); the 300 s TTL is replaced by a generous configurable wall-clock default.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The current Node-docs verbatim sentence for the `O_EXCL`/NFS unreliability caveat | Pitfall 2 | LOW — the *fact* (mkdir NFS-safe, O_EXCL not) is independently verified in locked SUMMARY.md + multiple cited locking references; only the exact doc quote is unconfirmed this session (WebFetch returned truncated Node docs). Use `mkdirSync` regardless (locked). |
| A2 | The existing stdlib `parseFrontmatter` handles (or is trivially extended for) the `refs` YAML *list* | Standard Stack / Open Questions | MEDIUM — the current parser (`generate-catalog.ts:49-59`) is flat key:value and does not parse multi-line YAML lists. The plan likely needs a minimal list-aware extension (still stdlib, no new dep). Confirm at plan time. |
| A3 | The `guard_context_writes` regex can distinguish a planted raw-write from legitimate prose that names the path | Code Examples / Guard Clone | MEDIUM — exactly the calibration `guard_wr05` had to do (token vs prose word). The planted-fixture test is the forcing function; the regex is tuned to the fixture, not guessed. |
| A4 | Per-task JSONL granularity (one `index.jsonl` per `<task>/`) is the right shape vs a rolled global index | Schema / Discretion | LOW — SCTX-03 says "per-task" explicitly and the per-task folder layout is locked; per-task confirmed. |

## Open Questions

1. **`refs` YAML-list parsing without a new dependency**
   - What we know: the provenance fence carries `refs` as a YAML list; the existing `parseFrontmatter` is flat key:value (no list support).
   - What's unclear: whether to extend the existing parser minimally, or define `refs` as a single-line comma form to stay within the flat parser.
   - Recommendation: extend the stdlib parser to read a `refs:\n  - x\n  - y` block (small, zero-dep) — keeps the frontmatter idiomatic and matches the locked "YAML list" decision. Decide at plan time; either way no new package.

2. **Exact derived-artifact filenames + whether `index.jsonl` carries the note body**
   - What we know: per-task folder is locked; filenames are Claude's Discretion; SCTX-03 says per-task JSONL.
   - What's unclear: `index.md` vs `<task>.md`; whether the JSONL line is event-only (no body) or includes the body.
   - Recommendation: `index.md` + `index.jsonl` (folder-relative, no task-name duplication); JSONL line = provenance fields only (event index), body stays in `notes/` (the SoT). Keeps the JSONL compact and the freshness diff stable. Planner-final.

3. **CI matrix: which exact GitHub Actions config adds the `windows-latest` leg**
   - What we know: the locked design adds a real `windows-latest` vitest leg; the repo currently runs vitest (presumably on `ubuntu-latest`).
   - What's unclear: the exact workflow file + matrix syntax (not read this session — out of the proof-mechanics core, but needed for SC-2 proof).
   - Recommendation: the plan should locate `.github/workflows/*.yml`, add `os: [ubuntu-latest, windows-latest]` to the test job matrix, and confirm the spawn-the-compiled-`.js` tests run on Windows (path-separator normalization already handled via `node:path`). `[ASSUMED: a GitHub Actions workflow exists — not verified this session]`

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All tooling (committed `.js` runtime + `tsc` build) | ✓ | v24.12.0 (>= 22 floor) | — |
| `typescript` (devDep) | `tsc` build of new helpers | ✓ | ~6.0.3 | — |
| `vitest` (devDep) | behavioral oracles | ✓ | ~4.1.8 | — |
| `windows-latest` CI runner | SC-2 real proof of the unlink-then-rename branch | ⚠ (GitHub Actions — runnable for free, but matrix leg not yet added) | — | Deterministic unit test proves the LOGIC; the real Windows leg proves RUNTIME. Without it, the Windows claim is `UNKNOWN - verify`. |
| True NFS mount | SC-2/SC-3 true-NFS runtime | ✗ | — | **Honest `UNKNOWN - verify`** (locked). DOGF-02 (Phase 26) / PAR-05 (v2.x advisory leases) are the eventual real gates. Do NOT fake a green. |

**Missing dependencies with no fallback:** none (true-NFS is intentionally `UNKNOWN - verify`, not a blocker).
**Missing dependencies with fallback:** the `windows-latest` matrix leg (add it — runs free on GitHub Actions); true-NFS (deferred to DOGF-02/PAR-05 per locked design).

## Validation Architecture

> Nyquist is ENABLED (`config.json workflow.nyquist_validation: true` — verified). This section is mandatory and is consumed to create VALIDATION.md.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest `~4.1.8` (globals:false → explicit imports; spawn-the-compiled-`.js` child-process oracle idiom) |
| Config file | (vitest config not separately read; `npm test` → `vitest run`) `[VERIFIED: package.json scripts.test = "vitest run"]` |
| Quick run command | `npx vitest run scripts/context-io.test.ts scripts/claim.test.ts scripts/context-freshness.test.ts` |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` (excludes the live claude-CLI e2e lane that spends tokens/hangs — per MEMORY: grugops-npm-test-triggers-live-e2e) |

> **Test idiom (mandatory, from every existing `*.test.ts`):** spawn the **COMPILED `.js`** as a child process (never the `.ts`), assert exit-code-as-signal + finding text, plant-and-restore any mutated committed file under `afterEach`/`afterAll`, use a hermetic temp mirror (`mkdtempSync`+`cpSync`) + the `CHECK_ROOT`/fixture-root override for guard/freshness fail cases. Prove BOTH a PASS path and a planted FAIL (no-fabrication contract — a gate that can only pass is fabricated green).

### Phase Requirements → Test Map (ROADMAP Success Criteria)
| SC | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| **SC-1** | A six-kind note with a complete provenance fence validates; a note missing a required provenance field is a validator structural **FAIL** | deterministic validator unit (GOOD fixture exit 0 + one-mutation BAD fixture nonzero naming the missing field — clone `validate.test.ts` BAD-fixture shape) | `npx vitest run scripts/context-io.test.ts` (or the validator test that owns the schema check) | ❌ Wave 0 |
| **SC-2** | Two concurrent writes via `appendNote`/`atomicWrite` produce two distinct un-clobbered notes (no lost-update, no torn append), incl. the Windows unlink-then-rename path | (a) deterministic concurrent-write unit (fork/Promise.all N writers → assert N distinct files, each well-formed); (b) **real `windows-latest` CI leg** runs the unlink-then-rename branch | `npx vitest run scripts/context-io.test.ts` on `os: [ubuntu-latest, windows-latest]` | ❌ Wave 0 |
| **SC-3** | `pending→claimed→done` by atomic rename; `mkdirSync` claim is exclusive — a 2nd claimant on the same task **fails** (`EEXIST`) — no central lock manager | deterministic claim unit (claim once → true; claim same task again → false/EEXIST; rename transitions assert file moves; sweep reclaims a TTL-expired claim per DOGF-02 seed) | `npx vitest run scripts/claim.test.ts` | ❌ Wave 0 |
| **SC-4** | Committed per-task JSONL regenerates **byte-identically** from markdown; editing markdown without regenerating trips `freshness:context` (fail-closed); markdown wins | freshness-drift unit (clone `catalog-freshness.test.ts`): fresh tree → exit 0 "fresh"; plant a byte of drift into committed `index.jsonl` → nonzero + "STALE"; break the regen → fail-closed nonzero | `npx vitest run scripts/context-freshness.test.ts` + `npm run freshness:context` | ❌ Wave 0 |
| **SC-5** | `guard_context_writes` fails **RED** on a planted raw-write that bypasses `context-io.ts`; passes on the real (sanctioned-only) tree | planted-fixture guard test (clone `check-foundation-guards.test.ts` hermetic-mirror plant): mirror inputs, append a raw `.grugops/context/...writeFileSync` line to a scanned file, run compiled guard with `CHECK_ROOT` → nonzero + finding names SCTX-05; smoke-run real tree → green | `npx vitest run scripts/check-foundation-guards.test.ts` | ❌ Wave 0 (extend existing test) |

### Sampling Rate
- **Per task commit:** the quick run for the artifact touched (`vitest run scripts/<artifact>.test.ts`) + `npm run build` (so the committed `.js` stays fresh) + `npm run freshness` (build-output gate auto-covers the new `.js`).
- **Per wave merge:** full suite `npx vitest run --exclude '**/scripts/e2e/**'` + `npm run freshness` + `npm run freshness:catalog` + `npm run freshness:context` (new) + `node scripts/check-foundation-guards.js`.
- **Phase gate:** full suite green + all three freshness gates green + the seven-guard aggregator green, before `/gsd-verify-work`. True-NFS explicitly carried as `UNKNOWN - verify` (not a failing gate).

### Wave 0 Gaps
- [ ] `scripts/context-io.test.ts` — covers SC-1 (schema validate FAIL) + SC-2 (concurrent un-clobbered writes + Windows branch)
- [ ] `scripts/claim.test.ts` — covers SC-3 (rename transitions + `mkdirSync` exclusivity + TTL sweep reclaim)
- [ ] `scripts/context-freshness.test.ts` — covers SC-4 (fresh PASS / planted-drift STALE / fail-closed) — clone `catalog-freshness.test.ts`
- [ ] `scripts/check-foundation-guards.test.ts` — EXTEND with the SC-5 planted-raw-write `guard_context_writes` case
- [ ] `.github/workflows/*.yml` — add `windows-latest` to the test-job matrix (SC-2 real Windows-branch proof) — locate the existing workflow first
- [ ] `package.json` — add `"freshness:context"` script (mirror `freshness:catalog` shape: `tsc --outDir .tmp-build && node scripts/context-freshness.js`)
- [ ] No framework install needed (vitest present)

## Security Domain

> `security_enforcement` is enabled (`config.json security_enforcement: true`, `security_asvs_level: 1`, `security_block_on: high` — verified). This phase is filesystem-tooling on a developer/CI machine (no network, no auth, no user-facing input surface), so most ASVS categories are N/A; the live concerns are input/path validation and no-fabrication integrity.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface (local filesystem tooling). |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | No multi-user authorization; git history is the attribution (SCTX-04). |
| V5 Input Validation | **yes** | The note frontmatter is parsed (stdlib regex). Validate kind ∈ six-kinds, required provenance fields present (SC-1 validator FAIL). Escape pipe/newline in any free-text rendered into the `index.md` markdown table (reuse `generate-catalog.ts` `cell()` escaping — WR-03). |
| V6 Cryptography | partial | `crypto.randomUUID()` is used only for a collision-avoidance nonce, NOT for security/secrecy — document it as non-security so no one mistakes it for a token. Do not hand-roll crypto. |
| V12 File/Resource (path traversal) | **yes** | Mirror the existing tooling's path-traversal mitigation: write/read paths are FIXED literals or `join(root, <validated-task>)`, **never derived from untrusted file content/argv/env**. The task name (used in `join(queueRoot, "claimed", task)` and `.grugops/context/<task>/`) MUST be validated/sanitized (reject `..`, path separators, absolute paths) so a malicious subtask name cannot escape the queue/context root. `[CITED: generate-catalog.ts:26-30 "read/write-only by construction ... FIXED literal paths ... never argv/env/content-derived"; validate-agent-factory.ts:46 same discipline]` |

### Known Threat Patterns for {Node `fs` filesystem tooling}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via task name (`../../etc`, absolute path) reaching `mkdirSync(join(root, "claimed", task))` or the context-write path | Tampering / Elevation | Validate task-name against a strict allowlist charset (e.g. `^[A-Za-z0-9._-]+$`, reject `..`); join under a fixed root; never accept a content-/argv-derived absolute path. |
| Markdown-injection into the rendered `index.md` table (a `|` or newline in note free-text breaking the table / injecting a row) | Tampering | Reuse the `cell()` escape (`\`→`\\`, `|`→`\|`, newline→space) from `generate-catalog.ts` for every free-text cell. |
| Fabricated freshness/guard "green" (a gate that can only pass) | Repudiation / Tampering | No-fabrication contract: every gate has a planted-FAIL test (SC-4/SC-5); fail-closed on broken regen; never report "fresh" on a failed rebuild. `[CITED: freshness.ts:20-22 fail-closed; CLAUDE.md Constraint #6]` |
| Symlink/TOCTOU on the temp-then-rename publish | Tampering | Temp sibling in the SAME dir (same volume), unique name (`pid+Date.now()`); `rename` is the atomic publish; no follow of attacker-controlled symlinks (paths are under the fixed root). |

> **Voice:** all schema/validator/guard/freshness surfaces use **clear professional voice** (CLAUDE.md hard rule — safety + trace surfaces), exactly as `freshness.ts`/`check-foundation-guards.ts` already do. No caveman voice in this phase's tooling or contract docs.

## ⚠ Design Concerns

> Per the objective: flag (don't silently plan around) any locked decision that looks risky. After analysis, **no locked decision appears wrong.** Two minor flags for the planner's awareness, neither contradicting a locked choice:

1. **`agent-factory/contracts/` does not exist yet** (CONTEXT.md calls it "currently empty" but `ls` shows it absent). Not a design problem — the plan must simply **create** the dir rather than assume it. Surfaced so a task doesn't fail on a missing dir.
2. **`refs` YAML-list parsing** needs a small extension to the existing flat-key:value frontmatter parser (or a single-line comma form). Within the zero-dep constraint either way; just don't assume the current parser handles lists out of the box. (Open Question 1.)

## Sources

### Primary (HIGH confidence)
- `scripts/freshness.ts` — the build-output drift gate (rebuild-to-temp → byte-diff → fail-closed); the model for `freshness:context`. Read in full this session.
- `scripts/catalog-freshness.ts` — the mirror-spawn (`mkdtempSync`+`cpSync`+`spawnSync`) derived-artifact freshness gate; the precise clone target for SCTX-03. Read in full.
- `scripts/generate-catalog.ts` — the generator template (fixed-literal paths, stdlib `parseFrontmatter`, deterministic sort, `cell()` escaping, fail-closed). Read in full.
- `scripts/check-foundation-guards.ts` — the guard aggregator (`guard_wr05` grep shape, `grepFiles()`, shared `FAILS` counter, `CHECK_ROOT` override). Read in full; `guard_context_writes` clones `guardWr05()`.
- `scripts/catalog-freshness.test.ts` / `scripts/check-foundation-guards.test.ts` / `scripts/validate.test.ts` — the spawn-compiled-`.js` + hermetic-mirror-plant + plant-and-restore vitest idioms. Read this session.
- `.planning/research/SUMMARY.md` — the locked v2.0 design + the Node v26.x `fs` atomicity / Windows-rename / NFS-`O_EXCL` verification (June 2026) + DeLM mechanics. HIGH confidence.
- `package.json` — devDeps `{typescript ~6.0.3, vitest ~4.1.8, @types/node ~22}`, scripts (`freshness`, `generate:catalog`, `freshness:catalog`). Verified directly.
- `node --version` → v24.12.0 (>= Node 22 floor). Verified this session.

### Secondary (MEDIUM confidence)
- `github.com/nodejs/node/issues/29481` — `fs.rename` uses `MoveFileEx` on Windows, not atomic, EACCES/EPERM on locked target. `[CITED]`
- `github.com/nodejs/node/issues/21957` — "newPath will be overwritten" holds on Linux/macOS, not reliably on Windows. `[CITED]`
- `github.com/npm/write-file-atomic/issues/227` + `github.com/npm/cli/issues/9021` — EPERM transient locks on Windows rename; the write-file-atomic retry pattern. `[CITED]`

### Tertiary (LOW confidence / corroboration only)
- Exact current Node-docs verbatim sentence for the `O_EXCL`/NFS caveat — WebFetch returned truncated docs this session; the *fact* is HIGH-confidence via SUMMARY.md + cited locking references, only the quote is unconfirmed. `[ASSUMED — see Assumptions Log A1]`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; all primitives are `node:fs` stdlib verified on the local Node 24.12.0 and matching the locked SUMMARY.md verification.
- Architecture / clone targets: HIGH — `freshness.ts`/`catalog-freshness.ts`/`check-foundation-guards.ts`/`generate-catalog.ts` and their tests read in full; the new artifacts are structural clones.
- Cross-platform proof mechanics: HIGH for the design (per-note-fresh-target collapses the Windows hazard; `mkdirSync` is NFS-safe); MEDIUM only on the exact CI-matrix wiring (workflow file not read) and the exact Node-docs NFS quote (truncated fetch).
- Pitfalls: HIGH — concurrency pitfalls cross-verified against primary Node issues + the locked SUMMARY.md.
- Validation architecture: HIGH — every SC maps to an existing test idiom already in the tree.

**Research date:** 2026-06-17
**Valid until:** ~2026-07-17 (stable — `node:fs` semantics and the committed-`.js` tooling pattern are slow-moving; re-check only if the Node floor or vitest major changes).
