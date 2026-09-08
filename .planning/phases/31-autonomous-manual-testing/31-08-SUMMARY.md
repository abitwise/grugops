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
