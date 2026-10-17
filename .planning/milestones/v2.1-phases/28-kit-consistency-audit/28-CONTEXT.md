# Phase 28: Kit Consistency Audit - Context

**Gathered:** 2026-08-11
**Status:** Ready for planning

<domain>
## Phase Boundary

The kit describes the architecture it actually ships, every role and workflow has been read with a recorded verdict, and every public safety claim carries an id — so a later phase has something concrete to void.

Requirements: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04 (4 total).

This phase is an **audit**. Its primary output is *records* — a disposition register and a claim registry — plus a bounded set of fixes. It is not a rewrite: Phase 29 (LANG) rewrites role and workflow prose and Phase 30 (AUTO) rewrites governance prose, and both consume artifacts this phase produces.

**Verified tree state at discussion time (2026-08-11)** — measured, not assumed:

| Thing | Roadmap / requirement says | On disk |
|---|---|---|
| `agent-factory/roles/` | "18 roles" (SC1) | **18 files**; `kit-model.listRoles()` returns **17** (drops `_`-prefixed) |
| `agent-factory/workflows/` | 19 | 19 ✓ |
| `CLAUDE.md` | the named AUDIT-02 target | 3 `handoff` hits (`:6`, `:10`, `:33`) + "Orchestrator **routes**" (`:6`) |
| `README.md` | not named | 1 `handoff` (`:3`) + "One Orchestrator **routes** work through the full lifecycle" (`:3`) |
| `agent-factory/README.md` | not named | 4 `handoff` hits (`:4`, `:35`, `:36`, `:49`) + "routes" (`:6`) — **ships to every user** |
| `AGENTS.md` | in the guarded SCAN | `:5` "One Orchestrator … **routes** work" while `:21` correctly says decompose→enqueue |
| `examples/*.md` (5 files) | not named | **14 dead `agent-factory/handoffs/…` path refs**, embedded in narrative |
| `agent-factory/handoffs/` | hygiene obligation #5 | holds only `.gitkeep`; **ships to every user** |
| `agent-factory/examples/` | not named | **empty directory**; ships to every user |
| AUDIT-04 pins | "gate templates" | 3 sites in 2 files: `agent-factory/checklists/playwright-visual-regression-recipe.md:17,18`, `agent-factory/checklists/accessibility-checklist.md:20` |
| `CHANGELOG.md`, `docs/initial/`, `docs/design/` | — | carry handoff prose as **historical record — must stay** |

**Shipping fact that settles scope:** `install/install.ts:1065` does `cpSync(join(GRUGOPS_SRC, "agent-factory"), tmp, {recursive: true})` — the entire `agent-factory/` tree reaches the kit root of every install. `agent-factory/README.md`, `agent-factory/handoffs/` and `agent-factory/examples/` are therefore **user-visible**, while root `README.md`, `CLAUDE.md` and `examples/` are the project's public face on GitHub but are not installed.

**Why the exclusions exist and must not be widened:** `scripts/check-kit-refs.ts:57` names `README.md`, `CLAUDE.md`, `agent-factory/README.md` and `agent-factory/examples/` as deliberate SCAN exclusions under D-08 — *"shipped kit + adapters + AGENTS.md, NEVER a repo-wide grep."* That contract stands. AUDIT-02's enforcement is a **separate consumer** of the same list, not a widening of that SCAN.

**Standing obligations landing here** (ROADMAP.md:109-110): #4 fail-safe residuals and #5 hygiene, both dispositioned under AUDIT-01.

</domain>

<decisions>
## Implementation Decisions

### Disposition Register — completeness and shape (AUDIT-01)

- **D-01:** The audit set is **derived from the existing Phase 27 authorities** — `listRoles()` (17) + `listWorkflows()` (19) = **36**. `ROADMAP.md` SC1's "18 roles" is **amended to 17** as part of this phase. No new lister is introduced. — Rationale: one authority per predicate; `kit-model.ts` already answers "what roles and workflows exist" and a second lister beside it is a second grammar over the same bytes.
- **D-02:** `_role-switch-protocol.md` is out-of-set by derivation (`kind: protocol`, `_`-prefixed) and is recorded as a **37th register row, explicitly uncounted**, carrying the reason — **and it is still read once** for the drift check. — Rationale: `docs/design/shared-install.md:55` records that its step 4 said *"write the role's handoff file under `agent-factory/handoffs/`"*, so it is one of the likeliest drift carriers in the tree; dropping it silently is the exact failure shape this project keeps hitting. The completeness assertion stays honest at 36 derived rows.
- **D-03:** Completeness is **two levels, two equalities**, because AUDIT-01 and SC1 use different granularities (*"each **finding** dispositioned"* vs *"each role and workflow has a recorded **disposition**"*):
  1. `file_rows.length === listRoles().length + listWorkflows().length` (36)
  2. `sum(file_rows[].findings) === finding_rows.length`

  Neither number can absorb the other's drift. — Rationale: a single conflated tally double-counts and the no-silent-drop equality can never close — the same conflation that broke the backstop-marker accounting.
- **D-04:** A finding's disposition draws from the **closed set `fixed` | `accepted` | `deferred`** — exactly AUDIT-01's three names, nothing invented. `deferred` requires a **named target phase**; `accepted` requires a **reason**; a fourth value **fails the gate**, never silently passes.
- **D-05:** The register lives as a **durable repo artifact under `docs/`** (not under `agent-factory/`, so it is not shipped to host repos), and a **`scripts/` gate enforces both D-03 equalities against the derived listers on every CI run.** — Rationale: Phase 29's roadmap entry declares a dependency on this phase's output, and a `.planning/phases/28-…/` artifact is archived at milestone close and invisible to CI. The equality has to be a check, not a claim. — **Reversibility:** costly — moving it later means re-cutting the gate, the Phase 29 consumer, and the exclusion-list derivation together.
- **D-06:** The read pass is **a re-runnable mechanical pre-pass under a full human-equivalent read**:
  - The pre-pass emits evidence rows across all 36 files for the greppable predicates — retired vocabulary, unresolvable refs, stale counts/versions, `UNKNOWN - verify` markers — and **survives the phase** as a re-runnable artifact.
  - Every file then gets a real read with those findings **pre-seeded**, and each row must carry a **substantive observation**, not the bare word "clean".
  - **The unverifiable-read limit is named explicitly in the register**: "this file was read" is not mechanically provable, and an agent reporting *clean* is narration. It is recorded as a limit rather than implied away.
  — Rationale: fanning 36 files across subagents would make every verdict an unbacked agent claim — the "green proved nothing" shape at 36×. An inline-only read leaves nothing re-runnable, so a later regression is invisible.
- **D-07:** The rubric is **six named categories**, five settled plus one record-only:
  1. **Factual correctness** — does the file describe the architecture that ships (decompose not route, shared verified context not handoffs, the three spawn tiers)?
  2. **Reference integrity** — every path, role, workflow, checklist and config key it names resolves on disk.
  3. **Claim honesty** — nothing unproven stated as fact; `UNKNOWN - verify` where genuinely unknown.
  4. **Internal consistency** — counts, versions, tier names, config keys agree with the schema and with sibling files.
  5. **Strangeness** — vestigial sections, contradictions, dead options, text with no remaining reader.
  6. **Instruction determinism** — *would two agents reading this step reach the same act?* — **RECORD-ONLY.** Determinism findings are dispositioned `deferred → Phase 29` **by default** and are never fixed here.
  — Rationale: category 6 gives Phase 29's LANG-02 a concrete, located worklist instead of a re-read of the same 36 files, while the pre-committed disposition structurally prevents the audit from turning into a style pass on prose Phase 29 is about to rewrite. — **Reversibility:** reversible.

### Drift Reconciliation — scope and mechanism (AUDIT-02)

- **D-08:** The drift set is **everything user-visible**: `agent-factory/README.md`, `agent-factory/handoffs/`, `agent-factory/examples/`, `AGENTS.md:5`, `CLAUDE.md`, `README.md`, `examples/*.md`. `CHANGELOG.md` and `docs/initial/` + `docs/design/` are **named, reasoned exemptions** — historical record, must stay. — Rationale: `agent-factory/README.md` is the internal start-here guide the installer ships to every user; fixing only `CLAUDE.md` fixes the file no user reads and leaves stale the one they do.
- **D-09:** Enforcement is a **third consumer of `scripts/dead-vocabulary.ts`** with its **own derived scan set** — root `*.md` (minus the `CHANGELOG.md` exemption) + `examples/*.md` + `agent-factory/README.md` — **two-sided count-asserted**. `check-kit-refs.ts`'s SCAN contract (D-08 of Phase 27) is **untouched**. — Rationale: same shape as D-24 — three genuinely different predicates over three different inputs, **one list**. The derivation fails closed: a new public doc carrying handoff prose enters the scan by existing rather than by someone remembering. A hand-listed scan set here would be the set-literal-drift defect landing inside the phase auditing for it. — **Reversibility:** costly — undoing it means re-cutting the consumer, its derivation and the exemption record together.
- **D-10:** **`routes` is NOT bannable as a token and must never enter `RETIRED_PROSE_FORMS`.** It is still correct in v2.0: the orchestrator adapter's own description reads *"Decompose each request into subtasks, **route** each to the right role agent"*; `orchestrator.md` keeps a `### Routing matrix`; `CLAUDE.md:83`'s "drives auto-routing" is a Claude Code platform fact. A token guard would red all three. This mirrors the warning `dead-vocabulary.ts`'s own header already carries about single-window prose. The drift is one **specific claim** — *"One Orchestrator routes work through the full software-delivery lifecycle — BA → product → … → release"*, a linear pipeline v2.0 replaced with decompose→enqueue over a shared queue — and a claim can only be held by a registry entry, never by a grep.
- **D-11:** All **five** `examples/*.md` are **re-narrated onto the shared-verified-context flow** — including `examples/03-ticket-to-pr.md`. The 14 refs are embedded in narrative describing the deleted relay (`examples/04-sprint-cycle.md:106` names two specific handoff artifacts), so this is a rewrite, not find-and-replace. **The Phase 33 / GAP-D1 coupling on `03-ticket-to-pr.md` is recorded in the register** so Phase 33 knows the file moved; the handoff lines are disjoint from GAP-D1's live-capture lines. — Rationale: a path swap without re-narration would describe a relay that no longer exists using correct paths — worse than the current honest staleness.
- **D-12:** **Both hygiene directories are deleted**, each as a register row with its reason: `agent-factory/handoffs/` (holds only `.gitkeep`, named for a concept Phase 24 deleted) and the empty `agent-factory/examples/`. `RETIRED_PATH_FORMS` already asserts **zero** hits on `agent-factory/handoffs/` across the shipped kit, so deleting the directory cannot break it, and nothing on disk requires either to exist.

### Claim Registry (AUDIT-03)

- **D-13:** The registry is a **claim → floor mapping, not a list.** Each row: `id`, verbatim sentence, `file:line`, `kind` (`safety` | `architecture` | `install`), `depends_on` (the floor/checkpoint whose lowering would falsify it), `status`. — Rationale: AUDIT-03's stated purpose is *"so Phase 30's claim-dropping mechanism has a named target."* The useful question is not *"what is a claim"* but *"which public sentences become false if floor F is lowered?"* Phase 30's AUTO-01 builds one closed exported checkpoint set, so the two sides join. — **Reversibility:** costly — the row schema becomes Phase 30's input contract.
- **D-14:** Completeness is **two-sided**: every safety floor has **≥1 claim mapped to it**, and every `kind: safety` claim **names ≥1 mechanism**. A safety claim depending on nothing is either not a safety claim or is unbacked — both are findings. Today's floors: `autonomy` (`pr`), `test_integrity` (`warn`, never off), `production_requires_human_confirmation` (`true`), and the never-merge-a-protected-branch hard limit.
- **D-15:** **One registry, `kind`-tagged** — it carries architecture and install claims alongside safety ones. Phase 30's claim-dropping **filters to `kind: safety`**, so its target set is unchanged, but architecture claims (including D-10's routes claim) get ids and cannot drift back unnoticed. **No second registry** — that is the duplicate-list class D-24 and D-28 each collapsed once already.
- **D-16:** Freshness is held by **invisible `<!-- claim: ID -->` anchors in the docs plus a gate asserting anchors ↔ rows is a bijection**, and that each row's verbatim text still matches at its anchor. An anchor with no row and a row with no anchor both go red. HTML comments render as nothing on GitHub, so the public face is unchanged. — Rationale: **Phase 29 sits between this registry and its only consumer and rewrites prose for a living** (LANG-02 governs workflow steps, checklists, memory-bank, shared-context notes, board and traceability). Without the bijection, Phase 29 silently invalidates the registry Phase 30 depends on. — **NAMED RESIDUAL, recorded not implied away:** a brand-new claim written without an anchor is **not mechanically detectable** — no grep recognizes "assertive sentence." — **Reversibility:** costly — the anchors live in published public docs.
- **D-17:** Each row carries **`status: true | overstated | false`, measured against its named mechanism.** Anything not `true` becomes an AUDIT-01 finding. False-by-drift is fixed here (already in the D-08 set); `overstated` gets a disposition — **qualify the wording, or accept with the residual named** — never silently left standing. This is a real verification pass over ~30 claims, budgeted as scope. — Rationale: CLAUDE.md's hard constraint is *"never fake a passing gate, a test result, or a citation"*; measuring a public claim false and shipping it sits in that family.

  **Four candidates already measured during discussion, for the planner:**

  | Claim | Where | Problem |
  |---|---|---|
  | "The roles, the **handoffs**, and the gates are identical everywhere" | `agent-factory/README.md:35` | **false by drift** — also in the D-08 set |
  | "Coordinator spawns role agents" | `agent-factory/README.md:40` | advertised, but **KIT-03 and SPAWN-04 are still `[ ]` / Gaps Found** — Phase 27 closed by named user override, not by a verification round |
  | "Humans **always** hold merge and deploy" | `README.md:3`, `agent-factory/README.md:11` | **overstated** — `PROJECT.md:176` records an irreducible same-uid/no-hook direct-FS forgery residual, backstopped by `autonomy=pr` |
  | "grugops version `0.1.0`" | `README.md:22` | `plugin.json` says `0.1.0`, root `VERSION` is empty, `agent-factory/VERSION` exists, repo is tagged `v2.0` |

- **D-18:** Phase 28 **does** produce the **safety-surface exclusion list** Phase 29's LANG-02 requires, and it is **derived, not hand-listed**: add `safety_surface: yes/no` to each of the 36 register rows (near-free — the reader is already in the file), then the list derives as *(register rows where `safety_surface`) ∪ (registry rows where `kind: safety`)*. — Rationale: the roadmap assigns it in Phase 29's dependency prose although no AUDIT requirement carries it, so it is produced here without widening AUDIT-03. A standalone hand-list would be a fourth maintained set inside the phase whose subject is maintained sets rotting.

### Fix-vs-Record Budget (AUDIT-01 disposition of standing obligations #4 and #5)

- **D-19:** The posture is **defects fixed, prose recorded.** Fix the trivial-to-one-line items and the D-08 drift; investigate-and-size the unsized ones, then fix or defer each **with a named reason**; record all prose and determinism findings for Phase 29. — Rationale: prose fixed here is rewritten in Phase 29, but a deferred defect gets more expensive — measurably so for the `floor-invariance.test.ts` timeout.

  | # | Item | Disposition |
  |---|---|---|
  | 1 | Phase-22 WR-03 usability false-positive | investigate, size, then fix or defer with reason |
  | 2 | `---\n--- \n…` byte-round-trip adjacency | see D-21 |
  | 3 | `floor-invariance.test.ts` spawn-heavy timeout (~1 line) | **fix** — `PITFALLS.md:801` records it *"will get worse when Phase 30 adds checkpoints"* |
  | 4 | same-uid/no-hook direct-FS forgery residual | **irreducible** — becomes the `status: overstated` registry row on "Humans always hold merge and deploy" (D-17) |
  | 5 | `agent-factory/handoffs/.gitkeep` + empty `agent-factory/examples/` | **fix** (D-12) |
  | 6 | AUDIT-04 pins | **fix** (D-22) |
  | 7 | `oracleWr05Wording` quadratic hang | **fix** (D-20) |
  | 8 | determinism / prose findings | **record-only → Phase 29** (D-07) |

- **D-20 (folds todo `oracle-wr05-quadratic-lookahead-hang.md`):** The acceptance bar is **anchor + permanent regression control + a loud input bound**:
  1. Give the three `WR05_BEATS` regexes **consuming anchors** so a failed match cannot be retried at every start position. The class is **bounded and small** — measured: exactly 3 pure-lookahead regexes, all in `WR05_BEATS`, and **no other pure-lookahead regex anywhere in `scripts/`**.
  2. A **permanent regression control with a pathological long line**, RED against the pre-fix build and GREEN after, with the transcript recorded.
  3. **Bound the oracle's input** so an unbounded line degrades **loudly** — a named refusal naming the file — rather than hanging.
  — Rationale for (3): `WR05_SCAN` is a hand-listed 4-file set of `.planning/` docs, one of which is `STATE.md` — an unbounded, agent-written narrative the GSD workflow appends to on every state update, and the exact file whose 527 KB line produced the original non-termination. Anchoring makes the predicate linear; it does not stop the oracle reading arbitrarily large agent-written prose. This repo's terminal lesson is *"ask what the predicate's INPUT is assembled from."* A non-terminating gate is a fail-open in effect: a hanging CI check gets marked flaky and skipped.

- **D-21 (USER DECISION, taken against a stated concern — recorded with the concern intact):** If the byte-round-trip adjacency residual (#2) requires editing the canonical admission reader (`scripts/canonical-frontmatter.ts` / `scripts/frontmatter.ts`), it is **fixed in this phase with a red-team pass**, not deferred.

  > **Concern raised during discussion and overridden by the user:** that module took Phase 27 **twelve gap-closure rounds**; rounds 10 and 11 each shipped a **new regression inside their own fix**; D-64's entire point at round 12 was to stop widening the parser and refuse everything outside a canonical form. Phase 27 closed it by **named user override**, with KIT-03 and SPAWN-04 still `[ ]`. Phase 30 carries a red-team budget as scope; Phase 28 does not. **The accepted cost: this audit phase now carries an adversarial round.**

- **D-22 (the bar for D-21's red team):** The **full Phase 27 closure doctrine** applies — **structural fix** (not another predicate widening) **+ parser-oracle fuzz against a real YAML loader + ≥2 independent red-teams + the executor reproducing the bypass itself, before and after.** — Rationale: this is the bar that finally closed round 12, and it is the only bar this module has ever yielded to. A green suite is not evidence here. One red team is what rounds 10 and 11 each had.

- **D-23:** **AUDIT-04 is satisfied by re-measuring at execution time.** Run `npm show` when the change is made, pin whatever is current **then**, and record the command, transcript and date in the register. **If the measurement differs from the roadmap's `1.62.0` / `4.12.1`, the measured value wins and the divergence is recorded.** No live freshness gate. If the box is offline, record `UNKNOWN - verify` — never assume. — Rationale: the requirement says *"verified at the time of change … recorded rather than assumed"* and then pre-names targets measured **2026-07-28**; pinning those numbers because the roadmap says so *is* the assumption it forbids. Conversely a re-runnable check reds the day upstream ships `1.63.0`, which is not a defect — and training people to ignore a red gate is the failure mode this milestone has been fighting throughout.

### Ordering — demonstrated, not asserted

- **D-24:** The **AUDIT-02 drift guard lands FIRST and is REQUIRED to fail RED against today's tree**, with the measured hit counts recorded as a transcript; the drift fixes land in a later wave and turn it green. — Rationale: this is Phase 27 SC2's shape exactly — the KIT-03 oracle had to fail red against the real tree (1 adapter, 7 granted names) before any adapter was authored. A guard that passes the moment it appears has never been watched fail, so its ability to catch this drift is asserted rather than demonstrated.
- **D-25:** The **claim registry is authored and anchored BEFORE the AUDIT-02 drift fixes.** Claims are registered against today's text, with the drift-affected ones recorded `status: false`. The AUDIT-02 rewrite must then update those rows in the same commit — and D-16's bijection/verbatim gate catches it if it does not, **on a real commit rather than a fixture**. — Rationale: same posture as D-24. It also leaves an audit trail of each false claim being recorded, corrected, and flipped to `true`.

### Claude's Discretion

- Wave decomposition and plan count, subject to D-24 and D-25's ordering constraints.
- The exact file names and on-disk format of the register, the claim registry, and the derived exclusion list under `docs/`.
- The id scheme for claim ids and finding ids.
- How the mechanical pre-pass (D-06) is packaged — whether it joins an existing `scripts/` gate or stands alone.
- Sizing method for residuals #1 and #2.

### Folded Todos

- **`oracle-wr05-quadratic-lookahead-hang.md`** (severity `high`, area `scripts/check-uat-oracles.ts`, found during phase 27 wave 1) — `oracleWr05Wording`'s three beat regexes are pure zero-width lookaheads with no consuming atom, so a non-match is retried at every start position and cost is quadratic in line length. Reproduced: a 527 KB line in `.planning/STATE.md` made `check-foundation-guards.js` **non-terminating** (no return inside 180 s, 99% CPU, killed) versus 0.41 s on the repaired tree. The whole vitest suite depends on that gate (`check-foundation-guards.test.ts` spawns it 112 times). **Folded under D-19 item 7 and D-20** — it is not a role or workflow file, so AUDIT-01 does not literally reach it, but the roadmap routes standing obligation #4 (fail-safe residuals) through AUDIT-01's disposition, and a non-terminating safety gate is the loudest fail-open available.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` §"Phase 28: Kit Consistency Audit" (lines 418-432) — goal, 4 success criteria, the `CTX_WORKFLOWS`-already-covered note, and the standing-obligation routing
- `.planning/ROADMAP.md` lines 102-110 — the five v2.0 standing obligations and which phase each lands in
- `.planning/REQUIREMENTS.md` lines 72-75 — AUDIT-01 … AUDIT-04 verbatim

### Prior-phase decisions this phase must respect
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md` — D-16/D-17 (which literals are derived and why `roleCeiling()` is deliberately not), D-19 (recorded inventory + per-consumer assertion, explicitly *not* a grep-based literal detector), **D-24 (one dead-vocabulary list, multiple justified consumers)**, D-25 (the adapter+template scan set), D-26 (the guard is defense in depth, never the structural fix), D-64 (the canonical-form admission reader)
- `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` — the round-by-round bypass record and the closure doctrine D-22 inherits

### Downstream consumers of this phase's output
- `.planning/ROADMAP.md` §"Phase 29: Controlled Language & Voice Guard Rebuild" (lines 434-449) — LANG-02's named safety-surface exclusion list, LANG-05's `## One job` / caveman / `## Responsibilities` de-dup targets that D-07 category 6 must not front-run, and the byte-ceiling re-baseline rule
- `.planning/ROADMAP.md` §"Phase 30: Per-Checkpoint Autonomy Matrix" (lines 451-468) — AUTO-01's closed checkpoint set that D-13's `depends_on` joins to, AUTO-05/07's claim-dropping, and the red-team-rounds-as-scope budget
- `.planning/ROADMAP.md` §"Phase 33" + obligation #1 — the GAP-D1 coupling on `examples/03-ticket-to-pr.md` that D-11 must record

### Code the phase reads or extends
- `scripts/dead-vocabulary.ts` — the single retired-vocabulary authority. **Read its header comment before touching it**: it explicitly warns that single-window / execution-topology prose must NEVER be added, because a guard banning it would red text kept on purpose. D-10 is the same trap for `routes`.
- `scripts/check-kit-refs.ts:36-93` — the SCAN and GH_SCAN sets, the D-08 "never a repo-wide grep" contract, and the named exclusions D-09 must not widen
- `scripts/kit-model.ts` — `listRoles()` / `listWorkflows()`, the derivation rules (drop `_`-prefixed; workflows match `/^\d{2}-.+\.md$/`), and the vacuity-throw / exact-count semantics D-01 and D-03 rely on
- `scripts/check-uat-oracles.ts:85-133` — `grepFiles`, `WR05_SCAN`, `WR05_BEATS` — the D-20 target
- `install/install.ts:1065` — the `cpSync` of the whole `agent-factory/` tree that makes D-08's shipped/not-shipped split a fact
- `scripts/canonical-frontmatter.ts`, `scripts/frontmatter.ts` — the D-21 / D-22 module, only if residual #2 reaches it

### Drift and claim surfaces
- `CLAUDE.md` (`:6`, `:10`, `:33`), `README.md` (`:3`, `:22`, `:30`, `:38`), `AGENTS.md` (`:5`, `:21`, `:34`, `:40`, `:89-94`), `agent-factory/README.md` (`:4`, `:6`, `:10-11`, `:35-49`, `:65-77`) — the AUDIT-02 and AUDIT-03 surfaces
- `examples/01-…` … `examples/05-release-run.md` — the 14 dead-path narratives D-11 re-writes
- `agent-factory/checklists/playwright-visual-regression-recipe.md:17,18` and `agent-factory/checklists/accessibility-checklist.md:20` — the 3 AUDIT-04 pin sites

### Residuals and honesty floors
- `.planning/PROJECT.md:176` — the four fail-safe residuals verbatim, and the forgery residual D-17 maps to a claim
- `.planning/research/PITFALLS.md:801` — the same four, plus the note that the `floor-invariance.test.ts` timeout gets worse in Phase 30
- `.planning/research/STACK.md:406,439,451` and `.planning/research/SUMMARY.md:102` — the 2026-07-28 pin measurement D-23 must **re-measure rather than inherit**
- `docs/design/shared-install.md:50,55` — the 50 `agent-factory/handoffs/` refs and the `_role-switch-protocol.md` step-4 handoff line that motivates D-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`scripts/dead-vocabulary.ts`** — already the single retired-vocabulary authority, already containing `"handoff packet"` (prose) and `"agent-factory/handoffs/"` (path). **The measured drift is not there because the list is wrong — it is because the files sit outside every scan set.** D-09 adds a third consumer rather than a fourth list. This is the phase's single largest reuse.
- **`scripts/kit-model.ts`** — `listRoles()` / `listWorkflows()` with vacuity-throw and exact two-sided counts. D-01 and D-03's completeness equalities plug straight in; no new derivation machinery is needed.
- **`scripts/check-kit-refs.ts`'s `walk()` + explicit-SCAN pattern** — the template for D-09's derived consumer: an explicit path list where a named directory entry self-derives through the walker.
- **`scripts/check-foundation-guards.ts`'s guard-with-a-PASS-line-that-names-its-inputs pattern** (from Phase 27 D-40 item 2) — the model for D-05's completeness gate, which should print the counts it actually read rather than a bare PASS.
- **The `DISTRIBUTION_PAIR_EXEMPT` shape** (Phase 27 D-40/D-46) — the established form for D-08's `CHANGELOG.md` / `docs/` exemptions: named, reasoned, and bounded by assertions rather than silently absent.

### Established Patterns

- **Oracle-fails-RED-first** (Phase 27 SC2, KIT-03) — a guard must be watched failing against the real tree before it is trusted. D-24 and D-25 are direct applications.
- **Derive the set, assert the count, two-sided** — every set in the tree that survived Phase 27 does this. D-01, D-03, D-09, D-14 all follow it.
- **One authority per predicate; a second *check* can be justified, a second *list* cannot** (D-24 of Phase 27) — the argument D-09 and D-15 each rest on.
- **Named exemptions carry their reason inline**, so they cannot be read later as oversights (`skills/grugops/SKILL.md`, `hooks/`). D-02, D-08 and D-12 all follow this.
- **`UNKNOWN - verify`, never fabricate** (`AGENTS.md:40`, CLAUDE.md constraint) — D-23's offline fallback.
- **Byte ceilings are re-baselined once, at end of phase, never raised mid-phase** (Phase 29 LANG-08). This phase must not raise a ceiling; D-07 category 6 being record-only keeps it clear of the ceiling question entirely.

### Integration Points

- **`docs/`** gains the disposition register, the claim registry, and the derived exclusion list (D-05, D-13, D-18) — a new durable-artifact location outside `agent-factory/`, so nothing new ships to host repos.
- **`scripts/`** gains the D-05 completeness gate, the D-09 dead-vocabulary consumer, the D-16 anchor/bijection gate, and the D-06 mechanical pre-pass. Each needs its committed `.js` and a freshness check per the standing TypeScript-tooling contract.
- **The public docs** gain invisible `<!-- claim: ID -->` anchors (D-16) — the first markup this project has put into `README.md` for a mechanical purpose.
- **`agent-factory/`** loses two directories (D-12), which the installer's `cpSync` and the uninstall mirror both track by derivation, so no installer literal should need editing — **verify this rather than assume it**.
- **Phase 29** consumes the exclusion list and the category-6 determinism worklist; **Phase 30** consumes the claim registry's `kind: safety` rows and their `depends_on` mappings; **Phase 33** consumes the recorded `examples/03-ticket-to-pr.md` coupling.

</code_context>

<specifics>
## Specific Ideas

- The register must name its own unverifiable-read limit in plain text (D-06). The user's consistent posture across this discussion was **demonstrated over asserted** — RED-first guards, anchors before fixes, measured pins over inherited ones — and the register should read the same way: where something cannot be proven, say so rather than let a green row imply it.
- The `routes` trap (D-10) and the single-window trap already recorded in `dead-vocabulary.ts`'s header are the same shape. When D-09's consumer is written, that header comment should be extended so the *next* editor meets both warnings in one place.
- D-21 was taken **over a stated objection**. Its blockquote must survive into the plan verbatim — if the red-team round finds trouble, the record should show the tradeoff was seen and accepted, not missed.

</specifics>

<deferred>
## Deferred Ideas

- **Widening the audit to all kit prose** (checklists, packaging, contracts, `_commit-convention.md` — ~55 files instead of 36) — considered and declined; it goes past AUDIT-01 and SC1 and roughly doubles the read budget. If the 36-file pass surfaces systemic issues in the checklists, that is its own phase.
- **A second, architecture-only claim registry** — declined under D-15 as the duplicate-list class. If the kind-tagged single registry proves unwieldy for Phase 30, splitting is a later call, not this phase's.
- **Retiring `oracleWr05Wording` entirely** — the oracle asserts that four `.planning/` documents narrate a *"dropped P8 → guarded P10 → re-verified P11"* story from two milestones ago, in a repo where `.planning/` is archived at milestone close. D-20 fixes the hang and does not settle whether the oracle is still load-bearing. Surfaced during discussion; a candidate strangeness finding, but **not** something to retire silently inside a bug fix.
- **Deriving `WR05_SCAN`** — it remains a hand-listed 4-file set. D-20 bounds its *input* but does not derive its *membership*. Noted so a later phase does not mistake the input bound for a derivation.
- **Fixing determinism / prose findings** — record-only here by D-07; they are Phase 29's LANG-02 and LANG-05 work.
- **Making the `agent-factory/README.md` five-tool dispatch table match the three-tier reality** (Full / Reduced / Degraded, Phase 27 D-02) — the table at `:38-44` predates the tier vocabulary. Raised during discussion; it falls out of D-07 category 1 as a finding and will be dispositioned there rather than pre-decided now.

</deferred>

---

*Phase: 28-Kit Consistency Audit*
*Context gathered: 2026-08-11*
