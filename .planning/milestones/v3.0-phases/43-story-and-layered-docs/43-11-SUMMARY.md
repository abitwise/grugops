---
phase: 43-story-and-layered-docs
plan: "11"
subsystem: docs
tags: [readme, claim-registry, retired-claims, story-docs-gate, docs-index]

requires:
  - phase: 43-01
    provides: the `retired` claim status and the check-claim-anchors retired arm
  - phase: 43-03
    provides: the story-docs gate (check-story-docs) this plan extends
  - phase: 43-09
    provides: docs/concepts.md and docs/how-it-works.md, the pages the README now links
  - phase: 43-10
    provides: docs/usage.md with the start table; the README pointer lines
provides:
  - README.md as the short front door (art, tagline, story, host-neutral quickstart, how-it-works bullets, where next)
  - claim rows C-28-069 (tagline) and C-28-070 (story)
  - C-28-002, C-28-003 and C-28-008 status retired, each naming the last commit where its text stood
  - C-28-001 moved byte for byte to docs/concepts.md, with SAFETY_CLAIM_HOMES and the regenerated guarantees and exclusions
  - a live-tree test that each retired row's commit is on HEAD's history and holds the verbatim
  - docs/README.md, the docs index
  - check-story-docs check 4 (STORY-01): TAGLINE and readmeStoryFindings
affects: [43-12, 43-13, milestone UAT]

actuals:
  tokens: 26726
  tasks: 3
  commits: 5
plan_head_before: 863c81b1340c2f8f25c63b5a2b3fdd3d8649e16a
plan_head_after: 2d208eed57b0bdd164a42b3ac3e22b2633af9f2c

tech-stack:
  added: []
  patterns:
    - "A retired claim row names its last-standing commit; a live test reads git objects to prove that commit is an ancestor of HEAD and holds the verbatim, failing by id and sha"
    - "Test harnesses that read live registry anchors skip `status: retired` rows, as the gate partitions them"

key-files:
  created:
    - docs/README.md
    - docs/audit/29-style-dispositions/43-11.md
    - .planning/phases/43-story-and-layered-docs/43-11-task2-red.json
    - .planning/phases/43-story-and-layered-docs/43-11-task3-red.json
  modified:
    - README.md
    - docs/concepts.md
    - docs/audit/28-claim-registry.md
    - docs/GUARANTEES.md
    - docs/audit/28-safety-surface-exclusions.md
    - scripts/check-story-docs.ts
    - scripts/check-story-docs.test.ts
    - scripts/check-claim-anchors.test.ts
    - scripts/check-audit-register.ts
    - scripts/check-audit-register.test.ts
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-banned-claims.ts
    - scripts/audit-model.test.ts
    - scripts/frontmatter.test.ts
    - scripts/generate-safety-surface.test.ts

key-decisions:
  - "The README story is four plain sentences measured against orchestrator.md, WF04, WF05, WF16 and WF17; it says the workflows stop at a pull request and leave merge and deploy to a person, and asserts no outcome, count, cost, token or speed benefit (C-28-070)"
  - "Retired rows keep their earlier measurement after a retirement sentence that names the reason and the last commit: C-28-002 and C-28-003 at `863c81b1`, C-28-008 at `65ec4751`"
  - "C-28-001 sits under `## In one paragraph` after the concepts page's opening paragraph, so the page still opens with its own two-line introduction"
  - "Moving C-28-001 makes docs/concepts.md a safety-claim home, so it joins the diff-disposition watched corpus and README.md leaves it; the concepts page's 43-09 text got disposition rows as unchanged, newly watched text"
  - "The `All docs` link to docs/README.md lands in Task 3 with the page, because the story gate's link check refuses a README link to a missing file"

patterns-established:
  - "Retired-commit proof: `git merge-base --is-ancestor <sha> HEAD` plus `git show <sha>:<file>` containing the verbatim; never skips"

requirements-completed: [STORY-01, STORY-04, STORY-02]

coverage:
  - id: D1
    description: "README.md opens with the art fence, the tagline H1 and a plain story, never says simple software factory, and carries no grug voice in its body"
    requirement: STORY-01
    verification:
      - kind: unit
        ref: "scripts/check-story-docs.test.ts#the live README gives no finding"
        status: pass
      - kind: other
        ref: "npm run check:story-docs (STORY-01 README tagline: 0 findings over 1/1 elements)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The README is a host-neutral front door of 3,000 to 4,600 bytes in the decided section order"
    requirement: STORY-01
    verification:
      - kind: other
        ref: "wc -c < README.md (4045 bytes); grep -c host flags README.md (0)"
        status: pass
    human_judgment: true
    rationale: "Whether a newcomer reads the story and the front door as intended is a reader's judgment; plan 43-12's reader review and the milestone UAT record it"
  - id: D3
    description: "C-28-002, C-28-003 and C-28-008 are retired by id; each named commit is an ancestor of HEAD that holds the verbatim"
    requirement: STORY-04
    verification:
      - kind: unit
        ref: "scripts/check-claim-anchors.test.ts#LIVE TREE: each retired row's commit is an ancestor of HEAD and holds the verbatim; there are 3"
        status: pass
      - kind: unit
        ref: "scripts/check-claim-anchors.test.ts#FAILS by id and sha, never skips, when the named commit is not in the repository"
        status: pass
      - kind: other
        ref: "node scripts/check-claim-anchors.js (70 rows, 3 retired, ALL CHECKS PASSED)"
        status: pass
    human_judgment: false
  - id: D4
    description: "C-28-001 moves byte for byte to docs/concepts.md with its safety home, guarantees page and exclusion list"
    requirement: STORY-04
    verification:
      - kind: unit
        ref: "scripts/check-audit-register.test.ts#the LIVE registry's safety arm equals the declared roster, in BOTH directions"
        status: pass
      - kind: other
        ref: "npm run freshness:guarantees; node scripts/check-audit-register.js"
        status: pass
    human_judgment: false
  - id: D5
    description: "docs/README.md indexes every shipped docs page and the five examples, and the corpus pins moved for it"
    requirement: STORY-02
    verification:
      - kind: other
        ref: "Task 3 acceptance loop over concepts, how-it-works, usage, reference, skills, GUARANTEES, faq and examples/03 (OK)"
        status: pass
      - kind: other
        ref: "node scripts/check-public-docs-vocabulary.js; node scripts/check-banned-claims.js (0 findings over 161/161)"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-11-18
status: complete
---

# Phase 43 Plan 11: The README front door Summary

**README.md now opens with the lettering-and-fire art, the H1 `# grugops — Specialist agents. Shared context. Coordinated work.` and a four-sentence plain story (C-28-069, C-28-070). It is a 4,045-byte host-neutral front door. The old tagline, the `grug-brained` sentence and the "Go deep" step are retired by id. C-28-001 moved to docs/concepts.md. docs/README.md indexes the docs. The story gate now refuses a README that does not open with the tagline.**

## Performance

- **Duration:** about 18 min
- **Started:** 2026-11-18T06:37:58Z
- **Completed:** 2026-11-18T06:56Z
- **Tasks:** 3 (Tasks 2 and 3 each in a RED and a GREEN commit)
- **Files modified:** 23 (4 created, 19 modified)

## Accomplishments

- README.md, in order: the six art lines from brand/readme-art.txt in a `text` fence, the anchored tagline H1, the anchored story, `## Quickstart` (C-28-004, C-28-005 with its fence and a trimmed 189-byte paragraph, C-28-006, and a one-line step 2 pointing to the start table in docs/usage.md and to install/README.md), `## How it works` (five bullets, each linking a docs/how-it-works.md section), `## Where to go next` (concepts, how it works, usage, reference, install guide, all docs), `## Safety guarantees`, `## Changelog`, `## Acknowledgements` and the footer, byte for byte. No host flag, no diagram and no "Possible texts" line. The architecture art and its token, count and provider claims were not used.
- Registry: C-28-069 and C-28-070 added as `architecture` rows, each with a measured mechanism. C-28-002 and C-28-003 are retired at `863c81b1`, and C-28-008 at `65ec4751`. Their rows, ids and verbatim blocks stay. C-28-001 now names docs/concepts.md. Header annotations record 70 rows, and the retired section records 2 and then 3 retired rows.
- C-28-001's anchor and paragraph moved byte for byte under `## In one paragraph` in docs/concepts.md. SAFETY_CLAIM_HOMES and MIRROR_SAFETY_HOMES name the new file. docs/GUARANTEES.md and docs/audit/28-safety-surface-exclusions.md are regenerated and fresh.
- A live-tree case in scripts/check-claim-anchors.test.ts checks every retired row. The commit its mechanism names must be an ancestor of HEAD, and `git show <sha>:<file>` must contain the verbatim. There must be 3 such rows. Two companion cases fail by id and sha: one for an unknown sha, one for a sha that never held the text. The merge-style assumption is stated in a comment.
- check-story-docs check 4: `TAGLINE` and `readmeStoryFindings`. It reads the first non-blank line outside fences and HTML comments, including multi-line comments, and flags `simple software factory` in any case. It gives two findings on the phase base commit's README and none on the live README. It uses only `fencedLineFlags` from ./frontmatter.js, so no foundation-guard pin moved.
- docs/README.md: `# grugops docs`, one sentence, links to concepts, how it works, usage, reference, third-party skills, guarantees, FAQ and the five examples, and repository-URL links to the root README and the install guide.

## Task Commits

1. **Task 1 (tracer): art, tagline and story** - `0d67fd62` docs(43-11): README opens with the new tagline and story
2. **Task 2 RED** - `65ec4751` test(43-11): every retired row names a commit on HEAD's history that held its text
3. **Task 2 GREEN** - `58a8b371` docs(43-11): README is a short front door; C-28-001 moves to concepts
4. **Task 3 RED** - `b5f1e436` test(43-11): the story gate's README tagline check, before it exists
5. **Task 3 GREEN** - `2d208eed` feat(43-11): the story gate holds the README tagline

**Tracer feedback gate (Task 1):** this was not an auto-mode run, `human_verify_mode` is `end-of-phase`, and the `<verify>` block was automated only. The verify chain was re-run green before expanding: the six gates exited 0, and 5 test files passed 184 tests.

## TDD Gate Compliance

- **Task 2 RED:** the target was `scripts/check-claim-anchors.test.ts > … (D-25) > LIVE TREE: each retired row's commit is an ancestor of HEAD and holds the verbatim; there are 3`. It failed with `expected 'C-28-002, C-28-003' to be 'C-28-002, C-28-003, C-28-008'`. Its first assertion passed: the commit findings for C-28-002 and C-28-003 were empty. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`). Semantic assessment: the target ran and failed on the planned behavior gap, because C-28-008 was not yet retired. There was no load, syntax or fixture fault. Record: `43-11-task2-red.json`. The first record was classified `INVALID_RED (invalid_record)`: a `toEqual` diff of arrays put unindented multi-line YAML into the TAP output. The assertion was rewritten to compare joined strings, the run was narrowed to the target, and the record was taken again. The record was never edited to make it parse.
- **Task 3 RED:** the target was `scripts/check-story-docs.test.ts > check 4 … > the live tree: the README check passes`. It failed with `expected '' to be 'PASS'`: the committed gate printed no STORY-01 line. The result was `RED_EVIDENCE_OK`. Record: `43-11-task3-red.json`. The first attempt asserted with a regex, and its `\s` escapes in the TAP YAML were refused as `invalid_record`. The assertion now compares the verdict word. A `readmeStoryFindings is not a function` failure was not used as RED, because the symbol did not exist yet.
- **GREEN:** `58a8b371` and `2d208eed`. The RED targets and the rest of each file pass.
- **REFACTOR:** none.

## Pin moves, read off each gate's refusal

| Pin | Move | Refusal (verbatim head) | Commit |
|---|---|---|---|
| CLAIM_KIND_CARDINALITY architecture (+ MIRROR_ARCHITECTURE_CLAIMS) | 54 -> 56 | `architecture declares 54 but the registry carries 56` | 0d67fd62 |
| SAFETY_CLAIM_HOMES / MIRROR_SAFETY_HOMES C-28-001 | README.md -> docs/concepts.md | (the plan's named edit; the live-roster case pins it two-sided) | 58a8b371 |
| PUBLIC_DOCS_SCAN_COUNT | 43 -> 44 | `the public-docs scan set derived 44 document(s), expected exactly 43 (… docs 32)` | 2d208eed |
| BANNED_CLAIM_SCAN_COUNT | 160 -> 161 | `the banned-claim scan set derived 161 document(s), expected exactly 160 (… publicDocs 45 …)` | 2d208eed |

Each move has a dated history comment. No foundation-guard pin moved. The whole-file run of scripts/check-foundation-guards.test.ts had one failure, the baseline LANG-07 case (`~/` directory), out of 344 tests.

## Files Created/Modified

- `README.md`: the short front door
- `docs/README.md`: the docs index
- `docs/concepts.md`: `## In one paragraph` with C-28-001
- `docs/audit/28-claim-registry.md`: two new rows, three retired rows, the C-28-001 move, and annotations
- `docs/GUARANTEES.md`, `docs/audit/28-safety-surface-exclusions.md`: regenerated
- `docs/audit/29-style-dispositions/43-11.md`: 31 disposition rows
- `scripts/check-story-docs.ts` / `.js` / `.test.ts`: check 4 and its cases
- `scripts/check-claim-anchors.test.ts`: the retired-commit proof
- `scripts/check-audit-register.ts` / `.js` / `.test.ts`: the cardinality, the safety home, and the mirror (`examples/`, docs/concepts.md)
- `scripts/check-public-docs-vocabulary.ts` / `.js`, `scripts/check-banned-claims.ts` / `.js`: the corpus pins
- `scripts/audit-model.test.ts`, `scripts/frontmatter.test.ts`, `scripts/generate-safety-surface.test.ts`: the harness repairs listed below
- `.planning/phases/43-story-and-layered-docs/43-11-task2-red.json`, `43-11-task3-red.json`: the RED evidence records

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] check-diff-disposition went red on both README edits**
- **Found during:** Tasks 1 and 2
- **Issue:** README.md was a watched file, with 13 findings after Task 1. Moving C-28-001 made docs/concepts.md a safety-claim home. That page did not exist at the gate's base commit, so it joined the watched corpus with 18 findings. README.md, which no longer holds a safety claim, left the corpus.
- **Fix:** `docs/audit/29-style-dispositions/43-11.md` has one row per finding, as plans 43-09 and 43-10 did. The concepts rows record unchanged 43-09 text that is newly watched. The gate is back to 0 findings.
- **Commits:** 0d67fd62, 58a8b371

**2. [Rule 1 - Bug] Two live-registry cases in audit-model.test.ts expected an anchor for every markdown row**
- **Found during:** Task 2's broader run (the cases were already red after Task 1 retired C-28-002 and C-28-003)
- **Issue:** "every live anchored block is found…" and "THE TWO-ROUTE BLOCK COUNT" read all rows, so the retired rows, which owe no anchor by D-25, were reported as missing anchors.
- **Fix:** both routes read only standing rows, as check-claim-anchors partitions them. A retired id that is still anchored would still show up as an anchor with no standing row.
- **Commit:** 58a8b371

**3. [Rule 3 - Blocking] The register and safety-surface mirrors could not vouch for docs/concepts.md**
- **Found during:** Task 2
- **Issue:** `shippedDocs()` walks `docs` and `examples` and returns null when one is missing. The mirrors had no `examples/`, so after C-28-001 moved, the safety claim's new home was "not vouched for". This made 13 cases red.
- **Fix:** both mirrors carry an empty `examples/`. The register mirror also writes docs/concepts.md, and MIRROR_SOLE_DOC is docs/concepts.md, the live home with exactly one safety claim.
- **Commit:** 58a8b371

**4. [Rule 1 - Bug] frontmatter.test.ts required a fenced heading in README.md**
- **Found during:** Task 2's broader run
- **Issue:** The "no fenced heading in the WATCHED corpus …" case needs at least one fenced `#` line per file. README.md lost its Claude Code fence, and its only remaining fence is the art.
- **Fix:** install/README.md (16 fenced heading lines) is read in its place. A dated comment explains the change.
- **Commit:** 58a8b371

**5. [Plan order] The `All docs` line lands in Task 3**
- The plan's where-next list includes docs/README.md as "all docs". The story gate's link check refuses a README link to a missing file, so the line was added in the commit that writes docs/README.md.

**6. [Plan wording] Small text choices**
- The story's third sentence says the workflows "stop at a pull request and leave merge and deploy to a person". This matches C-28-054 and claims no outcome. The fourth sentence names roles, workflows, board and trace as markdown, not "everything in your repository", because the kit lands in `~/.grugops` and the tooling is `.js`.
- Retired mechanisms keep their earlier measurement after the retirement sentence.

**Total deviations:** 4 auto-fixed (2 Rule 1, 2 Rule 3), 1 ordering note and 1 wording note. **Impact:** three test harnesses and one disposition file outside files_modified. No scope change.

## Verification

- Every task's `<automated>` command passed, and every acceptance criterion passed:
  - tagline 1, `simple software factory` 0, grug lines 0
  - retired rows 2, then 3
  - C-28-001 placed after the tagline, then 1 in concepts and 0 in README
  - draft words 0, and brand/readme-art.txt untracked
  - SIZE OK at 3999 bytes after Task 2 and 4045 bytes after Task 3
  - how-it-works link lines 5, the guarantees pointer 1, host flags 0
  - the index loop printed OK, `readmeStoryFindings` 2, and the corpus-join ancestry check exited 0
- I re-ran the 43-BASELINE.md gate table after the last commit. Every gate exits as it did at base: 13 exit 0, and `check-flip-manifest` exits 1. `check:story-docs`, `check-uat-oracles` and `npm run typecheck` also exit 0. `npm run freshness` reports 93 `.js` files fresh.
- I ran 15 files that read README.md or the registry after the last commit: 1191 passed. Earlier, a broader run of 9 more files showed only the 7 baseline context-io reds.
- The full suite was not run, because the orchestrator runs it after this wave.

## Issues Encountered

- docs/README.md had to be in git's index (`git add -N`) before the commit, as earlier plans found for new pages.
- The user's `docs/audit/28-prepass-evidence.md` change, `brand/readme-art.txt` and `~/` were never staged. The generators did not touch the prepass file: its modification time is unchanged since 2026-10-29.

## Known Stubs

None.

## Threat Flags

None. The plan changes documentation and test or gate scope only. T-43-33 is mitigated: only the six art lines were copied, the draft-word grep prints 0, and the draft is untracked. T-43-34 is mitigated by the retired-commit proof. T-43-35 is mitigated: the safety home moved with the claim and the outputs are regenerated and fresh.

## User Setup Required

None.

## Next Phase Readiness

- Plan 43-12's reader review can read the new README. Whether a newcomer reads the story as intended is still an open assumption (STORY-01 edge probe), and no pass is recorded for it.
- The next free claim id is C-28-071.
- README.md is no longer in the diff-disposition watched corpus, because it holds no safety claim now. docs/concepts.md is in it.

## Self-Check: PASSED

- FOUND: README.md, docs/README.md, docs/concepts.md, docs/audit/29-style-dispositions/43-11.md, 43-11-task2-red.json, 43-11-task3-red.json
- FOUND commits: 0d67fd62, 65ec4751, 58a8b371, b5f1e436, 2d208eed (5 = `git rev-list --count 863c81b1..HEAD`; evaluation-scope resolved them from plan subjects)
