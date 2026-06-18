---
phase: 22-memory-trajectory-compaction-dialable-token-economy
plan: 05
subsystem: shared-verified-context / memory-compaction
tags: [CMP-02, carve-out-oracle, safety-oracle, oracle-unification, provenance, gap-closure]
status: complete
requires:
  - context-io.ts (parseNote, NOTE_KINDS, currentState, appendNote, admit)
  - scripts/compactor.ts (the carve-out oracle)
provides:
  - "Unified CMP-02 carve-out oracle: failed-attempts + durable notes share ONE id-keyed byte-equal pass"
  - "Single exported canonical frontmatter parser (context-io.parseNote) consumed by the compactor read path (IN-02)"
  - "Raw-side id-collision guard mirroring the promoted-side guard (CR-03)"
  - "kind ∈ NOTE_KINDS validation for every raw + promoted note (WR-03)"
  - "Unparseable-.md fail-closed in readNoteDir (WR-02)"
affects:
  - Phase 23 parallel fan-out (the token tax + laundering surface this hardens before it goes live)
tech-stack:
  added: []
  patterns:
    - "Oracle unification: collapse two enforcement schemes + a duplicated parser into one byte-equal pass so a bypass has no weaker seam to migrate into"
    - "RED→GREEN proof against the COMMITTED .js as the proof of closure for a safety oracle (green unit suite is necessary but NOT sufficient)"
key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.test.ts
    - scripts/compactor.ts
    - scripts/compactor.test.ts
    - scripts/compactor.js
    - scripts/context-io.js
decisions:
  - "FA survival/identity is keyed on the frozen `id`, NOT the body FA-<token> (WR-01); the token is a human-legible naming signal only"
  - "Adopt context-io.parseNote as the single read-path parser; delete the compactor's hand-rolled near-copy (IN-02) — the duplicate-key reject is preserved via the shared parser's duplicateKeys"
  - "Correct prior FA test fixtures that shared the finding's id — a latent id-collision the unification correctly exposed (not a weakening of the oracle)"
metrics:
  duration_minutes: 9
  tasks_completed: 4
  files_modified: 6
  completed: 2026-06-18
---

# Phase 22 Plan 05: CMP-02 Oracle Unification (Round-4 Gap Closure) Summary

Collapsed the two-scheme seam that produced four rounds of CMP-02 carve-out bypasses: failed-attempts and durable notes now flow through ONE id-keyed exact-match + byte-equal pass in `scripts/compactor.ts`, the read path adopts the single exported `context-io.parseNote`, the raw side is id-collision-guarded exactly as the promoted side, every note's `kind` is validated against `NOTE_KINDS`, and an unparseable `.md` fails closed naming the file. Both named bypasses (CR-03 raw-side id collision; CR-01 failed-attempt provenance laundering) were demonstrated RED→GREEN against the committed `.js`.

## What Shipped

| Task | What | Commit |
|------|------|--------|
| 1 | Export `parseNote` + `ParsedFrontmatter` from context-io.ts (IN-02); add the shared-parser contract test | `13394b4` |
| 2 | Round-4 CMP-02 cases RED-first (CR-03, CR-01, per-field FA, collision/kind/unparseable, faithful-FA, generalized field×kind sweep) | `ec252b0` |
| 3 | Unify the oracle: fold the FA path into the byte-equal pass, raw-side collision guard, kind validation, unparseable fail-closed, adopt the shared parser, affirm the docstring | `7462c5f` |
| 4 | Byte-fresh rebuild of both committed `.js`; prove the RED→GREEN transition; freshness + full non-e2e regression | `96ab418` |

## Proof of Closure (green ≠ proof)

Both named reproductions were run as fixtures against the COMMITTED `scripts/compactor.js`, observed exit 0 against the pre-fix build (commit `ec252b0`) and exit 1 against the post-fix build:

```
RED  (pre-fix committed .js, ec252b0):
  CR-03 (raw collision)  exit=0   ← bypass present
  CR-01 (FA laundering)  exit=0   ← laundering succeeds

GREEN (post-fix committed scripts/compactor.js):
  CR-03  exit=1  → "two durable raw notes share the id 20260617T142305Z-engineer-finding-dup …"
  CR-01  exit=1  → "field 'by' altered … from 'engineer' to 'attacker'"
                   "field 'verified_by' (value '§14-gate#RUN-1') dropped to empty …"
```

The generalized parameterized sweep (every load-bearing field × all six kinds, including failed-attempt) is fully green; its FA rows were among the 12 RED-baseline failures against the pre-fix `.js` (captured in Task 2's run), confirming each bypass was reproduced, not a fixture error.

## Verification Evidence

- `npx vitest run scripts/context-io.test.ts --exclude '**/scripts/e2e/**'` — GREEN (32 passed; the exported-parser contract case + all prior context-io cases).
- `npx vitest run scripts/compactor.test.ts --exclude '**/scripts/e2e/**'` — GREEN (64 passed; the round-4 cases + all rounds 1–3 + 22-04 cases).
- `npm run freshness` — exit 0 ("All build outputs fresh: 17 committed .js file(s) match a fresh tsc rebuild") — both `compactor.js` and `context-io.js` are byte-fresh (D-13). REQUIRED completion evidence.
- `npx vitest run --exclude '**/scripts/e2e/**'` — GREEN (16 files, 280 passed, 1 skipped). The live e2e lane was NOT run (no bare `npm test`).
- Structural grep checks all pass: the only `kind === "failed-attempt"` reference is the unconditional-required-survival flag (not a byte-equal skip); the raw-side `seenRawIds`/`collidingRawIds` collision guard exists; `NOTE_KINDS` is imported and used; `parseNote` is adopted and the second hand-rolled fence regex is gone; `_dial` appears only in the signature; the docstring (lines 16–22) is affirmed, not weakened.

## Threat Mitigations Applied

| Threat | Disposition | Status |
|--------|-------------|--------|
| T-22-05-01 (CR-03 raw-side id collision) | mitigate | DONE — raw-side `seen`-id guard names the colliding id; RED→GREEN proven |
| T-22-05-02 (CR-01 FA provenance laundering) | mitigate | DONE — FA exemption removed; FAs run the byte-equal field loop; RED→GREEN proven |
| T-22-05-03 (FA survival on a forgeable token, WR-01) | mitigate | DONE — survival/identity keyed on the frozen id; FA-token-collision case green |
| T-22-05-04 (kind relabel onto a weaker path, WR-03) | mitigate | DONE — kind ∈ NOTE_KINDS validated up front; unknown-kind case green |
| T-22-05-05 (unparseable .md silently dropped, WR-02) | mitigate | DONE — readNoteDir fails closed naming the file; unparseable case green |
| T-22-05-06 (read-path parser drift, IN-02) | mitigate | DONE — single exported parseNote adopted; hand-rolled copy deleted; duplicate-key reject preserved |
| T-22-05-SC (npm/dev installs) | accept | N/A — zero external packages installed (node:fs/path/crypto only) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Prior FA test fixtures shared the finding's id (latent id-collision exposed by unification)**
- **Found during:** Task 3 (the unified oracle put failed-attempts into the same id-keyed pass).
- **Issue:** Several rounds-1–3 inline fixtures built a failed-attempt via `noteText({ kind: "failed-attempt", ... })` without an `id:` override, so the FA inherited the finding's hardcoded `id: …seed0001`. The pre-fix code masked this because FAs were excluded from `promotedById`/`rawDurable`. The unified oracle correctly flagged it as a raw + promoted id collision.
- **Fix:** Gave each inline FA fixture a distinct id (`…failed-attempt-fa1` / `-fa2` / `-nofa`). This is a fixture correction, not an oracle weakening — the collision detection is the intended new behavior.
- **Files modified:** `scripts/compactor.test.ts`
- **Commit:** `7462c5f`

**2. [Rule 2 — Required for correctness, WR-01] Restated the prior "no recoverable FA-id" case to the id-keyed contract**
- **Found during:** Task 3.
- **Issue:** A rounds-1–3 case asserted that a failed-attempt with no body `FA-<token>` is a violation naming the *filename*. WR-01 moves FA identity from the forgeable body token to the frozen `id`, so a missing token is no longer a violation by itself — a dropped FA is now named by its `id`.
- **Fix:** Rewrote the case to assert a dropped failed-attempt refuses naming its frozen id (the WR-01 contract). The "refuse on drop" semantic is preserved.
- **Files modified:** `scripts/compactor.test.ts`
- **Commit:** `7462c5f`

Both deviations are direct consequences of the locked architectural choice (oracle unification) and were committed with the implementation. No architectural (Rule 4) decisions arose.

## Closed-Defense Regression Check

No rounds-1–3 defense regressed: the id-keyed exact 1:1 match, the asymmetric required-survival set (currentState folds out only soft non-verified notes), unconditional survival of §14-gate-verified findings against a raw- or promoted-side supersedes fold, the read-path duplicate-key reject, the missing-threadDir fail-closed CLI guard, and dial-invariance (D-05 — `_dial` never read in a branch) all still hold, confirmed by the full prior suite staying green (280 passed).

## Scope Boundary

CMP-01 and CMP-03 were untouched (no edits to plans 22-01 / 22-02 artifacts beyond the shared `compactor.ts/.js/.test.ts` + `context-io.ts/.js/.test.ts` files this plan owns). They remain SATISFIED.

## Known Stubs

None — no hardcoded empty/placeholder values were introduced; all new code is wired and exercised by tests.

## Self-Check: PASSED

All six modified source files and the SUMMARY exist on disk; all four task commits (`13394b4`, `ec252b0`, `7462c5f`, `96ab418`) are present in git history.
