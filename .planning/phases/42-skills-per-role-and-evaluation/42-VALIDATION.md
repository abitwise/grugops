---
phase: "42"
slug: "skills-per-role-and-evaluation"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
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
| SKILL-01 | A role may declare a skill with a built-in fallback; every shipped role has a `## Skills` section exactly when it declares one (fixture roles prove the shape; no shipped role declares a skill after the ratify-none decision) | unit | `npx vitest run scripts/skills-kit-text.test.ts scripts/role-skills-reader.test.ts` | ✅ | ✅ green |
| SKILL-01 | Protocol keeps `## The 5 steps`; the skills line sits under step 2 | unit | `npx vitest run scripts/skills-kit-text.test.ts` (role-switch protocol block) | ✅ | ✅ green |
| SKILL-01 | No generated adapter carries `skills:` (39 D-28); no Claude Code adapter grants `Skill` | unit | `npx vitest run scripts/generate-role-adapters.test.ts scripts/skills-kit-text.test.ts` | ✅ | ✅ green |
| SKILL-02 | `42-EVALUATION.md` names all six candidates with a verdict per floor in the whole-plugin matrix, records the ratify-none decision, names both revisit triggers; converse cases go red on a mutated record | doc structure | `npx vitest run scripts/skills-kit-text.test.ts -t "SKILL-02"` | ✅ (c06367ad) | ✅ green |
| SKILL-03 | Precedence line occurs once (AGENTS.md); `docs/skills.md` is a named member of both claim gates; § Recommended skills equals the declared set both ways; host table equals `HOST_SKILL_DIRS`; no pin or install command printed | unit + gate | `npx vitest run scripts/skills-kit-text.test.ts scripts/check-banned-claims.test.ts scripts/check-public-docs-vocabulary.test.ts` · `npm run check:banned-claims` · `npm run check:public-docs` | ✅ | ✅ green |
| SKILL-04 | Design-system files are user artifacts: the never-write sentence in `designer.md` and `frontend-ui.md` § Hard limits and Workflow 14 step 1, and nowhere else | unit | `npx vitest run scripts/skills-kit-text.test.ts` | ✅ | ✅ green |
| SKILL-05 | `--check` prints one advisory line per missing declared skill per installed host, exit code unchanged; override variables, plugin skills via `installed_plugins.json` (links followed), stray role files, `claude --version` floor probe from absolute PATH entries only, control characters stripped | integration (spawned install.js, scratch HOME/PATH) | `npx vitest run install/skills-doctor.test.ts install/claude-version-doctor.test.ts install/agents-record.test.ts install/path-spelling-census.test.ts install/mode-census.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `install/skills-doctor.test.ts` — scratch `home`, scratch `PATH` with a fake `claude`, a fake `installed_plugins.json` and plugin dirs for both the `skills/` and `./.claude/skills/` layouts
- [x] A test fixture role set with declared skills, so the doctor tests do not depend on which shipped roles end up declaring skills
- [x] A derived single-occurrence test for the AGENTS.md precedence line
- [x] A host-table ↔ `HOST_TOOLS` two-way pin

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The written evaluation's verdicts are sound against grugops's floors | SKILL-02 | Judgment on third-party skill behavior; a test can only check structure | Read `42-EVALUATION.md`; confirm each candidate has a verdict per floor and the recommended set follows from them |
| Per-host skill discovery on non-Claude hosts | SKILL-01, SKILL-05 | Only Claude Code was run live; other host paths are docs-cited (`UNKNOWN - verify`) | On each host, install a skill at the documented path and confirm the host lists it |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated by /gsd-validate-phase 42 on 2026-11-17 (full suite compared by name against the pre-phase baseline 76c6d8a6: no new failure apart from LANG-07, which reads the untracked `~/` folder and passes in a clean checkout)

## Validation Audit 2026-11-17

| Metric | Count |
|---|---|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |
