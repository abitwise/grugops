# Phase 31: Autonomous Manual Testing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 31-autonomous-manual-testing
**Areas discussed:** Evidence note shape & SHA refusal, Spec location & authoring flow, Claude-in-Chrome lane bar, Loud skip & AST ban mechanics

---

## Evidence note shape & SHA refusal

| Option | Description | Selected |
|--------|-------------|----------|
| finding + artifact-ref pair | Gate re-run yields a stamped finding; artifact-ref carries sha / gate_run / content_hash; no new kind | ✓ |
| finding only, new fields | Provenance fields on the finding fence itself | |
| New `evidence` note kind | A seventh kind; reopens SCTX-01 and every parser | |

| Option | Description | Selected |
|--------|-------------|----------|
| Committed spec file bytes | sha256 of the `.uat.spec.ts` at `sha` | ✓ |
| Spec + Playwright JSON report | Bind to one run's output; report not committed | |
| Spec + transitive imports | Helper edits invalidate evidence; needs a resolver | |

| Option | Description | Selected |
|--------|-------------|----------|
| In admit() at write time | Verdict records gate HEAD; admit() refuses a differing sha naming both | ✓ |
| In the gate before emitVerdict | Earlier, but a second predicate outside the writer | |
| Both | Two predicates over one question | |

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence is input, human still signs | Named human owns `sign_off_acceptance` regardless | |
| Green evidence auto-advances In UAT → Ready | Ticket moves without a human when every scenario is stamped | ✓ (then bounded below) |
| Dial it per checkpoint config | Default human; config `allow` lets evidence advance | |

Follow-up (matrix conflict):

| Option | Description | Selected |
|--------|-------------|----------|
| Honour the matrix, keep default block | Auto-advance only when `checkpoints.sign_off_acceptance: allow`; default unchanged | ✓ |
| Change the default to allow | Ships auto-advance; reopens Phase 30 wording and GUARANTEES claim | |
| Add a distinct checkpoint id | New `advance_on_gate_evidence` checkpoint | |

**User's choice:** finding + artifact-ref; spec-bytes hash; refusal in admit(); auto-advance bounded by the Phase 30 dial with default `block`.
**Notes:** The auto-advance pick conflicted with `sign_off_acceptance` defaulting to `block` in `scripts/checkpoints.ts`; the user chose to honour the matrix rather than move the default.

---

## Spec location & authoring flow

| Option | Description | Selected |
|--------|-------------|----------|
| Target's E2E dir, `uat/` subfolder, `*.uat.spec.ts` | Rides `quality.ui_e2e` unchanged; suffix is the recognition key | ✓ |
| `.grugops/uat/specs/` | Beside board and context; needs a second Playwright project | |
| Beside the ticket's feature code | Colocated; needs a new glob | |

| Option | Description | Selected |
|--------|-------------|----------|
| QE/E2E authors; new step in workflow 06 | UAT Planner scenarios → QE/E2E spec via MCP → gate re-run | ✓ |
| UAT Planner authors directly | One role end to end | |
| New `browser-uat` role | 18th role; reopens the derived role count | |

| Option | Description | Selected |
|--------|-------------|----------|
| New kit checklist + pointer from install/README.md | `browser-uat-recipe.md` single source; README links it | ✓ |
| install/README.md only | Installer doc holds everything | |
| Per-adapter files | Five copies of one fact | |

| Option | Description | Selected |
|--------|-------------|----------|
| Pin literal in one checklist, asserted by a foundation guard | Same idiom as Playwright 1.62.1 pins | ✓ |
| Pin literal, refreshed by hand | Rely on the consistency audit | |
| Live `npm show` at gate time | Network call in the gate; new offline UNKNOWN | |

**User's choice:** all recommended options.
**Notes:** none.

---

## Claude-in-Chrome lane bar

| Option | Description | Selected |
|--------|-------------|----------|
| No path exists + reserved identity already refuses | Lane never calls emitVerdict; only human:<name> finding + artifact-ref; proven by test | ✓ |
| Hook denial on Chrome MCP tools during gate runs | Second predicate, Claude-Code-only | |
| Distinct `chrome-witness` identity refused by admit() | Third reserved identity to freeze | |

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse `claude auth status --json` probe, require loggedIn AND no ANTHROPIC_API_KEY | Fail-closed, deterministic; auth-method exposure is UNKNOWN - verify | ✓ |
| Ask the human to confirm presence at a checkpoint | Honest but detects nothing | |
| Trust Claude Code's own force-disable | Zero code; kit claims what it does not check | |

| Option | Description | Selected |
|--------|-------------|----------|
| Same grant as today: GRUGOPS_ADMISSION_APPROVED_BY via admission-guard | One human-grant mechanism | ✓ |
| Lane-specific `GRUGOPS_UAT_WITNESS` | Second human-set variable and hook rule | |
| Name typed into the UAT pack | Agent could author any name | |

| Option | Description | Selected |
|--------|-------------|----------|
| Lane absent by design, stated once in the recipe | No dead tool names on other hosts | ✓ |
| Generic attended lane with any MCP | Blurs witnessed vs gate evidence | |
| Loud skip line on every host | Noise where it was never possible | |

**User's choice:** all recommended options.
**Notes:** none.

---

## Loud skip & AST ban mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Materialized runnable in tools/grugops/, resolves the TARGET's own `typescript` | test-skip-integrity idiom; loud skip if typescript absent | ✓ |
| Bundle a minimal TS parser | Violates zero-shipped-deps | |
| grugops CI only | UATX-06 claim not true on a host | |

| Option (multi-select) | Description | Selected |
|--------|-------------|----------|
| expect/assert inside try/catch | Caught assertion can never fail the run | ✓ |
| expect inside if/else, ternary, logical operands, optional call | Conditional assertion may never execute | ✓ |
| test.skip / fixme / only / describe.skip and expect.soft | Skip-style and soft assertions | ✓ |
| Any test body with zero expect calls | Vacuous evidence | (deferred) |

| Option | Description | Selected |
|--------|-------------|----------|
| Two-stage fail-closed probe in the runnable | Playwright pkg, then `npx playwright --version` + browsers dir | ✓ |
| Just try to run the spec; classify launch failure | Regex over error strings | |
| Probe only MCP reachability at authoring time | Evidence floor unprobed | |

| Option | Description | Selected |
|--------|-------------|----------|
| Observation note with the marker text; ticket stays In UAT; no finding | Unstamped observation, no board move | ✓ |
| Failed-attempt note | Durable but semantically wrong | |
| Board comment only | Invisible to the trace | |

**User's choice:** all recommended options; zero-expect ban deferred.
**Notes:** none.

---

## Claude's Discretion

- Runnable file name and exact loud-skip marker wording (single exported constant, single emission point).
- Field order / rendering of `sha`, `gate_run`, `content_hash` in `index.md`.
- Lean vs enterprise tier listing for the browser-uat recipe in `00-index.md`.
- Phrasing of the QE/E2E exploration loop in workflow 06 within the Phase 29 writing profile.

## Deferred Ideas

- Refuse `*.uat.spec.ts` bodies with zero `expect` calls (vacuous evidence).
- Hash the spec's transitive imports.
- A distinct checkpoint id for evidence-backed advance.
