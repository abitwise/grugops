---
phase: quick-261123-rte
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - docs/skills.md
  - docs/audit/28-claim-registry.md
autonomous: true
requirements: [QUICK-261123-rte]

estimate:
  tokens: 25000
  raw_tokens: 25000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "docs/skills.md names the phase 42 evaluation record only by its archived path `.planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`: in the § Recommended skills link text, in that link's repository URL, and in § How these were chosen"
    - "The shipped-docs link check passes: the check-story-docs live-tree test reports `PASS  STORY-05 shipped links` with no finding for docs/skills.md:22"
    - "The four skills-kit-text tests that read the record named in § How these were chosen find it on disk and pass"
    - "Claim row C-28-086 in docs/audit/28-claim-registry.md stays byte-identical to docs/skills.md line 66, so `node scripts/check-claim-anchors.js` still prints ALL CHECKS PASSED"
    - "The evaluation record is not moved, copied or edited; the prose of docs/skills.md is unchanged apart from the path; no other stale `.planning/phases/<v3.0 phase>` reference in docs/audit/ or code comments changes"
  artifacts:
    - path: "docs/skills.md"
      provides: "The skills page, naming the archived evaluation record in three places (link text, link URL, § How these were chosen)"
      contains: ".planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md"
    - path: "docs/audit/28-claim-registry.md"
      provides: "Row C-28-086, whose fenced verbatim line mirrors docs/skills.md line 66 byte for byte"
      contains: "The record `.planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`"
  key_links:
    - from: "docs/skills.md § How these were chosen"
      to: ".planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md"
      via: "the first backticked *-EVALUATION.md path, read by evaluationText() in scripts/skills-kit-text.test.ts and checked with existsSync under ROOT"
      pattern: "milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md"
    - from: "docs/skills.md line 22 link URL"
      to: ".planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md"
      via: "linkFindings() in scripts/check-story-docs.ts strips the https://github.com/abitwise/grugops/blob/main/ prefix and checks the rest exists"
      pattern: "blob/main/.planning/milestones/v3.0-phases/42-"
    - from: "docs/audit/28-claim-registry.md ### C-28-086 verbatim block"
      to: "docs/skills.md line 66"
      via: "scripts/check-claim-anchors.js exact byte comparison of the anchored text (run in .github/workflows/ci.yml)"
      pattern: "^The record `.planning/milestones/v3.0-phases/42-"
---

<objective>
Repoint the two references in docs/skills.md to the phase 42 evaluation record so they name the path where the v3.0 milestone close (commit 0fe1adb4) archived it: `.planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`. That record exists there and is tracked (`git ls-files` prints it).

Purpose: CI ubuntu run 44923794976 is red on exactly these references. Five tests in two files fail: `scripts/check-story-docs.test.ts` "the live tree: every shipped docs link resolves in a kit home" (finding `docs/skills.md:22 ... repository URL names a path that does not exist`), and four tests in `scripts/skills-kit-text.test.ts` that read the record named in § "How these were chosen". The baseline at HEAD 1791c1c8, measured during planning, is 5 failed and 380 passed over the six related test files.

User decision (already made, and binding): repoint both occurrences, text and URL. Do NOT move or copy the record. Do NOT touch the ~49 other stale `.planning/phases/<v3.0 phase>` references in docs/audit/ and code comments, because no check reads them. Keep the page's prose otherwise unchanged (voice discipline: plain English).

Planner finding that the decision did not cover (in scope, because a check reads it): docs/skills.md line 66 sits under `<!-- claim: C-28-086 -->`. Row `### C-28-086` in docs/audit/28-claim-registry.md holds a fenced verbatim copy of that line, and `node scripts/check-claim-anchors.js` (run in CI) compares the two byte for byte. A scratch worktree measured during planning showed that editing the page alone turns this check red ("the text at C-28-086's anchor (line 66) is not byte-identical to the registry's verbatim block"). The check's own remedy says to update the registry row in the same commit as the prose change. So the one verbatim line in that row changes with the page. Nothing else in docs/audit/ changes.

Output: two commits, three changed lines in total: docs/skills.md lines 22 and 66, and the verbatim line of C-28-086. No push.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@docs/skills.md

Planning measurements (scratch worktree at HEAD 1791c1c8 with all three line edits applied; worktree since removed):
- `npx vitest run scripts/check-story-docs.test.ts scripts/skills-kit-text.test.ts scripts/check-claim-anchors.test.ts scripts/check-public-docs-vocabulary.test.ts scripts/check-banned-claims.test.ts scripts/check-audit-register.test.ts` gave 6 files and 385 tests passed, in about 15 s.
- `node scripts/check-claim-anchors.js`, `node scripts/check-audit-register.js` and `node scripts/check-story-docs.js` each exited 0.
- With the page edited and the registry left alone, `node scripts/check-claim-anchors.js` exited 1 with the C-28-086 drift message.
- Every grep gate below fails at HEAD and passes after the edit.
- The stderr lines starting `FAIL  the exemption document ...` / `FAIL  the one named exemption region ...` that vitest prints are expected output from negative-fixture tests and are present at baseline. Judge by the `Test Files` / `Tests` summary lines.

Project memory: the full suite needs more than 600 s, and the /tmp quota can cause false EDQUOT failures. Run only the files named here. Do not run `npm run check:*` either, because those scripts write `.tmp-build/`. CI runs the committed `node scripts/*.js` directly, so the commands below run the same code.
</context>

<tasks>

<task type="tracer">
  <name>Task 1: End to end — § How these were chosen names the archived record, and claim row C-28-086 mirrors it byte for byte</name>
  <files>docs/skills.md, docs/audit/28-claim-registry.md</files>
  <read_first>
    - docs/skills.md lines 62-66 (§ "How these were chosen"; line 65 is the `<!-- claim: C-28-086 -->` anchor, line 66 is the claimed sentence)
    - docs/audit/28-claim-registry.md lines 1366-1377 (row `### C-28-086`: file, `line: 66`, kind, depends_on, status, mechanism, then a fenced block holding one verbatim line)
    - scripts/skills-kit-text.test.ts lines 519-526 (evaluationText(): takes the first backticked `*-EVALUATION.md` path in § How these were chosen, asserts existsSync under ROOT, reads it)
    - scripts/check-claim-anchors.ts lines 433-444 (the exact-comparison failure and its "update the registry row in the SAME commit" remedy)
  </read_first>
  <action>
    Implements the user's repoint decision: keep the record where it is and change only the path that names it. First confirm the target. `git ls-files .planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md` must print that path. If it prints nothing, stop and report; do not create, copy or move the record.

    Step 1, docs/skills.md line 66, the sentence under `<!-- claim: C-28-086 -->` in § "How these were chosen": in the backticked record path, replace the directory segment `.planning/phases/` with `.planning/milestones/v3.0-phases/`. The path then reads `.planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`. Change no other byte: the backticks, the rest of the sentence, the line ending and the line count stay as they are. The file stays 66 lines, so the registry's `line: 66` stays true.

    Step 2, docs/audit/28-claim-registry.md row `### C-28-086` (near line 1366): inside its fenced verbatim block there is one line, starting with the words "The record" and a backtick. Make the same one-segment change there, so the line is byte-identical to the new docs/skills.md line 66. The reason: scripts/check-claim-anchors.js compares the anchored page text to this block exactly, CI runs it at .github/workflows/ci.yml, and its remedy requires the registry row to change in the same commit as the prose. Leave every other line of the row unchanged: `file`, `line: 66`, `kind`, `depends_on`, `status` and `mechanism`. The mechanism line is a dated measurement record from 2026-11-19. Like row C-28-079's mechanism and the other stale phase-directory references in docs/audit/, it is out of scope under the user's decision because no check reads it. Do not edit rows other than C-28-086.

    Step 3: commit the two files together in one commit, and do not push. Subject: `docs(quick-261123-rte): name the archived 42-EVALUATION.md in skills.md and claim C-28-086`. Body, in plain English: the record moved to `.planning/milestones/v3.0-phases/` at the v3.0 milestone close (0fe1adb4), and the C-28-086 verbatim follows the page in the same commit because check-claim-anchors compares the two byte for byte. Use the Edit tool for exact single-line replacements.
  </action>
  <verify>
    <automated>node scripts/check-claim-anchors.js && npx vitest run scripts/skills-kit-text.test.ts scripts/check-claim-anchors.test.ts && sed -n 66p docs/skills.md | grep -q 'milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md' && test "$(grep -c '^The record `.planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`' docs/audit/28-claim-registry.md)" = 1 && test "$(wc -l < docs/skills.md)" -eq 66</automated>
  </verify>
  <done>
    - `node scripts/check-claim-anchors.js` prints `ALL CHECKS PASSED` and exits 0. It still reports 87 verbatim comparisons, all byte-identical.
    - `scripts/skills-kit-text.test.ts` passes 33 of 33 tests, including the four that failed at baseline. `scripts/check-claim-anchors.test.ts` passes.
    - One commit touches exactly docs/skills.md and docs/audit/28-claim-registry.md, with 2 insertions and 2 deletions. Nothing is pushed.
  </done>
</task>

<task type="auto">
  <name>Task 2: § Recommended skills links the archived record (link text and repository URL)</name>
  <files>docs/skills.md</files>
  <read_first>
    - docs/skills.md lines 19-22 (line 19 anchors C-28-079, which claims only line 20; line 22 is an unanchored paragraph ending in the markdown link)
    - scripts/check-story-docs.ts lines 266-285 (linkFindings(): a `https://github.com/abitwise/grugops/blob/main/` URL is resolved by stripping that prefix and checking that the rest exists in the tree)
  </read_first>
  <action>
    Implements the second half of the user's repoint decision, covering both the text and the URL. docs/skills.md line 22 is in § "Recommended skills". It ends with a markdown link whose backticked link text and whose URL both name the record under the pre-archive phase directory. In both places, replace the directory segment `.planning/phases/` with `.planning/milestones/v3.0-phases/`. After the edit, the link text is the backticked path `.planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`. The URL is `https://github.com/abitwise/grugops/blob/main/.planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`. Keep the scheme, host, owner, repository and `blob/main/` prefix, and the whole sentence before the link, byte-identical (voice discipline: no prose change). Do not add or remove a line. Line 22 is not under a claim anchor, so no registry row changes in this task.

    Commit docs/skills.md alone, and do not push. Subject: `docs(quick-261123-rte): link the archived 42-EVALUATION.md from skills.md § Recommended skills`. Body, in plain English: the shipped-docs link check (check-story-docs, STORY-05) was red because the repository URL named the pre-archive path.
  </action>
  <verify>
    <automated>npx vitest run scripts/check-story-docs.test.ts scripts/skills-kit-text.test.ts && ! git grep -q -e '\.planning/phases/42-' -- docs/skills.md && test "$(grep -o 'milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md' docs/skills.md | wc -l)" -eq 3</automated>
  </verify>
  <done>
    - `scripts/check-story-docs.test.ts` passes, including "the live tree: every shipped docs link resolves in a kit home", and the STORY-05 shipped links line reads PASS. `scripts/skills-kit-text.test.ts` still passes.
    - `git grep -n "\.planning/phases/42-" docs/skills.md` prints nothing.
    - The archived path appears exactly 3 times in docs/skills.md: link text, URL, and § How these were chosen.
    - One commit touches only docs/skills.md, with 1 insertion and 1 deletion. Nothing is pushed.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| shipped docs page → reader | A reader follows the repository URL in docs/skills.md and trusts that it points at the real evaluation record |
| docs page ↔ claim registry | The registry's verbatim block is the audited copy of a public claim; check-claim-anchors enforces that the two match |

## STRIDE Threat Register

ASVS level 1, block on high. No threat here is high or critical.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261123-rte-01 | Tampering | docs/audit/28-claim-registry.md row C-28-086 verbatim | medium | mitigate | Change only the directory segment inside the one fenced verbatim line. Keep `line`, `status`, `kind`, `depends_on` and `mechanism` as they are. Commit it with the page edit, and name the repoint in the commit subject and body so it is not a quiet rewording. `node scripts/check-claim-anchors.js` proves byte identity (Task 1 verify). |
| T-261123-rte-02 | Spoofing | docs/skills.md line 22 repository URL | low | mitigate | The scheme, host, owner, repository and `blob/main/` prefix stay byte-identical; only the path after `blob/main/` changes. check-story-docs resolves that path against the tracked tree (Task 2 verify). `git ls-files` confirms the target is tracked before any edit. |
| T-261123-rte-03 | Information disclosure | link to a `.planning/` record from a shipped page | low | accept | The page already linked this record publicly. The repository is public and the record's content does not change. No new information is exposed. |
| T-261123-rte-SC | Tampering | npm/pip/cargo installs | low | accept | No package is installed. Verification runs vitest, which is already locked in the repository's devDependencies and node_modules. No install task exists, so the package-legitimacy gate does not apply. |
</threat_model>

<verification>
Run from the checkout root after both task commits:

1. `npx vitest run scripts/check-story-docs.test.ts scripts/skills-kit-text.test.ts scripts/check-claim-anchors.test.ts scripts/check-public-docs-vocabulary.test.ts scripts/check-banned-claims.test.ts scripts/check-audit-register.test.ts` must report `Test Files  6 passed (6)` and `Tests  385 passed (385)`. The baseline at HEAD 1791c1c8 was 5 failed and 380 passed. The run takes about 15 s.
2. `node scripts/check-claim-anchors.js && node scripts/check-audit-register.js && node scripts/check-story-docs.js` must exit 0.
3. `git grep -n "\.planning/phases/42-" docs/skills.md` must print nothing.
4. Scope: `git show --stat HEAD~1` and `git show --stat HEAD` together list only docs/skills.md and docs/audit/28-claim-registry.md, with 3 insertions and 3 deletions in total. `git ls-files .planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md` still prints the path, and neither commit touches anything under `.planning/`. The record is not moved, copied or edited.
5. Nothing is pushed: `git status -sb` shows main ahead of origin/main by the two commits, or by more if the quick workflow adds its own docs commit.

Do not run the full suite (more than 600 s, and /tmp EDQUOT false failures per project memory).
</verification>

<success_criteria>
- The five CI-red tests (1 in check-story-docs.test.ts, 4 in skills-kit-text.test.ts) pass. The four other related test files and the three committed checks stay green.
- docs/skills.md names the evaluation record only by its archived path, 3 occurrences, with no other prose change.
- Claim row C-28-086's verbatim matches docs/skills.md line 66 byte for byte. No other registry content changes.
- The record stays where the milestone archive put it. The other stale `.planning/phases/<v3.0 phase>` references are untouched. Two commits, no push.
</success_criteria>

<output>
Create `.planning/quick/261123-rte-repoint-docs-skills-md-links-to-the-arch/261123-rte-SUMMARY.md` when done
</output>
