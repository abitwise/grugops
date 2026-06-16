---
quick_id: 260616-faw
slug: automate-remaining-human-uats-feasibilit
status: complete
date: 2026-06-16
type: feasibility-and-design
deliverable: 260616-faw-PLAN.md (analysis only — no code executed)
---

# Summary — Automate remaining human UATs: feasibility

**Deliverable:** a feasibility-and-design plan (`260616-faw-PLAN.md`). No source code was
changed — the task asked *how would it be possible*, so the output is analysis.

## What was done

- Read all 3 remaining open human-UAT files (Phase 05, 06, 11) plus the dogfood runbook.
- Confirmed `claude --print` headless mode + `--bare`/`--input-format`/hook support exist,
  making the live-runtime UATs E2E-automatable.
- Inventoried grugops's existing harness patterns to extend (`guard.test.ts`,
  `check-foundation-guards.test.ts`, `docs/dogfood-human-runbook.md`).

## Conclusion (3 tiers, governed by Constraint #6 "no fabrication")

- **Tier 1 — fully & honestly automatable now (3/8):** B3 WR-05 wording-consistency oracle,
  A2 hooks.json→guard wiring test, A3 artifact-structure parity diff. Deterministic, no LLM.
- **Tier 2 — real headless E2E (3/8):** A1 pointer resolution, A2 live firing, A3 live
  parity via a `claude --print` harness — at the cost of a dev/CI-only `claude`-CLI
  dependency that must skip loudly, never silently pass.
- **Tier 3 — advisory pre-screen only (2/8):** B1/B2 persona/prose judgment via LLM-judge
  can *flag for human* but cannot replace the sign-off without self-grading the factory's
  own prose (the exact thing the human UAT prevents).

## Bottom line

Automation is mostly possible but **does not unblock the v1.2 close** — the human sign-off
on Phase 11 persona depth stays a human act. Real value is cheaper UATs for *future*
milestones → frame as a **v1.3 "Factory auto-UAT" feature**, not a close workaround.

## Recommended next step

- Resolve the close the human way: `/gsd-verify-work 11`, then `/gsd-complete-milestone`; OR
- Capture this as v1.3 backlog scope and build it after v1.2 ships.
