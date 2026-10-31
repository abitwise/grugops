# Phase 40: Plain-language role rewrite - Pattern Map

**Mapped:** 2026-10-31
**Files analyzed:** 22 (new or modified, plus groups)
**Analogs found:** 21 / 22

All analog paths below are git-tracked (checked with `git ls-files`).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/check-role-rules.ts` (+ `.js`) NEW | gate (CLI) | file-I/O, derive + compare to a committed baseline | `scripts/check-imperative-lexicon.ts` (header, ROOT, pass/fail, `boardColumns()`, entry guard) | role-match |
| `scripts/check-role-rules.test.ts` NEW | test | planted mirror + spawn of committed `.js` | `scripts/check-kit-refs.test.ts` (`freshTmp`/`makeMirror`/`runGate`, lines 115-150) | exact |
| `docs/audit/40-role-rule-inventory.json` NEW | generated baseline | batch | none in repo (written by `--write-baseline`) | no analog |
| `scripts/check-foundation-guards.ts` corpus-total guard | gate function | file-I/O | `guardRoleSize()` + `ROLE_CEILINGS`, lines 3520-3625 | exact |
| `scripts/check-foundation-guards.ts` inverted `guardCavemanVoice` | gate function | file-I/O | itself, lines 3355-3419 | exact (inversion) |
| `scripts/check-foundation-guards.ts` `guardVoice` whole-file | gate function | file-I/O | `EXPECTS_CAVEMAN_FENCE`, line 2931 | exact |
| `scripts/check-foundation-guards.ts` `ROLE_CEILINGS` re-baseline | config table | n/a | lines 3545-3565 | exact |
| `scripts/check-foundation-guards.test.ts` `mirror()` rewrite | test helper | transform | lines 425-560 (`repairCavemanBlock`, `dedupeClauses`, `normalizeMirroredRole`, `mirror`) | exact |
| `scripts/check-diff-disposition.ts` D-30 stand-in arm | gate | git + spawn | `git()` wrapper lines 237-250, `BASE_COMMIT_RE` 268, FROZEN branch 1955-2001 | exact |
| `scripts/check-diff-disposition.test.ts` stand-in cases | test | real git repo in tmp | `gitIn`/`makeMirror`/`runGate`, lines 136-145, 299-320, 448-455 | exact |
| `docs/audit/29-style-dispositions/00-base.md` | recorded base | config | itself | exact |
| `docs/audit/29-style-dispositions/README.md`, `.github/workflows/ci.yml` ~497, `scripts/uat-gate-exit-contract.test.ts:634` | companions | n/a | see Shared: same-commit companions | exact |
| `docs/audit/40-disposition-base-move.md` NEW | decision record | n/a | `docs/audit/29-ceiling-rebaseline.md` | role-match |
| `docs/audit/29-style-dispositions/40-NN.md` NEW (per plan touching a workflow) | rows file | n/a | `docs/audit/29-style-dispositions/quick-261031-rhv.md` | exact |
| `scripts/check-imperative-lexicon.ts` roles part | gate | file-I/O | `GOVERNED_CORPUS_EXCLUDED_LOCATIONS` (279-307), `GOVERNED_CORPUS_COUNT` (465-475) | exact |
| `scripts/validate-agent-factory.ts` `ROLE_SECTIONS` | config list | n/a | lines 371-380 | exact |
| `scripts/voice-model.test.ts:540` | test | n/a | itself (assert inverts to `missing`) | exact |
| `agent-factory/roles/*.md` (19) | kit markdown | n/a | `agent-factory/roles/tech-lead.md` (Phase 39 plain English) | role-match |
| `agent-factory/roles/_role-switch-protocol.md` | kit markdown | n/a | itself (protocol shape kept, D-15) | exact |
| `agent-factory/checklists/pr-review-checklist.md` | checklist | n/a | itself (472 B, flat bullets) | exact |
| `NOTICE` + byte copy `agent-factory/NOTICE` | license text | n/a | `NOTICE` lines 1-14 | exact |
| `agent-factory/writing-profile.md`, `CLAUDE.md:18`, `docs/audit/28-claim-registry.md` C-28-003 / F-28-202 | doc edits | n/a | text quoted in 40-RESEARCH.md "atomic flip" table | exact |

## Pattern Assignments

### `scripts/check-role-rules.ts` (gate CLI, derive + baseline)

**Analog:** `scripts/check-imperative-lexicon.ts`

**Imports + ROOT pattern** (lines 188-222). Copy the shape, swapping in what the inventory needs (`listRoleDirEntries` from kit-model, `fencedLineFlags`/`unfencedHeadingIndex`/`sectionEndIndex` from frontmatter, `reportMeasured` from vacuity):
```typescript
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { isEntrypoint } from "./is-entry.js";
import { join } from "node:path";
import { BOARD_REL } from "../install/state-layout.js";
import { fencedLineFlags, unfencedHeadingIndex, sectionEndIndex } from "./frontmatter.js";
import { listWorkflows, listRoleDisplayNames, listWorkflowDisplayNames, MAX_WALK_ENTRIES } from "./kit-model.js";
import { reportMeasured } from "./vacuity.js";

// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror. The truthiness ternary, not
// `??`: `CHECK_ROOT=""` must degrade to the repo root, exactly as every sibling gate does.
const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");
const abs = (rel: string): string => join(ROOT, rel);
let FAILS = 0;
const pass = (m: string): void => { process.stdout.write(`  PASS  ${m}\n`); };
```

**Board columns: reuse, do not re-parse** (lines 695-699, 813-835). Either export `boardColumns()` from check-imperative-lexicon (note: it is not in the hook manifest, but check) or copy with a test pinning equality. The partition guard also needs the `Exit owner` cell, so extend `firstCell` to an nth-cell reader on the same loop:
```typescript
const BOARD = `agent-factory/seed/${BOARD_REL}`;
const BOARD_TABLE_HEADER = "| Column | Entry means | Exit owner | WIP (default) |";
function boardColumns(): string[] {
  const text = readFileSync(abs(BOARD), "utf8");
  const flags = fencedLineFlags(text);
  const lines = text.split("\n");
  const at = unfencedHeadingIndex(text, BOARD_TABLE_HEADER);
  if (at === -1) throw new Error(`${BOARD} carries no \`${BOARD_TABLE_HEADER}\` header row`);
  const out: string[] = [];
  for (let i = at + 1; i < lines.length; i++) {
    if (flags[i]) continue;
    const row = lines[i].trim();
    if (!row.startsWith("|")) break;
    if (isTableRule(row)) continue;
    const cell = firstCell(lines[i]);
    if (cell !== "") out.push(cell);
  }
  return out;
}
```

**Result + entry guard** (lines 1838-1858):
```typescript
  process.stdout.write("\n== Result ==\n");
  if (FAILS === 0) { process.stdout.write("ALL CHECKS PASSED\n"); process.exit(0); }
  else { process.stdout.write(`${FAILS} CHECK(S) FAILED\n`); process.exit(1); }
}
const isEntry = isEntrypoint(import.meta.url);
if (isEntry) { runAll(); }
```
Add a `--write-baseline` argv branch (writes `docs/audit/40-role-rule-inventory.json`, stable key order, trailing newline) and a `--check` default; refuse (fail closed) when the baseline file is missing. The D-13 / D-35 set is the one hand constant, checked two-sided like `ROLE_CEILINGS` keys (below). The `(from,to)` exception list (D-33) is a second small named constant, each entry with a test.

**Wiring:** `package.json` script modelled on line 23 (`"check:imperative-lexicon": "tsc --outDir .tmp-build && node scripts/check-imperative-lexicon.js"`) as `check:role-rules`; CI step next to `node scripts/check-kit-refs.js` at `.github/workflows/ci.yml:300`.

---

### `scripts/check-role-rules.test.ts` (planted mirror, spawn)

**Analog:** `scripts/check-kit-refs.test.ts` lines 23-37, 115-150:
```typescript
import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix)); tmpDirs.push(d); return d;
}
afterAll(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }); });

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [GATE_JS], { encoding: "utf8", env: { ...process.env, CHECK_ROOT: checkRoot } });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}
```
Mirror copies `agent-factory/roles/`, the seed board, `complexity-rubric.md`, and the baseline JSON. Cases: green control; delete `UNKNOWN - verify` from one role → red naming it; duplicate a `` `X → Y` `` span in a second role → red ("partition"); remove a table-owned exit → red; missing baseline → red; D-13 constant names a non-role → red.

---

### Corpus-total guard in `scripts/check-foundation-guards.ts`

**Analog:** `guardRoleSize()` lines 3571-3622 (same file). Copy its pass/warn/fail ladder and two-way key check:
```typescript
  const roleBases = new Set(ROLE_FILES.map((f) => basename(f)));
  const ceilingKeys = new Set(Object.keys(ROLE_CEILINGS));
  const missing = [...roleBases].filter((b) => !ceilingKeys.has(b)).sort();
  const stale = [...ceilingKeys].filter((k) => !roleBases.has(k)).sort();
  ...
    const b = byteLen(f);
    if (b >= rfail) { fail(`${f} ${b}B >= ${rfail}B — role bloated (senior != verbose)`); }
    else if (b >= rwarn) { warn(`${f} ${b}B >= ${rwarn}B — approaching ceiling`); }
    else { pass(`${f} ${b}B within ceiling`); }
```
Scan set: `listRoleDirEntries(ROOT).filter(f => f.endsWith(".md"))` (already imported, line 288), cardinality asserted against `ROLE_COUNT + 1`. Constants `ROLE_CORPUS_FAIL = 67383`, `ROLE_CORPUS_WARN` from the allocation (sketch in 40-RESEARCH.md "Corpus-total guard (sketch)"). Add the new guard name to the `guard_kit_counts` walk message at line 1649.

**`ROLE_CEILINGS` re-baseline** (lines 3545-3565): keep the `"FAIL WARN"` string format and column alignment; replace every comment with `// Phase 40, measured N B, +12% / +6%`. Keep the D-17 / TIER-06 header comment (3524-3544) but say the old baselines no longer describe the files.

---

### Inverted `guardCavemanVoice` (same file, lines 3355-3419)

Keep the loop skeleton, `visited` counter, missing-file finding and the `reportMeasured` fold with independent denominator:
```typescript
  const measured: Measured<VoiceFinding> = {
    label: "caveman voice",
    visited,
    expected: ROLE_COUNT,   // + 1 if the protocol is covered
    findings,
  };
  FAILS += reportMeasured(measured, { pass, fail }, (x) => `  ${x.file}: ${x.detail}`);
```
Replace the body after `readCavemanFence(readText(f))` with the inverted predicate from 40-RESEARCH.md "Inverted voice predicate". Drop the lexicon/banned measurement and the two-arm conjunction. No new fence regex in this file (frontmatter.test.ts pins fence-machine counts); for a bare heading use `unfencedHeadingIndex(text, "## Caveman prompt")`.

**`guardVoice` whole-file:** delete or empty `const EXPECTS_CAVEMAN_FENCE = new Set<string>(ROLE_FILES);` (line 2931) and rewrite its comment block (2915-2930); every role then takes the existing `reason === "missing" && !expectsFence` branch.

---

### `scripts/check-foundation-guards.test.ts` `mirror()` rewrite

**Analog:** itself, lines 425-560. Keep `dedupeClauses` (466-510) and `mirror()` (544-560) as is; reduce `normalizeMirroredRole` to:
```typescript
function normalizeMirroredRole(text: string, rel: string): string {
  const repaired = dedupeClauses(text, rel);
  // keep the survivor re-measure (segmentClauses groups) and its loud throw
  return repaired;
}
```
Delete `repairCavemanBlock`, `CONFORMING_CAVEMAN_BLOCK`, the fence-refused and two-sided throws, `BOTH_ARMS_FAILING_BLOCK` / `allRedMirror()` (or repurpose `allRedMirror` as "plant a fenced block into every role" for the inverted red case). The existing `plantCavemanBlock(m, role, lines)` helper is the plant for the new permanent red case. If the protocol is scanned, add it to the mirror copy (GUARD_INPUTS excludes it; assertion at 6656-6661).

---

### D-30 stand-in arm in `scripts/check-diff-disposition.ts`

**Base key parse:** copy `BASE_COMMIT_RE` (line 268) shape for the new key:
```typescript
const BASE_COMMIT_RE = /^base_commit:[ \t]*([0-9a-f]{40})[ \t]*$/m;
// new, same canonical form:
const ROLE_STANDIN_RE = /^role_standin:[ \t]*(scripts\/[a-z0-9-]+\.js)[ \t]*$/m;
```
**Spawn:** copy the `git()` wrapper (lines 237-250): `execFileSync(process.execPath, [standin, "--check"], { cwd: ROOT, encoding: "buffer", maxBuffer: 64*1024*1024 })` inside try/catch; any throw = stand-in failed, never a pass. Do not import the script (keeps hook closure unchanged).
**Admission point:** the two finding sites, the FROZEN branch (1955-2001, gate on `source === "structuralSections"` only) and the "no disposition row" branch (2004-2016). Insert before each push: `if (standinOk && c.file.startsWith("agent-factory/roles/")) { admittedByStandin += 1; continue; }`. `registryAnchors` and `positiveGuardLiterals` never pass through it. PASS line: `N role clause(s) admitted by the role-rule inventory stand-in (D-30)`. Keep the existing message wording ("do NOT move the recorded base commit forward") but append the D-30 exception citation.
**After the last edit:** `npm run build`, `npm run generate:hook-manifest`, `npm run freshness:hook-manifest` (`hooks/hook-entry.ts:257` pins this `.js`).

### `scripts/check-diff-disposition.test.ts` stand-in cases

**Analog:** same file, `gitIn` (136-145), `makeMirror(prefix, spec)` (299-320, real git repo with a `base` commit), `runGate` (448-455, `spawnSync(process.execPath, [GATE_JS], { env: { ...process.env, CHECK_ROOT } })`), `ROLE_UNDER_TEST` (459). Plant a tiny stub stand-in script (`process.exit(0)` / `process.exit(1)`) into the mirror's `scripts/` and a `role_standin:` line into the mirror's `00-base.md`. Four cases per 40-RESEARCH.md D-30 step 4; REPRODUCTION 1 (no key) stays red unchanged.

---

### `docs/audit/29-style-dispositions/00-base.md`

Current frontmatter (move `base_commit`, add the key, keep the prose; add a D-30 paragraph after "Moving this SHA is not a remedy"):
```
---
base_commit: 4d2b8f079cc43d7d6184729966492789fb4dc05e
recorded: 2026-08-13
recorded_by: plan 29-04
gate: guard_diff_disposition
---
```

### `docs/audit/40-disposition-base-move.md` (decision record)

**Analog:** `docs/audit/29-ceiling-rebaseline.md` lines 1-40. Copy its shape: `# Plan 40-01 — ...` title; one-paragraph scope; `## THE DECISION: ...` heading in caps with the human decision quoted verbatim in a blockquote; a "what this is NOT" paragraph; `## Method — every number below was produced by a command in this plan` with a `| what | how |` table (here: old SHA, new SHA, the 721-finding breakdown by kind, the reproduce command at the old base); scope-end sentence (stand-in holds for `agent-factory/roles/` until a later recorded decision).

### `docs/audit/29-style-dispositions/40-NN.md` (rows file per workflow-touching plan)

**Analog:** `quick-261031-rhv.md` lines 1-30: `#` title naming the plan; a paragraph naming each watched file edited; a bold line `**The base commit is <sha>**, read from \`00-base.md\`.` plus the before/after finding counts; a paragraph on FROZEN sections and their `companion` cells; then `## Dispositions` with the seven-column table.

---

### `scripts/check-imperative-lexicon.ts` roles part (final plan)

Remove this entry from `GOVERNED_CORPUS_EXCLUDED_LOCATIONS` (lines 299-306):
```typescript
  {
    location: "agent-factory/roles/",
    label: "the role corpus",
    reason:
      "the roles are governed by guard_voice, guard_caveman_voice and guard_role_clause_uniqueness " + ...
  },
```
Move `GOVERNED_CORPUS_COUNT = 49` → 69 with the "MOVED 49 → 69 ON <date> IN PLAN 40-NN, AND THE ENTRANT IS NAMED" comment, copying the 48 → 49 paragraph at lines 465-474. Add a fifth part derived from `listRoleDirEntries`. Update `corpusBreakdown()`, the "all four parts" text at 1563, and the tests (`check-imperative-lexicon.test.ts` 240, 285, 339, 764). In plan 1 only the reason string changes if the guard is renamed.

### `scripts/validate-agent-factory.ts` `ROLE_SECTIONS` (lines 371-380)

Plan 1 removes `"## Caveman prompt"`; final plan appends `"## Activates when"` and `"## Stop when"`, plus the 187 fixture role files.

---

### `agent-factory/roles/*.md` (role skeleton)

**Analog:** `agent-factory/roles/tech-lead.md` (Phase 39, already second-person plain English). Copy:
- Frontmatter (`kind: role`, `tier`, `capabilities`; engineer adds `levels:`) and `# Role: <Name>` unchanged.
- `## One job` first line byte-identical (`Score each ticket's complexity, name the engineer level and plan the dev tasks.`); extra goal detail on following lines.
- `## Reads` bullets: path in backticks + short purpose (`- \`agent-factory/checklists/complexity-rubric.md\`, the scoring rules.`). Keep the absent-config sentence verbatim: `With no config file present, this role runs lean on the documented defaults in \`agent-factory/README.md\`.`
- `## Activates when` first sentence byte-identical (`Need a ticket scored and planned before development.`).
- `## Responsibilities` numbered, one action per item, ≤ 20 words per sentence, no modal (the TL item 1 "When the approach still needs design (F2 = 2), record the gap and send the ticket back to `In Design`." style).
- `## Trace updates` in its 2-sentence form: `Publish the decision note with the ticket id among its refs. \`tools/grugops/trace-render.js\` renders the trace from those refs.`
- Replace the two "Context I/O / Compaction" lines (367 B) with one pointer line (RESEARCH "Pointer lines"). Phase 39 roles keep exactly one `16-context-read-write` and one `18-context-compaction` (tier-kit-text pin).
- Headings lose suffixes: `## Output`, `## Board moves`. Board moves written as `` `X → Y` `` code spans (D-33).
- New `## Stop when` list: trigger → status (`BLOCKED`, done, `failed-attempt`) → who gets the ticket. Do not repeat a `## Hard limits` clause (clause uniqueness guard).
- Engineer: `## Levels` then `## Do less` (after Levels, tier-kit-text pin).

### `agent-factory/checklists/pr-review-checklist.md`

Keep frontmatter (`kind: checklist`, `tier: lean`) and flat lowercase bullets; append a `## Lean lens (advisory)` block of unnumbered bullets (≤ 25 words, no `and/or`, no "This is" opener).

### `NOTICE` and `agent-factory/NOTICE`

Lines 1-14 untouched (`voice-model.ts:383` cites NOTICE:4-7). Append after a blank line, plain wrapped paragraphs at ~90 columns like the existing ones, then `Copyright (c) 2026 DietrichGebert` and the MIT text byte-exact. Then `cp NOTICE agent-factory/NOTICE` (byte-identity test `install/installer-kit-home.test.ts:396-403`).

## Shared Patterns

### Fail-closed two-way set check
**Source:** `scripts/check-foundation-guards.ts:3575-3596`. **Apply to:** D-13 constant, corpus cardinality, partition exception list, inventory per-role keys.

### Vacuity-safe reporting
**Source:** `reportMeasured` from `scripts/vacuity.ts` (used at check-foundation-guards.ts 3410-3418, check-imperative-lexicon 1736, 1811). **Apply to:** every new loop-based guard; denominator is an independent count (`ROLE_COUNT`, `ROLE_COUNT + 1`), never the scan set's own length.

### Hermetic mirror + spawn committed `.js` via `CHECK_ROOT`
**Source:** `check-kit-refs.test.ts:115-150`, `check-diff-disposition.test.ts:299-455`. **Apply to:** all new red/green cases (red-before-green as a permanent planted case, Phase 29 D-24).

### Fence and section authority
**Source:** `scripts/frontmatter.ts` `fencedLineFlags` (477), `unfencedHeadingIndex` (765), `sectionEndIndex` (993); `readCavemanFence`, `segmentClauses`, `normalizeSentence` from `scripts/voice-model.ts` (read only, never edit). **Apply to:** check-role-rules, inverted guard, test helpers.

### Build, freshness, manifest
Every `.ts` edit: `npm run build`, commit the `.js`, `npm run freshness`. After the last edit to any `DECIDER_MANIFEST` member (`hooks/hook-entry.ts:254-267`, includes `check-diff-disposition.js`, `kit-model.js`, `voice-model.js`): `npm run generate:hook-manifest` then `npm run freshness:hook-manifest`. Per role batch: `npm run freshness:adapters && npm run freshness:catalog`.

### Same-commit companions for the base move
`00-base.md` SHA + `role_standin` key, README paragraph "Moving this SHA is not a remedy", CI comment `.github/workflows/ci.yml` ~497, `scripts/uat-gate-exit-contract.test.ts:634` expected SHA with a D-30 citation, and the decision record, all in one commit.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `docs/audit/40-role-rule-inventory.json` | generated baseline | batch | No committed JSON baseline written by a gate exists; define a stable sorted shape in check-role-rules and never hand-edit |

## Metadata

**Analog search scope:** `scripts/`, `agent-factory/roles/`, `agent-factory/checklists/`, `docs/audit/`, `NOTICE`, `package.json`, `.github/workflows/ci.yml`
**Files scanned:** ~15
**Pattern extraction date:** 2026-10-31
