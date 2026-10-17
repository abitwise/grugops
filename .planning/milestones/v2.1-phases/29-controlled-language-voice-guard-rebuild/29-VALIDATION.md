---
phase: 29
slug: controlled-language-voice-guard-rebuild
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-13
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `29-RESEARCH.md` § *Validation Architecture*. Every command below was run or read
> against the tree at HEAD; nothing here is estimated.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `~4.1.8` |
| **Config file** | `vitest.config.ts` (dev-only, no committed `.js` twin — correct) |
| **Quick run command** | `npx vitest run scripts/<name>.test.ts` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Estimated runtime** | ~60 seconds (full, e2e excluded) |
| **Current baseline** | 46 test files · 1,561 passed · 2 skipped |

> **NEVER run bare `npm test`.** It triggers the live claude-CLI e2e lane, which spends tokens
> (~8 min, can hang) on an authenticated box. `29-RESEARCH.md` §F-1 has the detail.

---

## Sampling Rate

- **After every task commit:** `npx vitest run scripts/<file-touched>.test.ts` **and**
  `node scripts/check-foundation-guards.js`
- **After every plan wave:** `npm run build && npm run typecheck && npm run freshness && npx vitest run --exclude '**/scripts/e2e/**'`
  (all six freshness gates must be green — every new `.ts` adds a committed `.js` twin that must
  byte-match a fresh rebuild)
- **Before `/gsd-verify-work`:** the full ubuntu CI block (`.github/workflows/ci.yml:78-228`) green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

Task IDs are assigned by the planner. This map fixes the **requirement → proof** binding the tasks
must satisfy; the planner fills the Task ID and Plan columns.

| Task ID | Plan | Wave | Requirement | Behavior verified | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-------------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | LANG-01 | profile document exists, carries the non-affiliation + not-certified disclaimer, vendors no dictionary entry | unit | `npx vitest run scripts/check-banned-claims.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | LANG-02 | governed corpus derives to 47 files / 152,852 B (D-36); the `GENERATED` ASVS checklist is excluded by derived rule with a two-sided cardinality assert (D-42); fenced caveman blocks untouched | unit | `npx vitest run scripts/check-imperative-lexicon.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | LANG-03 | frozen set derives from all three D-01 sources; RED on a changed frozen sentence absent its same-commit companion edit; every other changed sentence requires a disposition row | unit + fixture | `npx vitest run scripts/check-diff-disposition.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | LANG-04 | guard named `guard_imperative_lexicon` (D-39); zero ASD-STE100-conformance, token-economy or LLM-comprehension claims in the kit; **planted fixture** proves non-vacuity (D-44) | unit + planted fixture | `npx vitest run scripts/check-banned-claims.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | LANG-05 | no duplicate normalized **clause** within a role file (D-38, Variant C); RED on ≥9 of 17 files before the de-duplication pass lands | unit | `npx vitest run scripts/check-foundation-guards.test.ts -t uniqueness` | ⚠️ extend existing | ⬜ pending |
| TBD | TBD | TBD | LANG-06 | RED on 17/17 current blocks **and** the three discriminating fixtures resolve correctly (D-43) — positive-only → RED, negative-only → RED, both → GREEN | unit + fixture | `npx vitest run scripts/voice-model.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | LANG-07 | one fence reader; all three malformed forms (`missing`, `unterminated`, `multiple`) refuse **identically in both consumers** (D-23) | unit + parser-oracle sweep | `npx vitest run scripts/voice-model.test.ts -t fence` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | LANG-08 | every role ≤ its previous ceiling, table edited exactly once at end of phase, delta recorded | one-shot measured transcript (D-27) | `node scripts/check-foundation-guards.js` + the re-baseline plan's SUMMARY transcript | ✓ guard exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/voice-model.ts` + `scripts/voice-model.test.ts` — the single fence authority and the
      lexicon sets (LANG-06, LANG-07)
- [ ] `scripts/check-imperative-lexicon.ts` + `.test.ts` — LANG-02, LANG-04
- [ ] `scripts/check-banned-claims.ts` + `.test.ts` — LANG-04
- [ ] `scripts/check-diff-disposition.ts` + `.test.ts` — LANG-03
- [ ] **shared element-level vacuity module + tests — AP-1, severity `blocking`.** One rule, not four
      one-off `=== 0` checks. This phase ships four guards and is the phase most exposed to AP-1.
- [ ] extend `scripts/check-foundation-guards.test.ts` for the two new in-aggregator guards
- [ ] `scripts/kit-model.ts`: `listRoleDisplayNames()` / `listWorkflowDisplayNames()` with two-sided
      count assertions against `ROLE_COUNT` / `WORKFLOW_COUNT` (D-40)
- [ ] fixture corpus: 3 voice-discrimination blocks (D-43), 3 malformed-fence forms (D-23), 1 planted
      banned claim (D-44)

*Framework install: none needed — Vitest is already the project's test runner.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The profile document reads as a coherent, honest derivation rather than a rule dump | LANG-01 | Prose quality is not mechanically decidable — this is exactly the honesty LANG-04 protects | A named human reads `docs/` profile end to end and confirms: the disclaimer is present and unhedged, no ASD dictionary content is reproduced, and the D-16 surface split (build-time gate over kit files vs runtime instruction) is stated explicitly in the claim |
| The rewritten caveman blocks carry real voice, not lexicon-token sprinkling | LANG-06 | The guard proves the floor, not the quality — a block can pass at N tokens and still read as plain English wearing a hat | A named human reads all 17 rewritten blocks and confirms each reads as caveman voice, and that no block states a fact not stated once in clear voice elsewhere in the same file (D-09) |
| The byte-ceiling delta is honest | LANG-08 | D-27 deliberately uses a one-shot transcript rather than a permanent fixture, because the "before" build stops existing once the edit lands | A named human compares the re-baseline plan's SUMMARY transcript against the git-previous `roleCeiling()` table and confirms every one of the 17 values is ≤ its predecessor |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references above
- [ ] No watch-mode flags (`vitest run`, never bare `vitest`)
- [ ] Feedback latency < 60s
- [ ] Every one of the four new guards was **watched failing RED against the real tree** before its
      conforming rewrite landed (Phase 28 D-24) — and for the two near-vacuous ones, RED evidence
      comes from a planted fixture, not from today's tree (D-43, D-44)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
