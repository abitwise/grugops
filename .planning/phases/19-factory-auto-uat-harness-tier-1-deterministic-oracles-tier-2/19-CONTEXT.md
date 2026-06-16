# Phase 19: Factory Auto-UAT Harness — Context

**Gathered:** 2026-06-16
**Status:** Ready for planning
**Source of truth for scope:** [quick task 260616-faw feasibility plan](../../quick/260616-faw-automate-remaining-human-uats-feasibilit/260616-faw-PLAN.md)

<domain>
## Task Boundary

Honestly automate the agent-unrunnable **live-runtime** human UATs so they can be resolved
without an agent grading its own homework. Two lanes land this phase; one lane is
explicitly excluded and stays human.

**IN SCOPE (build + run):**
- **Tier 1 — deterministic oracles** (no LLM, fail-red, never fabricate):
  - **B3** WR-05 wording-consistency across `PROJECT.md` / `.planning/STATE.md` / the
    SDLC-coverage audit (`.planning/v1.2-SDLC-COVERAGE-AUDIT.md`) / `.planning/RETROSPECTIVE.md`
    — assert all state "spawn grant dropped P8 → guarded P10 → re-verified P11".
  - **A2 wiring half** — `hooks/hooks.json` matcher → `hooks/guard` denies a matched
    prod-deploy stdin payload (exit-2 / deny-JSON) through the same path Claude Code uses.
  - **A3 structural half** — dual-path artifact-structure parity: same handoff **filenames**
    + same gate **verdict string** between sequential and sub-agent dispatch.
- **Tier 2 — headless E2E** via `claude --print` (confirmed available: `--print`, `--bare`,
  `--input-format`, headless hooks):
  - **A1** plugin-cache pointer resolution (D-31): scaffold throwaway repo → `claude plugin
    marketplace add` + `install` → `claude --print "/grugops:plan ..."` → assert planning
    markers, NOT a path-error.
  - **A2 live half** (SAFE-02): `claude --print` attempts a guarded `kubectl apply` WITHOUT
    `GRUGOPS_PROD_DEPLOY_APPROVED` → assert the deny message. NEVER set the approval var;
    NEVER run a real deploy (V14).
  - **A3 live half** (DOG-02): two headless ABC-001 runs (sequential vs `agent:` sub-agent
    dispatch) → diff handoff filenames + gate verdict.

**OUT OF SCOPE (stays human — do NOT automate as a gate):**
- **Tier 3 — B1/B2 persona/prose judgment** (Phase 11): "is the prose senior enough" is
  self-grading and low-confidence. An LLM-judge here would *manufacture* a green —
  the exact failure the human UAT exists to prevent. At most a future *advisory* pre-screen
  (NOT this phase). The human sign-off on `11-HUMAN-UAT.md` scenarios 1 & 2 remains.
</domain>

<decisions>
## Implementation Decisions (LOCKED — do not revisit)

### Honesty / no-fabrication (Constraint #6 — hard)
- Oracles and the E2E harness MUST fail red and MUST NOT fabricate a pass. A UAT file's
  status may only flip to passed/resolved from a **real run's** output, never hand-set.
- Tier 2 when the CLI is **absent or unauthed** must emit a **loud SKIP** (visible, distinct
  exit/markers) — NEVER a silent green. A skip is not a pass.

### Dependency posture
- Tier-2 needs the `claude` CLI + auth — this stays **dev/CI-only**. It is NOT a host
  runtime dependency. The minimal markdown-copy install path (`install/README.md` §1) and
  the committed-`.js` host execution model are unaffected (CLAUDE.md "zero runtime deps").
- Build the harness to run **locally on-demand** against the developer's authed CLI, plus a
  CI lane that skips-loud when unauthed. Do NOT add a CI secret/API-key requirement to make
  the default build pass.

### Tech / patterns to clone (Phase 15 D-13 convention)
- TypeScript authored → `tsc` to **committed `.js`** → **freshness-checked** (rebuild-to-temp,
  byte-diff, fail-red on drift). Vitest-covered. Dev deps are only `{typescript, vitest}` (+
  `@types/node`) — add NOTHING else.
- Clone the existing structural template: `scripts/generate-catalog.ts` + `*.test.ts` +
  `scripts/catalog-freshness.ts` (Phase 18) and `scripts/generate-asvs-checklist.ts` (Phase 14).
- Wire both lanes into the foundation-guards aggregator (`scripts/check-foundation-guards.ts`)
  and reference from the §14 gate (`agent-factory/.../05-pr-quality-gate.md`, single-source —
  do NOT fork gate logic into other workflows).
- Extend, don't duplicate: `hooks/guard.test.ts` already proves the guard logic in isolation
  (26/26) — the A2 wiring oracle adds the `hooks.json`→guard contract, not a re-test of logic.

### Voice
- Findings/runbook prose about these checks use **clear (non-caveman) voice** — they touch
  safety (SAFE-02) and the trace. `docs/dogfood-human-runbook.md` documents the three lanes
  and states which is **authoritative** (Tier 1/2 real runs) vs **advisory/human** (Tier 3).

### Config dial
- Gate-execution of the new lanes is config-dialable consistent with existing `quality.*`
  keys (lean default on, enterprise escalation). The E2E lane defaults to skip-when-unauthed.
  Reuse existing keys/patterns; only add a new dial key if a lane genuinely needs one.
</decisions>

<specifics>
## Specific references

- Open UAT files this phase resolves (real runs only):
  - `.planning/phases/05-packaging-adapters-install-distribution/05-HUMAN-UAT.md` (A1, A2)
  - `.planning/phases/06-validation-brand-dogfood/06-HUMAN-UAT.md` (A1, A2, A3 — fills the
    9 parity cells in `examples/03-ticket-to-pr.md`)
  - `.planning/phases/11-senior-persona-overhaul/11-HUMAN-UAT.md` **scenario 3 only** (B3);
    scenarios 1 & 2 stay human.
- Runbook to keep in lockstep with the harness: `docs/dogfood-human-runbook.md`.
- WR-05 claim wording to assert: "spawn grant dropped P8 → guarded P10 → re-verified P11".
</specifics>

<canonical_refs>
## Canonical References

- Feasibility & tier analysis: `.planning/quick/260616-faw-.../260616-faw-PLAN.md` (authoritative scope)
- CLAUDE.md Constraints (esp. #6 no-fabrication, voice discipline, no host runtime deps, single-source)
- Phase 15 SUMMARY (TS→committed-.js + freshness model, D-13); Phase 18 generator+freshness pattern
</canonical_refs>
