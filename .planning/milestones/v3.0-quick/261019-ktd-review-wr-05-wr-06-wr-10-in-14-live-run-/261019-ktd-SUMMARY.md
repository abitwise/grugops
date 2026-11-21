---
phase: quick-261019-ktd
plan: 01
subsystem: install (host registry live-run record, --check launch lines) and the docs that repeat it
tags: [install, doctor, launch-files, verified-live, docs-binding, review-fix]
status: complete
requires: []
provides:
  - "LiveRun {date, hostVersion}; LaunchForm.verifiedLive is LiveRun | null"
  - "LAUNCH_NOT_LIVE; launchSession carries the live-run state on every --check launch line"
  - "launchLiveNote names the host and its version, or says host version not recorded"
  - "host-entry-docs rules LIVE-1, LIVE-2, LIVE-3 with mutation proofs"
affects: [install/host-tools.ts, install/host-tools.js, README.md, install/README.md, agent-factory/packaging/adapters.md, agent-factory/packaging/subagent.frontmatter.md, examples/01-greenfield-bootstrap.md, CHANGELOG.md]
tech-stack:
  added: []
  patterns: ["one owner of the live-run state (the session phrase), so no --check arm can drop it", "docs bound two-sided to the registry, derived set with asserted count, mutation proofs through the same scanner"]
key-files:
  created: []
  modified:
    - install/host-tools.ts
    - install/host-tools.js
    - install/host-tools.test.ts
    - install/host-entries.test.ts
    - install/host-entry-docs.test.ts
    - install/README.md
    - README.md
    - agent-factory/packaging/adapters.md
    - agent-factory/packaging/subagent.frontmatter.md
    - examples/01-greenfield-bootstrap.md
    - CHANGELOG.md
decisions:
  - "Human 2026-10-19: the host versions of the 2026-10-18 runs are Antigravity CLI `agy 1.4.2`, OpenCode 2.0.26, Pi 1.1.0. Recorded as hostVersion 1.4.2 / 2.0.26 / 1.1.0 (the binary name agy is not part of the version; the human's spelling is quoted in the comment and the CHANGELOG). Copilot CLI stays null (UNKNOWN - verify)."
  - "PD-1 applied with the human's choice of no UNKNOWN - verify mark: the note reads `verified live by a human on <date> on <host name> <version>`, or `verified live by a human on <date>, host version not recorded`."
  - "PD-2 applied: verifiedLive is LiveRun | null, LiveRun = {date, hostVersion: string | null}."
  - "PD-3 applied: launchSession appends ` (<note>)` or ` (UNKNOWN - verify: no live run)`; launchInvoke unchanged (install's provenance line marks an unverified form)."
  - "PD-4 applied: summary paragraphs name no host set and no date; they point to the per-host rows and sections."
  - "PD-5 applied: LIVE-2 binds the unverified form's backticked token; a launch claim in free prose has no mechanical check (residual)."
  - "PD-6 applied: IN-10 closed by the Task 3 edit of §6 and subagent.frontmatter.md."
metrics:
  duration: "about 1h 15m (the full suite alone took 34m 17s)"
  completed: 2026-10-19
actuals:
  tokens: 20588
  tasks: 3
  commits: 3
plan_head_before: 0768b4156e71fd4cc164fcea7413cea8af5eddc7
plan_head_after: 0b5d90669cc551d812545d592ebce20f26e9d9ef
commits: 3
---

# Quick task 261019-ktd: review WR-05, WR-06, WR-10, IN-14 (live-run state, host version, docs bound to the registry) Summary

Every `--check` launch-file line now carries the form's live-run state: the verified-live note with the host and its version, or `UNKNOWN - verify: no live run`. Before, `--check` stated the GitHub Copilot CLI launch as fact. The live-run record is now `{date, hostVersion}`. Every doc that says "verified live" or gives an unverified launch command is checked against the registry by three new rules, each with a mutation proof.

## Commits

| Task | Commit | Message |
| ---- | ------ | ------- |
| 1 (tracer) | eca71faf | fix(quick-261019-ktd): --check gives each launch form its live-run state; the live run records its host version |
| 2 | ed0dde7b | docs(quick-261019-ktd): verified-live claims and launch forms are checked against the registry in every doc |
| 3 | 0b5d9066 | docs(quick-261019-ktd): launch claims say what is meant and what a human saw; CHANGELOG |

`commits: 3` was measured with `git rev-list --count 0768b415..HEAD`.

## Human decisions applied (2026-10-19)

- The host versions are the ones the human gave on 2026-10-19 for the runs of 2026-10-18:
  - Antigravity CLI: given as `agy 1.4.2`, recorded as hostVersion `1.4.2`;
  - OpenCode: `2.0.26`;
  - Pi: `1.1.0`.
- So no current row has hostVersion null. The "host version not recorded" arm stays in the type and code. It is proved on a synthetic row (each verified row spread, with hostVersion set to null). The plan had the reverse: a recorded-version synthetic row with all real rows null.
- The resulting notes are:
  - `verified live by a human on 2026-10-18 on Antigravity CLI 1.4.2`
  - `verified live by a human on 2026-10-18 on OpenCode 2.0.26`
  - `verified live by a human on 2026-10-18 on Pi 1.1.0`
- GitHub Copilot CLI stays `verifiedLive: null`.
- The note has no `UNKNOWN - verify` mark (PD-1 as planned). PD-3 to PD-6 were applied as planned.

## RED, then GREEN

**Task 1 RED.** The new tests were run against the HEAD 0768b415 build. Files: host-tools.test.ts and host-entries.test.ts. Result: **9 failed, 123 passed**. The failures:
- the Antigravity tracer;
- the 4 per-launch-row loop cases (no ` (<state>) reads it (<name>)`);
- the kit-route section case (no `UNKNOWN - verify: no live run`);
- the per-kind oracle (`.date` of a string);
- the synthetic unrecorded-version case;
- the dated report pin.

**Task 1 GREEN.** These files ran together: host-tools, host-entries, host-entry-docs, host-tools-prose, kit-route, message-references and closing-claims. Result: **412 passed**. typecheck passed. freshness: 76 .js files fresh. freshness:host-entries: 0 byte differences. Scratch smoke (GRUGOPS_HOME and HOME under `$TMPDIR/grugops-261019-ktd/smoke1`, `--target`), with Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi installed:
  - `--check` printed `a session started with \`copilot --agent grugops-orchestrator\` (UNKNOWN - verify: no live run) reads it (GitHub Copilot CLI)`.
  - Each panel host's line printed its note, for example `(verified live by a human on 2026-10-18 on OpenCode 2.0.26) reads it (OpenCode)`. Pi's line printed `(verified live by a human on 2026-10-18 on Pi 1.1.0) reads it (Pi)`.
  - Install's closing lines carry the same notes.
  - The real ~/.grugops was not touched (mtime Oct 18 22:31).

**Task 2 RED.** Run on the Task 1 tree, host-entry-docs gave **4 failed, 22 passed**. These are the findings at the sites the plan predicted:
- LIVE-1: README.md:63, 64, 66, 68; adapters.md:37, 38, 40; install/README.md:550 (the live-session sentence) and 578.
- LIVE-2: README.md:65; install/README.md:516, 568, 892.
- LIVE-3: README.md:63-66; adapters.md:37, 38, 40.
- The LIVE-3 mutation case failed on its premise, because the real README was not yet clean.

**Task 2 GREEN.** Run on the edited tree: host-entry-docs, host-tools-prose, host-tools, check-banned-claims, check-public-docs-vocabulary, check-claim-anchors, check-uat-oracles and validate. Result: 531 passed. The first run had 1 failure: host-tools-prose Rule A matched the "two-host" hyphen form in a new test message, so I reworded the message. The validator passed. The plan's retired-wording greps passed.

## Gates (Task 3, after all edits)

All exit 0:
- build, typecheck, freshness (76 fresh), freshness:host-entries (0 byte differences);
- check:build-parity, run after staging;
- check:banned-claims;
- check:claim-anchors: 47/47, all byte-identical;
- check:public-docs;
- check-kit-refs, check-nul-bytes, check-foundation-guards.

The plan's Task 3 greps were checked and none of the retired wordings is left:
- the examples/01 wording;
- "make the Orchestrator pointer the session";
- "does not support starting a session", in the five listed files.

`check:diff-disposition` was measured, not gated: **64** findings over 40 elements, against the reference 61. That is 3 more, from the reworded prose clauses.

## Full suite (once, at the end)

The command was `npx vitest run --exclude '**/scripts/e2e/**' --reporter=json`. It ran in 2057 s and did not run out of memory.
- Result: 8438 tests, 8416 passed, 20 failed, 2 skipped.
- `failures.mjs new B after.json` printed nothing and exited 0, so there is **no new failure key** against 261018-hs8-BASE-FAILURES.txt.
- The 20 failures were all already in B: installer-fs-census 1, canonical-corpus 1, context-io-writer-set 2, context-io 7, harness-instance-ledger 4, uat-gate-exit-contract 5.
- board-watch-live passed this time.

## Moved pins (dated reasons)

- **host-tools.test.ts dated report pin.** Re-pinned 2026-10-19 by quick task 261019-ktd (review WR-10). The values are now LiveRun objects with the host versions the human gave. Its comment now says that a human found on 2026-10-18 that OpenCode 2.0.26 did not start a session with `--agent`; it no longer states that as a fact about OpenCode.
- **host-tools.test.ts per-kind oracle.** It moved into `expectLaunchWording`, which builds every string from literals. It now asserts the live-run state in the session phrase and the host version in the note. Every old check is kept.
- No census moved and none was loosened. MSG-1, the IN-13 `??` census, DOCTOR_REACH_SIZE and WR24_REACH_SIZE all stayed green with no change.

## Deviations from Plan

1. **[Human decision] Host versions recorded instead of null.** The human's 2026-10-19 decision gave the versions, so these plan items were adapted:
   - the report pin;
   - the synthetic row, which now proves the null arm;
   - the Task 1 smoke greps, now the versioned notes;
   - the doc sentences, where "host version not recorded" became the host and version in every verified site;
   - the CHANGELOG text.

   The generic descriptions still name both arms: the kit-route bullet, README.md's paragraph after the table, and install/README.md's live-session and closing-notes paragraphs.
2. **[Interpretation] Antigravity CLI's version is stored as `1.4.2`, not `agy 1.4.2`.** `agy` is the binary name, and the note already names the host ("on Antigravity CLI 1.4.2"). The human's spelling is quoted in the host-tools.ts comment, the test pin comment and the CHANGELOG. If the human wants the literal `agy 1.4.2` as hostVersion, that is a change to one value plus the README, adapters.md and install/README.md note strings the tests bind.
3. **[Interpretation] LIVE-1 names only launch hosts.** LIVE-1 counts the named hosts over LAUNCH_HOSTS, as the plan's behavior block derives them, not over every HOST_TOOLS row. The adapters.md Antigravity row names Codex CLI (the shared skill), so counting every row would make that row a permanent finding.
4. **[Interpretation] What "context host" covers.** A unit's context host is the usage section it sits in, which ends at the next heading of the same or a higher level, as guideSection bounds it. It is not just the nearest heading. A mutation case proves that the section ends at the next heading.
5. **[Rule 1] A Rule A hit in my own test message** ("two-host"). I reworded the message, and no census changed.
6. **Commit types.** The Task 2 and Task 3 subjects use the plan's `docs(quick-261019-ktd): ...`, not `fix(...)` as the coordinator's constraint asked. I did not rewrite the local history.

## Residuals

- **PD-5.** A launch claim worded in free prose, with no backticked unverified token, has no mechanical check. The prose sites were fixed by hand: examples/01, §6 and subagent.frontmatter.md.
- install.ts was not changed. Its comment at about line 7746 still says "a verifiedLive date". That is still true, since a LiveRun carries a date.

## Known Stubs

None.

## Self-Check: PASSED

- All 11 modified files exist. Commits eca71faf, ed0dde7b and 0b5d9066 are ancestors of HEAD.
