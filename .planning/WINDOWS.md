---
schema_version: 1
open_count: 64
waived_count: 0
fixed_count: 1
total_count: 65
last_updated: 2026-08-18T09:46:49.753Z
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
  }
]
````
