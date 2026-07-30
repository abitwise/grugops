# Phase 27: Spawn Correctness & Kit-Set Authority - Context

**Gathered:** 2026-07-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Role agents actually execute in their own sessions on Claude Code — and every guard and validator scan set is derived from the filesystem **before** the 17 new adapter files exist, so they land inside the guards rather than outside them.

Requirements: KIT-01, KIT-02, KIT-03, SPAWN-01..07 (10 total).

**Load-bearing ordering inside the phase** (from ROADMAP.md, unchanged): kit-set authority + referential-integrity oracle land **first**; the `orchestrator.md` trim lands **before** any spawn text is touched; the 17 adapters are generated **last**. Reversing this reproduces the exact failure this phase exists to fix, with new names.

**Verified tree state at discussion time** (2026-07-28) — the baseline the oracle must fail RED against:

| Thing | Claimed | On disk |
|---|---|---|
| `agent-factory/roles/` | 17 roles | 17 (+ `_role-switch-protocol.md`, `kind: protocol`, underscore-prefixed) |
| `agent-factory/workflows/` | 19 | 19 |
| `.claude/agents/` | — | **1** (`grugops-orchestrator.md`) |
| Coordinator `Agent(...)` grant | 7 names | **0 of 7** resolve to a file |
| `orchestrator.md` | ≤ 7570B FAIL / 7165B WARN | **7562B — WARN already breached, 8B from FAIL** |
| Handoff prose | grep-to-zero (v2.0 MIGR-02) | live at `.claude/agents/grugops-orchestrator.md:25` |

**Role tier split** (already in role frontmatter, no new authoring needed): 12 `tier: core`, 5 `tier: enterprise` (compliance-officer, factory-coach, incident-responder, installer, release-manager).

</domain>

<decisions>
## Implementation Decisions

### Coordinator Entry & Main-Thread Wiring (SPAWN-03, SPAWN-04)

**Third stacked cause found during discussion, not in the roadmap text:** `.claude/skills/grugops/SKILL.md`'s `allowed-tools` is `Read, Write, Bash, Glob, Grep` — **no `Agent`**. So `/grug`, the brand's headline entry ("a user types `/grug`"), runs in the main thread and *structurally cannot spawn* even once the adapters exist. Any fix that only works via `claude --agent` repairs the mechanism and breaks the brand promise.

> **⚠ REVISED 2026-07-28 — the premise above is factually wrong; kept for the audit trail.** `[VERIFIED: code.claude.com/docs/en/skills]` `allowed-tools` is a per-turn **permission pre-approval**, not a capability restriction — "It does not restrict which tools are available: every tool remains callable." The restricting field is `disallowed-tools`, which grugops does not use. `/grug` runs in a default main-thread session that **already has `Agent`**, so it *can* spawn — unscoped. The only reason no role agent ever ran is that 16 of 17 adapter files do not exist and all 7 granted names resolve to nothing; **SPAWN-01 alone very likely fixes the reported defect on the `/grug` path.**
>
> Two corollaries the planner must respect: (a) adding `Agent` to the skill's `allowed-tools` is a **capability no-op** *and* trips `guard_wr05` (`check-foundation-guards.ts:196` fails any non-`coordinator: true` file carrying a spawn grant) — the correct action on `.claude/skills/grugops/SKILL.md` is **no change**; (b) `context: fork` + `agent: grugops-orchestrator` exists but is **rejected** — it puts the coordinator on the subagent path where the allowlist is ignored (D-03's exact failure), costs a nesting layer, and a backgrounded fork gets the narrower background tool set. Recorded so a later phase does not "discover" it as an improvement.
>
> The verified trichotomy this section is now built on:
>
> | Entry path | Main thread? | Can spawn? | `Agent(...)` allowlist enforced? |
> |---|---|---|---|
> | `claude --agent grugops-orchestrator` | yes | yes | **yes** |
> | `/grug` (skill in default session) | yes | **yes** | no — session agent declares no allowlist |
> | `@grugops-orchestrator` (subagent) | no | yes, to the depth limit | **no** — the type list is ignored |
>
> D-01, D-03, and D-04 survive unchanged on their own rationale. D-02 and D-05 are re-derived below.

- **D-01:** The installer writes **no** main-thread wiring into the target repo. No `.claude/settings.json` `{"agent": ...}`, not even sentinel-wrapped. `claude --agent grugops-orchestrator` is documented as the full-capability path. — Rationale: writing it would make *every* Claude session in that repo the grugops coordinator, including sessions where the user just wants to edit a README; `settings.json` is user content and the installer is bound to "additive, never overwrite."
- **D-02 (REVISED 2026-07-28 — user decision; supersedes the original "loud degrade on every non-`--agent` path"):** The coordinator announces **one of three tiers, honestly**, keyed on what it can actually observe:
  - **Full** — `claude --agent grugops-orchestrator`. Parallel spawning; the enumerated `Agent(...)` allowlist **is** runtime-enforced.
  - **Reduced** — `/grug` in a default session. Parallel spawning **is available and the coordinator uses it**, but the enumerated grant is **not** runtime-enforced; the coordinator **says so** and stays inside the grant **by instruction**.
  - **Degraded** — the `Agent` tool is absent (the four other CLIs, or a subagent at the depth limit). Sequential single-window, announced — the existing path v2.0's dual-path equivalence oracle already proved converges on identical on-disk artifacts.

  — Rationale: the original decision's trigger condition was disproven (see the revision note above); degrading `/grug` to sequential would now be *discarding working parallelism on the brand's headline entry point*, not honoring a platform limit. This preserves D-03's spirit exactly — the coordinator never *claims* an enforced allowlist it does not have. — **Reversibility:** costly — the tier vocabulary becomes the documented `/grug` contract and the thing `guard_wr05` asserts; changing it later means re-cutting the guard, the coordinator body, and the user-facing docs together.
- **D-03:** **Never spawn under an allowlist the runtime is ignoring.** A green file with a false runtime is the exact failure class this milestone exists to kill (research finding ①: a parenthesized `Agent(a, b, c)` list evaporates on the subagent path).
- **D-04:** Detection is **capability-sensing, not version-sensing**: if the `Agent` tool is not available to the coordinator, it runs sequential and says so. This satisfies the milestone decision that *no runtime version-detection code is required*, and it is the same signal on all five host CLIs.
- **D-05 (REVISED 2026-07-28 — re-derived from the revised D-02):** `guard_wr05` asserts **tier-announcement presence** — the coordinator body carries all three tiers of D-02 and the capability-sensing check that selects between them — plus SPAWN-04 (no `Agent`/`Task` on any non-coordinator adapter). Both mechanisms hold on the subagent **and** main-thread paths, so no wiring artifact needs to exist in the user's repo for the guard to be meaningful. It does **not** assert a `settings.json` entry (there is none — see D-01). — Note: the original wording asserted "degrade-path presence," which under the revised D-02 would guard for text that must no longer be the `/grug` contract.

### Kit-Root Resolution for Spawned Roles (SPAWN-01)

**This decision deliberately overrides `.planning/research/ARCHITECTURE.md:515`**, which recommends the 17 role adapters be *plain copies* "because they cite repo-relative paths and the orchestrator already resolved the kit." That is wrong on the spawn path: in an installed repo `agent-factory/` does not exist (the kit lives at `${GRUGOPS_HOME:-$HOME/.grugops}`), a spawned subagent is a fresh context holding only its own adapter body, and `AGENTS.md:34` says the correct behavior on an unresolved kit is **STOP — do not hunt**.

- **D-06:** **All 17 adapters are self-sufficient resolvers.** Each generated adapter carries the resolver block; the installer materializes the absolute `KIT=` into all of them (not just the current two). — Rationale: making a spawned session's ability to find the kit depend on text the spawner remembered to include is "the handoff is the only memory," the pattern v2.0 deleted; it also silently breaks direct `@grugops-<role>` invocation. — **Reversibility:** costly — undoing it means re-cutting the generator template, the installer's materialization loop, `check-kit-refs` Assertion 3, and the uninstall mirror together.
- **D-07:** `check-kit-refs.ts` Assertion 3 is restated as a **derived predicate** — "`$GRUGOPS_HOME` appears only in generator-produced adapters + the packaging template" — never a literal widened from 3 named sites to 18. Consistent with KIT-02.
- **D-08:** A generated role adapter body carries exactly: the kit-vs-state blockquote, the resolver block, "read `agent-factory/roles/<role>.md` and act as that role," and the echoed hard limit (never merge a protected branch / never deploy to prod). **Nothing role-specific** — the role file does the thinking. The factory read order (`factory.config.json`, `AGENTS.md`, `plans/board.md`) is *not* duplicated into 17 adapters.

### Spawn Set & Adapter Shape (SPAWN-01, KIT-03)

- **D-09:** `adapters = 17 roles`; `grant = adapters − coordinator = 16`. KIT-03 asserts `grant ∪ {coordinator} == adapters == roles`. No exception list anywhere.
- **D-10:** The `tier: enterprise` roles are **in** the grant. **Grant is capability; the config dial is policy.** Filtering at the grant level would put policy in the capability layer and mean a `factory.config.json` change cannot reach a role the runtime already refused.
- **D-11:** Each adapter's `tools:` derives from a **neutral `capabilities:` key added to role frontmatter** (roles already carry `kind:` / `tier:`), which the generator maps to Claude Code tool names. — Rationale: a per-role map inside the generator is the drift class this phase kills; Claude-Code tool names inside portable role text is a portability smell, since role files serve all five host CLIs. — **Reversibility:** costly — the capability vocabulary becomes kit content read by the generator; changing it later touches all 17 role files plus the generator's mapping table.
- **D-12:** Each adapter's `description` (the auto-routing trigger) derives from the role's existing **`## One job` + `## Activates when`** sections. Both already exist in all 17 roles and `## Activates when` is already written as a routing trigger ("Need code (one ticket)", "Need tests", "Need business acceptance"). Zero new authoring, zero drift — editing the role updates the adapter.
- **Platform fact to respect:** from Claude Code v2.1.208, a subagent whose `tools` entries resolve to no real tool **refuses to launch** with an error naming the entries. A wrong or empty capability mapping therefore fails loudly rather than silently.

### orchestrator.md Trim (SPAWN-06)

**Finding that reframes this requirement:** the spawn instruction already exists at `orchestrator.md` Responsibility 4 — *"on Claude Code spawn role-agents via the `Agent` tool up to `queue.wip_limit` concurrent WIDTH; on the four other CLIs drain the queue concurrency-1"*. Under D-04 that becomes host-keyed → capability-keyed, an edit of roughly equal length rather than a new block. **The 16-name allowlist never enters this file at all** — it is generated into adapter frontmatter. So the bytes needed for "spawn text" are ≈ 0.

- **D-13:** Trim `orchestrator.md` to **below the WARN tier (7165B)**, ~400B. — Rationale: WARN is already breached at 7562B, so the two-tier guard has effectively collapsed to a single FAIL tier with 8 bytes of room. The ceiling is **never raised** (milestone Out-of-Scope).
- **D-14:** Bytes come from **prose tightening in place** — no relocation, no new files, no invented ceilings. This also stays clear of Phase 29's LANG-05 de-dup targets (`## One job` / caveman block / `## Responsibilities`), which must not be front-run.
- **D-15:** **Relocation trap, recorded so no later phase falls into it:** `_role-switch-protocol.md` is **not** in `ROLE_FILES` and has **no byte ceiling**. Extracting text there would shrink `orchestrator.md` by moving bytes somewhere nothing measures them — constraint-gaming, the same shape as the defects this milestone fixes. **If any text is relocated in this phase, the destination enters `ROLE_FILES` (or an equivalent guarded set) with its own FAIL/WARN in the same commit.**
- Context for the planner: `### Routing matrix` is 1188B of the 7562B (reference data, not instruction); `orchestrator.md` is 1.5× the next-largest role (`security-nfr.md`, 4993B).

### Derivation Reach (KIT-01, KIT-02)

Area 2's decision makes this **mandatory, not optional**: materializing 17 adapters means the installer needs the set, and an uninstall that does not mirror it leaves orphans.

Full inventory of enumerating literals found in the tree:

| Literal | Where | Size | Named in KIT-02? |
|---|---|---|---|
| `WR05_SCAN` | `scripts/check-foundation-guards.ts:135` | 4 | yes |
| `ADAPTERS` | `scripts/check-foundation-guards.ts:244` | 2 | yes |
| `CTX_WORKFLOWS` | `scripts/check-foundation-guards.ts:593` | 16 of 19 | yes |
| `ROLE_FILES` | `scripts/check-foundation-guards.ts:282` | 17 | no |
| `WORKFLOWS` / `ROLES` | `scripts/validate-agent-factory.ts:118,144` | 14 / 16 | yes |
| `SCAN` / `GH_SCAN` | `scripts/check-kit-refs.ts:45,61` | ~45–55 / 3 | no |
| `SKILLS` / `AGENT_REL` | `install/install.ts:480,490` (+ uninstall mirror) | 7 / 1 | no |
| `MARKER_SITES` | `scripts/check-kit-refs.ts:70` | 3 | no — **added 2026-07-28, see D-27** |
| `roleCeiling()` | `scripts/check-foundation-guards.ts:486` | 17 cases | no |

- **D-16:** Phase 27 re-points **every enumerating literal except `roleCeiling()`** — i.e. the four KIT-02 sets plus `ROLE_FILES`, `check-kit-refs`'s `SCAN`/`GH_SCAN`, and `install.ts`/`uninstall.ts`. Matches success criterion 1's "no stale literal survives."
- **D-17:** **`roleCeiling()` is deliberately left alone and this is recorded so a later phase does not "fix" it.** It is a per-file *measurement baseline*, not a discovery set, and it already **fails closed** on an unknown role (`"has no documented ceiling (unknown role — update role_ceiling)"`). Under KIT-01 that behavior gets *better*: adding role #18 fails red and forces a deliberate ceiling decision. It is the one hand-maintained table in the tree that defends itself.
- **D-18:** The installer **self-derives by `readdirSync`** of the source `.claude/agents` and `.claude/skills` and installs what is there; `uninstall.ts` mirrors the same derivation. It does **not** import `scripts/kit-model.ts`. — Rationale: keeps the deliberately self-contained single-file installer decoupled from the `scripts/` layout and avoids a manifest artifact needing its own freshness gate. Separation of duty: the installer faithfully installs whatever exists; `kit-model` + the KIT-03 oracle guarantee at CI time that what exists is correct.
- **D-28 (ADDED 2026-07-30 — user decision, gap-closure round 3; AMENDS D-18):** The `install.ts` / `uninstall.ts` derivation pair is **collapsed into one shared module inside `install/`** that both import. It still does **not** import `scripts/kit-model.ts` — D-18's actual rationale is decoupling the installer from the `scripts/` layout, and a shared file *inside* `install/` preserves that in full while deleting the duplicate. — Rationale: the "declared byte-identical pair" (inventory entries #9/#10) has now drifted **twice inside phase 27** — round 1 re-synced it, then 27-22 re-broke it by moving only `install.ts` onto `statSync` (CR-02: a symlinked source adapter is installed and never removed, `== uninstall complete ==`, exit 0). Hand-synced duplicates of one predicate are the exact drift class KIT-02 exists to delete, and this repo's own terminal lesson is that the fix is **structural** — one authority per predicate — never another hand-sync plus a promise. D-18's separation-of-duty half is unchanged: the installer still faithfully installs whatever exists, and `kit-model` + the KIT-03 oracle still guarantee at CI time that what exists is correct.
- **D-29 (ADDED 2026-07-30 — user decision, gap-closure round 3):** `scripts/kit-model.ts`'s `walkFilesRelative()` symlink-**cycle** hang (recorded in `deferred-items.md` under "From 27-22 (WR-02)") is **in scope for round 3**, fixed together with CR-03's cycle-guard defect in `install.ts`. — Rationale: they are the same predicate — "have I already walked this real path?" — and CR-03 proves that answering it in two places produces two different wrong answers (`install.ts` has a guard whose *global* visited set drops a legitimate distinct-relative-path member; `kit-model.ts` has no guard at all and recurses without bound). One coherent treatment, not two half-guards. The reason 27-22 deferred it — editing the shared authority mid-phase would have put 27-18/27-19/27-20/27-23 at risk — no longer applies: all 23 plans are executed.
- **D-27 (ADDED 2026-07-28 — user decision, resolves RESEARCH.md Open Question 6):** `MARKER_SITES` (`scripts/check-kit-refs.ts:70`, the inventory's missed literal #11) is **in scope for Phase 27, in the same wave as the other derived sets**. D-06/D-08 make it stale by 15 entries the moment the 17 adapters land. — Rationale: leaving it hand-maintained ships a fresh instance of the exact defect this milestone exists to kill — a set literal that rots while the suite stays green. Cost is small; the alternative is a known-stale hand-listed set inside the very phase whose purpose is deleting those. It is derived from `kit-model` like `WR05_SCAN` / `ADAPTERS` / `CTX_WORKFLOWS`, and gets the same per-consumer derivation assertion D-19 requires.
- **D-19:** Proof that no stale literal survived is a **recorded inventory + per-consumer assertion** — the table above becomes a committed record, and each consumer gets a test asserting its set comes from `kit-model`. Explicitly *not* a grep-based "literal detector" guard, which would itself be a heuristic that can be a strict subset — the pattern the closure doctrine warns about.

### Asserted-Count Semantics (KIT-01)

The count defends against **vacuity**, not against additions. Two distinct failure modes: (a) a file is added and a consumer misses it — derivation alone fixes this; (b) the set comes back **empty or short** (bad cwd, wrong root, kit not installed, a glob that stopped matching) — then every derived set is empty and every guard **vacuously passes**, which looks green. A literal `17` in `kit-model.ts` is therefore **not** the drift class being deleted: the drift class is a list of *names consumers read as truth*; a count is a number that can only fail closed.

- **D-20:** The count is **exact in both directions** — 17 roles, 19 workflows. Adding role #18 fails red and forces the author to walk the derived consumers, which is precisely the review moment wanted.
- **D-21:** Enforcement is **two-tier by severity**: `kit-model` **throws** on vacuity (empty / below floor — unsafe to continue), and a **guard fails red** on exact-count mismatch (safe to continue, CI red). Not test-only — a consumer running against an empty dir at runtime must not pass silently.
- **D-22:** `kit-model` takes an **explicit root argument** — `listRoles(kitRoot)` / `listWorkflows(kitRoot)` — defaulting to the script-relative repo root. Each consumer passes the root it already resolved. — Rationale: the tree already has **three** root conventions (`validate-agent-factory.ts` is genuinely two-root with `VALIDATE_ROOT` + `VALIDATE_KIT_ROOT` from the v1.1 work; `check-foundation-guards.ts` and `check-kit-refs.ts` use `CHECK_ROOT`). `kit-model` must not invent a fourth env var.
- **Derivation rules** (already proved correct at `scripts/generate-catalog.ts:110-112,154-156`): roles = `readdirSync(agent-factory/roles)` dropping `_`-prefixed files (so `_role-switch-protocol.md`, `kind: protocol`, is excluded → 17); workflows = `/^\d{2}-.+\.md$/` → 19.

### guard_adapter_body Vocabulary (SPAWN-05)

**A conflation in the requirement's wording, resolved here.** The surviving line at `.claude/agents/grugops-orchestrator.md:25` reads *"— one window, drop prior context, the handoff is the only memory — demand a handoff packet from each"*. Two things are wrong there and **only one is banned**:

- `handoff packet` / `the handoff is the only memory` — **dead vocabulary.** Phase 24 deleted all 17 handoff templates; the shared verified context replaced them.
- `one window, drop prior context` — **still correct.** It describes *execution topology*, not memory: on the four non-spawning CLIs roles activate one at a time in one window. It is verbatim in the packaging template, and D-02 just made it the Claude Code degrade path too. A guard banning "single-window" prose would fail red on text deliberately kept.

- **D-23:** `guard_adapter_body` checks **both directions**: it bans the dead handoff vocabulary **and** asserts every adapter body names the shared verified context as its memory. — Rationale: the positive half catches an adapter gone stale by *omission* and does not depend on having guessed every dead phrase.
- **D-24:** The dead-vocabulary list is **one shared exported source** (path forms + prose forms) consumed by both `check-kit-refs` Assertion 2 and `guard_adapter_body` — one place says "this vocabulary is dead." Note the two checks are genuinely different predicates (Assertion 2 greps the **path** `agent-factory/handoffs/`; line 25 contains no path), so a second check is justified — a second *list* is not.
- **D-25:** Scan set = the **derived adapters (17 agents + 7 skills) plus `agent-factory/packaging/subagent.frontmatter.md`**. The template is the upstream source, so a regression there is caught before it propagates through the generator.
- **D-26:** This guard is **defense in depth, never the structural fix** (the requirement's own framing). Once the orchestrator adapter is generated from the template, line 25 dies structurally — the template already says "the shared verified context is the only memory" and "require published notes." The guard exists to catch hand-edits and template regressions.

### Claude's Discretion

- Exactly which sentences in `orchestrator.md` are tightened to reach 7165B (D-13/D-14 set the target and the method; the specific edits are the implementer's, subject to not touching Phase 29's de-dup targets).
- The concrete `capabilities:` vocabulary and its per-role assignment (D-11 sets the mechanism and the single-source location).
- The generator's template mechanics and file layout, provided output is a thin pointer and byte-gated.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope & requirements
- `.planning/REQUIREMENTS.md` — v2.1 requirements; KIT-01..03 and SPAWN-01..07 are this phase. Also the ratified milestone decisions (Claude Code floor v2.1.219+, scope 46 requirements, honesty floor).
- `.planning/ROADMAP.md` § "Phase 27: Spawn Correctness & Kit-Set Authority" — goal, 5 success criteria, the load-bearing intra-phase ordering, and the standing-obligations table (obligation #3 = the `orchestrator.md` trim).

### Research (this phase carries a `--research-phase` flag)
- `.planning/research/SUMMARY.md` — the cross-cutting "hand-maintained set literals drift silently green" finding; the derive-the-set doctrine; Phase-27 deliverable list.
- `.planning/research/STACK.md` §"Findings that bear directly on the v2.1 spawn defect" — finding ① (`Agent(...)` allowlists ignored inside a subagent definition, and what that means for `guard_wr05`), ② (the depth table: v2.1.172–216 = 5, **217–218 = 1 / silently off**, 219+ = 3; `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), ③ (`coordinator: true` is not a supported CC field — grugops-internal marker only), ④ (background subagents strip most built-ins since v2.1.198; every tool the roles need survives), ⑤ (`AskUserQuestion` removed from every subagent), ⑥ (plugin subagents ignore `hooks`/`mcpServers`/`permissionMode`). Also the v2.1.208 "tools resolve to nothing → refuses to launch" fact.
- `.planning/research/ARCHITECTURE.md` — the `kit-model.ts` / `generate-role-adapters.ts` / `adapters-freshness.ts` seam map and line-precise consumer list. **`:515` is explicitly overridden by D-06 — read D-06 before following its "plain copies" recommendation.**
- `.planning/research/PITFALLS.md` — P-01 (a spawn guard sharing the bug's blind spot); "every new gate reports what it checked, not just PASS."

### Kit substrate this phase edits
- `AGENTS.md` § "Kit vs state" (`:27-36`) — the kit-root resolution rule and the STOP-do-not-hunt requirement that forces D-06.
- `agent-factory/packaging/subagent.frontmatter.md` — the adapter template the generator must be built from; already documents the main-thread-vs-subagent allowlist behavior and the coordinator shape.
- `agent-factory/roles/orchestrator.md` — 7562B; Responsibility 4 (`:44`) holds the existing spawn/degrade sentence to be made capability-keyed; `### Routing matrix` (`:53-64`) is 1188B.
- `agent-factory/roles/_role-switch-protocol.md` — the sequential activation path `/grug` degrades to. **Not in `ROLE_FILES`, no byte ceiling** (see D-15).
- `.claude/agents/grugops-orchestrator.md` — the single existing adapter; `:5` is the 7-name grant with 0 resolving files; `:25` is the surviving handoff prose.
- `.claude/skills/grugops/SKILL.md` — `allowed-tools` lacks `Agent` (the third stacked cause).

### Tooling this phase re-points
- `scripts/check-foundation-guards.ts` — `WR05_SCAN` `:135`, `ADAPTERS` `:244`, `ROLE_FILES` `:282`, `roleCeiling()` `:486` (leave alone — D-17), `guardRoleSize()` `:530`, `CTX_WORKFLOWS` `:593`. Root convention: `CHECK_ROOT` `:70`.
- `scripts/validate-agent-factory.ts` — frozen `WORKFLOWS` `:118` (14, should be 19) and `ROLES` `:144` (16, missing `frontend-ui`). Two-root convention: `VALIDATE_ROOT` `:59` / `VALIDATE_KIT_ROOT` `:68`.
- `scripts/check-kit-refs.ts` — `SCAN` `:45`, `GH_SCAN` `:61`, Assertion 2 (`agent-factory/handoffs/` → zero) `:155-168`, Assertion 3 (`$GRUGOPS_HOME` sites) `:178-189`.
- `install/install.ts` — `SKILLS` `:480`, `AGENT_REL` `:490`, `materializeAdapter()` `:969-1016`, call site `:1288-1301` (currently 2 materialized resolvers + 6 plain skill copies). `install/uninstall.ts` must mirror.
- `scripts/generate-catalog.ts:110-112,154-156` — the role/workflow derivation rules already proved correct; `kit-model` generalizes these.
- `scripts/catalog-freshness.ts`, `scripts/context-freshness.ts` — the byte-freshness pattern `adapters-freshness.ts` mirrors (SPAWN-02). Per the D-07 precedent, a domain freshness check is **standalone**, never folded into the aggregator.

### Project constraints
- `CLAUDE.md` § Constraints — single-source (adapters are thin pointers, never copies); installers idempotent/additive/dry-run/reversible; no fabrication; zero runtime dependencies on host machines. **Note: `CLAUDE.md` still describes handoff packets and a routing Orchestrator — that drift is AUDIT-02 in Phase 28, not this phase.**

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`generate-catalog.ts:110-112,154-156`** — the exact readdir + `_`-prefix-drop + `/^\d{2}-.+\.md$/` rules `kit-model.ts` generalizes. Do not re-derive them; lift them.
- **`catalog-freshness.ts` / `context-freshness.ts` / `trace-freshness.ts` / `now-running-freshness.ts`** — four existing regenerate-to-temp + byte-compare gates. `adapters-freshness.ts` (SPAWN-02) is a fifth instance of a proven pattern, kept standalone per the D-07 precedent.
- **`agent-factory/packaging/subagent.frontmatter.md`** — a copy-ready adapter template that already carries the correct v2.0 memory wording, the coordinator shape, and the main-thread caveat. The generator should be built from this, not from the drifted live adapter.
- **Role frontmatter (`kind:`, `tier:`)** — an existing structured-field convention, so adding `capabilities:` (D-11) follows precedent rather than inventing one.
- **`## One job` + `## Activates when`** — present in all 17 roles, already phrased as routing triggers. Free `description` source (D-12).
- **`materializeAdapter()` (`install.ts:969`)** — strip-then-inject, content-idempotent, with bounded removal on an unterminated block. Extends from 2 to 17 call sites without redesign.
- **`stripFencedBlocks()` / `matchesOutsideFences()` (`check-foundation-guards.ts:~155-180`)** — fence-aware scanning so documentation examples are never read as live frontmatter. Reuse for `guard_adapter_body`; do not write a second fence parser.

### Established Patterns
- **Fail-closed everywhere.** `CR-01 missing-file fail-red` recurs across the guards (a deleted adapter/AGENTS.md fails red rather than vacuously passing). D-21's two-tier count enforcement follows it.
- **One authority per predicate.** The v2.0 closure doctrine. It drives D-24 (one dead-vocabulary source), D-22 (no fourth root convention), and D-19's rejection of a second detector.
- **Byte ceilings are locked from a measured baseline and never raised** — trim or split instead (`guard_role_size` comment at `:479-484`; milestone Out-of-Scope).
- **Explicit scan sets, never repo-wide greps** (`check-kit-refs.ts:6`, D-13 token economy). Derivation replaces the *literal*, not the *scoping discipline* — a derived set is still a bounded set.
- **Guards report what they checked**, not just PASS (`PITFALLS.md:591`) — `compared 17 adapters, 0 drift`, so a count of zero is visible as the anomaly it is.

### Integration Points
- `kit-model.ts` → `check-foundation-guards.ts`, `validate-agent-factory.ts`, `check-kit-refs.ts`, `generate-catalog.ts`, `generate-role-adapters.ts` (new). Each passes its own already-resolved root (D-22).
- `generate-role-adapters.ts` → `.claude/agents/grugops-<role>.md` × 17, gated by `adapters-freshness.ts`.
- `install.ts` / `uninstall.ts` → self-derive by readdir of the source adapter/skill dirs (D-18); `materializeAdapter()` now runs over all 17 (D-06).
- `guard_wr05` → asserts the degrade path + non-coordinator `Agent` absence (D-05), over the now-derived `WR05_SCAN`.
- KIT-03 oracle → set equality across grant / adapter dir / role corpus (D-09), and must fail RED against the tree state recorded in `<domain>` before it is trusted.

</code_context>

<specifics>
## Specific Ideas

- The user pushed back on the guard-vocabulary framing mid-discussion — *"Didn't we steer away from handoffs and have unified memory?"* — which surfaced the conflation in SPAWN-05's "handoff/single-window prose" wording and produced D-23's both-directions shape. **Handoffs are gone and the shared verified context is the sole memory; nothing in this phase reopens that.** The guard exists only to keep a v2.0 deletion deleted.
- Repeated preference across every area for the structural option over the convenient one: derive rather than list, one authority rather than two, fail closed rather than fail quiet, and refuse mechanisms that are green in the file but false at runtime.
- Explicit distaste for constraint-gaming — the relocation trap (D-15) was flagged and closed rather than used.

</specifics>

<deferred>
## Deferred Ideas

- **Plugin-form adapters** — whether the 17 adapters also ship in the `.claude-plugin/` form. Plugin agents ignore `hooks`/`mcpServers`/`permissionMode` (research finding ⑥) and the plugin cache does not copy files outside the plugin dir, so kit resolution differs there. Raised, not selected for discussion. Candidate for Phase 28's audit or a later packaging pass.
- **KIT-03 RED-evidence methodology** — how the fail-red-on-today's-tree proof is *recorded* when the same phase turns it green. The same methodology question LANG-06 has in Phase 29 ("fails RED on all 17 blocks as acceptance evidence before the rewrite lands"). Worth settling once, in whichever phase reaches it first.
- **SPAWN-07 blast radius** — enumerating every surface that advertises the Claude Code floor plus the `queue.wip_limit` rationale currently written against depth 5. In scope for this phase as a requirement; the *inventory* of surfaces was not walked during discussion.
- **`CLAUDE.md` v2.0 drift** (handoff packets, routing Orchestrator) — belongs to AUDIT-02 in Phase 28. Do not fix it here.
- **`agent-factory/handoffs/.gitkeep` deletion** — standing obligation #5, dispositioned under AUDIT-01 in Phase 28.
- **`roleCeiling()` re-baselining** — Phase 29 (LANG-08) re-baselines byte ceilings exactly once at end of phase. Phase 27 does not touch ceiling *values*, only trims below an existing one.

</deferred>

---

## Open Questions for Research

Flagged deliberately rather than guessed. The phase is planned with `--research-phase`.

1. **`UNKNOWN - verify`: is a skill's `allowed-tools: Agent(a, b, c)` honored as a scoped grant in the main thread?** If yes, `/grug` gains full parallel capability and D-02's degrade becomes a fallback rather than the norm. If no, D-02 stands as the primary `/grug` behavior. Do not assume either way — this decides how the brand's headline entry behaves.
2. **Main-thread coordinator wiring validated against the real installed flow.** ROADMAP flags this as a genuine platform-schema integration point grugops has not used before. D-01 removes the installer from the equation, but the `claude --agent` path still needs verification against a materialized adapter (does `--agent` resolve a project `.claude/agents/` entry carrying an injected `KIT=` block correctly?).
3. **Materializing 17 resolvers vs `check-kit-refs` Assertion 3.** D-07 sets the direction (derived predicate); the researcher should confirm no other assertion or test pins the "exactly three `$GRUGOPS_HOME` sites" count.
4. **Claude Code depth/width caps against the grant.** Depth 3 on v2.1.219+ (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), 200 subagents/session, 20 concurrent. grugops's width cap of 3 sits inside all three — confirm and correct the `queue.wip_limit` rationale text (SPAWN-07).

---

*Phase: 27-Spawn Correctness & Kit-Set Authority*
*Context gathered: 2026-07-28*
