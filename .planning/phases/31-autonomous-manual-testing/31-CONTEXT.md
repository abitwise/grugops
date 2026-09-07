# Phase 31: Autonomous Manual Testing - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

An agent can drive a real browser to produce UAT evidence, and the only thing that counts as
evidence is an artifact the §14 gate re-runs — a committed Playwright spec. The agent's narration,
a screenshot, or an MCP tool-call transcript never produces a stamp. The phase delivers: the
evidence note shape with provenance (UATX-04), the spec-authoring step through pinned Playwright
MCP documented for all five host CLIs (UATX-01/02), the attended-only Claude-in-Chrome lane that is
structurally unable to earn a gate stamp (UATX-03), the loud-skip path when no browser is usable
(UATX-05), and the TypeScript-AST ban on conditional or caught assertions in generated specs
(UATX-06). Requirements UATX-01..06 are fixed by `.planning/REQUIREMENTS.md`; nothing here widens
them.

Out of the boundary: any change to the four safety floors, any new note kind, any new role, any
new host runtime dependency, and any board/dashboard rendering (Phase 32).

</domain>

<decisions>
## Implementation Decisions

### Evidence note shape and provenance (UATX-01, UATX-04)
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

### Spec location and authoring flow (UATX-01, UATX-02)
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

### Claude-in-Chrome lane (UATX-03)
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

### Loud skip and AST ban (UATX-05, UATX-06)
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research and requirements
- `.planning/research/STACK.md` §"Agent-driven browser testing" and the Playwright-vs-Chrome
  table — fixes the split (Playwright spec = evidence, MCP = authoring, Chrome = attended-only),
  the `0.0.78` pin, the five install commands, and the two `UNKNOWN - verify` items.
- `.planning/REQUIREMENTS.md` UATX-01..06 — the six requirements; none re-opened.
- `.planning/ROADMAP.md` §"Phase 31" — goal, five success criteria, research flag.

### Shared verified context (evidence note, stamps, admission)
- `agent-factory/contracts/context-note.md` — the six-kind note schema and provenance fence
  D-01 extends with three `artifact-ref` fields.
- `agent-factory/workflows/16-context-read-write.md` — the two accepted stamps and the
  finding-only stamp rule.
- `scripts/context-io.ts` — `emitVerdict` (only `by: §14-gate` author), `GATE_STAMP_RE`,
  `admit()` cross-check where D-03's SHA refusal is added, reserved-identity refusal D-09 relies on.
- `hooks/admission-guard.ts` — the `GRUGOPS_ADMISSION_APPROVED_BY` grant D-11 reuses.

### Gate, UAT workflow, checkpoints
- `agent-factory/workflows/05-pr-quality-gate.md` — the UI/E2E lane, test-integrity ordering,
  the materialized-checker invocation idiom, verdict emission on green only.
- `agent-factory/workflows/06-uat-pack.md` — where D-06's authoring step is inserted; owns
  `sign_off_acceptance`.
- `scripts/checkpoints.ts` — `sign_off_acceptance` default `block` (D-04 honours it).
- `agent-factory/config/factory.config.md` — `quality.ui_e2e` dial and `checkpoints` matrix.

### Loud skip and runnable idiom
- `scripts/e2e/uat-live.test.ts` — `LOUD_SKIP_MARKER`, `claudePresentAndAuthed()`, the single
  emission point; D-10 and D-15 clone this shape.
- `scripts/runnable-ref/test-skip-integrity.ts` and `install/install.ts` (the
  `tools/grugops/` materialization list) — how a gate-time checker reaches a target (D-13).

### Existing Playwright guidance
- `agent-factory/checklists/playwright-visual-regression-recipe.md` — the pinned
  `@playwright/test 1.62.1` / `@axe-core/playwright 4.12.1` idiom D-08 copies.
- `agent-factory/checklists/00-index.md` — where the new recipe is listed.
- `install/README.md` — receives the pointer section (D-07).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `emitVerdict` / `admit()` in `scripts/context-io.ts`: the whole stamp economy already exists;
  Phase 31 adds three fields and one refusal, no new stamp grammar.
- `claudePresentAndAuthed()` + `LOUD_SKIP_MARKER` in `scripts/e2e/uat-live.test.ts`: the
  fail-closed probe and single-emission-point skip pattern to clone twice (auth lane, browser lane).
- `scripts/runnable-ref/` → `tools/grugops/*.js` materialization via `install.ts`: the delivery
  path for the AST runnable.
- `check-foundation-guards` pin assertions: the idiom for D-08's `0.0.78` guard.
- Phase 30 `checkpoints.ts` matrix and `renderCheckpointBanner`: D-04 needs no new mechanism.

### Established Patterns
- One authority per predicate; a safety invariant closes on a structural fix plus independent
  red-teams, never on a green suite (v2.0 doctrine, Phase 29 D-59 posture on totalities).
- Every skip is LOUD and leaves state `pending`; a silent green is the forbidden outcome.
- Zero shipped runtime deps: hosts run committed `.js`; anything needing a library resolves it
  from the target.
- Derived sets over hand-maintained lists (Phase 27): the AST runnable's spec set must be
  derived from the `*.uat.spec.ts` glob, and the banned-construct list must be the single
  source the recipe quotes.

### Integration Points
- Workflow 06 step insertion between scenario assembly and QE coverage validation.
- Gate step list in workflow 05: the AST runnable runs before the UI/E2E lane, in the same slot
  family as `test-skip-integrity.js`.
- `install.ts` / `uninstall.ts` materialization lists gain one runnable.
- `context-note.md` contract and `context-io.ts` validator gain the three `artifact-ref` fields.
- `00-index.md` and `install/README.md` gain the recipe pointer.

### Verification obligations (carry-forward)
- `UNKNOWN - verify`: `mcp__claude-in-chrome__*` reachability from inside a subagent. The
  Playwright floor does not depend on it; only the Chrome lane's flow does.
- `UNKNOWN - verify`: whether `claude auth status --json` exposes the auth method (D-10).
- The Windows leg stays `UNKNOWN - verify` for every browser probe (WINDOWS.md posture).

</code_context>

<specifics>
## Specific Ideas

- The user wants green Playwright evidence to be ABLE to advance a ticket without a human, but
  only through the Phase 30 dial — "honour the matrix, keep default block" was the explicit
  reconciliation.
- Every recommended option was accepted; the one non-recommended pick (auto-advance) was then
  bounded by the matrix decision above.

</specifics>

<deferred>
## Deferred Ideas

- **Refuse a `*.uat.spec.ts` whose test bodies contain zero `expect` calls** (vacuous evidence).
  Not selected for the Phase 31 ban set; candidate for a later hardening round or a Phase 31
  gap-closure round if a red-team shows it matters.
- **Hashing the spec's transitive imports** so a helper edit invalidates evidence (D-02 hashes
  the spec bytes only).
- **A distinct checkpoint id for evidence-backed advance** — rejected for now in favour of the
  existing `sign_off_acceptance` dial.

</deferred>

---

*Phase: 31-autonomous-manual-testing*
*Context gathered: 2026-09-07*
