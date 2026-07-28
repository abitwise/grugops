# Phase 6: Validation, Brand & Dogfood - Context

**Gathered:** 2026-06-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 is the **acceptance gate** — the final phase. The single-source core (16 role prompts, 14 workflow files, root `AGENTS.md`, the config dial, the seeded state plane) and the full Phase-5 packaging/install/safety layer are **frozen and immutable**. **This phase writes NO new role/workflow/config/handoff/checklist content** — it *asserts* the structure with a validator, *narrates* the finished flows with examples, ships the public-facing *brand & legal collateral*, and *proves* the whole chain end-to-end with a live idea→PR dogfood. Concretely it delivers:

- **`scripts/validate-agent-factory.mjs`** — a shipped, structure-only Node validator (files exist, role/workflow section presence, config parses w/ mode/cadence/autonomy, board↔ticket status match, traceability completeness flagging, packaging presence + `plugin.json` has a `name`). Never fabricates; never creates `package.json` if absent. **(VAL-01)**
- **Five example runs** in `examples/` — greenfield bootstrap, brownfield bootstrap, ticket→PR, a sprint cycle (with board snapshots + a velocity/metrics line), and a release run (REL with SemVer/changelog/rollback/approval → human-confirmed deploy → Done, completed traceability rows). Each shows input → Orchestrator decision → expected files/handoffs. **(EX-01)**
- **Brand & docs collateral** — root `README.md` (clear-voice opener → grug wink, hero block, Acknowledgements crediting grugbrain.dev/Carson Gross, non-affiliation footer), `NOTICE`, `CONTRIBUTING.md` (contributor original-art + no-affiliation rules), `docs/faq.md`, and `brand/wordmark*.svg` (color, mono-dark, mono-light/reverse, icon lockup) + `brand/icon.svg` — original art, lowercase `grugops`, Charcoal/Bone/Granite + single Ochre accent, never resembling the children's-book character. **(BRAND-01, BRAND-02, BRAND-03)**
- **The dogfood** — install grugops via `/grugops` onto a throwaway sample repo, bootstrap it, and drive one ticket idea→PR end-to-end, with the validator passing, exercising **both** the portable AGENTS.md sequential path and the Claude Code sub-agent spawn path ("only the dispatch differs, never the content"). **(DOG-01, DOG-02)**

**Out of scope:** any edit to the frozen `agent-factory/` core, the Phase-5 packaging/install/hooks layer, `docs/initial/`, `.planning/`, or user files. No new role/workflow/config content. No new capabilities — this phase only validates, narrates, brands, and proves what already exists.

**Requirements:** VAL-01, EX-01, BRAND-01, BRAND-02, BRAND-03, DOG-01, DOG-02.

</domain>

<decisions>
## Implementation Decisions

### Baseline carried forward (apply without re-asking)
- **Command surface is `/grugops` everywhere (D-29 — supersedes the brand manual's literal `/grug`):** `/grugops "<request>"` + `/grugops-map|plan|ticket|gate|uat|release` (dash, standalone) is the primary on-brand surface; the plugin form is `/grugops:<op>` (colon). **No literal `/grug` appears in any Phase-6 collateral.** The dash naming was a deliberate user-driven legal-surface reduction (avoid shipping the bare "Grug" children's-book word as a command).
- **Two-voice discipline (D-21):** clear professional English for the README opener/pitch, safety, legal, NOTICE, CONTRIBUTING, FAQ; grug wink only in framing prose (e.g. "> grug keep it simple."). Never let the joke muddy a safety/legal topic.
- **No fabrication (hard constraint, spec §18/§19.9):** the validator never fakes a pass; it does **not** create `package.json` if absent; illustrative examples are explicitly labeled (not presented as real captures); `UNKNOWN - verify` slots stay unfilled, never invented.
- **VERSION is `0.1.0` (D-28):** README states `0.1.0`; `agent-factory/VERSION` is canonical, mirrored in `.claude-plugin/plugin.json`.
- **Shipped-kit vs grugops's-own-build identity (D-04):** examples, the validator, and brand collateral describe the **generic shipped kit**; grugops's own build state stays in `.planning/`. The dogfood sample is a *separate throwaway repo*, not grugops itself.
- **Mandatory non-affiliation:** grugbrain.dev (Carson Gross) attribution + the non-affiliation footer ship verbatim from the brand manual's ready-to-paste blocks in README/NOTICE.

### Dogfood execution & proof (DOG-01, DOG-02)
- **D-38 (Hybrid execution model):** The executor drives **everything with no live-Claude-Code-session dependency live** on the sample repo (the portable AGENTS.md sequential role-load path; the validator run) and captures it as **REAL proof**. It **authors a precise human runbook/checklist** for the parts that genuinely require a live CC session: marketplace plugin install + **D-31 plugin-cache repo-relative pointer resolution**, **live PreToolUse hook firing** (the SAFE-02 mechanical guard), and the **Claude Code sub-agent spawn path**. Honest split: agent-proven vs human-pending — fits "humans decide, agents execute." (User rejected agent-drives-everything-live as fabrication-risky, and human-gated-only as deferring all proof.)
- **D-39 (Sample repo = minimal real app in grugops's recommended greenfield stack):** A small but real app in grugops's own greenfield default (small **TS/Node+Fastify** or **Vue**), created **fresh in a temp/sibling dir OUTSIDE the grugops repo**; bootstrap + one small real ticket (e.g. add an endpoint/component) idea→PR. Closest to a true dogfood; exercises the factory on the kind of project it's designed for. (User rejected ultra-minimal placeholder and committed-fixture-inside-the-repo.)
- **D-40 (One real DOGFOOD report = EX-01 example #3):** A single real captured artifact serves double duty — `examples/03-ticket-to-pr.md` shows input → Orchestrator decisions → board moves → handoffs → gate result → PR link, labeled **REAL RUN**, with live-session-dependent checks marked **"pending human."** That same artifact **IS** the EX-01 ticket→PR example. No duplication, no fabrication. (User rejected separate-dogfood-plus-illustrative and proof-only-no-narrative.)
- **D-41 (Dual-path parity split):** The **sequential AGENTS.md path is agent-run live and captured**; the **CC sub-agent spawn path** (plugin install, `settings.json` `agent:`, sub-agent spawn, hook firing) lives in the **human runbook**. Parity is asserted via a **side-by-side checklist**: same ticket, same handoff files produced, same gate verdict — agent-proven for sequential, human-confirmed for CC-native. This is the decisive test of "only the dispatch differs, never the content."

### Validator scope & strictness (VAL-01)
- **D-42 (Shipped + dual-purpose self-validation):** Author the validator as the shippable kit check **AND** wire it to run **green against grugops's own `agent-factory/` tree** as a CI/self-test gate (free proof it works before the dogfood). The 6 existing per-phase `.planning/.../check-structure.sh` harnesses **stay as historical build gates** — not replaced, not shipped. (User rejected shipped-only and validator-supersedes-bash-harnesses.)
- **D-43 (Pass on empty seeded state — structural, vacuous):** The kit ships `board.md`/`traceability.md` seeded with **zero ticket rows**. The ticket/board/traceability checks are **conditional on ticket files existing** — zero tickets → zero violations → a fresh install validates green. Structural file/section/config/packaging checks always run and must pass. Matches "checks structure, not behavior." (User rejected require-minimal-sample-rows.)
- **D-44 (Two-tier strictness + exit codes):** **ERRORS** (missing required file/section; config doesn't parse or lacks mode/cadence/autonomy; `plugin.json` missing `name`; board/ticket status mismatch) → **exit 1**. **WARNINGS** (traceability rows missing tests/UAT; soft gaps) → **reported but exit 0**. A **`--strict` flag promotes warnings to errors** for CI. Matches the spec's "flags rows missing tests/UAT" (flag, not fail). (User rejected single-pass/fail and report-only-never-nonzero.)
- **D-45 (Known-good + known-bad fixtures self-test):** Ship a self-test (in the kit's existing `guard.test.sh`/`install.test.sh` style) running the validator against a tiny **GOOD** fixture tree (expects exit 0) **AND** one or more **BAD** trees (missing section, bad config, `plugin.json` without `name`, board/ticket mismatch → expects nonzero + the correct finding). Proves both pass AND fail paths without fabrication. Invocation is plain `node scripts/validate-agent-factory.mjs` (**no `package.json` created**). (User rejected self-validation-only and manual-no-committed-test.)

### Example runs (EX-01)
- **D-46 (Capture what the dogfood gives; illustrate the rest):** **REAL-captured** — #3 ticket→PR **and** #1 greenfield bootstrap (both fall out of the dogfood run on the fresh sample repo). **ILLUSTRATIVE** (hand-authored, clearly labeled "expected") — #2 brownfield bootstrap, #4 sprint cycle, #5 release run (these need an existing repo / huge multi-ticket execution not worth running live). Maximizes real proof; illustrates only the impractical-to-run. (User rejected all-five-illustrative and attempt-all-five-live.)
- **D-47 (Explicit per-file honesty banner + placeholder IDs):** Every **illustrative** example opens with a clear banner — *"Illustrative run — expected output, not a captured session"* — and uses obvious placeholder IDs/links (`ABC-001`, `REL-0007`, `<PR-link>`). **Real** captures open with *"Real run — captured 2026-06-03"* and carry actual artifacts/links. The reader can never mistake expected for real. (User rejected section-note-only.)
- **D-48 (`examples/` at repo root, structured medium-depth):** One markdown per run in `examples/` (e.g. `01-greenfield-bootstrap.md` … `05-release-run.md`, with `03` = the real dogfood ticket→PR report). Each structured as: **input → Orchestrator decision/routing → board moves → expected files/handoffs with representative snippets (not full file dumps) → trace/metrics line where relevant.** The sprint run includes board snapshots + a velocity line; the release run shows completed traceability rows. (User rejected docs/examples/ location and full-fidelity-complete-handoff-bodies.)

### Brand collateral & naming reconciliation (BRAND-01, BRAND-02, BRAND-03)
- **D-49 (Render shipped command surface only; never literal `/grug`):** All collateral uses `/grugops "<request>"` + `/grugops-map|plan|ticket|gate|uat|release` (dash standalone) as primary, and notes the plugin colon form `/grugops:*` where distribution/install is discussed. **No literal `/grug` anywhere.** Executes the D-29 reconciliation the brand manual predates. grugbrain.dev attribution + non-affiliation footer ship verbatim. (User rejected keep-manual's-/grug-with-a-note.)
- **D-50 (Ship the manual's SVGs as-given; derive the variants; light cleanup ok):** Use the brand manual's two drop-in SVGs (color wordmark = Ochre `/` + "grug" solid Charcoal + "ops" lighter Granite — reads as `/grugops`; icon = club-on-stone rounded square). **Mechanically derive** the three required variants: **mono-dark** (all-Charcoal), **mono-light/reverse** (all-Bone), and the **horizontal icon+wordmark lockup**. **No new concept** (honors the manual's "minimal is on-brand — don't over-design"). **Light cleanup allowed** where the drop-ins are rough: alignment, `viewBox`, accessibility attrs, optimized paths — no concept change. Locked palette Charcoal/Bone/Granite + single Ochre; lowercase `grugops`; never resemble the children's-book character. (User rejected full gsd-ui-phase design pass.)
- **D-51 (Root README = public face linking to internal README):** Root `README.md` is the public face — clear-voice opener → grug wink, hero block, install quickstart, Acknowledgements (grugbrain.dev / Carson Gross), non-affiliation footer — and **links to the existing `agent-factory/README.md`** for the deep "start at `orchestrator.md`" entry. The existing internal README stays **untouched**; no overwrite of user/internal files. (User rejected single-merged-README.)

### Claude's Discretion
- Exact validator finding messages, the structure of its findings report, and the precise fixture-tree contents (as long as GOOD passes, each BAD fails with the right finding, and it self-validates grugops's own tree).
- The specific sample-app shape (which endpoint/component the one dogfood ticket adds) and the one-ticket scope, as long as it's a real idea→PR on the chosen stack.
- The exact wording of the human runbook/checklist and the side-by-side dual-path parity table, as long as they cover D-31 cache-pointer resolution + live hook firing + sub-agent spawn.
- Illustrative-example narrative depth and exact snippet selection within the medium-depth bound (D-48); the precise velocity/metrics line and board-snapshot rendering.
- SVG derivation details (exact mono recolors, lockup spacing/proportions, a11y attributes) within D-50's "no concept change" rule.
- Exact README section ordering and FAQ/CONTRIBUTING/NOTICE wording, as long as they reproduce the manual's ready-to-paste blocks and the D-49 command surface.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The build contract + acceptance criteria (authoritative for Phase-6 content)
- `docs/initial/agent_factory_builder_spec_v2.md` — THE specification. Phase-6-relevant: **§18 (the validator's exact check list — files/sections/config/board/traceability/packaging; "do not create `package.json` if absent"; "faking results is forbidden")**, **§19 (Quality Rules — additive, single-source, no-fabrication, examples practical+immediately-usable)**, **§20 (v2 Acceptance Criteria — the done-when checklist this phase's dogfood proves)**. The example-run shapes (greenfield/brownfield bootstrap, ticket→PR, sprint cycle, release run) trace to §7 workflow flows.
- `docs/initial/grugops_brand_manual.md` — **the ready-to-paste source for ALL brand/docs collateral.** §6 Visual Identity (palette, typography, **§6.3 wordmark SVG**, **§6.4 icon SVG**, §6.5 mascot guidance, §6.6 visual do/don't); **§8 Boilerplate Library** (§8.6 README hero block, §8.8 FAQ); **§10 Legal Positioning** (§10.3 contributor rules → CONTRIBUTING, §10.4 ready-to-paste Acknowledgements + non-affiliation blocks → README/NOTICE); §12 Asset Checklist (where things live). **NOTE: D-49 supersedes the manual's literal `/grug` command shape with `/grugops`/`/grugops-*`.**

### Project planning context
- `.planning/ROADMAP.md` — Phase 6 goal + the 5 success criteria (lines 167–183); the note that Phases 1–4 and 6 use standard internally-defined patterns and need no extra research.
- `.planning/REQUIREMENTS.md` — VAL-01, EX-01, BRAND-01/02/03, DOG-01/02 (lines 96–111) — the exact requirement text each deliverable must satisfy.
- `.planning/PROJECT.md` — Constraints (no-fabrication, single-source, brand always-lowercase, minimal), the Key Decisions table, and the **Phase-2 handoff-duplicate-header note** (line 96: the Phase-6 validator MUST treat the universal-header `## Scope`/`## Risks` as authoritative and tolerate the duplicate §5.A body sections in `product-handoff.md` + `implementation-handoff.md` — do NOT flag these as a section error).
- `.planning/phases/05-packaging-adapters-install-distribution/05-CONTEXT.md` — **D-29** (command surface naming, supersedes manual `/grug`), **D-28** (version 0.1.0), **D-31** (the plugin-cache repo-relative pointer landmine the dogfood must verify), D-04 (shipped-kit identity).
- `.planning/phases/05-packaging-adapters-install-distribution/05-HUMAN-UAT.md` — **the two Phase-5-deferred live-session tests this phase's human runbook must absorb:** (1) plugin-cache pointer resolution (D-31), (2) live PreToolUse hook firing (SAFE-02). Carry these into the DOG human runbook verbatim in intent.

### Frozen artifacts the validator + examples reference (do NOT redefine — assertion targets)
- `agent-factory/roles/*.md` (16) — the validator checks each role file has its required sections (One job, Caveman prompt, Reads, Responsibilities, Output, Board moves, Trace updates, Hard limits per spec §18).
- `agent-factory/workflows/*.md` (00–13) — the validator checks each workflow file has its sections (When, Agents, Inputs, Steps, Board moves, Handoffs, Trace updates, Stop, Done); the example runs narrate these flows.
- `agent-factory/config/factory.config.json` (+ `.md` twin) — the validator parses it and asserts mode/cadence/autonomy present.
- `plans/board.md`, `plans/traceability.md`, `plans/nfr-catalog.md`, `plans/metrics.md` — the seeded (zero-row) state plane the validator checks structurally (D-43); the sprint/release examples render board snapshots, a velocity/metrics line, and completed traceability rows.
- `agent-factory/handoffs/*.md`, `agent-factory/checklists/*.md` — required-file presence checks; example runs reference real handoff filenames.
- `.claude-plugin/plugin.json` + `marketplace.json`, `agent-factory/packaging/adapters.md`, `install/`, `hooks/` — the validator's packaging-presence check (`adapters.md` present; `plugin.json` has a `name`); the dogfood installs via these.
- `agent-factory/VERSION` (`0.1.0`) — the README version source (D-28).
- Root `AGENTS.md` — the portable substrate the dogfood's sequential-path run loads; the entry point exercised in the agent-live half of DOG-02.
- `agent-factory/README.md` — the existing internal "start here → orchestrator.md" the new root README links to (D-51), not overwritten.

### Existing test/gate harnesses (style references for the validator's self-test)
- `.planning/phases/{03,04,05}/check-structure.sh`, `hooks/guard.test.sh`, `install/install.test.sh` — the kit's established test-harness style D-45's validator self-test should mirror (RED/GREEN, ALL CHECKS PASSED, exit-code-driven).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Brand manual drop-in SVGs + ready-to-paste blocks** (`docs/initial/grugops_brand_manual.md` §6, §8, §10.4) — wordmark.svg, icon.svg, README hero, FAQ, Acknowledgements, non-affiliation, CONTRIBUTING rules are all pre-written; Phase 6 assembles + reconciles command naming, it does not author brand copy from scratch.
- **Frozen Phases 1–5 tree** — every file the validator asserts and every flow the examples narrate already exists and is immutable; Phase 6 only reads/asserts/narrates.
- **Existing test harnesses** (`hooks/guard.test.sh` 26/26, `install/install.test.sh` 13/13, per-phase `check-structure.sh`) — the proven harness style the validator's GOOD/BAD fixture self-test (D-45) reuses; Node is already the install/guard runtime (`install.mjs`, `guard.mjs`), so the Node validator fits the established stack with no new dependency.
- **`agent-factory/README.md`** — the internal start-here the new public root README links to (D-51).

### Established Patterns
- **No fabrication, ever (spec §18/§19.9 → D-44/D-45/D-47):** validator can't fake a pass and must prove its FAIL path; illustrative examples are explicitly labeled; `UNKNOWN - verify` stays.
- **Additive / never-overwrite (constraint):** Phase 6 creates `scripts/`, `examples/`, `brand/`, root `README.md`, `NOTICE`, `CONTRIBUTING.md`, `docs/faq.md` — all **new** paths; it never touches `docs/initial/`, `.planning/`, the frozen `agent-factory/` core, the Phase-5 packaging/install/hooks layer, or user files.
- **Two-voice discipline (D-21 → D-49):** clear voice for README opener/legal/safety/FAQ; grug wink only in framing.
- **Structure-not-behavior validation (spec §18 → D-42/D-43):** the validator checks shape, parses config, matches board↔ticket; it does not execute workflows.

### Integration Points
- **New top-level paths Phase 6 populates:** `scripts/validate-agent-factory.mjs` (+ self-test + fixtures), `examples/0{1..5}-*.md`, `brand/wordmark*.svg` + `brand/icon.svg`, root `README.md`, `NOTICE`, `CONTRIBUTING.md`, `docs/faq.md`. The dogfood operates on a **separate throwaway repo** outside this tree.
- **The validator reads across** `agent-factory/`, `plans/`, `agent-factory/config/`, `.claude-plugin/`, `agent-factory/packaging/` — and must tolerate the PROJECT.md-line-96 duplicate-`## Scope`/`## Risks` sections in `product-handoff.md` + `implementation-handoff.md` (treat universal-header copy as authoritative).
- **The dogfood is the convergence point:** it installs via `/grugops`, runs the validator (must pass), and exercises both dispatch paths — the decisive live test of D-31 (plugin-cache pointers) and "only the dispatch differs, never the content."

</code_context>

<specifics>
## Specific Ideas

- **The dogfood is deliberately honest about its limits.** The user chose the hybrid model precisely so the trail distinguishes **agent-proven** (sequential path, validator) from **human-pending** (plugin-cache resolution, live hook firing, CC sub-agent spawn) — rather than risk an executor sub-agent *simulating* a marketplace install or a real hook interception, which the no-fabrication rule forbids. The DOGFOOD report must wear that split visibly ("pending human").
- **One real artifact, double duty.** The user wants the dogfood capture to BE example #3 (ticket→PR), not a parallel polished fiction. Real where we can, clearly-labeled illustrative where we can't — never a fake real run.
- **The validator must be able to FAIL.** The user explicitly wanted GOOD + BAD fixtures so the validator's catch-a-broken-repo path is proven, not just its pass-on-grugops path — a trustworthy gate, in the kit's existing test-harness idiom.
- **Brand is mostly reproduction, with one firm override:** ship the manual's concept/SVGs/blocks as-given (don't over-design), but render the **shipped** command surface (`/grugops*`, never `/grug`) — the D-29 legal-surface reduction the manual predates.

</specifics>

<deferred>
## Deferred Ideas

These are preserved, not actioned here. None are scope-creep from this discussion.

- **Live-session human acceptance items (carried into the DOG human runbook, not a new phase):** plugin-cache repo-relative pointer resolution (D-31) and live PreToolUse hook firing (SAFE-02) remain human-run; their results land in the Phase-6 human UAT/runbook, completing the proof the agent can't fabricate.
- **Filling real gate/deploy commands** into a project's `AGENTS.md` `UNKNOWN - verify` slots and the guard's per-project pattern list — done per-project at bootstrap/runtime, never fabricated in the kit (the dogfood may fill them for its sample repo only, recorded as that repo's real values).
- **Milestone close / post-dogfood requirement promotion** — moving the Active requirements to Validated once the dogfood proves them is a milestone-boundary activity (`/gsd-complete-milestone`), not a Phase-6 build task.

</deferred>

---

*Phase: 6-validation-brand-dogfood*
*Context gathered: 2026-06-03*
