---
phase: 32-board-projector-cli-dashboard
plan: 10
subsystem: security
tags: [path-traversal, symlink, realpath, containment, asvs-v12, typescript, ast-census]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "the read seam (32-03), its per-entry failure degradation and swallow census (32-09), and the CR-04 reproduction recorded in 32-VERIFICATION.md:94-103"
provides:
  - "insideRoot() — the one containment authority in scripts/board-read.ts, deciding on realpathSync rather than on the lexical spelling"
  - "anchorAbsentTarget() — the ENOENT arm: an absent path is placed by its deepest REAL ancestor, so a check cannot expire when the attacker creates the file"
  - "ChildPath — childPath's discriminated result, so a per-entry refusal is a readErrors entry with a code instead of a silent skip"
  - "guarded() — a containment refusal is ONE source's stale arm, never the end of the snapshot (D-12)"
  - "an AST routing census that DERIVES the path-authority set from the file and pins it two-sided"
  - "the containment rule, the path-only disclosure rule and their stated bound, normative in agent-factory/contracts/board.md"
affects: [board projector, dashboard renderer, any future web renderer consuming FactorySnapshot, phase 32 verification round 2]

actuals:
  tokens: 34717
  tasks: 3
  commits: 4
plan_head_before: 888a1302b197ef4f37bbd8fed2cdde09a4ed558d

tech-stack:
  added: []
  patterns:
    - "One containment authority, called by both path producers — never a second spelling of the same comparison"
    - "A refusal carries a CODE, so an escape and a denied mode are not reported under one word"
    - "The authority reports the path it refused (ChildPath.target), so no caller composes a read target of its own"
    - "Derive the allowed set from the file and pin it two-sided, rather than typing a list that rots while green"
    - "Record a measured residual in the code, the contract, the proof and the ledger rather than claiming closure"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-10-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-10-GREEN-proof.txt
  modified:
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-read.test.ts
    - agent-factory/contracts/board.md
    - .planning/WINDOWS.md

key-decisions:
  - "Containment is decided on realpathSync at ONE authority (insideRoot), and the REAL path is what the caller opens — so a check made before a link swap is still the check that governs the read."
  - "An ENOENT target is placed by its deepest REAL ancestor, not admitted on ENOENT alone. The plan's sketched arm would have admitted `../escape` and any absent path under an out-of-tree parent, which is a check that expires the moment the attacker creates the file."
  - "A containment refusal carries the code OUTSIDE-ROOT; a resolution failure carries its ERRNO. Collapsing both into one code is CR-02's discarded errno one register over, and it broke a 32-09 case on the first attempt."
  - "guarded() catches BoardReadError and nothing else. Widening it to a catch-all would hide the next defect the way the bare catch 32-09 removed hid this one."
  - "The hard-link shape is NOT closed and is recorded as a measured residual rather than papered over: no path-based rule can refuse it, and `nlink > 1` was declined as a heuristic over a legitimate filesystem property."

patterns-established:
  - "Derived-and-pinned authority census: the allowed producer set is 'every function that calls realpathSync or insideRoot', computed from the AST, then pinned two-sided — a sixth name is a second containment spelling"
  - "Path-helper closure: a function that hands one of its own parameters to a read primitive is derived as an exemption and pinned, so the exemption cannot widen silently"
  - "Adversarial battery before claiming closure: relative link, link chain, linked directory, symlink loop, hard link — each probed against the shipped CLI, each result recorded"

requirements-completed: [DASH-03, DASH-05]

coverage:
  - id: D1
    description: "A symlink under plans/tickets/ pointing outside the repository root is refused — neither its content nor any prefix of it reaches stderr or the --json document."
    requirement: "DASH-05"
    verification:
      - kind: unit
        ref: 'scripts/board-read.test.ts#refuses a ticket symlinked OUTSIDE the root and quotes no byte of the target'
        status: pass
      - kind: integration
        ref: '.planning/phases/32-board-projector-cli-dashboard/32-10-GREEN-proof.txt (node scripts/board-dashboard.js <tree> --once --json; marker count 0 on stdout and 0 on stderr, was 1 and 1)'
        status: pass
    human_judgment: false
  - id: D2
    description: "The refusal is VISIBLE — a readErrors entry naming the entry path and the resolved destination, never a silent skip and never a killed snapshot."
    requirement: "DASH-05"
    verification:
      - kind: unit
        ref: 'scripts/board-read.test.ts#refuses an out-of-root symlinked ANCESTOR (`plans` itself) without throwing'
        status: pass
      - kind: unit
        ref: 'scripts/board-read.test.ts#refuses only the linked source and leaves the other five exactly as they were'
        status: pass
    human_judgment: false
  - id: D3
    description: "A symlink pointing INSIDE the repository root is still read and still joined; a dangling symlink and a legitimately absent path are still absent, not refusals."
    requirement: "DASH-05"
    verification:
      - kind: unit
        ref: 'scripts/board-read.test.ts#ADMITS an in-root symlink and joins the ticket it points at'
        status: pass
      - kind: unit
        ref: 'scripts/board-read.test.ts#answers a DANGLING symlink as absent, not as a refusal'
        status: pass
      - kind: unit
        ref: 'scripts/board-read.test.ts#the legitimate shapes containment must not turn into faults (plan 32-10) — six cases'
        status: pass
    human_judgment: false
  - id: D4
    description: "Every one of the six sources converts a containment refusal into that source's own readErrors entry; one refused source never blanks the other five."
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: 'scripts/board-read.test.ts#pins the guard count against SOURCE_NAMES, two-sided'
        status: pass
      - kind: unit
        ref: 'scripts/board-read.test.ts#PROPAGATES a plain Error raised inside a guarded source read'
        status: pass
      - kind: unit
        ref: 'scripts/board-read.test.ts#CATCHES a BoardReadError raised at the same place, as that source finding'
        status: pass
    human_judgment: false
  - id: D5
    description: "Every read target in scripts/board-read.ts is produced by repoSubpath, childPath or insideRoot, proven by a census derived from the file itself."
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: 'scripts/board-read.test.ts#finds no read target built outside those authorities (17 call sites inspected, printed every run)'
        status: pass
      - kind: unit
        ref: 'scripts/board-read.test.ts#PREMISE: the census DETECTS a planted raw join, so its emptiness is a measurement'
        status: pass
    human_judgment: false
  - id: D6
    description: "The containment rule and the path-only disclosure rule are normative in agent-factory/contracts/board.md, with their bound stated."
    verification:
      - kind: integration
        ref: 'VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js → ALL CHECKS PASSED'
        status: pass
    human_judgment: true
    rationale: "Whether the contract's wording states the rule at the right altitude, and whether the stated bound reads as an honest limit rather than as a disclaimer, is an editorial judgment no test asserts."
  - id: D7
    description: "The hard-link residual: a hard link inside the tree to an inode named outside it is READ, and that is recorded rather than closed."
    verification:
      - kind: unit
        ref: 'scripts/board-read.test.ts#RECORDS the hard-link residual: a path-based rule cannot see it, and that is measured'
        status: pass
    human_judgment: true
    rationale: "The residual is measured and pinned, but whether leaving it open is acceptable — against its stated bounds — is a risk acceptance a human owns, not a test result. Logged in .planning/WINDOWS.md."

duration: 30min
completed: 2026-09-14
status: complete
---

# Phase 32 Plan 10: Containment on the Real Path Summary

**`insideRoot()` decides containment on `realpathSync` at one authority, `childPath` returns a discriminated refusal instead of a silent `null`, and `guarded()` turns a refusal into one source's stale badge — closing CR-04, the phase's security blocker, with the hard-link residual measured and recorded rather than claimed closed.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-09-14T20:50:42Z
- **Completed:** 2026-09-14T21:20:45Z
- **Tasks:** 3
- **Files modified:** 5 (plus 2 created)

## Accomplishments

- **CR-04 is closed at the mechanism, not at the symptom.** The verifier's own transcript, re-run against the rebuilt `scripts/board-dashboard.js`, puts the marker token **0 times on stdout and 0 times on stderr** where the RED baseline recorded **1 and 1**. What replaced it is a `readErrors` entry with code `OUTSIDE-ROOT` naming the entry and its resolved destination and quoting no byte of the target.
- **`scripts/board-read.ts`'s module header is true again.** It claimed "every target is additionally asserted inside the resolved root before it is read" while `resolve()` did not follow symlinks and `readFileSync` did — a `CLAUDE.md` "No fabrication" violation sitting on top of the traversal. The header now describes what the code does and names the defect it used to conceal.
- **The ancestor case is the same question, asked once.** A symlinked `plans/` directory used to render an entire board an attacker chose under an `[ok]` header with no refusal anywhere. `realpathSync` resolves every ancestor link, so one authority answers both shapes; the ancestor case now produces three `OUTSIDE-ROOT` entries and an `unavailable` board.
- **A refusal is one source's finding.** `guarded()` wraps all six source reads, so a thrown containment refusal becomes that source's stale arm instead of blanking the other five (D-12, T-32-10-03). It catches `BoardReadError` and rethrows everything else, both arms driven by a test.
- **The two raw `join(taskDir, …)` read targets are closed.** A symlinked `claim.md` inside an otherwise legitimate claimed task, and a symlinked `index.jsonl` inside a legitimate context task, are now refused; their siblings still appear.
- **The routing census derives its own allowed set.** It parses the module, computes the path authorities as "every function that calls `realpathSync` or `insideRoot`", pins that set two-sided, derives the path-HELPER exemption set by closure and pins that too, inspects 17 read-primitive call sites (count printed on every run) and proves it DETECTS a planted raw join.
- **The legitimate-input battery is six positive cases**, not six absences of a throw: a fresh checkout with no `.grugops/`, an empty `plans/tickets/`, a symlinked repository root, a relative `repoRoot`, an in-root symlinked directory, and the committed fixture. The golden is byte-identical and the DASH-06 closure pin did not move.
- **The one deliberate behaviour change is measured.** A `--symlink`-installed `agent-factory/` puts the dial outside the root: the config source settles `stale` carrying the LEAN view, one visible `OUTSIDE-ROOT` entry, overall `stale`, no leak. Recorded in `insideRoot`'s docblock beside the two reasons (`install.ts` states `agent-factory/config` is deliberately absent from the installed kit; `config` is the one source with a defined fallback, per CLAUDE.md C6).

## Task Commits

1. **Task 1 (RED): reproduce CR-04** — `e42bc872` (test) — the RED baseline and the containment cases; 3 failed / 77 passed, each failure an assertion about the planned behaviour.
2. **Task 1 (GREEN): decide containment on the real path** — `b7789e20` (feat) — `insideRoot`, `anchorAbsentTarget`, `ChildPath`, `guarded`, the corrected header.
3. **Task 2: derive the routing census** — `01ca02fa` (test) — the authority census, the guard census, the one-source-refused and rethrow cases.
4. **Task 3: the legitimate-input battery and the contract** — `806129b1` (test) — six positive cases, the measured symlink-install outcome, the adversarial battery, the recorded hard-link residual, the contract sentences and the GREEN proof.

**Plan metadata:** see the `docs(32-10)` commit that follows this file.

_Measured, not narrated: `git rev-list --count 888a1302..HEAD` = 4 at the time this summary was written._

## Files Created/Modified

- `scripts/board-read.ts` — `insideRoot`, `anchorAbsentTarget`, `isWithinRoot`, `staleReasonForCode`, `guarded`, `OUTSIDE_ROOT`; `repoSubpath` and `childPath` rewritten onto the authority; `BoardReadError` carries a code; four per-entry call sites report refusals; corrected module header and a docblock recording the symlink-install measurement and the hard-link residual.
- `scripts/board-read.js` — the committed build of the above (`npm run check:build-parity` green).
- `scripts/board-read.test.ts` — +23 cases: the CR-04 reproduction, the in-root/dangling admission arms, the routing and guard censuses with their planted-defect discriminations, the one-source-refused case, the rethrow pair, the six legitimate shapes, the symlink-install measurement, and the adversarial battery.
- `agent-factory/contracts/board.md` — § Staleness gains the containment rule, the path-only disclosure rule and the stated bound.
- `.planning/WINDOWS.md` — the hard-link residual logged as an open entry.
- `.planning/phases/.../32-10-RED-baseline.txt`, `32-10-GREEN-proof.txt` — the before and the after, same commands.

## Decisions Made

Recorded in `key-decisions` above. The two that changed the plan's own shape:

1. **The ENOENT arm anchors on the deepest real ancestor.** The plan sketched `realpathSync` throws `ENOENT → { ok: true, real: target }`. Implemented literally, that admits `../escape` (outside, merely not existing yet — which would have re-broken the pre-existing `scripts/board-tracer.test.ts` containment case) and admits `plans/board.md` under a `plans` that links out of the tree, so the read returns ENOENT today and reads the attacker's file the moment they create it. A check that expires is not a check.
2. **A refusal carries a code.** The plan named one literal, `OUTSIDE-ROOT`. Reporting an `EACCES` met while RESOLVING under that literal loses the errno — which is exactly the CR-02 defect 32-09 had just paid a verification round to fix, one register over. It was caught by a 32-09 test going red on the first build, and it is now structural: `BoardReadError` and `Containment` both carry a code, and `staleReasonForCode` is the one spelling of the errno→reason mapping (three hand-written copies collapsed into it).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The ENOENT arm would have admitted an out-of-tree absent path**
- **Found during:** Task 1
- **Issue:** The plan's arm 2 (`ENOENT → { ok: true, real: target }`) admits any path that does not exist, including one outside the root and one under an out-of-tree symlinked ancestor.
- **Fix:** `anchorAbsentTarget()` walks to the deepest existing ancestor, resolves it, requires it to be the root or inside it, and re-composes the missing tail. An ancestor that fails for any errno other than ENOENT is refused under that errno rather than guessed.
- **Files modified:** `scripts/board-read.ts`
- **Verification:** the pre-existing `board-tracer.test.ts` case `repoSubpath(root, "../escape")` throws; the ancestor reproduction in `32-10-GREEN-proof.txt` shows `plans/traceability.md` refused under "does not exist and its nearest existing parent is outside the repository root".
- **Committed in:** `b7789e20`
- **Consequence for an acceptance criterion:** Task 1's criterion `grep -v '^\s*//' scripts/board-read.ts | grep -c 'realpathSync('` returns **3, not the 2 the plan named** — `resolveRepoRoot`, `insideRoot`, and `anchorAbsentTarget`. All three are the containment authority (the ENOENT probe is `insideRoot`'s own arm), and the criterion's intent — "a third call site means a second containment spelling exists" — is now checked by something stronger and non-gameable: the census derives the authority set from the AST and pins it two-sided at exactly `[anchorAbsentTarget, childPath, insideRoot, repoSubpath, resolveRepoRoot]`.

**2. [Rule 2 - Missing Critical] A containment refusal needed its own code, or CR-02 returns**
- **Found during:** Task 1 (a 32-09 case went red on the first build)
- **Issue:** Reporting every refusal under the literal `OUTSIDE-ROOT` meant an `EACCES` met while resolving a context task directory was reported as an escape — the discarded errno CR-02 was about.
- **Fix:** `BoardReadError` and the internal `Containment` result carry a `code`; `staleReasonForCode()` is now the one spelling of the errno→`StaleReason` mapping and the three hand-written copies were routed through it.
- **Files modified:** `scripts/board-read.ts`
- **Verification:** the 32-09 case `names a task directory whose own mode denies the stat` passes with code `EACCES`; the adversarial battery shows a symlink loop reported as `ELOOP`, not as an escape.
- **Committed in:** `b7789e20`

**3. [Rule 2 - Missing Critical] `ChildPath` carries the path it refused**
- **Found during:** Task 1
- **Issue:** Reporting a refusal required the caller to compose `join(dir, name)` — a path composition at a call site, indistinguishable from a read target to any census, and the thing Task 2's `join(taskDir` criterion exists to forbid.
- **Fix:** the refusal arm carries `target`, the path the authority itself spelled. Every call site reports `child.target` and composes nothing. `childPath` is now exported so its `unsafe-name` arm can be driven directly (`readdirSync` cannot produce `..`).
- **Verification:** `grep -v '^\s*//' scripts/board-read.ts | grep -c 'join(taskDir'` → `0`; the routing census finds no unvouched read target.
- **Committed in:** `b7789e20`

**4. [Task boundary, not scope] `guarded()` and the three call-site updates landed in Task 1's commit**
- **Found during:** Task 1
- **Issue:** Task 1's own `<behavior>` requires `readSnapshot` NOT to throw when `plans` is linked out of the tree, which is only true once a guard exists; and changing `childPath`'s return type makes updating all three call sites a compile requirement, not a choice.
- **Fix:** `guarded`, the three call sites and the two raw joins landed with Task 1. Task 2 then delivered its own subject — the derived censuses and the behavioural cases. No work was added or dropped; the boundary moved.
- **Committed in:** `b7789e20` (mechanism), `01ca02fa` (censuses and cases)

**5. [Rule 2 - Missing Critical] The contract states the bound as well as the rule**
- **Found during:** Task 3
- **Issue:** The plan specified two contract sentences. With the hard-link residual measured, two sentences would leave a normative document asserting a containment guarantee wider than the one the code has — the fabrication class `CLAUDE.md` forbids.
- **Fix:** a third clause states that the rule is over PATHS and that a hard link inside the repository to a file named outside it is read and recorded rather than prevented.
- **Files modified:** `agent-factory/contracts/board.md`
- **Verification:** `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` → ALL CHECKS PASSED
- **Committed in:** `806129b1`

---

**Total deviations:** 5 (4 missing-critical auto-fixes, 1 task-boundary adjustment)
**Impact on plan:** Every auto-fix closed a bypass the plan's own sketch would have shipped, and each is recorded where the mechanism lives. No scope was added. One acceptance criterion (the `realpathSync` count of 2) is **not met as written** — the honest count is 3 — and is replaced by a stronger derived census; that substitution is called out above rather than buried.

## Known Stubs

None.

## Known Residuals

**Hard links are not refused, and no path-based rule can refuse them.** A hard link created inside the repository to an inode whose other name is outside it resolves — correctly — to a path inside the root, because a hard link is not a reference to another path; it IS a directory entry for the inode. The probe measured the leak (marker count 1 on both channels). `nlink > 1` was considered and declined: it is a heuristic over a legitimate filesystem property, and this repository's own record is that a heuristic in place of a structural rule is the shape that produces the next round's bypass.

Bounded by: creating the link requires write access to the tree, which is the same access that would let an attacker paste the bytes into a ticket file directly; hard links cannot cross a filesystem; and both Linux (`fs.protected_hardlinks`, on by default) and macOS restrict linking to files the caller may already read.

Recorded in `insideRoot`'s docblock, in `agent-factory/contracts/board.md` § Staleness, in `32-10-GREEN-proof.txt` Part Three, and as an open entry in `.planning/WINDOWS.md`. `scripts/board-read.test.ts` pins the MECHANISM (`realpathSync` of a hard link answers with the in-tree path), so the day the platform changes, the suite says so.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change entered the tree; the change narrows an existing file-access surface. `STALE_REASONS` is still 5, `SCHEMA_VERSION` is unchanged and the golden is byte-identical.

## Issues Encountered

- **The first build turned a 32-09 case red** (`names a task directory whose own mode denies the stat` expected `EACCES`, got `OUTSIDE-ROOT`). That was the fix conflating two findings under one code — the CR-02 class one register over — and it is why refusals now carry an errno. Resolved structurally, not by relaxing the assertion. This is the most useful thing that happened in this plan: the previous round's test caught this round's regression on the first run.
- **The routing census initially reported `resolveRepoRoot:553 statSync(real)` as unvouched.** `real` is assigned directly from `realpathSync`, which is not a function this module declares. Resolved by accepting `realpathSync` — and only `realpathSync` — as a producing call, documented at the predicate: `join`, `resolve` and `relative` produce spellings, not real locations.
- **`console.log` in a vitest premise print is buffered by the default reporter.** The project had already measured this at `scripts/board-readonly.test.ts:420-428`; the census print uses `process.stdout.write` from a file-level `beforeAll` for the same reason.

## Verification Run

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` (whole suite, no live e2e lane) | **74 files, 4756 passed, 2 skipped** |
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-read.test.ts` | 103 passed; census prints 17 call sites |
| `npm run build && npm run typecheck && npm run check:build-parity` | pass — "no tracked build output moved when tsc ran" |
| `npm run check:dashboard-readonly` | 24 passed; the DASH-06 closure pin did not move (57 mutating symbols, 6 closure fs symbols) |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | ALL CHECKS PASSED |
| `git diff --exit-code -- scripts/fixtures/board-snapshot/expected-snapshot.json` | clean — the golden is byte-identical |
| `npm run check:nul-bytes` | ALL CHECKS PASSED (2043 files scanned) |
| CR-04 transcript re-run against the rebuilt CLI | marker count **0 / 0** (RED baseline: 1 / 1) |

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **CR-04 is closed and proved.** Round 2 of phase 32 verification can re-run the transcript at `32-VERIFICATION.md:94-103` against `32-10-GREEN-proof.txt`.
- **This plan does NOT flip phase status.** `REQUIREMENTS.md` marks DASH-03/DASH-05 per the shared-ID gate; the ROADMAP phase row is not set to Complete here. CR-01 (the DASH-06 namespace-destructure bypass), CR-05 (stderr sanitization) and CR-06 (the surviving second frontmatter authority in `validate-agent-factory.ts`) are still open from 32-VERIFICATION.md and belong to other gap-closure plans.
- **One open residual carries forward** — the hard link, logged in `.planning/WINDOWS.md`. It is a risk acceptance a human owns, and it will block `/gsd-ship` until dispositioned.
- **Project-memory note for the next round:** the fix caught its own regression because a PREVIOUS round's test (32-09's EACCES case) was specific about an errno. Specificity in an old assertion is what made the new defect visible on the first build — worth preserving when the temptation is to relax an assertion the new code disagrees with.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*

## Self-Check: PASSED

- Every file in `key-files.created` exists on disk (`32-10-RED-baseline.txt`, `32-10-GREEN-proof.txt`).
- Every task commit hash resolves in `git log --all`: `e42bc872`, `b7789e20`, `01ca02fa`, `806129b1`, plus the docs commit `06330f07`.
- The whole suite minus the live e2e lane is green: 74 files, 4756 passed, 2 skipped.
