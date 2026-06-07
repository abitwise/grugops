# Phase 8: Two-Root Installer - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Make `install.sh` / `install.mjs` fix the three dogfood pains — the kit never arrives, the wrong target, symlink fragility — by:
1. Resolving `${GRUGOPS_HOME:-$HOME/.grugops}` and **copying** the read-only kit there (kit lands at `$GRUGOPS_HOME/agent-factory/…`).
2. **Materializing** the resolved absolute kit path into each standalone adapter (the only place a kit root binds to an absolute string).
3. **Seeding** per-repo state into the target without clobbering user content.
4. Keeping `install.mjs` byte-parity with `install.sh`.

**In scope:** `--target <repo>` + interactive confirm prompt + `--yes`/non-TTY bypass (INSTALL-03); kit copy to `$GRUGOPS_HOME`; absolute-path materialization into adapters; per-repo state seed (`.grugops/factory.config.json` + install marker + `plans/` skeleton incl. `plans/handoffs/` + `memory-bank/` seed) (INSTALL-04); default COPY (symlink opt-in); additive / idempotent / `DRY_RUN=1` / reversible across both roots; `install.mjs` byte-parity + Windows home via `os.homedir()`; `uninstall.sh` updated for the two-root layout; **two carry-forward cleanups** (WR-05, IN-01).

**Out of scope (later phases — do NOT pre-empt):**
- The `--check` doctor (INSTALL-05 → Phase 9).
- The two-root validator rewrite + unset-`$GRUGOPS_HOME` BAD fixture (VAL-02 → Phase 9).
- `install.test.sh` rewrite for the split (Phase 9 per requirement mapping; Phase 8 must not break it).
- Migration of already-installed in-repo `agent-factory/` + symlink layouts (MIGR-01 → v1.2).
- Version-skew negotiation between an installed kit and a target (SKEW-01 → v1.2).
- Plugin-form kit resolution via `${CLAUDE_PLUGIN_ROOT}` (PLUGIN-01 → v2+).

**Already locked upstream (carry forward, do NOT re-decide):**
- Kit home `${GRUGOPS_HOME:-$HOME/.grugops}` — env-overridable, default `~/.grugops`, NOT XDG, NOT literal `~`, resolved identically by POSIX `sh` and Node stdlib (SHOME-01).
- Per-repo config at `.grugops/factory.config.json`; install marker / kit-version stamp under `.grugops/` (SHOME-02).
- Adapter is the **sole resolver**: installer-materialized absolute path primary; the one-line `${GRUGOPS_HOME:-$HOME/.grugops}` bash self-heal runs only when that path is absent; STOP — do not hunt — if both fail (Phase 7 D-11/D-12).
- No role/workflow/SKILL/AGENTS.md names `$GRUGOPS_HOME`; only the adapter carries the env-var self-heal (SHOME-04).
- Never overwrite/delete user content; never set the deploy-approval env var (carried from Phase 5 INSTALL-02 / SAFE-02).

</domain>

<decisions>
## Implementation Decisions

### State seed scope
- **D-01:** The installer seeds the **full state-plane skeleton** into the target so `/grugops` works immediately with no bootstrap required first: `.grugops/factory.config.json` + the install marker, the full `plans/` skeleton (`board.md`, `traceability.md`, `nfr-catalog.md`, `metrics.md`, the `epics/features/tickets/sprints/releases/` dirs, and `plans/handoffs/`), and the `memory-bank/` seed (`00-index`..`80-glossary` + `50-decisions/ADR-template.md`). Rationale: the orchestrator adapter hard-reads `.grugops/factory.config.json`, root `AGENTS.md`, and `plans/board.md` on start — a minimal seed would fail before bootstrap runs.
- **D-02:** All seeds are **bundled in the kit** so they travel to `$GRUGOPS_HOME` with the kit copy and the installer can seed any target FROM `$GRUGOPS_HOME` (self-contained; works even with no grugops source checkout present — e.g. re-seeding a second repo later). This mirrors the existing precedent that the default `factory.config.json` already lives in the kit (`agent-factory/config/factory.config.json`). The current repo-root `plans/` + `memory-bank/` skeletons are the canonical seed shape; bundling adds default seed copies under the kit (exact sub-location is planner discretion — see below).
- **D-03:** The bundled state-seed subtree is **excluded from `scripts/check-kit-refs.sh`'s scan**. Seeds are state TEMPLATES whose `.grugops/…` and `plans/…` refs are meant to resolve in the **target**, not the kit root — holding them to the kit-resolution gate would be a category error and risk false failures on legitimately repo-relative state refs. Phase 8 makes this one gate-exclusion edit.
- **D-04:** Seeding never overwrites: every seeded file is skipped if it already exists in the target (the never-clobber contract). Once a seeded skeleton is bootstrapped/filled it is the user's project state.

### Shared-kit lifecycle
- **D-05:** On install, the kit at `$GRUGOPS_HOME` is **always (re)copied** from the running checkout — same version → no effective diff (idempotent); a newer checkout → the shared kit updates in place. This is the design doc's "install/update the kit to `$GRUGOPS_HOME`; idempotent." **No version negotiation** (full skew handling is SKEW-01, deferred to v1.2). The kit is grugops-owned read-only, so overwriting it is not "user content."
- **D-06:** Uninstall (run from a target) removes **adapters + wiring only**: the `.claude` adapters, the CLAUDE.md / Copilot sentinel pointers, the Gemini `context.fileName` entry, and the `.grugops` install marker. It **NEVER** deletes the shared `$GRUGOPS_HOME` kit (other repos on the machine depend on it) and **NEVER** deletes seeded state (`board.md`/`plans/`/`memory-bank/` may now hold user work). Removing the shared kit is a manual `rm` (no `--purge-kit` flag this phase).

### Source-checkout guard
- **D-07:** The installer **refuses by default** when the target resolves to the grugops source checkout itself (e.g. resolved `TARGET == GRUGOPS_SRC`, and/or grugops source markers like `install/install.sh` + `agent-factory/VERSION` present), STOPping with a clear message ("you probably meant `--target <your-repo>`"). An explicit `--allow-self` / `--force` override proceeds. Rationale: installing into the clone would materialize a machine-specific absolute kit path into the **source** adapters (`.claude/skills/*`, `.claude/agents/grugops-orchestrator.md`), dirtying the repo; the refuse-by-default also closes the `--yes`/CI silent-self-install hole. Matches grugops's "safety is mechanical, not prose" ethos. (Exact detection predicate is planner discretion — see below.)

### Carry-forward cleanups (folded into Phase 8 scope)
- **D-08 (WR-05):** Drop the `Agent` (spawn) tool grant from the two packaging templates (`agent-factory/packaging/subagent.frontmatter.md` and the slash-command template). grugops uses single-window sequential role-load by design, NOT sub-agent spawning; the templates granting `Agent` is a regeneration hazard that would re-introduce the no-spawn violation in generated adapters. These files ship in the kit copied to `$GRUGOPS_HOME`, so fixing them here keeps the shipped kit correct.
- **D-09 (IN-01):** Rewrite the stale `agent-factory/config/…` config paths in `agent-factory/README.md` + `agent-factory/config/factory.config.md` to the current `.grugops/factory.config.json` spelling. These docs ride along in the kit copy; leaving them stale would document the wrong (pre-Phase-7) config path at `$GRUGOPS_HOME`. (Note: this is doc prose; the default config FILE itself legitimately stays at `agent-factory/config/factory.config.json` as the seed source.)

### Claude's Discretion
- **Install-marker content/shape** — what `.grugops/` records (kit version stamp, materialized absolute kit path, install date/mode). Keep it forward-compatible: the Phase 9 doctor will read it. Planner to design a minimal, parse-stable format (sh + Node must both write it identically for byte-parity).
- **Materialization mechanism** — how the absolute `KIT=` line is injected into the adapters. The source `grugops-orchestrator.md` already conventions it ("the absolute kit path the installer wrote above this line"). Decide the placeholder/insertion approach and the **re-materialization idempotency** rule (re-running install should produce zero diff when `$GRUGOPS_HOME` is unchanged, and correctly update the path when it changed — note the existing `link_or_copy` "identical copy" idempotency check won't apply once the adapter copy carries an extra injected line).
- **Which adapters carry the resolver** — Phase 7 confined the self-heal/STOP to exactly the two `.claude` adapters (+ the `subagent.frontmatter.md` packaging template); confirm which target files get the materialized absolute path vs which merely delegate.
- **Interactive prompt** wording + default ("Install into which repo? [.]"), `--target`/`--yes`/non-TTY detection mechanics, and the exact self-checkout detection predicate (D-07).
- **Exact kit-bundled seed sub-location** (e.g. a dedicated seed subtree under the kit) and the gate-exclusion glob (D-02/D-03).
- **`os.homedir()`** parity: `install.mjs` resolves the Windows home via `os.homedir()` rather than `$HOME`; ensure the sh/Node kit-root and seeded-target trees stay byte-identical.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & decision sources
- `docs/design/shared-install.md` — the canonical shared-install design: the 3 dogfood pains, the kit-vs-state split table, the path-root convention, the installer-changes section, and the explicitly-rejected alternatives. **Authoritative for this milestone.**
- `.planning/REQUIREMENTS.md` § "Milestone v1.1 Requirements" — **INSTALL-03** (`--target` + prompt + `--yes`/non-TTY, runs from any CWD) and **INSTALL-04** (seed per-repo state, copy-default, idempotent/additive/DRY_RUN/reversible, byte-parity, `os.homedir()`) are this phase; INSTALL-05 + VAL-02 are Phase 9; MIGR-01/SKEW-01 are deferred v1.2+.
- `.planning/ROADMAP.md` § "Phase 8: Two-Root Installer" — goal + the 5 success criteria; also the Phase 9 goal this phase must not pre-empt.
- `.planning/phases/07-shared-home-foundation-path-rewrite/07-CONTEXT.md` — Phase 7 decisions this phase builds on: D-11 (adapter-only resolution: materialized absolute path primary, self-heal fallback, STOP), D-08 (the `check-kit-refs.sh` gate logic + template allowlist), the frozen kit-vs-state convention.
- `.planning/research/SUMMARY.md` (+ `ARCHITECTURE.md` / `PITFALLS.md` / `STACK.md`) — v1.1 shared-install research; the roadmap notes patterns are fully specified there (no additional phase-level research needed).

### Files this phase touches (anchors)
- `install/install.sh` — the POSIX installer to rewrite (currently defaults `TARGET=$(pwd)` at line 36 — dogfood pain #1 — and `INSTALL_MODE=symlink` at line 40 — pain #2; never copies the kit — pain #3).
- `install/install.mjs` — the Node byte-parity twin (mirror every behavioral change; Windows home via `os.homedir()`).
- `install/uninstall.sh` — update for the two-root layout per D-06 (adapters + wiring only; never the shared kit or seeded state).
- `install/install.test.sh` — the existing regression harness; Phase 8 must not break it (its split-aware rewrite is a Phase 9 deliverable).
- `install/README.md` — installer docs (`--target`/copy-default/two-root behavior).
- `.claude/agents/grugops-orchestrator.md` + `.claude/skills/grugops/SKILL.md` (and the 6 dash skills) — the adapters the installer materializes the absolute kit path into; the orchestrator adapter already carries the resolver convention.
- `scripts/check-kit-refs.sh` — Phase 7 build gate; add the seed-subtree exclusion (D-03).
- `agent-factory/config/factory.config.json` — kit default config = the `.grugops/factory.config.json` seed source.
- `agent-factory/packaging/subagent.frontmatter.md` + the packaging slash-command template — WR-05 fix target (drop `Agent` grant) (D-08).
- `agent-factory/README.md` + `agent-factory/config/factory.config.md` — IN-01 fix target (stale config paths) (D-09).

### Seed-shape references (current canonical skeletons to bundle)
- `plans/` (repo-root) — `board.md`, `traceability.md`, `nfr-catalog.md`, `metrics.md` + `epics/features/tickets/sprints/releases/` dirs: the current seed shape for the target state plane.
- `memory-bank/` (repo-root) — `00-index`..`80-glossary` + `50-decisions/ADR-template.md`: the memory-bank seed shape.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `install/install.sh` is a clean, well-factored POSIX base (named helpers: `do_run`, `mkdirp`, `ensure_block`, `link_or_copy`, `merge_gemini`, `detect_tools`; `DRY_RUN` discipline via `do_run`; sentinel-block idempotency). Extend it rather than rewrite from scratch.
- `install/install.mjs` mirrors install.sh function-for-function (`ensureBlock`, `linkOrCopy`, `mergeGemini`, `detectTools`) with stdlib-only Node — the byte-parity contract is already established and tested.
- `agent-factory/config/factory.config.json` already exists as the kit default — direct seed source for `.grugops/factory.config.json`.
- `scripts/check-kit-refs.sh` (Phase 7) — the gate to add the seed exclusion to.

### Established Patterns
- **Sentinel-block additive append** (`ensure_block`) — idempotent, never-truncate writes to user files (CLAUDE.md, Copilot, Gemini). Reuse for any new additive markers.
- **Symlink-with-copy-fallback** (`link_or_copy`, D-30) — but D-05/INSTALL-04 flip the DEFAULT to copy; symlink becomes opt-in. The idempotency check ("identical copy present" → skip) needs rework for materialized adapters that carry an injected absolute-path line (Claude's Discretion above).
- **Target-local tool detection** (`detect_tools` / `detectTools`) — reports only tools whose marker exists in the TARGET, kept parity-identical across sh/Node (WR-04). Preserve this discipline for any new detection (e.g. self-checkout guard).
- **`GRUGOPS_SRC` / `TARGET` env overrides** — already present for hermetic test harnesses; `--target` should layer over `TARGET`, and `GRUGOPS_SRC` is the natural anchor for the D-07 self-checkout comparison.

### Integration Points
- The orchestrator adapter (`.claude/agents/grugops-orchestrator.md`) reads `.grugops/factory.config.json` + `plans/board.md` on start — the seed (D-01) must satisfy these reads, and the materialized kit path (SC1) must resolve `agent-factory/roles/orchestrator.md`.
- Phase 7's `check-kit-refs.sh` and the `validate-agent-factory.mjs` validator both run over the kit; the seed-subtree exclusion (D-03) keeps the kit-ref gate green, and the Phase 9 two-root validator will key off this phase's final layout.

</code_context>

<specifics>
## Specific Ideas

- The whole phase is motivated by a concrete dogfood failure (DOG-02, 2026-06-06): "had to change folder to run it," dangling adapters, the kit never arriving. Each decision traces to one of those three pains — the source-checkout guard (D-07) and copy-default (D-05) and full-state seed (D-01) are the direct fixes.
- The user prioritized **a target that works on first `/grugops`** (full state-plane seed) and **mechanical safety** (refuse-by-default self-guard) over minimal-diff installer changes — consistent with grugops's "safety is mechanical, not prose" constraint.
- Bundling seeds in the kit was chosen specifically for **self-containment** — a machine with only `$GRUGOPS_HOME` (no grugops source checkout) must still be able to seed a fresh target.

</specifics>

<deferred>
## Deferred Ideas

- **`uninstall.sh --purge-kit`** — an explicit, confirm-gated flag to remove the shared `$GRUGOPS_HOME` kit ("remove grugops from my machine entirely"). Considered and not adopted for Phase 8 (manual `rm` suffices); note for a future ergonomics pass.
- **Version-skew negotiation** between an installed kit and a target's stamped kit-version (SKEW-01) — explicitly v1.2; Phase 8 always re-copies without comparing versions.
- **Migration** of already-installed in-repo `agent-factory/` + symlink layouts to the two-root layout (MIGR-01) — v1.2; never delete-first.
- **Plugin-form kit resolution** via `${CLAUDE_PLUGIN_ROOT}` (the "second home" of one-rule-two-homes) — PLUGIN-01, v2+.
- **`install.test.sh` split rewrite** + the `--check` doctor + two-root validator — Phase 9 (INSTALL-05, VAL-02). Phase 8 must leave the existing harness passing but not rewrite it.

</deferred>

---

*Phase: 8-Two-Root Installer*
*Context gathered: 2026-06-07*
