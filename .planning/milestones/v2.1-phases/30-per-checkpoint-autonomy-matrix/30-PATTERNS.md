# Phase 30: Per-Checkpoint Autonomy Matrix - Pattern Map

**Mapped:** 2026-09-05
**Files analyzed:** 14 file groups (3 new modules, 8 changed sources, 3 config/doc surfaces)
**Analogs found:** 13 / 14

All analog paths below were verified git-tracked with `git ls-files -- <path>` (2026-09-05). No
gitignored mirror paths appear in this document.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/checkpoints.ts` (NEW) | model / derived-set module | transform (markdown → set) | `scripts/check-diff-disposition.ts` (`locateSection`, `FROZEN_SOURCES`, `deriveFrozenSet`) | exact |
| `scripts/checkpoints.test.ts` (NEW) | test | transform | `scripts/floor-invariance.test.ts` (value sweeps) + `scripts/check-diff-disposition.test.ts` | role-match |
| `scripts/generate-guarantees.ts` (NEW) | generator | batch / file-I/O | `scripts/generate-safety-surface.ts` | exact |
| `scripts/guarantees-freshness.ts` (NEW) | gate | batch / file-I/O | `scripts/catalog-freshness.ts` | exact |
| `scripts/context-io.ts` — reader collapse | service (config reader) | file-I/O → discriminated result | `readGovernanceConfigResult` in the same file (`:1322`) | exact (self) |
| `scripts/context-io.ts` — `emitVerdict` | service (point-of-effect writer) | request-response | `emitVerdict` itself (`:930-980`) + `admit()` refuse-path | exact (self) |
| `scripts/audit-model.ts` — `SAFETY_FLOORS` | model (closed set) | CRUD-ish table | `SAFETY_FLOORS` (`:202-224`) | exact (self) |
| `scripts/validate-agent-factory.ts` — checkpoints validation | validator | request-response | `Q_ENUMS` / presence-guarded enum block (`:349-392`) | exact |
| `hooks/guard.ts` — matrix + key two + banner | middleware (PreToolUse hook) | event-driven / request-response | `hooks/admission-guard.ts` (per-name grant, `:200-227`) | exact |
| `hooks/admission-guard.ts` — reader rename | middleware | event-driven | itself (`:126-136`) | exact (self) |
| `agent-factory/config/factory.config.json` + seed twin + `.md` twin | config | CRUD | existing `quality` / `context` object keys; twins held by `scripts/config-governance-consistency.test.ts` | exact |
| `scripts/fixtures/*/…/factory.config.{json,md}` (8 repos × 2) | config fixture | CRUD | `scripts/fixtures/good/` | exact |
| `agent-factory/workflows/*.md` — 38 tagged stop bullets | content (frozen region) | transform | existing `## Stop conditions` bullets; companion rows under `docs/audit/29-style-dispositions/` | exact |
| `docs/audit/28-claim-registry.md` — `depends_on` remap + `dropped` status | data (registry) | CRUD | existing rows; parsed by `readRegistry()` in `scripts/audit-model.ts` | exact |
| Run banner (hook denial/notify + workflow 05 header) | utility | request-response | `scripts/coordinator-resolution-precheck.ts:293-307` | partial (banner+exit-status agreement only; no per-run governance banner exists) |

## Pattern Assignments

### `scripts/checkpoints.ts` (model / derived-set module, transform)

**Analog:** `scripts/check-diff-disposition.ts`

**Closed-key table pattern** (`:575-590`) — the compile-error-on-missing-member shape AUTO-01 needs.
Copy the union-plus-`Record` shape; upgrade the annotation to `as const satisfies Record<…>` so the
roster and the defaults are ONE declaration:

```typescript
/** Which of D-01's three sources a frozen clause came from, and what a change to it owes. */
export type FrozenSourceName =
  | "registryAnchors"
  | "structuralSections"
  | "positiveGuardLiterals";

/**
 * The three D-01 sources, each with the companion edit a change to it owes. Object.keys() over this
 * is the source count; nothing else declares it.
 */
export const FROZEN_SOURCES: Readonly<
  Record<FrozenSourceName, { readonly what: string; readonly companion: string }>
> = {
```

Note the comment "Object.keys() over this is the source count; nothing else declares it" — that
sentence is the pattern, not decoration. `CHECKPOINTS` must be `Object.keys(CHECKPOINT_DEFAULTS)`,
never a second literal.

**Section-anchored parse pattern** (`:562-572`) — the ONLY sanctioned section locator. Import it; do
not restate the grammar (Pitfall 2, the P29 scope lesson):

```typescript
export function locateSection(
  text: string,
  heading: string,
): { from: number; to: number } | null {
  const at = unfencedHeadingIndex(text, heading);
  if (at === -1) return null;
  return { from: at + 1, to: sectionEndIndex(text, at + 1, 2) };
}
```

**Cardinality-anchor pattern** (`:480-503`) — the pinned expected count per corpus, which the
checkpoint derivation reuses as its independently-computed denominator:

```typescript
export const FROZEN_SECTION_ANCHORS: readonly {
  readonly corpus: "roles" | "workflows";
  readonly heading: string;
  readonly subpath: string;
  readonly expected: number;
}[] = [
  { corpus: "roles", heading: "## Hard limits", subpath: ROLES_SUBPATH, expected: ROLE_COUNT },
  { corpus: "workflows", heading: "## Stop conditions", subpath: WORKFLOWS_SUBPATH, expected: WORKFLOW_COUNT },
  { corpus: "workflows", heading: "## Commit", subpath: WORKFLOWS_SUBPATH, expected: WORKFLOW_COUNT },
];
```

**Corpus lister + vacuity refusal** — `scripts/kit-model.ts:107-108, 700-730`. Use these listers;
never `readdirSync` directly:

```typescript
export const ROLE_COUNT = 17;
export const WORKFLOW_COUNT = 19;

// Refuse a zero-length filtered set (D-21 tier 1). Returning [] here would let every downstream
// scan-set consumer report PASS over nothing.
function refuseEmpty(files: string[], dir: string, kind: string): string[] {
  if (files.length === 0) {
    throw new Error(
      `kit-model: no ${kind} files found in ${dir} — refusing to return an empty set (a vacuous scan set passes every guard)`,
    );
  }
  return files;
}
```

---

### `scripts/generate-guarantees.ts` (generator, batch/file-I/O)

**Analog:** `scripts/generate-safety-surface.ts` (D-17 names it explicitly)

**Fixed-OUT + REGEN_COMMAND pattern** (`:41-57`):

```typescript
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readRegister, readRegistry, REGISTER_PATH, REGISTRY_PATH } from "./audit-model.js";

const DEFAULT_ROOT = join(import.meta.dirname, "..");

/** FIXED literal, repo-relative. The ROOT is redirected under test; this path never is. */
export const OUT = "docs/audit/28-safety-surface-exclusions.md";

/** The npm script that reproduces this file. Named in the header AND in the freshness refusal. */
export const REGEN_COMMAND = "npm run generate:safety-surface";
```

**Registry join pattern** (`:72-100`) — the `kind: safety` filter Phase 30's join reuses, extended
with `depends_on` → live matrix:

```typescript
  for (const claim of readRegistry(root).claims) {
    if (claim.kind === "safety") {
      add(claim.file, `home of safety claim ${claim.id}`);
    }
  }

  // Sort by path — the ONLY ordering, so the output is a pure function of the two sources.
  return [...byFile.keys()]
    .sort()
    .map((file) => ({ file, reasons: byFile.get(file) as string[] }));
```

**Windows-safe entry guard + fail-closed exit** (`:170-188`) — copy verbatim in shape:

```typescript
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  try {
    const text = renderSafetySurface();
    writeFileSync(join(DEFAULT_ROOT, OUT), text, "utf8");
    const count = safetySurfaceUnion().length;
    process.stdout.write(`Wrote ${OUT} — ${count} entr${count === 1 ? "y" : "ies"}.\n`);
    process.exit(0);
  } catch (e) {
    process.stderr.write(`  ERROR    ${(e as Error).message}\n`);
    process.exit(1);
  }
}
```

**Where this analog is INSUFFICIENT (Pitfall 6):** the template refuses only an EMPTY union. Phase 30
must additionally assert the join length equals a second, independently counted `kind: safety` row
count (currently 6, per RESEARCH F-5).

---

### `scripts/guarantees-freshness.ts` (gate, batch/file-I/O)

**Analog:** `scripts/catalog-freshness.ts` (one of six precedents; this is the closest by shape)

**Mirror-spawn + byte-compare pattern** (`:23-50`):

```typescript
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const tmp = mkdtempSync(join(tmpdir(), "grugops-catalog-fresh-"));

function cleanup(): void {
  rmSync(tmp, { recursive: true, force: true });
}
```

The header states the two rules to carry over: OUT stays a fixed literal (the gate mirrors instead of
overriding it), and "if the mirrored regeneration cannot run cleanly, the gate NEVER reports 'fresh'".
The import-closure copy list is a hand-maintained set in the analog — derive it or pin its count.

---

### `scripts/context-io.ts` — reader collapse (service, file-I/O → discriminated result)

**Analog:** `readGovernanceConfigResult` in the same file (`:1322-1370`). D-12 keeps this shape and
deletes `readGovernanceConfig` (`:1275`).

**The discriminant to preserve** (`:1337-1343`):

```typescript
export type GovernanceConfigSource = "absent" | "ok" | "unreadable";
export interface GovernanceConfigResult {
  source: GovernanceConfigSource;
  config: GovernanceConfig;
}
```

**Candidate-path resolution — identical in both readers** (`:1345-1348`), keep the order:

```typescript
  const candidates = [
    join(base, ".grugops", "factory.config.json"),
    join(base, "agent-factory", "config", "factory.config.json"),
  ];
```

**Fail-closed canonicalization pattern (Pitfall 4)** (`:1266-1273`) — the `checkpoints` matrix needs
the exact analogue, `canonicalizeDisposition(raw) → "block"` for anything not exactly one of the
three canonical strings:

```typescript
const GATE_OR_STRICTER_HUMAN_ADMISSION = "all";

// Canonicalize a raw human_admission JSON value read from config. A string is taken VERBATIM (the
// existing contract — "off"/"high-severity"/"all"/typo all flow through unchanged; the hook canonicalizes
// a typo'd STRING fail-closed). A PRESENT non-string value is gate-or-stricter, never `off`.
function canonicalizeHumanAdmission(raw: unknown): string {
  return typeof raw === "string" ? raw : GATE_OR_STRICTER_HUMAN_ADMISSION;
}
```

**Four-branch degenerate-shape handling** (`:1357-1370`) — copy all four branches for `checkpoints`
(non-object whole file / present non-object key / absent key / present non-string value); the
absent-object branch must reach the roster default, never `off`:

```typescript
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {
          source: "ok",
          config: { human_admission: GATE_OR_STRICTER_HUMAN_ADMISSION, audit_retention: GOVERNANCE_DEFAULTS.audit_retention },
        };
      }
      const context = (parsed as { context?: unknown }).context;
      if (context === undefined) {
        return { source: "ok", config: { ...GOVERNANCE_DEFAULTS } };
      }
```

---

### `scripts/context-io.ts` — `emitVerdict` (service, point-of-effect, request-response)

**Analog:** `emitVerdict` itself (`:930-980`). D-15/D-16 change its signature; the surrounding
structure is the pattern to preserve.

**Current signature — the parameter to add is required and positional-third** (`:930-935`):

```typescript
export function emitVerdict(
  task: string,
  id: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  at: string = new Date().toISOString(),
): string {
```

**Refuse-before-compose** — the D-16 "EMITS NOTHING" check belongs immediately after
`assertSafeTask(task)`, before any note is composed, alongside the existing named-throw idiom
(`:936-946`):

```typescript
  assertSafeTask(task);
  assertSingleLine("verdict id", id);
  if (!GATE_STAMP_RE.test(verdictStampFor(id))) {
    throw new Error(
      `context-io.emitVerdict: invalid per-run id "${id}" — the emitted stamp ` +
        `"${verdictStampFor(id)}" must match ${GATE_STAMP_RE}.`,
    );
  }
```

**Single write chokepoint — unchanged** (`:975-979`):

```typescript
  // Route through the SAME single write chokepoint as appendNote (R6-1): emitVerdict is a SECOND
  // direct note-file writer, so containment must live in the shared helper, not only in appendNote.
  const notesDir = join(contextRoot, task, "notes");
  writeNoteFile(notesDir, noteIdStr, text);
  return noteIdStr;
```

**Recognizer that must stay in lockstep and unchanged (D-16)** (`:914-927`): `isLiveGreenVerdict` and
`VERDICT_GREEN_MARKER = "READY_FOR_HUMAN_REVIEW"`.

---

### `hooks/guard.ts` — matrix lookup, key two, banner (middleware, event-driven)

**Analogs:** `hooks/admission-guard.ts` (per-name env grant) + `hooks/guard.ts` itself (self-approval
refusal). D-24: one hook, unfrozen and re-frozen in the same commit.

**deny() shape — identical in both hooks** (`guard.ts:90-101`):

```typescript
function deny(reason: string): never {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0); // exit 0 + JSON deny = blocked, with a message for the agent.
}
```

**Self-approval refusal to GENERALIZE over the `GRUGOPS_FLOOR_*` family** (`guard.ts:88, 116-123`) —
do not write a second detector:

```typescript
const SELF_APPROVE = new RegExp(`(^|[\\s;&|(])(export\\s+|env\\s+)?${APPROVAL}\\s*=`);
...
if (SELF_APPROVE.test(cmd)) {
  deny(
    `Refused: an agent may not set or export ${APPROVAL}. ` +
      `Approval for a production deploy must come from a human who exports ${APPROVAL} ` +
      `in the shell that launches Claude — it cannot be set inside the command.`,
  );
}
```

**Fresh per-invocation env read + named denial (D-09/D-10 model)** — `admission-guard.ts:205-214`:

```typescript
const approver = process.env[APPROVAL];
if (typeof approver !== "string" || approver.length === 0) {
  deny(
    `Admission blocked: humans decide, agents execute. This is a gated governance finding ` +
      `(by: ${by}); it requires a named human disposition. The finding cannot be admitted until a ` +
      `human exports ${APPROVAL}=NAME in the shell that launches Claude and the admission carries a ` +
      `matching verified_by: human:NAME stamp. The agent must not set ${APPROVAL} itself.`,
  );
}
```

**Reader call from a hook, with a throw that also fails closed** (`admission-guard.ts:126-136`) — the
call site D-12 must move to the renamed single reader:

```typescript
let configResult: GovernanceConfigResult;
try {
  configResult = readGovernanceConfigResult(process.env.CLAUDE_PROJECT_DIR);
} catch {
  deny(
    `Admission blocked (fail-closed): the governance configuration could not be read while ` +
      `evaluating an admission. A human must resolve the configuration, or export ${APPROVAL}=NAME ` +
      `to authorize this admission explicitly.`,
  );
}
```

**Malformed-stdin fail-closed read** (`guard.ts:104-114`) — unchanged shape, but note the comment's
reasoning must be re-derived once the guard also gates non-deploy checkpoints: "an empty command
matches no deploy pattern and is allowed" stops being safe if a checkpoint's default is `block`.

**Executor gotcha (RESEARCH F-8):** `scripts/floor-invariance.test.ts` asserts BOTH
`git hash-object hooks/guard.ts === FROZEN_GUARD_BLOB` (`:95, 243, 548`) AND
`git diff --quiet hooks/guard.ts`. The suite cannot be green mid-edit — verification runs after commit.
`GUARD_JS` at `:87` points at `hooks/admission-guard.js`, a different artifact in the same test file.

---

### `scripts/audit-model.ts` — `SAFETY_FLOORS` (model, closed set)

**Analog:** itself (`:195-224`). D-04 makes it canonical; D-05 removes the `autonomy` member.

```typescript
// THE VALUES ARE NOT TRANSCRIBED HERE. Each config-backed floor carries the PATH to its value and
// safetyFloorLiveValue() reads it from the live config at run time, so the floor list cannot drift
// from the config it describes.
export const SAFETY_FLOORS: readonly SafetyFloor[] = [
  {
    id: "autonomy",
    configPath: "autonomy",
    why: "How far an agent may act without a human. Lowering it past `pr` is what would falsify every claim that a human holds the merge.",
  },
  ...
  {
    id: "protected_branch_merge",
    configPath: null,
    why: "Agents never merge a protected branch. This is a HARD LIMIT with NO config key — there is no dial for it, and naming one here would imply there is.",
  },
];
```

The `configPath: null` member's `why` becomes FALSE once the matrix gives
`protected_branch_merge` a config key — rewrite it in the same edit. The `configPath` values move
from `"autonomy"` / `"production_requires_human_confirmation"` to `checkpoints.<id>` paths;
`safetyFloorLiveValue()` (`:229-236`) reads them and needs no change if the path form stays dotted.

---

### `scripts/validate-agent-factory.ts` — checkpoints validation + `autonomy` refusal (validator)

**Analog:** the config-validation block in the same file (`:325-392`).

**The polarity flip (D-05)** — `autonomy` comes OUT of this required loop and gains a refusal branch
(`:336-340`):

```typescript
  for (const key of ["mode", "cadence", "autonomy"]) {
    if (typeof cfgObj[key] !== "string" || (cfgObj[key] as string).trim() === "") {
      err(`${rel}: missing or empty required key "${key}"`);
    }
  }
```

**The present-guarded enum pattern the `checkpoints` object must follow** (`:343-372`) — absent = lean
default and never an error (SC4); only a present invalid value is `err()`, never `warn()`:

```typescript
  // ACTIVE-WHEN-PRESENT, LENIENT-WHEN-ABSENT — the opposite contract to the required-string loop
  // above: a MISSING key is its documented lean default (NEVER an error — preserves SC4
  // zero-config); only an INVALID PRESENT value is an err() ... Every check is guarded by
  // `if (key in obj)`, never the unconditional loop.
  const Q_ENUMS: Record<string, string[]> = {
    tdd: ["off", "encouraged", "required"],
    test_integrity: ["warn", "block"], // disabling EXCLUDED — TINT-03 carve-out
    gate_enforcement: ["advisory", "blocking"],
  };
```

**Nested-object shape check** (`:374-392`) — the `quality` block is the exact shape the flat
`checkpoints` object copies (non-null, non-array object guard, then per-key iteration):

```typescript
  const quality = cfgObj.quality;
  if (quality && typeof quality === "object" && !Array.isArray(quality)) {
    const q = quality as Record<string, unknown>;
    for (const [k, allowed] of Object.entries(Q_ENUMS)) {
      if (k in q && !allowed.includes(q[k] as string)) {
        err(`${rel}: invalid "quality.${k}" value "${q[k]}" (allowed: ${allowed.join("|")})`);
      }
    }
```

Difference for `checkpoints`: the allowed KEY set is `CHECKPOINTS` (imported, not restated), and an
unknown key is itself a refusal — the `quality` block has no unknown-key arm to copy.

---

### Run banner (utility, request-response)

**Analog (partial):** `scripts/coordinator-resolution-precheck.ts:293-307` — the only
banner/exit-status agreement precedent. No per-run governance banner exists anywhere.

```typescript
  // TWO SIGNALS, EITHER ONE A REFUSAL (27-21, WR-01). ... Both are checked against the SAME captured
  // run, and the message names which of the two fired, because the `ran cleanly` line below is a
  // claim a human acts on — narrating it over a run that refused a whole class is the spoofing
  // failure this gate exists to prevent.
  const detail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  if (r.status !== 0) {
    fail(`the scratch install did not complete (exit ${String(r.status)}...`);
  }
  if (detail.includes("install INCOMPLETE")) {
    fail(
      `the scratch install printed the INCOMPLETE banner while exiting ${String(r.status)} — the banner and the exit status disagree, so the install refused a whole class...`,
    );
  }
```

Carry over: both signals captured from ONE run, and the failure message names which fired. Do NOT
carry over `detail.includes(...)` as the AUTO-07 assertion shape — D-20 requires a whole-run
differential against HEAD (a substring check is the AP-1 anti-pattern).

---

### Config surfaces (config, CRUD)

**Analog:** the existing `quality` / `context` objects in `agent-factory/config/factory.config.json`,
with three twinned surfaces that must change in one commit:

- `agent-factory/config/factory.config.json`
- `agent-factory/seed/.grugops/factory.config.json` (byte-identical twin)
- `agent-factory/config/factory.config.md` (markdown twin; `:14` autonomy row, `:164-174`
  default-on-absent contract, plus the stale "nine keys" count and the stale "single safety floor"
  sentence — both are set-literal drift sitting in the file this phase edits)

Oracles that already hold the twins: `scripts/config-governance-consistency.test.ts`,
`scripts/config-queue-consistency.test.ts`, `scripts/model-dial-consistency.test.ts`.

**Fixture surfaces (Pitfall 3):** 8 fixture repos × 2 config twins = 16 files under
`scripts/fixtures/{bad-config-no-mode, bad-plugin-noname, bad-role-missing-section,
bad-ticket-bad-column, bad-ticket-mismatch, bad-workflow-no-commit, good, warn-only-no-trace}/`.
Several are deliberately bad in exactly one way; an `autonomy` refusal makes them fail for a second
reason and they stop testing what they exist to test. Derive the fixture set with a directory read and
assert its count.

---

### Frozen-region edits (content, transform)

**Analog:** `scripts/check-diff-disposition.ts:596-599` — the companion each `## Stop conditions` edit
owes:

```typescript
  structuralSections: {
    what: "a structural section located by heading — role `## Hard limits`, workflow `## Stop conditions`, workflow `## Commit`",
    companion: `a disposition row under ${DISPOSITION_DIR}/ whose \`companion\` cell names the section and the reason`,
  },
```

`DISPOSITION_DIR = "docs/audit/29-style-dispositions"` (`:248`), already holding `00-base.md` and
`29-05.md` … `29-44.md`. Phase 30 adds `30-NN.md` files in the SAME plan as the tagging task.

Two false alarms resolved by research and confirmed here: `check-imperative-lexicon.ts` deliberately
does not govern `## Stop conditions`, and `check-foundation-guards.ts`'s D-19 section-ownership rule is
not mechanically enforced (`:2937-2955`, self-declared `UNKNOWN - verify`).

## Shared Patterns

### Fail-closed canonicalization
**Source:** `scripts/context-io.ts:1266-1273` (`canonicalizeHumanAdmission`, GATE_OR_STRICTER)
**Apply to:** the `checkpoints` matrix reader, `validate-agent-factory.ts`, and the hook's lookup.
A `switch` with a `default:` returning anything but `block` is the warning sign. Sweep the same
degenerate value set `scripts/floor-invariance.test.ts:114-124` already uses (`"off"`, `""`, `"bogus"`,
`"OFF"`, `"true"`, `"1"`, junk).

### Vacuity refusal + independently derived denominator
**Source:** `scripts/kit-model.ts:715-730` (`refuseEmpty`) and
`scripts/check-diff-disposition.ts:480-503` (`expected: ROLE_COUNT` / `WORKFLOW_COUNT`)
**Apply to:** the checkpoint derivation, the guarantees join, and the banner assertion.
`refuseEmpty` alone catches an EMPTY set, never a SILENTLY SHORT one — pair every `length === 0` throw
with a count assertion whose denominator is computed outside the consuming loop.

### PreToolUse deny + exit 0
**Source:** `hooks/guard.ts:90-101`, byte-identical in `hooks/admission-guard.ts:74-85`
**Apply to:** every new denial path in `guard.ts`. Exit 0 with a JSON `permissionDecision: "deny"`;
never a bare non-zero exit.

### Fixed-literal OUT + REGEN_COMMAND + Windows-safe entry guard
**Source:** `scripts/generate-safety-surface.ts:52-57, 170-188`
**Apply to:** `generate-guarantees.ts`. `pathToFileURL` comparison, not a hand-built `file://` string —
the hand-built form fails on Windows and writes nothing while exiting 0 (a fabricated success).

### Committed `.js` freshness
**Source:** `scripts/freshness.ts` (reads the committed side via `git show HEAD:` / `git ls-tree -r HEAD`)
**Apply to:** every `.ts` this phase touches. `npm run build` and commit the `.js` in the SAME commit
as the source; an uncommitted rebuild does not satisfy the gate.

### Test command
**Source:** `.planning/config.json` `workflow.test_command`
**Apply to:** every plan's verification block — `npx vitest run --exclude '**/scripts/e2e/**'`.
Bare `npm test` pulls in the live Claude-CLI e2e lane.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| Per-run governance banner (in `hooks/guard.ts` and the workflow 05 header) | utility | request-response | No runtime governance banner exists in the tree. `coordinator-resolution-precheck.ts:293-307` supplies only the banner/exit-status **agreement** discipline; the banner's own composition, its placement before check output, and the zero-config `all checkpoints at default` line have no precedent. `install/install.ts:198-232` (provenance banner sentinels, exactly-one-banner assertion) is the closest shape for "exactly one banner is printed" and should be read for that assertion only. |

Also with no direct precedent, though the surrounding files are exact analogs:

- `as const satisfies Record<…>` — `satisfies` appears nowhere in the tree. `FROZEN_SOURCES`' explicit
  `Record` annotation is the closest and already delivers the compile error; `satisfies` is chosen to
  keep roster and defaults in one declaration.
- Registry `status: dropped` and a generated-text anchor comparison in `scripts/check-claim-anchors.ts`
  — the verbatim-at-anchor bijection exists; comparing against generated text is new.
- Wiring a new `docs/` file into `scripts/check-banned-claims.ts` (which excludes `**/docs/` as a
  segment class at any depth) and `scripts/check-public-docs-vocabulary.ts` (whose corpus has three
  self-deriving parts) — no precedent for adding a member to either scan set. RESEARCH F-6 recommends
  placing the render at repo-root `GUARANTEES.md` instead, which puts it in the public-docs corpus by
  construction.

## Metadata

**Analog search scope:** `scripts/`, `hooks/`, `agent-factory/`, `docs/audit/`, `install/`
**Files read this session:** 10 (`generate-safety-surface.ts`, `check-diff-disposition.ts`,
`context-io.ts`, `audit-model.ts`, `validate-agent-factory.ts`, `guard.ts`, `admission-guard.ts`,
`kit-model.ts`, `coordinator-resolution-precheck.ts`, `catalog-freshness.ts`) — targeted ranges only
**Tracked-source verification:** `git ls-files --` over all 19 named analog paths, all returned tracked
**Pattern extraction date:** 2026-09-05
