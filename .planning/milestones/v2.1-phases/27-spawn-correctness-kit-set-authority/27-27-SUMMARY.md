---
phase: 27-spawn-correctness-kit-set-authority
plan: 27
subsystem: kit-set-authority
tags: [kit-set-authority, symlink, cycle, structural-fix, one-authority-per-predicate, CR-03, D-29]
status: complete
requires:
  - "install/kit-source.ts (plan 27-25) — the module holding the nested walk"
  - "D-29 (user decision, gap-closure round 3) — one coherent treatment, not two half-guards"
provides:
  - "one cycle answer — a per-path ancestor stack — at BOTH recursive walk sites"
  - "a cycle that terminates by the walk's own contract rather than by a host limit"
  - "an installer that is never blind to a nested member the authority sees"
affects:
  - "every guard and oracle built on listAgentAdapters / listSkillAdapters"
  - "install/install.ts's nested-adapter refusal set"
tech-stack:
  added: []
  patterns:
    - "one predicate, one shape, at every site that answers it — equality bought by cases, not by an import"
    - "bounding recursion and narrowing a set are different jobs; a cycle guard may only do the first"
    - "prove a case has teeth by mutating the implementation toward the WRONG fix, not by watching the suite stay green"
key-files:
  created: []
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - install/kit-source.ts
    - install/kit-source.js
    - scripts/kit-model.test.ts
    - install/install.test.ts
decisions:
  - "The ancestor stack is threaded as a third parameter of walkFilesRelative with a default of [], so no exported signature moves and no call site changes."
  - "In kit-model an unresolvable realpath carries NO cycle key and falls through to readDirOrThrow rather than returning []. A cycle guard is not licensed to weaken the D-21 tier-1 fail-closed posture, and returning [] there would have turned the existing 'THROWS naming the directory' case into a 'refusing to return an empty set' throw with the wrong message."
  - "CR-03's suggested `[...new Set(walk(...))]` dedup was NOT adopted: each relative path is produced exactly once by construction, so the Set is dead code in a file whose whole point is auditability."
  - "The two kit-model survival cases do not go red against the pre-fix authority — the pre-fix authority had no visited set at all, so it already reported both aliases. Their teeth were proven by mutation (a global visited set) instead, and this SUMMARY says so rather than claiming a four-case RED that did not happen."
metrics:
  duration: ~25 min
  completed: 2026-07-31
  tasks: 2
  commits: 2
---

# Phase 27 Plan 27: One Cycle Answer at Both Walk Sites Summary

The predicate *"have I already walked this real path?"* was answered in two places and got two
different wrong answers — a dropped member in the installer, an unbounded recursion in the authority.
Both sites now carry the same per-path ancestor stack, which bounds recursion without narrowing the
set, and both name the other in a comment without importing it.

## What Was Built

**`scripts/kit-model.ts` — `walkFilesRelative()` gained the cycle answer it never had.** The walk
follows symlinks by design, which is what makes a cycle reachable, and it carried no guard at all.
It now computes the real path of the directory it is about to enter and stops descending when that
real path is already on the **current recursion path**. The third parameter defaults to `[]`, so
`listAgentAdapters` and `listSkillAdapters` keep their exact signatures and every call site is
unchanged. Everything else about the walk is intact: the `statSync` file-ness decision and its stated
reason, the vanished-entry catch, the forward-slash relative-path joining, the per-level named-error
helper, and the sort and vacuity floors in the two exported callers.

**`install/kit-source.ts` — `srcNestedAdapterFiles()`'s global visited set was replaced by the same
stack.** The old guard recorded the realpath of every directory it walked in a set shared across the
whole walk and returned nothing on a repeat, justified on the claim that *"a directory already walked
under an earlier path contributes no member the walk has not already seen"*. That claim is false for
this walk, because members are reported at their **relative** paths: one physical directory reached
two ways is two legitimate members, and the set deleted whichever `readdirSync` returned second. The
comment now restates the invariant the global set violated — *the install set may deliberately be
NARROWER than the authority's, but it may never be BLIND to a member the authority sees, because a
member it cannot see is a member it cannot refuse by name* — and records that the previous
justification was wrong and why.

**The shared-predicate record, at both sites.** Each comment names the other file and its function,
states that the two answer one predicate, cites D-29 and CR-03, says in one sentence what the guard
is FOR (bounding recursion, **not** narrowing the set — the sentence the previous comment got wrong),
and states explicitly that the two do **not** share an import because D-18 and D-28 keep the
installer decoupled from the `scripts/` layout. The equality is bought by cases, exactly as the
existing `source derivation` conformance case buys the other half of that decoupling.

**Four new cases.** Three in `scripts/kit-model.test.ts` (agent-side survival, skill-side survival,
time-bounded cycle termination at one link and at two) and one in `install/install.test.ts` (two
paths to one directory produce two refusals).

## Key Implementation Details

**The fail-closed posture survives the guard.** In `kit-model` a directory whose realpath cannot be
resolved carries no cycle key and falls through to `readDirOrThrow`, which throws naming that
directory. Returning `[]` there — the shape `kit-source` correctly uses, because its contract is
report-don't-throw — would have converted the shipped `THROWS naming the directory when the agents
directory does not exist` case into a `refusing to return an empty set` throw with the wrong message
and the wrong remedy. The two sites take the same *shape* and keep their own *floors*; that is the
deliberate divergence the `kit-source` header already documents.

**Why only a repeat on the same path is a cycle.** `alias -> real` as siblings is an *alias*, not a
cycle: descending into both is finite and yields two distinct relative paths, both of which the
authority counts and the installer must refuse by name. `loop -> ..` is a *cycle*: the directory the
walk is standing in reappears on its own recursion path. The ancestor stack distinguishes them; a
global visited set cannot.

## Proof

Base commit `a126297d5a3aabe9f725fbbe95cb2f6b086d0f4f`. Every transcript below was captured on
**darwin / node v24.12.0** on the machine the work was done on.

### RED-before — the authority's cycle, at one link and at two

Scratch kit root, `.claude/agents` holding exactly one real adapter plus `loop{N} -> ..` (which
points at `.claude`, whose `agents` entry is the directory the walk is standing in). Driven against
the base-commit `scripts/kit-model.js` under `timeout 20`:

```
=== RED authority cycle, ONE link (base sha a126297) ===
platform=darwin node=v24.12.0 links=1 root=/var/folders/.../grugops-red-cycle-EECggr
RETURNED 32 members
["loop0/agents/loop0/agents/loop0/agents/…/real-adapter.md", … ]
exit=0

=== RED authority cycle, TWO links (base sha a126297) ===
platform=darwin node=v24.12.0 links=2 root=/var/folders/.../grugops-red-cycle-IisfN4
THREW: RangeError: Maximum call stack size exceeded
exit=0
```

**Recorded in the transcript's own terms, not the deferred entry's.** The deferred item described
this as recursing *"without bound"*. With one link it did **not** hang and it did **not** throw: it
**terminated**, returning **32** aliased members for a directory holding one, because at depth 32 the
operating system's symlink-resolution limit made `statSync` throw `ELOOP` and the entry was skipped
as unstattable. That is a wrong set delivered under a clean return — arguably worse than a throw,
because nothing announces it. With two links it **threw** `RangeError: Maximum call stack size
exceeded`. Neither outcome is the walk's own decision; both belong to the host.

### GREEN-after — the identical fixtures against the rebuilt binaries

```
=== GREEN authority cycle, ONE link ===
RETURNED 1 members
["real-adapter.md"]
exit=0

=== GREEN authority cycle, TWO links ===
RETURNED 1 members
["real-adapter.md"]
exit=0
```

Both shapes return the real member set, terminate, and throw nothing. Termination is now the
ancestor stack's — the walk stops at `loop0/agents` because that directory's real path is already on
its own recursion path, long before any host limit is approached.

### RED-before — the installer's two paths to one directory

Synthetic source (17 adapters, 7 skills) plus `.claude/agents/real/x.md` and a sibling
`.claude/agents/alias -> real`, driven through the base-commit `install/install.js`:

```
AUTHORITY (listAgentAdapters) nested members: ["alias/x.md","real/x.md"]
install exit: 3
INSTALLER refusal lines:
  verify         .claude/agents/alias/x.md — the adapter directory is FLAT BY CONTRACT, so this
                 nested adapter was NOT installed. …
mentions alias/x.md: true
mentions real/x.md : false
```

The authority reports **both** relative paths. The installer names **one**. `real/x.md` — the actual
on-disk nested adapter — is silently dropped, and which of the two survives is `readdirSync`'s
choice.

### GREEN-after — the identical fixture

```
AUTHORITY (listAgentAdapters) nested members: ["alias/x.md","real/x.md"]
install exit: 3
INSTALLER refusal lines:
  verify         .claude/agents/alias/x.md — … NOT installed. …
  verify         .claude/agents/real/x.md — … NOT installed. …
mentions alias/x.md: true
mentions real/x.md : true
```

Both members are refused by name; the authority still reports both; the install set is unchanged.

### RED-before — the new cases against the pre-fix walks

With `git checkout a126297 -- scripts/kit-model.ts scripts/kit-model.js install/kit-source.ts
install/kit-source.js`:

```
 × source derivation: TWO paths to ONE directory produce TWO refusals, not one (CR-03, D-29) 48ms
 × a symlink CYCLE terminates by the walk's own contract and yields the REAL member set, at one link and at two (D-29) 6ms

 FAIL  install/install.test.ts > … > source derivation: TWO paths to ONE directory produce TWO refusals, not one
AssertionError: expected '== grugops install ==\nsource: /var/f…' to contain 'real/x.md'

 FAIL  scripts/kit-model.test.ts > … > a symlink CYCLE terminates by the walk's own contract …
AssertionError: expected [ …(32) ] to deeply equal [ 'real-adapter.md' ]

      Tests  2 failed | 89 passed | 1 skipped (92)
```

The cycle case fails on the **wrong count (32)**, not as a timeout and not as a hang — which is the
stated purpose of its time bound: on this host non-termination never occurred, so the bound did not
fire, and the bound exists so that a host where it *would* hang goes red instead of stalling CI.

**Two of the four new cases go red here, not four, and the SUMMARY says so.** The two kit-model
survival cases **pass** against the pre-fix authority, because the pre-fix authority had no visited
set at all and therefore already reported both aliases. They exist to pin the authority against the
*wrong fix* — the global visited set — not against the pre-fix absence.

### The survival cases have teeth — proven by mutation, not by assertion

`walkFilesRelative`'s ancestor stack was temporarily replaced with a module-level global visited
set (the shape CR-03 names as the defect) and the suite re-run:

```
 × is sorted by FULL relative path and two calls on the same tree are deeply equal
 × a directory reachable by TWO paths contributes BOTH members — the guard bounds recursion, it does not narrow the set (CR-03)
 × is sorted by full relative path and two calls on the same tree are deeply equal
 × a skill directory reachable by TWO paths contributes BOTH members (CR-03, the skill half)

AssertionError: expected [ 'alias/x.md' ] to deeply equal [ 'alias/x.md', 'real/x.md' ]
AssertionError: expected [ 'alias/SKILL.md' ] to deeply equal [ 'alias/SKILL.md', 'real/SKILL.md' ]

      Tests  4 failed | 28 passed (32)
```

Both survival cases fail, on both exported callers, naming the dropped member — and the two
pre-existing ordering cases fail too, because a set that outlives one call makes the second call
return a different array. The mutation was reverted with `git checkout HEAD --`, rebuilt, and
`grep -c MUTANT scripts/kit-model.ts scripts/kit-model.js` returns `0` on both.

### Counts asserted as exact integers

| Case | Asserted |
|------|----------|
| agent-side survival | `["alias/x.md","real/x.md"]`, `length === 2`, sorted |
| skill-side survival | `["alias/SKILL.md","real/SKILL.md"]`, `length === 2`, sorted |
| cycle termination (1 link and 2 links) | `["real-adapter.md"]`, `length === 1` |
| installer two-paths | authority nested members `=== ["alias/x.md","real/x.md"]`; installed adapters `length === 17` |

### The invariant that had to survive

`git diff scripts/kit-model.test.ts | grep "^-[^-]"` returns exactly **one** line — the `node:fs`
import that gained `symlinkSync`. The `two adapter paths differing ONLY by nesting are DISTINCT
members, never merged` case is untouched and green; during Task 1 `git diff scripts/kit-model.test.ts`
was empty. `git diff --numstat` over both test files: `39 0` and `68 1` — additions only.

### The boundary is uncrossed

```
$ grep -n "^import" install/kit-source.ts
86:import { existsSync, readdirSync, statSync, realpathSync } from "node:fs";
87:import { join } from "node:path";
```

`grep -n "kit-model" install/kit-source.ts` returns eight lines, all prose in comments (including the
new `ONE PREDICATE, TWO SITES, NO IMPORT` paragraph at line 184). No import statement.

### Signatures unchanged

```
base a126297  187:export function listAgentAdapters(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
              203:export function listSkillAdapters(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
HEAD          226:export function listAgentAdapters(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
              242:export function listSkillAdapters(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
```

Identical parameter lists; only the line numbers moved, by the comment block.

### Gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` + `npm run freshness` | exit 0 — **32** committed `.js` fresh |
| `npx vitest run scripts/kit-model.test.ts install/install.test.ts` | 91 passed / 1 skipped (92) — was 87/1 (88); **+4**, the four new cases |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **990 passed / 2 skipped, 35 files** — baseline 986/2 plus exactly the 4 new cases |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/adapters-freshness.js` | 17 compared, **0** byte differences, listings set-equal |
| `VALIDATE_KIT_ROOT="$(pwd)" node scripts/validate-agent-factory.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| live tree counts | `listAgentAdapters() === 17`, `listSkillAdapters() === 7` — unchanged |
| `git status --porcelain` | clean — no scratch kit root, install target or temporary checkout leaked |

## Platform Coverage — read this before trusting the symlink and cycle claims

**The symlink and cycle claims are proven on the POSIX legs only. Windows behaviour is
`UNKNOWN - verify`.**

Creating a symlink on Windows requires the `SeCreateSymbolicLink` privilege, which an unprivileged CI
runner does not hold and which makes `symlinkSync` throw `EPERM`; a fixture that cannot be built
asserts nothing. All four new cases therefore carry the same `if (process.platform === "win32")
return;` skip and the same stated reason the existing symlink cases use. Every transcript above was
captured on darwin / node v24.12.0.

The GREEN side of the contract is host-independent by construction — the walk stops on a real-path
repeat, not on an `ELOOP` — so the same fixture is expected to produce the same member set and the
same exit status on any platform that can create the symlink. That expectation is stated, not
measured.

## Deviations from Plan

### Auto-fixed Issues

None. No bug, missing critical functionality or blocking issue was discovered outside the two tasks.

### Judgement calls the plan left to the executor

**The two walks take the same shape but keep their own floors.** The plan required one treatment at
both sites. Applied literally — copying `kit-source`'s `catch { return out; }` into `kit-model` —
this would have broken the shipped `THROWS naming the directory when the agents directory does not
exist` case, because an unresolvable realpath would have short-circuited before `readDirOrThrow` and
turned a named read failure into a vacuity throw with the wrong remedy. In `kit-model` an
unresolvable realpath therefore carries no cycle key and falls through to `readDirOrThrow`. The
shared thing is the *predicate and its shape*; the divergent thing is the *floor*, which the
`kit-source` header already documents as deliberate (report-don't-throw vs. throw).

**CR-03's `[...new Set(...)]` dedup was not adopted.** The review's suggested fix wrapped the result
in a `Set`. Each relative path is produced exactly once by construction — the walk visits each `base`
once — so the dedup can never fire. In a file whose entire purpose is auditability, a line that
cannot do anything is noise, and a dedup sitting next to a comment insisting the guard must not
narrow the set is actively misleading.

**The RED for two of the four new cases is a mutation, not a checkout.** The plan's acceptance
criterion asked for a RED naming *each* new case with the wrong value it produced. Two cases — the
kit-model survival pair — cannot go red against the pre-fix code, because the pre-fix authority's
defect ran in the opposite direction (no guard at all, so both aliases were already reported). Rather
than claim a reproduction that did not happen, their teeth were proven by mutating the implementation
toward the wrong fix, which is the same discipline plan 27-25 used and which produced a strictly
stronger signal: four failures including two pre-existing ordering cases.

## Known Stubs

None.

## Threat Flags

None. This plan introduces no new network endpoint, auth path, file-access pattern or schema change
at a trust boundary. T-27-135 (following a symlink out of the kit root during the walk) was
dispositioned `accept` in the plan's register and that disposition is unchanged — the kit root is the
tree the operator pointed the guards at, and the walk already reads every file beneath it. The five
`mitigate` dispositions (T-27-130 through T-27-134) are each closed by the ancestor stack plus the
cases recorded above.

## Self-Check: PASSED

Files verified present on disk:
- `FOUND: scripts/kit-model.ts`
- `FOUND: scripts/kit-model.js`
- `FOUND: install/kit-source.ts`
- `FOUND: install/kit-source.js`
- `FOUND: scripts/kit-model.test.ts`
- `FOUND: install/install.test.ts`
- `FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/27-27-SUMMARY.md`

Commits verified in `git log`:
- `FOUND: 19f2a04` — fix(27-27): one cycle answer at both walk sites — a per-path ancestor stack (D-29, CR-03)
- `FOUND: ae5124a` — test(27-27): pin both directions — a two-path member survives, a real cycle terminates

Neither commit deleted a tracked file (`git diff --diff-filter=D HEAD~1 HEAD` empty for both).
