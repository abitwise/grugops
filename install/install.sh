#!/usr/bin/env sh
# install.sh — grugops POSIX installer (INSTALL-01).
#
# Lays the grugops per-tool adapters onto a host repo: thin standalone Claude skills,
# the Orchestrator subagent wrapper, a CLAUDE.md "start here" pointer, and the Gemini
# context.fileName wiring. It is:
#   - additive    — never overwrites or deletes user content; appends via unique sentinels
#   - idempotent  — running twice produces ZERO diff
#   - DRY_RUN=1   — prints the plan and changes NOTHING on the filesystem
#   - reversible  — install/uninstall.sh removes exactly what this added (and only that)
#
# It NEVER touches agent-factory/, plans/, .planning/, docs/, or any user file beyond the
# additive sentinel append to CLAUDE.md / read-modify-write of .gemini/settings.json. It
# NEVER sets the production deploy-approval env var — only a human may approve a deploy.
#
# install.mjs (Node) is functionally identical; this file is its behavioral spec.
#
# Usage:
#   sh install/install.sh --target /path/to/repo   # install into a chosen repo
#   sh install/install.sh                           # prompt (default: current repo)
#   sh install/install.sh --yes                     # unattended (default target, no prompt)
#   DRY_RUN=1 sh install/install.sh                 # preview only, change nothing
#   INSTALL_MODE=symlink sh install/install.sh      # opt in to symlink (copy is the default, D-05)
#   sh install/install.sh --symlink                 # same opt-in via flag
#   sh install/install.sh --allow-self              # override the D-07 self-checkout guard
#   GRUGOPS_HOME=/path sh install/install.sh        # override the shared kit home (default ~/.grugops)
#   GRUGOPS_SRC=/path/to/grugops TARGET=/path/to/repo sh install/install.sh
#
# Two-root layout (INSTALL-03/04): the read-only kit is copied to ${GRUGOPS_HOME:-$HOME/.grugops}
# and the resolved absolute kit path is materialized into the target's two resolver adapters; the
# per-repo state plane (.grugops/ + plans/ + memory-bank/) is seeded into the target (skip-if-exists).
#
# House style mirrors agent-factory/ scripts: #!/usr/bin/env sh, set -eu, printf not echo -e,
# grep -qF, small named helpers.

set -eu

# ---------------------------------------------------------------------------
# Argument parsing (INSTALL-03). Layers over the TARGET/INSTALL_MODE env overrides.
#   --target <repo>   the repo to install into (precedence: flag > TARGET env > prompt)
#   --yes             unattended: take the default target without prompting (CI-safe)
#   --allow-self      override the D-07 self-checkout guard
#   --force           alias for --allow-self
#   --symlink         opt in to symlink mode (copy is now the default, D-05)
# ---------------------------------------------------------------------------
ARG_TARGET=""
YES=0
ALLOW_SELF=0
while [ $# -gt 0 ]; do
  case "$1" in
    --target) ARG_TARGET=${2:-}; shift 2 ;;
    --target=*) ARG_TARGET=${1#--target=}; shift ;;
    --yes|-y) YES=1; shift ;;
    --allow-self|--force) ALLOW_SELF=1; shift ;;
    --symlink) INSTALL_MODE=symlink; shift ;;
    *) printf 'install.sh: unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

# ---------------------------------------------------------------------------
# Resolve the grugops source checkout (where the adapter files live), the shared kit
# home, and the target repo. All default sensibly; all overridable.
# ---------------------------------------------------------------------------
# SRC defaults to the repo that contains this script (install/ -> repo root).
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
GRUGOPS_SRC=${GRUGOPS_SRC:-$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)}
DRY_RUN=${DRY_RUN:-0}
# D-05: default to COPY (symlink is opt-in via --symlink / INSTALL_MODE=symlink). Copy is the
# only mode that behaves identically on every platform; symlinks broke the dogfood.
INSTALL_MODE=${INSTALL_MODE:-copy}

# abspath: resolve a (possibly not-yet-existing) path to an absolute, normalized one without
# requiring the leaf to exist — cd into the nearest existing parent and append the rest. Used so
# the materialized kit path is always absolute (Security V5: validate to absolute before use).
abspath() {
  case "$1" in
    /*) printf '%s' "$1" ;;
    *)  printf '%s' "$(CDPATH= cd -- "$(pwd)" && pwd)/$1" ;;
  esac
}

# resolve_grugops_home: compute the absolute shared kit home and kit root. The :- colon form
# treats an exported-blank GRUGOPS_HOME= (e.g. in CI) as unset, so it still falls back. Assigned
# BEFORE the run banner and BEFORE any code path references them (so set -eu never trips and no
# blank line is ever printed). install.mjs mirrors this with os.homedir().
resolve_grugops_home() {
  GRUGOPS_HOME=${GRUGOPS_HOME:-"$HOME/.grugops"}
  GRUGOPS_HOME=$(abspath "$GRUGOPS_HOME")
  KIT_ROOT="$GRUGOPS_HOME/agent-factory"
}
resolve_grugops_home

# ---------------------------------------------------------------------------
# Resolve TARGET (INSTALL-03). Precedence: --target flag > TARGET env > prompt(default CWD).
# Non-interactive (--yes OR not a TTY) takes the default WITHOUT prompting (CI-safe). The result
# is resolved to an ABSOLUTE path before any comparison or write (Security V5 — validate first,
# never glob/hunt). Done BEFORE the D-07 guard and before any write.
# ---------------------------------------------------------------------------
_default_target=${ARG_TARGET:-${TARGET:-$(pwd)}}
if [ -n "$ARG_TARGET" ]; then
  TARGET="$ARG_TARGET"
elif [ "$YES" = "1" ] || [ ! -t 0 ]; then
  TARGET="${TARGET:-$(pwd)}"
else
  printf 'Install grugops into which repo? [%s] ' "$_default_target"
  read -r _ans || _ans=""
  TARGET="${_ans:-$_default_target}"
fi
TARGET=$(abspath "$TARGET")

# ---------------------------------------------------------------------------
# D-07 self-checkout guard (ALWAYS-ON). Runs unconditionally after TARGET resolution, before any
# write, independent of TTY / --yes (Pitfall 3: safety is mechanical, not prose). Refuse when
# EITHER the resolved TARGET == resolved GRUGOPS_SRC, OR the target carries grugops SOURCE markers
# (install/install.sh AND agent-factory/VERSION both present). --allow-self / --force overrides.
# ---------------------------------------------------------------------------
if [ "$ALLOW_SELF" != "1" ]; then
  if [ "$TARGET" = "$GRUGOPS_SRC" ] || { [ -f "$TARGET/install/install.sh" ] && [ -f "$TARGET/agent-factory/VERSION" ]; }; then
    printf 'refusing: target looks like the grugops source checkout — you probably meant --target <your-repo>. Pass --allow-self to override.\n' >&2
    exit 1
  fi
fi

# The grugops adapter set this installer manages (single source: the standalone Wave-2 form).
SKILLS="grugops grugops-map grugops-plan grugops-ticket grugops-gate grugops-uat grugops-release"
AGENT_REL=".claude/agents/grugops-orchestrator.md"

# CLAUDE.md sentinel block (must match 05-02's GSD:grugops-start-here block exactly so a
# repo that already has it is left untouched, and uninstall removes precisely these markers).
CLAUDE_OPEN='<!-- GSD:grugops-start-here -->'
CLAUDE_PTR='**grugops — start here:** read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.'
CLAUDE_CLOSE='<!-- GSD:grugops-start-here-end -->'

# Copilot pointer (optional convenience; additive single line under a sentinel). WR-05: the
# Copilot block has its OWN distinct sentinel, never the CLAUDE.md one. uninstall.sh strips the
# Copilot block by these exact markers, so the two blocks are removed independently and a future
# change to one sentinel cannot silently break removal of the other.
COPILOT_REL=".github/copilot-instructions.md"
COPILOT_OPEN='<!-- GSD:grugops-copilot-start-here -->'
COPILOT_PTR='grugops: read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.'
COPILOT_CLOSE='<!-- GSD:grugops-copilot-start-here-end -->'

# ---------------------------------------------------------------------------
# Report accounting — every line is created / linked / copied(verify) / skipped.
# ---------------------------------------------------------------------------
report() { printf '  %-14s %s\n' "$1" "$2"; }

# do_run: execute a command unless DRY_RUN; in DRY_RUN, only narrate.
# Filesystem mutations MUST go through do_run so DRY_RUN=1 changes nothing.
do_run() {
  if [ "$DRY_RUN" = "1" ]; then
    return 0
  fi
  "$@"
}

# mkdirp: ensure a directory exists (no-op if present).
mkdirp() { [ -d "$1" ] || do_run mkdir -p -- "$1"; }

# ensure_block: idempotent append-if-missing of a sentinel-delimited block to a user file.
# Never overwrites; if the open sentinel is already present, it skips. Creates the file if
# absent. This is the only way this installer writes CLAUDE.md / the Copilot pointer.
# args: $1=file  $2=open-sentinel  $3=body-line  $4=close-sentinel  $5=report-label
ensure_block() {
  _f=$1; _open=$2; _body=$3; _close=$4; _label=$5
  if [ -f "$_f" ] && grep -qF -- "$_open" "$_f" 2>/dev/null; then
    report skipped "$_label (sentinel already present)"
    return 0
  fi
  if [ "$DRY_RUN" = "1" ]; then
    report "would-add" "$_label"
    return 0
  fi
  mkdirp "$(dirname -- "$_f")"
  [ -f "$_f" ] || : > "$_f"
  # Append the sentinel block. Never truncate the user's file.
  {
    printf '\n%s\n' "$_open"
    printf '%s\n' "$_body"
    printf '%s\n' "$_close"
  } >> "$_f"
  report created "$_label"
}

# link_or_copy: D-30 symlink-with-copy-fallback. Symlink by default; copy when symlink fails
# or INSTALL_MODE=copy. Existing identical link/copy is left as-is (idempotent). Never
# clobbers a NON-grugops user file at the destination — the destinations here are all
# grugops-owned paths (.claude/skills/grugops*, .claude/agents/grugops-orchestrator.md).
# args: $1=src-abs  $2=dest  $3=report-label
link_or_copy() {
  _src=$1; _dest=$2; _label=$3
  if [ ! -f "$_src" ]; then
    report "skipped" "$_label (source missing: $_src)"
    return 0
  fi
  # Idempotency: an existing correct symlink or an existing identical copy is a no-op.
  if [ -L "$_dest" ]; then
    report skipped "$_label (symlink present)"
    return 0
  fi
  if [ -f "$_dest" ] && cmp -s -- "$_src" "$_dest" 2>/dev/null; then
    report skipped "$_label (identical copy present)"
    return 0
  fi
  if [ "$DRY_RUN" = "1" ]; then
    if [ "$INSTALL_MODE" = "copy" ]; then
      report "would-copy" "$_label"
    else
      report "would-link" "$_label"
    fi
    return 0
  fi
  mkdirp "$(dirname -- "$_dest")"
  if [ "$INSTALL_MODE" != "copy" ] && ln -sf -- "$_src" "$_dest" 2>/dev/null && [ -L "$_dest" ]; then
    report linked "$_label"
  else
    cp -f -- "$_src" "$_dest"
    report "copied(verify)" "$_label"
  fi
}

# merge_gemini: additively wire .gemini/settings.json context.fileName to include AGENTS.md.
# Read-modify-write, never `>` the whole file blindly. If the key already lists AGENTS.md it
# is a no-op. If the file is absent it is created with just the grugops key.
#
# WR-03 parity: when the file EXISTS WITHOUT the key, pure sh cannot safely merge arbitrary
# JSON, so it delegates the merge to Node — running the SAME merge logic install.mjs uses, which
# produces a byte-identical result. This is the same Node-delegation pattern uninstall.sh's
# unmerge_gemini uses. Only when Node is unavailable does it defer with a `verify` message
# (pure sh must never blind-edit JSON). So install.sh and install.mjs now behave identically on
# a pre-existing settings.json wherever Node is present.
merge_gemini() {
  _f="$TARGET/.gemini/settings.json"
  if [ -f "$_f" ] && grep -qF 'AGENTS.md' "$_f" 2>/dev/null && grep -qF 'fileName' "$_f" 2>/dev/null; then
    report skipped ".gemini/settings.json (context.fileName already lists AGENTS.md)"
    return 0
  fi
  if [ -f "$_f" ]; then
    # File exists without our key. Delegate the JSON merge to Node for parity with install.mjs.
    if [ "$DRY_RUN" = "1" ]; then
      report "would-add" ".gemini/settings.json (merge AGENTS.md into context.fileName)"
      return 0
    fi
    if command -v node >/dev/null 2>&1; then
      # Mirror install.mjs mergeGemini() exactly: parse, ensure context, push "AGENTS.md" onto
      # context.fileName (coercing a scalar to an array), write JSON.stringify(json,null,2)+"\n".
      # A parse failure leaves the file untouched and flags verify (fail safe).
      GEMINI_FILE="$_f" node -e '
        const fs = require("node:fs");
        const f = process.env.GEMINI_FILE;
        const want = "AGENTS.md";
        let json;
        try { json = JSON.parse(fs.readFileSync(f, "utf8")); }
        catch { process.stderr.write("verify: settings.json not valid JSON; left untouched\n"); process.exit(3); }
        json.context = json.context || {};
        const list = Array.isArray(json.context.fileName)
          ? json.context.fileName
          : json.context.fileName ? [json.context.fileName] : [];
        if (list.includes(want)) { process.exit(2); } // already present → caller reports skipped
        list.push(want);
        json.context.fileName = list;
        fs.writeFileSync(f, JSON.stringify(json, null, 2) + "\n");
      ' && _gem_rc=0 || _gem_rc=$?
      if [ "${_gem_rc:-0}" = "0" ]; then
        report created ".gemini/settings.json (merged AGENTS.md into context.fileName)"
      elif [ "${_gem_rc:-0}" = "2" ]; then
        report skipped ".gemini/settings.json (context.fileName already lists AGENTS.md)"
      else
        report "verify" ".gemini/settings.json is not valid JSON — left untouched; add \"AGENTS.md\" to context.fileName manually"
      fi
      return 0
    fi
    # No Node: pure sh cannot safely merge arbitrary JSON. Defer to the user / install.mjs.
    report "verify" ".gemini/settings.json exists — add \"AGENTS.md\" to context.fileName manually (Node not found for a safe JSON merge; or run install.mjs)"
    return 0
  fi
  if [ "$DRY_RUN" = "1" ]; then
    report "would-add" ".gemini/settings.json (context.fileName: [AGENTS.md, GEMINI.md])"
    return 0
  fi
  mkdirp "$TARGET/.gemini"
  # Layout matches install.mjs's JSON.stringify(obj, null, 2) byte-for-byte so the two
  # installers produce an identical .gemini/settings.json (true functional parity, D — both
  # are the same installer in two languages).
  printf '%s\n' '{
  "context": {
    "fileName": [
      "AGENTS.md",
      "GEMINI.md"
    ]
  }
}' > "$_f"
  report created ".gemini/settings.json (context.fileName wiring)"
}

# ---------------------------------------------------------------------------
# Host-tool detection (heuristic; informational — the adapter set is laid down
# regardless because adapters are additive and tool-agnostic). Never fabricate a
# tool-specific install command we cannot confirm: those are marked UNKNOWN - verify.
#
# Detection is TARGET-LOCAL ONLY: it reports tools whose marker exists IN THE TARGET REPO,
# never from a binary on $PATH or a file under $HOME. This matches install.mjs's detectTools()
# exactly, so the two installers print the same "tools detected" line on the same machine. The
# earlier `|| command -v claude` / `|| [ -f "$HOME/.codex/AGENTS.md" ]` fallbacks parsed (POSIX
# left-associative) as `( <dir test> || <global test> ) && _found=...`, so a target with no
# `.claude` still reported claude whenever the `claude` binary was anywhere on PATH — a parity
# break and a misreport. Each line below is a single, target-local `&& append` (WR-04).
# ---------------------------------------------------------------------------
detect_tools() {
  _found=""
  [ -d "$TARGET/.claude" ] && _found="$_found claude"
  [ -d "$TARGET/.codex" ] && _found="$_found codex"
  [ -d "$TARGET/.gemini" ] && _found="$_found gemini"
  [ -f "$TARGET/opencode.json" ] && _found="$_found opencode"
  [ -d "$TARGET/.github" ] && _found="$_found copilot"
  [ -n "$_found" ] && printf '%s' "$_found" || printf ' none-detected'
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
printf '== grugops install ==\n'
printf 'source: %s\n' "$GRUGOPS_SRC"
printf 'home:   %s\n' "$GRUGOPS_HOME"
printf 'kit:    %s\n' "$KIT_ROOT"
printf 'target: %s\n' "$TARGET"
[ "$DRY_RUN" = "1" ] && printf 'mode:   DRY_RUN (no filesystem changes)\n'
printf 'tools detected:%s\n' "$(detect_tools)"
printf '\n-- adapters --\n'

# 1. Standalone Claude skills (symlink-with-copy-fallback). AGENTS.md is the portable
#    substrate every tool reads; ensure the target has it (link/copy if the source has one).
for s in $SKILLS; do
  link_or_copy "$GRUGOPS_SRC/.claude/skills/$s/SKILL.md" "$TARGET/.claude/skills/$s/SKILL.md" ".claude/skills/$s/SKILL.md"
done

# 2. Orchestrator subagent wrapper.
link_or_copy "$GRUGOPS_SRC/$AGENT_REL" "$TARGET/$AGENT_REL" "$AGENT_REL"

# 3. Portable AGENTS.md (the substrate Codex/Gemini/OpenCode/Copilot read). Only laid down
#    if the target does not already have one — never overwrite a user's AGENTS.md.
if [ -f "$TARGET/AGENTS.md" ]; then
  report skipped "AGENTS.md (target already has one — left untouched)"
else
  link_or_copy "$GRUGOPS_SRC/AGENTS.md" "$TARGET/AGENTS.md" "AGENTS.md"
fi

# 4. CLAUDE.md start-here pointer (additive sentinel block).
ensure_block "$TARGET/CLAUDE.md" "$CLAUDE_OPEN" "$CLAUDE_PTR" "$CLAUDE_CLOSE" "CLAUDE.md start-here pointer"

# 5. Gemini settings wiring (additive).
merge_gemini

# 6. Optional Copilot pointer (additive sentinel block; convenience only).
ensure_block "$TARGET/$COPILOT_REL" "$COPILOT_OPEN" "$COPILOT_PTR" "$COPILOT_CLOSE" "$COPILOT_REL (optional Copilot pointer)"

printf '\n-- notes --\n'
printf '  Claude Code plugin form (colon commands /grugops:plan) installs separately:\n'
printf '    /plugin marketplace add <owner>/grugops   (UNKNOWN - verify against current tool docs)\n'
printf '    /plugin install grugops@grugops           (UNKNOWN - verify against current tool docs)\n'
printf '  Safety: the mechanical prod-deploy guard is Claude-Code-only (plugin hooks/hooks.json).\n'
printf '          The other four tools rely on the autonomy=pr procedural fallback. See install/README.md.\n'
printf '  This installer NEVER sets the deploy-approval env var — only a human may approve a deploy.\n'

printf '\n== install complete%s ==\n' "$([ "$DRY_RUN" = "1" ] && printf ' (DRY_RUN — nothing changed)')"
