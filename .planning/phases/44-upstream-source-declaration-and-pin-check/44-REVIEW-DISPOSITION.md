---
phase: 44
review: 44-REVIEW.md
titles: json
findings:
  - id: IN-05
    severity: info
    disposition: open
    title: "`owns.prefixes` is validated but never applied to reads or refs"
  - id: IN-07
    severity: info
    disposition: open
    title: "Large listed-path sweeps fail with misleading reasons"
  - id: IN-08
    severity: info
    disposition: open
    title: "The git-message redaction replaces substrings, so a short listed path garbles the rest of git's line"
  - id: IN-09
    severity: info
    disposition: open
    title: "The `--manifest` refusal branches can never be reached, and the entry-manifest rule omits the blob-mismatch precedence"
  - id: IN-10
    severity: info
    disposition: open
    title: "No kit text says what to do with a `runnable-version-skew` line, and the contract row misdescribes the program it names"
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "A manifest path can forge the fence's blob id, so upstream text can close the fence early"
  - id: CR-02
    severity: critical
    disposition: fixed
    title: "Upstream-controlled cell text is printed with no fence, and Workflow 20 has it copied into BLOCKED reasons"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The partial-clone (lazy fetch) guard runs after the first object read and misses `extensions.partialClone`"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Reserving `BR` silently drops trace rows for existing `BR-<n>` tickets"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "After an upgrade install, `upstream:` refs silently vanish from traces and nothing reports the program mismatch"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "The contract does not say that every listed path must be a regular file at the pin, though `check` makes the whole source UNKNOWN when one is not"
  - id: IN-01
    severity: info
    disposition: open
    title: "`classifyRef` routes malformed `upstream:` refs to Requirement with no grammar check"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "`read --manifest` refuses an oversized, NUL-bearing or non-UTF-8 manifest with exit 2, not the exit-1 refusal the contract lists"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The header labels the check-output contract \"D-12\"; the pin states are D-13"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "`statSync(real)` outside the per-source handler can end the whole `check` report"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "The partial-clone test depends on the host git version"
open: 7
total: 16
recorded: 2026-11-25T16:26:16.139Z
---

# Phase 44: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| IN-05 | info | open | - |
| IN-07 | info | open | - |
| IN-08 | info | open | - |
| IN-09 | info | open | - |
| IN-10 | info | open | - |
| CR-01 | critical | fixed | plan 44-09 (057576b2, ad18cc2c); contract text plan 44-14 (4f666db1) (not in the current review) |
| CR-02 | critical | fixed | plan 44-10 (3483329a, 770b4515); kit text plan 44-13 (597f0fc8, e5c60883); contract text plan 44-14 (4f666db1) (not in the current review) |
| WR-01 | warning | fixed | plan 44-12 (e3a3eb3f, 30de3775) (not in the current review) |
| WR-02 | warning | open | - (not in the current review) |
| WR-03 | warning | fixed | plan 44-11 (cf3c11fb, 92f5e8ce); docs plan 44-14 (4f666db1, 4442d0d0) (not in the current review) |
| WR-04 | warning | fixed | plan 44-14 (4f666db1) (not in the current review) |
| IN-01 | info | open | - (not in the current review) |
| IN-02 | info | fixed | plan 44-14 (4f666db1) (not in the current review) |
| IN-03 | info | fixed | plan 44-10 (770b4515) (not in the current review) |
| IN-04 | info | fixed | plan 44-12 (30de3775) (not in the current review) |
| IN-06 | info | fixed | plan 44-12 (5856f551) (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
