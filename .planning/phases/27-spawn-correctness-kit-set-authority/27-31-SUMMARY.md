---
phase: 27-spawn-correctness-kit-set-authority
plan: 31
subsystem: infra
tags: [typescript, node, symlink, recursion, denial-of-service, installer, ci-guards, kit-model]

# Dependency graph
requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "D-28's single kit-source derivation and D-29's per-path ancestor stack at both walk sites — the mechanism this plan bounds and gives a voice"
provides:
  - "MAX_WALK_ENTRIES=10000, a per-walk WORK bound at both recursive walk sites, structurally separate from the per-path cycle answer (D-35)"
  - "NestedWalkResult {files, cycles, overflow} — the installer walk can now say what it could NOT do, not only what it found"
  - "A named cycle refusal at both sites: reported by the installer, thrown by the kit-set authority, carrying the same relative path (D-36)"
  - "Boundary cases on both sides of the bound, sized FROM the exported constant rather than a restated number"
affects: [27-32, WR-03 equality case, check-foundation-guards, install, uninstall]

actuals:
  tokens: 16038
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Two concerns, two mechanisms, two lifetimes: a per-path ancestor stack answers MEMBERSHIP, a per-walk mutable tally answers COST, and neither is permitted to answer the other's question"
    - "A refusal is always NAMED, through whichever floor that side documents — report in the installer, throw in the CI authority"
    - "Test fixtures are sized FROM the exported bound, never from a restated literal, so a later change to the bound moves the fixtures with it"

key-files:
  created: []
  modified:
    - install/kit-source.ts
    - install/kit-source.js
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - install/install.ts
    - install/install.js
    - install/install.test.ts
    - scripts/kit-model.test.ts

key-decisions:
  - "D-35: the work bound is a SEPARATE, explicit mechanism from the cycle answer — MAX_WALK_ENTRIES=10000 at both sites, counted once per directory entry examined before the descend-or-collect decision"
  - "D-36: the cycle arm becomes a REPORTED event — the installer records and names the declined relative path, the kit-set authority throws a named error carrying the same path"
  - "D-36 AMENDS D-29's kit-model half: the shipped cycle case now asserts a NAMED THROW instead of a returned member set. The throw was deliberately NOT weakened to keep the old assertion green."
  - "Each side keeps its own documented floor. Member-set equality between the two sites is unavailable once one throws, so the WR-03 equality is expressed as 'both name the same relative path and neither is silent'."

patterns-established:
  - "Separate-mechanism discipline: conflating 'is this a cycle on this path' with 'how much work may this walk do' produced the global-visited-set defect and then produced WR-01; the two now live in different variables with different lifetimes and a case asserts the DAG refusal comes from the bound with the cycle list EMPTY"
  - "Adversarial mutation as acceptance evidence: each new mechanism was reverted in turn and the suite re-run to prove the new cases go RED, because on this phase a green suite has three times been necessary but not sufficient"

requirements-completed: []

coverage:
  - id: D1
    description: "Both recursive walks carry a per-walk WORK bound separate from the per-path cycle answer, so a cycle-free symlink DAG can no longer enumerate an unbounded number of distinct paths"
    requirement: KIT-02
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#the work bound refuses a CYCLE-FREE cross-linked DAG in bounded time, and the DAG is genuinely cycle-free (D-35, WR-01)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#source derivation: a CYCLE-FREE cross-linked DAG is refused by the WORK bound, not by the cycle answer, and the installer says so (D-35, WR-01)"
        status: pass
      - kind: other
        ref: "measured before/after over the same 15-directory forward-linked DAG against the committed .js — 32767 members / 11.3s + 12.2s before, named refusal in 1.48s + 1.26s after"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exceeding the work bound is a REPORTED refusal naming the bound — never a silent truncation. The installer surfaces it as a verification finding and withholds its completion banner; the kit-set authority throws naming the bound and the directory."
    requirement: KIT-02
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#a walk examining ONE entry beyond MAX_WALK_ENTRIES (10001) refuses BY NAME (D-35)"
        status: pass
      - kind: unit
        ref: "install/install.test.ts#source derivation: a walk examining ONE entry beyond MAX_WALK_ENTRIES (10001) refuses, naming the bound (D-35)"
        status: pass
      - kind: integration
        ref: "captured installer transcript over the DAG fixture — MAX_WALK_ENTRIES=10000 named, exit 3, zero occurrences of '== install complete'"
        status: pass
    human_judgment: false
  - id: D3
    description: "The cycle arm names the path it declined to descend into on both sides — reported by the installer, thrown by the authority, same relative path (D-36, WR-04)"
    requirement: KIT-01
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#a symlink CYCLE throws a NAMED error carrying the declined relative path, at one link and at two (D-36 amends D-29)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#source derivation: a symlink CYCLE is reported BY NAME and blocks the completion banner (WR-04, D-36)"
        status: pass
      - kind: other
        ref: "captured before/after installer transcripts over real/x.md + real/loop -> .. — 'real/loop' absent from the pre-fix run, named in the post-fix run"
        status: pass
    human_judgment: false
  - id: D4
    description: "Membership under the bound is byte-identical to before — the counter never narrows the set, proven by the shipped two-path CR-03 cases passing unchanged and by the boundary case exactly AT the bound succeeding"
    requirement: KIT-02
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#a directory reachable by TWO paths contributes BOTH members — the guard bounds recursion, it does not narrow the set (CR-03)"
        status: pass
      - kind: unit
        ref: "install/install.test.ts#source derivation: TWO paths to ONE directory produce TWO refusals, not one (CR-03, D-29)"
        status: pass
      - kind: unit
        ref: "scripts/kit-model.test.ts + install/install.test.ts#a walk examining EXACTLY MAX_WALK_ENTRIES (10000) entries succeeds"
        status: pass
    human_judgment: false
  - id: D5
    description: "Whether Claude Code actually LOADS adapter paths reachable only through a symlink cycle under .claude/agents — the platform-loading premise behind WR-04's severity"
    verification: []
    human_judgment: true
    rationale: "A platform behaviour that cannot be established from this repository. Recorded as `UNKNOWN - verify` in kit-source.ts rather than asserted; the fix does not depend on it, so it is scoped as an honesty fix and the premise stays pending."

# Metrics
duration: 45min
completed: 2026-08-01
status: complete
---

# Phase 27 Plan 31: Bound and Name Both Recursive Walks Summary

**A cycle-free symlink DAG that enumerated 32,767 members in 11.3 seconds now refuses in 1.5 seconds by name, and neither walk can drop a member silently any more — the installer reports each declined cycle path, the kit-set authority throws carrying the same path.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-08-01T18:33:17Z
- **Completed:** 2026-08-01T19:18:01Z
- **Tasks:** 2 of 2
- **Files modified:** 8 (4 sources + their committed `.js` twins, 2 test files)

## Accomplishments

- **WR-01 closed at both walk sites.** `MAX_WALK_ENTRIES = 10000` is a per-walk tally, counted once per directory entry examined *before* the descend-or-collect decision, so it bounds WORK directly and is independent of the tree's shape. It is deliberately a different variable with a different lifetime from the per-path ancestor stack — the plan's central instruction, and the distinction whose absence produced both of this walk's prior defects.
- **WR-04 closed as an honesty fix.** The cycle arm previously stopped descending and said nothing at all. It now names the relative path it declined, through each side's own documented floor.
- **D-36's amendment shipped without weakening the throw.** The shipped kit-model case that asserted a cycle "yields the REAL member set" now asserts a named throw at one link and at two. See "Decisions Made" for why the old assertion was not preserved.
- **Both mechanisms proven load-bearing by reverting them.** A green suite has been necessary but insufficient three times on this phase, so each mechanism was deleted in turn and the suite re-run.

## Task Commits

1. **Task 1: a per-walk work bound at both sites, reported on one and thrown on the other** — `a39aed7` (fix)
2. **Task 2: name the declined cycle path, and pin both bounds with cases** — `5a66dc7` (fix)

## WR-01 — the before/after measurement (D-35)

The fixture is a **cross-linked directory DAG with no cycle anywhere**: `d0..dn` are real sibling directories, each holding two forward symlinks (`a`, `b`) to its successor, with one leaf `.md` at `dn`. Every link points forward, so no directory ever repeats on a recursion path — **the ancestor stack correctly answers "no cycle" at every single step**, which is exactly why it cannot be the mechanism that bounds this walk. Distinct relative paths to the leaf nevertheless double per added directory.

All measurements run against the **committed `.js`** on darwin / node v24.12.0.

### The doubling, pre-fix

| Directories (n) | Members | `kit-source.js` wall | `kit-model.js` wall |
|---|---|---|---|
| 8 | 511 | 112 ms | 103 ms |
| 10 | 2,047 | 526 ms | 504 ms |
| 12 | 8,191 | 2,459 ms | 2,392 ms |
| **14** | **32,767** | **11,300 ms** | **12,188 ms** |

### RED → GREEN over the SAME n=14 fixture

```
=== RED (pre-fix, committed .js) — cross-linked DAG, NO cycle, n=14 ===
install/kit-source.js  srcNestedAdapterFiles: members=32767 wall=11300.1ms
scripts/kit-model.js   listAgentAdapters   : members=32767 wall=12187.8ms

=== GREEN (post-fix, committed .js) — SAME fixture ===
install/kit-source.js  srcNestedAdapterFiles: members=3330 wall=1480.0ms cycles=0 overflow={"limit":10000,"at":"d0/a/a/b/b/a/b/a/a/a/a/a/a/b"}
scripts/kit-model.js   listAgentAdapters   : THREW after 1263.0ms -> kit-model: the walk of <...>/.claude/agents examined more than MAX_WALK_ENTRIES=10000 directory entries, reaching <...>/.claude/agents/d0/a/a/b/b/a/b/a/a/a/a/a/a/b — refusing to continue. A symlink DAG with no cycle at all can still expand into exponentially many distinct relative paths, so the per-path cycle answer cannot bound this walk and a separate work bound does. Returning the members collected so far would be a silent truncation, and a truncated scan set passes every downstream guard.
```

**Membership under the bound is untouched** — the same GREEN build over n=8 and n=10 returns 511 and 2,047 members with `overflow=null`, byte-identical to pre-fix.

### The installer half, over the same shape

```
=== RED (pre-fix) — installer over the WR-01 DAG fixture (n=12, no cycle) ===
exit=3 wall=2542ms
verify findings: 8191
== install INCOMPLETE — 8191 item(s) need verification ==
bound named? 0

=== GREEN — same fixture, same throwaway src+target ===
exit=3 wall=1172ms
  verify         .claude/agents/d0/b/b/a/b/a/a/a/a/a/a/b — the nested-adapter walk stopped after
  examining MAX_WALK_ENTRIES=10000 directory entries, so the adapter directory was NOT fully
  examined and anything past that point was neither installed nor refused by name. [...]
== install INCOMPLETE — 3332 item(s) need verification ==
completion banner present? 0
```

## WR-04 — the cycle-report and cycle-throw transcripts (D-36)

Fixture: `.claude/agents/real/x.md` plus `.claude/agents/real/loop -> ..` (the reviewer's reproduction).

```
### PRE-FIX committed .js @760bb6c — MAX_WALK_ENTRIES=(absent) / (absent)
[A] WR-04 cycle fixture: real/x.md + real/loop -> ..
  kit-source srcNestedAdapterFiles: RETURNED ["real/x.md"]
  kit-model  listAgentAdapters    : RETURNED ["real/x.md"]
[B] boundary: exactly 10000 entries   -> RETURNED 10000
[C] boundary: 10001 entries           -> RETURNED 10001

### POST-FIX committed .js — MAX_WALK_ENTRIES=10000 / 10000
[A] WR-04 cycle fixture: real/x.md + real/loop -> ..
  kit-source srcNestedAdapterFiles: RETURNED {"files":["real/x.md"],"cycles":["real/loop"],"overflow":null}
  kit-model  listAgentAdapters    : THREW -> kit-model: symlink cycle at real/loop while walking <dir> — this directory alrea...
[B] boundary: exactly 10000 entries   -> RETURNED 10000        (unchanged — the bound did not narrow membership)
[C] boundary: 10001 entries           -> THREW naming MAX_WALK_ENTRIES=10000 and the directory
```

Installer end-to-end, `cp -R` throwaway source and target:

```
=== RED (pre-fix) ===
  verify   .claude/agents/real/x.md — the adapter directory is FLAT BY CONTRACT [...]
== install INCOMPLETE — 1 item(s) need verification ==
                                        ← `real/loop` appears NOWHERE. Silent.

=== GREEN (post-fix) ===
  verify   .claude/agents/real/x.md — the adapter directory is FLAT BY CONTRACT [...]
  verify   .claude/agents/real/loop — the nested-adapter walk DECLINED TO DESCEND here: this
           directory already appears on its own recursion path, so following it would not
           terminate. Anything below it was therefore neither installed nor refused by name.
           Break the symlink cycle under the adapter directory and re-run.
== install INCOMPLETE — 2 item(s) need verification ==
exit=3, completion banner present? 0
```

## The exact strings plan 27-32's WR-03 equality case must assert against

**Do not guess these — they are observed values.** After D-36 the two sides answer a cycle **differently by design**, so member-set equality is unavailable once one side throws. The equality to assert is **"both name the same relative path and neither is silent."**

Over the fixture `.claude/agents/real/x.md` + `.claude/agents/real/loop -> ..`:

| Side | Channel | Observed value |
|---|---|---|
| `install/kit-source.ts` | `NestedWalkResult.cycles` | `["real/loop"]` (and `files` = `["real/x.md"]`, `overflow` = `null`) |
| `install/install.ts` stdout | `verify` line | `.claude/agents/real/loop — the nested-adapter walk DECLINED TO DESCEND here:` … |
| `scripts/kit-model.ts` | thrown `Error.message` | `kit-model: symlink cycle at real/loop while walking <absolute agents dir> — this directory already appears on its own recursion path, so descending would not terminate. Refusing to return a member set that silently omits everything below it: a short scan set passes every downstream guard exactly the way a vacuous one does.` |

The shared relative path is exactly **`real/loop`**. The authority's message is prefixed `kit-model: symlink cycle at ` and matches `/^kit-model: symlink cycle at real\/loop/`.

Over the CR-03 two-path fixture (`real/x.md` + `alias -> real`, **no cycle**) both sides stay on the member-set equality that already holds: the authority returns `["alias/x.md","real/x.md"]` and the installer refuses both by name. That half of WR-03 is unchanged by this plan.

The overflow marker's shape, for the same reason: `{ limit: 10000, at: "<relative dir>" }` where `at` is `""` for the adapter root itself, and the authority's overflow message matches `/examined more than MAX_WALK_ENTRIES=10000/` and contains the absolute directory.

## Files Created/Modified

- `install/kit-source.ts` / `.js` — `MAX_WALK_ENTRIES`, the `NestedWalkOverflow` / `NestedWalkResult` types, the per-walk budget, the cycle arm's `cycles.push(base)`, and the D-35 / D-36 rationale including the `UNKNOWN - verify` platform-loading premise.
- `scripts/kit-model.ts` / `.js` — `MAX_WALK_ENTRIES`, `walkFilesRelative` split into a budget-owning entry point plus `walkLevel`, the named overflow throw, the named cycle throw, and the D-35 / D-36 rationale recording that D-29's half of this module is amended.
- `install/install.ts` / `.js` — the reshaped call site plus two new reports through the existing single `verify` channel (cycles, then overflow). No new reporting channel was invented.
- `install/install.test.ts` — the `makeSymlinkDag` helper, the cycle-report case, both boundary cases, the DAG case, and a raised `spawnSync` `maxBuffer` (see Deviations).
- `scripts/kit-model.test.ts` — the `makeSymlinkDag` helper, the **amended** cycle case, both boundary cases, and the DAG case.

## Decisions Made

**D-36's amendment was applied at full strength.** The plan flagged in advance that a currently-*passing* kit-model case asserts a symlink cycle "yields the REAL member set", and that closing WR-04 requires that case to become a named throw — with an explicit instruction not to soften the throw in order to keep the old assertion green. The throw was **not** softened: no escape hatch, no opt-out parameter, no "return the members if the caller asks nicely". What the original case was actually pinning is preserved in full — that the **manner** of termination belongs to this module rather than to the host's `ELOOP` or the call stack — which is why both the one-link and two-link shapes are still exercised, why the time bound is still there, and why the amended case additionally asserts the message is *not* `ELOOP` and *not* `Maximum call stack`. The case now also carries a comment naming the reversal explicitly so a later reader does not "restore" it.

**The two mechanisms are asserted to be separate, not just written separately.** The DAG cases assert that the refusal is the **overflow** error and that `cycles` is **empty** over a tree with no cycle. Without that assertion, a future change could collapse the bound back into the cycle answer and every other case would still pass — which is precisely how this walk acquired its first defect.

**Boundary fixtures are sized from the imported constant.** This turned out to be load-bearing in an unexpected way: an early adversarial mutation that raised `MAX_WALK_ENTRIES` to `Number.MAX_SAFE_INTEGER` made the fixtures *unbuildable* rather than making the assertions fail — direct evidence that the fixtures genuinely track the constant instead of a stale literal.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `spawnSync`'s 1 MB default `maxBuffer` killed the installer subprocess in the DAG case**
- **Found during:** Task 2 (the cycle-free DAG installer case)
- **Issue:** The DAG fixture legitimately produces 3,332 by-name refusals before the work bound trips — roughly 1.3 MB of stdout. `spawnSync`'s default `maxBuffer` is 1 MB, and exceeding it **kills the child and reports `status: null`**, an outcome indistinguishable from a crash. The case failed with `expected null to be 3` even though the installer had behaved correctly.
- **Fix:** Raised `maxBuffer` to 64 MB in the shared `runInstallFrom` test helper, with a comment stating that this changes what the *harness* can capture and never what the installer does. No assertion was weakened; the exit code and banner assertions are unchanged.
- **Files modified:** `install/install.test.ts`
- **Verification:** The case now observes `status: 3` and the named bound. All other cases using the helper are unaffected (`1010 passed`).
- **Committed in:** `5a66dc7`

---

**Total deviations:** 1 auto-fixed (1 × Rule 3).
**Impact on plan:** None on scope. A test-harness limit, not a product change.

## Issues Encountered

**The adversarial-mutation check clobbered Task 2's source edits once.** A `trap restore EXIT` wrapper around the mutation run fired when the outer command timed out, running `git checkout --` on `install/kit-source.ts` and `scripts/kit-model.ts` and reverting the (not-yet-committed) D-36 edits. The `.js` twins were rebuilt from the reverted sources, so **`node scripts/freshness.js` reported all 32 outputs fresh over a tree that had silently lost the fix** — a pointed reminder that a freshness gate proves the `.js` matches the `.ts`, never that the `.ts` is correct. Caught by re-grepping for `symlink cycle at` and `cycles.push` (both `0`) rather than by any gate. Both edits were re-applied, and the second mutation round saved copies outside git and restored from those instead of from `git checkout`.

**One unexplained single-test failure in one full-suite run.** One run reported `1 failed | 1009 passed | 2 skipped`; the failing test name was not captured before the output scrolled. **Seven** subsequent full-suite runs were clean at `1010 passed | 2 skipped`. Per-test timing shows the new cases run 2 ms – 2.5 s against 30 s / 60 s / 120 s budgets (12–30× headroom), so they are unlikely to be the source, but this is recorded rather than explained away — it is either a pre-existing flake or something this plan touched, and it has not been proven to be the former.

## Verification Evidence

| Gate | Result |
|---|---|
| `npm run build && node scripts/freshness.js` | exit 0 — **32 committed `.js` fresh** |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1010 passed / 2 skipped / 35 files** (baseline was 1003 / 2 / 35; +7 new cases), 7 consecutive clean runs |
| `node scripts/check-foundation-guards.js` | exit 0 — `ALL CHECKS PASSED` |
| Live kit intact | 17 agent adapters, 7 skill adapters |
| `git diff package.json` | empty — the `{typescript, vitest}` dev-dep fence holds, zero dependencies added |
| `git status --porcelain` | clean apart from this plan's `<files>` (one untracked user-authored `human-notes.txt`, not touched) |
| Destructive probes | every installer probe ran against an `rsync`/`cp -R` throwaway source **and** a throwaway target; the live checkout was never an install target |

### Adversarial mutation results (each mechanism reverted in turn)

| Mutation | Outcome |
|---|---|
| **A** — revert D-36: cycle arm returns silently again (throw deleted, `cycles.push` deleted) | **2 failed** — both new cycle cases RED, as required |
| **B'** — revert D-35: bound enforcement deleted, constant kept | **2 failed** — both one-beyond-bound cases RED; the DAG cases **hang**, which is the WR-01 symptom itself (an unbounded walk stalls the gate rather than failing it) |

## Requirements

**KIT-01 and KIT-02 are deliberately NOT marked complete.** Round-4 verification has not run. The plan's `requirements` field lists them, but this is a gap-closure round and the closure is not the verifier's verdict.

## Next Phase Readiness

Ready for **27-32** (WR-03). The exact reported and thrown cycle path strings are recorded above as observed values so 27-32 asserts against them rather than guessing. The one thing 27-32 must not do is express the WR-03 equality as member-set equality over the cycle fixture — that is now structurally unavailable, and the correct formulation is in the table above.

**Carried forward:**
- `UNKNOWN - verify` (recorded in `install/kit-source.ts`): whether Claude Code loads adapter paths reachable only through a symlink cycle. WR-04 is closed as an honesty fix, which does not depend on it; if the premise is ever verified true, WR-04's severity retroactively rises.
- The unexplained one-off test failure noted under Issues Encountered.

## Known Stubs

None. No hardcoded empty values, placeholder text, or unwired data paths were introduced.

## Threat Flags

None. The plan's four `mitigate` dispositions (T-27-WR01-01, T-27-WR01-02, T-27-WR04-01, T-27-WR01-03) are all implemented and each carries a case; T-27-SC holds with `package.json` byte-unchanged. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary was introduced.

## Self-Check: PASSED

- `install/kit-source.ts`, `install/kit-source.js`, `scripts/kit-model.ts`, `scripts/kit-model.js`, `install/install.ts`, `install/install.js`, `install/install.test.ts`, `scripts/kit-model.test.ts` — all FOUND on disk.
- Commits `a39aed7` and `5a66dc7` — both FOUND in `git log`.
- `grep -c MAX_WALK_ENTRIES`: `kit-source.ts` 6, `kit-source.js` 4, `kit-model.ts` 4, `kit-model.js` 4 — all ≥ 2 as required.
- `grep -c 'UNKNOWN - verify' install/kit-source.ts` = 1 — the platform-loading premise is recorded as pending, not asserted.

---
*Phase: 27-spawn-correctness-kit-set-authority*
*Completed: 2026-08-01*
