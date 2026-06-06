# Phase 7: Shared-Home Foundation & Path Rewrite - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Freeze the kit/state split convention and the single "one rule, two homes" resolution mechanism, then rewrite the ~31 role/workflow/adapter files so every reference resolves to the correct root — kit refs under the KIT ROOT (read-only), state refs repo-relative — and prove zero misclassified refs remain with a build gate. This is the linchpin: nothing downstream (Phase 8 installer, Phase 9 doctor/validator) resolves correctly until the final ref spelling is frozen here.

**In scope:** the convention/disambiguation rule (SHOME-01, SHOME-04), the ref rewrite across roles/workflows/adapters + AGENTS.md (SHOME-02, SHOME-03), the role-switch-protocol step-4 template-read-vs-instance-write split, and the grep-to-zero build gate (SHOME-03 / SC5).

**Out of scope (later phases):** the installer that materializes the absolute kit path (Phase 8), the `--check` doctor (Phase 9), the two-root validator rewrite (Phase 9), and migration of already-installed repos (MIGR-01, v1.2).

**Already locked upstream (carry forward, do NOT re-decide):**
- Kit home: `${GRUGOPS_HOME:-$HOME/.grugops}` — env-overridable, default `~/.grugops`, NOT XDG, NOT literal `~`, resolved identically by POSIX `sh` and Node stdlib (SHOME-01)
- Config moves to repo-relative `.grugops/factory.config.json` (SHOME-02)
- Handoff writes move to `plans/handoffs/` (SHOME-02/03)
- Kit-to-kit refs keep the `agent-factory/…` prefix, meaning "under KIT ROOT" (SHOME-03)
- One rule, two homes: installer-materialized absolute path (standalone) or `${CLAUDE_PLUGIN_ROOT}` (plugin) (SHOME-04)
- No role/workflow/SKILL/AGENTS.md names `$GRUGOPS_HOME`; only the adapter carries the one-line self-heal (SHOME-04)

</domain>

<decisions>
## Implementation Decisions

### Kit-ref spelling (SHOME-03)
- **D-01:** Roles/workflows/checklists/packaging refs stay **bare** `agent-factory/…` — the central disambiguation rule (D-08) resolves them to KIT ROOT. Minimal diff where the ref is unambiguous (these dirs are read-only kit, never written).
- **D-02:** Config refs (~48 today at `agent-factory/config/…`) are rewritten to repo-relative `.grugops/factory.config.json`. Roles read the per-repo instance, never the kit's default config.
- **D-03:** Handoff refs (~51 today, currently mixed read+write under `agent-factory/handoffs/`) are spelled with **explicit template-read vs instance-write phrasing** in prose — e.g. "read the `implementation-handoff.md` **template** from `agent-factory/handoffs/`" (KIT) vs "**write** to `plans/handoffs/<…>.md`" (STATE). Explicit only where ambiguity is real.

### Handoff instance naming (accepted scope addition)
- **D-04:** Handoff instances written to `plans/handoffs/` are **ticket-scoped**, not generic filenames. This is a deliberate behavioral addition on top of the path rewrite (the user chose it knowingly) — it converts `plans/handoffs/` into a durable per-work-item trail and removes the cross-ticket collision risk that generic filenames carry.
- **D-05:** Instances are **named by their owning work item**: `plans/handoffs/<WORK-ITEM-ID>-<stage>.md`. Delivery handoffs (implementation/qe/security-nfr) scope by **TICKET-ID**; the others scope by their natural ID — **REL-** for release, **INC-** for incident, the **sprint ID** for sprint-plan / retro / refinement. One rule: an instance is named by the work item that owns it. (Exact `<stage>` tokens are a planner detail, derived from the existing handoff template names.)
- **D-06:** This addition's blast radius is acknowledged: it touches role prose, the `_role-switch-protocol.md` step-4 write instruction, and `04-ticket-to-pr.md`'s handoff read refs (which must now read the ticket-scoped instance, not a generic filename).

### Build gate (SHOME-03 / SC5)
- **D-07:** The gate is a **standalone `scripts/check-kit-refs.sh`** (POSIX, matching the install.sh tooling), runnable in CI and locally. It is kept separate from `scripts/validate-agent-factory.mjs` because that validator becomes two-root-aware in Phase 9 (VAL-02); Phase 9 can later call or absorb this script. No `.mjs` byte-parity twin required (the parity contract is specifically an installer contract, not a build-gate one).
- **D-08 (gate logic):** Two mechanical assertions over the shipped kit + adapters + AGENTS.md:
  1. **Zero** `agent-factory/config/` refs (config fully migrated to `.grugops/`).
  2. Every surviving `agent-factory/handoffs/` ref **matches a known handoff template filename** (universal, business, product, system, architecture, implementation, qe, security-nfr, uat, ticket-ready-packet, implementation-ready-packet, release-handoff, incident-postmortem, retro-notes, refinement-notes, sprint-plan). A stray ticket-scoped write that leaked into the kit (`agent-factory/handoffs/<ID>-…`) FAILS because it is not a template name.
  - This leverages D-05's naming: writes (`<WORK-ITEM-ID>-<stage>`) are structurally distinct from template reads (`<template-name>`), so the gate can tell them apart mechanically without a golden snapshot to maintain.

### Disambiguation rule home (SHOME-04 / SC2)
- **D-09:** The full kit-vs-state rule is stated **canonically once in AGENTS.md**. A **compressed 1–2 line invariant** is restated in the **orchestrator preamble** AND the **adapter preamble** (the two entry points an agent can load without AGENTS.md), each cross-linking AGENTS.md. This honors SC2's literal "stated in AGENTS.md and the preamble," respects closest-file-wins, and keeps the canonical/expanded version single-sourced (only a tight invariant is duplicated, not the role text).
- **D-10:** The compressed invariant reads, in spirit: `agent-factory/` = KIT (read-only, from the kit root, never write); `plans/` `memory-bank/` `.grugops/` = STATE (read/write in THIS repo); `agent-factory/handoffs/` is the TEMPLATE read while `plans/handoffs/` is the runtime INSTANCE write; **STOP — do not hunt — if the resolved kit dir is absent.**

### Kit-absent behavior (SHOME-04 / SC2)
- **D-11:** **Adapter-only resolution.** The standalone adapter is the SOLE resolver of the kit root: the installer-materialized **absolute path is primary**; the one-line `${GRUGOPS_HOME:-$HOME/.grugops}` bash **self-heal runs ONLY when that path is absent** (covers a moved clone / stale install); if both fail, the adapter **STOPs**, printing the named missing path + remediation (`run install.sh` / `install.sh --check`).
- **D-12:** **Roles/workflows NEVER re-resolve.** On a failed kit read a role STOPs, naming the unresolved path, and never searches the repo for `agent-factory/…`. This keeps resolution logic in the one place bash runs and satisfies SHOME-04's "no role names `$GRUGOPS_HOME`."

### Claude's Discretion
- Exact `<stage>` token spelling for instance filenames (derive from existing handoff template names).
- Exact wording/format of the compressed invariant (D-10) and the STOP/remediation message (D-11), within the stated spirit.
- The precise list of files in the ~31-file rewrite set and the rewrite sequencing (planner/researcher to enumerate; the role-switch-protocol branch is already merged to main, so its step-4 edit happens once inside this phase).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & decision sources
- `docs/design/shared-install.md` — the canonical shared-install design: problem (3 dogfood pains), the kit-vs-state split table, the path-root convention, measured blast radius (50 handoff / 32 config / ~55 kit refs), installer/validator impact, and the explicitly-rejected alternatives. **The authoritative source for this milestone.**
- `.planning/REQUIREMENTS.md` § "Milestone v1.1 Requirements" — SHOME-01..04 (this phase), INSTALL-03..05 + VAL-02 (Phases 8–9), and the v1.2+ deferred items (MIGR-01, UPD-01, SKEW-01/FIX-01/PLUGIN-01).
- `.planning/ROADMAP.md` § "Phase 7" — goal + the 5 success criteria (including C1 grep-to-zero); also the Phase 8/9 goals this phase must not pre-empt.
- `.planning/research/SUMMARY.md` — v1.1 shared-install research synthesis referenced by the requirements.

### Files the rewrite touches (anchors)
- `agent-factory/roles/_role-switch-protocol.md` § step 4 — currently "write the role's handoff file under `agent-factory/handoffs/`"; becomes the template-read-vs-instance-write split (`plans/handoffs/<WORK-ITEM-ID>-<stage>.md`). The role-switch branch is already merged to main, so this edit happens once here.
- `AGENTS.md` — gains the canonical kit-vs-state disambiguation rule (D-09/D-10); currently has no such language.
- `agent-factory/roles/orchestrator.md` — gains the compressed invariant preamble; carries many of the config + handoff refs being rewritten.

### Reference for the gate's template allowlist
- `agent-factory/handoffs/` — the set of template filenames the gate (D-08) allowlists; enumerate from this directory.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/validate-agent-factory.mjs` — existing structure validator (Phase 6). The new gate stays separate (D-07) but Phase 9's two-root validator can later absorb/call `check-kit-refs.sh`.
- `agent-factory/workflows/check-structure.sh` — existing Phase-4 POSIX structural harness; the new `scripts/check-kit-refs.sh` mirrors its POSIX style and CI-runnable shape.
- `install/install.sh` — POSIX tooling/conventions the new gate script should match (the design notes `install.sh:36` defaults `TARGET=$(pwd)`, the root cause of dogfood pain #1).

### Established Patterns (measured 2026-06-06)
- Ref counts in the current single-root tree: `agent-factory/handoffs/` **51**, `agent-factory/config/` **48**, `agent-factory/roles/` **41**, `agent-factory/workflows/` **13**, `plans/handoffs/` **0**. (Design doc's blast-radius figures — 50/32 — are the rewrite-relevant subset; treat the live grep counts as the working numbers.)
- Handoffs today use **generic filenames** (`implementation-handoff.md`) referenced for BOTH the template read and the written instance — the exact ambiguity D-03/D-05 resolves.
- Config today is referenced as `agent-factory/config/factory.config.json#<field>` (e.g. `orchestrator.md` reads `mode`/`cadence`/`autonomy`/`wip_limits` first) — every such ref rewrites to `.grugops/factory.config.json#<field>`.

### Integration Points
- Adapters live at `.claude/skills/*` and `.claude/agents/grugops-orchestrator.md` — the adapter preamble (D-09) and the sole-resolver self-heal (D-11) land here.
- `agent-factory/workflows/04-ticket-to-pr.md` reads the implementation/qe/security handoffs — must be updated to read the ticket-scoped instance path (D-06).

</code_context>

<specifics>
## Specific Ideas

- The grep-to-zero "proof" is meant to be a real, repeatable gate (not a one-time manual grep) — it exists so the kit/state split "cannot silently regress" (echoing the Phase 9 goal). D-07/D-08 make it mechanical and snapshot-free.
- The user explicitly accepted the small scope expansion (ticket-scoped handoff instances, D-04) rather than the purely-surgical dir-only rename — prioritizing a durable per-work-item trail over minimal diff.

</specifics>

<deferred>
## Deferred Ideas

- **Parallel-ticket handoff support** — ticket-scoped instance naming (D-05) lays the groundwork (no cross-ticket collision), but full parallel-ticket workflow support is not this phase's concern. Note for a future phase if/when concurrent tickets are exercised.
- **Migration of already-installed repos** (in-repo `agent-factory/` + symlinks → `$GRUGOPS_HOME` + repo state) — explicitly **MIGR-01, deferred to v1.2**; never delete-first. Out of scope here.
- **Plugin-form kit resolution** (`${CLAUDE_PLUGIN_ROOT}`) — the "second home" of the one-rule-two-homes model; the convention is frozen here, but actually wiring/publishing the plugin form is **PLUGIN-01, v2+**.

</deferred>

---

*Phase: 7-Shared-Home Foundation & Path Rewrite*
*Context gathered: 2026-06-06*
