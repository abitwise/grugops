# Phase 22: Memory & Trajectory Compaction (Dialable, Token-Economy) - Research

**Researched:** 2026-06-18
**Domain:** Two-tier agent memory / deterministic structure-preserving compaction over the grugops shared verified context (markdown + `node:fs` tooling)
**Confidence:** HIGH (design LOCKED in CONTEXT.md; reuse surface verified against committed source this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Division of labor — the body/frontmatter seam (CMP-01, CMP-02)**
- **D-01** — The agent compresses note *bodies*; `compactor.ts` protects *structure*. The agent (following WF18) reads its verbose local trajectory and writes the terse gist. `compactor.ts` NEVER summarizes (`node:fs`-only, zero host runtime deps — it CANNOT call an LLM). Phase-21 pattern reused: the tool is the un-cheatable mechanical floor, the role is the intelligence.
- **D-02** — `compactor.ts` is a carve-out *invariant checker* over `(raw thread → proposed promoted notes)`. Its deterministic job before promotion: (1) every `failed-attempt` note id in the raw thread **survives** into the promoted set; (2) load-bearing provenance `verified_by` / `supersedes` / `by` / `at` are **intact** on every promoted note; (3) promotion happens **only** via `context-io.ts`'s `appendNote` — `compactor.ts` does NOT fork a writer. On any dropped load-bearing element → **refuse, exit 1, name the fault**. A RED test proves a drop of *each* carve-out element fails.
- **D-03** — `compactor.ts` does NO semantic structural folding (USER-DECIDED: dumb-guard-only over heuristic dedup). The only fold it may reuse is `context-io.ts`'s deterministic `currentState()` `supersedes` collapse. "Drop a duplicate observation" is a judgment → the agent's job, not the tool's.

**The dial — tunes body verbosity, never the carve-out (CMP-03)**
- **D-04** — `context.compaction: aggressive | balanced | retain-raw`. The dial changes only how compressed bodies are and how much raw reaches the shared tier — never *which* durable notes promote. `aggressive` (lean default when absent): only the compact gist in shared context; raw stays in local `threads/`, unfolded on demand. `balanced`: gist + a fuller mid-tier summary. `retain-raw`: full trajectory bodies admitted to shared context (enterprise/audit).
- **D-05** — The promoted *note set* is dial-invariant; the carve-out is un-dialable. Durable kinds (`finding` / `decision` / `failed-attempt` / `artifact-ref`) and load-bearing fields (D-02) survive identically at all three levels. The dial NEVER turns the carve-out off.
- **D-06** — Documented across all three config surfaces: `agent-factory/config/factory.config.json`, `agent-factory/config/factory.config.md` (field reference + lean→enterprise dial table), seed `agent-factory/seed/.grugops/factory.config.json`. Lean zero-config still runs (`aggressive` default when key absent).

**The local trajectory tier — `threads/` (CMP-01)**
- **D-07** — `threads/` is gitignored ephemeral local scratch, NOT committed (USER-DECIDED). Only the compact verified context is committed. `retain-raw` (D-04) = "promote the raw INTO the committed shared context" — the dial, not git, decides durability. Unfold-on-demand operates within the live session, not post-hoc from git history.
- **D-08** — Thread keying is per-task-per-agent: `.grugops/context/<task>/threads/<agent>.md` (USER-DECIDED, refinement of CMP-01's literal flat path). Rationale: under Phase-23 fan-out one agent type runs concurrently on different tasks; a flat per-agent file would collide.
- **D-09** — Lifecycle: a thread is created on an agent's first write for a task, appended to as it works, compacted at handback (D-11), and — gitignored ephemeral — never part of the permanent audit trail. The permanent trail is the committed shared context.

**Workflow 18 — trigger + the re-verify (CMP-03)**
- **D-10** — `18-context-compaction.md` is the single-source protocol (clear voice). Every role references it via a one-line pointer (same additive pattern as the Phase-21 WF16 pointer); nobody restates it. WF18 **references** WF16's admission rules for the re-verify rather than restating them.
- **D-11** — Trigger: the write-after-verify / task-handback boundary (primary), plus opportunistic mid-task on context-window pressure (secondary). One distillation pass when the agent finishes its unit and is about to promote — NOT per-write.
- **D-12** — Re-verify reuses Phase-21's `admit()`; adds no new verification machinery. Only a promoted `finding` re-hits admission: its `§14-gate#<id>` stamp must still cross-check a live green verdict. A faithful body compaction re-admits cheaply; a compaction that materially changed the finding such that its stamp no longer holds is **refused → honestly degrade to a `claim` with `confidence: UNKNOWN - verify`**. Soft kinds need no stamp and pass through.

**Build model (carried forward — D-13 of v1.2, LOCKED)**
- **D-13** — `compactor.ts` follows the committed-`.js` contract: TS authored → `tsc` to committed `.js` → freshness-checked → vitest-covered (`compactor.test.ts`, RED-fixture-first for the CMP-02 carve-out). `node:fs` / `node:path` / `node:crypto` only; zero host runtime deps. Reuse `context-io.ts` primitives (`readContext`, `currentState`, `appendNote`, `admit`) — do NOT re-implement note I/O or admission.

### Claude's Discretion
- The exact body-compression *tiers* the dial expresses (how "gist" vs "mid-tier summary" are shaped in WF18 prose) — the three behaviors are locked; prose shape is planner-final.
- Whether the carve-out checker (D-02) is one `compactor.ts` function or a small set — separation of concerns is locked; the surface is open.
- Exact `.gitignore` entry wording/location for `threads/` (D-07) and whether the seed/installer creates the `threads/` parent dir.
- Internal section ordering of `18-context-compaction.md`.
- The mid-task pressure-trigger threshold/heuristic (D-11 secondary) — advisory, planner-final.

### Deferred Ideas (OUT OF SCOPE)
- **Re-compaction of the already-admitted shared context itself** (DeLM Stage-1→Stage-2 hierarchical re-summary of the blackboard) → **CMP-04, v2.x**. Phase 22 is **trajectory → shared only** (USER-CONFIRMED).
- Committed/retained `threads/` with post-hoc git-history unfold → rejected for Phase 22 (D-07 chose ephemeral). Re-openable only if `retain-raw` proves insufficient in the Phase-26 dogfood.
- A `guard_context_protocol_single_source` foundation guard → **Phase 24** (flag only now).
- Heuristic/semantic dedup inside `compactor.ts` → rejected (D-03, dumb-guard-only). Stays the agent's job.
- `queue.wip_limit`, parallel fan-out, nested spawning, the inverted WR-05 guard, Orchestrator-as-decomposer → **Phase 23**.
- Deep rewiring of all 18 roles + 16 workflows + deletion of the 17 static handoff templates → **Phase 24**.
- Mechanical un-forgeable `human:<name>` signal → **Phase 25**.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMP-01 | `compactor.ts` — two-tier compaction: verbose local trajectory stays in `threads/<agent>.md`; only compact verified distillations promote to the shared context. | Reuse surface for `readContext`/`appendNote` documented (§Standard Stack, §Code Examples); per-task-per-agent thread path D-08 confirmed non-colliding with the Phase-20 substrate (§Architecture). Validation Architecture CMP-01 row gives the two-tier + single-writer-path assertion. |
| CMP-02 | Load-bearing-field carve-out — `verified_by`, `failed-attempt`, `supersedes`, `by`/`at` are compaction-exempt; a RED test fails if any is dropped. | The carve-out set is read directly off `context-note.md`'s provenance fence + the six kinds (§Architecture). RED-fixture-first plan with exact failure assertions in §Validation Architecture (the highest-value target). |
| CMP-03 | `context.compaction: aggressive\|balanced\|retain-raw` dial (lean default `aggressive`); compacted output re-verified before write; WF18 is the single-source protocol. | Dial-reading pattern (D-06) verified against how `quality.*`/`security.*` keys are read at point-of-use (§Don't Hand-Roll, §Code Examples). Re-verify reuses `admit()` (§Code Examples). WF18 single-source + role-pointer pattern verified against WF16 (§Architecture). |
</phase_requirements>

## Summary

Phase 22 adds **two-tier memory** to the grugops shared verified context substrate built in Phases 20–21. The verbose local trajectory of each agent stays in an ephemeral, gitignored `threads/` tier; only a compact, re-verified distillation promotes to the committed shared context. The phase ships exactly three new artifacts plus three config edits: a new `scripts/compactor.ts` helper (with its committed `.js`, freshness coverage, and `compactor.test.ts`), a new `agent-factory/workflows/18-context-compaction.md` single-source protocol, the `context.compaction` dial across three config surfaces, a `.gitignore` entry for `threads/`, and a one-line WF18 pointer added to role files.

The spine of the design (locked) is the **body/frontmatter seam**: the agent compresses note *bodies* (semantic judgment — its intelligence); `compactor.ts` protects note *structure* (a deterministic, un-cheatable carve-out invariant checker). Because the tool is `node:fs`-only with zero host runtime deps, it **cannot** summarize — confirmed: nothing in the `context-io.ts` reuse surface tempts a semantic fold. `compactor.ts` is a thin helper ON TOP of `readContext` / `currentState` / `appendNote` / `admit`; it never re-implements note I/O or admission. The re-verify (D-12) is cheap because the §14-gate verdict verified the *work*, not the prose: a faithful body compaction re-admits via the existing `admit()` stamp cross-check; a compaction that broke the stamp is refused and honestly degrades to a `claim` with `confidence: UNKNOWN - verify`.

**Primary recommendation:** Build `compactor.ts` as a dumb structural invariant checker that imports `context-io.ts`, mirroring `context-io.test.ts`'s spawn-the-`.js` + import-the-`.js` RED-fixture-first idiom for `compactor.test.ts`. Lead the plan with the CMP-02 carve-out test (the highest-value, most-mechanizable success criterion). Treat the **catalog exact-count test** (`generate-catalog.test.ts` hardcodes `toBe(17)` workflows) as a known landmine that MUST be bumped to 18 in the same change as the new WF18 file — the freshness gate auto-discovers, but this one test does not.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Compress note *bodies* (gist vs mid-tier vs raw) | Agent (role, following WF18) | — | Semantic judgment; an LLM-free `node:fs` tool cannot summarize (D-01/D-03). |
| Protect note *structure* (carve-out invariant) | Tooling (`compactor.ts`) | — | Deterministic, un-cheatable mechanical floor (D-02), like `context-io.ts`'s validator / `hooks/guard.ts`. |
| Persist verbose trajectory | Local `threads/` tier (filesystem) | — | Ephemeral gitignored scratch (D-07); per-task-per-agent keyed (D-08). |
| Promote distillation to shared context | `context-io.ts` `appendNote` (sole writer) | — | Single sanctioned write path preserved; `guard_context_writes` still applies; no forked writer (D-02.3). |
| Re-verify promoted `finding` | `context-io.ts` `admit()` (Phase 21) | — | No new verification machinery; stamp cross-check against a live green verdict (D-12). |
| Read the `context.compaction` dial | Role/WF at point-of-use | Config file (source of values) | Same read-at-use pattern as `quality.*`/`security.*` (D-06); no new dial-reading machinery. |
| Compile + drift-gate the helper | `tsc` → committed `.js` → `freshness.ts` | `compactor.test.ts` (vitest) | D-13 build contract; freshness auto-discovers `scripts/*.js`. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs` (`writeFileSync`, `readFileSync`, `readdirSync`, `renameSync`, `unlinkSync`, `mkdirSync`, `existsSync`) | Node 22+ stdlib | All file I/O for `compactor.ts` (thread reads; promotion routes through `context-io.ts`) | `[VERIFIED: codebase]` `context-io.ts` uses exactly this set; zero-host-dep constraint forbids anything else. |
| `node:path` (`join`) | Node 22+ stdlib | Compose `.grugops/context/<task>/threads/<agent>.md` paths | `[VERIFIED: codebase]` same import as `context-io.ts`. |
| `node:crypto` (`randomUUID`) | Node 22+ stdlib | Only if a collision nonce is needed; promotion's note id already comes from `context-io.ts` | `[VERIFIED: codebase]` `context-io.ts` `noteId()` already owns this. `compactor.ts` likely needs no nonce of its own. |
| `scripts/context-io.ts` (compiled `.js`) | committed | The reuse surface: `readContext`, `currentState`, `appendNote`, `admit`, `NoteRecord`/`NoteInput`/`NOTE_KINDS` | `[VERIFIED: codebase]` D-13/D-02/D-12 mandate building ON these, never forking. |
| `vitest` | `~4.1.8` (dev-only) | `compactor.test.ts` RED-fixture-first oracle | `[VERIFIED: package.json]` already the project test runner; never shipped to hosts. |
| `typescript` (`tsc`) | dev-only | Author `.ts` → committed `.js` (D-13) | `[VERIFIED: package.json]` `"build": "tsc"`. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:child_process` (`spawnSync`) | Node 22+ stdlib | In `compactor.test.ts` only, to drive the committed `compactor.js` CLI for CLI-shaped paths | `[VERIFIED: codebase]` mirrors `context-io.test.ts` line 23 `spawnSync` idiom. |
| `node:os` (`tmpdir`), `node:fs` (`mkdtempSync`, `rmSync`) | Node 22+ stdlib | Temp-dir fixtures in tests; nothing written into the committed tree | `[VERIFIED: codebase]` `context-io.test.ts` `freshTmp()` pattern. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dumb structural checker (D-03) | Heuristic/semantic dedup inside `compactor.ts` | **REJECTED by D-03.** A `node:fs` tool cannot judge "duplicate observation"; that is the agent's job. Keeping the tool dumb keeps the mechanical/semantic line crisp and un-cheatable. |
| Reuse `appendNote` as sole promotion path | A forked writer in `compactor.ts` | **REJECTED by D-02.3.** A second writer would bypass admission + `guard_context_writes`. The single sanctioned write path is load-bearing. |
| Reuse `admit()` for re-verify | New verification machinery in `compactor.ts` | **REJECTED by D-12.** The §14-gate verdict already verified the work; re-verify is a stamp cross-check, not a re-run. |

**Installation:** No new runtime or dev dependencies. The stack is entirely Node stdlib + the existing `context-io.ts` + the existing `{typescript, vitest}` dev deps.

**Version verification:** `[VERIFIED: package.json]` `vitest ~4.1.8` (devDependency), `"build": "tsc"`, freshness/test scripts present (`freshness`, `test`, `generate:catalog`, `freshness:catalog`, `freshness:context`). Node 22+ is the documented host floor (CLAUDE.md). No external package is installed by this phase.

## Package Legitimacy Audit

> Not applicable. Phase 22 installs **zero external packages** (hard zero-host-runtime-dep constraint, D-13/CLAUDE.md). All code is Node stdlib (`node:fs`/`node:path`/`node:crypto`) plus the in-repo `context-io.ts`. Dev/test deps (`typescript`, `vitest`, type-only `@types/node`) are already present and unchanged. The Package Legitimacy Gate (`gsd-tools query package-legitimacy check`) was therefore not run — there is no package to verify.

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
                  ┌──────────────────────────────────────────────────────────┐
   agent works →  │  LOCAL TRAJECTORY TIER  (ephemeral, gitignored — D-07)     │
                  │  .grugops/context/<task>/threads/<agent>.md  (D-08)        │
                  │  verbose narrative; raw observations; every dead-end       │
                  └───────────────┬──────────────────────────────────────────┘
                                  │  trigger: write-after-verify / handback (D-11 primary)
                                  │           or mid-task window pressure  (D-11 secondary)
                                  ▼
                  ┌──────────────────────────────────────────────────────────┐
   AGENT (WF18):  │  COMPRESS BODIES  (semantic — the role's intelligence)     │
                  │  collapse narrative prose → terse gist per the dial value  │
                  └───────────────┬──────────────────────────────────────────┘
                                  │  proposed promoted note set + raw thread
                                  ▼
  compactor.ts:   ┌──────────────────────────────────────────────────────────┐
  CARVE-OUT       │  STRUCTURAL INVARIANT CHECK  (mechanical — un-cheatable)   │
  INVARIANT       │  D-02.1 every raw `failed-attempt` id survives             │
  CHECKER (D-02)  │  D-02.2 verified_by / supersedes / by / at intact          │
                  │  D-02.3 promotion ONLY via context-io.appendNote           │
                  └──────┬───────────────────────────────────────┬───────────┘
                  drop a │ carve-out element                      │ all intact
                         ▼                                        ▼
                  ┌──────────────┐         re-verify (D-12)  ┌───────────────────────────┐
                  │ REFUSE       │ ◄── finding stamp broke ──│ context-io.admit()        │
                  │ exit 1 +     │                           │ (Phase 21 stamp cross-     │
                  │ name fault   │  finding stamp holds OR   │  check vs live green       │
                  └──────────────┘  soft kind ──────────────►│  §14-gate verdict)        │
                         │ (finding materially changed)      └────────────┬──────────────┘
                         ▼                                                 │ admitted
                  degrade to `claim`                                       ▼
                  confidence: UNKNOWN - verify          ┌──────────────────────────────────┐
                  (honest, non-load-bearing)            │ SHARED VERIFIED CONTEXT (committed)│
                                                        │ .grugops/context/<task>/notes/*.md │
                                                        │ index.md + index.jsonl (derived)   │
                                                        └────────────────────────────────────┘
```

**Component Responsibilities**

| Component | File | Responsibility |
|-----------|------|----------------|
| Local trajectory tier | `.grugops/context/<task>/threads/<agent>.md` | Ephemeral verbose scratch; gitignored; per-task-per-agent (D-07/D-08). |
| Body compressor | `agent-factory/workflows/18-context-compaction.md` (agent follows) | Semantic prose collapse per dial; the role's judgment (D-01). |
| Carve-out invariant checker | `scripts/compactor.ts` (+ committed `.js`) | Deterministic structural check before promotion; refuse/exit-1/name-fault (D-02). |
| Promotion writer | `scripts/context-io.ts` `appendNote` | Sole sanctioned write into shared context (D-02.3). |
| Re-verifier | `scripts/context-io.ts` `admit` | Phase-21 stamp cross-check for promoted findings (D-12). |
| Dial | `context.compaction` in the 3 config surfaces | Body-verbosity knob; read at point-of-use (D-04/D-06). |
| WF18 pointer | one line per role file | Cheap additive reference (D-10), like the Phase-21 WF16 pointer. |

### Recommended Project Structure
```
scripts/
├── compactor.ts            # NEW — carve-out invariant checker; imports context-io.ts
├── compactor.js            # NEW — committed tsc output (freshness auto-discovers it)
├── compactor.test.ts       # NEW — RED-fixture-first; mirrors context-io.test.ts idiom
├── context-io.ts/.js       # REUSE — readContext/currentState/appendNote/admit
└── freshness.ts            # UNCHANGED — collectJs() auto-globs scripts/*.js (no edit needed)
agent-factory/
├── workflows/
│   └── 18-context-compaction.md   # NEW — single-source protocol (clear voice)
├── roles/*.md                     # +1 line each — WF18 pointer (like WF16 pointer)
└── config/
    ├── factory.config.json        # +context.compaction
    ├── factory.config.md          # +field ref + lean→enterprise dial row
    └── ../seed/.grugops/factory.config.json   # +context.compaction (byte-twin)
.gitignore                          # +threads/ entry (D-07)
```

### Pattern 1: Thin helper ON TOP of `context-io.ts` (never forks note I/O)
**What:** `compactor.ts` imports the compiled `context-io.js` for `readContext` / `currentState` / `appendNote` / `admit`; it owns ONLY the carve-out check + the trajectory-thread read.
**When to use:** Always — D-02/D-13 forbid re-implementing note I/O or admission.
**Example:**
```typescript
// Source: scripts/context-io.ts (verified signatures, this session)
import { readContext, currentState, appendNote, admit,
         NoteRecord, NoteInput, NOTE_KINDS } from "./context-io.js";
// compactor.ts adds: read threads/<agent>.md, run the carve-out invariant,
// then route promotion through appendNote(task, note, body, contextRoot).
```

### Pattern 2: The carve-out invariant (the un-dialable safety floor)
**What:** Before promotion, assert the structural invariants over `(raw thread → proposed promoted notes)`.
**When to use:** Every promotion, at every dial value (D-05 — the dial NEVER turns this off).
**Example shape (verified field set from `context-note.md`):**
```typescript
// LOAD-BEARING carve-out set (CMP-02), read off the provenance fence + the six kinds:
//   - every `failed-attempt` note id present in the raw thread survives into promoted set
//   - verified_by / supersedes / by / at intact on every promoted note
// On a drop: throw / exit 1 naming the dropped element — same posture as
// context-io.appendNote's "refusing to write an invalid note:\n<findings>" and hooks/guard.ts.
```

### Pattern 3: Dial read at point-of-use (no new machinery — D-06)
**What:** Roles/WF read `context.compaction` from `.grugops/factory.config.json` at the point they act, defaulting to `aggressive` when the key (or whole file) is absent.
**When to use:** WF18 prose + any role behavior gated on verbosity.
**Verified precedent:** `[VERIFIED: codebase]` `quality.self_fix_attempts` and `security.asvs_level` are read at the point of use (WF05, WF15, WF16); `factory.config.md` line 109 states every dial "degrades to its documented lean default when the key — or the whole file — is absent." `context.compaction` follows this exactly.

### Pattern 4: New single-source workflow + one-line role pointer (D-10)
**What:** WF18 is authored once; each role gains a single pointer line, identical in shape to the Phase-21 WF16 pointer.
**Verified precedent:** `[VERIFIED: codebase]` role files carry `Context I/O: read and write the shared context per agent-factory/workflows/16-context-read-write.md — that workflow is the single source; this role references it and does not restate it.` WF18's pointer mirrors this exactly (e.g. "Compaction: compact trajectory per `agent-factory/workflows/18-context-compaction.md` — single source, referenced not restated.").

### Anti-Patterns to Avoid
- **Semantic folding inside `compactor.ts`:** forbidden (D-03). The only fold it may reuse is `currentState()`'s deterministic `supersedes` collapse. Anything resembling "merge similar notes" / "dedup observations" is the agent's job.
- **A forked writer:** never write `.grugops/context/` from `compactor.ts` directly — route through `appendNote` (D-02.3); `guard_context_writes` would flag a raw write anyway.
- **A new verify loop:** never re-run the §14 gate from `compactor.ts`; reuse `admit()` (D-12).
- **Turning the carve-out off at `aggressive`:** the dial is body-verbosity only; the carve-out is un-dialable at all three values (D-05) — mirrors how `quality.test_integrity` has no `off` (TINT-03).
- **Restating the compaction protocol in role files:** add a pointer, not a copy (D-10).

### Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Note read/parse | A new frontmatter parser in `compactor.ts` | `context-io.readContext` / `currentState` | `[VERIFIED: codebase]` `parseNote` handles CRLF normalization, refs-list blocks, duplicate-key detection, supersede fold — re-deriving it risks divergence (D-13). |
| Promotion write | A direct `writeFileSync` into `notes/` | `context-io.appendNote` | `[VERIFIED: codebase]` `appendNote` does field-injection guards, validate, atomic Windows-safe write, unique note id (D-02.3). |
| Re-verify | A bespoke stamp checker | `context-io.admit` | `[VERIFIED: codebase]` `admit` already does the structural validate + live-green-verdict cross-check (D-12). |
| Dial reading | A new config loader/dial framework | Read at point-of-use, default-on-absent | `[VERIFIED: codebase]` matches `quality.*`/`security.*`; `factory.config.md` line 109 documents the absent→lean-default rule. |
| Build drift gate | A new freshness registration | `freshness.ts` `collectJs()` auto-globs `scripts/*.js` | `[VERIFIED: codebase]` `OUTPUT_DIRS = ["install","scripts","hooks"]`; the new `compactor.js` is discovered with zero edits to `freshness.ts`. |

**Key insight:** `compactor.ts` is almost entirely *glue + one invariant*. Every reusable primitive already exists in `context-io.ts`; the only genuinely new code is (a) the trajectory-thread read and (b) the deterministic carve-out check. Treat anything beyond those two as a smell that you are re-implementing Phase 20/21.

## Runtime State Inventory

> Phase 22 is additive (new helper + new workflow + config keys + a gitignore line + role pointers). It introduces a NEW ephemeral tier rather than renaming/migrating existing state. The relevant "what state exists" questions:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | The Phase-20 substrate under `.grugops/context/<task>/notes/` (committed source of truth) + derived `index.md`/`index.jsonl`. Phase 22 adds a sibling `threads/` dir under the SAME `<task>/`. | `[VERIFIED: context-note.md + context-io.ts]` No collision: `notes/` is the only path `context-io.ts` reads/writes (`join(contextRoot, task, "notes")`). `threads/` is a new untouched sibling. No data migration — Phase 22 writes only new files. |
| Live service config | None — grugops is a file-and-prompt kit; no external service stores compaction state. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None — no secret or env var references compaction. | None. |
| Build artifacts | New `scripts/compactor.js` must be committed and stay byte-fresh vs `compactor.ts`. Stale `.tmp-build/` is gitignored already. | Register nothing manually — `freshness.ts` auto-discovers `scripts/*.js`. Run `npm run build` and commit `compactor.js` in the same change as `compactor.ts`. |

**Nothing found in category:** Live service config, OS-registered state, secrets/env vars — confirmed by grep over the kit and config surfaces this session.

## Common Pitfalls

### Pitfall 1: The catalog exact-count test breaks when WF18 lands
**What goes wrong:** `scripts/generate-catalog.test.ts` asserts `countRowsLinkingInto(text, "workflows")).toBe(17)` and lists exactly 17 `WORKFLOW_NAMES`. Adding `18-context-compaction.md` makes the generator emit 18 workflow rows; the test goes RED.
**Why it happens:** The catalog *generator* (`generate-catalog.ts`) auto-discovers numbered workflow files via `/^\d{2}-.+\.md$/` (so it picks up WF18 with no edit), but its *test* hardcodes the count and the name list.
**How to avoid:** In the same plan that adds WF18, update `generate-catalog.test.ts`: bump both `toBe(17)` → `toBe(18)` and add WF18's "When to use" first-sentence-derived display name to `WORKFLOW_NAMES`. Then regenerate the catalog (`npm run generate:catalog`) and commit the new `docs/catalog/README.md` so `catalog-freshness.ts` stays green. `[VERIFIED: codebase]`
**Warning signs:** `freshness:catalog` or the catalog test failing red after adding the workflow file.

### Pitfall 2: WF17 does not yet exist — ordinals jump 16 → 18
**What goes wrong:** The frozen 00–17 sequence is incomplete on disk: only `00..16` exist (`17-task-claim.md` is a Phase-23 deliverable). Authoring `18-context-compaction.md` leaves a gap at 17.
**Why it happens:** Phase 22 (compaction) is sequenced before Phase 23 (which delivers WF17/task-claim) for token-tax reasons, even though 17 < 18.
**How to avoid:** This is expected and fine — the generator sorts by `order` and tolerates gaps (`workflows.sort((a, b) => a.order - b.order)`); the validator's frozen `WORKFLOWS` list is an existence floor (00–13 only) and never asserts a contiguous sequence. Author WF18 with `order: 18` in frontmatter regardless of the missing 17. Do NOT renumber. `[VERIFIED: codebase]`
**Warning signs:** A reviewer "fixing the gap" by renumbering WF18 to 17 — this would collide with Phase 23.

### Pitfall 3: `compactor.ts` tempted into a semantic fold
**What goes wrong:** A dev sees `currentState()`'s `supersedes` fold and extends it to "also drop near-duplicate observations" — crossing D-03's line.
**Why it happens:** The reuse surface exposes a real deterministic fold (`supersedes`), which looks like license for more folding.
**How to avoid:** The ONLY fold `compactor.ts` may reuse is `currentState()` verbatim. Any other dedup/merge is the agent's body-compression job. State this in `compactor.ts`'s header comment (clear voice) the way `context-io.ts` documents its boundaries. `[VERIFIED: CONTEXT.md D-03]`
**Warning signs:** New string-similarity / set-difference logic appearing in `compactor.ts`.

### Pitfall 4: Promoting a finding whose body changed but stamp didn't
**What goes wrong:** Aggressive body compaction materially alters a `finding` (changes what was verified), yet the `§14-gate#<id>` stamp is carried over verbatim — promoting a finding the verdict no longer covers.
**Why it happens:** D-12's cheap re-admission assumes the body compaction was *faithful* (verdict verified work, not words).
**How to avoid:** WF18 must instruct the agent: if compaction materially changed a finding, do NOT carry the stamp — degrade honestly to a `claim` with `confidence: UNKNOWN - verify` (the Phase-21 D-11 escape hatch). `admit()` will refuse a stamp that no longer cross-checks; the honest path is the degrade, never a hand-carried stamp. `[VERIFIED: context-io.ts admit() + WF16 step 4]`
**Warning signs:** `admit()` returning a findings array (non-empty) on a promoted finding — that is the signal to degrade, not to retry with the same stamp.

### Pitfall 5: `threads/` parent dir / gitignore scoping
**What goes wrong:** Either `threads/` is committed by accident (defeats D-07's ephemerality), or the agent's first write fails because the parent dir doesn't exist.
**Why it happens:** `appendNote` does `mkdirSync(notesDir, {recursive:true})` for `notes/` but nothing creates `threads/`.
**How to avoid (planner discretion areas):** Add a `.gitignore` entry scoped to the ephemeral tier only — e.g. `**/.grugops/context/*/threads/` — NOT a blanket `.grugops/context/` ignore (that would gitignore the committed `notes/`/`index.*`). `compactor.ts` (or the agent's first thread write) should `mkdirSync(threadsDir, {recursive:true})` before writing, exactly as `context-io.ts` does for `notes/`. Whether the seed/installer pre-creates the dir is planner-discretion (D-07 note). `[VERIFIED: context-io.ts appendNote + .gitignore]`
**Warning signs:** `git status` showing `threads/` files staged; or an ENOENT on the first thread append.

### Pitfall 6: Single-line field constraint on promoted notes
**What goes wrong:** A compacted note body or field smuggles a newline that `appendNote`'s `assertSingleLine` rejects, or a multi-line body that the carve-out check mishandles.
**Why it happens:** `context-io.ts` rejects CR/LF in any *frontmatter field* (CR-01 field-injection guard) — but the *body* may be multi-line.
**How to avoid:** The carve-out check operates on frontmatter (provenance) fields, which are already single-line by `appendNote`'s contract; the body is free-form markdown. Don't put provenance into the body. `[VERIFIED: context-io.ts assertSingleLine + composeNote]`

## Code Examples

Verified patterns from the committed source (this session):

### The reuse surface signatures (build ON these)
```typescript
// Source: scripts/context-io.ts (verified this session)
export const NOTE_KINDS = ["claim","finding","decision","failed-attempt","observation","artifact-ref"] as const;

export interface NoteInput {
  kind: NoteKind; by: string; at: string; verified_by: string;
  confidence: string; refs: string[]; supersedes: string | null;
}
export interface NoteRecord {
  id: string; kind: string; by: string; at: string; verified_by: string;
  confidence: string; refs: string[]; supersedes: string | null; body: string;
}

export function readContext(task: string, contextRoot?: string): NoteRecord[];
export function currentState(notes: NoteRecord[]): NoteRecord[];     // the supersedes fold (D-03)
export function appendNote(task: string, note: NoteInput, body: string, contextRoot?: string): string; // sole promotion path (D-02.3)
export function admit(task: string, text: string, contextRoot?: string): string[]; // [] = admitted; re-verify (D-12)
```

### The carve-out set, read off the schema (CMP-02)
```
Load-bearing / compaction-exempt (from agent-factory/contracts/context-note.md provenance fence):
  - verified_by   (D-02.2)
  - supersedes    (D-02.2)
  - by            (D-02.2)
  - at            (D-02.2)
  - every `failed-attempt` note id present in the raw thread must survive (D-02.1)
Required-field floor (validate() already enforces): kind, by, at, confidence.
```

### Refuse posture (mirror this in the carve-out checker)
```typescript
// Source: scripts/context-io.ts appendNote — the exact "refuse + name fault" idiom to mirror
const findings = validate(text);
if (findings.length > 0) {
  throw new Error(`context-io.appendNote: refusing to write an invalid note:\n${findings.join("\n")}`);
}
// compactor.ts CLI should exit 1 and name the dropped carve-out element (like hooks/guard.ts).
```

### The RED-fixture-first test idiom to extend (`compactor.test.ts`)
```typescript
// Source: scripts/context-io.test.ts (verified this session) — the exact idiom for compactor.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from "node:fs";
const COMPACTOR_JS = join(ROOT, "scripts", "compactor.js");
// import the compiled .js for pure paths; spawnSync the .js for CLI paths.
// Build a goodThread()/goodPromotedSet() fixture; each RED case DROPS one carve-out element
// and asserts exit !== 0 (or a thrown error) whose message NAMES the dropped element.
```

### The dial-read precedent (D-06)
```
// Source: agent-factory/config/factory.config.md line 109 (verified this session)
// "every one of the dials degrades to its documented lean default when the key — or the
//  whole file — is absent. A missing key is never an error; it is read as its lean default."
// → context.compaction absent ⇒ `aggressive`. Add the row to the lean→enterprise dial table
//   (the table lives at factory.config.md line 86+).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static handoff templates as inter-role memory | Shared verified context substrate (Phase 20) + admission gate (Phase 21) + compaction (Phase 22) | v2.0 milestone | Compaction is the third foundation layer; lands before parallel fan-out (Phase 23) makes the token tax real. |
| Unbounded shared-context growth | Two-tier memory: verbose local `threads/` + compact promoted distillation | This phase | Bounds Anthropic's documented ~15× multi-agent token tax; protects the ~50% cost story (which itself stays `UNKNOWN - verify` until Phase-26 DOGF measures it). |
| Tool does everything | Body=agent (semantic), structure=tool (mechanical) seam | Phases 21→22 | Same un-cheatable-floor pattern as `context-io.ts` + `hooks/guard.ts`. |

**Deprecated/outdated:** None introduced. Phase 22 adds; it deprecates nothing (handoff-template deletion is Phase 24).

### DeLM grounding (prior art for the LOCKED approach — not to change it)
`[CITED: arXiv 2606.10662 + github.com/yuzhenmao/DeLM]` (via `.planning/research/SUMMARY.md`, HIGH-confidence per its own metadata):
- DeLM's compaction = **hierarchical summarization** (atomic ref-tagged bullets → highly-compact gists; read gists by default, selectively unfold on demand). grugops's `aggressive`/`balanced`/`retain-raw` dial expresses where on that gist↔raw slider the *shared* tier sits; selective-unfold operates in-session (D-04/D-07).
- Three cost-saving sources: (1) **shared failures as reusable constraints** → grugops's `failed-attempt` carve-out (D-02.1 — never compacted away); (2) **compact patch-summaries** replacing full traces → the body compression (D-01); (3) **selective unfold** → raw stays in `threads/`, unfolded on demand (D-04 `aggressive`).
- DeLM source files of interest: `memory_compactor.py`, `shared_lessons.py`, `verifier.py`, and the `trajectories/` / `events.jsonl` / `lessons/` outputs — grounding only; grugops's verifier is the §14 gate, not DeLM's grounding verifier, and DeLM benchmark numbers are NEVER claimed as grugops's (no-fabrication floor).

## Project Constraints (from CLAUDE.md)

- **Zero host runtime deps:** `compactor.ts` uses `node:fs`/`node:path`/`node:crypto` ONLY; runs as committed `.js` with bare Node 22+. No npm install on hosts. (Why this forbids semantic folding — D-01/D-03.)
- **D-13 committed-`.js`/freshness contract:** author `.ts` → `tsc` → commit `.js` → `freshness.ts` byte-diffs a temp rebuild and fails red on drift. `compactor.js` auto-joins the gate (no manual registration).
- **No-fabrication:** never fake a passing gate/stamp; on a refused finding, degrade to `claim` + `confidence: UNKNOWN - verify` (D-12). Unknown values are `UNKNOWN - verify`.
- **Clear professional voice:** `compactor.ts`, WF18, and the dial docs are trace + safety + token surfaces → clear voice, NOT caveman (matches `context-io.ts`, `hooks/guard.ts`, `freshness.ts`, WF16).
- **Single-source:** WF18 authored once; roles point at it (D-10). `compactor.ts` reuses `context-io.ts`; no forked note I/O.
- **Installers idempotent/additive/reversible:** the `.gitignore` line, config keys, and seed twin are additive; the seed `factory.config.json` stays a byte-twin of the config copy (D-06).
- **Brand:** lowercase `grugops`; no change to command shape this phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `vitest ~4.1.8` (dev-only; `globals: false` → import `{describe,it,expect}` explicitly) |
| Config file | `vitest.config.ts` (existing; the suite runs `vitest run`) |
| Quick run command | `npx vitest run scripts/compactor.test.ts` |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` (regression lane — avoids the live claude-CLI e2e lane that spends tokens; see MEMORY) |
| Build/freshness | `npm run build && npm run freshness` (proves `compactor.js` is byte-fresh vs `compactor.ts`) |

> **Idiom (verified):** `compactor.test.ts` mirrors `context-io.test.ts` exactly — `import` the committed `compactor.js` for pure-function paths, `spawnSync("node", [COMPACTOR_JS, ...])` for CLI paths, all fixtures in `mkdtempSync` temp dirs (nothing written into the committed tree), RED until the committed `.js` lands. The carve-out RED cases are the highest-value tests in the phase.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMP-02 | Dropping `verified_by` from a promoted note → refuse (exit 1, names `verified_by`) | unit | `npx vitest run scripts/compactor.test.ts -t "drops verified_by"` | ❌ Wave 0 |
| CMP-02 | Dropping `supersedes` from a promoted note → refuse (names `supersedes`) | unit | `... -t "drops supersedes"` | ❌ Wave 0 |
| CMP-02 | Dropping `by` (or `at`) provenance → refuse (names the field) | unit | `... -t "drops by"`, `... -t "drops at"` | ❌ Wave 0 |
| CMP-02 | Dropping ANY raw `failed-attempt` note id from the promoted set → refuse (names the dropped id) | unit | `... -t "drops a failed-attempt"` | ❌ Wave 0 |
| CMP-02 | GOOD: a faithful compaction that preserves all carve-out elements → accepted (exit 0) | unit | `... -t "carve-out intact accepts"` | ❌ Wave 0 |
| CMP-01 | Verbose trajectory stays in `threads/<agent>.md`; only the compact distillation reaches `notes/` | integration | `... -t "two-tier separation"` | ❌ Wave 0 |
| CMP-01 | Promotion routes ONLY through `context-io.appendNote` (no forked writer) | unit | `... -t "promotes via appendNote only"` + `guard_context_writes` (existing) | ❌ Wave 0 |
| CMP-03 | `aggressive\|balanced\|retain-raw` change body verbosity / raw-reaching-shared; promoted note set + carve-out stay dial-invariant | unit | `... -t "dial is body-only, note-set invariant"` | ❌ Wave 0 |
| CMP-03 | Lean default: `context.compaction` absent ⇒ `aggressive` | unit | `... -t "absent dial defaults aggressive"` | ❌ Wave 0 |
| CMP-03 | Re-verify: faithful body compaction re-admits cheaply via `admit()`; a materially-changed finding is refused → degrades to `claim` + `UNKNOWN - verify` | integration | `... -t "re-verify faithful admits"`, `... -t "materially-changed degrades to claim"` | ❌ Wave 0 |
| CMP-03 / D-13 | `compactor.js` is byte-fresh vs `compactor.ts` (registered in the freshness set) | build gate | `npm run build && npm run freshness` | ✅ (auto-discovered) |
| CMP-03 / catalog | New WF18 row appears; catalog stays fresh; count test bumped 17→18 | content gate | `npm run generate:catalog && npm run freshness:catalog && npx vitest run scripts/generate-catalog.test.ts` | ⚠️ test edit required |

### CMP-02 — the RED-fixture-first carve-out plan (highest-value target)
- **Minimal fixtures:** a `goodRawThread()` containing at least one `failed-attempt` note (id `FA-1`) plus a verified `finding` (stamp `§14-gate#SEED-001`, carrying `verified_by`/`by`/`at`/`supersedes`); and a `goodPromotedSet()` that preserves all of them. Reuse `context-io.test.ts`'s `goodNoteText()` shape for note composition.
- **One RED case per carve-out element:** mutate `goodPromotedSet()` to drop exactly one element (`verified_by`, `supersedes`, `by`, `at`, or the `FA-1` `failed-attempt` id), run the checker, assert the run fails.
- **Exact failure assertion:** `expect(r.status).not.toBe(0)` (CLI path) **and** `expect(\`${r.stdout}${r.stderr}\`).toContain("<dropped-element-name>")` — the checker must NAME the fault, mirroring `context-io.test.ts` SC-1b (`...).toContain("confidence")`) and `appendNote`'s `refusing to write an invalid note:\n<findings>`.
- **One GOOD case:** the intact promoted set passes (exit 0), so the RED cases prove the *drop* fails, not that the checker rejects everything.
- **Dial-invariance of the carve-out (D-05):** run the same drop cases at all three dial values and assert each still refuses — the carve-out is un-dialable.

### CMP-01 — two-tier behavior
- Assert that after a compaction pass, the verbose body lives in `.grugops/context/<task>/threads/<agent>.md` while `notes/` receives only the compact distillation (byte-length or content-set assertion that the raw narrative is NOT in `notes/` under `aggressive`).
- Assert the sole-writer invariant: grep/spy that the only path writing `notes/` is `appendNote` (the existing `guard_context_writes` foundation guard already fails red on any other `.grugops/context/` writer — extend its scan to confirm `compactor.ts` adds no forked writer).
- Confirm `threads/` is gitignored (assert the `.gitignore` entry exists and is scoped to `*/threads/`, not the whole context dir).

### CMP-03 — the dial + re-verify
- **Three values change body verbosity:** assert `aggressive` promotes only the gist; `balanced` promotes gist + mid-tier summary; `retain-raw` promotes full bodies into `notes/`. Assert across all three the *promoted note set* (which durable kinds appear) and the carve-out are identical (D-05).
- **Lean default:** with no `context.compaction` key (and with no config file at all), assert behavior == `aggressive`.
- **Re-verify (D-12):** GOOD — compact a finding's body faithfully, carry its `§14-gate#<id>`, seed a live green verdict under the task, assert `admit()` returns `[]` (admitted). BAD — materially change the finding so the stamp no longer cross-checks (no matching live green verdict, or stamp removed), assert `admit()` returns a non-empty findings array AND the honest outcome is a `claim` with `confidence: UNKNOWN - verify` (never a hand-carried stamp, never a faked pass).

### Sampling Rate
- **Per task commit:** `npx vitest run scripts/compactor.test.ts` (the carve-out + dial unit cases — seconds).
- **Per wave merge:** `npm run build && npm run freshness && npx vitest run --exclude '**/scripts/e2e/**'` (full regression + drift gate; excludes the live e2e lane per MEMORY).
- **Phase gate:** full suite + `freshness:catalog` + `freshness:context` green before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/compactor.test.ts` — covers CMP-01 / CMP-02 / CMP-03 (the carve-out RED cases first).
- [ ] `scripts/compactor.ts` + committed `scripts/compactor.js` — the helper under test.
- [ ] `agent-factory/workflows/18-context-compaction.md` — exercised indirectly (clear-voice protocol; validator existence floor does not enforce its sections — see Open Question 1).
- [ ] `generate-catalog.test.ts` edit — bump `toBe(17)` → `toBe(18)` and add WF18 to `WORKFLOW_NAMES` (else RED).
- [ ] No framework install needed — `vitest`/`tsc` already present.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Running committed `.js` + `tsc`/`vitest` | ✓ (host floor) | 22+ | — (hard prerequisite) |
| `typescript` (`tsc`) | D-13 build of `compactor.js` | ✓ | dev-dep | — |
| `vitest` | `compactor.test.ts` | ✓ | `~4.1.8` | — |
| External packages | — | n/a | — | n/a (zero-host-dep constraint) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Security Domain

> `security_enforcement` is enabled (config `security.asvs_level: L1`, absent ⇒ enabled). Phase 22 is a local-filesystem tooling change with no network/auth surface, but the substrate it writes is a trust boundary.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface. |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | Local FS only. |
| V5 Input Validation | yes | The raw trajectory body is untrusted input that becomes a promoted note. **Reuse** `context-io.ts`'s field-injection guards (`assertSingleLine`, duplicate-key rejection) — promotion routes through `appendNote`, so these fire automatically (D-02.3). `compactor.ts` adds NO new write path that could bypass them. |
| V6 Cryptography | no | The note `<nonce>` is a collision nonce, NOT a security token (per `context-note.md`); no crypto property is claimed or needed. |
| V12 File/Resource | yes | Task-name path-traversal is already mitigated in `context-io.ts` (`assertSafeTask`, `^[A-Za-z0-9._-]+$`). `compactor.ts` must compose `threads/<agent>.md` paths through the same allowlist discipline for the `<agent>` segment (do not interpolate an unvalidated agent name into a path). |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forged verified `finding` via newline-injected frontmatter in a compacted body | Tampering / Elevation | `appendNote`'s `assertSingleLine` + duplicate-key rejection (CR-01) — already enforced; promotion must route through it (D-02.3). |
| Carve-out element silently dropped during compaction (loses a `failed-attempt` constraint or a provenance stamp) | Tampering / Repudiation | The D-02 invariant checker refuses + names the fault (the entire point of CMP-02). |
| Stamp carried over a materially-changed finding (admits unverified work) | Tampering | `admit()` cross-check refuses; honest degrade to `claim` + `UNKNOWN - verify` (D-12). |
| Path traversal via `<agent>` or `<task>` segment in the thread path | Tampering | Reuse `assertSafeTask` allowlist for both segments (V12). |
| Forked writer bypassing `guard_context_writes` | Tampering | D-02.3 single write path; `guard_context_writes` fails red on any non-`context-io.ts` writer. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `compactor.ts` needs no `node:crypto` nonce of its own (note ids come from `appendNote`). | Standard Stack | LOW — if a thread-file id is needed, add `randomUUID` (already allowed); does not change the design. |
| A2 | A `.gitignore` glob `**/.grugops/context/*/threads/` is the right scoping (ignore ephemeral tier, keep committed `notes/`/`index.*`). | Pitfall 5 | LOW — exact wording is explicit planner discretion (CONTEXT.md); the *intent* (ignore only `threads/`) is locked by D-07. |
| A3 | The validator (`validate-agent-factory.ts`) will NOT enforce WF18's section presence because its frozen `WORKFLOWS` list stops at `13-incident` (existence floor only, not exact-count). | Open Question 1 | LOW — confirmed by reading the validator this session; means WF18 is unvalidated for sections, which is a Phase-24 concern, not a Phase-22 blocker. |
| A4 | DeLM's compaction mechanics (hierarchical summarization, three cost sources) are grounding only and need no further verification beyond `.planning/research/SUMMARY.md` (self-rated HIGH). | State of the Art | LOW — grounding does not change the LOCKED approach; benchmark numbers are explicitly never claimed. |

**If this table is empty:** it is not — but all assumptions are LOW-risk and most are explicitly planner-discretion in CONTEXT.md.

## Open Questions

1. **Should WF18 be added to the validator's frozen `WORKFLOWS` section-check list?**
   - What we know: `validate-agent-factory.ts`'s `WORKFLOWS` array stops at `13-incident` (it never included WF14/15/16/17), so it is an existence floor, not an exact-count gate; adding WF18 will NOT break the validator, but WF18's required sections (`## When to use`, `## Steps`, `## Commit`, etc.) will go unvalidated. `[VERIFIED: codebase]`
   - What's unclear: whether Phase 22 should opportunistically add WF14–18 to that frozen list, or leave validator rewiring to Phase 24 (where deep rewiring lands).
   - Recommendation: **Leave it to Phase 24** (CONTEXT.md explicitly defers deep validator rewiring). Author WF18 to match the WF16 section shape so it is already conformant when Phase 24 wires it in. The catalog test count bump (Pitfall 1) IS in scope for Phase 22 because it goes RED otherwise; the validator section-check is NOT (it stays green either way).

2. **Does the seed/installer pre-create the `threads/` parent dir?** (Explicit Claude's-discretion item in CONTEXT.md.)
   - What we know: `appendNote` already `mkdirSync({recursive:true})`s `notes/` on demand; nothing creates `threads/`.
   - Recommendation: have `compactor.ts` / the agent's first thread write `mkdirSync(threadsDir, {recursive:true})` (zero-cost, matches `context-io.ts`), and do NOT add a committed seed dir for an ephemeral, gitignored tier (committing a `.gitkeep` would contradict D-07). Planner-final.

## Sources

### Primary (HIGH confidence)
- `scripts/context-io.ts` — verified signatures of `readContext`/`currentState`/`appendNote`/`admit`/`validate`/`emitVerdict`, the `NoteRecord`/`NoteInput`/`NOTE_KINDS` types, `assertSafeTask`/`assertSingleLine`, the `supersedes` fold, the green-verdict recognizer.
- `agent-factory/contracts/context-note.md` — the provenance fence (the CMP-02 carve-out set), the six kinds, the required-field rule, the `claim`-KIND ≠ queue-CLAIM distinction.
- `agent-factory/workflows/16-context-read-write.md` — the single-source/referenced-not-restated pattern WF18 follows; the admission + escape-hatch rules WF18 references.
- `scripts/context-io.test.ts` — the spawn-the-`.js` + import-the-`.js` RED-fixture-first idiom for `compactor.test.ts`.
- `scripts/freshness.ts` — `OUTPUT_DIRS = ["install","scripts","hooks"]` + `collectJs()` glob → `compactor.js` auto-discovered.
- `scripts/generate-catalog.ts` + `scripts/generate-catalog.test.ts` — generator auto-discovers numbered workflows (`/^\d{2}-.+\.md$/`); the test hardcodes `toBe(17)` + `WORKFLOW_NAMES` (the landmine).
- `scripts/validate-agent-factory.ts` — frozen `WORKFLOWS` existence floor (00–13); no exact-count/contiguity assertion.
- `agent-factory/config/factory.config.json` + `factory.config.md` + `agent-factory/seed/.grugops/factory.config.json` — the three dial surfaces; the lean→enterprise dial table (line 86+) and the absent⇒lean-default rule (line 109).
- `agent-factory/roles/*.md` — the verified Phase-21 WF16 one-line pointer shape to mirror for WF18.
- `.planning/REQUIREMENTS.md` — CMP-01/02/03; the CMP-04 deferral.
- `.planning/phases/22-.../22-CONTEXT.md` — the LOCKED decisions D-01…D-13.

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY.md` — DeLM grounding, the 15× token-tax framing, the three-helper stack, the three-new-workflow plan (self-rated HIGH for Features; treated MEDIUM here as it is a synthesis, not primary source).

### Tertiary (LOW confidence)
- DeLM external prior art (arXiv 2606.10662 + `github.com/yuzhenmao/DeLM`) — cited via the research summary, not re-fetched this session (grounding only; does not gate the LOCKED design).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every primitive verified against committed `context-io.ts`; zero new deps.
- Architecture: HIGH — the body/frontmatter seam, single-writer-path, and dial-read patterns all verified against committed source and CONTEXT.md.
- Pitfalls: HIGH — the catalog-count landmine, the 16→18 ordinal gap, the validator existence-floor behavior, and the gitignore scoping all verified by reading the actual files this session.
- Validation Architecture: HIGH — mirrors the proven `context-io.test.ts` idiom; the carve-out RED-case plan maps 1:1 to the verified provenance fence.

**Research date:** 2026-06-18
**Valid until:** 2026-07-18 (stable — internal kit + Node stdlib; no fast-moving external surface). Re-check only if `context-io.ts`'s signatures or the catalog test counts change before planning.
