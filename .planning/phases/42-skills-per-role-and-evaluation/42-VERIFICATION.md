---
phase: 42-skills-per-role-and-evaluation
verified: 2026-11-17T13:00:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - ".planning/phases/42-skills-per-role-and-evaluation/42-01-PLAN.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-01-SUMMARY.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-02-PLAN.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-02-SUMMARY.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-03-PLAN.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-03-SUMMARY.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-04-PLAN.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-04-SUMMARY.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-05-PLAN.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-05-SUMMARY.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-06-PLAN.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-06-SUMMARY.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-07-PLAN.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-07-SUMMARY.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-08-PLAN.md"
  - ".planning/phases/42-skills-per-role-and-evaluation/42-08-SUMMARY.md"
  - "AGENTS.md"
  - "agent-factory/roles/_role-switch-protocol.md"
  - "agent-factory/roles/designer.md"
  - "agent-factory/roles/frontend-ui.md"
  - "agent-factory/workflows/14-ui-design-to-build.md"
  - "docs/audit/28-claim-registry.md"
  - "docs/audit/29-style-dispositions/42-03.md"
  - "docs/audit/29-style-dispositions/42-06.md"
  - "docs/skills.md"
  - "install/README.md"
  - "install/agents-record.test.ts"
  - "install/claude-version-doctor.test.ts"
  - "install/host-tools.js"
  - "install/host-tools.test.ts"
  - "install/host-tools.ts"
  - "install/install.js"
  - "install/install.ts"
  - "install/installer-paths.test-support.ts"
  - "install/message-references.test.ts"
  - "install/mode-census.test.ts"
  - "install/path-spelling-census.test.ts"
  - "install/skills-doctor.test.ts"
  - "scripts/check-banned-claims.js"
  - "scripts/check-banned-claims.test.ts"
  - "scripts/check-banned-claims.ts"
  - "scripts/check-flip-manifest.test.ts"
  - "scripts/check-foundation-guards.test.ts"
  - "scripts/check-public-docs-vocabulary.js"
  - "scripts/check-public-docs-vocabulary.test.ts"
  - "scripts/check-public-docs-vocabulary.ts"
  - "scripts/role-skills-reader.js"
  - "scripts/role-skills-reader.test.ts"
  - "scripts/role-skills-reader.ts"
  - "scripts/skills-kit-text.test.ts"
  - "scripts/tier-kit-text.test.ts"
covered_digest: "v3:sha256:c1d227439ffa3e589748a9484f8057700d77cbea99c2627982485446621a5ec4"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 42: Skills per role and evaluation Verification Report

**Phase Goal:** Each role knows which skills it may use and what to do without them, third-party skills are recommended only as optional pinned installs after a written evaluation, and the doctor warns when a declared skill is missing
**Verified:** 2026-11-17T13:00:00Z
**Status:** passed
**Re-verification:** Yes, refresh of the 11:15Z report. The previous report had no `gaps:` section, so every truth was re-checked in full rather than as a regression pass. It went stale because the two style-disposition files changed and the human UAT completed.

The goal is judged against the requirements as amended by the human at 42-04 (ratify-none, accepted by Olger, 2026-11-16, quoted verbatim in `42-EVALUATION.md` § Ratification). Under that decision, "recommended only as optional pinned installs after a written evaluation" is met by a written evaluation that recommends none.

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP success criterion) | Status | Evidence |
|---|---|---|---|
| 1 | A role may declare skills with a built-in fallback checklist; the role-switch protocol tells non-Claude hosts how to find skills (SKILL-01, amended) | ✓ VERIFIED | `_role-switch-protocol.md:18`: use a skill only when the host lists it, `<plugin>:<name>` counts as `<name>`, otherwise take the role's fallback, never search the disk. `scripts/role-skills-reader.ts` is the one reader of `skills:`. The `## Skills` contract (table, non-empty fallback cell, `Never claim a skill ran.`, fixture role) is pinned by `scripts/skills-kit-text.test.ts`, which passed in my run. `docs/skills.md` carries the per-host folder table, pinned two-way to `HOST_SKILL_DIRS`. No shipped role declares a skill (`grep -l '^skills:' agent-factory/roles/*.md` is empty), consistent with ratify-none. |
| 2 | A written evaluation of the six candidates against the six floors decides which are recommended (SKILL-02) | ✓ VERIFIED | `42-EVALUATION.md` exists with a whole-plugin matrix, per-sub-skill tables, pinned SHAs, § Decision and § Ratification (outcome: none recommended). The structure test passes. I did not re-read the quoted upstream lines against the upstream repositories; the evaluation is a sourced judgment and the human ratified its outcome. |
| 3 | A written evaluation recommends no third-party skill; one rule, stated once, says grugops rules outrank any skill text (SKILL-03, amended) | ✓ VERIFIED | Ratification table: all four proposals declined. `AGENTS.md:32` holds the rule. My grep for `for technique, never for process` across AGENTS.md, README.md, install/README.md, `docs/` and `agent-factory/` finds it in AGENTS.md only (the other hits are the audit disposition docs quoting it, which are not kit text). `docs/skills.md` says "grugops recommends no third-party skill." |
| 4 | Frontend/UI and the Designer treat design-system files in the user's repo as user artifacts they read but never write (SKILL-04, amended) | ✓ VERIFIED | `designer.md:42`, `frontend-ui.md:40` and Workflow 14 step 1 ("Never write them; they are user artifacts. When they disagree with the Designer's notes, the files win.") carry the rule. Pinned by `skills-kit-text.test.ts` (passes). |
| 5 | `install --check` warns, and never fails or installs anything, when a role declares a skill that is not found (SKILL-05) | ✓ VERIFIED | I ran the committed `install/install.js` in a scratch install (own HOME, `--claude`). With no declaration: exit 0, no skill line. After adding `skills: example-skill` to the installed designer role: `advisory skill example-skill (designer) not found for Claude Code; optional, see docs/skills.md`, exit 0. With `--strict`: the same advisory, exit 0, no `FAIL` or `WARN` line. After creating `.claude/skills/example-skill/SKILL.md`: `ok skill example-skill (designer) found for Claude Code`, exit 0. Nothing was installed by the check. `install/skills-doctor.test.ts` passes. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `42-EVALUATION.md` | Six-candidate, six-floor record plus ratification | ✓ VERIFIED | Present with Decision and Ratification sections |
| `scripts/role-skills-reader.ts` / `.js` | One reader of `skills:` | ✓ VERIFIED | Used by the doctor; `npm run freshness` reports all 92 committed `.js` files match a rebuild |
| `install/host-tools.ts` `HOST_SKILL_DIRS`, `CLAUDE_CODE_LEVEL_FLOOR` | Per-host table and version floor | ✓ VERIFIED | Used by `install.ts`; fresh |
| `install/install.ts` doctor sections | Declared-skills and version sections | ✓ VERIFIED | Behavior run end to end (truth 5) |
| `AGENTS.md`, `_role-switch-protocol.md`, `designer.md`, `frontend-ui.md`, Workflow 14 | Rule, protocol line, never-write sentences | ✓ VERIFIED | Truths 1, 3, 4 |
| `docs/skills.md` | Public page for the empty recommended set | ✓ VERIFIED | Joined to both claim gates; both exit 0 |
| `docs/audit/29-style-dispositions/42-03.md`, `42-06.md` | Dispositions accepted by a named human | ✓ VERIFIED | 6 and 11 rows read `accepted by Olger (42-UAT test 3, 2026-11-17)`; the only remaining `pending (named human)` text is the one intro sentence per file (review IN-04, wording only). `check-diff-disposition` exits 0 |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| doctor | `scripts/role-skills-reader.js` | spawn, no shell, fails closed | WIRED | The scratch run read the declaration through it |
| doctor | `HOST_SKILL_DIRS` | per-installed-host row | WIRED | found/not found flipped with the folder |
| `docs/skills.md` host table and recommended section | `HOST_SKILL_DIRS`, role declarations | two-way pins in `skills-kit-text.test.ts` | WIRED | Test passes |
| `docs/skills.md` | claim gates | named part in both vocabulary and banned-claims checks | WIRED | Both exit 0 |
| `AGENTS.md` line | claim registry | adjudicated-not-a-claim row | WIRED | `check-claim-anchors` exit 0 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| doctor skill lines | declared skills | roles' `skills:` frontmatter via the reader | Yes: my edit of the installed designer role produced the line | ✓ FLOWING |
| doctor found/not found | folder presence | `SKILL.md` stat per host row | Yes: absent, then present, flipped the line | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Phase test files | `npx vitest run scripts/skills-kit-text.test.ts install/skills-doctor.test.ts install/claude-version-doctor.test.ts scripts/role-skills-reader.test.ts install/host-tools.test.ts` | 5 files, 216 of 216 passed (default TMPDIR) | ✓ PASS |
| Committed `.js` equals source | `npm run freshness` | "All build outputs fresh: 92 committed .js file(s) match a rebuild" | ✓ PASS |
| Kit gates | `check-claim-anchors`, `check-diff-disposition`, `check-role-rules`, `check-imperative-lexicon`, `check-public-docs-vocabulary`, `check-banned-claims` | all exit 0 | ✓ PASS |
| Doctor end to end | scratch install, `install.js --check`, with `--strict` | exit 0 in every case, lines as in truth 5 | ✓ PASS |

I did not re-run the full suite. The orchestrator reports 11,876 tests, 21 failed, all identical by name to the Known baseline reds in `41-VALIDATION.md`; I took that as stated and did not recompute it.

### Probe Execution

Step 7c: SKIPPED. No PLAN declares a `probe-*.sh`.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| SKILL-01 | 42-02, 42-03, 42-06, 42-07, 42-08 | Role may declare skills with fallback; protocol tells hosts how to find skills (amended) | ✓ SATISFIED | Truth 1; REQUIREMENTS.md `[x]` |
| SKILL-02 | 42-01, 42-04 | Written evaluation of six candidates against six floors | ✓ SATISFIED in the codebase; bookkeeping open | Truth 2. **REQUIREMENTS.md line 76 still reads `- [ ] **SKILL-02**` and line 160 reads `Pending`.** 42-04-SUMMARY left `requirements-completed: []`. The orchestrator should tick it when closing the phase. |
| SKILL-03 | 42-03, 42-04, 42-07 | No third-party skill recommended; one stated-once rule (amended) | ✓ SATISFIED | Truth 3; `[x]` |
| SKILL-04 | 42-04, 42-06 | Design-system files are read-never-write (amended) | ✓ SATISFIED | Truth 4; `[x]` |
| SKILL-05 | 42-02, 42-05, 42-07, 42-08 | `--check` warns, never fails, never installs | ✓ SATISFIED | Truth 5; `[x]` |

Orphaned requirements: none. The union of the eight plans' `requirements:` fields is exactly SKILL-01..05, and REQUIREMENTS.md maps exactly those five to Phase 42.

### Anti-Patterns Found

Judgment on the open code-review warnings (`42-REVIEW.md`, commit e609a52b; `42-REVIEW-DISPOSITION.md` has 10 of 12 open). None defeats a must-have or the phase goal.

| File | Finding | Severity | Why it does not defeat SKILL-05 or the goal |
|---|---|---|---|
| `install/install.ts:2626, 2547-2554` | WR-01: link containment covers only the manifest-named plugin skills folder; the default `skills/` folder and per-skill links can still link out and print `found` | ⚠️ Warning | The check still warns, never fails and never installs. A skill reached through a link is a skill the host can load, so `found` is not harmful, and the same escape is conservatively `not checked` in the manifest layout. The inconsistency is real and the T-42-05 "links followed" comment overstates it, but the advisory contract holds. Follow-up recommended |
| `install/install.ts:2662, 2685-2687` | WR-02: an unreadable `skills` path gets the reason "absolute, has a .. segment or leaves the plugin folder", which is untrue for ENOTDIR, EACCES or a dangling link | ⚠️ Warning | Fails closed to `not checked` and stays advisory. The wording is inaccurate diagnostic text, a no-fabrication nit, not a wrong pass or a false failure |
| `install/install.ts:2841-2856, 3535-3541` | WR-03: the version probe uses the home folder as cwd without checking it exists; a missing HOME prints "could not be run (ENOENT)" | ⚠️ Warning | Affects the Claude Code version line only, an advisory outside SKILL-05's declared-skill check. Edge case (nonexistent HOME) |
| `install/skills-doctor.test.ts:606-615` | WR-04: the CR-02 reader-stderr test passes only when TMPDIR is short (stderr cut at 300 characters) | ⚠️ Warning | Test fragility, not a product defect. It passed in my run with the default TMPDIR; the project memory already warns that TMPDIR changes cause false reds |
| `install/install.ts`, `install/host-tools.ts`, `docs/skills.md`, `docs/audit/29-style-dispositions/42-0{3,6}.md`, tests | IN-01..IN-06, including the stale "stays pending" intro sentence in both disposition docs and the `docs/skills.md:7` "only reports" sentence | ℹ️ Info | Wording and edge precision; none blocks a truth |

Debt-marker scan: no unreferenced `TBD`/`FIXME`/`XXX` found in the phase's non-planning files at the previous verification; no phase source file changed since besides the review-fix commits, which the new review covered. CR-01 and CR-02 (the two critical findings of the first review) are recorded as fixed.

### Human Verification

None pending. The human ruled on each earlier item in `42-UAT.md` (5 passed, 0 issues, 1 skipped by decision):

- Live discovery on the non-Claude hosts: passed live by Olger on macOS for Antigravity, Pi, OpenCode and Codex. GitHub Copilot CLI was not run and stays `UNKNOWN - verify`, which `docs/skills.md` already states honestly.
- Public-page read, style dispositions (17 rows), the WR-01/02/03 fixes of the first review, and the accepted risk R-42-01: accepted by Olger by typed name.
- Windows run of the absolute-PATH probe and `claude.cmd` (UAT test 6): skipped by Olger's recorded decision to test after the milestone and bump a minor version if anything turns up. This is a human-ruled deferral, carried with the other Windows items (CAP-02, HOST-02) in REQUIREMENTS.md Future Requirements; it is not a pending check on this phase's goal.

### Gaps Summary

No goal-blocking gaps. All five roadmap success criteria hold in the codebase, and the doctor behaves as claimed when run end to end. Housekeeping for the orchestrator, none a truth failure:

- REQUIREMENTS.md still lists SKILL-02 as `[ ]` / `Pending` (lines 76 and 160); tick both when closing the phase.
- Consider a small follow-up plan for the four open review warnings (WR-01..WR-04), especially the link-containment consistency and the false refusal reason.
- The untracked `~/` folder, `brand/readme-art.txt` and the modified `docs/audit/28-prepass-evidence.md` are pre-existing and were not touched.

---

_Verified: 2026-11-17T13:00:00Z_
_Verifier: Claude (gsd-verifier)_
