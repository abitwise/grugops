---
phase: 34
review: 34-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: deferred
    title: "Host detection reads the installer's own writes as proof of use, so `pi` is reported in every re-installed repository"
  - id: WR-02
    severity: warning
    disposition: deferred
    title: "Any non-directory `.pi` entry now makes every install exit 3 \"INCOMPLETE\", even for users who never use Pi"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The installer cross-checks rendered MODEL aliases against the announcement but has no effort arm (the fix lives in one arm only)"
  - id: WR-04
    severity: warning
    disposition: deferred
    title: "Raw control bytes and newlines from config keys are interpolated into effort refusals that the installer and guards print"
  - id: WR-05
    severity: warning
    disposition: deferred
    title: "The installer's closing safety line derives \"gets documentation only\" from `dispatch`, which is the wrong attribute"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "The new \"Using grugops on Pi\" section presents a working flow that backlog 999.4 records as `UNKNOWN - verify`"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "Phase-34 edits re-assert, and widen to Pi, a claim that \"the installer sets `GRUGOPS_PROJECT_DIR`\", which no code does"
  - id: IN-01
    severity: info
    disposition: deferred
    title: "Three separate implementations of \"a per-host table row\" disagree on the same bytes"
  - id: IN-02
    severity: info
    disposition: deferred
    title: "The validator's dispatch-map check only warns when the table is unrecognisable"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "The Pi template is create-only, so a future change to `PI_PROMPT_TEXT` never reaches an installed repository"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "A blank `effortRationale` now also refuses the MODEL `tiered` preset"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "The structure validator does not validate the `models` / `models.effort` block"
open: 0
total: 12
recorded: 2026-10-07T10:51:32.089Z
---

# Phase 34: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | deferred | Detection reads grugops's own writes for `.pi`, `.github` and `.gemini`; the `tools detected:` line drives no write. A fix changes the HOST-01 detection contract for three hosts at once; D-20 keeps it out of gap round 1. The registry docstring that says the opposite (install/host-tools.ts:54) is a DOC-1 member left for the same fix. Carried in deferred-items.md |
| WR-02 | warning | deferred | The unconditional Pi write is decision D-17; turning a non-directory `.pi` into `skipped` changes the exit-code contract and needs a human decision. Nothing is overwritten, so the install stays additive. Carried in deferred-items.md |
| WR-03 | warning | fixed | plan 34-15: effort arm added to the installer's announcement cross-check (commits 6560d5ec, 827d3980) |
| WR-04 | warning | deferred | Raw control bytes in refusal text is the P32.1 published-message class; it predates phase 34 in the `models` block and was copied into `models.effort`; both blocks are fixed together through `quoteValue`. Accepted for this round as T-34-46. Carried in deferred-items.md |
| WR-05 | warning | deferred | The closing safety line is correct today (the hosts with no ask rules are exactly the sequential ones); an `askRules` registry field is a HOST-01 contract change. Carried in deferred-items.md |
| WR-06 | warning | fixed | plan 34-16: Pi kit discovery after a scripted install marked UNKNOWN - verify in the install guide and adapters.md, sibling sentences pointed at it (commits 056ee6df, b0dcd631) |
| WR-07 | warning | fixed | plan 34-17 Task 1: claim corrected; the installer does not set GRUGOPS_PROJECT_DIR, and workflow 16, TRUSTED_ROOT_TIERS and the context-io.ts docstrings now say so (commit 06a8e77b) |
| IN-01 | info | deferred | Three per-host row matchers disagree but all fail closed today; unify them in one module together with IN-02. Carried in deferred-items.md |
| IN-02 | info | deferred | The validator only warns on an unrecognisable table while the UAT oracle fails red on it; its comment ("never passed silently") overstates, a DOC-1 member left with IN-01. Carried in deferred-items.md |
| IN-03 | info | deferred | The Pi template is create-only; this round changes documentation, not `PI_PROMPT_TEXT`, so no installed template is stale. A refresh rule belongs with the next template change. Carried in deferred-items.md |
| IN-04 | info | deferred | The effort-rationale floor inside `tieredTableRefusals` couples the model preset to effort rows that are complete today; split it or document the shared floor. Carried in deferred-items.md |
| IN-05 | info | deferred | The validator does not ask `readModelsConfig`; pre-existing for the model dial, widened by effort. Carried in deferred-items.md |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
