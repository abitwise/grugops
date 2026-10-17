# Phase 34: Model Effort Dial & Pi Support - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-06
**Phase:** 34-model-effort-dial-pi-support
**Areas discussed:** Effort shape, Model×effort compatibility, Pi footprint, Windows gate, Host-tool registry

Format: a concrete proposal was presented in prose first (user preference), then confirmed with one
AskUserQuestion round and one plain-text follow-up. Before the proposal, two primary sources were checked:
code.claude.com/docs/en/sub-agents (`effort` field exists: low/medium/high/xhigh/max, default inherit) and
pi.dev (reads AGENTS.md, has `/name` prompt templates and skills, no sub-agents).

---

## Effort shape

| Option | Description | Selected |
|--------|-------------|----------|
| As proposed | `models.effort.{preset,roles}`; values inherit/low/medium/high/xhigh/max; effort `tiered` = judgment high, execution medium; model `tiered` stays model-only | ✓ (via free text) |
| No effort preset | Per-role overrides only | |
| Fold into model tiered | Model `tiered` also sets effort; changes existing tiered users' adapters | |

**User's choice:** "preset with manual override possibility"
**Notes:** Reflected back as preset + per-role `roles` overrides, independent of the model preset; user confirmed "yes".

---

## Model×effort compatibility

| Option | Description | Selected |
|--------|-------------|----------|
| Write it, document it | No capability table; research cites what Claude Code does with an unsupported level | ✓ |
| Refuse known-bad pairs | Keep a model→levels table and refuse mismatches; that table goes stale | |

**User's choice:** Write it, document it.

---

## Pi footprint

| Option | Description | Selected |
|--------|-------------|----------|
| AGENTS.md + /grug template | Baseline plus thin `/grug` prompt template if Pi has a project prompt dir | ✓ |
| AGENTS.md only | Same as Codex/OpenCode | |
| Also a Pi skill | Add a skill package too | |

**User's choice:** AGENTS.md + /grug template.

---

## Windows gate

| Option | Description | Selected |
|--------|-------------|----------|
| Proceed, no new reds | Ship; new tests must not be red on windows-latest (pushed CI run); rewrite the ROADMAP dependency line | ✓ |
| Fix row 274 first | Pull the board-watch EPERM fix in as the first plan | |
| Block the phase | Wait for a separate phase to green Windows | |

**User's choice:** Proceed, no new reds.

---

## Host-tool registry

Proposed in prose (one registry of supported tools, with a count test, that installer, validator and docs read).
**User's choice:** "yes" — keep it in Phase 34.

---

## Claude's Discretion

- Registry module location and the docs-prose check against it
- Plan order / wave split between the two halves
- Refusal message wording
- Whether to announce the resolved effort preset on the generator's stdout

## Deferred Ideas

- Windows rows 274/315 (CAP-02)
- Pi skill package / Pi thinking-level configuration
- Per-model effort capability check
