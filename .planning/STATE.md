---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Autonomous Factory — Real Spawning, Controlled Language & Live Board
current_phase: 29
current_phase_name: controlled-language-voice-guard-rebuild
status: ready_to_execute
stopped_at: Completed 29-34-PLAN.md
last_updated: "2026-08-16T10:45:21.510Z"
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 113
  completed_plans: 108
  percent: 25
last_activity: 2026-08-11
last_activity_desc: "Gap-closure round 8 wave 3 EXECUTED — 27-45 closed WR-02, IN-01 and IN-05 (D-53), completing round 8 with none deferred. WR-02: the fence authority ran over the WHOLE document inside parseFrontmatter BEFORE the frontmatter region was located, so its line-dropping applied inside the region as readily as inside the body — a column-0 fence deleted content and the TRUNCATED remainder was returned on the SUCCESS arm, the module founding failure wearing a fence. Measured against the committed .js on a git archive HEAD mirror with a libyaml column (Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1): d1, a fence around a whole tools key, returned ok true value false with the tools key VANISHED; d2, a fence around a continuation line, returned tools equal to the single element Read-comma with the token DELETED; libyaml REJECTS both with Psych SyntaxError. d3, fences inside a double-quoted scalar, libyaml ACCEPTS as a grant and the module REFUSES — the safe divergence, pre-existing and unchanged. Closed STRUCTURALLY: parseFrontmatter now deletes NO line at all. It normalizes, LOCATES the region, then flattens; the fence authority is not consulted there and its scope SHRANK to the guards prose checks, which are byte-unaffected. FENCE_DELIMITER_LINE is hoisted out of stripFencedBlocks so the region scan and the strip cannot disagree about what a fence delimiter line is — one class declaration, one state machine, no second fence parser. A fence delimiter line inside the located region is a NAMED REFUSAL, because it is not a legal node in a top-level block mapping. RED-TEAM OF THIS PLANS OWN FIX over 15 fence-position shapes, each adjudicated against libyaml: FIVE MORE truncated-success shapes no review had reported also moved to a refusal — a fence after a literal block scalar, after a folded block scalar, a fence with an info string, four backticks, and a fence inside a flow sequence, the last returning the mangled value tools equal to open-bracket-Read-comma. ZERO new refusals on loader-accepted content: the only two module-refuse-loader-accept rows, a double-quoted and a single-quoted scalar containing fence text, BOTH pre-date this change. Re-measured with the modules OWN classifier over a corpus derived at run time: 1142 tracked markdown files, 0 whose located region differs under the two orderings, 0 of the 563 raw-delimiter openers carrying a column-0 fence inside the region. Value map BEFORE to AFTER: 0 arms changed, 0 values changed, 0 new refusals, both corpus sizes derived this session and equal; all 33 spawn-grant scan verdicts byte-unchanged, 0 reaching the keyless arm; the foundation gate output BYTE-IDENTICAL; the 27-44 loader differential re-run at the same digest 4ccc987f19323055 with 312 cells, 97 skipped and 32 disagreements — not one cell moved. IN-01: the spawn-occurrence balance arm was provably unreachable AND unexercised, and neither the accounting nor the kinds array was exported so no case COULD reach it — the exact shape 27-42 spent a plan closing while 27-41 shipped it anew in the same round. Closed with 27-42s own remedy: checkGrantOccurrenceBalance extracted VERBATIM as an exported pure function, the refusal wording moved byte-for-byte with the restricted diff empty modulo the parameter rename, and the kind type, kinds array and occurrence interface exported for one stated reason recorded in source — a case must construct a FOURTH, UNCLASSIFIED kind. The refusal now fires BY NAME with both interpolated counts, the arm stays unreachable in production, and the disclosure ships with the assertion. Behaviour proven preserved against a transcript captured from the PRE-EXTRACTION build as data: bucket assignment and names results byte-identical over a 17-value corpus, 4 derived from the live tree and 13 adversarial. IN-05 RECORDED, NOT FIXED: a multi-document stream is dispositioned in the module header inside the three-outcomes partition argument, which enumerated delimiter spellings exhaustively and never mentioned a second document — an unconsidered adjacency is how the WR-05 arms came to be written one rule short. Measured in session: the module reads the FIRST region only and reports no grant, while Psych parse_stream reads SIX documents of which doc3 carries Read, Agent(grugops-orchestrator). Carries an explicit UNKNOWN - verify, an explicit statement that it is NOT a bypass and must not be escalated into one, and the decision that a stream is out of scope; seven further stream shapes were probed and all read exactly the first region, so the paragraph states what the code does rather than what it intends. ONE DEVIATION: generate-role-adapters.test.ts unterminated-block case was split in two, because its fixture body carries a fence and now reaches the fence refusal — the unterminated diagnosis keeps its own case with the fences removed, and the fence refusal gets a new named case. Suite 1215 passing / 2 skipped; build, freshness, foundation guards, coordinator precheck, kit-refs and validator all exit 0; the foundation gate runs in 0.46s; no dependency introduced. CARRIED FORWARD, still owned by nobody: validate-agent-factory.ts is not a spawn-grant surface, so 27-43s validator criterion remains unsatisfiable as written and 27-44s recommendation to RETIRE it stands. ROUND 8 NOW COMPLETE — 27-46 EXECUTED, closing IN-04 (D-53), the last of the eight round-7 findings, none deferred. IN-04: the claim partition foreign arm was not de-duplicated, so a key claimed by two buckets AND absent from the schema was interpolated TWICE into the guard failure message; the sibling arm de-duplicates implicitly by filtering over the schema keys, the foreign arm filtered over the claims and inherited their multiplicity, and only the single-occurrence shape was pinned so nothing observed it. RED on a mirror of 17b9372 against the COMMITTED kit-model.js: foreign returned themes TWICE; GREEN returns it once. Closed by reporting each non-schema claimed key AT MOST ONCE in FIRST-OCCURRENCE order via indexOf(k) === i, so the order is a property of the expression rather than of runtime insertion order, with the multiplicity DROPPED rather than kept in a second field. Behaviour preservation PROVEN: the gate kit counts PASS line is BYTE-IDENTICAL before and after at sha256 7a731112, 511 bytes, both exit 0, and the unclaimed and doubleClaimed expressions do not appear in the diff at all. Four cases were RED first: the duplicate pin, a both-arms at-most-once invariant, an order-determinism case asserting first-occurrence and explicitly NOT sorted, and the permutation case extended to carry multiplicity. SWEEP: the 27-44 differential re-run after this whole-project compile is identical on all three counts and the digest — 312 cells, 97 skipped, 32 disagreements, 4ccc987f19323055 — not one cell moved, measured clean rather than skipped. The three 27-43 surface reproductions still hold on fresh mirrors of 2cc66a9: skill twins family a, skill twins family b flow sequence, and the non-coordinator adapter each move exit 0 to exit 1 on the WR-05 violation, finding text READ on each, every red ending 1 CHECK(S) FAILED so guard_wr05 alone is responsible; the control exits 0. Value map derived at run time both sides: 1143 and 1143, 0 arms, 0 values, 0 new refusals — the plus one over 27-45s 1142 is 27-45-SUMMARY.md itself. Suite 1218 passing / 2 skipped, a floor and not proof no bypass remains; build, freshness over 32 committed .js, foundation guards, coordinator precheck, kit-refs and validator all exit 0; the gate runs in 0.44s to 0.90s; the package manifest diff is EMPTY across the whole round b24d980 to HEAD so the supply-chain mitigation is asserted absence at round scope; no dependency added. ONE DEVIATION: a stale sentence above the partition describing the third arm order as the claim order was corrected, outside the literal restricted-diff wording and tabulated in the summary. Next: phase verification for Phase 27."
prior_activity_desc: "Gap-closure round 8 wave 2 EXECUTED — 27-44 closed WR-01 and IN-02 (D-52, D-53) by moving the completeness claims SOURCE out of the test file: a 312-cell corpus generated from three data axes, handed in ONE process to /usr/bin/ruby -ryaml, whose verdict is the expected value for every cell. 97 loader-rejected cells are printed and skipped; the 32 disagreements are asserted EQUAL to two named safe-direction exemptions, never a subset; the unsafe directions are asserted empty INDEPENDENTLY of the exemption machinery; a printed corpus digest makes the outside RED transcripts same-corpus claim a measurement. The pre-27-43 build produces 56 disagreements of which 24 are the unsafe silent-no-grant direction, reproduced both in a scratch mirror and THROUGH the committed case. The D-49 hand-written truth table is explicitly demoted to a second independent expectation and tied to the harness case by a source assertion so it cannot outlive it. IN-02: both one-grammar construct arrays carry two-sided length pins and each of the six constructs has a planted fixture recognised through that construct and no other, which caught a weaker-DUPLICATE substitution that preserved the count. Two key-line shapes were added beyond the plans nine so the corpus can express the two bypasses 27-43s own red team found. A raw NUL byte in the test source, found only because the digest claim was made measurable, was replaced with String.fromCharCode(0). No production source file was edited."
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-28 — after v2.0 milestone)

**Core value:** A user installs grugops on top of the coding-agent CLI they already run, types `/grug`, and gets a disciplined delivery team — a visible board, a shared context where nothing is written until it is *verified*, and an auditable requirement→code→test→release trail — entirely as readable markdown, with humans always holding merge and deploy. The v2.0 differentiator: **"verified" means passed the §14 behavior gate**, recorded as a `verified_by` stamp the writing agent cannot forge or self-set.
**Current focus:** Phase 29 — controlled-language-voice-guard-rebuild

## Current Position

Phase: 29 (controlled-language-voice-guard-rebuild) — EXECUTING
Plan: 34 of 39 (gap-closure round 4: 29-33 COMPLETE; 29-34 .. 29-39 remain)

## Gap-closure round 7 — PLANNED 2026-08-06, ready to execute

**The sixth spelling sits one level BELOW every predicate round 6 fixed.** `classifyDelimiter` reasons about a line and is correct. `ENUMERATION_LEGAL_CHARS` reasons about a captured enumeration and is correct. But the value they reason about is **assembled from several physical lines** by `flattenBlock`, and the two helpers that run first — `stripComment` and `startsWithReference` — reset their state at every line boundary. A YAML scalar does not. A name mangled upstream never reaches the allowlist that would have refused it.

| Plan | Wave | Closes | Requirements |
|---|---|---|---|
| `27-39` | 1 | CR-01 + WR-01 + the continuation-JOIN direction — **all three in one edit** (D-48), pinned by D-49's 90-cell fourth axis | KIT-03, SPAWN-04 |
| `27-40` | 2 | WR-02 (indentation discarded by the delimiter classifier) + IN-02 (`unquoteChecked` applied inside a `\|`/`>` block scalar) | KIT-03, SPAWN-04 |
| `27-41` | 3 | WR-03 (a truncated enumeration impersonates an unscoped grant) + IN-01 (ZWSP-only prologue reaches the keyless success arm) | KIT-03, SPAWN-04 |
| `27-42` | 4 | IN-03 + IN-04 + IN-05, with an explicit record-don't-fix disposition table giving each its reason | KIT-02, KIT-03 |

All ten round-6 items land somewhere; **nothing is deferred past this round** (D-50, the third application of the D-41/D-47 posture). Waves are strictly sequential because all four plans edit `scripts/frontmatter.*` — a genuine `files_modified` overlap, not build serialization.

**The key correction this round: the JOIN fold.** The drafted plan had deferred the continuation-JOIN direction to a separate later plan. The user ratified folding it into `27-39`, because splitting a root cause by which side a finding happened to report is precisely the incrementalism that produced six consecutive rounds of "one more spelling." D-48 now requires all three directions to close in one edit.

**Two defects no review named**, both reproduced by the planner against the committed `.js` and libyaml before planning: a JOIN bypass flattening `tools` to `"Read,` while libyaml returns the full grant, and a JOIN **name-invention** case with no comment involved at all — `Agent(alpha, ga` / `mma)` yields three names, one of them fabricated.

**Plan-checker was run on opus, not the configured sonnet**, deliberately: six consecutive green verifications have each preceded a live bypass. It returned **0 BLOCKER / 5 WARNING**. W1 was [[set-literal drift]] landing *inside* the plans written to close it — a hard-coded `1127` tracked-markdown count asserted in 21 places and promoted to a test assertion, independently verified **wrong** (`git ls-files '*.md'` gives **1131**, and gave 1131 at `bbffa95` too, so it was wrong when measured, not drifted). Fixed structurally per this phase's own rule: both sides re-measure at task start and the two **derived** numbers are compared to each other; the permanent suite control now derives its own corpus and no size literal survives in any assertion. W2 demoted the before/after value-map control to a one-shot SUMMARY transcript, since its "before" image is a build that stops existing when the edit lands. W3 deleted an executor-facing escape hatch that let a 12-cell truth table substitute for the mandatory 90-cell non-circularity assertion. W4 added the discriminating requirement that the `coverer` probe's RED transcript counts **only** at exit 0 with `ALL CHECKS PASSED` — `SPAWN_GRANT_SCAN_PARTS[].list` holds the same reference, so a naive rename reds the mirror for the wrong reason. W5 was informational.

Commits: `e7ecb0c` (plans), `ec14b4c` (D-48/D-49/D-50 ratified into CONTEXT.md), `1d91490` (W1–W4 closed). Gap source: `27-REVIEW-GAPS-6.md` — **not** `27-VERIFICATION.md`, which is the round-5 record and is stale.

**Round-5 verification (2026-08-03) returns gaps_found at 7/10.** All five round-4 findings are GENUINELY closed, each confirmed by reading the shipped code rather than the SUMMARY that claimed it: CR-01's two single-sided delimiter spellings both refuse, CR-02's installer unreadable-walk channel names the directory at exit 3, CR-03's plugin-form `skills/` tree is derived into the one scan composition, WR-01's three exit-after-report tails all set the exit code, and WR-02's grant enumeration refuses what it cannot vouch for. Suite **1068 passed / 2 skipped** across 35 files, 32 committed `.js` all fresh, every repo gate exit 0 — and green proved nothing for the fifth round running. TWO NEW BLOCKERS, both reproduced independently by the reviewer and again by the orchestrator against the committed `.js` on hermetic mirrors.

| Finding | Where | Fails |
|---------|-------|-------|
| **CR-01 — FIFTH spelling** | `scripts/frontmatter.ts:795-823` — `delimiterRefusal`'s two arms do not cover their UNION. Arm 1 needs `startsWith(payload)` at position 0; arm 2 needs a LEGAL delimiter after the leading invisible residue. A line carrying BOTH leading residue AND illegal trailing residue matches neither. Measured on a document plainly carrying `Agent(grugops-orchestrator)`: `---<ZWSP>` REFUSED, `<ZWSP>---` REFUSED, `<ZWSP>---<ZWSP>` → `{ok:true,value:{}}` — silent success, grant invisible. Each half is refused AND pinned by a shipped case; the composition is green, which falsifies 27-33's own must_have that no fifth spelling can slip between. | KIT-03, SPAWN-04 |
| **CR-02** | `scripts/kit-model.ts:187` — `PLUGIN_DEFAULT_COMPONENT_SUBPATHS = ["agents", "commands"]` is a hand-listed 2-of-9 set of the plugin-root component directories this repo's own CLAUDE.md schema lists, and `plugin.json` declares no path override, so default discovery applies to all nine. Identical plant on hermetic mirrors: `commands/` exit 1 naming the file; `outputStyles/` and `hooks/` both `ALL CHECKS PASSED` at exit 0, file never mentioned. **`hooks/` exists on the live tree today** — inside a floor whose comment claims it closes the CLASS rather than CR-03's instance. | KIT-02 |

**The structural read for round 6.** Round 5 was the round that finally got the delimiter POLARITY right — arm 1 declares the legal spelling and refuses the complement, consulting no character class, exactly as D-43 demanded. The fifth spelling is therefore not a fifth denylist; it is a COMPOSITION hole between two individually-correct arms, and the sweep that pins them is non-circular over the character alphabet but circular over the ARM STRUCTURE — all 4192 of its constructions land inside one arm or the other, so it is structurally incapable of failing on the composite. CR-02 is [[set-literal drift]] for the third time in this phase, one level up from CR-03: the fix for a hand-listed set was another hand-listed set. Reports: `27-VERIFICATION.md` (round 5) and `27-REVIEW-GAPS-5.md`.
Round 5 wave 3: **27-35 closes CR-02 — the installer as the one place a file disappears silently — and WR-01's incomplete exit-tail fix.** `NestedWalkResult` gained a fourth channel, `unreadable`, and both bare `return;` arms route through it, so a nested directory the walk cannot read is refused BY NAME at exit 3 instead of vanishing under a completion banner. Reproduced against the committed `.js` WITH its control and re-run after the rebuild: `.claude/agents/nested` at mode 000 went from `== install complete ==` at exit 0 with `nested` absent from the entire output, to `== install INCOMPLETE — 1 item(s) need verification ==` at exit 3 naming it — while the IDENTICAL tree at mode 755 exits 3 naming `nested/hidden.md` under `FLAT BY CONTRACT`, so the two arms are distinguishable rather than merely both non-zero and the **less-readable/more-confident inversion is dead**. A readable but genuinely EMPTY nested directory produces NO unreadable finding and exits 0: the channel reports a read FAILURE and never an absence. The chmod fixture is PROBED and skips with its reason printed, and that skip path was exercised in a scratch build rather than assumed reachable. WR-03 gained a **part 3** over the arm the twins actually diverged on, asserting neither side is silent BEFORE the equality and extracting the path from each side — proven to fail from EITHER side by two scratch builds against the committed `.js`. All THREE exit-after-report tails now set the exit code (`install.ts`, `uninstall.ts` line 733 of 733, the precheck line 598 of 598 after its finally, each confirmed by reading); the uninstaller's comment asserted a parity the code lacked for a whole round and now carries the pipe-discard mechanism that makes it true; the regression scan runs over FOUR paths and the precheck gets its own assertion because its call carried a variable. The residual note's hand-maintained line-number list is DELETED — all six had drifted, one in the OPPOSITE direction — and replaced by a pinned count (filtered **6**, raw **7**) plus the stable class fact; the six mid-script sites are unchanged at 112, 510, 529, 545, 572, 1382. Truncation on the two later tails stays **unreproduced** and the summary says so: the finding closed is the incomplete fix, not a measured truncation. Suite **1068 passed / 2 skipped** across 35 files; 32 committed `.js` all fresh; `tsc --noEmit`, foundation guards and coordinator-resolution-precheck all exit 0; kit intact at 17/7/7; `package.json` byte-unchanged.
Round 5 so far, wave 2: **27-34 closes CR-03 — the shipped plugin-form `skills/` tree — and the D-41 item 4 name-floor misdiagnosis.** The seven `skills/<n>/SKILL.md` files the platform loads for every `/plugin install` user are now DERIVED from `kit-model` (`listPluginSkillAdapters`, cardinality **7** two-sided) and folded into the SINGLE exported scan composition rather than a second one in the guard, so the guard's scan and the parser's false-red control widened together. Proven end-to-end against the committed `.js` on hermetic mirrors: a grant planted on `skills/plan/SKILL.md` went from `ALL CHECKS PASSED` at exit 0 to exit 1 naming the file; the unmodified mirror stays exit 0. The composition pin rose **26 → 33** with per-part SET equality on ALL FOUR parts — a scratch build swapping the standalone-skill part for the plugin members while holding the total at 33 passes the count and fails the per-part assertion, which is why a claim about only the part being added is not enough. `guard_wr05`'s PASS line now names three counts (`23 adapter bodies + 7 plugin-form skill(s) + 2 packaging templates`) and both plugin-default component dispositions (`agents/ ABSENT, commands/ ABSENT`), with the tier-announcement phrase byte-unchanged; the counts line reports four derived numbers. A new absence-or-coverage floor closes the CLASS: a granted file planted at `agents/rogue.md` reds the gate. `guard_distribution_pair` asserts the two distribution forms byte-identical modulo the `name` VALUE — 6 compared, 1 exempted by name with its reason and its bound recorded — and the normalization is a REWRITE, proven load-bearing by a scratch build implementing it as "drop the name line", which prints `ALL CHECKS PASSED` over a wrong command name while passing every other control unchanged. The name floor now tells a document with no frontmatter block apart from a block with no `name` key. Suite **1062 passed / 2 skipped** across 35 files; 32 committed `.js` all fresh; `tsc --noEmit`, foundation guards, coordinator-resolution-precheck, check-kit-refs and validate-agent-factory all exit 0; the KIT-03 verdict is unchanged at `17 == 17 == 17`, proving the plugin set did not leak into the role-corpus equality.
Round 5 wave 1: **27-33 closes CR-01's fourth spelling (the DELIMITER axis) and WR-02.** The delimiter positions now declare ONE legal spelling and refuse everything else; arm 1 consults no character class at all. Proven by transcript against the committed `.js` at both ends: every ratified row (including `----`, `--- foo`, U+FE0F, U+0301, U+0378, U+E000 — the six D-42's alphabet would still have missed) went from a SILENT no-grant to a named refusal, and a mark-prefixed rogue spawn grant planted on `.claude/skills/grugops-map/SKILL.md` in a hermetic mirror went from `ALL CHECKS PASSED` at exit 0 to exit 1 naming the file. False-red cost re-measured at **0** across all 1115 tracked markdown files. The spawn-grant scan composition moved to ONE authority (`kit-model.spawnGrantScan`), pinned two-sided at **26** plus per-part SET equality — a scratch build holding the total at 26 while dropping the skills part fails red. The negative-space sweep is proven non-circular: narrowed to D-42's own alphabet it FAILS naming U+0302, a combining mark that alphabet does not contain. Suite **1035 passed / 2 skipped** across 35 files; 32 committed `.js` all fresh; foundation guards, coordinator-resolution-precheck, check-kit-refs and validate-agent-factory all exit 0.
Prior status: Round-4 verification (2026-08-02) returns **gaps_found at 7/10**. All **eight** round-3 findings are GENUINELY closed — each re-checked by running the round-3 reproduction against the committed `.js`, not by reading the SUMMARY. **D-30 held as an allowlist** (`DQ_ESCAPE_ALLOWLIST`, `scripts/frontmatter.ts:409`, three entries, refuse-by-default; `grep -c NUMERIC_ESCAPE` = 0 — the rejected regex stayed rejected) and **D-36 landed** (`kit-model.test.ts:386` asserts `toThrow(/symlink cycle at loop\d\/agents/)`). Suite **1015 passed / 2 skipped** across 35 files, **32** committed `.js` all fresh, foundation guards exit 0 — and green proved nothing again. Three NEW blockers, every one reproduced independently twice (reviewer + orchestrator, or reviewer + verifier) against the committed artifacts.

| Finding | Where | Fails |
|---------|-------|-------|
| **CR-01 — FOURTH spelling** | `scripts/frontmatter.ts:695` — the DELIMITER axis. A 3-byte UTF-8 BOM, or a trailing NBSP after the opening `---`, routes a document plainly carrying `Agent(grugops-orchestrator)` into the keyless SUCCESS arm: `{ok:true,value:false}`, no refusal, no error. D-34 enumerated ONE bad prologue (`%directive`) and left the complement of the delimiter test a silent success — the enumerate-the-bad shape D-30 declined by name thirty lines above. | KIT-03, SPAWN-04 |
| **CR-03** | `scripts/check-foundation-guards.ts:458` — `SPAWN_GRANT_SCAN = [...ADAPTERS, ...PACKAGING_TEMPLATES]`, and `ADAPTERS` covers only `.claude/agents` + `.claude/skills`. The shipped plugin-form `skills/` tree (7 `SKILL.md`, all modified by THIS phase) is in **no** scan set. A rogue grant planted in `skills/plan/SKILL.md` yields `PASS WR-05: … no non-coordinator does` then `ALL CHECKS PASSED` exit 0. | KIT-02, SPAWN-04 |
| **CR-02** | `install/kit-source.ts:335-340,349-354` — two bare `return;` arms drop an unreadable nested directory with no name; installer prints `== install complete ==` exit 0. Control: same tree at `chmod 755` → exit 3 naming the file. Less readable = more confident. The twin at `kit-model.ts:270` throws. | KIT-02 |
| WR-01 (warning) | `install/uninstall.ts:730` still `process.exit(3)`; the D-35 flush fix reached one of three tail sites and `install.test.ts:2237` scans only install.ts/.js. Truncation itself unreproduced. | KIT-02 |
| WR-02 (warning) | `keysGrantedAgentNames` drops `c` from `Agent(a(b), c)` and splits `Agent("a,b", c)` into three wrong names — both on the `ok:true` arm, both feeding the KIT-03 set-equality. | KIT-03 |

**The structural read, which round 5 should act on rather than patch around:** three of four rounds have ended with a NEW spelling of the SAME fail-open in `frontmatter.ts`. The two fixes that HELD (D-30 escape allowlist, D-36 named throw) both work by making refusal the default for the *complement*. The delimiter test is the last place in that module where the complement is a silent success. CR-03 is the [[set-literal drift]] class, not the parser class: a shipped surface sitting outside the set that claims to cover it — which is KIT-02's exact wording.

Full report: `27-VERIFICATION.md` (round 4, 2026-08-02 — supersedes the round-3 record). Review: `27-REVIEW-GAPS-4.md`.

## Gap-closure round 5 — PLANNED 2026-08-03, ready to execute

3 plans, 3 single-plan waves: **27-33 → 27-34 → 27-35**. Plan-checker returned **VERIFICATION PASSED** at iteration 2 of a 3-iteration cap (2 blockers found and closed in iteration 1, 1 blocker found and closed in iteration 2, 3 residual warnings fixed by the orchestrator). Gates: requirements **10/10**, decision coverage **32/32**, post-planning gap analysis **42/42**, zero glued `D-NN` citations.

| Plan | Wave | Closes | Requirements |
|------|------|--------|--------------|
| 27-33 | 1 | **CR-01** delimiter region per **D-43**; **WR-02** grant-enumeration refusal; relocates the scan composition into `kit-model` as one authority | KIT-02, KIT-03, SPAWN-04 |
| 27-34 | 2 | **CR-03** plugin-form `skills/` tree derived and scanned per **D-40**; the pair rule; the plugin-default absence floor; the name-floor misdiagnosis | KIT-02, KIT-03, SPAWN-04 |
| 27-35 | 3 | **CR-02** unreadable-walk channel; **WR-01** `process.exit` tails. Wave 3 is **serialization only** (concurrent `tsc` emit would tear a committed `.js`), not a logical dependency | KIT-02 |

**The predicate was written wrong three times before any code was cut.** D-39 (orchestrator) defined the near-delimiter test as `line.trim() === "---"` and called it a derivation; `trim()` strips ECMAScript WhiteSpace but not the Unicode format class, so ZWSP — **a spelling D-39's own rationale cited** — would have survived. D-42 (planner) replaced it with `[\s\p{Cf}\p{Cc}]`; that is a wider denylist, and combining marks, unassigned, private-use, `----` and `--- foo` all survived it. **D-43** (plan-checker) is the first formulation that enumerates the LEGAL spelling and refuses the complement — the polarity all three claimed. Each catch was independently reproduced against the committed `.js` before ratification. False-red cost of the strict rule, measured: **zero** across all 33 scan surfaces and all 1115 tracked markdown files.

**Two decisions an executor must not quietly undo.** (a) **D-43's arm 1 consults no character class at all** — "begins with the payload and is not legal, full stop"; the invisible test belongs to arm 2 (leading residue) and may never decide trailing legality. Implementing arm 1 with a character class reproduces D-42 and is a defect, not a shortcut. (b) The relocated composition carries an **exact two-sided cardinality pin (26 in 27-33, 33 in 27-34) plus per-part SET equality against each lister** — not counts. Three integer comparisons pass while a decoy displaces a real adapter within a part. Set-equality between the control's corpus and the guard's scan is **documentation, not a check**: after the relocation it compares one object with itself and can never fail.

Next: verify round 5 — all 35 plans of phase 27 are executed and every round-5 plan carries a SUMMARY; phase 27 is NOT yet verified complete.
Prior activity: 2026-07-30 — 27-22 closed WR-02 and WR-04, the last two plans-worth of gap-closure round 2. The installer's three source derivations now decide file-ness and directory-ness with `statSync`, matching `kit-model.walkFilesRelative` and the way the platform resolves a symlinked adapter, so a symlinked source adapter is INSTALLED or REFUSED BY NAME instead of vanishing under `== install complete ==`. Proven RED-before/GREEN-after on both synthetic and REAL repo sources, plus four adversarial probes; a symlink CYCLE would have hung the new walk and was closed with a realpath-visited-once guard (Rule 2). `mappingDests` now derives its own cardinality from the `[` openings the author wrote and refuses an entry it cannot read, naming the file, constant and both counts — the plan's stated RED does not reproduce, the review's does, and both transcripts are recorded. All 23 plans of phase 27 are executed; phase 27 is NOT verified complete.

## Performance Metrics

**Velocity:**

- Total plans completed: 183
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | - | - |
| 02 | 4 | - | - |
| 03 | 8 | - | - |
| 04 | 7 | - | - |
| 05 | 5 | - | - |
| 06 | 5 | - | - |
| 07 | 4 | - | - |
| 08 | 4 | - | - |
| 09 | 6 | - | - |
| 10 | 4 | - | - |
| 12 | 5 | - | - |
| 13 | 3 | - | - |
| 14 | 3 | - | - |
| 15 | 6 | - | - |
| 16 | 3 | - | - |
| 17 | 3 | - | - |
| 18 | 2 | - | - |
| 20 | 4 | - | - |
| 21 | 4 | - | - |
| 22 | 9 | - | - |
| 23 | 4 | - | - |
| 24 | 5 | - | - |
| 26 | 6 | - | - |
| 27 | 66 | - | - |
| 28 | 8 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P02 | 2m | 2 tasks | 2 files |
| Phase 01 P04 | 3m | 2 tasks | 3 files |
| Phase 01 P05 | 4m | 2 tasks | 2 files |
| Phase 01 P03 | 4m | 2 tasks | 1 files |
| Phase 02 P01 | 8m | 2 tasks | 11 files |
| Phase 02 P02 | 1m | 2 tasks | 5 files |
| Phase 02 P03 | 3m | 3 tasks | 11 files |
| Phase 02 P04 | 4m | 2 tasks | 9 files |
| Phase 03 P01 | 2m | 2 tasks | 2 files |
| Phase 03 P02 | 2m | 3 tasks | 3 files |
| Phase 03 P03 | 4m | 2 tasks | 2 files |
| Phase 03 P04 | 4m | 2 tasks | 2 files |
| Phase 03 P05 | 4m | 3 tasks | 3 files |
| Phase 03 P06 | 6m | 3 tasks | 3 files |
| Phase 03 P07 | 4m | 2 tasks | 2 files |
| Phase 03 P08 | 4 | 2 tasks | 1 files |
| Phase 04 P01 | 1m | 1 tasks | 1 files |
| Phase 04 P02 | 1m | 2 tasks | 2 files |
| Phase 04 P03 | 4m | 3 tasks | 3 files |
| Phase 04 P04 | 4m | 2 tasks | 2 files |
| Phase 04 P05 | 3m | 2 tasks | 2 files |
| Phase 04 P06 | 6m | 3 tasks | 3 files |
| Phase 04 P07 | 6m | 3 tasks | 2 files |
| Phase 05 P01 | 3m | 3 tasks | 4 files |
| Phase 05 P04 | 7m | 2 tasks | 3 files |
| Phase 05 P02 | 16m | 2 tasks | 10 files |
| Phase 05 P03 | 6m | 2 tasks | 9 files |
| Phase 05 P05 | 25m | 3 tasks | 5 files |
| Phase 06 P06-01 | 7m | 2 tasks | 408 files |
| Phase 06 P06-02 | 2m | 1 tasks | 5 files |
| Phase 06 P06-03 | 4m | 2 tasks | 4 files |
| Phase 06 P06-04 | 6m | 2 tasks | 3 files |
| Phase 06 P06-05 | 5m | 2 tasks | 3 files |
| Phase 07 P01 | 4m | 4 tasks | 6 files |
| Phase 07 P02 | 9m | 3 tasks | 30 files |
| Phase 07 P03 | 11m | 2 tasks | 13 files |
| Phase 07 P04 | 6m | 2 tasks | 1 files |
| Phase 08 P01 | 3m | 2 tasks | 24 files |
| Phase 08 P02 | 8m | 2 tasks | 1 files |
| Phase 08 P08-03 | 214m | 2 tasks | 3 files |
| Phase 08 P04 | 10 | 2 tasks | 2 files |
| Phase 08 P08-04 | 10 | 2 tasks | 2 files |
| Phase 09 P01 | 4m | 2 tasks | 1 files |
| Phase 09 P02 | 7m | 2 tasks | 1 files |
| Phase 09 P03 | 5m | 2 tasks | 1 files |
| Phase 09 P09-04 | 12m | 3 tasks | 2 files |
| Phase 09 P05 | 11m | 2 tasks | 2 files |
| Phase 09 P06 | 5m | 2 tasks | 2 files |
| Phase 10 P01 | 9m | 1 tasks | 1 files |
| Phase 10 P02 | 4m | 2 tasks | 3 files |
| Phase 10 P03 | 7m | 2 tasks | 4 files |
| Phase 10 P04 | 6m | 2 tasks | 2 files |
| Phase 11 P01 | 20m | 2 tasks | 7 files |
| Phase 11 P02 | 25m | 2 tasks | 8 files |
| Phase 11 P03 | 6m | 2 tasks | 4 files |
| Phase 11 P04 | 18m | 3 tasks | 2 files |
| Phase 11 P05 | 4m | 2 tasks | 4 files |
| Phase 12 P01 | 4m | 2 tasks | 2 files |
| Phase 12 P02 | 2m | 2 tasks | 2 files |
| Phase 12 P03 | 1m | 2 tasks | 2 files |
| Phase 12 P05 | 6m | 3 tasks | 3 files |
| Phase 12 P04 | 5min | 2 tasks | 2 files |
| Phase 13 P01 | 4m | 2 tasks | 4 files |
| Phase 13 P02 | 7m | 1 tasks | 1 files |
| Phase 13 P03 | 3m | 2 tasks | 2 files |
| Phase 15 P01 | 10m | 2 tasks | 9 files |
| Phase 15 P02 | 3m | 2 tasks | 4 files |
| Phase 15 P03 | 25m | 2 tasks | 5 files |
| Phase 15 P04 | 22m | 2 tasks | 11 files |
| Phase 15 P05 | 12m | 2 tasks | 8 files |
| Phase 15 P15-06 | 18m | 3 tasks | 15 files |
| Phase 16 P01 | 4m | 3 tasks | 9 files |
| Phase Phase 16 P02 P02 | 6m | 2 tasks | 4 files |
| Phase 16 P03 | 9m | 2 tasks | 3 files |
| Phase 17 P01 | 9m | 2 tasks | 3 files |
| Phase 17 P02 | 26m | 2 tasks | 6 files |
| Phase 17 P03 | 14m | 2 tasks | 4 files |
| Phase 18 P01 | 5m | 2 tasks | 6 files |
| Phase 18 P02 | 3m | 2 tasks | 4 files |
| Phase 19 P01 | 20m | 3 tasks | 6 files |
| Phase 19 P02 | 18m | 2 tasks | 4 files |
| Phase 19 P03a | 2m | 1 tasks | 1 files |
| Phase 20 P01 | 9m | 2 tasks | 5 files |
| Phase 20 P02 | 3m | 2 tasks | 3 files |
| Phase 20 P03 | 9m | 2 tasks | 4 files |
| Phase 20 P04 | 5m | 2 tasks | 4 files |
| Phase 21 P01 | 6m | 2 tasks | 3 files |
| Phase 21 P02 | 4m | 1 tasks | 1 files |
| Phase 21 P03 | 8m | 2 tasks | 23 files |
| Phase 21 P04 | 3m | 2 tasks | 3 files |
| Phase 22 P01 | 6min | 3 tasks | 7 files |
| Phase 22 P02 | 8min | 3 tasks | 24 files |
| Phase 22 P03 | 6m | 4 tasks | 3 files |
| Phase 22 P04 | 18m | 4 tasks | 7 files |
| Phase 22 P05 | 9 | 4 tasks | 6 files |
| Phase 22 P06 | 11m | 4 tasks | 6 files |
| Phase 22 P07 | 32min | 4 tasks | 6 files |
| Phase 22 P08 | 21min | 3 tasks | 4 files |
| Phase 22 P09 | 12 | 3 tasks | 4 files |
| Phase 23 P01 | 5m | 2 tasks | 10 files |
| Phase 23 P02 | ~15m | 2 tasks | 6 files |
| Phase 23 P03 | 25min | 3 tasks | 11 files |
| Phase 24 P01 | 64min | 3 tasks | 19 files |
| Phase 24 P02 | 11m | 2 tasks | 18 files |
| Phase 24 P03 | 12m | 2 tasks | 7 files |
| Phase 24 P04 | 6min | 2 tasks | 4 files |
| Phase 24 P05 | 70m | 3 tasks | 170 files |
| Phase 25 P01 | 7min | 2 tasks | 6 files |
| Phase 25 P03 | 12 | 3 tasks | 4 files |
| Phase 25 P09 | 13min | 3 tasks | 7 files |
| Phase 25 P10 | 13min | 2 tasks | 6 files |
| Phase 26 P01 | 9min | 3 tasks | 9 files |
| Phase 26 P02 | 12min | 2 tasks | 1 files |
| Phase 26 P03 | ~15min | 2 tasks | 3 files |
| Phase 26 P04 | 18min | 2 tasks | 2 files |
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 27 P01 | 22 | 3 tasks | 6 files |
| Phase 27 P02 | 25m | 3 tasks | 5 files |
| Phase 27 P03 | 17min | 3 tasks | 4 files |
| Phase 27 P04 | 14 | 3 tasks | 11 files |
| Phase 27 P05 | 35 min | 3 tasks | 3 files |
| Phase 27 P06 | 20 min | 2 tasks | 19 files |
| Phase 27 P07 | 95 min | 3 tasks | 23 files |
| Phase 27 P08 | 25m | 3 tasks | 22 files |
| Phase 27 P09 | 15m | 2 tasks | 2 files |
| Phase 27 P10 | 25m | 3 tasks | 6 files |
| Phase 27 P11 | 15m | 3 tasks | 7 files |
| Phase 27 P12 | 20m | 3 tasks | 6 files |
| Phase 27 P13 | 55m | 3 tasks | 8 files |
| Phase 27 P14 | 25m | 2 tasks | 4 files |
| Phase 27 P15 | 40m | 2 tasks | 8 files |
| Phase 27 P16 | 30m | 2 tasks | 5 files |
| Phase 27 P18 | 35 min | 2 tasks | 4 files |
| Phase 27 P19 | 35 min | 2 tasks | 3 files |
| Phase 27 P23 | 15 min | 3 tasks | 7 files |
| Phase 27 P21 | 35m | 2 tasks | 8 files |
| Phase 27 P20 | 30m | 2 tasks | 3 files |
| Phase 27 P22 | ~45m | 2 tasks | 3 files |
| Phase 27 P24 | 35m | 2 tasks | 4 files |
| Phase 27 P25 | 35 min | 2 tasks | 7 files |
| Phase 27 P26 | ~40 min | 2 tasks | 3 files |
| Phase 27 P27 | ~25 min | 2 tasks | 6 files |
| Phase 27 P28 | ~45 min | 2 tasks | 6 files |
| Phase 27 P29 | 35 min | 3 tasks | 8 files |
| Phase 27 P30 | ~30 min | 2 tasks | 5 files |
| Phase 27 P31 | 45 min | 2 tasks | 8 files |
| Phase 27 P32 | 11min | 2 tasks | 8 files |
| Phase 27 P33 | 35m | 3 tasks | 8 files |
| Phase 27 P36 | 35 | 2 tasks | 3 files |
| Phase 27 P39 | 40m | 2 tasks | 3 files |
| Phase 27 P40 | ~50 min | 2 tasks | 3 files |
| Phase 27 P41 | ~55 min | 2 tasks | 3 files |
| Phase 27 P42 | ~50 min | 3 tasks | 9 files |
| Phase 27 P43 | 1h50m | 3 tasks | 4 files |
| Phase 27 P44 | ~1h20m | 3 tasks | 1 files |
| Phase 27 P45 | ~55m | 3 tasks | 4 files |
| Phase 27 P46 | 35m | 2 tasks | 3 files |
| Phase 27 P47 | 75m | 3 tasks | 6 files |
| Phase 27 P48 | ~110 min | 3 tasks | 4 files |
| Phase 27 P49 | ~100 min | 3 tasks | 2 files |
| Phase 27 P50 | 95m | 3 tasks | 10 files |
| Phase 27 P51 | 40m | 3 tasks | 5 files |
| Phase 27 P52 | 55m | 3 tasks | 5 files |
| Phase 27 P53 | 50m | 3 tasks | 10 files |
| Phase 27 P54 | 45m | 3 tasks | 3 files |
| Phase 27 P55 | 35m | 2 tasks | 5 files |
| Phase 27 P56 | ~50 min | 2 tasks | 5 files |
| Phase 27 P57 | ~55 min | 3 tasks | 5 files |
| Phase 27 P58 | ~50 min | 2 tasks | 5 files |
| Phase 27 P59 | ~45 min | 3 tasks | 3 files |
| Phase 27 P60 | ~30 min | 3 tasks | 11 files |
| Phase 27 P61 | ~60 min | 3 tasks | 5 files |
| Phase 27 P62 | 22m | 3 tasks | 3 files |
| Phase 27 P64 | 22min | 3 tasks | 13 files |
| Phase 27 P63 | 41m | 3 tasks | 5 files |
| Phase 27 P65 | 2h10m | 3 tasks | 10 files |
| Phase 27 P66 | 38m | 2 tasks | 1 files |
| Phase 28 P01 | 55m | 3 tasks | 7 files |
| Phase 28 P02 | ~75m | 4 tasks | 6 files |
| Phase 28 P03 | ~70m | 3 tasks | 13 files |
| Phase 28 P04 | ~95m | 3 tasks | 13 files |
| Phase 28 P06 | ~75m | 2 tasks | 6 files |
| Phase 28 P05 | 19m | 3 tasks | 14 files |
| Phase 28 P07 | 35m | 3 tasks | 12 files |
| Phase 28 P08 | ~80m | 4 tasks | 6 files |
| Phase 29 P01 | 55m | 3 tasks | 12 files |
| Phase 29 P02 | 38min | 3 tasks | 16 files |
| Phase 29 P03 | 35min | 3 tasks | 15 files |
| Phase 29 P04 | 70m | 3 tasks | 12 files |
| Phase 29 P05 | 25min | 3 tasks | 17 files |
| Phase 29 P06 | 30min | 2 tasks | 18 files |
| Phase 29 P07 | 55min | 3 tasks | 9 files |
| Phase 29 P08 | 70min | 2 tasks | 7 files |
| Phase 29 P09 | 85min | 2 tasks | 8 files |
| Phase 29 P10 | 95min | 2 tasks | 7 files |
| Phase 29 P11 | 62min | 2 tasks | 9 files |
| Phase 29 P12 | 71min | 2 tasks | 10 files |
| Phase 29 P13 | 62min | 3 tasks | 3 files |
| Phase 29 P14 | 14m | 3 tasks | 4 files |
| Phase 29 P15 | 18m | 3 tasks | 3 files |
| Phase 29 P16 | 42m | 3 tasks | 4 files |
| Phase 29 P17 | 58m | 3 tasks | 3 files |
| Phase 29 P18 | 42m | 3 tasks | 6 files |
| Phase 29 P19 | 14min | 1 tasks | 1 files |
| Phase 29 P20 | 18m | 3 tasks | 7 files |
| Phase 29 P21 | 42m | 3 tasks | 6 files |
| Phase 29 P22 | 35m | 3 tasks | 4 files |
| Phase 29 P23 | 30m | 3 tasks | 4 files |
| Phase 29 P24 | 45m | 4 tasks | 5 files |
| Phase 29 P25 | 95m | 3 tasks | 5 files |
| Phase 29 P26 | 101m | 3 tasks | 2 files |
| Phase 29 P27 | 24min | 3 tasks | 4 files |
| Phase 29 P28 | 51min | 3 tasks | 6 files |
| Phase 29 P31 | 82min | 3 tasks | 3 files |
| Phase 29 P30 | 90min | 3 tasks | 5 files |
| Phase 29 P32 | 26min | 3 tasks | 4 files |
| Phase 29 P29 | 50min | 3 tasks | 3 files |
| Phase 29 P33 | 20m | 3 tasks | 3 files |
| Phase 29 P34 | 55m | 3 tasks | 6 files |

## Accumulated Context

### Roadmap Evolution

- **v2.1 roadmap created (2026-07-28):** 7 phases (27–33), numbering CONTINUED from v2.0 (last phase 26, NOT reset). All **46** v2.1 requirements mapped to exactly one phase — 100% coverage, 0 unmapped, 0 duplicated: KIT-01..03 + SPAWN-01..07 → Phase 27; AUDIT-01..04 → Phase 28; LANG-01..08 → Phase 29; AUTO-01..07 → Phase 30; UATX-01..06 → Phase 31; DASH-01..08 → Phase 32; CAP-01..03 → Phase 33. **Count correction recorded, not silently fixed:** REQUIREMENTS.md prose says "all 41 requirements retained"; the enumerated set is 46 (the "41" predates the final category split). Scope unchanged — the milestone's own founding defect (a hand-maintained count drifting from enumerated reality) caught by counting instead of trusting.
- **v2.1 phase order follows the research dependency spine verbatim** (SUMMARY.md "Phase Ordering Rationale" — three independent researchers converged; no deviation): (1) **27 before everything** — the kit-set authority must be derived from the filesystem BEFORE 17 new adapter files exist, or they land outside `WR05_SCAN`/`ADAPTERS`/`CTX_WORKFLOWS` entirely, which is the exact mechanism by which the current spawn defect survived a whole milestone; (2) 28 before 29 — the audit produces the safety-surface exclusion list + the public-claim registry the language rewrite consumes as inputs; (3) 29 before 30 — the language pass touches governance prose, so running it after 30 would rewrite freshly-written text and re-run Phase 30's expensive red-team gate twice; (4) **30 is deliberately the expensive phase** — direct successor to Phase 25, red-team rounds budgeted AS SCOPE not overrun; (5) 31 after 30 — browser evidence enters through verify-before-write, whose dialability 30 settles; (6) 32 last among features — read-only, lowest blast radius; (7) 33 last overall — both items are milestone-wide proofs, not features.
- **v2.1 acknowledged ordering tension (recorded, not resequenced):** CAP-02 (Windows CI green) sits in Phase 33 but unblocks Phase 32's `fs.watch` Windows surface. Rather than resequence, Phase 32 states its Windows behaviour as `UNKNOWN - verify` until Phase 33 turns the leg green — honest pending over an assumed pass.
- **v2.1 honesty floor baked into success criteria** (these are never asserted as shipped claims): controlled language improving LLM comprehension is `UNKNOWN - verify` (no study located); ASD-STE100 conformance is NOT mechanically decidable, so the guard is named for its decidable subset only and the dictionary is never vendored (redistribution rights `UNKNOWN - verify` — assume NO); STE likely INCREASES token count, so it is justified on determinism grounds never as a token-economy win; caveman-as-token-economy is DISPROVEN on this artifact (blocks restate rather than compress; 6% of role bytes, 3,980 / 66,208); Claude in Chrome can only ever be `verified_by: <named human>`, never a `§14-gate` stamp; the spawn fix is proven by a CAPTURED live run (Phase 33), never by a green suite — the green suite is what missed the defect.
- **v2.1 LOCKED decisions baked into phase goals** (ratified at kickoff 2026-07-28): voice split by surface (caveman stays in the fenced identity block; an STE-derived profile governs procedural/agent-written surfaces); Out of Scope amended to permit a read-only/derived/local board view (hosted-SaaS and every write path stay out); the four safety floors become dialable behind a two-key named-human opt-in an agent cannot self-set, never deleted and never silent; Claude Code floor **v2.1.219+ at depth 3** (superseding v2.0's stale "v2.1.172, depth ≤5"; the v2.1.217–218 depth-1 window is deliberately excluded because it silently completes work inline — supporting it would mean shipping a detector for a bug rather than a floor above it); a byte ceiling is NEVER raised to accommodate growth (`orchestrator.md` has 8 bytes of margin — 7562B against a 7570B hard FAIL ceiling — and must be trimmed BEFORE Phase 27 adds spawn-allowlist text); zero new runtime dependencies (confirmed net `package.json` change: none).
- **v2.1 research flags** (carry into planning): Phases **27, 30, 31, 32** need `/gsd-plan-phase <n> --research-phase`. 27 — the main-thread-vs-subagent coordinator wiring (`--agent` / `settings.json` `{"agent": ...}`) validated against `install.ts`'s real `materializeAdapter()` flow, a platform-schema integration point grugops has not used before. 30 — the two-key floor-lowering mechanism and the `test_integrity`-to-point-of-effect move both touch `emitVerdict()`, a byte-frozen safety path, and deserve their own red-team round separate from the rest of the phase. 31 — whether `mcp__claude-in-chrome__*` reaches a subagent is `UNKNOWN - verify`; the phase's core recommendation (Playwright as the floor) does not depend on the answer. 32 — the board ticket-row grammar is genuinely unmeasured in the wild (two disagreeing HTML-comment examples only); sample real agent-written rows BEFORE freezing the grammar, or the parser becomes a de-facto spec agents then drift away from. Phases **28, 29, 33** use established patterns — skip `--research-phase`.
- **v2.0 roadmap created (2026-06-16):** 7 phases (20–26), numbering CONTINUED from v1.2 (last phase 19, NOT reset). All 28 v2.0 requirements mapped to exactly one phase — 100% coverage, 0 unmapped: SCTX-01..05 + CLAIM-01/02 → Phase 20; VFY-01..04 → Phase 21; CMP-01..03 → Phase 22; PAR-01..04 + CLAIM-03 → Phase 23; MIGR-01..04 → Phase 24; GOV-01/02 → Phase 25; DOGF-01..03 → Phase 26.
- **v2.0 phase order honors the research foundation-first build spine** (SUMMARY.md "Phase Ordering Rationale"): (1) foundation before content — substrate + atomic-write helpers + verify-stamp hooks + queue + grep guard FIRST (20) before any role writes; (2) verify before remove — the §14-gate verifier wired (21) before handoffs become the sole memory; (3) compact before fan-out — two-tier compaction (22) before the first parallel run makes the 15x token tax real; (4) substrate wired before handoffs deleted — parallel + sequential both built on the one substrate (23) before clean handoff removal (24); the WR-05 inversion is one coordinated flip in 23 (guard + packaging + catalog); (5) governance last-but-one (25); (6) the equivalence oracle LAST (26) — meaningful only when both paths are wired end-to-end.
- **v2.0 honesty floor baked into success criteria:** grugops's OWN success/cost gain is `UNKNOWN - verify` until the Phase-26 dogfood measures it — DeLM's +10.5pp / ~50% benchmark numbers are NEVER claimed as grugops's (Phase 26 SC3). "Verified" means passed the §14 behavior gate, recorded as an auditable `verified_by: §14-gate#id` stamp; refuse-self-set is a validator FAIL proven by a RED fixture (Phase 21 SC2). A3/DOG-02 is retired ONLY when the equivalence oracle passes — never on handoff deletion alone (Phase 26 SC4).
- **v2.0 LOCKED decisions baked into phase goals** (PROJECT.md Key Decisions): parallel-first / Claude-Code primary (strict 5-tool parity retired — the four CLIs degrade to sequential, never break); clean replacement of handoffs (shared context = sole inter-role memory); context index = committed derived JSONL guarded by `freshness:context` (markdown wins); reverse the v1.1 no-spawn rule for Claude Code only (inverted `guard_wr05`); CC floor v2.1.172 nested spawning (depth ≤5, width capped by `queue.wip_limit`); zero new host runtime deps (`node:fs` + markdown + the `Agent` tool on the v1.2 committed-`.js` layer).
- **v2.0 research flags** (carry into planning): Phase 26 needs `/gsd-plan-phase --research-phase 26` (first true parallel dogfood; equivalence-oracle + cost-measurement design are novel; `isolation: worktree` ↔ shared-context-path interaction UNKNOWN until exercised). Phase 24 needs a complete pre-deletion grep enumeration of every handoff reference before planning (largest blast radius). Phase 23 WR-05 inversion is a coordinated multi-file flip; the worktree/shared-context interaction is UNKNOWN. Phase 20 must include Windows + NFS-like behavior tests or mark the cross-platform claim `UNKNOWN - verify`. Two human decisions surfaced in research were RESOLVED at kickoff: JSONL = committed derived (freshness:context gate added); CC floor = v2.1.172 nested.
- Phase 19 added (2026-06-16): Factory Auto-UAT Harness — Tier 1 deterministic oracles + Tier 2 `claude --print` headless E2E to honestly automate the deferred live-runtime human UATs (A1 plugin-cache pointer resolution / D-31, A2 live hook firing / SAFE-02, A3 sub-agent dual-path parity / DOG-02) + B3 WR-05 wording cross-check. Tier 3 (B1/B2 persona/prose judgment, Phase 11) is explicitly OUT of scope — stays human sign-off. Reopened v1.2 (was milestone_complete but never archived). Rationale captured in quick task [260616-faw](./quick/260616-faw-automate-remaining-human-uats-feasibilit/260616-faw-PLAN.md).
- Phase 29.1 inserted after Phase 29: Per-Role Model Assignment — config-dial model tiers per role (opt-in preset, aliases only, zero-config unchanged)

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [27-33]: D-43 arm 1 consults NO character class — implemented as `startsWith(payload) && !isLegalDelimiter(...)`; the declared class is used only to NAME the offending code point in the message, and a message cannot change a verdict.
- [27-33]: D-43 arm 2's invisible class is the complement of `{L, N, P, S}`, deliberately NOT Unicode's own `graphic` (`{L, M, N, P, S, Zs}`), which includes combining marks and would let a leading U+0301 through.
- [27-33]: Set equality between the guard's scan and the false-red control's corpus is DOCUMENTATION OF INTENT, never an assertion — after the relocation it compares one object with itself. The two-sided cardinality (26) plus per-part SET equality against each lister are what can actually fail.
- [27-33]: The measured coordinator grant closure is **16**, not the 17 plan 27-33 stated — the coordinator does not grant a spawn of itself. The case asserts the measured fact and derives it from that rule.
- [27-34]: The plugin-form set is folded into the SINGLE exported composition in `kit-model`, never a second one in the guard — a local splice would leave the false-red control vouching for a strict SUBSET, the hole 27-33 closed by relocating the composition.
- [27-34]: The composition pin is **33** (agent 17 + standalone skill 7 + plugin skill 7 + packaging 2), two-sided, with per-part SET equality on ALL FOUR parts. A membership claim about only the part being ADDED is not enough: a scratch build swapping the standalone-skill part for the plugin members holds the total at 33 and passes the count.
- [27-34]: The plugin set is deliberately OUT of `ADAPTERS` — that list feeds the byte ceilings and the KIT-03 role-corpus equality, which ask about agent identity, and a distribution mirror has no role behind it. KIT-03's verdict is unchanged at `17 == 17 == 17`, which is the mechanical proof it did not leak.
- [27-34]: The pair rule's name normalization is a REWRITE, and each side's declared name is asserted against the name its own directory implies FIRST. A deletion-based normalization passes every other control identically while accepting a wrong command name — proven by scratch build.
- [27-34]: `skills/grugops/SKILL.md` is exempted BY NAME with a measured **448**-byte delta (the plan stated 446), the reason being the standalone form's kit-root resolver block; the exempted file remains inside the spawn-grant scan, so the exemption forgoes only the mirror assertion.
- [27-34]: A SINGLE leading U+FEFF is this parser's ONE normalization (D-39 point 1), so it does NOT reach the parse-failure branch — the grant behind it is read and convicted as a rogue spawner. The refusing forms are two leading marks or a mark trailing the payload; all three outcomes are pinned on both skill surfaces.
- [27-34]: The plan's plugin/standalone byte table was systematically 11-13B low on every row. The plan's INFERENCE (identical modulo the name value) is correct and was re-verified mechanically; no literal byte count was written into code.

- [26-06]: A2 prod-deploy-deny matcher anchored STRUCTURALLY on `"permissionDecision":"deny"` (hooks/guard.ts:90-100), NOT on quotable prose — the offline RED test proved a prose anchor false-TRUEs the `docs/dogfood-human-runbook.md:129` verbatim deny block-quote; the structural anchor closes the doc-quotation vacuity vector (T-26-A2, the terminal STRUCTURAL-fix lesson).
- [26-06]: `claude -p --output-format json` hook-decision reachability left `UNKNOWN - verify` (help documents json only as a "single result"; a captured authed run is out of scope, GAP-D1). Structured anchor PREFERRED because it fails CLOSED (honest pending), never a vacuous prose TRUE.
- [26-06]: A3-N node-runner Bash grant = `--allowedTools "Bash(node *)"`, verified verbatim against `claude --help` v2.1.206 (narrowest scoped form, mirrors the documented `Bash(git *)` example; the blanket skip-all-permissions bypass is prohibited in committed test code).
- [26-06]: DOGF-01/DOGF-02 NOT marked complete and REQUIREMENTS.md untouched — the live dual-path / N-agent confirmation stays DEFERRED (SC4, GAP-D1). This plan only repairs the harness so it CAN run green on a future authed box; Phase 26 is therefore NOT complete (roadmap phase-Complete flip reverted).

- [v1.2 Roadmap]: 8 phases, numbering CONTINUED from v1.1 (Phases 10–17, NOT reset to 1). All 28 v1.2 requirements mapped to exactly one phase, 100% coverage, 0 unmapped — SDLC-01/02/03 → Phase 10; PERS-01/02/03 → Phase 11; BDD-01/02/03 + TDD-01/02 → Phase 12; UI-01/02/03 → Phase 13; SEC-01/02/03 → Phase 14; UIQA-01/02 + TINT-01/02/03 + LINT-01/02 → Phase 15; MIGR-01 + UPD-01 → Phase 16; DOCS-01/02 → Phase 17.
- [v1.2 Roadmap]: Phase order honors the research dependency-ordered build sequence — audit + foundation guards FIRST (10), senior personas as the substrate (11), then BDD+TDD (12), frontend/UI (13) + security/ASVS (14) as independent parallel content streams, §14 gate CONVERGENCE consuming 12/13/14 (15), install migrate/update as an INDEPENDENT track (16, may run parallel to 11–15), browsable docs catalog LAST since it documents the finished set (17).
- [v1.2 Roadmap]: Config dial FOLDED INTO the foundation phase (Phase 10) rather than a standalone phase — SDLC-03 (the config-dial contract) is itself a foundation guard, and the actual schema edits (json + .md twin + seed, atomic) land in Phase 10 so every later capability builds against a real config schema. New keys: top-level `bdd` + `security.asvs_level`/`security.block_on`; gate-execution knobs nested under `quality` (`tdd`, `lint{strict,autofix}`, `ui_e2e`, `test_integrity`, `gate_enforcement`).
- [v1.2 Roadmap]: Foundation guards front-loaded in Phase 10 (pitfalls 1,3,4,5,6 mitigated before content lands) — WR-05 spawn-grant grep, single-source adapter-size check, AGENTS.md byte-budget check (32 KiB Codex cap), voice-discipline lint over security/compliance/warning surfaces. Each fails red, never fabricated.
- [v1.2 Roadmap]: Hard constraints carried into every phase framing — markdown-only kit (stdlib-only scripts, no npm deps in grugops itself); single-source role text (adapters are thin pointers, never forked); config-dial lean-default (zero-config still runs); two-voice discipline (grug in prompts; clear voice in security/compliance/warnings); no-fabrication (`UNKNOWN - verify`, never fake a gate/test/citation); single-window sequential role-load (NO spawn tool in packaging templates — WR-05 retired in Phase 11); two-root kit/state split; humans-hold-merge/deploy unchanged + mechanical.
- [v1.2 Roadmap]: New workflow ordinals are 14 (UI design→build, Phase 13) and 15 (security-audit, Phase 14); the frozen 00–13 must NOT renumber (a renumber ripples through every Orchestrator workflow-map reference). New 17th role `roles/frontend-ui.md` in Phase 13.
- [v1.2 Roadmap]: §14 gate stays single-source — ALL gate changes (lint + UI/E2E + test-integrity) land in `05-pr-quality-gate.md` step 3/4 ONLY, never forked into workflows 14/15; the bounded `self_fix_attempts` loop wraps the whole expanded sequence unchanged; the three terminal results (`READY_FOR_HUMAN_REVIEW` / `BLOCKED_NEEDS_FIX` / `SPLIT_REQUIRED`) preserved.
- [v1.2 Roadmap]: Test-integrity is a trace-integrity SAFETY carve-out — `quality.test_integrity` is never fully dialable off (warn | block only); structured-justification escape hatch (reason + named owner + ticket/REQ-ID + expiry + closed-list category), agent may NOT self-author; RED fixture proves a hollow justification fails. Mirrors the prod-deploy hook's refuse-self-set.
- [v1.2 Roadmap]: Install migrate/update (Phase 16) is RED-harness-first, never-delete-first (rename-to-backup; deletion only behind `--prune-old-kit`), byte-parity sh/Node, re-run no-op — highest-blast-radius pitfall, references the v1.1 CR-01 unbounded-marker-strip fix.
- [v1.2 Research flags]: download the pinned ASVS 5.0.0 CSV before authoring the Phase-14 checklist (verify level-column name/position); verify playwright-bdd 9 ↔ @playwright/test 1.60.x compatibility before the Phase-15 gate work (bump both together); verify role/workflow frontmatter completeness before the Phase-17 catalog (emit `UNKNOWN - verify` if absent). Traceability extension = Option 1 (in-cell, zero header churn) per ARCHITECTURE.md — confirm before BDD/TDD wiring.
- [Init]: Build the full v2 spec (core + enterprise pack) this milestone, not lean-first
- [Init]: Ship both distribution forms — standalone `.claude/` and plugin + marketplace
- [Init]: Enforce prod-safety mechanically via a plugin-level PreToolUse hook (not subagent frontmatter)
- [Roadmap]: Phase order follows the research dependency chain — config/IDs/board → contracts → roles → workflows → packaging → validation/dogfood; never place a consumer before its dependency
- [Phase ?]: [01-02] version seeded to 0.1.0 (D-02 divergence from spec 2.0.0; final string is a Phase-5 decision)
- [Phase ?]: [01-02] config dial ships populated with lean defaults; zero-config holds because defaults are documented (CONFIG-03)
- [Phase ?]: [01-04] state-plane seed files (traceability/nfr-catalog/metrics) reproduce §10/§11/§6.5 vocabulary verbatim (D-00); ship empty — headers + format comment, zero live data rows, generic ABC prefix (D-03/D-04)
- [Phase ?]: [01-05] VERSION seeded to 0.1.0 (matches config); README written fully now satisfying STRUCT-02 — start-here → orchestrator.md, AGENTS.md noted as Phase-3 deliverable (D-02/D-05/D-06)
- [Phase ?]: [01-03] board.md ships Kanban columns only (scrum overlay → plans/sprints/); per-column WIP headings sourced verbatim from factory.config.json#wip_limits; sizing/priority/Blocked defined once for both cadences (BOARD-01/BOARD-04, D-00/D-03)
- [Phase ?]: [02-01] Inlined the §8 universal header byte-identically into all 11 core handoffs (A2); each file independently copy-paste-usable; verified single distinct header-block hash
- [Phase ?]: [02-01] ticket-ready-packet.md carries one field per definition-of-ready.md §9.1 check + explicit cross-reference (D-09); handoff bodies kept byte-faithful to §8 with no _Updated: opener
- [Phase 02]: [02-02] release+incident bodies reproduced byte-identically to spec §8.1/§8.2 (diff-verified); §8.3/§8.4 headings verbatim
- [Phase 02]: [02-02] retro-notes Metrics snapshot cites frozen plans/metrics.md names; sprint-plan uses literal SPRINT-xx placeholder faithful to §8.5 prose
- [Phase ?]: [02-03] All 10 gate checklists reproduced byte-identically from spec 9.1-9.10 (diff-verified); kind: checklist + tier: lean|enterprise per LOCKED D-14; security/compliance content is clear voice with no fabricated control
- [Phase ?]: [02-03] Index frontmatter convention LOCKED to 'kind: index' (no tier:) -- same choice reused for memory-bank/00-index.md in Plan 04 per D-14 'decide once'
- [Phase ?]: [02-04] memory-bank seed ships 8 generic empty-but-shaped files + 50-decisions/ADR-template.md; index uses kind: index (no tier:) reused from 02-03 per D-14; _Updated: <date>_ opener applied to all 9 (D-03/D-04/D-10)
- [Phase ?]: [02-04] 00-index.md states the working-memory contract (read-on-start, 60-progress = plan-of-record kept by daily sweep, 50-decisions = ADRs); ADR-template.md is non-numeric so it never trips the Phase-6 ADR-NNNN validator (MEM-01/MEM-02, D-11/D-12)
- [Phase ?]: [03-01] check-structure.sh encodes the full VALIDATION.md suite (checks a-g) and ships RED — the phase's running acceptance gate, green as Waves 2-3 land
- [Phase ?]: [03-01] orchestrator.md authored FIRST (D-20): byte-exact caveman prompt, 13-arrow routing matrix, 15-item classification, WIP/DoR gate, SPLIT_REQUIRED, 10-section Decision output naming (not inlining) Phase-4 workflows, verbatim clear-voice hard limit
- [Phase ?]: [03-02] agents-md-scribe is the single OWNER of the 12 rules (D-19) — carries NO generic pointer; authors them in AGENTS.md and states ownership in its Output section
- [Phase ?]: [03-02] both mappers state 'no board transition' explicitly (D-23) and NAME their Phase-4 runtime outputs (memory-bank/brownfield-map.md, greenfield-plan.md) without seeding them
- [Phase ?]: [03-03] ba-pm.md + system-analyst.md cite the REAL agent-factory/handoffs/ paths — resolving the HIGH-impact §5 plans/-prefix drift (D-15)
- [Phase ?]: [03-03] ba-pm.md owns Backlog → Ready (names plans/epics|features|tickets); system-analyst.md owns the In Analysis exit
- [Phase ?]: [03-04] architect-design.md emits architecture-handoff.md + ADRs (from frozen ADR-template into 50-decisions/ADR-000X) and seeds plans/nfr-catalog.md; owns the In Design exit
- [Phase ?]: [03-04] software-engineer.md reads implementation-ready-packet first, emits implementation-handoff.md, owns In Development -> In Review; the no-fake-results hard limit (spec L468) is in CLEAR voice (D-21)
- [Phase ?]: [03-05] qe-e2e/security-nfr/uat-planner authored — completes ROLE-01 (11/11 core roles); each verbatim caveman prompt + frozen-path tissue, owns its board exit (In Review / In Security/NFR / In UAT)
- [Phase ?]: [03-05] security-nfr.md security/compliance explanation text in CLEAR voice (D-21); carries full §5.A.10 trigger list + PASS|PASS_WITH_RISKS|BLOCKED result and cites security-nfr-checklist + nfr-catalog
- [Phase ?]: [03-06] release-manager/compliance-officer/incident-responder authored — 3 of 5 enterprise roles (ROLE-02 partial); each tier: enterprise with a D-22 trigger, verbatim §5.B caveman prompt, real frozen-path handoffs
- [Phase ?]: [03-06] Release Manager human deploy-gate reproduced VERBATIM in CLEAR voice (T-03-EoP/SAFE-01); compliance explanation text CLEAR voice with grug confined to the caveman prompt (D-21)
- [Phase ?]: [03-07] factory-coach.md + installer.md authored — completes ROLE-02 (5/5 enterprise roles, all 16 role files now exist); each tier: enterprise with a D-22 trigger, verbatim §5.B caveman prompt (byte-exact), real frozen-path outputs
- [Phase ?]: [03-07] installer.md stays dispatch-neutral (D-20) — names adapter/entry-file + install-report outputs but inlines NO Phase-5 mechanics; additive/never-overwrite/dry-run/uninstall hard limit in CLEAR voice (T-03-Tamper, D-21)
- [Phase ?]: [03-08] root AGENTS.md authored to the §17.1 9-heading shape, 5064 bytes (under 32 KiB Codex cap); Commands ship 13 UNKNOWN - verify slots, no fabricated command (D-18); Safety rules verbatim clear voice (AGENTS-01)
- [Phase ?]: [03-08] Karpathy's 4 principles / 12 rules reproduced verbatim, single-source in AGENTS.md, clear voice (D-19/D-21); no non-Scribe role restates them; full phase structural suite now GREEN (AGENTS-02)
- [Phase ?]: [04-01] check-structure.sh encodes V-01..V-13 from 04-VALIDATION.md and ships RED — the phase's running acceptance gate; V-04 matches the explicit frozen 14-name list (not a loose regex) so memory-bank/00-index.md is excluded
- [Phase ?]: [04-02] 05-pr-quality-gate.md authored FIRST as the single-source §14 backpressure loop (D-26); 04-ticket-to-pr.md references 05 for the gate and never restates the loop — V-05/V-06 single-source checks green
- [Phase ?]: [04-02] gate commands stay UNKNOWN - verify pulled from AGENTS.md (no fabrication, V-07); 04 honors autonomy=pr / never merge, 05 recommendation-only (SAFE-01, V-11)
- [Phase ?]: [04-03] Wave-1 lifecycle backbone complete: 02/03/06 authored on the 10-section v2 template, reproducing the §7.3/§7.4/§7.7 spines and deriving connective sections from frozen names only (D-24); Metrics sections cite a real subset of the frozen 9, no invented metric
- [Phase ?]: [04-04] 00/01 bootstrap workflows authored on the 10-section v2 template — reproduce §7.1/§7.2 Flow/Done-when spines, derive connective sections from frozen names only (D-24); 00 names memory-bank/greenfield-plan.md as the planning output + leaves plans/initial-plan.md a thin stub; both echo README bootstrap phrasing in the When-to-use opener
- [Phase ?]: [04-04] both bootstrap workflows leave AGENTS.md command slots UNKNOWN - verify (filled per-project by the Scribe at runtime, never fabricated, T-04-04-01); 01 reproduces the Security/NFR high-risk scan with PASS|PASS_WITH_RISKS|BLOCKED + BLOCKED-halts stop (T-04-04-02); V-02/V-03/V-12 green for both
- [Phase ?]: [04-05] 08-sprint-planning + 10-sprint-review authored — scrum-only single-set members; 08 reproduces the §6.2 SPRINT-xx.md field list (Goal/Dates/Capacity/Committed/Added mid-sprint/Carried out/Velocity/Burndown/Notes for retro), 10 appends review notes to the same file; both tagged cadence=scrum with NO filename suffix (D-25); V-08/V-02/V-03/V-10/V-12 green for 08/10
- [Phase ?]: [04-06] 07/09/11 both-cadence ceremonies authored on the 10-section v2 template; all carry cadence: both and declare both-cadence applicability in When to use (D-25), single config-gated set
- [Phase ?]: [04-06] 09-daily-sweep is the BOARD-02 reconciliation engine — board<->ticket-status reconciliation across all 13 frozen columns, WIP throttle, escalation past blocked_escalation_days, emits Cycle time/WIP/Blocked time; V-09/V-10 green
- [Phase ?]: [04-07] 12-release + 13-incident authored on the 10-section v2 template, completing the 14-workflow suite; 12 renders the named-human deploy gate (SAFE-01) keyed to production_requires_human_confirmation, dispatch-neutral (mechanical hook deferred to Phase 5); 13 renders the blameless postmortem (FLOW-04). Full check-structure.sh harness now GREEN (V-01..V-13, exit 0) — Phase-4 acceptance gate met.
- [Phase ?]: [05-01] adapters.md is the authoritative current 5-tool dispatch map (supersedes README pre-D-29 CC row); every row flagged 'verify against current tool docs'; Claude-only mechanical guard + autonomy=pr fallback documented (PKG-01)
- [Phase ?]: [05-01] PKG-02 templates fix Agent (not Task) + model: inherit + skills/ form (D-29) + dash-standalone/colon-plugin naming asymmetry once; pointer-only, no copied role text
- [Phase ?]: [05-01] Phase-5 check-structure.sh encodes PKG-01/02 + CLAUDE-01/02/03 + SAFE-02 + INSTALL-01/02 and ships RED — PKG checks green now, the rest fail cleanly until Waves 2-3 land
- [Phase 05]: [05-04] SAFE-02 guard is code, not prose: pure-Node PreToolUse deny-JSON hook (hooks/guard.mjs) wired plugin-level via ${CLAUDE_PLUGIN_ROOT} (hooks/hooks.json); denies config-matched prod-deploys unless human-set GRUGOPS_PROD_DEPLOY_APPROVED is in process env, refuses inline self-set, fails closed (D-32/33/34)
- [Phase 05]: [05-04] guard deny reason is clear professional English naming the env var (no caveman voice, Pitfall 6); hooks/guard.test.sh runs the deny/allow/refuse-self-set triad + fail-closed and exits 0 ALL CHECKS PASSED
- [Phase ?]: [05-02] CLAUDE-01 shipped: 7 standalone dash skills (/grugops-<op>) + grugops-orchestrator subagent (Agent + model: inherit) + additive idempotent CLAUDE.md pointer + .gemini context.fileName wiring — all pointer-only, single-source (dup-check 0 hits)
- [Phase ?]: [05-02] grugops-release carries disable-model-invocation: true (T-05-02-EoP-1) — agent can never auto-fire a release; complements the SAFE-02 mechanical deploy guard
- [Phase ?]: [05-02] repo-root CLAUDE.md pointer appended via GSD:grugops-start-here sentinel block (T-05-02-Tamper-2) — existing dev-instructions preserved, idempotent re-run adds no duplicate
- [Phase ?]: [05-03] CLAUDE-02/03 shipped: .claude-plugin/plugin.json (name grugops, version 0.1.0 == VERSION per D-28, no component keys) + marketplace.json (entry source ./, no entry version) + 7 plugin-root colon-form skills (/grugops:<op>) — dirs omit grugops- prefix (D-29/Pitfall 5)
- [Phase ?]: [05-03] plugin skill bodies are repo-relative pointer-text reused verbatim from the 05-02 standalone bodies (D-31, no ../agent-factory cache landmine, dup-check 0 hits); skills/release carries disable-model-invocation: true (T-05-03-EoP-1)
- [Phase ?]: [05-03] claude plugin validate ./ --strict is the authoritative structural gate — it flagged the missing top-level marketplace description (Open Question 2 / #38480), so one was added; validator then exits 0 (pass not fabricated)
- [Phase ?]: [05-05] install.sh + install.mjs functionally identical with byte-identical target tree; GRUGOPS_SRC/TARGET env-overridable for hermetic test harness (INSTALL-01)
- [Phase ?]: [05-05] uninstall fully reverses both .gemini install paths (grugops-created default removed wholesale; user-customised file trimmed of only AGENTS.md, other keys preserved); is_protected denylist guards agent-factory/ plans/ .planning/ docs/ src/ on every removal (INSTALL-02)
- [Phase ?]: [05-05] SAFE-02 docs clear voice: mechanical guard Claude-Code-only, other 4 tools use autonomy=pr procedural fallback; README states 0.1.0 with VERSION+plugin.json synced-bump; full Phase-5 check-structure.sh now GREEN (all 8 reqs)
- [Phase ?]: [06-01] VAL-01 validator is stdlib-only Node ESM (node:fs/path/url), zero npm deps, no package.json (D-45); VALIDATE_ROOT env-override self-validates the own tree; two-tier errors[]/warnings[] + --strict promotion (D-44); prefix-match section presence (never exact/unique, Pitfall 1/2); vacuous-on-zero-tickets board<->ticket + traceability (D-43); read-only by construction, every read/JSON.parse try/catch fail-closed
- [Phase ?]: [06-01] validate.test.sh in the guard.test.sh idiom proves pass AND fail (D-45): own tree GREEN bare+--strict, GOOD fixture exit 0, four one-mutation BAD trees each caught with its finding token (Hard limits/mode/name/status+column), warn-only-no-trace proves --strict warning-promotion; fixtures committed static (67-file complete-named GOOD set), frozen harnesses untouched
- [Phase ?]: [06-02] BRAND-03 five SVGs shipped: §6.3 color wordmark + §6.4 icon as-given (light cleanup only — dropped wordmark's redundant transparent rect, added aria-label); three D-50 mechanical derivations (mono-dark all-Charcoal #2C2A28, mono-light/reverse all-Bone #F3ECE0, lockup icon scale(0.625) left of wordmark in 472x96); palette locked to the four BRAND-03 hex (Moss/Ember excluded), lowercase grugops, no children's-book resemblance, palette-clean grep passes
- [Phase 06]: [06-04] EX-01 illustrative half shipped: examples/02-brownfield-bootstrap, 04-sprint-cycle, 05-release-run — medium-depth narration of frozen §7 spines (input → inline # Orchestrator Decision → real board (WIP n/m) headings → REAL handoff filenames → trace/metrics line); each opens with the exact D-47 honesty banner + placeholder IDs (ABC-001/REL-0007/<PR-link>); 04 has 2 board snapshots + a velocity line from the frozen §6.5 set; 05 renders the named-human deploy gate in CLEAR voice + completed | … | Done | traceability rows; /grugops only (D-49), agent-factory/ + plans/ untouched; #1/#3 REAL captures fall out of the Plan 05 dogfood
- [Phase 06]: [06-05] Hybrid dogfood: agent-proven REAL half complete (out-of-repo TS/Node+Fastify sample, ABC-001 idea->PR, gate READY_FOR_HUMAN_REVIEW, validator exit 0 on sample + own tree -- DOG-01 met, EX-01 #1/#3 captured); the three live-CC items (D-31 plugin-cache pointer resolution, SAFE-02 live hook firing, CC sub-agent spawn + CC-native parity column) DEFERRED to milestone-close UAT at the user checkpoint (resume=deferred), cells stay pending human, never fabricated -- DOG-02 partial (sequential done, CC-native deferred)
- [v1.1 Roadmap]: 3 phases, numbering CONTINUED from v1.0 (Phase 7-9, not reset to 1); 8 requirements mapped — SHOME-01..04 → Phase 7, INSTALL-03/04 → Phase 8, INSTALL-05 + VAL-02 → Phase 9
- [v1.1 Roadmap]: Phase order honors the research FORCED build order — split convention + resolution mechanism + ~31-file rewrite (P7) → installer (resolve `$GRUGOPS_HOME`, copy, materialize abs kit path, `--target`/`--yes`, seed `.grugops/`+`plans/handoffs/`) (P8) → `--check` doctor + two-root validator + `install.test.sh` (P9). Rewrite + materialize-mechanism kept together so doctor and validator key off the final ref spelling.
- [v1.1 Roadmap]: LOCKED decisions baked into phase goals — kit home `${GRUGOPS_HOME:-$HOME/.grugops}` (NOT XDG, NOT literal `~`); default COPY not symlink; per-repo config at **`.grugops/factory.config.json`** with install marker/version stamp in `.grugops/` (per SHOME-02 — overrides the older ARCHITECTURE.md repo-root recommendation); installer MATERIALIZES the absolute kit path into standalone adapters (LLM cannot expand `$GRUGOPS_HOME` in prose) + one-line bash self-heal fallback; zero-dep (sh + Node stdlib, no package.json); never overwrite/delete user content.
- [v1.1 Roadmap]: Gating pitfalls in success criteria — C1 grep-to-zero-bare-refs build gate (Phase 7 SC#5); C3 no-fallback-to-`.` / unset-`$GRUGOPS_HOME` BAD fixture (Phase 9 SC#3-4). C2/migration is DEFERRED to v1.2 (MIGR-01), now Phase 16.
- [Phase ?]: [07-02] handoff instance <stage> tokens FROZEN (product/system/architecture/impl-ready/implementation/qe/security-nfr/uat/ticket-ready/release/postmortem/retro/refinement/sprint-plan); Plan 03 workflows MUST reuse byte-identically. Step-4 split + all 13 op-skill invariants landed; zero config refs in role/skill set.
- [Phase ?]: [07-03] Workflow tier rewritten: 13 workflows read .grugops/factory.config.json (D-02, #quality preserved); all 14 'Handoffs produced' sections + 04/05 read sides (D-06) + 09/12 collective inputs name ticket-scoped plans/handoffs/<ID>-<stage>.md instances; <stage> tokens reused byte-identically from Plan 02; 10-sprint-review untouched
- [Phase ?]: [07-04] Build gate scripts/check-kit-refs.sh ships GREEN (proves a completed rewrite); 3 assertions + SC2 marker over an explicit SCAN set; Assertion 3 scoped to exclude the 3 legal GRUGOPS_HOME sites; O3 included, O2 docs/README pointers deferred to Phase 8
- [Phase ?]: [Phase 08]: [08-01] packaging templates grant NO spawn tool (D-08/WR-05) — single-window sequential role-load via _role-switch-protocol.md is the design, not sub-agent spawning; both packaging templates drop the Agent grant
- [Phase ?]: [Phase 08]: [08-01] runtime config read points at .grugops/factory.config.json in README + factory.config.md (D-09/IN-01); agent-factory/config/factory.config.json preserved as the named SEED SOURCE the installer seeds
- [Phase ?]: [Phase 08]: [08-01] self-contained agent-factory/seed/** bundles config + plans/** + memory-bank/** as faithful copies (config seed byte-identical to kit default, D-01/D-02); check-kit-refs.sh excludes the seed by NOT listing it with a header comment recording why (D-03); kit-ref gate + install.test.sh stay GREEN
- [Phase ?]: [Phase 08]: [08-03] two-root installer landed at sh/Node byte-parity — ${GRUGOPS_HOME:-$HOME/.grugops} resolve, --target/--yes/non-TTY prompt, always-on D-07 self-checkout guard, copy-default flip, atomic copy_kit, content-idempotent materialization of the 2 resolver adapters (strip-then-reinject), seed_state incl. plans/handoffs/, byte-parity install marker (installedAt omitted → byte-zero-diff re-install)
- [Phase ?]: [Phase 08]: [08-03] HUMAN-APPROVED Option A — reconcile ONLY install.test.sh Check 3 to the two-root D-06 contract (grugops-owned adapters+sentinel removed; seeded user state survives); a deliberate pull-forward of a Phase-9/VAL-02 slice. uninstall.sh untouched; two-root harness [11] marker-removal stays RED for 08-04
- [Phase ?]: [08-04] Two-root uninstall: is_protected() guards .grugops/; only .grugops/install.json removed via a dedicated remove_marker() narrow exception; shared GRUGOPS_HOME kit + seeded plans/memory-bank survive (D-06)
- [Phase ?]: [08-04] install/README.md documents the two-root installer (--target/prompt/--yes/copy-default/GRUGOPS_HOME/materialization/D-07 guard/D-06 uninstall scope); no fabricated/deferred claims
- [Phase 09]: [09-01] install.sh --check doctor (INSTALL-05): non-mutating early-exit arm; D-03 three-source kit-root cross-check (rule/marker/adapter); deterministic ordered first-failure stat set with dangling-symlink FAIL; non-empty WARN tier (skew + missing seed); exit matrix 0/nonzero/WARN->0/--strict->nonzero; first reader of .grugops/install.json
- [Phase 09]: [09-01] MAT_OPEN/MAT_CLOSE/MAT_SLOT sentinels moved above the doctor so read_adapter_kit can reference them under --check; materialize_adapter on the install path reuses the same definitions verbatim (zero install behavior change)
- [Phase 09]: [09-01] doctor stat loop iterates without a pipe (IFS-newline for-loop) and writes no temp file - preserves read-only-by-construction (T-09-02) and keeps DOC_FAILS in the current shell scope
- [Phase ?]: [09-02] validator split: VALIDATE_KIT_ROOT no default → unset is a hard exit(1) with a literal (C3) tag (D-08); STATE_ROOT reuses VALIDATE_ROOT (else repo root) so the 8 single-tree fixtures stay valid as state fixtures
- [Phase ?]: [09-02] bare exists/safeRead/listDir helpers REMOVED (not aliased), forked into kit*/state* — every call site is explicitly kit/state-scoped; mixed required-files loop split by Phase-7 classification
- [Phase ?]: [09-02] validate.test.sh is RED-by-design until Plan 09-04 adds the run_fixture_split driver + split fixtures + resolution-parity assertion — the C3 guard firing on the old harness is correct, not a regression
- [Phase ?]: [09-03] install.mjs --check is the byte-parity Node twin of install.sh --check: same D-03 three-source cross-check, ordered first-failure, WARN tier, exit-code matrix, not-installed fold-into-FAIL; proven byte-identical across 12 cases
- [Phase ?]: [09-03] docAbspath (non-normalizing, mirrors sh abspath) replaces node:path resolve() in the cross-check so cosmetic /. segments classify as WARN identically across the sh boundary; MAT_* sentinels relocated above the doctor for the readAdapterKit TDZ under --check
- [Phase 09]: [09-04] Verification layer GREEN: install.test.sh Checks 7-13 (doctor good-split/missing-kit/first-failure/exit-matrix/dangling-symlink/read-only/sh-vs-Node parity) + validate.test.sh two-root (GOOD split / BAD missing-kit / BAD unset-kit C3) + the three-way resolution-parity assertion (sh doctor = Node doctor = Node validator)
- [Phase 09]: [09-04] Resolution-parity proven as spelling-aware path agreement: doctor KIT_ROOT = GRUGOPS_HOME/agent-factory (the dir), validator KIT_ROOT = its PARENT (resolves join(VALIDATE_KIT_ROOT,'agent-factory/...')); assertion compares doctors' kit: line to VALIDATE_KIT_ROOT/agent-factory + asserts no missing-required drift; the half-populated-home AGENTS.md miss is expected installer behavior, not drift
- [Phase 09]: [09-04] RED-by-design 09-02 hand-off discharged: run_fixture now sets BOTH VALIDATE_KIT_ROOT + VALIDATE_ROOT (same tree, Discretion 4 back-compat) + own-tree self-test supplies VALIDATE_KIT_ROOT=REPO_ROOT; the 8 single-tree fixtures + D-42 self-test pass under the no-default kit-root contract; C3 unset-kit BAD check fires on the literal (C3) message
- [Phase ?]: [09-05] doctor parity gap closure (CR-01/CR-02): resolve_grugops_home lexically collapses repeated/trailing slashes to match Node resolve() so --strict exits 0 like Node; a garbled .grugops/install.json folds into the byte-identical not-installed FAIL the Node oracle emits; install.mjs (oracle) untouched; Check 14 + Check 15 are RED-before/GREEN-after parity gates
- [Phase ?]: [09-06] CR-03 fail-closed null-guard: checkConfig + checkPackaging reject a null/array/primitive JSON.parse result with a greppable 'not a JSON object' finding before dereferencing — JSON.parse('null') returns null without throwing, so try/catch alone was not fail-closed; two RED-before/GREEN-after null-literal regression cases (config + plugin) lock the crash path
- [Phase 09]: [09-05 remediation] code-review found 09-05 closed only the exact reported spellings; the parity CLASS is now closed: resolve_grugops_home collapses ./.. segments lexically (awk, no cd/pwd) to match Node path.resolve() (Check 14 trailing-slash stays green); marker_structurally_valid is a pragmatic pure-POSIX (no jq) gate that rejects a marker with a valid kitRoot line + trailing non-JSON garbage (the sh false-green) and folds it into the byte-identical not-installed FAIL the Node oracle emits. New Checks 16/17/18 are RED-before/GREEN-after gates (proven by reverting install.sh). install.mjs (oracle) untouched; install/validate/two-root/check-kit-refs suites all green
- [Phase ?]: [10-01] SDLC-coverage audit (.planning/v1.2-SDLC-COVERAGE-AUDIT.md): lifecycle breadth COMPLETE (all 9 stages owned); 4 real gaps are depth/contract/specialization holes mapping to existing v1.2 phases — GAP-1 business->engineer prose-only contract->Phase 12, GAP-2 senior-judgment persona layer->Phase 11, GAP-3 frontend/UI specialist->Phase 13, GAP-4 leveled security + un-cheatable gate->Phase 14+15; 0 gaps uncovered; verdict roadmap-sufficient, no re-scope (D-03). adapters.md stale-spawn-prose + WR-05 noted as observations (fixes owned by 10-02/Phase 11).
- [Phase ?]: [10-02] Four foundation guards in ONE POSIX-sh aggregator (D-04, no npm deps): guard_wr05 (two EREs over the exact 4-file scan set, frontmatter token only never prose spawn, D-08/D-09), guard_agents_bytes (WARN 20480/FAIL 28672 below the 32768 Codex cap, D-07), guard_adapter_size (byte-based WARN 3072/FAIL 4096, D-07), guard_voice (section-scoped awk-strip of Caveman prompt + word-boundary grug, D-10). Ships GREEN, read-only; fails red on violation.
- [Phase ?]: [10-02] Fail-proof harness: hermetic mirror-and-mutate plants both WR-05 grant shapes + AGENTS.md/adapter oversize + a voice marker, asserts each fails red, plus smoke-green + cmp -s config-JSON byte-identity (guards the Plan 10-03 tri-file drift). adapters.md stale Claude-Code-spawns claim corrected to uniform sequential role-load (D-09); conceptual spawn preserved (D-08); NOT in WR-05 scope.
- [Phase ?]: [10-03] 8 new config-dial keys landed atomically with LOCKED lean defaults across both JSON config files (config/ + seed/, byte-identical cmp -s): top-level `bdd`=lean; new top-level `security` object (asvs_level=L1, block_on=high); `quality.tdd`=encouraged, `quality.lint`={strict:false,autofix:true}, `quality.test_integrity`=warn, `quality.gate_enforcement`=blocking. Phase 10 seeds schema+contract ONLY; behavior wired downstream (Phase 12/14/15).
- [Phase ?]: [10-03] `quality.e2e_when` RENAMED to `quality.ui_e2e` (D-13, same enum) across all 4 sites — both JSON, the .md twin (2 sites), and 05-pr-quality-gate.md step 3 — zero `e2e_when` remaining tree-wide (T-10-03-O orphan check). `lint` kept in BOTH `mandatory_gates` AND the new `quality.lint` object (complementary, not duplicate). `test_integrity` is warn|block, never off (TINT-03 carve-out, documented clear-voice).
- [Phase ?]: [10-03] factory.config.md twin carries a dedicated "Config-dial contract (lean → enterprise)" section (D-11): per-key allowed values · lean default · enterprise escalation for all 8 keys; zero-config prose updated so absent key = lean default (SC4). `gate_enforcement` noted already-strict-at-lean (advisory is the relaxed direction, not the escalation).
- [Phase ?]: [10-04] checkConfig() enum-recognizes the 8 v1.2 dial keys ACTIVE-WHEN-PRESENT / LENIENT-WHEN-ABSENT (D-14): an invalid present value is err() (nonzero even bare) and names the key; a missing key is its lean default (no error, SC4 preserved). quality.lint is shape-checked {strict,autofix} (D-12); test_integrity enum is warn|block — disabling rejected (TINT-03).
- [Phase ?]: [10-04] validate.test.sh gains three hermetic assertions (mktemp -d from fixtures/good, no committed bad-fixture dir): asvs_level=L4 + test_integrity=off both fail red and name the key; fixtures/good (none of the 8 keys) still exits 0 (SC4); cmp -s proves config/ == seed/.grugops/ byte-identical. SC3 fully closed (schema in 10-03, recognition here).
- [Phase ?]: [11-01] Senior persona depth lands as a sharp clause woven into an existing skeleton section, paid for by compressing weak connective prose elsewhere — never a net byte addition (enforces D-04 token economy)
- [Phase ?]: [11-01] 'Flat-or-smaller' (D-04) read as 'within the plan-defined +6% guard_role_size ceiling', not 'below raw baseline'; all 7 wave-1 roles pass their ceilings and guard_voice over the 2 clear-voice safety roles stays green
- [Phase 11]: [11-02] Senior persona depth lands as a sharp clause woven into an existing skeleton section, paid for by compressing weak connective prose elsewhere — never a net byte addition (D-04 token economy); the orchestrator size outlier (banner/Routing matrix/WIP-DoR gate/XL-split/workflow table/clear-voice safety) is preserved verbatim, not normalized away (D-03)
- [Phase 11]: [11-02] All clear-voice safety surfaces deepened in plain English only — release-manager named-human deploy gate (SAFE-01), software-engineer no-fake-results, installer additive/never-overwrite/dry-run, security-nfr PASS|PASS_WITH_RISKS|BLOCKED findings; security-nfr stays guard_voice-clean; all 8 roles within +6% ceilings
- [Phase ?]: [11-03] ba-pm is the 16th and final role rewrite (PERS-01) landed with the senior BA deepening (PERS-02) in one coherent edit; senior BA judgment (INVEST, testable+measurable acceptance, measurable NFR targets, DoR rigor) woven into existing sections, paid for by compression — 2745->3291 B within the 3294 B BA-headroom ceiling (D-04)
- [Phase ?]: [11-03] DoR deepened as the single INVEST + measurable-NFR hub (D-08); INVEST-shaping became one new gated check so its matching '## INVEST shape' field was added to ticket-ready-packet.md in the same task to keep the DoR<->packet 1:1 contract (T-11-05/Pitfall 5); Given/When/Then prose line KEPT, zero Three Amigos/Example Mapping/executable scenarios across ba-pm+DoR+workflow 07 (D-09)
- [Phase ?]: [11-04] guard_voice expanded to all 16 roles (D-05); the marker refinement lands FIRST as a separate per-phrase awk gsub neutralizing /grug + grug voice/wink before the grep, so the all-16 scan ships GREEN with no orchestrator/Scribe false positive and a bare grug-smash still fails (the fence anchor is NOT re-engineered, D-10)
- [Phase ?]: [11-04] D-06 guard_caveman_preserved CAVEMAN_MARKERS = VOICE_MARKERS idioms + ^You\b — the clean caveman blocks are clipped second-person imperatives with NO literal grug idiom, so plain VOICE_MARKERS would ship RED; ^You\b is the cadence separating a real block from a sanded prose rewrite (all 16 hit, sanded prose does not)
- [Phase ?]: [11-04] D-07 guard_role_size uses locked per-file 2026-06-10 ceilings (FAIL +12% / WARN +6%; orchestrator outlier 7041/6664; ba-pm BA headroom 3294/3075) via a POSIX-sh case lookup — NOT a flat number and NOT live-computed; ba-pm at 3291B emits an advisory WARN, build stays GREEN
- [Phase ?]: [11-05] PERS-03 — WR-05 RETIRED: guard_wr05 re-verified GREEN on a fresh post-rewrite run (regen-safety, the LAST check per D-10); the spawn-grant debt marker closed in all 4 locked tracking docs (PROJECT/STATE/SDLC-audit/RETROSPECTIVE); explanatory spawn prose KEPT (D-08); SDLC audit GAP-2 row reconciled to the D-01/D-11 reframe (in-place senior deepening, no new section, terse caveman = token economy)
- [Phase ?]: [12-01] BDD-01 acceptance-contract landed: tiered selector-free ## Acceptance scenarios (Given/When/Then) block in product+QE handoffs (D-02), beside the preserved criteria bar; degrades to lean when bdd dial absent (D-01); hard no-selectors rule (D-03); strict-tier host file+runner left UNKNOWN - verify (host-agnostic)
- [Phase ?]: [12-01] D-14 scenario->trace linkage is an additive in-cell comment convention near ## Trace updates, NOT a schema/column rename of plans/traceability.md; block mirrored byte-identical across both handoffs (1:1 contract shape); no acceptance red/green evidence field here (owned by 12-04)
- [Phase 12-02]: Example Mapping (Three Amigos) hub created mirroring definition-of-ready.md (D-04): terse flat bullets + one fenced worked example, NOT a wall of text; carries the contract-vs-logic seam worked example (D-09) in the hub so it never bloats a byte-ceilinged role file
- [Phase 12-02]: Workflow 07 Three Amigos step inserted as new Step 3 (after INVEST-shape, before sizing per RESEARCH OQ2), steps renumbered 3-6 to 4-7; single dial-gated pointer line (bdd off=skip / lean=BA self-runs all three voices / strict=named; absent=lean), four-card ceremony NOT restated; Phase-11 senior-BA INVEST step untouched
- [Phase ?]: [Phase 12-03] TDD-01 workflow half: workflow 04 Step 3 carries the engineer inner loop (failing unit test -> minimal code -> green -> refactor) + double-loop rule D-08 (outer acceptance stays red until inner closes it; no second acceptance red before first green) + contract-vs-logic seam D-09 pointing to example-mapping.md; quality.tdd named inline (off/encouraged/required, default encouraged); enforcement stays single-source in gate 05 (Phase 15), no mechanical guard authored
- [Phase ?]: [Phase 12-03] D-13 light forward-pointer is an HTML comment in workflow 04 Trace updates (scenarios flow forward to UAT/release, NOT rewritten); workflows 06/02/03 untouched. impl-ready packet TDD line (D-11) under the EXISTING ## Test strategy heading in the file's reference-comment clear-voice style — read-before-coding: which units prove the behavior, which layer owns what, seam points to the hub
- [Phase 12]: [12-05] Role-enforced double-loop guardrails landed as SINGLE terse pointer lines: software-engineer.md carries the inner-loop + contract-vs-logic seam (D-09) pointing to example-mapping.md; qe-e2e.md carries the outer acceptance loop (D-07/D-08) pointing to the QE handoff scenarios block + workflow 04. The workflow routes, the role enforces; the worked example + loop sequence stay in the hub/workflow, never in a byte-ceilinged role.
- [Phase 12]: [12-05] software-engineer.md hit the FAIL ceiling on the first inner-loop+seam draft (3452B vs 3307B); followed the plan's stated fallback — seam guardrail as the one line, workflow 04 carries the loop — tightened to 3295B (advisory WARN, build GREEN).
- [Phase 12]: [12-05] AGENTS.md gained a new ### Acceptance micro-slot (D-12, RESEARCH OQ1 planner pick) valued UNKNOWN - verify; host runner names live only in a trailing HTML comment — single-source, host-agnostic, no per-stack bloat, no adapter touched.
- [Phase ?]: 12-04: Tiered test-first / red-green evidence field added to both handoffs — engineer inner-loop (implementation-handoff) + QE outer-loop (qe-handoff), reading quality.tdd (default encouraged), each with the clear-voice no-fabrication floor (UNKNOWN - verify) (TDD-02, D-07/D-10)
- [Phase 13]: [13-01] frontend-ui.md is the 17th role — a senior design-authority persona on the qe-e2e 9-section skeleton with NO spawn tool (WR-05 GREEN); framework-neutral with Vue as the worked example (D-02); no new config key (D-07); WCAG 2.2 AA bar in clear voice
- [Phase 13]: [13-01] design-authority/contract-only seam: frontend-ui authors the design contract, the engineer builds (wf 04), QE verifies (wf 05); single activation, no component code, no re-review (D-01/D-03)
- [Phase 13]: [13-01] role_ceiling for frontend-ui.md set '3969 3757' off the measured 3544B (+12%/+6%) — measure-then-set after authoring (Pitfall 1 closed); orchestrator ceiling untouched (Plan 03 owns its raise); GUARD_INPUTS mirror keeps the fail-proof harness honest for the 17th role
- [Phase ?]: [13-02] workflow 14-ui-design-to-build.md authored (UI-02): order: 14 / cadence: both, appended without renumbering 00-13 (Pitfall 6); walks design contract -> build -> five states -> WCAG 2.2 AA -> visual baseline tool-neutrally
- [Phase ?]: [13-02] reference-not-restate (D-03): workflow 14 names 04-ticket-to-pr.md (build) + 05-pr-quality-gate.md (gate) by filename using 04's verbatim 'references that ... and does not restate it' phrasing; gate step-labels absent; tool-neutral body (D-08, 0 tool names), WCAG 2.2 AA the only standard (D-09); no Phase-15 forward-pointer (OQ2)
- [Phase ?]: [13-03] UI-03 Orchestrator routing wired: ui-build classification token (15->16) + Need UI/frontend -> Frontend/UI matrix row + ui-build -> 14-ui-design-to-build.md workflow-map row appended (00-13 NOT renumbered, Pitfall 6); four terse edits added only +98B (6661->6759B)
- [Phase ?]: [13-03] orchestrator role_ceiling RAISED to '7570 7165' off the MEASURED 6759B post-wiring size (+12%/+6%, measure-then-set, trap 2 closed) — frontend-ui.md case left untouched at '3969 3757' (Plan 01 owns it); both foundation-guard scripts exit 0 GREEN
- [Phase ?]: [15-01] @types/node accepted as third dev-dep under D-05 (type-only, erased at compile); pinned ~22 to the D-03 Node-22 floor
- [Phase ?]: [15-01] tsconfig types:[node] added so tsc resolves @types/node globals/builtins; **/*.test.ts excluded from emit (Vitest runs .test.ts directly, no committed test .js)
- [Phase ?]: [15-01] D-02 freshness gate live: rebuild-to-temp + Buffer.equals, exit 0 fresh / 1 drift|error, fail-closed on broken rebuild; .gitattributes eol=lf + tsconfig newLine:lf close Pitfall 1
- [Phase ?]: [15-02] Prod-deploy guard ported byte-for-behavior to TS (hooks/guard.ts/.js): APPROVAL literal GRUGOPS_PROD_DEPLOY_APPROVED preserved, DEPLOY array diff-identical to guard.mjs, SELF_APPROVE + fail-closed fd-0 stdin parse + exit-0/JSON-deny mechanism unchanged; hooks.json repointed to guard.js (D-10)
- [Phase ?]: [15-02] guard.test.ts Vitest oracle reproduces all 26 guard.test.sh assertions + a NEW D-10 missing-artifact case (27 green) spawning the committed guard.js; guard.mjs+guard.test.sh kept as parity oracle until Plan 06; host hook auto-migration deferred to Phase 17 --migrate
- [Phase ?]: [15-03] install.sh + install.mjs collapsed into a single behavior-parity install.ts/.js (D-07); uninstall.sh -> uninstall.ts/.js (D-09); Node now the hard prerequisite, dual sh/Node byte-parity install contract retired
- [Phase ?]: [15-03] Ported install.mjs (not install.sh) as the analog — types only, every env-var/sentinel/exit-code/regex/fail-closed branch carried byte-for-behavior; sentinel strings byte-identical across the install/uninstall pair; D-11 materializeRunnable() seam reserved between seedState() and writeMarker() for Plan 05
- [Phase ?]: [15-03] install.test.ts folds install.test.sh + install.two-root.test.sh into one Vitest suite (17 pass + 1 skip) over the committed .js; carries the REQUIRED D-08 retired-parity marker (old Check 4 sh-vs-Node parity intentionally gone — Pitfall 6); old .sh/.mjs/.test.sh kept as oracles until Plan 06
- [Phase ?]: [15-04] Validator + ASVS generator + foundation-guards + kit-refs ported .mjs/.sh -> .ts at exact parity (RESEARCH Open Q4: types only, refactor nothing semantic); C3 unset-kit guard + CR-03 fail-closed-on-null preserved verbatim; full .sh/.mjs-vs-.js output diff byte-identical on the real tree
- [Phase ?]: [15-04] ASVS checklist proven byte-reproducible 3 ways (.js == .mjs output == committed file); provenance header kept verbatim so bytes don't drift, Plan 06 repoints it; checklist NOT re-committed (no-op IS the fidelity proof)
- [Phase ?]: [15-04] CHECK_ROOT env override added to the two read-only checkers so the .sh run-from-mirror hermetic idiom ports to Vitest; RED-by-design proven by planted regression; TOOL-01 stays In Progress (spans 15-06 .mjs/.sh deletion)
- [Phase ?]: [15-05] TOOL-02 kit-shipped-runnable convention PROVEN: reference-check.ts speaks the D-12 contract (exit 0/1/2 + clear-voice stdout + --json), node: builtins only, RED on a planted FORBIDDEN fixture; install.ts materializeRunnable() copies the compiled .js into the host's committed tools/grugops/ (additive/idempotent/never-overwrite), runs in a bare-Node host with no node_modules; materialization path CONFIRMED tools/grugops/ (D-11 RESOLVED); Phase 16's checker reuses materializeRunnable via the RUNNABLES table; TOOL-02 complete, TOOL-01 left In Progress (15-06 deletes .mjs/.sh)
- [Phase 15]: [15-06] TOOL-01 closed + D-13 ratified: tooling layer is TypeScript (tsc-compiled committed .js, freshness-checked); single Node-required install.ts (POSIX installer dropped, Node a hard prerequisite); dev-deps {typescript, vitest, @types/node} dev/CI-only; zero runtime deps on hosts; Node 22+ floor. 13 POSIX/.mjs originals + .test.sh oracles deleted after a green-suite gate (D-09 — nothing POSIX remains); prior HELD notes in 12/13/14-CONTEXT.md marked superseded (history preserved); human-approved checkpoint.
- [Phase ?]: [16-01] Test-integrity checker is a committed node:builtins-only near-clone of reference-check.ts (exit 0/1/2 + clear-voice + --json); validates registry format and compares --skip-count <N> against the valid-justification count; hollow placeholder-owner RED fixture proves SC3 exit 1.
- [Phase ?]: [16-01] Missing/non-integer --skip-count -> 'UNKNOWN - verify' exit 1 (D-14); expired well-formed row blocks (D-05) and does not count; valid+unexpired flaky-quarantine counts (D-04). Materialized via one RUNNABLES tuple in install.ts.
- [Phase ?]: [16-02] Two clear-voice checklist siblings added under agent-factory/checklists/ (D-06 reference-not-embed): playwright-visual-regression-recipe.md (toHaveScreenshot flake-resistance set + axe pointer, UIQA-01) + linter-recommendations.md (per-stack ESLint-flat-default/Biome-qualified/Ruff/golangci-lint table, strict --max-warnings 0 + safe-autofix CLI + quality.lint wiring + UNKNOWN-verify fallbacks, LINT-01); accessibility-checklist.md extended with @axe-core/playwright AxeBuilder .withTags WCAG 2.2 AA; both registered in 00-index.md; all three §14-free, clear-voice; validator green.
- [Phase ?]: [16-03] Convergence keystone: all gate behavior wired single-source into 05-pr-quality-gate.md — quality.lint {strict,autofix} (UNKNOWN-verify non-blocking when no linter), quality.ui_e2e referencing recipe+axe by filename, and a NEW human-only test-integrity step invoking node tools/grugops/test-skip-integrity.js --skip-count <N> branching on exit 0/1/2; no fork into 14/15, no §14 literal.
- [Phase ?]: [16-03] D-08/D-09/D-10 terminal mapping on the bounded self_fix_attempts loop: lint + UI/E2E code/a11y are agent-fixable; visual-baseline acceptance and test-integrity exit-1 are human-only and short-circuit to BLOCKED_NEEDS_FIX WITHOUT spending self_fix_attempts; gate_enforcement:advisory downgrades the action but still emits the finding loudly (TINT-03 floor = no silent accept, not a hard stop). Three terminal results preserved.
- [Phase ?]: [16-03] AGENTS.md ### Test integrity skip-count slot added (mirrors ### Acceptance): UNKNOWN-verify default, per-runner vitest/jest/pytest/go examples-only in an HTML comment, never-a-silent-0. factory.config.md dial→behavior prose added by enriching existing quality.* Meaning cells — ZERO new keys, JSON twin byte-unchanged (Pitfall 6); .grugops/test-skips.md registry path is a fixed convention (D-01), not a config value.
- [Phase ?]: [17-01] Wave-0 keystone: 3 mode flags (--migrate/--update/--prune-old-kit) RECOGNIZED only (NOT wired; Plans 02/03 own the branches), any other unknown arg still exits 2 (T-17-01-AP); single-source backup primitives isoStamp()/dirsSameContent()/backupIfDiffers() — differs-only no-op (D-09), DRY_RUN-safe, clear professional voice; copyKit(retainBackup) default path behaviorally unchanged (baseline idempotency + two-root cases green)
- [Phase ?]: [17-01] D-13 honored — no install.sh; modes are flags on the single TS installer, install.js rebuilt + freshness-green; makeOldLayoutFixture() plants config at BOTH the v1.0 in-repo AND opt-in repo-root (D-04) locations so Plan 02 handles both; MIGR-01/UPD-01 deliberately NOT marked complete (satisfied once --migrate/--update are wired + verified in Plans 02/03)
- [Phase ?]: [17-02] --migrate (MIGR-01) is single-source orchestration (D-02): detectOldLayout classifies + migratePreSteps relocates (config-move BOTH legacy locations D-04, in-repo-kit backup, symlink-unlink LANDMINE Pitfall 1) then the branch FALLS THROUGH into the unchanged install run — no forked path
- [Phase ?]: [17-02] symlink-corruption LANDMINE (Pitfall 1/T-17-02-SYM) FIXED: migratePreSteps rmSync(force) any isSymlink resolver-adapter dest BEFORE materializeAdapter, proven byte-unchanged source-clone by a RED-by-design case; never writeFileSync through a live symlink
- [Phase ?]: [17-02] D-04 config-path discrepancy RESOLVED as HANDLE-BOTH: migrate checks both the v1.0 in-repo agent-factory/config/factory.config.json AND the repo-root factory.config.json, carrying whichever exists forward to .grugops/ (only-if-absent) and leaving the original as a timestamped .bak
- [Phase ?]: [17-02] SC3 restore is the user's DOCUMENTED MANUAL .bak rename (README), NOT new uninstall logic — uninstall.ts gained only a clear-voice comment (no new flag, no migrate-rollback code); the SC3 snapshot is scoped to the user-owned agent-factory/ tree since migrate replaces the grugops .claude adapters in place
- [Phase ?]: [17-03] --update is kit-home-only (D-05): branches BEFORE the self-checkout guard, calls only updateKitHome()=copyKit(retainBackup=true), never writes a target; retains the displaced kit as agent-factory.bak.<ISO> when it differs (D-06) / no-op when identical (D-09); a downgrade warns naming both versions then PROCEEDS (D-07)
- [Phase ?]: [17-03] --prune-old-kit is the single opt-in deletion path (D-10): anchored GRUGOPS_BACKUP_SUFFIX (.bak.<ISO>, NOT *.bak — Pitfall 5) + isProtected()-style guard mirroring uninstall.ts; removes only grugops backups in both roots; the default install path never prunes (never-delete-first)
- [Phase ?]: [17-03] TDZ class fixed (Rule 3): the early --update / --prune-old-kit branches reached const-arrow helpers (report/mkdirp/sameContent/isoStamp/GRUGOPS_BACKUP_SUFFIX) before init; relocated them above the doctor (mirrors the MAT_* relocation). The sameContent TDZ silently broke the D-09 differs-only no-op (every --update forced a backup)
- [Phase ?]: [18-01] DOCS-01 catalog generator: self-discovers 17 roles + 16 workflows via readdirSync; read-only parse; D-08 byte-stable ordering; D-09 workflows 12/13 cadence -> UNKNOWN - verify; fail-closed before any partial write; catalog source links are repo-root-relative to keep the file free of '..'
- [Phase ?]: [18-02] DOCS-02 catalog freshness gate is STANDALONE (own freshness:catalog package.json script), NOT folded into check-foundation-guards.ts (D-07); guards byte-unchanged. Mirror-spawn regen (cpSync generator .js + roles+workflows into a temp tree, spawnSync so OUT stays a fixed literal, D-06 path-traversal-safe), Buffer.equals byte-diff vs committed docs/catalog/README.md, fail-closed: non-zero regen ⇒ exit 1, never fresh (T-18-06).
- [Phase ?]: [18-02] Rule 1 fix: the fail-closed RED fixture must use a NON-underscore bad-role filename (the generator D-03 _-prefix filter silently drops _-files, vacuously passing the regen); the no-success assertion targets the success-only marker 'matches a fresh regeneration' since the fail-closed message also contains 'catalog fresh'.
- [Phase ?]: [19-01] Tier-1 oracles live single-source in scripts/check-uat-oracles.ts (standalone aggregator + import.meta entry guard, D-07); foundation-guards aggregator imports+invokes the three and folds uatOracleFails() into FAILS so it fails closed (UAT-AUTO-05)
- [Phase ?]: [19-01] B3 wording oracle asserts three SEMANTIC beats per file via tolerant per-beat lookahead regexes (beat2 tolerates STATE.md guard_wr05 (...sh) in Phase 10), NOT the verbatim P8->P10->P11 slug
- [Phase ?]: [19-01] A2 wiring oracle never references GRUGOPS_PROD_DEPLOY_APPROVED (0 refs); A3 parity surfaces the still-pending-human CC-native column as advisory WARN, never confirmed (no-fabrication)
- [Phase ?]: [19-02] Tier-2 E2E harness gates every live assertion on a fail-closed claude auth status probe; absent/unauthed emits a LOUD distinct LOUD_SKIP_MARKER (never a silent green). BLOCKER 2 proven by a -t loud-skip stubbed-probe test asserting the exact sentinel.
- [Phase ?]: [19-02] Tier-2 lane carries NO new dial key (self-gates on its own auth probe); stays dev/CI-only out of the default test green path; zero new devDependency. Both lanes referenced single-source in 05-pr-quality-gate.md (no fork into 14/15).
- [Phase ?]: [19-03a] B3 wording UAT (11-HUMAN-UAT.md scenario 3) flipped to [passed] strictly from the captured node scripts/check-uat-oracles.js real run (exit 0, oracleWr05Wording PASS) — never hand-set; UAT-AUTO-04 left IN PROGRESS (jointly owned with 19-03b)
- [Phase ?]: [20-01] refs YAML-list parsing: extend the existing flat key:value frontmatter parser minimally for a refs: list block (single-line comma form also accepted) — zero new dependency (resolves RESEARCH Open Q1)
- [Phase ?]: [20-01] derived filenames index.md + index.jsonl (folder-relative); JSONL line is event-only (8 provenance fields, fixed key order, body excluded)
- [Phase ?]: [20-01] context-io.ts is the ONLY sanctioned shared-context write path: per-note-file + atomic temp-then-rename to a FRESH unique path; Windows unlink-then-rename branch confined to the single-writer freshness-gated index.* regen; markdown notes/ is SoT, index.* derived/freshness-gatable
- [Phase ?]: [20-02] claimTask(queueRoot, task, by): atomic mkdirSync claim, EEXIST=lost (false) distinct from rethrown ENOENT/EACCES; claim.md is the now-running registry
- [Phase ?]: [20-02] sweepStale: explicit generous wall-clock TTL reclaim, caller-supplied TTL, NO pid/host liveness (PAR-05 deferred)
- [Phase ?]: [20-03] freshness:context drift gate: per-task mirror-spawn regen via context-io.js render then Buffer.equals byte-diff committed vs fresh, fail-closed (non-zero regen/unreadable/mismatch to exit 1, never fresh); markdown notes/ win, gate never edits them; realpathSync the temp mirror so context-io.js isMain CLI guard fires on the macOS /var symlink (SCTX-03, SC-4)
- [Phase ?]: [20-04] guard_context_writes (SCTX-05) registered as a clone of guard_wr05 in check-foundation-guards.ts — explicit CTX_SCAN (17 roles + 16 workflows, never repo-wide), CTX_WRITE_RE matches a write TOKEN (writeFileSync/appendFileSync/Write/redirect/echo) co-occurring with .grugops/context/ in either order, not the prose word 'write'; folds into the single-source §14 gate (no fork). Calibration tests target workflow files (no byte ceiling) to isolate the proof.
- [Phase ?]: [20-04] .github/workflows/ci.yml created honestly (did not exist — RESEARCH [ASSUMED] was false) — os matrix [ubuntu-latest, windows-latest] on Node 22, vitest with the live e2e lane excluded so the SC-2 unlink-then-rename Windows branch runs on a real Windows runner; freshness+guards on ubuntu; true-NFS atomicity left UNKNOWN - verify (DOGF-02/Phase 26).
- [Phase ?]: [21-01] Admission surface = two functions (validate pure; admit() the only context-reading path, D-10); GREEN-verdict contract = kind:finding + by:§14-gate + refs includes §14-gate#<id> + body READY_FOR_HUMAN_REVIEW + live; CLI verb = admit
- [Phase ?]: [21-02] §14 gate emits a by:§14-gate green verdict via context-io.ts emitVerdict on READY_FOR_HUMAN_REVIEW ONLY; unique node:crypto per-run id (not ticket id) is the §14-gate#<id> stamp downstream findings reference (D-03/D-04)
- [Phase ?]: [21-02] VFY-04 honest by reference: verify->regenerate pins to existing Step-4 self_fix_attempts (no new dial, D-12); non-green emits no green verdict, refused finding degrades to UNKNOWN - verify (D-11); single-source preserved (D-15), guard_context_writes green
- [Phase ?]: Phase 21 Plan 03: WF16 (16-context-read-write.md) is the single-source context I/O protocol; all 17 roles carry one terse pointer (D-13/D-14, SC-3 honestly TRUE)
- [Phase ?]: 9 role-size FAIL ceilings bumped in lockstep for the WF16 pointer (~189 B), +12%/+6% (ba-pm +20%/+12%); committed guard .js freshness-checked (D-07)
- [Phase ?]: [21-04] CR-01 closed: parseNote normalizes CRLF/CR to LF before the fence match so a git-autocrlf (Windows) green verdict admits its finding identically to LF; RED 3e4991a GREEN 51f3b24 freshness 0
- [Phase ?]: compactor.ts is a read-only carve-out invariant checker over (raw thread -> promoted notes); never summarizes, forks no writer — promotion stays in appendNote, re-verify in admit (Phase 22 D-01/D-02/D-12)
- [Phase ?]: context.compaction dial (aggressive|balanced|retain-raw; lean default aggressive) tunes body verbosity only; durable note set + carve-out fields are un-dialable at every value (D-05)
- [Phase ?]: WF18 single-source compaction protocol: order:18 (Pitfall 2), references WF16+§14-gate (D-10), restates nothing; the additive WF18 role pointer re-baselined guard_role_size for 5 roles per the Phase-21 WF16 convention
- [Phase ?]: [22-04] CMP-02 carve-out is now an id-keyed exact 1:1 match on a frozen id: field ALONE; verifiedKey Set + findCounterpart tuple fallback DELETED; required-survival set is ASYMMETRIC (currentState folds out only soft non-verified notes; verified findings + failed-attempts survive unconditionally); promoted-side supersedes never authorizes a drop; readNoteFields rejects a duplicate provenance key on the oracle read path; 7 held-out RED-first cases incl. FORGED-FOLD + RAW-FOLD-VERIFIED
- [Phase ?]: 22-05: oracle unified — FA + durable notes share one id-keyed byte-equal pass; CR-03 + CR-01 closed (RED→GREEN proven against the committed .js)
- [Phase ?]: 22-05: FA survival/identity keyed on the frozen id, not the body FA-token (WR-01); compactor read path adopts the single exported context-io.parseNote (IN-02)
- [Phase ?]: [22-06] CMP-02 round-5 shared-layer IN-02 completed; 4th line-shape/parser-projection-drift bypass closed with RED to GREEN against committed compactor.js
- [Phase ?]: 22-07: CMP-02 5th bypass (multi-note thread file) closed via shared splitNotes + per-note readNoteDir keyed <file>#<n>; IN-01 noteId unified; RED→GREEN vs committed .js.
- [Phase ?]: 22-07: splitNotes boundary = column-0 --- + an id: line (subset of parseNote's recognized lines so carved==parsed, no drift); body --- / embedded ---key:value--- block is NOT a boundary (6th-bypass guard).
- [Phase ?]: 22-07: WR-01 fail-closed anchored on the un-fenced LEADING region (scratch-then-fence); read-path-only — write representation + readContext untouched; WR-02/WR-03/broader-IN-02 deferred.
- [Phase 22]: 22-08: Fork A (read-path-only) splitNotes fail-closure — recover OR refuse, never silently absorb; the safety floor is fail-closure, broadened recognition is a usability layer on top
- [Phase 22]: 22-08: note boundary keyed on an id-bearing frontmatter run so a kind-first note is recovered while an id-less embedded body fence stays body (round-5 win preserved)
- [Phase 22]: 22-08: isRecognizedFrontmatterLine single exported source-of-truth grammar shared by parseNote + splitNotes (no drift); writer-order guard pins composeNote/composeThreadNote field order
- [Phase ?]: 22-09 round-8: UNIFY splitNotes' boundary with parseNote (boundary iff parseNote(region) non-null AND id-bearing); looksLikeFrontmatterLine(lines[i+1]) + opensIdBearingRun removed as authority (grep==0, .ts+.js); 7th CMP-02 silent-absorb bypass + the CLASS closed (parseNote-oracle fuzz); Fork B frozen.
- [Phase 23]: 23-01: queue config is a NEW top-level object sibling to wip_limits (D-06/D-07: queue.wip_limit = concurrent agent WIDTH, distinct from per-column wip_limits board flow) — byte-consistent across config.json + seed + documented in the .md twin
- [Phase 23]: 23-01: now-running render lives in claim.ts and REUSES sweepStale's first-at-trusted / multi-at tamper discipline — a forged second at: line is skipped, never a trusted row, no permissive multi-match parser (T-23-01); queue freshness is a dedicated standalone gate re-rooted at .grugops/queue/ (Pitfall 5)
- [Phase ?]: [24-03] plans/traceability.md migrated onto note refs (D-01 Option A): survives as a deterministic render of note refs (Requirement|Code|Tests|UAT|Release keyed by ticket id, emitted verbatim), gated fail-closed by a standalone freshness:traceability twin of now-running-freshness (D-03)
- [Phase ?]: 24-04: folded the --migrate plans/handoffs/ backup into the existing v1.2 migrate orchestration (D-17); backupDir is never-delete-first, aborts on .bak collision (D-18), no content conversion (D-19), DRY_RUN/idempotent (D-20)
- [Phase ?]: 24-04: removed seedState plans/handoffs/ mkdir + the plans/handoffs doctor ref in lockstep (MIGR-02) — fresh installs leave the dir absent, --check still green
- [Phase ?]: 25-01: readGovernanceConfig fails OPEN to lean (reader never throws); the 25-02 hook fails CLOSED on a matched admit, not the reader
- [Phase ?]: 25-01: the governance reader returns present values verbatim (no allowed-set validation) so the 25-03 floor-sweep can prove a bogus value still refuses
- [Phase ?]: 25-03: admit() D-04 in-script refusal is the weaker self-settable tier (D-05); the un-forgeable primary is the Plan-25-02 hook
- [Phase ?]: 25-03: GOV-02 ledger writes one fixed-key JSONL admission RECORD (id/kind/by/severity/verified_by/disposed_by/at) under retained, nothing under git; never the note body, separate from compaction (D-09)
- [Phase ?]: [25-08] Structural admit-SHAPE detection via an ALLOWLIST tokenIsFinalLiteral (^[A-Za-z0-9/._:=,-]$ + raw free of $/backtick), NOT a denylist — catches extglob/any future metachar without enumeration; SC1 NOT declared until the independent red-team reproduces it (D-12)
- [Phase ?]: [25-08] JS_RUNNERS {bun,bunx,deno,ts-node} is a distinct JS-execution-capability set (NOT a COMMAND_MODIFIERS/LAUNCHERS widening); scripts/context-io.ts byte-frozen; NEW disclosed extglob-fragmentation residual (extglob + dynamic command-sub word / quoted eval body) flagged for the red-team
- [Phase ?]: [25-09] Move-the-gate (D-01): zero-dep stdio MCP server mcp__grugops__propose_note wrapping admitAndAppend replaces the parsed-shell-string proxy; shell-obfuscation family gone by construction. Server is NOT the gate (no approval env); per-note gate is the 25-10 per-call hook. W-A single-source isGatedNote+isHighSeverityRole imported by both; admit() W-B byte-frozen; exactly 3 new exports; appendNote optional precomputedId keeps ledger id == on-disk id.
- [Phase ?]: 25-10: GOV-01 gate moved to the structured channel (D-01) — admission-guard is a per-call PreToolUse gate on mcp__grugops__.* reading final tool_input; the command-string parser is DELETED; a gated finding needs fresh env GRUGOPS_ADMISSION_APPROVED_BY=<name> AND verified_by===human:<name> (D-07); independent red-team (25-11) is the closure gate, not the green suite (D-12)
- [Phase ?]: 26-01: oracleParity replaced by real on-disk oracleDualPathEquivalence via single-source comparator; DOGF-01 deterministic half green; retirement flip still evidence-gated on a live run (D-01)
- [Phase ?]: DOGF-03 cost harness defaults to UNKNOWN - verify; no numeric field populated; cost never gates the phase (D-10/D-11)
- [Phase ?]: 26-04: A3-live retargeted onto on-disk verdict-string equivalence (D-05); FROZEN_HANDOFFS + deleted-filename loop removed (Pitfall 5/Loud Flag 2)
- [Phase ?]: 26-04: added gated A3-live-N — N real claude dispatches vs one shared queue+context root assert N un-clobbered notes + claim-once (D-09, Tier-2 confirmation only)
- [Phase ?]: 26-04: human runbook dual-path artifact retargeted onto shared-context notes + frozen verdict; captured date+verdict is the D-01 retirement evidence
- [Phase ?]: KIT-01: scripts/kit-model.ts is the sole filesystem-derived authority for the role/workflow corpora; kit root is an explicit parameter (D-22), and the module throws rather than returning an empty set (D-21 tier 1)
- [Phase ?]: KIT-03: guard_referential_integrity enforces grant u {coordinator} == adapters == roles with no exception list, and is RED against the live tree until plan 27-06 lands the 17 adapters
- [Phase ?]: D-17 upheld: roleCeiling() stays hand-listed as a measurement baseline that already fails closed on an unknown role; deriving it would convert a fail-closed table into a silently-widening one
- [Phase ?]: Installer/uninstaller derive their kit sets by readdirSync of $GRUGOPS_SRC (D-18) — the installer stays self-contained and does NOT import scripts/kit-model.ts
- [Phase ?]: Materialize-vs-copy routing is decided by the resolver slot line in the source body (D-06), not by filename — so all 17 adapters become resolvers with no exception list
- [Phase ?]: Uninstall removes only the kit-source set INTERSECTED with target contents; an underivable source returns null and fails loud rather than deleting (T-27-06/T-27-09)
- [Phase ?]: The guards-side spawn-grant constant is renamed SPAWN_GRANT_SCAN; the former identifier now appears in exactly one file (check-uat-oracles.ts), including in comments
- [Phase ?]: adapters.md stays out of the spawn-grant scan (D-09) by shape rule, not by omission from a list
- [Phase ?]: A coverage increase that surfaces a real violation is fixed in the offending TEXT, never by narrowing the scan set or weakening the safety predicate
- [Phase ?]: Deletion detection lost to derivation is restored explicitly: a non-empty floor reporting both counts, plus SKILL_COUNT for the one set the KIT-03 oracle cannot cover
- [Phase ?]: 27-04: extension stripped at the validator's call site, never by changing kit-model's pinned .md-bearing return shape
- [Phase ?]: 27-04: no cardinality assertion inside the validator (it runs against arbitrary kit roots); counts stay in guard_kit_counts, deletion signal in the KIT-03 oracle
- [Phase ?]: 27-04: Assertion 3 restated as a two-sided derived predicate keyed on the resolver slot — a hand-written adapter naming $GRUGOPS_HOME without a slot now fails red
- [Phase ?]: 27-04: deriving a set restores its fail-red branch explicitly — check-kit-refs refuses an empty adapter set rather than passing over nothing
- [Phase ?]: Byte ceilings are measurement baselines: trim the file, never raise the ceiling (27-05 took 1085 B of prose rather than touch 7570/7165)
- [Phase ?]: Spawn instructions key on Agent-tool availability, not on a host CLI name (D-04) — corrected in both Responsibility 4 and the caveman prompt block
- [Phase ?]: agent-factory/README.md carries no depth or width claim — verified by reading and grep, left unedited (resolves the 27-RESEARCH structural-parallel assumption)
- [Phase ?]: 27-06: capability baseline is `read edit shell` for all 17 roles; `web` only for architect-design and security-nfr (D-11 fixes the mechanism, the per-role assignment is the implementer's)
- [Phase ?]: 27-06: guard_voice grug-meta plant re-hosted from security-nfr.md (16 B from red) to agents-md-scribe.md — a voice test must not be charged against a role's size budget
- [Phase ?]: 27-06: coordinator body omits the Orchestrator's classify/decompose/schedule/gate/sweep spine (the role file owns it) — generated coordinator adapter measures 2951 B inside the 3072 B pointer warn tier
- [Phase ?]: [27-07] Adapter-name collision compares case-insensitively — a role pair portable only to Linux is refused on every platform (APFS/NTFS silently collapse the two adapters)
- [Phase ?]: [27-07] Adapter description is emitted as a double-quoted YAML scalar; the derived role prose carries colon-space, which a plain scalar cannot hold
- [Phase ?]: [27-07] The KIT-03 RED regression fixture is CONSTRUCTED (brokenMirror), never inherited from the live tree — plain mirror() tracked the live adapters and went green with them
- [Phase ?]: One retired-vocabulary module (dead-vocabulary.ts) serves two justified consumers; no second list
- [Phase ?]: guard_adapter_body reads fence-stripped AND whitespace-collapsed text so no verdict depends on line wrapping
- [Phase ?]: The packaging template states the memory sentence in live prose, so one uniform rule covers all 25 bodies with no per-file exemption
- [Phase ?]: guard_wr05 asserts tier-announcement presence, never a settings-file entry (D-01: none is written into a user repo)
- [Phase ?]: [27-09] install/README.md entry-tier section appended as §6 (not inserted as §4) — inserting would renumber Safety §5 and invalidate the hooks/guard.ts:83 cross-file citation; a forward pointer near the top preserves discoverability
- [Phase ?]: [27-09] settings-key allowlist parity written as UNKNOWN - verify in both install/README.md and adapters.md — the platform states the enumerated-allowlist rule for the --agent flag only; D-01 removes the key from the install path so nothing depends on the answer
- [Phase ?]: [27-09] SPAWN-03 NOT marked complete — documented + in-repo halves green, runtime half (session header names @grugops-orchestrator; a role agent actually runs) NOT PERFORMED and recorded as UNKNOWN - verify with reproduction commands; marking it complete on a green suite would repeat the defect this phase exists to fix
- [Phase ?]: Recursion is the module contract for the adapter set (27-10): Claude Code discovers .claude/agents recursively and takes identity only from frontmatter, so a non-recursive derivation leaves loaded files outside every guard
- [Phase ?]: No agent-adapter cardinality constant exists and a later phase must not add one (27-10): the KIT-03 oracle already pins that number; SKILL_ADAPTER_COUNT is the deliberate exception because a skill has no role to compare against
- [Phase ?]: A nested agent adapter is refused by a named finding in guard_adapter_size (27-10) — the derivation sees it and the guard says so; silence is not a policy
- [Phase ?]: Wire a gate at BOTH ends — CI step + a test file that spawns it — so a workflow refactor cannot silently un-gate it (SPAWN-02)
- [Phase ?]: adapters-freshness splits SCRIPT_ROOT (committed twins under test) from KIT_ROOT (tree judged, CHECK_ROOT-overridable); CHECK_ROOT is stripped from the mirrored generator's env
- [Phase ?]: KIT-02 stays open — 27-13 (installer/uninstaller) still carries its own adapter derivation; SPAWN-02 marked complete
- [Phase ?]: SPAWN-04/KIT-03: the grant is read from a reconstructed frontmatter VALUE through one module; the two line-anchored expressions and the marker expression are DELETED, not extended
- [Phase ?]: A frontmatter parse failure is a discriminated arm and its own guard finding — it can never read as an absence of a grant
- [Phase ?]: Duplicate frontmatter keys: neither wins; every occurrence is retained and the grant predicate tests all of them, because discarding one is a bypass
- [Phase ?]: The spawn grant is a FRONTMATTER fact — scoped to the tools keys; a token in a description or in body prose is documentation, not a grant
- [Phase ?]: Installer and uninstaller now hold ONE fail-loud contract: null on an unreadable source directory, [] on an empty one, and each reported distinctly — a completion banner is withheld over any verify finding
- [Phase ?]: The installer's deliberate second adapter derivation (D-18 locked) is bought back by a conformance assertion against kit-model — set equality AND integer cardinality — never by an import
- [Phase ?]: tools/ is left in place and reported as left: grugops owns tools/grugops/, not the generic directory name a project likely owns
- [Phase ?]: The positive half is anchored to the FULL generated sentence and counted exactly once — a fragment substring test is satisfied by anything that mentions the topic
- [Phase ?]: When one predicate is right but its input is wrong, split the scan set by input rather than weakening the predicate
- [Phase ?]: A vacuity floor must be written over the quantity whose disappearance it exists to catch, never over a total that always includes a constant
- [Phase ?]: Pin a floor with a case asserting its OWN finding text — a case keyed only on the exit code passes on another guard's failure
- [Phase ?]: [27-15] The shipped command is `/grugops`, confirmed from the tree (7 skill dirs + their name keys), not adopted from the finding; `/grug` exists in no install form. Four surfaces now agree with identical inline-code formatting.
- [Phase ?]: [27-15] The coordinator adapter BODY is emitted from an inline string in scripts/generate-role-adapters.ts, NOT from the packaging template — the plan named three sources, the real count is four. Correcting only the template leaves the shipped body stale while adapters-freshness stays green (it compares against the same stale generator).
- [Phase ?]: [27-15] TIER_BEATS gains a sixth beat pinning the reduced-tier command name, plus an optional per-beat `why` clause (default preserves the five original findings byte-identically). Pinned TO the shipped command via an arbitrary-wrong RED case, not merely AGAINST the stale token.
- [Phase ?]: [27-16] SPAWN-03's observable half is discharged by one command (scripts/coordinator-resolution-precheck.js); its runtime half stays unperformed and lands in 27-SPAWN-03-RUNTIME-EVIDENCE.md, shipped empty and marked unverified
- [Phase ?]: [27-18] A YAML reference construct in a value position is a parse artifact, refused by name — never resolved (a second grammar with more surface) and never read as plain text (the silent no-grant arm). CR-01.
- [Phase ?]: [27-18] A safety predicate's alphabet must come from the grammar's SPEC, not be hand-chosen. The review-suggested `[A-Za-z0-9_-]` anchor-name charset was itself a live bypass (YAML 1.2 allows any non-space non-flow-indicator char); set-literal drift in a character class.
- [Phase ?]: [27-19] Identity has ONE authority: the frontmatter `name` key. KIT-03's filename-keyed set 2 is legal only because the mapping to that key is asserted first (CR-02); coordinator-resolution-precheck.ts already resolved by name, so the two consumers now agree.
- [Phase ?]: [27-19] A `name` key with anything other than EXACTLY ONE value is refused — self red-team proved reading `[0]` let a matching decoy hide the real identity while the gate printed ALL CHECKS PASSED. Pin the cardinality of the answer, not just its value.
- [Phase ?]: [27-19] Expected adapter name is the filename stem, NOT AGENT_PREFIX joined to it — the review's suggested patch double-prefixed and would have failed all 17 shipped adapters.
- [Phase 27]: 27-23 (WR-03): the adapter generator's local frontmatter grammar is DELETED — it reads through scripts/frontmatter.ts, the single authority, and the 17 shipped adapters are byte-identical after the switch
- [Phase 27]: 27-23: two of WR-03's three divergences were NOT fail-closed as the review rated them — the no-space shape shipped a full six-tool line and the duplicate-key shape shipped the LAST value, both exiting 0; measured on the pre-change committed .js
- [Phase 27]: 27-23: three distinct generator refusals for three distinct facts (unreadable frontmatter / no capabilities key / N capabilities keys); the present-but-empty wording is retained verbatim so the committed RED case still pins
- [Phase 27]: 27-23 (IN-01): adapters-freshness registers cleanup on process exit immediately after mkdtempSync; the explicit cleanup() calls stay because 'exit' does not fire on a signal or process.abort()
- [Phase 27]: 27-23 (IN-02): check-kit-refs.js and validate-agent-factory.js now have their own CI steps; validate-agent-factory needs VALIDATE_KIT_ROOT set explicitly (the C3 no-false-green guard gives it no default)
- [Phase 27]: 27-23: the gate's mirror twin list stays hand-written (deriving it would be a second grammar inside a build-safety gate) but the oracle's scratch() now DERIVES the generator's import closure — asymmetric on purpose, and the gate's direction is fail-loud
- [Phase ?]: 27-21 (human, blocking checkpoint): option-a — a run that printed the INCOMPLETE banner exits 3. Ladder: 0 complete, 1 refused/aborted, 2 bad usage (already in use at install.ts:100 / uninstall.ts:71 — the plan's claim that option-a 'reserves 2 for a usage error that does not exist yet' was factually wrong), 3 incomplete. Chained consumers that proceed today now stop; accepted knowingly.
- [Phase ?]: [27-20] The tier-beat ZERO arm keeps its existing wording byte-for-byte — a finding's wording is a CONTRACT with the eight cases that pin it; the split gains a >1 arm rather than churning the message.
- [Phase ?]: [27-20] An unterminated construct extends to EOF and is never emitted — ONE rule for both strippers, taken from stripFencedBlocks' own stated unterminated-fence treatment rather than invented as a second heuristic.
- [Phase ?]: [27-20] Absence and emptiness are two findings, never one silence: the tools floor has both arms, reusing 27-19's split on the name key. What the platform does with a null allow-list is UNKNOWN and not the guard's to guess.
- [Phase ?]: 27-22: file-ness in install.ts's source derivations is statSync's, matching kit-model and the platform (WR-02)
- [Phase ?]: 27-22: mapping literals are parsed once, with a declared-vs-parsed cardinality refusal; the literal count stays as the somebody-added-one forcing function (WR-04)
- [Phase 27]: 27-24: `!` joins `&`/`*` in frontmatter.ts's YAML_REF and ONE leading tag is stripped at every node start — a tag is a node property this module does not resolve, so a tagged reference is refused for the same reason a bare one is (CR-01 round 2).
- [Phase 27]: 27-24: WR-03 (the refused-product's titling / axis-completeness question) is deliberately out of scope for gap-closure round 3 — the case was not retitled and the product was not restructured beyond adding rows and raising pins.
- [Phase ?]: Set-literal inventory entry 10 RETIRED, not renumbered — entries 14/15 are cited by number in install.test.ts and the phase plans (plan 27-25)
- [Phase ?]: WR-01 closed: the allow-list key gets the cardinality arm its sibling name key already had; the two-different-key-names adjacency is dispositioned REFUSED as its own finding.
- [Phase ?]: guard_wr05's tools-floor loop widened from AGENT_ADAPTERS to SPAWN_GRANT_SCAN so one arm covers the skill surface; absence and emptiness keep their agent-only scope behind an explicit isAgentAdapter gate.
- [Phase ?]: 27-27: one cycle answer (a per-path ancestor stack) at BOTH recursive walk sites — bounds recursion without narrowing the set; the two sites name each other but do not import across the install/ to scripts/ boundary (D-29, CR-03).
- [Phase ?]: 27-28: the uninstaller's self-checkout marker pair is install/install.ts + agent-factory/VERSION — agent-factory/VERSION alone is insufficient because README §1's minimal path puts it in ordinary target repos
- [Phase ?]: 27-28: refuse at the TARGET boundary rather than widening isProtected() to cover .claude/ — .claude/ is the directory a normal reversal legitimately empties
- [Phase ?]: D-30 implemented as the escape ALLOWLIST inversion, NOT the review's proposed NUMERIC_ESCAPE regex — grep -c NUMERIC_ESCAPE in scripts/frontmatter.ts is 0
- [Phase ?]: The escape allowlist reached only 3 of 5 application points after the first draft; scanEmbeddedDoubleQuoted closes the flow-item and plain-continuation points by VALIDATING a double-quoted region inside a composite value without resolving it (Rule 2, caught by writing the application-point rows before believing the fix)
- [Phase ?]: keysGrantedAgentNames' D-32 contract change propagated to a FOURTH call site the plan did not list — scripts/coordinator-resolution-precheck.ts — branched explicitly rather than folded into the no-names arm (Rule 3)
- [Phase ?]: KIT-03 and SPAWN-04 deliberately NOT marked Complete in REQUIREMENTS.md: plan 27-30 also carries both and has not executed, and round-4 verification has not run
- [Phase ?]: D-34: a leading YAML directive line is refused BY NAME and POSITIONALLY (no lookahead), closing the second silent-SUCCESS arm in the frontmatter reader (IN-02). Honest-pending: platform inertness stays UNKNOWN - verify.
- [Phase ?]: The agent-adapter scoping gate is proven load-bearing by a negative control plus a captured failure against a gate-removed build (IN-01).
- [Phase ?]: KIT-03 and SPAWN-04 STILL not marked Complete after 27-30: both plans carrying them (27-29, 27-30) have now executed, but round-4 verification has not run and plans 27-31/27-32 remain. Marking them here is the exact revert wave 1 had to make.
- [Phase ?]: D-35: the work bound is a SEPARATE mechanism from the per-path cycle answer — MAX_WALK_ENTRIES=10000 as a per-walk tally at both walk sites, reported by the installer and thrown by the kit-set authority
- [Phase ?]: D-36: the cycle arm names the path it declined to descend into — reported in install/kit-source.ts, thrown in scripts/kit-model.ts, AMENDING D-29's kit-model half (the shipped 'yields the REAL member set' case is now a named-throw case)
- [Phase ?]: D-37: the self-checkout marker pair collapses into ONE exported SOURCE_MARKERS constant plus hasSourceMarkers() in install/kit-source.ts; both binaries import it, neither keeps a literal, and it names the RUNTIME artifact install/install.js rather than the TypeScript source
- [Phase ?]: D-37's forcing function is a read-only case over the REAL repository root walking the IMPORTED constant and asserting the count as a number — a fixture that manufactures its own stub proves the predicate and never proves the constant
- [Phase ?]: Only the marker half is shared; each binary's path-equality half stays local because uninstall.ts normalises with resolve() and install.ts does not, and merging them would silently pick one behaviour for both
- [Phase ?]: D-38: the stale file-count rationale for the duplicate walk is DELETED not softened, and the equality it appeals to becomes two cases — member equality over the two-path fixture, same-path-named refusal over the cycle fixture
- [Phase ?]: IN-03 closed as documentation only: the always-on self-checkout refusal is a mechanical safety check, so documenting that DRY_RUN does not exempt it is the fix, not weakening it
- [Phase ?]: D-44 implemented: the delimiter region holds ONE total classifier (legal | refuse | not-a-delimiter) consumed through a compiler-checked never-branch at both call sites; the two-arm refusal shape, isLegalDelimiter and allDeclaredWs are all DELETED. All 8 measured composite spellings refuse by name at BOTH positions; the composite's misleading opened-and-never-closed diagnosis is gone; a composite-delimiter rogue grant on skills/grugops/SKILL.md flips the foundation gate from exit 0 ALL CHECKS PASSED to exit 1 naming the file.
- [Phase ?]: D-45 implemented: the pinning corpus is a 9x4x6 cross-product over three position-and-token families (648 cells) enumerated as data, with the expected verdict a pure function of axis labels whose non-circularity is CHECKED (source names no module symbol) and cross-checked by a 13-row independent truth table. 368 of 648 cells were RED against the pre-fix committed .js, 0 after. DELIMITER_ROWS' arm tag was RESTATED as the verdict kind and made load-bearing, not dropped.
- [Phase 27]: D-48 implemented: quote state is a property of the YAML SCALAR, not of the physical line; CR-01, WR-01 and the continuation-JOIN direction closed by one change (27-39)
- [Phase 27]: The carry is GATED ON THE NODE START: a quote is only a quote where a node may begin. An ungated carry merged sibling list items in 10 real files via a plain-scalar apostrophe (27-39)
- [Phase 27]: D-49 implemented: a fourth sweep axis enumerated over a construct that spans lines; 27 cells RED before with ZERO in the line-1 column, 0 after (27-39)
- [Phase ?]: D-50 implemented (27-40): WR-02 and IN-02 both closed — one extra LABEL on the leading run (three kinds: none/indentation/residue) and one condition on the flush. The failure class is new: the five before it got the legal SET wrong; this one got the QUESTION wrong — it asked whether a line begins with a payload without first asking whether the line is at a delimiter POSITION at all.
- [Phase ?]: The leading-run label is THREE-way, not the plan's two-way split: the EMPTY run is its own kind, because a vacuously 'entirely declared whitespace' empty run would route `--- foo` and `----` at the closing position out of their refusals (executor deviation, caught before it shipped and pinned by a case).
- [Phase ?]: The indentation branch is position-asymmetric with a MECHANICAL reason recorded in source: at the closing position not-a-delimiter means keep scanning and the fallback is the unterminated-block REFUSAL; at the opening position it IS the keyless success arm. Not the D-39 point 5 asymmetry, which was the same byte refusing loudly at one position and succeeding silently at the other with no stated reason.
- [Phase ?]: Three shipped assertions encoded the WR-02 false red itself and were INVERTED, not deleted (DELIMITER_ROWS is now a required two-sided verdict pair with the asymmetric set asserted to be exactly one row; COMPOSITE_ROWS classifies by its own leading code point; the D-43 sweep's source-4 loop keeps its opening half as the control).
- [Phase ?]: A wholly-quote-wrapped block scalar carrying a non-allowlisted escape moves refuse -> no-grant. KEPT after measurement, not assumed: the value is byte-equal to libyaml and libyaml finds no word boundary either, three sibling spellings already landed there, and the same construct with the token on a boundary CONVICTS (executor deviation, found by red-team).
- [Phase ?]: D-50 implemented for WR-03 and IN-01: both are the gate never saw the value, on two different predicates, and both closed in round 7
- [Phase ?]: Agent() and Read, Agent deliberately share one name-list answer; splitting them would mean a new false red on content a real loader accepts
- [Phase 27]: D-50 closed in full: IN-03, IN-04 and IN-05 all fixed in round 7, each with an explicit disposition; none deferred
- [Phase 27]: The byte-identical PASS-line control compares against an INLINE RESTATEMENT of the predicate, not a frozen baseline literal — a literal carrying today's kit counts would go red on the next legitimate role addition and get 'fixed' until it passed
- [Phase 27]: The plan's verification:backstop premise that both out-of-scope frontmatter grammars sit outside every spawn-grant guard's import graph is DISPROVEN — context-io.ts is reached from check-foundation-guards.ts via check-uat-oracles.ts. The scoped claim survives because it is about the PREDICATE and the document class, not about which files share a process
- [Phase ?]: D-51: the comment scanner is the module's ONE authority on what crosses a line boundary; the three seeding sites became one unconditional assignment each and the separate node-start-quote gate was deleted (27-43)
- [Phase ?]: D-52 axis 1: the multi-line sweep's style axis grew 6 -> 12 and the sweep 90 -> 180 cells, so both CR-01 families are expressible; the completeness claim's SOURCE moves to 27-44 (27-43)
- [Phase ?]: D-53 / IN-03: the item path's invariant is asserted in source by assertItemPathScalarClosed and its comment now states what is true (27-43)
- [Phase ?]: Red-team of 27-43's own fix found two live silent-no-grant bypasses inside D-51's first draft (a tag/anchor and a flow explicit-key indicator at a mid-line node start); both closed by completing the rule against YAML 1.2 6.9/7.4 rather than adding the reported cells (27-43)
- [Phase ?]: D-52 implemented: the sweep's completeness claim now derives from /usr/bin/ruby -ryaml over a 312-cell GENERATED corpus, not from the product of two hand-listed axes; the hand-written truth table is demoted to a second independent expectation and tied to the harness case by a source assertion
- [Phase ?]: D-53 / IN-02 implemented: both one-grammar construct arrays carry a length pin and all six constructs have per-construct load-bearing fixtures; a count-preserving weaker-duplicate swap was adversarially proven to fail red
- [Phase ?]: 27-44 corpus extended beyond plan: two key-line shapes added so the corpus expresses the two bypasses 27-43's own red team found; both are RED on the pre-fix mirror b24d980
- [Phase ?]: A raw NUL byte had landed in scripts/frontmatter.test.ts; a NUL makes BSD grep report ZERO matches silently. Separators are now String.fromCharCode(0), never a raw byte
- [Phase ?]: OPEN, owned by no round-8 plan: scripts/validate-agent-factory.ts is still not a spawn-grant surface (0 spawn / 0 frontmatter / 0 wr05). 27-45 and 27-46 only run it as a gate. Recommendation recorded in 27-44-SUMMARY.md: RETIRE the criterion rather than mint a second spawn-grant predicate
- [Phase ?]: D-53 WR-02 closed structurally: parseFrontmatter deletes NO line — the region is located on normalized text and a column-0 fence inside it is a NAMED REFUSAL. The fence strip's scope SHRANK to the guards' prose checks. Zero repository cost (1142 files, 0 regions differ), zero new refusals over loader-accepted content, foundation gate output byte-identical.
- [Phase ?]: D-53 IN-01 closed with 27-42's remedy: the balance comparison is an exported pure function, the kind type/kinds array/occurrence interface are exported for the single stated reason that a case must construct a FOURTH kind, and the refusal now fires by name with both counts. The arm stays unreachable in production and the disclosure ships with the assertion.
- [Phase ?]: D-53 IN-05 RECORD-DON'T-FIX: the multi-document stream is dispositioned in the module header with its two measured columns (module reads region 1; Psych.parse_stream reads 6 documents, doc3 carries the grant), an explicit UNKNOWN - verify, an explicit non-claim, and the decision that a stream is out of scope. The module is NOT changed to read further regions.
- [Phase ?]: CARRIED FORWARD, owned by no plan: scripts/validate-agent-factory.ts is not a spawn-grant surface, so 27-43's 'validator goes exit 0 -> non-zero' criterion is unsatisfiable as written. 27-44's recommendation to RETIRE the criterion stands; 27-45's scope does not cover it.
- [Phase ?]: 27-46 (D-53, IN-04): the claim partition foreign arm reports each non-schema claimed key at most once, in first-occurrence order; multiplicity dropped rather than kept in a second field
- [Phase ?]: 27-46: de-duplication written as indexOf(k) === i so first-occurrence order is a property of the expression, not of runtime insertion order; a Set would have made it incidental
- [Phase ?]: 27-46: OPEN and unowned — 27-43 acceptance criterion validator exit 0 to non-zero is unsatisfiable; validate-agent-factory.ts is not a spawn-grant surface (0 spawn, 0 wr05, 0 Agent-paren; its 3 frontmatter hits are a ticket-board parser). Recommendation: RETIRE the criterion. Escalate at phase verification
- [Phase ?]: D-54 implemented in full (27-47): the comment scanner's node-start answer is a property of STRUCTURAL POSITION. Two indicator arms lost a depth>0 condition the grammar never had, one JSON-like separation fact is tracked in the same walk, and the item path re-applies the byte-unchanged SEQ_ITEM regex once per dash. Chain arm count 5 before and 5 after — no fifth enumerated arm.
- [Phase ?]: 27-47: the continuation seeding site passes startsNode, NOT the plan's literal true. Measured: libyaml reads 'description: see' / '  ? "quoted' / '  # x, T"' as 'see ? "quoted' with the hash line a COMMENT, so an unconditional true would have made the module GRANT where the loader has none.
- [Phase ?]: D-55: the node-started fact is set at all THREE node-introducing sites (key line, sequence item, continuation), each on the same 'content was actually consumed' guard; the block-sequence exception is an INDENT with one stated reason.
- [Phase ?]: 27-48: startsNode gained the WALK's own answer (cur.state.nodeMayBegin) after the executor's red team reproduced a live silent-no-grant at the gate — the line-level expression was a second, weaker predicate for a fact stripComment already held.
- [Phase ?]: WR-03: both differential harnesses now compare the NAME SET, delegating to keysGrantedAgentNames on both sides so the two differ only in whose flattened value they read; proven red against the pre-27-48 build (2 disagreements) and green against this one.
- [Phase ?]: D-56 items 1-3 done: the D-52 corpus gains 7 grammar-named key-line shapes plus a continuation-DEPTH axis (312 -> 960 cells), so both round-8 critical findings are EXPRESSIBLE.
- [Phase ?]: WR-02's disposition is DERIVE **and then NARROW** — a flow-context derivation cannot carry a title claiming block-context node starts; the relocation is named at both sites.
- [Phase ?]: The WR-04 exemption bound is DELETED (measured: matched = product minus loader-rejected, on every corpus) and replaced by a corpus-level minority floor the exemption cannot control; the narrow detection given up is recorded, not closed by restoring a self-check.
- [Phase ?]: 27-50: D-56 items 4-10 closed. WR-05's offending code point is carried out of the scan that already visits it and is UNREPRESENTABLE on the non-residue arms; 98596-cell derived corpus shows 0 verdict moves and 7536 reason moves, all and only the named shape.
- [Phase ?]: 27-50: IN-02's double-claim domain is [...schemaKeys, ...foreign] rather than the review's Set — foreign is already de-duplicated and disjoint, so the domain is duplicate-free by construction AND the stated order survives, which a Set would have discarded.
- [Phase ?]: 27-50: the 27-43 acceptance criterion is RETIRED (validator vocabulary measured at 0 across 15 terms; file untouched) and SPAWN-03's live capture stays DEFERRED to Phase 33 / GAP-D1 / CAP-01 as UNKNOWN - verify. Both recorded with reasons in deferred-items.md.
- [Phase ?]: 27-51: CR-01 closed STRUCTURALLY — stripComment DERIVES its scalar-closing set from the single-quote style's own escape rule (the '' pair is consumed by index arithmetic; openedAtNodeStart is never recomputed). The chain keeps its 7 else-if arms. unquoteChecked at :945 had always agreed; the walk stated a second, contradicting grammar.
- [Phase ?]: 27-51: the D-52 corpus gains AXIS_QUOTE_STYLE and AXIS_ESCAPE_IN_SCALAR as DERIVED crossings of the base key-line shapes (20 -> 47 shapes, 960 -> 2256 cells, loader-accepted 565 -> 1285), with a collapse-the-axis non-vacuity floor measured in the same run. Against the pre-fix build the SAME corpus reports 180 unsafe silent-no-grant cells where the 960-cell corpus reported 0.
- [Phase ?]: 27-51: family G/G2 RE-MEASURED against this build and recorded STILL OPEN at the module and at the gate (exit 0, ALL CHECKS PASSED). 27-51 is explicitly NOT evidence that the module is bypass-free; 27-52 owns family G.
- [Phase 27]: D-57: a block-scalar header is recognised at EVERY node-start position YAML allows one; the scalar's end is derived from YAML 1.2 § 8.1's more-indented-block rule and its join from the indicator (§ 8.1.2 / § 8.1.3). One-way. Rejected option-b-refuse (4 measured false reds) and option-c-recognise-failsafe (guessed end), each recorded with its reason.
- [Phase 27]: The header's position gate is DERIVED from a grammar property — a plain scalar cannot spell a mapping-VALUE indicator — so key:/: forms need only the scalar closed while bare and ? forms keep the node-start gate. Measured against eight loader rows.
- [Phase ?]: 27-53: the fence-machine scan does NOT exclude *.test.ts, unlike the D-50/IN-05 grammar scan beside it — WR-02's unaccounted machine lives in a .test.ts, so inheriting that exclusion would reproduce the blindness the finding is about.
- [Phase ?]: 27-53: linesRemoved is COUNTED as lines are dropped, never derived from kept.length — the review's own proposed partition assertion was an identity under the derived shape.
- [Phase ?]: 27-53: noUnusedLocals + noUnusedParameters cover SHIPPED sources only; tsconfig.json excludes **/*.test.ts and that scope is recorded rather than left to be inferred.
- [Phase ?]: D-58: a Phase-27 requirement row is [x]/Complete exactly when the most recent verification records it SATISFIED with cited evidence — one written convention applied identically to all ten rows. Rejected convention P (phase-led). Reversible via requirements.revert-phase.
- [Phase ?]: KIT-03 and SPAWN-04 held [ ]/Gaps Found despite 27-51/27-52 closing their underlying bypasses — only a verification round may flip a row (D-58 item 4).
- [Phase ?]: SPAWN-03 stays deferred to Phase 33 / GAP-D1 / CAP-01 as UNKNOWN - verify; ROADMAP.md unedited, wording confirmed identical across all three records.
- [Phase ?]: D-59 — the block-scalar quoting exemption is a property of the REGION the scalar covers; the sticky per-key flag is deleted, and the resolution unit is the maximal run of like-kind regions (D-33 preserved)
- [Phase ?]: D-60 — the block-scalar header recogniser's implicit-key introduction gets its OWN production derived from YAML's mapping-value rule; KEY_LINE loses its second job rather than gaining a wider alphabet (27-56)
- [Phase ?]: The nested key ends at the FIRST colon carrying a separation, a quoted key at its own closing quote; LAST rejected on two loader-REJECTED rows (27-56)
- [Phase ?]: D-61 — a node property never hides a node start; the strip is applied at EVERY introduction the recogniser declares, by iterating the declared set
- [Phase ?]: Closing only the two introductions the review named was REJECTED and measured false — the explicit-key and explicit-value forms were live silent-no-grants too
- [Phase ?]: The reference refusal gains application point 4 of 4 at the node start following a mapping separator, derived from the same introduction set
- [Phase ?]: D-62 — a block scalar ends at its OWN detected content indentation, with the header line's indent as the FLOOR; the explicit indentation digit is HONOURED; a blank line inside an open scalar is CONTENT (27-58)
- [Phase ?]: The D-52 key-line axis grows by DERIVATION over the base shapes' declared header parts — AXIS_KEY_LINE_BASE stays at 26 while the corpus goes 2,544 -> 16,704 cells
- [Phase ?]: The node-property crossing is scoped to the mapping-separator introduction; the 1,440 loud refusals at the other two introductions are generated by the same derivation and adjudicated in their own case rather than exempted
- [Phase ?]: stripComment's offset-zero node-start fact becomes its own axis — the state vector space goes 24 -> 48, the full product of five independent factors
- [Phase ?]: The pre-fix capture is a COMPOSITE of two builds (62b8b53 text, d5c69e0 state); each half was regenerated at its OWN commit and the provenance is recorded IN the fixture
- [Phase ?]: tsconfig.tests.json extends the shipped-source config and overrides only the exclude list; tsconfig.json stays byte-unchanged so committed .js and freshness are undisturbed
- [Phase ?]: CI gains an explicit typecheck step — the review assumed one existed and none did
- [Phase ?]: The fence classification asserts one authority carrying neither disqualifier plus every other member carrying at least one, rather than exactly one class per member, because the live tree showed a member legitimately carries two
- [Phase ?]: The IN-03 slice marker is ADDED in the file's own section-rule idiom rather than repurposing one 76 lines away
- [Phase ?]: D-63 — all ten round-10 items close in round 11, none deferred; sixth application of the close-them-all convention
- [Phase ?]: 27-61 — assertion-shaped edits cannot be pinned by reverting them; pin by planting the defect they exist to catch
- [Phase ?]: 27-62 (D-64 Part A): the canonical-form admission reader ships as a NEW module, scripts/canonical-frontmatter.ts, with two outcomes and no third. CR-01 and CR-02 are DISSOLVED by refusing block scalars and node properties outright rather than by a twelfth widening of frontmatter.ts, which is byte-unchanged.
- [Phase ?]: 27-62: the admitted grammar follows the MEASURED corpus, not D-64's prose — ten keys not eight (D-64's premise scan omitted the two packaging templates and with them kind/tier) and a restricted double-quoted arm on description/argument-hint (31 quoted scalars D-64 never scanned for). Implementing the stated eight-key plain-only alphabet literally would have refused 31 of the 33 live files, violating D-64's own vacuity trap 1.
- [Phase ?]: 27-64: the seven standalone skill twins are GENERATED and BYTE-GATED (D-64 Part B) — the never-bypassed adapter mechanism extended to the SKILL.md surface that failed eleven rounds
- [Phase ?]: 27-64: INVARIANT and RESOLVER live once, in scripts/kit-model.ts, imported by both generators
- [Phase ?]: 27-64: guard_distribution_pair kept intact — it and the new byte gate overlap deliberately; consolidation is a later decision
- [Phase ?]: The rounds-1-11 bypass corpus is a cited ARTIFACT (scripts/canonical-corpus.ts, 91 rows): every row carries round, finding id and source path, and unresolvedSources() asserts each path resolves.
- [Phase ?]: 27-63: all 91 historical bypass shapes are REFUSED by the canonical reader on their declared code — 0 admitted, 0 mismatches. D-64 vacuity trap 2 satisfied as a measurement.
- [Phase ?]: The block-scalar widening admits ZERO rows because the reader refuses in two independent places (sigil table AND alphabet) plus the line productions — the plan's task-3 premise, falsified by measurement and reported rather than worked around.
- [Phase ?]: D-64 Parts A+C CUT OVER: the spawn verdict is rendered by canonical-frontmatter.ts at FOUR verdict sites; scripts/frontmatter.ts demoted to convenience reader by comment-only edit
- [Phase ?]: 27-65 scope amendment (human-authorized): coordinator-resolution-precheck.ts was a FOURTH verdict site the plan did not enumerate; source assertions must derive their file set from the importer list, never name one file
- [Phase ?]: 27-65 NARROWING: the canonical form admits 2 of 7 legitimate YAML spellings of one declaration; quoted name, folded description and the exact duplicate-key count are gone. Live cost measured zero (33/33 admit)
- [Phase ?]: Round-12 register uses FIXED zero times: round 12 repaired nothing in scripts/frontmatter.ts (0 non-comment diff lines), so DISSOLVED/DEMOTED/SUPERSEDED are defined and used instead
- [Phase ?]: KIT-03, SPAWN-04 and SPAWN-03 held: REQUIREMENTS.md and ROADMAP.md changed by ZERO bytes; the stale KIT-03/SPAWN-04 narratives recorded as an owned non-edit rather than rewritten
- [Phase ?]: AUDIT-02 enforcement landed as a THIRD consumer of scripts/dead-vocabulary.ts (D-09) with a derived, two-sided-pinned scan set — never a fourth list
- [Phase ?]: D-10 held structurally: an array-equality case makes adding any token to either retired-vocabulary array a red test, so the still-correct 'routes' verb cannot be banned by judgement call
- [Phase ?]: D-20 closed on all three axes: anchored beat regexes, WR05_MAX_LINE_BYTES=262144 refusing by name, and a permanent control that was SIGTERM-killed at 20s pre-fix and returns in 0.08s after; verdict preservation proven by an empty byte-diff.
- [Phase ?]: D-20's closed-class premise measured wrong: 4 pure-lookahead regexes under scripts/, not 3; the fourth is a String.split() separator kept as a named exemption.
- [Phase ?]: AUDIT-04 pins measured at execution time: @playwright/test 1.62.1 (roadmap's pre-named 1.62.0 is stale by one patch, F-28-A), @axe-core/playwright 4.12.1. No live freshness gate.
- [Phase ?]: D-21 resolved NOT REQUIRED on reach by import-closure measurement (context-io.ts and canonical-frontmatter.ts disjoint both directions), independently corroborated; 28-08 nonetheless RUNS on independent grounds.
- [Phase ?]: Checkpoint overrides: D-19 item 3 assigned to 28-08 inside phase 28 (not Phase 30, which is what makes it worse); residual 2 pulled forward to 28-08 with its patch and RED-first property attached.
- [Phase ?]: readRegistry() lands in 28-03 beside readRegister(): one parse authority for both Phase 28 audit artifacts, never a second grammar in 28-04.
- [Phase ?]: safety_surface gained a third legal value, the unfilled marker '—': the PARSER admits it and the GATE refuses it, so an unread row cannot record a verdict nobody reached.
- [Phase ?]: AUDIT_SET_COUNT is pinned against kit-model's ROLE_COUNT/WORKFLOW_COUNT, not against the live derivation — the plan's wording reduced to n === n, a floor written over the wrong quantity.
- [Phase ?]: Finding ids stay canonically F-28-NNN; 28-02's F-28-A..G are refused by name and 28-06 renumbers them, rather than the grammar being widened to admit both spellings.
- [Phase ?]: Claim ids are C-28-NNN, not the plan's CLM-NNN — the committed parse authority pins the canonical form and widening it is the D-64 move
- [Phase ?]: Claim findings cannot be disposition-register Table B rows (the parser refuses a file with no Table A row); they live in the registry in a reserved F-28-2NN band
- [Phase ?]: README.md's version 0.1.0 claim measured TRUE, flipping the plan's carried-in verdict — CHANGELOG.md's version note reconciles the tag namespace
- [Phase ?]: 28-05: the AUDIT-02 drift guard turned green because the eight public documents were rewritten — scripts/, install/, hooks/ and package.json are byte-unchanged, PUBLIC_DOCS_SCAN_COUNT is still 10 and both dead-vocabulary arrays keep their exact members.
- [Phase ?]: 28-05: C-28-001, C-28-010 and C-28-038 flipped false -> overstated/accepted, not true — each is a multi-assertion region whose worst-of rule lands on the irreducible 'always' residual already accepted at C-28-023.
- [Phase ?]: 28-05: examples/03-ticket-to-pr.md is NOT fully disjoint from Phase 33 GAP-D1 — the DOG-02 parity table's intro and its 'Handoff filenames produced' row overlap at row granularity. Those two lines were left untouched and the overlap is recorded in the register for CAP-01.
- [Phase ?]: 28-05: D-12's code-context note is corrected — install/uninstall.ts is indifferent to the deleted kit directories by CONSTRUCTION (it never touches the kit tree), not by derivation.
- [Phase ?]: 28-07: ZERO D-19 trivial fixes taken in the 19 workflows — all 17 findings need a design call, a Phase 29 prose rewrite, or a packaging change; git diff agent-factory/ is empty
- [Phase ?]: 28-07: the four not-installed findings (context-io, claim.js, compactor) are recorded PER FILE, not folded — each names a different module and LANG-02 acts per file
- [Phase ?]: 28-07: the D-01 amendment could not be a Table B row; refusal watched on a mirror. Third plan in the phase to meet this instruction class; the grammar was not widened once
- [Phase ?]: 28-07: the stale expected-red test assertion was INVERTED to exit 0, not deleted — it is the only case running the gate against the real artifact
- [Phase ?]: Residual 2 closed by sliceBytes' missing BASE CASE, not a special case — the separator rule answered a count question with a bounds test and silently admitted the empty slice
- [Phase ?]: scripts/canonical-frontmatter.ts NOT edited: residual 2 does not live there (import closures recomputed, disjoint both directions). F-28-041 filed against the plan's own stale premise
- [Phase ?]: The safe direction is proven BY CONSTRUCTION — trim('\n'+X) === trim(X) — so no refusal can be dropped, then measured 0/231213 anyway
- [Phase ?]: D-19 item 3 RAISES the timeout ceiling to 30s explicitly; the knob was watched taking effect at 1ms (43 tests timed out)
- [Phase ?]: D-22 part 3 (two independent red teams) NOT satisfied — no agent-spawning tool available; reported as a gap in the register, not dressed as a pass
- [Phase ?]: RED TEAMS CLOSED D-22 part 3: A=PARTIALLY REFUTED, B=EVIDENCE WEAKER THAN STATED. The fix survived untouched; the RECORD was wrong in five places
- [Phase ?]: Plan 28-08 SHIPPED a NUL byte (a290ee7) — the only one in 1450 tracked files — and then gated the class with scripts/check-nul-bytes.ts, landed RED against the real tree
- [Phase ?]: The NUL gate scans EVERY tracked path with no exemption list: deriving the set from git's --eol classifier would have excluded the very file it needed to read
- [Phase ?]: D-22 part 2 is met by its byte-count half ALONE; the loader half is measurably NULL for this defect class (byte-identical on the pre-fix build)
- [Phase ?]: A plan requiring independent red teams must name WHO commissions them — the executor may have no agent-spawning tool
- [Phase ?]: e193027 carried .js/.ts drift; npm run freshness CANNOT catch that class because it rebuilds from the working tree, not the committed .ts
- [Phase ?]: D-22/D-23/D-24 shipped: scripts/voice-model.ts is the ONE caveman-fence reader; both role-prose guards call it and neither holds a fence state machine. The tracked fence-machine set falls 4 to 3.
- [Phase ?]: D-06/D-07 shipped: guard_caveman_voice is a two-sided conjunction (>=2 lexicon terms AND zero banned constructions); the ^You cadence arm was DELETED, not supplemented.
- [Phase ?]: AP-1 closed at the call convention: scripts/vacuity.ts reportMeasured is the single element-level rule, emitting through fail() never warn().
- [Phase ?]: [29-02] D-44 executed as four steps, and step four is the durable one: plant the claim, land guard_banned_claims RED, delete the claim to GREEN, keep a hermetic fixture that plants it forever
- [Phase ?]: [29-02] The bare discipline name is a CONDITIONAL banned literal (a conformance verb must share the line); the product-name spellings are unconditional — banning the name outright would make the disclaimer's own denial illegal
- [Phase ?]: [29-02] The profile's four registry rows are kind: architecture — no SAFETY_FLOORS member holds an honesty claim, so Phase 30's kind:safety claim-dropping will not reach C-28-039..042 (recorded, not papered over)
- [Phase ?]: [29-02] REQUIREMENTS/ROADMAP token-count assertion softened to UNKNOWN - verify in both directions (D-34); every measured half kept, including caveman-as-token-economy disproven on this artifact
- [Phase ?]: D-39 executed literally: two predicates get two names inside one module (guard_imperative_lexicon, guard_sentence_form)
- [Phase ?]: The gate needed per-line fence knowledge, so frontmatter.ts's ONE machine now answers per line and stripFencedBlocks is a projection of it — the tree still carries exactly three fence machines
- [Phase ?]: WP-05 was aligned to the shipped predicate rather than filtering voice-model.ts's closed modal set to an obligation subset — a filtered copy is a second list
- [Phase ?]: A markdown table row is split into CELLS before sentence measurement: a row is not a sentence, and measuring it whole would red correct tabular text
- [Phase ?]: 29-04 D-05 executed as a TWO-SIDED diff read: reading only the added side was a fail-open, because a reworded frozen sentence's protected text exists only on the removed side
- [Phase ?]: 29-04 D-01 source (b) enforced POSITIONALLY (section located by heading) rather than by text equality — a reword defeats equality and cannot defeat a heading; sources (a) and (c) stay textual because they are wording contracts
- [Phase ?]: 29-04 D-01 source (c) EXTRACTED from check-foundation-guards.ts by canonical form (it runs at module load and cannot be imported); D-01's third literal 'UNKNOWN - verify' does not exist as a positive guard literal and is RECORDED rather than manufactured
- [Phase ?]: 29-05: the D-30 fallback names agent-factory/README.md, not the config-dial reference — check-kit-refs (SHOME-03) refuses any agent-factory/config/ path in kit prose, and the README carries claim C-28-032 already
- [Phase ?]: 29-05: a Responsibilities item is deleted when its SUBJECT is a boundary Hard limits already states, and kept when its subject is an act Hard limits merely bounds — the rule is written into the disposition file so 29-06/29-07 apply the same one
- [Phase ?]: 29-05: the two voice-guard count literals (17/12) are now DERIVED from the live corpus through voice-model.js, fenced by a non-vacuity floor and plan 29-01's baseline as a monotonic ceiling; falsifiability proven by two scratch mutations
- [Phase ?]: 29-06: the orchestrator's `## One job` first sentence compressed 29 -> 17 words while retaining every routing-matchable term, because that sentence IS the main-thread adapter's routing description
- [Phase ?]: 29-06: a telegraphic caveman paraphrase of a CAPABILITY rule (the orchestrator's spawn-tool line) is deleted rather than rewritten as attitude — a compressed paraphrase of a capability rule is the greater risk
- [Phase ?]: 17/17 role files now carry measured caveman voice and zero duplicate clauses — the aggregator exits 0 for the first time in phase 29
- [Phase ?]: security-nfr.md left 101B above its advisory WARN tier rather than taking a fifth unplanned removal from safety-bearing prose
- [Phase ?]: C-28-003, C-28-012 and C-28-032 all flipped overstated -> true; three stale 18-counts corrected to 17 with the listRoles() derivation rule beside each
- [Phase ?]: The 29-05 non-vacuity floor fired as designed; the || falsifiability fixture now PLANTS its red instead of borrowing it from the corpus
- [Phase ?]: 29-08: the actor moves to a trailing parenthetical in a multi-agent workflow step rather than being deleted — the guard's own remedy prescribes it
- [Phase ?]: 29-08: a modal that carried a prohibition is replaced by 'never', which is stronger than the modal it replaces — the only direction a safety rule may move under a style pass
- [Phase ?]: 29-08: 'Say no to bloat.' was DROPPED from 02-idea-to-epics.md rather than dispositioned — the split would have minted a workflow copy of ba-pm.md's Hard limits, and a companion cell would record the duplication as considered rather than prevented
- [Phase ?]: 29-08: the visited denominators ROSE (bullets 125->139, sentences 1816->1934) because a split step is a second bullet; the corpus deltas equal this batch's deltas exactly, which is what distinguishes a raised denominator from a narrowed scan
- [Phase ?]: 29-09: an over-long `## Steps` bullet is split INSIDE its own bullet, not into a second bullet — deriveElements() pushes one bullet per LINE, so all seven files' bullet denominators are unchanged (the constant 29-08's raised denominators could not offer)
- [Phase ?]: 29-09: 12-release.md's three-way sentence partition was written into the register BEFORE the file was opened; five of nine Set A safety sentences end byte-unchanged, including the whole `## Stop conditions`
- [Phase ?]: 29-09: a pre-existing frozen-text collision (`mark anything unverified UNKNOWN - verify`, owned by eight role `## Hard limits`) was given a companion cell rather than deleted — 29-08's drop-the-duplicate precedent covers duplications a style pass CREATES, not ones that predate it
- [Phase ?]: All nineteen workflows now carry the writing profile; guard_imperative_lexicon reports its first green at 0 findings over 139/139 elements
- [Phase ?]: The pointer reconciliation for the two single-source workflows was a no-op, and it was MEASURED to be one: all eighteen role pointers reference by PATH and quote no prose
- [Phase ?]: 29-09's 'eight role files' count for the UNKNOWN - verify frozen collision was re-measured as THREE for this clause; the measured figure is used and the inherited one named
- [Phase ?]: The plan's 104,094-byte workflow baseline is falsified by re-running the research's own command: 104,048 at 4d2b8f0
- [Phase ?]: guard_imperative_lexicon's zero over the checklists part is an EMPTY DENOMINATOR, not a pass — no hand-authored checklist carries a `## Steps` heading (29-11)
- [Phase ?]: Every checklist bullet is an ACCEPTANCE ITEM decided by section anchor; none was reshaped into an imperative, and nine of thirteen files are byte-unchanged (29-11)
- [Phase ?]: Swapping a bare demonstrative for `it` clears WP-06 and was refused four times — it moves text outside the predicate's closed token set while leaving the defect in place (29-11)
- [Phase ?]: agent-factory/packaging/subagent.frontmatter.md:204 is a NAMED LEAVE-ALONE: past-tense history is a mention of the retired vocabulary, not a use (D-46, 29-11)
- [Phase ?]: agent-factory/README.md and _commit-convention.md got vocabulary-only fixes — style-rewriting an out-of-corpus file extends a two-sided pinned corpus by stealth (D-36, 29-11)
- [Phase ?]: guard_imperative_lexicon's zero over the seed templates and the contracts is an EMPTY DENOMINATOR — neither part carries a `## Steps` heading, so with 29-11's checklists the predicate has never run over three of the corpus's four parts
- [Phase ?]: context-note.md:35's WP-06 finding was a PER-LINE SEGMENTATION ARTIFACT on a relative pronoun; widening the predicate and re-wrapping the line were both refused, the sentence was split on independent grounds, and the limitation is left OPEN as a residual
- [Phase ?]: board.md:64's entry criterion was re-narrated onto the kit's existing 'recorded as typed notes per Workflow 16' spelling rather than noun-swapped — the sixth and last D-46 occurrence, closing 29-11's arithmetic
- [Phase ?]: The board's 13 column names and the 6 note kinds are byte-identical: both derivations read the FIRST table cell, so the second-cell correction is out of their reach by construction
- [Phase ?]: Phase 29 byte-ceiling re-baseline HELD (hold-rebaseline): roleCeiling() is byte-unchanged against phase base 4d2b8f0. Recomputing +12%/+6% from today's sizes would RAISE 12 of 17 ceilings, because each encodes a 2026-06-10 baseline that 12 roles have since outgrown. LANG-08 partially met — never-raised and delta-recorded hold; the re-baseline did NOT happen and the requirement is deliberately left open.
- [Phase ?]: Ratchet-down ceiling values (min(recomputed,current); 5 rows lower, 12 held, -1,069 B / -14.6% corpus headroom) are PRESERVED in docs/audit/29-ceiling-rebaseline.md as a deferred finding for the next phase to touch the table — re-measure before applying.
- [Phase ?]: D-14-A (29-14): the caveman fence reader is bounded to its own section — SECTION_END (/^## /) computed once after the anchor and consulted by BOTH scans; a delimiter under a later heading is another section's and is refused 'missing' rather than adopted.
- [Phase ?]: D-14-B (29-14): a '## ' line inside the caveman fence interior refuses 'unterminated' rather than returning a shortened interior — the fail-CLOSED direction, stated at the bound so it is not later 'fixed'.
- [Phase ?]: D-14-C (29-14): the voice harness derives role membership from the root it MEASURES (roleNamesIn(root)); every rootless listRoles() call site is audited and either converted or recorded as a deliberate live-tree residual with its reason.
- [Phase ?]: D-15-A: the companion edit is decided PER CARRIER — the commit that actually changed the clause, never the range
- [Phase ?]: D-15-B: an uncommitted change set is a NAMED carrier (WORKING_TREE_CARRIER), not an unattributed pass
- [Phase ?]: D-15-C: the attribution map is keyed on normalized clause TEXT, never the line number — a carrier's line differs from the range's by the lines edited above it
- [Phase ?]: D-15-D: an unresolvable attribution is a refusal with its OWN wording (NO CARRIER FOUND), distinct from a missing companion edit
- [Phase ?]: D-16-A: a companion cell is FILLED only by clearing a derived word floor; no rejected spelling is enumerated in the gate
- [Phase ?]: D-16-D: locateSection takes no opt-out parameter — an opt-out is a second grammar with extra steps
- [Phase ?]: D-16-E: the published element grain is the changed watched FILE, and the label says so
- [Phase ?]: D-17-A: the step marker's leading-indent class is [space,tab], NOT the general whitespace class — the general class matches a line terminator and the predicate is indentation on a single line
- [Phase ?]: D-17-B: the ## Steps anchor is released by a heading of level at most two and by nothing else; a sub-heading STRUCTURES a section rather than ending it
- [Phase ?]: D-17-C: the guard banner did NOT move — it already named the subset the code now measures, which is the finding itself
- [Phase ?]: D-17-D: the published element grain at both controlled-language guards becomes the governed FILE, and both labels say so (19/19 and 47/47)
- [Phase ?]: D-17-E: CorpusElements.sentenceFiles deliberately NOT added — sourcing visited from it would move visited off the classification loop and disarm the zero-element vacuity branch
- [Phase ?]: D-17-F: the corpus-cardinality refusal stays distinct from the two denominator refusals — scan-set size and loop reach have opposite remedies
- [Phase ?]: D-18-B (29-18): a safety exemption's widening is proven from BOTH sides — permissive cases that newly pass AND scope controls green on both builds, plus a UNION case on one line carrying the exemption and a violation together
- [Phase ?]: D-18-C (29-18): locateExemptRegion exported — no exit code can express where a region STOPS, and a predicate a case cannot reach is a predicate nothing pins
- [Phase ?]: D-18-F (29-18): the ./frontmatter.js consumer pin moved 7 to 8 rather than being loosened — a two-sided pin going red on an intended change is the pin working
- [Phase 29]: LANG-08 closed by a RECORDED HUMAN OVERRIDE in 29-VERIFICATION.md frontmatter, not by code: must_have and reason transcribed byte-identically (133 B / 363 B) from the report's own drafted block, accepted_by/accepted_at filled for real, overrides_applied moved 0->1 in the same edit (counter == block length under an independent libyaml load)
- [Phase 29]: The ratchet-down remedy was NOT applied and NOT deleted — the user chose to record the override instead; roleCeiling() proven byte-unchanged (sha256 862e72d8 .ts / b8d83f94 .js, 114 numeric literals) across phase base 4d2b8f0, round base d29bc7b and HEAD, in the source AND the committed .js, because plan 29-18 legitimately edited the same file
- [Phase 29]: grep -c '^overrides:' returns 2 and cannot return 1 — the report's own drafted block inside a yaml fence carries a column-0 overrides: line; criterion SUBSTITUTED to count inside the frontmatter region only (1 key, 1 fenced prose copy), and the count of 2 is itself the control that the transcription evidence survived
- [Phase ?]: 29-20: the caveman section bound moved to ONE shared locator in frontmatter.ts (unfencedHeadingIndex / sectionEndIndex); voice-model.ts's private SECTION_END and anchor regex are DELETED, not corrected (D-24).
- [Phase ?]: 29-20: 29-14's 'unterminated on a ## inside a terminated fence' expectation is SUPERSEDED — a fence-aware bound makes that refusal a false red, the same class as WR-01; a new case pins the genuinely-unterminated form.
- [Phase ?]: Consumer-side corpus pin is SET CONTAINMENT, not the sketched cardinality floor — 40 watched vs a 36 minimum leaves four files of slack and the attack narrows by one (mutation M2)
- [Phase ?]: Derive the set, then assert the count: a containment pin needs its own expectation's cardinality pinned two-sided, or a short lister moves both sides at once
- [Phase ?]: generate-safety-surface.ts is byte-unchanged — the defect was an unconstrained INPUT to the derivation, not a defect in it
- [Phase ?]: 29-22 (D-26): the section-extent derivation carries THREE constructs, not the two the review and the plan name — the two-construct sketch is blind to readDispositionRows, the very locator the plan exists to close; the blindness is asserted by a case, not argued.
- [Phase ?]: 29-22: the level-one corpus assertion is scoped to headings BELOW a '## ' section, not every line after the first — the plan's literal predicate is false on the live corpus by 37 members (every role/workflow title at line 6).
- [Phase ?]: 29-22: readDispositionRows fails OPEN and says so in source — a row satisfies the structural companion arm, so a spurious row ADMITS a change that owed a companion edit; the opposite direction from locateSection's truncation.
- [Phase ?]: 29-24 (HUMAN): WR-04 resolved as retire-residual — Residual 1 retired, replacement published as WP-11 (decidable) in agent-factory/writing-profile.md. Cost accepted: a new constraint on every future workflow author.
- [Phase ?]: 29-24: the WP-11 sentence is a LITERAL in both the gate refusal and the profile, deliberately not shared via export — the property pinned is that the two artifacts say the same thing to an author.
- [Phase ?]: 29-24: boardColumns' terminator is deliberately NOT unified — where a TABLE ends is not where a SECTION ends.
- [Phase ?]: LANG-07's owner scan reported TWO members and the extra was CLOSED, not absorbed: audit-model.ts::tableUnder (the fifth locator, logged by 29-22/23/24 and fixed by none) now delegates to the one authority.
- [Phase ?]: 29-24's demanded exemption for HEADING_LINE is STRUCTURAL: the conjunction requires a recogniser USED in a terminating position, and continue is neither — no module is exempted by name.
- [Phase ?]: [29-26] HUMAN DECISION (Olger Oeselg, 2026-08-15, at plan 29-26's blocking checkpoint during /gsd-execute-phase 29): `reopen-for-survivors` — "Reopen for the surviving adversarial variants only." Gap-closure round 2 does NOT close. R4 was NON-EMPTY: four adversarial variants invented at execution survived — V-29-26-01 (setext heading is not a section boundary to the authority; fail-open; 0 live), V-29-26-02 (the derived scans proving LANG-07 read 41 of 49 and 47 of 53 while the case name, the refusal wording and 29-25's summary all call them tree-wide; 0 found in the unread sets), V-29-26-03 (FENCE_DELIMITER_LINE is a prefix test where CommonMark counts run length, so a four-backtick fence is closed early; fail-open; 0 live), V-29-26-04 (the fence authority is column-zero anchored where CommonMark allows three spaces of indent; SIX live lines of README.md are classified as governed prose today; fail-closed only by the accident that the four indented delimiters pair up, so an odd count in any document inverts the direction). Phase 29 is NOT complete and no LANG requirement is verified or closed by this round.
- [Phase ?]: [29-26] Round-3 charter, as the decision implies it: the four V-29-26-NN survivors ONLY. R1 (Residual 4), R2 (the seven round-1 carry-overs), R3 (T-29-23-05) and the further R5 residuals stay out of scope unless separately decided. Structural observation carried forward: V-29-26-01, -03 and -04 all live in the FENCE authority's grammar rather than in the section locator, so they are plausibly ONE follow-up plan rather than four; -02 is a different shape (a scope claim), whose recorded remedy is to derive the set and assert its cardinality against an independently derived count. WARNING: round-1 and round-2 REUSE the same finding ids for DIFFERENT findings (WR-01, WR-03, WR-04, WR-07, WR-08, IN-04) — IN-02 is the ONLY id that is the same finding in both, stated at 29-REVIEW.md:544. Always write the round with the id.
- [Phase ?]: 29-27: readCavemanFence's section bound is taken from sectionEndIndex over a DELIMITER-NEUTRALISED projection — the shared authority is composed, not re-implemented, and the fence being measured can no longer decide its own section's extent (CR-01 closed, no private heading regex added)
- [Phase ?]: 29-27: guard_voice folds through reportMeasured — a derived denominator (ROLE_COUNT + SEC_VOICE_FILE_COUNT), a per-file scanned line count, and an element-level floor making a collapsed remainder a named finding. AP-1's last live instance is closed.
- [Phase ?]: 29-27: guard attribution in the harness is re-keyed from COLUMN to output SECTION (guardSection). Folding guard_voice through the shared authority indented its findings, and a whitespace-keyed partition would have silently stopped discriminating — the same class as this phase's recorded bypasses.
- [Phase ?]: CLAIM_HEADING_RE stays declared in audit-model.ts: domain vocabulary, not section grammar — its USE moved into the authority, not the constant
- [Phase ?]: unfencedMatchIndices is a THIRD locator function, not a widened one: three predicates, one fence toggle beneath all three
- [Phase ?]: A shared authority refuses a g/y flagged RegExp by name rather than resetting lastIndex — repairing the caller's object hides the bug at its next use
- [Phase ?]: A document-level PARITY check cannot see two errors that cancel; pair it with a point-of-effect check on the artifact the parity protects
- [Phase ?]: 29-31: WP-11 and WP-04 narrowed to the `## Steps` spelling the gate decides, rather than widening STEPS_HEADING — widening needs sectionEndIndex's level parameter with it, four gates at once, and belongs in its own plan
- [Phase ?]: 29-31: a disclosed floor carries a TALLY, not a paragraph — steps headings are counted by ATX level by three independent fence-aware patterns, published on every run, reconciled against the section-extent loop, and refused by name above zero
- [Phase ?]: 29-31: a probe that spawns a built gate must assert the build RAN — macOS /var -> /private/var breaks the ESM entry-point guard and yields exit 0 with empty output, which is indistinguishable from a pass
- [Phase ?]: 29-30: SAFETY_CLAIM_HOMES — the safety arm's CLAIM->HOME roster, added beyond the plan after the adversarial pass MEASURED a count-preserving rehome bypass (all seven gates green); a cardinality is blind to membership by construction
- [Phase ?]: 29-30: the plan's consumer residue equality is false on the live tree (4 members, not 3) and vacuous besides; implemented as a partition with two independently-sourced parts
- [Phase ?]: The drift route is DELETED (one array under both traversals) and the -1 guard kept as contract — a guard on a disagreement that can still occur is a smaller fix than a disagreement that cannot
- [Phase ?]: A function returning INDICES must refuse a caller whose array disagrees with the text it was asked about — both guards can pass while the answer is applied at the wrong offset
- [Phase ?]: The delimiter-neutralised projection was NOT hoisted and no second copy written; the swallow is caught quantitatively (extent) plus at the point of effect (region ends inside a fence)
- [Phase ?]: V-29-32-01 recorded not closed: a CLOSED-fence count-preserving compensating edit is indistinguishable from plan 29-18's deliberate WR-06 case
- [Phase ?]: 29-29: both classifier arms widened, not the recogniser alone — measured, neither widening alone reaches the pre-29-28 site
- [Phase ?]: 29-29: floor item 1 measured REACHABLE twice (generate-catalog.ts:87, generate-role-adapters.ts:127) — a fence-blind third section grammar, ESCALATED as V-29-29-01 not absorbed into the owner list
- [Phase ?]: 29-29: multi-line expect( normalisation NOT shipped — two paren counters disagree on 14 live lines, the quote-aware one runs 3 assertions to EOF, and normalisation gains zero measured coverage
- [Phase ?]: 29-33: SEC_VOICE_FILES membership pinned two-sided against a declared sorted roster AND a derived per-member property floor (safetySurfaceUnion arm A / the ASVS generator's OUT literal arm B); the cardinality pin was KEPT, not replaced, because it catches ADD/REMOVE at gate run time which the source-level roster does not
- [Phase ?]: 29-33: no roster literal added to the guard SOURCE — two literals in one file compared against each other is one number compared with itself; the companion lives in the test as a genuinely independent second artifact
- [Phase ?]: 29-33: two residuals ADMITTED and named in source rather than closed — a one-commit edit of guard literal + roster + property source is a D-04 reviewability guarantee not a mechanical one, and the source-level pins do not see a committed-.js edit (npm run freshness measured to red on that route, exit 1 naming the file)
- [Phase ?]: 29-34: removedLines from index arithmetic and outsideLines by counting the removal predicate — two routes, so the accounting identity can actually fail
- [Phase ?]: 29-34: a per-file table of 19 hand-measured minimum remainder ratios REFUSED per D-28; the residual is disclosed at the declaration and pinned instead

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

**Open — carried into the next milestone:**

- **[v2.0] `windows-latest` CI leg is RED** on 3 test files (9 failures). 7 are harness/fixture artifacts (path-separator assertions, a CRLF token, a symlink-privilege fixture, an unbuildable old-layout fixture cascading into 2 more); 2 are a real Windows limitation of the ubuntu-scoped freshness mirror-rebuild. **Zero failures in the v2.0 substrate.** MIGR-04's Windows case is *unverified, not disproven* — its test fails as a cascade of the unbuildable fixture (empty output = the migrate never ran). The cross-platform-including-Windows constraint makes fixing this a standing obligation, not optional.
- **[v2.0] `orchestrator.md` is 7562B against a 7165B `guard_role_size` WARN threshold and grows every phase** — it is the PAR-01..04 coordinator spine, so accretion is structural, not incidental. Five other roles (brownfield-mapper, frontend-ui, greenfield-mapper, qe-e2e, security-nfr) also sit near the ceiling. Advisory today (`check-foundation-guards` exits 0); a hard FAIL on the current trajectory. Trim or split **before** adding to it.
- **[v2.0] `CLAUDE.md` drift** — the repo's project-instructions file still describes "handoff packets" and an Orchestrator that "routes work"; v2.0 deleted all 17 handoff templates (MIGR-02) and redefined the Orchestrator as a decomposer (PAR-01). It governs agent behavior repo-wide, so it was deliberately left for an explicit reconciliation rather than rewritten during the close.
- **[v2.0] GAP-D1** — the A3/DOG-02 retirement flip and its coupled `examples/03-ticket-to-pr.md` edit wait on ONE captured live dual-path run on an authed box. A loud-skip is never a capture (D-01/D-02); cost never gates it (D-11). Oldest open item in the project.

**Standing invariants — violate these and something silently breaks:**

- **[v2.0] Verify-before-write is an un-dialable floor.** Nothing enters the shared context without a real, non-self verification stamp. The governance dials add friction *above* this floor; no dial value, typo, or corrupt config may drop below it — the hook fails closed on any non-canonical `human_admission` value.
- **[v2.0] One authority per predicate.** If two code paths decide the same question (note boundary? finding? high-severity role?), they *will* drift, and the drift is the exploit — this cost 13 green-suite-insufficient catches to learn. Export one authority; make both consult it. Never ship a detector whose accept-set is narrower than the parser's.
- **[v2.0] A safety invariant is not closed by a green suite.** Closure requires a structural fix + ≥2 *independent* red-teams + reproduction of the bypass (D-12). Price these rounds into the phase estimate.
- **[v1.2] Migrate/update is the highest-blast-radius surface** — it runs irreversibly on the user's repo. Never delete-first; rename-to-backup; deletion only behind `--prune-old-kit`; bounded marker-strip; RED harness first.
- **[v1.2] Config-dial regressions cut both ways** — a capability with no dial over-taxes solo users; an enterprise gate that is prose-only is skippable. Every capability needs a lean default plus a mechanical enterprise escalation.
- **[v1.2] Voice discipline** — security findings, test-integrity verdicts, and data-loss warnings are clear professional English; role prompts keep terse grug voice (the token-economy mechanism). `guard_voice` enforces both directions.
- **[v1.2] Single-source drift** — content lands ONCE under `agent-factory/`; adapters stay pointer-sized; gate changes go only in `05-pr-quality-gate.md`.
- **[v1.1] LLM-in-prose anti-pattern** — NO role/workflow/SKILL body/AGENTS.md may name `$GRUGOPS_HOME`. Only `${CLAUDE_PLUGIN_ROOT}` expands inline (plugin form); arbitrary env vars are dead strings in prose. The adapter holds the only env-var reference; the installer materializes the absolute path.
- **[v1.1] Config location** — per-repo config is `.grugops/factory.config.json` (SHOME-02 LOCK), install marker/version stamp in `.grugops/`. The older repo-root recommendation is SUPERSEDED.

**Resolved during v2.0:**

- ~~[v1.2] WR-05 spawn-grant regeneration hazard~~ — **retired in v1.2, then deliberately inverted in v2.0.** The original v1.2 closure, retained verbatim because the Tier-1 `oracleWr05Wording` oracle asserts these three beats across all four tracking docs:
  - The `Agent` spawn grant was **dropped** from both packaging templates in **Phase 8**.
  - It was then guarded mechanically by `guard_wr05` (`scripts/check-foundation-guards.ts`) in **Phase 10**.
  - It was **re-verified GREEN** after the **Phase 11** 16-role persona rewrite, proving the overhaul did not silently re-arm sub-agent spawning.
  - **v2.0 reversed the underlying decision for Claude Code (PAR-04).** `guard_wr05` was inverted from "no role grants `Agent`" to "**exactly one coordinator** grants `Agent(<allowlist>)`", proven RED against the committed `.js` and flipped atomically with the packaging templates + docs catalog. A phase code-review caught the inverted guard mis-reading a fenced coordinator example as a live coordinator; fixed structurally with fence-stripping + exactly-one-coordinator cardinality. **Do not reintroduce a "no spawn anywhere" assertion — it is now wrong.** The four non-Claude-Code CLIs keep sequential no-spawn role-load, and the 5-tool tables are intentionally asymmetric (the oracle asserts that too).
- ~~[v1.2 Research flags]~~ — all three resolved in their phases (ASVS 5.0.0 pinned, Playwright pins verified, frontmatter completeness confirmed by the catalog generator).
- Pre-existing (NOT from 27-30): a UTF-8 BOM before the opening delimiter reaches the legitimately-keyless SUCCESS arm in parseFrontmatter, with or without a directive. Zero live exposure; logged in 27 deferred-items.md as a round-5 decision.
- scripts/validate-agent-factory.ts is NOT a spawn-grant surface (0 occurrences of 'spawn' or 'frontmatter'); the round-7 review's 'validator printed ALL CHECKS PASSED' is therefore not a bypass of the validator, and 27-43's acceptance criterion for that half is unsatisfiable as written. Decide in 27-44/45 whether the validator should consult guard_wr05's verdict or whether the criterion is retired.
- OPEN LIVE BYPASS found by 27-47's own red team on the POST-FIX build: BLOCK_INDICATOR is applied at exactly one of the places YAML allows a block-scalar header, so a nested |/> scalar's literal content goes through stripComment and the item boundary — a leading # hides a token and a leading - invents a name. Families G and G2 print ALL CHECKS PASSED at exit 0 on a mirror of 6891699, planted on both distribution twins of the non-coordinator skill plan. PRE-EXISTING (byte-identical against 62b8b53). Full seven-row table, loader column, gate transcripts and the measured false-red cost (4 of 1149 tracked files) are in deferred-items.md.
- 27-49 red team: family G/G2 (nested block-scalar header) is STILL a live silent-no-grant on this build, and the new ledger-derived expressibility floor cannot cover it — the ledger records CLOSED failures only. Round 10 must close family G and add the axis member in the SAME plan.
- Phase 27: the nested-block-scalar family G/G2 is a LIVE silent-no-grant bypass, re-measured OPEN on the 27-50 build with its libyaml column and recorded in deferred-items.md. BLOCK_INDICATOR is applied at exactly one of the places YAML allows a block-scalar header. Round 10 owns it.
- Phase 27 REQUIREMENTS.md over-claims: KIT-03 and SPAWN-04 are marked [x]/Complete while 27-VERIFICATION.md records both FAILED and family G/G2 remains a live silent-no-grant bypass. SPAWN-02 is marked Gaps Found while the verification records it VERIFIED. Pre-existing; 27-50 deliberately did NOT run requirements.mark-complete. Correcting the rows is a verification-record decision.
- Family G/G2 (a block-scalar header at a NESTED position) remains a LIVE silent-no-grant bypass reaching check-foundation-guards at exit 0 — re-measured on the 27-51 build. Owned by 27-52.
- 27-59: three of round 11's six source edits (27-55, 27-57's 4th reference application point, 27-58's blank line) are NOT pinned by the shared D-52 corpus — each caught only by its own dedicated axis; recorded OPEN with named owners
- 28-08 blocking checkpoint: D-22 part 3 unsatisfied — two independent red teams against commit a290ee7 were not commissioned (no agent-spawning tool). Human must approve closure or defer to Phase 30.
- LANG-08 re-baseline half UNMET: byte ceilings still encode the 2026-06-10 baseline and describe a pre-rewrite kit (headroom 1,069 B larger than the rewrite earned). Ratchet-down values ready in docs/audit/29-ceiling-rebaseline.md.
- 29-25 must state an exemption for a heading RECOGNISER: the derived locator-site scan over check-imperative-lexicon.ts reports ONE member (HEADING_LINE), not the zero 29-24's acceptance criterion asserts.
- LANG-07 not fully closed: V-29-29-01 — generate-catalog.ts:87 and generate-role-adapters.ts:127 answer the section-extent question through a fence-blind new RegExp lookahead. Derived and pinned two-sided by check-foundation-guards.test.ts; remedy is code (rewire both onto the shared authority), not a constant.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260606-0my | Harden grugops role-switch protocol + auto-commit to working branch (DOG-02 dogfood fixes) | 2026-06-06 | 6a66994 | [260606-0my-harden-grugops-role-switch-protocol-auto](./quick/260606-0my-harden-grugops-role-switch-protocol-auto/) |
| 260616-faw | Feasibility plan — automate the activities in the remaining human UATs (analysis only; 3-tier verdict) | 2026-06-16 | 5dcc5ef | [260616-faw-automate-remaining-human-uats-feasibilit](./quick/260616-faw-automate-remaining-human-uats-feasibilit/) |
| 260721-hjm | Audit user-facing docs for freshness + concision (agent-factory/README.md brought to v2.0 reality) | 2026-07-21 | 56d46ed | [260721-hjm-go-over-user-facing-documentation-audit-](./quick/260721-hjm-go-over-user-facing-documentation-audit-/) |
| 260721-iyt | Add root CHANGELOG.md (Keep a Changelog 1.1.0, from real tags + milestone docs) and link it from README.md | 2026-07-21 | 1c30907 | [260721-iyt-add-missing-changelog-md-populated-from-](./quick/260721-iyt-add-missing-changelog-md-populated-from-/) |

## Deferred Items

### v1.2 milestone close (2026-06-16)

Items acknowledged and deferred at the **v1.2 milestone close on 2026-06-16** (13 open artifacts from the pre-close audit). All are known/ratified — none are discovered blockers. They fall into three buckets: the **A3/DOG-02 human waiver** (carried to the next decentralization milestone that removes handoffs, making the dual-path parity test moot — NOT scheduled for a fix), the **B1/B2 Tier-3 persona/prose sign-off** (human-only by design; Phase 19 explicitly scoped Tier 3 out of automation), and **routine carry-forward** (stale status strings whose underlying work shipped, plus two stale quick-task markers). See `milestones/v1.2-MILESTONE-AUDIT.md` for the full analysis.

| Category | Item | Status | Deferred At | Note |
|----------|------|--------|-------------|------|
| uat | Phase 06 — 06-HUMAN-UAT.md | partial (1 open) | 2026-06-16 | A3/DOG-02 live dual-path handoff-parity — **human-waived → next milestone** (handoffs removed there, test moot); both PR-path Tier-2 calls timed out without emitting frozen markers to `-p` stdout (test-design limit). Tier-1 structural oracle intact + passing. |
| uat | Phase 11 — 11-HUMAN-UAT.md | partial (2 open) | 2026-06-16 | B1/B2 senior-persona prose/judgment sign-off — human-only Tier 3, unscoreable by guard; out of automation scope by design |
| uat | Phase 06 — 06-UAT.md | partial (0 open) | 2026-06-16 | No open scenarios; status string only |
| uat | Phase 02 — 02-HUMAN-UAT.md | resolved (0 open) | 2026-06-16 | Already resolved; listed for completeness |
| uat | Phase 05 — 05-HUMAN-UAT.md | passed (0 open) | 2026-06-16 | A1/D-31 + A2/SAFE-02 resolved from real runs in Phase 19 (2/2 passed); status string only |
| uat | Phase 10 — 10-HUMAN-UAT.md | passed (0 open) | 2026-06-16 | Resolved; status string only |
| uat | Phase 17 — 17-HUMAN-UAT.md | resolved (0 open) | 2026-06-16 | Resolved; status string only |
| verification | Phase 19 — 19-VERIFICATION.md | human_needed (4/5 SC) | 2026-06-16 | SC4 partial — only A3 live parity unverified (waived above); SC1/2/3/5 passed |
| verification | Phase 11 — 11-VERIFICATION.md | human_needed (9/10) | 2026-06-16 | 10th item = B1/B2 persona prose judgment, unscoreable by any guard — human-only |
| verification | Phase 05 — 05-VERIFICATION.md | human_needed | 2026-06-16 | Stale frontmatter — A1/A2 were resolved in Phase 19 (19-03b real run); predates that run |
| verification | Phase 06 — 06-VERIFICATION.md | human_needed | 2026-06-16 | Stale frontmatter — A1/A2 resolved in Phase 19; A3 remains (waived above) |
| quick_task | 260606-0my-harden-grugops-role-switch-protocol-auto | missing marker | 2026-06-16 | Stale marker only — work shipped at commit 6a66994 (carried from v1.1 close) |
| quick_task | 260616-faw-automate-remaining-human-uats-feasibilit | missing marker | 2026-06-16 | Stale marker only — work shipped at commit 5dcc5ef (became Phase 19) |

### v2.0 milestone close (2026-07-28)

Items acknowledged and deferred at the **v2.0 milestone close on 2026-07-28** — 12 open artifacts surfaced by the pre-close audit, of which **1 was resolved during close** and 11 are carried. Closeout type: **`override_closeout`** (not all phases project as verified — see the two verification rows below).

Shape of the carry: **9 of 11 are pre-v2.0 carryover** from the v1.2 block above (Phases 05, 06, 10, 11, 19) — already acknowledged at the v1.2 close on 2026-06-16 and unchanged since; they are re-listed here only because the audit re-scans the whole tree, not because anything regressed. **2 are genuinely v2.0**, and they are the same single item viewed from two files: Phase 20's Windows CI proof. See `milestones/v2.0-MILESTONE-AUDIT.md` for the full analysis, including the line-by-line attribution of all 9 Windows failures.

| Category | Item | Status | Deferred At | Note |
|----------|------|--------|-------------|------|
| uat | Phase 20 — 20-HUMAN-UAT.md | partial (1 open) | 2026-07-28 | **v2.0 item.** Test 1 asks for a `windows-latest` job exiting 0. The leg has now run (29869231389, sha 4de61b0) and is **RED**: 9 failed / 785 passed. Audit attributed all 9 — 7 harness/fixture artifacts (path-separator assertions, a CRLF token, a symlink-privilege fixture, an unbuildable old-layout fixture cascading into 2 more), 2 a real Windows limitation of the ubuntu-scoped freshness mirror-rebuild. **Zero failures in the v2.0 substrate**: context-io, claim, compactor read-path, and every `guard_context_writes`/SCTX-05 planted-fire case passed on the real runner. Behavior is proven on Windows; the literal "exits 0" is not. Fix = a dedicated Windows-portability pass, then re-run and flip. |
| verification | Phase 20 — 20-VERIFICATION.md | human_needed (5/5 truths) | 2026-07-28 | **v2.0 item.** Same single open human item as the row above — all 5 must-have truths are VERIFIED; only the real-runner Windows observation is outstanding. Drives `override_closeout`. |
| verification | Phase 25 — 25-VERIFICATION.md | **parse artifact, not a gap** | 2026-07-28 | Not counted in the 11. The `init.manager` projection reports `unknown` because the frontmatter scan picks up a nested `status: partial` at line 88, inside the block the file itself marks `SUPERSEDED`. The authoritative top-level value at line 4 is `status: passed` (3/3, round-8 closure 2026-06-29), corroborated by the milestone audit and ROADMAP. Deliberately NOT edited — a verification record is not rewritten to satisfy a parser. |
| uat | Phase 06 — 06-HUMAN-UAT.md | partial (1 open) | 2026-06-16 → carried | Pre-v2.0. A3/DOG-02 live dual-path parity — see GAP-D1 standing deferral below. |
| uat | Phase 11 — 11-HUMAN-UAT.md | partial (2 open) | 2026-06-16 → carried | Pre-v2.0. B1/B2 senior-persona prose sign-off — human-only Tier 3, out of automation scope by design. |
| uat | Phase 06 — 06-UAT.md | partial (0 open) | 2026-06-16 → carried | Pre-v2.0. No open scenarios; status string only. |
| uat | Phase 05 — 05-HUMAN-UAT.md | passed (0 open) | 2026-06-16 → carried | Pre-v2.0. Resolved in Phase 19; status string only. |
| uat | Phase 10 — 10-HUMAN-UAT.md | passed (0 open) | 2026-06-16 → carried | Pre-v2.0. Resolved; status string only. |
| verification | Phase 19 — 19-VERIFICATION.md | human_needed (4/5 SC) | 2026-06-16 → carried | Pre-v2.0. SC4 partial — only A3 live parity unverified (GAP-D1). |
| verification | Phase 11 — 11-VERIFICATION.md | human_needed (9/10) | 2026-06-16 → carried | Pre-v2.0. 10th item = B1/B2 persona prose judgment, unscoreable by any guard. |
| verification | Phase 05 — 05-VERIFICATION.md | human_needed | 2026-06-16 → carried | Pre-v2.0. Stale frontmatter — A1/A2 resolved in Phase 19. |
| verification | Phase 06 — 06-VERIFICATION.md | human_needed | 2026-06-16 → carried | Pre-v2.0. Stale frontmatter — A1/A2 resolved in Phase 19; A3 remains (GAP-D1). |
| quick_task | 260606-0my-harden-grugops-role-switch-protocol-auto | **RESOLVED at close** | 2026-07-28 | Was a false positive. The work shipped 2026-06-06 (`Self-Check: PASSED`, commits 0e5be77 / 897e38f / 6a66994 all in git); only the `status:` frontmatter field was missing. Added `status: complete` — the item is now closed, not deferred. |

**GAP-D1 — standing deferral (human-accepted 2026-07-02, re-confirmed at 26-UAT Test 4 on 2026-07-24):** the A3/DOG-02 retirement flip and its coupled `examples/03-ticket-to-pr.md` cleanup wait on ONE captured live dual-path run on an authed box (an authed Tier-2 `npm run test:e2e` A3-live case, or a completed `docs/dogfood-human-runbook.md` run with date + verdict). A loud-skip is never a capture (D-01/D-02); cost never gates it (D-11). Non-blocking for milestone close — Phase 26 verified the gating *behavior* held correctly: nothing flipped without evidence.

**Other v2.0 tech debt** (from the audit, not open-artifact rows): `guard_role_size` WARN proximity on six roles (`orchestrator.md` at 7562B against a 7165B threshold, growing every phase); the Phase 22 WR-03 fail-safe usability false-positive and the `---\n--- \n…` byte-round-trip adjacency (both fail-closed, never silent-absorb); the Phase 25 `floor-invariance.test.ts` spawn-heavy timeout needing an explicit larger `testTimeout`; the documented irreducible same-uid/no-hook direct-FS forgery residual (backstopped by `autonomy=pr`); `agent-factory/handoffs/` surviving as an empty dir with a tracked `.gitkeep`.

## Session Continuity

Last session: 2026-08-16T10:45:13.196Z
Stopped at: Completed 29-34-PLAN.md
Resume file: None

## Operator Next Steps

- Review `.planning/ROADMAP.md` (phases 27–33) and `.planning/REQUIREMENTS.md` (traceability, 46/46)
- Plan the first phase with `/gsd-plan-phase 27 --research-phase`
- Phase 27 internal ordering is load-bearing: kit-set authority + RED referential-integrity oracle FIRST, then the `orchestrator.md` trim, and only then generate the 17 adapters
