# Phase 12: BDD + TDD Wiring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 12-BDD + TDD Wiring
**Areas discussed:** Scenario artifact form, Three Amigos placement, Double-loop & ownership, TDD evidence + runner

---

## Scenario artifact form

### How should BDD scenarios physically exist across the `bdd` dial?
| Option | Description | Selected |
|--------|-------------|----------|
| Tiered | off=none; lean=inline G/W/T in product+QE handoffs; strict=separate selector-free scenario files wired to host step defs (executable-or-absent teeth) | ✓ |
| Inline everywhere | Always inline G/W/T; grugops never emits separate files; executability purely the host's job | |

### Relation to product-handoff's existing Acceptance criteria field?
| Option | Description | Selected |
|--------|-------------|----------|
| Separate block | Keep `## Acceptance criteria` as the terse bar; add distinct `## Acceptance scenarios (Given/When/Then)` block in BOTH product + QE handoffs | ✓ |
| Deepen existing field | Reuse existing criteria field as scenario carrier; add matching field to qe-handoff | |

### How hard should the no-UI-selectors rule be?
| Option | Description | Selected |
|--------|-------------|----------|
| Hard rule line | Template rule + workflow reminder: declarative business language only, no CSS/HTML/selectors; UI detail behind step defs | ✓ |
| Guidance only | Note declarative-not-imperative as guidance; rely on persona judgment | |

**Notes:** Tiered form chosen to give executable-or-absent real teeth at `strict` while keeping `lean` markdown-light. Separate block keeps criteria (the bar) distinct from scenarios (the contract) for clean 1:1 traceability. Hard rule counters the verified LLM imperative-Gherkin failure mode.

---

## Three Amigos placement

### Where should the Three Amigos / Example Mapping step live?
| Option | Description | Selected |
|--------|-------------|----------|
| Separate checklist hub | New `example-mapping.md` that workflow 07 points to (mirrors definition-of-ready.md hub pattern) | ✓ |
| Inline substep in 07 | Fold directly into 07-backlog-refinement.md steps; no new file | |

### How should the `bdd` dial gate the step?
| Option | Description | Selected |
|--------|-------------|----------|
| off / lean / strict tiers | off=no step; lean=BA self-runs three voices; strict=named-participant ceremony + executable scenarios | ✓ |
| Always runs, depth varies | Minimal scenario pass always (even at off); lean vs strict only change formality | |

### Should the step force Example Mapping before scenarios are written?
| Option | Description | Selected |
|--------|-------------|----------|
| Example Mapping first | rules/examples/open-questions in the conversation; G/W/T written after, not live during the workshop | ✓ |
| Scenarios directly | Go straight to G/W/T; skip explicit Example Mapping framing | |

**Notes:** Hub choice is consistent with the Phase 11 single-source DoR hub decision. Dial tiers honor `off = no BDD scaffolding`. Example-Mapping-first preserves the discovery-conversation value (research: experienced teams leave Gherkin until after the workshop).

---

## Double-loop & ownership

### Who owns each loop?
| Option | Description | Selected |
|--------|-------------|----------|
| QE outer / engineer inner | Outer acceptance loop = QE/business-owned (qe-e2e.md + QE handoff); inner unit loop = engineer-owned (software-engineer.md + workflow 04) | ✓ |
| Engineer owns both | Engineer drives acceptance + units; QE reviews afterward | |

### Where should the double-loop rules be encoded?
| Option | Description | Selected |
|--------|-------------|----------|
| Workflow step + role limits | TDD red-green step in 04 + hard-limit lines in software-engineer.md and qe-e2e.md | ✓ |
| Workflow 04 only | Steps in 04 only; leave role prompts as-is | |

### How should "one behavior, exactly one test layer" be drawn?
| Option | Description | Selected |
|--------|-------------|----------|
| Contract-vs-logic seam + example | BDD asserts observable behavior (1 scenario=1 behavior); TDD unit asserts internal logic/edge cases; unit never re-asserts the observable outcome. Rule + worked example; enforcement → Phase 15 | ✓ |
| No-duplication rule only | State "no behavior at both layers" as a discipline line, no seam or example | |

**Notes:** The non-conflict story (layered, not competing — different owners + timescales) is the headline of the test-first theme. The worked example makes the seam followable rather than leaving the agent to infer where the line falls.

---

## TDD evidence + runner

### What test-first evidence should the handoffs record, scaled by `quality.tdd`?
| Option | Description | Selected |
|--------|-------------|----------|
| Tiered evidence | Add test-first/red-green field to impl handoff (+ acceptance side in QE handoff). off=none; encouraged=tests-written note; required=red-then-green as actually run. No-fabrication floor: UNKNOWN - verify if not run | ✓ |
| Flat note | Keep existing tests-added/commands-run fields; no dedicated test-first field | |

### Should a TDD test-strategy be planned upfront in the ready packet?
| Option | Description | Selected |
|--------|-------------|----------|
| Add to ready packet | implementation-ready-packet.md gains a terse test-strategy line read before coding | ✓ |
| No upfront strategy | Rely on scenarios + engineer judgment at code time | |

### How should the markdown-only kit point at a real BDD/TDD runner?
| Option | Description | Selected |
|--------|-------------|----------|
| AGENTS.md slot + workflow refs | Minimal acceptance/BDD command slot in AGENTS.md (one line, under byte budget); runner names (Cucumber/Behave/Playwright-BDD) only in workflow/checklist; UNKNOWN - verify when absent; routed just-in-time | ✓ |
| Reuse existing slots, name no runners | No BDD slot, no runner names; reuse existing test/e2e slots; fully tool-agnostic | |

**Notes:** No-fabrication floor preserved on the red-green evidence ("the trace is the proof"). AGENTS.md slot makes executable-or-absent actually runnable without embedding per-stack config (avoids the bloat + single-source pitfalls).

---

## Claude's Discretion

Areas the user delegated (user chose "I'm ready for context" — defaults applied, see CONTEXT.md D-13/D-14 + Claude's Discretion):
- UAT/upstream scenario carry scoped to a light forward-pointer (not a deep BDD rewrite of `06-uat-pack.md` / `02/03`) — D-13.
- Scenario→trace linkage as an additive comment-documented convention (no schema rename) — D-14.
- Exact handoff field wording/ordering; the `example-mapping.md` hub content; the contract-vs-logic worked example; the exact AGENTS.md slot name; caveman-voice phrasing of new role lines; `strict` scenario-file location/extension convention.

## Deferred Ideas

- Mechanical enforcement (executable-or-absent, no-unjustified-skip, no-duplication) → Phase 15 test-integrity gate.
- Lint + UI/E2E (Playwright) in the §14 gate → Phase 15.
- Frontend/UI persona + UI design→build workflow → Phase 13.
- OWASP ASVS security audit → Phase 14.
- Deep BDD rewrite of UAT/upstream workflows → out of scope (light forward-pointer only).
- Mutation-testing step / `quality.mutation_testing` key → future milestone (no new keys; no bundled runtime).
- 1:1 scenario→trace schema columns → kept as additive convention only.
- TypeScript pivot (project-level, HELD) → stays markdown + POSIX sh.
