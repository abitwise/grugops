# Phase 36: State-layout authority, path move and protection - Context

**Gathered:** 2026-10-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Every part of grugops names planning state under `memory-bank/plans/` through one constants-only path
authority (`install/state-layout.ts`). Install pruning and uninstall protect every state root from one
exported `STATE_ROOTS` list. A repo still on the old `plans/` layout keeps working after a kit update.
grugops's own repo moves to the new layout. Requirements: LAYOUT-01..LAYOUT-05.

Not in this phase: board overview grammar, per-file NFR/trace records, byte-budget enforcement (Phase 37);
`install --migrate` v3 arm, layout marker, four-state detection (Phase 38); role prose rewrite (Phase 40).
Role edits here are mechanical path substitutions only.

</domain>

<decisions>
## Implementation Decisions

### Carried forward (milestone decisions, not re-asked)
- [v3.0, D-4] Roles read `memory-bank/plans/` when present, otherwise `plans/`, with a one-line
  "run `install --migrate`" notice; a plain install refuses to seed state on the old layout.
- `install/state-layout.ts` is constants-only and is the only place a state path or budget is spelled.
  Readers, writers, the validator, the installer and the uninstaller import it.
- One exported `STATE_ROOTS` (adds `memory-bank`) replaces the hand-typed protected lists in
  `install/install.ts` (`isPruneProtected`) and `install/uninstall.ts` (`isProtected`); count pinned two-sided.
- The old-spelling gate covers three spellings (slash, `join(...)`, backslash) and derives its counts; it
  never types an expected number.
- Every scratch install in tests and agent runs sets `GRUGOPS_HOME`.

### Layout detection
- **D-01:** Layout is decided by board-file presence: `memory-bank/plans/board.md` exists means new layout;
  otherwise `plans/board.md` means old layout. No layout marker is added in this phase (Phase 38 adds its
  own marker for migrate). Works on the markdown-copy install path where the installer never ran.
- **D-02:** When both `plans/board.md` and `memory-bank/plans/board.md` exist, the new layout wins and a
  one-line warning names `plans/` as stale. Roles and install proceed on `memory-bank/plans/`; nothing
  is merged or deleted. (Phase 38's migrate may still treat "both" as its own refusal state; that is
  Phase 38's call.)
- **D-03:** The fallback rule is stated once: AGENTS.md § Kit vs state plus the generated INVARIANT text
  that reaches every role, adapter and skill. Roles name only `memory-bank/plans/...` paths. No per-role
  fallback text, and no copy in WF16.
- **D-04:** The `plans/` fallback is a declared v3.x transition and is removed in v4.0. Record this as a
  decision (PROJECT.md Key Decisions) so the dual-root reader has a named end. — **Reversibility:** costly —
  removing it later breaks any repo still unmigrated; the date is a published promise in docs.

### Old-layout install behavior
- **D-05:** A plain `install` on an old-layout repo refuses the whole install: it writes nothing, prints
  the `install --migrate` command, and exits non-zero (use the installer's existing refusal exit-code
  convention). This applies only to the per-repo install; `--update` (kit-home only), `--check`,
  `--migrate` and uninstall are not blocked. A "both" repo (D-02) is new layout, so install proceeds with
  the warning. — **Reversibility:** reversible
- **D-06:** The notice uses the final wording now ("run `install --migrate`"), even though the v3 migrate
  arm lands in Phase 38. v3.0 ships Phases 36–38 together, so no released kit shows the gap. Phase 38
  owns making the command move state, and must make sure the existing "already migrated to the two-root
  layout" short-circuit does not swallow the v3 move.
- **D-07:** `install --check` (doctor) reports the state layout: old layout is a WARN naming the
  `--migrate` command (never FAIL); new and both are reported too. The doctor's board check reads its
  path from `state-layout.ts`.

### Old-spelling gate
- **D-08:** All fixture trees under `scripts/fixtures/` (~185 files) move to `memory-bank/plans/`. Add one
  named old-layout fixture used by the fallback, refusal and doctor tests.
- **D-09:** Historical records are allow-listed and never rewritten: `docs/audit/**` and `CHANGELOG.md`
  (entries before v3.0 record what was true then).
- **D-10:** The allow-list is per file (paths or globs, each with a reason), not per line. The gate prints
  the derived per-spelling count inside allowed files and fails on any site outside them. Allowed files
  also include the code that must name the old path (fallback detection, install refusal, and later the
  migrate arm).
- **D-11:** `.planning/` is excluded from the scan, as a named exclusion in the gate (not a silent skip).

### Dogfood move and ordering
- **D-12:** grugops's own `plans/` (20 KB, no tickets) moves with `git mv plans memory-bank/plans` by
  hand in a plan, preserving history. Phase 38's migrate is not used.
- **D-13:** Order of work: (1) `state-layout.ts` + `STATE_ROOTS` + prune/uninstall protection tests;
  (2) seed move, repo move, and path edits in readers, writers, validator, docs, workflows, roles and
  regenerated adapters/skills; (3) old-layout fallback text, install refusal and doctor report;
  (4) the grep-to-zero gate turns on last, once sites outside the allow-list reach zero. The suite stays
  green across waves.

### Plan-time amendments (human, 2026-10-20, after research)
- **D-14:** Amends D-03. The fallback rule is one exported constant (`LEGACY_FALLBACK_CLAUSE` in
  `install/state-layout.ts`) placed verbatim in INVARIANT, AGENTS.md § Kit vs state, the packaging copies,
  the skill sources, and also on `agent-factory/roles/orchestrator.md` line 8 (the kit-home invariant copy).
  Reason: `--update` refreshes only the kit home and D-05 refuses a plain install on the old layout, so an
  unmigrated repo never receives the per-repo copies; the kit-home Orchestrator is the copy it reads. A test
  asserts every carrier holds the clause verbatim. — **Reversibility:** reversible
- **D-15:** Refines D-10. The old-spelling gate subtracts exact occurrences of `LEGACY_FALLBACK_CLAUSE` from
  each file's text before counting; it does not allow-list the files that carry the clause. Any other old
  spelling in those files still counts.
- **D-16:** Refines D-09. `docs/initial/**` (the original spec) is allow-listed as history.
  `docs/design/shared-install.md` is rewritten to the new paths. `docs/audit/28-claim-registry.md` stays
  allow-listed but is a live consumer of `check-claim-anchors`: its verbatim claim blocks are edited in the
  same commit as their anchors in AGENTS.md and `agent-factory/README.md`. That edit is not a D-09 rewrite.
- **D-17:** LAYOUT-01's UAT is satisfied by a `uat` subpath constant in `state-layout.ts` and a seeded
  `memory-bank/plans/uat/.gitkeep`. No role behavior changes.

### Claude's Discretion
- Exact file location and export names inside `install/state-layout.ts` (research proposes
  `STATE_ROOT_REL = "memory-bank/plans"` plus fixed subpaths); budget constants may be placeholders
  until Phase 37 fills them.
- Exact wording of the one-line notice and the stale-`plans/` warning (clear voice, names the command).
- How the gate is wired (validator check vs `scripts/` guard) as long as the allow-list and counts are
  derived and it runs in CI.
- Whether `board-read.ts` `FIXED_SUBPATHS` imports from state-layout or keeps a literal with an equality
  test.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope and decisions
- `.planning/ROADMAP.md` § Phase 36 — goal, success criteria, notes
- `.planning/REQUIREMENTS.md` — LAYOUT-01..LAYOUT-05
- `.planning/PROJECT.md` Key Decisions rows tagged `[v3.0]` (D-1..D-10), especially D-4

### Research
- `.planning/research/SUMMARY.md` § Phase 36 and § D-4
- `.planning/research/ARCHITECTURE.md` § 2 (state layout owners), § 2.3 table (`install/state-layout.ts`,
  seed, board-read, board-model, validator, installer, uninstaller)
- `.planning/research/PITFALLS.md` Pitfall 1 (shared kit breaks unmigrated repos), Pitfall 3 (state out
  of prune/uninstall protection), Pitfall 4 (path-move grep-to-zero, three spellings, derived count)

### Rules
- `AGENTS.md` § Kit vs state — where the fallback rule goes (D-03)
- `CLAUDE.md` Constraints — installers idempotent/additive/reversible, single-source, no fabrication

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `install/install.ts` `seedState()` walks `agent-factory/seed/**` relative to the target, so moving
  `seed/plans/**` to `seed/memory-bank/plans/**` moves the seeded path without new installer code.
- `install/install.ts` `isPruneProtected` (~:3211) and `install/uninstall.ts` `isProtected` (~:398) hold
  the two hand-typed lists `["agent-factory", "plans", ".planning", ".grugops", "docs", "src"]`;
  `memory-bank` is protected today only through `isSeededState` (~:626).
- Doctor board check at `install/install.ts` ~:2409; existing `--migrate` two-root arm at ~:6342 with
  the "already migrated" short-circuit (~:6416).
- `install/user-file.ts` `readUserFile` for safe reads of user state.

### Established Patterns
- Derive sets and assert counts (`guard_kit_counts` / `ROLE_COUNT` two-sided pins); never hand-type a
  count (set-literal drift has bitten this repo before).
- Generated text (INVARIANT, adapters, skills) is regenerated and freshness-checked; edit the source,
  then regenerate.
- TS sources compile to committed `.js` with a freshness check.

### Integration Points
- ~1,187 lines in tracked files outside `.planning/` spell `plans/`: 185 fixture files, 19 workflows,
  17 roles, 17 `.claude/agents`, 7 `.claude/skills`, 7 `skills/`, seeds, packaging, checklists,
  11 `docs/audit`, and scripts (`board-read.ts`, `board-model.ts`, `validate-agent-factory.ts`,
  `trace-render.ts`, `trace-freshness.ts`, `kit-model.ts`, `generate-role-adapters.ts`, ...).
- `AGENTS.md` lines naming `plans/board.md`, `plans/traceability.md`, `plans/*`.

</code_context>

<specifics>
## Specific Ideas

- The gate's output names each spelling and its derived count, inside and outside the allow-list.
- Tests: a v3 kit against the old-layout fixture passes with the notice; a "both" fixture proceeds with
  the warning; prune and uninstall both refuse a planted path under `memory-bank/plans/`.

</specifics>

<deferred>
## Deferred Ideas

- Layout marker and four-state detection (old/new/both/neither) — Phase 38.
- Per-file byte budgets and their enforcement — Phase 37 (state-layout may hold placeholders).
- Removing the `plans/` fallback — v4.0 (D-04).

</deferred>

---

*Phase: 36-state-layout-authority-path-move-and-protection*
*Context gathered: 2026-10-20*
