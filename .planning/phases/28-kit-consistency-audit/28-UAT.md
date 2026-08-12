---
status: complete
phase: 28-kit-consistency-audit
source: 28-01-SUMMARY.md … 28-08-SUMMARY.md (all 8), plus 28-REVIEW.md / 28-REVIEW-FIX.md
started: 2026-08-12T19:05:01Z
updated: 2026-08-12T19:05:01Z
coverage_mode: "legacy — all 8 SUMMARYs classified `mode: legacy` by `uat classify-coverage` (no structured `coverage:` block, zero malformed). Checkpoints prose-extracted from `provides:` and the per-plan deliverables. Nothing auto-passed by coverage."
suite_ground_truth: "re-run at session start, HEAD dab108e, working tree clean but for ` M human-notes.txt` / `?? .gsd/`: `npx vitest run --exclude '**/scripts/e2e/**'` → 46 files, 1596 passed, 2 skipped, 0 failed, exit 0 (87.89s). `npm test` deliberately NOT run — it triggers the live claude-CLI e2e lane. The e2e lane is therefore UNKNOWN - verify for this phase, as 28-REVIEW-FIX also records."
gate_ground_truth: "8 gates + validator + freshness + typecheck all exit 0 at HEAD, each invoked directly with its exit code captured (not through a pipe). freshness: 43 committed .js match a fresh tsc rebuild. generate-safety-surface re-run left the tree unmodified."
execution_note: "ALL 19 checkpoints were EXECUTED BY THE ASSISTANT against the live tree at the user's explicit direction (`go ahead and run UAT yourself and report back with results`), following the precedent recorded in 27-UAT.md's own execution_note. Checkpoints 1-13 were run before that direction; 14-19 were the human-judgment set and were resolved BY MEASUREMENT rather than by opinion — each of the four 28-REVIEW-FIX confirmation items was reduced to an adversarial arm with a control and a revert, so what is recorded is a reproduction, not an endorsement. Every adversarial checkpoint recorded a CONTROL (exit 0 at HEAD) BEFORE the planted mutation and a REVERT (exit 0, `git status --porcelain` clean) after. The four items 28-REVIEW-FIX asked a human to confirm are checkpoints 14, 15, 16 and 17; all four reproduce as described and NONE required a policy judgement the tree could not settle. SEVEN of the assistant's own harness premises were false during this session and each was re-measured rather than reported — see `## Assistant harness premises that were false`, because this phase's own recorded pattern is that the harness lies more often than the artifact does. Two residual items remain outside any mechanism and are NOT claimed as verified: the e2e lane (`npm test`, deliberately not run) and the three ownerless findings, both recorded in checkpoint 19."
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: A fresh hermetic install of the kit at HEAD into a scratch git repo succeeds, the two directories this phase DELETED (`agent-factory/handoffs/`, `agent-factory/examples/`) are absent from the installed kit, the installed kit carries zero retired vocabulary, and uninstall leaves the shared kit intact.
result: pass
source: assistant-verified
evidence: |
  `GRUGOPS_HOME=<scratch>/home/.grugops node install/install.js --target <scratch>/target --yes` → exit 0.
  agent-factory/handoffs → ABSENT. agent-factory/examples → ABSENT.
  Installed kit: `agent-factory/handoffs/` path form 0 hits; `handoff packet` prose form 0 hits.
  Installed kit on disk: 18 role files (17 counted + the `_`-prefixed protocol file), 19 workflows.
  `node install/uninstall.js --target <scratch>/target` → exit 0, output states the shared kit at
  $GRUGOPS_HOME is never touched — matching 28-05's D-12 correction that the uninstaller is
  indifferent BY CONSTRUCTION rather than by derivation.
  Hermeticity asserted: `~/.grugops/agent-factory` mtime 09:26 predates this 22:01 run, so nothing
  outside the scratch tree was written. See `## Observations` for what that pre-existing tree is.

### 2. Every gate and the suite are green at HEAD, measured not inherited
expected: All Phase 28 gates, the pre-existing gates, the validator, freshness and typecheck exit 0 at HEAD, and the suite passes — each measured in this session rather than read from a SUMMARY.
result: pass
source: assistant-verified
evidence: |
  exit 0 each, invoked directly with `$?` captured: check-public-docs-vocabulary, check-audit-register,
  check-claim-anchors, check-nul-bytes, check-foundation-guards, check-kit-refs, check-uat-oracles,
  generate-safety-surface, validate-agent-factory (VALIDATE_KIT_ROOT=.), `npm run freshness`
  (43 committed .js fresh), `npm run typecheck`.
  Suite: 46 files, 1596 passed, 2 skipped, 0 failed. The 2 skips are the pre-existing ones.
  `generate-safety-surface` re-run left `git status --porcelain` unchanged — deterministic.

### 3. AUDIT-01 — both D-03 equalities hold, recomputed independently of the gate's own PASS line
expected: 17 roles + 19 workflows derived; 37 register rows of which 36 counted; counted set SET-EQUAL to the derived set in both directions; declared findings equal Table B rows in total and per file; zero blank observations; every `safety_surface` recorded; all category-6 findings deferred to 29.
result: pass
source: assistant-verified
evidence: |
  Computed in a separate `node -e` from `readRegister()` + `listRoles()`/`listWorkflows()`, NOT read
  from the PASS line (the line cannot vouch for itself):
    roles 17 (ROLE_COUNT 17) · workflows 19 (WORKFLOW_COUNT 19)
    rows 37 · counted 36 · uncounted 1 (agent-factory/roles/_role-switch-protocol.md)
    EQUALITY ONE  set-equal both directions: true
    EQUALITY TWO  declared 32 === Table B 32; per-file mismatches: 0
    blank observations: 0 · safety_surface distribution: {"yes":37} · unfilled: 0
    dispositions: {"deferred":28,"fixed":4} · category-6: 6, all deferred→29: true

### 4. AUDIT-01 — the register gate refuses a blanked observation
expected: Blanking one row's observation on the real tree makes `check-audit-register` exit 1 and name the row; reverting restores exit 0.
result: pass
source: assistant-verified
evidence: |
  control (HEAD) exit 0 → observation blanked exit 1:
    "FAIL  1 row(s) carry a BLANK observation — agent-factory/roles/architect-design.md (line 332)."
  reverted → exit 0, `git status --porcelain docs/` empty.

### 5. AUDIT-01 — WR-12's new arms bite (existence check + uncounted-set equality)
expected: A row naming a file that is not on disk reds; a second uncounted row reds against the pinned `[PROTOCOL_FILE]` set. Both are the gate-policy change 28-REVIEW-FIX flagged.
result: pass
source: assistant-verified
evidence: |
  Row renamed to `11-retro-GONE.md` → exit 1:
    "FAIL  1 register row(s) name a file that is not on disk — agent-factory/workflows/11-retro-GONE.md
     (line 359). A row about a file that does not exist records a read that could not have happened"
  A second uncounted row → exit 1: "the register's uncounted rows are [_role-switch-protocol.md,
  11-retro.md], expected exactly [_role-switch-protocol.md]" — reported INDEPENDENTLY of equality one,
  so both failures stay distinguishable in one run, as the fix report claims.
  reverted → exit 0, tree clean.

### 6. AUDIT-02 — CLAUDE.md describes the v2.0 architecture, and the drift guard bites
expected: `CLAUDE.md` states decompose-and-enqueue with the shared verified context as the memory, carries zero guard-held retired vocabulary, and reintroducing retired vocabulary into a public document makes the guard exit 1.
result: pass
source: assistant-verified
evidence: |
  CLAUDE.md:6 reads "…a shared verified context, checklists…" and describes the Orchestrator as
  decomposing into subtasks and enqueuing them on a shared queue. CLAUDE.md:10 reads
  "…a shared verified context that nothing enters unverified…" and "The shared verified context is
  the memory." Guard-held forms: `handoff packet` 0, `agent-factory/handoffs/` 0.
  Adversarial: appended "The handoff packet is the memory." to README.md → exit 1,
  "FAIL retired prose form "handoff packet" survives in a public document — README.md:68".
  reverted → exit 0, tree clean.
  NOTE the one surviving bare word is CLAUDE.md:33's stack table ("roles, workflows, handoffs,
  checklists"), which 28-05 recorded-not-fixed by decision — see checkpoint 19.

### 7. AUDIT-03 — the claim registry is complete and every safety floor is mapped
expected: 38 claims with contiguous ids across the three public documents plus the manifest; 6 `kind: safety` rows each carrying a `depends_on`; all 4 `SAFETY_FLOORS` mapped; every non-true claim carrying a disposition and a finding id.
result: pass
source: assistant-verified
evidence: |
  Recomputed from `readRegistry()`:
    claims 38 · ids contiguous C-28-001..C-28-038: true
    by file: README.md 9, AGENTS.md 11, agent-factory/README.md 17, .claude-plugin/plugin.json 1
    kinds {safety:6, architecture:24, install:8} · statuses {true:29, overstated:9} — ZERO `false`
    safety rows 6, every one carries dependsOn: true
    every SAFETY_FLOORS id mapped by ≥1 claim: true · no claim names a non-floor: true
    non-true claims all carry disposition AND findingId: true

### 8. AUDIT-03 — the anchor gate catches the 28-05 miss it was built for
expected: Changing an anchored sentence without updating its registry row makes `check-claim-anchors` exit 1 and name the claim id and line; reverting restores exit 0.
result: pass
source: assistant-verified
evidence: |
  control (HEAD) exit 0 → AGENTS.md C-28-018's anchored line mutated → exit 1:
    "FAIL  AGENTS.md: the text at C-28-018's anchor (line 100) is not byte-identical to the
     registry's verbatim block."
  reverted → exit 0, tree clean.

### 9. AUDIT-03 — WR-08 closes the unanchorable-row hole 28-04 left named
expected: The `.claude-plugin/plugin.json` row cannot be position-checked, but its verbatim text is now PRESENCE-checked, so mutating the manifest description without its row reds. 28-04 explicitly recorded that nothing would go red here.
result: pass
source: assistant-verified
evidence: |
  Mutated the manifest description ("a file-based agent factory" → "a MUTATED agent factory"),
  premise asserted (replacement landed) → exit 1:
    "FAIL  .claude-plugin/plugin.json: C-28-038's verbatim text is not present in the file. An
     unanchorable row cannot be POSITION-checked, but it CAN be PRESENCE-checked"
  reverted → exit 0, tree clean. The PASS line now reads 38 verbatim comparisons, not 37.
  A first attempt used a replacement string absent from the file and was a no-op reporting exit 0 —
  caught by asserting the mutation landed. See `## Assistant harness premises that were false`.

### 10. D-18 — the derived exclusion list is freshness-gated and reds on a flag move
expected: Flipping one row's `safety_surface` from `yes` to `no` while leaving the generated list untouched makes `check-audit-register` exit 1 naming the STALE list; reverting restores exit 0.
result: pass
source: assistant-verified
evidence: |
  Premise asserted first (`counted` cell untouched, `safety_surface` cell flipped) because a first
  attempt flipped the `counted` column by accident and fired a DIFFERENT arm:
    "FAIL  docs/audit/28-safety-surface-exclusions.md is STALE — the committed list differs from a
     fresh regeneration, so a `safety_surface` flag or a `kind: safety` claim moved without the
     derived list being rebuilt"
  reverted → exit 0, tree clean.

### 11. The NUL gate refuses a NUL byte in a tracked source
expected: A NUL planted in a tracked `.ts` file makes `check-nul-bytes` exit 1 with the file, byte offset, line and column; reverting restores exit 0. The scanned set carries no exemption list.
result: pass
source: assistant-verified
evidence: |
  control (HEAD) exit 0 → NUL appended to scripts/dead-vocabulary.ts → exit 1:
    "FAIL  scripts/dead-vocabulary.ts carries 1 NUL byte(s) (0x00). First at byte offset 5221,
     line 78, column 4."
  reverted → exit 0, tree clean.
  Live PASS line: 1456 tracked files scanned as raw bytes, zero NULs, no exemption list, git's own
  `--eol` classifier independently agreeing at 0 `-text` files across 1456 parsed rows, 0 unparsed.

### 12. AUDIT-04 — the shipped pins carry measured versions and their verification date
expected: `@playwright/test` and `@axe-core/playwright` pins in the gate templates read the versions measured at time of change, with the verification date recorded at each site so a reader can judge the pin's age.
result: pass
source: assistant-verified
evidence: |
  Three literals across exactly two files, matching 28-02's claim:
    agent-factory/checklists/playwright-visual-regression-recipe.md:17  1.62.1
    agent-factory/checklists/playwright-visual-regression-recipe.md:19  4.12.1
    agent-factory/checklists/accessibility-checklist.md:20              4.12.1
  Each carries "(version verified against the npm registry 2026-08-11; check for a newer one before
  you pin)". Note the ROADMAP pre-named 1.62.0; the measurement won at 1.62.1 per D-23 (F-28-A).

### 13. The two hygiene directories are gone and the installer is indifferent
expected: `agent-factory/handoffs/` and `agent-factory/examples/` no longer exist in the repo or in an installed kit, and their removal changed no installer or uninstaller output.
result: pass
source: assistant-verified
evidence: |
  `test ! -d agent-factory/handoffs && test ! -d agent-factory/examples` → both gone in the repo.
  Both absent from the freshly installed kit (checkpoint 1). Install exit 0, uninstall exit 0.
  28-05's own measurement recorded installer OUTPUT byte-identical before vs after, with the only
  difference the four expected kit-listing lines.

### 14. CR-04 — the two policy set widenings
expected: `BLANK_MARKERS` gained the en dash `–` (which also tightens `readRegister`'s `deferred`/`accepted` obligations), and `BARE_OBSERVATIONS` gained `?` / `tbd` / `todo`. The fixer flagged both as judgement calls needing human confirmation.
result: pass
source: assistant-verified
evidence: |
  `BLANK_MARKERS = ["", "—", "–", "-"]`, `BLANK_MARKER_COUNT = 4` pinned two-sided and asserted in
  `audit-model.test.ts:278`. All four adversarial arms measured on the real tree, each reverted clean:
    observation = bare en dash        -> exit 1, "carry a BLANK observation"
    observation = bare `tbd`          -> exit 1, "carry a BARE observation standing in for a substantive one"
    `deferred` finding, target = en dash -> exit 1, parse refusal "is `deferred` with no `target_phase`"
                                          — the tightening the fixer flagged is REAL and fires by name
  The "measured safe on the live artifacts" claim reproduces EXACTLY: the committed register carries
  one en dash, at line 336, INSIDE prose; whole-cell occurrences: 0.
  ONE THING WORTH KNOWING, MEASURED AND NOT A HOLE: `check-audit-register.ts:314` still tests
  `r.safetySurface === "—"` with a hardcoded em dash rather than consuming `isBlank` — the very shape
  CR-04 was about. It is NOT reachable as a bypass: the parser constrains `safety_surface` to the
  closed set `["yes","no","—"]` first, so an en dash there is a parse refusal (measured: exit 1,
  "carries `safety_surface` value "–", which is outside the legal set"). Fail-closed, but it is a
  second spelling of the unfilled marker living outside the authority.

### 15. WR-04 — option (b), and the drift left recorded rather than gated
expected: The pre-pass evidence artifact keeps its date line and is NOT freshness-gated; the fixer declined option (a) because gating it would red on every unrelated Phase 29 prose edit and the only way to clear it would be regenerating rows nobody adjudicated. The artifact is ALREADY drifted against the live tree, and that is recorded rather than fixed.
result: pass
source: assistant-verified
evidence: |
  NOT GATED: grep across `scripts/*.ts`, `ci.yml` and `package.json` finds no freshness consumer of
  `28-prepass-evidence.md` (contrast `28-safety-surface-exclusions.md`, whose freshness IS folded
  into check-audit-register and which checkpoint 10 proved reds).
  DRIFT MEASURED: regenerated and diffed against the committed artifact — exactly TWO changed lines:
    `- **Generated:** 2026-08-11` -> `2026-08-12`   (the non-deterministic date)
    `brownfield-mapper.md:35 … the Phase-4 brownfield bootstrap workflow` -> `… the brownfield
     bootstrap workflow`          (one row quoting prose 28-06's F-28-016 fix rewrote)
  Exactly the single-row drift the fix report names. Regeneration REVERTED; tree clean.
  THE DETERMINISTIC HALF HOLDS: `runPrepass()` returns 123 rows twice, byte-identical — so the
  module's split claim (rows deterministic, rendering not) is true rather than asserted.
  The module states all three facts in its own header: not deterministic, not freshness-gated
  deliberately, and already drifted with the reason.

### 16. WR-07 — the `line` VALUE assertion declined
expected: The registry's `line:` field is now format-validated (`N` or `N-M`) but its VALUE is deliberately NOT compared against the anchor's real index, on the grounds that the registry documents the opposite decision with a stated reason.
result: pass
source: assistant-verified
evidence: |
  BOTH ARMS MEASURED on the real tree, each reverted clean:
    `line: banana` (malformed FORM)          -> exit 1, "carries `line` "banana", which…" — the
                                                applied half bites, and it refuses at the PARSE
                                                authority so no consumer sees the bad value
    `line: 9999`   (valid FORM, false VALUE) -> exit 0 — the declined half, behaving as decided
  The decision it declined to overturn is documented in the artifact itself, `28-claim-registry.md`
  § *Why `line` is recorded and not checked*, with the reason stated: Phase 29 rewrites prose for a
  living and an assertive line number would red on every unrelated edit above a claim.
  Both live shapes still parse: 19 single values + 19 ranges = 38, fully accounted.

### 17. WR-08 — a committed audit artifact's prose was edited
expected: `docs/audit/28-claim-registry.md`'s prose was corrected in the same commit as the WR-08 fix, because the fix made a committed sentence false ("A future rewrite of README.md:4 that forgets the manifest will still pass every gate in this repository green").
result: pass
source: assistant-verified
evidence: |
  ONE COMMIT, `d1fbb8e`, carries the gate, its test, the compiled `.js` AND the registry prose —
  4 files, 171 insertions, 12 deletions.
  The removed sentence WAS made false by the fix, and checkpoint 9 independently proved that:
  mutating the manifest description now exits 1 where 28-04 recorded it would stay green.
  The correction does not silently rewrite history — it QUOTES the old sentence, states plainly
  "That sentence is no longer true, and it is corrected here rather than left standing", explains
  that the JSON-cannot-carry-a-comment reason justified dropping the ANCHOR requirement and never
  the VERBATIM one, then names the residual that REMAINS: presence is not position and not
  uniqueness, with an explicit `UNKNOWN - verify` on whether a JSON path expression is worth having.
  No "what this does not prove" statement was softened; the edit is additive.

### 18. The five examples read as re-narration, and the two real captures were not falsified
expected: `examples/01`…`05` describe the shared-verified-context flow as continuous narrative rather than path-swapped text, and the two files marked "Real run — captured 2026-06-03" keep every verdict, command, exit code, diffstat and count unchanged.
result: pass
source: assistant-verified
evidence: |
  All five carry zero `agent-factory/handoffs/` and zero `handoff packet`.
  THE CAPTURES WERE NOT FALSIFIED — checked by reading the diff, not by trusting the summary. The one
  removed line in `examples/03` that carried a verdict (`qe-handoff.md (QE/E2E) — Result: PASS`) has
  its verdict PRESERVED in the replacement prose at line 97: "**QE/E2E** publishes `Result: PASS`;
  e2e not triggered (`e2e_when: ui-or-critical-path`, …)" — the filename went, the result stayed.
  `examples/01` lines 57-58 still read `## Expected handoffs` / `product-handoff.md; …` — and that
  is CORRECT: they sit INSIDE a fenced capture block (fence opens line 41, closes line 63) holding
  the Orchestrator Decision document as actually produced on 2026-06-03. The LIVE section above it
  was renamed to `## Expected files and published notes (real, produced on the sample)` at line 77,
  with the clear-voice vintage paragraph at 92-98 and three `decision`-note bullets from line 100.
  This is the "a capture is a historical record: restate its vocabulary, never rewrite its verdicts"
  rule applied correctly rather than a missed rewrite.
  THE GAP-D1 OVERLAP WAS HONOURED: `git diff 97ef52f..HEAD -- examples/` changed ZERO `pending human`
  lines. The two overlapping lines (`03:179` "same handoff filenames", `03:190`'s parity row) are
  deliberately untouched and owned by Phase 33 / CAP-01.

### 19. The carried-forward open items are accepted as Phase 28's honest residue
expected: Phase 28 closes with a named set of things it did NOT fix — 28 findings deferred to Phase 29, three ownerless findings, a stale-by-decision evidence artifact, an unverified e2e lane, and a PROJECT.md regeneration risk that fails loudly rather than silently.
result: pass
source: assistant-verified
evidence: |
  (a) 28 findings deferred, every one targeting Phase 29, spread across all six categories
      {cat1:3, cat2:7, cat3:4, cat4:6, cat5:2, cat6:6}. Plus 4 `fixed`. Total 32 = Table B.
  (b) The D-18 exclusion list is 41 entries, recomputed independently of the generated file:
      37 register rows (`safety_surface: yes`) + 4 registry files, sources disjoint. Header says 41.
  (c) THE THREE OWNERLESS FINDINGS ARE ALL REAL, each reproduced:
      1. `CLAUDE.md:39` names a root `VERSION` file — `test -f VERSION` -> ABSENT.
      2. `CLAUDE.md` says `/grug` 11 times; the kit ships `grugops`, `grugops-gate`, `grugops-map`,
         `grugops-plan`, `grugops-release`, `grugops-ticket`, `grugops-uat`. No `/grug` skill exists.
      3. `AGENTS.md:34` declares the kit-write rule "a resolution and safety rule", yet no
         `SAFETY_FLOORS` member holds it (ids: autonomy, test_integrity,
         production_requires_human_confirmation, protected_branch_merge; none mentions kit writes).
         So Phase 30's claim-dropping will not reach it. `CLAUDE.md` has no Table A row, so no
         Phase 28 mechanism could have claimed these.
  (d) The e2e lane is genuinely unverified: `"test": "vitest run"` carries NO exclude, so
      `scripts/e2e/uat-live.test.ts` is in scope and `npm test` spends live CLI tokens. Not run.
  (e) The `PROJECT.md` regeneration risk FAILS LOUDLY as 28-05 argued: `.planning/PROJECT.md` still
      carries 10 `handoff packet` occurrences, and `check-public-docs-vocabulary.js` scans
      `CLAUDE.md` — confirmed this session — so a GSD docs regeneration would go RED, not silent.

## Summary

total: 19
passed: 19
issues: 0
pending: 0
skipped: 0
blocked: 0

## Assistant harness premises that were false

This phase's own recorded pattern is that the verification harness is wrong more often than the
artifact is — 28-02 hit it twice in one plan, 28-07 four times, 28-08 eight times. Five of this
session's own probes were false and each was re-measured rather than reported. Recorded because a
UAT that hides its own corrections is asserting the same unearned confidence the phase exists to
refuse.

| # | False premise | How it was caught | Corrected measurement |
|---|---|---|---|
| 1 | `node scripts/X.js \| tail -4; echo $?` reports the GATE's exit code | It reported exit 0 beside output reading `1 ERROR(S)` | `tail` owns the exit status in a pipe. Every exit code in this file is captured with `out=$(cmd); rc=$?` instead |
| 2 | `VALIDATE_KIT_ROOT` accepts the installed kit home | It reported `missing required file: AGENTS.md` | The shared install is a TWO-root layout: the kit lands at `$GRUGOPS_HOME`, `AGENTS.md`/`plans/`/`memory-bank/` land in the target. The validator's sanctioned invocation is against the source repo (`VALIDATE_KIT_ROOT=.`), which is how 28-05 and 28-07 ran it. Recorded in `## Observations`, NOT scored as a defect |
| 3 | Flipping "the first cell reading `yes`" flips `safety_surface` | The failure named the uncounted-row set, not a stale list | `counted` also reads `yes` and comes first. Re-run against cell index 4 with both cells asserted before the edit |
| 4 | `'grugops is'` occurs in `.claude-plugin/plugin.json` | The gate exited 0 on a mutation that should have red | The manifest reads `"grugops — a file-based…"`. The replacement was a silent no-op; re-run with the replacement asserted to have landed |
| 5 | `readRegister()` rows expose `safety_surface` / `dependsOn` as `depends_on` | The probe reported `yes=0 no=0 unfilled=0`, contradicting the gate | Real field names are `safetySurface` and `dependsOn`. Every AUDIT-01/03 number in this file is from the corrected probe |
| 6 | `ls -d .claude/skills/*/ \| xargs -n1 basename` lists the shipped skills | It printed seven empty strings | `ls` emitted ANSI colour codes into the pipe. Re-run with `find -type d -exec basename` — the kit ships `grugops` + six `grugops-<op>` skills, which is what makes the `/grug` finding real |
| 7 | The D-18 exclusion list's entries are `- ` bullets | `grep -c '^- '` returned **2** against a header claiming 41 | The entries are a markdown TABLE. Recomputed from `safetySurfaceUnion()` instead of counting lines: **41**, splitting 37 register rows + 4 registry files |

Premises 3, 4, 5 and 7 are the consequential ones: uncorrected, the third would have credited the
D-18 freshness guard with a reproduction it never performed, the fourth would have reported WR-08's
new arm as inert when it bites, the fifth would have reported a register with no recorded safety
flags at all, and the seventh would have reported the exclusion list as 2 entries against its own
header's 41 — a false red on a generated artifact that is in fact correct.

**Seven false premises across one UAT session, against zero defects found in the artifacts.** That
ratio is itself the phase's headline result restated from the outside: every plan in Phase 28
recorded the same class, and a verification pass that did not hit it would be the one worth
distrusting.

## Observations

Recorded because they were measured this session, not because they are Phase 28 defects.

1. **`~/.grugops/agent-factory` exists on this machine**, mtime 2026-08-12 09:26 — created by an
   earlier Phase 28 measurement run, not by this session (which redirected `GRUGOPS_HOME` to a
   scratch path and ran at 22:01). It carries a POST-deletion kit: neither `handoffs/` nor
   `examples/` is present. 28-05's Deviation 4 states the tree it created was removed by hand; a
   later run re-created it. `uninstall.ts` never removes it by design, so it will persist until
   removed manually.
2. **The validator has no sanctioned invocation against an installed shared-layout tree.** Running
   `VALIDATE_KIT_ROOT=<kit home>` reports a missing `AGENTS.md`; running it against the target repo
   reports 19 errors because the kit lives elsewhere. Both are consequences of the two-root layout,
   not of this phase. `UNKNOWN - verify` whether a `VALIDATE_KIT_ROOT=<home> VALIDATE_ROOT=<target>`
   pairing is intended to work; nothing in Phase 28 claims it does.
3. **`.planning/PROJECT.md` still carries 10 occurrences of `handoff packet`.** 28-05 recorded this
   as finding #3 and argued it fails LOUDLY: the two CLAUDE.md lines it fixed sit inside a
   GSD-generated block sourced from `PROJECT.md`, so a docs regeneration would reintroduce the
   drift — and `check-public-docs-vocabulary.js` scans `CLAUDE.md`, so the gate would go red.
   Confirmed this session: the gate does scan `CLAUDE.md`, so the loud-failure claim holds.

## Gaps

[none yet]
