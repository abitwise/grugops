---
phase: 28-kit-consistency-audit
plan: 02
subsystem: tooling-gates
status: complete
tags: [audit-01, audit-04, d-19, d-20, d-21, d-22, d-23, fail-safe-residuals, red-first, checkpoint-override]

requires:
  - scripts/check-uat-oracles.ts (the D-20 target — WR05_SCAN, WR05_BEATS, grepFiles)
  - scripts/kit-model.ts (MAX_WALK_ENTRIES — the bound-and-refuse-loudly precedent, read only)
  - scripts/context-io.ts (splitNotes/parseNote — read and reproduced against, NOT edited)
  - scripts/canonical-frontmatter.ts (read only, for the D-21 reach measurement)
provides:
  - "WR05_MAX_LINE_BYTES + WR05_BEATS exported from check-uat-oracles.ts (the D-20 pins)"
  - "the permanent pathological-line termination control + the closed-lookahead-class assertion"
  - docs/audit/28-residual-sizing.md (the AUDIT-04 transcript, both residual sizings, the 8-row disposition table, 7 findings)
  - "the measured D-21 verdict: NOT REQUIRED on reach"
affects:
  - 28-06 (F-28-D strangeness finding on oracleWr05Wording; F-28-A/B/C/E/F/G for the register)
  - 28-08 (now RUNS; also inherits D-19 item 3 and residual 2 with the patch and RED-first property attached)
  - .planning/ROADMAP.md (F-28-A — the pre-named 1.62.0 is stale by one patch)

tech-stack:
  added: []
  patterns:
    - "anchor + consuming atom, with linearity measured on wall-clock rather than read off the regex"
    - "bound the input, refuse loudly BY NAME, report-not-throw because a gate reports"
    - "exact integer comparison at the named constant (N passes, N+1 refuses)"
    - "verdict preservation proven by byte-diffing the gate's own output, not by reasoning"
    - "derive the class by measurement, then name the sanctioned exemption with its reason"
    - "reproduce against the committed .js before sizing; never size from the prior phase's record"
    - "assert the verification harness's own premise before trusting its result"

key-files:
  created:
    - docs/audit/28-residual-sizing.md
  modified:
    - scripts/check-uat-oracles.ts
    - scripts/check-uat-oracles.js
    - scripts/check-uat-oracles.test.ts
    - agent-factory/checklists/playwright-visual-regression-recipe.md
    - agent-factory/checklists/accessibility-checklist.md

decisions:
  - "D-20 closed on all three axes with the linearity proven on wall-clock time: the pre-fix build was SIGTERM-killed at a 20 s budget with no verdict; the post-fix build returns in 0.08 s on the identical mirror."
  - "The beat regexes are anchored with `^` PLUS a consuming `[\\s\\S]`, so linearity does not rest on an engine start-anchor optimisation. `[\\s\\S]` and not `.` — `.` excludes \\r, which would change the verdict on a CRLF-terminated line."
  - "Verdict preservation was MEASURED, not reasoned: the gate's full output over the real tree is byte-identical before and after (empty diff)."
  - "WR05_MAX_LINE_BYTES = 262144, sited beside WR05_SCAN, enforced in a pass that runs BEFORE any beat regex sees any line and returns early on refusal — reporting a beat verdict derived from input the gate declined to read would be a fabricated verdict."
  - "The bound REPORTS through fail() rather than throwing: kit-model.ts is a library and throws, this file is a gate and must report (the kit-model.ts:744-753 split)."
  - "D-20's closed-class premise was WRONG — 4 pure-lookahead regexes under scripts/, not 3. The fourth is a String.split() boundary separator, kept as a NAMED exemption with its reason rather than by lowering the assertion or excluding the file."
  - "The pins were MEASURED at execution time and the measurement won: @playwright/test is 1.62.1, one patch ahead of the roadmap's pre-named 1.62.0 (F-28-A)."
  - "No live freshness gate was added for the pins — it would red the day upstream ships 1.62.2, and training maintainers to ignore a red gate is the failure mode this milestone has been fighting."
  - "D-21 resolved NOT REQUIRED by computing import closures: context-io.ts and canonical-frontmatter.ts are disjoint in BOTH directions. The decision stands as taken; its condition simply did not obtain."
  - "The recorded `---\\n--- \\n…` shape does NOT reproduce on the current build — reproducing rather than reading the Phase 22 record is what surfaced it (F-28-B)."
  - "The first fuzz property was the module's OWN stated contract and that contract is false; it reported 42 phantom survivors until restated over byte count (F-28-C)."
  - "oracleWr05Wording's still-load-bearing question is recorded at its file and line and routed to 28-06 — settling it inside a bug fix is the silent retirement this phase exists to prevent."
  - "CHECKPOINT OVERRIDE: 28-08 RUNS on grounds independent of reach — this plan found two of its own premises wrong, so a scheduled adversarial round is not droppable."
  - "CHECKPOINT OVERRIDE: D-19 item 3 assigned to 28-08 inside phase 28, not Phase 30 — Phase 30 is what makes the timeout worse, so deferring there inverts D-19's rationale."
  - "CHECKPOINT OVERRIDE: residual 2 pulled forward out of Phase 30 and assigned to 28-08 rather than applied in task 4 — a checkpoint gate cannot carry a fail-closure-path edit with no test in scope and no RED-first transcript."

metrics:
  duration: ~75m
  tasks: 4
  commits: 4
  files-changed: 6
  completed: 2026-08-11

actuals:
  tokens: 61000
  tasks: 4
  commits: 4
---

# Phase 28 Plan 02: Close the Fail-Safe Residuals, Measure the Pins, Size the Unsized Summary

A safety gate that hung instead of failing now refuses by name in 0.08 s where it previously returned no verdict at all, three shipped pins carry versions measured in this session rather than inherited, and both unsized residuals came back with a reproduction — one of which overturned the record it was sized against.

## Task 1 — the oracle stops hanging and starts failing (D-20)

### The before-and-after transcripts, with wall-clock numbers

Mirror of the four `WR05_SCAN` files with one synthetic non-matching line appended to `.planning/STATE.md`, driven against the **committed** `.js`. Budget = 20 s, the same budget the permanent control uses.

```
### PRE-FIX, 256 KiB line, 20s budget (the permanent control's budget):
line=256KB wall=20.00s status=null signal=SIGTERM killed=ETIMEDOUT
--- output (last 600 chars) ---
== Phase 19 Tier-1 auto-UAT oracles (UAT-AUTO-01/03) ==

### PRE-FIX, 256 KiB line, 300s ceiling (true completion time):
line=256KB wall=92.58s status=0 signal=null killed=no

### POST-FIX, 256 KiB line, same 20s budget:
line=256KB wall=0.09s status=0 signal=null killed=no
```

The pre-fix build printed its **header and nothing else** before being killed. That is the point D-20 item 3 rests on: not a red gate, a gate with **no verdict at all**.

Growth curve against the pre-fix build, measured on this box (node v24.12.0, darwin 25.5.0):

| Line length | 32 KiB | 64 KiB | 128 KiB | 256 KiB |
|---|---|---|---|---|
| Wall clock | 1.97 s | 6.29 s | 23.62 s | **92.58 s** |

Doubling the input roughly quadruples the cost — quadratic, as diagnosed. The 527 KB line found in the wild never returned.

**Adversarial self-reproduction.** Not content with the transcript captured before the edit, the pre-fix `.js` was restored from `HEAD` and the control re-run: `wall=20.00s signal=SIGTERM killed=ETIMEDOUT`. Rebuilt, `diff` against the fixed build byte-identical, control re-run: `wall=0.08s status=0`. RED before, GREEN after, on the same box, minutes apart.

### The three axes

**Anchor.** `/(?=…)(?=…)/i` → `/^(?=…)(?=…)[\s\S]/i`. `^` (no `m` flag; `grepFiles` has already split on newlines) means exactly one start position is attempted; `[\s\S]` is the consuming atom, so linearity does not depend on an engine start-anchor optimisation. `[\s\S]` rather than `.` deliberately — `.` excludes `\r` and would change the verdict on a CRLF-terminated line.

**Verdict preservation, measured not reasoned.** The gate's full output over the real tree, captured before the edit and after:

```
$ diff oracle-before.txt oracle-after.txt
DIFF EMPTY — verdict preserved byte-identically
```

**Bound.** `WR05_MAX_LINE_BYTES = 262144`, sited beside `WR05_SCAN`, enforced in a per-line pass that runs **before any beat regex sees any line** and returns early on refusal — reporting a beat verdict derived from input the gate declined to read would be a fabricated verdict. Exact integer comparison, both halves measured:

```
bytes=262144 wall=0.07s exit=0
  PASS  WR-05 wording: closure beats present in all four tracking docs; …

bytes=262145 wall=0.09s exit=1
  FAIL  .planning/STATE.md:871 is 262145 bytes long, over WR05_MAX_LINE_BYTES=262144 —
        refusing to scan this file for the WR-05 closure beats. … Skipping just this line
        would be a silent truncation, and a truncated scan passes every downstream check,
        so the whole beat scan is refused by name instead.
```

Value chosen from measurement: the longest line in any `WR05_SCAN` file at HEAD is **7,994 bytes** (`STATE.md`), giving ~32× headroom while still refusing the 527 KB line that caused the original hang.

### The closed class — where D-20's premise was wrong

D-20 item 1 states the class is *"exactly 3 pure-lookahead regexes, all in `WR05_BEATS`, and no other pure-lookahead regex anywhere in `scripts/`."* Scanning every regex literal in every `.ts` file under `scripts/` found **four**:

```
PURE-LOOKAHEAD  scripts/check-uat-oracles.ts:124  /(?=.*\bdropped\b)(?=.*\bPhase[ -]?8\b)/
PURE-LOOKAHEAD  scripts/check-uat-oracles.ts:128  /(?=.*guard_wr05)(?=.*\bPhase[ -]?10\b)/
PURE-LOOKAHEAD  scripts/check-uat-oracles.ts:132  /(?=.*re-verified GREEN)(?=.*\bPhase[ -]?11\b)/
PURE-LOOKAHEAD  scripts/compactor.test.ts:1704    /(?=^---\nid:)/
total pure-lookahead regex literals under scripts/: 4
```

Cross-checked against a crude `grep -rn '/(?=\|/(?!'` (same 4) and a `new RegExp` sweep (none pure). The fourth is a `String.split()` boundary separator where zero-width **is** the contract, and it is kept as a **named exemption with its reason** rather than by lowering the assertion to "at most one" or excluding the file. Post-fix the scan returns **1** — the sanctioned one, asserted non-vacuously by name.

### The permanent control

7 cases added, all green, file runs in 1.13 s:

| Case | Asserts |
|---|---|
| termination | `signal` null **and** `error.code` undefined **and** exit 0 — "no verdict" and "green" are different outcomes |
| bound fires | non-zero **plus** the file path, `WR05_MAX_LINE_BYTES=262144`, the measured length, and **absence** of the beat PASS line |
| bound boundary | exactly 262144 does **not** trip |
| live tree | bound never mentioned, and longest real line asserted under the bound |
| two-sided pin | `WR05_BEATS.length` is 3, not 2, not 4 |
| beats not pure | each has a non-empty consuming remainder, starts with `^`, carries no `m` flag |
| closed class | sanctioned site found **by name** first (non-vacuity), then nothing else |

The pins are **imported** from the gate rather than restated — a second `262144` would be the duplicated-set-literal defect this milestone keeps closing.

## Task 2 — the pins, measured then written (AUDIT-04 / D-23)

Run 2026-08-11 at 14:57:35Z. Both stderr empty, both exit `0`:

```
$ npm show @playwright/test version
1.62.1
$ npm show @axe-core/playwright version
4.12.1
```

**Divergence — F-28-A.** `@playwright/test` measures **`1.62.1`**, one patch ahead of the roadmap's pre-named `1.62.0` from 2026-07-28. Per D-23 the measurement wins and the checklists carry `1.62.1`. Fourteen days was enough for the pre-named number to go wrong, which is exactly why the requirement asks for a measurement instead of a target. Both pins moved regardless — the tree carried `1.60.0`/`4.11.3`, so **neither** roadmap number had ever been applied.

| Acceptance check | Result |
|---|---|
| 3 version literals across exactly 2 files | `git diff --stat agent-factory/checklists/` = 2 files |
| every literal a substring of the transcript | 1.62.1, 4.12.1, 4.12.1 — all present |
| no import line touched | `git diff \| grep -c '^[+-]import'` = `0` |
| no scripts/ change in this task | `git diff --stat scripts/` empty |
| package.json / lockfile untouched | empty (T-28-10) |

Each site also gained the date its version was verified, so a reader of the shipped checklist can judge the pin's age without opening a planning document. No live freshness gate — it would red the day upstream ships `1.62.2`, which is not a defect.

## Task 3 — the two residuals, sized by reproduction

### Residual 1 (WR-03 usability false-positive) — reproduced, with a control

A faithful note whose prose body carries an `id:`-leading line is refused; the identical note with the `id:` moved off the leading token is admitted:

```
BODY carries a column-0 `id:` line  -> notes=0  trailingMalformed=NON-NULL  REFUSED (exit 1)
CONTROL: `id:` not at column 0      -> notes=1  trailingMalformed=null      ADMITTED
```

The trigger is the leading token, not column 0 (` id:`, `\tid:`, `id:other`, `id: ` all refuse; `x id:` and `ident:` admit). `parseNote` accepts the whole text in **both** directions — the false positive is created by `splitNotes`' boundary enumeration, not the frontmatter parser. Loader column `/usr/bin/ruby -ryaml` (ruby 2.6.10, Psych 3.1.0, libyaml 0.2.1) loads the frontmatter region identically in both directions.

**Not one line — it narrows a fail-closure predicate**, the same move Phase 22 made seven times. `deferred → Phase 30` with that reason.

### Residual 2 — the record was wrong, and so was my first harness

The **recorded** `---\n--- \n…` shape does **not** reproduce today (F-28-B):

```
OK      in="---\n--- "              notes=0 tm="---\n--- "
BROKEN  in="---\nid: n1"            notes=0 tm="\n---\nid: n1"
```

One `\n` invented at the **front** of the refused remainder. Cause: `sliceBytes(0, 0)` on an **empty** leading slice appends a separator because `0 < lines.length` holds (`context-io.ts:400-403`, reached from `:508`).

**The harness's own premise was asserted and was wrong.** The first property was the module's own stated contract (`context-io.ts:533-537`): 173 breaks before, **42 after** — apparently an incomplete fix. Every survivor had `delta = 0`: no byte invented or lost, only a different **order**, because `refused` accumulates the *leading* region and is concatenated *after* the notes. The module's stated contract is false as written (F-28-C). Restated over byte count:

| Build | Invented/lost-byte breaks | Documented blank-region drops |
|---|---|---|
| committed `context-io.js` | **132** | 2 |
| + one line `if (from >= to) return "";` | **0** | 2 |
| fail-closure **verdict** changes | **0** | — |

Patched in a **scratch copy** under the OS temp dir; `git status --short scripts/` empty afterwards.

### D-21 resolved — NOT REQUIRED

```
closure(scripts/context-io.ts)  = {context-io}                    canonical-frontmatter? NO  frontmatter? NO
closure(scripts/compactor.ts)   = {compactor, context-io}         canonical-frontmatter? NO  frontmatter? NO
closure(scripts/canonical-frontmatter.ts) = {canonical-frontmatter, frontmatter}   context-io? NO
```

Disjoint in both directions. The `admit()` name appears in both modules — different functions, no call across. **D-21's condition did not obtain, so its consequent does not fire.** The blockquote is carried verbatim into the sizing document (`diff`-verified, 542 bytes, present exactly once).

## Task 4 — the checkpoint, and three overrides

Returned **"approved — 28-08 runs, assign D-19 item 3, pull residual 2 forward."**

**The verdict was corroborated, not merely accepted.** Independently re-derived by a stronger route (`frontmatter.ts` has zero imports; its `context-io` mentions at `:71`/`:82` are comments; `canonical-frontmatter.ts` imports only `./frontmatter.js`; `context-io.ts` imports only node builtins) and by **data path** — `context-io.ts` writes `.grugops/context/`, every `canonical-frontmatter` consumer scans `agent-factory/roles/`, `skills/`, `.claude/`. Disjoint by import **and** by directory.

**The strongest objection, measured and answered.** `frontmatter.ts:82` says `context-io.ts` *"is reached through check-uat-oracles.ts"*, which reads like a contradiction. Measured: `check-uat-oracles` reaches `context-io` but **neither** frontmatter module; `check-foundation-guards` reaches all three as a **common consumer**. They share a process; neither imports the other. Sharing a consumer is not reach — the distinction the module's own comment draws at `:83-84`.

| Decision | Recorded as |
|---|---|
| **28-08 RUNS** | On grounds **independent of reach**. This plan found **two of its own premises wrong** — the module's stated round-trip contract (42 phantom survivors) and D-20's closed-class count (3 assumed, 4 measured). That failure class recurred **twice inside one plan**, on a project already carrying six instances. A scheduled adversarial round is not droppable in a phase that just showed its premises unreliable. |
| **D-19 item 3 owned** | Assigned to **28-08 inside phase 28**, closing F-28-E. Not Phase 30 — Phase 30 is what makes the timeout worse, so deferring there inverts D-19's rationale. Measured latent: slowest single test **84 ms** against vitest's 5,000 ms default, no explicit `testTimeout`. |
| **Residual 2 pulled forward** | Out of Phase 30 and **assigned to 28-08**, *not* applied inside task 4. Stated reason: task 4 is a checkpoint gate, `context-io.ts` is outside this plan's `files_modified`, the edit sits on a fail-closure path, and this phase's own doctrine (D-24, D-20 item 2) is that a fix is not closed until a control has been **watched failing**. The patch, the RED-first property, the 132 → 0 numbers and the 2 expected survivors are all attached. |

## Verification Results

| Check | Result |
|---|---|
| `node scripts/check-foundation-guards.js` | **exit 0 in 0.106 s** (47 checks) — acceptance bar was under 5 s |
| oracle output over the real tree, before vs after | `diff` **empty** — verdict byte-identical |
| pathological control, pre-fix / post-fix | **SIGTERM at 20.00 s, no verdict** / **0.08 s exit 0** |
| bound boundary 262144 / 262145 | exit 0 / exit 1 naming file, length and constant |
| `npm run freshness` | exit 0 — 37 committed `.js` match a fresh rebuild |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **40 files, 1427 passed, 2 skipped** (was 1420; +7 new) |
| `grep -c 'Concern raised…'` in the sizing doc | `1` |
| D-21 blockquote vs the plan's copy | `diff` identical, 542 bytes |
| disposition table rows | **8** |
| `git diff --stat scripts/` after task 3 | empty — the fuzz patch never touched the tree |

The `2 skipped` tests are pre-existing and untouched.

## Deviations from Plan

No deviation rule was invoked — no bug was auto-fixed and no architectural change was needed. Three **measured divergences from the plan's own premises** are recorded, all of which the plan explicitly asked to be resolved by measurement:

1. **D-20's closed class is 4, not 3** (F-28-F). The fourth is sanctioned by name with its reason; the permanent assertion is written over the measured class.
2. **The roadmap's `1.62.0` is stale** (F-28-A). Measured `1.62.1`; the measurement wins per D-23.
3. **The recorded residual-2 shape does not reproduce** (F-28-B), and the module's own stated round-trip contract is false (F-28-C).

One in-latitude choice: `WR05_BEATS` and `WR05_MAX_LINE_BYTES` were **exported** so the test imports the pins rather than restating `262144`. The gate's existing `isEntry` guard is what makes the import safe, and it is the same choice plan 28-01 made.

## Threat Model — Dispositions Discharged

| Threat | Disposition | How |
|---|---|---|
| T-28-07 (non-terminating gate, high) | mitigated | all three D-20 axes, proven on wall-clock time and by a permanent control |
| T-28-08 (verdict semantics silently altered) | mitigated | byte-diff of the gate's full output over the real tree — empty |
| T-28-09 (fabricated/inherited version, medium) | mitigated | every literal a substring of a transcript captured in this session |
| T-28-10 (package installs, high) | mitigated | `npm show` is a metadata query; `git diff package.json` / lockfile empty |
| T-28-11 (incidental edit to the admission reader, critical) | **transferred, and honoured** | the module was read and its closure computed; **zero** edits — `git diff --stat scripts/canonical-frontmatter.ts` empty all plan |
| T-28-12 (verdict by reasoning, high) | mitigated | reproduction transcript sits immediately above the verdict; loader column recorded; blocking checkpoint reviewed the evidence before the branch was taken |

## Known Stubs

None. No placeholder, hardcoded empty value, or TODO was introduced.

## For the Next Plans

- **28-06** inherits **F-28-D** (is `oracleWr05Wording` still load-bearing — recorded at its file and line, deliberately unsettled), plus F-28-A, F-28-B, F-28-C, F-28-E, F-28-F and **F-28-G** (`context-io.ts`'s `refs:` block grammar as a second grammar for the same idiom — informational for Phase 29/30, already a mechanically-pinned two-file exemption via the derived `D-50 IN-05` assertion).
- **28-08 RUNS**, and now carries two extra items with their evidence attached in `docs/audit/28-residual-sizing.md` (a file it already edits): **D-19 item 3** (`floor-invariance.test.ts` explicit `testTimeout`) and **residual 2** (the one-line `sliceBytes` fix, RED-first property = **byte count**, 132 → 0, 0 verdict changes, 2 expected survivors) — plus the F-28-C contract-wording correction.
- **AUDIT-02 is deliberately NOT marked complete** and `scripts/check-public-docs-vocabulary.*` was not touched — that gate stays red by design until 28-05.
- `.planning/ROADMAP.md:428`'s pre-named `1.62.0` should be read as satisfied by measurement, not by its literal.

## Self-Check: PASSED

All six created/modified artifacts exist on disk (`docs/audit/28-residual-sizing.md`, `scripts/check-uat-oracles.ts`, `.js`, `.test.ts`, both `agent-factory/checklists/` files), and all four commits (`38bc29d`, `7273561`, `d450db6`, `70f3e05`) are present in `git log`.
