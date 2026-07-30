---
phase: 27-spawn-correctness-kit-set-authority
plan: 21
subsystem: installer
tags: [installer, exit-codes, fail-loud, precheck, contract-change]
status: complete
requires:
  - "27-13's conditional INCOMPLETE banner in both installers"
  - "scripts/coordinator-resolution-precheck.ts runScratchInstall() (27-17)"
provides:
  - "installer exit code 3 = INCOMPLETE, in both install.js and uninstall.js"
  - "a documented four-rung installer exit ladder in install/README.md"
  - "a two-signal refusal in runScratchInstall(): non-zero status OR the INCOMPLETE banner"
affects:
  - "install/install.ts, install/uninstall.ts (27-22 also edits install.ts — surface left coherent)"
  - "any machine consumer chained after the installer"
tech-stack:
  added: []
  patterns:
    - "the machine-readable signal is set on the SAME branch that prints the human-readable one"
    - "a gate checks two independent signals over one captured run, and names which fired"
key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/install.test.ts
    - install/README.md
    - scripts/coordinator-resolution-precheck.ts
    - scripts/coordinator-resolution-precheck.js
decisions:
  - "option-a: an install or uninstall run that printed the INCOMPLETE banner exits 3 (human decision, blocking checkpoint)"
  - "the plan's stated con for option-a was factually wrong — code 2 was already in use for bad usage; recorded as a correction rather than repeated"
  - "the --allow-self guard arm's status pin moved to 3 and was STRENGTHENED rather than weakened; its fixture is untouched"
metrics:
  duration: ~35m
  completed: 2026-07-30
requirements: [KIT-02, SPAWN-03, SPAWN-07]
closes_findings: [WR-01]
---

# Phase 27 Plan 21: Installer INCOMPLETE Exit Code Summary

Both installers now exit **3** on the branch that prints the `INCOMPLETE` banner, so a chained
consumer stops instead of proceeding over a class that was never installed — and the coordinator
precheck refuses on the banner as well as on the status.

## Task 1 — the human decision, recorded verbatim

**Selected: `option-a` — exit 3 for an incomplete run.** The human's wording, verbatim:

> option-a — exit 3 (Recommended)
> Exit ladder after the change:
>   0  complete / doctor PASS
>   1  refused (target is the grugops source checkout) / doctor FAIL
>   2  bad usage (unknown argument)
>   3  incomplete  ← NEW
> precheck gate `if (r.status !== 0)` now fires correctly on an incomplete install.

Two points were relayed to the human and accepted before the selection stood:

1. **The plan's stated con for option-a is factually wrong.** The plan says option-a "reserves 2 for
   a usage error that does not exist yet." Code 2 was *already* in use for bad usage before this plan
   — `install/install.ts:100` and `install/uninstall.ts:71` both `process.exit(2)` on an unknown
   argument. Option-a therefore **documents the ladder already in the source and appends one free
   rung**; it reserves nothing. This correction is recorded here rather than the plan's wrong
   rationale being repeated. Verified after the change: `install.js --nonsense` → 2,
   `uninstall.js --nonsense` → 2.
2. **The accepted cost is explicit.** Consumers written `install.js && next-step` that proceed today
   will now stop. That is the intent of the change, and the human accepted it knowingly.

Because option-a was selected, the full four-move atomic change was in scope. All four landed in one
commit (`ae323b8`); no partial application occurred.

## What Was Built

### Move 1 — both installers

`install/install.ts` and `install/uninstall.ts` call `process.exit(3)` inside the `VERIFY_FINDINGS > 0`
branch, immediately after the banner and its remedy line. Placing it on the same branch that prints
the banner is the mitigation for T-27-104: the two signals are emitted by one `if`, so they cannot
diverge. Each site carries a comment naming the full code list and stating it is the machine-readable
half of the conditional claim.

### Move 2 — the test pins (see the enumeration below)

### Move 3 — the precheck gate

`runScratchInstall()` in `scripts/coordinator-resolution-precheck.ts` now captures stdout+stderr once
and applies **two** independent refusals to that same captured run:

- `r.status !== 0` → fails, and appends `= INCOMPLETE` to the message when the code is 3.
- the output contains `install INCOMPLETE` → fails with a message saying the banner and the status
  disagree.

The `ran cleanly` line is unreachable when either holds. The banner check is **not** redundant with
the status check — it is the backstop for a future edit that reintroduces a success exit under the
INCOMPLETE branch. That claim was verified adversarially rather than asserted (see below).

### Move 4 — the README

`install/README.md` §2 gained an **"Exit codes — what the installer tells a script"** subsection: a
four-row table (0/1/2/3), placed immediately before "Choosing the target" so a reader scripting the
install meets it before the flags. It states plainly that a chained command stops on 3 and why.
`grep -c -i "exit" install/README.md` now reports **2** where it reported **0**.

## The test-pin enumeration — and the discrepancy, reported honestly

The plan required the pins be enumerated **from the source**, not taken from the review's count of
four. Three successive enumerations gave three different answers. This matters because it is the same
set-literal-drift class the phase exists to delete, so all three are recorded.

| Enumeration method | Count | Why it was wrong or right |
|---|---|---|
| The review's stated count | 4 | Undercount. |
| The prior agent's search for the banner substrings | 3 lines | Wrong unit — it counted *assertion lines*, and one of the three (`:1404`) is the **negative** assertion inside the positive control, not a pin. Two real pins. |
| Grep for the banner substring **or** the absence of `== install complete` | 6 cases | Closer, but still short — it can only find cases that assert on the banner text at all. |
| **The suite itself, run against the new binary** | **7 cases** | Authoritative. |

**The enumerated list of cases whose status pin moved from `0` to `3` — length 7:**

| # | Test case | Line of the pin | How it was found |
|---|---|---|---|
| 1 | `source derivation: an UNREADABLE source adapter directory is reported and no completion is claimed` | ~1421 | banner substring |
| 2 | `source derivation: an unreadable-by-PERMISSIONS adapter directory is reported the same way` | ~1448 | absence-of-completion |
| 3 | `source derivation: an EMPTY source adapter directory is a DISTINCT condition from an unreadable one` | ~1468 | absence-of-completion |
| 4 | `source derivation: a NESTED source adapter is refused by name, not silently skipped` | ~1494 | absence-of-completion |
| 5 | `source derivation: an UNREADABLE source skill directory is reported and no completion is claimed` | ~1680 | absence-of-completion |
| 6 | `runnable removal: an unreadable SOURCE is a verify finding, and the run does not claim completion` | ~1646 | banner substring (uninstall) |
| 7 | `D-07 self-checkout guard: refuses a source-shaped target by default; --allow-self overrides` (arm **b**) | ~486 | **only the running suite** |

**Did the length match the review's four? No — it is 7, not 4.** The review undercounted by three.
Reported rather than reconciled.

### Case 7 is the interesting one — and the reason a text search could never have found it

`--allow-self` arm (b) asserts `expect(allowed.status).toBe(0)` and mentions no banner at all, so
every substring search missed it. It installs from a *source-shaped stub* fixture carrying only
`install/install.sh` and `agent-factory/VERSION` — which means it has **no `.claude/agents` and no
`.claude/skills`**, and its run is legitimately INCOMPLETE (2 verify findings) for a reason unrelated
to the guard. Verified directly: that invocation now exits 3 and prints
`== install INCOMPLETE — 2 item(s) need verification ==`.

The old `toBe(0)` assertion **passed only because 0 was returned unconditionally**. It never
distinguished "the guard let it through" from "the install finished" — it was a pin that pinned
nothing. Per the plan's prohibitions, the fixture is left exactly as written and the case was
**strengthened, not weakened**. It now asserts four things where it asserted one:

- `status` is `3` — and explicitly **not** `1`, which is the guard's own refusal code;
- `stderr` does **not** contain the `--allow-self` hint, so the refusal message was not printed;
- `stdout` contains `install INCOMPLETE`, so the run reached the banner tail — it got all the way
  through the install classes rather than exiting early.

### The positive control was tightened too

The conformance case at `install.test.ts:1381` previously read the completion banner off one run and
discarded that run's status. Banner and status are now read off the **same** run
(`clean.stdout` + `clean.status === 0`), which is what actually proves exit 3 is returned only on the
INCOMPLETE branch and never unconditionally. No case that asserts a clean run was moved off `0`.

## RED-before / GREEN-after transcripts

The review's reproduction, replayed against a scratch source copy whose `.claude/agents` is a file:

```
RED (HEAD before this plan)
$ INSTALL_MODE=copy GRUGOPS_SRC=$SP/gsrc GRUGOPS_HOME=$SP/ghome TARGET=$SP/gtgt \
    node $SP/gsrc/install/install.js --yes
  == install INCOMPLETE — 1 item(s) need verification ==
  EXITCODE=0

GREEN (after)
  == install INCOMPLETE — 1 item(s) need verification ==
  EXITCODE=3
```

The uninstaller half, reproduced by installing from a complete source and then removing
`scripts/runnable-ref/reference-check.js` from that source so byte identity cannot be established:

```
RED:   == uninstall INCOMPLETE — 1 item(s) need verification ==   EXITCODE=0
GREEN: == uninstall INCOMPLETE — 1 item(s) need verification ==   EXITCODE=3
```

The complete ladder, all four rungs verified against the built binaries:

| Code | Invocation | Observed |
|---|---|---|
| 0 | clean scratch install | `== install complete ==`, exit 0 |
| 0 | clean scratch uninstall | `== uninstall complete ==`, exit 0 |
| 1 | install into a source-shaped target without `--allow-self` | exit 1, `--allow-self` on stderr |
| 2 | `install.js --nonsense` / `uninstall.js --nonsense` | exit 2 (both) |
| 3 | install over an unreadable `.claude/agents` | banner + exit 3 |
| 3 | uninstall over an unreadable runnable source | banner + exit 3 |

`DRY_RUN=1` over an incomplete source also exits 3, printing
`== install INCOMPLETE — 1 item(s) need verification (DRY_RUN — nothing changed) ==`. That is
consistent: a dry run that *would* be incomplete reports incomplete, and it changed nothing either way.

## Adversarial verification of the precheck — a green suite is not the proof here

Per the project's standing rule that a green suite is not proof for a safety/guard change, the
precheck was driven as a child process against deliberately hostile inputs, not just unit-tested.

**1. The review's concrete input.** A scratch copy of the repo with a nested source adapter planted at
`.claude/agents/nested/deep-adapter.md` — the exact case the review named, because it produces a
verify finding while still installing all seventeen flat adapters, so *every downstream observation
succeeds* and the old gate sailed through:

```
$ node $SP/pre1/scripts/coordinator-resolution-precheck.js
PRECONDITION FAILED: the scratch install did not complete (exit 3 = INCOMPLETE). Installer output follows:
...
PRECHECK EXITCODE=1
grep -c "ran cleanly" → 0
```

**2. The backstop, tested by simulating the regression it exists to catch.** The `process.exit(3)` was
patched *out* of the scratch copy's `install.js`, restoring the old exit-0-under-INCOMPLETE behaviour,
and the precheck was re-run:

```
PRECONDITION FAILED: the scratch install printed the INCOMPLETE banner while exiting 0 —
the banner and the exit status disagree, so the install refused a whole class.
PRECHECK EXITCODE=1
grep -c "ran cleanly" → 0
```

The banner check fires independently of the status check. It is a genuine second signal, not a
restatement of the first.

**3. The positive control.** The precheck run against the real repo still reaches
`scratch install: the installer ran cleanly ...` and `PRECONDITIONS HOLD`, exit 0. The gate was
tightened without being made unconditionally refusing.

## Consumer sweep

| Consumer | Reads the installer's exit status? | Disposition |
|---|---|---|
| `scripts/coordinator-resolution-precheck.ts` / `.js` | Yes — `runScratchInstall()` | **Changed.** The gate is the whole reason this is more than cosmetic. Now refuses on either signal. |
| `install/install.test.ts` | Yes — 7 `status` pins | **Changed.** All seven moved to 3; the positive control kept at 0 and tightened. |
| `.github/workflows/ci.yml` | **No** | **No change needed.** `grep -rn "install\.js\|uninstall\.js" .github/` returns nothing — CI never invokes either installer. Verified in-repo. |
| `package.json` scripts | **No** | **No change needed.** All 11 scripts are `tsc` / `vitest` / generator invocations; none spawns an installer. Verified in-repo. |
| `install/README.md` (the documented scripted path) | It is what users script against | **Changed** — the exit-code list added here. |
| `README.md`, `AGENTS.md` | They name `node install/install.js` as a command to run, not to chain | **No change needed.** Prose instructions to a human; neither asserts an exit code. |
| `scripts/generate-role-adapters.ts` | **No** | **No change needed.** Its only mention of `install.js` is inside a generated banner *string* telling a human to re-run the installer. |
| `scripts/e2e/uat-live.test.ts` | **No** | **No change needed.** It spawns `claude plugin install`, a different program entirely. |
| Out-of-repo consumers: a user's own CI step, Makefile, or `install.js && next-step` chain | Yes | **`UNKNOWN - verify`.** Not observable from inside this repo. This is precisely the population the human accepted breaking; the README table is the documentation they get. |

## SPAWN-07 re-assertion (unchanged, confirmed not edited)

Both invariants re-checked in `scripts/coordinator-resolution-precheck.ts` while working in the file,
and neither was modified:

- `grep -c 'PLATFORM_FLOOR = "2.1.219"'` → **1**, unchanged.
- The depth-3 rationale comment beside it is intact:
  `// the depth-3 default arrived in v2.1.219, and v2.1.217-v2.1.218 defaulted to depth 1.` — the
  known-bad window is documented as sitting **below** the floor, not carved out of it, so the floor
  remains a lower bound. `KNOWN_BAD_LOW = "2.1.217"` / `KNOWN_BAD_HIGH = "2.1.218"` unchanged.

A live run reported `platform version: 2.1.220 (Claude Code) — at or above the advertised floor
2.1.219, and outside the known-bad window`.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 |
| `npm run freshness` | exit 0 — "All build outputs fresh: 31 committed .js file(s) match a fresh tsc rebuild" |
| `npx vitest run install/install.test.ts` | 55 passed, 1 skipped |
| `npx vitest run scripts/coordinator-resolution-precheck.test.ts` | 7 passed — Cases 1-7 all unmodified in intent |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **968 passed, 2 skipped, 35 files** |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `git status --porcelain` | clean; all scratch fixtures were built under the session scratchpad, none in the repo |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A seventh test pin the plan's search strategy could not find**

- **Found during:** Task 2, first suite run after the installers changed.
- **Issue:** `D-07 self-checkout guard ... --allow-self overrides` arm (b) asserted `status).toBe(0)`
  over a fixture that is genuinely INCOMPLETE. No banner substring appears in the case, so neither the
  review's enumeration nor any text search over banner strings could reach it. It failed red the
  moment the contract moved.
- **Fix:** Pin moved to 3 and the case strengthened — it now separates "the guard let it through"
  (not code 1, no `--allow-self` on stderr) from "the run completed" (banner tail reached), which the
  single `toBe(0)` never did. Fixture untouched, per the plan's prohibition.
- **Files modified:** `install/install.test.ts`
- **Commit:** `ae323b8`

**2. [Rule 2 - Missing critical functionality] The positive control did not bind banner to status**

- **Found during:** Task 2, applying the plan's instruction that the `:1381` conformance case is the
  positive control proving exit 3 is not returned unconditionally.
- **Issue:** The case read the completion banner off one `runInstallFrom` call and threw that call's
  status away, asserting exit 0 only on a *different, earlier* run. As a control for the new code it
  was therefore not sound.
- **Fix:** Banner and status are now asserted on the same captured run.
- **Files modified:** `install/install.test.ts`
- **Commit:** `ae323b8`

### Corrections to the plan's own text

The plan's con for option-a ("Reserves 2 for a usage error that does not exist yet") is factually
wrong — see Task 1 above. Recorded as a correction; not repeated as rationale.

The plan's `read_first` cites `install/install.ts:1574-1586` and `install/uninstall.ts:654-665` as the
banner tails and `install/install.test.ts:1346-1514` / `:1630-1687` as where the pins live. All were
accurate at HEAD. The `install.test.ts:520-580` reference for "existing doctor-mode cases" was checked
for the exit ladder; `doctor()` returns only `0` or `1` (`install.ts:442-567`), which is what the
README row for code 1 states.

## Known Stubs

None. No placeholder, no TODO, no unwired surface was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern, or schema change at a trust boundary.
The change narrows a signal that already existed.

## Notes for the plans still to run

- **27-22 also edits `install/install.ts`.** The surface was left coherent: the only structural change
  is one `process.exit(3)` plus a comment block inside the existing `if (VERIFY_FINDINGS > 0)` tail at
  the very end of the file. Nothing above line 1574 moved, so a diff against that region will not
  conflict.
- Any future plan that adds a fail-loud path to either installer must reach the tail rather than
  returning early, or it will exit 0 under a banner it never printed.

## Self-Check: PASSED

All six modified/created files present on disk. Commit `ae323b8` present in `git log`.
`process.exit(3)` present exactly once in each of `install.ts`, `uninstall.ts` and both compiled
twins.
