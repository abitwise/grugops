# Phase 15: TypeScript Tooling Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-13
**Phase:** 15-typescript-tooling-migration
**Areas discussed:** Build & runtime posture, Dependency posture, install.sh fate, Kit-shipped-runnable

---

## Build & Runtime Posture

### Runtime execution model

| Option | Description | Selected |
|--------|-------------|----------|
| Native type-stripping | Run `.ts` directly via Node's built-in stripping; zero build, erasable-only TS; roadmap's stated preference | |
| tsc compile to JS | Compile `.ts` → `.js`; works on any Node, type-checks as a build side-effect; adds build + `typescript` dep | ✓ |
| Bundle to single JS | esbuild/tsup to one self-contained `.js` per tool; cleanest dist but pulls a bundler dep | |

**User's choice:** tsc compile to JS
**Notes:** Deliberate departure from the roadmap's type-stripping preference. Flagged as the SC1 "justified in writing" departure — gains free type-check + host-toolchain-free runnable `.js` + freedom from erasable-only limits; cost (build + `typescript` dep) confined to dev/CI.

### Artifact source

| Option | Description | Selected |
|--------|-------------|----------|
| Commit .js + freshness check | Version `.ts` + compiled `.js`; rebuild-to-temp/diff fails red on drift; mirrors ASVS generator / Phase 18 catalog | ✓ |
| Build at release time | Repo holds `.ts` only; compile at packaging; ships in published artifact | |
| Build at install time | Installer runs `tsc` on host; forces toolchain onto every install machine | |

**User's choice:** Commit .js + freshness check
**Notes:** Hosts and CI never build; consistent with grugops's existing generated-artifact pattern.

### Node runtime floor

| Option | Description | Selected |
|--------|-------------|----------|
| Node 20+ | Drop EOL 18, active LTS baseline, broad host compat | |
| Keep Node 18+ | Maximal compat but commits to supporting an EOL runtime | |
| Node 22+ LTS | Newest active LTS; modern baseline (where type-stripping would also have worked) | ✓ |

**User's choice:** Node 22+ LTS
**Notes:** Recorded tension — at this floor native type-stripping was viable; tsc-compile chosen anyway.

---

## Dependency Posture

### Amended dependency constraint

| Option | Description | Selected |
|--------|-------------|----------|
| Zero runtime, minimal dev | package.json + tsconfig + lockfile; `typescript` dev-dep; zero runtime deps on hosts, dev-deps minimal + justified | ✓ |
| Vendor tsc, no package.json | Avoid package.json; vendor/global tsc; fragile, non-idiomatic, lockfile-less | |
| Allow runtime deps too | Permit vetted runtime npm deps; breaks "hosts stay clean" promise | |

**User's choice:** Zero runtime, minimal dev
**Notes:** "no-npm-deps" reframed to "zero runtime deps; dev/build deps minimal + justified."

### Test runner

| Option | Description | Selected |
|--------|-------------|----------|
| node:test built-in | Zero new dep, cross-platform incl. Windows; less DX sugar | |
| Vitest | Richer DX (watch, snapshots, assertions); adds a dev-dep | ✓ |
| Keep harnesses as sh | Least rework but Unix-only; SC2 says harnesses migrate | |

**User's choice:** Vitest
**Notes:** Dev-dep set becomes `{typescript, vitest}` — both dev/CI-only, never shipped to hosts. Walks back "sole dev-dep" to "minimal + justified."

---

## install.sh Fate

| Option | Description | Selected |
|--------|-------------|----------|
| Tiny POSIX bootstrap | sh shim locates Node + execs compiled install.js; keeps `curl\|sh` ergonomics, single TS source; still needs Node | |
| Keep full POSIX install.sh | Don't migrate install.sh; preserves genuine zero-Node path; dual-maintain two installers forever | |
| Full TS, drop zero-Node | Everything → install.ts; Node = hard prereq; byte-parity contract retired; no sh installer | ✓ |

**User's choice:** Full TS, drop zero-Node
**Notes:** Ruled on explicitly per SC4. Triggered two recorded reconciliations — SC2's byte-parity clause superseded (→ single-installer behavior tests), and a Phase-17 reframing note. Followed by a scope question:

### Migration scope (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Full sweep | All tooling scripts → TS incl. uninstall.sh, hooks/guard.sh, check-kit-refs.sh; nothing POSIX remains | ✓ |
| Keep guard.sh as POSIX | Migrate the 5 + uninstall; keep safety guard as POSIX (fewest deps) | |
| Explicit 5 only | Strictly the roadmap-named five + harnesses | |

**User's choice:** Full sweep
**Notes:** Recorded hard requirement — the migrated Node-based prod-deploy guard must fail *closed* (block if node/guard.js can't run).

---

## Kit-Shipped-Runnable

### Run-from model

| Option | Description | Selected |
|--------|-------------|----------|
| Materialize into host repo | Installer copies compiled routine(s) into host repo (committed); runs in host CI with only Node, no ~/.grugops | ✓ |
| Run from central kit | Routine stays in $GRUGOPS_HOME; breaks in host CI where ~/.grugops is absent | |
| Host-managed dependency | Publish as versioned npm package host installs; against zero-runtime-deps + drops-on-top ethos | |

**User's choice:** Materialize into host repo
**Notes:** Solves the central-kit-not-in-CI problem; tiny footprint (one `.js` per routine).

### IO contract

| Option | Description | Selected |
|--------|-------------|----------|
| Exit code + structured stdout | Exit 0/1/2; stdout clear-voice findings + optional `--json`; gate branches on exit code | ✓ |
| Exit code only + human text | Simplest, matches current guards; no machine-readable detail | |
| JSON-to-stdout primary | Always emit JSON; maximally machine-consumable but less glanceable, parser-dependent | |

**User's choice:** Exit code + structured stdout
**Notes:** Uniform interface across all kit-shipped runnables; consistent with existing exit-code guards + two-voice ethos.

---

## Claude's Discretion

- Behavior-parity proof strategy during transition (run old vs new in parallel + diff).
- Exact committed host-local path routines materialize to + naming.
- CI wiring of `tsc` typecheck + `vitest` + freshness check.
- Whether/how the two-root validator and `$GRUGOPS_HOME` resolution are touched by the port.
- Linting/formatting of grugops's own TS — deferred to Phase 16.

## Deferred Ideas

- Native type-stripping / zero-build execution — rejected for now (D-01); revisit if `typescript` dep/build becomes a burden.
- Linting/formatting grugops's own TS — deferred to Phase 16 (owns the lint gate).
- Phase 17 reframing ripple — `install.sh --migrate` / "sh/Node byte-parity" reframes to `install --migrate` on the TS installer; note for `/gsd-discuss-phase 17`.
- Serving the truly Node-less installer (Codex-CLI-without-Node) — dropped by D-07; a thin POSIX bootstrap could return as its own phase if demanded.
