---
phase: 34
review: 34-REVIEW.md
titles: json
findings:
  - id: WR-13
    severity: warning
    disposition: fixed
    title: "The doctor says install will not write a block carrier whose install block is gone, but install re-appends the block and the WARN clears (one rule, two derivations)"
  - id: WR-14
    severity: warning
    disposition: fixed
    title: "The Gemini gate says \"Gemini CLI does not read AGENTS.md here\" for every settings shape install refuses to merge, including one whose own reason says which `context` Gemini reads is not known"
  - id: WR-15
    severity: warning
    disposition: fixed
    title: "A linked `.gemini/settings.json` that lists AGENTS.md: the doctor says Gemini reads it and reaches, while install on the same file exits 3 and says to add AGENTS.md by hand"
  - id: WR-16
    severity: warning
    disposition: fixed
    title: "Install's own `--symlink` AGENTS.md link: the doctor says install made it, the re-install's verify says install did not, and the by-hand remedy edits a file outside the target"
  - id: IN-14
    severity: info
    disposition: fixed
    title: "`hostsReading` is now a dead product export, and it gives the ungated \"could read\" answer"
  - id: IN-15
    severity: info
    disposition: fixed
    title: "The Gemini gate's `why` states what Gemini CLI reads without reading user-level settings"
  - id: IN-16
    severity: info
    disposition: fixed
    title: "An absent carrier's uncounted note says \"the hosts that read it here\""
  - id: IN-17
    severity: info
    disposition: fixed
    title: "The by-hand remedy says \"after its start-here sentence\" for files that have none"
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "`--check` says Gemini CLI reaches the Orchestrator through AGENTS.md without checking whether Gemini reads AGENTS.md at all"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The doctor's \"install's own, stale\" verdict is a second copy of the refresh rule, and it disagrees with install on links (its remedy is false and the FAIL never clears)"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Install's `note` and the doctor's WARN say a host \"gets no route to the kit\" while the same run's `reach` line says that host reaches it"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "`--check --strict` now fails a target whose user deleted the optional Copilot pointer or Pi template, even though every host reaches the Orchestrator"
  - id: WR-04
    severity: warning
    disposition: deferred
    title: "Block-carrier facts are hand-typed in several places with no test binding them (ROUTE_BLOCKS vs BLOCK_RELS, the Copilot path, the sentinels)"
  - id: WR-05
    severity: warning
    disposition: deferred
    title: "refreshOwnFile decides ownership from one read and overwrites using a second read it never re-checks"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "The kitRouteFindings header says readUserFile never opens a link; readUserFile follows links"
  - id: IN-02
    severity: info
    disposition: deferred
    title: "The marker route depends on a per-machine absolute path, and nothing says whether `.grugops/install.json` is committed"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "The INCOMPLETE closings drop facts the complete branches print"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "The uninstall malformed-ledger arm calls updateKeptMarker for nothing"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "The uninstall \"preserved (never touched)\" heading now precedes a line that can say the marker was removed"
  - id: IN-06
    severity: info
    disposition: fixed
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
open: 0
total: 34
recorded: 2026-10-10T17:48:26.699Z
---

# Phase 34: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-13 | warning | fixed | plan 34.1-11, D-15: one owner, installWouldWrite in install/install.ts, answers refresh, append, create or none for install and the doctor alike, so --check names the re-run that appends the block; class-matrix assertion (10) holds the append (commits 710bb94c, a27d03dc, 6f6e3376) |
| WR-14 | warning | fixed | Dissolved by 34.1 D-12: the install-side Gemini merge, gate and readGeminiContext were deleted (plan 34.1-03, commits 835bbf89, 91231f1d); Antigravity CLI replaces Gemini CLI (plan 34.1-04, commits 478e4324, 226a64c9) |
| WR-15 | warning | fixed | Dissolved by 34.1 D-12: the install-side Gemini merge, gate and readGeminiContext were deleted (plan 34.1-03, commits 835bbf89, 91231f1d); Antigravity CLI replaces Gemini CLI (plan 34.1-04, commits 478e4324, 226a64c9) |
| WR-16 | warning | fixed | plan 34.1-11, D-16: linkOwnership in install/install.ts answers whose link AGENTS.md is for the doctor and the re-install, one reason and one remedy (remove the link at AGENTS.md and re-run install.js) (commits a27d03dc, 6f6e3376) |
| IN-14 | info | fixed | plan 34.1-03, D-17: the hostsReading export is deleted and held out by the D-12 census in install/installer-fs-census.test.ts (commit 91231f1d) |
| IN-15 | info | fixed | Dissolved by 34.1 D-12: the install-side Gemini merge, gate and readGeminiContext were deleted (plan 34.1-03, commits 835bbf89, 91231f1d); Antigravity CLI replaces Gemini CLI (plan 34.1-04, commits 478e4324, 226a64c9) |
| IN-16 | info | fixed | plan 34.1-11, D-17: the absent carrier's note says "the hosts that would read it" (commit a27d03dc) |
| IN-17 | info | fixed | plan 34.1-11, D-17: the by-hand remedy says "after the start-here sentence, if the file has one" (commit a27d03dc) |
| CR-01 | critical | fixed | plan 34-32: the Gemini row's entryGates and one owner, hostReadsCarrier, asking ENTRY_GATE_CHECKS over this repository's .gemini/settings.json through readGeminiContext; the remedy reads geminiMergePlan (D-27) (commits 242a55fb, d8b6b2da) (not in the current review) |
| WR-01 | warning | fixed | plan 34-34: one predicate, refreshable, decides refresh for refreshOwnFile, ensureBlock and the doctor, so a link install made gets a WARN with the by-hand remedy; the absent arm asks readForWrite (D-27) (commits 1b91bc2d, 10bcf91f) (not in the current review) |
| WR-02 | warning | fixed | plan 34-33: one derivation, strandedBy, for the doctor's counted lines and install's route notes over the state the run leaves, so a note names only the hosts left without any route (D-27) (commits 1327ac26, e6a36b9d) (not in the current review) |
| WR-03 | warning | fixed | plan 34-33: a carrier without the route is counted only when strandedBy names a host, otherwise an uncounted note, so --check --strict passes when every host reaches (D-27) (commits 1327ac26, e6a36b9d) (not in the current review) |
| WR-04 | warning | deferred | Deferred by the human (D-27 point 5). The block-carrier sets agree today, and the 34-35 install-and-doctor agreement assertion turns red if install and the doctor classify a carrier differently. Owner: backlog triage. Carried in deferred-items.md (not in the current review) |
| WR-05 | warning | deferred | Deferred (D-27 point 5). The read-gate-write window is shorter than the documented writeTargetFile residual, and plan 34-34 kept refreshOwnFile's read order without widening it. Owner: installer write-path hardening backlog. Carried in deferred-items.md (not in the current review) |
| IN-01 | info | fixed | plan 34-32: the kitRouteFindings header says a link is followed, as a host would follow it (D-27) (commit 242a55fb) (not in the current review) |
| IN-02 | info | deferred | Deferred (D-27 point 5). Both failure modes fail closed into STOP, and whether to commit .grugops/install.json is a human decision about shared state. Owner: human triage. Carried in deferred-items.md (not in the current review) |
| IN-03 | info | deferred | Deferred (D-27 point 5). No false claim is printed, and adding the dropped facts changes user-visible output. Owner: backlog. Carried in deferred-items.md (not in the current review) |
| IN-04 | info | deferred | Deferred (D-27 point 5). Harmless dead call, in uninstall.ts, which this round does not touch. Owner: backlog. Carried in deferred-items.md (not in the current review) |
| IN-05 | info | deferred | Deferred (D-27 point 5). Cosmetic; the marker line under the heading is accurate. Owner: backlog. Carried in deferred-items.md (not in the current review) |
| IN-06 | info | fixed | plan 34-36: the install guide's AGENTS.md bullet says the file is refreshed when it is install's own unedited copy, bound by a doc-truth case (D-27) (commits e7492436, 2305ff21) (not in the current review) |
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
