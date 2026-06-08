# Milestones

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
