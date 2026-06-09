# Feature Research

**Domain:** Agentic SDLC delivery kit (markdown role prompts + workflows + checklists + config dial + quality gate) — v1.2 "SDLC Depth, Quality Discipline & Browsable Docs"
**Researched:** 2026-06-09
**Confidence:** HIGH on practices (OWASP ASVS 5.0, double-loop BDD/TDD, Three Amigos, flaky-test quarantine, Playwright visual regression are well-documented industry standards). MEDIUM on exact mapping to grugops's lean→enterprise dial (a design choice, not a verifiable external fact).

> **Framing.** grugops ships NO runtime — only markdown. Every "feature" below is something grugops ENCODES as role-prompt text, workflow steps, checklist items, handoff fields, or a `factory.config.json` knob. Read "feature" as "a senior practice grugops makes its agents perform." The two-voice rule applies: grug caveman voice in role prompts; clear professional English in security/compliance/money/legal sections.

---

## Existing baseline (what grugops already has — confirmed by reading the kit)

This milestone **deepens**, it does not invent. Confirmed present today:

- **Given/When/Then already lives in Definition of Ready** and in the BA/PM responsibilities (`agent-factory/checklists/definition-of-ready.md`, `agent-factory/roles/ba-pm.md`). BDD acceptance is a *deepening* target, not greenfield.
- **The §14 backpressure quality gate** (`agent-factory/workflows/05-pr-quality-gate.md`) already runs `install → lint → typecheck → unit → build → e2e`, honors `quality.mandatory_gates` / `coverage_threshold` / `self_fix_attempts` / `e2e_when`, emits one of three terminal verdicts, and already records `UNKNOWN - verify` rather than faking a pass. Test-integrity + visual-regression + lint-as-first-class are *additions to this existing loop*.
- **The config dial** (`agent-factory/config/factory.config.json`) already carries `quality.{coverage_threshold, self_fix_attempts, mandatory_gates, e2e_when}`, `nfr.{a11y_target=WCAG-2.2-AA, perf_p95_ms, availability}`, `compliance_regime[]`, `mode: lean`. New knobs hang off these.
- **16 roles + 14 workflows + 11 checklists + 16 handoff templates** exist. `security-nfr-checklist.md` is only **10 one-line items** today — far below ASVS. `ba-pm.md` is ~48 lines and shallow. `accessibility-checklist.md` exists. **No frontend/UI role and no UI-build workflow exist yet** (greenfield for this milestone).
- **Traceability** (`plans/traceability.md`), **board** (`plans/board.md` with WIP limits), **handoff packets** (`plans/handoffs/<TICKET-ID>-<stage>.md`), **NFR catalog** (`plans/nfr-catalog.md`) are the existing seams every new feature must plug into.

---

## Feature Landscape

### Table Stakes (Users Expect These)

A disciplined senior delivery kit is incomplete without these. Missing = the kit feels junior.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **BDD acceptance contract = the business→engineer handoff** (Given/When/Then scenarios, business language, one behavior per scenario, declarative not imperative, concrete example values) | This is the literal artifact that bridges BA→engineer; without it "acceptance criteria" stays vague prose | MEDIUM | Deepen the existing G/W/T in DoR. Add a `## Acceptance scenarios (Given/When/Then)` block to the **product handoff** template; one scenario = one row in traceability. Owner: BA/PM drafts, **Three Amigos refines**, QE/E2E owns automation. |
| **TDD red-green-refactor at the unit layer** | The inner loop every senior engineer runs; the unit-level proof behind each scenario | MEDIUM | Encode as engineering-role workflow steps: write failing unit test → minimal code → green → refactor. The outer BDD scenario stays red until the inner loop closes it (double-loop). |
| **OWASP ASVS-anchored security audit checklist** (17 chapters: encoding/sanitization, validation/business-logic, web-frontend, API, file-handling, authentication, session, authorization, tokens, OAuth/OIDC, crypto, secure-comms, configuration, data-protection, secure-coding/architecture, logging/error-handling, WebRTC) | "Security review" with no standard behind it is theater; ASVS 5.0 is the de-facto verification standard | HIGH | Rewrite the 10-line `security-nfr-checklist.md` into an ASVS-anchored, leveled checklist. L1 lean → L2/L3 enterprise. Cite requirement IDs (`v5.0.0-6.x.x`). |
| **States coverage for UI: loading / empty / error / success / partial-data** | "API error and empty state tests are the most commonly missed states" — a senior frontend build always covers all five | MEDIUM | New frontend role + UI-build workflow checklist. Each component build must enumerate all 5 states before "done." |
| **Accessibility baked into the UI build, not bolted on** (semantic HTML, keyboard nav + visible focus, labels/errors readable by AT, contrast, no color-only signals, target sizes) | WCAG-2.2-AA is already the `nfr.a11y_target` default; an inaccessible component is a functional outage for a user segment | MEDIUM | `accessibility-checklist.md` exists — wire it into the UI workflow's done-condition and into the gate (axe-core run). |
| **Automated E2E + visual regression in the gate** (Playwright `toHaveScreenshot()`, axe-core a11y assertions) | Automated UI verification is standard; visual regression catches unintended pixel drift | HIGH | Add to the existing §14 gate after `build`. Gated by `e2e_when`. Visual baselines stored in-repo. |
| **Test-integrity gate: no unjustified skips, never fake a pass** | Without it, an agent can green a gate by skipping/deleting tests — destroying the trace, grugops's whole value prop | MEDIUM | The gate already records `UNKNOWN - verify`. Add: enumerate skipped/quarantined tests, require a documented justification per skip, fail the gate on any *unjustified* skip. |
| **Lint as a first-class gate step with per-stack linters** | `lint` is already in `mandatory_gates`; users expect concrete recommended linters per language | LOW | Already a gate step. Add a per-stack linter recommendation table (ESLint/Biome for TS, ruff for Python, etc.) and a `UNKNOWN - verify` fallback. |
| **INVEST-shaped stories + measurable, testable NFRs in Definition of Ready** | NFRs forgotten until production is "the cause of IT project failure"; senior BAs put NFRs *in* the DoR | MEDIUM | Extend DoR: each story Independent/Negotiable/Valuable/Estimable/Small/Testable; NFRs must name unit of measure + success/failure thresholds (cite `plans/nfr-catalog.md`). |
| **Senior-grade personas** (judgment, trade-off reasoning, explicit when-to-escalate, "what good looks like") across BA / product / architecture / engineering / QE / security | The milestone's headline; junior personas "consult before choosing," senior personas "decide and justify, escalate at the right boundary" | MEDIUM | Add a `## Judgment & escalation` and `## What good looks like` section to each role's 9-section skeleton. Senior = reasons about 6-months-from-now consequences, names trade-offs, knows the escalation boundary. |
| **Definition of Ready (entry gate) ⟷ Definition of Done (exit gate) both enforced** | Both checklists exist; seniors gate *entry* (DoR) and *exit* (DoD), not just exit | LOW | Both files exist. Make the business→engineer handoff explicitly assert DoR-pass, and the gate assert DoD-pass. |

### Differentiators (Competitive Advantage)

Where grugops can be visibly more senior/trustworthy than a bare coding-agent CLI or a generic "AI dev" wrapper.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Double-loop BDD↔TDD as an explicit, non-conflicting workflow** (outer acceptance loop owned by QE/business; inner unit loop owned by engineer; ONE failing acceptance test at a time; inner loop runs in minutes, outer in days) | Most kits conflate BDD and TDD or pick one. grugops can show them layered: the BDD scenario is the contract and the *outer red*; TDD closes it from the inside. No conflict — they operate at different layers and timescales. | MEDIUM | This is the headline of the test-first theme. Diagram two concentric loops in the workflow. Rule: "no second failing acceptance test until the first is green." |
| **Three Amigos ceremony as a named refinement step** (business/product + engineer + QE collaborate to turn a story into scenarios; product decides scope, QE generates edge cases, engineer adds detail; Example Mapping over premature Gherkin) | Turns the business→engineer handoff from throw-over-the-wall into a 3-perspective conversation that produces the acceptance contract; closes the #1 handoff gap | LOW–MEDIUM | Fold into `07-backlog-refinement.md`. Lean: a checklist the BA self-runs (plays all three voices). Enterprise: a real ceremony with named participants. Use Example Mapping (rules/examples/questions) before writing Gherkin. |
| **Test-integrity escape hatch that can't become a rubber stamp** (every skip/quarantine needs: a reason, a named owner, a tracking ticket ID, and an expiry date; expired skips fail the gate; quarantined tests run in a non-blocking lane, not deleted) | "A flaky test without a named owner and a fix-by date sits in quarantine forever." The escape hatch is real but bounded — it forces accountability and decay, so skipping is never free. | MEDIUM | A skip is legitimate only with all four fields. Record them in the QE handoff + traceability. The gate counts `unjustified_skips` and fails on > 0; counts `expired_skips` and fails on > 0. This is the anti-rubber-stamp mechanism. |
| **Mutation-testing-aware coverage honesty** (note that line coverage is gameable — 100% with zero assertions is possible; recommend mutation testing where the stack supports it; QE asserts behavior, not lines) | Directly counters the "AI agent games the coverage number with assertion-free tests" failure mode; makes the `coverage_threshold` meaningful | LOW (as guidance) / HIGH (to mandate) | Lean: a QE-role caution + "tests must assert behavior, not just execute lines." Enterprise: recommend a mutation-testing step (Stryker/PIT/etc.) where available, `UNKNOWN - verify` otherwise. Do NOT mandate a runtime grugops can't ship. |
| **Leveled security audit dialed to the config** (ASVS L1 = lean default ≈ first-layer defenses; L2 = standard/enterprise ≈ ~70% of ASVS; L3 = highest-assurance/regulated) tied to `mode` + `compliance_regime` | One flag scales security depth from solo-builder-sane to regulated-audit-grade — the core grugops promise applied to security | MEDIUM | `mode: lean` → ASVS L1 subset; `mode: enterprise` → L2; `compliance_regime` non-empty → push toward L3 + threat modeling (ASVS V15). Clear voice throughout security findings. |
| **Senior frontend persona + design-contract→build→states→a11y workflow** | grugops has no UI role today; a senior frontend flow (design tokens/contract → component build → all 5 states → a11y → visual baseline) is a clean differentiator and threads "bug the user as little as needed" (defaults over prompts) | HIGH | New role `frontend-engineer.md` (or extend `software-engineer.md`) + new workflow `ui-design-to-build.md`. The design contract can be a Pact-style/consumer-driven contract for the API the UI consumes. |
| **Browsable in-repo docs catalog** (generated markdown reference of every agent + workflow, cross-linked, no web UI) | Discoverability of a 16-role / 14-workflow kit without leaving the boundary; "what does each grug do?" answered from a generated index | LOW–MEDIUM | A generator (extend the existing Node validator pattern, stdlib-only) reads role/workflow frontmatter + One-job lines and emits `docs/catalog/`. Stays markdown, stays inside the boundary. |
| **"Bug the user as little as needed" as an encoded automation principle** (sensible defaults, stop only at genuine decision/safety gates, fewer human checkpoints — merge/deploy hard limit unchanged) | The UX of the whole kit; differentiates from kits that prompt the human at every step | LOW (it's policy text) | Encode as an Orchestrator principle: prefer config defaults, auto-advance through green gates, surface a human only at (a) a real decision/trade-off, (b) a safety gate (merge/deploy), or (c) an exhausted self-fix budget. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Mandate 100% test coverage** | "More coverage = safer" | Line coverage is the easiest metric to game; 100% is achievable with zero assertions; encourages assertion-free vanity tests, exactly the AI-agent failure mode | Keep `coverage_threshold` (0.8) as a floor, add "tests must assert behavior"; recommend mutation testing where the stack allows; never present a coverage number as proof of correctness |
| **Auto-retry flaky tests until green in the main pipeline** | "Make CI stop failing" | "Use retries to unblock, not to close the ticket" — silent retries hide real failures and turn the gate into a rubber stamp; you end up with a test you've silently deleted | Retry only in a separate non-blocking quarantine lane; require a justified-skip record (reason/owner/ticket/expiry) to remove from the blocking gate; quarantine ≠ delete |
| **Full ASVS L3 by default for everyone** | "Maximum security" | L3 is defense-in-depth + hard-to-implement controls meant for the highest-assurance apps; forcing it on a solo builder taxes them and produces ignored checklists (the thing zero-config-first forbids) | Dial it: L1 lean default, L2 enterprise, L3 only when `compliance_regime` demands; ASVS itself says "most apps should strive for L2" |
| **Write all Gherkin during the requirements workshop** | "Capture scenarios immediately" | "Experienced teams leave the actual Given-When-Then until after the workshop" — writing syntax live is slow and distracts from real business needs | Example Mapping (rules/examples/open-questions) in the conversation; a pair writes the Gherkin afterward; product reviews |
| **Full-page visual-regression screenshots for everything** | "Catch every UI change" | Full-page snapshots are flake magnets (timestamps, ads, fonts, animations, dynamic IDs) and produce noisy diffs that train people to ignore failures | Component-level screenshots > full-page (test-pyramid for snapshots); mask dynamic content; fix viewport/browser; use `maxDiffPixels`/`threshold`; a handful of full-page + many component-level |
| **A web dashboard / docs site for the catalog** | "Nicer to browse" | grugops is explicitly file-and-prompt, not a platform; a web UI crosses the boundary and is out of scope per PROJECT.md | Generated cross-linked **markdown** under `docs/catalog/`, browsable in any editor/GitHub |
| **A separate "BDD scenario runner" runtime bundled in grugops** | "BDD needs Cucumber" | grugops ships no runtime; bundling one breaks the markdown-only constraint | Recommend the host project's BDD tooling (Cucumber/Behave/SpecFlow/Playwright-BDD) via `AGENTS.md` command slots; `UNKNOWN - verify` if absent; grugops supplies the *scenarios and discipline*, the project supplies the runner |
| **Let the agent self-approve a justified skip** | "Reduce friction" | Self-justified skips are how the escape hatch becomes a rubber stamp; the agent can rationalize anything | Justification is allowed, but the gate still fails on *unjustified or expired* skips, and the human PR review sees the skip ledger; for safety-relevant skips, surface to the human (same pattern as the prod-deploy hook — agent proposes, human disposes) |

## Feature Dependencies

```
SDLC-coverage audit (opens the milestone)
    └──informs──> Senior persona overhaul
                      └──requires──> 9-section role skeleton (exists)
                      └──produces──> BA persona depth
                                         └──requires──> Three Amigos step in refinement
                                                            └──produces──> BDD acceptance scenarios (business→engineer contract)
                                                                               └──drives (outer loop)──> TDD red-green (inner loop)
                                                                               └──automated by──> QE/E2E
                                                                                                      └──runs in──> §14 quality gate (exists)

§14 quality gate (exists: lint→typecheck→unit→build→e2e)
    ├──adds──> Test-integrity step (no unjustified/expired skip)
    │              └──requires──> skip ledger fields (reason/owner/ticket/expiry) in QE handoff + traceability
    ├──adds──> Visual regression + axe a11y (Playwright)
    │              └──requires──> UI build flow producing components with all 5 states + a11y
    │                                 └──requires──> Senior frontend persona + ui-design-to-build workflow (NEW)
    └──adds──> Lint-per-stack recommendations (lint step exists)

Security audit workflow + ASVS checklist
    └──reads──> factory.config (mode + compliance_regime) to pick L1/L2/L3
    └──runs in──> §14 gate's Security/NFR slot (exists)
    └──feeds──> plans/nfr-catalog.md + security-nfr handoff (exist)

Browsable docs catalog
    └──reads──> all role + workflow frontmatter (exists)
    └──generated by──> stdlib-only Node generator (extend validator pattern)

INVEST + measurable NFRs ──enhances──> Definition of Ready (exists)
                                            └──gates──> business→engineer handoff

"Bug the user as little as needed" ──enhances──> Orchestrator routing (exists)
                                                     └──conflicts with──> any "prompt human at every step" addition
```

### Dependency Notes

- **SDLC-coverage audit must run first.** PROJECT.md says the milestone "opens with the audit, which informs the rest." It tells you which roles/workflows are thin (e.g. `ba-pm.md` is shallow, `security-nfr-checklist.md` is 10 lines, no UI role exists) and where the business→engineer bridge leaks. Roadmap: Phase 1.
- **Senior personas before BDD/TDD depth.** The BA persona must be deep enough to own the acceptance contract; the engineer persona deep enough to run the inner TDD loop and reason about trade-offs; QE deep enough to own outer-loop automation and the skip ledger. Persona depth is the substrate the test-first discipline rides on.
- **Three Amigos produces the BDD scenarios; BDD scenarios drive TDD.** The outer loop (acceptance) is written before the inner loop (units). One failing acceptance test at a time. They are layered, not competing — different owners, different timescales (minutes vs days), different artifacts. This is the non-conflict story.
- **UI build flow is a prerequisite for visual regression + axe.** You can't add Playwright visual/a11y to the gate meaningfully until there's a senior frontend persona producing components with enumerated states and a11y baked in.
- **The test-integrity step depends on the skip ledger fields.** "No unjustified skip" is only enforceable if the QE handoff and traceability carry the four justification fields (reason/owner/ticket/expiry) per skip. The fields are the mechanism; the gate check is the enforcement.
- **Security level depends on the config dial, which exists.** No new infra — `mode` and `compliance_regime` already drive lean/enterprise; security L1/L2/L3 hangs off them.
- **Docs catalog depends only on existing frontmatter.** It's a read-only generator; lowest-risk, can land late.
- **"Bug the user as little as needed" conflicts with over-gating.** Any new human checkpoint must justify itself against this principle. The only sacred human stops remain merge and deploy (the unchanged hard limit) plus genuine trade-off decisions.

## Lean → Enterprise Config Dial Mapping

How each theme scales on the single flag. **Default-on (lean)** items must not tax the solo builder; **enterprise-only** items must not let a regulated team skip a gate.

| Theme | Lean (default-on) | Enterprise-only (or `compliance_regime` non-empty) | Config knob |
|-------|-------------------|---------------------------------------------------|-------------|
| BDD acceptance | G/W/T scenarios required in DoR + product handoff (already there) | Full Three Amigos ceremony w/ named participants; scenarios linked 1:1 in traceability | reuse `mode`; maybe `bdd_ceremony: self\|three-amigos` |
| TDD inner loop | "write test first" expected, recorded in engineer handoff | Mutation-testing step recommended where stack supports | reuse `quality.coverage_threshold`; new `quality.mutation_testing: off\|recommend\|require` |
| Security audit | ASVS L1 subset (first-layer: authn, input validation, secrets, basic authz, logging-no-leak) | L2 standard (full authz, session, crypto, config, data-protection); L3 + threat modeling when `compliance_regime` set | new `security.asvs_level: L1\|L2\|L3` defaulting from `mode`+`compliance_regime` |
| UI build + a11y | all-5-states + accessibility-checklist as done-condition; WCAG-2.2-AA (already default) | stricter a11y audit, design-token/contract enforcement | reuse `nfr.a11y_target` |
| Automated UI/E2E + visual | e2e per `e2e_when` (ui-or-critical-path); component-level visual on critical UI | full visual-regression suite, cross-browser matrix | reuse `quality.e2e_when`; new `quality.visual_regression: off\|critical\|full` |
| Test-integrity | no unjustified/expired skip; gate fails on > 0 (default-on — this is a safety property) | skip ledger reviewed at sprint review; aging report | new `quality.allow_skips: justified-only` (default), `quality.skip_max_age_days` |
| Lint | lint step on (already mandatory); per-stack recommendation | additional style/security linters (e.g. semgrep) | reuse `quality.mandatory_gates` (add `"format"` opt) |
| Docs catalog | generated on demand | generated + checked in CI for staleness | none (build step) |
| Senior personas | always senior — this is a rewrite, not a toggle | extra governance roles already exist (enterprise pack) | none |

> **Safety carve-out:** test-integrity (no fake green, no unjustified skip) and the merge/deploy hard limit are **NOT dialable down**. They are the trace's integrity and the safety boundary — on at every level, matching the existing `production_requires_human_confirmation: true` and "never fake a pass" constraints.

## MVP Definition (for the v1.2 milestone)

### Launch With (v1.2 core)

- [ ] **SDLC-coverage audit & gap-fix** — must come first; informs everything; named in PROJECT.md as the opener
- [ ] **Senior persona overhaul** (BA, product, architecture, engineering, QE, security) with `## Judgment & escalation` + `## What good looks like` — the milestone headline
- [ ] **BDD↔TDD double-loop**, layered & non-conflicting: G/W/T acceptance contract in the business→engineer handoff (outer loop, QE/business-owned) + TDD red-green guidance (inner loop, engineer-owned) + Three Amigos refinement step
- [ ] **ASVS-anchored security audit workflow + leveled checklist** (rewrite the 10-line file; L1 lean default) — security review with a real standard behind it
- [ ] **Test-integrity gate**: no unjustified/expired skip, skip ledger (reason/owner/ticket/expiry), never fake a pass — the un-cheatable gate; safety-critical, default-on
- [ ] **Senior frontend persona + UI design→build workflow** (design contract → component → 5 states → a11y) — no UI role exists today
- [ ] **Automated UI/E2E + visual regression in the gate** (Playwright `toHaveScreenshot()` + axe-core), component-level-first, masked, gated by `e2e_when`
- [ ] **Lint step + per-stack linter recommendations** (already a gate step; add the table)
- [ ] **Browsable in-repo markdown docs catalog** of all agents + workflows
- [ ] **Install migrate/update** (MIGR-01 `--migrate`, UPD-01 `--update`) — folded in per user; install-track, parallel to the SDLC work

### Add After Validation (post-v1.2)

- [ ] **Mutation testing** promoted from "recommend" to "require" where stacks support it — once teams trust the coverage-honesty guidance
- [ ] **Full cross-browser visual matrix** — once component-level visual is stable and non-flaky
- [ ] **CI staleness check for the docs catalog** — once the generator is trusted

### Future Consideration (beyond v1.2 — explicitly out of this milestone per PROJECT.md)

- [ ] Per-repo kit-version pin + skew warning (SKEW-01)
- [ ] Doctor `--fix` (FIX-01)
- [ ] Plugin-form path resolution / publishing grugops as a Claude Code plugin (PLUGIN-01)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| SDLC-coverage audit (opener) | HIGH | LOW | P1 |
| Senior persona overhaul | HIGH | MEDIUM | P1 |
| BDD↔TDD double-loop + Three Amigos | HIGH | MEDIUM | P1 |
| ASVS security audit + leveled checklist | HIGH | HIGH | P1 |
| Test-integrity gate (no unjustified skip) | HIGH | MEDIUM | P1 |
| Senior frontend persona + UI build flow | HIGH | HIGH | P1 |
| Automated UI/E2E + visual regression | MEDIUM | HIGH | P1 |
| Lint + per-stack linters | MEDIUM | LOW | P1 |
| Browsable docs catalog | MEDIUM | LOW–MEDIUM | P2 |
| Install migrate/update | MEDIUM | MEDIUM | P1 (separate track) |
| Mutation testing (recommend) | MEDIUM | LOW (guidance) | P2 |
| INVEST + measurable NFR in DoR | HIGH | LOW | P1 |

## Theme deep-dives (concrete artifacts grugops should add)

### (a) BDD + TDD without conflict
- **Layering, not competition.** BDD = the **outer loop**, the business-readable acceptance contract (Given/When/Then), written first, owned by business/QE, passes over days. TDD = the **inner loop**, developer-perspective unit red-green-refactor, passes over minutes. The acceptance test stays RED until the inner loop closes it. **Rule: never write a second failing acceptance test before the first is green.** That single rule is the whole non-conflict story.
- **Artifacts:** product handoff gains `## Acceptance scenarios (Given/When/Then)`; engineer handoff gains a `## TDD log` (failing-test-first evidence); QE handoff owns automation of the outer scenarios.
- **Ownership:** BA/PM drafts scenarios → **Three Amigos** (product scopes, QE finds edge cases, engineer adds detail) refines → QE/E2E automates the outer loop → engineer runs the inner loop. Use **Example Mapping** (rules/examples/open-questions) before writing Gherkin; don't write Gherkin live in the workshop.

### (b) Security audit as a repeatable workflow + ASVS checklist
- **New workflow** (or deepen the Security/NFR slot in `05-pr-quality-gate.md`): a repeatable audit pass that walks the ASVS chapters relevant to the change.
- **What a senior security reviewer actually inspects** (map to ASVS chapters): authentication (V6) + session (V7) + authorization (V8 — least privilege, no privilege escalation, no IDOR); input validation & business logic (V2) and encoding/sanitization (V1 — injection, parameterized queries); secrets handling (V13 config, V11 crypto — no hardcoded secrets, proper key handling); dependencies/supply chain; data protection (V14) + logging-without-leaking-secrets (V16); API surface (V4); secure design + threat modeling (V15, L3). Cite requirement IDs; **clear professional English** in every finding.
- **Leveling:** L1 lean default (first-layer defenses, fewest reqs), L2 enterprise ("most apps should strive for L2", ~70% of ASVS), L3 + threat modeling for regulated (`compliance_regime` non-empty).

### (c) Senior frontend/UI build flow + automated UI testing
- **Flow:** design contract (tokens + the API/data contract the UI consumes — optionally a consumer-driven/Pact-style contract) → component build → **enumerate all 5 states (loading/empty/error/success/partial-data)** → accessibility (keyboard, focus, labels, contrast, no color-only, target sizes) → visual baseline.
- **Automated testing fits the gate after `build`:** Playwright E2E for critical flows + `toHaveScreenshot()` visual regression (component-level first, mask dynamic content, fixed viewport/browser, `maxDiffPixels`) + axe-core a11y assertions. **"Bug the user as little as needed":** the gate runs these automatically on green, surfaces a human only on a real diff/decision — no per-state human prompt.

### (d) Senior vs junior personas
- **Senior markers to encode** in each role: decides and *justifies* (vs "consults before choosing"); reasons about long-term/6-months-later consequences and trade-offs (vs short-term safety); thinks system-wide (vs component-local); **knows the escalation boundary** — acts within mandate, escalates at genuine trade-offs and safety gates. Add `## Judgment & escalation` (when to decide vs escalate) and `## What good looks like` (concrete senior-grade output bar) to the role skeleton. Keep grug voice in the prompt; the judgment criteria can be terse grug ("grug think 6 month later. grug not paint self in corner.").

### (e) Full-SDLC coverage & the business→engineer bridge
- **Bridge artifacts (name them explicitly):** user stories (INVEST), acceptance criteria as Given/When/Then scenarios, measurable+testable NFRs (unit of measure + success/failure thresholds, linked to `plans/nfr-catalog.md`), Definition of Ready (entry gate), and the Three Amigos conversation that produces shared understanding.
- **Commonly MISSING (the gaps to close):** NFRs forgotten until production ("the cause of IT project failure"); acceptance criteria vague or absent for error/empty/edge states; NFRs not measurable/testable; no shared business↔engineer conversation (throw-over-the-wall). Fix: NFRs *in* the DoR; Three Amigos step; the product handoff carries the scenarios + NFRs as first-class fields.

### (f) Test-integrity escape hatch that isn't a rubber stamp
- **Legitimate skip = all four fields present:** reason, named owner, tracking ticket ID, expiry date. **Quarantine ≠ delete:** quarantined tests run in a separate **non-blocking lane** so signal is still collected; they are never silently removed.
- **Anti-rubber-stamp mechanics:** the gate fails on `unjustified_skips > 0` AND on `expired_skips > 0` (decay forces resolution — "fix it or delete it" with a deadline, escalate after N days). The skip ledger is recorded in the QE handoff + traceability and is visible to the human PR reviewer. **Never use retries to close a ticket** — retries only unblock in the quarantine lane. **Coverage honesty:** line coverage is gameable (100% with zero assertions); QE must assert *behavior*; recommend mutation testing where the stack supports it. The agent may *propose* a justified skip but the human disposes on any safety-relevant skip (same agent-proposes/human-disposes pattern as the prod-deploy hook).

## Competitor Feature Analysis

| Feature | Generic "AI dev agent" wrapper | Heavy enterprise ALM (Jira+pipelines) | grugops approach |
|---------|--------------------------------|---------------------------------------|------------------|
| BDD/TDD discipline | Usually none or one-off "write tests" | Possible but tool-heavy, not agent-native | Layered double-loop encoded in workflow + handoffs; runs in the host coding agent; markdown only |
| Security standard | Ad-hoc "check for vulns" | Separate AppSec tooling, siloed | ASVS-anchored checklist dialed L1→L3 on one flag, in the same gate |
| Test integrity | Agent can fake/skip to go green | Pipeline can be gamed by retries | Un-cheatable: no unjustified/expired skip, `UNKNOWN - verify`, skip ledger in the trace |
| UI build rigor | "Build the component" | Design-system governance, heavy | Senior frontend persona: contract→build→5 states→a11y→visual baseline, defaults-first |
| Discoverability | None | Web portals | Generated in-repo markdown catalog, stays in the boundary |
| Persona depth | Single generic agent | Many roles, much process | 16 senior personas with judgment + escalation, scaled by one config flag |

## Sources

- [Dual-loop BDD is the new Red-green TDD — justin.searls.co](https://justin.searls.co/posts/dual-loop-bdd-is-the-new-red-green-tdd/) (HIGH)
- [Double-Loop TDD — sammancoaching.org](https://sammancoaching.org/learning_hours/bdd/double_loop_tdd.html) (HIGH)
- [Outside-In development with Double Loop TDD — coding-is-like-cooking.info](https://coding-is-like-cooking.info/2013/04/outside-in-development-with-double-loop-tdd/) (HIGH)
- [TDD vs BDD — Pluralsight](https://www.pluralsight.com/resources/blog/software-development/tdd-vs-bdd) (MEDIUM)
- [Who does what? — Cucumber BDD docs](https://cucumber.io/docs/bdd/who-does-what/) (HIGH)
- [The Behavior-Driven Three Amigos — Automation Panda](https://automationpanda.com/2017/02/20/the-behavior-driven-three-amigos/) (HIGH)
- [The anatomy of a Three Amigos Requirements Discovery workshop — John Ferguson Smart](https://johnfergusonsmart.com/three-amigos-requirements-discovery/) (HIGH)
- [OWASP Application Security Verification Standard (ASVS) — OWASP Foundation](https://owasp.org/www-project-application-security-verification-standard/) (HIGH)
- [ASVS 5.0 chapter list — OWASP/ASVS GitHub (5.0/en)](https://github.com/OWASP/ASVS/tree/master/5.0/en) (HIGH)
- [What's New in ASVS 5.0 — SoftwareMill](https://softwaremill.com/whats-new-in-asvs-5-0/) (MEDIUM)
- [OWASP ASVS v5: Raising the Bar — Cyber Chief](https://www.cyberchief.ai/2025/09/owasp-asvs-v5-raising-bar-for.html) (MEDIUM)
- [Flaky Test Quarantine best practices — minware](https://www.minware.com/guide/best-practices/flaky-test-quarantine) (HIGH)
- [Handling Flaky Tests at Scale — Slack Engineering](https://slack.engineering/handling-flaky-tests-at-scale-auto-detection-suppression/) (HIGH)
- [Taming Test Flakiness — Atlassian Engineering](https://www.atlassian.com/blog/atlassian-engineering/taming-test-flakiness-how-we-built-a-scalable-tool-to-detect-and-manage-flaky-tests) (HIGH)
- [Playwright Visual Testing: toHaveScreenshot — TestDino](https://testdino.com/blog/playwright-visual-testing) (HIGH)
- [How to Conduct Visual Testing with Playwright (flake-resistant) — David Auerbach](https://medium.com/@david-auerbach/how-to-conduct-visual-testing-with-playwright-a-complete-flake-resistant-guide-58714ebfbf05) (MEDIUM)
- [Mutation Testing: How to Ensure Code Coverage Isn't a Vanity Metric — Codecov](https://about.codecov.io/blog/mutation-testing-how-to-ensure-code-coverage-isnt-a-vanity-metric/) (HIGH)
- [Why "100% Test Coverage" Is a Vanity Metric](https://www.bestblogs.dev/en/article/c16a0051) (MEDIUM)
- [The Frontend Developer's Accessibility Checklist — TSD](https://blog.tsd.digital/the-frontend-developers-accessibility-checklist/) (MEDIUM)
- [A Complete Guide To Accessible Front-End Components — Smashing Magazine](https://www.smashingmagazine.com/2021/03/complete-guide-accessible-front-end-components/) (HIGH)
- [How to Leverage NFRs to Develop Acceptance Criteria — AdaptiveUS](https://www.adaptiveus.com/blog/how-to-leverage-nfrs-to-develop-acceptance-criteria) (MEDIUM)
- [Junior vs Senior Developer behaviors — Scio](https://sciodev.com/blog/junior-vs-senior-developer/) (MEDIUM)
- [Differences Among Junior & Senior Developers & Architects — Jason Heltzer / Medium](https://medium.com/venture-evolved/the-differences-among-junior-senior-developers-architects-475e7baad05a) (MEDIUM)

**Open / `UNKNOWN - verify`:**
- Exact ASVS 5.0 per-level requirement counts ("~70% L2, ~30% L3 add", "~350 requirements") come from secondary summaries; verify against the ASVS 5.0.0 PDF when authoring the checklist. `UNKNOWN - verify` the precise L1/L2/L3 tagging per requirement.
- Mutation-testing tool availability is stack-dependent; grugops must keep it a *recommendation* (`UNKNOWN - verify` per project), never a bundled runtime.

---
*Feature research for: agentic SDLC delivery kit — v1.2 SDLC Depth, Quality Discipline & Browsable Docs*
*Researched: 2026-06-09*
