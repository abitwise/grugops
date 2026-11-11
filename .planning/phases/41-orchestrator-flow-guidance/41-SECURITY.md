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
| T-41-29 | Elevation of privilege | `note.js` reaching a route that trusts a stamp | high | mitigate | `runAdd` calls `appendNote` only; no privileged writer is declared in note.ts; note.test.ts holds the refusal under `high-severity` and `all`. A lost dial is T-41-55 | closed |
| T-41-30 | Spoofing | `--by` carrying an adapter name past `isHighSeverityRole` | high | mitigate | Plan 41-14: `noteAuthor` and `isHighSeverityRole` ask `canonicalRoleName`, the one fold. 12 spellings end exit 2 with no note on a lone host copy; `note.test.ts` holds them | closed |
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
| T-41-52 | Repudiation | a failed read reporting a note that does not stand | medium | mitigate | Plan 41-13: all 74 READ-1 pairs pass with no skip. The 7 Group B rows pass by name and the 5 boolean rows are gone. The 9 `SECOND_SOURCE` rows stay judged by the human ruling, not by the rule | closed |
| T-41-53 | Tampering | a pin moved to pass, hiding an unreviewed writer or reader | medium | mitigate | The moved pins each carry a written reason; the module recount and site-count cases pass | closed |
| T-41-54 | Elevation of privilege | the verdict census missing a real second author of the machine stamp | high | mitigate | The predicate skips whole-line comments only; its controls pass | closed |
| T-41-55 | Elevation of privilege | the `trustedRepoRoot` ladder embedded in `note.js` losing the `human_admission` dial | high | mitigate | Plan 41-17 (T-41-71): the walk returns `WALK_STARTED_ABOVE_HOME` and `trustedRepoRoot` throws before the tail (`scripts/context-io.ts:5765`, `:6110-6112`). On a lone host copy, `HOME=<repo>/src`, `/.grugops`, `/.git`, four other spellings, the `retained` and unparseable variants and three names carrying no configuration each exit 1 with no note. The fourth limit of R-41-07 stays open as T-41-74 | closed |
| T-41-56 | Elevation of privilege | `trustedRepoRoot` losing the dial on a failed read or an undeterminable home | high | mitigate | Plan 41-13: `undeterminedRoot` and every read of the ladder report failure. Closed as scoped; its claim to close T-41-55 does not hold | closed |
| T-41-57 | Elevation of privilege | a named root with no configuration outranking a governed working directory | high | mitigate | Plan 41-13; all three names reproduced. The configured-name limit is stated in Workflow 16, the `note.ts` header and R-41-07 | closed |
| T-41-58 | Denial of service | a fail-closed read stranding the normal route | medium | mitigate | A lean repository ends `noted`; role-route, note and claim tests pass | closed |
| T-41-59 | Tampering | a guard or pin moved to pass, hiding an unreviewed read | medium | mitigate | The map blocks hash the same at `0e780dfc` and HEAD; each moved pin has a written reason | closed |
| T-41-60 | Spoofing | `--by` carrying an adapter name past `isHighSeverityRole` | high | mitigate | Same evidence as T-41-30. The hand-written part of `note.ts` decides nothing | closed |
| T-41-61 | Elevation of privilege | a high-severity role renaming itself, such as `x-security-nfr` | high | accept | Olger accepted R-41-08 by name in D-40 (`41-CONTEXT.md:91`); the Accepted Risks Log carries the row. The route stays live | closed |
| T-41-62 | Repudiation | a sentence claiming more than the code holds | medium | mitigate | The header and Workflows 16 and 17 are rewritten. CHANGELOG.md lines 141-142 still say `can no longer supersede`, which the arrival route shows is too strong. A second instance: CHANGELOG.md line 143 ("at every dial") and Workflow 16 line 31 do not name the renamed-file route of R-41-09 | open — below high threshold (non-blocking) |
| T-41-63 | Repudiation | an agent accepting a residual or a row | high | mitigate | `41-14.md` has 17 of 17 rows pending; R-41-07 and R-41-08 read Not accepted | closed |
| T-41-64 | Elevation of privilege | an unstamped note retiring a governed finding or a green verdict (CR-02) | high | mitigate | Plan 41-18 (T-41-77): `admit()` reads with `readRawNotesWithSkips` and refuses a target in the store that cannot be read (`scripts/context-io.ts:4494-4521`). As uid 1000 on a lone host copy, the mode-000 route exits 1 and the finding stays in `## Current state`; a broken seal, a non-note, a directory, a FIFO, an 8 MiB + 1 file and a dangling link each exit 1. The renamed-file route stays open as T-41-81 | closed |
| T-41-65 | Tampering | a pin moved, or a READ-1 map edited, to pass | medium | mitigate | The refusal count moved from 9 to 10 with a written reason; sizes 9 and 17 hold | closed |
| T-41-66 | Tampering | a target naming no note folding out a note that arrives later | medium | accept | D-37 records `narrow` and R-41-09 records the residual. Olger accepted it in `41-UAT.md` test 5 on 2026-11-10; the Accepted Risks Log carries the row | closed |
| T-41-67 | Denial of service | the rule refusing a Workflow 18 promotion | medium | mitigate | Six `Workflow 18` cases in `scripts/compactor.test.ts` pass, including both promotion routes | closed |
| T-41-68 | Repudiation | a decision recorded, or the `admit()` span changed, without the human | high | mitigate | D-37 at `01c27aa3` precedes the span change at `fe51aa46`; the span hash moved once, and the re-base cites D-37 | closed |
| T-41-69 | Repudiation | a ledger row moved past its evidence, or an agent writing an acceptance | high | mitigate | Olger's reply precedes `3fee450b`, and `41-16.md` matches it: row 1 flagged, rows 2 and 3 accepted, row 4 pending | closed |
| T-41-70 | Repudiation | a full-suite result read by count | medium | mitigate | The summary and `41-VALIDATION.md` agree on 21 of 21 names | closed |
| T-41-71 | Elevation of privilege | `trustedRepoRoot` answering the kit when the walk inspected nothing (closes T-41-55) | high | mitigate | `WALK_STARTED_ABOVE_HOME` at `scripts/context-io.ts:5765`; the throw at `:6110-6112` precedes the tail at `:6116-6117`; `note.js:2163,2297`. Probed as T-41-55 | closed |
| T-41-72 | Elevation of privilege | a name with no configuration answering where the walk inspected nothing | high | mitigate | The throw sits before `named ?? GOVERNANCE_FALLBACK_BASE`; `GRUGOPS_PROJECT_DIR` or `CLAUDE_PROJECT_DIR` at an empty directory and `GRUGOPS_HOST_DELIVERED_ROOT` at a bare `.git` each exit 1 under `HOME=<repo>/src`. A named root carrying the configuration keeps the dial | closed |
| T-41-73 | Denial of service | the refusal stranding a note run from above `HOME` | medium | accept | D-38 (`41-CONTEXT.md:89`) records Olger accepting the cost; a lean repository under `HOME=<repo>/src` exits 1 as stated. Olger accepted it in `41-UAT.md` test 5 on 2026-11-10; the Accepted Risks Log carries the row | closed |
| T-41-74 | Elevation of privilege | a walk that starts below the bound reading the lean dial under a `HOME` below the repository | low | accept | R-41-07's fourth limit. With the working directory at `<repo>/docs` holding its own `.grugops` and `HOME=<repo>/src`, a governed finding exits 0 `noted` into `docs/.grugops`. Two `LIMIT (R-41-07)` cases pin it. Olger accepted it in `41-UAT.md` test 5 on 2026-11-10; the Accepted Risks Log carries the row | closed |
| T-41-75 | Tampering | a pin or a mutation anchor moved to pass | medium | mitigate | Three pin edits, each with a written reason; `NOTE_READ_SITES` 19, `SECOND_SOURCE` 9 and `UNREACHED` 17 hold; no `.skip`, `.fails` or `.todo` added | closed |
| T-41-76 | Repudiation | a sentence claiming more than the measured routes, or an agent writing an acceptance | high | mitigate | R-41-07 lists four limits and reads Not accepted; both rows of `41-17.md` are `pending (named human)` | closed |
| T-41-77 | Elevation of privilege | an unstamped note retiring a governed finding or a green verdict through a target that cannot be read (closes T-41-64) | high | mitigate | The refusal at `scripts/context-io.ts:4494` follows the D-14 read and precedes the D-04 arm and the ledger append; census S11 covers `appendNote`, `admitAndAppend` and `promoteAdmitted`. Probed as T-41-64 | closed |
| T-41-78 | Denial of service | the refusal reaching a target that names no note, which would break D-37 and a Workflow 18 route | medium | mitigate | `--supersedes nosuchid` exits 0 with the store readable and with another note at mode 000; the Workflow 18 cases in `scripts/compactor.test.ts` pass | closed |
| T-41-79 | Repudiation | the `admit()` span changed past what the human authorised | high | mitigate | The span hash moved once, at `98bbdafd`, to `dfb5f2fb…09ac`: one read, one refusal, one comment word and a comment paragraph the plan names. D-39 (`41-CONTEXT.md:90`, in `d926f3cd`) precedes it, and the re-base text quotes the reply | closed |
| T-41-80 | Tampering | a pin moved, or a READ-1 map edited, to pass | medium | mitigate | The census adds the S11 row only and moves its count from 10 to 11 with a written reason | closed |
| T-41-81 | Elevation of privilege | a renamed note that cannot be read, matched by nothing and folded out once the read recovers | low | pending (named human): accept | R-41-09, not accepted. A finding renamed to `renamed.md` at mode 000 lets the claim exit 0, and the finding leaves `## Current state` once the mode is restored. The `LIMIT (R-41-09)` case pins it | open — below high threshold (non-blocking) |
| T-41-82 | Repudiation | a `chmod 000` case passing on an account that can read the file | medium | mitigate | `scripts/runnable-ref/note.test.ts:846-866` skips by name through `hostCapabilityOrSkip` and asserts its premise; the READ-1 EIO case covers root | closed |
| T-41-83 | Repudiation | a full-suite result read by count, or an agent writing an acceptance | high | mitigate | The 41-18 summary and `41-VALIDATION.md` compare by name: the 21 baseline names plus one `capture-live` case that passed 77 of 77 alone. The `41-18.md` row stays pending | closed |
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

## Gap-closure audit, 2026-11-06

This audit covers T-41-30, T-41-52, T-41-55 and T-41-56 to T-41-70 at `f4bce501`. **Three threats at the block threshold are open, so phase advancement is blocked.** Each needs a named human's ruling: a fix or a recorded limit. The auditor marked all three as judgment calls: at grep depth each mitigation or document is present, and each stays open on a measured route around the threat as worded. The orchestrator reproduced the T-41-55 and T-41-64 routes and the live T-41-61 route on lone host copies.

- **T-41-55, `HOME` below the repository.** Every case this file named now holds. With no fault and no named root, `HOME=<repo>/src`, `<repo>/.grugops` or `<repo>/.git` ends `noted`, exit 0, for a `security-nfr` finding stamped `human:eve` under `all`. With `HOME=<repo>/.grugops`, `retained` ends `noted` with no ledger line, and an unparseable config ends `noted`. `scripts/context-io.ts:5730` returns null at step 0 having inspected nothing, and `:6075` then answers the kit. This is not a regression: `note.js` at `0e780dfc` behaves the same. The fix is for the ladder not to answer the kit when the walk inspected nothing, or a named human records it as a limit. R-41-07 says the gap is closed and lists two limits; this is a third.
- **T-41-64, an unreadable target.** With the target note at mode `000` as a non-root process, an unstamped claim under `all` ended `noted`, exit 0, and the finding had left `## Current state` once the mode was restored. The readable control was refused. `:4496` uses `readContext`, which drops the skipped list, so `prior` is undefined. D-37 admits a target that names no note in the store, and this note is in the store. A fix moves the `admit()` span, so it needs a ninth re-base on a named human's word, or a human rules it into R-41-09. The route needs a failed read of that one file, and an actor who can chmod can already hand-compute a seal (the T-41-18 condition).
- **CR-02 through a lost dial.** Under the T-41-55 route, or a name carrying its own lean config (R-31-15-03, stated), the same claim retires the finding, because the dial reads lean.
- **T-41-61, no recipient.** R-41-08 records the rename route, but it names no human and has no tracking row, so it documents an unowned gap rather than a transfer. A named human's read clears it.
- **T-41-66, not yet accepted.** D-37 and R-41-09 record the decision, and there is no accepted-risks row. The arrival route was reproduced. The dial-raised-after-retirement case is a separate shape that no human has accepted.
- **T-41-62, one sentence.** CHANGELOG.md line 138 is a public sentence at the strength Olger flagged in row 1 of `41-16.md`, with no qualifier. Workflow 18 line 74 is stale but fails safe, and `deferred-items.md` tracks it.
- **Not verified here.** The auditor ran 18 test files, not the full suite, and did not re-seed the mutants. Windows stays `UNKNOWN - verify`, and no live host run was made.

---


## Gap-closure audit, 2026-11-08

This audit covers plans 41-17 and 41-18 (T-41-71 to T-41-83) and the three threats left open on 2026-11-06, at `eab814fd`. **No threat at or above high is open, so the gate passes.** T-41-55 and T-41-64 close on probes of a lone host copy of the committed `note.js`, run as uid 1000; the same probes on the pre-fix copies (`0ddf2aec`, `c226b4e4`) ended `noted`, so they detect the original routes. T-41-61 closes on Olger's acceptance of R-41-08 in D-40. The orchestrator re-ran both probe sets at HEAD and got the same results.

- **Two limits stay open, below the threshold, and no human has accepted them.** T-41-74 (R-41-07's fourth limit): a working directory with its own `.grugops` under a `HOME` below the repository still reads the lean dial, and the note lands in that subdirectory's store. T-41-81 (R-41-09): a renamed note that cannot be read reads as naming no note, and the finding leaves `## Current state` once the read recovers.
- **T-41-73 has no log row.** D-38 accepts the cost, but the Accepted Risks Log has no entry, so the method keeps it open below the threshold.
- **Text that claims too much.** CHANGELOG.md line 143 says the refusal holds "at every dial", and Workflow 16 line 31 says a target in the store that cannot be read is refused. Neither names the renamed-file route. Recorded under T-41-62.
- **Span wording.** The summary and the re-base text name one comment word; the diff also adds a five-line comment paragraph at `scripts/context-io.ts:4505-4509`. It is comment only, and the plan authorised it.
- **Provenance.** The auditor verified that the record in `d926f3cd` quotes the reply; it cannot verify the reply itself.
- **Not verified here.** The auditor did not re-run the full suite or re-seed the mutants; the orchestrator's post-plan run at `86947a1e` failed 22 cases, the 21 baseline names and the `capture-live` false failure. Nothing ran as root. The hook and admission-server routes were covered by the S11 census only. Windows stays `UNKNOWN - verify`.

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

The phase decisions accepted these at planning, except R-41-08, which Olger accepted by name on 2026-11-07. On 2026-11-10, in `41-UAT.md` test 5, Olger accepted R-41-02, R-41-03, R-41-04 and R-41-06 by name, closed R-41-01 on the live run of test 1, and accepted the rows dated 2026-11-10 below. T-41-81 (R-41-09 (c)) is not accepted; its wording is fixed under gap G-41-7-WR-15.

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-41-03 | T-41-04 | The `--by` refusal catches a mistake, not a choice; an agent can edit files | Phase decision D-04 | 2026-11-05 |
| R-41-04 | T-41-17 | `done` proves a note exists; Workflow 16 admission governs its content | Phase decision D-07 | 2026-11-05 |
| R-41-02 | T-41-24 | The sweep reads no session liveness; the TTL still applies | Phase decision D-11 | 2026-11-05 |
| R-41-08 | T-41-61 | No argv check can close the rename route, because the role comes from a flag the agent chooses | Olger (D-40) | 2026-11-07 |
| R-41-07 (D-38 cost) | T-41-73 | With no named root carrying a configuration, a note run from above `HOME` is refused until a human repairs it; D-38 states this cost | Olger (41-UAT test 5) | 2026-11-10 |
| R-41-09 (a) | T-41-66 | A target naming no note is admitted and folds out a note that arrives later under that id; D-37 chose `narrow` | Olger (41-UAT test 5) | 2026-11-10 |
| R-41-07 (fourth limit) | T-41-74 | A walk that starts below the bound reads the lean dial under a `HOME` below the repository; two `LIMIT (R-41-07)` cases pin it | Olger (41-UAT test 5) | 2026-11-10 |
| R-41-05 | — | No live run on Codex, Antigravity, OpenCode, Copilot or Pi; carried to the milestone UAT | Olger (41-UAT test 5) | 2026-11-10 |
| R-41-06 | — | `note.js` is the in-script admission tier; a `human:<name>` stamp it writes is not bound to a human | Olger (41-UAT test 5) | 2026-11-10 |
| — | T-41-SC | No package was added: `package.json` and the lockfile are unchanged since `6d05da1f` | Plan register | 2026-11-05 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-05 | 29 | 29 | 0 | gsd-security-auditor at `72dfbdec`, with probes against a host copy of `claim.js` |
| 2026-11-06 | 18 | 13 | 5 (3 blocking) | gsd-security-auditor at `f4bce501`, gap-closure scope, with probes against host copies of `note.js` |
| 2026-11-08 | 18 | 13 | 5 (0 blocking) | gsd-security-auditor at `eab814fd`, gap-closure round 3, with probes against host copies of `note.js`; re-run by the orchestrator |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed (2026-11-08; 5 open below the threshold: T-41-62, T-41-66, T-41-73, T-41-74, T-41-81)
- [x] `status: verified` set in frontmatter

**Approval:** the gate passes on the audit of 2026-11-08, with no blocking threat open. This is not a human sign-off: T-41-74 and T-41-81 await a named human's read, T-41-73 needs its log row, and the T-41-27 ruling and the human reads in § Conditions are still open.

## Security Audit 2026-11-05

| Metric | Count |
|---|---|
| Threats found | 27 |
| Closed | 21 |
| Open | 6 |

## Security Audit 2026-11-06

| Metric | Count |
|---|---|
| Threats found | 18 |
| Closed | 13 |
| Open | 5 |
