---
phase: "41"
slug: "orchestrator-flow-guidance"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-11-05"
---

# Phase 41 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Read the conditions below before relying on this verdict.** ASVS level 1 checks that each mitigation is present. T-41-27 is closed only on the plan's own definition of a safety row, and a wider reading makes it open and blocking.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Agent to queue tool | An agent runs `tools/grugops/claim.js` with arguments it chooses | Task names, `--by`, `--level` |
| Repository to queue tool | The tool reads files any agent can edit | `claim.md`, subtask `ref:` lines, notes, `factory.config.json` |
| Queue tool to the terminal | Values read from the repository are printed | Task, command and note names |
| Agent to human | A human answer is recorded as text an agent could also write | `Approved:` lines, `Confirmed:` findings, disposition rows |
| Installer to host repository | The installer writes and removes `tools/grugops/claim.js` | Program bytes, the install ledger |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-41-01 | Tampering | `claimTask` record fields | medium | mitigate | CR/LF guard on `by`, `agent` and `level`; allowlist on the owner name; closed `CLAIM_LEVELS` set | closed |
| T-41-02 | Denial of service | forged second `at:` line | medium | mitigate | `claimRecordFields` reports `tampered`; the render skips and the sweep reclaims, as today | closed |
| T-41-03 | Denial of service | `claim.md` read | medium | mitigate | `readClaimRecord` asks lstat first, so a FIFO or link is never opened | closed |
| T-41-04 | Elevation of privilege | owner name | low | accept | `claimOwnerRefusal` is an instruction backstop: an agent can edit files. Workflow 17 says so | closed |
| T-41-05 | Spoofing | `Approved:` line | medium | mitigate | D-24: the line names the id of the `Fundamental:` note it answers, so one approval cannot pass another change | closed |
| T-41-06 | Elevation of privilege | unapproved fundamental change | high | mitigate | D-22: it takes the revert hand-off in stop-precedence line 1, and the human stop covers only a proposed `Fundamental:` note | closed |
| T-41-07 | Repudiation | `Confirmed:` finding | medium | mitigate | D-21: the finding carries the answer note's id in its refs; the existing `Never write that stamp without the human's answer.` sentence stays | closed |
| T-41-08 | Tampering | symlinked `.grugops/queue` | high | mitigate | `rootChainPresence` refuses a link on the path before any write, as state-roll does | closed |
| T-41-09 | Tampering | wrong working directory | medium | mitigate | Exit 2 when `.grugops` is absent, so no stray queue is made | closed |
| T-41-10 | Tampering | installer write | medium | mitigate | The `RUNNABLES` loop keeps never-overwrite, and the ledger and mirror row keep it reversible | closed |
| T-41-11 | Tampering | retyped rule drifting on hosts | medium | mitigate | Rules arrive only through the region; `freshness:runnable-embeds` and the build stamp fail on drift | closed |
| T-41-12 | Denial of service | stale sweep racing a slow agent | high | mitigate | D-11: the sweep runs only at session start, and a long claim in a live session is reported; a text pin holds the command to one section | closed |
| T-41-13 | Elevation of privilege | a resume slipping past the width cap | medium | mitigate | D-09 and D-06: a resume only finishes its own claimed task, and `free` reads disk | closed |
| T-41-14 | Repudiation | a token or cost claim in guidance | medium | mitigate | D-19 wording, `check-banned-claims`, and negative pins in scripts/flow-guidance-text.test.ts | closed |
| T-41-15 | Tampering | checkpoint commit on a protected branch | high | mitigate | D-17 points at the Commit section's branch guard, and the list repeats it | closed |
| T-41-16 | Tampering | `ref:` traversal | medium | mitigate | `subtaskRefFolder` takes one anchored line and refuses `.` and `..` | closed |
| T-41-17 | Repudiation | a forged note `at` | low | accept | R-41-04: D-07 proves a note exists; WF16 admission governs content | closed |
| T-41-18 | Spoofing | hand-written note passing as published | high | mitigate | The embedded walk's seal check; `done` counts sealed notes only (D-28) | closed |
| T-41-19 | Denial of service | FIFO at the config path | medium | mitigate | lstat through `rootChainPresence` first, then the embedded non-blocking reader | closed |
| T-41-20 | Information disclosure | control characters in printed values | low | mitigate | `printable` wraps every value read from the repository | closed |
| T-41-21 | Tampering | hand move past a `done` refusal | medium | mitigate | Step 7 and the stop bullet forbid it; R-41-01 records why the refusal can persist | closed |
| T-41-22 | Denial of service | a read failure read as no data, causing over-spawn | high | mitigate | No existence test in `claim.js`; the derived test fails every read site and requires a non-zero exit | closed |
| T-41-23 | Repudiation | a crash message denying a change | medium | mitigate | `queueChange` is set before the render; the exit-contract rows prove the line | closed |
| T-41-24 | Denial of service | two Orchestrator sessions sweeping each other | low | accept | R-41-02; the TTL still applies | closed |
| T-41-25 | Elevation of privilege | the Orchestrator doing a task's work | medium | mitigate | D-13 and D-32 in `## Hard limits`, and a text pin holds the sentences | closed |
| T-41-26 | Repudiation | a registered claim drifting from the text | medium | mitigate | `check-claim-anchors` holds the verbatim block; mechanisms re-measured in one commit | closed |
| T-41-27 | Repudiation | a human acceptance written without the human | high | mitigate | Frozen and safety rows stay `pending (named human)`; a human-check collects the read | closed |
| T-41-28 | Elevation of privilege | a junior-tier agent taking risk-tagged work once the adapter body names no tier | high | mitigate | The stop keys on the adapter name in `## Tech Lead plan`, which WF04 step 4 dispatches from; `## Levels` sends every host to that section before work starts, and a text pin fails a host-scoped read; `junior:` facts stay under check-role-rules | closed |
| T-41-SC | Tampering | npm/pip/cargo installs | low | accept | No package is installed by this plan | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Conditions on these closures

- **T-41-27 (high), needs a human ruling.** It closes on plan 41-06's definition: rows in `## Hard limits` or `## Stop when`, or carrying a safety fact, where the gate applies the safety-fact rule to role files only. Under that definition all 13 rows are `pending (named human)`. A wider reading finds 10 agent-written rows that are not pending: 3 README rows in `41-06.md` frozen by the claim registry, and 7 workflow rows where `carriesSafetyFact` fires (4 in `41-02.md`, 3 in `41-04.md`). None of the 10 claims a human read. On the wider reading, T-41-27 is open and blocking.
- **Human reads are owed.** Neither `<human-check>` of plan 41-06 has run. The 13 rows are not accepted, and T-41-27 holds only while they stay pending. WF04 line 48 in `41-02.md` is outside the read `41-VALIDATION.md` scopes, and it is the row most worth reading.
- **T-41-06:** the human stop is proposal-only in step 15, while Workflow 04 line 75 and `tech-lead.md` line 56 keep wider wording. This is deliberate. An agent following the wider wording asks a human rather than letting a change pass.
- **T-41-12:** text is the whole control. `sweep` has no session check.
- **T-41-18:** the seal is unkeyed, so an agent can compute one for a hand-written note. `scripts/context-io.ts` states this. R-41-04 covers a forged `at` only.
- **T-41-21:** text is the only control. After a hand move to `done/`, `done` exits 0 and releases the claim with no warning. That branch is deliberate recovery.
- **T-41-28:** a Workflow 04 step 15 re-plan down to junior could leave `## Tech Lead plan` naming another level, and the stop would not fire. This needs a downward re-score of work the rubric should already bar from junior.

---

## Flags outside the register

| Flag | Severity | Status |
|------|----------|--------|
| A symbolic link directly under `claimed/` is read through. Reproduced by the auditor: `now-running` wrote a row from a `claim.md` outside the root, and `free` counted the link. Only `sweep` refuses it. Nothing was written outside the queue, and a FIFO behind such a link is not opened, so T-41-03 and T-41-08 stay closed. | low | open — below high threshold (non-blocking) |
| A double disk fault can print "The queue was not changed." while the slot stays, at the cleanup in `takeClaim` and at the cleanup after a failed rename in `claimPending`. Maps to T-41-23. | low | open — below high threshold (non-blocking) |

---

## Accepted Risks Log

The phase decisions accepted these at planning. No named human has signed this log; R-41-01 is the one residual `41-VALIDATION.md` lists for a human read.

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-41-03 | T-41-04 | The `--by` refusal catches a mistake, not a choice; an agent can edit files | Phase decision D-04 | 2026-11-05 |
| R-41-04 | T-41-17 | `done` proves a note exists; Workflow 16 admission governs its content | Phase decision D-07 | 2026-11-05 |
| R-41-02 | T-41-24 | The sweep reads no session liveness; the TTL still applies | Phase decision D-11 | 2026-11-05 |
| — | T-41-SC | No package was added: `package.json` and the lockfile are unchanged since `6d05da1f` | Plan register | 2026-11-05 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-05 | 29 | 29 | 0 | gsd-security-auditor at `72dfbdec`, with probes against a host copy of `claim.js` |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-05 by the automated audit at ASVS level 1. The T-41-27 ruling and the human reads above are still open.
