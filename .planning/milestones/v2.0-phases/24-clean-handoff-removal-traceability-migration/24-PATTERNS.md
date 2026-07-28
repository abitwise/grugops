# Phase 24: Clean Handoff Removal & Traceability Migration - Pattern Map

**Mapped:** 2026-06-22
**Files analyzed:** 10 code artifacts (3 NEW, 7 MODIFIED) + the markdown rewire surface (18 roles + 16 workflows + 3 packaging + AGENTS.md)
**Analogs found:** 10 / 10 (every code artifact has a live, verified analog)

All analogs below were re-confirmed against the live files this session — line numbers match RESEARCH.md. This is a "clone a verified existing pattern" phase: the high-value output is the per-file analog + the exact excerpt the planner cites in `read_first` / `acceptance_criteria`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| **NEW** `scripts/trace-render.ts` | render/utility | transform (notes → markdown) | `scripts/context-io.ts` `render()` (913-969) | exact |
| **NEW** `scripts/trace-freshness.ts` (name at discretion) | gate | transform + byte-compare (fail-closed) | `scripts/now-running-freshness.ts` (full) | exact |
| **NEW** `scripts/check-kit-refs.test.ts` | test | spawnSync + hermetic mirror | `scripts/now-running-freshness.test.ts` (full) | exact |
| **NEW** `scripts/trace-render.test.ts` | test | byte-reproducible render assert | `scripts/now-running-freshness.test.ts` | exact |
| **MOD** `scripts/check-kit-refs.ts` | gate | substring grep over SCAN set | self (Assertion 2, 158-180; ERE 69-71) | in-place edit |
| **MOD** `scripts/validate-agent-factory.ts` | gate/validator | existence + completeness check | self (FROZEN_HANDOFFS 136-153, 253-256; trace 428-469) | in-place edit |
| **MOD** `install/install.ts` | installer | file-I/O (backup/rename) | self (`backupIfDiffers` 563, `isoStamp` 193, seedState 1004-1011) | in-place edit |
| **MOD** `install/install.test.ts` | test | spawnSync install assertions | self (seed assert ~299-308, migrate cases ~568+) | in-place edit |
| **MOD** `scripts/check-uat-oracles.ts` | gate/oracle | parity-table assert | self (FROZEN_HANDOFFS 318) | in-place edit |
| **MOD** package.json | config | script wiring | self (`freshness:queue`, `freshness:context` lines) | in-place edit |
| **REWIRE** 18 roles + 16 workflows (`00`–`15`) + 3 packaging + AGENTS.md | role/workflow prose | n/a (markdown) | `agent-factory/workflows/16-context-read-write.md` (WF16) + workflows `17`/`18` | reference shape |

---

## Pattern Assignments

### NEW `scripts/trace-render.ts` (render, transform) — D-01

**Analog:** `scripts/context-io.ts` `render()` — verified lines **913-969**.

Clone this exact render shape: GENERATED header, deterministic sort (`at` lexicographic, `id` tiebreak), `cell()` pipe-escaping, single trailing newline via a trailing `""` push, `atomicWrite`.

```typescript
// scripts/context-io.ts:919-921 — the deterministic sort to clone
const ordered = [...all].sort((a, b) =>
  a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id),
);
// :935 — the GENERATED header (re-point the Re-run command to scripts/trace-render.js)
md.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/context-io.js render <task> -->");
// :940-947 — table header + cell()-escaped rows; :967 trailing "" → exactly one final "\n"
md.push("| at | kind | by | confidence | verified_by | note |");
md.push("| --- | --- | --- | --- | --- | --- |");
for (const n of live) { md.push(`| ${cell(n.at)} | ... |`); }
md.push("");
atomicWrite(join(taskDir, "index.md"), md.join("\n"));
```

**Phase-24 deltas (planner `<action>`):**
- Columns become **Requirement │ Code │ Tests │ UAT │ Release** (D-04), keyed by **ticket id** (the `validate-agent-factory.ts` key = filename without extension).
- Source the columns from the note **`refs`** field (D-06), not `index.md`'s `at/kind/by` columns.
- Write to `plans/traceability.md` (per-repo runtime state in `plans/`), NOT a `.grugops/context/<task>/` path.
- Reuse `readContext` to pull notes; reuse `cell()` for pipe-escaping; reuse the `isMain` CLI-entry guard (`context-io.ts:973-974`).
- **Clear professional voice** (trace surface, CLAUDE.md hard rule) — no caveman.
- **Discretion (A4/D-discretion):** new `scripts/trace-render.ts` is the recommended home over extending `context-io.ts` (matches the standalone-gate precedent). Planner may choose either.

---

### NEW `scripts/trace-freshness.ts` (gate, fail-closed) — D-03

**Analog:** `scripts/now-running-freshness.ts` — verified **full file (1-177)**. This is the `plans/`-rooted twin of the queue-rooted gate. Clone it almost verbatim, re-rooting `.grugops/queue/` → `plans/`.

```typescript
// now-running-freshness.ts:84  — realpath-resolved temp mirror (macOS /var symlink fix — KEEP IT;
//                                 the mirrored render's isMain check breaks without it)
const tmp = realpathSync(mkdtempSync(join(tmpdir(), "grugops-queue-fresh-")));

// :94-100 — greenfield vacuous pass (no source tree yet → exit 0 honestly, never fail)
if (!existsSync(claimedDir)) { cleanup(); console.log("... vacuous pass."); process.exit(0); }

// :119-128 — FAIL-CLOSED: a non-zero regen NEVER falls through to "fresh"
if (r.status !== 0) { ...; console.log("... refusing to report ... as fresh."); cleanup(); process.exit(1); }

// :150-157 — the byte-compare + STALE exit (name the file)
if (!committed.equals(rebuilt)) {
  cleanup();
  console.log(`STALE: ${relPath} — the committed render differs from a fresh regeneration ...`);
  process.exit(1);
}

// :170-175 — isMain entry guard; main() wraps every side-effecting statement (WR-04)
const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) { main(); }
```

**Phase-24 deltas:**
- Source of truth = the notes (via the `trace-render.ts` regen); committed file = `plans/traceability.md`.
- Greenfield vacuous pass = no notes / no `plans/traceability.md` yet → exit 0.
- Wire as its own **`freshness:traceability`** package.json script — NOT the committed-`.js` `freshness` kind (`traceability.md` is runtime state, not committed kit output) and NOT folded into `check-foundation-guards.ts`.
- Clear professional voice (safety/trace surface).

---

### NEW `scripts/check-kit-refs.test.ts` (test) — D-15 (gate is currently UNTESTED)

**Analog:** `scripts/now-running-freshness.test.ts` — verified **lines 1-70+** (the `spawnSync` + hermetic `CHECK_ROOT` mirror idiom).

`check-kit-refs.ts` has **no test today** (confirmed absent). Stand up this file as part of D-15. Drive the **committed `.js`** via `spawnSync` (never the `.ts`), plant fixtures in an mkdtempSync mirror.

```typescript
// now-running-freshness.test.ts:36-38 — drive the COMMITTED .js, not the .ts
const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "now-running-freshness.js");   // → scripts/check-kit-refs.js

// :40-48 — tracked temp dirs, afterAll cleanup
function freshTmp(prefix) { const d = mkdtempSync(join(tmpdir(), prefix)); tmpDirs.push(d); return d; }
afterAll(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }); });

// :58-70 — build a hermetic CHECK_ROOT mirror, plant the fixture, then:
// spawnSync("node", [GATE_JS], { env: { ...process.env, CHECK_ROOT }, encoding: "utf8" })
// assert r.status + r.stdout token
```

**Phase-24 test cases (D-15 both-direction, mandatory):**
- **GREEN:** clean rewired+deleted mirror → exit 0.
- **RED:** plant `agent-factory/handoffs/anything.md` ref into a SCAN-set file in the mirror → exit 1 naming the stray.
- **Backpressure:** flip applied but rewire incomplete → RED vs the committed `.js` (proves the change can't go green prematurely — Phase-23 WR-05 discipline).
- **Note:** `check-kit-refs.ts` reads its SCAN set via `abs(rel)` = `join(ROOT, rel)`, where `ROOT` is the script's own repo root — confirm the test either supplies a `CHECK_ROOT`-style override OR (if none exists) the planner adds one in the same change so the mirror is honored (the gate today has no `CHECK_ROOT` env hook — unlike the freshness gates). This is a real wiring task, flag it.

---

### MODIFIED `scripts/check-kit-refs.ts` Assertion 2 + ERE (gate) — D-13

**Self-edit.** Verified live: ERE **69-71**, Assertion 2 **158-180**, SCAN set **45-55**.

Current (the grep-to-zero flip target):
```typescript
// :69-71 — the 16-template ALLOW ERE to DROP entirely
const ALLOW = /agent-factory\/handoffs\/(architecture-handoff|business-handoff|...|sprint-plan)\.md/;

// :170-180 — Assertion 2 today: filter known-template lines out, what survives is a stray
const handoffHits = grepSubstring(SCAN, "agent-factory/handoffs/");
const stray = handoffHits
  .filter((line) => !ALLOW.test(line))
  .filter((line) => !line.includes("agent-factory/handoffs/`"))
  .filter((line) => !/agent-factory\/handoffs\/<template>\.md/.test(line))
  .join("\n");
if (stray === "") { pass("..."); } else { fail("non-template ... ref:\n" + stray); }
```

**Phase-24 flip (D-13):** drop the `ALLOW` ERE (and the two template-dir/placeholder filters). Assertion 2 becomes **"ZERO `agent-factory/handoffs/` refs in the SCAN set"** — `const stray = grepSubstring(SCAN, "agent-factory/handoffs/").join("\n")` with no filters; any hit FAILS. Keep the **explicit SCAN set** (45-55) — never a repo-wide grep (token economy, D-13). The flip lands INSIDE the deletion change (backpressure).

---

### MODIFIED `scripts/validate-agent-factory.ts` (validator) — D-04/D-14

**Self-edit. Two far-apart touch-points** (Pitfall 4 — don't only do one).

**Touch-point A — drop `FROZEN_HANDOFFS`** (verified 136-153 declaration; 253-256 existence loop):
```typescript
// :136-153 — the 16-name FROZEN_HANDOFFS array to DELETE
const FROZEN_HANDOFFS = ["universal-handoff", "business-handoff", ..., "sprint-plan"];
// :253-256 — the existence loop to DELETE
for (const h of FROZEN_HANDOFFS) {
  const rel = `agent-factory/handoffs/${h}.md`;
  if (!kitExists(rel)) err(`missing required handoff file: ${rel}`);
}
```

**Touch-point B — re-point the trace completeness check, do NOT remove it** (verified 428-469):
```typescript
// :434 — reads plans/traceability.md (UNCHANGED path — the render writes here)
const trace = stateRead("plans/traceability.md") || "";
// :463-467 — the per-ticket completeness WARNING (KEEP, re-pointed at the note-derived render)
const id = f.replace(/\.md$/, "");                  // ticket id = filename without extension
if (!trace.includes(id)) { warn(`${rel}: no traceability row for ticket "${id}"`); }
```
**Key (A2/D-04):** the file path and the ticket-id key are UNCHANGED; only the row *source* changes (notes via the render, not handoffs). The `trace.includes(id)` substring check still passes as long as the render emits ticket ids in its rows — so the validator edit is minimal. Confirm `trace-render.ts` emits ticket ids.

---

### MODIFIED `install/install.ts` (installer) — D-17..D-20

**Self-edit.** All primitives are in-file and verified.

**Primitives to reuse for `--migrate` (D-18/D-20):**
```typescript
// :193 — filesystem-safe ISO stamp (millisecond precision avoids routine collision, D-20)
const isoStamp = (): string => new Date().toISOString().replace(/:/g, "-");

// :201 — the TIGHT anchored backup-shape matcher (NOT a loose *.bak)
const GRUGOPS_BACKUP_SUFFIX = /\.bak\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z$/;

// :563-585 — the never-delete-first backup primitive
function backupIfDiffers(target, replacement, label): boolean {
  if (!existsSync(target)) return false;              // nothing to migrate → no-op (idempotent, D-20)
  if (identical) { report("skipped", `${label} (identical — no backup, D-09)`); return false; }
  const backup = `${target}.bak.${isoStamp()}`;
  if (DRY_RUN) { report("would-backup", `${label} → ${backup}`); return true; }
  renameSync(target, backup); report("backed-up", `${label} → ${backup}`); return true;
}
```

**Touch-point — remove the seedState `plans/handoffs/` mkdir** (verified 1004-1012, MUST remove so new installs never recreate it — MIGR-02):
```typescript
// :1004-1012 — DELETE this whole block
const handoffs = join(TARGET, "plans", "handoffs");
if (existsSync(handoffs)) { report("skipped", "plans/handoffs/ (target already has it — D-04)"); }
else if (DRY_RUN) { report("would-add", "plans/handoffs/"); }
else { mkdirp(handoffs); report("created", "plans/handoffs/"); }
```

**Phase-24 deltas (D-17/D-19, Pitfall 6 — EXTEND, don't collide):**
- `--migrate` flag already parsed (88-89) and `migratePreSteps()` (704+) already does v1.0→two-root layout migration. **Fold the handoffs-backup INTO the existing `--migrate` orchestration** (or as an added pre-step) — do NOT add a new `--migrate` branch.
- The migrate variant has **no `replacement`** (D-19 no content conversion) — a thinner `backupDir` that renames `plans/handoffs/` → `plans/handoffs.bak.<isoStamp()>` when the dir exists, **aborts with a clear message if the `.bak.<ISO>` name already exists** (D-18 never-clobber collision), else "nothing to migrate". Inherit DRY_RUN / idempotence / the anchored suffix from the existing machinery.
- Clear professional voice on all report/error strings.

---

### MODIFIED `install/install.test.ts` (test)

**Self-edit.** Verified touch-points per RESEARCH/A3:
- **~299-308:** an assertion that `plans/handoffs/` **IS** seeded → **invert** (assert it is NOT created on install).
- **~568+:** 8 existing `--migrate` cases → **extend** with the 4 D-18/D-20 handoffs-backup cases: backup, idempotent no-op, dry-run `would-backup`, never-clobber collision-abort. (Reversibility = assert README documents `.bak` dir + `git revert`.)

---

### MODIFIED `scripts/check-uat-oracles.ts` (oracle) — D-14 step 5

**Self-edit.** Verified line **318**:
```typescript
const FROZEN_HANDOFFS = ["implementation-handoff.md", "qe-handoff.md"];
```
This names handoff filenames in the A3 parity table (asserted 326-368). Adjust the oracle in lockstep so it no longer asserts against deleted artifacts. **Do NOT retire the oracle** — A3/DOG-02 equivalence retirement is **Phase 26**, out of scope; this phase only stops the oracle from referencing deleted files.

---

## Shared Patterns

### Deterministic, zero-token, freshness-gated render (the render-family)
**Source:** `scripts/context-io.ts render()` (913-969) → `scripts/now-running-freshness.ts` (the gate twin).
**Apply to:** `trace-render.ts` + `trace-freshness.ts`.
**Invariants:** GENERATED header; deterministic `at`-then-id sort; `cell()` pipe-escaping; single trailing newline; `atomicWrite`; `isMain` CLI-entry guard; greenfield vacuous pass; **fail-closed** (a non-clean regen NEVER reports "fresh").

### Atomic flip + both-direction adversarial proof vs the committed `.js` (the WR-05 discipline)
**Source:** Phase-23 WR-05 discipline; memory [[grugops-safety-invariant-green-suite-insufficient]].
**Apply to:** the `check-kit-refs.ts` Assertion-2 flip (D-13) inside the deletion change.
**Rule:** a green suite is NOT proof. Plant a `agent-factory/handoffs/` ref → RED vs the committed `.js`; clean kit → GREEN. Run the RED reproduction independently (orchestrator probe + code-review — the Phase-23 lesson that a logic-probe ≠ the input-surface code-review).

### Never-delete-first backup with collision guard (the installer-safety family)
**Source:** `install/install.ts` `backupIfDiffers` (563) + `isoStamp` (193) + `GRUGOPS_BACKUP_SUFFIX` (201).
**Apply to:** the `--migrate` handoffs-backup.
**Rule:** rename-to-backup, never delete-first; abort on `.bak.<ISO>` collision; DRY_RUN mutates nothing; idempotent no-op when absent.

### Reference, never restate (the single-source family) — D-10
**Source:** `agent-factory/workflows/16-context-read-write.md` (WF16); workflows `17`/`18` (already note-native — the reference shape).
**Apply to:** all rewired role Output sections + the 16 SDLC workflows (`00`–`15`) + 3 packaging templates + AGENTS.md.
**Rule:** roles **reference WF16**, never restate the note schema or name a raw `.grugops/...` write path. This is what keeps **`guard_context_writes` (WR-01) green** when its false-positive watch goes live on the rewritten prose (Pitfall 3). Output sections become "reference WF16; publish `decision`/`finding`/`artifact-ref` notes" — never an inline `.grugops/...` + write-token line. Emit **several one-kind-per-file notes** (D-08), never a renamed mega-note. **No directive naming a successor** (D-07) — advisory `finding`/`observation` is the only residue of the old relay.

### Explicit SCAN set, never a repo-wide grep (token economy) — D-13
**Source:** `check-kit-refs.ts` SCAN (45-55).
**Apply to:** the flipped Assertion 2. Keep the SCAN set as-is.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none — code) | — | — | Every code artifact has a live verified analog. |
| The markdown rewire (18 roles + 16 workflows + 3 packaging + AGENTS.md) | role/workflow prose | n/a | Not "code analogs" — prose. The reference shape is WF16 + the already-note-native workflows `17`/`18` (D-10). Planner uses the "reference, never restate" shared pattern above, not a code excerpt. |

**The 17th-template trap (Pitfall 1):** `frontend-handoff.md` is the 17th template, ABSENT from both `validate-agent-factory.ts` `FROZEN_HANDOFFS` (16 names) and `check-kit-refs.ts` ALLOW ERE (16 names). `rm` all **17** (incl. `frontend-handoff.md`); after deletion grep the kit for `frontend-handoff` to confirm zero orphans (`frontend-ui.md` + `14-ui-design-to-build.md` carry refs — verify removed in Stage 1).

**Fixtures (D-16):** delete the **8** `scripts/fixtures/*/agent-factory/handoffs/` dirs in the same atomic change + update consuming test expectations (`validate-agent-factory.test.ts`, `install.test.ts`).

---

## Metadata

**Analog search scope:** `scripts/` (context-io, now-running-freshness + .test, check-kit-refs, validate-agent-factory, check-uat-oracles), `install/` (install.ts, install.test.ts).
**Files scanned:** 7 live files read this session; all line numbers re-confirmed against RESEARCH.md.
**Pattern extraction date:** 2026-06-22

## PATTERN MAPPING COMPLETE

**Phase:** 24 - clean-handoff-removal-traceability-migration
**Files classified:** 10 code artifacts + the markdown rewire surface
**Analogs found:** 10 / 10 (code)

### Coverage
- Files with exact analog: 4 NEW (trace-render, trace-freshness, check-kit-refs.test, trace-render.test) — all cloned from `context-io.ts render` / `now-running-freshness.ts(.test)`
- Files with self-edit analog: 6 MODIFIED (check-kit-refs, validate-agent-factory, install.ts, install.test.ts, check-uat-oracles, package.json)
- Files with no code analog: the prose rewire (uses WF16 reference shape)

### Key Patterns Identified
- The render-family: GENERATED header + deterministic `at`/id sort + fail-closed byte-compare freshness gate (`context-io.ts render` → `now-running-freshness.ts` → new `trace-render.ts` + `trace-freshness.ts`).
- Atomic flip + both-direction adversarial proof vs the committed `.js` for the `check-kit-refs.ts` Assertion-2 grep-to-zero flip (the gate is currently untested — D-15 must stand up its first harness).
- Never-delete-first backup (`backupIfDiffers` + `isoStamp` + `GRUGOPS_BACKUP_SUFFIX`) folded into the EXISTING `--migrate` orchestration; remove the seedState `plans/handoffs/` mkdir (1004-1012).
- Reference-never-restate WF16 keeps `guard_context_writes` (WR-01) green on rewired prose.

### File Created
`.planning/phases/24-clean-handoff-removal-traceability-migration/24-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can cite the analog file + line-numbered excerpts directly in `read_first` / `acceptance_criteria`.
