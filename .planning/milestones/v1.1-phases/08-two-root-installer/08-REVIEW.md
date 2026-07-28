---
phase: 08-two-root-installer
reviewed: 2026-06-07T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - install/install.sh
  - install/install.mjs
  - install/uninstall.sh
  - install/install.test.sh
  - install/install.two-root.test.sh
  - install/README.md
  - scripts/check-kit-refs.sh
  - agent-factory/packaging/subagent.frontmatter.md
  - agent-factory/packaging/slash-command.template.md
  - agent-factory/config/factory.config.md
  - agent-factory/README.md
  - agent-factory/seed/.grugops/factory.config.json
  - agent-factory/seed/plans/board.md
  - agent-factory/seed/plans/traceability.md
  - agent-factory/seed/plans/metrics.md
  - agent-factory/seed/plans/nfr-catalog.md
  - agent-factory/seed/memory-bank/00-index.md
  - agent-factory/seed/memory-bank/30-architecture.md
  - .claude/skills/grugops/SKILL.md
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-06-07
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Reviewed the two-root installer phase: the POSIX `install.sh` behavioral spec, its Node twin
`install.mjs`, `uninstall.sh`, the two behavioral test harnesses, the kit-ref build gate, the
install README, the packaging templates, and the seed state plane.

Both test harnesses (`install.test.sh`, `install.two-root.test.sh`) and the kit-ref gate pass
green, and sh/Node byte-parity holds across the tree for the cases the tests exercise (verified
by running all three). The materialization strip-then-inject is genuinely content-idempotent
(re-installing with a different `$GRUGOPS_HOME` correctly replaces the KIT line without
stacking), paths with spaces are handled, and the self-checkout guard works.

However, adversarial probing surfaced **two BLOCKERs that the existing tests do not cover**, both
direct violations of the project's hard constraint "installers must NEVER overwrite or delete
user content":

1. **Sentinel-block removal swallows all user content after an unterminated open marker** — a
   genuine data-loss path in `uninstall.sh` against `CLAUDE.md` and the Copilot file, proven
   empirically.
2. **`uninstall.sh` silently ignores the `--target` flag that its own README documents** — the
   reversal runs against `$(pwd)` instead of the named target, proven empirically.

The remaining findings are parity/robustness/maintainability concerns: an awk escape-sequence
parity break on paths containing backslashes, an overstated atomicity claim in `copy_kit`, a
fragile `set -e` cleanup idiom, and a documented-vs-actual config seed-source drift that
contradicts the single-source constraint.

No structural findings block was provided.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: uninstall sentinel removal deletes ALL user content after an unterminated open marker

**File:** `install/uninstall.sh:131-137` (awk in `remove_sentinel_block`); also the
strip logic in `install/install.sh:343-354` (`materialize_adapter`) and
`install/install.mjs:337-345` (`materializeAdapter`).

**Issue:** The block-stripping awk sets `inblk=1` on the open sentinel and only clears it on the
matching close sentinel. If the close sentinel is **absent** (file hand-edited, an interrupted
prior run, or the user appended content and removed/altered the close line), every line from the
open marker to end-of-file is discarded. This is run against **user-owned files** (`CLAUDE.md`
and `.github/copilot-instructions.md`), so it is a real data-loss path that violates the hard
constraint "never overwrite or delete user content" and the "reversible — removes exactly what
this added (and only that)" promise.

Proven empirically. A `CLAUDE.md` containing an open sentinel with no close, followed by genuine
user lines, was reduced to just its header after `uninstall.sh` ran — the user content after the
open marker was silently deleted. The identical loss was reproduced on
`.github/copilot-instructions.md`.

**Fix:** Bound the removal to a properly terminated block. Buffer the block and only commit the
deletion if a close marker is actually found; if `inblk` is still set at `END`, the block was
unterminated — emit the buffered lines unchanged (remove nothing) rather than dropping them:

```sh
awk -v op="$_open" -v cl="$_close" '
  BEGIN { inblk=0; pend=0 }
  $0 == op { inblk=1; buf=""; nbuf=0; next }
  inblk {
    if ($0 == cl) { inblk=0; next }       # terminated block → drop the buffer
    buf = buf $0 "\n"; nbuf++; next        # buffer until we know it terminates
  }
  $0 == "" { pend=pend+1; next }
  { while (pend>0) { print ""; pend=pend-1 } print }
  END {
    # Unterminated open at EOF: the block never closed → restore what we buffered (lose nothing).
    if (inblk && nbuf>0) printf "%s", buf
  }
' "$_f" > "$_tmp"
```

Apply the same termination guard to the materialize strip in both `install.sh` and `install.mjs`
(those operate on grugops-owned regenerated adapters so the blast radius is smaller, but the
defect is identical and should not be left to rot).

### CR-02: uninstall.sh ignores the documented `--target` flag and operates on the wrong directory

**File:** `install/uninstall.sh:30-35` (no top-level argument parsing);
documented at `install/README.md:122-125`.

**Issue:** `uninstall.sh` has **no argument-parsing loop**. The only `case "$1"` in the file is
inside `is_protected()`. `TARGET` is resolved purely from the env, defaulting to `$(pwd)` (line
34). But `install/README.md` documents `sh install/uninstall.sh --target /path/to/repo` and
`DRY_RUN=1 sh install/uninstall.sh --target /path/to/repo`. A user following the README passes
`--target <repo>`, which is silently discarded, and the reversal runs against the **current
working directory** instead of the named target.

Proven empirically: invoking `uninstall.sh --target <repoA>` from an unrelated CWD printed
`target: <CWD>` and operated there, never touching `<repoA>`. Consequences: the intended target
is left fully installed (silent no-op for the user's stated goal), and a different repo (whatever
the CWD is) has its grugops wiring stripped instead — including its `CLAUDE.md`/Copilot sentinel
edits. `install.sh` parses `--target` correctly; `uninstall.sh` is the asymmetric, broken half of
a documented reversible pair.

**Fix:** Add the same `--target` / `--target=` parsing loop `install.sh` uses (lines 49-58),
resolved to an absolute path before any removal, so uninstall honors the surface its own README
advertises:

```sh
ARG_TARGET=""
while [ $# -gt 0 ]; do
  case "$1" in
    --target) ARG_TARGET=${2:-}; shift 2 ;;
    --target=*) ARG_TARGET=${1#--target=}; shift ;;
    *) printf 'uninstall.sh: unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done
TARGET=${ARG_TARGET:-${TARGET:-$(pwd)}}
# (resolve to absolute as install.sh does)
```

Also add the matching loop to `install.mjs`'s uninstall path if/when one exists, and ensure
`DRY_RUN=1 ... --target` previews the correct directory.

## Warnings

### WR-01: awk `-v` mangles paths containing backslash escape sequences — sh/Node parity break

**File:** `install/install.sh:343-355` (`awk -v kit="$KIT_ROOT"`) vs
`install/install.mjs:349` (`KIT="${KIT_ROOT}"`).

**Issue:** `awk -v kit=VALUE` processes C escape sequences in VALUE. A kit path containing a
backslash followed by an escape char (`\t`, `\n`, `\\`, etc.) is silently transformed — `\t`
becomes a literal TAB — so the materialized `KIT="..."` line is corrupted and points at a
nonexistent path. The Node side uses a template literal over `process.env`/the resolved string
and preserves backslashes verbatim, so the two installers emit **different bytes** for such a
path, violating the byte-parity constraint, and the sh side additionally produces a broken
resolver line. (Likelihood is low on Unix and further reduced because `install.mjs` normalizes to
forward slashes via `toPosix`, but `install.sh` has no such normalization and the kit is
explicitly cross-platform.)

Verified: `awk -v kit='/a\tb'` emitted a literal tab; `node` emitted the literal `\t`.

**Fix:** Avoid `awk -v` for the path value. Pass it via the environment and read it with awk's
`ENVIRON[]`, which does not process escapes:

```sh
KIT_ROOT="$KIT_ROOT" awk -v op="$MAT_OPEN" -v cl="$MAT_CLOSE" -v slot="$MAT_SLOT" '
  ...
  $0 == slot { print op; printf "KIT=\"%s\"\n", ENVIRON["KIT_ROOT"]; print cl; print; next }
  ...' "$_src" > "$_tmp"
```

### WR-02: copy_kit overstates atomicity — concurrent readers can hit a missing-kit window

**File:** `install/install.sh:302-314` and `install/install.mjs:302-314`.

**Issue:** The comment claims "Writes to a temp then renames so a concurrent reader never sees a
partial kit." The actual sequence is `cp -R` to a temp, then `rm -rf "$KIT_ROOT"`, then
`mv tmp KIT_ROOT` (sh) / `rmSync(KIT_ROOT)` then `renameSync(tmp, KIT_ROOT)` (Node). Between the
`rm -rf` and the rename there is a window where `$KIT_ROOT` does **not exist at all**. A
concurrent `/grugops` invocation in another repo reading the shared kit during that window
resolves "kit not found" and STOPs (per the resolver self-heal). The rename itself is atomic
(same filesystem under `$GRUGOPS_HOME`), but the destructive pre-step is not, so the
"never sees a partial kit" guarantee is false — it can see an absent kit.

The data is regenerable and the self-heal degrades gracefully, so this is not data loss; but the
comment is misleading and an unlucky concurrent reader gets a spurious failure.

**Fix:** Either (a) downgrade the comment to state the truthful guarantee ("the new kit appears
via a single atomic rename; there is a brief window during replacement where the kit is absent,
during which a concurrent reader self-heals/stops"), or (b) make the swap fully atomic — rename
the existing kit aside first and remove it after the new one is in place:

```sh
cp -R -- "$GRUGOPS_SRC/agent-factory" "$_tmp"
[ -e "$KIT_ROOT" ] && mv -- "$KIT_ROOT" "$KIT_ROOT.old.$$"
mv -- "$_tmp" "$KIT_ROOT"
rm -rf -- "$KIT_ROOT.old.$$" 2>/dev/null || true
```

### WR-03: fragile `set -e` cleanup idiom — `[ -f "$_tmp" ] && rm -f` one line from breaking

**File:** `install/install.sh:357` and `install/uninstall.sh:140`.

**Issue:** Both use `[ -f "$_tmp" ] && rm -f -- "$_tmp"` immediately after a `mv` that consumes
`$_tmp`. After the `mv`, `[ -f "$_tmp" ]` is false, so the `&&` compound returns exit status 1.
Under `set -e`, if this line were ever the **last** statement of its function it would abort the
script (verified: a function ending in this idiom returns 1 and aborts under `set -e`). It is
currently safe only because a `report ...` line follows it; the safety is incidental and a future
edit that reorders or removes the trailing `report` would silently reintroduce a `set -e` abort.

**Fix:** Make the line self-neutralizing so its exit status is always 0:

```sh
[ -f "$_tmp" ] && rm -f -- "$_tmp" || true
```

(or `rm -f -- "$_tmp" 2>/dev/null || true`, since `rm -f` on an absent file is already a no-op).

### WR-04: config seed source is duplicated and documented at the wrong path (single-source drift)

**File:** `agent-factory/README.md:58` and `agent-factory/config/factory.config.md:3` (docs) vs
`agent-factory/seed/.grugops/factory.config.json` (what the installer actually seeds, per
`install/install.sh:374-382` walking `$KIT_ROOT/seed/**`).

**Issue:** The docs state the installer seeds the lean default from
`agent-factory/config/factory.config.json`. The installer in fact seeds from
`agent-factory/seed/.grugops/factory.config.json`. Both files exist and are currently
byte-identical, but they are two independently-maintained copies with no sync mechanism. A future
edit to the documented `config/` file (e.g. changing a WIP limit or default) would not propagate
to what users actually receive, producing silent doc-vs-shipped drift. This contradicts the
CLAUDE.md constraints "Single-source: Role text lives once... avoid drift" and "Zero-config first:
every role must honor `factory.config.json`."

**Fix:** Pick one canonical source. Either (a) make the installer seed config directly from
`agent-factory/config/factory.config.json` (and drop the duplicate under `seed/.grugops/`), or
(b) update the two docs to name `agent-factory/seed/.grugops/factory.config.json` as the actual
seed source and add a build-gate assertion (extend `scripts/check-kit-refs.sh`) that the two
copies are byte-identical so drift fails loudly rather than shipping silently.

## Info

### IN-01: VERSION read embeds a stray CR into the marker if the kit ships with CRLF line endings

**File:** `install/install.sh:405-407` (`head -n 1 -- VERSION`) and
`install/install.mjs:416-418` (`readFileSync(...).split("\n")[0]`).

**Issue:** If `agent-factory/VERSION` is checked out with CRLF endings (Windows `autocrlf`), both
`head -n 1` and `split("\n")[0]` retain the trailing `\r`, embedding `0.1.0\r` into the marker's
`kitVersion`. The two installers stay consistent with each other (so byte-parity is not broken),
and the committed VERSION is LF, so impact is low. Worth hardening since the kit is explicitly
cross-platform.

**Fix:** Strip trailing CR after reading: sh `_ver=$(head -n 1 -- "$f" | tr -d '\r')`; Node
`ver = readFileSync(f, "utf8").split(/\r?\n/)[0]`.

### IN-02: seed board references `agent-factory/config/factory.config.json#wip_limits`

**File:** `agent-factory/seed/plans/board.md:13,58,74`.

**Issue:** The seeded board points users at `agent-factory/config/factory.config.json#wip_limits`
for the WIP-limit source, but the per-repo dial the installer seeds and the Orchestrator reads is
`.grugops/factory.config.json` (the kit's `config/` copy is the seed source, not the runtime
file). This is correctly excluded from `check-kit-refs.sh` (the seed/ subtree is intentionally
out of the kit-resolution gate, D-03), so it does not fail the gate, but it points a user editing
their board at the wrong (kit-internal) path rather than their own `.grugops/factory.config.json`.

**Fix:** Update the seed board's three references to name `.grugops/factory.config.json#wip_limits`
(the per-repo runtime dial) so a user following the board edits the file that actually drives
their factory.

---

_Reviewed: 2026-06-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
