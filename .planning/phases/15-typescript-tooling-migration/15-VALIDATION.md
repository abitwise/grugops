---
phase: 15
slug: typescript-tooling-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `15-RESEARCH.md` § Validation Architecture. Per-task rows are
> filled by the planner / nyquist-auditor once PLAN.md task IDs exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `~4.1` (D-06) — replaces the POSIX `.test.sh` harnesses |
| **Config file** | `vitest.config.ts` (minimal: `defineConfig({ test: {} })`; node defaults suffice) — none today, **arrives in Wave 0** |
| **Quick run command** | `npx vitest run <suite>` (single suite) |
| **Full suite command** | `npx vitest run` (all suites, non-watch) |
| **Estimated runtime** | ~UNKNOWN - verify (no suite exists yet; estimate after Wave 0) |

**Supporting gates (not Vitest, but part of the green bar):**
- Typecheck: `tsc --noEmit` (the D-01 payoff — source must type-check clean)
- Freshness (D-02): rebuild-to-temp → diff committed `.js` → fail red on drift (`npm run freshness`, or `tsc && git diff --exit-code` on emitted `.js`)

---

## Sampling Rate

- **After every task commit:** Run `tsc --noEmit && npx vitest run <touched suite>`
- **After every plan wave:** Run `npm run build && npm run freshness && npx vitest run` (full)
- **Before `/gsd-verify-work`:** Full suite green + freshness green + typecheck clean
- **Max feedback latency:** UNKNOWN - verify (set after Wave 0 establishes suite runtime)

---

## Per-Task Verification Map

> Task IDs (`15-NN-NN`) are assigned by the planner. Rows below are anchored to
> requirements + decisions from RESEARCH; the planner maps each to concrete task IDs.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | 0 | TOOL-01 | — | Toolchain installs; `tsc --noEmit` clean | typecheck | `tsc --noEmit` | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | TOOL-01 | — | Committed `.js` fresh vs `.ts` (D-02) | freshness gate | `npm run freshness` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1+ | TOOL-01 | — | Installer parity: additive / idempotent / DRY_RUN / reversible / never-overwrite (D-07/D-08) | integration (spawn `.js`) | `npx vitest run install` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1+ | TOOL-01 | T-15-guard | Prod-deploy guard denies/allows correctly (parity oracle: existing `guard.test`) | integration | `npx vitest run hooks` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1+ | TOOL-01 | — | Validator pass/fail parity (two-root aware) | integration | `npx vitest run validate` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1+ | TOOL-01 | — | ASVS generator byte-reproducible (freshness pattern) | integration | `npx vitest run` (generator suite) | ❌ W0 | ⬜ pending |
| TBD | TBD | 1+ | TOOL-01 | — | Foundation-guards checker RED-by-design still fails on regression | RED/negative | `npx vitest run check-foundation-guards` | ❌ W0 | ⬜ pending |
| TBD | TBD | last | TOOL-02 | — | Kit-shipped reference routine returns D-12 exit codes (0/1/2) + clear-voice stdout | integration | `npx vitest run runnable-ref` | ❌ W0 | ⬜ pending |
| TBD | TBD | last | TOOL-02 | — | Reference routine fails RED on planted bad fixture | RED fixture | `node tools/grugops/<routine>.js <bad-fixture>; expect exit 1` | ❌ W0 | ⬜ pending |
| TBD | TBD | last | TOOL-02 | — | `install.ts` materializes routine into committed host path (additive/idempotent) | integration | `npx vitest run install` (materialization case) | ❌ W0 | ⬜ pending |
| TBD | TBD | 1+ | TOOL-01 | T-15-guard | Guard fails **CLOSED** when `guard.js` missing/unrunnable (D-10) | RED/negative | `npx vitest run hooks` (missing-artifact case) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — `"type":"module"`, dev-deps, scripts (D-04)
- [ ] `tsconfig.json` — nodenext / es2022 / strict / `newLine:"lf"` / `noEmitOnError` (D-01/D-03)
- [ ] `vitest.config.ts` — minimal (node defaults suffice)
- [ ] `.gitattributes` — pin committed `.js` to `eol=lf` (RESEARCH Pitfall 1 — freshness false-red mitigation)
- [ ] committed lockfile (`package-lock.json`) + `node_modules/` in `.gitignore`
- [ ] `npm run freshness` script — the D-02 drift gate (rebuild-to-temp → diff)
- [ ] Vitest suites replacing every `*.test.sh`: `install.test.ts`, `guard.test.ts`, `validate.test.ts`, `check-foundation-guards.test.ts` (two-root install cases fold into `install.test.ts`)
- [ ] Reference kit-shipped runnable + RED fixture (TOOL-02 proof)
- [ ] Framework install: `npm install --save-dev typescript vitest @types/node` (versions per RESEARCH)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-platform run on real Windows (not just CI claim) | TOOL-01 | No Windows CI matrix today (deferred); local dev is macOS | UNKNOWN - verify: run `npx vitest run` + `node tools/grugops/<routine>.js` on a Windows host before claiming SC1 cross-platform fully proven |
| Constraint amendment in CLAUDE.md / PROJECT.md (D-13) is human-reviewed | TOOL-01 | Prose amendment, not machine-verifiable | Reviewer confirms TS posture recorded + prior "HELD" notes marked superseded in 12/13/14-CONTEXT |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (all `vitest run`, never `vitest` watch)
- [ ] Feedback latency target set after Wave 0
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
