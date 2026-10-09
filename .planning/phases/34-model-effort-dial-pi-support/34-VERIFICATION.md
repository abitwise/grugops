---
phase: 34-model-effort-dial-pi-support
verified: 2026-10-09T16:10:00Z
status: human_needed
score: 13/16 must-haves verified
covered_files:
  - .planning/phases/34-model-effort-dial-pi-support/34-01-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-01-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-02-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-02-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-03-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-03-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-04-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-04-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-05-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-05-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-06-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-06-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-07-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-07-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-08-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-08-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-09-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-09-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-10-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-10-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-11-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-11-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-12-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-12-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-13-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-13-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-14-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-14-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-15-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-15-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-16-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-16-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-17-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-17-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-18-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-18-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-19-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-19-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-20-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-20-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-21-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-21-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-22-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-22-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-23-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-23-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-24-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-24-SUMMARY.md
  - agent-factory/config/factory.config.md
  - agent-factory/packaging/adapters.md
  - agent-factory/packaging/subagent.frontmatter.md
  - install/README.md
  - install/canonical-path.test.ts
  - install/host-tools.ts
  - install/install-marker.ts
  - install/install.test.ts
  - install/install.ts
  - install/ledger.test.ts
  - install/mode-census.test.ts
  - install/path-spelling-census.test.ts
  - install/record-truth.test.ts
  - install/uninstall.ts
  - install/user-file.ts
  - scripts/adapters-freshness.test.ts
  - scripts/adapters-freshness.ts
  - scripts/canonical-frontmatter.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-platform-shapes.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/generate-role-adapters.ts
  - scripts/model-tiers.test.ts
  - scripts/model-tiers.ts
covered_digest: "v3:sha256:2dece3ed6ad49dcf74194ee021dac771ec4108730914c6caf13b21deb810becd"
behavior_unverified: 2
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 8/12
  gaps_closed:
    - "Gap 2 (34-15 truth): the installer now compares each adapter's rendered and about-to-be-written model and effort with the per-adapter map the generator announces, member by member. The verifier's own round-1 evasion shape (tiered effort plus one role at inherit, one adapter's effort line dropped) is refused at exit 3 with 0 adapters installed. Reproduced end to end by me."
    - "Gap 1 code half: the two install/ledger.test.ts link-record fixtures (the cause of the two phase-changed windows-latest reds in run 37733716975) now link to a host-built absolute target under the test's scratch directory, and a derived census rule (t6) refuses a rooted drive-less literal link target."
    - "Round-1 riders WR-09 (one absoluteness rule, census derived and covering isOwnLink) and WR-10 (writable chmod-only pointer-file rows) closed; the seven SATISFIED requirement boxes ticked."
  gaps_remaining:
    - "HOST-02 is not closed and cannot be from this machine: no windows-latest run measured the round-2 tree (D-21, human deferral). It is carried as an UNCERTAIN truth below, not as a pass."
  regressions:
    - "WR-11 (reproduced by me): the posix half of the WR-09 fix makes a Windows-written install marker on a POSIX checkout unusable. Base 620e419d exited 0 and replaced it; HEAD exits 3, leaves it, writes no ask rules. See Human Verification 3."
behavior_unverified_items:
  - truth: "A real Pi CLI lists and expands `/grugops` from `.pi/prompts/grugops.md` and finds the Orchestrator after a scripted install"
    test: "Install grugops into a scratch repository with the scripted installer, start Pi from the repository root, grant project trust, type `/grugops hello`."
    expected: "Pi lists `/grugops`, expands the template with `Request: hello`, and the agent reads AGENTS.md and reaches the Orchestrator role text."
    why_human: "No Pi CLI was run in this phase. After a scripted install no in-repo `agent-factory/` exists, and whether the template's pointer resolves to ~/.grugops/agent-factory is `UNKNOWN - verify` (backlog 999.4). Presence and wiring checks cannot see Pi's loader."
  - truth: "A real Claude Code session applies the emitted `effort:` line of a standalone `.claude/agents/grugops-*.md` adapter to that sub-agent"
    test: "Configure `models.effort.preset: tiered`, install, run `/grugops` on Claude Code at or above 2.1.267, and observe a spawned role agent's effort level."
    expected: "The orchestrator agent runs at `high`, an execution role at `medium`, and a role with no line inherits the session level."
    why_human: "The premise is cited from code.claude.com docs in 34-RESEARCH.md; no live Claude Code session ran, and the docs record the standalone-agent minimum version as `UNKNOWN - verify`. I did not re-fetch the cited pages."
human_verification:
  - test: "HOST-02: push the HEAD of this phase and read the windows-latest job"
    expected: "No test added or changed by Phase 34 is red on `test (windows-latest)`. 34-VALIDATION.md 'Gap round 2 (D-21): prediction for the deferred run' predicts the two ledger.test.ts link-record tests turn green and the five carried reds (WINDOWS.md rows 316/317) stay red; record the run id, head sha and the verbatim `Tests` line."
    why_human: "The human deferred the measurement (D-21). No macOS or Linux result is evidence for a Windows row (WIN-3). HOST-02 stays unchecked in REQUIREMENTS.md and the phase must not be reported as having met it."
  - test: "Run `/grugops <request>` on a real Pi after a scripted install"
    expected: "Command listed and expanded; Orchestrator reached"
    why_human: "No Pi CLI available; kit discovery after a scripted install is UNKNOWN - verify (backlog 999.4)"
  - test: "Observe a real Claude Code sub-agent run with a configured `effort:` line"
    expected: "Configured level applied; inherit leaves the session level"
    why_human: "Live platform behavior; docs citation only"
  - test: "Decide WR-11 and WR-12: fix in a round 3, or accept and record"
    expected: "Either (a) a Windows-written marker on a POSIX checkout is read as 'written for another directory' and replaced, as at base 620e419d, with the banner line conditioned on what writeAskRules did, or (b) a recorded decision that the stricter refusal stands, with the refusal text saying 'another platform's path spelling' and giving the remedy."
    why_human: "A judgment call on a regression in installer behavior outside the phase's stated requirements. I did not classify it as a blocker (see Weighing WR-11), but it is a fail-closed change that leaves the merge/deploy speed bump unwritten in a realistic cross-host case and prints a false banner sentence. The reviewer's fix is small (separate the shape check from the binding)."
  - test: "Windows product link ownership: install with --symlink on windows-latest, then uninstall"
    expected: "`isOwnLink` (now through `sameRecordedPath`) answers true for the recorded source and the link is removed"
    why_human: "WINDOWS.md row 319 product reach is UNKNOWN - verify. The link-ownership describe blocks are skipped on win32; no run has read a product link back on Windows. A mismatch fails closed (the link is left), it never deletes."
---

# Phase 34: Model Effort Dial and Pi Support Verification Report (re-verification, gap round 2)

**Phase Goal:** Users can set reasoning effort per role through the same `models` dial that already sets the model, and Pi (pi.dev) joins the five supported host coding-agent CLIs through the existing thin-pointer, single-source adapter pattern, with the same idempotent, dry-run, reversible install contract.
**Verified:** 2026-10-09T16:10:00Z
**Status:** human_needed
**Re-verification:** Yes, after gap round 2 (plans 34-19..34-24). Previous: gaps_found 8/12.

## Verdict in one paragraph

The product goal holds and both round-1 gaps are closed on the evidence I produced myself. The installer-side effort gap (round-1 Gap 2) is closed for real: I rebuilt the verifier's reproduction against a scratch copy of the HEAD kit (generator patched to drop `effort:` from `grugops-architect-design`, config `tiered` plus `software-engineer: inherit`) and the install now exits 3 naming the adapter, the text and both levels, with 0 adapters written; the unpatched twin installs 17 adapters at exit 0. The same holds for a swapped `model:` line. Round-1 Gap 1 (HOST-02) is a code-side fix with no measurement: the two ledger fixtures are fixed and a derived census guards the class, but nobody has run windows-latest on the new tree, so I carry HOST-02 as UNCERTAIN and not as passed. The human deferred that measurement (D-21); REQUIREMENTS.md correctly leaves the box unchecked and no file claims it met. One regression the round introduced, WR-11, is real (I reproduced it against the base installer) but breaks no stated requirement, so it is a human decision, not a gap. Status is `human_needed`: a Windows measurement, two live-platform checks and the WR-11 call. Nothing in the code evidence is failed.

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | SC1 / EFFORT-01: premise cited; fallback, 2.1.267 floor and `UNKNOWN - verify` residuals shipped in the dial docs | VERIFIED | `agent-factory/config/factory.config.md:161-170` carries the citations, `CLAUDE_CODE_EFFORT_LEVEL` and `maxEffortLevel` text (164) and the 2.1.267 floor (165); 4 `UNKNOWN - verify` markers. Unchanged since round 1 (`git diff` of that file shows no round-2 hunk). Upstream accuracy not re-fetched. |
| 2  | SC2 / EFFORT-02, 03, 05: closed `models.effort` key set, vocabularies, precedence, one resolver, single-authority docs | VERIFIED | `scripts/model-tiers.test.ts`, `generate-role-adapters.test.ts`, `adapters-freshness.test.ts` pass (10 files, 601 passed, 1 skipped). Round-1's end-to-end refusal of `MAX` and acceptance of `max` not re-run; the round-2 grammar change was exercised by every install below. |
| 3  | SC3 / EFFORT-04 zero-config half: absent effort resolves to `inherit`, no line, committed adapters unchanged | VERIFIED (with note) | `npm run freshness:adapters`: 17 compared, 0 byte differences, both mirrored presets `none`. A real zero-config install: 0 of 17 adapters carry `effort:`. The announcement LINES changed (they carry `byAdapter`), the adapter bytes did not. The D-14 coordinator carve-out note from round 1 still stands (ROADMAP SC3 wording unamended). |
| 4  | EFFORT-04 configured half: configured effort emitted; guard proves emitted == resolved; generator announces; freshness gate asserts | VERIFIED | `node scripts/check-foundation-guards.js` ALL CHECKS PASSED. Generator builds `modelByAdapter`/`effortByAdapter` from the `adapters` list (`generate-role-adapters.ts:587-588`), the values its render consumes, and emits both through `resolvedAssignmentLine`/`resolvedEffortAssignmentLine` (658, 660). Evasion-free install with tiered plus `software-engineer: inherit`: `architect-design` 1 `effort:` line, `software-engineer` 0, 17 adapters, exit 0. |
| 5  | HOST-01: one registry owns the host set with an asserted count; derived oracles and prose scans | VERIFIED | `install/host-tools.ts:140` `HOST_TOOL_COUNT = 6`; `host-tools.test.ts` green in the targeted run; structure validator ALL CHECKS PASSED. Round-1 mutation probes not re-run. |
| 6  | HOST-02: no test added or changed by this phase is red on windows-latest, measured on a human-pushed CI run | UNCERTAIN (WARNING, human decision requested) | Not measured on the round-2 tree, by the human's decision D-21. Last measured run 37733716975 (head 9de784e8): `Tests 7 failed`, 2 of them phase-changed (`install/ledger.test.ts` link records, `D:\some\where`). Round 2 changed those fixtures (below, truth 15) and recorded a prediction (34-VALIDATION.md), but a prediction is not a measurement and no macOS run counts (WIN-3). REQUIREMENTS.md:157 `[ ]`, traceability row 257 "Pending: Windows measurement deferred by the human (D-21)". I found no file that says it is met. Not counted in the score. |
| 7  | SC4 / PI-01, PI-02: Pi conventions recorded; registry entry, detection, per-host rows, docs, validator coverage, one pointer-only template | VERIFIED | Scripted install into a scratch repo (own `GRUGOPS_HOME`): DRY_RUN printed `would-add .pi/prompts/grugops.md (Pi prompt template)` and wrote nothing (0 files); install `created` it; bytes are the description, `argument-hint`, the one pointer sentence and `Request: $ARGUMENTS`. No role text copied. |
| 8  | SC5 / PI-03: Pi path idempotent, additive, dry-run-capable, reversible, ledgered, owns(path)-gated | VERIFIED (POSIX, my probes) | Same scratch repo: re-install exit 0 with an identical tree digest (`f2c64352453a` both runs); uninstall exit 0 and `.pi` gone (both created dirs removed), user-state dirs left. Windows result is `UNKNOWN - verify` (truth 6). |
| 9  | PI-04: non-reach of the dials on Pi stated as a property of what the kit emits, with the cited vendor clause; Pi safety tier documented | VERIFIED | `subagent.frontmatter.md:266` and 273 (the README line 19 and `pi.dev` quotes); no round-2 hunk in these files. |
| 10 | A real Pi CLI lists and expands `/grugops` and reaches the Orchestrator after a scripted install | PRESENT_BEHAVIOR_UNVERIFIED | Template present and byte-exact; no Pi was run; kit discovery after a scripted install `UNKNOWN - verify` (backlog 999.4). Not counted. |
| 11 | A real Claude Code sub-agent run applies the emitted `effort:` level | PRESENT_BEHAVIOR_UNVERIFIED | Docs citation only; no live session. Not counted. |
| 12 | 34-15/34-20 (D-22, D-24): the installer compares each adapter's rendered and written model AND effort with the generator's per-adapter map, member by member; a drop, duplicate or swap is refused | VERIFIED (reproduced) | See Reproductions R1 to R3. Round-1 Gap 2 evasion shape: exit 3, 0 adapters, both texts named. Model swap (`architect-design` rendered `sonnet` against announced `opus`): exit 3, 0 adapters. Positive control (unpatched kit, same config): exit 0, 17 adapters. `install.test.ts` (420 passed, 1 skipped) carries row (f) and the per-member rows. |
| 13 | 34-21 (D-23, WR-09): one absoluteness rule for recorded paths; `isOwnLink` through `sameRecordedPath`; census derived and counted | VERIFIED, with a side effect | `canonical-path.test.ts`, `path-spelling-census.test.ts` green. Side effect: WR-11 (Reproduction R4). The plan's own truth ("under the posix flavor a marker spelled `C:/x` is refused as not absolute") is met as written. |
| 14 | 34-22 (D-23, WR-10): a writable chmod-only pointer-file row reaches uninstall's recorded-mode comparison | VERIFIED (reproduced) | Reproduction R5: a mutation that makes uninstall ignore the recorded mode turns exactly the two new rows red (CLAUDE.md and `.github/copilot-instructions.md` "was removed although the user changed its mode"). Unmutated, `record-truth.test.ts` 75 passed. |
| 15 | 34-23 (D-21): ledger link fixtures host-built; census (t6) bars rooted drive-less literal link targets; prediction recorded as a prediction | VERIFIED (code half) | `ledger.test.ts` link fixtures now `symlinkSync(join(root, "nowhere", "target"), ...)` (433, 453); no `/some/where` remains; `(t6)` at `path-spelling-census.test.ts:678`; 34-VALIDATION.md "Gap round 2 (D-21): prediction for the deferred run" present and worded as a prediction. Windows result: `UNKNOWN - verify`. |
| 16 | 34-24: seven boxes ticked with evidence cells; HOST-02 unchecked with the D-21 reason; no file claims HOST-02 met | VERIFIED | REQUIREMENTS.md: EFFORT-01..05, HOST-01, PI-01..04 `[x]`; HOST-02 `[ ]` (157); traceability row 257 states the deferral and the last measured run. `grep` for HOST-02 with "met/complete" finds only the unchecked lines and the PI-03 "Complete on POSIX" cell. |

**Score:** 13/16 truths verified (1 uncertain, 2 present but behavior-unverified).

### Reproductions (all on scratch copies of HEAD; `GRUGOPS_HOME` and `--target` set to scratch dirs; `~/.grugops` untouched; the repository tree was not modified)

| # | What | Command shape | Result |
|---|------|---------------|--------|
| R1 | Round-1 Gap 2 evasion: generator twin omits `effort:` for `grugops-architect-design`; config `tiered` plus `roles: {software-engineer: inherit}` | `node kit/install/install.js --target tgt` | exit 3; two `verify` lines name the adapter, "the rendered text carries effort \"inherit\", while the generator announced effort \"high\"" and the same for "the text about to be written"; `install INCOMPLETE`; `.claude/agents` empty. Control `tiered` alone: same refusal. |
| R2 | Positive control: unpatched twin, same config | same | exit 0; 17 adapters; `architect-design` 1 `effort:` line, `software-engineer` 0 |
| R3 | Model swap: twin emits `model: sonnet` for `architect-design` under `models.preset: tiered` | same | exit 3; "rendered text carries model \"sonnet\", while the generator announced model \"opus\""; 0 adapters |
| R4 | WR-11: marker `{"grugopsHome":"C:/Users/dev/.grugops","kitRoot":"C:/Users/dev/.grugops/agent-factory","installMode":"copy","target":"C:/Users/dev/repo"}` on a POSIX target | base `620e419d` against HEAD | base: exit 0, "written for another directory ... replaced", `.claude/settings.json` written. HEAD: exit 3, marker left unchanged ("not an absolute path" for all three fields), no `.claude/settings.json`. Matches the review. |
| R5 | 34-22 closure: in a scratch copy, `recordMatches(own.entry.content.split(";mode=")[0], result.before, result.beforeMode)` in `uninstall.ts` and `.js` | `npx vitest run install/record-truth.test.ts` | 2 failed, 73 passed: the two new writable chmod-only rows ("was removed although the user changed its mode"). A second mutation (drop the mode argument) turned those two rows plus the REMOVABLE untouched row red. |

### Weighing WR-11 (the caller asked)

It does not break a must-have, and I did not mark it a blocker, for these reasons: (1) the plan's own truth (34-21) states the refusal as the intended outcome; (2) no ticked requirement text, roadmap success criterion or Phase 34 goal clause covers a marker carried from another host; (3) it fails closed and loses nothing: nothing is overwritten or deleted, the refusal is named on a `verify` line, exit 3 says INCOMPLETE; (4) the Pi path, the effort dial and the idempotent/dry-run/reversible contract I exercised all hold. Against that: it is a behavioral regression from base 620e419d on a realistic path (a committed `.grugops/` carried between a Windows and a POSIX machine), the only remedy is a hand edit, the merge/deploy ask rules are not written in that state, and the printed reason ("not an absolute path") is false on the host that wrote it. WR-12 (a closing banner that claims ask rules were written when none were) is a pre-existing line that this case makes reachable, and it conflicts with the "No fabrication" constraint. I put both to the human as a decision (fix in a round 3, or record acceptance) rather than closing them myself.

### Deferred Items

None. The roadmap ends at Phase 34; backlog 999.2 to 999.4 are disclosed residuals the phase never claimed to close. Review items IN-06 and IN-08 (deferred) and IN-09 to IN-13 (open, info) have no later owning phase and none falsifies a must-have.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/model-tiers.ts` | one payload grammar and validator for both dials with `byAdapter` | VERIFIED | `byAdapter` at 570-711; tests green |
| `scripts/generate-role-adapters.ts` | both announcements from the resolved adapter list | VERIFIED | lines 587-591, 658, 660 |
| `scripts/adapters-freshness.ts` | one reader; key set equals compared adapters | VERIFIED | freshness gate prints 17 compared, 0 differences. The per-adapter zero-config value check at :603-609 is unreachable (IN-09, info) |
| `install/install.ts` | per-member comparison of both texts against the announced map | VERIFIED | `dialDisagreements` over `announced.byAdapter` and `announced.effort.byAdapter` (3463-3464); reproduced R1, R3 |
| `install/user-file.ts`, `install-marker.ts` | `isRecordedAbsolute`, `sameRecordedPath` in `isOwnLink` | VERIFIED, with WR-11 | tests green; R4 |
| `install/record-truth.test.ts`, `mode-census.test.ts` | writable chmod-only pointer rows, capability-gated | VERIFIED | R5 |
| `install/ledger.test.ts`, `path-spelling-census.test.ts` | host-built link targets; (t6) | VERIFIED | green on macOS only |
| `.planning/REQUIREMENTS.md`, `34-REVIEW-DISPOSITION.md`, `deferred-items.md`, `34-VALIDATION.md` | bookkeeping per D-21, D-23 | VERIFIED | disposition frontmatter records WR-08, WR-09, WR-10, IN-07 fixed; 7 new round-2 review items open (WR-11, WR-12, IN-09..13) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| generator adapter list | announcement `byAdapter` | `modelByAdapter` / `effortByAdapter` from `adapters` | WIRED | built from resolved values, not rendered bytes |
| announcement | freshness gate | one reader (`resolvedAssignmentsIn`, `resolvedEffortAssignmentsIn`) | WIRED | gate green |
| announcement | installer | probe parse, one shape check, `dialDisagreements` | WIRED | R1, R3 |
| `installMarkerProblems` | `isRecordedAbsolute` | import | WIRED | and the source of WR-11 |
| `isOwnLink` | `sameRecordedPath` | readlink compared through the one spelling | WIRED | Windows reach `UNKNOWN - verify` |
| pointer-file rows | `removeOwnedEmptyFile` mode comparison | end-to-end uninstall | WIRED | R5 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| installed `.claude/agents/*.md` effort lines | resolved effort map | target `.grugops/factory.config.json` through the install-time render | Yes (R2) | FLOWING |
| per-adapter model/effort lines vs announcement | per-member value in each text | transformed text against `byAdapter` | Yes; a disagreement is refused (R1, R3) | FLOWING (round-1 DISCONNECTED arm closed) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Typecheck | `npx tsc --noEmit` | exit 0 | PASS |
| Build parity | `npm run check:build-parity` | ALL CHECKS PASSED | PASS |
| Adapters fresh | `npm run freshness:adapters` | 17 compared, 0 differences | PASS |
| Foundation guards | `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED | PASS |
| Structure validator | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | ALL CHECKS PASSED | PASS |
| Round-2 test files | 10 files (model-tiers, generate-role-adapters, adapters-freshness, check-platform-shapes, canonical-path, path-spelling-census, mode-census, record-truth, ledger, host-tools) | 601 passed, 1 skipped | PASS (macOS only) |
| Installer suite | `npx vitest run install/install.test.ts` | 420 passed, 1 skipped | PASS (macOS only) |
| Full regression (caller's run) | `npx vitest run --exclude '**/scripts/e2e/**'` at ed08edd3 | 7535 passed, 1 failed, 2 skipped; the failure is `install/installer-fs-census.test.ts` | accepted from caller, not reproduced in full |

**The fs-census failure.** I ran `install/installer-fs-census.test.ts` on this machine: on Node v26.11.0 it fails with "UNCLASSIFIED node:fs export openAsBlobSync" (1 failed, 23 passed); on Node v24.12.0 (`/usr/local/bin/node`) it passes (24 of 24). `git diff 620e419d..HEAD` shows no change to that file in round 2, and nothing in Phase 34's round-2 diff adds an `fs` export use. It is a Phase 33.1 census that enumerates the live `node:fs` export list and fails on any export it has not classified; Node 26 added one. It does not bear on the phase goal. It is a real, small follow-up (classify `openAsBlobSync`) the project owns, since the stack constraint is "Node 22+" and a newer runtime breaks a green lane. I did not run it on Node 22; CI pins 22.

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes are declared by this phase. Step 7c: SKIPPED (no declared probes).

### Requirements Coverage

All 11 IDs appear in at least one PLAN's `requirements:` field (34-01..34-24) and in REQUIREMENTS.md's Phase 34 traceability. No orphaned requirement.

| Requirement | Source Plan(s) | REQUIREMENTS.md | My status | Evidence |
|-------------|----------------|-----------------|-----------|----------|
| EFFORT-01 | 34-07 | `[x]` | SATISFIED | Truth 1 |
| EFFORT-02 | 34-01 | `[x]` | SATISFIED | Truth 2 |
| EFFORT-03 | 34-01, 34-03 | `[x]` | SATISFIED | Truth 2 |
| EFFORT-04 | 34-01..34-20 | `[x]` | SATISFIED | Truths 3, 4, 12 (the round-1 installer companion is now closed) |
| EFFORT-05 | 34-07 | `[x]` | SATISFIED | Truths 1, 2 |
| HOST-01 | 34-02, 06, 09 | `[x]` | SATISFIED | Truth 5 |
| HOST-02 | 34-10..34-18, 34-21, 34-22, 34-23 | `[ ]` Pending | **NOT MET / UNMEASURED** | Truth 6. Correctly unchecked. The requirement is open until a human-pushed windows-latest run records a passing result. |
| PI-01 | 34-06 | `[x]` | SATISFIED | Truth 7 |
| PI-02 | 34-02, 04, 06, 08, 16 | `[x]` | SATISFIED | Truth 7 |
| PI-03 | 34-04, 10..13, 17, 18, 22 | `[x]` "Complete on POSIX" | SATISFIED on POSIX | Truths 8, 14. Windows leg is under HOST-02. |
| PI-04 | 34-07, 34-08 | `[x]` | SATISFIED | Truth 9 |

### Code review (34-REVIEW.md gap round 2: 0 critical / 2 warning / 5 info; disposition: 7 open)

| Finding | Reproduced / checked | Bearing on a must-have |
|---------|----------------------|------------------------|
| WR-11 Windows-written marker on POSIX no longer replaced | Yes, R4 | No must-have falsified; human decision (see Weighing WR-11) |
| WR-12 banner says ask rules were written when none were | Yes, in the R4 output (banner at the end next to "no ask rule was added") | No must-have; DOC-1 / no-fabrication warning |
| IN-09 unreachable per-adapter zero-config check | By source | None |
| IN-10 unused announced fields | By source | None |
| IN-11 two ~717-character relay lines per install | Seen in install output | None |
| IN-12 `p === TARGET` denylist by convention only | By source | None |
| IN-13 docstring and table omit the win32 rooted drive-less spelling | By source | None; fails closed |
| Round-1 WR-08, WR-09, WR-10, IN-07 | WR-08 reproduced closed (R1); WR-10 reproduced closed (R5); WR-09 closed with the WR-11 side effect; IN-07 covered by the shared shape check | Closed |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `install/install.ts` | 5744-5747 (pre-existing line) | closing banner states ask rules were written regardless of `writeAskRules()` outcome | Warning (WR-12) | printed claim no code backs, reachable in R4 |
| `install/install-marker.ts` | 1165-1178 | shape check uses the host flavor's absoluteness | Warning (WR-11) | cross-host marker stuck |
| `scripts/adapters-freshness.ts` | 603-609 | unreachable defence-in-depth branch | Info (IN-09) | none |
| debt markers | n/a | `TBD`/`FIXME`/`XXX` in added lines of the 23 non-planning files changed since 620e419d | none found | scan of `+` lines returned nothing |

### Human Verification Required

1. **HOST-02 measurement.** Push the phase HEAD; read `test (windows-latest)`; record the run id, head sha and the verbatim `Tests` line. Prediction to compare: the two `install/ledger.test.ts` link-record tests turn green; the five carried reds stay red (34-VALIDATION.md round-2 section). This is the only way HOST-02 closes, and the phase must not be reported as having met it until then.
2. **Pi and Claude Code live checks** (behavior_unverified_items above).
3. **WR-11 / WR-12 decision.** Fix in a round 3 or accept and record. The reviewer's fix: `isRecordedPathShape` (absolute under either flavor) for the marker shape check, keep the host-flavor rule for `absoluteSpelling`, add a canonical-path row and an install.test.ts row for a Windows-spelled marker on POSIX, and condition the banner on what `writeAskRules()` did.
4. **Windows product link ownership** (WINDOWS.md row 319 product reach).
5. **Minor, no decision needed:** classify `openAsBlobSync` in the fs census so the Node 26 lane is green.

### Gaps Summary

No failed truth and no blocker. The two round-1 gaps are closed as far as macOS evidence can close them: Gap 2 fully (reproduced), Gap 1 on the code side only. The remaining distance to "phase complete" is a human act (the windows-latest measurement behind HOST-02), two live-platform observations, and a decision on one fail-closed regression (WR-11/WR-12). Round 2 of 4 used; if the human elects to fix WR-11/WR-12, that is round 3 and is a small change.

---

_Verified: 2026-10-09T16:10:00Z_
_Verifier: Claude (gsd-verifier)_
