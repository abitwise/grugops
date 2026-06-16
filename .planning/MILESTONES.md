# Milestones

## v1.2 SDLC Depth, Quality Discipline & Browsable Docs (Shipped: 2026-06-16)

**Phases completed:** 10 phases (10–19), 38 plans, 55 tasks
**Git:** `9dc56ad..5ecb6e4` — 263 commits, 278 files changed (+46,382 / −4,686) · 2026-06-09 → 2026-06-16
**Audit:** `tech_debt` — 34/35 requirements satisfied, 7/7 cross-phase integration seams wired (0 broken), no blockers
**Known deferred items at close:** 13 (all known/ratified — A3/DOG-02 human-waived, B1/B2 Tier-3 human-only, 2 stale markers; see STATE.md Deferred Items)

**Delivered:** Made grugops's delivery lifecycle senior-grade and trustworthy end-to-end — deeper SDLC personas with the business→engineer handoff closed, test-first by default, automated UI build+test, OWASP ASVS security auditing, an un-cheatable quality gate, a TypeScript tooling foundation, browsable docs, the deferred install migrate/update story, and an honest auto-UAT harness — almost entirely as improvements to grugops's own markdown kit.

**Key accomplishments:**

- **SDLC-coverage audit + foundation guards + config-dial contract (Phase 10)** — opened the milestone by scoring all 16 roles × 14 workflows × 9 lifecycle stages (breadth complete; 4 depth gaps mapped to phases 11–15, 0 uncovered), landing four mechanical guards (WR-05 spawn-grant grep, adapter-size, AGENTS.md byte budget, voice-lint) with a fail-proof harness, and 8 new dial keys with lean defaults + a documented lean→enterprise escalation contract the validator enum-recognizes active-when-present / lenient-when-absent.
- **Senior persona overhaul + 17th frontend/UI role (Phases 11, 13)** — deepened all 16 roles to senior judgment in place (sharper-per-token; terse caveman voice preserved as the token-economy mechanism; per-file byte ceilings enforced), closed the business→engineer handoff via the INVEST/measurable-NFR Definition-of-Ready hub, retired the WR-05 spawn grant (re-verified GREEN post-rewrite), and added a senior `frontend-ui` persona (no spawn) + workflow 14 (UI design→build, WCAG 2.2 AA) the Orchestrator routes to.
- **Test-first baked in (Phase 12)** — declarative selector-free Given/When/Then acceptance contract in the product + QE handoffs, a single-source Three Amigos / Example-Mapping hub folded into backlog refinement, and the engineer red-green double-loop with dial-aware test-first evidence fields carrying the clear-voice no-fabrication floor — all config-dialed via `bdd` + `quality.tdd`.
- **OWASP ASVS 5.0 security posture (Phase 14)** — workflow 15 (deep leveled audit, reference-don't-restate the gate) + the security/NFR checklist regenerated from a vendored pinned ASVS 5.0.0 source by a zero-dep generator (345 L1/L2/L3 requirements, byte-reproducible, provably not hand-transcribed), with `security.asvs_level`/`block_on` dialed and clear-voice findings (guard_voice over all four security surfaces).
- **TypeScript tooling foundation (Phase 15, D-13 ratified)** — migrated the whole script layer (single `install.ts`, validator, ASVS generator, six-guard aggregator, kit-refs) to a zero-build, `tsc`-compiled committed-`.js`, freshness-checked cross-platform model, and proved the kit-shipped-runnable convention end-to-end; all 13 POSIX/`.mjs` originals + `.test.sh` oracles deleted only after a green migration suite; Node 22+ floor.
- **Converged un-cheatable §14 quality gate (Phase 16)** — wired lint, automated Playwright UI/E2E + visual regression + axe-core a11y, and a structured-justification test-integrity checker the agent cannot self-author into the single-source `05-pr-quality-gate.md`, all config-dialed, preserving the bounded self-fix loop and three terminal results; `test_integrity` carries a `warn|block`-only safety floor (never off).
- **Install --migrate / --update + browsable docs catalog (Phases 17, 18)** — RED-harness-first, never-delete-first `--migrate`/`--update`/`--prune-old-kit` flags on the single TS installer (the only deletion path removes only timestamped `.bak` backups), and a read-only stdlib-only generator emitting a byte-stable `docs/catalog/README.md` (17 roles + 16 workflows, each linked to source) guarded by a fail-closed `freshness:catalog` drift gate.
- **Honest factory auto-UAT harness (Phase 19)** — Tier-1 deterministic oracles (WR-05 wording, hooks.json→guard wiring, dual-path parity) wired into the foundation-guards aggregator + a Tier-2 `claude --print` headless E2E harness that LOUD-skips when unauthed; run for real it resolved B3 + A1/D-31 + A2/SAFE-02 from captured evidence without fabrication. A3/DOG-02 live dual-path parity is **human-waived** to the next (decentralization) milestone that removes handoffs; B1/B2 persona/prose judgment stays a human sign-off.

Archived: `milestones/v1.2-ROADMAP.md`, `milestones/v1.2-REQUIREMENTS.md`, `milestones/v1.2-MILESTONE-AUDIT.md`

---

## v1.1 Install & Distribution (Shipped: 2026-06-08)

**Phases completed:** 3 phases (7–9), 14 plans, ~33 tasks
**Git:** `a37830b..9d13c1b` — 92 commits, 140 files changed (+13,632 / −1,709) · 2026-06-06 → 2026-06-08
**Audit:** `tech_debt` — 8/8 requirements satisfied, cross-phase integration solid live, no blockers
**Known deferred items at close:** 7 (all v1.0-era; see STATE.md Deferred Items)

**Delivered:** Redesigned the install experience to a shared-location, two-root architecture — the read-only kit installs once to `${GRUGOPS_HOME:-$HOME/.grugops}` and any target repo gets a tiny self-resolving footprint — fixing the three v1.0 dogfood pains (kit never arrives, wrong target, symlink fragility).

**Key accomplishments:**

- Locked the kit/state split convention and the single "one rule, two homes" resolution mechanism, then rewrote ~31 role/workflow/adapter files so every reference resolves to the correct root — proven by a grep-to-zero build gate (`check-kit-refs.sh`)
- Built the two-root installer at sh/Node byte-parity: atomic kit copy to `$GRUGOPS_HOME`, content-idempotent materialization of the resolved absolute kit path into the standalone adapters, full per-repo state seed incl. `plans/handoffs/`, `--target`/`--yes`/non-TTY, copy-default, always-on self-checkout guard
- Two-root uninstall (D-06) that protects seeded state and the shared kit, removing only the grugops-owned marker + adapters + wiring
- Shipped the `--check` doctor (sh + byte-parity Node twin) — non-mutating, three-source kit-root cross-check, deterministic first-failure with referencing file, WARN tier, full exit-code matrix
- Made the structure validator two-root aware with NO `.` fallback — refuses to false-green in the dev checkout or with `$GRUGOPS_HOME` unset (C3 guard), backed by a three-way resolution-parity assertion (sh doctor = Node doctor = Node validator)
- Closed 3 verification-blocker gaps + a parity-CLASS code-review remediation in a Phase-9 Wave 4; re-verified PASSED 5/5 (install.test.sh 18/18, validate.test.sh 18/18 green live)

Archived: `milestones/v1.1-ROADMAP.md`, `milestones/v1.1-REQUIREMENTS.md`, `milestones/v1.1-MILESTONE-AUDIT.md`

---

## v1.0 MVP — Full Agent Factory v2 (Shipped: 2026-06-04)

**Phases completed:** 6 phases (1–6), 34 plans, ~70 tasks
**Git:** `f81da6c..a37830b` — 206 commits, 823 files (+37,616) · 2026-06-02 → 2026-06-06
**Note:** Not formally audited at ship time; archived retroactively at the v1.1 close (2026-06-08).

**Delivered:** The complete Agent Factory v2 spec — 16 role prompts (Orchestrator + 10 core + 5 enterprise), 14 lifecycle/ceremony/enterprise workflows with dual Kanban/Scrum cadence and a bounded backpressure quality gate, the shared I/O contracts (handoffs, checklists, memory-bank), thin per-tool adapters for all five host CLIs, both Claude distribution forms (standalone `.claude/` + versioned plugin), idempotent installers, a mechanical PreToolUse prod-deploy guard, a structure validator, brand/legal collateral, and an end-to-end idea→PR dogfood — all as readable markdown.

**Key accomplishments:**

- Froze the shared vocabulary (config dial, 13-column WIP board, stable ID scheme, traceability/NFR/metrics state plane) every later file cites by name
- Authored all 16 role prompts to a fixed 9-section skeleton, Orchestrator first (13-arrow routing matrix, WIP/DoR gate, XL-split, never-merge/never-deploy hard limit), plus a minimal §17.1 AGENTS.md embedding Karpathy's 12 coding-agent rules
- Composed the 14-workflow suite — full lifecycle, both cadences, and the single-source §14 backpressure quality gate (prefetch → branch → gate → bounded self-fix → terminal result), never faking a pass
- Bridged the single-source core to all five host tools via pointer-only adapters; shipped both coexisting Claude forms and idempotent/reversible installers
- Made prod-safety mechanical: a pure-Node plugin-level PreToolUse hook that denies prod-deploys absent a human-set approval, refuses inline self-set, and fails closed
- Shipped the stdlib-only structure validator (never fabricates a pass), the public brand/legal collateral (README + NOTICE + CONTRIBUTING + FAQ + original-art SVGs), and proved the chain with a real out-of-repo idea→PR dogfood (DOG-01 met; DOG-02 sequential half proven, live-CC half honestly deferred)

Archived: `milestones/v1.0-ROADMAP.md`, `milestones/v1.0-REQUIREMENTS.md`

---
