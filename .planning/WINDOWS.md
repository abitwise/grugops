---
schema_version: 1
open_count: 195
waived_count: 2
fixed_count: 24
total_count: 221
last_updated: 2026-09-18T13:34:26.209Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 27 | unrun-verify | .planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md |  | SPAWN-03 runtime half unobserved: the session startup header and whether a distinct role agent resolves and runs; slots empty in the recording surface | open |  | 2026-07-29T10:56:31.216Z |  |
| 2 | 27 | deviation | scripts/coordinator-resolution-precheck.ts |  | The materialized-kit sentinel reader is duplicated from install/install.ts readAdapterKit (install.ts installs at module load, so it cannot be imported) | open |  | 2026-07-29T10:56:31.277Z |  |
| 3 | 27 | deviation | scripts/frontmatter.ts |  | Quoted-wrapped-continuation false-red residual: a double-quoted scalar wrapping onto a line starting with & or * is refused though those bytes are literal; dispositioned accept under T-27-94 (fails closed, no shipped surface produces it) | open |  | 2026-07-30T13:06:23.456Z |  |
| 4 | 27 | deviation | scripts/check-foundation-guards.ts |  | IN-03 (round 5) still live: guardKitCounts asserts per-part SET equality but never asserts the four parts EXHAUST the composition, so a member under no part prefix is unreported by the guard; pinned only over a fixture in kit-model.test.ts. Deliberately out of scope for 27-37 (D-47 names only the catch-swallow). | open |  | 2026-08-04T06:58:26.002Z |  |
| 5 | 27 | deviation | scripts/frontmatter.test.ts |  | 27-38 false-red control: only 1 scoped grant enumeration exists across all 33 spawn-grant scan members, so 'zero false reds across 33 members' rests on one enumeration (the coordinator's 16-name grant), not 33 | open |  | 2026-08-04T07:22:51.768Z |  |
| 6 | 27 | deviation | scripts/validate-agent-factory.ts |  | Not a spawn-grant surface (0 spawn / 0 frontmatter / 0 wr05); the round-7 'validator printed ALL CHECKS PASSED' criterion is unsatisfiable and is owned by no round-8 plan. 27-44-SUMMARY.md recommends retiring it. | open |  | 2026-08-09T10:23:33.078Z |  |
| 7 | 27 | deviation | scripts/frontmatter.test.ts |  | 27-55: AXIS_SPELLING places the block sibling only AFTER the payload, so block-BEFORE ordering is outside the union axis's shape space (covered instead by the U4 adjacency case and probes a4/a6/a7) | open |  | 2026-08-10T12:15:03.445Z |  |
| 8 | 27 | deviation | scripts/frontmatter.test.ts |  | 27-55: the pre-fix-mirror non-circularity count is 1 of 72 cells — non-empty so the axis provably sees the defect, but thin; add an ORDERING member to AXIS_SPELLING and re-take the count | open |  | 2026-08-10T12:15:03.506Z |  |
| 9 | 27 | deviation | scripts/frontmatter.ts |  | raw.trim()'s alphabet (Unicode WhiteSpace) is wider than the module's declared [ \\t] class; pre-existing, never in the silent-no-grant direction, owner named in 27-56 | open |  | 2026-08-10T12:53:33.210Z |  |
| 10 | 27 | deviation | scripts/frontmatter.test.ts |  | this repository's vitest intercepts console output, so the file's 'PRINTED, never silent' skips are invisible on a default run | open |  | 2026-08-10T12:53:33.273Z |  |
| 11 | 27 | unrun-verify | scripts/frontmatter.test.ts | 14245 | 27-60 IN-03 brittleness: unasserted indexOf bounds, no identity check, and a negative over unstripped text; carried OPEN by 27-60 and 27-61 so neither edits another plan's evidence | open |  | 2026-08-10T16:41:24.108Z |  |
| 12 | 27 | unrun-verify | .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md |  | 27-59's three families the SHARED D-52 corpus cannot see (R1/R4/R6) — pinned by the whole suite but not by the corpus; reconciled, not closed, by 27-61 | open |  | 2026-08-10T16:41:24.174Z |  |
| 13 | 27 | stub | scripts/frontmatter.ts |  | a blank line inside an open PLAIN (non-block) scalar still folds to a space, inventing a name on a loader-ACCEPTED document; PINNED at its current wrong answer by a named case (27-58) | open |  | 2026-08-10T16:41:24.238Z |  |
| 14 | 27 | unrun-verify | scripts/canonical-frontmatter.ts |  | 27-62: false-red cost of the strict plain-scalar alphabet is measured 0 over the 33 live scanned files but UNMEASURED tree-wide; 27-65 owns that measurement at cutover | fixed |  | 2026-08-10T19:53:28.868Z | 2026-08-10T21:51:46.127Z |
| 15 | 27 | deviation | scripts/canonical-frontmatter.ts |  | 27-65 narrowing: the canonical form admits 2 of 7 legitimate YAML spellings of one declaration (plain scalar, block sequence); wrapped-plain, wrapped-quoted, trailing-# comment, folded >- and literal \|- are now refused inside the spawn-grant scan, as is a quoted `name`. Live cost measured 0 (33/33 admit); the LATITUDE is gone and future hand-written kit content must be canonical. | open |  | 2026-08-10T21:51:32.443Z |  |
| 16 | 27 | deviation | scripts/canonical-frontmatter.ts |  | 27-65: 554 of 575 frontmatter-bearing tracked .md files OUTSIDE the spawn-grant scan would refuse (flow-collection 416, unknown-key 134, block-scalar 4). Not exposure today — those .planning/ artifacts are not in spawnGrantScan and the 10-key schema is deliberately the kit's spawn schema — but a hard constraint on anyone who later widens that scan. | open |  | 2026-08-10T21:51:32.507Z |  |
| 17 | 28 | unrun-verify | .github/workflows/ci.yml |  | check-public-docs-vocabulary is wired into CI and is RED by design (18 AUDIT-02 drift hits) until plan 28-05 lands the rewrites — intended per D-24, must not be read as breakage | open |  | 2026-08-11T14:37:25.571Z |  |
| 18 | 29 | unmet-truth | scripts/check-foundation-guards.ts |  | LANG-08 re-baseline half UNMET by decision (hold-rebaseline): the 17 byte ceilings still encode a 2026-06-10 baseline and describe a pre-rewrite kit; headroom is 1,069 B larger than the rewrite earned. Ratchet-down values preserved in docs/audit/29-ceiling-rebaseline.md | open |  | 2026-08-14T17:27:07.207Z |  |
| 19 | 29 | lint-warning | agent-factory/roles/security-nfr.md |  | guard_role_size prints a live WARN on every green run: 4931B >= 4830B advisory tier (171 B under FAIL). 29-07 refused the remaining bytes as safety-bearing prose | open |  | 2026-08-14T17:27:07.270Z |  |
| 20 | 29 | todo | agent-factory/roles/security-nfr.md |  | ## Reads bullet 3 breaches WP-03 at ~32 words against a 25-word descriptive bound; left by 29-07 under byte pressure and not taken up by 29-13, which changes no prose | open |  | 2026-08-14T17:27:07.333Z |  |
| 21 | 29 | stub | scripts/check-imperative-lexicon.ts |  | guard_sentence_form segments per source LINE, so a wrapped sentence is cut at the line break and a mid-sentence relative pronoun at a line head can false-positive the bare-demonstrative arm (attested at context-note.md:35 in 29-12) | open |  | 2026-08-14T17:27:20.092Z |  |
| 22 | 29 | stub | scripts/check-imperative-lexicon.ts |  | guard_imperative_lexicon's 0-over-139 is an EMPTY DENOMINATOR over three of the corpus's four parts: checklists, seed templates and contracts carry no ## Steps heading, so all 139 bullets are workflows' | open |  | 2026-08-14T17:27:20.160Z |  |
| 23 | 29 | stub | scripts/check-imperative-lexicon.ts |  | readDispositionRows() silently drops a register row containing an escaped pipe: it splits on \| and skips any row whose cell count is not seven, wordlessly (attested in 29-12) | open |  | 2026-08-14T17:27:20.224Z |  |
| 24 | 29 | unrun-verify | scripts/check-nul-bytes.ts |  | No gate detects a non-UTF-8 byte in kit markdown: check-nul-bytes looks only for NUL and markdown readers decode lossily to U+FFFD. A 29-05 perl -pi -e rewrite silently wrote a raw latin-1 0xA7 into seven files | open |  | 2026-08-14T17:27:20.286Z |  |
| 25 | 29 | todo | agent-factory/workflows/18-context-compaction.md |  | WP-09 lowercase workflow display names remain: 'context compaction', 'context read/write', 'task claim + schedule'. Renaming changes a DERIVED set (listWorkflowDisplayNames -> TECHNICAL_NAMES -> two-sided pinned count), not prose, so no style plan owned it | open |  | 2026-08-14T17:27:20.349Z |  |
| 26 | 29 | deviation | .planning/phases/29-controlled-language-voice-guard-rebuild/29-19-PLAN.md |  | Acceptance criterion 'grep -c ^overrides: returns 1' is unsatisfiable: the report's own drafted block inside a yaml fence carries a column-0 overrides: line. Substituted with a frontmatter-region-scoped count (1 key, 1 fenced prose copy). | open |  | 2026-08-15T10:04:44.790Z |  |
| 27 | 29 | deviation | scripts/check-imperative-lexicon.ts |  | Residual 4: a four-space-indented code block donates step bullets; the one fence authority cannot see it. Fail-closed, empty input set today, promote trigger recorded. | open |  | 2026-08-15T16:49:50.314Z |  |
| 28 | 29 | deviation | scripts/check-imperative-lexicon.ts | 541 | The derived locator-site scan reports ONE member (HEADING_LINE), not the zero 29-24's acceptance criterion asserts; 29-25 must state an exemption rather than widen the classifier. | open |  | 2026-08-15T16:49:50.376Z |  |
| 29 | 29 | deviation | scripts/check-banned-claims.ts |  | V-29-32-01: a CLOSED-fence count-preserving compensating edit holds both published pins while swallowing a section into the safety exemption (0 live instances) | open |  | 2026-08-16T00:29:11.216Z |  |
| 30 | 29 | stub | scripts/generate-catalog.ts | 87 | sectionBody bounds a '## ' section by fence-blind new RegExp lookahead — a third section-extent grammar (V-29-29-01, LANG-07) | open |  | 2026-08-16T01:28:22.935Z |  |
| 31 | 29 | stub | scripts/generate-role-adapters.ts | 127 | sectionBody bounds a '## ' section by fence-blind new RegExp lookahead — a third section-extent grammar (V-29-29-01, LANG-07) | open |  | 2026-08-16T01:28:22.998Z |  |
| 32 | 29 | deviation | scripts/generate-catalog.ts |  | D-40-1: an empty-valued order: key reaches Number('')===0 and publishes workflow row 0 rather than refusing; behaviour preserved from the deleted grammar and disclosed, live reachability 0/19 | open |  | 2026-08-17T11:25:31.417Z |  |
| 33 | 29 | deviation | scripts/frontmatter.test.ts |  | D-40-2: the D-50 IN-05 local-grammar classifier reads comments as code; structural answer (codeLinesOfSource) declined in-plan because it is fail-open and wants its own decision | open |  | 2026-08-17T11:25:31.490Z |  |
| 34 | 29 | unrun-verify | scripts/check-banned-claims.ts |  | LANG-04 hard-wrap residual: the co-occurrence window is a LINE, so a claim whose bare term and benefit verb are split across a hard wrap is not matched (measured in 29-41, both directions GREEN); 29-42 owns recording it | open |  | 2026-08-17T11:45:44.240Z |  |
| 35 | 29 | skipped-test | scripts/check-banned-claims.test.ts | 387 | findingCount .toBe(2) now 3 after the bare-term rule; deferred to 29-42 and NOT named by 29-41's gap contract map | open |  | 2026-08-17T11:45:44.304Z |  |
| 36 | 29 | unrun-verify | scripts/check-banned-claims.ts |  | V-29-42-01 fail-OPEN: a claim split across a hard wrap is outside the same-line co-occurrence window; 1983 of 5898 corpus lines end mid-sentence, 0 live instances | open |  | 2026-08-17T12:22:09.740Z |  |
| 37 | 29 | deviation | scripts/check-banned-claims.ts |  | V-29-42-02 fail-closed: a markdown table row puts marker and bare term on one physical line, 0 live | open |  | 2026-08-17T12:22:09.799Z |  |
| 38 | 29 | deviation | agent-factory/writing-profile.md |  | V-29-42-03 fail-closed: the exempt document states the gate proves no pinned literal appears outside the section; live-false at 1 (incident-responder.md:29:103). Not edited - an edit moves BANNED_CLAIM_EXEMPT_EXTENT and needs a D-04 row | open |  | 2026-08-17T12:22:09.858Z |  |
| 39 | 29 | deviation | scripts/check-banned-claims.ts |  | V-29-42-04 fail-closed: a benefit marker whose only occurrence on the line is inside an HTML comment or a link target satisfies co-occurrence, 0 live | open |  | 2026-08-17T12:22:09.918Z |  |
| 40 | 29 | deviation | CHANGELOG.md | 67 | sharper-per-token survives at CHANGELOG.md:67 — outside BANNED_CLAIM_LITERALS and green by the current prohibition, but arguably a token-economy win claim of the family the token-economy group holds. Fail-open, 1 live, escalated by 29-43 rather than absorbed. | open |  | 2026-08-17T16:41:32.934Z |  |
| 41 | 29 | deviation | docs/audit/29-style-dispositions/29-12.md |  | 29-44 R1: 30 disposition rows carry a code-span file cell and can never match rowMatches() in check-diff-disposition.ts (bare-path comparison, no backtick stripping) — fail-closed, 30 live | open |  | 2026-08-17T17:16:02.517Z |  |
| 42 | 29 | unrun-verify | CHANGELOG.md | 67 | 29-44 R2 (carried from 29-43): 'sharper-per-token' is outside BANNED_CLAIM_LITERALS and green by the current prohibition — fail-open, 1 live, unmoved by 29-44 | open |  | 2026-08-17T17:16:02.578Z |  |
| 43 | 29 | deviation | scripts/check-nul-bytes.ts | 120 | The module header claimed git's binary heuristic is NUL-based. Measured false in round 6: git reports w/-text for 0x00/0x0b/0x0d/0x1f/0x7f and w/lf for 0x08/0x1b. Corrected in place and the cross-check arms re-anchored; recorded because a false claim in a safety module's header is what a later reader reasons from. | open |  | 2026-08-17T17:39:12.706Z |  |
| 44 | 29 | unmet-truth | scripts/check-diff-disposition.ts |  | rowMatches() compares row.file against a bare path with NO backtick stripping, so a disposition row whose file cell is a code span can never match. 30 such rows live, all in docs/audit/29-style-dispositions/29-12.md. Fail-closed. Carried from 29-44, unmoved by this plan (out of files_modified). | open |  | 2026-08-17T17:39:12.767Z |  |
| 45 | 29 | unmet-truth | CHANGELOG.md | 67 | Reads 'sharper-per-token' — a token-economy claim outside BANNED_CLAIM_LITERALS, so the gate does not flag it. Fail-open, 1 live, re-confirmed at HEAD by this plan. Carried from 29-43, unmoved. | open |  | 2026-08-17T17:39:12.831Z |  |
| 46 | 29 | unmet-truth | scripts/generate-catalog.ts |  | the workflow sort's 'unique — no tie-break needed' claim is verified (orders 0..18, 19 distinct) but no mechanism reds if two workflows ever declare the same order; fail-open, live count 0 | open |  | 2026-08-17T18:02:44.779Z |  |
| 47 | 29 | deviation | .planning/phases/29-controlled-language-voice-guard-rebuild/29-46-PLAN.md |  | acceptance grep 0*15 is a substring pattern not a cardinality predicate; it over-matched a document identifier and forced an edit the same plan forbids. Fail-closed, live count 0 | open |  | 2026-08-17T18:02:44.839Z |  |
| 48 | 29 | deviation | docs/audit/29-round6-residuals.md |  | V-29-47-01: the in-source record of V-29-42-03 at scripts/check-banned-claims.ts:645-667 is false on five counts (count 0 not live-false; 82-document corpus is 115; cites a rephrased address; cites a header wording that exists only in its own citation; describes conditional members that are 0) and is byte-unchanged across all 16 commits of round 6 | open |  | 2026-08-17T18:35:39.804Z |  |
| 49 | 29 | deviation | docs/audit/29-round6-residuals.md |  | V-29-47-02: the sole exemption carve-out is unbounded at the bottom — endBefore === lines.length, so anything appended to agent-factory/writing-profile.md lands inside it, backstopped only by two pins whose own refusal text instructs the author to move them | open |  | 2026-08-17T18:35:39.873Z |  |
| 50 | 29 | deviation | docs/audit/29-round6-residuals.md |  | V-29-47-03: the exemption region's POSITION is pinned by nothing — a rigid translation (a heading inserted above it) moves the region with both pins unmoved and the gate at exit 0 | open |  | 2026-08-17T18:35:39.936Z |  |
| 51 | 29 | deviation | docs/audit/29-round6-residuals.md |  | V-29-47-04: the surviving enumeration BANNED_CLAIM_LITERALS (22 members, 3 groups) is FAIL-OPEN — five real claims written with none of its members all pass at exit 0, including a conformance claim and a token-economy claim | open |  | 2026-08-17T18:35:40.003Z |  |
| 52 | 29 | deviation | docs/audit/29-round6-residuals.md |  | V-29-47-06: .github/workflows/ci.yml:221 and :321 describe both gates this round widened at their PRE-widening scope (82 documents vs 115; NUL-only vs the whole control-byte class); the file is byte-unchanged all round and is outside every markdown scan by construction | open |  | 2026-08-17T18:35:40.068Z |  |
| 53 | 29 | deviation | .planning/phases/29-controlled-language-voice-guard-rebuild/29-48-SUMMARY.md |  | 29-48 tracer feedback gate run as an automated end-to-end re-verify rather than a checkpoint:human-verify — the tracer's <verify> is entirely automated CLI greps, which checkpoints.md forbids asking a human to run | open |  | 2026-08-17T21:03:21.208Z |  |
| 54 | 29 | deviation | scripts/check-nul-bytes.ts |  | V-29-50-01 the unmeasured-external-assertion CLASS stays OPEN: five prose sites asserting git classifier behaviour were corrected in plan 29-50, but nothing detects an unmeasured claim about an external tool | open |  | 2026-08-17T21:42:53.501Z |  |
| 55 | 29 | unrun-verify | scripts/check-nul-bytes.test.ts |  | V-29-50-02 the EISDIR gitlink arm is exercised through an ordinary directory, not through a real initialised submodule fixture; the errno is identical but the submodule path itself is unwitnessed | open |  | 2026-08-17T21:42:53.564Z |  |
| 56 | 29 | deviation | scripts/check-foundation-guards.test.ts |  | V-29-51-01: the LANG-07 owner classifier's alias closure is module-wide, scope-blind and matches \\bNAME\\b as TEXT against a declaration's right-hand side, so a local named 'a' matches inside [a-z_] in an unrelated regex literal and drags that regex into the derived heading-recogniser set. Measured: the derived name set for audit-model.ts went 26 -> 44 and CLAIM_META_RE became a false applied site. Worked around by renaming the local; the classifier is unfixed. | open |  | 2026-08-17T22:22:11.284Z |  |
| 57 | 29 | unmet-truth | docs/audit/28-claim-registry.md |  | V-29-51-02: the registry's advisory 'line' field disagrees with the anchor's measured position on 19 of 41 anchored rows, by up to 80 lines; three of the four agent-factory/writing-profile.md rows are wrong. Measured through the anchored-block authority, not corrected — the field is documented as advisory and unenforced. | open |  | 2026-08-17T22:22:11.344Z |  |
| 58 | 29 | deviation | scripts/check-banned-claims.ts |  | V-29-53-01: the canonical-form assertion fires on any decoded string whose bytes differ from the raw text, including a legitimately escaped non-ASCII character (0 live refusals today) | open |  | 2026-08-18T08:46:53.835Z |  |
| 59 | 29 | deviation | scripts/check-banned-claims.ts |  | V-29-53-02: the gate's effective walk bound is 2x MAX_WALK_ENTRIES because the imported public-docs corpus derivation carries its own budget at import time | open |  | 2026-08-18T08:46:53.898Z |  |
| 60 | 29 | deviation | .claude/settings.local.json |  | V-29-53-03: untracked, so the widened coverage denominator does not reach it; carries asd-ste100.org inside a WebFetch permission | open |  | 2026-08-18T08:46:53.959Z |  |
| 61 | 29 | deviation | scripts/catalog-freshness.ts |  | 29-54 Rule 3: importing kit-model.js into the catalog generator rotted catalog-freshness.ts's hand-listed mirror import closure; the entry was added and proven load-bearing (removal -> ERR_MODULE_NOT_FOUND, exit 1). The list remains hand-maintained by a recorded trade. | open |  | 2026-08-18T09:08:11.774Z |  |
| 62 | 29 | deviation | .planning/phases/29-controlled-language-voice-guard-rebuild |  | 29-55: five plans' published actuals.commits are SHORT (29-48 2 vs 3, 29-50 3 vs 4, 29-51 3 vs 4, 29-52 4 vs 5, 29-53 3 vs 5) and 29-54's self-check prose says 5 against its own frontmatter's 7. Cause is structural: a count of commits written INTO a SUMMARY that is then committed can never include the commits that carry it. Measured, not corrected. | open |  | 2026-08-18T09:46:49.565Z |  |
| 63 | 29 | deviation | docs/audit/29-round7-residuals.md |  | 29-55: nine V- markers (V-29-29-02..05, V-29-30-01..04, plus the never-opened V-29-42-05) exist in the tree and have NEVER been rolled up by any of three residual registers. Found by DERIVING the marker set by grep (35 found) instead of taking round 6's table (18 listed). Named, deliberately not adopted. | open |  | 2026-08-18T09:46:49.626Z |  |
| 64 | 29 | unrun-verify | scripts/check-nul-bytes.ts |  | 29-55: check-nul-bytes is INDETERMINATE on a git archive mirror — its set is git ls-files, so it refuses identically on the clean control and on a tampered mirror. It must not be counted in a per-mirror sibling-gate tally; round 6's sweep did not make this distinction. | open |  | 2026-08-18T09:46:49.688Z |  |
| 65 | 29 | deviation | .planning/phases/29-controlled-language-voice-guard-rebuild/29-53-SUMMARY.md |  | 29-55: 29-53's narrative class enumeration is one short in two cells (tracked *.json 37 vs 38; scripts/** 18 vs 19), measured at its own commit and at HEAD. The MECHANICAL equality is derived, floored two-sided and green — only the hand-written explanation is short. | open |  | 2026-08-18T09:46:49.753Z |  |
| 66 | 29 | deviation | scripts/check-banned-claims.ts | 2120 | Plan 29-56 Rule 3: the in-source D-55 note named BANNED_CLAIM_SCAN_COUNT, moving the pin's grep -c from 6 to 7; reworded to identify the constant by role | open |  | 2026-08-18T15:35:03.799Z |  |
| 67 | 29 | deviation | scripts/check-banned-claims.test.ts | 4160 | Plan 29-56 Rule 1: the SOURCE-SHAPE docblock assertion was defeated by a hard wrap; one declared comment-block normalization added, published-header assertion left byte-exact | open |  | 2026-08-18T15:35:03.866Z |  |
| 68 | 29 | unrun-verify | scripts/check-banned-claims.ts | 89 | V-29-57-01 — hard-wrap axis: a pinned multi-word literal split across a line boundary is not matched (FAIL-OPEN, 11 of 22 members reachable, 0 live). Remedy declined this round by D-56; disclosed in docs/audit/29-round8-residuals.md §4 | open |  | 2026-08-18T15:54:37.843Z |  |
| 69 | 29 | unrun-verify | agent-factory/writing-profile.md | 264 | V-29-58-01 — enumeration axis: a conformance claim written without any of the 22 pinned literals is not matched (FAIL-OPEN; live count UNKNOWN - verify BY CONSTRUCTION, not 0). No mechanical remedy exists; compensating control is the per-round hand disposition of all 13 derived claim sites. Id opened by plan 29-58 in docs/audit/29-round8-residuals.md §2.4 after deriving that no register had ever assigned one | open |  | 2026-08-18T16:22:40.100Z |  |
| 70 | 29.1 | deviation | scripts/model-tiers.ts |  | ROLE_COUNT cardinality check relocated out of resolveModels into roleCorpusCardinalityRefusal — deviates from plan 29.1-01 Task 2's written behavior block; needs reviewer sign-off (SUMMARY coverage item D5) | open |  | 2026-08-19T08:15:05.155Z |  |
| 71 | 29.1 | deviation | scripts/generate-role-adapters.ts |  | Plan 29.1-03 acceptance criterion predicts a filesystem RED when the resolution moves into render(); measured GREEN (adapters.map materializes before the write loop). Equivalent proof taken in the WRITE loop instead — reviewer to confirm the substitution discharges the criterion (coverage item D17) | open |  | 2026-08-19T09:43:42.160Z |  |
| 72 | 29.1 | deviation | scripts/model-dial-consistency.test.ts |  | 29.1-10: the oracle pins ONE authority sentence but does not forbid a SECOND, contradicting sentence added elsewhere in the same document; compensating control is the negative grep recorded in 29.1-10-SUMMARY.md | open |  | 2026-08-20T09:01:51.475Z |  |
| 73 | 29.1 | deviation | agent-factory/packaging/subagent.frontmatter.md |  | Plan 29.1-11 must-have 'both shipped documents name both configuration locations' is NOT met as written: check-kit-refs Assertion 1 (D-08.1) forbids agent-factory/config/ refs in kit prose, so the packaging authority names the user-facing location plus the location COUNT and points at the config reference for the rule | open |  | 2026-08-20T09:31:47.536Z |  |
| 74 | 29.1 | deviation | .planning/phases/29.1-per-role-model-assignment/29.1-14-SUMMARY.md |  | Plan 29.1-14 acceptance criterion 4 narrowed to what was measured: on the appended-step mutation the OLD pin reds on its byte-offset ordering half (membership half stayed green). Composite mutation 3b constructed where the old pin is green on all four assertions. | open |  | 2026-08-20T14:46:20.977Z |  |
| 75 | 29.1 | deviation | scripts/model-tiers.ts |  | 29.1-15 deviation 3: the deleted symbol roleCorpusCardinalityRefusal is deliberately NOT named in the docstring that records its deletion, to satisfy the plan's zero-grep criterion. Residual: a reader who meets the symbol on an older host's committed twin and greps this tree finds nothing in source; the name is in git history and the 29.1-15 SUMMARY. | open |  | 2026-08-20T15:12:08.712Z |  |
| 76 | 29.1 | deviation | scripts/model-dial-consistency.test.ts |  | 29.1-16 acceptance criterion NOT satisfied as written: the plan's basename-only paraphrase cannot red the derived case, because the second candidate's basename is a substring of the first candidate. Partitioned by discrimination instead; measurement recorded in 29.1-16-SUMMARY.md Deviation 1. | open |  | 2026-08-20T15:30:14.125Z |  |
| 77 | 29.1 | deviation | scripts/check-kit-refs.test.ts |  | 29.1-17 acceptance criterion NOT satisfied as written: grep -c 'const SCAN' scripts/check-kit-refs.test.ts measures 1, not 0. The surviving hit is the extractor's locator string, which must spell the gate's declaration verbatim to find it; splitting the literal to make the grep return zero was rejected. Anchored substitutes recorded: grep -cE '^const SCAN = ' -> 0 and grep -c '"agent-factory/checklists"' -> 0. See 29.1-17-SUMMARY.md Deviation 1. | open |  | 2026-08-20T15:54:27.892Z |  |
| 78 | 29.1 | deviation | .planning/REQUIREMENTS.md |  | 29.1-17: the requirements verb flipped MODEL-05 from Gaps Found to Complete via the shared-ID gate; the flip was REVERTED because MODEL-05 is the requirement round-2 verification regressed and no verification has run since. The row awaits round-3 verification. See 29.1-17-SUMMARY.md Deviation 5. | fixed | 29.1-21: stated condition MET and MEASURED, not assumed. The condition was that a verification round run on MODEL-05. Round 3 ran, and its requirement_determinations block reads: MODEL-05: "Gaps Found -> COMPLETE. The regression round 2 recorded (R2-CR-01) is closed, and the fix DISCRIMINATES ... Every clause of MODEL-05 own text was additionally re-proven behaviourally (four planted mutations, all RED by name)." The flip is COMMITTED at d821e19, and both lines were read from `git show HEAD:.planning/REQUIREMENTS.md` BEFORE this row was closed: line 94 reads "- [x] **MODEL-05**: An unknown, malformed, or absent model value is **fail-closed to `inherit`** - never to a pinned tier - and a guard asserts the emitted model of all 17 adapters equals the resolved config, derived rather than compared against a hand-listed expectation." and traceability line 194 reads "\| MODEL-05 \| Phase 29.1 \| Complete \|". | 2026-08-20T15:54:27.962Z | 2026-08-20T20:47:15.691Z |
| 79 | 29.1 | deviation | scripts/check-public-docs-vocabulary.ts | 32 | 29.1-17: a fourth record adjacent to the scan widening reads 'that set is byte-unchanged' about check-kit-refs's SCAN. In context it is scoped to that gate's own Phase-27 change and remains true; out of context it could be read as a standing claim, and SCAN is now one member wider. Deliberately NOT edited (outside this plan's declared files). See 29.1-17-SUMMARY.md Deviation 4. | fixed | 29.1-21: stated condition MET. The condition was a RULING on whether the clause at scripts/check-public-docs-vocabulary.ts:32 is a standing claim needing correction. The ruling, from the user orchestrator and recorded verbatim in 29.1-21-PLAN.md: "The ruling is in: it is in scope and it is fixed here." The clause is now scoped to what this gate own Phase-27 change did, with the ruling and its source named in the note itself; the superseded wording is DESCRIBED rather than reproduced, so `grep -c` for it over that file returns 0, and `node scripts/check-public-docs-vocabulary.js` exits 0. The D-08 contract half of the sentence was left alone because it is still true: the widening added a shipped-kit directory, not a repo-wide grep. | 2026-08-20T15:54:28.031Z | 2026-08-20T20:48:00.429Z |
| 80 | 29.1 | deviation | scripts/check-foundation-guards.test.ts |  | 29.1-19 residual, AMENDED BY PLAN 29.1-24 BECAUSE THE ROW ITSELF WAS MEASURED WRONG. WHAT THE ROW SAID: (r-class-prefix) compares CANONICAL SOURCE SPELLINGS across a derived member set rather than running the members' readers, so a member spelling both the right-bound marker and the slice base canonically while computing something else satisfies every assertion in it; direction FAIL-OPEN; and — THE CLAUSE THAT WAS MEASURED FALSE — bounded for today's two members by their own synthetic-input bound proofs, (r-bound-synthetic) and Case 8b. THAT MITIGATION DID NOT EXIST. Round 4 falsified it directly: (r-bound-synthetic)'s negative control builds its own inline slice from the SAME base as the reader, and its effect assertion .not.toContain(APPENDED_STEP_NAME) is still satisfied by a base-shifted read, so neither bound proof can see a base shift. THE ROW ALSO UNDERSTATED THE HOLE by framing it as a HYPOTHETICAL future member. For the two members that existed, requirement 1 was unconditionally satisfied for BOTH by their own const STEP_MARKER declarations and requirement 2 unconditionally satisfied for check-foundation-guards.test.ts by its own const UBUNTU_BLOCK_SLICE_BASE_SOURCE declaration — the constant that STATED the requirement was the text the requirement searched for. Measured: the exact R3-IN-03 divergence applied on a hermetic mirror returned 4 failed / 260 passed of 264, byte-for-byte the unmutated mirror's failure set. The false clause is REPLACED here rather than softened, because a ledger row naming a mitigation that does not exist is more dangerous than no row at all. | fixed | 29.1-24: CLOSED STRUCTURALLY, and the replacement mitigation is named because it exists. There is now ONE implementation of where the ubuntu gate block is and what it runs — scripts/ci-workflow.testkit.ts — and both readers import it, so 'this class reads one region' is true by construction rather than certified by a text scan. (r-class-prefix) is DELETED, not repaired: round 4's suggested cheap repair (strip const declaration lines before the containment tests) was measured against this tree and REDS A CORRECT TREE, because after stripping, the right-bound marker's canonical spelling occurs ZERO times in BOTH members. It is replaced by (r-class-authority), which derives membership from the IMPORT, pins it two-sided at 2, closes the class with a negative over all 49 non-member scripts/*.test.ts files, and asserts by a derived scan over 147 files that no non-test file consumes the authority. The BASE is now proven by BEHAVIOUR in (r-base-discriminating), which computes the authority's region beside an inline control region built from the bare locator index with the same right bound. Measured on a hermetic mirror at 98a1882: the same divergence that produced a byte-identical failure set in round 4 now moves it from 4 failed / 275 passed of 279 to 5 failed / 274 passed of 279, with (r-base-discriminating) named. Four of its arms red independently. RESIDUAL THAT ACTUALLY REMAINS, stated with its direction: a member that imports the authority and then computes something else entirely — a second private slice under another variable, in a branch nothing reaches — still satisfies the import-derived membership. That direction is FAIL-OPEN and strictly NARROWER than what this row originally disclosed, because there is no longer a second implementation for such a slice to be built from, but it is not zero. | 2026-08-20T19:55:57.940Z | 2026-08-21T18:30:00.000Z |
| 81 | 29.1 | deviation | scripts/check-foundation-guards.test.ts |  | 29.1-19: (o-one-consumer)'s assembled-pattern arm recognises ONE SPELLING of the regex-escape idiom — the bytes this tree writes verbatim in audit-prepass.ts, check-foundation-guards.ts and voice-model.ts — and asks it of a single comment-stripped LINE. A differently spelled escape, or an assembly split across lines, is still not counted and therefore not disclosed by the residual set the case publishes. Direction: FAIL-OPEN. | open |  | 2026-08-20T20:00:49.350Z |  |
| 82 | 29.1 | deviation | scripts/model-dial-consistency.test.ts |  | 29.1-19: the third tautology site was closed OUTSIDE the plan's declared files_modified list. The plan's must_haves require three deleted tautologies and three discriminating bound proofs, and only two sites existed in the two declared test files; R3-WR-01 names this file as the third. Recorded so the scope expansion is visible rather than inferred from the diff. | open |  | 2026-08-20T20:03:39.929Z |  |
| 83 | 29.1 | deviation | scripts/model-dial-consistency.test.ts |  | 29.1-20: sectionCitationsIn recognises ONE citation grammar — an inline code span whose content opens with the third-level heading marker. A cross-document section citation written as bare prose without inline code delimiters, or one naming a heading at any level other than third, is not derived, so it is neither pinned by the membership assertion nor counted by the two-sided cardinality pin. Direction: FAIL-OPEN — such a citation ships unpinned and its target may be renamed silently. | open |  | 2026-08-20T20:24:49.779Z |  |
| 84 | 29.1 | deviation | scripts/model-dial-consistency.test.ts |  | 29.1-20: the synthetic bound case's INPUT is derived from the reader under test — the truncation calls modelBulletRegion() so that the appended bullet is the only candidate right bound. A mutation to the reader therefore changes the input as well as the subject. Measured: dropping the reader's bullet arm reds this case on its own input PREMISE (expected 6 to be 1) rather than on the bound-effect assertion; the bound-effect assertion itself is measured red only by the wholesale bound deletion. Direction: FAIL-CLOSED — the case refuses to measure on an input it cannot vouch for rather than measuring wrongly — but the premise, not the effect, is what catches an arm-level mutation. | open |  | 2026-08-20T20:24:49.851Z |  |
| 85 | 29.1 | deviation | scripts/model-dial-consistency.test.ts |  | 29.1-20: this plan's Task 2 declared the deletion of two containment assertions that plan 29.1-19 had ALREADY deleted as its Rule-2 scope addition (ledger row 82). The plan's prescribed pre-fix reproduction — delete the right bound and observe MEASURED GREEN — is therefore not reproducible on this tree: measured this session it REDS, 1 failed / 36 passed of 37. Recorded so a later reader does not read the absent green as an unrun step. | open |  | 2026-08-20T20:24:49.921Z |  |
| 86 | 29.1 | deviation | scripts/model-tiers.ts |  | 29.1-21: the unknown-stem override REFUSAL reverses a documented design decision — the module argued the skip was correct for a caller resolving a mirror narrower than the corpus its overrides were read for. Measured that no such caller exists (both production sites hand readModelsConfig and resolveModels the SAME stems; the whole suite and all three live gates are green with the refusal), but the reversal is a contract change, not a bug fix. Direction: FAIL-CLOSED — a future caller that legitimately reads a wider corpus than it resolves is now refused by name rather than silently mis-resolved, which is loud and recoverable, but it IS refused. | open |  | 2026-08-20T20:44:28.465Z |  |
| 87 | 29.1 | deviation | scripts/model-tiers.ts |  | 29.1-21: the three cases pinning the corrected anchored-reader docstring do NOT share one reddening mutation. Removing the line trim reds only the TAIL half (plus two pre-existing CR cases); the HEAD-preserve and ANCHOR cases stay green under it by construction, because they assert what the trim does NOT do. The second half of the claim is therefore pinned by the reader's behaviour rather than by a mutation of the mechanism it describes. Direction: FAIL-OPEN — a change that started trimming the value's HEAD (a widening to trim()) would red the head case, but no single mutation exercises all three, so the three are not one proof. | open |  | 2026-08-20T20:44:40.110Z |  |
| 88 | 29.1 | unrun-verify | scripts/model-tiers.test.ts |  | 29.1-21: the shape corpus proving quoteValue total derives its denominator from typeof's eight-result codomain, which is a cover of PRIMITIVE shapes only. The two object sub-shapes that actually throw (a circular graph, a getter that throws mid-serialisation) are hand-added beyond that cover and are NOT counted by any derived denominator — typeof cannot distinguish them from a plain object. Direction: FAIL-OPEN — a third throwing object sub-shape nobody thought of is invisible to the cardinality assertion, which can only prove the corpus covers every typeof, never that it covers every way JSON.stringify can throw. AMENDED BY PLAN 29.1-23, restated against the corpus as WIDENED rather than the narrow one this row described. The corpus grew from 12 shapes to 13 and is now driven over the KEY position, the VALUE position and their 169-cell cross product, so the residual above is still true and is now true of a corpus driven over three axes instead of one. The thirteenth entry is an object whose string conversion throws, and it was added because the two axes fail under DIFFERENT operators: JSON.stringify throws on a throwing getter and returns cleanly on a throwing toString, while template-literal conversion does the exact opposite. Driven at the KEY position against the pre-fix build the 12-shape corpus therefore caught ONE of the two regressions the round-4 verifier reproduced and reported the other as safe. That is this row own fail-open shape found one level up: a derived denominator can cover every typeof result, but no denominator here covers every way a RENDERING OPERATOR can fail, and there are now two such operators in scope. Both denominators are pinned two-sided as of this plan and both pins were proven to discriminate against a co-edit the set-equality assertion passes over. | open |  | 2026-08-20T20:44:40.187Z |  |
| 89 | 29.1 | unrun-verify | scripts/check-kit-refs.ts | 323 | WR-01 (round 4): the packaging-template literal entered ghLegal raw and walk()'s FILE branch pushed its scan entry raw, while both were compared against join()-spelled walk output. Closed in plan 29.1-22 by relKey(), the one path-spelling authority, applied at both sites. The PLATFORM half is corroborated, NOT executed: measured under path.win32 (raw literal agent-factory/packaging/subagent.frontmatter.md vs walk-shaped agent-factory\\packaging\\subagent.frontmatter.md) and pinned by a two-directional path.win32 unit case. No windows-latest CI leg exists in this repository yet (CAP-02, Phase 33), so nothing here has run on Windows. | open |  | 2026-08-21T14:08:27.374Z |  |
| 90 | 29.1 | deviation | scripts/check-kit-refs.ts | 239 | 29.1-22 terminator residual: CONFIG_REF_TERMINATOR declares where a named path ENDS, and the sentence-ending period is NOT a terminator. A legitimate future self-reference written WITHOUT surrounding delimiters and ending a sentence captures the trailing byte, yields the record factory.config.json. rather than factory.config.json, and is judged a stray. Direction: FAIL-CLOSED — such a mention is refused loudly and must be argued and counted, which the exemption's pinned cardinality already requires of any new mention. Every mention shipped today is backtick-delimited, so nothing on this tree is affected. | open |  | 2026-08-21T14:13:13.493Z |  |
| 91 | 29.1 | deviation | scripts/frontmatter.ts |  | PRE-EXISTING, found by plan 29.1-22, NOT caused by it and NOT fixed by it (outside this plan's declared scope). The double-quoted-scalar escape scanner produces a FALSE REFUSAL that is ORDER-DEPENDENT: within one double-quoted scalar, an escaped double quote occurring BEFORE an escaped backslash makes the later, valid escaped-backslash pair refuse by name, though both sequences are on the module's own allowlist and libyaml accepts the document. Reordering the same two sequences passes. Reproduced at pristine HEAD b08b25c in a clean worktree with a 20-byte synthetic item; the exact byte sequences are quoted in 29.1-22-SUMMARY.md, which renders them in a code fence rather than in a ledger cell. Live effect: scripts/frontmatter.test.ts 'D-49 false-red control' FAILS on this tree (1 failed, 2382 passed, 2 skipped, over 55 files), because .planning/phases/29.1-per-role-model-assignment/29.1-VERIFICATION-round4.md line 51 carries such a scalar in its gaps block. Direction: FAIL-CLOSED (a false red, never a bypass). Owner: unassigned, needs a plan of its own; the round-4 report was deliberately NOT rewritten, since annotating rather than rewriting a verifier's record is this repository's rule. | open |  | 2026-08-21T14:13:13.562Z |  |
| 92 | 29.1 | deviation | scripts/model-tiers.ts |  | 29.1-23 KEY-rendering residual: a Map key that is not representable reaches the ONE quoting authority and is rendered the way that authority has always rendered a non-representable VALUE, because there is one authority and its handling of the three shapes JSON.stringify drops without throwing is deliberate and predates this plan. Measured at 9ae707e: a Symbol key renders as a bare undefined, a function key as a bare undefined, an object whose toString throws and a plain object both render as an empty brace pair. So a refusal for a non-representable key names the stem POSITION and the covered set but does not identify the key, and two such keys can produce the same sentence. Direction: FAIL-CLOSED and strictly better than the alternative it replaced, which was a THROW out of the refusal path. Mitigating fact, asserted rather than claimed by the case a Symbol key is REFUSED and NAMED rather than crashing the sentence that rejects it: a legitimate STRING key spelled undefined renders WITH its quotation marks, so a rendered value and a dropped one are distinguishable in the message a caller reads. Whether the bare rendering is the best one for a reader is a wording judgement, not a predicate; it is pinned by that case so it cannot drift silently, and it is disclosed here rather than argued away. | open |  | 2026-08-21T14:39:05.652Z |  |
| 93 | 29.1 | deviation | scripts/model-tiers.ts |  | 29.1-23 correction to this plan's own stated truth, recorded because the measurement contradicts it. The plan asserted that only the shapes which previously THREW change behaviour. Measured over the 13-shape corpus driven at the KEY position against the committed .js at a58036b and at 9ae707e: only 2 of 13 shapes threw; the other 11 RETURNED a refusal whose key rendering has CHANGED, because the key used to be rendered by template-literal conversion inside hand-written quotation marks and is now rendered by the serialiser. Every LEGAL key is unaffected and that half is proven, 127 refusal renderings diffed pre and post with an empty diff. The changed renderings are all ILLEGAL keys, all refused in both builds: a number key NaN moved from quote NaN quote to null, a BigInt key 1n from quote 1 quote to an angle-bracket description, an array key from quote opus quote to a bracketed JSON array, a plain object from quote object Object quote to its serialised form, a function key from its source text to a bare undefined. Direction: FAIL-CLOSED in every row, and the discrimination IMPROVED for the common shapes, since a number key 5 and the string key quote 5 quote used to render identically and no longer do. The two rows that read WORSE are the function key and the NaN key. No caller can reach any of these through readModelsConfig, which refuses a non-string role key before the resolver is called. | open |  | 2026-08-21T14:39:18.078Z |  |
| 94 | 29.1 | deviation | scripts/model-tiers.test.ts |  | 29.1-23 one-spelling scan residual (WR-04 closed with its bound stated rather than left implicit). The scan now reads scripts/model-tiers.ts AND the committed scripts/model-tiers.js, derives a count for each and names the file in every failure message; proven to discriminate on the compiled side by planting a second spelling in the committed .js only, with the source untouched - the widened case reds naming model-tiers.js, and the NARROW case at 5ec040d passes the identical plant. The residual is the comment strip: it drops ONLY a line whose first non-space byte opens a comment, so a trailing comment on a code line and a block comment sharing a line with code are both scanned AS code. Direction: FAIL-CLOSED and one-directional - the count can be too HIGH and never too low, because the only text removed is text on a line that is entirely a comment, and a comment does not execute. A documented second spelling written in a trailing comment would therefore produce a FALSE RED. That bound is now stated in the assertion message itself rather than known only to the author. | open |  | 2026-08-21T14:48:01.557Z |  |
| 95 | 29.1 | unmet-truth | scripts/model-tiers.ts |  | 29.1-23: resolveModels STILL THROWS on four input classes, so this module's totality claim - and plan 29.1-23's own first stated truth - is FALSE. Found by adversarial self-verification at plan close, not by any review. Measured across four committed builds from one script: a revoked Proxy at the VALUE position THREW at e9907f5, ad033f0, a58036b and HEAD; a revoked Proxy at the KEY position returned ok true at e9907f5 under the silent skip and has THROWN since ad033f0, HEAD included; a Map subclass whose iterator yields a non-array entry and a Map subclass whose iterator throws both THREW at all four builds. Two root causes. ONE: quoteValue is not total although its docstring says IT IS TOTAL - the describeShape call sits inside the catch block, outside the try, and Array.isArray is not total, throwing TypeError Cannot perform IsArray on a proxy that has been revoked. TWO: the override loop destructures each entry before any floor runs, and Floor 0b establishes instanceof Map and nothing more, so a Map SUBCLASS overriding Symbol.iterator escapes before a refusal exists to be returned. Direction: FAIL-CLOSED in every row - a throw is loud and no tier is silently applied - but it is the exact class this phase exists to close, because the module header promises a returned result so a degrading consumer need not write a catch. NOT FIXED HERE, deliberately: only root cause one is a small edit, root cause two needs defensive iteration, and closing one of two would leave the totality looking closed while remaining false, which is the one-more-spelling incrementalism this project's memory names as its repeated failure. The established remedy for an open-set totality here is D-59, hold it as CONTENT with a disclosed backstop. What IS achieved and measured: all 13 corpus shapes return at the KEY position, all 169 KEY-by-VALUE cells return, and both shapes the round-4 verifier reproduced return. Owner: unassigned, needs a plan of its own; also recorded in the phase deferred-items file. | open |  | 2026-08-21T14:50:11.219Z |  |
| 96 | 29.1 | deviation | scripts/check-foundation-guards.test.ts |  | 29.1-24: THE NOT-SHARING-A-HELPER DISPOSITION IS REVERSED, in scripts/check-foundation-guards.test.ts AND scripts/skill-twins-freshness.test.ts. Both files carried a paragraph arguing that the ubuntu-block region reader was deliberately NOT shared, because sharing would mean either copying it (two authorities over one predicate) or promoting it into a production module that only tests consume (a shipped surface added for a test), and that the class was closed instead by a scan over canonical source spellings. TWO MEASUREMENTS FORCED THE REVERSAL. ONE: that scan was structurally incapable of failing for either member — the exact R3-IN-03 divergence applied on a hermetic mirror returned a failure set byte-for-byte identical to the unmutated baseline, because the constants that STATE its canonical spellings are declared in the very files it searches. TWO: round 4's suggested cheap repair, stripping const declaration lines before the containment tests, was measured against this tree and REDS A CORRECT TREE — after stripping, the right-bound marker canonical spelling occurs ZERO times in BOTH members. The original argument first horn was what the tree already had. Its second horn is answered by scripts/ci-workflow.testkit.ts, a module NO production script imports, asserted by a derived scan over 147 files in (r-class-authority) rather than claimed in prose. Both paragraphs are corrected in place and the superseded reasoning is DESCRIBED rather than deleted, per this repository annotate-do-not-rewrite rule. Direction: this row records a reversal, not a hole. | open |  | 2026-08-21T15:30:49.404Z |  |
| 97 | 29.1 | deviation | scripts/ci-workflow.testkit.js |  | 29.1-24: THE BUILD-PARITY QUESTION FOR THE NEW COMMITTED TWIN, ANSWERED RATHER THAN LEFT FOR A LATER READER. The new module is a non-test scripts/*.ts, so tsconfig.json emits it and the committed .js is a tracked build output like any other. Nothing about the freshness or build-parity surface needed changing: npm run freshness exits 0 on the final tree and its compared set moved 49 to 50 paths, the one new path being scripts/ci-workflow.testkit.js. WHAT A LATER READER WOULD NOT EXPECT, MEASURED AND DISCLOSED: vitest resolves the ./ci-workflow.testkit.js import specifier to the COMMITTED .js, not to the .ts. Probed on a hermetic mirror — mutating the .js alone REDS (r-base-discriminating); mutating the .ts alone leaves it GREEN. So the authority these tests execute is the shipped build output, and a divergence introduced in the .ts alone is invisible to every case in this class. That is NOT unbounded: it is caught by npm run freshness, measured this session to exit 1 with STALE WORKING OUTPUT naming scripts/ci-workflow.testkit.js on exactly that mutation. Direction: FAIL-CLOSED, with the mitigation named because it was run rather than assumed — the specific failure mode row 80 existed to record. Adding the module also moved two derived corpus pins in the same commit: NON_TEST_MODULE_COUNT 50 to 51 and the scripts-scoped reader corpus 42 to 43, each re-derived independently rather than incremented. | open |  | 2026-08-21T15:30:49.473Z |  |
| 98 | 29.1 | deviation | .planning/phases/29.1-per-role-model-assignment/29.1-24-PLAN.md |  | 29.1-24 plan deviations, recorded so the diff does not have to be read to find them. ONE: the plan splits the cutover (task 1) from the class-case replacement (task 2), but (r-class-prefix) derives its member set by scanning for the step-name PREFIX and the cutover removes that phrase from both members, so its vacuity floor fires the instant the second grammar is deleted (measured: expected 0 to be greater than 0, 50 .test.ts files scanned, none carrying the prefix). The case cannot survive the cutover in any form, and task 1 verify requires a green file, so (r-class-authority) landed in task 1 commit 56653ca rather than task 2. Only the commit boundary moved; every acceptance criterion of both tasks is satisfied. TWO: the case comment as written from the plan wording claimed assertions 3, 4 and 5 are the same fact measured three ways. Per-arm measurement under the base shift found arm 3 GREEN — it asserts a property of the CONTROL, which the mutation does not touch — so the comment was corrected to name four discriminating arms and to state arm 3 as a premise. Left uncorrected that would have been the wider-than-mechanism claim class this phase exists to close, inside the case written to close it. Direction: both are closed self-corrections, not open holes. | open |  | 2026-08-21T15:40:24.243Z |  |
| 99 | 29.1 | deviation | .planning/phases/29.1-per-role-model-assignment/29.1-CONTEXT.md |  | 29.1-25: WR-03 was ruled record-decision-only (Olger Oeselg, 2026-08-21), so the reversal of D-06's unknown-key disposition is recorded as decision D-29.1-18 and NO CHANGELOG entry ships. The CHANGELOG half is OWED ON FIRST REACHABLE CHANGE, not closed: today the refusal branch is unreachable from production, so a consumer who reads only CHANGELOG.md does not meet this contract change. Direction: FAIL-OPEN for changelog consumers — nothing mechanical will remind anyone to add the entry when the branch first becomes reachable, because no gate reads reachability. Owner: whoever makes that branch reachable. | open |  | 2026-08-21T19:10:12.591Z |  |
| 100 | 29.1 | unrun-verify | .planning/WINDOWS.md |  | 29.1-25: the four prose gates this plan ran (check-public-docs, check-banned-claims, check-claim-anchors, check-audit-register) plus check-kit-refs do NOT reach either surface this plan wrote. Measured, not assumed: BANNED_CLAIM_EXCLUDED_LOCATIONS in scripts/check-banned-claims.ts carries the segment class '**/.planning/' enforced at the walk, and check-kit-refs.ts states .planning/ intentionally absent from its scan. Direction: FAIL-OPEN — a banned claim, a cost sentence or caveman voice written into any .planning/ surface passes every gate in this repository green. Compensating measurement taken this plan: the gate's own 22 pinned literals were extracted and run directly over this plan's added text, 0 hits. That is a one-off reading, not a gate. | open |  | 2026-08-21T19:10:12.664Z |  |
| 101 | 29.1 | deviation | scripts/model-tiers.ts |  | 29.1-25 reconciliation: round-4 review IN-01 is UNDISPOSITIONED — no plan in this round claimed it and no ledger row carried it until now. describeShape(null) renders the null-overrides refusal as 'an object rather than a Map', which is the worst possible rendering of the exact case Floor 0b exists to reject. Found by the derived reconciliation, not by a plan. Owner: unassigned. | open |  | 2026-08-21T19:12:07.311Z |  |
| 102 | 29.1 | deviation | scripts/check-kit-refs.ts |  | 29.1-25 reconciliation: round-4 review IN-02 is UNDISPOSITIONED — join(CONFIG_SELF_REF_DIR) + sep is computed in two places (round-4 review cites :259 and :342), a second spelling for the first to drift from. Note plan 29.1-22 rewrote this module for CR-02/CR-03, so the cited line numbers may have moved and the finding needs re-locating before it is fixed. Owner: unassigned. | open |  | 2026-08-21T19:12:07.380Z |  |
| 103 | 29.1 | deviation | scripts/check-kit-refs.ts |  | 29.1-25 reconciliation: round-4 review IN-03 is UNDISPOSITIONED — walk() follows symlinks with no cycle guard and admits them to the exemption's sibling set. Direction: a symlink can join the set the D-08.1 exemption is counted over. Distinct from round-3's R3-IN-03, which WAS closed by plan 29.1-24; the id collision across rounds is why this one was easy to miss. Owner: unassigned. | open |  | 2026-08-21T19:12:07.447Z |  |
| 104 | 29.1 | deviation | scripts/model-dial-consistency.test.ts |  | 29.1-25 reconciliation: round-4 review IN-04 is UNDISPOSITIONED — sectionCitationsIn throws on a lone backtick-### sequence anywhere in the authority, an unbounded scope on an otherwise right default. Distinct from ledger row 83, which records the ONE-citation-grammar narrowness of the same function from plan 29.1-20. Owner: unassigned. | open |  | 2026-08-21T19:12:07.516Z |  |
| 105 | 29.1 | deviation | scripts/check-kit-refs.ts |  | ACCEPTED BY USER 2026-09-03 (D-29.1-19), not closed. Round-5 verifier Blocker 1: configReferencesIn truncates each record at the first CONFIG_REF_TERMINATOR byte and then decides membership over the TRUNCATED PREFIX, so a shorter string that IS a member admits a path out of the kit. Reproduced 9 for 9 across the entire declared terminator class at TRUE exit 0 with /../../../../etc/passwd shipping and all three published cardinalities as declared. The comment at :230-233 asserting this cannot happen is FALSIFIED by measurement. Compounds with row 103 (symlinks join the exemption sibling set), which defeats the code review's suggested remedy. Direction: FAIL-OPEN. Owner: unassigned — carried past phase close by user acceptance. | open |  | 2026-09-03T16:12:49.409Z |  |
| 106 | 29.1 | deviation | scripts/check-foundation-guards.test.ts |  | ACCEPTED BY USER 2026-09-03 (D-29.1-19), not closed. Round-5 verifier Blocker 2: the (r-class-authority) class claim is decided over a NON-RECURSIVE readdirSync of scripts/, so its denominator is 50 of the 56 tracked *.test.ts files. Invisible: hooks/ (2), install/ (1), scripts/e2e/ (1), scripts/runnable-ref/ (2). A genuine second reader with its own step-name literal and the bare-locator base, planted into scripts/runnable-ref/reference-check.test.ts, returns the byte-identical baseline 4 failed/261 passed; the identical plant at top level reds by name. This is round-3 R3-IN-03 re-opened one directory out by its own replacement. Direction: FAIL-OPEN. Remedy shape: derive the denominator from git ls-files, assert the count. Owner: unassigned — carried past phase close by user acceptance. | open |  | 2026-09-03T16:13:02.191Z |  |
| 107 | 29.1 | deviation | scripts/model-tiers.ts |  | ACCEPTED BY USER 2026-09-03 (D-29.1-19), not closed. Round-5 verifier Blocker 3: resolveModels throws on the STEMS argument on ordinary values — resolveModels([Symbol('a'),'b'],{preset:'none'}) and a throwing-toString stem both throw at Floor 2's .sort(), under both presets. Floors 2 (:1126) and 3b (:1167) still interpolate the stem raw. The defect of record is the FALSE COMPLETENESS CLAIM: ledger row 95 and deferred-items D-29.1-23-01 both publish a CLOSED enumeration of four classes, all on overrides, when a fifth exists on a different parameter. Behaviourally fail-closed. Remedy shape: state the residual as open-ended, or route stems through the same quoting authority. Owner: unassigned — carried past phase close by user acceptance. | open |  | 2026-09-03T16:13:02.272Z |  |
| 108 | 29.2 | unrun-verify | install/install.ts |  | UNKNOWN - verify (Windows): the install-time adapter render spawns the mirrored generator with process.execPath and cleans the mkdtemp mirror with rmSync({recursive,force,maxRetries:3}). Neither the spawn nor the retry-on-locked-handle cleanup was executed on Windows this session (no Windows runner locally); the windows-latest CI leg is the only place they will be observed. install.test.ts's two symlink plants already skip on win32 for want of SeCreateSymbolicLink, so the WR-02 representation claim over the reshaped fixture is POSIX-only too. Remedy: read the windows-latest leg before treating the render as proven cross-platform. | open |  | 2026-09-04T09:27:20.480Z |  |
| 109 | 29.2 | unrun-verify | install/install.ts |  | The --check doctor now opens a SECOND temp-mirror lifecycle (process.execPath spawn + rmSync maxRetries cleanup) on a path plan 01 never exercised. POSIX-observed only; the windows-latest CI leg is the only place it will be seen. | open |  | 2026-09-04T10:07:13.479Z |  |
| 110 | 29.2 | deviation | install/install.ts |  | OPEN DEFECT (found 29.2-03 red-team, deliberately NOT fixed): the --check doctor names a target adapter that is stale or absent, but never one the target holds that the kit no longer ships. A stray grugops-*.md left by an older kit is loaded by Claude Code, survives uninstall (removal is by derived name over the kit set), and the doctor reports ALL CHECKS PASSED over it. Reproduced 2026-09-04. Deciding which target files the doctor speaks for is a contract question spanning install and uninstall, not a local bug, so it is recorded rather than invented mid-execution. | open |  | 2026-09-04T10:38:21.651Z |  |
| 111 | 29.2 | deviation | install/install.ts |  | PRE-EXISTING, out of scope for 29.2 (found 29.2-03 red-team): materializeAdapter's WRITE half throws uncaught when the destination adapter is a directory (EISDIR) or unwritable (EACCES). The run dies at exit 1 with a stack trace part-way through the adapter loop, after some adapters were already reported. The skip-if-identical arm added in 29.2-02 does NOT hide a stale target in either case - both were probed and neither reports identical - so the invariant this phase added holds; the crash predates the phase (the write was previously unconditional and threw the same way). | open |  | 2026-09-04T10:38:41.321Z |  |
| 112 | 29.2 | deviation | install/install.ts |  | OBSERVATION, pre-existing (found 29.2-03 red-team): when the checkout's .claude/agents cannot be read or is empty, the --check doctor is loud (exit 1) but reports it as a kit-root cross-check disagreement reading 'adapter=<unset>', which names the target rather than the unreadable checkout. Not silent, so not a bypass; the sentence points a reader at the wrong root. targetAdapterFiles' null propagation predates 29.2. | open |  | 2026-09-04T10:38:41.417Z |  |
| 113 | 29.2 | unrun-verify | install/install.test.ts |  | Unreproduced transient: one full-suite run reported 2 failing test files (baseline is 1); the extra failure was not identified and did not reproduce in 3 subsequent full runs. UNKNOWN - verify. | open |  | 2026-09-04T15:54:39.135Z |  |
| 114 | 29.2 | deviation | install/install.ts |  | Sibling-prefix containment trap (…/target-backup beside …/target) is covered only by an adversarial probe, not by a CI regression case. | open |  | 2026-09-04T15:54:39.225Z |  |
| 115 | 29.2 | unrun-verify | install/install.ts |  | UNKNOWN - verify (Windows): the plan-29.2-04 destination-hazard guard adapterDestHazard() is proven on the POSIX legs only. Five of its seven cases in install/install.test.ts carry a process.platform === win32 early return because creating a symlink on Windows needs the SeCreateSymbolicLink privilege an unprivileged CI runner does not hold, so symlinkSync throws EPERM and the plant would assert nothing; the leaf, ancestor, dangling and union shapes are therefore unobserved on windows-latest. The containment arm adds its OWN Windows unknown beyond the missing privilege: realpathSync resolves drive letters, UNC paths and directory junctions, and a junction is NOT a symbolic link to lstat, so whether arm 1 or arm 2 refuses a junctioned agents directory - or whether either does - was not measured. Remedy: read the windows-latest leg, and probe a directory junction (mklink /J) there before treating the containment bound as cross-platform. | open |  | 2026-09-04T18:33:31.118Z |  |
| 116 | 30 | deviation | agent-factory/config/factory.config.json |  | shipped checkpoints posture not reconciled with the legacy autonomy: pr / quality.test_integrity: warn grade (V-30-02-01) | open |  | 2026-09-05T13:31:29.522Z |  |
| 117 | 30 | deviation | agent-factory/config/factory.config.json |  | test_integrity has two config cells (quality.test_integrity and checkpoints.test_integrity) until the legacy key is retired (V-30-02-02) | open |  | 2026-09-05T13:31:29.626Z |  |
| 118 | 30 | deviation | scripts/check-banned-claims.test.ts |  | Plan 30-07: two 'no scan member overlaps an exclusion entry' assertions now compare against an ENUMERATED, count-pinned admission set (docs/GUARANTEES.md), because D-17 places the render under an excluded segment class. Exclusion list and walk byte-unchanged; original predicate kept exact over walk-derived parts. | open |  | 2026-09-05T16:47:59.587Z |  |
| 119 | 30 | deviation | scripts/checkpoints.ts |  | V-30-11-16 (RA7-1, HIGH, ZERO KEYS, plan 30-11 surface A fence): PROTECTED_REF_RE matches only a whole-word ref, so +main / HEAD:main / feature:main escape it, and a git global flag removes the literal pattern in the same stroke. EXECUTED on real git 2.55.0: git -C sub push origin +main gave '+ 30c1a74...18db97f main -> main (forced update)' through the committed hook artifact with no grant, no env var and no human name. Fenced under D-22 at the four-round cap, not fixed. Reproduction and structural fix in docs/audit/30-redteam-surface-a.md. | open |  | 2026-09-06T15:17:38.768Z |  |
| 120 | 30 | deviation | scripts/checkpoints.ts |  | V-30-11-17 (RA7-2, HIGH, ZERO KEYS, plan 30-11 surface A fence): git config is deliverable through the ENVIRONMENT inside the same command text (GIT_CONFIG_COUNT, GIT_CONFIG_PARAMETERS, --config-env) while the alias arm reads only -c. EXECUTED: three consecutive forced updates of main on a real bare remote. Round 3's reviewer recorded --config-env as 'not a governed action' under probes that found nothing; that claim was measurably wrong and passed into round 4 unexamined. Fenced under D-22, not fixed. | open |  | 2026-09-06T15:17:38.863Z |  |
| 121 | 30 | deviation | scripts/checkpoints.ts |  | V-30-11-18 (RA7-3, HIGH, ZERO KEYS, plan 30-11 surface A fence): a chained alias feeds gitPushIsGoverned a candidate list whose tail is an alias NAME rather than a refspec, so git -c alias.p=push -c alias.q=p q ALLOWS and EXECUTED a bare git push (eeb436f..fb57a1b main -> main) - the ambiguous form RA1-3 exists to deny. Subsumed by V-30-11-17's deletion. Fenced under D-22, not fixed. | open |  | 2026-09-06T15:17:38.949Z |  |
| 122 | 30 | deviation | scripts/checkpoints.ts |  | V-30-11-19 (RA7-4, HIGH, ZERO KEYS, plan 30-11 surface A fence): the whitespace re-tokenization is gated behind 'w.isFlag continue', so a governed command inside a flag-shaped word reaches neither authority - env -S'kubectl -n prod apply -f x.yaml' and --message="deploy: helm -n prod upgrade" ALLOW while -m 'deploy: helm -n prod upgrade' DENIES. EXECUTED against stub kubectl/gh binaries and against real git. Fenced under D-22, not fixed. | open |  | 2026-09-06T15:18:01.831Z |  |
| 123 | 30 | deviation | scripts/checkpoints.ts |  | V-30-11-20 (RA7-5, HIGH, ZERO KEYS, plan 30-11 surface A fence): a COMBINED short flag defeats the force rule in BOTH authorities in the plainest spelling - git push -fu origin feature EXECUTED '+ 3202f43...9a0d4c3 feature -> feature (forced update)' on real git. FORCE_PUSH_FLAGS holds exact tokens and the literal pattern misses it too; the first finding in this log both authorities miss in an adjacent, unquoted, unwrapped form. Fenced under D-22, not fixed. | open |  | 2026-09-06T15:18:01.916Z |  |
| 124 | 30 | deviation | hooks/hook-entry.ts |  | V-30-11-25 (RA8-3, HIGH, plan 30-11 surface A fence): DECIDER_MANIFEST is a plain object literal, so a decider name resolving to an Object.prototype key (hook-entry.js ../__proto__) SKIPS the manifest check entirely - Object.entries(Object.prototype) is [], the loop runs zero times and verification reports success having read zero files. A planted module writing the plaintext fd-3 token then yields exit 0 / 0 bytes = ALLOW at the host on 'git push --force origin main', with NO D-20 banner in the transcript. Reachability is repository-time (argv[2] comes from hooks.json) but it is an invisibility escalation: hooks.json still names hook-entry.js and every check stays green. Fenced under D-22, not fixed. | open |  | 2026-09-06T15:18:02.001Z |  |
| 125 | 30 | deviation | hooks/hook-entry.ts |  | V-30-11-21/22 (RA7-6, RA7-7, plan 30-11 surface A fence): the wrapper's integrity is a REPOSITORY-TIME control, not a runtime one. RA7-6 - verifyDeciderClosure hashes then spawnSync loads, not atomic: a background writer flipping the file in that window measured 87/352 = 24.7% ALLOW against a 0/124 control. RA7-7 - NODE_OPTIONS=--require preloads arbitrary code inside the hook process before the wrapper's first line, wrapper ALLOW with the manifest still verifying, and the self-set vocabulary (three GRUGOPS names) refuses it nowhere and records it nowhere. This WIDENS V-30-08-01. Fenced under D-22, not fixed. | open |  | 2026-09-06T15:18:02.086Z |  |
| 126 | 30 | unrun-verify | .github/workflows/ci.yml |  | V-30-11-23/24/29 (RA8-1, RA8-2, RA8-7, plan 30-11 surface A fence): gate reachability is not established. The derived runner set decides 'is this gate in CI' by raw-text ci.includes over ci.yml, so a COMMENTED-OUT step keeps it green (measured), and both arms filter on check- so a freshness gate is invisible to it. freshness:hook-manifest - the drift gate the whole wrapper-manifest fix rests on - appears in ci.yml ZERO times and in no test; the suite substitute is a whole-file containment test that cannot see a per-decider short manifest. 9 freshness scripts, 6 in CI, 3 at zero. Fenced under D-22, not fixed. | open |  | 2026-09-06T15:18:02.172Z |  |
| 127 | 30 | deviation | hooks/hook-entry.ts |  | V-30-11-31 (plan 30-11 surface A fence): the documented 10 s wrapper-timeout justification at hooks/hook-entry.ts:259 is FALSE - '466 ms is the worst decision measured' was the worst SAMPLED, not the worst reachable. Measured: 'true ; ' x 250000 gives 10047 ms -> SIGTERM -> fail-closed DENY; git x 50000 gives 10046 ms -> DENY. The command model is quadratic in tool-name occurrences per segment, so the timeout is input-reachable. Direction is over-refusal so the guard still fails closed, but a documented invariant that is false is the class this log keeps catching. Annotated in place, not rewritten. Fenced under D-22, not fixed. | open |  | 2026-09-06T15:18:02.258Z |  |
| 128 | 31 | deviation | scripts/context-io.ts |  | 31-01 residual: appendNote writes without asking admit(), so a caller who bypasses the admission authority persists a stale-SHA artifact-ref. D-03 places the comparison in admit() and nowhere else, so a second check in appendNote is forbidden; pinned by a named case in scripts/context-io.test.ts | open |  | 2026-09-07T14:30:02.245Z |  |
| 129 | 31 | deviation | scripts/compactor.ts |  | 31-01 residual: composeThreadNote does not mirror composeNote's evidence-provenance lines, so an artifact-ref written to the thread tier composes without sha/gate_run/content_hash. Fail-closed (validate refuses it on promotion), but the raw-to-promoted byte comparison would differ | open |  | 2026-09-07T14:30:02.576Z |  |
| 130 | 31 | unrun-verify | .planning/phases/31-autonomous-manual-testing/31-01-SUMMARY.md |  | 31-01: npm run freshness:context passes VACUOUSLY - no .grugops/context tree is committed, so the acceptance criterion 'exits 0 with no task listed as stale' is satisfied over an empty denominator. The non-vacuous byte-stability evidence is the composed-fence and render cases in scripts/context-io.test.ts | open |  | 2026-09-07T14:30:02.861Z |  |
| 131 | 31 | lint-warning | scripts/freshness.test.ts |  | 31-01: 'Test 1 (control, real tree)' exceeds vitest's 5s default timeout on this machine; PRE-EXISTING - reproduced at the plan base commit 109d5c7 in a detached worktree. The npm run freshness gate itself is green | open |  | 2026-09-07T14:30:03.135Z |  |
| 132 | 31 | deviation | scripts/check-foundation-guards.ts |  | guard_playwright_mcp_pin's sorted-walk determinism claim has no test: a differing directory-read order cannot be staged by this harness | open |  | 2026-09-07T15:26:04.015Z |  |
| 133 | 31 | deviation | scripts/chrome-lane-bar.test.ts |  | D-09 structural bar: the emitVerdict( predicate is syntactic — an aliased reference (const f = emitVerdict; f(...)) or bracket access evades it; measured, disclosed in the file header, not closed | open |  | 2026-09-07T16:15:06.392Z |  |
| 134 | 31 | deviation | agent-factory/workflows/05-pr-quality-gate.md |  | A repository holding *.uat.spec.ts files with quality.ui_e2e off never runs the UAT spec-integrity check; applicability is the dial's, so unchecked specs remain possible | open |  | 2026-09-07T16:15:06.479Z |  |
| 135 | 31 | unrun-verify | agent-factory/workflows/06-uat-pack.md |  | UNKNOWN - verify: the attended Chrome lane was not exercised live on this host; only its documented absence-of-route was asserted structurally | open |  | 2026-09-07T16:15:06.567Z |  |
| 136 | 31 | deviation | scripts/context-io.ts |  | Disclosed: one artifact-ref through admitAndAppend records TWO retained GOV-02 ledger events, because appendNote now admits the kind after the combiner already did. Asserted in scripts/context-io-writer-set.test.ts and scripts/context-io.test.ts rather than suppressed with a bypass token. | open |  | 2026-09-08T07:33:14.050Z |  |
| 137 | 31 | unrun-verify | scripts/runnable-ref/fixtures/playwright-test.d.ts |  | UNKNOWN - verify (assumption A1, T-31-32): the declared @playwright/test surface is a HAND TRANSCRIPTION at the kit's 1.62.1 pin, not the package. grugops ships zero runtime deps and its dev set is fixed by CLAUDE.md, so the package cannot be installed to derive it and nothing re-checks it against a released Playwright. Remedy: re-derive the surface wherever @playwright/test is actually installable before treating it as an API authority. | open |  | 2026-09-08T08:16:01.122Z |  |
| 138 | 31 | deviation | scripts/runnable-ref/uat-spec-integrity.ts |  | 31-06 accepted residual (T-31-31): two callee shapes stay unrefused by arm (c) — an aliased binding (const t = test; t.skip(...)) and a member computed from a non-literal expression (test[name](...)). Resolving either needs a type checker, which this runnable deliberately does not ship (D-13). Exported as UNRESOLVABLE_CALLEE_RESIDUALS, quoted in browser-uat-recipe.md, and pinned by a test asserting both really do pass today. | open |  | 2026-09-08T08:16:01.207Z |  |
| 139 | 31 | deviation | scripts/runnable-ref/uat-spec-integrity.ts |  | 31-REVIEW.md WR-01, surfaced by 31-06 and NOT closed by it: a .uat.spec.ts one directory outside a uat/ path segment is silently unchecked while the pass line still claims a full count. A real adjacent defect in the same file, outside the three verification gaps; named here so the next round has it rather than rediscovering it. | open |  | 2026-09-08T08:16:01.288Z |  |
| 140 | 31 | deviation | scripts/check-foundation-guards.ts | 3895 | Every early-return branch in guardPlaywrightMcpPin calls fail() (which increments FAILS) and then increments FAILS again — the authority-refusal tally is doubled. Pre-existing across four branches; the 31-07 branch matches that shape per plan instruction. Affects only the trailing 'N CHECK(S) FAILED' count, never exit status. | open |  | 2026-09-08T08:33:40.547Z |  |
| 141 | 31 | deviation | scripts/runnable-ref/uat-spec-integrity.ts |  | 31-08 R-19 (NEW, measured): a .uat.spec.ts under a uat segment inside tools/ is silently unchecked because tools is a member of SKIPPED_DIRECTORIES - tools/uat/dirty.uat.spec.ts carrying test.skip produced '0 findings over 1/1 uat specs checked', exit 0. Matters because install.ts materializes the checker itself into tools/grugops/. Skip-list arm of WR-01 (row 139); widening the walk's input boundary is a decision about the predicate's input, so it is named rather than changed. | open |  | 2026-09-08T08:57:54.742Z |  |
| 142 | 31 | deviation | scripts/check-foundation-guards.ts | 3895 | 31-08 R-18 (NEW, measured): a CORRECT sentence-final pin mention planted as the authority ('The kit uses @playwright/mcp@0.0.78.') is captured as '0.0.78.' by WR-09's dot-admitting occurrence pattern and refused by 31-07's new shape assertion as 'not a concrete version - a floating specifier AT THE AUTHORITY'. Fail-closed in direction (exit 1), wrong in diagnosis. Fixing it means changing WR-09's occurrence grammar. | open |  | 2026-09-08T08:57:54.831Z |  |
| 143 | 31 | deviation | .planning/phases/31-autonomous-manual-testing/31-05-PLAN.md |  | 31-08 R-20: the edge-probe partition is recorded as '8 = 4 authored + 4 surfaced' in 31-05-PLAN.md:132, 31-06-PLAN.md:127, 31-07-PLAN.md:118 and 31-08-PLAN.md; enumerated from the plans' own dispositions it is 5 authored + 3 surfaced. Total is 8 either way and no row is dropped, so the no-silent-drop property holds; the partition was copied forward across four documents without being re-derived. Recorded rather than corrected in place. | open |  | 2026-09-08T08:57:54.919Z |  |
| 144 | 31 | deviation | scripts/context-io.ts |  | Q9 residual: an in-process caller that can import scripts/context-io.js can mint its own green verdict via the exported emitVerdict and then admit a finding against it; measured in 31-09's red-team pass, strictly improved but not closed by 31-09 | open |  | 2026-09-08T13:33:19.523Z |  |
| 145 | 31 | unrun-verify | docs/audit/29-style-dispositions/ |  | check:diff-disposition carries 75 undispositioned clauses owned by plans 31-05/31-06/31-08; measured at 78 before 31-09's prose commit on a hermetic clone at 012364d | open |  | 2026-09-08T13:33:19.617Z |  |
| 146 | 31 | unmet-truth | scripts/runnable-ref/uat-spec-integrity.ts |  | 31-11 (D-17): the ban rule's head and tail sets are hand-authored and completeness against the real Playwright modifier surface is asserted in ONE direction only; plan 31-12's reverse partition closes it | open |  | 2026-09-08T14:16:41.492Z |  |
| 147 | 31 | deviation | scripts/context-io-writer-set.test.ts |  | 31-10 deviation 1: the plan's 'probe union equals the WHOLE derived set' criterion rested on a premise measurement disproved — S1 is unreachable; the set is now partitioned into reachable + positively-proven-unreachable | open |  | 2026-09-08T14:55:00.772Z |  |
| 148 | 31 | deviation | .planning/config.json |  | 31-10 deviation 3: commits made on the protected default branch main without git.allow_default_branch_commits; set the flag if sequential-on-main is intended | open |  | 2026-09-08T14:55:00.854Z |  |
| 149 | 31 | unmet-truth | scripts/context-io.ts |  | 31-10 R-37: admit()'s own 'no YAML frontmatter fence' refusal is DEAD CODE behind validate()'s delegation — derived, driven and disclosed, not removed; a plan owning context-io.ts must decide whether it earns its place | open |  | 2026-09-08T14:55:00.934Z |  |
| 150 | 31 | unrun-verify | scripts/runnable-ref/fixtures/playwright-test.d.ts |  | The reverse partition's denominator is a hand transcription: coverage of the DECLARED surface is established, coverage of the released @playwright/test package is not (R-07, UNKNOWN - verify) | open |  | 2026-09-08T15:28:05.725Z |  |
| 151 | 31 | unrun-verify | scripts/runnable-ref/uat-spec-integrity.test.ts |  | The surface walk is bounded at SURFACE_WALK_MAX_DEPTH = 4; a modifier family declared deeper than four segments is outside the measurement | open |  | 2026-09-08T15:28:05.815Z |  |
| 152 | 31 | deviation | scripts/runnable-ref/uat-spec-integrity.test.ts |  | test.describe.configure carries the weakest disposition reason in the record: its retries option changes how a failed result is read, so a red-team round could reasonably reverse the disposition to a refusal | open |  | 2026-09-08T15:28:05.899Z |  |
| 153 | 31 | deviation | scripts/runnable-ref/uat-spec-integrity.ts |  | D-18 (3): the rename/namespace canonicalisation is MODULE-SCOPED to @playwright/test — a rename arriving through a local fixture-extension re-export is still not canonicalised, a residual this plan's own change created | open |  | 2026-09-08T18:53:37.028Z |  |
| 154 | 31 | deviation | agent-factory/checklists/browser-uat-recipe.md |  | The reverse partition's walk covers declared PROPERTY CHAINS only; it does not descend through a call signature's return type, so a call-link spelling such as test.info().skip is outside its denominator though the rule refuses it | open |  | 2026-09-08T18:53:37.116Z |  |
| 155 | 31 | unrun-verify | docs/audit/29-style-dispositions |  | check:diff-disposition exits non-zero for 65 pre-existing undispositioned clauses in 05-pr-quality-gate.md, 06-uat-pack.md and 17-task-claim.md; 31-14 covered all 46 of its own clauses in 18-context-compaction.md (was 10 findings, now 0) | open |  | 2026-09-08T20:07:37.086Z |  |
| 156 | 31 | deviation | .planning/config.json |  | 31-14 committed on the default branch main: branching_strategy is none, use_worktrees is false, and no git.allow_default_branch_commits override is recorded in config.json | open |  | 2026-09-08T20:07:37.170Z |  |
| 157 | 31 | deviation | scripts/check-platform-shapes.ts |  | GOV-02 ledger position dropped from the platform shape corpus — a governance-dial guard fired correctly; criterion in deferred-items.md | open |  | 2026-09-10T13:42:53.284Z |  |
| 158 | 31 | unrun-verify | scripts/context-io.test.ts |  | 14 of 15 mkfifo call sites in test modules carry no platform guard, so the windows-latest vitest step is unreachable-green; measured from SOURCE on darwin, the Windows behaviour is UNKNOWN - verify | open |  | 2026-09-10T13:43:11.010Z |  |
| 159 | 31 | deviation | docs/audit/29-style-dispositions/31-29.md |  | Two disposition rows pack multiple sentences into one after cell; rowMatches compares one normalized clause, so 5 clauses are covered by nothing while the rows read as work done | open |  | 2026-09-10T13:43:11.093Z |  |
| 160 | 31 | unrun-verify | .github/workflows/ci.yml |  | R-03/R-31-19-03: the two new Windows-scoped shape steps are ENCODED but not observed — every measurement in 31-30 was taken on darwin and the Windows reading is UNKNOWN - verify | open |  | 2026-09-10T13:43:11.171Z |  |
| 161 | 31 | deviation | docs/audit/31-round6-residuals.md |  | R-31-31-01 raised and NOT repaired: the ambient declare const spelling reports 0 findings/EXIT=0, unmoved from 31-REVIEW.md CR-18 point 3, and no UNRESOLVABLE_CALLEE_RESIDUALS member names it. Owner: round 7's fix plan. | open |  | 2026-09-10T14:35:33.403Z |  |
| 162 | 31 | deviation | .planning/phases/31-autonomous-manual-testing/31-round6-residual-dispositions.md |  | The round-6 dispositions file declares 34 items (19 fix / 13 close / 2 open) while its six tables carry 43 (22/18/3); de-duplicating the one thrice-listed item gives 41. Derived by command. Owner: round 7's dispositions file. | open |  | 2026-09-10T14:35:33.484Z |  |
| 163 | 31 | unrun-verify | docs/audit/31-round6-residuals.md |  | R-01, R-02 and R-03 remain UNKNOWN - verify: the attended Chrome lane under real interactive auth, the auth predicate under alternative credential configurations, and every Windows leg. Every probe in the round-6 closing measurement ran on darwin only. | open |  | 2026-09-10T14:35:33.564Z |  |
| 164 | 31 | unrun-verify | scripts/check-platform-shapes.ts |  | Two of the thirteen CONTROL labels — NOT ORDINARY (answered) and NOT ORDINARY (no-answer) — are not watched live; they are driven through the module's exported derivation only (D-43) | open |  | 2026-09-13T01:39:15.934Z |  |
| 165 | 31 | stub | scripts/runnable-ref/uat-spec-integrity.ts |  | CR-28: a RENAMED import from a declared-foreign module is accepted at exit 0 — deriveImportRenames collects renames only from @playwright/test, so the foreign-declared arm's spelled operand is the LOCAL name; reproduced at 6e95edc, recorded in docs/audit/31-round8-residuals.md section 5, NOT repaired | open |  | 2026-09-13T02:40:34.587Z |  |
| 166 | 31 | unrun-verify | docs/audit/31-round8-residuals.md |  | The review-to-corpus coverage one-shot (D-33 (2)) was NOT re-taken in gap-closure round 9; its predicate still reads 2/5 strict and 5/5 weak, with no derived drivability rule | open |  | 2026-09-13T02:40:43.836Z |  |
| 167 | 31 | deviation | .planning/phases/31-autonomous-manual-testing/31-43-SUMMARY.md |  | requirements-completed: [UATX-01, UATX-04] asserts a completion the eighth verification round withheld; the four sibling summaries wrote [] and the requirement rows are byte-unchanged | open |  | 2026-09-13T02:40:43.924Z |  |
| 168 | 31 | unrun-verify | scripts/runnable-ref/uat-spec-integrity.test.ts |  | 31-25 CR-15 GREEN 1 times out at the 5000ms default under load (red on one of three full-suite runs; green alone and on an unloaded machine) — spawn-heavy case needs an explicit testTimeout | open |  | 2026-09-13T03:03:13.631Z |  |
| 169 | 32 | stub | scripts/board-model.ts |  | parseBoard returns updates, nonColumnSections, unparsed and bounds as empty or zero values; plan 32-02 fills them (plan-declared functionality gap) | open |  | 2026-09-14T08:16:31.933Z |  |
| 170 | 32 | stub | scripts/board-read.ts |  | readSnapshot returns the unavailable arm for tickets, queue, context and traceability without reading them; plan 32-03 reads them (plan-declared functionality gap) | open |  | 2026-09-14T08:16:32.020Z |  |
| 171 | 32 | stub | scripts/board-read.ts |  | reads are a single guarded readFileSync; the read-verify-reread and last-good carry-forward D-11 requires land in plan 32-03 (plan-declared functionality gap) | open |  | 2026-09-14T08:16:32.109Z |  |
| 172 | 32 | stub | scripts/board-dashboard.ts |  | the frame is the thin D-17 skeleton; the stale badge, conflict list, Now-running block, width truncation and TTY redraw land in plan 32-07 (plan-declared functionality gap) | open |  | 2026-09-14T08:16:32.268Z |  |
| 173 | 32 | stub | scripts/board-dashboard.ts |  | The watch flag is accepted, reported on stderr and not honoured; the watch loop, the debounce and the poll land in plan 32-03 (plan-declared functionality gap) | open |  | 2026-09-14T08:16:38.060Z |  |
| 174 | 32 | deviation | scripts/board-read.ts |  | STALE_REASONS is five, not the plan-stated four: unreadable (a partial parse) shipped in 32-01 and dropping it would regress the malformed-dial path | open |  | 2026-09-14T09:54:08.226Z |  |
| 175 | 32 | deviation | agent-factory/contracts/board.md |  | The contract's identifier rule requires a ticket prefix equal to factory.config.json#id_prefix, but scripts/board-model.ts is pure and reads no config, so it enforces only the identifier SHAPE. Recorded as scripts/board-corpus.ts row ctl-id-disagreeing-prefix; the prefix comparison belongs to the join layer that holds the dial. | open |  | 2026-09-14T10:54:07.185Z |  |
| 176 | 32 | lint-warning | docs/audit/29-style-dispositions/00-base.md |  | check:diff-disposition exits 1 on five Phase-31 workflow documents; pre-existing, verified identical at 6d59ed1e | fixed |  | 2026-09-14T13:45:35.380Z | 2026-09-18T10:41:54.975Z |
| 177 | 32 | lint-warning | .planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md | 404 | check:nul-bytes RED — literal ESC (0x1b) in the review document; pre-existing from commit 730ff88f, deferred by plan 32-09 as out of scope | open |  | 2026-09-14T20:33:15.766Z |  |
| 178 | 32 | deviation | scripts/board-read.ts |  | Hard-link residual (plan 32-10, CR-04): a hard link inside the repository to an inode whose other name is outside it is READ, because its path resolves inside the root. No path-based rule can refuse it; nlink>1 was declined as a heuristic. Measured, pinned by a mechanism test, and recorded in insideRoot's docblock, the board contract and 32-10-GREEN-proof.txt. | open |  | 2026-09-14T21:20:37.534Z |  |
| 179 | 32 | deviation | scripts/board-readonly.test.ts |  | Open residual (named, not closed): a module identity ASSEMBLED at runtime and handed to a non-module-system call - process.getBuiltinModule("node:" + "fs") - is not a string literal, so the 32-11 argument arm does not see it. import(expr)/require(expr) with a non-literal ARE refused. | fixed |  | 2026-09-14T23:14:26.242Z | 2026-09-15T13:42:41.144Z |
| 180 | 32 | unmet-truth | scripts/board-readonly.test.ts |  | F-03 (32-14): npm run check:dashboard-readonly exits 0 over a module acquiring node:fs via process.getBuiltinModule("node:" + "fs") — measured, not reasoned; reproduction in 32-14-ADVERSARIAL-REVIEW.md section 6 | fixed |  | 2026-09-14T23:59:53.269Z | 2026-09-15T13:42:49.724Z |
| 181 | 32 | unrun-verify | scripts/check-foundation-guards.test.ts | 12009 | F-01 (32-14): the 'every check:* npm script names a gate that CI runs' derivation skips check:dashboard-readonly (its command is not 'node scripts/*.js'), so the DASH-06 gate's CI reachability is unproven by that gate | fixed |  | 2026-09-14T23:59:53.350Z | 2026-09-15T13:42:49.809Z |
| 182 | 32 | deviation | .planning/phases/32-board-projector-cli-dashboard/deferred-items.md |  | the check:nul-bytes deferred entry still reads status: open but the gate is GREEN (fixed by user commit 888a1302); the entry is stale | fixed |  | 2026-09-14T23:59:53.431Z | 2026-09-15T13:42:49.892Z |
| 183 | 32 | unrun-verify | scripts/e2e |  | The live claude-CLI e2e lane was not run for plan 32-17 (spends tokens on an authenticated box and can hang); its state is UNKNOWN - verify | open |  | 2026-09-15T09:36:31.879Z |  |
| 184 | 32 | deviation | scripts/validate.test.ts |  | 32-21 stated blind spot: the ticket-frontmatter census cannot resolve a key spelling assembled at RUNTIME (String.fromCharCode, a template with substitutions, a name read from a variable). Measured at zero and pinned by a case; no such shape exists in scripts/ today. | waived | A ticket-frontmatter key spelling assembled at run time -- by String.fromCharCode, through a template with substitutions, or read from a variable -- is covered by neither of this repository's two authorities, and for structural reasons rather than for want of another arm: the static census reads expressions and the spelling is a value that does not exist until the program runs, while the runtime loader oracle observes module resolution and not string construction, so a key assembled inside an already-resolved module produces no event for it to record. Plan 32-36 closed the static half by resolving a key joined from literal characters; the remainder is measured at zero carriers on this tree and pinned by the census's own passing case at scripts/validate.test.ts:3088, which plants a String.fromCharCode shape and asserts the census reports nothing. | 2026-09-15T12:22:42.261Z | 2026-09-18T10:42:19.179Z |
| 185 | 32 | deviation | scripts/board-watch-live.test.ts |  | 32-22 measured boundary: a watch failure the NEXT poll tick repairs reaches no emitted document, because armAll() precedes refresh() inside one tick and a successful re-arm deletes the record (WR-06). Pinned by an assertion and by mutation M4; updates themselves never stop (997-1003 ms with every watch dead). | open |  | 2026-09-15T13:06:09.658Z |  |
| 186 | 32 | unrun-verify | scripts/board-watch-live.test.ts |  | 32-22: Windows fs.watch timing stays UNKNOWN - verify (Phase 33 / CAP-02). CI runs this file on windows-latest and three of its five cases depend on the platform delivering directory events; a red there is the CAP-02 measurement arriving early and must not be answered with a platform conditional. | open |  | 2026-09-15T13:06:17.466Z |  |
| 187 | 32 | unmet-truth | scripts/board-readonly.test.ts |  | F-04 (32-23): npm run check:dashboard-readonly exits 0, 89/89, over a closure module importing a writer through an ABSOLUTE-path specifier. isBareSpecifier excludes a leading slash so the allow-list never sees it, and js-import-closure follows only dot-relative specifiers so the module is never analysed. Measured with a real write, and the .ts typechecks and tsc emits the specifier verbatim, so a committed pair passes check:build-parity by construction. Reproduction in 32-23-ADVERSARIAL-REVIEW.md section 5. | fixed |  | 2026-09-15T13:43:12.868Z | 2026-09-16T13:43:56.720Z |
| 188 | 32 | unmet-truth | scripts/board-readonly.test.ts |  | F-08 (32-23): a capability-global member reached through a BINDING (const r = process.report; r.writeReport(p)) reds only the two-sided member-path census, not the acquisitions mechanism, because isCallee is false at a binding site. Recording process.report in EXPECTED_GLOBAL_MEMBER_PATHS and bumping the count - the edit the failure message invites - re-greens the gate at 89/89 over a writer in ONE edit. F-02's shape one register over. Reproduction in 32-23-ADVERSARIAL-REVIEW.md section 5. | fixed |  | 2026-09-15T13:43:12.950Z | 2026-09-16T13:43:56.820Z |
| 189 | 32 | unmet-truth | scripts/board-model.ts |  | F-06 (32-23): row-without-file still prints 'no ticket file carries that identifier' with an expected path that EXISTS, when the ticket file's declared id differs from its file stem. 32-15 keys the honest sentence on unadmittedTickets (refused entries, by stem) and the admitted map on the declared id, so an admitted-under-another-identity document is in neither map under its stem - and no readErrors entry is raised either. Reproduction in 32-23-ADVERSARIAL-REVIEW.md section 5. | fixed |  | 2026-09-15T13:43:13.030Z | 2026-09-16T13:43:56.905Z |
| 190 | 32 | deviation | scripts/board-dashboard.ts |  | F-05 (32-23): writeDocument sanitizes AFTER JSON.stringify, so the two are complementary - C1 is removed, C0 is already escaped into printable text and cannot be seen. A raw ESC in a board row title reaches the --json document as 0 control code points and is recovered as 6 by one JSON.parse. The boundary is stated in writeDocument's docblock; what is measured here is that the input is an ordinary raw C0, not a planted escape sequence. Reproduction in 32-23-ADVERSARIAL-REVIEW.md section 5. | fixed |  | 2026-09-15T13:43:13.111Z | 2026-09-16T13:43:56.992Z |
| 191 | 32 | deviation | scripts/check-foundation-guards.test.ts |  | F-07 (32-23): classifyCheckScript uses .exec, so a check:* command running two gate modules is classified by the FIRST and the second gets no reachability proof; CHECK_SCRIPT_CLASSES pins scripts per class, never targets per script. No live instance - all 11 check:* scripts carry at most one gate module, derived at measurement time. Reproduction in 32-23-ADVERSARIAL-REVIEW.md section 5. | fixed |  | 2026-09-15T13:43:13.193Z | 2026-09-16T13:43:57.075Z |
| 192 | 32 | deviation | scripts/js-import-closure.ts |  | The closure WALKER does not read a require("…") specifier (SPECIFIER_PATTERNS covers the three emitted import forms only); the read-only GUARD's AST census does refuse one. Measured in 32-31-GREEN-proof.txt § 4 P5. | open |  | 2026-09-16T07:22:43.296Z |  |
| 193 | 32 | deviation | .planning/phases/32-board-projector-cli-dashboard/deferred-items.md |  | 32-35 (WR-07): the CI-topology half is NOT taken — the three platform-dependent live cases stay in the shared 'Vitest (e2e lane excluded)' step of the test (matrix.os) job, so a Windows red there takes that step with it. Only the timing half was taken (EVENT_DEADLINE_MS derived from POLL_MS minus a named margin, 600 -> 750 ms). Owner: Phase 33 / CAP-02, per WINDOWS.md row 186. | open |  | 2026-09-16T11:24:09.394Z |  |
| 194 | 32 | deviation | scripts/check-diff-disposition.ts |  | 32-36: the one-authority ticket-frontmatter census's key half now decides by PRESENCE, which names this PRODUCTION module (its own disposition-register 'status' key and a 'safety_surface' column in an operator message) and required a file-scoped exemption. A genuine second ticket reader added to this one file later would be exempted with it. | fixed |  | 2026-09-16T12:43:50.219Z | 2026-09-18T10:41:55.060Z |
| 195 | 32 | deviation | scripts/board-dashboard.ts |  | F-09 (32-37): sanitizeCell strips U+0009 from a refusal message BEFORE serialization, so the unrecognized-line diagnostic quotes a line reading as a valid `key: value` while asserting beside it that it is neither. The model's own message carries the TAB (measured U+0009); both channels remove it. Created on the --json channel by 32-35's scrub-before-serialize ordering; inherited on stderr from 32-18's warn() chokepoint. | open |  | 2026-09-16T13:44:15.209Z |  |
| 196 | 32 | deviation | scripts/validate.test.ts |  | F-10 (32-37): the one-authority ticket-frontmatter census requires its key half and its primitive half to meet inside ONE parsed file, so a reader whose keys are exported from file A and scanned in file B is invisible. Measured: two real files under scripts/, census reports 1 and exits 0, and the planted reader returns {status: ready, column: In Development} from ABC-103.md. 32-36's boundary case pins the scope only in the over-detection direction. | open |  | 2026-09-16T13:44:15.297Z |  |
| 197 | 32 | deviation | scripts/check-foundation-guards.test.ts |  | F-11 (32-37): GATE_TARGET_RE/SUITE_TARGET_RE admit one spelling each, so a check:* command mixing one recognised target with one unrecognised spelling (leading ./, an intervening node flag, two spaces, or a composed npm run) yields a SHORT non-null row set that never reaches the null arm 32-36 added. F-07's defect one register over. No live instance: 11 scripts carry 11 targets, all recognised. | open |  | 2026-09-16T13:44:15.381Z |  |
| 198 | 32 | deviation | scripts/board-model.ts |  | F-12 (32-37): presenceActual's admitted-under-another-id sentence asserts the file 'is joined under that identifier', which is false of a duplicate-id LOSER. board-read deliberately keeps the loser in the admitted record list to keep its partition total, so byStem finds it, but ticketById joined the winner. The snapshot then carries a duplicate-id readError saying the file is NOT joined beside a conflict saying it is. Created by 32-33. | open |  | 2026-09-16T13:44:15.463Z |  |
| 199 | 32 | deviation | scripts/js-import-closure.ts |  | F-13 (32-37): SPECIFIER_PATTERNS is three regexes, so moduleSpecifiers is never ASKED at four positions a specifier enters: require(), createRequire(...)(...), import.meta.resolve(), and new Worker(new URL(...)). All four were planted and all four exit 1 through the guard's sibling AST census (allow-list for node:module, acquisitions PREMISE for the other three), so it is not a live DASH-06 bypass; the cost is a short closure module list. Widens row 192 by three positions. | open |  | 2026-09-16T13:44:15.545Z |  |
| 200 | 32 | deviation | scripts/board-model.ts |  | F-14 (32-40, OPEN medium): a quoted ticket identifier's control byte is DELETED before the reader sees it, in an arm the WR-02 fix's site set does not reach. TICKET_CONTROL is /[\\x00-\\x08\\x0b-\\x1f\\x7f]/ and does not cover C1, so a ticket id carrying U+0085 is ADMITTED; RENDER_STRIPPED is /[\\u0000-\\u001F\\u007F-\\u009F]/g and deletes it. presenceActual (:1380,:1385) and ticket-unplaced (:1606) then state twice that the file declares an identifier it does not declare. Difference set measured at 34 code points, 32 of them the admissible C1 block. INHERITED (predates the fix pass); what is new is the fix's claim of site-set totality, derived over the binding name line/lines and never asked about content-derived identifiers. No byte leaves the tree; no write capability. Bears on DASH-03 and DASH-07. | fixed |  | 2026-09-16T20:23:41.999Z | 2026-09-18T10:41:55.145Z |
| 201 | 32 | deviation | scripts/validate.test.ts |  | F-15 (32-40, OPEN medium, live working reader demonstrated): the split-reader refusal enumerates ONE import shape. splitReaderOffenders/readerHalves catch a RENAMED named import but not a namespace import and not a two-hop re-export; both were built as real working readers that returned {status:in-review,column:In Review} at census exit 0, 130/130. CREATED BY 7aea94f0 (this round). Zero live instances: the census verdict is exactly-one-authority and NOT_A_SECOND_AUTHORITY_COUNT is pinned at 9 and did not move. Detection robustness in the PROOF of DASH-01/DASH-02, not a live second authority. | fixed |  | 2026-09-16T20:23:42.089Z | 2026-09-18T10:41:55.230Z |
| 202 | 32 | deviation | scripts/js-import-closure.ts | 296 | F-16 (32-40, OPEN low, no live instance): CR-01's fix blanks STRING literals and not REGULAR-EXPRESSION literals. scanSource's regex arm skips without blanking, so a tracked .js carrying /from "./evil.js"/ in a regex interior fabricates a relative specifier and jsImportClosure refuses on an edge nobody wrote — CR-01's exact shape, one literal kind over. The package-shaped variant fabricates a bare specifier that is silently skipped. INHERITED. Blast radius measured zero: the two-sided oracle over all 65 tracked .js/.mjs reports fabricated 0, missed 0. Failure direction is over-refusal. Bears on DASH-06. | fixed |  | 2026-09-16T20:23:42.173Z | 2026-09-18T10:41:55.315Z |
| 203 | 32 | deviation | scripts/board-readonly.test.ts |  | F-17 (32-40, OPEN low, no live instance): a TEMPLATE-LITERAL dynamic import is invisible to the scanner AND to the oracle's supposedly independent authority. SPECIFIER_PATTERNS only ever accepted ["'], so await import(`./tpl.js`) is scanned as []; the two-sided parser oracle's parsed() helper asks ts.isStringLiteral(node.arguments[0]) — THE SAME QUESTION — so the instrument built to prove the scanner cannot detect this class of miss. Scanner half INHERITED; the ORACLE half CREATED BY d276f4e3 (this round). Zero live instances (0 non-StringLiteral dynamic-import arguments across 65 files) and the WRITE ROUTE IS STILL REFUSED: plant S8 exits 1 at 19 failed/156 passed with the acquisitions PREMISE case red. Bears on DASH-06. | fixed |  | 2026-09-16T20:23:58.558Z | 2026-09-18T10:41:55.399Z |
| 204 | 32 | deviation | scripts/js-import-closure.ts |  | F-18 (32-40, OPEN informational): the WR-06 widening RELOCATES the refusal for the members it moved. classifySpecifier's bare arm now sends several spellings (a package-shaped name, a leading-whitespace absolute path) down a path where the acquisitions PREMISE case no longer fires, so a bare-specifier writer is refused by ONE predicate (the ALLOWED_BUILTIN_SPECIFIERS equality) where a foreign one is refused by TWO. CREATED BY 3e2f254a (this round) and measured NOT to weaken any recorded spelling: all 13 of round 3's baseline spellings unmoved, plants S7 and S9 both exit 1 at 11 failed/164 passed. Whether one predicate is enough for that class is a DECISION, surfaced to 32-41's checkpoint. Bears on DASH-06. | fixed |  | 2026-09-16T20:23:58.645Z | 2026-09-18T10:41:55.485Z |
| 205 | 32 | deviation | scripts/check-foundation-guards.test.ts | 12693 | F-19 (32-40, OPEN informational, no live instance): the IN-03 one-authority rule enumerates reads by the register's identifier TEXT. The reads set matches only accesses whose expression.getText() equals "TOOLCHAIN_CHECK_SCRIPTS", so a second UNGUARDED read reached through an alias (const ALIASED_REGISTER = TOOLCHAIN_CHECK_SCRIPTS) is outside the set, and both the reads.length===1 pin and the every-read-is-guarded assertion pass over it (planted, 300/300, exit 0). CREATED BY c5fc977a (this round, plan 32-39). Zero live instances: no alias exists and every lookup name is a check:-prefixed script name. Bears on DASH-02 proof robustness. | fixed |  | 2026-09-16T20:23:58.732Z | 2026-09-18T10:41:55.570Z |
| 206 | 32 | deviation | scripts/board-dashboard.ts | 1184 | F-20 (32-40, OPEN informational): one consumer of the containment decision still uses the UNRESOLVED spelling. 70cbd447 moved the watch HANDLE to decision.real (:1189) but the liveness gate at :1184 is still if (!deps.exists(dir)). INHERITED — the gate was not part of the finding and was not moved. Blast radius bounded and measured: existsSync follows symlinks so it answers the same as decision.real except across a swap landing between the two calls; the handle is decision.real; and the watch callback ignores the filename argument entirely, so no content crosses the seam. Bears on DASH-04 and DASH-05. | fixed |  | 2026-09-16T20:24:14.464Z | 2026-09-18T10:41:55.656Z |
| 207 | 32 | deviation | scripts/check-foundation-guards.test.ts |  | F-21 (32-40, OPEN informational, no live instance): the WR-05 step counter's separator alphabet excludes five ordinary shell shapes. NODE_STEP_RE/VITEST_STEP_RE are correct for &&, ; and \|\| but undercount a single pipe, a newline, a leading parenthesis, a wrapper command, a background separator and a command substitution, and overcount a quoted 'vitest run' inside a message. CREATED BY c5163183 (this round). Zero live instances, measured per entry over all 11 check:* scripts: no single pipe, no single &, no newline, no wrapper. The one live exclusion (check:build-parity's inline node -e) is excluded by decision and stated in the docblock. Bears on DASH-02 proof robustness. | fixed |  | 2026-09-16T20:24:14.557Z | 2026-09-18T10:41:55.745Z |
| 208 | 32 | unrun-verify | scripts/board-readonly.test.ts |  | 32-41 carried UNKNOWN - verify (from 32-REVIEW-FIX.md): whether a write capability can reach the dashboard closure through import.meta.resolve, through a WRITER VALUE RECEIVED AT RUNTIME, or through a future node_modules dependency. The import.meta.resolve position is separately recorded as row 199 (F-13) and was measured refused by the sibling AST census; the runtime-value and future-dependency halves are OUTSIDE WHAT A SYNTACTIC PASS CAN DECIDE and are unchanged by this round. Owner: unassigned — closing it needs a different instrument (a runtime capability probe), not another resolution arm. Bears on DASH-06. | waived | A writer VALUE received at run time and a dependency that does not exist yet are both outside what any instrument on this corpus can observe: a value passed between two already-resolved modules produces no resolve event, so Node's loader oracle has nothing to record, and a specifier a future commit introduces cannot be enumerated by a probe of what this tree loads today. The runtime oracle landed in plan 32.1-01 closed the half that IS observable -- it recorded 14 resolve events over the dashboard closure and its module set and builtin identity set are equal, element for element, to the static closure's, with the working tree byte-identical before and after the load -- and what remains is covered instead by the static acquisitions census, whose second write-detection predicate plan 32.1-08 restored, and by the standing failing case that reds the moment package.json gains a dependencies key. | 2026-09-16T20:24:14.647Z | 2026-09-18T10:42:19.268Z |
| 209 | 32 | deviation | .planning/phases/32-board-projector-cli-dashboard/32-40-ADVERSARIAL-REVIEW.md |  | 32-41 NEW RESIDUAL: the round-4 review attributes the WR-04 fix to commit 7aea94f0 at five places (sections 5, 12/F-15, 13 ratio table, 16 rows 2 and 12). 7aea94f0 is a DOCS commit touching only .planning/ROADMAP.md, .planning/STATE.md and 32-38-SUMMARY.md; it cannot have created splitReaderOffenders. The commit that did is 7a3ae592 (fix(32): WR-04 refuse the split-across-files ticket reader), measured with git log -S splitReaderOffenders. The review's sixth use of 7aea94f0, as the END of the range d5486262..7aea94f0 for plan 32-38, is CORRECT and is not part of this row. THE VERDICT DOES NOT MOVE: 7a3ae592 is a fix-pass commit in the same window, so F-15 stays created-by-a-fix-pass-change and the created-versus-inherited ratio stays 5 of 8. Only the hash is wrong. Recorded rather than corrected in place, because 32-41 does not edit another round's evidence document. | fixed |  | 2026-09-16T20:26:20.870Z | 2026-09-18T10:41:55.832Z |
| 210 | 32 | deviation | scripts/board-tracer.test.ts |  | 32-38 (recorded as a ledger row by 32-41): scripts/board-tracer.test.ts became the NINTH entry in scripts/validate.test.ts's NOT_A_SECOND_AUTHORITY registry (count 8 -> 9). Plan 32-38's duplicate-identifier fixture supplied the 'status' key spelling that tipped a file already naming 'column' in a WIP-count test description and already scanning text into the census's namesBothKeys && scans conjunction. Re-measured 2026-09-16 at b6f6bd45: NOT_A_SECOND_AUTHORITY_COUNT = 9 at validate.test.ts:1893, two-sided pinned at :2252, unmoved. THE RISK: a genuine second ticket-frontmatter reader placed inside this file would be invisible to the census, exactly as one placed in any other exempt file would be. Carried in deferred-items.md since 32-38 and given a ledger row here so it is OPEN rather than ABSENT from the register. Bears on DASH-01, DASH-02. | open |  | 2026-09-16T20:28:42.842Z |  |
| 211 | 32.1 | unmet-truth | scripts/e2e/uat-live.test.ts |  | Live lane A1 (D-31, plugin-cache pointer resolution) FAILED on the one authorized run of 2026-09-18 after 606161 ms with an EMPTY capture: neither /grugops:plan nor --plugin-dir ./ produced planning markers without a cache path error. 606 s across two calls whose per-call budget is 300 s is consistent with both exhausting that budget and returning nothing. Cause undiagnosed by that run - kit, suite expectation, CLI version 2.1.275 or host configuration are all open. Evidence: 32.1-10-LIVE-TRANSCRIPT.txt. Owner for WINDOWS.md row 183 (re-homed-with-named-owner, 32.1-LEDGER.md section 3.1). The human go covered ONE run and explicitly not a re-run. | open |  | 2026-09-18T10:42:44.036Z |  |
| 212 | 32.1 | unmet-truth | scripts/e2e/uat-live.test.ts |  | SAFETY CASE. Live lane A2-live (SAFE-02 / V14, the prod-deploy deny) FAILED on the one authorized run of 2026-09-18 after 11663 ms: the call COMPLETED (stop_reason end_turn, total_cost_usd 0.398524) and the guard's structured prod-deploy deny envelope never appeared. This is the mechanical enforcement CLAUDE.md requires of the never-deploy-to-production-without-named-human-confirmation rule, and a live run did not observe it. Cause undiagnosed by that run. Evidence: 32.1-10-LIVE-TRANSCRIPT.txt. Owner for WINDOWS.md row 183 (32.1-LEDGER.md section 3.1). | open |  | 2026-09-18T10:42:44.128Z |  |
| 213 | 32.1 | unmet-truth | scripts/e2e/uat-live.test.ts |  | Live lane A3-live (DOG-02, D-05 dual-path convergence) FAILED on the one authorized run of 2026-09-18 after 370297 ms: the frozen gate verdict READY_FOR_HUMAN_REVIEW must converge on BOTH dispatch paths and both paths completed (costs 2.15167525 and 1.78309750) with neither producing the verdict (seq=false, sub=false). A3-live-N and both loud-skip tests-of-the-test passed, so the lane was not skipped. Cause undiagnosed by that run. Evidence: 32.1-10-LIVE-TRANSCRIPT.txt. Owner for WINDOWS.md row 183 (32.1-LEDGER.md section 3.1). | open |  | 2026-09-18T10:42:44.214Z |  |
| 214 | 32.1 | deviation | scripts/e2e/uat-live.test.ts |  | Stale claim in a safety-relevant docblock: the file states the live lane is kept OUT of the default npm test green path via the test:e2e script. False on this tree - npm test is bare vitest run, vitest.config.ts excludes only scripts/runnable-ref/fixtures and .temp, and the 2026-09-18 run proves collection happened. Anyone trusting the docblock would spend tokens on an authenticated box believing they were running the regression lane. Found by plan 32.1-10 by reading it; not patched there (that plan modified no source) and not patched by 32.1-11 (whose task list owns no source file). | open |  | 2026-09-18T10:42:44.299Z |  |
| 215 | 32.1 | deviation | scripts/board-model.test.ts | 2358 | R-32.1-01-A (review IN-05, carried by plan 32.1-01): the presence-spelling walk at presenceSpellingSites / SPELLING_WALK_SKIP / SPELLING_WALK_EXTENSIONS (:2358-2390) walks the whole repository root over seven extensions including .md, .json and .txt, so UNTRACKED paths such as .gsd/ and human-notes.txt are inside its scope and a local note can red the suite. CONTEXT.md D-03 claimed the plan-01 tracked-set floor closes this; RESEARCH section Contradictions row 3 measured that IN-05 names a DIFFERENT walk and the floor does not reach it. Remedy IN-05 itself proposes: derive that walk's corpus from git ls-files. Recorded in the case docblock in scripts/board-readonly.test.ts. Outside 32.1-LEDGER.md's nineteen items (an IN- item is not one of D-22's three sources); given a row here so it is OPEN rather than ABSENT - see 32.1-LEDGER.md section 3.3. | open |  | 2026-09-18T10:43:04.099Z |  |
| 216 | 32.1 | deviation | scripts/check-foundation-guards.test.ts |  | R-32.1-01-B (plan 32.1-01): the (r-class-authority) guard classifies a *.test-support.ts file as SHIPPED, because its non-test predicate is !endsWith('.test.ts'). A future *.test-support.ts module that legitimately consumes the CI-workflow testkit cannot be expressed today: it would be reported as a shipped consumer and would also break the case's consumers === members equality. Closing it means either teaching that guard a canonical definition of test file or renaming the *.test-support.ts family - both decisions, not edits. Recorded in scripts/ts-symbols.test-support.ts's header, where the prose gave way rather than the guard's classification being widened. | open |  | 2026-09-18T10:43:04.189Z |  |
| 217 | 32.1 | deviation | scripts/board-readonly.test.ts |  | R-32.1-01-C (plan 32.1-01): the walker-importer derivation is still a TEXT match, not a checker resolution. The set is git-derived and recursive and the matcher accepts any relative depth, but a comment quoting the specifier would still count as an importer. The symbol-resolving instrument landed in plan 32.1-01 is what could decide it by declaration; cutting this particular case over was not in that plan's scope and no later plan in 32.1 took it. | open |  | 2026-09-18T10:43:04.274Z |  |
| 218 | 32.1 | deviation | scripts/board-model.ts |  | Plan 32.1-07 residual 1: the conflicts[].ticketId FIELD still publishes the byte DELETED. It reads ABC-902X while the sentence beside it reads ABC-902<U+0085>X. Deliberate - that field is a join key scrubbed on the way out by scrub()/sanitizeCell, not a sentence a human reads, and escaping it would make a consumer's join disagree with the model. It belongs to the data channel (D-18), not to the D-07 sentence builder. Recorded in 32.1-07-RED-baseline.txt section 1 and named rather than closed silently. | open |  | 2026-09-18T10:43:04.357Z |  |
| 219 | 32.1 | deviation | scripts/board-model.test.ts |  | Plan 32.1-07 residual 2: the published-sentence census keys a declaration as <file>#<declared name>, so two declarations sharing a name in ONE file share a class. No such pair disagrees on this tree today, and a NEW name reds the two-sided pin - the hole is name REUSE, not name arrival. Named in the census's own docblock. | open |  | 2026-09-18T10:43:04.443Z |  |
| 220 | 32.1 | deviation | scripts/board-read.ts | 1591 | Plan 32.1-12 gap (this phase's single FAILED must-have, 32.1-VERIFICATION.md gap #1), REPRODUCED end to end at 46d860a2 and closed on ONE path. childPath (scripts/board-read.ts:1038-1058) refuses only an empty segment, a dot, a double dot and a segment carrying a separator, so a directory entry name carrying a code point the renderer DELETES passes it, is joined into a composed path, and is quoted into published claim-record sentences that are NOT built through the spelled builder; sanitizeCell then deletes the byte and the published JSON document names a path that does not exist on the tree. Measured at three channels in one run against three planted points, <U+0085>, <U+009F> and <U+0001>; the model's own sentence and the JSON document both carried the defect, the stderr frame did not (board-dashboard.ts emit() applies the builder a second time there). Reproduction transcript: .planning/phases/32.1-board-dashboard-deferred-residuals/32.1-12-RED-baseline.txt, section 1; the derived work list is section 2. The verifier's ten hand-named line numbers are CONTAINED in the derived set and SHORT by nine lines. CLOSED HERE: the tampered and no-at sentences, 2 of the 18 path-class unowned published substitutions the census derives. STILL OPEN: the other 16, over absPath (2), dir (1), indexPath (1), path (1), real (1), root (4), target (4) and taskDir (2), all in scripts/board-read.ts; plan 32.1-13 deletes the PATH-DERIVED class and plan 32.1-15 transitions this row. OWNER: the published-substitution census in scripts/board-model.test.ts, which now classes board-read.ts#claimMd as a subject declaration and is the authority that will refuse the next unbuilt sentence quoting a composed path; its discrimination is proved by a seeded tag removal in scripts/board-read.ts rather than argued. Bears on DASH-03 and DASH-07. | open |  | 2026-09-18T12:37:01.717Z |  |
| 221 | 32.1 | deviation | .planning/phases/32.1-board-dashboard-deferred-residuals/32.1-13-PLAN.md |  | Plan 32.1-13 Task 3's JSON verify command pins snapshot.schemaVersion 1; scripts/board-model.ts declares SCHEMA_VERSION = 2 since phase 32-33 (92f27444), so the command as written fails on correct code. Re-run with the version DERIVED from the module; recorded in 32.1-13-GREEN-proof.txt section 3.3. | open |  | 2026-09-18T13:34:26.209Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "27",
    "file": ".planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md",
    "line": null,
    "description": "SPAWN-03 runtime half unobserved: the session startup header and whether a distinct role agent resolves and runs; slots empty in the recording surface",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-29T10:56:31.216Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/coordinator-resolution-precheck.ts",
    "line": null,
    "description": "The materialized-kit sentinel reader is duplicated from install/install.ts readAdapterKit (install.ts installs at module load, so it cannot be imported)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-29T10:56:31.277Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/frontmatter.ts",
    "line": null,
    "description": "Quoted-wrapped-continuation false-red residual: a double-quoted scalar wrapping onto a line starting with & or * is refused though those bytes are literal; dispositioned accept under T-27-94 (fails closed, no shipped surface produces it)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-30T13:06:23.456Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/check-foundation-guards.ts",
    "line": null,
    "description": "IN-03 (round 5) still live: guardKitCounts asserts per-part SET equality but never asserts the four parts EXHAUST the composition, so a member under no part prefix is unreported by the guard; pinned only over a fixture in kit-model.test.ts. Deliberately out of scope for 27-37 (D-47 names only the catch-swallow).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-04T06:58:26.002Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/frontmatter.test.ts",
    "line": null,
    "description": "27-38 false-red control: only 1 scoped grant enumeration exists across all 33 spawn-grant scan members, so 'zero false reds across 33 members' rests on one enumeration (the coordinator's 16-name grant), not 33",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-04T07:22:51.768Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/validate-agent-factory.ts",
    "line": null,
    "description": "Not a spawn-grant surface (0 spawn / 0 frontmatter / 0 wr05); the round-7 'validator printed ALL CHECKS PASSED' criterion is unsatisfiable and is owned by no round-8 plan. 27-44-SUMMARY.md recommends retiring it.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-09T10:23:33.078Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/frontmatter.test.ts",
    "line": null,
    "description": "27-55: AXIS_SPELLING places the block sibling only AFTER the payload, so block-BEFORE ordering is outside the union axis's shape space (covered instead by the U4 adjacency case and probes a4/a6/a7)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T12:15:03.445Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/frontmatter.test.ts",
    "line": null,
    "description": "27-55: the pre-fix-mirror non-circularity count is 1 of 72 cells — non-empty so the axis provably sees the defect, but thin; add an ORDERING member to AXIS_SPELLING and re-take the count",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T12:15:03.506Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/frontmatter.ts",
    "line": null,
    "description": "raw.trim()'s alphabet (Unicode WhiteSpace) is wider than the module's declared [ \\t] class; pre-existing, never in the silent-no-grant direction, owner named in 27-56",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T12:53:33.210Z",
    "resolved_at": null
  },
  {
    "id": 10,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/frontmatter.test.ts",
    "line": null,
    "description": "this repository's vitest intercepts console output, so the file's 'PRINTED, never silent' skips are invisible on a default run",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T12:53:33.273Z",
    "resolved_at": null
  },
  {
    "id": 11,
    "kind": "unrun-verify",
    "phase": "27",
    "file": "scripts/frontmatter.test.ts",
    "line": 14245,
    "description": "27-60 IN-03 brittleness: unasserted indexOf bounds, no identity check, and a negative over unstripped text; carried OPEN by 27-60 and 27-61 so neither edits another plan's evidence",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T16:41:24.108Z",
    "resolved_at": null
  },
  {
    "id": 12,
    "kind": "unrun-verify",
    "phase": "27",
    "file": ".planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md",
    "line": null,
    "description": "27-59's three families the SHARED D-52 corpus cannot see (R1/R4/R6) — pinned by the whole suite but not by the corpus; reconciled, not closed, by 27-61",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T16:41:24.174Z",
    "resolved_at": null
  },
  {
    "id": 13,
    "kind": "stub",
    "phase": "27",
    "file": "scripts/frontmatter.ts",
    "line": null,
    "description": "a blank line inside an open PLAIN (non-block) scalar still folds to a space, inventing a name on a loader-ACCEPTED document; PINNED at its current wrong answer by a named case (27-58)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T16:41:24.238Z",
    "resolved_at": null
  },
  {
    "id": 14,
    "kind": "unrun-verify",
    "phase": "27",
    "file": "scripts/canonical-frontmatter.ts",
    "line": null,
    "description": "27-62: false-red cost of the strict plain-scalar alphabet is measured 0 over the 33 live scanned files but UNMEASURED tree-wide; 27-65 owns that measurement at cutover",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-10T19:53:28.868Z",
    "resolved_at": "2026-08-10T21:51:46.127Z"
  },
  {
    "id": 15,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/canonical-frontmatter.ts",
    "line": null,
    "description": "27-65 narrowing: the canonical form admits 2 of 7 legitimate YAML spellings of one declaration (plain scalar, block sequence); wrapped-plain, wrapped-quoted, trailing-# comment, folded >- and literal |- are now refused inside the spawn-grant scan, as is a quoted `name`. Live cost measured 0 (33/33 admit); the LATITUDE is gone and future hand-written kit content must be canonical.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T21:51:32.443Z",
    "resolved_at": null
  },
  {
    "id": 16,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/canonical-frontmatter.ts",
    "line": null,
    "description": "27-65: 554 of 575 frontmatter-bearing tracked .md files OUTSIDE the spawn-grant scan would refuse (flow-collection 416, unknown-key 134, block-scalar 4). Not exposure today — those .planning/ artifacts are not in spawnGrantScan and the 10-key schema is deliberately the kit's spawn schema — but a hard constraint on anyone who later widens that scan.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T21:51:32.507Z",
    "resolved_at": null
  },
  {
    "id": 17,
    "kind": "unrun-verify",
    "phase": "28",
    "file": ".github/workflows/ci.yml",
    "line": null,
    "description": "check-public-docs-vocabulary is wired into CI and is RED by design (18 AUDIT-02 drift hits) until plan 28-05 lands the rewrites — intended per D-24, must not be read as breakage",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-11T14:37:25.571Z",
    "resolved_at": null
  },
  {
    "id": 18,
    "kind": "unmet-truth",
    "phase": "29",
    "file": "scripts/check-foundation-guards.ts",
    "line": null,
    "description": "LANG-08 re-baseline half UNMET by decision (hold-rebaseline): the 17 byte ceilings still encode a 2026-06-10 baseline and describe a pre-rewrite kit; headroom is 1,069 B larger than the rewrite earned. Ratchet-down values preserved in docs/audit/29-ceiling-rebaseline.md",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T17:27:07.207Z",
    "resolved_at": null
  },
  {
    "id": 19,
    "kind": "lint-warning",
    "phase": "29",
    "file": "agent-factory/roles/security-nfr.md",
    "line": null,
    "description": "guard_role_size prints a live WARN on every green run: 4931B >= 4830B advisory tier (171 B under FAIL). 29-07 refused the remaining bytes as safety-bearing prose",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T17:27:07.270Z",
    "resolved_at": null
  },
  {
    "id": 20,
    "kind": "todo",
    "phase": "29",
    "file": "agent-factory/roles/security-nfr.md",
    "line": null,
    "description": "## Reads bullet 3 breaches WP-03 at ~32 words against a 25-word descriptive bound; left by 29-07 under byte pressure and not taken up by 29-13, which changes no prose",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T17:27:07.333Z",
    "resolved_at": null
  },
  {
    "id": 21,
    "kind": "stub",
    "phase": "29",
    "file": "scripts/check-imperative-lexicon.ts",
    "line": null,
    "description": "guard_sentence_form segments per source LINE, so a wrapped sentence is cut at the line break and a mid-sentence relative pronoun at a line head can false-positive the bare-demonstrative arm (attested at context-note.md:35 in 29-12)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T17:27:20.092Z",
    "resolved_at": null
  },
  {
    "id": 22,
    "kind": "stub",
    "phase": "29",
    "file": "scripts/check-imperative-lexicon.ts",
    "line": null,
    "description": "guard_imperative_lexicon's 0-over-139 is an EMPTY DENOMINATOR over three of the corpus's four parts: checklists, seed templates and contracts carry no ## Steps heading, so all 139 bullets are workflows'",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T17:27:20.160Z",
    "resolved_at": null
  },
  {
    "id": 23,
    "kind": "stub",
    "phase": "29",
    "file": "scripts/check-imperative-lexicon.ts",
    "line": null,
    "description": "readDispositionRows() silently drops a register row containing an escaped pipe: it splits on | and skips any row whose cell count is not seven, wordlessly (attested in 29-12)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T17:27:20.224Z",
    "resolved_at": null
  },
  {
    "id": 24,
    "kind": "unrun-verify",
    "phase": "29",
    "file": "scripts/check-nul-bytes.ts",
    "line": null,
    "description": "No gate detects a non-UTF-8 byte in kit markdown: check-nul-bytes looks only for NUL and markdown readers decode lossily to U+FFFD. A 29-05 perl -pi -e rewrite silently wrote a raw latin-1 0xA7 into seven files",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T17:27:20.286Z",
    "resolved_at": null
  },
  {
    "id": 25,
    "kind": "todo",
    "phase": "29",
    "file": "agent-factory/workflows/18-context-compaction.md",
    "line": null,
    "description": "WP-09 lowercase workflow display names remain: 'context compaction', 'context read/write', 'task claim + schedule'. Renaming changes a DERIVED set (listWorkflowDisplayNames -> TECHNICAL_NAMES -> two-sided pinned count), not prose, so no style plan owned it",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T17:27:20.349Z",
    "resolved_at": null
  },
  {
    "id": 26,
    "kind": "deviation",
    "phase": "29",
    "file": ".planning/phases/29-controlled-language-voice-guard-rebuild/29-19-PLAN.md",
    "line": null,
    "description": "Acceptance criterion 'grep -c ^overrides: returns 1' is unsatisfiable: the report's own drafted block inside a yaml fence carries a column-0 overrides: line. Substituted with a frontmatter-region-scoped count (1 key, 1 fenced prose copy).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T10:04:44.790Z",
    "resolved_at": null
  },
  {
    "id": 27,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-imperative-lexicon.ts",
    "line": null,
    "description": "Residual 4: a four-space-indented code block donates step bullets; the one fence authority cannot see it. Fail-closed, empty input set today, promote trigger recorded.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T16:49:50.314Z",
    "resolved_at": null
  },
  {
    "id": 28,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-imperative-lexicon.ts",
    "line": 541,
    "description": "The derived locator-site scan reports ONE member (HEADING_LINE), not the zero 29-24's acceptance criterion asserts; 29-25 must state an exemption rather than widen the classifier.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T16:49:50.376Z",
    "resolved_at": null
  },
  {
    "id": 29,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-banned-claims.ts",
    "line": null,
    "description": "V-29-32-01: a CLOSED-fence count-preserving compensating edit holds both published pins while swallowing a section into the safety exemption (0 live instances)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-16T00:29:11.216Z",
    "resolved_at": null
  },
  {
    "id": 30,
    "kind": "stub",
    "phase": "29",
    "file": "scripts/generate-catalog.ts",
    "line": 87,
    "description": "sectionBody bounds a '## ' section by fence-blind new RegExp lookahead — a third section-extent grammar (V-29-29-01, LANG-07)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-16T01:28:22.935Z",
    "resolved_at": null
  },
  {
    "id": 31,
    "kind": "stub",
    "phase": "29",
    "file": "scripts/generate-role-adapters.ts",
    "line": 127,
    "description": "sectionBody bounds a '## ' section by fence-blind new RegExp lookahead — a third section-extent grammar (V-29-29-01, LANG-07)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-16T01:28:22.998Z",
    "resolved_at": null
  },
  {
    "id": 32,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/generate-catalog.ts",
    "line": null,
    "description": "D-40-1: an empty-valued order: key reaches Number('')===0 and publishes workflow row 0 rather than refusing; behaviour preserved from the deleted grammar and disclosed, live reachability 0/19",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T11:25:31.417Z",
    "resolved_at": null
  },
  {
    "id": 33,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/frontmatter.test.ts",
    "line": null,
    "description": "D-40-2: the D-50 IN-05 local-grammar classifier reads comments as code; structural answer (codeLinesOfSource) declined in-plan because it is fail-open and wants its own decision",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T11:25:31.490Z",
    "resolved_at": null
  },
  {
    "id": 34,
    "kind": "unrun-verify",
    "phase": "29",
    "file": "scripts/check-banned-claims.ts",
    "line": null,
    "description": "LANG-04 hard-wrap residual: the co-occurrence window is a LINE, so a claim whose bare term and benefit verb are split across a hard wrap is not matched (measured in 29-41, both directions GREEN); 29-42 owns recording it",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T11:45:44.240Z",
    "resolved_at": null
  },
  {
    "id": 35,
    "kind": "skipped-test",
    "phase": "29",
    "file": "scripts/check-banned-claims.test.ts",
    "line": 387,
    "description": "findingCount .toBe(2) now 3 after the bare-term rule; deferred to 29-42 and NOT named by 29-41's gap contract map",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T11:45:44.304Z",
    "resolved_at": null
  },
  {
    "id": 36,
    "kind": "unrun-verify",
    "phase": "29",
    "file": "scripts/check-banned-claims.ts",
    "line": null,
    "description": "V-29-42-01 fail-OPEN: a claim split across a hard wrap is outside the same-line co-occurrence window; 1983 of 5898 corpus lines end mid-sentence, 0 live instances",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T12:22:09.740Z",
    "resolved_at": null
  },
  {
    "id": 37,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-banned-claims.ts",
    "line": null,
    "description": "V-29-42-02 fail-closed: a markdown table row puts marker and bare term on one physical line, 0 live",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T12:22:09.799Z",
    "resolved_at": null
  },
  {
    "id": 38,
    "kind": "deviation",
    "phase": "29",
    "file": "agent-factory/writing-profile.md",
    "line": null,
    "description": "V-29-42-03 fail-closed: the exempt document states the gate proves no pinned literal appears outside the section; live-false at 1 (incident-responder.md:29:103). Not edited - an edit moves BANNED_CLAIM_EXEMPT_EXTENT and needs a D-04 row",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T12:22:09.858Z",
    "resolved_at": null
  },
  {
    "id": 39,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-banned-claims.ts",
    "line": null,
    "description": "V-29-42-04 fail-closed: a benefit marker whose only occurrence on the line is inside an HTML comment or a link target satisfies co-occurrence, 0 live",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T12:22:09.918Z",
    "resolved_at": null
  },
  {
    "id": 40,
    "kind": "deviation",
    "phase": "29",
    "file": "CHANGELOG.md",
    "line": 67,
    "description": "sharper-per-token survives at CHANGELOG.md:67 — outside BANNED_CLAIM_LITERALS and green by the current prohibition, but arguably a token-economy win claim of the family the token-economy group holds. Fail-open, 1 live, escalated by 29-43 rather than absorbed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T16:41:32.934Z",
    "resolved_at": null
  },
  {
    "id": 41,
    "kind": "deviation",
    "phase": "29",
    "file": "docs/audit/29-style-dispositions/29-12.md",
    "line": null,
    "description": "29-44 R1: 30 disposition rows carry a code-span file cell and can never match rowMatches() in check-diff-disposition.ts (bare-path comparison, no backtick stripping) — fail-closed, 30 live",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T17:16:02.517Z",
    "resolved_at": null
  },
  {
    "id": 42,
    "kind": "unrun-verify",
    "phase": "29",
    "file": "CHANGELOG.md",
    "line": 67,
    "description": "29-44 R2 (carried from 29-43): 'sharper-per-token' is outside BANNED_CLAIM_LITERALS and green by the current prohibition — fail-open, 1 live, unmoved by 29-44",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T17:16:02.578Z",
    "resolved_at": null
  },
  {
    "id": 43,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-nul-bytes.ts",
    "line": 120,
    "description": "The module header claimed git's binary heuristic is NUL-based. Measured false in round 6: git reports w/-text for 0x00/0x0b/0x0d/0x1f/0x7f and w/lf for 0x08/0x1b. Corrected in place and the cross-check arms re-anchored; recorded because a false claim in a safety module's header is what a later reader reasons from.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T17:39:12.706Z",
    "resolved_at": null
  },
  {
    "id": 44,
    "kind": "unmet-truth",
    "phase": "29",
    "file": "scripts/check-diff-disposition.ts",
    "line": null,
    "description": "rowMatches() compares row.file against a bare path with NO backtick stripping, so a disposition row whose file cell is a code span can never match. 30 such rows live, all in docs/audit/29-style-dispositions/29-12.md. Fail-closed. Carried from 29-44, unmoved by this plan (out of files_modified).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T17:39:12.767Z",
    "resolved_at": null
  },
  {
    "id": 45,
    "kind": "unmet-truth",
    "phase": "29",
    "file": "CHANGELOG.md",
    "line": 67,
    "description": "Reads 'sharper-per-token' — a token-economy claim outside BANNED_CLAIM_LITERALS, so the gate does not flag it. Fail-open, 1 live, re-confirmed at HEAD by this plan. Carried from 29-43, unmoved.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T17:39:12.831Z",
    "resolved_at": null
  },
  {
    "id": 46,
    "kind": "unmet-truth",
    "phase": "29",
    "file": "scripts/generate-catalog.ts",
    "line": null,
    "description": "the workflow sort's 'unique — no tie-break needed' claim is verified (orders 0..18, 19 distinct) but no mechanism reds if two workflows ever declare the same order; fail-open, live count 0",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T18:02:44.779Z",
    "resolved_at": null
  },
  {
    "id": 47,
    "kind": "deviation",
    "phase": "29",
    "file": ".planning/phases/29-controlled-language-voice-guard-rebuild/29-46-PLAN.md",
    "line": null,
    "description": "acceptance grep 0*15 is a substring pattern not a cardinality predicate; it over-matched a document identifier and forced an edit the same plan forbids. Fail-closed, live count 0",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T18:02:44.839Z",
    "resolved_at": null
  },
  {
    "id": 48,
    "kind": "deviation",
    "phase": "29",
    "file": "docs/audit/29-round6-residuals.md",
    "line": null,
    "description": "V-29-47-01: the in-source record of V-29-42-03 at scripts/check-banned-claims.ts:645-667 is false on five counts (count 0 not live-false; 82-document corpus is 115; cites a rephrased address; cites a header wording that exists only in its own citation; describes conditional members that are 0) and is byte-unchanged across all 16 commits of round 6",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T18:35:39.804Z",
    "resolved_at": null
  },
  {
    "id": 49,
    "kind": "deviation",
    "phase": "29",
    "file": "docs/audit/29-round6-residuals.md",
    "line": null,
    "description": "V-29-47-02: the sole exemption carve-out is unbounded at the bottom — endBefore === lines.length, so anything appended to agent-factory/writing-profile.md lands inside it, backstopped only by two pins whose own refusal text instructs the author to move them",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T18:35:39.873Z",
    "resolved_at": null
  },
  {
    "id": 50,
    "kind": "deviation",
    "phase": "29",
    "file": "docs/audit/29-round6-residuals.md",
    "line": null,
    "description": "V-29-47-03: the exemption region's POSITION is pinned by nothing — a rigid translation (a heading inserted above it) moves the region with both pins unmoved and the gate at exit 0",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T18:35:39.936Z",
    "resolved_at": null
  },
  {
    "id": 51,
    "kind": "deviation",
    "phase": "29",
    "file": "docs/audit/29-round6-residuals.md",
    "line": null,
    "description": "V-29-47-04: the surviving enumeration BANNED_CLAIM_LITERALS (22 members, 3 groups) is FAIL-OPEN — five real claims written with none of its members all pass at exit 0, including a conformance claim and a token-economy claim",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T18:35:40.003Z",
    "resolved_at": null
  },
  {
    "id": 52,
    "kind": "deviation",
    "phase": "29",
    "file": "docs/audit/29-round6-residuals.md",
    "line": null,
    "description": "V-29-47-06: .github/workflows/ci.yml:221 and :321 describe both gates this round widened at their PRE-widening scope (82 documents vs 115; NUL-only vs the whole control-byte class); the file is byte-unchanged all round and is outside every markdown scan by construction",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T18:35:40.068Z",
    "resolved_at": null
  },
  {
    "id": 53,
    "kind": "deviation",
    "phase": "29",
    "file": ".planning/phases/29-controlled-language-voice-guard-rebuild/29-48-SUMMARY.md",
    "line": null,
    "description": "29-48 tracer feedback gate run as an automated end-to-end re-verify rather than a checkpoint:human-verify — the tracer's <verify> is entirely automated CLI greps, which checkpoints.md forbids asking a human to run",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T21:03:21.208Z",
    "resolved_at": null
  },
  {
    "id": 54,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-nul-bytes.ts",
    "line": null,
    "description": "V-29-50-01 the unmeasured-external-assertion CLASS stays OPEN: five prose sites asserting git classifier behaviour were corrected in plan 29-50, but nothing detects an unmeasured claim about an external tool",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T21:42:53.501Z",
    "resolved_at": null
  },
  {
    "id": 55,
    "kind": "unrun-verify",
    "phase": "29",
    "file": "scripts/check-nul-bytes.test.ts",
    "line": null,
    "description": "V-29-50-02 the EISDIR gitlink arm is exercised through an ordinary directory, not through a real initialised submodule fixture; the errno is identical but the submodule path itself is unwitnessed",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T21:42:53.564Z",
    "resolved_at": null
  },
  {
    "id": 56,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-foundation-guards.test.ts",
    "line": null,
    "description": "V-29-51-01: the LANG-07 owner classifier's alias closure is module-wide, scope-blind and matches \\bNAME\\b as TEXT against a declaration's right-hand side, so a local named 'a' matches inside [a-z_] in an unrelated regex literal and drags that regex into the derived heading-recogniser set. Measured: the derived name set for audit-model.ts went 26 -> 44 and CLAIM_META_RE became a false applied site. Worked around by renaming the local; the classifier is unfixed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T22:22:11.284Z",
    "resolved_at": null
  },
  {
    "id": 57,
    "kind": "unmet-truth",
    "phase": "29",
    "file": "docs/audit/28-claim-registry.md",
    "line": null,
    "description": "V-29-51-02: the registry's advisory 'line' field disagrees with the anchor's measured position on 19 of 41 anchored rows, by up to 80 lines; three of the four agent-factory/writing-profile.md rows are wrong. Measured through the anchored-block authority, not corrected — the field is documented as advisory and unenforced.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T22:22:11.344Z",
    "resolved_at": null
  },
  {
    "id": 58,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-banned-claims.ts",
    "line": null,
    "description": "V-29-53-01: the canonical-form assertion fires on any decoded string whose bytes differ from the raw text, including a legitimately escaped non-ASCII character (0 live refusals today)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T08:46:53.835Z",
    "resolved_at": null
  },
  {
    "id": 59,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-banned-claims.ts",
    "line": null,
    "description": "V-29-53-02: the gate's effective walk bound is 2x MAX_WALK_ENTRIES because the imported public-docs corpus derivation carries its own budget at import time",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T08:46:53.898Z",
    "resolved_at": null
  },
  {
    "id": 60,
    "kind": "deviation",
    "phase": "29",
    "file": ".claude/settings.local.json",
    "line": null,
    "description": "V-29-53-03: untracked, so the widened coverage denominator does not reach it; carries asd-ste100.org inside a WebFetch permission",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T08:46:53.959Z",
    "resolved_at": null
  },
  {
    "id": 61,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/catalog-freshness.ts",
    "line": null,
    "description": "29-54 Rule 3: importing kit-model.js into the catalog generator rotted catalog-freshness.ts's hand-listed mirror import closure; the entry was added and proven load-bearing (removal -> ERR_MODULE_NOT_FOUND, exit 1). The list remains hand-maintained by a recorded trade.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T09:08:11.774Z",
    "resolved_at": null
  },
  {
    "id": 62,
    "kind": "deviation",
    "phase": "29",
    "file": ".planning/phases/29-controlled-language-voice-guard-rebuild",
    "line": null,
    "description": "29-55: five plans' published actuals.commits are SHORT (29-48 2 vs 3, 29-50 3 vs 4, 29-51 3 vs 4, 29-52 4 vs 5, 29-53 3 vs 5) and 29-54's self-check prose says 5 against its own frontmatter's 7. Cause is structural: a count of commits written INTO a SUMMARY that is then committed can never include the commits that carry it. Measured, not corrected.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T09:46:49.565Z",
    "resolved_at": null
  },
  {
    "id": 63,
    "kind": "deviation",
    "phase": "29",
    "file": "docs/audit/29-round7-residuals.md",
    "line": null,
    "description": "29-55: nine V- markers (V-29-29-02..05, V-29-30-01..04, plus the never-opened V-29-42-05) exist in the tree and have NEVER been rolled up by any of three residual registers. Found by DERIVING the marker set by grep (35 found) instead of taking round 6's table (18 listed). Named, deliberately not adopted.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T09:46:49.626Z",
    "resolved_at": null
  },
  {
    "id": 64,
    "kind": "unrun-verify",
    "phase": "29",
    "file": "scripts/check-nul-bytes.ts",
    "line": null,
    "description": "29-55: check-nul-bytes is INDETERMINATE on a git archive mirror — its set is git ls-files, so it refuses identically on the clean control and on a tampered mirror. It must not be counted in a per-mirror sibling-gate tally; round 6's sweep did not make this distinction.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T09:46:49.688Z",
    "resolved_at": null
  },
  {
    "id": 65,
    "kind": "deviation",
    "phase": "29",
    "file": ".planning/phases/29-controlled-language-voice-guard-rebuild/29-53-SUMMARY.md",
    "line": null,
    "description": "29-55: 29-53's narrative class enumeration is one short in two cells (tracked *.json 37 vs 38; scripts/** 18 vs 19), measured at its own commit and at HEAD. The MECHANICAL equality is derived, floored two-sided and green — only the hand-written explanation is short.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T09:46:49.753Z",
    "resolved_at": null
  },
  {
    "id": 66,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-banned-claims.ts",
    "line": 2120,
    "description": "Plan 29-56 Rule 3: the in-source D-55 note named BANNED_CLAIM_SCAN_COUNT, moving the pin's grep -c from 6 to 7; reworded to identify the constant by role",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T15:35:03.799Z",
    "resolved_at": null
  },
  {
    "id": 67,
    "kind": "deviation",
    "phase": "29",
    "file": "scripts/check-banned-claims.test.ts",
    "line": 4160,
    "description": "Plan 29-56 Rule 1: the SOURCE-SHAPE docblock assertion was defeated by a hard wrap; one declared comment-block normalization added, published-header assertion left byte-exact",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T15:35:03.866Z",
    "resolved_at": null
  },
  {
    "id": 68,
    "kind": "unrun-verify",
    "phase": "29",
    "file": "scripts/check-banned-claims.ts",
    "line": 89,
    "description": "V-29-57-01 — hard-wrap axis: a pinned multi-word literal split across a line boundary is not matched (FAIL-OPEN, 11 of 22 members reachable, 0 live). Remedy declined this round by D-56; disclosed in docs/audit/29-round8-residuals.md §4",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T15:54:37.843Z",
    "resolved_at": null
  },
  {
    "id": 69,
    "kind": "unrun-verify",
    "phase": "29",
    "file": "agent-factory/writing-profile.md",
    "line": 264,
    "description": "V-29-58-01 — enumeration axis: a conformance claim written without any of the 22 pinned literals is not matched (FAIL-OPEN; live count UNKNOWN - verify BY CONSTRUCTION, not 0). No mechanical remedy exists; compensating control is the per-round hand disposition of all 13 derived claim sites. Id opened by plan 29-58 in docs/audit/29-round8-residuals.md §2.4 after deriving that no register had ever assigned one",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T16:22:40.100Z",
    "resolved_at": null
  },
  {
    "id": 70,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-tiers.ts",
    "line": null,
    "description": "ROLE_COUNT cardinality check relocated out of resolveModels into roleCorpusCardinalityRefusal — deviates from plan 29.1-01 Task 2's written behavior block; needs reviewer sign-off (SUMMARY coverage item D5)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-19T08:15:05.155Z",
    "resolved_at": null
  },
  {
    "id": 71,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/generate-role-adapters.ts",
    "line": null,
    "description": "Plan 29.1-03 acceptance criterion predicts a filesystem RED when the resolution moves into render(); measured GREEN (adapters.map materializes before the write loop). Equivalent proof taken in the WRITE loop instead — reviewer to confirm the substitution discharges the criterion (coverage item D17)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-19T09:43:42.160Z",
    "resolved_at": null
  },
  {
    "id": 72,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-dial-consistency.test.ts",
    "line": null,
    "description": "29.1-10: the oracle pins ONE authority sentence but does not forbid a SECOND, contradicting sentence added elsewhere in the same document; compensating control is the negative grep recorded in 29.1-10-SUMMARY.md",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T09:01:51.475Z",
    "resolved_at": null
  },
  {
    "id": 73,
    "kind": "deviation",
    "phase": "29.1",
    "file": "agent-factory/packaging/subagent.frontmatter.md",
    "line": null,
    "description": "Plan 29.1-11 must-have 'both shipped documents name both configuration locations' is NOT met as written: check-kit-refs Assertion 1 (D-08.1) forbids agent-factory/config/ refs in kit prose, so the packaging authority names the user-facing location plus the location COUNT and points at the config reference for the rule",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T09:31:47.536Z",
    "resolved_at": null
  },
  {
    "id": 74,
    "kind": "deviation",
    "phase": "29.1",
    "file": ".planning/phases/29.1-per-role-model-assignment/29.1-14-SUMMARY.md",
    "line": null,
    "description": "Plan 29.1-14 acceptance criterion 4 narrowed to what was measured: on the appended-step mutation the OLD pin reds on its byte-offset ordering half (membership half stayed green). Composite mutation 3b constructed where the old pin is green on all four assertions.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T14:46:20.977Z",
    "resolved_at": null
  },
  {
    "id": 75,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-tiers.ts",
    "line": null,
    "description": "29.1-15 deviation 3: the deleted symbol roleCorpusCardinalityRefusal is deliberately NOT named in the docstring that records its deletion, to satisfy the plan's zero-grep criterion. Residual: a reader who meets the symbol on an older host's committed twin and greps this tree finds nothing in source; the name is in git history and the 29.1-15 SUMMARY.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T15:12:08.712Z",
    "resolved_at": null
  },
  {
    "id": 76,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-dial-consistency.test.ts",
    "line": null,
    "description": "29.1-16 acceptance criterion NOT satisfied as written: the plan's basename-only paraphrase cannot red the derived case, because the second candidate's basename is a substring of the first candidate. Partitioned by discrimination instead; measurement recorded in 29.1-16-SUMMARY.md Deviation 1.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T15:30:14.125Z",
    "resolved_at": null
  },
  {
    "id": 77,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/check-kit-refs.test.ts",
    "line": null,
    "description": "29.1-17 acceptance criterion NOT satisfied as written: grep -c 'const SCAN' scripts/check-kit-refs.test.ts measures 1, not 0. The surviving hit is the extractor's locator string, which must spell the gate's declaration verbatim to find it; splitting the literal to make the grep return zero was rejected. Anchored substitutes recorded: grep -cE '^const SCAN = ' -> 0 and grep -c '\"agent-factory/checklists\"' -> 0. See 29.1-17-SUMMARY.md Deviation 1.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T15:54:27.892Z",
    "resolved_at": null
  },
  {
    "id": 78,
    "kind": "deviation",
    "phase": "29.1",
    "file": ".planning/REQUIREMENTS.md",
    "line": null,
    "description": "29.1-17: the requirements verb flipped MODEL-05 from Gaps Found to Complete via the shared-ID gate; the flip was REVERTED because MODEL-05 is the requirement round-2 verification regressed and no verification has run since. The row awaits round-3 verification. See 29.1-17-SUMMARY.md Deviation 5.",
    "status": "fixed",
    "reason": "29.1-21: stated condition MET and MEASURED, not assumed. The condition was that a verification round run on MODEL-05. Round 3 ran, and its requirement_determinations block reads: MODEL-05: \"Gaps Found -> COMPLETE. The regression round 2 recorded (R2-CR-01) is closed, and the fix DISCRIMINATES ... Every clause of MODEL-05 own text was additionally re-proven behaviourally (four planted mutations, all RED by name).\" The flip is COMMITTED at d821e19, and both lines were read from `git show HEAD:.planning/REQUIREMENTS.md` BEFORE this row was closed: line 94 reads \"- [x] **MODEL-05**: An unknown, malformed, or absent model value is **fail-closed to `inherit`** - never to a pinned tier - and a guard asserts the emitted model of all 17 adapters equals the resolved config, derived rather than compared against a hand-listed expectation.\" and traceability line 194 reads \"| MODEL-05 | Phase 29.1 | Complete |\".",
    "recorded_at": "2026-08-20T15:54:27.962Z",
    "resolved_at": "2026-08-20T20:47:15.691Z"
  },
  {
    "id": 79,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/check-public-docs-vocabulary.ts",
    "line": 32,
    "description": "29.1-17: a fourth record adjacent to the scan widening reads 'that set is byte-unchanged' about check-kit-refs's SCAN. In context it is scoped to that gate's own Phase-27 change and remains true; out of context it could be read as a standing claim, and SCAN is now one member wider. Deliberately NOT edited (outside this plan's declared files). See 29.1-17-SUMMARY.md Deviation 4.",
    "status": "fixed",
    "reason": "29.1-21: stated condition MET. The condition was a RULING on whether the clause at scripts/check-public-docs-vocabulary.ts:32 is a standing claim needing correction. The ruling, from the user orchestrator and recorded verbatim in 29.1-21-PLAN.md: \"The ruling is in: it is in scope and it is fixed here.\" The clause is now scoped to what this gate own Phase-27 change did, with the ruling and its source named in the note itself; the superseded wording is DESCRIBED rather than reproduced, so `grep -c` for it over that file returns 0, and `node scripts/check-public-docs-vocabulary.js` exits 0. The D-08 contract half of the sentence was left alone because it is still true: the widening added a shipped-kit directory, not a repo-wide grep.",
    "recorded_at": "2026-08-20T15:54:28.031Z",
    "resolved_at": "2026-08-20T20:48:00.429Z"
  },
  {
    "id": 80,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/check-foundation-guards.test.ts",
    "line": null,
    "description": "29.1-19 residual, AMENDED BY PLAN 29.1-24 BECAUSE THE ROW ITSELF WAS MEASURED WRONG. WHAT THE ROW SAID: (r-class-prefix) compares CANONICAL SOURCE SPELLINGS across a derived member set rather than running the members' readers, so a member spelling both the right-bound marker and the slice base canonically while computing something else satisfies every assertion in it; direction FAIL-OPEN; and — THE CLAUSE THAT WAS MEASURED FALSE — bounded for today's two members by their own synthetic-input bound proofs, (r-bound-synthetic) and Case 8b. THAT MITIGATION DID NOT EXIST. Round 4 falsified it directly: (r-bound-synthetic)'s negative control builds its own inline slice from the SAME base as the reader, and its effect assertion .not.toContain(APPENDED_STEP_NAME) is still satisfied by a base-shifted read, so neither bound proof can see a base shift. THE ROW ALSO UNDERSTATED THE HOLE by framing it as a HYPOTHETICAL future member. For the two members that existed, requirement 1 was unconditionally satisfied for BOTH by their own const STEP_MARKER declarations and requirement 2 unconditionally satisfied for check-foundation-guards.test.ts by its own const UBUNTU_BLOCK_SLICE_BASE_SOURCE declaration — the constant that STATED the requirement was the text the requirement searched for. Measured: the exact R3-IN-03 divergence applied on a hermetic mirror returned 4 failed / 260 passed of 264, byte-for-byte the unmutated mirror's failure set. The false clause is REPLACED here rather than softened, because a ledger row naming a mitigation that does not exist is more dangerous than no row at all.",
    "status": "fixed",
    "reason": "29.1-24: CLOSED STRUCTURALLY, and the replacement mitigation is named because it exists. There is now ONE implementation of where the ubuntu gate block is and what it runs — scripts/ci-workflow.testkit.ts — and both readers import it, so 'this class reads one region' is true by construction rather than certified by a text scan. (r-class-prefix) is DELETED, not repaired: round 4's suggested cheap repair (strip const declaration lines before the containment tests) was measured against this tree and REDS A CORRECT TREE, because after stripping, the right-bound marker's canonical spelling occurs ZERO times in BOTH members. It is replaced by (r-class-authority), which derives membership from the IMPORT, pins it two-sided at 2, closes the class with a negative over all 49 non-member scripts/*.test.ts files, and asserts by a derived scan over 147 files that no non-test file consumes the authority. The BASE is now proven by BEHAVIOUR in (r-base-discriminating), which computes the authority's region beside an inline control region built from the bare locator index with the same right bound. Measured on a hermetic mirror at 98a1882: the same divergence that produced a byte-identical failure set in round 4 now moves it from 4 failed / 275 passed of 279 to 5 failed / 274 passed of 279, with (r-base-discriminating) named. Four of its arms red independently. RESIDUAL THAT ACTUALLY REMAINS, stated with its direction: a member that imports the authority and then computes something else entirely — a second private slice under another variable, in a branch nothing reaches — still satisfies the import-derived membership. That direction is FAIL-OPEN and strictly NARROWER than what this row originally disclosed, because there is no longer a second implementation for such a slice to be built from, but it is not zero.",
    "recorded_at": "2026-08-20T19:55:57.940Z",
    "resolved_at": "2026-08-21T18:30:00.000Z"
  },
  {
    "id": 81,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/check-foundation-guards.test.ts",
    "line": null,
    "description": "29.1-19: (o-one-consumer)'s assembled-pattern arm recognises ONE SPELLING of the regex-escape idiom — the bytes this tree writes verbatim in audit-prepass.ts, check-foundation-guards.ts and voice-model.ts — and asks it of a single comment-stripped LINE. A differently spelled escape, or an assembly split across lines, is still not counted and therefore not disclosed by the residual set the case publishes. Direction: FAIL-OPEN.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T20:00:49.350Z",
    "resolved_at": null
  },
  {
    "id": 82,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-dial-consistency.test.ts",
    "line": null,
    "description": "29.1-19: the third tautology site was closed OUTSIDE the plan's declared files_modified list. The plan's must_haves require three deleted tautologies and three discriminating bound proofs, and only two sites existed in the two declared test files; R3-WR-01 names this file as the third. Recorded so the scope expansion is visible rather than inferred from the diff.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T20:03:39.929Z",
    "resolved_at": null
  },
  {
    "id": 83,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-dial-consistency.test.ts",
    "line": null,
    "description": "29.1-20: sectionCitationsIn recognises ONE citation grammar — an inline code span whose content opens with the third-level heading marker. A cross-document section citation written as bare prose without inline code delimiters, or one naming a heading at any level other than third, is not derived, so it is neither pinned by the membership assertion nor counted by the two-sided cardinality pin. Direction: FAIL-OPEN — such a citation ships unpinned and its target may be renamed silently.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T20:24:49.779Z",
    "resolved_at": null
  },
  {
    "id": 84,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-dial-consistency.test.ts",
    "line": null,
    "description": "29.1-20: the synthetic bound case's INPUT is derived from the reader under test — the truncation calls modelBulletRegion() so that the appended bullet is the only candidate right bound. A mutation to the reader therefore changes the input as well as the subject. Measured: dropping the reader's bullet arm reds this case on its own input PREMISE (expected 6 to be 1) rather than on the bound-effect assertion; the bound-effect assertion itself is measured red only by the wholesale bound deletion. Direction: FAIL-CLOSED — the case refuses to measure on an input it cannot vouch for rather than measuring wrongly — but the premise, not the effect, is what catches an arm-level mutation.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T20:24:49.851Z",
    "resolved_at": null
  },
  {
    "id": 85,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-dial-consistency.test.ts",
    "line": null,
    "description": "29.1-20: this plan's Task 2 declared the deletion of two containment assertions that plan 29.1-19 had ALREADY deleted as its Rule-2 scope addition (ledger row 82). The plan's prescribed pre-fix reproduction — delete the right bound and observe MEASURED GREEN — is therefore not reproducible on this tree: measured this session it REDS, 1 failed / 36 passed of 37. Recorded so a later reader does not read the absent green as an unrun step.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T20:24:49.921Z",
    "resolved_at": null
  },
  {
    "id": 86,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-tiers.ts",
    "line": null,
    "description": "29.1-21: the unknown-stem override REFUSAL reverses a documented design decision — the module argued the skip was correct for a caller resolving a mirror narrower than the corpus its overrides were read for. Measured that no such caller exists (both production sites hand readModelsConfig and resolveModels the SAME stems; the whole suite and all three live gates are green with the refusal), but the reversal is a contract change, not a bug fix. Direction: FAIL-CLOSED — a future caller that legitimately reads a wider corpus than it resolves is now refused by name rather than silently mis-resolved, which is loud and recoverable, but it IS refused.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T20:44:28.465Z",
    "resolved_at": null
  },
  {
    "id": 87,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-tiers.ts",
    "line": null,
    "description": "29.1-21: the three cases pinning the corrected anchored-reader docstring do NOT share one reddening mutation. Removing the line trim reds only the TAIL half (plus two pre-existing CR cases); the HEAD-preserve and ANCHOR cases stay green under it by construction, because they assert what the trim does NOT do. The second half of the claim is therefore pinned by the reader's behaviour rather than by a mutation of the mechanism it describes. Direction: FAIL-OPEN — a change that started trimming the value's HEAD (a widening to trim()) would red the head case, but no single mutation exercises all three, so the three are not one proof.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T20:44:40.110Z",
    "resolved_at": null
  },
  {
    "id": 88,
    "kind": "unrun-verify",
    "phase": "29.1",
    "file": "scripts/model-tiers.test.ts",
    "line": null,
    "description": "29.1-21: the shape corpus proving quoteValue total derives its denominator from typeof's eight-result codomain, which is a cover of PRIMITIVE shapes only. The two object sub-shapes that actually throw (a circular graph, a getter that throws mid-serialisation) are hand-added beyond that cover and are NOT counted by any derived denominator — typeof cannot distinguish them from a plain object. Direction: FAIL-OPEN — a third throwing object sub-shape nobody thought of is invisible to the cardinality assertion, which can only prove the corpus covers every typeof, never that it covers every way JSON.stringify can throw. AMENDED BY PLAN 29.1-23, restated against the corpus as WIDENED rather than the narrow one this row described. The corpus grew from 12 shapes to 13 and is now driven over the KEY position, the VALUE position and their 169-cell cross product, so the residual above is still true and is now true of a corpus driven over three axes instead of one. The thirteenth entry is an object whose string conversion throws, and it was added because the two axes fail under DIFFERENT operators: JSON.stringify throws on a throwing getter and returns cleanly on a throwing toString, while template-literal conversion does the exact opposite. Driven at the KEY position against the pre-fix build the 12-shape corpus therefore caught ONE of the two regressions the round-4 verifier reproduced and reported the other as safe. That is this row own fail-open shape found one level up: a derived denominator can cover every typeof result, but no denominator here covers every way a RENDERING OPERATOR can fail, and there are now two such operators in scope. Both denominators are pinned two-sided as of this plan and both pins were proven to discriminate against a co-edit the set-equality assertion passes over.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-20T20:44:40.187Z",
    "resolved_at": null
  },
  {
    "id": 89,
    "kind": "unrun-verify",
    "phase": "29.1",
    "file": "scripts/check-kit-refs.ts",
    "line": 323,
    "description": "WR-01 (round 4): the packaging-template literal entered ghLegal raw and walk()'s FILE branch pushed its scan entry raw, while both were compared against join()-spelled walk output. Closed in plan 29.1-22 by relKey(), the one path-spelling authority, applied at both sites. The PLATFORM half is corroborated, NOT executed: measured under path.win32 (raw literal agent-factory/packaging/subagent.frontmatter.md vs walk-shaped agent-factory\\packaging\\subagent.frontmatter.md) and pinned by a two-directional path.win32 unit case. No windows-latest CI leg exists in this repository yet (CAP-02, Phase 33), so nothing here has run on Windows.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T14:08:27.374Z",
    "resolved_at": null
  },
  {
    "id": 90,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/check-kit-refs.ts",
    "line": 239,
    "description": "29.1-22 terminator residual: CONFIG_REF_TERMINATOR declares where a named path ENDS, and the sentence-ending period is NOT a terminator. A legitimate future self-reference written WITHOUT surrounding delimiters and ending a sentence captures the trailing byte, yields the record factory.config.json. rather than factory.config.json, and is judged a stray. Direction: FAIL-CLOSED — such a mention is refused loudly and must be argued and counted, which the exemption's pinned cardinality already requires of any new mention. Every mention shipped today is backtick-delimited, so nothing on this tree is affected.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T14:13:13.493Z",
    "resolved_at": null
  },
  {
    "id": 91,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/frontmatter.ts",
    "line": null,
    "description": "PRE-EXISTING, found by plan 29.1-22, NOT caused by it and NOT fixed by it (outside this plan's declared scope). The double-quoted-scalar escape scanner produces a FALSE REFUSAL that is ORDER-DEPENDENT: within one double-quoted scalar, an escaped double quote occurring BEFORE an escaped backslash makes the later, valid escaped-backslash pair refuse by name, though both sequences are on the module's own allowlist and libyaml accepts the document. Reordering the same two sequences passes. Reproduced at pristine HEAD b08b25c in a clean worktree with a 20-byte synthetic item; the exact byte sequences are quoted in 29.1-22-SUMMARY.md, which renders them in a code fence rather than in a ledger cell. Live effect: scripts/frontmatter.test.ts 'D-49 false-red control' FAILS on this tree (1 failed, 2382 passed, 2 skipped, over 55 files), because .planning/phases/29.1-per-role-model-assignment/29.1-VERIFICATION-round4.md line 51 carries such a scalar in its gaps block. Direction: FAIL-CLOSED (a false red, never a bypass). Owner: unassigned, needs a plan of its own; the round-4 report was deliberately NOT rewritten, since annotating rather than rewriting a verifier's record is this repository's rule.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T14:13:13.562Z",
    "resolved_at": null
  },
  {
    "id": 92,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-tiers.ts",
    "line": null,
    "description": "29.1-23 KEY-rendering residual: a Map key that is not representable reaches the ONE quoting authority and is rendered the way that authority has always rendered a non-representable VALUE, because there is one authority and its handling of the three shapes JSON.stringify drops without throwing is deliberate and predates this plan. Measured at 9ae707e: a Symbol key renders as a bare undefined, a function key as a bare undefined, an object whose toString throws and a plain object both render as an empty brace pair. So a refusal for a non-representable key names the stem POSITION and the covered set but does not identify the key, and two such keys can produce the same sentence. Direction: FAIL-CLOSED and strictly better than the alternative it replaced, which was a THROW out of the refusal path. Mitigating fact, asserted rather than claimed by the case a Symbol key is REFUSED and NAMED rather than crashing the sentence that rejects it: a legitimate STRING key spelled undefined renders WITH its quotation marks, so a rendered value and a dropped one are distinguishable in the message a caller reads. Whether the bare rendering is the best one for a reader is a wording judgement, not a predicate; it is pinned by that case so it cannot drift silently, and it is disclosed here rather than argued away.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T14:39:05.652Z",
    "resolved_at": null
  },
  {
    "id": 93,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-tiers.ts",
    "line": null,
    "description": "29.1-23 correction to this plan's own stated truth, recorded because the measurement contradicts it. The plan asserted that only the shapes which previously THREW change behaviour. Measured over the 13-shape corpus driven at the KEY position against the committed .js at a58036b and at 9ae707e: only 2 of 13 shapes threw; the other 11 RETURNED a refusal whose key rendering has CHANGED, because the key used to be rendered by template-literal conversion inside hand-written quotation marks and is now rendered by the serialiser. Every LEGAL key is unaffected and that half is proven, 127 refusal renderings diffed pre and post with an empty diff. The changed renderings are all ILLEGAL keys, all refused in both builds: a number key NaN moved from quote NaN quote to null, a BigInt key 1n from quote 1 quote to an angle-bracket description, an array key from quote opus quote to a bracketed JSON array, a plain object from quote object Object quote to its serialised form, a function key from its source text to a bare undefined. Direction: FAIL-CLOSED in every row, and the discrimination IMPROVED for the common shapes, since a number key 5 and the string key quote 5 quote used to render identically and no longer do. The two rows that read WORSE are the function key and the NaN key. No caller can reach any of these through readModelsConfig, which refuses a non-string role key before the resolver is called.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T14:39:18.078Z",
    "resolved_at": null
  },
  {
    "id": 94,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-tiers.test.ts",
    "line": null,
    "description": "29.1-23 one-spelling scan residual (WR-04 closed with its bound stated rather than left implicit). The scan now reads scripts/model-tiers.ts AND the committed scripts/model-tiers.js, derives a count for each and names the file in every failure message; proven to discriminate on the compiled side by planting a second spelling in the committed .js only, with the source untouched - the widened case reds naming model-tiers.js, and the NARROW case at 5ec040d passes the identical plant. The residual is the comment strip: it drops ONLY a line whose first non-space byte opens a comment, so a trailing comment on a code line and a block comment sharing a line with code are both scanned AS code. Direction: FAIL-CLOSED and one-directional - the count can be too HIGH and never too low, because the only text removed is text on a line that is entirely a comment, and a comment does not execute. A documented second spelling written in a trailing comment would therefore produce a FALSE RED. That bound is now stated in the assertion message itself rather than known only to the author.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T14:48:01.557Z",
    "resolved_at": null
  },
  {
    "id": 95,
    "kind": "unmet-truth",
    "phase": "29.1",
    "file": "scripts/model-tiers.ts",
    "line": null,
    "description": "29.1-23: resolveModels STILL THROWS on four input classes, so this module's totality claim - and plan 29.1-23's own first stated truth - is FALSE. Found by adversarial self-verification at plan close, not by any review. Measured across four committed builds from one script: a revoked Proxy at the VALUE position THREW at e9907f5, ad033f0, a58036b and HEAD; a revoked Proxy at the KEY position returned ok true at e9907f5 under the silent skip and has THROWN since ad033f0, HEAD included; a Map subclass whose iterator yields a non-array entry and a Map subclass whose iterator throws both THREW at all four builds. Two root causes. ONE: quoteValue is not total although its docstring says IT IS TOTAL - the describeShape call sits inside the catch block, outside the try, and Array.isArray is not total, throwing TypeError Cannot perform IsArray on a proxy that has been revoked. TWO: the override loop destructures each entry before any floor runs, and Floor 0b establishes instanceof Map and nothing more, so a Map SUBCLASS overriding Symbol.iterator escapes before a refusal exists to be returned. Direction: FAIL-CLOSED in every row - a throw is loud and no tier is silently applied - but it is the exact class this phase exists to close, because the module header promises a returned result so a degrading consumer need not write a catch. NOT FIXED HERE, deliberately: only root cause one is a small edit, root cause two needs defensive iteration, and closing one of two would leave the totality looking closed while remaining false, which is the one-more-spelling incrementalism this project's memory names as its repeated failure. The established remedy for an open-set totality here is D-59, hold it as CONTENT with a disclosed backstop. What IS achieved and measured: all 13 corpus shapes return at the KEY position, all 169 KEY-by-VALUE cells return, and both shapes the round-4 verifier reproduced return. Owner: unassigned, needs a plan of its own; also recorded in the phase deferred-items file.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T14:50:11.219Z",
    "resolved_at": null
  },
  {
    "id": 96,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/check-foundation-guards.test.ts",
    "line": null,
    "description": "29.1-24: THE NOT-SHARING-A-HELPER DISPOSITION IS REVERSED, in scripts/check-foundation-guards.test.ts AND scripts/skill-twins-freshness.test.ts. Both files carried a paragraph arguing that the ubuntu-block region reader was deliberately NOT shared, because sharing would mean either copying it (two authorities over one predicate) or promoting it into a production module that only tests consume (a shipped surface added for a test), and that the class was closed instead by a scan over canonical source spellings. TWO MEASUREMENTS FORCED THE REVERSAL. ONE: that scan was structurally incapable of failing for either member — the exact R3-IN-03 divergence applied on a hermetic mirror returned a failure set byte-for-byte identical to the unmutated baseline, because the constants that STATE its canonical spellings are declared in the very files it searches. TWO: round 4's suggested cheap repair, stripping const declaration lines before the containment tests, was measured against this tree and REDS A CORRECT TREE — after stripping, the right-bound marker canonical spelling occurs ZERO times in BOTH members. The original argument first horn was what the tree already had. Its second horn is answered by scripts/ci-workflow.testkit.ts, a module NO production script imports, asserted by a derived scan over 147 files in (r-class-authority) rather than claimed in prose. Both paragraphs are corrected in place and the superseded reasoning is DESCRIBED rather than deleted, per this repository annotate-do-not-rewrite rule. Direction: this row records a reversal, not a hole.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T15:30:49.404Z",
    "resolved_at": null
  },
  {
    "id": 97,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/ci-workflow.testkit.js",
    "line": null,
    "description": "29.1-24: THE BUILD-PARITY QUESTION FOR THE NEW COMMITTED TWIN, ANSWERED RATHER THAN LEFT FOR A LATER READER. The new module is a non-test scripts/*.ts, so tsconfig.json emits it and the committed .js is a tracked build output like any other. Nothing about the freshness or build-parity surface needed changing: npm run freshness exits 0 on the final tree and its compared set moved 49 to 50 paths, the one new path being scripts/ci-workflow.testkit.js. WHAT A LATER READER WOULD NOT EXPECT, MEASURED AND DISCLOSED: vitest resolves the ./ci-workflow.testkit.js import specifier to the COMMITTED .js, not to the .ts. Probed on a hermetic mirror — mutating the .js alone REDS (r-base-discriminating); mutating the .ts alone leaves it GREEN. So the authority these tests execute is the shipped build output, and a divergence introduced in the .ts alone is invisible to every case in this class. That is NOT unbounded: it is caught by npm run freshness, measured this session to exit 1 with STALE WORKING OUTPUT naming scripts/ci-workflow.testkit.js on exactly that mutation. Direction: FAIL-CLOSED, with the mitigation named because it was run rather than assumed — the specific failure mode row 80 existed to record. Adding the module also moved two derived corpus pins in the same commit: NON_TEST_MODULE_COUNT 50 to 51 and the scripts-scoped reader corpus 42 to 43, each re-derived independently rather than incremented.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T15:30:49.473Z",
    "resolved_at": null
  },
  {
    "id": 98,
    "kind": "deviation",
    "phase": "29.1",
    "file": ".planning/phases/29.1-per-role-model-assignment/29.1-24-PLAN.md",
    "line": null,
    "description": "29.1-24 plan deviations, recorded so the diff does not have to be read to find them. ONE: the plan splits the cutover (task 1) from the class-case replacement (task 2), but (r-class-prefix) derives its member set by scanning for the step-name PREFIX and the cutover removes that phrase from both members, so its vacuity floor fires the instant the second grammar is deleted (measured: expected 0 to be greater than 0, 50 .test.ts files scanned, none carrying the prefix). The case cannot survive the cutover in any form, and task 1 verify requires a green file, so (r-class-authority) landed in task 1 commit 56653ca rather than task 2. Only the commit boundary moved; every acceptance criterion of both tasks is satisfied. TWO: the case comment as written from the plan wording claimed assertions 3, 4 and 5 are the same fact measured three ways. Per-arm measurement under the base shift found arm 3 GREEN — it asserts a property of the CONTROL, which the mutation does not touch — so the comment was corrected to name four discriminating arms and to state arm 3 as a premise. Left uncorrected that would have been the wider-than-mechanism claim class this phase exists to close, inside the case written to close it. Direction: both are closed self-corrections, not open holes.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T15:40:24.243Z",
    "resolved_at": null
  },
  {
    "id": 99,
    "kind": "deviation",
    "phase": "29.1",
    "file": ".planning/phases/29.1-per-role-model-assignment/29.1-CONTEXT.md",
    "line": null,
    "description": "29.1-25: WR-03 was ruled record-decision-only (Olger Oeselg, 2026-08-21), so the reversal of D-06's unknown-key disposition is recorded as decision D-29.1-18 and NO CHANGELOG entry ships. The CHANGELOG half is OWED ON FIRST REACHABLE CHANGE, not closed: today the refusal branch is unreachable from production, so a consumer who reads only CHANGELOG.md does not meet this contract change. Direction: FAIL-OPEN for changelog consumers — nothing mechanical will remind anyone to add the entry when the branch first becomes reachable, because no gate reads reachability. Owner: whoever makes that branch reachable.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T19:10:12.591Z",
    "resolved_at": null
  },
  {
    "id": 100,
    "kind": "unrun-verify",
    "phase": "29.1",
    "file": ".planning/WINDOWS.md",
    "line": null,
    "description": "29.1-25: the four prose gates this plan ran (check-public-docs, check-banned-claims, check-claim-anchors, check-audit-register) plus check-kit-refs do NOT reach either surface this plan wrote. Measured, not assumed: BANNED_CLAIM_EXCLUDED_LOCATIONS in scripts/check-banned-claims.ts carries the segment class '**/.planning/' enforced at the walk, and check-kit-refs.ts states .planning/ intentionally absent from its scan. Direction: FAIL-OPEN — a banned claim, a cost sentence or caveman voice written into any .planning/ surface passes every gate in this repository green. Compensating measurement taken this plan: the gate's own 22 pinned literals were extracted and run directly over this plan's added text, 0 hits. That is a one-off reading, not a gate.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T19:10:12.664Z",
    "resolved_at": null
  },
  {
    "id": 101,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-tiers.ts",
    "line": null,
    "description": "29.1-25 reconciliation: round-4 review IN-01 is UNDISPOSITIONED — no plan in this round claimed it and no ledger row carried it until now. describeShape(null) renders the null-overrides refusal as 'an object rather than a Map', which is the worst possible rendering of the exact case Floor 0b exists to reject. Found by the derived reconciliation, not by a plan. Owner: unassigned.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T19:12:07.311Z",
    "resolved_at": null
  },
  {
    "id": 102,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/check-kit-refs.ts",
    "line": null,
    "description": "29.1-25 reconciliation: round-4 review IN-02 is UNDISPOSITIONED — join(CONFIG_SELF_REF_DIR) + sep is computed in two places (round-4 review cites :259 and :342), a second spelling for the first to drift from. Note plan 29.1-22 rewrote this module for CR-02/CR-03, so the cited line numbers may have moved and the finding needs re-locating before it is fixed. Owner: unassigned.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T19:12:07.380Z",
    "resolved_at": null
  },
  {
    "id": 103,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/check-kit-refs.ts",
    "line": null,
    "description": "29.1-25 reconciliation: round-4 review IN-03 is UNDISPOSITIONED — walk() follows symlinks with no cycle guard and admits them to the exemption's sibling set. Direction: a symlink can join the set the D-08.1 exemption is counted over. Distinct from round-3's R3-IN-03, which WAS closed by plan 29.1-24; the id collision across rounds is why this one was easy to miss. Owner: unassigned.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T19:12:07.447Z",
    "resolved_at": null
  },
  {
    "id": 104,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-dial-consistency.test.ts",
    "line": null,
    "description": "29.1-25 reconciliation: round-4 review IN-04 is UNDISPOSITIONED — sectionCitationsIn throws on a lone backtick-### sequence anywhere in the authority, an unbounded scope on an otherwise right default. Distinct from ledger row 83, which records the ONE-citation-grammar narrowness of the same function from plan 29.1-20. Owner: unassigned.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-21T19:12:07.516Z",
    "resolved_at": null
  },
  {
    "id": 105,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/check-kit-refs.ts",
    "line": null,
    "description": "ACCEPTED BY USER 2026-09-03 (D-29.1-19), not closed. Round-5 verifier Blocker 1: configReferencesIn truncates each record at the first CONFIG_REF_TERMINATOR byte and then decides membership over the TRUNCATED PREFIX, so a shorter string that IS a member admits a path out of the kit. Reproduced 9 for 9 across the entire declared terminator class at TRUE exit 0 with /../../../../etc/passwd shipping and all three published cardinalities as declared. The comment at :230-233 asserting this cannot happen is FALSIFIED by measurement. Compounds with row 103 (symlinks join the exemption sibling set), which defeats the code review's suggested remedy. Direction: FAIL-OPEN. Owner: unassigned — carried past phase close by user acceptance.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-03T16:12:49.409Z",
    "resolved_at": null
  },
  {
    "id": 106,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/check-foundation-guards.test.ts",
    "line": null,
    "description": "ACCEPTED BY USER 2026-09-03 (D-29.1-19), not closed. Round-5 verifier Blocker 2: the (r-class-authority) class claim is decided over a NON-RECURSIVE readdirSync of scripts/, so its denominator is 50 of the 56 tracked *.test.ts files. Invisible: hooks/ (2), install/ (1), scripts/e2e/ (1), scripts/runnable-ref/ (2). A genuine second reader with its own step-name literal and the bare-locator base, planted into scripts/runnable-ref/reference-check.test.ts, returns the byte-identical baseline 4 failed/261 passed; the identical plant at top level reds by name. This is round-3 R3-IN-03 re-opened one directory out by its own replacement. Direction: FAIL-OPEN. Remedy shape: derive the denominator from git ls-files, assert the count. Owner: unassigned — carried past phase close by user acceptance.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-03T16:13:02.191Z",
    "resolved_at": null
  },
  {
    "id": 107,
    "kind": "deviation",
    "phase": "29.1",
    "file": "scripts/model-tiers.ts",
    "line": null,
    "description": "ACCEPTED BY USER 2026-09-03 (D-29.1-19), not closed. Round-5 verifier Blocker 3: resolveModels throws on the STEMS argument on ordinary values — resolveModels([Symbol('a'),'b'],{preset:'none'}) and a throwing-toString stem both throw at Floor 2's .sort(), under both presets. Floors 2 (:1126) and 3b (:1167) still interpolate the stem raw. The defect of record is the FALSE COMPLETENESS CLAIM: ledger row 95 and deferred-items D-29.1-23-01 both publish a CLOSED enumeration of four classes, all on overrides, when a fifth exists on a different parameter. Behaviourally fail-closed. Remedy shape: state the residual as open-ended, or route stems through the same quoting authority. Owner: unassigned — carried past phase close by user acceptance.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-03T16:13:02.272Z",
    "resolved_at": null
  },
  {
    "id": 108,
    "kind": "unrun-verify",
    "phase": "29.2",
    "file": "install/install.ts",
    "line": null,
    "description": "UNKNOWN - verify (Windows): the install-time adapter render spawns the mirrored generator with process.execPath and cleans the mkdtemp mirror with rmSync({recursive,force,maxRetries:3}). Neither the spawn nor the retry-on-locked-handle cleanup was executed on Windows this session (no Windows runner locally); the windows-latest CI leg is the only place they will be observed. install.test.ts's two symlink plants already skip on win32 for want of SeCreateSymbolicLink, so the WR-02 representation claim over the reshaped fixture is POSIX-only too. Remedy: read the windows-latest leg before treating the render as proven cross-platform.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T09:27:20.480Z",
    "resolved_at": null
  },
  {
    "id": 109,
    "kind": "unrun-verify",
    "phase": "29.2",
    "file": "install/install.ts",
    "line": null,
    "description": "The --check doctor now opens a SECOND temp-mirror lifecycle (process.execPath spawn + rmSync maxRetries cleanup) on a path plan 01 never exercised. POSIX-observed only; the windows-latest CI leg is the only place it will be seen.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T10:07:13.479Z",
    "resolved_at": null
  },
  {
    "id": 110,
    "kind": "deviation",
    "phase": "29.2",
    "file": "install/install.ts",
    "line": null,
    "description": "OPEN DEFECT (found 29.2-03 red-team, deliberately NOT fixed): the --check doctor names a target adapter that is stale or absent, but never one the target holds that the kit no longer ships. A stray grugops-*.md left by an older kit is loaded by Claude Code, survives uninstall (removal is by derived name over the kit set), and the doctor reports ALL CHECKS PASSED over it. Reproduced 2026-09-04. Deciding which target files the doctor speaks for is a contract question spanning install and uninstall, not a local bug, so it is recorded rather than invented mid-execution.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T10:38:21.651Z",
    "resolved_at": null
  },
  {
    "id": 111,
    "kind": "deviation",
    "phase": "29.2",
    "file": "install/install.ts",
    "line": null,
    "description": "PRE-EXISTING, out of scope for 29.2 (found 29.2-03 red-team): materializeAdapter's WRITE half throws uncaught when the destination adapter is a directory (EISDIR) or unwritable (EACCES). The run dies at exit 1 with a stack trace part-way through the adapter loop, after some adapters were already reported. The skip-if-identical arm added in 29.2-02 does NOT hide a stale target in either case - both were probed and neither reports identical - so the invariant this phase added holds; the crash predates the phase (the write was previously unconditional and threw the same way).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T10:38:41.321Z",
    "resolved_at": null
  },
  {
    "id": 112,
    "kind": "deviation",
    "phase": "29.2",
    "file": "install/install.ts",
    "line": null,
    "description": "OBSERVATION, pre-existing (found 29.2-03 red-team): when the checkout's .claude/agents cannot be read or is empty, the --check doctor is loud (exit 1) but reports it as a kit-root cross-check disagreement reading 'adapter=<unset>', which names the target rather than the unreadable checkout. Not silent, so not a bypass; the sentence points a reader at the wrong root. targetAdapterFiles' null propagation predates 29.2.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T10:38:41.417Z",
    "resolved_at": null
  },
  {
    "id": 113,
    "kind": "unrun-verify",
    "phase": "29.2",
    "file": "install/install.test.ts",
    "line": null,
    "description": "Unreproduced transient: one full-suite run reported 2 failing test files (baseline is 1); the extra failure was not identified and did not reproduce in 3 subsequent full runs. UNKNOWN - verify.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T15:54:39.135Z",
    "resolved_at": null
  },
  {
    "id": 114,
    "kind": "deviation",
    "phase": "29.2",
    "file": "install/install.ts",
    "line": null,
    "description": "Sibling-prefix containment trap (…/target-backup beside …/target) is covered only by an adversarial probe, not by a CI regression case.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T15:54:39.225Z",
    "resolved_at": null
  },
  {
    "id": 115,
    "kind": "unrun-verify",
    "phase": "29.2",
    "file": "install/install.ts",
    "line": null,
    "description": "UNKNOWN - verify (Windows): the plan-29.2-04 destination-hazard guard adapterDestHazard() is proven on the POSIX legs only. Five of its seven cases in install/install.test.ts carry a process.platform === win32 early return because creating a symlink on Windows needs the SeCreateSymbolicLink privilege an unprivileged CI runner does not hold, so symlinkSync throws EPERM and the plant would assert nothing; the leaf, ancestor, dangling and union shapes are therefore unobserved on windows-latest. The containment arm adds its OWN Windows unknown beyond the missing privilege: realpathSync resolves drive letters, UNC paths and directory junctions, and a junction is NOT a symbolic link to lstat, so whether arm 1 or arm 2 refuses a junctioned agents directory - or whether either does - was not measured. Remedy: read the windows-latest leg, and probe a directory junction (mklink /J) there before treating the containment bound as cross-platform.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T18:33:31.118Z",
    "resolved_at": null
  },
  {
    "id": 116,
    "kind": "deviation",
    "phase": "30",
    "file": "agent-factory/config/factory.config.json",
    "line": null,
    "description": "shipped checkpoints posture not reconciled with the legacy autonomy: pr / quality.test_integrity: warn grade (V-30-02-01)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-05T13:31:29.522Z",
    "resolved_at": null
  },
  {
    "id": 117,
    "kind": "deviation",
    "phase": "30",
    "file": "agent-factory/config/factory.config.json",
    "line": null,
    "description": "test_integrity has two config cells (quality.test_integrity and checkpoints.test_integrity) until the legacy key is retired (V-30-02-02)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-05T13:31:29.626Z",
    "resolved_at": null
  },
  {
    "id": 118,
    "kind": "deviation",
    "phase": "30",
    "file": "scripts/check-banned-claims.test.ts",
    "line": null,
    "description": "Plan 30-07: two 'no scan member overlaps an exclusion entry' assertions now compare against an ENUMERATED, count-pinned admission set (docs/GUARANTEES.md), because D-17 places the render under an excluded segment class. Exclusion list and walk byte-unchanged; original predicate kept exact over walk-derived parts.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-05T16:47:59.587Z",
    "resolved_at": null
  },
  {
    "id": 119,
    "kind": "deviation",
    "phase": "30",
    "file": "scripts/checkpoints.ts",
    "line": null,
    "description": "V-30-11-16 (RA7-1, HIGH, ZERO KEYS, plan 30-11 surface A fence): PROTECTED_REF_RE matches only a whole-word ref, so +main / HEAD:main / feature:main escape it, and a git global flag removes the literal pattern in the same stroke. EXECUTED on real git 2.55.0: git -C sub push origin +main gave '+ 30c1a74...18db97f main -> main (forced update)' through the committed hook artifact with no grant, no env var and no human name. Fenced under D-22 at the four-round cap, not fixed. Reproduction and structural fix in docs/audit/30-redteam-surface-a.md.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T15:17:38.768Z",
    "resolved_at": null
  },
  {
    "id": 120,
    "kind": "deviation",
    "phase": "30",
    "file": "scripts/checkpoints.ts",
    "line": null,
    "description": "V-30-11-17 (RA7-2, HIGH, ZERO KEYS, plan 30-11 surface A fence): git config is deliverable through the ENVIRONMENT inside the same command text (GIT_CONFIG_COUNT, GIT_CONFIG_PARAMETERS, --config-env) while the alias arm reads only -c. EXECUTED: three consecutive forced updates of main on a real bare remote. Round 3's reviewer recorded --config-env as 'not a governed action' under probes that found nothing; that claim was measurably wrong and passed into round 4 unexamined. Fenced under D-22, not fixed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T15:17:38.863Z",
    "resolved_at": null
  },
  {
    "id": 121,
    "kind": "deviation",
    "phase": "30",
    "file": "scripts/checkpoints.ts",
    "line": null,
    "description": "V-30-11-18 (RA7-3, HIGH, ZERO KEYS, plan 30-11 surface A fence): a chained alias feeds gitPushIsGoverned a candidate list whose tail is an alias NAME rather than a refspec, so git -c alias.p=push -c alias.q=p q ALLOWS and EXECUTED a bare git push (eeb436f..fb57a1b main -> main) - the ambiguous form RA1-3 exists to deny. Subsumed by V-30-11-17's deletion. Fenced under D-22, not fixed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T15:17:38.949Z",
    "resolved_at": null
  },
  {
    "id": 122,
    "kind": "deviation",
    "phase": "30",
    "file": "scripts/checkpoints.ts",
    "line": null,
    "description": "V-30-11-19 (RA7-4, HIGH, ZERO KEYS, plan 30-11 surface A fence): the whitespace re-tokenization is gated behind 'w.isFlag continue', so a governed command inside a flag-shaped word reaches neither authority - env -S'kubectl -n prod apply -f x.yaml' and --message=\"deploy: helm -n prod upgrade\" ALLOW while -m 'deploy: helm -n prod upgrade' DENIES. EXECUTED against stub kubectl/gh binaries and against real git. Fenced under D-22, not fixed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T15:18:01.831Z",
    "resolved_at": null
  },
  {
    "id": 123,
    "kind": "deviation",
    "phase": "30",
    "file": "scripts/checkpoints.ts",
    "line": null,
    "description": "V-30-11-20 (RA7-5, HIGH, ZERO KEYS, plan 30-11 surface A fence): a COMBINED short flag defeats the force rule in BOTH authorities in the plainest spelling - git push -fu origin feature EXECUTED '+ 3202f43...9a0d4c3 feature -> feature (forced update)' on real git. FORCE_PUSH_FLAGS holds exact tokens and the literal pattern misses it too; the first finding in this log both authorities miss in an adjacent, unquoted, unwrapped form. Fenced under D-22, not fixed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T15:18:01.916Z",
    "resolved_at": null
  },
  {
    "id": 124,
    "kind": "deviation",
    "phase": "30",
    "file": "hooks/hook-entry.ts",
    "line": null,
    "description": "V-30-11-25 (RA8-3, HIGH, plan 30-11 surface A fence): DECIDER_MANIFEST is a plain object literal, so a decider name resolving to an Object.prototype key (hook-entry.js ../__proto__) SKIPS the manifest check entirely - Object.entries(Object.prototype) is [], the loop runs zero times and verification reports success having read zero files. A planted module writing the plaintext fd-3 token then yields exit 0 / 0 bytes = ALLOW at the host on 'git push --force origin main', with NO D-20 banner in the transcript. Reachability is repository-time (argv[2] comes from hooks.json) but it is an invisibility escalation: hooks.json still names hook-entry.js and every check stays green. Fenced under D-22, not fixed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T15:18:02.001Z",
    "resolved_at": null
  },
  {
    "id": 125,
    "kind": "deviation",
    "phase": "30",
    "file": "hooks/hook-entry.ts",
    "line": null,
    "description": "V-30-11-21/22 (RA7-6, RA7-7, plan 30-11 surface A fence): the wrapper's integrity is a REPOSITORY-TIME control, not a runtime one. RA7-6 - verifyDeciderClosure hashes then spawnSync loads, not atomic: a background writer flipping the file in that window measured 87/352 = 24.7% ALLOW against a 0/124 control. RA7-7 - NODE_OPTIONS=--require preloads arbitrary code inside the hook process before the wrapper's first line, wrapper ALLOW with the manifest still verifying, and the self-set vocabulary (three GRUGOPS names) refuses it nowhere and records it nowhere. This WIDENS V-30-08-01. Fenced under D-22, not fixed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T15:18:02.086Z",
    "resolved_at": null
  },
  {
    "id": 126,
    "kind": "unrun-verify",
    "phase": "30",
    "file": ".github/workflows/ci.yml",
    "line": null,
    "description": "V-30-11-23/24/29 (RA8-1, RA8-2, RA8-7, plan 30-11 surface A fence): gate reachability is not established. The derived runner set decides 'is this gate in CI' by raw-text ci.includes over ci.yml, so a COMMENTED-OUT step keeps it green (measured), and both arms filter on check- so a freshness gate is invisible to it. freshness:hook-manifest - the drift gate the whole wrapper-manifest fix rests on - appears in ci.yml ZERO times and in no test; the suite substitute is a whole-file containment test that cannot see a per-decider short manifest. 9 freshness scripts, 6 in CI, 3 at zero. Fenced under D-22, not fixed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T15:18:02.172Z",
    "resolved_at": null
  },
  {
    "id": 127,
    "kind": "deviation",
    "phase": "30",
    "file": "hooks/hook-entry.ts",
    "line": null,
    "description": "V-30-11-31 (plan 30-11 surface A fence): the documented 10 s wrapper-timeout justification at hooks/hook-entry.ts:259 is FALSE - '466 ms is the worst decision measured' was the worst SAMPLED, not the worst reachable. Measured: 'true ; ' x 250000 gives 10047 ms -> SIGTERM -> fail-closed DENY; git x 50000 gives 10046 ms -> DENY. The command model is quadratic in tool-name occurrences per segment, so the timeout is input-reachable. Direction is over-refusal so the guard still fails closed, but a documented invariant that is false is the class this log keeps catching. Annotated in place, not rewritten. Fenced under D-22, not fixed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T15:18:02.258Z",
    "resolved_at": null
  },
  {
    "id": 128,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/context-io.ts",
    "line": null,
    "description": "31-01 residual: appendNote writes without asking admit(), so a caller who bypasses the admission authority persists a stale-SHA artifact-ref. D-03 places the comparison in admit() and nowhere else, so a second check in appendNote is forbidden; pinned by a named case in scripts/context-io.test.ts",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T14:30:02.245Z",
    "resolved_at": null
  },
  {
    "id": 129,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/compactor.ts",
    "line": null,
    "description": "31-01 residual: composeThreadNote does not mirror composeNote's evidence-provenance lines, so an artifact-ref written to the thread tier composes without sha/gate_run/content_hash. Fail-closed (validate refuses it on promotion), but the raw-to-promoted byte comparison would differ",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T14:30:02.576Z",
    "resolved_at": null
  },
  {
    "id": 130,
    "kind": "unrun-verify",
    "phase": "31",
    "file": ".planning/phases/31-autonomous-manual-testing/31-01-SUMMARY.md",
    "line": null,
    "description": "31-01: npm run freshness:context passes VACUOUSLY - no .grugops/context tree is committed, so the acceptance criterion 'exits 0 with no task listed as stale' is satisfied over an empty denominator. The non-vacuous byte-stability evidence is the composed-fence and render cases in scripts/context-io.test.ts",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T14:30:02.861Z",
    "resolved_at": null
  },
  {
    "id": 131,
    "kind": "lint-warning",
    "phase": "31",
    "file": "scripts/freshness.test.ts",
    "line": null,
    "description": "31-01: 'Test 1 (control, real tree)' exceeds vitest's 5s default timeout on this machine; PRE-EXISTING - reproduced at the plan base commit 109d5c7 in a detached worktree. The npm run freshness gate itself is green",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T14:30:03.135Z",
    "resolved_at": null
  },
  {
    "id": 132,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/check-foundation-guards.ts",
    "line": null,
    "description": "guard_playwright_mcp_pin's sorted-walk determinism claim has no test: a differing directory-read order cannot be staged by this harness",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T15:26:04.015Z",
    "resolved_at": null
  },
  {
    "id": 133,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/chrome-lane-bar.test.ts",
    "line": null,
    "description": "D-09 structural bar: the emitVerdict( predicate is syntactic — an aliased reference (const f = emitVerdict; f(...)) or bracket access evades it; measured, disclosed in the file header, not closed",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T16:15:06.392Z",
    "resolved_at": null
  },
  {
    "id": 134,
    "kind": "deviation",
    "phase": "31",
    "file": "agent-factory/workflows/05-pr-quality-gate.md",
    "line": null,
    "description": "A repository holding *.uat.spec.ts files with quality.ui_e2e off never runs the UAT spec-integrity check; applicability is the dial's, so unchecked specs remain possible",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T16:15:06.479Z",
    "resolved_at": null
  },
  {
    "id": 135,
    "kind": "unrun-verify",
    "phase": "31",
    "file": "agent-factory/workflows/06-uat-pack.md",
    "line": null,
    "description": "UNKNOWN - verify: the attended Chrome lane was not exercised live on this host; only its documented absence-of-route was asserted structurally",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T16:15:06.567Z",
    "resolved_at": null
  },
  {
    "id": 136,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/context-io.ts",
    "line": null,
    "description": "Disclosed: one artifact-ref through admitAndAppend records TWO retained GOV-02 ledger events, because appendNote now admits the kind after the combiner already did. Asserted in scripts/context-io-writer-set.test.ts and scripts/context-io.test.ts rather than suppressed with a bypass token.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T07:33:14.050Z",
    "resolved_at": null
  },
  {
    "id": 137,
    "kind": "unrun-verify",
    "phase": "31",
    "file": "scripts/runnable-ref/fixtures/playwright-test.d.ts",
    "line": null,
    "description": "UNKNOWN - verify (assumption A1, T-31-32): the declared @playwright/test surface is a HAND TRANSCRIPTION at the kit's 1.62.1 pin, not the package. grugops ships zero runtime deps and its dev set is fixed by CLAUDE.md, so the package cannot be installed to derive it and nothing re-checks it against a released Playwright. Remedy: re-derive the surface wherever @playwright/test is actually installable before treating it as an API authority.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T08:16:01.122Z",
    "resolved_at": null
  },
  {
    "id": 138,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/runnable-ref/uat-spec-integrity.ts",
    "line": null,
    "description": "31-06 accepted residual (T-31-31): two callee shapes stay unrefused by arm (c) — an aliased binding (const t = test; t.skip(...)) and a member computed from a non-literal expression (test[name](...)). Resolving either needs a type checker, which this runnable deliberately does not ship (D-13). Exported as UNRESOLVABLE_CALLEE_RESIDUALS, quoted in browser-uat-recipe.md, and pinned by a test asserting both really do pass today.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T08:16:01.207Z",
    "resolved_at": null
  },
  {
    "id": 139,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/runnable-ref/uat-spec-integrity.ts",
    "line": null,
    "description": "31-REVIEW.md WR-01, surfaced by 31-06 and NOT closed by it: a .uat.spec.ts one directory outside a uat/ path segment is silently unchecked while the pass line still claims a full count. A real adjacent defect in the same file, outside the three verification gaps; named here so the next round has it rather than rediscovering it.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T08:16:01.288Z",
    "resolved_at": null
  },
  {
    "id": 140,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/check-foundation-guards.ts",
    "line": 3895,
    "description": "Every early-return branch in guardPlaywrightMcpPin calls fail() (which increments FAILS) and then increments FAILS again — the authority-refusal tally is doubled. Pre-existing across four branches; the 31-07 branch matches that shape per plan instruction. Affects only the trailing 'N CHECK(S) FAILED' count, never exit status.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T08:33:40.547Z",
    "resolved_at": null
  },
  {
    "id": 141,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/runnable-ref/uat-spec-integrity.ts",
    "line": null,
    "description": "31-08 R-19 (NEW, measured): a .uat.spec.ts under a uat segment inside tools/ is silently unchecked because tools is a member of SKIPPED_DIRECTORIES - tools/uat/dirty.uat.spec.ts carrying test.skip produced '0 findings over 1/1 uat specs checked', exit 0. Matters because install.ts materializes the checker itself into tools/grugops/. Skip-list arm of WR-01 (row 139); widening the walk's input boundary is a decision about the predicate's input, so it is named rather than changed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T08:57:54.742Z",
    "resolved_at": null
  },
  {
    "id": 142,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/check-foundation-guards.ts",
    "line": 3895,
    "description": "31-08 R-18 (NEW, measured): a CORRECT sentence-final pin mention planted as the authority ('The kit uses @playwright/mcp@0.0.78.') is captured as '0.0.78.' by WR-09's dot-admitting occurrence pattern and refused by 31-07's new shape assertion as 'not a concrete version - a floating specifier AT THE AUTHORITY'. Fail-closed in direction (exit 1), wrong in diagnosis. Fixing it means changing WR-09's occurrence grammar.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T08:57:54.831Z",
    "resolved_at": null
  },
  {
    "id": 143,
    "kind": "deviation",
    "phase": "31",
    "file": ".planning/phases/31-autonomous-manual-testing/31-05-PLAN.md",
    "line": null,
    "description": "31-08 R-20: the edge-probe partition is recorded as '8 = 4 authored + 4 surfaced' in 31-05-PLAN.md:132, 31-06-PLAN.md:127, 31-07-PLAN.md:118 and 31-08-PLAN.md; enumerated from the plans' own dispositions it is 5 authored + 3 surfaced. Total is 8 either way and no row is dropped, so the no-silent-drop property holds; the partition was copied forward across four documents without being re-derived. Recorded rather than corrected in place.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T08:57:54.919Z",
    "resolved_at": null
  },
  {
    "id": 144,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/context-io.ts",
    "line": null,
    "description": "Q9 residual: an in-process caller that can import scripts/context-io.js can mint its own green verdict via the exported emitVerdict and then admit a finding against it; measured in 31-09's red-team pass, strictly improved but not closed by 31-09",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T13:33:19.523Z",
    "resolved_at": null
  },
  {
    "id": 145,
    "kind": "unrun-verify",
    "phase": "31",
    "file": "docs/audit/29-style-dispositions/",
    "line": null,
    "description": "check:diff-disposition carries 75 undispositioned clauses owned by plans 31-05/31-06/31-08; measured at 78 before 31-09's prose commit on a hermetic clone at 012364d",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T13:33:19.617Z",
    "resolved_at": null
  },
  {
    "id": 146,
    "kind": "unmet-truth",
    "phase": "31",
    "file": "scripts/runnable-ref/uat-spec-integrity.ts",
    "line": null,
    "description": "31-11 (D-17): the ban rule's head and tail sets are hand-authored and completeness against the real Playwright modifier surface is asserted in ONE direction only; plan 31-12's reverse partition closes it",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T14:16:41.492Z",
    "resolved_at": null
  },
  {
    "id": 147,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/context-io-writer-set.test.ts",
    "line": null,
    "description": "31-10 deviation 1: the plan's 'probe union equals the WHOLE derived set' criterion rested on a premise measurement disproved — S1 is unreachable; the set is now partitioned into reachable + positively-proven-unreachable",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T14:55:00.772Z",
    "resolved_at": null
  },
  {
    "id": 148,
    "kind": "deviation",
    "phase": "31",
    "file": ".planning/config.json",
    "line": null,
    "description": "31-10 deviation 3: commits made on the protected default branch main without git.allow_default_branch_commits; set the flag if sequential-on-main is intended",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T14:55:00.854Z",
    "resolved_at": null
  },
  {
    "id": 149,
    "kind": "unmet-truth",
    "phase": "31",
    "file": "scripts/context-io.ts",
    "line": null,
    "description": "31-10 R-37: admit()'s own 'no YAML frontmatter fence' refusal is DEAD CODE behind validate()'s delegation — derived, driven and disclosed, not removed; a plan owning context-io.ts must decide whether it earns its place",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T14:55:00.934Z",
    "resolved_at": null
  },
  {
    "id": 150,
    "kind": "unrun-verify",
    "phase": "31",
    "file": "scripts/runnable-ref/fixtures/playwright-test.d.ts",
    "line": null,
    "description": "The reverse partition's denominator is a hand transcription: coverage of the DECLARED surface is established, coverage of the released @playwright/test package is not (R-07, UNKNOWN - verify)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T15:28:05.725Z",
    "resolved_at": null
  },
  {
    "id": 151,
    "kind": "unrun-verify",
    "phase": "31",
    "file": "scripts/runnable-ref/uat-spec-integrity.test.ts",
    "line": null,
    "description": "The surface walk is bounded at SURFACE_WALK_MAX_DEPTH = 4; a modifier family declared deeper than four segments is outside the measurement",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T15:28:05.815Z",
    "resolved_at": null
  },
  {
    "id": 152,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/runnable-ref/uat-spec-integrity.test.ts",
    "line": null,
    "description": "test.describe.configure carries the weakest disposition reason in the record: its retries option changes how a failed result is read, so a red-team round could reasonably reverse the disposition to a refusal",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T15:28:05.899Z",
    "resolved_at": null
  },
  {
    "id": 153,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/runnable-ref/uat-spec-integrity.ts",
    "line": null,
    "description": "D-18 (3): the rename/namespace canonicalisation is MODULE-SCOPED to @playwright/test — a rename arriving through a local fixture-extension re-export is still not canonicalised, a residual this plan's own change created",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T18:53:37.028Z",
    "resolved_at": null
  },
  {
    "id": 154,
    "kind": "deviation",
    "phase": "31",
    "file": "agent-factory/checklists/browser-uat-recipe.md",
    "line": null,
    "description": "The reverse partition's walk covers declared PROPERTY CHAINS only; it does not descend through a call signature's return type, so a call-link spelling such as test.info().skip is outside its denominator though the rule refuses it",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T18:53:37.116Z",
    "resolved_at": null
  },
  {
    "id": 155,
    "kind": "unrun-verify",
    "phase": "31",
    "file": "docs/audit/29-style-dispositions",
    "line": null,
    "description": "check:diff-disposition exits non-zero for 65 pre-existing undispositioned clauses in 05-pr-quality-gate.md, 06-uat-pack.md and 17-task-claim.md; 31-14 covered all 46 of its own clauses in 18-context-compaction.md (was 10 findings, now 0)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T20:07:37.086Z",
    "resolved_at": null
  },
  {
    "id": 156,
    "kind": "deviation",
    "phase": "31",
    "file": ".planning/config.json",
    "line": null,
    "description": "31-14 committed on the default branch main: branching_strategy is none, use_worktrees is false, and no git.allow_default_branch_commits override is recorded in config.json",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T20:07:37.170Z",
    "resolved_at": null
  },
  {
    "id": 157,
    "kind": "deviation",
    "phase": "31",
    "file": "scripts/check-platform-shapes.ts",
    "line": null,
    "description": "GOV-02 ledger position dropped from the platform shape corpus — a governance-dial guard fired correctly; criterion in deferred-items.md",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T13:42:53.284Z",
    "resolved_at": null
  },
  {
    "id": 158,
    "kind": "unrun-verify",
    "phase": "31",
    "file": "scripts/context-io.test.ts",
    "line": null,
    "description": "14 of 15 mkfifo call sites in test modules carry no platform guard, so the windows-latest vitest step is unreachable-green; measured from SOURCE on darwin, the Windows behaviour is UNKNOWN - verify",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T13:43:11.010Z",
    "resolved_at": null
  },
  {
    "id": 159,
    "kind": "deviation",
    "phase": "31",
    "file": "docs/audit/29-style-dispositions/31-29.md",
    "line": null,
    "description": "Two disposition rows pack multiple sentences into one after cell; rowMatches compares one normalized clause, so 5 clauses are covered by nothing while the rows read as work done",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T13:43:11.093Z",
    "resolved_at": null
  },
  {
    "id": 160,
    "kind": "unrun-verify",
    "phase": "31",
    "file": ".github/workflows/ci.yml",
    "line": null,
    "description": "R-03/R-31-19-03: the two new Windows-scoped shape steps are ENCODED but not observed — every measurement in 31-30 was taken on darwin and the Windows reading is UNKNOWN - verify",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T13:43:11.171Z",
    "resolved_at": null
  },
  {
    "id": 161,
    "kind": "deviation",
    "phase": "31",
    "file": "docs/audit/31-round6-residuals.md",
    "line": null,
    "description": "R-31-31-01 raised and NOT repaired: the ambient declare const spelling reports 0 findings/EXIT=0, unmoved from 31-REVIEW.md CR-18 point 3, and no UNRESOLVABLE_CALLEE_RESIDUALS member names it. Owner: round 7's fix plan.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T14:35:33.403Z",
    "resolved_at": null
  },
  {
    "id": 162,
    "kind": "deviation",
    "phase": "31",
    "file": ".planning/phases/31-autonomous-manual-testing/31-round6-residual-dispositions.md",
    "line": null,
    "description": "The round-6 dispositions file declares 34 items (19 fix / 13 close / 2 open) while its six tables carry 43 (22/18/3); de-duplicating the one thrice-listed item gives 41. Derived by command. Owner: round 7's dispositions file.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T14:35:33.484Z",
    "resolved_at": null
  },
  {
    "id": 163,
    "kind": "unrun-verify",
    "phase": "31",
    "file": "docs/audit/31-round6-residuals.md",
    "line": null,
    "description": "R-01, R-02 and R-03 remain UNKNOWN - verify: the attended Chrome lane under real interactive auth, the auth predicate under alternative credential configurations, and every Windows leg. Every probe in the round-6 closing measurement ran on darwin only.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T14:35:33.564Z",
    "resolved_at": null
  },
  {
    "id": 164,
    "kind": "unrun-verify",
    "phase": "31",
    "file": "scripts/check-platform-shapes.ts",
    "line": null,
    "description": "Two of the thirteen CONTROL labels — NOT ORDINARY (answered) and NOT ORDINARY (no-answer) — are not watched live; they are driven through the module's exported derivation only (D-43)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-13T01:39:15.934Z",
    "resolved_at": null
  },
  {
    "id": 165,
    "kind": "stub",
    "phase": "31",
    "file": "scripts/runnable-ref/uat-spec-integrity.ts",
    "line": null,
    "description": "CR-28: a RENAMED import from a declared-foreign module is accepted at exit 0 — deriveImportRenames collects renames only from @playwright/test, so the foreign-declared arm's spelled operand is the LOCAL name; reproduced at 6e95edc, recorded in docs/audit/31-round8-residuals.md section 5, NOT repaired",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-13T02:40:34.587Z",
    "resolved_at": null
  },
  {
    "id": 166,
    "kind": "unrun-verify",
    "phase": "31",
    "file": "docs/audit/31-round8-residuals.md",
    "line": null,
    "description": "The review-to-corpus coverage one-shot (D-33 (2)) was NOT re-taken in gap-closure round 9; its predicate still reads 2/5 strict and 5/5 weak, with no derived drivability rule",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-13T02:40:43.836Z",
    "resolved_at": null
  },
  {
    "id": 167,
    "kind": "deviation",
    "phase": "31",
    "file": ".planning/phases/31-autonomous-manual-testing/31-43-SUMMARY.md",
    "line": null,
    "description": "requirements-completed: [UATX-01, UATX-04] asserts a completion the eighth verification round withheld; the four sibling summaries wrote [] and the requirement rows are byte-unchanged",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-13T02:40:43.924Z",
    "resolved_at": null
  },
  {
    "id": 168,
    "kind": "unrun-verify",
    "phase": "31",
    "file": "scripts/runnable-ref/uat-spec-integrity.test.ts",
    "line": null,
    "description": "31-25 CR-15 GREEN 1 times out at the 5000ms default under load (red on one of three full-suite runs; green alone and on an unloaded machine) — spawn-heavy case needs an explicit testTimeout",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-13T03:03:13.631Z",
    "resolved_at": null
  },
  {
    "id": 169,
    "kind": "stub",
    "phase": "32",
    "file": "scripts/board-model.ts",
    "line": null,
    "description": "parseBoard returns updates, nonColumnSections, unparsed and bounds as empty or zero values; plan 32-02 fills them (plan-declared functionality gap)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-14T08:16:31.933Z",
    "resolved_at": null
  },
  {
    "id": 170,
    "kind": "stub",
    "phase": "32",
    "file": "scripts/board-read.ts",
    "line": null,
    "description": "readSnapshot returns the unavailable arm for tickets, queue, context and traceability without reading them; plan 32-03 reads them (plan-declared functionality gap)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-14T08:16:32.020Z",
    "resolved_at": null
  },
  {
    "id": 171,
    "kind": "stub",
    "phase": "32",
    "file": "scripts/board-read.ts",
    "line": null,
    "description": "reads are a single guarded readFileSync; the read-verify-reread and last-good carry-forward D-11 requires land in plan 32-03 (plan-declared functionality gap)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-14T08:16:32.109Z",
    "resolved_at": null
  },
  {
    "id": 172,
    "kind": "stub",
    "phase": "32",
    "file": "scripts/board-dashboard.ts",
    "line": null,
    "description": "the frame is the thin D-17 skeleton; the stale badge, conflict list, Now-running block, width truncation and TTY redraw land in plan 32-07 (plan-declared functionality gap)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-14T08:16:32.268Z",
    "resolved_at": null
  },
  {
    "id": 173,
    "kind": "stub",
    "phase": "32",
    "file": "scripts/board-dashboard.ts",
    "line": null,
    "description": "The watch flag is accepted, reported on stderr and not honoured; the watch loop, the debounce and the poll land in plan 32-03 (plan-declared functionality gap)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-14T08:16:38.060Z",
    "resolved_at": null
  },
  {
    "id": 174,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/board-read.ts",
    "line": null,
    "description": "STALE_REASONS is five, not the plan-stated four: unreadable (a partial parse) shipped in 32-01 and dropping it would regress the malformed-dial path",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-14T09:54:08.226Z",
    "resolved_at": null
  },
  {
    "id": 175,
    "kind": "deviation",
    "phase": "32",
    "file": "agent-factory/contracts/board.md",
    "line": null,
    "description": "The contract's identifier rule requires a ticket prefix equal to factory.config.json#id_prefix, but scripts/board-model.ts is pure and reads no config, so it enforces only the identifier SHAPE. Recorded as scripts/board-corpus.ts row ctl-id-disagreeing-prefix; the prefix comparison belongs to the join layer that holds the dial.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-14T10:54:07.185Z",
    "resolved_at": null
  },
  {
    "id": 176,
    "kind": "lint-warning",
    "phase": "32",
    "file": "docs/audit/29-style-dispositions/00-base.md",
    "line": null,
    "description": "check:diff-disposition exits 1 on five Phase-31 workflow documents; pre-existing, verified identical at 6d59ed1e",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-14T13:45:35.380Z",
    "resolved_at": "2026-09-18T10:41:54.975Z"
  },
  {
    "id": 177,
    "kind": "lint-warning",
    "phase": "32",
    "file": ".planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md",
    "line": 404,
    "description": "check:nul-bytes RED — literal ESC (0x1b) in the review document; pre-existing from commit 730ff88f, deferred by plan 32-09 as out of scope",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-14T20:33:15.766Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 178,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/board-read.ts",
    "line": null,
    "description": "Hard-link residual (plan 32-10, CR-04): a hard link inside the repository to an inode whose other name is outside it is READ, because its path resolves inside the root. No path-based rule can refuse it; nlink>1 was declined as a heuristic. Measured, pinned by a mechanism test, and recorded in insideRoot's docblock, the board contract and 32-10-GREEN-proof.txt.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-14T21:20:37.534Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 179,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/board-readonly.test.ts",
    "line": null,
    "description": "Open residual (named, not closed): a module identity ASSEMBLED at runtime and handed to a non-module-system call - process.getBuiltinModule(\"node:\" + \"fs\") - is not a string literal, so the 32-11 argument arm does not see it. import(expr)/require(expr) with a non-literal ARE refused.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-14T23:14:26.242Z",
    "resolved_at": "2026-09-15T13:42:41.144Z",
    "milestone": "v2.1"
  },
  {
    "id": 180,
    "kind": "unmet-truth",
    "phase": "32",
    "file": "scripts/board-readonly.test.ts",
    "line": null,
    "description": "F-03 (32-14): npm run check:dashboard-readonly exits 0 over a module acquiring node:fs via process.getBuiltinModule(\"node:\" + \"fs\") — measured, not reasoned; reproduction in 32-14-ADVERSARIAL-REVIEW.md section 6",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-14T23:59:53.269Z",
    "resolved_at": "2026-09-15T13:42:49.724Z",
    "milestone": "v2.1"
  },
  {
    "id": 181,
    "kind": "unrun-verify",
    "phase": "32",
    "file": "scripts/check-foundation-guards.test.ts",
    "line": 12009,
    "description": "F-01 (32-14): the 'every check:* npm script names a gate that CI runs' derivation skips check:dashboard-readonly (its command is not 'node scripts/*.js'), so the DASH-06 gate's CI reachability is unproven by that gate",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-14T23:59:53.350Z",
    "resolved_at": "2026-09-15T13:42:49.809Z",
    "milestone": "v2.1"
  },
  {
    "id": 182,
    "kind": "deviation",
    "phase": "32",
    "file": ".planning/phases/32-board-projector-cli-dashboard/deferred-items.md",
    "line": null,
    "description": "the check:nul-bytes deferred entry still reads status: open but the gate is GREEN (fixed by user commit 888a1302); the entry is stale",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-14T23:59:53.431Z",
    "resolved_at": "2026-09-15T13:42:49.892Z",
    "milestone": "v2.1"
  },
  {
    "id": 183,
    "kind": "unrun-verify",
    "phase": "32",
    "file": "scripts/e2e",
    "line": null,
    "description": "The live claude-CLI e2e lane was not run for plan 32-17 (spends tokens on an authenticated box and can hang); its state is UNKNOWN - verify",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-15T09:36:31.879Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 184,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/validate.test.ts",
    "line": null,
    "description": "32-21 stated blind spot: the ticket-frontmatter census cannot resolve a key spelling assembled at RUNTIME (String.fromCharCode, a template with substitutions, a name read from a variable). Measured at zero and pinned by a case; no such shape exists in scripts/ today.",
    "status": "waived",
    "reason": "A ticket-frontmatter key spelling assembled at run time -- by String.fromCharCode, through a template with substitutions, or read from a variable -- is covered by neither of this repository's two authorities, and for structural reasons rather than for want of another arm: the static census reads expressions and the spelling is a value that does not exist until the program runs, while the runtime loader oracle observes module resolution and not string construction, so a key assembled inside an already-resolved module produces no event for it to record. Plan 32-36 closed the static half by resolving a key joined from literal characters; the remainder is measured at zero carriers on this tree and pinned by the census's own passing case at scripts/validate.test.ts:3088, which plants a String.fromCharCode shape and asserts the census reports nothing.",
    "recorded_at": "2026-09-15T12:22:42.261Z",
    "resolved_at": "2026-09-18T10:42:19.179Z",
    "milestone": "v2.1"
  },
  {
    "id": 185,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/board-watch-live.test.ts",
    "line": null,
    "description": "32-22 measured boundary: a watch failure the NEXT poll tick repairs reaches no emitted document, because armAll() precedes refresh() inside one tick and a successful re-arm deletes the record (WR-06). Pinned by an assertion and by mutation M4; updates themselves never stop (997-1003 ms with every watch dead).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-15T13:06:09.658Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 186,
    "kind": "unrun-verify",
    "phase": "32",
    "file": "scripts/board-watch-live.test.ts",
    "line": null,
    "description": "32-22: Windows fs.watch timing stays UNKNOWN - verify (Phase 33 / CAP-02). CI runs this file on windows-latest and three of its five cases depend on the platform delivering directory events; a red there is the CAP-02 measurement arriving early and must not be answered with a platform conditional.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-15T13:06:17.466Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 187,
    "kind": "unmet-truth",
    "phase": "32",
    "file": "scripts/board-readonly.test.ts",
    "line": null,
    "description": "F-04 (32-23): npm run check:dashboard-readonly exits 0, 89/89, over a closure module importing a writer through an ABSOLUTE-path specifier. isBareSpecifier excludes a leading slash so the allow-list never sees it, and js-import-closure follows only dot-relative specifiers so the module is never analysed. Measured with a real write, and the .ts typechecks and tsc emits the specifier verbatim, so a committed pair passes check:build-parity by construction. Reproduction in 32-23-ADVERSARIAL-REVIEW.md section 5.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-15T13:43:12.868Z",
    "resolved_at": "2026-09-16T13:43:56.720Z",
    "milestone": "v2.1"
  },
  {
    "id": 188,
    "kind": "unmet-truth",
    "phase": "32",
    "file": "scripts/board-readonly.test.ts",
    "line": null,
    "description": "F-08 (32-23): a capability-global member reached through a BINDING (const r = process.report; r.writeReport(p)) reds only the two-sided member-path census, not the acquisitions mechanism, because isCallee is false at a binding site. Recording process.report in EXPECTED_GLOBAL_MEMBER_PATHS and bumping the count - the edit the failure message invites - re-greens the gate at 89/89 over a writer in ONE edit. F-02's shape one register over. Reproduction in 32-23-ADVERSARIAL-REVIEW.md section 5.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-15T13:43:12.950Z",
    "resolved_at": "2026-09-16T13:43:56.820Z",
    "milestone": "v2.1"
  },
  {
    "id": 189,
    "kind": "unmet-truth",
    "phase": "32",
    "file": "scripts/board-model.ts",
    "line": null,
    "description": "F-06 (32-23): row-without-file still prints 'no ticket file carries that identifier' with an expected path that EXISTS, when the ticket file's declared id differs from its file stem. 32-15 keys the honest sentence on unadmittedTickets (refused entries, by stem) and the admitted map on the declared id, so an admitted-under-another-identity document is in neither map under its stem - and no readErrors entry is raised either. Reproduction in 32-23-ADVERSARIAL-REVIEW.md section 5.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-15T13:43:13.030Z",
    "resolved_at": "2026-09-16T13:43:56.905Z",
    "milestone": "v2.1"
  },
  {
    "id": 190,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/board-dashboard.ts",
    "line": null,
    "description": "F-05 (32-23): writeDocument sanitizes AFTER JSON.stringify, so the two are complementary - C1 is removed, C0 is already escaped into printable text and cannot be seen. A raw ESC in a board row title reaches the --json document as 0 control code points and is recovered as 6 by one JSON.parse. The boundary is stated in writeDocument's docblock; what is measured here is that the input is an ordinary raw C0, not a planted escape sequence. Reproduction in 32-23-ADVERSARIAL-REVIEW.md section 5.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-15T13:43:13.111Z",
    "resolved_at": "2026-09-16T13:43:56.992Z",
    "milestone": "v2.1"
  },
  {
    "id": 191,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/check-foundation-guards.test.ts",
    "line": null,
    "description": "F-07 (32-23): classifyCheckScript uses .exec, so a check:* command running two gate modules is classified by the FIRST and the second gets no reachability proof; CHECK_SCRIPT_CLASSES pins scripts per class, never targets per script. No live instance - all 11 check:* scripts carry at most one gate module, derived at measurement time. Reproduction in 32-23-ADVERSARIAL-REVIEW.md section 5.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-15T13:43:13.193Z",
    "resolved_at": "2026-09-16T13:43:57.075Z",
    "milestone": "v2.1"
  },
  {
    "id": 192,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/js-import-closure.ts",
    "line": null,
    "description": "The closure WALKER does not read a require(\"…\") specifier (SPECIFIER_PATTERNS covers the three emitted import forms only); the read-only GUARD's AST census does refuse one. Measured in 32-31-GREEN-proof.txt § 4 P5.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-16T07:22:43.296Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 193,
    "kind": "deviation",
    "phase": "32",
    "file": ".planning/phases/32-board-projector-cli-dashboard/deferred-items.md",
    "line": null,
    "description": "32-35 (WR-07): the CI-topology half is NOT taken — the three platform-dependent live cases stay in the shared 'Vitest (e2e lane excluded)' step of the test (matrix.os) job, so a Windows red there takes that step with it. Only the timing half was taken (EVENT_DEADLINE_MS derived from POLL_MS minus a named margin, 600 -> 750 ms). Owner: Phase 33 / CAP-02, per WINDOWS.md row 186.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-16T11:24:09.394Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 194,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/check-diff-disposition.ts",
    "line": null,
    "description": "32-36: the one-authority ticket-frontmatter census's key half now decides by PRESENCE, which names this PRODUCTION module (its own disposition-register 'status' key and a 'safety_surface' column in an operator message) and required a file-scoped exemption. A genuine second ticket reader added to this one file later would be exempted with it.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T12:43:50.219Z",
    "resolved_at": "2026-09-18T10:41:55.060Z",
    "milestone": "v2.1"
  },
  {
    "id": 195,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/board-dashboard.ts",
    "line": null,
    "description": "F-09 (32-37): sanitizeCell strips U+0009 from a refusal message BEFORE serialization, so the unrecognized-line diagnostic quotes a line reading as a valid `key: value` while asserting beside it that it is neither. The model's own message carries the TAB (measured U+0009); both channels remove it. Created on the --json channel by 32-35's scrub-before-serialize ordering; inherited on stderr from 32-18's warn() chokepoint.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-16T13:44:15.209Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 196,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/validate.test.ts",
    "line": null,
    "description": "F-10 (32-37): the one-authority ticket-frontmatter census requires its key half and its primitive half to meet inside ONE parsed file, so a reader whose keys are exported from file A and scanned in file B is invisible. Measured: two real files under scripts/, census reports 1 and exits 0, and the planted reader returns {status: ready, column: In Development} from ABC-103.md. 32-36's boundary case pins the scope only in the over-detection direction.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-16T13:44:15.297Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 197,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/check-foundation-guards.test.ts",
    "line": null,
    "description": "F-11 (32-37): GATE_TARGET_RE/SUITE_TARGET_RE admit one spelling each, so a check:* command mixing one recognised target with one unrecognised spelling (leading ./, an intervening node flag, two spaces, or a composed npm run) yields a SHORT non-null row set that never reaches the null arm 32-36 added. F-07's defect one register over. No live instance: 11 scripts carry 11 targets, all recognised.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-16T13:44:15.381Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 198,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/board-model.ts",
    "line": null,
    "description": "F-12 (32-37): presenceActual's admitted-under-another-id sentence asserts the file 'is joined under that identifier', which is false of a duplicate-id LOSER. board-read deliberately keeps the loser in the admitted record list to keep its partition total, so byStem finds it, but ticketById joined the winner. The snapshot then carries a duplicate-id readError saying the file is NOT joined beside a conflict saying it is. Created by 32-33.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-16T13:44:15.463Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 199,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/js-import-closure.ts",
    "line": null,
    "description": "F-13 (32-37): SPECIFIER_PATTERNS is three regexes, so moduleSpecifiers is never ASKED at four positions a specifier enters: require(), createRequire(...)(...), import.meta.resolve(), and new Worker(new URL(...)). All four were planted and all four exit 1 through the guard's sibling AST census (allow-list for node:module, acquisitions PREMISE for the other three), so it is not a live DASH-06 bypass; the cost is a short closure module list. Widens row 192 by three positions.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-16T13:44:15.545Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 200,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/board-model.ts",
    "line": null,
    "description": "F-14 (32-40, OPEN medium): a quoted ticket identifier's control byte is DELETED before the reader sees it, in an arm the WR-02 fix's site set does not reach. TICKET_CONTROL is /[\\x00-\\x08\\x0b-\\x1f\\x7f]/ and does not cover C1, so a ticket id carrying U+0085 is ADMITTED; RENDER_STRIPPED is /[\\u0000-\\u001F\\u007F-\\u009F]/g and deletes it. presenceActual (:1380,:1385) and ticket-unplaced (:1606) then state twice that the file declares an identifier it does not declare. Difference set measured at 34 code points, 32 of them the admissible C1 block. INHERITED (predates the fix pass); what is new is the fix's claim of site-set totality, derived over the binding name line/lines and never asked about content-derived identifiers. No byte leaves the tree; no write capability. Bears on DASH-03 and DASH-07.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T20:23:41.999Z",
    "resolved_at": "2026-09-18T10:41:55.145Z",
    "milestone": "v2.1"
  },
  {
    "id": 201,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/validate.test.ts",
    "line": null,
    "description": "F-15 (32-40, OPEN medium, live working reader demonstrated): the split-reader refusal enumerates ONE import shape. splitReaderOffenders/readerHalves catch a RENAMED named import but not a namespace import and not a two-hop re-export; both were built as real working readers that returned {status:in-review,column:In Review} at census exit 0, 130/130. CREATED BY 7aea94f0 (this round). Zero live instances: the census verdict is exactly-one-authority and NOT_A_SECOND_AUTHORITY_COUNT is pinned at 9 and did not move. Detection robustness in the PROOF of DASH-01/DASH-02, not a live second authority.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T20:23:42.089Z",
    "resolved_at": "2026-09-18T10:41:55.230Z",
    "milestone": "v2.1"
  },
  {
    "id": 202,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/js-import-closure.ts",
    "line": 296,
    "description": "F-16 (32-40, OPEN low, no live instance): CR-01's fix blanks STRING literals and not REGULAR-EXPRESSION literals. scanSource's regex arm skips without blanking, so a tracked .js carrying /from \"./evil.js\"/ in a regex interior fabricates a relative specifier and jsImportClosure refuses on an edge nobody wrote — CR-01's exact shape, one literal kind over. The package-shaped variant fabricates a bare specifier that is silently skipped. INHERITED. Blast radius measured zero: the two-sided oracle over all 65 tracked .js/.mjs reports fabricated 0, missed 0. Failure direction is over-refusal. Bears on DASH-06.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T20:23:42.173Z",
    "resolved_at": "2026-09-18T10:41:55.315Z",
    "milestone": "v2.1"
  },
  {
    "id": 203,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/board-readonly.test.ts",
    "line": null,
    "description": "F-17 (32-40, OPEN low, no live instance): a TEMPLATE-LITERAL dynamic import is invisible to the scanner AND to the oracle's supposedly independent authority. SPECIFIER_PATTERNS only ever accepted [\"'], so await import(`./tpl.js`) is scanned as []; the two-sided parser oracle's parsed() helper asks ts.isStringLiteral(node.arguments[0]) — THE SAME QUESTION — so the instrument built to prove the scanner cannot detect this class of miss. Scanner half INHERITED; the ORACLE half CREATED BY d276f4e3 (this round). Zero live instances (0 non-StringLiteral dynamic-import arguments across 65 files) and the WRITE ROUTE IS STILL REFUSED: plant S8 exits 1 at 19 failed/156 passed with the acquisitions PREMISE case red. Bears on DASH-06.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T20:23:58.558Z",
    "resolved_at": "2026-09-18T10:41:55.399Z",
    "milestone": "v2.1"
  },
  {
    "id": 204,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/js-import-closure.ts",
    "line": null,
    "description": "F-18 (32-40, OPEN informational): the WR-06 widening RELOCATES the refusal for the members it moved. classifySpecifier's bare arm now sends several spellings (a package-shaped name, a leading-whitespace absolute path) down a path where the acquisitions PREMISE case no longer fires, so a bare-specifier writer is refused by ONE predicate (the ALLOWED_BUILTIN_SPECIFIERS equality) where a foreign one is refused by TWO. CREATED BY 3e2f254a (this round) and measured NOT to weaken any recorded spelling: all 13 of round 3's baseline spellings unmoved, plants S7 and S9 both exit 1 at 11 failed/164 passed. Whether one predicate is enough for that class is a DECISION, surfaced to 32-41's checkpoint. Bears on DASH-06.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T20:23:58.645Z",
    "resolved_at": "2026-09-18T10:41:55.485Z",
    "milestone": "v2.1"
  },
  {
    "id": 205,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/check-foundation-guards.test.ts",
    "line": 12693,
    "description": "F-19 (32-40, OPEN informational, no live instance): the IN-03 one-authority rule enumerates reads by the register's identifier TEXT. The reads set matches only accesses whose expression.getText() equals \"TOOLCHAIN_CHECK_SCRIPTS\", so a second UNGUARDED read reached through an alias (const ALIASED_REGISTER = TOOLCHAIN_CHECK_SCRIPTS) is outside the set, and both the reads.length===1 pin and the every-read-is-guarded assertion pass over it (planted, 300/300, exit 0). CREATED BY c5fc977a (this round, plan 32-39). Zero live instances: no alias exists and every lookup name is a check:-prefixed script name. Bears on DASH-02 proof robustness.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T20:23:58.732Z",
    "resolved_at": "2026-09-18T10:41:55.570Z",
    "milestone": "v2.1"
  },
  {
    "id": 206,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/board-dashboard.ts",
    "line": 1184,
    "description": "F-20 (32-40, OPEN informational): one consumer of the containment decision still uses the UNRESOLVED spelling. 70cbd447 moved the watch HANDLE to decision.real (:1189) but the liveness gate at :1184 is still if (!deps.exists(dir)). INHERITED — the gate was not part of the finding and was not moved. Blast radius bounded and measured: existsSync follows symlinks so it answers the same as decision.real except across a swap landing between the two calls; the handle is decision.real; and the watch callback ignores the filename argument entirely, so no content crosses the seam. Bears on DASH-04 and DASH-05.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T20:24:14.464Z",
    "resolved_at": "2026-09-18T10:41:55.656Z",
    "milestone": "v2.1"
  },
  {
    "id": 207,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/check-foundation-guards.test.ts",
    "line": null,
    "description": "F-21 (32-40, OPEN informational, no live instance): the WR-05 step counter's separator alphabet excludes five ordinary shell shapes. NODE_STEP_RE/VITEST_STEP_RE are correct for &&, ; and || but undercount a single pipe, a newline, a leading parenthesis, a wrapper command, a background separator and a command substitution, and overcount a quoted 'vitest run' inside a message. CREATED BY c5163183 (this round). Zero live instances, measured per entry over all 11 check:* scripts: no single pipe, no single &, no newline, no wrapper. The one live exclusion (check:build-parity's inline node -e) is excluded by decision and stated in the docblock. Bears on DASH-02 proof robustness.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T20:24:14.557Z",
    "resolved_at": "2026-09-18T10:41:55.745Z",
    "milestone": "v2.1"
  },
  {
    "id": 208,
    "kind": "unrun-verify",
    "phase": "32",
    "file": "scripts/board-readonly.test.ts",
    "line": null,
    "description": "32-41 carried UNKNOWN - verify (from 32-REVIEW-FIX.md): whether a write capability can reach the dashboard closure through import.meta.resolve, through a WRITER VALUE RECEIVED AT RUNTIME, or through a future node_modules dependency. The import.meta.resolve position is separately recorded as row 199 (F-13) and was measured refused by the sibling AST census; the runtime-value and future-dependency halves are OUTSIDE WHAT A SYNTACTIC PASS CAN DECIDE and are unchanged by this round. Owner: unassigned — closing it needs a different instrument (a runtime capability probe), not another resolution arm. Bears on DASH-06.",
    "status": "waived",
    "reason": "A writer VALUE received at run time and a dependency that does not exist yet are both outside what any instrument on this corpus can observe: a value passed between two already-resolved modules produces no resolve event, so Node's loader oracle has nothing to record, and a specifier a future commit introduces cannot be enumerated by a probe of what this tree loads today. The runtime oracle landed in plan 32.1-01 closed the half that IS observable -- it recorded 14 resolve events over the dashboard closure and its module set and builtin identity set are equal, element for element, to the static closure's, with the working tree byte-identical before and after the load -- and what remains is covered instead by the static acquisitions census, whose second write-detection predicate plan 32.1-08 restored, and by the standing failing case that reds the moment package.json gains a dependencies key.",
    "recorded_at": "2026-09-16T20:24:14.647Z",
    "resolved_at": "2026-09-18T10:42:19.268Z",
    "milestone": "v2.1"
  },
  {
    "id": 209,
    "kind": "deviation",
    "phase": "32",
    "file": ".planning/phases/32-board-projector-cli-dashboard/32-40-ADVERSARIAL-REVIEW.md",
    "line": null,
    "description": "32-41 NEW RESIDUAL: the round-4 review attributes the WR-04 fix to commit 7aea94f0 at five places (sections 5, 12/F-15, 13 ratio table, 16 rows 2 and 12). 7aea94f0 is a DOCS commit touching only .planning/ROADMAP.md, .planning/STATE.md and 32-38-SUMMARY.md; it cannot have created splitReaderOffenders. The commit that did is 7a3ae592 (fix(32): WR-04 refuse the split-across-files ticket reader), measured with git log -S splitReaderOffenders. The review's sixth use of 7aea94f0, as the END of the range d5486262..7aea94f0 for plan 32-38, is CORRECT and is not part of this row. THE VERDICT DOES NOT MOVE: 7a3ae592 is a fix-pass commit in the same window, so F-15 stays created-by-a-fix-pass-change and the created-versus-inherited ratio stays 5 of 8. Only the hash is wrong. Recorded rather than corrected in place, because 32-41 does not edit another round's evidence document.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-16T20:26:20.870Z",
    "resolved_at": "2026-09-18T10:41:55.832Z",
    "milestone": "v2.1"
  },
  {
    "id": 210,
    "kind": "deviation",
    "phase": "32",
    "file": "scripts/board-tracer.test.ts",
    "line": null,
    "description": "32-38 (recorded as a ledger row by 32-41): scripts/board-tracer.test.ts became the NINTH entry in scripts/validate.test.ts's NOT_A_SECOND_AUTHORITY registry (count 8 -> 9). Plan 32-38's duplicate-identifier fixture supplied the 'status' key spelling that tipped a file already naming 'column' in a WIP-count test description and already scanning text into the census's namesBothKeys && scans conjunction. Re-measured 2026-09-16 at b6f6bd45: NOT_A_SECOND_AUTHORITY_COUNT = 9 at validate.test.ts:1893, two-sided pinned at :2252, unmoved. THE RISK: a genuine second ticket-frontmatter reader placed inside this file would be invisible to the census, exactly as one placed in any other exempt file would be. Carried in deferred-items.md since 32-38 and given a ledger row here so it is OPEN rather than ABSENT from the register. Bears on DASH-01, DASH-02.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-16T20:28:42.842Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 211,
    "kind": "unmet-truth",
    "phase": "32.1",
    "file": "scripts/e2e/uat-live.test.ts",
    "line": null,
    "description": "Live lane A1 (D-31, plugin-cache pointer resolution) FAILED on the one authorized run of 2026-09-18 after 606161 ms with an EMPTY capture: neither /grugops:plan nor --plugin-dir ./ produced planning markers without a cache path error. 606 s across two calls whose per-call budget is 300 s is consistent with both exhausting that budget and returning nothing. Cause undiagnosed by that run - kit, suite expectation, CLI version 2.1.275 or host configuration are all open. Evidence: 32.1-10-LIVE-TRANSCRIPT.txt. Owner for WINDOWS.md row 183 (re-homed-with-named-owner, 32.1-LEDGER.md section 3.1). The human go covered ONE run and explicitly not a re-run.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T10:42:44.036Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 212,
    "kind": "unmet-truth",
    "phase": "32.1",
    "file": "scripts/e2e/uat-live.test.ts",
    "line": null,
    "description": "SAFETY CASE. Live lane A2-live (SAFE-02 / V14, the prod-deploy deny) FAILED on the one authorized run of 2026-09-18 after 11663 ms: the call COMPLETED (stop_reason end_turn, total_cost_usd 0.398524) and the guard's structured prod-deploy deny envelope never appeared. This is the mechanical enforcement CLAUDE.md requires of the never-deploy-to-production-without-named-human-confirmation rule, and a live run did not observe it. Cause undiagnosed by that run. Evidence: 32.1-10-LIVE-TRANSCRIPT.txt. Owner for WINDOWS.md row 183 (32.1-LEDGER.md section 3.1).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T10:42:44.128Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 213,
    "kind": "unmet-truth",
    "phase": "32.1",
    "file": "scripts/e2e/uat-live.test.ts",
    "line": null,
    "description": "Live lane A3-live (DOG-02, D-05 dual-path convergence) FAILED on the one authorized run of 2026-09-18 after 370297 ms: the frozen gate verdict READY_FOR_HUMAN_REVIEW must converge on BOTH dispatch paths and both paths completed (costs 2.15167525 and 1.78309750) with neither producing the verdict (seq=false, sub=false). A3-live-N and both loud-skip tests-of-the-test passed, so the lane was not skipped. Cause undiagnosed by that run. Evidence: 32.1-10-LIVE-TRANSCRIPT.txt. Owner for WINDOWS.md row 183 (32.1-LEDGER.md section 3.1).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T10:42:44.214Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 214,
    "kind": "deviation",
    "phase": "32.1",
    "file": "scripts/e2e/uat-live.test.ts",
    "line": null,
    "description": "Stale claim in a safety-relevant docblock: the file states the live lane is kept OUT of the default npm test green path via the test:e2e script. False on this tree - npm test is bare vitest run, vitest.config.ts excludes only scripts/runnable-ref/fixtures and .temp, and the 2026-09-18 run proves collection happened. Anyone trusting the docblock would spend tokens on an authenticated box believing they were running the regression lane. Found by plan 32.1-10 by reading it; not patched there (that plan modified no source) and not patched by 32.1-11 (whose task list owns no source file).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T10:42:44.299Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 215,
    "kind": "deviation",
    "phase": "32.1",
    "file": "scripts/board-model.test.ts",
    "line": 2358,
    "description": "R-32.1-01-A (review IN-05, carried by plan 32.1-01): the presence-spelling walk at presenceSpellingSites / SPELLING_WALK_SKIP / SPELLING_WALK_EXTENSIONS (:2358-2390) walks the whole repository root over seven extensions including .md, .json and .txt, so UNTRACKED paths such as .gsd/ and human-notes.txt are inside its scope and a local note can red the suite. CONTEXT.md D-03 claimed the plan-01 tracked-set floor closes this; RESEARCH section Contradictions row 3 measured that IN-05 names a DIFFERENT walk and the floor does not reach it. Remedy IN-05 itself proposes: derive that walk's corpus from git ls-files. Recorded in the case docblock in scripts/board-readonly.test.ts. Outside 32.1-LEDGER.md's nineteen items (an IN- item is not one of D-22's three sources); given a row here so it is OPEN rather than ABSENT - see 32.1-LEDGER.md section 3.3.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T10:43:04.099Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 216,
    "kind": "deviation",
    "phase": "32.1",
    "file": "scripts/check-foundation-guards.test.ts",
    "line": null,
    "description": "R-32.1-01-B (plan 32.1-01): the (r-class-authority) guard classifies a *.test-support.ts file as SHIPPED, because its non-test predicate is !endsWith('.test.ts'). A future *.test-support.ts module that legitimately consumes the CI-workflow testkit cannot be expressed today: it would be reported as a shipped consumer and would also break the case's consumers === members equality. Closing it means either teaching that guard a canonical definition of test file or renaming the *.test-support.ts family - both decisions, not edits. Recorded in scripts/ts-symbols.test-support.ts's header, where the prose gave way rather than the guard's classification being widened.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T10:43:04.189Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 217,
    "kind": "deviation",
    "phase": "32.1",
    "file": "scripts/board-readonly.test.ts",
    "line": null,
    "description": "R-32.1-01-C (plan 32.1-01): the walker-importer derivation is still a TEXT match, not a checker resolution. The set is git-derived and recursive and the matcher accepts any relative depth, but a comment quoting the specifier would still count as an importer. The symbol-resolving instrument landed in plan 32.1-01 is what could decide it by declaration; cutting this particular case over was not in that plan's scope and no later plan in 32.1 took it.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T10:43:04.274Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 218,
    "kind": "deviation",
    "phase": "32.1",
    "file": "scripts/board-model.ts",
    "line": null,
    "description": "Plan 32.1-07 residual 1: the conflicts[].ticketId FIELD still publishes the byte DELETED. It reads ABC-902X while the sentence beside it reads ABC-902<U+0085>X. Deliberate - that field is a join key scrubbed on the way out by scrub()/sanitizeCell, not a sentence a human reads, and escaping it would make a consumer's join disagree with the model. It belongs to the data channel (D-18), not to the D-07 sentence builder. Recorded in 32.1-07-RED-baseline.txt section 1 and named rather than closed silently.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T10:43:04.357Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 219,
    "kind": "deviation",
    "phase": "32.1",
    "file": "scripts/board-model.test.ts",
    "line": null,
    "description": "Plan 32.1-07 residual 2: the published-sentence census keys a declaration as <file>#<declared name>, so two declarations sharing a name in ONE file share a class. No such pair disagrees on this tree today, and a NEW name reds the two-sided pin - the hole is name REUSE, not name arrival. Named in the census's own docblock.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T10:43:04.443Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 220,
    "kind": "deviation",
    "phase": "32.1",
    "file": "scripts/board-read.ts",
    "line": 1591,
    "description": "Plan 32.1-12 gap (this phase's single FAILED must-have, 32.1-VERIFICATION.md gap #1), REPRODUCED end to end at 46d860a2 and closed on ONE path. childPath (scripts/board-read.ts:1038-1058) refuses only an empty segment, a dot, a double dot and a segment carrying a separator, so a directory entry name carrying a code point the renderer DELETES passes it, is joined into a composed path, and is quoted into published claim-record sentences that are NOT built through the spelled builder; sanitizeCell then deletes the byte and the published JSON document names a path that does not exist on the tree. Measured at three channels in one run against three planted points, <U+0085>, <U+009F> and <U+0001>; the model's own sentence and the JSON document both carried the defect, the stderr frame did not (board-dashboard.ts emit() applies the builder a second time there). Reproduction transcript: .planning/phases/32.1-board-dashboard-deferred-residuals/32.1-12-RED-baseline.txt, section 1; the derived work list is section 2. The verifier's ten hand-named line numbers are CONTAINED in the derived set and SHORT by nine lines. CLOSED HERE: the tampered and no-at sentences, 2 of the 18 path-class unowned published substitutions the census derives. STILL OPEN: the other 16, over absPath (2), dir (1), indexPath (1), path (1), real (1), root (4), target (4) and taskDir (2), all in scripts/board-read.ts; plan 32.1-13 deletes the PATH-DERIVED class and plan 32.1-15 transitions this row. OWNER: the published-substitution census in scripts/board-model.test.ts, which now classes board-read.ts#claimMd as a subject declaration and is the authority that will refuse the next unbuilt sentence quoting a composed path; its discrimination is proved by a seeded tag removal in scripts/board-read.ts rather than argued. Bears on DASH-03 and DASH-07.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T12:37:01.717Z",
    "resolved_at": null,
    "milestone": "v2.1"
  },
  {
    "id": 221,
    "kind": "deviation",
    "phase": "32.1",
    "file": ".planning/phases/32.1-board-dashboard-deferred-residuals/32.1-13-PLAN.md",
    "line": null,
    "description": "Plan 32.1-13 Task 3's JSON verify command pins snapshot.schemaVersion 1; scripts/board-model.ts declares SCHEMA_VERSION = 2 since phase 32-33 (92f27444), so the command as written fails on correct code. Re-run with the version DERIVED from the module; recorded in 32.1-13-GREEN-proof.txt section 3.3.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T13:34:26.209Z",
    "resolved_at": null,
    "milestone": "v2.1"
  }
]
````
