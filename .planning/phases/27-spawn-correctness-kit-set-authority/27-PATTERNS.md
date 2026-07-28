# Phase 27: Spawn Correctness & Kit-Set Authority - Pattern Map

**Mapped:** 2026-07-28
**Files analyzed:** 18 distinct files/file-classes (5 new scripts, 17 generated adapters, 8 edited consumers, 20 edited kit markdown files)
**Analogs found:** 18 / 18 (every file in this phase has an in-tree analog — this phase invents no new mechanism)

Headline: **zero greenfield construction.** Every mechanism (filesystem derivation, mirror-spawn byte freshness, fence-aware scanning, strip-then-inject materialization, hermetic `CHECK_ROOT` plant-and-run testing) exists in the tree in working, tested form. Plans should be weighted toward *reading the consumer and its test before editing*, not toward writing machinery.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/kit-model.ts` (NEW) | utility / derivation module | file-I/O → transform | `scripts/generate-catalog.ts:107-159` (derivation) + `:44-47` (fail-closed) | exact |
| `scripts/kit-model.test.ts` (NEW) | test | batch | `scripts/generate-catalog.test.ts`, `scripts/check-foundation-guards.test.ts` | exact |
| `scripts/generate-role-adapters.ts` (NEW) | generator / build tool | file-I/O → transform → emit | `scripts/generate-catalog.ts` (whole file) | exact |
| `scripts/generate-role-adapters.test.ts` (NEW) | test | batch | `scripts/generate-catalog.test.ts` | exact |
| `scripts/adapters-freshness.ts` (NEW) | gate / freshness check | batch (mirror-spawn + byte compare) | `scripts/catalog-freshness.ts` (whole file) | exact |
| `scripts/dead-vocabulary.ts` (NEW, D-24) | shared constant module | — | `check-foundation-guards.ts` const blocks; imported like `./check-uat-oracles.js` at `:60-64` | role-match |
| `.claude/agents/grugops-<role>.md` × 17 (GENERATED) | adapter / config | request-response (system prompt) | `.claude/agents/grugops-orchestrator.md` + `agent-factory/packaging/subagent.frontmatter.md:26-55` | exact |
| `scripts/check-foundation-guards.ts` (EDIT: 4 sets derived) | guard aggregator | batch scan | in-file: `guardWr05():179`, `guardAdapterSize():251` | exact (self-analog) |
| `scripts/check-foundation-guards.ts` (NEW `guard_adapter_body`, SPAWN-05) | guard | batch scan | `guardWr05():179-212` (fence-aware, both-direction, explicit scan set) | exact |
| `scripts/check-foundation-guards.ts` (NEW KIT-03 oracle) | oracle | batch set-equality | `guardWr05()` cardinality check `:204-206` | role-match |
| `scripts/check-kit-refs.ts` (EDIT: SCAN/GH_SCAN/MARKER_SITES) | validator | batch scan | in-file `SCAN:45`, `MARKER_SITES:70`, `walk():93` | exact (self-analog) |
| `scripts/validate-agent-factory.ts` (EDIT: WORKFLOWS/ROLES) | validator | batch scan | in-file `kitListDir():81` (already readdir-based) | exact (self-analog) |
| `install/install.ts` (EDIT: derive + materialize ×17) | installer | file-I/O | in-file `materializeAdapter():969`, call site `:1285-1301` | exact (self-analog) |
| `install/uninstall.ts` (EDIT: mirrored derivation) | installer | file-I/O | `install/install.ts` derivation; in-file denylist guard `:100+` | role-match |
| `agent-factory/roles/*.md` × 17 (EDIT: `capabilities:`) | kit content | — | existing `kind:` / `tier:` frontmatter (`software-engineer.md:1-4`) | exact |
| `agent-factory/roles/orchestrator.md` (EDIT: trim + spawn text + depth) | kit content | — | `agent-factory/roles/security-nfr.md` (next-largest role, 4993B) as terseness exemplar | role-match |
| `agent-factory/packaging/subagent.frontmatter.md` (EDIT: template) | kit template | — | itself — it IS the upstream source of truth | exact |
| `agent-factory/packaging/adapters.md`, `agent-factory/README.md` (EDIT: SPAWN-07) | docs | — | guarded by `oracleWr05Wording` / `ASYM_TABLE_FILES` (`check-uat-oracles.ts:141,167`) | role-match |
| `package.json` (EDIT: `freshness:adapters`) | config | — | `"freshness:catalog": "tsc --outDir .tmp-build && node scripts/catalog-freshness.js"` | exact |

---

## Pattern Assignments

### `scripts/kit-model.ts` (NEW — utility, file-I/O → transform)

**Analog:** `scripts/generate-catalog.ts` (derivation rules at `:107-159`, fail-closed helper at `:44-47`, header conventions at `:1-33`).

**Header/provenance pattern** (`generate-catalog.ts:22-32`) — every script in `scripts/` opens with a block comment stating: purpose, invocation line, zero-dependency claim, path-traversal posture, fail-closed posture. Copy the shape:

```typescript
// Node stdlib ONLY — node:fs + node:path. ZERO npm dependencies. Invocation takes no arguments:
//
//   node scripts/generate-catalog.js    # exit 0 on success, 1 on any structural miss
//
// Read/write-only by construction (path-traversal mitigation, ASVS V12, mirrors both analogs):
// ROLES_DIR/WORKFLOWS_DIR/OUT are FIXED literal paths joined to the repo root (the script dir's
// parent). None is ever derived from argv, env, or file content.
```

**Imports pattern** (`generate-catalog.ts:34-41`) — stdlib only, fixed literal paths off `import.meta.dirname`:

```typescript
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const ROLES_DIR = join(ROOT, "agent-factory/roles");
const WORKFLOWS_DIR = join(ROOT, "agent-factory/workflows");
```

⚠️ **D-22 deviation:** `kit-model` takes `kitRoot` as an *explicit argument* (`listRoles(kitRoot)`), defaulting to the script-relative repo root. Do **not** add a fourth env-var root convention (the tree already has `CHECK_ROOT`, `VALIDATE_ROOT`, `VALIDATE_KIT_ROOT`).

**Core derivation pattern — LIFT VERBATIM** (`generate-catalog.ts:107-115` roles, `:148-159` workflows):

```typescript
// ── Read + parse roles (skip `_`-prefixed → D-03 drops _role-switch-protocol.md) ──────────────
let roleFiles!: string[];
try {
  roleFiles = readdirSync(ROLES_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort();
} catch {
  fail(`cannot read roles directory: ${ROLES_DIR}`);
}

// ── Read + parse workflows ────────────────────────────────────────────────────────────────────
  workflowFiles = readdirSync(WORKFLOWS_DIR)
    .filter((f) => /^\d{2}-.+\.md$/.test(f))
    .sort();
```

Return shape: **filenames WITH `.md`** (matches `generate-catalog.ts` usage and the two guards that build paths). `validate-agent-factory.ts` strips the extension at its own call site — Pitfall 8.

**Fail-closed pattern** (`generate-catalog.ts:44-47`) — but note the D-21 tier split: `kit-model` **throws** (it is a library, not a CLI), while the *guard* uses the aggregator's `fail()`:

```typescript
const fail = (m: string): never => {
  console.error(`  ERROR    ${m}`);
  process.exit(1);
};
```

**Frontmatter parse (needed by the generator, live in `kit-model` or lifted alongside)** (`generate-catalog.ts:50-59`) — the zero-dep parser. **Pitfall 7: it cannot read YAML lists.** `capabilities:` must be an inline scalar.

```typescript
function parseFrontmatter(text: string): Record<string, string> {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/); // fence at byte 0
  const fm: Record<string, string> = {};
  if (!m) return fm; // empty → caller treats as a fail-closed signal where a field is required
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}
```

---

### `scripts/generate-role-adapters.ts` (NEW — generator, file-I/O → transform → emit)

**Analog:** `scripts/generate-catalog.ts` — the whole file is the template. Six properties to copy:

1. **Fixed-literal `OUT`** (`:41`) — `const OUT = join(ROOT, "docs/catalog/README.md");`. Pitfall 6: never a `--out` flag. The freshness gate mirrors the world instead.
2. **Deterministic emit** (`:204-244`): build the entire `lines[]` array first, `lines.push("")` as the final element so `join("\n")` yields exactly one trailing newline, then a single `writeFileSync`. Byte-identical reruns are what the freshness gate depends on.
3. **Provenance header line** (`:205`):
```typescript
lines.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->");
```
4. **Build-everything-then-write** (`:30-32` comment): a structural miss `process.exit(1)` **without writing**, so a partial artifact never ships.
5. **Explicit sort for determinism** (`:196-201`) — sort before emit, never rely on readdir order.
6. **Section extraction for the `description`** (D-12) — reuse `sectionBody()` + `firstSentence()` verbatim (`:65-90`):

```typescript
function firstSentence(body: string): string {
  const line = body.trim().split("\n")[0].trim();
  const dot = line.indexOf(". "); // sentence boundary = period-space, KEEP its period
  return dot === -1 ? line : line.slice(0, dot + 1);
}

function sectionBody(text: string, heading: string): string | null {
  // `$(?![\s\S])` is TRUE end-of-input, not end-of-line — a bare `$` under /m truncates
  // a last-in-file section to its first line.
  const re = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=\\n## |$(?![\\s\\S]))`, "m");
  const m = text.match(re);
  return m ? m[1] : null;
}
```
Confirmed source data exists: `agent-factory/roles/software-engineer.md:6-7` (`## One job`) and `:25-26` (`## Activates when` → "Need code (one ticket).").

**Validation gate on `capabilities:` (ASVS V5, Pitfall 7):** assert non-empty and every token in a closed vocabulary at **build** time, using the `fail()` shape from `generate-catalog.ts:130-132`:
```typescript
  if (tier !== "core" && tier !== "enterprise") {
    fail(`${file}: role tier must be core|enterprise, found "${tier ?? ""}"`);
  }
```
Target vocabulary must map only into `{Read, Grep, Glob, Bash, Edit, Write, WebFetch, WebSearch, TodoWrite}` (background-subagent survivors, Finding F). Never `AskUserQuestion`.

---

### `.claude/agents/grugops-<role>.md` × 17 (GENERATED — adapter, request-response)

**Analog:** `.claude/agents/grugops-orchestrator.md` (live, 1938B) — but **generate from the template**, `agent-factory/packaging/subagent.frontmatter.md:26-55`, which already carries the corrected v2.0 memory wording. The live adapter's line 25 is the drifted text SPAWN-05 kills.

**Frontmatter pattern** (specialist — note `tools` OMITS `Agent`, the documented path-independent mechanism, Finding B):

```markdown
---
name: grugops-software-engineer
description: >-
  Implements a ready ticket on a branch under the grugops factory rules.
  Use when the request needs code for one ticket.
model: inherit
tools: Read, Grep, Glob, Bash, Edit, Write
---
```

**Coordinator frontmatter** (exactly one file; `coordinator: true` is a grugops-internal marker Claude Code ignores — `subagent.frontmatter.md:97-99`), from the live adapter `:2-6`:

```markdown
name: grugops-orchestrator
coordinator: true
tools: Agent(grugops-agents-md-scribe, …16 names…), Read, Grep, Glob, Bash, Edit, Write
model: inherit
```

**Body pattern — copy verbatim from the template `:33-44`** (this is the kit-vs-state blockquote + resolver block; the `MARKER` substring `If the kit dir is absent, STOP — do not hunt.` is what re-pointed `MARKER_SITES` checks, and the `MAT_SLOT` line is what `materializeAdapter()` injects above):

```markdown
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)

Resolve the kit root (this adapter is the sole resolver):

```sh
# 1. (installed) the absolute kit path the installer wrote above this line.
# 2. if absent, self-heal:
KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"
# 3. if "$KIT" still does not exist: STOP. Print:
#    "grugops kit not found at $KIT. Run node install/install.js (or node install/install.js --check) to install the kit."
#    Do NOT hunt the repo for agent-factory/… .
```
```

**Hard-limit echo — verbatim, clear voice, never caveman** (template `:53-54`, live adapter `:28`):
```markdown
Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy.
```

**D-08 body scope:** blockquote + resolver + "read `agent-factory/roles/<role>.md` and act as that role" + shared-verified-context memory sentence + hard limit. **Nothing role-specific.** Do NOT duplicate the factory read order (`.grugops/factory.config.json`, `AGENTS.md`, `plans/board.md`) into the 17 — that stays coordinator-only (live adapter `:21-23`).

**Size budget:** `guard_adapter_size` WARN 3072B / FAIL 4096B (`check-foundation-guards.ts:248-249`). Existing adapter is 1938B; the target shape is ~1.5–2.0 KB.

---

### `scripts/adapters-freshness.ts` (NEW — gate, batch)

**Analog:** `scripts/catalog-freshness.ts` — the whole file, near-verbatim.

**Mirror-spawn pattern** (`catalog-freshness.ts:42-77`):

```typescript
const ROOT = join(import.meta.dirname, "..");
const tmp = mkdtempSync(join(tmpdir(), "grugops-catalog-fresh-"));
function cleanup(): void { rmSync(tmp, { recursive: true, force: true }); }

mkdirSync(join(tmp, "scripts"), { recursive: true });
mkdirSync(join(tmp, "docs", "catalog"), { recursive: true });
cpSync(join(ROOT, "scripts", "generate-catalog.js"), join(tmp, "scripts", "generate-catalog.js"));
cpSync(join(ROOT, "agent-factory", "roles"), join(tmp, "agent-factory", "roles"), { recursive: true });
cpSync(join(ROOT, "agent-factory", "workflows"), join(tmp, "agent-factory", "workflows"), { recursive: true });

const r = spawnSync("node", [join(tmp, "scripts", "generate-catalog.js")], { encoding: "utf8" });
```
For adapters: also `cpSync` `scripts/kit-model.js` (the new import) and `agent-factory/packaging` into the mirror; `mkdirSync(join(tmp, ".claude", "agents"))`.

**Fail-closed-on-broken-generator** (`:79-88`) — a non-zero regen NEVER falls through to "fresh":

```typescript
if (r.status !== 0) {
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  console.log("Catalog freshness check FAILED: the generator did not run cleanly — refusing to report the catalog as fresh.");
  cleanup();
  process.exit(1);
}
```

**Byte-compare + unreadable-committed-file fail-closed** (`:90-114`):

```typescript
let committed: Buffer;
try { committed = readFileSync(join(ROOT, "docs/catalog/README.md")); }
catch { cleanup(); console.log(`Catalog freshness check FAILED: … could not be read — run \`npm run generate:catalog\` and commit it.`); process.exit(1); }
const rebuilt = readFileSync(join(tmp, "docs/catalog/README.md"));
cleanup();
if (!committed.equals(rebuilt)) { console.log(`STALE: … differs from a fresh regeneration.`); process.exit(1); }
```

**ADDITION over the analog (research-required):** `catalog-freshness.ts` compares a *single* file. The adapters gate must also assert the two directory listings are **set-equal**, or a stale orphan adapter (role deleted upstream) passes freshness because nothing regenerates over it.

**Wiring pattern** — standalone `package.json` script, never folded into the aggregator (D-07 precedent, stated at `catalog-freshness.ts:15-17`):
```json
"freshness:catalog": "tsc --outDir .tmp-build && node scripts/catalog-freshness.js"
```
→ add `"freshness:adapters": "tsc --outDir .tmp-build && node scripts/adapters-freshness.js"`.

---

### `scripts/check-foundation-guards.ts` — set derivation (EDIT, KIT-02)

**Self-analog.** The four literals to re-point: `WR05_SCAN:135`, `ADAPTERS:244`, `ROLE_FILES:282`, `CTX_WORKFLOWS:593`.

⚠️ **Pitfall 2 — scope every edit BY FILE PATH, never by identifier grep.** `WR05_SCAN` exists twice:

| File:line | Contents | Action |
|---|---|---|
| `check-foundation-guards.ts:135` | 4 kit/adapter files | **KIT-02's target — derive** |
| `check-uat-oracles.ts:110` | 4 `.planning/` tracking docs | **DO NOT TOUCH** — a currently-green Tier-1 oracle the aggregator imports (`check-foundation-guards.ts:60-64`) |

Consider renaming the guards-side constant to `SPAWN_GRANT_SCAN` in the same commit so the collision cannot recur.

**Current shapes to replace (`:244-247`, `:282-300`, `:593-611`):**
```typescript
const ADAPTERS = [
  ".claude/skills/grugops/SKILL.md",
  ".claude/agents/grugops-orchestrator.md",
];
const ROLE_FILES = [ "agent-factory/roles/agents-md-scribe.md", /* …17 hand-listed… */ ];
const CTX_WORKFLOWS = [ "agent-factory/workflows/00-bootstrap-greenfield.md", /* …16 of 19… */ ];
const CTX_SCAN = [...ROLE_FILES, ...CTX_WORKFLOWS];
```
Note `ROLE_FILES` feeds three guards (`guard_voice`, `guard_caveman_preserved`, `guard_role_size`) plus `CTX_SCAN` — one derivation, four downstream consumers. **Do NOT derive `roleCeiling():486`** (D-17; it already fails closed at `:540-542` on an unknown role).

**Root pattern to pass into `kit-model` (D-22)** — this guard already resolved its root at `:70-77`:
```typescript
const ROOT = process.env.CHECK_ROOT ? process.env.CHECK_ROOT : join(import.meta.dirname, "..");
const abs = (rel: string): string => join(ROOT, rel);
```
Call `listRoles(ROOT)` — do not let `kit-model` re-resolve.

**Reporting pattern (guards report what they checked, not a bare PASS)** — `:80-91`:
```typescript
const pass = (m: string): void => { process.stdout.write(`  PASS  ${m}\n`); };
const fail = (m: string): void => { process.stdout.write(`  FAIL  ${m}\n`); FAILS += 1; };
const warn = (m: string): void => { process.stdout.write(`  WARN  ${m}\n`); }; // does NOT increment FAILS
```
The Tier-2 count guard (D-21) uses `fail()` here, not a throw.

---

### `scripts/check-foundation-guards.ts` — `guard_adapter_body` (NEW, SPAWN-05)

**Analog:** `guardWr05()` at `:179-212` — it is already a both-direction, fence-aware, explicit-scan-set guard. Copy its skeleton exactly.

**Fence-aware scanning — REUSE, never write a second parser** (`:154-177`):
```typescript
function stripFencedBlocks(text: string): string {
  const out: string[] = [];
  let inside = false;
  for (const line of text.split("\n")) {
    if (/^```/.test(line)) { inside = !inside; continue; } // delimiter never emitted
    if (inside) continue;                                   // documentation, not live frontmatter
    out.push(line);
  }
  // Unterminated fence leaves `inside` set at EOF → the tail was already dropped. FAIL-SAFE.
  return out.join("\n");
}

function matchesOutsideFences(rel: string, re: RegExp): boolean {
  return stripFencedBlocks(readText(rel)).split("\n").some((l) => re.test(l));
}
```

**Both-direction accumulate-then-report pattern** (`:183-211`) — copy this exact shape for D-23 (ban dead vocabulary AND require the shared-context wording):
```typescript
  let wr05Fail = "";
  for (const f of WR05_SCAN) {
    if (!fileExists(f)) continue;
    const isCoordinator = matchesOutsideFences(f, WR05_COORDINATOR);
    const hasGrant = matchesOutsideFences(f, WR05_COMMA) || matchesOutsideFences(f, WR05_ARRAY);
    if (isCoordinator && !hasGrant) {
      wr05Fail += `\n${f}: coordinator carries no spawn grant — …`;
    } else if (!isCoordinator && hasGrant) {
      wr05Fail += `\n${f}: non-coordinator carries a spawn grant — rogue spawner …`;
    }
  }
  if (wr05Fail === "") { pass("WR-05: …"); } else { fail(`WR-05 coordinator-spawn-grant violation:${wr05Fail}`); }
```

**Grant-detection regexes to reuse for SPAWN-04** (`:127-134`) — both comma and YAML-array forms, both alias tokens:
```typescript
const WR05_COMMA = /^(tools|allowed-tools):.*\b(Agent|Task)\b/;
const WR05_ARRAY = /^[ \t]*-[ \t]*["']?(Agent|Task)\b/;
const WR05_COORDINATOR = /^coordinator:\s*true\b/;
```

**Cardinality check (the KIT-03 oracle's closest shape)** (`:204-206`):
```typescript
  if (coordinators.length !== 1) {
    wr05Fail += `\nexpected exactly one coordinator: true file in the scan set, found ${coordinators.length}…`;
  }
```

**D-25 scan set:** derived adapters (17 agents + 7 skills) **plus** `agent-factory/packaging/subagent.frontmatter.md`.

---

### `scripts/check-kit-refs.ts` (EDIT — validator, batch scan)

**Self-analog.** Three literals: `SCAN:45`, `GH_SCAN:61`, `MARKER_SITES:70`.

**The load-bearing exclusion-by-not-listing comment** (`:38-44`) — preserve this discipline; derivation replaces the *literal*, not the *scoping*:
```typescript
// Explicit SCAN path list — the D-08 "shipped kit + adapters + AGENTS.md". NEVER a repo-wide
// grep. By NOT listing them, this excludes scripts/fixtures/, agent-factory/examples/, …
// D-03 exclusion: agent-factory/seed/ is INTENTIONALLY NOT listed …
```

**`SCAN` minimal correct change (research #7):** the entry `".claude/agents/grugops-orchestrator.md"` (`:52`) becomes the directory `".claude/agents"` — the existing `walk()` at `:93-105` already recurses directories, so it self-derives with **no `kit-model` import at all**.

**`MARKER_SITES` (missed literal #11 — NOT on the CONTEXT.md work list)** at `:70-77`:
```typescript
const MARKER_SITES = [
  "AGENTS.md",
  "agent-factory/roles/orchestrator.md",
  ".claude/agents/grugops-orchestrator.md",
  ".claude/skills/grugops/SKILL.md",
];
const MARKER = "If the kit dir is absent, STOP — do not hunt.";
```
D-08 puts the blockquote in all 17 adapters → this list is stale by 15 the moment they land. Re-point in the same wave.

**Assertion 3 / `GH_SCAN` (Pitfall 4):** it is a **negative** scan — kit prose that must be FREE of `GRUGOPS_HOME`, excluding adapter dirs by omission. Nothing mechanically pins "three legal sites" (that claim lives only in the comment at `:57-60`). The 17 resolvers do not break it; fix the comment and restate the predicate as derived (D-07).

**Per-site check pattern to keep** (`:199-211`):
```typescript
let missing = "";
for (const site of MARKER_SITES) {
  if (!existsSync(abs(site))) { missing += ` ${site}(absent)`; }
  else if (!readText(site).includes(MARKER)) { missing += ` ${site}(marker-missing)`; }
}
```

---

### `scripts/validate-agent-factory.ts` (EDIT — validator)

**Analog:** its own `kitListDir()` at `:81-87` — already a safe, try/catch readdir under `KIT_ROOT`.

**Frozen literals to replace** — `WORKFLOWS:118` (14, stale by 5) and `ROLES:144` (16, missing `frontend-ui`). ⚠️ **Pitfall 8: these are basenames WITHOUT `.md`:**
```typescript
const WORKFLOWS = [ "00-bootstrap-greenfield", "01-bootstrap-brownfield", /* … */ ];
const ROLES = [ "orchestrator", "agents-md-scribe", /* … */ ];
```
`listRoles()` returns `orchestrator.md`. Strip the extension **at this call site**, and add a per-consumer assertion (D-19) pinning the shape.

**Two-root pattern to respect (do not add a fourth)** (`:53-68`):
```typescript
const STATE_ROOT = process.env.VALIDATE_ROOT ? resolve(process.env.VALIDATE_ROOT) : resolve(SCRIPT_DIR, "..");
if (!process.env.VALIDATE_KIT_ROOT) {
  console.error("  ERROR    VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)");
  process.exit(1); // the no-false-green guard (NO DEFAULT)
}
const KIT_ROOT = resolve(process.env.VALIDATE_KIT_ROOT);
```
Pass `KIT_ROOT` into `listRoles()`/`listWorkflows()`.

---

### `install/install.ts` (EDIT — installer, file-I/O)

**Self-analog.** `materializeAdapter()` at `:969-1016` needs **no redesign** — only its call site changes.

**Literals to replace** (`:481-490`):
```typescript
const SKILLS = ["grugops","grugops-map","grugops-plan","grugops-ticket","grugops-gate","grugops-uat","grugops-release"];
const AGENT_REL = ".claude/agents/grugops-orchestrator.md";
```
→ `readdirSync` self-derivation of `GRUGOPS_SRC/.claude/agents` and `…/.claude/skills` (D-18). **No `kit-model` import** — the installer stays self-contained.

**Current call site (`:1285-1301`) — 6 plain skill copies + 2 materialized resolvers:**
```typescript
for (const s of SKILLS) {
  if (s === "grugops") continue;
  linkOrCopy(join(GRUGOPS_SRC, ".claude","skills",s,"SKILL.md"), join(TARGET, ".claude","skills",s,"SKILL.md"), `.claude/skills/${s}/SKILL.md`);
}
materializeAdapter(join(GRUGOPS_SRC,".claude","skills","grugops","SKILL.md"), join(TARGET,".claude","skills","grugops","SKILL.md"), ".claude/skills/grugops/SKILL.md");
materializeAdapter(join(GRUGOPS_SRC, AGENT_REL), join(TARGET, AGENT_REL), AGENT_REL);
```
→ becomes a `readdirSync(agentDir).filter(f => f.endsWith(".md")).sort()` loop over `materializeAdapter` (all 17 are resolvers under D-06).

**`materializeAdapter()` strip-then-inject core to preserve verbatim** (`:986-1013`) — the bounded-removal CR-01 behavior is load-bearing:
```typescript
  let buf: string[] = [];
  for (const line of lines) {
    if (line === MAT_OPEN) { inblk = true; buf = []; continue; }
    if (inblk) { if (line === MAT_CLOSE) { inblk = false; } else { buf.push(line); } continue; }
    if (line === MAT_SLOT) { out.push(MAT_OPEN); out.push(`KIT="${KIT_ROOT}"`); out.push(MAT_CLOSE); out.push(line); continue; }
    out.push(line);
  }
  if (inblk && buf.length > 0) { for (const line of buf) out.push(line); } // unterminated → lose nothing
```

**Dry-run / report pattern to keep** (`:970-977`):
```typescript
  if (!existsSync(src)) { report("skipped", `${label} (source missing: ${src})`); return; }
  if (DRY_RUN) { report("would-materialize", `${label} (KIT=${KIT_ROOT})`); return; }
```

---

### `install/uninstall.ts` (EDIT — installer, file-I/O)

**Analog:** `install/install.ts` derivation + this file's own safety-denylist comment at `:100-109`.

⚠️ **Pitfall 5 — these are SEPARATE duplicated literals, not a code mirror** (`:87-88`):
```typescript
const SKILLS = ["grugops", "grugops-map", "grugops-plan", "grugops-ticket", "grugops-gate", "grugops-uat", "grugops-release"];
const AGENT_REL = ".claude/agents/grugops-orchestrator.md";
```
Editing only `install.ts` orphans 16 adapters.

**Ordering hazard:** derive the removal set from **`GRUGOPS_SRC`** (kit source), **before** the kit teardown, then **intersect** with what exists in the target and remove only the intersection. Deriving from the *target's* `.claude/agents/` would delete user-authored agent files — a data-loss bug against the CLAUDE.md "never delete user content" constraint.

**Existing safety posture to extend** (`:100-109`) — a denylist guard checked before every removal; keep `rmdirIfEmpty(.claude/agents)` so a user's own agents keep the directory alive. Add a regression fixture with `.claude/agents/my-own.md` asserting survival.

---

### `agent-factory/roles/*.md` × 17 (EDIT — `capabilities:` frontmatter, D-11)

**Analog:** existing frontmatter, `agent-factory/roles/software-engineer.md:1-4`:
```markdown
---
kind: role
tier: core
---
# Role: Software Engineer

## One job
Implement one ticket — pull the shared context first, make a small diff, add tests, run checks, and update docs. …
```
Add `capabilities:` as a third flat key. ⚠️ **Pitfall 7: inline scalar only** (`capabilities: read edit shell`), never a YAML list — `parseFrontmatter`'s `/^([A-Za-z_]+):\s*(.*)$/` would yield `""` and the generator would emit an empty `tools:`, which Claude Code v2.1.208+ refuses to launch **at runtime on a user's machine**.

**Verification obligation (A2):** `generate-catalog.ts` reads only `fm.tier` (`:129`), so `docs/catalog/README.md` should be byte-unchanged — **run `npm run freshness:catalog` to confirm, do not assume.**

---

### `agent-factory/roles/orchestrator.md` (EDIT — trim + spawn text + depth)

**Analog for terseness:** `agent-factory/roles/security-nfr.md` (4993B, the next-largest role; orchestrator is 1.5×).

**Ceiling source** (`check-foundation-guards.ts:489-490`) — the value is **never raised**:
```typescript
    case "orchestrator.md":
      return "7570 7165"; // +Phase-13 routing; measured 6759 B
```
Guard behavior at `:544-553`: `>= 7570` FAIL, `>= 7165` WARN, else PASS. Current 7562B = WARN, 8B from FAIL.

**Acceptance criterion (Pitfall 1):** `< 7165B` **after every Phase-27 edit**, not after the trim task. SPAWN-07's depth correction and D-04's capability-keyed rewrite both land in this same file and are net-positive in bytes. Budget ≥430B, target ≥480B.

**D-15 relocation trap:** `_role-switch-protocol.md` is NOT in `ROLE_FILES` (`:282-300`) and has no `roleCeiling()` case — moving text there is constraint-gaming. If anything is relocated, the destination enters `ROLE_FILES` with its own FAIL/WARN in the same commit.

---

### `agent-factory/packaging/subagent.frontmatter.md` (EDIT — the generator's upstream template)

**This file IS the analog** — it already carries the correct v2.0 memory wording that the live adapter lost. Compare:

| Source | Line | Text |
|---|---|---|
| Template `:50-51` | correct | "one window, drop prior context, **the shared verified context is the only memory** — require published notes from each" |
| Live adapter `:25` | **dead** | "one window, drop prior context, **the handoff is the only memory** — demand a handoff packet from each" |

D-23 split: `one window, drop prior context` is **kept** (execution topology); `the handoff is the only memory` / `handoff packet` is **banned**. A guard banning single-window prose would fail red on text deliberately kept.

**Coordinator-grant documentation to update for SPAWN-07** (`:100-104`) — already says "up to the depth cap" rather than a number, so **no numeric edit needed here** (blast-radius surface #4).

---

### `agent-factory/packaging/adapters.md` + `agent-factory/README.md` (EDIT — SPAWN-07)

**Analog / constraint:** `check-uat-oracles.ts` — `ASYM_TABLE_FILES:141`, `ASYM_SPAWN_WORDING:167`, `oracleWr05Wording:172`.

⚠️ **Pitfall 3** — the prohibition regex is deliberately broad:
```
/coordinator|parallel|concurren|fan-?out|dispatch[^|]*agent|(?<!no )\bspawn/i
```
The Claude Code row must carry spawn/coordinator wording; the four other CLI rows must not. Note `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` contains `SPAWN` and the regex is `/i` — naming the env var in a non-CC row fails the oracle. **Confine every edit to the CC row or to prose outside the table, and run `node scripts/check-uat-oracles.js` after the edit, not only at phase end.**

---

## Shared Patterns

### Fail-closed / no-vacuous-pass
**Sources:** `check-foundation-guards.ts:226-228` (missing-file fail-red), `catalog-freshness.ts:79-88` (broken generator ≠ fresh), `validate-agent-factory.ts:62-67` (no default kit root).
**Apply to:** every new script and every re-pointed set.
```typescript
  // Missing-file fail-red (CR-01): a deleted AGENTS.md must fail red, never vacuous-PASS.
  if (!fileExists("AGENTS.md")) { fail("AGENTS.md missing (required for Codex cap check)"); return; }
```
D-21 tier split: `kit-model` **throws** on vacuity (library, unsafe to continue); the aggregator **`fail()`s** on exact-count mismatch (safe to continue, CI red).

### Guards report what they checked
**Source:** `check-foundation-guards.ts:552`, `catalog-freshness.ts:116-118`.
**Apply to:** every guard and oracle added this phase — a `compared 0 adapters, 0 drift` line must be visible as the anomaly it is.
```typescript
      pass(`${f} ${b}B within ceiling`);
```
```typescript
console.log("Catalog fresh: docs/catalog/README.md matches a fresh regeneration.");
```

### Explicit scan sets, never repo-wide greps
**Sources:** `check-kit-refs.ts:38-44`, `check-foundation-guards.ts:124-125`, `:589-592`.
**Apply to:** every re-pointed set. Derivation replaces the *literal*, not the *scoping discipline* — a derived set is still a bounded set. Never widen `SCAN`/`GH_SCAN` to directories deliberately omitted (`agent-factory/seed/`, `examples/`, `install/`, `docs/`, `.planning/`).

### One authority per predicate
**Sources:** the `stripFencedBlocks()` reuse note (`check-foundation-guards.ts:142-153`); D-24's single dead-vocabulary export; D-22's no-fourth-root rule.
**Apply to:** `guard_adapter_body` (reuse the fence parser), `check-kit-refs` Assertion 2 + `guard_adapter_body` (one shared vocabulary list, two justified predicates — Assertion 2 greps the **path** `agent-factory/handoffs/`, line 25 contains no path).

### Hermetic `CHECK_ROOT` plant-and-run test harness
**Source:** `scripts/check-foundation-guards.test.ts:1-60` — spawns the **committed `.js`** (never the `.ts`) against a temp mirror.
**Apply to:** the KIT-03 RED-evidence test, `guard_adapter_body` both-direction cases, per-consumer derivation assertions (D-19).
```typescript
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, rmSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";
const ROOT = join(import.meta.dirname, "..");
const GUARD_JS = join(ROOT, "scripts", "check-foundation-guards.js");
// mirror inputs → mutate exactly ONE file → spawn with CHECK_ROOT=<mirror> → expect nonzero + named defect
```
⚠️ This harness's own `GUARD_INPUTS` array (`:40+`) is a hand-maintained 22-entry list of guard inputs — it must grow to cover the 17 adapters, or the mirror is incomplete. It is an unlisted instance of the same drift class.

### Clear professional voice in tooling
**Source:** `catalog-freshness.ts:33-34` — "Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a build-safety surface, never caveman voice)."
**Apply to:** every new script header and every finding string.

### Zero runtime dependencies / stdlib only
**Source:** every `scripts/*.ts` header. `package.json` net change this phase: **only the new `freshness:adapters` script entry.** A plan proposing `npm install` has escaped scope.

### `.ts` → committed `.js` twin
**Source:** `package.json` `"freshness": "tsc --outDir .tmp-build && node scripts/freshness.js"` — `scripts/freshness.ts` auto-walks the directory, so a new `.ts` without a committed `.js` fails red automatically. **Run `npm run build` after adding each new script.**

---

## No Analog Found

None. Every file in this phase has an in-tree analog. Two entries are close-but-not-identical:

| File | Role | Data Flow | Note |
|---|---|---|---|
| `scripts/dead-vocabulary.ts` (D-24) | shared constant module | — | No existing "shared constant module" file exists; the closest precedent is the cross-module import at `check-foundation-guards.ts:60-64` (`from "./check-uat-oracles.js"`). Follow that import shape. |
| KIT-03 oracle | oracle | set equality | Closest shape is `guardWr05()`'s cardinality check (`:204-206`); the three-way set equality itself is new logic, but the reporting/fence-aware/fail() scaffolding is fully reusable. `parseAgentGrant` MUST use `stripFencedBlocks()` — the packaging template shows a coordinator example inside a fence (`subagent.frontmatter.md:87-95`). |

---

## Metadata

**Analog search scope:** `scripts/`, `install/`, `agent-factory/roles/`, `agent-factory/packaging/`, `.claude/agents/`, `.claude/skills/`, `package.json`
**Files scanned:** 12 read in full or in targeted ranges (`generate-catalog.ts`, `catalog-freshness.ts`, `check-foundation-guards.ts` ×3 ranges, `check-kit-refs.ts`, `validate-agent-factory.ts`, `install.ts` ×3 ranges, `uninstall.ts`, `subagent.frontmatter.md`, `grugops-orchestrator.md`, `check-foundation-guards.test.ts`, `software-engineer.md`) + directory listings
**Pattern extraction date:** 2026-07-28
