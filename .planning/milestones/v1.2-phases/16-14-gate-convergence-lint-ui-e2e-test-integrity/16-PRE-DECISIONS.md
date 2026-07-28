# Phase 16 (§14 Gate Convergence) — Pre-Decisions

**Captured:** 2026-06-13, during the `/gsd-discuss-phase 15` session that ratified the TypeScript pivot.

> **Why this file exists:** the discuss session for the (then-numbered) Phase 15 gate-convergence work was redirected mid-stream into ratifying the TS pivot and reshaping the roadmap. Before that redirect, two genuine gate-convergence implementation decisions were already locked. They are stashed here so the eventual `/gsd-discuss-phase 16` starts warm rather than re-asking. This is **not** a CONTEXT.md — run the real discuss for Phase 16 and fold these in.

## Locked before the redirect

- **D (test-integrity enforcement form): committed checker + RED fixture.** The un-cheatable test-integrity check is a *mechanical* check, not an agent judgment. grugops ships a committed checker (sibling in spirit to `check-foundation-guards.sh` / `generate-asvs-checklist.mjs`) that the gate invokes; a `scripts/fixtures/`-style case with a hollow justification proves it **fails red** — directly satisfying SC3's "proven by a RED fixture where a hollow justification fails." (Rejected: a gate-workflow prose rule the agent applies — too "skippable" to be un-cheatable.)

- **D (what the checker validates): a grugops justification registry + skip-count comparison (stack-agnostic).** grugops cannot reliably parse every host framework's skip syntax (pytest `@pytest.mark.skip`, jest `.skip`, go `t.Skip`, …). So the checker deterministically validates grugops's **own** justification format — well-formed? named owner present? not expired? category in the closed list? — then compares the host runner's reported skip count against the count of valid justifications. **Gate fails when host-skips > validly-justified.** The un-cheatable part lives in the format validator; no foreign-test-syntax parsing. (Rejected: per-stack skip-marker matcher table — brittle, endless, breaks on unknown stacks.)

- **D (checker language): TypeScript, on the Phase-15 foundation.** Resolved by the TS-pivot ratification. The checker must run in *host* repos including Windows — POSIX shell can't, and the user wanted real TypeScript over stdlib `.mjs`. It ships via the **kit-shipped-runnable convention** that Phase 15 establishes (how a TS routine ships in the kit, is materialized by the installer, and is invoked cross-platform from a workflow step). **Phase 16 depends on Phase 15 for this.**

## Still open — for the real Phase-16 discuss

These four gray areas were identified and selected for discussion but **not yet discussed** (the session redirected first):

1. **Skip justification: format, home & "agent may not self-author" guarantee** — closed-list categories; where a justification lives (inline annotation vs a human-owned sidecar registry like `plans/test-skips.md`); how expiry is recorded/checked; the mechanism that makes "agent may not self-author" un-cheatable (named human owner ≠ agent / human signoff); how the non-blocking quarantine lane (never silent delete) is tracked. *(This is where the registry from the locked decision gets fully specified.)*
2. **New content placement (single-source tension)** — the gate change lands in `05-pr-quality-gate.md` only, but the Playwright `toHaveScreenshot` + axe-core flake-resistance recipe and the per-stack linter table are bulky: inline in the gate vs referenced artifacts the gate points to (reference-not-embed). Does workflow 14 finally get the UI tool names it deferred to here (Phase 13 D-08)?
3. **Self-fix loop & terminal-result mapping** — lint autofix can run inside the bounded `self_fix_attempts`; but **test-integrity must NOT be agent-self-fixable** (else it self-authors a justification, defeating TINT-01). Lock which new failures are agent-fixable vs human-only, and how lint / UI-E2E / test-integrity failures map onto `READY_FOR_HUMAN_REVIEW` / `BLOCKED_NEEDS_FIX` / `SPLIT_REQUIRED`.
4. **Lint step specifics** — per-stack linter table (ESLint 9 flat default for Vue; Biome caveat; Ruff / golangci-lint fallbacks); wiring `quality.lint.{strict,autofix}` into behavior (fail-on-warning, autofix-then-recheck).

## Locked context to carry forward (from Phases 10/12/13/14)

- All config dials already exist (Phase 10): `quality.lint {strict,autofix}`, `quality.ui_e2e (off|ui-or-critical-path|always)`, `quality.test_integrity (warn|block, never off — TINT-03 floor)`, `self_fix_attempts`, `coverage_threshold`, `gate_enforcement`. **Wire behavior; add no keys.**
- **Single-source gate**: all gate changes land in `agent-factory/workflows/05-pr-quality-gate.md` only — no fork into workflows 14/15. Reference siblings by filename; **never write "§14" into a shipped file** (Phase 12 D-12).
- **"Audit produces, gate enforces"** — the enforcement-at-the-visible-gate pattern.
- **WCAG 2.2 AA** is the a11y bar (Phase 13 D-09); axe-core is the tool deferred to here.
- **Two-voice**: test-integrity verdicts + skip rules in clear professional voice.
- Bounded self-fix loop + the three terminal results are preserved unchanged.
