---
phase: 27-spawn-correctness-kit-set-authority
plan: 56
subsystem: frontmatter-authority
tags: [spawn-correctness, kit-03, spawn-04, yaml, safety-invariant, gap-closure-round-11]
status: complete
requires:
  - "scripts/frontmatter.ts — D-57's three-position block-scalar header recognition (27-52)"
  - "scripts/frontmatter.ts — D-59's region-scoped quoting exemption (27-55)"
  - "scripts/check-foundation-guards.ts — guard_wr05 / guard_referential_integrity"
provides:
  - "blockMapImplicitEntry — the nested block-mapping entry production (D-60)"
  - "BLOCK_INDICATOR, exported, so the indicator axis is derived rather than transcribed"
  - "the nested key-spelling x indicator form x position axis (624 cells + 28 union cells)"
  - "ledger family G3 and the corresponding AXIS_KEY_LINE_BASE member"
affects:
  - "every guard that reads a frontmatter grant verdict"
tech-stack:
  added: []
  patterns:
    - "a borrowed constant is a duplicate wearing a single definition site — when a predicate is called from two places, ask whether both are asking the same question of the same grammar production"
    - "an axis DERIVED by filtering candidates through the real constant, with liveness proven by re-filtering through a deliberately narrowed copy"
    - "a mutation control needs its own control — an unmutated scratch copy isolates failures caused by the copy rather than by the mutation"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "D-60 — the header recogniser's implicit-key introduction gets its own production derived from YAML's mapping-value rule; KEY_LINE loses its second job rather than gaining a wider alphabet"
  - "The key ends at the FIRST colon carrying a separation; a quoted key ends at its own closing quote. LAST was REJECTED on two loader-REJECTED rows"
  - "The declared encoding unit is the UTF-16 code unit, and the production compares no key to a set and measures no key against a bound, so the unit cannot move a boundary"
  - "The expressibility floor was allowed to go RED by name before the corpus member was added, rather than adding both together silently"
metrics:
  duration: "~50 min"
  completed: "2026-08-10"
  tasks: 2
  commits: 2
actuals:
  tokens: 25965
  tasks: 2
  commits: 2
---

# Phase 27 Plan 56: The Nested Mapping Key's Own Production Summary

`blockHeaderAt` asked `KEY_LINE` — the narrow **top-level** key grammar — for the **nested**
`key: <header>` spelling, silently transferring an intended top-level refusal to a position where
YAML allows any scalar; the nested question now has its own production and `KEY_LINE` keeps its first
job alone.

## The finding, and what closed it

**CR-03 is neither a condition bug (D-54) nor a position bug (D-57). It is one grammar doing two
jobs** — the weaker-duplicate shape wearing a single definition site, which is worse than a visible
copy because a copy drifts loudly while a borrowing transfers somebody else's narrowness in silence.
The module's own comment said the recogniser "CALLS the one constant rather than restating it …
nothing here decides what a header LOOKS like". That was true of the *indicator* and false of the
*position*: choosing the top-level key charset **is** a decision about which nested keys can carry a
header.

Measured on the wave-1 committed build `ac6653c`, loader column `/usr/bin/ruby -ryaml`
(ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1). Each row is `tools:` / `<header line>` / `    Read,` /
`    # x, Agent(grugops-orchestrator)`:

| Row | header line | module (pre-fix) | loader |
|---|---|---|---|
| V1 quoted | `  "a b": >-` | `{"ok":true,"value":false}` | `{"tools"=>{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V2 dotted | `  a.b: >-` | `{"ok":true,"value":false}` | `{"tools"=>{"a.b"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V3 digit-leading | `  1a: >-` | `{"ok":true,"value":false}` | `{"tools"=>{"1a"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V4 space-containing | `  a b: >-` | `{"ok":true,"value":false}` | `{"tools"=>{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V5a single-quoted | `  'a b': >-` | `{"ok":true,"value":false}` | `{"tools"=>{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V5b colon in quotes | `  "a: b": >-` | `{"ok":true,"value":false}` | `{"tools"=>{"a: b"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V6a multi-byte | `  été: >-` (9 code units / 11 bytes) | `{"ok":true,"value":false}` | `{"tools"=>{"été"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| V6b combining mark | `  été: >-` (11 code units / 13 bytes) | `{"ok":true,"value":false}` | `{"tools"=>{"été"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| C1 bare nested key | `  nested: >-` | `{"ok":true,"value":true}` | grants — already closed by D-57 |
| C2 top-level `1bad: value` | — | `{"ok":false,"reason":"cannot read \`1bad: value\` …"}` | `{"1bad"=>"value"}` |
| C3 `description: see` / `  foo: >-` | — | `{"ok":true,"value":false}`, value `see foo: Read, # x, Agent(…)` | **REJECT** *mapping values are not allowed in this context* |

**Eight live silent no-grants.** Post-fix, V1–V6b all return the grant arm and `grantedAgentNames`
returns exactly `["grugops-orchestrator"]` for each. **C1, C2 and C3 are byte-identical**, including
C2's reason string.

*One plan wording corrected rather than repeated:* the plan calls C3 a document "the loader reads as
one scalar". Measured, libyaml **REJECTS** it. The row libyaml really reads as one scalar is
`tools: see` / `  >-` → `"see >- q,"`, which is the true one-scalar control and is asserted separately
as position-gate row g7.

## The production, and the key-end disposition (D-60)

YAML's implicit key is a scalar and a scalar **delimits itself**. A *plain* key cannot contain `:`
followed by a separation, so it ends at the first such colon; a *quoted* key is a JSON-like key that
ends at its own closing quote, after which optional separation may precede the indicator.

**CHOSEN: FIRST. REJECTED: LAST** — adjudicated against the loader rather than argued. `tools:` /
`  a: b: >-` and `tools:` / `  a b: c: >-` are documents libyaml **REJECTS** ("mapping values are not
allowed in this context"), which is exactly what FIRST predicts and LAST does not; LAST would read
mapping structure into a document no loader accepts. FIRST is also the direction that removes no bytes
from any value.

Measured alongside: a colon **not** followed by a separation is ordinary key text (`a:b: >-` loads
under `a:b`), so the test is on the separation and never on the colon alone; and an **unterminated**
quote closes nothing, so no header is introduced — byte-unchanged for `'a b: >-`, which libyaml
rejects outright.

**The encoding unit is stated at the site: the UTF-16 code unit.** The production compares no key to
a set and measures no key against a bound — the key is sliced out and carried verbatim — so the only
thing the unit could affect is where a boundary falls, and it cannot: every delimiter scanned for is
ASCII, and no UTF-16 code unit of any non-ASCII character can equal one. Pinned by V6a/V6b, which
differ in **both** code units and bytes for the same rendered key and produce the same verdict.

**What did NOT move.** `KEY_LINE` is byte-unchanged with exactly one definition site and one code use
(the baseline key line); `awk '/^function blockHeaderAt/,/^}/' … | grep -c 'KEY_LINE'` prints **0**.
`BLOCK_INDICATOR`'s pattern is byte-unchanged (only its `export` is new). The
`mappingValueIndicator` position gate is byte-unchanged and **all eight** of its measured loader rows
keep their recorded verdicts, including the two the loader reads as CONTENT.

## Evidence

Every transcript is recorded verbatim in `deferred-items.md` § **From 27-56**. The short form:

| Evidence | Result |
|---|---|
| RED/GREEN V-row table with the loader column | **8** of 11 rows moved, all from the silent no-grant arm to the grant arm with the correct name set; **3** byte-identical, including C2's reason string |
| Key-end adjudication, 12 rows | FIRST agrees with the loader everywhere the loader has a value; LAST is contradicted by two loader-REJECTED rows |
| The eight `mappingValueIndicator` position-gate rows, re-run | all **8** keep their recorded verdicts |
| Gate plant, `a b: >-` in the EXISTING `allowed-tools:` key of BOTH twins of the non-coordinator `plan` skill | pre-fix **exit 0** (`ALL CHECKS PASSED` over a live grant) → post-fix **exit 1** (`1 CHECK(S) FAILED`) |
| Twins named, counted over the FAILURE block only | **2** |
| False-red controls (unplanted mirror pre-fix, unplanted mirror post-fix, real tree post-fix) | **exit 0** on all three |
| Repository-wide value map over `git ls-files '*.md'` | **1171** files, **0** moved, **0** new refusals, **0** lifted |
| Derived axis, post-fix | 8 × 26 × 3 = **624** cells + **28** union cells; **0** loader-rejected (printed); both never-exemptible partitions **EMPTY**; loud arm **14**; name-set disagreements **0** |
| Non-circularity, identical corpus (digest `4c50004dedcc7e81`) against pre-fix mirror `ac6653c` | **560 of 652** silent-no-grant; **0** post-fix |
| Mutation control (nested production reverted alone, **rebuilt**) | **6** cases red, attributable after subtracting the 9 `git`-dependent baseline failures |
| Expressibility floor | ledger families **11 → 12**, expressible **8 → 9**; `AXIS_KEY_LINE_BASE` **22 → 23** |
| Exemption list length, before and after | **2 → 2**, asserted |
| `npm run freshness`, `npx tsc --noEmit`, `check-foundation-guards`, `adapters-freshness`, `coordinator-resolution-precheck`, `context-freshness` | all **exit 0** |

**The regression suite is a FLOOR, not the closure evidence.**
`npx vitest run --exclude '**/scripts/e2e/**'` reports **1312 passed | 2 skipped | 0 failed**. A green
suite proves nothing about a safety invariant; the closure evidence is the gate plant, the
560-of-652 non-circularity result, the mutation control with its own control, and the two adversarial
passes.

## Three things this plan measured that it could have assumed

**1. The mutation control needed its own control, and the naive number was more than double.** The
mutated scratch copy reported **15** red cases. An unmutated scratch copy of the same tree reported
**9** — all of them cases that read `git ls-files` or `git archive`, red because the copy has no
`.git`. The mutation is attributable for **6**. Reporting 15 would have overstated the control by
more than double; it was available to report and was measured away instead.

**2. The harness premise, asserted before the control was believed.** vitest resolves the test file's
`./frontmatter.js` import to the **committed `.js`**, so a mutation applied only to the `.ts` mutates
nothing the suite can see. The mutated build was probed directly and confirmed to return
`{"ok":true,"value":false}` for V1–V4 **before** the suite was run. This is the eighth instance of
that lesson in this phase and the second consecutive plan to pay it forward rather than pay for it.

**3. This repository's vitest intercepts console output, so every "PRINTED, never silent" skip in
this file is invisible on a default run.** Measured: the pre-existing D-52 corpus dump and the WR-01
floor's summary line both produce **zero** lines without `--disableConsoleIntercept`. The prints are
real and reappear with the flag. The D-60 corpus dump added by this plan therefore writes to a
**caller-named file** rather than to stdout, so a dump that cannot be seen cannot be mistaken for a
dump that happened. The existing console-based skips are left alone (out of scope) and the fact is in
the ledger so the next round does not read "PRINTED" as "visible".

## What the adversarial passes found

**Pass (a) — which set does the production ENUMERATE, and at which positions is it asked?** The
positions were enumerated from the code rather than remembered: `blockHeaderAt` is called at exactly
**two** sites (the block-sequence item path and the continuation path); the third header position, the
top-level key line, asks `BLOCK_INDICATOR` directly and its key is `KEY_LINE`'s by contract, so the
nested production is correctly not asked there. Seven probes — depth 1, two levels down, after a
sibling key, after another block scalar's content, inside a sequence item's compact mapping, inside a
compact nested sequence, and inside a flow collection (which must **not** be recognised, and is not).
**Pass (a) found nothing new** and is recorded with its question and its shapes anyway.

**Pass (b) — what is the production's INPUT assembled from?** Ten probes walking one line from the
raw block through `raw.trim()`, `indentOf`, `SEQ_ITEM`'s dash consumption and the deliberate ordering
against `stripComment`. **It found one real fact and it is recorded as OPEN rather than closed:**
`raw.trim()` uses `String.prototype.trim`'s alphabet (Unicode WhiteSpace ∪ LineTerminator), which is
**wider than this module's own declared `[ \t]` class`. Two measured consequences — a leading NBSP is
stripped from the key so the module's flattened key text differs from the loader's by one character on
a document the loader accepts, and a trailing NBSP/ZWNBSP after the indicator makes the module see a
clean indicator on documents the loader rejects.

**It is not this plan's defect and not a new one.** `raw.trim()` is byte-unchanged and fed `KEY_LINE`
identically before D-60 — measured: the NBSP row's *pre-fix* flattened value already has the NBSP
gone. Neither consequence is in the silent-no-grant direction. It is carried with a named owner rather
than closed here, because closing it means deciding whether the continuation path should use the
module's declared class and re-taking the repository-wide value map, which is a change of its own.

## Deviations from Plan

**1. [Rule 3 — Blocking] The expressibility-floor corpus member moved from Task 2 into Task 1.**
- **Found during:** Task 1, immediately after the D-60 ledger entry landed.
- **Issue:** the plan assigns the ledger entry to Task 1's artifacts and the floor's corpus member to
  Task 2. The floor's whole mechanism is that a ledger family row with no corpus shape fails **by
  name** — so the moment the row landed, `WR-01 the expressibility floor` went red, and Task 1's own
  `<verify>` (`npx vitest run scripts/frontmatter.test.ts`) could not pass.
- **Fix:** the `AXIS_KEY_LINE_BASE` member, its two cardinality literals and the `EXPRESSED_BY` entry
  were added in Task 1 rather than Task 2. Task 2 still states the floor's before/after cardinality,
  measured by running it.
- **Why this is not a deviation from intent:** the alternative was committing a red suite. The 27-52
  precedent (which added its members in task 2 of the same plan) is followed in substance — the
  corpus grows **with** the fix — and the floor's red-by-name behaviour is recorded rather than
  hidden, which is the fact the mechanism exists to produce.
- **Commit:** `0131600`

**2. [Rule 2 — Missing critical functionality] `BLOCK_INDICATOR` is exported.**
- **Found during:** Task 2.
- **Issue:** the plan requires the indicator axis to be *derived from the block indicator constant so
  a change to the constant changes the axis length*. The constant was module-private, so an axis
  written beside it would have been a transcription — the exact set-literal drift class the plan
  forbids.
- **Fix:** exported on `SEQ_ITEM`'s own recorded argument ("so the case cites this constant rather
  than a copy of it"), and the axis is built by **filtering** candidate spellings through it. Liveness
  is proven by re-filtering the identical candidate set through a deliberately narrowed copy and
  asserting the axis gets strictly shorter.
- **Commit:** `d382ca2`

**3. [Rule 1 — Bug] The D-59 flush comment's claim was false after this change and is corrected.**
- **Found during:** Task 1.
- **Issue:** D-59's comment states that routing the block header's `key:` introduction through
  `unquoteChecked` is "a NO-OP TODAY BY GRAMMAR RATHER THAN BY LUCK", reasoning from `KEY_LINE`'s
  alphabet. A nested key may now be quoted, so it is no longer a no-op — `tools:` / `  "a\x41b": >-`
  reaches that call and refuses.
- **Fix:** the comment is rewritten at the site to record that the alphabet moved one round after
  D-59 predicted it might, which is exactly why the check was kept. A case pins the refusal.
- **Commit:** `0131600`

**4. [Process] The tracer feedback gate was satisfied by re-running the automation rather than by
emitting a checkpoint.** `27-56` declares `autonomous: true` and carries no `checkpoint:*` task; Task
1's `<verify>` is four `<automated>` entries, all re-run end-to-end and green before Task 2 began. The
checkpoint protocol states that users never run CLI commands, so a `checkpoint:human-verify` whose
entire content is four CLI commands would violate the protocol it is issued under. Recorded here so
the choice is visible rather than silent. (Same disposition as `27-55`.)

**5. [Housekeeping] `MODULE_SYMBOLS` gained four entries** — `blockMapImplicitEntry`,
`closingQuoteIndex`, `MAPPING_VALUE_INDICATOR` and `BLOCK_INDICATOR`. `KEY_LINE` stays: it still
exists and still owns the baseline key line. **Commit:** `d382ca2`

## Known Stubs

None. No stub, placeholder, TODO or skipped test was introduced. The two pre-existing suite skips are
unrelated to this plan and unchanged.

## Threat Flags

None. This plan introduced no network endpoint, no auth path, no new file access pattern and no schema
change. `T-27-56-01` through `T-27-56-05` are all mitigated and evidenced above; `T-27-56-SC` stands
as accepted — no package-manager install ran and no dependency changed.

## Still OPEN, with a named owner

| Item | Owner |
|---|---|
| `raw.trim()`'s alphabet is wider than the module's declared `[ \t]` class (pre-existing, never in the silent-no-grant direction; measured both ways) | a later round — decide whether the continuation path should use `firstOutsideDeclaredWs`, with the repository-wide value map taken before and after |
| `AXIS_HEADER_POSITION` has 3 members and does not reach a compact nested sequence (covered instead by probe a6, which the loader rejects) | a later round |
| This repository's vitest intercepts console output, so the file's "PRINTED, never silent" skips are invisible on a default run | a later round — either switch them to a caller-named file, as the D-60 dump now is, or set the flag in the test script |
| `27-55`'s two open items (the union axis's ORDERING arm; its 1-of-72 mirror count) | carried, unchanged |
| `27-49` WR-04 residual, `27-50` R1 residual, `27-53` fence-classifier floor, `toggle[1]` sensitivity | carried, unchanged — `27-56` touched no exemption machinery, no fence classifier and no toggle |
| KIT-03 and SPAWN-04 stay `[ ]` / `Gaps Found` | the next verification round for phase 27 (D-58 item 4 — an executing plan never promotes a row because its own tasks targeted that requirement's defect) |

## Self-Check: PASSED

- `scripts/frontmatter.ts` — FOUND
- `scripts/frontmatter.js` — FOUND
- `scripts/frontmatter.test.ts` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` — FOUND
- commit `0131600` — FOUND
- commit `d382ca2` — FOUND
