# Phase 31: Autonomous Manual Testing - Research

**Researched:** 2026-09-07
**Domain:** Agent-driven browser UAT — Playwright as machine-verifiable evidence, browser MCP as the authoring tool, provenance-stamped context notes, TypeScript-AST spec integrity
**Confidence:** HIGH for the repo-internal mechanics and the npm/vendor facts; MEDIUM for the one remaining `mcp__claude-in-chrome__*`-in-subagent question, which is reported as `UNKNOWN - verify` and does not gate the phase

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` `## Implementation Decisions`.

**Evidence note shape and provenance (UATX-01, UATX-04)**

- **D-01: Evidence is a `finding` + `artifact-ref` pair; no new note kind.** The §14 gate's
  re-run of the spec yields a `finding` stamped `verified_by: §14-gate#<id>` through the existing
  `emitVerdict` / `admit()` cross-check. An `artifact-ref` note points at the committed spec and
  carries three new required fields: `sha` (the commit the spec was run at), `gate_run` (the
  per-run `<id>` the verdict certifies), `content_hash` (see D-02). The six-kind schema in
  `agent-factory/contracts/context-note.md` stays closed. — **Reversibility:** costly — every note
  parser, the compactor carve-outs and the freshness-gated index would have to learn a seventh
  kind if this were later changed to a dedicated `evidence` note.
- **D-02: `content_hash` is sha256 over the committed `*.uat.spec.ts` bytes at `sha`.** The
  Playwright run report is not hashed; it is a run product and is bound by `gate_run`. Anyone
  with the repo can recompute the hash. Transitive imports are not hashed (a helper edit does not
  invalidate the evidence in this phase).
- **D-03: The `sha != HEAD-of-gate-run` refusal lives in `admit()` at write time, and only
  there.** The verdict note the gate emits records the HEAD it ran against; `admit()` refuses an
  `artifact-ref` whose `sha` differs, naming both SHAs in the refusal. One authority per predicate
  (Phase 29 lesson): the gate does NOT pre-check, so there is no second implementation to drift.
  — **Reversibility:** one-way — moving the predicate later means two code paths deciding one
  question for the transition window, which is the exact drift class that cost 13 green-suite
  rounds in v2.0.
- **D-04: Green evidence advances `In UAT → Ready` ONLY when `checkpoints.sign_off_acceptance`
  is dialed to `allow`; the shipped default stays `block`.** The Phase 30 matrix is honoured
  unchanged: no default moves, no new checkpoint id, no floor touched. Zero-config still stops for
  a named human at `sign_off_acceptance`; a repo that trusts its specs flips the one config key
  (it is not a floor, so no second key is involved). The UAT Planner presents the pack as
  machine-backed either way.

**Spec location and authoring flow (UATX-01, UATX-02)**

- **D-05: Specs live in the target repo's existing E2E directory under a `uat/` subfolder and
  are named `<ticket-id>.uat.spec.ts`.** They ride the existing `quality.ui_e2e` lane unchanged;
  no second Playwright project, no new config path. The `.uat.spec.ts` suffix is the recognition
  key for both the provenance `artifact-ref` and the AST ban (D-13).
- **D-06: QE/E2E authors the spec; the authoring step is added to workflow 06 (UAT pack).** The
  UAT Planner still writes the business scenarios; QE/E2E turns each scenario into a spec through
  Playwright MCP, then the gate re-runs it. No new role — the 17-role count every guard derives is
  untouched.
- **D-07: A new kit checklist `agent-factory/checklists/browser-uat-recipe.md` is the single
  home for the `@playwright/mcp@0.0.78` setup** — the five `mcp add` commands (Claude Code, Codex,
  Gemini CLI, OpenCode, Copilot CLI), the HEADED-default / `--headless` note, `npx playwright
  install --with-deps chromium`, and the pin. `install/README.md` gets one short section pointing
  at it. `package.json` gains nothing: the server is `npx`-invoked by the user's own agent.
- **D-08: The `0.0.78` pin is one literal in that checklist, asserted by a foundation guard.**
  `check-foundation-guards` asserts every mention of `@playwright/mcp@` across the kit and docs
  equals the checklist literal, the same idiom as the `@playwright/test 1.62.1` pins. Bumping is
  one edit plus re-pin. No `npm show` at gate time.

**Claude-in-Chrome lane (UATX-03)**

- **D-09: The lane is barred by absence of any path, proven by test.** `emitVerdict` is the only
  author of a `by: §14-gate` note and takes a gate run's test-integrity result; nothing in the
  Chrome lane calls it. The lane's ONLY outputs are a `finding` stamped `human:<name>` and an
  `artifact-ref` describing what was witnessed. A test asserts the lane's source carries no
  reference to `emitVerdict` or `§14-gate`, and the existing reserved-identity impersonation
  refusal covers any note that tries. No hook denial on the MCP tools, no third reserved identity.
- **D-10: Attended-only is detected by reusing the fail-closed `claude auth status --json`
  probe from `scripts/e2e/uat-live.test.ts`, requiring `loggedIn === true` AND no
  `ANTHROPIC_API_KEY` in the environment.** A failed or inconclusive probe is a loud skip naming
  the reason; the lane never opens silently. `UNKNOWN - verify`: whether the JSON exposes the auth
  method (plan vs API key vs `setup-token`) — the researcher must check before the predicate is
  pinned; if it does not, the env-var check is the whole predicate and the doc says so.
- **D-11: The witnessing human's name enters `human:<name>` through the existing grant only —
  `GRUGOPS_ADMISSION_APPROVED_BY` read by the `admission-guard` PreToolUse hook.** No
  lane-specific variable. A Chrome-lane finding is just another human-stamped finding; the agent
  can never author the name (D-07 of v2.0 holds).
- **D-12: On the four non-Claude-Code hosts the lane is absent by design, stated once in the
  recipe.** No adapter carries a dead tool name, no per-host skip line. Playwright is the floor
  everywhere, so "degrade, never break" holds.

**Loud skip and AST ban (UATX-05, UATX-06)**

- **D-13: The AST checker ships as a materialized runnable `tools/grugops/uat-spec-integrity.js`
  (name to be confirmed by the planner), built from `scripts/runnable-ref/` exactly like
  `test-skip-integrity.js`, and resolves `typescript` from the TARGET repo's `node_modules`.**
  grugops ships no parser and no dependency. If the target has no `typescript`, the runnable emits
  a loud skip naming `typescript`, the lane exits non-zero, and the UAT stays `pending` — never a
  pass. It runs at the gate over every `*.uat.spec.ts` (D-05).
- **D-14: The banned-construct set, decided over the TypeScript AST, is:** (a) `expect` /
  `assert` calls inside a `try` block or `catch` clause; (b) `expect` calls under an `if` / `else`,
  a conditional expression, a logical `||` / `&&` / `??` operand, or an optional call; (c)
  `test.skip`, `test.fixme`, `test.only`, `describe.skip`, `describe.only`, and `expect.soft`.
  A spec body with zero `expect` calls is NOT refused in this phase (deferred, see below). The
  claim in the recipe and in GUARANTEES-style prose must name exactly this set — the claim matches
  the mechanism.
- **D-15: "Browser absent or unusable" is a two-stage fail-closed probe inside the runnable:**
  stage 1 resolves `@playwright/test` from the target; stage 2 runs `npx playwright --version`
  and checks that the browsers directory it reports exists and is non-empty. Any failure at either
  stage emits the exact loud-skip idiom (`LOUD_SKIP_MARKER`-style exported constant, distinct text
  naming the stage), the lane exits non-zero, and the UAT stays `pending`. The existing Tier-2
  convention is reused verbatim in shape; only the marker text differs.
- **D-16: A Playwright-lane skip is recorded as an unstamped `observation` note carrying the
  marker text verbatim.** No `finding`, no `artifact-ref`, no board move; the ticket stays
  `In UAT` and the pack shows the scenario as pending with the reason.

### Claude's Discretion

- Exact runnable file name and the exact wording of the two new loud-skip markers, as long as
  each is a single exported constant with a single emission point (the `uat-live.test.ts` shape).
- Field order and rendering of `sha` / `gate_run` / `content_hash` in `index.md`.
- Whether the browser-uat recipe is listed in the lean tier or the enterprise tier of
  `agent-factory/checklists/00-index.md` (it must be listed in exactly one).
- How the QE/E2E step in workflow 06 phrases the Playwright MCP exploration loop, within the
  Phase 29 writing profile.

### Deferred Ideas (OUT OF SCOPE)

- **Refuse a `*.uat.spec.ts` whose test bodies contain zero `expect` calls** (vacuous evidence).
  Not selected for the Phase 31 ban set; candidate for a later hardening round or a Phase 31
  gap-closure round if a red-team shows it matters.
- **Hashing the spec's transitive imports** so a helper edit invalidates evidence (D-02 hashes
  the spec bytes only).
- **A distinct checkpoint id for evidence-backed advance** — rejected for now in favour of the
  existing `sign_off_acceptance` dial.

Also out of the boundary per `<domain>`: any change to the four safety floors, any new note kind,
any new role, any new host runtime dependency, and any board/dashboard rendering (Phase 32).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UATX-01 | Playwright is the machine-verifiable evidence floor — the committed spec is the evidence, re-run by the existing §14 gate; an agent's narration or an MCP tool-call transcript is never a stamp. | §"The §14 gate as it exists today" maps the exact gate step order, the `emitVerdict` carve-out (the ONLY author of a `§14-gate` note) and `isLiveGreenVerdict`'s four-clause recognizer. The floor already exists; Phase 31 adds one artifact kind's provenance, not a new stamp grammar. |
| UATX-02 | Browser MCP tooling is used to *author* specs, with `@playwright/mcp` pinned (pre-1.0) and documented for all five host CLIs. | §"Standard Stack" carries the registry-verified package facts and §"Five-CLI MCP registration matrix" carries the five documented registration shapes. §F-01 flags that `latest` has moved to `0.0.80` since the pin was chosen. |
| UATX-03 | Claude in Chrome is available as an optional, clearly-labelled `verified_by: <named human>` lane, and is structurally barred from producing a `§14-gate` stamp. | §"Claude in Chrome: what the vendor doc actually says" (all CITED) plus §F-04, which resolves D-10's `UNKNOWN - verify` with measured `claude auth status --json` output on three auth configurations. |
| UATX-04 | Evidence carries provenance — commit SHA + gate-run id + content hash — and a note whose SHA is not the HEAD the gate ran against is refused. | §F-02 is the load-bearing finding: **the verdict note does not currently record any SHA**, so D-03's comparison has nothing to compare against until `emitVerdict` gains it. §"Note-schema blast radius" enumerates every file the three new fields touch. |
| UATX-05 | An absent or unusable browser produces a **loud skip** leaving the UAT `pending` (reusing the existing Tier-2 convention verbatim), never a silent pass. | §"The loud-skip idiom, verbatim" quotes the exported constant, the fail-closed probe and the single emission point from `scripts/e2e/uat-live.test.ts`, plus the D-12 runnable exit-code contract (0/1/2) the gate already branches on. |
| UATX-06 | Conditional or caught assertions are banned in generated specs, checked over the TypeScript AST rather than by regex, so the claim matches the mechanism. | §"TypeScript AST checker" carries an API surface verified by a real parse on the repo's own `typescript@6.0.3`, the node-kind walk for each of D-14's three arms, and the `createRequire` target-resolution shape D-13 requires. |

</phase_requirements>

## Summary

Phase 31 is overwhelmingly an **integration** phase against machinery this repo already owns. The
§14 gate, the reserved `§14-gate` author identity, the `emitVerdict` carve-out, the `admit()`
cross-check, the fail-closed loud-skip idiom, the materialized-runnable delivery path and the
checkpoint matrix all exist and were read this session. Nothing in UATX-01..06 requires a new stamp
grammar, a new note kind, a new role or a new host runtime dependency — which is exactly what
CONTEXT asserts, and it holds up against the source.

Three findings change the shape of the plan and should be treated as the research deliverable.
**First (F-02, blocking for UATX-04):** the gate's verdict note carries no commit SHA. `emitVerdict`
composes a fixed note whose only run-linked field is `refs: [§14-gate#<id>]` and whose body is a
single sentence naming the run id. D-03 says "the verdict note the gate emits records the HEAD it
ran against" — it does not, yet. The SHA must be added to `emitVerdict` (as a positional argument,
following the `TestIntegrityResult` precedent that deliberately forced every call site to be
revisited) before `admit()` has anything to compare an `artifact-ref`'s `sha` against.
**Second (F-04, resolves a locked `UNKNOWN`):** `claude auth status --json` **does** expose the auth
posture, in more useful detail than D-10 hoped for — measured directly on this box across three
environment configurations. The predicate can be strictly stronger than "no `ANTHROPIC_API_KEY`".
**Third (F-01/F-03, pin hygiene):** `@playwright/mcp@latest` moved to `0.0.80` on 2026-09-01, after
STACK.md measured `0.0.78`; and the "same idiom as the `@playwright/test 1.62.1` pins" that D-08
tells the planner to copy **does not exist** — there is no version-pin assertion anywhere in
`scripts/`, so that guard is new construction, not a clone.

The fourth area — the `mcp__claude-in-chrome__*`-in-subagent question — resolves to a documented
general rule (subagents inherit MCP tools; `tools:` narrows them; `mcp__<server>__*` patterns are
supported) with the Chrome-specific combination still undocumented. It stays `UNKNOWN - verify`,
and per the roadmap's own flag the Playwright floor does not depend on it. A design note that
sidesteps the question entirely is offered in §"Claude in Chrome".

**Primary recommendation:** plan the phase in dependency order — (1) extend `emitVerdict` with the
gate-run HEAD SHA and the three `artifact-ref` fields through the single `composeNote` authority,
emitting them **conditionally by kind** so no existing note's bytes move; (2) build the AST runnable
against `ts.createSourceFile` with syntax-only walking and `createRequire`-based target resolution;
(3) ship the recipe + the new (not cloned) pin guard; (4) wire workflow 05 to invoke the runnable
**before** the e2e lane and workflow 06 to insert the QE/E2E authoring step. Treat F-02 as a
sequencing constraint: every other UATX-04 task is downstream of it.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Re-running the committed spec and deciding green/red | §14 gate (workflow 05, host CI/dev machine) | — | The gate is the root of the verification chain; only a gate run may author a `§14-gate` stamp. |
| Authoring the spec from a live page | Host coding agent + `@playwright/mcp` (npx subprocess, agent's own machine) | — | MCP is exploration/authoring only. Its transcript is never evidence, so it never touches the trace tier. |
| Emitting the verdict note | `scripts/context-io.ts` `emitVerdict` (Node, in-process at the gate step) | — | The ONE sanctioned author of `by: §14-gate`. Adding a second author is the drift class the repo has spent 13 rounds closing. |
| Refusing a stale-SHA `artifact-ref` | `scripts/context-io.ts` `admit()` (write time) | — | D-03 pins one authority. The gate deliberately does not pre-check. |
| Spec-integrity (AST ban) | `tools/grugops/<runnable>.js` in the TARGET repo, run by the gate | `typescript` resolved from the target's `node_modules` | grugops ships zero runtime deps; the parser must come from the repo being checked. |
| Browser-availability probe | The same materialized runnable (target repo) | `npx playwright --version` subprocess | Fail-closed probe must run where the browsers would be, not where the kit lives. |
| Attended Chrome witnessing | Claude Code main thread on a human's own box | Chrome extension over native messaging | Visible-window-only and pauses for the human; structurally cannot be a CI tier. |
| Advancing the board past `In UAT` | `scripts/checkpoints.ts` matrix + the human at `sign_off_acceptance` | Workflow 06 | Phase 30 owns the dial; Phase 31 honours it and adds no checkpoint id. |

## Project Constraints (from CLAUDE.md)

These are directives, not preferences. A plan that contradicts one is wrong regardless of what
research recommends.

| Directive | Phase-31 consequence |
|-----------|----------------------|
| **Tech stack** — markdown for everything except the tooling layer; tooling is TypeScript compiled by `tsc` to **committed `.js`**, freshness-checked so committed output cannot drift from source | The AST runnable is authored as `scripts/runnable-ref/<name>.ts`, compiled to a committed `.js`, and the `freshness` gate (`OUTPUT_DIRS` includes `scripts/`) proves the pair. Never hand-edit the `.js`. |
| **Zero runtime deps on hosts** — dev/build deps are `{typescript, vitest}` (+ `@types/node`), never shipped | D-13's "resolve `typescript` from the TARGET repo" is the only legal way to get a parser. The runnable's own top-level imports must be `node:` builtins only. `package.json` gains nothing (D-07). |
| **Node 22+ is a hard install prerequisite** | Safe to use modern Node builtins (`node:module` `createRequire`, `node:crypto` `createHash`). |
| **Safety (hard)** — agents never merge protected branches, never deploy to prod without named human confirmation; prefer *mechanical* enforcement | The Chrome lane's bar (D-09) is enforced by absence-of-path **plus a test**, and the human name arrives only via the `admission-guard` hook (D-11). No prompt-only claim. |
| **Single-source** — role text lives once; per-tool adapters are thin pointers | D-12: the four non-CC hosts get **no** per-host skip line and no dead tool name in any adapter. The statement lives once, in the recipe. |
| **Zero-config first** — honour `factory.config.json` when present, run lean with sensible defaults when absent | D-04: `sign_off_acceptance` default stays `block`; the new behaviour is reachable only by a written key. |
| **Voice discipline** — caveman voice in role prompts; **clear voice** in security findings, compliance, money, disclaimers | Every string the AST runnable and the loud-skip markers emit is CLEAR PROFESSIONAL ENGLISH. The recipe is a gate contract, so it is clear voice. The workflow-06 QE step follows the Phase 29 writing profile. |
| **Installers** — idempotent, additive, dry-run-capable, reversible; never overwrite or delete user content | The new runnable entry must be added to **both** `RUNNABLES` (install) and `RUNNABLES_MIRROR` (uninstall) — see §F-05. |
| **No fabrication** — unknown commands are `UNKNOWN - verify`; never fake a passing gate, test result, or citation | A skip is never a pass; the browser-absent path exits non-zero and leaves the UAT `pending` (D-15/D-16). |
| **Minimal AGENTS.md** — keep the substrate short, push detail into the files it points to | The recipe is the detail home (D-07); `install/README.md` gets one short pointer section, not a copy. |
| **Brand** — always lowercase `grugops` | Applies to the recipe's prose. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/mcp` | `0.0.78` (pinned by D-08); registry `latest` is now **`0.0.80`** | The browser MCP server the agent uses to *explore a page and author a spec* | Microsoft-published, Apache-2.0, 6,364,011 downloads in the week 2026-08-31→2026-09-06, no `postinstall` script. `npx`-invoked; never enters `package.json`. `[VERIFIED: npm registry]` — discovered from the official `github.com/microsoft/playwright-mcp` README and confirmed by `npm view`. |
| `@playwright/test` | kit currently pins `1.62.1`; registry `latest` is `1.63.0` | The runner the §14 gate already invokes; the evidence artifact is one of its specs | Already the gate's UI/E2E lane (`quality.ui_e2e`). Phase 31 adds no new runner. `[VERIFIED: npm registry]` for the version; the kit pin is `[VERIFIED: agent-factory/checklists/playwright-visual-regression-recipe.md:17]` — verbatim: `` - `@playwright/test` `1.62.1` — the native runner provides screenshots, fixtures, and parallelism. `` |
| `typescript` | `6.0.3` in this repo's devDeps; **resolved from the TARGET repo at runtime** per D-13 | The AST parser behind the UATX-06 ban | Already a dev dependency here (`"typescript": "~6.0.3"`), so the runnable's unit tests can parse without any new install. `[VERIFIED: package.json devDependencies]` — verbatim: `"typescript": "~6.0.3"`. Compiler-API surface verified by a real parse this session (see §"TypeScript AST checker"). |
| Node.js | 22+ (existing hard prerequisite) | Runs the committed `.js` | Already a documented install prerequisite; `@playwright/mcp` itself needs only `engines: { node: '>=18' }` `[VERIFIED: npm registry]`. |

### Supporting

| Library / mechanism | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:crypto` `createHash("sha256")` | builtin | D-02's `content_hash` over the committed spec bytes | The repo already uses exactly this idiom twice — `[VERIFIED: scripts/generate-hook-manifest.ts:54]` verbatim `per[rel] = createHash("sha256").update(readFileSync(join(root, rel))).digest("hex");` and `[VERIFIED: hooks/hook-entry.ts:190]` verbatim `got = createHash("sha256").update(readFileSync(join(KIT_ROOT, rel))).digest("hex");`. Copy it; do not invent a second hashing shape. |
| `node:module` `createRequire` | builtin | D-13's "resolve `typescript` from the TARGET repo's `node_modules`" | The only way to reach a dependency the kit does not ship, from a single committed `.js` that must also run where `typescript` is absent (and loud-skip there). |
| `git rev-parse HEAD` via `node:child_process` | builtin | The gate-run HEAD SHA that F-02 shows must be added to `emitVerdict` | The repo already shells `rev-parse` — `[VERIFIED: scripts/freshness.ts:147]` verbatim `const headRev = git(["rev-parse", "HEAD"]);`. Reuse the arg-array (no-shell) spawn shape. |
| `@axe-core/playwright` | kit pins `4.12.1`; registry `latest` is `4.13.0` | a11y assertions in the existing UI/E2E lane | Untouched by Phase 31 — listed only so the planner does not mistake a stale pin here for phase scope. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Three new frontmatter scalars (`sha`/`gate_run`/`content_hash`) | Encode them in the existing `refs:` list (e.g. `sha:<hex>`, `gate_run:§14-gate#<id>`) | `refs` is already "req ids, file paths, ticket refs" and needs **zero** changes to `composeNote`, `toJsonl`, the compactor's byte-equality or the freshness-gated render. Strictly smaller blast radius. **But D-01 locks "three new required fields"**, so this is recorded as the road not taken, not a recommendation. If the planner hits unexpected compactor/freshness breakage, this is the escape hatch to raise with the user — not to take unilaterally. |
| `ts.createSourceFile` (syntax-only) | `ts.createProgram` + type checker | A `Program` needs a resolved `tsconfig.json`, module resolution and every transitive `.d.ts` in the target — slow, fragile, and it can fail for reasons unrelated to the ban. D-14's three arms are **purely syntactic**; use the cheap parse. |
| Materialized runnable in `tools/grugops/` | A kit-side script invoked over a path | The kit is not present on host CI (`no ~/.grugops, no npm, no node_modules` — `[VERIFIED: scripts/runnable-ref/test-skip-integrity.ts:16-17]` verbatim: `The host runs \`node tools/grugops/test-skip-integrity.js .grugops/test-skips.md --skip-count <N>\`` / `with ONLY Node present — no ~/.grugops, no npm, no node_modules.`). Materialization is the established, and only working, delivery path. |
| Playwright MCP for authoring | Claude in Chrome for authoring | Chrome is Claude-Code-only and attended-only, breaking "degrade, never break" across the other four CLIs. All five hosts can register Playwright MCP. |

**Installation:** nothing is installed into this repo. The recipe documents what the *user's own
agent* invokes:

```bash
# the five host-CLI registrations live in the recipe (D-07); the server is npx-invoked
npx playwright install --with-deps chromium   # browser binaries — a real, pre-existing prerequisite
```

**Version verification:** run this session, 2026-09-07.

```
$ npm view @playwright/mcp version              → 0.0.80
$ npm view @playwright/mcp dist-tags            → { latest: '0.0.80', next: '0.0.79-alpha-1787869812000' }
$ npm view @playwright/mcp@0.0.78 version       → 0.0.78            (the pinned version still resolves)
$ npm view @playwright/mcp time                 → "0.0.78": 2026-07-09T19:13:33.398Z
                                                   "0.0.80": 2026-09-01T03:48:24.350Z
$ npm view @playwright/mcp license engines      → Apache-2.0 ; { node: '>=18' }
$ npm view @playwright/mcp bin                  → { 'playwright-mcp': 'cli.js' }
$ npm view @playwright/test version             → 1.63.0
$ npm view @axe-core/playwright version         → 4.13.0
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@playwright/mcp` | npm | `0.0.78` published 2026-07-09; `0.0.80` published 2026-09-01; package itself long-established | 6,364,011 / week (2026-08-31→09-06) | `github.com/microsoft/playwright-mcp` | **OK** | Approved — `npx`-invoked only, never added to `package.json` |
| `@playwright/test` | npm | mature | (not re-measured — already a documented kit pin, unchanged by this phase) | `github.com/microsoft/playwright` | **OK** | Approved — already in the kit |
| `typescript` | npm | mature | (already this repo's devDep) | `github.com/microsoft/TypeScript` | **OK** | Approved — dev/test only here; resolved from the target at runtime |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

Postinstall check: `npm view @playwright/mcp` returns a `scripts` block containing
`lint / roll / test / build / ctest / dtest / ftest / wtest / docker-rm / docker-run / npm-publish / docker-build`
and **no `postinstall`** — no install-time network or filesystem side effect. `[VERIFIED: npm registry]`

Note the audit is thin by design: **this phase installs nothing into this repository.** `package.json`
gains nothing (D-07), so the only supply-chain surface is what the *user's* agent `npx`-fetches at
its own discretion — which is precisely why D-08 pins the version rather than using `@latest`.

## Architecture Patterns

### System Architecture Diagram

```
  UAT Planner                    QE/E2E (workflow 06, new step per D-06)
       │                                   │
       │ business scenarios                │ explores the running app
       ▼                                   ▼
  ┌──────────────┐              ┌──────────────────────────┐
  │  UAT pack    │              │  @playwright/mcp@0.0.78  │  ← npx, HEADED by default,
  │ (typed notes)│              │  (agent's own machine)   │    --headless for CI
  └──────┬───────┘              └────────────┬─────────────┘
         │                                   │ authors (transcript is NEVER evidence)
         │                                   ▼
         │                     <e2e-dir>/uat/<ticket-id>.uat.spec.ts   ── committed, diff-reviewable
         │                                   │
         │                                   │ ┌───────────────────────────────────────┐
         │                                   ├─┤ §14 GATE (workflow 05), in order:     │
         │                                   │ │ install→lint→typecheck→unit→build     │
         │                                   │ │   → [NEW] uat-spec-integrity  ← D-13  │
         │                                   │ │   → e2e (quality.ui_e2e)              │
         │                                   │ │   → test-integrity                    │
         │                                   │ └───────────────┬───────────────────────┘
         │                                   │                 │
         │             ┌─────────────────────┴────────┐        │
         │             │ AST ban (D-14) │ browser probe│       │
         │             │  exit 0/1/2    │  (D-15)      │       │
         │             └───────┬────────┴──────┬───────┘       │
         │                     │ exit≠0        │ exit 0        │
         │                     ▼               ▼               ▼
         │        ┌────────────────────┐   spec re-run    READY_FOR_HUMAN_REVIEW
         │        │ LOUD SKIP / FAIL   │                       │
         │        │ observation note   │                       │ ONLY on green
         │        │ UAT stays pending  │                       ▼
         │        │ (D-15/D-16)        │        emitVerdict(task, id, "clean", HEAD_SHA*)
         │        └────────────────────┘                       │  *F-02: the SHA arg is NEW
         │                                                     ▼
         │                                    finding  by:§14-gate  refs:[§14-gate#<id>]
         │                                              body: READY_FOR_HUMAN_REVIEW …
         │                                                     │
         │                          artifact-ref { sha, gate_run, content_hash }
         │                                                     ▼
         │                                          admit()  ── D-03 refusal:
         │                                            sha ≠ verdict's HEAD → REFUSE, name both
         │                                                     │ admitted
         ▼                                                     ▼
  sign_off_acceptance checkpoint  ◄──────────── .grugops/context/<task>/notes/*.md
  (default block; Phase 30 matrix)                     │ render (freshness-gated)
         │ named human OR dialed                       ▼
         ▼                                      index.md + index.jsonl
  board: In UAT → Ready to Release


  ── ATTENDED SIDE LANE (Claude Code only, D-09/D-11/D-12) ──────────────────────
  human at the keyboard ── claude --chrome ── mcp__claude-in-chrome__* (visible window)
       │
       │ NO path to emitVerdict. NO §14-gate reference. Proven by test.
       ▼
  finding verified_by: human:<name>   ← name arrives ONLY via GRUGOPS_ADMISSION_APPROVED_BY
  + artifact-ref describing what was witnessed        read by the admission-guard hook
```

### Recommended Project Structure (grugops side)

```
scripts/runnable-ref/
├── uat-spec-integrity.ts        # NEW — authored .ts (name is Claude's Discretion)
├── uat-spec-integrity.js        # NEW — committed tsc output (freshness-gated)
└── uat-spec-integrity.test.ts   # NEW — unit tests incl. the loud-skip proving test
scripts/
└── context-io.ts                # EDIT — emitVerdict + SHA, composeNote + 3 fields, admit() + D-03
install/
├── install.ts                   # EDIT — one RUNNABLES entry (line ~2189)
├── uninstall.ts                 # EDIT — the mirrored RUNNABLES_MIRROR entry (line ~665)
└── README.md                    # EDIT — one short pointer section (D-07)
agent-factory/
├── checklists/browser-uat-recipe.md   # NEW — the single setup home
├── checklists/00-index.md             # EDIT — one row, exactly one tier
├── contracts/context-note.md          # EDIT — the three artifact-ref fields
├── workflows/05-pr-quality-gate.md    # EDIT — the new gate step
└── workflows/06-uat-pack.md           # EDIT — the QE/E2E authoring step (D-06)
```

### Pattern 1: The materialized-runnable contract (D-12), copy verbatim

`[VERIFIED: scripts/runnable-ref/test-skip-integrity.ts:21-27]` — quoted verbatim from the file:

```
// The D-12 contract (uniform across all kit-shipped runnables):
//   node <repo-local-path>/test-skip-integrity.js <registry> [--skip-count <N>] [--json] [--today <YYYY-MM-DD>]
//     exit 0 → pass / no findings
//     exit 1 → findings / fail (the quality gate blocks)
//     exit 2 → error (could not run — distinguishable from a clean "fail")
//     stdout → human-readable findings in CLEAR PROFESSIONAL VOICE (the audit trail)
//     stdout → optional machine-readable { ok, findings } block when invoked with --json
```

**When to use:** the new AST runnable adopts this exact contract. The gate already knows how to
branch on it, so the workflow-05 wiring is a copy of the test-integrity paragraph with a different
binary and a different meaning for exit `1`.

Note the mapping D-13/D-15 imply: the **browser-absent** loud skip and the **`typescript`-absent**
loud skip are both "could not run" → **exit 2**, not exit 1. Exit 1 is reserved for a real
AST-ban finding. Keeping those distinct is what stops "browsers missing" from reading as
"the spec is dirty" — and both leave the UAT `pending`.

### Pattern 2: The loud-skip idiom, verbatim

`[VERIFIED: scripts/e2e/uat-live.test.ts:82-84]` — the exported constant, quoted verbatim:

```typescript
// EXACT distinct sentinel — frozen as an exported const so the proving test asserts it byte-for-byte.
export const LOUD_SKIP_MARKER =
  "SKIPPED: claude CLI absent or unauthed — UAT A1/A2/A3 NOT exercised; status stays pending";
```

`[VERIFIED: scripts/e2e/uat-live.test.ts:86-104]` — the fail-closed probe, quoted verbatim:

```typescript
export function claudePresentAndAuthed(): boolean {
  try {
    const which = spawnSync("claude", ["--version"], { encoding: "utf8", input: "", timeout: 20_000 });
    if (which.status !== 0 || which.error != null) return false;
    const auth = spawnSync("claude", ["auth", "status", "--json"], { encoding: "utf8", input: "", timeout: 20_000 });
    if (auth.status !== 0) return false; // exit 1 = not logged in
    return JSON.parse(auth.stdout)?.loggedIn === true; // belt-and-suspenders
  } catch {
    return false; // fail-closed → loud skip, never green
  }
}
```

`[VERIFIED: scripts/e2e/uat-live.test.ts:106-118]` — the single emission point, quoted verbatim:

```typescript
export function emitLoudSkipIfUnavailable(
  probe: () => boolean = claudePresentAndAuthed,
): boolean {
  if (probe()) return true;
  // LOUD skip: a distinct marker on a non-default channel so it can never be mistaken for a pass.
  console.warn(LOUD_SKIP_MARKER);
  process.stderr.write(`${LOUD_SKIP_MARKER}\n`);
  return false;
}
```

**Three structural properties to clone, not just the shape:** (1) the marker is an **exported
const** so a proving test asserts it byte-for-byte; (2) the probe is **injectable** so the
unavailable branch can be forced in a test — the file's own comment calls this "the test-of-the-test";
(3) the probe is **fail-closed** (`catch { return false }`), so an inconclusive probe skips rather
than greens. All three are required for D-15's two markers, and the second is what distinguishes a
correct loud skip from a forbidden silent `it.skip` — both otherwise exit 0.

### Pattern 3: `emitVerdict` as the sole author, and the recognizer it must stay in lockstep with

`[VERIFIED: scripts/context-io.ts:985-1008]` — quoted verbatim:

```typescript
// A §14-gate verdict is itself a context note (it dogfoods the schema — not a separate ledger).
// A note is a LIVE GREEN verdict for per-run id <id> exactly when ALL of:
//   - kind === "finding"
//   - by === "§14-gate"   (the reserved gate identity)
//   - refs includes the literal "§14-gate#<id>"   (the per-run id this verdict certifies)
//   - body contains the green terminal marker "READY_FOR_HUMAN_REVIEW"
//   - it is LIVE (not folded out by currentState — a superseded/withdrawn verdict must not admit)
const VERDICT_GREEN_MARKER = "READY_FOR_HUMAN_REVIEW";

function verdictStampFor(id: string): string {
  return `${GATE_IDENTITY}#${id}`;
}

function isLiveGreenVerdict(n: NoteRecord, id: string): boolean {
  return (
    n.kind === "finding" &&
    n.by === GATE_IDENTITY &&
    n.refs.includes(verdictStampFor(id)) &&
    n.body.includes(VERDICT_GREEN_MARKER)
  );
}
```

The comment three lines above `isLiveGreenVerdict` says, verbatim: `Keep emitVerdict and this
recognizer in lockstep with Plan 02.` **That instruction is directly load-bearing for F-02:** any
change to what `emitVerdict` composes must be walked against this recognizer, or `admit()` silently
stops matching real verdicts.

### Pattern 4: The positional-argument precedent for adding the SHA

`[VERIFIED: scripts/context-io.ts:1037-1041]` — quoted verbatim:

```
// THE TEST-INTEGRITY FLOOR, AT ITS POINT OF EFFECT (plan 30-05, D-15/D-16). The third argument is
// the gate run's test-integrity result. It is REQUIRED and it is POSITIONAL — ahead of the two
// defaulted parameters — so that every existing call site had to be revisited rather than keep
// compiling against a default that would have made the floor decorative.
```

**When to use:** exactly here. The gate-run HEAD SHA is the same class of fact — a safety-relevant
input that must not acquire a silent default. Add it as a **required positional** parameter ahead of
`contextRoot`/`at`, so `tsc` forces every call site (including `scripts/context-io.ts:2457`'s CLI
verb and the tests) to be revisited. A defaulted `sha = ""` would make D-03's refusal decorative in
exactly the way this comment warns about.

### Anti-Patterns to Avoid

- **Adding a second author of `by: §14-gate`.** `emitTrusted` exists precisely so that "adding an
  emitter therefore cannot add a way to write" `[VERIFIED: scripts/context-io.ts:1094-1101]`. Route
  everything through it.
- **Pre-checking the SHA at the gate as well as in `admit()`.** D-03 forbids it and the CONTEXT
  marks it one-way. Two implementations of one predicate is the named failure class.
- **Emitting the three new scalars on every note kind.** `composeNote` writes a fixed 8-line fence;
  unconditional emission changes the bytes of every note ever written, which collides with the
  compactor's raw→promoted byte-equality checks and the byte-reproducible render. Emit them
  conditionally on `kind === "artifact-ref"` (see §"Note-schema blast radius").
- **Regex-matching the spec for `if`/`try`.** UATX-06's whole point is that the claim matches the
  mechanism. A regex would also false-positive on the strings, comments and selectors a Playwright
  spec is full of.
- **Using `ts.createProgram`.** See §"Alternatives Considered".
- **Putting a Chrome tool name into a non-Claude-Code adapter.** D-12 forbids a dead tool name
  anywhere; the statement lives once, in the recipe.
- **Treating a browser-absent skip as exit 1.** It is "could not run" → exit 2. Conflating the two
  makes an environment problem look like a spec defect.
- **Hand-editing a committed `.js`.** The freshness gate rebuilds to a temp dir and fails red on drift.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parsing a `.ts` spec to find banned constructs | A regex scanner, or a hand-written tokenizer | `ts.createSourceFile` + `ts.forEachChild` (syntax-only) | UATX-06 *names* the AST as the mechanism. Verified working on `typescript@6.0.3` this session. |
| Hashing the spec bytes | A custom digest, or shelling to `shasum` | `node:crypto` `createHash("sha256")` — the exact two-site idiom already in this repo | Cross-platform, zero deps, and matches `generate-hook-manifest.ts` / `hook-entry.ts` byte-for-byte. |
| Getting the gate-run HEAD | Parsing `.git/HEAD` by hand | `git(["rev-parse", "HEAD"])`, the arg-array spawn already in `scripts/freshness.ts:147` | Handles detached HEAD, packed refs, worktrees. Arg-array avoids the DEP0190 shell hazard the e2e file already documents. |
| Composing / validating a note | A new writer | `composeNote` → `appendNote` / `emitTrusted` in `context-io.ts` | `context-io.ts` is "the ONLY sanctioned write path", enforced by the `guard_context_writes` foundation guard. |
| Delivering a checker to a host repo | A `npx`-published package, or a path into `~/.grugops` | `RUNNABLES` materialization into `tools/grugops/` | The host has no kit, no npm and no `node_modules`. |
| Detecting attended vs API-key auth | Sniffing config files, or an env-var check alone | `claude auth status --json` — it exposes `authMethod`, `apiProvider` and `apiKeySource` (see §F-04) | Measured this session. Strictly more informative than the `ANTHROPIC_API_KEY` check D-10 assumed would be the whole predicate. |
| Deciding which specs to check | A hand-maintained list of spec paths | A glob over `**/uat/*.uat.spec.ts`, with the derived count asserted | Phase 27's set-literal-drift lesson: derive the set, assert the count. A hand list goes short in silence. |

**Key insight:** almost every "new" capability in this phase is an *existing* grugops mechanism
pointed at a new artifact. The genuinely new code is (1) the AST walk and (2) the two probes. Everything
else is an edit to a single existing authority. Plans that create parallel machinery here are the
failure mode this repo has spent thirteen verification rounds eliminating.

## Runtime State Inventory

Phase 31 is additive, not a rename or migration — but it *changes the bytes of a derived, committed
artifact*, so the inventory is not vacuous.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **`.grugops/context/<task>/notes/*.md`** — existing note files carry the 8-key fence. Adding fields **conditionally** (artifact-ref only) leaves every existing note byte-identical; adding them unconditionally rewrites the expected shape of all of them. | Code edit only, **if** the emission is conditional. No data migration. Verify by re-rendering an existing task and diffing. |
| Derived committed artifacts | **`index.md` + `index.jsonl`** per task — byte-reproducible, freshness-gated via `scripts/context-freshness.ts`, which mirror-spawns the render into a temp tree and compares. `toJsonl` has a FIXED key order `[VERIFIED: scripts/context-io.ts:1581-1591]`. | Any render change requires re-running `node scripts/context-io.js render <task>` for every live task and committing the result, or `freshness:context` goes red. |
| Live service config | None — grugops registers no external service. The five MCP registrations live in the *user's* CLI config and are documented, never written by grugops. | None. |
| OS-registered state | None. Claude in Chrome installs a native-messaging host file (paths listed in the vendor doc, e.g. macOS `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json`) — but **Claude Code installs it, not grugops**. | None for grugops. Worth one sentence in the recipe so a human debugging the lane knows where to look. |
| Secrets/env vars | `GRUGOPS_ADMISSION_APPROVED_BY` is **reused unchanged** (D-11). No new variable. `ANTHROPIC_API_KEY` / `ANTHROPIC_AUTH_TOKEN` are **read** by the probe, never set. | None — code reads only. |
| Build artifacts / installed packages | The new `scripts/runnable-ref/<name>.js` must be **committed** and must be a faithful `tsc` build (freshness + `check:build-parity`). Host repos that already installed grugops will **not** receive the new runnable until they re-run the installer — `materializeRunnable` is never-overwrite, but it does add missing files on a re-run. | Run `npm run build`; commit the `.js`. Document that an existing install needs a re-run to pick up the new runnable. |
| Hook manifest | `scripts/generate-hook-manifest.ts` sha256s hook files; **no hook changes in this phase** (D-09 explicitly declines a hook denial on the Chrome MCP tools). | None — confirm no `hooks/` file is touched. |

## Common Pitfalls

### Pitfall 1: The verdict note has no SHA to compare against (blocking for UATX-04)

**What goes wrong:** D-03 is written as if the comparison already has both operands. It does not.
`emitVerdict` composes a note whose entire run linkage is `refs: [§14-gate#<id>]` and a one-sentence
body. `[VERIFIED: scripts/context-io.ts:1076-1090]` — quoted verbatim:

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

There is no `sha`, no HEAD, nothing git-derived anywhere in it.

**Why it happens:** the CONTEXT decision was written from the design intent, not from the current
source. It is a real gap, not a misreading.

**How to avoid:** make "add the gate-run HEAD SHA to `emitVerdict`" an explicit, *early* task that
every other UATX-04 task depends on. Then walk the four consumers the file itself names:
`isLiveGreenVerdict` (the lockstep comment), the `emit-verdict` CLI verb at
`scripts/context-io.ts:2457`, the existing `emitVerdict` tests, and `admit()` (which must now read
the matched verdict's SHA, not just confirm the verdict exists).

**Warning signs:** a plan task that says "add the SHA refusal to `admit()`" with no upstream task
touching `emitVerdict`. That plan cannot work, and the tests will pass anyway if they only assert
the refusal fires on a hand-built fixture verdict.

### Pitfall 2: Unconditional new fence fields move every note's bytes

**What goes wrong:** `composeNote` emits a hard-coded 8-line fence. `[VERIFIED: scripts/context-io.ts:~840-856]`
— quoted verbatim:

```typescript
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
```

Adding three lines unconditionally changes the composed bytes of *every* note, including the
compactor's `composeThreadNote` counterpart, which is subject to raw→promoted byte-equality checks.

**Why it happens:** it is the obvious edit, and it typechecks.

**How to avoid:** emit the three scalars only when `kind === "artifact-ref"`. Reading is already
free: `parseNote` accepts any scalar key matching `^([A-Za-z_]+):\s*(.*)$`
`[VERIFIED: scripts/context-io.ts:~1043]`, and `sha`, `gate_run`, `content_hash` all match that
charset (no digits, no hyphens needed). So the **parser needs no change at all** — only the
composer, the `NoteInput`/`NoteRecord` types, the validator's required-when-artifact-ref rule, the
`assertSingleLine` guards, `toJsonl`, and the `index.md` render.

**Warning signs:** `scripts/compactor.test.ts` byte-equality assertions going red, or a
`freshness:context` failure on a task nobody edited.

### Pitfall 3: The AST checker's spec set drifts short in silence

**What goes wrong:** the runnable walks a hand-built list of paths, or a glob that quietly matches
nothing, and reports "0 findings, pass". Green suite, zero coverage. This is the exact
set-literal-drift class the repo has already been bitten by.

**How to avoid:** derive the set from the `*.uat.spec.ts` glob (D-05 makes the suffix the recognition
key), **and report the count on the pass line** — the repo's own convention. `[VERIFIED: scripts/check-foundation-guards.ts:1560-1562]`
— quoted verbatim: `On success it REPORTS BOTH DERIVED NUMBERS rather than printing a bare PASS (the established` /
`"guards report what they checked" convention). A line reading \`0 roles\` would then be visible as` /
`the anomaly it is instead of hiding behind the word PASS.` Apply that verbatim: a pass line reading
`0 uat specs checked` must be visible as the anomaly it is.

Note the second-order trap the same file warns about (P29's vacuity-floor lesson in project memory):
a floor that catches an **empty** denominator does not catch a **silently short** one. Derive the
spec count independently of the loop that consumes it.

### Pitfall 4: D-08 tells you to clone an idiom that does not exist

**What goes wrong:** the planner writes "copy the `@playwright/test 1.62.1` pin assertion" as a task
and the executor cannot find one.

**Evidence:** `grep -rn "1\.62\.1\|4\.12\.1" --include=*.ts --include=*.js --include=*.json scripts/ install/ hooks/`
returns **no matches**. The only `1.62.1` in the repo is the prose line in the recipe itself and the
Phase-28 audit doc. There is no version-pin foundation guard.

**How to avoid:** plan the pin guard as **new construction**. The transferable idiom is the general
one this file uses everywhere — one literal declared once, a derived scan set, and a two-sided
assertion — not a specific existing version check.

### Pitfall 5: Gate step position vs. "same slot family"

**What goes wrong:** the AST runnable is wired after the e2e lane because `test-skip-integrity.js`
runs there, and dirty specs get executed before they are rejected.

**Evidence:** the gate order is `install -> lint -> typecheck -> unit -> build -> e2e -> test-integrity`
`[VERIFIED: agent-factory/workflows/05-pr-quality-gate.md:31]`. `test-skip-integrity` runs *after*
e2e specifically because it needs the skip count e2e produces
`[VERIFIED: agent-factory/workflows/05-pr-quality-gate.md:37]` — verbatim: `Run test-integrity **after** unit and e2e, which produce the skip count.`
The AST checker consumes **no run output**, so that constraint does not apply to it.

**How to avoid:** read CONTEXT's "same slot family as `test-skip-integrity.js`" as the *invocation
idiom* (materialized checker, exit 0/1/2, human-only branch on non-zero) — which is what the CONTEXT
text actually enumerates — not as the position. Place it **before** the e2e lane.

### Pitfall 6: `sf.parseDiagnostics` is not in the public type surface

**What goes wrong:** the runnable reads `sourceFile.parseDiagnostics` to reject a spec that does not
parse, and `tsc` errors because the property is marked internal in `typescript.d.ts`.

**Evidence:** the property is present and populated at runtime (verified this session — a valid spec
returned `parseDiagnostics 0`), but it is not part of the published `SourceFile` type.

**How to avoid:** either cast at the one access site with a named local type, or detect an unparseable
spec by a different route. Decide it once, in the source, with the reason written down — this is a
one-line decision that otherwise gets rediscovered in code review.

### Pitfall 7: The board column is `Ready to Release`, not `Ready`

**What goes wrong:** the plan writes a board transition to a column that does not exist.

**Evidence:** `[VERIFIED: plans/board.md:69-70]` — verbatim rows: `| In UAT | business acceptance | UAT Planner | 4 |`
and `| Ready to Release | UAT signed off | Release Manager | 4 |`. Workflow 06 confirms the flow
`[VERIFIED: agent-factory/workflows/06-uat-pack.md:30]` — verbatim: `the ticket moves to \`Ready to Release\` (or directly to \`Done\` in lean mode)`.

D-04's shorthand "In UAT → Ready" means `In UAT → Ready to Release`. Use the real column names.

### Pitfall 8: A new checklist enters derived text-gate scan sets automatically

**What goes wrong:** `browser-uat-recipe.md` lands and an unrelated voice/lexicon gate goes red.

**Evidence:** `[VERIFIED: scripts/check-imperative-lexicon.ts:397]` — verbatim:
`{ name: "checklists", members: flatMarkdown(CHECKLISTS_DIR) },`. The checklist set there is
**derived**, so the new file is in scope the moment it is written.

**How to avoid:** write the recipe to the Phase 29 writing profile from the first draft, and run
`npm run check:imperative-lexicon`, `check:banned-claims`, `check:public-docs` and `check:claim-anchors`
as part of the task that creates it — not as a later fix-up. The good news: `guard_kit_counts` pins
roles, workflows, skill adapters and plugin skills — **not checklists** — so there is no cardinality
constant to bump `[VERIFIED: scripts/check-foundation-guards.ts:1563-1615]`.

## Code Examples

### The TypeScript AST checker — verified API surface

Run this session against the repo's own `typescript@6.0.3`; every symbol below was confirmed present
and a real `.uat.spec.ts`-shaped source parsed to 64 nodes with 0 parse diagnostics.

```
$ node -e "const ts=require('typescript'); ..."
isTryStatement function          isIfStatement function
isConditionalExpression function isBinaryExpression function
isCallExpression function        isPropertyAccessExpression function
isIdentifier function            isCatchClause function
forEachChild function            createSourceFile function
getLineAndCharacterOfPosition function
ScriptTarget.Latest 99
tokens 57 56 61                  (BarBarToken, AmpersandAmpersandToken, QuestionQuestionToken)
nodes walked 64 parseDiagnostics 0
```

```typescript
// Source: TypeScript compiler API, surface verified locally 2026-09-07 against typescript@6.0.3.
// Shape only — the real runnable is a committed .js authored in scripts/runnable-ref/.
import { createRequire } from "node:module";
import { join } from "node:path";

// D-13: the parser comes from the TARGET repo, never from grugops.
// A failure here is a LOUD SKIP naming `typescript`, exit 2 — never a pass.
const requireFromTarget = createRequire(join(process.cwd(), "package.json"));
const ts = requireFromTarget("typescript");

const sf = ts.createSourceFile(
  specPath,
  sourceText,
  ts.ScriptTarget.Latest,
  /*setParentNodes*/ true,   // needed to walk upward from an `expect` to its enclosing context
  ts.ScriptKind.TS,
);
```

**The walk, mapped to D-14's three locked arms.** Report a finding with
`ts.getLineAndCharacterOfPosition(sf, node.getStart(sf))` so the message names file:line.

| D-14 arm | Node kinds to detect | Notes |
|----------|---------------------|-------|
| **(a)** `expect`/`assert` inside a `try` block or `catch` clause | `ts.isTryStatement` → descend `node.tryBlock` and `node.catchClause` (`ts.isCatchClause`); flag any `CallExpression` whose callee head identifier is `expect` or `assert` | Also covers `finally` if the planner wants it — but D-14 names `try` block and `catch` clause, so **stay at exactly that**. |
| **(b)** `expect` under `if`/`else`, a conditional expression, a `\|\|`/`&&`/`??` operand, or an optional call | `ts.isIfStatement` → `thenStatement` / `elseStatement`; `ts.isConditionalExpression` → `whenTrue` / `whenFalse`; `ts.isBinaryExpression` with `operatorToken.kind` ∈ `{BarBarToken(57), AmpersandAmpersandToken(56), QuestionQuestionToken(61)}`; optional call = `CallExpression`/`PropertyAccessExpression` carrying a `questionDotToken` | The token numbers are recorded for cross-checking only — **compare against `ts.SyntaxKind.*`, never the literal integers**, which are not stable across TypeScript versions. |
| **(c)** `test.skip` / `test.fixme` / `test.only` / `describe.skip` / `describe.only` / `expect.soft` | `ts.isCallExpression` whose `expression` is `ts.isPropertyAccessExpression` with `isIdentifier(expr.expression)` in `{test, describe, expect}` and `expr.name.text` in the matching member set | Declare the six banned pairs as **one exported constant** that the recipe's prose quotes, so the claim and the mechanism share a single source (D-14's "the claim matches the mechanism"). |

**Set-boundary note for the planner.** The research brief mentioned `.catch` as a candidate. D-14's
locked set does **not** include a promise `.catch()` handler, and it does not include the
zero-`expect` vacuity case (explicitly deferred). Ship exactly the locked set. If a red-team later
shows `.catch()` matters, that is a gap-closure round with a new decision — not a quiet widening,
which is the failure mode Phase 27 closed by defining a canonical form instead of widening a parser
a twelfth time.

### The three new `artifact-ref` fields — what actually has to change

`parseNote` already accepts them. `[VERIFIED: scripts/context-io.ts:~1041-1049]` — quoted verbatim:

```typescript
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const val = kv[2].trim();
```

`sha`, `gate_run` and `content_hash` all match `^[A-Za-z_]+$`. **No parser change is needed.**

The JSONL render does not. `[VERIFIED: scripts/context-io.ts:1580-1592]` — quoted verbatim:

```typescript
function toJsonl(n: NoteRecord): string {
  return JSON.stringify({
    id: n.id,
    kind: n.kind,
    by: n.by,
    at: n.at,
    verified_by: n.verified_by,
    confidence: n.confidence,
    refs: n.refs,
    supersedes: n.supersedes,
  });
}
```

Fixed key order, no extension point.

### Five-CLI MCP registration matrix

`[CITED: github.com/microsoft/playwright-mcp README]`, fetched 2026-09-07. Shown with `@latest` as
the upstream README writes it; **the recipe must substitute the D-08 pin** (`@playwright/mcp@0.0.78`)
in every one of the five.

| Host CLI | Registration | Config file |
|----------|-------------|-------------|
| Claude Code | `claude mcp add playwright npx @playwright/mcp@latest` | managed by the CLI |
| Codex CLI | `codex mcp add playwright npx "@playwright/mcp@latest"` | or `~/.codex/config.toml` → `[mcp_servers.playwright]` with `command = "npx"`, `args = ["@playwright/mcp@latest"]` |
| Gemini CLI | standard MCP config block: `"command": "npx"`, `"args": ["@playwright/mcp@latest"]` | Gemini `settings.json` |
| OpenCode | `"mcp": { "playwright": { "type": "local", "command": ["npx", "@playwright/mcp@latest"], "enabled": true } }` | `~/.config/opencode/opencode.json` |
| GitHub Copilot CLI | `/mcp add`, or `"mcpServers": { "playwright": { "type": "local", "command": "npx", "tools": ["*"], "args": ["@playwright/mcp@latest"] } }` | `~/.copilot/mcp-config.json` |

Behaviour facts the recipe must state `[CITED: github.com/microsoft/playwright-mcp README]`:
**headed by default** — `--headless` must be opted into, which is the CI-relevant one; `--isolated`
keeps the browser profile in memory rather than on disk; Node 18+.

Empirical corroboration, offered as an observation rather than a claim: this session's own
`claude mcp list` reports `plugin:playwright:playwright: npx @playwright/mcp@latest - ✔ Connected`,
so the Claude Code registration shape is live and working on this box.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Agent narrates what it saw in a browser; the narration is the UAT record | The agent authors a committed spec; the **gate re-runs it** and the spec is the evidence | This phase (UATX-01) | A transcript is unauditable and unreproducible; a `.spec.ts` is reviewable in a diff and re-runnable by anyone. |
| `@playwright/mcp@0.0.78` (STACK.md, measured 2026-07-28) | registry `latest` is now `0.0.80` (published 2026-09-01) | 2026-09-01 | Pre-1.0: flags and tool names can move between patch releases, which is exactly why D-08 pins rather than tracking `latest`. See §F-01. |
| `@playwright/test 1.62.1` / `@axe-core/playwright 4.12.1` (kit pins) | registry `latest` is `1.63.0` / `4.13.0` | since the Phase 28 audit | **Out of Phase 31 scope** (D-08 concerns `@playwright/mcp` only). Recorded so the planner does not scope-creep into refreshing them. |
| Claude in Chrome under API-key auth merely 403'd on every call | Claude Code **keeps Chrome integration off** entirely under API-key or `setup-token` auth, even with `--chrome` | Claude Code v2.1.216 | `[CITED: code.claude.com/docs/en/chrome]`. This is the vendor-side half of D-09's structural bar — the lane cannot open in the configuration where no human is present. |

**Deprecated/outdated:**
- `docs.claude.com/en/docs/claude-code/*` — 301-redirects to `code.claude.com/docs/en/*`. Use the
  latter in the recipe (CLAUDE.md already says so).

## Claude in Chrome: what the vendor doc actually says

All `[CITED: code.claude.com/docs/en/chrome]`, fetched 2026-09-07. These are the facts the recipe's
D-12 paragraph and the D-09 bar rest on.

| Fact | Doc language |
|------|-------------|
| It is an MCP server named `claude-in-chrome` | "If your organization blocks the `claude-in-chrome` MCP server with the `deniedMcpServers` managed setting, Claude Code doesn't show the install prompt." Tools are listed via "Run `/mcp`, select `claude-in-chrome`, then select **View tools**". |
| Visible window only — no headless | "Browser actions run in a visible Chrome window in real time. When Claude encounters a login page or CAPTCHA, it pauses and asks you to handle it manually." |
| API-key / `setup-token` auth disables it | "If you authenticate with an API key or a long-lived token from `claude setup-token`, Claude Code keeps Chrome integration off, even when you pass `--chrome`, because the browser extension can't authenticate with those credentials. Before v2.1.216, these sessions could enable Chrome integration, but every attempt to connect to the browser extension failed with a 403 error." |
| Requires a direct Anthropic plan + `/login` | Prerequisites list "A direct Anthropic plan (Pro, Max, Team, or Enterprise)"; "Chrome integration also requires signing in with `/login`." |
| Not WSL, not third-party providers | "Chrome integration isn't supported in Windows Subsystem for Linux (WSL)." / "Chrome integration is not available through third-party providers like Amazon Bedrock, Google Cloud's Agent Platform, or Microsoft Foundry." |
| Extension ≥ 1.0.36 | "Claude in Chrome extension … version 1.0.36 or higher" |
| Context cost of enabling by default | "Enabling Chrome by default in the CLI increases context usage since browser tools are always loaded." |

**The doc says nothing about subagents.** Neither the Chrome page nor the sub-agents page addresses
the combination.

### The subagent-reachability question (roadmap's `UNKNOWN - verify`)

**What is documented** `[CITED: code.claude.com/docs/en/sub-agents]`:
- "Subagents inherit the built-in tools and MCP tools available in the main conversation, narrowed by two filters..."
- `tools` frontmatter: "Inherits every tool available to subagents if omitted."
- "Both fields accept MCP server-level patterns in addition to exact tool names: `mcp__<server>` or `mcp__<server>__*` grants or removes every tool from the named server."

**What is observed in this environment:**
- `~/.claude/agents/gsd-dom-verifier.md` declares, verbatim: `tools: Read, Write, Glob, Grep, mcp__chrome-devtools__*, mcp__claude-in-chrome__*` — evidence that the pattern is *intended* to work, not evidence that it does.
- `claude mcp list` on this box lists seven connected servers and **`claude-in-chrome` is not among them** — Chrome integration is not enabled here, so this environment cannot falsify or confirm the specific combination. This is *no observation*, not a negative result.

**Disposition: `UNKNOWN - verify`, and deliberately so.** The general inheritance rule is
documented and `claude-in-chrome` is an MCP server, so the rule applies to it by construction — but
Chrome integration is session-scoped and gated on `--chrome`/`/chrome`, and that interaction with
subagent spawning is undocumented. Confirming it requires an attended Claude Code session with the
extension installed and `--chrome` active. Per the roadmap's own flag, **the phase's core
recommendation does not depend on the answer.**

**Design recommendation that makes the answer irrelevant.** Run the Chrome lane in the **main
thread** (the Orchestrator), never in a spawned role subagent. Three independent reasons converge:
(1) the lane is attended by definition — the doc says Claude "pauses and asks you to handle it
manually" — and a subagent is the wrong place for a human-in-the-loop pause; (2) enabling Chrome
loads browser tools into context permanently, a cost the doc explicitly calls out, and paying it in
a subagent buys nothing; (3) it removes the `UNKNOWN` from the critical path entirely. Record this
as the recipe's stated flow, with the open question noted honestly beside it.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `mcp__claude-in-chrome__*` tools are reachable from a Claude Code subagent, by the general MCP-inheritance rule | Claude in Chrome | LOW — the recommended design (main-thread-only lane) does not use subagent reachability. If wrong, nothing in the plan changes. Left as `UNKNOWN - verify` in the recipe. |
| A2 | On a machine with **no** interactive login at all (API-key-only), `claude auth status --json` reports `loggedIn: false` or an `apiKeySource` | §F-04 | MEDIUM — the D-10 predicate would need a third clause. Mitigated by making the predicate **fail-closed**: anything not matching the known-good attended shape is a loud skip. Not falsifiable on this box (it has a live claude.ai login that cannot be removed non-destructively). |
| A3 | `claude setup-token` sessions surface distinguishably in `claude auth status --json` | §F-04 | MEDIUM — same mitigation as A2. The vendor doc confirms Chrome is *off* in those sessions, so the lane fails safe regardless of what the JSON says; the probe's job is only to explain *why* it skipped. |
| A4 | The `authMethod` / `apiKeySource` / `apiProvider` field names are stable across Claude Code versions | §F-04 | MEDIUM — a field rename would make the probe skip loudly (fail-closed), never silently pass. Recommend the probe treat unknown/missing fields as "not attended". Measured on **one** version: `2.1.263`. |
| A5 | Emitting the three new scalars conditionally (artifact-ref only) leaves the compactor's byte-equality checks and every `freshness:context` render unchanged | Pitfall 2 | MEDIUM — if a render or a fixture proves otherwise, the `refs`-encoding alternative in §"Alternatives Considered" is the fallback, and it needs a user decision because D-01 locks the field shape. Verify with a RED-first test before writing the composer change. |
| A6 | `.uat.spec.ts` files will live under a `uat/` subfolder of an E2E directory the target repo already has | D-05 (locked) | LOW — a target with no E2E directory is the browser-absent case, which already loud-skips. |
| A7 | Adding a checklist file does not trip any pinned cardinality | Pitfall 8 | LOW — `guard_kit_counts` was read and pins roles/workflows/skill-adapters/plugin-skills only. The `CHECKLISTS` literal in `validate-agent-factory.ts:205` is existence-only and already omits 3 of the 14 files on disk. |
| A8 | The Windows leg of both browser probes is unverified | Environment Availability | Carried forward from CONTEXT as `UNKNOWN - verify` (WINDOWS.md posture). Not testable here (darwin). |

## Open Questions

1. **The pin literal: `0.0.78` or `0.0.80`?**
   - What we know: D-07/D-08 lock the literal `@playwright/mcp@0.0.78`. `0.0.78` was published 2026-07-09 and still resolves. `latest` moved to `0.0.80` on 2026-09-01, after STACK.md measured the ecosystem.
   - What's unclear: whether the user wants the phase to ship the pin as decided, or to re-pin to current before the guard freezes it in place.
   - Recommendation: **do not re-open unilaterally.** Implement `0.0.78` exactly as locked, and surface this as a one-line confirm to the user during planning. D-08's own design makes a bump "one edit plus re-pin", so the cost of deferring is genuinely one line — but the cost of shipping a guard that freezes a two-releases-stale pre-1.0 pin without anyone noticing is a stale-by-default kit.

2. **Does `admit()` need the verdict's SHA, or the git HEAD at write time?**
   - What we know: D-03 says "a note whose SHA is not the HEAD the gate ran against is refused" — that is the **verdict's** recorded HEAD, which F-02 shows must first be added.
   - What's unclear: whether `admit()` should *also* independently confirm the recorded HEAD is a real commit.
   - Recommendation: no. One authority per predicate. `admit()` compares two recorded strings; it does not shell out to git. Adding a git call inside the admission path introduces an I/O failure mode into a write path whose whole contract is "refuse cleanly, write nothing".

3. **Which tier for `browser-uat-recipe.md`?**
   - What we know: this is explicitly Claude's Discretion. Its nearest sibling `playwright-visual-regression-recipe.md` is `tier: enterprise`; `uat-checklist.md` is `tier: lean`. All 13 tiered checklists were enumerated this session.
   - Recommendation: **enterprise**, matching the sibling recipe and `linter-recommendations.md` — both are "how to set up a gate lane" documents rather than "checks to run on every ticket". The lean tier is the always-active set, and browser UAT is dialed behind `quality.ui_e2e`. Frontmatter must be `kind: checklist` + `tier: enterprise`, and the row goes in exactly one 00-index table.

4. **Where does the `emit-verdict` CLI verb get the HEAD SHA?**
   - What we know: the verb signature today is `node scripts/context-io.js emit-verdict <task> <id> <integrity> [contextRoot]` `[VERIFIED: agent-factory/workflows/05-pr-quality-gate.md:47]`.
   - What's unclear: whether the SHA becomes a fourth positional argument the gate passes, or the CLI derives it via `git rev-parse HEAD`.
   - Recommendation: **a required positional argument**, matching the `<integrity>` precedent — the gate procedure already holds the fact, and the file's own comment warns against "a second parser inside a safety path". Deriving it inside `emitVerdict` would be exactly that. This is a workflow-05 prose edit as well as a code edit; plan both in the same task.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | ✓ | 22+ (hard prerequisite, already documented) | — |
| `typescript` (this repo, dev) | AST runnable's unit tests | ✓ | 6.0.3 | — |
| `typescript` (target repo, runtime) | AST runnable at the gate | n/a — target-dependent | — | **D-13 loud skip naming `typescript`, exit 2, UAT stays pending** |
| `@playwright/test` (target repo) | D-15 stage 1 probe | n/a — target-dependent | — | **D-15 loud skip, exit 2, UAT stays pending** |
| Playwright browser binaries | D-15 stage 2 probe / the e2e lane | n/a — target-dependent | — | **D-15 loud skip, exit 2, UAT stays pending** |
| `@playwright/mcp` | spec authoring (user's agent) | ✓ reachable on npm; live in this session as `plugin:playwright:playwright` | `0.0.78` pinned / `0.0.80` latest | Agent authors the spec by hand; the evidence floor is unaffected. |
| `claude` CLI | D-10 auth probe | ✓ | 2.1.263 | Fail-closed probe → loud skip |
| Claude in Chrome extension | the attended lane only | ✗ (not connected on this box) | — | Lane is absent; Playwright floor unaffected (D-12) |
| `git` | HEAD SHA for the verdict (F-02) | ✓ | — | A repo with no git is not a case the gate supports |

**Missing dependencies with no fallback:** none. Every target-side absence has a defined loud-skip
path that leaves the UAT `pending` — which is UATX-05 working as specified, not a blocker.

**Missing dependencies with fallback:** the Chrome extension (lane absent by design, D-12).

**Windows:** `UNKNOWN - verify` for both browser probes, carried forward from CONTEXT per the
WINDOWS.md posture. Not testable in this environment (darwin 25.5.0).

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `vitest` `~4.1.8` (devDep), `globals: false` — test fns imported explicitly |
| Config file | repo root; `tsconfig.tests.json` for test typechecking |
| Quick run command | `npx vitest run --exclude '**/scripts/e2e/**'` (the configured `workflow.test_command`) |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` then `npm run typecheck` + `npm run freshness` + `npm run check:build-parity` |
| Typecheck | `npx tsc --noEmit` (the configured `workflow.build_command`) |

**Do not run bare `npm test`.** It resolves to `vitest run`, which pulls in `scripts/e2e/uat-live.test.ts`
— the live `claude --print` lane. On an authed box that spends tokens and can hang for ~8 minutes.
The exclusion above is the project's standing convention.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UATX-01 | An MCP transcript / narration cannot produce a `§14-gate` stamp; only a gate run can | unit | `npx vitest run scripts/context-io.test.ts -t "verdict"` | ✅ existing file, new cases |
| UATX-02 | The pin literal appears once and every kit/doc mention equals it | unit (new guard + its test) | `npx vitest run scripts/check-foundation-guards.test.ts -t "playwright-mcp pin"` | ✅ existing file, new case |
| UATX-03 | The Chrome lane's source contains no `emitVerdict` / `§14-gate` reference; a Chrome-lane note claiming `by: §14-gate` is refused | unit | `npx vitest run scripts/context-io.test.ts -t "reserved identity"` + a new source-scan case | ❌ new source-scan test |
| UATX-04 | An `artifact-ref` whose `sha` ≠ the verdict's recorded HEAD is refused, naming both SHAs; a matching one is admitted | unit | `npx vitest run scripts/context-io.test.ts -t "sha"` | ✅ existing file, new cases |
| UATX-04 | `emitVerdict` records the HEAD SHA and `isLiveGreenVerdict` still matches | unit | `npx vitest run scripts/context-io.test.ts -t "emitVerdict"` | ✅ existing file, new cases |
| UATX-05 | Both loud-skip markers are emitted byte-for-byte on a forced-unavailable probe; the lane exits non-zero | unit (injectable probe) | `npx vitest run scripts/runnable-ref/<name>.test.ts -t "loud-skip"` | ❌ Wave 0 |
| UATX-06 | Each of D-14's three arms is REJECTED and a clean spec is ACCEPTED (mutation-proven discrimination) | unit (fixture corpus) | `npx vitest run scripts/runnable-ref/<name>.test.ts -t "ban set"` | ❌ Wave 0 |
| UATX-06 | The derived spec set is non-empty and its count is reported (vacuity floor + short-set floor) | unit | `npx vitest run scripts/runnable-ref/<name>.test.ts -t "derived set"` | ❌ Wave 0 |
| all | Committed `.js` is a faithful build of its `.ts` | gate | `npm run freshness && npm run check:build-parity` | ✅ existing |
| all | The new recipe passes the derived text gates | gate | `npm run check:imperative-lexicon && npm run check:banned-claims && npm run check:public-docs && npm run check:claim-anchors` | ✅ existing |
| all | Context renders are current | gate | `npm run freshness:context` | ✅ existing |

### Sampling Rate

- **Per task commit:** `npx vitest run --exclude '**/scripts/e2e/**'` + `npx tsc --noEmit`
- **Per wave merge:** add `npm run freshness`, `npm run check:build-parity`, `npm run freshness:context`, and `node scripts/check-foundation-guards.js`
- **Phase gate:** full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `scripts/runnable-ref/<name>.test.ts` — covers UATX-05 and UATX-06 (loud-skip proving test, ban-set corpus, derived-set floors)
- [ ] `scripts/runnable-ref/fixtures/` additions — one clean `.uat.spec.ts` plus one fixture per D-14 arm (the directory already exists)
- [ ] A source-scan test asserting the Chrome lane's absence-of-path (UATX-03 / D-09)

**Red-team obligation (project doctrine, not optional).** This phase ships a safety invariant — "an
MCP transcript can never become a gate stamp" — and project memory is unambiguous that a green suite
is not proof for that class. Budget for at least two independent adversarial passes on the D-09 bar
and the D-14 ban set, asking *how the gate is reached*, not only what it refuses. For the AST checker
specifically, the transferable probes from prior rounds are: after splitting a predicate into arms,
test their **union**; ask what the predicate's **input is assembled from** (which files reach the
walk at all); and ask **at which positions** the predicate is even asked, not only which constructs
it rejects.

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | The attended-lane probe (D-10) reads `claude auth status --json`; it **authenticates nothing itself** and must not be described as if it does. It is an environment posture check whose failure mode is a loud skip. |
| V3 Session Management | yes (indirectly) | Chrome integration is session-scoped; the `GRUGOPS_ADMISSION_APPROVED_BY` grant is session-scoped and per-call re-read by the admission-guard hook. Both residuals are already disclosed in `context-note.md`; Phase 31 adds no new session surface and must not weaken the disclosure. |
| V4 Access Control | yes | The reserved-identity rule is the access control: `emitTrusted` is the only path that may author `§14-gate`, and D-09's bar is enforced by that plus a source-scan test. |
| V5 Input Validation | yes | Three new fields enter the provenance fence from agent-supplied text. Each must pass `assertSingleLine` (the CR-01 field-injection guard — a newline in a provenance field smuggles extra frontmatter lines into the fence and forges a verified note). `content_hash` and `sha` should additionally be charset-validated (`^[0-9a-f]{40,64}$`-shaped), the same anchored-allowlist idiom as `TASK_NAME_RE` / `GATE_STAMP_RE`. |
| V6 Cryptography | yes | sha256 via `node:crypto` only. **`content_hash` is an integrity/identity digest, not a security token** — it is recomputable by anyone with the repo, exactly as D-02 says. The recipe must say so in the same terms the note-id nonce is already disclosed ("a collision-avoidance nonce, not a security token"). Never describe it as tamper-proof. |
| V12 File Resources | yes | The AST runnable walks target-supplied paths. Reuse the existing path-traversal posture: derive the spec set from a glob rooted at the repo, never from an argument that could escape it. |
| V14 Configuration | yes | The `npx @playwright/mcp@<pin>` invocation is a supply-chain surface owned by the *user's* agent. The pin (D-08) is the control; the recipe must state that `@latest` is not acceptable in a committed config. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| An agent narrates a passing browser check and writes it as a `finding` with a fabricated `§14-gate#<id>` | Spoofing | `admit()`'s existing live-green-verdict cross-check: a stamp matching no live verdict is refused. Unchanged by this phase — verify it still holds after the `emitVerdict` signature change. |
| An `artifact-ref` points at a spec that was edited after the gate ran | Tampering | D-02 `content_hash` + D-03 SHA refusal. Note the **disclosed residual**: transitive imports are not hashed, so a helper edit does not invalidate the evidence. State this in the recipe rather than claiming away. |
| A generated spec passes vacuously (all assertions swallowed) | Repudiation | D-14 arms (a) and (b). **Disclosed residual:** a spec with zero `expect` calls is explicitly NOT refused in this phase (deferred). The claim must name exactly the locked set. |
| Slopsquatted / typosquatted MCP server pulled by `npx` | Tampering / Elevation | The D-08 pin, plus the legitimacy audit above. `npx @latest` in a committed config is the anti-pattern. |
| A skip is read as a pass, hiding a broken browser lane | Repudiation | D-15/D-16: exit non-zero, distinct marker, `observation` note carrying the marker verbatim, UAT stays `pending`. The proving test is what makes this real. |
| The Chrome lane runs unattended under API-key auth and its output is taken as evidence | Spoofing | Two independent controls: the vendor-side force-disable (`[CITED: code.claude.com/docs/en/chrome]`) and the D-10 probe. Neither alone; both disclosed. |
| Provenance-field injection via a newline in `sha`/`gate_run`/`content_hash` | Tampering | `assertSingleLine` on each new field, plus a charset allowlist. This is the CR-01 mitigation already in place for every existing fence field. |

## Sources

### Primary (HIGH confidence)

Read directly from this repository this session:
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — the locked decisions, copied verbatim above
- `.planning/REQUIREMENTS.md:120-125, 212-217, 239` — UATX-01..06 and the traceability rows
- `scripts/context-io.ts` — the six-kind list (l.62-70), `GATE_STAMP_RE`/`HUMAN_STAMP_RE` (l.172-173), `parseNote` (l.~1010-1070), `composeNote` (l.~840), `noteId`, `toJsonl` (l.1580), `render` (l.1594), `isLiveGreenVerdict` + `VERDICT_GREEN_MARKER` (l.985-1008), `emitVerdict` (l.1027-1092), `emitTrusted` (l.1094+), `admit` (l.1415-1520)
- `agent-factory/contracts/context-note.md` — storage model, note identity, the provenance fence, the required-field rule
- `agent-factory/workflows/05-pr-quality-gate.md:31,35,37,41,44,45,47` — gate step order, the UI/E2E dial, the materialized-checker idiom, the human-only short-circuit, verdict emission on green only
- `agent-factory/workflows/06-uat-pack.md` — the four steps, the board move, `sign_off_acceptance`
- `agent-factory/workflows/16-context-read-write.md:21,33,54` — the two stamps, the finding-only rule, the artifact-ref trace role
- `scripts/e2e/uat-live.test.ts:82-118` — `LOUD_SKIP_MARKER`, `claudePresentAndAuthed`, `emitLoudSkipIfUnavailable`
- `scripts/runnable-ref/test-skip-integrity.ts:1-30` — the D-12 runnable contract and the builtins-only rule
- `install/install.ts:2180-2219` — `RUNNABLES` + `materializeRunnable` + the mirror warning; `install/uninstall.ts:646-703` — `RUNNABLES_MIRROR`
- `scripts/checkpoints.ts:127,164` — `sign_off_acceptance` on the roster, default `"block"`
- `scripts/audit-model.ts:265+` — `SAFETY_FLOORS` (four members; `sign_off_acceptance` is not one)
- `agent-factory/config/factory.config.md:68,71,162,205` — `quality.ui_e2e` values, `test_integrity`, the `sign_off_acceptance` roster row, the tightening-dial table
- `scripts/check-foundation-guards.ts:1549-1615` — `guard_kit_counts` (roles/workflows/skill-adapters/plugin-skills; no checklist count)
- `scripts/check-imperative-lexicon.ts:235,397` — the derived checklist scan set
- `scripts/validate-agent-factory.ts:205-217` — the hand-maintained `CHECKLISTS` existence list
- `scripts/generate-hook-manifest.ts:54`, `hooks/hook-entry.ts:190`, `scripts/freshness.ts:147` — the sha256 and `rev-parse` idioms
- `plans/board.md:53-100` — the real column names
- `agent-factory/checklists/*.md` — the 13 tiered frontmatter blocks and `00-index.md`'s two tables
- `package.json` — devDeps and the full script list

Measured directly this session:
- `claude --version` → `2.1.263 (Claude Code)`; `claude auth status --json` under three environment configurations (§F-04)
- `claude mcp list` → seven connected servers, `claude-in-chrome` absent
- `npm view @playwright/mcp {version,dist-tags,time,license,engines,bin,scripts}`; `npm view @playwright/test version`; `npm view @axe-core/playwright version`; `api.npmjs.org` weekly downloads
- `node -e` TypeScript compiler-API surface probe + a real `.uat.spec.ts`-shaped parse on `typescript@6.0.3`

### Secondary (MEDIUM confidence)

- `code.claude.com/docs/en/chrome` (fetched 2026-09-07) — the `claude-in-chrome` MCP server, visible-window-only, API-key/`setup-token` force-disable, plan + `/login` requirement, no WSL, no Bedrock/Vertex/Foundry, extension ≥1.0.36, `deniedMcpServers`, context cost
- `code.claude.com/docs/en/sub-agents` (fetched 2026-09-07) — MCP tool inheritance, `tools` omitted ⇒ inherits everything, `mcp__<server>__*` patterns
- `github.com/microsoft/playwright-mcp` README (fetched 2026-09-07) — the five host-CLI registration shapes, headed default, `--headless`/`--isolated`, Node ≥18
- `.planning/research/STACK.md` §"Agent-driven browser testing" — the phase's originating research (measured 2026-07-28; two version facts have since moved, see §F-01/F-03)

### Tertiary (LOW confidence)

- `~/.claude/agents/gsd-dom-verifier.md` — an out-of-repo agent declaring `mcp__claude-in-chrome__*` in `tools`. Evidence of intent, not of reachability.

## Metadata

### Numbered findings (referenced throughout)

- **F-01 — `@playwright/mcp` `latest` is `0.0.80`, not `0.0.78`.** `0.0.78` published 2026-07-09 and still resolves; `0.0.80` published 2026-09-01. The pin is locked at `0.0.78` by D-07/D-08. Surface as a one-line confirm; do not re-open unilaterally. `[VERIFIED: npm registry]`
- **F-02 — the verdict note records no SHA (blocking for UATX-04).** `emitVerdict`'s composed note has no git-derived field. D-03's comparison has no left operand until `emitVerdict` gains one. Sequence every UATX-04 task behind this. `[VERIFIED: scripts/context-io.ts:1076-1090]`
- **F-03 — the pin-guard idiom D-08 says to clone does not exist.** No version-pin assertion anywhere in `scripts/`; `grep` for `1.62.1`/`4.12.1` across `scripts/ install/ hooks/` returns nothing. Plan it as new construction.
- **F-04 — D-10's `UNKNOWN - verify` is RESOLVED: `claude auth status --json` exposes the auth posture.** Measured on CC 2.1.263, three configurations, verbatim output:

  ```
  (a) attended, claude.ai login, no key in env:
      { "loggedIn": true, "authMethod": "claude.ai", "apiProvider": "firstParty",
        "analyticsDisabled": false, "projectsDirectory": "...", "email": "...",
        "orgId": "...", "orgName": "...", "subscriptionType": "max" }

  (b) same box + ANTHROPIC_API_KEY set:
      { "loggedIn": true, "authMethod": "claude.ai", "apiProvider": "firstParty",
        "analyticsDisabled": false, "projectsDirectory": "...",
        "apiKeySource": "ANTHROPIC_API_KEY",
        "email": null, "orgId": null, "orgName": null, "subscriptionType": null }

  (c) same box + ANTHROPIC_AUTH_TOKEN set:
      { "loggedIn": true, "authMethod": "oauth_token", "apiProvider": "firstParty",
        "analyticsDisabled": false, "projectsDirectory": "..." }
  ```

  Three consequences for the D-10 predicate. **First**, `authMethod` alone is *not* sufficient — it
  stayed `"claude.ai"` in case (b) despite the key being active. **Second**, `apiKeySource` is the
  discriminator that actually fires, and it is strictly better than D-10's fallback env check
  because it also covers key sources other than `ANTHROPIC_API_KEY` (an `apiKeyHelper`, for
  instance). **Third**, `subscriptionType` collapses to `null` the moment a key is present, giving a
  second independent signal. Recommended predicate, stated positively and fail-closed:

  > attended ⟺ `loggedIn === true` **and** `apiKeySource` is absent/null **and**
  > `authMethod === "claude.ai"` **and** `apiProvider === "firstParty"` **and**
  > `subscriptionType` is a non-empty string. Anything else — including an unrecognized shape, a
  > parse failure, or a missing field — is a **loud skip naming which clause failed**.

  Also worth recording: `--json` is the **default** output for this subcommand
  (`claude auth status --help` → `--json  Output as JSON (default)`), so the existing probe's
  explicit flag is belt-and-braces, not required.

  Still `UNKNOWN - verify` (A2/A3): the shape on an API-key-**only** box with no interactive login,
  and the shape under `claude setup-token`. Neither is reachable from this environment without
  destroying the box's real credentials. The fail-closed framing above means both fail safe.
- **F-05 — `RUNNABLES` and `RUNNABLES_MIRROR` must be edited together.** `[VERIFIED: install/install.ts:2182-2186]` — verbatim: `An entry ADDED here without` / `being added there is installed and never removable, which is exactly the reversibility gap that` / `pass exists to close — edit the two together.` One plan task, both files.
- **F-06 — gate step position.** The AST runnable consumes no run output and belongs **before** the e2e lane, not in `test-skip-integrity`'s post-e2e slot (§Pitfall 5).
- **F-07 — the parser already accepts the three new keys.** `parseNote`'s scalar regex is `^([A-Za-z_]+):\s*(.*)$`; `sha`, `gate_run`, `content_hash` all match. The composer, types, validator, `toJsonl` and the `index.md` render are the real blast radius (§Pitfall 2).

### Confidence breakdown

- **Standard stack:** HIGH — every version, licence, engine constraint, download count and the absence of a `postinstall` script was measured against the live registry this session, and the package was discovered from Microsoft's own README.
- **Architecture / integration points:** HIGH — every claim about `context-io.ts`, `install.ts`, the workflows, the checkpoints and the guards was read from source this session with line ranges and verbatim quotes. F-02 in particular is a direct source reading, not an inference.
- **Pitfalls:** HIGH for 1, 2, 4, 5, 7, 8 (all source-verified); MEDIUM for 3 and 6 (3 is an extrapolation of the repo's own documented failure class; 6 is a runtime observation about an internal type).
- **Claude in Chrome facts:** MEDIUM-HIGH — `[CITED]` to the primary vendor doc, fetched this session.
- **Subagent reachability:** MEDIUM for the general rule (`[CITED]`), **`UNKNOWN - verify`** for the Chrome-specific combination, with a design recommendation that makes it moot.
- **Auth-posture probe (F-04):** HIGH for the three measured shapes on CC 2.1.263; MEDIUM for cross-version field stability (A4) and for the two unreachable auth configurations (A2/A3).
- **Windows:** `UNKNOWN - verify` throughout, carried forward from CONTEXT.

**Research date:** 2026-09-07
**Valid until:** 2026-10-07 for the repo-internal findings (stable unless Phase 31 itself moves them).
**2026-09-21 for `@playwright/mcp`** — pre-1.0, publishing roughly weekly including daily `next`
alphas; re-check the pin before the guard freezes it.
