# Phase 45: Traceability, build requests and architecture as input - Pattern Map

**Mapped:** 2026-11-26
**Files analyzed:** 30 (new and modified)
**Analogs found:** 29 / 30

All analog paths below were checked with `git ls-files` and are tracked source. None is an installed mirror under `tools/grugops/`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/build-request-model.ts` (new) | pure authority (parser) | transform | `scripts/board-model.ts` `parseTicketDocument` (l.965-1271) | exact |
| `scripts/build-request-model.test.ts` (new) | test | unit | `scripts/upstream-model.test.ts` | role-match |
| BR test-support builders (new, e.g. `scripts/build-request-fixture.test-support.ts`) | test support | fixture | `scripts/runnable-ref/upstream-fixture.test-support.ts` | exact |
| `scripts/upstream-git.ts` (new, extracted) | I/O authority | request-response (git spawn) | `scripts/runnable-ref/upstream.ts` l.852-1095 (moved code) | exact (it is the source) |
| `scripts/upstream-model.ts` (mod) | pure authority | transform | itself: `parseUpstreamConfig` l.175, `UPSTREAM_KEYS` l.43 | exact |
| `scripts/runnable-ref/upstream.ts` (mod: extraction + `requests` verb) | host runnable | batch read / report | its own `checkReport` l.1192 and `readReport` l.1224 | exact |
| `scripts/runnable-ref/state-check.ts` (mod) | host runnable | file-I/O, measure | its NFR folder path l.2689-2690, l.2267 | exact |
| `scripts/state-rules.ts` (mod) | pure authority | transform | `StateBudgets` l.95, `UNITS` l.175-181, `FileBudgetKey` l.323 | exact |
| `install/state-layout.ts` (mod) | config constants | n/a | `NFR_DIR_REL` l.102, `BUDGETS` l.179-206 | exact |
| `scripts/validate-agent-factory.ts` (mod) | validator | batch read | `upstream` arm l.849-878; budget call l.1075-1090 | exact |
| `scripts/generate-runnable-embeds.ts` (mod) | generator config | transform | upstream row l.434-465 | exact |
| `agent-factory/seed/memory-bank/plans/build-requests/.gitkeep` (new) | seed | file-I/O | `agent-factory/seed/memory-bank/plans/nfr/.gitkeep` | exact |
| `install/installer-cross-version.test.ts` (mod) + v3.0-shaped fixture under `install/fixtures/` (new) | test | integration | existing file; `install/fixtures/pre-v3-chess/` for layout only | role-match |
| `agent-factory/contracts/build-request.md` (new) | contract | doc | `agent-factory/contracts/upstream.md` | exact |
| `agent-factory/contracts/upstream.md` (mod) | contract | doc | itself (§ Declaration l.16, § Pin check l.126, § Reads l.159) | exact |
| `agent-factory/contracts/board.md` (mod) | contract | doc | § Ticket body sections l.146-155; § Budgets l.235-249 | exact |
| `agent-factory/workflows/20-upstream-sources.md` (mod) | workflow | procedure | itself (Steps l.21-36, Stop conditions l.49-55) | exact |
| `agent-factory/workflows/03-epic-to-tickets.md` (mod, step 8) | workflow | procedure | WF20 step 10 (ref form) | role-match |
| `agent-factory/workflows/09-daily-sweep.md` (mod) | workflow | procedure | its own step 7 (`blocked_escalation_days`) | exact |
| `agent-factory/workflows/17-task-claim.md` (mod, § Session start step 4) | workflow | procedure | WF20 steps 1-2 (run, then report each line) | role-match |
| `agent-factory/workflows/00-bootstrap-greenfield.md` (mod) | workflow | procedure | its own `default_stack` step | exact |
| `agent-factory/seed/memory-bank/50-decisions/ADR-template.md` and `memory-bank/50-decisions/ADR-template.md` (mod) | template | doc | itself, `## Status` l.15-17 | exact |
| `agent-factory/roles/{ba-pm,system-analyst,architect-design,designer,greenfield-mapper}.md` (mod, one line each) | role | doc | `agent-factory/roles/designer.md` l.17 ("... per Workflow 16.") | exact |
| `agent-factory/config/factory.config.md` (mod) | config doc | doc | its `upstream` sub-field table | exact |
| registration pins (counts in `check-foundation-guards.test.ts`, `install/mode-census.test.ts`, `check-imperative-lexicon.ts`, `check-banned-claims.ts`, `trace-instructions.test.ts`, `scripts/checkpoints.ts`, `validate.test.ts`, `state-check.test.ts`, read-site tests) | test/guard | config | RESEARCH § Registration checklist and § Pattern 7 table | exact (list) |
| `docs/audit/29-style-dispositions/45-NN.md` (new) | audit record | doc | prior `docs/audit/29-style-dispositions/44-*.md` | role-match |
| `upstream.js requests` verb ancestry/changed-ID logic | runnable | request-response (git) | none in tree for `merge-base`; follow `gitAnswer(..., allowed)` | partial (see No Analog) |

## Pattern Assignments

### `scripts/build-request-model.ts` (pure authority, transform)

**Analog:** `scripts/board-model.ts` l.965-1271.

**Closed key set + two-sided count** (l.972-986). Copy the shape:
```typescript
export const TICKET_KEYS = ["id","title","status","column","size","priority","epic","feature"] as const;
/** TWO-SIDED, and a change here is a decision recorded in the contract first. */
export const TICKET_KEY_COUNT = 8;
```
New: `BUILD_REQUEST_KEYS = ["id","status","source","pin","raised"] as const`, `BUILD_REQUEST_KEY_COUNT = 5`, `BUILD_REQUEST_STATUSES = ["open","carried","answered","withdrawn"]`, and a closed section list in D-05 order. Do not use the word `column` in this file (`NOT_A_SECOND_AUTHORITY` pin in `validate.test.ts`).

**Parse flow** (l.1204-1271): `normalizeDocument(text)` first, split on `\n`, find opening and closing `---`, then per line: blank skip, control-character refusal, `KEY_LINE` regex, unknown key, duplicate key.
```typescript
if (!(TICKET_KEYS as readonly string[]).includes(key)) {
  return ticketRefusal("unknown-key", spelled`line ${i + 1} carries the key \`${key}\`, which is outside the closed ticket key ` +
    spelled`set (${TICKET_KEYS.join(", ")}). ...`);
}
if (Object.prototype.hasOwnProperty.call(values, key)) {
  return ticketRefusal("duplicate-key", spelled`\`${key}\` is written twice, ...`);
}
```
Reuse the refusal code names verbatim; add `missing-key`, `bad-value`, plus section/History codes. Value checks import `UPSTREAM_SOURCE_ID_RE`, `UPSTREAM_OBJECT_ID_RE` (`scripts/upstream-model.ts`), `isCalendarDate` (export it from `scripts/state-rules.ts`), `isTicketId` (board-model).

**Sections:** use `unfencedHeadingIndices` (`scripts/frontmatter.ts` l.802) and `sectionEndIndex` (l.993). No private `## ` scan (foundation guard asks whether a module "builds a section bound").

**Purity:** state the no-I/O header like `scripts/upstream-model.ts` l.15 (`// NO I/O. ...`); `today` is a parameter for age derivations. Prefix all top-level names `buildRequest…`/`BUILD_REQUEST_…` (embed name collisions with `codeOf`, `listed`, `printable`).

---

### `scripts/upstream-git.ts` (I/O authority, git spawn)

**Analog / source:** `scripts/runnable-ref/upstream.ts` l.852-1095 — move `SourceUnknown`, `unknownBecause`, `gitEnv`, `GitRun`, `runGit`, `gitComplaint`, `gitAnswer`, `gitText`, `modesAtPin`, `blobText`, `gitAnswers`, `entryAtPin` unchanged, with the module global `root` (l.816) turned into a parameter.

**Scrubbed env** (l.860-870), move verbatim:
```typescript
function gitEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^GIT_/i.test(key)) env[key] = value;
  }
  env.GIT_NO_REPLACE_OBJECTS = "1";
  env.GIT_NO_LAZY_FETCH = "1";
  env.GIT_LITERAL_PATHSPECS = "1";
  env.GIT_TERMINAL_PROMPT = "0";
  return env;
}
```
**Launcher** (l.882-899): `spawnSync("git", ["-C", sourceReal, ...gitArgs], { shell: false, timeout: GIT_TIMEOUT_MS, maxBuffer: UPSTREAM_READ_MAX_BYTES * 4, env: gitEnv() })`. Switch `nodeChildProcess.spawnSync` to a named `import { spawnSync } from "node:child_process"` (embedding turns named imports into generated lines; the namespace import in upstream.ts then goes).

**Error handling** (l.928-938) — every failure is a named UNKNOWN, `allowed` statuses passed in. Ancestry uses this directly: `gitAnswer(src, ["merge-base","--is-ancestor",a,b], [0,1])`, after `rev-parse --is-shallow-repository` (shallow + exit 1 → UNKNOWN, never `not-descendant`).
```typescript
function gitAnswer(sourceReal: string, gitArgs: readonly string[], allowed: readonly number[] = [0]): GitRun {
  const run = runGit(sourceReal, gitArgs);
  if (run.errorCode === "ENOENT") unknownBecause("git was not found on PATH");
  if (run.errorCode === "ETIMEDOUT") unknownBecause(`git did not answer within ${GIT_TIMEOUT_MS / 1000} s`);
  ...
  if (!allowed.includes(run.status)) unknownBecause(`git ${sub} failed: ${gitComplaint(run, gitArgs)}`);
  return run;
}
```
No argv, no `process.exit`. New exports: `manifestAtCommit` (compare `entry_blob` only when `commit === source.commit`, else read `<commit>:<entry>` with the same regular-file/size/NUL/UTF-8/re-hash checks), `descends`, changed-ID blob facts via `ls-tree -r -z --full-tree`.

Tests that move: `scripts/runnable-ref/upstream.test.ts` EACCES injection site (44-12) and the subcommand set `["cat-file","config","ls-tree","rev-parse","version"]` (add `merge-base` only for `requests`).

---

### `scripts/upstream-model.ts` (pure authority, modified)

**Analog:** itself.
- l.43 `export const UPSTREAM_KEYS = Object.freeze(["sources"] as const);` → split allowed `["sources","escalation_days"]` from required `["sources"]`.
- l.175-183 `parseUpstreamConfig`: the message `upstream must be an object whose only key is "sources"` must change; `ok` result gains `escalationDays` (named default constant `10`). Follow the existing finding style: each finding names its key path (`upstream.escalation_days`).
- New pure `citationFindings({ sources, tickets, manifestAt })` taking the read as a parameter (RESEARCH Pattern 3 decision table); new `## Upstream` statement reader. Refs via existing `parseUpstreamRef` (l.455), `upstreamRef` (l.450), `objectFormatOf` (l.478).
- Text pins that move: `scripts/upstream-model.test.ts:146-152`, `scripts/validate.test.ts:4214` ("the allowed keys are: sources").

---

### `scripts/runnable-ref/upstream.ts` — `requests` verb (host runnable)

**Analog:** its own `checkReport()` l.1192 and `readReport()` l.1224: collect lines, one write at the end, exit 0/1/2 (2 when anything unknown/refused, never a pass). Root via `resolvedRoot()` l.800 and `rootChainPresence`; config via `configTextOrNull()` l.831; sources via `declaredSources()` l.1106; sibling skew via `siblingSkewLines()` l.1148. Print grammar-checked fields only (`printable` l.725). Line vocabulary: RESEARCH Pattern 5 table.

---

### `install/state-layout.ts` (constants)

**Analog:** l.102 `export const NFR_DIR_REL = \`${STATE_ROOT_REL}/nfr\`;` → add `BUILD_REQUESTS_REL = \`${STATE_ROOT_REL}/build-requests\`` with a doc comment. `BUDGETS` l.179-197:
```typescript
  /** UTF-8 bytes of each NFR `.md` file (8 KiB). */
  nfrBytes: 8_192,
```
→ add `buildRequestBytes: 8_192` the same way; `BUDGET_COUNT` l.206 `9` → `10` with a dated comment line.

### `scripts/state-rules.ts`

Add `buildRequestBytes` to `StateBudgets` (l.95 next to `readonly nfrBytes: number;`), `UNITS` (l.181 `nfrBytes: "bytes",`), and `FileBudgetKey` (l.323 `"ticketBytes" | "nfrBytes" | "traceBytes" | "progressBytes"`). Export `isCalendarDate`. Generated copies in `state-check.ts` (l.188, 242, 300, 392) refresh via `npm run generate:runnable-embeds`, not by hand.

### `scripts/runnable-ref/state-check.ts`

**Analog:** l.2689-2690:
```typescript
const nfrListing = listDirectory(NFR_DIR_REL);
const nfrFiles = directoryFindings(NFR_DIR_REL, "nfrBytes", nfrListing);
```
Add the same pair for `BUILD_REQUESTS_REL`/`"buildRequestBytes"`, then parse each file via `recordEntryNames(names)` (l.2267 pattern) through the non-blocking `readState`-style reader under a ceiling; no clock, no git.

### `scripts/validate-agent-factory.ts`

- **Config arm** l.866-878: the `upstream` arm already reports `parseUpstreamConfig` findings by `err(\`${rel}: ${finding}\`)`; `escalation_days` needs no new arm code, only the model change. Copy the "ACTIVE-WHEN-PRESENT, LENIENT-WHEN-ABSENT" comment shape (l.849-865) for the new citation arm.
- **Budget call** l.1080-1086: add `...directoryFindings(BUILD_REQUESTS_REL, "buildRequestBytes"),` to the `sortFindings([...])` list; import the constant in the block at l.122.
- **Citation/statement arms:** only when `upstream` is declared (zero git spawns otherwise). Read notes with `context-io.ts` readers + `currentState` over `CONTEXT_REL` and `CONTEXT_ARCHIVE_REL`. Put `UNKNOWN - verify` lines in a third list, never counted by `failed = errors.length + (STRICT ? warnings.length : 0)`.

### `scripts/generate-runnable-embeds.ts`

**Analog:** upstream row l.434-465 (`{ module, roots: [...] }` per authority, in dependency order). Insert `scripts/upstream-git.ts` after `upstream-model.ts`, then `scripts/build-request-model.ts`, before `runnable-stamp.ts`; add `BUILD_REQUESTS_REL` to the `install/state-layout.ts` roots. Same additions to the state-check row (l.206). `EMBED_SPEC_COUNT` stays 7.

### Seed `.gitkeep`

Copy `agent-factory/seed/memory-bank/plans/nfr/.gitkeep` (empty). Re-derive install counts (`INSTALLED_FILE_COUNT` 82 etc.), never bump by hand.

---

### `agent-factory/contracts/build-request.md` (new contract)

**Analog:** `agent-factory/contracts/upstream.md` — level-two sections per form (`## Declaration` l.16, `## The entry manifest` l.50, `## Refs` l.116, `## Pin check` l.126, `## Reads` l.159, `## Host access` l.215). Mirror: `## File`, `## Frontmatter`, `## Sections`, `## History`, `## Lifecycle`, `## Requests report`, `## Budget`. Forms here, procedure in WF20. State that `human:<name>` is a prose-tier record, not a security boundary. Registers: `GOVERNED_CORPUS_COUNT`, `BANNED_CLAIM_SCAN_COUNT`, `SCAN_SET_SIZE`; `npm run generate:catalog`.

### `agent-factory/contracts/board.md`

- § Ticket body sections l.146-155: "one of two level-two headings" → three; add `## Upstream`; amend "The body is never interpreted, so the grammar reads neither section." Existing bullet example to mirror:
  `- 2026-10-21, raised by Software Engineer: waiting on ADR-0007 (owner: Architect/Design)` → `- 2026-12-01, raised by BA/PM: waiting on build request BR-3 (owner: human carrier)`.
- § Budgets table l.241-249: add `| \`BUDGETS.buildRequestBytes\` | 8192 | UTF-8 bytes | each \`.md\` file in \`memory-bank/plans/build-requests/\` |` (compared both ways by `install/state-layout.test.ts`).

### `agent-factory/workflows/20-upstream-sources.md`

**Analog:** itself. Step form (l.23-36): `N. <Closed-list verb> ... (<role>).` e.g. step 12 `Record an \`observation\` note for each \`refused\` line (role). Open its body with \`Build-request:\`...`. Verbs from the closed list only (no "File", "Answer", "Carry", "Report"); sentences ≤ 25 words. Stop bullets (l.50-55) form `- <condition> → <action>.`; each new bullet moves `WORKFLOW_STOP_BULLET_COUNT` 55 in `scripts/checkpoints.ts` and stays untagged (floor stops). Floor-conflict rule (D-17) written here once. Update `## Done condition` l.63-64.

### Workflows 03, 09, 17, 00

- WF03 step 8: add the `upstream:` ref or the `## Upstream` / `none (build-internal)` line, pointing to WF20.
- WF09 step 7: per-bullet exemption from `blocked_escalation_days`; separate "upstream waits" line; one "an upstream wait counts in `Blocked time`" sentence. Update the `escalate_stale_blocker` stop bullet text.
- WF17 § Session start step 4: extend without changing sentences pinned by `scripts/flow-guidance-text.test.ts:443-470` (exactly 5 numbered steps).
- WF00: one step before the plan is drafted (D-15), `upstream` in Inputs.

### ADR templates (both)

`## Status` l.15-17: `<proposed | accepted | deprecated | superseded by ADR-YYYY>` → add `Accepted (upstream)` (match casing to the D-14 spelling; the two template copies already differ by one line, edit both).

### Five role pointer lines

**Analog:** `agent-factory/roles/designer.md` l.17 `- The product context and the architecture notes, pulled per Workflow 16.` and `ba-pm.md` l.26 `3. Break the work into epics, features and INVEST tickets per Workflow 02.` One line each pointing to Workflow 20. Byte headroom before WARN: ba-pm 172, system-analyst 134, architect-design 173, designer 49 (use `- Upstream input: Workflow 20.`), greenfield-mapper 136. Check with `node scripts/check-foundation-guards.js`.

## Shared Patterns

### Closed grammar, refuse the complement
**Source:** `scripts/board-model.ts` l.1204-1271; `scripts/upstream-model.ts` `upstreamKeyFindings`.
**Apply to:** BR parser, `escalation_days`, `## Upstream` statement, citation refs. Unknown keys refused by name with the allowed set quoted back.

### One hardened git read
**Source:** `scripts/upstream-git.ts` (extracted from `scripts/runnable-ref/upstream.ts` l.852-1095).
**Apply to:** validator citation check, `upstream.js check/read/requests`. No other `spawnSync("git", ...)` anywhere.

### Exit contract and report lines
**Source:** `scripts/runnable-ref/upstream.ts` `checkReport` l.1192; `checkExitCode` in `scripts/upstream-model.ts` l.543.
**Apply to:** `requests` verb. Exit 2 is never a pass; only grammar-checked fields printed.

### Paths and budgets through state-layout
**Source:** `install/state-layout.ts` l.102, l.179-206; `check:state-paths` forbids literals.
**Apply to:** every BR folder reference in TS.

### Section bounds
**Source:** `scripts/frontmatter.ts` `unfencedHeadingIndices` l.802, `sectionEndIndex` l.993.
**Apply to:** BR sections and ticket `## Upstream`.

### Synthetic upstream fixtures
**Source:** `scripts/runnable-ref/upstream-fixture.test-support.ts` (`makeUpstream`, `commitMore`, `cloneShallow`, `clonePartial`, `manifestPlus`, `recordingGitDir`, `treeDigest`).
**Apply to:** all git-backed tests; invented IDs only, no committed upstream.

## No Analog Found

| File / part | Role | Data Flow | Reason |
|---|---|---|---|
| `merge-base --is-ancestor` + shallow detection in `upstream-git.ts` | I/O authority | git request-response | No ancestry read exists in the tree; build on `gitAnswer(..., [0,1])` and RESEARCH Pattern 5 measured table |
| v3.0-shaped state fixture under `install/fixtures/` | fixture | n/a | `pre-v3-chess` is pre-v3, not v3.0; build from `git archive v3.0.0:agent-factory/seed` shape (skip loudly when tag absent) |

## Metadata

**Analog search scope:** `scripts/`, `scripts/runnable-ref/`, `install/`, `agent-factory/contracts/`, `agent-factory/workflows/`, `agent-factory/roles/`, `agent-factory/seed/`
**Files scanned:** ~20
**Pattern extraction date:** 2026-11-26
