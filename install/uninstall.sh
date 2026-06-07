#!/usr/bin/env sh
# uninstall.sh — grugops reversal (INSTALL-02). The exact inverse of install/install.sh.
#
# Removes ONLY what install.sh added:
#   - .claude/skills/grugops*/SKILL.md  (and the now-empty grugops* skill dirs)
#   - .claude/agents/grugops-orchestrator.md
#   - the AGENTS.md grugops laid down  (ONLY if it is a symlink into the grugops source, or a
#     copy byte-identical to the source — a user's own AGENTS.md is never removed)
#   - the CLAUDE.md "GSD:grugops-start-here" sentinel block (only that block; the rest of the
#     user's CLAUDE.md is preserved verbatim)
#   - the .gemini/settings.json context.fileName entry it added  (AGENTS.md removed from the
#     array; the file and any other keys are preserved; the file is deleted only if grugops
#     created it and it is now back to its empty-default shape)
#   - the .github/copilot-instructions.md sentinel block (only that block)
#   - the .grugops/install.json marker (the one grugops-owned file under .grugops/ — D-06)
#
# It NEVER deletes agent-factory/, plans/, .planning/, docs/, src/, the seeded per-repo state
# (.grugops/factory.config.json, plans/, memory-bank/), the shared kit at $GRUGOPS_HOME, or any
# user file. Those paths are guarded explicitly; only the install.json marker is removed from
# under the otherwise-protected .grugops/, via a narrow named exception. Removing the shared
# $GRUGOPS_HOME kit is a manual `rm` (no --purge-kit flag this phase). Honors DRY_RUN=1.
#
# House style matches install.sh: #!/usr/bin/env sh, set -eu, printf not echo -e, small helpers.
#
# Usage:
#   sh install/uninstall.sh                 # remove grugops adapters from the current repo
#   DRY_RUN=1 sh install/uninstall.sh       # preview only
#   GRUGOPS_SRC=/path TARGET=/path sh install/uninstall.sh

set -eu

# ---------------------------------------------------------------------------
# Argument parsing (CR-02). Mirrors install.sh's loop so uninstall honors the surface its own
# README advertises (`sh install/uninstall.sh --target /path/to/repo`). Without this loop the
# documented --target flag was silently discarded and the reversal ran against $(pwd) — wiping
# grugops wiring from the WRONG repo while leaving the intended target fully installed.
#   --target <repo> / --target=<repo>   the repo to reverse (precedence: flag > TARGET env > CWD)
# Scope is unchanged (D-06): still removes only adapters + wiring + the .grugops/install.json
# marker; never the shared $GRUGOPS_HOME kit nor seeded per-repo state.
# ---------------------------------------------------------------------------
ARG_TARGET=""
while [ $# -gt 0 ]; do
  case "$1" in
    --target) ARG_TARGET=${2:-}; shift 2 ;;
    --target=*) ARG_TARGET=${1#--target=}; shift ;;
    *) printf 'uninstall.sh: unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
GRUGOPS_SRC=${GRUGOPS_SRC:-$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)}
DRY_RUN=${DRY_RUN:-0}

# abspath: resolve a (possibly not-yet-existing) path to an absolute, normalized one without
# requiring the leaf to exist (mirrors install.sh — Security V5: validate to absolute before use).
abspath() {
  case "$1" in
    /*) printf '%s' "$1" ;;
    *)  printf '%s' "$(CDPATH= cd -- "$(pwd)" && pwd)/$1" ;;
  esac
}

# Precedence: --target flag > TARGET env > current working directory. Resolved to an ABSOLUTE
# path before any removal so the reversal operates on the named target, not the CWD.
TARGET=${ARG_TARGET:-${TARGET:-$(pwd)}}
TARGET=$(abspath "$TARGET")

SKILLS="grugops grugops-map grugops-plan grugops-ticket grugops-gate grugops-uat grugops-release"
AGENT_REL=".claude/agents/grugops-orchestrator.md"
CLAUDE_OPEN='<!-- GSD:grugops-start-here -->'
CLAUDE_CLOSE='<!-- GSD:grugops-start-here-end -->'
COPILOT_REL=".github/copilot-instructions.md"
# WR-05: the Copilot block has its OWN distinct sentinel (must match install.sh exactly). The
# CLAUDE.md and Copilot blocks are removed by their own markers, so a future change to one
# sentinel cannot silently stop the other from being removed.
COPILOT_OPEN='<!-- GSD:grugops-copilot-start-here -->'
COPILOT_CLOSE='<!-- GSD:grugops-copilot-start-here-end -->'

report() { printf '  %-14s %s\n' "$1" "$2"; }

do_run() {
  [ "$DRY_RUN" = "1" ] && return 0
  "$@"
}

# SAFETY GUARD: refuse to ever operate on a frozen-core or user-data path. Every removal
# target is checked against this denylist before it is touched. agent-factory/, plans/,
# .planning/, docs/, src/ — and the repo root itself — are off-limits, always.
#
# Two-root (D-06): .grugops/ is now PROTECTED too. Once the installer seeds per-repo state
# (.grugops/factory.config.json) it becomes the user's content and survives uninstall. The ONE
# grugops-owned file under .grugops/ — the install.json marker — is removed via a dedicated,
# explicitly-named exception below (NOT through this generic guard). The shared kit at
# $GRUGOPS_HOME is never named in any removal path: it is shared across repos, and removing it
# is a manual `rm` (no --purge-kit this phase).
is_protected() {
  case "$1" in
    "$TARGET"/agent-factory/*|"$TARGET"/agent-factory \
    |"$TARGET"/plans/*|"$TARGET"/plans \
    |"$TARGET"/.planning/*|"$TARGET"/.planning \
    |"$TARGET"/.grugops/*|"$TARGET"/.grugops \
    |"$TARGET"/docs/*|"$TARGET"/docs \
    |"$TARGET"/src/*|"$TARGET"/src \
    |"$TARGET"|"$TARGET"/) return 0 ;;
    *) return 1 ;;
  esac
}

# remove_file: delete a single file if present, after the protection guard. Never recursive.
remove_file() {
  _f=$1; _label=$2
  if is_protected "$_f"; then
    report "refused" "$_label (protected path — never removed)"
    return 0
  fi
  if [ ! -e "$_f" ] && [ ! -L "$_f" ]; then
    report skipped "$_label (not present)"
    return 0
  fi
  if [ "$DRY_RUN" = "1" ]; then
    report "would-remove" "$_label"
    return 0
  fi
  do_run rm -f -- "$_f"
  report removed "$_label"
}

# rmdir_if_empty: remove a now-empty grugops-owned dir (never recursive, never -f a tree).
rmdir_if_empty() {
  _d=$1
  is_protected "$_d" && return 0
  [ -d "$_d" ] || return 0
  if [ "$DRY_RUN" = "1" ]; then
    # would only remove if empty; rmdir fails on non-empty, so just narrate the attempt
    rmdir "$_d" 2>/dev/null && report "would-rmdir" "$_d" || true
    return 0
  fi
  rmdir "$_d" 2>/dev/null && report rmdir "$_d" || true
}

# remove_sentinel_block: strip exactly the open..close sentinel block from a user file,
# preserving every other line. Idempotent (no block → no-op). Never truncates the whole file.
remove_sentinel_block() {
  _f=$1; _open=$2; _close=$3; _label=$4
  if is_protected "$_f"; then
    report "refused" "$_label (protected path)"
    return 0
  fi
  if [ ! -f "$_f" ] || ! grep -qF -- "$_open" "$_f" 2>/dev/null; then
    report skipped "$_label (no grugops block present)"
    return 0
  fi
  if [ "$DRY_RUN" = "1" ]; then
    report "would-remove" "$_label (sentinel block only)"
    return 0
  fi
  # Drop the open..close block. The variable names 'open'/'close' are reserved in some awks
  # (BSD/macOS), so use neutral names. install.sh prepends one blank line before the block;
  # we buffer pending blank lines and emit them only when a real line follows, which trims
  # that separator blank when the block is at end-of-file.
  #
  # CR-01 (bounded removal): an UNTERMINATED open marker (close sentinel missing because the
  # file was hand-edited or a prior run was interrupted) must NEVER cause every line after the
  # open marker to be deleted — that is silent loss of user content. We buffer the block lines
  # and only commit the deletion when a matching close is actually seen; if inblk is still set
  # at END, the block never closed, so we emit the buffered lines unchanged (remove nothing).
  _tmp="$_f.grugops.tmp.$$"
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
  do_run mv -- "$_tmp" "$_f"
  # WR-03: self-neutralize the cleanup so its exit status is always 0. After the mv consumes
  # $_tmp, `[ -f "$_tmp" ]` is false and the bare `&&` compound returns 1 — which would abort the
  # script under `set -e` if this were ever the last statement of the function. The trailing
  # `|| true` makes the safety explicit instead of incidental on the following report line.
  [ -f "$_tmp" ] && rm -f -- "$_tmp" || true
  report removed "$_label (sentinel block only; rest of file preserved)"
}

# remove_if_empty: delete a file grugops created if it is now empty / whitespace-only after its
# sentinel block was stripped. Used for the optional Copilot pointer (when grugops created the
# file fresh, removing the block leaves it empty → fully reverse it). Guarded; never recursive.
remove_if_empty() {
  _f=$1; _label=$2
  is_protected "$_f" && return 0
  [ -f "$_f" ] || return 0
  # whitespace-only (or zero-byte) → remove
  if [ -z "$(tr -d ' \t\n\r' < "$_f" 2>/dev/null)" ]; then
    if [ "$DRY_RUN" = "1" ]; then
      report "would-remove" "$_label (empty after block removal)"
      return 0
    fi
    do_run rm -f -- "$_f"
    report removed "$_label (file empty after block removal — grugops-created)"
  fi
}

# unmerge_gemini: remove AGENTS.md from .gemini/settings.json context.fileName. Uses Node when
# available for a safe JSON edit; otherwise leaves the file and flags verify (never blind-edits
# JSON in pure sh). If grugops created the file and it returns to the empty-default shape, the
# file is removed; otherwise other keys are preserved.
unmerge_gemini() {
  _f="$TARGET/.gemini/settings.json"
  if is_protected "$_f"; then return 0; fi
  if [ ! -f "$_f" ]; then
    report skipped ".gemini/settings.json (not present)"
    return 0
  fi
  if ! grep -qF 'AGENTS.md' "$_f" 2>/dev/null; then
    report skipped ".gemini/settings.json (no AGENTS.md entry to remove)"
    return 0
  fi
  if [ "$DRY_RUN" = "1" ]; then
    report "would-edit" ".gemini/settings.json (remove AGENTS.md from context.fileName)"
    return 0
  fi
  if command -v node >/dev/null 2>&1; then
    GEMINI_FILE="$_f" do_run node -e '
      const fs = require("node:fs");
      const f = process.env.GEMINI_FILE;
      let j;
      try { j = JSON.parse(fs.readFileSync(f, "utf8")); }
      catch { process.stderr.write("verify: settings.json not valid JSON; left untouched\n"); process.exit(0); }
      // If the file is EXACTLY the grugops-created default shape (only context.fileName, and
      // it lists just AGENTS.md and/or GEMINI.md and nothing else), grugops owns the whole
      // file → remove it entirely to fully reverse the "created fresh" install path.
      const keys = Object.keys(j);
      const ctxKeys = j.context ? Object.keys(j.context) : [];
      const fn = (j.context && Array.isArray(j.context.fileName)) ? j.context.fileName : null;
      const onlyGrugopsEntries = fn && fn.every((x) => x === "AGENTS.md" || x === "GEMINI.md");
      const isGrugopsDefault =
        keys.length === 1 && keys[0] === "context" &&
        ctxKeys.length === 1 && ctxKeys[0] === "fileName" && onlyGrugopsEntries;
      if (isGrugopsDefault) {
        fs.unlinkSync(f);
        process.stdout.write("removed (grugops-created default settings.json)\n");
      } else {
        // Pre-existing / user-customised file: trim only AGENTS.md, preserve everything else.
        const ctx = j.context || {};
        let list = Array.isArray(ctx.fileName) ? ctx.fileName : [];
        list = list.filter((x) => x !== "AGENTS.md");
        if (list.length === 0) { delete ctx.fileName; } else { ctx.fileName = list; }
        if (Object.keys(ctx).length === 0) delete j.context;
        if (Object.keys(j).length === 0) {
          fs.unlinkSync(f);
          process.stdout.write("removed (file empty after unmerge)\n");
        } else {
          fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
          process.stdout.write("trimmed AGENTS.md from context.fileName (other keys preserved)\n");
        }
      }
    '
    report removed ".gemini/settings.json AGENTS.md entry (Node JSON edit; grugops-created file removed if now empty)"
  else
    report "verify" ".gemini/settings.json — remove \"AGENTS.md\" from context.fileName manually (Node not found for a safe JSON edit)"
  fi
}

# remove_marker: remove ONLY the grugops-owned install marker .grugops/install.json (D-06). This
# is the single narrow exception to the .grugops/ protection just added to is_protected: the
# marker is the one grugops-owned file under .grugops/, while everything ELSE there
# (factory.config.json and anything the user adds) is seeded user state that must survive. So we
# do NOT route this through remove_file (which would — correctly — refuse a protected .grugops/
# path); we remove this exact file by name, mirroring the "grugops-owned only" AGENTS.md shape.
#
# Never remove $GRUGOPS_HOME — the shared kit is depended on by other repos; removing it is a
# manual `rm` only (no --purge-kit this phase). Never remove .grugops/factory.config.json,
# plans/, or memory-bank/ — those are seeded user state. This touches exactly one named file.
remove_marker() {
  _m="$TARGET/.grugops/install.json"
  if [ ! -e "$_m" ]; then
    report skipped ".grugops/install.json (marker not present)"
    return 0
  fi
  if [ "$DRY_RUN" = "1" ]; then
    report "would-remove" ".grugops/install.json (grugops-owned marker)"
    return 0
  fi
  do_run rm -f -- "$_m"
  report removed ".grugops/install.json (grugops-owned marker; seeded .grugops/ state preserved)"
}

printf '== grugops uninstall ==\n'
printf 'target: %s\n' "$TARGET"
[ "$DRY_RUN" = "1" ] && printf 'mode:   DRY_RUN (no filesystem changes)\n'
printf '\n-- removing grugops adapters (only what install.sh added) --\n'

# 1. Skills + empty dirs.
for s in $SKILLS; do
  remove_file "$TARGET/.claude/skills/$s/SKILL.md" ".claude/skills/$s/SKILL.md"
  rmdir_if_empty "$TARGET/.claude/skills/$s"
done
rmdir_if_empty "$TARGET/.claude/skills"

# 2. Orchestrator wrapper + empty dir.
remove_file "$TARGET/$AGENT_REL" "$AGENT_REL"
rmdir_if_empty "$TARGET/.claude/agents"
rmdir_if_empty "$TARGET/.claude"

# 3. AGENTS.md — remove ONLY a grugops-laid-down one (symlink into source, or byte-identical
#    copy of the source AGENTS.md). A user's own AGENTS.md is never removed.
_agents="$TARGET/AGENTS.md"
if is_protected "$_agents"; then
  : # never
elif [ -L "$_agents" ]; then
  # A symlink is removed ONLY if it resolves to the grugops source AGENTS.md. `cmp -s` follows
  # the symlink, so comparing the link against the source compares resolved content — exactly
  # the byte-identical test used for the copy branch below. A user's own AGENTS.md symlink (e.g.
  # AGENTS.md -> docs/agents.md, a common monorepo pattern) resolves to other content, fails the
  # compare, and is left untouched. Reject any symlink that does not resolve to the source.
  if [ -f "$GRUGOPS_SRC/AGENTS.md" ] && cmp -s -- "$_agents" "$GRUGOPS_SRC/AGENTS.md" 2>/dev/null; then
    remove_file "$_agents" "AGENTS.md (grugops symlink into source)"
  else
    report skipped "AGENTS.md (user-owned symlink — left untouched)"
  fi
elif [ -f "$_agents" ] && [ -f "$GRUGOPS_SRC/AGENTS.md" ] && cmp -s -- "$GRUGOPS_SRC/AGENTS.md" "$_agents" 2>/dev/null; then
  remove_file "$_agents" "AGENTS.md (grugops copy, byte-identical to source)"
else
  report skipped "AGENTS.md (user-owned or modified — left untouched)"
fi

# 4. CLAUDE.md sentinel block (preserve the rest of the user's file).
remove_sentinel_block "$TARGET/CLAUDE.md" "$CLAUDE_OPEN" "$CLAUDE_CLOSE" "CLAUDE.md start-here pointer"

# 5. Gemini settings entry.
unmerge_gemini
rmdir_if_empty "$TARGET/.gemini"

# 6. Copilot pointer block (and remove the file if grugops created it and it is now empty). Uses
#    the Copilot-specific sentinel (WR-05), not the CLAUDE.md one.
remove_sentinel_block "$TARGET/$COPILOT_REL" "$COPILOT_OPEN" "$COPILOT_CLOSE" "$COPILOT_REL pointer"
remove_if_empty "$TARGET/$COPILOT_REL" "$COPILOT_REL"
rmdir_if_empty "$TARGET/.github"

# 7. The grugops-owned install marker (D-06). Removes ONLY .grugops/install.json via the narrow
#    named exception; the rest of .grugops/ (seeded user state) is protected and survives. The
#    .grugops/ dir is intentionally NOT rmdir'd — the seeded factory.config.json keeps it
#    populated, and even an empty .grugops/ is the user's state dir, not grugops' to remove.
#    Never remove $GRUGOPS_HOME — the shared kit is shared across repos; manual rm only.
remove_marker

printf '\n-- preserved (never touched) --\n'
printf '  agent-factory/  plans/  .planning/  docs/  src/  .grugops/ (seeded state; only the\n'
printf '  install.json marker is removed)  the shared kit at $GRUGOPS_HOME  and every user file.\n'
printf '\n== uninstall complete%s ==\n' "$([ "$DRY_RUN" = "1" ] && printf ' (DRY_RUN — nothing changed)')"
