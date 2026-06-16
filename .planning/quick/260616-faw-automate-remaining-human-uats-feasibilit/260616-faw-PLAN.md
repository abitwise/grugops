---
quick_id: 260616-faw
slug: automate-remaining-human-uats-feasibilit
description: Feasibility plan — automate the activities in the remaining human UATs
date: 2026-06-16
type: feasibility-and-design
status: plan-only
deliverable: design analysis (not an executed implementation)
sources:
  - .planning/phases/05-packaging-adapters-install-distribution/05-HUMAN-UAT.md
  - .planning/phases/06-validation-brand-dogfood/06-HUMAN-UAT.md
  - .planning/phases/11-senior-persona-overhaul/11-HUMAN-UAT.md
  - docs/dogfood-human-runbook.md
---

# Can the remaining human UATs be automated? — Feasibility & Plan

## Scope

This is a **plan/feasibility analysis**, not an executed task. It answers: *for each
activity in the still-open human UATs, can it be automated, how, and at what honesty
cost?* The hard governing constraint is grugops's own Constraint #6:

> **No fabrication:** never fake a passing gate, a test result, or a citation — the trace is the proof.

A "human UAT" in grugops exists precisely when an activity **cannot be honestly
self-performed by an agent**. So the real question is not "can a script run it?" but
"can a script run it *without the agent grading its own homework*?" That line splits the
8 remaining activities into three tiers.

## The 8 remaining activities

| # | Phase | Activity | Kind |
|---|-------|----------|------|
| A1 | 05 / 06 | **D-31** plugin-cache pointer resolution: install plugin form, run `/grugops:plan`, assert planning output (not a path error) | Live runtime integration |
| A2 | 05 / 06 | **SAFE-02** live PreToolUse hook firing: guarded `kubectl apply` is DENIED with the clear-voice message in a live CC session | Live runtime integration |
| A3 | 06 | **DOG-02** CC sub-agent spawn parity: drive ticket ABC-001 through the sub-agent path; assert SAME roles, SAME handoff filenames, SAME gate verdict as the sequential run (fill 9 parity cells) | Live runtime integration |
| B1 | 11 | Senior depth across all 16 roles (Responsibilities = forward-thinking; Hard limits = junior-missed failure modes; no new section; caveman voice intact) | Prose/persona judgment |
| B2 | 11 | Senior BA prose quality in `ba-pm.md`, `definition-of-ready.md`, `07-backlog-refinement.md` (INVEST woven in; measurable AC/NFR; no Phase-12 BDD leak) | Prose/persona judgment |
| B3 | 11 | **WR-05 closure wording reads factual**: PROJECT.md / STATE.md / SDLC-audit / RETROSPECTIVE all state "spawn grant dropped P8 → guarded P10 → re-verified P11" | Factual cross-check |

## Tier split (the answer)

### Tier 1 — Fully automatable as *real* assertions (zero fabrication risk). Build these.

- **B3 (WR-05 wording factual)** — this is not judgment, it's a **consistency check**.
  Grep the four artifacts for the spawn-grant claim and assert all four agree on
  "dropped P8 / guarded P10 / re-verified P11". A mismatch fails red. Pure mechanical
  oracle — exactly the shape of the existing foundation guards.
- **A2 wiring half** — the *contract* "`hooks.json` → `guard` denies a matched deploy"
  is already half-covered by `hooks/guard.test.ts` (the guard logic in isolation). The
  missing piece is the **wiring**: feed the `hooks.json` matcher + a `kubectl apply`
  PreToolUse stdin payload through the same path CC uses and assert exit-2 / deny-JSON.
  Deterministic, no LLM — extend `guard.test.ts`.
- **A3 structural parity** — the UAT checks *structure* (same handoff **filenames**, same
  **gate verdict** string), not exact prose. Filenames + the `READY_FOR_HUMAN_REVIEW`
  verdict line are deterministic artifacts → diffable. The "only dispatch differs"
  claim is a structural diff with content tolerance.

### Tier 2 — Automatable as headless **E2E** (real, but needs the `claude` CLI + auth in the test env)

Confirmed available: `claude --print` (non-interactive), `--bare`, `--input-format`,
and headless hook support. That makes a true end-to-end harness possible:

- **A1** — script: scaffold a throwaway repo with `agent-factory/` → `claude plugin
  marketplace add` + `claude plugin install grugops@grugops` → `claude --print
  "/grugops:plan ..."` → assert stdout contains planning-workflow markers and **NOT** a
  path-error substring. This is the genuine D-31 cache-pointer test, CI-able.
- **A2 live half** — `claude --print` a session that attempts a guarded `kubectl apply`
  **without** `GRUGOPS_PROD_DEPLOY_APPROVED`; assert the refusal/deny message. (NEVER set
  the approval var; NEVER run a real deploy — V14.) Confirms CC actually fires the hook,
  not just that the guard logic works.
- **A3 live half** — two headless runs of ABC-001 (sequential dispatch vs `agent:`
  sub-agent dispatch); diff produced handoff filenames + gate verdict.

**Cost / caveat:** Tier 2 needs Claude Code installed + authenticated in the runner
(API key / OAuth). That's fine for grugops's **own dev/CI** (dev-only deps already exist:
`typescript`, `vitest`) but must never become a host runtime dependency — keep it in a
`test:e2e` script gated behind "CLI present + authed", skipped (loudly, never silently)
otherwise. LLM nondeterminism means assert on **markers/structure**, not exact text.

### Tier 3 — Automatable only as an **advisory pre-screen**; the human keeps the sign-off

- **B1, B2 (persona / prose "is it senior enough")** — an LLM-as-judge *can* read each
  role against a rubric ("Responsibilities encode forward-thinking? Hard limits encode a
  junior-missed failure mode? new section added? voice intact?") and emit
  PASS/FLAG + evidence. grugops already owns the building blocks: the voice-lint guard,
  the byte-budget guard, and the §14 **structured-justification test-integrity** checker.
- **But** this is the one place the no-fabrication line bites hardest: an LLM judging
  whether its own factory's prose is "senior" is **self-grading**, and low-confidence by
  nature. Treating its PASS as the gate would *manufacture* a green — the precise failure
  the human UAT was created to prevent. So B1/B2 automation is legitimate **only** as a
  pre-screen that (a) catches mechanical regressions (lost a section, broke voice,
  blew the byte budget) and (b) **flags** subjective rows for a human, shrinking the
  human read to the flagged set. It reduces effort; it does not replace the sign-off.

## Plan (if we choose to build it) — a "factory auto-UAT" capability

This is really a **v1.3 candidate feature**, not a milestone-close chore: it gives
grugops *users* an automated-UAT lane while preserving "humans decide." Build order
mirrors the tiers (cheap/honest first):

1. **`scripts/check-uat-oracles.ts` (Tier 1)** — a foundation-guard-style aggregator with
   three deterministic oracles: B3 wording-consistency, A2 hooks.json→guard wiring,
   A3 artifact-structure diff. Vitest-covered, fail-red, no LLM. Wire into the existing
   `check-foundation-guards` lane.
2. **`scripts/e2e/uat-live.test.ts` + a `test:e2e` npm script (Tier 2)** — headless
   `claude --print` harness for A1/A2-live/A3-live. Gated on "CLI present + authed";
   prints a loud SKIP (never a silent pass) when unavailable. Mirrors
   `docs/dogfood-human-runbook.md` step-for-step so the human runbook and the automated
   harness stay one source.
3. **`scripts/uat-prescreen.ts` (Tier 3, advisory)** — LLM-judge over the persona/prose
   rubric for B1/B2; output is a **FLAGGED-FOR-HUMAN** report, explicitly *advisory*,
   never a gate verdict. Human UAT status can only be flipped to `passed` by a human.
4. **Docs** — extend the §14 gate + `dogfood-human-runbook.md` to describe the three
   lanes and, in clear (non-caveman) voice, state which lane is authoritative and which
   is advisory.

## What stays irreducibly human (by design, not by laziness)

- The **final sign-off** on B1/B2 persona quality — senior-prose judgment is the product;
  auto-grading it is self-referential.
- The **human merge/deploy** controls (SAFE-02's whole point) — never automate *approval*.
- Any **first-run** of the Tier-2 E2E in a new environment, until the harness itself is
  trusted (the harness needs its own dogfood).

## Honest bottom line

- **3 of 8** activities (B3 + the wiring/structural halves of A2/A3) are **fully and
  honestly automatable today** with deterministic oracles — clear win, low cost.
- **3 of 8** (A1 + the live halves of A2/A3) are **automatable as real headless E2E**, at
  the cost of a `claude`-CLI-in-CI dependency that must stay dev/CI-only and skip loudly.
- **2 of 8** (B1/B2) are **not honestly fully automatable** — LLM-judge is an advisory
  pre-screen that shrinks the human read but cannot replace the sign-off without
  violating Constraint #6.

So: "how would it be possible?" → build the Tier-1 oracles now (cheap, honest), add the
Tier-2 headless harness as a dev/CI lane, and ship the Tier-3 judge **only** as a
flagging pre-screen. **It does not unblock the current v1.2 close on its own** — the
human sign-off on Phase 11 persona depth (B1/B2) remains a human act. The automation's
real value is making *future* milestones' UATs cheaper, which is a v1.3 feature, not a
prerequisite for archiving v1.2.

## Recommended next step

Do **not** treat this as a close-blocker workaround. Two clean paths:
- **Resolve the close now**, the human way: `/gsd-verify-work 11` (you read & sign off
  Phase 11's 3 scenarios — minutes of reading), then re-run `/gsd-complete-milestone`.
- **Adopt this as v1.3 scope**: capture this plan as a backlog seed / roadmap candidate
  ("Factory auto-UAT: Tier-1 oracles + Tier-2 headless E2E + Tier-3 advisory judge") and
  build it after v1.2 ships.
