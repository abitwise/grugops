# Architecture Research: v3.1 integration (upstream sources, build requests, consultant, one-command install)

**Domain:** file-based agent factory (markdown kit + TypeScript tooling compiled to committed `.js`)
**Researched:** 2026-11-24
**Confidence:** HIGH for integration points (every path below was read in the repository on 2026-11-24); MEDIUM for the recommended shapes (they are design proposals that need the human's naming decisions); `UNKNOWN - verify` items are marked inline.

Scope: only the seven v3.1 features. The upstream system is described generically as "an upstream design system" that produces an approved design package with stable IDs in ledgers (decisions, questions, sources) and a named human who decides.

---

## Standard Architecture

### System overview (v3.1 additions marked `+`)

```
                          HUMAN (decides; carries build requests across; edits the pin)
                               │                         ▲
            edits pin in       │                         │ reads BR files, answers upstream
     .grugops/factory.config.json                        │
                               ▼                         │
┌───────────────────────────── KIT (read-only, <kitRoot>/…) ───────────────────────────────┐
│ roles/orchestrator.md  roles/ba-pm.md  roles/system-analyst.md  roles/architect-design.md │
│ roles/designer.md  roles/greenfield-mapper.md  + roles/consultant.md                      │
│ workflows/16 (notes)  17 (claim+flow, + pin check at session start)                       │
│ + workflows/19-consult.md   + workflows/20-upstream-sources.md                            │
│ contracts/board.md (+ Awaiting Upstream column)  + contracts/upstream.md                  │
│ config/factory.config.md (+ `upstream`, + `consult` keys)                                 │
└──────────────────────────────────────────────────────────────────────────────────────────┘
        │ role text (pointers only)                      │ procedure
        ▼                                                ▼
┌──────────────── STATE (target repo, read/write) ─────────────────┐   ┌── + UPSTREAM (read-only, third root) ──┐
│ .grugops/factory.config.json  (+ upstream.sources[] pins)        │   │ <path>/  manifest entry file + docs     │
│ .grugops/context/<task>/notes/  (claim/observation answers)      │◄──┤ pinned by commit + blob hash           │
│ .grugops/queue/{pending,claimed,done}  (+ consult subtasks)      │   │ read in place, never copied, never     │
│ memory-bank/plans/board.md  (+ ## Awaiting Upstream column)      │   │ written by grugops                     │
│ memory-bank/plans/tickets/<ID>.md                                │   └────────────────────────────────────────┘
│ + memory-bank/plans/build-requests/BR-<n>.md                     │                ▲
│ memory-bank/plans/traceability/  (+ upstream: refs → Requirement)│                │ git rev-parse / hash-object
└──────────────────────────────────────────────────────────────────┘                │
        ▲ host runnables (tools/grugops/*.js, generated embeds)                     │
        │ note.js  claim.js  state-check.js  state-roll.js  trace-render.js  + upstream.js ─┘

INSTALL PATH:  + one command (e.g. npx <pkg>@<ver>)  →  + install/cli.js dispatcher  →  install/install.js (unchanged contract)
```

### Component responsibilities (new and modified)

| Component | Status | Responsibility | Implementation |
|-----------|--------|----------------|----------------|
| `agent-factory/contracts/upstream.md` | NEW | Authoritative schema: the `upstream` config block, the pin, the upstream ref grammar (`upstream:<source>:<id>@<commit>`), the build-request file grammar, the "third root" rule | Markdown contract, same style as `contracts/board.md` and `contracts/context-note.md` |
| `scripts/upstream-model.ts` | NEW | One authority for the config-block shape, the ref grammar predicate and the pin comparison | TS module, imported by the validator and embedded into the host runnable |
| `scripts/runnable-ref/upstream.ts` → `tools/grugops/upstream.js` | NEW | Host pin check: `check` verb exits 0 (pins match), 1 (drift, one line per source), 2 (could not run, e.g. no git) | Host runnable with a generated embed region, like `note.ts` / `state-check.ts` |
| `agent-factory/workflows/20-upstream-sources.md` | NEW | Procedure: read in place, pin check, cite upstream IDs, raise a build request, answer a build request from a new pin, architecture-as-input | Workflow with the eight `WORKFLOW_SECTIONS` |
| `agent-factory/workflows/19-consult.md` | NEW | Consultant procedure: CONSULT request note, Orchestrator-only dispatch, sources-first order, upstream-scope → build request, panel mode, dial | Workflow |
| `agent-factory/roles/consultant.md` | NEW | ~2 KB parameterized role (topic + lens), advisory only | Role with the nine `ROLE_SECTIONS` in order |
| `memory-bank/plans/build-requests/` | NEW (state dir) | One file per build request | Seed `.gitkeep`, path constant, byte budget |
| Board column `Awaiting Upstream` (name TBD) | NEW | Visible status of a ticket parked on a build request | Unlimited heading form, outside the flow |
| `trace-model.ts` `classifyRef` | MODIFIED | Route `upstream:` refs to the Requirement column; reserve `BR` prefix | One rule + `RESERVED_PREFIXES` entry |
| `validate-agent-factory.ts` | MODIFIED | Form-check `upstream` and `consult` keys; budget the BR directory | Presence-guarded checks in `checkConfigForm`; `directoryFindings` call |
| Orchestrator, BA/PM, SA, Architect, Designer, Greenfield Mapper roles | MODIFIED | One pointer line each (byte-budget bound) | Detail lives in WF19/WF20 |
| WF00, WF02, WF03, WF04, WF09, WF16, WF17 | MODIFIED | Steps that cite upstream, park/unpark tickets, run the pin check, list the new column | Workflow text |
| `install/cli.ts` → `install/cli.js` | NEW | One-command entry: dispatches `install` / `uninstall` / `--check` / `--migrate` / `--update` to the existing binaries | Tiny Node dispatcher with a shebang |
| `package.json` (or a publish manifest) | MODIFIED | `bin`, `files` allowlist, version agreement with `agent-factory/VERSION` | Depends on the mechanism the STACK research picks |

---

## Integration map, feature by feature

Every path below exists today unless it is marked NEW.

### Feature 1: Declared upstream sources (config key, pin, read in place, pin-drift report)

**Config.**
- `agent-factory/config/factory.config.md` § Fields: add one row for the new key (name TBD; `upstream` used below), plus a `### upstream sub-fields` table, a row in § Config-dial contract (lean → enterprise), and the key added to the § Zero-config defaults enumeration ("A missing key is never an error"). Absent = no upstream; every role runs as today.
- Proposed shape (MEDIUM, needs the human's names and the upstream manifest format first):
  ```json
  "upstream": {
    "sources": [
      { "name": "design", "path": "upstream/design", "commit": "<40-hex>",
        "entry": "manifest.md", "blob": "<40-hex>" }
    ]
  }
  ```
- Do NOT add the key to `agent-factory/config/factory.config.json` or `agent-factory/seed/.grugops/factory.config.json`. The two are byte-identical (`agent-factory/README.md` claim C-28-031) and both carry the lean baseline, where the block is absent.
- `scripts/validate-agent-factory.ts` `checkConfigForm()` (line ~675): add an `if ("upstream" in cfgObj)` arm. It follows the file's stated contract: active when present, lenient when absent; an invalid present value is `err()`; an unknown sub-key is refused by name (the `checkpoints` arm's precedent). The shape predicate itself lives in NEW `scripts/upstream-model.ts`, so the validator and the host runnable read one authority (the repository's "one authority per predicate" rule, see `scripts/generate-runnable-embeds.ts` header).
- Tests that pin the config reference will move: `scripts/config-governance-consistency.test.ts`, `scripts/config-queue-consistency.test.ts`, `scripts/validate.test.ts`, `scripts/floor-invariance.test.ts`, `install/install.test.ts` all read `factory.config.md` (grep 2026-11-24).

**Pin check (drift report).**
- NEW host runnable `scripts/runnable-ref/upstream.ts`, compiled to `.js`, installed as `tools/grugops/upstream.js`. Verbs: `check` (required). It reads `.grugops/factory.config.json`, and per source runs `git -C <path> rev-parse HEAD`, `git -C <path> rev-parse <commit>:<entry>` (must equal `blob`), and `git -C <path> status --porcelain -- .` (in-place reads are only the pinned content when HEAD equals the pin and the tree is clean). Exit contract copied from `note.ts`'s D-12 contract: 0 match, 1 drift (one `drift <source>: …` line each), 2 could not run (no git, path missing, config unreadable). Exit 2 is never a pass.
- Precedent for spawning a child process in a runnable: `scripts/runnable-ref/host-protection.ts` (`spawnSync("gh", …)`) and `uat-spec-integrity.ts` (`spawnSync("npx", …)`).
- Embed: add a row to `EMBED_SPECS` in `scripts/generate-runnable-embeds.ts` with `scripts/upstream-model.ts` roots and `install/state-layout.ts` `GRUGOPS_DIR_REL`. This adds `upstream.js` to `RUNNABLE_SET` and changes `RUNNABLE_SET_STAMP` in all five existing runnables (`claim.js`, `note.js`, `state-check.js`, `state-roll.js`, `trace-render.js`). `state-check` reports `runnable-version-skew` on a host until re-install, which is the intended behavior.
- Installer: `install/install.ts` copies runnables to `tools/grugops/` (grep shows one site per runnable name). Add `upstream.js`; uninstall reverses through `install/kit-source.ts`. Measured install pins move (`WRITE_PATH_COUNT`, `INSTALLED_FILE_COUNT`, `REMOVABLE_COUNT` and similar, per the Designer commit 3fcb4683 body).
- Where the Orchestrator runs it: `agent-factory/workflows/17-task-claim.md` § Session start gets one step ("when `upstream` is set, run `node tools/grugops/upstream.js check`; on exit 1 name each drifted source and do not dispatch a role that reads that source"). WF17 is the Orchestrator's flow home and is not in the role byte budget. `orchestrator.md` needs only the key name added to its `## Reads` config list.

**Read in place.**
- `AGENTS.md` § Kit vs state names two roots (KIT and STATE, claims C-28-015 and C-28-016). The upstream source is a third root: read-only, never written, never copied into `memory-bank/`. Add it as a separate short line rather than editing the anchored invariant paragraph; editing C-28-015/016 requires updating `docs/audit/28-claim-registry.md` verbatim blocks, and `LEGACY_FALLBACK_CLAUSE` in `install/state-layout.ts` mirrors part of that text.
- Recommendation (MEDIUM): `path` must be repository-relative, so the source sits inside the target repository (a git submodule, or a checkout directory the repo ignores). Reason: OpenCode needed an installer-written `permission.external_directory` rule just to read the kit outside the repo (CLAUDE.md § Per-tool entry files, 34.1 D-14), and Claude Code prompts for reads outside the project. A submodule also carries its own commit pin (the gitlink), which the pin check can cross-read. An absolute path outside the repo is `UNKNOWN - verify` per host.

### Feature 2: Traceability to upstream IDs

- Tickets cannot carry upstream IDs in frontmatter: `agent-factory/contracts/board.md` § Ticket documents closes the ticket frontmatter at exactly eight keys and refuses a ninth by name. Upstream IDs therefore travel on note `refs`, the existing trace substrate (`contracts/context-note.md` § provenance fence; `scripts/trace-model.ts` `buildTraceRows`).
- **Critical ref-shape problem (HIGH, verified in code):** `scripts/board-model.ts` `TICKET_ID = /^[A-Z][A-Z0-9]{0,15}-\d{1,9}$/`. A raw upstream ID such as `DEC-012` or `Q-014` passes `isTicketId`, so `trace-model.ts` `isTicketRef` would treat it as a ticket and `trace-render.js` would create a bogus `traceability/DEC-012.md` row. A namespaced ref with a slash (`upstream:design/DEC-012`) is routed to the **Code** column by `isCodeRef` (any ref containing `/`). Both are wrong.
- Fix: a grammar `upstream:<source>:<id>@<commit7-40>` (no slash; colon-separated), recognized by a predicate in `scripts/upstream-model.ts`, and one rule at the top of `classifyRef` in `scripts/trace-model.ts` that returns `"Requirement"` for it. Recommendation: reuse the Requirement column rather than adding an `Upstream` column to `TRACE_COLUMNS`. A new column changes every rendered trace file (each gains `## Upstream` / `None recorded.`), so every host trace becomes stale against a fresh render and `npm run freshness:traceability` moves. The Requirement column already means "where this ticket's requirement came from".
- Add `BR` to `RESERVED_PREFIXES` in `trace-model.ts` so a build-request id on a ref (`BR-3`) is a Requirement link, never a ticket row. (`BR-3` passes `isTicketId` today.)
- Regenerate: `trace-model.ts` is embedded in `state-check.ts` and `trace-render.ts` (`EMBED_SPECS` rows at lines ~248 and ~289), so `npm run generate:runnable-embeds` and the stamp move. Do this in the same phase as Feature 1's embed row to move the stamp once.
- Role text: `ba-pm.md` § Trace updates gains "and the upstream refs" (a few bytes). WF02/WF03 steps name the ref grammar by pointing at WF20.

### Feature 3: Build requests (file type, board status, blocked until a new pin, answer as a `claim` note)

**File type.**
- NEW `memory-bank/plans/build-requests/BR-<n>.md`. NEW constant `BUILD_REQUESTS_REL = \`${STATE_ROOT_REL}/build-requests\`` in `install/state-layout.ts` (the constants-only path authority; `scripts/check-state-paths.ts` and `state-path-scan.ts` read paths from it). NEW seed `agent-factory/seed/memory-bank/plans/build-requests/.gitkeep` (precedent: `plans/archive/.gitkeep`, `plans/nfr/.gitkeep`).
- Budget: NEW key in `BUDGETS` (`install/state-layout.ts` line 179), e.g. `buildRequestBytes: 8192`. The budgets table in `agent-factory/contracts/board.md` § Budgets is compared two-way against `BUDGETS` by `install/state-layout.test.ts`, so the table gains a row in the same change. The validator's `checkBudgets()` gains one `directoryFindings(BUILD_REQUESTS_REL, …)` call; `state-check` embeds `BUDGETS` (EMBED_SPECS row ~196) and its directory loop, so it is regenerated. This moves "nine byte budgets" to ten; the v3 layout marker (`layout: v3`) does not change, because an absent directory is clean and the change is additive.
- Grammar (proposal, in `contracts/upstream.md`): closed frontmatter keys `id`, `ticket`, `status` (`open` | `answered` | `withdrawn`), `source`, `asked_pin`, `answered_pin`; body sections `## Question`, `## Upstream IDs`, `## Options` (with the recommended default), `## Blocked work`. Validator check: optional in v3.1 (presence of keys and that every ticket in the new column names an `open` BR). The structure is what a human carries upstream.
- ID allocation: parallel role agents allocating `BR-<n>` collide. Single writer: the raising role publishes an `observation` note whose body opens `Build-request:` (the body-prefix convention WF04 already uses for `Cause:`, `Resolved:`, `Disputed:`); BA/PM, the translator between upstream and grugops, writes the file in a queued subtask. This also keeps the "BA/PM translates" ownership in the idea file.

**Board status.**
- The board grammar has no closed column vocabulary: `contracts/board.md` § Headings admits any name in the Limited or Unlimited form; only the Blocked form is fixed to the name `Blocked`. A status is `kebab(column)` (`board-model.ts` `kebab`). So the new status is a new column heading, e.g. `## Awaiting Upstream (WIP unlimited)`, status `awaiting-upstream`. Zero parser change.
- Why a column and not `Blocked` + a reason (recommended: column, decision for the human): WF09 step 7 escalates anything blocked past `blocked_escalation_days` and `checkpoints.escalate_stale_blocker` fires on it, which is wrong for a wait on an upstream human. A separate column also keeps engineering blocks and upstream waits apart on the board and in `memory-bank/plans/metrics.md` "Blocked time".
- Files that change for the column:
  - `agent-factory/seed/memory-bank/plans/board.md`: the heading, plus a row in § Columns (spec §6.1) with a parenthesized Exit owner such as `(BA/PM, on a new pin)`. The text "The 13 columns" becomes 14. `scripts/check-role-rules.ts` `partitionModel()` reads this table: a parenthesized owner keeps the column outside the flow; a bare role name would put it in the flow and trip rule 2.
  - `scripts/check-role-rules.ts` `BOARD_MOVE_EXCEPTIONS`: every move OUT of the new column claimed by a role needs an entry, and the file says "Adding an entry needs a recorded human decision". Moves INTO it from a column the role owns pass rule 4 without an entry (target outside the flow).
  - `scripts/board-tracer.test.ts` pins "13 columns" in four places (lines 108, 893, 936, 966).
  - `agent-factory/workflows/09-daily-sweep.md` names "the frozen set" of columns: add the new column and state that it is not escalated by `blocked_escalation_days`.
  - Existing repositories: their board lacks the heading, and the validator errors `column "<X>" is not a board column` on a ticket that names it (`checkTickets`). The installer never edits a user's board. WF20 must say: add the heading before the first move into it. The validator's `column-missing` check only covers `wip_limits` columns, so an absent unlimited column is not itself a finding.
- No new checkpoint is recommended. A parked ticket waits for a human by construction; a new checkpoint id changes `CHECKPOINTS` in `scripts/checkpoints.ts`, which is embedded in `note.js` and moves the roster everywhere (validator refusal of unknown ids, `factory.config.md` roster).

**Answer path.**
- The human answers upstream, upstream publishes a new commit, the human edits the pin in `.grugops/factory.config.json`. On the next session start the pin check passes; BRs whose `asked_pin` differs from the current pin are candidates. The Orchestrator queues a BA/PM subtask (WF17 step 1) to read the new pinned content, publish a `claim` note per WF16 with refs `[<ticket>, BR-<n>, upstream:<source>:<id>@<commit>]`, set the BR to `answered`, and move the ticket back. `claim` kind needs no stamp and passes `admit()` (`contracts/context-note.md` § required-field rule), so no context-io change is needed. The six-kind schema stays closed.
- WF04 step 17 already defines a `Fundamental:` change (alters what a requirement delivers). Add: when the requirement cites an `upstream:` ref, a fundamental change is a build request, not a named-human approval inside grugops.

### Feature 4: Universal consultant (role + WF19 + CONSULT + panel + dial)

**Role.** NEW `agent-factory/roles/consultant.md`, frontmatter `kind: role`, `tier:` (core or a new value; `UNKNOWN - verify` which tier values the role schema admits, read `scripts/canonical-frontmatter.ts` ROLE_SCHEMA), `capabilities: read shell web` (shell is needed to run `note.js add`; no `edit`). Nine sections in the validator's order. Hard limits: advisory only; never writes code, a ticket, a board move, a `finding` or a `decision`; answers as `claim` or `observation`; every answer has a source or `UNKNOWN - verify`; an upstream-scope question becomes a `Build-request:` note.

**Every registration a new role moves** (taken from the Designer commit 3fcb4683, which added the last role):
- `scripts/kit-model.ts` `ROLE_COUNT` 19→20 and `SPAWN_GRANT_SCAN_COUNT` 37→38, each with a dated MOVED comment.
- `scripts/check-foundation-guards.ts` `ROLE_CEILINGS` new row (measured bytes, FAIL = ceil(bytes×1.12), WARN = ceil(bytes×1.06)).
- `scripts/model-tiers.ts` `TIERED` new row with `rationale` and `effortRationale`.
- `docs/audit/28-disposition-register.md` Table A row; `docs/audit/28-safety-surface-exclusions.md`; a style-dispositions record under `docs/audit/29-style-dispositions/`.
- `scripts/check-banned-claims.ts` `BANNED_CLAIM_SCAN_COUNT` (+2: kit file and generated adapter); `scripts/check-imperative-lexicon.ts` counts (`TECHNICAL_NAMES_COUNT`).
- Generated: `.claude/agents/grugops-consultant.md` and the coordinator grant in `.claude/agents/grugops-orchestrator.md` (`npm run generate:adapters`); `hooks/hook-entry.ts` `DECIDER_MANIFEST` hash of `scripts/kit-model.js` (`npm run generate:hook-manifest`); `docs/reference/agents/consultant.md` and the index (`npm run generate:catalog`); the safety-surface list (`npm run generate:safety-surface`).
- Install census tests move: `install/installer-cross-version.test.ts`, `installer-never-installed.test.ts`, `installer-special-files.test.ts`, `installer-user-edit.test.ts`, `record-truth.test.ts`, `uninstall-removal.test.ts`, `scripts/adapter-byte-baseline.test.ts`, `scripts/tier-kit-text.test.ts`, `scripts/trace-instructions.test.ts`.

**Workflows.** NEW `19-consult.md` and NEW `20-upstream-sources.md`: `WORKFLOW_COUNT` 19→21 in `kit-model.ts` (`isNumberedWorkflowFile` derives membership; the count pins it). Each needs the eight `WORKFLOW_SECTIONS` and a `## Commit` section (`checkWorkflowCommit`). Register rows in `28-disposition-register.md`. `docs/reference/README.md` workflows table is generated.

**Dispatch.** Roles cannot spawn (`_role-switch-protocol.md`: only the coordinator spawns) and the Orchestrator reads published notes, never chatter. So a CONSULT request is a published `observation` note whose body opens `Consult:` with topic, lens and the question, refs carrying the ticket id. The requesting role then stops per its `## Stop when`. The Orchestrator, on reading it, enqueues a consult subtask per WF17 step 1 with `ref:` the ticket's context folder (`claim.ts` reads exactly one `ref: .grugops/context/<folder>/` line, so a consult subtask can point at the ticket's folder) and claims it `--by grugops-consultant`. Only BA/PM, System Analyst, Architect and Designer get the `Consult:` stop line; Engineer, QE and Release do not.
- `orchestrator.md`: add `consult` to the request-type list in Responsibilities step 3 (maps to `19-consult.md` by the role's own "like-named file" rule) and one routing-matrix line `second opinion (Consult: note or human) -> Consultant`.

**Panel mode.**
- Each lens is its own subtask with its own context folder (`<ticket>-consult-<n>-<lens>`, allowed by `TASK_NAME_RE ^[A-Za-z0-9._-]+$`), because WF17 states "within-task context writing is single-writer" and parallel lens agents writing one folder race on its derived `index.md`/`index.jsonl`. After all lens tasks are in `done/`, the Orchestrator enqueues one synthesis subtask (the consultant again, lens `synthesis`) whose `ref:` is the ticket folder and whose output is the disagreement section. The queue has no dependency field; ordering comes from when the Orchestrator enqueues, which matches decompose → enqueue. On non-spawning hosts the same subtasks run sequentially by role switch, giving identical artifacts.
- Tiers per lens: the `models` dial is keyed by role stem (`factory.config.md` § `models` sub-fields), so every lens of one role gets one model. Different tiers per lens need generated level adapters, the mechanism `software-engineer.md` uses (`levels: junior mid senior` frontmatter, `LEVELED_ROLE_COUNT = 1` in `kit-model.ts`, level pins in `model-tiers.ts`). Recommendation: v3.1 ships one consultant adapter; per-lens tiers are a separate decision (they move `LEVELED_ROLE_COUNT`, `SPAWN_GRANT_SCAN_COUNT` by the number of levels, and the model-tier tables).

**Dial.** NEW key (name TBD; `consult` below) in `factory.config.md`: `consult.mode` = `single` (lean default, also the absent value) | `panel` (enterprise escalation), and `consult.lenses` (array of lens names, used by `panel`). "Only on request" holds at every value: the dial changes the shape of a consult, never whether one starts on its own. Validator: presence-guarded enum arm in `checkConfigForm`, same as `quality.*`. Row in the § Config-dial contract table.

### Feature 5: Upstream architecture as given input

- `agent-factory/roles/greenfield-mapper.md` § Reads names `default_stack` "whose stack you honor when set". Order to state (in WF20, with a pointer line in the role): an upstream stack or architecture decision outranks `default_stack`, which outranks the boring default. A deviation is a `Build-request:` note.
- `agent-factory/roles/architect-design.md`: one pointer line. An imported upstream decision can be recorded as an ADR that cites the `upstream:` ref with Status `Accepted (upstream)`, so the ADR trail stays whole without copying the package.
- `agent-factory/workflows/00-bootstrap-greenfield.md`: a step "when `upstream` is set, read the pinned architecture per WF20 before choosing a stack". `01-bootstrap-brownfield.md` only if the human wants brownfield covered (`UNKNOWN - verify`, not in the idea file).
- Depends on Feature 1 (sources) and Feature 3 (deviation becomes a BR).

### Feature 6: One-command install

- Today: `README.md` claim C-28-005 says clone, then `node ~/grugops/install/install.js --target …`. `install/install.ts` resolves `GRUGOPS_SRC` to the checkout the script sits in (line ~419) and reads from it far more than the kit: `agent-factory/`, `AGENTS.md`, `.claude/agents/`, `.claude/skills/`, `scripts/role-skills-reader.js`, the four-file import closure of `scripts/generate-role-adapters.js` it mirrors to render adapters (comment at line ~770), the host runnables, and the host-entry sources. So a one-command install must materialize the whole source tree that install reads, then run the unchanged installer from it.
- The mechanism is the STACK researcher's call. Architecture constraints any choice must meet:
  - **Entry point.** NEW `install/cli.ts` (shebang `#!/usr/bin/env node` on its first line; `install/install.js` has none today, so it cannot be a POSIX bin as is). It forwards to `install.js` / `uninstall.js` with `process.execPath`. Keep `install.ts` unchanged except for printed commands (below). One installer stays one installer (D-07/D-08).
  - **Default target.** Already exists: with no `--target` the prompt defaults to the current directory, and `--yes` or a non-TTY takes it. No new target logic.
  - **Printed commands.** Every command install prints carries `GRUGOPS_SRC=<checkout>` (`COMMAND_CONTEXT`, line ~618; `install/README.md` § The scripted path). Under a package runner that path is a cache directory that may be cleaned, so the `--check`, `left`, `verify` and `install INCOMPLETE` remedies would name a vanished path. The cli must tell install it is running from a package, and install must then print the one-command form (`<runner> <pkg>@<version> …`). Tests that pin printed text: `install/message-references.test.ts`, `install/closing-claims.test.ts`. This is the riskiest part of the install phase.
  - **Packaging manifest.** If the mechanism is a registry package, `package.json` is `"private": true`, named `grugops-tooling` (2026-11-24); publishing needs a public name (`UNKNOWN - verify` availability), a `bin`, and a `files` allowlist covering every source path install reads, including dot-directories (`.claude/`, `.agents/`, `.opencode/`, `.pi/`, `.github/agents/`). Whether `npm pack` includes listed dot-directories is `UNKNOWN - verify`. Add a test that derives install's read set and compares it with `npm pack --dry-run --json` output, so a missing file fails CI instead of failing on a user's machine.
  - **Version agreement.** `agent-factory/VERSION`, `package.json` `version` (3.0.0), `.claude-plugin/plugin.json` and README claim C-28-004 must agree; the pinned version in the README command must be checked by the same gate.
  - **Windows.** Copy mode only (symlink mode is opt-in and fragile; a symlink into a package cache would dangle). A git-hosted spec needs git on the host; a registry spec does not.
  - **Out of Scope.** PROJECT.md lists "global `$PATH` binary" as out of scope (v1.1). A transient package-runner invocation installs nothing on `PATH`, but record the decision explicitly.
- Independent of features 1–5; can run first or in parallel.

### Feature 7: `install --migrate` in the public docs

- `README.md` (checkout-only page), `docs/usage.md`, `docs/how-it-works.md` (both ship to the kit home) must name `install --migrate`.
- **Link rule (HIGH, verified):** `docs/pre-v3-state-layout.md` is in `CHECKOUT_ONLY_DOCS` (`install/kit-source.ts` line ~479), so it never reaches the kit home. `scripts/check-story-docs.ts` `runLinkCheck` (STORY-05) fails a shipped page whose relative link targets a non-shipped file ("link it by repository URL"). So `usage.md` and `how-it-works.md` must link it by repository URL (`https://github.com/abitwise/grugops/blob/main/docs/pre-v3-state-layout.md`); `README.md` may link it relatively.
- **Path-spelling rule:** `scripts/check-state-paths.ts` allows the pre-v3 root spelling only in its `ALLOW_LIST` (the pre-v3 page, `CHANGELOG.md`, audit and initial docs, the authority). New public text must describe migration without spelling the old root, or the gate goes red. Verify with `npm run check:state-paths`.
- **Claims:** README's install step is anchored as C-28-005/C-28-006. Feature 6 rewrites the same lines, so do features 6 and 7 in one phase and update `docs/audit/28-claim-registry.md` once (verbatim fenced block plus a re-measured `mechanism`), checked by `npm run check:claim-anchors`. New sentences about migration or upstream that make claims ("grugops never writes into the upstream repository") need their own anchors and rows; that one is prose-only, so its `mechanism` must say so (see `docs/GUARANTEES.md` § where each floor is enforced). `scripts/check-public-docs-vocabulary.ts` and `scripts/check-story-docs.ts` also scan these pages.

---

## Data flow

### Upstream read and pin check

```
session start (WF17)
  → node tools/grugops/upstream.js check
      0 → roles may read <path> in place (pinned content)
      1 → Orchestrator names each drifted source; no dispatch of a role that reads it
      2 → could not run → `UNKNOWN - verify`, name the cause, never a pass
role reads <path>/<entry> and the artifacts it lists (never copies into memory-bank/)
  → publishes notes with refs [<ticket>, upstream:<src>:<id>@<commit>]
  → trace-render.js routes upstream: refs to the Requirement column
```

### Build request round trip

```
role (BA/PM | SA | Architect | Designer | Greenfield Mapper | Consultant)
  → observation note "Build-request: …" (refs: ticket, upstream refs)  → stop
Orchestrator reads the note → queues BA/PM subtask
BA/PM → writes memory-bank/plans/build-requests/BR-<n>.md (status: open, asked_pin)
      → moves ticket to "Awaiting Upstream"; ticket body ## Blocked names BR-<n>
HUMAN carries BR-<n> upstream → upstream decides → new upstream commit
HUMAN edits pin in .grugops/factory.config.json (git history = audit of pin changes)
session start: pin check 0; open BRs with asked_pin ≠ pin → BA/PM subtask
BA/PM → claim note (refs: ticket, BR-<n>, upstream:<src>:<id>@<new commit>)
      → BR status answered, answered_pin → ticket back to its prior column
```

### Consult

```
BA/PM | SA | Architect | Designer → observation "Consult: <topic> / <lens> / <question>" → stop
(or a human asks the Orchestrator)
Orchestrator → read consult.mode
  single → 1 subtask, ref = ticket folder, --by grugops-consultant
  panel  → N lens subtasks (own folders) → after all done → 1 synthesis subtask (ref = ticket folder)
Consultant → reads declared sources first (pin check must be 0)
           → upstream-scope question → "Build-request:" note (no opinion)
           → otherwise claim/observation notes, each sourced or `UNKNOWN - verify`
requesting role resumes from the notes (WF16 step 1)
```

### Changed flows vs today

1. A third read-only root enters role reads; today only KIT and STATE exist.
2. Note refs gain one new shape; `trace-model.ts` classification changes; nothing else in the note schema changes.
3. A ticket can leave the flow for a column whose exit waits on a config edit by a human.
4. The Orchestrator gains a dispatch trigger from a note body prefix (`Consult:`, `Build-request:`), parallel to the existing `Cause:` hand-off reading in WF04.

---

## Generated and freshness-checked artifacts to regenerate

| Trigger | Command | Gate that fails if skipped |
|---------|---------|----------------------------|
| Any `.ts` change | `npm run build` | `npm run freshness` (CI) |
| New role / changed coordinator grant | `npm run generate:adapters` | `npm run freshness:adapters` |
| `kit-model.js` or another decider hash changes | `npm run generate:hook-manifest` | `npm run freshness:hook-manifest` (runtime deny on mismatch) |
| `trace-model.ts`, `BUDGETS`, new embed row | `npm run generate:runnable-embeds` | `npm run freshness:runnable-embeds` |
| New role or workflow | `npm run generate:catalog` | `npm run freshness:catalog` |
| Register rows flagged `safety_surface` | `npm run generate:safety-surface` | its test |
| Claim text moved or added | edit `docs/audit/28-claim-registry.md` | `npm run check:claim-anchors` |
| Guarantees inputs change | `npm run generate:guarantees` | `npm run freshness:guarantees` |
| Trace classification on this repo's own notes | `node scripts/runnable-ref/trace-render.js .` | `npm run freshness:traceability` |
| Skill text (only if a skill names request types; none does today) | `npm run generate:skill-twins` | `npm run freshness:skill-twins` |

Host entries (`npm run generate:host-entries`) are template-driven and are not expected to change (`UNKNOWN - verify` if WF19/WF20 add launch-agent text).

---

## Role byte budget (the binding constraint)

Measured 2026-11-24 with `wc -c`: role corpus 60,946 B against WARN 64,000 and FAIL 67,383 (`check-foundation-guards.ts` lines 3623/3627; "never raise it to reach green").

| Role | Now (B) | Per-file WARN / FAIL | Headroom to FAIL |
|------|---------|----------------------|------------------|
| orchestrator.md | 6,158 | 6,195 / 6,546 | 388 |
| ba-pm.md | 2,880 | 3,053 / 3,226 | 346 |
| system-analyst.md | 2,249 | 2,384 / 2,519 | 270 |
| architect-design.md | 2,894 | 3,068 / 3,242 | 348 |
| designer.md | 2,749 | 2,799 / 2,957 | 208 |
| greenfield-mapper.md | 2,273 | 2,410 / 2,546 | 273 |

Estimate: consultant ~2,000 B plus ~90–150 B per modified role (six roles) ≈ 2,600–2,900 B → corpus ≈ 63,500–63,850 B, at or just under WARN. The orchestrator and designer cross their per-file WARN with almost any addition (WARN is advisory). Rule: every role edit is one pointer line ("Upstream sources and build requests: per Workflow 20." / "Second opinion: publish a `Consult:` note per Workflow 19 and stop."); every procedure goes in WF19/WF20 (Phase 40 D-05). Measure after each phase, not at the end.

---

## Suggested build order

```
44  Upstream sources contract + pin check  ─┬─► 45 Traceability + build requests ─► 46 Architecture as input ─┐
     (decision gate first)                   │                                                              ├─► 48 Consultant ─► 49 Feature docs + close
                                             └──────────────────────────────────────────────────────────────┘
47  One-command install + install --migrate docs   (independent; any time, can run first or in parallel)
```

1. **Phase 44: Upstream source declaration and pin check.** Opens with a human decision gate: config key and status names, the upstream manifest/entry format (the idea file says the upstream build handoff should settle first), in-repo path vs external path, who owns the technical architecture. Then: `contracts/upstream.md`, `scripts/upstream-model.ts`, validator arm, `factory.config.md` rows, `upstream.js` runnable + embed row + installer copy, WF17 session-start step, WF20 skeleton (read in place, pin check), AGENTS.md third-root line. Also the `trace-model.ts` changes (`upstream:` → Requirement, `BR` reserved) so the runnable stamp moves once. Needs deeper research: pin check semantics on Windows (CRLF and `core.autocrlf`), submodule vs plain checkout, SHA-256 object-format repositories (`UNKNOWN - verify`).
2. **Phase 45: Traceability and build requests.** Depends on 44 (ref grammar, pin). BR contract section, `BUILD_REQUESTS_REL`, seed `.gitkeep`, `BUDGETS` key and the contract table row, validator/state-check budget, the `Awaiting Upstream` column (seed board, column table, `BOARD_MOVE_EXCEPTIONS` with a recorded human decision, WF09 frozen set, board-tracer pins), WF02/WF03/WF04 step 17 edits, BA/PM/SA/Architect/Designer pointer lines.
3. **Phase 46: Architecture as input.** Depends on 44 and 45. Greenfield Mapper and Architect pointer lines, WF00 step, ADR-from-upstream convention. Small; can merge into 45 if the roadmapper wants fewer phases.
4. **Phase 47: One-command install and `install --migrate` docs.** Independent of 44–46. Do the migrate docs here because both touch README claims C-28-005/C-28-006. Mechanism from STACK research; cli dispatcher; printed-command form under a package runner; packaging census test; version agreement; Windows run.
5. **Phase 48: Universal consultant.** Depends on 44 (sources-first answers) and 45 (upstream-scope questions become build requests). Last of the kit changes because it moves the most pins (role count, workflow count, scan counts, adapters, catalog, register) and must be measured against the byte budget after 45/46 spent their share. Role, WF19, `consult` dial, `Consult:` convention, Orchestrator request type and routing line, panel mode.
6. **Phase 49 (optional): public docs for the new features and milestone close.** `docs/concepts.md`, `docs/usage.md`, `docs/how-it-works.md` sections on upstream sources, build requests and the consultant, with claim anchors and registry rows; CHANGELOG `[3.1.0]`; version bump to `3.1.0`.

Ordering rationale: the source declaration is the dependency root (pins, ref grammar, third root). Build requests need the pin to know when they are answered. The consultant needs both, because its first rule is "answer from declared sources" and its second is "upstream-scope questions become build requests". Install touches none of the kit's markdown or the state layout and can run anywhere in the sequence.

---

## Anti-patterns

### Anti-pattern 1: Copying the upstream package into state
**What people do:** vendor the design package into `memory-bank/` so roles "have it".
**Why it's wrong:** a package runs to hundreds of KB, far over the per-file budgets (`ticketBytes` 65,536, `progressBytes` 16,384), and a copy drifts from its pin silently.
**Do this instead:** read in place at the pinned commit; cite with `upstream:` refs.

### Anti-pattern 2: Raw upstream IDs on note refs
**What people do:** put `DEC-012` on `refs`.
**Why it's wrong:** it passes `isTicketId` and becomes a phantom ticket in the rendered trace.
**Do this instead:** the namespaced `upstream:<source>:<id>@<commit>` ref.

### Anti-pattern 3: A ninth ticket frontmatter key for upstream IDs
**Why it's wrong:** `contracts/board.md` closes the set at eight; the reader refuses a ninth by name, and the validator then reports the whole ticket as refused.
**Do this instead:** refs on notes; a body section if a human wants them visible in the ticket.

### Anti-pattern 4: Procedure in role files
**Why it's wrong:** the corpus is about 3 KB from WARN and the orchestrator 37 B from its per-file WARN.
**Do this instead:** one pointer line per role; WF19/WF20 hold the steps.

### Anti-pattern 5: Panel lenses writing one context folder in parallel
**Why it's wrong:** breaks WF17's single-writer-per-task statement and races the derived index renders.
**Do this instead:** one folder per lens, then a synthesis task into the ticket folder.

### Anti-pattern 6: A second installer for the one-command path
**Why it's wrong:** the dual POSIX/Node installer was retired (D-07/D-08) because the pair drifted.
**Do this instead:** a thin dispatcher that runs the existing `install.js` from a materialized source tree.

---

## Integration points

### External

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| Upstream design system | Files only: a pinned read-only source in or beside the repo; build requests carried by a human | No MCP server or live link in v3.1 (milestone boundary) |
| git (host) | `upstream.js` spawns `git rev-parse` / `git status` | Missing git → exit 2, `UNKNOWN - verify`, never a pass |
| Package registry or git host (install) | One-command fetch of the source tree | Mechanism per STACK research; version pinned in the command |

### Internal boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Role ↔ Orchestrator (CONSULT, build request) | Published `observation` notes with a body prefix | Never a direct hand-off; same pattern as WF04 `Cause:` |
| Orchestrator ↔ consultant | Queue subtask (`pending/` two lines, `claim.js claim --by grugops-consultant`) | Only the coordinator spawns |
| Config ↔ validator / runnable | `scripts/upstream-model.ts`, embedded into `upstream.js` | One authority, generated copy, freshness gate |
| Notes ↔ trace | `refs` → `trace-model.ts classifyRef` | One new rule; Requirement column reused |
| BR file ↔ board | Ticket body `## Blocked` names `BR-<n>`; ticket in `Awaiting Upstream` | Optional validator cross-check |
| cli ↔ installer | `process.execPath` spawn of `install.js` / `uninstall.js` | Installer contract unchanged (idempotent, additive, dry-run, reversible) |

---

## Sources

- Repository code and docs read 2026-11-24 (HIGH): `agent-factory/roles/{orchestrator,ba-pm,architect-design,greenfield-mapper,_role-switch-protocol}.md`; `agent-factory/workflows/{04,09,16,17}-*.md`; `agent-factory/contracts/{board,context-note}.md`; `agent-factory/config/factory.config.{md,json}`; `agent-factory/seed/memory-bank/plans/board.md`; `agent-factory/README.md`; `AGENTS.md`; `README.md`; `install/README.md`; `install/{install,kit-source,state-layout}.ts`; `scripts/{validate-agent-factory,check-foundation-guards,check-role-rules,kit-model,model-tiers,trace-model,board-model,generate-runnable-embeds,generate-catalog,check-claim-anchors,check-story-docs,check-state-paths,claim}.ts`; `scripts/runnable-ref/note.ts`; `.github/workflows/ci.yml`; `package.json`; git commit 3fcb4683 (the Designer role addition, used as the "add a role" checklist).
- `.planning/PROJECT.md` § Current Milestone; `.planning/phases/999.14-*/999.14-IDEA.md`; `.planning/phases/999.13-*/999.13-*.md`.
- No external sources were needed for integration points; the one-command install mechanism is left to the STACK research.

---
*Architecture research for: grugops v3.1 (upstream design, consultation and one-command install)*
*Researched: 2026-11-24*
