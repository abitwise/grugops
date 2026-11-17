---
phase: "42"
slug: "skills-per-role-and-evaluation"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-11-17"
---

# Phase 42 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Read the conditions below before relying on this verdict.** ASVS level 1 checks that each mitigation is present. Three of these mitigations held only after the phase code review fixed real gaps (CR-01, CR-02, WR-02 in `42-REVIEW-FIX.md`). The Windows behavior of several mitigations is `UNKNOWN - verify`.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Third-party skill sources to the evaluation | Upstream plugin repositories and npm tarballs were read to write `42-EVALUATION.md` | Skill text, manifests, pins (read as data, never run) |
| Skill text to the agent | A skill the host lists may say anything about branching, merging or planning | Instructions the AGENTS.md precedence line outranks |
| User folders to `install.js --check` | The doctor reads role files, the role-skills reader's output, `installed_plugins.json`, `plugin.json` and skill folders | Role names, skill names, plugin paths |
| PATH to `install.js --check` | The version probe runs the first `claude` found in an absolute PATH folder | `claude --version` output |
| Doctor to the terminal | Values read from files and children are printed | Advisory lines |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-42-01 | Tampering | ui-ux-pro-max tarball and plugin cache reads | high | mitigate | Sources read as data in empty scratch dirs, never run (42-EVALUATION.md:3, 42-01-SUMMARY.md:29); no manifest or lockfile changed | closed |
| T-42-02 | Repudiation | evaluation verdicts and pins | medium | mitigate | Cells quote `path@sha12:line`, full SHAs with read date, unread facts `UNKNOWN - verify`; structure test skills-kit-text.test.ts SKILL-02 block | closed |
| T-42-03 | Tampering | upstream changes after evaluation | high | mitigate | Tag plus full SHA pins, auto-update defaults recorded, two revisit triggers (42-EVALUATION.md:32-37, :167-174) | closed |
| T-42-04 | Denial of service | `installed_plugins.json`, `plugin.json` reads | medium | mitigate | Both through `readUserFile` (8 MiB cap, special files refused by type); unknown shape is `not checked` (install.ts:2604, :2644) | closed |
| T-42-05 | Tampering | manifest `skills` path | medium | mitigate | `folderInsidePlugin` refuses absolute, drive-qualified, `..` and lexical escapes, and since WR-02 real-path escapes (install.ts:2676-2691); skill names kebab-checked before any join | closed |
| T-42-06 | Elevation of privilege | reader spawn | medium | mitigate | `process.execPath` with a fixed script path, no shell, stdin ignored, 15 s timeout, 1 MiB cap, fails closed (install.ts:2483-2508) | closed |
| T-42-07 | Repudiation | missing-skill line | medium | mitigate | Override set, unreadable record, reader failure and unknown location each print `not checked` or a stated clause (install.ts:2721-2793; WR-01) | closed |
| T-42-08 | Tampering | exit code and `--strict` | medium | mitigate | Sections print only through `docReport`; tests compare exit status and lines | closed |
| T-42-09 | Tampering | target and home filesystem | high | mitigate | No mutating fs call in the doctor sections; fs census call-site case green; `snapshotTree` test | closed |
| T-42-10 | Elevation of privilege | skill text steering branching, merging, planning | high | mitigate | Precedence line AGENTS.md:32, pointed to by the protocol and docs/skills.md; pinned once | closed |
| T-42-11 | Spoofing | planted `SKILL.md` found by searching | medium | mitigate | Protocol: only skills the host lists, never search the disk (`_role-switch-protocol.md:18`); pinned | closed |
| T-42-12 | Repudiation | `## Ratification` | high | mitigate | `gate="blocking-human"`, reply quoted verbatim with the typed name (42-EVALUATION.md:180-193) | closed |
| T-42-13 | Elevation of privilege | spawn-mode `Skill` grant | high | mitigate | Separate Task 2 decision: no skill ratified, no kit change; no adapter grants `Skill` (test pins it) | closed |
| T-42-14 | Tampering | npm `ui-ux-pro-max-cli` named in docs | high | mitigate | Question did not apply after the decline; docs name no install route; test forbids install commands | closed |
| T-42-15 | Elevation of privilege | PATH-resolved `claude` spawn | high | mitigate | Only for installed Claude Code; `shell:false`, `--version`, stdin ignored, 5 s, 64 KiB; since CR-01 absolute PATH entries only, full path, `cwd` home, `NoDefaultCurrentDirectoryInExePath=1` on win32 | closed (residual logged; Windows `UNKNOWN - verify`) |
| T-42-16 | Tampering | terminal output | medium | mitigate | Only version digits printed; other lines through `printableLine` (control, DEL and bidi stripped, CR-02); ESC tests | closed |
| T-42-17 | Repudiation | version verdict | low | mitigate | Absent, timed out, non-zero and unparsable each print `not checked` with a reason; a test per case | closed |
| T-42-18 | Tampering | design-system files in the user's repo | high | mitigate | Never-write sentence in designer.md, frontend-ui.md and Workflow 14 step 1, pinned to exactly those three files | closed |
| T-42-19 | Repudiation | "used <skill>" notes | medium | mitigate | `skillsSectionFindings` requires `Never claim a skill ran.` and the fallback record; no shipped role declares a skill | closed |
| T-42-20 | Elevation of privilege | role capabilities | medium | mitigate | No `capabilities:` line changed; adapter freshness 0 differences | closed |
| T-42-21 | Tampering | skill preload into adapters | medium | mitigate | No adapter carries `skills:` (generate-role-adapters test, freshness) | closed |
| T-42-22 | Tampering | install commands and pins on the page | high | mitigate | docs/skills.md recommends nothing, prints no pin or install command; two-way pin to declarations | closed |
| T-42-23 | Spoofing | impression grugops vetted a skill | medium | mitigate | Pinned vet-it-yourself sentence and "never vendors or installs a skill" (docs/skills.md:7) | closed |
| T-42-24 | Information disclosure | precedence line reach | medium | mitigate | docs/skills.md:11; the installer leaves a user's own AGENTS.md untouched | closed |
| T-42-25 | Repudiation | claims on a new public page | medium | mitigate | Gate commit d4d042a4 before page commits, watched red then green | closed |
| T-42-26 | Tampering | skill names joined into paths | medium | mitigate | Non-kebab skill key fails the section closed; `skillFileIn` re-checks; role names are never joined into a path | closed |
| T-42-27 | Tampering | fs during plugin lookups | high | mitigate | Only `readUserFile`, stat, `readdirSync`, `realPathThroughExisting`; census call-site case green; `snapshotTree` test | closed |
| T-42-SC | Tampering | npm/pip/cargo installs | low | accept | No package added: `package.json` and the lockfile unchanged in `76c6d8a6..HEAD` | closed (accepted) |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Conditions on these closures

1. **Windows is `UNKNOWN - verify`.** The current-folder search, PATHEXT order, quoted entries, `NoDefaultCurrentDirectoryInExePath` and the `.cmd` shim (T-42-15, CR-01, WR-04) are unit-tested only through `path.win32` with a fake `isFile`; every end-to-end probe case skips on win32. The ESC, exit, timeout and parse cases (T-42-16, T-42-17), the link tests (T-42-05; junctions unverified), the CR-02 reader-stderr case and `readUserFile`'s open flags (T-42-04) were not run on Windows.
2. **Register wording is wider than the code in three places; the threats stay closed.**
   - T-42-04 says symbolic links are refused. `readUserFile` follows a link to a regular file and refuses only dangling links; the type check and size cap still apply after the link is followed.
   - T-42-26 says a non-kebab role name fails the whole section closed. Since WR-03 (59697a77) such a file gets its own advisory line and its declarations are dropped. Skill keys still fail closed.
   - T-42-05 containment covers the manifest `skills` folder. A link at `<folder>/<skill>` itself is followed by the presence stat without containment; only a presence result is affected and no content is read.
3. **`installer-fs-census.test.ts` is not fully green on Node 26.** T-42-27 says it "stays green". On Node v26.12.1 its "every node:fs export … classified" case fails on `openAsBlobSync`, a pre-phase baseline red; the cases this threat relies on pass. The Node 22 floor was not run.
4. **Review follow-ups.** 42-REVIEW-FIX.md marks WR-01, WR-02 and WR-03 "requires human verification". IN-01 to IN-06 are open. IN-02 (a pre-release such as `2.1.293-beta.1` reads as meeting the floor) bears on T-42-17's accuracy.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| — | T-42-SC | No package was added: `package.json` and the lockfile are unchanged in `76c6d8a6..HEAD` | Plan register (all 8 plans) | 2026-11-16 |
| R-42-01 | T-42-15 | A `claude` in an earlier absolute PATH folder runs, as it would for any `claude` the user types; the README says what runs. Since CR-01, empty, `.` and relative PATH entries are not searched | Planner text only (42-05-PLAN.md:211, 42-05-SUMMARY.md:213); named-human acceptance pending | 2026-11-16 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-17 | 28 | 28 | 0 | gsd-security-auditor at `48b2f846`, after the code-review fixes; 8 test files run (432/433, the one red a pre-phase baseline), freshness and adapter freshness green, both claim gates green |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-17 (R-42-01 awaits a named human's acceptance)
