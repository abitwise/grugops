# Phase 15: TypeScript Tooling Migration - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate grugops's **tooling layer** from POSIX sh / stdlib `.mjs` to TypeScript at behavior parity, establish the cross-platform execution model, and define the **kit-shipped-runnable convention** that Phase 16's gate checker builds on. Also formally amend the foundational "markdown + stdlib-only, no-npm-deps, dual sh/Node installer" constraint to the ratified TS posture.

**In scope — full sweep of tooling scripts → TS:**
- `install/install.sh` + `install/install.mjs` → a single `install.ts`
- `install/uninstall.sh` → `uninstall.ts`
- `scripts/validate-agent-factory.mjs`
- `scripts/generate-asvs-checklist.mjs`
- `scripts/check-foundation-guards.sh`
- `scripts/check-kit-refs.sh`
- `hooks/guard.sh` (the prod-deploy safety guard)
- All paired `.test.*` harnesses (`install.test.sh`, `install.two-root.test.sh`, `validate.test.sh`, `check-foundation-guards.test.sh`, `guard.test.sh`)

**Out of scope (not this phase):** the §14 gate's lint / UI-E2E / test-integrity *content* (Phase 16); `install --migrate` / `--update` (Phase 17); the browsable docs catalog (Phase 18); any new tooling capability beyond porting existing behavior.

</domain>

<decisions>
## Implementation Decisions

### Build & Runtime Posture
- **D-01: Compile with `tsc` to JavaScript — NOT native type-stripping.** This is a deliberate departure from the roadmap's *stated preference* (SC1 says type-stripping "preferred"). Justification (satisfies SC1's "any added build step / dependency justified in writing"): tsc-compile buys (a) compile-time type-checking as a build side-effect, (b) committed runnable `.js` that needs **no toolchain on host machines**, (c) freedom from erasable-only-TS restrictions (enums, parameter-properties allowed). The cost — a build step + the `typescript` dev-dep — is confined to grugops's dev/CI and **never ships to host machines**.
- **D-02: Commit both `.ts` source and compiled `.js`, guarded by a freshness check.** Rebuild-to-temp → diff → fail red on drift. This mirrors grugops's existing generated-artifact pattern (ASVS checklist generator; the Phase-18 catalog freshness check). Hosts and CI never run a build; they run the committed `.js`.
- **D-03: Node runtime floor = 22+ LTS.** Drops the EOL Node 18 line (EOL 2025-04-30), modern baseline. (Acknowledged tension, recorded intentionally: at a Node 22+ floor native type-stripping *would* have been available — tsc-compile was still chosen per D-01.) `tsconfig` target ~ES2022.

### Dependency Posture
- **D-04: Introduce `package.json` + `tsconfig.json` + a committed lockfile.** The repo has none today (deliberate, per spec §18); `tsc` requires `typescript`, so these arrive. This is part of the formal constraint amendment.
- **D-05: Amended dependency constraint — "zero runtime deps; dev/build deps minimal + individually justified."** Shipped/compiled `.js` requires **nothing installed on host machines** (the real spirit of the old "no-npm-deps" rule is preserved). The current justified dev-dep set is **`{typescript` (compiler), `vitest` (test runner)`}`** — both dev/CI-only. Note this re-reads the in-session "typescript as the sole dev-dep" line as "minimal + justified," not "exactly one."
- **D-06: Test runner = Vitest.** Chosen over `node:test` for DX; both run cross-platform (incl. Windows), satisfying SC2's harness-migration + the Windows driver behind Phase 16. The `.test.sh` harnesses become Vitest (`.test.ts`) suites. Vitest is grugops's internal test tooling and is never shipped to host repos.

### install.sh Fate (SC4 explicit decision point)
- **D-07: Full TS — drop the zero-Node POSIX install path.** `install.sh` + `install.mjs` collapse into a single `install.ts` (compiled `install.js`). **Node becomes a documented hard install prerequisite.** The dual sh/Node **byte-parity install contract is retired** (one installer, one source of truth). Ruled on explicitly per SC4 — not done silently. Trade accepted: the truly Node-less installer (e.g. a Codex-CLI-only user without Node) is no longer served; consolidation + single-source maintenance wins.
- **D-08: SC2 byte-parity clause is superseded.** Phase 15 SC2 currently reads "the byte-parity sh/Node install contract … still fail red on a regression." With D-07 there is no sh installer to keep in parity. The install harness reframes from *"assert sh ≡ Node output"* to *"assert the single installer's behavior (additive, idempotent, `DRY_RUN`, reversible, never-overwrite)."* **The absence of the parity test is intentional, not a regression** — planner/verifier must treat it as such.
- **D-09: Full-sweep migration — nothing POSIX remains.** Includes `uninstall.sh`, `hooks/guard.sh`, and `check-kit-refs.sh` (beyond the roadmap's explicitly-named five). SC2's "all existing tooling scripts" governs over the narrower goal-line list.
- **D-10: The migrated prod-deploy guard MUST fail closed.** Now that `hooks/guard.sh` becomes Node + compiled `.js`, if `node` or `guard.js` cannot execute (missing Node, missing/stale artifact), the protected action is **blocked**, never allowed through. The committed-`.js` + freshness-check (D-02) mitigates staleness; the installer must materialize `guard.js` into the host's hook location. This upholds CLAUDE.md's hard-safety "enforce mechanically" constraint.

### Kit-Shipped-Runnable Convention (SC3 — Phase-16 foundation)
- **D-11: The installer MATERIALIZES the compiled routine into the host repo.** Routines are authored `.ts` in the central kit → compiled to committed `.js` → the installer copies the specific routine(s) to a known **committed** path inside the host repo; the host commits them. The host's gate then runs them in **its own CI with only Node present — no `~/.grugops` / grugops install required**. This solves the central-kit-not-in-CI problem and matches SC3's "materialized by the installer." Footprint is one small `.js` per routine, not the whole kit (preserves the two-root no-vendoring principle for everything else).
- **D-12: Invocation + result contract (uniform across all kit-shipped runnables).** Form: `node <repo-local-path>/<routine>.js [args]`. **Exit code is the gate signal:** `0` = pass, `1` = findings/fail, `2` = error (distinguishable). **stdout carries human-readable findings in clear professional voice** (for the audit trail), with an optional `--json` machine-readable block. Gate/workflow steps branch on exit code; humans + the trace read stdout. Consistent with grugops's existing exit-code guards and the two-voice / no-fabrication ethos.

### Constraint Amendment (SC4)
- **D-13: Formally amend the foundational constraint in CLAUDE.md and PROJECT.md** to record the ratified TS pivot: tooling layer is TypeScript (tsc-compiled, committed `.js`, freshness-checked); single Node-required `install.ts` (no POSIX installer); dev-deps `{typescript, vitest}`; zero runtime deps on hosts; Node 22+ floor. **Mark the prior "HELD" notes superseded** in `12-CONTEXT.md` (line ~156), `13-CONTEXT.md` (line ~142), and `14-CONTEXT.md` (lines ~26, ~57, plus D-03's "no TypeScript" rule).

### Claude's Discretion (for research/planning, not user decisions)
- Behavior-parity proof strategy during transition (e.g. run old script vs new in parallel and diff outputs before deleting the old).
- Exact committed host-local path routines materialize to (e.g. a `tools/`, `.grugops/bin/`, or `bin/` dir) and naming.
- CI wiring of `tsc` typecheck + `vitest` + the freshness check.
- Whether/how the two-root validator (`validate-agent-factory`) and the `$GRUGOPS_HOME` resolution are touched by the TS port.
- Linting/formatting of grugops's *own* TS is **deferred to Phase 16** (which establishes the lint gate) — do not add a linter dev-dep here.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 15 section (Goal, Depends-on Phases 9+10, SC1–SC4) and the Phase 16/17 dependency notes
- `.planning/REQUIREMENTS.md` — `TOOL-01` (TS tooling layer, cross-platform, build/dep posture) and `TOOL-02` (kit-shipped-runnable convention)
- `.planning/phases/16-14-gate-convergence-lint-ui-e2e-test-integrity/16-PRE-DECISIONS.md` — Phase 16's locked decision that its test-integrity checker is **TypeScript on the Phase-15 foundation**, shipped via the kit-shipped-runnable convention (the concrete consumer of D-11/D-12)

### Scripts being migrated (the behavior-parity targets)
- `install/install.sh` + `install/install.mjs` — the dual installer collapsing into `install.ts` (D-07)
- `install/install.test.sh`, `install/install.two-root.test.sh` — install harnesses → Vitest; parity assertions reframed per D-08
- `install/uninstall.sh` — → `uninstall.ts` (D-09)
- `scripts/validate-agent-factory.mjs` + `scripts/validate.test.sh` — the structure validator (two-root aware) + harness
- `scripts/check-foundation-guards.sh` + `scripts/check-foundation-guards.test.sh` — foundation guard checker + RED-by-design harness
- `scripts/generate-asvs-checklist.mjs` — the ASVS generator (already the "generate + freshness" pattern D-02 mirrors)
- `scripts/check-kit-refs.sh` — kit-reference checker (D-09 full sweep)
- `hooks/guard.sh` + `hooks/guard.test.sh` — prod-deploy safety guard; migration must fail closed (D-10)

### Architecture context
- `docs/design/shared-install.md` — the v1.1 two-root model (`$GRUGOPS_HOME` central read-only kit + per-repo state + adapters). Grounds D-11: routines materialize per-repo precisely because the central kit is absent in host CI.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Generated-artifact + freshness pattern** already exists (`scripts/generate-asvs-checklist.mjs` regenerates a committed checklist; Phase 18 plans a regenerate-to-temp/diff freshness check). D-02 reuses this exact shape for the committed `.js` build outputs.
- **Exit-code guard convention** already exists across `hooks/guard.sh` and `scripts/check-foundation-guards.sh`. D-12's exit-code contract is a formalization, not a new idiom.
- **Two-root resolution** (`$GRUGOPS_HOME`, doctor/`--check` that fails loudly on an unresolved path) is the established cross-platform path mechanism the kit-shipped-runnable invocation rides on.

### Established Patterns
- **Single-source / no-fork** — gate changes land only in `05-pr-quality-gate.md`; never write literal "§14" into a shipped file (Phase 12 D-12). Carries into how Phase 16's checker is referenced, not duplicated.
- **Two-voice** — caveman voice in role prompts; **clear professional voice** in safety/security/findings. D-12's stdout findings use clear voice.
- **No-fabrication / `UNKNOWN - verify`** — never fake a passing gate/test/citation. Applies to every migrated checker's output.
- **Installer contract** — additive, idempotent, `DRY_RUN=1`, reversible, never overwrite/delete user content, never set the deploy-approval env var. `install.ts` must preserve all of this (D-07/D-08 reframes only the *parity* dimension).

### Integration Points
- The installer (`install.ts`) gains a new responsibility: **materialize kit-shipped runnables into the host repo** (D-11) in addition to laying adapters + seeding state.
- `hooks/guard.js` must be wired into the host's Claude Code hook config and fail closed (D-10).
- Node 22+ becomes a stated prerequisite in the installer/doctor and README (D-03/D-07).

</code_context>

<specifics>
## Specific Ideas

- The convention is explicitly designed **for Phase 16's consumption**: a committed, host-local, Node-only, exit-code-+-stdout routine that the §14 gate invokes to check test-integrity in *any* host repo without grugops installed. Phase 15 must leave that interface concrete and proven (a trivial reference routine + its RED fixture is the natural way to validate D-11/D-12 before Phase 16 relies on it).
- The choice of `tsc` over type-stripping was made *despite* a Node 22+ floor making stripping viable — record the rationale (D-01) so it isn't "corrected" later as an oversight.

</specifics>

<deferred>
## Deferred Ideas

- **Native type-stripping / zero-build execution** — considered and explicitly rejected for now (D-01); revisit only if the `typescript` dev-dep or build step becomes a real burden.
- **Linting/formatting grugops's own TypeScript** — deferred to **Phase 16**, which establishes the lint gate; no linter dev-dep added in Phase 15.
- **Phase 17 reframing ripple** — Phase 17's success criteria reference `install.sh --migrate` and "sh/Node byte-parity"; with D-07 those reframe to `install --migrate` on the TS installer with no parity dimension. Note for the eventual `/gsd-discuss-phase 17`; not acted on here.
- **Serving the truly Node-less installer** (e.g. Codex-CLI-without-Node users) — dropped by D-07. If demand surfaces, a thin POSIX bootstrap could be reconsidered as its own small phase.

</deferred>

---

*Phase: 15-typescript-tooling-migration*
*Context gathered: 2026-06-13*
