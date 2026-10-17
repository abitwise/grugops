---
phase: 33-live-capture-windows-portability
plan: 05
subsystem: testing
tags: [windows, cap-02, d-16, named-skip, platform-shapes, mkfifo, chmod, control-byte, ruby, gitattributes, crlf, vitest]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: 33-02's 180 s / 120 s vitest bounds (the two label-agreement cases were timeouts under the old 5 s default); 33-04's `process.platform` zero-count discipline and its read-the-CI-log-not-the-class-name pattern
  - phase: 31-uat-spec-integrity
    provides: the `check-platform-shapes` corpus (plan 31-30) — its `make()` that returns false rather than throwing, its `reasonWhenAbsent`, its `FORCE_ABSENT` seam and its always-printed SKIPPED SHAPES block, which this plan makes the ONE remainder every test-side absence reports into
provides:
  - "`scripts/check-platform-shapes.ts` (+ `.js`): `formatSkipEntry` / `skipEntry` / `skipLine` (the one row format), `shapeNamed` / `stageShapeOrSkip` (a test stages a corpus shape with the corpus's own `make()` — for a FIFO that is `mkfifo` FOLLOWED BY `isFIFO()`), `stageSymlinkOrSkip`, `stageNameOrSkip`, the `HOST_CAPABILITIES` registry (`chmod 000 enforcement`, `signal-terminated child`, `control byte in a path component`) with `capabilitySkipEntry` / `hostCapabilityOrSkip` / `isForcedAbsent`, `POSITION_LABELS`, and a HOST CAPABILITIES probe block whose absences land in the same SKIPPED SHAPES block the shapes do"
  - "`scripts/frontmatter.test.ts`: one file-scope `RUBY = process.env.YAML_ORACLE_RUBY ?? \"ruby\"` and one `probeLoader`; zero `/usr/bin/ruby` call sites; the two D-59 cases probe before `runLoader`"
  - "every test-side FIFO in `hooks/guard.test.ts` (14 sites), `hooks/admission-guard.test.ts` (1), `scripts/nonblocking-reader-parity.test.ts` (1), `scripts/context-io.test.ts` (19) is `stageShapeOrSkip(\"FIFO\", …)` with a skip arm that prints the remainder row and names the deterministic route; the `mkfifo` census in `scripts/uat-gate-exit-contract.test.ts` is a syntax-tree derivation in both directions (0 test-side spawns, exactly 1 corpus constructor, 79 test modules)"
  - "`scripts/board-read.test.ts` `denyModeOrSkip(path, mode, restoreTo, probe, position)` at nine mode-0/444 premises, and the same measured branch at `scripts/context-io.test.ts`'s two chmod premises and its CR-24 `unopenable` plant — taken on the measurement (EACCES/EPERM), mode restored, row printed"
  - "the control-byte fixtures (`board-read.test.ts` 32.1-12 / 32.1-13 roots, `check-nul-bytes.test.ts` `a<newline>b.md`) staged through `stageNameOrSkip`, each code point measured on its own"
  - "`.gitattributes` pins for the 14 tracked LF-text files no per-extension pin reached (`*.svg`, `*.jsonl`, `.gitattributes`, `.gitignore`, `.gitkeep`, `LICENSE`, `NOTICE`, `VERSION`), and a `check-nul-bytes.test.ts` case that re-derives the unpinned set (`git ls-files --eol` i/lf rows whose `eol` attribute is unspecified) and asserts it empty on every host, with its converse"
  - "`scripts/uat-gate-exit-contract.test.ts`: the printed SKIPPED SHAPES count and its (shape, position) multiset asserted EQUAL to `derivedRemainder()` — every corpus shape constructed with its own `make()` in a scratch root, one entry per `POSITION_LABELS` member when refused, plus every absent host capability; the REQUIRE_SKIPS case as the relationship (red iff the derived remainder is empty)"
  - "`scripts/check-platform-shapes.test.ts`: the refusing-rows CONTROL counts driven rows plus skip rows per position (with the seam arm driven); the signals-itself MIRROR measures the `signal-terminated child` capability first"
affects: [33-09 pushed CI run, 33-06 install suite, the CAP-02 gap round]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate: chars/4 over the realized diff.
actuals:
  tokens: 33537
  tasks: 3
  commits: 3
plan_head_before: f29bd7395a398ba35515e56821a3ed7c523c820b

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A fixture a host cannot stage is a platform SHAPE: it is constructed through the corpus module's own constructor or probe, its refusal is one printed row in the SKIPPED SHAPES format naming the shape, the position, the platform, the corpus's reason and the deterministic route that still pins the predicate, and the gate's own run counts the same absence — one place a reader looks"
    - "A skip arm nobody has watched fire is a skip arm nobody has watched: every helper honours `GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT` before it constructs or measures, so every arm this plan added was driven on darwin (35 FIFO rows, 18 chmod rows, 12 control-byte/symlink rows) and its case passed with the row printed"
    - "A construction that exits 0 is not a fixture until the shape is observed: `mkfifo` then `isFIFO()`; a self-signalling child then `signal !== null`; a mode-0 path then EACCES on the probe"
    - "Read the CI log's Received text, not the class name RESEARCH gave it: the thirteen guard reds were the `could not be read (ENOENT …)` arm, not a home refusal; the check-nul-bytes reds were 13 CRLF checkouts of unpinned files, not an empty tracked set; the label-agreement reds were `Test timed out in 5000ms`, not a disagreement"

key-files:
  created: []
  modified:
    - scripts/check-platform-shapes.ts
    - scripts/check-platform-shapes.js
    - scripts/check-platform-shapes.test.ts
    - scripts/uat-gate-exit-contract.test.ts
    - scripts/frontmatter.test.ts
    - scripts/context-io.test.ts
    - scripts/nonblocking-reader-parity.test.ts
    - scripts/board-read.test.ts
    - scripts/check-nul-bytes.test.ts
    - hooks/guard.test.ts
    - hooks/admission-guard.test.ts
    - .gitattributes
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md

key-decisions:
  - "The thirteen `hooks/guard.test.ts` cases are NOT relocated outside the kit home: the windows log's full Received text is `the grugops hook module \"hooks/guard.js\" could not be read (ENOENT …)` — the `could not be read` arm of `verifyDeciderClosure` (the third of its four per-module arms), reached because MSYS `mkfifo` exits 0 and stages nothing Node can open; RESEARCH's `'the grugops ho…'` was vitest's truncation of `hook module`, not `home`. Manifest positions are inside the mirror's kit root by definition, so a fixture placed outside it would never be read by the wrapper and the case would be vacuous. The closure is Task 1's corpus constructor (`mkfifo` then `isFIFO()`), reproduced on this host with a fake `mkfifo`"
  - "The check-nul-bytes 'empty tracked set' premise is disproven: the windows gate scanned 2364 tracked files and refused 13 for `0x0d` — every file no per-extension `eol=lf` pin reached, checked out CRLF under the runner's core.autocrlf=true. The fix is a DERIVED pin set in `.gitattributes` plus a case that re-derives the unpinned set on every host; RESEARCH's 'the Windows reds are NOT CRLF' holds for every class but this one (14 files on this tree)"
  - "The two label-agreement cases in `check-platform-shapes.test.ts` are unchanged: re-measured at 3644 ms and 3661 ms under 33-02's 180 s bound, and both CI legs' failures were `Error: Test timed out in 5000ms` — no label disagreement ever existed (RESEARCH Open Question 4 answered)"
  - "The shared skip helpers and the host-capability registry land in Task 1's commit rather than Task 2's: the four named-pipe callers need the row format and the FIFO constructor, and the CR-24 plant table in `context-io.test.ts` carries the chmod-000 plant beside the FIFO plant, so the `chmod 000 enforcement` capability had to exist before that table could be rewritten once"
  - "The `chmod 000` arms take the branch on the MEASUREMENT (EACCES/EPERM from the case's own probe, mode restored) as the plan asks, and ALSO consult the `FORCE_ABSENT` seam first — otherwise none of the 18 arms was watchable on a host that honours the mode"
  - "The REQUIRE_SKIPS 'silent remainder is red' case is asserted as the relationship (red iff the derived remainder is empty) because on windows-latest the correct remainder is two and the unconditional exit-1 pin was itself a windows red; its red arm is additionally asserted at the gate's own source so it is reachable from every host. RESEARCH's reading that `check-platform-shapes.test.ts` carries the require-skips cases was wrong: they live in `uat-gate-exit-contract.test.ts`"
  - "`nonblocking-reader-parity.test.ts`'s `expect(\"SKIPPED …\").toContain(\"SKIPPED\")` and `guard.test.ts`'s unix-socket tautology printed nothing; both now `console.warn` the remainder row. The parity corpus's FIFO reason is read from the corpus (`shapeNamed(\"FIFO\").reasonWhenAbsent`), not restated"

patterns-established:
  - "Derive the remainder, assert the relationship: `derivedRemainder()` is a second consumer of the same corpus (its own scratch-root constructions plus the capability probes), compared to the gate's printed block as a count and as a (shape, position) multiset; mutation-checked by a gate that over-counts by one"
  - "The census of a construction is a syntax-tree walk for a call whose first argument is the literal, in both directions, with the walker proven sighted by the one site that must exist"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "The loader interpreter resolves through PATH with a probe; an absent interpreter is a printed skip, never a spawn error, and the cross-checks still run where it is present"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "YAML_ORACLE_RUBY=grugops-no-such-interpreter npx vitest run --exclude '**/scripts/e2e/**' --reporter=verbose scripts/frontmatter.test.ts — exit 0, 294 passed, 0 ENOENT, 14 `SKIPPED <case>:` lines"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' --reporter=verbose scripts/frontmatter.test.ts (interpreter present) — 294 passed, 0 loader-absence skip lines, ruby=2.6.10 psych=3.1.0 libyaml=0.2.1 in the transcripts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every test-side FIFO is staged through the corpus constructor with a printed, counted skip arm; the mkfifo census derives the new truth in both directions"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/frontmatter.test.ts scripts/context-io.test.ts scripts/nonblocking-reader-parity.test.ts hooks/admission-guard.test.ts hooks/guard.test.ts — 5 files, 1326 passed"
        status: pass
      - kind: unit
        ref: "GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT=FIFO over context-io / nonblocking-reader-parity / admission-guard / guard — 1032 passed, 35 `SKIPPED shape=\"FIFO\"` rows (13 manifest positions + config path in guard, 1 admission, 1 parity, 19 context-io)"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts > NO test module spawns mkfifo itself … — scanned 79, test-side 0, corpus constructor scripts/check-platform-shapes.ts:466; planted `execFileSync(\"mkfifo\")` in a throwaway test module: 1 failed naming it"
        status: pass
    human_judgment: false
  - id: D3
    description: "Mode-0 premises skip on the measurement; refused filenames and the missing symlink privilege are counted platform shapes; the CRLF-checkout class is pinned by a derived set"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/board-read.test.ts scripts/check-nul-bytes.test.ts scripts/check-platform-shapes.test.ts — 230 passed"
        status: pass
      - kind: unit
        ref: "GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT=\"chmod 000 enforcement\" over board-read + context-io — 832 passed, 18 chmod rows; FORCE_ABSENT of the control-byte and symlink capabilities over board-read + check-nul-bytes + context-io — 865 passed, 12 rows"
        status: pass
      - kind: integration
        ref: "node scripts/check-platform-shapes.js — HOST CAPABILITIES (3) all present, SKIPPED SHAPES (0), ALL CHECKS PASSED, exit 0; with the seam naming `chmod 000 enforcement,FIFO`: SKIPPED SHAPES (3), exit 0"
        status: pass
      - kind: unit
        ref: "scripts/check-nul-bytes.test.ts > every tracked LF text file carries an eol pin — pass; with the NOTICE pin removed: 1 failed, `expected [ 'NOTICE' ] to deeply equal []`"
        status: pass
      - kind: integration
        ref: "npm run check:nul-bytes && npm run build && npm run check:build-parity — ALL CHECKS PASSED on the committed outputs"
        status: pass
    human_judgment: false
  - id: D4
    description: "The remainder's expected size is derived from the corpus on the running host; every refusing shape is a row or a skip; the thirteen guard cases answer from their own arm"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/uat-gate-exit-contract.test.ts hooks/guard.test.ts scripts/check-platform-shapes.test.ts — 335 passed; guard.test.ts 275/275 with 13 `a FIFO at <position> is a bounded deny` cases green"
        status: pass
      - kind: unit
        ref: "mutation: scripts/check-platform-shapes.js printing `skips.length + 1` — `the printed remainder EQUALS …` 1 failed"
        status: pass
      - kind: unit
        ref: "fake `mkfifo` (exit 0, stages nothing) on PATH: pre-plan hooks/guard.test.ts reds `a FIFO at hooks/guard.js` with `could not be read (ENOENT …)` — the CI's exact text; the current test prints the FIFO row and passes"
        status: pass
    human_judgment: false
  - id: D5
    description: "The windows-latest reds this plan targets (frontmatter 2, guard 13, admission-guard 1, context-io FIFO/chmod/device ~19, board-read 13 of 15, check-nul-bytes 3, uat-gate-exit-contract 4, check-platform-shapes 2 of 4) are closed on windows-latest itself"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "Not measurable on this host: every mechanism was reproduced here from the CI log (a fake mkfifo, the seam-driven skip arms, the derived eol-pin set) and every fix is a POSIX no-op by construction; the windows outcome is read from the pushed CI run plan 33-09 makes"

# Metrics
duration: 53min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 05: Named, Counted Skips for Host Absences Summary

**Every fixture a host cannot stage — a FIFO, a mode-0 path, a control byte in a filename, a symlink or a self-signalled child — is now constructed through the platform-shape corpus's own constructor or probe, and its refusal is one printed row in the SKIPPED SHAPES format that the gate also counts on its own run; the loader interpreter resolves through PATH with a probe; the remainder's expected size is derived from the corpus rather than pinned to one platform's answer; and three of the plan's premises were corrected by the CI log — the thirteen guard reds were the `could not be read (ENOENT)` arm behind an MSYS `mkfifo` that exits 0 over nothing, the check-nul-bytes reds were 13 CRLF checkouts of unpinned files (now pinned from a derived set), and the label-agreement reds were 5 s timeouts.**

## Performance

- **Duration:** 53 min
- **Started:** 2026-09-20T01:07:11Z
- **Completed:** 2026-09-20T02:00:38Z
- **Tasks:** 3
- **Files modified:** 12 (+ deferred-items.md)

## Accomplishments

- `scripts/check-platform-shapes.ts` is the one home of the skip vocabulary: `formatSkipEntry` (the printer uses it; bytes unchanged), `skipEntry` (fills the platform so no test spells it), `skipLine` (prefix `SKIPPED `, suffix `; the predicate is still pinned by <route>`), `shapeNamed` / `stageShapeOrSkip` (a test stages a corpus shape with the corpus's `make()`, honouring `FORCE_ABSENT` first), `stageSymlinkOrSkip`, `stageNameOrSkip`, the `HOST_CAPABILITIES` registry with `capabilitySkipEntry` / `hostCapabilityOrSkip` / `isForcedAbsent`, and `POSITION_LABELS`. `main()` prints a HOST CAPABILITIES block and pushes each absent capability into the same `skips` list the SKIPPED SHAPES block prints.
- `scripts/frontmatter.test.ts`: 73 lines mention the interpreter; the executable set was 2 describe-scoped declarations, 4 literal call sites, 10 `execFileSync(RUBY` sites and 11 `probeLoader(` calls; everything else (about 40 comment lines quoting `/usr/bin/ruby -ryaml` beside a corpus row) is documentation and is untouched. Measured before any edit by rewriting the literal to a name that does not exist: exactly the two D-59 cases die with `spawnSync … ENOENT` (their `runLoader` had no probe); the D-49 site RESEARCH cites is inside a try/catch and already printed a skip.
- Every FIFO fixture in the four callers goes through `stageShapeOrSkip("FIFO", …)`; the `mkfifo` census is a syntax-tree walk (0 test-side spawns over 79 modules, exactly 1 corpus constructor, mutation-checked).
- Nine board-read premises and three context-io premises take the mode-0 branch on the measurement; six control-byte roots and one newline-named file go through `stageNameOrSkip`; the CR-24 five-arm plant table returns skip rows for its chmod, FIFO and dangling-symlink plants and its four cases derive their counts from what was staged.
- `.gitattributes` gains the 14 derived unpinned classes; `check-nul-bytes.test.ts` re-derives the unpinned set on every host.
- `uat-gate-exit-contract.test.ts` asserts printed == derived for the remainder (count and multiset), with a seam case on a non-empty list and the REQUIRE_SKIPS relationship; `check-platform-shapes.test.ts` accounts for every refusing shape as rows plus skips and gates the signal mirror on a measured capability.
- Full regression lane on the final tree: 78 files, **5339 passed, 2 skipped, 0 failed**, 486.30 s, exit 0 (5334 → 5339: the five new cases). Zero `Test timed out` lines. `npm run build && check:build-parity && typecheck && check:nul-bytes` all green on the committed outputs.

## Task Commits

1. **Task 1: the loader interpreter and the named-pipe constructor** - `7864bc9d` (fix)
2. **Task 2: privilege and permission absences, control-byte filenames, the CRLF pin** - `7772e349` (fix)
3. **Task 3: the derived remainder and the not-a-regular-file arm** - `a2ab41a6` (fix)

**Plan metadata:** see the docs commit that carries this SUMMARY.

## Task 1 — the interpreter references, counted; the FIFO callers; the seam runs

**Interpreter references in `scripts/frontmatter.test.ts` (pre-edit): 73 lines match `ruby|Ruby|RUBY`, 38 of them `/usr/bin/ruby`.** Executable: 2 declarations (`const RUBY = "/usr/bin/ruby"` at the D-52 and D-59 describes), 4 literal call sites (D-49 probe and per-cell loader; D-54 probe and batch), 10 `execFileSync(RUBY, …)` sites (9 in D-52, each behind a `probeLoader` that returns on failure; 1 in D-59's `runLoader`, behind nothing), 11 `probeLoader(` calls (10 with `RUBY`, 1 with a deliberately absent path), plus the `probeLoader` definition. Documentation: the remaining lines, all comments recording which loader adjudicated a corpus row (`/usr/bin/ruby -ryaml`, ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) — every one left as written. After the edit: `grep '"/usr/bin/ruby"'` → 0; one `const RUBY` at file scope; one `probeLoader`.

**Both modes measured.** Absent (`YAML_ORACLE_RUBY=grugops-no-such-interpreter`): exit 0, 294 passed, 0 `ENOENT`, 14 `SKIPPED <case>:` lines (D-49, D-52, D-54, the D-52 positive arm, WR-01, WR-02, 27-59 ×2, D-60 ×2, D-61 ×2, D-59 ×2). Present: exit 0, 294 passed, 0 loader-absence skip lines (the five `SKIPPED` matches in that transcript are the differential's own `loader-rejected and SKIPPED 0` counters and three per-cell `SKIPPED (loader rejects)` reports, which are a different fact). Same count in both modes, so the skip cannot silently become permanent.

**The named-pipe callers.** `hooks/guard.test.ts` (the RA1-2 config-path loop, the thirteen manifest positions, the unix-socket tautology), `hooks/admission-guard.test.ts` (1), `scripts/nonblocking-reader-parity.test.ts` (its own corpus's FIFO shape, plus the printed row for its unix-socket shape), `scripts/context-io.test.ts` (19 sites, incl. `fifoAtOrSkip`, `stageFifoLedger` returning `{ base, skipped }`, the three-shapes and three-arms loops, and the two count cases that stage a DIRECTORY in the FIFO's place and print the substitution). Driven through the seam (`FORCE_ABSENT=FIFO`): 4 files, 1032 passed, 35 rows. The `/dev/zero` links in guard and context-io (GREEN 1c) measure the device with `statSync().isCharacterDevice()` first, then stage through `stageSymlinkOrSkip`.

**`process.platform` counts (pre → post):** frontmatter 0 → 0, context-io 0 → 0, nonblocking-reader-parity 4 → 2, admission-guard 0 → 0, guard 1 → 0, check-platform-shapes.ts 4 → 4 (the gate's own `skip()` now uses `skipEntry`).

## Task 2 — the measurement, the remainder before and after, the CRLF class

**Mode-0 sites:** board-read `readVerifyReread eacces`, `readSnapshot … eacces`, the ABC-500 PATH-authority case, `withDeniedTicketsDir` (four cases in the block, incl. the PREMISE case), the claimed stage, the context listing, the 444 parent, the per-entry ticket and claim; context-io's 31-21 CONTROL 4 EACCES config, the CR-24 EACCES premise and the CR-24 `unopenable` plant. Each sets the mode, probes, and on anything but EACCES/EPERM restores the mode and prints `SKIPPED shape="chmod 000 enforcement" position="…" platform=…: <the corpus's reason>; the predicate is still pinned by <route>`. Driven through the seam: 18 rows, 832 passed. The pre-existing `it.skipIf(IS_ROOT)` guards (a uid check, not a platform name) are left in place; under root they now become a vitest skip rather than a printed row.

**Control-byte fixtures:** the six 32.1-12 / 32.1-13 roots (`repo<U+0085>x`, `repo<U+009F>x`, `repo<U+0001>x` in each) and check-nul-bytes' `a<newline>b.md` go through `stageNameOrSkip(construct, position)` — ENOENT/EINVAL from the construction is the refusal (the codes windows-latest reported), anything else rethrows. Each code point is measured on its own, because the log shows windows accepting the C1 points and refusing only U+0001. Driven through the seam: 7 control-byte rows + 5 symlink rows, 865 passed.

**Remainder size, before and after, on this host:** `SKIPPED SHAPES (0)` → `SKIPPED SHAPES (0)` with `HOST CAPABILITIES (3)` all present; under the seam `chmod 000 enforcement,FIFO` → `(3)`. On windows-latest the measured `(2)` (FIFO at both positions — the symlink shape constructed there; RESEARCH's "FIFO + unix socket" was the parity corpus's list, not this gate's) is expected to become `(4)` or `(5)` once 33-09's run probes `chmod 000 enforcement` and `signal-terminated child` there (control bytes: refused, so `(5)`); the derived assertion accepts whatever the corpus measures.

**The CRLF class.** The plan's "empty-tracked-set failure" does not exist in the log: the windows gate printed `forbidden control-byte total: 152 byte(s) across 13 of the 2364 tracked file(s) scanned`, all `0x0d`, naming `.gitattributes`, `.gitignore`, two `.gitkeep`, `LICENSE`, `NOTICE`, `agent-factory/VERSION`, five `brand/*.svg` and a fixture `*.jsonl` — and the "git's own classifier" case's `expected [] to deeply equal [ '.gitattributes', …(12) ]` is the same 13 files. Derived here (`git ls-files --eol` i/lf rows with `eol` unspecified): 14 (the 13 plus `scripts/e2e/fixtures/capture-sample.jsonl`, added by 33-01). Pinned; re-derived by a case that is empty on this tree and names `NOTICE` when its pin is removed; the converse case sees `LICENSE` and `notes.md` in a throwaway tree with no pins and nothing once they are pinned (the first draft measured the derivation reporting the planted `.gitattributes` itself — correct, and now the planted file pins itself). The existing vacuity floor (`REFUSES an empty tracked set`, `tracked.length > 0`) stays.

## Task 3 — the refusal ordering, the reproduction, Open Question 4

**`verifyDeciderClosure` (hooks/hook-entry.ts:285-330), in order:** first, no manifest entry for the decider → `carries no manifest entry`; then, per module, four arms: (1) `readRegularFileOrRefuse` throws `not-regular` → `is not a regular file (manifest-path-not-a-regular-file)`; (2) `over-ceiling` → `is above the … ceiling`; (3) any other error → `could not be read (<error>)`; (4) hash mismatch → `does not match the frozen manifest`. The windows Received text for all thirteen cases is arm 3 with `ENOENT: no such file or directory, open 'C:\…\guard-mirror-…\hooks\guard.js'`: MSYS `mkfifo` exited 0 (so `execFileSync` did not throw) and left nothing Node's `open` could find. There is no earlier "home" arm; `'the grugops ho…'` is vitest truncating `hook module`.

**Fixture placement.** The manifest positions are `join(KIT_ROOT, rel)` inside the mirror the test builds — that is what the wrapper hashes — so "outside the kit home" would never be read and the assertion would be vacuous. The fixture stays where it is; what changed is the construction: `stageShapeOrSkip("FIFO", abs, …)` is `mkfifo` then `isFIFO()`, and a host whose `mkfifo` stages nothing prints the row and returns.

**The reproduction (the plan's "placed back inside" check, adapted to the real mechanism).** A fake `mkfifo` on `PATH` (`#!/bin/sh` / `exit 0`, verified to create nothing) against the PRE-PLAN `hooks/guard.test.ts` (`git show f29bd739:`): `a FIFO at hooks/guard.js` reds with `expected 'Blocked (fail-closed): the grugops ho…' to contain 'manifest-path-not-a-regular-file'` and Received `could not be read (ENOENT: … open '/private/var/…/guard-mirror-…/hooks/guard.js')` — the CI's exact text on darwin, the same third arm. The same fake against the current test: `SKIPPED shape="FIFO" position="hooks/guard.test.ts: a FIFO at hooks/guard.js" platform=darwin: …` and 1 passed. With a real `mkfifo`: 13/13 green, 275/275 in the file. The assertion is arm-specific (the fragment `manifest-path-not-a-regular-file` occurs only in arm 1), which the pre-plan red proves rather than assumes.

**Open Question 4.** Both `EVERY row's label agrees …` and `COVERAGE: every label was WATCHED live …` failed on BOTH legs with `##[error]Error: Test timed out in 5000ms.` — no assertion text, no disagreement. Re-measured here under 33-02's bound: 3644 ms and 3661 ms, green, unchanged. The windows leg's other two `check-platform-shapes.test.ts` reds were the FIFO-row-absent CONTROL (now rows + skips per position, seam arm driven) and the signals-itself MIRROR (`expected 'NOT ORDINARY (nonzero-exit)' to be 'NOT ORDINARY (signalled)'` — the correct label on a host with no signal delivery; now gated on the measured `signal-terminated child` capability).

**The derived remainder.** `derivedRemainder()` constructs every `SHAPES` entry with its own `make()` in a scratch root (one entry per `POSITION_LABELS` member when refused) and probes every `HOST_CAPABILITIES` entry; the case asserts the printed count, the printed rows' count and the (shape, position) multiset equal it, and `(none) — …` exactly when it is empty. A gate mutated to print `skips.length + 1` reds it. The seam case proves the two consumers agree on a NON-EMPTY list (`FIFO` forced absent: printed = baseline-without-FIFO + 2). `guard.test.ts` count recorded: 275 tests, 13 FIFO-position cases.

## Files Created/Modified

- `scripts/check-platform-shapes.ts` / `.js` - the skip vocabulary, the fixture helpers, `HOST_CAPABILITIES`, `POSITION_LABELS`, the HOST CAPABILITIES probe block
- `scripts/frontmatter.test.ts` - file-scope `RUBY` + `probeLoader`; D-49, D-54, D-59 sites
- `scripts/context-io.test.ts` - 19 FIFO sites, 3 chmod premises, GREEN 1c's device premise, the CR-24 plant table and its four cases
- `scripts/nonblocking-reader-parity.test.ts` - the corpus FIFO constructor; printed skip rows with corpus reasons
- `hooks/guard.test.ts` - the RA1-2 loop, the thirteen positions, the unix-socket row
- `hooks/admission-guard.test.ts` - the config-path FIFO
- `scripts/board-read.test.ts` - `denyModeOrSkip` at nine sites; `stageNameOrSkip` at both control-byte helpers
- `scripts/check-nul-bytes.test.ts` - the newline-named fixture; the derived eol-pin case and its converse
- `scripts/uat-gate-exit-contract.test.ts` - the syntax-tree `mkfifo` census; `derivedRemainder`; the REQUIRE_SKIPS relationship
- `scripts/check-platform-shapes.test.ts` - rows-plus-skips CONTROL with its seam arm; the measured signal mirror
- `.gitattributes` - the 14 derived unpinned classes
- `.planning/phases/33-live-capture-windows-portability/deferred-items.md` - the unguarded directory-symlink fixtures

## Decisions Made

See `key-decisions` in the frontmatter. The reviewable ones: the guard fixtures were not relocated (the plan's premise was a truncation artifact; the log names the `could not be read` arm); `.gitattributes` was edited although not in the plan's file list (the check-nul-bytes reds have no other closure); the helpers and the capability registry landed in Task 1's commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The thirteen guard cases are closed by the FIFO constructor, not by relocating the fixture**
- **Found during:** Task 3 read_first (the windows job log, `gh run view --job 105759397857 --log`)
- **Issue:** the plan's premise — "the fail-closed home refusal pre-empts the not-a-regular-file arm; place the fixture outside the kit home" — is a misreading of vitest's truncated `'the grugops ho…'`. The full text is the `could not be read` arm (`hook module … could not be read (ENOENT …)`) behind an MSYS `mkfifo` that exits 0 and stages nothing. Relocating the fixture outside the kit home would make every case vacuous.
- **Fix:** Task 1's `stageShapeOrSkip` (mkfifo then `isFIFO()`); the mechanism reproduced on darwin with a fake `mkfifo` against the pre-plan and current tests.
- **Files modified:** hooks/guard.test.ts
- **Verification:** the pre-plan red carries the CI's exact text; 13/13 green with a real FIFO; the skip row printed with the fake
- **Committed in:** 7864bc9d (the test), a2ab41a6 (the record)

**2. [Rule 1 - Bug] The check-nul-bytes windows reds are a CRLF checkout of 14 unpinned text files, not an empty tracked set**
- **Found during:** Task 2 (the windows job log's gate transcript: `152 byte(s) across 13 of the 2364 tracked file(s)`)
- **Issue:** the plan's "derive the tracked set and apply a vacuity floor" targets a failure that did not occur; the real class is `.gitattributes` reaching only extensions, so extensionless files, `*.svg` and `*.jsonl` checked out CRLF under core.autocrlf=true and the gate refused their `0x0d`.
- **Fix:** the 14 classes pinned to LF (derived by `git ls-files --eol` + `git check-attr`), and a two-sided case in check-nul-bytes.test.ts that re-derives the unpinned set on every host.
- **Files modified:** .gitattributes (outside the plan's file list — the red has no other closure), scripts/check-nul-bytes.test.ts
- **Verification:** unpinned set 14 → 0; the case reds naming `NOTICE` when its pin is removed; `check:nul-bytes` ALL CHECKS PASSED
- **Committed in:** 7772e349

**3. [Rule 2 - Missing critical] The mode-0 premises in `context-io.test.ts` and the signal mirror in `check-platform-shapes.test.ts` were closed alongside the plan's named sites**
- **Found during:** Tasks 1 and 3 (both were windows reds of exactly this plan's class, in files the plan already edits)
- **Issue:** the plan names board-read's mode-0 premises and the label-agreement pair; the windows log also shows context-io's 31-21 CONTROL 4 EACCES premise, the CR-24 EACCES premise and its `unopenable` plant red as "not root", and the signals-itself MIRROR red with `nonzero-exit` — the correct label on a host without signal delivery.
- **Fix:** the measured chmod branch at the three context-io sites; a `signal-terminated child` host capability, probed before the mirror runs and counted by the gate.
- **Files modified:** scripts/context-io.test.ts, scripts/check-platform-shapes.test.ts, scripts/check-platform-shapes.ts
- **Verification:** 18 chmod rows under the seam; the gate prints the capability absent under the seam; 335/335 in Task 3's files
- **Committed in:** 7864bc9d, 7772e349, a2ab41a6

**4. [Rule 2 - Missing critical] The `mkfifo` census would have reported a false "N unguarded" after Task 1**
- **Found during:** Task 1 (reading `uat-gate-exit-contract.test.ts:724-753`)
- **Issue:** the census counted `"mkfifo"` literals by line regex and asserted exactly one guarded site; after Task 1 no test module carries the literal outside comments, so the old assertion (`sites.length > 0`) would fail as "scan is broken" and its message would lie.
- **Fix:** a syntax-tree walk for a call whose first argument is `"mkfifo"`, recursive over 79 modules, asserting 0 test-side and exactly 1 in the corpus module; mutation-checked with a planted test module.
- **Files modified:** scripts/uat-gate-exit-contract.test.ts (in Task 1's commit rather than Task 3's, so no commit leaves the lane red)
- **Verification:** `[33-05] mkfifo spawn sites: test modules scanned=79 test-side spawns=0 corpus constructor=scripts/check-platform-shapes.ts:466`; planted spawn: 1 failed naming it
- **Committed in:** 7864bc9d

### Plan premises corrected by measurement

- RESEARCH item 1 cites `scripts/frontmatter.test.ts:7857` as the unguarded spawn; that site is inside a try/catch and printed a skip. The two `spawnSync /usr/bin/ruby ENOENT` reds are the D-59 `runLoader` callers (measured here by rewriting the literal before any edit: 2 failed / 292 passed, both D-59).
- RESEARCH item 7's "(2) (FIFO + unix socket)" is the parity corpus's skip list; this gate's windows remainder is the FIFO at both positions (the symlink shape constructed on the runner).
- RESEARCH's "check-platform-shapes.test.ts carries the cases over the require-skips switch": those cases are in `uat-gate-exit-contract.test.ts`.
- RESEARCH's "the Windows reds are NOT CRLF": true for every class but the 14-file unpinned set above.

---

**Total deviations:** 4 auto-fixed (2 bugs, 2 missing critical), 0 blocking; 4 premises corrected.
**Impact on plan:** every `<done>` and acceptance criterion holds on the corrected mechanisms; `.gitattributes` is the one file outside the plan's list, and it is the only closure for a red the plan assigned to this file set.

## Issues Encountered

- The default vitest reporter does not echo `console.warn` in this repository's runs; the skip-row counts above were taken with `--reporter=verbose`.
- A first draft of the census rewrite left a duplicated closing brace (`}); });`) and failed to transform; fixed before the run.
- The converse eol-pin case first measured the derivation reporting the planted `.gitattributes` itself — a correct answer; the planted file now pins itself.

## Known Stubs

None.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema surface. T-33-23 (skip on the measurement, reason printed, route named, counted in one remainder — 18 chmod rows driven), T-33-24 (the arm under test answers; the fake-`mkfifo` reproduction; the assertion is arm-specific), T-33-25 (derived count, always-print and require-skips relationship, mutation-checked), T-33-26 (PATH resolution with override and probe; the absence simulated in the verify command), T-33-27 (a refused construction returns the row and the case returns; 35 FIFO rows driven), T-33-28 (no package installed) are as the register states.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 33-09's pushed run is the windows measurement for D5: the numbers to watch are `hooks/guard.test.ts` (13 → 0), `scripts/frontmatter.test.ts` (2 → 0), `hooks/admission-guard.test.ts` (1 → 0), `scripts/check-nul-bytes.test.ts` (3 → 0), `scripts/uat-gate-exit-contract.test.ts` (4 → 0), `scripts/board-read.test.ts` (15 → the two 33-02 timeouts at most), `scripts/context-io.test.ts` (30 → the 8.3-short-name / drive-letter / home-walk classes only, which are plan 33-06's or later), `scripts/check-platform-shapes.test.ts` (4 → 0), and a `SKIPPED SHAPES` block there of FIFO ×2 + `chmod 000 enforcement` + `signal-terminated child` + `control byte in a path component`.
- The deferred directory-symlink fixtures in `scripts/context-io.test.ts` (green on the privileged runner) are recorded for the CAP-02 gap round.
- The untracked `.planning/milestone.lock` and `.planning/phases/34-*` present at dispatch were not touched.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*

## Self-Check: PASSED

- 13 files present on disk; 3 task commits present in history (7864bc9d, 7772e349, a2ab41a6); commits measured from the plan ledger = 3; no control byte in this file.
