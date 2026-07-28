# Phase 7: Shared-Home Foundation & Path Rewrite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-06
**Phase:** 7-Shared-Home Foundation & Path Rewrite
**Areas discussed:** Kit-ref spelling, Build gate, Disambiguation rule home, Kit-absent behavior

---

## Kit-ref spelling

### Q1 — How should a kit reference be spelled in role/workflow prose?

| Option | Description | Selected |
|--------|-------------|----------|
| Bare prefix + targeted handoff qualifier | Roles/workflows/checklists stay bare; handoffs make read-vs-write explicit | ✓ |
| Bare prefix everywhere | Every surviving kit ref bare; central rule disambiguates all incl. handoffs | |
| Explicit marker on every kit ref | Each kit ref self-describing (`<KIT>/…`); trivial gate but largest diff | |

**User's choice:** Bare prefix + targeted handoff qualifier
**Notes:** Minimal diff where unambiguous; explicit only for the 51 handoff refs (same filename, two homes).

### Q2 — What filename does a handoff instance get when written to plans/handoffs/?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep generic filename, dir-only change | `plans/handoffs/implementation-handoff.md`; purely surgical | |
| Ticket-scoped instance names | `plans/handoffs/<TICKET-ID>-…`; durable trail; behavioral change beyond a path rewrite | ✓ |

**User's choice:** Ticket-scoped instance names
**Notes:** Accepted as a deliberate scope addition — durable per-work-item trail over minimal diff. Touches role prose, role-switch protocol step 4, and 04-ticket-to-pr read refs.

### Q3 — Exact naming pattern + how non-ticket handoffs are scoped?

| Option | Description | Selected |
|--------|-------------|----------|
| Scope by work-item ID | `plans/handoffs/<WORK-ITEM-ID>-<stage>.md`; TICKET / REL- / INC- / sprint ID | ✓ |
| Ticket-ID only; others stay generic | Only delivery handoffs prefixed; others keep generic names | |
| You decide | Capture principle; planner settles stage tokens | |

**User's choice:** Scope by work-item ID
**Notes:** One rule — an instance is named by the work item that owns it. Exact stage tokens left to the planner.

---

## Build gate

### Q1 — What does the build gate mechanically assert?

| Option | Description | Selected |
|--------|-------------|----------|
| Zero-config + template-allowlist | Zero `agent-factory/config/`; every surviving `agent-factory/handoffs/` ref must match a known template name | ✓ |
| Full allowlist snapshot | Diff all `agent-factory/` hits against a checked-in golden list | |
| Narrow must-be-zero only | `agent-factory/config/` == 0 + one-time human review of handoff refs | |

**User's choice:** Zero-config + template-allowlist
**Notes:** Leverages ticket-scoped naming — a stray write to the kit fails because it isn't a template name. No golden snapshot to maintain.

### Q2 — Where does the gate live and in what form?

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone script in scripts/ | New `scripts/check-kit-refs.sh` (POSIX), CI-runnable | ✓ |
| Fold into validate-agent-factory.mjs | Add to existing validator (which itself changes in Phase 9) | |
| Both sh + Node parity | Ship `.sh` + `.mjs` twin at byte-parity | |

**User's choice:** Standalone script in scripts/
**Notes:** Kept separate from the validator that becomes two-root-aware in Phase 9; Phase 9 can later call/absorb it. No parity twin (parity is an installer contract).

---

## Disambiguation rule home

### Q1 — Where does the kit-vs-state rule physically live?

| Option | Description | Selected |
|--------|-------------|----------|
| Canonical + compressed restatement | Full rule in AGENTS.md; compressed invariant in orchestrator + adapter preambles, cross-linking AGENTS.md | ✓ |
| Single-source in AGENTS.md + pointers | Full rule only in AGENTS.md; others just point to it | |
| Full restatement in all three | Complete rule verbatim in all three places | |

**User's choice:** Canonical + compressed restatement
**Notes:** Honors SC2's literal wording + closest-file-wins; only a tight invariant is duplicated, keeping role text single-sourced.

---

## Kit-absent behavior

### Q1 — Where does resolution happen + self-heal/STOP contract?

| Option | Description | Selected |
|--------|-------------|----------|
| Adapter-only resolution + role hard-STOP | Adapter sole resolver (materialized abs path → self-heal on failure → STOP); roles never re-resolve, hard-STOP naming the path | ✓ |
| Adapter resolves + roles carry fallback hint | Roles also carry a resolution fallback for direct loads | |

**User's choice:** Adapter-only resolution + role hard-STOP
**Notes:** Keeps resolution in the one place bash runs; satisfies SHOME-04's "no role names $GRUGOPS_HOME." Self-heal runs only when the materialized path is absent.

---

## Claude's Discretion

- Exact `<stage>` token spelling for instance filenames (derive from existing handoff template names).
- Exact wording of the compressed invariant and the STOP/remediation message.
- Precise file list + sequencing of the ~31-file rewrite (planner/researcher to enumerate).

## Deferred Ideas

- Parallel-ticket handoff support — ticket-scoped naming lays the groundwork; full support is a future phase.
- Migration of already-installed repos — MIGR-01, deferred to v1.2 (never delete-first).
- Plugin-form kit resolution (`${CLAUDE_PLUGIN_ROOT}`) — convention frozen here; wiring/publishing is PLUGIN-01, v2+.
