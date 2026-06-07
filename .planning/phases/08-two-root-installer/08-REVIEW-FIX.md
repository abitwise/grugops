---
phase: 08-two-root-installer
fixed_at: 2026-06-07T00:00:00Z
review_path: .planning/phases/08-two-root-installer/08-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 8: Code Review Fix Report

**Fixed at:** 2026-06-07
**Source review:** `.planning/phases/08-two-root-installer/08-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (Critical + Warning): 6
- Fixed: 6
- Skipped: 0
- Info findings (IN-01, IN-02): out of scope (`fix_scope: critical_warning`), not attempted.

All six in-scope findings were applied and committed atomically. The mandatory verification
passed after every fix: `install.test.sh`, `install.two-root.test.sh` (all 18 checks), and
`check-kit-refs.sh` all exit 0 with `ALL CHECKS PASSED`, and the two-root harness's sh/Node
byte-parity assertion (check [12]: "install.sh and install.mjs produce identical target tree +
marker bytes") still passes — parity is preserved across all edits.

## Fixed Issues

### CR-01: uninstall sentinel removal deletes ALL user content after an unterminated open marker

**Files modified:** `install/uninstall.sh`, `install/install.sh`, `install/install.mjs`
**Commit:** `0db6c56`
**Severity note:** This is a data-loss / safety defect, but the fix is a bounded-buffer
transformation whose correctness was confirmed empirically (below), not merely a syntax change.

**Applied fix:** Applied the bounded-removal logic in all THREE places the unbounded strip
existed (the fix guidance flagged this — it was not a single site):

1. `install/uninstall.sh` `remove_sentinel_block` — adopted the review's verbatim awk rewrite:
   buffer the block lines, drop them only when a matching close marker is actually seen, and at
   `END` restore the buffered lines verbatim if `inblk` is still set (unterminated block →
   remove nothing).
2. `install/install.sh` `materialize_adapter` — same termination guard woven into the existing
   inject-at-slot awk pass (buffer + restore-on-unterminated at `END`).
3. `install/install.mjs` `materializeAdapter` — mirrored in JS: buffer block lines, drop on
   close, restore buffered lines at EOF if still in-block. Byte-identical output to the awk pass.

**Empirical verification:** Constructed a `CLAUDE.md` with an open `GSD:grugops-start-here`
marker, NO close marker, and genuine user content after it. Before the fix this path deleted the
header and everything after the open marker; after the fix, `uninstall.sh` left the file's
"Critical user content that must survive" and the header fully intact (block left unremoved
because it never closed). The same guard covers the Copilot file (same `remove_sentinel_block`).

### WR-01: awk `-v` mangles paths containing backslash escape sequences — sh/Node parity break

**Files modified:** `install/install.sh` (within the CR-01 commit's `materialize_adapter` awk hunk)
**Commit:** `0db6c56`
**Applied fix:** Replaced `awk -v kit="$KIT_ROOT"` with passing the path via the environment and
reading it as `ENVIRON["KIT_ROOT"]`, which does NOT process C escape sequences. This change lives
in the same awk block that CR-01 rewrote in `install.sh`, so it is committed together with CR-01.
The Node side (`install.mjs`) already preserved backslashes verbatim via the template literal
`KIT="${KIT_ROOT}"`, so no Node change was needed for parity.

**Empirical verification:** For a kit path `/tmp/a\tb\nc`, the sh side (`ENVIRON[]`) and the Node
side now emit byte-identical `KIT="/tmp/a\tb\nc\n"` (backslashes preserved). The old `awk -v`
converted `\t` to a literal TAB and `\n` to a literal newline — confirmed as the contrast case.

### CR-02: uninstall.sh ignores the documented `--target` flag and operates on the wrong directory

**Files modified:** `install/uninstall.sh`
**Commit:** `4966a06`
**Applied fix:** Added a top-level argument-parsing loop mirroring `install.sh` (lines 49-58):
`--target <repo>` and `--target=<repo>`, with `*) ... exit 2` rejecting unknown args. Added an
`abspath` helper (same shape as install.sh) and resolved `TARGET` with precedence
flag > `TARGET` env > `$(pwd)`, normalized to an absolute path before any removal. D-06 scope is
unchanged — uninstall still removes only adapters + wiring + the `.grugops/install.json` marker,
never the shared `$GRUGOPS_HOME` kit nor seeded per-repo state.

**Empirical verification:** Invoking `uninstall.sh --target <repoA>` (DRY_RUN) from an unrelated
CWD now prints `target: <repoA>` and operates on repoA. Unknown args exit 2 with a message,
matching install.sh. The two-root harness's existing `--target`-from-unrelated-CWD check (line 27)
also passes.

### WR-02: copy_kit overstates atomicity — concurrent readers can hit a missing-kit window

**Files modified:** `install/install.sh`, `install/install.mjs`
**Commit:** `f40856e`
**Severity note:** Logic change to the kit-swap ordering — flagged here as worth a human glance,
though it is covered by the two-root idempotency + parity harness checks.

**Applied fix:** Adopted review option (b) — full atomicity — in both installers, keeping them
byte-parity-equivalent. New sequence: build the new kit in a temp dir, move any existing kit
aside (`$KIT_ROOT.old.$$` / `${KIT_ROOT}.old.${pid}`), put the new kit in place via a single
atomic rename, then remove the old copy. This eliminates the window between `rm -rf $KIT_ROOT`
and the rename during which `$KIT_ROOT` was absent (and a concurrent `/grugops` reader would
resolve "kit not found" and stop). The misleading "never sees a partial kit" comment was replaced
with an accurate description.

**Verification:** `install.two-root.test.sh` idempotency checks (lines 17/18 — zero diff in
`$TARGET` and `$GRUGOPS_HOME` on re-install) and the sh/Node parity check (line 43) pass.

### WR-03: fragile `set -e` cleanup idiom — `[ -f "$_tmp" ] && rm -f` one line from breaking

**Files modified:** `install/install.sh`, `install/uninstall.sh`
**Commit:** `b8fb9cd`
**Applied fix:** Made both cleanup lines self-neutralizing —
`[ -f "$_tmp" ] && rm -f -- "$_tmp" || true` — so the compound's exit status is always 0 and can
never abort the script under `set -e`, regardless of whether a trailing `report` line follows.
Applied at `materialize_adapter` (install.sh) and `remove_sentinel_block` (uninstall.sh).

**Verification:** sh syntax OK on both files; all three harnesses remain green.

### WR-04: config seed source is duplicated and documented at the wrong path (single-source drift)

**Files modified:** `agent-factory/README.md`, `agent-factory/config/factory.config.md`
**Commit:** `33f63ee`
**Judgment applied (per fix guidance + decisions D-01/D-02):** The reviewer's duplicate-seed
concern is INTENTIONAL — D-01/D-02 deliberately bundle
`agent-factory/seed/.grugops/factory.config.json` as a byte-identical seed copy that travels with
the kit (self-contained). The seed copy was therefore NOT deleted. I confirmed the two files are
currently byte-identical (`cmp -s` → identical) and that the installer truly seeds from
`agent-factory/seed/.grugops/factory.config.json` (walking `$KIT_ROOT/seed/**`).

The genuine defect was PROSE drift: two docs named
`agent-factory/config/factory.config.json` as "the seed source," which is not what the installer
seeds. Fixed only the documentation:
- `agent-factory/README.md:58` now names `agent-factory/seed/.grugops/factory.config.json` as the
  seed source (installer walks `seed/**`; D-01/D-02), and describes `config/factory.config.json`
  as the byte-identical field-reference companion.
- `agent-factory/config/factory.config.md:3` updated identically.

**Verification:** `check-kit-refs.sh` exits 0 (the seed/ subtree is intentionally out of the
kit-resolution gate per D-03, so the doc paths do not regress the gate); both install harnesses
remain green.

## Skipped Issues

None — all six in-scope findings were fixed.

(Out of scope, not attempted: IN-01 trailing-CR hardening in the VERSION read, and IN-02 seed
board WIP-limit reference path. Both are Info-tier and `fix_scope` is `critical_warning`.)

## Mandatory Verification Results

Run inside the isolated worktree after the final fix:

| Harness | Exit | Result |
|---------|------|--------|
| `sh install/install.test.sh` | 0 | ALL CHECKS PASSED |
| `sh install/install.two-root.test.sh` | 0 | ALL CHECKS PASSED (all 18 checks, incl. sh/Node byte-parity check [12]/line 43) |
| `sh scripts/check-kit-refs.sh` | 0 | ALL CHECKS PASSED |

sh/Node byte-parity confirmed: the two-root harness's check "install.sh and install.mjs produce
identical target tree + marker bytes (same `$GRUGOPS_HOME`)" passes after all edits.

---

_Fixed: 2026-06-07_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
