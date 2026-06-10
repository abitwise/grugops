# Phase 11: Senior Persona Overhaul - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Lay the senior-judgment substrate every later v1.2 content phase (12–17) builds on. Three jobs (PERS-01/02/03):

1. **Senior-persona rewrite (PERS-01)** — deepen all **16 role prompts** to senior judgment **in place** (long-term experience + forward-thinking). **No new section.** Senior judgment is woven into the existing skeleton sections; generic "what good looks like" quality lists are explicitly OUT (the model already carries that knowledge).
2. **Senior BA deepening (PERS-02)** — deepen `ba-pm.md` + workflow `07-backlog-refinement.md` to senior level: INVEST-shaped stories, explicit acceptance criteria, measurable NFRs, and a Definition of Ready that closes the business→engineer handoff. Single-sourced with `definition-of-ready.md` as the hub. **Prose quality only.**
3. **WR-05 retirement (PERS-03)** — the packaging-template spawn grant is already gone (Phase 8); verify the guard still passes after the rewrite (regen-safety) and **formally close the debt marker** in the tracking docs.

**The core constraint that shaped every decision:** the terse grug **caveman voice is grugops's token-economy mechanism** — compressed caveman prompts mean fewer output tokens, which matters as model costs rise. "Senior" therefore means **sharper judgment per token, not more prose.** The 16-role rewrite must keep role files flat-or-smaller, never bloated into verbose professional English.

**In scope:** the 16-role in-place senior rewrite; the senior BA deepening (role + workflow 07 + `definition-of-ready.md` hub); WR-05 verify + close-the-marker; three mechanical-guard changes (expand voice-lint to all 16 roles; new caveman-preserved guard; new role-file size ceiling) + their fail-proof tests; the ROADMAP/REQUIREMENTS wording reconciliation (already applied this session).

**Out of scope (later phases / do NOT pre-empt):**
- **Executable acceptance / BDD** — given-when-then as an executable contract, Three Amigos / Example Mapping step (audit GAP-1) → **Phase 12**. Phase 11 deepens acceptance **prose quality** only.
- **TDD double-loop** → Phase 12.
- **Frontend/UI persona** (`roles/frontend-ui.md`) + UI workflow → **Phase 13** (Phase 11's `UI hint` is `no` — markdown role-prompt work, no visual UI).
- **Security ASVS / gate convergence** → Phases 14/15.
- **Expanding any role's responsibilities / adding capabilities** — the rewrite elevates persona + voice, NOT scope. New capabilities are their own phase.

**Already locked upstream (carry forward, do NOT re-decide):**
- **Single-window sequential role-load — NO spawn tool** (D-08, Phases 7/8). The design, not debt to reverse. Re-adding an `Agent`/`Task` grant is Out-of-Scope (REQUIREMENTS.md).
- **Two-voice discipline** — grug caveman in the `## Caveman prompt` block (and punchy throughout the body); clear voice in security/compliance/safety/escalation lines.
- **Single-source** — persona depth lives once under `agent-factory/`; per-tool adapters stay pointer-sized (they don't copy role bodies, so the rewrite doesn't touch them).
- **Kit vs state split**, **markdown-only kit / stdlib-only POSIX-sh scripts / no npm deps**, **no fabrication** (`UNKNOWN - verify`).
- **Guard house style** (`scripts/check-foundation-guards.sh` / `check-kit-refs.sh`): POSIX sh, `set -eu`, `printf` not `echo -e`, explicit SCAN lists never repo-wide grep, portable grep flags only, ships GREEN + a fail-on-mutation proof harness.

</domain>

<decisions>
## Implementation Decisions

### PERS-01 — the senior rewrite mechanism (Area 1)
- **D-01:** **No new section.** The original "What good looks like / When to escalate" section is NOT added. Senior judgment is deepened **in place** inside the existing skeleton sections (`One job`, `Responsibilities`, `Hard limits`, etc.). Rationale: the model already carries generic quality knowledge; enumerating it is low-value boilerplate that bloats every file. The value is a **sophisticated persona**, not a checklist.
- **D-02:** **Holistic top-to-bottom rewrite of each of the 16 roles** so each reads as a senior practitioner with **long-term, hard-won experience AND forward thinking** (anticipates downstream consequences). Not a narrow hard-limits-only tweak.
- **D-03:** **Bound — elevate persona + voice, NOT the contract.** Each rewrite preserves: the role's single `One job` (no new capabilities — scope creep belongs in other phases), the `## Caveman prompt` grug block, the contract sections (`Output` / `Board moves` / `Trace updates`), single-source pointer discipline, kit-vs-state refs, and the `Follow the 12 coding rules in AGENTS.md` footer.
- **D-04 (★ core constraint, phase-level):** **Terse caveman voice = grugops's token-economy mechanism.** Seniority is encoded in **compression** (sharper judgment per token), never expansion. The rewrite keeps role files roughly **flat or smaller**; a verbose rewrite that bloats tokens is a failure, mechanically caught by D-07.

### Mechanical protections (Area 2) — all extend the Phase 10 aggregator `scripts/check-foundation-guards.sh` + its fail-proof harness
- **D-05:** **Expand the voice-lint guard to all 16 roles.** Add every role to the guard's scan set (it strips the single fenced `## Caveman prompt` block, then greps the clear-voice remainder for caveman markers). Preserve the word-boundary EREs (e.g. `\bgrug\b`) that avoid false positives like `.grugops/`. Makes the amended SC1 mechanically true across the whole rewrite.
- **D-06:** **New guard — caveman-preserved (positive inverse).** Assert every role file still has a **non-empty `## Caveman prompt` block containing ≥1 caveman marker** — so the senior rewrite cannot sand the grug voice off. Directly protects "caveman voice needed."
- **D-07:** **New guard — role-file size ceiling.** A two-tier WARN→FAIL byte/line ceiling **per role file**, mirroring Phase 10's adapter-size guard, so a bloated rewrite fails red. Mechanically enforces "senior but still terse" (the D-04 token-economy goal).

### PERS-02 — senior BA deepening (Area 3)
- **D-08:** **Extend existing files; `definition-of-ready.md` is the hub.** Weave INVEST + measurable-NFR gates into the DoR (the single home); deepen `ba-pm.md` persona judgment and `07-backlog-refinement.md` ceremony; role + workflow **point to** the DoR (no duplication). **No new checklist file** — matches the existing pointer pattern (`ba-pm.md` already reads `definition-of-ready.md`).
- **D-09:** **Prose quality only — the Phase 12 boundary.** Phase 11 sharpens the BA layer as PROSE judgment: INVEST-shaped stories, acceptance criteria that are testable + measurable, measurable NFRs, DoR rigor. It **keeps** the DoR's existing `Given/When/Then` prose line but does **NOT** add Three Amigos, Example Mapping, executable-or-absent wiring, or selector-free scenario files — all **Phase 12 (BDD-02)**. Clean audit GAP-2 (P11) vs GAP-1 (P12) split; no behavior double-owned. (Both phases touch workflow 07 — Phase 12 *adds* the Three Amigos substep on top of this senior BA layer.)

### PERS-03 — WR-05 retirement scope (Area 4)
- **D-10:** **Verify + close the marker.** The `Agent` spawn grant was already dropped from both packaging templates in Phase 8 and the WR-05 guard already passes. Phase 11: (a) confirm frontmatter is spawn-free, (b) **re-run the WR-05 guard AFTER the 16-role rewrite** (regen-safety), (c) **update the tracking docs to mark it retired** — PROJECT.md `⚠️ Revisit`→retired, STATE.md tech-debt entry→closed, the SDLC audit observation→resolved, the RETROSPECTIVE note. **Keep the correct explanatory "spawn" prose** (it documents *why* there is no spawn tool; the guard intentionally allows it, D-08). Token-economy discipline targets *role prompts* loaded every session — not packaging templates that maintainers/installers read — so there's no reason to trim correct prose.

### Success-criteria reconciliation (consequence of D-01)
- **D-11:** **ROADMAP.md SC1 + REQUIREMENTS.md PERS-01 wording amended this session** (user-directed) so the phase verifier checks the real bar (persona deepened, grug preserved, verified by the three guards) rather than the obsolete "section exists." Also flipped Phase 11 `UI hint: yes → no` (no visual UI) and added a context-note pointer. The verifier must read the amended criteria.

### Claude's Discretion (planner/researcher to lock)
- **Size-ceiling thresholds (D-07):** exact byte/line numbers. Set so the rewrite stays **roughly flat** over current sizes (small headroom — enforce "re-sharpen in place," not "expand"). The Orchestrator role is legitimately the largest; prefer a **per-file-relative** ceiling (current size + small %) or a single ceiling set above the current largest, NOT a flat number that punishes orchestrator. Keep deterministic + documented.
- **Caveman-marker set for the preserved-block check (D-06):** which markers count as "still grug" (reuse / align with the existing `VOICE_MARKERS` list).
- **Voice-lint false-positive sweep (D-05):** after the rewrite, confirm no legitimate clear-voice prose in any of the 16 roles trips a marker; tune the marker ERE only if a real false-positive surfaces (don't weaken the guard).
- **Senior-rewrite depth per role:** how the long-term-experience + forward-thinking judgment lands in each role's specific sections — bounded by D-03 (no scope change) and D-04 (no bloat).
- **DoR INVEST/NFR phrasing (D-08):** the exact terse checklist lines added to `definition-of-ready.md` and how `ba-pm.md` / workflow 07 reference them.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements, roadmap & milestone scope (authoritative — note: amended this session)
- `.planning/ROADMAP.md` § "Phase 11: Senior Persona Overhaul" — the **amended** goal + 4 success criteria (SC1 rewritten to the no-section persona-deepening mechanism + the three verifying guards; SC2 single-source/prose-only note; SC3 close-the-marker; `UI hint: no`).
- `.planning/REQUIREMENTS.md` § "Senior Personas" — **PERS-01** (amended: in-place senior deepening, no section, terse caveman = token economy, verified by 3 guards), **PERS-02** (senior BA: INVEST, measurable NFRs, DoR closes the handoff), **PERS-03** (no spawn grant, WR-05 retired). Also § "Out of Scope" — no npm deps; no re-introducing a spawn/`Agent` tool.

### The audit this phase closes
- `.planning/v1.2-SDLC-COVERAGE-AUDIT.md` § GAP-2 (senior-judgment persona layer + deep BA → Phase 11) and § "The business→engineer handoff (named focus)" — GAP-2 is Phase 11; GAP-1 (executable acceptance contract) is Phase 12. Confirms the prose-only boundary (D-09).

### v1.2 research (read before planning)
- `.planning/research/PITFALLS.md` § "Pitfall 1: WR-05 regeneration hazard" — why the rewrite must re-run the WR-05 guard (D-10) so a regeneration doesn't silently re-arm spawn.
- `.planning/research/ARCHITECTURE.md` — the no-spawn / single-window constraint; the single-source rule the rewrite must not violate.

### Prior-phase decisions this phase keys off
- `.planning/phases/10-sdlc-coverage-audit-foundation-guards/10-CONTEXT.md` — D-10 (voice-lint design: section-scoped, strips the `## Caveman prompt` block, `\bgrug\b` word-boundary, curated surfaces — **forward-compatible with this phase, D-05 extends it**); D-04/D-07 (guard aggregator house style + two-tier WARN→FAIL the new role-size guard mirrors); the ship-GREEN-+-fail-proof pattern.
- `.planning/phases/08-two-root-installer/08-CONTEXT.md` — the 08-01 carry-forward that already dropped the `Agent` grant from both packaging templates (so D-10 is verify-not-rewrite).

### Files this phase touches (anchors)
- `agent-factory/roles/*.md` — **all 16** role files, in-place senior rewrite (D-01/D-02/D-03/D-04): `agents-md-scribe`, `architect-design`, `ba-pm`, `brownfield-mapper`, `compliance-officer`, `factory-coach`, `greenfield-mapper`, `incident-responder`, `installer`, `orchestrator`, `qe-e2e`, `release-manager`, `security-nfr`, `software-engineer`, `system-analyst`, `uat-planner`. (`_role-switch-protocol.md` is the protocol, not a persona — not part of the 16.)
- `agent-factory/roles/ba-pm.md` — additionally the senior BA deepening (D-08).
- `agent-factory/workflows/07-backlog-refinement.md` — senior BA ceremony deepening, points to the DoR hub (D-08); leave room for Phase 12's Three Amigos substep (D-09).
- `agent-factory/checklists/definition-of-ready.md` — the INVEST + measurable-NFR hub (D-08); keep terse.
- `scripts/check-foundation-guards.sh` — expand `guard_voice` scan set to all 16 roles (D-05); add `guard_caveman_preserved` (D-06) and `guard_role_size` (D-07).
- `scripts/check-foundation-guards.test.sh` — extend the fail-proof harness: plant a sanded-caveman role (D-06 fails red) and a bloated role (D-07 fails red), plus the expanded voice scan.
- `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/v1.2-SDLC-COVERAGE-AUDIT.md`, `.planning/RETROSPECTIVE.md` — close the WR-05 debt marker (D-10).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **The 16-role skeleton is uniform** — `One job → ## Caveman prompt (fenced) → Reads → Activates when → Responsibilities → Output → Board moves → Trace updates → Hard limits → AGENTS.md footer`. The rewrite works within this fixed skeleton (no structural change).
- **`scripts/check-foundation-guards.sh` `guard_voice`** already does the hard part: an awk strip of the single fenced `## Caveman prompt` block, then a markered grep of the clear-voice remainder, with `\bgrug\b` word-boundary handling. D-05 just extends `VOICE_FILES`; D-06 is its positive inverse (assert the block exists + has a marker); both reuse the `pass()/fail()` + explicit-SCAN house style.
- **`guard_adapter_size`** (two-tier WARN→FAIL, byte-based) is the direct template for the new `guard_role_size` (D-07).
- **`scripts/check-foundation-guards.test.sh`** — the hermetic mirror-and-mutate fail-proof harness; add a sanded-caveman fixture and an oversized-role fixture.
- **`definition-of-ready.md`** is already a terse bullet checklist that `ba-pm.md` and `07-backlog-refinement.md` both point to — the natural single-source hub for the INVEST/NFR gates (D-08).
- **`product-handoff.md`** handoff template already carries `## Acceptance criteria (Given/When/Then)`, `## Security/NFR triggers`, `## Size estimate`, `## Priority` — the senior BA prose deepening rides these existing fields (no new fields needed; executability is Phase 12).

### Established Patterns
- **Ship GREEN + fail-on-violation proof** — the new guards are authored after the rewrite is clean; they ship passing but carry a planted-violation proof that they fail red.
- **Two-voice discipline** — grug in the `## Caveman prompt` block + punchy body; clear voice in safety/security/escalation lines. The rewrite deepens judgment without breaking either voice.
- **Single-source / pointer adapters** — adapters don't copy role bodies, so the 16-role rewrite does NOT touch `.claude/**` adapters; the single-source adapter check stays green (SC4) for free.

### Integration Points
- The guards run over grugops's **own repo** (maintainer/dev side), POSIX sh, no new deps — same as Phase 10.
- The senior BA layer (D-08/D-09) is the **substrate Phase 12 builds on** — Phase 12's Three Amigos + executable scenarios sit on top of the INVEST/measurable-NFR/DoR rigor landed here. Keep the seam clean (no executability in Phase 11).
- Every later content phase (12–17) authors role/workflow prose into the now-senior, now-guarded substrate — which is why this phase is the milestone's substrate layer.

</code_context>

<specifics>
## Specific Ideas

- **The reframing moment (Area 1):** asked how to structure the new section, the user redirected — *"Senior role can be just the persona, make sure the persona is sophisticated enough, no need to list what looks good and what not as the model has this data."* This killed the enumerated section in favor of in-place persona deepening (D-01). They then chose a **top-to-bottom rewrite** reflecting *"a senior role with long-term experience, but someone with forward thinking."*
- **The core-idea statement (Area 2) — the most load-bearing input:** *"Caveman voice is needed, seniority for roles doesn't mean the main idea of grugops should be removed, the main idea is to reduce output token usage as costs are rising. Expand it to all 16 roles, but make sure to keep the core idea intact."* This elevated terse-caveman-voice-as-token-economy to a hard phase constraint (D-04) and motivated both new guards (D-06, D-07).
- **No-bloat, mechanically enforced:** the user picked BOTH the caveman-preserved check AND the role-file size ceiling — they want the core idea protected by code, not convention.
- **Single-source preference (Area 3):** DoR as the one hub; no new file; role + workflow point to it.
- **Honest trace (SC reconciliation):** the user chose to amend ROADMAP + REQUIREMENTS now rather than let the verifier check stale wording — keep the source of truth truthful.

</specifics>

<deferred>
## Deferred Ideas

- **Executable acceptance contract** (given-when-then as runnable, Three Amigos / Example Mapping, executable-or-absent) — **Phase 12 (BDD-01/02)**. Phase 11 stops at prose quality (D-09).
- **TDD double-loop** at the unit layer — **Phase 12 (TDD-01/02)**.
- **Frontend/UI senior persona** (`roles/frontend-ui.md`) + UI design→build workflow — **Phase 13**.
- **Leveled security (ASVS) + un-cheatable gate** (lint / UI-E2E / test-integrity) — **Phases 14/15**.
- **TypeScript pivot (project-level decision, HELD).** Still held per Phase 10's deferral; Phase 11 stays POSIX sh for the guard changes. Do not smuggle it in.
- **Generic "what good looks like" quality enumeration** — explicitly rejected for role files (D-01); the model already carries it.

None of the above is unowned — each maps to a named later phase or a standing held decision.

</deferred>

---

*Phase: 11-Senior Persona Overhaul*
*Context gathered: 2026-06-10*
