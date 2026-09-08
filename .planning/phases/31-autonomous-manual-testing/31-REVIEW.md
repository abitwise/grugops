---
phase: 31-autonomous-manual-testing
reviewed: 2026-09-08T18:50:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/17-task-claim.md
  - agent-factory/workflows/18-context-compaction.md
  - docs/audit/29-style-dispositions/31-09.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-uat-oracles.js
  - scripts/check-uat-oracles.ts
  - scripts/compactor.test.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/runnable-ref/fixtures/modifier-family.uat.spec.ts
  - scripts/runnable-ref/fixtures/modifier-group-clean.uat.spec.ts
  - scripts/runnable-ref/fixtures/playwright-test.d.ts
  - scripts/runnable-ref/uat-spec-integrity.js
  - scripts/runnable-ref/uat-spec-integrity.test.ts
  - scripts/runnable-ref/uat-spec-integrity.ts
findings:
  critical: 2
  warning: 3
  info: 3
  total: 8
status: issues_found
---

# Phase 31: Code Review Report (incremental — gap-closure round 2, plans 31-09..31-12)

**Reviewed:** 2026-09-08T18:50:00Z
**Depth:** standard
**Scope:** `41a2154..HEAD`, the 21 source files listed above
**Files Reviewed:** 21
**Status:** issues_found

## Summary

This round was convened to close CR-05 (`appendNote` reached the admission authority for one kind
only) and CR-06 (modifier membership decided by an enumerable literal). **Both are closed, and each
closure was re-measured on this tree against the committed `.js`, not taken from a summary:**

- CR-05: `appendNote(finding, §14-gate#fabricated-run-id)` into an empty context now throws the
  authority's own D-01 text and writes zero files; the same call with a genuine verdict writes. The
  kind axis is deleted rather than widened (`context-io.ts:1156` is an unconditional `admit()` call),
  the two branches that legitimately skip it go through a non-exported `appendPreAdmittedNote` whose
  caller set is AST-derived and asserted equal to `{admitAndAppend}` with exactly 2 call sites, and
  the refusal-family axis is now derived from `admit()`'s own return sites (8 signatures) rather than
  typed out — the exact "derive BOTH axes" correction the prior review asked for. R-21 (duplicate
  retained-ledger event) collapsed from 2 to 1 as a side effect.
- CR-06: membership is a head/tail rule in one function (`isBannedModifierPath`,
  `uat-spec-integrity.ts:131`). Measured: `test.describe.serial.only` → 1 finding, exit 1;
  `test.fail` → exit 1 (WR-12 closed); `test.step.skip` → exit 1; `test.describe.configure(...)`,
  `test.describe.serial(...)` → exit 0 (no false positive). A reverse partition over the declared
  surface exists (WR-13 closed at the strength it claims, which the recipe now states honestly).

Baseline health: `npm run freshness` reports 60/60 committed `.js` fresh (no `.ts`/`.js` drift); all
12 `DECIDER_MANIFEST` hashes in `hooks/hook-entry.ts` match the committed files byte-for-byte; the
five changed suites are 939/939.

**Two new defects, both found by asking how the gate is reached rather than what it refuses.** Neither
is a regression of the closed findings; one is a hole the widened rule cannot see by construction, the
other is a consequence of the unconditional call that the round's own blast-radius table dispositioned
as "admits, unchanged shape" without driving the case that changed:

- The modifier rule is asked only about callees `calleeDottedPath` resolves, and that resolver declines
  every chain containing a call. Playwright's `test.info().skip()` / `.fail()` / `.fixme()` — the
  documented runtime form of exactly the modifiers the rule bans — pass at `0 findings`, exit 0. So
  does `expect.configure({ soft: true })(...)`. The shape is not in `UNRESOLVABLE_CALLEE_RESIDUALS`,
  the recipe's boundary does not name it, and the reverse partition walks property chains only, so no
  bucket can ever hold it.
- With `admit()` now consulted for every note, the frozen D-04 arm fires on a **human-disposed**
  high-severity `finding` when it is *promoted*: the hook-gated combiner writes it at the origin, and
  `compactor.promote` (the writer Workflow 18 names) refuses the identical unchanged note at the
  destination. Under any active `human_admission` dial the compaction workflow can no longer carry a
  human-adjudicated security finding forward, and its only prescribed recovery (step 6) degrades it to
  an unverified `claim`.

No `<structural_findings>` block was supplied, so every finding is narrative. Numbering continues the
prior sequences (`CR-07+`, `WR-14+`, `IN-07+`).

## Prior findings status

| Prior | Status | Evidence (measured on this tree unless noted) |
|---|---|---|
| CR-05 `appendNote` reaches admission for `artifact-ref` only | **closed** | Unconditional `admit()` at `context-io.ts:1156`; fabricated `finding` stamp refused with the D-01 text, 0 files; fabricated `artifact-ref` still refused; genuine stamp writes. Family axis derived from source (8 sites), 4 writers × 8 families matrix with a neutralized-mirror inversion |
| CR-06 routed `describe` modifiers walk past the set | **closed** | `test.describe.serial.only` → exit 1; rule is head×tail + exact path, one authority, two type-checked corpus fixtures (family + false-positive control), module pin 67→69 |
| WR-10 `repoRoot` defaults to `ROOT` not `trustedRepoRoot()` | **closed as filed; residue → WR-15** | Both defaults moved together; watched-failing mirror restores the old default and flips the disposition. The trusted root's own fallback is the kit, which is what every non-CC CLI gets |
| WR-11 WF18 step 4 "fires on every promoted note" beside a one-kind clause | **closed** | Sentence is now true of the mechanism; step 5 distinguishes the writer's refusal from the explicit re-verify; 17 rows in `docs/audit/29-style-dispositions/31-09.md` |
| WR-12 `test.fail` undecided | **closed** | `fail` in `BANNED_MODIFIER_TAILS`; measured exit 1; finding text rewritten to be true of the inverting modifier |
| WR-13 ban/surface cross-check one-directional | **closed at declared strength** | Reverse partition: refused ∪ dispositioned = walked set, disjoint, counts sum, depth bound asserted reached, discriminates on a planted `test.mute`/`test.describe.shard`. Coverage of the *package* is disclaimed in the recipe and `R-43` |
| IN-04 ledger event before write refuses | **open by choice, now an assertion** | `context-io.test.ts` "IN-04 DISCLOSED" pins the extra-line direction |
| IN-06 `tsconfig.fixtures.json` disposition category | **still open** | `check-banned-claims.ts` not in this range |

## Critical Issues

### CR-07: `test.info().skip()` / `.fail()` / `.fixme()` and `expect.configure({ soft: true })(...)` pass at exit 0 — the rule is never asked about a callee that contains a call, and that boundary is disclosed nowhere the recipe quotes

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:595-628` (`calleeDottedPath`, the `return null` at
`:626` for any link that is not identifier/property/element/paren/non-null/assertion),
`:148-151` (`UNRESOLVABLE_CALLEE_RESIDUALS`, two members), `:131-142` (`isBannedModifierPath`),
`agent-factory/checklists/browser-uat-recipe.md:184-191`,
`scripts/runnable-ref/fixtures/playwright-test.d.ts:131-150` (no `info` member),
`scripts/runnable-ref/uat-spec-integrity.test.ts:1246-1256` (the walk follows `getPropertiesOfType` only)

**Issue:** D-17 fixed the *membership* question. The *reachability* question — which call expressions
the membership rule is even asked about — is answered by `calleeDottedPath`, and it returns `null` for
any chain with a `CallExpression` link. The docstring calls this deliberate ("`expect(x).soft` is not
`expect.soft`"), which is right for that example and wrong as a policy: Playwright's `TestInfo` object,
obtained by `test.info()` or as the second fixture argument, carries `skip()`, `fixme()`, `fail()` and
`slow()` — the documented *runtime* form of precisely the modifiers the tail set bans, with the same
effect on the evidence (the scenario is skipped, or a failing assertion is reported as a pass).

**Reproduced on this tree** (probe repo with `uat/probe.uat.spec.ts`, committed runnable):

```
test.describe.serial.only(...)                 -> 1 finding(s), exit 1   (control: the rule works)
test("a", async ({page}) => { test.info().skip(); ... })   -> 0 findings over 1/1, exit 0
test("a", async ({page}) => { test.info().fail(); ... })   -> 0 findings over 1/1, exit 0
test("a", async ({page}) => { test.info().fixme(true, "later"); ... }) -> 0 findings, exit 0
await expect.configure({ soft: true })(locator).toBeVisible()   -> 0 findings, exit 0
```

Three things make this a Critical rather than a set-content Warning:

1. **It is undisclosed at every quoted boundary.** `UNRESOLVABLE_CALLEE_RESIDUALS` names the alias
   shape and the computed-member shape and says "Both shapes are therefore NAMED here rather than
   left as a silence" — the call-link shape is the third, and it *is* a silence. The recipe's
   "Deliberately outside the rule" list (lines 184-191) inherits the same two. `R-46` in
   `31-12-SUMMARY.md` restates the alias case only.
2. **The stated reason for the residuals does not apply.** Both disclosed residuals are justified by
   "needs a type checker to follow a binding to its declaration". `test.info().skip` needs no binding
   followed: the head identifier `test`, the member `info`, the call, and the member `skip` are all in
   the source text. The resolver could emit a path (e.g. `test.info().skip`, or a marker segment) from
   the parse alone.
3. **The reverse partition cannot ever find it.** The walk (`deriveDeclaredModifierPaths`) descends via
   `checker.getPropertiesOfType` and never through a call signature's return type, and the stub
   declares no `info`. So even if the `.d.ts` were extended, `test.info().skip` is outside both buckets
   by construction — the partition's "total" claim is total over property chains, and the recipe's
   completeness paragraph does not say so.

`testInfo.skip()` via the fixture parameter also passes (measured), but that is a binding and falls
under the disclosed alias residual in spirit; it is listed here for completeness, not counted.

**Fix:** Decide the call-link shape instead of declining it, in the one resolver, and let the rule see
it:

```ts
// In calleeDottedPath: a call link is RESOLVED, not dropped. `test.info().skip` is the runtime
// spelling of `test.skip`; the head and tail are what the rule reads, and both are in the source text.
// The parenthesised marker keeps `expect(x).soft` distinguishable from `expect.soft`, so the
// legitimate chained assertion stays legitimate: its head is `expect()`, not `expect`.
if (ts.isCallExpression(cur)) {
  const inner = calleeDottedPath(ts, cur.expression);
  if (inner === null) return null;
  segments.push(`${inner}()`);           // e.g. ["skip", "test.info()"]
  segments.reverse();
  return segments.join(".");             // "test.info().skip"
}
```

then in `isBannedModifierPath`, read the head as the first segment *stripped of a trailing `()`* only
when that segment is `test.info()` (a decided list of call-bearing heads, recorded as a decision like
D-17), and add `expect.configure` with a `soft: true` literal argument to `BANNED_EXACT_PATHS`'s
neighbour rule or to the residuals with a written reason. Whatever is chosen: add the four probes above
to the corpus (a `MUTATE-REMOVE` fixture like `modifier-family.uat.spec.ts`), declare `info` on the
stub's `Test` so the forward direction compiles it, name the call-link shape in
`UNRESOLVABLE_CALLEE_RESIDUALS` *if* any part of it stays undecided, and state in the recipe's
completeness paragraph that the reverse walk covers property chains only.

---

### CR-08: under an active `human_admission` dial, compaction can no longer promote a human-disposed high-severity `finding` — `admit()`'s frozen D-04 arm refuses at the destination what the hook-gated combiner admitted at the origin

**File:** `scripts/context-io.ts:1156` (the unconditional call), `:1841-1858` (the D-04 arm that
refuses a self-authored `human:<name>` stamp on a high-severity finding), `scripts/compactor.ts:615`
(`promote` → `appendNote`), `agent-factory/workflows/18-context-compaction.md:51-55`,
`.planning/phases/31-autonomous-manual-testing/31-09-SUMMARY.md` blast-radius row 2 ("admits,
unchanged shape") and probe Q5 (fabricated stamp only)

**Issue:** The round correctly identified that `admitAndAppend`'s gated branch must skip `admit()`,
because D-04 "cannot verify" a human stamp and would refuse a note the hook already disposed
(`context-io.ts:2660-2668`). The same reasoning applies to every *re-write* of that note — and
Workflow 18 prescribes exactly one: promotion through `appendNote`. That route now calls `admit()`
unconditionally, so the D-04 arm fires on the promoted copy.

**Reproduced on this tree** (`CLAUDE_PROJECT_DIR` → a project with
`{ human_admission: "high-severity", audit_retention: "retained" }`, no approval env in the child):

```
origin admitAndAppend (gated branch): WROTE 20260908T020000Z-security-nfr-finding-e87a634e
compactor.promote (same note, same body, fresh destination):
  REFUSED — admission REFUSED (human_admission: high-severity): a high-severity governance entry
  authored by "security-nfr" ... carries a self-authored human disposition stamp (verified_by: human:alice)
  that this in-script tier cannot verify ...
dest notes: []
appendNote (direct, same note): REFUSED — same text
```

The finding was not changed by compaction; its stamp is the one the human placed; the admission ledger
already carries the human's disposition for it. Workflow 18 step 4 now says "Phase-21 admission
therefore fires on every promoted note, of every kind" as if that were only a strengthening; step 6's
only recovery is "Degrade to a `claim` carrying `confidence: UNKNOWN - verify`". So in the governance
mode grugops sells to regulated teams, every compaction turns every human-adjudicated security /
architecture / release finding into an unverified claim, and nothing in the substrate records that a
human had disposed it. On Claude Code the per-call hook cannot help: it gates
`mcp__grugops__propose_note`, and `compactor.js` is not that channel.

This is created by the round, not inherited: before 31-09 `promote` wrote a `finding` unconditionally
(the CR-05 bypass), and 31-05's scoped call did not reach D-04. The blast-radius table enumerated the
`promote` call site and dispositioned it as "admits, unchanged shape ... for every kind"; the only
`promote` probe (Q5) used a fabricated `§14-gate` stamp. The case that changed — a *legitimate*
human-disposed high-severity note — was not driven.

**Fix:** Promotion of a note that was already admitted is not a new admission; it is a re-binding.
Give the compactor the pre-admitted route through a *proof*, not a parameter an agent can set:

```ts
// compactor.promote: promotion is a RE-WRITE of a note that already exists, admitted, under the
// same task. Prove that before persisting: the source note's id must be live in the origin
// context and its retained-ledger / origin fence must carry the human disposition verbatim.
// Only then is the copy written through the pre-admitted route; a stamp that cannot be traced
// to an admitted origin note goes through appendNote (full admission) exactly as today.
```

Concretely: (a) add an exported `promoteAdmitted(task, sourceId, note, body, from, to)` in
`context-io.ts` that reads the source note by id from `from`, asserts byte-equality of
`kind/by/verified_by/at` with the promoted input and that the source is in `currentState(readContext(task, from))`, then writes via `appendPreAdmittedNote`; (b) extend the derived caller-set
assertion in `context-io-writer-set.test.ts` to the new caller and bump the call-site count with the
usual watched-fail mirror; (c) drive a test with `human_admission: high-severity` where the combiner
writes at the origin and `promote` carries it to the destination unchanged; (d) rewrite WF18 step 4/6
so "degrade to a claim" is the posture for a *changed* finding only. If instead the team decides
promotion must re-adjudicate, then WF18 must say that a human re-disposes every promoted high-severity
finding through the hook, and the compactor must refuse loudly rather than instruct a silent downgrade —
either way the current prose and mechanism disagree.

## Warnings

### WR-14: an import-renamed head (`import { test as it }`) evades the rule, and the disclosed alias residual's justification is false for it

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:148-151`, `:595-628`,
`agent-factory/checklists/browser-uat-recipe.md:190`

**Issue:** Measured: `import { test as it, expect } from "@playwright/test"; it.skip(...);
it.describe.only(...)` → `0 findings over 1/1`, exit 0. The recipe covers this only via "An aliased
binding is not refused: `const t = test;` ... cannot be followed to its declaration without a type
checker." An `ImportSpecifier` rename is in the same file's AST with a literal `propertyName`; no type
checker is needed to map `it` → `test`. Renaming on import is idiomatic Playwright (its own docs use
`import { test as base }`), so this evasion does not even look like one in review.

**Fix:** In `calleeDottedPath`'s caller (or a one-line pre-pass over the source file's import
declarations), build `Map<localName, importedName>` for the `@playwright/test` specifier and
canonicalise the head segment through it before the rule is asked. Add a corpus fixture. If deliberately
left out, change the residual's text so its reason is true: "an aliased binding *declared by assignment*
is not refused; an import rename *is / is not* resolved" — and add the import case to the recipe.

---

### WR-15: `trustedRepoRoot()`'s fallback is the kit, so on the four non-Claude-Code CLIs — the only tier for which `appendNote` is the in-script refusal — governance is read from `~/.grugops`, never from the target repo's seeded `.grugops/factory.config.json`

**File:** `scripts/context-io.ts:2323-2337` (`return GOVERNANCE_FALLBACK_BASE` when
`CLAUDE_PROJECT_DIR` is unset), `:1109-1125` and `:2615-2624` (both defaults now resolve through it),
`agent-factory/workflows/16-context-read-write.md:32` (the sentence added this round),
`install/install.ts:36-40` (two-root layout: kit at `$GRUGOPS_HOME`, config seeded per repo)

**Issue:** WR-10's fix is faithful to what was asked, and the mirror test proves the default moved. But
the "one trusted answer" is `CLAUDE_PROJECT_DIR`-or-kit, and `CLAUDE_PROJECT_DIR` is a Claude Code
variable. Measured with the env unset: `trustedRepoRoot()` → `GOVERNANCE_FALLBACK_BASE` → the module's
install root. Under the shipped two-root install that is `~/.grugops`, whose only config is the shipped
lean default. So on Codex / Gemini / OpenCode / Copilot the D-04 and D-14 arms that WF16 now promises
("`appendNote` ... reaches that refusal for every note it takes") are evaluated against
`human_admission: off`, whatever the target repository's dial says — the exact symptom WR-10 described,
one CLI family over. Every WR-10 test case sets `CLAUDE_PROJECT_DIR`; none runs with it unset from a
cwd that carries a config.

**Fix:** Give the trusted root a non-CC answer that is still not caller-chosen: honour a documented
`GRUGOPS_PROJECT_DIR` (set by the installer's per-repo adapter, not by the agent), else discover the
project root from `process.cwd()` by walking up to the nearest `.grugops/factory.config.json` or `.git`,
else the kit. Assert it in one case with `CLAUDE_PROJECT_DIR` unset, cwd = a temp project with
`human_admission: high-severity`, expecting the refusal — and one control with cwd = an empty dir. Then
qualify the WF16 sentence: the refusal reads the target repo's dial only where the root is resolved.

---

### WR-16: `equivDoWork`'s doc comment describes a mechanism the function does not have (a REAL verdict + a stamped finding)

**File:** `scripts/check-uat-oracles.ts:541-545` (the comment), `:557-575` (the code)

**Issue:** The comment reads "Each task gets one REAL green §14-gate verdict for FIXED_ID, one soft
observation note (no stamp), and one admitted finding carrying the frozen §14-gate stamp". The function
emits no verdict and writes an unstamped `claim` with the id in `refs` — the block directly above it
(`:482-508`) explains at length *why* the verdict attempt was measured and reverted. The comment is the
reverted attempt's, left behind. In a Tier-1 oracle whose whole doctrine is "the claim matches the
mechanism", a docstring that claims a stamp the fixture never earns is the defect class this round
exists to remove, and it will mislead the next person who wonders why `stampedA !== 0` is asserted.

**Fix:** Replace with what the code does: "Each task gets one soft `observation` (no stamp) and one
unstamped `claim` carrying `FIXED_ID` in `refs`. No verdict is emitted here — see the 31-09 block above
for why — and the oracle asserts that no note on either path carries a `§14-gate` stamp."

## Info

### IN-07: WF18 step 5 "carry no stamp and pass through" is no longer exact under D-14

**File:** `agent-factory/workflows/18-context-compaction.md:53`

**Issue:** With `admit()` consulted for every kind, an unreadable governance config (D-14) refuses a
promoted `claim` / `observation` / `decision` / `failed-attempt` too. "Pass through" was true when the
writer had a kind axis; it is now "admitted unless the dial is unreadable".

**Fix:** "... carry no stamp and are admitted without a cross-check (an unreadable governance
configuration still refuses every kind — D-14)."

---

### IN-08: the Tier-1 dual-path oracle and every default-root `appendNote` now read the *ambient* trusted root, so a retained-mode project under `CLAUDE_PROJECT_DIR` receives ledger lines from a deterministic oracle

**File:** `scripts/check-uat-oracles.ts:557`, `:570`; `scripts/context-io.ts:1125`

**Issue:** `equivDoWork` calls `appendNote(..., sub.contextRoot)` with no `repoRoot`, so
`admit()` resolves governance from `trustedRepoRoot()`. Run inside Claude Code against a project whose
config says `audit_retention: retained`, the oracle appends 12 admission events (3 tasks × 2 notes × 2
paths) into that project's `.grugops/audit/admissions.jsonl` on every run, and an unreadable config there
makes the whole `check-foundation-guards` lane fail for a reason unrelated to what it measures. This
repo's own root reads lean (asserted by the A2 case), so CI is unaffected today.

**Fix:** Pass an explicit lean temp `repoRoot` to both `appendNote` calls in `equivDoWork` (the seam
exists for exactly this), with a one-line comment that a Tier-1 oracle never writes to the host ledger.

---

### IN-09: residuals confirmed present and correctly dispositioned

**File:** `.planning/phases/31-autonomous-manual-testing/31-09..31-12-SUMMARY.md`,
`docs/audit/29-style-dispositions/31-09.md`

**Issue:** Recorded so they are not re-raised: `R-43`/`R-44`/`R-47` (declared surface is a hand
transcription and now a denominator; depth bound 4; disposition record hand-authored) — all accurately
stated in the recipe and the `.d.ts` header; `R-46` (alias outside both buckets) — accurate but
incomplete, see CR-07; `Q9` (an in-process importer can mint a verdict via `emitVerdict`) — disclosed,
pre-existing; the 78 undispositioned clauses from 31-05/06/08 deferred with a measured count. The
`31-09.md` disposition file's row for WF18 line 51 explains the `§14-gate` (no `#<id>`) spelling as a
`guard_context_writes` false-positive avoidance — worth a guard-side fix eventually so prose does not
have to route around a redirect misparse.

**Fix:** None required beyond the cross-references above.

---

_Reviewed: 2026-09-08T18:50:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Diff base: 41a2154_
