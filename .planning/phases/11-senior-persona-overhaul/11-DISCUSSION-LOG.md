# Phase 11: Senior Persona Overhaul - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-10
**Phase:** 11-Senior Persona Overhaul
**Areas discussed:** Section shape & placement, Voice-guard coverage, BA depth & P12 boundary, WR-05 retirement scope

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Section shape & placement | How the senior-judgment block is structured/placed across 16 roles | ✓ |
| Voice-guard coverage | Whether the Phase 10 voice-lint guard expands to all 16 roles | ✓ |
| BA depth & P12 boundary | Where senior-BA depth lives + where P11 stops vs P12 | ✓ |
| WR-05 retirement scope | What "retire WR-05" means given frontmatter is already clean | ✓ |

**User's choice:** All four areas.

---

## Area 1 — Section shape & placement

### Q1.1 — How to structure the new senior-judgment block?

| Option | Description | Selected |
|--------|-------------|----------|
| One section, two parts | Single `## What good looks like / When to escalate` with two sub-parts | |
| Two separate sections | `## What good looks like` + `## When to escalate` as distinct sections | |
| Blended prose paragraph | One short prose block, no sub-labels | |

**User's choice:** *(Other / reframe)* — "Senior role can be just the persona, make sure the persona is sophisticated enough, no need to list what looks good and what not as the model has this data."
**Notes:** Killed the enumerated section entirely. Reframed PERS-01 from "add a section" to "deepen the persona in place." Flagged the tension that ROADMAP SC1 / REQUIREMENTS PERS-01 literally mandate the section → would need amending. Offered reconciliation A (persona-deepening only) / B (deepen + tight escalation cue) / C (full section done well).

### Q1.2 — Reconciliation path

**User's choice:** **A** — persona-deepening only, no new section at all; amend SC1.

### Q1.3 — What concretely makes a persona "senior" (checkable target)?

| Option | Description | Selected |
|--------|-------------|----------|
| Judgment calls + failure modes it owns | Role-specific tradeoffs woven into existing sections + sharper handback cues | |
| Sharper hard limits only | Narrow deepening of Hard limits / stop conditions | |
| Holistic per-role rewrite | Top-to-bottom rewrite, no prescribed locus | ✓ |

**User's choice:** *(Holistic, refined)* — "Rewrite the role area and review whole role top to bottom to make sure it reflects senior role with long-term experience, but someone with forward thinking."
**Notes:** → D-02. Bound added (D-03): elevate persona + voice, not responsibilities/contract.

---

## Area 2 — Voice-guard coverage

### Q2.1 — Expand the voice-lint guard to all 16 rewritten roles?

| Option | Description | Selected |
|--------|-------------|----------|
| Expand to all 16 roles | Add every role to the guard scan set | ✓ |
| Keep 3-role scope | Leave at security-nfr / compliance-officer / incident-responder | |
| Expand, but section-anchored | All 16 but scan only specific sub-sections | |

**User's choice:** *(Expand, with the core-idea statement)* — "Caveman voice is needed, seniority for roles doesn't mean the main idea of grugops should be removed, the main idea is to reduce output token usage as costs are rising. Expand it to all 16 roles, but make sure to keep the core idea intact."
**Notes:** THE load-bearing input. Elevated terse-caveman-voice-as-token-economy to a hard phase constraint (D-04). → D-05.

### Q2.2 — Which mechanical protections to add? (multiSelect)

| Option | Description | Selected |
|--------|-------------|----------|
| Caveman-preserved check | Assert every role keeps a non-empty `## Caveman prompt` block with ≥1 marker | ✓ |
| Role-file size ceiling | Two-tier WARN→FAIL per-role size guard (mirrors adapter-size guard) | ✓ |
| Voice-coverage only | Add neither; rely on the expanded scan + human review | |

**User's choice:** **Both** — caveman-preserved check + role-file size ceiling.
**Notes:** → D-06, D-07. User wants the core idea protected by code, not convention.

---

## Area 3 — BA depth & Phase 12 boundary

### Q3.1 — Where does the deepened senior-BA content live?

| Option | Description | Selected |
|--------|-------------|----------|
| Extend existing files, DoR as hub | INVEST/NFR into `definition-of-ready.md`; role+workflow point to it; no new file | ✓ |
| New INVEST checklist as single home | New `invest-checklist.md`; everything points to it | |
| Role + workflow only | Deepen `ba-pm.md` + workflow 07 only; leave DoR/handoff as-is | |

**User's choice:** **Extend existing files, DoR as hub.**
**Notes:** → D-08. Single-source, no new file, matches existing pointer pattern.

### Q3.2 — How far does Phase 11 take acceptance criteria?

| Option | Description | Selected |
|--------|-------------|----------|
| Prose quality only | INVEST + testable/measurable acceptance + measurable NFRs + DoR rigor; no executable wiring | ✓ |
| Also seed Three Amigos hook | Add a lightweight Three Amigos reference into workflow 07 | |
| You decide the line | Planner sets the precise stop point | |

**User's choice:** **Prose quality only.**
**Notes:** → D-09. Clean GAP-2 (P11) vs GAP-1 (P12) split; Three Amigos + executable scenarios are Phase 12.

---

## Area 4 — WR-05 retirement scope

### Q4.1 — Scope of "retire WR-05"?

| Option | Description | Selected |
|--------|-------------|----------|
| Verify + close the marker | Confirm clean, re-run guard after rewrite, update tracking docs; keep correct prose | ✓ |
| Also reword explanatory prose | Additionally scrub the "spawn" word from correct templates | |
| Minimal — guard pass only | Only confirm the guard passes; don't touch tracking docs | |

**User's choice:** **Verify + close the marker.**
**Notes:** → D-10. Frontmatter already clean (Phase 8); the stale part is the tracking docs.

---

## SC reconciliation (consequence of Area 1 / D-01)

### How to reconcile the changed PERS-01 mechanism?

| Option | Description | Selected |
|--------|-------------|----------|
| Update ROADMAP + REQUIREMENTS now | Amend SC1 + PERS-01 wording this session | ✓ |
| Note in CONTEXT for the planner | Defer the edit; planner applies it | |
| Document as intentional deviation | Leave wording; verifier reads CONTEXT | |

**User's choice:** **Update ROADMAP + REQUIREMENTS now.**
**Notes:** → D-11. Applied this session: ROADMAP SC1 rewritten, REQUIREMENTS PERS-01 rewritten, `UI hint: yes→no`, context-note pointer added.

---

## Claude's Discretion

- Exact role-file size-ceiling thresholds (D-07) — set roughly flat over current sizes; prefer per-file-relative (orchestrator is legitimately largest).
- Caveman-marker set for the preserved-block check (D-06).
- Voice-lint false-positive sweep after the rewrite (D-05).
- Senior-rewrite depth per role within the D-03/D-04 bounds.
- DoR INVEST/NFR line phrasing (D-08).

## Deferred Ideas

- Executable acceptance / Three Amigos / Example Mapping → Phase 12 (BDD-01/02).
- TDD double-loop → Phase 12 (TDD-01/02).
- Frontend/UI senior persona + UI workflow → Phase 13.
- Leveled security (ASVS) + un-cheatable gate → Phases 14/15.
- TypeScript pivot → HELD (project-level, per Phase 10).
- Generic "what good looks like" quality enumeration → rejected for role files (model already carries it).
