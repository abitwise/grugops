---
phase: 33-live-capture-windows-portability
reviewed: 2026-09-20T18:33:35Z
depth: standard
files_reviewed: 55
files_reviewed_list:
  - .gitattributes
  - .github/workflows/ci.yml
  - docs/audit/28-disposition-register.md
  - docs/audit/29-style-dispositions/33-09.md
  - hooks/admission-guard.test.ts
  - hooks/guard.test.ts
  - install/install.test.ts
  - package.json
  - scripts/board-dashboard.test.ts
  - scripts/board-model.test.ts
  - scripts/board-read.test.ts
  - scripts/board-tracer.test.ts
  - scripts/board-watch.test.ts
  - scripts/capture-live.js
  - scripts/capture-live.test.ts
  - scripts/capture-live.ts
  - scripts/check-banned-claims.js
  - scripts/check-banned-claims.test.ts
  - scripts/check-banned-claims.ts
  - scripts/check-claim-anchors.test.ts
  - scripts/check-flip-manifest.js
  - scripts/check-flip-manifest.test.ts
  - scripts/check-flip-manifest.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-kit-refs.js
  - scripts/check-kit-refs.test.ts
  - scripts/check-kit-refs.ts
  - scripts/check-nul-bytes.test.ts
  - scripts/check-platform-shapes.js
  - scripts/check-platform-shapes.test.ts
  - scripts/check-platform-shapes.ts
  - scripts/check-public-docs-vocabulary.test.ts
  - scripts/check-uat-oracles.test.ts
  - scripts/context-io.test.ts
  - scripts/coordinator-resolution-precheck.test.ts
  - scripts/e2e/fixtures/capture-sample.jsonl
  - scripts/e2e/fixtures/capture-target/package.json
  - scripts/e2e/fixtures/capture-target/src/index.mjs
  - scripts/e2e/uat-live.test.ts
  - scripts/freshness.js
  - scripts/freshness.test.ts
  - scripts/freshness.ts
  - scripts/frontmatter.test.ts
  - scripts/generate-guarantees.test.ts
  - scripts/nonblocking-reader-parity.test.ts
  - scripts/posix-path.js
  - scripts/posix-path.test.ts
  - scripts/posix-path.ts
  - scripts/prod-deploy-deny-match.js
  - scripts/prod-deploy-deny-match.ts
  - scripts/runnable-ref/uat-spec-integrity.test.ts
  - scripts/uat-gate-exit-contract.test.ts
  - scripts/validate.test.ts
  - vitest.config.ts
findings:
  critical: 5
  warning: 13
  info: 8
  total: 26
status: issues_found
---

# Phase 33: Code Review Report

**Reviewed:** 2026-09-20T18:33:35Z
**Depth:** standard
**Files Reviewed:** 55
**Status:** issues_found

## Summary

The phase adds three new tooling modules (`scripts/capture-live.ts`, `scripts/check-flip-manifest.ts`, `scripts/posix-path.ts`), extends `scripts/check-platform-shapes.ts` with a shared skip/host-capability corpus, re-launches the compiler in `scripts/freshness.ts`, normalizes published paths in `scripts/check-kit-refs.ts` and `scripts/check-banned-claims.ts`, and reworks roughly thirty test files for Windows portability. The committed `.js` twins were not reviewed separately; the freshness gate owns their parity.

The pure derivations in `capture-live.ts` (frame parsing, deny attribution on the decoded `hook_response.stdout`, the two-way grant derivation, the three-state precondition table) are well-built and the offline suite is genuinely two-sided. The defects are in how the live runner is REACHED and what it does around those predicates: the transcript it scores is streamed into the directory the agent runs in with `Write`/`Edit` granted (CR-01); the D-05 provenance row reads the wrong plugin and is never compared to anything (CR-02 -- the committed capture shows `UNKNOWN - verify` on that row); the D-07 comparator it reuses compares wall-clock timestamps and model-authored prose, so `OUTCOME: pass` is unreachable for two real runs (CR-03); a failure after the runs deletes the paid transcripts even under `--keep-target` (CR-04); and a failed plugin install does not stop the spend (CR-05). The flip-manifest gate has one fail-open arm (substring exemption anchors, WR-08) and one part that is the manifest compared with itself (WR-09). The platform-shape skip corpus, by design, converts several safety-bearing FIFO cases into `console.warn` greens on any host whose `mkfifo` misbehaves (WR-10).

The known open item at `scripts/check-public-docs-vocabulary.ts:268` is not re-reported.

## Critical Issues

### CR-01: The transcript the deny predicate scores is written inside the agent's cwd, with `Write` and `Edit` granted

**File:** `scripts/capture-live.ts:1567` (also `:225-235`, `:1098-1108`, `:1577-1583`)
**Issue:** `transcriptPath = join(build.target, transcriptName)` places `33-CAPTURE-A.jsonl` inside the target directory, which is the `cwd` handed to `claude -p`. `LIVE_ALLOWED_TOOLS` grants `Write`, `Edit`, `Glob` and `Read`. The model can therefore discover the file it is being scored from and append or rewrite frames in it -- including a `system/hook_response` frame whose `stdout` carries a byte-perfect prod-deploy deny envelope, or `parent_tool_use_id`/`task_notification` frames that satisfy CAP-03 side (a). Hard rule 5 and the matcher header (`prod-deploy-deny-match.ts:24-37`) argue that `hook_response.stdout` is sound because "the platform emits the frame, the model never writes it"; that holds for the stream, but not for a file in the agent's project directory. `readFrames(transcriptPath)` at `:1577` and `readFileSync(transcriptPath)` at `:1583` read that file after the run. This is the exact class the project's history records: the predicate is sound, the input it is handed is not.
**Fix:**
```ts
// Write the transcript into a runner-owned directory the agent has no grant over.
const transcriptDir = makeScratch(`transcript-${build.label}`); // sibling of target, never its child
const transcriptPath = join(transcriptDir, transcriptName);
```
Additionally record in the report that the transcript path was outside every target, and consider dropping `Write`/`Edit` from the grant if the request does not need them (the July observation used `mcp__grugops__propose_note` for the notes).

### CR-02: D-05 provenance reads `loaded[0]` (the first plugin in the init frame, not grugops) and is never compared to the checkout sha or folded into the outcome

**File:** `scripts/capture-live.ts:1600` (and `:1514`, `:1591`, `:1151-1157`)
**Issue:** `installedPluginSha(firstPlugins.loaded[0].path)` assumes the plugin under test is the first entry of `system/init.plugins[]`. The committed capture (`33-CAPTURE-SUMMARY.md:70`) lists `context7`, `playwright`, `superpowers` before `grugops`, so the post-hoc `git -C <path> rev-parse HEAD` ran against context7's cache directory and the row reads `UNKNOWN - verify` (`33-CAPTURE-SUMMARY.md:15`). Independently, even a correct sha is only RECORDED: nothing compares it to `checkoutSha()` and `outcome` at `:1591` is `hang ? ... : anyFailure ? "fail" : "pass"` with no provenance term. D-05's chosen route ("verify the installed sha POST HOC") is therefore not implemented as a verification; `OUTCOME: pass` is reportable over a plugin whose sha is unknown or differs from the tree under test. The pushed-sha precondition does not close this: it compares against the remote-tracking ref "as last fetched", while the marketplace install resolves the live GitHub head, so a push by anyone else between fetch and install produces a different sha silently.
**Fix:**
```ts
const under = firstPlugins.loaded.find((p) => p.name === obs.pluginName);
const installed = under === undefined ? "UNKNOWN - verify — the init frame lists no plugin named " + obs.pluginName : installedPluginSha(under.path);
const checkout = checkoutSha();
if (installed !== checkout) anyFailure = true; // provenance is a pass condition, not a footnote
```
Write both values and the comparison verdict into the report.

### CR-03: The D-07 equivalence comparator includes `at` and free-text `body`, so two independent live runs cannot be equivalent and the runner spends its full budget on a guaranteed `fail`

**File:** `scripts/capture-live.ts:1444-1454` (calls `scripts/dual-path-equivalence.ts:41-63`)
**Issue:** `equivalence()` reuses `projectTaskState` + `assertEquivalent`, which keep `at` (wall-clock note timestamp) and `body` (model-authored prose) in the projection and compare index-wise after sorting on them. Two nondeterministic `claude -p` sessions never produce identical timestamps or identical note bodies, so `diffs.length === 0` -- a pass condition at `:1587` -- is unsatisfiable by construction. `33-DIAGNOSIS.md:65` already records that "the comparator was built for a different question"; the source in scope still ships it, so a re-run at this code spends again with the same outcome. The runner also does not refuse to START on this basis.
**Fix:** Either replace the projection for the live case with a structural fingerprint (note `kind`, author role key via `roleKey`, `verified_by`, count of refs, presence of `VERDICT_GREEN_MARKER`, task ids) compared as multisets, or have `capture()` refuse to spawn until D-07's comparator is defined for nondeterministic inputs. Whichever is chosen, add a precondition row naming the comparator in use so the readiness line, not a diagnosis after the spend, carries the fact.

### CR-04: A failure after the live runs deletes the paid transcripts, even with `--keep-target`

**File:** `scripts/capture-live.ts:1647` (with `:295-299`, `:1567`, `:1583`, `:1608`)
**Issue:** `cleanupScratch(code === 0 && keepTarget)` removes every scratch directory on any non-zero exit, regardless of `--keep-target`. Hard rule 3 (`:37-39`) promises removal "unless --keep-target is passed". The raw transcripts of both runs live only in scratch (`join(build.target, transcriptName)`) until `writeArtifacts` at `:1608`, which is the last step. Any `fail()` or thrown error between run completion and that write -- a redaction survivor at `:1463`, a `readContext` throw inside `authorStamps`, an `equivalence` throw -- destroys the only copy of an artifact that cost real tokens, and does so on the one path where the operator needs it for diagnosis.
**Fix:**
```ts
} finally {
  cleanupScratch(keepTarget); // the flag's contract, not the exit code, decides
}
```
and stream the transcript into a preserved location (the `--out` directory, or a scratch directory excluded from cleanup) so a post-run derivation failure never costs the capture. If unredacted bytes must not land in `--out`, keep them in a scratch directory that is preserved on failure and print its path.

### CR-05: A failed plugin install does not stop the live spawn

**File:** `scripts/capture-live.ts:1565` (with `:1132-1140`)
**Issue:** `pluginInstall` returns a string beginning `UNKNOWN - verify` when `claude plugin install` exits non-zero or cannot be started; `capture()` appends that string to `installLines` and proceeds to `runPlatform` at `:1572`. The run then spends up to `CALL_BOUND_MS` per label with no plugin installed, which cannot satisfy A1 or CAP-03, and the failure surfaces only as `OUTCOME: fail` after the budget is gone. The plugin being installed is a phase-2 precondition of D-05 route 2, and the header's contract is that nothing spawns while a precondition is not MET.
**Fix:**
```ts
function pluginInstall(...): string {
  ...
  if (r.error !== undefined || r.status !== 0) {
    fail(`plugin install ${pluginName}@${marketplaceName} did not complete (exit ${String(r.status)}): ${detail}`);
  }
  return `installed ...`;
}
```

## Warnings

### WR-01: The per-spawn approval-key assertion misses a differently-cased key on Windows

**File:** `scripts/capture-live.ts:265-274` (and `:254-262`, `:1005`)
**Issue:** `childEnvironment` copies `process.env` into a plain object; `approvalKeyRefusals` then does `hasOwnProperty(env, "GRUGOPS_PROD_DEPLOY_APPROVED")`. On win32 environment names are case-insensitive: a shell that exported `grugops_prod_deploy_approved=1` is inherited by the child, `hooks/guard.ts` reads it through `process.env[APPROVAL]` (case-insensitive on win32), and the deny cannot fire -- while the copied object has no key of the exact spelling, so the per-spawn assertion passes. The parent-side row at `:1005` uses `process.env` directly and does catch it, so the live capture still refuses; but hard rule 4's claim that the key's absence "is asserted on that object before every spawn" is false on the platform this phase targets, and the dry run's probes and installs still spawn with the key set.
**Fix:** Compare case-insensitively on every host: `Object.keys(env).some((k) => k.toUpperCase() === PROD_DEPLOY_REASON_SIGNATURE.toUpperCase())`, and refuse on a match. Add a test with a lower-cased key in the base.

### WR-02: Redaction and its survivor check share one form set that omits the forward-slash and file-URL spellings of a Windows home

**File:** `scripts/capture-live.ts:838-846` (with `:859-871`, `:1456-1464`)
**Issue:** `homeSpellingForms` produces `C:\Users\x` and its JSON-escaped form. A stream-json transcript from a Windows host can carry `C:/Users/x/...` (paths built with forward slashes by tools and plugins) and `file:///C:/Users/x/...` (file URLs in tool inputs). Neither is in the set, so `redactText` leaves it and `homeSpellingSurvivors` -- which consults the same set -- reports zero survivors. The fail-closed check is vacuous for exactly the forms it does not enumerate.
**Fix:** Add `toPosixWith(h, win32.sep)` and `pathToFileURL(h).href` (and their JSON-escaped forms) to `homeSpellingForms`, and add a test that a `C:/Users/alice` spelling does not survive.

### WR-03: The negative D-04 claim row cites transcript line 1, a citation unrelated to the claim

**File:** `scripts/capture-live.ts:1226-1230`
**Issue:** When no deny fired, the row's `line` is `cite(0)` -- the first frame's line -- solely so the row is not withheld. Hard rule 7 exists so that every row is traceable to the line that supports it; a "no deny in N frames" claim is supported by the N `hook_response` frames, not by line 1. `--verify-artifacts` accepts it because the number is in range, so the re-check cannot tell a supported citation from a manufactured one.
**Fix:** Cite the last `hook_response` frame examined (record its index in `DenyObservation`) and put the examined count in the value, or extend the citation grammar with `jsonl:<first>-<last>` for whole-transcript negative claims.

### WR-04: `git -C <path from the transcript>` contradicts the header's T-33-02 claim and validates nothing about the path

**File:** `scripts/capture-live.ts:1151-1157` (with `:100-102`)
**Issue:** The header states "No transcript field is ever interpolated into a path or a command (T-33-02)". `installedPluginSha` passes `system/init.plugins[].path` straight to `git -C`. It is an arg-array spawn, so there is no shell injection, but the path is not checked to exist, to be a directory, or to sit under the plugin cache root, and with CR-01 the model can author that frame. `git -C` also accepts a path beginning with `-`.
**Fix:** Resolve the path with `realpathSync.native`, require it to be a directory under the cache root the platform reports (or under `homedir()/.claude/plugins`), and only then run `git`; otherwise record `UNKNOWN - verify` naming the refusal. Correct the header comment to describe the one exception.

### WR-05: Grant-derivation disagreement does not gate the spend

**File:** `scripts/capture-live.ts:1556-1557` (with `:635-698`, `:911-982`)
**Issue:** `capture()` fails only when `grantSource.coordinator === null`. `deriveGrant` also reports `reasons` for a census/grant mismatch, an unresolved granted name, or an ungranted adapter; those reasons are ignored here and surface only inside `capThreePredicate` after both runs. The readiness table (`evaluatePreconditions`) carries no row for the grant, although the header calls it "the ONE readiness derivation".
**Fix:** Add a precondition observation `grantReasons: string[]` (derived over the checkout, or over target A before any platform call) and a row that is `UNMET` when non-empty.

### WR-06: The pushed-sha precondition does not see a dirty working tree

**File:** `scripts/capture-live.ts:954-972` (with `:1060-1082`)
**Issue:** The installer runs from the working tree (`install/install.js` copies the checkout's kit), while the plugin comes from GitHub at the pushed sha. Uncommitted edits to `agent-factory/` or `.claude/agents/` make the two "paths" different code while `HEAD == origin/main` reads MET.
**Fix:** Probe `git status --porcelain --untracked-files=no` and add a row `working tree clean` that is `UNMET` on any output.

### WR-07: The live runs inherit the operator's user-scope plugins, hooks and settings

**File:** `scripts/capture-live.ts:1106` (with `:1132-1134`)
**Issue:** `spawn(PLATFORM_CMD, ...)` uses the operator's real `~/.claude` configuration. The committed capture shows `context7`, `playwright` and `superpowers` loaded (`33-CAPTURE-SUMMARY.md:70,125`) and 169 `hook_response` frames examined before the deny in run A. Other plugins' hooks, agents and settings participate in the capture, so the CAP-03 spawn evidence, the plugin-error row and the `--allowedTools` surface are not those of "a fresh install of THIS checkout onto the committed fixture project" (D-03). D-04 attribution survives (the signature is unique), but the target is not the isolated instrument the header describes.
**Fix:** Run the platform with `CLAUDE_CONFIG_DIR` pointing at a scratch config directory seeded with only the marketplace row needed for route 2, or add a precondition row requiring `system/init.plugins[]` to name exactly the plugin under test and fold a violation into `anyFailure`.

### WR-08: Residual-rule exemption anchors are substrings validated only for existence, so a short anchor blanket-exempts a file

**File:** `scripts/check-flip-manifest.ts:706-714` (with `:957-965`)
**Issue:** `checkResidual` skips any line where `line.includes(anchor)`. `checkLocators` refuses an anchor only when `countOccurrences(...) === 0`; an anchor that occurs many times (for example `GAP-D1`, or `- `) is accepted and then exempts every residual line in that file. This is a fail-open arm inside the rule whose entire purpose is to refuse survivors.
**Fix:** Require `countOccurrences(text, anchor) === 1` in `checkLocators` and match the anchor against the whole trimmed line (or the exact line number declared) in `checkResidual`.

### WR-09: The `archivedRecords` part is derived from the manifest's own declared set, so listing and derivation are one hand-typed set

**File:** `scripts/check-flip-manifest.ts:458-460`
**Issue:** `archivedRecords = declaredSet(m).filter(startsWith(".planning/milestones/"))`. The "derived" side is read from the manifest, then compared with the manifest's members table -- the two sides the module header says must never be "hand-typed against each other". An archived milestone record carrying `pending human` that the manifest does not name is invisible to the residual rule. The per-part vacuity floor still holds, but it floors a set that cannot grow past what the author typed.
**Fix:** Derive from `gitLsFiles([".planning/milestones"])` with a rule (for example: files that carried the residual token or any deferral marker at the pre-capture commit, read via `git show <flip>^:<path>`), and keep the declared-set intersection only as the listing to compare against.

### WR-10: FIFO construction returns a printed skip on ANY `mkfifo` failure, and the `FORCE_ABSENT` seam is honoured by every test site

**File:** `scripts/check-platform-shapes.ts:459-475`, `:553-570`, `:98`; call sites in `hooks/guard.test.ts:1234`, `hooks/admission-guard.test.ts:436`, `scripts/context-io.test.ts` (nine sites), `scripts/nonblocking-reader-parity.test.ts`
**Issue:** The FIFO `make()` returns `false` when `mkfifo` exits non-zero for any reason -- binary absent from `PATH`, `EACCES` on the scratch root, a wrong argument -- and every migrated test then `console.warn`s and returns green. Before this phase those cases threw. The cases in question are the ones that reproduced a real bypass (a hook that blocks on a FIFO produces no decision, which the host treats as allow). `stageShapeOrSkip` and `hostCapabilityOrSkip` also honour `GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT` first, so one environment variable in CI turns every FIFO, symlink and chmod case in the suite into a skip with the suite still green. `uat-gate-exit-contract.test.ts` compares the printed remainder with a remainder derived by the same constructor, so a broken `mkfifo` on ubuntu is self-consistent and undetected.
**Fix:** Assert the remainder per CI leg where it is known: the ubuntu step in `ci.yml` should require `SKIPPED SHAPES (0):` (or the exact expected rows), so a skip on a host that can construct the shape is red. Make the test helpers ignore `FORCE_ABSENT` unless a second, test-only opt-in is present (or restrict the seam to `check-platform-shapes.test.ts`). Have `make()` distinguish "the platform has no `mkfifo`" (ENOENT on spawn) from a failed `mkfifo` that ran, and return `false` only for the former.

### WR-11: `stageNameOrSkip` classifies any ENOENT/EINVAL from the caller's constructor as a platform refusal of the control byte

**File:** `scripts/check-platform-shapes.ts:709-720`
**Issue:** The helper does not verify that the path the constructor creates carries a byte below 0x20; it maps every `ENOENT` or `EINVAL` thrown by `construct()` to the skip entry. A missing parent directory (a caller bug) is reported as "this platform refuses a path component carrying a control byte" and the case turns green with a misleading row.
**Fix:** Take the path as a parameter, require `/[\x00-\x1f]/.test(basename(path))` up front (throw otherwise), and confirm `existsSync(dirname(path))` before treating the error as a platform refusal.

### WR-12: The live lane's `afterAll` removes a marketplace it never added and runs plugin operations in the repository root

**File:** `scripts/e2e/uat-live.test.ts:280-312`
**Issue:** `afterAll` runs `claude plugin marketplace remove grugops --scope local` and `claude plugin uninstall grugops --scope local` with `cwd: tmpRepo || ROOT`. The runner never adds a marketplace -- the user-scope `grugops` row is the D-05 route-2 PRECONDITION -- and it already uninstalls per target. If `tmpRepo` is still `""` (the runner case did not reach `mkdtempSync`), both commands run in the repository checkout. Depending on how the CLI treats `--scope local` for `marketplace remove`, this can remove the very row the next run's readiness depends on, or touch the repository's own local plugin state.
**Fix:** Delete the marketplace-remove call; guard the uninstall with `if (tmpRepo === "") return;`; never use `ROOT` as the cwd for a mutating platform command.

### WR-13: The `approvalKeyPresent` UNMET row is unreachable in production because `spawnEnv()` throws first

**File:** `scripts/capture-live.ts:1004-1006` (with `:974-978`, `:276-281`)
**Issue:** `observePreconditions` computes `approvalKeyPresent` and then calls `spawnEnv()`, which throws a `CaptureFailure` when the key is set. The table is never built; the dry run prints `CAPTURE NOT DERIVED` instead of the D-10 three-state table with an `UNMET` row. The behaviour is fail-closed, but the documented readiness contract (`:66-70`) is not what an operator sees, and the `UNMET` branch at `:976` is exercised only by the offline suite.
**Fix:** Build the observation without spawning when the key is present (skip the probes, leave them `null`), evaluate the table, print the readiness line, and only then refuse in `capture()`; keep `spawnEnv()`'s refusal as the last line of defence.

## Info

### IN-01: Local `toPosix` duplicates `scripts/posix-path.ts`

**File:** `scripts/capture-live.ts:247`
**Issue:** `posix-path.ts:23-26` names this site as one of the ten it deliberately leaves alone, so it is recorded rather than accidental; it is still a second copy of the one normalizer the phase introduced, in a file the phase created.
**Fix:** `import { toPosix } from "./posix-path.js";`

### IN-02: Dead directory-name check

**File:** `scripts/capture-live.ts:716`
**Issue:** `readdirSync` never returns `.` or `..`, and `TASK_DIR_RE` already excludes a bare `.`; the `entry.name === "." || entry.name === ".."` clause cannot fire.
**Fix:** Remove the clause.

### IN-03: Offline-suite temp directories are never removed

**File:** `scripts/capture-live.test.ts:86-100` (every `contextRootWithNotes` caller)
**Issue:** `contextRootWithNotes` creates `grugops-capture-live-test-ctx-*` under the OS temp directory on every call and no case removes it; the dry-run case's "no scratch directory survives" assertion excludes the `test-` prefix, so the leak is invisible to the suite.
**Fix:** Collect the roots in an array and `rmSync` them in `afterAll`.

### IN-04: `expectEndedBySigint` and its self-test are duplicated verbatim in two files

**File:** `scripts/board-watch.test.ts`, `scripts/board-dashboard.test.ts`
**Issue:** The helper and its two-case `describe` are copied into both files.
**Fix:** Move the helper to a shared test module and keep one self-test.

### IN-05: Hand-pinned counts bumped in this phase, plus a tautological negative

**File:** `scripts/check-foundation-guards.test.ts` (`NON_TEST_MODULE_COUNT = 89`, `62`, `TRIPWIRE_MODULES = 72`, `targets: 11`), `scripts/check-claim-anchors.test.ts` (`toBe(17)` followed by `not.toBe(18)`), `scripts/check-banned-claims.test.ts` (`bannedClaimScanOverlap()` pinned to `2`)
**Issue:** Each is the set-literal pattern the project's memory names; the `.not.toBe(18)` after `.toBe(17)` cannot fail independently.
**Fix:** Where a count can be derived (git ls-files, the corpus array), assert the relationship rather than the integer; drop the redundant negative.

### IN-06: `--manifest` spelled with backslashes misroutes the summary path and fails the `status` row

**File:** `scripts/check-flip-manifest.ts:646-647`, `:848`
**Issue:** `manifestDir` is split on `/` only, and the `status` flip row compares `row.file` byte-for-byte with the CLI value. A Windows operator passing `.planning\phases\...\33-FLIP-MANIFEST.md` gets a summary path of `33-CAPTURE-SUMMARY.md` at the repo root and a false status-row refusal.
**Fix:** `const manifestRel = toPosix(cli.manifest);` at the top of `main()`.

### IN-07: `changedFiles` over a merge commit yields an empty set

**File:** `scripts/check-flip-manifest.ts:596-604`
**Issue:** `git diff-tree --no-commit-id --name-only -r --root <commit>` prints nothing for a merge commit without `-m`/`-c`, so a flip that lands via a merge reports every declared file as "omitted". It fails closed, but with a message that points at the wrong cause.
**Fix:** Use `["diff", "--name-only", "-z", `${c}^`, c]` for the single-commit form (or add `-m --first-parent` to `diff-tree`), and name merge commits in the refusal text.

### IN-08: `--out` consumes a following flag as its value

**File:** `scripts/capture-live.ts:319`
**Issue:** `--out --dry-run` sets `opts.out = "--dry-run"` and leaves `dryRun` false, so a mistyped invocation runs the LIVE capture (subject to readiness) with an artifact directory literally named `--dry-run`.
**Fix:** Refuse a value that starts with `--`.

---

_Reviewed: 2026-09-20T18:33:35Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
