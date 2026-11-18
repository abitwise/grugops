---
phase: "43"
slug: "story-and-layered-docs"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-11-18"
---

# Phase 43 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

Collected from the 15 plans' threat models.

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| registry (hand-authored) → claim gate | A hand-edited status decides whether a public sentence is checked | — |
| public page → reader | A withdrawn claim must not stay on the page under a new status | — |
| docs/ tree → kit home (later) | What the derivation admits is what the installer will copy to users | — |
| new public page → claim gates | A page outside the corpus could carry an unchecked claim | — |
| docs text → reader | An overstated parallel claim or a dead link misleads a user | — |
| CLAUDE.md → every Claude Code session in this repo | A wrong command name is read as an instruction | — |
| role and workflow files → generated public pages | Authored text crosses into a page a user reads | — |
| generator → filesystem | The generator deletes stray pages under one directory | — |
| skill files and host registry → generated public page | Command spellings a user will type | — |
| grugops checkout → user's kit home | Files copied onto the user's machine | — |
| user's existing kit-home content → installer | Content install did not write may already be at the new entry paths | — |
| worked example → reader's expectations | A reader copies what the example shows | — |
| worked example → reader's safety expectations | A reader believes what the release example says about deploys | — |
| hand-written public page → reader | Absolute claims and safety wording a user relies on | — |
| usage page → commands a user types | A wrong command on a host misleads the user | — |
| moved claims → claim registry | A claim that loses its anchor in a move escapes the gate | — |
| README → every first-time visitor | The front door's claims set expectations | — |
| user's untracked draft → repository | Draft text with unverified claims | — |
| public pages → reader | Overstatement no literal-matching gate catches | — |
| headless agent session → scratch filesystem | A live agent with tool grants runs in the scratch repo | — |
| transcripts → committed evidence | Transcripts can carry home paths and environment details | — |
| role files and the host registry → generated public pages | Authored text and adapter names cross into a page a user reads | — |
| user's kit home → `--prune-old-kit` | Prune deletes; only what install recorded may go | — |
| DRY_RUN → user's kit home | A preview must change nothing | — |

---

## Threat Register

Register authored at plan time (all 15 plans). Verified by gsd-security-auditor on 2026-11-18 at L1 (grep and read
depth, plus read-only gate and targeted vitest runs); per-threat evidence (file:line, test names) is in that audit's
report. The first run found 2 high threats open; both were closed the same day, as recorded below.

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-43-01 | Repudiation | `retired` used to hide an overstated safety claim | high | mitigate | The gate refuses `retired` on any `kind: safety` row; a safety claim leaves only through `dropped` with its generated disclosure | closed |
| T-43-02 | Tampering | a retired row whose text is still on the page | medium | mitigate | The absence arm fails when the verbatim bytes or the anchor are still in the named file, and when the named file is missing | closed |
| T-43-03 | Repudiation | a retirement with no history | low | mitigate | The mechanism must name the last commit where the text stood, so the text stays recoverable with `git show` | closed |
| T-43-04 | Information disclosure | a checkout-only record (audit, initial spec) shipped to users | medium | mitigate | CHECKOUT_ONLY_DOCS with a reason per entry, a live test that each entry exists, and unit cases proving each is left out | closed |
| T-43-05 | Repudiation | a new public page escapes the claim gates | high | mitigate | Membership is derived, so a page joins by existing; a planted-page mirror case proves a banned literal in a not-yet-written page goes red; the pins catch a silent change in size | closed |
| T-43-06 | Denial of service | an unbounded or looping walk of docs/ | low | mitigate | MAX_WALK_ENTRIES and the `isFileFollowing` contract copied from srcSkillNames; null on an unreadable root, never a partial list | closed |
| T-43-07 | Repudiation | a page claiming parallel work without the open gap | high | mitigate | Check 2 fails any corpus page or install/README.md that says `parallel` without the exact GAP-D1 sentence | closed |
| T-43-08 | Spoofing | CLAUDE.md telling sessions to type `/grug` | medium | mitigate | Check 1 fails on any `/grug` command word; PROJECT.md source fixed so regeneration keeps it fixed | closed |
| T-43-09 | Tampering | a check that passes by visiting nothing | medium | mitigate | Each check folds through reportMeasured, which refuses zero visited and a short scan set | closed |
| T-43-10 | Information disclosure | links into .planning/ or install/ from shipped pages | low | mitigate | Check 3's ship rule; checkout-only targets become repository URLs that the URL rule checks exist | closed |
| T-43-11 | Tampering | table injection from an authored cell | medium | mitigate | `cell()` escapes `\`, ` | closed |
| T-43-12 | Tampering | a hand-edited reference page | high | mitigate | The tree gate regenerates in a mirror and byte-compares every page, and reports EXTRA, MISSING and STALE pages in CI | closed |
| T-43-13 | Tampering | stray-page deletion following a link out of docs/reference | medium | mitigate | Deletion uses lstat, touches only regular `.md` files under the fixed literal docs/reference directory, never follows a link | closed |
| T-43-14 | Repudiation | a fabricated field on a page | medium | mitigate | Underivable fields read `UNKNOWN - verify`; missing sections and duplicate display names fail closed with no write | closed |
| T-43-15 | Spoofing | a page telling a user to type a command that does not exist on their host | medium | mitigate | Spellings come from the registry and plugin.json; non-Claude hosts go through the dispatcher's `invoke` text; host-entry-docs tests scan the pages | closed |
| T-43-16 | Repudiation | a model or effort on the page that differs from what the adapters carry | medium | mitigate | Values come from zeroConfigAssignments, the same resolver the adapter generator uses; the tree gate regenerates them | closed |
| T-43-17 | Tampering | an unknown workflow path in a skill body becoming a dead or invented link | low | mitigate | Every named workflow path is validated against listWorkflows; an unknown one fails closed with no write | closed |
| T-43-18 | Tampering | a user's own `$GRUGOPS_HOME/docs` overwritten | high | mitigate | The record decides the arm: anything install did not record is renamed to a recorded backup, never overwritten; never-clobber on an existing backup name; a Task 1 case proves it | closed |
| T-43-19 | Information disclosure | checkout-only records shipped to users | medium | mitigate | Staging copies only shippedDocs() paths file by file; a test asserts the excluded paths are absent from the kit home | closed |
| T-43-20 | Tampering | a forged record entry pointing prune at another path | medium | mitigate | KIT_ENTRY_PATHS is closed; a backup must be `of` a member and named `<of>.bak.<ISO>`; ledger cases refuse an `of` outside the set | closed |
| T-43-21 | Elevation of privilege | an install path touching state roots | high | mitigate | Writes stay under `$GRUGOPS_HOME`; tests assert the target's state roots are byte-unchanged; the overlap refusal is unchanged | closed |
| T-43-22 | Repudiation | an illustrative example presented as a captured run | medium | mitigate | The illustrative banner on all three, the D-19 line on 01 and 03, and a grep that no "real run" wording is left | closed |
| T-43-23 | Tampering | an example teaching a role to edit the trace by hand | medium | mitigate | The ad hoc hand-trace scan with the kit's own four patterns in every task; the permanent scan joins in plan 43-12 | closed |
| T-43-24 | Elevation of privilege | an example showing an agent merging or deploying | high | mitigate | Every example stops at a pull request for a named human; reader review in plan 43-12 | closed |
| T-43-25 | Repudiation | an overstated deploy guarantee in example 05 | high | mitigate | The deploy section names the git host as the hard floor and the ask rules as a speed bump; a grep confirms no `always` remains | closed |
| T-43-26 | Tampering | an example teaching hand edits of the trace | medium | mitigate | The ad hoc four-pattern scan plus the matrix-header grep; permanent scan joins in plan 43-12 | closed |
| T-43-27 | Repudiation | an unregistered absolute claim on a new page | medium | mitigate | Each absolute is anchored with a new id and a measured row in the same commit; check-claim-anchors holds the bijection | closed |
| T-43-28 | Repudiation | humans-decide text overstating the safety floor | high | mitigate | Wording names the git host as the hard floor and the ask rules as a speed bump, points to GUARANTEES.md, and a grep refuses `always` | closed: reworded by `86e6c366` (human decision 2026-11-18); `grep -cw always docs/concepts.md` prints 0; claim gates pass |
| T-43-29 | Repudiation | parallel work described without the open gap | medium | mitigate | The GAP-D1 sentence in § Open gaps; check-story-docs enforces it on every corpus page | closed |
| T-43-30 | Spoofing | a start command or live note changed in the move | medium | mitigate | START-1, CAUTION-1 and LIVE-3 retargeted to docs/usage.md in the same commit; the table moves byte for byte | closed |
| T-43-31 | Repudiation | a moved claim dropped or duplicated | medium | mitigate | Each moved anchor is checked to exist in exactly one file; rows keep ids; check-claim-anchors holds the bijection | closed |
| T-43-32 | Tampering | a non-spawning host row gaining spawn wording after the move | medium | mitigate | check-uat-oracles' asymmetry scan reads docs/usage.md | closed |
| T-43-33 | Repudiation | token, speed or count claims from the art draft reaching the README | high | mitigate | Only the six lettering-and-fire lines are copied; greps refuse the draft's claim words; the draft is never staged | closed |
| T-43-34 | Repudiation | a removed claim leaving no trace | medium | mitigate | Retired rows keep id and verbatim and name the last commit; a live test proves each named commit is on HEAD's history and holds the text, and fails by id and sha when it is not | closed |
| T-43-35 | Repudiation | the safety claim C-28-001 losing its floor join when it moves | high | mitigate | SAFETY_CLAIM_HOMES and the mirror move with it; guarantees and safety-surface outputs regenerated and freshness-gated | closed |
| T-43-36 | Repudiation | an overstated claim that passes every literal gate | high | mitigate | The ten-item reader review over every new and changed page, recorded per page with each fix and commit | closed |
| T-43-37 | Repudiation | the FAQ's unqualified "never merge or deploy" sentence | high | mitigate | Rewritten to name the git host as the hard floor and link GUARANTEES.md; a grep confirms the old sentence is gone | closed |
| T-43-38 | Tampering | a worked example drifting back to hand-trace instructions | medium | mitigate | examples/ in the permanent hand-trace scan with a moved, dated pin | closed |
| T-43-39 | Information disclosure | home paths or environment in committed transcripts | high | mitigate | redactText with both home spellings before writing; a grep in each verify refuses a home path in the phase directory | closed |
| T-43-40 | Tampering | the live session writing outside the scratch repo or into the user's kit home | high | mitigate | Scratch repo and scratch kit home outside the checkout; GRUGOPS_HOME set explicitly; the same scoped `--allowedTools` form capture-live uses | closed |
| T-43-41 | Repudiation | a UAT recorded as accepted without the human | high | mitigate | Blocking human checkpoint; acceptance written only from a reply ending with the typed name, quoted | closed: typed confirmation "T-43-28 A, T-43-41 A, redact yes. Olger" quoted in 43-UAT.md `## Human decision` (`b991ea34`) |
| T-43-42 | Tampering | prune removing an unrecorded `docs.bak.<ISO>` or `examples.bak.<ISO>` the user made | high | mitigate | Prune acts only through the record (owns); a case plants an unrecorded backup and asserts it survives | closed |
| T-43-43 | Tampering | DRY_RUN writing in the kit home | medium | mitigate | Every arm is decided before any write and DRY_RUN returns before writing; a case asserts the kit home is byte-unchanged | closed |
| T-43-SC | Tampering | npm/pip/cargo installs | low | accept | Every plan installs no package | closed (accepted) |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### How the two open threats were closed

- **T-43-28** (high). The first audit found `docs/concepts.md:8` "Humans always hold merge and deploy." (C-28-001, moved
  there byte for byte by 43-11 after 43-09's grep had passed), so the plan's "a grep refuses `always`" part failed. The
  human chose to reword it ("T-43-28 A", 2026-11-18, also reader-review F-07). Commit `86e6c366` rewords C-28-001 and
  its sibling C-28-023 (agent-factory/README.md) to name the git host as the enforcing floor and the ask rules as a
  speed bump, re-measures both registry rows (`overstated` → `true`, mechanism rewritten on the GUARANTEES.md tiers,
  F-28-201 and F-28-208 closed) and regenerates docs/GUARANTEES.md. Gates after the change: check:claim-anchors,
  check:audit-register, freshness:guarantees, check:public-docs, check:banned-claims, check:story-docs,
  freshness:catalog, check:residual-citations and check:diff-disposition exit 0. Other copies of the `always` sentence
  outside F-07's two claims (plugin.json C-28-038, the generated adapter line, the dogfood runbook) are listed in
  deferred-items.md; they are not part of T-43-28.
- **T-43-41** (high). The first audit found the UAT acceptance written with a name the human had not typed (reply "add my
  name, i approve"), recorded with that provenance. The human then typed the confirmation: "T-43-28 A, T-43-41 A,
  redact yes. Olger", quoted verbatim in 43-UAT.md `## Human decision` (commit `b991ea34`).

### Unregistered flags

- **Home path in committed red evidence (low, no threat ID).** Eight TDD red-evidence JSON files in the phase directory
  carried the absolute checkout path under the user's home. Redacted to `<repo>` in `b991ea34` at the human's request
  ("redact yes"); the earlier commits still hold the original text in git history.
- **Missing `## Threat Flags` sections.** 43-01, 02, 03, 04, 05, 07, 08 and 14 SUMMARY.md have none; the others report
  "None", and every flag they mention maps to a registered threat.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| — | T-43-SC | No package was added: `package.json` gained only the `check:story-docs` script line, and the lockfile is unchanged since the phase base | Plan register (all 15 plans) | 2026-11-18 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-18 | 44 | 42 | 2 | gsd-security-auditor (L1, block_on high) |
| 2026-11-18 | 44 | 44 | 0 | orchestrator re-check after `b991ea34` and `86e6c366` |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-18
