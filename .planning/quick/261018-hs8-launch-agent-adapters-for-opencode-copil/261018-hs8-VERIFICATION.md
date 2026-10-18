---
phase: quick-261018-hs8
verified: 2026-10-18T22:30:00Z
status: human_needed
score: 19/19 must-haves verified
covered_files:
  - ".planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-PLAN.md"
  - ".planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-REVIEW.md"
  - ".planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-SUMMARY.md"
  - "agent-factory/LICENSE"
  - "agent-factory/NOTICE"
  - "agent-factory/packaging/subagent.frontmatter.md"
  - "install/README.md"
  - "install/agents-record.test.ts"
  - "install/host-entries.test.ts"
  - "install/host-tools.test.ts"
  - "install/host-tools.ts"
  - "install/install-marker.ts"
  - "install/install.ts"
  - "install/kit-route.test.ts"
  - "install/uninstall.ts"
  - "scripts/generate-host-entries.ts"
  - "scripts/model-dial-consistency.test.ts"
covered_digest: "v3:sha256:985fa6417a1e201bf21ac96b0080845a55383273354ba5eeb450291d9a73416f"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 14/14
  gaps_closed:
    - "CR-01: a launch file counted as a route carrier (reversed by D-06)"
    - "WR-01: stale 'emits no agent definition' sentence and its pin"
    - "WR-02: Pi launch form reads a repository file without the project-trust gate, undocumented"
    - "WR-03: closing line offered a launch form for a launch file install did not write"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Start a live session on each host with its launch form (opencode --agent grugops-orchestrator; copilot --agent grugops-orchestrator or /agent; pick grugops-orchestrator in the Antigravity /agents panel; pi --append-system-prompt .pi/grugops-orchestrator.md) in a repo with a scripted install"
    expected: "The session starts as the Orchestrator and follows the kitRoot route to agent-factory/roles/orchestrator.md"
    why_human: "Needs the live host CLIs (Copilot CLI is not installed here; OpenCode v2.0.28 TUI has no --agent flag in --help). Marked UNKNOWN - verify in the docs by design. Not a gap."
---

# Quick 261018-hs8: Launch agents and shipped MIT license, Re-verification Report (after the D-06 fix pass)

**Goal:** OpenCode, GitHub Copilot CLI and Antigravity CLI can start a session with the Orchestrator as the main agent; Pi gets an append-system-prompt launch file; Codex CLI unchanged; MIT LICENSE and NOTICE ship with the kit. After D-06: a launch file is never counted as a route carrier in the reach or strand verdicts.
**Verified:** 2026-10-18 (HEAD 8add25a0, on top of bbc8cc08 and 1e8b3c2c)
**Status:** human_needed (no gaps; the only open item is the live host runs, which are `UNKNOWN - verify` by design)
**Re-verification:** Yes, after the fix pass (D-06 reverses PD-1)

## Observable Truths

Truths 1-14 are the previous report's truths. Truth 6 is restated for D-06. Truths 15-19 are new, one per item of this re-verification.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | D-01: four launch files at the specified paths, name `grugops-orchestrator`; Codex and Claude Code `launchAgent: null` | VERIFIED | Scratch install of codex+antigravity+opencode+copilot+pi wrote exactly the four `*orchestrator*` files; a Codex-only scratch install wrote none. host-tools.ts rows keep `launchAgent: null` and now also `launchForm: null` for Claude Code and Codex. |
| 2 | D-04: files are generator output, thin pointer body | VERIFIED | `npm run freshness:host-entries`: 7 entries compared, 0 byte differences. |
| 3 | Install writes the chosen agent's launch file and records it | VERIFIED | Same scratch install; `--check` lists all four launch files `ok`. |
| 4 | D-03 whole-file rule: user file untouched and unrecorded | VERIFIED | Scratch with the user's own file ("mine") at all four launch paths: each reported `skipped ... a file is already there - left untouched`, and the content stayed "mine". |
| 5 | D-05 per-agent ownership on uninstall | VERIFIED | Scratch: `uninstall --codex` kept `.agents/agents/grugops-orchestrator.md` and the skill; `uninstall --antigravity` then removed `.agents` entirely. uninstall-removal.test.ts passes. |
| 6 | (restated for D-06) `--check` reports each launch file on a line of its own; none is a route carrier and none enters a reach line | VERIFIED | Scratch `--check` prints `ok launch file <path> carries the kit route: a session started with <form> reads it ... A default <host> session does not read it, so no reach line counts it`. No `kit route carried by` line or `reach` line names a launch file. `routeCarriers` in host-tools.ts is `entryFiles` plus `ROUTE_POINTERS[adapter]`; `launchCarriers` returns the launch file alone. |
| 7 | D-02: no `.pi/SYSTEM.md`, `.pi/APPEND_SYSTEM.md`, `.pi/settings.json`, no opencode `agent` key | VERIFIED | Scratch file list has none. |
| 8 | One registry field; per-kind table accesses census | VERIFIED | host-tools.test.ts passes. The census moved 3 to 4 on purpose: `routeCarriers` reads `ROUTE_POINTERS` by kind again. The move is dated in the test. |
| 9 | Generator renders 7 entries; build parity, freshness and typecheck pass | VERIFIED | `check:build-parity` PASSED, `freshness` 76/76 fresh, `freshness:host-entries` 0 difference, `typecheck` exit 0. |
| 10 | Invoke text and install/README.md give the launch forms with `UNKNOWN - verify` | VERIFIED | `invoke` now holds the default-session text only; the launch form lives in `launchForm`. host-entry-docs.test.ts passes, including the launchForm token check. |
| 11 | README Start a session table | VERIFIED | README.md changed by one line since 1e8b3c2c: the Pi row's trust warning. |
| 12 | Full-suite failure set equals the base set | VERIFIED (SUMMARY evidence, not re-run) | SUMMARY: 8405 tests, 23 failed, the only new keys the two known timing-flake keys in `scripts/board-watch-live.test.ts`. Not re-run, as instructed. |
| 13 | LICENSE/NOTICE ship with the kit | VERIFIED | `cmp` clean for both; installer-kit-home.test.ts passes. |
| 14 | Per-repo install writes exactly `tools/grugops/LICENSE`, recorded | VERIFIED | Scratch install output: `created tools/grugops/LICENSE`. |
| 15 | CR-01 closed: `routeCarriers` excludes launch files; reach and strand verdicts do not count them; `--check` prints a separate launch-file line | VERIFIED | See "CR-01 reproduction" below. |
| 16 | The restored test premises match eba46ad5, and each deliberate non-restoration has a sound ownership reason | VERIFIED | See "Judgement on the kept premises" below. |
| 17 | WR-01: the scope sentence no longer claims the kit emits no agent definition, and its pin follows | VERIFIED | subagent.frontmatter.md now says "no per-role agent definition ... the one launch agent it writes for OpenCode and for GitHub Copilot CLI carries no `model` or effort field", and the Antigravity clause likewise. `SCOPE_SENTENCE` and `UNKNOWN_CLAUSE` were re-pinned verbatim, with a dated note and the old wording recorded in the SUMMARY. A grep for "emits no agent definition" outside `.planning/` finds nothing. model-dial-consistency.test.ts passes. |
| 18 | WR-02: the Pi trust gap is warned about in clear voice | VERIFIED | install/README.md Pi section: bold "... project-trust check, so only use this command in a repository you trust". The same sentence is in the touch list, the README.md Pi row, adapters.md and the CHANGELOG. Deviation 5 (the docs do not claim `--check` proves the file is unedited) is correct: a user's own file that carries the route also reads `ok`. |
| 19 | WR-03 closed in both arms | VERIFIED | See "WR-03 reproduction" below. |

**Score:** 19/19 truths verified (0 behavior-unverified)

## CR-01 reproduction (scratch; HOME and GRUGOPS_HOME in the scratchpad; the real ~/.grugops untouched)

**Pi.** The target holds the user's own `AGENTS.md` ("# my own agents file", no route). `install.js --yes --pi`, then `rm .pi/prompts/grugops.md`, then `--check --strict`:
- Before the delete the exit is 0, with `reach Pi: reaches the Orchestrator through .pi/prompts/grugops.md`, and the launch file has its own `ok launch file ...` line.
- After the delete the exit is **1**. The output has two counted WARNs (AGENTS.md has no kit route; the template is not present), then `reach Pi: CANNOT reach the Orchestrator: AGENTS.md has no kit route, and install will not write the route into it; .pi/prompts/grugops.md is not present`, then `ok launch file .pi/grugops-orchestrator.md carries the kit route ... A default Pi session does not read it, so no reach line counts it`, then `2 WARNING(S) (--strict: promoted to failure)`.

**Copilot.** The target holds the user's own `AGENTS.md`. `install.js --yes --copilot` wrote the block and the launch agent. I replaced `.github/copilot-instructions.md` with user text lacking the block, then ran `--check --strict`. The exit is **1**, with `reach GitHub Copilot CLI: CANNOT reach the Orchestrator: AGENTS.md has no kit route ...; .github/copilot-instructions.md has no install block and no kit route`. The launch file's `ok launch file ... a session started with copilot --agent grugops-orchestrator reads it` line is separate.

The launch-file line has every state the fix pass promised:
- ok: seen in the scratch runs above.
- WARN for a user's own file at the launch path: four counted WARNs (exit 1) in the all-user-files scratch.
- FAIL for install's own stale copy, an uncounted note when absent, and WARN with NO VERDICT for an unreadable or blocked path: covered by kit-route.test.ts (162 passed).
- The new RED-first case "template absent, launch file present with the route, user AGENTS.md without it: counted WARN, exit 0 and 1 under --strict" is in kit-route.test.ts and passes. The SUMMARY records it red on 1e8b3c2c with the faked `reach ... through .pi/grugops-orchestrator.md` output.

## WR-03 reproduction

- **Install owns the file.** The real fresh Pi install closing line ends `... /grugops <request>; or start the session as the Orchestrator with pi --append-system-prompt .pi/grugops-orchestrator.md from the repository root`. The DRY_RUN run on a fresh target offers the form for all four hosts.
- **The file is the user's own.** With the user's own file at all four launch paths, the closing lines for Antigravity, OpenCode, Copilot and Pi each end `; no launch form is offered, because install neither wrote nor owns <path> here`. No launch form is named. The files stayed "mine".
- **The write is refused.** Covered by the kit-route.test.ts case "Pi's launch write refused (a directory there)". It passes. I did not reproduce it by hand.
- **Mechanism.** `launchClosingClause` asks `owns` over the record after the run. Under DRY_RUN it uses `PLANNED_BYTES` or the starting record.

## Judgement on the kept premises (agents-record R18, R35; kit-route IN-21 refused and user's own; WR-19)

At eba46ad5 these cases ran Pi with its template written or deleted, with nothing else in Pi's file set. Since this task, Pi also has a launch file that install writes and records. Without a matching step in each case, Pi owns an entry:
- R18 needs "every Pi write refused, so Pi owns no entry". The case now also plants a directory at the launch path.
- R35 needs "Pi owns no holding entry, only directory entries". The case now also deletes the launch file.
- IN-21 "user's own" needs "nothing of install's for Pi". The case now also makes the launch file the user's own.
- IN-21 "refused" and WR-19 need "both of Pi's writes refused, no entry of Pi's present". They block `.pi` itself.

All of them assert ownership and the ledger, not a route verdict. The D-06 change touched route verdicts only, and the installer's ownership behavior has not changed since eba46ad5 except that Pi has one more file. So the original premises are false by construction after this task, and restoring them would make the cases test something other than what their titles say. The reason is sound. The titles and comments were updated to say so, and the route property these cases do not exercise is covered by the new D-06 cases. The route-premise rewrites (the rows named in the SUMMARY: n4, n6, n10, `stageAllEarlier`, the Copilot link case, WR-13, WR-17, IN-21 deleted-template, M3 and M4, the :316 case) were restored. I spot-checked the diff against eba46ad5 for the kept ones and for `blockLaunch`, which now appears only in the Pi-refused cases and in new tests.

## Required Artifacts

| Artifact | Status | Details |
|---|---|---|
| install/host-tools.ts (`routeCarriers`, `launchCarriers`, `launchForm`, `launchInvoke`, `hostPointers`, `hostFootprint`) | VERIFIED | Present, wired, committed `.js` fresh. |
| install/install.ts (`launchFileFindings` step (f), `launchClosingClause`) | VERIFIED | Exercised by every scratch run above. |
| The four launch files, LICENSE, NOTICE | VERIFIED | Generator-fresh and byte-equal. |
| install/README.md, README.md, adapters.md, subagent.frontmatter.md, CHANGELOG.md | VERIFIED | Edited per WR-01, WR-02 and D-06. |

## Key Links

All wired and exercised by the scratch installs:
- `routeCarriers` goes to the reach and strand verdicts and has no launch file.
- `launchCarriers` goes to the separate `--check` lines.
- `launchInvoke` goes through `launchClosingClause`, gated on `owns`.
- `hostPointers` goes to the written, recorded set.
- `hostFootprint` goes to per-agent uninstall.

## Gate Scripts and Tests Re-run

- `check:build-parity`, `freshness`, `freshness:host-entries` and `typecheck` all exit 0.
- check-banned-claims, check-claim-anchors, check-public-docs-vocabulary, check-kit-refs, check-nul-bytes, check-foundation-guards, check-imperative-lexicon and check-platform-shapes all report ALL CHECKS PASSED.
- 13 targeted test files, 749 tests, all pass:
  - kit-route
  - host-tools
  - host-entries
  - host-entry-docs
  - agents-record
  - message-references
  - model-dial-consistency
  - uninstall-removal
  - generate-host-entries
  - host-entries-freshness
  - installer-dry-run
  - installer-kit-home
  - installer-cross-version
- The full suite and `npm test` were not run, as instructed.
- No stray files in `.temp/`. Scratch installs used the scratchpad HOME and GRUGOPS_HOME.

## Anti-Patterns

No TBD/FIXME/XXX debt markers or stubs in the changed paths. check-diff-disposition remains a measured, non-gating FAIL (59 findings, one new clause from the Pi trust warning), as before and as the SUMMARY records.

## Info (non-blocking)

- The launch-file WARN text is long, but it names the file, the form, the reason and two remedies. It is not a defect.
- The earlier mutation-2 wording mismatch from the first report (the tracer row is not the row that catches it) is unchanged and is not a gap.
- Of the review's info items, IN-01, IN-03 to IN-11 and WR-04 were out of the D-06 scope and were not part of this pass.

## Human Verification Required (non-blocking)

### 1. Live launch on each host

**Test:** In a repo with a scripted install, start each host with its launch form (see frontmatter).
**Expected:** The session starts as the Orchestrator and follows the `kitRoot` route.
**Why human:** Needs the live host CLIs, and Copilot CLI is not installed here. The docs mark these `UNKNOWN - verify` by design.

## Gaps Summary

None. CR-01 is closed: the reach and strand verdicts and install's route note no longer see launch files, and the reproduction that previously passed falsely now exits 1 with "CANNOT reach" for Pi and Copilot. WR-01, WR-02 and WR-03 are fixed. The four test premises not restored to eba46ad5 are ownership premises with a sound reason.

---

_Verified: 2026-10-18_
_Verifier: Claude (gsd-verifier)_
