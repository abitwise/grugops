# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.2 — SDLC Depth, Quality Discipline & Browsable Docs

**Shipped:** 2026-06-16
**Phases:** 10 (10–19) | **Plans:** 38 | **Commits:** 263

### What Was Built
- A senior-grade lifecycle: all 16 roles deepened in place + a 17th frontend/UI persona; the business→engineer handoff closed via an INVEST/measurable-NFR Definition-of-Ready hub
- Test-first by default — declarative Given/When/Then acceptance contract + Three Amigos/Example-Mapping + a TDD red-green double-loop, all config-dialed
- An OWASP ASVS 5.0 security-audit workflow + a generated leveled L1/L2/L3 checklist (345 reqs, byte-reproducible from a pinned source)
- The converged un-cheatable §14 quality gate — lint + Playwright UI/E2E + visual regression + a structured-justification test-integrity checker the agent can't self-author — single-sourced in `05-pr-quality-gate.md`
- A TypeScript tooling foundation — the whole script layer migrated to a zero-build, `tsc`-compiled committed-`.js`, freshness-checked, cross-platform model (Node 22+) + the kit-shipped-runnable convention
- Install `--migrate`/`--update`/`--prune-old-kit`, a browsable docs catalog + a fail-closed freshness gate, and an honest Tier-1/Tier-2 auto-UAT harness

### What Worked
- **Foundation-first sequencing** — landing the mechanical guards + config-dial contract in Phase 10 meant every later content phase wrote into a guarded, dialed environment; the guards caught regressions the moment they appeared.
- **Token-economy persona deepening** — the senior overhaul added judgment per token (woven into existing sections, paid for by compressing weak prose) under hard byte ceilings, instead of bloating the prompts — "sharper, not longer."
- **Ratifying the TS pivot as its own phase** — pulling the long-HELD TypeScript decision into an explicit Phase 15, with a freshness check proving committed `.js` can't drift from `.ts`, gave the gate / test-integrity work a real cross-platform foundation instead of scattered ad-hoc `.mjs`.
- **Honest automation over fake green** — Phase 19's Tier-2 harness loud-skips when the CLI is unauthed and asserts on markers, never grading its own homework; it resolved the long-deferred A1/A2/B3 live UATs from real captured runs.

### What Was Inefficient
- **The milestone reopened after it was "done"** — Phase 19 was added post-Phase-18 to automate the deferred live-runtime UATs, so v1.2 was marked complete-but-never-archived and then re-opened. Scoping the auto-UAT work into the milestone up front would have avoided the reopen.
- **A live UAT resisted automation to the end** — A3/DOG-02 dual-path handoff-parity never produced frozen markers on `--print` stdout within even a 420s budget; the right call (assert on-disk artifacts, or wait for the decentralization that removes handoffs) was reached only after two timed-out real runs.
- **Nyquist formal validation still lags** — 7 of 10 phases are PARTIAL (structural-guard/markdown work where wave-0 unit-test compliance doesn't map cleanly), the same debt carried from v1.1. Behavioral coverage is strong (144+ tests green); the formal layer remains a process-doc gap.
- **Stale status strings accumulated** — 05/06 verification frontmatter still read human_needed after Phase 19 resolved A1/A2; the close had to reconcile them. Resolving upstream status when a later phase closes an item would avoid the cleanup.

### Patterns Established
- **Single-source the gate** — every gate addition (lint, UI/E2E, test-integrity) lands in `05-pr-quality-gate.md` only; workflows reference it, never fork it. The bounded self-fix loop and three terminal results wrap unchanged.
- **Committed-`.js` + freshness check** — author tooling in TS, compile to committed `.js`, gate on a rebuild-to-temp byte diff so the artifact provably can't drift from its source — the zero-host-dependency cross-platform model.
- **Safety carve-outs are never fully dialable off** — `test_integrity` is `warn|block` only (mirrors the prod-deploy hook's refuse-self-set); a trace-integrity floor the dial can't disable.
- **Tiered honesty for un-runnable checks** — Tier-1 deterministic oracles (authoritative) / Tier-2 gated live E2E (loud-skip) / Tier-3 human-only judgment (explicitly out of automation scope); each lane states whether it's authoritative or advisory.

### Key Lessons
1. Scope the verification/UAT-automation work *into* the milestone — a deferred "automate the live UATs later" became a whole reopened phase (19).
2. When a live assertion resists automation, question the assertion's *surface* (here, `--print` stdout vs on-disk artifacts) before spending more real-run budget.
3. Deepen personas by compression, not addition — judgment-per-token under a byte ceiling preserves the token economy that is grugops's whole cost model.
4. A pivot worth holding is worth ratifying as its own phase with a mechanical anti-drift gate, not sprinkling the new tech in piecemeal.

### Cost Observations
- Model mix: predominantly opus (model_profile `quality`).
- Scale: the largest milestone yet — 263 commits, +46,382/−4,686 across 278 files over 8 days (2026-06-09 → 2026-06-16).
- Notable: the TS migration (15) and gate convergence (16) were the heaviest content; Phase 19's two timed-out 420s live runs were the most expensive low-yield spend — resolved by waiving A3.

---

## Milestone: v1.1 — Install & Distribution

**Shipped:** 2026-06-08
**Phases:** 3 (7–9) | **Plans:** 14 | **Commits:** 92

### What Was Built
- Shared-location, two-root install architecture — read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`, per-repo state in the target (`.grugops/`, `plans/`, `memory-bank/`)
- ~31-file kit/state path rewrite proven complete by a grep-to-zero build gate (`check-kit-refs.sh`)
- Two-root installer at sh/Node byte-parity (atomic kit copy, materialized absolute kit path, state seed without clobbering, `--target`/`--yes`/copy-default, self-checkout guard) + a two-root uninstall that preserves seeded state
- `--check` doctor (sh + byte-parity Node twin) and a two-root validator with NO `.` fallback (C3 guard), reconciled by a three-way resolution-parity assertion

### What Worked
- **Forced build order paid off** — freezing the ref spelling in Phase 7 before the installer (8) and verifier (9) meant the doctor/validator could key off a single frozen contract; nothing downstream churned the rewrite.
- **Mechanical gates over eyeballs** — the grep-to-zero gate (C1) and the unset-`$GRUGOPS_HOME` BAD fixture (C3) caught the exact class of silent regression the milestone existed to prevent.
- **sh/Node byte-parity as an explicit contract** — proving the two installers/doctors byte-identical across a fixture matrix removed an entire drift surface.
- **Honest verification loop** — Phase 9 verification found 3 blocker gaps; they were closed in a Wave-4 gap-closure pass and re-verified PASSED 5/5 rather than being waved through.

### What Was Inefficient
- **Nyquist formal validation never ran** across all three phases (draft/planned, tasks not executed) — behavioral coverage was strong (live test suites green) but the formal layer lagged, leaving a process-doc gap flagged at close.
- **Code-review found a parity *class*, not just instances** — 09-05 initially closed only the exact reported spellings (CR-01/CR-02); a follow-up remediation was needed to close the lexical `./..` collapse class. Fixing to the class the first time would have saved a round.
- **Carry-forward debt accumulated quietly** — WR-05 (packaging templates still grant `Agent`/spawn) rode from Phase 7 → 8 as an open warning. **Now closed:** the grant was dropped in Phase 8, a mechanical guard (`guard_wr05`) was added in Phase 10, and it was re-verified GREEN after the Phase-11 persona rewrite (retired, D-10). The lesson stands — carried-forward warnings need a hard owner (a mechanical guard + a named retirement phase), not just a note.

### Patterns Established
- **One rule, two homes** — a single resolution rule (`${GRUGOPS_HOME:-$HOME/.grugops}`) with an installer-materialized absolute path (standalone) or `${CLAUDE_PLUGIN_ROOT}` (plugin); no role/workflow/SKILL/AGENTS.md ever names `$GRUGOPS_HOME` in prose.
- **Kit vs state invariant marker** — a byte-identical marker block at canonical sites, gated mechanically, so the split can't silently drift.
- **Oracle + parity gate** — pick one implementation as the oracle (Node `install.mjs`) and prove the other (sh) byte-identical against it across the full matrix.

### Key Lessons
1. When a rewrite spans ~137 refs across ~31 files, a mechanical grep-to-zero gate is the only trustworthy net — eyeballs miss the one dangling ref.
2. Close the *class*, not the reported instance — a code-review finding about a trailing slash is usually a finding about path normalization in general.
3. A fail-closed default (`JSON.parse('null')` → "not a JSON object", unset kit root → exit 1) is worth a dedicated regression fixture; "it throws somewhere" is not fail-closed.

### Cost Observations
- Model mix: predominantly opus (model_profile `quality`).
- Notable: the verification → gap-closure → re-verify loop in Phase 9 added 2 plans but converted a "passed with open gaps" into an honest PASSED 5/5.

---

## Milestone: v1.0 — Full Agent Factory v2

**Shipped:** 2026-06-04 (retrospective written at v1.1 close)
**Phases:** 6 (1–6) | **Plans:** 34 | **Commits:** 206

### What Was Built
- The complete Agent Factory v2 spec — 16 role prompts (Orchestrator + 10 core + 5 enterprise), 14 lifecycle/ceremony/enterprise workflows with dual cadence and the bounded backpressure quality gate
- Shared I/O contracts (handoffs, 10 checklists, minimal memory-bank), the WIP board + traceability/NFR/metrics state plane, stable ID schemes
- Per-tool adapters for all five host CLIs, both Claude distribution forms, idempotent installers, the mechanical PreToolUse prod-deploy guard, the stdlib-only structure validator, brand/legal collateral, and an end-to-end idea→PR dogfood

### What Worked
- **Bottom-up dependency ordering** — freezing the shared vocabulary first (config fields, board columns, IDs) meant every later file cited names that never moved.
- **Single-source role text + thin adapters** — authoring role text once and pointing five tools at it avoided drift across the toolchain.
- **No-fabrication discipline** — `UNKNOWN - verify` command slots and a validator that never fakes a pass kept the trace honest from day one.
- **Dogfood as the acceptance gate** — running a real ticket idea→PR surfaced the install-resolution pain that defined the entire next milestone.

### What Was Inefficient
- **v1.0 was never formally closed** — phases continued straight into v1.1 (Phase 7) without archiving, so v1.0's milestone record had to be reconstructed retroactively at the v1.1 close.
- **Several SUMMARY one-liners left empty** — a hygiene gap that made retroactive accomplishment extraction harder.
- **DOG-02's live-CC half** couldn't be agent-run and was deferred — correct, but it left a long-lived "pending human" item.

### Patterns Established
- **The role is the intelligence; the workflow is the guardrail; the handoff is the memory; the board is the state; the gate is the backpressure.**
- **Two voices** — caveman voice in role prompts; clear professional English for security, compliance, money, and legal.
- **Mechanical safety over prompt safety** — a PreToolUse hook that fails closed, not a prompt that asks nicely.

### Key Lessons
1. Close each milestone as it ships — skipping the archive forces a retroactive reconstruction later.
2. Fill the SUMMARY one-liner at plan close; it's the cheapest source of milestone accomplishments and audit evidence.
3. A real dogfood is worth more than any number of illustrative examples — it found the pain the whole next milestone fixed.

### Cost Observations
- Model mix: predominantly opus (model_profile `quality`).
- Notable: the largest single diff was the dogfood (out-of-repo sample tree, 408 files in one plan).

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Plans | Key Change |
|-----------|---------|--------|-------|------------|
| v1.0 | 206 | 6 | 34 | Bottom-up build of the full spec; dogfood as acceptance gate |
| v1.1 | 92 | 3 | 14 | Forced build order + mechanical gates (C1 grep-to-zero, C3 fail-closed); sh/Node byte-parity contract |
| v1.2 | 263 | 10 | 38 | Foundation-first guards + config-dial; token-economy persona overhaul; TypeScript tooling pivot (committed-`.js` + freshness); converged single-source §14 gate; honest Tier-1/2 auto-UAT |

### Cumulative Quality

| Milestone | Live Test Suites | Audit Status | Zero-Dep Additions |
|-----------|------------------|--------------|--------------------|
| v1.0 | validator self-test, guard.test.sh, install.test.sh, check-structure.sh | (not formally audited) | validator (stdlib-only), guard (pure-Node) |
| v1.1 | install.test.sh 18/18, validate.test.sh 18/18, two-root 12/12, check-kit-refs green | `tech_debt` (8/8 reqs, no blockers) | doctor (sh + Node), two-root validator |
| v1.2 | Vitest suite 144+ green (install, validator, ASVS, guards, UAT oracles, catalog, freshness) + foundation-guards aggregator | `tech_debt` (34/35 reqs, 7/7 integration seams, no blockers) | TS tooling → committed-`.js` + freshness (zero host runtime deps); test-integrity checker; catalog generator + freshness gate; Tier-1 UAT oracles |

### Top Lessons (Verified Across Milestones)

1. **Mechanical gates beat eyeballs and prompts** — the prod-deploy hook (v1.0) and the grep-to-zero / fail-closed gates (v1.1) are the load-bearing safety, not the prose.
2. **Never fabricate** — `UNKNOWN - verify`, honest deferral of un-runnable items (DOG-02), and re-verifying after gap closure kept the trace trustworthy across both milestones.
3. **Close milestones promptly** — v1.0's skipped archive cost a retroactive reconstruction; do the close as part of shipping. Corollary (v1.2): scope the verification/UAT-automation *into* the milestone — deferring it reopened v1.2 as a whole new phase (19).
4. **Make tooling drift impossible, not just unlikely** — the committed-`.js` + freshness check (v1.2) is the same move as the v1.1 sh/Node byte-parity contract: pick one source of truth and gate mechanically on a byte diff so the artifact provably can't drift.
