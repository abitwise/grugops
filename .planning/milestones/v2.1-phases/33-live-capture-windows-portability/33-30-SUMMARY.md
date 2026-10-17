---
phase: 33-live-capture-windows-portability
plan: 30
subsystem: testing
tags: [cap-03, cap-01, capture-live, wr-01, wr-02, wr-03, wr-04, in-05, provenance-before-spawn, installed_plugins-registry, working-tree-row, probe-stdout, control-bytes, note-route, unclassified-writes, tdd, gap-closure-round-3]

# Dependency graph
requires:
  - phase: 33-29
    provides: the pipe-scored `runTarget` (frames from `result.transcriptText`), the pre-spawn `deriveGrant` + `expectedGrant` refusal, `liveAllowedTools(target)`, the install → try/finally uninstall order and `UninstallOutcome` this plan gates one step further
  - phase: 33-28
    provides: the scoped admission tool name `mcp__plugin_grugops_grugops__propose_note` the route axis matches by suffix
  - phase: 33-25
    provides: the sealed-note reader that decides what an UNCLASSIFIED write actually admitted
  - phase: 33-10
    provides: the held round-1 capture at c7be6d0da19f0aa8d7554ac1591d5c4ce880b2ac — A:11 (the platform's published tool list), A:1749/A:1931 (the `admit-notes.mjs` indirection), the six frozen divergence sentences
provides:
  - "`installedPluginRow(registryText, pluginKey, target)` (exported, pure over its text): the ONE local-scope row whose `projectPath` names the target through its real path — never by index, never a user- or project-scope row; `installedCopyDigest` validates its `installPath` under the cache root and digests it over the checkout's tracked list"
  - "`runTarget`: after `ops.pluginInstall` and before `ops.runPlatform`, `provenanceVerdict` over the registry copy; anything but MET is a `fail(...)` naming the state, both digests, the registry `gitCommitSha` and the `claude plugin marketplace update <marketplace>` remedy — inside the try, so the uninstall still runs; the recorder is called 0 times (P1)"
  - "`RunSpec.provenance: ProvenanceInputs` — the checkout side (`deriveCheckoutDigest()`: tracked list + digest) computed ONCE before the target loop in `capture()` and handed down; `deriveProvenance` (the post-run confirmation) consumes the same value"
  - "Run-table rows `| run X plugin provenance before the spawn | STATE — detail; registry gitCommitSha SHA; install path P |` (the gate) beside `| installed plugin provenance after the run (D-05, per system/init, content digest over N tracked files) | … |` (the confirmation); the dry run walks the registry reader over the operator's real registry and reports UNKNOWN truthfully"
  - "`INSTALL_AND_PLUGIN_PATHS` (exported, docblock naming which consumer reads which directory) + `workingTreeStatusArgs()`; `PreconditionObservation.workingTreeStatus`; the row `working tree matches HEAD under the directories the installer and the plugin read` — MET on empty output, UNMET naming every entry, UNKNOWN - verify when unreadable (P4)"
  - "`probe()` (exported) returns `{ out, err } | null`; `gitObservations(env)` and `trackedFiles(env)` (exported) parse `.out` alone; `refusalText()` is the one joined spelling, for refusal sentences only; under GIT_TRACE=1 the dry run reads 2466 tracked files (was 2467) and no row carries trace text (P5)"
  - "`CONTROL_BYTE_RE` (`[\\x00-\\x1f\\x7f-\\x9f]`, declared once): `pluginCachePathAccepted` refuses on it BEFORE the dash-prefix check; `cell()` spells each byte `<control>` and appends `(N control byte(s) replaced)`; `verifyArtifacts` refuses a raw byte in any table row naming the row (P7)"
  - "`WRITING_TOOLS` (exported: Write, Edit, MultiEdit, NotebookEdit — checked two-sided against the held init frame A:11); `noteRoute` anchors the POSIX marker either way over every path-shaped leaf with both separators normalized; `NoteRoute.unclassifiedContextWrites` counts a Bash block or a writing block that NAMES the root without a direct path; `compareLivePaths` third sentence `note route: unclassified writes naming the context root differ: path A N, path B M`; `renderReport` prints the count per run (P8-P10)"
  - "Tests P1-P10 in scripts/capture-live.test.ts — 68 cases in the file, red-first for P1, P4, P5, P8 with `check tdd-red-evidence` → RED_EVIDENCE_OK each"
affects: [33-31 (the CAP-02 measurement over the rebuilt twin), 33-32 (the one live go — its readiness table now carries the working-tree row and its Run table the pre-spawn provenance row), 33-33, 33-34]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate (chars/4 over the realized diff of the .ts and .test.ts; the committed .js twin is a build product).
actuals:
  tokens: 25229
  tasks: 3
  commits: 7
  plan_head_before: e130c021c773da2058313ab7c0598a0b6bad5a5d

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gate before the spend from the platform's own record: read what the platform says it installed (its registry row, by scope and project, never index), validate and digest it BEFORE the subject exists; keep the post-run derivation as a confirmation of what was loaded, and report both"
    - "Compute the comparison's fixed side once and hand it down: the checkout digest is derived before the target loop and threaded through RunSpec; no per-run re-derivation"
    - "Stdout is data, stderr is refusal text: a probe returns the two channels separately and the joined spelling exists in exactly one helper used only for refusal sentences"
    - "Ask the predicate of every leaf: a route predicate over a tool input walks every string leaf (path-shaped ones get the anchored question, all of them the naming question) so no field name is a position the predicate is not asked at"
    - "Enumerated sets are checked two-sided against the fixture that published them (WRITING_TOOLS vs A:11 tools[]), with a superset entry recorded as such rather than silently kept"

key-files:
  created: []
  modified:
    - scripts/capture-live.ts
    - scripts/capture-live.js
    - scripts/capture-live.test.ts

key-decisions:
  - "The pre-spawn provenance gate reads the platform's registry row for the target (`installed_plugins.json`, local scope, real project path) rather than guessing the version-keyed cache directory: the row is what the platform will load, and the two stale `0.1.0` rows on this host share ONE `installPath` across scopes, which is the WR-02 mechanism in the operator's own file"
  - "The checkout side (tracked list + digest) is computed once in `capture()`/`dryRun()` and handed down through `RunSpec.provenance`; both provenance rows (gate and confirmation) read the same value"
  - "The dry run walks the registry reader over the operator's real registry for each fresh target and reports `UNKNOWN - verify — … no local-scope row … — nothing was installed for this run (dry run, D-10)` rather than a fabricated MET or a skipped row (CLAUDE.md: never fake a passing gate)"
  - "`refusalText()` is the one joined stdout+stderr spelling and is used only by the installer banner and the plugin install/uninstall detail; every parsed value comes from `probe().out`"
  - "A writing block whose CONTENT names the context root counts as an UNCLASSIFIED write: the held capture's A:1749/A:1931 are `Write` blocks under `.grugops/queue/…/admit-notes.mjs` whose content names the root, run afterwards by a `node` command that never spells it — the review's Bash-command arm alone is evadable by exactly that indirection"
  - "`MultiEdit` stays in `WRITING_TOOLS` although A:11 does not publish it (CLI 2.1.278 lists Write, Edit, NotebookEdit): a tool that never appears counts 0 on both paths, so the superset entry costs nothing and closes the route on a version that has it; the docblock and P8 record the platform fact instead of asserting the plan's claim"
  - "Agent prompts and read-only tools enter no route axis: a prompt naming the context root is model-chosen prose to a nested session (the CR-03 class), and a read is not a route to disk"
  - "The `rev-parse` source-line pin (IN-03) did not move (3 lines before and after), so it was left as the plan directed — nothing was bumped"

patterns-established:
  - "The verdict's inputs, by WHEN they are read, after this plan: before the spawn — the grant (33-29) AND the plugin provenance (this plan); on the pipe — the frames; after the run from the target — the notes (the observed product); after the run from the init frame — the provenance CONFIRMATION, which can only add a failure"

requirements-completed: [CAP-03, CAP-01]

# Coverage (#1602)
coverage:
  - id: D1
    description: "Plugin provenance is a pre-spawn gate from the platform's own registry row: a stale copy (one byte changed) is refused with the recorder at 0 calls; the honest copy spawns once and the report carries the pre-spawn row with the registry's gitCommitSha and the post-run confirmation row; the row is selected by scope and real project path, never index; no row is UNKNOWN and a refusal"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P1 (the stale cache)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P2 (the honest copy spawns)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P3 (the row is found by scope and project, never by index)"
        status: pass
      - kind: integration
        ref: "node scripts/capture-live.js --dry-run --out TMP — exit 0, one OUTCOME: no-go, both provenance rows present"
        status: pass
    human_judgment: false
  - id: D2
    description: "An untracked or modified entry under the directories the installer copies and the plugin loads is a readiness refusal (the scoped working-tree row), with all three states; a .planning/ entry never reaches the scoped probe"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P4 (the untracked file)"
        status: pass
      - kind: integration
        ref: "node scripts/capture-live.js --dry-run — the working-tree row MET on this host once the plan's files were committed (UNMET, naming the three modified files, while they were not)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The probes' parsers read stdout alone: under GIT_TRACE=1 the tracked count equals the git ls-files -z count and the pushed-sha inputs are 40-hex shas; probe returns { out, err }; the derived consumer census reads .out and never .err"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P5 (the polluted channel)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P6 (stderr is kept for the refusal text)"
        status: pass
      - kind: integration
        ref: "GIT_TRACE=1 node scripts/capture-live.js --dry-run — exit 0, 2466 tracked files, zero `trace:` lines in the output"
        status: pass
    human_judgment: false
  - id: D4
    description: "A control byte in a transcript-supplied path is refused before a filesystem call, spelled <control> with a count in a cell, and refused by verifyArtifacts in a committed summary"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P7 (control bytes never reach a cell)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The note-route axis counts a relative path, MultiEdit, NotebookEdit and a backslash spelling as direct writes, a Bash command or a written script naming the context root as unclassified, on exactly one arm per block; the third sentence has its frozen shape; the held capture still reads its six sentences and measures path A 15, path B 17 unclassified"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P8 (the three evasions, and the indirection)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P9 (the projection compares the third route)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P10 (the held capture still reads its six sentences)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#held capture (commit c7be6d0d): the projection still names the round-1 divergences by role, route and count (Test A, unchanged)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Whether the platform version that runs plan 33-32 writes the local-scope registry row in the shape this host's registry shows (scope, projectPath, installPath under ~/.claude/plugins/cache, gitCommitSha) and whether its init frame publishes any file-writing tool outside WRITING_TOOLS — only a session can observe this"
    requirement: CAP-01
    verification: []
    human_judgment: true
    rationale: "UNKNOWN - verify by construction: no live spawn happens in this plan (D-09/D-11); the row shape was measured on this host's registry for CLI 2.1.278-era rows and asserted from a fixture, and the 33-32 capture's init frame and pre-spawn row are the settling observation"

# Metrics
duration: 48 min
completed: 2026-09-22
status: complete
---

# Phase 33 Plan 30: Provenance before the spawn from the platform's registry row, a scoped working-tree refusal, stdout-only parsers, no control byte in a cell, and a route axis that sees every spelling Summary

**`runTarget` now refuses to spawn unless the copy the platform's own registry row names for the target digests equal to the checkout (a stale version-keyed cache copy is a refusal at zero tokens, recorder count 0), a scoped `git status --porcelain --untracked-files=all` row makes an untracked file under the installer's directories a readiness refusal, `probe` hands its parsers stdout alone so `GIT_TRACE=1` moves no row, a C0/C1 byte in a transcript path is refused before any filesystem call and spelled `<control>` in a cell, and `noteRoute` counts a relative path, every file-writing tool, both separators and — as a third, unclassified route — any Bash command or written content that names the context root; the held capture's six sentences are unchanged and its third route measures path A 15, path B 17.**

## Performance

- **Duration:** 48 min
- **Started:** 2026-09-21T20:12:05Z
- **Completed:** 2026-09-21T21:00:38Z
- **Tasks:** 3 (each RED → GREEN; Task 3 plus one probe-driven `feat` commit)
- **Files modified:** 3 (`scripts/capture-live.ts`, its committed `.js` twin, `scripts/capture-live.test.ts`; 1388 insertions, 129 deletions)

## Accomplishments

- **WR-02 (provenance before the spawn).** `installedPluginRow(registryText, pluginKey, target)` selects the ONE `scope: "local"` row of `plugins["NAME@MARKETPLACE"]` whose `projectPath` equals the target through `realpathSync.native` (resolved spelling where a path no longer exists) — reordering the rows finds the same one, a symlinked spelling of the target matches, another project's local row and a user-scope row do not stand in, two matching rows or text outside the registry's shape are null. `installedCopyDigest` reads the registry, validates `installPath` through the same `pluginCachePathAccepted` the init-frame path passes through, and digests it over the checkout's tracked list; `runTarget` calls `provenanceVerdict` on it after `ops.pluginInstall` and before `ops.runPlatform` (awk-scoped lines 23 < 45) and `fail`s unless MET, inside the `try`, so the `finally` uninstall still runs. P1 plants a copy of the checkout's tracked subset with ONE byte changed: the refusal names `UNMET`, both digests, the registry `gitCommitSha` and the remedy (`claude plugin marketplace update grugops`, or uninstall and reinstall at user scope); the recorder is called 0 times where the base called it once. On this host the registry's two stale `0.1.0` rows (project scope and local scope) share ONE `installPath` under `~/.claude/plugins/cache/grugops/grugops/` — the version-keyed reuse the review described, visible in the operator's own file.
- **WR-03 (the untracked arm).** `INSTALL_AND_PLUGIN_PATHS` (`agent-factory`, `.claude`, `.claude-plugin`, `install`, `skills`, `hooks`, `scripts`, `AGENTS.md`) with a docblock naming which consumer reads which directory; `workingTreeStatusArgs()` derives the probe's argument list; the row `working tree matches HEAD under the directories the installer and the plugin read` is MET on empty output, UNMET naming every entry, UNKNOWN - verify when unreadable. P4 proves the scope hermetically in a scratch repository: an untracked `.planning/milestone.lock` is in the unscoped status and absent from the scoped one (MET); an untracked `agent-factory/roles/new-role.md` is named (UNMET). The dry run read the row UNMET, naming exactly the plan's three modified files, while they were uncommitted — and MET once they were committed.
- **WR-04 (stdout alone).** `probe` returns `{ out, err } | null`; the four platform probes read `.out`; `gitObservations(env)` (exported, the four git probes plus the scoped status) and `trackedFiles(env)` parse `.out`; `checkoutSha` reads `.out`. P5 hands them `childEnvironment(process.env, { GIT_TRACE: "1" })`: the tracked count equals the `git ls-files -z` count (2466), no entry carries a newline or `trace: `, `localHead`/`remoteHead` are 40-hex, `remoteRef` is a ref name, the pushed-sha row is decided and carries no trace text, and the clean and polluted environments observe the same shas. The three legitimate joined-channel sites (installer banner, plugin install detail, plugin uninstall detail) go through one `refusalText()` helper whose docblock says it is refusal text only; the plan's grep `r.stderr ?? ""}\`` counts 0.
- **IN-05 (control bytes).** `CONTROL_BYTE_RE` is declared once; `pluginCachePathAccepted` tests it before the dash-prefix check (P7 asserts the order on the function text and that the class is spelled exactly once in the module); `cell()` replaces each byte with `<control>` and appends `(N control byte(s) replaced)` — `| plugin under test per system/init | grugops 2.1.0 at /cache/gru<control>gops/2.1.0 (1 control byte(s) replaced) |` and a two-byte case; `verifyArtifacts` refuses a raw byte in any table row naming the row (`plugin under test per system/init`, `mode`) over a dry-run artifact set that was accepted untouched.
- **WR-01 (every route).** `WRITING_TOOLS` exported; the marker is the POSIX form of `CONTEXT_SUBPATH` anchored either way (`/.grugops/context/` inside an absolute path, `.grugops/context/` at the start of a relative one) with BOTH separators normalized whatever the host (`toPosix` alone splits only on the host separator, which P8's backslash case caught); every path-shaped leaf (`file_path`, `notebook_path`, a camel-cased `filePath`) is asked the anchored question. `unclassifiedContextWrites` counts a Bash block any of whose string leaves names the root, or a writing block any of whose leaves names it while no path-shaped leaf sits under it. `compareLivePaths` emits exactly `note route: unclassified writes naming the context root differ: path A N, path B M`; `renderReport` prints the count per run. Test A's six sentences are unchanged verbatim over `c7be6d0d`; the third route measures **path A 15, path B 17** (cross-checked against an explicit-key count in the test), so the held capture now reads seven sentences.

## TDD Gate Compliance

Every task is red-first; the RED record for each was verified with `gsd_run check tdd-red-evidence` → `RED_EVIDENCE_OK` (`target_test_failed`). The classifier parses node:test TAP; vitest's `tap-flat` reporter emits `ok`/`not ok` rows but no `# tests/# pass/# fail` trailer, so the trailer was DERIVED from each run's own rows with `# SKIP` rows excluded (tests = executed rows, pass = rows starting `ok`, fail = rows starting `not ok`) and the derivation stated inside the record, as 33-24..33-29 did.

| Task | RED commit | Target test | Base result quoted from the red run | Counts | GREEN commit |
|---|---|---|---|---|---|
| 1 | `b0b51e13` | P1 | `no platform child was launched against a copy that is not the checkout: expected [ { …(3) } ] to have a length of +0 but got 1` — the recorder's count on the base is **1**: the spawn happened and provenance was never consulted before it. P4 (also a target, own record): `expected undefined to be 'UNMET'` — the row does not exist on the base. P2/P3 red on the missing field/export. | tests 4 / pass 0 / fail 4 / 58 skipped | `b780f64f` |
| 2 | `75c65bb5` | P5 | `trackedFiles is not a function` (the base exposes no env-taking reader). The base behaviour, reproduced through the committed `.js` dry run under `GIT_TRACE=1`: `content digest over 2467 tracked files` against a real **2466**; the working-tree row `UNMET — 1 entry(ies) differ … 23:26:56.161456 git.c:502 trace: built-in: git status --porcelain …`; the pushed-sha row `UNKNOWN - verify` because `remoteRef` became `refs/remotes/origin/main` plus a trace line (the trace carries a newline, so the plan's one-line `grep 'pushed sha' \| grep -c trace` counts 0 on the base while the readiness line plainly quotes the trace). P7 red on `the control-byte class is consulted inside pluginCachePathAccepted: expected -1 to be greater than 0`. | tests 3 / pass 0 / fail 3 / 62 skipped | `6a528b29` |
| 3 | `f1ef605f` | P8 | `a relative file_path under the context root is a direct write: expected +0 to be 1` — the base reads the relative spelling as 0. P10: `path A unclassified writes naming the context root: expected undefined to be 15`. Test A (the control) passed on the base and after. | tests 4 / pass 1 / fail 3 / 64 skipped | `5ba37b49` (+ `6efdef98`, the union of the arms) |

## Verification (the plan's `<verification>` block, quoted from the commands' own output)

- `npx tsc --noEmit && npx vitest run --exclude '**/scripts/e2e/**' && npm run check:nul-bytes` → tsc clean (source; `tsc -p tsconfig.tests.json` also clean); vitest `Test Files  78 passed (78)` / `Tests  5665 passed | 2 skipped (5667)` / `vitest exit=0`; nul-bytes `ALL CHECKS PASSED`. (The four `FAIL` strings in the vitest output are refusal wording printed by a guard's own tests, not failures — the same four 33-29 recorded.)
- `npm run build && npm run check:build-parity` → `ALL CHECKS PASSED` after each GREEN commit (the check compares the built `.js` against the COMMITTED `.js`, so it reds between an edit and its commit — observed after each edit, green after each commit).
- `node scripts/capture-live.js --dry-run --out TMP` → exit 0; `GO-READINESS: not-ready — pushed sha (…): UNMET — HEAD … is 64 commit(s) ahead of origin/main …` (the human keeps commits local); the working-tree row `MET — git status --porcelain --untracked-files=all is empty under agent-factory, .claude, .claude-plugin, install, skills, hooks, scripts, AGENTS.md`; exactly one `OUTCOME: no-go`; three provenance rows (`installed plugin provenance after the run (D-05, per system/init, content digest over 2466 tracked files)`, `run A plugin provenance before the spawn`, `run B plugin provenance before the spawn` — the two pre-spawn rows `UNKNOWN - verify — … no local-scope row for this target … — nothing was installed for this run (dry run, D-10)`); `--verify-artifacts` over the output: `ARTIFACTS RE-CHECKED`.
- The plan's per-task verify commands all passed: Task 1 filter `4 passed | 58 skipped`, awk order lines `23 < 45` exit 0, the `node -e` row/probe check exit 0, dry run `GO-READINESS: ` count 1; Task 2 filter `3 passed | 62 skipped`, the stderr-concatenation grep `0`, `GIT_TRACE=1` dry run exit 0 with `grep 'pushed sha' | grep -c trace` = 0 and zero `trace:` lines anywhere in its output; Task 3 filter `4 passed | 64 skipped`, `unclassifiedContextWrites` grep count 8, the composite gate green.
- `npm test` was never run (it runs the live claude-CLI e2e lane).

## Adversarial probe — which set each predicate enumerates, and where it is asked

| Predicate | What it enumerates | Where it is asked | Probed |
|---|---|---|---|
| `installedPluginRow` | rows of `plugins[pluginKey]` with `scope === "local"` and a string `projectPath` equal to the target's canonical path | every row, by content; the unique match or null | reordered rows (same row found); symlinked target (matches via realpath); another project's local row and a user row (do not stand in); two rows for the same target (null → UNKNOWN → refusal, fail-closed); non-JSON, non-array, other plugin key (null). Not probed live: the row shape written by the 33-32 platform version (`UNKNOWN - verify` 1 below). |
| the pre-spawn gate | `provenanceVerdict(checkout.digest, installedDigest)` — MET only on equal digests | inside `runTarget`'s try, after the install, before the spawn | one changed byte (refused, recorder 0); byte-identical copy (spawns once); registry unreadable / row missing / installPath refused under the cache root / tracked list null (each an UNKNOWN with the refusal appended, never MET by omission). The subject cannot reach this input: it is decided before the subject exists. |
| the working-tree row | lines of the scoped `git status --porcelain --untracked-files=all` | phase 1 readiness; `not-ready` on UNMET or UNKNOWN | untracked under `agent-factory/` (UNMET, named); modified tracked (UNMET); `.planning/` entry (outside the scope by the argument list itself, MET); unreadable (UNKNOWN). RESIDUAL: the row is SCOPED while the provenance digest is over ALL tracked files, so a dirty tracked file OUTSIDE the scoped directories (a `.planning/` edit) passes readiness and is refused at the pre-spawn gate — at zero tokens, through `fail`, before any spend. Conservative, not a false MET; noted so the operator reads the gate's sentence rather than the readiness line when that happens. |
| `probe` consumers | derived census: `observePreconditions`, `gitObservations`, `trackedFiles`, `checkoutSha` (P6's `probeConsumers` over the module's top-level functions) | each reads `.out`; the `/\.err\b/` test finds no reader | GIT_TRACE=1 through the four git probes and the status probe; a child writing to both channels; a non-zero child (null). |
| `CONTROL_BYTE_RE` | `[\x00-\x1f\x7f-\x9f]`, declared once | `pluginCachePathAccepted` first line; every `cell()`; every `\|` row in `verifyArtifacts` | U+0085, U+0001, U+007F in a path (refused, including an EXISTING directory carrying the byte where the filesystem admits one); one and two bytes in the plugin row (spelled and counted); a raw byte injected into two different rows of a committed summary (refused, row named). Newlines are the one control byte the format needs and are handled by the pre-existing rule. |
| `noteRoute` | tool-use blocks of every frame (nested frames included), by tool name: `propose_note` suffix; `Bash`; `WRITING_TOOLS` | every string LEAF of the block's input — path-shaped leaves get the anchored question, all leaves the naming question; one block on exactly one arm | relative path; `MultiEdit`; `NotebookEdit` via `notebook_path`; backslash spelling on a POSIX host (caught a real gap: `toPosix` splits on the host separator only — fixed); Bash command naming the root; a script WRITTEN under `queue/` whose content names it and is then run by a command that does not (the held capture's own A:1749/A:1931 route — the review's Bash-only arm was evadable by this indirection; closed); the UNION — direct+content counts once as direct, an unanchored path field counts as unclassified, camel-cased `filePath` is path-shaped, an `Edit.new_string` naming the root counts, a Bash `description` naming it counts; converses — an unrelated Bash, an unrelated Write, a `Read` under the root and an `Agent` prompt naming the root move nothing (the prompt is CR-03-class prose and enters no axis by decision). RESIDUAL: content obfuscation (base64 in a `node -e`, a script fetched rather than written) names the root nowhere in the transcript; the axis records what the transcript shows, and the reader's seal (33-25) decides what was admitted — stated in the docblock. |
| `WRITING_TOOLS` | Write, Edit, MultiEdit, NotebookEdit | checked two-sided against A:11's built-ins: every published `/Write\|Edit/` tool is a member; the published members are exactly Write, Edit, NotebookEdit | **The plan's read_first claim that A:11 names `MultiEdit` is FALSE** — the frame (CLI 2.1.278) does not publish it. Kept as a superset entry (0 on both paths), recorded in the docblock and asserted as a premise in P8 rather than repeated. |

## Files Created/Modified

- `scripts/capture-live.ts` — D-05 header paragraph rewritten (gate before, confirmation after, the two preconditions); `INSTALL_AND_PLUGIN_PATHS` + `workingTreeStatusArgs`; `PreconditionObservation.workingTreeStatus` and its row; `probe` → `{ out, err }` (exported), `gitObservations`, `trackedFiles(env)`, `refusalText`; `CONTROL_BYTE_RE`, the refusal in `pluginCachePathAccepted`, the replace-and-count `cell`, the `verifyArtifacts` refusal; `pluginRegistryPath`, `CheckoutDigest`/`deriveCheckoutDigest`, `InstalledPluginRow`/`installedPluginRow`, `ProvenanceInputs`/`liveProvenanceInputs`, `InstalledCopy`/`installedCopyDigest`, `PreSpawnProvenance`/`preSpawnProvenance`/`preSpawnProvenanceLine`; `RunSpec.provenance`, `RunReport.provenanceBeforeSpawn`, the gate in `runTarget`, `deriveProvenance(…, checkout)`; `WRITING_TOOLS`, `inputStrings`, the rewritten `noteRoute`, `NoteRoute.unclassifiedContextWrites`, the third sentence, the report rows; `dryRun`/`capture` compute the checkout side once.
- `scripts/capture-live.js` — the committed build of the above, moved in each GREEN commit; `check:build-parity` green.
- `scripts/capture-live.test.ts` — the `provenanceFixture` (scratch cache root + registry over a three-file tracked subset; the recorder, `countingOps` and `installDecidingOps` write the platform's registry row on install); `installingOps`; `probeConsumers`; `unclassifiedByHand`; Tests P1-P4, P5-P7, P8-P10; the D-10 dry-run case asserts the renamed post-run row and the two pre-spawn rows; the fixture-count route case gains the third field.

## Decisions Made

- The registry row is the gate's source because it is the platform's own statement of what it will load; the version-keyed cache path is not guessed. Both stale rows on this host pointing at one `installPath` is the mechanism, measured.
- The review's Bash-command arm is implemented AND widened: the held capture shows the indirection (a written script, then a command that never spells the root), so written content counts too — a strengthening (D-20), recorded as deviation 1 below.
- `MultiEdit` kept as a superset entry with the platform fact recorded, not deleted to make the plan's claim true and not asserted as published.
- `refusalText()` rather than three inline joins: the plan's grep required 0 occurrences of the joined spelling, and one named helper with a stated purpose is the honest way to meet it (the three sites are refusal sentences, never parsed values).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The route axis's Bash-command arm was evadable by indirection**
- **Found during:** Task 3 (reading A:1749/A:1931 before writing P8)
- **Issue:** The plan expected the held capture's `admit-notes.mjs` scripts to count under the Bash-command arm; they are `Write` blocks under `.grugops/queue/…` whose CONTENT names the context root, run afterwards by `node …/admit-notes.mjs` — a command that never spells the root. Under the review's recipe both paths would read 0 for that route.
- **Fix:** A writing block any of whose string leaves names the root, while no path-shaped leaf sits under it, counts as unclassified; P8 pins the shape and the union.
- **Files modified:** scripts/capture-live.ts, scripts/capture-live.test.ts
- **Verification:** P8 (`the written script names the root: one unclassified write`), P10 (path A 15 includes the two).
- **Committed in:** `5ba37b49`, `6efdef98`

**2. [Rule 1 - Bug] `toPosix` alone does not normalize a backslash spelling on a POSIX host**
- **Found during:** Task 3 (P8's Windows-spelling case read 0)
- **Issue:** `toPosix` splits on the host separator, so `C:\t\.grugops\context\…` in a transcript read on macOS was not a direct write.
- **Fix:** `toPosixWith(toPosix(p), "\\")` — both separators normalized whatever the host.
- **Files modified:** scripts/capture-live.ts
- **Verification:** P8's backslash case; the fixture and held-capture counts unmoved.
- **Committed in:** `5ba37b49`

**3. [Rule 1 - Test predicate] Three test predicates I wrote were wrong and were corrected before GREEN**
- **Found during:** Task 2
- **Issue:** "no tracked entry contains `trace`" matched real paths (`traceability.md`, `board-tracer.test.ts`); a `.err` substring matched `.error`; a whole-report control-byte regex matched the report's own newlines.
- **Fix:** `\btrace: ` as git prints it; `/\.err\b/`; per-line scan.
- **Files modified:** scripts/capture-live.test.ts
- **Verification:** P5-P7 green on the corrected predicates, red on the base for the planned reasons.
- **Committed in:** `6a528b29`

**4. [Rule 3 - Blocking] The plan's stderr-concatenation grep also matched three refusal-text sites**
- **Found during:** Task 2 (verify command 2)
- **Issue:** `grep -c 'r.stderr ?? ""}\`'` counted the installer banner, `installOutcome` and `pluginUninstall` — legitimate joined-channel REFUSAL text, not probe data.
- **Fix:** One `refusalText(stdout, stderr)` helper with a docblock stating its use; the grep counts 0.
- **Files modified:** scripts/capture-live.ts
- **Verification:** the grep; Test M and P6 still see stderr in the install refusal.
- **Committed in:** `6a528b29`

---

**Total deviations:** 4 auto-fixed (1 missing critical, 2 bugs, 1 blocking). **Impact on plan:** each narrows or strengthens a predicate the plan named; no scope creep. The disproven plan claim (A:11 and `MultiEdit`) is recorded above rather than acted on silently.

## Issues Encountered

- `check:build-parity` compares the built `.js` with the committed `.js`, so it reds between an edit and its GREEN commit; verified green after every GREEN commit.
- The plan's Task 2 verify metric `grep 'pushed sha' | grep -c trace` is 0 on the base as well, because git's trace line carries a newline and the trace text lands on the next line of the readiness output; the base's pollution was quoted from the dry-run report rows and the readiness line instead (2467 vs 2466; UNKNOWN pushed-sha with the trace inside `remoteRef`).

## `UNKNOWN - verify` — what only a session can settle

1. Whether the platform version that runs plan 33-32 writes the local-scope registry row for a `--scope local` install in the shape this host's registry shows (`scope`, `projectPath`, `installPath` under `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>`, `gitCommitSha`) — measured here on CLI 2.1.278-era rows and asserted from a fixture, never from the operator's file.
2. Whether `projectPath` as the platform writes it equals the target's real path on the go host (this host resolves `/var` → `/private/var`; `canonicalPath` compares real paths where they exist).
3. Whether the 33-32 init frame publishes a file-writing tool outside `WRITING_TOOLS` — P8's two-sided check runs over the HELD A:11; the live frame should be re-checked by the same rule (`/Write|Edit/` built-ins ⊆ the set).
4. Whether a `plugin marketplace update` is needed before the go at an unbumped `2.1.0` — the pre-spawn gate now says so at zero tokens if it is; the go text should quote the `run A plugin provenance before the spawn` row.

## Known Stubs

None. No placeholder values, no skipped tests, every `<verify>` run.

## Threat Flags

None beyond the plan's register. T-33-136 (stale cache scored after the spend) mitigated by P1-P3 and the gate's position; T-33-137 (untracked file) by P4 with the scoped/unscoped residual stated above; T-33-138 (stderr pollution) by P5/P6; T-33-139 (control byte in a cell) by P7; T-33-140 (route evasions) by P8-P10 with the indirection closed and the obfuscation residual stated. No package was installed.

## Next Phase Readiness

- Plan 33-31 measures CAP-02 over the rebuilt twin; `scripts/capture-live.js` is a faithful build of its source (`check:build-parity` green).
- Plan 33-32's go text should quote, from the live report: the working-tree row (MET), both provenance rows (`before the spawn` MET with the registry `gitCommitSha`, `after the run` MET), the third route count per path, and settle `UNKNOWN - verify` 1-4 above where the session can.
- Commits stay local (64 ahead of `origin/main` at the last dry run); the pushed-sha row states it and the pre-spawn gate would refuse a live run whose installed copy is not the checkout.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-22*

## Self-Check: PASSED

FOUND: scripts/capture-live.ts
FOUND: scripts/capture-live.js
FOUND: scripts/capture-live.test.ts
FOUND: .planning/phases/33-live-capture-windows-portability/33-30-SUMMARY.md
FOUND: b0b51e13
FOUND: b780f64f
FOUND: 75c65bb5
FOUND: 6a528b29
FOUND: f1ef605f
FOUND: 5ba37b49
FOUND: 6efdef98
