# Phase 34: Model Effort Dial & Pi Support - Context

**Gathered:** 2026-10-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Two independent deliveries, one phase:

1. **Effort dial.** The existing `models` dial (Phase 29.1, `scripts/model-tiers.ts`) gains a reasoning-effort
   setting per role, emitted by the adapter generator into the Claude Code sub-agent adapters'
   frontmatter. Zero-config output stays byte-identical to today.
2. **Pi support.** Pi (pi.dev) becomes the sixth supported host coding-agent CLI through the existing
   thin-pointer, single-source adapter pattern, with the same idempotent, additive, dry-run-capable,
   reversible install contract as the other five.

Plus one enabling change: the set of supported host tools gets one owner (D-11), so adding the sixth
tool cannot leave a stale "five" anywhere.

Not in this phase: CAP-01/CAP-02/CAP-03 stay carried open (ROADMAP: Phase 34 is not re-scoped);
WINDOWS.md rows 274 and 315 are not fixed here (D-09).

</domain>

<decisions>
## Implementation Decisions

### Success criterion 1 — the effort premise (pre-checked during discussion)
- **D-01:** Claude Code sub-agent frontmatter DOES honour an `effort` key. Discussion-time check of
  code.claude.com/docs/en/sub-agents (fetched 2026-10-06), frontmatter reference table: `effort` — "Effort
  level when this subagent is active. Overrides the session effort level. Default: inherits from session.
  Options: `low`, `medium`, `high`, `xhigh`, `max`; available levels depend on the model". The same page:
  extended thinking on/off is inherited from the session as of v2.1.198 and "There is no per-subagent
  thinking setting". The researcher re-fetches and cites this as the criterion-1 evidence (and records the
  minimum Claude Code version that introduced the field, or `UNKNOWN - verify`); the dial is therefore NOT
  scoped down to a fallback mechanism. If the re-fetch contradicts this, stop and return to the human.

### Effort setting shape
- **D-02:** The effort setting lives in a sub-block INSIDE `models`: `models.effort` with its own two keys,
  `preset` and `roles` (sparse per-role manual overrides). A `roles` entry beats the preset for that role —
  the same tie-breaking contract the model alias already has. The `models` block's closed key set grows from
  `{preset, roles}` to `{preset, roles, effort}`; `models.effort`'s own key set is closed to
  `{preset, roles}`. — **Reversibility:** one-way — it is a published config-key contract users write into
  `.grugops/factory.config.json`; renaming it later breaks their files.
- **D-03:** Effort value vocabulary is closed: `inherit` plus Claude Code's five levels `low`, `medium`,
  `high`, `xhigh`, `max`. Exact-string membership, refused by name on any unknown key or value (quoting the
  legal set back), case-varied keys refused rather than folded, degenerate block (`null`, array, string,
  number) refused rather than read as absent, unknown-key refusal decided before any legal sibling is read,
  refusal writes nothing and never falls back to a pinned value. Every rule mirrors the existing `models`
  refusals in `agent-factory/config/factory.config.md` §"`models` sub-fields".
- **D-04:** Effort preset vocabulary is closed: `none` and `tiered`. Effort `tiered` assigns `high` to the
  judgment roles and `medium` to the execution roles, using the SAME role split as the model `tiered` table —
  derived from that table, never re-typed as a second hand list — with a per-role rationale recorded (quality
  grounds), and no cost or limit-saving claim (MODEL-07 rule: measured with `scripts/measure-cost.ts` or
  `UNKNOWN - verify`).
- **D-05:** The model `tiered` preset stays MODEL-ONLY. Selecting `models.preset: "tiered"` does not change
  any role's effort; effort is chosen independently through `models.effort`. Reason: folding effort into the
  model preset would silently change adapters for every user already on `tiered`.
- **D-06:** Absent `models.effort` (or absent `models` entirely) resolves every role's effort to `inherit`,
  and an `inherit` effort emits NO `effort:` line in the adapter (the documented default is "inherits from
  session"), so a zero-config repository's adapters stay byte-identical to today. The existing adapter
  byte-baseline and dial-consistency guards extend to the effort field: the emitted effort of every adapter
  equals the resolved config, derived from the role set with an asserted count, never compared against a
  hand-listed expectation.
- **D-07:** Same two-location, first-existing-file-wins-whole precedence as the model alias
  (`.grugops/factory.config.json` then `agent-factory/config/factory.config.json`), read by the same reader in
  `scripts/model-tiers.ts` — one resolver, one reader, no second config grammar. Documentation lands in
  `agent-factory/config/factory.config.md` (the dial) and `agent-factory/packaging/subagent.frontmatter.md`
  (the emitted field), single authority each, not restated elsewhere.

### Effort level × model compatibility
- **D-08:** grugops keeps NO model→allowed-effort capability table and refuses no model/effort pair (e.g.
  `haiku` + `max` is written as configured). Such a table would rot the way full model ids would (the reason
  MODEL-04 refused them). The researcher establishes from Claude Code's primary docs what happens when a
  sub-agent's effort level is not available on its model (fallback, clamp, error) and cites it, or records
  `UNKNOWN - verify`; `factory.config.md` states that behaviour plainly, so the field is never written and
  silently ignored without the user being told.

### Windows dependency
- **D-09:** Phase 34 PROCEEDS although its ROADMAP dependency ("Windows leg green before a sixth adapter
  lands") is unmet: CAP-02 is not met, WINDOWS.md rows 274 (board-watch-live EPERM) and 315 (win32 chmod
  skips) are open. Condition: no test added or changed by this phase may be red on `windows-latest`,
  measured on a pushed CI run (the push is the human's act). The ROADMAP Phase 34 "Depends on" line is
  rewritten to state this honestly, recorded as this decision. Rows 274/315 stay open and owned elsewhere.

### Pi support
- **D-10:** Pi install footprint = the Codex/OpenCode baseline PLUS a thin `/grug` prompt template:
  tool detection, the AGENTS.md entry-file table row, README/install docs, validator coverage, tests in the
  same installer lane as the other five tools, and a project-level prompt template that points at the
  Orchestrator (pointer text only, never a copy of role text — single-source rule). The template ships only
  if research confirms from Pi's primary docs that Pi loads project-level prompt templates and where (likely
  under `.pi/`; `UNKNOWN - verify` until cited). If no project-level location exists, Pi ships the baseline
  only and the docs say why. No Pi skill package. grugops never writes Pi's `SYSTEM.md`.
- **D-12:** The model and effort dials do not reach Pi. Pi has no sub-agents (pi.dev: "No sub-agents"), and
  grugops emits no per-agent definition for it — stated as a property of what this kit emits, the same way
  MODEL-06 states it for the other four non-Claude tools, with every vendor clause carrying a named source.
  Pi's own thinking-level setting is not configured by grugops.
- **D-13:** Pi's install path meets the full installer contract and the Phase 33.1 ledger rules: idempotent,
  additive, dry-run-capable, reversible; every file it creates is recorded in the install ledger
  (`.grugops/install.json`) and uninstall removes only what the ledger says install wrote (owns(path)
  authority, D-33 of 33.1); a pre-existing user file at the template path is never overwritten. Zero runtime
  dependencies.

### Host-tool set ownership
- **D-11:** One registry of supported host tools owns the set (name, detection signal, entry file, adapter
  the installer lays down). Installer detection (`detectTools()` in `install/install.ts`), the validator, and
  every doc/test that enumerates the tools derive from it, and a test asserts its count — so a stale "five"
  or a sixth tool missing from one list fails red. Prose that says "five" is found by derivation, not by a
  hand grep list (set-literal drift is a known failure class in this repo).

### Post-research decisions (human, 2026-10-06, answering 34-RESEARCH.md Q1-Q5)
- **D-14:** The generated coordinator adapter line "the four non-Claude-Code CLIs"
  (`scripts/generate-role-adapters.ts`, emitted into `grugops-orchestrator.md`) is reworded to carry no
  count ("the non-Claude-Code host CLIs"). The zero-config byte baseline admits this as a second declared
  divergence, derived from the frozen baseline line by a stated transform, never a hand-typed expected
  line. The effort half itself stays byte-neutral at zero config (D-06 holds for effort).
- **D-15:** `effort` joins `CANONICAL_SCHEMA` in the canonical frontmatter reader (safety-authority change,
  same shape as D-33-R3-02), so guards can read a configured adapter through `admit()`. The
  corpus-equality test is extended to also measure a generator run with effort configured, so the widened
  schema is proven against real configured output, not only zero-config output.
- **D-16:** The Pi prompt template is named `grugops` (`.pi/prompts/grugops.md`, invoked as `/grugops`),
  one command spelling across hosts. This amends D-10's `/grug` wording; everything else in D-10 stands.
- **D-17:** The Pi template write is unconditional (like the Copilot and Gemini paths), not gated on
  detecting `.pi`, so it stays inside the derived install-variant tests.
- **D-18:** The pre-existing unbounded read in `readModelsConfig` (defect class DC-3) is NOT fixed in this
  phase. It is disclosed as a named residual in the phase artifacts and a backlog item, because a bounded
  reader in `scripts/` would be a second implementation of `readUserFile`.

### Gap round 1 decisions (human, 2026-10-07, answering 34-VERIFICATION.md gaps_found 8/11)
- **D-19:** Gap round 1 fixes the two Windows root-cause families behind the windows-latest reds of run
  37521787426, not only the 5 HOST-02 tests: (1) one path compared in two spellings (`C:\Users\...`
  against `C:/Users/...`, the marker / kit-home family), and (2) POSIX file modes Windows cannot store
  (`expected 438 to be 502`, the chmod-only-edit family). Each fix is Windows-native with no platform
  conditional (carried D-14/D-16 rule of 33.1), its root cause is established from source and the printed
  CI log before code changes (else `UNKNOWN - verify` and a diagnosis-first task), and the round ends with
  a human-pushed windows-latest run whose id and result are recorded in 34-VALIDATION.md and WINDOWS.md
  rows 316/317. HOST-02 closes only on that measured run. Gap rounds are capped at 4; this is round 1.
- **D-20:** Code-review findings WR-03 (effort arm beside the installer's model-alias cross-check), WR-06
  (install guide and adapters.md state Pi kit discovery after a scripted install as `UNKNOWN - verify`,
  backlog 999.4) and WR-07 (correct or implement the "installer sets `GRUGOPS_PROJECT_DIR`" claim) are
  fixed in this round. The other nine rows (WR-01, WR-02, WR-04, WR-05, IN-01..IN-05) get a recorded
  disposition (`deferred` or `skipped`, with a reason) in 34-REVIEW-DISPOSITION.md, not code changes.

### Gap round 2 decisions (human, 2026-10-09, answering 34-VERIFICATION.md gaps_found 8/12)
- **D-21:** Gap round 2 has NO windows-latest measurement. The human will push and measure at a later
  date, so no plan in this round ends with a push checkpoint, and 34-GAP-PLANNING-BRIEF.md §2.5 does not
  apply to round 2. HOST-02 stays unchecked in REQUIREMENTS.md, with "Windows measurement deferred by
  the human (D-21)" as the reason. No agent claims HOST-02 met from a macOS run (WIN-3). The code and test
  work stays in scope and is checked on macOS only. (1) Fix the two `install/ledger.test.ts` link-record
  fixtures (`/some/where`, WINDOWS.md row 319): build the target from the test's own scratch root, with no
  platform conditional. (2) Audit the masked later assertions of every earlier WIN-1 and WIN-2 red, and
  record each one and its expected Windows result as a prediction for the later run.
- **D-22:** WR-08 is fixed with a per-member check. The installer compares the effort level of each
  adapter, read from its rendered text, with the level read from its transformed text, adapter by
  adapter. The evasion shape becomes an `effortRefusalRows` case: `tiered` plus one role at `inherit`,
  with one adapter's `effort:` line dropped. The three comments that overstate the check are made true.
  IN-07 is folded in, so both dials go through one shape check (RC-1, one authority).
- **D-23:** WR-09 and WR-10 are fixed in this round as riders. WR-09: there is one absoluteness rule for
  recorded paths, owned by the canonical-path module. `isAbsoluteMarkerPath` uses it. The WIN-1 census
  finds its comparison sites by search, not from a hand-written list, and covers `isOwnLink`
  (`user-file.ts`). WR-10: one end-to-end row uses a writable pointer file whose mode was changed, so the
  row reaches the uninstall mode check at `install/uninstall.ts` (the one near lines 899-901). The seven
  requirement boxes the verifier found SATISFIED (EFFORT-01, 02, 03, 05, HOST-01, PI-01, PI-04) are
  ticked, and their stale traceability cells are updated.

### Claude's Discretion
- Exact TypeScript module/location of the host-tool registry, and how docs prose is checked against it.
- Plan order and wave split between the effort half and the Pi half (they are independent).
- Wording of refusal messages, as long as each names the offending value and quotes the legal set.
- Whether the effort resolved-preset is announced on the generator's stdout line like the model preset
  (`RESOLVED_PRESET_PREFIX` pattern) — if added, it uses the one grammar `adapters-freshness.ts` already reads.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope
- `.planning/ROADMAP.md` §"Phase 34: Model Effort Dial & Pi Support" — goal and the five success criteria
- `.planning/REQUIREMENTS.md` MODEL-01..07 and the 2026-08-20 MODEL-06 amendment — the rules the effort dial inherits
- `CLAUDE.md` — constraints (single-source, zero-config first, installers contract, no fabrication) and the
  per-tool entry-file table the Pi row joins

### Model dial (the thing being extended)
- `scripts/model-tiers.ts` — the one resolver: closed vocabularies, `MODELS_KEYS`, `PRESET_NAMES`, tiered table, config reader, resolved-preset line grammar
- `scripts/generate-role-adapters.ts` — emits the resolved fields into adapters
- `agent-factory/config/factory.config.md` §"`models` sub-fields" — refusal rules, closed/open key sets, two-location precedence, how an edit reaches an installed repo
- `agent-factory/packaging/subagent.frontmatter.md` — single upstream source for the adapter frontmatter
- `scripts/adapter-byte-baseline.test.ts`, `scripts/model-dial-consistency.test.ts`, `scripts/adapters-freshness.ts` — byte-identity and derived-consistency guards to extend
- `.planning/phases/29.1-per-role-model-assignment/29.1-CONTEXT.md` — the decisions that built the model dial (effort was explicitly deferred there)

### Installer and host tools
- `install/install.ts` (`detectTools()`, Gemini/Copilot adapter paths), `install/uninstall.ts`, `install/install-marker.ts` (ledger shape)
- `install/README.md` — per-tool install/uninstall documentation the Pi section joins
- `agent-factory/packaging/adapters.md`, `agent-factory/packaging/slash-command.template.md` — adapter and `/grug` command patterns the Pi template follows
- `.planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-CONTEXT.md` D-31..D-34 — ledger, owns(path), prune-by-record rules the Pi path must meet
- `.planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-GAP-PLANNING-BRIEF.md` — recurring defect classes; brief planners/executors with it

### Windows
- `.planning/WINDOWS.md` rows 274 and 315 — the open Windows reds D-09 proceeds around
- `.planning/WINDOWS.md` rows 316 and 317, `34-VALIDATION.md` §"Windows-latest measurement" — the
  windows-latest reds gap round 1 closes (D-19)
- `.planning/phases/34-model-effort-dial-pi-support/34-GAP-PLANNING-BRIEF.md` — gap-round defect classes;
  every planner, checker, executor, reviewer and verifier reads it

### External (primary sources, researcher re-fetches and cites)
- https://code.claude.com/docs/en/sub-agents — `effort` frontmatter field (D-01)
- https://pi.dev and https://github.com/earendil-works/pi/tree/main/packages/coding-agent/docs — Pi's AGENTS.md loading, prompt templates, skills, no-sub-agents stance (D-10, D-12)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/model-tiers.ts`: closed-tuple-plus-derived-union pattern (`MODEL_ALIASES`, `PRESET_NAMES`, `MODELS_KEYS`) — the effort vocabularies follow it exactly; the tiered table's role split is the source D-04 derives from.
- `tieredTableRefusals` / `tieredCorpusRefusals`: table integrity and per-stem coverage checks the effort tiered table reuses.
- `kit-model.listRoles()`: the derived role set with asserted count.
- Installer's Gemini/Copilot paths: the ledgered create/append/remove pattern a Pi prompt-template write follows.

### Established Patterns
- Refusal by name, exact-string membership, unknown-key refusal before reading siblings, refusal writes nothing.
- Zero-config = byte-identical adapters; guarded by a byte baseline.
- Derive the set and assert the count before new files land (set-literal drift).
- Tooling in TypeScript, compiled to committed `.js`, freshness-checked; Node 22+, zero runtime deps.
- Four-round gap-closure cap applies to this phase.

### Integration Points
- `models` block reader in `model-tiers.ts` → generator → `.claude/agents/grugops-*.md` frontmatter.
- `install/install.ts` tool detection + per-tool writes → install ledger → `install/uninstall.ts`.
- `scripts/validate-agent-factory.ts` packaging-presence checks for the new tool.

</code_context>

<specifics>
## Specific Ideas

- User's phrasing for the effort shape: "preset with manual override possibility" — confirmed as
  `models.effort.preset` + `models.effort.roles`, independent of the model preset.
- Claude Code effort levels as of 2026-10-06: `low`, `medium`, `high`, `xhigh`, `max`; default inherit.

</specifics>

<deferred>
## Deferred Ideas

- Fixing WINDOWS.md rows 274 and 315 (Windows leg green, CAP-02) — carried open, not this phase.
- A Pi skill package, or configuring Pi's own thinking level — not now; revisit if Pi users ask.
- A per-model effort capability check — rejected for this phase (D-08); revisit only if Claude Code publishes a machine-readable capability source.
- Bounding the `readModelsConfig` read (DC-3) — residual per D-18; backlog.
- `fable` as a documented model alias (34-RESEARCH.md Q6) — backlog; `MODEL_ALIASES` unchanged here.
- Non-Claude hosts finding the shared kit at `~/.grugops/agent-factory` after a scripted install
  (34-RESEARCH.md Q7) — pre-existing, `UNKNOWN - verify`, Pi inherits it; backlog. The Pi template stays a
  plain pointer (no third resolver adapter).

</deferred>

---

*Phase: 34-model-effort-dial-pi-support*
*Context gathered: 2026-10-06*
