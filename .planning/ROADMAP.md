# Roadmap: grugops

## Milestones

- ✅ **v1.0 MVP — Full Agent Factory v2** — Phases 1–6 (shipped 2026-06-04)
- ✅ **v1.1 Install & Distribution** — Phases 7–9 (shipped 2026-06-08)
- ✅ **v1.2 SDLC Depth, Quality Discipline & Browsable Docs** — Phases 10–19 (shipped 2026-06-16)
- 🚧 **v2.0 Decentralized Factory — Shared Verified Context** — Phases 20–26 (active)

## Overview

grugops is built bottom-up as a file protocol, not a runtime. v1.0 froze the shared vocabulary, built the 16 roles + 14 workflows + contracts + adapters + both Claude forms + installers + validator + brand collateral, and proved the chain with a dogfood. v1.1 redesigned the install to a shared-location two-root model (read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`, per-repo state in the target) with a path rewrite, a two-root installer, a `--check` doctor, and a false-green-proof validator. v1.2 deepened the kit itself: it opened with an SDLC-coverage audit plus the mechanical foundation guards (WR-05 spawn grep, single-source adapter-size check, AGENTS.md byte budget, voice-lint, config-dial contract) so every later content phase wrote into a guarded environment; then a senior-persona overhaul laid the substrate, BDD+TDD closed the business→engineer handoff, a frontend/UI persona and an ASVS security audit ran as parallel content streams, then a TypeScript tooling migration converted the script layer (installers, validator, generator, guards) to a zero-build cross-platform foundation, the §14 quality gate converged all of it (lint + UI/E2E + test-integrity) on that TS foundation, install migrate/update landed as an independent track, a generated docs catalog documented the finished 17-role / 16-workflow set, and finally Phase 19 reopened the milestone post-Phase-18 to add an honest Tier-1/Tier-2 auto-UAT harness.

**v2.0 is a major architecture pivot.** It replaces the centralized Orchestrator + static handoff packets with three DeLM-derived primitives (arXiv 2606.10662) — a **shared verified context** (typed notes, read-before-act / write-after-verify), a **file-based task queue** (agents claim work atomically without a central router), and **parallel agents** (Claude Code primary via the `Agent` tool; the other four CLIs degrade to sequential over the same files). The entire decentralization ships with **zero new runtime dependencies** — `node:fs` + markdown + the Claude Code `Agent` tool on top of the v1.2 committed-`.js` tooling layer. grugops's defensible differentiator over DeLM and every multi-agent framework is strict: **"verified" means passed the §14 behavior gate**, recorded as an auditable, human-gatable `verified_by` stamp — never a black-box blackboard. The build is foundation-first (Phases 20–22 mechanize the substrate, verifier, and compaction before any role uses them), then parallel execution + clean handoff removal (23–24), governance (25), and an equivalence-oracle dogfood last (26) that honestly retires the A3/DOG-02 dual-path waiver — and only then. grugops's *own* success/cost gain stays `UNKNOWN - verify` until Phase 26 measures it; DeLM's benchmark numbers are never claimed as grugops's.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Phase numbering is continuous across milestones — it never resets. v2.0 continues from Phase 19, starting at Phase 20.

<details>
<summary>✅ v1.0 MVP — Full Agent Factory v2 (Phases 1–6) — SHIPPED 2026-06-04</summary>

- [x] Phase 1: Substrate, Config & State Skeleton (5/5 plans) — completed 2026-06-02
- [x] Phase 2: Shared Contracts (4/4 plans) — completed 2026-06-03
- [x] Phase 3: Roles & AGENTS.md Substrate (8/8 plans) — completed 2026-06-03
- [x] Phase 4: Workflows, Cadence & Backpressure (7/7 plans) — completed 2026-06-03
- [x] Phase 5: Packaging, Adapters, Install & Distribution (5/5 plans) — completed 2026-06-03
- [x] Phase 6: Validation, Brand & Dogfood (5/5 plans) — completed 2026-06-04

Full phase details + milestone summary: `milestones/v1.0-ROADMAP.md` · requirements: `milestones/v1.0-REQUIREMENTS.md`

</details>

<details>
<summary>✅ v1.1 Install & Distribution (Phases 7–9) — SHIPPED 2026-06-08</summary>

- [x] Phase 7: Shared-Home Foundation & Path Rewrite (4/4 plans) — completed 2026-06-06
- [x] Phase 8: Two-Root Installer (4/4 plans) — completed 2026-06-07
- [x] Phase 9: Doctor & Two-Root Validator (6/6 plans) — completed 2026-06-08

Full phase details + milestone summary: `milestones/v1.1-ROADMAP.md` · requirements: `milestones/v1.1-REQUIREMENTS.md` · audit: `milestones/v1.1-MILESTONE-AUDIT.md`

</details>

<details>
<summary>✅ v1.2 SDLC Depth, Quality Discipline & Browsable Docs (Phases 10–19) — SHIPPED 2026-06-16</summary>

- [x] Phase 10: SDLC-Coverage Audit & Foundation Guards (4/4 plans) — completed 2026-06-10
- [x] Phase 11: Senior Persona Overhaul (5/5 plans) — completed 2026-06-10
- [x] Phase 12: BDD + TDD Wiring (5/5 plans) — completed 2026-06-11
- [x] Phase 13: Frontend/UI Persona & Design→Build Workflow (3/3 plans) — completed 2026-06-11
- [x] Phase 14: Security Audit (OWASP ASVS) & Checklist Re-Anchor (3/3 plans) — completed 2026-06-13
- [x] Phase 15: TypeScript Tooling Migration (6/6 plans) — completed 2026-06-13
- [x] Phase 16: §14 Gate Convergence — Lint, UI/E2E & Test-Integrity (3/3 plans) — completed 2026-06-14
- [x] Phase 17: Install --migrate / --update (3/3 plans) — completed 2026-06-15
- [x] Phase 18: Browsable Docs Catalog (2/2 plans) — completed 2026-06-15
- [x] Phase 19: Factory Auto-UAT Harness — Tier 1 Oracles + Tier 2 Headless E2E (4/4 plans) — closed 2026-06-16 (A3/DOG-02 live dual-path parity human-waived → next milestone)

Full phase details + milestone summary: `milestones/v1.2-ROADMAP.md` · requirements: `milestones/v1.2-REQUIREMENTS.md` · audit: `milestones/v1.2-MILESTONE-AUDIT.md`

</details>

### 🚧 v2.0 Decentralized Factory — Shared Verified Context (Phases 20–26) — ACTIVE

- [x] **Phase 20: Shared-Context Substrate & Concurrency Foundation** — the atomic-write helpers, the typed-note schema, the verify-stamp validator hooks, the file-based queue, and the grep guard — mechanized before any role writes to the shared context (all 4 plans executed 2026-06-17 — awaiting phase verification) (completed 2026-06-17)
- [x] **Phase 21: Verify-Before-Write Admission** — the §14 gate as the un-cheatable verifier; refuse-self-set; the read-before-act / write-after-verify protocol (Workflow 16) (completed 2026-06-17 — 4/4 plans incl. CR-01 CRLF gap-closure 21-04; verification 4/4)
- [x] **Phase 22: Memory & Trajectory Compaction** — two-tier memory + the `context.compaction` dial + the load-bearing-field carve-out (Workflow 18), landed before parallel fan-out makes the token tax real (round 5 = GAPS_FOUND on a 5th CMP-02 bypass: MULTI-NOTE THREAD FILE — readNoteDir→parseNote read only the FIRST fence, so a §14-gate-verified finding / required failed-attempt buried as note #2+ was dropped at exit 0. **Round 6 (22-07) EXECUTED + RE-VERIFIED 2026-06-19 = GAPS_FOUND (6/8)**: read-path-only fix — shared body-consuming `splitNotes()` (boundary = column-0 `---` + an `id:` line — but see the 6th bypass below: `/^id:/` is a STRICT SUBSET of parseNote's recognized lines, so splitNotes DOES drift from parseNote) + per-note `readNoteDir` keyed `<file>#<n>` (both round-5 gates + byte-equal/required-survival run PER NOTE) + `trailingMalformed`→`NoteDirResult.unparseable` fail-closed (WR-01); IN-01: `noteId` exported + reused by composeThreadNote. RED→GREEN proven vs the COMMITTED compactor.js (22-07-RED-baseline.txt exit 0 'carve-out intact' → 22-07-GREEN-proof.txt exit 1 naming the dropped id), `npm run freshness` exit 0, full non-e2e suite 409 passed/1 skipped, 14 new held-out tests (5 multi-note RED-first + 9 splitNotes unit). Write representation + readContext UNCHANGED; WR-02/WR-03/broader-IN-02 DEFERRED. CMP-01 + CMP-03 untouched. BUT a 6th CMP-02 bypass found by the verifier + reproduced end-to-end through the committed CLI (ID-FIRST/NO-DRIFT): splitNotes boundary `/^id:/` ⊊ parseNote's grammar → a KIND-FIRST (id on 2nd line) / indented-id / trailing-space-`--- ` note #2 is folded SILENTLY into note #1's body → a §14-gate-verified finding dropped at exit 0 'carve-out intact'. Writer-REACHABLE via the sanctioned writeThread no-`note` free-scratch path; safe today only via an unguarded/untested 'every writer emits id: first' coupling (green suite ≠ proof, 6th time). Round 7 (22-08) EXECUTED 2026-06-19: Fork A read-path fail-closure — `isRecognizedFrontmatterLine` single exported source-of-truth grammar shared by parseNote + splitNotes (no drift); splitNotes keys boundaries on an id-bearing frontmatter run (trailing-whitespace-tolerant) and recovers-or-refuses each region (never silently absorbs); kind-first note RECOVERED, indented-id/trailing-space note REFUSED (both fail-closed); writer-order guard pins composeNote + composeThreadNote field order; round-6 non-discriminating test #3 replaced; byte-fresh .js + freshness exit 0; full non-e2e suite 418 passed/1 skipped; RED→GREEN end-to-end vs the COMMITTED compactor.js (22-08-RED-baseline.txt exit 0 'carve-out intact' → 22-08-GREEN-proof.txt exit 1 naming the dropped id). RE-VERIFIED 2026-06-19 = GAPS_FOUND (6/8): the 6th bypass is closed for its THREE named shapes (kind-first RECOVERED count=2, indented-id RECOVERED then gated, trailing-space `--- ` REFUSED — the executor's 'indented REFUSED' note was imprecise; it is recovered) but a 7th DISTINCT CMP-02 bypass — SAME silent-absorb CLASS, different first-in-fence shape — was found by the orchestrator (opus) and INDEPENDENTLY REPRODUCED by the gsd-verifier (opus) at the splitNotes unit level AND end-to-end through the committed CLI: a note #2 whose fence OPENS with a leading BLANK line (`---\n\nid: …`) or leading JUNK line (`---\n# x\nid: …`, also CRLF) is parsed CLEAN by parseNote yet MISSED by splitNotes (the forbidden count=1/trailingMalformed=null/malformedLines=[] signature) → a §14-gate-verified failed-attempt folded silently into note #1's body, dropped at exit 0 'carve-out intact'. Writer-reachable via the writeThread free-scratch path. ROOT CAUSE: isBoundaryAt requires looksLikeFrontmatterLine(lines[i+1]) but opensIdBearingRun + parseNote both tolerate a leading blank/junk line — the boundary trigger is AGAIN a strict subset of parseNote's grammar (the 'heuristic narrower than the format' anti-pattern truth #1 was written to kill). Green suite ≠ proof, 7th time (418 green, still bypassable). Fix (round 8): make the candidate-boundary/fail-closure decision parseNote-grammar-COMPLETE (do not hinge on lines[i+1]) + held-out RED-first CLI tests for leading-blank/junk/CRLF shapes. Next: /gsd-plan-phase 22 --gaps (round 8).) (round-7 22-08 re-verified gaps_found 2026-06-19 — 7th bypass) (completed 2026-06-19)
- [x] **Phase 23: Parallel Execution & Orchestrator-as-Decomposer** — Orchestrator router→decomposer/scheduler/gate, nested CC spawning + the degraded sequential path, the inverted WR-05 guard, the WIP cap (Workflow 17) (all 3 plans executed + verified 2026-06-21; 23-03 inverted guard_wr05 closed on RED-baseline + GREEN-proof + independent probe vs the committed .js; phase code-review found+fixed CR-01 — guard_wr05 was mis-reading a fenced coordinator example in subagent.frontmatter.md as a live coordinator → fixed structurally with fence-stripping + exactly-one-coordinator cardinality, re-verified by an opus verifier)
- [ ] **Phase 24: Clean Handoff Removal & Traceability Migration** — rewire all 18 roles + 16 workflows onto the substrate, then delete all 17 handoff templates in one grep-to-zero change; migrate the trace, never drop it
- [ ] **Phase 25: Governance-on-a-Dial** — `context.human_admission` + `context.audit_retention` enterprise tiers over the decentralized substrate; the un-dialable safety floor unchanged
- [ ] **Phase 26: Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement** — the equivalence oracle (on-disk parity), the N-agent parallel dogfood, and the honest token-cost measurement; A3/DOG-02 retired ONLY when the oracle passes

## Phase Details

### Phase 20: Shared-Context Substrate & Concurrency Foundation

**Goal**: Establish the shared verified-context substrate and atomic concurrency primitives — the file locations, the typed-note schema with provenance, the only-sanctioned write path, and the file-based task queue — so that drift is caught as it is written, before any role uses them.
**Depends on**: Nothing new (builds on the v1.2 committed-`.js` tooling layer)
**Requirements**: SCTX-01, SCTX-02, SCTX-03, SCTX-04, SCTX-05, CLAIM-01, CLAIM-02
**Success Criteria** (what must be TRUE):

  1. A note authored against the six-kind schema (`claim`/`finding`/`decision`/`failed-attempt`/`observation`/`artifact-ref`) carries a complete provenance fence (`by`/`at`/`verified_by`/`confidence`/`refs`/`supersedes`) and the markdown is the source of truth; a note missing a required provenance field is a validator structural FAIL.
  2. Two concurrent writes through `appendNote`/`atomicWrite` produce two distinct, un-clobbered notes (no lost-update, no torn append) — proven on a cross-platform path including the Windows unlink-then-rename sequence.
  3. A subtask file moves `pending → claimed → done` by atomic rename, and a `claim.ts` claim via `mkdirSync` is exclusive (a second claimant on the same task fails) with no central lock manager.
  4. The committed per-task JSONL index regenerates byte-identically from the markdown; editing the markdown without regenerating the index trips the `freshness:context` gate (fail-closed), and the markdown wins on any conflict.
  5. `guard_context_writes` fails RED if any shipped role/workflow text writes the shared context by a path other than the sanctioned `context-io.ts` helpers (a planted raw-write fixture proves it).

**Plans**: 4 plans (2 waves)
Plans:
**Wave 1**

- [x] 20-01-PLAN.md — note-schema contract docs + context-io.ts (atomicWrite/appendNote/readContext + deterministic index render + schema validate) [SC-1, SC-2]
- [x] 20-02-PLAN.md — claim.ts: mkdirSync atomic claim + pending→claimed→done rename transitions + generous-TTL stale-sweep [SC-3]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 20-03-PLAN.md — context-freshness.ts freshness:context drift gate (clone catalog-freshness.ts; markdown wins, fail-closed) [SC-4]
- [x] 20-04-PLAN.md — guard_context_writes foundation guard + windows-latest CI leg [SC-5, SC-2 Windows runtime]

### Phase 21: Verify-Before-Write Admission (the §14 Gate as the Un-Cheatable Verifier)

**Goal**: Wire the differentiator mechanically — a `finding` is admitted to the shared context only with a real, non-self verification stamp — so the replacement memory is trustworthy before it becomes the sole memory.
**Depends on**: Phase 20 (the schema, validator hooks, and write path must exist)
**Requirements**: VFY-01, VFY-02, VFY-03, VFY-04
**Success Criteria** (what must be TRUE):

  1. A `finding` carrying `verified_by: §14-gate#<id>` (a real gate verdict), a passing test reference, or a named human is admitted; a `finding` with no such stamp is refused.
  2. A `finding` whose `verified_by` is missing, `self`, or the writing agent is a validator structural FAIL — a RED fixture proves a hollow/self-authored stamp fails (mirroring the prod-deploy hook's refuse-self-set).
  3. A role following Workflow 16 (`16-context-read-write.md`) reads the shared context before acting and writes only after verification, and every other role references that single-source protocol rather than restating it.
  4. The §14 gate's bounded `self_fix_attempts` loop drives a bounded verify→regenerate cycle, and the `claim` / `UNKNOWN - verify` escape hatch is honest and explicitly non-load-bearing (a `claim` can never satisfy a `finding`'s admission).

**Plans**: 4 plans (3 waves) — Wave 3 is the CR-01 gap-closure pass after initial verification scored 3/4
Plans:
**Wave 1**

- [x] 21-01-PLAN.md — extend context-io.ts validate() with the refuse-self/impersonation FAIL set + the context-aware admission cross-check (Posture B); RED-then-GREEN fixtures [VFY-01, VFY-02]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 21-02-PLAN.md — §14 gate emits a `by: §14-gate` green verdict (unique per-run id) via context-io.ts on READY_FOR_HUMAN_REVIEW; single-source, references the bounded self_fix_attempts loop [VFY-01, VFY-04]
- [x] 21-03-PLAN.md — author Workflow 16 (single-source read/write/admission protocol) + sync context-note.md + the one-line WF16 pointer in all 17 roles [VFY-03, VFY-04]

**Wave 3 — gap closure** *(closes CR-01 from 21-VERIFICATION.md, which scored SC-1 PARTIAL)*

- [x] 21-04-PLAN.md — CR-01: normalize CRLF/CR to LF in parseNote so a git-autocrlf (Windows) verdict note is read identically to its LF form; RED-then-GREEN CRLF round-trip test over readContext + admit; rebuild + freshness-verify the committed .js [VFY-01]

### Phase 22: Memory & Trajectory Compaction (Dialable, Token-Economy)

**Goal**: Bound the multi-agent token tax with two-tier memory — verbose local trajectory stays in the agent's thread; only compact, re-verified distillations promote to the shared context — landed before parallel fan-out makes the cost real.
**Depends on**: Phase 21 (compacted output is re-verified before write — needs the admission gate)
**Requirements**: CMP-01, CMP-02, CMP-03
**Success Criteria** (what must be TRUE):

  1. An agent's verbose trajectory stays in `.grugops/context/threads/<agent>.md` while only a compact distillation reaches the shared context, and that promoted distillation is re-verified before write.
  2. Compaction never drops a load-bearing field — `verified_by`, `failed-attempt`, `supersedes`, and `by`/`at` provenance survive compaction; a RED test fails if any is dropped.
  3. The `context.compaction: aggressive|balanced|retain-raw` dial changes how aggressively trajectories are distilled, defaults to `aggressive` when absent (lean), and is documented across all three config surfaces.
  4. A role following Workflow 18 (`18-context-compaction.md`) compacts by the single-source protocol, and other roles reference it rather than restating it.

**Plans**: 9/9 plans complete

- [x] 22-01-PLAN.md — compactor.ts carve-out invariant checker (RED-first) + committed compactor.js + the context.compaction dial across all 3 config surfaces + the threads/ .gitignore entry (CMP-01/02/03)
- [x] 22-02-PLAN.md — author WF18 single-source compaction protocol + bump the catalog count test 17→18 + add the one-line WF18 pointer to all 17 roles (CMP-03)
- [x] 22-03-PLAN.md — gap-closure: harden the checkCarveOut safety oracle so CMP-02/SC2 genuinely holds — adversarial RED-first cases + fix CR-01 (mutation/forged stamp), CR-02 (wholly-dropped verified finding), CR-03 (multi-same-kind borrow), WR-01 (fail-closed missing threadDir), WR-02/03/05 hardening, rebuild byte-fresh compactor.js (CMP-02)
- [x] 22-04-PLAN.md — gap-closure round 3: STABLE-ID REWRITE — promoted noteId to an explicit frozen `id:` frontmatter field; rewrote checkCarveOut to an id-keyed exact 1:1 match (affirmative existence + fail-closed + byte-equal load-bearing fields) over an ASYMMETRIC required-survival set (currentState folds out only soft non-verified notes; verified findings + failed-attempts survive unconditionally); DELETED the verifiedKey Set + findCounterpart tuple fallback; strict drop policy; readNoteFields read-path duplicate-key reject; 7 held-out RED-first cases (CR-01/CR-02 P7/CR-02 P8/IN-01/FORGED-FOLD/RAW-FOLD-VERIFIED + read-path duplicate-id); rebuilt byte-fresh compactor.js + context-io.js (CMP-02) — executed 2026-06-18, awaiting phase re-verification
- [x] 22-05-PLAN.md — gap-closure round 4: ORACLE UNIFICATION — collapse the durable/failed-attempt enforcement seam. Fold the FA path into the ONE id-keyed exact-match + byte-equal pass (no `kind: failed-attempt` exemption — closes CR-01 provenance laundering); add the raw-side id-collision guard mirroring the promoted-side guard (closes CR-03 — verbatim 22-04 must-have); key FA survival on the frozen id not the body token (WR-01); validate `kind ∈ NOTE_KINDS` for every note (WR-03); fail closed on an unparseable raw .md (WR-02); export ONE shared frontmatter parser from context-io.ts and adopt it on the compactor read path (IN-02); generalized parameterized (field × kind) RED-first mutation sweep + the two named reproductions proven RED→GREEN against the committed .js; rebuild byte-fresh compactor.js + context-io.js (CMP-02)
- [x] 22-06-PLAN.md — gap-closure round 5: SHARED-LAYER IN-02 COMPLETION — close the 4th CMP-02 bypass (whitespace/parser-projection drift). parseNote records a `malformedLines` line-shape signal (any non-recognized in-fence line: indented key, `key : value` space-before-colon, trailing-ws, junk); validate() pushes a structural FAIL per entry (write path + CLI refuse them); checkCarveOut gains TWO fail-closed gates on EVERY raw + promoted note BEFORE any survival/byte-equal decision — (a) reject on malformedLines (mirrors the duplicateKeys block), (b) run the shared validate() and reject on any structural finding (closes CR-03 — column-0 empty verified_by finding). Held-out table-driven line-shape × field × kind matrix + CR-01/CR-02/CR-03 verbatim reproductions; RED→GREEN proof against the COMMITTED .js (pre-fix 429f01c exit 0 → post-fix exit 1); rebuild byte-fresh compactor.js + context-io.js (CMP-02)
- [x] 22-07-PLAN.md — gap-closure round 6: MULTI-NOTE THREAD FILE (the 5th CMP-02 bypass). READ-PATH-ONLY fix: the production thread is ONE multi-fence threads/<agent>.md (D-08, gitignored, intended), but readNoteDir→parseNote parses only the FIRST fence, so a §14-gate-verified finding / required failed-attempt buried as note #2+ is swallowed into note #1's body and droppable at exit 0. Tier A — export `splitNotes(text)` from context-io.ts sharing parseNote's fence grammar (single source, IN-02); readNoteDir iterates per-note keyed by `<file>#<n>`, runs both round-5 gates + byte-equal/required-survival PER NOTE, routes a trailing non-fence remainder (fence-then-scratch, WR-01) into NoteDirResult.unparseable (fail closed). Tier B — IN-01: export `noteId` and have composeThreadNote reuse it so the thread-note id can't drift from the promoted-counterpart format. CLASS-level round-trip invariant test (writeThread×2 → readNoteDir recovers exact id-set) + held-out RED-first buried-finding/buried-FA drops; RED→GREEN vs the COMMITTED .js + byte-fresh rebuild + freshness. OUT OF SCOPE (deferred): WR-02/WR-03/broader IN-02 (CMP-02)
- [x] 22-08-PLAN.md — gap-closure round 7: FAIL-CLOSED READ-PATH (the 6th CMP-02 bypass — splitNotes/parseNote DRIFT). Fork A (read-path-only, user-resolved; Fork B / write-path change REJECTED). Root cause of all 6 bypasses = a read-path boundary heuristic NARROWER than the format, defeated by an adversarial body/fence; PRIMARY mechanism is FAIL-CLOSURE, not recognition. (1) splitNotes FAILS CLOSED: any `---`-boundary-shaped line (incl. trailing-space `--- `/`---\t`) followed by a frontmatter-LOOKING line (`<key>:` at any indent, incl. `key : value`) that it cannot resolve into a clean parsed note is routed to trailingMalformed → NoteDirResult.unparseable — recovered OR loudly refused, NEVER silently swallowed into a body. (2) BROADENED RECOGNITION (IN-02): boundary key reuses parseNote's recognized-line set via a shared exported predicate (single source) so a genuine kind-first/indented-id note #2 is RECOVERED; splitNotes∘parseNote==parseNote proven on kind-first+indented (no drift). (3) WRITER-ORDER GUARD: a structural test asserts BOTH composeNote + composeThreadNote emit a note-opening line splitNotes recognizes — a field-reorder fails RED. Held-out RED-first end-to-end tests (kind-first / indented-id / trailing-space-`--- ` note #2, each via the writeThread free-scratch path, each burying a §14-gate-verified finding, asserting `node compactor.js check` exit 1 naming the dropped id, RED vs the committed pre-fix .js); replace the non-discriminating round-6 test #3 (WR-02); preserve the body-`---` win; byte-fresh rebuild + freshness; 22-08-RED-baseline.txt / 22-08-GREEN-proof.txt. readContext / noteId / write-path representation / CMP-01 / CMP-03 UNCHANGED (CMP-02)
- [x] 22-09-PLAN.md — gap-closure round 8: UNIFY THE TWO PARSERS (the 7th CMP-02 bypass — leading-blank/junk fence-open silent-absorb, AND the whole silent-absorb CLASS). Root cause of all 7 bypasses = splitNotes RE-DERIVES "where does a note open" with a bespoke line heuristic (`looksLikeFrontmatterLine(lines[i+1])` + a hand-rolled `opensIdBearingRun` scan) that has drifted from parseNote's real fence grammar 7 times; each round broadened the heuristic and a new shape appeared (whack-a-mole). USER-CHOSEN fix (Fork A read-path, root-cause form): the "does a NOTE open at this column-0 `---`?" decision is DERIVED FROM parseNote — slice the candidate region to its first `\n---` close, call parseNote, boundary IFF parseNote non-null AND id-bearing; the `lines[i+1]` gate + standalone opensIdBearingRun authority are REMOVED (one grammar, splitter cannot drift). Preserves the round-5 body-`---` win (id-less embedded block stays body), the 3 round-7 shapes (kind-first recovered / indented gated / trailing-space `--- ` refused), body-consuming byte round-trip, CRLF-first. PROOF BAR (green suite ≠ closure, 7th time): an ANTI-WHACK-A-MOLE parseNote-oracle property/table fuzz test (generates note #2 across {leading blanks}×{junk/heading}×{indent}×{kind-first/id-first}×{trailing-ws}×{LF/CRLF}, asserts the class invariant for EVERY variant — catches a hypothetical shape #9) + held-out RED-first end-to-end tests (blank-first / junk-first / CRLF fence-open note #2 via the writeThread free-scratch path, each burying a §14-gate-verified failed-attempt, `node compactor.js check` exit 1 naming the dropped id, RED vs the committed pre-fix .js); re-cast writer-order guard (parseNote-acceptable id-bearing fence, not field order); byte-fresh rebuild + freshness exit 0; 22-09-RED-baseline.txt / 22-09-GREEN-proof.txt. readContext / noteId / write-path representation (Fork B) / CMP-01 / CMP-03 UNCHANGED (CMP-02)

### Phase 23: Parallel Execution & Orchestrator-as-Decomposer (One Substrate, Two Modes)

**Goal**: Run both execution paths — parallel on Claude Code, sequential on the four other CLIs — on the one shared substrate: redefine the Orchestrator from router to decomposer/scheduler/gate, invert the WR-05 guard, and cap concurrent width.
**Depends on**: Phase 22 (compaction must be in place before the first parallel fan-out)
**Requirements**: PAR-01, PAR-02, PAR-03, PAR-04, CLAIM-03
**Success Criteria** (what must be TRUE):

  1. The Orchestrator decomposes work into queued subtasks, holds `Agent(<allowlist>)` and the human merge/deploy gate, sets `queue.wip_limit`, and does NOT relay data between agents (coordination is through the shared context only).
  2. On Claude Code, role agents claim tasks and run in parallel via nested sub-agent spawning (depth ≤5); concurrent agent *width* never exceeds `queue.wip_limit` (CLAIM-03 — grugops's responsibility, since the platform caps depth, not width).
  3. The four non-spawning CLIs drain the same queue at concurrency-1 via the rewired `_role-switch-protocol.md` step-4, producing identical on-disk artifacts to the parallel path (one substrate, two modes that converge).
  4. `guard_wr05` is inverted from "no role grants `Agent`" to "only the coordinator grants `Agent(<allowlist>)`", and it flips atomically with the packaging templates and the docs catalog (a planted non-coordinator grant fails RED).

**Plans**: 3/3 plans complete
Plans:
**Wave 1**

- [x] 23-01-PLAN.md — queue config object (3 surfaces, D-06) + cross-surface consistency check + now-running.md render (D-14) + queue-rooted freshness gate [CLAIM-03]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 23-02-PLAN.md — Orchestrator augment (router → decompose/schedule/gate, D-11/D-12/D-13) + Workflow 17 + SC1/SC2 decomposition+width spine + SC3 dual-path convergence oracle [PAR-01, PAR-02, PAR-03, CLAIM-03]

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 23-03-PLAN.md — the atomic WR-05 flip (D-18 7 surfaces): both-direction guard_wr05 + 3 RED fixtures + B3 asymmetry oracle + protocol/packaging/asymmetric-tables/coordinator-adapter + regenerated catalog [PAR-04, PAR-02, CLAIM-03]

### Phase 24: Clean Handoff Removal & Traceability Migration

**Goal**: Cut over cleanly from static handoff packets to the shared verified context as the sole inter-role memory — rewire every reader first, then delete in one grep-to-zero change — while preserving the requirement→code→test→release trace.
**Depends on**: Phases 20–23 (the substrate must exist, verify, compact, and be read/written by roles before any handoff is removed)
**Requirements**: MIGR-01, MIGR-02, MIGR-03, MIGR-04
**Success Criteria** (what must be TRUE):

  1. All 18 roles + 16 workflows + 3 packaging templates + AGENTS.md read and write the shared context with zero remaining references to static handoffs (a grep-to-zero gate proves it).
  2. All 17 handoff templates and the `plans/handoffs/` seed are deleted, and `validate-agent-factory.ts` + `generate-catalog.ts` are updated in the SAME change (the validator and catalog never reference a deleted artifact).
  3. The requirement→code→test→release traceability is carried onto note `refs`/trace fields — the trail is preserved end-to-end, never dropped.
  4. `install.ts --migrate` renames a user's `plans/handoffs/` state to a timestamped backup (never delete-first), and `git revert` is the documented rollback.

**Plans**: 5 plans (2 waves — D-12 rewire-before-delete)
**Wave 1**

- [ ] 24-01-PLAN.md — STAGE 1 rewire: 18 roles + 3 packaging templates + AGENTS.md → reference WF16 / publish typed notes (MIGR-01, wave 1)
- [ ] 24-02-PLAN.md — STAGE 1 rewire: 16 SDLC workflows (00–15) → reference WF16 (MIGR-01, wave 1)
- [ ] 24-03-PLAN.md — trace render + fail-closed freshness:traceability gate (MIGR-03, wave 1)
- [ ] 24-04-PLAN.md — install.ts --migrate handoffs-backup + seedState mkdir removal + tests (MIGR-04 + MIGR-02 install slice, wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 24-05-PLAN.md — STAGE 2 atomic delete: rm 17 templates + 8 fixture dirs, flip check-kit-refs, drop FROZEN_HANDOFFS + re-point trace check, D-15 adversarial proof (MIGR-02, wave 2, depends_on 24-01/02/03/04)

### Phase 25: Governance-on-a-Dial

**Goal**: Expose the enterprise governance tiers over the now-stable decentralized substrate — human-gated high-severity admission and audit retention — without touching the lean defaults or the un-dialable safety floor.
**Depends on**: Phase 24 (the substrate is the sole memory and roles are rewired before governance is layered on)
**Requirements**: GOV-01, GOV-02
**Success Criteria** (what must be TRUE):

  1. With `context.human_admission: high-severity` (or `all`), an agent proposes a verified note and a NAMED human disposes high-severity entries (security/architecture/release) before admission; with `off` (lean default) routine verified notes admit without a human stop.
  2. `context.audit_retention: git|retained` controls audit-trail retention, and all three config files are updated in lockstep with lean defaults preserved (zero-config still runs lean).
  3. The un-dialable safety floor is unchanged and not bypassable by any dial setting — verify-before-write, no-fabrication, test-integrity, and humans-hold-merge/deploy all hold regardless of governance configuration.

**Plans**: TBD

### Phase 26: Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement

**Goal**: Turn "degrade, never break" and "verified means verified" from prose into proof — a dual-path equivalence oracle on on-disk artifacts, an N-agent parallel dogfood, and an honest token-cost measurement — and retire A3/DOG-02 only when the oracle passes.
**Depends on**: Phase 25 (both execution paths and the full substrate must be wired end-to-end before the oracle is meaningful)
**Requirements**: DOGF-01, DOGF-02, DOGF-03
**Success Criteria** (what must be TRUE):

  1. A dual-path equivalence oracle (replacing `oracleParity` A3 in `check-uat-oracles.ts`) runs the same seeded task (a) parallel on Claude Code and (b) sequential via single-window role-load and asserts ON-DISK equivalence — the same set of admitted `finding`s, the same gate verdict, the same artifact.
  2. A parallel N-agent dogfood produces N distinct un-clobbered notes, each task is claimed exactly once, and a stale claim is reclaimed — confirming the `isolation: worktree` ↔ shared-context-path interaction.
  3. Aggregate token cost is measured so the ~50% cost claim is DEMONSTRATED with grugops's own numbers or honestly marked `UNKNOWN - verify` (DeLM's benchmark numbers are never asserted as grugops's).
  4. A3/DOG-02 is marked retired ONLY after the equivalence oracle passes — never on handoff deletion alone.

**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Substrate, Config & State Skeleton | v1.0 | 5/5 | Complete | 2026-06-02 |
| 2. Shared Contracts | v1.0 | 4/4 | Complete | 2026-06-03 |
| 3. Roles & AGENTS.md Substrate | v1.0 | 8/8 | Complete | 2026-06-03 |
| 4. Workflows, Cadence & Backpressure | v1.0 | 7/7 | Complete | 2026-06-03 |
| 5. Packaging, Adapters, Install & Distribution | v1.0 | 5/5 | Complete | 2026-06-03 |
| 6. Validation, Brand & Dogfood | v1.0 | 5/5 | Complete | 2026-06-04 |
| 7. Shared-Home Foundation & Path Rewrite | v1.1 | 4/4 | Complete | 2026-06-06 |
| 8. Two-Root Installer | v1.1 | 4/4 | Complete | 2026-06-07 |
| 9. Doctor & Two-Root Validator | v1.1 | 6/6 | Complete | 2026-06-08 |
| 10. SDLC-Coverage Audit & Foundation Guards | v1.2 | 4/4 | Complete | 2026-06-10 |
| 11. Senior Persona Overhaul | v1.2 | 5/5 | Complete | 2026-06-10 |
| 12. BDD + TDD Wiring | v1.2 | 5/5 | Complete | 2026-06-11 |
| 13. Frontend/UI Persona & Design→Build Workflow | v1.2 | 3/3 | Complete | 2026-06-11 |
| 14. Security Audit (OWASP ASVS) & Checklist Re-Anchor | v1.2 | 3/3 | Complete | 2026-06-13 |
| 15. TypeScript Tooling Migration | v1.2 | 6/6 | Complete | 2026-06-13 |
| 16. §14 Gate Convergence — Lint, UI/E2E & Test-Integrity | v1.2 | 3/3 | Complete | 2026-06-14 |
| 17. Install --migrate / --update | v1.2 | 3/3 | Complete | 2026-06-15 |
| 18. Browsable Docs Catalog | v1.2 | 2/2 | Complete | 2026-06-15 |
| 19. Factory Auto-UAT Harness — Tier 1 Oracles + Tier 2 Headless E2E | v1.2 | 4/4 | Closed (A3/DOG-02 waived → next milestone) | 2026-06-16 |
| 20. Shared-Context Substrate & Concurrency Foundation | v2.0 | 4/4 | Complete    | 2026-06-17 |
| 21. Verify-Before-Write Admission | v2.0 | 4/4 | Complete    | 2026-06-17 |
| 22. Memory & Trajectory Compaction | v2.0 | 9/9 | Complete    | 2026-06-19 |
| 23. Parallel Execution & Orchestrator-as-Decomposer | v2.0 | 3/3 | Complete    | 2026-06-21 |
| 24. Clean Handoff Removal & Traceability Migration | v2.0 | 0/? | Pending | - |
| 25. Governance-on-a-Dial | v2.0 | 0/? | Pending | - |
| 26. Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement | v2.0 | 0/? | Pending | - |

**Totals:** 26 phases · 92 plans complete · 3 milestones shipped (v1.0 + v1.1 + v1.2). Active milestone: **v2.0 Decentralized Factory — Shared Verified Context** (Phases 20–26, 28 requirements, 13 plans executed across Phases 20–22). Phase 20: all 4 plans executed (2 waves) — awaiting phase verification. Phase 21: complete — 4/4 plans (incl. CR-01 CRLF gap-closure 21-04); verification passed 4/4. Phase 22: all 6 plans executed 2026-06-18; **round 5 (22-06) re-verified 2026-06-18 = GAPS_FOUND (3/4 must-haves)**. Round 5 GENUINELY CLOSED the 4th bypass class (whitespace/parser-projection line-shape drift) — parseNote.malformedLines gate (a) + shared validate() gate (b) on every raw+promoted note's verbatim bytes, RED→GREEN vs the COMMITTED compactor.js, freshness exit 0, 395 non-e2e tests green, held-out line-shape matrix. BUT a 5th DISTINCT CMP-02 bypass was found (22-REVIEW.md CR-01) and independently reproduced by orchestrator + verifier against the committed compactor.js — MULTI-NOTE THREAD FILE: writeThread/composeThreadNote append each note as a fence into ONE threads/<agent>.md, but readNoteDir→parseNote reads only the FIRST fence (non-greedy regex; no splitter exists despite the module's contract comment), so a §14-gate-verified finding / required failed-attempt buried as note #2+ is invisible to the round-5 gates, the byte-equal loop, and the required-survival set → silently dropped at exit 0. SC1/SC3/SC4 pass; SC2/CMP-02 still BLOCKED. CMP-01 + CMP-03 verified. Green suite ≠ proof — 5th time (the corpus writes one note per .md file, never the production multi-note shape). Fix (round 6): a shared splitNotes() so the read path reads the same per-note set the write path emits, + a held-out multi-note RED test. Next: /gsd-plan-phase 22 --gaps (round 6), then re-verify Phase 22, then Phase 23.
