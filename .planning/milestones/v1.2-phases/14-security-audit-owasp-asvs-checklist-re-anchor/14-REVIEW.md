---
phase: 14-security-audit-owasp-asvs-checklist-re-anchor
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - scripts/generate-asvs-checklist.mjs
  - scripts/check-foundation-guards.sh
  - scripts/check-foundation-guards.test.sh
  - agent-factory/workflows/15-security-audit.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/security-nfr.md
  - agent-factory/handoffs/security-nfr-handoff.md
  - agent-factory/checklists/security-nfr-checklist.md
  - scripts/asvs/asvs-5.0.0.flat.json
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-06-13T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed the Phase 14 security-audit re-anchor: the zero-dependency ASVS checklist generator, the
POSIX-sh foundation-guards aggregator and its fail-proof test harness, the security-audit workflow,
and the touched role/handoff/checklist surfaces.

Verification performed live: ran the guard (GREEN) and its test harness (GREEN); confirmed the
generator is byte-reproducible (`cmp -s` against the committed checklist — identical); validated the
ASVS JSON (345 requirements, 17 chapters, levels 70/183/92, all fields present, all `L` string-typed,
not truncated); traced the awk fence-strip + per-phrase voice neutralization; and cross-checked the
severity map (L1→high, L2→medium, L3→low) and active-set counts (70/253/345) across the workflow,
role, handoff, and generated intro — all consistent. All referenced files and config keys exist.

The implementation is disciplined: the shell guards correctly handle missing-file, malformed-fence,
quoted-grant, and single-opener-sand edge cases, with each prior fix (CR-01/CR-02/WR-01..05) documented
inline. No blockers found. Two warnings (a missing integrity assertion and a comment claiming a
safeguard that doesn't ship) and two info-level items.

## Warnings

### WR-01: Generator gates row count but never re-asserts the cumulative-level total

**File:** `scripts/generate-asvs-checklist.mjs:71-93`
**Issue:** The fail-closed guard asserts `requirements.length === 345` (line 71) but the cumulative-level
math (lines 90-93: `l1`, `l2cum`, `l3cum`), which is printed into the checklist's honesty statement, is
never asserted to equal the row count. If the vendored source were tampered so any `L` value falls
outside `{"1","2","3"}` (a typo `"L1"` for `"1"`, or an injected level-4 row) while the count stays 345,
the generator silently emits a checklist whose intro states the wrong active-set sizes (verified: an
out-of-range `L` yields `0 at L1, 0 at L2, 0 at L3`) and still writes the file. For a fail-closed integrity
tool whose stated purpose (T-14-03) is "a partial or garbled checklist never ships," this level-tampering
vector slips past the count gate.
**Fix:**
```js
// after line 93
if (l3cum !== EXPECTED_ROWS) {
  fail(
    `${SRC}: level tags do not sum to ${EXPECTED_ROWS} ` +
      `(L1=${l1}, +L2=${l2cum - l1}, +L3=${l3cum - l2cum}) — ` +
      `refusing to write a checklist with unrecognized assurance levels`,
  );
}
```

### WR-02: Generator comment asserts an automated reproducibility check that does not ship

**File:** `scripts/generate-asvs-checklist.mjs:27`
**Issue:** The header states "The reproducibility cmp check (V-2) catches silent drift on top of this."
V-2 is a one-time MANUAL validation step in the plan (`14-01-PLAN.md:105`, `14-VALIDATION.md:49`), not an
automated gate in the repo. Confirmed: the only shipped `cmp -s` (`check-foundation-guards.test.sh:343`,
`validate.test.sh:390`) compares the two config JSONs — nothing mechanically verifies the checklist is
byte-reproducible from source. A maintainer reading this comment assumes drift is caught automatically
when it is not. On a no-fabrication security surface, an inline claim of a safeguard that isn't wired up
is an accuracy concern.
**Fix:** Reword to scope it to the manual/CI step, e.g. "Re-running this generator and `cmp -s`-ing
against the committed checklist (validation step V-2) detects silent drift; this is a manual/CI check, not
enforced inside this script." — or wire a checklist-reproducibility assertion into the test harness to
make the claim true.

## Info

### IN-01: Stale "measured" byte comment in role_ceiling

**File:** `scripts/check-foundation-guards.sh:377`
**Issue:** The `orchestrator.md` comment says "measured 6759 B" but the file is now 6822 B (the Phase 14
security-audit routing row added ~63 B). The ceiling (7570/7165) was derived from the 6759 baseline and
still passes (6822 < 7165 WARN), so no functional impact — only the inline annotation is stale and could
mislead a future ceiling recalibration.
**Fix:** Update the comment to `measured 6822 B` (or note "baseline 6759 B, +Phase-14 row").

### IN-02: Latent voice-guard false-positive risk on future ASVS regeneration

**File:** `scripts/check-foundation-guards.sh:213` (interacts with the generated checklist)
**Issue:** `guard_voice` scans the GENERATED `security-nfr-checklist.md` for caveman markers including
`\brock\b`, `\bcave\b`, `\bclub\b`, `\bsmash\b`. The current ASVS 5.0.0 text is clean (verified — zero
marker hits), but a future ASVS revision whose verbatim text contains a marker word (e.g., "rock-solid",
"carve/cave", "club") would make `guard_voice` fail RED on a legitimately-generated, verbatim file. Not a
current defect; flagged so a future ASVS bump isn't misdiagnosed.
**Fix:** None required now. If it ever fires, exempt the machine-generated verbatim checklist from
`VOICE_MARKERS` word-list matching (it is generated, not authored prose) or scan only its non-row prose.

---

_Reviewed: 2026-06-13T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
