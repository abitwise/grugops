---
phase: 27-spawn-correctness-kit-set-authority
plan: 37
subsystem: kit-set-authority
status: complete
tags: [security, set-authority, plugin-manifest, spawn-grant, gap-closure, round-6, KIT-02, D-46, D-47]
requires:
  - scripts/kit-model.ts spawnGrantScan() (the ONE scan composition, unchanged)
  - scripts/kit-model.ts listPluginSkillAdapters() (the named coverer for the `skills` bucket)
  - CLAUDE.md "Format Schemas §1 .claude-plugin/plugin.json (manifest)" (the schema's source document)
provides:
  - scripts/kit-model.ts PLUGIN_MANIFEST_COMPONENT_SCHEMA — 9 derived plugin-root component surfaces
  - scripts/kit-model.ts PLUGIN_MANIFEST_COMPONENT_COUNT — two-sided cardinality pin, value 9
  - scripts/kit-model.ts PLUGIN_COMPONENT_COVERED_ELSEWHERE — `skills`, by listPluginSkillAdapters
  - scripts/kit-model.ts PLUGIN_COMPONENT_EXEMPT — `hooks`, with its reason and its bound
  - scripts/kit-model.ts pluginForbiddenComponentKeys() / pluginForbiddenComponentSubpaths()
  - scripts/kit-model.ts listPluginExemptComponentFiles() — the exempt directory's files + markdown subset
  - scripts/check-foundation-guards.ts the bucket-partition floor in guardKitCounts
  - scripts/check-foundation-guards.test.ts scratchGuard() — a floor-exercising scratch-build harness
affects:
  - guard_wr05's plugin-root component floor and its WR-05 PASS line
  - guard_kit_counts' PASS line and its per-part membership loop
  - every future plugin-root component directory this repository ships
tech-stack:
  added: []
  patterns:
    - "a scan surface DERIVED from a documented schema, counted two-sided, and partitioned exhaustively into forbidden / covered-elsewhere / exempt"
    - "an exemption is its BOUNDS: a by-name member with a recorded reason plus two live assertions on measured numbers"
    - "a disposition line prints MEASURED NUMBERS rather than a coverage claim, so a vacuous assertion is visible"
    - "a floor is proven by a SCRATCH BUILD that mutates the compiled artifact and asserts the mutation applied — not by asserting two constants agree"
key-files:
  created: []
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/kit-model.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
decisions:
  - "D-46 implemented: the hand-listed 2-of-9 literal is DELETED, not extended; the nine surfaces are derived from CLAUDE.md's manifest component-path field enumeration, counted two-sided, and partitioned exhaustively"
  - "D-46 point 2: the forbidden set is COMPUTED as schema minus covered minus exempt and is never written down — one enumeration of component keys survives in kit-model.ts"
  - "D-46 point 3: `hooks/` is a named, reasoned, bounded exemption in the DISTRIBUTION_PAIR_EXEMPT shape, bounded by two live assertions on measured numbers"
  - "D-47 item 1: guardKitCounts' per-part catch REPORTS instead of swallowing; the PASS line needed no wording change because the falsifying state now routes to the failure channel"
  - "The 11-field / 9-directory delta between CLAUDE.md's enumeration and the schema is NAMED in source with its rule, not silently trimmed"
metrics:
  duration_minutes: 40
  completed: 2026-08-04
  tasks: 3
  commits: 3
actuals:
  tokens: 29090
  tasks: 3
  commits: 3
---

# Phase 27 Plan 37: Derived Plugin-Root Component Surface Summary

The plugin-root component surface is now derived from the nine-key manifest schema CLAUDE.md
documents, pinned two-sided at 9, and partitioned exhaustively into seven forbidden directories, one
covered elsewhere by a named function, and `hooks/` exempt by name under two live bounds — closing a
hole in which an identical rogue spawn grant planted at `outputStyles/rogue.md` or `hooks/rogue.md`
printed `ALL CHECKS PASSED` at exit 0 while the same plant at `commands/rogue.md` went red.

## What Was Built

| Task | What | Commit |
|---|---|---|
| 1 (tracer) | The derived schema, its two-sided count, the three buckets, the computed forbidden set, `listPluginExemptComponentFiles`, the rewritten floor, the exemption's two bounds, the measured-number disposition line, the rewritten class-closure comment, and the partition floor in `guardKitCounts` | `4a6aa72` |
| 2 | The replacement of round 5's three literal-bound cases, the cardinality and partition cases as set identities, the fixture cases (absent / empty / nested / unreadable), the exemption cases, the derived-corpus plant suite, and the `scratchGuard()` floor-exercising harness | `3e50117` |
| 3 | `guardKitCounts`' per-part catch reports a thrown lister, with the corrected reasoning recorded and the PASS-line grounding argued at the `pass()` site | `56d681f` |

**Precondition (Task 1).** `git status --porcelain` was **empty** at HEAD `5fa1013`, and the mirrors'
`scripts/check-foundation-guards.js` and `scripts/kit-model.js` were `cmp`-verified byte-identical to
the live committed artifacts before the RED capture. Every plant ran on a throwaway mirror; the live
tree was never planted into.

## The three-mirror plant, RED before and GREEN after

Plant: an identical `rogue.md` written to `<dir>/` on its own `git archive HEAD` mirror, carrying
`name: rogue` / `description: planted component` / `allowed-tools: Read, Agent(grugops-orchestrator)`.
The gate was run from each mirror with `CHECK_ROOT` pointed at it.

| plant | RED exit | RED banner | RED `rogue` mentions | GREEN exit | GREEN banner | GREEN `rogue` mentions |
|---|---|---|---|---|---|---|
| `commands/rogue.md` | 1 | `1 CHECK(S) FAILED` | 1 | 1 | `1 CHECK(S) FAILED` | 1 |
| **`outputStyles/rogue.md`** | **0** | **`ALL CHECKS PASSED`** | **0** | 1 | `1 CHECK(S) FAILED` | 1 |
| **`hooks/rogue.md`** | **0** | **`ALL CHECKS PASSED`** | **0** | 1 | `1 CHECK(S) FAILED` | **2** |

Two of the three surfaces the platform loads for every `/plugin install` user were outside every scan
set in this repository, and the gate said so by saying nothing.

### The GREEN findings, verbatim

```
1 file(s) under the plugin-root component directory `outputStyles/` sit OUTSIDE the spawn-grant
scan: outputStyles/rogue.md. The plugin manifest declares no component-path override and the
marketplace entry sources the repository root, so Claude Code's default discovery LOADS this
directory for every plugin-install user — a granted file here is live on a real machine while no
guard can see it. Either the directory stays absent, or its contents enter the scan
```

`hooks/rogue.md` is named **twice**, by both bounds, stating two different facts:

```
1 markdown (frontmatter-bearing) file(s) under the EXEMPT plugin-root component directory `hooks/`
sit OUTSIDE the spawn-grant scan: hooks/rogue.md. The exemption forgoes ONLY the "must be absent"
rule; it never admits a loadable adapter surface no guard reads. …

the EXEMPT plugin-root component directory `hooks/` carries 1 markdown adapter(s): hooks/rogue.md.
Zero markdown adapters is the bound that makes this exemption fail closed — the directory is
exempted because it holds the mechanical prod-deploy guard, NOT because it may hold adapters. …
```

### The fourth mirror — the exemption is BOUNDED, not absent

| plant | exit | banner | `rogue` mentions | disposition printed |
|---|---|---|---|---|
| `hooks/rogue.js` (non-markdown) | **0** | `ALL CHECKS PASSED` | 0 | `hooks/ EXEMPT-BY-NAME, PRESENT with 8 file(s) and 0 markdown adapter(s), 0 of those inside the spawn-grant scan` |

If any plant in `hooks/` went red the directory would be forbidden in effect, and the CLAUDE.md-
mandated prod-deploy guard could not live there. The exemption exempts exactly what it says it
exempts, and the disposition line reports the file count that moved from 7 to 8.

## The two-sided cardinality, demonstrated by scratch build

Each run mutates a temp copy of the compiled `scripts/kit-model.js` and runs that scratch guard
against a hermetic mirror. The harness **asserts the mutation applied** before running — a `replace`
that matched nothing would leave an unmutated build "proving" a floor it never exercised.

| scratch mutation | exit | finding |
|---|---|---|
| one schema entry **removed** (`lspServers`) | **1** | `the plugin-manifest component schema carries 8 entries, expected exactly 9 (derived: agents, commands, skills, hooks, mcpServers, outputStyles, experimental.themes, experimental.monitors)` |
| one schema entry **added** (`scratchTenth`) | **1** | `the plugin-manifest component schema carries 10 entries, expected exactly 9 (derived: …, lspServers, scratchTenth, outputStyles, …)` |

## The partition, demonstrated by scratch build in both violation directions

| scratch mutation | exit | finding |
|---|---|---|
| `skills` added to `PLUGIN_COMPONENT_EXEMPT` (claimed by **two** buckets) | **1** (2 checks failed) | `three buckets do not PARTITION it — unclaimed by any bucket [], claimed by more than one [skills], claimed but outside the schema []` |
| `outputStyles` filtered out of the computed forbidden set (claimed by **no** bucket) | **1** | `three buckets do not PARTITION it — unclaimed by any bucket [outputStyles], claimed by more than one [], claimed but outside the schema []` |

The double-claim case fails **two** checks, not one: naming `skills` as exempt also makes
`listPluginExemptComponentFiles` probe `skills/`, whose seven `SKILL.md` files trip the
zero-markdown-adapters bound. That cascade is correct and is recorded rather than trimmed.

The partition is asserted as **set membership**, never as three counts summing to nine — a count
identity passes while one member is claimed twice and another not at all, which is the same
within-part substitution the composition's per-part SET equality exists to catch, one level up.

## The live tree, measured

```
plugin-default component directories: agents/ ABSENT, commands/ ABSENT,
experimental/monitors/ ABSENT, experimental/themes/ ABSENT, lspServers/ ABSENT,
mcpServers/ ABSENT, monitors/ ABSENT, outputStyles/ ABSENT, themes/ ABSENT,
hooks/ EXEMPT-BY-NAME, PRESENT with 7 file(s) and 0 markdown adapter(s),
0 of those inside the spawn-grant scan

the plugin-manifest component schema carries 9 entries partitioned into 7 forbidden
+ 1 covered-elsewhere (skills by listPluginSkillAdapters) + 1 exempt by name (hooks)
```

| Measurement | Value |
|---|---|
| Schema entries | **9** (7 forbidden keys + `skills` + `hooks`) |
| Forbidden probe **directories** | **9** (7 keys; both `experimental.` keys carry two candidate spellings) |
| Forbidden directories PRESENT on the live tree | **0** |
| `hooks/` files / markdown adapters | **7 / 0** |
| Literal enumerations of component keys in `kit-model.ts` | **1** (`grep -n 'manifestKey: "'` → 9 schema lines + the 2 bucket claims; the forbidden set is never written down) |
| `PLUGIN_DEFAULT_COMPONENT_SUBPATHS` occurrences | **0** in both source files — replaced, not extended |
| Kit intact | 17 agent adapters, 7 standalone skills, 7 plugin skills, `SPAWN_GRANT_SCAN` = **33** |

## The 11-vs-9 delta, named rather than trimmed

CLAUDE.md's component-path field enumeration lists **eleven** fields. The schema carries **nine**.
Writing nine of an eleven-item list down without its rule is precisely the shape this plan deletes, so
the delta is recorded in source: `userConfig` declares a configuration **schema** and `dependencies`
declares a dependency **list**; neither names a directory of loadable component files, so neither has
a plugin-root surface to probe. Every remaining field does.

**One manifest nuance recorded, not glossed.** `.claude-plugin/plugin.json` DOES carry an
`mcpServers` key — but as an **inline server map** (`{"grugops": {"command": "node", "args": […]}}`),
not as a path string overriding default discovery. The plan's premise ("declares no component-path
override") therefore holds, and `mcpServers/` is still probed, because probing an absent directory
costs nothing while missing a loaded one is the defect class. This is written into the schema block's
header so a later reader does not mistake the inline key for an override.

## Task 3 — the throwing per-part lister, RED and GREEN

**Route used, and why.** The real condition is a TOCTOU window: the spawn-grant composition derives
cleanly at **module load** (`SPAWN_SCAN_DERIVATION`, near the top of the file) and a part's directory
becomes unreadable before the per-part loop reads it again **inside the guard**. That window is the
only one in which the catch can fire — and it cannot be produced deterministically from outside a
single synchronous child process, because reproducing it would mean unlinking a directory at an
instant between two statements of a process this harness only spawns.

So the **equivalent state was produced with a stub part**, exactly as the plan licenses: a
`stub-throwing` entry spliced into a scratch copy of the compiled `kit-model.js`, whose lister throws
and whose prefix matches nothing — so the composition, its cardinality and every real part's
membership are untouched, and the **only** thing the stub changes is that one lister throws inside the
loop.

A first attempt combined the throwing stub with a mismatching one; that run exited 1 on the mismatch,
so the PASS line never printed and the RED criterion could not be read. The two were separated into
`RED-A` (throwing stub alone) and a GREEN continuation case. Recorded because the first shape would
have looked like a RED transcript while proving nothing about the swallow.

| run | build | exit | banner | finding for the skipped part | `each part set-equal to its own lister` |
|---|---|---|---|---|---|
| **RED-A** | committed `.js` at `3e50117` + throwing stub | **0** | **`ALL CHECKS PASSED`** | **none** | **PRINTED** |
| GREEN-A | rebuilt committed `.js` + throwing stub | 1 | `1 CHECK(S) FAILED` | named, with the thrown message | **ABSENT** |
| GREEN-B | rebuilt + throwing stub FIRST, mismatching stub AFTER | 1 | `1 CHECK(S) FAILED` | **both** parts reported in one run | ABSENT |
| GREEN-C | rebuilt, all four real listers healthy | 0 | `ALL CHECKS PASSED` | none | PRINTED |

**The sharpest detail in RED-A:** the committed build printed the skipped part in its own breakdown as
`stub-throwing 0` and then asserted `each part set-equal to its own lister` about it. The claim named
the part it had not checked.

GREEN-A's finding:

```
kit count: the spawn-grant scan composition's stub-throwing part could not be re-derived for the
per-part membership check — kit-model: cannot read kit directory /scratch/stub-throwing. This
part's SET EQUALITY WAS NOT PERFORMED, and it must not be reported as if it were: the composition
derives at module load and this read happens later inside the guard, so the composition may have
derived cleanly before this directory became unreadable. That is a DIFFERENT fact from the
cardinality floor above, which reports a SHORT composition rather than a skipped check
```

### The PASS line's wording — what changed, and what did not

**Nothing changed in the wording, and that is the finding.** The clause `each part set-equal to its
own lister` was never *false*; it was **ungrounded**. The only state that could falsify it — a part
whose lister threw, so its equality was never performed — used to be swallowed, leaving `countFail`
empty so the PASS line printed and claimed the skipped check. The catch now appends to `countFail`,
which makes the PASS branch **unreachable** in exactly that state. The claim is therefore true by
construction rather than by hope, and the fix is **structural** (the falsifying state routes to the
failure channel) rather than a hedge in the wording. That reasoning is recorded at the `pass()` site,
because a wording left unchanged carries no evidence that it was examined.

The catch's replaced comment states the corrected reasoning — two independent filesystem reads
separated in time, the module-load derivation versus the in-guard read — and does not restate the
premise that was false for the reachable case.

## What the tests now pin, and what they stopped pinning

**Replaced, not kept beside.** Round 5's three cases were built over the two-element literal being
deleted, including a live-tree case asserting "both plugin-default component directories are absent".
Its problem was never that it was wrong; it was **tautological over the thing under test**, so it
could only ever confirm the literal and never the class the floor's comment claimed to close. A
reviewer now finds **one** live-tree disposition case, built over the derived set, asserting the real
rule: a forbidden directory is legal when it is ABSENT, or when every file in it is already inside the
spawn-grant scan.

**The plant corpus is DERIVED.** `it.each(pluginForbiddenComponentSubpaths())` plants into all nine
forbidden directories; round 5 planted into exactly one. A hand-listed test corpus over a derived
production set is the same drift class with the sides swapped — the set would rot in the test file
instead of the source file, and stay just as green while it did. A companion case asserts the corpus's
cardinality so an `it.each` over a shrunken set cannot pass vacuously.

**The schema keys are read INDEPENDENTLY.** The case writes the nine keys out from CLAUDE.md's field
enumeration rather than mapping over the schema — a corpus derived from the thing under test confirms
only that the thing exists.

**The unreadable-directory case has two routes.** The deterministic one plants a **file where a
directory belongs** (works on every host and in every privilege context). The `chmod 000` route runs
too but **skips with its reason recorded** when the host does not honour it, rather than asserting
over a precondition it failed to create.

**The exemption's live case carries its measured count in the message** (`hooks/ holds 7 file(s): …`),
so a shrunken directory fails the case instead of quietly making the zero-markdown assertion easier to
satisfy.

## Verification

| Check | Result |
|---|---|
| `npm run build && npm run freshness` | exit 0 — **32 committed `.js` fresh** against a temp rebuild |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1104 passed / 2 skipped**, 35 files (baseline 1074/2 — +30 new cases, 0 failures) |
| `node scripts/check-foundation-guards.js` | exit 0, `ALL CHECKS PASSED` |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `git diff package.json` | **empty** — zero package-manager install tasks, dev-dependency fence unchanged |
| `.tmp-build/` | removed after every freshness run |
| Live tree | clean apart from this plan's `files_modified` and `.planning/` |

**The suite being green is not offered as evidence of anything.** It has been green in every round of
this phase in which a defect was later found. Every closure claim above rests on a transcript that was
RED against the committed `.js` before the edit, or on a measured count.

## IN-01 — CLOSED as a side effect, and the reason is specific

Round 5's IN-01 named the WR-05 disposition string **built before the check that can falsify it**: the
line pushed `PRESENT with N file(s), all in the spawn-grant scan` and only afterwards ran the
`unscanned.length > 0` test that could contradict it. The rewrite prints
`PRESENT with N file(s), M inside the spawn-grant scan` where `M = N - unscanned.length` — the claim
and its evidence are now **the same computation**, so there is no window in which the string can
outrun the check. IN-01 is **closed**, not merely relocated. The exempt-directory disposition added by
this plan is written in the same shape (measured counts, including zeros), so the pattern did not
re-enter through the new code.

## IN-03 — still LIVE, recorded rather than silently fixed

`guardKitCounts` asserts per-part SET equality and reports each part's count in the breakdown, but it
still never asserts that the four parts **EXHAUST** the composition. A member sitting under no part
prefix would be invisible to the guard. It is pinned only over a **fixture** in
`kit-model.test.ts` ("PER-PART membership is SET equality…"), which is not the same as the guard
asserting it over the live tree.

The plan's scope table names only the catch-swallow for D-47, and explicitly forbids expanding scope
here. So it was **not** fixed. It is recorded in this summary and filed to the broken-windows ledger
as entry **#4** (`deviation`, `scripts/check-foundation-guards.ts`) so it survives past this context.

IN-02, WR-03 and WR-04 were out of scope per the plan's table and were not touched.

## Deviations from Plan

**None affecting scope or behaviour.** Four recorded judgements:

1. **[Task 1, in-plan file] One `kit-model.test.ts` case adapted during Task 1.** The round-5 case
   `reports ABSENT … and PRESENT-but-empty …` used `toEqual([{agents…},{commands…}])`, which pinned
   the deleted two-element literal exactly. Task 1's `<files>` does not list the test file, but Task
   1's `<verify>` runs it, so leaving it red would have made the verification dishonest. It was
   minimally adapted in the Task 1 commit (find-by-subpath instead of whole-array equality) and
   **replaced wholesale** in Task 2. `kit-model.test.ts` is inside the plan's `files_modified`; no file
   outside it was touched.
2. **[Task 2] The pre-existing WR-01 false-red control was given an explicit 60s timeout.** That case
   builds seven mirrors and spawns the compiled guard seven times — ~3.1s on an idle host, and it went
   over vitest's 5s default once this plan's nine derived-corpus plant cases had churned the
   filesystem ahead of it. Measured both ways (timed out in the full-file run, passed at 3.09s in
   isolation). **No assertion changed.** A wall-clock flake in a control that asserts "no false red"
   is the worst place to leave a coin flip: it reads as a real finding. The reason is recorded in the
   case.
3. **[Task 1, addition] The 11-vs-9 field delta and the inline-`mcpServers` nuance are written into
   source.** The plan names the nine keys; CLAUDE.md's enumeration has eleven entries, and
   `plugin.json` does carry an `mcpServers` key. Recording both with their rules was necessary because
   listing nine of eleven without a stated rule is the exact "omission from a list" shape the plan's
   own prohibitions forbid.
4. **[Task 3, method] The RED transcript was split.** A first attempt combined the throwing stub with
   a mismatching stub; the mismatch turned the run red so the PASS line never printed and the RED
   criterion (`the claim is still printed`) could not be read. The two were separated. Recorded
   because the combined shape would have looked like a valid RED transcript while proving nothing
   about the swallow.

## Backstop Truths — status

All three of the plan's `UNKNOWN - verify` items remain **unresolved** and are recorded in source
rather than guessed at:

1. **The default-discovery directory name for `experimental.themes` / `experimental.monitors`** —
   still unknown. Both spellings are probed (`themes/` and `experimental/themes/`, `monitors/` and
   `experimental/monitors/`), and the reason is written beside them: probing an absent directory costs
   nothing while missing a loaded one is the defect class. A case pins both spellings.
2. **The completeness of the nine against the PLATFORM, not against CLAUDE.md** — still unknown, and
   it is a genuine residual of D-46's shape. The schema is derived from a document this repository
   maintains, and a document can lag a platform. A tenth component directory added platform-side is
   outside the schema, and `PLUGIN_MANIFEST_COMPONENT_COUNT` cannot detect it — the count fires only
   when THIS repository's list changes. Recorded in the schema header **and** in the guard's rewritten
   floor comment rather than claimed away.
3. **Whether an `outputStyles/*.md` `allowed-tools` value is honoured as a tool grant** — still
   unknown, and the finding does not rest on it. The probe's stated contract is "would the platform
   load something we do not scan", and it deliberately returns **every** file regardless of extension
   for exactly that reason.

## Accepted Debt, named

`PLUGIN_COMPONENT_EXEMPT` is a **by-name** list sitting beside a derived schema, not itself derived
from it — deliberately, because no rule in the manifest schema distinguishes a legitimately-shipped
component directory from a rogue one. It has **one** member. What would force a later promote to a
derived predicate is written into the source: a **second** directory needing exemption (two hand-listed
members is a list, and this repository's own record says a hand-maintained list rots), or `hooks/`
legitimately gaining a markdown adapter, at which point "zero markdown adapters" stops being the bound
that fails closed. A case asserts the exemption holds exactly one member, so a second one cannot arrive
quietly.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary was
introduced. Every probe path is a fixed literal joined onto a supplied root — a case asserts none is
absolute, none begins with `..` or `~`, and none contains a `/..` segment — so the ASVS V12 posture is
unchanged. `package.json` is byte-unchanged, so no package-legitimacy checkpoint was reachable.

Threat register dispositions implemented: **T-27-R6-08** (derived schema, two-sided count, exhaustive
partition, plant case per forbidden directory), **T-27-R6-09** (`hooks/` bounded by two live
assertions), **T-27-R6-10** (present forbidden directory legal only when fully scanned, unscanned
files named), **T-27-R6-11** (the class-closure comment rewritten to state only what is asserted, with
the platform-addition residual recorded), **T-27-R6-12** (thrown lister populates the failure channel).
T-27-R6-13 and T-27-R6-14 were dispositioned `accept` and were not changed.

## Known Stubs

None. `grep -nE "TODO|FIXME|placeholder|coming soon|not available|\.skip\(|\.todo\("` over all four
changed source files returns zero matches. No test is skipped by this plan; the suite's 2 pre-existing
skips are untouched and unrelated. The one `chmod`-based case contains a **runtime** skip-with-reason
branch that is not taken on this host — it is an honest precondition guard, not a `.skip()`.

## Requirements — deliberately NOT marked complete

The plan carries `requirements: [KIT-02]`, and `REQUIREMENTS.md` still shows it as **Gaps Found** for
Phase 27. It was **not** checked off, for the same reasons `27-36` recorded: round-6 closure is the
verifier's call across all three plans (27-36, 27-37, 27-38), and this plan's own prohibitions forbid
offering a green suite as evidence of closure. The evidence needed to close KIT-02 is in this summary;
the disposition is left to round-6 verification.

## Actuals — both scales reported

The plan estimated **82,000** tokens. Two measurements, reported side by side rather than picked to
flatter the estimate:

| Scale | Value |
|---|---|
| chars/4 over the **realized diff** (`git diff 4a6aa72~1..HEAD -- scripts/`, 116,361 chars) | **29,090** |
| chars/4 over the **full changed files** (635,619 chars across all six) | **158,904** |

`actuals.tokens` records the diff-based figure (29,090), per the executor contract's "over the
realized diff" rule. The full-file figure is recorded here so a later calibration is not misled about
which scale was used.

## Self-Check: PASSED

- `scripts/kit-model.ts` — FOUND
- `scripts/kit-model.js` — FOUND
- `scripts/kit-model.test.ts` — FOUND
- `scripts/check-foundation-guards.ts` — FOUND
- `scripts/check-foundation-guards.js` — FOUND
- `scripts/check-foundation-guards.test.ts` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-37-SUMMARY.md` — FOUND
- commit `4a6aa72` — FOUND
- commit `3e50117` — FOUND
- commit `56d681f` — FOUND
