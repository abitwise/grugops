---
phase: 33-live-capture-windows-portability
reviewed: 2026-09-21T11:27:10Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - docs/audit/28-disposition-register.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - scripts/capture-live.js
  - scripts/capture-live.test.ts
  - scripts/capture-live.ts
  - scripts/check-build-parity.js
  - scripts/check-build-parity.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-platform-shapes.test.ts
  - scripts/check-public-docs-vocabulary.js
  - scripts/check-public-docs-vocabulary.test.ts
  - scripts/check-public-docs-vocabulary.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/freshness.test.ts
  - scripts/runnable-ref/uat-spec-integrity.js
  - scripts/runnable-ref/uat-spec-integrity.test.ts
  - scripts/runnable-ref/uat-spec-integrity.ts
  - scripts/uat-gate-exit-contract.test.ts
findings:
  critical: 1
  warning: 6
  info: 7
  total: 14
status: issues_found
---

# Phase 33: Code Review Report — gap-closure round 2

**Reviewed:** 2026-09-21T11:27:10Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

Round-2 numbering starts at 01. Round-1 IDs (CR-01..05, WR-01..13, IN-01..08) live in `33-REVIEW-round1.md`; where a round-2 finding is about a round-1 closure, the round-1 ID is named in the text. Round-1 findings the human accepted open into WINDOWS.md rows 237–254 are not re-reported.

## Summary

Scope was the diff `7ef5a1c4..HEAD` over the 21 listed files, read against the whole file. The six committed `.js` twins (`hooks/hook-entry.js`, `scripts/capture-live.js`, `scripts/check-build-parity.js`, `scripts/check-public-docs-vocabulary.js`, `scripts/context-io.js`, `scripts/runnable-ref/uat-spec-integrity.js`) were rebuilt with `tsc --outDir <scratch>` and are byte-identical to the build; `hooks/hook-entry.ts` changed in exactly two manifest lines and the new hash is `sha256(scripts/context-io.js)`. Their logic was not reviewed twice.

What holds up: `cleanupPlan`'s truth table matches the `finally` at `capture-live.ts:2130` in all four cells (CR-04 closed); `installOutcome` is total over `{status, error}` and `runTarget` calls the install first so a refused install never reaches `ops.runPlatform` (CR-05 closed); `isOutsideTargets` is `relative()`-based, refuses the root itself and a lookalike sibling; `pluginCachePathAccepted` judges on `realpathSync.native` so a link that leaves the cache root is refused, and I confirmed it accepts the real `~/.claude/plugins/cache/grugops/grugops/2.1.0` directory on this host; `contentDigest` is order-independent and moves on one byte or one missing file; `deriveOutcome` cannot answer `pass` while provenance is not `MET` (CR-02 closed as a mechanism); `faultKey` is held equal to `toPosixWith` on every arm including the empty-separator refusal (test AA); `corpusMember` has exactly one call site and the walk is the only host-spelled part; `appendRegularFileLine` classifies by type before the open and keeps the post-open `fstat` as the race authority; no test in scope reads `process.platform` as a conditional (the one read is a log string in `uat-spec-integrity.test.ts`).

What does not hold up is the premise behind the CR-01 closure. The transcript moved out of the subject's cwd, but the subject still holds unscoped `Write`, `Edit` and `Bash(node *)` (`capture-live.ts:250-260`), so it can reach the sibling scratch, the plugin cache copy the provenance digest reads, and the adapter files the grant is re-derived from after the run. The predicate is sound; the file it reads after the subject has run is not, which is the class this project's history records. The provenance arm is fail-closed but post hoc, and the version-keyed plugin cache makes a stale copy a predictable `UNMET` after the full spend.

## Critical Issues

### CR-01: The CR-01 closure rests on "the subject has no path to it", which the shipped grant contradicts — the verdict is still derived from files the subject can write

**File:** `scripts/capture-live.ts:57-63` (header), `:250-260` (`LIVE_ALLOWED_TOOLS`), `:1438-1447` (`runTarget` re-reads from disk), `:1443` (grant derived after the run), `:1576` (cache copy digested after the run); `scripts/capture-live.test.ts:672`, `:741` (the test states the same premise); `33-12-SUMMARY.md:129` ("the scored transcript is unreachable from the subject's grants")
**Issue:** Round-1 CR-01 was closed by streaming the transcript into a sibling `mkdtemp` under `tmpdir()` and asserting `isOutsideTargets` before the spawn. The header now argues the file is sound "only because the subject has no path to it". The subject's grant is byte-identical to round 1 (33-12-SUMMARY line 46 says so) and contains `Write`, `Edit` and `Bash(node *)` with no path scope. A `Write`/`Edit` rule with no pattern is not cwd-bounded in Claude Code, and `Bash(node *)` is arbitrary code as the runner's user. The scratch directory carries the fixed literal prefix `grugops-capture-live-transcript-A-` under the OS temp directory, so it is one `Glob`/`readdirSync` away. Three verdict inputs are re-read from disk AFTER the subject ran and are therefore assembled from subject-writable state:

1. `readFrames(transcriptPath)` at `:1442` and `readFileSync(transcriptPath)` at `:1447` — the deny attribution (`denyObservedInStream`) and the CAP-03 side (a) spawn evidence are scored from the file, not from the bytes the runner received on the pipe. Concrete input: while the run is live, `Bash`: `node -e "require('fs').appendFileSync('/tmp/grugops-capture-live-transcript-A-<suffix>/33-CAPTURE-A.jsonl', JSON.stringify({type:'system',subtype:'hook_response',stdout:'<byte-perfect deny envelope>'})+'\n')"`. The offline test at `:741` proves only that a file planted at the OLD in-target location is not read; it never plants at the new location.
2. `deriveGrant(build.target)` at `:1443` reads `.claude/agents/*.md` from the cwd the subject had `Edit` over. `capThreePredicate` decides side (a) membership and side (b) authorship against that grant and its derived prefix. Concrete input: `Edit .claude/agents/<any>.md` to add a `coordinator: true` marker or a granted name, and a spawned role that was not granted reads as a member; `capture()` derives `grantSource` before the runs but never compares it with the post-run derivation.
3. `contentDigest(accepted, tracked)` at `:1576` reads the cache copy under `~/.claude/plugins/cache/...` after both runs; with `Bash(node *)` the subject can rewrite that copy to the checkout's bytes and turn a stale plugin into `MET`.

`33-21` recorded dropping `Write`/`Edit` as a human KIT decision; `Bash(node *)` was not part of that decision and is sufficient on its own. The `OUTCOME: pass` line is therefore still reachable over a run whose deny never fired.
**Fix:** Make the verdict independent of anything on disk the subject could touch, and narrow the grant:
```ts
// runPlatform: keep the bytes the runner itself received; the file is a copy for the operator.
const chunks: Buffer[] = [];
child.stdout.on("data", (d: Buffer) => { chunks.push(d); out.write(d); });
// ... settle(...) resolves with { ..., transcriptText: Buffer.concat(chunks).toString("utf8") }
// runTarget: derive over result.transcriptText via parseFrames(), never readFrames(transcriptPath).
```
Derive the grant BEFORE the spawn (`const grant = deriveGrant(build.target)` moved above `ops.runPlatform`) and fold a post-run re-derivation mismatch into `failed`. Scope the grant to what the request needs (`Write(<target>/**)`, `Edit(<target>/**)`, drop `Bash(node *)` — the deny probe needs only `Bash(helm upgrade *)`), and add a precondition row that names the grant scope so the readiness line, not a diagnosis after the spend, carries it. Digest the cache copy before the spawn as well (see WR-02) and record both digests.

## Warnings

### WR-01: `noteRoute` counts only absolute-path `Write`/`Edit` blocks, so the route axis of the D-07 projection is evadable by a relative `file_path`, a `MultiEdit`, or a node-mediated write

**File:** `scripts/capture-live.ts:909`, `:919-922`
**Issue:** `contextMarker` is `/.grugops/context/` with a leading slash and the block filter admits only `Write` and `Edit`. Reproduced on the committed `.js`: `{name:"Write", input:{file_path:".grugops/context/T/notes/n.md"}}` → `directContextWrites: 0`; `{name:"MultiEdit", input:{file_path:"/tmp/t/.grugops/context/T/notes/n.md"}}` → `0`; a `Bash` block running `node -e "fs.writeFileSync('.grugops/context/…')"` → `0`. Claude Code accepts relative `file_path`s (resolved against cwd), so a real run can take the direct route and project as "0 direct writes". Because the projection compares A against B, two runs that both evade read as parity on this axis, and the KIT direction (b) recorded at 33-21 ("refuse non-sanctioned notes on read") will be evaluated against a route count that cannot see them.
**Fix:** Match on the normalized path with the marker anchored either way, widen the tool set to every file-writing tool the platform publishes, and count `Bash` blocks whose command text names the context subpath as "unclassified writes":
```ts
const rel = toPosix(CONTEXT_SUBPATH);
const p = toPosix(filePath);
const direct = p.includes(`/${rel}/`) || p.startsWith(`${rel}/`);
const WRITING_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
```
and pin each new arm with a converse in the `noteRoute` case at `capture-live.test.ts`.

### WR-02: Provenance is decided only after both runs, and the version-keyed plugin cache makes a stale copy a predictable `UNMET` after the full spend

**File:** `scripts/capture-live.ts:1553-1592` (`deriveProvenance`), `:2061` (called after both `runTarget`s), `:1424` (install happens before the spawn, so a pre-spawn digest is possible)
**Issue:** `claude plugin install` caches by `<marketplace>/<plugin>/<version>` (`~/.claude/plugins/cache/grugops/grugops/2.1.0` on this host, which survives the round-1 uninstall and is now orphaned from `installed_plugins.json`). CLAUDE.md's own note is that users only get updates when `plugin.json`'s version is bumped. At an unbumped `2.1.0`, a round-3 install can reuse the cached copy from whichever sha last populated it; the digest then reads `UNMET`, `deriveOutcome` answers `fail`, and the answer arrives after up to 2 × `CALL_BOUND_MS` of spend. This is the same "spend on a guaranteed fail" shape as round-1 CR-03, one arm over: the readiness table has a pushed-sha row but no row that the copy the platform WILL load equals the checkout. Offline on this host today: checkout digest `406292d0…`, cache-copy digest `4cc4cea2…` (UNMET, as expected with HEAD 12 ahead of `origin/main`) — the mechanism is measurable at zero tokens, and nothing measures it before the spawn.
**Fix:** In `runTarget`, after `ops.pluginInstall` and before `ops.runPlatform`, digest the freshly installed copy and refuse to spawn on anything but `MET`:
```ts
const installed = installedCopyPath(build.target, run.pluginName, run.marketplaceName); // from the platform's own installed_plugins.json row for scope=local, projectPath=build.target
const pre = provenanceVerdict(checkoutDigest, installed === null ? null : contentDigest(installed, tracked));
if (pre.state !== "MET") fail(`plugin provenance is ${pre.state} before the spawn — ${pre.detail}`);
```
Keep the post-hoc init-frame digest as the confirmation and report both. Also consider `claude plugin marketplace update grugops` (or uninstall + reinstall at user scope) as a documented pre-step when the version is unbumped.

### WR-03: `MET` is over `git ls-files` only, while the installer copies the working tree — an untracked file under `agent-factory/` reaches path A and never enters the digest

**File:** `scripts/capture-live.ts:1553-1557` (`trackedFiles`), `:1507-1524` (`contentDigest`), `:1593` (report row wording "content digest over N tracked files"); `install/install.ts:1546` (`cpSync(join(GRUGOPS_SRC, "agent-factory"), …)`)
**Issue:** Path A is built by `install/install.js`, which `cpSync`s `agent-factory/` from the checkout's working tree. Path B is the plugin cache copy. The digest compares the two over the tracked list, so a file that is untracked in the checkout (a new role or workflow not yet `git add`ed — 33-21 deviation 2 records two untracked entries at the time of the round) is present in target A, absent from the cache copy, and invisible to the digest: provenance reads `MET`, the two paths ran different kits, and the D-07 parity verdict is over two different subjects. The report calls it "the checkout by content" and the module (`:986`, `:1533`) "byte for byte the checkout under test". This is the round-1 WR-06 dirty-tree class; the digest closes the modified-tracked arm and leaves the untracked arm open.
**Fix:** Add `git status --porcelain --untracked-files=all -- agent-factory .claude/agents install skills hooks` (the directories the installer and the plugin read) to `observePreconditions` and a row `working tree matches HEAD` that is `UNMET` on any output; or digest over `git ls-files -z --cached --others --exclude-standard` and name the set in the row.

### WR-04: `probe()` concatenates stderr into the data path, and the new `trackedFiles()` consumer digests whatever git printed there as a path

**File:** `scripts/capture-live.ts:1171-1175` (`probe`), `:1553-1557` (`trackedFiles`), `:1212-1215` (`localHead`/`remoteHead` through the same function)
**Issue:** `probe` returns `${stdout}${stderr}`. `childEnvironment` copies the operator's whole environment, so `GIT_TRACE=1` (or any `warning:` git emits, e.g. a safe.directory or config-permission warning) reaches the child. Reproduced: with `GIT_TRACE=1`, `git ls-files -z` through the same concatenation yields 2447 entries whose last is `"14:28:19.407364 git.c:502 trace: built-in: git ls-files -z\n"`, and `git rev-parse HEAD` yields `"a4b149f4…\n14:28:19.415022 git.c:502 trace: built-in: git rev-parse HEAD"`. The trace text is joined as a relative path (`MISSING` on both sides, so the verdict does not move) but the report's "over N tracked files" is wrong, and `localHead !== remoteHead` reads `UNMET` on the pushed-sha row even when the shas are equal, with a detail that quotes two trace lines. The pushed-sha arm is pre-existing; the tracked-list arm is new in this round.
**Fix:** Return stdout only from `probe` and carry stderr separately for the refusal text:
```ts
function probe(...): { out: string; err: string } | null {
  ...
  return { out: r.stdout, err: r.stderr ?? "" };
}
```
and `trackedFiles()` parses `out` alone. Add a test that plants `GIT_TRACE=1` in the base environment and asserts the tracked count and the pushed-sha row are unchanged.

### WR-05: The walk's start is now rung-1 `realpathSync.native`, but the home boundary is still spelled through rung-2 `realpathSync` and the env tier through bare `resolve` — one directory, three spellings, one tier apart

**File:** `scripts/context-io.ts:4889` (`spellings.add(resolve(realpathSync(named)))`), `:5308` (`return resolve(fromEnv.trim())`), `:5317` (the cwd tier, now `canonicalWorkingDirectory`)
**Issue:** 33-16 canonicalised the cwd tier through `canonicalDirectoryPath` (rung 1 `.native`) and states "both are spelled by one authority" of tier 0 and the cwd. Two other sites in the same resolution still spell the same directory differently. (a) `homeBoundary()` adds the home's second spelling through the portable `realpathSync`, which is exactly the rung-2 authority that disagreed with rung 1 on windows-latest run 35579263776 (WINDOWS.md row 236: `runneradmin` vs `RUNNER~1`). If `USERPROFILE`/`HOME` carries an 8.3 component, `abovePaths`/`selfPaths` hold the short spelling while the walk climbs long-name directories; the path sets miss and only the dev:ino identity sets catch it — and those are dropped by the `degenerate` guard at `:4917-4923` on a filesystem that reports equal identities for parent and child (the guard exists because such hosts were seen). (b) The env tier returns `resolve(fromEnv)` without canonicalisation, so `CLAUDE_PROJECT_DIR=<link>/proj` answers the link spelling while the same directory as cwd now answers `<real>/proj` — on darwin today, not only on win32 — which is the two-answers-for-one-directory shape the 33-16 docblock says the module deletes.
**Fix:** Route both through the one ladder: `spellings.add(canonicalDirectoryPath(named))` at `:4889` (keep `named` itself as the raw spelling), and `return canonicalDirectoryPath(fromEnv.trim())` at `:5308`, then extend Test W to drive the env tier and the home boundary on a link spelling in-child the way it drives the cwd tier.

### WR-06: `runTarget` installs before the containment check and never uninstalls on a throw, so a refused or failed run leaves a local-scope plugin row in the operator's registry pointing at a scratch directory the cleanup deletes

**File:** `scripts/capture-live.ts:1424-1434` (install, then the two `fail`s), `:1442-1448` (`readFrames`/`deriveGrant`/`authorStamps`/`deriveClaims` may throw; `ops.pluginUninstall` is the last statement, not a `finally`)
**Issue:** `ops.pluginInstall` at `:1424` is a side effect on `~/.claude/plugins/installed_plugins.json`; the pure `isOutsideTargets` refusal comes after it, and every throw between the spawn and `:1448` (a `readContext` throw inside `authorStamps`, a `CaptureFailure` from `deriveClaims`) skips the uninstall. `cleanupScratch` then removes `build.target`, leaving a `scope: local` row whose `projectPath` no longer exists — state written outside any directory the runner created (hard rule 3), visible to the operator's next `claude plugin list`, and a second such row on every retry.
**Fix:**
```ts
if (!isOutsideTargets(transcriptPath, [build.target, build.home, cwd])) fail(...); // before any platform call
const installLine = `target ${build.label}: ${ops.pluginInstall(...)}`;
try { ...spawn, derive... } finally { ops.pluginUninstall(build.target, run.pluginName); }
```
and record the uninstall's exit in the run table so a failed uninstall is named rather than swallowed.

## Info

### IN-01: `LIVE_OPS` is an exported mutable object

**File:** `scripts/capture-live.ts:1392`
**Issue:** `runTarget`'s default parameter reads `LIVE_OPS` at call time; any importer can reassign `LIVE_OPS.runPlatform` and the entrypoint path would use the substitute. Not reachable from outside the process, but a seam this cheap to freeze should be frozen.
**Fix:** `export const LIVE_OPS: Readonly<LiveOps> = Object.freeze({ pluginInstall, runPlatform, pluginUninstall });`

### IN-02: The held-capture premise is keyed on an 8-character short sha

**File:** `scripts/capture-live.test.ts:516`
**Issue:** `HELD_CAPTURE_SHA = "c7be6d0d"` will be refused by `git show` as ambiguous once another object shares the prefix; the case throws loudly, but for a reason unrelated to the capture.
**Fix:** Use the full 40-character sha.

### IN-03: Hand-typed counts bumped or added in this round

**File:** `scripts/capture-live.test.ts:928` (`rev-parse` source-line count pinned at 3), `scripts/freshness.test.ts:603` (`cloneCount` 7 → 8), `scripts/check-platform-shapes.test.ts:997` and `:1009` (`toBeGreaterThan(5)` floors)
**Issue:** The `rev-parse` pin is a count of source lines, which is the set-literal pattern the project's memory names (a comment mentioning `rev-parse` moves it). The clone-count pin is derived one step away (`clonesCreated.length`) and could be asserted against the fixture matrix's keys instead of an integer.
**Fix:** Assert the relationship (`callsOf("rev-parse") ⊆ {observePreconditions, checkoutSha}` via the AST, as the platform-shapes CENSUS does) rather than the integer; derive the clone count from the `Fixtures` keys.

### IN-04: `check-build-parity.ts` now builds `CHECK_ROOT` with THIS module's TypeScript, not the target tree's

**File:** `scripts/check-build-parity.ts:150`, `:156`
**Issue:** `createRequire(import.meta.url).resolve("typescript/lib/tsc.js")` resolves from the module's own location, while `npx tsc` in `cwd: root` used the target's local `node_modules/.bin/tsc`. With `CHECK_ROOT` pointing at another checkout (Tests AF/AG), that tree is compiled with a compiler it does not declare. In production `root === ROOT` and nothing changes; the semantic shift is undocumented in the module header.
**Fix:** State it in the docblock, or resolve through `createRequire(join(root, "package.json"))` first and fall back to the module's chain with the layer named.

### IN-05: The `plugin under test per system/init` row publishes a transcript-supplied path with only pipe/newline escaping

**File:** `scripts/capture-live.ts:1571`, `:1648` (`cell`), `:1708` (row)
**Issue:** `under.path` comes from the platform's init frame and lands in the summary through a `cell` that escapes `|` and line breaks only. A C0/C1 byte in that field would land in `33-CAPTURE-SUMMARY.md` verbatim; `verifyArtifacts` does not refuse it, and the tree's `check:nul-bytes` catches it only once the summary is committed (the P32.1 F-14 class).
**Fix:** Route `under.path` through the same control-byte refusal `pluginCachePathAccepted` applies, or replace any `[\x00-\x1f\x7f-\x9f]` with `<control>` in `cell` and count the replacements as a refusal in `verifyArtifacts`.

### IN-06: `mixedArrangementDepth` is a 2× heuristic beside a bisection that can measure the mixed boundary directly

**File:** `scripts/runnable-ref/uat-spec-integrity.test.ts:6742`
**Issue:** `parseBoundaryFor(arrangement)` already measures the two-file boundary on the host; the mixed cases plant `2 * oneFile.overflow` instead, with the ubuntu mechanism marked `UNKNOWN - verify`. Tier-up can shrink parser frames by more than the shift the docblock reasons about; if it ever exceeds 2× the one-file boundary the mixed cases go green-vacuous again. Test AD's margin assertion (`≥ 2 * overflow`) is true by construction of the function it tests.
**Fix:** Plant `max(2 * oneFile.overflow, mixed.overflow + k)` with `mixed = parseBoundaryFor(arrangement)`, and assert `depth > mixed.overflow` in AD so the margin is measured against the arrangement it runs in.

### IN-07: The MIRROR census sees only `hostCapabilityOrSkip` calls lexically inside an `it("MIRROR:…")` body

**File:** `scripts/check-platform-shapes.test.ts:957-1002`
**Issue:** A future mirror case gated through a helper (`gatedMirror(kind)` calling `hostCapabilityOrSkip` internally) is invisible to `callsIn(node)`, so `gatedMirrorCases` under-counts while `toBe(MIRROR_CAPABILITY_GATES.length)` still holds if the table is not extended — the census reads equal while the coverage derivation is short one label on the next windows run.
**Fix:** Also count `mirrorGate(` call sites (the table accessor) inside `MIRROR:` bodies and require every `MIRROR_CAPABILITY_GATES` row's `kind` to appear as a `mirrorGate("<kind>")` literal exactly once.

---

_Reviewed: 2026-09-21T11:27:10Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
