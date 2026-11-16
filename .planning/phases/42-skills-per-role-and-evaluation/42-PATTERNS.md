# Phase 42: Skills per role and evaluation - Pattern Map

**Mapped:** 2026-11-16
**Files analyzed:** 16 (new and modified)
**Analogs found:** 15 / 16

All analog paths below are git-tracked source (checked with `git ls-files`). No mirror paths.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.planning/phases/42-.../42-EVALUATION.md` (new) | decision record | n/a (doc) | `.planning/phases/35-graph-memory-decision-record/35-DECISION.md` | exact (named by D-11) |
| `agent-factory/roles/designer.md` | role prompt | doc | `agent-factory/roles/software-engineer.md` (`## Levels`, `## Do less` between Responsibilities and Output) | role-match |
| `agent-factory/roles/frontend-ui.md` | role prompt | doc | same as above | role-match |
| other ratified roles (if any) | role prompt | doc | same as above | role-match |
| `agent-factory/roles/_role-switch-protocol.md` | protocol | doc | its own step 2 indented sub-lines (lines 16-18) | exact |
| `agent-factory/workflows/14-ui-design-to-build.md` | workflow | doc | its own step 1 (line 27) | exact |
| `AGENTS.md` | substrate | doc | `## Safety rules` bullets + `<!-- claim: C-28-018 -->` anchor (lines 97-104) | exact |
| `docs/skills.md` (new) | public doc | doc | `docs/GUARANTEES.md` (one-file named corpus part) | role-match |
| `scripts/check-public-docs-vocabulary.ts` | gate config | batch scan | its own `guaranteesMembers()` + `PUBLIC_DOCS_CORPUS_PARTS` (lines 450-488) and `PUBLIC_DOCS_SCAN_COUNT` (593) | exact |
| `scripts/check-banned-claims.ts` | gate config | batch scan | `BANNED_CLAIM_SCAN_COUNT = 128` (line 1560) | exact |
| `scripts/<role-skills-reader>.ts` (+ `.js`, new) | utility CLI | transform (roles dir -> one JSON line) | `scripts/check-foundation-guards.ts` `guardRoleFrontmatter()` (3686-3722) for the admit+read loop | role-match |
| `install/install.ts` (+ `.js`) doctor | installer doctor | request-response (stat/read, spawn) | its own `docReport` / `docWarn` (1479-1489), generator spawn (4838-4870), exit matrix (3055-3070) | exact |
| `install/host-tools.ts` (+ `.js`) skill-dir table | config/registry | static data | `HOST_TOOLS` (line 314+) | exact |
| `install/README.md` | doc | doc | the v2.1.293 floor text at ~2085-2093 | exact |
| `install/skills-doctor.test.ts` (new) | test | integration (spawned install.js) | `install/host-entries.test.ts` (lines 1-60) + `spawnBin` in `install/installer-paths.test-support.ts` (392-410) | role-match |
| `scripts/flow-guidance-text.test.ts` / new AGENTS-line occurrence test | test | unit | existing `section(ROLE_SWITCH, "The 5 steps")` at line 751 | exact |

## Pattern Assignments

### `42-EVALUATION.md` (decision record)

**Analog:** `.planning/phases/35-graph-memory-decision-record/35-DECISION.md`

Shape to copy (lines 1-40):
```markdown
# [v3.0, D-10] Graph memory: not adopted

**Recorded:** 2026-10-20 · **Requirements:** GRAPH-01, GRAPH-02 · **Tool facts:** as of 2026-10-20 from `.planning/research/STACK.md` section (d), not re-checked; confidence labels kept as written there.

## Decision
## Origin
## Tools evaluated (as of 2026-10-20)
| Tool | What it is | Runtime on host | Storage | License | Fits zero runtime deps and no database |
## Why it is not adopted
## What a user and a role may do
```
Adapt: header line names SKILL-02 and the pin date; matrix columns = Candidate / Install unit / Merge / Branching / Planning authority / Telemetry / Network / Runtime deps / Shape note / Verdict (whole plugin then per sub-skill, D-09). Keep `UNKNOWN - verify` labels on the row. Add a "Revisit triggers" section naming the two D-16 triggers, and a "Ratification" section left empty for the typed-name acceptance (D-15). Seed evidence from 42-RESEARCH.md "Evaluation evidence" table, re-read at the pinned SHA.

---

### Role files: `designer.md`, `frontend-ui.md` (+ any other ratified role)

**Analog for extra section placement:** `agent-factory/roles/software-engineer.md` — the only roles with non-standard `##` headings (`## Levels`, `## Do less`) put them between `## Responsibilities` and `## Output`. `scripts/check-role-rules.ts:832-843` (`ROLE_HEADING_ORDER`) enforces that slot.

**Frontmatter** (designer.md lines 1-5) — add one `skills:` line, nothing else:
```yaml
---
kind: role
tier: core
capabilities: read edit shell
skills: ui-ux-pro-max frontend-design   # only ratified names, bare kebab (D-03)
---
```
Grammar (scripts/canonical-frontmatter.ts:967-970): one line, single spaces, `^[a-z0-9]+(?:-[a-z0-9]+)*$`, no repeats, no quotes, no block list.

**Section shape to write** (D-04, D-07; compact, plain English):
```markdown
## Skills
| Situation | Skill | Without it |
|---|---|---|
| ... | ui-ux-pro-max | <role's own rule or checklist link> |
Record "used <skill>" or "<skill> not available; used fallback" in the note when a row applies. Never claim a skill ran. Precedence: AGENTS.md.
```
Byte limits (scripts/check-foundation-guards.ts:3524-3544): designer 2640 B now, FAIL 2957 / WARN 2799; frontend-ui 2996, FAIL 3356 / WARN 3176; software-engineer 17 B from WARN. Push `design-system/` detail into WF14 (Phase 40 D-05) or raise ceilings only via a named-human decision.

Designer hard rule (D-18..D-20, D-23): read `design-system/` only when ui-ux-pro-max is present; never write it; never run `--persist`/`--force`; if it disagrees with Designer notes, it wins and a note records the conflict.

---

### `agent-factory/roles/_role-switch-protocol.md`

**Analog:** its own step 2 sub-lines (lines 16-18):
```markdown
2. Read the role's file, `agent-factory/roles/<role>.md`, plus the shared verified context it needs.
   Pull that context on demand per Workflow 16 (`agent-factory/workflows/16-context-read-write.md`).
   Read nothing else: no other role's scratch, no scrolling back through the conversation.
```
Add ONE indented line under step 2 (Pitfall 6: `## The 5 steps` is pinned by `scripts/flow-guidance-text.test.ts:751`; do not add a step 6). Content: use a skill only if the host lists it (a listed `<plugin>:<name>` counts as `<name>`); otherwise take the role's fallback; never search the disk.

---

### `agent-factory/workflows/14-ui-design-to-build.md`

**Analog:** step 1 (line 27), the Designer step:
```markdown
1. Establish the design system once per product (Designer). ... Record the guidelines as typed `decision` and `artifact-ref` notes per Workflow 16. A newer Designer decision supersedes an older one through its `supersedes` field, per Workflow 16.
```
Append the `design-system/` sentences to step 1 (D-23: only here and in designer.md). Step 2 already says Frontend/UI reads tokens from Designer notes, so no Frontend rule.

---

### `AGENTS.md`

**Analog:** `## Safety rules` (lines 97-104):
```markdown
## Safety rules

<!-- claim: C-28-018 -->
- Do not read or expose secrets.
...
- Enforcement: the git host (branch protection, deployment environments) is the hard floor; ...
```
Add one precedence line (D-14). If it gets a claim anchor (Open Question 6), copy the `<!-- claim: C-28-0NN -->` form and register it in `docs/audit/28-claim-registry.md`. Size guard: WARN 20,480 B (now 8,582 B). Note Pitfall 8: target repos with their own AGENTS.md never receive this line.

---

### `scripts/check-public-docs-vocabulary.ts` + `scripts/check-banned-claims.ts` (join gates FIRST)

**Analog:** `guaranteesMembers()` (lines 450-461), fail-closed one-file part:
```ts
function guaranteesMembers(): string[] {
  if (!existsSync(abs(GUARANTEES_DOC))) {
    DERIVATION_REFUSALS.push(
      `${GUARANTEES_DOC} is a NAMED member of the public-docs scan set and does not exist at ` +
        `${abs(GUARANTEES_DOC)} — refusing to report a verdict over a part whose one member could ` +
        `not be read. A missing document is not a clean one`,
    );
    return [];
  }
  return [GUARANTEES_DOC];
}
```
Parts array (lines 480-488) — add `"skills"` to the name union and `{ name: "skills", members: skillsDocMembers() }`:
```ts
export const PUBLIC_DOCS_CORPUS_PARTS: readonly {
  name: "root" | "examples" | "kitReadme" | "guarantees";
  members: readonly string[];
}[] = [
  { name: "root", members: rootMarkdown() },
  ...
  { name: "guarantees", members: guaranteesMembers() },
];
```
Bump `PUBLIC_DOCS_SCAN_COUNT = 11` (line 593) and `BANNED_CLAIM_SCAN_COUNT = 128` (check-banned-claims.ts:1560) by one each, with a dated reason comment. Commit order: gate join (RED, "is a NAMED member ... does not exist"), then write `docs/skills.md` (GREEN).

---

### `docs/skills.md` (new public page)

**Analog:** `docs/GUARANTEES.md` (only for gate membership; content is hand-written). Contents per D-11/D-12: recommended skills only, `tag @ SHA` pins (never "latest"), install commands, per-host skill-path table (derived from or test-pinned to the host-tools table), "third-party code you vet yourself" notice, auto-update default note for the official marketplace, pointer to AGENTS.md for precedence (never restate). Plain English; no grug voice.

---

### `scripts/<role-skills-reader>.ts` (new committed reader the doctor spawns)

**Analog:** `scripts/check-foundation-guards.ts` `guardRoleFrontmatter()` (3686-3722):
```ts
const files = listRoleDirEntries(ROOT)
  .filter((f) => f.endsWith(".md"))
  .map((f) => `agent-factory/roles/${f}`);
...
const a = admitRole(text);
if (!a.ok) { fail(`${rel}: role frontmatter refused [${a.code}] ${a.reason} (TIER-07)`); continue; }
const s = roleSkillsOf(a.value);
if (!s.ok) { fail(`${rel}: role \`skills\` refused — ${s.reason} (TIER-07)`); continue; }
```
Imports: `admitRole` and `roleSkillsOf` from `./canonical-frontmatter.js` (618, 970); `listRoleDirEntries(kitRoot)` from `./kit-model.js` (825, takes a kit root argument). Take the roles root from argv (`process.argv.slice(2)`, as `check-role-rules.ts:1140`), and print exactly one JSON line `{ skills: { name: [roles] }, refusals: [...] }`. Use the `import.meta.url === pathToFileURL(process.argv[1]).href` entry check (as `scripts/check-banned-claims.ts:2890`) so tests can import it. Add a `.test.ts` beside it using `scripts/fixtures/role-skills.md` (already carries `skills: ui-ux-pro-max frontend-design`).

---

### `install/install.ts` doctor (advisory class, skill check, `claude --version`)

**Analog 1 — reporting helpers** (lines 1479-1489):
```ts
let DOC_FAILS = 0;
let DOC_WARNS = 0;
const docReport = (label: string, msg: string): void => console.log(`  ${label.padEnd(14)} ${msg}`);
const docWarn = (msg: string): void => { docReport("WARN", msg); DOC_WARNS += 1; };
```
Uncounted precedent: `docReport("reach", ...)` (2354, 2361), `docReport("note", ...)` (2372, 2973). Use `docReport("advisory", ...)`, never `docWarn` and never the literal label `WARN` (tests treat `^  (FAIL|WARN)\s` as counted; `install/kit-route.test.ts:854-855`).

**Analog 2 — exit matrix stays untouched** (3055-3070):
```ts
if (DOC_FAILS > 0) { console.log(`${DOC_FAILS} FAILURE(S)`); return 1; }
if (DOC_WARNS > 0 && STRICT) { console.log(`${DOC_WARNS} WARNING(S) (--strict: promoted to failure)`); return 1; }
```

**Analog 3 — spawning a committed script** (4842-4857):
```ts
// `process.execPath` rather than a bare launcher name, so there is no PATH or
// PATHEXT lookup ... NEVER a `shell` option, and no target-derived string appears in argv.
const child = spawnSync(process.execPath, [join(dir, "scripts", "generate-role-adapters.js")], {
  encoding: "utf8",
  env: process.env,
});
if (child.status !== 0) { /* fail closed, relay child's own message */ }
```
Script location: `GRUGOPS_SRC` (396-399): `process.env.GRUGOPS_SRC ? resolve(...) : resolve(SCRIPT_DIR, "..")`. Roles to read: `DOCTOR_KIT_ROOT` (621) + `roles`. Hosts: `doctorHosts(markerRead, ledgerRead)` (2013). Do not import from `scripts/` (header lines 12-18).

**Analog 4 — bounded user-file read:** `readUserFile(path, maxBytes)` in `install/user-file.ts:124` for `installed_plugins.json` and plugin `plugin.json`; unknown shape -> "cannot check", never "not found".

`claude --version`: `spawnSync("claude", ["--version"], { encoding: "utf8", timeout, shell: false, stdio: ["ignore","pipe","pipe"] })`, anchored `^(\d+)\.(\d+)\.(\d+)\b`, integer tuple compare to 2.1.293; ENOENT/EINVAL/unparsable -> "cannot check". This is a new PATH exec surface (no existing analog with PATH lookup — record in threat model).

---

### `install/host-tools.ts` per-host skill-dir table

**Analog:** `HOST_TOOLS` (line 314+), keyed by `id`:
```ts
export const HOST_TOOLS: readonly HostTool[] = [
  {
    id: "claude",
    name: "Claude Code",
    ...
```
Add a sibling `HOST_SKILL_DIRS: Readonly<Record<HostTool["id"], { project: string[]; user: string[]; plugins: "claude-installed-plugins" | "unknown" }>>` with values from 42-RESEARCH.md "Per-host skill discovery" (Antigravity user dirs under `~/.gemini/...`; OpenCode adds `.opencode/skills`, `~/.config/opencode/skills`). Print `host.name` or `host.id`, not `claude-code`. Two-way pin test (every HOST_TOOLS row has an entry and vice versa), like `HOST_TOOL_COUNT` usage in `install/host-entries.test.ts`.

---

### `install/skills-doctor.test.ts` (new)

**Analog:** `install/host-entries.test.ts` (header comment lines 1-17, imports 20-27, `scratchRow()` 34-43, `check()` 47):
```ts
const ROOT = mkdtempSync(join(tmpdir(), "ghentries-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));
const check = (target: string, kitHome: string): Run => spawnBin(INSTALL_JS, ["--check"], target, kitHome);
```
`spawnBin` (installer-paths.test-support.ts:392-410) inherits `process.env` and sets `HOME` only with `opts.home` — always pass a scratch `home` and override `PATH` (fake `claude` script) and unset `CLAUDE_CODE_PLUGIN_CACHE_DIR`/`XDG_CONFIG_HOME` (Pitfall 9); may need a small `env` extension to `RunOptions`. Cover both plugin layouts (`skills/` and `./.claude/skills/` via `plugin.json`), exit code unchanged with `--strict`, and the fs census unchanged (`install/installer-fs-census.test.ts`).

## Shared Patterns

### Fail closed, never fabricate
**Source:** `guaranteesMembers()` (check-public-docs-vocabulary.ts:450-461), generator spawn (install.ts:4859-4870)
**Apply to:** reader script, doctor skill check, version probe, gate join. Unknown -> "cannot check" / `UNKNOWN - verify`, never a false pass or false WARN.

### One parser, no second spelling
**Source:** `roleSkillsOf` (canonical-frontmatter.ts:970); spawn-not-import rule (install.ts:803-821 comment)
**Apply to:** doctor and any new guard. install/ spawns the committed reader; it never regexes `skills:`.

### Derived counts with two-sided pins
**Source:** `PUBLIC_DOCS_SCAN_COUNT`, `BANNED_CLAIM_SCAN_COUNT`, `ENTRY_COUNT` (host-entries.test.ts:54-58, with dated bump comments)
**Apply to:** scan-count bumps, host skill-dir table, count of roles declaring skills.

### Committed `.js` freshness
**Apply to:** every `.ts` change in `scripts/` and `install/`: `npm run build`, commit the `.js`, run the freshness/build-parity gates.

### Role text voice and budget
**Apply to:** all role/protocol/WF14/AGENTS edits: plain compact English; check `node scripts/check-foundation-guards.js` and `node scripts/check-role-rules.js` before commit.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `claude --version` probe inside `install/install.ts` | doctor probe | external exec via PATH | Every existing installer spawn uses `process.execPath`; no PATH-resolved exec exists. Use RESEARCH.md "`claude --version` probe" section. |

## Metadata

**Analog search scope:** `agent-factory/roles/`, `agent-factory/workflows/`, `AGENTS.md`, `scripts/`, `install/`, `.planning/phases/35-*`
**Files scanned:** ~20
**Pattern extraction date:** 2026-11-16
