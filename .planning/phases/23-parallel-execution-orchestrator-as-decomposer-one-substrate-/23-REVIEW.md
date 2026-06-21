---
phase: 23-parallel-execution-orchestrator-as-decomposer-one-substrate-
reviewed: 2026-06-21T08:08:26Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-uat-oracles.ts
  - scripts/check-uat-oracles.test.ts
  - scripts/claim.ts
  - scripts/claim.test.ts
  - scripts/now-running-freshness.ts
  - scripts/now-running-freshness.test.ts
  - scripts/config-queue-consistency.test.ts
  - scripts/decompose-spine.test.ts
  - scripts/convergence-spine.test.ts
  - scripts/generate-catalog.test.ts
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/workflows/17-task-claim.md
  - agent-factory/packaging/adapters.md
  - agent-factory/packaging/subagent.frontmatter.md
  - agent-factory/packaging/slash-command.template.md
  - agent-factory/README.md
  - agent-factory/config/factory.config.json
  - agent-factory/config/factory.config.md
  - agent-factory/seed/.grugops/factory.config.json
  - .claude/agents/grugops-orchestrator.md
  - package.json
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-06-21T08:08:26Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

This phase inverts the WR-05 safety guard (`guardWr05`) from "forbid the spawn grant
outright" to marker-keyed both-direction enforcement, adds the lockstep five-tool-table
asymmetry assertion (`oracleWr05Wording`), and stands up the parallel-execution spine
(`claim.ts` queue/render + `now-running-freshness.ts` drift gate). I focused the
adversarial pass on the four security-sensitive surfaces named in the brief, then did the
normal bug/injection/quality sweep across all listed files.

The claim/render/freshness machinery is solid. The `by`-injection guard, the
first-`at`-trusted / multi-`at`-tampered carve-out (reused identically in `sweepStale` and
`renderNowRunning`), the path-traversal allowlist, and the fail-closed branches in
`now-running-freshness.ts` are all correct and well tested. The asymmetry oracle checks all
four non-CC rows in both directions and the CC row in the gained direction.

**However, the WR-05 inversion has one BLOCKER**: Phase 23 simultaneously (a) flipped the
guard to identify the coordinator by the `coordinator: true` marker and (b) *added a fenced
markdown example carrying that exact marker plus a live-shaped `tools: Agent(...)` grant to
`subagent.frontmatter.md` — a file in the guard's own SCAN set*. The guard is line-based and
fence-agnostic, so it now mis-classifies a documentation file as a second live coordinator.
The guard PASSES today only by coincidence (the doc example's marker and grant happen to sit
together), and the invariant "exactly the real coordinator holds the grant" is hollowed for
that file. I verified this against the committed `.js` on the real tree — guard exits 0 with
two `coordinator: true` markers in the scan set.

## Critical Issues

### CR-01: `guardWr05` mis-classifies a documentation file as a live coordinator (WR-05 invariant hollowed)

**File:** `scripts/check-foundation-guards.ts:134-164`, `agent-factory/packaging/subagent.frontmatter.md:87-95`

**Issue:**
Phase 23 added a coordinator-wrapper *example* to `subagent.frontmatter.md` inside a fenced
markdown block:

```markdown
---
name: grugops-orchestrator
...
coordinator: true
tools: Agent(grugops-software-engineer, grugops-qe-e2e, grugops-security-nfr, …), Read, ...
---
```

`subagent.frontmatter.md` is one of the four files in `WR05_SCAN`. `guardWr05` reads it
line-by-line with no fence awareness (`grepFiles` + `WR05_COORDINATOR` + `WR05_COMMA`), so it
treats the illustrative `coordinator: true` on line 91 as a real marker and the illustrative
`tools: Agent(...)` on line 92 as a real grant. Verified on the real tree:

```
$ node scripts/check-foundation-guards.js
  PASS  WR-05: coordinator holds the spawn grant; no non-coordinator does
$ grep -c '^coordinator: true' .claude/agents/grugops-orchestrator.md \
        agent-factory/packaging/subagent.frontmatter.md
# 1 and 1  → TWO files now read as "coordinator"
```

Git confirms this is a Phase-23 regression: pre-23 the file had no `tools: Agent` example
(the old guard forbade *all* grants, so such an example could not exist in scan), and the
marker-keyed flip landed in the same milestone (`8b17a91`) that the example was added.

Why this is a BLOCKER (not just cosmetic), per the project's own "green-suite-insufficient"
safety rule:

1. **The guard never asserts "exactly one coordinator."** A second marker in the scan set is
   silently accepted, so the both-direction discipline ("the coordinator MUST hold the grant;
   every non-coordinator MUST NOT") is no longer enforced over that file — it has been promoted
   out of the "must-not" set by an illustrative marker. The guard's stated invariant is weaker
   than it reads.
2. **Latent false-positive trap.** The two illustrative lines are only "valid" together. A
   perfectly reasonable later doc edit — trimming the `coordinator: true` line from the example
   while keeping the `tools: Agent(...)` example — flips this documentation file to a
   "non-coordinator with a grant" and the guard fails RED with "rogue spawner" on a pure prose
   change. Conversely, dropping the grant line keeps the marker and fails with "dropped grant
   kills Claude Code parallelism" on a doc file that loads nothing. A safety guard that fails on
   documentation edits will be muted or worked around — exactly the failure mode the WR-05 flip
   was meant to prevent.
3. The half-flip RED fixtures in `check-foundation-guards.test.ts:143-209` all mutate the *real*
   adapter, so none of them exercise the doc-file-as-coordinator path; the smoke test
   (`:504-508`) passes precisely *because* of the coincidence above. The test suite cannot see
   this hole.

**Fix:** Make `guardWr05` immune to fenced examples and enforce coordinator cardinality.
Strip fenced code blocks before scanning the packaging/template docs (the guard already owns
fence-strip machinery in `stripCavemanBlock` — reuse the same line-state approach), and assert
exactly one coordinator across the scan set:

```ts
function guardWr05(): void {
  // ...
  const coordinators: string[] = [];
  for (const f of WR05_SCAN) {
    if (!fileExists(f)) continue;
    // Packaging templates legitimately SHOW frontmatter inside ``` fences. Strip fenced
    // blocks first so an illustrative `coordinator: true` / `Agent(...)` is not read as live.
    const body = stripFencedBlocks(readText(f));
    const isCoordinator = WR05_COORDINATOR_LINE.test(body);  // tested on fence-stripped body
    const hasGrant = WR05_COMMA_LINE.test(body) || WR05_ARRAY_LINE.test(body);
    if (isCoordinator) coordinators.push(f);
    if (isCoordinator && !hasGrant) { /* dropped-grant fail */ }
    else if (!isCoordinator && hasGrant) { /* rogue-spawner fail */ }
  }
  // Cardinality: the substrate has exactly ONE coordinator (the orchestrator adapter).
  if (coordinators.length !== 1) {
    wr05Fail += `\nexpected exactly one coordinator: true file, found ${coordinators.length}: ${coordinators.join(", ")}`;
  }
  // ...
}
```

Add a RED fixture that plants a `coordinator: true` + grant pair into a *non-adapter* scan
file (a doc example) and asserts the guard fails the cardinality check — closing the gap the
smoke test currently papers over. Alternatively (simpler, but weaker), remove
`subagent.frontmatter.md` from `WR05_SCAN` the way `adapters.md` is deliberately excluded
(D-09) since it is pure documentation, never a loaded adapter — but the cardinality + fence
strip is the durable fix.

## Warnings

### WR-01: `ASYM_SPAWN_WORDING` only catches three exact phrasings — a non-CC row can advertise parallelism without tripping it

**File:** `scripts/check-uat-oracles.ts:139,185-189`

**Issue:** The asymmetry oracle forbids spawn wording on the four non-CC rows with
`ASYM_SPAWN_WORDING = /coordinator|spawns? role agents|spawn role agents/i`. That only matches
the literal token "coordinator" or the exact phrase "spawn(s) role agents". A drifted non-CC
row that said e.g. "parallel role dispatch", "fan-out agents", "concurrent sub-agents", or
"runs roles in parallel" would NOT trip `ASYM_SPAWN_WORDING`, and because such a row could
still retain "Sequential role-load" elsewhere, it would also satisfy `ASYM_NOSPAWN_WORDING`
(`/no spawn|Sequential role-load/i`) — passing both directions while advertising parallelism.
The brief explicitly asks whether a non-CC row could advertise spawning without tripping the
assertion; this is the gap.

**Fix:** Broaden the prohibited set to the concept, not three phrasings — e.g. add
`parallel`, `concurren`, `fan-out`, `dispatch.*agent`, `\bspawn` to `ASYM_SPAWN_WORDING`
(word-boundary `\bspawn` would need to coexist with the legitimate "no spawn"; assert the row
matches `ASYM_NOSPAWN_WORDING` AND does NOT match a bare spawn token that is not immediately
preceded by "no "). The cleanest form is a positive whitelist: a non-CC row must match
`/^.*Sequential role-load.*$/` and must NOT contain `/\b(spawn|parallel|concurrent|fan-?out)\b/i`
except in the exact phrase "no spawn".

### WR-02: `oracleParity` `pending human` advisory regex is whole-file, not cell-scoped — a stray "pending human" anywhere passes the no-fabrication surface

**File:** `scripts/check-uat-oracles.ts:340,346-353`

**Issue:** The no-fabrication advisory uses `/pending human/i.test(text)` over the WHOLE
`examples/03-ticket-to-pr.md` file, then emits only a WARN. The comment claims the oracle
"must NEVER read a `pending human` cell AS a confirmed match," but the structural pass at
`:342` depends solely on the four frozen strings being present anywhere in the file and the two
column headers being present anywhere — it never verifies the `pending human` marker is in the
CC-native column cell specifically. If the CC-native column were filled with a fabricated
"passed" value while the literal text "pending human" survived in unrelated prose elsewhere,
the oracle would still WARN-but-pass, defeating the stated no-fabrication intent. The advisory
is decorative, not load-bearing.

**Fix:** Scope the pending check to the CC-native column cell (parse the table row, split on
`|`, locate the CC-native column index from the header, assert that cell still reads
`pending human` OR matches the frozen expected value — never an arbitrary "passed"). Today the
structural assertions are all whole-file substring checks, which is structurally fragile for a
trace/no-fabrication oracle.

### WR-03: `oracleWr05Wording` finds only the FIRST matching table row — a duplicate/legacy table row is invisible to the asymmetry check

**File:** `scripts/check-uat-oracles.ts:178`

**Issue:** `const row = lines.find((l) => rowRe.test(l))` returns only the first row whose
first cell names the tool. `README.md` already carries an "earlier usage overview" table
(adapters.md:22-24 explicitly notes the README's Claude Code row "predates the command-form
decision"), and the brief calls out that the README table is intentionally a different,
older shape. If a second `| **Codex CLI** ...` row were ever introduced (or the existing
overview table drifts), only the first is scanned; a later duplicate row that gained spawn
wording would pass silently. The check assumes one row per tool per file without asserting it.

**Fix:** Use `lines.filter(...)` and validate EVERY matching row for the tool, not just the
first. At minimum, assert there is exactly one matching row per tool per file and fail on a
duplicate so drift in a second table cannot hide.

### WR-04: `now-running-freshness.ts` runs top-level side-effecting work at import with no guard — importing the module executes the gate and calls `process.exit`

**File:** `scripts/now-running-freshness.ts:74-156`

**Issue:** Unlike its siblings `claim.ts` (`isMain` guard, `:324`) and `check-uat-oracles.ts`
(`isEntry` guard, `:384`), this gate has NO entry guard: `mkdtempSync`, `cpSync`, `spawnSync`,
and multiple `process.exit()` calls run as top-level module side effects. Any `import` of
`now-running-freshness.js` (e.g. a future aggregator folding it in the way
`check-foundation-guards.ts` imports the oracles, or a test that wants to unit-test a helper)
would silently run the whole gate and terminate the host process. The module's own header even
contemplates that it is "NOT folded into check-foundation-guards.ts" — but nothing *enforces*
standalone-only execution; it is standalone by omission, not by guard.

**Fix:** Wrap the executable body in `function main()` and gate it behind the same
`import.meta.url === pathToFileURL(process.argv[1]).href` check the other scripts use, so the
module is import-safe. This also makes the gate unit-testable without spawning a subprocess.

## Info

### IN-01: Duplicate `name: grugops-orchestrator` across two distinct example blocks in one doc

**File:** `agent-factory/packaging/subagent.frontmatter.md:28,89`

**Issue:** The "plain specialist wrapper" example (`:28`) and the "coordinator wrapper"
example (`:89`) both use `name: grugops-orchestrator`. The plain-specialist example is meant
to illustrate a *non-coordinator* specialist (no grant), so naming it `grugops-orchestrator`
is misleading — a reader copying the first block gets an orchestrator with no spawn grant. Use
e.g. `name: grugops-software-engineer` for the plain-specialist illustration to match the
"Adapt this template per role" note at `:77`.

### IN-02: `ASYM_ROWS` lists Claude Code last though the code special-cases it — readability/maintainer trap

**File:** `scripts/check-uat-oracles.ts:131-137,180`

**Issue:** `ASYM_ROWS` interleaves the four non-CC rows then Claude Code, and the branch logic
keys on `label === "Claude Code"` (`:180`). A maintainer adding a sixth tool row must remember
to keep it out of the CC special-case. Minor, but a named constant
(`const CC_LABEL = "Claude Code"`) referenced in both the array and the branch would prevent a
typo from silently routing a new row through the wrong direction (a typo'd CC label would make
the real CC row be checked as a non-CC row — i.e. fail for *having* spawn wording).

### IN-03: `generate-catalog.test.ts` is in the review scope but is not a Phase-23 change of substance

**File:** `scripts/generate-catalog.test.ts`

**Issue:** The file appears in the diff range but its last substantive change is the Phase-22
catalog bump (`b9ff2d3`, 17→18 workflows); no Phase-23 logic rides in it. No defect found —
flagged only to record that it was reviewed and is out of the phase's behavioral surface.

---

## Narrative Findings (AI reviewer)

All findings above are narrative (direct adversarial code review). No structural pre-pass
(`<structural_findings>`) was provided for this phase.

Items specifically cleared during the focused pass on the four security surfaces named in the
brief:

- **`renderNowRunning` multi-`at` carve-out (claim.ts:289-300):** correct. It reuses the exact
  first-`at`-trusted / `atLineCount > 1` skip discipline from `sweepStale` (`:196-203`); a
  forged second `at:` line is dropped, never trusted on first or second match. No permissive
  multi-match parser was introduced. Tested by `now-running-freshness.test.ts:117-130` (the
  2099 forged timestamp never reaches the render).
- **`by`-injection guard (claim.ts:116-120):** correct — CR/LF in `by` is rejected before the
  raw write, closing the smuggled-`at:` queue-lock DoS. Tested at `claim.test.ts:155-161`.
- **Path traversal (claim.ts:67-77, 188, 284):** the `^[A-Za-z0-9._-]+$` allowlist plus
  explicit `.`/`..` rejection is applied at every join site including the defensive readdir
  loops. Queue root never derived from argv/env as an absolute path. Sound.
- **`now-running-freshness.ts` fail-closed branches (`:111-120, 127-138, 142-149`):** all three
  intact — non-zero regen, unreadable committed render, and byte mismatch each
  `process.exit(1)` and never fall through to "fresh". The `realpathSync` of the temp mirror
  (`:74`) correctly prevents the macOS `/var`→`/private/var` symlink no-op that would otherwise
  vacuous-pass the byte-compare. Greenfield vacuous pass (`:85-92`) is honest.
- **`oracleWr05Wording` asymmetry (check-uat-oracles.ts:174-194):** checks all four non-CC rows
  in BOTH directions (gained-spawn AND lost-no-spawn) and the CC row in the gained direction.
  No way found for a non-CC row to lose its no-spawn wording without tripping `:189`. (The only
  residual gap is the phrasing-coverage of `ASYM_SPAWN_WORDING` — see WR-01.)
- **WR05 grant EREs (`WR05_COMMA`/`WR05_ARRAY`, check-foundation-guards.ts:127-131):** still
  catch comma-form, bare array-item, and quoted array-item, with the `Agent|Task` alias
  retained. `WR05_SCAN` (`:135-140`) is an explicit four-file list, not a repo-wide grep. The
  EREs themselves are correct; the defect is the marker mis-classification (CR-01), not the
  grant detection.
- **ReDoS:** `CTX_WRITE_RE` (check-foundation-guards.ts:529-531) and the lookahead beat regexes
  (check-uat-oracles.ts:105-118) were reviewed for catastrophic backtracking; all run per-line
  against short markdown lines with no nested unbounded quantifiers over overlapping classes —
  no practical ReDoS exposure.
- **Caveman/clear-voice convention:** the new role/workflow/packaging prose holds the
  convention — `orchestrator.md`'s coordinator hard-limit (`:95`) and the prod-deploy guard
  text in `adapters.md` (`:78-91`) are clear-voice safety surfaces; the `## Caveman prompt`
  block in `orchestrator.md` (`:12-29`) keeps cadence. No capability misrepresentation found in
  the five-tool tables beyond the assertion-coverage gaps noted in WR-01/WR-03.

---

_Reviewed: 2026-06-21T08:08:26Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
