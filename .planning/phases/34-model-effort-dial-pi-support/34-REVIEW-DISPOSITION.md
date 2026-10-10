---
phase: 34
review: 34-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "`--check` says Gemini CLI reaches the Orchestrator through AGENTS.md without checking whether Gemini reads AGENTS.md at all"
  - id: WR-01
    severity: warning
    disposition: open
    title: "The doctor's \"install's own, stale\" verdict is a second copy of the refresh rule, and it disagrees with install on links (its remedy is false and the FAIL never clears)"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Install's `note` and the doctor's WARN say a host \"gets no route to the kit\" while the same run's `reach` line says that host reaches it"
  - id: WR-03
    severity: warning
    disposition: open
    title: "`--check --strict` now fails a target whose user deleted the optional Copilot pointer or Pi template, even though every host reaches the Orchestrator"
  - id: WR-04
    severity: warning
    disposition: open
    title: "Block-carrier facts are hand-typed in several places with no test binding them (ROUTE_BLOCKS vs BLOCK_RELS, the Copilot path, the sentinels)"
  - id: WR-05
    severity: warning
    disposition: open
    title: "refreshOwnFile decides ownership from one read and overwrites using a second read it never re-checks"
  - id: IN-01
    severity: info
    disposition: open
    title: "The kitRouteFindings header says readUserFile never opens a link; readUserFile follows links"
  - id: IN-02
    severity: info
    disposition: open
    title: "The marker route depends on a per-machine absolute path, and nothing says whether `.grugops/install.json` is committed"
  - id: IN-03
    severity: info
    disposition: open
    title: "The INCOMPLETE closings drop facts the complete branches print"
  - id: IN-04
    severity: info
    disposition: open
    title: "The uninstall malformed-ledger arm calls updateKeptMarker for nothing"
  - id: IN-05
    severity: info
    disposition: open
    title: "The uninstall \"preserved (never touched)\" heading now precedes a line that can say the marker was removed"
  - id: IN-06
    severity: info
    disposition: open
    title: "The install guide's AGENTS.md bullet still says \"only when the target has none\""
  - id: WR-11
    severity: warning
    disposition: deferred
    title: "A Windows-written marker on a POSIX checkout is now \"not install's marker\", so install never replaces it and writes no ask rules (WIN-1, a side effect of the WR-09 fix)"
  - id: WR-12
    severity: warning
    disposition: fixed
    title: "The closing banner says ask rules were written even when none were"
  - id: IN-09
    severity: info
    disposition: deferred
    title: "The freshness gate's per-adapter zero-config value check cannot be reached (executor flag confirmed)"
  - id: IN-10
    severity: info
    disposition: deferred
    title: "`AnnouncedAssignment.aliases`, `.effort.levels` and both `overrides` are now read and never used"
  - id: IN-11
    severity: info
    disposition: deferred
    title: "Every install now prints two relay lines of about 717 characters"
  - id: IN-12
    severity: info
    disposition: deferred
    title: "Denylist `p === TARGET` triage (34-21 flag): no evasion today, but by convention only, and one classified reason is inaccurate"
  - id: IN-13
    severity: info
    disposition: deferred
    title: "The `isRecordedAbsolute` docstring and table omit the win32 rooted, drive-less spelling, the row-319 shape"
  - id: WR-08
    severity: warning
    disposition: fixed
    title: "The effort level-set cross-check misses a dropped `effort:` line whenever the set does not change, but three comments say such a drop is refused"
  - id: WR-09
    severity: warning
    disposition: fixed
    title: "The WIN-1 census checks a hand-picked list of comparison sites, and a second absoluteness rule over recorded paths sits outside it"
  - id: WR-10
    severity: warning
    disposition: fixed
    title: "The read-only \"user mode edit\" removed the only end-to-end test of the pointer-file mode check in uninstall"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "The two dials' shape checks differ"
  - id: IN-08
    severity: info
    disposition: deferred
    title: "`canonicalPathSpelling` does not fold the `\\\\.\\` device-namespace prefix"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "The new \"Using grugops on Pi\" section presents a working flow that backlog 999.4 records as `UNKNOWN - verify`"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "Phase-34 edits re-assert, and widen to Pi, a claim that \"the installer sets `GRUGOPS_PROJECT_DIR`\", which no code does"
open: 12
total: 26
recorded: 2026-10-10T12:03:02.584Z
---

# Phase 34: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| WR-11 | warning | deferred | Windows is out of scope during active development (human, 2026-10-09, D-25). On a POSIX checkout, install leaves a Windows-written marker unchanged, writes no ask rules and exits 3 until a hand edit; nothing is deleted (34-REVIEW.md WR-11). Deferred with Windows support. Carried in deferred-items.md (not in the current review) |
| WR-12 | warning | fixed | plan 34-25: writeAskRules returns an AskRulesOutcome on every exit and the install closing notes print the ask-rules sentence from that outcome only (D-25) (commits baa8d073, 413cddd8); plan 34-26: the --update banner and status come from VERIFY_FINDINGS, and the --migrate and uninstall closing lines say what the run did, siblings A, B and C (D-25) (commits afe94f40, 39ff1558, efe81f3e) (not in the current review) |
| IN-09 | info | deferred | Outside gap round 3's scope (D-25: G-34-2 and G-34-4 only). The per-adapter zero-config value branch in scripts/adapters-freshness.ts is unreachable while validator rule 8 holds; say so in its comment or drop it. Owner: backlog triage (not in the current review) |
| IN-10 | info | deferred | Outside gap round 3's scope (D-25: G-34-2 and G-34-4 only). AnnouncedAssignment.aliases, .effort.levels and both overrides are read and never used, and the announcementShape docstring describes a use that no longer exists; harmless. Owner: backlog triage (not in the current review) |
| IN-11 | info | deferred | Outside gap round 3's scope (D-25: G-34-2 and G-34-4 only). The two relayed announcement lines are about 717 characters each; relay the summary fields or wrap the map, a user-visible output change. Owner: backlog triage (not in the current review) |
| IN-12 | info | deferred | Outside gap round 3's scope (D-25: G-34-2 and G-34-4 only). No evasion today, but both denylist operands share one spelling by convention only, and the install classification reason names TARGET where the kit-home operand comes from GRUGOPS_HOME. Owner: backlog triage (not in the current review) |
| IN-13 | info | deferred | Windows is out of scope during active development (human, 2026-10-09, D-25). The win32 rooted, drive-less spelling fails closed as other-directory today; the docstring sentence and the two table rows are deferred with Windows support (not in the current review) |
| WR-08 | warning | fixed | plan 34-19: the generator announces the per-role map of both dials and the freshness gate reads it (D-24) (commits 37e98a97, 90b044ff); plan 34-20: the installer compares each adapter's rendered and written values with that map, member by member, and the verifier's dropped-line reproduction is a committed refusal row, exit 3, 0 adapters (D-22, D-24) (commits c0fa273c, 92333ee1) (not in the current review) |
| WR-09 | warning | fixed | plan 34-21: one absoluteness rule for recorded paths (isRecordedAbsolute in install/user-file.ts), the install marker check asks it, isOwnLink compares through the one spelling (sameRecordedPath), and the WIN-1 census derives its comparison and absoluteness sites from the syntax tree with asserted counts (commits 03428cc1, 6d8cdaea) (not in the current review) |
| WR-10 | warning | fixed | plan 34-22: end-to-end rows for writable chmod-only pointer files (CLAUDE.md and the Copilot file) reach the uninstall pointer-file mode check, capability-gated, Windows skip recorded as WINDOWS.md row 321 (commits adab0500, dda5664e) (not in the current review) |
| IN-07 | info | fixed | plan 34-19: one payload serialiser and one validator for both dials in scripts/model-tiers.ts (commits 37e98a97, 90b044ff); plan 34-20: one installer shape check, announcementShape, asked once per dial (commits c0fa273c, 92333ee1) (not in the current review) |
| IN-08 | info | deferred | `canonicalPathSpelling` leaves the `\\.\` device-namespace prefix unfolded, so such a path fails closed (no false match), and no current write path records that spelling (not in the current review) |
| WR-06 | warning | fixed | plan 34-16: Pi kit discovery after a scripted install marked UNKNOWN - verify in the install guide and adapters.md, sibling sentences pointed at it (commits 056ee6df, b0dcd631) (not in the current review) |
| WR-07 | warning | fixed | plan 34-17 Task 1: claim corrected; the installer does not set GRUGOPS_PROJECT_DIR, and workflow 16, TRUSTED_ROOT_TIERS and the context-io.ts docstrings now say so (commit 06a8e77b) (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
