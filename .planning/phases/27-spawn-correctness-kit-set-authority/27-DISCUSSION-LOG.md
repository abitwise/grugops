# Phase 27: Spawn Correctness & Kit-Set Authority - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-28
**Phase:** 27-Spawn Correctness & Kit-Set Authority
**Areas discussed:** Coordinator entry / main-thread wiring, Kit-root resolution for spawned roles, Spawn set + adapter tools, orchestrator.md trim, Derivation reach, Asserted-count semantics, guard_adapter_body vocabulary

All seven identified gray areas were selected for discussion (no area declined).

---

## Coordinator entry / main-thread wiring

### Q1 — Does the installer write the main-thread wiring into the target repo?

| Option | Description | Selected |
|--------|-------------|----------|
| No — document it | Installer writes nothing. Docs + the `/grug` degrade path cover it. Zero footprint, nothing to uninstall, no surprise hijack of unrelated sessions in the repo. | ✓ |
| Opt-in installer flag | `install.js --wire-coordinator` writes a sentinel-wrapped `.claude/settings.json {"agent": ...}`, removed cleanly by uninstall. | |
| Yes, by default | Installer always writes it. Best out-of-box spawning, but every Claude session in that repo starts as the grugops coordinator. | |

**User's choice:** No — document it
**Notes:** Recommended option. `settings.json` is user content and the installer is bound to "additive, never overwrite."

### Q2 — What does `/grug` do when the coordinator is NOT the main thread?

| Option | Description | Selected |
|--------|-------------|----------|
| Loud sequential degrade | Announce it, then run the existing single-window role-load path the other 4 CLIs use. Correct artifacts, no spawn under an unenforced allowlist, no new mode invented. | ✓ |
| Hard STOP | Refuse and tell the user to relaunch with `--agent`. | |
| Spawn anyway with a warning | Parallel work happens but the allowlist is unenforced — a green file with a false runtime. | |

**User's choice:** Loud sequential degrade
**Notes:** Preserves "user types `/grug` and gets a team" while refusing to spawn under an allowlist the runtime ignores.

### Q3 — What must `guard_wr05` assert about the wiring?

| Option | Description | Selected |
|--------|-------------|----------|
| Degrade-path presence | Assert the coordinator body carries the not-main-thread check, plus SPAWN-04 (no `Agent` on any non-coordinator). Both hold on the subagent AND main-thread paths. | ✓ |
| Wiring artifact existence | Assert a `settings.json` agent entry exists. | |
| Both, tiered | Degrade-path check always; wiring-artifact check only when the opt-in flag was used. | |

**User's choice:** Degrade-path presence
**Notes:** Follows from Q1 — with no wiring artifact written, there is nothing in a user repo to assert against.

### Derived, not asked

Detection mechanism: capability-sensing rather than version-sensing — if the `Agent` tool is not available, run sequential and say so. Consistent with the ratified milestone decision that no runtime version-detection code is required.

---

## Kit-root resolution for spawned roles

### Q1 — How does a freshly-spawned role session resolve the kit root?

| Option | Description | Selected |
|--------|-------------|----------|
| All 17 are resolvers | Each generated adapter carries the resolver block; installer materializes the absolute `KIT=` into all of them. Self-sufficient regardless of invoker. | ✓ |
| Coordinator passes KIT in the prompt | Role adapters stay plain copies, Assertion 3 untouched at 3 sites. | |
| Env self-heal, no materialization | Adapters carry `${GRUGOPS_HOME:-$HOME/.grugops}` but no injected absolute path. | |

**User's choice:** All 17 are resolvers
**Notes:** This deliberately overrides `.planning/research/ARCHITECTURE.md:515`, which recommended plain copies. A spawned session is a fresh context; depending on the spawner's prompt text reproduces "the handoff is the only memory," and it breaks direct `@grugops-<role>` invocation.

### Q2 — How should `check-kit-refs` Assertion 3 be restated?

| Option | Description | Selected |
|--------|-------------|----------|
| Derived predicate | "`$GRUGOPS_HOME` appears only in generator-produced adapters + the packaging template." | ✓ |
| Widen the literal to 18 sites | Keep the named-list shape, add the 17. | |
| Scope it to kit prose only | Stop asserting anything about the adapter directory. | |

**User's choice:** Derived predicate
**Notes:** A widened literal would be the exact hand-maintained-list class this phase deletes.

### Q3 — How much does a generated role adapter body carry?

| Option | Description | Selected |
|--------|-------------|----------|
| Resolver + role pointer + hard limit | Kit-vs-state blockquote, resolver block, "read the role file and act as it," never-merge/never-deploy line. Nothing role-specific. | ✓ |
| Add the factory read order | Also read `factory.config.json`, `AGENTS.md`, `plans/board.md`. | |
| Minimal pointer only | Drop the echoed hard limit. | |

**User's choice:** Resolver + role pointer + hard limit
**Notes:** Keeps the safety line in the first file a spawned agent reads, without duplicating the role file's own instructions across 17 adapters against a 4096B ceiling.

---

## Spawn set + adapter tools

### Q1 — What is in the coordinator's spawn grant?

| Option | Description | Selected |
|--------|-------------|----------|
| All 16 non-coordinator roles | `adapters = 17 roles`, `grant = adapters − coordinator`. KIT-03 asserts `grant ∪ {coordinator} == adapters == roles`. | ✓ |
| Core tier only (12) | Grant the 12 `tier: core` roles; enterprise roles reachable only in enterprise mode. | |
| Curated subset | Hand-pick which roles are worth spawning. | |

**User's choice:** All 16 non-coordinator roles
**Notes:** Grant is capability, the config dial is policy. Gating at the grant level would mean a config change cannot reach a role the runtime already refused.

### Q2 — Where does each adapter's `tools:` list come from?

| Option | Description | Selected |
|--------|-------------|----------|
| Neutral `capabilities:` in role frontmatter | Role file declares capabilities; generator maps to Claude Code tool names. Single-source, per-role least privilege, portable across the 5 host CLIs. | ✓ |
| One uniform set for all roles | `Read, Grep, Glob, Bash, Edit, Write` on every non-coordinator (the research's shape). | |
| Claude Code tool names in role frontmatter | Skip the mapping layer. | |

**User's choice:** Neutral `capabilities:` in role frontmatter
**Notes:** Roles already carry `kind:` / `tier:` frontmatter, so this follows an existing convention. Avoids baking one host CLI's vocabulary into portable kit content.

### Q3 — Where does the adapter `description` come from?

| Option | Description | Selected |
|--------|-------------|----------|
| Derived from `## One job` + `## Activates when` | Both already exist in all 17 roles and are already written as routing triggers. | ✓ |
| New `description:` frontmatter key | One purpose-written routing sentence per role. | |
| Generator-held per-role text | The generator carries the descriptions. | |

**User's choice:** Derived from `## One job` + `## Activates when`
**Notes:** Zero new authoring, zero drift; editing the role updates the adapter.

---

## orchestrator.md trim

### Q1 — How much trim does `orchestrator.md` need in Phase 27?

| Option | Description | Selected |
|--------|-------------|----------|
| Below the WARN tier, 7165B | ~400B of trim. Restores the guard's two-tier meaning — WARN is currently already breached. | ✓ |
| Net-negative, no fixed target | Trim opportunistically, assert the file ends smaller. | |
| Hold at ≤7562B, defer trim to Phase 29 | Assert no growth only. | |

**User's choice:** Below the WARN tier, 7165B
**Notes:** Scouting found the spawn instruction already exists at Responsibility 4 and becomes capability-keyed at roughly equal length, and the 16-name allowlist never enters this file — so the bytes needed for "spawn text" are ≈ 0. The trim is about restoring margin, not making room.

### Q2 — Where do the trimmed bytes come from?

| Option | Description | Selected |
|--------|-------------|----------|
| Prose tightening in place | Compress sentences across sections, relocate nothing. | ✓ |
| Extract the routing matrix (1188B) | Move the 16-row subtask→role table into a referenced kit file. | |
| Extract WIP/DoR + XL-split subsections | Remove detail duplicated in checklists and workflows. | |

**User's choice:** Prose tightening in place
**Notes:** Avoids inventing a ceiling for a new file and stays clear of Phase 29's LANG-05 de-dup targets.

### Q3 — If any text IS relocated, what's required of the destination?

| Option | Description | Selected |
|--------|-------------|----------|
| Must gain a ceiling in the same change | Destination enters `ROLE_FILES` (or equivalent guarded set) with its own FAIL/WARN in the same commit. | ✓ |
| Guarded set derived, ceiling follows later | Baseline it during Phase 29's single re-baseline. | |
| No relocation at all this phase | Hard rule: trim in place only. | |

**User's choice:** Must gain a ceiling in the same change
**Notes:** `_role-switch-protocol.md` is not in `ROLE_FILES` and has no ceiling — extracting there would move bytes somewhere nothing measures them. Flagged and closed rather than used.

---

## Derivation reach

### Q1 — How does the installer learn which adapters/skills to lay down?

| Option | Description | Selected |
|--------|-------------|----------|
| Self-derive by readdir | `install.ts` readdirs the source `.claude/agents` and `.claude/skills`; uninstall mirrors it. No coupling to `scripts/`, no manifest. | ✓ |
| Import `scripts/kit-model.ts` | One authority everywhere, literally. | |
| Generated manifest file | Generator emits a committed adapter manifest. | |

**User's choice:** Self-derive by readdir
**Notes:** Separation of duty — the installer faithfully installs what exists; `kit-model` + the KIT-03 oracle guarantee at CI time that what exists is correct.

### Q2 — Which literals does Phase 27 re-point?

| Option | Description | Selected |
|--------|-------------|----------|
| Every enumerating literal except `roleCeiling` | The 4 in KIT-02 plus `ROLE_FILES`, `check-kit-refs` `SCAN`/`GH_SCAN`, and install/uninstall. | ✓ |
| Only what KIT-02 names + what area 2 forces | Tighter phase, two known-stale literals survive it. | |
| Everything including `roleCeiling` | Derive the ceiling table keys too. | |

**User's choice:** Every enumerating literal except `roleCeiling`
**Notes:** Matches success criterion 1's "no stale literal survives." `roleCeiling()` is a measurement baseline rather than a discovery set and already fails closed on an unknown role — deliberately left alone, and that is recorded so a later phase does not weaken it.

### Q3 — How do we prove no stale enumerating literal survived?

| Option | Description | Selected |
|--------|-------------|----------|
| Recorded inventory + per-consumer assertion | The literal inventory becomes a committed record; each consumer gets a test asserting its set comes from `kit-model`. | ✓ |
| Mechanical literal detector guard | A guard flagging any ≥3-element string array of role/workflow filenames outside `kit-model`. | |
| Both | Inventory as record, detector as tripwire. | |

**User's choice:** Recorded inventory + per-consumer assertion
**Notes:** The detector option would itself be a heuristic capable of being a strict subset — the pattern the v2.0 closure doctrine warns about.

---

## Asserted-count semantics

### Q1 — What shape does the asserted count take?

| Option | Description | Selected |
|--------|-------------|----------|
| Exact, both directions | 17 roles / 19 workflows exactly. Adding role #18 fails red and forces the author to walk the derived consumers. | ✓ |
| Floor / non-empty only | Assert the set isn't empty. | |
| No count — rely on KIT-03 | Set-equality already catches most drift. | |

**User's choice:** Exact, both directions
**Notes:** Framing agreed during discussion — the count defends against *vacuity* (empty set → every guard vacuously passes and looks green), not against additions. A count is not the drift class: the drift class is a list of names consumers read as truth; a count can only fail closed.

### Q2 — Where is the count enforced?

| Option | Description | Selected |
|--------|-------------|----------|
| Two-tier by severity | `kit-model` throws on vacuity (unsafe to continue); a guard fails red on exact-count mismatch (safe to continue, CI red). | ✓ |
| `kit-model` throws on any mismatch | Strictest; adding a role breaks every script until the constant is bumped. | |
| Test-only assertion | A vitest case asserts the counts. | |

**User's choice:** Two-tier by severity
**Notes:** Test-only was rejected because a consumer running against an empty dir at runtime would still pass silently — the failure being defended against.

### Q3 — How does `kit-model` resolve which kit root to read?

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit root argument | `listRoles(kitRoot)` / `listWorkflows(kitRoot)` defaulting to script-relative repo root; each consumer passes the root it already resolved. | ✓ |
| Own env var with fallback | `kit-model` reads its own `KIT_MODEL_ROOT`. | |
| Repo-root only | Validator keeps its own resolution for the installed two-root case. | |

**User's choice:** Explicit root argument
**Notes:** The tree already has three root conventions (`VALIDATE_ROOT` + `VALIDATE_KIT_ROOT` in the validator; `CHECK_ROOT` in the two guards). `kit-model` must not invent a fourth.

---

## guard_adapter_body vocabulary

### Q1 (first pass) — What vocabulary does `guard_adapter_body` ban?

| Option | Description | Selected |
|--------|-------------|----------|
| Handoff vocabulary only | "handoff packet", "handoff is the only memory", `agent-factory/handoffs/` and near variants. | |
| Handoff + single-window phrasing | Follows the requirement's wording literally. | |
| Handoff vocabulary + a positive assertion | Ban the dead terms AND assert every adapter names the shared verified context. | |

**User's choice:** Free-text — *"Didn't we steer away from handoffs and have unified memory?"*
**Notes:** The user challenged the premise rather than picking. Answered in prose: handoffs are gone and the shared verified context is the sole memory — nothing here reopens that; the guard exists only to keep a v2.0 deletion deleted. Clarified the three-way distinction the requirement's "handoff/single-window prose" wording conflates: `handoff packet` and `the handoff is the only memory` are dead, but `one window, drop prior context` describes *execution topology*, is still correct, is verbatim in the packaging template, and was just made the Claude Code degrade path. Question re-asked in the sharper form below.

### Q1 (re-asked) — Given handoffs are gone and memory is unified, what shape should the guard take?

| Option | Description | Selected |
|--------|-------------|----------|
| Both directions | Ban the dead handoff terms AND assert every adapter body names the shared verified context as its memory. | ✓ |
| Positive assertion only | Assert each adapter names the shared verified context; drop the banned-word list. | |
| Banned terms only | Just the dead handoff vocabulary, no positive check. | |

**User's choice:** Both directions
**Notes:** The positive half catches an adapter gone stale by omission and does not depend on having guessed every dead phrase.

### Q2 — Where does the dead-vocabulary list live?

| Option | Description | Selected |
|--------|-------------|----------|
| One shared exported list | A single dead-vocabulary source (path forms + prose forms) consumed by both `check-kit-refs` Assertion 2 and `guard_adapter_body`. | ✓ |
| Local to `guard_adapter_body` | The new guard carries its own list. | |
| Fold entirely into `check-kit-refs` | No new guard at all. | |

**User's choice:** One shared exported list
**Notes:** The two checks are genuinely different predicates (Assertion 2 greps the path `agent-factory/handoffs/`; the surviving `:25` line contains no path), so a second check is justified — a second list is not.

### Q3 — What does the guard scan?

| Option | Description | Selected |
|--------|-------------|----------|
| Derived adapters + packaging template | All 17 generated adapters plus the 7 skills, plus `agent-factory/packaging/subagent.frontmatter.md`. | ✓ |
| Derived adapter set only | Exactly what the requirement says: adapter bodies. | |
| Adapters + templates + role files | Widest net. | |

**User's choice:** Derived adapters + packaging template
**Notes:** The template is the upstream source, so a regression there is caught before it propagates through the generator. Role files were excluded to avoid overlapping Phase 28's audit and Phase 29's rewrite.

---

## Claude's Discretion

- The specific sentences tightened in `orchestrator.md` to reach 7165B (target and method are decided; the edits are the implementer's, subject to not touching Phase 29's de-dup targets).
- The concrete `capabilities:` vocabulary and its per-role assignment.
- The generator's template mechanics and file layout, provided output stays a thin pointer and is byte-gated.

## Deferred Ideas

- **Plugin-form adapters** — whether the 17 adapters ship in `.claude-plugin/` form; plugin agents ignore `hooks`/`mcpServers`/`permissionMode` and the plugin cache does not copy files outside the plugin dir. Offered as an optional discussion area; not selected.
- **KIT-03 RED-evidence methodology** — how the fail-red-on-today's-tree proof is recorded when the same phase turns it green (same question LANG-06 faces in Phase 29). Offered; not selected.
- **SPAWN-07 blast radius** — the inventory of every surface advertising the Claude Code floor plus the depth-5 `queue.wip_limit` rationale. In scope as a requirement; the surface walk was not done during discussion. Offered; not selected.
- **`CLAUDE.md` v2.0 drift** and **`agent-factory/handoffs/.gitkeep`** — belong to AUDIT-01/02 in Phase 28.
- **`roleCeiling()` re-baselining** — Phase 29 (LANG-08) re-baselines ceilings once at end of phase.

## Open Questions Flagged for Research

1. `UNKNOWN - verify`: is a skill's `allowed-tools: Agent(a, b, c)` honored as a scoped grant in the main thread? Decides whether `/grug` degrades as the norm or as a fallback.
2. Main-thread coordinator wiring validated against the real installed/materialized adapter flow.
3. Confirm no other assertion or test pins the "exactly three `$GRUGOPS_HOME` sites" count.
4. Confirm the depth/width caps (depth 3 on v2.1.219+, 200 per session, 20 concurrent) against grugops's width cap of 3, and correct the `queue.wip_limit` rationale text.
