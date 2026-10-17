# Phase 30: Per-Checkpoint Autonomy Matrix - Research

**Researched:** 2026-09-05
**Domain:** In-repo safety-floor mechanics (TypeScript tooling, Claude Code PreToolUse hooks, derived-set gates, generated documents)
**Confidence:** HIGH on the codebase findings (read this session); MEDIUM on the Claude Code hook/settings semantics (official docs via Context7)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `.planning/phases/30-per-checkpoint-autonomy-matrix/30-CONTEXT.md` `## Implementation Decisions`.

**Checkpoint set and floors (AUTO-01, AUTO-07)**

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

**Two keys, notify, trace (AUTO-02, AUTO-03)**

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

**Reader collapse and test_integrity (AUTO-04, AUTO-06)**

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

**Guarantees render and banner (AUTO-05, AUTO-07)**

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

**Red-team budgeting (scope, per ROADMAP)**

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

**Anti-pattern carried forward (Phase 28 AP-1, severity `blocking`)**

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

### Deferred Ideas (OUT OF SCOPE)

- **Fold the `model-tiers.ts` config reader into the single governance reader** — one parse for all
  keys. Out of scope for AUTO-06 (D-13); would reopen the freshly closed 29.1/29.2 model dial.
- **Banner at `/grug` session start and in the install `--check` doctor** — additional banner sites;
  not mechanical on four hosts / not in AUTO-05's text. Candidate for Phase 32's board/dashboard work.
- **Interactive `permissionDecision: ask` tier for Claude Code** — a real pre-action stop for
  `notify`; rejected for this phase because semantics would diverge per host.
- **Matcher-completeness for `## Stop conditions` prose** (which untagged bullets *should* have been
  tagged) — a totality over open prose, held as content per the Phase 29 D-59 posture; not a gate.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description (from REQUIREMENTS.md:100-108) | Research Support |
|----|--------------------------------------------|------------------|
| AUTO-01 | Every human stop is enumerated into a closed, exported checkpoint set sourced from `## Stop conditions` and role `## Hard limits`, such that adding a checkpoint without a default is a compile error | §F-1 (the role corpus has no bullets — the derivation source must be redesigned), §Standard Stack (`satisfies Record<Checkpoint, Disposition>` compile-error idiom), §Don't Hand-Roll (reuse `locateSection` + `kit-model` listers, not a new parser) |
| AUTO-02 | Ternary matrix replaces the `autonomy` scalar, fail-closed on unknown/malformed — gates at least as strictly as `block` | §F-4 (`autonomy` is a REQUIRED key at `validate-agent-factory.ts:336` and lives in 8 fixture repos), §Pitfall 4 (the `GATE_OR_STRICTER` canonicalization precedent already in `context-io.ts`) |
| AUTO-03 | Two keys: agent-writable config declaration + per-floor session env var the hook reads fresh (agent-unwritable), never blanket | **§F-2 — the "agent-unwritable" premise is not unconditionally true**; `settings.json` `env` reaches spawned subprocesses and is reapplied mid-session. Mitigation + honest-residual guidance in §F-2 and §Pitfall 1 |
| AUTO-04 | `test_integrity` moves to the point of effect (`emitVerdict()` refuses GREEN) rather than a false-equivalent env mechanism | **§F-3 — `emitVerdict` has no production caller and no CLI verb**; workflow 05 claims one that does not exist. §Architecture Pattern 3 |
| AUTO-05 | Claim-dropping is mechanical — generated guarantees render + per-run banner naming every non-default checkpoint | §F-6 (`docs/GUARANTEES.md` would be born outside both language gates), §Standard Stack (`generate-safety-surface.ts` template), §F-5 (6 `kind: safety` rows, 5 carry `autonomy`) |
| AUTO-06 | The two readers collapse into a single discriminated-result fail-closed reader; the second authority is deleted, not joined by a third | §F-7 (exact call-site inventory: 3 non-test sites), §Architecture Pattern 2 |
| AUTO-07 | Defaults unchanged — a zero-config repo behaves exactly as today, no floor lowered by omission | §Validation Architecture (the HEAD-vs-run differential test), §Pitfall 6 (the vacuity floor) |
</phase_requirements>

---

## Summary

This phase is almost entirely **in-repo mechanism work**. There is no library to choose, no package to
install, and no framework question to settle: the stack is already fixed by `CLAUDE.md` (TypeScript
compiled by `tsc` to committed `.js`, Node 22+, zero runtime dependencies, vitest for tests). The
research value therefore lies not in "what should we use" but in **which of the phase's locked
premises survive contact with the tree**, and the answer is that three of them do not survive
unmodified.

The three findings that change the plan are: (1) the 17 role `## Hard limits` sections contain **zero
markdown bullets** — they are prose paragraphs, so D-01/D-02's "tagged stop bullets" derivation has
only one of its two declared corpora; (2) the AUTO-03 premise that a session env var is
"agent-unwritable" is **conditionally false** — Claude Code's `settings.json` `env` block writes into
every spawned subprocess and is reapplied dynamically mid-session, and project-scoped settings outrank
user-scoped ones, so an agent with file-write access to `.claude/settings.json` can inject the grant;
and (3) `emitVerdict()` has **no production caller and no CLI verb**, so D-15's "explicit argument
from the gate run" is an argument supplied by an agent following a markdown procedure, not by trusted
code — which is the same false-equivalence AUTO-04 exists to refuse.

None of these invalidates the phase. Each has a structural answer already precedented in this
repository, and each is exactly the kind of premise the phase's own red-team budget is meant to find —
better found now, in research, than in round 3. The remaining findings are lower-drama but
plan-shaping: `autonomy` is a *required* config key that lives in 8 test-fixture repos, the `guard.ts`
freeze can only go green after a commit (not after an edit), and a new `docs/GUARANTEES.md` would be
born outside both of the repository's language gates because `**/docs/` is an excluded segment.

**Primary recommendation:** Plan the checkpoint derivation against **workflow `## Stop conditions`
bullets only** (38 bullets, 19 files, a real bulleted corpus) and derive the role-tier stops through a
second, explicitly different mechanism — do not force a bullet grammar onto prose. State the
env-var residual honestly in `docs/GUARANTEES.md` and pair the grant with a `permissions.deny` rule
plus a `Write|Edit` PreToolUse companion on the settings files, following the repository's own
`accepted / irreducible` residual posture rather than claiming an unforgeable grant it does not have.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Checkpoint set derivation (AUTO-01) | Build-time TypeScript module (`scripts/`) | Test oracle (two-sided cardinality) | The set is derived from the kit corpus at build/test time; no runtime component needs to walk markdown |
| Compile-error-on-missing-default (AUTO-01) | TypeScript type system (`satisfies Record<…>`) | — | A missing member must fail `tsc`, not a test — a test can be skipped, a type cannot |
| Matrix parse + fail-closed canonicalization (AUTO-02) | `scripts/context-io.ts` single reader | `validate-agent-factory.ts` (form check) | Runtime gating is the reader's; form refusal at authoring time is the validator's. Two different questions, deliberately two owners |
| Key-two authorization (AUTO-03) | PreToolUse hook process (`hooks/guard.ts`) | Host permission config (`permissions.deny` on settings files) | Only a separate process reading its own env is un-forgeable from inside the agent's shell; the settings-file vector needs a host-tier answer, not an in-process one |
| `test_integrity` enforcement (AUTO-04) | `scripts/context-io.ts` `emitVerdict()` | Workflow 05 markdown procedure | Point of effect is where the GREEN note is written; the workflow only supplies the input |
| Guarantees render (AUTO-05) | Build-time generator (`scripts/generate-guarantees.ts`) | Freshness gate | Same tier as `generate-safety-surface.ts` — a fixed-path generator plus a byte-equality freshness check |
| Run banner (AUTO-05, AUTO-07) | Hook process (denial/notify) + workflow 05 header | — | The banner must print where the decision is made; a banner rendered elsewhere can disagree with the decision |
| Zero-config equivalence (AUTO-07) | Test harness (whole-run differential) | — | Equivalence is a property of the run, not of any one component |

---

## Standard Stack

There is nothing new to install. The stack is fixed by `CLAUDE.md` and by `package.json`.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | `~6.0.3` (installed: `6.0.3`) | All tooling source; compiled to committed `.js` | Ratified 2026-06-13 (D-13 in `CLAUDE.md`). `[VERIFIED: package.json devDependencies + npx tsc --version → "Version 6.0.3", 2026-09-05]` |
| Node.js | `>=22` declared; installed `v24.12.0` | Runtime for the committed `.js` on hosts and in CI | `package.json` `"engines": { "node": ">=22" }`. `[VERIFIED: cat package.json + node --version, 2026-09-05]` |
| vitest | `~4.1.8` (installed: `4.1.8`) | The whole test suite (53 `*.test.ts` files) | `[VERIFIED: package.json devDependencies + npx vitest --version → "vitest/4.1.8 darwin-arm64 node-v24.12.0", 2026-09-05]` |
| Node stdlib only | — | `node:fs`, `node:path`, `node:child_process` for `git` | Every guard and hook in this tree is stdlib-only by hard rule; both hooks import only `node:fs` plus (for `admission-guard`) one in-repo module |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `git` CLI | `2.55.0` | `hash-object` for the byte freeze; `show HEAD:` / `ls-tree -r HEAD` for the freshness gate | Already a dependency of `floor-invariance.test.ts` and `scripts/freshness.ts`. `[VERIFIED: git --version, 2026-09-05]` |
| Claude Code | `2.1.261` | The one host that enforces hooks | `[VERIFIED: claude --version → "2.1.261 (Claude Code)", 2026-09-05]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `satisfies Record<Checkpoint, Disposition>` for the compile-error default table | A runtime `assertNever` exhaustiveness proof | `assertNever` is already the tree's only exhaustiveness idiom (`scripts/frontmatter.ts:3628-3641`, per CONTEXT.md), but it fires at *runtime*. AUTO-01 says "**compile error**", which only `satisfies Record<…>` over a closed key union delivers. Use `satisfies`; keep `assertNever` for the value-side switch |
| A new hook file for the two-key logic | Extending `hooks/guard.ts` | D-24 already locks this: one hook, unfrozen and re-frozen in one commit. A second hook deciding the same `Bash` tool call is two authorities — the defect class this milestone exists to close |
| A new markdown section parser for the tag | `locateSection` from `check-diff-disposition.ts` | The tree already has one section-locator authority with its own oracle (`scripts/section-locator-oracle.test.ts`). A second parser reopens the P29 "one authority per predicate" lesson |

**Installation:** none. This phase adds zero dependencies to `package.json`.

---

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.**

`grugops` ships with zero runtime dependencies (`CLAUDE.md`: "Host machines run the committed `.js`
with **zero runtime dependencies installed**"), and the dev/build dependency set is unchanged by this
phase. The current `devDependencies` are `@types/node ~22`, `typescript ~6.0.3`, `vitest ~4.1.8`
`[VERIFIED: cat package.json, 2026-09-05]` — all three already present and load-bearing before Phase 30.

**Packages removed due to `[SLOP]` verdict:** none — no packages proposed.
**Packages flagged as suspicious `[SUS]`:** none — no packages proposed.

If planning later reaches for a markdown parser, a YAML library, or a CLI-arg library, that is a
**scope change**, not an implementation detail: it would break the zero-runtime-dependency constraint
in `CLAUDE.md`, and the planner should raise it rather than absorb it.

---

## Findings That Change The Plan

These are the load-bearing discoveries. Each is a premise in CONTEXT.md that the tree does not
support as written.

### F-1 (BLOCKING for D-01/D-02) — the 17 role `## Hard limits` sections contain zero bullets

D-01 says the parser "walks the 17 role `## Hard limits` and 19 workflow `## Stop conditions` sections
and collects **tagged** stop bullets." Half of that corpus has no bullets to tag.

Derived on the tree, per file, counting lines matching `/^\s*[-*]\s+/` inside each located section
`[VERIFIED: node one-liner over agent-factory/roles + agent-factory/workflows, 2026-09-05]`:

```
17 role files with "## Hard limits":  0 bullets each.  Subtotal 0.
19 workflow files with "## Stop conditions": 1,2,1,2,2,3,1,1,2,2,1,1,1,1,4,4,3,3,3.  Subtotal 38.
TOTAL BULLETS IN THOSE SECTIONS: 38
```

Both section sets exist at full cardinality — `grep -rl "^## Hard limits" agent-factory/roles/ | wc -l`
returns `17` and `grep -rl "^## Stop conditions" agent-factory/workflows/ | wc -l` returns `19`
`[VERIFIED: those two commands, 2026-09-05]`. The role sections are **prose paragraphs**. Verbatim,
the whole of `agent-factory/roles/software-engineer.md`'s first Hard-limits paragraph
`[VERIFIED: awk over agent-factory/roles/software-engineer.md, 2026-09-05]`:

> `Make a small diff for one ticket: no big rewrites, no unrequested dependency changes, no architecture change without an ADR, no hidden scope. Stop and hand back if scope grows or the architecture must change.`

and `agent-factory/roles/orchestrator.md`'s:

> `Never merge to a protected branch. Never deploy to prod. Never exceed WIP without a written reason. Never route around a stop condition because the request is urgent — urgency is when the gate matters most.`

Note that the orchestrator paragraph carries **four distinct prohibitions in one paragraph**, at least
two of which (`Never merge to a protected branch`, `Never deploy to prod`) are exactly the floors this
phase must tag. D-02's rule — "trailing backticked token as the **last token of the bullet**" — has no
defined referent here: the "bullet" does not exist, and "last token of the paragraph" would attach one
tag to four prohibitions.

**Three viable dispositions, in the planner's order of preference:**

1. **Narrow the derivation corpus to workflow `## Stop conditions` and derive role-tier floors from
   `SAFETY_FLOORS` instead.** D-04 already makes `SAFETY_FLOORS` the canonical floor list, and floors
   are precisely the stops that live in role prose. This keeps one bullet grammar over one bulleted
   corpus and needs no reformatting of a frozen region. Cost: the roster's `id → sites` map (D-03)
   records workflow sites only for non-floor checkpoints; the role prose stays documentary. This is
   the cheapest option that keeps every locked decision except D-01's "and 17 role `## Hard limits`"
   clause.
2. **Add a tagged bullet list *beneath* the existing role prose** — leave the paragraphs untouched and
   append a short bulleted "Checkpoints" list inside the same `## Hard limits` section. Preserves both
   corpora and the bullet grammar. Cost: 17 frozen-region edits, each owing a `check-diff-disposition`
   companion row (see §F-8), and a risk that `check-foundation-guards`'s D-19 section-ownership rule
   reads a tagged bullet as a *restated* limit (that rule is documented as **not mechanically
   enforced** — see §F-8 — so the risk is review-tier, not gate-tier).
3. **Reformat the 17 role paragraphs into bullets.** Highest cost, largest frozen-region diff, and it
   converts a prose-voice surface that Phase 29 just finished rewriting. Not recommended.

**Confirmed clean:** the token `checkpoint` appears **zero times** inside any of those 36 sections
today `[VERIFIED: node scan over both corpora, 2026-09-05: "occurrences: 0"]`, so D-02's
refuse-anything-else allow-list posture starts from an empty collision set. Likewise
`GRUGOPS_FLOOR_*` appears nowhere in the shipped tree (only in `.planning/` prose)
`[VERIFIED: grep -rhon "GRUGOPS_[A-Z_]*" over *.ts and *.md excluding node_modules, 2026-09-05]` — the
env namespace is free.

### F-2 (BLOCKING for AUTO-03's wording) — "agent-unwritable" is conditionally false

AUTO-01..07 and D-09 rest on the claim that a session env var is a signal the agent cannot set. The
repository's own argument for this is stated in `hooks/admission-guard.ts:22-24`
`[VERIFIED: hooks/admission-guard.ts:21-33, read in full this session]`:

> `an agent's own inline `export VAR=...` lands in the child env it spawns, which the hook process never inherits; the human's session export DOES reach the hook.`

That argument is correct **for the inline-export vector** and is confirmed by the vendor docs: a hook
process inherits the parent environment `[CITED: code.claude.com/docs/en/hooks — "Hook Execution
Environment": "A hook process inherits the parent environment, allowing it to read variables like
$ANTHROPIC_MODEL if set in the shell"]`.

But it is **not the only vector**, and the second one is not addressed anywhere in this tree:

- `[CITED: code.claude.com/docs/en/settings-reference — "env"]` — "The `env` setting defines
  environment variables for **every session and spawned subprocess**, overriding matching shell
  variables."
- `[CITED: code.claude.com/docs/en/env-vars — "Precedence"]` — "Shell environment variable changes take
  effect on the next launch of Claude Code, whereas **settings file `env` entries are reapplied
  dynamically during active sessions when the file changes**."
- `[CITED: code.claude.com/docs/en/settings — "Settings precedence"]` — highest to lowest: managed
  settings, CLI arguments, `.claude/settings.local.json`, `.claude/settings.json`,
  `~/.claude/settings.json`. **Project-scoped settings outrank the user's own.**

Composed: an agent with `Write`/`Edit` access to `.claude/settings.json` or
`.claude/settings.local.json` can add `{"env": {"GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE": "Olger Oeselg"}}`,
the value is reapplied to the live session, and the next hook subprocess reads it as if a human had
exported it. The hook cannot distinguish provenance: `process.env[NAME]` is the same string either way.

**This is a pre-existing exposure, not one Phase 30 introduces.** It applies identically to
`GRUGOPS_PROD_DEPLOY_APPROVED` (`hooks/guard.ts:34,130`
`[VERIFIED: hooks/guard.ts:34 — `const APPROVAL = "GRUGOPS_PROD_DEPLOY_APPROVED";` and :130 —
`if (isDeploy && !process.env[APPROVAL]) {`, read in full this session]`) and to
`GRUGOPS_ADMISSION_APPROVED_BY` (`hooks/admission-guard.ts:72,205`
`[VERIFIED: hooks/admission-guard.ts:72 — `const APPROVAL = "GRUGOPS_ADMISSION_APPROVED_BY";` and
:205 — `const approver = process.env[APPROVAL];`, read in full this session]`). Phase 30 is the first
phase to *look*, which is why it is the phase that must dispose of it.

**Recommended disposition — structural mitigation plus honest residual, not a stronger claim:**

1. **Defense in depth at the host tier.** Ship a `permissions.deny` recommendation covering the
   settings files (`Edit(./.claude/settings.json)`, `Write(./.claude/settings.json)`, and the
   `.local.json` twin), plus a `Write|Edit`-matcher PreToolUse companion that denies writes whose
   `tool_input.file_path` resolves under `.claude/`. Both mechanisms are documented:
   `[CITED: code.claude.com/docs/en/settings-reference — deny rules "block tool executions … apply to
   built-in file tools and recognized shell commands"]` and `[CITED: code.claude.com/docs/en/agent-sdk/hooks
   — PreToolUse `Write|Edit` matcher inspecting `tool_input.file_path`, with the caveat that "Matcher
   patterns only evaluate tool names, requiring argument-level filtering in the callback"]`.
2. **Record the residual honestly**, in the register's own vocabulary. `docs/audit/28-residual-sizing.md`
   row 4 already carries the exact precedent — `same-uid / no-hook direct-FS forgery residual`,
   disposition `accepted`, rationale `Irreducible`
   `[VERIFIED: grep "^| [0-9]" docs/audit/28-residual-sizing.md, 2026-09-05]`. A settings-file env
   injection is the same class: an agent that can write arbitrary project files can reach the grant. A
   `permissions.deny` rule narrows the vector; it does not close it, because a deny rule covers
   "recognized shell commands" and a sufficiently indirect writer is not recognized.
3. **Do not let `docs/GUARANTEES.md` say "agent-unwritable" unqualified.** The generated render is
   exactly where an overstated claim would land, and AUTO-05 exists to stop overstated claims. The
   honest form names the tier: *un-forgeable from inside a tool call; reachable by an agent that can
   write the host's settings files, which the deny rule and the companion guard are there to prevent.*
4. **Watch item, not a blocker:** Claude Code v2.1.251 introduced `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1`,
   which strips `CLAUDE_CONFIG_DIR` from hook and Bash subprocess environments
   `[ASSUMED — from a GitHub issue title surfaced in WebSearch, not from primary vendor documentation]`.
   If that scrub list ever widens to unknown variables, the grant mechanism breaks silently.
   Installed host is `2.1.261` `[VERIFIED: claude --version, 2026-09-05]`, i.e. already past that
   version, and the existing grants work — but the planner should not treat env inheritance as a
   permanent guarantee.

### F-3 (BLOCKING for D-15) — `emitVerdict` has no production caller and no CLI verb

D-15 says `emitVerdict()` "takes the gate run's test-integrity result as an EXPLICIT argument", and
D-15's stated virtue is "No hidden file or log read inside the frozen path." But **who calls it?**

`emitVerdict`'s signature today `[VERIFIED: scripts/context-io.ts:936-941, read this session]`:

```ts
export function emitVerdict(
  task: string,
  id: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  at: string = new Date().toISOString(),
): string {
```

Every call site in the tree is a **test**. `grep -rn "emitVerdict" --include=*.ts .` returns callers
only in `scripts/context-io.test.ts` (10 call expressions), `scripts/compactor.test.ts:861`,
`scripts/floor-invariance.test.ts:276`, and `scripts/admission-server.test.ts` (4 call expressions);
every other hit is a comment `[VERIFIED: that grep, 2026-09-05]`.

The CLI exposes three verbs and `emitVerdict` is not among them. Verbatim, the fallthrough usage line
`[VERIFIED: scripts/context-io.ts:1633-1635, read this session]`:

```ts
      console.error(
        "usage: context-io.js <validate <noteFile> | admit <task> <noteFile> [contextRoot] | render <task> [contextRoot]>",
      );
```

The dispatch above it handles exactly `cmd === "validate"`, `cmd === "admit"`, `cmd === "render"`
`[VERIFIED: scripts/context-io.ts:1587, 1600, 1622, read this session]`.

Yet `agent-factory/workflows/05-pr-quality-gate.md:47` tells the agent
`[VERIFIED: grep -n "emitVerdict" agent-factory/workflows/05-pr-quality-gate.md, 2026-09-05]`:

> `It emits by calling the `emitVerdict` carve-out in `scripts/context-io.ts`, which `node scripts/context-io.js` exposes.`

**That sentence is false today.** `node scripts/context-io.js` does not expose `emitVerdict`. This is
a live inconsistency, independent of Phase 30, and it lands squarely inside AUTO-04's subject matter:
the workflow describes a mechanical emission path that does not mechanically exist.

**What this means for D-15.** The "explicit argument" has to arrive from *somewhere*. The three
candidates, with their honest tiers:

| Caller | Tier | Consequence for AUTO-04 |
|---|---|---|
| A new `emit-verdict` CLI verb, argument supplied by the agent running workflow 05 | **Agent-supplied** | An agent that wants a GREEN can pass `clean`. This is the *same* false-equivalence AUTO-04 refuses for the env-var mechanism — moved, not removed |
| `emitVerdict` re-reads the test-skip checker's exit code | Rejected by the discussion log ("second parser in a safety path") | — |
| `emitVerdict` refuses GREEN unless handed a **verifiable artifact** (e.g. the checker's exit code plus the skip-registry path it read), and re-derives nothing but validates the shape | Agent-supplied but **falsifiable** | The honest middle: the argument is still agent-supplied, but a malformed or absent one fails closed to "emit nothing" per D-16 |

The workflow already has the input D-15 needs, and it is already an exit code, not prose
`[VERIFIED: agent-factory/workflows/05-pr-quality-gate.md:37, 2026-09-05]`:

> `Branch on the checker's exit code. `0` → the registry justifies every skip, pass. `1` → a test-integrity finding … `2` → the checker failed to run … Exit `2` is an error distinct from a clean fail, recorded as such and never read as a pass.`

**Recommendation:** plan D-15 as a three-state argument mirroring those exit codes (`clean` / `finding`
/ `unknown`), with **absent or unrecognized ⇒ treated as not-clean ⇒ emit nothing** (D-16's fail-closed
path, which is also AUTO-02's "at least as strictly as `block`" rule applied to this surface). Add the
missing CLI verb in the same plan and **fix the false sentence in workflow 05** — note that
`scripts/admission-protocol-docs.test.ts:99-107` pins wording about that paragraph and will need
updating `[VERIFIED: sed -n '90,130p' scripts/admission-protocol-docs.test.ts, 2026-09-05]`. And state
the residual in `emitVerdict`'s header exactly as D-15 already requires ("the hook-enforced vs
in-process tier split is stated"): the gate's own honesty is the tier here, and it should say so.

### F-4 — `autonomy` is a REQUIRED key, and it lives in 8 fixture repos

D-05 retires the scalar and has the validator **refuse** a present `autonomy` key. Today the validator
does the exact opposite — it refuses its *absence* `[VERIFIED: scripts/validate-agent-factory.ts:336-340,
read this session]`:

```ts
  for (const key of ["mode", "cadence", "autonomy"]) {
    if (typeof cfgObj[key] !== "string" || (cfgObj[key] as string).trim() === "") {
      err(`${rel}: missing or empty required key "${key}"`);
    }
  }
```

So the change is a **polarity flip**, not an addition: remove `"autonomy"` from that loop and add a
refusal branch. `mode` and `cadence` stay required.

The set the planner must not miss: **8 test-fixture repos each carry both config twins.**
`[VERIFIED: grep -rln "autonomy" over the tree, filtered to scripts/fixtures/, 2026-09-05]`:

```
scripts/fixtures/bad-config-no-mode/          .../factory.config.json + .../factory.config.md
scripts/fixtures/bad-plugin-noname/           (same pair)
scripts/fixtures/bad-role-missing-section/    (same pair)
scripts/fixtures/bad-ticket-bad-column/       (same pair)
scripts/fixtures/bad-ticket-mismatch/         (same pair)
scripts/fixtures/bad-workflow-no-commit/      (same pair)
scripts/fixtures/good/                        (same pair)
scripts/fixtures/warn-only-no-trace/          (same pair)
```

That is **16 fixture files** plus the three live config surfaces (`agent-factory/config/factory.config.json`,
`agent-factory/seed/.grugops/factory.config.json`, `agent-factory/config/factory.config.md`). A plan
that updates the three and not the sixteen turns every fixture red — and, worse, several fixtures are
*deliberately bad* in one specific way each, so an `autonomy` refusal would make them fail for a
second reason and stop testing what they were built to test.

The live value today `[VERIFIED: agent-factory/config/factory.config.json:5, read this session]`:

```json
  "autonomy": "pr",
```

Prose consumers to update (each is a separate file edit): `AGENTS.md:16`, `agent-factory/README.md:79`,
`install/README.md:400,406,419,421,428`, `install/install.ts:2784` (a printed line),
`agent-factory/packaging/adapters.md:109,122,126,127`, `agent-factory/config/factory.config.md:14,166`,
workflows `04:22,53`, `05:30`, `14:22`, `15:20`, and one `## Reads` bullet in each of the 17 roles
`[VERIFIED: grep -rn "autonomy" filtered to the shipped tree, 2026-09-05]`.

Two prose statements in `factory.config.md` will be **wrong** after this phase and are worth naming in
the plan `[VERIFIED: sed -n '160,178p' agent-factory/config/factory.config.md, 2026-09-05]`:

> `every one of the nine keys (`bdd`, `quality.tdd`, `quality.lint`, `quality.ui_e2e`, `quality.test_integrity`, `quality.gate_enforcement`, `security.asvs_level`, `security.block_on`, `context.compaction`) degrades to its documented lean default`

— a hand-maintained count of nine, which the `checkpoints` object makes ten; and:

> `(The single safety floor is `quality.test_integrity`, which has no `off` value in any mode — TINT-03 …)`

— which already contradicts `SAFETY_FLOORS`'s four members. Both are set-literal drift of exactly the
kind this milestone exists to eliminate, sitting in the file the phase must edit anyway.

### F-5 — the registry join is 6 rows, and 5 of them carry `autonomy`

`docs/audit/28-claim-registry.md` has 47 rows `[VERIFIED: grep -c "^### C-28-" → 47, 2026-09-05]`.
Kind distribution: 33 `architecture`, 8 `install`, 6 `safety`
`[VERIFIED: grep "^- kind:" | sort | uniq -c, 2026-09-05]`. Status distribution: 41 `true`,
6 `overstated` `[VERIFIED: grep "^- status:" | sort | uniq -c, 2026-09-05]`.

`depends_on` distribution `[VERIFIED: grep "^- depends_on:" | sort | uniq -c, 2026-09-05]`:

```
  41 - depends_on: —
   4 - depends_on: autonomy, production_requires_human_confirmation, protected_branch_merge
   1 - depends_on: protected_branch_merge, production_requires_human_confirmation, test_integrity
   1 - depends_on: autonomy
```

Joining id ↔ kind ↔ depends_on shows the `kind: safety` set is **exactly** the 6 rows with a non-`—`
`depends_on` `[VERIFIED: awk join over docs/audit/28-claim-registry.md, 2026-09-05]`:

```
C-28-001  kind=safety  dep=autonomy, production_requires_human_confirmation, protected_branch_merge
C-28-010  kind=safety  dep=autonomy, production_requires_human_confirmation, protected_branch_merge
C-28-018  kind=safety  dep=protected_branch_merge, production_requires_human_confirmation, test_integrity
C-28-023  kind=safety  dep=autonomy, production_requires_human_confirmation, protected_branch_merge
C-28-032  kind=safety  dep=autonomy
C-28-038  kind=safety  dep=autonomy, production_requires_human_confirmation, protected_branch_merge
```

So D-05's remap touches **5 of the 6 safety rows**, and D-17's generated join has a denominator of
**6**, not 47. That number matters for §Pitfall 6: a join that produces 6 entries and a fail-closed
"refuse empty" check are two different assertions, and only the second is currently precedented in
`generate-safety-surface.ts`. Assert the **count**, derived independently, not merely non-emptiness.

The registry's own header already names this phase as its consumer
`[VERIFIED: sed -n '20,50p' docs/audit/28-claim-registry.md, 2026-09-05]`:

> `The question a row answers is not *what is a claim* but *which public sentences become false if floor F is lowered* — the join Phase 30's AUTO-01 closed checkpoint set consumes. Phase 30's claim-dropping filters to `kind: safety``

and the `depends_on` field is documented as `drawn from `SAFETY_FLOORS``, which is why D-04's choice of
`SAFETY_FLOORS` as canonical is the low-friction one: `audit-model.ts`'s floor-set enforcement follows
automatically.

### F-6 — `docs/GUARANTEES.md` would be born outside both language gates

D-17 puts the generated render at `docs/GUARANTEES.md`. `scripts/check-banned-claims.ts` excludes
`**/docs/` as a **segment class at any depth** `[VERIFIED: sed -n '870,895p' scripts/check-banned-claims.ts,
2026-09-05]`:

```ts
  // SEGMENT CLASSES — excluded at any depth, enforced at the walk.
  "**/docs/",
  "**/.planning/",
  "**/scripts/",
```

And `scripts/check-public-docs-vocabulary.ts` builds its corpus from three self-deriving parts with
`PUBLIC_DOCS_EXEMPT = ["CHANGELOG.md"]` `[VERIFIED: grep over scripts/check-public-docs-vocabulary.ts:165,
261, 304, 349, 2026-09-05]`; `docs/GUARANTEES.md` is not a member of any of the three parts as they
stand.

This is a **direct repeat of the Phase 29 finding recorded in project memory**: `CHANGELOG.md` was
silently outside a scan set, holding two live disproven claims, because the gate consumed another
gate's post-exemption set. A brand-new public document whose entire purpose is to carry safety claims,
born outside both claim gates, is the same shape.

**Recommendation:** either (a) place the render outside `docs/` (e.g. repo-root `GUARANTEES.md`, which
puts it inside the public-docs corpus by construction), or (b) keep `docs/GUARANTEES.md` and explicitly
add it to both gates' scan sets **in the same plan that creates it**, with a two-sided count assertion
so a future member cannot be dropped. Do not create it and defer the gate wiring; the deferral is the
defect.

### F-7 — the reader collapse is exactly 3 non-test call sites

`grep -rn "readGovernanceConfig\b\|readGovernanceConfigResult" --include=*.ts .`
`[VERIFIED: that grep, 2026-09-05]` gives, excluding comments and `*.test.ts`:

| Site | Which reader | Role |
|---|---|---|
| `scripts/context-io.ts:1058` | `readGovernanceConfig` (value reader) | inside `admit()` |
| `scripts/context-io.ts:1505` | `readGovernanceConfigResult` | inside `admitAndAppend()` |
| `hooks/admission-guard.ts:128` | `readGovernanceConfigResult` | the hook's dial read |

Plus the disclosed third reader in `scripts/model-tiers.ts:33,112,113,278,1307` — comment-only
references to the governance pair, confirming D-13's "does not import it, does not wrap it and does not
extend it" `[VERIFIED: that grep, 2026-09-05]`.

The two readers' current semantics, verbatim from their headers
`[VERIFIED: scripts/context-io.ts:1231-1364, read this session]`:

- `readGovernanceConfig` — "This helper fails **OPEN** to lean because it is the READER. Failing CLOSED on a matched high-severity admit is the HOOK's job (Plan 25-02), NOT this read helper's." (`:1243-1244`)
- `readGovernanceConfigResult` — reports `source`: `"absent"` / `"ok"` / `"unreadable"`, where unreadable means "a config file EXISTS at a standard location but could not be read or parsed (corrupt / non-JSON). The hook treats this as fail-closed." (`:1332-1335`)

Both resolve the same two candidate paths in the same order
`[VERIFIED: scripts/context-io.ts:1278-1281 and :1345-1348, read this session]`:

```ts
  const candidates = [
    join(base, ".grugops", "factory.config.json"),
    join(base, "agent-factory", "config", "factory.config.json"),
  ];
```

**The collapse's real hazard is not the merge — it is `admit()`.** `admit()` currently consumes the
fail-OPEN reader. Moving it to the discriminated reader changes `admit()`'s behavior on an unreadable
config from *lean* to *refuse*, which is exactly what D-14 specifies — but `admit()` is a frozen D-04
path with its own floor-invariance sweep. Plan the `admit()` move as its own task with its own RED-first
test, not as a mechanical find-and-replace inside the reader task.

### F-8 — the `guard.ts` freeze only goes green after a **commit**, not after an edit

D-24 says `guard.ts` is unfrozen and re-frozen in the same commit. The mechanism is stricter than a
hash constant. `floor-invariance.test.ts` asserts **two** things
`[VERIFIED: scripts/floor-invariance.test.ts:236-253, read this session]`:

```ts
    it("the committed hooks/guard.ts blob matches the frozen D-02 hash", () => {
      // git hash-object computes the blob SHA exactly as git stored it; compare to the frozen blob.
      const blob = execFileSync("git", ["hash-object", "hooks/guard.ts"], {
        cwd: ROOT,
        encoding: "utf8",
      }).trim();
      expect(blob).toBe(FROZEN_GUARD_BLOB);
    });

    it("hooks/guard.ts has no uncommitted modification (git diff --quiet)", () => {
```

with the constant `[VERIFIED: scripts/floor-invariance.test.ts:95, read this session]`:

```ts
const FROZEN_GUARD_BLOB = "3501810e21308e4b7e219679a6ca30dace9b5d66";
```

asserted at two sites — `:243` and again at `:548` inside a second describe block
`[VERIFIED: grep -n "FROZEN_GUARD_BLOB" scripts/floor-invariance.test.ts → 95, 243, 548, 2026-09-05]`.

**The executor gotcha:** `git hash-object` reads the *working tree*, so updating the constant makes
`:243` green immediately — but `git diff --quiet hooks/guard.ts` throws until the file is **committed**.
The normal TDD loop is therefore inverted for this one file: the suite cannot be green mid-edit. Plan
the guard change as a task whose verification step is *run after commit*, and say so explicitly, or the
executor will read a legitimate red as a broken change and start "fixing" it.

Note also the file-naming trap already recorded in CONTEXT.md and confirmed here: in the same test file,
`GUARD_JS` points at the *admission* guard `[VERIFIED: scripts/floor-invariance.test.ts:87, read this
session]`:

```ts
const GUARD_JS = join(ROOT, "hooks", "admission-guard.js");
```

while `FROZEN_GUARD_BLOB` is about `hooks/guard.ts`. Two different artifacts, similar names, one file.

Separately, `scripts/freshness.ts` reads the committed side from **HEAD**, not the working tree
`[VERIFIED: sed -n '1,60p' scripts/freshness.ts, 2026-09-05]`:

> `The repair is ordering-independent by construction rather than by step order: the committed side is read with `git show HEAD:<path>` and the compared set is derived from `git ls-tree -r HEAD`.`

So `hooks/guard.js` must be rebuilt and committed alongside `hooks/guard.ts` in the same commit, or the
freshness gate reports drift. Same for every `.js` this phase touches.

### F-9 — frozen-region companion obligations for any section edit

`scripts/check-diff-disposition.ts` treats role `## Hard limits` and workflow `## Stop conditions` as
frozen structural sections and names the companion each change owes
`[VERIFIED: sed -n '575,610p' scripts/check-diff-disposition.ts, 2026-09-05]`:

```ts
  structuralSections: {
    what: "a structural section located by heading — role `## Hard limits`, workflow `## Stop conditions`, workflow `## Commit`",
    companion: `a disposition row under ${DISPOSITION_DIR}/ whose \`companion\` cell names the section and the reason`,
  },
```

with `DISPOSITION_DIR = "docs/audit/29-style-dispositions"`
`[VERIFIED: scripts/check-diff-disposition.ts:248, 2026-09-05]` — a directory that already holds
`00-base.md` plus per-plan files `29-05.md` … `29-44.md`
`[VERIFIED: ls docs/audit/29-style-dispositions/, 2026-09-05]`.

The anchors are cardinality-pinned: `FROZEN_SECTION_ANCHORS` requires `expected: ROLE_COUNT` for
`## Hard limits` and `expected: WORKFLOW_COUNT` for `## Stop conditions`
`[VERIFIED: sed -n '480,500p' scripts/check-diff-disposition.ts, 2026-09-05]`, with
`ROLE_COUNT = 17` and `WORKFLOW_COUNT = 19`
`[VERIFIED: scripts/kit-model.ts:107-108, 2026-09-05]`. **Every tagged bullet is a frozen-region edit
owing a disposition row.** Tagging 38 workflow bullets is 38 changed lines across up to 19 files, each
needing a companion cell. Budget it as a task, not as a footnote.

Two false alarms from CONTEXT.md, resolved here:

- `check-imperative-lexicon.ts` **deliberately does not govern** `## Stop conditions`. Verbatim
  `[VERIFIED: sed -n '1082,1090p' scripts/check-imperative-lexicon.ts, 2026-09-05]`: "`## Stop
  conditions` bullets are CONDITIONALS ("The ticket fails the Definition of Ready -> stop…"). An
  imperative-verb rule applied to those two sections would report 72 CORRECT bullets as findings". The
  D-02 tag cannot trip it.
- `check-foundation-guards.ts`'s D-19 section-ownership rule (a prohibition lives in `## Hard limits`
  and nowhere else) is **not mechanically enforced**. Verbatim
  `[VERIFIED: sed -n '2937,2955p' scripts/check-foundation-guards.ts, 2026-09-05]`: "`UNKNOWN -
  verify`: that rule is NOT mechanically enforced anywhere in this tree, and nothing below enforces
  it." So F-1 option 2 (appending a bullet list under role prose) carries review-tier risk, not
  gate-tier risk.

---

## Architecture Patterns

### System Architecture Diagram

```
 AUTHORING TIME                      BUILD TIME                        RUN TIME
 ─────────────                       ──────────                        ────────

 agent-factory/workflows/*.md ──┐
   ## Stop conditions           │
   - …  `checkpoint: <id>`      │
                                ├──► deriveCheckpoints()  ──► CHECKPOINTS as const
 scripts/audit-model.ts         │    (locateSection +          + DEFAULTS
   SAFETY_FLOORS  ─────────────┘      kit-model listers)        satisfies Record<Checkpoint,
   (the 4 floor-tier ids)                    │                            Disposition>
                                             │                          │
                                             │  two-sided cardinality   │  ← MISSING MEMBER
                                             │  assert (derived ≠ roster│    = tsc ERROR
                                             │   ⇒ RED, both directions)│
                                             ▼                          ▼
 agent-factory/config/                 ┌──────────────────────────────────────┐
   factory.config.json  ──────────────►│  readGovernanceConfig(root)          │
   (+ seed twin, + .md twin)           │  → { source: absent|ok|unreadable,   │
   checkpoints: { id: block|notify|off}│      config: { …, checkpoints } }     │
                                       │  THE ONE READER (AUTO-06)            │
 validate-agent-factory.ts             └───────────┬──────────────────────────┘
   refuses: present `autonomy`                     │
   refuses: unknown id / non-canonical value       │  unknown/malformed ⇒ BLOCK
                                                   │  unreadable        ⇒ BLOCK
                    ┌──────────────────────────────┼──────────────────────────────┐
                    ▼                              ▼                              ▼
        ┌───────────────────────┐      ┌───────────────────────┐     ┌────────────────────────┐
        │ hooks/guard.ts        │      │ context-io.admit()    │     │ context-io.emitVerdict │
        │ PreToolUse "Bash"     │      │ in-process tier       │     │ point of effect        │
        │                       │      │ unreadable ⇒ refuse   │     │  (AUTO-04)             │
        │ 1. matrix lookup      │      │  + UNKNOWN - verify   │     │ testIntegrity arg:     │
        │ 2. floor? read        │      └───────────────────────┘     │  clean → emit GREEN    │
        │    GRUGOPS_FLOOR_<ID> │                                    │  else  → EMIT NOTHING  │
        │    FRESH from own env │                                    └────────────────────────┘
        │ 3. self-set? REFUSE   │                                                ▲
        │ 4. banner + decision  │                                                │
        └────┬──────────┬───────┘                          workflow 05 §14 step ─┘
             │          │                                  (three-state exit code)
     deny ◄──┘          └──► notify: allow
     (block, or                + finding note (sanctioned write path)
      lowered-without-key)     + banner line

                    ALL DECISIONS ──► BANNER ──► every hook denial/notify
                                        │        + workflow 05 gate header
                                        │        zero-config: "all checkpoints at default"
                                        ▼
                      scripts/generate-guarantees.ts (fixed OUT, REGEN_COMMAND,
                        freshness-gated, fail-closed on empty AND on wrong count)
                                        │
                                        ├──► GUARANTEES render (6 kind:safety registry rows
                                        │      joined to live matrix via depends_on)
                                        └──► dropped claim: generated disclosure replaces
                                             the anchored text IN PLACE (anchor survives,
                                             check-claim-anchors bijection holds)
```

### Recommended Project Structure

No new directories. New and changed files land in the existing layout:

```
scripts/
├── checkpoints.ts              # NEW — derivation + CHECKPOINTS roster + DEFAULTS table
├── checkpoints.test.ts         # NEW — two-sided cardinality, id→sites map, tag-form refusal
├── generate-guarantees.ts      # NEW — modelled on generate-safety-surface.ts
├── guarantees-freshness.ts     # NEW — byte-equality freshness gate (the tree's 6th)
├── context-io.ts               # CHANGED — one reader; emitVerdict signature; admit() degrade
├── audit-model.ts              # CHANGED — SAFETY_FLOORS loses `autonomy`, gains checkpoint ids
├── validate-agent-factory.ts   # CHANGED — autonomy refusal; checkpoints validation
└── fixtures/*/agent-factory/config/  # CHANGED — 8 fixture repos × 2 config twins
hooks/
├── guard.ts (+ guard.js)       # CHANGED — matrix lookup, key two, banner. Re-frozen same commit
└── admission-guard.ts (+ .js)  # CHANGED — reader rename only (D-12)
agent-factory/
├── workflows/*.md              # CHANGED — 38 Stop-conditions bullets gain tags
├── config/factory.config.json  # CHANGED — autonomy out, checkpoints in
├── config/factory.config.md    # CHANGED — twin + legacy migration table + nine→ten key count
└── seed/.grugops/factory.config.json  # CHANGED — byte-identical twin
docs/audit/
├── 28-claim-registry.md        # CHANGED — depends_on remap, `dropped` status
└── 29-style-dispositions/30-NN.md  # NEW — companion rows for the frozen-section edits
```

### Pattern 1: The compile-error-on-missing-default table (AUTO-01)

**What:** a closed string-union key type plus a `satisfies Record<Key, Value>` default table, so adding
a union member without a default fails `tsc`.
**When to use:** exactly once, for `CHECKPOINTS`/`CHECKPOINT_DEFAULTS`.
**Precedent in tree:** `FROZEN_SOURCES` uses the shape but with an explicit annotation rather than
`satisfies` `[VERIFIED: scripts/check-diff-disposition.ts:585-587, 2026-09-05]`:

```ts
export const FROZEN_SOURCES: Readonly<
  Record<FrozenSourceName, { readonly what: string; readonly companion: string }>
> = {
```

with the union declared above it as `export type FrozenSourceName = "registryAnchors" | "structuralSections" | "positiveGuardLiterals";`
and the comment "Object.keys() over this is the source count; nothing else declares it."

**The distinction that matters for AUTO-01.** An explicit `Record<K, V>` **annotation** already gives
the compile error on a missing member — that is what `FROZEN_SOURCES` relies on. `satisfies` gives the
same error *and* preserves the literal value types, which is what lets `CHECKPOINTS` be derived from
`Object.keys(DEFAULTS)` with the narrow union type rather than `string[]`. Prefer `satisfies` here so
the roster and the default table are one declaration, not two that can disagree. CONTEXT.md notes
`satisfies` does not yet appear anywhere in the tree; introducing it is a small, contained first use.

**Anti-pattern this replaces:** a hand-listed `CHECKPOINTS` array beside a separate `DEFAULTS` map. Two
declarations of one set is the founding defect class of this milestone.

### Pattern 2: One discriminated reader, deleted second authority (AUTO-06)

**What:** keep `readGovernanceConfigResult`'s shape, rename it to `readGovernanceConfig`, delete the
value-only reader, move all three call sites.
**When to use:** the reader collapse task.
**Key semantics to preserve verbatim** — the `GATE_OR_STRICTER` canonicalization is the existing
fail-closed idiom and the checkpoint matrix should reuse its logic, not invent a parallel one
`[VERIFIED: scripts/context-io.ts:1266-1273, read this session]`:

```ts
const GATE_OR_STRICTER_HUMAN_ADMISSION = "all";

// Canonicalize a raw human_admission JSON value read from config. A string is taken VERBATIM (the
// existing contract — "off"/"high-severity"/"all"/typo all flow through unchanged; the hook canonicalizes
// a typo'd STRING fail-closed). A PRESENT non-string value is gate-or-stricter, never `off`.
function canonicalizeHumanAdmission(raw: unknown): string {
  return typeof raw === "string" ? raw : GATE_OR_STRICTER_HUMAN_ADMISSION;
}
```

The matrix analogue is `canonicalizeDisposition(raw): "block" | "notify" | "off"` returning `"block"`
for anything that is not exactly one of the three canonical strings — including a present non-string,
a wrong-case `"OFF"`, and an unknown id's value. Note that the existing reader distinguishes four
degenerate shapes (non-object whole file, present-but-non-object `context`, absent `context`, present
non-string value) at `:1290-1311` `[VERIFIED: scripts/context-io.ts:1286-1311, read this session]` —
the `checkpoints` object needs the same four branches, and the absent-object branch must reach the
**roster default**, never `off`.

### Pattern 3: Point-of-effect enforcement with a fail-closed argument (AUTO-04)

**What:** `emitVerdict` gains a required test-integrity parameter and refuses to emit unless it is
exactly the clean sentinel.
**When to use:** the `emitVerdict` task.
**Why the placement is right:** `emitVerdict` is already the single sanctioned emitter — its header
says so `[VERIFIED: scripts/context-io.ts:911-913, read this session]`:

> `Plan 02's emitVerdict() (below) is the ONLY emitter; the gate's §14 step calls it on a green terminal result.`

and it already routes through the shared write chokepoint `[VERIFIED: scripts/context-io.ts:976-979,
read this session]`:

```ts
  // Route through the SAME single write chokepoint as appendNote (R6-1): emitVerdict is a SECOND
  // direct note-file writer, so containment must live in the shared helper, not only in appendNote.
  const notesDir = join(contextRoot, task, "notes");
  writeNoteFile(notesDir, noteIdStr, text);
```

Refusing before composing the note means nothing is written and nothing is partially written — which
is what D-16's "EMITS NOTHING" requires.

**Parameter placement matters for the pins.** `emitVerdict` currently has two required and two
defaulted parameters. Adding the integrity argument as a **third required** parameter breaks every one
of the ~16 test call sites at compile time — which is the point: a silently-defaulted `= "clean"`
parameter would let every existing pin keep passing while the new floor does nothing. **Make it
required and positional-third.** A `tsc` error at each pin is the cheapest possible discrimination
proof that the argument is load-bearing.

### Anti-Patterns to Avoid

- **A second hook file for the two-key decision.** D-24 forbids it, and the discussion log records the
  rejection ("two authorities"). One `Bash` matcher, one decision.
- **Widening the tag regex to accommodate a stubborn bullet.** D-02 is an allow-list (the D-64 posture
  that finally closed Phase 27 at round 12). If a bullet will not take the canonical tag, change the
  bullet, not the regex.
- **A `checkpoints` default that reads `off` on absence.** AUTO-07 makes absence identical to today.
  Absent object ⇒ roster default; absent key ⇒ roster default; present-invalid ⇒ `block`.
- **Asserting "the banner printed" by substring search.** D-20 and the AUTO-07 criterion both say the
  test compares the **whole run output** against HEAD and expects exactly one line of difference. A
  `toContain("all checkpoints at default")` assertion is the AP-1 shape: it passes for a run that also
  printed nine wrong lines.
- **Deferring the language-gate wiring for `GUARANTEES.md`.** See §F-6.
- **Treating the env grant as unforgeable in generated prose.** See §F-2.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Locate a markdown `## Section` | A new heading scanner | `locateSection` in `scripts/check-diff-disposition.ts` (has its own oracle: `scripts/section-locator-oracle.test.ts`) | P29 lesson: unifying two parsers made the authority's **scope** a new degree of freedom. A third parser reopens it. Anchor the tag regex to the located section — never file-wide |
| Enumerate roles / workflows | A `readdirSync` filter, or a literal list | `kit-model.listRoles()` / `listWorkflows()` with `ROLE_COUNT=17` / `WORKFLOW_COUNT=19` | Both listers call `refuseEmpty(files, dir, kind)` `[VERIFIED: scripts/kit-model.ts:705, 715-730, 2026-09-05]`; the counts are two-sided pinned in `guard_kit_counts` |
| A fail-closed generated document | A bespoke writer | Clone `scripts/generate-safety-surface.ts` (188 lines) | Already fixes `OUT` as a literal (path-traversal mitigation, ASVS V12), names `REGEN_COMMAND`, and throws by name on an empty union. Its header states the argument for all three |
| Byte-equality freshness for a generated file | A timestamp check | The existing freshness family — `catalog-freshness`, `adapters-freshness`, `skill-twins-freshness`, `context-freshness`, `now-running-freshness`, `trace-freshness` `[VERIFIED: cat package.json scripts, 2026-09-05]` | Six precedents; all six regenerate to a temp location and byte-compare |
| Detect drift between the committed `.js` and its `.ts` | A build step ordering convention | `scripts/freshness.ts` (reads HEAD via `git show HEAD:` / `git ls-tree -r HEAD`) | Ordering-independent by construction; a build running earlier in the job cannot mask drift |
| A per-name human grant read from env | A new mechanism | `hooks/admission-guard.ts:205-225` — env presence check plus stamp equality, both denying with a named reason | The exact D-09/D-10 shape already exists and is red-teamed through 8 rounds |
| Refuse an agent's self-approval | A new detector | `hooks/guard.ts:88` `SELF_APPROVE` | Verbatim `[VERIFIED: hooks/guard.ts:88, read this session]`: `const SELF_APPROVE = new RegExp(`(^\|[\\s;&\|(])(export\\s+\|env\\s+)?${APPROVAL}\\s*=`);` — generalize it over the floor-var family rather than writing a second one |
| A banner that agrees with an exit status | Printing and hoping | `scripts/coordinator-resolution-precheck.ts:293-307` | Checks **both** signals against the same captured run and names which fired. Its comment states the rationale: "narrating it over a run that refused a whole class is the spoofing failure this gate exists to prevent" |
| Parse the claim registry | A regex over the markdown | `readRegistry()` in `scripts/audit-model.ts` | The one parse authority. **Caveat:** AP-1's CR-02 records that `readRegistry()` has no duplicate-key detection (last wins, silently) while its sibling `readRegister()` refuses duplicates. If the plan adds a `dropped` status, harden the duplicate-key path in the same task |

**Key insight:** every mechanism this phase needs already exists in this tree, red-teamed, with its
rationale written in its header. The phase's risk is not "will we build it correctly" — it is "will we
build a *second* one." Every locked decision that says *delete the second authority* (D-12, D-24) is
guarding against exactly that, and the three findings above (F-1, F-2, F-3) are each a place where the
tree's actual shape invites a second authority if the plan is written from CONTEXT.md alone.

---

## Runtime State Inventory

This is a refactor/rename phase (the `autonomy` scalar is retired and replaced), so the inventory
applies.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | **None in the product.** grugops writes no database. It writes `.grugops/` state files in the *user's* repo, and a user repo may carry `.grugops/factory.config.json` with `"autonomy": "pr"`. `[VERIFIED: scripts/context-io.ts:1278-1281 names `.grugops/factory.config.json` as the first-resolved config location, read this session]` | **Data migration for user repos.** D-05 makes a present `autonomy` key a validator *refusal*, so every existing installed repo goes red on upgrade. The plan MUST ship a migration note (D-06's mechanical mapping table) and should consider whether `install.ts` rewrites the key or only reports it. This is a code-edit *and* a user-data question — the discretion note assigns the note's location, not whether it exists |
| **Live service config** | **None.** grugops has no hosted service, no n8n, no dashboards. The only external configuration surface is the host CLI's own settings files (`.claude/settings.json`, `.gemini/settings.json`) `[VERIFIED: CLAUDE.md §6 per-tool entry table + install/install.ts references, 2026-09-05]` | For `.claude/settings.json`: **new**, per §F-2 — the recommended `permissions.deny` entries are a settings change the installer would need to make additively, and the installer is already forbidden from setting approval vars (`NEVER set GRUGOPS_PROD_DEPLOY_APPROVED` appears in the v1.0 install plan). Adding *deny rules* is a different act from adding *grants* and is safe; adding the grant is not |
| **OS-registered state** | **None — verified.** No Task Scheduler, no pm2, no launchd, no systemd anywhere in the tree. `hooks/hooks.json` is the only registration and it is repo-local `[VERIFIED: cat hooks/hooks.json, 2026-09-05]` | None |
| **Secrets / env vars** | `GRUGOPS_PROD_DEPLOY_APPROVED`, `GRUGOPS_ADMISSION_APPROVED_BY`, plus `GRUGOPS_HOME`, `GRUGOPS_STATE_ROOT`, `GRUGOPS_SRC`, `GRUGOPS_BACKUP_SUFFIX`, `GRUGOPS_DASHBOARD_POLL` `[VERIFIED: grep -rhon "GRUGOPS_[A-Z_]*" over *.ts/*.md excl. node_modules, 2026-09-05]`. `GRUGOPS_FLOOR_*` is **unused in the shipped tree** — the namespace is free | **Code addition, no rename.** The two existing approval vars keep their names (D-24 keeps `guard.ts`'s `APPROVAL` semantics; the header calls the name "a placeholder per research Assumption A2 — projects may rename it"). The new `GRUGOPS_FLOOR_<ID>` family is additive. **A human who has exported the old vars needs no action** |
| **Build artifacts / installed packages** | Committed `.js` for every `.ts` this phase touches — at minimum `hooks/guard.js`, `hooks/admission-guard.js`, `scripts/context-io.js`, `scripts/audit-model.js`, `scripts/validate-agent-factory.js`, plus the new generator. `[VERIFIED: ls -la hooks/ shows guard.js and admission-guard.js dated 2026-09-04, alongside .ts dated 2026-06-13/28 — i.e. the .js are rebuilt artifacts, 2026-09-05]` | **`npm run build` and commit the output in the same commit as the source.** `scripts/freshness.ts` compares against HEAD, so an uncommitted rebuild does not satisfy it, and `check:build-parity` fails if `tsc` moves a tracked `.js` |

---

## Common Pitfalls

### Pitfall 1: Claiming an unforgeable grant the mechanism does not deliver

**What goes wrong:** `docs/GUARANTEES.md` — the artifact whose entire job is to stop overstated claims —
ships the sentence "authorized by a session env var the agent cannot set", which §F-2 shows is
conditionally false.
**Why it happens:** the phase's own framing ("agent-unwritable") is inherited from CONTEXT.md, and
CONTEXT.md inherited it from `admission-guard.ts`'s header, which argues correctly about a *different*
vector.
**How to avoid:** state the tier. Write the residual into the register (`docs/audit/28-residual-sizing.md`
already has the `accepted / irreducible` row shape) and let the generated render name it. Pair with the
`permissions.deny` + `Write|Edit` companion so the claim that *is* made is the one that holds.
**Warning signs:** any generated sentence containing "cannot" about an env var, with no named vector.

### Pitfall 2: A tag regex that is not section-anchored

**What goes wrong:** the derivation picks up `` `checkpoint: foo` `` from a code fence, a `## Steps`
bullet, or a later unrelated block, and the roster gains a member nobody wrote.
**Why it happens:** this is the *literal* P29 lesson recorded in project memory — "a section-anchored
fence reader searching to EOF adopts an unrelated later block."
**How to avoid:** the regex runs **only** over lines `locateSection` returns for that exact heading, and
the section walk terminates at the next `^## `. Test with a fixture that plants the tag one line past
the section boundary and assert it is **not** collected.
**Warning signs:** a derived count that exceeds the tagged-bullet count you can `grep`.

### Pitfall 3: Updating the three live config surfaces and forgetting the eight fixtures

**What goes wrong:** `autonomy` refusal lands; 8 fixture repos go red; several of them stop testing the
one thing they exist to test because they now fail for a second reason.
**Why it happens:** the fixtures are two directory levels down and do not appear in any of CONTEXT.md's
enumerations.
**How to avoid:** §F-4's list. Derive the fixture set with `ls scripts/fixtures/` and assert the count in
the same test that asserts the config twins agree.
**Warning signs:** `scripts/validate.test.ts` or `check-foundation-guards.test.ts` failing with a
config-key message.

### Pitfall 4: A `block` default reached by coercion rather than by rule

**What goes wrong:** `"OFF"` (wrong case), `true`, `1`, `null`, `[]` each take a different code path and
one of them lands on `off`.
**Why it happens:** the existing reader already documents this exact bug class for `human_admission`
and fixed it in round 2 (GAP-C) with four explicit branches. A new key written without that history
reintroduces it.
**How to avoid:** copy the four-branch structure verbatim (§Pattern 2) and sweep the same value set
`floor-invariance.test.ts` already uses `[VERIFIED: scripts/floor-invariance.test.ts:114-124, read this
session]`:

```ts
const HUMAN_ADMISSION_VALUES = [
  "off",
  "high-severity",
  "all",
  "", // empty string
  "bogus",
  "OFF", // wrong case — must NOT be read as the `off` sentinel
  "true",
  "1",
  "zZ9-garbage_random-string", // arbitrary junk
];
```

**Warning signs:** a `switch` with a `default:` that returns anything other than `block`.

### Pitfall 5: The guard freeze read as a broken change

**What goes wrong:** the executor edits `guard.ts`, updates `FROZEN_GUARD_BLOB`, runs the suite, sees
`git diff --quiet` throw, and starts "fixing" a change that is correct.
**Why it happens:** §F-8 — the freeze has a commit-state assertion, not only a hash assertion.
**How to avoid:** write the task's verification step as *run after commit*, and say why in the task text.
**Warning signs:** a red on `invariant 4` naming `git diff --quiet` rather than the blob comparison.

### Pitfall 6: A vacuity floor that catches an empty denominator but not a short one

**What goes wrong:** `generate-guarantees.ts` refuses an empty join (following the template) but happily
renders 3 of 6 safety rows, and the missing 3 are the lowered ones.
**Why it happens:** the P29 lesson recorded in project memory verbatim — "a vacuity floor catches an
EMPTY denominator but never a SILENTLY SHORT one — derive the ELEMENT count independently of the loop
that consumes it."
**How to avoid:** assert `join.length === safetyRowCount` where `safetyRowCount` is counted by a
**second, independent** pass over the registry (§F-5 gives the current value: **6**). Same rule for the
checkpoint roster: the two-sided assertion needs both sets computed independently.
**Warning signs:** any `if (x.length === 0) throw` with no companion count assertion.

### Pitfall 7: Reformatting a frozen section without its companion row

**What goes wrong:** `check:diff-disposition` goes red on 19 files at once, late, after the tagging task
is "done".
**Why it happens:** §F-9 — role `## Hard limits` and workflow `## Stop conditions` are frozen structural
sections, each change owing a disposition row under `docs/audit/29-style-dispositions/`.
**How to avoid:** create the disposition file (`30-NN.md`) in the same plan as the tagging task, with a
`companion` cell naming the section and the reason.
**Warning signs:** `check-diff-disposition` naming `structuralSections`.

### Pitfall 8: Running `npm test`

**What goes wrong:** `npm test` is `vitest run` with no exclusion, which pulls in `scripts/e2e/uat-live.test.ts`
`[VERIFIED: cat package.json "test": "vitest run"; ls scripts/e2e/ → uat-live.test.ts, 2026-09-05]` — a
live Claude-CLI lane that spends tokens and can hang on an authenticated box.
**How to avoid:** the project's GSD config already sets the right command
`[VERIFIED: .planning/config.json workflow.test_command → "npx vitest run --exclude '**/scripts/e2e/**'",
2026-09-05]`. Use it in every plan's verification block.
**Warning signs:** an ~8-minute test step.

---

## Code Examples

### Deriving a set two-sided with an independently-computed denominator

Pattern distilled from `deriveFrozenSet` `[VERIFIED: scripts/check-diff-disposition.ts:637-660,
2026-09-05]`, whose header states the rule:

> `Source (b) is located by heading through kit-model's listers, and each of the three derivations is asserted at full cardinality against ROLE_COUNT or WORKFLOW_COUNT.`

```ts
// scripts/checkpoints.ts — the shape to follow.
export type Checkpoint = "protected_branch_merge" | "open_pr" | /* … */;
export type Disposition = "block" | "notify" | "off";

// ONE declaration. A new Checkpoint member without a default is a tsc error here.
export const CHECKPOINT_DEFAULTS = {
  protected_branch_merge: "block",
  open_pr: "off",
  // …
} as const satisfies Record<Checkpoint, Disposition>;

export const CHECKPOINTS = Object.keys(CHECKPOINT_DEFAULTS) as readonly Checkpoint[];

// The derived side. The DENOMINATOR is computed from the listers, NOT from the loop below.
export function deriveTaggedCheckpoints(root: string): {
  ids: ReadonlySet<string>;
  sites: ReadonlyMap<string, readonly string[]>;
  filesScanned: number;
} { /* locateSection over listWorkflows(); one strict regex, section-anchored */ }

// The two-sided assertion, in the test:
//   expect(filesScanned).toBe(WORKFLOW_COUNT);          // the scan set is complete
//   expect([...ids].sort()).toEqual([...CHECKPOINTS].sort());  // both directions
//   expect(totalSites).toBe(expectedSiteCount);         // counted independently
```

### The fail-closed canonicalizer (mirroring the existing one)

```ts
// Follows scripts/context-io.ts:1266-1273 exactly. Anything not EXACTLY one of the three
// canonical strings is BLOCK — never `off`, never the roster default.
const GATE_OR_STRICTER_DISPOSITION: Disposition = "block";

function canonicalizeDisposition(raw: unknown): Disposition {
  return raw === "block" || raw === "notify" || raw === "off"
    ? raw
    : GATE_OR_STRICTER_DISPOSITION;
}
```

### The hook's fresh per-call env read (the existing, red-teamed shape)

```ts
// hooks/admission-guard.ts:205-213, VERBATIM — the D-09/D-10 model.
const approver = process.env[APPROVAL];
if (typeof approver !== "string" || approver.length === 0) {
  deny(
    `Admission blocked: humans decide, agents execute. This is a gated governance finding ` +
      `(by: ${by}); it requires a named human disposition. The finding cannot be admitted until a ` +
      `human exports ${APPROVAL}=NAME in the shell that launches Claude and the admission carries a ` +
      `matching verified_by: human:NAME stamp. The agent must not set ${APPROVAL} itself.`,
  );
}
```

### The block mechanism both hooks use

```ts
// hooks/guard.ts:90-101, VERBATIM. exit 0 + JSON deny = blocked, with a message for the agent.
function deny(reason: string): never {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0); // exit 0 + JSON deny = blocked, with a message for the agent.
}
```

Confirmed against the vendor docs `[CITED: code.claude.com/docs/en/hooks — "Deny tool execution with
PreToolUse hook output in JSON": `hookSpecificOutput` with `hookEventName`, `permissionDecision: "deny"`,
`permissionDecisionReason`; "Can also be used to allow actions, escalate to the user, or modify tool
inputs."]`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `autonomy` scalar as a documentary posture | Per-checkpoint enforced ternary matrix | This phase | The scalar enforced nothing mechanically; only `SAFETY_FLOORS` read it, and the validator only checked it was a non-empty string |
| Two governance config readers (one fail-open, one discriminated) | One discriminated fail-closed reader | This phase (AUTO-06) | The fail-open reader exists because `admit()`'s zero-config contract needed it; D-14 resolves that by giving `admit()` an explicit degrade path instead |
| `test_integrity` as a config enum only (`warn`\|`block`) | Enforced at `emitVerdict()` | This phase (AUTO-04) | Currently the enum is validated `[VERIFIED: scripts/validate-agent-factory.ts:356 — `test_integrity: ["warn", "block"], // disabling EXCLUDED — TINT-03 carve-out`, read this session]` and asserted in the floor sweep, but nothing consumes it at the point a GREEN verdict is written |
| Command-string parsing to recognize an admission | Structured MCP tool channel (`mcp__grugops__.*`) | Phase 25 round 6 | The precedent for "move the gate to point-of-effect" that AUTO-04 repeats. `admission-guard.ts:10-19` records why: ten rounds of shell-expansion bypasses, closed by construction, not by recognizing more spellings |
| `Task` tool name | `Agent` | Claude Code v2.1.63 | Per `CLAUDE.md`; not touched by this phase |

**Deprecated / outdated in this tree:**

- `agent-factory/workflows/05-pr-quality-gate.md:47`'s claim that `node scripts/context-io.js` exposes
  `emitVerdict` — false today (§F-3).
- `agent-factory/config/factory.config.md`'s "nine keys" count and "The single safety floor is
  `quality.test_integrity`" — both already inaccurate (§F-4).
- `docs/initial/agent_factory_builder_spec_v2.md` describes the original `autonomy: diff|branch|pr`
  design. It is a historical spec document; the plan should leave it alone rather than rewrite history.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything (`engines: >=22`) | ✓ | v24.12.0 | — |
| npm | build / test scripts | ✓ | 11.7.0 | — |
| TypeScript (`tsc`) | build, typecheck, freshness | ✓ | 6.0.3 | — |
| vitest | the whole suite | ✓ | 4.1.8 | — |
| git CLI | `hash-object` freeze, `show HEAD:` freshness | ✓ | 2.55.0 | — |
| Claude Code | hook enforcement, red-team reproduction | ✓ | 2.1.261 | The other four host CLIs keep the documentary tier (locked in Claude's Discretion) |
| `jq` | **not required** | n/a | — | Both hooks are pure-Node by hard rule (`hooks/guard.ts:3`: "no `jq`, no npm dependency, Node stdlib only") |

`[VERIFIED: node --version, npm --version, npx tsc --version, npx vitest --version, git --version,
claude --version, all run 2026-09-05]`

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.8 |
| Config file | `vitest.config.ts` (sets only `fileParallelism: false`) |
| Quick run command | `npx vitest run --exclude '**/scripts/e2e/**' <file>` |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` |
| Typecheck | `npm run typecheck` (`tsc --noEmit && tsc -p tsconfig.tests.json`) |
| Build parity | `npm run check:build-parity` |
| Freshness | `npm run freshness` |

`vitest.config.ts` sets `fileParallelism: false` deliberately, because several oracles mutate the real
working tree `[VERIFIED: cat vitest.config.ts, 2026-09-05]`. Do not re-enable it for speed.

**Never run `npm test`** — see Pitfall 8.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTO-01 | Derived set equals roster, both directions; scan set is complete | unit + oracle | `npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts` | ❌ Wave 0 |
| AUTO-01 | A `Checkpoint` member with no default fails `tsc` | typecheck (negative) | `npm run typecheck` against a mutation fixture | ❌ Wave 0 |
| AUTO-01 | A tag one line past the section boundary is NOT collected | unit | same file | ❌ Wave 0 |
| AUTO-01 | A non-canonical tag form in those sections is REFUSED | unit | same file | ❌ Wave 0 |
| AUTO-02 | Every value in the garbage sweep gates ≥ `block` | unit sweep | `npx vitest run … scripts/floor-invariance.test.ts` (extend) | ✅ extend |
| AUTO-02 | Absent object / absent key ⇒ roster default, never `off` | unit | `scripts/context-io.test.ts` (rewrite `:848-905, 1661-1720`) | ✅ rewrite |
| AUTO-02 | Present `autonomy` is REFUSED by the validator; 8 fixtures still test their one thing | unit | `npx vitest run … scripts/validate.test.ts` | ✅ extend |
| AUTO-03 | Config lowered + env absent ⇒ denies, names the checkpoint and the missing var | hook spawn | `npx vitest run … hooks/guard.test.ts` | ✅ extend |
| AUTO-03 | `export GRUGOPS_FLOOR_X=… && cmd` in the same call is REFUSED | hook spawn | same file | ✅ extend |
| AUTO-03 | Config lowered + env present ⇒ allows, and the trace records the authorizing name | hook spawn | same file | ✅ extend |
| AUTO-03 | **Settings-file env injection reaches the hook** (the §F-2 residual, asserted as KNOWN, not fixed) | hook spawn (documented residual) | same file, marked as a recorded residual test | ❌ Wave 0 |
| AUTO-04 | `emitVerdict(…, notClean)` writes NOTHING (directory unchanged) | unit | `npx vitest run … scripts/context-io.test.ts` | ✅ extend |
| AUTO-04 | `emitVerdict` with a missing/unrecognized integrity argument writes NOTHING | unit | same file | ❌ Wave 0 |
| AUTO-04 | Every existing `emitVerdict` pin fails to compile until updated (discrimination proof) | typecheck | `npm run typecheck` before the pin update | ✅ inherent |
| AUTO-05 | Generated render joins exactly the independently-counted 6 safety rows | unit | `npx vitest run … scripts/generate-guarantees.test.ts` | ❌ Wave 0 |
| AUTO-05 | Freshness: a hand-edit to `GUARANTEES.md` goes red | oracle | `npm run freshness:guarantees` | ❌ Wave 0 |
| AUTO-05 | A lowered floor replaces its anchored claim text; bijection + contiguity hold | oracle | `npm run check:claim-anchors` | ✅ extend |
| AUTO-05 | `GUARANTEES.md` is inside both language gates' scan sets, count-asserted | oracle | `npm run check:banned-claims` + `npm run check:public-docs` | ❌ Wave 0 |
| AUTO-06 | Exactly one governance reader exists; the config-reading-site count is derived and pinned | oracle | `npx vitest run … scripts/context-io.test.ts` | ❌ Wave 0 |
| AUTO-06 | `admit()` on unreadable config refuses and degrades to `UNKNOWN - verify`, never throws | unit | same file | ❌ Wave 0 |
| AUTO-07 | A zero-config run differs from HEAD by **exactly** the one banner line | differential | `npx vitest run … scripts/autonomy-zero-config.test.ts` | ❌ Wave 0 |
| AUTO-07 | `guard.ts` re-frozen: blob matches AND working tree clean | oracle | `npx vitest run … scripts/floor-invariance.test.ts` (**after commit**) | ✅ update constant |

### Sampling Rate

- **Per task commit:** `npx vitest run --exclude '**/scripts/e2e/**' <the touched test file>` plus
  `npm run typecheck`.
- **Per wave merge:** `npx vitest run --exclude '**/scripts/e2e/**'` (full suite) plus
  `npm run freshness` plus `npm run check:build-parity`.
- **Phase gate:** full suite green, all six `check:*` gates green, all seven `freshness:*` green, then
  `/gsd-verify-work`.
- **Note on cost:** `scripts/floor-invariance.test.ts` is the most spawn-heavy file in the suite
  (measured 128 tests / 1.3 s, slowest single test 81-84 ms, explicit `FLOOR_INVARIANCE_TEST_TIMEOUT_MS
  = 30_000`) `[VERIFIED: scripts/floor-invariance.test.ts:50-83, read this session]`. Its own header
  warns that Phase 30 makes this worse and that **a red here means find the hanging spawn, never raise
  the number.** Adding N checkpoints multiplies its sweep; if it approaches the ceiling, split the file
  rather than raising the timeout.

### Red-Team Architecture (D-21 / D-22 / D-23 — scope, not overrun)

A green suite does not close a floor in this repository. Thirteen documented green-suite-insufficient
bypasses across this milestone say so. The phase's red-team budget is **scope**; plan it as tasks.

**Surface B first (D-21):** set derivation, reader collapse, validator, render, banner.
**Surface A second:** the two-key hook path plus `emitVerdict`'s TI refusal.

Per round, per surface, the closure standard (D-23):

1. **RED first.** Write the bypass as a failing test before the fix. A test written after a fix proves
   the fix compiles, not that it discriminates.
2. **Mirror reproduction.** Pre-fix mirror exits 0; HEAD exits 1 — on the **committed `.js`**, not the
   `.ts`. This is the discipline `floor-invariance.test.ts:26` names: "the spawn-the-COMMITTED-.js
   discipline from hooks/guard.test.ts (target the artifact, never .ts)."
3. **Mutation / discrimination proof.** Break the predicate deliberately; the test must go red. A test
   that stays green under mutation is asserting nothing.
4. **Two independent opus red-teams** find nothing new on that surface.
5. **Self-reproduction** of each bypass by the fixing agent.
6. **Structural fix, not a heuristic.** One format-aware authority per predicate; delete the second
   grammar; move the gate to the point of effect; unfreeze a frozen weaker duplicate.

**The four questions to ask of every new predicate** (distilled from 25 catches across P22/23/25/26/27/29):

- **What set does it ENUMERATE?** — a hand-maintained scan set rots while green.
- **What is its INPUT ASSEMBLED FROM?** — P27 round 6: the parser was fine; the string handed to it
  was assembled elsewhere.
- **At WHICH POSITIONS is it even ASKED?** — P27 round 10: the predicate accepted the right
  characters but was never consulted at the position that mattered.
- **Does the HARNESS assert its own PREMISE?** — this produced a false result in 6 instances across 4
  straight rounds in P27. For this phase specifically: does the mirror actually differ from HEAD in the
  way the test believes, and is the denominator real?

**Two additional P29 probes that apply directly here:**

- When you UNIFY two parsers into one authority (D-12's reader collapse), **that authority's SCOPE is a
  new degree of freedom.** Ask what the single reader now reads that neither old one did.
- A "must change together" freeze that is RANGE-scoped rather than COMMIT-scoped **self-disarms** the
  first time the companion legitimately changes — and a 2-commit fixture can never see the difference.
  D-24's guard re-freeze is exactly this shape; the `check-diff-disposition` companion text already
  says "the commit that actually changed it, not merely somewhere in the range."

### Wave 0 Gaps

- [ ] `scripts/checkpoints.test.ts` — AUTO-01 derivation, two-sided cardinality, boundary, tag-form refusal
- [ ] `scripts/generate-guarantees.test.ts` — AUTO-05 join count (independently derived), fail-closed
- [ ] `scripts/guarantees-freshness.ts` + its test — AUTO-05 byte-equality gate
- [ ] `scripts/autonomy-zero-config.test.ts` — AUTO-07 whole-run differential against HEAD
- [ ] A negative-typecheck fixture proving a defaultless `Checkpoint` member fails `tsc` (AUTO-01)
- [ ] A recorded-residual test for the §F-2 settings-file env vector (AUTO-03) — asserts the exposure
      is **known and documented**, not that it is closed
- [ ] A config-reading-site count assertion, derived by grep (AUTO-06, D-13)
- [ ] `docs/audit/29-style-dispositions/30-NN.md` — companion rows for the frozen-section tagging
- [ ] Framework install: **none needed** — vitest 4.1.8 is present and configured

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1`, `security_block_on: "high"`
`[VERIFIED: .planning/config.json workflow block, 2026-09-05]`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | **yes** (analogue) | The human-name grant is the authentication of a floor-lowering. Control: fresh per-call read from the hook's own process env + refuse-self-set, per `hooks/guard.ts:88,119-125` and `hooks/admission-guard.ts:205-225`. **Residual: §F-2** |
| V3 Session Management | **yes** | The grant is honestly **session-scoped**, not per-note. `admission-guard.ts:24-30` states this explicitly: "once a named human exports the approval variable, it authorizes high-severity admissions under that name for the rest of the session … a standing grant is NOT a mechanically-enforced per-note nonce." The `GRUGOPS_FLOOR_*` grants inherit the same honest scoping — say so in the render rather than implying per-action consent |
| V4 Access Control | **yes** | Fail-closed default deny: unknown/malformed/unreadable ⇒ `block`. Per-floor grants, never blanket (D-09) |
| V5 Input Validation | **yes** | Three untrusted inputs: hook stdin JSON, the config file, the checkpoint tag text. All three get explicit shape checks; `guard.ts:107-115` and `admission-guard.ts:92-119` are the precedents |
| V6 Cryptography | **no** | No secrets, no crypto beyond `randomUUID` for the gate's per-run id (existing) |
| V12 File Operations | **yes** | The new generator's `OUT` must be a **fixed literal repo-relative path**, never derived from argv/env/file content — `generate-safety-surface.ts` names this as its path-traversal mitigation and cites ASVS V12 explicitly. `emitVerdict`'s traversal refusal is already pinned (`context-io.test.ts:2054`) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Agent injects the grant via `.claude/settings.json` `env` | **Elevation of Privilege** | `permissions.deny` on the settings files + a `Write\|Edit` PreToolUse companion inspecting `tool_input.file_path`. **Residual, documented, not closed** (§F-2) |
| Agent inline-exports the grant in the same tool call | Elevation of Privilege | `SELF_APPROVE` regex, `guard.ts:88,119` — already closed, generalize over the new var family |
| Agent supplies a false test-integrity result to `emitVerdict` | **Repudiation / Tampering** | Fail-closed on absent/unrecognized (§F-3). Residual: the argument is agent-supplied. **State the tier; do not claim enforcement the caller shape cannot deliver** |
| Agent writes the config to lower a floor and nothing surfaces | Repudiation | D-10: gate as `block`, name the missing key, write the unauthorized declaration to the trace as a finding |
| Generated render silently omits a lowered floor | Repudiation / Information Disclosure | Count-asserted join with an independently derived denominator (Pitfall 6) |
| A gate prints PASS for a check it did not perform | Repudiation | Phase 28 AP-1, severity **blocking**. Every derived-set assertion computes its denominator outside the consuming loop |
| Path traversal via the generator's output path | Tampering | Fixed literal `OUT`; ASVS V12; the existing generator's stated mitigation |
| Same-uid direct filesystem write bypassing every hook | Elevation of Privilege | **Accepted / irreducible** — `docs/audit/28-residual-sizing.md` row 4. An agent running as the same uid with no hook can write the filesystem directly |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` (v2.1.251+) currently scrubs only `CLAUDE_CONFIG_DIR` and does not touch `GRUGOPS_*` | §F-2 item 4 | If the scrub list is broader or widens, the whole two-key mechanism breaks silently on some hosts. Source was a GitHub issue title surfaced by WebSearch, not primary vendor documentation |
| A2 | An agent's `Write`/`Edit` to `.claude/settings.json` takes effect on hook subprocesses **within the same session** | §F-2 | The vendor docs say settings-file `env` entries are "reapplied dynamically during active sessions when the file changes", but they do not state explicitly that a *hook subprocess spawned after the edit* inherits the new value. The composed inference is strong but not directly documented. **A red-team round should reproduce this empirically before the render's wording is finalized** |
| A3 | The 4 floor-tier checkpoint ids will be `SAFETY_FLOORS`' members minus `autonomy` plus D-06's replacements — i.e. `protected_branch_merge`, `production_requires_human_confirmation`, `test_integrity`, and one of `open_pr` / `commit_to_branch` | §F-1 option 1, §Architecture | D-04 and D-05 together imply this but do not state the resulting four names. If the planner picks differently, the env var names and registry `depends_on` values change |
| A4 | Placing `GUARANTEES.md` at the repo root would put it inside `check-public-docs-vocabulary`'s corpus | §F-6 | The corpus is derived from three self-deriving parts; I read the part names and the exemption list but did not trace each part's membership rule to completion. Verify before choosing the location |
| A5 | `emitVerdict`'s ~16 test call sites are all positional and will all fail `tsc` on a new required third parameter | §Pattern 3 | If any call site uses an options object or a wrapper, the discrimination proof is weaker than stated. Cheap to check with `npm run typecheck` |
| A6 | No fifth host CLI reads `.claude/settings.json`, so the §F-2 vector is Claude-Code-specific | §Security Domain | Each host has its own settings file with its own env semantics; only Claude Code was researched this session. The other four keep the documentary tier anyway (locked), so the blast radius is bounded |

---

## Open Questions

1. **How does the sequential role-load path surface `notify` on the four non-hook hosts?**
   *(Explicitly assigned to research by the Claude's-Discretion note.)*
   - What we know: those four hosts read `AGENTS.md` and role markdown; grugops emits no agent
     definitions for them (the narrowed MODEL-06 finding), so there is no hook and no mechanical tier.
   - What's unclear: whether a `notify` disposition on those hosts should be a role-prose instruction
     ("record a finding naming the checkpoint") or simply be documented as unenforced.
   - Recommendation: the documentary tier already exists for hook-enforced checkpoints; extend it
     rather than invent a fifth mechanism. Have `factory.config.md` and the render state, in one
     sentence each, that on those four hosts `notify` and `off` are advisory. **Do not** add
     host-specific machinery — that is exactly the "semantics would diverge per host" reason the
     `permissionDecision: ask` tier was deferred.

2. **Where does the checkpoint set get its role-tier members?** (§F-1)
   - What we know: role `## Hard limits` has no bullets; workflow `## Stop conditions` has 38.
   - What's unclear: which of F-1's three dispositions the user wants. This changes D-01's text.
   - Recommendation: option 1 (workflow bullets + `SAFETY_FLOORS`). Flag to the user at plan time —
     it amends a locked decision.

3. **Who calls `emitVerdict` after this phase?** (§F-3)
   - What we know: no production caller, no CLI verb, and workflow 05 describes one that does not exist.
   - What's unclear: whether the plan adds the CLI verb (recommended) or leaves the emission path
     as-is and only changes the function signature for tests.
   - Recommendation: add the verb, fix the workflow sentence, update
     `admission-protocol-docs.test.ts:99-107`, and state the agent-supplied-argument tier honestly in
     `emitVerdict`'s header — D-15 already requires that the tier split be stated.

4. **Does `install.ts` migrate a user repo's `autonomy` key, or only report it?** (§Runtime State Inventory)
   - What we know: D-05 makes a present key a refusal, and installed repos carry one.
   - What's unclear: the installer's contract is "idempotent, additive, reversible; never overwrite or
     delete user content" (`CLAUDE.md`), which argues against a silent rewrite.
   - Recommendation: **report, do not rewrite.** The doctor names the key and prints the D-06 mapping
     table. A silent config rewrite by an installer is the opposite of this project's posture.

5. **Does `readRegistry()`'s missing duplicate-key detection (AP-1 CR-02) need fixing here?**
   - What we know: `readRegistry()` is last-wins and silent, while `readRegister()` refuses duplicates.
     The plan adds a `dropped` status to the registry.
   - What's unclear: whether CR-02 was closed by a later Phase 28 plan.
   - Recommendation: verify at plan time. Adding a status value to a parser with silent last-wins
     duplicate handling is the shape that lets `- status: dropped` … `- status: true` read as `true`.

---

## Sources

### Primary (HIGH confidence — read directly this session)

- `hooks/guard.ts` (all 141 lines) — `APPROVAL`, `DEPLOY` pattern set, `SELF_APPROVE`, `deny()`,
  stdin fail-closed parse, the documented env-indirection residual at `:79-83`
- `hooks/admission-guard.ts` (all 229 lines) — per-name env grant, stamp binding, fail-closed branches,
  the "why a separate hook process" argument at `:21-33`
- `scripts/context-io.ts:900-1000, 1225-1364, 1480-1560, 1578-1642` — `emitVerdict`, both readers, the
  `GATE_OR_STRICTER` canonicalization, `admitAndAppend`, the three-verb CLI
- `scripts/audit-model.ts:190-250` — `SAFETY_FLOORS` and `safetyFloorLiveValue`
- `scripts/validate-agent-factory.ts:325-399` — the required-key loop, `Q_ENUMS`, the presence-guarded
  optional-enum contract
- `scripts/floor-invariance.test.ts:1-140, 225-254, 520-550` — the four invariants, `FROZEN_GUARD_BLOB`,
  the two freeze assertions, the garbage value sweep, the measured timeout rationale
- `agent-factory/config/factory.config.json` (all 66 lines)
- `.planning/phases/30-per-checkpoint-autonomy-matrix/30-CONTEXT.md` and `30-DISCUSSION-LOG.md`
- `.planning/REQUIREMENTS.md:100-108` (AUTO-01..07), `.planning/config.json`

### Primary (HIGH confidence — derived by command on the tree, 2026-09-05)

- Bullet counts per section across both corpora (node one-liner over `locateSection`-equivalent walk)
- `grep -rl "^## Hard limits" agent-factory/roles/ | wc -l` → 17; same for workflows → 19
- `grep -rn "emitVerdict" --include=*.ts .` — all call sites are tests
- `grep -rn "readGovernanceConfig\b\|readGovernanceConfigResult" --include=*.ts .` — 3 non-test sites
- `grep -rln "autonomy"` filtered to `scripts/fixtures/` — 8 fixture repos × 2 config twins
- `awk` join over `docs/audit/28-claim-registry.md` — 47 rows, 6 `kind: safety`, 5 carrying `autonomy`
- `cat package.json`, `cat vitest.config.ts`, `cat hooks/hooks.json`, `cat .claude-plugin/plugin.json`
- `sed -n` reads of `scripts/check-diff-disposition.ts`, `scripts/check-imperative-lexicon.ts`,
  `scripts/check-foundation-guards.ts`, `scripts/check-banned-claims.ts`,
  `scripts/generate-safety-surface.ts`, `scripts/freshness.ts`, `scripts/kit-model.ts`,
  `agent-factory/config/factory.config.md`, `agent-factory/workflows/05-pr-quality-gate.md`
- Toolchain probes: `node`, `npm`, `npx tsc`, `npx vitest`, `git`, `claude` — all `--version`

### Secondary (MEDIUM confidence — official vendor documentation via Context7)

- `code.claude.com/docs/en/hooks` — Hook Execution Environment (parent-env inheritance, OTEL_* scrub);
  `hookSpecificOutput` deny shape
- `code.claude.com/docs/en/settings-reference` — the `env` key's subprocess reach; `permissions.deny`
  scope
- `code.claude.com/docs/en/env-vars` — precedence, and the **dynamic reapplication** of settings-file
  `env` during an active session
- `code.claude.com/docs/en/settings` — the five-level settings precedence order
- `code.claude.com/docs/en/managed-settings` — `allowManagedPermissionRulesOnly`
- `code.claude.com/docs/en/agent-sdk/hooks` — `Write|Edit` matcher with `tool_input.file_path`
  filtering; matchers evaluate tool names only

### Tertiary (LOW confidence — WebSearch only, flagged in the Assumptions Log)

- GitHub issue titles referencing `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` in Claude Code 2.1.251 (A1)
- GitHub issue titles referencing mid-session `settings.json` rewrite behavior (context for A2)

---

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — fixed by `CLAUDE.md`, verified against `package.json` and live
  `--version` probes; nothing new to choose
- Architecture: **HIGH** — every pattern has a named, read-this-session precedent in the tree
- Codebase findings (F-1, F-3 through F-9): **HIGH** — each derived by command or read directly, with
  verbatim quotes and line ranges
- Hook / settings semantics (F-2): **MEDIUM** — the individual facts are cited from official vendor
  documentation; the *composition* into an attack path is an inference (A2) that a red-team round
  should reproduce empirically before the generated render commits to wording
- Pitfalls: **HIGH** — six of the eight are recorded project lessons with a specific prior incident

**Research date:** 2026-09-05
**Valid until:** 2026-10-05 for the codebase findings (stable, in-repo, no external drift).
**7 days** for the Claude Code hook/settings semantics — that surface moved between v2.1.217 and
v2.1.219 (subagent spawn depth), and again at v2.1.251 (`SUBPROCESS_ENV_SCRUB`). Re-verify §F-2 against
the host version in use before Surface A's red-team rounds begin.
