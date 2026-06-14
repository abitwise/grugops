# Phase 16: §14 Gate Convergence — Lint, UI/E2E & Test-Integrity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 16-14-gate-convergence-lint-ui-e2e-test-integrity
**Areas discussed:** Skip-justification design, Content placement, Self-fix & terminal mapping, Lint step specifics (+ skip-count mechanism, surfaced mid-discussion)

Started warm from `16-PRE-DECISIONS.md` (three pre-locked decisions + four identified-but-undiscussed gray areas). User selected all four areas.

---

## Skip-justification design (TINT-01/02)

### Registry home
| Option | Description | Selected |
|--------|-------------|----------|
| plans/test-skips.md | Sibling of board.md/traceability.md; human-owned markdown | |
| .grugops/test-skips.md | Next to factory.config.json in the state/config dir | ✓ |
| You decide | — | |

**User's choice:** `.grugops/test-skips.md`

### Un-cheatable mechanism
| Option | Description | Selected |
|--------|-------------|----------|
| Process floor | Human-owned registry + test-integrity human-only (outside self-fix lane); checker validates format only | ✓ |
| Process floor + git signoff | Adds commit-authorship/Signed-off-by verification | |
| You decide | — | |

**User's choice:** Process floor
**Notes:** Git-signoff rejected as fragile when agent and human share git config.

### Entry format
| Option | Description | Selected |
|--------|-------------|----------|
| Markdown table | Columns: Test ID \| Reason \| Owner \| Ticket/REQ \| Expiry \| Category | ✓ |
| Fenced YAML block | Stricter parse, breaks from kit's markdown-table convention | |
| You decide | — | |

**User's choice:** Markdown table

### Closed-list categories
| Option | Description | Selected |
|--------|-------------|----------|
| Adopt proposed 5 | flaky-quarantine (non-blocking), external-dependency, wip-behind-flag, platform-specific, deprecated-pending-removal | ✓ |
| Leaner set of 3 | Just flaky-quarantine, external-dependency, wip-behind-flag | |
| You decide | — | |

**User's choice:** Adopt proposed 5
**Notes:** Quarantine modeled as a category; valid+unexpired counts as justified (non-blocking), blocks on expiry. Gate fails when host-skips > valid justifications or any entry expired.

---

## Content placement (single-source tension)

### Placement strategy
| Option | Description | Selected |
|--------|-------------|----------|
| Reference-not-embed | Gate (05) stays lean + points to sibling reference artifacts for bulky recipe/table | ✓ |
| Inline in 05 | Full recipe + table in 05; balloons the file | |
| You decide | — | |

**User's choice:** Reference-not-embed

### Artifact home
| Option | Description | Selected |
|--------|-------------|----------|
| Reuse checklists/ | Extend accessibility-checklist.md (axe-core) + new siblings for Playwright recipe + linter table | ✓ |
| New references/ dir | New top-level dir distinct from checklists | |
| You decide | — | |

**User's choice:** Reuse checklists/

### Workflow 14 tool names
| Option | Description | Selected |
|--------|-------------|----------|
| Keep WF14 tool-neutral | Tool names named once at the gate; WF14 keeps deferring to 05 | ✓ |
| Name tools in WF14 too | Embed Playwright/axe in 14 — forks tooling source-of-truth | |
| You decide | — | |

**User's choice:** Keep WF14 tool-neutral

---

## Self-fix & terminal mapping

### Fix lanes
| Option | Description | Selected |
|--------|-------------|----------|
| Code yes, goalposts no | Lint agent-fixable; UI/E2E agent-fixable for code/a11y but baseline acceptance human-only; test-integrity human-only | ✓ |
| Conservative | Lint agent-fixable; UI/E2E entirely human-only; test-integrity human-only | |
| You decide | — | |

**User's choice:** Code yes, goalposts no

### Terminal mapping for human-only failures
| Option | Description | Selected |
|--------|-------------|----------|
| Short-circuit to BLOCKED | Human-only failures route straight to BLOCKED_NEEDS_FIX, don't burn self-fix budget | ✓ |
| Consume loop then block | Pass through the loop first | |
| You decide | — | |

**User's choice:** Short-circuit to BLOCKED

### Dial composition
| Option | Description | Selected |
|--------|-------------|----------|
| They compose | advisory downgrades pipeline action; finding still emitted loudly (trace intact) | ✓ |
| Test-integrity hard floor | block always hard-blocks regardless of advisory | |
| You decide | — | |

**User's choice:** They compose
**Notes:** TINT-03 floor = never silent / never off, not a forced hard stop; advisory is not silent.

---

## Lint step specifics

### Linter table
| Option | Description | Selected |
|--------|-------------|----------|
| Adopt proposed table | ESLint 9 flat (Vue) default; Biome caveat; Ruff (Python); golangci-lint (Go); unknown → UNKNOWN - verify | ✓ |
| You decide | — | |

**User's choice:** Adopt proposed table

### quality.lint wiring
| Option | Description | Selected |
|--------|-------------|----------|
| Standard mapping | strict → fail-on-warning; autofix → safe-fix then recheck then report; autofix inside bounded loop | ✓ |
| You decide | — | |

**User's choice:** Standard mapping

### No-linter handling
| Option | Description | Selected |
|--------|-------------|----------|
| (initial pick) Silently treat as pass | Skip lint, return green | (retracted) |
| Record UNKNOWN, don't hard-block | Always record UNKNOWN - verify (never fake pass); UNKNOWN is non-blocking/surfaced | ✓ |
| Record UNKNOWN, treat as not-passing | UNKNOWN blocks until a human acts | |

**User's choice:** Record UNKNOWN, don't hard-block
**Notes:** User initially chose "treat as pass." Flagged as a direct conflict with the CLAUDE.md no-fabrication hard constraint ("never fake a passing gate") and the trace-is-proof value prop. Re-framed the fork: the constraint governs what is *recorded* (never fabricate "passed"), separable from whether an honest UNKNOWN blocks. User adopted the reconciled middle — honest UNKNOWN, non-blocking — which satisfies both intent and constraint.

---

## Skip-count mechanism (surfaced mid-discussion, not in original four)

| Option | Description | Selected |
|--------|-------------|----------|
| JUnit XML report | Checker reads <testsuite skipped="N"> from a cross-stack JUnit report | |
| Explicit count input | Gate captures the runner's skip count via a configured AGENTS.md command slot, passes the integer to the checker | ✓ |
| Leave to research/planning | Mark as Claude's-discretion | |

**User's choice:** Explicit count input
**Notes:** Keeps grugops stack-agnostic — host owns the count-capture command (never invented by grugops); `UNKNOWN - verify` if undeterminable. Un-cheatable format validation stays inside the checker.

---

## Claude's Discretion

- Exact host-committed path/filename the checker materializes to (inherit Phase-15 convention).
- RED-fixture shape and home (mirror `scripts/runnable-ref/fixtures/` + `*.test.ts`).
- Exact AGENTS.md command-slot name for skip-count capture + per-stack example patterns.
- Wording/structure of the two new `checklists/` files and the `accessibility-checklist.md` extension.
- Ordering of new gate steps relative to `install → lint → typecheck → unit → build → e2e`.

## Deferred Ideas

- Git-authorship/signoff verification of registry entries (rejected as fragile; revisit only if a stronger guarantee is demanded).
- Native per-framework skip-syntax parsing (rejected — explicit-count-input keeps grugops stack-agnostic).
- Biome as default linter (kept as caveated alternative, not default).
