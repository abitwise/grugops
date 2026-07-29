# Requirements: grugops — v2.1 Autonomous Factory (Real Spawning, Controlled Language & Live Board)

**Defined:** 2026-07-28
**Core Value:** A user installs grugops on top of the coding-agent CLI they already run, types `/grug`, and gets a disciplined delivery team — a visible board, a shared verified context, and an auditable requirement→code→test→release trail — entirely as readable markdown, with humans always holding merge and deploy.

**What this milestone is:** v2.0 proved the decentralized architecture *on disk* (dual-path equivalence oracle, N-agent worktree dogfood, grep-to-zero handoff removal). v2.1 is the milestone where a user actually **runs** it. The first real greenfield test surfaced that no role agent ever spawned, and two of the kit's headline claims did not survive measurement. This milestone is corrective and operational — the shared verified context, the queue, and the parallel/sequential dual path are unchanged.

**Full research:** `.planning/research/SUMMARY.md` (+ STACK / FEATURES / ARCHITECTURE / PITFALLS).

---

## The cross-cutting finding that shapes this milestone

All four researchers converged independently on one systemic defect: **hand-maintained set literals drift from the filesystem and stay green.** Confirmed in source, not hypothesised:

| Authority | Claims | Reality |
|---|---|---|
| `validate-agent-factory.ts:118-133` | 14 workflows | 19 on disk |
| `validate-agent-factory.ts:144-161` | 16 roles | 17 on disk (`frontend-ui` missing) |
| `check-foundation-guards.ts:593-610` `CTX_WORKFLOWS` | 16 workflows | 19 on disk — the 3 unguarded ones are precisely the context-I/O workflows |
| `guard_wr05` `WR05_SCAN` | 4 files | 17 new adapters would land outside it entirely |
| `guard_caveman_preserved` | "caveman voice preserved" | asserts sentence *shape*; all 17 blocks drifted fully out of voice while green |
| v2.0 MIGR-02 "grep-to-zero" | 0 handoff refs | 1 live ref at `.claude/agents/grugops-orchestrator.md:25` |
| `readGovernanceConfig()` `catch` | fail-closed | returns permissive defaults; a *second* reader was added as a workaround |

This is the v2.0 closure doctrine recurring in a new form — not a too-narrow *parser*, but a hand-maintained *list* that rots. **"Derive the set, assert the count" is this milestone's foundational structural fix**, and it must land before 17 new adapter files are created, or they land outside every guard meant to protect them.

---

## Milestone decisions (ratified at kickoff, 2026-07-28)

- **Voice: split by surface.** Caveman stays in the fenced `## Caveman prompt` identity blocks. An **ASD-STE100-*derived*** profile (never a conformance claim) governs procedural and agent-written surfaces.
- **Dashboard: Out of Scope amended.** A **read-only, derived, local** view is permitted. Hosted/SaaS and any write path remain out of scope.
- **Autonomy: "settable, never silently."** All checkpoints *including the four current safety floors* become dialable. Lowering a floor requires a named-human opt-in an agent cannot self-set; defaults stay safe; the lowering is recorded in the trace and the corresponding public claim is **dropped**.
- **Version:** v2.1. Phases continue from 27. Artifact SemVer stays 0.1.0 (D-28).
- **Claude Code floor: v2.1.219+.** Clean floor at depth 3 (tunable via `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), superseding v2.0's stale "v2.1.172, depth ≤5". This deliberately excludes the v2.1.217–218 depth-1 window, which silently completes work inline with no error — i.e. it reproduces the exact defect this milestone exists to fix, so supporting it would mean shipping a detector for a bug rather than a floor above it. No runtime version-detection code is required.
- **Scope: all 46 requirements retained** (KIT 3 · SPAWN 7 · AUDIT 4 · LANG 8 · AUTO 7 · UATX 6 · DASH 8 · CAP 3). An earlier draft of this block said "41" — a hand-maintained count that had drifted from the enumerated set, caught by counting rather than by trusting the number. Recorded rather than silently corrected, because it is this milestone's founding defect in miniature. Phase 30 (autonomy floors) is a direct Phase-25 successor; its red-team rounds are budgeted **as scope, not overrun**.

**Honesty floor carried into this milestone:**

- There is **no evidence** that controlled language improves LLM comprehension. STE's attested benefits are for human readers and translation. The kit must not ship this claim.
- STE **increases** token count (its rules forbid the telegraphic omission caveman relies on). Controlled language is justified on determinism and one-term-per-concept grounds, never as a token-economy win.
- **Caveman-as-token-economy is disproven on this artifact** — the fenced blocks restate rather than compress (`software-engineer.md`'s block is 58 bytes *longer* than the `## One job` line it duplicates), and are 6% of role bytes (3,980 / 66,208).
- STE conformance is **not mechanically decidable**. Any guard must be named for its decidable subset and never described as enforcing "ASD-STE100."
- ASD-STE100 dictionary redistribution rights are **`UNKNOWN - verify` — assume NO**. Author an original derived profile; never vendor the dictionary.
- **Claude in Chrome cannot be gate evidence** (attended window only, force-disabled under API-key auth, Claude-Code-only). Its only legitimate role is `verified_by: <named human>`.

---

## v2.1 Requirements

Each requirement maps to exactly one roadmap phase (27–33). REQ-IDs continue grugops's `[CATEGORY]-[NUMBER]` scheme.

### KIT — Kit-Set Authority (the foundational structural fix)

- [ ] **KIT-01**: `scripts/kit-model.ts` is the sole authority for "what roles and workflows exist," derived from the filesystem via `readdirSync` with an asserted count — replacing all five stale hard-coded lists.
- [x] **KIT-02**: Every guard and validator scan set (`WR05_SCAN`, `ADAPTERS`, `CTX_WORKFLOWS`, the validator's role and workflow lists) is derived from `kit-model.ts`, never hand-listed.
- [x] **KIT-03**: A referential-integrity oracle asserts set equality between the coordinator's spawn grant, the adapter directory, and the role corpus — and **fails RED against today's tree** (1 adapter present, 7 names granted, 17 roles) before it is trusted.

### SPAWN — Spawn Correctness

- [ ] **SPAWN-01**: All 17 role subagent adapters exist at `.claude/agents/grugops-<role>.md`, **generated** from `agent-factory/roles/*.md` by a single templated generator — thin pointers, never copies of role text.
- [x] **SPAWN-02**: `adapters-freshness.ts` byte-gates the generated adapters against a fresh regeneration, fail-closed on drift (the proven pattern from `catalog-freshness` / `context-freshness`).
- [ ] **SPAWN-03**: The coordinator is wired as the Claude Code **main-thread** agent so its `Agent(<allowlist>)` grant is honoured by the runtime — the current subagent placement makes the grant a no-op, since Claude Code ignores the type list inside a subagent definition.
- [x] **SPAWN-04**: Non-coordinator role adapters omit the `Agent` tool entirely — a mechanism that holds on both the main-thread and subagent paths, rather than relying on a frontmatter token the runtime ignores.
- [ ] **SPAWN-05**: `guard_adapter_body` fails red on pre-v2.0 handoff/single-window prose in any adapter body (defense in depth behind generation, never the structural fix), closing the surviving `grugops-orchestrator.md:25` reference.
- [ ] **SPAWN-06**: `orchestrator.md` is trimmed below its **7570-byte FAIL ceiling** (currently 7562B — 8 bytes of margin) *before* this milestone adds spawn-allowlist text to it; the ceiling is never raised to accommodate growth.
- [ ] **SPAWN-07**: The advertised Claude Code floor and the `queue.wip_limit` rationale are corrected against real platform behaviour: depth is **3** on v2.1.219+ (not 5), tunable via `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, with the v2.1.217–218 depth-1 window documented as a known-bad range that degrades loudly.

### AUDIT — Kit Consistency Audit

- [ ] **AUDIT-01**: A correctness-and-strangeness pass over all 18 roles + 19 workflows, with each finding recorded and dispositioned (fixed / accepted / deferred with reason).
- [ ] **AUDIT-02**: The `CLAUDE.md` drift is reconciled — it still describes handoff packets and a routing Orchestrator, both removed in v2.0.
- [ ] **AUDIT-03**: A registry of every public safety claim in `README.md` / `AGENTS.md` / `agent-factory/README.md`, each with an id, so the autonomy milestone's claim-dropping mechanism has something to void.
- [ ] **AUDIT-04**: Stale third-party pins refreshed (`@playwright/test` 1.60.0 → 1.62.0, `@axe-core/playwright` 4.11.3 → 4.12.1) with versions verified at time of change, never assumed.

### LANG — Controlled Language & Voice Guard Rebuild

- [ ] **LANG-01**: A grugops-authored, ASD-STE100-**derived** writing profile — enumerated rules plus a project Technical Names/Verbs set — shipped as kit documentation with a non-affiliation and not-certified disclaimer, vendoring no part of the ASD dictionary.
- [ ] **LANG-02**: The profile is applied to procedural and agent-written surfaces (workflow steps, checklists, memory-bank, shared-context notes, board, traceability) and explicitly **not** to the fenced caveman identity blocks.
- [ ] **LANG-03**: A named safety-surface exclusion list is honoured so that load-bearing security, compliance, and admission text is never reworded by a style pass.
- [ ] **LANG-04**: A guard enforces exactly the profile's **decidable** subset (lexicon membership, sentence length, banned constructions) and is named for that subset — never presented as enforcing ASD-STE100 conformance.
- [ ] **LANG-05**: The role skeleton is de-duplicated — "say each thing once" — so `## One job`, the caveman block, and `## Responsibilities` stop being three passes over the same content.
- [ ] **LANG-06**: The voice guard is rebuilt to measure voice against a committed lexicon rather than sentence shape, and **fails RED on all 17 current blocks** as acceptance evidence before the rewrite lands.
- [ ] **LANG-07**: `guard_ste` and the rebuilt voice guard share **one** fence parser — never two grammars over the same bytes.
- [ ] **LANG-08**: Byte ceilings are re-baselined **once** at end of phase (every file ≤ its previous value, delta recorded), never raised mid-phase to accommodate a rewrite.

### AUTO — Per-Checkpoint Autonomy Matrix

- [ ] **AUTO-01**: Every human stop in the kit is enumerated into a closed, exported checkpoint set (sourced from the `## Stop conditions` and role `## Hard limits` sections), such that adding a checkpoint without a default is a compile error.
- [ ] **AUTO-02**: A per-checkpoint ternary matrix (`block` / `notify` / `off`) replaces the `autonomy` scalar, with **fail-closed** handling of unknown or malformed values — any non-canonical value gates at least as strictly as `block`.
- [ ] **AUTO-03**: Lowering a safety floor requires **two keys**: a declaration in config (agent-writable, form-checked only) plus authorization via a per-floor session env var the hook process reads fresh (agent-unwritable) — never a blanket grant.
- [ ] **AUTO-04**: The hook-enforced vs in-process tier split is honoured explicitly: `test_integrity` moves to the **point of effect** (`emitVerdict()` refuses GREEN) rather than being given a false-equivalent env-var mechanism it cannot actually enforce.
- [ ] **AUTO-05**: Claim-dropping is mechanical — a generated guarantees render plus a per-run banner naming every non-default checkpoint, so a lowered floor can never leave an overstated claim standing in the docs.
- [ ] **AUTO-06**: `readGovernanceConfig` and `readGovernanceConfigResult` collapse into a **single** discriminated-result config reader whose failure path is fail-closed, deleting the second authority rather than adding a third.
- [ ] **AUTO-07**: Defaults are unchanged and safe — a zero-config repo behaves exactly as it does today, and no floor is lowered by omission.

### UATX — Autonomous Manual Testing

- [ ] **UATX-01**: Playwright is the machine-verifiable evidence floor — the committed spec is the evidence, re-run by the existing §14 gate; an agent's narration or an MCP tool-call transcript is never a stamp.
- [ ] **UATX-02**: Browser MCP tooling is used to *author* specs, with `@playwright/mcp` pinned (pre-1.0) and documented for all five host CLIs.
- [ ] **UATX-03**: Claude in Chrome is available as an optional, clearly-labelled `verified_by: <named human>` lane, and is structurally barred from producing a `§14-gate` stamp.
- [ ] **UATX-04**: Evidence carries provenance — commit SHA + gate-run id + content hash — and a note whose SHA is not the HEAD the gate ran against is refused.
- [ ] **UATX-05**: An absent or unusable browser produces a **loud skip** leaving the UAT `pending` (reusing the existing Tier-2 convention verbatim), never a silent pass.
- [ ] **UATX-06**: Conditional or caught assertions are banned in generated specs, checked over the TypeScript AST rather than by regex, so the claim matches the mechanism.

### DASH — Board Projector & CLI Dashboard

- [ ] **DASH-01**: `scripts/board-model.ts` is the single authority for every board sub-grammar — the column-heading parser is **extracted from and deleted in** `validate-agent-factory.ts` (porting the WR-03 prefix-match hardening verbatim), and it becomes the first authority for the ticket-row and WIP-number grammars.
- [ ] **DASH-02**: The board row grammar is pinned by a written spec and a parse-oracle fuzz suite, whose adversarial corpus includes the board's own large HTML-comment documentation block (which a naive parser would read as live state).
- [ ] **DASH-03**: A typed `FactorySnapshot` joins board, ticket frontmatter, queue state, context notes, and traceability, and **surfaces** board-vs-frontmatter disagreement in a `conflicts[]` field rather than silently resolving it.
- [ ] **DASH-04**: A separate dashboard process renders the snapshot live using directory-level `fs.watch` plus a **mandatory** polling floor and debounce — because grugops's own atomic-rename write path silently orphans a file-level watch.
- [ ] **DASH-05**: Torn reads and the Windows `atomicWrite` ENOENT window are handled by read-verify-reread with a last-good snapshot and a visible stale badge; a partial parse or an ENOENT is never rendered as an empty board.
- [ ] **DASH-06**: The dashboard is mechanically read-only — an import-graph guard proves its module tree holds no mutating `node:fs` symbol, rather than asserting read-only in prose.
- [ ] **DASH-07**: Non-TTY, `--json`, and `--once` modes work for CI and piping, and the renderer degrades visibly rather than rendering a confident wrong board.
- [ ] **DASH-08**: The snapshot shape is stable enough that a future web renderer consumes it unchanged; the dashboard adds **zero** runtime dependencies and no listening socket this milestone.

### CAP — Live Capture & Windows Portability

- [ ] **CAP-01**: One **captured** live dual-path run (date + verdict) discharges GAP-D1 and flips A3/DOG-02 plus the coupled `examples/03-ticket-to-pr.md` cleanup — a loud skip is never a capture.
- [ ] **CAP-02**: The `windows-latest` CI leg is green (path-assertion normalization, symlink-fixture privilege guard, old-layout migrate fixture, temp-dir `tsc` mirror rebuild), which also unblocks the Windows `fs.watch` surface the dashboard depends on.
- [ ] **CAP-03**: The spawn fix is proven by a **live captured run** showing role agents executing in their own sessions — not by a green suite, which is exactly what failed to detect the defect.

---

## Future Requirements (deferred)

- A `measure-*` harness quantifying whether the writing profile actually helps agents — mirroring how `measure-cost.ts` keeps v2.0's ~50% claim honestly `UNKNOWN - verify`. Until measured, the kit asserts no comprehension benefit.
- Web dashboard renderer over `node:http` + SSE (~120 stdlib lines) — deferred deliberately; the projector seam is this milestone's deliverable, and a listening socket spends the "no daemon" budget.
- Per-repo kit-version pin + skew warning (SKEW-01); doctor `--fix` (FIX-01); plugin-form path resolution / publishing as a CC plugin (PLUGIN-01).
- Mutation testing as a required gate step (MUT-01); full cross-browser visual-regression matrix (VRT-01).
- A lightweight native grugops coding agent — would need a server-less admission gate (the Phase-25 MCP admission server is Claude-Code-only).
- Carried tech debt: `check-kit-refs` / duplicate-Test-ID gate-robustness hardening (WR-01..04).

## Out of Scope (explicit exclusions)

- **A write-capable dashboard.** Every comparable tool (lazygit, k9s, gh-dash) is a control plane; grugops's read-only stance is deliberate and must be enforced structurally, not by policy.
- **Hosted/SaaS dashboard, or any listening socket this milestone.**
- **Vendoring the ASD-STE100 dictionary** — redistribution rights are unresolved; assume no.
- **Any claim of ASD-STE100 conformance or certification.**
- **Claude in Chrome as gate evidence** — it can only ever be a named-human stamp.
- **Deleting the safety floors.** They become dialable behind a named-human opt-in; the guards remain and gain an opt-in tier.
- **Raising a byte ceiling to accommodate growth** — trim or split instead.
- New runtime dependencies. Confirmed net change to `package.json`: **none**.

---

## Traceability

_Filled by the roadmapper 2026-07-28. Every requirement maps to exactly one phase — **46/46 mapped, 0 unmapped, 0 duplicated**._

> **Count correction (recorded, not silently fixed):** the Milestone-decisions block above says "all 41 requirements retained." The enumerated set is **46** (KIT 3 · SPAWN 7 · AUDIT 4 · LANG 8 · AUTO 7 · UATX 6 · DASH 8 · CAP 3). The "41" predates the final category split. This is the milestone's own founding defect in miniature — a hand-maintained count drifting from the enumerated reality — surfaced by counting rather than by trusting. Scope is unchanged: all 46 are retained.

| Requirement | Phase | Status |
|-------------|-------|--------|
| KIT-01 | Phase 27 | Gaps Found |
| KIT-02 | Phase 27 | Gaps Found |
| KIT-03 | Phase 27 | Gaps Found |
| SPAWN-01 | Phase 27 | Gaps Found |
| SPAWN-02 | Phase 27 | Gaps Found |
| SPAWN-03 | Phase 27 | Pending |
| SPAWN-04 | Phase 27 | Gaps Found |
| SPAWN-05 | Phase 27 | Gaps Found |
| SPAWN-06 | Phase 27 | Gaps Found |
| SPAWN-07 | Phase 27 | Gaps Found |
| AUDIT-01 | Phase 28 | Pending |
| AUDIT-02 | Phase 28 | Pending |
| AUDIT-03 | Phase 28 | Pending |
| AUDIT-04 | Phase 28 | Pending |
| LANG-01 | Phase 29 | Pending |
| LANG-02 | Phase 29 | Pending |
| LANG-03 | Phase 29 | Pending |
| LANG-04 | Phase 29 | Pending |
| LANG-05 | Phase 29 | Pending |
| LANG-06 | Phase 29 | Pending |
| LANG-07 | Phase 29 | Pending |
| LANG-08 | Phase 29 | Pending |
| AUTO-01 | Phase 30 | Pending |
| AUTO-02 | Phase 30 | Pending |
| AUTO-03 | Phase 30 | Pending |
| AUTO-04 | Phase 30 | Pending |
| AUTO-05 | Phase 30 | Pending |
| AUTO-06 | Phase 30 | Pending |
| AUTO-07 | Phase 30 | Pending |
| UATX-01 | Phase 31 | Pending |
| UATX-02 | Phase 31 | Pending |
| UATX-03 | Phase 31 | Pending |
| UATX-04 | Phase 31 | Pending |
| UATX-05 | Phase 31 | Pending |
| UATX-06 | Phase 31 | Pending |
| DASH-01 | Phase 32 | Pending |
| DASH-02 | Phase 32 | Pending |
| DASH-03 | Phase 32 | Pending |
| DASH-04 | Phase 32 | Pending |
| DASH-05 | Phase 32 | Pending |
| DASH-06 | Phase 32 | Pending |
| DASH-07 | Phase 32 | Pending |
| DASH-08 | Phase 32 | Pending |
| CAP-01 | Phase 33 | Pending |
| CAP-02 | Phase 33 | Pending |
| CAP-03 | Phase 33 | Pending |

### Coverage by phase

| Phase | Name | Requirements | Count |
|-------|------|--------------|-------|
| 27 | Spawn Correctness & Kit-Set Authority | KIT-01..03, SPAWN-01..07 | 10 |
| 28 | Kit Consistency Audit | AUDIT-01..04 | 4 |
| 29 | Controlled Language & Voice Guard Rebuild | LANG-01..08 | 8 |
| 30 | Per-Checkpoint Autonomy Matrix | AUTO-01..07 | 7 |
| 31 | Autonomous Manual Testing | UATX-01..06 | 6 |
| 32 | Board Projector & CLI Dashboard | DASH-01..08 | 8 |
| 33 | Live Capture & Windows Portability | CAP-01..03 | 3 |
|  | **Total** |  | **46** |

### Phase ordering — why this order and not another

Three independent researchers converged on this dependency-ordered spine (`research/SUMMARY.md` → "Phase Ordering Rationale"). It is followed without deviation.

- **27 before everything** — the set-authority fix must land *before* 17 new adapter files exist. Author the adapters first and they land outside `guard_wr05`, `ADAPTERS`, and `CTX_WORKFLOWS` entirely, which is the exact mechanism by which the current spawn defect went undetected for a whole milestone. Creating adapters first and fixing scan sets "later" reproduces the failure with new names.
- **28 before 29** — the audit produces the safety-surface exclusion list and the public-claim registry the language rewrite consumes as inputs.
- **29 before 30** — the language pass touches governance prose; running it after 30 would mean rewriting freshly-written governance text and re-running Phase 30's expensive red-team gate a second time.
- **30 after 29, and expensive on purpose** — direct successor to Phase 25 (8 rounds, 2 independent red-teams, the hardest phase in the project). Red-team rounds are budgeted **as scope, not overrun**.
- **31 after 30** — browser evidence enters through verify-before-write, whose dialability Phase 30 settles.
- **32 last among features** — read-only, non-load-bearing, lowest blast radius.
- **33 last overall** — both items are milestone-wide *proofs*, not features.

**One acknowledged ordering tension:** CAP-02 (Windows CI green) lands in Phase 33 but unblocks Phase 32's `fs.watch` Windows surface. Rather than resequence, Phase 32 states its Windows behaviour as `UNKNOWN - verify` until Phase 33 turns the leg green. Honest pending over an assumed pass.
