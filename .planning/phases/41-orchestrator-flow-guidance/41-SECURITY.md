---
phase: "41"
slug: "orchestrator-flow-guidance"
status: open
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 2
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
| T-41-29 | Elevation of privilege | `note.js` reaching a route that trusts a stamp | high | mitigate | `runAdd` calls `appendNote` only; no privileged writer is declared in note.ts; note.test.ts holds the refusal under `high-severity` and `all`. A lost dial is T-41-55 | closed |
| T-41-30 | Spoofing | `--by` carrying an adapter name past `isHighSeverityRole` | high | mitigate | `noteAuthor` refuses the literal prefix in any letter case, but folds with trim and lowercase only, while the classifier also applies NFKC and strips white space and zero-width characters. Five spellings that fold to `grugops-security-nfr` end `noted`, exit 0, under `human_admission: all` | open |
| T-41-31 | Repudiation | a forged `human:NAME` on a routine finding, outside the hook | medium | accept | Recorded as R-41-06 and confirmed: a `tech-lead` finding stamped `human:eve` is noted at `all`. No accepted-risks entry; the named human's read is owed | open — below high threshold (non-blocking) |
| T-41-32 | Tampering | a second seal authority drifting from `context-io.ts` | high | mitigate | `runnable-embeds-freshness` exits 0 on 6 targets; all five programs carry one stamp; note.test.ts proves on host copies that `done` accepts the seal | closed |
| T-41-33 | Tampering | a link or traversal sending a note outside the store | high | mitigate | `assertSafeTask`, `refuseUnusableStore` and containment in `decideNoteDestination`; probes of bad folders, traversal `--by` values and links were all refused | closed |
| T-41-34 | Tampering | a caller pointing governance at a root it controls | medium | mitigate | No `--root`; the dial is `appendNote`'s `trustedRepoRoot()` default, held by note.test.ts. The agent-set variable stays an accepted residual, and the plan's citation is wrong (see Conditions) | closed |
| T-41-35 | Denial of service | a FIFO or an oversized `--body-file` wedging an agent | medium | mitigate | `readRegularFileOrNull` under `NOTE_FILE_MAX_BYTES`, with a bounded-time test; a FIFO and files at and above 8 MiB were refused | closed |
| T-41-36 | Tampering | a forged `at` on this route passing D-07 | low | mitigate | No `--at`; `at` is stamped in the program; newline injection through five flags was refused | closed |
| T-41-37 | Repudiation | an empty note freeing a slot | low | mitigate | `noteBody` refuses empty and white-space bodies with exit 2, and no folder is made | closed |
| T-41-38 | Information disclosure | `--body-file` copying a readable file into a note | low | accept | Rationale is in the plan register. No accepted-risks entry yet | open — below high threshold (non-blocking) |
| T-41-39 | Denial of service | a revert hand-off loop with no human | medium | mitigate | Workflow 04 lines 46 and 48 state the limit, pinned in tier-kit-text.test.ts | closed |
| T-41-40 | Repudiation | a sentence claiming a stamp binding a route does not have | medium | mitigate | Workflow 04 line 53 says only `propose_note` binds the stamp and `note.js` does not, pinned in tier-kit-text.test.ts | closed |
| T-41-41 | Repudiation | a human acceptance written without the human | high | mitigate | All 8 rows of `41-08.md` read `pending (named human)`; the read is still owed | closed |
| T-41-42 | Tampering | install or uninstall touching a user-edited copy | medium | mitigate | `RUNNABLES` row and uninstall mirror; install.test.ts keeps and reports an edited copy | closed |
| T-41-43 | Tampering | a stale `note.js` beside newer programs writing a seal an older authority made | low | mitigate | Stamp present and `state-check` loops over `RUNNABLE_SET`; a probe of a damaged stamp gave FINDING and exit 1 in a marked repository. No committed case damages a `note.js` stamp (see Conditions) | closed |
| T-41-44 | Denial of service | a live claim with a damaged record reclaimed while its agent runs | medium | mitigate | Directory age decides, and the sweep runs at session start only; young unusable claims stayed and aged ones went | closed |
| T-41-45 | Tampering | a forged record reaching the table | medium | mitigate | A tampered record gets no row; an unusable one shows only its name through `cell()` | closed |
| T-41-46 | Tampering | a link or FIFO under `claimed/` read or followed | medium | mitigate | `readClaimRecord` is the only reader; link and FIFO probes were not read through | closed |
| T-41-47 | Repudiation | an agent accepting a residual or a row, or reporting the live run as done | high | mitigate | `41-11.md` has 43 rows pending; R-41-07 reads "Not accepted"; CR-01 is `open`; RUN-01 to RUN-05 are unchecked | closed |
| T-41-48 | Tampering | the text's command drifting from the program's flags | medium | mitigate | role-route.test.ts runs the literal commands, and an unknown placeholder fails it | closed |
| T-41-49 | Denial of service | a re-spawn doubling an agent that a second session is running | medium | accept | R-41-02 now names the re-spawn. The log links R-41-02 to T-41-24 only, and the named human's read is owed | open — below high threshold (non-blocking) |
| T-41-50 | Repudiation | a sentence claiming the hook covers a role's note | medium | mitigate | Workflow 16 says `note.js` runs outside the hook, pinned in flow-guidance-text.test.ts; R-41-06 records it | closed |
| T-41-51 | Elevation of privilege | the AUTO-06 rule admitting a hand-written second governance reader | high | mitigate | `withoutFreshRegion` strips only a fresh `EMBED_SPECS` region, with no exception list; its controls pass | closed |
| T-41-52 | Repudiation | a failed read reporting a note that does not stand | medium | mitigate | `noteReadsBack` was added, but 12 READ-1 rows stay red by human ruling and their fix belongs outside note.ts. The rule was widened for 9 rows by the same ruling | open — below high threshold (non-blocking) |
| T-41-53 | Tampering | a pin moved to pass, hiding an unreviewed writer or reader | medium | mitigate | The moved pins each carry a written reason; the module recount and site-count cases pass | closed |
| T-41-54 | Elevation of privilege | the verdict census missing a real second author of the machine stamp | high | mitigate | The predicate skips whole-line comments only; its controls pass | closed |
| T-41-55 | Elevation of privilege | the `trustedRepoRoot` ladder embedded in `note.js` losing the `human_admission` dial | high | mitigate | Planned: the ladder fails closed in `scripts/context-io.ts`; the gap plan is not yet written. Absent at HEAD. Recorded as R-41-07, "Not accepted" | open |
| T-41-SC | Tampering | npm/pip/cargo installs | low | accept | No package is installed by this plan | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Gap-closure audit, 2026-11-05

This audit covers T-41-29 to T-41-55 at `7d0bb17a` and replaces the earlier verdict. **Two threats at the block threshold are open, so phase advancement is blocked.** No human has accepted either one.

- **T-41-55, the dial loss.** On lone host copies under `human_admission: all`, a `security-nfr` finding stamped `human:eve` is refused with a normal `HOME` and ends `noted`, exit 0, under `HOME=/nonexistent` or `HOME=` with no fault injected. It also ends `noted` with `GRUGOPS_PROJECT_DIR` or `CLAUDE_PROJECT_DIR` at an empty directory, and with `GRUGOPS_HOST_DELIVERED_ROOT` at a bare `.git` directory. `HOME` unset, or naming a regular file, keeps the dial. The loss is wider than R-41-07 records and prints no warning: under `HOME=/nonexistent` a `retained` repository gets no ledger line (GOV-02), and an unparseable config no longer refuses a note (D-14). The `HOME`, ledger and config cases were reproduced twice, by the auditor and by the orchestrator. An unstamped finding is refused either way, and the git host stays the hard floor for merge and deploy (33.1 D-21).
- **T-41-30, adapter spellings.** The stated mitigation is present, and it does not cover the threat as worded. `noteAuthor` folds with trim and lowercase only, so `gru<ZWSP>gops-security-nfr`, `grugops<ZWSP>-security-nfr`, `ｇrugops-security-nfr`, `grugops－security-nfr` and `grug ops-security-nfr` end `noted`, exit 0, under `all`, because the classifier folds each to the adapter name. Marking this row open is a judgment call: at grep depth alone it would close. Ruling it closed leaves `threats_open` at 1.
- **Unrecorded route, no id yet.** A high-severity role can rename itself, such as `x-security-nfr`: 8 ASCII spellings ended `noted` under `all`. No argv check can close this, so it needs a residual and a named human.
- **T-41-43 closes with a condition.** The control only detects: `note.js` still wrote a note with a damaged stamp, and `SIBLING_NAMES` in state-check.test.ts omits `note.js`.
- **T-41-20 keeps a condition.** Plan 41-10 renders unsafe names and `cell()` keeps control bytes, so a raw ESC byte in a directory name reaches `now-running.md`. The threat's boundary is the terminal, so it stays closed, but `cat` of that file carries the byte.
- **Wrong citation.** T-41-34 and Workflow 16 line 62 cite `R-31-15-01` for an agent-set environment variable; that residual is about the working directory, and the variable is `R-31-15-03`. T-41-31 and R-41-06 cite the same id for the stamp tier, which it does not describe either.
- **False sentence.** The `note.ts` header says no flag and no environment variable skips admission. T-41-55 shows otherwise. Workflow 16 step 3 and Workflow 17 step 6 carry related sentences; the gap plan owns them.
- **Not verified here.** The auditor did not inject the EIO faults; the split of 5 dial-losing rows comes from plan 41-12's measurement. It ran targeted test files only.

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
- [ ] `threats_open: 0` confirmed (2 open: T-41-30, T-41-55)
- [ ] `status: verified` set in frontmatter

**Approval:** not verified. The gap-closure audit of 2026-11-05 left two blocking threats open. The T-41-27 ruling and the human reads above are still open.

## Security Audit 2026-11-05

| Metric | Count |
|---|---|
| Threats found | 27 |
| Closed | 21 |
| Open | 6 |
