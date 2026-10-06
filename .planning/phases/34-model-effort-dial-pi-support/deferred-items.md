# Phase 34 deferred items

Items found during execution that are out of scope for the plan that found them. Each names the plan,
the finding and why it was not fixed there.

## From plan 34-04

### No derived class test installs over a user file planted at every write path

- **Found by:** mutation (i) of plan 34-04 Task 2. The Pi template's `ok` branch was changed to
  overwrite the existing file (a `"w"` write plus a ledger record) instead of skipping it. All five
  derived class test files stayed green: installer-never-installed, installer-user-edit,
  installer-special-files, installer-cross-version and record-truth (261/261).
- **Why they miss it:** the never-installed test plants a user file at every derived write path and
  then runs only uninstall, never install. The user-edit test edits after install and then uninstalls;
  it never re-installs. The special-file and hard-link tests plant shapes that readForWrite blocks. No
  class test plants a regular user file at every derived write path and then installs.
- **What catches it for the Pi path today:** the targeted case in install/install.test.ts, "a
  user-authored template already at the path is skipped, keeps its bytes, gets no ledger entry, and
  survives uninstall unchanged". It and two other Pi cases went red under that mutation. This covers
  only the Pi path, not the class.
- **Why it was not fixed in 34-04:** a class-wide "install over a planted user file" test has a different
  expected outcome for each path. CLAUDE.md and the Copilot file get a block appended, the Gemini and
  Claude settings files are merged, kit files go through the kit plan and its backups, and the
  sentinel-free files are skipped. Writing it means stating that outcome per path, which is new test
  design beyond this plan's scope (re-pin the existing class tests).
- **Suggested owner:** a later gap or backlog item. Its scope would be "install never overwrites a
  regular user file at any derived write path except through a declared, recorded merge", derived from
  `deriveWritePaths`.

## From plan 34-06

### `.planning/research/STACK.md` carries no per-host table, so the CLAUDE.md § 6 table has no live GSD source

- **Found by:** plan 34-06 Task 2, which planned to add the Pi row to the CLAUDE.md § 6 table and "the
  identical row" to `.planning/research/STACK.md`, the source CLAUDE.md's stack block names
  (`<!-- GSD:stack-start source:research/STACK.md -->`).
- **Measured:** STACK.md holds no table row whose first cell is a bold host name. The entry-file table
  left it in commit `84b791bf` (the v1.1 research rewrite), and the current file is the v2.1 research
  (board projector, browser testing, STE). A GSD regeneration would therefore replace CLAUDE.md's whole
  stack block, dropping the § 6 table, not only revert the Pi row.
- **What holds it now:** `install/host-tools.test.ts` ("every per-host table equals the registry")
  requires CLAUDE.md to stay in the derived per-host table set, so a regeneration that drops the table
  fails red by name. STACK.md is scanned as a declared extra by the same rule, so a per-host table
  written there later is checked automatically.
- **Suggested owner:** the next `/gsd-new-milestone` or a docs task that decides whether CLAUDE.md's
  stack block is regenerated or hand-maintained.

### A host count implied in caveman prose in `agent-factory/packaging/adapters.md`

- Line 7 reads "grug build factory once. grug not build it five times." The "five" is the old host
  count. It is caveman voice and does not match the host-noun count-word pattern, so plan 34-06 left
  it. Suggested owner: plan 34-09's derived prose scan (decide whether "N times" next to the per-host
  build sentence is in scope), or a one-word edit with the voice guards run.
