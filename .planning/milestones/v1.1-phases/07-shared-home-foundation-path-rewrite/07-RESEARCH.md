# Phase 7: Shared-Home Foundation & Path Rewrite - Research

**Researched:** 2026-06-06
**Domain:** Mechanical path-root rewrite of a markdown agent-factory kit (kit/state split) + a POSIX build gate
**Confidence:** HIGH (all counts are live greps over the shipped tree; decisions are locked upstream)

## Summary

This is the linchpin phase of milestone v1.1. The kit/state split and the "one rule, two homes" resolution mechanism are already **locked** (CONTEXT.md D-01..D-12); this research does **not** re-decide them. Its job is to hand the planner the *mechanical, enumerated ground truth* needed to execute a complete, zero-regression rewrite: the exact file set, the exact per-category ref counts, the exhaustive handoff-template allowlist for the build gate, the two adapter landing sites, the gate design, the sequencing hazards, and a Validation Architecture section keyed to the five success criteria.

The work is **pure markdown prose editing** plus **one new POSIX script** — no new dependencies, no `package.json`, consistent with the project's markdown-only-except-installers constraint. The live grep finds **187 `agent-factory/…` references across 43 in-scope files** (the "~31 files / ~137 refs" figures in upstream docs were a rewrite-relevant subset; the working numbers are below). Of these, ~96 are kit-to-kit refs that **stay bare** (D-01: roles/workflows/checklists/commit-convention/packaging), 44 are config refs that **rewrite to `.grugops/factory.config.json`** (D-02), and 51 are handoff refs that split into **template-read (stay bare) vs instance-write (`plans/handoffs/<WORK-ITEM-ID>-<stage>.md`)** (D-03/D-05).

The single most important mechanical discovery: **19 of the 51 handoff refs are dir-only** (`agent-factory/handoffs/` with no filename) — collective phrasings like "the open handoffs in `agent-factory/handoffs/`" and the "Under `agent-factory/handoffs/`:" headers in every workflow's *Handoffs produced* section. These are neither a clean template-read nor a clean instance-write and are the highest-risk rewrite targets. The build gate must allowlist them carefully (a bare `agent-factory/handoffs/` dir-only ref must be permitted only where it genuinely means "the template dir," and the *Handoffs produced* headers should become `plans/handoffs/` runtime-instance references).

**Primary recommendation:** Rewrite in the natural buckets below, land the `_role-switch-protocol.md` step-4 split exactly once, state the canonical rule in AGENTS.md with compressed restatements in the orchestrator + adapter preambles, then ship `scripts/check-kit-refs.sh` (POSIX, mirroring `.planning/phases/05-…/check-structure.sh` idiom) with the two D-08 assertions over an explicitly-scoped file set. The gate must land **after** the rewrite (it ships RED otherwise).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Kit-ref spelling (SHOME-03):**
- **D-01:** Roles/workflows/checklists/packaging refs stay **bare** `agent-factory/…` — the central disambiguation rule (D-08/D-09) resolves them to KIT ROOT. Minimal diff where the ref is unambiguous (these dirs are read-only kit, never written).
- **D-02:** Config refs (~48 noted; live count 44 in-scope) at `agent-factory/config/…` are rewritten to repo-relative `.grugops/factory.config.json`. Roles read the per-repo instance, never the kit's default config. `#<field>` anchors preserved.
- **D-03:** Handoff refs (~51) are spelled with **explicit template-read vs instance-write phrasing** — e.g. "read the `implementation-handoff.md` **template** from `agent-factory/handoffs/`" (KIT) vs "**write** to `plans/handoffs/<…>.md`" (STATE). Explicit only where ambiguity is real.

**Handoff instance naming (accepted scope addition):**
- **D-04:** Handoff instances written to `plans/handoffs/` are **ticket-scoped**, not generic filenames — a durable per-work-item trail, removing cross-ticket collision risk.
- **D-05:** Instances are **named by their owning work item**: `plans/handoffs/<WORK-ITEM-ID>-<stage>.md`. Delivery handoffs (implementation/qe/security-nfr) scope by **TICKET-ID**; release=**REL-**, incident=**INC-**, sprint artifacts (sprint-plan / retro / refinement)=the **sprint ID**. One rule: an instance is named by the work item that owns it. (Exact `<stage>` tokens are Claude's discretion — derived from existing template names; proposed below.)
- **D-06:** Blast radius acknowledged: touches role prose, `_role-switch-protocol.md` step-4 write instruction, and `04-ticket-to-pr.md`'s handoff read refs (must now read the ticket-scoped instance, not a generic filename).

**Build gate (SHOME-03 / SC5):**
- **D-07:** The gate is a **standalone `scripts/check-kit-refs.sh`** (POSIX, matching install.sh tooling), runnable in CI and locally. Kept separate from `scripts/validate-agent-factory.mjs` (which becomes two-root-aware in Phase 9 / VAL-02; Phase 9 may later call or absorb this script). No `.mjs` byte-parity twin required.
- **D-08 (gate logic):** Two mechanical assertions over the shipped kit + adapters + AGENTS.md:
  1. **Zero** `agent-factory/config/` refs (config fully migrated to `.grugops/`).
  2. Every surviving `agent-factory/handoffs/` ref **matches a known handoff template filename** (the 16 listed below). A stray ticket-scoped write that leaked into the kit (`agent-factory/handoffs/<ID>-…`) FAILS because it is not a template name.

**Disambiguation rule home (SHOME-04 / SC2):**
- **D-09:** Full kit-vs-state rule stated **canonically once in AGENTS.md**. A **compressed 1–2 line invariant** is restated in the **orchestrator preamble** AND the **adapter preamble**, each cross-linking AGENTS.md.
- **D-10:** The compressed invariant (in spirit): `agent-factory/` = KIT (read-only, from the kit root, never write); `plans/` `memory-bank/` `.grugops/` = STATE (read/write in THIS repo); `agent-factory/handoffs/` is the TEMPLATE read while `plans/handoffs/` is the runtime INSTANCE write; **STOP — do not hunt — if the resolved kit dir is absent.**

**Kit-absent behavior (SHOME-04 / SC2):**
- **D-11:** **Adapter-only resolution.** The standalone adapter is the SOLE resolver: installer-materialized **absolute path is primary**; the one-line `${GRUGOPS_HOME:-$HOME/.grugops}` bash **self-heal runs ONLY when that path is absent**; if both fail, the adapter **STOPs**, printing the named missing path + remediation (`run install.sh` / `install.sh --check`).
- **D-12:** **Roles/workflows NEVER re-resolve.** On a failed kit read a role STOPs, naming the unresolved path, never searches the repo. No role/workflow/SKILL/AGENTS.md ever names `$GRUGOPS_HOME`.

### Claude's Discretion
- Exact `<stage>` token spelling for instance filenames (derive from existing handoff template names) — **proposed mapping below**.
- Exact wording/format of the compressed invariant (D-10) and the STOP/remediation message (D-11), within the stated spirit.
- The precise list of files in the rewrite set and rewrite sequencing — **enumerated below**. The `_role-switch-protocol.md` branch is already merged to main, so its step-4 edit happens once inside this phase.

### Deferred Ideas (OUT OF SCOPE)
- **Parallel-ticket handoff support** — D-05 lays the groundwork (no cross-ticket collision) but full parallel-ticket workflow support is a future phase.
- **Migration of already-installed repos** — explicitly **MIGR-01, v1.2**; never delete-first. Out of scope here.
- **Plugin-form kit resolution** (`${CLAUDE_PLUGIN_ROOT}`) — the convention is frozen here, but wiring/publishing the plugin form is **PLUGIN-01, v2+**. (Leave the seam clean: the disambiguation rule prose should say "the kit root" not "the absolute path," so the plugin's `${CLAUDE_PLUGIN_ROOT}` binding drops in without a second rewrite.)
- **Phase 8** (installer that materializes the absolute kit path), **Phase 9** (`--check` doctor + two-root validator VAL-02) — OUT OF SCOPE. Only leave interface seams clean.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHOME-01 | Kit installs once to `${GRUGOPS_HOME:-$HOME/.grugops}` (default `~/.grugops`, NOT XDG, NOT literal `~`), resolved identically by POSIX `sh` and Node stdlib; read-only/central | This phase only *freezes the convention* in AGENTS.md prose + the adapter self-heal line (the one place bash runs). Actual resolution code is Phase 8. The `${GRUGOPS_HOME:-$HOME/.grugops}` token appears ONLY in the adapter (D-11/D-12). sh↔Node parity note in *Adapter Landing Sites* below. |
| SHOME-02 | Per-repo state in target repo: `plans/` (incl. `plans/handoffs/`), `memory-bank/`, project config under per-repo `.grugops/`. The config refs resolve to `.grugops/factory.config.json` | 44 config refs enumerated by file below. Handoff WRITE refs → `plans/handoffs/`. `.grugops/` is the LOCKED location (supersedes the older ARCHITECTURE.md repo-root recommendation per STATE.md). |
| SHOME-03 | The ~31 (live: 43) role/workflow/adapter files rewritten so kit refs resolve to kit root, state refs repo-relative; build gate proves ZERO bare `agent-factory/…` refs that should point at the kit (grep-to-zero) | Full enumerated rewrite set + per-category counts + buckets below. Gate design in *Build-Gate Design*. |
| SHOME-04 | Kit root resolves by ONE rule, two homes — installer-materialized absolute path (standalone) or `${CLAUDE_PLUGIN_ROOT}` (plugin). No role/workflow/SKILL/AGENTS.md names `$GRUGOPS_HOME`; only the adapter carries the one-line self-heal | Adapter landing sites + the no-`$GRUGOPS_HOME`-in-prose invariant. The gate can additionally assert `$GRUGOPS_HOME` appears in NO kit/adapter-prose file except the adapter self-heal line (proposed assertion 3, below). |
</phase_requirements>

## Architectural Responsibility Map

This is a markdown agent-factory kit, not a multi-tier app. "Tiers" here are the conceptual homes a reference can resolve to. Mapping each capability to its home is the entire point of the phase.

| Capability | Primary Home | Secondary Home | Rationale |
|------------|-------------|----------------|-----------|
| Role / workflow / checklist / commit-convention text reads | KIT ROOT (`agent-factory/…`, read-only) | — | Static kit; never written at runtime; stays bare per D-01 |
| Handoff **template** reads | KIT ROOT (`agent-factory/handoffs/<template>.md`) | — | Templates are static kit; stay bare; D-03 |
| Handoff **instance** writes | STATE (`plans/handoffs/<WORK-ITEM-ID>-<stage>.md`, repo) | — | Runtime per-request output; collides across projects if shared; D-05 |
| Config reads | STATE (`.grugops/factory.config.json`, repo) | — | mode/cadence/autonomy/WIP differ per repo; D-02 |
| Board / traceability / metrics / sprints / releases / tickets | STATE (`plans/…`, repo) | — | Already repo-local; unchanged |
| Memory-bank reads/writes | STATE (`memory-bank/…`, repo) | — | Already repo-local; unchanged |
| Kit-root **resolution** (absolute path / env-var) | ADAPTER only (`.claude/skills/*`, `.claude/agents/grugops-orchestrator.md`) | — | D-11/D-12: the one place bash runs; roles never re-resolve |
| Disambiguation **rule** statement | AGENTS.md (canonical) | orchestrator + adapter preamble (compressed) | D-09: closest-file-wins, single-sourced expanded text |

## Standard Stack

No external packages. This phase is markdown edits + one POSIX shell script. Per the project constraint: *"Markdown for everything except installers (`install.sh` POSIX + `install.mjs` Node)."* The gate script is POSIX `sh`, matching `install/install.sh` house style.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| POSIX `sh` | n/a (`/bin/sh` present) `[VERIFIED: command -v sh]` | `scripts/check-kit-refs.sh` build gate | Matches `install/install.sh` (`#!/usr/bin/env sh`, `set -eu`, `printf` not `echo -e`, `grep -qF`, small helpers) `[VERIFIED: read install/install.sh]` |
| `grep` (POSIX BRE/ERE) | host grep is **ugrep 7.5.0** aliased to `grep` `[VERIFIED: grep --version]` | Find/classify refs | Gate MUST use only portable POSIX flags (`-r`, `-n`, `-l`, `-E`, `-F`, `-q`, `-v`, `-o`) — do NOT depend on GNU-only or ugrep-only behavior, since CI/other dev machines vary. See Pitfall 4. |
| Node 18+ (stdlib only) | host **v24.12.0** `[VERIFIED: node --version]` | NOT used this phase | D-07 explicitly rejects a `.mjs` twin of the gate. Node parity is a Phase-8 installer concern only. |

### Supporting
| Asset | Purpose | When to Use |
|-------|---------|-------------|
| `.planning/phases/05-…/check-structure.sh` | Reference POSIX harness idiom (`pass()`/`fail()`/`FAILS` counter, `exit 0`/`exit 1`) `[VERIFIED: read in full]` | Copy the structural-check idiom for `scripts/check-kit-refs.sh` |
| `install/install.sh` | House-style POSIX conventions + the `is_protected()` denylist (`agent-factory/ plans/ .planning/ docs/ src/`) `[VERIFIED: read head + STATE.md]` | Match style; note the protected-dir list for what the gate must NOT mutate (gate is read-only anyway) |
| `scripts/validate-agent-factory.mjs` | Existing structure validator | Stays separate (D-07); Phase 9 absorbs/calls the gate |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Standalone `scripts/check-kit-refs.sh` (D-07) | Extend `validate-agent-factory.mjs` now | Rejected by D-07: the validator becomes two-root-aware in Phase 9; keeping the gate a tiny POSIX script lets CI run it with zero Node and lets Phase 9 absorb it cleanly |
| `grep -E` allowlist alternation | Maintain a golden snapshot of expected refs | Rejected: D-05's naming makes writes (`<ID>-<stage>`) structurally distinct from template reads (`<template-name>`), so the gate distinguishes them mechanically with no snapshot to maintain |

**Installation:** none — no packages.

## Package Legitimacy Audit

Not applicable — this phase installs **zero external packages**. No npm/PyPI/crates dependency is added; the only new artifact is a POSIX shell script authored in-repo. slopcheck not run (nothing to check).

## Architecture Patterns

### System Diagram — how a reference resolves after the rewrite

```
                       ┌─────────────────────────────────────────────┐
   agent reads a ref → │  Is the path under  agent-factory/… ?        │
                       └───────────────┬─────────────────────────────┘
                          YES (KIT)    │                  NO (STATE)
              ┌──────────────────────────┐        ┌────────────────────────────┐
              │ Resolve under KIT ROOT   │        │ Resolve repo-relative      │
              │ (read-only).             │        │ (read/write THIS repo).    │
              │ KIT ROOT is bound ONLY   │        │  plans/…                   │
              │ in the ADAPTER:          │        │  memory-bank/…             │
              │  • installer-materialized│        │  .grugops/factory.config.. │
              │    absolute path (1st)   │        │  plans/handoffs/<ID>-<stg> │
              │  • ${GRUGOPS_HOME:-...}  │        └────────────────────────────┘
              │    bash self-heal (2nd)  │
              │  • else STOP + remediate │        handoff TEMPLATE read = KIT
              └──────────────────────────┘        handoff INSTANCE write = STATE
                                                   (same word "handoffs", two homes)
```

The diagram's only decision point is the prefix `agent-factory/`. Everything else is "this repo." The handoff split is the one place the same directory *name* maps to two homes — which is exactly why D-03 requires explicit template-vs-instance prose and why the gate exists.

### Pattern 1: Bucketed rewrite (minimal-diff where unambiguous)
**What:** Edit files in natural buckets so each bucket has one rewrite rule.
**When to use:** All 43 files.
**Buckets (see *Enumerated Rewrite Set* for per-file detail):**
- **Bucket A — config refs → `.grugops/`** (44 refs, 38 files): replace `agent-factory/config/factory.config.json` → `.grugops/factory.config.json`; preserve `#wip_limits` / `#quality` anchors; the lone `agent-factory/config/factory.config.md` ref (if any prose cites the human twin) follows the same root.
- **Bucket B — handoff WRITE refs → `plans/handoffs/<ID>-<stage>.md`** (the per-role "Output" lines + workflow "Handoffs produced" headers): convert "write … `agent-factory/handoffs/X.md`" to "read the `X.md` **template** from `agent-factory/handoffs/`, write the filled instance to `plans/handoffs/<ID>-<stage>.md`."
- **Bucket C — handoff READ-the-template refs → stay bare** (input lines that genuinely read a template): keep `agent-factory/handoffs/<template>.md`, add the word "template" for clarity per D-03.
- **Bucket D — kit-to-kit refs → stay bare, NO edit** (roles, workflows, checklists, `_commit-convention.md`, packaging cross-refs): ~96 refs. D-01 — these are correct as-is once the disambiguation rule is stated. Minimal diff: touch only if the surrounding prose is being rewritten anyway.
- **Bucket E — preamble/canonical-rule additions:** AGENTS.md canonical rule (D-09/D-10), orchestrator preamble, adapter preamble + self-heal/STOP (D-11/D-12).

### Anti-Patterns to Avoid
- **Blanket find-replace `agent-factory/handoffs/` → `plans/handoffs/`:** WRONG — it would relocate the *template reads* (Bucket C) and the dir-only collective references into the state dir, breaking template resolution. The split is semantic, not lexical.
- **Naming `$GRUGOPS_HOME` in any role/workflow/SKILL/AGENTS.md:** the cross-cutting anti-pattern (LLM does not expand env vars in prose). Only the adapter self-heal line may contain it.
- **Landing the gate before the rewrite:** it ships RED and blocks; sequence the gate last (it is the proof, not a scaffold).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Distinguishing instance-write from template-read in the gate | A golden snapshot of every legal ref | The D-05 naming contract + a `grep -E` allowlist alternation | Snapshots rot; the naming makes `<ID>-<stage>` vs `<template-name>` mechanically separable with no maintenance |
| Kit-root resolution in prose | Per-role re-resolution / repo hunting | Adapter-only resolution + STOP (D-11/D-12) | Re-implements the exact DOG-02 bug one layer up; an LLM cannot expand env vars in prose |
| A second validator | A `.mjs` byte-parity twin of the gate | The standalone POSIX gate (D-07) | The validator becomes two-root-aware in Phase 9 and can absorb the gate then |

**Key insight:** The rewrite's correctness is *semantic* (which home does this ref mean?), but the proof is *mechanical* (the gate). Don't conflate them — the gate cannot tell you a ref is *semantically* right, only that it is *not config* and *is a known template name*. Eyeballs + the gate together; the gate is the net for the 187-ref haystack.

## Runtime State Inventory

This is a rename/path-rewrite phase, so the inventory applies. Critically: this phase **only rewrites kit prose** — it does NOT install, migrate, or move any real runtime state. Phase 8 installs; MIGR-01 (v1.2) migrates. But the inventory below tells the planner what the rewritten prose now *points at*, and what must NOT be touched.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None** — grugops has no database, queue, or datastore (verified by CLAUDE.md "not a platform/runtime/database/queue" + repo has no DB files). The only "stored state" is markdown under `plans/` and `memory-bank/`, already repo-relative and unchanged this phase. | None |
| Live service config | **None** — grugops has no live services. The "config" being rewritten is `factory.config.json`, a static markdown-adjacent JSON file. After rewrite, prose points at `.grugops/factory.config.json`; the *file does not yet exist in the dev repo* (Phase 8 seeds it). This phase rewrites the *pointer*, not the file. | Code (prose) edit only; do NOT create `.grugops/` this phase (that is Phase 8 INSTALL-04). |
| OS-registered state | **None** — no Task Scheduler / launchd / systemd / pm2 registrations. grugops is invoked via the host coding-agent CLI. | None |
| Secrets/env vars | The only env var in scope is `GRUGOPS_HOME` (and the existing `GRUGOPS_PROD_DEPLOY_APPROVED` used by the SAFE-02 hook — **out of scope, do not touch**). `GRUGOPS_HOME` must appear ONLY in the adapter self-heal line; nowhere in prose (D-12). The installer's `GRUGOPS_SRC`/`TARGET`/`INSTALL_MODE`/`DRY_RUN` env vars are Phase-5/8 installer concerns, not rewritten here. | Prose edit only; verify no kit file names `$GRUGOPS_HOME` (proposed gate assertion 3). |
| Build artifacts / installed packages | **The standalone adapters are the "installed artifact."** Today they reference `agent-factory/…` repo-relative (the dogfood bug). This phase rewrites their *prose* to add the disambiguation preamble + self-heal/STOP. The installer-materialized absolute path is **written by Phase 8**, not this phase — so the adapter prose this phase ships must carry the self-heal fallback as the *only* resolver until Phase 8 materializes the primary absolute path. `scripts/fixtures/*` (validator GOOD/BAD trees) contain frozen *copies* of the kit — they must NOT be rewritten and MUST be excluded from the gate (they intentionally carry old/mutated refs). `agent-factory/examples/*` likewise frozen. | Adapter prose edit; gate excludes `scripts/fixtures/`, `agent-factory/examples/`. |

**The canonical question — after every kit file is rewritten, what still has the old string?**
- `scripts/fixtures/*` — frozen validator fixtures (intentional; exclude from gate).
- `agent-factory/examples/*` — frozen illustrative runs (intentional; exclude from gate).
- `install/*`, root `README.md`, `CLAUDE.md`, `docs/*` — legitimately *describe* `agent-factory/` (the install-target prose, the "start here" pointer). These are **out of the rewrite scope and out of the gate scope** (the gate proves the *kit + adapters + AGENTS.md* are clean, not the docs). Flag for the planner: decide whether `docs/` / `README.md` "start here" pointers should also be updated for consistency, or left as Phase-8 installer-doc work. **Recommendation:** leave docs/README to Phase 8 (they describe the install experience the installer creates); this phase's gate scope is kit + adapters + AGENTS.md per D-08.

## Enumerated Rewrite Set

**Live grep, 2026-06-06.** Total **187** `agent-factory/…` references across **43 in-scope files**. Counts verified by `grep -rn` over the exact file set; see *Sources*.

### Per-category totals (the working numbers — supersede the ~31/~137/50/32 estimates in upstream docs)

| Category | Live count | Disposition | Decision |
|----------|-----------|-------------|----------|
| `agent-factory/config/…` | **44** | Rewrite → `.grugops/factory.config.json` (preserve `#field`) | D-02 |
| `agent-factory/handoffs/…` | **51** | Split: template-read stays bare / instance-write → `plans/handoffs/<ID>-<stage>.md` | D-03/D-05 |
| `agent-factory/roles/…` | **39** | Stay bare (kit-to-kit) | D-01 |
| `agent-factory/checklists/…` | **30** | Stay bare (kit-to-kit) | D-01 |
| `agent-factory/_commit-convention.md` | **14** | Stay bare (kit-to-kit) | D-01 |
| `agent-factory/workflows/…` | **13** | Stay bare (kit-to-kit) | D-01 |
| **Total** | **187** | | |

Stay-bare (Buckets C+D): ~96 + the template-read subset of handoffs. Rewrite (Buckets A+B): 44 config + the instance-write subset of the 51 handoffs (~32 write-side, ~19 dir-only collective, the remainder template reads).

### The handoff ref split, by spelling (the high-risk detail)

| Handoff ref shape | Count | Means | Rewrite |
|-------------------|-------|-------|---------|
| `agent-factory/handoffs/<template>.md` in an **Output / "writes"** context | ~13 | role/workflow WRITES this packet | Bucket B: read template (bare) + write instance `plans/handoffs/<ID>-<stage>.md` |
| `agent-factory/handoffs/<template>.md` in an **Inputs / "reads"** context | ~6 | role READS an upstream packet | **Under D-05, upstream packets are now ticket-scoped instances** → these read refs become `plans/handoffs/<ID>-<stage>.md` (D-06), NOT the template. The template is read only to *fill* a new one. |
| `agent-factory/handoffs/` **dir-only** (collective) | **19** | "the open handoffs", "Under `agent-factory/handoffs/`:" headers | Bucket B: these describe runtime instances → `plans/handoffs/` |
| `agent-factory/handoffs/` as the **template dir** | (subset of the 19) | "read the X template from …" | stays bare |

> The 19 dir-only refs are the crux. Most are the **"Handoffs produced"** section header in every workflow (`Under `agent-factory/handoffs/`: …`) and the **"open handoffs"** input lines in `09-daily-sweep.md`, `orchestrator.md`, `release-manager.md`, `12-release.md`. After D-04/D-05 these describe **runtime instances**, so they point at `plans/handoffs/`. The planner must convert each by meaning, not by lexical replace.

### File-by-file rewrite set (43 files), with ref types carried

`C`=config, `Hw`=handoff write/produced, `Hr`=handoff read (now instance, D-06), `Hd`=handoff dir-only, `K`=kit-to-kit (stay bare), `P`=preamble target.

**Adapters (3 files) — Bucket A + Bucket E (preamble + self-heal/STOP land here):**
| File | Refs | Types | Notes |
|------|------|-------|-------|
| `.claude/agents/grugops-orchestrator.md` | 3 | C, K, P | Config→`.grugops/`; add compressed invariant preamble + sole-resolver self-heal/STOP (D-09/D-11). Currently: reads `agent-factory/config/factory.config.json`, `orchestrator.md`, `_role-switch-protocol.md`. |
| `.claude/skills/grugops/SKILL.md` | 4 | C, K, P | Config→`.grugops/`; add compressed invariant + self-heal/STOP. The other 6 dash-skills + 7 plugin colon-skills share the same 1-line config ref. |
| `.claude/skills/grugops-{map,plan,ticket,gate,uat,release}/SKILL.md` | 2–4 each | C, K | Each carries the `agent-factory/config/factory.config.json, root AGENTS.md, plans/board.md` line → config→`.grugops/`. (grugops-map/plan carry 4; ticket/gate/uat 3; release 2.) |

> **Scope note:** the live grep counted the **standalone `.claude/` adapters** (7 dash-skills + 1 subagent). The **plugin form** (`skills/grugops*/SKILL.md` at repo root, the colon-form) reuses the same pointer text verbatim (STATE.md 05-03). Confirm whether the plugin skills exist at repo-root `skills/` this phase — if present they carry the identical config ref and must be in the rewrite set + gate scope. **Open question O1 below.**

**Roles (18 files) — Bucket A (config) + Bucket B/C (handoffs) + Bucket D (stay bare):**
| File | Refs | Types |
|------|------|-------|
| `agent-factory/roles/orchestrator.md` | 7 | C×2 (incl. `#wip_limits`), Hd ("open handoffs"), K (roles dir, `_role-switch-protocol.md`), **P** (compressed invariant preamble lands here, D-09) |
| `agent-factory/roles/_role-switch-protocol.md` | 2 | **Hw step-4** (the once-here template-read-vs-instance-write split, D-06), K | 
| `agent-factory/roles/ba-pm.md` | 3 | C, Hw (`product-handoff`) |
| `agent-factory/roles/system-analyst.md` | 3 | C, Hr (`product-handoff` read), Hw (`system-handoff`) |
| `agent-factory/roles/architect-design.md` | 3 | C, Hr (`system-handoff`), Hw (`architecture-handoff`) |
| `agent-factory/roles/software-engineer.md` | 3 | C, Hr (`implementation-ready-packet`), Hw (`implementation-handoff`) |
| `agent-factory/roles/qe-e2e.md` | 3 | C, Hr (`implementation-handoff`), Hw (`qe-handoff`) |
| `agent-factory/roles/security-nfr.md` | 5 | C, Hr (`qe-handoff`), Hw (`security-nfr-handoff`), K (checklist) |
| `agent-factory/roles/uat-planner.md` | 5 | C, Hr (`security-nfr-handoff`), Hw (`uat-handoff`), K (checklist) |
| `agent-factory/roles/release-manager.md` | 5 | C, Hd ("the … handoffs in …"), Hw (`release-handoff`) |
| `agent-factory/roles/compliance-officer.md` | 3 | C, Hr+Hw (`security-nfr-handoff` append), K (checklist) |
| `agent-factory/roles/incident-responder.md` | 2 | C, Hw (`incident-postmortem`) |
| `agent-factory/roles/factory-coach.md` | 3 | C, Hw (`retro-notes`) |
| `agent-factory/roles/agents-md-scribe.md` | 1 | C |
| `agent-factory/roles/brownfield-mapper.md` | 1 | C |
| `agent-factory/roles/greenfield-mapper.md` | 1 | C |
| `agent-factory/roles/installer.md` | 1 | C |

**Workflows (14 files) — Bucket A + Bucket B (Hw/Hd "Handoffs produced") + Bucket D (stay bare):**
| File | Refs | Types |
|------|------|-------|
| `00-bootstrap-greenfield.md` | 9 | C×3, Hw×2 (`product`/`system`/`architecture`), Hd ("Under …:"), K (`_commit-convention`) |
| `01-bootstrap-brownfield.md` | 6 | C×2, Hw (`security-nfr-handoff`), Hd, K |
| `02-idea-to-epics.md` | 5 | C, Hw (`product-handoff`), Hd, K |
| `03-epic-to-tickets.md` | 7 | C, Hw (`system-handoff`), Hd, K |
| `04-ticket-to-pr.md` | 7 | C, **Hd "Handoffs produced" (D-06 — now ticket-scoped instances)**, K (checklist, `05-pr-quality-gate`, `_role-switch-protocol`, `_commit-convention`) |
| `05-pr-quality-gate.md` | 7 | C (`#quality`), Hr (`implementation-handoff`), Hd, K (workflow self, `_commit-convention`) |
| `06-uat-pack.md` | 5 | Hw (`uat-handoff`), Hd, K (checklist, `_commit-convention`) |
| `07-backlog-refinement.md` | 6 | C, Hw (`refinement-notes`), Hd, K (checklist, `_commit-convention`) |
| `08-sprint-planning.md` | 6 | C, Hd (`sprint-plan` optional), K (`_commit-convention`) |
| `09-daily-sweep.md` | 5 | C, Hd×2 ("open handoffs"), K (`_commit-convention`) |
| `10-sprint-review.md` | 2 | K (`_commit-convention`) — no config/handoff |
| `11-retro.md` | 5 | C, Hw (`retro-notes`), Hd, K (`_commit-convention`) |
| `12-release.md` | 8 | C, Hd ("the … handoffs in …"), Hw (`release-handoff`), K (`_commit-convention`) |
| `13-incident.md` | 6 | C, Hw (`incident-postmortem`), Hd, K (`_commit-convention`) |

**Packaging templates (3 files) — Bucket A; also reviewed for preamble propagation:**
| File | Refs | Types |
|------|------|-------|
| `agent-factory/packaging/slash-command.template.md` | 6 | C, K (these templates are the *source* the adapters were generated from — keep them consistent with the rewritten adapters) |
| `agent-factory/packaging/subagent.frontmatter.md` | 4 | C, K |
| `agent-factory/packaging/adapters.md` | 4 | K (the 5-tool map; references roles/workflows — stay bare) |

**AGENTS.md (1 file) — Bucket A + Bucket E (canonical rule):**
| File | Refs | Types |
|------|------|-------|
| `AGENTS.md` | 11 | C×2 (line 13 "the dial", line 66 "Cadence + WIP"), Hd (line 23 "Handoffs: `agent-factory/handoffs/`"), K (roles/workflows/checklists pointers, DoR/DoD), **P** (the canonical kit-vs-state rule lands here, D-09/D-10) |

## Handoff Template Allowlist (exhaustive — THE gate's assertion-2 set)

`ls agent-factory/handoffs/` returns exactly **16 files** `[VERIFIED: ls]`. This IS the D-08 allowlist. Verbatim filenames:

```
architecture-handoff.md
business-handoff.md
implementation-handoff.md
implementation-ready-packet.md
incident-postmortem.md
product-handoff.md
qe-handoff.md
refinement-notes.md
release-handoff.md
retro-notes.md
security-nfr-handoff.md
sprint-plan.md
system-handoff.md
ticket-ready-packet.md
uat-handoff.md
universal-handoff.md
```

Basenames (sans `.md`) for an ERE alternation:
`architecture-handoff|business-handoff|implementation-handoff|implementation-ready-packet|incident-postmortem|product-handoff|qe-handoff|refinement-notes|release-handoff|retro-notes|security-nfr-handoff|sprint-plan|system-handoff|ticket-ready-packet|uat-handoff|universal-handoff`

> **Note:** `business-handoff.md` and `universal-handoff.md` exist as templates but are **not currently referenced** in any role/workflow prose (universal-handoff is the inlined header; business-handoff is unused in v1.0 prose). They still belong in the allowlist — the gate allowlists template *names*, and a future ref to either must pass.

### Template READ-vs-WRITTEN map (which role/workflow touches each)

| Template | Read by (input) | Written/produced by | Proposed `<stage>` token | Instance ID scope (D-05) |
|----------|-----------------|---------------------|--------------------------|--------------------------|
| `universal-handoff` | (header, inlined everywhere) | — | — | — |
| `business-handoff` | — (unused in v1.0 prose) | — | `business` | TICKET-ID |
| `product-handoff` | system-analyst | ba-pm (00/02 bootstrap, idea-to-epics) | `product` | TICKET-ID |
| `system-handoff` | architect-design | system-analyst (00 bootstrap, 03 epic-to-tickets) | `system` | TICKET-ID |
| `architecture-handoff` | — | architect-design (00 bootstrap, 05 gate re-run) | `architecture` | TICKET-ID |
| `implementation-ready-packet` | software-engineer | (Orchestrator assembles) | `impl-ready` | TICKET-ID |
| `implementation-handoff` | qe-e2e | software-engineer (04 ticket-to-pr, 05 gate) | `implementation` | TICKET-ID |
| `qe-handoff` | security-nfr | qe-e2e (04/05) | `qe` | TICKET-ID |
| `security-nfr-handoff` | uat-planner, compliance-officer | security-nfr (01 brownfield, 04/05); compliance appends | `security-nfr` | TICKET-ID |
| `uat-handoff` | — | uat-planner (06 uat-pack) | `uat` | TICKET-ID |
| `ticket-ready-packet` | (DoR gate) | ba-pm / orchestrator | `ticket-ready` | TICKET-ID |
| `release-handoff` | — | release-manager (12 release) | `release` | **REL-** |
| `incident-postmortem` | — | incident-responder (13 incident) | `postmortem` | **INC-** |
| `retro-notes` | — | factory-coach (11 retro) | `retro` | **sprint ID** |
| `refinement-notes` | — | ba-pm (07 refinement) | `refinement` | **sprint ID** |
| `sprint-plan` | — | (08 sprint-planning, optional) | `sprint-plan` | **sprint ID** |

**Proposed instance-filename convention (Claude's discretion, D-05):** `plans/handoffs/<WORK-ITEM-ID>-<stage>.md`. Examples: `plans/handoffs/ABC-001-implementation.md`, `plans/handoffs/ABC-001-qe.md`, `plans/handoffs/REL-0007-release.md`, `plans/handoffs/INC-0003-postmortem.md`, `plans/handoffs/SPRINT-04-retro.md`. The `<stage>` token is the template basename with the `-handoff` suffix dropped where it adds no information (`implementation-handoff.md` → stage `implementation`); the planner may keep `-handoff` verbatim if it prefers a 1:1 lexical tie to the template name (lower cognitive load; either is gate-clean since the gate keys on the `agent-factory/handoffs/` prefix, not on the instance name).

## Adapter Preamble + Sole-Resolver Landing Sites

**Exact files (D-09 preamble + D-11 sole resolver):**
1. `.claude/agents/grugops-orchestrator.md` — the subagent wrapper (CC-native spawn path). Lines 7–14 today; the compressed invariant + self-heal/STOP prepend here.
2. `.claude/skills/grugops/SKILL.md` — the primary `/grugops` dispatcher skill. Lines 12–20 today; same preamble.

**Where the logic lands (within each adapter), per D-11:**
```
[1] PRIMARY: <installer-materialized absolute kit path>   ← written by Phase 8, NOT this phase
[2] SELF-HEAL (only if [1] absent): the one-line bash  ${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory/…
[3] STOP (if both fail): print the named missing path + "run install.sh" / "install.sh --check"
```
This phase ships **[2] and [3]** as adapter prose (the only resolver until Phase 8 materializes [1]). The adapter is the ONLY file that may contain the literal `${GRUGOPS_HOME:-$HOME/.grugops}` string (D-12). The other 6 dash-skills + the plugin colon-skills carry the **compressed invariant only** (they dispatch through the orchestrator, which holds the resolver) — confirm in planning whether each needs the self-heal or just the invariant + a pointer to the orchestrator adapter. **Recommendation:** put the full resolver in `.claude/skills/grugops/SKILL.md` + `.claude/agents/grugops-orchestrator.md` only; the 6 operation skills carry the 1-line invariant and defer resolution to the orchestrator (single-source the bash, matching D-11's "sole resolver").

**POSIX `sh` ↔ Node stdlib parity (SHOME-01 convention, frozen here, implemented Phase 8):**
- sh: `${GRUGOPS_HOME:-"$HOME/.grugops"}` — **colon-form** so an empty-string env var also falls back (matches rustup/nvm). `[CITED: .planning/research/SUMMARY.md]`
- Node: `process.env.GRUGOPS_HOME && process.env.GRUGOPS_HOME.trim() ? resolve(process.env.GRUGOPS_HOME) : resolve(os.homedir(), ".grugops")` — `os.homedir()` matches Git Bash `$HOME` on Windows. `[CITED: .planning/research/SUMMARY.md]`
- **This phase only freezes the *spelling* in the adapter self-heal line.** The Node side is a Phase-8 installer concern (the adapter is the standalone-form resolver; the plugin form uses `${CLAUDE_PLUGIN_ROOT}`, deferred). No Node code ships this phase. The parity note exists so the adapter's bash self-heal spelling is the one Phase 8's Node installer will mirror byte-for-byte. `[ASSUMED]` that no `.mjs` adapter exists this phase — verify in planning (O1).

## Build-Gate Design (`scripts/check-kit-refs.sh`)

**House style (mirror `install/install.sh` + `.planning/phases/05-…/check-structure.sh`):** `#!/usr/bin/env sh`, `set -eu`, `printf` not `echo -e`, `pass()`/`fail()` helpers incrementing a `FAILS` counter, `exit 0` all-pass / `exit 1` any-fail. POSIX-portable `grep` flags only (host grep is ugrep — do NOT rely on GNU/ugrep extensions; Pitfall 4).

### Scope: what the gate scans vs excludes (critical for zero false-positives)

**SCAN (the D-08 "shipped kit + adapters + AGENTS.md"):**
- `agent-factory/roles/` `agent-factory/workflows/` `agent-factory/checklists/` `agent-factory/packaging/` `agent-factory/_commit-convention.md`
- `.claude/skills/` `.claude/agents/grugops-orchestrator.md`
- repo-root `skills/` (plugin colon-form) **if present** — O1
- `AGENTS.md`

**EXCLUDE (carry `agent-factory/` legitimately — false-positive sources):**
- `scripts/fixtures/**` — frozen validator GOOD/BAD trees (intentional old/mutated refs) `[VERIFIED: grep found ~120 refs here]`
- `agent-factory/examples/**` — frozen illustrative runs
- `agent-factory/README.md`, `agent-factory/VERSION` — kit's own docs
- `install/**` — installer scripts that *create* `agent-factory/` paths
- root `README.md`, `CLAUDE.md`, `docs/**` — describe the install experience
- `.planning/**` — planning docs (incl. this RESEARCH.md and the phase `check-structure.sh` files)
- the gate script **itself** (`scripts/check-kit-refs.sh`) — it contains `agent-factory/config/` and template names as string literals

### The three assertions

**Assertion 1 (D-08.1) — ZERO `agent-factory/config/` refs in scope:**
```sh
hits=$(grep -rn 'agent-factory/config/' $SCAN_PATHS 2>/dev/null || true)
[ -z "$hits" ] && pass "no agent-factory/config/ refs remain (config fully migrated to .grugops/)" \
                || fail "stray agent-factory/config/ ref(s):\n$hits"
```
Today this finds **44** hits → after Bucket A it must be **0**.

**Assertion 2 (D-08.2) — every surviving `agent-factory/handoffs/` ref is a known template:**
```sh
# every handoffs ref line, minus the allowlisted-template lines and the dir-only template-read lines, must be empty
ALLOW='agent-factory/handoffs/(architecture-handoff|business-handoff|implementation-handoff|implementation-ready-packet|incident-postmortem|product-handoff|qe-handoff|refinement-notes|release-handoff|retro-notes|security-nfr-handoff|sprint-plan|system-handoff|ticket-ready-packet|uat-handoff|universal-handoff)\.md'
stray=$(grep -rn 'agent-factory/handoffs/' $SCAN_PATHS 2>/dev/null \
        | grep -Ev "$ALLOW" \
        | grep -Ev 'agent-factory/handoffs/`'  `# permit the bare template-dir ref` \
        || true)
[ -z "$stray" ] && pass "every agent-factory/handoffs/ ref is a known template or the template dir" \
                 || fail "non-template handoffs ref (leaked instance?):\n$stray"
```
A leaked instance write into the kit (`agent-factory/handoffs/ABC-001-implementation.md`) FAILS — it is neither an allowlisted template name nor the bare dir. **Verified the alternation correctly matches `uat-handoff.md` and rejects `ABC-001-impl.md`** `[VERIFIED: piped test]`.

> **Design subtlety on the dir-only permit:** the second `grep -Ev 'agent-factory/handoffs/`'` line permits the bare *template-dir* reference (e.g. "read the template from `agent-factory/handoffs/`"). After the rewrite, the *collective runtime* dir-only refs (the 19) should have become `plans/handoffs/`; only genuine template-dir reads should remain bare. If the planner removes ALL dir-only kit refs (preferring explicit per-template names), drop this permit line and the gate gets stricter. **Recommendation:** keep dir-only kit refs to a minimum; whatever survives, the gate permits the exact `agent-factory/handoffs/` token with no trailing instance-shaped name.

**Assertion 3 (proposed, SHOME-04 enforcement) — no kit/adapter prose names `$GRUGOPS_HOME` except the adapter self-heal:**
```sh
# $GRUGOPS_HOME may appear ONLY in the two resolver adapters; nowhere in kit prose / AGENTS.md
bad=$(grep -rln 'GRUGOPS_HOME' agent-factory AGENTS.md 2>/dev/null || true)
[ -z "$bad" ] && pass "no kit file / AGENTS.md names \$GRUGOPS_HOME" \
              || fail "kit prose names \$GRUGOPS_HOME (must live only in the adapter self-heal):\n$bad"
```
This mechanically enforces D-12 / SC4's "no role/workflow/SKILL/AGENTS.md ever names `$GRUGOPS_HOME`." Not strictly required by D-08 (which lists two assertions) but directly proves SC4 and is cheap. **Flag for the planner:** include as a third assertion or keep the gate to the two D-08 assertions and prove SC4 by manual grep in VALIDATION.md. **Recommendation:** include it — it is the cheapest mechanical net for the cross-cutting anti-pattern.

### False-positive / false-negative risks of a naive `grep -rn 'agent-factory/'`

| Risk | Cause | How the design closes it |
|------|-------|--------------------------|
| **False positive** | `scripts/fixtures/`, `examples/`, `install/`, `docs/`, `README.md`, `CLAUDE.md`, `.planning/` all carry `agent-factory/` legitimately | Explicit SCAN allowlist (not a repo-wide grep); exclude list above |
| **False positive** | the gate script's own string literals | exclude the gate file from its own scan |
| **False negative** | a config ref written with a typo'd path (`agent-factory//config`) | Assertion 1 uses the exact `agent-factory/config/` substring; a typo'd variant would be a different bug caught by the broader SC1 grep-to-zero check in VALIDATION |
| **False negative** | an instance write that *looks* like a template (e.g. someone names an instance `agent-factory/handoffs/release-handoff.md` in the kit) | Acceptable residual: the gate cannot distinguish a wrongly-placed write that reuses a template name. D-05's ticket-scoping makes real instances `<ID>-<stage>`, so this only fails open for a hand-typed exact-template-name write into the kit — a manual-review catch, noted in VALIDATION |
| **False positive (SC1 raw grep)** | SC5 literally says `grep -rn 'agent-factory/'` returns "ZERO bare refs" — but ~96 kit-to-kit refs are *intended* to survive bare | **Important interpretation:** SC5's "zero bare refs" means zero *misclassified* refs (config that should be `.grugops/`, instance-writes that should be `plans/handoffs/`). It does NOT mean zero `agent-factory/` strings — D-01 keeps ~96 of them. The gate proves the *misclassified* set is empty (Assertions 1+2), which is the correct reading per D-08. The planner must NOT implement SC5 as a literal `grep -c 'agent-factory/' == 0` — that contradicts D-01. |

> **This last row is the single most important guard in the phase.** A planner reading SC5 literally would try to eliminate all `agent-factory/` strings and break D-01. The gate's job is "zero *stray* refs," operationalized as Assertions 1+2.

## Sequencing & Blast-Radius Hazards

**Forced order within the phase:**
1. **Freeze the convention first** — write the AGENTS.md canonical rule (D-09/D-10) and the compressed invariant wording. Everything downstream cross-links it; the orchestrator + adapter preambles must quote it *consistently* (same words), so author the canonical text before the restatements. **Hazard:** if the preamble wording drifts from AGENTS.md, SC2 ("stated in AGENTS.md and the preamble") is technically met but the invariant reads inconsistently — keep the compressed line byte-identical across the three sites.
2. **Rewrite the buckets** — config (A), handoffs (B/C), preambles (E). Kit-to-kit (D) needs no edit. **Hazard:** the `_role-switch-protocol.md` step-4 edit happens **exactly once** here (the `quick-harden-role-switch-autocommit` branch is already merged to main per ROADMAP line 204 + STATE.md quick-task `260606-0my` `[VERIFIED: STATE.md]`). Do not re-apply or assume an un-merged branch.
3. **`04-ticket-to-pr.md` read-ref update (D-06)** — its "Handoffs produced" header and the role-input read refs must point at ticket-scoped instances, not generic template names. **Hazard:** this is the one workflow whose *read* side changes (most workflows only *produce*); easy to miss the read side.
4. **Land the gate last** — `scripts/check-kit-refs.sh` ships GREEN only after the rewrite. **Hazard:** if authored first it ships RED (44 config hits) and blocks. Author it, then run it as the phase acceptance gate. (The Phase-3/4/5 precedent ships harnesses RED deliberately, but that pattern is for *missing artifacts*; here the gate proves a *completed rewrite*, so it should be green when committed at phase end.)

**Cross-cutting hazards:**
- **The 19 dir-only handoff refs** are the highest-miss-rate targets (semantic, not lexical). Each "Handoffs produced" section in 14 workflows + the "open handoffs" lines need per-instance judgment.
- **Plugin colon-skills** (repo-root `skills/`) may duplicate every adapter config ref — if they exist this phase, they are in scope; if not, note the seam. O1.
- **Packaging templates** (`slash-command.template.md`, `subagent.frontmatter.md`) are the *source* the adapters were generated from — rewrite them consistently or the next `install.sh` run regenerates stale adapters. (Phase 8 reads these.)
- **Don't pre-empt Phase 8/9:** do NOT create `.grugops/`, do NOT write a resolver beyond the adapter self-heal line, do NOT touch `validate-agent-factory.mjs`.

## Common Pitfalls

### Pitfall 1: Reading SC5 as literal "zero `agent-factory/` strings"
**What goes wrong:** Planner tries to eliminate all 187 refs, breaking D-01's ~96 intended bare kit-to-kit refs.
**Why:** SC5 says `grep -rn 'agent-factory/'` "returns ZERO bare refs" — ambiguous wording.
**How to avoid:** Operationalize SC5 as D-08's two assertions (zero *config* refs + every *handoff* ref is a template). Bare roles/workflows/checklists refs are correct and stay.
**Warning sign:** A plan task that says "remove all agent-factory/ references."

### Pitfall 2: Lexical find-replace on `agent-factory/handoffs/`
**What goes wrong:** Template reads and collective dir refs get relocated into `plans/handoffs/`, breaking template resolution.
**Why:** The same directory name maps to two homes (template KIT vs instance STATE).
**How to avoid:** Per-ref semantic judgment (Bucket B vs C); use the READ-vs-WRITTEN map above.
**Warning sign:** A `sed` task over handoff refs.

### Pitfall 3: `$GRUGOPS_HOME` leaking into prose
**What goes wrong:** An LLM reads `$GRUGOPS_HOME/agent-factory/roles/x.md` as a literal dead string and hunts/hallucinates — the DOG-02 bug one layer up.
**Why:** Agents don't expand env vars in prose; only `${CLAUDE_PLUGIN_ROOT}` is CC-substituted in skill/agent *content*. `[CITED: .planning/research/SUMMARY.md; code.claude.com/docs/en/plugins-reference]`
**How to avoid:** `$GRUGOPS_HOME` appears ONLY in the adapter self-heal bash line. Proposed Assertion 3 enforces this.
**Warning sign:** Any kit/AGENTS.md file containing `GRUGOPS_HOME`.

### Pitfall 4: Gate depends on non-POSIX grep behavior
**What goes wrong:** Gate passes on the dev machine (ugrep 7.5.0) but behaves differently in CI (BusyBox/GNU grep), or vice versa.
**Why:** Host grep is ugrep aliased to `grep` `[VERIFIED: grep --version]`; `-P`, `-z`, recursive-default semantics differ across implementations.
**How to avoid:** Use only `-r -n -l -E -F -q -v -o`; quote ERE patterns; test the alternation with a literal `printf | grep -E` (done above). Mirror `install/install.sh`'s `grep -qF` discipline.
**Warning sign:** `grep -P`, `grep --include` without testing, or relying on `grep -r` default include/exclude globs.

### Pitfall 5: Forgetting `scripts/fixtures/` in the exclude list
**What goes wrong:** Gate reports ~120 false "stray config refs" from the validator's frozen BAD/GOOD fixture trees.
**Why:** Fixtures are complete kit copies under `scripts/fixtures/*/agent-factory/…` `[VERIFIED: grep -rln]`.
**How to avoid:** Explicit SCAN allowlist, never a repo-wide grep. Exclude `scripts/fixtures/`, `examples/`, `install/`, `docs/`, root README/CLAUDE.md, `.planning/`, and the gate file itself.
**Warning sign:** Gate first-run reports >50 failures.

## Code Examples

### The gate's two D-08 assertions (POSIX, mirroring install.sh idiom)
```sh
# Source: synthesized from install/install.sh + .planning/phases/05-…/check-structure.sh house style [VERIFIED: read both]
#!/usr/bin/env sh
set -eu
SCAN="agent-factory/roles agent-factory/workflows agent-factory/checklists agent-factory/packaging agent-factory/_commit-convention.md .claude/skills .claude/agents/grugops-orchestrator.md AGENTS.md"
FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS+1)); }

# Assertion 1: zero agent-factory/config/ refs
if grep -rn 'agent-factory/config/' $SCAN >/dev/null 2>&1; then
  fail "stray agent-factory/config/ refs (config must be .grugops/factory.config.json)"
else
  pass "no agent-factory/config/ refs remain"
fi

# Assertion 2: every agent-factory/handoffs/ ref is a known template or the bare template dir
ALLOW='agent-factory/handoffs/(architecture-handoff|business-handoff|implementation-handoff|implementation-ready-packet|incident-postmortem|product-handoff|qe-handoff|refinement-notes|release-handoff|retro-notes|security-nfr-handoff|sprint-plan|system-handoff|ticket-ready-packet|uat-handoff|universal-handoff)\.md'
stray=$(grep -rn 'agent-factory/handoffs/' $SCAN 2>/dev/null | grep -Ev "$ALLOW" | grep -Ev 'agent-factory/handoffs/`' || true)
[ -z "$stray" ] && pass "every agent-factory/handoffs/ ref is a known template" \
                 || fail "non-template handoffs ref:
$stray"

[ "$FAILS" -eq 0 ] && { printf 'ALL CHECKS PASSED\n'; exit 0; } || { printf '%s CHECK(S) FAILED\n' "$FAILS"; exit 1; }
```

### The adapter self-heal + STOP (prose this phase ships; Phase 8 prepends the absolute path)
```text
# Source: synthesized from D-11/D-12 [LOCKED CONTEXT.md]; spelling per .planning/research/SUMMARY.md [CITED]
Resolve the kit root:
  1. (installed) the absolute kit path the installer wrote above this line.
  2. if absent, self-heal:  KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"
  3. if "$KIT" still does not exist: STOP. Print: "grugops kit not found at <path>.
     Run install.sh (or install.sh --check) to install the kit." Do NOT hunt the repo.
```

## State of the Art

| Old Approach (v1.0) | Current Approach (v1.1) | When Changed | Impact |
|--------------------|------------------------|--------------|--------|
| Whole kit lives in-repo; `agent-factory/` is repo-relative | Kit at `${GRUGOPS_HOME:-$HOME/.grugops}`; refs resolve under KIT ROOT; state stays repo-relative | This milestone | The 187 refs must be classified KIT vs STATE |
| Config at `agent-factory/config/factory.config.json` | Per-repo `.grugops/factory.config.json` | D-02 / SHOME-02 | 44 refs rewrite |
| Handoffs written under `agent-factory/handoffs/` (generic names) | Templates KIT, instances `plans/handoffs/<ID>-<stage>.md` | D-03/D-05 | The split + ticket-scoping |
| Repo-root `factory.config.json` (older ARCHITECTURE.md rec) | `.grugops/factory.config.json` (SHOME-02) | STATE.md note | `.grugops/` is LOCKED; ARCHITECTURE.md superseded |

**Deprecated/outdated:**
- The "~31 files / ~137 refs / 50 handoff / 32 config" figures in CONTEXT.md and shared-install.md are estimates — **use the live counts: 43 files / 187 refs / 51 handoff / 44 config**. `[VERIFIED: grep 2026-06-06]`

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The plugin colon-form skills at repo-root `skills/` are NOT present in the current tree (only `.claude/skills/` standalone exist) — so they are not in the live count | Enumerated Rewrite Set; O1 | If they exist, the rewrite set + gate scope must add them (each carries the same config ref); undercount by ~7 files |
| A2 | No `.mjs` adapter exists this phase (Node parity is Phase-8-only) | Adapter Landing Sites | If an `.mjs` adapter exists, it also needs the self-heal/STOP and is in scope |
| A3 | `<stage>` token = template basename minus `-handoff` is acceptable; planner may keep `-handoff` verbatim | Allowlist map | Cosmetic; gate keys on the `agent-factory/handoffs/` prefix, not the instance name — no gate impact either way |
| A4 | `business-handoff.md` / `universal-handoff.md` belong in the allowlist despite no current prose ref | Allowlist | If excluded, a future legitimate ref to either would fail the gate |

## Open Questions

1. **O1 — Plugin colon-form skills in scope?**
   - What we know: STATE.md 05-03 shipped plugin skills at repo-root `skills/grugops*/SKILL.md` reusing the standalone pointer text verbatim. The live grep scanned `.claude/skills/` (8 files) but a `find` for repo-root `skills/` was not run.
   - What's unclear: whether repo-root `skills/` exists in the current tree and carries the config ref.
   - Recommendation: planner runs `ls skills/ .claude-plugin/` at plan time; if present, add the ~7 plugin skills to the rewrite set + gate SCAN. Each carries the identical 1-line config ref; treat as Bucket A.

2. **O2 — Should `docs/`, `README.md`, `CLAUDE.md` "start here" pointers be rewritten?**
   - What we know: they say "read `agent-factory/roles/orchestrator.md`" repo-relative — which, post-split, is the install-target prose the installer creates.
   - What's unclear: whether consistency now is worth the diff, or whether it is Phase-8 installer-doc work.
   - Recommendation: leave to Phase 8 (they describe the install experience). Keep this phase's gate scope to kit + adapters + AGENTS.md per D-08.

3. **O3 — Gate Assertion 3 (no `$GRUGOPS_HOME` in prose): include or defer to manual VALIDATION grep?**
   - Recommendation: include it — cheap, mechanical, directly proves SC4. Not required by D-08's literal two assertions, so flag for user/planner sign-off.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| POSIX `sh` | `scripts/check-kit-refs.sh` | ✓ | `/bin/sh` `[VERIFIED]` | — |
| `grep` | the gate + the rewrite audit | ✓ (ugrep 7.5.0 aliased) `[VERIFIED]` | use POSIX flags only | — |
| `git` | commit the rewrite (commit_docs=true) | ✓ (repo) | — | — |
| Node 18+ | NOT used this phase (D-07) | ✓ v24.12.0 `[VERIFIED]` | — | n/a |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none. This phase needs only `sh` + `grep` + an editor.

## Validation Architecture

> nyquist_validation is enabled (config.json `workflow.nyquist_validation: true` `[VERIFIED]`). This section is consumed to generate VALIDATION.md.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | POSIX shell assertion harness (no test runner; `pass()`/`fail()`/exit-code idiom) — matches `install/install.test.sh` + `.planning/phases/*/check-structure.sh` |
| Config file | none — `scripts/check-kit-refs.sh` is self-contained (Wave 0 creates it) |
| Quick run command | `sh scripts/check-kit-refs.sh` |
| Full suite command | `sh scripts/check-kit-refs.sh && node scripts/validate-agent-factory.mjs` (the existing validator still passes — no regression) |

### Phase Requirements → Test Map
| Req / SC | Behavior | Test Type | Automated Command | File Exists? |
|----------|----------|-----------|-------------------|--------------|
| SC1 / SHOME-03 (grep-to-zero) | Zero *misclassified* refs: no `agent-factory/config/` + every `agent-factory/handoffs/` ref is a known template | structural | `sh scripts/check-kit-refs.sh` (Assertions 1+2) | ❌ Wave 0 (gate is new) |
| SC2 / SHOME-04 (rule stated) | Canonical kit-vs-state rule present in AGENTS.md AND a compressed invariant in orchestrator + adapter preambles | structural | `grep -qF '<canonical-invariant-marker>' AGENTS.md .claude/skills/grugops/SKILL.md .claude/agents/grugops-orchestrator.md agent-factory/roles/orchestrator.md` | ❌ Wave 0 (add to gate) |
| SC3 / SHOME-02/03 (rewrite done) | 44 config refs → `.grugops/`; handoff writes → `plans/handoffs/`; `_role-switch-protocol.md` step-4 split present | structural | gate Assertion 1 (config=0) + `grep -q 'plans/handoffs/' agent-factory/roles/_role-switch-protocol.md` | ❌ Wave 0 |
| SC4 / SHOME-04 (no env-var in prose) | No role/workflow/SKILL/AGENTS.md names `$GRUGOPS_HOME` | structural | `! grep -rln 'GRUGOPS_HOME' agent-factory AGENTS.md` (proposed Assertion 3) | ❌ Wave 0 |
| SC5 / SHOME-03 (gate exists + green) | `scripts/check-kit-refs.sh` exists, is CI-runnable, exits 0 on the rewritten tree | structural | `sh scripts/check-kit-refs.sh; echo $?` (expect 0) | ❌ Wave 0 |
| No-regression | Existing `validate-agent-factory.mjs` still passes; existing `check-structure.sh` harnesses untouched | structural | `node scripts/validate-agent-factory.mjs` | ✅ exists |

### Sampling Rate
- **Per task commit:** `sh scripts/check-kit-refs.sh` (sub-second; run after each bucket).
- **Per wave merge:** the gate + `node scripts/validate-agent-factory.mjs` (no-regression).
- **Phase gate:** gate exits 0 AND validator exits 0 AND the SC2 invariant-marker grep passes, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/check-kit-refs.sh` — the build gate (Assertions 1+2, optional 3). Authored AFTER the rewrite so it ships GREEN. Covers SC1/SC3/SC5 (+SC4 if Assertion 3 included).
- [ ] A stable SC2 invariant-marker string (e.g. a unique phrase in the compressed invariant) so the grep check is deterministic across the three sites.
- [ ] No new test framework needed — POSIX harness idiom is established; reuse it.

## Security Domain

> security_enforcement is enabled (config.json `workflow.security_enforcement: true`, ASVS level 1 `[VERIFIED]`). This phase is markdown prose + one read-only POSIX script — the attack surface is minimal but two categories apply.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | grugops handles no auth |
| V3 Session Management | no | no sessions |
| V4 Access Control | no | no access control surface |
| V5 Input Validation | partial | The gate reads file contents only; it never `eval`s or executes matched strings. Keep it read-only (no `sed -i`, no writes). |
| V6 Cryptography | no | no crypto |
| V12 File / Resource | yes | The gate must be **read-only** (grep + test only); it must not delete/modify any file (mirrors install.sh `is_protected()` denylist spirit). The rewrite must not weaken the SAFE-02 prod-deploy guard or touch `GRUGOPS_PROD_DEPLOY_APPROVED`. |
| V14 Configuration | yes | Config moves to `.grugops/factory.config.json` — ensure the rewrite does not change *which* fields are read (mode/cadence/autonomy/wip_limits/quality/nfr/compliance_regime); only the *path root* changes. A path-root change that silently drops a `#field` anchor would change behavior. |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Dangling-ref reincarnation (C1) — a missed/misclassified ref reads the wrong root or hunts the repo | Tampering / DoS (agent hunts/hallucinates) | The build gate (Assertions 1+2); the adapter STOP-don't-hunt (D-11); proposed Assertion 3 |
| `$GRUGOPS_HOME` injection via prose | (info-leak / wrong-path) | No env var in prose (Assertion 3); adapter-only resolution |
| Gate becomes destructive (a future "fix" mode) | Tampering | Keep `scripts/check-kit-refs.sh` strictly read-only this phase; any `--fix` is out of scope (Phase 9 doctor `--fix` is itself deferred to v2+) |
| Weakening the SAFE-02 guard while rewriting refs | Elevation (auto-deploy) | Do NOT touch `hooks/`, `GRUGOPS_PROD_DEPLOY_APPROVED`, or the prod-deploy guard; they are out of scope |

## Sources

### Primary (HIGH confidence)
- Live `grep -rn` / `ls` over the shipped tree, 2026-06-06 — all ref counts, the 16-template allowlist, the 19 dir-only refs, per-file ref types `[VERIFIED]`
- `.planning/phases/07-…/07-CONTEXT.md` — locked decisions D-01..D-12 `[VERIFIED: read]`
- `docs/design/shared-install.md` — kit-vs-state split, blast radius, rejected alternatives `[VERIFIED: read]`
- `.planning/REQUIREMENTS.md` §v1.1 — SHOME-01..04, scope of Phases 8/9, deferred MIGR-01 `[VERIFIED: read]`
- `.planning/ROADMAP.md` §Phase 7 — goal + 5 success criteria; merged-branch note `[VERIFIED: read]`
- `.planning/STATE.md` — `.grugops/` supersedes repo-root config; quick-task `260606-0my` (role-switch branch merged); C1/C3 gating blockers `[VERIFIED: read]`
- `install/install.sh`, `.planning/phases/05-…/check-structure.sh` — POSIX house style for the gate `[VERIFIED: read]`
- `AGENTS.md`, `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md`, `agent-factory/roles/_role-switch-protocol.md`, `agent-factory/workflows/04-ticket-to-pr.md` — exact landing-site contents `[VERIFIED: read]`
- `tool versions: sh, grep (ugrep 7.5.0), node v24.12.0` `[VERIFIED: command output]`

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY.md` — `${GRUGOPS_HOME:-"$HOME/.grugops"}` colon-form, Node `os.homedir()` parity, LLM-doesn't-expand-env-var finding `[CITED]`
- `code.claude.com/docs/en/plugins-reference` (via SUMMARY) — only `${CLAUDE_PLUGIN_ROOT}` is inline-substituted in skill/agent content `[CITED]`

### Tertiary (LOW confidence)
- none — every load-bearing claim is a live grep or a locked decision.

## Metadata

**Confidence breakdown:**
- Enumerated rewrite set / counts: HIGH — direct live grep over the exact file set.
- Handoff allowlist: HIGH — `ls` of the directory IS the allowlist.
- Gate design: HIGH — assertions tested against real strings; house style read from existing scripts.
- Adapter parity / plugin-skill scope: MEDIUM — A1/A2 assumptions flagged (O1).
- Convention spelling (sh↔Node): MEDIUM — cited from SUMMARY, implemented Phase 8 not here.

**Research date:** 2026-06-06
**Valid until:** stable until the kit tree changes — re-run the greps if any role/workflow/adapter is edited before planning (the counts are the contract).
