---
phase: 16-14-gate-convergence-lint-ui-e2e-test-integrity
reviewed: 2026-06-14T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - agent-factory/checklists/00-index.md
  - agent-factory/checklists/accessibility-checklist.md
  - agent-factory/checklists/linter-recommendations.md
  - agent-factory/checklists/playwright-visual-regression-recipe.md
  - agent-factory/config/factory.config.md
  - agent-factory/workflows/05-pr-quality-gate.md
  - install/install.ts
  - scripts/runnable-ref/test-skip-integrity.ts
  - scripts/runnable-ref/test-skip-integrity.test.ts
  - scripts/runnable-ref/fixtures/clean-test-skips.md
  - scripts/runnable-ref/fixtures/expired-test-skips.md
  - scripts/runnable-ref/fixtures/hollow-test-skips.md
  - scripts/runnable-ref/fixtures/quarantine-test-skips.md
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-06-14
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed the test-integrity checker (`test-skip-integrity.ts`), its Vitest harness and four
fixtures, the single TypeScript installer (`install.ts`), the PR-quality-gate workflow, the
config-dial reference, and four gate checklists. The committed `.js` siblings were intentionally
out of scope (CI freshness-checked); I reviewed the `.ts` source and exercised the committed
`.js` only to confirm runtime behavior against the source.

**Overall the checker is solid and fails closed in every degenerate case I could construct** —
missing path → exit 2, missing/garbage skip-count → exit 1 (UNKNOWN, never a silent 0), expired
rows block regardless of count, placeholder owners trip, malformed headers and malformed dates
all push toward exit 1. The exit-code contract (0/1/2) is correct and the boundary `expiry ==
today` is handled (strict `<`, not expired). The installer's materialization tuple is
constant-pathed (no traversal), never-overwrite, and DRY_RUN-clean.

The findings below are real but none are BLOCKER. The headline correctness gap is a
**count-inflation path via duplicate Test IDs** (WR-01) that lets the valid-justification count
exceed the number of distinct justified tests — a hollow-justification bypass that the human-owned
registry assumption mitigates but does not close. The remaining warnings are an arg-parsing
collision (WR-02), a checklist tier-classification inconsistency (WR-03), and an advisory-mode
prose ambiguity for the human-only test-integrity lane (WR-04).

No structural findings block was provided, so this report is narrative-only.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Duplicate Test IDs inflate the valid-justification count (count-bypass)

**File:** `scripts/runnable-ref/test-skip-integrity.ts:163-208, 218-225`
**Issue:** `validJustifications` is incremented once per non-invalid row with no de-duplication
on `testId`. Two registry rows naming the **same** Test ID each count as a separate justification,
so the comparison `skipCount > validJustifications` can be satisfied by phantom rows. Verified:

```
| auth.x | r | Dana Lopez | ABC-1 | 2099-12-31 | external-dependency |
| auth.x | r | Dana Lopez | ABC-1 | 2099-12-31 | external-dependency |   ← same Test ID
```
`--skip-count 2` → `exit 0` (counts 2 justifications for 1 distinct test). This is the exact
"could a hollow justification slip through?" risk: a host reporting 2 skips where only `auth.x`
is genuinely justified passes, because the duplicate row pads the count. The human-owned-registry
assumption (D-02) reduces but does not eliminate this — a copy-paste mistake silently raises the
skip ceiling.
**Fix:** Count distinct, valid Test IDs and flag duplicates as a finding:
```typescript
const seen = new Set<string>();
// inside the loop, after computing `invalid`:
if (!invalid) {
  if (seen.has(row.testId)) {
    findings.push(
      `The skip registry lists "${row.testId}" more than once; each justified skip must appear exactly once.`,
    );
  } else {
    seen.add(row.testId);
    validJustifications++;
  }
}
```

### WR-02: `--skip-count <path>` collides with positional registry-path discovery

**File:** `scripts/runnable-ref/test-skip-integrity.ts:55, 58-67`
**Issue:** `registryPath` is `argv.find((a) => !a.startsWith("--"))` while `flagValue("--skip-count")`
returns `argv[i+1]`. When a caller mis-orders the args as `node test-skip-integrity.js --skip-count
registry.md`, the single token `registry.md` is consumed as BOTH the registry path AND the
skip-count value. The skip-count then fails `/^\d+$/` and the run reports
"Skip count was not provided (UNKNOWN - verify)" even though a path was supplied — a confusing,
self-contradictory message. Verified: `--skip-count fixtures/clean-test-skips.md` → exit 1 with
the UNKNOWN finding. It fails *safe* (toward exit 1), so this is a robustness/diagnostics defect,
not a correctness hole — hence WARNING not BLOCKER.
**Fix:** Exclude the flag-value tokens from positional discovery, or require the registry path to
be the first argv. Simplest: pull the registry path as the first non-flag arg that is not
immediately preceded by a value-taking flag:
```typescript
const VALUE_FLAGS = new Set(["--skip-count", "--today"]);
const registryPath = argv.find(
  (a, i) => !a.startsWith("--") && !VALUE_FLAGS.has(argv[i - 1]),
);
```

### WR-03: Lean-mode gate references three enterprise-tier checklists

**File:** `agent-factory/checklists/00-index.md:38-40` (vs `agent-factory/workflows/05-pr-quality-gate.md:33-35`)
**Issue:** `00-index.md` classifies `linter-recommendations.md`, `playwright-visual-regression-recipe.md`,
and `accessibility-checklist.md` under the **Enterprise tier** — "Active only in `mode:
enterprise`." But `05-pr-quality-gate.md` (frontmatter `cadence: both`, i.e. runs in lean mode)
references all three from the lint and UI/E2E steps, which fire in lean mode too (`lint` is in the
lean `mandatory_gates`; `ui_e2e` defaults to `ui-or-critical-path`, not `off`). A lean-mode gate
therefore points at docs the index says are enterprise-only. The three files do carry
`tier: enterprise` frontmatter, so the index is self-consistent with the files but inconsistent
with the workflow that consumes them.
**Fix:** Either reclassify the three reference how-tos as lean (they are referenced by the
always-on gate, not gated by mode), or split them out of the tiered checklist table into a
"reference how-tos (mode-independent)" section so the index stops implying they are
enterprise-gated.

### WR-04: Advisory-mode handling of the human-only test-integrity lane is ambiguous

**File:** `agent-factory/workflows/05-pr-quality-gate.md:37, 40-41, 43`
**Issue:** Steps 3 and 4 state test-integrity is "always human-only" and that on checker `exit 1`
the gate "STOPS and hands to a human" → `BLOCKED_NEEDS_FIX` (and explicitly does NOT consume a
self-fix attempt). Step 5's "Advisory composition" then says when `gate_enforcement` is
`advisory` the pipeline ACTION "is uniformly downgraded to advice — including a test-integrity
finding." The two readings collide: under `advisory`, does a test-integrity `exit 1` still
short-circuit to `BLOCKED_NEEDS_FIX` (Step 4), or is the ACTION downgraded to advice and the run
allowed to proceed (Step 5)? The prose asserts both "STOPS" and "downgraded to advice" for the
same condition without reconciling them. This is the safety-critical lane (TINT-03 floor), so the
ambiguity is worth closing in clear voice.
**Fix:** State the precedence explicitly, e.g.: "Under `advisory`, a test-integrity `exit 1` still
emits the finding loudly and records `BLOCKED_NEEDS_FIX` for the human-owned registry lane; the
advisory downgrade applies to agent-fixable gate ACTIONs, not to the human-only test-integrity
short-circuit." Make Step 4 and Step 5 cite each other so a reader cannot land on the
proceed-anyway reading.

## Info

### IN-01: Test suite does not cover the WR-01 duplicate-ID inflation path

**File:** `scripts/runnable-ref/test-skip-integrity.test.ts:56-135`
**Issue:** Nine cases cover clean/hollow/expired/quarantine/over-count/missing-path/missing-count/
json/host-emulation, but none exercises duplicate Test IDs (WR-01) or the `--skip-count <path>`
arg collision (WR-02). The count-inflation bypass is invisible to the suite.
**Fix:** Add a fixture with duplicate Test IDs and assert it does NOT silently pass at a skip
count equal to the (inflated) row count once WR-01 is fixed.

### IN-02: Unused `reason` field — Reason is parsed but never validated

**File:** `scripts/runnable-ref/test-skip-integrity.ts:138, 163-208`
**Issue:** `row.reason` is captured into the `Row` interface but never read by any validation rule.
A justification row with a blank Reason passes (verified: empty Reason → exit 0). This may be
intentional (Reason is human prose, not machine-checkable), but a blank Reason is arguably as
"hollow" as a placeholder owner.
**Fix:** If a non-empty Reason is required for a justification to be real, validate
`row.reason === ""` the same way Ticket is validated (line 179). Otherwise add a one-line comment
that Reason is intentionally informational-only, so the unused field does not read as an
oversight.

### IN-03: `--today` accepts a missing value silently (last-arg flag)

**File:** `scripts/runnable-ref/test-skip-integrity.ts:68, 96`
**Issue:** `node ... --today` (no value) makes `flagValue("--today")` return `undefined`; the
regex guard `todayRaw && /.../.test(todayRaw)` then falls back to wall-clock. Verified: no crash,
silent fallback. Harmless because `--today` is a test-only affordance, but a caller who fat-fingers
`--today` with no date gets the real date with no warning.
**Fix:** Optional — emit a one-line stderr note when `--today` is present but its value fails the
`YYYY-MM-DD` shape, instead of silently ignoring it.

### IN-04: `@playwright/test` version pin `1.60.0` reads as unusually high — verify

**File:** `agent-factory/checklists/playwright-visual-regression-recipe.md:17` (and `4.11.3` on line 18)
**Issue:** The recipe pins `@playwright/test 1.60.0` and `@axe-core/playwright 4.11.3`. These are
presented as recommendations (not faked host commands, so no fabrication violation), but `1.60.0`
is a notably high Playwright minor for a 1.x line and may not match a real published version. Since
the checklist is the authoritative how-to a host will copy, a wrong pin sends users to a
nonexistent release.
**Fix:** Re-confirm both pins against the current registry before this ships, or soften to a
floor (`>=1.x`) rather than an exact pin, consistent with the "grugops installs nothing, only
recommends" framing on lines 20-26.

### IN-05: `copyKit` can orphan a `KIT_ROOT.old.<pid>` dir on mid-rename interruption

**File:** `install/install.ts:558-575`
**Issue:** The atomicity comment (WR-02 in source) is correct that a *reader* never sees an absent
KIT_ROOT. But if the process dies between `renameSync(KIT_ROOT, old)` (line 571) and the final
`rmSync(old, ...)` (line 573), an orphaned `agent-factory.old.<pid>` directory is left under
`$GRUGOPS_HOME`. Cosmetic leakage, not data loss (the new kit is in place), and out of the
correctness scope — noted for housekeeping only.
**Fix:** Optional — sweep stale `agent-factory.old.*` / `.agent-factory.tmp.*` siblings at the
start of `copyKit` (best-effort `rmSync(..., { force: true })`), so a prior crash self-heals on the
next install.

---

_Reviewed: 2026-06-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
