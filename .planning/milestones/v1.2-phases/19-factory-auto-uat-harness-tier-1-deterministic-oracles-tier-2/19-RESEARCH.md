# Phase 19: Factory Auto-UAT Harness — Research

**Researched:** 2026-06-16
**Domain:** Deterministic test oracles (Tier 1) + headless Claude Code CLI E2E (Tier 2), under grugops's no-fabrication contract (CLAUDE.md Constraint #6)
**Confidence:** HIGH (Tier 1 clone targets confirmed in-repo; Tier 2 CLI mechanics verified against the locally installed `claude` v2.1.178 + official docs)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Honesty / no-fabrication (Constraint #6 — hard):**
- Oracles and the E2E harness MUST fail red and MUST NOT fabricate a pass. A UAT file's status may only flip to passed/resolved from a **real run's** output, never hand-set.
- Tier 2 when the CLI is **absent or unauthed** must emit a **loud SKIP** (visible, distinct exit/markers) — NEVER a silent green. A skip is not a pass.

**Dependency posture:**
- Tier-2 needs the `claude` CLI + auth — this stays **dev/CI-only**. It is NOT a host runtime dependency. The minimal markdown-copy install path (`install/README.md` §1) and the committed-`.js` host execution model are unaffected (CLAUDE.md "zero runtime deps").
- Build the harness to run **locally on-demand** against the developer's authed CLI, plus a CI lane that skips-loud when unauthed. Do NOT add a CI secret/API-key requirement to make the default build pass.

**Tech / patterns to clone (Phase 15 D-13 convention):**
- TypeScript authored → `tsc` to **committed `.js`** → **freshness-checked** (rebuild-to-temp, byte-diff, fail-red on drift). Vitest-covered. Dev deps are only `{typescript, vitest}` (+ `@types/node`) — add NOTHING else.
- Clone the existing structural template: `scripts/generate-catalog.ts` + `*.test.ts` + `scripts/catalog-freshness.ts` (Phase 18) and `scripts/generate-asvs-checklist.ts` (Phase 14).
- Wire both lanes into the foundation-guards aggregator (`scripts/check-foundation-guards.ts`) and reference from the §14 gate (`agent-factory/.../05-pr-quality-gate.md`, single-source — do NOT fork gate logic into other workflows).
- Extend, don't duplicate: `hooks/guard.test.ts` already proves the guard logic in isolation (26/26) — the A2 wiring oracle adds the `hooks.json`→guard contract, not a re-test of logic.

**Voice:**
- Findings/runbook prose about these checks use **clear (non-caveman) voice** — they touch safety (SAFE-02) and the trace. `docs/dogfood-human-runbook.md` documents the three lanes and states which is **authoritative** (Tier 1/2 real runs) vs **advisory/human** (Tier 3).

**Config dial:**
- Gate-execution of the new lanes is config-dialable consistent with existing `quality.*` keys (lean default on, enterprise escalation). The E2E lane defaults to skip-when-unauthed. Reuse existing keys/patterns; only add a new dial key if a lane genuinely needs one.

### Claude's Discretion
- The exact name of any new oracle aggregator script (the feasibility plan suggested `scripts/check-uat-oracles.ts`).
- Whether the three Tier-1 oracles live in one aggregator or fold directly into the existing `check-foundation-guards.ts` (a tradeoff documented below — see Architecture Patterns).
- Exact stdout marker wording for the loud-SKIP / pass / fail signals (must satisfy the honesty contract).
- The precise `test:e2e` npm script name and whether the Tier-2 lane gets its own dial key vs. reusing an existing `quality.*` key.

### Deferred Ideas (OUT OF SCOPE)
- **Tier 3 — B1/B2 persona/prose judgment** (Phase 11). "Is the prose senior enough" is self-grading and low-confidence; an LLM-judge here would *manufacture* a green. At most a future *advisory* pre-screen (NOT this phase). The human sign-off on `11-HUMAN-UAT.md` scenarios 1 & 2 remains human.
- A `scripts/uat-prescreen.ts` LLM-judge advisory lane (feasibility plan step 3) — explicitly v1.3+, not this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

> NOTE FOR PLANNER: UAT-AUTO-01..05 are referenced in ROADMAP/STATE but are **NOT yet defined** in `.planning/REQUIREMENTS.md` (the requirements table ends at DOCS-02; the coverage line reads "30 total"). The planner (or a discuss-phase) must add UAT-AUTO-01..05 to REQUIREMENTS.md and the traceability table mapping all five to Phase 19 before/as part of planning, or the decision-coverage gate will read them as unmapped. The mapping below is the researcher's proposed decomposition derived from the CONTEXT.md scope; confirm wording with the user. `[ASSUMED]`

| ID | Proposed Description | Research Support (what the planner must cover) |
|----|---------------------|------------------------------------------------|
| UAT-AUTO-01 | **Tier-1 B3 oracle** — a deterministic wording-consistency check asserts all four tracking docs state the WR-05 closure identically ("dropped P8 → guarded P10 → re-verified P11"); fails red on mismatch, never fabricates. | `grepFiles` idiom from `check-foundation-guards.ts`; the exact 4-file scan set + the verified claim strings (see Code Examples §B3). Resolves `11-HUMAN-UAT.md` scenario 3. |
| UAT-AUTO-02 | **Tier-1 A2 wiring oracle** — assert `hooks/hooks.json` matcher routes a `kubectl apply` PreToolUse stdin payload through the committed `guard.js` and yields a deny-JSON (exit-0 + `permissionDecision:deny`); the hooks.json→guard CONTRACT, not a re-test of guard logic. | `spawnSync(guard.js, …)` idiom from `guard.test.ts`; parse `hooks.json` for the matcher + command, build the payload, assert deny (see Code Examples §A2-wiring). |
| UAT-AUTO-03 | **Tier-1 A3 structural oracle** — assert dual-path artifact-structure parity: the same handoff **filenames** and the same gate **verdict string** (`READY_FOR_HUMAN_REVIEW`) appear for sequential and sub-agent dispatch. | Structural diff over `examples/03-ticket-to-pr.md` parity table + `docs/dogfood-human-runbook.md`; the frozen filenames + verdict (see Code Examples §A3-structural). |
| UAT-AUTO-04 | **Tier-2 headless E2E harness** — `claude --print` drives A1 (plugin-cache pointer resolution / D-31), A2-live (SAFE-02 live deny), A3-live (DOG-02 dual-path), gated on "CLI present AND authed"; **loud SKIP** when absent/unauthed, never a silent pass. | The verified CLI invocation + auth-probe + loud-skip mechanic (see Tier-2 De-Risked Steps). Resolves the pending cells in `05-HUMAN-UAT.md`, `06-HUMAN-UAT.md`. |
| UAT-AUTO-05 | **Wiring + docs** — both Tier-1 and Tier-2 lanes wired into the build (foundation-guards aggregator / `test:e2e` script), referenced from the single-source §14 gate, config-dialable; `dogfood-human-runbook.md` updated to name the three lanes and which is authoritative vs advisory/human. | package.json scripts shape, gate single-source rule, runbook lockstep (see Validation Architecture + Architecture Patterns). |
</phase_requirements>

## Summary

This phase honestly automates the agent-unrunnable **live-runtime** human UATs that have sat `pending human` since Phase 5/6, plus the B3 wording cross-check from Phase 11. The work splits cleanly into two lanes that map onto patterns already proven in this repo:

**Tier 1 (deterministic oracles, no LLM, fail-red)** is low-risk: all three oracles (B3 wording, A2 hooks.json→guard wiring, A3 structural parity) are mechanical greps/diffs/child-process assertions. The exact idioms exist in-repo and should be cloned verbatim — `grepFiles()` from `check-foundation-guards.ts`, the `spawnSync(guard.js)` child-CLI harness from `guard.test.ts`, and the byte-stable read patterns from the generators. The TS→committed-`.js`→freshness→Vitest convention (D-13) is the established house style.

**Tier 2 (headless E2E via `claude --print`)** is where the real unknowns were, and they are now resolved. The locally installed `claude` v2.1.178 confirms: `-p/--print` runs non-interactively; `--output-format json` emits a single structured result; `claude plugin marketplace add <path|repo>` + `claude plugin install grugops@grugops` install the plugin form headlessly; and — critically for the honesty contract — **`claude auth status` is a documented, deterministic, side-effect-free auth probe that exits 0 if logged in and 1 if not** (no API call, no token spend). That is the exact "CLI present AND authed" gate the loud-SKIP mechanic needs. The one residual nuance flagged below as `UNKNOWN - verify` is whether a literal `/grugops:plan …` passed as the `-p` prompt reliably *triggers* the slash command headlessly (vs. being treated as plain prompt text) — the harness must probe this and assert on observed markers, never assume.

**Primary recommendation:** Build Tier 1 first as a standalone `scripts/check-uat-oracles.ts` aggregator (cloning `check-foundation-guards.ts`'s pass/fail spine + `CHECK_ROOT` override + its `.test.ts` plant-and-run harness), wire it into the build the same way. Then build Tier 2 as `scripts/e2e/uat-live.test.ts` + a `test:e2e` npm script that ALWAYS runs `claude auth status` first: exit 0+loggedIn → run the E2E assertions; otherwise emit a loud, distinctly-marked SKIP and pass the *guard* (skip ≠ green for the UAT). Update `dogfood-human-runbook.md` in lockstep. Tier 3 stays human.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| B3 wording-consistency check | Tooling / dev-CI (`scripts/*.ts` → committed `.js`) | — | Pure file-read grep over four `.planning/` + repo docs; no runtime, no LLM. Same tier as the foundation guards. |
| A2 hooks.json→guard wiring | Tooling / dev-CI (Vitest spawnSync child-CLI) | — | Asserts the committed `hooks/guard.js` artifact behaves under the `hooks.json` matcher contract. Deterministic child-process I/O. |
| A3 structural parity | Tooling / dev-CI (file-read diff) | — | Diffs frozen artifact strings in `examples/` + runbook; no live session needed for the *structural* half. |
| A1 / A2-live / A3-live (E2E) | Tooling / dev-CI **gated on external `claude` CLI + auth** | Host coding agent (the `claude` runtime under test) | Exercises the real CLI runtime; the intelligence is the host agent, not grugops. MUST stay dev/CI-only (never a host runtime dep). |
| Auth/availability detection | Tooling / dev-CI (`claude auth status` probe) | — | A side-effect-free CLI subcommand; the honesty gate that decides run-vs-loud-skip. |
| UAT status flip (pending→passed) | **Human + real-run output only** | — | Per Constraint #6, a status may only flip from a real run's output. The harness produces evidence; a human (or a verified real-run artifact) flips the file. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | `~6.0.3` (devDep, pinned in package.json) | Author oracles + harness; compile to committed `.js` | D-13 house convention; already the only build tool [VERIFIED: package.json] |
| Vitest | `~4.1.8` (devDep) | Test runner for oracle harnesses + the `test:e2e` lane | Repo default; `globals:false`, `fileParallelism:false` already set [VERIFIED: package.json, vitest.config.ts] |
| Node stdlib (`node:fs`, `node:path`, `node:child_process`, `node:os`) | Node **22+** floor | All oracle logic + spawning `guard.js` and `claude` | Zero npm runtime deps — the hard rule; every existing script uses only `node:` builtins [VERIFIED: scripts/*.ts] |
| `claude` CLI | **2.1.178** locally; docs target v2.1.x | The Tier-2 E2E runtime under test (external, dev/CI-only) | The product grugops sits on top of; the only way to do a *real* live-session test [VERIFIED: `claude --version`] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/node` | `~22` (type-only devDep) | TS types for node builtins | Already present; no new dep [VERIFIED: package.json] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `claude auth status` exit code as the auth probe | `[ -n "$ANTHROPIC_API_KEY" ]` env check | Env check misses OAuth/subscription auth (the local machine is authed via `claude.ai` Max subscription with NO `ANTHROPIC_API_KEY` set — verified). `claude auth status` covers ALL auth methods and is documented to exit 0/1. Use the subcommand. |
| `claude auth status` | `claude config list` | `config list` **hung / timed out** when probed (15s timeout, exit 143) — NOT side-effect-free/deterministic. Do not use as a probe. [VERIFIED this session] |
| `--output-format json` (structured) | `--output-format text` (default) | JSON gives a parseable result envelope (better for asserting markers); text is simpler but you scrape stdout. Recommend `json` for the E2E assertions, `text`/exit-code for the auth probe. |
| Tier-2 in CI with a token | Tier-2 local-only + loud-skip in CI | Adding `setup-token`/`ANTHROPIC_API_KEY` to CI is a CONTEXT.md-forbidden secret/API-key requirement. Keep CI loud-skipping; run E2E locally against the dev's authed CLI. |

**Installation:** No new packages. Everything is `node:` builtins + the existing `{typescript, vitest, @types/node}` devDeps and the externally-installed `claude` CLI.

**Version verification:** `claude --version` → `2.1.178 (Claude Code)` [VERIFIED this session]. package.json devDeps confirmed [VERIFIED: package.json]. No registry install needed → Package Legitimacy Audit is N/A (no external package added).

## Package Legitimacy Audit

**Not applicable.** This phase installs **zero** new packages. It authors `.ts` → committed `.js` using only Node stdlib and the existing pinned devDeps (`typescript`, `vitest`, `@types/node`), and shells out to the externally-installed `claude` CLI (a developer/CI prerequisite, never an npm dependency of grugops). slopcheck/registry verification is moot — there is no package to vet.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────────────────────┐
                         │   npm run build  (tsc → committed .js)       │
                         │   npm run freshness (rebuild-to-temp + diff) │  ← D-13 gate, unchanged
                         └─────────────────────────────────────────────┘

  TIER 1  (deterministic, always runs, fail-red — part of default `npm test` + build gate)
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │  scripts/check-uat-oracles.ts  ──tsc──▶  check-uat-oracles.js                       │
  │     ├─ B3  wording  ──grepFiles()──▶ PROJECT.md / STATE.md / SDLC-audit / RETRO     │
  │     │                                  assert all 4 == "dropped P8 → guarded P10    │
  │     │                                  → re-verified P11"                            │
  │     ├─ A2  wiring   ──parse hooks.json matcher──▶ spawnSync(guard.js, kubectl-apply │
  │     │                                  PreToolUse payload) ─▶ assert deny-JSON       │
  │     └─ A3  structural ──read examples/03 + runbook──▶ assert same handoff filenames  │
  │                                        + verdict READY_FOR_HUMAN_REVIEW on both cols │
  │  exit 0 = all green · exit 1 = any fail  (WARN never fails — clone the .sh/.ts spine)│
  └──────────────────────────────────────────────────────────────────────────────────┘
        │  wired into:  check-foundation-guards (or standalone script) + §14 gate ref
        ▼
  TIER 2  (E2E, gated — `npm run test:e2e`, NOT in default CI green path)
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │  scripts/e2e/uat-live.test.ts (Vitest)                                              │
  │     ┌─ STEP 0  PROBE ─────────────────────────────────────────────────────────┐   │
  │     │  command -v claude  &&  claude auth status  (exit 0 = present+authed)      │   │
  │     │     present+authed ──▶ run E2E asserts below                               │   │
  │     │     absent / unauthed ──▶ LOUD SKIP (distinct marker + console.warn);       │   │
  │     │                            the GUARD passes, the UAT stays pending          │   │
  │     └────────────────────────────────────────────────────────────────────────┘   │
  │     A1  scaffold throwaway repo (mkdtemp + agent-factory/) ─▶ claude plugin         │
  │         marketplace add <path> ─▶ claude plugin install grugops@grugops ─▶          │
  │         claude -p "/grugops:plan …" --output-format json ─▶ assert planning markers │
  │         present AND path-error substring ABSENT  (D-31)                             │
  │     A2-live  claude -p "run: kubectl apply -f x"  with NO GRUGOPS_PROD_DEPLOY_      │
  │              APPROVED ─▶ assert the clear-voice deny string  (SAFE-02, V14)         │
  │     A3-live  drive ABC-001 sequential vs agent:-dispatch ─▶ diff handoff filenames  │
  │              + gate verdict  (DOG-02)                                               │
  └──────────────────────────────────────────────────────────────────────────────────┘

  TIER 3  (OUT OF SCOPE — B1/B2 persona/prose) ──▶ stays human sign-off (11-HUMAN-UAT 1&2)
```

### Recommended Project Structure
```
scripts/
├── check-uat-oracles.ts        # NEW Tier-1 aggregator (clone check-foundation-guards.ts)
├── check-uat-oracles.js        #   committed build output (tsc)
├── check-uat-oracles.test.ts   # NEW Vitest plant-and-run harness (clone *.test.ts pattern)
└── e2e/
    ├── uat-live.test.ts         # NEW Tier-2 headless harness (gated, loud-skip)
    └── probe.ts (optional)      #   the claude-present+authed probe, if factored out
docs/
└── dogfood-human-runbook.md    # EDIT: name the 3 lanes; mark Tier-1/2 authoritative, Tier-3 advisory/human
agent-factory/workflows/
└── 05-pr-quality-gate.md       # EDIT (single-source): reference the new lanes, config-dialed
.planning/phases/05.../05-HUMAN-UAT.md, 06.../06-HUMAN-UAT.md, 11.../11-HUMAN-UAT.md
                                # status flips ONLY from a real run's output (human/real-run gated)
```

### Pattern 1: Tier-1 aggregator — clone the foundation-guards spine
**What:** A single `.ts` aggregator with a `pass()/fail()/warn()` spine, a `FAILS` counter, a `CHECK_ROOT` env override for hermetic testing, `import.meta.dirname`-rooted paths, and `process.exit(FAILS === 0 ? 0 : 1)`. Clear-voice stdout.
**When to use:** Every Tier-1 oracle. This IS the house pattern.
**Example:** see `scripts/check-foundation-guards.ts:51-72` (the ROOT/CHECK_ROOT + pass/fail/warn block) and `:76-86` (`grepFiles`). Reproduce verbatim; add three new guard functions.

### Pattern 2: Child-CLI assertion — clone the guard test harness
**What:** `spawnSync("node", [GUARD_JS], { input: json, encoding: "utf8", env: {...process.env, ...env} })`, then assert on `stdout`/`status`. Always spawn the **committed `.js`**, never the `.ts`.
**When to use:** The A2 wiring oracle (spawn `guard.js` with a payload derived from `hooks.json`) AND the Tier-2 harness (spawn `claude` / `node`).
**Example:** `scripts/runnable-ref/.../guard.test.ts:33-43` (`runGuard`) and `:55-57` (`payload`).

### Pattern 3: Mirror-spawn for freshness/hermetic runs
**What:** `mkdtempSync` a temp dir, `cpSync` inputs in, run against the mirror, `rmSync` cleanup; fail-CLOSED if the run can't complete cleanly (never report "fresh"/"pass" on an error).
**When to use:** The A1 throwaway-repo scaffold (mkdtemp + copy `agent-factory/`), and if the Tier-1 oracle needs a committed `.js` freshness pairing.
**Example:** `scripts/catalog-freshness.ts:45-107` and `scripts/freshness.ts:62-107`.

### Anti-Patterns to Avoid
- **Re-testing guard logic in the A2 oracle.** `guard.test.ts` already proves deny/allow/refuse-self-set (26/26). The A2 oracle asserts only the *wiring contract*: `hooks.json` matcher → the committed `guard.js` → deny-JSON. Adding more guard-logic cases is scope creep and duplicates a passing suite.
- **Forking gate logic.** All §14 gate changes land in `05-pr-quality-gate.md` ONLY (D-26, repeated across the project). The new lanes are *referenced* from the gate, never restated into workflows 14/15.
- **Silent skip = green.** A Tier-2 skip that returns exit 0 with no loud marker is a fabricated pass under Constraint #6. The skip MUST be distinctly marked (a `SKIPPED (claude CLI absent/unauthed)` line + non-default console channel) and MUST NOT flip any UAT status.
- **Hand-setting a UAT status.** Never edit `result: [pending]` → `passed` from research/plan; only a real run's captured output justifies the flip.
- **Adding a new npm dep** (a markdown parser, a YAML lib, a CLI-runner helper). Stdlib `String.split`/regex only — the whole project enforces this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "Is the CLI authenticated?" | A custom env-var/keychain sniffer | `claude auth status` (exit 0 logged-in / 1 not; `--json` for detail) | Documented, covers all auth methods (OAuth, subscription, API key), side-effect-free, no token spend [CITED: code.claude.com/docs/en/cli-reference] |
| Non-interactive Claude run | A pseudo-tty wrapper / expect script | `claude -p "<prompt>" --output-format json` | First-class headless mode; `--output-format json` is the structured result envelope [VERIFIED: `claude --help` v2.1.178] |
| Plugin install in the test repo | Manually copying plugin files | `claude plugin marketplace add <path|repo>` + `claude plugin install grugops@grugops` | The real install path D-31 must exercise; copying by hand would NOT reproduce the plugin-cache-copy behavior the test exists to catch [VERIFIED: `claude plugin --help`] |
| Markdown frontmatter / table parse | gray-matter / js-yaml | `String.split` + regex (the repo's `parseFrontmatter` in generate-catalog.ts) | Zero-dep rule; the established idiom [VERIFIED: generate-catalog.ts:50-59] |
| Deterministic temp dirs | A bespoke tmp manager | `mkdtempSync(join(tmpdir(), "grugops-…"))` + `rmSync` | The repo's mirror-spawn idiom [VERIFIED: catalog-freshness.ts] |

**Key insight:** Every "deceptively complex" piece here already has a blessed, committed, tested implementation in this repo or a first-class CLI subcommand. The phase is almost entirely *cloning and wiring*, not inventing.

## Runtime State Inventory

> Phase 19 adds new tooling; it does NOT rename or migrate stored state. This is largely a greenfield-additive phase. The relevant non-file state is the EXTERNAL environment the Tier-2 lane depends on:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastore, collection, or keyed record is renamed or written by this phase. | none |
| Live service config | The `claude` CLI's installed marketplaces/plugins (`claude plugin list`, `~/.claude.json`). The A1 E2E will `marketplace add`/`install grugops@grugops`; do this against a **throwaway mkdtemp scope** or clean up with `claude plugin uninstall` / `marketplace remove` so the dev's real config isn't polluted. | E2E harness must scope/clean its marketplace+plugin install (use `--scope local` or a temp config; verify) |
| OS-registered state | None. No Task Scheduler / launchd / systemd registration. | none |
| Secrets/env vars | `GRUGOPS_PROD_DEPLOY_APPROVED` — the A2-live test asserts deny **because it is absent**. The harness must NEVER set or export it (V14). `ANTHROPIC_API_KEY` is unset locally (auth is via subscription) — do NOT require it. | harness must explicitly NOT set the approval var; CI must not require an API key |
| Build artifacts | New committed `.js` outputs (`check-uat-oracles.js`, and `.test.ts` files are excluded from tsc emit). The `freshness.ts` gate's `OUTPUT_DIRS = ["install","scripts","hooks"]` ALREADY covers `scripts/` recursively — a new `scripts/e2e/` subdir is collected automatically. | run `npm run build` + commit; freshness gate auto-covers new `scripts/**` .js (verify `scripts/e2e/` is not gitignored) |

**Nothing found in categories Stored data / OS-registered state** — verified by inspection (this phase reads files and shells out to a CLI; it persists nothing beyond committed build artifacts).

## Common Pitfalls

### Pitfall 1: Treating a literal `/grugops:plan` prompt as a guaranteed slash-command trigger
**What goes wrong:** The harness sends `claude -p "/grugops:plan add a GET /version endpoint"` and assumes the slash command fires, but print mode may treat the leading `/…` as ordinary prompt text or resolve a different command, producing output that neither contains the planning markers nor the path-error — an inconclusive run mistaken for a pass.
**Why it happens:** Slash-command invocation in headless `-p` mode is documented for interactive `/skill-name` usage; whether the *exact* `/grugops:plan` colon-form triggers reliably as a `-p` prompt is the one mechanic not fully confirmable without a live authed run (see Open Questions Q1).
**How to avoid:** Assert on **positive markers AND the absence of the failure substring** (planning/Orchestrator output present, "no such command"/path-error absent). If the command does not fire, that is a FAIL or an inconclusive (loud), never a silent pass. Probe both `claude -p "/grugops:plan …"` and the fallback `claude -p "<request>" --plugin-dir ./` form during build-out and lock whichever fires.
**Warning signs:** stdout contains neither the expected planning marker nor the path-error substring → treat as inconclusive-loud, not pass.

### Pitfall 2: Silent skip masquerading as green (the Constraint-#6 trap)
**What goes wrong:** CI has no authed `claude`, the E2E `it()` is skipped, the suite reports all-green, and someone reads "tests pass" as "UATs resolved."
**Why it happens:** Vitest's `it.skip`/`this.skip()` is quiet by default; a green suite hides the skip.
**How to avoid:** Make the skip LOUD: emit a distinct `console.warn("SKIPPED: claude CLI absent or unauthed — UAT A1/A2/A3 NOT exercised; status stays pending")` AND never flip a UAT file. Optionally have the `test:e2e` script print a banner. The skip is honest only if it is impossible to mistake for a pass.
**Warning signs:** A UAT file flips to `passed` on a run where the auth probe returned non-zero.

### Pitfall 3: Polluting the developer's real `claude` plugin/marketplace config
**What goes wrong:** The A1 test does a global `claude plugin install grugops@grugops` and leaves the dev's environment with a stale/duplicate marketplace.
**Why it happens:** `claude plugin install` defaults to `--scope user`.
**How to avoid:** Install with `--scope local` (or `project`) inside the throwaway repo, and/or `claude plugin uninstall grugops` + `claude plugin marketplace remove grugops` in a Vitest `afterAll`. Verify scope behavior on the target CLI version.
**Warning signs:** `claude plugin list` shows grugops after the test suite exits.

### Pitfall 4: Accidentally running a real deploy in the A2-live probe
**What goes wrong:** `kubectl apply -f x` actually reaches a configured cluster.
**Why it happens:** The dev's shell has a live kube-context.
**How to avoid:** Use a guaranteed-matched-but-harmless probe (`helm upgrade fake ./nope`) or run with no kube-context; the ONLY thing asserted is the PreToolUse deny firing. NEVER set `GRUGOPS_PROD_DEPLOY_APPROVED`. (This mirrors the runbook's explicit safety note, lines 20-31.)
**Warning signs:** The probe command exits as if it ran rather than being denied by the hook.

### Pitfall 5: Freshness false-positive on a new committed `.js`
**What goes wrong:** A new `scripts/e2e/*.js` or `check-uat-oracles.js` is committed with CRLF or stale bytes and the freshness gate flags drift.
**Why it happens:** Line-ending skew or forgetting to rebuild.
**How to avoid:** `npm run build` then commit; `.gitattributes` already pins `install/*.js` to LF and `tsconfig` sets `newLine:lf` — confirm the new `scripts/**` outputs inherit LF (add a `.gitattributes` line if needed). The `freshness.ts` `OUTPUT_DIRS` already recurses `scripts/`. NOTE: `*.test.ts` are excluded from tsc emit (`tsconfig exclude`), so test files produce no committed `.js` — good.
**Warning signs:** `npm run freshness` reports STALE for a file you didn't hand-edit.

## Code Examples

Verified patterns. Sources are in-repo files (HIGH confidence — these are the literal clone targets) plus the confirmed CLI shapes.

### A. The auth/availability probe (Tier-2 honesty gate)
```ts
// Source: confirmed against `claude auth status` v2.1.178 + code.claude.com/docs/en/cli-reference
// "Exits with code 0 if logged in, 1 if not" — side-effect-free, no token spend.
import { spawnSync } from "node:child_process";

function claudePresentAndAuthed(): boolean {
  // present?
  const which = spawnSync("command", ["-v", "claude"], { shell: true });
  if (which.status !== 0) return false;
  // authed? (deterministic, no API call)
  const auth = spawnSync("claude", ["auth", "status", "--json"], { encoding: "utf8" });
  if (auth.status !== 0) return false;            // exit 1 = not logged in
  try {
    return JSON.parse(auth.stdout)?.loggedIn === true;  // belt-and-suspenders
  } catch {
    return false;                                  // fail-closed → loud skip, never green
  }
}
// Observed local output: {"loggedIn":true,"authMethod":"claude.ai","apiProvider":"firstParty",...}
```

### B3. Wording-consistency oracle (clone grepFiles)
```ts
// Source: clones scripts/check-foundation-guards.ts:76-86 (grepFiles) + the verified 4-file set.
// The exact claim wording verified present in all four docs this session:
//   PROJECT.md            : "the `Agent` spawn grant was dropped from both templates in Phase 8,
//                            guarded mechanically by `guard_wr05` in Phase 10, and re-verified
//                            GREEN after the Phase-11 persona rewrite"
//   v1.2-SDLC-COVERAGE-AUDIT.md : "dropped from both packaging templates in Phase 8, the
//                            mechanical grep guard (guard_wr05) landed in Phase 10 …, re-verified
//                            GREEN after the Phase-11 persona rewrite"
//   RETROSPECTIVE.md      : "the grant was dropped in Phase 8, a mechanical guard (`guard_wr05`)
//                            was added in Phase 10, and it was re-verified GREEN after the
//                            Phase-11 persona rewrite"
//   STATE.md (Decisions)  : same three-beat claim (see STATE.md line 279 / PROJECT.md line 135)
const WR05_SCAN = [
  ".planning/PROJECT.md",
  ".planning/STATE.md",
  ".planning/v1.2-SDLC-COVERAGE-AUDIT.md",
  ".planning/RETROSPECTIVE.md",
];
// Assert each file contains the three beats: dropped/Phase 8, guarded/guard_wr05/Phase 10,
// re-verified/Phase 11. (The docs phrase it prose-style, not the terse "P8→P10→P11" slug — the
// oracle must match the SEMANTIC three-beat, e.g. three regexes per file, NOT a literal
// "dropped P8 → guarded P10 → re-verified P11" string, which appears NOWHERE verbatim.) [VERIFIED this session]
```
> PLANNER NOTE: The CONTEXT.md slug "spawn grant dropped P8 → guarded P10 → re-verified P11" is a *summary*, not a literal string in the docs. The oracle must assert the three semantic beats (Phase 8 dropped / Phase 10 guarded by guard_wr05 / Phase 11 re-verified GREEN), each present in each of the four files. A naive exact-string grep would fail red on correct docs — a false negative. `[VERIFIED this session]`

### A2-wiring. hooks.json → guard.js deny contract (clone the spawnSync harness)
```ts
// Source: clones guard.test.ts:33-57. The wiring oracle reads hooks.json (NOT a hardcoded path),
// confirms the PreToolUse matcher is "Bash" and the command targets hooks/guard.js, then spawns
// that committed guard.js with a matched payload and asserts deny — proving the wiring, not re-
// proving guard logic (which guard.test.ts covers 26/26).
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const hooks = JSON.parse(readFileSync("hooks/hooks.json", "utf8"));
const pre = hooks.hooks.PreToolUse[0];
// assert: pre.matcher === "Bash"; pre.hooks[0].command references "guard.js"   (the wiring)
const payload = JSON.stringify({ tool_input: { command: "kubectl apply -f deploy.yaml" } });
const r = spawnSync("node", ["hooks/guard.js"], { input: payload, encoding: "utf8" });
// assert: r.stdout contains '"permissionDecision":"deny"'  (exit 0 + deny JSON = blocked)
```
> Verified facts the oracle relies on [VERIFIED: hooks/hooks.json, hooks/guard.ts]:
> matcher = `"Bash"`; command = `node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.js"`; approval var = `GRUGOPS_PROD_DEPLOY_APPROVED`; deny string contains `"Production deploy blocked: humans decide, agents execute."` and names the env var.

### A3-structural. Dual-path parity diff
```ts
// Source: reads examples/03-ticket-to-pr.md + docs/dogfood-human-runbook.md (frozen artifacts).
// Verified frozen strings this session:
//   handoff filenames : implementation-handoff.md , qe-handoff.md
//   gate verdict      : READY_FOR_HUMAN_REVIEW
//   validator result  : ALL CHECKS PASSED  (exit 0)
// The structural oracle asserts the parity table's two columns name the SAME filenames + the SAME
// verdict (content-tolerant: "only the dispatch differs"). Until the CC-native column is filled by
// a real run, those cells read `pending human` — the oracle must distinguish "structurally
// parity-shaped + pending" from "filled and matching", and NEVER mark pending cells passed.
```

### A1 / Tier-2 headless invocation (verified CLI shapes)
```bash
# Source: VERIFIED against claude v2.1.178 (`claude --help`, `claude plugin --help`) + docs.
# 0) honesty gate (always first):
command -v claude && claude auth status            # exit 0 logged-in / 1 not   [CITED: cli-reference]
# 1) scaffold throwaway repo (mkdtemp), copy agent-factory/ + AGENTS.md in
# 2) install the plugin form headlessly:
claude plugin marketplace add <path-or-owner/repo> # --scope local|project|user (default user)
claude plugin install grugops@grugops --scope local
# 3) drive planning headlessly and capture structured output:
claude -p "/grugops:plan add a GET /version endpoint" --output-format json
#   assert: planning/Orchestrator markers present AND path-error substring ABSENT (D-31)
#   FALLBACK if the slash form doesn't trigger in -p (Open Q1): claude --plugin-dir ./ -p "<request>"
# A2-live (NEVER set GRUGOPS_PROD_DEPLOY_APPROVED; harmless matched probe):
claude -p "run this exact command: helm upgrade fake ./nope"   # assert deny string present
# cleanup:
claude plugin uninstall grugops ; claude plugin marketplace remove grugops
```
> Flags confirmed available v2.1.178 [VERIFIED]: `-p/--print`, `--output-format {text,json,stream-json}`, `--input-format`, `--bare`, `--permission-mode {default,acceptEdits,plan,auto,dontAsk,bypassPermissions}`, `--allowedTools`, `--dangerously-skip-permissions`, `--plugin-dir <dir|.zip>`, `--append-system-prompt`, `--max-turns`, `--max-budget-usd`, `--no-session-persistence`, `--settings`. Subcommands: `claude auth status`, `claude plugin {marketplace add, install, validate, uninstall, list}`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dual POSIX `install.sh` + `install.mjs`, stdlib-only `.mjs`, no `package.json` | TS authored → `tsc` → committed `.js` → freshness gate; `{typescript,vitest}` devDeps; Node 22+ floor | D-13 ratified 2026-06-13 (Phase 15) | The phase MUST follow D-13; do NOT write `.sh`/`.mjs`. All POSIX originals were deleted. [VERIFIED: STATE.md, package.json] |
| Custom env probes for auth | `claude auth status` (exit 0/1, `--json`) | Documented CLI subcommand | The honesty-keystone probe; covers OAuth/subscription auth that `ANTHROPIC_API_KEY` checks miss. [CITED: cli-reference] |
| `guard.mjs` + `guard.test.sh` (26/26) | `guard.ts` → `guard.js` + `guard.test.ts` (26/26) | Phase 15 | A2 oracle spawns the committed `guard.js`; deny string + approval var are stable. [VERIFIED: hooks/] |
| `e2e_when` dial key | `quality.ui_e2e` (off | ui-or-critical-path | always) | Phase 10 (D-13 rename) | If a new gate-execution dial is needed, mirror the `quality.*` enum shape; do not reintroduce `e2e_when`. [VERIFIED: STATE.md] |

**Deprecated/outdated:**
- `install.sh` / `*.mjs` / `*.test.sh` — all retired in Phase 15 (D-09). Never author new ones.
- The `Task` tool name — renamed to `Agent` (irrelevant here: this phase grants no spawn tool).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | UAT-AUTO-01..05 IDs/descriptions are the researcher's proposed decomposition; they are NOT yet in REQUIREMENTS.md. | Phase Requirements | Decision-coverage gate reads them as unmapped → planning blocks. Planner must add them to REQUIREMENTS.md + traceability and confirm wording with the user. |
| A2 | `claude -p "/grugops:plan …"` (colon slash-command as the print-mode prompt) reliably *triggers* the command headlessly. | Pitfall 1, Open Q1 | If it doesn't fire, the A1 E2E is inconclusive; mitigated by asserting markers-present-AND-error-absent + the `--plugin-dir` fallback. Must be probed live, not assumed. |
| A3 | `claude plugin install --scope local` confines the install to the throwaway repo and is cleanly removable. | Pitfall 3, Runtime State | Could pollute the dev's real `claude` config; mitigated by `afterAll` cleanup. Verify scope semantics on the target version. |
| A4 | A new gate-execution dial for the lanes (if any) should reuse the `quality.*` enum shape; the E2E lane likely needs no new key (it self-skips on unauth). | User Constraints (config dial) | A redundant new key adds dial surface. Discretion item — confirm during planning. |
| A5 | The committed `.js` freshness gate (`OUTPUT_DIRS=["install","scripts","hooks"]`) auto-covers a new `scripts/e2e/` subdir. | Pitfall 5 | If `scripts/e2e/` were gitignored or excluded, a stale `.js` would slip. Verify the new path is tracked + LF-pinned. |

## Open Questions (RESOLVED)

> All three Open Questions are resolved-by-design for planning. Q1/Q2 are mechanics the Tier-2 harness PROBES live during build-out (the plan encodes the assertion shape, not a guessed answer); Q3 is an orchestrator-tracked process step, not a code unknown.

1. **RESOLVED: probe live during build-out; plan asserts markers-present-AND-path-error-absent on both `claude -p "/grugops:plan …"` and the `--plugin-dir ./` fallback.**
   - What we know: `-p` is the documented non-interactive mode; `--output-format json` gives a result envelope; slash commands are invoked interactively as `/skill-name`; `--plugin-dir ./` loads a plugin for one session. The plugin form's `plan` skill is `skills/plan/SKILL.md` (`/grugops:plan`).
   - Resolution: The A1 harness case (Plan 19-02 Task 1) runs BOTH forms against the authed local CLI and locks whichever fires. The honesty contract is to assert **planning/Orchestrator markers PRESENT and the path-error substring ABSENT** on whichever form triggers; on neither, the run is fail/inconclusive-loud (never a silent pass). The print-mode slash-trigger nuance is a build-out probe with a defined assertion shape, not an open unknown blocking planning.

2. **RESOLVED: prefer the local `./` marketplace-source form; verify the plugin-cache copy actually occurs (that IS the D-31 condition).**
   - What we know: `claude plugin marketplace add` accepts "a URL, path, or GitHub repo"; the runbook notes a raw-URL marketplace does NOT fetch plugin files — use a Git host or a local path. This repo's `.claude-plugin/{plugin,marketplace}.json` validate clean (`claude plugin validate` exit 0).
   - Resolution: The A1 case uses the local-path form (`marketplace add <abs-path-to-this-repo>` → `install grugops@grugops --scope local`) for hermeticity, and the assertion explicitly verifies the plugin-cache copy occurred — that copy IS the D-31 condition under test. Fall back to a Git-hosted form only if the local-path form does not trigger the copy on the target CLI version.

3. **RESOLVED: UAT-AUTO-01..05 backfill into REQUIREMENTS.md is the orchestrator's job, tracked separately.**
   - What we know: ROADMAP/STATE reopened v1.2 for Phase 19; the feasibility plan framed the capability as a "v1.3 candidate feature." UAT-AUTO-01..05 are referenced in ROADMAP/STATE but not yet defined in REQUIREMENTS.md.
   - Resolution: Defining UAT-AUTO-01..05 in REQUIREMENTS.md + the traceability table (and the v1.2-vs-v1.3 milestone placement) is an orchestrator/discuss-phase process step, tracked separately from these execution plans. The plans cover all five IDs in their `requirements` frontmatter (19-01: UAT-AUTO-01/03; 19-02: UAT-AUTO-02/03/05; 19-03a/19-03b: UAT-AUTO-04). The proposed decomposition in the Phase Requirements table above is the agreed wording basis.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | All tooling (`tsc`, scripts, harness) | ✓ | 22+ floor (package.json `engines`) | — (hard prerequisite) |
| TypeScript | Build `.ts`→`.js` | ✓ | `~6.0.3` devDep | — |
| Vitest | Oracle + E2E harnesses | ✓ | `~4.1.8` devDep | — |
| `claude` CLI | Tier-2 E2E ONLY | ✓ (locally) | **2.1.178** | **Loud SKIP** when absent (the designed fallback) |
| `claude` auth | Tier-2 E2E ONLY | ✓ (subscription `max`, `claude.ai`) | — | **Loud SKIP** when unauthed (the designed fallback) |
| `ANTHROPIC_API_KEY` | (none — explicitly NOT required) | ✗ (unset) | — | N/A — auth is via subscription; do NOT require a key in CI |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** The `claude` CLI/auth in CI — by design the Tier-2 lane loud-skips when unavailable (never a silent green, never a CI secret requirement). Tier-1 has no external deps and always runs.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `~4.1.8` (devDep) |
| Config file | `vitest.config.ts` (`fileParallelism: false`; globals:false → import test fns) |
| Quick run command | `npx vitest run scripts/check-uat-oracles.test.ts` (Tier-1 only, fast, deterministic) |
| Full suite command | `npm test` (= `vitest run`) for Tier-1 + all existing; `npm run test:e2e` for the gated Tier-2 lane |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UAT-AUTO-01 | B3 wording 3-beat present in all 4 docs; fail-red on mismatch | unit/oracle | `npx vitest run scripts/check-uat-oracles.test.ts -t "wording"` | ❌ Wave 0 |
| UAT-AUTO-02 | hooks.json matcher → guard.js deny-JSON on kubectl-apply payload | integration/oracle | `npx vitest run scripts/check-uat-oracles.test.ts -t "wiring"` | ❌ Wave 0 |
| UAT-AUTO-03 | dual-path parity: same handoff filenames + verdict string | unit/oracle | `npx vitest run scripts/check-uat-oracles.test.ts -t "parity"` | ❌ Wave 0 |
| UAT-AUTO-04 | E2E A1/A2-live/A3-live behind present+authed gate; loud-skip otherwise | e2e (gated) | `npm run test:e2e` (loud-skips if `claude auth status` ≠ 0) | ❌ Wave 0 |
| UAT-AUTO-05 | lanes wired into build + §14 gate ref; runbook names 3 lanes | structural/manual | `npm run build && npm run freshness && npm test` + doc review | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run scripts/check-uat-oracles.test.ts` (Tier-1, < 5s) + `npm run build` if `.ts` changed.
- **Per wave merge:** `npm test` (full Tier-1 + existing suites) + `npm run freshness` + `npm run freshness:catalog`.
- **Phase gate:** Full `npm test` green + `npm run build`/`freshness` green; Tier-2 `npm run test:e2e` run LOCALLY against the authed CLI and its captured output used to flip the pending UAT cells (real-run evidence). `/gsd-verify-work` checks the UAT files were flipped only from real-run output.

### Wave 0 Gaps
- [ ] `scripts/check-uat-oracles.ts` (+ committed `.js`) — the three Tier-1 oracles (covers UAT-AUTO-01/02/03)
- [ ] `scripts/check-uat-oracles.test.ts` — plant-and-run harness proving each oracle PASS and FAIL (clone `check-foundation-guards.test.ts` `CHECK_ROOT` mirror idiom)
- [ ] `scripts/e2e/uat-live.test.ts` — the gated headless harness with the loud-skip probe (covers UAT-AUTO-04)
- [ ] `package.json` `test:e2e` script (and any `freshness` coverage confirmation for `scripts/e2e/`)
- [ ] `docs/dogfood-human-runbook.md` edit — name the 3 lanes, mark Tier-1/2 authoritative vs Tier-3 advisory/human (UAT-AUTO-05)
- [ ] `agent-factory/workflows/05-pr-quality-gate.md` reference to the new lanes (single-source; config-dialed) (UAT-AUTO-05)
- [ ] `.planning/.../05-HUMAN-UAT.md`, `06-HUMAN-UAT.md`, `11-HUMAN-UAT.md` scenario 3 — flipped ONLY from real-run output
- Framework install: none — Vitest already present.

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1`, `security_block_on: high` (config.json). This phase is dev/CI tooling, not a runtime service, so most ASVS categories are N/A — but two apply sharply because the phase touches the SAFE-02 safety boundary and shells out to a CLI.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface authored; the harness only *probes* `claude auth status` read-only. |
| V3 Session Management | no | — |
| V4 Access Control | yes (the safety boundary) | The A2-live test MUST NOT set `GRUGOPS_PROD_DEPLOY_APPROVED`; humans hold merge/deploy (V14). The harness asserts the guard DENIES — it never approves. |
| V5 Input Validation | yes | The oracle parses `hooks.json` / docs with stdlib only; fail-closed on parse error (clone the repo's try/catch-or-exit idiom). |
| V6 Cryptography | no | None. |
| V12 File/Resource (path traversal) | yes | All paths are FIXED literals joined to `import.meta.dirname` (the repo's path-traversal mitigation); temp dirs via `mkdtempSync`. Never derive a write path from argv/env/content. |

### Known Threat Patterns for {dev-CI tooling + CLI shell-out}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Harness self-approves a prod deploy (sets the approval var to "make it pass") | Elevation of Privilege | NEVER set `GRUGOPS_PROD_DEPLOY_APPROVED`; assert the deny. The guard also refuses inline self-set (D-33). |
| A2-live probe actually deploys to a real cluster | Tampering | Harmless matched probe (`helm upgrade fake ./nope`) / no kube-context; the assertion is the *deny*, not execution. |
| Fabricated green (silent skip / hand-set status) | Repudiation / trace integrity | Loud-skip + real-run-only status flips (Constraint #6). |
| Command injection via untrusted prompt/path | Tampering | Spawn with arg arrays (no `shell:true` for the data path), fixed-literal paths, stdlib parse. |
| Leaking the dev's plugin/marketplace config | Tampering | `--scope local` + `afterAll` cleanup. |

## Project Constraints (from CLAUDE.md)

The planner must verify every plan honors these (CLAUDE.md authority = locked decisions):
- **#6 No fabrication** — never fake a passing gate/test/citation; `UNKNOWN - verify` for unknowns. (This phase's entire reason to exist; the loud-skip + real-run-only-flip rules are the mechanical form.)
- **Voice discipline** — clear (non-caveman) voice in safety findings + the runbook (SAFE-02 surface). Caveman only in role prompts (none authored here).
- **Zero host runtime deps** — host runs committed `.js` with nothing installed. Tier-2's `claude`/auth is dev/CI-only and must not become a host dependency; the minimal markdown-copy install path stays unaffected.
- **Single-source gate logic** — all §14 changes in `05-pr-quality-gate.md` only; reference, never fork.
- **D-13 (TS pivot)** — author `.ts`, compile to committed `.js`, freshness-gate, Vitest-cover; dev deps only `{typescript, vitest, @types/node}` — add nothing else. No `.sh`/`.mjs`.
- **Installers idempotent/additive/reversible** — N/A (no installer changes), but if the harness touches `claude plugin install`, it must clean up (additive, reversible) so it doesn't mutate the dev's environment.
- **Single-window sequential role-load** — grant NO spawn tool anywhere (the A3-live test merely *drives* the existing `agent:` dispatch path; it does not add a spawn grant).

## Sources

### Primary (HIGH confidence)
- In-repo clone targets (read this session, verbatim): `scripts/check-foundation-guards.ts` + `.test.ts`, `scripts/catalog-freshness.ts`, `scripts/freshness.ts`, `scripts/generate-catalog.ts`, `scripts/generate-asvs-checklist.ts`, `scripts/runnable-ref/*.ts`, `hooks/guard.ts` + `guard.test.ts` + `hooks.json`, `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitattributes`.
- In-repo scope/state: `19-CONTEXT.md`, `260616-faw-PLAN.md` (feasibility), `STATE.md`, `REQUIREMENTS.md`, `CLAUDE.md`, the three `*-HUMAN-UAT.md` files, `docs/dogfood-human-runbook.md`, `examples/03-ticket-to-pr.md`, `05-pr-quality-gate.md`, `.claude-plugin/{plugin,marketplace}.json`, `skills/plan/SKILL.md`.
- `claude` CLI v2.1.178 probed live this session: `claude --version`, `claude --help`, `claude auth status [--json]` (exit 0, `{"loggedIn":true,…}`), `claude auth --help`, `claude plugin --help` (marketplace add/install/validate/uninstall), `claude plugin validate <repo>` (exit 0), `claude plugin marketplace add --help`.
- code.claude.com/docs/en/cli-reference — `claude auth status` "Exits with code 0 if logged in, 1 if not"; `--print/-p`, `--output-format {text,json,stream-json}`, `--input-format`, `--permission-mode`, `--allowedTools`, `--plugin-dir`, `--append-system-prompt`, `--max-turns`, `--max-budget-usd`, `--no-session-persistence`, `--settings` (HIGH).
- code.claude.com/docs/en/slash-commands (skills) — slash commands invoked as `/skill-name`; custom commands merged into skills; print mode is the documented non-interactive path (HIGH for the invocation model; print-mode slash-trigger of the colon form left as Open Q1).

### Secondary (MEDIUM confidence)
- `docs/dogfood-human-runbook.md` Checks 1-3 — the human-run procedure the Tier-2 harness mirrors step-for-step (in-repo, authoritative for the procedure shape).

### Tertiary (LOW confidence)
- None relied upon. The one genuine uncertainty (print-mode slash-command trigger) is flagged `UNKNOWN - verify` / Open Q1 rather than asserted.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every tool is already pinned in this repo and verified; no new package.
- Tier-1 architecture/oracles: HIGH — exact clone targets read in full; idioms are literal.
- Tier-2 CLI mechanics: HIGH for invocation/auth-probe/plugin-install (verified against the live CLI + official docs); MEDIUM for the precise print-mode slash-command trigger (Open Q1, must be probed live).
- Pitfalls: HIGH — derived from the runbook's explicit safety notes + the repo's freshness/scope idioms.

**Research date:** 2026-06-16
**Valid until:** ~2026-07-16 for the repo-internal patterns (stable); ~2026-06-30 for the `claude` CLI flag surface (fast-moving — re-verify `--print`/`plugin`/`auth status` shapes if the CLI is upgraded past 2.1.178).

## RESEARCH COMPLETE

**Phase:** 19 - Factory Auto-UAT Harness — Tier 1 Deterministic Oracles + Tier 2 Headless E2E
**Confidence:** HIGH (Tier 1 + Tier-2 mechanics verified; one print-mode slash-trigger nuance flagged UNKNOWN - verify)

### Key Findings
- **Tier 1 is pure cloning.** All three oracles map onto in-repo idioms read verbatim: `grepFiles()` + pass/fail/`CHECK_ROOT` spine from `check-foundation-guards.ts`, the `spawnSync(guard.js, payload)` child-CLI harness from `guard.test.ts`, and the mirror-spawn/fail-closed pattern from `catalog-freshness.ts`. The A2 oracle asserts the *wiring contract* only (hooks.json matcher → `guard.js` → deny-JSON), never re-testing the 26/26 guard logic.
- **The honesty keystone is `claude auth status`** — a documented, side-effect-free probe that exits 0 if logged in / 1 if not (and `--json` → `{"loggedIn":true,…}`). This is the deterministic "present AND authed" gate the loud-SKIP needs; it beats an `ANTHROPIC_API_KEY` check (which is unset locally — auth is via subscription). `claude config list` HUNG and is unusable as a probe.
- **Tier-2 CLI shapes are confirmed on the live CLI (v2.1.178):** `-p/--print`, `--output-format json`, `claude plugin marketplace add <path|repo>` + `install grugops@grugops --scope local`, and `claude plugin validate` (exit 0 on this repo). The B3 wording slug "P8→P10→P11" is a SUMMARY — the docs phrase it prose-style; the oracle must match the three semantic beats, not a literal string (a false-negative trap if mis-built).
- **One genuine unknown, flagged not guessed:** whether `claude -p "/grugops:plan …"` (colon slash-command as the print prompt) reliably triggers headlessly. Mitigation: probe both that and the `--plugin-dir ./` fallback live; assert markers-present-AND-path-error-absent.
- **Requirements gap surfaced:** UAT-AUTO-01..05 are referenced in ROADMAP/STATE but NOT defined in REQUIREMENTS.md. The planner must add them + traceability (proposed decomposition provided) or the decision-coverage gate will read them as unmapped.

### File Created
`/Users/olgeroeselg/Projects/public/grugops/.planning/phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | No new package; all tools pinned + verified in-repo. |
| Architecture (Tier 1) | HIGH | Literal clone targets read in full. |
| Architecture (Tier 2) | HIGH/MEDIUM | Invocation/auth/plugin verified live; print-mode slash-trigger is Open Q1. |
| Pitfalls | HIGH | From the runbook's safety notes + repo freshness/scope idioms. |

### Open Questions
1. Does `claude -p "/grugops:plan …"` trigger the slash command in print mode? (probe both it + `--plugin-dir ./` fallback)
2. Marketplace source for the throwaway repo: local `./` path vs Git `owner/repo` (prefer local; verify the plugin-cache copy actually happens — that IS the D-31 condition).
3. Are UAT-AUTO-01..05 the agreed IDs, and do they join v1.2 (reopened, now 30) or open a v1.3 line? (add to REQUIREMENTS.md + traceability before the coverage gate.)

### Ready for Planning
Research complete. The planner can clone the Tier-1 oracles from the named in-repo files, build the Tier-2 harness around the verified `claude auth status` loud-skip gate, wire both into the build + the single-source §14 gate, and update the runbook in lockstep — with the three Open Questions resolved during build-out (live probe) and a REQUIREMENTS.md/traceability addition for UAT-AUTO-01..05 as a planning prerequisite.
