# Project Research Summary

**Project:** grugops v1.2 — SDLC Depth, Quality Discipline & Browsable Docs
**Domain:** Markdown agent-factory kit — deepening an existing 16-role / 14-workflow / §14-gate delivery system
**Researched:** 2026-06-09
**Confidence:** HIGH

> Synthesis of `.planning/research/{STACK,FEATURES,ARCHITECTURE,PITFALLS}.md` (4 parallel researchers, all read the actual `agent-factory/` tree).

---

## Executive Summary

grugops v1.2 deepens an already-shipped markdown agent-factory across ten interlocking themes. The kit ships no runtime — every deliverable is role-prompt text, workflow steps, checklist items, handoff fields, and config-dial knobs encoded into markdown files, plus two byte-parity install scripts and one stdlib-only Node validator. The v1.2 additions follow this exact pattern: OWASP ASVS 5.0.0 is REFERENCED as the security-audit anchor and RECOMMENDED to users (never installed into grugops); playwright-bdd 9.x, Vitest 4.x, and ESLint 9 flat-config are similarly user-recommendations encoded in role/workflow text and AGENTS.md command slots. The one new code artifact is a stdlib-only Node catalog generator (no npm dependencies added to grugops).

The recommended build approach is dependency-honoring and sequential: SDLC-coverage audit first (it scopes everything), then senior persona overhaul (the substrate), then config-dial extension, then BDD+TDD wiring, then the frontend/UI persona and security-audit workflow (can run in parallel), then §14 gate-step additions (converges on the BDD/UI/ASVS work those phases produce), then install migrate/update (independent track throughout), and finally the docs catalog (documents the finished set). The result is a 17-role, 15-workflow, expanded-§14 kit with a fully leveled security posture and a browsable in-repo reference — all within the existing markdown-only boundary.

The highest risks are cross-cutting rather than capability-specific. The WR-05 spawn-tool regeneration hazard must be killed mechanically in the first phase. The install migrate/update path must never delete-first — this is the highest-blast-radius pitfall in v1.2, and the v1.1 CR-01 bug proved the failure mode is real. Every new capability must read `factory.config.json` and define lean/enterprise tiers explicitly or the "zero-config first" promise breaks in both directions (over-taxing solo users OR allowing enterprise gates to be skipped as prose-only). The recommendation is to front-load all mechanical guards in Phase 1 — WR-05 grep, single-source adapter check, AGENTS.md byte budget, voice-lint, config-dial contract — so every subsequent phase writes into a guarded environment.

---

## Key Findings

### Recommended Stack

**"grugops references/recommends, never installs" — the framing rule for every entry:**

- **OWASP ASVS 5.0.0** (released 2025-05-30): The security-audit anchor. ~350 requirements, 17 chapters, three cumulative levels (L3 ⊇ L2 ⊇ L1). v5 rebalanced: L1 is now a realistic light entry point (fits the lean tier); L3 substantially expanded (~90 distinct L3 reqs). Ships a machine-readable CSV/JSON with a per-requirement level column — generate/filter the checklist from the source, never hand-transcribe. **Level → tier map: L1 → lean default, L2 → enterprise, L3 → enterprise + explicit `security.asvs_level: 3` + named human sign-off.**
- **`playwright-bdd` 9.0.0** (released 2026-06-02, Gherkin → Playwright Test runner): The BDD runner for the recommended Playwright stack. Gherkin scenarios become native Playwright tests — auto-waiting, fixtures, parallelism, tracing, and built-in `toHaveScreenshot()` visual regression out of the box. **Use playwright-bdd, not Cucumber.js:** Cucumber.js has no built-in VRT and requires a separate runner, losing Playwright fixtures/parallelism.
- **Vitest 4.x** (4.1 current; requires Vite ≥6, Node ≥20): TDD unit/integration runner for the Vue/TS stack. Jest-compatible API; created by the Vue/Vite team. Paired with **@vue/test-utils 2.4.x** for Vue 3 component testing — the officially recommended Vue testing stack.
- **Playwright 1.60.x**: UI/E2E + visual-regression engine. `toHaveScreenshot()` is the deciding reason playwright-bdd beats Cucumber.js for grugops's stack.
- **ESLint 9 flat config** (`eslint.config.mjs`) + `eslint-plugin-vue` (≥9) + `@vue/eslint-config-typescript` + Prettier: The **only** fully-supported combination for Vue SFCs today. **Biome 2.x is NOT the default for the Vue stack** — Vue/Svelte/Astro support is experimental (landed 2.3, not stable). Recommend Biome only for JS/TS projects without Vue SFCs. Per-stack fallbacks: Ruff 0.15.x for Python; golangci-lint v2 for Go.
- **Stdlib-only Node catalog generator**: No `gray-matter`, no `js-yaml`, no npm dependency added to grugops. Sibling of `scripts/validate-agent-factory.mjs`. Parses the known frontmatter key-set with a hand-rolled reader; emits committed markdown.

**Proposed config-dial flag set** (additive to existing keys, all three config files edited atomically):

```jsonc
{
  "quality": {
    "tdd": "encouraged",               // off | encouraged | required
    "lint": { "strict": false, "autofix": true },
    "ui_e2e": "ui-or-critical-path",   // off | ui-or-critical-path | always
    "test_integrity": "warn",          // warn | block  (safety: never fully off)
    "gate_enforcement": "warn"         // warn | block
  },
  "bdd": "lean",                       // off | lean | strict
  "security": {
    "asvs_level": 1,                   // 1 | 2 | 3
    "block_on": "high",                // none | high | medium
    "require_human_signoff_at": 3      // L3 demands named human approver
  }
}
```

Gate-execution knobs nest under `quality`; `bdd` and `security.asvs_level` are top-level (lifecycle scope, not just gate scope).

### Expected Features

**Must have (table stakes) — v1.2 core:**

- SDLC-coverage audit & gap-fix (opens milestone; confirmed gaps: `ba-pm.md` ~48 lines/shallow, `security-nfr-checklist.md` is 10 one-line items, no frontend/UI role exists)
- Senior persona overhaul (all 16 roles + new 17th): ONE new skeleton section `## What good looks like / When to escalate` in clear voice; grug caveman voice stays in role prompts
- BDD+TDD double-loop (non-conflicting, layered): BDD = outer acceptance loop (Given/When/Then, QE/business-owned, passes over days); TDD = inner unit loop (engineer-owned, passes over minutes); rule: "never write a second failing acceptance test before the first is green"
- Three Amigos / Example Mapping: fold into `07-backlog-refinement.md`; Example Mapping before Gherkin; Gherkin written afterward not live in workshop
- OWASP ASVS-anchored security audit: new `workflows/15-security-audit.md`; full rewrite of the 10-line `security-nfr-checklist.md` into L1/L2/L3 tagged ASVS chapters with requirement IDs; clear professional English throughout findings
- Test-integrity gate (default-on, never fully dialable off): four required fields per skip (reason + named owner + ticket/REQ-ID + expiry date); gate fails on `unjustified_skips > 0` AND `expired_skips > 0`; agent may NOT self-author justifications; quarantine ≠ delete
- Senior frontend/UI persona (`roles/frontend-ui.md`, 17th role) + UI design→build workflow (`workflows/14-ui-design-to-build.md`): design contract → build → all 5 states (loading/empty/error/success/partial-data) → a11y → visual baseline
- Automated UI/E2E + visual regression in §14 gate: Playwright `toHaveScreenshot()` component-level first; axe-core a11y assertions; masked, animations disabled, fixed viewport, baselines in CI/Docker only
- Lint as a first-class gate step with per-stack linter recommendations table
- Install `--migrate` / `--update` (MIGR-01 / UPD-01): additive, reversible, never delete-first, byte-parity sh/Node
- Browsable in-repo markdown docs catalog: `scripts/build-docs-catalog.mjs` (stdlib-only) → `docs/catalog/`; generated not hand-maintained; CI staleness check; no web UI

**Should have (differentiators):**

- Double-loop BDD↔TDD explicitly diagrammed in the workflow (two concentric loops, clear ownership — the non-conflict story most kits miss)
- INVEST-shaped stories + measurable NFRs baked into Definition of Ready
- Mutation-testing guidance (recommend where stack supports; never mandate a runtime grugops can't ship — honesty about coverage gameability)
- "Bug the user as little as needed" encoded as a bounded Orchestrator principle (merge/deploy human stop explicitly exempt and mechanically non-negotiable)

**Defer (post-v1.2):** Mutation testing as a requirement; full cross-browser visual matrix; SKEW-01; FIX-01; PLUGIN-01.

**NEW vs MODIFIED inventory:**

NEW files:
- `roles/frontend-ui.md` (17th role)
- `workflows/14-ui-design-to-build.md`
- `workflows/15-security-audit.md`
- `scripts/build-docs-catalog.mjs`
- `docs/catalog/` (generated output)

MODIFIED files (key):
- All 16 `roles/*.md` — new `## What good looks like / When to escalate` section; esp. `ba-pm.md` (most shallow) and `security-nfr.md` (ASVS uplift)
- `workflows/05-pr-quality-gate.md` (§14) — step 3 extended; test-integrity check added; bounded-self-fix contract unchanged
- `workflows/04`, `06`, `07`, `02`, `03` — BDD/TDD/Three Amigos wiring
- `handoffs/product-handoff.md` — BDD acceptance scenarios block
- `handoffs/implementation-ready-packet.md` — TDD test-first strategy
- `handoffs/qe-handoff.md` — UI/E2E results + skip-justification log
- `handoffs/security-nfr-handoff.md` — ASVS level + control-by-control findings
- `checklists/security-nfr-checklist.md` — full ASVS rewrite
- `checklists/definition-of-done.md` / `definition-of-done-enterprise.md`
- `config/factory.config.json` + `config/factory.config.md` + `seed/.grugops/factory.config.json` (atomic unit)
- `install/install.sh` + `install/install.mjs` — `--update` / `--migrate` modes
- `orchestrator.md` — routing matrix updated

### Architecture Approach

This is an integration architecture, not a greenfield design. All new capabilities follow the same file-layer pattern: one canonical file under `agent-factory/`; per-tool adapters stay thin pointers; the §14 gate remains single-source (ALL new gate steps land in `05-pr-quality-gate.md` step 3 only, never forked into the new workflows); config reads from `.grugops/factory.config.json` with documented lean defaults.

**Critical architectural decisions:**

- The roles use a consistent 9-heading skeleton (`One job / Caveman prompt / Reads / Activates when / Responsibilities / Output / Board moves / Trace updates / Hard limits`). The senior overhaul adds exactly **ONE** new section across all files: a clear-voice `## What good looks like / When to escalate` block. Caveman prompt stays terse.
- The §14 gate extended step-3 sequence: `install → lint → typecheck → unit → build → ui-e2e → e2e`. The bounded-self-fix contract (step 4, `self_fix_attempts` rounds) wraps the ENTIRE expanded sequence unchanged. Three terminal results unchanged: `READY_FOR_HUMAN_REVIEW` / `BLOCKED_NEEDS_FIX` / `SPLIT_REQUIRED`.
- New workflows are numbered 14 and 15 — frozen ordinals (00–13 must not renumber; a renumber ripples through every Orchestrator workflow-map reference).
- Config changes touch THREE files atomically: `config/factory.config.json`, `config/factory.config.md` byte-twin, `seed/.grugops/factory.config.json`. Gate-execution knobs nest under `quality`; `bdd` and `security.asvs_level` are top-level.
- Traceability extension is additive (Option 1 recommended): encode new evidence inside existing cells via documented convention — `Tests` cell records UI/E2E results and skip count; `NFRs` cell records ASVS level. Update seed FORMAT comment. Zero header churn, no validator column self-test breakage.
- The new frontend/UI role activates via `_role-switch-protocol.md` like every other role — no spawn tool, no sub-agent. Playwright runs as a gate CLI command, not a spawned agent.

### Critical Pitfalls

**Front-load mechanical guards in the foundation phase (Phase 1) — before any content phases pour material in.**

1. **WR-05 spawn-tool regeneration hazard** — Packaging templates (`subagent.frontmatter.md`, `slash-command.template.md`) still carry `Agent` tool / "spawn sub-agents" prose from v1.1 tech debt. Any regen during the v1.2 persona overhaul silently re-arms sub-agent spawning. Fix the templates as the FIRST packaging-touching task; add a `check-kit-refs.sh` grep for `tools: Agent` / "spawn" in templates and materialized adapters — fail the gate if found. Mechanical, not prose.
2. **Migrate/update delete-first (highest blast radius)** — `--migrate` runs irreversibly on the user's repo. The v1.1 CR-01 bug (unbounded sentinel strip deleted user content) proved this is real. Rule: never delete-first. Rename-to-backup before any write; deletion only behind explicit `--prune`; bounded marker-strip only; re-run is a no-op; sh/Node byte-parity on the migrate path. Ship a RED harness first (user-edited config survives; re-run is a no-op; uninstall-after-migrate restores).
3. **Config-dial regressions (both directions)** — Either a capability has no `factory.config` branch (always-on, over-taxing solo users) or an enterprise gate exists only as prose (skippable). Every capability must define both a lean default and an enterprise escalation. Make enterprise gates mechanical (artifact-exists + ran check).
4. **Test-integrity escape hatch becomes a rubber stamp** — Free-text justification lets an agent write "flaky, fix later" and pass the gate. Require all four structured fields (reason + named owner + tracking ticket/REQ-ID + expiry date) plus a closed-list category. Agent may NOT self-author justifications. Gate counts skips in verdict. RED fixture: hollow justification MUST fail.
5. **Single-source drift** — New BDD/ASVS/UI/lint content written into per-tool adapters. Extend `check-kit-refs.sh` to assert adapters are pointer-sized. Every new capability lands ONCE under `agent-factory/`; adapters only point.
6. **AGENTS.md and role-prompt bloat** — Reference-not-embed: role prompts link to checklists/workflow files, they do not embed them. Track AGENTS.md bytes against the 32 KiB Codex cap in CI.
7. **Voice-discipline drift** — ASVS findings, migrate/update data-loss warnings, and test-integrity verdicts MUST be clear professional English. "Sounding senior" must not flatten grug voice in role prompts. A voice-lint check on security/compliance/warning surfaces prevents both failures.

---

## Implications for Roadmap

> Proposed phase shape. The roadmapper owns the final structure and phase numbering (continues from v1.1's last phase, **10**).

**Phase A — SDLC-Coverage Audit & Foundation Guards (FIRST):** Audit is the named milestone opener; cross-cutting mechanical guards must land BEFORE content phases write into the system. Delivers gap report + WR-05 spawn grep, single-source adapter-size check, AGENTS.md byte-budget check, voice-lint skeleton, config-dial contract spec, traceability-extension decision. Avoids pitfalls 1, 5, 6, 3, 7.

**Phase B — Senior Persona Overhaul:** Persona depth is the substrate every later phase depends on. All 16 `roles/*.md` get the clear-voice `## What good looks like / When to escalate` section; packaging templates stripped of WR-05 spawn prose. One reviewable kit-wide diff.

**Phase C — Config Dial Extension:** Every later capability reads the new keys; finalize the dial contract first. All three config files updated atomically; lean defaults; validator recognizes new keys.

**Phase D — BDD + TDD Wiring:** The business→engineer gap-fix is the central delivery. Three Amigos produces scenarios; BDD drives TDD (double-loop). `ba-pm.md`/`uat-planner.md`/`software-engineer.md`/`qe-e2e.md` + workflows 02/03/04/06/07 modified; handoffs gain BDD/TDD blocks.

**Phase E — Frontend/UI Persona + UI Design-to-Build Workflow:** Prerequisite for visual-regression/axe gate steps. NEW `roles/frontend-ui.md` + `workflows/14-ui-design-to-build.md`; Orchestrator routing updated. Can run parallel to F.

**Phase F — Security Audit (OWASP ASVS) + Checklist Re-Anchor:** NEW `workflows/15-security-audit.md`; full ASVS-5.0 rewrite of `security-nfr-checklist.md` with L1/L2/L3 tags + requirement IDs; clear-voice findings. **Research flag: download the pinned ASVS 5.0.0 CSV before authoring.** Can run parallel to E.

**Phase G — §14 Gate-Step Additions (CONVERGENCE):** Consumes BDD (D), UI flow (E), ASVS posture (F). All gate changes land in `05-pr-quality-gate.md` only. Step-3 extended; test-integrity check + structured skip schema + RED fixture; DoD lines added. **Research flag: verify playwright-bdd 9 ↔ @playwright/test 1.60.x compatibility.**

**Phase H — Install --migrate / --update (INDEPENDENT TRACK):** No dependency on content phases; can run parallel to C–G. Both installers extended; byte-parity; **RED harness first** (user-edited config survives; re-run no-op; uninstall-after-migrate restores); never delete-first.

**Phase I — Browsable Docs Catalog (LAST):** Documents the finished set (all 17 roles, 15 workflows). NEW stdlib-only `scripts/build-docs-catalog.mjs` → `docs/catalog/*`; validator freshness check (regenerate-to-tmp, diff, nonzero on drift); generated-not-hand-maintained.

**Ordering rationale:** A→B→C is a strict prerequisite sequence (guards → substrate → config contract). D, E, F are independent content streams after C and all converge on G. G is strictly downstream of D/E/F. H is an independent parallel track. I is strictly last.

### Research Flags

- **Security audit phase:** Download ASVS 5.0.0 CSV at the `v5.0.0` pinned tag before planning the checklist; verify level-column name/position. `UNKNOWN - verify` per-requirement level tagging until inspected.
- **Gate phase (visual regression):** Verify playwright-bdd 9.x ↔ @playwright/test 1.60.x compatibility window; bump both together.
- **Install --migrate phase:** Write RED harness fixtures before implementation (v1.1 CR-01 + two-root installer are the references). No external research needed; high-discipline execution required.
- **Standard patterns (skip extra research):** audit/guards, persona overhaul, config dial, BDD/TDD, frontend/UI, docs catalog.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm/GitHub/official docs as of 2026-06-09. Open: playwright-bdd 9 ↔ @playwright/test 1.60.x minor compatibility — verify before gate phase. |
| Features | HIGH (practices) / MEDIUM (dial mapping) | BDD/TDD/Three Amigos/ASVS/flaky-quarantine are well-documented standards. Exact lean→enterprise dial mapping is a design choice. Confirmed repo gaps: 10-line security checklist, no frontend/UI role, shallow `ba-pm.md`. |
| Architecture | HIGH | Grounded in direct inspection of the actual `agent-factory/` tree. |
| Pitfalls | HIGH (grugops-specific) / MEDIUM (external SOTA) | WR-05 and CR-01 are documented v1.1 findings; single-source/bloat/voice are named constraints. BDD/ASVS/Playwright pitfalls web-verified June 2026. |

**Overall confidence:** HIGH

### Gaps to Address

- **ASVS 5.0.0 CSV field layout** (`UNKNOWN - verify`): verify level-column name/position from the pinned CSV before the security phase.
- **playwright-bdd 9 ↔ @playwright/test 1.60.x compatibility** (`UNKNOWN - verify`): verify before the gate phase; bump both together.
- **Docs-catalog frontmatter completeness**: verify all role/workflow files carry complete frontmatter before the catalog phase; if not, add a backlog item.
- **Traceability extension option (decision pending)**: ARCHITECTURE recommends Option 1 (in-cell, zero header churn); confirm before BDD/TDD wiring.
- **Biome vs ESLint headline (human decision)**: ESLint-default for the Vue stack is the recommendation; revisit when Biome Vue support exits experimental.

---

## Sources

**Primary (HIGH):** `agent-factory/` repo tree (direct inspection); `github.com/OWASP/ASVS` v5.0.0 tag; `playwright.dev`; `github.com/vitalets/playwright-bdd`; `vitest.dev`; `vuejs.org/guide/scaling-up/testing`; `eslint.vuejs.org`; `agents.md`; `developers.openai.com/codex/guides/agents-md` (32 KiB cap); `.planning/milestones/v1.1-MILESTONE-AUDIT.md` (WR-05, CR-01).

**Secondary (MEDIUM):** `softwaremill.com/whats-new-in-asvs-5-0/`; `justin.searls.co` (double-loop BDD/TDD); `automationpanda.com` (Three Amigos, Gherkin anti-patterns); `testdino.com` (Playwright flake-resistance); `minware.com` (flaky-test quarantine: reason/owner/ticket/expiry); Biome 2.x changelog (Vue experimental).

**Tertiary (LOW — validate during security phase):** secondary ASVS summaries for per-requirement L1/L2/L3 counts — verify against the pinned CSV.

---

*Research completed: 2026-06-09 · Ready for roadmap: yes*
