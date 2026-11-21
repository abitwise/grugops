---
phase: "37"
slug: "overview-board-per-file-records-and-budgets"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-22"
---

# Phase 37 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Host repository files to the shipped runnables | `state-check.js`, `trace-render.js` and `state-roll.js` read (and the last two write) files in a host repository that any contributor or agent can edit | board, ticket, note, NFR, progress and trace markdown; file names; directory entries (symlinks, FIFOs) |
| Repository root to the rest of the filesystem | every runnable realpaths each path and refuses one outside the repository root | paths |
| Runnable output to the terminal and CI log | printed findings and file names pass through `stripControlChars` | repository-controlled text |
| Installer to an existing host repository | the installer adds runnables and seed files and writes the layout marker only on a fresh layout | installed files; the `memory-bank/plans/.layout` marker |

---

## Threat Register

42 distinct threats from the 19 plans' `<threat_model>` blocks (60 rows; `T-37-SC` repeats once per plan). Verified at ASVS level 1 by gsd-security-auditor on 2026-10-22, by reading the cited code and running the related test files one at a time with one worker.

| Threat ID | Plan | Category | Component | Severity | Disposition | Evidence | Status |
|-----------|------|----------|-----------|----------|-------------|----------|--------|
| T-37-01 | 01 | Spoofing | layout marker (a hand-planted marker switching a repo to FAIL, or an invalid one switching it to WARN) | low | accept | Accepted Risks Log | closed (accepted) |
| T-37-02 | 01 | Repudiation | contract budget table versus BUDGETS drifting apart | medium | mitigate | install/state-layout.test.ts:349-396 | closed |
| T-37-SC | all 19 | Tampering | npm/pip/cargo installs | low | accept | Accepted Risks Log | closed (accepted) |
| T-37-03 | 02 | Denial of service | checkBudgets reading a FIFO or a huge file at a ticket, NFR or trace path | medium | mitigate | scripts/validate-agent-factory.ts:810-880; validate.test.ts:3823 | closed |
| T-37-04 | 02 | Repudiation | a broken budget reported as clean on an unmarked tree | medium | mitigate | validate-agent-factory.ts:912-913, :1111; validate.test.ts:3703-3754 | closed |
| T-37-05 | 03 | Tampering | a hand edit inside a generated region drifting from the authority | high | mitigate | scripts/runnable-embeds-freshness.ts:19-40; ci.yml:239; generate-runnable-embeds.test.ts:193 | closed |
| T-37-06 | 03 | Elevation of privilege | a closure pulling a non-builtin module into a shipped runnable | high | mitigate | generate-runnable-embeds.ts:418-424; host-emulation tests in runnable-ref/*.test.ts | closed |
| T-37-08 | 03 | Denial of service | a FIFO or device at the board or marker path hanging state-check | medium | mitigate | runnable-ref/state-check.ts:1330-1384, :1654-1689; state-check.test.ts:218, :611 | closed |
| T-37-07 | 04 | Tampering | terminal control sequences in file names or titles printed by state-check | medium | mitigate | state-check.ts:586-594, :2066-2109; state-check.test.ts:492-528 | closed |
| T-37-31 | 04 | Denial of service | a FIFO or device at a state path hanging state-check | medium | mitigate | state-check.ts:1720-1736, :1947-1967, :2077-2087 | closed |
| T-37-09 | 05 | Tampering | NFR index link pointing outside nfr/ (path traversal) | medium | mitigate | state-rules.ts:412-415, :471-482; state-check.test.ts:747 | closed |
| T-37-10 | 05 | Tampering | a symlinked nfr/ or archive directory pointing outside the repository | medium | mitigate | state-check.ts:1629-1641, :1752-1857; state-check.test.ts:543, :924 | closed |
| T-37-29 | 05 | Denial of service | a directory keeper (`.gitkeep`) or OS metadata file reported as a bad NFR name, an unindexed NFR or a move-only copy, so every fresh v3 install and grugops's own tree would fail state-check in FAIL mode from birth and agents would be told to delete keepers | medium | mitigate | state-rules.ts:352-354; state-rules.test.ts:597-787 | closed |
| T-37-11 | 06 | Tampering | overwriting a hand-written traceability.md or trace file on an unmigrated host | high | mitigate | sequencing held (fc66553d before d64ecc80 before 94d70874); trace-render.ts:953 | closed |
| T-37-13 | 06 | Tampering | a symlinked traceability/ directory steering writes outside the repository | medium | mitigate | runnable-ref/trace-render.ts:779-797, :850-852; trace-render.test.ts:270 | closed |
| T-37-14 | 06 | Repudiation | unsealed or unreadable notes silently missing from the trace | medium | mitigate | trace-render.ts:211-215, :935-941; trace-render.test.ts:192-226 (see REVIEW CR-01: a read failure still removes a rendered file) | closed |
| T-37-33 | 07 | Tampering | overwriting a hand-written traceability.md or trace file on an unmigrated host | high | mitigate | trace-render.ts:251-297, :915-953 | closed |
| T-37-12 | 07 | Tampering | two identifiers folding to one file name overwriting each other on a case-insensitive disk | medium | mitigate | trace-render.ts:238-250, :910-953; trace-render.test.ts:485 | closed |
| T-37-41 | 07 | Denial of service | a directory keeper (`.gitkeep`) or OS metadata file in the trace directory read as a hand-written trace file, so the write mode refuses (exit 1) on every fresh v3 install and on grugops's own tree and the trace is never rendered | medium | mitigate | trace-render.ts:235-237, :290, :962-971; trace-model.test.ts:271, :320 | closed |
| T-37-34 | 07 | Repudiation | unsealed or unreadable notes silently missing from the trace | medium | mitigate | trace-render.ts:935-994; trace-render.test.ts:193-393 | closed |
| T-37-15 | 08 | Repudiation | trace freshness reported fresh without a compare (vacuous pass, or exit 2 mapped to fresh) | high | mitigate | scripts/trace-freshness.ts:54-100; trace-freshness.test.ts:165-215; ci.yml:244 (see REVIEW CR-02: an unreadable root exits 1, read as stale) | closed |
| T-37-30 | 09 | Repudiation | state-check reporting a host's trace as fresh when it did not compare (hand-written index skipped silently, or a reader refusal mapped to a pass) | medium | mitigate | state-check.ts:1951-1999; state-check.test.ts:1105-1187 | closed |
| T-37-32 | 09 | Denial of service | a FIFO or device at a trace file or note path hanging state-check | medium | mitigate | state-check.ts:1449-1509, :1947-1967; state-check.test.ts:1187 | closed |
| T-37-16 | 10 | Tampering | a partial or wrong roll losing or altering lines | high | mitigate | state-rules.ts:982-1135; state-roll.ts:1191-1215, :1674; state-rules.test.ts:1041-1180 | closed |
| T-37-17 | 10 | Tampering | a re-run after an interrupted roll doubling rows in the archive | medium | mitigate | sequencing held (a11c18f9 before c2f612fe before 94d70874); state-roll.ts:1522-1523 | closed |
| T-37-18 | 10 | Tampering | a symlinked archive directory steering writes outside the repository | medium | mitigate | state-roll.ts:1374-1454, :1640-1645; state-roll.test.ts:272 | closed |
| T-37-35 | 11 | Tampering | a partial or wrong progress roll losing or altering lines | high | mitigate | state-roll.ts:1581-1588, :1691, :1723; state-roll.test.ts:579 | closed |
| T-37-36 | 11 | Tampering | a re-run after an interrupted roll doubling rows or entries in the archive | medium | mitigate | state-roll.ts:1522-1523; state-rules.ts:1408; board-model.ts:1764-1783 | closed |
| T-37-19 | 12 | Repudiation | an unreadable or missing archive making archived tickets look placed, or hiding a real unplaced ticket | medium | mitigate | board-model.ts:1602-1614, :1747-1748; board-read.ts:1972-1985 | closed |
| T-37-20 | 12 | Tampering | the projector gaining a write path through the new source | low | mitigate | board-read.ts:1979-1984; board-readonly.test.ts | closed |
| T-37-21 | 13 | Tampering | the seed marker switching an unmigrated repository to FAIL with no migration | high | mitigate | install/install.ts:5714-5761; install.test.ts:908-967 | closed |
| T-37-22 | 13 | Repudiation | a runnable installed and never removable (reversibility gap) | medium | mitigate | install.ts:5790-5806; uninstall.ts:2795-2806; record-truth.test.ts:361 | closed |
| T-37-23 | 14 | Repudiation | a role prompt still telling an agent to hand-edit the trace, producing a trace no note backs | medium | mitigate | ten roles' Trace updates sections; scan zero hits | closed |
| T-37-37 | 15 | Repudiation | a role prompt still telling an agent to hand-edit the trace, producing a trace no note backs | medium | mitigate | seven roles' Trace updates sections; scan zero hits | closed |
| T-37-24 | 16 | Repudiation | WF05 reading a could-not-run or a signal-ended state-check as a pass | high | mitigate | agent-factory/workflows/05-pr-quality-gate.md:41 | closed |
| T-37-25 | 16 | Tampering | an agent pruning or squashing queue/done or 50-decisions | medium | mitigate | 09-daily-sweep.md:32; state-rules.ts:686-702; state-check.ts:2090-2091 | closed |
| T-37-27 | 16 | Repudiation | a workflow still telling an agent to hand-edit the trace, producing a trace no note backs | medium | mitigate | OPEN: 02-idea-to-epics.md:41 still says 'the trace rows are appended'; 03-epic-to-tickets.md:9 'a trace row' | open — below high threshold (non-blocking) |
| T-37-39 | 17 | Repudiation | a workflow still telling an agent to hand-edit the trace, producing a trace no note backs | medium | mitigate | workflows 06-08, 10, 11, 14, 15, 17, 18 Trace updates sections | closed |
| T-37-38 | 18 | Repudiation | a role prompt telling an agent to hand-edit the trace again after this phase | medium | mitigate | scripts/trace-instructions.test.ts:49-53, :155-168 | closed |
| T-37-40 | 18 | Repudiation | a workflow telling an agent to hand-edit the trace again after this phase | medium | mitigate | trace-instructions.test.ts:112-122 | closed |
| T-37-28 | 18 | Repudiation | the scan test passing over a short or empty file set | medium | mitigate | trace-instructions.test.ts:57-152 | closed |
| T-37-26 | 19 | Repudiation | FAIL mode claimed but never exercised on a real tree | medium | mitigate | memory-bank/plans/.layout; ci.yml:605-606; validate.test.ts:3642-3670 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

**Auditor notes (not counted as open):**
- The permanent hand-trace scan (`scripts/trace-instructions.test.ts`, patterns in `scripts/trace-model.ts:40-43`) needs the word "traceability" and a fixed verb list without "edit", "hand-edit" or "modify". Three kit lines pass it today: WF02:41, WF03:9 and `agent-factory/_commit-convention.md:52`.
- The CI wiring for T-37-05, T-37-15 and T-37-26 is in place, but a CI run stops before it today: the Vitest step carries the 20 baseline failures, and `check-diff-disposition` and `check-flip-manifest` fail earlier in the same gate block. All three predate this phase.
- Code review (37-REVIEW.md) found CR-01 (a task read failure makes trace-render remove that ticket's trace file and report fresh) and CR-02 (an unreadable root makes trace-render exit 1, which trace-freshness reads as stale). Both bear on T-37-14 and T-37-15; they are tracked in the review disposition, not in this register.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-37-01 | T-37-01 | The layout marker is a severity switch, not a security boundary; invalid content is reported by name (D-05) and WF05 records every finding | plan 37-01 threat model (human-approved plan set) | 2026-10-22 |
| AR-37-02 | T-37-SC | This phase installs no package: from the phase start to HEAD `package.json` gained only two scripts (`generate:runnable-embeds`, `freshness:runnable-embeds`), no dependency changed, and `package-lock.json` is unchanged | plans 37-01..37-19 threat models | 2026-10-22 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-22 | 42 | 41 | 1 (below threshold) | gsd-security-auditor (opus), /gsd-secure-phase 37 |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-22 (threats_open 0; T-37-27 open below the high threshold, carried to the verifier)

## Security Audit 2026-10-22

| Metric | Count |
|---|---|
| Threats found | 42 |
| Closed | 41 |
| Open | 1 |
