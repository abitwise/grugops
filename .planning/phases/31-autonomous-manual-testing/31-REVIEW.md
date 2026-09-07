---
phase: 31-autonomous-manual-testing
reviewed: 2026-09-07T16:32:31Z
depth: standard
files_reviewed: 40
files_reviewed_list:
  - agent-factory/checklists/00-index.md
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/contracts/context-note.md
  - agent-factory/workflows/05-pr-quality-gate.md
  - agent-factory/workflows/06-uat-pack.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - install/install.js
  - install/install.test.ts
  - install/install.ts
  - install/README.md
  - install/uninstall.js
  - install/uninstall.ts
  - scripts/admission-server.test.ts
  - scripts/check-banned-claims.js
  - scripts/check-banned-claims.ts
  - scripts/check-foundation-guards.js
  - scripts/check-foundation-guards.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-imperative-lexicon.js
  - scripts/check-imperative-lexicon.test.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/chrome-lane-bar.test.ts
  - scripts/compactor.test.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/floor-invariance.test.ts
  - scripts/runnable-ref/fixtures/caught-assertion.uat.spec.ts
  - scripts/runnable-ref/fixtures/clean.uat.spec.ts
  - scripts/runnable-ref/fixtures/conditional-assertion.uat.spec.ts
  - scripts/runnable-ref/fixtures/modifier-call.uat.spec.ts
  - scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts
  - scripts/runnable-ref/uat-spec-integrity.js
  - scripts/runnable-ref/uat-spec-integrity.test.ts
  - scripts/runnable-ref/uat-spec-integrity.ts
  - tsconfig.json
  - tsconfig.tests.json
  - vitest.config.ts
findings:
  critical: 4
  warning: 9
  info: 3
  total: 16
status: issues_found
---

# Phase 31: Code Review Report

**Reviewed:** 2026-09-07T16:32:31Z
**Depth:** standard
**Files Reviewed:** 40
**Status:** issues_found

## Summary

Phase 31 adds three safety surfaces: the SHA-bound evidence spine in `scripts/context-io.ts`
(`validate()` provenance rule, `emitVerdict`'s required SHA argument, `admit()`'s D-03 refusal), the
AST-based UAT spec-integrity runnable in `scripts/runnable-ref/uat-spec-integrity.ts`, and
`guard_playwright_mcp_pin` in `scripts/check-foundation-guards.ts` — plus the workflow/recipe prose
that describes them and a one-line installer/uninstaller change that materializes the new runnable.

Baseline health is good: `npm run freshness` reports 60 committed `.js` fresh, `npm run typecheck`
is clean, and the two new suites (`uat-spec-integrity.test.ts`, `chrome-lane-bar.test.ts`) are
47/47 green. The installer/uninstaller change is correct — additive, never-overwrite on install,
byte-identity-gated on removal, `tools/` deliberately left in place. No finding there.

The defects below were all found by asking **how each gate is reached**, not what it refuses, and
**every Critical finding was reproduced on this tree**, not inferred:

- The spec-integrity checker's `describe.skip` / `describe.only` ban targets a binding
  `@playwright/test` does not export; the real Playwright spelling `test.describe.only(...)` walks
  straight past it (measured: exit 0, "0 findings").
- The same walk misses `test["skip"](...)` — the identical construct in element-access form.
- The D-03 stale-SHA refusal lives only in `admit()`, and `appendNote()` — the writer two shipped
  workflows name **by name** as the sanctioned path — persists an unbindable `artifact-ref` without
  ever consulting it (measured: the note was written; `admit()` on the identical bytes refused).
- `guard_playwright_mcp_pin` reads its pin from the recipe's first mention, so if that mention is
  itself `@latest` the guard passes a fully-floating kit green — while its own source comment
  asserts that a floating specifier is a finding.

Three of the four Criticals are undisclosed. The fourth (`appendNote`) *is* disclosed in
`31-01-SUMMARY.md` §Residual 1, but the disclosure states "Neither is a silent pass — both fail
closed", and measurement contradicts that: the write succeeded and returned an id. A residual whose
stated disposition is wrong is not a disclosed residual.

## Critical Issues

### CR-01: The `describe.skip` / `describe.only` ban targets a binding Playwright does not have; `test.describe.only` evades it

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:72-80` (the set), `:488` (the match),
`scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts:12,14`,
`agent-factory/checklists/browser-uat-recipe.md:165`

**Issue:** Arm (c) only matches when the callee is `PropertyAccess(Identifier, name)` — i.e. a
**bare** `describe.only(...)`. `@playwright/test` exports no top-level `describe`; the only spelling
Playwright supports is `test.describe.only(...)`, whose callee is
`PropertyAccess(PropertyAccess(test, describe), only)` and is therefore never tested against
`BANNED_CONSTRUCTS`. The two `describe.*` entries in the locked set are dead in every real
Playwright spec, and the construct that *does* occur is unguarded.

`test.describe.only` is not an exotic form — it narrows the **entire gate run** to one describe
block, which is precisely the "a green lane would certify a scenario nobody exercised" outcome the
finding text names. `test.describe.skip` and `test.describe.fixme` are equally unguarded.

The union fixture that is supposed to prove arm (c) writes
`import { test, expect, describe } from "@playwright/test";` — an import that does not resolve. It
is invisible because `tsconfig.json` and `tsconfig.tests.json` both exclude
`scripts/runnable-ref/fixtures/**`, so no typecheck ever reads the corpus. The exclusion (correct
on its own terms) is what hid an incorrect fixture.

`browser-uat-recipe.md` quotes the set verbatim and asserts "the claim here matches the mechanism
there". The set matches the code; neither matches Playwright.

**Reproduced on this tree** (`node scripts/runnable-ref/uat-spec-integrity.js <root>` over a repo
containing only `uat/probe.uat.spec.ts`):

```ts
test.describe.only("billing", () => {
  test("a", async ({ page }) => { await expect(page.getByTestId("x")).toBeVisible(); });
});
test.describe.skip("more", () => {
  test("b", async ({ page }) => { await expect(page.getByTestId("y")).toBeVisible(); });
});
```
```
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
```

**Fix:** Match the object side as a **dotted callee path** rather than a single identifier, and
express the set in the spelling Playwright actually uses. Per the file's own rule, widening the set
is a new decision — so record it, do not edit quietly:

```ts
// resolve the full dotted head of the callee, e.g. ["test","describe","only"]
function calleePath(ts: TsApi, callee: TsNode): string[] | null {
  const parts: string[] = [];
  let cur: TsNode = callee;
  while (ts.isPropertyAccessExpression(cur)) {
    parts.unshift(cur.name.text);
    cur = cur.expression;
  }
  if (!ts.isIdentifier(cur)) return null;
  parts.unshift(cur.text);
  return parts;
}

export const BANNED_CONSTRUCTS = Object.freeze([
  Object.freeze({ path: ["test", "skip"] }),
  Object.freeze({ path: ["test", "fixme"] }),
  Object.freeze({ path: ["test", "only"] }),
  Object.freeze({ path: ["test", "describe", "skip"] }),
  Object.freeze({ path: ["test", "describe", "only"] }),
  Object.freeze({ path: ["test", "describe", "fixme"] }),
  Object.freeze({ path: ["expect", "soft"] }),
]);
```

Then fix `union-all-arms.uat.spec.ts` to import only `{ test, expect }` and use
`test.describe.only(...)`, and re-quote the set in `browser-uat-recipe.md`. Also add a corpus case
that would have caught this: a fixture written in **idiomatic Playwright**, checked by a test that
asserts the fixture's imports resolve against the documented API.

---

### CR-02: `test["skip"](...)` — the same banned construct in element-access form — is not seen at all

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:487-503`

**Issue:** Arm (c) is guarded by `ts.isPropertyAccessExpression(callee)`. An
`ElementAccessExpression` (`test["skip"]`, `test["only"]`, `expect["soft"]`) is a different node
kind and never reaches the comparison. This is not an alias or an indirection — it is the identical
construct written with brackets, which TypeScript resolves to the identical Playwright API. It is
one line of AST to close and does not require "widening the matcher once per counter-example".

**Reproduced on this tree** — the same probe run as CR-01 also contained:

```ts
test["skip"]("bracketed skip", async ({ page }) => {
  await expect(page.getByTestId("z")).toBeVisible();
});
```
and produced `0 findings over 1/1 uat specs checked`, `EXIT=0`.

**Fix:** Add `isElementAccessExpression` + `isStringLiteral` to the hand-declared `TsApi` surface
and resolve a **string-literal** element access into the same dotted path CR-01's fix builds. A
non-literal computed access (`test[k]`) must not be resolved — it should either be ignored (and
disclosed) or reported, but never silently treated as a property access.

---

### CR-03: `appendNote()` — the writer two workflows name as the sanctioned path — bypasses the D-03 evidence binding entirely

**File:** `scripts/context-io.ts:1020-1073` (`appendNote`), `:1618-1680` (the D-03 branch inside
`admit()`), `agent-factory/workflows/17-task-claim.md:40`,
`agent-factory/workflows/18-context-compaction.md:51`

**Issue:** The D-03 stale-SHA / missing-verdict / ambiguous-verdict refusal is implemented **only**
inside `admit()`. `appendNote()` — exported, and described in its own header as "the SOLE sanctioned
writer" — runs `assertSingleLine` + `assertHexScalar` + `validate()` and then writes. `validate()`
checks only that the three provenance fields are present, non-empty and hex-shaped; it performs no
verdict lookup and no SHA comparison.

`admitAndAppend()` does reach the refusal (verified below), but it is not the path the kit
documents for every host. `workflows/17-task-claim.md` step 4 instructs a role to "Record results
into the shared verified context ONLY via WF16 (`context-io.ts` `appendNote`)", and
`workflows/18-context-compaction.md` steps 4 and the done-state both name `appendNote` explicitly.
`workflows/16-context-read-write.md` routes through `admitAndAppend` only via
`mcp__grugops__propose_note`, which is the Claude-Code-only MCP channel — so on the other four host
CLIs the documented instruction lands on the bypassing function.

**Reproduced on this tree:**

```
appendNote WROTE: 20260907T163005Z-qe-e2e-artifact-ref-f4a7169a
  kind: artifact-ref
  sha: deadbeefdeadbeefdeadbeefdeadbeefdeadbeef
  gate_run: no-such-gate-run-ever-existed
  content_hash: 0000...0000

admit() on the SAME bytes:
  ["admission FAIL: no live green §14-gate verdict found for
    \"§14-gate#no-such-gate-run-ever-existed\" ..."]
```

The note is then picked up by `render()`'s new **"Evidence provenance"** section and displayed as
evidence in `index.md`.

`31-01-SUMMARY.md` §Residual 1 discloses this route, but states "Neither is a silent pass — both
fail closed." The measurement above contradicts that: nothing failed closed; a note asserting a
gate run that never existed was written and returned an id. That is why this is filed as Critical
rather than accepted as disclosed.

The disclosure's stated reason ("adding a second check inside `appendNote` would be the
two-authorities drift D-03 forbids") is a false dichotomy — having `appendNote` *call* `admit()`, or
refuse `kind: artifact-ref` unless the caller passes a proof-of-admission token, keeps exactly one
implementation of the predicate.

**Fix:** Pick one of these; do not add a second SHA comparison.

```ts
// Option A — one authority, called from the writer for the kind that needs it.
export function appendNote(task, note, body, contextRoot = DEFAULT_CONTEXT_ROOT, precomputedId?) {
  ...
  const text = composeNote(note, body, id);
  const findings =
    note.kind === "artifact-ref"
      ? admit(task, text, contextRoot)   // validate() runs inside admit(); no duplicate rule
      : validate(text);
  if (findings.length > 0) throw new Error(`context-io.appendNote: refusing to write:\n${findings.join("\n")}`);
  ...
}
```

Option B: keep `appendNote` unaware, but make it **refuse `kind: artifact-ref` outright** unless
called with an internal `admittedBy` token that only `admit`-bearing paths mint — the artifact-ref
then has exactly one reachable writer. Either way, update `workflows/17` and `workflows/18` to name
that path, and add a contract test in `scripts/context-io.test.ts` asserting that a stale-SHA
artifact-ref is refused **through every exported write entry point**, derived from the module's
exports rather than a typed list.

---

### CR-04: `guard_playwright_mcp_pin` cannot detect a floating specifier when the authority itself floats — and its source claims it can

**File:** `scripts/check-foundation-guards.ts:3755-3765` (the comment), `:3838-3855` (the authority
read), `scripts/check-foundation-guards.test.ts:11802-11815` (the `pin-floating` case)

**Issue:** The guard reads the pin from `authority[0].version` — the **first** `@playwright/mcp@`
mention in `browser-uat-recipe.md` — and then asserts every other mention equals it. It has no
notion of a well-formed version. If the recipe's own first mention is changed to
`@playwright/mcp@latest`, `pin` becomes `"latest"`, every re-pinned mention in the kit matches, and
the guard prints `0 findings over N/N elements` and **passes** over a fully-floating kit.

That is the failure the guard exists to prevent, and it is reachable through the exact workflow the
recipe documents ("a bump is one edit plus a re-pin"). The `PIN_OCCURRENCE_SOURCE` comment states
the opposite in the source:

> `@latest` is captured as `latest` and compared like any other version — a floating specifier is a
> FINDING rather than something the pattern quietly declines to see.

That is true only for a **non-authority** mention, which is exactly what the `pin-floating` test
plants (`agent-factory/checklists/00-index.md`). No case in the suite makes the authority float. The
same overclaim is repeated in `31-03-SUMMARY.md:233`. Under this repo's no-fabrication rule, a
safety-surface comment that asserts a property the code does not have is a blocking defect, not a
comment nit.

**Fix:** Add one shape assertion on the authority — the only new fact is a *format*, not a version,
so the "one home" property is preserved:

```ts
// The authority must name a CONCRETE version, never a dist-tag. This declares no version — it
// declares that a version is what a version looks like. `latest`, `next`, `beta` and every other
// floating specifier fail here rather than becoming the thing every mention is compared to.
const CONCRETE_VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
if (!CONCRETE_VERSION_RE.test(first.version)) {
  fail(
    `playwright MCP pin: the first pinned mention in ${PLAYWRIGHT_MCP_PIN_SOURCE} (line ${first.line}) ` +
      `is \`${first.version}\`, which is a floating specifier and not a concrete version — the pin IS ` +
      `the supply-chain control, so an authority that floats makes every comparison below vacuous`,
  );
  FAILS += 1;
  return;
}
```

Add the matching case: rewrite the mirror's recipe so its first mention is `@latest`, re-pin every
other mention to `latest` too, and assert the run is **non-zero** and prints no `0 findings over`
line. Then correct the `PIN_OCCURRENCE_SOURCE` comment and `31-03-SUMMARY.md:233`.

## Warnings

### WR-01: A `.uat.spec.ts` file one directory outside `uat/` is silently unchecked while the pass line claims a full count

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:371-376` (`hasUatSegment`), `:605-646`
(`reportMeasured`)

**Issue:** `hasUatSegment` requires an exact `uat` **directory segment**. A spec that keeps the
`.uat.spec.ts` suffix but sits in `e2e/` rather than `e2e/uat/` is dropped from the derived set with
no refusal and no finding — and because `expected` is derived from the *same* narrowed rule,
`visited === expected` and the denominator floor cannot see it. Playwright's default `testMatch`
(`**/*.spec.ts`) still runs that file, so a dirty spec keeps executing in the gate's e2e lane while
the checker reports a clean full-coverage pass.

`browser-uat-recipe.md` discloses the *suffix* half ("a renamed spec leaves both mechanisms") but
not the *segment* half. **Reproduced:** a tree with `e2e/uat/good.uat.spec.ts` (clean) and
`e2e/dirty.uat.spec.ts` (containing `test.skip` and a caught assertion) reported
`0 findings over 1/1 uat specs checked`, exit 0.

**Fix:** Report a suffix-matching file that fails the segment test as a **could-not-run reason**
(exit 2) rather than dropping it, so the narrowing is loud:

```ts
if (!hasUatSegment(rel)) {
  refusals.push(
    `The file ${rel} carries the ${UAT_SPEC_GLOB_SUFFIX} suffix but does not sit under a \`uat\` ` +
      `path segment, so it was NOT checked while the e2e lane may still run it. Move it under uat/ ` +
      `or rename it.`,
  );
  continue;
}
```
Add both sides as cases, and extend the recipe's disclosure to name the segment rule too.

---

### WR-02: A missing materialized checker exits 1, which the gate's branch table reads as "a spec-integrity finding"

**File:** `agent-factory/workflows/05-pr-quality-gate.md:33` (the new bullet),
`install/install.ts:2188-2191`

**Issue:** The bullet notes that "a host repository installed before this release picks it up on a
re-run of the installer" — but does not say what happens if it does not. `node
tools/grugops/uat-spec-integrity.js <root>` against a missing file is a Node `MODULE_NOT_FOUND`,
which exits **1**. The bullet's branch table maps `1` to "a spec-integrity finding, which the gate
flags, naming the file and the line" — so an *absent checker* is reported as a *dirty spec*, with no
file and no line to name. The genuinely correct disposition (`2` — could not run) is unreachable for
this case.

**Fix:** Have the gate test for the checker before invoking it and record `2`/`UNKNOWN - verify`
when it is absent, e.g. `test -f tools/grugops/uat-spec-integrity.js || { echo "SKIPPED: the
grugops UAT spec-integrity checker is not materialized in this repository — re-run the installer";
exit 2; }`. State that branch in the bullet.

---

### WR-03: The "no version literal" acceptance test does not scan the guard's rationale comment, despite claiming "comments included"

**File:** `scripts/check-foundation-guards.test.ts:11976-11990`

**Issue:** The region is extracted as `src.slice(src.lastIndexOf("\n// ---", start), ...)`, where
`start` is the offset of `function guardPlaywrightMcpPin(`. The nearest preceding `// ---` line is
the **closing** rule of the guard's header comment block, so the region begins at source line 3732
while the 25-line rationale block spans lines ~3707–3731 and is **excluded**. Measured on this tree.
A version literal written into that block — the most natural place for a human to write "we pin
0.0.78 because…" — passes the test that exists to forbid it.

**Fix:** Anchor the region on the header's **opening** rule instead:

```ts
const banner = src.indexOf("// guard_playwright_mcp_pin");
const regionStart = src.lastIndexOf("\n// ---", banner);
const region = src.slice(regionStart, src.indexOf("\n}", start) + 2);
// non-vacuity: the region must contain the rationale sentence, not only the function
expect(region).toContain("supply-chain control");
```

---

### WR-04: The pin guard's directory walk has no error handling while its read path does

**File:** `scripts/check-foundation-guards.ts:3800-3820` (`pinScanMarkdownFiles`), `:3868`
(the call site)

**Issue:** `pinOccurrencesIn` is wrapped in `try/catch` at both call sites and produces a named
`fail()`. `pinScanMarkdownFiles()`'s `readdirSync(abs(rel), { withFileTypes: true })` is not, and
the call site destructures its result without a guard. An `EACCES` or `ENOTDIR` on any directory
under `agent-factory/`, `docs/` or `install/` throws out of the whole foundation-guards aggregator
as an unhandled exception, aborting every guard queued after it rather than producing the named
FAIL the guard's own doc-comment promises ("it fails closed on its own authority").

**Fix:** Wrap the walk the way the read is wrapped, and record the unlistable directory as a
missing root so it lands on the pass line:

```ts
const walk = (rel: string): void => {
  let entries: Dirent[];
  try { entries = readdirSync(abs(rel), { withFileTypes: true }); }
  catch { missingRoots.push(`${rel} (unlistable)`); return; }
  for (const entry of entries) { ... }
};
```

---

### WR-05: The pin guard's denominator floor is structurally unreachable in the shipped code

**File:** `scripts/check-foundation-guards.ts:3871-3879`

**Issue:** The comment claims "TWO COUNTERS, TWO ORIGINS … a loop that stopped early therefore
reports a short scan rather than a clean one." But `visited += 1` is the first statement of a plain
`for` loop with no `break`, no `continue` and no throwing call inside it, so `visited === expected`
holds unconditionally. The `pin-short-scan` test acknowledges this ("the denominator floor is
unreachable by planting … the comparison loop is a straight `for` with no failure mode of its own")
and exercises the branch only through a mutated scratch build. The floor therefore guards nothing in
the shipped guard; only the vacuity floor (zero occurrences) is live.

This is not a defect on its own, but the comment overstates what the second counter buys. Compare
`analyzeSpecs` in `uat-spec-integrity.ts`, where the loop genuinely can skip an element (unreadable
file, parse diagnostics) and `visited` is a real measurement.

**Fix:** Either give the loop a real skip path that the floor can catch (e.g. count an occurrence
whose `file` could not be re-read), or soften the comment to say what is true — the denominator is a
regression tripwire against a future `visited = occurrences.length` mutant, not a live floor.

---

### WR-06: `--json` produces no stdout on any exit-2 path, so a machine consumer parsing stdout gets an empty string

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:610-626`, `:665-705`

**Issue:** The D-12 contract in the file header advertises `stdout → optional machine-readable
{ ok, findings } block when invoked with --json`. `wantJson` is honoured only in branches (3) and
(4). Branches (1) and (2), the two loud-skip emissions, the derivation refusals and the two argument
errors all write human prose to stderr and nothing at all to stdout. A caller doing
`JSON.parse(stdout)` throws on an empty string and must fall back to the exit code — which works,
but is not what the contract says.

**Fix:** Emit a JSON object on every terminal path when `wantJson` is set, e.g.
`{ ok: false, ran: false, reason: "<the same text>", findings: [] }`, and state in the header that
the `ran` field distinguishes exit 2 from exit 1.

---

### WR-07: `content_hash` is required, shaped and stored — and never recomputed or compared by any shipped code path

**File:** `scripts/context-io.ts:761-815` (`validate`), `:1618-1680` (`admit`),
`agent-factory/checklists/browser-uat-recipe.md:132-141`,
`agent-factory/contracts/context-note.md:172-178`

**Issue:** `validate()` requires `content_hash` to be present, non-empty and lowercase hex on an
`artifact-ref`. Nothing anywhere reads the spec file, computes sha256 over it, or compares the
result — not `admit()`, not `emitVerdict`, not the gate workflow, not the spec-integrity runnable.
The field's entire mechanical content is "64-ish lowercase hex characters".

The contract and the recipe are honest that the digest is not tamper-proof and not a credential —
correctly so — but both go further: "Anyone holding the repository can recompute it from the
committed bytes and compare." No shipped tool does that comparison, and the reader is not told that
the recomputation is a manual exercise with no tooling behind it. The distinction matters because
D-02's stated purpose is binding a named artifact to a named run, and the *binding* half is `sha`
alone; `content_hash` currently contributes nothing mechanical.

**Fix:** Either (a) state plainly in `context-note.md` and the recipe that **no automated check
recomputes `content_hash`** and it is a manual-audit aid, or (b) add the recomputation to the gate's
UAT step (`node tools/grugops/uat-spec-integrity.js` is the natural home — it already reads every
spec's bytes) and refuse a mismatch. Do not leave prose implying a comparison that no code performs.

---

### WR-08: Workflow 05 Step 5's human-only enumeration is one checker short, and Step 5 is the terminal-result authority

**File:** `agent-factory/workflows/05-pr-quality-gate.md:47`

**Issue:** Step 3's new bullet states the UAT spec-integrity step "is human-only on any result other
than exit `0`" and delegates to "the rule Step 4 states". Step 4's positive allow-list ("the bounded
loop runs **only** for agent-fixable failures — lint … and UI/E2E code/a11y defects") does cover it
correctly, and `31-04-SUMMARY.md` records the decision not to re-enumerate. That reasoning holds for
Step 4.

It does not hold for **Step 5**, which is the authority for the terminal result and closes with a
flat enumeration: "The human-only failures are a visual-baseline acceptance and **any test-integrity
result other than exit `0`**. This set is the rule Step 4 states, not a second enumeration beside
it." It *is* a second enumeration, it is closed, and it does not name `uat-spec-integrity` — whose
name is one hyphen away from `test-integrity`, which is the confusion most likely to be made under
load.

**Fix:** Replace Step 5's instance list with the rule it claims to restate: "Any failure outside the
agent-fixable set Step 4 names → `BLOCKED_NEEDS_FIX` with the specific reason." That removes the
enumeration rather than lengthening it, which is the disposition Step 4 already argues for.

---

### WR-09: The pin occurrence regex admits `.` as a version character, so a sentence-final mention is a false FAIL

**File:** `scripts/check-foundation-guards.ts:3763`

**Issue:** `PIN_OCCURRENCE_SOURCE` excludes whitespace, backtick, quotes, brackets, parens, comma
and angle brackets — but not `.`, `;`, `:` or `}`. A perfectly correct prose mention written as
`… uses @playwright/mcp@0.0.78.` captures the version as `0.0.78.` and is reported as drift against
`0.0.78`. Every current mention happens to sit inside backticks so nothing is red today, but the
guard will convict correct text the first time someone writes the package name in a sentence. The
direction is fail-closed, so this is a robustness defect rather than a hole.

**Fix:** Trim a trailing run of the sentence punctuation that cannot begin or end a semver, or
capture with an explicit version grammar (`[0-9A-Za-z][0-9A-Za-z.-]*[0-9A-Za-z]|[0-9A-Za-z]`) and
add a case for the sentence-final mention on both sides.

## Info

### IN-01: `PLAYWRIGHT_BROWSERS_PATH=0` falls through to the default cache directory

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:243-251`

**Issue:** `0` is Playwright's documented value for "install browsers next to the package". It fails
`isAbsolute("0")`, so the probe falls through to the per-platform cache location, which will be
absent on such a host and yields a stage-2 loud skip. Fail-closed, but a false skip on a legitimately
configured repository.

**Fix:** Treat `"0"` as its own case — resolve `node_modules/playwright-core/.local-browsers` from
the target, or return the stage with a clause that names the `0` configuration explicitly.

---

### IN-02: Provenance keys sit before `refs`/`supersedes` in the fence but after `supersedes` in the JSONL line

**File:** `scripts/context-io.ts:968-1002` (`composeNote`/`provenanceBlock`), `:1817-1836`
(`toJsonl`)

**Issue:** `toJsonl`'s comment says the fields are "APPENDED after `supersedes`, in the fence's own
order". The relative order of the three is the same, but their position is not: on disk they land
between `confidence` and `refs`; in the JSONL they land after `supersedes`. Both are internally
deterministic and byte-reproducible, so nothing breaks — but the comment reads as though the two
layouts agree, and a future reader diffing a fence against its event line will be briefly misled.

**Fix:** Reword to "appended after `supersedes` **in the event line**, which differs from their
position in the fence; only their relative order is shared."

---

### IN-03: Two effectively-dead paths in `deriveSpecPaths`

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:356-361`, `:328-347`

**Issue:** (a) `containedLexically(resolve(abs))` on a non-symlink entry can never be false —
`abs` is `join(absDir, entry.name)` and a `readdirSync` entry name cannot contain a path separator,
so the refusal branch is unreachable. It is harmless defence-in-depth, but a reader may take its
presence as evidence that regular-file escape is a live case that was tested.
(b) A symlinked **directory** is skipped with no record at all (`continue` at line 331 when the name
does not end in the suffix), so a repository that reaches its uat specs through a linked directory
silently derives zero specs — which the vacuity floor then reports as "not performed", correct but
without naming the cause.

**Fix:** Keep (a) and add a one-line comment that it is unreachable by construction and retained as a
tripwire. For (b), push a refusal naming the linked directory when it would otherwise have been
descended into, so the vacuity message has a cause beside it.

---

_Reviewed: 2026-09-07T16:32:31Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
