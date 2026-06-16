# Architecture Research

**Domain:** grugops v1.2 — integrating SDLC-depth, quality-discipline & docs capabilities into an existing markdown agent-factory kit
**Researched:** 2026-06-09
**Confidence:** HIGH (grounded in the actual `agent-factory/` tree; external anchors ASVS 5.0 + Playwright verified MEDIUM/HIGH)

> This is an *integration* architecture study, not a greenfield system design. grugops ships **no runtime** — the deliverable is markdown plus two byte-parity install scripts and one Node validator. Every recommendation below is therefore expressed as "which existing file-type gets a NEW file vs a MODIFIED file," plus the data-flow (handoff/trace) and config-dial changes that wire them together. The standard "boxes/services/DB" template is reinterpreted accordingly.

---

## Standard Architecture

### System Overview — the kit's file-type layers (what v1.2 touches)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ENTRY / DISPATCH  (single-source rule: content lives ONCE, adapters point)│
│  AGENTS.md  •  .claude/ adapters  •  plugin form  •  per-tool pointers      │
│  → v1.2 touches AGENTS.md command slots (lint/e2e) ONLY; adapters unchanged │
├──────────────────────────────────────────────────────────────────────────┤
│  ROLES  agent-factory/roles/*.md   (16 today; sequential role-load, no spawn)│
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ orchestr.  │ │ ba-pm      │ │ software-  │ │ qe-e2e     │ │ security-│ │
│  │ (router)   │ │ (+BDD/sr.) │ │ engineer   │ │ (+UI/E2E)  │ │ nfr      │ │
│  │            │ │            │ │ (+TDD/sr.) │ │            │ │ (+ASVS)  │ │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └────┬─────┘ │
│        │  + NEW: frontend-ui.md (senior FE/UI persona)            │       │
├────────┴──────────────┴──────────────┴──────────────┴────────────┴───────┤
│  WORKFLOWS  agent-factory/workflows/*.md   (14 today)                       │
│  04 ticket-to-pr (+TDD)  •  05 PR-quality-gate (§14: +lint +UI/E2E +no-skip)│
│  06 uat-pack (+BDD)  •  02/03 idea→epics / epic→tickets (+BDD carry)         │
│  + NEW: 14-ui-design-to-build.md  •  + NEW: 15-security-audit.md            │
├────────────────────────────────────────────────────────────────────────────┤
│  CONTRACTS  handoffs/ (templates → plans/handoffs instances) • checklists/  │
│  product-handoff (+BDD)  • impl-ready (+TDD strategy)  • qe-handoff (+UI/E2E)│
│  security-nfr-handoff (+ASVS findings)  • DoR/DoD (+lint/no-skip)            │
│  + NEW: security-nfr-checklist anchored to ASVS  • + NEW: accessibility tie  │
├────────────────────────────────────────────────────────────────────────────┤
│  STATE PLANE  plans/board.md • plans/traceability.md • plans/metrics.md     │
│  → trace row gains BDD-scenario / ASVS-level / lint+UI-E2E evidence columns │
│    (additively, via comment-documented convention — NOT a schema rename)    │
├────────────────────────────────────────────────────────────────────────────┤
│  DIAL  .grugops/factory.config.json  (+ byte-twin factory.config.md)        │
│  → NEW keys: bdd, tdd, asvs_level, lint{}, ui_e2e, gate_enforcement tier    │
├────────────────────────────────────────────────────────────────────────────┤
│  PACKAGING / INSTALL  install.sh + install.mjs (byte-parity, two-root)      │
│  → NEW modes: --update (refresh shared kit) • --migrate (move state forward)│
├────────────────────────────────────────────────────────────────────────────┤
│  DOCS CATALOG  (NEW)  scripts/build-docs-catalog.mjs → docs/catalog/*.md    │
│  → reads frontmatter+headings across roles/+workflows/; generated-not-hand  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities (how each v1.2 capability lands per file-type)

| Capability | NEW files | MODIFIED files | Wiring (dial / handoff / trace) |
|------------|-----------|----------------|---------------------------------|
| SDLC-coverage audit & gap-fix | audit report (planning artifact, not shipped kit) | feeds every persona/workflow change below | none directly — it *informs* the others; run FIRST |
| Senior persona overhaul | — | all 16 `roles/*.md` (judgment depth, esp. `ba-pm.md`); skeleton gains a "What good looks like / When to escalate" section | no dial change; voice discipline preserved (caveman prompt stays, clear-voice senior heuristics added) |
| BDD (given-when-then) | — | `ba-pm.md`, `uat-planner.md`, workflows 02/03/06; `product-handoff.md`, `uat-handoff.md` | dial `bdd` (off/lean/strict); BDD scenarios carried in product→impl handoff + UAT |
| TDD (red-green) | — | `software-engineer.md`, `qe-e2e.md`, workflow 04; `implementation-ready-packet.md` test-strategy | dial `tdd` (off/encouraged/required); evidence in qe-handoff |
| Senior frontend/UI persona | `roles/frontend-ui.md` | `orchestrator.md` routing matrix + classification list; `README.md` role catalog | new routing target "Need UI build → Frontend/UI" |
| UI design→build workflow | `workflows/14-ui-design-to-build.md` | `orchestrator.md` workflow map; README | feeds ticket-to-pr; produces a UI handoff instance |
| Automated UI/E2E (Playwright) in gate | — | workflow 05 (§14) step 3 gate sequence; `qe-handoff.md` UI/E2E section | dial `ui_e2e` + existing `quality.e2e_when` |
| Security audit (OWASP ASVS) | `workflows/15-security-audit.md`; ASVS-anchored rewrite of `security-nfr-checklist.md` | `security-nfr.md`, `compliance-officer.md`; `security-nfr-handoff.md` | dial `asvs_level` (L1 lean → L2/L3 enterprise); ASVS findings in trace |
| Test-integrity (no-skip) gate | — | workflow 05 (§14) gate; DoD + DoD-enterprise; `software-engineer.md` + `qe-e2e.md` hard limits | dial `gate_enforcement` tier (warn/block); justified-skip escape hatch documented in handoff |
| Lint gate step | — | workflow 05 (§14) step 3; AGENTS.md Lint command slots (already present, fill recommendations); DoD | dial `lint{}` (strictness, autofix); already in `mandatory_gates` |
| Browsable docs catalog | `scripts/build-docs-catalog.mjs` + `docs/catalog/` output | every `roles/*.md` + `workflows/*.md` frontmatter (ensure `kind`/`tier`/`order` complete) | validator extension can assert catalog freshness |
| Install migrate/update | — | `install/install.sh` + `install/install.mjs` (byte-parity); `uninstall.sh` unaffected | new `--update` / `--migrate` modes, additive to the flag parser |

---

## Recommended Project Structure (deltas only — additive to today's tree)

```
agent-factory/
├── roles/
│   ├── frontend-ui.md                    # NEW — senior FE/UI persona (17th role)
│   └── (16 existing roles MODIFIED in place — senior judgment + new skeleton section)
├── workflows/
│   ├── 14-ui-design-to-build.md          # NEW — design→build flow, feeds ticket-to-pr
│   ├── 15-security-audit.md              # NEW — ASVS-anchored audit flow
│   ├── 04-ticket-to-pr.md                # MOD — TDD red-green step + UI handoff input
│   ├── 05-pr-quality-gate.md             # MOD — §14 gains lint + UI/E2E + no-skip
│   ├── 06-uat-pack.md                    # MOD — BDD given-when-then acceptance
│   ├── 02-idea-to-epics.md / 03-...      # MOD — BDD scenarios carried in acceptance
├── handoffs/
│   ├── product-handoff.md                # MOD — BDD scenarios block (already has G/W/T line)
│   ├── implementation-ready-packet.md    # MOD — TDD test-first strategy
│   ├── qe-handoff.md                     # MOD — UI/E2E + test-integrity (skip log) section
│   ├── security-nfr-handoff.md           # MOD — ASVS level + control-by-control findings
│   └── uat-handoff.md                    # MOD — BDD scenario → UAT mapping
├── checklists/
│   ├── security-nfr-checklist.md         # MOD — re-anchor controls to ASVS 5.0 L1/L2/L3
│   ├── definition-of-done.md             # MOD — lint pass + no-unjustified-skip lines
│   └── definition-of-done-enterprise.md  # MOD — ASVS-level + UI/E2E + block-tier lines
├── config/
│   ├── factory.config.json               # MOD — new keys (byte-twin of seed)
│   └── factory.config.md                 # MOD — field reference rows for new keys
└── seed/.grugops/factory.config.json     # MOD — same new keys (seed source of truth)

scripts/
└── build-docs-catalog.mjs                # NEW — generates docs/catalog/ from frontmatter

docs/
└── catalog/                              # NEW (generated) — browsable role+workflow index
    ├── index.md
    ├── roles.md
    └── workflows.md

install/
├── install.sh                            # MOD — add --update / --migrate modes
└── install.mjs                           # MOD — byte-parity twin of the same modes
```

### Structure Rationale

- **`roles/frontend-ui.md` as a 17th sibling, not a fork of software-engineer:** the kit already treats each persona as a single-job file on the same skeleton (`One job / Caveman prompt / Reads / Activates when / Responsibilities / Output / Board moves / Trace updates / Hard limits`). A UI persona is a new specialist the Orchestrator routes to, exactly like QE/E2E — it must register in the routing matrix and classification list, nothing more.
- **NEW workflows numbered 14/15** to continue the existing `00–13` ordinal convention (frontmatter `order:`); they slot *after* the lifecycle/ceremony set so existing numbers never renumber (a renumber would ripple through every Orchestrator workflow-map reference — avoid it).
- **Gate changes stay inside workflow 05 only.** §14 is single-source: every other workflow *references* `05-pr-quality-gate.md` rather than restating the loop. Adding lint/UI-E2E/no-skip steps to step 3 of 05 propagates everywhere for free and keeps the single-source rule intact.
- **Config changes touch THREE files in lockstep** (`config/factory.config.json`, `config/factory.config.md` byte-twin reference, `seed/.grugops/factory.config.json` seed source). These must stay consistent or the validator/installer drift; treat them as one atomic edit unit.
- **Docs catalog is generated into `docs/catalog/`, never hand-edited.** The generator reads frontmatter + the first heading block of each role/workflow file. This is the only place a *script* (not markdown) grows in v1.2 besides the installer modes.

---

## Architectural Patterns

### Pattern 1: Single-source §14 gate extension (add steps, never fork)

**What:** New gate steps (lint, UI/E2E, test-integrity) are added to the ordered list in `05-pr-quality-gate.md` step 3, and the bounded-self-fix contract (step 4) wraps the *whole expanded* sequence unchanged.
**When to use:** Every quality capability that must run before a human reviews a PR.
**Trade-offs:** Keeps one source of truth (every other workflow references 05); risk is bloating step 3 — mitigate by keeping each new step a single ordered line that defers detail to the config dial + a checklist.

**Example (the modified gate order — step 3 of workflow 05):**
```text
3. Run the gate in order:
     install → lint → typecheck → unit → build → ui-e2e → e2e
   - lint: from AGENTS.md Lint slots; strictness from config `lint.strict`
   - ui-e2e: Playwright visual/flow check when config `ui_e2e=on` AND (UI changed OR e2e_when matches)
   - test-integrity: no unjustified skipped/`.only` tests; a skip is allowed ONLY with a
     documented justification recorded in the qe-handoff skip log (never fake a pass)
   Unknown command → `UNKNOWN - verify`. mandatory_gates must pass.
4. Bounded self-fix: `self_fix_attempts` (default 2) wraps the ENTIRE expanded sequence —
   two rounds then human. Unchanged contract.
```

**Bounded-self-fix preservation (the load-bearing detail):** the new steps must be *gate checks the self-fix loop can attempt to satisfy*, not new infinite-loop surfaces. A failed lint or a missing UI/E2E assertion is a normal gate failure → counts against the same `self_fix_attempts` budget → after two rounds, terminal `BLOCKED_NEEDS_FIX`. A test-integrity violation (unjustified skip) is also a gate failure, not a special case. This keeps the three terminal results (`READY_FOR_HUMAN_REVIEW` / `BLOCKED_NEEDS_FIX` / `SPLIT_REQUIRED`) intact.

### Pattern 2: Config-dialed depth (lean default, enterprise escalates) for every new capability

**What:** Each new capability reads a key from `.grugops/factory.config.json` and degrades to a sensible lean default when absent — matching the existing `mode/cadence/autonomy` and `quality.*` pattern (every role "reads the config first").
**When to use:** BDD depth, TDD requirement, ASVS level, lint strictness, UI/E2E on-off, gate enforcement tier.
**Trade-offs:** Honors zero-config-first (solo users get lean automatically); the cost is more config surface — mitigate by grouping under existing objects (`quality`, `nfr`) where it fits rather than adding top-level sprawl.

**Example (proposed config keys — additive; lean values shown):**
```json
{
  "quality": {
    "coverage_threshold": 0.8,
    "self_fix_attempts": 2,
    "mandatory_gates": ["lint", "typecheck", "unit", "build"],
    "e2e_when": "ui-or-critical-path",

    "tdd": "encouraged",            // off | encouraged | required  (lean: encouraged; enterprise: required)
    "lint": { "strict": false, "autofix": true },   // lean warn-only; enterprise strict
    "ui_e2e": "ui-or-critical-path",// off | ui-or-critical-path | always  (Playwright visual/flow)
    "test_integrity": "warn",       // warn | block  (block = unjustified skip fails the gate)
    "gate_enforcement": "warn"      // warn | block  (lean warns on soft gates; enterprise blocks)
  },
  "bdd": "lean",                    // off | lean | strict  (G/W/T at acceptance + UAT)
  "security": {
    "asvs_level": "L1"              // L1 | L2 | L3  (lean L1; enterprise L2/L3, dialed)
  }
}
```
> `UNKNOWN - verify`: exact nesting (under `quality` vs top-level) is a design choice for the roadmap — recommendation is to **nest gate-execution knobs under `quality`** (they govern the gate) and keep **`bdd`/`security.asvs_level` top-level** (they govern lifecycle stages, not just the gate). Whatever is chosen, the byte-twin `factory.config.md` field table and the `seed/` copy MUST gain matching rows in the same edit.

### Pattern 3: 9-section skeleton + ONE new section ("What good looks like / When to escalate")

**What:** Today's role files share a consistent heading set: `One job`, `Caveman prompt`, `Reads`, `Activates when`, `Responsibilities`, `Output (file + format)`, `Board moves`, `Trace updates`, `Hard limits`. The senior-persona overhaul adds **one** new section to the skeleton across all 16 (and the new 17th): a clear-voice **"What good looks like / When to escalate"** block.
**When to use:** Every role file, applied uniformly so the skeleton stays a skeleton.
**Trade-offs:** A new mandatory section is a kit-wide rewrite (16 files) — but it is the cleanest way to encode "senior judgment" without bloating the caveman prompt or muddying voice discipline (caveman prompt stays terse; senior heuristics live in clear voice in the new section, consistent with the existing clear-voice exceptions for safety/security/money).

**Example (the added skeleton section):**
```markdown
## What good looks like / When to escalate
Clear voice. Senior judgment for this role.
- Good: <2–4 concrete signals a senior would check for this role's output>
- Smell: <what a junior misses that this role must catch>
- Escalate (STOP, hand to human): <the decision/safety boundaries this role must not cross>
```

### Pattern 4: Generated docs catalog (script reads frontmatter, never hand-maintained)

**What:** A stdlib-only Node script (`scripts/build-docs-catalog.mjs`, mirroring the existing `validate-agent-factory.mjs` style) walks `agent-factory/roles/*.md` and `agent-factory/workflows/*.md`, parses YAML frontmatter (`kind`, `tier`, `order`, `cadence`) plus the first `# Role:`/`# Workflow:` heading and the `One job`/`When to use` line, and emits `docs/catalog/{index,roles,workflows}.md`.
**When to use:** Run as the LAST build step of v1.2 (documents the finished set) and re-run whenever role/workflow files change.
**Trade-offs:** A script is non-markdown surface (kept minimal, stdlib-only, no deps — consistent with the "boring on purpose" constraint). Staying generated-not-hand-maintained means the validator can assert freshness (regenerate to a temp file, diff against committed output → fail on drift), exactly like `check-kit-refs.sh` fails on mutation.

**Example (generation contract):**
```text
build-docs-catalog.mjs:
  read agent-factory/roles/*.md   → frontmatter(kind,tier) + "# Role: X" + "## One job" line
  read agent-factory/workflows/*.md → frontmatter(order,cadence) + "# Workflow: X" + "## When to use"
  write docs/catalog/roles.md (table), workflows.md (ordered table), index.md (links)
  --check mode: regenerate to /tmp, diff vs committed → nonzero on drift (validator hook)
```

### Pattern 5: Additive install modes (never delete-first, reversible, byte-parity)

**What:** `--update` (refresh the shared read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}` to a newer version, leaving per-repo state untouched) and `--migrate` (move/transform existing per-repo state forward to a new schema without clobbering user content) extend the existing flag parser in both `install.sh` and `install.mjs`.
**When to use:** Folded-in MIGR-01 / UPD-01 story.
**Trade-offs:** The two-root model already separates kit (overwritable on update) from state (never clobbered) — `--update` re-copies the kit atomically; `--migrate` only *adds* new config keys / moves files and writes a backup first. Must hold byte-parity between the sh and Node twins (the project's existing hard invariant; the flag parser already has `--target/--yes/--check/--symlink/--allow-self` to extend).

---

## Data Flow

### Handoff-contract flow (how new evidence travels role→role)

```
BA/PM ──product-handoff(+BDD given/when/then)──▶ Orchestrator
   │                                                  │
   │                                          impl-ready-packet(+TDD test-first strategy)
   ▼                                                  ▼
Frontend/UI ──ui-handoff(design intent, components, a11y)──▶ Software Engineer
                                                            │ (TDD red→green)
                                                            ▼
                                                 implementation-handoff
                                                            │
                                                            ▼
QE/E2E ──qe-handoff(+UI/E2E results, +skip-justification log)──▶ Security/NFR
                                                                      │
                                                  security-nfr-handoff(+ASVS level, control-by-control)
                                                                      ▼
                                                                 UAT Planner
                                                  uat-handoff(BDD scenario → UAT case mapping)
```

### Traceability extensions (additive, comment-documented — NOT a column rename)

The trace matrix header is **frozen** (`| Ticket | Title | Epic | Feature | NFRs | Code | Tests | UAT | Release | Status |`) and the seed file's FORMAT comment says columns must not be renamed/reordered. So v1.2 must extend trace **additively**, three options ranked:

1. **(Recommended) Encode new evidence inside existing cells via a documented convention** — e.g. the `Tests` cell records UI/E2E + skip count (`fx.spec.ts, e2e/fx (ui-e2e ✓, skips:0)`); the `NFRs` cell records ASVS level (`NFR-002, ASVS-L2`); BDD scenario IDs link from the ticket's product handoff. Update the seed FORMAT comment to document the convention. Zero header churn → no ripple to the validator's column self-test.
2. Add new *optional* trailing columns (`BDD`, `ASVS`, `Lint/UI-E2E`) — cleaner data but breaks the "do not add columns" comment and forces a validator + every-row-shape update.
3. A side ledger (`plans/asvs-findings.md`, `plans/bdd-scenarios.md`) — keeps the matrix clean but fragments the trail (anti-pattern; the whole value prop is one trail).

> Recommendation: **Option 1** for lean (no schema churn), with Option 2 reserved for `mode=enterprise` if auditors demand discrete columns. Flag for the roadmapper to confirm.

### Key data flows

1. **BDD carry-through:** Given/When/Then scenarios authored by BA/PM in `product-handoff.md` (the template already has a `## Acceptance criteria (Given/When/Then)` line) flow → impl-ready packet → become QE test cases → map 1:1 to UAT cases in `uat-handoff.md`. This is the explicit **business→engineer gap-fix**: the acceptance scenarios are the contract that crosses the gap.
2. **ASVS finding flow:** the security-audit workflow (15) and the in-line Security/NFR gate both record findings against ASVS controls at the dialed level; findings land in `security-nfr-handoff.md` and (per the trace convention) the `NFRs` cell.
3. **Gate-evidence flow:** lint / UI-E2E / test-integrity results are emitted by the gate (workflow 05) into `qe-handoff.md` and the `metrics.md` `Gate pass rate`; never fabricated, `UNKNOWN - verify` when a command slot is unfilled.

---

## Scaling Considerations (kit-scale, not user-load)

| Scale | Kit adjustments |
|-------|-----------------|
| Solo / zero-config | Everything degrades to lean defaults: `bdd=lean`, `tdd=encouraged`, `asvs_level=L1`, `lint.strict=false`, `gate_enforcement=warn`, `ui_e2e` follows `e2e_when`. No config file required. |
| Team / `mode=lean` explicit | Lint warns, UI/E2E on UI paths, BDD at acceptance, test-integrity warns. "Bug the user as little as needed" — stops only at real gates. |
| Enterprise / `mode=enterprise` | `gate_enforcement=block`, `test_integrity=block`, `tdd=required`, `asvs_level=L2/L3`, lint strict, UI/E2E always; DoD-enterprise enforces the superset. |

### Scaling priorities

1. **First pressure point: config sprawl.** Adding 6+ keys risks an unreadable dial. Group under `quality` where they govern the gate; keep the byte-twin `.md` table authoritative.
2. **Second: skeleton-rewrite blast radius.** The new role section touches all 16 files — sequence it as a single dedicated phase so the rewrite is reviewable as one diff, not smeared across feature phases.

---

## Anti-Patterns

### Anti-Pattern 1: Forking gate logic into the new workflows

**What people do:** Restate the lint/UI-E2E/no-skip loop inside `14-ui-design-to-build.md` or `15-security-audit.md`.
**Why it's wrong:** Breaks the single-source §14 rule; the gate would drift across files (the exact failure mode the project's WR-05/D-08 notes warn about).
**Do this instead:** New workflows **reference** `05-pr-quality-gate.md` for the gate, exactly as 04 does today.

### Anti-Pattern 2: Re-introducing a spawn tool for the UI persona

**What people do:** Give the Orchestrator an `Agent`/spawn tool to "run" the frontend persona or a Playwright sub-agent.
**Why it's wrong:** Violates the frozen single-window sequential role-load decision (D-08); the kit must stay portable across all 5 CLIs where sub-agent nesting is unavailable. The packaging templates already carry a regeneration hazard (WR-05) — do not deepen it.
**Do this instead:** The Frontend/UI role activates via `_role-switch-protocol.md` like every other role — one window, drop prior context, handoff is the only memory. Playwright runs as a **gate command** (CLI), not a spawned agent.

### Anti-Pattern 3: Copying senior/BDD/ASVS prose into the per-tool adapters

**What people do:** Paste the new persona depth or BDD steps into `.claude/` adapters or the plugin form "so each tool has it."
**Why it's wrong:** Breaks the single-source constraint ("role text lives once; adapters are thin pointers"). Five copies drift.
**Do this instead:** All new content lands in `agent-factory/` once; adapters keep pointing. Only `AGENTS.md` command slots (Lint/E2E) may gain real commands — and that is single-source too.

### Anti-Pattern 4: Faking a green gate to satisfy the new steps

**What people do:** Mark lint/UI-E2E "passed" when the command slot is `UNKNOWN`, or silently skip a flaky test.
**Why it's wrong:** Destroys the trace, which is the entire value prop; directly violates the no-fabrication constraint and the test-integrity gate's own intent.
**Do this instead:** `UNKNOWN - verify` for unfilled command slots; a skip is allowed only with a documented justification logged in the qe-handoff skip log; never fake a pass.

### Anti-Pattern 5: Hand-maintaining the docs catalog

**What people do:** Write `docs/catalog/*.md` by hand and update it when a role changes.
**Why it's wrong:** Drifts immediately; defeats the "generated reference" goal.
**Do this instead:** Generate from frontmatter via the script; add a validator freshness check (regenerate-and-diff) so drift fails CI.

---

## Integration Points

### "External services" (the capabilities grugops gives its USERS — not grugops's own deps)

| Capability | Integration pattern | Notes |
|------------|--------------------|-------|
| OWASP ASVS 5.0 | Anchor the security-nfr checklist + audit workflow to ASVS control families; dial the level L1→L3 | ASVS **5.0.0** (May 2025) rebalanced L1 to a lower entry bar — good fit for "lean L1". Levels are supersets (L3⊇L2⊇L1). Confidence MEDIUM-HIGH. |
| Playwright (UI/E2E) | A **gate command** in AGENTS.md E2E slot, run by the gate (CLI, headless in CI) | Playwright runs headless by default and is the project's `default_stack.e2e` already. Run it as a CLI gate step, NOT an MCP sub-agent (keeps no-spawn + portability). Confidence HIGH. |
| Per-stack linters | AGENTS.md Lint slots (already present, currently `UNKNOWN`) + per-stack recommendations | The Lint command slots already exist in AGENTS.md; v1.2 fills recommendations and wires the gate step. No new files. |

### Internal boundaries (which file-types may reference which)

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Roles ↔ workflows | Roles named in workflow "Agents involved"; activation via `_role-switch-protocol.md` only | New FE/UI role + 2 new workflows must register here; no inlined steps. |
| Workflows ↔ gate (§14) | Reference `05-pr-quality-gate.md`, never restate | Single-source invariant. |
| Roles/workflows ↔ config | Read `.grugops/factory.config.json` first; lean fallback when absent | New keys must have documented lean defaults. |
| Handoffs (template KIT) ↔ instances (STATE) | Read template from `agent-factory/handoffs/`, write instance to `plans/handoffs/<ID>-<stage>.md` | Kit-vs-state invariant; new handoff sections are edits to TEMPLATES only. |
| Docs catalog ↔ source | Generated one-way from roles/+workflows/ frontmatter | Never the reverse; never hand-edited. |
| Install modes ↔ two roots | `--update` rewrites kit root; `--migrate` transforms state root (backup-first) | Never delete-first; byte-parity sh/Node. |

---

## Suggested Build Order (phases, dependency-honoring)

> Rationale: audit FIRST (it scopes everything), persona/skeleton rewrite BEFORE the workflows that lean on senior judgment, gate-step additions AFTER the workflows/personas that feed them, docs catalog LAST (it documents the finished set), install modes parallel/independent.

1. **Phase A — SDLC-coverage audit & gap-fix scope.** Review all 16 roles + 14 workflows for lifecycle completeness; produce the gap report (esp. business→engineer). *Informs every later phase; ships little kit code.* No dependencies.
2. **Phase B — Skeleton + senior-persona overhaul.** Add the "What good looks like / When to escalate" section to the role skeleton; rewrite all 16 roles to senior depth; deepen `ba-pm.md` most. *Depends on A.* One reviewable kit-wide diff.
3. **Phase C — Config dial extension.** Add the new keys to all three config files (json + .md twin + seed) with lean defaults. *Depends on B's decisions about which capabilities are dialed; precedes every capability that reads them.*
4. **Phase D — BDD + TDD wiring.** Modify BA/PM + UAT + engineer + QE roles and workflows 02/03/04/06 + the product/impl-ready/qe/uat handoff templates to carry given-when-then and red-green. *Depends on B (senior personas) + C (dial keys).*
5. **Phase E — Frontend/UI persona + UI design→build workflow.** NEW `roles/frontend-ui.md`, NEW `workflows/14-ui-design-to-build.md`, register in Orchestrator routing/classification + README. *Depends on B (skeleton) + C.*
6. **Phase F — Security audit (ASVS) + checklist re-anchor.** NEW `workflows/15-security-audit.md`, ASVS-anchored `security-nfr-checklist.md`, modify `security-nfr.md` + `compliance-officer.md` + `security-nfr-handoff.md`. *Depends on B + C.*
7. **Phase G — §14 gate-step additions (lint + UI/E2E + test-integrity).** Modify ONLY `05-pr-quality-gate.md` step 3/4, DoD + DoD-enterprise, AGENTS.md command slots. *Depends on D/E/F — the gate steps consume the BDD tests, the UI flow, and the ASVS posture those phases produce.* This is the convergence point; do it after its feeders exist.
8. **Phase H — Install --update / --migrate.** Extend both installers, byte-parity, additive/reversible. *Independent — can run in parallel with B–G; no dependency on the kit-content phases.*
9. **Phase I — Browsable docs catalog (LAST).** NEW `scripts/build-docs-catalog.mjs` + generated `docs/catalog/`; validator freshness check. *Depends on ALL kit-content phases (B–G) being final so it documents the finished set.*

**Traceability/handoff data-flow changes are introduced incrementally:** product-handoff BDD block in D; qe-handoff UI/E2E + skip-log in G; security-nfr-handoff ASVS findings in F; trace-cell convention update (Option 1) spans D/F/G and is documented in the seed FORMAT comment.

---

## Constraints the roadmapper MUST carry forward (explicit reminders)

- **Single-source rule:** new persona/BDD/ASVS/UI content lives ONCE in `agent-factory/`; the 5 per-tool adapters stay thin pointers — never copy content into them. Only AGENTS.md command slots (Lint/E2E) gain real commands, and that is single-source too.
- **No-spawn / single-window:** the new Frontend/UI role and Playwright UI/E2E run within the sequential role-load model (`_role-switch-protocol.md`) and as CLI gate commands respectively — never via an `Agent`/sub-agent spawn. Do not re-add a spawn tool (the packaging templates' lingering `Agent` prose is existing tech debt WR-05, not a license).
- **Config-dial / zero-config-first:** every new capability reads `.grugops/factory.config.json` first and degrades to a documented lean default when absent. Edit the json + `.md` twin + `seed/` copy as one atomic unit.
- **Two-root / additive install:** `--update` (kit root) and `--migrate` (state root) are additive, reversible, never delete-first, and byte-parity across `install.sh`/`install.mjs`.
- **No-fabrication:** unfilled commands → `UNKNOWN - verify`; skips only with documented justification; never fake a gate/test/citation.
- **Voice discipline:** caveman prompt stays terse; senior heuristics and security/ASVS findings are clear voice.
- **Frozen ordinals:** new workflows are 14/15; do not renumber 00–13 (it ripples through every Orchestrator workflow-map reference).

---

## Sources

- grugops repo (read directly): `agent-factory/roles/*.md`, `workflows/05-pr-quality-gate.md` + `04-ticket-to-pr.md`, `config/factory.config.{json,md}`, `handoffs/*`, `checklists/*`, `seed/plans/traceability.md`, `_role-switch-protocol.md`, `AGENTS.md`, `.planning/PROJECT.md`, `install/install.sh` (HIGH — primary)
- [OWASP ASVS (project)](https://owasp.org/www-project-application-security-verification-standard/) + [OWASP/ASVS GitHub](https://github.com/OWASP/ASVS) — ASVS 5.0.0 (May 2025), L1/L2/L3 superset levels, L1 rebalanced lower (MEDIUM-HIGH)
- [Playwright](https://playwright.dev/) + [Playwright coding-agents docs](https://playwright.dev/docs/getting-started-cli) — headless-by-default, CLI for CI, agentic testing (HIGH)
- [Playwright MCP vs CLI for AI agents (Test-Lab.ai)](https://www.test-lab.ai/blog/playwright-mcp-vs-cli-agentic-testing) — CLI vs MCP token tradeoff; supports the "gate command not spawned agent" recommendation (MEDIUM)

---
*Architecture research for: grugops v1.2 SDLC-depth/quality-discipline integration*
*Researched: 2026-06-09*
