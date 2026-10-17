---
phase: 27-spawn-correctness-kit-set-authority
plan: 20
subsystem: tooling / build-safety guards
tags: [SPAWN-05, SPAWN-04, CR-03, WR-05, one-predicate-one-treatment, fail-closed]
status: complete
requires:
  - scripts/frontmatter.ts (TOOLS_KEYS + stripFencedBlocks, the parsing authority — plans 27-12 / 27-18)
  - scripts/check-foundation-guards.ts guardAdapterBody positive half (the treatment reused — plan 27-14)
  - scripts/check-foundation-guards.ts guardWr05 name-key floor (the argument extended — plan 27-12)
provides:
  - "one shared stripHtmlComments/countOccurrences pair declared beside collapseWhitespace, read by guard_wr05's tier-beat check AND guard_adapter_body's positive half — one predicate, one treatment"
  - "a tier-beat finding split on the COUNT: the zero arm keeps its wording byte-for-byte, the >1 arm is new"
  - "a WR-05 PASS line that names the input shape it read (live, non-fenced, non-commented, each beat exactly once)"
  - "a tools-key floor over AGENT_ADAPTERS with TWO arms — absent key and EMPTY value — scoped by the imported TOOLS_KEYS"
  - "stripHtmlComments fails CLOSED on an unterminated `<!--`, matching stripFencedBlocks' stated unterminated-fence rule"
affects:
  - "guard_adapter_body inherits the unterminated-comment fail-safe through the shared helper — the same safe direction, verified green"
  - "no adapter, role or packaging byte changed; the 7570 B FAIL ceiling and 7165 B WARN tier untouched"
tech-stack:
  added: []
  patterns:
    - "two checks reading ONE body must read it the SAME way — the shared helpers live beside the shared normalizations, not beside one of their two callers"
    - "an existing finding's wording is a CONTRACT with the cases that pin it; extend the split, never churn the message"
    - "a PASS line APPENDS the input shape it read; the phrase a case pins is kept verbatim"
    - "absence and emptiness are two findings, never one silence — the split plan 27-19 made on `name`, reused on `tools`"
    - "an unterminated construct extends to EOF and is never emitted — one rule for both strippers, taken from this tree's own precedent"
key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
decisions:
  - "The tier-beat ZERO arm keeps its EXISTING wording byte-for-byte, `why` clause and BEAT_DEFAULT_WHY fallback included — a deliberate deviation from the review's single-message patch. Five removal cases and three command-name cases pin that wording; they are correct pins on a real failure, and rewriting them to accommodate a tidier message would be weakening working coverage for nothing."
  - "The PASS line is APPENDED to, never rewritten. `all N tier-announcement beats` survives verbatim so its case stays valid, and the clause that makes the claim TRUE — each beat exactly once in live, non-fenced, non-commented text — follows it."
  - "stripHtmlComments and countOccurrences are RELOCATED beside collapseWhitespace, not copied. Their old placement next to one of their two callers is what made it natural to write the sibling check inside the same aggregator as a bare `.includes()`."
  - "An unterminated `<!--` extends to EOF and is stripped, so a malformed comment fails CLOSED. The rule is taken from stripFencedBlocks' own stated unterminated-fence treatment rather than invented — one rule for both strippers."
  - "A `tools` key present with an EMPTY value is its OWN finding. What the platform does with a null allow-list is UNKNOWN, and an empty declaration prints the same silence as no declaration, which is this floor's founding argument."
  - "The floor is scoped by the IMPORTED TOOLS_KEYS, per the plan's must_have, and the resulting `allowed-tools`-only residual is RECORDED rather than silently rescoped — narrowing it would create a second answer to 'which keys grant a tool'."
metrics:
  duration: ~30 min
  completed: 2026-07-30
  tasks: 2
  commits: 3
  files_modified: 3
  tests_added: 5
---

# Phase 27 Plan 20: One Treatment Per Predicate in `guardWr05()` Summary

`guardWr05()`'s tier-beat check now reads the coordinator body through exactly the composition
`guard_adapter_body`'s positive half has used since plan 27-14 — one fence authority, comments
removed, occurrences counted — and every agent adapter must DECLARE a tool allow-list. Both review
reproductions that printed `ALL CHECKS PASSED` at HEAD now exit 1 and name what is wrong.

## What Was Built

### Task 1 — CR-03: one predicate, one treatment

`scripts/check-foundation-guards.ts`:

- **`stripHtmlComments` and `countOccurrences` RELOCATED** from `:673-689` up beside
  `collapseWhitespace`, bodies unchanged. They are now where the *shared normalizations* live rather
  than beside one of their two callers — which is the structural point, not a tidying: their old
  placement is what made it natural for the sibling check *inside the same aggregator, reading the
  same body, 160 lines earlier* to be written as a bare `.includes()`. There is still exactly **one**
  of each (`grep -c "^const stripHtmlComments"` = 1, `grep -c "^function countOccurrences"` = 1).
- **The relocation comment records WHY a comment must be stripped before either predicate reads the
  body:** a comment quoting an announcement is not an announcement. Both former "POSITIVE half only"
  comments (the declaration's and `guard_adapter_body`'s header at `:636-638`) were updated to say the
  pair is shared, and the header keeps its accurate narrower claim about *its own* negative half.
- **The tier-beat body is now** `collapseWhitespace(stripHtmlComments(stripFencedBlocks(readText(…))))`
  followed by `countOccurrences` — byte-for-byte the expression `guard_adapter_body` builds.
- **The finding splits on the count**, mirroring `guard_adapter_body`'s own zero-versus-more-than-one
  split. The **zero arm keeps its existing wording byte-for-byte** (see Decisions); the **`> 1` arm** is
  new and names the beat label, the count, and that a body the generator does not produce is not a body
  this guard may pass.
- **The PASS line is appended to, not rewritten** — `all ${TIER_BEATS.length} tier-announcement beats`
  survives verbatim, followed by `each exactly once in live, non-fenced, non-commented text`.

`scripts/check-foundation-guards.test.ts` — two cases, both named for CR-03:

1. **The review's reproduction**: `mirror()`, the whole tier announcement block wrapped in
   `<!-- -->` and nothing else changed. It **guards its own fixture** the way `wrongCommandCases` do
   (three markers asserted present *before* the wrap, two re-asserted *after*, so the case can never
   degrade into a silent no-op plant), asserts non-zero, asserts **all six** beat labels are named, and
   asserts the PASS claim is **absent**.
2. **The duplicated beat**: one tier line duplicated in live text; asserts the `> 1` finding names the
   beat and the count.

### Task 2 — WR-05: an absent declaration is reportable

`scripts/check-foundation-guards.ts`:

- **`TOOLS_KEYS` imported** from `./frontmatter.js` into the existing import list, with a comment
  recording why it is imported rather than restated: the floor must be scoped by the same list
  `keysHaveSpawnGrant()` reads, or it could pass a file whose grant the grant test never looks at.
- **The `AGENT_ADAPTERS` floor loop gains the tools condition**, and the scoping comment is extended to
  record that *the same argument that justified the `name` floor is what justifies this one* — an
  absent key and a declared no-spawn key print the same silence and mean opposite things. Per this
  project's own stack notes, omitting `tools` makes the platform grant every main-conversation tool,
  `Agent` included, so an absent key is a grant **by inheritance**.

`scripts/check-foundation-guards.test.ts`:

- **`consistentMirror()` and `plantPlainAdapter()`** now emit a declared, deliberately **spawn-free**
  `tools` line, each commented as **load-bearing, not decoration** — the same note `consistentMirror()`
  already carries for the memory sentence.
- **One RED case**: the review's reproduction — the `tools:` line deleted from `grugops-qe-e2e`, fixture
  guarded by asserting the line was present first, asserting the adapter path, the
  grant-by-inheritance consequence, and **no** `PASS  WR-05:` line.

## Verification Evidence

### RED-before / GREEN-after — both review reproductions (four transcripts)

Hermetic `/tmp` mirrors of the live tree, the review's mutations verbatim, nothing else changed. Both
mirrors were confirmed **green before mutation**.

**CR-03 — RED-before (pre-change committed `.js`):**

```
$ # the whole tier announcement block in .claude/agents/grugops-orchestrator.md wrapped in <!-- -->
$ CHECK_ROOT=$MIRROR node scripts/check-foundation-guards.js
[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 non-coordinator
        adapter bodies + 2 packaging template(s) checked), and the coordinator body carries all 6
        tier-announcement beats
ALL CHECKS PASSED
exit status: 0
```

**CR-03 — GREEN-after, SAME mirror, SAME bytes:**

```
$ CHECK_ROOT=$MIRROR node scripts/check-foundation-guards.js
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/agents/grugops-orchestrator.md: coordinator body is missing the tier-announcement beat "Full tier label" …
.claude/agents/grugops-orchestrator.md: … "Reduced tier label" …
.claude/agents/grugops-orchestrator.md: … "Degraded tier label" …
.claude/agents/grugops-orchestrator.md: … "reduced-path enforcement disclosure" …
.claude/agents/grugops-orchestrator.md: … "capability-sensing selection signal" …
.claude/agents/grugops-orchestrator.md: … "reduced-tier command name" …
1 CHECK(S) FAILED
exit status: 1
```

`grep -c "carries all 6 tier-announcement beats"` over the GREEN-after output is **0** — the claim is
never printed. All six beat labels are named, and the zero-arm wording is byte-identical to what the
eight pre-existing cases pin.

**WR-05 — RED-before:**

```
$ sed -i '' '/^tools:/d' $MIRROR2/.claude/agents/grugops-qe-e2e.md
$ CHECK_ROOT=$MIRROR2 node scripts/check-foundation-guards.js
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 …)
ALL CHECKS PASSED
exit status: 0
```

**WR-05 — GREEN-after, SAME mirror:**

```
$ CHECK_ROOT=$MIRROR2 node scripts/check-foundation-guards.js
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/agents/grugops-qe-e2e.md: agent adapter declares no `tools` key — omitting it makes the platform
        grant every main-conversation tool INCLUDING the spawn tool, so an absent key is a grant by
        inheritance and this guard cannot report on it
1 CHECK(S) FAILED
exit status: 1
```

### Deletion demonstrations — each new case pins exactly its own assertion

Three separate rounds: the assertion was neutered, the `.js` rebuilt, the suite re-run, then restored
and rebuilt (`git checkout --` used only on a file with **no** uncommitted work — the 27-19 process
lesson).

| Assertion neutered | Failing case | Result |
|---|---|---|
| the tools-key floor block replaced with `void TOOLS_KEYS;` | `guard_wr05 agent adapter with NO tools key → nonzero + names the file and the grant-by-inheritance consequence (WR-05, reproduced)` | 1 failed / 86 passed |
| `stripHtmlComments` removed from the tier-beat input | `guard_wr05 the WHOLE tier announcement wrapped in an HTML comment → nonzero + names all 6 beats (CR-03, reproduced)` | 1 failed / 86 passed |
| `countOccurrences` replaced by an existence test | `guard_wr05 a tier beat stated TWICE in live text → nonzero + names the beat and the count (CR-03)` | 1 failed / 86 passed |

Exactly one case failed each time — no case is over-determined, and none of the 86 others depends on
these fixes.

### Gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` then `npm run freshness` | `All build outputs fresh: 31 committed .js file(s) match a fresh tsc rebuild.` |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 35 files, **973 passed / 2 skipped** (both skips pre-existing) |
| `node scripts/check-foundation-guards.js` (real tree) | exit 0, PASS line contains `all 6 tier-announcement beats` |
| `grep -L "^tools:" .claude/agents/*.md` | prints nothing — the real tree satisfies the new floor with **no adapter edit** |
| `grep -c "TOOLS_KEYS" scripts/check-foundation-guards.ts` | 2 (≥ 2 required) |
| `grep -c "^const stripHtmlComments"` / `"^function countOccurrences"` | 1 / 1 — no second implementation |
| `check-foundation-guards.test.ts` case count | **84 → 86** (Task 1, +2) **→ 87** (Task 2, +1) **→ 89** (self-review, +2) |
| `git diff --numstat` on the test file | **192 additions, 3 deletions** — all three deletions are fixture template-literals that GAINED a `tools:` segment; **zero assertions, zero cases removed** |
| `npm run freshness:adapters` | 17 adapters, 0 byte differences, listings set-equal |
| `node scripts/check-kit-refs.js` | exit 0 |
| `git diff --stat` on `.claude/agents/` and `agent-factory/` | empty — no adapter, role or packaging byte changed |
| 7570 B FAIL ceiling / 7165 B WARN tier | untouched (`git diff` over the plan shows no change to either constant); `orchestrator.md` = 7090 B |
| `git status --porcelain` | clean; every mirror was built outside the repo tree and removed |

## Adversarial Self-Review (a green suite is not proof)

CLAUDE.md and this phase's standing lesson both require attacking a guard before calling it done.
**Eighteen hermetic full-gate probes** were run against the *committed* `.js`. **Two of them were live
bypasses of the very finding this plan closes, reached by another route**, and both were fixed
structurally rather than patched around.

### BYPASS FOUND AND CLOSED (probe E): an UNTERMINATED `<!--` stripped nothing

```
$ # "<!-- UNCLOSED" inserted before the announcement, never closed
$ CHECK_ROOT=$D node scripts/check-foundation-guards.js   →  ALL CHECKS PASSED (exit 0)
```

The regex `<!--[\s\S]*?-->` requires a closing delimiter, so an unterminated comment matched nothing,
**every beat after it counted as live and the guard passed** — while a reader of the rendered markdown
sees an HTML block swallowing the rest of the document. That is the guard claiming an announcement
nobody can read: **CR-03 by another route, inside the fix for CR-03.**

**Structural fix, taken from this tree's own precedent rather than invented.** `stripFencedBlocks()`
states its rule for the identical class at `frontmatter.ts:104-107`: an unterminated fence leaves the
tail *inside* and never emits it, so "a malformed doc can never leak an unguarded live grant past the
strip." `stripHtmlComments()` now applies the same rule — **an unterminated construct extends to EOF**
— so a malformed comment fails **closed**. One rule for both strippers, not a second heuristic.
`guard_adapter_body` inherits the same safe direction through the shared helper.

### BYPASS FOUND AND CLOSED (probe F): `tools:` with no value defeated the key-presence floor

```
$ # `tools: Read, Grep, …` replaced by a bare `tools:`
$ CHECK_ROOT=$D node scripts/check-foundation-guards.js   →  ALL CHECKS PASSED (exit 0)
```

`parseFrontmatter` returns `['tools', ['']]` — a **present** key carrying an empty value — so
`keys.has("tools")` was true and the floor passed. The same bypass the plan closes, **reachable by
deleting a VALUE instead of a LINE**, and what the platform does with a null allow-list is genuinely
UNKNOWN: if it reads null as absent, the sub-agent inherits every tool including `Agent`.

**Structural fix, and the precedent is one plan old.** Plan 27-19 split exactly this pair on the `name`
key — absence and emptiness are two findings, never one silence. The floor now has both arms, each with
its own wording, each pinned by a case that asserts it is **not** the other. An empty declaration
prints the same silence as no declaration, which is this floor's founding argument verbatim.

### Probe table (all 18, against the committed `.js`)

| # | Probe | Before | After |
|---|-------|--------|-------|
| CR-03 | whole tier announcement in `<!-- -->` | **PASS, exit 0** | red, all 6 beats named |
| A | exactly ONE beat wrapped in a comment | PASS | red, that one beat |
| B | beat live once + a commented copy elsewhere | green | green (correct — one live occurrence) |
| C | whole announcement moved inside a ``` fence | red | red, all 6 |
| D | empty coordinator body (frontmatter only) | red | red, all 6 (never a vacuous pass) |
| **E** | **unterminated `<!--` before the announcement** | **PASS, exit 0 — BYPASS** | **red, fails closed** |
| **F** | **`tools:` present with an EMPTY value** | **PASS, exit 0 — BYPASS** | **red, its own finding** |
| F2 | `tools:` with a whitespace-only value | PASS | red (same arm — `.trim()`) |
| G | `tools` renamed to `allowed-tools` on an agent adapter | green | green — **recorded residual**, see below |
| H | real `tools` deleted, a fenced `tools:` example added | red | red (the fenced key is not frontmatter) |
| I | a comment splicing a beat mid-token (`- **Deg<!-- x -->raded** —`) | — | red (fails closed; the strip leaves `Deg raded`) |
| J | nested comment markers `<!-- outer <!-- inner … -->` | — | red |
| K | announcement hard-wrapped mid-sentence | green | green (**encoding edge** — collapse makes it one sentence) |
| L | the three tier bullets reordered | green | green (**ordering edge** — beats counted independently) |
| M | a beat live once + an "old copy" comment naming it | green | green (**adjacency edge** — one live occurrence) |
| N | the COORDINATOR's own `tools` line deleted | red | red (two findings, both correct) |
| WR-05 | `tools:` line deleted from `grugops-qe-e2e` | **PASS, exit 0** | red, names the adapter |
| W | unmodified control mirror | green | green |

### Edges from the plan's `must_haves`, each verified

- **Adjacency (SPAWN-05):** probe M — a needle once in live text and once inside an HTML comment counts
  as **one** live occurrence and passes; the duplicated-beat case proves the same needle twice in live
  text counts as **two** and fails.
- **Empty (SPAWN-05):** probe D — an empty coordinator body reports **all six** beats missing rather
  than vacuously passing; zero live occurrences is reported as the beat being missing, in the
  pre-existing wording.
- **Encoding (SPAWN-05):** probe K — a hard-wrapped announcement still reads as one sentence; the
  verdict never depends on where an author wrapped a line.
- **Ordering (SPAWN-05):** probe L — the six beats are counted independently; reordering the tier
  bullets changes neither the verdict nor the finding text.
- **Boundary:** probe A — exactly one commented beat out of six produces exactly one finding, naming
  that beat and no other.
- **The eight pre-existing tier-beat cases pass unmodified** — 0 deletions inside them, zero-arm wording
  byte-identical.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] The unterminated-comment and empty-tools-value bypasses**

- **Found during:** adversarial self-review, after the Task 2 commit and before the plan was called done
- **Issue:** both probes E and F reproduced this plan's own finding through a different door, each with
  the whole gate printing `ALL CHECKS PASSED` at exit 0 (detailed above).
- **Fix:** `stripHtmlComments` fails closed on an unterminated `<!--` (the rule `stripFencedBlocks`
  already states for an unterminated fence); the tools floor splits into absence and emptiness arms
  (the split plan 27-19 made on `name`). Two cases added.
- **Files modified:** `scripts/check-foundation-guards.ts`, `.js`, `.test.ts`
- **Commit:** `b031262`

**2. [Rule 1 - Bug] The new floor silently blunted the existing name-key case's pin**

- **Found during:** Task 2, before the commit
- **Issue:** the pre-existing `agent adapter with NO name key` fixture declared neither `name` nor
  `tools`, so once the tools floor landed it went red for **two** reasons. A case that stays red after
  the assertion it is named for is deleted has stopped pinning that assertion — my change would have
  blunted a working pin without touching a line of it.
- **Fix:** the fixture gained a `tools:` line so it fails for exactly one reason, plus a closing
  `expect(…).not.toMatch(/declares no \`tools\` key/)` stating so. **Strictly more precise, never
  weaker** — no assertion removed.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `551541e`

### Acceptance-criterion corrections (recorded, not silently satisfied)

**3. `grep -c "stripHtmlComments"` cannot report 3.** Task 1's criterion expected "exactly 3 — one
declaration and two call sites". At HEAD the symbol already had **five** occurrences (a comment
mention, the declaration and **three** call sites — `guard_adapter_body`'s positive half plus the
template half's two), so the criterion was unsatisfiable before the plan started. Its **intent** —
"there is no second implementation" — is verified directly and more precisely:
`grep -c "^const stripHtmlComments"` = **1** and `grep -c "^function countOccurrences"` = **1**. The
raw count is 9 (comments + 1 declaration + 4 call sites).

**4. Test-case counts include the self-review round.** Task 1's "+2" (84 → 86) and Task 2's "+1"
(86 → 87) were satisfied exactly as written at each commit. The self-review then added two more
(→ **89**) on top of satisfied criteria — an addition, never a substitution. Both intermediate counts
are recorded above.

## Authentication Gates

None.

## Known Stubs

None. No placeholder values, no unwired data paths, no `TODO`/`FIXME` introduced.

## Deferred Issues

- **Residual, dispositioned — probe G: an agent adapter declaring only `allowed-tools` satisfies the
  floor.** `TOOLS_KEYS` is `["tools", "allowed-tools"]`, and the plan's `must_haves` explicitly require
  the floor to import that list rather than restate key names. But the two directions want opposite
  scoping: for the **grant** test, reading both keys is *conservative* (a rogue `allowed-tools:
  Agent(…)` on an agent file fails red even though the platform would ignore it — safe); for the
  **floor**, reading both keys is *permissive* (an agent file declaring only `allowed-tools` — which
  Claude Code does not honor for sub-agents — is treated as having declared an allow-list, when the
  platform would inherit everything). Closing it needs a decision on per-surface key scope and would
  create a second answer to "which keys grant a tool", contradicting an explicit `must_have`.
  **Recorded honestly rather than silently rescoped**, in the same spirit as 27-19's `check-kit-refs`
  note. The surface is narrower than the plain deletion this plan closes — the generator emits `tools:`
  and `freshness:adapters` catches in-repo drift — but it is a live false negative and belongs in the
  next round.
- **2 pre-existing skipped tests, untouched (out of scope):** `install/install.test.ts` (D-08 sh-vs-Node
  byte-parity, intentionally retired) and `scripts/generate-role-adapters.test.ts` (case-differing
  adapter names). Neither is in this plan's files.
- **`node scripts/validate-agent-factory.js` exits 1 standalone**, with
  `ERROR VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`. Confirmed
  **pre-existing** by running the same command against `HEAD~3` (also exit 1). It is a usage refusal,
  not a failure, and its own test file supplies the variable. Out of scope; recorded rather than
  "fixed".

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary —
this plan tightens an existing guard and extends its test coverage.

## Threat Register Outcome

| Threat ID | Disposition | Outcome |
|-----------|-------------|---------|
| T-27-34 | mitigate | **Mitigated, and strengthened past the plan's specification.** Beats are counted in comment-stripped, fence-stripped, whitespace-collapsed live text, so a commented, fenced or duplicated announcement cannot satisfy the claim — and after self-review an *unterminated* comment cannot either. The mitigation the guard has named at its own tier-beat header since 27-08 is now real. |
| T-27-100 | mitigate | **Mitigated, two arms.** An absent `tools` key fails red by name; so does a key present with an empty value, after a probe proved key-presence alone was defeated by deleting a value instead of a line. One residual (`allowed-tools`-only) is recorded above rather than claimed closed. |
| T-27-101 | mitigate | **Mitigated.** The PASS line states the input shape it read — each beat exactly once in live, non-fenced, non-commented text — appended to the pinned phrase rather than replacing it. `grep -c` over both broken mirrors confirms the claim is never printed when the check fails. |
| T-27-102 | mitigate | **Mitigated.** `npm run build` + `npm run freshness` green: 31 committed `.js` files match a fresh rebuild, so the CI gate runs the fixed code. Rebuilt and re-verified after every one of the three deletion demonstrations. |
| T-27-103 | accept | **Accepted, and measured.** The fixtures gained a line rather than losing one: 192 additions / 3 deletions on the test file, all three deletions being template-literals that gained a `tools:` segment. Zero assertions and zero cases removed; all 84 pre-existing cases still pass. |

## Self-Check

Files claimed as modified, verified present with the claimed symbols:

- `scripts/check-foundation-guards.ts` — FOUND; `TOOLS_KEYS` count = 2 (import + floor);
  `^const stripHtmlComments` = 1; `^function countOccurrences` = 1; both declared above `guardWr05`.
- `scripts/check-foundation-guards.js` — FOUND; byte-fresh under `npm run freshness` (31 files).
- `scripts/check-foundation-guards.test.ts` — FOUND; 89 cases pass; 192 additions / 3 deletions.

Commits verified in `git log`:

- `ee63f00` — FOUND (Task 1, the comment-stripped counted tier-beat check)
- `551541e` — FOUND (Task 2, the tools-key floor and the de-blinded fixtures)
- `b031262` — FOUND (self-review, the unterminated-comment and empty-value bypasses)

## Self-Check: PASSED
