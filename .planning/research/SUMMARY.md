# Project Research Summary

**Project:** grugops
**Milestone:** v2.1 Autonomous Factory — Real Spawning, Controlled Language & Live Board
**Domain:** File-based agent factory (markdown kit + zero-runtime-dependency TypeScript tooling layer compiled to committed `.js`)
**Researched:** 2026-07-28
**Confidence:** MEDIUM-HIGH — HIGH on grugops-internal facts (every claim grounded in a file read this session, with line numbers), HIGH on Node/Claude Code/npm-registry facts (official docs, live registry checks), MEDIUM on ASD-STE100 evidence and some UX/perf recommendations, LOW on the board row grammar in the wild (unmeasured), and explicitly `UNKNOWN - verify` on ASD-STE100 dictionary redistribution rights and on whether controlled language helps LLM comprehension at all.

---

## Executive Summary

grugops has a **systemic "hard-coded set literal drifts silently green" defect**, and all four researchers converged on it independently. `guard_caveman_preserved` measures sentence shape (`>=2 lines starting with You`) instead of voice, so all 17 role blocks drifted to zero `grug` occurrences while the guard stayed green for a full milestone. `validate-agent-factory.ts` hard-codes 14 workflows (19 exist) and 16 roles (17 exist — `frontend-ui` missing). `check-foundation-guards.ts`'s `CTX_WORKFLOWS` lists 16 of 19 workflows, leaving the three context-I/O workflows unguarded. `guard_wr05`'s scan set is a hard-coded 4-file list, so the 17 new role adapters this milestone must add would land entirely outside the spawn-grant guard. v2.0's "grep-to-zero" handoff removal left a live reference in `.claude/agents/grugops-orchestrator.md:25`. And `guard_wr05` itself asserts a frontmatter token (`Agent(role-list)`) that Claude Code's runtime **ignores** on the subagent invocation path — the allowlist only binds when the coordinator runs as the main thread. This is the v2.0 closure doctrine ("one format-aware authority per predicate; a heuristic that is a strict subset of the real grammar makes the format the attack surface") recurring in a new shape: not a too-narrow parser, but a hand-maintained **list** that rots as the corpus grows. The confirmed root cause of the reported spawn defect is exactly this: the orchestrator's `Agent(...)` grant names 7 roles, 0 of which exist as adapter files, and the guard that should have caught this checks only 4 hard-coded files.

The recommended approach is: **derive every set from the filesystem, assert equality/count rather than membership, and generate rather than hand-author anything that must stay in sync with a derived set.** Concretely — a `scripts/kit-model.ts` becomes the sole authority for "what roles/workflows exist" (replacing 5 independent stale lists); the 17 missing role adapters are **generated** from a single template + `kit-model.listRoles()`, gated by a byte-freshness check (the same pattern already proven three times in this repo — `generate-catalog`, `trace-render`, `claim.js now-running`); `guard_wr05` gains a referential-integrity check that enumerates both the grant and the adapter directory and asserts set equality; and the coordinator must be wired as the Claude Code **main-thread** agent (`--agent` / `settings.json`), because a parenthesized `Agent(...)` allowlist inside a subagent definition is silently ignored by the runtime. Zero new runtime dependencies are needed anywhere in this milestone — the dashboard, the STE guard, and the browser-testing lane are all achievable on Node 22 stdlib plus an `npx`-invoked, never-installed Playwright MCP server.

The key risks are: (1) shipping the dashboard before spawn works, producing a demo of the defect (the "active agents" pane is empty until role agents actually spawn); (2) treating the four safety floors' "agent-unsettable" opt-in as a single env-var mechanism, when two floors are hook-enforced (un-forgeable) and two are in-process (env-forgeable by the agent's own child process) — applying one mechanism to all four recreates the exact heuristic-subset failure the closure doctrine exists to prevent; (3) claiming ASD-STE100 conformance from a guard that can only mechanically check a decidable subset (sentence length, banned constructions, approved words) while STE's core value (one-topic-per-sentence, clarity) is not machine-decidable — no guard may claim more than its grammar decides; and (4) accepting an agent's browser-driven narration ("I saw the toast, it passed") as UAT evidence — the verdict must always be a tool return value or a generated Playwright spec re-run by the existing §14 gate, never prose.

---

## Key Findings

### Recommended Stack

**Net change to `package.json`: none required.** Three of the four new capabilities need zero new dependencies; the fourth (agent-driven browser testing) needs a package the user's own agent fetches via `npx` — never a grugops dependency.

**Core technologies:**
- `node:fs.watch({recursive:true})` + `node:fs.watchFile` fallback + `node:util.styleText` + `node:readline` cursor APIs + `node:util.parseArgs` — the entire board-dashboard stack, stdlib-only, zero deps, cross-platform (recursive watch works on macOS/Linux/Windows since Node v19.1.0, comfortably below grugops's Node 22+ floor).
- `@playwright/mcp@0.0.78` via `npx` (pre-1.0, pin it) — used to **author** browser test specs; the committed `.spec.ts` (run by the existing §14 gate via `@playwright/test`) is the actual evidence artifact, never the MCP transcript.
- Claude in Chrome (built-in Claude Code MCP) — attended-only, cannot run headless, force-disabled under API-key/`setup-token` auth, Claude-Code-only. Legitimate only as `verified_by: <named human>` evidence for authenticated third-party SaaS UAT; never `§14-gate` evidence.
- A hand-written stdlib TypeScript `guard_ste` — no open-source ASD-STE100 checker exists, and the ~900-word dictionary carries no published redistribution grant (assume NO). Build an original, grugops-authored "STE-derived" writing profile instead of vendoring the standard.
- No new TUI library, no chokidar, no chalk/commander — all rejected because Node 22 stdlib already covers everything they'd provide, and every one breaks the zero-runtime-dependency promise.

**Why recommended:** every alternative considered (blessed, ink, chokidar, Vale, retext, textlint, proselint, LanguageTool) either ships an unmaintained/heavy dependency, forces `npm install` onto host machines, or introduces a second language runtime — all hard violations of grugops's foundational constraint.

### Expected Features

**Must have (table stakes, P1):**
- Checkpoint enumeration — the named list of every human stop (cross-checked against 18 roles + 19 workflows + the prod-deploy hook).
- Per-checkpoint matrix: ternary (`block`/`notify`/`off`), fail-closed on unknown values, safe defaults, timeout→deny never timeout→proceed.
- Named-human opt-in for lowering a floor, agent-unsettable, recorded in the trace — the safety invariant of the milestone.
- **Claim-dropping** when a floor is lowered — the strongest idea in the milestone: a gate report that asserted "test integrity enforced" must instead read "test integrity: notify-only (lowered by <human> on <date>)". No comparable system (GitHub, GitLab, Temporal, LangGraph, PAM break-glass) does this.
- Board/state projector: ONE authority, typed snapshot, `--json`, byte-deterministic test.
- CLI dashboard: columns + WIP, tickets, queue depth, active agents, blocked, gate status, autonomy banner; directory-watch + debounce + polling fallback; read-only by construction (no write capability compiled in, verified by an import-graph guard).
- STE-derived writing profile, enumerated and surface-scoped (caveman fence exempt), + `guard_ste` named for exactly the decidable subset it checks.
- Rebuilt voice guard measuring lexical density (must FAIL RED on today's 17 blocks as acceptance evidence of the rebuild).
- Agent exploratory UAT on the Playwright lane, tool-written artifacts, artifact provenance (path + content hash) in the note, deterministic judge, loud skip.

**Should have (differentiators, P2):** verification badges on notes/tickets; parallel/sequential mode indicator; WIP-violation/stale-claim highlighting; drill-down + filter; break-glass time-boxing on a lowered floor.

**Defer (v2.2+):** full ASD-STE100 dictionary conformance (needs a commercial checker and a license posture grugops doesn't have); a web renderer over the same typed snapshot (design for it now, build it later — the projector *is* the seam); an approval-inbox UI (a write path into a safety gate — permanently rejected, not just deferred); empirical measurement of whether the writing profile actually helps agents (name the `UNKNOWN - verify`, don't resolve it by assertion).

### Architecture Approach

The milestone is corrective, not architectural: the shared verified context, the queue, and the parallel/sequential dual path are unchanged. Every new capability attaches at a well-defined seam. **`scripts/kit-model.ts` (NEW)** becomes the sole authority for "what roles/workflows exist," replacing 5 independently-drifted lists. **`scripts/board-model.ts` (NEW)** becomes the sole authority for factory state — parses board columns/WIP/rows, ticket frontmatter, joins queue + context notes + trace, emits one typed `FactorySnapshot` (with `generatedAt` as the only nondeterministic field, `conflicts[]` surfacing board-vs-frontmatter disagreement rather than resolving it silently, and `diagnostics[]` as the only degrade channel). **`scripts/board-dashboard.ts` (NEW)** is a separate, read-only, never-load-bearing renderer consuming that snapshot. **`scripts/generate-role-adapters.ts` (NEW)** emits all 17 `.claude/agents/grugops-<role>.md` pointer adapters plus the coordinator's derived `Agent(...)` allowlist, gated by a standalone `adapters-freshness.ts` (mirroring the D-07 precedent of never folding a domain freshness check into the aggregator). **`scripts/autonomy-model.ts` (NEW)** is the sole floor registry (checkpoint id → default → enforcement tier → env key → the public claim it backs), consumed identically by both hooks and the dashboard — "the hook defines no classifier of its own" is the discipline that closed Phase 25 in 8 rounds and must be reused, not rederived.

**Major components:**
1. `kit-model.ts` — set-discovery authority (roles, workflows). Unblocks the guard-derivation fix and the adapter generator; must land first (Phase A / 27).
2. `board-model.ts` + `board-dashboard.ts` — read model + renderer, read-only by structural construction, never a second board grammar (the existing validator parser must be **deleted**, not duplicated).
3. `generate-role-adapters.ts` + `adapters-freshness.ts` — the generated, byte-gated spawn-adapter set, replacing the hand-authored single-file defect.
4. `autonomy-model.ts` — the floor registry with two-tier enforcement: hook-enforced (prod deploy, protected merge) is un-forgeable because the hook process is not the agent's child; in-process (test-integrity today) is forgeable by the agent's own `Bash` child and must either move to the point of effect (`emitVerdict()` refuses GREEN) or be honestly labelled weaker — never silently treated as equally strong.

### Critical Pitfalls

1. **Fixing spawn with a guard that shares the bug's blind spot** — a token/membership check passes even when 0 of 7 granted names resolve to files. Fix: a referential-integrity oracle asserting *set equality* between the grant, the adapter directory, and the role corpus — built and proven RED against today's tree *before* authoring the 17 adapters.
2. **The adapter body stays unguarded** — size/token guards exist, none read prose, so stale handoff-era text ("the handoff is the only memory") survives another "grep-to-zero." Fix: generate the adapter body from single-source role text + a byte-freshness gate, making staleness unrepresentable rather than merely undetected.
3. **A parse failure that fails OPEN, already present in this codebase** — `readGovernanceConfig()`'s `catch` returns the lean/permissive default, so an unreadable config silently disables governance; a second reader (`readGovernanceConfigResult`) was added as a workaround rather than collapsing to one authority. Fix: one discriminated-result config reader (`absent`/`present`/`unreadable`), where absent is the only permissive branch and unreadable is always strictest.
4. **A second board grammar** — the highest-probability repeat of the documented failure class. The dashboard must never author its own parser; `board-model.ts` must be the single authority the validator also consumes (deleting its inline regexes), including reuse of the hard-won WR-03 prefix-match fix.
5. **Claiming ASD-STE100 conformance a guard cannot mechanically verify** — STE's clarity/one-topic-per-sentence rules are not decidable; a guard checking 6 rules while claiming to enforce 53 is exactly the `guard_caveman_preserved` mistake with new vocabulary. Fix: name the guard for its decidable subset only, and route the non-decidable remainder to human Tier-3 sign-off.

---

## Cross-Cutting Finding and Its Phase-Ordering Implication

**The set-authority fix is foundation work and must precede adding the 17 role adapters, or the new files land outside every guard that should protect them.** Concretely: if the 17 adapters are authored before `WR05_SCAN`, `ADAPTERS`, `CTX_WORKFLOWS`, and the role/workflow lists in `validate-agent-factory.ts` are derived from the filesystem, then (a) a planted `Agent(...)` grant in a non-coordinator adapter would pass `guard_wr05` green because the scan set only covers 4 files, and (b) `check-foundation-guards.ts`'s `guard_context_writes` would remain blind to whichever workflows happen not to be on its hard-coded list. This is not a hypothetical ordering preference — it is the mechanism by which the *current* spawn defect went undetected for a milestone, and repeating the same sequence (adapters first, guard-scan-set fix later, "for now") reproduces the same silent-green failure with a different set of names.

## Disagreement Reconciled: Does the Dashboard Create a Second Board Parser?

ARCHITECTURE.md and PITFALLS.md appear to disagree, and the disagreement is real but resolvable by looking at *what* the existing parser at `validate-agent-factory.ts:419-443` actually does.

- **PITFALLS.md's framing** ("a board grammar already exists... including a WR-03 prefix-match hardening") is correct as a warning: *a* grammar exists, it was hardened once (word-prefix matching let column `In` match `## In Development (WIP 0/3)`), and a naive second implementation would not inherit that fix.
- **ARCHITECTURE.md's framing** ("the validator parses column headings only... the row grammar would be a FIRST authority") is correct as a precise read of the code: the existing parser reads **column headings only** — it never reads a ticket row, never reads the `(WIP n/m)` numbers, and never reads the `## Columns` table. Two of the three sub-formats the dashboard needs (row grammar, WIP-number extraction) have **zero** existing authority; only the column-heading predicate has one.

**Resolution (not a decision left open — the doctrine settles it): both are right about different sub-predicates, and the fix is the same either way.** Extract the column-heading parser into `board-model.ts` and **delete** the validator's inline copy (porting the WR-03 fix verbatim, never redesigning it) — this satisfies PITFALLS.md's warning. Let `board-model.ts` be the **first** authority for the row grammar and the WIP-number extraction, pinned by a written grammar and a parse-oracle fuzz suite (round-trip property test + adversarial corpus including the board's own large HTML-comment documentation block, which a naive parser would read as live state) **before** anything consumes it — this satisfies ARCHITECTURE.md's framing. In both cases the rule is identical: one module owns every board sub-grammar, and every other consumer (validator, dashboard, a future web renderer) imports it. There is no real disagreement about the *destination*; the two files were describing different sub-formats of the same file.

---

## Honesty Findings (preserved without softening)

- **No evidence controlled language improves LLM comprehension.** The mechanism (fewer word senses, shorter sentences, no telegraphic omission) is plausible; no study establishes it for agent-read documentation. `UNKNOWN - verify` — do not ship this claim.
- **STE likely INCREASES token count**, the reverse of what a naive pitch would assume: STE's "do not omit articles/subjects" rule directly fights telegraphic caveman style and produces longer, not shorter, text. STE must never be sold as a token-economy win — the same mistake the kickoff measurement already caught once (caveman-as-token-economy did not survive contact with the artifact).
- **STE conformance is not mechanically decidable.** No free or commercial checker can guarantee full compliance; ASD's own community says clarity requires human judgment. `guard_ste` must be named for its decidable subset (approved-word membership, POS restriction, sentence/paragraph length, banned constructions) — never named `guard_ste` unqualified if that implies full conformance, and never described as enforcing "ASD-STE100."
- **ASD-STE100 dictionary redistribution rights are `UNKNOWN - verify` — assume NO.** `asd-ste100.org` carries an explicit "© Copyright 2026 STEMG - All Rights Reserved" notice with no published licence grant, despite a contradictory "open-source" claim elsewhere on ASD's own site. Prior art (two public GitHub skills) both paraphrase the rules, refuse to reproduce the dictionary, and ship a non-affiliation + not-certified disclaimer — grugops should do the same: an original, grugops-authored "derived" profile, never a vendored copy.
- **Claude in Chrome cannot be gate evidence.** It requires a visible, attended browser window, is force-disabled under API-key/`setup-token` auth, is unavailable via Bedrock/Vertex/Foundry, is not supported in WSL, and is Claude-Code-only (breaking parity with the other four host CLIs). Its only legitimate role is `verified_by: <named human>` — a human sat there and watched — never a `§14-gate` stamp.

---

## Concrete Numbers Carried Forward

- `orchestrator.md` is **7562 bytes** against a **7570-byte hard FAIL ceiling** — **8 bytes** of margin, and every v2.1 feature (spawn allowlist, autonomy matrix, STE pointer, dashboard mention) adds text to it. It must be trimmed or split **before** any phase adds to it, not after a build goes red. The WARN threshold is 7165 B.
- Claude Code nested-subagent-spawn depth: **v2.1.172–216 → depth 5** (fixed); **v2.1.217–218 → depth 1 (nesting effectively OFF, a silent-degrade window)**; **v2.1.219+ → depth 3 (default, changeable via `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`)**. grugops's queue `wip_limit` rationale, currently written against "the platform caps depth at 5," is stale and should be restated against depth 3, with the 217–218 window documented as a known-bad range to detect and degrade loudly from (not treated as identical to the reported spawn defect, though it produces the same observable symptom).
- Playwright pins: the kit's existing §14 gate templates pin **`@playwright/test` 1.60.0 / `@axe-core/playwright` 4.11.3**; current registry versions (verified 2026-07-28) are **1.62.0 / 4.12.1**. Refresh during the kit consistency audit (Phase 28).
- Session/concurrency caps to record: **200 subagents per session** (v2.1.212+) and **20 concurrent** (v2.1.217+) — grugops's width cap of 3 sits comfortably inside both.

---

## Zero New Runtime Dependencies — Confirmed

**Net change to `package.json`: none.** The existing dev-only set (`typescript ~6.0.3`, `vitest ~4.1.8`, `@types/node ~22`) is sufficient for the entire milestone. The board dashboard runs on Node 22 stdlib alone (`fs.watch`/`watchFile`, `util.styleText`, `readline` cursor APIs, `util.parseArgs`); `guard_ste` is hand-written stdlib TypeScript; the browser-testing lane uses `@playwright/mcp@0.0.78`, which is `npx`-invoked by the user's own agent and never enters grugops's `package.json` or a host `node_modules` the project owns. This is the stated headline verdict of the stack research and should be treated as settled, not as an open question for the roadmapper.

---

## Implications for Roadmap

Research converges on a single dependency-ordered build spine. Phase numbers below are **recommendations**; v2.1 phases start at 27 (v2.0 ended at 26). The roadmapper assigns final numbers, but the *ordering* is the load-bearing recommendation from three independent researchers (architecture, pitfalls, and the kickoff-findings dependency graph in features).

### Phase 27: Spawn Correctness & Adapter Integrity (+ Kit-Set Authority)
**Rationale:** This is the milestone's reason for existing, the confirmed root-cause defect, and the prerequisite for the GAP-D1 captured-live-run obligation open since v1.0. It must also land before the STE rewrite touches adapter bodies (so that rewrite regenerates adapters once, rather than fighting a hand-maintained set), and before the dashboard (whose "active agents" pane is empty and misleading until spawning genuinely works).
**Delivers:** `scripts/kit-model.ts` (sole role/workflow-set authority, replacing 5 stale hard-coded lists); derived `WR05_SCAN`/`ADAPTERS`/`CTX_WORKFLOWS`/role-and-workflow lists in the validator and guards; `scripts/generate-role-adapters.ts` generating all 17 `.claude/agents/grugops-<role>.md` pointer adapters + the coordinator's derived `Agent(...)` allowlist from a single template; `adapters-freshness.ts` (byte-gated); a referential-integrity oracle asserting set equality between the grant, the adapter directory, and the role corpus (must FAIL RED against today's tree — one file, seven missing names — before it is trusted); `guard_adapter_body` as defense-in-depth (never the structural fix) against stale handoff prose; the coordinator wired as the Claude Code **main-thread** agent (not a subagent) so its `Agent(...)` allowlist is actually honored by the runtime; `orchestrator.md` trimmed below its 7570 B FAIL ceiling before this phase adds spawn-allowlist text to it.
**Addresses:** Spawn correctness (all three stacked causes named at kickoff); the referential-integrity gap in `guard_wr05`.
**Avoids:** P-01 (guard sharing the bug's blind spot), P-02 (unguarded adapter body), P-27 (orchestrator crossing FAIL ceiling mid-milestone), and the cross-cutting hard-coded-list defect generally.

### Phase 28: Kit Consistency Audit
**Rationale:** Produces the exclusion list, the derived scan sets, and the public-claim inventory the controlled-language rewrite needs as *inputs*. Doing the audit first avoids rewriting text the audit will then flag as wrong, and avoids the STE guard fighting a still-stale `CTX_WORKFLOWS`.
**Delivers:** A real pass over all 18 roles + 19 workflows for correctness and strangeness; the `CLAUDE.md` drift (still describes handoff packets and a routing Orchestrator, both removed in v2.0) reconciled; `CTX_WORKFLOWS` derived via `readdirSync` with a count assertion; a registry of every public safety claim in README/AGENTS.md/agent-factory/README.md, each given an id so Phase 30's claim-dropping mechanism has something to void.
**Addresses:** The kit consistency audit target feature; sets up claim-dropping (autonomy matrix) and the STE exclusion list (controlled language).
**Avoids:** P-09 (claims outliving the guarantee), P-18 (scan-set rot), P-26 (freshness-gate vacuous-pass trap).

### Phase 29: Controlled Language (STE-Derived Profile + Voice Guard Rebuild)
**Rationale:** Must follow the audit (needs the exclusion list and derived scan sets) and must precede the autonomy matrix (rewriting freshly-written governance prose a phase later would mean re-running the expensive red-team gate on text that changed again).
**Delivers:** A grugops-authored, ASD-STE100-**derived** writing profile (never a copy of the dictionary), enumerated and explicitly surface-scoped (caveman fence exempt, safety-surface exclusion list honored: workflow 05's emission/admission paragraphs, workflow 16, workflow 15 + ASVS checklist, prod-deploy prose); `guard_ste` named for exactly its decidable subset; role-skeleton de-duplication ("say each thing once"); the voice guard rebuilt to measure lexical density against a committed lexicon (must FAIL RED on all 17 current blocks as acceptance evidence, then publish a number with a denominator); a single end-of-phase byte-ceiling re-baseline (every file ≤ its old value, delta recorded — never raised mid-phase).
**Addresses:** Controlled language split by surface; de-duplicated role skeleton; rebuilt voice guard.
**Avoids:** P-14 (unverifiable STE conformance claim), P-15 (semantic drift in safety text), P-16 (broken ceilings/oracles/references), P-17 (voice guard rebuilt as another shape-heuristic).

### Phase 30: Per-Checkpoint Autonomy Matrix
**Rationale:** The direct successor to Phase 25 (8 rounds, 2 independent red-teams, the hardest phase in the project) and touches the four hardest floors in the product. Sequenced after 29 because it should not be rewritten by the controlled-language pass a phase later.
**Delivers:** Checkpoint enumeration (from the ~17 `## Stop conditions` + role `## Hard limits` sections); a per-checkpoint ternary matrix (`block`/`notify`/`off`) with fail-closed unknown-value handling and a closed, exported, compile-time-exhaustive checkpoint set (so a new checkpoint without a default is a compile error); a two-key floor-lowering design — declaration in config (agent-writable, form-checked only) and authorization via a per-floor session env var the hook process reads fresh (agent-unwritable) — never a blanket grant; the hook-vs-in-process tier split honored explicitly (test-integrity moved to the point of effect in `emitVerdict()`, not given a false-equivalent env-var mechanism); claim-dropping wired through a generated guarantees render + a per-run banner naming every non-default checkpoint; a single discriminated-result config reader collapsing `readGovernanceConfig`/`readGovernanceConfigResult` into one authority.
**Addresses:** Per-checkpoint autonomy — settable, never silently; the two ratified constraint changes (floors become dialable behind a named-human opt-in, never deleted).
**Avoids:** P-05 (config parse fails open), P-06 (default-open on typo/new checkpoint), P-07 (agent writes the config that governs it), P-08 (env-var opt-in the agent's own subprocess can set), P-09 (claim outlives the guarantee).

### Phase 31: Autonomous Manual Testing (feeding UAT)
**Rationale:** Browser evidence must enter through the verify-before-write path, and Phase 30 is where that path's dialability (including any lowering of the `verify_before_write` floor) is settled. Evidence written against a floor whose semantics change a phase later would need to be re-derived.
**Delivers:** Playwright as the machine-verifiable floor (spec-as-evidence, re-run by the existing §14 gate — never the agent's narration, never an MCP tool-transcript as the stamp); Claude in Chrome as an optional, clearly-labelled `verified_by:<human>` lane, never gate evidence; artifact provenance (evidence note carries the commit SHA + gate-run id + content hash, refusing any note whose SHA is not the HEAD the gate ran against); a probe-then-loud-skip pattern (reusing the existing Tier-2 convention verbatim) so an absent browser leaves the UAT `pending`, never a silent pass; conditional/caught assertions banned in generated specs, checked over the TS AST (not a regex, or the claim is over-stated).
**Addresses:** Autonomous manual testing feeding UAT; evidence entering through verify-before-write.
**Avoids:** P-10 (hallucinated assertion / narrated pass), P-11 (phantom run reported green), P-12 (evidence unbound to a commit/run), P-13 (flaky selector misread as product failure or silent no-op pass).

### Phase 32: Board Projector & CLI Dashboard
**Rationale:** Read-only, non-load-bearing, and depends on the board/ticket/queue state surfaces being stable (post-Phase-28 audit) and on the autonomy matrix existing (for the autonomy banner). Lowest-risk place to end the feature work — a defect here cannot compromise a safety invariant by construction.
**Delivers:** `board-model.ts` (single authority for board headings — extracted from and replacing the validator's inline parser — plus a **new** ticket-row grammar, pinned by a written spec and a parse-oracle fuzz suite, since none exists today beyond disagreeing HTML-comment examples); a typed `FactorySnapshot` with `conflicts[]` surfacing board-vs-frontmatter disagreement rather than resolving it; `board-dashboard.ts` as a separate process (directory-level `fs.watch` + mandatory polling floor + debounce, since grugops's own atomic-rename write path silently orphans a file-level watch); torn-read handling (read-verify-reread, last-good-snapshot-plus-stale-badge, never render a partial parse or an ENOENT-as-empty); an import-graph guard proving the dashboard module tree holds no mutating `node:fs` symbol (mechanically enforcing read-only, not just asserting it in prose); non-TTY/CI plain-text + `--json` + `--once` modes; a soak test for handle/memory flatness.
**Addresses:** Board projector + CLI dashboard target feature; the ratified read-only-derived-local-view constraint amendment.
**Avoids:** P-19 (second board grammar — resolved per the reconciliation above), P-20 (torn reads), P-21 (`fs.watch` unreliability with no polling floor), P-22 (watcher/memory leaks), P-23 (terminal rendering hazards), P-24 (scope creep into a write-capable controller), P-25 (board/ticket/queue disagreement resolved silently instead of surfaced).

### Phase 33: Live Capture & Windows Portability
**Rationale:** Both items are *proofs about the whole milestone*, not features, and both need everything else in place. This also discharges GAP-D1, the project's oldest open item (carried since v1.0).
**Delivers:** The one captured live dual-path run needed to flip A3/DOG-02 (an authed Tier-2 run or a completed dogfood-runbook with date + verdict — a loud skip is never a capture); the coupled `examples/03-ticket-to-pr.md` cleanup; the `windows-latest` CI leg turned green (path-assertion normalization, symlink-fixture privilege guard, the old-layout migrate fixture, the temp-dir `tsc` mirror-rebuild fix) — relevant because `fs.watch` (Phase 32) is a first-class Windows surface and this phase's fix directly unblocks that dependency.
**Addresses:** GAP-D1 (standing obligation #1); Windows-portability pass (standing obligation #2).
**Avoids:** P-04 (vacuous spawn proof — a green suite asserted as a capture).

### Phase Ordering Rationale

- **27 before everything** — the spawn defect is the milestone's reason for existing; it blocks the GAP-D1 capture open since v1.0; every later phase's evidence (autonomy trace, UAT notes, dashboard active-agents pane) is more trustworthy once role agents genuinely run rather than silently completing inline.
- **28 before 29** — the audit produces the exclusion list, derived scan sets, and claim inventory the STE rewrite needs as inputs; rewriting first means re-rewriting text the audit would have flagged.
- **29 before 30** — the STE rewrite touches config prose and role text; doing it after the autonomy matrix lands means rewriting freshly-written governance text and re-running the expensive Phase-25-successor red-team gate a second time.
- **30 is deliberately the expensive phase** — it is the direct successor to Phase 25 (8 rounds, the hardest phase in the project) and touches the four hardest floors. Budget red-team rounds explicitly as scope, not overrun.
- **31 after 30** — browser evidence enters through verify-before-write, and 30 is where that path's dialability is settled; evidence written against a floor whose semantics change a phase later must be re-derived.
- **32 last among features** — read-only, non-load-bearing, lowest blast radius, and benefits from 28's stabilized state surfaces.
- **33 last overall** — both items are milestone-wide proofs, not features, and need everything else in place first.

### Research Flags

Phases likely needing deeper research during planning (`--research-phase`):
- **Phase 27:** The Claude Code main-thread-vs-subagent coordinator wiring (`--agent` flag / `settings.json` `{"agent": ...}`) needs to be validated against the actual installed adapter/materialization flow (`install.ts`'s `materializeAdapter()`); this is a genuine platform-schema integration point, not a pattern grugops has used before.
- **Phase 30:** The floor-lowering two-key mechanism (declaration-in-config + authorization-in-session-env) and the `test_integrity`-to-point-of-effect move touch `emitVerdict()`, a byte-frozen safety path — this deserves its own red-team round per the architecture research's explicit flag, separate from the rest of the phase.
- **Phase 31:** Whether `mcp__claude-in-chrome__*` tools are reachable from inside a subagent is explicitly `UNKNOWN - verify` in the stack research; verify before designing any UAT flow that assumes it (the Phase-31 recommendation does not depend on the answer, but a sub-feature might).
- **Phase 32:** The board ticket-row grammar is genuinely unmeasured in the wild (only two disagreeing HTML-comment examples exist) — sample real agent-written board rows before freezing the grammar, or the parser risks becoming the de-facto spec that agents then drift away from.

Phases with standard patterns (skip `--research-phase`):
- **Phase 28:** A straightforward audit-and-fix pass using patterns already established (`readdirSync`-derived scan sets, per-file conformance tracking) — no new external unknowns.
- **Phase 29 (mechanics, not the STE-conformance question):** The generate+freshness-gate pattern for byte-ceiling re-baselining and adapter-body generation is proven three times in this repo already.
- **Phase 33:** Both items are well-understood, previously-scoped standing obligations with concrete acceptance criteria already documented in PROJECT.md.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Every version verified against live npm registries or official docs on 2026-07-28; three items explicitly `UNKNOWN - verify` (WSL2 `fs.watch` behavior, whether Claude-in-Chrome MCP tools reach subagents, the ASD-STE100 redistribution grant). |
| Features | MEDIUM-HIGH overall — HIGH on areas 1–3 (dashboard, autonomy checkpoints, agent-UAT), explicitly LOW on Area 4's central evidence claim (controlled language improving LLM comprehension) | Mature, converging comparables for dashboard/HITL/agent-UAT design patterns (lazygit/k9s/gh-dash, GitHub Environments/GitLab/Temporal/LangGraph, the "agent explores, code judges" pattern). Area 4's core sales claim is honestly unsupported by any located study. |
| Architecture | HIGH on integration points, MEDIUM where a shape is designed rather than observed | Every integration claim grounded in a file read this session with line numbers (validator, guards, hooks, install/uninstall, orchestrator adapter). The `FactorySnapshot` type and the autonomy config schema are designed here and should be expected to churn (hence a `schemaVersion` field). |
| Pitfalls | HIGH on grugops-internal facts, HIGH on Node `fs.watch`/Claude Code platform caveats, MEDIUM on ASD-STE100 checker limits and agent-browser-evidence failure modes | Internal facts read directly from source this session with line numbers; external claims cross-checked across multiple sources but not all vendor-primary. |

**Overall confidence:** MEDIUM-HIGH. The internal, grugops-specific findings (the drifted lists, the spawn defect, the byte ceilings, the guard grammars) are HIGH confidence because they were read directly from source this session. The external claims that matter most for scope decisions (STE's evidence basis, redistribution rights) are honestly marked as unresolved rather than asserted, which is itself the correct posture for a no-fabrication project.

### Gaps to Address

- **ASD-STE100 dictionary redistribution rights** — `UNKNOWN - verify`, no published grant exists. Resolve by avoiding the question entirely: author an original derived profile rather than vendoring the dictionary (already the stack research's recommendation). Do not block the milestone on a written answer from STEMG.
- **Whether controlled language measurably helps LLM comprehension at all** — no study located. Do not ship this as a claim anywhere in the kit. Name it explicitly as an open, unresolved question (mirroring how `measure-cost.ts` already keeps the ~50% token-cost claim honestly `UNKNOWN - verify` from v2.0) rather than silently asserting or silently omitting it.
- **The board ticket-row grammar in the wild** — LOW confidence, unmeasured. Sample real agent-written board content during Phase 32 planning before freezing the pinned grammar.
- **`fs.watch` behavior under WSL2 with a Windows-drive-mounted repo (`/mnt/c/...`)** — not covered by Node's own docs. Treat as a network filesystem (force polling) until measured; folds into the Phase 33 Windows-portability obligation.
- **Whether Claude-in-Chrome MCP tools are reachable from inside a subagent** — the docs imply yes but do not state it for this specific combination. Verify before Phase 31 designs anything that depends on it; the phase's core recommendation (Playwright as the floor) does not depend on the answer.
- **Advertised Claude Code version floor** — a human decision is needed: advertise v2.1.219+ cleanly (narrows the supported base again) or support v2.1.172+ with a runtime check that detects the v2.1.217–218 depth-1 window and degrades loudly. Flag for the roadmapper/human at Phase 27 planning.

---

## Sources

### Primary (HIGH confidence)
- `code.claude.com/docs/en/sub-agents`, `/docs/en/chrome` — fetched 2026-07-28; complete subagent frontmatter schema, the `Agent(...)`-ignored-in-subagents rule, nesting-depth version history, `AskUserQuestion` unconditional removal, plugin-subagent field restrictions.
- Node.js v22/v24 `fs`/`util`/`readline` API docs (via Context7) — `fs.watch` caveats (inode rebinding, Windows directory-level monitoring, network-FS unreliability), `util.styleText`, `util.parseArgs`.
- Live `npm show` / GitHub releases (2026-07-28) — `@playwright/mcp` 0.0.78, `@playwright/test` 1.62.0, `@axe-core/playwright` 4.12.1, `blessed`/`ink`/`chokidar` version and maintenance status, Vale 3.15.2.
- Repo files read this session with line numbers: `scripts/validate-agent-factory.ts`, `scripts/check-foundation-guards.ts`, `scripts/context-io.ts`, `scripts/claim.ts`, `scripts/trace-render.ts`, `scripts/check-uat-oracles.ts`, `scripts/check-kit-refs.ts`, `hooks/guard.ts`, `hooks/admission-guard.ts`, `.claude/agents/grugops-orchestrator.md`, `agent-factory/packaging/subagent.frontmatter.md`, `agent-factory/seed/plans/board.md`, `.planning/PROJECT.md`.

### Secondary (MEDIUM confidence)
- `asd-ste100.org`, `asd-europe.org` — ASD-STE100 structure, licensing posture, the "open" vs "All Rights Reserved" contradiction.
- CI/CD HITL comparables — GitHub Actions Environments, GitLab protected environments, Argo CD, Temporal, LangGraph `interrupt()`.
- Agent-driven browser testing failure-mode literature — self-pass failure modes (assertion weakening, test deletion, behavioral fakery, state pollution), Playwright MCP vs Claude-in-Chrome tradeoffs.
- TUI/dashboard comparables — lazygit, k9s, gh-dash, the 2026 agent-orchestration-monitor wave.

### Tertiary (LOW confidence)
- The board ticket-row grammar's real-world shape — only two disagreeing HTML-comment examples exist in the seed; needs sampling before the grammar is frozen.
- LLM-simplification-improves-comprehension literature — reverse-direction evidence (LLMs producing simplified text for humans, not consuming controlled input) with only one randomised trial measuring actual comprehension; not directly applicable to the claim grugops would want to make.

---
*Research completed: 2026-07-28*
*Ready for roadmap: yes*
