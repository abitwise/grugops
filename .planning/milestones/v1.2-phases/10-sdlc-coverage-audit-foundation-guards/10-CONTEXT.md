# Phase 10: SDLC-Coverage Audit & Foundation Guards - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Phase Boundary

The v1.2 milestone opener. Two jobs, both cross-cutting so every later content phase (11–17) writes into a guarded, dialed environment:

1. **SDLC-coverage audit (SDLC-01)** — a committed artifact that reviews all 16 roles + 14 workflows for full-lifecycle completeness (named focus: the business→engineer handoff) and records the gaps it finds.
2. **Four mechanical foundation guards (SDLC-02)** that run in the build gate, each failing red on violation and never fabricating a pass: (a) a WR-05 spawn-grant grep over packaging templates + materialized adapters, (b) a single-source adapter-size check, (c) an AGENTS.md byte-budget check (under the 32 KiB Codex cap), (d) a voice-discipline lint over security/compliance/warning surfaces.
3. **Config-dial contract + 8 new keys (SDLC-03 / SC4)** — a documented lean-default↔enterprise-escalation contract for every v1.2 capability, plus the new dial keys (`bdd`, `quality.tdd`, `quality.lint`, `quality.ui_e2e`, `quality.test_integrity`, `quality.gate_enforcement`, `security.asvs_level`, `security.block_on`) added with lean defaults across all three config files atomically and recognized by the validator. Zero-config still runs lean — every new key degrades to its documented lean default when absent.

**In scope:** the audit artifact; the four guards + their fail-on-violation proof; the config-dial contract doc; the 8 new keys in all three config files; validator recognition of the keys; the `adapters.md` stale-spawn-prose fix.

**Out of scope (later phases / deferred — do NOT pre-empt):**
- **Wiring the actual behavior** the new keys control — BDD/TDD (Phase 12), UI/E2E (Phase 15), lint step + test-integrity (Phase 15), ASVS audit (Phase 14). Phase 10 only *creates the keys + contract*; it does not implement what they switch.
- **Retiring WR-05 from the packaging templates** as content work + the persona overhaul — Phase 11. (The templates already carry no spawn grant; Phase 10 only adds the *guard* that keeps it that way, and fixes the contradictory `adapters.md` doc prose.)
- **A GitHub Actions CI workflow** (`.github/`) — held; the guard suite runs local-only for now (see D-06).
- **The TypeScript pivot** — explicitly HELD as a separate project-level decision (see D-05 / Deferred Ideas). Phase 10 uses POSIX sh.

**Already locked upstream (carry forward, do NOT re-decide):**
- **Single-window sequential role-load — NO spawn tool** (D-08, Phases 7/8). The packaging templates already grant no spawn tool; this is the design, not debt to reverse. Re-introducing an `Agent`/`Task` grant is explicitly Out-of-Scope (REQUIREMENTS.md).
- **Kit vs state split** (Phase 7): bare `agent-factory/…` = read-only KIT; `plans/`, `memory-bank/`, `.grugops/` = repo-relative STATE. Guards that scan the kit must honor this classification.
- **Markdown-only kit; stdlib-only scripts; NO npm runtime deps** (CLAUDE.md hard constraint + REQUIREMENTS Out-of-Scope). New guards are POSIX sh / no new dependencies.
- **The "ship GREEN with a fail-on-violation proof" gate pattern** (`scripts/check-kit-refs.sh`): a gate authored after the tree is clean ships GREEN at commit but carries a proof it fails red on a planted violation. Explicit scan lists, never a repo-wide grep.
- **Two-tier findings + `--strict`** (validator) and **0/nonzero exit + `pass()/fail()`** (sh harnesses) — reuse these idioms.
- **No fabrication** — `UNKNOWN - verify`; never fake a passing gate, test, or citation. (This is *why* the guards exist.)
- **sh↔Node byte-parity** for the installers (`install.sh` ↔ `install.mjs`) — unchanged this phase (no installer work here).

</domain>

<decisions>
## Implementation Decisions

### SDLC-coverage audit (SDLC-01 / SC1)
- **D-01:** The audit lives in **`.planning/`** as an internal planning artifact (NOT shipped in the installed kit, NOT in `docs/`). Suggested filename `.planning/v1.2-SDLC-COVERAGE-AUDIT.md`, mirroring the `.planning/milestones/v1.1-MILESTONE-AUDIT.md` naming precedent. It audits grugops's own kit — an engineering input, not user-facing capability.
- **D-02:** Format is a **lifecycle-stage × role/workflow coverage matrix** (each cell: covered / partial / gap) **plus a short narrative per real gap**. The business→engineer handoff is called out explicitly (it is the milestone's named focus). Audit against the canonical lifecycle in PROJECT.md: business analysis → product → system analysis → architecture → engineering → QE/E2E → security/NFR/compliance → UAT → release.
- **D-03:** The audit **records each gap AND maps it to the v1.2 phase (11–17) that addresses it**, and flags any gap the current roadmap does NOT cover. It confirms the roadmap is sufficient — it does **not** re-scope or rewrite the roadmap (new capabilities are their own phase; no scope creep).

### Foundation-guards wiring & strictness (SDLC-02 / SC2)
- **D-04:** The four guards live in **one POSIX-sh aggregator**, `scripts/check-foundation-guards.sh`, with four named guard functions — mirroring `check-kit-refs.sh`'s multi-assertion structure. One command runs all four; each fails red independently; a single fail-proof test file covers them (the `validate.test.sh` / `check-kit-refs.sh` fail-on-mutation precedent).
- **D-05:** **Language is POSIX sh** for Phase 10 (matches `check-kit-refs.sh`; the grep/wc/byte checks need no Node; keeps a Node-free gate path; honors the markdown + POSIX + one-Node-validator constraint). ⚑ **The user's "pivot to TypeScript, drop plain JS/SH" intent is HELD, not actioned here** — it is a project-level decision (see Deferred Ideas) requiring a PROJECT.md + hard-constraint amendment.
- **D-06:** **Local-only** — the guard suite runs via the script the way `check-kit-refs.sh` / `validate.test.sh` are run today. No `.github/` CI is added (none exists). The aggregator must stay **CI-ready** (single command, clean exit codes) so a future workflow can call it.
- **D-07:** Size guards are **two-tier WARN→FAIL with a safety margin**: WARN approaching the limit, FAIL at it. AGENTS.md FAILs **below** the 32 KiB Codex cap (headroom margin) — not at the hard cap. Adapter files are capped at a **pointer-sized ceiling**. Exact byte/line numbers → planner discretion (see Claude's Discretion).

### Guard detection semantics (SDLC-02 / SC2)
- **D-08:** The **WR-05 guard matches an actual spawn grant in frontmatter only** — a `tools:` / `allowed-tools:` list containing `Agent` or `Task`. It does **NOT** match the prose word "spawn"/"sub-agent", because the templates and adapters legitimately *explain* the no-spawn rule using that word. (A naive `grep spawn` would false-positive and fail red on correct files.)
- **D-09:** **Fix `agent-factory/packaging/adapters.md` now** — its stale table/prose ("the Orchestrator … spawns role agents with the `Agent` tool"; "the Orchestrator spawns a role agent") contradicts the frozen single-window no-spawn design (D-08, Phase 7/8) and must be corrected to sequential role-load language. **But the WR-05 guard's scan set stays exactly at SC2's wording: the 2 packaging templates (`subagent.frontmatter.md`, `slash-command.template.md`) + the 2 materialized adapters (`.claude/skills/grugops/SKILL.md`, `.claude/agents/grugops-orchestrator.md`).** The `adapters.md` fix is recorded in the audit; it is not added to the guard scope.
- **D-10:** The **voice-discipline lint** is a **curated caveman-marker word list** (e.g. `grug`, `club`, `rock`, "brain hurt", "shiny", "no think", etc.) scanned **section-scoped over curated clear-voice surfaces only** — NOT whole-file (role files legitimately mix caveman body + clear-voice safety lines). Initial surfaces: the `security-nfr`, `compliance-officer`, `incident-responder` roles; the safety lines (named-human-approval / never-merge / never-deploy); and the security/compliance/warning sections of workflows + checklists. Designed **forward-compatible** with Phase 11's new "What good looks like / When to escalate" clear-voice sections. Exact surface list + anchoring mechanism (curated file/section list vs sentinel markers) + the marker word list → planner discretion.

### Config-dial contract + new keys (SDLC-03 / SC3 / SC4)
- **D-11:** The lean→enterprise **contract lives by extending `agent-factory/config/factory.config.md`** (the existing human-readable twin) with an **"Enterprise escalation" column/section** per key. Single source; no new doc to drift. (Explicitly NOT in AGENTS.md — that's byte-budgeted and is what the new guard protects.)
- **D-12:** The **8 new keys are adopted with these shapes + lean defaults** (forward-compatible with what phases 12–15 wire):
  - `bdd`: `"off" | "lean" | "strict"` — lean default **`"lean"`** (top-level key)
  - `quality.tdd`: `"off" | "encouraged" | "required"` — lean default **`"encouraged"`**
  - `quality.lint`: object `{ "strict": false, "autofix": true }` — lean default **strict off, autofix on**
  - `quality.ui_e2e`: `"off" | "ui-or-critical-path" | "always"` — lean default **`"ui-or-critical-path"`**
  - `quality.test_integrity`: `"warn" | "block"` (**never `off`** — trace-integrity safety carve-out, TINT-03) — lean default **`"warn"`**
  - `quality.gate_enforcement`: `"advisory" | "blocking"` — lean default **`"blocking"`** (the gate is the backpressure)
  - `security.asvs_level`: `"L1" | "L2" | "L3"` — lean default **`"L1"`**
  - `security.block_on`: severity `"none" | "low" | "medium" | "high"` — lean default **`"high"`** (block only on high-severity security findings in lean)
- **D-13:** **Overlap reconciliation — no behavior double-owned.** `quality.ui_e2e` **replaces** the existing `quality.e2e_when` (same enum; config is pre-1.0 v0.1.0, safe to rename — update all three config files + the twin + any references). Keep **`"lint"` in `mandatory_gates`** (the gate-presence list) AND add **`quality.lint`** (configures lint strictness/autofix) — these are complementary, not duplicate.
- **D-14:** The validator (`scripts/validate-agent-factory.mjs`) is **active-when-present, lenient-when-absent**: it recognizes the new keys and **enum-checks their values when present** (an invalid value, e.g. `asvs_level: "L4"` → error), but treats a **missing** key as its lean default — NOT an error — so zero-config still passes (SC4). Two-tier: bad value = error; absent = fine. Stays stdlib-only, read-only, no `package.json`.

### Atomic three-file update (SC3)
- **D-15:** The 8 new keys land **atomically across all three config files**: `agent-factory/config/factory.config.json`, the `agent-factory/config/factory.config.md` twin (which also gains the enterprise-escalation contract per D-11), and `agent-factory/seed/.grugops/factory.config.json`. The two JSON files stay byte-identical companions; the `e2e_when→ui_e2e` rename (D-13) applies to all three.

### Claude's Discretion (planner/researcher to lock)
- **Exact size thresholds (D-07):** the AGENTS.md WARN/FAIL byte numbers (margin below 32 KiB — e.g. WARN ~24 KiB / FAIL ~28 KiB) and the adapter-size pointer ceiling (byte or line count). Keep deterministic and documented.
- **Voice-lint specifics (D-10):** the exact caveman-marker word list, the exact clear-voice surface set, and the anchoring mechanism (curated file/section allowlist vs sentinel-delimited zones). Must avoid false-positives on legitimate caveman prompt bodies.
- **WR-05 regex (D-08):** the exact pattern (which frontmatter keys, `Agent|Task` tokens, comma-list vs YAML-array forms).
- **Audit lifecycle stages + exact filename (D-01/D-02):** the precise stage columns and whether sub-stages are split; final filename within `.planning/`.
- **`gate_enforcement` / `block_on` semantics (D-12):** the precise meaning wired later (phases 14/15) within the adopted enums; Phase 10 only seeds the keys + documents the contract.
- **Guard test strategy:** whether the aggregator ships GREEN-at-commit with planted-violation fail-proof fixtures (like `check-kit-refs.sh` + `validate.test.sh`) vs a RED-first harness — given the current tree is already clean (no spawn grant; AGENTS.md 6 KB; adapters pointer-sized), GREEN-with-fail-proof is the likely fit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements, roadmap & milestone scope (authoritative)
- `.planning/ROADMAP.md` § "Phase 10: SDLC-Coverage Audit & Foundation Guards" — the goal + the 4 success criteria this phase must satisfy (audit; 4 guards; config-dial contract + 8 keys atomic across 3 files + validator recognition; zero-config lean degradation).
- `.planning/REQUIREMENTS.md` § "SDLC Coverage & Foundation Guards" — **SDLC-01** (audit), **SDLC-02** (the 4 guards, each fails red, never fabricated), **SDLC-03** (lean-default↔enterprise-escalation contract). Also § "Out of Scope" — **no npm deps in grugops itself**, **no re-introducing a spawn/`Agent` tool**, and the milestone's "introspective" nature (grugops references/recommends tools, never installs them into itself).

### v1.2 research (front-loads these guards — read before planning)
- `.planning/research/SUMMARY.md` — the recommendation to front-load all mechanical guards in the first phase so later phases write into a guarded environment; the WR-05 / no-deps / config-dial cross-cutting risks.
- `.planning/research/PITFALLS.md` § "Pitfall 1: WR-05 regeneration hazard" + the phase-ordering table — the spawn-re-arm hazard, the grep-guard mitigation, and the "guards before content" ordering rationale.
- `.planning/research/ARCHITECTURE.md` — the single-source §14 rule, the no-spawn/single-window constraint, and the note that `adapters.md`'s lingering `Agent` prose is tech debt (D-09 fixes it).

### Prior-phase decisions this phase keys off
- `.planning/phases/07-shared-home-foundation-path-rewrite/07-CONTEXT.md` — the kit-vs-state classification the guards must honor; the `check-kit-refs.sh` gate logic + explicit-scan-list discipline this phase's aggregator mirrors.
- `.planning/phases/08-two-root-installer/08-CONTEXT.md` — the materialization mechanism + the 2 materialized adapters (`.claude/skills/grugops/SKILL.md`, `.claude/agents/grugops-orchestrator.md`) the WR-05 guard scans; the 08-01 carry-forward that already dropped the `Agent` grant from both packaging templates.
- `.planning/phases/09-doctor-two-root-validator/09-CONTEXT.md` — the two-root validator structure + two-tier findings + `--strict` the new-key recognition (D-14) extends.

### Files this phase touches (anchors)
- `scripts/check-foundation-guards.sh` — **NEW** aggregator (D-04); model on `scripts/check-kit-refs.sh` (explicit scan list, POSIX, read-only, `pass()/fail()`, ships GREEN + fail-proof).
- `scripts/check-kit-refs.sh` — the template/precedent for the new aggregator (house style, explicit `SCAN` list, fail-on-mutation proof). Do NOT fold the new guards into it (least coupling).
- `scripts/validate-agent-factory.mjs` — add active-when-present / lenient-when-absent recognition of the 8 new keys (D-14); see `## Check 4: config parses` (lines ~280–300) where `mode`/`cadence`/`autonomy` are checked.
- `scripts/validate.test.sh` + `scripts/fixtures/` — the bad-fixture harness pattern for proving the validator/guards fail red.
- `agent-factory/config/factory.config.json` — add the 8 keys with lean defaults; rename `e2e_when`→`ui_e2e` (D-13/D-15).
- `agent-factory/config/factory.config.md` — add the 8 keys' rows + the "Enterprise escalation" contract column (D-11); rename `e2e_when`→`ui_e2e`.
- `agent-factory/seed/.grugops/factory.config.json` — byte-identical key additions + rename (D-15).
- `agent-factory/packaging/subagent.frontmatter.md`, `agent-factory/packaging/slash-command.template.md` — the WR-05 guard's template scan targets (already clean; the guard keeps them clean).
- `.claude/skills/grugops/SKILL.md`, `.claude/agents/grugops-orchestrator.md` — the WR-05 guard's materialized-adapter scan targets.
- `agent-factory/packaging/adapters.md` — **fix the stale spawn prose now** (D-09); not added to the guard scope.
- `AGENTS.md` — the byte-budget guard's target (currently 6,051 bytes, well under cap).
- Voice-lint surfaces: `agent-factory/roles/security-nfr.md`, `agent-factory/roles/compliance-officer.md`, `agent-factory/roles/incident-responder.md`, `agent-factory/checklists/`, `agent-factory/workflows/05-pr-quality-gate.md`, `agent-factory/workflows/13-incident.md`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/check-kit-refs.sh` — the direct template for the new aggregator: POSIX `#!/usr/bin/env sh`, `set -eu`, `printf` not `echo -e`, small named helpers, an explicit `SCAN` path list (never a repo-wide grep), portable grep flags only (`-r -n -l -E -F -q -v`; no `-P`/`-z`/`--include`), ships GREEN with a fail-on-mutation proof.
- `scripts/validate-agent-factory.mjs` — stdlib-only Node, read-only, no `package.json`, two-tier `errors[]`/`warnings[]` + `--strict` promotion; Check 4 already parses the config and asserts `mode`/`cadence`/`autonomy` — extend it for the 8 new keys (D-14).
- `scripts/validate.test.sh` + `scripts/fixtures/{good,bad-*}/` — the established way to prove a checker fails red (good fixture passes; bad fixtures fail). The new guards' fail-proof reuses this pattern.
- `agent-factory/config/factory.config.md` — the field-reference twin already documents allowed-values / default / meaning per key; D-11 extends it with the enterprise-escalation column.
- The three config files are already kept in sync (two JSON byte-identical; the `.md` twin documents them; `agent-factory/seed/.grugops/factory.config.json` is the installer's seed source) — the atomic three-file update (D-15) writes into this existing tri-file contract.

### Established Patterns
- **Ship GREEN + fail-on-violation proof** — a gate authored after the tree is clean ships passing but carries proof it fails red on a planted violation (`check-kit-refs.sh`). The current tree is already clean for all four guards (no spawn grant; AGENTS.md 6 KB; adapters pointer-sized; voice presumably clean), so GREEN-with-fail-proof is the natural fit.
- **Explicit scan lists, never repo-wide grep** — fixtures/, examples/, docs/, .planning/ all legitimately carry `agent-factory/` strings and `Agent`/spawn words; the guard must scan an explicit allowlisted set or it false-fails.
- **Two-tier findings + `--strict`** (validator) and **two-tier WARN→FAIL** (D-07 size guards) — consistent severity model across the gate.
- **Kit vs state classification** — guards scanning the kit resolve bare `agent-factory/…` as KIT; they must not treat seed/state templates as kit-resolution targets (the `check-kit-refs.sh` D-03 seed-exclusion comment explains why).

### Integration Points
- The guards run over grugops's **own repo** (maintainer/dev/CI side), not the end-user install — so requiring the dev to run a script is fine; this is distinct from the user-side POSIX install path (which is why D-05's POSIX choice and the held TS pivot both matter).
- The 8 new config keys are **consumed by later phases** (12 BDD/TDD, 14 security/ASVS, 15 gate convergence) — Phase 10 only creates them + the contract; the behavior they switch is wired downstream. Forward-compatibility of the enums (D-12) is therefore load-bearing.
- The §14 quality gate (`agent-factory/workflows/05-pr-quality-gate.md`) is where `quality.*` keys ultimately take effect (Phase 15, single-source) — Phase 10 must not fork gate logic into the guards.

</code_context>

<specifics>
## Specific Ideas

- **The "TypeScript pivot" moment:** asked which language for the guards, the user said "pivot to TypeScript and not use plain JS or SH anymore." This collides with documented hard constraints (POSIX install path; no npm deps; sh↔Node byte-parity) — Node here is v24.12.0, so native type-stripping makes zero-dep TS *technically* viable for new Node scripts, but a full pivot abandons the deliberate Node-free install path. The user chose to **HOLD** the pivot and ratify it separately as a project-level decision. Phase 10 proceeds in POSIX sh. (See Deferred Ideas.)
- **The WR-05 false-positive insight:** the templates/adapters were already cleaned of the spawn grant in Phase 8, but they still use the *word* "spawn" to explain the no-spawn rule. The guard must target the frontmatter tool-grant, not the prose — otherwise it fails red on the very files that correctly document the design (D-08).
- **The `adapters.md` contradiction:** `agent-factory/packaging/adapters.md` still says Claude Code "spawns role agents with the `Agent` tool" — a live contradiction of the frozen single-window decision and the user's standing "don't re-add the Agent tool" preference. Fixed now (D-09).
- **No double-ownership principle:** the user wants `ui_e2e` to replace `e2e_when` (one key per concept) rather than coexist, and wants `quality.lint` to complement (not duplicate) the existing `"lint"` in `mandatory_gates` (D-13).

</specifics>

<deferred>
## Deferred Ideas

- ⚑ **TypeScript pivot (project-level decision, HELD).** The user wants to "pivot to TypeScript and not use plain JS or SH anymore." This is bigger than Phase 10 and conflicts with CLAUDE.md hard constraints + REQUIREMENTS Out-of-Scope. Before acting it needs: a PROJECT.md + hard-constraint amendment; a decision on the **install path** (POSIX-sh portability — Node-free install — vs Node-as-prerequisite); a decision on the **sh↔Node byte-parity twin** (collapse to one TS impl?); a **Node baseline bump** (18+ → 22.18+/23.6+ for native type-stripping, zero-dep); and a scope choice (tooling-only TS keeping POSIX install, vs full pivot incl. installer). Likely warrants its own phase or a dedicated `/gsd-discuss`. **Do not smuggle it into Phase 10.**
- **GitHub Actions CI (`.github/`).** Held (D-06). The guard suite runs local-only for now; the aggregator stays CI-ready so a workflow can call it later.
- **Adding `adapters.md` (or other docs) to the WR-05 guard scope.** Not done (D-09); the guard stays at SC2's 2-templates + 2-adapters set. Doc-prose correctness is handled by the audit + the one-time `adapters.md` fix.
- **Wiring the behavior behind the 8 new keys** — BDD/TDD (Phase 12), frontend/UI (Phase 13), ASVS security audit (Phase 14), §14 gate convergence: lint step / UI-E2E / test-integrity (Phase 15). Phase 10 only seeds the keys + the contract.

</deferred>

---

*Phase: 10-SDLC-Coverage Audit & Foundation Guards*
*Context gathered: 2026-06-09*
