# Phase 14: Security Audit (OWASP ASVS) & Checklist Re-Anchor - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Give grugops a leveled, evidence-backed security posture. Three deliverables (SEC-01/02/03):

1. **A new security-audit workflow** — `agent-factory/workflows/15-security-audit.md` (workflow number **15**; 14 is taken by `14-ui-design-to-build.md`), anchored to OWASP ASVS 5.0, registered in the Orchestrator workflow map **without renumbering 00–14**.
2. **The security/NFR checklist re-anchored to ASVS 5.0** — `agent-factory/checklists/security-nfr-checklist.md` rewritten to ASVS 5.0 chapters with L1/L2/L3 tags and requirement IDs, **generated** from the pinned ASVS 5.0.0 source (not hand-transcribed); every "pass" cites evidence or reads `UNKNOWN - verify`.
3. **Behavior behind the already-shipped security dials** — wire `security.asvs_level` (L1→L2→L3) and `security.block_on` (none/low/medium/high) into the audit + gate; all security findings in clear professional voice, proven by an extended voice-lint guard.

**In scope:** workflow 15, the re-anchored checklist + its generator + pinned source, severity-mapping rule, voice-guard extension, Orchestrator/README workflow-map registration.

**Out of scope (other phases):** the gate-convergence work itself (lint/UI-E2E/test-integrity → Phase 15), install migrate/update (Phase 16), browsable docs catalog (Phase 17). This phase does **not** modify the gate's pass/fail mechanics beyond reading `security.block_on`.
</domain>

<decisions>
## Implementation Decisions

### Checklist generation (SEC-02 — "not hand-transcribed")
- **D-01:** Generate via **vendored source + committed generator**. Commit three artifacts: (a) the pinned official ASVS 5.0.0 source data (OWASP JSON/CSV at a pinned tag/sha), (b) a stdlib-only Node generator `scripts/generate-asvs-checklist.mjs` that emits the markdown, (c) the generated checklist. Reproducible in-repo and auditable — "not hand-transcribed" is provably honored because source + generator both live in the tree.
- **D-02:** The generated checklist carries a **provenance header** (pinned ASVS version + source tag/sha + "generated — do not hand-edit; re-run `generate-asvs-checklist.mjs`").
- **D-03:** Generator obeys the tech-stack constraint: **POSIX-sh or stdlib Node only, no TypeScript** (TS pivot is HELD pending project ratification — see carried-forward locks). Match the existing `scripts/validate-agent-factory.mjs` style (Node 18+, `node:fs`/`node:path`, ESM, zero deps).

### Checklist scope & fate of the existing checklist (SEC-02)
- **D-04:** **Re-anchor `security-nfr-checklist.md` in place** (do not create a parallel file). Every role/handoff that already references this path keeps working unchanged.
- **D-05:** Ship the **FULL ASVS 5.0 set**, every item tagged **L1/L2/L3** with its **requirement ID**. `security.asvs_level` filters the **active tier at read/audit time** (L1 lean default → L2 → L3). The dial is a read-time filter — the file is not regenerated when the dial changes.

### Workflow 15 shape & how block_on reaches the gate (SEC-01, SEC-03)
- **D-06:** Workflow 15 is a **standalone deep ASVS audit** — orchestrator-routed as a **new `security-audit` classification**, run by the **Security/NFR role** on-demand / per-phase / per-milestone. It is **distinct from** the lightweight per-ticket Security/NFR check that already runs in the `In Security/NFR` column.
- **D-07:** Workflow 15 **emits severity-tagged findings**; **`security.block_on` is read at `05-pr-quality-gate.md`** to decide which severities block. **Audit produces, gate enforces** — enforcement stays at the single visible gate (consistent with D-12 from Phase 12). Workflow 15 does not self-block.
- **D-08:** Workflow 15 follows the **`14-ui-design-to-build.md` pattern**: reference sibling workflows (esp. `05-pr-quality-gate.md`) **by filename**, never restate their loops.

### Severity assignment for findings (SEC-03 — connects ASVS levels to block_on severities)
- **D-09:** **Default-from-level + named override.** Default mapping: **L1 fail → high, L2 fail → medium, L3 fail → low** (failing a baseline control is more severe). The auditor **MAY override** a finding's severity with a **stated reason + named owner** — reusing the role's existing "an accepted risk needs a named owner" hard limit. Mechanical default keeps `block_on` predictable; the override is the honest escape hatch for edge cases.

### Voice-lint guard scope (SEC-03)
- **D-10:** Extend the existing **voice-discipline guard in `scripts/check-foundation-guards.sh`** to assert clear professional voice on the security surfaces: **`workflows/15-security-audit.md`, the re-anchored `security-nfr-checklist.md`, the `security-nfr` role body, and the `security-nfr` handoff template.**
- **D-11:** **Carve-out:** the guard **skips the role's fenced ` ```Caveman prompt``` ` block** — that is an agent prompt and stays caveman by the voice-split rule. Everything else on a security surface is clear voice.

### Reconciliation note (D-04/D-05 × D-06) — for the planner
The re-anchored `security-nfr-checklist.md` is the **single source of truth**. At L1 (lean default) the active subset *is* the ASVS L1 requirements — that is exactly what the lightweight per-ticket Security/NFR check works through, so "lean per-ticket" and "full checklist" are not in tension. Workflow 15 (the deep audit) walks the **same checklist** at the **full configured level** and produces the formal severity-tagged audit artifact that feeds `block_on`. One checklist; two depths of use; one produces a gate-feeding report.

### Claude's Discretion
- Exact filename/heading layout of `15-security-audit.md` and the generator's output formatting, within the patterns above.
- Whether the pinned ASVS source is committed as CSV or JSON (research picks based on what the official repo ships cleanly) — D-01 only requires it be pinned + in-repo.
</decisions>

<carried_forward>
## Locked by Earlier Phases — DO NOT Re-Decide

- **Security dial keys already ship (Phase 10).** `security.asvs_level` (L1/L2/L3, default L1) and `security.block_on` (none/low/medium/high, default high) already exist, byte-identical, in `agent-factory/config/factory.config.json`, the seed config, and the contract doc `factory.config.md` (lines 98–99). **This phase wires their behavior; it does not add or rename keys.**
- **Gate is referenced by filename, never "§14" (Phase 12, D-12).** Shipped artifacts cite the visible `agent-factory/workflows/05-pr-quality-gate.md`. The ROADMAP's "§14 gate" phrasing is internal narration — **do not write "§14" into any shipped file.**
- **New scripts = POSIX sh or stdlib Node, not TypeScript.** The TS pivot is HELD pending project-level ratification.
- **Voice split (Phase 11).** Clear professional voice for security/compliance/money/legal/docs; caveman voice only in role-prompt fences. The voice guard already covers all 16 roles.
- **Workflow numbering.** New file is `15-security-audit.md`; register it in **both** `agent-factory/roles/orchestrator.md` (classification→workflow map, ~lines 91–111) and `agent-factory/README.md` (the command/workflow map) — **without renumbering 00–14**.
</carried_forward>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 14 section (goal, depends-on Phase 10 dials + Phase 11 skeleton, success criteria).
- `.planning/REQUIREMENTS.md` — SEC-01, SEC-02, SEC-03 (lines ~50–52).

### The artifacts being re-anchored / extended (re-anchor in place)
- `agent-factory/checklists/security-nfr-checklist.md` — the 10-bullet lean checklist this phase **rewrites in place** to the full ASVS 5.0 set.
- `agent-factory/roles/security-nfr.md` — the role that runs both the per-ticket check and workflow 15; body must pass the extended voice guard; its "accepted risk needs a named owner" hard limit is reused by D-09.
- `agent-factory/handoffs/security-nfr-handoff.md` — handoff template the role fills; in the voice-guard scope (D-10).
- `plans/nfr-catalog.md` — NFR budgets the role checks performance/reliability against (adjacent, not security-finding surface).

### Config dials (already shipped — wire behavior, do not add keys)
- `agent-factory/config/factory.config.md` §"Config-dial contract" (lines 88–99) — `security.asvs_level` and `security.block_on` allowed values + lean→enterprise escalation.
- `agent-factory/config/factory.config.json` (lines 48–51) — the live `security` block; mirrored in `agent-factory/seed/.grugops/factory.config.json`.

### Workflow registration & gate wiring
- `agent-factory/roles/orchestrator.md` — classification→workflow-file map (~lines 91–111); add a `security-audit` row + the `Need risk/security` routing line (~line 59) already present.
- `agent-factory/README.md` — the workflow/command map (~lines 84–113); must stay consistent with the orchestrator map.
- `agent-factory/workflows/05-pr-quality-gate.md` — the gate workflow 15 references by filename; the point where `security.block_on` enforces.
- `agent-factory/workflows/14-ui-design-to-build.md` — **precedent pattern**: references sibling workflows 04/05 by filename instead of restating them; workflow 15 mirrors this.

### Mechanical guard
- `scripts/check-foundation-guards.sh` — the POSIX-sh guard aggregator (4 guards today: WR-05 spawn-grant grep, adapter-size, AGENTS.md byte budget, voice-discipline lint); D-10 extends the voice-discipline guard to security surfaces.
- `scripts/check-foundation-guards.test.sh` — the guard's fail-proof harness; add cases proving the new surfaces fail-red on a voice regression.
- `scripts/validate-agent-factory.mjs` — the stdlib-Node script pattern the new generator follows.

### External (research must pin — `UNKNOWN - verify`)
- **OWASP ASVS 5.0.0 official source** — exact repo, pinned tag/sha, and artifact format (CSV vs JSON of all requirements with IDs + L1/L2/L3 tags). Phase researcher pins this before planning; `UNKNOWN - verify` until confirmed.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/validate-agent-factory.mjs` — zero-dep, stdlib Node 18+ ESM; copy its structure for `generate-asvs-checklist.mjs`.
- `scripts/check-foundation-guards.sh` + `.test.sh` — the voice-discipline guard already exists and runs over the 16 roles; D-10 is an *extension* of an existing guard, not a new one.
- `security.{asvs_level,block_on}` keys already present in all three config files — no schema change needed.
- The role's "accepted risk needs a named owner" hard limit — the override mechanism for D-09 already has a home.

### Established Patterns
- **Reference-don't-restate** (`14-ui-design-to-build.md`): name sibling workflows by filename; workflow 15 must follow this for the gate.
- **Single-source gate naming** (D-12): cite `05-pr-quality-gate.md`, never `§14`.
- **Dial = read-time filter, lean default when absent** (Phase 10 contract): `asvs_level` filters the full tagged checklist at audit time.
- **Generated-not-hand-edited + provenance header** — new pattern for this repo; the Phase 17 browsable-docs catalog will be a sibling generated artifact (don't build for it now, but keep the generator pattern clean).

### Integration Points
- Orchestrator classification map + README map — register `security-audit`/workflow 15.
- `05-pr-quality-gate.md` — reads `security.block_on` against workflow 15's severity-tagged findings.
- The voice guard in `check-foundation-guards.sh` — new file globs added for the security surfaces, with the caveman-fence carve-out.
</code_context>

<specifics>
## Specific Ideas

- Severity default table is explicit and inverted from intuition on purpose: **L1 fail = high** (a missing baseline control is the most dangerous), L2 = medium, L3 = low.
- Generator + pinned source must make the "not hand-transcribed" claim *checkable*, not asserted — the provenance header + committed source are the proof.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Gate-convergence mechanics → Phase 15; browsable docs generation → Phase 17; install migrate/update → Phase 16.)
</deferred>

---

*Phase: 14-security-audit-owasp-asvs-checklist-re-anchor*
*Context gathered: 2026-06-13*
