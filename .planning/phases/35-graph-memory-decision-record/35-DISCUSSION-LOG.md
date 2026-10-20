# Phase 35: Graph-memory decision record - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-20
**Phase:** 35-graph-memory-decision-record
**Areas discussed:** Record form & home, Revisit trigger, Role-read posture, Vendor claims & evidence

---

## Record form & home

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone + pointer | Full record in 35-DECISION.md; one PROJECT.md Key Decisions row points to it | ✓ |
| Key Decisions row only | Everything in one PROJECT.md table row | |
| Standalone only | Only 35-DECISION.md, nothing in PROJECT.md | |

| Option | Description | Selected |
|--------|-------------|----------|
| D-10 | Continue the v3.0 series D-1..D-9, tagged [v3.0, D-10] | ✓ |
| Phase-local 35 D-01 | Earlier-phase scheme; clashes with milestone numbering | |

**User's choice:** Standalone + pointer; D-10.

---

## Revisit trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Fit AND measured need | Zero-dep, file-only, stampable tool AND measured code-navigation cost after the P37 budgets | ✓ |
| Either condition | Reopen on either alone | |
| Native agent milestone | Reopen when the native grugops agent milestone starts | |

| Option | Description | Selected |
|--------|-------------|----------|
| No date | Event-based trigger only | ✓ |
| Next milestone audit | The audit checks whether the trigger has been met | |

**User's choice:** Fit AND measured need; no date.

---

## Role-read posture

| Option | Description | Selected |
|--------|-------------|----------|
| Read as aid, unwritten | Posture only in the decision; no role text names a tool | ✓ |
| One generic role line | Phase 40 adds a tool-neutral line about derived indexes | |
| Do not read | Roles ignore graph output (not enforceable) | |

| Option | Description | Selected |
|--------|-------------|----------|
| No mention | No Phase 43 docs follow-up about host-native code navigation | ✓ |
| Note for Phase 43 | Deferred idea for Phase 43 to consider | |

**User's choice:** Read as aid, unwritten; no mention.

---

## Vendor claims & evidence

| Option | Description | Selected |
|--------|-------------|----------|
| No numbers at all | No figure anywhere; the verifier checks by reading, since .planning/ is outside check-banned-claims | ✓ |
| Cite, labelled | Quote the figures marked as unverified claims | |

| Option | Description | Selected |
|--------|-------------|----------|
| Cite research as-of | STACK.md §(d) as-is, dated 2026-10-20, labels kept | ✓ |
| Re-verify now | Executor re-checks READMEs, versions and licenses | |

**User's choice:** No numbers at all; cite research as-of.

---

## Claude's Discretion

- The internal structure of 35-DECISION.md.
- Whether to name GSD's own gsd-graphify / .planning/graphs to avoid confusion (offered as an extra area, not discussed).

## Deferred Ideas

None.
