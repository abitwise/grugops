---
phase: 32-board-projector-cli-dashboard
plan: 06
subsystem: testing
tags: [typescript-ast, import-graph, node-fs, read-only-guard, vitest, safety-invariant]

# Dependency graph
requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "32-01's scripts/board-model.ts and scripts/board-read.ts — the pure model and the read seam whose closure this guard constrains"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-03's scripts/board-dashboard.ts — the watch loop and CLI entry, which is the closure entry point the guard walks"
  - phase: 30
    provides: "scripts/js-import-closure.ts — the derived-module-set walker this guard's module half is built on"
  - phase: 31
    provides: "scripts/context-io-writer-set.test.ts — the derived-set / two-sided-count / premise-assertion / live-mirror idiom this file applies one level down"
provides:
  - "scripts/board-readonly.test.ts — the DASH-06 / DASH-08 import-graph guard: no mutating node:fs symbol and no socket module is reachable from the dashboard closure"
  - "A TypeScript-AST derivation of per-module node:fs symbol sets and bare specifiers over a compiled .js import closure, reusable by any future closure-scoped guard"
  - "npm run check:dashboard-readonly — the named command, a wrapper around the one implementation the suite runs"
  - "32-06-RED-baseline.txt / 32-06-GREEN-proof.txt — the recorded discrimination evidence for both halves"
affects: [board-dashboard, board-read, board-model, future web renderer, any later plan adding a module to the dashboard closure]

actuals:
  tokens: 16245
  tasks: 3
  commits: 4
plan_head_before: ffd9f6ff

tech-stack:
  added: []
  patterns:
    - "Closure-scoped AST guard: jsImportClosure supplies the module set, a TypeScript AST pass over each committed .js supplies both the node:fs symbol set and the bare specifiers the closure walker deliberately skips"
    - "Printed-and-version-labelled runtime observation instead of a cross-major pinned count; the blocking two-sided pin is the one number that is a function of the repository's own code"
    - "Descriptor-prefix stem anchoring: a RULE (stem, or f/l/create/file + stem) rather than a hand-listed set of POSIX variants, so ftruncate is admitted and readlink is refused by construction"
    - "Fail-closed opacity collection: a dynamic import, a require, an `export * from`, or a computed member access on an fs namespace is collected and asserted absent rather than silently contributing an empty symbol set"

key-files:
  created:
    - scripts/board-readonly.test.ts
    - 32-06-RED-baseline.txt
    - 32-06-GREEN-proof.txt
  modified:
    - package.json
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The guard walks the COMPILED .js closure, not the .ts — the artifact a host actually runs is the artifact the read-only claim has to be true of"
  - "The blocking two-sided pin is the closure's own node:fs symbol set (6 members), not the runtime enumeration's cardinality, because the first is a function of this repository's code and the second is a function of the Node version (CI 22 vs dev 24)"
  - "The runtime enumeration's cardinality is printed and version-labelled on every run under the exact prefix `board-readonly: mutating fs symbols`, and asserted only to be non-empty"
  - "Write-class stems are matched by a descriptor-prefix RULE (stem, or f/l/create/file + stem) rather than by substring, so readlink/readlinkSync are refused by construction and the three named stem false positives really are the only three"
  - "open and openSync stay IN the mutating set by decision: their write-ness depends on a flag literal a name-based derivation cannot read, and a safety guard that cannot decide must refuse"
  - "check:dashboard-readonly is a vitest wrapper (`npx vitest run scripts/board-readonly.test.ts`), the first check:* entry in the repository that is not the two-step tsc-and-run shape; the stdlib-second-scanner alternative was rejected because it would give one predicate two authorities"
  - "No duplicate CI step: the suite step `Vitest (e2e lane excluded)` already runs this file, and a second step would be the same two-authorities smell in the workflow file"
  - "The five D-21 banned modules keep their own asserted cardinality; the rest of the socket family (http2, dgram, tls, cluster, inspector) is a SECOND named set with its own, so D-21's number stays D-21's number"

patterns-established:
  - "Pattern: every emptiness claim is preceded by a PREMISE-prefixed failing assertion naming what must be non-empty — the closure, each module's parse, the runtime match, the bare-specifier set"
  - "Pattern: the discrimination CONTROL — an unplanted mirror of the live closure must be green, so a red against a planted mirror is attributable to the plant and not to the mirroring"
  - "Pattern: a count pin moved only after the run that fired it, with the derivation re-run (`ls scripts/*.test.ts | wc -l`) and the reason written out beside the constant"

requirements-completed: [DASH-06, DASH-08]

coverage:
  - id: D1
    description: "No mutating node:fs or node:fs/promises symbol is reachable from the compiled closure of scripts/board-dashboard.js, over an AST-derived per-module symbol set intersected with a runtime-derived mutating set"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the dashboard closure reaches NO mutating fs symbol"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the derived closure fs symbol set has the expected MEMBERS"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the derived closure fs symbol set has the expected COUNT"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#a planted mutating fs symbol makes the intersection case FAIL"
        status: pass
      - kind: other
        ref: "32-06-RED-baseline.txt — PLANT A: writeFileSync appended to the committed scripts/board-read.js, 4 failed | 18 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "The dashboard closure imports none of the socket / process-spawning builtins, over a second AST pass that collects the bare specifiers jsImportClosure deliberately skips"
    requirement: "DASH-08"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the dashboard closure imports no banned module"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#a planted node:net import makes the module-ban case FAIL"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the UN-PREFIXED spelling of a banned module is caught too"
        status: pass
      - kind: other
        ref: "32-06-RED-baseline.txt — PLANT B: node:net appended to the committed scripts/board-dashboard.js, 2 failed | 20 passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "The pure model's own closure carries no node:fs specifier at all — the mechanical form of D-15 and D-23"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the pure model's own closure carries no node:fs specifier at all (D-15, D-23)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both derived sets assert their own premises before any emptiness claim: a non-empty closure containing the three named modules, a parsed and non-empty statement list per module, a non-empty runtime match, a non-empty bare-specifier set, and no opaque fs acquisition"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#PREMISE: the dashboard closure is non-empty and contains the modules under test"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#PREMISE: every closure module parsed, and none parsed to nothing"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#PREMISE: the collected bare-specifier set is non-empty"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#a module acquiring node:fs by a route the pass cannot name is REFUSED, not ignored"
        status: pass
    human_judgment: false
  - id: D5
    description: "The mutating set is derived from the runtime against D-21's write-class stems, its three named exclusions are asserted present before subtraction and asserted to number exactly three, and its cardinality is printed and version-labelled rather than pinned across Node majors"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#every named exclusion is actually present in the stem-matched set"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the exclusion set has exactly three members"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the stem rule admits the descriptor forms and refuses the read-only lookalikes"
        status: pass
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/board-readonly.test.ts 2>&1 | grep -cF 'board-readonly: mutating fs symbols' → 1"
        status: pass
    human_judgment: false
  - id: D6
    description: "The guard is reachable as one named command that runs exactly one implementation, and it adds no runtime dependency"
    requirement: "DASH-06"
    verification:
      - kind: integration
        ref: "npm run check:dashboard-readonly → 24 passed, exit 0"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the check:dashboard-readonly entry runs exactly this file"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#package.json still has no `dependencies` key"
        status: pass
      - kind: other
        ref: "git diff --exit-code -- package-lock.json → exit 0; git status --porcelain install/ → empty"
        status: pass
    human_judgment: false

duration: 90 min
completed: 2026-09-14
status: complete
---

# Phase 32 Plan 06: Read-Only Import-Graph Guard Summary

**`scripts/board-readonly.test.ts` decides, from the bytes of the compiled closure on every run, that the board projector reaches no mutating `node:fs` symbol and imports no socket module — with both set halves AST-derived, every emptiness claim fronted by a `PREMISE:` assertion, and both halves shown to fail against writers planted into the live build.**

## Performance

- **Duration:** ~90 min
- **Completed:** 2026-09-14T12:15:23Z
- **Tasks:** 3
- **Files created/modified:** 5 (3 created, 2 modified)

## Accomplishments

- **The read-only property is now a mechanism rather than a docblock sentence.** `jsImportClosure(ROOT, "scripts/board-dashboard.js")` supplies the module set (5 modules), a TypeScript AST pass over each committed `.js` supplies the per-module `node:fs` symbol set, and the intersection with a runtime-derived mutating set is asserted empty. The closure's own symbol set — `existsSync`, `readFileSync`, `readdirSync`, `realpathSync`, `statSync`, `watch`, all readers — is the **blocking** two-sided pin, because it is a function of this repository's code and no Node upgrade can move it.
- **The pinned-count trap is avoided by design, not by luck.** The runtime enumeration's cardinality (57 mutating symbols on node 24.12.0, from 60 stem matches minus 3 named exclusions) is printed and version-labelled under the exact prefix `board-readonly: mutating fs symbols` and asserted only to be non-empty. CI on Node 22 will legitimately print a different number without reddening, while a mutating symbol added by a future Node still reds the guard the moment any closure module imports it.
- **The socket ban runs over a set the closure walker deliberately skips.** A second AST pass collects every bare specifier in the closure, asserts it non-empty as a `PREMISE:`, and bans over normalized module *identity* so `net` and `node:net` are one module.
- **Both halves are shown to fail.** Two plants were appended to the committed `.js` and the guard was run against them: `writeFileSync` into `scripts/board-read.js` → 4 failed | 18 passed; `node:net` into `scripts/board-dashboard.js` → 2 failed | 20 passed. Each plant reds its own half and leaves the other green — the two predicates are independent and neither stands in for the other. Both plants are also reproduced in-suite against mirrors built from the live sources, with a **CONTROL** case proving the mirroring itself is not what reds them.
- **One authority, one implementation.** `npm run check:dashboard-readonly` is a vitest wrapper around the same file the suite runs, so the named command and the suite cannot drift apart.

## Task Commits

1. **Task 1: the derived sets — closure modules, fs symbols, mutating set** — `f4f26801` (test)
2. **Task 2: the module ban and the discrimination** — `8751f557` (test)
3. **Task 3: `check:dashboard-readonly`, one authority** — `e3a70658` (feat)
4. **GREEN proof addendum for the post-task-3 run** — `bfc641c1` (docs)

## Files Created/Modified

- `scripts/board-readonly.test.ts` (created) — 24 cases: 5 premises, the blocking two-sided pin, the model-purity claim, the mutating set with its named exclusions, the module ban with two asserted cardinalities, 5 discrimination cases plus a control, a residue listing, and the two dependency-absence assertions.
- `32-06-RED-baseline.txt` (created) — both plants against the committed `.js`, with blob hashes, the verbatim failures, and the attribution that each plant reds only its own half.
- `32-06-GREEN-proof.txt` (created) — the unplanted run, what each printed number means, the full green case list, and an addendum recording the post-task-3 24-case run and the whole-suite run.
- `package.json` (modified) — one new script, `check:dashboard-readonly`.
- `scripts/check-foundation-guards.test.ts` (modified) — `TRIPWIRE_MODULES` 66 → 67.

## Decisions Made

Recorded in full in the `key-decisions` frontmatter. The three that shaped the implementation most:

1. **The guard walks the compiled `.js`, not the `.ts`.** The read-only claim has to be true of the artifact a host runs. This also makes the closure walker usable directly, since it resolves committed `.js` relative specifiers.
2. **Descriptor-prefix stem anchoring instead of substring matching.** A bare substring match over D-21's stems also catches `readlink` and `readlinkSync` — read-only symbols that would then red the guard for no reason, and a guard that reds for no reason gets loosened until it stops noticing. Anchoring at a descriptor prefix (`stem`, or `f`/`l`/`create`/`file` + `stem`) admits `ftruncate`, `lchmod`, `futimes`, `createWriteStream` and refuses `readlink` by construction — which is also what makes `opendir`, `opendirSync` and `openAsBlob` genuinely the *only* three stem false positives, exactly as the plan states.
3. **The `check:*` deviation is recorded in the file it deviates for.** The vitest-wrapper shape, the 25-of-25 invariant it preserves, the rejected stdlib-second-scanner alternative and the deliberate absence of a named CI step are all written into the test's docblock, so a later reader finds a decision rather than an inconsistency to "fix".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The five-member ban does not cover the socket family**

- **Found during:** Task 2 (the module ban)
- **Issue:** D-21 names five banned modules — `child_process`, `net`, `http`, `https`, `worker_threads`. None of them covers `node:http2` (a listening HTTP/2 server, not reachable through `node:http`), `node:dgram` (UDP sockets), `node:tls` (`tls.createServer`), `node:cluster` (forks workers and shares server handles) or `node:inspector` (`inspector.open()` starts a WebSocket server on a port). A dashboard importing any of them would open a listening socket while the guard stayed green, which is the exact property DASH-08 exists to deny. The 32-03 carry-forward named this gap.
- **Fix:** Added `ADDITIONAL_BANNED_MODULES` as a **second** named set with its own two-sided cardinality assertion (5), each member carrying the reason it belongs. It is a second set rather than five more members of the first specifically so that D-21's own asserted cardinality stays exactly the number D-21 states, and the extension stays visibly an extension.
- **Files modified:** `scripts/board-readonly.test.ts`
- **Verification:** `the socket-family extension has exactly five members` and `the dashboard closure imports no banned module` (the ban is over the union) both green; the planted-`node:net` discrimination case proves the union predicate can fail.
- **Committed in:** `8751f557`

**2. [Rule 2 - Missing Critical] The ban was spelling-sensitive**

- **Found during:** Task 2
- **Issue:** `import { createServer } from "net"` and `from "node:net"` load the same module. A ban comparing literal specifier strings would be a ban an import walks around by deleting five characters. Same for `fs` vs `node:fs` on the symbol half.
- **Fix:** `normalizeSpecifier` strips the `node:` prefix; both the fs-module test and the ban compare normalized identity.
- **Files modified:** `scripts/board-readonly.test.ts`
- **Verification:** `the UN-PREFIXED spelling of a banned module is caught too` — a mirror with `import { createServer } from "net"` reds the ban.
- **Committed in:** `8751f557`

**3. [Rule 2 - Missing Critical] An undecidable fs acquisition would have contributed an empty set**

- **Found during:** Task 1
- **Issue:** The derivation is syntactic. A dynamic `import("node:fs")`, a `require("node:fs")`, an `export * from "node:fs"` or a computed member access on an fs namespace names no symbol the pass can read — so each would have quietly contributed **nothing** to the union, and the intersection would have stayed empty while a writer sat behind the opaque route. A short answer reads exactly like a clean one.
- **Fix:** Each such route is collected into `opaqueFsAcquisitions` / `opaqueSpecifiers` and asserted absent as a `PREMISE:`. The guard refuses rather than reporting short.
- **Files modified:** `scripts/board-readonly.test.ts`
- **Verification:** `a module acquiring node:fs by a route the pass cannot name is REFUSED, not ignored` — a mirror with `await import("node:fs")` planted into `scripts/board-read.js` makes the premise case fail.
- **Committed in:** `8751f557`

**4. [Rule 3 - Blocking] `TRIPWIRE_MODULES` fired on the new test module**

- **Found during:** Task 3 (full-suite verification)
- **Issue:** `scripts/check-foundation-guards.test.ts` pins the number of test modules two-sided at 66, deliberately EXACT because a module arriving is a structural event. Adding `scripts/board-readonly.test.ts` made it 67 and the full suite went red — the pin working, not the pin being in the way.
- **Fix:** `TRIPWIRE_MODULES` 66 → 67, **re-derived** (`ls scripts/*.test.ts | wc -l` → 67) rather than incremented, with the reason written out beside the constant in the repository's established comment format. The pin was moved **after** the run that fired it, in which that module's other 285 cases had already read the new file and reported zero findings — so the pin moved because a module landed, not to make a red go away.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `scripts/check-foundation-guards.test.ts` 286 passed; full suite 73 files / 4647 passed | 2 skipped.
- **Committed in:** `e3a70658`

**5. [Rule 1 - Bug] The version label printed nothing**

- **Found during:** Task 1
- **Issue:** The first implementation emitted the `board-readonly: mutating fs symbols …` line with a module-scope `console.log`. Measured against vitest 4.1.8's default reporter, it printed **nothing at all** — and a hook-scope or in-test `console.log` printed nothing either (the default reporter surfaces console output only for failing tests; `--reporter=verbose` shows it, and CI does not pass that flag). "Printed on every run" would have been a claim with no output behind it, and the acceptance criterion greps for the exact prefix.
- **Fix:** `process.stdout.write` from a file-level `beforeAll`, which was measured to print under the default reporter from both a hook and a test. The three measurements are recorded in a comment beside the call so the shape is not "tidied" back later.
- **Files modified:** `scripts/board-readonly.test.ts`
- **Verification:** `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-readonly.test.ts 2>&1 | grep -cF 'board-readonly: mutating fs symbols'` → 1, and the line survives a `-t "no socket"` filtered run.
- **Committed in:** `f4f26801`

---

**Total deviations:** 5 auto-fixed (3 missing-critical, 1 blocking, 1 bug)
**Impact on plan:** No scope creep. Three of the five close holes in the guard's own coverage that the plan's wording did not reach; one is a repository-wide structural pin doing exactly what it exists to do; one is a measured correction to how the required output line reaches stdout. The plan's stated cardinalities (3 exclusions, 5 D-21 banned modules, 6 closure fs symbols) are all preserved verbatim.

## Issues Encountered

- **The plan's `read_first` says `package.json` holds 15 `check:*` entries; it holds 10.** The count did not affect anything — the deviation being recorded is "this is the first entry that is not the two-step shape", which is true of 10 as of 15. Noted so a later reader does not treat the discrepancy as evidence of a missing file.
- **The research's 53-symbol Node 24 enumeration was not reproducible from D-21's stems as stated.** A substring match yields 61 (it also catches `readlink`, `readlinkSync`, `fchmod`, `fchown`, the stream classes); the descriptor-prefix rule adopted here yields 60, differing from the research's 53 by the four `fchmod`/`fchown` forms (genuinely mutating, and the research's probe appears to have missed them) and the stream classes. The plan already removed the dependency on this number by printing it rather than pinning it, so the discrepancy changes nothing — but it is recorded rather than quietly reconciled.

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or FIXME was introduced, and no test is skipped.

## Threat Flags

None. This plan adds a test module and one npm script; it introduces no network endpoint, no auth path, no new file-access pattern and no schema change. The plan's own `<threat_model>` entries T-32-04, T-32-18, T-32-19, T-32-20, T-32-21 and T-32-SC are the threats this plan *mitigates*, each with the mitigation now in code:

| Threat | Mitigation in this plan |
|--------|-------------------------|
| T-32-04 | AST-derived per-module symbol sets intersected with a derived mutating set; planted-writer discrimination with a recorded RED baseline |
| T-32-18 | Second AST pass over bare specifiers, over a set asserted non-empty first; planted-`node:net` discrimination |
| T-32-19 | Five `PREMISE:` assertions in front of every emptiness claim, plus the opaque-acquisition refusal |
| T-32-20 | The blocking pin is the closure's own symbol set; the runtime cardinality is printed and version-labelled |
| T-32-21 | One implementation; the `check:` entry is a wrapper, and the rejected second-scanner alternative is recorded in the docblock |
| T-32-SC | `dependencies === undefined` asserted in-suite; `git diff --exit-code -- package-lock.json` exits 0 |

## TDD Gate Compliance

Tasks 1 and 2 carry `tdd="true"`. The RED/GREEN shape here is inverted from the usual one and the record should say so plainly: the deliverable **is** the test, and the property under test (the projector is read-only) was already true of the tree, so the guard was green the moment it was written. A green-on-first-run test is not evidence of anything.

The plan's design substitutes a **discrimination** proof for the ordinary RED, and that proof was captured before either half was claimed to pass:

- **RED** — `32-06-RED-baseline.txt`: `writeFileSync` planted into the committed `scripts/board-read.js` → 4 failed | 18 passed; `node:net` planted into the committed `scripts/board-dashboard.js` → 2 failed | 20 passed. Both plants reverted with `git checkout -- <one file>`; `git status --short scripts/` clean afterwards.
- **GREEN** — `32-06-GREEN-proof.txt`: the unplanted run, 22 passed at capture time and 24 passed after task 3, plus the whole-suite run.

Gate commits present: `test(32-06)` × 2 (`f4f26801`, `8751f557`), `feat(32-06)` × 1 (`e3a70658`). No `refactor(32-06)` commit — no cleanup was needed. `workflow.tdd_mode` is `false` in `.planning/config.json`, so this section is a record rather than a gate result.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **DASH-06 and DASH-08 are both mechanically enforced.** Any later plan that adds a module to the dashboard's import closure will be told by name, on both the member case and the count case, that it moved the pin.
- **One standing obligation for whoever adds to the closure:** the guard reads the committed `.js`, so `npm run build` must precede any run after a `.ts` edit, or the guard decides the read-only property of a stale artifact. This is the same carry-forward 32-03 recorded.
- **A named residual, disclosed rather than left silent:** the derivation is syntactic. An aliased re-export chain through an intermediate module (`export { writeFileSync as w }`) resolves to the alias, not to the writer. The opaque-acquisition refusal closes dynamic and computed routes; the alias route is named in the test's docblock as what the guard does not close, and what bounds it is that every closure module is a small, reviewed file in this repository.

## Self-Check: PASSED

- `scripts/board-readonly.test.ts` — FOUND
- `32-06-RED-baseline.txt` — FOUND
- `32-06-GREEN-proof.txt` — FOUND
- `package.json` — FOUND
- Commits `f4f26801`, `8751f557`, `e3a70658`, `bfc641c1` — all FOUND in `git log --oneline --all`
- `git rev-list --count ffd9f6ff..HEAD` → 4, matching the `commits:` frontmatter
- Plan `<verification>` re-run in full: guard green (24), `npm run check:dashboard-readonly` exit 0, full suite green (73 files / 4647 passed | 2 skipped), lockfile unchanged, no `dependencies` key, `git status --porcelain install/` empty, `find .temp -mindepth 1` empty, both evidence files present at the repository root

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*
