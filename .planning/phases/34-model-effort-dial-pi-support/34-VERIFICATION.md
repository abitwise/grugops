---
phase: 34-model-effort-dial-pi-support
verified: 2026-10-09T00:55:00Z
status: gaps_found
score: 8/12 must-haves verified
covered_files:
  - .claude/agents/grugops-orchestrator.md
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
  - agent-factory/config/factory.config.md
  - agent-factory/packaging/adapters.md
  - agent-factory/packaging/subagent.frontmatter.md
  - hooks/hook-entry.ts
  - install/README.md
  - install/canonical-path.test.ts
  - install/host-tools.ts
  - install/install-marker.ts
  - install/install.test.ts
  - install/install.ts
  - install/ledger.test.ts
  - install/mode-census.test.ts
  - install/path-spelling-census.test.ts
  - install/uninstall.ts
  - install/user-file.ts
  - scripts/adapters-freshness.ts
  - scripts/canonical-frontmatter.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-platform-shapes.ts
  - scripts/check-uat-oracles.ts
  - scripts/context-io.ts
  - scripts/generate-role-adapters.ts
  - scripts/model-tiers.ts
  - scripts/validate-agent-factory.ts
covered_digest: "v3:sha256:96e827d4b1a81335dff2a4fe9a676e1348bffb535f2140173254e1f41a789e33"
behavior_unverified: 2
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 8/11
  gaps_closed:
    - "Round-0 WR-03/WR-06/WR-07 cheap additions: installer effort arm added (partly, see gap 2), Pi kit-discovery caveat added, GRUGOPS_PROJECT_DIR claim corrected"
    - "Round-0 HOST-02 sub-gap: the 5 phase-added or phase-changed tests red on run 37521787426 (uninstall-removal x2, installer-user-edit Pi row, record-truth Pi row, installer-dry-run flow-10 subset) are green on run 37733716975"
  gaps_remaining:
    - "HOST-02 (now 2 different tests, the ledger.test.ts link-record pair)"
  regressions:
    - "None in product behavior. Two tests changed by plan 34-13 went from red-on-an-earlier-assertion to red-on-a-masked-later-assertion"
gaps:
  - truth: "HOST-02: no test added or changed by Phase 34 is red on windows-latest, measured on a human-pushed CI run (the D-09 condition under which the phase proceeds despite the unmet Windows dependency)"
    status: failed
    reason: "CI run 37733716975 (head 9de784e8, windows-latest job 113168427323) printed `Tests 7 failed | 7402 passed | 28 skipped (7437)`. I re-extracted the 7 FAIL lines from the job log myself. 5 are the carried other-family tests whose bodies have no hunk in `git diff 45766c2d..HEAD` (install.test.ts readUserFile ENOTDIR at 7290 and W1 at 10077, installer-write-set.test.ts ENOTDIR at 653, kit-plan-limits.test.ts PATH_MAX and NAME_MAX). 2 are install/ledger.test.ts 'treeRecord gives a file its file record, a link its link record, ...' and 'backupContentRecord: a file's bytes and mode, a tree, a link; ...', whose bodies plan 34-13 changed (hunks at 452 and 630 in HEAD numbering); both print `expected 'link:D:\\some\\where' to be 'link:/some/where'`. So 2 phase-changed tests are red. Product source is unchanged since the measured head (`git diff 9de784e8..HEAD` outside .planning is empty), so the run still describes HEAD. REQUIREMENTS.md leaves HOST-02 unchecked and records the miss. No later ROADMAP phase exists (backlog 999.x only), so the item cannot be deferred."
    artifacts:
      - path: "install/ledger.test.ts"
        issue: "Lines 453-454 and 637-638: `symlinkSync('/some/where', ...)` then `expect(treeRecordOf(...)).toBe(linkRecord('/some/where'))`. On Windows Node qualifies a rooted target with the current drive, readlink returns `D:\\some\\where`. A fixture defect (a drive-less rooted target is not a Windows path), not a product defect on the evidence in hand. WINDOWS.md row 319."
    missing:
      - "Change the two fixtures to a target every platform returns byte for byte (for example an absolute path built from the test's own scratch root through the product's `realTargetPath`), with no platform conditional (carried D-14/D-16 rule). Audit the other earlier WIN-2 reds for assertions that were masked behind their first failure (34-18-SUMMARY gap round 2 input)."
      - "A human pushes a new run; record its id, head sha and the verbatim `Tests` line. HOST-02 closes only on that measurement, not on a macOS run."
      - "Or the human records an explicit override of D-09's condition (HOST-02 then stays unchecked and says why)."
  - truth: "34-15 must-have: the installer reads the `effort:` lines of every adapter it is about to write and a transform that drops or duplicates either line is refused (WR-03 / WR-08)"
    status: partial
    reason: "Duplicates are refused (count above one). A DROPPED `effort:` line is refused only when it moves the set of distinct levels, because zero lines is read as `inherit` and the check is set equality against the announced level set (install/install.ts:5052-5068). Reproduced end to end against a scratch copy of the kit with a patched generator that drops `effort:` from `grugops-architect-design`: config `models.effort.preset: tiered` alone is refused (exit 3, 'the effort levels read out of the rendered adapters are [high, inherit, medium], while the render announced [high, medium]', 0 adapters installed); config `tiered` plus `roles: {software-engineer: inherit}` installs all 17 adapters at exit 0 and `grugops-architect-design.md` carries 0 `effort:` lines although the configuration resolves it to `high`. The docstring (install.ts:3325-3330) and the call-site comments say such a drop is refused. EFFORT-04's own wording names the generator announcement and the freshness gate, not the installer, so the requirement is not broken; the plan's own truth is."
    artifacts:
      - path: "install/install.ts"
        issue: "Effort arm has the model arm's set check but not its per-member exactly-one floor (34-REVIEW.md WR-08). `effortOf` is read per member and then used only as a set."
    missing:
      - "Check per member: refuse any adapter whose `effort:` read from the transformed text differs from the one in its render (or announce the per-role map instead of the distinct set), with an effortRefusalRows case for the evasion shape above."
      - "Or rewrite the three comments to say a drop is caught only when it moves the set."
behavior_unverified_items:
  - truth: "A real Pi CLI lists and expands `/grugops` from `.pi/prompts/grugops.md` and finds the Orchestrator after a scripted install"
    test: "Install grugops into a scratch repository with the scripted installer, start Pi from the repository root, grant project trust, type `/grugops hello`."
    expected: "Pi lists `/grugops`, expands the template with `Request: hello`, and the agent reads AGENTS.md and reaches the Orchestrator role text."
    why_human: "No Pi CLI was run in this phase. After a scripted install no in-repo `agent-factory/` exists, and whether the template's pointer resolves to ~/.grugops/agent-factory is `UNKNOWN - verify` (backlog 999.4; install/README.md:333 now says so). Presence and wiring checks cannot see Pi's loader."
  - truth: "A real Claude Code session applies the emitted `effort:` line of a standalone `.claude/agents/grugops-*.md` adapter to that sub-agent"
    test: "Configure `models.effort.preset: tiered`, install, run `/grugops` on Claude Code at or above 2.1.267, and observe a spawned role agent's effort level."
    expected: "The orchestrator agent runs at `high`, an execution role at `medium`, and a role with no line inherits the session level."
    why_human: "The premise is cited from code.claude.com docs in 34-RESEARCH.md; no live Claude Code session ran, and the docs record the standalone-agent minimum version as `UNKNOWN - verify`. I did not re-fetch the cited pages."
human_verification:
  - test: "Run `/grugops <request>` on a real Pi after a scripted install (see behavior_unverified_items)"
    expected: "Command listed and expanded; Orchestrator reached"
    why_human: "No Pi CLI available; kit discovery after scripted install is UNKNOWN - verify (backlog 999.4)"
  - test: "Observe a real Claude Code sub-agent run with a configured `effort:` line (see behavior_unverified_items)"
    expected: "Configured level applied; inherit leaves the session level"
    why_human: "Live platform behavior; docs citation only"
  - test: "Windows product link ownership: install with --symlink on windows-latest, then uninstall"
    expected: "`isOwnLink` (readlinkSync(dest) === src) answers true for the recorded source and the link is removed"
    why_human: "WINDOWS.md row 319 product reach is UNKNOWN - verify. The link-ownership describe blocks are skipped on win32 (canSymlink is false there), so no run has read a product link back on Windows. If readlink returns a different spelling, uninstall fails closed (leaves the link), it does not delete anything."
---

# Phase 34: Model Effort Dial and Pi Support Verification Report (re-verification, gap round 1)

**Phase Goal:** Users can set reasoning effort per role through the same `models` dial that already sets the model, and Pi (pi.dev) joins the five supported host coding-agent CLIs through the existing thin-pointer, single-source adapter pattern, with the same idempotent, dry-run, reversible install contract.
**Verified:** 2026-10-09T00:55:00Z
**Status:** gaps_found
**Re-verification:** Yes, after gap round 1 (plans 34-11..34-18)

## Verdict in one paragraph

The product work holds, and gap round 1 did what it was aimed at on the round-0 gap: the five phase-added or phase-changed tests that were red on windows-latest in run 37521787426 are green in run 37733716975 (files `installer-user-edit` 99/99, `record-truth` 72/72, `installer-dry-run` 16/16, `uninstall-removal` 28 with the 13 pre-existing win32 skips, plus the three new census/spelling files). But HOST-02 is still FAILED, on two different tests: plan 34-13 rewrote two `install/ledger.test.ts` bodies, they now get past their old first assertion and trip on a masked later one (`link:D:\some\where` against `link:/some/where`). The windows leg went from 144 red to 7 red; HOST-02's condition is "none of this phase's tests", and 2 of the 7 are. I also found one defect in the gap round's own work: the installer's new effort cross-check does not refuse a dropped `effort:` line unless the distinct level set moves, contrary to its docstring and to plan 34-15's third truth; I reproduced it. HOST-02 cannot be closed from a Mac and I have not marked it so.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1 / EFFORT-01: the `effort` premise is cited before design, with the cited fallback, the 2.1.267 floor and two `UNKNOWN - verify` residuals shipped in the dial docs | VERIFIED | `agent-factory/config/factory.config.md:161-170` still carries the citations, `CLAUDE_CODE_EFFORT_LEVEL` and `maxEffortLevel` text (lines 164-165), the 2.1.267 floor and both `UNKNOWN - verify` residuals. Upstream accuracy of the citations: not re-fetched (no web tool), `UNKNOWN - verify`. |
| 2 | SC2 / EFFORT-02, 03, 05: `models.effort` closed key set `{preset, roles}`, closed level and preset vocabularies, refused by name, same two-location precedence, resolved in `scripts/model-tiers.ts`, emitted by the generator, documented once in each authority | VERIFIED | Round-0's 15-shape refusal matrix was not re-run in full; regression evidence this round: `scripts/model-tiers.test.ts`, `generate-role-adapters.test.ts`, `canonical-frontmatter.test.ts` pass (16 files, 1001 tests, 1 skipped, in one targeted run). Real install against a scratch repo with `{"preset":"tiered","roles":{"software-engineer":"MAX"}}` exits 3 with `ERROR model-tiers: ... assigns role "software-engineer" the effort level "MAX", which is not a legal effort level. The legal set is exactly: "inherit", "low", "medium", "high", "xhigh", "max"`, and 0 adapters are written. With the legal `max`: exit 0, 4 `effort: high`, 1 `effort: max`, 12 `effort: medium`, announcement `{"roles":17,"overrides":1,"levels":["high","max","medium"]}` echoed. |
| 3 | SC3 / EFFORT-04 (zero-config half): an absent effort setting resolves every role to `inherit`, emits no line, committed adapters byte-identical to baseline apart from the declared divergence | VERIFIED (with note) | `npm run freshness:adapters`: 17 compared, 0 byte differences, `Mirrored generator resolved effort preset: none`. Round-0's finding stands: one declared divergence (coordinator Degraded-tier host count, D-14). ROADMAP SC3 still reads "byte-identical to today" without the D-14 carve-out; a human may want that wording amended. |
| 4 | EFFORT-04 (configured half): a configured effort is emitted; a guard through the canonical frontmatter reader proves emitted == resolved over the derived role set; the generator announces and the freshness gate asserts it | VERIFIED | `guard_effort_assignment` exists (`scripts/check-foundation-guards.ts:2341`, wired at 2401); `node scripts/check-foundation-guards.js` prints ALL CHECKS PASSED; the targeted run includes `check-foundation-guards`, `adapters-freshness`, `canonical-frontmatter` tests, all green. Round-0's six mutation proofs were not re-derived. The REQUIREMENTS.md tick on EFFORT-04 is supported by this and by truth 3. The installer-side companion is gap 2. |
| 5 | HOST-01: one registry owns the host set with an asserted count; detection, validator, dispatch oracle and per-host tables derive from it; a derived prose scan fails on count words and on a host list missing exactly one host | VERIFIED | `install/host-tools.ts`: `HOST_TOOL_COUNT = 6` (line 140). `host-tools.test.ts`, `host-tools-prose.test.ts`, `check-uat-oracles` and the structure validator (`ALL CHECKS PASSED`) are green this round. Mutation proofs: round-0's scratch-copy probes (delete Pi row, add `Zed` row) not re-run. |
| 6 | HOST-02: no test added or changed by this phase is red on windows-latest, measured on a human-pushed run | FAILED | See Gap 1. Run 37733716975, head `9de784e863280e9510a50e122bf0d8ff12f5a833`: `gh run view` confirms `test (ubuntu-latest)` success and `test (windows-latest)` failure at "Vitest (e2e lane excluded)"; the log prints `Test Files 4 failed \| 99 passed (103)` and `Tests 7 failed \| 7402 passed \| 28 skipped (7437)`. The prediction in 34-VALIDATION.md was 5 failed. |
| 7 | SC4 / PI-01, PI-02: Pi conventions recorded from primary sources; Pi ships as registry entry, detection, per-host rows, README and guide sections, validator coverage, and one pointer-only template at `.pi/prompts/grugops.md` | VERIFIED | Real install into a scratch repo (GRUGOPS_HOME set to a scratch dir): `would-add .pi/prompts/grugops.md` on DRY_RUN with the tree unchanged; install `created` it; its bytes are a description, an `argument-hint`, the sentence ``grugops: read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.`` and `Request: $ARGUMENTS`. Only `.pi` and `.pi/prompts` and the one file were created under `.pi`. No role text copied. The REQUIREMENTS.md tick on PI-02 is supported. Pi source facts are cited from 34-RESEARCH.md and `adapters.md`, not re-fetched. |
| 8 | SC5 / PI-03: the Pi install path is idempotent, additive, dry-run-capable, reversible, ledgered, never overwrites a user file, owns(path)-gated uninstall | VERIFIED (POSIX by my probes; Windows rows green in run 37733716975) | Ledger holds `.pi` dir, `.pi/prompts` dir and the file entry `sha256:...;mode=0644`, `kit:false`. Re-install: `skipped ... a file is already there`, tree sha-identical. Appended line then uninstall: `left ... edited or replaced since`, file kept, ledger kept. Restored then uninstall: `removed`, then `rmdir` of both created dirs. The Pi rows on windows-latest are green in the printed log (`installer-user-edit`, `record-truth`, `installer-dry-run`, `uninstall-removal` all file-level green), which the round-0 run was not. Symlink, hard link, FIFO and `.pi/prompts`-symlink probes from round 0 were not re-run. |
| 9 | PI-04: the dials' non-reach of Pi is stated as a property of what the kit emits, with the cited vendor clause; Pi's safety tier is documented | VERIFIED | Unchanged since round 0 (`subagent.frontmatter.md:260-270`, `install/README.md` section 5); the gap round touched neither file's Pi-reach text. Not re-read in full this round. |
| 10 | A real Pi CLI lists and expands `/grugops` and reaches the Orchestrator after a scripted install | PRESENT_BEHAVIOR_UNVERIFIED | Template present and byte-exact. No Pi was run. Kit discovery after a scripted install is `UNKNOWN - verify`, and `install/README.md:333` now says exactly that (WR-06 fixed by plan 34-16), as does `adapters.md:140`. Routed to Human Verification; not counted in the score. |
| 11 | A real Claude Code sub-agent run applies the emitted `effort:` level | PRESENT_BEHAVIOR_UNVERIFIED | Unchanged from round 0: docs citation only; no live session. Not counted in the score. |
| 12 | 34-15 must-have: the installer refuses an adapter set in which an `effort:` line was dropped or duplicated between the generator and the write | FAILED (partial) | See Gap 2. Duplicate refused (`effortRefusalRows` (e) passes). Drop refused only when it moves the level set. Reproduced: control (tiered only) refused, evasion (tiered plus one role `inherit`) installs with exit 0 and an adapter missing its `effort: high` line. |

**Score:** 8/12 truths verified (2 failed, 2 present but behavior-unverified).

### Deferred Items

None. The roadmap ends at Phase 34. Backlog 999.2, 999.3 and 999.4 are disclosed residuals the phase never claimed to close. The Windows leg's other reds (WINDOWS.md rows 316, 317, 319) have no later owning phase either.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/model-tiers.ts` | effort vocabularies, reader, `resolveEfforts`, announcement grammars | VERIFIED | Tests green; real install refuses `MAX` by name. |
| `scripts/generate-role-adapters.ts` | emits `effort:` only when not `inherit`; two announcement lines | VERIFIED | Output seen in install `render` lines. |
| `scripts/adapters-freshness.ts` | asserts effort announcements | VERIFIED | 0 differences, effort preset line printed. |
| `scripts/check-foundation-guards.ts` | `guard_effort_assignment` | VERIFIED | Present, ALL CHECKS PASSED. |
| `install/host-tools.ts` | registry, count, `PI_PROMPT_REL` | VERIFIED | `HOST_TOOL_COUNT = 6`. |
| `install/install.ts` | detection from registry, Pi writer, effort cross-check | PARTIAL | Pi writer verified; effort cross-check is set-only (Gap 2). Detection still reads the installer's own `.pi` write (WR-01, deferred). |
| `install/user-file.ts`, `install-marker.ts`, `uninstall.ts` | one path spelling and one mode renderer (WIN-1, WIN-2) | VERIFIED for the five round-0 reds | The five round-0 phase-owned reds are green on Windows. Two comparison sites remain outside the one spelling: `isAbsoluteMarkerPath` (WR-09) and `isOwnLink` (byte equality, `user-file.ts:536`). |
| `install/canonical-path.test.ts`, `path-spelling-census.test.ts`, `mode-census.test.ts` | new census files | VERIFIED | Green locally (targeted run) and on windows-latest (63, 13, 15 tests). |
| `install/ledger.test.ts` | WIN-2 stored-mode fixtures | STUB-LIKE FIXTURE DEFECT | Two tests pass their rewritten first assertion and fail on a masked second (Gap 1). |
| `agent-factory/config/factory.config.md`, `subagent.frontmatter.md`, `adapters.md`, `install/README.md` | single-authority docs | VERIFIED | WR-06 caveat present (`install/README.md:333`, `adapters.md:140`). |
| ROADMAP "Depends on" line | states D-09 honestly | VERIFIED | `ROADMAP.md:1663`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `readModelsBlock` | `readEffortBlock` | independent of `models.roles` | WIRED | Effort-only config consumed in the real install above. |
| generator | `resolveEfforts` | before build loop | WIRED | Refusal installs 0 adapters. |
| installer render | effort announcement | level-set and role-count cross-check | PARTIAL | Wired, but set-only (Gap 2). |
| `writePiPromptTemplate()` | ledger | gate then record | WIRED | Ledger entries read back above. |
| uninstall | `owns(path)` | generic reversal | WIRED | Edited file left; clean file removed. |
| `isOwnLink` | recorded link source | `readlinkSync(dest) === src` | UNKNOWN - verify on Windows | Byte equality, no canonical spelling; link describes are skipped on win32. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| Installed `.claude/agents/*.md` effort lines | resolved effort map | target `.grugops/factory.config.json` through the install-time render | Yes: tiered plus `software-engineer: max` gave 4 `high`, 1 `max`, 12 `medium` | FLOWING |
| Same, illegal level `MAX` | refusal | same reader | exit 3, 0 adapters | FLOWING (fails closed) |
| Same, adapter whose effort line is dropped after render, set unchanged | per-member level | transformed text | Installed without the line, exit 0 | DISCONNECTED for the per-member arm (Gap 2) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Typecheck | `npx tsc --noEmit` | exit 0 | PASS |
| Build parity | `npm run check:build-parity` | 0 findings over 73/73 | PASS |
| Adapters fresh | `npm run freshness:adapters` | 17 compared, 0 differences | PASS |
| Foundation guards | `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED | PASS |
| Structure validator | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | ALL CHECKS PASSED | PASS |
| Targeted lane | 16 files: model-tiers, generate-role-adapters, adapters-freshness, canonical-frontmatter, check-foundation-guards, host-tools, host-tools-prose, canonical-path, path-spelling-census, mode-census, ledger, record-truth, installer-user-edit, uninstall-removal, installer-dry-run, marker-binding | 16 passed, 1001 passed, 1 skipped | PASS (macOS only) |
| Pi install lifecycle | scratch repo, GRUGOPS_HOME set to scratch dir | dry-run / create / skip / left-on-edit / remove / rmdir as listed in truth 8 | PASS |
| Effort drop evasion | scratch kit copy with generator patched to drop one `effort:` line | control refused exit 3; evasion exit 0, 17 adapters, 0 `effort:` lines on `grugops-architect-design.md` | FAIL (Gap 2) |
| Full suite | not re-run by me. The caller reports `Test Files 103 passed (103)`, `Tests 7435 passed \| 2 skipped (7437)` on macOS at HEAD d4433b10. | n/a | accepted from caller, not reproduced; says nothing about Windows |

The scratch kit copy was made under the session scratchpad and no `npm test` was run.

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes are declared by this phase. Step 7c: SKIPPED (no declared probes).

### Windows-latest classification re-check (HOST-02)

Independently re-derived from the job log of run 37733716975 (`gh run view --job 113168427323 --log`), not from 34-18-SUMMARY.md.

| # | Red test (file) | Body changed since 45766c2d? | Counts against HOST-02 |
|---|-----------------|------------------------------|------------------------|
| 1 | `install.test.ts` readUserFile absent/ENOTDIR (line 7290) | No hunk in its body | No (carried, WINDOWS.md row 317) |
| 2 | `install.test.ts` W1 incomplete copy (line 10077-10098) | No (nearest hunk is at 10134, after the test) | No (carried) |
| 3 | `installer-write-set.test.ts` ENOTDIR (line 653) | No (hunks at 559, 563, 605) | No (carried) |
| 4 | `kit-plan-limits.test.ts` PATH_MAX | File not in the diff | No (carried) |
| 5 | `kit-plan-limits.test.ts` NAME_MAX | File not in the diff | No (carried) |
| 6 | `ledger.test.ts` treeRecord shapes (line 449-454) | Yes (plan 34-13, hunk at 452) | **Yes** |
| 7 | `ledger.test.ts` backupContentRecord (line 630-638) | Yes (plan 34-13, hunk at 630) | **Yes** |

Round 1 turned 5 HOST-02 reds into 0 and surfaced 2 new ones; this matches the 34-VALIDATION.md "measured result" section. The cause of 6 and 7 is a fixture target that Windows respells. Whether `readlinkSync` on windows-latest returns the recorded `D:\...` string for a product link is `UNKNOWN - verify` (the reviewer's source reading says the product's links are drive-qualified, and Node 22's libuv path was not read by anyone; 34-18 read Node 24 locally).

### Requirements Coverage

All 11 IDs appear in at least one PLAN's `requirements:` field (34-01..34-18) and in REQUIREMENTS.md's traceability table for Phase 34. No orphaned requirement. The ticks 34-16 and 34-17 made were each checked against the code:

| Requirement | Source Plan(s) | REQUIREMENTS.md | My status | Evidence |
|-------------|----------------|-----------------|-----------|----------|
| EFFORT-01 | 34-07 | `[ ]`, "Gaps Found" | SATISFIED | Truth 1. Box can be ticked; traceability row is stale from round 0. |
| EFFORT-02 | 34-01 | `[ ]` | SATISFIED | Truth 2. |
| EFFORT-03 | 34-01, 34-03 | `[ ]` | SATISFIED | Truth 2 (tiered 4 high / 13 medium from the model TIERED rows; model preset leaves effort alone per round 0). |
| EFFORT-04 | 34-01..34-17 | `[x]` Complete | SATISFIED | Truths 3 and 4. The tick is supported by the requirement's own text. Gap 2 is the installer companion, which EFFORT-04's text does not name. |
| EFFORT-05 | 34-07 | `[ ]` | SATISFIED | Truth 2 and the docs lines 164-165. |
| HOST-01 | 34-02, 06, 09 | `[ ]` | SATISFIED | Truth 5. |
| HOST-02 | 34-10..34-18 | `[ ]` Pending | **BLOCKED** | Truth 6. Leave unchecked. Not marked met from macOS evidence. |
| PI-01 | 34-06 | `[ ]` | SATISFIED | Truth 7. |
| PI-02 | 34-02, 04, 06, 08, 16 | `[x]` Complete | SATISFIED | Truth 7; the tick is supported. |
| PI-03 | 34-04, 10..13, 17, 18 | `[x]` "Complete on POSIX" | SATISFIED | Truth 8; the tick is supported, and the Pi rows are now also green on windows-latest. |
| PI-04 | 34-07, 34-08 | `[ ]` | SATISFIED | Truth 9. |

### Code review (34-REVIEW.md gap round 1: 0 critical / 3 warning / 3 info; ledger: WR-08..10 open, IN-06..08 deferred)

| Finding | Reproduced | Bearing on a must-have |
|---------|------------|------------------------|
| WR-08 effort check misses a dropped line when the set is unchanged | **Yes, end to end** (Gap 2) | Falsifies the 34-15 truth; does not falsify EFFORT-04's text. |
| WR-09 census checks a hand-picked site list; `isAbsoluteMarkerPath` is a second absoluteness rule | Yes by source: `install-marker.ts:1154-1155` is `v.startsWith("/") \|\| /^[A-Za-z]:[\\/]/.test(v)`, while `user-file.ts:298-299` says no other site may compare a recorded path another way. Behavior not run on win32. | Fails closed; no must-have. Also note `isOwnLink` is a recorded-path byte comparison outside the census, which the review did not list. |
| WR-10 read-only "user mode edit" removed the end-to-end pointer-file mode test | Yes by source and by the test's own comment (`record-truth.test.ts:333-335`); a regression in `removeOwnedEmptyFile` would stay green on every OS | PI-03/HOST-02 coverage hole, not a must-have failure. |
| IN-06..IN-08 | Not individually reproduced | Info, deferred. |
| WR-01, WR-02, WR-04, WR-05 and IN-01..IN-05 (round 0, deferred) | Not touched by gap round 1 per the review | Carried; none falsifies a must-have. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `install/install.ts` | 3325-3330, 4931-4935, 5005-5008 | comments say a dropped `effort:` line is refused; code refuses only a moved set | Blocker for the 34-15 truth (Gap 2) | installer can install an adapter at session effort silently |
| `install/ledger.test.ts` | 453-454, 637-638 | rooted POSIX symlink target asserted verbatim | Blocker for HOST-02 (Gap 1) | red on windows-latest |
| `install/install-marker.ts` | 1154-1155 | second hand-written absoluteness rule | Warning | UNC-native marker target reads as not absolute on win32; `C:/x` reads absolute on POSIX |
| `install/user-file.ts` | 536 | `readlinkSync(dest) === src` byte equality on a recorded path | Warning | Windows reach UNKNOWN - verify; fails closed |
| debt markers | n/a | `TBD`/`FIXME`/`XXX` scan over the changed files not run by me file by file | UNKNOWN - verify | repo CI gates (`check:diff-disposition`, banned-claims, public-docs) were not re-run by me this round |

### Process notes

- 34-18 recorded the miss honestly: the prediction (5 red) was wrong by 2, the new cause was diagnosed from the printed failure, and the plan did not fix code (its own prohibition). My independent re-read of the log agrees with its numbers and classification.
- The prediction missed the two reds because plan 34-12's masked-assertion audit covered WIN-1 reds only. A second round that fixes these two fixtures should audit every other earlier WIN-2 red for the same masking before spending another 53-minute CI run.
- 34-VALIDATION.md still carries `nyquist_compliant: false` and `status: draft` by design under D-09 until the human push passes.

### Human Verification Required

#### 1. `/grugops` on a real Pi after a scripted install

**Test:** Install with `node install/install.js --target <scratch repo>`, start Pi at the repository root, grant project trust, type `/grugops hello`.
**Expected:** `/grugops` is listed; the expansion contains `Request: hello`; the agent reads `AGENTS.md` and reaches the Orchestrator role text.
**Why human:** No Pi CLI ran; kit discovery after a scripted install is `UNKNOWN - verify` (backlog 999.4).

#### 2. A real sub-agent run under a configured `effort:` line

**Test:** Set `models.effort.preset: "tiered"`, re-run install, run `/grugops` on Claude Code 2.1.267 or later and observe the spawned agents' effort levels.
**Expected:** `orchestrator`, `architect-design`, `security-nfr`, `compliance-officer` at `high`; the other 13 at `medium`; a role with no line at the session level.
**Why human:** Live platform behavior; docs citation only.

#### 3. Product link ownership on Windows

**Test:** On a windows-latest (or Windows) checkout with symlink privilege, install with `INSTALL_MODE=symlink`, then uninstall.
**Expected:** `isOwnLink` is true for the recorded `D:\...` source and the link is removed.
**Why human:** The link describes are `skipIf(win32)`; no run has read a product link back on Windows (WINDOWS.md row 319 product reach).

### Gaps Summary

Two gaps. Both are small and both have a concrete fix.

1. **HOST-02 (blocker).** Two `install/ledger.test.ts` fixtures use the drive-less target `/some/where`, which Windows respells `D:\some\where`. Build the target from the test's own scratch root so every platform returns it unchanged, audit the other earlier WIN-2 reds for masked later assertions, then the human pushes and the result is recorded from the printed `Tests` line. Alternatively the human records an override of D-09's condition. Nothing here shows a product defect, but the product-side link comparison on Windows is unmeasured.
2. **Installer effort cross-check (partial).** Add the per-member check WR-08 describes (or announce the per-role map), with the evasion shape (`tiered` plus one role at `inherit`, one adapter's line dropped) as a refusal case; or rewrite the comments to say what the set check actually catches.

Cheap riders for the same round, none of them blocking: WR-10 (a writable chmod-only pointer-file case gated by the measured capability), WR-09 (one absoluteness rule on the flavor, census widened to `isOwnLink` as well), and ticking the seven requirement boxes (EFFORT-01, 02, 03, 05, HOST-01, PI-01, PI-04) whose evidence is now unchallenged, with the stale "Gaps Found" traceability cells updated. This is gap round 1 of 4 closed; the next is round 2.

---

_Verified: 2026-10-09T00:55:00Z_
_Verifier: Claude (gsd-verifier)_
