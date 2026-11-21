---
phase: 43-story-and-layered-docs
fixed_at: 2026-11-18T16:20:00Z
review_path: .planning/phases/43-story-and-layered-docs/43-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 4
status: all_fixed
---

# Phase 43: Code Review Fix Report

**Fixed at:** 2026-11-18T16:20:00Z
**Source review:** .planning/phases/43-story-and-layered-docs/43-REVIEW.md
**Iteration:** 1

**Scope:** the human chose option A on 2026-11-18: fix CR-01, WR-01, IN-01 and IN-02 only. WR-02, WR-03,
IN-03 and IN-04 are follow-ups and are listed under Skipped Issues as out of scope by that decision.
`status: all_fixed` refers to the four in-scope findings.

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 4 (all out of scope by human decision, none failed)

## Fixed Issues

### CR-01: Install renames a user's own `docs/` or `examples/` folder in the kit home, and `--prune-old-kit` then deletes it

**Files modified:** `install/install.ts`, `install/install.js`, `install/install-marker.ts`, `install/install-marker.js`, `install/installer-kit-home.test.ts`, `install/installer-prune.test.ts`, `install/README.md`, `CHANGELOG.md`
**Commits:** 2f8f0d02, b3555ce3
**Status:** fixed: requires human verification (it changes an install decision arm)
**Applied fix:** In copyKit's planning loop, a docs entry (`docs`, `examples`) with something at it that
`owns(..., "kit")` does not answer owned is now left exactly as it is: no plan entry, no rename, no backup,
no record entry, nothing staged or copied there. Install prints a `note` before the DRY_RUN branch, so a
preview prints the same note and writes nothing. This applies to fresh install, re-install and `--update`
(all go through copyKit). Recorded (owned) docs entries keep the replace and `--update` backup arms. The
`agent-factory` kit root keeps its backup arm unchanged. The unreadable or unbound kit-home record note
now says the kit root is kept as a backup and the docs entries are left as they are.

Why no other path can move or remove an unowned docs folder: staging and the holder are mkdtemp
directories that only planned entries reach, and an unowned docs entry is never planned. Prune acts only
on recorded `backup` entries, and none is made for it. writeKitHomeRecord records a skipped entry as `kit`
only when the previous record owned it. The overlap guard only refuses; it never writes.

Note text (the path is the kit-home entry):

```
note  <GRUGOPS_HOME>/docs: something install did not write is already there, so the shipped docs were not copied there and it was left as it is (not renamed, not backed up, not recorded). Links from the kit to ../docs/ do not resolve in this kit home. To get the shipped docs, move what is there to another name, or set GRUGOPS_HOME to a directory of its own; the next install then copies them.
```

The first wording ended "... and re-run". The MSG-1 census (`install/message-references.test.ts` case (f))
would have needed that classed in RERUN_TABLE, so commit b3555ce3 rewords it with no re-run command.

Tests (written first and seen red, 9 failing, against the old install.js):
- New block `review CR-01 (phase 43): an unowned docs or examples folder in the kit home is left untouched, and prune can never reach it` in `install/installer-kit-home.test.ts`:
  - the reviewer's layout (GRUGOPS_HOME=$HOME holding `docs/notes.md`, target `$HOME/code/repo`, `install --claude`, then `--prune-old-kit`);
  - install and `--update` over an unrecorded `docs/` and over an unrecorded `examples/`, each followed by DRY_RUN and real `--prune-old-kit`;
  - a recorded docs entry the user replaced with a file;
  - DRY_RUN install and DRY_RUN `--update` leaving the kit home byte-unchanged.
- **Changed to the new contract (they asserted the old rename-to-backup behaviour):**
  - `installer-kit-home.test.ts` plan 43-06 case: was "a user's own unrecorded $GRUGOPS_HOME/docs is renamed to a recorded docs.bak.<ISO> ...". It is now "... is left in place byte for byte, no docs.bak.<ISO> is made, and the shipped docs are not copied over it".
  - `installer-kit-home.test.ts` plan 43-15 DRY_RUN case: the unrecorded half asserted `would-copy` plus `would-back-up`. It now asserts the CR-01 note and neither line. The case was renamed to match.
  - `installer-prune.test.ts` plan 43-15 prune case: it made its recorded `docs.bak` from a user's unrecorded `docs/`. It now makes both recorded backups through the `--update` arm (an edit inside the recorded entry). The DRY_RUN prune, real prune and hand-made-backup assertions are unchanged.
  - Header comments in both files, and the copyKit, overlap-guard and BACKUP_ORIGINS comments, were updated to the new contract.
- No test name cites "renamed to a recorded backup" for docs any more. The kit-root (`agent-factory`) cases keep that wording because their behaviour is unchanged.
- `install/ledger.test.ts` needed no change: the record still admits a kit-home backup `of` docs or examples, which `--update` makes for a recorded entry that differs.

Docs:
- `install/README.md`:
  - the "Re-installing" kit-home paragraph: `agent-factory/` keeps the backup arm, and a new paragraph covers `docs/`/`examples/`;
  - the shared-kit-root file list: a new `docs/` and `examples/` item;
  - the `--update` paragraph;
  - the `--prune-old-kit` bullet about kit-home backups of the user's content.
- `CHANGELOG.md`: the Unreleased line "kept as a recorded `<name>.bak.<ISO>` backup" now describes the new behaviour.
- `docs/usage.md`, `docs/faq.md` and the other public pages do not describe this arm, so they needed no change. No anchored claim changed: `install/README.md` and `CHANGELOG.md` are outside the claim registry's anchored files, and check:claim-anchors passes.

### WR-01: The install guide's overlap paragraph contradicts the new overlap refusal

**Files modified:** `install/README.md`
**Commit:** bd2e4392
**Applied fix:** The paragraph now names the three kit entries (`agent-factory/`, `docs/`, `examples/`). It says the refusal applies when an entry is the target, lies inside it or holds it, or when the kit home is the target or lies inside it. It keeps the `$HOME/code/repo` example and adds that with `GRUGOPS_HOME=$HOME` a repository at or under `$HOME/agent-factory`, `$HOME/docs` or `$HOME/examples` (for example `$HOME/docs/site`) is refused. This matches install.ts's `kitEntries` comparison.

### IN-01: CHANGELOG says the story-docs gate has three checks; it has four

**Files modified:** `CHANGELOG.md`
**Commit:** e2dec13f
**Applied fix:** The entry now says "four checks" and adds "README.md opens with the tagline and never says `simple software factory`."

### IN-02: Stale cardinality in the comment beside `PUBLIC_DOCS_SCAN_COUNT`

**Files modified:** `scripts/check-public-docs-vocabulary.ts`, `scripts/check-public-docs-vocabulary.js`
**Commit:** e2dec13f
**Applied fix:** The comment drops the number and the per-part arithmetic. It now lists the parts and says the constant holds the number, while the dated MOVED paragraphs keep the history. The `.js` was rebuilt, and freshness and hook-manifest stay green.

## Skipped Issues

### WR-02: The checkout's GUARANTEES.md now ships into every user's kit home, labelled as describing "this repository"

**File:** `install/kit-source.ts:455-483`
**Reason:** skipped: out of scope by human decision (2026-11-18, option A); deferred as a follow-up.
**Original issue:** The shipped `docs/GUARANTEES.md` describes the grugops checkout's floors at install time, but the kit README says it describes "this repository". A user who lowered a floor reads every safety row as `held`.

### WR-03: CLAUDE.md still instructs `{ "agent": "grug-orchestrator" }`, a retired agent name, and the new gate cannot see it

**File:** `CLAUDE.md:134`, `scripts/check-story-docs.ts:85`
**Reason:** skipped: out of scope by human decision (2026-11-18, option A); deferred as a follow-up.
**Original issue:** CLAUDE.md names a retired `grug-orchestrator` agent, and the story-docs check matches only a slash-prefixed `/grug`.

### IN-03: Reference pages miss role participation that a workflow states in a different bullet shape

**File:** `scripts/generate-catalog.ts:745`, `scripts/generate-catalog.ts:799`
**Reason:** skipped: out of scope by human decision (2026-11-18, option A); deferred as a follow-up.
**Original issue:** Workflow 17's `- The Orchestrator: ...` bullet is not matched, so the Orchestrator reference page leaves out the Task claim workflow. Some pages read `UNKNOWN - verify` where the generator knows no workflow names the role.

### IN-04: The story-docs link check skips some link forms, so a dead link in them passes

**File:** `scripts/check-story-docs.ts:201-216`
**Reason:** skipped: out of scope by human decision (2026-11-18, option A); deferred as a follow-up.
**Original issue:** Angle-bracket targets with spaces, HTML `href`/`src`, and targets containing `)` are never checked.

## Verification

All gates and tests ran in the **main checkout** (`workflow.use_worktrees` is `false`; no worktree was
created), at HEAD b3555ce3, so they can be reproduced from this tree.

Gates (exit code):
- `npm run build` 0
- `npm run freshness` 0 (93 .js fresh)
- `npm run check:build-parity` 0 after each commit. Before the CR-01 commit it was 1, because the rebuilt `.js` was not yet committed.
- `npm run freshness:hook-manifest` 0 (no regeneration needed)
- `check:claim-anchors` 0, `check:audit-register` 0, `check:public-docs` 0, `check:banned-claims` 0, `check:story-docs` 0
- `freshness:catalog` 0, `freshness:guarantees` 0
- `check:diff-disposition` 0 (0 findings over 30/30; `install/README.md` and `CHANGELOG.md` are not in the watched corpus, so no disposition rows were needed)

Targeted vitest, with TMPDIR set to the session scratchpad. The 11 listed files gave 1315 tests: 1311 passed, 3 failed, 1 skipped.
- `install/installer-fs-census.test.ts` "every node:fs export ... CONTENT_READER or NOT_CONTENT_READER" (`openAsBlobSync`): matches 43-BASELINE.md.
- `scripts/check-foundation-guards.test.ts` LANG-07 "every remaining floor item's LIVE COUNT is DERIVED ..." (untracked `~/`): matches 43-BASELINE.md.
- `install/install.test.ts` "readUserFile: a unix socket is `not-regular` (socket)": **not in the baseline, and not caused by this change.** It times out after 180 s because the socket path under the mandated scratchpad TMPDIR is about 120 bytes. That is over the 108-byte unix socket path limit, so `server.listen` never calls back. The same test passes under a short TMPDIR (`/tmp/claude-1000/s`: 1 passed). `readUserFile` was not touched.

Also run, outside the mandated list, because the change touches their surfaces: `install/agents-record.test.ts`, `install/installer-special-files.test.ts`, and again `install/message-references.test.ts` and `install/installer-kit-home.test.ts`. Result: 350 passed, 0 failed.

---

_Fixed: 2026-11-18T16:20:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
