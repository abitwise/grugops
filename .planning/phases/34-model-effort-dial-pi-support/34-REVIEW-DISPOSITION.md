---
phase: 34
review: 34-REVIEW.md
titles: json
findings:
  - id: WR-08
    severity: warning
    disposition: open
    title: "The effort level-set cross-check misses a dropped `effort:` line whenever the set does not change, but three comments say such a drop is refused"
  - id: WR-09
    severity: warning
    disposition: open
    title: "The WIN-1 census checks a hand-picked list of comparison sites, and a second absoluteness rule over recorded paths sits outside it"
  - id: WR-10
    severity: warning
    disposition: open
    title: "The read-only \"user mode edit\" removed the only end-to-end test of the pointer-file mode check in uninstall"
  - id: IN-06
    severity: info
    disposition: deferred
    title: "The per-adapter install line names the model but not the effort level that was read"
  - id: IN-07
    severity: info
    disposition: deferred
    title: "The two dials' shape checks differ"
  - id: IN-08
    severity: info
    disposition: deferred
    title: "`canonicalPathSpelling` does not fold the `\\\\.\\` device-namespace prefix"
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
open: 3
total: 18
recorded: 2026-10-08T21:07:02.422Z
---

# Phase 34: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-08 | warning | open | Gap round 2 input (human, 2026-10-09): compare the rendered and transformed dials member by member, fold IN-07 into the same check |
| WR-09 | warning | open | Gap round 2 input (human, 2026-10-09): bring `isAbsoluteMarkerPath` under the WIN-1 census, together with WINDOWS.md row 319 |
| WR-10 | warning | open | Gap round 2 input (human, 2026-10-09): add one end-to-end row that reaches the uninstall pointer-file mode check with a writable, mode-changed file |
| IN-06 | info | deferred | Same item as R15 (the per-adapter report line omits the effort level, install.ts:3627); a user-visible output change that waits on the human backlog triage of R15 |
| IN-07 | info | deferred | Harmless today (both shape checks accept the same counts); folded into the gap round 2 fix for WR-08, which should route both dials through one shape check |
| IN-08 | info | deferred | `canonicalPathSpelling` leaves the `\\.\` device-namespace prefix unfolded, so such a path fails closed (no false match), and no current write path records that spelling |
| WR-01 | warning | deferred | Detection reads grugops's own writes for `.pi`, `.github` and `.gemini`; the `tools detected:` line drives no write. A fix changes the HOST-01 detection contract for three hosts at once; D-20 keeps it out of gap round 1. The registry docstring that says the opposite (install/host-tools.ts:54) is a DOC-1 member left for the same fix. Carried in deferred-items.md (not in the current review) |
| WR-02 | warning | deferred | The unconditional Pi write is decision D-17; turning a non-directory `.pi` into `skipped` changes the exit-code contract and needs a human decision. Nothing is overwritten, so the install stays additive. Carried in deferred-items.md (not in the current review) |
| WR-03 | warning | fixed | plan 34-15: effort arm added to the installer's announcement cross-check (commits 6560d5ec, 827d3980) (not in the current review) |
| WR-04 | warning | deferred | Raw control bytes in refusal text is the P32.1 published-message class; it predates phase 34 in the `models` block and was copied into `models.effort`; both blocks are fixed together through `quoteValue`. Accepted for this round as T-34-46. Carried in deferred-items.md (not in the current review) |
| WR-05 | warning | deferred | The closing safety line is correct today (the hosts with no ask rules are exactly the sequential ones); an `askRules` registry field is a HOST-01 contract change. Carried in deferred-items.md (not in the current review) |
| WR-06 | warning | fixed | plan 34-16: Pi kit discovery after a scripted install marked UNKNOWN - verify in the install guide and adapters.md, sibling sentences pointed at it (commits 056ee6df, b0dcd631) (not in the current review) |
| WR-07 | warning | fixed | plan 34-17 Task 1: claim corrected; the installer does not set GRUGOPS_PROJECT_DIR, and workflow 16, TRUSTED_ROOT_TIERS and the context-io.ts docstrings now say so (commit 06a8e77b) (not in the current review) |
| IN-01 | info | deferred | Three per-host row matchers disagree but all fail closed today; unify them in one module together with IN-02. Carried in deferred-items.md (not in the current review) |
| IN-02 | info | deferred | The validator only warns on an unrecognisable table while the UAT oracle fails red on it; its comment ("never passed silently") overstates, a DOC-1 member left with IN-01. Carried in deferred-items.md (not in the current review) |
| IN-03 | info | deferred | The Pi template is create-only; this round changes documentation, not `PI_PROMPT_TEXT`, so no installed template is stale. A refresh rule belongs with the next template change. Carried in deferred-items.md (not in the current review) |
| IN-04 | info | deferred | The effort-rationale floor inside `tieredTableRefusals` couples the model preset to effort rows that are complete today; split it or document the shared floor. Carried in deferred-items.md (not in the current review) |
| IN-05 | info | deferred | The validator does not ask `readModelsConfig`; pre-existing for the model dial, widened by effort. Carried in deferred-items.md (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
