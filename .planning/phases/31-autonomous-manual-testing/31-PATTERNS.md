# Phase 31: Autonomous Manual Testing - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 13 new/modified files
**Analogs found:** 13 / 13 (12 exact-role, 1 partial)

All analog paths below were confirmed git-tracked with `git ls-files -- <path>`. No generated
mirror path appears in this document.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/runnable-ref/uat-spec-integrity.ts` (NEW) | utility (materialized CLI checker) | file-I/O + batch | `scripts/runnable-ref/test-skip-integrity.ts` | exact |
| `scripts/runnable-ref/uat-spec-integrity.js` (NEW, committed tsc output) | build artifact | — | `scripts/runnable-ref/test-skip-integrity.js` | exact |
| `scripts/runnable-ref/uat-spec-integrity.test.ts` (NEW) | test | request-response (spawnSync) | `scripts/runnable-ref/test-skip-integrity.test.ts` | exact |
| `scripts/context-io.ts` — `emitVerdict` + HEAD SHA (EDIT) | service (write authority) | event-driven | itself, lines 1037-1092 (`TestIntegrityResult` positional precedent) | exact (self-precedent) |
| `scripts/context-io.ts` — `composeNote` + 3 fields (EDIT) | service (composer) | transform | itself, lines 864-880 | exact (self-precedent) |
| `scripts/context-io.ts` — `admit()` SHA refusal (EDIT) | service (validator) | request-response | itself, lines 1428-1444 (verdict cross-check) | exact (self-precedent) |
| `scripts/check-foundation-guards.ts` — pin guard (EDIT) | guard | batch scan | `guardKitCounts` lines 1549-1615 | role-match (new construction; see Pitfall 4) |
| `install/install.ts` — `RUNNABLES` entry (EDIT) | config list | file-I/O | lines 2188-2191 | exact |
| `install/uninstall.ts` — `RUNNABLES_MIRROR` entry (EDIT) | config list | file-I/O | lines 664-667 | exact |
| `agent-factory/checklists/browser-uat-recipe.md` (NEW) | doc (checklist) | — | `agent-factory/checklists/playwright-visual-regression-recipe.md` | exact |
| `agent-factory/checklists/00-index.md` (EDIT) | doc index | — | its own enterprise-tier table, line 40 | exact |
| `agent-factory/workflows/05-pr-quality-gate.md` (EDIT) | workflow prose | — | its own test-integrity bullet, line 37 | exact |
| `agent-factory/contracts/context-note.md` (EDIT) | contract doc | — | its own kind table, line 137 | exact |
| `agent-factory/workflows/06-uat-pack.md` (EDIT) | workflow prose | — | workflow 05 step-bullet shape | partial |
| Chrome-lane absence test (NEW, in `scripts/context-io.test.ts` or a sibling) | test | source-scan assertion | `scripts/runnable-ref/test-skip-integrity.test.ts` host-emulation case | role-match |

## Pattern Assignments

### `scripts/runnable-ref/uat-spec-integrity.ts` (utility, file-I/O + batch)

**Analog:** `scripts/runnable-ref/test-skip-integrity.ts`

**Header + D-12 contract block** (lines 1-30) — copy this header shape verbatim, substituting the
new checker's purpose. The D-12 contract paragraph is the load-bearing part:

```typescript
// The D-12 contract (uniform across all kit-shipped runnables):
//   node <repo-local-path>/test-skip-integrity.js <registry> [--skip-count <N>] [--json] [--today <YYYY-MM-DD>]
//     exit 0 → pass / no findings
//     exit 1 → findings / fail (the quality gate blocks)
//     exit 2 → error (could not run — distinguishable from a clean "fail")
//     stdout → human-readable findings in CLEAR PROFESSIONAL VOICE (the audit trail)
//     stdout → optional machine-readable { ok, findings } block when invoked with --json
//
// VOICE DISCIPLINE (CLAUDE.md hard rule): every finding/error string this routine emits is
// CLEAR PROFESSIONAL ENGLISH — this is a quality/safety surface, never caveman voice.
```

Note the host-emulation constraint stated in the same header (lines 15-19): "with ONLY Node present
— no ~/.grugops, no npm, no node_modules. That is why this file imports node: builtins ONLY". For
Phase 31 the ONLY top-level imports permitted are `node:` builtins; `typescript` is reached through
`createRequire` at runtime (D-13), inside a try/catch that loud-skips at exit 2.

**Closed-set constant idiom** (lines 34-41) — D-14's banned-construct set and D-13's marker text are
declared exactly this way, as module-level frozen constants the recipe prose quotes:

```typescript
const VALID_CATEGORIES = new Set([
  "flaky-quarantine",
  "external-dependency",
  ...
]);
```

**Arg parsing** (lines 52-68):

```typescript
const argv = process.argv.slice(2);
const wantJson = argv.includes("--json");
const registryPath = argv.find((a) => !a.startsWith("--"));

function flagValue(name: string): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === name) return argv[i + 1];
    if (a.startsWith(`${name}=`)) return a.slice(name.length + 1);
  }
  return undefined;
}
```

**Fail-closed input error → exit 2** (lines 70-80):

```typescript
if (!registryPath) {
  process.stderr.write(
    "Error: no registry file path was provided. Usage: node test-skip-integrity.js <registry-file> [--skip-count <N>] [--json]\n",
  );
  process.exit(2);
}
```

Both Phase-31 loud skips (missing `typescript`; missing `@playwright/test` or empty browsers dir)
land on this shape — `process.stderr.write` + `process.exit(2)`, never exit 1.

**Never-a-silent-zero finding** (lines 213-217) — the exact precedent for the derived-count anomaly
report Pitfall 3 requires:

```typescript
if (skipCountRaw === undefined || !/^\d+$/.test(skipCountRaw)) {
  findings.push(
    "Skip count was not provided (UNKNOWN - verify); cannot confirm the suite is fully justified.",
  );
}
```

**Result emission tail** (lines 227-242) — copy verbatim, only the messages change:

```typescript
if (findings.length > 0) {
  if (wantJson) {
    console.log(JSON.stringify({ ok: false, findings }));
  } else {
    for (const f of findings) console.log(f); // clear professional voice, one finding per line
  }
  process.exit(1); // 1 = findings / the gate blocks
}

if (wantJson) {
  console.log(JSON.stringify({ ok: true, findings: [] }));
} else {
  console.log("No findings.");
}
process.exit(0); // 0 = pass
```

The pass line must be replaced with the count-reporting form guardKitCounts establishes
(`<N> uat specs checked`), not the bare `No findings.` — see Shared Patterns → Derived-set reporting.

---

### `scripts/runnable-ref/uat-spec-integrity.test.ts` (test, spawnSync)

**Analog:** `scripts/runnable-ref/test-skip-integrity.test.ts`

**Imports + committed-artifact runner** (lines 21-41):

```typescript
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, copyFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

// Run the COMMITTED compiled artifact, not the .ts (RESEARCH Pattern 3 / Shared Patterns).
const HERE = import.meta.dirname;
const CHECK_JS = join(HERE, "test-skip-integrity.js");

function runCheck(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync("node", [CHECK_JS, ...args], { encoding: "utf8" });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}
```

**Temp-dir hygiene** (lines 44-55) — the host-emulation cases (no `typescript`, no
`@playwright/test`) need this:

```typescript
const tmpDirs: string[] = [];
function mkTmp(): string {
  const d = mkdtempSync(join(tmpdir(), "grugops-test-integrity-"));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});
```

**Fixtures live in `scripts/runnable-ref/fixtures/`** — tracked precedent:
`clean-test-skips.md`, `hollow-test-skips.md`, `expired-test-skips.md`,
`quarantine-test-skips.md`. Phase 31 adds `*.uat.spec.ts` fixtures (one clean, one per D-14 arm)
into the same directory.

---

### `scripts/context-io.ts` — the three edits (service, event-driven)

**Analog:** the file itself. Every Phase-31 change has a self-precedent; do not introduce a new shape.

**`composeNote` fixed fence** (lines 864-880) — the three artifact-ref scalars are inserted here
CONDITIONALLY on `note.kind === "artifact-ref"`, so no existing note's bytes move (Pitfall 2):

```typescript
function composeNote(note: NoteInput, body: string, id: string): string {
  const refsBlock =
    note.refs.length === 0 ? "refs:\n" : "refs:\n" + note.refs.map((r) => `  - ${r}`).join("\n") + "\n";
  return (
    "---\n" +
    `id: ${id}\n` +
    `kind: ${note.kind}\n` +
    `by: ${note.by}\n` +
    `at: ${note.at}\n` +
    `verified_by: ${note.verified_by}\n` +
    `confidence: ${note.confidence}\n` +
    refsBlock +
    `supersedes: ${note.supersedes ?? ""}\n` +
    "---\n\n" +
    (body.endsWith("\n") ? body : body + "\n")
  );
}
```

**Field-injection guard, applied to every new interpolated scalar** (lines 907-913):

```typescript
  assertSingleLine("kind", note.kind);
  assertSingleLine("by", note.by);
  assertSingleLine("at", note.at);
  assertSingleLine("verified_by", note.verified_by);
  assertSingleLine("confidence", note.confidence);
  if (note.supersedes !== null) assertSingleLine("supersedes", note.supersedes);
  for (const r of note.refs) assertSingleLine("refs[]", r);
```

`sha`, `gate_run` and `content_hash` each get an `assertSingleLine` line here (CR-01 applies to any
value interpolated into the fence).

**`NoteInput` / `NoteRecord` type extension** (lines 71-92) — the new fields are optional on the
interface and required-when-`artifact-ref` in the validator, mirroring how `supersedes: string | null`
is typed loosely and adjudicated at validation:

```typescript
export interface NoteInput {
  kind: NoteKind;
  by: string;
  at: string; // ISO-8601 — the authoritative replay sort key
  verified_by: string;
  confidence: string;
  refs: string[]; // YAML list — req ids, file paths, ticket refs
  supersedes: string | null; // note-id this note overrides, or null
}
```

**`emitVerdict` — where the HEAD SHA argument goes** (lines 1051-1092). The SHA is a REQUIRED
POSITIONAL after `integrity`, ahead of the two defaulted parameters, following the file's own stated
precedent:

```typescript
export function emitVerdict(
  task: string,
  id: string,
  integrity: TestIntegrityResult,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  at: string = new Date().toISOString(),
): string | null {
```

and the note it composes today, which is what gains the SHA (lines 1076-1090):

```typescript
  const note: NoteInput = {
    kind: "finding",
    by: GATE_IDENTITY,
    at,
    verified_by: "", // the gate is the root of trust (D-04) — its verdict stamps nothing above it
    confidence: "high",
    refs: [verdictStampFor(id)],
    supersedes: null,
  };
  const body = `${VERDICT_GREEN_MARKER}: the §14 quality gate run ${id} passed (all checks green).`;
```

**`emitTrusted` is the only write tail** (lines 1109-1135). Nothing new writes a note file; the new
emission path ends on `emitTrusted(...)` exactly as `emitVerdict` does at line 1092:

```typescript
  return emitTrusted(GATE_IDENTITY, "emitVerdict", task, note, text, noteIdStr, contextRoot);
```

**`admit()` refusal pattern — copy this branch shape for D-03** (lines 1428-1444):

```typescript
  const vb = (scalars.verified_by ?? "").trim();
  if (scalars.kind === "finding" && GATE_STAMP_RE.test(vb)) {
    const id = vb.slice(`${GATE_IDENTITY}#`.length);
    const live = currentState(readContext(task, contextRoot));
    const matched = live.some((n) => isLiveGreenVerdict(n, id));
    if (!matched) {
      return [
        `admission FAIL: no live green §14-gate verdict found for "${verdictStampFor(id)}" under ` +
          `task "${task}". A finding stamped §14-gate#${id} is admitted only when a real green ` +
          `gate verdict with that per-run id exists in the task context (Posture B).`,
      ];
    }
  }
```

The D-03 refusal is a sibling `if (scalars.kind === "artifact-ref")` branch in the same function:
find the live verdict for `scalars.gate_run`, read its recorded SHA, compare against `scalars.sha`,
and return a findings array naming BOTH SHAs. It returns findings, never throws, and writes nothing —
that is the contract every branch in this function keeps.

---

### `install/install.ts` + `install/uninstall.ts` (config list, file-I/O)

**Analog:** the two mirrored literals. Edit BOTH in the same task; the comments say so.

`install/install.ts:2188-2191`:

```typescript
const RUNNABLES: Array<[string, string]> = [
  ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
  ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"],
];
```

`install/uninstall.ts:664-667`:

```typescript
const RUNNABLES_MIRROR: Array<[string, string]> = [
  ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
  ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"],
];
```

The installer's own comment (install.ts:2182-2187) states the rule: "An entry ADDED here without
being added there is installed and never removable". `materializeRunnable` is never-overwrite and
`RUNNABLES_MIRROR` removes only byte-identical files — no new logic is needed, only the two rows.

---

### `scripts/check-foundation-guards.ts` — the `@playwright/mcp` pin guard (guard, batch scan)

**Analog:** `guardKitCounts`, lines 1549-1615. Note Pitfall 4: the "`@playwright/test 1.62.1` pin
assertion" D-08 says to clone does not exist. This is NEW construction on the general guard idiom.

**Guard header + derived-count reporting convention** (lines 1559-1567):

```typescript
// On success it REPORTS BOTH DERIVED NUMBERS rather than printing a bare PASS (the established
// "guards report what they checked" convention). A line reading `0 roles` would then be visible as
// the anomaly it is instead of hiding behind the word PASS.
function guardKitCounts(): void {
  process.stdout.write(
    "\n[guard_kit_counts] derived kit sets match their exact expected counts (KIT-01, D-20/D-21)\n",
  );
  let countFail = "";
```

**Accumulate-then-report failure idiom** (lines 1569-1571) — one string appended per finding, each
naming the derived number, the expected number, and the consumers to walk before changing it:

```typescript
  if (ROLE_FILES.length !== ROLE_COUNT) {
    countFail += `\nkit count: derived ${ROLE_FILES.length} role files, expected exactly ${ROLE_COUNT} — walk every derived consumer (...) BEFORE updating ROLE_COUNT in scripts/kit-model.ts`;
  }
```

**Registration in the run tail** (end of file) — add one call, with a comment stating why it sits
where it sits:

```typescript
guardKitCounts();
...
guardDistributionPair();
guardVoice();
```

For the pin guard: declare the literal ONCE (the recipe file is the home per D-08; the guard reads
it out of the recipe rather than re-declaring `0.0.78`), derive the scan set over kit + docs
markdown, assert every `@playwright/mcp@<x>` occurrence equals it, and REPORT the occurrence count
on the pass line so a zero-occurrence scan is visible as the anomaly it is.

---

### `agent-factory/checklists/browser-uat-recipe.md` (doc, checklist)

**Analog:** `agent-factory/checklists/playwright-visual-regression-recipe.md`

**Frontmatter + opening shape** (lines 1-26):

```markdown
---
kind: checklist
tier: enterprise
---
# Playwright Visual-Regression Recipe

Apply this recipe whenever a ticket changes the user interface and a visual baseline must be
verified at the quality gate. ...

This document is a reference how-to. The gate's UI/E2E step points to this file by name; it does not
restate the recipe.

## Tooling

- `@playwright/test` `1.62.1` — the native runner provides screenshots, fixtures, and parallelism.
  (version verified against the npm registry 2026-08-11; check for a newer one before you pin it)

Users install these in their own repository; grugops installs nothing and only recommends them:

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install --with-deps    # browsers; --with-deps installs OS libs for Docker/CI Linux
```
```

The pinned-version-with-a-verification-date bullet is exactly the shape D-08's `@playwright/mcp@0.0.78`
literal takes. Clear professional voice throughout (a gate contract, never caveman voice), and the
file enters `check-imperative-lexicon.ts`'s derived `checklists` set the moment it lands (Pitfall 8) —
run the text gates in the same task that writes it.

**Index row** — `agent-factory/checklists/00-index.md:33-40`, enterprise table, one row, one tier:

```markdown
| `linter-recommendations.md` | when configuring the lint step at the gate |
| `playwright-visual-regression-recipe.md` | when verifying UI visual baselines at the gate |
```

---

### `agent-factory/workflows/05-pr-quality-gate.md` (workflow prose)

**Analog:** the test-integrity bullet in its own Step 3 (line 37). Copy the paragraph shape —
invocation line, exit-code branch table in prose, fix-lane statement — with the AST checker's
meanings substituted:

> Run test-integrity **after** unit and e2e, which produce the skip count. The gate invokes the
> materialized checker: `node tools/grugops/test-skip-integrity.js .grugops/test-skips.md
> --skip-count <N>`. ... Branch on the checker's exit code. `0` → the registry justifies every skip,
> pass. `1` → a test-integrity finding ... `2` → the checker failed to run ... Exit `2` is an error
> distinct from a clean fail, recorded as such and never read as a pass. ... On any result other
> than exit `0` the gate STOPS.

Two deltas the planner must honour: the new step is placed **before** the e2e lane (it consumes no
run output — Pitfall 5), and the gate order sentence at line 31 (`install -> lint -> typecheck ->
unit -> build -> e2e -> test-integrity`) must be updated in the same edit or the prose and the step
list disagree.

The `emit-verdict` verb signature also lives in this file (line 47,
`node scripts/context-io.js emit-verdict <task> <id> <integrity> [contextRoot]`) — the SHA argument
is a prose edit here AND a code edit in `context-io.ts`, planned in one task.

---

### `agent-factory/contracts/context-note.md` (contract doc)

**Analog:** its own kind table (line 137) and the storage-model section (lines 19-40). The three
new fields are documented against the existing `artifact-ref` row:

```markdown
| `artifact-ref`   | A pointer to a produced artifact (a file, a PR, a report) by reference. |
```

The document's own framing sentence sets the voice and the authority claim to preserve: "This
document is the authoritative schema ... The only sanctioned writer of context notes is
`scripts/context-io.ts`". The contract text and `composeNote`/`validate` must be edited together —
the doc is the claim, the composer is the mechanism.

## Shared Patterns

### The D-12 runnable contract (exit 0/1/2)
**Source:** `scripts/runnable-ref/test-skip-integrity.ts` lines 21-27, and the branch prose at
`agent-factory/workflows/05-pr-quality-gate.md:37`
**Apply to:** the new runnable, its test, and the workflow-05 wiring.
Exit 1 is a real AST-ban finding. BOTH loud skips (missing `typescript`, missing/unusable browser)
are "could not run" → exit 2. Conflating them makes an environment problem read as a spec defect.

### Loud skip: exported const + injectable fail-closed probe + single emission point
**Source:** `scripts/e2e/uat-live.test.ts` lines 82-118 (quoted verbatim in RESEARCH.md Pattern 2)
**Apply to:** both Phase-31 markers.
Three properties to clone, not just the shape: the marker is an exported const so a proving test
asserts it byte-for-byte; the probe is injectable so the unavailable branch can be forced in a test;
the probe is fail-closed (`catch { return false }`) so an inconclusive probe skips rather than greens.

### node:-builtins-only in a materialized runnable
**Source:** `scripts/runnable-ref/test-skip-integrity.ts` lines 15-19 and its single import
`import { readFileSync } from "node:fs";`
**Apply to:** `uat-spec-integrity.ts`. `typescript` is reached ONLY through `createRequire` against
the target at runtime, inside the try/catch that loud-skips.

### Derived set, reported count
**Source:** `scripts/check-foundation-guards.ts` lines 1559-1562
**Apply to:** the AST runnable's spec set (glob `**/uat/*.uat.spec.ts`) and the pin guard's scan set.
Derive the count independently of the loop that consumes it, and print it on the pass line so
`0 uat specs checked` is visible as the anomaly it is (Pitfall 3, and P29's vacuity-floor lesson:
a floor that catches an EMPTY denominator does not catch a SILENTLY SHORT one).

### One write authority, one emission tail
**Source:** `scripts/context-io.ts` lines 1094-1135 (`emitTrusted`)
**Apply to:** every note this phase emits. "Adding an emitter therefore cannot add a way to write."
No second author of `by: §14-gate`; no pre-check of the SHA at the gate beside `admit()`.

### sha256 over file bytes
**Source:** `scripts/generate-hook-manifest.ts:54` — `createHash("sha256").update(readFileSync(join(root, rel))).digest("hex")`;
same idiom at `hooks/hook-entry.ts:190`
**Apply to:** D-02's `content_hash`. Copy it; do not invent a second hashing shape.

### git HEAD via arg-array spawn
**Source:** `scripts/freshness.ts:147` — `const headRev = git(["rev-parse", "HEAD"]);`
**Apply to:** whoever supplies the gate-run HEAD. Arg-array, never a shell string.

### Test spawns the COMMITTED .js, never the .ts
**Source:** `scripts/runnable-ref/test-skip-integrity.test.ts` lines 29-41
**Apply to:** the new runnable's test. Never hand-edit a committed `.js`; run `npm run build` and
commit the output, then let `freshness` + `check:build-parity` prove the pair.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| Chrome-lane absence test (D-09) | test | source-scan assertion | No existing test asserts the ABSENCE of a symbol reference in a source file. The nearest shapes are the derived-corpus scans in `scripts/check-foundation-guards.ts` (read a file set, assert a property of its text) and the spawnSync harness in `test-skip-integrity.test.ts`. Compose from those two: derive the lane's file set, assert no member's text contains `emitVerdict` or `§14-gate`, and report the derived member count so an empty set fails rather than passes. |
| `agent-factory/workflows/06-uat-pack.md` QE/E2E step | workflow prose | — | Workflow 06's existing steps do not invoke a tool; the step-bullet shape comes from workflow 05 Step 3, adapted to the Phase 29 writing profile. Partial match only. |

## Metadata

**Analog search scope:** `scripts/`, `scripts/runnable-ref/`, `scripts/e2e/`, `install/`,
`agent-factory/checklists/`, `agent-factory/contracts/`, `agent-factory/workflows/`
**Files scanned:** 12 read (targeted, non-overlapping ranges on the two 2.5k+/3.7k-line sources)
**Tracked-source check:** `git ls-files` run over every analog path; all tracked
**Pattern extraction date:** 2026-09-07
