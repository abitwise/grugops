---
phase: 31-autonomous-manual-testing
plan: 08
subsystem: testing
tags: [verification, gap-closure, evidence-provenance, typescript-ast, supply-chain-pin, residual-register]

# Dependency graph
requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-05's appendNote-through-admit wiring (gap 1)"
  - phase: 31-autonomous-manual-testing
    provides: "31-06's dotted-path callee normaliser and nine-member ban set (gap 2)"
  - phase: 31-autonomous-manual-testing
    provides: "31-07's PIN_CONCRETE_VERSION_RE authority shape assertion (gap 3)"
provides:
  - "A three-row re-run of 31-VERIFICATION.md's own Behavioral Spot-Checks against the post-fix tree, each with an independently measured pre-fix control on the same scaffolding"
  - "A whole-tree green record — twelve commands — measured at one named commit with all three fixes present"
  - "The reachability enumeration as derived numbers rather than as claims"
  - "A residual register with a severity, a reason and a disposition per row, including the items this round deliberately left open"
  - "A closure brief ending on the single question a named human answers at end-of-phase harvest"
affects: [31-VERIFICATION re-run, phase-31 close-out, any future gap-closure round]

tech-stack:
  added: []
  patterns:
    - "Re-measure at the verifier's own coordinates: the closure command comes from the verification, never from the fix"
    - "Matched-pair reproduction: run the SAME scaffolding against the pre-fix committed artifact (git archive of the fix's parent) and against HEAD, so the direction of the move is measured rather than asserted"
    - "Assert the measuring harness's own premise: the control arm must be able to SEE the defect, or the instrument is not calibrated"

key-files:
  created:
    - .planning/phases/31-autonomous-manual-testing/31-08-SUMMARY.md
  modified: []

key-decisions:
  - "Every re-run row carries an independently measured pre-fix control, not only the output 31-VERIFICATION.md transcribed — a post-fix output with no matched pre-fix arm on the same scaffolding cannot show the direction of the move"
  - "The pre-fix arm is the committed artifact at the fix commit's PARENT, extracted with `git archive`, so the control is the shipped code as it stood rather than a mutation of the current code"
  - "The whole-tree battery was run at HEAD 4fe930e BEFORE this plan's own first commit, so every command in it was measured against the identical source tree"

requirements-completed: [UATX-01, UATX-02, UATX-04, UATX-06]

# Metrics
duration: TBD
completed: 2026-09-08
status: in-progress
---

# Phase 31 Plan 08: Gap-Closure Evidence and Closure Brief Summary

**The three commands 31-VERIFICATION.md used to open the gaps, re-run verbatim against the post-fix tree with an independently measured pre-fix control on the same scaffolding: a fabricated-provenance write that wrote becomes a refusal writing nothing, a spec that reported 0 findings at exit 0 reports 3 findings at exit 1, and a fully-floating kit that passed clean now fails naming its authority.**

## Performance

- **Duration:** TBD
- **Started:** 2026-09-08T08:20:00Z
- **Tasks:** 3
- **Files modified:** 1 created, 0 source files touched (this plan writes no source file by design)

## Behavioral Spot-Checks — re-run

The table below is directly comparable, row by row, to the "Behavioral Spot-Checks (independently
reproduced in this verification, not taken from 31-REVIEW.md)" table in `31-VERIFICATION.md`. Same
commands, same coordinates.

**No output in this summary is paraphrased, trimmed to the interesting line, or reconstructed from
memory.** Every quoted block below is the captured stdout/stderr of the command named beside it.

Each row carries FOUR cells rather than the three the plan asked for. The fourth — a *pre-fix
control*, the same scaffolding run against the committed artifact as it stood at the fix commit's
parent — was added because a post-fix output on its own cannot show the direction of a move. The
control reproduces `31-VERIFICATION.md`'s recorded output independently, which is what makes the
post-fix cell beside it evidence rather than assertion.

| # | Behavior | Command | 31-VERIFICATION.md measured | Pre-fix control measured here | HEAD `4fe930e` measures | Moved? |
|---|---|---|---|---|---|---|
| 1 | `appendNote()` writes a fabricated-provenance `artifact-ref` (no matching live verdict) | `node` script calling `appendNote("verify-repro-task", { kind: "artifact-ref", gate_run: "no-such-gate-run-ever-existed", sha: "deadbeef…", content_hash: "0"*64, … })` against `scripts/context-io.js` | `appendNote WROTE id: 20260907T163748Z-qe-e2e-artifact-ref-1e163523` — no refusal | `appendNote WROTE id: 20260907T090000Z-qe-e2e-artifact-ref-6f052bf9`, `files AFTER: 1` (module at `bca4bc8`) | `appendNote THREW`, refusal names `context-io.appendNote` + `admission FAIL`, **`files AFTER: 0`** | ✓ wrote → refused, 1 file → **0 files** |
| 2 | `uat-spec-integrity.js` over a spec using `test.describe.only`, `test.describe.skip`, `test["skip"]` | `node scripts/runnable-ref/uat-spec-integrity.js <tmp-repo-with-typescript-resolvable>` | `UAT spec integrity: 0 findings over 1/1 uat specs checked`, `EXIT=0` | `UAT spec integrity: 0 findings over 1/1 uat specs checked`, `EXIT=0` (checker at `5e6ea6f`) — byte-identical to the verification's line | `UAT spec integrity: 3 finding(s) over 1/1 uat specs checked`, `EXIT=1`, one finding per construct | ✓ 0 findings/exit 0 → **3 findings/exit 1** |
| 3 | `guardPlaywrightMcpPin`'s authority read | (a) Code inspection: `scripts/check-foundation-guards.ts:3838-3855`, `const pin = first.version;` with no format check · (b) behavioural run the verification could not perform | No concrete-version assertion present | Same floated mirror, guard at `1033e6f`: `PASS playwright MCP pin \`latest\` … 0 findings over 7/7 elements`, `ALL CHECKS PASSED`, `EXIT=0` | Assertion present at `3788` + `3895-3904`; same floated mirror: `FAIL … reads \`latest\`, which is not a concrete version`, `EXIT=1` | ✓ assertion absent → present; clean pass → **FAIL naming file, line and token** |
| 4 | Full excluded-e2e regression suite (re-run for comparison, **not** for closure) | `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files 61 passed (61)`, `Tests 3264 passed \| 2 skipped (3266)` | — | `Test Files 62 passed (62)`, `Tests 3318 passed \| 2 skipped (3320)` | +1 file, +54 tests — attributed below |

No row failed to move.

### Row 1 — the fabricated-provenance write

**Pre-fix control**, `scripts/context-io.js` as committed at `bca4bc8` (the parent of `0d7f8fd`,
31-05's fix commit), extracted with `git archive`:

```
module: …/pre05/scripts/context-io.js
contextRoot: /var/folders/…/T/p31-08-row1-pwVl8u
files BEFORE: 0
appendNote WROTE id: 20260907T090000Z-qe-e2e-artifact-ref-6f052bf9
files AFTER: 1
EXIT=0
```

**Post-fix**, the committed `scripts/context-io.js` at HEAD `4fe930e`, same script, same payload,
a fresh temp context root:

```
module: /Users/olgeroeselg/Projects/public/grugops/scripts/context-io.js
contextRoot: /var/folders/…/T/p31-08-row1-0tsSWh
files BEFORE: 0
appendNote THREW:
context-io.appendNote: refusing to write an artifact-ref whose provenance the admission authority did not accept. Nothing was written:
admission FAIL: no live green §14-gate verdict found for "§14-gate#no-such-gate-run-ever-existed" under task "verify-repro-task". An artifact-ref naming gate_run "no-such-gate-run-ever-existed" is evidence only when a real green gate verdict with that per-run id exists in the task context.
files AFTER: 0
EXIT=0
```

**Nothing was written.** The notes-directory file count after the call is **0**, stated as a number
and measured by `readdirSync` over `<contextRoot>/verify-repro-task/notes`.

**A false premise in this harness, caught and corrected.** The first draft of the script counted
`<contextRoot>/tasks/<task>/notes` — a directory that never exists. Against the post-fix module it
printed `files AFTER: 0`, which was the right answer for the wrong reason: the counter could not
have seen a file even if one had been written. The pre-fix control is what exposed it — that arm
printed `WROTE id: …` and `files AFTER: 0` in the same breath, which is impossible. The path was
corrected to `<contextRoot>/<task>/notes` (the layout `notesSnapshot()` in
`scripts/context-io.test.ts:3150-3156` reads), an `expect-write` premise assertion was added that
exits 3 if the writing arm reports zero files, and BOTH arms were re-run. This project's record
names a false harness premise in six instances across four rounds; the instrument is calibrated
against the defect before its verdict is believed.

### Row 2 — the invisible modifier calls

Both arms ran against the **same** temp repository and the **same** spec file.

**Pre-fix control**, `scripts/runnable-ref/uat-spec-integrity.js` as committed at `5e6ea6f` (the
parent of `e5dbad9`, 31-06's fix commit):

```
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
```

That is byte-identical to the line `31-VERIFICATION.md` recorded, reproduced here independently
rather than transcribed.

**Post-fix**, the committed checker at HEAD `4fe930e`:

```
UAT spec integrity: 3 finding(s) over 1/1 uat specs checked
e2e/uat/verifier.uat.spec.ts:3: banned modifier call — `test.describe.only` removes the scenario from the evidence the quality gate re-runs, so a green lane would certify a scenario nobody exercised.
e2e/uat/verifier.uat.spec.ts:10: banned modifier call — `test.describe.skip` removes the scenario from the evidence the quality gate re-runs, so a green lane would certify a scenario nobody exercised.
e2e/uat/verifier.uat.spec.ts:17: banned modifier call — `test.skip` removes the scenario from the evidence the quality gate re-runs, so a green lane would certify a scenario nobody exercised.
EXIT=1
```

stderr was empty on both arms. The finding count is **3** — one per construct, which is ≥ 3 as the
acceptance criterion requires.

### Row 3 — the pin authority

**(a) The code inspection, re-performed against the new source.** `31-VERIFICATION.md` inspected
`scripts/check-foundation-guards.ts:3838-3855` and recorded `const pin = first.version;` with no
format assertion. The same region today:

```
3788: const PIN_CONCRETE_VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
```

```
3895:   if (!PIN_CONCRETE_VERSION_RE.test(first.version)) {
3896:     fail(
3897:       `playwright MCP pin: the first pinned mention in ${PLAYWRIGHT_MCP_PIN_SOURCE} (line ${first.line}) ` +
3898:         `reads \`${first.version}\`, which is not a concrete version — a floating specifier AT THE ` +
3899:         `AUTHORITY makes every re-pinned mention compare equal to it, so this guard would report a ` +
3900:         `clean pass over a kit that pins nothing — ${authorityRemedy}`,
3901:     );
3902:     FAILS += 1;
3903:     return;
3904:   }
3905:   const pin = first.version;
```

The line the verification quoted (`const pin = first.version;`) is still there, at `3905`. What is
new is that reaching it now requires passing `PIN_CONCRETE_VERSION_RE` — the concrete-version
assertion the verification found absent.

**(b) The behavioural run the verification could not perform.** A full mirror of the tree
(`.git` and `node_modules` excluded) was built, every pinned mention across the guard's own five
scan roots was rewritten to `@playwright/mcp@latest` — the authority's first mention included — and
the committed guard was run against the mirror with `CHECK_ROOT`.

Control, the **unmutated** mirror, guard at HEAD:

```
  PASS  playwright MCP pin `0.0.78` — pinned mention(s) over 115 markdown file(s): 0 findings over 7/7 elements

== Result ==
ALL CHECKS PASSED
CONTROL_EXIT=0
```

The mutation, derived rather than listed:

```
carriers (derived): 1 ["agent-factory/checklists/browser-uat-recipe.md"]
mentions rewritten: 7
PREMISE authority now floats: true
PREMISE real pin gone from authority: true
```

Pre-fix control, the **floated** mirror, guard at `1033e6f` (the parent of `f471c5c`, 31-07's fix
commit):

```
[guard_playwright_mcp_pin] every pinned mention of the browser MCP server across the kit and the docs equals the ONE literal in the recipe (D-08 / UATX-02)
        pin `latest` read from agent-factory/checklists/browser-uat-recipe.md (line 40); 115 markdown file(s) walked across 5 of 5 configured root(s)
        the planning tree is deliberately outside this scan: it records the registry's current version beside the pinned one on purpose, so scanning it would convict correct text
  PASS  playwright MCP pin `latest` — pinned mention(s) over 115 markdown file(s): 0 findings over 7/7 elements

== Result ==
ALL CHECKS PASSED
PREFIX_EXIT=0
```

Post-fix, the **same** floated mirror, guard at HEAD `4fe930e`:

```
[guard_playwright_mcp_pin] every pinned mention of the browser MCP server across the kit and the docs equals the ONE literal in the recipe (D-08 / UATX-02)
  FAIL  playwright MCP pin: the first pinned mention in agent-factory/checklists/browser-uat-recipe.md (line 40) reads `latest`, which is not a concrete version — a floating specifier AT THE AUTHORITY makes every re-pinned mention compare equal to it, so this guard would report a clean pass over a kit that pins nothing — the version has ONE home and this guard READS it from there; it must never fall back to an assumed default, because a guard that invents the fact it was asked to check reports a comparison it never made

FLOATED_EXIT=1
```

The pin section carries no `0 findings over` line on the post-fix arm. A measured clean pass over a
kit that pins nothing IS the bypass, so its absence is the closure.

### Row 4 — the regression suite, and its delta

`npx vitest run --exclude '**/scripts/e2e/**'` at HEAD `4fe930e`:

```
 Test Files  62 passed (62)
      Tests  3318 passed | 2 skipped (3320)
   Start at  11:38:23
   Duration  283.03s (transform 1.79s, setup 0ms, import 3.34s, tests 275.89s, environment 3ms)
```

Against the verification's `61 passed (61)` / `3264 passed | 2 skipped (3266)`:

| Quantity | Verification | Now | Delta | Attribution |
|---|---|---|---|---|
| Test files | 61 | 62 | **+1** | `scripts/context-io-writer-set.test.ts`, added by 31-05 in commit `195be24` (`git log --diff-filter=A` names that commit and no other); 17 tests |
| Tests | 3264 | 3318 | **+54** | 31-05 → 3289 (+25), 31-06 → 3313 (+24), 31-07 → 3318 (+5); each figure is the full-suite number that plan's own summary recorded, and 25 + 24 + 5 = 54 |
| Skipped | 2 | 2 | 0 | Pre-existing; unchanged across all three plans |

This row is recorded **for comparison, not for closure**. The suite was green with all three gaps
open — 61 files and 3264 tests passing while `appendNote` wrote fabricated evidence, the checker saw
none of the real Playwright modifier spellings, and the pin guard passed a kit that pinned nothing.
Greenness carries no information about these three predicates. Rows 1-3 are the closure evidence.

### Scaffolding — how to repeat all three

**Row 1.** A fresh temp context root from `fs.mkdtempSync(path.join(os.tmpdir(), "p31-08-row1-"))`,
containing no verdict at all. A CommonJS script `require`s the committed `scripts/context-io.js`
(argv[2], so the same script drives both arms) and calls `appendNote("verify-repro-task", note,
"the committed UAT spec the gate re-ran", contextRoot)` where `note` is
`{ kind: "artifact-ref", by: "qe-e2e", at: "2026-09-07T09:00:00Z", verified_by: "", confidence:
"high", refs: ["tests/e2e/uat/TICKET-1.uat.spec.ts"], supersedes: null, sha: "deadbeef".repeat(5),
gate_run: "no-such-gate-run-ever-existed", content_hash: "0".repeat(64) }`. Note files are counted
with `readdirSync(join(contextRoot, task, "notes"))` before and after. The pre-fix arm passes
`expect-write`, which exits 3 if that arm reports zero files.

**Row 2.** `REPO=$(mktemp -d)`; `mkdir -p $REPO/node_modules $REPO/e2e/uat`; `typescript` is
resolved by symlinking this repository's own copy:
`ln -s <grugops>/node_modules/typescript $REPO/node_modules/typescript`. Confirmed resolvable via
`createRequire("$REPO/").resolve("typescript")` →
`<grugops>/node_modules/typescript/lib/typescript.js`. The spec is planted at
`$REPO/e2e/uat/verifier.uat.spec.ts` — under a `uat` path segment, with the `.uat.spec.ts` suffix —
and contains, in this order: `import { test, expect } from "@playwright/test";`, a
`test.describe.only("billing", …)` block, a `test.describe.skip("refunds", …)` block, and a
`test["skip"]("a skipped scenario", …)` call, which places the three constructs on lines 3, 10 and
17. Then `node <checker>.js "$REPO"`.

**Row 3.** `rsync -a --exclude '.git' --exclude 'node_modules' <grugops>/ $MIRROR/` (44 MB). The
float is derived, never listed: a script walks the guard's own scan roots (`agent-factory`, `docs`,
`install` as directories; `AGENTS.md`, `README.md` as files), collects every `.md` matching
`/@playwright\/mcp@/`, and rewrites every `@playwright/mcp@[^\s`"'()[\],<>]*` occurrence in each to
`@playwright/mcp@latest`, printing the carrier list and the rewritten-mention count so the mutation's
own premise is asserted rather than assumed. Then `CHECK_ROOT=$MIRROR node
<tree>/scripts/check-foundation-guards.js`. Pre-fix trees for all three rows come from
`git archive <fix-commit>^ | tar -x -C <dir>`, so the control is the shipped artifact as it stood,
never a mutation of the current one.

## Whole-tree green at one commit

Every command below was run against **one commit: `4fe930e9c3822256a4b81d98d82e3528282b6663`** —
the tree carrying all three gap-closure fixes and none of this plan's own writing. The battery was
run *before* this plan's first commit deliberately, so "one tree" is a fact about the source rather
than an approximation. Each fixing plan verified itself against the tree as it stood when that plan
ran; this is the only place all three changes have been measured together.

Working-tree state during the battery: four pre-existing uncommitted paths unrelated to this phase
(`.planning/milestone.lock`, `human-notes.txt`, untracked `.gsd/`, untracked `.planning/state.json`).
No tracked source file was modified or staged by this plan.

| # | Command | Decisive output | Exit |
|---|---|---|---|
| 1 | `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files  62 passed (62)` / `Tests  3318 passed \| 2 skipped (3320)` | 0 |
| 2 | `npm run build` | `> tsc` with no diagnostics; `git status --short` unchanged afterwards, so no committed `.js` moved | 0 |
| 3 | `npm run typecheck` | `tsc --noEmit && tsc -p tsconfig.tests.json && tsc -p tsconfig.fixtures.json` — all three targets clean | 0 |
| 4 | `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` | 0 |
| 5 | `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` | 0 |
| 6 | `npm run check:imperative-lexicon` | `ALL CHECKS PASSED` | 0 |
| 7 | `npm run check:banned-claims` | `ALL CHECKS PASSED` | 0 |
| 8 | `npm run check:public-docs` | `ALL CHECKS PASSED` | 0 |
| 9 | `npm run check:claim-anchors` | `ALL CHECKS PASSED` | 0 |
| 10 | `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` | 0 |
| 11 | `VALIDATE_KIT_ROOT=. VALIDATE_ROOT=. node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED` | 0 |
| 12 | `node -e "…factory.config.json vs seed/.grugops/factory.config.json…"` | `config twins identical` | 0 |

Twelve commands, all green, one tree.

**Bare `npm test` was NOT run, at any point in this plan.** It resolves to `vitest run` without the
exclusion, which pulls in `scripts/e2e/uat-live.test.ts` — the live `claude --print` lane. On an
authenticated box that spends real credentials and tokens and can hang for roughly eight minutes.
The excluded-e2e invocation at row 1 is this project's regression lane and the only one used here.

The freshness line at row 5 also settles an interaction question no single plan could answer: all
three fixes touched `.ts` sources with committed `.js` twins, and after all three the committed
output for all 60 files still matches a rebuild.

## Reachability enumeration

Numbers, not claims. Each row names the summary it came from and, where the figure was
independently re-derived in this plan, what the re-derivation returned. A figure that disagreed with
its source would be a finding; the one disagreement found is recorded below the table.

| # | Fact | Number | Source | Re-derived here |
|---|---|---|---|---|
| 1 | Exported note writers reaching `writeNoteFile`, derived from the module by TypeScript AST | **4** — `admitAndAppend`, `appendNote`, `emitCheckpointNote`, `emitVerdict` | 31-05 | Yes — `scripts/context-io-writer-set.test.ts` derives the set and asserts membership and cardinality separately; 17/17 green in this plan's own run |
| 2 | `appendNote(` occurrences in tracked non-test sources under `scripts/`, `hooks/`, `install/` | **6** | 31-05 | Yes — `git ls-files` + `grep -c`: `scripts/context-io.ts` 3, `scripts/check-uat-oracles.ts` 2, `scripts/compactor.ts` 1. Agrees |
| 3 | `agent-factory/` documents whose prose names `appendNote` | **4** | 31-05 | Yes — `contracts/context-note.md`, `workflows/16-context-read-write.md`, `workflows/17-task-claim.md`, `workflows/18-context-compaction.md`. Agrees |
| 4 | Named non-note-writer filesystem residuals | **1** — `atomicWrite` | 31-05 | Yes — derived and asserted in `NON_NOTE_WRITER_RESIDUALS`, green |
| 5 | `context-io.js` CLI subcommands, of which write | **4** total, **1** writes (`emit-verdict`) | 31-05 | Yes — `node scripts/context-io.js` prints `validate`, `admit`, `emit-verdict`, `render`. No CLI route mints an `artifact-ref` |
| 6 | `BANNED_CONSTRUCTS` set size | **9** | 31-06 | Yes — imported from the committed `.js`: 9. Agrees |
| 7 | Ban-set partition against the declared `@playwright/test` surface | **7** reachable through a declared export / **2** remainder (`describe.skip`, `describe.only`) | 31-06 | Yes — partitioned by head over the exported constant: 7 / 2, remainder by value. Agrees |
| 8 | `UNRESOLVABLE_CALLEE_RESIDUALS` — callee shapes named as residuals | **2** — an aliased binding, a member computed from a non-literal expression | 31-06 | Yes — 2. Agrees |
| 9 | Callee node kinds `calleeDottedPath` resolves | **8** node kinds (`Identifier`, `PropertyAccessExpression`, `ElementAccessExpression`, `ParenthesizedExpression`, `NonNullExpression`, `AsExpression`, `TypeAssertionExpression`, `SatisfiesExpression`), plus **1** argument-shape predicate (`StringLiteralLike`) bounding the element-access arm — **9** predicates in total | derived here | Derived over the source: the `ts.isX` predicates the normaliser and its `isTypeAssertionLike` delegate branch on. 31-06 described these shapes in prose without a count; the count is stated here so a future widening or narrowing moves a number |
| 10 | Committed `.js` files compared by the freshness gate | **60** | 31-05, 31-06, 31-07 | Yes — `All build outputs fresh: 60 committed .js file(s)`. Agrees |
| 11 | Pinned mentions of `@playwright/mcp@` and the corpus they are measured over | **7** mentions over **115** markdown files across **5 of 5** configured roots; **1** derived carrier file | 31-07 (which measured 7 over 43 files across 2 of 5 roots against its narrower mirror) | Yes — the fuller mirror walks all five roots and 115 files; the mention count is the same 7 |
| 12 | Test files / tests / skipped at HEAD `4fe930e` | **62** / **3318** / **2** | this plan | Yes — see Row 4 above |

**One number disagreed with its source.** The edge-probe arithmetic is recorded as
`8 = 4 authored + 4 surfaced` in `31-05-PLAN.md:132`, `31-06-PLAN.md:127`, `31-07-PLAN.md:118` and
in this plan's own assumptions. Enumerated from the three plans' own dispositions, the partition is
**5 authored + 3 surfaced**:

| Edge-probe row | Disposition | Where |
|---|---|---|
| UATX-01 unclassified | authored | 31-05 truth |
| UATX-04 unclassified | authored | 31-05 truth |
| UATX-06 unclassified | authored | 31-06 truth |
| UATX-02 adjacency | authored | 31-07 truth |
| UATX-02 empty | authored | 31-07 truth |
| UATX-03 unclassified | surfaced (covered by 31-04, verified ✓) | 31-05 |
| UATX-05 unclassified | surfaced (covered by 31-02, verified ✓) | 31-05 |
| UATX-02 ordering | surfaced (covered by 31-03, verified ✓) | 31-07 |

**5 authored + 3 surfaced + 0 dropped = 8.** The total is right and the no-silent-drop property the
equality exists to protect holds: every one of the eight applicable rows has a named disposition and
none is unaccounted for. What is wrong is the partition, restated identically in four plan documents
— which is how a number copied forward without being re-derived behaves. It is recorded here rather
than corrected in place, because rewriting a plan's own accounting after execution would remove the
evidence that the copy happened. Registered below as `R-19`.

## Residual register

Every item below is open, deliberately left open, or inherited. Nothing is omitted for being out of
scope: an item dropped here is a defect the next round has to rediscover.

**Disposition key:** `closed this round` · `left open deliberately` · `inherited` (pre-existing,
untouched by this round).

| ID | Item | Severity | Disposition | Reason |
|---|---|---|---|---|
| R-01 | *"The attended Claude-in-Chrome lane opens under real interactive auth, pauses for a human on a login/challenge page, and produces only a human-stamped finding + artifact-ref (never a gate stamp)."* | human-verification | inherited | `31-VERIFICATION.md` `human_verification`: "Requires an attended Claude Code session with the Claude-in-Chrome browser extension installed and a real interactive login; not reachable in CI and not reachable on this box (extension not connected). 31-VALIDATION.md already records this as a Manual-Only Verification." Not attempted by this round. |
| R-02 | *"The `claude auth status --json` fail-closed predicate (D-10) behaves correctly under an API-key-only box and under a long-lived setup token."* | human-verification | inherited | `31-VERIFICATION.md`: "Research assumptions A2/A3 are `UNKNOWN - verify`; neither configuration is reachable without destroying this box's real credentials, per 31-VALIDATION.md." Not attempted. |
| R-03 | *"Both browser-absence probe stages, and the whole spec-integrity runnable, on a Windows host."* | human-verification | inherited | `31-VERIFICATION.md`: "`UNKNOWN - verify` per the standing Windows posture (WINDOWS.md); not testable on darwin." Not attempted. |
| R-04 | *"A host repository that installed grugops before this release re-runs the installer and picks up `tools/grugops/uat-spec-integrity.js`; the uninstaller removes it."* | human-verification | inherited | `31-VERIFICATION.md`: "Requires a second scratch repository with a prior grugops install at an earlier release; not exercised by the unit suite." Not attempted. |
| R-05 | Aliased-binding callee shape: `const t = test; t.skip(...)` is not refused by arm (c) | medium | left open deliberately | Resolving an alias needs a type checker, which the runnable deliberately does not ship (D-13). Exported as a member of `UNRESOLVABLE_CALLEE_RESIDUALS`, quoted in `browser-uat-recipe.md`, and pinned by a test asserting it really does pass today. 31-06 / T-31-31 / WINDOWS `#138`. |
| R-06 | Computed-member callee shape: `test[name](...)` where `name` is a non-literal expression is not refused | medium | left open deliberately | Same root cause and same disclosure as R-05; the literal and template-literal forms ARE resolved, so only a genuinely computed member escapes. 31-06 / T-31-31 / WINDOWS `#138`. |
| R-07 | Declared `@playwright/test` surface drift — `UNKNOWN - verify` | medium | left open deliberately | `scripts/runnable-ref/fixtures/playwright-test.d.ts` is a hand transcription at the kit's `1.62.1` pin, not the package. grugops ships zero runtime dependencies and CLAUDE.md fixes the dev set at `{typescript, vitest}` + type-only `@types/node`, so the package cannot be installed here to derive the surface, and nothing re-checks it against a released Playwright. Marked `UNKNOWN - verify` in the file header. 31-06 / T-31-32 / WINDOWS `#137`. |
| R-08 | `atomicWrite` — an exported general-purpose file writer | low | left open deliberately | Derived as the sole exported non-note-writer that calls a filesystem write primitive; any in-process caller can use it to write bytes without passing the admission authority. Disposition `accept` (T-31-25), now derived and asserted in `NON_NOTE_WRITER_RESIDUALS` rather than described, so a second such export reds the suite. 31-05. |
| R-09 | WR-01 — a `.uat.spec.ts` one directory outside a `uat` segment is silently unchecked while the pass line claims a full count | medium | inherited (surfaced by 31-06, not closed) | Re-measured in this plan: a tree with `e2e/uat/good.uat.spec.ts` and `e2e/dirty.uat.spec.ts` (carrying `test.skip`) reports `UAT spec integrity: 0 findings over 1/1 uat specs checked`, exit 0. Because `expected` is derived from the same narrowed rule, the denominator floor cannot see it. Outside the three verification gaps. WINDOWS `#139`. |
| R-10 | WR-03 — the "no version literal" acceptance test does not scan the guard's rationale comment despite claiming "comments included" | low | inherited (flagged by 31-07 as A2, untouched) | The region is anchored on the header's *closing* rule, so the 25-line rationale block above it is excluded. A version literal written there passes the test that exists to forbid it. Adjacent to the pin guard this round hardened. |
| R-11 | WR-05 — the pin guard's denominator floor is structurally unreachable in the shipped code | low | inherited (flagged by 31-07 as A2, untouched) | `visited += 1` is the first statement of a plain `for` loop with no `break`, `continue` or throwing call, so `visited === expected` holds unconditionally; the branch is exercised only through a mutated scratch build. The floor is a regression tripwire, not a live floor, and the comment overstates it. |
| R-12 | WR-09 — the pin occurrence pattern admits `.` as a version character, so a sentence-final mention is a false FAIL | low | inherited (flagged by 31-07 as A1, untouched) | Widening what counts as a mention is a decision about the predicate's input, not a patch. Its symptom changed this round — see R-18. |
| R-13 | WR-07 — `content_hash` is required, shaped and stored, and never recomputed or compared by any shipped code path | medium | inherited | `validate()` requires it to be present, non-empty and lowercase hex; nothing reads the artifact's bytes and compares. The contract and the recipe are honest that it is not tamper-proof, but both say "anyone holding the repository can recompute it and compare" without saying that no shipped tool does. The *binding* half of D-02 is `sha` alone. Untouched by this round. |
| R-14 | WR-02 — a missing materialized checker exits 1, which the gate's branch table reads as "a spec-integrity finding" | low | inherited | A host that has not re-run the installer gets a wrong-cause failure rather than a could-not-run. Untouched. |
| R-15 | WR-04 — the pin guard's directory walk has no error handling while its read path does | low | inherited | Untouched; adjacent to the guard this round hardened. |
| R-16 | WR-06 — `--json` produces no stdout on any exit-2 path, so a machine consumer parsing stdout gets an empty string | low | inherited | The D-12 contract advertises a JSON block; the loud-skip, derivation-refusal and argument-error branches write prose to stderr and nothing to stdout. Untouched. |
| R-17 | WR-08 — workflow 05 Step 5's human-only enumeration is one checker short, and Step 5 is the terminal-result authority | low | inherited | Untouched. |
| R-18 | **NEW, measured this round.** A *correct* sentence-final pin mention at the authority position is now refused with a message that misdescribes the fault | low | left open deliberately | Planting `The kit uses @playwright/mcp@0.0.78.` as the recipe's first mention makes the guard exit 1 with `reads \`0.0.78.\`, which is not a concrete version — a floating specifier AT THE AUTHORITY`. The token is a correct pin followed by a full stop, not a floating specifier. This is WR-09's dot-admitting occurrence pattern meeting 31-07's new shape assertion: the direction stays fail-closed (non-zero, correct text refused loudly rather than a bypass), but the diagnosis is wrong and would send a reader hunting for a dist-tag that is not there. Fixing it means changing WR-09's occurrence grammar, which is R-12's decision. |
| R-19 | **NEW, measured this round.** A `.uat.spec.ts` under a `uat` segment inside `tools/` is silently unchecked | medium | left open deliberately | `tools` is a member of `SKIPPED_DIRECTORIES`, so `tools/uat/dirty.uat.spec.ts` (carrying `test.skip`) is dropped from the derived set with no refusal: measured as `0 findings over 1/1 uat specs checked`, exit 0. This is the skip-list arm of R-09's question and it matters more than it looks, because `install.ts` materializes the checker itself into `tools/grugops/` — `tools/` is a directory the kit actively writes into. Widening the walk's input boundary is a decision about the predicate's input, not a patch, so it is named rather than changed. |
| R-20 | **NEW.** The edge-probe partition is recorded as `4 authored + 4 surfaced` in four plan documents; the enumerated partition is `5 + 3` | info | left open deliberately | The total is 8 either way and no row is dropped, so the property the equality protects holds. Recorded rather than silently corrected: rewriting a plan's own post-hoc accounting would delete the evidence that a number was copied forward without being re-derived. See the enumeration section. |
| R-21 | Duplicate retained-ledger event: one `artifact-ref` through `admitAndAppend` records TWO GOV-02 ledger events under `audit_retention: retained` | low | left open deliberately (introduced by 31-05, disclosed there) | Two admissions genuinely happen and the ledger records admissions. Suppressing the second needs either an agent-reachable parameter or a private unadmitted write helper — both re-open what 31-05 closed, to tidy an audit line. Asserted by tests with both lines carrying the same note id. WINDOWS `#136`. |
| R-22 | `FAILS` is incremented twice per authority refusal in `guardPlaywrightMcpPin` | info | inherited (pre-existing across four branches; 31-07's new branch matches the shape) | Every early-return branch calls `fail()` (which does `FAILS += 1`) and then does `FAILS += 1` again. Affects only the trailing `N CHECK(S) FAILED` tally, never the exit status or any finding text. WINDOWS `#140`. |
| R-23 | `composeThreadNote` does not mirror `composeNote`'s evidence-provenance lines | low | inherited | An `artifact-ref` written to the thread tier composes without `sha`/`gate_run`/`content_hash`. Fail-closed (`validate` refuses it on promotion), but the raw-to-promoted byte comparison would differ. WINDOWS `#129`. |
| R-24 | `npm run freshness:context` passes vacuously — no `.grugops/context` tree is committed | low | inherited | The acceptance criterion "exits 0 with no task listed as stale" is satisfied over an empty denominator. The non-vacuous byte-stability evidence is the composed-fence and render cases in `scripts/context-io.test.ts`. WINDOWS `#130`. |
| R-25 | The pin guard's sorted-walk determinism claim has no test | low | inherited | A differing directory-read order cannot be staged by the existing harness. WINDOWS `#132`. |
| R-26 | D-09's structural Chrome-lane bar is syntactic: an aliased reference or bracket access to `emitVerdict` evades it | medium | inherited | Measured and disclosed in the file header of `scripts/chrome-lane-bar.test.ts`; not closed. Same shape as R-05/R-06 one file over. WINDOWS `#133`. |
| R-27 | A repository holding `*.uat.spec.ts` files with `quality.ui_e2e` off never runs the UAT spec-integrity check | medium | inherited | Applicability belongs to the dial, so unchecked specs remain possible by configuration. WINDOWS `#134`. |
| R-28 | The attended Chrome lane was not exercised live on this host | human-verification | inherited | Only its documented absence-of-route was asserted structurally. Same underlying item as R-01, recorded separately in the ledger. WINDOWS `#135`. |
| R-29 | Deferred: `scripts/freshness.test.ts` "Test 1 (control, real tree)" exceeds vitest's 5s default timeout | low | inherited (deferred set, stays deferred) | The case spawns `node scripts/freshness.js` over 60 files; on this machine it takes 5.4-6.7s, so it fails on the default timeout rather than on drift. Reproduced at plan 31-01's base commit `109d5c7`, so it pre-dates the phase's changes. The gate itself (`npm run freshness`) is green and reports all 60 outputs fresh. `deferred-items.md` / WINDOWS `#131`. |
| R-30 | IN-01 — `PLAYWRIGHT_BROWSERS_PATH=0` falls through to the default cache directory | info | inherited | Untouched. |
| R-31 | IN-02 — provenance keys sit before `refs`/`supersedes` in the fence but after `supersedes` in the JSONL line | info | inherited | Untouched. |
| R-32 | IN-03 — two effectively-dead paths in `deriveSpecPaths` | info | inherited | Untouched. |
| R-33 | The `appendNote` bypass (31-01 residual, WINDOWS `#128`) | — | **closed this round's predecessors** | Closed by 31-05 and re-measured here at the verifier's own coordinates: Row 1. Its pinned test case in `scripts/context-io.test.ts` was re-pointed at the closure rather than deleted. Listed so the register is complete rather than convenient. |

Thirty-three rows. Four review Criticals (`CR-01`..`CR-04`) are not in this register because all four
are the three verification gaps, closed and re-measured in Rows 1-3 above.

**Edge-probe arithmetic:** 8 applicable rows, 5 authored into plan truths, 3 surfaced as covered by
an already-verified earlier plan, **0 dropped**. 5 + 3 = 8. (The `4 + 4` split stated in the plans
is registered as R-20.)
