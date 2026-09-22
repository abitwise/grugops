---
phase: 33-live-capture-windows-portability
reviewed: 2026-09-22T20:05:00Z
depth: standard
files_reviewed: 49
files_reviewed_list:
  - .claude/agents/grugops-orchestrator.md
  - agent-factory/contracts/context-note.md
  - agent-factory/packaging/subagent.frontmatter.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/workflows/16-context-read-write.md
  - CHANGELOG.md
  - docs/audit/28-disposition-register.md
  - docs/audit/29-style-dispositions/33-24.md
  - docs/audit/29-style-dispositions/33-25.md
  - docs/audit/29-style-dispositions/33-28.md
  - hooks/admission-guard.ts
  - hooks/admission-guard.test.ts
  - hooks/admission-guard.js
  - hooks/guard.ts
  - hooks/guard.test.ts
  - hooks/guard.js
  - hooks/hook-entry.ts
  - hooks/hook-entry.js
  - hooks/hooks.json
  - scripts/adapter-byte-baseline.test.ts
  - scripts/admission-server.ts
  - scripts/admission-server.test.ts
  - scripts/admission-server.js
  - scripts/canonical-corpus.test.ts
  - scripts/canonical-frontmatter.ts
  - scripts/canonical-frontmatter.test.ts
  - scripts/canonical-frontmatter.js
  - scripts/capture-live.ts
  - scripts/capture-live.test.ts
  - scripts/capture-live.js
  - scripts/check-platform-shapes.ts
  - scripts/check-platform-shapes.js
  - scripts/checkpoints.ts
  - scripts/checkpoints.test.ts
  - scripts/checkpoints.js
  - scripts/compactor.ts
  - scripts/compactor.test.ts
  - scripts/compactor.js
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.ts
  - scripts/context-io.test.ts
  - scripts/context-io.js
  - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/notes/2026-09-14T090500Z-decision-a1b2c3d4.md
  - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/notes/2026-09-14T091000Z-decision-e5f6a7b8.md
  - scripts/floor-invariance.test.ts
  - scripts/generate-role-adapters.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/generate-role-adapters.js
  - scripts/trace-render.test.ts
findings:
  critical: 1
  warning: 3
  info: 6
  total: 10
status: issues_found
---

# Phase 33: Code Review Report — gap-closure round 3

**Reviewed:** 2026-09-22T20:05:00Z
**Depth:** standard
**Files Reviewed:** 49
**Status:** issues_found

Round-3 numbering starts at 01. Round-1 IDs are in `33-REVIEW-round1.md`, round-2 IDs in `33-REVIEW-round2.md`. Items already on the ledger (WINDOWS.md rows 259 alias push, 260 win32 `Edit(//ABS/**)` spelling, 267 unkeyed seal, 268 no grandfather clause, 269 opaque-by-decision arms, 270 live unknowns, 271 CHANGELOG sentence for `assertNoteScalar`) are not re-reported.

## Summary

Scope was the diff `71aaa5bc..HEAD` over the 49 listed files, read against the whole file where the change touched a decision. The 11 committed `.js` twins were rebuilt with `tsc --outDir <scratch>` and are byte-identical to the build. The four decider hashes in the `hooks/hook-entry.ts` manifest equal `sha256` of the committed `hooks/admission-guard.js`, `hooks/guard.js`, `scripts/checkpoints.js` and `scripts/context-io.js`. `hooks/guard.test.ts`, `scripts/checkpoints.test.ts` and `scripts/canonical-frontmatter.test.ts` pass (666/666).

What holds up:
- **Redirection grammar (33-27).** I drove 17 redirection spellings through `matchCommandCheckpoints` and each answer matched bash semantics or over-refused. Examples: `git > push origin main` gives no push. `git push origin > main` is governed, because it pushes the current branch. `true &> helm upgrade prod` gives no helm. `git push --force>x` is denied. `git 2>&1 push origin main` is denied. The `&` is consumed into a word only when the whole word matches the anchored `REDIRECTION_RE`. The `\d+`/canonical-target arms cannot absorb a real separator. The model stays additive to the literal patterns, so this change can only remove model-originated denials, and I found none it removed wrongly.
- **Seal (33-25).** `sealVerdict` and `parseNote` use the same fence regex. The seal line is stripped by position, and the digest runs through the one `noteSeal`. `readRawNotesWithSkips` is the single walk. `authorStamps`, `trace-render` and `admit()`'s verdict lookup all reach it through `readContext`.
- **Field guard (33-26).** `assertNoteFields` is now the first statement of `composeNote`, so no composer can skip it.
- **capture-live (33-29/33-30).** It now scores the pipe bytes, not the file. It derives the grant before the spawn and checks for drift after the run. It runs a provenance gate before the spawn, uninstalls in a `finally`, uses stdout-only `probe`, and adds the scoped working-tree row. Together these close round-2 CR-01 items 1-3 and WR-02, WR-04 and WR-06 as mechanisms.
- **Admission matcher (33-28).** `mcp__(plugin_grugops_)?grugops__.*` is tested under both anchoring readings and does not match another plugin's scoped tools.

What does not hold up:
- **CR-01 (the central finding).** The command model's fail-closed backstop is still defeated by the edit that triggers it. The model claims this defeat is impossible, and the round-3 comment in `checkpoints.ts` re-asserts that claim. It is defeated one register over from P30's RA3-4: splice the TOOL word instead of the verb. The bypass predates this round (the round-2 base answers identically). Round 3 re-baselined the frozen guard and restated the soundness claim over it, and the green suite does not exercise the arm.
- **WR-01.** The seal filter created a new defect: promoting a note onto an unsealed occupant at the destination now appends a GOV-02 ledger event and only then refuses the write.

## Critical Issues

### CR-01: Splicing the TOOL word allows a zero-key production deploy or protected-branch push, because the fail-closed backstop greps the raw text for a tool name the splice has removed

**File:** `scripts/checkpoints.ts:911-917` (`failClosedCheckpoints`), `:737-740` (`normalizeToolWord`), `:905-908` and `:975-978` (the soundness claim, restated by 33-27); `hooks/guard.ts:294-298`, `:306-314` (the literal sets and the documented residual, which names only env-var indirection); `scripts/floor-invariance.test.ts:266` (the guard re-baselined over this state)

**Issue:** Two arms decide an unreadable segment, and each arm misses a different half of the problem:
- **Model arm.** A word carrying a quote or a backslash is opaque, so the segment is untokenizable. The model then asks `failClosedCheckpoints`, which tests `(?:^|[^A-Za-z0-9_-])<tool>(?:[^A-Za-z0-9_-]|$)` against the RAW segment text. A spliced tool word no longer contains `<tool>` as a substring, so it returns nothing.
- **Literal arm.** The literal patterns need `\b<tool>\s+<verb>`, which the same splice also breaks.

P30's RA3-4 closed exactly this for the VERB by dropping the verb conjunct: "a backstop that cannot be defeated by the edit that triggers it". The same edit applied to the TOOL name was never probed. A second shell-neutral spelling, zsh's `=cmd` equals expansion, is not stripped by `normalizeToolWord`. On a zsh host that spelling passes whenever a flag separates the tool from the verb, since the literals then need `tool\s+verb` adjacency.

I reproduced every row below against the committed `hooks/guard.js`, both directly and through the shipped `hooks/hook-entry.js guard.js`. Stdin was a Bash payload, and no `GRUGOPS_*` or `CLAUDE_PROJECT_DIR` was set. Every row returns no decision, exit 0 and stderr `all checkpoints at default`: an ALLOW with zero keys. Every row is identical on the round-2 base `71aaa5bc` (pre-existing).

```
ALLOW   k\ubectl -n prod apply -f x          (control: kubectl -n prod apply -f x -> deny)
ALLOW   ku''bectl -n prod apply -f x
ALLOW   h\elm upgrade r ./c
ALLOW   g\it push origin main                (control: git push origin main -> deny)
ALLOW   "g"it push --force origin main
ALLOW   g''it push origin main
ALLOW   n\pm publish
ALLOW   terra""form apply
ALLOW   g\h pr merge 12                      (control: gh pr merge 12 -> deny)
ALLOW   =kubectl -n prod apply -f x          (zsh EQUALS; =git -C . push origin main, =gh pr merge 12 likewise)
```

Executability was measured, not assumed. With stub binaries on `PATH`, `bash -c` ran `kubectl -n prod apply -f x`, `git push origin main`, `git push --force origin main`, `helm upgrade r ./c`, `npm publish`, `gh pr merge 12` and `terraform apply`. `zsh -c` ran `=kubectl -n prod apply -f x` and `=gh pr merge 12`.

This is not the disclosed env-indirection residual. Nothing is expanded from a variable: the tool name and the verb are both literally present in the command, spelled with shell-neutral punctuation. RA3-1 was ruled a HIGH on this same basis.

The round-3 comment at `:975-978` states that the P30 fence ("an unreadable segment denies on the tool name alone, a backstop the triggering edit cannot defeat") "is not re-opened one register over". It was never closed on the tool axis.

**Fix:** Keep the RA3-4 shape: no new grammar, and ask the question of a projection the splice cannot hide from. Give `failClosedCheckpoints` the segment's WORDS, not its raw text. Deny when any word's shell-neutral projection names a governed tool. That projection deletes quote and backslash bytes and drops a leading `=`. Apply the same projection in `normalizeToolWord`, so the readable arm sees `=kubectl` as `kubectl`.

```ts
/** What the shell would execute for this word's text, as far as tool-name identity goes. */
function toolIdentity(word: string): string {
  return normalizeToolWord(word.replace(/["'\\]/g, "").replace(/^=/, ""));
}
function failClosedCheckpoints(seg: { raw: string; words: readonly CommandWord[] }): readonly Checkpoint[] {
  const names = new Set(seg.words.map((w) => toolIdentity(w.value)));
  const out: Checkpoint[] = [];
  for (const r of COMMAND_CHECKPOINT_RULES) {
    if (names.has(r.tool) || new RegExp(`(?:^|[^A-Za-z0-9_-])${r.tool}(?:[^A-Za-z0-9_-]|$)`).test(seg.raw)) out.push(r.checkpoint);
  }
  return out;
}
```

Also make `normalizeToolWord` strip a leading `=` (zsh), and add a leading-`=` arm to the literal patterns' tool anchor.

Pin the fix with this table as mirror cases against the committed `.js`, each with its control. Add a derived sweep: for every `COMMAND_CHECKPOINT_RULES` tool, and for every splice position inside the name using `\`, `''`, `""` and a leading `=`, the answer must be deny.

Record the zsh arm in the guard's residual note if it is not closed mechanically. Re-read `:905-908` and `:975-978` once the fix lands. Those lines should describe what the tests show, not what the design intended.

**Fix status (2026-09-22, gsd-code-fixer):** fixed: requires human verification, commit `7d0aea72`. `normalizeToolWord` and the raw-text-only search are replaced by one exported authority, `governedToolsNamedBy` in `scripts/checkpoints.ts`, which both the readable arm and `failClosedCheckpoints` call. It projects the spelled text the way the shell resolves it: quote and backslash removal, `$'…'` ANSI-C escapes, `$"…"`, zsh's leading `=`, brace alternation and sequences, and pathname `*`/`?`/`[…]` as patterns. Substitution bodies are projected on their own, and an expansion strictly inside a word is a gap. The raw search stays beside it, so the arm can only add denials. `vercel` joined the table as a flag-governed row, because it was the one literal-only tool. The zsh `=` arm is closed mechanically. `hooks/guard.ts` is untouched and its frozen blob is unchanged. The hook manifest was regenerated. RED: 29 of the new cases failed on the pre-fix committed `.js`. GREEN: the derived sweep (15 tools, every `\`/`""`/`''`/quoted-char/`=` splice position, 11 shapes) passes on the model, and every splice denies through both `hooks/guard.js` and `hooks/hook-entry.js guard.js`. Every row of the table above now denies. The `:905-908` and `:975-978` docblocks were rewritten. They name what the projection still does not see: a name computed at run time (`$K`, `${x}it` with `x=g`), a renamed or symlinked binary or an alias, zsh `(a|b)` and bash extglob grouping, and a name assembled inside another interpreter.

## Warnings

### WR-01: The seal filter hides an unsealed destination occupant from `promoteAdmitted`'s liveness clause, so the route appends a GOV-02 ledger event and only then fails at the write

**File:** `scripts/context-io.ts:3397` (`readRawNotes(task, to)` is now seal-filtered), `:3455-3480` (the ledger append that precedes the write), `:3482` (`appendPreAdmittedNote` refused by `writeNoteFile`); `scripts/context-io.test.ts:13376` (CONTROL 2b drives this arm and asserts only the throw and the occupant bytes)

**Issue:** `destination-id-occupied` is the clause 31-18 (CR-11) added so that the decision is taken "before the write chokepoint is reached — nothing was written is then true by construction". The clause reads the destination through `readRawNotes`. Since 33-25 that walk skips every note whose seal is absent, malformed or mismatched. That covers every note an earlier kit version wrote (row 268) and any file a subject plants by hand.

For such an occupant the clause sees nothing, and the route proceeds as follows:
1. It checks `ledgerRecordsId(destinationRoot, id)` and gets false.
2. It appends a `re_bound: true` GOV-02 event to the destination's ledger, recording `disposed_by: human:<name>` for a high-severity finding.
3. It reaches `writeNoteFile`, which refuses because the destination holds different bytes.

Reproduced on the committed `.js`, using CONTROL 2b's setup under a `retained` dial:

```
occupant sealed=true : threw "promoteAdmitted: DECLINED (destination-id-occupied) ..."  dest ledger lines 0
occupant sealed=false: threw "writeNoteFile: refusing to write — ... DIFFERENT note ..." dest ledger lines 1
  {"id":"20260909T020000Z-security-nfr-finding-...","kind":"finding","by":"security-nfr","severity":"high","verified_by":"human:mallory","disposed_by":"human:mallory",...}
```

Consequences:
- The destination's audit trail now records a human-disposed finding that its store does not hold.
- The decline is no longer a named clause.
- Because the id is now "already recorded", a later legitimate promotion appends nothing.

The order argument at `:3420-3438` ("ledger first … an OVER-RECORD") was made for a crash between two steps. Here the over-record is deterministic and reachable by planting one file. The comment at `:3390-3395` ("a destination file that does not PARSE is invisible to this reader — and is caught by the chokepoint") was true only of unparseable files. It now covers every unsealed parseable note, and its "nothing was written" does not hold, because the ledger was written.

**Fix:** Ask the destination question of the raw directory, not of the admitted view. Occupancy is a fact about the filename, not about whether the reader would return the note. Before any ledger look, read `<to>/<task>/notes/<sourceId>.md` through `readRegularFileOrNull`. If it exists with bytes different from `candidateText`, decline `destination-id-occupied`, whatever its seal says.

```ts
const occupantPath = join(to, task, "notes", `${sourceId}.md`);
const occupant = readRegularFileOrNull(occupantPath, NOTE_FILE_MAX_BYTES, "note destination"); // throws -> named decline
if (occupant !== null && occupant !== candidateText) throw declineRebinding("destination-id-occupied", ...);
```

Extend CONTROL 2b to assert `ledgerLines(destRoot) === 0`. Apply the same question to `admitAndAppend`'s gated branch, which also appends the ledger before the chokepoint.

### WR-02: `unclassifiedContextWrites` counts read-only commands and prose as "writes", and the parity verdict that decides `pass` compares that count A against B

**File:** `scripts/capture-live.ts:1083-1117` (`noteRoute`), `:1173-1175` (`compareLivePaths`), `:1187` (`deriveOutcome`: any parity diff is `fail`), `:2287` (the report row labelled "unclassified writes naming the context root")

**Issue:** The new arm increments for any `Bash` block whose string inputs name `.grugops/context`, including its `description`. It also increments for any `Write`/`Edit` block whose content merely mentions the path. Reproduced on the committed `.js`: `ls .grugops/context`, `cat .grugops/context/t/index.md` and a `Write` of `/tmp/x/notes.md` whose content says "see .grugops/context" give `{"directContextWrites":0,"proposeNoteCalls":0,"unclassifiedContextWrites":3}`.

The docblock admits this ("or merely an `ls`") and excludes `Agent` prompts as "model-chosen text (the CR-03 class)". But a `Bash` description, an incidental `cat`, and the prose inside a written file are model-chosen in exactly the same way. `compareLivePaths` turns any inequality into a parity diff, and `deriveOutcome` turns any parity diff into `fail`. So `OUTCOME: pass` now also requires two nondeterministic runs to issue the same number of incidental reads of the context root. The row that states the count calls those reads writes.

**Fix:** Count only blocks that can write:
- a `Bash` command whose text names the root and also carries a write-shaped token (`>`, `>>`, `tee`, `node`, `cp`, `mv`, `mkdir`, `touch`, `rm`, `sed -i`), or
- a writing-tool block whose content names the root AND whose path is a script (`.mjs`, `.js`, `.sh`, `.py`).

Ignore `description` and every other non-command leaf of `Bash`. Alternatively, keep the broad count as a reported observation and leave it out of `compareLivePaths`, so parity is decided only by the arms that are a route to disk. In either case, rename the row to what it counts.

### WR-03: 33-27's "the mechanism that fired is asked first" still names the wrong mechanism when a literal pattern matched

**File:** `hooks/guard.ts:703-716` (the `escape` ternary), `:601` (`byPattern`)

**Issue:** The first arm fires on `modelled.untokenizable && modelled.failClosed.has(group.id)` and never consults `byPattern`. When a literal pattern matched as well, the deny text says the command "is matched on the tool name alone and refused rather than guessed at". The user is then told to remove the expansion, but the literal pattern still denies without it. Reproduced: `git push origin main --tags=$T` is denied with "(the word(s) it would not read: `--tags=$T`), so it is matched on the tool name alone …", although `/\bgit\s+push\b[\s\S]*\b(main|master)\b/` matched on its own.

33-27's stated goal was that the deny names the mechanism that fired, citing design rule 1's caveat: "a denial a user cannot act on is a denial they disable the guard to get past". This is the unfinished half of that fix. The ternary pre-dates the round, but the round rewrote it and re-baselined the frozen blob over it.

**Fix:** Ask `byPattern` first: `byPattern ? "" : modelled.untokenizable && modelled.failClosed.has(group.id) ? … : …`. Alternatively, when both fired, say so ("a literal pattern also matched; removing the expansion will not change this answer"). Add a case to `hooks/guard.test.ts` for a literal-matched command carrying a `$var`.

## Info

### IN-01: The bare `mcp__grugops__*` spelling is still stated as the live name in three shipped docblocks

**File:** `scripts/admission-server.ts:3-4`, `:12`, `:55-56`; `hooks/admission-guard.ts:16`; `scripts/capture-live.ts:1068-1069`
**Issue:** The server header says the full name is `mcp__grugops__propose_note`, and that "the un-forgeable Claude Code gate is the PER-CALL PreToolUse hook on mcp__grugops__.*". The admission-guard header says roles call `mcp__grugops__propose_note`. `noteRoute`'s doc says the grant "spells `mcp__grugops__propose_note`", but since 33-29 the grant spells the scoped name. The CHANGELOG and the plugin reference both say the bare spelling is not the plugin-form name.
**Fix:** Update the three docblocks to the scoped spelling, with the bare name described as the server's own name, as `context-note.md` now does.

### IN-02: The short sha that round-2 IN-02 fixed in one test was re-introduced in six others

**File:** `scripts/adapter-byte-baseline.test.ts:95`, `scripts/floor-invariance.test.ts:775`, `scripts/checkpoints.test.ts:1922`, `scripts/generate-role-adapters.test.ts:1615`, `scripts/context-io.test.ts:16702` and `:17063`, `hooks/guard.test.ts:2275`
**Issue:** `capture-live.test.ts:541` now pins the full 40-character sha. The six new readers of the same held capture pin `c7be6d0d`, which `git show` will refuse as ambiguous once another object shares the prefix. That would fail the MODEL-01 baseline and K7 for a reason unrelated to either.
**Fix:** Use one exported constant holding the full sha (for example, from a small test-support module) and import it at every reader.

### IN-03: The board's task counts come from `index.jsonl`, which the seal does not govern

**File:** `scripts/board-read.ts:1806-1830` (read, not changed this round); `agent-factory/contracts/context-note.md:84` ("returned by no reader")
**Issue:** After an upgrade, a store's committed `index.jsonl` still lists every pre-seal note until someone runs `render`. A hand-written `index.jsonl` lists anything. The board reports those as notes and live counts while `readContext` returns zero, and the contract says an unsealed note "is returned by no reader".
**Fix:** Either narrow the contract sentence to note readers, or state in the release note that carries row 268 that `render` must be re-run so the board agrees with the reader.

### IN-04: The CHANGELOG does not record that the prod-deploy guard now allows commands it used to deny

**File:** `CHANGELOG.md:19-53`
**Issue:** 33-27 makes `2>&1`, `>/dev/null`, `&>f` and bare-operator targets readable. For example, `git log --oneline -5 2>&1` went from deny to allow (measured on `71aaa5bc` vs HEAD). That is a user-visible change to a safety surface, and neither `### Changed` nor `### Security` mentions it. Row 271 covers only the `assertNoteScalar` sentence.
**Fix:** Add one `### Changed` bullet naming the redirection grammar and the forms it keeps opaque by decision (row 269).

### IN-05: The working-tree row cannot see gitignored files that the installer copies

**File:** `scripts/capture-live.ts:207-209` (`workingTreeStatusArgs`), `:1363-1380`; `install/install.ts:1546` (`cpSync` of `agent-factory`)
**Issue:** `git status --porcelain --untracked-files=all` omits ignored paths. `.gitignore` ignores `node_modules/` and `**/.grugops/context/*/threads/` anywhere, including under the scoped directories, so such a file reaches target A through `cpSync` without failing the row. The row says the tree "matches HEAD under the directories the installer and the plugin read".
**Fix:** Add `--ignored=matching` to the status arguments and filter out entries the installer demonstrably excludes. Alternatively, qualify the row text to name ignored files as outside it.

### IN-06: A pre-seal origin note is declined as "no-such-origin-note"

**File:** `scripts/context-io.ts:3324-3331`
**Issue:** `readRawNotes(task, from)` now skips unsealed notes. When an operator follows the documented re-admission path (row 268) and promotes a note that exists on disk but predates the seal, the decline says "No note with id … exists" even though the file exists.
**Fix:** When the id is absent from the admitted view, consult `readRawNotesWithSkips(task, from).skipped`. If the id's file is there under `unsealed`, decline with a clause that names the seal reason (for example, `origin-note-unsealed`).

---

_Reviewed: 2026-09-22T20:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
