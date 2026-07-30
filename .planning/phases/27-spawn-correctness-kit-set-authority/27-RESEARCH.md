# Phase 27: Spawn Correctness & Kit-Set Authority - Research

**Researched:** 2026-07-28
**Domain:** Claude Code agent/skill platform schema + TypeScript set-derivation refactor of grugops's own tooling layer
**Confidence:** HIGH (every platform claim verified verbatim against `code.claude.com/docs/en/*` this session; every tree claim verified by reading the file)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Coordinator Entry & Main-Thread Wiring (SPAWN-03, SPAWN-04)**

> **Third stacked cause found during discussion, not in the roadmap text:** `.claude/skills/grugops/SKILL.md`'s `allowed-tools` is `Read, Write, Bash, Glob, Grep` — **no `Agent`**. So `/grug`, the brand's headline entry ("a user types `/grug`"), runs in the main thread and *structurally cannot spawn* even once the adapters exist. Any fix that only works via `claude --agent` repairs the mechanism and breaks the brand promise.

- **D-01:** The installer writes **no** main-thread wiring into the target repo. No `.claude/settings.json` `{"agent": ...}`, not even sentinel-wrapped. `claude --agent grugops-orchestrator` is documented as the full-capability path. — Rationale: writing it would make *every* Claude session in that repo the grugops coordinator, including sessions where the user just wants to edit a README; `settings.json` is user content and the installer is bound to "additive, never overwrite."
- **D-02:** When the coordinator is **not** the main thread, `/grug` **loudly degrades to the existing sequential single-window path** — the same path Codex/Gemini/OpenCode/Copilot already run, which v2.0's dual-path equivalence oracle already proved converges on identical on-disk artifacts. It is an existing mode announced correctly, not a new mode. — **Reversibility:** costly — the degrade path becomes the documented `/grug` contract and the thing `guard_wr05` asserts; changing it later means re-cutting the guard, the coordinator body, and the user-facing docs together.
- **D-03:** **Never spawn under an allowlist the runtime is ignoring.** A green file with a false runtime is the exact failure class this milestone exists to kill (research finding ①: a parenthesized `Agent(a, b, c)` list evaporates on the subagent path).
- **D-04:** Detection is **capability-sensing, not version-sensing**: if the `Agent` tool is not available to the coordinator, it runs sequential and says so. This satisfies the milestone decision that *no runtime version-detection code is required*, and it is the same signal on all five host CLIs.
- **D-05:** `guard_wr05` asserts **degrade-path presence** — the coordinator body carries the not-main-thread check — plus SPAWN-04 (no `Agent` on any non-coordinator adapter). Both mechanisms hold on the subagent **and** main-thread paths, so no wiring artifact needs to exist in the user's repo for the guard to be meaningful. It does **not** assert a `settings.json` entry (there is none — see D-01).

> **⚠ RESEARCH CORRECTION — the D-01 premise above is factually wrong.** See `## The One Premise That Did Not Survive Verification`. D-01's *decision* (installer writes no wiring) survives on its own rationale. D-02's *trigger condition* does not. The planner must resolve this before writing tasks.

**Kit-Root Resolution for Spawned Roles (SPAWN-01)**

> **This decision deliberately overrides `.planning/research/ARCHITECTURE.md:515`**, which recommends the 17 role adapters be *plain copies* "because they cite repo-relative paths and the orchestrator already resolved the kit." That is wrong on the spawn path: in an installed repo `agent-factory/` does not exist (the kit lives at `${GRUGOPS_HOME:-$HOME/.grugops}`), a spawned subagent is a fresh context holding only its own adapter body, and `AGENTS.md:34` says the correct behavior on an unresolved kit is **STOP — do not hunt**.

- **D-06:** **All 17 adapters are self-sufficient resolvers.** Each generated adapter carries the resolver block; the installer materializes the absolute `KIT=` into all of them (not just the current two). — Rationale: making a spawned session's ability to find the kit depend on text the spawner remembered to include is "the handoff is the only memory," the pattern v2.0 deleted; it also silently breaks direct `@grugops-<role>` invocation. — **Reversibility:** costly — undoing it means re-cutting the generator template, the installer's materialization loop, `check-kit-refs` Assertion 3, and the uninstall mirror together.
- **D-07:** `check-kit-refs.ts` Assertion 3 is restated as a **derived predicate** — "`$GRUGOPS_HOME` appears only in generator-produced adapters + the packaging template" — never a literal widened from 3 named sites to 18. Consistent with KIT-02.
- **D-08:** A generated role adapter body carries exactly: the kit-vs-state blockquote, the resolver block, "read `agent-factory/roles/<role>.md` and act as that role," and the echoed hard limit (never merge a protected branch / never deploy to prod). **Nothing role-specific** — the role file does the thinking. The factory read order (`factory.config.json`, `AGENTS.md`, `plans/board.md`) is *not* duplicated into 17 adapters.

**Spawn Set & Adapter Shape (SPAWN-01, KIT-03)**

- **D-09:** `adapters = 17 roles`; `grant = adapters − coordinator = 16`. KIT-03 asserts `grant ∪ {coordinator} == adapters == roles`. No exception list anywhere.
- **D-10:** The `tier: enterprise` roles are **in** the grant. **Grant is capability; the config dial is policy.** Filtering at the grant level would put policy in the capability layer and mean a `factory.config.json` change cannot reach a role the runtime already refused.
- **D-11:** Each adapter's `tools:` derives from a **neutral `capabilities:` key added to role frontmatter** (roles already carry `kind:` / `tier:`), which the generator maps to Claude Code tool names. — Rationale: a per-role map inside the generator is the drift class this phase kills; Claude-Code tool names inside portable role text is a portability smell, since role files serve all five host CLIs. — **Reversibility:** costly — the capability vocabulary becomes kit content read by the generator; changing it later touches all 17 role files plus the generator's mapping table.
- **D-12:** Each adapter's `description` (the auto-routing trigger) derives from the role's existing **`## One job` + `## Activates when`** sections. Both already exist in all 17 roles and `## Activates when` is already written as a routing trigger ("Need code (one ticket)", "Need tests", "Need business acceptance"). Zero new authoring, zero drift — editing the role updates the adapter.
- **Platform fact to respect:** from Claude Code v2.1.208, a subagent whose `tools` entries resolve to no real tool **refuses to launch** with an error naming the entries. A wrong or empty capability mapping therefore fails loudly rather than silently.

**orchestrator.md Trim (SPAWN-06)**

> **Finding that reframes this requirement:** the spawn instruction already exists at `orchestrator.md` Responsibility 4 — *"on Claude Code spawn role-agents via the `Agent` tool up to `queue.wip_limit` concurrent WIDTH; on the four other CLIs drain the queue concurrency-1"*. Under D-04 that becomes host-keyed → capability-keyed, an edit of roughly equal length rather than a new block. **The 16-name allowlist never enters this file at all** — it is generated into adapter frontmatter. So the bytes needed for "spawn text" are ≈ 0.

- **D-13:** Trim `orchestrator.md` to **below the WARN tier (7165B)**, ~400B. — Rationale: WARN is already breached at 7562B, so the two-tier guard has effectively collapsed to a single FAIL tier with 8 bytes of room. The ceiling is **never raised** (milestone Out-of-Scope).
- **D-14:** Bytes come from **prose tightening in place** — no relocation, no new files, no invented ceilings. This also stays clear of Phase 29's LANG-05 de-dup targets (`## One job` / caveman block / `## Responsibilities`), which must not be front-run.
- **D-15:** **Relocation trap, recorded so no later phase falls into it:** `_role-switch-protocol.md` is **not** in `ROLE_FILES` and has **no byte ceiling**. Extracting text there would shrink `orchestrator.md` by moving bytes somewhere nothing measures them — constraint-gaming, the same shape as the defects this milestone fixes. **If any text is relocated in this phase, the destination enters `ROLE_FILES` (or an equivalent guarded set) with its own FAIL/WARN in the same commit.**
- Context for the planner: `### Routing matrix` is 1188B of the 7562B (reference data, not instruction); `orchestrator.md` is 1.5× the next-largest role (`security-nfr.md`, 4993B).

**Derivation Reach (KIT-01, KIT-02)**

> Area 2's decision makes this **mandatory, not optional**: materializing 17 adapters means the installer needs the set, and an uninstall that does not mirror it leaves orphans.

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
| `roleCeiling()` | `scripts/check-foundation-guards.ts:486` | 17 cases | no |

- **D-16:** Phase 27 re-points **every enumerating literal except `roleCeiling()`** — i.e. the four KIT-02 sets plus `ROLE_FILES`, `check-kit-refs`'s `SCAN`/`GH_SCAN`, and `install.ts`/`uninstall.ts`. Matches success criterion 1's "no stale literal survives."
- **D-17:** **`roleCeiling()` is deliberately left alone and this is recorded so a later phase does not "fix" it.** It is a per-file *measurement baseline*, not a discovery set, and it already **fails closed** on an unknown role (`"has no documented ceiling (unknown role — update role_ceiling)"`). Under KIT-01 that behavior gets *better*: adding role #18 fails red and forces a deliberate ceiling decision. It is the one hand-maintained table in the tree that defends itself.
- **D-18:** The installer **self-derives by `readdirSync`** of the source `.claude/agents` and `.claude/skills` and installs what is there; `uninstall.ts` mirrors the same derivation. It does **not** import `scripts/kit-model.ts`. — Rationale: keeps the deliberately self-contained single-file installer decoupled from the `scripts/` layout and avoids a manifest artifact needing its own freshness gate. Separation of duty: the installer faithfully installs whatever exists; `kit-model` + the KIT-03 oracle guarantee at CI time that what exists is correct.
- **D-19:** Proof that no stale literal survived is a **recorded inventory + per-consumer assertion** — the table above becomes a committed record, and each consumer gets a test asserting its set comes from `kit-model`. Explicitly *not* a grep-based "literal detector" guard, which would itself be a heuristic that can be a strict subset — the pattern the closure doctrine warns about.

**Asserted-Count Semantics (KIT-01)**

> The count defends against **vacuity**, not against additions. Two distinct failure modes: (a) a file is added and a consumer misses it — derivation alone fixes this; (b) the set comes back **empty or short** (bad cwd, wrong root, kit not installed, a glob that stopped matching) — then every derived set is empty and every guard **vacuously passes**, which looks green. A literal `17` in `kit-model.ts` is therefore **not** the drift class being deleted: the drift class is a list of *names consumers read as truth*; a count is a number that can only fail closed.

- **D-20:** The count is **exact in both directions** — 17 roles, 19 workflows. Adding role #18 fails red and forces the author to walk the derived consumers, which is precisely the review moment wanted.
- **D-21:** Enforcement is **two-tier by severity**: `kit-model` **throws** on vacuity (empty / below floor — unsafe to continue), and a **guard fails red** on exact-count mismatch (safe to continue, CI red). Not test-only — a consumer running against an empty dir at runtime must not pass silently.
- **D-22:** `kit-model` takes an **explicit root argument** — `listRoles(kitRoot)` / `listWorkflows(kitRoot)` — defaulting to the script-relative repo root. Each consumer passes the root it already resolved. — Rationale: the tree already has **three** root conventions (`validate-agent-factory.ts` is genuinely two-root with `VALIDATE_ROOT` + `VALIDATE_KIT_ROOT` from the v1.1 work; `check-foundation-guards.ts` and `check-kit-refs.ts` use `CHECK_ROOT`). `kit-model` must not invent a fourth env var.
- **Derivation rules** (already proved correct at `scripts/generate-catalog.ts:110-112,154-156`): roles = `readdirSync(agent-factory/roles)` dropping `_`-prefixed files (so `_role-switch-protocol.md`, `kind: protocol`, is excluded → 17); workflows = `/^\d{2}-.+\.md$/` → 19.

**guard_adapter_body Vocabulary (SPAWN-05)**

> **A conflation in the requirement's wording, resolved here.** The surviving line at `.claude/agents/grugops-orchestrator.md:25` reads *"— one window, drop prior context, the handoff is the only memory — demand a handoff packet from each"*. Two things are wrong there and **only one is banned**:
> - `handoff packet` / `the handoff is the only memory` — **dead vocabulary.** Phase 24 deleted all 17 handoff templates; the shared verified context replaced them.
> - `one window, drop prior context` — **still correct.** It describes *execution topology*, not memory: on the four non-spawning CLIs roles activate one at a time in one window. It is verbatim in the packaging template, and D-02 just made it the Claude Code degrade path too. A guard banning "single-window" prose would fail red on text deliberately kept.

- **D-23:** `guard_adapter_body` checks **both directions**: it bans the dead handoff vocabulary **and** asserts every adapter body names the shared verified context as its memory. — Rationale: the positive half catches an adapter gone stale by *omission* and does not depend on having guessed every dead phrase.
- **D-24:** The dead-vocabulary list is **one shared exported source** (path forms + prose forms) consumed by both `check-kit-refs` Assertion 2 and `guard_adapter_body` — one place says "this vocabulary is dead." Note the two checks are genuinely different predicates (Assertion 2 greps the **path** `agent-factory/handoffs/`; line 25 contains no path), so a second check is justified — a second *list* is not.
- **D-25:** Scan set = the **derived adapters (17 agents + 7 skills) plus `agent-factory/packaging/subagent.frontmatter.md`**. The template is the upstream source, so a regression there is caught before it propagates through the generator.
- **D-26:** This guard is **defense in depth, never the structural fix** (the requirement's own framing). Once the orchestrator adapter is generated from the template, line 25 dies structurally — the template already says "the shared verified context is the only memory" and "require published notes." The guard exists to catch hand-edits and template regressions.

### Claude's Discretion

- Exactly which sentences in `orchestrator.md` are tightened to reach 7165B (D-13/D-14 set the target and the method; the specific edits are the implementer's, subject to not touching Phase 29's de-dup targets).
- The concrete `capabilities:` vocabulary and its per-role assignment (D-11 sets the mechanism and the single-source location).
- The generator's template mechanics and file layout, provided output is a thin pointer and byte-gated.

### Deferred Ideas (OUT OF SCOPE)

- **Plugin-form adapters** — whether the 17 adapters also ship in the `.claude-plugin/` form. Plugin agents ignore `hooks`/`mcpServers`/`permissionMode` (research finding ⑥) and the plugin cache does not copy files outside the plugin dir, so kit resolution differs there. Raised, not selected for discussion. Candidate for Phase 28's audit or a later packaging pass.
- **KIT-03 RED-evidence methodology** — how the fail-red-on-today's-tree proof is *recorded* when the same phase turns it green. The same methodology question LANG-06 has in Phase 29. Worth settling once, in whichever phase reaches it first.
- **SPAWN-07 blast radius** — enumerating every surface that advertises the Claude Code floor plus the `queue.wip_limit` rationale currently written against depth 5. In scope for this phase as a requirement; the *inventory* of surfaces was not walked during discussion. **→ This research walks it; see `## SPAWN-07 Blast-Radius Inventory`.**
- **`CLAUDE.md` v2.0 drift** (handoff packets, routing Orchestrator) — belongs to AUDIT-02 in Phase 28. Do not fix it here.
- **`agent-factory/handoffs/.gitkeep` deletion** — standing obligation #5, dispositioned under AUDIT-01 in Phase 28.
- **`roleCeiling()` re-baselining** — Phase 29 (LANG-08) re-baselines byte ceilings exactly once at end of phase. Phase 27 does not touch ceiling *values*, only trims below an existing one.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KIT-01 | `scripts/kit-model.ts` is the sole authority for "what roles and workflows exist," derived via `readdirSync` with an asserted count | Derivation rules verified working at `generate-catalog.ts:110-112,154-156`; counts re-measured live this session (17 roles / 19 workflows). See `## Architecture Patterns → Pattern 1`. |
| KIT-02 | Every guard/validator scan set derived from `kit-model.ts` | Full consumer inventory re-verified line-by-line, **plus 3 literals the CONTEXT.md inventory missed** — see `## The Set-Literal Inventory, Corrected`. |
| KIT-03 | Referential-integrity oracle asserting grant == adapters == roles, failing RED against today's tree | Today's tree baseline **measured live**: guards report `ALL CHECKS PASSED` with 1 adapter / 7 granted names / 17 roles. See `## Verified Baseline`. |
| SPAWN-01 | 17 adapters at `.claude/agents/grugops-<role>.md`, generated as thin pointers | `materializeAdapter()` read in full; template read in full; frontmatter schema verified against live docs. See `## Code Examples`. |
| SPAWN-02 | `adapters-freshness.ts` byte-gates generated adapters, fail-closed | `catalog-freshness.ts` mirror-spawn pattern read in full and is directly reusable — with one path-traversal caveat, see `## Pitfall 6`. |
| SPAWN-03 | Coordinator wired as Claude Code **main-thread** agent so `Agent(<allowlist>)` is honoured | **VERIFIED verbatim**: `--agent` flag and `.claude/settings.json` `"agent"` key both documented; allowlist honoured only on that path. See `## Platform Contract`. |
| SPAWN-04 | Non-coordinator adapters omit `Agent` entirely | **VERIFIED verbatim** as the *documented* path-independent mechanism. See `## Platform Contract → Finding B`. |
| SPAWN-05 | `guard_adapter_body` fails red on dead handoff prose | Surviving line confirmed at `.claude/agents/grugops-orchestrator.md:25`. Fence-aware helpers already exist. See `## Don't Hand-Roll`. |
| SPAWN-06 | `orchestrator.md` trimmed below its 7570B FAIL ceiling, ceiling unchanged | Live measurement: **7562B**, WARN 7165B already breached. Trim budget recomputed **upward** because SPAWN-07's own edit adds bytes to this file — see `## Pitfall 1`. |
| SPAWN-07 | Advertised CC floor + `wip_limit` rationale corrected to depth 3 / v2.1.219+ | **VERIFIED verbatim** including the full version-history note. Blast radius walked: **5 surfaces**, one of them inside a byte-ceilinged file and one guarded by an oracle. See `## SPAWN-07 Blast-Radius Inventory`. |
</phase_requirements>

---

## Summary

This phase has almost no external-technology risk and a great deal of *internal-coupling* risk. There are no new packages, no new runtime dependencies, and no new build tooling — `package.json` is unchanged, exactly as the milestone's Out-of-Scope section promises. Every pattern the phase needs (filesystem derivation, mirror-spawn byte freshness, fence-aware scanning, strip-then-inject materialization) already exists in the tree in working, tested form. The work is disciplined re-pointing, not invention.

The platform half of the research resolved cleanly and in grugops's favour. Every claim in `.planning/research/STACK.md`'s findings ①–⑥ was re-verified verbatim against `code.claude.com/docs/en/*` this session and all of them hold: the parenthesized `Agent(a, b, c)` allowlist really is ignored inside a subagent definition; omitting `Agent` from `tools` really is the documented path-independent way to make a role unable to spawn; the depth default really did go 5 → 1 → 3 across v2.1.216 / .217 / .219. The `agent` settings key is a real, documented setting whose description explicitly says it applies the named agent's *tool restrictions*, which is what SPAWN-03 needs. The installed Claude Code on this machine is **v2.1.220** — above the ratified floor — so the phase can be dogfooded against the behaviour it targets.

One premise did **not** survive verification, and it is load-bearing on four locked decisions. CONTEXT.md's "third stacked cause" holds that `/grug` cannot spawn because the skill's `allowed-tools` omits `Agent`. The Claude Code skills documentation states the opposite in plain terms: `allowed-tools` is a *permission pre-approval for one turn*, and "it does not restrict which tools are available: every tool remains callable." `/grug` therefore **can** spawn today — it simply has nothing to spawn, because 16 of the 17 adapter files do not exist. This is good news that changes the shape of D-02: the honest gap on the `/grug` path is not *capability*, it is *allowlist enforcement*. Separately, this research found **three enumerating set literals the CONTEXT.md inventory missed**, one of which is a name collision (`WR05_SCAN` exists in two different files meaning two different things) that will silently break a green oracle if a planner greps for it.

**Primary recommendation:** Keep the phase's locked ordering exactly as written (kit-model + oracle → orchestrator trim → adapters), add a Wave-0 task that re-baselines D-01/D-02/D-05 against the corrected skill-permission fact before any coordinator text is authored, and treat the corrected set-literal inventory in this document — not the CONTEXT.md table — as the KIT-02 work list.

---

## The One Premise That Did Not Survive Verification

This section exists because four locked decisions rest on it. Read it before planning SPAWN-03/04.

**The premise (CONTEXT.md, Coordinator Entry & Main-Thread Wiring):**

> `.claude/skills/grugops/SKILL.md`'s `allowed-tools` is `Read, Write, Bash, Glob, Grep` — **no `Agent`**. So `/grug` … runs in the main thread and *structurally cannot spawn* even once the adapters exist.

**What the platform actually does** `[VERIFIED: code.claude.com/docs/en/skills]` — verbatim:

> The `allowed-tools` field grants permission for the listed tools during the turn that invokes the skill, so Claude can use them without prompting you for approval. The grant clears when you send your next message… **It does not restrict which tools are available: every tool remains callable**, and your permission settings still govern tools that are not listed.

And from the frontmatter reference table, verbatim:

> `allowed-tools` — Tools Claude can use **without asking permission** during the turn that invokes this skill.

The restricting field for skills is `disallowed-tools`, which grugops does not use:

> `disallowed-tools` — Tools **removed from Claude's available pool** while this skill is active.

**Consequences the planner must absorb:**

1. `/grug` today runs in the default main-thread session, which has the `Agent` tool. It **can** spawn. The only reason no role agent ever ran is that 16 of 17 adapter files do not exist and the 7 names in the existing grant resolve to nothing. **SPAWN-01 alone very likely fixes the reported defect on the `/grug` path.**
2. Adding `Agent` to the skill's `allowed-tools` would be a **no-op for capability** (it only pre-approves a permission prompt) — and it would trip `guard_wr05`, which fails any non-`coordinator: true` file carrying a spawn grant (`check-foundation-guards.ts:196`). Do not do it. The correct action on `.claude/skills/grugops/SKILL.md` is **no change**.
3. D-02's trigger condition is wrong as written. The real trichotomy on Claude Code is:

| Entry path | Main thread? | Can spawn? | `Agent(...)` allowlist enforced? |
|---|---|---|---|
| `claude --agent grugops-orchestrator` | yes | yes | **yes** `[VERIFIED]` |
| `/grug` (skill in default session) | yes | **yes** | no — the session's agent is the default agent, which declares no allowlist |
| `@grugops-orchestrator` (subagent) | no | yes, to the depth limit | **no** — "any type list inside the parentheses is ignored" `[VERIFIED]` |

4. D-03 ("never spawn under an allowlist the runtime is ignoring") is aimed at row 3, where a *declared* allowlist is false. Row 2 declares no allowlist at all, so nothing is false there — but nothing is constrained either. That is a **policy** question (is unconstrained spawning acceptable on the `/grug` path?), not the capability question the discussion believed it was answering.
5. D-04's mechanism — capability-sensing for the `Agent` tool — is **still exactly right** and is the correct implementation. Only its expected *outcome* on the `/grug` path flips from "sequential" to "parallel, unconstrained."

**Recommended framing for the planner** (a strictly better fit to the verified facts, and one that keeps every safety property D-02/D-03 were protecting):

> Three tiers, announced honestly. **Full**: `claude --agent grugops-orchestrator` — parallel, allowlist enforced. **Reduced**: `/grug` in a default session — parallel is available and the coordinator uses it, but the enumerated grant is not runtime-enforced, so the coordinator says so and stays inside the grant by instruction. **Degraded**: the `Agent` tool is absent (the four other CLIs, or a subagent at the depth limit) — sequential single-window, announced.

This preserves D-03's spirit precisely: the coordinator never *claims* an enforced allowlist it does not have. It just no longer throws away working parallelism on the brand's headline entry point.

**A fourth option the discussion did not see** `[VERIFIED: code.claude.com/docs/en/skills]`: skills support `context: fork` plus `agent: <name>`, which runs the skill body as a subagent of a chosen agent type. `/grug` could be `context: fork, agent: grugops-orchestrator`. This is **not recommended** — it puts the coordinator on the subagent path where the allowlist is ignored (D-03's exact failure), costs a nesting layer, and a backgrounded fork gets the narrower background tool set. Recorded so a later phase does not "discover" it as an improvement.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| "What roles/workflows exist" | Build tooling (`scripts/kit-model.ts`) | — | Pure filesystem derivation; no runtime, no host, no network. KIT-01's whole point is one authority. |
| Scan-set membership for every guard | Build tooling (guards importing `kit-model`) | — | Guards are CI-time. They must never reach a host machine's runtime. |
| Referential-integrity oracle (KIT-03) | Build tooling (guard aggregator or standalone) | — | Set equality over three filesystem/frontmatter-derived sets. CI-time only. |
| Adapter generation (SPAWN-01) | Build tooling (`scripts/generate-role-adapters.ts`) | Committed artifact (`.claude/agents/*.md`) | Generated at dev time, **committed**, so hosts need no generator. Mirrors `generate-catalog.ts` exactly. |
| Adapter freshness gate (SPAWN-02) | Build tooling (`scripts/adapters-freshness.ts`) | — | Standalone `package.json` script per the D-07 precedent, never folded into the aggregator. |
| Kit-root resolution at spawn time | **Host runtime** (adapter body, materialized by installer) | Installer (`materializeAdapter()`) | The only tier that runs on a user machine. Must work with zero deps and a fresh subagent context. |
| Spawn capability + allowlist | **Claude Code platform** (`tools:` frontmatter + `--agent` / `agent` setting) | Coordinator role prose (instruction-level) | Enforcement is the platform's; grugops can only declare correctly and degrade honestly. |
| Adapter install/uninstall set | Installer (`readdirSync` self-derivation, D-18) | — | Deliberately decoupled from `scripts/` so the single-file installer stays self-contained. |
| Version-floor advertisement (SPAWN-07) | Documentation surfaces (5 files) | Oracle (`oracleWr05Wording`) guards 2 of them | Prose, but two of the five sites are mechanically guarded — see the blast-radius table. |

---

## Verified Baseline

Measured live on 2026-07-28. This is the tree state KIT-03 must **fail RED** against.

| Thing | Claimed in CONTEXT.md | Measured this session | Match |
|---|---|---|---|
| `agent-factory/roles/*.md` minus `_`-prefixed | 17 | **17** | ✅ |
| `agent-factory/workflows/` matching `/^\d{2}-.+\.md$/` | 19 | **19** (`00-` … `18-`) | ✅ |
| `.claude/agents/*.md` | 1 | **1** (`grugops-orchestrator.md`, 1938B) | ✅ |
| Coordinator `Agent(...)` grant names | 7 | **7**, of which **0** resolve to a file | ✅ |
| `agent-factory/roles/orchestrator.md` | 7562B | **7562B** (FAIL 7570 / WARN 7165) | ✅ |
| Handoff prose in an adapter body | 1 live ref | **1** at `.claude/agents/grugops-orchestrator.md:25` | ✅ |
| `.claude/skills/*/SKILL.md` | — | **7** (984B–1568B, all far under the 3072B WARN) | — |
| `node scripts/check-foundation-guards.js` | — | **`ALL CHECKS PASSED`** | ⚠️ |
| Installed Claude Code | floor v2.1.219+ | **v2.1.220** | ✅ above floor |
| Installed Node | `>=22` | **v24.12.0** | ✅ |

The ⚠️ row is the whole phase in one line: the guard suite is fully green against a tree where the headline feature is structurally impossible. `guard_role_size` currently emits 5 WARNs, `orchestrator.md` among them — WARN does not fail the build, which is why 7562B sat 8 bytes from FAIL unnoticed.

**Recommended KIT-03 RED evidence** (settles the deferred methodology question cheaply, for this phase at least): commit the oracle in a Wave-0 plan **with a test that pins its failure** — a Vitest case that plants the *current* tree shape into a `CHECK_ROOT` hermetic mirror (1 adapter, the 7-name grant, 17 roles) and asserts the oracle exits non-zero naming the three set differences. That test stays green forever after the adapters land, because it asserts against a planted fixture rather than the live tree. The RED proof becomes a permanent regression test rather than a screenshot in a document. The hermetic-mirror harness this needs already exists and is used by `check-foundation-guards.test.ts` and `check-uat-oracles.test.ts`.

---

## Platform Contract

Everything in this section is verbatim or directly paraphrased from `code.claude.com/docs/en/*`, fetched 2026-07-28. `docs.claude.com/*` 301-redirects and was not used.

### Finding A — the `Agent(...)` allowlist is main-thread-only `[VERIFIED: code.claude.com/docs/en/sub-agents]`

> "The `Agent(agent_type)` allowlist syntax applies only to an agent running as the main thread with `claude --agent`. In a subagent definition, listing `Agent` in `tools` lets that subagent spawn subagents of its own while the depth limit allows it, but **any type list inside the parentheses is ignored**."

Confirms `.planning/research/STACK.md` finding ① exactly. `guard_wr05`'s current frontmatter-only assertion is true of the file and false of the runtime on the subagent path.

### Finding B — omitting `Agent` is the documented path-independent mechanism `[VERIFIED: code.claude.com/docs/en/sub-agents]`

> "If you omit `Agent` from the `tools` list entirely, the agent can't spawn any subagents with the Agent tool."

and

> "To keep one subagent from spawning while nesting is on, such as a reviewer that should stay read-only, **omit `Agent` from its `tools` list** or add it to `disallowedTools`."

**SPAWN-04's chosen mechanism is the one the vendor documents for exactly this purpose.** This is the strongest single result in this research: the requirement is not a workaround, it is the supported API. It holds identically on the main-thread and subagent paths.

### Finding C — main-thread wiring: two documented entry points `[VERIFIED: code.claude.com/docs/en/sub-agents + /settings]`

CLI flag:

> "Pass `--agent <name>` to start a session where the main thread itself takes on that subagent's system prompt, tool restrictions, and model… The subagent's system prompt replaces the default Claude Code system prompt entirely… `CLAUDE.md` files and project memory still load through the normal message flow. The agent name appears as `@<name>` in the startup header so you can confirm it's active."

Settings key (`.claude/settings.json`), verbatim from the settings table:

> `agent` — "Run the main thread as a named subagent, and set the default agent for sessions dispatched from `claude agents`. Applies that subagent's system prompt, tool restrictions, and model."

The docs show it as a project-scope example (`"To make it the default for every session in a project, set `agent` in `.claude/settings.json`"`), and it is a normal settings key, so it also works in `.claude/settings.local.json` and `~/.claude/settings.json`. Precedence, verbatim: **managed > command-line arguments > `.claude/settings.local.json` > `.claude/settings.json` > `~/.claude/settings.json`**. So `--agent` overrides a settings entry, and managed settings override everything.

**Practical note supporting D-01:** the settings key would make *every* session in that repo the coordinator — exactly the objection D-01 raises. D-01's decision is sound; only its "third stacked cause" premise is not. Also note that `--agent` **persists across `--resume`**, and since v2.1.216 a resumed session whose agent has vanished continues with default tools and a warning rather than failing — which is a graceful, honest degrade grugops gets for free.

**One genuine ambiguity** `[ASSUMED]`: the sub-agents page phrases the allowlist rule as applying to "an agent running as the main thread **with `claude --agent`**", naming only the flag. The settings page says the `agent` key "applies that subagent's… tool restrictions." The two together strongly imply the allowlist is enforced under the settings key as well, but no sentence says so explicitly. **Since D-01 removes the settings key from grugops's install path entirely, this ambiguity does not block the phase** — but any doc grugops writes should describe `claude --agent` as the full-capability path (as D-01 already does) rather than claiming settings-key parity.

### Finding D — `.claude/agents/` resolution `[VERIFIED: code.claude.com/docs/en/sub-agents]`

Scope priority: managed settings (1) > `--agents` CLI flag (2) > **`.claude/agents/` project (3)** > `~/.claude/agents/` user (4) > plugin `agents/` (5).

> "Project subagents are discovered by walking up from the current working directory, so every `.claude/agents/` between there and the repository root is scanned. As of v2.1.178, when more than one of these nested directories defines the same `name`, Claude Code uses the definition closest to the working directory."
> "Identity comes only from the `name` frontmatter field."
> "Keep `name` values unique across the whole tree: if two files under the same `.claude/agents/` directory, including its subfolders, declare the same name, Claude Code loads only one of them, chosen by filesystem read order rather than a documented precedence."

**Answers CONTEXT.md Open Question 2 affirmatively.** A materialized adapter at `<repo>/.claude/agents/grugops-<role>.md` is resolved from project scope, and `--agent grugops-orchestrator` resolves it by its `name` field. The injected `KIT=` block sits in the markdown **body**, which becomes the system prompt — untouched by frontmatter parsing. There is no interaction between materialization and `--agent` resolution. The `grugops-` prefix on all 17 names also satisfies the tree-wide uniqueness requirement without further work.

### Finding E — depth, width and session caps `[VERIFIED: code.claude.com/docs/en/sub-agents]`

The version-history note, verbatim:

> "Earlier versions used different defaults:
> * **v2.1.172 through v2.1.216**: subagents could nest by default, up to five layers deep, and the limit couldn't be changed.
> * **v2.1.217 through v2.1.218**: the limit defaulted to one, so a subagent couldn't spawn its own unless you raised it; v2.1.219 raised the default to three."

Current default, verbatim: "a subagent can spawn subagents of its own, **up to three layers below the main conversation**." Tunable via `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (requires v2.1.217+); "Set `1` to turn nesting off."

At the depth limit, `Agent` is **withheld** from the subagent's tool list (not an error) — so a role agent at depth simply does the work itself. That is a silent-but-correct degrade, and it is worth a sentence in the coordinator prose so it is never mistaken for the current defect.

Other caps: **200 subagents per session** (`CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`, v2.1.212+); **20 concurrent** (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, v2.1.217+).

**Answers CONTEXT.md Open Question 4:** grugops's `queue.wip_limit` hard cap of 3 is a **WIDTH** limit and sits comfortably inside all three platform caps (3 ≤ 20 concurrent, ≤ 200/session, and is orthogonal to the depth-3 nesting cap). The `wip_limit` rationale text must stop justifying itself against depth at all — depth and width are different axes, and the current prose conflates them.

### Finding F — the `tools` field, background filtering, and zero-tool refusal `[VERIFIED: code.claude.com/docs/en/sub-agents + /errors]`

Frontmatter, verbatim: `tools` — "Tools the subagent can use. Inherits every tool available to subagents if omitted. **If no entry in the list resolves to a tool, the subagent usually fails to launch with an error naming the entries.**"

Background subagents (the default since v2.1.198) keep every MCP tool but only these built-ins: `Read`, `Grep`, `Glob`, `Bash`, `PowerShell`, `Edit`, `Write`, `NotebookEdit`, `WebFetch`, `WebSearch`, `TodoWrite`, `Skill`, `ToolSearch`, `EnterWorktree`, `ExitWorktree`, `Monitor`, `TaskStop`, `SendMessage`, `Artifact`.

**Direct constraint on D-11's `capabilities:` vocabulary:** every tool the vocabulary maps to must be on that background list, or the mapping silently produces a role that loses the tool at runtime. The safe target vocabulary maps only into `{Read, Grep, Glob, Bash, Edit, Write, WebFetch, WebSearch, TodoWrite}` — a superset of what the existing adapter and template already use. `AskUserQuestion` is **unconditionally stripped from every subagent** and must never appear in a mapping.

Also verbatim from the frontmatter table — a documented field that is a genuinely good fit for grugops and is not currently used: `initialPrompt` — "Auto-submitted as the first user turn when this agent runs as the main session agent (via `--agent` or the `agent` setting)." Recorded as an option for the coordinator adapter, not a recommendation for this phase.

**`coordinator: true` is confirmed absent from the documented frontmatter table** — Claude Code ignores it. It remains legitimate as grugops's own greppable marker (which is exactly how `guard_wr05` uses it, per its `D-15 marker` comment), but the packaging template's description of it must not read as platform configuration.

---

## The Set-Literal Inventory, Corrected

The CONTEXT.md table is accurate for what it lists. This research found **three more** enumerating literals, one of which is actively dangerous. **Use this table, not the CONTEXT.md one, as the KIT-02 work list.**

| # | Literal | File:line | Current size | In CONTEXT.md? | Disposition |
|---|---|---|---|---|---|
| 1 | `WR05_SCAN` | `check-foundation-guards.ts:135` | 4 | yes | Derive: adapters ∪ packaging templates |
| 2 | `ADAPTERS` | `check-foundation-guards.ts:244` | 2 | yes | Derive: 17 agents + 7 skills = 24 |
| 3 | `CTX_WORKFLOWS` | `check-foundation-guards.ts:593` | 16 of 19 | yes | Derive via `listWorkflows()` → 19 |
| 4 | `ROLE_FILES` | `check-foundation-guards.ts:282` | 17 (correct today) | yes | Derive via `listRoles()`; feeds `CTX_SCAN` and `guard_role_size` |
| 5 | `WORKFLOWS` | `validate-agent-factory.ts:118` | **14** (stale by 5) | yes | Derive; note the entries are *basenames without `.md`* |
| 6 | `ROLES` | `validate-agent-factory.ts:144` | **16** (missing `frontend-ui`) | yes | Derive; same basename-without-extension shape |
| 7 | `SCAN` | `check-kit-refs.ts:45` | 9 path entries (dirs + files) | yes | Mixed dir/file list — **partially** derivable; see note below |
| 8 | `GH_SCAN` | `check-kit-refs.ts:61` | 5 path entries | yes | Negative scan — see Pitfall 4 |
| 9 | `SKILLS` / `AGENT_REL` | `install/install.ts:480,490` | 7 / 1 | yes | `readdirSync` self-derivation (D-18) |
| 10 | `SKILLS` / `AGENT_REL` | **`install/uninstall.ts:87,88`** | 7 / 1 | as "mirror" | **Separate duplicated literals in a second file.** See Pitfall 5 |
| 11 | **`MARKER_SITES`** | **`check-kit-refs.ts:~68`** | **4** | **NO** | **Missed. Must grow 4 → 19+ under D-06/D-08.** See below |
| 12 | **`ASYM_TABLE_FILES`** | **`check-uat-oracles.ts:141`** | **2** | **NO** | Not a kit set — but SPAWN-07 edits both files it guards. See Pitfall 3 |
| 13 | **`WR05_SCAN` (second, unrelated)** | **`check-uat-oracles.ts:110`** | **4 `.planning/` docs** | **NO** | **NAME COLLISION.** See Pitfall 2 — highest-risk item in this table |
| 14 | `roleCeiling()` | `check-foundation-guards.ts:486` | 17 cases | yes | **Leave alone (D-17).** Already fails closed on an unknown role |

### #11 `MARKER_SITES` — the missed literal that D-06 breaks

`check-kit-refs.ts` asserts the compressed kit-vs-state invariant blockquote is present at four canonical sites:

```
const MARKER_SITES = [
  "AGENTS.md",
  "agent-factory/roles/orchestrator.md",
  ".claude/agents/grugops-orchestrator.md",
  ".claude/skills/grugops/SKILL.md",
];
const MARKER = "If the kit dir is absent, STOP — do not hunt.";
```

Under **D-08**, every one of the 17 generated adapters carries that blockquote. Under **D-06**, every one of them is a resolver. So after this phase the invariant lives at ~19+ sites and `MARKER_SITES` — a hand-maintained list of names consumers read as truth — is stale by 15. It is precisely the drift class KIT-01 exists to delete, and it is **not on the CONTEXT.md work list**. Re-point it through `kit-model` + the derived adapter set in the same wave as #1–#4, or the phase ships its own new instance of the founding defect.

### #7 `SCAN` — the partial-derivation caveat

`check-kit-refs.ts`'s `SCAN` mixes directory entries (`agent-factory/roles`, `.claude/skills`) with file entries (`AGENTS.md`, `.claude/agents/grugops-orchestrator.md`). Only the **file** entries drift — the directory entries are recursively walked and already self-derive. So the minimal correct change is to replace the single `.claude/agents/grugops-orchestrator.md` entry with the directory `.claude/agents`, which makes it self-deriving with no `kit-model` import at all. The header comment's "exclusion-by-not-listing design is load-bearing" warning still applies: do **not** widen `SCAN` to directories that were deliberately omitted (`agent-factory/seed/`, `agent-factory/examples/`, `install/`, `docs/`, `.planning/`).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why standard |
|---|---|---|---|
| `typescript` | `~6.0.3` (already pinned) | Compile `kit-model.ts`, `generate-role-adapters.ts`, `adapters-freshness.ts` to committed `.js` | Ratified D-13 tooling language. `package.json` unchanged. `[VERIFIED: package.json]` |
| `vitest` | `~4.1.8` (already pinned) | The KIT-03 RED-evidence test, per-consumer derivation assertions, generator determinism | 25+ existing `*.test.ts` use it, including the `CHECK_ROOT` hermetic-mirror harness this phase reuses. `[VERIFIED: package.json]` |
| `@types/node` | `~22` (already pinned) | Type-only | Never shipped to hosts. `[VERIFIED: package.json]` |
| Node stdlib `node:fs` / `node:path` / `node:os` / `node:child_process` | Node 22+ floor | All derivation, generation, mirror-spawn and byte comparison | **Zero runtime dependencies is a CLAUDE.md hard constraint.** Every existing script in `scripts/` is stdlib-only. `[VERIFIED: CLAUDE.md constraints + scripts/*.ts headers]` |

### Supporting

| Library | Version | Purpose | When to use |
|---|---|---|---|
| — | — | — | **Nothing.** No supporting library is needed or permitted for this phase. |

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|---|---|---|
| stdlib `readdirSync` + filter | `fast-glob` / `globby` | Forbidden — adds a runtime dependency, and `generate-catalog.ts` already proves the stdlib form works and is testable. |
| Hand-rolled `parseFrontmatter` (already in `generate-catalog.ts`) | `js-yaml` / `gray-matter` | Forbidden for the same reason. But see Pitfall 7 — the existing parser has a real limitation D-11 must design around. |
| Regenerate-to-temp + byte compare | Content hash manifest | The mirror-spawn pattern is already used four times in the tree (`catalog-`, `context-`, `trace-`, `now-running-freshness.ts`). A hash manifest would be a fifth grammar for the same predicate. |

**Installation:**

```bash
# Core: nothing.
# Supporting: nothing.
# Dev dependencies: nothing new.
# Confirmed net change to package.json for this phase: NONE.
```

**Version verification** (ecosystem: npm) — run 2026-07-28:

| Package | Pinned in repo | Registry check |
|---|---|---|
| `typescript` | `~6.0.3` | Unchanged this phase — no bump required, no bump recommended (AUDIT-04 in Phase 28 owns pin refreshes). |
| `vitest` | `~4.1.8` | Same. |
| `@types/node` | `~22` | Same. |

---

## Package Legitimacy Audit

**This phase installs no external packages.** `package.json` gains no dependency, dev or otherwise, and the milestone's Out-of-Scope section states "Confirmed net change to `package.json`: **none**."

| Package | Registry | Age | Downloads | Source repo | Verdict | Disposition |
|---|---|---|---|---|---|---|
| *(none)* | — | — | — | — | — | No packages proposed |

**Packages removed due to `[SLOP]` verdict:** none — none were proposed.
**Packages flagged as suspicious `[SUS]`:** none.

The three existing devDependencies are pre-existing, pinned, committed-lockfile entries not touched by this phase; `package-legitimacy check` was therefore not run, and the planner must **not** add a `checkpoint:human-verify` install task, because there is no install task. If any plan in this phase proposes `npm install`, that plan has escaped scope.

---

## Architecture Patterns

### System architecture diagram

```
                    ┌───────────────────────── FILESYSTEM (source of truth) ─────────────────────────┐
                    │  agent-factory/roles/*.md (17 + 1 `_`-prefixed)                                 │
                    │  agent-factory/workflows/NN-*.md (19)                                           │
                    └───────────────┬────────────────────────────────────────────────────────────────┘
                                    │  readdirSync + filter + EXACT COUNT ASSERT
                                    ▼
                          ┌─────────────────────┐
                          │  scripts/kit-model  │  listRoles(kitRoot) / listWorkflows(kitRoot)
                          │      .ts  (KIT-01)  │  THROWS on vacuity (D-21 tier 1)
                          └──────────┬──────────┘
                                     │ (explicit root arg — D-22, no 4th env var)
        ┌───────────────┬────────────┼──────────────┬─────────────────┬──────────────────┐
        ▼               ▼            ▼              ▼                 ▼                  ▼
 check-foundation  validate-     check-kit-    generate-        generate-role-      KIT-03 oracle
   -guards.ts      agent-        refs.ts       catalog.ts       adapters.ts (NEW)   (NEW)
 WR05_SCAN         factory.ts    SCAN                                │                   │
 ADAPTERS          WORKFLOWS     GH_SCAN                             │                   │
 ROLE_FILES        ROLES         MARKER_SITES ◄── #11 MISSED         │                   │
 CTX_WORKFLOWS                                                       │                   │
        │                                                            ▼                   │
        │                                          ┌──────────────────────────────┐      │
        │                                          │ .claude/agents/              │      │
        │                                          │   grugops-<role>.md  × 17    │◄─────┘
        │                                          │ (thin pointers, committed)   │  set equality:
        │                                          └───────────┬──────────────────┘  grant ∪ {coord}
        │                                                      │                     == adapters
        │  guard_adapter_body (SPAWN-05) ◄─────────────────────┤                     == roles
        │  guard_wr05 (D-05)             ◄─────────────────────┤                        (D-09)
        │  guard_adapter_size            ◄─────────────────────┤
        │                                                      │
        ▼                                                      ▼
  adapters-freshness.ts (SPAWN-02)              install/install.ts  materializeAdapter()
  regen→temp, byte-compare, fail closed         readdirSync self-derive (D-18) × 17
                                                       │  injects KIT="<abs>"
                                                       ▼
                                          ┌─────────────────────────────────────┐
                                          │  USER REPO  <target>/.claude/agents/ │
                                          └──────────────┬──────────────────────┘
                                                         │
                    ┌────────────────────────────────────┼────────────────────────────────┐
                    ▼                                    ▼                                ▼
        `claude --agent grugops-           `/grug` skill in default        `@grugops-<role>` or
         orchestrator`                      main-thread session             the 4 non-CC CLIs
        main thread · spawns ·             main thread · spawns ·          subagent / no Agent tool
        ALLOWLIST ENFORCED                 allowlist NOT enforced          sequential single-window
              (FULL)                            (REDUCED)                       (DEGRADED)
                    └────────────────── capability-sensing (D-04) picks the tier, announces it ──────┘
```

### Recommended project structure

```
scripts/
├── kit-model.ts              # NEW — KIT-01 sole authority; listRoles/listWorkflows(root)
├── kit-model.test.ts         # NEW — vacuity throw, exact-count, `_`-prefix drop, NN- regex
├── generate-role-adapters.ts # NEW — SPAWN-01 templated generator (mirrors generate-catalog.ts)
├── adapters-freshness.ts     # NEW — SPAWN-02 standalone byte gate (mirrors catalog-freshness.ts)
├── check-foundation-guards.ts# EDIT — 4 sets derived; + guard_adapter_body; + KIT-03 oracle wiring
├── validate-agent-factory.ts # EDIT — WORKFLOWS/ROLES derived (basename shape!)
├── check-kit-refs.ts         # EDIT — SCAN entry→dir; GH_SCAN derived predicate; MARKER_SITES derived
└── (each .ts has a committed .js twin — scripts/freshness.ts already auto-walks them)

agent-factory/
├── roles/*.md                # EDIT ×17 — add `capabilities:` frontmatter key (D-11)
├── roles/orchestrator.md     # EDIT — trim ≥430B (D-13) + capability-keyed spawn text + depth fix
└── packaging/
    ├── subagent.frontmatter.md  # EDIT — generator's upstream template (D-25 scan member)
    └── adapters.md              # EDIT — SPAWN-07 depth ≤5 ×2 (guarded by oracleWr05Wording!)

.claude/agents/
└── grugops-<role>.md         # GENERATED ×17, committed, byte-gated

install/
├── install.ts                # EDIT — readdirSync self-derive; materializeAdapter × 17 (D-18)
└── uninstall.ts              # EDIT — mirror; SEPARATE literals at :87-88 (Pitfall 5)
```

### Pattern 1: Derive the set, assert the count (KIT-01)

**What:** A single module owns filesystem discovery and refuses to return a set it cannot vouch for.
**When to use:** Every consumer of "what roles/workflows exist."
**Two-tier enforcement per D-21** — the distinction matters and is easy to collapse by accident:

```typescript
// Source: derivation rules lifted verbatim from scripts/generate-catalog.ts:110-112,154-156
import { readdirSync } from "node:fs";
import { join } from "node:path";

export const ROLE_COUNT = 17;      // D-20: exact in both directions
export const WORKFLOW_COUNT = 19;

// TIER 1 (D-21) — kit-model THROWS on vacuity. Unsafe to continue: an empty set makes every
// derived guard vacuously pass, which looks green. This is the failure mode the count exists for.
export function listRoles(kitRoot: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(join(kitRoot, "agent-factory", "roles"));
  } catch (e) {
    throw new Error(`kit-model: cannot read roles dir under ${kitRoot} — refusing to return an empty set`);
  }
  const roles = entries.filter((f) => f.endsWith(".md") && !f.startsWith("_")).sort();
  if (roles.length === 0) {
    throw new Error(`kit-model: derived 0 roles under ${kitRoot} — refusing a vacuous set`);
  }
  return roles;
}

// TIER 2 (D-21) — a GUARD fails red on exact-count mismatch. Safe to continue, CI red.
// Lives in the guard aggregator, NOT inside kit-model, so adding role #18 is a review moment
// rather than a crash in every consumer.
function guardKitCounts(kitRoot: string): void {
  const r = listRoles(kitRoot).length;
  if (r !== ROLE_COUNT) fail(`kit-model derived ${r} roles, expected ${ROLE_COUNT} — walk every derived consumer, then update the count`);
  else pass(`kit-model: derived ${r} roles (expected ${ROLE_COUNT})`);   // reports WHAT it checked
}
```

Note the `pass()` message reports the number, per the established "guards report what they checked, not just PASS" convention (`PITFALLS.md:591`). A `compared 0 adapters, 0 drift` line is then visibly the anomaly it is.

### Pattern 2: Mirror-spawn regenerate-and-byte-compare (SPAWN-02)

**What:** Copy the committed generator `.js` plus its input dirs into a temp mirror, spawn it there, byte-compare its output against the committed artifact.
**When to use:** Any generated-and-committed artifact. This is the fifth instance; do not invent a sixth mechanism.
**Why mirror-spawn rather than overriding an output path:** `generate-catalog.ts` keeps its `OUT` a **fixed literal** as a path-traversal mitigation (ASVS V12, D-06). The freshness gate never overrides `OUT` — it moves the whole world instead. `generate-role-adapters.ts` must adopt the same posture: a fixed literal output root, never a CLI-supplied one.

```typescript
// Source: scripts/catalog-freshness.ts — pattern reused verbatim
const tmp = mkdtempSync(join(tmpdir(), "grugops-adapters-fresh-"));
mkdirSync(join(tmp, "scripts"), { recursive: true });
mkdirSync(join(tmp, ".claude", "agents"), { recursive: true });
cpSync(join(ROOT, "scripts", "generate-role-adapters.js"), join(tmp, "scripts", "generate-role-adapters.js"));
cpSync(join(ROOT, "scripts", "kit-model.js"), join(tmp, "scripts", "kit-model.js"));   // ← the new import
cpSync(join(ROOT, "agent-factory", "roles"), join(tmp, "agent-factory", "roles"), { recursive: true });
cpSync(join(ROOT, "agent-factory", "packaging"), join(tmp, "agent-factory", "packaging"), { recursive: true });

const r = spawnSync("node", [join(tmp, "scripts", "generate-role-adapters.js")], { encoding: "utf8" });
if (r.status !== 0) { cleanup(); /* FAIL — a broken generator is never "fresh" */ }
// then byte-compare every committed .claude/agents/*.md against <tmp>/.claude/agents/*.md,
// AND assert the two directory listings are set-equal (catches an orphan and a missing file).
```

The set-equality half is an addition over `catalog-freshness.ts`, which compares a single file. Without it, a stale orphan adapter (a role deleted upstream) passes freshness because nothing regenerates over it.

### Pattern 3: Strip-then-inject materialization at 17 call sites (D-06)

`materializeAdapter(src, dest, label)` at `install/install.ts:969` is already content-idempotent with bounded removal on an unterminated block. It needs **no redesign** — only its call site changes from two hard-coded invocations to a `readdirSync` loop:

```typescript
// Source: install/install.ts:1288-1301 — current shape, 2 explicit calls + a 6-skill copy loop
// D-18 target shape: self-derive, no kit-model import, installer stays self-contained.
const agentDir = join(GRUGOPS_SRC, ".claude", "agents");
for (const f of readdirSync(agentDir).filter((f) => f.endsWith(".md")).sort()) {
  materializeAdapter(join(agentDir, f), join(TARGET, ".claude", "agents", f), `.claude/agents/${f}`);
}
```

### Anti-patterns to avoid

- **Grepping for the literal name `WR05_SCAN` to find the KIT-02 work.** It exists twice, in two files, meaning two unrelated things. See Pitfall 2.
- **Deriving `roleCeiling()`.** D-17 forbids it, and the platform reason is sound: it is a measurement baseline, and it already fails closed on an unknown role. Deriving it would turn a fail-closed table into a silently-widening one.
- **Making `kit-model` read an env var.** D-22 is explicit: three root conventions already exist; a fourth is a new authority, not a derived one.
- **Adding `Agent` to `.claude/skills/grugops/SKILL.md`.** It does nothing (permission pre-approval, not capability) and it trips `guard_wr05`'s non-coordinator-with-grant branch.
- **Writing a grep-based "stale literal detector" guard.** D-19 explicitly rejects it: a heuristic detector that is a strict subset of the real predicate is the pattern the closure doctrine warns about.
- **Extracting orchestrator prose into `_role-switch-protocol.md`.** D-15's recorded relocation trap — it has no byte ceiling, so this is constraint-gaming.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Skipping fenced code blocks when scanning adapter bodies | A second fence parser for `guard_adapter_body` | `stripFencedBlocks()` / `matchesOutsideFences()` at `check-foundation-guards.ts:~155-180` | One authority per predicate. A second grammar over the same bytes is LANG-07's named defect, arriving two phases early. The existing one is fail-safe on an unterminated fence. |
| Role/workflow discovery from the filesystem | New readdir logic in the generator | Lift `generate-catalog.ts:110-112,154-156` into `kit-model` | Already correct (`_`-prefix drop, `/^\d{2}-.+\.md$/`), already tested, already handles the `_role-switch-protocol.md` edge case. |
| Byte-freshness gating a generated artifact | A hash manifest, a timestamp check, a git-status check | Mirror-spawn regenerate + byte compare (`catalog-freshness.ts`) | Four working instances in-tree. A timestamp or hash file becomes a second artifact needing its own freshness gate. |
| Injecting an absolute kit path into an adapter | New templating in the generator | `materializeAdapter()` at `install.ts:969` | Strip-then-inject, content-idempotent, bounded removal on an unterminated block (CR-01). Already handles the hard case. |
| Frontmatter reading in the generator | A YAML dependency | `parseFrontmatter()` at `generate-catalog.ts:50` | Zero-dep constraint. **But see Pitfall 7 — it cannot read YAML list values, which constrains D-11's `capabilities:` shape.** |
| Enumerating the `.ts`→`.js` twin set for the build-freshness gate | Adding new scripts to a list | Nothing — `scripts/freshness.ts` already walks the directory | It self-derives. New scripts are covered automatically. Verified by reading it. |
| Hermetic test fixtures for guards | New harness | The `CHECK_ROOT` mirror-plant harness in `check-foundation-guards.test.ts` / `check-uat-oracles.test.ts` | This is what makes the KIT-03 RED-evidence test cheap and permanent. |

**Key insight:** Every mechanism this phase needs already exists in the tree, working and tested. The phase's entire risk profile is *coupling* — which existing thing breaks when a set stops being a literal — not *construction*. Plans should be weighted toward reading the consumer and its tests before editing, and toward the per-consumer assertions D-19 requires, rather than toward writing new machinery.

---

## Runtime State Inventory

This is a refactor/rename-shaped phase (re-pointing literals, generating 17 new files, changing installer behaviour), so the inventory is mandatory. The canonical question: *after every file in the repo is updated, what still has the old shape cached, stored, or registered?*

| Category | Items found | Action required |
|---|---|---|
| **Stored data** | **None.** grugops stores no database, no vector store, no memory service. State is `plans/`, `memory-bank/`, `.grugops/` as plain files in the target repo, and none of them key on the adapter set or the role list. Verified by reading `AGENTS.md` § Kit vs state and the `context-io.ts` path constants. | none |
| **Live service config** | **None.** No hosted service, no n8n, no dashboard, no listening socket (explicitly Out of Scope this milestone). Verified: no MCP server config ships in the kit; the Phase-25 admission server is a local stdio process started per-session. | none |
| **OS-registered state** | **None.** No scheduled task, no pm2, no launchd, no systemd unit. The only OS-level artifact is the `$GRUGOPS_HOME` directory (default `~/.grugops`), which the installer owns and rewrites wholesale on `--update`. | none |
| **Secrets / env vars** | `$GRUGOPS_HOME` (kit root) and `CHECK_ROOT` / `VALIDATE_ROOT` / `VALIDATE_KIT_ROOT` (test harness overrides). **None is renamed by this phase.** D-22 explicitly forbids adding a fourth. `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` is *documented* by SPAWN-07 but never *set* by grugops. | none — **but D-22 must be honoured or this row gains an entry** |
| **Build artifacts / installed packages** | **Two real items.** (1) Every new `scripts/*.ts` needs its committed `.js` twin rebuilt, or `scripts/freshness.ts` fails red — it auto-walks the directory, so a new `.ts` without a `.js` is caught, which is the desired behaviour. (2) **Already-installed target repos** carry the *old* single-adapter layout: `.claude/agents/grugops-orchestrator.md` alone. After this phase, `install --update` must lay down 16 more. This is an **install-time data migration**, not just a code edit. | Rebuild `.js` twins (`npm run build`). Confirm `--update` on a pre-existing install adds the 16 new adapters idempotently and does not orphan anything. |
| **Previously-installed adapters that no longer exist** *(orphan class)* | The reverse of the above: because `uninstall.ts` currently removes a **hard-coded** `AGENT_REL` single file, a target repo installed *after* this phase and uninstalled by an *older* uninstaller would leave 16 orphans. Within this phase, D-18's mirrored derivation fixes it going forward. | `uninstall.ts` must derive the same set — see Pitfall 5 for the ordering hazard |

**Nothing found in the first three categories** — verified by reading `AGENTS.md`, `scripts/context-io.ts`, `install/install.ts` and `install/uninstall.ts`, not assumed.

---

## SPAWN-07 Blast-Radius Inventory

CONTEXT.md deferred this inventory ("the *inventory* of surfaces was not walked during discussion"). Walked here. `grep` over the tree excluding `.planning/` and `node_modules/`:

| # | Surface | Current text | Byte-ceilinged? | Guarded? | Action |
|---|---|---|---|---|---|
| 1 | `agent-factory/roles/orchestrator.md:95` | "platform DEPTH ≤5 fixed/not-configurable, WIDTH capped by grugops at `queue.wip_limit` since the platform does NOT cap width" | **YES** — FAIL 7570 / WARN 7165, currently 7562B | `guard_role_size` | Correct to depth ≤3 tunable. **This edit ADDS bytes** — see Pitfall 1. Also correct "the platform does NOT cap width": it *does* (20 concurrent). |
| 2 | `agent-factory/packaging/adapters.md:35` | 5-tool table, Claude Code row: "nested depth ≤5, concurrent width capped by `queue.wip_limit`" | no | **YES — `oracleWr05Wording` / `ASYM_TABLE_FILES`** | Correct to ≤3. **Must keep the CC row's spawn/coordinator wording** or the oracle fails — Pitfall 3. |
| 3 | `agent-factory/packaging/adapters.md:46` | "agents in parallel (depth ≤5, width ≤ `queue.wip_limit`)" | no | same file, same oracle | Correct to ≤3. Same constraint. |
| 4 | `agent-factory/packaging/subagent.frontmatter.md:103` | "a subagent merely gains the ability to spawn nested agents **up to the depth cap**" | no | `WR05_SCAN` (guard_wr05), `MARKER_SITES`-adjacent, D-25 scan | **Already correct** — it says "the depth cap", not "5". No numeric edit needed. Leave it. |
| 5 | `agent-factory/README.md` | 5-tool table (the second `ASYM_TABLE_FILES` member) | no | **YES — `oracleWr05Wording`** | Inspect for a depth claim; if the CC row carries one, correct it under the same asymmetry constraint. |
| 6 | `CLAUDE.md:89` | "**subagents cannot spawn subagents (no nesting).**" | no | no | **Flatly false today.** But CONTEXT.md assigns `CLAUDE.md` drift to **AUDIT-02 in Phase 28** and says "Do not fix it here." **Conflict flagged** — SPAWN-07's own wording is "everywhere it appears." Recommend: leave it (honour the phase boundary) and add an explicit note to Phase 28's AUDIT-02 so it is not lost. |
| 7 | `docs/initial/grugops_brand_manual.md` | "native depth in Claude Code" (×3) | no | no | **Not a version claim** — "depth" here is marketing prose meaning "richness", not nesting depth. **No action.** Recorded so a bulk find-replace does not touch it. |

**Also in scope for SPAWN-07 per the requirement text:** the `queue.wip_limit` *rationale*. Surface #1 justifies the width cap against depth, which is a category error — depth and width are independent axes with independent platform caps (nesting 3; concurrent 20; session 200). The corrected rationale should say the grugops width cap of 3 is a **grugops** discipline choice that sits far inside the platform's 20-concurrent cap, and stop citing depth as its reason.

---

## Common Pitfalls

### Pitfall 1: The SPAWN-06 trim budget is larger than 400B, because SPAWN-07 spends into the same file

**What goes wrong:** D-13 sizes the trim at "~400B" to get 7562 → below 7165. But SPAWN-07's blast-radius surface #1 lives *in this same file* and its correction is net-positive in bytes. Current fragment: `platform DEPTH ≤5 fixed/not-configurable` (40 chars). A faithful replacement naming the env var — `platform DEPTH ≤3, tunable via CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` — is ~67 chars, **+27B**. Correcting "the platform does NOT cap width" (which is now false — 20 concurrent) adds more. Plus D-04's capability-keyed rewrite of Responsibility 4.
**Why it happens:** the two requirements were sized independently and both land in the one file with 8 bytes of headroom.
**How to avoid:** budget the trim at **≥430B, target ≥480B**, and sequence it as the roadmap already demands — trim first, *then* apply the SPAWN-07 and D-04 edits, *then* re-measure. Treat "orchestrator.md < 7165B **after** all Phase-27 edits" as the acceptance criterion, not "after the trim task."
**Warning signs:** a plan that measures `orchestrator.md` immediately after the trim task and calls SPAWN-06 done.

### Pitfall 2: `WR05_SCAN` is two different constants in two different files

**What goes wrong:** KIT-02 names `WR05_SCAN` as a set to derive. There are two:

| File:line | Contents | Meaning |
|---|---|---|
| `check-foundation-guards.ts:135` | 4 **kit/adapter** files | The spawn-grant guard's scan set — **this is KIT-02's target** |
| `check-uat-oracles.ts:110` | 4 **`.planning/` tracking docs** (`PROJECT.md`, `STATE.md`, `v1.2-SDLC-COVERAGE-AUDIT.md`, `RETROSPECTIVE.md`) | `oracleWr05Wording`'s doc-consistency scan — **must not be touched** |

Deriving the second from `kit-model` is nonsense (they are not kit files) and would break a currently-green Tier-1 oracle that the foundation-guards aggregator imports and folds into its fail count.
**Why it happens:** identical identifier, unrelated domain, and the aggregator imports from the oracle module — so a careless rename compiles.
**How to avoid:** scope every KIT-02 edit **by file path**, never by identifier grep. Consider renaming the guards-side constant to `SPAWN_GRANT_SCAN` in the same commit so the collision cannot recur.
**Warning signs:** `oracleWr05Wording` output changing, or `check-uat-oracles.test.ts` going red. This is a known recurring trap in this repo — editing `.planning/STATE.md` alone has broken this oracle before.

### Pitfall 3: SPAWN-07's `adapters.md` edits sit inside a wording oracle with a broad prohibition regex

**What goes wrong:** `oracleWr05Wording` asserts the 5-tool tables in `agent-factory/packaging/adapters.md` and `agent-factory/README.md` are **asymmetric**: the Claude Code row must carry spawn/coordinator wording and the four other CLI rows must not. The prohibition regex is deliberately broad:

```
/coordinator|parallel|concurren|fan-?out|dispatch[^|]*agent|(?<!no )\bspawn/i
```

Editing the CC row's depth text is safe. But an edit that mentions `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` in a *non-CC* row, or that adds "concurrent" to a non-CC row while explaining the width cap, fails the oracle. Note also that the bare token `spawn` inside the env var name would match `(?<!no )\bspawn` — the env var contains `SPAWN`, and the regex is `/i`.
**How to avoid:** confine every SPAWN-07 edit in those two files to the **Claude Code row** and to prose outside the table; run `node scripts/check-uat-oracles.js` after the edit, not only at the end of the phase.
**Warning signs:** `oracleWr05Wording` reporting an asymmetry violation naming a non-CC row.

### Pitfall 4: `GH_SCAN` is a *negative* scan, and D-06 does not actually break it

**What goes wrong:** the instinct on reading "Assertion 3 asserts exactly three `$GRUGOPS_HOME` sites" is to widen a list from 3 to 18. That instinct is wrong twice over.

What the code actually does: `GH_SCAN` is a list of **kit prose** paths that must be **free** of `GRUGOPS_HOME`. It excludes the adapter dirs and `agent-factory/packaging/` **by not listing them**. The "three legal sites" appears only in a **comment**, never in an assertion.

**Answering CONTEXT.md Open Question 3 directly:** nothing mechanically pins the count of three. Verified — grep for `GRUGOPS_HOME` / `MARKER_SITES` / "three legal" across `scripts/*.test.ts` returns **zero** hits; the only matches in the repo outside `check-kit-refs.ts` itself are in `docs/design/shared-install.md` prose. **Materializing 17 resolvers therefore does not break Assertion 3 as written** — the new adapters live in `.claude/agents/`, which is not in `GH_SCAN`.

D-07 remains the right call anyway: the comment must be corrected (it will be wrong), and restating the predicate as *derived* — "`$GRUGOPS_HOME` appears only in generator-produced adapters + the packaging template" — makes it strictly stronger than the current not-listed exclusion, which would silently permit a *hand-written* adapter to carry the env var.
**How to avoid:** read the assertion before widening it. Update the stale comment in the same commit as the predicate.

### Pitfall 5: `uninstall.ts` holds its own duplicated literals, and derivation there has an ordering hazard

**What goes wrong:** CONTEXT.md's table lists `SKILLS`/`AGENT_REL` at `install/install.ts:480,490` with "(+ uninstall mirror)". They are not a mirror in the code sense — they are **separately declared literals** at `install/uninstall.ts:87-88`. Editing only `install.ts` leaves the uninstaller removing exactly one adapter and orphaning 16.

The deeper hazard: D-18 says uninstall "mirrors the same derivation." But *what does it derive from?* Deriving from the **target** repo's `.claude/agents/` would delete the user's own agent files — a data-loss bug in a tool whose install contract is "never overwrite or delete user content." It must derive from **`GRUGOPS_SRC`** (the kit source), and it must do so **before** removing anything, since the uninstaller also tears down the installed kit.
**How to avoid:** derive the removal set from `GRUGOPS_SRC/.claude/agents` at the top of `uninstall.ts`, intersect it with what exists in the target, and remove only that intersection. Keep the existing `rmdirIfEmpty(.claude/agents)` so a user's own agents keep the directory alive. Add a test with a user-authored `.claude/agents/my-own.md` in the target asserting it survives uninstall.
**Warning signs:** an uninstall test fixture that only ever contains grugops files.

### Pitfall 6: `generate-role-adapters.ts` must keep a fixed-literal output root

**What goes wrong:** the natural way to make a generator testable is a `--out` flag. `generate-catalog.ts` deliberately refuses that (ASVS V12 path-traversal mitigation, D-06) and the freshness gate mirror-spawns instead. A `--out` flag on the new generator would be a regression against a documented security decision *and* would diverge from the pattern the freshness gate expects.
**How to avoid:** fixed literal `OUT` joined to `import.meta.dirname/..`; freshness gate mirrors the world, not the path.

### Pitfall 7: `parseFrontmatter()` cannot read YAML list values — this constrains D-11

**What goes wrong:** the zero-dep frontmatter parser at `generate-catalog.ts:50` matches lines with `/^([A-Za-z_]+):\s*(.*)$/`. A YAML list:

```yaml
capabilities:
  - read
  - edit
```

parses as `capabilities: ""` — the `- read` lines match nothing. The generator would then map an empty capability set to an empty `tools:` list, and **Claude Code v2.1.208+ refuses to launch a subagent whose `tools` resolve to nothing**, with an error naming the entries. So the failure is loud (as CONTEXT.md's "Platform fact to respect" notes) — but it is loud at *runtime on a user's machine*, which is the worst place for it.
**How to avoid:** specify `capabilities:` as an **inline scalar** — `capabilities: read edit shell` or `capabilities: read, edit, shell` — which the existing parser handles. Then add a generator-side assertion that a role's `capabilities` value is non-empty and every token is in the known vocabulary, failing the *build* rather than the runtime. Note `[A-Za-z_]+` already matches `capabilities`, so no parser change is needed for the key itself.
**Also verify:** adding `capabilities:` to role frontmatter must not perturb `docs/catalog/README.md`. `generate-catalog.ts` reads only `fm.tier`, so the catalog output is unchanged and `freshness:catalog` should stay green — **confirm by running it**, do not assume.

### Pitfall 8: `validate-agent-factory.ts`'s lists are basenames without `.md`

**What goes wrong:** `WORKFLOWS` and `ROLES` there are `"00-bootstrap-greenfield"` / `"orchestrator"` — **no extension**. `kit-model.listRoles()` as sketched returns filenames *with* `.md` (matching `generate-catalog.ts`'s usage). A direct substitution produces `orchestrator.md.md` in path joins or silently-failing existence checks that read as findings.
**How to avoid:** decide the `kit-model` return shape once — recommend returning filenames **with** `.md` (matching the majority of consumers and the two guards that build paths) and have `validate-agent-factory.ts` strip the extension at its own call site. Add a per-consumer assertion (D-19) pinning the shape.

### Pitfall 9: A green suite is not evidence for a spawn fix

**What goes wrong:** the recorded doctrine for this repo is that for a safety invariant or guard, green tests are not proof — the guard sharing the bug's blind spot is `PITFALLS.md` P-01, and the milestone's own founding defect is a fully green suite over a structurally broken tree (see `## Verified Baseline`).
**How to avoid:** CAP-03 in Phase 33 owns the live captured proof. Within Phase 27, the substitutes are (a) the KIT-03 RED-evidence fixture test, and (b) a manual dogfood on this machine — Claude Code **v2.1.220** is installed and above the floor, so `claude --agent grugops-orchestrator` can actually be run against the generated adapters before the phase closes. Recommend a `checkpoint:human-verify` for exactly that.

---

## Code Examples

### Generated adapter, target shape (D-08, D-11, D-12, SPAWN-04)

```markdown
---
name: grugops-software-engineer
description: >-
  Implements a ready ticket on a branch under the grugops factory rules.
  Use when the request needs code for one ticket.
model: inherit
tools: Read, Grep, Glob, Bash, Edit, Write
---
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)

Resolve the kit root (this adapter is the sole resolver):

```sh
# 1. (installed) the absolute kit path the installer wrote above this line.
# 2. if absent, self-heal:
KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"
# 3. if "$KIT" still does not exist: STOP. Print:
#    "grugops kit not found at $KIT. Run node install/install.js (or node install/install.js --check) to install the kit."
#    Do NOT hunt the repo for agent-factory/… .
```

Read `agent-factory/roles/software-engineer.md` and act as that role. The shared verified
context is the only memory — publish typed notes per Workflow 16; require nothing relayed.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy.
```

Notes: `tools` **omits `Agent`** — the documented path-independent mechanism (Finding B). `description` is the `## One job` first sentence plus the `## Activates when` line, both already present in every role (D-12). No `coordinator: true` on a specialist. The `MARKER` substring `If the kit dir is absent, STOP — do not hunt.` is present, which is what re-pointed `MARKER_SITES` will check. Estimated size ~1.5–2.0 KB, comfortably under the 3072B WARN in `guard_adapter_size` (the existing orchestrator adapter is 1938B).

### Coordinator adapter frontmatter, target shape (D-09, SPAWN-03)

```yaml
---
name: grugops-orchestrator
description: Single entry point for the grugops software factory. Use for any SDLC delivery request — bootstrap a repo, turn ideas into tickets, implement a ticket, run a quality gate, plan UAT, cut a release. Routes to the specialist factory roles.
coordinator: true          # grugops-internal marker only — Claude Code ignores unknown keys
tools: Agent(grugops-agents-md-scribe, grugops-architect-design, grugops-ba-pm, grugops-brownfield-mapper, grugops-compliance-officer, grugops-factory-coach, grugops-frontend-ui, grugops-greenfield-mapper, grugops-incident-responder, grugops-installer, grugops-qe-e2e, grugops-release-manager, grugops-security-nfr, grugops-software-engineer, grugops-system-analyst, grugops-uat-planner), Read, Grep, Glob, Bash, Edit, Write
model: inherit
---
```

16 names = 17 roles − the coordinator itself (D-09). Generated, never hand-listed — this string is exactly the kind of literal KIT-03 exists to keep honest.

### KIT-03 oracle shape (D-09)

```typescript
// Three sets, one equality. Reports what it compared (never a bare PASS).
const roles    = new Set(listRoles(kitRoot).map((f) => `grugops-${f.replace(/\.md$/, "")}`));
const adapters = new Set(readdirSync(agentsDir).filter((f) => f.endsWith(".md"))
                          .map((f) => f.replace(/\.md$/, "")));
const grant    = new Set(parseAgentGrant(coordinatorAdapterText));   // names inside Agent( ... )
const closure  = new Set([...grant, COORDINATOR_NAME]);

// Fails RED on today's tree: roles=17, adapters={grugops-orchestrator}, grant=7 dangling names.
assertSetEqual("roles vs adapters", roles, adapters);
assertSetEqual("grant ∪ {coordinator} vs adapters", closure, adapters);
pass(`referential integrity: ${roles.size} roles == ${adapters.size} adapters == ${closure.size} granted+coordinator`);
```

`parseAgentGrant` must be fence-aware — the packaging template shows a coordinator example inside a ``` fence, and `stripFencedBlocks()` already exists for exactly this (`check-foundation-guards.ts:~155-180`). Do not write a second fence parser.

---

## State of the Art

| Old approach | Current approach | When changed | Impact on grugops |
|---|---|---|---|
| Subagent nesting depth 5, not configurable | Depth **3**, tunable via `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` | v2.1.219 (after a 217–218 window where the default was **1**) | SPAWN-07 — 5 surfaces, see blast radius |
| `Task` tool | **`Agent`** tool (`Task(...)` still works as an alias) | v2.1.63 | Already correct in-tree; `guard_wr05` matches both |
| Subagents ran in the foreground | **Background by default**, with a narrowed built-in tool set | v2.1.198 | Constrains D-11's capability vocabulary — see Finding F |
| A subagent with unresolvable `tools` launched tool-less | **Refuses to launch**, naming the entries | v2.1.208 | Makes a bad `capabilities:` mapping loud — but at runtime; prefer a build-time assertion (Pitfall 7) |
| No session/concurrency caps | 200 subagents/session (v2.1.212+), 20 concurrent (v2.1.217+) | v2.1.212 / .217 | grugops's width cap of 3 is far inside both; the `wip_limit` rationale must stop citing depth |
| Nested `.claude/agents/` resolution unspecified | **Closest-to-cwd wins** on a name collision | v2.1.178 | Confirms the project-scope adapter is found; `grugops-` prefix keeps names tree-unique |
| Custom commands in `.claude/commands/` | **Merged into skills**; both produce `/name` | current | No action — grugops already uses `.claude/skills/` |

**Deprecated / outdated in grugops's own text:**
- "platform DEPTH ≤5 fixed/not-configurable" (`orchestrator.md:95`) — wrong on both counts.
- "the platform does NOT cap width" (same line) — wrong; 20 concurrent since v2.1.217.
- "subagents cannot spawn subagents (no nesting)" (`CLAUDE.md:89`) — wrong, but **Phase 28 / AUDIT-02 owns it**.
- "the handoff is the only memory" (`.claude/agents/grugops-orchestrator.md:25`) — SPAWN-05's target; dies structurally once the adapter is generated from the template.

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | The `Agent(...)` allowlist is enforced under the `.claude/settings.json` `"agent"` key as well as under `--agent`. The settings docs say the key applies the agent's "tool restrictions"; the sub-agents docs name only the flag. | Platform Contract → Finding C | **Low.** D-01 removes the settings key from grugops's install path, so nothing in this phase depends on it. Docs grugops writes should name `claude --agent` as the full-capability path (D-01 already does). |
| A2 | Adding `capabilities:` to role frontmatter leaves `docs/catalog/README.md` byte-identical, so `freshness:catalog` stays green. `generate-catalog.ts` reads only `fm.tier`, which supports this — but it was not executed with a modified role file. | Pitfall 7 | **Low.** Caught immediately by running `npm run freshness:catalog`. Make that an explicit verification step. |
| A3 | The trim budget of ≥430B is sufficient once SPAWN-07's and D-04's edits to `orchestrator.md` are counted. The +27B figure is computed from a *specific proposed* replacement string, not from the final authored text. | Pitfall 1 | **Medium.** If the authored corrections run longer, the trim must grow. Mitigate by making "orchestrator.md < 7165B **after all Phase-27 edits**" the acceptance criterion. |
| A4 | `agent-factory/README.md`'s 5-tool table carries a depth claim needing correction. It is an `ASYM_TABLE_FILES` member and structurally parallel to `adapters.md`, but its depth text was not read line-by-line. | SPAWN-07 blast radius #5 | **Low.** Costs one `grep` during planning. |
| A5 | `initialPrompt` would be a useful field for the coordinator adapter. Verified as a real documented field; its *fit* for grugops is an inference. | Platform Contract → Finding F | **Nil.** Recorded as an option, recommended for nothing in this phase. |
| A6 | The three devDependency pins are current enough not to need attention this phase. | Standard Stack | **Nil.** AUDIT-04 (Phase 28) explicitly owns pin refreshes. |

Everything else in this document is tagged `[VERIFIED]` (read from the live docs or the live tree this session) or `[CITED]`.

---

## Open Questions (RESOLVED)

The four questions CONTEXT.md flagged for research, answered. Questions 5 and 6, opened by that
research, were resolved through CONTEXT.md's D-02 revision and D-27 respectively.

1. **Is a skill's `allowed-tools: Agent(a, b, c)` honored as a scoped grant in the main thread?**
   **ANSWERED — NO, and the question's premise is inverted.** `allowed-tools` is a per-turn *permission pre-approval*, not a tool allowlist: "It does not restrict which tools are available: every tool remains callable." So the skill neither grants nor withholds capability. `/grug` already has `Agent` from the default main-thread session, so it **can** spawn, unscoped. The scoped-allowlist form belongs to agent `tools:` frontmatter on the `--agent` path only. See `## The One Premise That Did Not Survive Verification` — this reopens D-02.

2. **Main-thread coordinator wiring validated against the real installed flow — does `--agent` resolve a project `.claude/agents/` entry carrying an injected `KIT=` block?**
   **ANSWERED — YES, with no interaction.** `.claude/agents/` is scope priority 3, discovered by walking up from cwd, and identity comes only from the frontmatter `name`. The injected `KIT=` block lives in the markdown **body**, which becomes the system prompt verbatim and is never parsed as frontmatter. `materializeAdapter()`'s strip-then-inject operates on body lines around `MAT_SLOT` and cannot touch the `---` fence. **Remaining verification is empirical, not documentary:** run `claude --agent grugops-orchestrator` in a repo with a materialized adapter and confirm the `@grugops-orchestrator` startup header. Claude Code **v2.1.220** is installed on this machine, so this is a cheap `checkpoint:human-verify`, and it is the strongest available in-phase evidence (Pitfall 9).

3. **Does any other assertion or test pin the "exactly three `$GRUGOPS_HOME` sites" count?**
   **ANSWERED — NO.** Verified by grep across `scripts/*.test.ts`, `docs/`, and `AGENTS.md`: zero hits for a pinned count. The "three legal sites" claim exists only in a **comment** in `check-kit-refs.ts`. `GH_SCAN` is a negative scan that excludes adapter dirs by omission, so D-06's 17 resolvers do not break it. D-07's derived-predicate restatement remains worthwhile because it is strictly stronger and because the comment will otherwise be wrong. See Pitfall 4.

4. **Do Claude Code depth/width caps accommodate the grant?**
   **ANSWERED — YES, comfortably.** Depth 3 (v2.1.219+, tunable), 20 concurrent (v2.1.217+), 200 per session (v2.1.212+). grugops's `queue.wip_limit` hard cap of **3** is a WIDTH limit and sits far inside the 20-concurrent cap; a 16-name grant is a *capability* set, not a concurrency demand, so it does not interact with any cap. The `wip_limit` rationale text must be corrected to stop justifying a width cap by citing a depth cap — two independent axes.

**Newly opened by this research** (for the planner or the discuss loop, not blocking):

5. **Does D-02's "loud degrade" survive the corrected facts, and if not, what replaces it?** A three-tier honest-announcement model is proposed in `## The One Premise That Did Not Survive Verification`. This is a **user decision**, not a research finding — D-02 was recorded as costly-to-reverse, and its trigger condition is now known to be wrong. **Recommend routing this back through discuss-phase, or planning a Wave-0 `checkpoint:human-verify` before any coordinator text is authored.** Whatever is chosen, D-05's guard shape (`guard_wr05` asserts degrade-path presence + non-coordinator `Agent` absence) must be re-derived from it, since the guard encodes the decision.

6. **Should `MARKER_SITES` (missed literal #11) be in this phase's scope?** It is not on the CONTEXT.md work list, but D-06/D-08 make it stale by 15 the moment the adapters land. Leaving it stale ships a fresh instance of the milestone's founding defect. **Recommend: in scope, same wave as the other derived sets.** Cost is small; the alternative is a known-stale hand-maintained list in the phase whose entire purpose is deleting those.

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | All tooling; hard install prerequisite (Node 22+) | ✓ | **v24.12.0** | — |
| TypeScript (`tsc`) | Compile `.ts` → committed `.js` | ✓ | `~6.0.3` (devDep, lockfile committed) | — |
| Vitest | KIT-03 RED test, derivation assertions, generator determinism | ✓ | `~4.1.8` (devDep) | — |
| Claude Code CLI | SPAWN-03 empirical verification (`--agent`), dogfood | ✓ | **v2.1.220** — above the ratified v2.1.219 floor, in the depth-3 regime | — |
| `git` | Commits, phase manifest | ✓ | — | — |
| Codex / Gemini / OpenCode / Copilot CLIs | Cross-CLI degrade verification | ✗ | — | Not needed this phase — the sequential path is unchanged and v2.0's dual-path equivalence oracle already covers it in-process |
| Network access to `code.claude.com` | Platform-contract verification | ✓ | — | Already performed; findings recorded verbatim in this document |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** the four non-Claude CLIs, covered by the existing in-process equivalence oracle.

**Note for the planner:** running the full `npm test` in this repo triggers a live Claude-CLI e2e lane that spends tokens and can take ~8 minutes on an authenticated machine. For iteration use `npx vitest run --exclude '**/scripts/e2e/**'`.

---

## Validation Architecture

### Test framework

| Property | Value |
|---|---|
| Framework | Vitest `~4.1.8` |
| Config file | none — Vitest defaults; `test` script in `package.json` |
| Quick run command | `npx vitest run --exclude '**/scripts/e2e/**'` |
| Full suite command | `npm test` (⚠ includes the live Claude-CLI e2e lane — token cost, ~8 min) |
| Guard lane | `npm run build && node scripts/check-foundation-guards.js` |
| Freshness lane | `npm run freshness && npm run freshness:catalog` (+ a new `freshness:adapters`) |

### Phase requirements → test map

| Req | Behavior | Test type | Automated command | File exists? |
|---|---|---|---|---|
| KIT-01 | `listRoles`/`listWorkflows` derive 17/19; drop `_`-prefixed; match `NN-*.md`; **throw** on empty dir (D-21 tier 1) | unit | `npx vitest run scripts/kit-model.test.ts` | ❌ Wave 0 |
| KIT-01 | Exact-count guard fails red at 16 or 18 roles (D-20, both directions) | unit (hermetic `CHECK_ROOT` mirror) | `npx vitest run scripts/check-foundation-guards.test.ts -t "kit count"` | ❌ Wave 0 |
| KIT-02 | Each of the 9 re-pointed consumers sources its set from `kit-model` (D-19 per-consumer assertion) | unit | `npx vitest run scripts/check-foundation-guards.test.ts scripts/validate.test.ts scripts/check-kit-refs.test.ts` | ⚠ files exist, cases ❌ |
| KIT-02 | `MARKER_SITES` covers every derived adapter (missed literal #11) | unit | `npx vitest run scripts/check-kit-refs.test.ts -t "marker sites"` | ❌ Wave 0 |
| KIT-03 | Oracle **fails RED** against a planted today's-tree fixture (1 adapter / 7 dangling names / 17 roles) | unit (fixture-pinned, permanent) | `npx vitest run scripts/check-foundation-guards.test.ts -t "referential integrity RED"` | ❌ Wave 0 |
| KIT-03 | Oracle passes on the real tree once 17 adapters exist | integration | `node scripts/check-foundation-guards.js` | ✅ script exists |
| SPAWN-01 | 17 adapters exist; each is a thin pointer (no role body); each carries the resolver + MARKER | unit + guard | `npx vitest run scripts/generate-role-adapters.test.ts` + `guard_adapter_size` | ❌ Wave 0 |
| SPAWN-02 | Byte drift between a committed adapter and a fresh regeneration fails closed; a broken generator never reads "fresh"; orphan/missing adapter caught by set equality | integration | `node scripts/adapters-freshness.js` | ❌ Wave 0 |
| SPAWN-03 | Coordinator adapter resolves under `claude --agent`; `@grugops-orchestrator` header appears | **manual** | *(no automated equivalent — the runtime is the SUT)* | `checkpoint:human-verify` |
| SPAWN-04 | No non-coordinator adapter carries `Agent`/`Task` in `tools:` (fence-aware, both comma and YAML-array forms) | unit | `npx vitest run scripts/check-foundation-guards.test.ts -t "wr05"` | ⚠ file exists, cases ❌ |
| SPAWN-05 | `guard_adapter_body` fails red on planted dead handoff vocabulary **and** on an adapter missing the shared-context wording (D-23 both directions) | unit (mirror-plant) | `npx vitest run scripts/check-foundation-guards.test.ts -t "adapter_body"` | ❌ Wave 0 |
| SPAWN-05 | Ships green: zero dead vocabulary across 17 agents + 7 skills + the template | integration | `node scripts/check-foundation-guards.js` | ✅ |
| SPAWN-06 | `orchestrator.md` < 7165B **after every Phase-27 edit**; ceiling values unchanged | integration | `node scripts/check-foundation-guards.js` (`guard_role_size` PASS, not WARN) | ✅ |
| SPAWN-07 | All 5 depth surfaces corrected; `oracleWr05Wording` asymmetry still green | integration | `node scripts/check-uat-oracles.js` | ✅ |
| — | `install --update` on a pre-existing single-adapter install lays down all 17 idempotently | integration | `npx vitest run install/` (existing installer suite) | ⚠ suite exists, case ❌ |
| — | `uninstall` removes only grugops adapters; a user-authored `.claude/agents/my-own.md` survives | integration | `npx vitest run install/` | ❌ Wave 0 (Pitfall 5) |
| — | `docs/catalog/README.md` unchanged by the `capabilities:` frontmatter addition | integration | `npm run freshness:catalog` | ✅ |

### Sampling rate

- **Per task commit:** `npx vitest run --exclude '**/scripts/e2e/**'` plus `npm run build && node scripts/check-foundation-guards.js`
- **Per wave merge:** the above plus `node scripts/check-kit-refs.js`, `node scripts/check-uat-oracles.js`, `npm run freshness`, `npm run freshness:catalog`, `node scripts/adapters-freshness.js`
- **Phase gate:** full suite green + the SPAWN-03 human-verify checkpoint before `/gsd-verify-work`

### Wave 0 gaps

- [ ] `scripts/kit-model.test.ts` — KIT-01 derivation, vacuity throw, exact count both directions
- [ ] `scripts/generate-role-adapters.test.ts` — SPAWN-01 determinism + thin-pointer assertion
- [ ] New cases in `scripts/check-foundation-guards.test.ts` — KIT-03 RED fixture, `guard_adapter_body` both directions, SPAWN-04, per-consumer derivation
- [ ] New cases in `scripts/check-kit-refs.test.ts` — `MARKER_SITES` coverage, `GH_SCAN` derived predicate
- [ ] New cases in the installer suite — 17-adapter `--update`, uninstall user-content preservation
- [ ] Framework install: **not needed** — Vitest is already a devDependency

---

## Security Domain

`security_enforcement` is not disabled, so this section is required. This is a build-tooling phase with no network surface, no user input, no auth and no data store — but three controls are genuinely load-bearing.

### Applicable ASVS categories

| ASVS category | Applies | Standard control |
|---|---|---|
| V2 Authentication | no | No auth surface. The only human-identity concept is `verified_by: <named human>`, untouched here. |
| V3 Session Management | no | No sessions. |
| V4 Access Control | **yes** | The `Agent(<allowlist>)` grant *is* an access-control decision (which role may spawn which). Enforcement is the platform's on the `--agent` path only — hence SPAWN-03/04 and D-03's honesty rule. The `tools:` omission (Finding B) is the path-independent control. |
| V5 Input Validation | **yes** | The generator consumes role frontmatter as input. `capabilities:` tokens must be validated against a closed vocabulary at build time (Pitfall 7), not passed through to a `tools:` string. Fence-aware parsing (`stripFencedBlocks`) prevents a documentation example being read as a live grant. |
| V6 Cryptography | no | None used, none needed. |
| V12 File & Resource / Path Traversal | **yes** | `generate-role-adapters.ts` must keep a **fixed-literal** output root, matching `generate-catalog.ts`'s documented D-06 mitigation. `uninstall.ts`'s derived removal set must be intersected with the source set so it can never delete arbitrary target paths. |
| V14 Configuration | **yes** | D-01's refusal to write `.claude/settings.json` is a security posture: the installer never mutates user-owned configuration, and never silently makes every session in a repo run a different system prompt. |

### Known threat patterns for this stack

| Pattern | STRIDE | Standard mitigation |
|---|---|---|
| A guard that is a strict subset of the predicate it claims to enforce (green file, false runtime) | Repudiation / Tampering | Structural fix first, guard as defense in depth (D-26). SPAWN-04 uses the *documented* mechanism, not a heuristic. |
| Vacuous pass — derived set comes back empty, every guard silently green | Repudiation | D-21 two-tier: `kit-model` throws on vacuity; guard fails red on count mismatch; guards report what they checked. |
| Documentation example parsed as a live coordinator grant | Elevation of Privilege | `stripFencedBlocks()` — fail-safe on an unterminated fence (already implemented, reuse it). |
| Generator output path supplied by a caller | Tampering (path traversal) | Fixed-literal `OUT`; mirror-spawn for testing (ASVS V12, existing D-06 precedent). |
| Uninstall deleting user-authored files in a shared directory | Denial of Service / data loss | Intersect the derived source set with target contents; `rmdirIfEmpty` only; regression fixture with a user-authored agent (Pitfall 5). |
| An adapter that cannot find its kit hunting the repo for `agent-factory/` | Tampering (wrong-source execution) | `AGENTS.md` § Kit vs state: **STOP — do not hunt.** D-06 makes all 17 adapters self-sufficient resolvers so this rule is enforceable in a fresh subagent context. |
| Installer overwriting user configuration | Tampering | CLAUDE.md hard constraint: idempotent, additive, dry-run, reversible, never overwrite or delete user content. D-01 upholds it. |

---

## Project Constraints (from CLAUDE.md)

Directives the planner must verify every task against:

1. **Tech stack** — Markdown for kit content; TypeScript for tooling, compiled by `tsc` to **committed `.js`**, freshness-checked so committed output cannot drift from source. New scripts must ship both `.ts` and `.js`.
2. **Zero runtime dependencies on host machines** — hosts run the committed `.js` with nothing installed. `package.json` gains nothing this phase.
3. **Node 22+ is a hard install prerequisite** — satisfied (v24.12.0 locally).
4. **Safety (hard)** — agents never merge a protected branch and never deploy to prod without named human confirmation; prefer *mechanical* enforcement. Every generated adapter echoes the hard limit (D-08).
5. **Single-source** — "Role text lives once; per-tool adapters are thin pointers, **never copies**." This is SPAWN-01's governing constraint and `guard_adapter_size`'s reason for existing.
6. **Zero-config first** — honor `factory.config.json` when present, run lean when absent. Supports D-10: grant is capability, the dial is policy.
7. **Voice discipline** — caveman in role prompts; **clear voice** in security findings, compliance, money and disclaimers. Every new guard/script writes findings in clear professional voice (every existing script header states this).
8. **Installers** — idempotent, additive, dry-run-capable, reversible; never overwrite or delete user content. Directly constrains the 17-adapter install and the uninstall mirror (Pitfall 5).
9. **No fabrication** — unknown commands marked `UNKNOWN - verify`; never fake a passing gate, a test result, or a citation.
10. **Minimal AGENTS.md** — keep the substrate short; `guard_agents_bytes` enforces a 28 KiB FAIL below Codex's 32 KiB cap.
11. **Brand** — always lowercase `grugops`; `/grug` command shape. Finding ⓪ matters here: `/grug` is the brand's headline entry and it is more capable than the discussion believed.
12. **Docs links** — use `code.claude.com/docs/en/*`, never `docs.claude.com/en/docs/claude-code/*` (301-redirects). All citations in this document comply.

**One drift note:** `CLAUDE.md:89` states "subagents cannot spawn subagents (no nesting)", which is false on every current Claude Code version. CONTEXT.md assigns `CLAUDE.md` reconciliation to **AUDIT-02 in Phase 28** and says not to fix it here. Honour that boundary — but the planner should ensure Phase 28 inherits this specific finding.

---

## Sources

### Primary (HIGH confidence — fetched and read verbatim this session, 2026-07-28)

- `code.claude.com/docs/en/sub-agents` — full frontmatter table; scope/precedence table; `Agent(agent_type)` main-thread-only rule (verbatim); omit-`Agent` mechanism (verbatim); depth version-history note (verbatim); session/concurrency caps; background tool filter; always-stripped tool list; `--agent` semantics; `.claude/settings.json` `agent` example
- `code.claude.com/docs/en/skills` — `allowed-tools` / `disallowed-tools` semantics (verbatim, the finding that overturned the D-01 premise); full frontmatter table; `context: fork` + `agent:` + `background:`
- `code.claude.com/docs/en/settings` — the `agent` settings key description (verbatim); full scope precedence order
- `code.claude.com/docs/en/errors` — "Agent would be spawned with zero tools"; "Session agent no longer available"

### Primary (HIGH confidence — repository source read directly this session)

- `scripts/check-foundation-guards.ts` — `WR05_SCAN`:135, `guardWr05`:179, `ADAPTERS`:244, `ROLE_FILES`:282, `roleCeiling`:486, `guardRoleSize`:530, `CTX_WORKFLOWS`:593, `stripFencedBlocks`/`matchesOutsideFences`
- `scripts/check-uat-oracles.ts` — the **second** `WR05_SCAN`:110, `ASYM_TABLE_FILES`:141, `ASYM_SPAWN_WORDING`:167, `oracleWr05Wording`:172
- `scripts/check-kit-refs.ts` — `SCAN`:45, `GH_SCAN`:61, `MARKER_SITES`, Assertion 2, Assertion 3, SC2 marker check
- `scripts/validate-agent-factory.ts` — two-root resolution:50-68, `WORKFLOWS`:118 (14), `ROLES`:144 (16)
- `scripts/generate-catalog.ts` — `parseFrontmatter`:50, role derivation:110-112, workflow derivation:154-156
- `scripts/catalog-freshness.ts` — mirror-spawn regenerate + byte-compare pattern, fail-closed posture, fixed-literal `OUT` rationale
- `install/install.ts` — `SKILLS`:480, `AGENT_REL`:490, `materializeAdapter`:969-1016, call site:1288-1301
- `install/uninstall.ts` — separate `SKILLS`:87 / `AGENT_REL`:88, removal order
- `agent-factory/packaging/subagent.frontmatter.md` — the generator's upstream template, in full
- `agent-factory/roles/orchestrator.md` — Responsibility 4:44, routing matrix:53-64, coordinator hard limit:95
- `.claude/agents/grugops-orchestrator.md` — the single existing adapter, in full (incl. the surviving line 25)
- `.claude/skills/grugops/SKILL.md` — in full
- Live measurements: role/workflow counts, byte sizes, `node scripts/check-foundation-guards.js`, `claude --version`, `node --version`

### Secondary (MEDIUM confidence — prior-milestone research, spot-checked against primary sources above)

- `.planning/research/STACK.md` §"Findings that bear directly on the v2.1 spawn defect" — findings ①–⑥ **all re-verified verbatim and all confirmed**
- `.planning/research/ARCHITECTURE.md` — seam map (`:515`'s "plain copies" recommendation is explicitly overridden by D-06)
- `.planning/research/PITFALLS.md` — P-01 (a guard sharing the bug's blind spot); "guards report what they checked" `:591`
- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` § Phase 27

### Tertiary (LOW confidence — none)

No claim in this document rests on an unverified web search.

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| Claude Code platform contract | **HIGH** | Every claim fetched verbatim from `code.claude.com/docs/en/*` this session. One residual ambiguity (A1) is documented and does not block. |
| Standard stack | **HIGH** | No new packages. Read from `package.json`. Trivially verifiable. |
| Set-literal inventory | **HIGH** | Every literal read at its line. Three additions to the CONTEXT.md table found by reading, not inference. |
| Existing-pattern reuse | **HIGH** | Each reusable mechanism read in full: `materializeAdapter`, `catalog-freshness`, `stripFencedBlocks`, `generate-catalog` derivation. |
| Baseline measurements | **HIGH** | Executed this session; guard suite run; byte sizes and counts measured, not quoted. |
| SPAWN-07 blast radius | **MEDIUM-HIGH** | 6 of 7 surfaces read at their line; `agent-factory/README.md` inferred from structural parallel (A4). |
| Pitfalls | **HIGH** | Each derived from a specific read line of source, not from general experience. |
| The D-02 reopening | **HIGH** on the fact, **N/A** on the resolution | The platform fact is verbatim. What grugops *should do* about it is a user decision (Open Question 5). |

**Research date:** 2026-07-28
**Valid until:** 2026-08-11 (14 days). Shorter than the 30-day default for stable domains: the Claude Code subagent surface changed materially at v2.1.198, .208, .212, .216, .217 and .219 — six behavioural changes inside roughly twenty patch releases. Re-verify the depth default and the `allowed-tools` semantics if this phase has not landed by then.
