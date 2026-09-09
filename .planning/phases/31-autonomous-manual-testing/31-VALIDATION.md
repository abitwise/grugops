---
phase: "31"
slug: "autonomous-manual-testing"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-07"
---

# Phase 31 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ~4.1.8 (`globals: false` — test functions imported explicitly) |
| **Config file** | repo root; `tsconfig.tests.json` for test typechecking |
| **Quick run command** | `npx vitest run --exclude '**/scripts/e2e/**' <files>` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` then `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness` |
| **Estimated runtime** | ~30 seconds for a targeted file; ~2 minutes for the excluded-e2e full suite |

**Never run bare `npm test`.** It resolves to `vitest run`, which pulls in
`scripts/e2e/uat-live.test.ts` — the live `claude --print` lane. On an authed box that spends tokens
and can hang for roughly eight minutes. The exclusion above is the project's standing convention.

---

## Sampling Rate

- **After every task commit:** `npx vitest run --exclude '**/scripts/e2e/**' <the task's test file>`
  plus `npx tsc --noEmit`
- **After every plan wave:** add `npm run build`, `npm run check:build-parity`, `npm run freshness`,
  `npm run freshness:context`, and `node scripts/check-foundation-guards.js`
- **Before `/gsd-verify-work`:** the excluded-e2e full suite green, plus the four derived text gates
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 31-01-01 | 01 | 1 | UATX-04 | — | N/A (decision checkpoint) | human | human-check in transcript | N/A | ⬜ pending |
| 31-01-02 | 01 | 1 | UATX-01, UATX-04 | T-31-01, T-31-02, T-31-05 | A stale-SHA evidence note is refused naming both SHAs and nothing is written; a fabricated gate stamp with no live verdict is still refused | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts` | ✅ existing, new cases | ⬜ pending |
| 31-01-03 | 01 | 1 | UATX-04 | T-31-03, T-31-04 | A newline or non-hex value in a provenance field is refused before composition | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts scripts/compactor.test.ts` | ✅ existing, new cases | ⬜ pending |
| 31-02-01 | 02 | 1 | UATX-05, UATX-06 | T-31-06, T-31-08 | A missing parser or unusable browser exits 2 with a byte-exact marker; a path escaping the repo root is a could-not-run finding | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts` | ❌ W0 | ⬜ pending |
| 31-02-02 | 02 | 1 | UATX-06 | T-31-10 | Every banned arm is refused, the union of arms is reported together, and an adversarial clean fixture is accepted | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts` | ❌ W0 | ⬜ pending |
| 31-02-03 | 02 | 1 | UATX-06 | T-31-07 | A zero-element or short scan exits 2 and cannot print a pass | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts` | ❌ W0 | ⬜ pending |
| 31-03-01 | 03 | 2 | UATX-02, UATX-03 | T-31-SC, T-31-13, T-31-14 | Every documented registration is pinned; the content hash is described as a recomputable digest, never as tamper-proof | gate | `npm run check:imperative-lexicon && npm run check:banned-claims && npm run check:public-docs && npm run check:claim-anchors` | ✅ existing | ⬜ pending |
| 31-03-02 | 03 | 2 | UATX-02 | T-31-11, T-31-12 | A zero-occurrence scan and a missing pin source both fail loudly; the guard declares no version of its own | unit + gate | `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-foundation-guards.test.ts` then `node scripts/check-foundation-guards.js` | ✅ existing, new cases | ⬜ pending |
| 31-04-01 | 04 | 3 | UATX-05, UATX-06 | T-31-17, T-31-19 | Exit 2 is documented as an error distinct from a clean fail; a skip is an unstamped observation note and the ticket stays In UAT | gate | `node scripts/validate-agent-factory.js && node scripts/check-foundation-guards.js` | ✅ existing | ⬜ pending |
| 31-04-02 | 04 | 3 | UATX-02, UATX-03 | T-31-16, T-31-18 | The shipped acceptance default is unchanged and no floor moved | unit + gate | `npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts` | ✅ existing | ⬜ pending |
| 31-04-03 | 04 | 3 | UATX-01, UATX-03 | T-31-15 | The reserved-identity author set has exactly one member and the documented lane carries no route into it; both assertions watched fail against seeded fixtures | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/chrome-lane-bar.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/runnable-ref/uat-spec-integrity.test.ts` — created RED-first inside plan 31-02 task 1
      (spawnSync against the committed `.js`, which does not exist yet); covers UATX-05 and UATX-06
- [ ] `scripts/runnable-ref/fixtures/*.uat.spec.ts` — one clean adversarial fixture, one per D-14
      arm, one union fixture; the directory already exists
- [ ] `scripts/chrome-lane-bar.test.ts` — created inside plan 31-04 task 3; covers UATX-03's
      structural bar
- No framework install is needed: vitest and typescript are already dev dependencies.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The attended Chrome lane opening at all, and pausing for the human on a login page | UATX-03 | Requires an attended Claude Code session with the browser extension installed, a direct plan login, and a visible window. Not reachable in CI and not reachable on this box (the extension is not connected). | Follow `agent-factory/checklists/browser-uat-recipe.md` §attended lane on a machine with the extension installed; confirm the lane produces only a human-stamped finding and an artifact-ref, and no gate stamp. |
| Both browser probes on Windows | UATX-05 | `UNKNOWN - verify` per the standing Windows posture; not testable on darwin. | On a Windows host, remove the browser binaries and confirm the runnable exits 2 with the browser-absent marker. |
| The auth-posture probe on an API-key-only box and under a long-lived setup token | UATX-03 | Research assumptions A2/A3 — neither configuration is reachable without destroying this box's real credentials. | On a box with no interactive login, run the probe and record which clause of the positive conjunction fails; confirm the skip names it. |
| A host repository re-running the installer to pick up the new runnable | UATX-06 | Requires a second repository with a prior grugops install. | Install into a scratch repo at the previous release, upgrade, re-run the installer, confirm `tools/grugops/uat-spec-integrity.js` appears and the uninstaller removes it. |

---

## Edge-probe rows (spec-less fallback)

The phase has no SPEC, so the deterministic edge probe ran over the phase requirement IDs and
returned 8 applicable rows, all `unresolved`. Each is dispositioned below; no row is silently
dropped. **No-silent-drop equality: 8 == 8 authored into `must_haves.truths` + 0 flagged.**

| Req | Category | Disposition | Where it landed |
|---|---|---|---|
| UATX-01 | unclassified | resolved (explicit) | 31-01 truth: only the verdict carve-out authors a reserved-identity note; a stamp with no live verdict is refused |
| UATX-02 | adjacency | resolved (backstop) | 31-03 truth (flat-scalar backstop marker): an occurrence exactly equal to the pin passes; any other version is its own finding; equal occurrences never merge into one row |
| UATX-02 | empty | resolved (explicit) | 31-03 truth: a zero-occurrence scan FAILS as the anomaly it is rather than printing a pass |
| UATX-02 | ordering | resolved (explicit) | 31-03 truth: the scan set is sorted by repo-relative path, so findings and the pass line are byte-identical across runs and platforms |
| UATX-03 | unclassified | resolved (explicit) | 31-04 truth: the derived reserved-identity author set has exactly one member, count asserted, and the documented lane carries no route into it |
| UATX-04 | unclassified | resolved (explicit) | 31-01 truth: a mismatched-SHA artifact-ref is refused with both SHAs named and nothing written |
| UATX-05 | unclassified | resolved (explicit) | 31-02 truth: a forced-unavailable probe writes the exported marker byte-for-byte and exits 2, never 0 or 1 |
| UATX-06 | unclassified | resolved (explicit) | 31-02 truths: each arm refused, clean fixture accepted, union of arms reported together, derived count asserted |

---

## Prohibitions (spec-less fallback, recall → precision)

The phase has no SPEC prohibitions section, so the two-stage recall protocol ran in-prompt. Stage 1
over-produced; stage 2 dropped routine-engineering items and kept values/safety/transparency items.
Each kept item is authored **descriptor-less** into the owning plan's `must_haves.prohibitions:`
block, so each disposes flagged-unverified. **No-silent-drop equality: 5 kept == 5 authored + 0
flagged-unresolved.**

| # | Prohibition | Plan |
|---|---|---|
| P-01 | A skipped, refused or unrecordable verification must never be reported or recorded as a pass. | 01, 02 |
| P-02 | A documented claim about the ban set must never be broader than the mechanism that enforces it. | 02 |
| P-03 | An agent must never author the witnessing human's name. | 04 |
| P-04 | The content hash must never be described as tamper-proof or as a security token. | 01, 03 |
| P-05 | Green machine evidence must never advance a ticket past the acceptance checkpoint unless the repository explicitly lowered it. | 04 |

**Canon-referral drops (breadcrumbs, deliberately not minted as prohibitions):**
- Path traversal over target-supplied spec paths — canon (ASVS V12); owned by threat T-31-08.
- Newline field-injection into the provenance fence — canon (injection); owned by threat T-31-03 and
  the existing single-line field guard.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 31s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

## Standing human-verification items — carried forward through gap-closure round 5

> Recorded by plan `31-20` (the round-5 closing measurement) on 2026-09-09. **None of the four is
> closed by this round, and none is dropped.** Every `UNKNOWN - verify` marker below is intact and
> carried verbatim from `31-VERIFICATION.md`'s `human_verification:` block. A gap-closure plan may
> not close a human-verification item, and an item closed by inference is not closed.

**Carry-forward count: 4 items, unchanged, now carried through rounds 2, 3, 4 and this round's
closing measurement (round 5).** The round-4 verification recorded them as "4 items, all pre-existing
`UNKNOWN - verify` / manual-only items … none newly discovered by this verification, carried forward
unchanged through rounds 2, 3 and 4". This round adds no item and closes none.

| Id | Item | Expected | Why it is human-only | Status after round 5 |
|---|---|---|---|---|
| `R-01` | The attended Claude-in-Chrome lane opens under real interactive auth, pauses for a human on a login/challenge page, and produces only a human-stamped finding + artifact-ref (never a gate stamp). | The lane behaves as documented in `agent-factory/checklists/browser-uat-recipe.md`'s attended lane; no route to a `§14-gate` stamp is exercised in practice. | Requires an attended Claude Code session with the Claude-in-Chrome browser extension installed and a real interactive login. Not reachable in CI and not reachable on this box. | **OPEN — `UNKNOWN - verify`.** Carried unchanged through rounds 2, 3, 4, 5. `scripts/chrome-lane-bar.test.ts`'s **structural** bar is green (part of the 62-file suite re-measured in `docs/audit/31-round4-residuals.md` §6.1); the lane's real interactive behaviour is **not** inferred from the bar. |
| `R-02` | The `claude auth status --json` fail-closed predicate (D-10) behaves correctly on an API-key-only box and under a long-lived setup token. | Both configurations are a loud skip naming the failing clause, never a silent open. | Research assumptions A2/A3 are `UNKNOWN - verify`; neither configuration is reachable without destroying this box's real credentials. | **OPEN — `UNKNOWN - verify`.** Carried unchanged through rounds 2, 3, 4, 5. |
| `R-03` | Both browser-absence probe stages, and the whole spec-integrity runnable, on a **Windows** host. | Exit 2 with the browser-absent marker when browsers are missing; parser-absent marker when `typescript` cannot be resolved. | `UNKNOWN - verify` per the standing Windows posture (`.planning/WINDOWS.md`); not testable on darwin. | **OPEN — `UNKNOWN - verify`.** Carried unchanged through rounds 2, 3, 4, 5. Every probe in this round's pairing table ran on darwin only; the Windows leg of each is untouched. |
| `R-04` | A host repository that installed grugops before this release re-runs the installer and picks up `tools/grugops/uat-spec-integrity.js`; the uninstaller removes it. | The new runnable is materialized on re-install and cleanly removed on uninstall. | Requires a second scratch repository with a prior grugops install at an earlier release; not exercised by the unit suite. | **OPEN — `UNKNOWN - verify`.** Carried unchanged through rounds 2, 3, 4, 5. |

**What this round did to them: nothing, deliberately.** `31-20` runs no attended browser session, no
alternative auth configuration, no Windows host and no second scratch repository. Each item is
restated here so the next verification round finds them in a register rather than rediscovering them,
and so that "carried forward" is a recorded fact with a count rather than an assumption.
