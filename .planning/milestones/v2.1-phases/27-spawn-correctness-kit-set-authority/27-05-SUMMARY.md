---
phase: 27-spawn-correctness-kit-set-authority
plan: 05
subsystem: kit-prose
tags: [byte-ceiling, spawn-capability, platform-facts, table-asymmetry]
requires:
  - 27-01 (kit-model derivation; roleCeiling table left untouched)
provides:
  - orchestrator role file back under its warn tier with headroom for 27-06's frontmatter key
  - capability-keyed spawn instruction (D-04) as the contract 27-06/27-08 are written against
  - corrected platform depth/width facts on every surface that carried them
affects:
  - 27-06 (adds `capabilities:` frontmatter to orchestrator.md — 108 B of headroom below warn)
  - 27-08 (guards the coordinator adapter announcement vocabulary, deliberately NOT authored here)
tech-stack:
  added: []
  patterns:
    - "instruction keyed on tool availability, never on a host CLI's name"
    - "byte ceilings are measurement baselines: trim the file, never raise the ceiling"
key-files:
  created: []
  modified:
    - agent-factory/roles/orchestrator.md
    - agent-factory/packaging/adapters.md
    - docs/catalog/README.md
decisions:
  - "Byte budget taken entirely by tightening prose in place — no relocation, no new file, both ceiling values untouched (D-13/D-14/D-15)"
  - "The caveman-prompt spawn line was corrected alongside Responsibility 4: both are spawn instructions in this role, and leaving one host-keyed would have failed the plan's own D-04 truth"
  - "The Output section's numbered-workflow reference block was replaced by a like-named mapping rule — it duplicated the classification list four lines above it and agent-factory/README.md"
  - "agent-factory/README.md verified to carry no depth or width claim and left unedited"
metrics:
  duration: ~35 min
  completed: 2026-07-28
  tasks: 3
  files_modified: 3
  commits: 3
status: complete
---

# Phase 27 Plan 05: Orchestrator Trim and Platform-Fact Correction Summary

The orchestrator role file was eight bytes from a hard fail and advertised a nesting depth that
the platform changed twice in twenty patch releases; both are now correct, and the file sits
7057 B with 108 B of headroom below its warn tier.

## Byte ledger

| Point | Bytes | Delta |
|---|---|---|
| Before Task 1 | 7562 | — |
| After Task 1 (trim) | 6983 | −579 |
| After Task 2 corrections, before second trim pass | 7566 | +583 |
| After Task 2 (final) | 7057 | −509 |

Ceilings, unchanged throughout: FAIL 7570, WARN 7165. `guard_role_size` moved from WARN to PASS.
The corrections were genuinely net-positive in bytes — the plan's warning was accurate and the
Task 1 target of ≤7000 was necessary but not sufficient. Task 2 followed the plan's instruction to
return to prose tightening rather than shorten the facts: the second pass took a further 509 B.

## What was built

**Task 1 — trim (commit `35fb83e`).** 579 B removed by tightening prose in place across the Reads
list, the routing matrix, the Output section, Board moves, Trace updates, the WIP/DoR gate, the
XL-split rule and the Context I/O pointer line. No text was relocated,
`agent-factory/roles/_role-switch-protocol.md` was never opened for writing, and no file was
created. The kit-vs-state invariant blockquote survived verbatim (`check-kit-refs` exit 0), the
fenced caveman block survived as a fenced block, and all 14 routing arrows survived as pairs
(counted before and after against `git show HEAD:`).

**Task 2 — capability keying and platform facts (commit `50e76c3`).**

- Responsibility 4's `**Schedule**` clause now reads "where the `Agent` spawn tool is available …
  where it is not …". No host CLI is named as the spawn condition.
- The caveman line `You spawn agents only on Claude Code.` became `You spawn agents only when spawn
  tool there.` — same signal on all five hosts, caveman cadence preserved.
- The coordinator hard-limit paragraph now states: nesting defaults to 3 layers below the main
  conversation, tuned by `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`; that default arrived in v2.1.219
  and v2.1.217-v2.1.218 defaulted to 1, a known-bad window where nesting is off, so a coordinator
  there spawns nothing and the host version is the cause.
- The false claim that the platform does not cap width is gone, replaced by the real cap: 20
  concurrent subagents, 200 per session.
- The width cap of 3 is re-derived as a grugops discipline choice far inside that concurrency cap,
  explicitly "never a consequence of the depth cap", preceded by "Depth and width are independent
  axes with independent platform limits".
- One sentence records that at the depth limit `Agent` is withheld rather than erroring, so a role
  agent at depth does the work itself — a correct silent degrade.
- No parenthetical recording the superseded `DEPTH ≤5` or the withdrawn width claim survives
  (`grep -c` returns 0 for both).
- The three-tier announcement vocabulary was deliberately NOT authored here; it belongs to the
  coordinator adapter body in plan 27-06.

**Task 3 — remaining depth surfaces (commit `2f4f2eb`).** `agent-factory/packaging/adapters.md`
corrected at both sites — the Claude Code table row and the prose paragraph beneath the table.
`grep -c 'depth ≤5'` is 0; the two `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` occurrences sit on line
35 (the Claude Code row) and line 47 (prose outside the table). `agent-factory/subagent.frontmatter.md`
was not touched, as instructed.

## The README finding (Task 3's flagged research assumption, resolved)

The research inventory inferred, from its structural parallel to the packaging document, that
`agent-factory/README.md`'s five-tool table might also carry a depth claim. **It does not.**
Verified by reading lines 30-55 and by `grep -i 'depth|≤5|<=5|cap width|wip_limit|concurren'` over
the whole file, which returns no hits. Its Claude Code row reads "Coordinator spawns role agents —
the `coordinator: true` adapter holds the grant" with no number, and the paragraph beneath it
describes dispatch without citing depth or width. The file was therefore left unedited:
`git diff --stat agent-factory/README.md` is empty. The expected outcome held; the assumption is
resolved by measurement rather than carried.

## Table asymmetry

The oracle was run after the packaging edit and again after the README inspection — exit 0 both
times. The four non-Claude-Code rows were confirmed byte-identical to their pre-task values in
**both** documents by piping each `git show HEAD:` row through `cmp` against the working-tree row
(all five README rows and all four non-CC adapters rows: IDENTICAL). Neither the environment
variable (which contains the `SPAWN` token the prohibition alternation matches case-insensitively)
nor any concurrency wording entered a non-CC row.

## Deviations from Plan

**1. [Rule 3 - Blocking] Regenerated `docs/catalog/README.md`**
- **Found during:** Task 2, on the post-edit test run
- **Issue:** `scripts/generate-catalog.test.ts` (2 tests) and `scripts/catalog-freshness.test.ts`
  (1 test) failed. The catalog's Orchestrator one-liner is derived from the role file's `## One job`
  first sentence, which Task 2's second trim pass shortened. Task 1 had not tripped this because it
  edited only the second sentence, which the generator does not read.
- **Fix:** `npm run generate:catalog`, producing a one-line diff. Committed atomically with Task 2
  so the freshness gate never sees a split state.
- **Files modified:** `docs/catalog/README.md`
- **Commit:** `50e76c3`

**2. [Rule 2 - Missing critical correctness] Corrected the caveman-prompt spawn line**
- **Found during:** Task 2
- **Issue:** Task 2's action text names Responsibility 4, but the caveman prompt block carried a
  second, host-keyed spawn instruction: `You spawn agents only on Claude Code.` Leaving it would
  have left the plan's own must-have truth ("the spawn instruction in the orchestrator role reads on
  the availability of the spawn tool rather than on the host CLI's name") false, and would have left
  the role file self-contradictory on the exact point this phase exists to fix.
- **Fix:** Rewritten to `You spawn agents only when spawn tool there.` This is a correction, not the
  de-duplication work the prohibitions reserve for a later phase — the block was not restructured and
  nothing shared was extracted.
- **Files modified:** `agent-factory/roles/orchestrator.md`
- **Commit:** `50e76c3`

**3. [Process] Tracer feedback gate passed autonomously rather than as a human checkpoint**
- **Found during:** end of Task 1
- **Issue:** Task 1 is `type="tracer"`, and the executor's interactive-mode default is to stop for a
  human checkpoint after committing a tracer. This plan declares `autonomous: true` and defines the
  tracer's `<verify>` entirely as machine-checkable commands.
- **Action:** The tracer's full `<verify>` was re-run end-to-end after the commit and observed green
  (byte count ≤7000, `check-kit-refs` exit 0, `guard_role_size` PASS, 830 passed / 1 skipped). No
  fabrication: every command was run and its real output read. Execution continued to the expansion
  tasks under the plan's `autonomous: true` declaration. Recorded here so the choice is auditable.

## Verification (commands run, output observed)

| Check | Result |
|---|---|
| `wc -c < agent-factory/roles/orchestrator.md` | `7057` (≤ 7100) |
| `npm run build` | ok, no committed `.js` drift (`git status` clean of `scripts/`) |
| `node scripts/check-foundation-guards.js` | exit 1 with **exactly one** FAIL, and it is `guard_referential_integrity` (KIT-03, intended RED until 27-07) |
| `guard_role_size` for the orchestrator role | `PASS agent-factory/roles/orchestrator.md 7057B within ceiling` |
| `node scripts/check-uat-oracles.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 31 files, **830 passed, 1 skipped** — identical to the post-27-04 baseline |
| `grep -c 'DEPTH ≤5'` / `grep -c 'does NOT cap width'` in the role | `0` / `0` |
| `grep -c 'depth ≤5'` in adapters.md | `0` |
| `grep -c '7570'` / `grep -c '7165'` in the guards | `1` / `1` — unchanged |

Bare `npm test` was never run (it triggers the live claude-CLI e2e lane).

## Known Stubs

None.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change — this plan edited
markdown prose only.

## Notes for the next plan

`27-06` adds a `capabilities:` frontmatter key to `agent-factory/roles/orchestrator.md`. The file is
7057 B against a 7165 B warn tier, so **108 bytes** are available for that key before the warn
returns. A key of the shape `capabilities: [read, grep, glob, bash, edit, write]` fits; a longer
vocabulary will not, and the correct response is another prose trim, never a ceiling raise.

## Self-Check: PASSED

- `agent-factory/roles/orchestrator.md` — FOUND
- `agent-factory/packaging/adapters.md` — FOUND
- `docs/catalog/README.md` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-05-SUMMARY.md` — FOUND
- commit `35fb83e` — FOUND in `git log`
- commit `50e76c3` — FOUND in `git log`
- commit `2f4f2eb` — FOUND in `git log`
