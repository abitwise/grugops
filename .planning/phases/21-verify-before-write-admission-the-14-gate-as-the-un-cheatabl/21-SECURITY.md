---
phase: 21
slug: verify-before-write-admission-the-14-gate-as-the-un-cheatabl
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-17
---

# Phase 21 — Security (verify-before-write admission)

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Phase:** 21 — verify-before-write admission (the §14 gate as the un-cheatable verifier)
**Audit type:** declared-mitigation verification (register authored at plan time — no retroactive STRIDE scan)
**ASVS Level:** 1 · **block_on:** high
**Verdict:** SECURED — 17/17 threats resolved (14 mitigate CLOSED, 3 accept CLOSED-by-accept with bounds verified)

All implementation files were READ-ONLY in this audit; nothing was modified except this report.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| agent → shared context | An agent authors a note that enters the verified context; the `verified_by` stamp + gate verdict are the trust signal. | note frontmatter (`kind`, `by`, `verified_by`) |
| validator text path → admission read path | Structural check trusts only note text; admission check trusts only a live GREEN verdict it reads back (Posture B). | `§14-gate#<id>` stamp ↔ live verdict record |
| §14 gate → shared context | The gate is the root of the verification chain; the verdict it emits is the trust anchor downstream findings reference. | green verdict note (`by: §14-gate`, per-run id) |
| workflow/role prose → context-io.ts | Gate + 17 roles write ONLY via the sanctioned `context-io.ts` path; raw writes forbidden (`guard_context_writes`). | delegated write call (by name, no raw path) |
| on-disk note bytes (any line ending) → parseNote | git autocrlf / editors / cross-platform checkout can change a committed note's line endings; encoding must not change which notes are visible. | CRLF/CR/LF note bytes |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-21-01 | Spoofing | `verified_by` stamp on a finding | mitigate | D-09 refuse-self FAIL set gated on `kind === "finding"`: empty/`self`/`me`/`agent`/`==by`/DeLM-phrase/non-grammar all structurally FAIL — `scripts/context-io.ts:281-313`; fixtures `context-io.test.ts:327-408` | closed |
| T-21-02 | Tampering | `by: §14-gate` impersonation on plain validate path | mitigate | D-02 reserved-identity: `by === GATE_IDENTITY && !trustedGateEmission` is a structural FAIL — `context-io.ts:273-279`; only the D-04 emission carve-out exempt (flag L239, set only by `emitVerdict` L509); fixture `:428-437` | closed |
| T-21-03 | Elevation of Privilege | format-trusting a `§14-gate#<id>` stamp w/o a real verdict | mitigate | D-01 Posture B: `admit()` admits ONLY if `currentState(readContext(...))` has a live green verdict matching that id (`isLiveGreenVerdict` L463-470) — `context-io.ts:529-559`; fixtures `:441-474` | closed |
| T-21-04 | Repudiation/fabrication | silently degrading a refused finding to a passing claim | mitigate | D-11 strict-reject: `admit` never rewrites kind (`context-io.ts:535-537`); `appendNote` hard-throws (L396-398); CLI exits 1 naming the fault (L679-682); no finding→claim mutation in source | closed |
| T-21-05 | Tampering (residual) | a determined agent commits an obvious forged verdict note | accept | Documented honestly (D-02) — every grugops surface is a writable file; deliberate forgery reduced to a loud git-auditable impersonation; un-forgeable human signal → Phase 25. See Accepted Risks Log. | closed |
| T-21-06 | Spoofing | a non-gate author emitting a `by: §14-gate` verdict | mitigate | D-04 narrow carve-out: `emitVerdict` (`context-io.ts:479-520`) is the ONLY path setting `trustedGateEmission=true` (L509); gate workflow calls it by name (`05-pr-quality-gate.md:47`) | closed |
| T-21-07 | Tampering | reusing a ticket id so one stale verdict admits many findings | mitigate | D-03 unique per-run id from `node:crypto` (NOT ticket id) — `05-pr-quality-gate.md:49`; superseded/withdrawn verdict folded out by `currentState` (`context-io.ts:548`) | closed |
| T-21-08 | Repudiation/fabrication | emitting a green verdict on a non-green result | mitigate | D-11: verdict emitted ONLY on `READY_FOR_HUMAN_REVIEW` — `05-pr-quality-gate.md:47`; blocked/split emit none; refused finding → `UNKNOWN - verify` (L51) | closed |
| T-21-09 | Tampering | forking gate logic into another workflow (drift) | mitigate | D-15 single-source: `git show --name-only d8279d4` → only `05-pr-quality-gate.md` changed; no other workflow forked the gate logic | closed |
| T-21-SC | Tampering | inlining a raw context write that bypasses context-io.ts | mitigate | `guard_context_writes` scans the workflow (`check-foundation-guards.ts:518`) — PASS; write delegated by name to `context-io.ts` (`05-pr-quality-gate.md:47`); no write token co-occurs a `.grugops/context/` path | closed |
| T-21-10 | Tampering | doc↔code drift (schema grammar vs validate() regex) | mitigate | Lockstep: worked example `§14-gate#ABC-001` (`context-note.md:157`) matches `/^§14-gate#[A-Za-z0-9._-]+$/` (`context-io.ts:111`), node-verified; hedge count 0 | closed |
| T-21-11 | Tampering | a role restating/forking the protocol | mitigate | D-14 literal-SC-3-light: all 17 roles carry exactly ONE terse WF16 pointer, referenced not restated (e.g. `roles/orchestrator.md:128`); single-source guard correctly flagged Phase 24 | closed |
| T-21-12 | Tampering | a raw context write smuggled into a role/workflow pointer | mitigate | `CTX_SCAN` scans 17 roles + 16 workflows (`check-foundation-guards.ts:530`); `guard_context_writes` PASS — pointer is pure prose naming the workflow file | closed |
| T-21-13 | Repudiation | silently loosening a role-size ceiling to absorb the pointer | mitigate | D-07: `npm run freshness` exit 0 (committed guard `.js` faithful); harness 25 passed; 9 ceiling bumps documented in `21-03-SUMMARY.md` — ceilings flip with the change | closed |
| T-21-14 | Info disclosure/scope creep | pulling Phase-24 rewiring or handoff deletion into this seam | accept | D-14 scope discipline: deep rewiring + 17 handoff deletions + single-source guard deferred to Phase 24; bound verified — NO handoff deletions in git. See Accepted Risks Log. | closed |
| T-21-04-01 | DoS/Availability | `admit()` wrongly refusing a CRLF-encoded legitimate verdict (CR-01) | mitigate | `parseNote` normalizes `\r\n`→`\n` then `\r`→`\n` before the fence match — `context-io.ts:189-190` (single choke point feeding `validate` + `readContext`); CRLF round-trip fixtures `context-io.test.ts:530-573` GREEN; fails SAFE | closed |
| T-21-04-02 | Tampering (no new surface) | the normalization itself broadening what admits | accept | Bound verified — `git show 51f3b24` adds ONLY the normalize line in `parseNote`; no new grammar/field/write path; `assertSingleLine` CR/LF reject (`context-io.ts:160-166`) untouched. See Accepted Risks Log. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-21-01 | T-21-05 | Every grugops surface is a writable file; the design makes cheap/accidental cheats impossible and reduces a deliberate cheat to a loud, git-auditable forgery. The un-forgeable human-set signal is Phase 25. Mirrors the documented `hooks/guard.ts` env-var-indirection residual. Honestly documented (`21-CONTEXT.md:45-52, 231-237`), not papered over. | D-02 decision (Phase 21 plan, human-ratified) | 2026-06-17 |
| AR-21-02 | T-21-14 | Deep context rewiring, the 17 handoff deletions, and the `guard_context_protocol_single_source` guard are scoped to Phase 24; this phase adds only the one-line pointer and WF16 coexists with handoffs. Bound verified: NO handoff deletions; role edits additive (34 ins / 0 del). | D-14 decision (Phase 21 plan, human-ratified) | 2026-06-17 |
| AR-21-03 | T-21-04-02 | CR-01 normalizes ONLY line endings before the existing fence match — no new accepted grammar, field, write path, or external input surface. `assertSingleLine` (rejects CR/LF in composed fields) is untouched, so a forger still cannot smuggle frontmatter via embedded newlines. | D-13/CR-01 decision (Phase 21 plan, human-ratified) | 2026-06-17 |

*Accepted risks do not resurface in future audit runs.*

---

## Verification commands run (read-only)

- `npm run freshness` → exit 0 (committed `.js` files byte-match a fresh `tsc` rebuild — D-15)
- `npx vitest run scripts/context-io.test.ts` → 29 passed
- `npx vitest run scripts/check-foundation-guards.test.ts` → 25 passed
- `node scripts/check-foundation-guards.js` → ALL CHECKS PASSED (one pre-existing A3 Tier-2 CC-native-parity WARN, unrelated to Phase 21)
- `npx vitest run --exclude '**/scripts/e2e/**'` → 188 passed, 1 skipped (no regression; live-CLI lane excluded per constraint)
- `git show --name-only d8279d4` → Plan-02 changed only `agent-factory/workflows/05-pr-quality-gate.md`
- `git log --diff-filter=D … agent-factory/handoffs/` → no handoff deletions in Phase 21
- `git show 51f3b24 -- scripts/context-io.ts` → CR-01 fix touched only `parseNote`; `assertSingleLine` unchanged

---

## ASVS Level 1 notes

- **V5 (Validation):** structural `validate()` is pure text→findings (D-10), with anchored allowlist grammars (`GATE_STAMP_RE`, `HUMAN_STAMP_RE`) and a deliberate non-substring DeLM phrase matcher. PASS.
- **V12 (Files):** pre-existing path-traversal mitigation `assertSafeTask` (`^[A-Za-z0-9._-]+$`) intact and applied on every context read/write path. PASS.
- **Field-injection (CR-01 prior phase):** `assertSingleLine` + duplicate-key detection both intact and unaffected by the Phase-21 CRLF fix. PASS.

---

## Unregistered Flags

None. The SUMMARY files' "Threat surface scan" / "Deviations" sections report no new attack surface beyond the plan-time register. The two auto-fixed deviations in Plan 01 (Phase-20 GOOD fixtures becoming FAILs under D-09; `emitVerdict` tripping its own refuse-self rule, resolved via the D-04 carve-out) are consequences of the declared mitigations, not new surface. The Plan 03 catalog regen (17th workflow) is a generated-docs gate, not security surface.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-17 | 17 | 17 | 0 | gsd-security-auditor (opus) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-17

No OPEN threats. No BLOCKERs. Every declared mitigation was located in the named implementation files with concrete file:line evidence and exercised by green tests; every accepted risk is honestly documented with its bound verified by git/source inspection. Phase 21 is cleared to ship from a threat-mitigation standpoint.
