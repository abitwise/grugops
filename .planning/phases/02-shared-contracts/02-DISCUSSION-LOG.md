# Phase 2: Shared Contracts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-02
**Phase:** 2-shared-contracts
**Areas discussed:** Handoff template depth, Memory-bank identity & depth, Lean/enterprise tier signal, Contract-file metadata

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Handoff template depth | Pre-fill per-role handoffs from §5.A vs. universal-header skeleton | ✓ |
| Memory-bank identity & depth | Generic shipped template vs. grugops-self-filled; per-file scaffold depth | ✓ |
| Lean/enterprise tier signal | How a checklist declares its tier for mechanical mode-gating | ✓ |
| Contract-file metadata | YAML frontmatter on contracts vs. spec-literal pure-markdown | ✓ |

**User's choice:** All four areas selected for discussion.

---

## Handoff template depth

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-fill from §5.A | Each handoff = universal header + the role's spec'd output sections, copy-paste-complete now; business-handoff + 2 packets get a light derived structure | ✓ |
| Universal-header skeleton only | Universal header + role name + 1-2 fields; full structure emerges in Phase 3 | |
| You decide | Claude judges per-handoff | |

**User's choice:** Pre-fill from §5.A (Recommended).
**Notes:** Verified beforehand that §5.A specifies exact output sections for 7 of the per-role handoffs (product/system/architecture/implementation/qe/security-nfr/uat). business-handoff and the two packets are under-specified → Claude proposed a derived structure (business-framing intake / DoR bundle / engineer start bundle); user did not override, so the derivation is locked (D-09).

---

## Memory-bank identity & depth

| Option | Description | Selected |
|--------|-------------|----------|
| Generic template skeleton | Header + one-line purpose + section stubs; no grugops content; grugops's own memory stays in .planning/; 00-index documents the working-memory contract | ✓ |
| Pre-seed grugops's own content | Fill brief/product/architecture from PROJECT.md (breaks D-04 separation) | |
| You decide | Claude picks identity + depth | |

**User's choice:** Generic template skeleton (Recommended).

**Follow-up — ADR convention:**

| Option | Description | Selected |
|--------|-------------|----------|
| ADR-template.md, no example | 50-decisions/ ships .gitkeep + ADR-template.md (format: status/context/decision/alternatives/consequences/rollback); no example ADR | ✓ |
| Template + one worked example | Also ship ADR-0000-example.md (introduces seed data; validator must whitelist) | |
| Convention in 00-index only | No template file; convention described in 00-index only | |

**User's choice:** ADR-template.md, no example (Recommended).
**Notes:** Keeps the clean-empty-plane rule (D-03); the non-numeric template name won't trip the Phase-6 validator's ADR-000X pattern.

---

## Contract-file metadata (Area 4 — discussed before tier signal because tier cascades from it)

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal frontmatter on all contracts | Every handoff + checklist gets a 2-3 field YAML frontmatter (kind + role/stage; checklists add tier); spec headings verbatim below | ✓ |
| Pure markdown headings (spec-literal) | No frontmatter; validator matches on ## names; tier via index/prose | |
| Frontmatter only where it earns its keep | Checklists get tier:; handoffs stay pure markdown | |

**User's choice:** Minimal frontmatter on all contracts (Recommended).
**Notes:** Reuses the Phase-1 ticket frontmatter pattern; gives VAL-01 + Phase-3 roles a machine-readable key.

---

## Lean/enterprise tier signal (residual after metadata decision)

| Option | Description | Selected |
|--------|-------------|----------|
| tier: + a short checklists index | tier: frontmatter (machine-readable) + checklists/00-index.md grouping lean vs enterprise and stating the mode-gating rule | ✓ |
| frontmatter tier: only | No index; split lives in frontmatter + DoD/DoD-enterprise naming | |
| You decide | Claude judges whether the index is worth it | |

**User's choice:** tier: + a short checklists index (Recommended).
**Notes:** Satisfies SC#3 "clearly distinguished" both mechanically and for a human skimming the folder.

---

## Claude's Discretion

- Exact frontmatter field names/order (kept to 2-3 high-signal fields).
- Wording of one-line purpose lines, section stubs, and format hints in the memory-bank skeleton and checklists/00-index.md.
- Whether the universal-handoff file is the canonical header the per-role handoffs inherit vs. each repeating the header inline (pick lower-drift).
- Section ordering within business-handoff and the two packets (content from D-09 must be present; ticket-ready-packet stays aligned with definition-of-ready.md).

## Deferred Ideas

- Role prompts consuming these contracts → Phase 3.
- Workflow files producing handoffs / recording trace updates → Phase 4.
- Runtime memory-bank artifacts (brownfield-map.md, greenfield-plan.md) → Phase 3/4 role outputs, not seeded here.
- Phase-6 validator's exact section-presence checks → Phase 6 (reads the section names frozen this phase).
- Final version string + commands/-vs-skills/ form → Phase 5 (unchanged by this phase).
