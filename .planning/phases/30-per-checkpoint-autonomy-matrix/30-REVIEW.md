---
phase: 30-per-checkpoint-autonomy-matrix
reviewed: 2026-09-06T16:10:38Z
depth: standard
files_reviewed: 36
files_reviewed_list:
  - hooks/admission-guard.ts
  - hooks/guard.ts
  - hooks/hook-entry.ts
  - hooks/hooks.json
  - install/install.ts
  - scripts/admission-server.ts
  - scripts/audit-model.ts
  - scripts/audit-prepass.ts
  - scripts/check-audit-register.ts
  - scripts/check-banned-claims.ts
  - scripts/check-claim-anchors.ts
  - scripts/check-diff-disposition.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/check-nul-bytes.ts
  - scripts/check-public-docs-vocabulary.ts
  - scripts/check-residual-citations.ts
  - scripts/check-uat-oracles.ts
  - scripts/checkpoints.ts
  - scripts/claim.ts
  - scripts/compactor.ts
  - scripts/context-freshness.ts
  - scripts/context-io.ts
  - scripts/frontmatter.ts
  - scripts/generate-guarantees.ts
  - scripts/generate-hook-manifest.ts
  - scripts/generate-safety-surface.ts
  - scripts/guarantees-freshness.ts
  - scripts/hook-manifest-freshness.ts
  - scripts/is-entry.ts
  - scripts/js-import-closure.ts
  - scripts/kit-model.ts
  - scripts/model-tiers.ts
  - scripts/now-running-freshness.ts
  - scripts/trace-freshness.ts
  - scripts/trace-render.ts
  - scripts/validate-agent-factory.ts
findings:
  critical: 3
  warning: 11
  info: 4
  total: 18
status: issues_found
---

# Phase 30: Code Review Report

**Reviewed:** 2026-09-06T16:10:38Z
**Depth:** standard
**Files Reviewed:** 36
**Status:** issues_found

## Summary

Reviewed the 36 non-test TypeScript sources in Phase 30's scope at standard depth. The
adversarial red-team surfaces (A and B) covered the bypass axes hard; this pass deliberately
targeted what they did not — ordinary correctness of the *derivation* half, resource handling,
error paths, portability, and dead/stale code. `tsc --noEmit` is clean.

Three findings are blocking. All three are in the *derivation and packaging* layer rather than
the decision layer, and each was reproduced by execution, not inferred:

1. `deriveCheckpoints` walks its corpus through **two different fence projections** while its own
   comment claims one. A `checkpoint:` tag written inside an HTML comment — invisible to every
   reader of the rendered document — is collected as a live roster declaration. Reproduced.
2. `assertBulletCount`, the "two independent traversals, one equality" safety net that is supposed
   to catch a silently short walk, is a **tautology**: both passes share the fence flags, the
   section range and the bullet predicate, so they cannot disagree for any input.
3. The PreToolUse guard's trusted computing base is **13 modules wide**, including the entire
   documentation-lint stack, because `checkpoints.ts` imports a corpus derivation the module itself
   says never runs at load. Appending one comment to `scripts/voice-model.js` — a voice linter with
   no relationship whatsoever to prod-deploy — makes **every Bash tool call in the session deny**.
   Reproduced end-to-end.

The warnings cluster around three recurring shapes: **bounds that are stated but not implemented**
(a dead `depth > 3`, a cited 466 ms worst case that is 14.4 s for a segment-heavy command),
**vacuity floors that stop one case short** (`scanned === 0` in the residual-citation scan, a
`catch` arm scoped to the wrong condition in the anchor gate), and **comments that describe a
mechanism the tree does not carry** (an exported `normalizeManifestRegion` that nothing calls while
the freeze test re-implements it inline; a "no other `${input.`" claim over a body with six).

One test-hygiene defect makes the full-suite run non-deterministic and is reported here because it
was widened by this phase.

## Critical Issues

### CR-01: `deriveCheckpoints` uses two fence projections — a checkpoint declared inside an HTML comment is collected as live

**File:** `scripts/checkpoints.ts:1363`, `scripts/checkpoints.ts:1466-1513`

**Issue:** The derivation asks three different questions of two different fence authorities:

- section location and near-miss refusal go through `locateSection` / `unfencedHeadingIndices` /
  `unfencedHeadingNearMisses`, all of which use **`blockContextFlags`** (the strict projection —
  it also flags HTML comment and HTML tag blocks);
- pass A (`scripts/checkpoints.ts:1472`) and pass B (`scripts/checkpoints.ts:1513`, via
  `unfencedMatchIndices`) use **`fencedLineFlags`** (the lax projection — code fences only).

The docstring at line 1363 states *"Fenced lines are invisible on both arms, through the one fence
authority."* That is false for HTML blocks. Reproduced against the committed `.js`:

```
$ cat $T/agent-factory/workflows/01-a.md
## Stop conditions

- real bullet one. `checkpoint: exceed_wip_limit`
<!--
- commented-out example bullet. `checkpoint: sign_off_acceptance`
-->

$ node -e 'cp.deriveCheckpoints(root)'
ids: [ 'exceed_wip_limit', 'sign_off_acceptance' ]
examined: 2 counted: 2 sections: 1
```

`blockContextFlags` reports lines 5–7 as `true`; `fencedLineFlags` reports them as `false`. The
commented-out bullet is therefore examined, matched against `CHECKPOINT_TAG_RE`, and enters the
roster as a declared human stop that no reader of the document can see. The mirror-image cost is
just as bad in practice: an author who comments out a tagged bullet gets a **hard
`CheckpointDerivationError`** from the `CHECKPOINT_KEYWORD_RE` arm, because a commented line
mentioning the keyword is refused as non-canonical rather than skipped.

This is the P29 "one authority per predicate" lesson, and this module is downstream of it.

**Fix:** Ask one authority. The section extent already uses the strict projection, so the two
bullet passes must too:

```ts
// scripts/checkpoints.ts, pass A
const flags = blockContextFlags(text);   // was: fencedLineFlags(text)

// pass B — unfencedMatchIndices hardcodes fencedLineFlags; give it the projection explicitly
countedBullets += blockUnfencedMatchIndices(text, STOP_BULLET_RE).filter(inSection).length;
```

If `unfencedMatchIndices` must keep the lax projection for its other callers, add a second
adapter in `scripts/frontmatter.ts` that takes the flags array, and have both passes and
`locateSection` read the same one. Then delete the "one fence authority" sentence or make it true.

---

### CR-02: `assertBulletCount` is a tautology — the "independent denominator" cannot ever disagree

**File:** `scripts/checkpoints.ts:1516` (assertion), `scripts/checkpoints.ts:1479-1513` (the two passes)

**Issue:** The design contract is stated in `assertBulletCount`'s own message: *"The two numbers
come from different traversals precisely so a silently SHORT walk disagrees with the count instead
of reporting a clean run over the bullets it never reached."* They do not come from different
traversals in any axis that can go wrong.

- Pass A: `for (let i = range.from; i < range.to; i++) { if (flags[i]) continue; if (STOP_BULLET_RE.test(lines[i])) examinedBullets += 1; }`
- Pass B: `unfencedMatchIndices(text, STOP_BULLET_RE).filter(i => i >= range.from && i < range.to).length`

Both use **the same `fencedLineFlags` projection**, **the same `range`** from the same
`locateSection` call, and **the same `STOP_BULLET_RE`**. Their outputs are the same set by
construction. `sectionEndIndex` is bounded by `lines.length`, so `range.to` can never exceed the
array and the one remaining divergence (`lines[i] === undefined`) is unreachable.

Consequence: every fault class the assertion is advertised to catch — a fence-state divergence, a
skipped line, a short walk, and specifically CR-01's HTML-block divergence — passes it green. The
project's own rule is *"derive the ELEMENT count independently of the loop that consumes it"*; this
derives it from the same three inputs.

**Fix:** Make pass B independent on at least one axis the fault can travel on. The cheapest honest
version re-reads the file and re-locates the section:

```ts
// PASS B — a second traversal that shares nothing but the file bytes and the heading string.
const bText = readFileSync(join(root, WORKFLOWS_SUBPATH, file), "utf8");
const bRange = locateSection(bText, WORKFLOW_STOP_HEADING);
if (bRange === null) throw new CheckpointDerivationError(`${file}: pass B located no stop section`);
countedBullets += unfencedMatchIndices(bText, STOP_BULLET_RE)
  .filter((i) => i >= bRange.from && i < bRange.to).length;
```

…and, once CR-01 is fixed, keep the two passes on *different* fence projections deliberately so a
projection disagreement is exactly what the equality reports. Add a mutation test that plants a
skipped line in pass A and watches `assertBulletCount` throw — an assertion only ever reached in
the passing state is not an assertion.

---

### CR-03: the prod-deploy guard's trusted computing base is 13 modules — one comment appended to an unrelated doc linter denies every Bash tool call

**File:** `scripts/checkpoints.ts:44-59` (the imports), `hooks/hook-entry.ts:140-175` (the manifest)

**Issue:** `hooks/guard.js` runs on **every** `Bash` PreToolUse. Its emitted import closure, and
therefore the manifest `hook-entry.js` hashes before each spawn, is:

```
hooks/guard.js, scripts/audit-model.js, scripts/audit-prepass.js,
scripts/check-diff-disposition.js, scripts/checkpoints.js, scripts/context-io.js,
scripts/dead-vocabulary.js, scripts/frontmatter.js, scripts/generate-safety-surface.js,
scripts/is-entry.js, scripts/kit-model.js, scripts/vacuity.js, scripts/voice-model.js
```

Only two of those are needed at guard runtime. `checkpoints.ts` imports `locateSection`
(`check-diff-disposition.js`), `listWorkflows`/`listWorkflowDirEntries` (`kit-model.js`) and four
fence/heading helpers (`frontmatter.js`) **solely for `deriveCheckpoints`** — the function whose
own header says *"WHY NOTHING BELOW RUNS AT MODULE LOAD. `hooks/guard.js` imports this module on
EVERY PreToolUse invocation."* The derivation does not run, but its whole transitive graph is
loaded, hashed, and made a hard dependency of the guard answering at all.

Reproduced against the committed artifacts:

```
$ cp -R hooks scripts $T && printf '\n// harmless comment\n' >> $T/scripts/voice-model.js
$ cd $T && node hooks/hook-entry.js guard.js <<< '{"tool_name":"Bash","tool_input":{"command":"ls -la"},"session_id":"s"}'
{"hookSpecificOutput":{...,"permissionDecision":"deny","permissionDecisionReason":
 "Blocked (fail-closed): the grugops hook module \"scripts/voice-model.js\" does not match the frozen manifest ..."}}
```

`ls -la` is denied because a *voice linter* changed. The direction is fail-closed, so this is not a
bypass — it is an availability and workflow defect, and it is precisely the pressure `hooks/guard.ts`
names in its own design rule 1: *"Over-broad patterns train users to disable the guard, which is the
opposite of safe."* In this repository's own dev loop, any `scripts/*.ts` edit + `tsc` rebuild
bricks the Bash tool until three artifacts (`hook-entry.ts` manifest, `hook-entry.js`, the D-24
freeze hash) are regenerated in lockstep.

It also inflates the hash surface an attacker can grief: writing one byte into any of eleven
unrelated lint modules is a session-wide denial of the Bash tool.

**Fix:** Split the module along the line its own header already draws. Move `deriveCheckpoints`,
`checkpointSites`, `derivedCheckpointSet`, `assertRosterMatchesDerivation`, `assertSiteCounts`,
`assertLiveCorpusCardinality` and their corpus imports into `scripts/checkpoints-derivation.ts`;
leave `checkpoints.ts` holding the roster table, the vocabulary, the canonicalizer, the resolver,
the banner and the command model. The only remaining cross-module import at guard runtime is
`SAFETY_FLOORS` from `audit-model.js` (needed by `deriveFloorCheckpoints()` at load).

```
before: hooks/guard.js -> 12 scripts modules
after:  hooks/guard.js -> scripts/checkpoints.js, scripts/audit-model.js,
                          scripts/context-io.js, scripts/is-entry.js
```

Then re-run `npm run generate:hook-manifest` and re-baseline `FROZEN_HOOK_ENTRY_LOGIC_SHA`.
`scripts/floor-invariance.test.ts` should additionally pin the closure **size** with a stated
ceiling, so a future import that re-widens the guard's TCB is a named red rather than a silent
regeneration.

## Warnings

### WR-01: `commandSegments`' nesting bound is dead code, and the comment that cites it is false

**File:** `scripts/checkpoints.ts:479`, `scripts/checkpoints.ts:803`

**Issue:** `commandSegments(cmd, depth = 0)` refuses at `depth > 3`. There are exactly two call
sites: `matchCommandCheckpoints` calls it with the default `0` (line 785) and with the literal `1`
for a nested re-tokenization (line 838). `depth` is therefore never above 1 and the branch is
unreachable. The `RA5-1` comment at line 803 then asserts *"Work here is already bounded twice:
`commandSegments` refuses beyond nesting depth 3, and the number of segments is bounded by the
input length"* — the first half of which is not a bound the code carries. Recursion in fact
terminates for a different reason (each re-tokenized word value is strictly shorter than its
parent because quoting is stripped), which nothing states.

**Fix:** Either thread the depth through and make it real —

```ts
if (nested === null) { /* … */ } else queue.push(...nested.map(s => ({ ...s, depth: depth + 1 })));
```

— or delete the parameter and replace the comment with the argument that actually holds: *"each
nested re-tokenization strips at least one quote pair, so the value fed to the next level is
strictly shorter and the recursion terminates in the length of the input."*

---

### WR-02: `matchCommandCheckpoints` is O(n²) in segment count and crosses the wrapper's own 10 s bound; the cited worst case is wrong

**File:** `scripts/checkpoints.ts:808`, `hooks/hook-entry.ts:255-268`

**Issue:** `const seg = queue.shift()` on an array is O(n), inside a `while (queue.length > 0)`
loop — quadratic in the number of segments. Measured against the committed `scripts/checkpoints.js`:

| segments | command size | `matchCommandCheckpoints` |
|---|---|---|
| 10 000 | 68 KB | 26 ms |
| 25 000 | 171 KB | 301 ms |
| 50 000 | 342 KB | 604 ms |
| 100 000 | 684 KB | 2 160 ms |
| 200 000 | 1.4 MB | **14 356 ms** |

`hooks/hook-entry.ts:268` documents its 10 s bound against *"The worst decision measured across
four rounds is 466 ms (a 2 MB command); 10 s is more than twenty times that."* That measurement
holds only for a single-segment 2 MB command. A **1.2 MB segment-heavy** command crosses the
wrapper's `DECIDER_TIMEOUT_MS`, gets SIGTERM'd, and is answered by the wrapper's fail-closed deny.

The direction is safe (over-denial), so this is not a bypass — but a legitimate large generated
script is now silently unrunnable, and the file's stated safety margin ("twenty times") is false
by a factor of ~30.

**Fix:** One line, and the timing collapses to linear:

```ts
let head = 0;
while (head < queue.length) {
  const seg = queue[head++] as CommandSegment;
  …
}
```

Then re-measure and correct the two comments (`scripts/checkpoints.ts:803-807`,
`hooks/hook-entry.ts:263-268`) with the segment-heavy shape included, since that is the shape the
bound has to survive.

---

### WR-03: `normalizeManifestRegion` is dead, and the freeze test carries a second copy of the rule it publishes

**File:** `scripts/generate-hook-manifest.ts:82`, `hooks/hook-entry.ts:137`, `scripts/floor-invariance.test.ts:826-834`

**Issue:** `normalizeManifestRegion` is exported and called by nothing — not by
`generate-hook-manifest`'s own entry, not by `hook-manifest-freshness`, not by any test. The one
consumer that needs it, the D-24 freeze in `floor-invariance.test.ts`, re-implements it inline:

```ts
const a = src.indexOf(MANIFEST_OPEN);
const b = src.indexOf(MANIFEST_CLOSE);
const normalised = src.slice(0, a) + "<MANIFEST REGION>" + src.slice(b + MANIFEST_CLOSE.length);
```

That is two spellings of one rule — the shape this tree deletes everywhere else — and they already
differ: the exported function returns `src` unchanged when a marker is missing, while the test
asserts the markers exist. `hooks/hook-entry.ts:137` states *"THE FREEZE IS TAKEN OVER THE FILE
WITH THIS REGION NORMALISED OUT"*, describing an authority the shipped tree does not route through.

**Fix:** Have the freeze test import and call the published function, and keep the marker-presence
assertions beside it:

```ts
import { normalizeManifestRegion, MANIFEST_OPEN, MANIFEST_CLOSE } from "./generate-hook-manifest.js";
expect(src.indexOf(MANIFEST_OPEN)).toBeGreaterThan(-1);
expect(src.indexOf(MANIFEST_CLOSE)).toBeGreaterThan(src.indexOf(MANIFEST_OPEN));
const normalised = normalizeManifestRegion(src);
expect(normalised.length).toBeLessThan(src.length - 100);
```

and make `normalizeManifestRegion` throw rather than return `src` when a marker is absent, so
"could not normalise" and "normalised to itself" stay different events.

---

### WR-04: the residual-citation gate's vacuity floor stops one case short — a zero-row scan passes

**File:** `scripts/check-residual-citations.ts:113`

**Issue:**

```ts
if (scanned > 0 && cited === 0) { refusals.push("…a scan that has stopped asking…"); }
```

The floor covers "rows found, no paths found" and leaves "**no rows found at all**" as a clean
pass. It is reachable without malice: `HISTORICAL_RESIDUAL_ROWS` is a hand-maintained literal
(`scripts/generate-guarantees.ts:466`, currently `8`) and the register today publishes exactly two
rows above it. Bumping that literal past the table size, renumbering the table, or changing the
row format so `/^\d+$/` stops matching the first cell all yield
`scanned = 0, cited = 0` → `ALL CHECKS PASSED`, printed as
`0 path claim(s) across 0 published row(s)`.

**Fix:** Floor the row count too, against a source that is not the loop:

```ts
if (scanned === 0) {
  refusals.push(
    `the residual path scan examined NO published row above HISTORICAL_RESIDUAL_ROWS ` +
      `(${HISTORICAL_RESIDUAL_ROWS}) in ${RESIDUAL_PATH} — a register whose additions table this ` +
      `scan cannot see is a gate that has stopped asking, not a register with nothing in it`,
  );
}
```

Better still, take the expected row set from `declaredResidualRows(root)` (already exported from
`generate-guarantees.ts`) and assert set equality with the rows this scan reached, so a parse that
drifts is reported by membership rather than by a floor.

---

### WR-05: `check-claim-anchors`' catch arm is scoped to the wrong condition — a join failure silently skips the lowered-floor check

**File:** `scripts/check-claim-anchors.ts:176-190`

**Issue:**

```ts
try {
  const joined = guaranteesJoin(ROOT);
  joinById = new Map(…);
  for (const refusal of dropConsistencyRefusals(joined)) fail(…);
} catch (e) {
  if (claims.some((c) => c.status === "dropped")) { fail(…); }
}
```

`dropConsistencyRefusals` reports **both** directions, and the second one — *"A row resting on a
LOWERED floor that is not marked `dropped` … is the failure this whole phase exists to close"* —
has nothing to do with whether any row is currently `dropped`. When the join throws on a tree with
zero dropped rows, the gate reports nothing and exits clean, including for a lowered floor with an
overstated claim still standing.

**Fix:** Split the two concerns. Report the join failure unconditionally as a check-not-performed
finding (the AP-1 posture this repository already applies elsewhere), and keep the dropped-row
guard only for the *comparison* half:

```ts
} catch (e) {
  fail(
    `the guarantees join could not be built, so the registry's dropped rows and the live ` +
      `checkpoint matrix were NOT compared — ${(e as Error).message}`,
  );
  if (claims.some((c) => c.status === "dropped")) {
    fail(`…and no dropped row's generated disclosure could be compared either`);
  }
}
```

---

### WR-06: the zero-width character class is written with literal invisible code points

**File:** `scripts/frontmatter.ts:985`

**Issue:** `const ZERO_WIDTH = /[<6 literal invisible code points>]/g;` — the class holds `U+00AD U+200B U+200C U+200D U+2060
U+FEFF` as literal characters. A reviewer cannot see its contents; a diff cannot show a member
being removed; an editor, a copy-paste, a lint autofix or a Unicode-normalising tool can silently
delete one and the change is invisible in review. Losing a member silently *weakens*
`unfencedHeadingNearMisses` — the refusal that closes the F2 imitation-heading class — while every
gate over it stays green. That is this repository's recorded set-literal-drift class pointed at an
authority four gates inherit.

**Fix:** Escape them, and pin the cardinality:

```ts
/** Soft hyphen, ZWSP, ZWNJ, ZWJ, word joiner, BOM. Six members; asserted two-sided in frontmatter.test.ts. */
const ZERO_WIDTH_CODE_POINTS = [
  "\u00AD", "\u200B", "\u200C", "\u200D", "\u2060", "\uFEFF",
] as const;
const ZERO_WIDTH = new RegExp(`[${ZERO_WIDTH_CODE_POINTS.join("")}]`, "gu");
```

with `expect(ZERO_WIDTH_CODE_POINTS.length).toBe(6)` in the test file.

---

### WR-07: `guarantees-freshness.ts` spawns bare `node` and leaks its temp mirror on an unguarded copy failure

**File:** `scripts/guarantees-freshness.ts:141-146`, `scripts/guarantees-freshness.ts:187`

**Issue:** Two problems in a new file:

1. `spawnSync("node", [join(tmp, GUARANTEES_ENTRY_JS)], …)` resolves `node` through `PATH`. Windows
   is a supported host (CLAUDE.md), and under a version manager (nvm/fnm/volta) or a CI step that
   runs a pinned Node without exporting it, this either fails (`ENOENT` → `status !== 0` → the gate
   reports the generator "did not run cleanly", which is drift wearing a crash's clothes) or runs a
   *different* Node than the one executing the gate. `hooks/hook-entry.ts:269` and
   `install/install.ts:1740` both correctly use `process.execPath`.
2. The mirror-copy loop is unguarded:

```ts
for (const rel of closure) {
  const dst = join(tmp, rel);
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(join(ROOT, rel), dst);
}
```

   A throw here (unreadable source, full disk, permission) escapes with a stack trace, leaks the
   `mkdtemp` directory, and violates this file's own stated rule two lines above — *"an unwritable
   temp directory is a condition this gate must REPORT rather than die on with a stack trace: a
   crashed gate and a refused gate look the same from the outside."*

**Fix:**

```ts
const r = spawnSync(process.execPath, [join(tmp, GUARANTEES_ENTRY_JS)], { encoding: "utf8" });
```

and wrap the copy loop:

```ts
try {
  for (const rel of closure) { mkdirSync(dirname(join(tmp, rel)), { recursive: true }); cpSync(join(ROOT, rel), join(tmp, rel)); }
} catch (e) {
  cleanupAndRefuse(`the generator's import closure could not be mirrored (${(e as Error).message}).`);
}
```

---

### WR-08: the full suite is non-deterministic — a freshness test plants files in the real kit while other suites read it

**File:** `scripts/catalog-freshness.test.ts:52-78` (root cause), surfaced by `scripts/kit-model.test.ts:267`, `scripts/kit-model.test.ts:438`

**Issue:** `npx vitest run --exclude '**/scripts/e2e/**'` produced **3 failures across 2 files**
beyond the known pre-existing `frontmatter` D-49 control. Re-running
`kit-model.test.ts checkpoints.test.ts` in isolation: **all pass**. The cause is cross-file
interference — `catalog-freshness.test.ts` writes into the *real* tree while vitest runs test files
in parallel workers:

```ts
writeFileSync(CATALOG, Buffer.concat([original, Buffer.from("\n<!-- drift -->\n")]));      // Test 2
const badRole = join(ROOT, "agent-factory", "roles", "zzz-catalog-freshness-badrole.md");   // Test 3
writeFileSync(badRole, "---\nkind: role\ntier: core\n---\n\nNo H1 here.\n");
```

Observed failures:
```
kit-model.test.ts:267  expected 18 to be 17               (ROLE_COUNT, +zzz-catalog-freshness-badrole.md)
kit-model.test.ts:438  kit-model: …/roles/zzz-catalog-freshness-badrole.md carries no non-empty `# Role: ` heading
```

Phase 30 **widened the blast radius** of this pre-existing defect rather than causing it:
`deriveCheckpoints`' new `listWorkflowDirEntries` refusal and `check-diff-disposition.ts`'s new
`listRoleDirEntries` refusal both read the raw directory and refuse any unadmitted entry, so the
planted file is now a hard refusal in two more places. A green/red verdict that depends on worker
scheduling is not evidence.

**Fix:** Move the plant into the temp mirror, as `adapters-freshness.test.ts:186` already does
(`join(m, "agent-factory/roles", "zzz-adapters-freshness-badrole.md")`). If the gate genuinely must
be exercised against the real tree, mark the file `describe.sequential` **and** give it
`{ threads: false }` / a dedicated vitest project so it cannot overlap any suite that reads
`agent-factory/`.

---

### WR-09: an orphaned docstring in `kit-model.ts` documents an extension test the function no longer has

**File:** `scripts/kit-model.ts:734-757`, `scripts/kit-model.ts:846`

**Issue:** The 24-line block at line 734 documents `listWorkflowDirEntries` — *"EVERY markdown entry
in the workflows directory … THE EXTENSION TEST IS CASE-INSENSITIVE HERE AND EXACT IN THE LISTER,
DELIBERATELY … a `.MD` entry must be visible TO IT"* — but it is immediately followed by a second
docstring and the `ROLE_DIR_EXEMPT` declaration, so it documents nothing. The function it describes
lives 110 lines further down at line 846 with no docstring, and it has **no extension test at all**
(the R5-3 inversion replaced it with "admit every entry, minus named exemptions"). A reader takes
the block as describing `ROLE_DIR_EXEMPT`, and the mechanism it claims does not exist.

**Fix:** Delete the stale block and give `listWorkflowDirEntries` a two-line docstring describing
what it does now:

```ts
/**
 * EVERY entry in the workflows directory except the named exemptions — the raw membership question.
 * No extension test: the corpus rule is inverted (R5-3), so the CONSUMER refuses what `listWorkflows`
 * does not admit and there is no extension question left to get wrong.
 */
export function listWorkflowDirEntries(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
```

---

### WR-10: `emitCheckpointNote`'s two adjacent comments both overstate what the code and the test do

**File:** `scripts/context-io.ts:1239`, `scripts/context-io.ts:1342-1348`

**Issue:** Two claims that a reader would rely on and that measurement contradicts:

1. Line 1239: *"`scripts/context-io.test.ts` asserts that this function's source contains no other
   `${input.` interpolation site."* The body composes six of them (`input.outcome`,
   `input.checkpoint`, `input.declared`, `input.effective`, `input.envVarName`,
   `input.actionApproval`). The actual test (`context-io.test.ts:3945`) permits a bare
   interpolation as long as the field is in `VOCAB_GUARDED` or in the one-loop field list — a
   weaker and more nuanced property than the comment states.
2. Line 1342: *"THE THREE UNTRUSTED VALUES ARE QUOTED, NOT INTERPOLATED RAW."* Immediately below,
   `input.envVarName` (line 1350) and `input.actionApproval` (line 1359) are interpolated **raw**
   into the body. They are safe — the `RA6-4` loop type-checks and `assertSingleLine`s them — but
   the sentence a maintainer reads before adding a seventh field says the opposite of the rule the
   code applies.

**Fix:** Restate both comments as the properties the code actually establishes:

```
Every value the body interpolates is either (a) constrained to a closed vocabulary by the
refuse-before-compose block, or (b) run through the one-loop type + single-line guard, or (c)
passed through bodyValue(). `context-io.test.ts` derives the set of `${input.` sites in the body
and asserts each one falls into one of those three, so a field added later is covered by the rule
rather than by a memory.
```

---

### WR-11: `install.ts` reads a user/agent-writable config with `existsSync` + `readFileSync` — the blocking-read class `context-io` was hardened against

**File:** `install/install.ts:2794-2802`

**Issue:**

```ts
const cfgPath = join(TARGET, ".grugops", "factory.config.json");
if (!existsSync(cfgPath)) return;
parsed = JSON.parse(readFileSync(cfgPath, "utf8"));
```

This is exactly the pair that `scripts/context-io.ts:2021` (`readGovernanceConfigCandidate`)
replaced this phase, for the reason its own header records: *"`readFileSync` on a path that is not
a regular file BLOCKS … with a FIFO at `<project>/.grugops/factory.config.json` … no exit, zero
bytes of stdout and zero bytes of stderr at 20 seconds."* A FIFO or a symlink to `/dev/zero` at
that position hangs the installer indefinitely, after it has already written adapters and state
seed but before it writes the install marker (`writeMarker()` at step 8) — so the target is left
half-installed with no marker, and the run's own closing conditional claim never prints. It is also
a TOCTOU pair on a path the installer does not own.

**Fix:** Reuse the hardened reader rather than a fourth spelling:

```ts
import { readGovernanceConfigCandidate } from "../scripts/context-io.js"; // export it
…
let text: string | null;
try { text = readGovernanceConfigCandidate(cfgPath); }
catch (e) { report("skipped", `retired-key check (${cfgPath} could not be read: ${(e as Error).message} — the check was NOT performed)`); return; }
if (text === null) return;
```

If the installer must stay import-free of `scripts/`, at minimum add the `O_NONBLOCK` + `fstat`
`isFile()` guard inline and drop the `existsSync` race.

---

## Info

### IN-01: dead exports

**Files:** `scripts/js-import-closure.ts:135` (`copyImportClosure`), `scripts/checkpoints.ts:1543` (`checkpointSites`), `scripts/generate-hook-manifest.ts:82` (`normalizeManifestRegion`, see WR-03)

**Issue:** Three exported functions have no caller anywhere in `scripts/`, `hooks/`, `install/`, or
the test suite. `closureTargets` and `sortedIds` are test-only. `noUnusedLocals` does not catch
unused *exports*, so nothing flags them.

**Fix:** Delete `copyImportClosure` and `checkpointSites`; wire `normalizeManifestRegion` into the
freeze test (WR-03). If any is deliberately part of a published API for future consumers, say so in
a one-line docstring so the next reader does not have to prove it dead again.

---

### IN-02: unreachable "totality" assertion in `matrixDepartures`

**File:** `scripts/generate-guarantees.ts:678-688`

**Issue:** The loop assigns every roster entry to exactly one of three buckets (`if / else if /
else`), so `atDefault + lowered.length + tightened.length` always equals `entries.length` and the
refusal is unreachable by construction. The docstring presents it as the bound on a real new degree
of freedom.

**Fix:** Keep it (an unreachable invariant assertion is cheap insurance against a later refactor
adding a fourth arm), but say so plainly, as the file does two paragraphs down for the middle
`standing` arm: *"a contract guard with no live path — said plainly rather than implied to be
reachable."*

---

### IN-03: `matchCommandCheckpoints` carries two unreachable normalizations

**File:** `scripts/checkpoints.ts:416`, `scripts/checkpoints.ts:622`

**Issue:** Two small residues:

- `const value = kind === "canonical" ? joined : joined;` — both arms are identical. A leftover
  from an earlier version where the opaque arm kept raw text; harmless, but it reads as a
  meaningful distinction and is not one.
- `normalizeToolWord`'s `word.replace(/^\\+/, "")` (the `\kubectl` alias-bypass strip) cannot fire
  from `matchCommandCheckpoints`: `classifyWords` sets `sawBackslash` on any `\`, which makes the
  word `opaque`, and the tool loop skips non-canonical words. The path is reached only from tests.

**Fix:** Replace line 416 with `const value = joined;`. For `normalizeToolWord`, either note in its
docstring that the leading-backslash arm exists for direct callers and is unreachable through the
word classifier, or drop it and rely on the opaque/fail-closed path that already covers it.

---

### IN-04: `admission-server.dispatch` answers JSON-RPC notifications

**File:** `scripts/admission-server.ts:230-256`

**Issue:** `isNotification` (`id === undefined`) is computed and honoured for `ping` and the
`default` arm, but `initialize`, `tools/list` and `tools/call` all reply with `id ?? null`
regardless. A notification-shaped `tools/call` therefore gets a response with `"id": null`, which
is a protocol violation and could confuse a strict MCP client.

**Fix:** Hoist the check:

```ts
if (isNotification && method !== "notifications/initialized") return null;
```

or return `null` from each arm when `isNotification` is true, and keep `id ?? null` only for the
parse-error path where JSON-RPC prescribes it.

---

_Reviewed: 2026-09-06T16:10:38Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
