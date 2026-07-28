# Milestones

## v2.0 Decentralized Factory — Shared Verified Context (Shipped: 2026-07-28)

**Phases completed:** 7 phases (20–26), 44 plans, 75 tasks
**Git:** `v1.2..044d9a4` — 339 commits, 460 files changed (+52,976 / −2,775) · 2026-06-16 → 2026-07-28
**Audit:** `tech_debt` — 28/28 requirements satisfied across all three sources, 7/7 phases verified, 8/8 cross-phase integration boundaries wired (0 broken), 7/7 Nyquist compliant, no blockers
**Closeout type:** `override_closeout` — not all phases project as verified (Phase 20's Windows-CI human item is genuinely open; Phase 25 reports `unknown` only as a frontmatter-parse artifact)
**Known deferred items at close:** 11 carried + 1 resolved during close (9 of the 11 are pre-v2.0 carryover from the v1.2 close; 2 are the single Phase-20 Windows item; see STATE.md "Deferred Items → v2.0 milestone close")

**Delivered:** The architecture pivot — grugops went from a centralized Orchestrator passing static handoff packets to a decentralized factory where parallel agents claim work from a lock-free file queue and build on a **shared verified context that nothing can be written to without a real, non-self verification stamp**. All 17 handoff templates were deleted in one grep-to-zero change. Grounded in DeLM (arXiv 2606.10662), differentiated on grugops's own ground: the context is auditable and human-gatable, never a black-box blackboard. Zero new host runtime dependencies.

**Key accomplishments:**

- **Shared-context substrate + lock-free queue (Phase 20)** — the typed six-kind note schema (`claim` / `finding` / `decision` / `failed-attempt` / `observation` / `artifact-ref`) with a full provenance fence, `context-io.ts` as the *only* sanctioned write path (crash-safe atomic per-note publish, byte-reproducible index render, `at`+`supersedes` replay, validator that fails on a missing field), the `mkdirSync`-exclusive `claim.ts` queue with atomic-rename transitions and a generous-TTL stale sweep, a fail-closed `freshness:context` drift gate where markdown always wins, and `guard_context_writes` as the seventh foundation guard — all mechanized *before* any role was allowed to write. Code review caught two field-injection BLOCKERs (provenance forgery, queue-lock DoS), both fixed under TDD before sign-off.
- **Verify-before-write admission — the differentiator made mechanical (Phase 21)** — `validate()` refuses self/hollow stamps, `emitVerdict()` is the sole `§14-gate` author path, and `admit()` cross-checks a finding's `verified_by: §14-gate#<id>` against a *live GREEN verdict* before writing. A non-green gate run emits no verdict at all, so a refused finding degrades honestly to `UNKNOWN - verify` — the escape hatch can never satisfy an admission. Workflow 16 is the single-source protocol every role references and none restates.
- **Two-tier memory & compaction (Phase 22)** — `compactor.ts` keeps the verbose local trajectory local and promotes only compact verified distillations, under a `context.compaction` dial with a lean `aggressive` default and a load-bearing-field carve-out (`verified_by`, `failed-attempt`, `supersedes`, `by`/`at`) that no compaction may drop. Took **8 rounds and 7 distinct bypasses** of one silent-absorb class; closed structurally by giving `parseNote` and `splitNotes` a single shared exported grammar so the two cannot drift.
- **Parallel execution & Orchestrator-as-decomposer (Phase 23)** — the Orchestrator holds the `Agent(<allowlist>)` and the human merge/deploy gate but **relays no data**; nested spawning on Claude Code (depth ≤5) with a `queue.wip_limit` **width** cap that is grugops's responsibility, plus a concurrency-1 degraded path for the four non-spawning CLIs over the *same* substrate. `guard_wr05` was **inverted** — from "no role grants `Agent`" to "exactly one coordinator grants it" — proven RED against the committed `.js` and flipped atomically with the packaging templates and docs catalog.
- **Clean handoff removal (Phase 24)** — 18 roles, 16 workflows, 3 packaging templates and AGENTS.md rewired substrate-first, *then* all 17 handoff templates deleted in a single grep-to-zero change. Traceability was **migrated, not dropped**: `plans/traceability.md` survives as a byte-reproducible render of note `refs`, behind its own fail-closed freshness gate. `install.ts --migrate` renames a user's handoff state to a timestamped backup rather than deleting it.
- **Governance-on-a-dial (Phase 25)** — `context.human_admission` (off / high-severity / all) extends the prod-deploy hook's named-human discipline to memory itself, with `context.audit_retention` in three-surface byte-identical lockstep and lean defaults preserved. The milestone's hardest phase: **8 rounds**, closed only by unifying the kind and severity classifier authorities into one format-aware authority each and deliberately *unfreezing* a byte-frozen weaker duplicate. Gated on 2 independent bash-grounded red-teams returning NO_BYPASS + 19/19 self-reproduction + named human approval. A same-uid/no-hook direct-FS forgery residual is documented as **irreducible**, backstopped by `autonomy=pr`.
- **Dual-path equivalence oracle & dogfood (Phase 26)** — `oracleDualPathEquivalence` asserts real on-disk convergence between the parallel and sequential paths (same admitted note-set, same frozen verdict, same `done/` artifact), proven non-vacuous by a RED test. A hermetic N=3 real-`git worktree` dogfood proved exactly-once claiming, N un-clobbered notes on one shared root, no worktree context-shadowing, and non-vacuous `sweepStale` reclaim via an injected clock. `measureCost()` defaults to `UNKNOWN - verify` and is fixture-tested to emit **no numeric field** — the ~50% cost claim is never borrowed from DeLM.
- **The capstone is a negative result, and it is the best one.** Phase 26 built the evidence gate that would retire grugops's oldest open waiver (A3/DOG-02, carried since v1.0) — and the gate **correctly refused to fire**, because one captured live dual-path run was missing. A loud-skip is not a capture. The mechanism was verified precisely by watching it decline to do the convenient thing.

**The expensive lesson, recorded:** across three invariants (CMP-02, WR-05, GOV-01) there were **13 documented cases where a fully green test suite still admitted a bypass**. Every failed round shared one root cause — a heuristic detector that was a strict *subset* of the real format's grammar, making the format itself the attack surface. What closed each invariant was never another heuristic but a **structural** fix (one authority per predicate, delete the second grammar, move the gate to the point of effect, unfreeze a frozen weaker duplicate), plus parser-oracle fuzzing, ≥2 independent red-teams, and self-reproduction of the bypass. This is now project doctrine and should be budgeted for, not treated as overrun.

**Carried into the next milestone:** (1) **GAP-D1** — capture ONE live dual-path run on an authed box, then flip A3/DOG-02 + the coupled `examples/03-ticket-to-pr.md` edit; (2) a **Windows-portability pass** — the `windows-latest` leg is red on 3 test files, but 7 of 9 failures are harness/fixture artifacts and 2 are a real limitation of a ubuntu-scoped dev gate, with **zero failures in the v2.0 substrate**; (3) trim `orchestrator.md` (7562B against a 7165B WARN threshold, growing every phase); (4) fail-safe residuals (all fail-closed, none silent); (5) hygiene, including reconciling `CLAUDE.md`, which still describes handoff packets and a routing Orchestrator.

---

## v1.2 SDLC Depth, Quality Discipline & Browsable Docs (Shipped: 2026-06-16)

**Phases completed:** 10 phases (10–19), 38 plans, 55 tasks
**Git:** `9dc56ad..5ecb6e4` — 263 commits, 278 files changed (+46,382 / −4,686) · 2026-06-09 → 2026-06-16
**Audit:** `tech_debt` — 34/35 requirements satisfied, 7/7 cross-phase integration seams wired (0 broken), no blockers
**Known deferred items at close:** 13 (all known/ratified — A3/DOG-02 human-waived, B1/B2 Tier-3 human-only, 2 stale markers; see STATE.md Deferred Items)

**Delivered:** Made grugops's delivery lifecycle senior-grade and trustworthy end-to-end — deeper SDLC personas with the business→engineer handoff closed, test-first by default, automated UI build+test, OWASP ASVS security auditing, an un-cheatable quality gate, a TypeScript tooling foundation, browsable docs, the deferred install migrate/update story, and an honest auto-UAT harness — almost entirely as improvements to grugops's own markdown kit.

**Key accomplishments:**

- **SDLC-coverage audit + foundation guards + config-dial contract (Phase 10)** — opened the milestone by scoring all 16 roles × 14 workflows × 9 lifecycle stages (breadth complete; 4 depth gaps mapped to phases 11–15, 0 uncovered), landing four mechanical guards (WR-05 spawn-grant grep, adapter-size, AGENTS.md byte budget, voice-lint) with a fail-proof harness, and 8 new dial keys with lean defaults + a documented lean→enterprise escalation contract the validator enum-recognizes active-when-present / lenient-when-absent.
- **Senior persona overhaul + 17th frontend/UI role (Phases 11, 13)** — deepened all 16 roles to senior judgment in place (sharper-per-token; terse caveman voice preserved as the token-economy mechanism; per-file byte ceilings enforced), closed the business→engineer handoff via the INVEST/measurable-NFR Definition-of-Ready hub, retired the WR-05 spawn grant (re-verified GREEN post-rewrite), and added a senior `frontend-ui` persona (no spawn) + workflow 14 (UI design→build, WCAG 2.2 AA) the Orchestrator routes to.
- **Test-first baked in (Phase 12)** — declarative selector-free Given/When/Then acceptance contract in the product + QE handoffs, a single-source Three Amigos / Example-Mapping hub folded into backlog refinement, and the engineer red-green double-loop with dial-aware test-first evidence fields carrying the clear-voice no-fabrication floor — all config-dialed via `bdd` + `quality.tdd`.
- **OWASP ASVS 5.0 security posture (Phase 14)** — workflow 15 (deep leveled audit, reference-don't-restate the gate) + the security/NFR checklist regenerated from a vendored pinned ASVS 5.0.0 source by a zero-dep generator (345 L1/L2/L3 requirements, byte-reproducible, provably not hand-transcribed), with `security.asvs_level`/`block_on` dialed and clear-voice findings (guard_voice over all four security surfaces).
- **TypeScript tooling foundation (Phase 15, D-13 ratified)** — migrated the whole script layer (single `install.ts`, validator, ASVS generator, six-guard aggregator, kit-refs) to a zero-build, `tsc`-compiled committed-`.js`, freshness-checked cross-platform model, and proved the kit-shipped-runnable convention end-to-end; all 13 POSIX/`.mjs` originals + `.test.sh` oracles deleted only after a green migration suite; Node 22+ floor.
- **Converged un-cheatable §14 quality gate (Phase 16)** — wired lint, automated Playwright UI/E2E + visual regression + axe-core a11y, and a structured-justification test-integrity checker the agent cannot self-author into the single-source `05-pr-quality-gate.md`, all config-dialed, preserving the bounded self-fix loop and three terminal results; `test_integrity` carries a `warn|block`-only safety floor (never off).
- **Install --migrate / --update + browsable docs catalog (Phases 17, 18)** — RED-harness-first, never-delete-first `--migrate`/`--update`/`--prune-old-kit` flags on the single TS installer (the only deletion path removes only timestamped `.bak` backups), and a read-only stdlib-only generator emitting a byte-stable `docs/catalog/README.md` (17 roles + 16 workflows, each linked to source) guarded by a fail-closed `freshness:catalog` drift gate.
- **Honest factory auto-UAT harness (Phase 19)** — Tier-1 deterministic oracles (WR-05 wording, hooks.json→guard wiring, dual-path parity) wired into the foundation-guards aggregator + a Tier-2 `claude --print` headless E2E harness that LOUD-skips when unauthed; run for real it resolved B3 + A1/D-31 + A2/SAFE-02 from captured evidence without fabrication. A3/DOG-02 live dual-path parity is **human-waived** to the next (decentralization) milestone that removes handoffs; B1/B2 persona/prose judgment stays a human sign-off.

Archived: `milestones/v1.2-ROADMAP.md`, `milestones/v1.2-REQUIREMENTS.md`, `milestones/v1.2-MILESTONE-AUDIT.md`

---

## v1.1 Install & Distribution (Shipped: 2026-06-08)

**Phases completed:** 3 phases (7–9), 14 plans, ~33 tasks
**Git:** `a37830b..9d13c1b` — 92 commits, 140 files changed (+13,632 / −1,709) · 2026-06-06 → 2026-06-08
**Audit:** `tech_debt` — 8/8 requirements satisfied, cross-phase integration solid live, no blockers
**Known deferred items at close:** 7 (all v1.0-era; see STATE.md Deferred Items)

**Delivered:** Redesigned the install experience to a shared-location, two-root architecture — the read-only kit installs once to `${GRUGOPS_HOME:-$HOME/.grugops}` and any target repo gets a tiny self-resolving footprint — fixing the three v1.0 dogfood pains (kit never arrives, wrong target, symlink fragility).

**Key accomplishments:**

- Locked the kit/state split convention and the single "one rule, two homes" resolution mechanism, then rewrote ~31 role/workflow/adapter files so every reference resolves to the correct root — proven by a grep-to-zero build gate (`check-kit-refs.sh`)
- Built the two-root installer at sh/Node byte-parity: atomic kit copy to `$GRUGOPS_HOME`, content-idempotent materialization of the resolved absolute kit path into the standalone adapters, full per-repo state seed incl. `plans/handoffs/`, `--target`/`--yes`/non-TTY, copy-default, always-on self-checkout guard
- Two-root uninstall (D-06) that protects seeded state and the shared kit, removing only the grugops-owned marker + adapters + wiring
- Shipped the `--check` doctor (sh + byte-parity Node twin) — non-mutating, three-source kit-root cross-check, deterministic first-failure with referencing file, WARN tier, full exit-code matrix
- Made the structure validator two-root aware with NO `.` fallback — refuses to false-green in the dev checkout or with `$GRUGOPS_HOME` unset (C3 guard), backed by a three-way resolution-parity assertion (sh doctor = Node doctor = Node validator)
- Closed 3 verification-blocker gaps + a parity-CLASS code-review remediation in a Phase-9 Wave 4; re-verified PASSED 5/5 (install.test.sh 18/18, validate.test.sh 18/18 green live)

Archived: `milestones/v1.1-ROADMAP.md`, `milestones/v1.1-REQUIREMENTS.md`, `milestones/v1.1-MILESTONE-AUDIT.md`

---

## v1.0 MVP — Full Agent Factory v2 (Shipped: 2026-06-04)

**Phases completed:** 6 phases (1–6), 34 plans, ~70 tasks
**Git:** `f81da6c..a37830b` — 206 commits, 823 files (+37,616) · 2026-06-02 → 2026-06-06
**Note:** Not formally audited at ship time; archived retroactively at the v1.1 close (2026-06-08).

**Delivered:** The complete Agent Factory v2 spec — 16 role prompts (Orchestrator + 10 core + 5 enterprise), 14 lifecycle/ceremony/enterprise workflows with dual Kanban/Scrum cadence and a bounded backpressure quality gate, the shared I/O contracts (handoffs, checklists, memory-bank), thin per-tool adapters for all five host CLIs, both Claude distribution forms (standalone `.claude/` + versioned plugin), idempotent installers, a mechanical PreToolUse prod-deploy guard, a structure validator, brand/legal collateral, and an end-to-end idea→PR dogfood — all as readable markdown.

**Key accomplishments:**

- Froze the shared vocabulary (config dial, 13-column WIP board, stable ID scheme, traceability/NFR/metrics state plane) every later file cites by name
- Authored all 16 role prompts to a fixed 9-section skeleton, Orchestrator first (13-arrow routing matrix, WIP/DoR gate, XL-split, never-merge/never-deploy hard limit), plus a minimal §17.1 AGENTS.md embedding Karpathy's 12 coding-agent rules
- Composed the 14-workflow suite — full lifecycle, both cadences, and the single-source §14 backpressure quality gate (prefetch → branch → gate → bounded self-fix → terminal result), never faking a pass
- Bridged the single-source core to all five host tools via pointer-only adapters; shipped both coexisting Claude forms and idempotent/reversible installers
- Made prod-safety mechanical: a pure-Node plugin-level PreToolUse hook that denies prod-deploys absent a human-set approval, refuses inline self-set, and fails closed
- Shipped the stdlib-only structure validator (never fabricates a pass), the public brand/legal collateral (README + NOTICE + CONTRIBUTING + FAQ + original-art SVGs), and proved the chain with a real out-of-repo idea→PR dogfood (DOG-01 met; DOG-02 sequential half proven, live-CC half honestly deferred)

Archived: `milestones/v1.0-ROADMAP.md`, `milestones/v1.0-REQUIREMENTS.md`

---
