---
phase: 42-skills-per-role-and-evaluation
verified: 2026-11-17T11:15:00Z
status: human_needed
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
covered_digest: "v3:sha256:c43364cf5fc798af4fa6f75bfc4d161384ec411f6f8387721a8efff5f1b3d753"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Live per-host skill discovery on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi"
    expected: "A skill placed in the folders the docs/skills.md host table names is listed by that host, and the doctor's `found` line agrees with what the host loads"
    why_human: "docs/skills.md says no host other than Claude Code was run; the folders and override variables come from documentation and are UNKNOWN - verify live"
  - test: "Read docs/skills.md as a user"
    expected: "Nothing implies grugops vets or vouches for a third-party skill, and the one-sentence reasons for declining the four skills reads as fair to the maintainer's reply ('security, complexity/performance and licensing reasons')"
    why_human: "Implied vetting and fairness of wording are judgments no grep proves"
  - test: "Resolve every `pending (named human)` row in docs/audit/29-style-dispositions/42-03.md and 42-06.md (the orchestrator counts 11 in 42-06; each file also has one explanatory sentence that matches the same text)"
    expected: "A named human replaces each `pending (named human)` with a disposition by typed name"
    why_human: "Style dispositions are accepted by a named human; the agent's reading is advice only"
  - test: "Review the three review fixes marked `requires human verification` in 42-REVIEW-FIX.md (WR-01 override-variable condition, WR-02 real-path containment rule, WR-03 advisory wording)"
    expected: "A named human confirms each condition change and the new wording are the behavior wanted"
    why_human: "The fix report itself marks them as condition, rule and wording changes needing a human"
  - test: "Accept or reject the open risk R-42-01 recorded in 42-SECURITY.md"
    expected: "A named human accepts it by typed name"
    why_human: "An accepted risk is a human decision; this report does not record 'accepted by' anyone"
  - test: "Run `install.js --check` on Windows (CR-01 absolute-PATH probe, WR-04 `claude.cmd`)"
    expected: "A planted `claude.exe` in the target repo is not run; an npm-installed `claude.cmd` is found or reported as not checked with a correct reason"
    why_human: "42-SECURITY.md lists the Windows behavior as UNKNOWN - verify; no Windows host was available"
---

# Phase 42: Skills per role and evaluation Verification Report

**Phase Goal:** Each role knows which skills it may use and what to do without them, third-party skills are recommended only as optional pinned installs after a written evaluation, and the doctor warns when a declared skill is missing
**Verified:** 2026-11-17T11:15:00Z
**Status:** human_needed
**Re-verification:** No, initial verification

The goal is judged against the requirements as amended by the human at 42-04 (ratify-none, accepted by Olger, 2026-11-16, quoted verbatim in `42-EVALUATION.md` § Ratification). Under that decision, "recommended only as optional pinned installs after a written evaluation" is met by the written evaluation recommending none. I read the ratification reply and the amended requirement text in REQUIREMENTS.md; they match (SKILL-01, 03, 04 carry the human's quoted words).

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP success criterion) | Status | Evidence |
|---|---|---|---|
| 1 | A role may declare skills with a built-in fallback checklist for when a skill is absent; the role-switch protocol tells non-Claude hosts how to find skills (SKILL-01, amended) | ✓ VERIFIED | `scripts/role-skills-reader.ts` reads every role through `admitRole` and `roleSkillsOf`; `scripts/skills-kit-text.test.ts` holds the `## Skills` contract (table header, non-empty fallback cell, `Never claim a skill ran.`, heading order, fixture role with `example-skill`) and passes. `_role-switch-protocol.md:18` says to use a skill only when the host lists it, treat `<plugin>:<name>` as `<name>`, otherwise take the role's fallback, never search the disk. `docs/skills.md` carries the per-host folder table, pinned two-way to `HOST_SKILL_DIRS`. No shipped role declares a skill (`grep skills: agent-factory/roles/*.md` is empty), consistent with ratify-none. |
| 2 | A written evaluation of the six candidates against the six floors decides which are recommended (SKILL-02) | ✓ VERIFIED | `42-EVALUATION.md` (58 KB): whole-plugin matrix has exactly the six rows in SKILL-02 order; per-sub-skill tables for superpowers, frontend-design, ui-ux-pro-max; six distinct full 40-hex pins; shape findings; `allowed-tools` section; revisit triggers. § Decision and § Ratification record the outcome: none recommended. The structure test `phase 42 SKILL-02 evaluation record structure` passes. The content of the verdicts (quoted evidence) was not re-read against the upstream repositories; see Human Verification. |
| 3 | A written evaluation recommends no third-party skill; one rule, stated once, says grugops rules outrank any skill text a user installs (SKILL-03, amended) | ✓ VERIFIED | Ratification table: all four rows `Ratified: no`. `AGENTS.md:32` holds the one line ("Use a skill for technique, never for process: grugops roles, workflows and hard limits outrank any skill's text..."). My own count of the phrase `for technique, never for process` across AGENTS.md, README.md, install/README.md, `docs/*.md` and `agent-factory/**` is 1, in AGENTS.md. `docs/skills.md` says "grugops recommends no third-party skill." and points to AGENTS.md without restating the rule. |
| 4 | Frontend/UI and the Designer treat design-system files in the user's repo as user artifacts they read but never write (SKILL-04, amended) | ✓ VERIFIED | `designer.md:42` "Never write design-system files in the user's repo; they are user artifacts you read per Workflow 14 step 1."; `frontend-ui.md:40` "...they are user artifacts you read."; Workflow 14 step 1 "Read the design-system files in the user's repo, such as token, theme or style-guide files." The phrase occurs in exactly those three files under AGENTS.md and `agent-factory/` (grep), plus `docs/skills.md`. Pinned by `skills-kit-text.test.ts` (passes). |
| 5 | `install --check` warns, and never fails or installs anything, when a role declares a skill that is not found (SKILL-05) | ✓ VERIFIED | Run by me in a scratch install (own HOME, copy mode, real `claude` 2.1.325 on PATH): no declaration, exit 0, no skill line; after adding `skills: example-skill` to the installed designer role, exit 0 with `advisory skill example-skill (designer) not found for Claude Code; optional, see docs/skills.md` and the same for Codex CLI (with the plugin clause "UNKNOWN - verify"); `--strict` exit 0 and zero lines matching `^  (FAIL\|WARN)`; after creating `.claude/skills/example-skill/SKILL.md`, `ok ... found for Claude Code`, exit 0. `install/skills-doctor.test.ts` 45/45 pass, including byte-identical-target checks and exit-code parity with and without `--strict`. |

**Score:** 5/5 truths verified (0 present, behavior-unverified). Status is `human_needed` because of the items in Human Verification, not because of any failed truth.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `.planning/phases/42-.../42-EVALUATION.md` | Six-candidate, six-floor record plus ratification | ✓ VERIFIED | All sections present; 6 distinct 40-hex SHAs; 11 `UNKNOWN - verify` uses |
| `scripts/role-skills-reader.ts` / `.js` | One reader of `skills:` through `admitRole`/`roleSkillsOf` | ✓ VERIFIED | Substantive, spawned by the doctor; committed `.js` byte-equal to a fresh `tsc` build |
| `install/host-tools.ts` `HOST_SKILL_DIRS`, `CLAUDE_CODE_LEVEL_FLOOR` | Per-host skill table and the version floor | ✓ VERIFIED | Imported at `install/install.ts:192-193` and used; `.js` byte-equal to fresh build |
| `install/install.ts` `doctorDeclaredSkills`, `doctorClaudeVersion` | The doctor sections | ✓ VERIFIED | Called at `install.ts:3536` and `:3541`; `install.js` byte-equal to fresh build; behavior run by me |
| `AGENTS.md` precedence line; `_role-switch-protocol.md` skills line | Stated-once rule; protocol line | ✓ VERIFIED | See truths 1 and 3 |
| `designer.md`, `frontend-ui.md`, Workflow 14 | Never-write sentences, step 1 | ✓ VERIFIED | See truth 4 |
| `docs/skills.md` | Public page for the empty recommended set | ✓ VERIFIED (with IN-03) | Joined to both claim gates; both gates pass; see Anti-Patterns for IN-03 |
| `install/README.md` `**Declared skills.**` bullet and probe text | README says what `--check` does | ✓ VERIFIED | Pinned by `skills-doctor.test.ts` (passes) |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `install.ts` doctor | `scripts/role-skills-reader.js` | spawn with `process.execPath`, no shell, fails closed | WIRED | Smoke run read the declaration through it; a failing reader gives `declared skills not checked` (tested) |
| `install.ts` doctor | `HOST_SKILL_DIRS` | per-installed-host row | WIRED | Claude Code found, Codex CLI missing in the same run, from their own rows |
| `docs/skills.md` host table | `HOST_SKILL_DIRS` | `renderHostRow` two-way pin in `skills-kit-text.test.ts` | WIRED | Test passes |
| `docs/skills.md` § Recommended skills | role `skills:` declarations | `recommendedSkillsFindings` two-way pin | WIRED | Test passes (empty set, no-recommendation sentence present) |
| `docs/skills.md` | claim gates | `SKILLS_DOC` named part in `check-public-docs-vocabulary` and `check-banned-claims` | WIRED | Both scripts exit 0 |
| `AGENTS.md` line | claim registry | `## Adjudicated as NOT a claim` row | WIRED | `check-claim-anchors` exit 0 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| doctor skill lines | declared skills | roles' `skills:` frontmatter via the reader | Yes: my scratch edit of the installed designer role produced the lines | ✓ FLOWING |
| doctor found/missing | folder presence | `statSync` on `<folder>/<skill>/SKILL.md` per host row | Yes: absent then present flipped the line | ✓ FLOWING |
| doctor version line | Claude Code version | spawned `claude --version`, digits only | Yes: printed `Claude Code 2.1.325 meets the v2.1.293 floor` | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Phase test files | `npx vitest run scripts/skills-kit-text.test.ts install/skills-doctor.test.ts install/claude-version-doctor.test.ts scripts/role-skills-reader.test.ts install/host-tools.test.ts` | 215 of 216 passed on the first run; the one failure (`skills-doctor.test.ts:614`, OSC-title text) came from my own long `TMPDIR`, which truncated the line before the asserted text. Re-run with the default `TMPDIR`: `skills-doctor.test.ts` 45/45 | ✓ PASS (see Anti-Patterns, test fragility) |
| Committed `.js` equals source build | `tsc --outDir <scratch>` then `cmp` for role-skills-reader, host-tools, install, check-public-docs-vocabulary, check-banned-claims | all five identical | ✓ PASS |
| Kit gates | `node scripts/check-{claim-anchors,diff-disposition,role-rules,imperative-lexicon,public-docs-vocabulary,banned-claims}.js` | all exit 0 | ✓ PASS |
| Doctor end to end (no declaration, absent, present, `--strict`) | scratch install, `install.js --check` | exits 0 in every case; lines as in truth 5 | ✓ PASS |

I did not re-run the full suite, as instructed. The orchestrator's name-by-name comparison (HEAD against 76c6d8a6) is taken as stated; I did not recompute it.

### Probe Execution

Step 7c: SKIPPED. No PLAN declares a `probe-*.sh`, and `scripts/*/tests/probe-*.sh` does not exist for this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| SKILL-01 | 42-02, 42-03, 42-06, 42-07, 42-08 | Role may declare skills with fallback; protocol tells non-Claude hosts how to find skills (amended) | ✓ SATISFIED | Truth 1. REQUIREMENTS.md `[x]` |
| SKILL-02 | 42-01, 42-04 | Written evaluation of six candidates against six floors decides which are recommended | ✓ SATISFIED in the codebase; bookkeeping open | Truth 2. **REQUIREMENTS.md still shows `- [ ] **SKILL-02**` and traceability row `Pending`** (lines 76 and 160). 42-01-SUMMARY lists it as completed, 42-04-SUMMARY deliberately left `requirements-completed: []`. The orchestrator should tick it when closing the phase. |
| SKILL-03 | 42-03, 42-04, 42-07 | No third-party skill recommended; one stated-once precedence rule (amended) | ✓ SATISFIED | Truth 3. `[x]` |
| SKILL-04 | 42-04, 42-06 | Design-system files are read-never-write (amended) | ✓ SATISFIED | Truth 4. `[x]` |
| SKILL-05 | 42-02, 42-05, 42-07, 42-08 | `--check` warns, never fails, never installs | ✓ SATISFIED | Truth 5. `[x]` |

Orphaned requirements: none. `grep "Phase 42"` in REQUIREMENTS.md maps exactly SKILL-01..05, and the union of the eight plans' `requirements:` fields is exactly those five IDs.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| (all phase-modified non-planning files) | n/a | `TBD`/`FIXME`/`XXX` scan | none | No unreferenced debt marker found in the files I scanned or in the added lines of `install.ts`, `host-tools.ts`, `role-skills-reader.ts` |
| `docs/skills.md` | 7, 31-38 | Doc states doctor output slightly wrong (review IN-03, open) | ⚠️ Warning | Line 7 says `--check` "only reports a declared skill it cannot find" though it also prints `ok` lines (the page says so at § What install.js --check does); the Claude Code "May be moved by" cell omits `CLAUDE_CODE_PLUGIN_CACHE_DIR`. Not a goal failure; the page is internally inconsistent in one sentence |
| `install/README.md` | ~814 | Says a hidden place "gives a `not checked` line"; the label printed is `advisory` (IN-03) | ℹ️ Info | Wording only |
| `install/install.ts` | ~2686 | User-facing text points to a dev-only guard (IN-04) | ℹ️ Info | Promises a report a user will not see |
| `install/install.ts` | ~2780 | Version regex accepts a pre-release as meeting the floor (IN-02) | ℹ️ Info | `2.1.293-beta.1` prints `meets`; advisory only |
| `install/install.ts` | ~2720 | Unreachable `unread` branch (IN-01); `ENOBUFS` reported as "could not be run" (IN-06) | ℹ️ Info | No behavior impact |
| `install/skills-doctor.test.ts` | 126-135, 614 | Case-sensitivity test asserts nothing on case-insensitive filesystems (IN-05); the OSC test reads text from a line that a long temp path can truncate (found by this verification) | ℹ️ Info | A long `TMPDIR` can turn the `]0;pwned` assertion red even though the doctor is correct. The test is fragile, not the product |
| `42-VALIDATION.md` | frontmatter line 7 | `nyquist_compliant: false` in frontmatter while the checklist (line 82) says it was set to true; the orchestrator stated it is true | ℹ️ Info | The frontmatter is the field consumers read; it disagrees with the body and with the orchestrator's account. Needs a one-line fix by whoever owns that file |
| `IN-01..IN-06` | n/a | Open in `42-REVIEW-DISPOSITION.md` | ℹ️ Info | None blocks a truth; recorded, not fixed |

No anti-pattern is a blocker. The CR-01, CR-02, WR-01..WR-04 fixes are present as commits (`1b4cbc57`, `a6e05b94`, `da717415`, `59697a77` and others) and their tests pass.

### Human Verification Required

See the `human_verification` frontmatter list. In short:

1. **Live discovery on the five non-Claude hosts.** Docs-only today (UNKNOWN - verify). Test: place a skill in each documented folder and see whether the host lists it and whether the doctor agrees.
2. **A human read of `docs/skills.md`** for implied vetting and a fair reasons sentence (the page says the maintainer declined for "security, complexity, performance and licensing reasons").
3. **The `pending (named human)` rows** in `docs/audit/29-style-dispositions/42-03.md` and `42-06.md`. No `accepted by` has been written here for them.
4. **WR-01, WR-02, WR-03 fixes** marked "requires human verification" in `42-REVIEW-FIX.md`.
5. **Accepted risk R-42-01** in `42-SECURITY.md`, awaiting a named human. I wrote no "accepted by" for it.
6. **Windows behavior** of the CR-01 and WR-04 probe: UNKNOWN - verify.

Also not independently re-verified: that each quoted upstream line in `42-EVALUATION.md` exists at its pinned SHA. The evaluation is a sourced judgment; I checked its structure and its recorded decision, not the upstream repositories.

### Gaps Summary

No goal-blocking gaps. All five roadmap success criteria hold in the codebase as amended at 42-04, and the doctor behaves as claimed when run end to end. Three housekeeping items for the orchestrator (not truth failures):

- REQUIREMENTS.md still lists SKILL-02 as `[ ]` / Pending although the evaluation exists and the decision is recorded.
- `42-VALIDATION.md` frontmatter says `nyquist_compliant: false`, against its own checklist and the orchestrator's note.
- The untracked `~/` folder, `brand/readme-art.txt` and the modified `docs/audit/28-prepass-evidence.md` are pre-existing and were not touched.

---

_Verified: 2026-11-17T11:15:00Z_
_Verifier: Claude (gsd-verifier)_
