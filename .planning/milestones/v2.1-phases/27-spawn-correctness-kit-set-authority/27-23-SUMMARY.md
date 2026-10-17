---
phase: 27-spawn-correctness-kit-set-authority
plan: 23
subsystem: tooling / build-safety guards
tags: [SPAWN-01, SPAWN-02, KIT-02, SPAWN-06, WR-03, IN-01, IN-02, frontmatter-authority, one-grammar]
status: complete
requires:
  - scripts/frontmatter.ts (the single frontmatter authority, plans 27-12 and 27-18)
  - scripts/kit-model.ts (the role/adapter set authority, plans 27-01 and 27-10)
  - scripts/adapters-freshness.ts wired at both ends (plan 27-11)
provides:
  - "generate-role-adapters.ts reads role frontmatter through parseFrontmatter and declares no grammar of its own"
  - "three distinct generator refusals: unreadable frontmatter / no capabilities key / N capabilities keys"
  - "adapters-freshness.ts removes its temp mirror on process exit, including an uncaught throw"
  - "generate-role-adapters.test.ts derives the generator's in-repo import closure instead of hand-listing it"
  - "ci.yml runs check-kit-refs.js and validate-agent-factory.js as their own steps"
affects:
  - "the shipped tools: line of all 17 adapters — byte-identical after the switch, verified by an empty git diff and by freshness:adapters"
  - "adapters-freshness.ts gains frontmatter.js in its mirror-spawn twin list (a blocking consequence of the generator's new import)"
tech-stack:
  added: []
  patterns:
    - "one format-aware authority per predicate — the duplicate grammar is DELETED, never taught an extra case"
    - "a parse failure is a parse artifact, never a verdict: unreadable and no-capabilities are distinct findings"
    - "derive the set rather than hand-list it — the test mirror now reads the generator's own import closure"
    - "anti-vacuity beside every silence assertion: a filter that matches nothing passes forever"
key-files:
  created: []
  modified:
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - scripts/generate-role-adapters.test.ts
    - scripts/adapters-freshness.ts
    - scripts/adapters-freshness.js
    - scripts/adapters-freshness.test.ts
    - .github/workflows/ci.yml
decisions:
  - "Two of WR-03's three divergences were NOT fail-closed, contrary to the review's rating. The no-space and duplicate-key shapes both EMITTED an adapter and exited 0 on the pre-change committed .js. The finding was under-rated, not over-rated."
  - "Three distinct refusals for three distinct facts (unreadable / absent key / N keys), with the present-but-empty wording retained verbatim so the committed RED case still pins it."
  - "The `fail` helper gained a variable-level `=> never` annotation so TypeScript narrows control flow; that is what lets the parse-failure branch read the success arm without a cast or a redundant second ok test."
  - "adapters-freshness keeps its mirror twin list hand-written rather than deriving it: deriving would mean writing a grammar for 'what does this module import' inside a build-safety gate, which is the second-grammar class WR-03 exists to delete. Accepted only because the failure direction is loud — an unmirrored import makes the mirrored generator exit non-zero and the gate reports 'did not run cleanly'."
  - "The oracle's scratch() went the other way and DERIVES the closure, because a test file is the right place for that derivation and it deletes a set literal instead of growing one."
  - "validate-agent-factory is invoked in CI with VALIDATE_KIT_ROOT set explicitly. It has no default kit root by deliberate design (the C3 no-false-green guard); the plan's acceptance criterion assumed a bare invocation would exit 0 and it does not."
metrics:
  duration: ~15 min
  completed: 2026-07-30
  tasks: 3
  commits: 3
  files_modified: 7
  tests_added: 4
---

# Phase 27 Plan 23: One Grammar, A Gate That Cleans Up, Both Ends Wired Summary

The adapter generator — the code that composes the shipped `tools:` line, i.e. the spawn grant
itself — no longer carries a frontmatter grammar of its own; it reads through `scripts/frontmatter.ts`
and emits byte-identical adapters, the adapter freshness gate removes its temp mirror on every exit
path including an uncaught throw, and the two gates that ran in CI only as a test side effect now have
their own steps.

## What Was Built

### Task 1 (WR-03) — the second grammar deleted

`scripts/generate-role-adapters.ts`:

- **`import { parseFrontmatter } from "./frontmatter.js"`**, and the local eight-line
  `parseFrontmatter` **deleted** — not renamed, not commented out, not flag-guarded. `grep -c
  "function parseFrontmatter"` reports 0; `grep -c 'from "./frontmatter.js"'` reports 1.
- **The capabilities read branches on the authority's result**, producing three findings for three
  facts:
  - `ok: false` → `` `<file>: frontmatter is unreadable — <reason>` ``. An unreadable role file is not
    the same fact as a role with no capabilities, and the deleted grammar conflated them.
  - `caps.length === 0` → `` `no \`capabilities:\` key in the role frontmatter` ``.
  - `caps.length > 1` → `` `<N> \`capabilities:\` keys in one role frontmatter, expected exactly 1` `` —
    the count is named, and no occurrence is discarded.
  - `caps[0].trim() === ""` → the **existing wording retained verbatim**, so the committed
    empty-capabilities RED case still pins.
- **`fail` gained a variable-level type annotation** (`const fail: (m: string) => never = …`).
  TypeScript only narrows control flow on a never-returning call when the callee is a function
  declaration or a const with an explicit *variable* type annotation; the arrow's own return
  annotation is not enough. That narrowing is what lets the new branch read `parsed.value` directly
  rather than with a cast or a second `ok` test that would read as a fallback for an unreachable state.
- **The closed vocabulary check, the emission order, the coordinator cardinality check, the non-ASCII
  filename gate, the collision fold and the description derivation are untouched.** Only the
  frontmatter read changed.
- **Header rewritten** to record that the grammar is `scripts/frontmatter.ts` and there is no second
  one here, naming WR-03, each of the three removed divergences with its *measured* pre-change
  behaviour, and the mis-blamed fourth. The `Node stdlib ONLY` claim is restated with its reason:
  `frontmatter.ts` has no imports at all, so reading through the authority adds no dependency.

`scripts/generate-role-adapters.test.ts` — three new cases beside the existing refusals, each built
with the existing `scratch()` and asserted with the existing `expectRefusal()`, each recording the
measured pre-change behaviour in its comment. Plus `scratch()` itself now **derives** the generator's
in-repo import closure from the committed sources instead of hand-listing two modules, with a
non-vacuity floor (`< 2` modules means the derivation read the wrong file).

### Task 2 (IN-01) — the gate cleans up after itself

`scripts/adapters-freshness.ts` registers `process.on("exit", cleanup)` **immediately after** the
`mkdtempSync` that creates the mirror, so no window exists in which a throw can escape without removing
it. The existing `cleanup()` calls in `die()` and the two tails are **kept** — `rmSync` with `force` is
idempotent, and `exit` does not fire on a signal or `process.abort()`, so the direct calls stay the
primary path and the handler is the backstop. That reasoning is in a comment beside the registration,
along with why the exit-handler form was chosen over wrapping the top-level module body in
`try`/`finally`.

`scripts/adapters-freshness.test.ts` — **Case 6**, mirroring `coordinator-resolution-precheck.test.ts`
Case 7. It runs the gate against a `CHECK_ROOT` mirror with `agent-factory/packaging` absent (the
review's named input), asserts the set difference of temp entries carrying the gate's prefix is empty
**and** that the run still exits non-zero, so it cannot pass by the gate quietly succeeding. Two
anti-vacuity measures: the prefix is **recovered from the committed `.js`** rather than restated, and a
sentinel directory proves the filter can actually see an entry carrying it.

### Task 3 (IN-02) — both ends wired

`.github/workflows/ci.yml` runs `node scripts/check-kit-refs.js` and
`VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` in the ubuntu-only block, after the four
freshness gates and the foundation-guard aggregator, keeping the block's ordering convention. The
comment names IN-02, states the finding is **pre-existing and scoped in deliberately** so a later
reader does not mistake it for regression repair, and records the root requirements explicitly rather
than leaving them implied. The step was renamed from "Freshness gates + foundation guards" to
"Freshness gates + repo gates", because it now runs three gates and not one.

## Verification Evidence

### RED-before / GREEN-after — WR-03 (Task 1 acceptance criteria 5 and 6)

Both run against the **committed** `scripts/generate-role-adapters.js`, on a scratch mirror built the
same way the oracle builds one. The finding predicted every divergence would land in a fail-closed
branch. **Two of the three did not.**

RED-before (pre-change committed `.js`):

```
── PROBE 1: `capabilities:read edit shell` (no space after colon)
   exit status : 0
   output      : generate-role-adapters: wrote 3 adapters … (coordinator grugops-orchestrator grants 2 names)
   qe-e2e tools: Read, Grep, Glob, Edit, Write, Bash

── PROBE 2: two `capabilities:` keys (first `read`, second `shell`)
   exit status : 0
   qe-e2e tools: Bash                       ← LAST-WINS; the first declaration was discarded silently

── PROBE 3: unterminated frontmatter block (closing `---` deleted)
   exit status : 1
   output      : ERROR    qe-e2e.md: `capabilities:` is absent or empty — …
                          ↑ the wrong fact: the block could not be READ at all
```

GREEN-after:

```
── PROBE 1: exit 1
   ERROR    qe-e2e.md: frontmatter is unreadable — cannot read `capabilities:read edit shell` as a
            frontmatter key line or as a continuation of the previous key

── PROBE 2: exit 1
   ERROR    qe-e2e.md: 2 `capabilities:` keys in one role frontmatter, expected exactly 1 — every
            occurrence is retained rather than last-wins, because silently discarding a declaration
            is a bypass; delete the extra key

── PROBE 3: exit 1
   ERROR    qe-e2e.md: frontmatter is unreadable — frontmatter block opened at line 1 of the
            fence-stripped body and is never closed by a `---` delimiter — an unterminated block is
            unreadable, NOT an absence of keys
```

In all three the adapter directory is left byte-for-byte unchanged (`expectRefusal` asserts it).

### RED-before / GREEN-after — IN-01 (Task 2 acceptance criteria 1 and 2)

```
RED-before (pre-change committed .js), CHECK_ROOT mirror lacking agent-factory/packaging:
  gate exit status : 1
  stderr head      : node:internal/fs/cp/cp-sync:56 | fsBinding.cpSyncCheckPaths(…)
  temp dirs matching "grugops-adapters-fresh-*" before : 0
  temp dirs matching "grugops-adapters-fresh-*" after  : 1
  LEAKED           : *** grugops-adapters-fresh-fUCEfe ***

GREEN-after, identical run:
  gate exit status : 1        ← still fails closed
  before : 0    after : 0
  LEAKED : none
```

**Case 6 demonstrated RED.** The registration line was temporarily removed from the committed `.js`
and the suite re-run; the case failed, then the file was restored and `npm run freshness` confirmed
byte-parity:

```
× Case 6 (IN-01, no leftovers): a run that throws before any handler still removes its temp mirror
  AssertionError: expected [ 'grugops-adapters-fresh-UpmmTv' ] to deeply equal []
```

**Leftover count in the system temp directory (Task 2 acceptance criterion 6):** `0` before the suite
run and `0` after it, measured on the gate's own prefix. The one entry the demonstrated-RED run
produced was removed explicitly; `git status --porcelain` is empty.

### Task 3 — gate output tails and the root question

```
$ node scripts/check-kit-refs.js
  [derivation] PASS  24 adapter file(s) derived
  [Assertion 1] PASS  no agent-factory/config/ refs remain
  [Assertion 2] PASS  no agent-factory/handoffs/ refs remain
  [Assertion 3] PASS  $GRUGOPS_HOME appears in exactly the 19 derived legal site(s)
  [SC2]         PASS  invariant marker present at all 26 marker sites
  == Result == ALL CHECKS PASSED          exit 0

$ node scripts/validate-agent-factory.js                      # bare, as the plan's criterion assumed
  ERROR    VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)
  exit 1

$ VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js
  ALL CHECKS PASSED                        exit 0
$ VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict
  ALL CHECKS PASSED                        exit 0
```

**Roots, stated explicitly rather than implied** (the plan's `<action>` asked for this):
`check-kit-refs.js` needs **nothing** — `CHECK_ROOT` is an override for hermetic mirrors and its
default resolves correctly from the repository root, so it is invoked bare. `validate-agent-factory.js`
**requires `VALIDATE_KIT_ROOT`** and has no default by deliberate design (the C3 no-false-green guard:
unset is a hard error, never a silent `.` fallback), so the value is supplied in the step.
`VALIDATE_ROOT` is left unset on purpose and falls back to the repository root, which is the state root
of a single-tree checkout.

**Structural check on the workflow** (the command used, run from the repo root):

```
$ node scratchpad/ci-structure-check.mjs
block lines        : 28
commands           : 7
freshness gates    : 4 ["npm run freshness","npm run freshness:catalog","npm run freshness:context","npm run freshness:adapters"]
direct gate calls  : 3 ["node scripts/check-foundation-guards.js","node scripts/check-kit-refs.js","VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js"]
STRUCTURE OK
```

It locates the step, walks its `run: |` block scalar by indentation, asserts the left edge is not
ragged (a ragged block scalar is a YAML error), classifies every non-comment line, and requires
4 freshness invocations, 3 direct gate invocations, and **no unclassified command** — so a fourth kind
of line cannot slip in unnoticed. The repository ships zero runtime dependencies, so there is no YAML
parser to reach for; this asserts the property a broken edit would actually violate.

### Gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` then `npm run freshness` | `All build outputs fresh: 31 committed .js file(s) match a fresh tsc rebuild.` |
| `npm run generate:adapters` then `git diff --stat .claude/agents/` | **empty** — the 17 adapters are byte-identical after the grammar switch |
| `npm run freshness:adapters` | `17 adapter(s) compared, 0 byte difference(s), directory listings set-equal` |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 35 files, **968 passed / 2 skipped** (both skips pre-existing) |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, exit 0 |
| `node scripts/check-kit-refs.js` | `ALL CHECKS PASSED`, exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED`, exit 0 |
| `wc -c agent-factory/roles/orchestrator.md` | **7090**, unchanged from HEAD~3 — under the 7165 WARN tier and the 7570 FAIL ceiling, both re-asserted and neither touched |
| `scripts/generate-role-adapters.test.ts` case count | **20 → 23** (exactly three greater; 22 passed + 1 pre-existing skip) |
| `scripts/adapters-freshness.test.ts` case count | **5 → 6** (exactly one greater; Cases 1–5 unmodified) |
| temp dirs matching the gate prefix, after the suite | **0** |
| `git status --porcelain` | empty — no stray mirrors |

`git diff scripts/generate-role-adapters.test.ts` deletes exactly two lines, both inside `scratch()`
(a comment and the hand-written `kit-model.js` copy). **No line inside the existing refusal-case block
was deleted or modified.**

## Adversarial Self-Review (a green suite is not proof for this surface)

CLAUDE.md and this phase's standing lesson require that a change to the code composing the shipped
spawn grant be attacked before being called done. **Seventeen probes** were run against the
post-change committed `.js`, each planting a whole frontmatter block into a scratch role and reading
back the emitted `tools:` line, checking specifically for a spawn token on a non-coordinator adapter.

**Zero spawn leaks.** Full result:

| # | Planted shape | Verdict | Emitted `tools:` |
|---|---------------|---------|------------------|
| P1 | baseline `capabilities: read edit shell` | 0 | `Read, Grep, Glob, Edit, Write, Bash` |
| P2 | folded scalar `>-` + continuation | 0 | `Read, Grep, Glob, Edit, Write` |
| P3 | literal scalar `\|-` + continuation | 0 | `Read, Grep, Glob, Edit, Write` |
| P4 | block sequence (`- read` / `- edit`) | **1** | refused: token `"read,"` outside the vocabulary |
| P5 | flow sequence `[read, edit]` | **1** | refused: token `"[read,"` outside the vocabulary |
| P6 | double-quoted `"read edit"` | 0 | `Read, Grep, Glob, Edit, Write` |
| P7 | trailing comment `read # edit shell` | 0 | `Read, Grep, Glob` |
| P8 | **wrapped plain scalar** (`read` + indented `edit shell`) | 0 | `Read, Grep, Glob, Edit, Write, Bash` |
| P9 | tab after the colon | 0 | `Read, Grep, Glob, Edit, Write` |
| P10 | `Capabilities:` (capital K) | **1** | refused: no `capabilities:` key |
| P11 | empty frontmatter block | **1** | refused: no `capabilities:` key |
| P12 | YAML alias `capabilities: *c` | **1** | refused: anchor or alias (inherited from 27-18) |
| P13 | **`capabilities: read Agent`** | **1** | refused: token `"Agent"` outside the closed vocabulary |
| P14 | **`tools: Read, Agent(grugops-orchestrator)` planted in the ROLE frontmatter** | 0 | `Read, Grep, Glob` — the planted key is **ignored** |
| P15 | merge key `<<: *base` | **1** | refused: cannot read as a key line |
| P16 | `...` document terminator inside the block | 0 | `Read, Grep, Glob` |
| P17 | hyphen/digit key `x-9-key:` (divergence 1) | 0 | `Read, Grep, Glob, Edit, Write` |

The two that matter most are **P13** and **P14**. P13 shows the **closed vocabulary is the load-bearing
gate and it holds independently of the frontmatter grammar** — no capability token maps to `Agent`, so
widening the grammar cannot widen the grant. P14 shows that a `tools:` key planted directly in a role's
frontmatter is **not read at all**: the generator composes `tools:` from `capabilities:` and the
coordinator flag alone, so role text cannot inject a grant. `isCoordinator` is `stem ===
COORDINATOR_ROLE`, a filename fact with no frontmatter path, and a kit with zero or two coordinators is
refused by the existing cardinality check.

**One behavioural widening, documented rather than dismissed (P8).** A wrapped plain scalar — an
indented line under `capabilities:` — now joins into the value, where the deleted grammar dropped it.
So `capabilities: read` followed by an accidentally-indented `edit shell` yields
`Read, Grep, Glob, Edit, Write, Bash` instead of `Read, Grep, Glob`. This is the **correct YAML
reading** and the generator is the only reader of role frontmatter, so it is what the author expressed;
it is bounded by the closed vocabulary (proven by P13, so `Agent` is unreachable); and any change it
causes surfaces as an adapter byte diff that `freshness:adapters` forces into a reviewed commit. Both
the old and the new reading are silent about the continuation line — the new one is silent and right.
Recorded as a posture note, not a defect. No shipped role uses the shape.

**P2/P3/P6/P7/P9/P17 are permissiveness gained, not safety lost.** Folded, literal, quoted,
comment-bearing, tab-separated and hyphen-keyed forms previously failed with a *misleading* message (a
token like `>-` or `"read` "outside the closed vocabulary"); they now parse to the value YAML says they
carry. **P4/P5 fail closed** — the sequence forms are not supported and the refusal names the offending
token, which is the safe direction.

**A found-and-fixed blocker, not a green-suite artifact.** The first run of the GREEN-after probe did
not produce a refusal at all — it produced `ERR_MODULE_NOT_FOUND: … /scripts/frontmatter.js`. The
probe's own hand-written mirror list had gone one file short the moment the generator gained an import.
That is the same defect the two production mirror sites had, and it is how it was caught; see Deviation 1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Both mirror-spawn sites went one file short the moment the generator gained an import**

- **Found during:** Task 1, at the first GREEN-after probe run.
- **Issue:** `scripts/adapters-freshness.ts` and the oracle's `scratch()` each `cpSync` a hand-written
  list of the generator's compiled twins into a temp tree, then spawn the mirrored generator there.
  Adding `import … from "./frontmatter.js"` made both lists incomplete, and the mirrored generator died
  with `ERR_MODULE_NOT_FOUND` before reading a single role file. `npm run freshness:adapters` is in
  Task 1's own `<verify>`, so this blocked the task.
- **Fix, deliberately asymmetric:**
  - **The gate** gains a third `cpSync` by hand, with a comment recording *why it is hand-written*:
    deriving it would mean writing a grammar for "what does this module import" inside a build-safety
    gate, which is a second grammar of exactly the kind WR-03 exists to delete. The trade is only
    acceptable because the failure direction is **loud** — an unmirrored import makes the mirrored
    generator exit non-zero and the gate's existing fail-closed branch reports "did not run cleanly".
    It can never pass while one file short. This was observed, not assumed.
  - **The oracle** goes the other way: `scratch()` now derives the transitive in-repo import closure
    from the committed sources, with a non-vacuity floor. A test file is the right place for that
    derivation, and it **deletes** a set literal instead of growing one — the discipline this milestone
    exists to enforce.
- **Files modified:** `scripts/adapters-freshness.ts`, `scripts/adapters-freshness.js`,
  `scripts/generate-role-adapters.test.ts`
- **Commit:** `b7959ee`

**2. [Rule 2 - Missing critical] The absent-key and empty-value refusals had to be split into distinct findings**

- **Found during:** Task 1.
- **Issue:** The plan's truth requires "an absent capabilities key, a present-but-empty value, and two
  occurrences are three distinct refusals with three distinct messages", while also requiring the
  empty-value case keep its existing wording. The existing wording is `` `capabilities:` is absent or
  empty `` — a single sentence covering two facts, so it could not serve as one of three distinct
  messages.
- **Fix:** the absent case gets its own finding (`` no `capabilities:` key in the role frontmatter ``)
  and the present-but-empty arm keeps the existing string **verbatim**, with a comment recording that a
  committed RED case pins it and that the "absent" half of its sentence is now covered above. Four
  distinct findings in total (unreadable / absent / N keys / empty). No existing case was deleted,
  skipped or weakened.
- **Commit:** `b7959ee`

**3. [Rule 3 - Blocking] `fail` did not narrow control flow, so the parse-failure branch could not read the success arm**

- **Found during:** Task 1.
- **Issue:** `const fail = (m: string): never => …` annotates the *arrow*, not the *variable*.
  TypeScript only lets a never-returning call narrow control flow when the callee is a function
  declaration or a const with an explicit variable type annotation, which is why the pre-existing code
  reaches for `roleFiles!` and `text!` after calling it. Without narrowing, `parsed.value` after
  `if (!parsed.ok) fail(…)` is a type error, and the workarounds are a cast or a second `ok` test that
  reads as a fallback for an unreachable state.
- **Fix:** `const fail: (m: string) => never = (m: string): never => …`. Two words, no behaviour change,
  and the reason is recorded in a comment beside it. `npx tsc --noEmit` exits 0.
- **Commit:** `b7959ee`

**4. [Plan-vs-reality] Task 3's acceptance criterion assumed a bare `validate-agent-factory.js` exits 0; it cannot**

- **Found during:** Task 3.
- **Issue:** The criterion reads "`node scripts/validate-agent-factory.js` exits 0 from the repo root
  with no environment override". It does not, and must not: `VALIDATE_KIT_ROOT` has **no default** by
  deliberate design (the C3 no-false-green guard at `scripts/validate-agent-factory.ts:69-74` — unset is
  a hard error rather than a silent `.` fallback), and `scripts/validate.test.ts:162-169` pins that
  refusal as a named case.
- **Resolution:** the plan's `<action>` anticipated exactly this — "Confirm and record whether either
  script needs `CHECK_ROOT`, `VALIDATE_ROOT` or `VALIDATE_KIT_ROOT` set in the CI environment". The
  action was followed and the criterion was not: the CI step supplies `VALIDATE_KIT_ROOT=.` and the
  workflow comment records the requirement and its reason. **Nothing was weakened** — the gate's
  refusal is its correct fail-closed posture, not a failure on the real tree, so the plan's "report the
  failure and stop" instruction does not apply. Recorded here so a verifier reading the criterion
  literally sees why it was not met as written.
- **Commit:** `e89d655`

**5. [Cosmetic] The ubuntu-only step was renamed**

- "Freshness gates + foundation guards (ubuntu only)" → "Freshness gates + repo gates (ubuntu only)",
  and the block's leading comment updated from "the four freshness gates + the foundation-guard
  aggregator" to "the four freshness gates + the three repo gates". A step name that under-states what
  it runs is the same class of mis-description as a PASS line asserting an unperformed check.
- **Commit:** `e89d655`

### Process Deviation

None. This plan is `autonomous: true` with no checkpoint task and no tracer task.

## Authentication Gates

None.

## Known Stubs

None. No placeholder values, no unwired data paths, no `TODO`/`FIXME` introduced.

## Deferred Issues

- **The adapter freshness gate's mirror twin list stays hand-written.** Documented in the code with its
  reasoning and its fail-loud direction (see Deviation 1). A future import added to
  `generate-role-adapters.ts` must be added there too; it cannot pass while one file short, but it will
  turn CI red rather than fixing itself. Not silent drift — noisy drift — but a standing obligation.
- **2 pre-existing skipped tests, untouched (out of scope).** `install/install.test.ts` — the retired
  sh-vs-Node byte-parity check (D-08); `scripts/generate-role-adapters.test.ts` — the case-collision
  case, which cannot be *built* on a case-insensitive filesystem (this machine is APFS) and runs for
  real on case-sensitive CI. Both predate this plan.
- **The wrapped-plain-scalar widening (probe P8)** described under Adversarial Self-Review. Correct YAML
  reading, bounded by the closed vocabulary, surfaced by `freshness:adapters` as a byte diff. Recorded,
  not closed.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary —
this plan deletes a parsing grammar, adds a cleanup handler and adds two CI steps.

## Threat Register Outcome

| Threat ID | Disposition | Outcome |
|-----------|-------------|---------|
| T-27-114 | mitigate | **Mitigated.** The local grammar is deleted and the authority is the only reader. A capability declaration the authority refuses can no longer reach the composed spawn grant through a laxer parser — proven by the no-space probe, which shipped a full six-tool line before and is refused by name after. |
| T-27-115 | mitigate | **Mitigated.** Every occurrence is retained and a count other than one is refused naming the count. The duplicate-key probe shipped `tools: Bash` from the second declaration before and is refused after. |
| T-27-116 | mitigate | **Mitigated.** `npm run build` + `npm run freshness` green (31 committed `.js` match a fresh rebuild); `npm run generate:adapters` leaves `git diff --stat .claude/agents/` empty; `npm run freshness:adapters` reports 17 compared, 0 byte differences. |
| T-27-117 | mitigate | **Mitigated.** Cleanup registered on process exit immediately after the mirror is created; Case 6 asserts the prefix is absent after a fail-closed run and was **demonstrated to fail** without the registration. |
| T-27-118 | mitigate | **Mitigated.** Both gates have their own workflow steps; neither depends on the vitest exclude pattern. Both verified green on the real tree, with the root requirements recorded rather than implied. |
| T-27-119 | accept | **Accepted, unchanged.** The closed-vocabulary check still fails the build first, and probe P13 confirms `Agent` is not reachable as a capability token. |

## Self-Check

Files claimed as modified, verified present with the claimed symbols:

- `scripts/generate-role-adapters.ts` — FOUND; `function parseFrontmatter` count = **0**;
  `from "./frontmatter.js"` count = **1**.
- `scripts/generate-role-adapters.js` — FOUND; byte-fresh under `npm run freshness`.
- `scripts/generate-role-adapters.test.ts` — FOUND; 23 cases (22 passed + 1 pre-existing skip).
- `scripts/adapters-freshness.ts` — FOUND; `process.on("exit", cleanup)` present immediately after
  `mkdtempSync`; the third `cpSync` for `frontmatter.js` present.
- `scripts/adapters-freshness.js` — FOUND; byte-fresh under `npm run freshness`.
- `scripts/adapters-freshness.test.ts` — FOUND; 6 cases pass.
- `.github/workflows/ci.yml` — FOUND; `node scripts/check-kit-refs.js` count = 1,
  `node scripts/validate-agent-factory.js` count = 1, `IN-02` named in the block comment.

Commits verified in `git log`:

- `b7959ee` — FOUND
- `28f5cc7` — FOUND
- `e89d655` — FOUND

## Self-Check: PASSED
