---
phase: 27-spawn-correctness-kit-set-authority
plan: 19
subsystem: tooling / build-safety guards
tags: [KIT-03, KIT-02, CR-02, referential-integrity, identity-authority, namespace-split]
status: complete
requires:
  - scripts/frontmatter.ts (the identity-and-grant parsing authority, plans 27-12 / 27-18)
  - scripts/check-foundation-guards.ts guardReferentialIntegrity parse loop (:1452-1464)
  - scripts/coordinator-resolution-precheck.ts:393-403 (the consumer already resolving by name)
provides:
  - "a name-mismatch refusal in guardReferentialIntegrity() placed after the parse loop and before the coordinator lookup, so the three-way equality is never reported over two namespaces"
  - "four distinct refusal arms: absent `name` key, EMPTY value, duplicate-key CARDINALITY, plain value mismatch"
  - "renameAdapterIdentity() — the test helper that lets a fixture express a declared identity differing from its filename"
  - "five KIT-03 cases that all fail if the mapping assertion is deleted"
affects:
  - "no consumer edit needed: coordinator-resolution-precheck.ts already resolved by frontmatter name, so the two consumers now agree rather than one being brought over to the other"
tech-stack:
  added: []
  patterns:
    - "one stated authority per predicate: identity is the frontmatter `name` key, and the filename-keyed comparison is legal ONLY because the mapping assertion runs first"
    - "pin the CARDINALITY of the answer, not just its value — reading `[0]` of a multi-valued key is itself a second-answer bug"
    - "the no-false-positive half is a named case, not a claim: four legitimate one-value spellings asserted green"
key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
decisions:
  - "Identity has ONE authority: the frontmatter `name` key. The oracle's filename-keyed set 2 is legal only because the mapping to that key is asserted first; delete the assertion and the equality silently reverts to a claim about two different sets."
  - "The expected name is the adapter's OWN FILENAME STEM, not `AGENT_PREFIX` joined to it. The review's suggested patch joined the prefix a second time (`grugops-grugops-installer`) and would have failed all seventeen shipped adapters — adapter filenames already carry the namespace."
  - "A `name` key carrying anything other than EXACTLY ONE value is refused. Which answer the platform's YAML loader honours on a duplicate key (first, last, or a duplicate-key throw that stops the agent loading at all) is not the oracle's to guess."
  - "Absence, emptiness, duplication and a plain mismatch are FOUR distinct findings. Printing one sentence for two different facts is the mistake guard_wr05's `name`-key floor was written to avoid, and this oracle states each fact itself rather than depending on that floor to be sound."
  - "Scoped to the BASENAME on purpose, so a nested adapter whose declared name matches its own basename still lands in the pre-existing 'adapter with no role file' direction rather than being re-routed through this refusal."
metrics:
  duration: ~35 min
  completed: 2026-07-30
  tasks: 2
  commits: 3
  files_modified: 3
  tests_added: 5
---

# Phase 27 Plan 19: Assert the Identity Mapping Before KIT-03 Compares Namespaces Summary

`guardReferentialIntegrity()` now asserts that every adapter's declared frontmatter `name` equals its
own filename stem *before* any set comparison mixes the two namespaces — closing CR-02, where one
adapter's `name:` value was rewritten on a hermetic mirror and the oracle printed
`17 roles == 17 adapters == 17 grant-closure names` over a tree whose coordinator granted a name no
installed agent carried: the milestone's founding defect, reproduced with its own oracle green.

## What Was Built

### Task 1 — the mapping assertion, and the disposition recorded in the header

`scripts/check-foundation-guards.ts`:

- **`nameMismatch`** — a refusal placed immediately after the `parseFailures` early return and *before*
  the `coordinators` lookup. It reads `parsedAdapters`, the map the loop directly above just built, so
  there is **one parse per adapter and one grammar**, and it `return`s on any mismatch, matching the
  early-return shape every other refusal in this function uses. The equality below it is therefore
  never printed over two namespaces.
- **Four arms, each its own finding:**
  1. `carries NO \`name\` key at all` — absence;
  2. `\`name\` key present with an EMPTY value` — emptiness;
  3. `declares N \`name\` values (…) — identity has ONE authority and must have ONE answer` —
     duplicate key (added by red-team, below);
  4. `declares \`name: X\`, expected \`name: Y\`` — a plain value mismatch.
  Findings are **sorted** before joining, so two runs over the same broken tree produce byte-identical
  output.
- **A new header block** recording what this round settles: identity comes from the frontmatter `name`
  key and nowhere else; the filename-keyed comparison below is legal *only because* this assertion runs
  first; `scripts/coordinator-resolution-precheck.ts:393-403` resolves the same closure by name, so the
  two consumers now answer the identity predicate the same way and there is no second grammar left to
  delete. The block names CR-02 and carries the reproduction transcript verbatim, and states the
  basename scoping so a future reader does not "fix" the nested-adapter direction into it.

`scripts/check-foundation-guards.js` rebuilt by `tsc` — the CI gate runs the committed `.js`, so the
rebuild is what makes the fix reach the gate.

### Task 2 — the fixtures that can express the namespace split

`scripts/check-foundation-guards.test.ts`:

- **`renameAdapterIdentity(file, newName)`** beside `repointGrant()`, modelled on `reshapeToolsKey()`'s
  find-then-splice shape. It **throws** when the `name:` line is absent, so it can never degrade into a
  silent no-op plant that leaves a case asserting against an unmodified tree.
- **Three cases the plan specifies**, at the end of the KIT-03 block:
  1. **The review's exact CR-02 reproduction** — `consistentMirror()`, asserted **green first on the
     identical mirror**, then one `renameAdapterIdentity()` call on one non-coordinator adapter, then
     non-zero exit, `KIT-03:`, the adapter path, the declared-vs-expected wording, and **no**
     `PASS  KIT-03` line. The green-first half is what makes the rename provably the cause.
  2. **A fixture-expressed mismatch** — `plantPlainAdapter(m, "grugops-extra.md", "grugops-something-else")`,
     which is what proves the *generator* can express the failure. It also asserts the 18-vs-17
     cardinality is **not** what gets reported, pinning that the refusal precedes the set comparison.
  3. **The empty-value edge** — asserted as its own distinct wording, and explicitly **not** the
     absent-key arm and **not** a plain mismatch.
- **Comments on `consistentMirror()` and `plantPlainAdapter()`** recording that the name-equals-stem
  match is now *asserted by the oracle* rather than merely a property of the fixture, and pointing at
  the inverse cases. Defaults left emitting matching names, because every pre-existing case depends on
  that mirror running green.
- **No existing case weakened.** `git diff --numstat` on the test file over the plan reports
  **additions only, zero deletions**.

## Verification Evidence

### RED-before / GREEN-after — the review's reproduction (Task 1 acceptance criteria 1-2)

Hermetic `/tmp` mirror of the live tree, the review's `sed` verbatim, nothing else changed.

RED-before (pre-change committed `.js`):

```
$ sed -i '' 's/^name: grugops-installer$/name: totally-different-name/' \
      $MIRROR/.claude/agents/grugops-installer.md
$ CHECK_ROOT=$MIRROR node scripts/check-foundation-guards.js
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 …)
  PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)
  PASS  WR-05 wording: closure beats present in all four tracking docs; …
ALL CHECKS PASSED
exit status: 0
$ CHECK_ROOT=$MIRROR node scripts/check-kit-refs.js  → ALL CHECKS PASSED (exit 0)
```

GREEN-after, **same mirror, same bytes**:

```
$ CHECK_ROOT=$MIRROR node scripts/check-foundation-guards.js
[guard_referential_integrity] role corpus == adapter directory == coordinator grant closure (KIT-03, D-09)
  FAIL  KIT-03: 1 adapter(s) whose frontmatter `name` does not equal their own filename stem — the
        platform resolves the coordinator's grant by NAME while this oracle compares FILENAMES, so the
        equality below would hold over two different namespaces and a granted name could resolve to no
        loaded agent while this guard printed a pass:
    .claude/agents/grugops-installer.md: declares `name: totally-different-name`, expected `name: grugops-installer`
1 CHECK(S) FAILED
exit status: 1
```

`grep -c "PASS  KIT-03"` over the GREEN-after output is **0** — the equality is never claimed.

**`check-kit-refs.js` over the renamed mirror still exits 0, and is recorded as-is.** That gate checks
kit *references*, not agent identity; widening it is not this plan's scope and is not claimed.

### Deletion demonstration (Task 2 acceptance criterion 2)

`nameMismatch`'s guard condition was neutered, the `.js` rebuilt, and the suite re-run. **All four**
identity cases failed (the criterion required at least two of three), then the block was restored and
rebuilt:

```
× referential integrity RED: one adapter's frontmatter `name` rewritten → nonzero + KIT-03 names it (CR-02, reproduced)
× referential integrity RED: a fixture-PLANTED adapter declaring a name ≠ its filename stem fails the same way
× referential integrity RED: an EMPTY `name` value is its OWN finding, never read as a match
× referential integrity RED: a DUPLICATE `name` key whose FIRST value matches is refused (27-19 red-team)
  Tests  4 failed | 80 passed (84)
```

### Gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` then `npm run freshness` | `All build outputs fresh: 31 committed .js file(s) match a fresh tsc rebuild.` |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 35 files, **964 passed / 2 skipped** (both skips pre-existing) |
| `node scripts/check-foundation-guards.js` (real tree) | exit 0, `PASS KIT-03: 17 roles == 17 adapters == 17 grant-closure names` |
| `npm run freshness:adapters` | 17 adapters, 0 byte differences, listings set-equal |
| `npm run freshness:catalog` | fresh |
| `scripts/check-foundation-guards.test.ts` case count | **79 → 82** (the plan's three) **→ 84** (with the two red-team cases) |
| `grep -c "nameMismatch" scripts/check-foundation-guards.ts` | 7 (≥ 2 required) |
| `grep -c "renameAdapterIdentity" scripts/check-foundation-guards.test.ts` | 6 (≥ 4 required) |
| `git diff --numstat` on the test file | additions only, **0 deletions** |
| `git diff --stat .claude/agents/` | empty — no adapter byte changed |
| `wc -c agent-factory/roles/orchestrator.md` | 7090 B, unchanged |
| `git status --porcelain` | clean of stray mirrors (all mirrors built outside the repo tree, removed) |

## Adversarial Self-Review (safety invariant — a green suite is not proof)

CLAUDE.md and this phase's standing lesson both require attacking a guard/oracle before calling it
done. **Thirteen parser-level probes plus ten full-mirror probes** were run against the *committed*
`.js`. The first draft — the review's suggested patch shape, reading `declaredValues[0]` — **failed
one of them outright**, and a second defect in the review's patch was caught by reading before it was
ever committed.

### BYPASS FOUND AND CLOSED: a duplicate `name:` key whose first value matches

```
name: grugops-installer
name: totally-different-name
```

`parseFrontmatter` returns `["grugops-installer", "totally-different-name"]`. The draft read `[0]`,
matched it against the filename, and the **entire gate printed `ALL CHECKS PASSED` (exit 0)** over a
document declaring two identities. Reversing the order (`totally-evil` first) failed red — so the
bypass was purely a matter of which decoy went on top.

**Root cause: the fix read the FIRST answer and called the mapping proven — the same "two answers to
one predicate" class this whole round exists to delete, reproduced inside the fix for it.** Which
answer the platform's loader honours (first, last, or a duplicate-key throw that stops the agent
loading at all) is not the oracle's to guess.

**Structural fix, not a heuristic:** the *cardinality* of the answer is pinned. A `name` key carrying
anything other than exactly one value is refused by name. Pinned by its own named case.

**No false-red surface, verified rather than asserted.** The parser joins a wrapped plain scalar into
a *single* value (`name: grugops-\n  installer` → `["grugops- installer"]`), so `length !== 1` means
the key genuinely appears more than once rather than "the value was long". It also already strips
quotes, trims trailing whitespace, drops a trailing `# comment`, and flattens `>`/`|` scalars. A
**green control case** walks four legitimate one-value spellings and asserts the 17/17/17 pass line
survives each.

### Probe table

| # | Probe | First draft | Now |
|---|-------|-------------|-----|
| A-B | `name: "grugops-installer"` / `'…'` — quoted | parses to one matching value | green (correct) |
| C-D | trailing whitespace / trailing `# comment` | one matching value | green (correct) |
| **E** | **duplicate `name:` key, matching value FIRST** | **BYPASS — ALL CHECKS PASSED exit 0** | **refused, names both values** |
| F | duplicate `name:` key, matching value SECOND | refused (by luck of ordering) | refused, by cardinality |
| G | `name: "   "` — whitespace-only | mismatch, red | mismatch, red |
| H-I | `>` folded / `|` literal one-line name | one matching value | green (correct) |
| J | `name: [grugops-installer]` — flow sequence | mismatch, red | mismatch, red |
| K | `name: grugops-INSTALLER` — case flip | mismatch, red | mismatch, red |
| L | extra leading spaces in the value | one matching value | green (correct) |
| M | tab-indented second `name:` (a continuation) | joined, mismatch, red | joined, mismatch, red |
| N | the **coordinator's own** name renamed | red | red |
| P | name off by a single trailing character (`grugops-installers`) | red | red |
| Q | name missing the `grugops-` prefix (`installer`) | red | red |
| R | `name` key deleted outright | red (absent-key arm) | red (absent-key arm) |
| V | **two** adapters renamed at once | red, both named, sorted | red, both named, sorted |
| W | unmodified control mirror | green | green |

### A second defect in the review's suggested patch, caught before committing

The review's patch computes the expected name as `` `${AGENT_PREFIX}${stem(basename(f))}` ``. Adapter
filenames **already carry the namespace** (`grugops-installer.md`, never `installer.md`), so joining
`AGENT_PREFIX` a second time compares against `grugops-grugops-installer` and would have failed **all
seventeen shipped adapters** — a guard red on a correct tree. `AGENT_PREFIX` is joined exactly once,
up at `roleNames`, to the bare *role* stem; `adapterNames` deliberately does not re-join it. The
implemented expected name is `stem(basename(f))`, and the reason is recorded in the code so the next
reader does not "restore" the review's formula. See Deviations.

### Edges from the plan's `must_haves`, each verified

- **Boundary:** exactly one mismatched adapter out of seventeen → `1 adapter(s)`, naming
  `grugops-installer.md` and no other.
- **Adjacency:** a name differing only by the missing `grugops-` prefix (probe Q) or by one trailing
  character (probe P) is reported as a mismatch — near-equality never folds into equality.
- **Empty:** an empty value and an absent key produce **two distinct findings**, each asserted by its
  own wording and each asserted *not* to be the other.
- **Encoding:** exact JavaScript string equality, no case folding, no normalisation — probe K (case
  flip) is red.
- **Ordering:** three simultaneously mismatched adapters, two consecutive runs, output **byte-identical**
  under `cmp`, members sorted (`aa`/`mm`/`zz` reported in path order).
- **Precision:** no numeric comparison was added; the cardinality checks below remain strict integer
  equality with no tolerance band.

### Residual, dispositioned

- **A whitespace-only `name` value (`name: "   "`) lands in the plain-mismatch arm, not the empty arm.**
  Honest rather than wrong — the value genuinely is `"   "`, not empty — and it fails **closed** (red,
  naming the file). Folding it into the empty arm would mean this oracle re-deciding what "empty"
  means instead of reporting what the parsing authority returned. Recorded so the next reader is not
  surprised.
- **The case-variant filename branch returns before this one,** so a tree carrying both a case-variant
  filename pair *and* a name mismatch reports only the case variant. Matches the existing refusal shape
  in this function; both directions are red, so nothing passes on the strength of the ordering.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's and the review's expected-name formula double-prefixes**
- **Found during:** Task 1, before the first commit (empirical check of the adapter corpus)
- **Issue:** Both the plan's `must_haves` truth ("equals the agent prefix joined to its filename stem")
  and the review's suggested patch compute `` `${AGENT_PREFIX}${stem(basename(f))}` ``. Adapter
  filenames already carry the `grugops-` namespace, so that expression yields
  `grugops-grugops-installer` and the assertion would have failed **all seventeen shipped adapters** —
  contradicting the plan's own acceptance criterion that the real tree still exits 0 with the 17/17/17
  pass line.
- **Fix:** the expected name is `stem(basename(f))` — the adapter's own filename stem, which is the
  same string `roleNames` builds by joining `AGENT_PREFIX` to the bare *role* stem. The reason, and the
  fact that the review's formula must not be "restored", are recorded in the code comment.
- **Files modified:** `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`
- **Commit:** `71324c0`

**2. [Rule 1 - Bug] Reading `declaredValues[0]` was itself a live bypass**
- **Found during:** adversarial self-review, after the Task 2 commit and before the plan was called done
- **Issue:** a duplicate `name:` key with the matching value first passed the fresh assertion; the whole
  gate printed `ALL CHECKS PASSED` exit 0 over a document declaring two identities.
- **Fix:** the cardinality of the answer is pinned — a `name` key with anything other than exactly one
  value is refused by name. Two cases added: the duplicate-key reproduction and a green control over
  four legitimate one-value spellings.
- **Files modified:** `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`,
  `scripts/check-foundation-guards.test.ts`
- **Commit:** `ccf0341`

**3. Two extra test cases beyond the plan's three (additive, nothing weakened)**
- The plan specifies three cases and the acceptance criterion "case count exactly three greater". The
  count after Task 2 was exactly **82 (79 + 3)**, satisfying it as written. The red-team fix then added
  two more — the duplicate-key reproduction and its green control — bringing the file to **84**. Both
  counts are recorded above. Flagging the departure from the literal count so the reviewer can see it
  was an addition on top of a satisfied criterion, not a substitution for it.

### Process Deviation

**One uncommitted change was lost and re-applied.** During the deletion demonstration the assertion was
neutered in the working tree, then restored with `git checkout -- scripts/check-foundation-guards.ts`.
That restored the file to the **Task 1 commit**, which silently discarded the not-yet-committed
cardinality arm. Detected immediately by grepping for the arm's wording rather than trusting the
restore, then re-applied verbatim and re-verified end to end (typecheck, build, freshness, both
reproductions, full suite) before committing. Recorded because the loss was caused by using a blanket
git restore on a file carrying uncommitted work — the exact class the executor's own destructive-git
guidance warns about, and the reason the arm is now committed rather than merely present on disk.

## Authentication Gates

None.

## Known Stubs

None. No placeholder values, no unwired data paths, no `TODO`/`FIXME` introduced.

## Deferred Issues

- **2 pre-existing skipped tests, untouched (out of scope).** `install/install.test.ts` (D-08 sh-vs-Node
  byte-parity, intentionally retired) and `scripts/generate-role-adapters.test.ts` (case-differing
  adapter names). Both predate this plan and neither is in this plan's files.
- **`check-kit-refs.js` still exits 0 over the renamed mirror.** Recorded honestly per the plan's
  verification block rather than widening this plan's scope: that gate checks kit *references*, not
  agent identity, and the identity predicate now has its authority asserted in the two places that
  consume it.
- **The whitespace-only-name residual** described under Adversarial Self-Review. Fails closed.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary —
this plan adds a refusal to an existing oracle and extends its test coverage.

## Threat Register Outcome

| Threat ID | Disposition | Outcome |
|-----------|-------------|---------|
| T-27-95 | mitigate | **Mitigated.** The declared frontmatter `name` is asserted equal to the adapter's own filename stem before any set comparison, so a file cannot present a filename identity it does not carry. Strengthened past the plan's specification: the *cardinality* of the declared name is pinned too, after a self red-team proved a matching decoy could otherwise hide the real identity. |
| T-27-96 | mitigate | **Mitigated.** The oracle `return`s on mismatch; `grep -c "PASS  KIT-03"` over the reproduction's output is 0. The three-way equality claim is never printed over two namespaces. |
| T-27-97 | mitigate | **Mitigated.** `npm run build` + `npm run freshness` green: 31 committed `.js` files match a fresh rebuild, so the CI gate runs the fixed code. |
| T-27-98 | accept | **Accepted.** Finding text prints repo-relative adapter paths, exactly as every sibling finding already does. No secret disclosed. |
| T-27-99 | accept | **Accepted, bounded.** The early return hides later KIT-03 directions, matching the existing refusal shape in this function — and the finding names **every** mismatched member at once (verified: three simultaneous mismatches all reported, sorted, byte-identically across runs), so no member is hidden behind another. |

## Self-Check

Files claimed as modified, verified present with the claimed symbols:

- `scripts/check-foundation-guards.ts` — FOUND; `nameMismatch` count = 7; four refusal arms present;
  header names the frontmatter `name` key as the identity authority and names
  `scripts/coordinator-resolution-precheck.ts` as the consumer already resolving by name.
- `scripts/check-foundation-guards.js` — FOUND; byte-fresh under `npm run freshness` (31 files).
- `scripts/check-foundation-guards.test.ts` — FOUND; `renameAdapterIdentity` count = 6; 84 cases pass;
  additions only, 0 deletions.

Commits verified in `git log`:

- `71324c0` — FOUND (Task 1, the mapping assertion)
- `3239e5b` — FOUND (Task 2, the de-blinded fixtures)
- `ccf0341` — FOUND (red-team fix, the cardinality pin)

## Self-Check: PASSED
