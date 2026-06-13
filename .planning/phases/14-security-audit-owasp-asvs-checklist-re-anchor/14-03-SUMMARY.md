---
phase: 14-security-audit-owasp-asvs-checklist-re-anchor
plan: 03
subsystem: security
tags: [owasp-asvs, voice-guard, posix-sh, severity-mapping, config-dial]

# Dependency graph
requires:
  - phase: 14-01
    provides: regenerated agent-factory/checklists/security-nfr-checklist.md (full ASVS 5.0 set, L1/L2/L3-tagged) — scanned by guard_voice and mirrored into the harness
  - phase: 14-02
    provides: agent-factory/workflows/15-security-audit.md + the security-audit Orchestrator classification — scanned by guard_voice and mirrored into the harness
provides:
  - Read-time security.asvs_level filter note in the Security/NFR role (cumulative, L<=level, not regenerated)
  - D-09 default severity map (L1 fail->high / L2->medium / L3->low) + named-owner severity override in the role
  - severity/level/req-id finding fields + named-owner override field in the security-nfr handoff template
  - guard_voice extended to scan all four security surfaces in clear voice (role caveman-fence carve-out preserved)
  - a RED expect_fail fixture per new surface in the fail-proof harness (each surface proven fail-red)
affects: [phase-15-gate-convergence, phase-17-browsable-docs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SEC_VOICE_FILES union into VOICE_FILES — extend the existing guard scan set, never rebuild the guard machinery"
    - "Documented per-file role_ceiling() bump with inline Phase-N rationale when terse-write exhausts the byte budget"
    - "One RED expect_fail fixture per new voice surface — no-fabrication: every guard must prove it can fail"

key-files:
  created: []
  modified:
    - agent-factory/roles/security-nfr.md
    - agent-factory/handoffs/security-nfr-handoff.md
    - scripts/check-foundation-guards.sh
    - scripts/check-foundation-guards.test.sh

key-decisions:
  - "Reused the role's existing accepted-risk named-owner hard limit as the home for the D-09 severity override (minimal new bytes)"
  - "Terse-first then documented ceiling bump: tightened the verbose Output/Trace prose, then bumped security-nfr.md role_ceiling from 4576/4331 to 5102/4830 (measured 4556 B)"
  - "NFR/perf pointer (plans/nfr-catalog.md) kept in the role (Open Q1) — the regenerated checklist is pure ASVS"
  - "Added a separate SEC_VOICE_FILES list and unioned it into VOICE_FILES rather than touching ROLE_FILES (security-nfr.md already scanned there)"

patterns-established:
  - "Extend-not-rebuild the voice guard: new clear-voice surfaces join via a separate list unioned into VOICE_FILES + the same paths in GUARD_INPUTS + one RED fixture each"
  - "No-fence surfaces are scanned whole — the fence-strip awk is a harmless no-op, so the caveman carve-out stays role-only without re-engineering the fence anchor"

requirements-completed: [SEC-03]

# Metrics
duration: ~25min
completed: 2026-06-13
---

# Phase 14 Plan 03: Wire SEC-03 dial behavior + extend the voice guard Summary

**Wired the ASVS read-time level filter + D-09 severity map (L1->high / L2->medium / L3->low) + named-owner override into the Security/NFR role and handoff, then extended guard_voice and its fail-proof harness to scan all four security surfaces in clear voice with a RED fixture per surface — config byte-identical, no schema change.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-13T07:49Z (approx)
- **Completed:** 2026-06-13T08:13:47Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Security/NFR role now carries the read-time `security.asvs_level` filter note (cumulative, keep `L <= level`, file NOT regenerated when the dial changes) and the D-09 default severity map, with the auditor's severity override folded into the existing accepted-risk named-owner hard limit — all in clear professional voice.
- The `security-nfr-handoff.md` template now declares severity (high/medium/low) + ASVS level (L1/L2/L3) + req-id (Vx.y.z) fields on findings and a named-owner severity-override field on accepted risks, with `kind: handoff` frontmatter and every existing section name preserved.
- `guard_voice` scans all four security surfaces (role + workflow 15 + ASVS checklist + handoff) in clear voice; the caveman-fence carve-out stays on the role only and the fence-strip awk anchor is untouched.
- The fail-proof harness mirrors the 3 new surfaces (added to `GUARD_INPUTS`) and proves each fails RED on a planted caveman marker; the smoke run over the real tree stays GREEN and the config-JSON `cmp -s` byte-identity case still passes.
- Full suite GREEN: `check-foundation-guards.sh`, `check-foundation-guards.test.sh`, `check-kit-refs.sh`, and `validate-agent-factory.mjs` all exit 0.

## Task Commits

Each task was committed atomically (with hooks, no --no-verify):

1. **Task 1: Wire the dial behavior into the role + handoff (D-05/D-09)** - `8d3b42f` (feat)
2. **Task 2: Extend guard_voice + the fail-proof harness for the 3 new security surfaces** - `0fb6b00` (feat)

## Files Created/Modified
- `agent-factory/roles/security-nfr.md` - Added the read-time `asvs_level` filter note near the checklist reference; added the D-09 severity map and severity-override (extending the existing named-owner hard limit) in `## Hard limits`; tightened the verbose `## Output` and `## Trace updates` prose to absorb the new content; kept the `plans/nfr-catalog.md` pointer.
- `agent-factory/handoffs/security-nfr-handoff.md` - Added severity/level/req-id finding-field guidance under `## Required fixes` and a named-owner severity-override field under `## Accepted risks`; all existing section names + `kind: handoff` frontmatter preserved.
- `scripts/check-foundation-guards.sh` - Added `SEC_VOICE_FILES` (workflow 15 + ASVS checklist + handoff) unioned into `VOICE_FILES`; bumped the `security-nfr.md` entry in `role_ceiling()` from `4576 4331` to `5102 4830` with an inline `+Phase-14` rationale (measured 4556 B).
- `scripts/check-foundation-guards.test.sh` - Added the 3 new surface paths to `GUARD_INPUTS` so `mirror()` copies them; added one RED `expect_fail` fixture per new surface (wf15, checklist, handoff) mirroring the existing `voice-marker` case.

## Decisions Made
- **Severity override reuses the existing named-owner hard limit** — the cheapest place (in bytes) to attach D-09's "MAY override with a stated reason + named owner", and it mirrors the handoff's accepted-risks field, keeping role and template aligned.
- **Terse-first, then a documented ceiling bump** — the D-09 + filter-note additions pushed the role from 4326 B to 4903 B (over FAIL). Tightening the redundant `## Output` field-enumeration (the handoff template is the authoritative field list) and `## Trace`/heading prose recovered it to 4556 B, still ~20 B from the old FAIL ceiling. Rather than ship a fragile 20-B margin, the `role_ceiling()` entry was bumped to a measured baseline (FAIL +12% / WARN +6%) with an inline Phase-14 rationale comment — the exact Phase-13 `orchestrator.md` precedent. This was the planner's RESOLVED Open-Q2 procedure, not an improvised change.
- **Separate `SEC_VOICE_FILES` list, not a `ROLE_FILES` edit** — `security-nfr.md` is already in `ROLE_FILES` (its caveman carve-out handled there); the 3 non-role surfaces go in their own list unioned into `VOICE_FILES`, so the role guards (`guard_caveman_preserved`, `guard_role_size`) are not accidentally pointed at non-role files.

## Deviations from Plan

None - plan executed exactly as written. (The role byte budget required the terse-first-then-documented-ceiling-bump procedure, which is the plan's own RESOLVED Open-Q2 fallback encoded in Task 1's action/acceptance criteria — not an unplanned deviation. No `security.*` config key was added or renamed; config JSONs stay byte-identical.)

## Issues Encountered
- The combined D-05 filter note + D-09 severity content initially pushed `security-nfr.md` to 4903 B, over the FAIL ceiling. Resolved by compressing the redundant field-enumeration in `## Output` (deferring to the handoff template as the authoritative field list) and the parenthetical/connective prose in `## Trace updates`, then applying the documented ceiling bump for the residual. The caveman fence was never touched and `guard_caveman_preserved` stays GREEN.

## Threat Register Verification
- **T-14-08 (voice-guard regression)** — mitigated: one RED `expect_fail` fixture per new surface (wf15, checklist, handoff) proves fail-red; the smoke run proves the clean tree passes.
- **T-14-09 (config dial keys)** — mitigated: no `security.*` key added/renamed; the `cmp -s` JSON-identity case stays GREEN.
- **T-14-10 (caveman-fence carve-out)** — mitigated: the fence-strip awk (guard.sh) is unchanged; the 3 new surfaces have no fence and are scanned whole; `guard_caveman_preserved` still passes.
- **T-14-11 (severity override)** — mitigated: the role + handoff both require a stated reason + a named owner for any override (no anonymous downgrade).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SEC-03 behavior is wired and mechanically proven. The deep-audit workflow (14-02) emits severity-tagged findings; the role/handoff now carry the severity vocabulary; Phase 15 (gate convergence) can read `security.block_on` at `05-pr-quality-gate.md` against those findings — audit produces, gate enforces (D-07), unchanged here.
- No blockers. STATE.md / ROADMAP.md intentionally NOT modified (orchestrator owns those for the wave-level update).

---
*Phase: 14-security-audit-owasp-asvs-checklist-re-anchor*
*Completed: 2026-06-13*
