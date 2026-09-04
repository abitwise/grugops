# Phase 30: Per-Checkpoint Autonomy Matrix - Context

**Gathered:** 2026-09-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the documentary `autonomy` scalar with an **enforced** per-checkpoint ternary matrix
(`block` / `notify` / `off`) over a **closed, derived** checkpoint set; make lowering any of the four
safety floors a **two-key** act (agent-writable config declaration + agent-unwritable per-floor
session env var read fresh by the hook); move `test_integrity` enforcement to its point of effect
(`emitVerdict()` refuses GREEN); collapse the two governance config readers into one fail-closed
discriminated-result reader; render every non-default checkpoint in a generated guarantees document
and a per-run banner, dropping the public claim a lowered floor used to back. A zero-config repo
behaves exactly as today.

Requirements: AUTO-01..07. In scope: `hooks/guard.ts`, `hooks/admission-guard.ts`,
`scripts/context-io.ts` (readers + `emitVerdict`), `scripts/audit-model.ts` (`SAFETY_FLOORS`),
`scripts/validate-agent-factory.ts`, a new checkpoint-set module, a new guarantees generator, the
config JSON + its markdown twin + seed copy, tagged stop bullets in 17 roles + 19 workflows, and
the registry rows whose `depends_on` changes. Red-team rounds are **budgeted scope**.

**Facts every decision below was taken against (verified on the tree 2026-09-05):**

- `autonomy` enforces nothing mechanically today. Consumers are prose (17 role `## Reads` bullets,
  workflows 04/05/14/15, `AGENTS.md:16`, `agent-factory/README.md:79`, `install/README.md:400-428`)
  plus one machine read: `scripts/audit-model.ts:204` (`SAFETY_FLOORS`, `configPath: "autonomy"`).
  `scripts/validate-agent-factory.ts:336-341` requires it to be a non-empty string and does **not**
  enum-check it. The matrix is new enforcement, not a port.
- There are **three** config readers: `readGovernanceConfig` (`scripts/context-io.ts:1275`, fails
  OPEN to lean), `readGovernanceConfigResult` (`:1343`, `source: absent|ok|unreadable`, hook fails
  CLOSED on `unreadable`), and a deliberate third in `scripts/model-tiers.ts:33,112-113,278,1307`
  that reads the `models` key and documents that it does not import or wrap the governance pair.
  Non-test call sites of the pair: `context-io.ts:1058` (inside `admit()`), `:1505`, and
  `hooks/admission-guard.ts:128`.
- There are **two different "four floors" lists**: `SAFETY_FLOORS` in `scripts/audit-model.ts:202-224`
  (`autonomy`, `test_integrity`, `production_requires_human_confirmation`, `protected_branch_merge`)
  and `scripts/floor-invariance.test.ts:12-17` invariants 1-4 (refuse-self, no-fabrication,
  test-integrity, guard-byte-frozen). Only `test_integrity` overlaps.
- `emitVerdict` (`scripts/context-io.ts:936-980`) has no RED path and does not read `test_integrity`;
  it is called only on a green terminal result. ~15 test pins across `context-io.test.ts`,
  `admission-server.test.ts`, `compactor.test.ts`, `floor-invariance.test.ts`,
  `admission-protocol-docs.test.ts`. `test_integrity` exists only as a config enum
  (`validate-agent-factory.ts:356`, `warn|block`, `off` excluded per TINT-03).
- `hooks/guard.ts` is byte-frozen: `FROZEN_GUARD_BLOB` at `scripts/floor-invariance.test.ts:95`
  (re-asserted `:548`). Its `APPROVAL = "GRUGOPS_PROD_DEPLOY_APPROVED"` (`:34`) with same-command
  self-approval refusal at `:118` is the existing one-key precedent; `hooks/admission-guard.ts:115,132,152`
  already implements a **per-name human grant** via env var.
- Claim registry `docs/audit/28-claim-registry.md`: 47 rows `C-28-001..047`, `depends_on` drawn from
  `SAFETY_FLOORS` ids (enforced at `audit-model.ts:1410-1420`), header `:26-28` names Phase 30's join
  explicitly. `depends_on` distribution: 41 `—`, 1 `autonomy`, 4 `autonomy+prod+merge`,
  1 `merge+prod+test_integrity`. Enforced by `scripts/check-claim-anchors.ts` (bijection + verbatim at
  anchor). Ids are contiguity-checked (Phase 29 D-4x).
- **No guarantees renderer and no runtime governance banner exist.** Closest templates:
  `scripts/generate-safety-surface.ts` (registry-derived, fixed `OUT`, `REGEN_COMMAND`, fail-closed on
  empty) and `scripts/coordinator-resolution-precheck.ts:293-307` (banner + exit-status agreement).
- Section parsers already exist: `locateSection` in `scripts/check-diff-disposition.ts:488,494` over
  `FROZEN_SOURCES: Record<FrozenSourceName, …>` (`:586`), which is also the tree's strongest
  compile-error-on-missing-member example. `## Hard limits` is in all 17 `kit-model.listRoles()`
  roles; `## Stop conditions` in 19 workflows (`00-…18-`). `check-diff-disposition` treats both as
  **frozen regions** with D-04 same-commit companion edits.
- `satisfies Record<…>` does not yet appear anywhere in the tree; the only `never`-exhaustiveness proof
  is `assertNeverVerdict` (`scripts/frontmatter.ts:3628-3641`).
- Config has a byte-identical seed twin at `agent-factory/seed/.grugops/factory.config.json` and a
  markdown twin `agent-factory/config/factory.config.md`, both held by consistency oracles
  (`config-governance-consistency.test.ts`, `config-queue-consistency.test.ts`,
  `model-dial-consistency.test.ts`).

</domain>

<decisions>
## Implementation Decisions

### Checkpoint set and floors (AUTO-01, AUTO-07)

- **D-01: The checkpoint set is DERIVED, not hand-listed.** A parser (reusing `locateSection`) walks
  the 17 role `## Hard limits` and 19 workflow `## Stop conditions` sections and collects **tagged**
  stop bullets. The exported `CHECKPOINTS as const` roster must equal the derived id set
  **two-sided** (an id in either set and not the other is red). Untagged bullets are prose and are
  not checkpoints. Rationale: set-literal drift is this milestone's founding defect class.
- **D-02: Tag syntax is a trailing backticked token in canonical form:** `` `checkpoint: <id>` `` as
  the last token of the bullet, matched by one strict regex. Anything else containing the word
  `checkpoint` in those sections is **refused**, not tolerated (D-64 allow-list posture, not a wider
  parser). Visible to a human reading the role; no HTML comment, no frontmatter duplication.
- **D-03: Ids are snake_case verb-noun and GLOBAL.** The same human stop tagged in a role and a
  workflow shares one id and one matrix cell. A second derived map `id → sites` is asserted against
  the roster's recorded site count, so a tag added or removed anywhere is red.
  — **Reversibility:** costly — ids are consumed by config keys, env var names, registry
  `depends_on`, the render and the banner; renaming one later is a multi-surface change.
- **D-04: `SAFETY_FLOORS` (`scripts/audit-model.ts`) is the canonical floor list.** The four floor-tier
  checkpoints are its members. The `floor-invariance.test.ts` invariants (refuse-self, no-fabrication,
  guard-byte-frozen) are **non-dialable test-harness properties**, recorded explicitly as outside the
  matrix; they never become checkpoints.
- **D-05: The `autonomy` floor id and config scalar are RETIRED.** The five registry rows carrying
  `depends_on: autonomy` remap to the checkpoints that actually hold them (D-06's `open_pr` /
  `commit_to_branch` and `protected_branch_merge`). The validator **refuses** a present `autonomy`
  key with a message naming the replacement. No coexistence, no "matrix wins on conflict".
  — **Reversibility:** one-way — registry `depends_on` values and the Phase 28 floor→claims index are
  rewritten; restoring the scalar would mean re-deriving which rows it backed.
- **D-06: The diff/branch/pr grades survive as two checkpoints, `commit_to_branch` and `open_pr`.**
  Legacy mapping is mechanical and documented in `factory.config.md`: `diff` = both `block`;
  `branch` = `commit_to_branch: off`, `open_pr: block`; `pr` (today's default) = both `off`. Merge
  is the separate, always-present floor `protected_branch_merge`.
- **D-07: Every checkpoint is ternary; floors differ only in needing key two.** One matrix, one rule.
  Floor-tier members additionally require the D-09 env var for `notify` **or** `off` to take effect.

### Two keys, notify, trace (AUTO-02, AUTO-03)

- **D-08: Config shape is a flat `checkpoints: { <id>: block|notify|off }` object.** Unknown id or
  non-canonical value: refused by `validate-agent-factory.ts` and **gated as `block`** at runtime.
  Absent object or absent key = the roster default. Matches the `quality` / `context` object
  convention. Must land in the JSON, its markdown twin, and the seed copy in the same commit.
- **D-09: Key two is one env var per floor: `GRUGOPS_FLOOR_<ID>=<human name>`**, value a non-empty
  name (same rule as `GRUGOPS_PROD_DEPLOY_APPROVED`), read fresh by the hook process on every
  invocation. A var set by the current tool call itself (`export X=… && cmd`) is refused, extending
  the `guard.ts:118` self-approval refusal. No list-valued var, no token file, no blanket grant.
- **D-10: Config lowered + env var absent = behaves exactly as `block`, loudly.** The denial names the
  checkpoint and the missing env var, and the unauthorized declaration is written to the trace as a
  finding, so an agent editing config alone changes nothing **and** is visible.
- **D-11: `notify` at a hook-enforced checkpoint = allow + shared-context finding note + banner line.**
  The hook writes a note (kind `finding`, by the hook identity, naming checkpoint, actor, command)
  through the sanctioned write path, and the banner lists the checkpoint. Not stderr-only; not
  Claude-Code-only `permissionDecision: ask`.

### Reader collapse and test_integrity (AUTO-04, AUTO-06)

- **D-12: One reader: `readGovernanceConfig(root)` returns a discriminated result**
  `{ source: "absent" | "ok" | "unreadable", config }` where `config` now includes the checkpoint
  matrix. The value-only reader is **deleted**; all three call sites move. `unreadable` is treated as
  `block` everywhere. Tests at `context-io.test.ts:848-905, 1661-1720, 1798` are rewritten, not
  appended to.
- **D-13: The `model-tiers.ts` third reader is OUT of scope and disclosed.** It reads a different key
  and is not a safety path. A comment names it as the one deliberate non-governance reader and a test
  **asserts the count of config-reading sites** (derived by grep, not by hand) so a fourth cannot
  appear silently. Folding it is a backlog item (see deferred).
- **D-14: In-process `admit()` on `unreadable` config REFUSES the write and degrades to
  `UNKNOWN - verify`**, exactly as a non-green gate does (Phase 21). It never throws.
- **D-15: `emitVerdict()` takes the gate run's test-integrity result as an EXPLICIT argument.** No
  hidden file or log read inside the frozen path. The signature change is deliberate and every pin is
  updated in the same plan. The hook-enforced vs in-process tier split is stated in the config doc and
  in `emitVerdict`'s header comment.
- **D-16: When test integrity is not clean, `emitVerdict` EMITS NOTHING.** The finding stays
  `UNKNOWN - verify`. No RED verdict kind is introduced; `isLiveGreenVerdict`, the compactor and the
  dual-path oracle stay unchanged. `test_integrity: warn` still records the integrity finding in the
  trace; `block` additionally fails the gate.

### Guarantees render and banner (AUTO-05, AUTO-07)

- **D-17: New `scripts/generate-guarantees.ts` → `docs/GUARANTEES.md`**, modelled on
  `generate-safety-surface.ts`: fixed `OUT` path, `REGEN_COMMAND`, freshness-gated, fail-closed on an
  empty join. It joins the live matrix with registry rows of `kind: safety` via `depends_on`.
  `README.md`, `AGENTS.md`, `agent-factory/README.md` each carry **one anchored generated pointer
  line** to it.
- **D-18: A dropped claim is REPLACED IN PLACE under its anchor.** The anchor stays; the anchored text
  becomes a generated disclosure naming checkpoint, value and authorizing name. The registry row gains
  status `dropped`. `check-claim-anchors` compares against the generated text, so the bijection and id
  contiguity hold. No deletion, no strike-through.
  — **Reversibility:** costly — the registry `status` enum grows and the verbatim gate learns a
  generated form; removing either later means re-auditing every anchored region.
- **D-19: The banner is printed by every hook denial or notify AND as the gate run (workflow 05)
  header**, before any check output, with banner/exit-status agreement in the coordinator-precheck
  shape. `/grug` start and the install doctor are not banner sites in this phase.
- **D-20: Zero-config prints ONE fixed banner line: `all checkpoints at default`.** Always present so a
  missing banner and a broken banner look different. The AUTO-07 test asserts a zero-config run
  differs from HEAD **only** by this line.

### Red-team budgeting (scope, per ROADMAP)

- **D-21: Two red-team surfaces.** A = the two-key hook path (`guard.ts`, `admission-guard.ts`, env
  read, self-approval refusal) + `emitVerdict`'s TI refusal. B = set derivation, reader collapse,
  validator, render, banner. **A starts only after B's derived set is green**, since A's floor ids come
  from it.
- **D-22: Cap 4 gap-closure rounds per surface, then a D-58-style fence.** A finding after round 4
  becomes a backlog item or follow-up phase, not round 5.
- **D-23: Closure standard = structural fix + mirror repro + two independent red-teams.** Pre-fix
  mirror exit 0 vs HEAD exit 1 on the committed `.js` for every bypass; two independent opus red-teams
  find nothing new on the surface. A green suite never closes a floor.
- **D-24: `guard.ts` is unfrozen and re-frozen in the SAME commit.** One commit changes `guard.ts` and
  `FROZEN_GUARD_BLOB` together under the D-04 companion rule; the freeze test refuses a hash-only or
  code-only change. No second hook file deciding the same tool call.

### Anti-pattern carried forward (Phase 28 AP-1, severity `blocking`)

`.planning/phases/28-kit-consistency-audit/.continue-here.md`: **a gate prints a PASS line for a
check it did not perform.** Structural prevention here: every "derived set equals roster" and "banner
present" assertion must derive its denominator independently of the loop that consumes it (the P29
vacuity-floor lesson), and the AUTO-07 test compares whole-run output against HEAD rather than
asserting the presence of a line.

### Claude's Discretion

- `off` on a floor requires the same env var as `notify` (both are lowerings) — stated as D-07; the
  exact denial/notify message wording is the planner's.
- Hosts without hooks (Codex, Gemini, OpenCode, Copilot) keep the documentary tier for hook-enforced
  checkpoints; the tier split is disclosed in `factory.config.md` and the render. How the sequential
  role-load path surfaces `notify` there is open to research.
- Banner line format, the note body layout for D-11, and whether the render also runs at install
  `--check` are planner choices within the constraints above.
- The migration note for user repos already carrying `autonomy: diff|branch` (D-06 table) may live in
  `factory.config.md` or `CHANGELOG.md`; planner decides.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap
- `.planning/ROADMAP.md` — Phase 30 goal, success criteria 1-5, research flag, "red-team rounds are
  scope" statement; Phase 32 line ~948 already depends on the autonomy banner.
- `.planning/REQUIREMENTS.md` — AUTO-01..07 (lines 100-108); milestone framing lines 34, 37.
- `.planning/PROJECT.md` — v2.1 goal 2: "four safety floors become dialable behind a named-human
  opt-in… do not become silent booleans".

### Safety floors, claims and the registry join
- `scripts/audit-model.ts` — `SAFETY_FLOORS` (:195-224, canonical per D-04), `safetyFloorLiveValue`,
  `readRegistry()`, `depends_on` ∈ floor-set enforcement (:1410-1420).
- `docs/audit/28-claim-registry.md` — 47 rows, row schema (:34-45), floor→claims index (:836), header
  naming Phase 30's join (:26-28).
- `scripts/check-claim-anchors.ts` — anchor↔row bijection + verbatim-at-anchor; its header states it
  exists so Phase 30 can drop claims by id.
- `scripts/generate-safety-surface.ts` — the template for `generate-guarantees.ts` (D-17).
- `scripts/check-banned-claims.ts` :1559-1770 — the registry-anchored byte-frozen exemption region
  (touching a denial sentence is a two-file change, Phase 29 D-4x).

### Readers, emitVerdict, admission
- `scripts/context-io.ts` — `readGovernanceConfig` (:1231-1281), `readGovernanceConfigResult`
  (:1322-1348), `isGatedNote` (:1461), `admit()` (~:1058), `emitVerdict` (:914-980),
  `isLiveGreenVerdict` (:920-927), `trustedGateEmission` (:600, :668).
- `scripts/model-tiers.ts` :33, :112-113, :278, :1307 — the disclosed third reader (D-13).
- `hooks/admission-guard.ts` — per-name env grant (:115, :132, :152), stdin deny model (:92-120),
  reader call (:128).
- `hooks/guard.ts` — `APPROVAL` (:34), deploy/merge regexes (:49-79), self-approval refusal (:118),
  deny (:130). `hooks/hooks.json` — wiring.
- `scripts/floor-invariance.test.ts` — `FROZEN_GUARD_BLOB` (:95, :548), invariants 1-4 (:12-17),
  `GUARD_JS` (:87) pointing at `hooks/admission-guard.js` (note the two artifacts in one file).

### Section derivation and closed sets
- `scripts/check-diff-disposition.ts` — `locateSection` (:488, :494), `FROZEN_SOURCES` as
  `Record<FrozenSourceName, …>` (:586), frozen regions `## Hard limits` / `## Stop conditions` /
  `## Commit` (:596, :1142, :1827).
- `scripts/section-locator-oracle.test.ts` — the section locator's oracle (Phase 29 unification).
- `scripts/validate-agent-factory.ts` — `ROLE_SECTIONS`/`WORKFLOW_SECTIONS` (:200-224), config
  validation (:330-392), `Q_ENUMS.test_integrity` (:356).
- `scripts/check-foundation-guards.ts` :2940 — D-19 section-ownership rule (a prohibition lives in
  `## Hard limits` and nowhere else).
- `scripts/check-imperative-lexicon.ts` :1086, :1172 — treats `## Stop conditions` bullets as
  conditionals; the D-02 tag must not trip it.
- `scripts/kit-model.ts` — `listRoles()` (17, `_`-prefixed excluded); the derivation authority for role
  and workflow file sets.
- `scripts/frontmatter.ts` :3628-3641 — `assertNeverVerdict`, the exhaustiveness idiom to reuse.

### Config and its twins
- `agent-factory/config/factory.config.json`, `agent-factory/seed/.grugops/factory.config.json`
  (byte-identical), `agent-factory/config/factory.config.md` (:14 autonomy row, :164-174 default-on-
  absent contract).
- `scripts/config-governance-consistency.test.ts`, `scripts/config-queue-consistency.test.ts`,
  `scripts/model-dial-consistency.test.ts` — JSON↔markdown oracles the new key must satisfy.

### Banner precedents
- `scripts/coordinator-resolution-precheck.ts` :293-307 — banner + exit-status agreement.
- `install/install.ts` :198-232 — provenance banner sentinels (exactly-one-banner assertion).

### Prior-phase context and lessons
- `.planning/phases/29-controlled-language-voice-guard-rebuild/29-CONTEXT.md` — D-30..D-33 (claims
  registered so Phase 30 can void by id), D-58 round fence precedent.
- `.planning/phases/28-kit-consistency-audit/.continue-here.md` — AP-1 (blocking).
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md` — set-derivation posture,
  D-64 canonical-form allow-list.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `locateSection` (`check-diff-disposition.ts`) + `kit-model.listRoles()` / workflow listing: the
  derivation pipeline for D-01 already exists; add a tag extractor, not a new section parser.
- `hooks/admission-guard.ts` per-name env grant + explicit `deny(...)` on malformed stdin: the model
  for D-09/D-10.
- `generate-safety-surface.ts`: fixed-path, registry-derived, freshness-gated generator to clone for
  D-17.
- `readGovernanceConfigResult`'s `source` discriminant: keep its shape, extend `config`, delete the
  other reader (D-12).
- `Record<Union, …>` over a string-union key (`FROZEN_SOURCES`) for the compile-error default table;
  first use of `satisfies Record<Checkpoint, Disposition>` in the tree is acceptable.

### Established Patterns
- Absent key = documented lean default, never an error; only a present invalid value is refused
  (SC4). D-08 keeps this for absence and adds refuse-and-block for present-invalid.
- D-04 (Phase 29) same-commit companion edits for frozen regions: tagging bullets inside
  `## Hard limits` / `## Stop conditions` touches frozen sources; `check-diff-disposition` will demand
  the companion.
- "Derive the set, assert the count" with the denominator computed independently of the consuming
  loop.
- One authority per predicate; when unifying, the authority's **scope** is a new degree of freedom
  (P29 lesson) — the tag regex must be section-anchored, not file-wide.

### Integration Points
- `hooks/guard.ts` deny path (:130) gains the matrix lookup + key-two read + banner prefix.
- `admit()` (`context-io.ts:~1058`) switches to the single reader and the D-14 degrade path.
- Workflow `05-pr-quality-gate.md` passes the integrity result into `emitVerdict` (D-15) and prints the
  banner header (D-19).
- `docs/audit/28-claim-registry.md` `depends_on` remap (D-05) + new `dropped` status (D-18);
  `audit-model.ts` floor-set check follows `SAFETY_FLOORS` automatically.
- `validate-agent-factory.ts` gains `checkpoints` validation and the `autonomy` refusal (D-05, D-08).
- `.planning/ROADMAP.md` Phase 32 consumes the banner; keep its name/format stable once landed.

</code_context>

<specifics>
## Specific Ideas

- Tag example the user accepted: `` - Never merge a protected branch. `checkpoint: protected_branch_merge` ``
- Env var example: `GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE="Olger Oeselg"` set in the shell before the
  session, never in the tool call.
- Dropped-claim disclosure example: "This guarantee is lowered in this repo:
  `protected_branch_merge=notify`, authorized by <name>."
- Zero-config banner line: `all checkpoints at default`.
- Round discipline mirrors Phase 25/27 closure and Phase 29's D-58 fence.

</specifics>

<deferred>
## Deferred Ideas

- **Fold the `model-tiers.ts` config reader into the single governance reader** — one parse for all
  keys. Out of scope for AUTO-06 (D-13); would reopen the freshly closed 29.1/29.2 model dial.
- **Banner at `/grug` session start and in the install `--check` doctor** — additional banner sites;
  not mechanical on four hosts / not in AUTO-05's text. Candidate for Phase 32's board/dashboard work.
- **Interactive `permissionDecision: ask` tier for Claude Code** — a real pre-action stop for
  `notify`; rejected for this phase because semantics would diverge per host.
- **Matcher-completeness for `## Stop conditions` prose** (which untagged bullets *should* have been
  tagged) — a totality over open prose, held as content per the Phase 29 D-59 posture; not a gate.

</deferred>

---

*Phase: 30-per-checkpoint-autonomy-matrix*
*Context gathered: 2026-09-05*
