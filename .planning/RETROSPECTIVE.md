# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

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
- **Carry-forward debt accumulated quietly** — WR-05 (packaging templates still grant `Agent`/spawn) rode from Phase 7 → 8 and remains open; carried-forward warnings need a hard owner, not just a note.

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

### Cumulative Quality

| Milestone | Live Test Suites | Audit Status | Zero-Dep Additions |
|-----------|------------------|--------------|--------------------|
| v1.0 | validator self-test, guard.test.sh, install.test.sh, check-structure.sh | (not formally audited) | validator (stdlib-only), guard (pure-Node) |
| v1.1 | install.test.sh 18/18, validate.test.sh 18/18, two-root 12/12, check-kit-refs green | `tech_debt` (8/8 reqs, no blockers) | doctor (sh + Node), two-root validator |

### Top Lessons (Verified Across Milestones)

1. **Mechanical gates beat eyeballs and prompts** — the prod-deploy hook (v1.0) and the grep-to-zero / fail-closed gates (v1.1) are the load-bearing safety, not the prose.
2. **Never fabricate** — `UNKNOWN - verify`, honest deferral of un-runnable items (DOG-02), and re-verifying after gap closure kept the trace trustworthy across both milestones.
3. **Close milestones promptly** — v1.0's skipped archive cost a retroactive reconstruction; do the close as part of shipping.
