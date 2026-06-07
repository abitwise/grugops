# Phase 9: Doctor & Two-Root Validator - Research

**Researched:** 2026-06-08
**Domain:** Verification layer for the grugops shared-kit / per-repo-state install split — a `--check` doctor (POSIX sh + Node, byte-parity) and a two-root-aware structure validator (Node stdlib)
**Confidence:** HIGH (grounded entirely in the actual Phase 7/8 source the planner extends; no external dependencies; all conventions internally specified in `.planning/research/{PITFALLS,SUMMARY}.md` + `docs/design/shared-install.md`)

## Summary

This phase ships nothing new technically — it adds a verification layer over the two-root installer that Phase 8 froze. Every mechanism it needs already exists in the repo: `resolve_grugops_home()` / `os.homedir()` (the one resolution rule), `write_marker()` (the 4-field `.grugops/install.json` the doctor reads back — and which **no non-test code reads today**, so the doctor is its first consumer), the `MAT_OPEN`/`MAT_CLOSE`/`MAT_SLOT` sentinels (the adapter `KIT=` line the doctor cross-checks), the `pass()/fail()/FAILS` sh harness idiom, and the validator's `errors[]`/`warnings[]` + `--strict` two-tier. The work is: (1) hook a `--check` arm into both installers that re-resolves the kit root three ways and stats every referenced path, failing on the FIRST unresolved one; (2) split the validator's single `ROOT` into an explicit `KIT_ROOT` + `STATE_ROOT` with **no default**, so an unset root is a hard error not a silent `.`-fallback; (3) extend `install.test.sh` with good-split-passes / missing-kit-fails doctor checks while keeping `install.two-root.test.sh` (GREEN 18/18) as the deep harness.

The single load-bearing risk is **C3, the false-green** (`.planning/research/PITFALLS.md` Pitfall C3): the current validator's `ROOT = process.env.VALIDATE_ROOT ? resolve(...) : resolve(SCRIPT_DIR, "..")` (validate-agent-factory.mjs:32-35) silently defaults to the dev checkout — run inside grugops it always finds a full `agent-factory/` and passes. The split must make an unset/missing kit root **fail loudly**, and a BAD fixture must prove it. The doctor and validator must resolve the kit home by the **identical** rule (re-implemented, not shared across the sh boundary) and a shared test must assert they agree (D-04 / SC4).

**Primary recommendation:** Add `--check` as a parse-and-resolve doctor that reads the two materialized adapters + the marker, cross-checks three kit-root sources (re-resolved rule / marker `kitRoot` / adapter `KIT=`), and stats start-up-load-bearing paths plus the resolved kit refs the adapter names — stopping at the FIRST unresolved path. Split the validator on two new explicit env vars (`VALIDATE_KIT_ROOT` + reuse `VALIDATE_ROOT` as the state root) with NO default for the kit root. Drive the C3 BAD fixture by pointing the explicit kit root at a nonexistent dir (deterministic, hermetic). Fold the uninstalled/dev-checkout case into the FAIL path with a distinct "not installed" message.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01 … D-10, carry forward verbatim)

**Doctor check scope (INSTALL-05 / SC1)**
- **D-01:** The doctor uses a **parse-and-resolve** strategy — reads what the installer actually wrote (the two materialized adapters and `.grugops/install.json`), resolves the paths they reference, stats them. NOT a hand-maintained curated checklist. MUST reuse the Phase-7 kit-vs-state classification so kit refs resolve at `KIT_ROOT` and state refs resolve repo-relative — otherwise it false-fails on legitimately repo-local state refs.
- **D-02:** On failure the doctor names the **FIRST** unresolved path together with the file that references it (SC1). Resolution order MUST be deterministic so "first" is stable across runs.

**Kit-root resolution — the "can never disagree" mechanism (SC4)**
- **D-03:** The doctor **cross-checks all three** sources of the kit root: (a) the freshly re-resolved `${GRUGOPS_HOME:-$HOME/.grugops}` rule, (b) the marker's `kitRoot` field in `.grugops/install.json`, (c) the materialized `KIT=` line in the adapter sentinel block. Disagreement is surfaced as a finding, never a silent pass.
- **D-04:** The validator (VAL-02) resolves the kit home by the **same rule** so doctor and validator can never disagree (SC4). Because the doctor lives in `sh`+Node and the validator in Node, "resolve identically" is guaranteed by re-implementing the one rule and asserting agreement in a shared test — NOT by shared code across the sh boundary.

**Doctor FAIL conditions (hard, nonzero)**
- **D-05:** Hard FAIL: unresolvable `KIT_ROOT`; missing `agent-factory/roles/orchestrator.md`; an unresolvable materialized adapter `KIT` path; unset/missing `$GRUGOPS_HOME` (the C3 footgun); **any dangling symlink** in the resolved set (SC1 explicitly names "no dangling symlinks").

**Doctor WARN conditions (exit 0 by default; `--strict` promotes to nonzero)**
- **D-06:** WARN tier is **non-empty** this phase (so `--strict` has live warnings, satisfying SC2 with real behavior): **kit-version skew** (marker `kitVersion` ≠ installed kit's `VERSION`) and **missing optional seed** (a seed file that should exist but doesn't — e.g. an empty `plans/` subdir or `memory-bank/` seed — since the user may have intentionally pruned state).
- **D-07:** Skew is **detected and warned only** — no negotiation or auto-resolution (SKEW-01, v1.2).

**Two-root validator structure (VAL-02 / SC3)**
- **D-08:** `scripts/validate-agent-factory.mjs` becomes two-root aware with an **explicit kit root + state root, no default → unset is an error** (kills the `.`-fallback, forces the C3 BAD fixture to fail). Validates the kit subtree and the repo state subtree **independently** (two passes / two roots).
- **D-09:** `scripts/check-kit-refs.sh` (the Phase-7 grep-to-zero gate) stays **separate** — VAL-02 neither absorbs nor calls it (least coupling; preserves the POSIX-only CI option; honors Phase-7 D-07 "kept separate").

**Test-harness plan (VAL-02 / SC5)**
- **D-10:** **Extend `install.test.sh`** with the SC5 doctor checks (fresh install lays kit + materializes adapter + seeds `.grugops/factory.config.json` and `plans/handoffs/`; doctor passes on a good split; doctor fails loudly on a missing kit), preserving idempotency / dry-run / reversibility. **Keep `install.two-root.test.sh`** as the deep two-root harness. Two harnesses; some overlap accepted. (Phase 8's "do not rewrite install.test.sh" boundary is lifted for these doctor additions.)

### Claude's Discretion (resolved by this research — see § Discretion Resolutions for full rationale)
- Cross-check mismatch severity (D-03) → **FAIL on true divergence, WARN on cosmetic-but-equivalent path difference**.
- Parse-and-resolve breadth (D-01) → **adapters + marker + start-up load-bearing reads + the kit refs the resolved adapter actually names**, bounded and deterministic; do NOT re-grep the whole kit tree (overlaps `check-kit-refs.sh`, D-09).
- C3 BAD-fixture mechanism (D-08) → **point the explicit kit-root input at a nonexistent dir** (primary); also add an **unset-kit-root** fixture (no default → must error). Both fail.
- Validator env-var/input naming (D-08) → **reuse `VALIDATE_ROOT` as the state root; add a new explicit `VALIDATE_KIT_ROOT`** (no default).
- Uninstalled/dev-checkout `--check` → **fold into the FAIL path with a distinct "not installed — run install.sh" message** + nonzero exit; never crash.
- Doctor output format → human-readable lines naming the failing path + referencing file.

### Deferred Ideas (OUT OF SCOPE — do not research or build)
- Doctor `--fix` / auto-repair of user content (FIX-01 → v2+). `--check` reports and names only; never edits the user's repo.
- `install.sh --migrate` for in-repo `agent-factory/` + symlink layouts (MIGR-01 → v1.2).
- `install.sh --update` central-kit refresh (UPD-01 → v1.2).
- Version-skew **negotiation/handling** (SKEW-01 → v1.2). This phase **detects + WARNs** only.
- Plugin-form kit resolution via `${CLAUDE_PLUGIN_ROOT}` (PLUGIN-01 → v2+).
- `uninstall.sh --purge-kit` (Phase 8 deferred). Not this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **INSTALL-05** | `install.sh --check` (and `install.mjs`) is a doctor that verifies every referenced path resolves (kit at the kit root, state in the repo), names the first failure with its referencing file, exit codes 0 pass / nonzero fail / WARN→0 / `--strict` gates WARN. | Reuses `resolve_grugops_home()` (install.sh:86-91), `abspath()` (install.sh:75-80), the marker `write_marker()` writes (install.sh:431-447), the `MAT_OPEN/MAT_CLOSE/MAT_SLOT` sentinels (install.sh:329-331) → parse the adapter `KIT=` line. Exit-code convention mirrors the existing `pass()/fail()` + validator `--strict`. See § Architecture Patterns and § Doctor Algorithm. |
| **VAL-02** | Two-root validator (explicit kit root + repo root, **no `.`-fallback**) so it cannot false-green in the dev checkout or with `$GRUGOPS_HOME` unset; a BAD fixture for a missing/unset kit root must fail. `install.test.sh` updated for the split (fresh install + seed + doctor; idempotency/dry-run/reversibility preserved). | Splits validate-agent-factory.mjs:32-52 (`ROOT` + `exists()/safeRead()/listDir()` helpers) into `KIT_ROOT` + `STATE_ROOT`. Reuses the existing GOOD/BAD fixture self-test pattern (validate.test.sh) + 8 committed fixtures. See § Validator Split and § Validation Architecture. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Kit-root resolution (`${GRUGOPS_HOME:-$HOME/.grugops}` → `/agent-factory`) | Installer/doctor (sh + Node) | Validator (Node) | The one rule already lives in `resolve_grugops_home()` / `os.homedir()`. Doctor re-uses it; validator re-implements it identically (D-04). NOT shared code across the sh boundary. |
| Marker read-back (`.grugops/install.json` → `kitRoot`, `kitVersion`) | Doctor (sh + Node) | — | The doctor is the FIRST reader of the marker (no non-test code reads it today, verified by grep). Parse the 4 fixed fields. |
| Adapter `KIT=` line parse (sentinel block) | Doctor (sh + Node) | — | The materialized adapter is the sole binding of an absolute kit path; the doctor cross-checks it (D-03). |
| Path stat / dangling-symlink detection | Doctor (sh: `[ -e ]` / `[ -L ]` + resolve; Node: `existsSync`/`lstatSync`) | — | Filesystem-level; identical to install's existing `[ -L ]` / `isSymlink()` helpers. |
| Two-root structure validation (file/section presence, config parse) | Validator (Node stdlib) | — | Extends the existing single-`ROOT` validator; no installer involvement. |
| Kit-vs-state ref classification | Both doctor and validator | `check-kit-refs.sh` (separate, D-09) | The Phase-7 classification (`agent-factory/…` = KIT at kit root; `plans/`, `memory-bank/`, `.grugops/` = STATE repo-relative) is the shared rule both must honor; the grep gate stays a separate tool. |

## Standard Stack

This phase adds **zero** new dependencies. The entire stack is POSIX `sh` builtins + Node ≥18 stdlib, by project constraint (CLAUDE.md: "Markdown for everything except installers … and one optional Node validator"; SUMMARY.md: "stdlib-only by project constraint — no new deps, no `package.json`").

### Core (already present — extend, do not add)
| Tool/API | Version | Purpose | Why Standard |
|----------|---------|---------|--------------|
| POSIX `sh` (`set -eu`, `printf`, `[ -e ]`/`[ -L ]`, `grep -qF`, `awk`) | n/a | `install.sh --check` doctor arm | House style of every install/* script; `[VERIFIED: install.sh source]` |
| Node ≥18 stdlib (`node:fs` `existsSync`/`lstatSync`/`readFileSync`, `node:path` `resolve`/`join`, `node:os` `homedir`) | v24.12.0 present locally | `install.mjs --check` twin + the validator | Zero-dep, byte-parity contract; `[VERIFIED: node --version → v24.12.0]` |
| `realpath` / `readlink` | system | OPTIONAL for dangling-symlink resolution in sh | Available (`/bin/realpath`, `/usr/bin/readlink` `[VERIFIED: command -v]`), but the existing `abspath()` + `[ -e ]` already suffice — do NOT introduce a hard `realpath` dependency (portability). |

### Supporting (existing idioms to reuse)
| Asset | Location | Reuse For |
|-------|----------|-----------|
| `resolve_grugops_home()` | install.sh:86-91 | doctor kit-root re-resolution (source (a) of D-03) |
| `os.homedir()` + `toPosix()` | install.mjs:86-92 | Node doctor kit-root re-resolution |
| `abspath()` | install.sh:75-80 | normalize possibly-nonexistent paths before stat |
| `write_marker()` field layout | install.sh:431-447 / install.mjs:437-457 | exact marker schema the doctor reads back (4 fields, fixed order) |
| `MAT_OPEN`/`MAT_CLOSE`/`MAT_SLOT` + the awk strip pass | install.sh:329-389 / install.mjs:327-382 | parse `KIT="…"` out of the adapter sentinel block |
| `isSymlink()` / `[ -L ]` | install.mjs:175-181 / install.sh:197 | dangling-symlink FAIL (D-05) |
| `pass()/fail()/FAILS` + `snapshot()` + `mktemp -d` trap | install.test.sh / install.two-root.test.sh | the SC5 doctor test checks |
| `errors[]`/`warnings[]` + `--strict` two-tier | validate-agent-factory.mjs:54-59,390-396 | validator findings + doctor WARN/strict mirror |
| `run_fixture`/`expect_pass`/`expect_fail` | validate.test.sh:38-60 | two-root validator self-test (add KIT_ROOT fixtures) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reuse `VALIDATE_ROOT` as state root + new `VALIDATE_KIT_ROOT` | Two fresh names (`VALIDATE_STATE_ROOT` + `VALIDATE_KIT_ROOT`) | Two fresh names is cleaner-but-breaks the existing 8 fixtures' invocation and `validate.test.sh`. Reusing `VALIDATE_ROOT` as the state root keeps the existing single-tree fixtures valid as state-root fixtures and is the minimal diff. **Recommend reuse.** (See § Discretion Resolutions.) |
| Re-implement the one resolution rule in the validator (D-04) | Extract a shared `resolve_kit_root.mjs` the validator imports | A shared module is purer DRY, but the doctor's sh side cannot import it — so parity would still need a test. Re-implement + assert agreement in a shared test is the locked decision (D-04) and matches "two languages, one installer." |
| `[ -e ]` + `abspath` for path resolution | hard `realpath -e` dependency | `realpath -e` fails on nonexistent leaves (useful) but is non-POSIX-portable and the harness already avoids non-portable tools. Use `[ -e ]`/`[ -L ]`. |

**Installation:** none — no packages.

**Version verification:** N/A — no external packages. Node confirmed `v24.12.0` `[VERIFIED: node --version]`; kit `VERSION` is `0.1.0` `[VERIFIED: agent-factory/VERSION]`.

## Package Legitimacy Audit

**Not applicable.** This phase installs **zero** external packages (POSIX sh + Node stdlib only, by hard project constraint — no `package.json`, no npm/PyPI/crates dependency). The Package Legitimacy Gate is satisfied vacuously: there is nothing to slopcheck. Any future deviation (adding a dependency) would violate CLAUDE.md and must be rejected by the planner.

## Architecture Patterns

### System Architecture Diagram

```
                          install.sh --check / install.mjs --check   (the DOCTOR)
                          ───────────────────────────────────────
  invocation
  (in a target repo  ─────────────►  [parse phase: read what the installer wrote]
   OR a dev checkout)                    │
                                         ├─ read .grugops/install.json ──► marker.kitRoot, marker.kitVersion
                                         │     (absent? → "not installed — run install.sh", nonzero FAIL)
                                         ├─ read .claude/agents/grugops-orchestrator.md
                                         │   + .claude/skills/grugops/SKILL.md
                                         │     └─ extract KIT="…" from MAT_OPEN/MAT_CLOSE block
                                         │
                                         ▼
                          [resolve phase: the THREE kit-root sources — D-03]
                            (a) re-resolve  ${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory   ◄── same rule as install
                            (b) marker.kitRoot
                            (c) adapter KIT=
                                         │
                                  cross-check ──► true divergence? ──► FAIL (name all three)
                                         │        cosmetic-equal?  ──► WARN
                                         ▼
                          [stat phase: deterministic ordered path set]
                            for each ref in ORDER:
                              kit ref   → resolve under KIT_ROOT, stat
                              state ref → resolve repo-relative, stat
                              symlink   → if dangling → FAIL
                              FIRST unresolved ──► print "<path>  (referenced by <file>)"  → FAIL, STOP
                                         │
                                         ▼
                          [warn phase: D-06]
                            marker.kitVersion ≠ $KIT_ROOT/VERSION ──► WARN (skew)
                            missing optional seed (plans/ subdir, memory-bank seed) ──► WARN
                                         │
                                         ▼
                            exit 0 (pass / WARN-only)   |   nonzero (FAIL, or WARN+--strict)


                          scripts/validate-agent-factory.mjs   (the TWO-ROOT VALIDATOR)
                          ──────────────────────────────────
  invocation ──► KIT_ROOT  = VALIDATE_KIT_ROOT   (NO DEFAULT — unset ⇒ hard error)
                 STATE_ROOT = VALIDATE_ROOT || (back-compat) repo root
                                         │
                          ┌──────────────┴───────────────┐
                  [kit pass: KIT_ROOT]            [state pass: STATE_ROOT]
                   roles/workflows/                board.md, traceability.md,
                   checklists/handoffs/            nfr-catalog, metrics,
                   config default, VERSION,        .grugops/factory.config.json,
                   packaging, AGENTS.md            tickets ↔ board
                          └──────────────┬───────────────┘
                                         ▼
                            errors[] / warnings[]  → exit 0 | 1 ; --strict promotes warnings

  shared rule (re-implemented, asserted by a test): both resolve kit root by
  ${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory  ⇒ "doctor passes" and "validator passes" cannot disagree (SC4)
```

### Component Responsibilities

| File | Change | Anchor |
|------|--------|--------|
| `install/install.sh` | Add a `--check` flag to the arg-parse loop (line 49-58); add a `doctor()` function reusing `resolve_grugops_home`, `abspath`, marker read, adapter `KIT=` parse; **branch to doctor-and-exit BEFORE the install run banner** (line 475) so `--check` never mutates. | arg loop 49-58; resolver 86-91; sentinels 329-331 |
| `install/install.mjs` | Byte-parity twin: `--check` in the arg loop (line 55-71); a `doctor()` mirroring the sh logic; same early-exit. | arg loop 55-71; resolver 86-92; sentinels 327-329 |
| `scripts/validate-agent-factory.mjs` | Replace single `ROOT` (line 32-35) with `KIT_ROOT` (from `VALIDATE_KIT_ROOT`, **no default → error**) + `STATE_ROOT` (from `VALIDATE_ROOT` || repo root). Split helpers `exists()/safeRead()/listDir()` (line 38-52) into kit-scoped + state-scoped variants. Route each existing check to the correct root. | ROOT 32-35; helpers 38-52; checks 184-373 |
| `install/install.test.sh` | Add SC5 doctor checks: good split → doctor passes; missing kit (delete `$GRUGOPS_HOME/agent-factory` or point at empty home) → doctor fails loudly; preserve existing idempotency/dry-run/reversibility checks. | `pass()/fail()` 24-25; `make_fixture` 38-44; Check 3 onward |
| `install/install.two-root.test.sh` | Keep as-is (GREEN 18/18). Optionally reference the doctor in a new check, but do not rewrite. | whole file |
| `scripts/validate.test.sh` + `scripts/fixtures/` | Add two-root fixtures: a GOOD split (kit root + separate state root, both pass), a BAD missing-kit (kit root → nonexistent dir, must FAIL), a BAD unset-kit (`VALIDATE_KIT_ROOT` unset, must error not default). | `run_fixture` 38-44; fixtures dir |

### Pattern 1: Doctor as a non-mutating early-exit arm of the installer
**What:** `--check` is handled in the same script but short-circuits before any write. The installer's existing structure already proves this is safe — `DRY_RUN` threads through `do_run`, but the doctor is simpler: it only reads and stats, then exits.
**When to use:** Any "verify what I installed" subcommand that must never mutate.
**Example (sh shape, grounded in the existing arg loop + resolver):**
```sh
# Source: install.sh arg-parse loop (49-58) + resolve_grugops_home (86-91)
CHECK=0
while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK=1; shift ;;
    --strict) STRICT=1; shift ;;
    # … existing --target/--yes/--allow-self/--symlink …
  esac
done
resolve_grugops_home   # sets GRUGOPS_HOME, KIT_ROOT — the SAME rule install uses
# TARGET resolves as today (default CWD); the doctor reads the marker/adapters under it.
if [ "$CHECK" = "1" ]; then
  doctor    # reads marker + adapters, cross-checks 3 sources, stats refs, warns; exits 0/nonzero
  exit $?   # NEVER reaches copy_kit / materialize / seed
fi
```

### Pattern 2: Three-source kit-root cross-check (D-03) — the stale-install detector
**What:** Compare (a) re-resolved rule, (b) marker `kitRoot`, (c) adapter `KIT=`. This is the moved-clone / stale-install footgun the doctor exists to catch.
**Severity rule (Discretion resolution):** normalize all three via `abspath` then compare:
- All three equal → pass.
- They differ but **all resolve to a real kit** (a real `agent-factory/roles/orchestrator.md` exists at each) **and** differ only cosmetically (trailing slash, `.`-segments) → WARN.
- They differ AND at least one does not resolve to a real kit, OR they point at genuinely different real kits → **FAIL** (name all three).
**Example:**
```sh
# (a) re-resolved
a="$KIT_ROOT"
# (b) marker — read .grugops/install.json kitRoot (sh: grep+sed or a small awk; Node: JSON.parse)
b=$(read_marker_field "$TARGET/.grugops/install.json" kitRoot)
# (c) adapter — read KIT="…" between MAT_OPEN/MAT_CLOSE
c=$(read_adapter_kit "$TARGET/.claude/agents/grugops-orchestrator.md")
na=$(abspath "$a"); nb=$(abspath "$b"); nc=$(abspath "$c")
if [ "$na" = "$nb" ] && [ "$nb" = "$nc" ]; then
  : # agree
elif kit_real "$na" && kit_real "$nb" && kit_real "$nc"; then
  warn "kit-root sources differ cosmetically: rule=$na marker=$nb adapter=$nc"
else
  fail "kit-root sources DISAGREE (stale/moved install): rule=$na marker=$nb adapter=$nc"
fi
```

### Pattern 3: Deterministic first-failure ordering (D-02 / SC1)
**What:** "FIRST unresolved path" must be stable run-to-run. Use a **fixed, ordered list** of (ref, referencing-file, root-kind) tuples; iterate in that order; on the first that fails to stat, print and stop.
**Ordering (recommended, most-load-bearing first):**
1. `KIT_ROOT` itself (the dir) — referenced by the marker/adapter.
2. `$KIT_ROOT/agent-factory/roles/orchestrator.md` (D-05 hard) — referenced by the adapter body.
3. `$KIT_ROOT/agent-factory/roles/_role-switch-protocol.md` — referenced by the adapter body.
4. `$KIT_ROOT/agent-factory/workflows/` (dir) — referenced by the adapter body.
5. State: `.grugops/factory.config.json` — referenced by the adapter body.
6. State: `plans/board.md` — referenced by the adapter body.
7. State: `plans/handoffs/` (dir) — runtime instance write target.
8. Any symlink in the resolved set that is dangling (D-05) — FAIL.

This is bounded (≈7-8 stats), deterministic, and maps each finding back to one of the three dogfood pains (kit never arrives → #1-4; wrong target → #5-7; symlink fragility → #8).

### Anti-Patterns to Avoid
- **Silent `.`-fallback for the kit root** (validate-agent-factory.mjs:32-35 today). The exact C3 false-green trap — kills the whole proof. The split's kit root MUST have NO default.
- **Curated hand-list of every kit file in the doctor.** D-01 forbids it; parse what the installer wrote instead. (The validator already owns full-tree structure validation — the doctor's job is resolution, not exhaustiveness.)
- **Re-gripping the kit's `agent-factory/…` refs in the doctor.** Overlaps `check-kit-refs.sh` (D-09) and the validator; keep the doctor bounded to the adapter/marker/start-up set.
- **Mutating anything under `--check`.** Doctor is read-only by construction; never write the marker, never touch the deploy-approval env var (carried from INSTALL-02 / SAFE-02).
- **Following symlinks out of the kit/repo and validating attacker content** (PITFALLS.md Security row). Resolve and assert each path stays under its declared root; a dangling/escaping symlink is a FAIL, not a follow.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Kit-root resolution in the doctor | A new resolution function | `resolve_grugops_home()` / `os.homedir()` verbatim | D-04: doctor and validator MUST resolve identically; reusing the existing rule guarantees source (a) of the cross-check matches install. |
| Marker schema | A new marker format | The existing 4-field `.grugops/install.json` (`kitVersion`,`grugopsHome`,`kitRoot`,`installMode`) | Phase 8 froze it byte-stable; the doctor is its first reader. Don't invent fields. |
| Adapter `KIT=` extraction | A bespoke parser | The same `MAT_OPEN`/`MAT_CLOSE`/`MAT_SLOT` sentinels + awk the installer uses | The sentinels are byte-identical in sh + Node already; reuse them so parse-parity is free. |
| Test harness | A new framework | `pass()/fail()/FAILS` + `snapshot()` + `mktemp -d` trap | Every install/* and scripts/* test uses it; the new checks slot in. |
| Validator findings + strict | A new severity system | The existing `errors[]`/`warnings[]` + `--strict` promotion | VAL-01 already proved it with GOOD/BAD fixtures; the two-root split keeps it. |
| Two-tier exit codes | A custom scheme | 0 pass / nonzero FAIL / WARN→0 / `--strict`→nonzero | Locked by INSTALL-05 + mirrors the validator's existing convention. |

**Key insight:** This phase's correctness comes from **reusing the installer's exact resolution + marker + sentinel mechanisms**, not from re-deriving them. Any divergence between how install *wrote* and how the doctor *reads* re-opens the C1 dangling-reference class of bug at the verification layer.

## Runtime State Inventory

> This is a verification phase, not a rename/migration. There is no data to migrate. Documented explicitly per protocol.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None.** The doctor reads `.grugops/install.json` (a marker the installer already writes) but writes nothing. No datastore keys change. | none |
| Live service config | **None.** No external service. The doctor runs against a local target repo's adapters/marker only. | none |
| OS-registered state | **None.** No scheduler/daemon/launchd registration. `--check` is a synchronous CLI arm. | none |
| Secrets/env vars | **`GRUGOPS_HOME` is READ (never set).** `GRUGOPS_SRC`/`TARGET` test overrides are read by the test harness only. The deploy-approval env var is NEVER read or written (carried prohibition from INSTALL-02/SAFE-02). New: the validator reads a new `VALIDATE_KIT_ROOT` env (no default). | none — code reads only |
| Build artifacts | **None.** No compiled artifact, no `package.json`, no egg-info. The validator stays stdlib-only with no `package.json` created (VAL-01 constraint). | none |

**Nothing found in any mutating category** — verified by reading install.sh/install.mjs (write paths) and confirming the doctor's parse-and-resolve is read-only by construction.

## Common Pitfalls

### Pitfall 1: The false-green (C3) — validator defaults the kit root to the dev checkout
**What goes wrong:** `validate-agent-factory.mjs:32-35` does `ROOT = process.env.VALIDATE_ROOT ? resolve(...) : resolve(SCRIPT_DIR, "..")`. Run inside grugops, it finds a full `agent-factory/` and prints green — masking a broken target install and the unset-`$GRUGOPS_HOME` failure.
**Why it happens:** The author runs the validator in the dev repo where kit and state collapse into one tree (the `good` fixture is literally one tree with both `agent-factory/` and `plans/`, `[VERIFIED: ls scripts/fixtures/good]`). The split is invisible until run against a real separate `$GRUGOPS_HOME`.
**How to avoid:** Kit root has **NO default**. Unset `VALIDATE_KIT_ROOT` → hard error, never `.`. A BAD fixture (kit root → nonexistent dir) and an unset-kit fixture MUST both fail. Doctor and validator resolve home identically (assert in a shared test).
**Warning signs:** Validator green in the checkout but no one ran it against a separate-`$GRUGOPS_HOME` target; the self-test has no unset/missing-kit fixture.

### Pitfall 2: Doctor / validator resolution drift (breaks SC4)
**What goes wrong:** The doctor's sh side and the validator's Node side compute the kit root differently (e.g. one trims a trailing slash, one normalizes `~` differently), so "doctor passes" and "validator passes" disagree on a real machine.
**Why it happens:** The rule is re-implemented in three places (sh doctor, Node doctor, Node validator) because it can't be shared across the sh boundary (D-04).
**How to avoid:** Re-use `resolve_grugops_home` / `os.homedir()+toPosix` verbatim in the doctor; in the validator re-implement the **same** `${GRUGOPS_HOME:-$HOME/.grugops}` + `/agent-factory` + POSIX-slash normalization. A shared test (new check in `install.test.sh` or `validate.test.sh`) asserts the sh doctor, Node doctor, and Node validator all report the **same** resolved kit root for the same env. (Mirrors the existing sh/Node parity Check 4/4b and the two-root Check 12.)
**Warning signs:** A green validator coexists with a doctor FAIL (or vice versa) on the same target.

### Pitfall 3: First-failure non-determinism (breaks SC1)
**What goes wrong:** The doctor iterates a set whose order depends on `readdir`/glob ordering, so "the FIRST unresolved path" differs run-to-run.
**Why it happens:** Walking a directory or a hash/map instead of a fixed list.
**How to avoid:** Use the fixed ordered tuple list (Pattern 3). For any directory walk (e.g. seed completeness), sort `LC_ALL=C` (the installer already does this: install.sh:410 `LC_ALL=C sort`, install.mjs:408 `.sort()`).
**Warning signs:** The SC1 test asserting a specific first-failure path flakes.

### Pitfall 4: Dangling symlink slips past `[ -e ]`
**What goes wrong:** `[ -e "$p" ]` is FALSE for a dangling symlink (the target doesn't exist), so a naive "exists?" check reports "missing path" rather than the more precise "dangling symlink" — and worse, `cmp`/`readFileSync` on it throws.
**Why it happens:** `[ -e ]` follows the link; `[ -L ]` tests the link itself.
**How to avoid:** Test `[ -L "$p" ] && [ ! -e "$p" ]` → dangling → FAIL with a symlink-specific message (D-05 names "no dangling symlinks" explicitly). In Node, `lstatSync` (link itself, install.mjs:175-181 already uses it) + `existsSync` (follows).
**Warning signs:** An `INSTALL_MODE=symlink` opt-in install whose source moved isn't caught (PITFALLS.md C5).

### Pitfall 5: Doctor crashes on the uninstalled / dev checkout instead of reporting
**What goes wrong:** Run `--check` in the grugops source checkout (no `.grugops/install.json`, no materialized adapters) → marker read throws / adapter parse throws → stack trace instead of a clean "not installed."
**Why it happens:** Assuming the marker/adapters always exist.
**How to avoid:** Guard the marker read: absent marker → print `"not installed — run install.sh (or install.sh --check after installing)"`, exit nonzero, do not proceed to parse adapters. Fold into the FAIL path (a distinct message, same nonzero exit). The dev checkout MUST NOT false-green (ties to C3). Wrap reads in try/catch (Node) / test-before-read (sh) exactly like the validator's `safeRead` (validate-agent-factory.mjs:39-45) and install's fail-closed posture.
**Warning signs:** `--check` in the repo root prints a Node stack trace or a sh `set -e` abort.

## Code Examples

### Reading the 4-field marker (the doctor is its first reader)
```sh
# Source: marker schema from install.sh write_marker (431-447). sh has no JSON parser;
# the marker is byte-stable 2-space-indented, so a line-scoped grep+sed is safe and parity-free.
read_marker_field() {  # $1=marker-file  $2=field
  [ -f "$1" ] || return 1
  grep -m1 "\"$2\"" "$1" | sed 's/.*: *"\(.*\)".*/\1/'
}
kitRoot=$(read_marker_field "$TARGET/.grugops/install.json" kitRoot) || { not_installed; exit 1; }
```
```js
// Source: install.mjs writeMarker (437-457). Node parses JSON natively; wrap in try/catch
// (mirror validate-agent-factory.mjs safeRead 39-45 fail-closed posture).
let marker;
try { marker = JSON.parse(readFileSync(join(TARGET, ".grugops", "install.json"), "utf8")); }
catch { notInstalled(); process.exit(1); }
const { kitRoot, kitVersion } = marker;
```

### Extracting `KIT="…"` from the adapter sentinel block
```sh
# Source: MAT_OPEN/MAT_CLOSE sentinels (install.sh 329-330). Read the KIT= line inside the block.
read_adapter_kit() {  # $1=adapter-file
  [ -f "$1" ] || return 1
  awk -v op='# <!-- grugops:materialized-kit -->' -v cl='# <!-- /grugops:materialized-kit -->' '
    $0 == op { inblk=1; next } $0 == cl { inblk=0; next }
    inblk && $0 ~ /^KIT=/ { line=$0 }
    END { if (line != "") { sub(/^KIT="/, "", line); sub(/"$/, "", line); print line } }
  ' "$1"
}
```

### Dangling-symlink FAIL (D-05)
```sh
# Source: install.sh [ -L ] usage (197). Dangling = link present but target gone.
if [ -L "$p" ] && [ ! -e "$p" ]; then
  fail "dangling symlink: $p  (referenced by $ref)"
fi
```

### Validator two-root split (replace ROOT)
```js
// Source: validate-agent-factory.mjs ROOT (32-35) + helpers (38-52). NO DEFAULT for the kit root.
const STATE_ROOT = process.env.VALIDATE_ROOT
  ? resolve(process.env.VALIDATE_ROOT)
  : resolve(SCRIPT_DIR, "..");                       // back-compat repo root for STATE only
if (!process.env.VALIDATE_KIT_ROOT) {
  console.error("  ERROR    VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)");
  process.exit(1);                                   // the no-false-green guard
}
const KIT_ROOT = resolve(process.env.VALIDATE_KIT_ROOT);
// kit-scoped helpers join(KIT_ROOT, rel); state-scoped helpers join(STATE_ROOT, rel).
const kitExists  = (rel) => existsSync(join(KIT_ROOT, rel));
const stateExists = (rel) => existsSync(join(STATE_ROOT, rel));
```

## State of the Art

| Old Approach (v1.0 / pre-Phase-9) | Current Approach (this phase) | When Changed | Impact |
|-----------------------------------|-------------------------------|--------------|--------|
| Single in-repo tree; validator defaults `ROOT` to cwd | Two explicit roots; kit root has no default | Phase 9 | Kills the C3 false-green |
| Marker written, never read | Doctor reads marker back, cross-checks vs rule + adapter | Phase 9 | Catches stale/moved installs (D-03) |
| No install verification | `--check` doctor stats every load-bearing ref | Phase 9 | "The guard that would have caught all three dogfood pains" |
| `install.test.sh` single-root (Phase 8 froze it) | Split-aware: good-split passes / missing-kit fails | Phase 9 (D-10) | SC5 |

**Deprecated/outdated:** none to remove — this is purely additive over Phase 8.

## Discretion Resolutions

These are the Claude's-Discretion items CONTEXT.md delegated, resolved against the real code.

### 1. Cross-check mismatch severity (D-03) → FAIL on true divergence, WARN on cosmetic-equivalent
**Decision:** Normalize all three sources with `abspath`. If they differ but every source resolves to a real kit (`agent-factory/roles/orchestrator.md` exists at each) and the difference is cosmetic (trailing slash, `.`/`..` segments collapsing to the same path), WARN. Otherwise (any source unresolvable, or two genuinely different real kits) FAIL.
**Rationale:** A true divergence is exactly the moved-clone / stale-install footgun the doctor exists to catch (CONTEXT § specifics: "the user prioritized catching disagreement"). A cosmetic difference is benign and shouldn't break CI. This reconciles with D-06's non-empty WARN tier: cosmetic mismatch becomes a third live WARN alongside skew + missing-seed, giving `--strict` more to gate. **Bias to FAIL when unsure** — a false FAIL costs a re-install; a false pass reincarnates the dogfood pain.

### 2. Parse-and-resolve breadth (D-01) → bounded: adapters + marker + start-up reads + adapter-named kit refs
**Decision:** The doctor stats exactly the set in Pattern 3 (#1-8): KIT_ROOT, the orchestrator + role-switch-protocol role files, the workflows dir, the config + board + handoffs state paths, and any dangling symlink among them. It does NOT recursively grep+stat every `agent-factory/…` ref in the kit's role/workflow bodies.
**Rationale:** SC1 says "every referenced path," but the *referencing artifacts the installer wrote* are the adapters + marker — those are what dangle in the dogfood. Re-walking the whole kit overlaps `check-kit-refs.sh` (D-09, kept separate) and the validator's full-tree structure check, and would be heavier and less deterministic. The adapter body literally names `agent-factory/roles/orchestrator.md`, `_role-switch-protocol.md`, `agent-factory/workflows/`, `.grugops/factory.config.json`, `plans/board.md`, `plans/handoffs/` `[VERIFIED: .claude/agents/grugops-orchestrator.md + SKILL.md]` — stat exactly those. Bounded (~8 stats), deterministic, maps each to a dogfood pain.

### 3. C3 BAD-fixture mechanism (D-08) → nonexistent-kit-dir (primary) + unset-kit (must-error)
**Decision:** Two BAD fixtures. (a) `VALIDATE_KIT_ROOT=/path/to/nonexistent` → the kit pass finds no `roles/orchestrator.md` → FAIL. (b) `VALIDATE_KIT_ROOT` **unset** → the no-default guard errors immediately (the C3 footgun proof). Both nonzero.
**Rationale:** (a) is fully hermetic (a committed empty/absent dir, no env coupling) and deterministic; (b) directly proves the "no silent `.`-fallback" requirement that is the heart of VAL-02. Unsetting the env var alone (without (a)) would only prove the guard; pointing at a real-but-broken dir proves the structural validation also fails. Use both. For the doctor's equivalent in `install.test.sh`: install a good split, then `rm -rf "$GRUGOPS_HOME/agent-factory"` (or point the doctor at a fresh empty home) → doctor FAILS loudly naming the missing kit (SC5).

### 4. Validator env-var / input naming (D-08) → reuse `VALIDATE_ROOT` as STATE_ROOT + new `VALIDATE_KIT_ROOT`
**Decision:** `STATE_ROOT` ← `VALIDATE_ROOT` (existing) or repo root (back-compat). `KIT_ROOT` ← new `VALIDATE_KIT_ROOT` with **no default**.
**Rationale:** Reusing `VALIDATE_ROOT` keeps the 8 committed single-tree fixtures (`scripts/fixtures/*`) valid as STATE-root fixtures and the existing `validate.test.sh` invocations working with minimal change — the new kit-root fixtures layer on top. Introducing the kit root as a *new* name (rather than overloading `VALIDATE_ROOT`) makes the "no default" guard explicit and unmissable. Stays stdlib-only, read-only, no `package.json` (VAL-01 constraints preserved). Document the env contract in the validator header comment (mirroring lines 13-14).

### 5. Uninstalled / dev-checkout `--check` → fold into FAIL with a distinct "not installed" message
**Decision:** Absent `.grugops/install.json` (and/or absent materialized adapters) → print `"grugops not installed in <target> — run install.sh (then install.sh --check)"`, exit nonzero, do not crash. Same nonzero exit as a FAIL; a distinct, recognizable message (so a test can grep it).
**Rationale:** A separate exit code adds surface with no caller benefit; the contract is binary (0 = healthy, nonzero = not). The distinct message keeps it diagnosable and lets the SC5/dev-checkout test assert it. Critically, it ties to C3: the dev checkout (which has `agent-factory/` but no marker) must NOT false-green — folding into FAIL guarantees that. Wrap all reads fail-closed (Pitfall 5).

### 6. Doctor output format → human-readable, one finding per line, FAIL line names path + referencing file
**Decision:** `report`-style lines (reuse install.sh:146 `report()` / install.mjs:169). FAIL: `FAIL  <resolved-path>  (referenced by <file>)`. WARN: `WARN  <message>`. Final line: `ALL CHECKS PASSED` / `N FAILURE(S)` mirroring the harnesses. Keep it greppable for the tests.

## Open Questions

1. **Should the doctor also run inside the orchestrator's first-run path?**
   - What we know: CONTEXT integration point notes "if the doctor passes, `/grugops` works on first run." The adapters' self-heal block already tells the agent to STOP if the kit is absent.
   - What's unclear: whether the plan should wire a doctor invocation into the adapter prose, or leave `--check` as an operator-run command only.
   - Recommendation: Leave it operator-run this phase (the adapter STOP logic already covers the agent path). Wiring `--check` into agent prose risks re-introducing `$GRUGOPS_HOME`-in-prose (the C1/anti-pattern). Out of scope unless the planner finds a clean hook.

2. **Marker `kitVersion` vs `$KIT_ROOT/VERSION` when the kit was hand-edited (C4 drift):**
   - What we know: D-06 WARNs on `marker.kitVersion ≠ installed VERSION`. The kit VERSION is `0.1.0` and the marker copies it at install time.
   - What's unclear: whether a future `--update` (deferred) makes this skew common; for now skew only appears if someone manually swaps the kit.
   - Recommendation: Implement the WARN exactly as D-06 specifies (detect + warn, no negotiation — D-07). Don't over-engineer compatibility windows (that's SKEW-01, v1.2).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| POSIX `sh` | `install.sh --check` doctor | ✓ | `/bin/sh` | — |
| Node | `install.mjs --check`, validator | ✓ | v24.12.0 | sh doctor + (validator is Node-only; tests skip-with-note when node absent, mirroring install.test.sh Check 4) |
| `awk` | adapter `KIT=` parse | ✓ | system (BSD/macOS awk — use the `op`/`cl` neutral-name workaround already in install.sh:362) | — |
| `realpath`/`readlink` | OPTIONAL symlink resolution | ✓ | `/bin/realpath`, `/usr/bin/readlink` | `abspath()` + `[ -e ]`/`[ -L ]` (preferred — no hard dep) |
| `mktemp -d` | test harness temp area | ✓ | system | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Node is required for the validator and the Node doctor; the sh doctor and the test parity checks degrade gracefully (skip-with-note) when node is absent, exactly as the existing harnesses do.

## Validation Architecture

> Nyquist validation is ENABLED. This section defines the sampling dimensions for verifying exit-code correctness, first-failure determinism, the three-source cross-check, sh↔Node parity, the C3 BAD-fixture must-fail, and the install.test.sh good-split/missing-kit behavior.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | POSIX `sh` harness (`pass()/fail()/FAILS`, `mktemp -d` + `trap` cleanup, content-addressed `snapshot()`) for installer/doctor; the same harness drives the Node validator via `VALIDATE_KIT_ROOT`/`VALIDATE_ROOT` env (no test runner, no `package.json`). |
| Config file | none — bare `sh script.test.sh` and bare `node validate-agent-factory.mjs` (VAL-01 constraint) |
| Quick run command | `sh install/install.test.sh` · `sh scripts/validate.test.sh` |
| Full suite command | `sh install/install.test.sh && sh install/install.two-root.test.sh && sh scripts/validate.test.sh && sh scripts/check-kit-refs.sh` |

### Phase Requirements → Test Map
| Req / SC | Behavior | Test Type | Automated Command | File Exists? |
|----------|----------|-----------|-------------------|-------------|
| SC1 / INSTALL-05 | Doctor names the FIRST unresolved path + referencing file (deterministic) | sh integration | `sh install/install.test.sh` (new doctor checks) | ❌ Wave 0 (new checks in existing file) |
| SC1 (D-05) | Dangling symlink → FAIL | sh integration | `sh install/install.test.sh` | ❌ Wave 0 |
| SC2 / INSTALL-05 | Exit-code matrix: pass=0, FAIL≠0, WARN→0, `--check --strict`→≠0 | sh integration | `sh install/install.test.sh` (assert `rc` per case) | ❌ Wave 0 |
| SC3 / VAL-02 | Validator splits KIT_ROOT/STATE_ROOT; no `.`-fallback | node via sh | `sh scripts/validate.test.sh` (new fixtures) | ⚠️ extend validate.test.sh + add fixtures |
| SC4 (C3) | BAD missing-kit fixture FAILS; unset-kit errors (no default) | node via sh | `sh scripts/validate.test.sh` (`expect_fail`) | ❌ Wave 0 fixtures |
| SC4 (D-03/D-04) | Doctor's 3 sources cross-checked; doctor + validator resolve kit root identically | sh + node parity | new parity check in `install.test.sh` or `validate.test.sh` | ❌ Wave 0 |
| SC5 | Good split → doctor passes; missing kit → doctor fails loudly; idempotency/dry-run/reversibility preserved | sh integration | `sh install/install.test.sh` | ❌ Wave 0 (extend) |
| (regression) | Deep two-root behaviors still GREEN | sh integration | `sh install/install.two-root.test.sh` | ✅ (keep as-is) |
| (regression) | Phase-7 grep-to-zero gate still GREEN, stays separate (D-09) | sh grep | `sh scripts/check-kit-refs.sh` | ✅ (do not couple) |

### Sampling Rate
- **Per task commit:** the directly-affected quick run — `sh install/install.test.sh` for doctor work; `sh scripts/validate.test.sh` for validator work.
- **Per wave merge:** the full suite (all four scripts above) green.
- **Phase gate:** full suite green + the three-way resolution-parity assertion green before `/gsd-verify-work`.

### Validation Dimensions (the matrix this phase must cover)
| Dimension | Cases to sample |
|-----------|-----------------|
| Exit code | (1) healthy install → 0; (2) FAIL → nonzero; (3) WARN-only → 0; (4) WARN + `--strict` → nonzero |
| First-failure determinism (SC1) | Same broken target, two runs → identical first-failure line; ordered tuple list (Pattern 3) |
| Three-source cross-check (D-03) | (a) all agree → pass; (b) cosmetic diff → WARN; (c) true divergence / unresolvable → FAIL |
| sh↔Node doctor parity | Same target + env → `install.sh --check` and `install.mjs --check` agree on pass/fail + the named first-failure path (skip-with-note if node absent) |
| C3 must-fail (SC4) | (a) `VALIDATE_KIT_ROOT`→nonexistent → FAIL; (b) `VALIDATE_KIT_ROOT` unset → error (no `.`-default); (c) doctor on dev-checkout (no marker) → "not installed" nonzero |
| install.test.sh split (SC5) | good split → doctor passes; `rm -rf $GRUGOPS_HOME/agent-factory` → doctor fails loudly naming the missing kit; double-`--check` is read-only (snapshot unchanged) |
| Resolution agreement (SC4/D-04) | sh doctor, Node doctor, Node validator all report the same resolved kit root for the same `GRUGOPS_HOME` |

### Wave 0 Gaps
- [ ] New doctor checks in `install/install.test.sh` — cover SC1/SC2/SC5 + dangling-symlink + exit-code matrix.
- [ ] New fixtures under `scripts/fixtures/` — a GOOD split (separate kit + state roots), a BAD missing-kit (`VALIDATE_KIT_ROOT`→absent dir), a BAD unset-kit; wire `expect_fail`/`expect_pass` in `scripts/validate.test.sh`.
- [ ] A resolution-parity check asserting sh doctor + Node doctor + Node validator agree on the kit root (new check; mirror install.two-root.test.sh Check 12 shape).
- [ ] No framework install needed (sh + node already present; no `package.json`).

*(The deep two-root harness and the Phase-7 grep gate already exist and stay GREEN — no Wave 0 work there beyond not breaking them.)*

## Security Domain

> `security_enforcement` not explicitly disabled → included. This phase is a read-only verifier; the security surface is small but real.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V1 Architecture | yes | Read-only-by-construction doctor; never mutates under `--check` (mirrors validator's read-only invariant, validate-agent-factory.mjs:21-24). |
| V5 Input Validation / Path | yes | Resolve every path to absolute via `abspath`/`resolve` before stat (Security V5 — "validate to absolute before use", install.sh:74). Assert each path stays under its declared root; do NOT follow symlinks that escape the kit/repo (PITFALLS.md Security row). |
| V6 Cryptography | no | No crypto in this phase. |
| V10 Malicious Code / Files | yes | A dangling/escaping symlink is a FAIL, never a follow-and-read — closes the "validate attacker content outside the root" vector. The agent's STOP-don't-hunt rule (already in the adapters) is the upstream control. |
| V12 Files & Resources | yes | Doctor stats only; never writes; never reads outside the resolved kit/state roots. |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Doctor follows a symlink out of the kit/repo and validates attacker-planted content | Tampering / Elevation | Resolve + assert each path stays under its declared root; dangling/escaping symlink → FAIL (D-05), never follow (PITFALLS.md). |
| `--check` accidentally mutates (e.g. re-materializes) | Tampering | Doctor is a non-mutating early-exit arm (Pattern 1); never call copy_kit/materialize/seed/write_marker under `--check`. |
| Doctor or validator reads/writes the prod-deploy approval env var | Elevation (crosses the hard safety line) | Carry the explicit prohibition forward verbatim (install.sh:14,532): NEVER read/write/seed the deploy-approval env var. The doctor reads `GRUGOPS_HOME` only. |
| World-writable `$GRUGOPS_HOME` kit injects instructions every agent run | Tampering | Out of this phase's mutation scope, but the doctor MAY surface it as a finding if cheap; per-user `~/.grugops` default already avoids the shared-write surface (PITFALLS.md). Do not over-build. |
| Untrusted marker/adapter content crashes the doctor (DoS) | DoS | Fail-closed parsing (try/catch Node, test-before-read sh) — a garbled marker becomes a "not installed / corrupt marker" finding, never an unhandled throw (mirror safeRead, validate-agent-factory.mjs:39-45). |

## Project Constraints (from CLAUDE.md)

The planner MUST honor these (same authority as locked decisions):
- **Tech stack:** Markdown for everything except installers (`install.sh` POSIX + `install.mjs` Node) and the Node validator. **No new dependencies; no `package.json`** for the validator (VAL-01).
- **Safety (hard):** Agents never merge a protected branch / deploy to prod without named human confirmation. The doctor NEVER sets the deploy-approval env var.
- **Single-source:** Role text lives once; the doctor/validator must not duplicate `check-kit-refs.sh` classification logic — agree without copying (D-09).
- **Zero-config:** The doctor/validator honor `$GRUGOPS_HOME` when set, default `~/.grugops` when absent — but the **validator's kit root has NO default** (the deliberate C3 guard; this is the one place "no fallback" overrides "sensible default", and it is intentional).
- **Installers idempotent/additive/dry-run/reversible; never overwrite or delete user content:** `--check` is read-only — trivially satisfies this; the test additions must not mutate the repo (use `mktemp -d` fixtures, as every existing harness does).
- **No fabrication:** A green that doesn't reflect a working install is a fabricated pass — the entire point of the C3 guard. Unknown/unverifiable → report, never fake. Mark genuinely unknown host commands `UNKNOWN - verify`.
- **Voice discipline:** Caveman voice in role prompts (not relevant here — these are scripts); **clear voice** in any safety/disclaimer output the doctor prints.
- **Brand:** lowercase `grugops` in all output.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `good` fixture is a single combined tree (kit + state collapsed) and will need a companion split fixture for two-root testing. | Validator Split / Validation | LOW — `[VERIFIED: ls scripts/fixtures/good]` shows both `agent-factory/` and `plans/`; the only assumption is the planner adds a split fixture rather than overloading the combined one. |
| A2 | No non-test code reads `.grugops/install.json` today, so the doctor is its first reader and can define the read shape freely. | Architecture Map | LOW — `[VERIFIED: grep install.json across install/ scripts/]` shows only writes (install) + removal (uninstall) + docs; no read-back. |
| A3 | The adapter body's referenced paths (orchestrator.md, _role-switch-protocol.md, workflows/, factory.config.json, board.md, handoffs/) are the right bounded stat set. | Discretion #2 | LOW — `[VERIFIED: .claude/agents/grugops-orchestrator.md + SKILL.md]` literally name these; if the adapter prose changes, the set must track it (the doctor should parse, not hard-code, where feasible). |
| A4 | BSD/macOS awk reserved-word workaround (`op`/`cl` names) is needed for the doctor's `KIT=` parse. | Code Examples | LOW — `[VERIFIED: install.sh:362 comment]` already documents this exact workaround; reuse it. |
| A5 | `realpath`/`readlink` exist but are NOT required (abspath + `[ -e ]`/`[ -L ]` suffice). | Stack / Environment | LOW — `[VERIFIED: command -v realpath/readlink]`; avoiding a hard dep is the conservative choice. |

**All other claims are tagged inline `[VERIFIED: …]` against the in-repo source.** No `[ASSUMED]` package or compliance claims — there are no packages and no external compliance requirements in scope.

## Sources

### Primary (HIGH confidence — in-repo source, read this session)
- `install/install.sh` — `resolve_grugops_home` (86-91), `abspath` (75-80), arg loop (49-58), marker `write_marker` (431-447), `MAT_OPEN/MAT_CLOSE/MAT_SLOT` (329-331) + materialize awk (339-389), `[ -L ]` (197), `LC_ALL=C sort` (410)
- `install/install.mjs` — `os.homedir()`+`toPosix` (86-92), arg loop (55-71), `writeMarker` (437-457), sentinels (327-329), `isSymlink` (175-181), `safeRead`-style try/catch posture
- `scripts/validate-agent-factory.mjs` — single `ROOT` (32-35), `exists()/safeRead()/listDir()` (38-52), `errors[]`/`warnings[]`+`--strict` (54-59, 390-396), all checks (184-373)
- `install/install.test.sh` — `pass()/fail()/FAILS` (24-25), `make_fixture` (38-44), `snapshot` (48-53), parity Check 4/4b
- `install/install.two-root.test.sh` — the GREEN 18/18 deep harness (run_install, two-root snapshot, Check 12 sh/Node parity)
- `scripts/validate.test.sh` + `scripts/fixtures/{good,bad-*,warn-*}` — the GOOD/BAD fixture self-test pattern + `run_fixture/expect_pass/expect_fail`
- `scripts/check-kit-refs.sh` — the Phase-7 grep-to-zero gate kept separate (D-09); kit-vs-state classification + template allowlist
- `install/uninstall.sh` — `is_protected()` (96-107), marker handling, `.grugops/` protection
- `.claude/agents/grugops-orchestrator.md` + `.claude/skills/grugops/SKILL.md` — the materialized adapters' self-heal block + the kit/state refs the doctor stats
- `agent-factory/VERSION` (`0.1.0`); `agent-factory/seed/**` (the seed tree for the missing-seed WARN)
- CONTEXT.md (09), REQUIREMENTS.md (INSTALL-05/VAL-02), ROADMAP.md (Phase 9 SC1-5), `docs/design/shared-install.md` (Installer changes / Validator-test impact)
- `.planning/research/PITFALLS.md` (C3 false-green, C5 symlink, security rows) + `SUMMARY.md` (build order, doctor exit-code convention, two-root validator design)
- `CLAUDE.md` (tech-stack + safety + no-fabrication + single-source constraints)

### Verification commands run
- `node --version` → v24.12.0; `command -v sh/realpath/readlink` → present
- `grep -rn 'install\.json'` across install/ scripts/ → only writes/removal/docs, no read-back (A2)
- `find agent-factory/seed -type f` → confirmed seed tree for the missing-seed WARN
- `ls scripts/fixtures/good` → single combined tree (A1)
- `grep -rn '\-\-check'` → no existing doctor stub

### Secondary (MEDIUM — convention, from SUMMARY.md/PITFALLS.md research)
- `brew doctor` / `mise doctor` / `flutter doctor` exit-code + first-failure convention (the `--check` model)
- XDG `${VAR:-$HOME/.default}` fallback convention (the resolution rule shape)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; every mechanism is existing in-repo source read this session.
- Architecture: HIGH — doctor + validator both extend frozen Phase-7/8 code with named anchors; the three-source cross-check and two-root split are fully specified.
- Pitfalls: HIGH — C3 is the gating risk, grounded in the live `ROOT`-default bug at validate-agent-factory.mjs:32-35; mitigations are concrete.
- Discretion resolutions: HIGH — each tied to a verified code anchor and a dogfood-pain rationale.

**Research date:** 2026-06-08
**Valid until:** stable — no external/fast-moving dependencies. Re-verify only if Phase 8 source (resolver/marker/sentinels) changes before planning.

## RESEARCH COMPLETE

**Phase:** 9 - Doctor & Two-Root Validator
**Confidence:** HIGH

### Key Findings
- The doctor needs **no new mechanisms** — it reuses `resolve_grugops_home`/`os.homedir()`, the 4-field marker (it is the marker's FIRST reader), and the `MAT_*` sentinels to parse the adapter `KIT=`. Bounded parse-and-resolve (~8 ordered stats), read-only early-exit arm.
- The single gating risk is **C3 false-green** at validate-agent-factory.mjs:32-35 (`ROOT` silently defaults to the dev checkout). Fix: explicit `KIT_ROOT` with **no default** (new `VALIDATE_KIT_ROOT`), `STATE_ROOT` reuses `VALIDATE_ROOT`; a nonexistent-kit fixture AND an unset-kit fixture both must fail.
- **D-04 / SC4** is satisfied by re-implementing the one rule (not sharing code across sh) + a shared test asserting sh doctor, Node doctor, and Node validator agree on the kit root.
- All six Claude's-Discretion items are resolved with code-grounded rationale (severity = FAIL-on-true-divergence; breadth = bounded adapter/marker/start-up set; C3 fixture = nonexistent-dir + unset; naming = `VALIDATE_KIT_ROOT` + reuse `VALIDATE_ROOT`; uninstalled = fold-into-FAIL with distinct message; output = greppable report lines).
- Zero external packages; `install.two-root.test.sh` (18/18) and `check-kit-refs.sh` (D-09) stay GREEN and separate; new SC5 doctor checks extend `install.test.sh`.

### File Created
`.planning/phases/09-doctor-two-root-validator/09-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | stdlib/POSIX only; all anchors verified in-repo |
| Architecture | HIGH | extends frozen Phase-7/8 code with named line anchors |
| Pitfalls | HIGH | C3 grounded in the live default-to-cwd bug; mitigations concrete |

### Open Questions
- Whether to wire `--check` into the agent first-run path (recommend NOT — risks re-introducing `$GRUGOPS_HOME`-in-prose; the adapter STOP rule already covers the agent).
- Skew WARN over-engineering — keep to detect+warn (D-06/D-07), no compatibility windows (that's SKEW-01, v1.2).

### Ready for Planning
Research complete. The planner can create PLAN.md files: a doctor plan (sh + Node byte-parity, the `--check` arm), a validator-split plan (two roots, no default), and a test plan (SC5 doctor checks in install.test.sh + two-root validator fixtures), with a shared resolution-parity assertion as the SC4 proof.
