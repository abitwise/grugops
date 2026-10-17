---
phase: 33-live-capture-windows-portability
plan: 23
subsystem: traceability
tags: [windows-ledger, deferred-items, requirements, state, gap-closure-round-2, accepted-open, kit-decisions, cap-01, cap-02, cap-03, d-11, d-17, d-20]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: the 18 accepted-open review findings (33-REVIEW.md) left unfixed by the human's scope decision; the four KIT items and the human's directions (33-21-SUMMARY.md KIT decision record); plan 33-20's CAP-02 verdict on run 35579263776; the fix plans' commits (33-14..33-19); the round-2 hold (33-22, manifest section 7)
provides:
  - WINDOWS.md rows 237-254 — one accepted-open row per review finding (WR-01..03, WR-05..13, IN-02..07), finding id in the description, appended through the tool, left open
  - WINDOWS.md rows 255-258 — the four KIT items (33-DIAGNOSIS section 1.4 (a), 1.4 (b), 2, 3) with the human's ledger-and-hold direction for (a) and (b), appended through the tool
  - deferred-items.md — nine entries resolved with plan / task / commit / run citations; three left open with dated round-2 notes (the ten context-io reds, the stale plugin rows, GAP-D1)
  - REQUIREMENTS.md CAP-01 / CAP-03 coverage rows naming the round-2 hold evidence; CAP-02 byte-unchanged from plan 33-20
  - STATE.md frontmatter and Current Position reading round 2 EXECUTED, awaiting verification
affects: [phase-33-verification, phase-33-gap-closure-round-3, ship-gate, cap-01, cap-02, cap-03]

# Actuals (#2632) — chars/4 over the realized diff 9fdaeb45..HEAD (4 files, +339/-18), not a harness token count.
actuals:
  tokens: 19072
  tasks: 3
  commits: 3
plan_head_before: 9fdaeb456b338e895d5b1224db41571bade65631

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A review finding the round does not fix is a ledger row with its id, appended through the tool and left open (accepted-open is a disposition on the description; waive is for a finding the project refuses)"
    - "A deferred item is resolved only with the evidence its own owner line asked for — the fix commit, and for a CI class the run id whose leg measured it green; an item the measurement did not confirm keeps status: open with a dated round note quoting the inventory"
    - "Capture-backed and run-backed citations are never mixed in a requirement row: CAP-03 cites capture artifacts only, CAP-02 cites the CI run only"

key-files:
  created:
    - .planning/phases/33-live-capture-windows-portability/33-23-SUMMARY.md
  modified:
    - .planning/WINDOWS.md
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md

key-decisions:
  - "Eighteen review rows use --kind deviation and stay open (not waived): the human deferred them, the project did not refuse them; the description carries the finding id, the review's one-sentence issue, the proposed fix in one clause, and the owner (a later round)"
  - "The review's line numbers are cited as reviewed (2026-09-20) and labelled so in every description: capture-live.ts moved under 33-12/33-13 after the review, and re-deriving lines would be a second authority"
  - "KIT (a) and (b) are --kind unrun-verify (a runtime fact the round could not establish), sections 2 and 3 are --kind deviation (offline-reproduced defects); the direction quoted is the human's exact words from 33-21's record"
  - "No WINDOWS.md row was flipped: rows 186 and 229-235 are disposed only on a run whose both legs read success (plan 33-20's rule); this plan records their state and cites run 35579263776 only in deferred-items.md, for the leg that measured each class green"
  - "The ten context-io reds entry stays open although 8 of 10 are green: W-20 and W-21 moved onto the 8.3 class (row 236) on the same run, and a class is not closed while two of its members are red one arm over"
  - "STATE.md's Plan line stays `Plan: 22 of 23` for the advance tool (the parser anchors on `N of M`); the round-2 facts the plan asked for on that line sit on the phase line and one line beneath"
  - "CAP-01, CAP-02, CAP-03 are NOT marked complete and requirements.mark-complete was NOT run: all three are edge rows this plan records, not decides"

patterns-established:
  - "Ledger close of a gap-closure round: count the appends before and after (open_count delta == rows planned), count the deferred entries before and after (before - resolved == after), and assert both equalities in the summary"

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Twenty-two WINDOWS.md rows appended through the tool — eighteen accepted-open review findings with their ids and four KIT items with the human's direction — open_count moved by exactly 22, no hand edit, three representations agree"
    verification:
      - kind: other
        ref: "node ~/.claude/gsd-core/bin/gsd-tools.cjs windows status → open 207 → 229 (+22), waived 3, fixed 26, total 236 → 258; table rows 258; JSON ids 258"
        status: pass
      - kind: other
        ref: "grep -a -c '33-REVIEW WR-\\|33-REVIEW IN-' .planning/WINDOWS.md → 36 (18 in the table + 18 in the JSON appendix); grep -a -c '33-DIAGNOSIS section' → 8"
        status: pass
    human_judgment: false
  - id: D2
    description: "Nine deferred items resolved with plan, task, commit and (for CI classes) run 35579263776 citations; three left open with dated round-2 notes quoting the evidence; before - resolved == after"
    verification:
      - kind: other
        ref: "grep -a -c 'status: open' deferred-items.md → 12 before, 3 after; grep -a -c '^  status: resolved' → 2 before, 11 after; grep -a -c 'Resolved by:' → 11; 12 - 9 = 3; every cited sha resolves with git cat-file -t"
        status: pass
      - kind: other
        ref: "gsd-tools audit-open lists exactly three Phase 33 deferred items open (the ten context-io reds, the stale plugin rows, GAP-D1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "REQUIREMENTS.md CAP-01/CAP-03 carry the round-2 hold text with the evidence named, CAP-02 is byte-unchanged from 33-20; STATE.md edited in the frontmatter and Current Position only, guards green, longest line unchanged"
    verification:
      - kind: other
        ref: "diff of the CAP-02 row against git show 4c72d8b0:.planning/REQUIREMENTS.md → identical; the three checkboxes still `[ ]`; node scripts/check-flip-manifest.js → ALL CHECKS PASSED"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js → ALL CHECKS PASSED; awk longest line → 2524; gsd-tools query state.load → exit 0; the last STATE.md commit's diff carries 0 lines matching the three guarded beats"
        status: pass
    human_judgment: false
  - id: D4
    description: "Whether the accepted-open dispositions and the three open deferred items are the right reading of the human's scope decision and the round-2 measurements"
    verification: []
    human_judgment: true
    rationale: "The rows record a human decision (scope, 2026-09-20; ledger-and-hold, 2026-09-21) and the plan's own resolve-only-on-evidence rule; whether a verifier agrees that 8-of-10 green with two members moved is 'open' rather than 'resolved' is a judgment the verifier re-takes"

# Metrics
duration: 9 min
completed: 2026-09-21
status: complete
---

# Phase 33 Plan 23: The round-2 ledger close — twenty-two rows through the tool, nine deferred items resolved on evidence, three left open, requirement rows and state truthful to a held round Summary

**Nothing from the round's review or diagnosis is dropped in silence: the eighteen review findings the human's scope decision left unfixed and the four KIT items the human dispositioned `ledger-and-hold` are WINDOWS.md rows 237–258, appended through `gsd-tools windows append` with `open_count` moving 207 → 229; nine Phase 33 deferred items carry `status: resolved` with the fix commit and the CI leg that measured each class green on run `35579263776`, three stay open with dated round-2 notes (12 − 9 = 3); CAP-01 and CAP-03 read Pending with the round-2 hold named and CAP-02 is byte-unchanged from plan 33-20; STATE.md reads round 2 EXECUTED, awaiting verification, with the guarded beats untouched.**

This note is written in clear professional voice: it bears on requirement status across the project's records and on the no-fabrication rule (every disposition cites a measurement or is left open), and CLAUDE.md forbids the caveman register on those surfaces.

## Performance

- **Duration:** 9 min (`.git/gsd-plan-start-33-23` 2026-09-21T10:50:25Z → the Task 3 commit at 10:59; the plan-level vitest run and this summary follow)
- **Started:** 2026-09-21T10:50:25Z
- **Completed:** 2026-09-21T11:08:00Z (this summary)
- **Tasks:** 3 of 3
- **Files modified:** 4 (`.planning/WINDOWS.md`, `deferred-items.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`) plus this summary
- **Token spend on the platform:** zero — no `claude` invocation, no `capture-live.js` run, no `npm test`

## Accomplishments

- **Task 1 — 22 rows, counted.** `windows status` before: `open_count 207, waived 3, fixed 26, total 236`; after: `open_count 229, waived 3, fixed 26, total 258`. Delta +22, exactly the eighteen review rows (237–254) plus the four KIT rows (255–258). The markdown table has 258 id rows, the JSON appendix 258 `"id":` entries; `grep -a -c '33-REVIEW WR-\|33-REVIEW IN-'` → 36 (each finding once in the table, once in the JSON). No hand edit; every row through the tool, every command quoted below.
- **Task 2 — the deferred list is a truthful record.** `status: open` 12 → 3; entry-level `status: resolved` 2 → 11; `Resolved by:` lines 2 → 11; the equality 12 − 9 = 3 holds. Every resolved line names the plan, the task, the commit sha (each resolves with `git cat-file -t`) and, for a CAP-02 class, run `35579263776` with the leg that measured it and the sentence from Part 3 § 3.3 it rests on. The three open entries carry a dated `Round 2 (2026-09-21, plan 33-23 Task 2):` line quoting the evidence for leaving them open.
- **Task 3 — the current-state ledgers say what the round produced.** CAP-01: round 2 HELD, no capture, dry run `not-ready` on the pushed-sha row alone, `OUTCOME: no-go`, the human's `ledger-and-hold`, hold record manifest § 7, the two flip amendments round 3 owes. CAP-03: the round-1 observation stands as evidence pending the flip; the round-2 instrument is independent (CR-01) and provenance-checked (CR-02); the re-capture was not produced; capture-backed citations only. CAP-02: byte-identical to plan 33-20's write (diffed against `4c72d8b0`). STATE.md: `status`, `last_activity`, `last_activity_desc`, the Current Position phase line and one round-2 line; nothing else; `check-foundation-guards` green; longest line 2524, unchanged; `state.load` exit 0.
- **The tree is still green at the round's close** (plan-level `<verification>`): `npx tsc --noEmit` exit 0; `npx vitest run --exclude '**/scripts/e2e/**'` → `Test Files 78 passed (78)`, `Tests 5375 passed | 2 skipped (5377)`, `Duration 493.28s`, exit 0 (the same counts 33-21's dry-run report recorded; no source file changed in this plan); `npm run check:nul-bytes` → `ALL CHECKS PASSED`. `npm test` was not run.

## Task Commits

1. **Task 1: Twenty-two ledger rows through the tool** — `37e885b1` (docs) — `.planning/WINDOWS.md` only
2. **Task 2: Deferred items resolved with citations, or honestly left open** — `04aad635` (docs) — `deferred-items.md` only
3. **Task 3: The requirement rows and the project position agree with the artifacts** — `7ac95589` (docs) — `.planning/REQUIREMENTS.md`, `.planning/STATE.md`

**Plan metadata:** the commit that carries this summary, and the STATE/ROADMAP close-out commit after it. All local; nothing pushed (the human's standing instruction: every commit stays local until the finish; `origin/main` is still `9e1c1131`, HEAD 12 commits ahead at this summary).

**Commit count, measured (#3968):** `git rev-list --count 9fdaeb45..HEAD` at the moment this summary was written → `3`. `git diff --diff-filter=D` on each of the three → no deletions.

## Task 1 — the twenty-two commands, verbatim

Run as one `set -euo pipefail` script (a refused append would have stopped it before the count could drift); the three shell variables are expanded by bash before the tool sees the description, so each row's description is `$P WR-NN $S: … ; $O` with those values spelled out.

```bash
T="node $HOME/.claude/gsd-core/bin/gsd-tools.cjs"
P='33-REVIEW'
S='accepted open (human scope decision 2026-09-20: round 2 = Criticals + CAP gaps only; line as reviewed)'
O='owner: a later round'

$T windows append --kind deviation --phase 33 --file scripts/capture-live.ts --line 265 --description "$P WR-01 $S: the per-spawn approval-key assertion does hasOwnProperty on the exact spelling GRUGOPS_PROD_DEPLOY_APPROVED, but win32 environment names are case-insensitive, so a lower-cased key inherited by the child disarms the deny while the assertion passes — compare every key case-insensitively and refuse on a match, with a lower-cased-key test; $O"        # row 237
$T windows append --kind deviation --phase 33 --file scripts/capture-live.ts --line 838 --description "$P WR-02 $S: homeSpellingForms produces the backslash home and its JSON-escaped form only, so a C:/Users/x or file:///C:/Users/x spelling is neither redacted nor counted by homeSpellingSurvivors (the fail-closed check is vacuous for the forms it does not enumerate) — add the forward-slash and file-URL forms plus their JSON-escaped twins to the one set, with a test that a C:/Users/alice spelling does not survive; $O"        # row 238
$T windows append --kind deviation --phase 33 --file scripts/capture-live.ts --line 1226 --description "$P WR-03 $S: when no deny fired the negative D-04 row cites transcript line 1 (cite(0)) solely so the row is not withheld, a citation unrelated to the claim that --verify-artifacts cannot tell from a supported one — cite the last hook_response frame examined (record its index in DenyObservation) with the examined count in the value, or extend the grammar with jsonl:<first>-<last> for whole-transcript negatives; $O"        # row 239
$T windows append --kind deviation --phase 33 --file scripts/capture-live.ts --line 1556 --description "$P WR-05 $S: capture() fails only when grantSource.coordinator is null; deriveGrant's reasons for a census/grant mismatch, an unresolved granted name or an ungranted adapter are ignored before the spend and surface only inside capThreePredicate after both runs, and the readiness table carries no grant row — add a grantReasons precondition observation and a row that is UNMET when non-empty; $O"        # row 240
$T windows append --kind deviation --phase 33 --file scripts/capture-live.ts --line 954 --description "$P WR-06 $S: the pushed-sha precondition compares HEAD to origin/main but the installer copies the WORKING TREE's kit while the plugin comes from GitHub at the pushed sha, so uncommitted edits under agent-factory/ or .claude/agents/ make the two paths different code while the row reads MET — probe git status --porcelain --untracked-files=no and add a working-tree-clean row that is UNMET on any output; $O"        # row 241
$T windows append --kind deviation --phase 33 --file scripts/capture-live.ts --line 1106 --description "$P WR-07 $S: the live runs spawn the platform with the operator's real ~/.claude configuration, so other user-scope plugins, hooks and settings (context7, playwright, superpowers in the round-1 init frames) participate in the capture and the target is not the isolated instrument D-03 describes — run with CLAUDE_CONFIG_DIR at a scratch config seeded with only the marketplace row route 2 needs, or add a precondition row requiring system/init.plugins[] to name exactly the plugin under test and fold a violation into anyFailure; $O"        # row 242
$T windows append --kind deviation --phase 33 --file scripts/check-flip-manifest.ts --line 706 --description "$P WR-08 $S: checkResidual skips any line where line.includes(anchor) and checkLocators refuses an anchor only when it occurs zero times, so a short anchor occurring many times (GAP-D1, or a dash-space) is accepted and then exempts every residual line in that file — a fail-open arm inside the rule whose purpose is to refuse survivors — require countOccurrences === 1 in checkLocators and match the anchor against the whole trimmed line or the declared line number in checkResidual; $O"        # row 243
$T windows append --kind deviation --phase 33 --file scripts/check-flip-manifest.ts --line 458 --description "$P WR-09 $S: archivedRecords is declaredSet(m) filtered on .planning/milestones/, so the derived side is read from the manifest and compared with the manifest's own members table — one hand-typed set on both sides, and an archived record carrying pending human that the manifest does not name is invisible to the residual rule — derive from git ls-files over .planning/milestones with a content rule read at the pre-capture commit, keeping the declared-set intersection only as the listing to compare against; $O"        # row 244
$T windows append --kind deviation --phase 33 --file scripts/check-platform-shapes.ts --line 459 --description "$P WR-10 $S: the FIFO make() returns false on ANY non-zero mkfifo exit (binary absent, EACCES on the scratch root, a wrong argument) so every migrated FIFO case console.warns and returns green where it used to throw, and stageShapeOrSkip/hostCapabilityOrSkip honour GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT first, so one CI variable turns every FIFO, symlink and chmod case into a skip with the suite green — assert the remainder per CI leg where it is known (ubuntu requires SKIPPED SHAPES (0)), restrict the FORCE_ABSENT seam to the corpus's own test or behind a second opt-in, and have make() return false only for ENOENT on spawn; $O"        # row 245
$T windows append --kind deviation --phase 33 --file scripts/check-platform-shapes.ts --line 709 --description "$P WR-11 $S: stageNameOrSkip maps every ENOENT or EINVAL thrown by the caller's construct() to the control-byte platform-refusal skip without checking that the path carries a byte below 0x20, so a missing parent directory (a caller bug) is reported as a platform refusal and the case turns green with a misleading row — take the path as a parameter, require a control byte in its basename up front, and confirm the parent exists before treating the error as a platform refusal; $O"        # row 246
$T windows append --kind deviation --phase 33 --file scripts/e2e/uat-live.test.ts --line 280 --description "$P WR-12 $S: afterAll runs claude plugin marketplace remove grugops --scope local and claude plugin uninstall grugops --scope local with cwd tmpRepo-or-ROOT, but the runner never adds a marketplace (the user-scope grugops row is the D-05 route-2 PRECONDITION) and already uninstalls per target, and with tmpRepo still empty both mutating commands run in the repository checkout — delete the marketplace-remove call, guard the uninstall on tmpRepo being set, never use ROOT as the cwd for a mutating platform command; $O"        # row 247
$T windows append --kind deviation --phase 33 --file scripts/capture-live.ts --line 1004 --description "$P WR-13 $S: observePreconditions computes approvalKeyPresent and then calls spawnEnv(), which throws a CaptureFailure when the key is set, so the D-10 three-state table is never built and the operator sees CAPTURE NOT DERIVED instead of an UNMET row — fail-closed, but the documented readiness contract is not what is shown and the UNMET branch is exercised only by the offline suite — build the observation without spawning when the key is present, evaluate and print the table, then refuse in capture(), keeping spawnEnv's refusal as the last line of defence; $O"        # row 248
$T windows append --kind deviation --phase 33 --file scripts/capture-live.ts --line 716 --description "$P IN-02 $S: readdirSync never returns . or .. and TASK_DIR_RE already excludes a bare dot, so the entry.name equals-dot-or-dot-dot clause is dead code that cannot fire — remove the clause; $O"        # row 249
$T windows append --kind deviation --phase 33 --file scripts/capture-live.test.ts --line 86 --description "$P IN-03 $S: contextRootWithNotes creates a grugops-capture-live-test-ctx-* directory under the OS temp directory on every call and no case removes it; the dry-run case's no-scratch-survives assertion excludes the test- prefix so the leak is invisible to the suite — collect the roots in an array and rmSync them in afterAll; $O"        # row 250
$T windows append --kind deviation --phase 33 --file scripts/board-watch.test.ts --description "$P IN-04 $S: expectEndedBySigint and its two-case self-test describe are copied verbatim into scripts/board-watch.test.ts and scripts/board-dashboard.test.ts — move the helper to a shared test module and keep one self-test; $O"        # row 251
$T windows append --kind deviation --phase 33 --file scripts/check-foundation-guards.test.ts --description "$P IN-05 $S: hand-pinned counts bumped in this phase (NON_TEST_MODULE_COUNT = 89, 62, TRIPWIRE_MODULES = 72, targets: 11; check-claim-anchors.test.ts toBe(17) followed by a tautological not.toBe(18); check-banned-claims.test.ts bannedClaimScanOverlap() pinned to 2) are the set-literal pattern the project's memory names — where a count can be derived (git ls-files, the corpus array) assert the relationship rather than the integer, and drop the redundant negative; $O"        # row 252
$T windows append --kind deviation --phase 33 --file scripts/check-flip-manifest.ts --line 646 --description "$P IN-06 $S: manifestDir is split on / only and the status flip row compares row.file byte-for-byte with the CLI value, so a --manifest spelled with backslashes by a Windows operator yields a summary path of 33-CAPTURE-SUMMARY.md at the repo root and a false status-row refusal — const manifestRel = toPosix(cli.manifest) at the top of main(); $O"        # row 253
$T windows append --kind deviation --phase 33 --file scripts/check-flip-manifest.ts --line 596 --description "$P IN-07 $S: changedFiles runs git diff-tree --no-commit-id --name-only -r --root <commit>, which prints nothing for a merge commit without -m or -c, so a flip landing via a merge reports every declared file as omitted — fails closed with a message naming the wrong cause — use git diff --name-only -z <c>^ <c> for the single-commit form (or add -m --first-parent) and name merge commits in the refusal text; $O"        # row 254

K='33-DIAGNOSIS'
H='accepted open for round 3 (human decision ledger-and-hold at plan 33-21 Task 2, 2026-09-21)'
$T windows append --kind unrun-verify --phase 33 --file .claude/agents/grugops-orchestrator.md --line 5 --description "$K section 1.4 (a) $H: on the --agent path the coordinator carries the installed adapter's seven-tool grant (.claude/agents/grugops-orchestrator.md:5 — Agent(sixteen roles), Read, Grep, Glob, Edit, Write, Bash; init frame B:11 lists exactly those seven), which does not include the plugin's MCP admission tool mcp__plugin_grugops_grugops__propose_note, so on that path the coordinator cannot propose notes through the sanctioned writer — deterministically, by construction of the grant (evidence section 1.3 (i), round-1-held/ B:11 vs A:11). DIRECTION, the human's words: carry the MCP admission tool (propose_note) in the --agent coordinator adapter's grant — touching the spawn-grant derivation, its census pins and the guard oracles; the alternative (telling role adapters where the sanctioned writer lives under the plugin cache) was not chosen. Owner: round 3"        # row 255
$T windows append --kind unrun-verify --phase 33 --file scripts/context-io.ts --description "$K section 1.4 (b) $H: the reader (readContext, scripts/context-io.ts) admits notes written into .grugops/context by anything other than the sanctioned writer — path B's nine notes were written with the Write tool straight into the context root (round-1-held/ B:774, B:795, B:817, B:1542, B:1607, B:1638, B:1757, B:1779, B:1802) and read back as if admitted, so the WF16 single-writer rule held on path A by tooling and on path B by nothing (evidence section 1.3 (ii)). DIRECTION, the human's words: refuse non-sanctioned (hand-written, Write-tool) notes on read; the alternative (keep admitting them) was not chosen. Owner: round 3"        # row 256
$T windows append --kind deviation --phase 33 --file hooks/guard.ts --description "$K section 2 $H: the guard (hooks/guard.ts + scripts/checkpoints.ts) classifies a 2>&1 redirection and an ordinary \$var expansion as substitutions it will not reason about and refuses any such segment carrying git or npm anywhere in it, on tool name alone — fifteen over-matched denies across the two round-1 transcripts (A:454 … B:1750). Reproduced offline against the committed guard on stdin with no GRUGOPS_ variable set: git log --oneline -5 -> allow; git log --oneline -5 2>&1 -> deny (matched by the command model, the git push sentence printed for a git log); echo \"npm run lint\" -> allow; echo \"npm run \$s\" -> deny (carries a shell substitution the guard will not reason about); matchCommandCheckpoints reports untokenizable: true for both. Fails closed — an availability defect, not a safety hole; no offline test covers the class (275 guard tests green). Correction named by the diagnosis: the tokenizer's redirection-vs-substitution classification, and the deny text. No further direction stated beyond accepted-open. Owner: round 3"        # row 257
$T windows append --kind deviation --phase 33 --file scripts/context-io.ts --line 1416 --description "$K section 3 $H: admitAndAppend / composeNote (scripts/context-io.ts:1416) interpolates \${note.verified_by} with no presence check and writes the line verified_by: undefined — the string — for an absent field; undefined is not in the DeLM hollow-evidence list (context-io.ts:205), so the note reads back with a non-empty stamp no gate and no human set (path A notes [6]-[9]). Reproduced offline: admitAndAppend with no verified_by key returns findings: [] and the file carries verified_by: undefined; passing the key explicitly undefined serializes identically, so the fault is serialization, not the caller's spelling. Did not touch any verdict the round reads. No further direction stated beyond accepted-open. Owner: round 3"        # row 258

$T windows status
```

Row-by-row, the ledger tool answered `ok: true` with the new id each time; the table and the JSON appendix carry the same 22 descriptions (`grep -a -c 'accepted open'` → 44 = 22 × 2). WR-12's `tmpRepo || ROOT` and IN-02's `entry.name === "." || entry.name === ".."` were spelled without the pipe character in the descriptions (`tmpRepo-or-ROOT`, `equals-dot-or-dot-dot`) so the table cell could not be split; the tool escapes a literal pipe as `\|` (rows 15 and 23 show it), so this was caution, not necessity.

**The three folded findings, named so the ledger does not carry them as accepted-open:**

| Finding | Folded by | Where |
|---|---|---|
| IN-01 (local `toPosix` duplicates `scripts/posix-path.ts`) | plan 33-12 Task 3 (`c4abf909`) | `toPosix` imported from `./posix-path.js`; the local one-liner gone (`split(sep).join("/")` count 0) — 33-12-SUMMARY.md § Accomplishments "IN-01 folded" |
| WR-04 (`git -C <path from the transcript>`) | plan 33-12 Task 3 (`c4abf909`) | `pluginCachePathAccepted` validates the init frame's path under `~/.claude/plugins` (dash-prefix, realpath, directory, strict containment, symlink escape refused); `installedPluginSha` and the `git -C` call are gone — 33-12-SUMMARY.md § Accomplishments "CR-02 + WR-04" |
| IN-08 (`--out` consumes a following flag) | plan 33-13 Task 2 (`0a545e11`) | `outValue()` refuses an `--out` value beginning with `--` in both spellings; Test R — 33-13-SUMMARY.md § Accomplishments "IN-08 (folded into Task 2)" |

The five Criticals (CR-01..05) are closed by 33-12 and 33-13 and are not rows either; 18 + 3 folded + 5 fixed = 26 = the review's `findings.total`.

## Task 2 — the deferred list, entry by entry

Before: 14 entries, `status: open` 12, entry-level `status: resolved` 2 (the round-1 pair: `check:diff-disposition` by 33-09, the TMPDIR class by 33-06). After: `status: open` 3, `status: resolved` 11, `Resolved by:` 11. **12 − 9 = 3.** (The plan's `grep -a -c 'status: resolved'` reads 12 because line 4 of the file — the header prose "until it carries an explicit `status: resolved`" — matches too; the entry-level count is 11 and every one of the 11 has its `**Resolved by:**` line directly beneath, `grep -B1 -A1 'status: resolved' | grep -c 'Resolved by:'` → 11.)

| # | Entry | Disposition | Citation (plan · task · commit · measurement) |
|--:|---|---|---|
| 1 | `board-watch-live.test.ts` DASH-04 debounce miss | **resolved** | 33-20 Task 3 `4c72d8b0`; run `35579263776` BOTH legs green for the file (`✓ … (6 tests) 7706ms` windows, `7292ms` ubuntu; Part 3 § 3.3 "Row 186 … the third measurement"); WINDOWS.md row 186 NOT disposed (both-legs-`success` rule) |
| 2 | directory-symlink fixtures not D-16-guarded | **resolved** | 33-16 Task 3 `feb2dd5e` (mechanism: `symlinkSync` 10 → 0, `stageSymlinkOrSkip` 4 → 13, seam proof 35 SKIPPED rows / 663 passed); confirming: run `35579263776` windows, every fixture staged, no skip row from the thirteen sites (Part 3 § 3.3 "D-16 on the runner") |
| 3 | `check-build-parity.ts:132` `npx tsc` launch | **resolved** | 33-19 Task 3 RED `bb6a1ffc` GREEN `010781eb`; confirming: run `35579263776` ubuntu step 6 `success`, `PASS Build parity: … 0 findings over 69/69 elements` (Part 3 § 3.2 per-step table; ubuntu-scoped step) |
| 4 | ten windows reds in `context-io.test.ts` | **open** — Round 2 note | 33-15 (`81c94750`, `407cb23f`, `e0b9c518`) + 33-16 (`c1fca72b`) by mechanism; run `35579263776`: 8 of 10 green, W-20 and W-21 red one arm over on the 8.3 class (row 236), both inventory rows quoted verbatim; owner round 3 at one authority |
| 5 | two windows reds in `uat-spec-integrity.test.ts` (W-30, W-31) | **resolved** | 33-17 Task 1 RED `ef6b6de9` GREEN `1dcce77b`; confirming: run `35579263776` windows, the file not in `Failed Tests 35` (only `context-io.test.ts` failed) |
| 6 | o-prefix echo in `check-foundation-guards.test.ts` (W-11) | **resolved** | 33-19 Task 1 `028ec889`; confirming: run `35579263776` windows, file not in `Failed Tests 35` |
| 7 | `publicDocsCorpus()` host-separated members (W-1..W-10) | **resolved** | 33-14 Task 1 RED `6681ead5` GREEN `bb784148`, Task 2 `4fe84114`; confirming: run `35579263776` windows, neither consumer file in `Failed Tests 35`; row 229 NOT disposed |
| 8 | two UBUNTU reds `GREEN 1b` / `ORDERING` (U-1, U-2) | **resolved** | 33-17 Task 2 `387fa0fd` (diagnosis) + Task 3 RED `94f3a792` GREEN `500cbfd6`; confirming AND settling the diagnosis: run `35579263776` ubuntu `success`, `[33-17 boundary] … shift 1 · node v22.23.2 linux/x64`; row 230 NOT disposed |
| 9 | `uat-gate-exit-contract.test.ts` four (W-13..W-16) | **resolved** | 33-18 Task 1 RED `e5d98b8a` GREEN `b23de153`, Task 2 `ede586f9`; confirming: run `35579263776` windows, W-13 `59 235 ms` PASSED under the 180 000 ms global bound (Part 3 § 3.3 slowest-tests rank 2), file not in `Failed Tests 35`; rows 231/232 NOT disposed |
| 10 | three incomplete fixes one arm over (W-12, W-27/W-28, W-29) | **resolved** | 33-18 Task 3 `da755b7a`; 33-15 Task 3 `e0b9c518` (+ 33-16 `6a6e46d3` exporting `cell`); 33-16 Task 2 RED `776afe47` GREEN `d9ac6bdd`; 33-19 Task 2 `0e93d26b`; confirming: run `35579263776` windows — `W-28 green` quoted, `:14059`/`:15771` outside the `:6456–:8605` block holding all 35 reds, the other two files not in `Failed Tests 35`; rows 233/234/235 NOT disposed |
| 11 | two stale `grugops@grugops` 0.1.0 plugin rows | **open** — Round 2 note | no round-2 run, so no post-run listing; the dry run's row `\| plugin listing readable \| MET \| the listing names grugops \|` (33-R2-DRYRUN-REPORT.md line 140) does not quote the rows; owner unchanged (the human, or the next CAP-03 round) |
| 12 | GAP-D1 HELD at 33-11 | **open** — Round 2 note | HELD AGAIN: comparator settled by 33-12 `99a40da7`, KIT riders dispositioned `ledger-and-hold` (rows 255–258), no go asked for (`no-go`), `.planning/PROJECT.md` confirmed in the declared set; hold record manifest § 7 (33-22 `5c691ab2`); round 3 owes the two flip amendments; two rounds remain |

`gsd-tools audit-open` after the commit lists exactly these three Phase 33 deferred entries as open. The two other run ids that appear in the file (`35394268365`, `35499800942`) are the earlier green measurements of entry 1 by id, as Part 3 § 3.3 lists them — not a citation for a resolution.

## Task 3 — the three requirement rows as they read at the end of the round

CAP-01 (coverage table, L226) — hold branch:

> Pending — gap-closure round 2 of 4 HELD (2026-09-21). Round 1: the capture performed 2026-09-20 (plan 33-10) reads `OUTCOME: fail` on the D-07 comparator; GAP-D1 held at plan 33-11 by human decision (D-20); the capture set is preserved unedited under `round-1-held/` (plan 33-21, commit `fe87c5ac`). Round 2: no capture — the instrument was corrected offline (plan 33-12: path-invariant D-07 projection, under which the held round-1 capture still reads divergent by six named sentences), the zero-token dry run of 2026-09-21 reads `GO-READINESS: not-ready` on the pushed-sha row alone and one outcome line `OUTCOME: no-go` (`33-R2-DRYRUN-REPORT.md` lines 144, 254; its parity line `parity: the two projections are equal` is over the committed fixture, not parity evidence; its provenance row reads `UNKNOWN - verify` over the fixture), and the human answered `ledger-and-hold` at plan 33-21 Task 2 before any go was asked for (the four KIT items are WINDOWS.md rows 255–258). Nothing flipped; hold record `33-FLIP-MANIFEST.md` § 7 (plan 33-22, commit `5c691ab2`; § 6 is the round-1 hold), status still `pre-capture`. Round 3 owes (a) the coordinator grant carrying `propose_note`, (b) the reader refusing non-sanctioned notes, then a fresh go (D-09); the flip carries § 7's two amendments (`.planning/PROJECT.md` in the one commit; row F14's plan number). Evidence: `round-1-held/33-CAPTURE-SUMMARY.md` (round-1 capture), `33-R2-DRYRUN-REPORT.md` (round-2 readiness), `33-21-SUMMARY.md` § KIT decision record, `33-FLIP-MANIFEST.md` §§ 6–7. Two rounds remain under the four-round cap.

CAP-02 (L227) — byte-unchanged from plan 33-20's write (`diff` against `git show 4c72d8b0:.planning/REQUIREMENTS.md` on that row: identical):

> Pending — NOT met: CI run `35579263776` (head `9e1c1131`, 2026-09-21) — `test (ubuntu-latest)` conclusion `success` (78/78 files, 5376 passed, the gate chain reached and green for the first time); `test (windows-latest)` conclusion `failure` (1 file, 35 reds in `scripts/context-io.test.ts`, one class: 8.3 short-name spelling, WINDOWS.md row 236). Round 1: run `35499800942` failure on BOTH legs (ubuntu 2, windows 31). Evidence: `33-CI-MEASUREMENT.md` Part 3 § 3.2–3.4 (plan 33-20); Part 2 (plan 33-09) for round 1 — a different artifact from the capture summary; the two citations are not interchangeable.

CAP-03 (L228) — hold branch:

> Pending — gap-closure round 2 of 4 HELD (2026-09-21). Round 1 (2026-09-20): both CAP-03 sides held in both dispatch paths (`grugops-brownfield-mapper`, `grugops-architect-design`, `grugops-security-nfr` in their own sessions on paths A and B; 13/15 and 9/9 notes stamped by role agents) and the D-04 deny was observed on the hook channel in both runs — that observation stands as evidence pending the flip, but the requirement is not marked complete: the run's outcome word is `fail` (D-11, D-20) and the round-1 instrument scored a transcript inside the agent's own writable cwd (review CR-01) with the plugin's provenance unverified (CR-02). Round 2: the instrument is now independent — the scored transcript is streamed into a runner-owned scratch outside every target and the cwd, a forged in-target deny frame is never read (plan 33-12, CR-01) — and provenance-checked by content digest over the checkout's tracked set, with `pass` unreachable unless the digest reads MET (plan 33-12, CR-02); a failed plugin install stops the run before any spawn and the paid transcripts survive every failure (plan 33-13, CR-05/CR-04). The re-capture on the corrected instrument was NOT produced this round: the go was held at plan 33-21 Task 2 (`ledger-and-hold`, outcome word `no-go`, zero tokens spent), because the diagnosis's divergence (i) — the `--agent` coordinator grant lacking `propose_note` — is deterministic and would have diverged again for a KIT reason (WINDOWS.md row 255). Evidence: `round-1-held/33-CAPTURE-SUMMARY.md` § CAP-03 verdict (D-02), runs A and B (round-1 capture); `33-R2-DRYRUN-REPORT.md` `transcript location` and `installed plugin provenance` rows (round-2 instrument, dry run — not a capture); `33-21-SUMMARY.md` § "The held go". Capture-backed citations only; no CI run is evidence for this row.

The three checkboxes at L140–L142 still read `- [ ]`; `node scripts/check-flip-manifest.js` after the edit → `ALL CHECKS PASSED` (rows F44/F45 anchor on those checkboxes; F46 on the SPAWN-03 row, untouched). The one correction inside the two rows beyond the plan's letter: the round-1 citation `33-CAPTURE-SUMMARY.md` now reads `round-1-held/33-CAPTURE-SUMMARY.md`, the path where plan 33-21 moved it, so the citation resolves.

STATE.md, the diff (`git show --format= 7ac95589 -- .planning/STATE.md`): three frontmatter fields (`status`, `last_activity`, `last_activity_desc`) and, under `## Current Position`, the phase line → `Phase: 33 (Live Capture & Windows Portability) — gap-closure round 2 of 4 EXECUTED 2026-09-21, awaiting verification` plus one new line `Round 2 (33-12..33-23): CI run 35579263776 ubuntu \`success\` / windows \`failure\` (CAP-02 NOT MET, row 236); capture outcome word \`no-go\` (go held at 33-21); GAP-D1 HELD (manifest section 7); ledgers closed by 33-23. CAP-01/02/03 Pending.` `Plan: 22 of 23` was left for `state.advance-plan` (see Deviations). `grep -cE '^[-+].*(guard_wr05.*Phase 10|re-verified GREEN.*Phase 11|dropped.*Phase 8)'` over that diff → 0; no backslash added (`+`/`-` lines carrying one: 0); `node scripts/check-foundation-guards.js` → `ALL CHECKS PASSED`; longest line 2524 before and after; `gsd-tools query state.load` → exit 0.

## WINDOWS.md rows this plan did NOT flip, and why (their state recorded here)

Rows 186 (`board-watch-live.test.ts`), 226–228 (the round-1 predicted survivors: the context-io ten, the uat-spec pair, the o-prefix one), 229–235 (the seven round-1 finding classes) and 236 (the 8.3 class) are all still `open`. Every case in rows 227–235 and 186 is green on run `35579263776`; row 226's ten are 8 green / 2 moved onto row 236; row 236 is the run's red. Plan 33-20's rule — and the fix plans' summaries, which each say their rows "flip only on plan 33-20's pushed run reading green" — disposes a ledger row only on a run whose BOTH legs read `success`; that run does not exist yet. Flipping on this run would make the ledger say CAP-02 is closer than the runner says. The deferred-items entries cite the run per leg because their own owner lines asked for exactly that measurement; the ledger rows wait for the both-legs run, which round 3 owes together with row 236's fix.

## Files Created/Modified

- `.planning/WINDOWS.md` — rows 237–258 via `gsd-tools windows append`; counters `open_count 229 / waived 3 / fixed 26 / total 258`; nothing else
- `.planning/phases/33-live-capture-windows-portability/deferred-items.md` — nine `status: resolved` + `**Resolved by:**` lines; three `**Round 2 (2026-09-21, plan 33-23 Task 2):**` notes; no entry added or removed (14 before, 14 after)
- `.planning/REQUIREMENTS.md` — the CAP-01 and CAP-03 coverage rows (L226, L228) only
- `.planning/STATE.md` — frontmatter `status` / `last_activity` / `last_activity_desc`; `## Current Position` phase line + one round-2 line
- `.planning/phases/33-live-capture-windows-portability/33-23-SUMMARY.md` — this file

Not touched: `.planning/ROADMAP.md` (the close-out tool writes the plan-progress row; the Phase 33 checkbox and status are NOT set to Complete by this plan — the verifier decides), `.planning/PROJECT.md`, every source file, every flip-manifest surface.

## Decisions Made

See `key-decisions` in the frontmatter. The two a later reader may want to re-take: the ten-context-io-reds entry stays open on an 8-of-10 green because two members moved rather than closed (the "created by previous fix" shape the project's memory names); and the review rows are `deviation` + `open`, not `waived`, because the human deferred them — a waive says the project refuses the finding, and nobody said that.

## Deviations from Plan

**1. [Plan-letter adjustment] The round-2 facts are not on STATE.md's `Plan:` line**
- **Found during:** Task 3 (read of `~/.claude/gsd-core/bin/lib/state-md-schema.cjs`: `advancePlanCore` matches the plan position against `/^(\d+)\s+of\s+(\d+)\s*$/`, anchored — "so `4 — blocked on review of 2 PRs` is REJECTED rather than yielding a total of 2 out of prose")
- **Issue:** the plan's action says "the plan line names 33-12..33-23, the CI verdict …, the capture outcome word …, and the flip/hold". Writing those onto `Plan: 22 of 23` would make `state.advance-plan` refuse the position (`plan_position_unreadable`) at the close-out.
- **Reading taken:** `Plan: 22 of 23` is left byte-intact for the tool; the phase line carries "gap-closure round 2 of 4 EXECUTED 2026-09-21, awaiting verification" exactly as the plan spells it, and the facts the plan wanted on the plan line sit on one short line directly beneath it, inside `## Current Position`.
- **Files modified:** `.planning/STATE.md`
- **Verification:** `state.load` exit 0; the Task 3 diff grep over the guarded beats → 0
- **Committed in:** `7ac95589`

**2. [Plan-letter adjustment] The plan's `grep -a -c 'status: resolved'` floor is met, but the number it reports is 12, not the entry count**
- **Found during:** Task 2 verification
- **Issue:** line 4 of `deferred-items.md` (header prose: "until it carries an explicit `status: resolved`") matches the plan's grep, so the count is entry-level 11 + 1. The plan's second grep (`-B1 -A1 … | grep -c 'Resolved by:'`) reads 11, which is LOWER than 12 and would read as "a resolved line without a citation" if the header line were an entry. It is not an entry (it is not a list item; the scanner and `audit-open` do not read it).
- **Reading taken:** the equality is stated over entries: `^  status: resolved` → 11, `Resolved by:` → 11, and `audit-open` confirms three open. Nothing was changed to make the grep read differently — editing the header to satisfy a grep would be the wrong fix.
- **Files modified:** none beyond Task 2's
- **Committed in:** `04aad635`

**3. [Not run, by decision] `requirements.mark-complete` was not invoked for CAP-01, CAP-02, CAP-03**
- **Found during:** the close-out
- **Issue:** the plan's frontmatter lists `requirements: [CAP-01, CAP-02, CAP-03]` and the executor protocol marks a plan's requirements complete at close-out (the shared-ID gate would report all three ready, since every declaring plan has a summary). All three are edge rows this plan records; none is met (CAP-02 NOT MET on run `35579263776`; CAP-01 and CAP-03 held with no round-2 capture). Marking them would be a fabricated status across the traceability table.
- **Reading taken:** `requirements-completed: []`; the checkboxes stay `[ ]`; the coverage rows say Pending with the evidence. The plan's own assumptions say the same ("this plan … decides nothing about it").
- **Files modified:** none

---

**Total deviations:** 3 recorded (0 auto-fixed; 2 plan-text readings, 1 close-out step deliberately not run). **Impact on plan:** none on scope; every ledger the plan names says what the round's artifacts support.

## Issues Encountered

- `gsd-tools windows append` has no dry-run; the 22 commands were run under `set -euo pipefail` from one script so a refusal would stop the sequence before the count could drift. None refused.
- The plan-level vitest run prints `FAIL …` lines from fixtures under test (the exemption-region and locator refusals a gate is expected to print) inside passing cases; the suite's own summary is the verdict: `78 passed (78)` files, `5375 passed | 2 skipped`, exit 0.

## Verification (plan-level `<verification>`)

| check | result |
|---|---|
| `node ~/.claude/gsd-core/bin/gsd-tools.cjs windows status` — counters agree; `open_count` moved by exactly 22 | `ok: true`; open 207 → 229, waived 3, fixed 26, total 236 → 258; table 258 rows, JSON 258 ids |
| `node scripts/check-foundation-guards.js` and the STATE.md longest-line check — after every STATE.md write | `ALL CHECKS PASSED`; longest line 2524 (unchanged); re-run after the close-out tool writes, result in the Self-Check |
| `npx tsc --noEmit && npx vitest run --exclude '**/scripts/e2e/**' && npm run check:nul-bytes` | tsc exit 0; vitest `Test Files 78 passed (78)`, `Tests 5375 passed \| 2 skipped (5377)`, `Duration 493.28s`, exit 0; nul-bytes `ALL CHECKS PASSED` |

Task-level `<verify>` results: Task 1 `windows status` exit 0 / counters agree, `grep -a -c '33-REVIEW WR-\|33-REVIEW IN-'` → 36 (floor 36); Task 2 `grep -a -c 'status: resolved'` → 12 (floor 3; entry-level 11), `-B1 -A1 … Resolved by:` → 11 (see Deviation 2); Task 3 guards exit 0, longest line 2524 (ceiling 4000), `state.load` exit 0, the last-STATE.md-commit diff grep → 0 with a non-empty diff.

## Known Stubs

None. This plan writes ledger records; no code, no placeholder value, no skipped test, no unrun verify. The 22 rows it appends are the ledger entries for the round's accepted-open items, recorded through the tool as the SUMMARY protocol asks; nothing further to append for this plan.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema. T-33-107 (dropped findings): 18 rows + 3 named folds + 5 fixed = 26 = the review total; T-33-108 (resolved without evidence): every `Resolved by:` names plan, task, commit (all resolve) and, for CI classes, the run id and leg; T-33-109 (STATE beats / line length): diff confined, beats grep 0, longest line unchanged, guards green; T-33-110 (ledger representations): rows only through the tool, `windows status` asserted, table == JSON == counters; T-33-SC: no package installed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Verification (`/gsd-verify-work 33`):** the phase is NOT complete after this plan — round 2's three must-haves are held/NOT MET by their own artifacts (CAP-02 NOT MET on run `35579263776`; CAP-01/CAP-03 held, outcome word `no-go`). The verifier decides; the ROADMAP Phase 33 checkbox and status were not flipped to Complete by this plan.
- **Round 3 (the next `/gsd-plan-phase 33 --gaps`), in the manifest § 7's order:** (a) the `--agent` coordinator grant carrying `propose_note` (row 255), (b) the reader refusing non-sanctioned notes (row 256), the § 2 guard over-match (row 257) and the § 3 `verified_by` presence check (row 258) with offline proof; row 236's 8.3 class at ONE authority (D-15) so a re-push can read CAP-02 MET on both legs, which is also the run that disposes rows 186, 226–235; then a fresh go under D-09 behind a `GO-READINESS: ready` dry run (the pushed-sha row needs a human push first). The flip, when it comes, carries § 7's two amendments. Rows 237–254 are the accepted-open backlog for a later round; the ship gate sees each. Two rounds remain under the four-round cap.
- **Standing:** all commits local; the human pushes at the finish (`origin/main` = `9e1c1131`).

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-21*

## Self-Check: PASSED

- FOUND: `33-23-SUMMARY.md`, `.planning/WINDOWS.md`, `deferred-items.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md` (`[ -f ]` each)
- FOUND: commits `37e885b1`, `04aad635`, `7ac95589` in `git log --oneline --all`; `commits: 3` measured from the ledger `9fdaeb45` at write time
- `windows status` open 229 / waived 3 / fixed 26 / total 258; table 258, JSON 258; review-id count 36; KIT count 8
- deferred-items: `status: open` 3, entry-level `status: resolved` 11, `Resolved by:` 11; `audit-open` lists exactly three Phase 33 entries open
- CAP-02 row identical to `4c72d8b0`; checkboxes `[ ]`; `check-flip-manifest` ALL CHECKS PASSED
- `npm run check:nul-bytes` after writing this file -> `ALL CHECKS PASSED`; this file carries no line matching the outcome-line grammar (count 0)
- `check-foundation-guards.js` and the longest-line check re-run after the close-out tools write STATE.md: recorded in the close-out commit message
