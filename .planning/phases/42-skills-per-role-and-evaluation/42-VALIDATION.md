---
phase: "42"
slug: "skills-per-role-and-evaluation"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-16"
---

# Phase 42 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (dev dep), tests beside sources (`install/*.test.ts`, `scripts/*.test.ts`) |
| **Config file** | vitest defaults + `tsconfig.tests.json` (typecheck) |
| **Quick run command** | `npx vitest run install/<file>.test.ts scripts/<file>.test.ts` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Estimated runtime** | quick ~30 seconds; full suite over 600 seconds (`/tmp` EDQUOT can give false failures — compare by test name against a pre-phase baseline) |

---

## Sampling Rate

- **After every task commit:** Run the targeted vitest files plus the relevant `node scripts/check-*.js` gate
- **After every plan wave:** Run `npm run build && npm run typecheck`, the freshness gates (`npm run freshness:adapters`, `check:build-parity`), and all `install/*doctor*` / kit-route tests
- **Before `/gsd-verify-work`:** Full suite compared by name against the pre-phase baseline must be green
- **Max feedback latency:** ~60 seconds for the per-task targeted run

---

## Per-Task Verification Map

Filled in by the planner and executor. Requirement-level map from RESEARCH.md:

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| SKILL-01 | Every shipped role's `skills:` admits through `roleSkillsOf`; declared names ⊆ the ratified set recorded in one place, count derived; `## Skills` sits between Responsibilities and Output; size guards green | unit + guard | `npx vitest run scripts/canonical-frontmatter.test.ts` · `node scripts/check-role-rules.js` · `node scripts/check-foundation-guards.js` | partly (new cases ❌ W0) | ⬜ pending |
| SKILL-01 | Protocol keeps `## The 5 steps`; the skills line sits under step 2 | unit | `npx vitest run scripts/flow-guidance-text.test.ts` | ✅ (extend) | ⬜ pending |
| SKILL-01 | No generated adapter carries `skills:` (39 D-28) | unit | `npx vitest run scripts/generate-role-adapters.test.ts` | ✅ | ⬜ pending |
| SKILL-02 | `42-EVALUATION.md` exists, names all six, has a row per floor per candidate, names both revisit triggers | doc check | grep / small test | ❌ W0 | ⬜ pending |
| SKILL-03 | Precedence line appears exactly once in the kit; roles/docs only point to it; `docs/skills.md` in both claim gates; no "latest" in pins | unit + gate | `node scripts/check-banned-claims.js` · `node scripts/check-public-docs-vocabulary.js` · new derived-occurrence test | ❌ W0 | ⬜ pending |
| SKILL-04 | `design-system/` rule only in `designer.md` + WF14; "never write" wording present | unit | new test or extend `check-role-rules` | ❌ W0 | ⬜ pending |
| SKILL-05 | Doctor prints one advisory line per missing skill per installed host, leaves exit 0 and `--strict` unchanged; unknown host path → "cannot check"; plugin skill via `installed_plugins.json` + `plugin.json` `skills`; `claude --version` below/at/above 2.1.293, unparsable, absent; fs census unchanged | integration (spawned install.js, scratch HOME/PATH) | `npx vitest run install/<new>-skills-doctor.test.ts install/installer-fs-census.test.ts install/kit-route.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `install/skills-doctor.test.ts` (name is planner's choice) — scratch `home`, scratch `PATH` with a fake `claude`, a fake `installed_plugins.json` and plugin dirs for both the `skills/` and `./.claude/skills/` layouts
- [ ] A test fixture role set with declared skills, so the doctor tests do not depend on which shipped roles end up declaring skills
- [ ] A derived single-occurrence test for the AGENTS.md precedence line
- [ ] A host-table ↔ `HOST_TOOLS` two-way pin

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The written evaluation's verdicts are sound against grugops's floors | SKILL-02 | Judgment on third-party skill behavior; a test can only check structure | Read `42-EVALUATION.md`; confirm each candidate has a verdict per floor and the recommended set follows from them |
| Per-host skill discovery on non-Claude hosts | SKILL-01, SKILL-05 | Only Claude Code was run live; other host paths are docs-cited (`UNKNOWN - verify`) | On each host, install a skill at the documented path and confirm the host lists it |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
