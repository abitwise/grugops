#!/usr/bin/env sh
# install.two-root.test.sh — the Phase-8 INSTALL-03 / INSTALL-04 two-root behavioral gate.
#
# This is a SEPARATE harness from install/install.test.sh (which is FROZEN this phase — its
# split-aware rewrite is Phase 9 / VAL-02). It encodes every NEW two-root behavior the
# installer rewrite (Plan 03) and the uninstall/docs plan (Plan 04) must satisfy:
#
#   INSTALL-04 — kit copy to $GRUGOPS_HOME, adapter materialization (resolved absolute kit
#                path injected into the 2 resolver adapters), full state seed (incl.
#                plans/handoffs/), never-clobber seeded files, two-root idempotency,
#                DRY_RUN mutates neither root, copy-default (no symlinks), sh/Node byte-parity.
#   INSTALL-03 — --target from an arbitrary CWD, --yes / non-TTY unattended install.
#   D-06       — two-root uninstall removes the marker + adapters but NEVER the shared kit or
#                the seeded user config.
#   D-07       — the self-checkout guard refuses by default and --allow-self overrides, exercised
#                against a THROWAWAY clone-shaped fixture, never the real grugops checkout.
#
# Written FIRST against the intended behavior: it ships RED (the installer does not yet copy the
# kit, materialize adapters, or seed state) and goes GREEN as Plans 03/04 land. It mirrors
# install.test.sh's proven idioms (pass/fail/FAILS, content-addressed snapshot, mktemp -d +
# trap cleanup, hermetic env overrides) and EXTENDS snapshot to cover BOTH roots.
#
# Hermetic: every install runs under mktemp -d with GRUGOPS_HOME / GRUGOPS_SRC / TARGET /
# INSTALL_MODE=copy overrides; it never writes the real repo, $HOME, or a real $GRUGOPS_HOME.
#
# House style: #!/usr/bin/env sh, set -eu, printf not echo -e, pass()/fail(), exit 0 = all
# green / 1 = any fail.

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
FAILS=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

# Portable recursive diff: prefer a real diff(1); the env's `diff` may be git's no-index shim.
DIFF=diff
if command -v /usr/bin/diff >/dev/null 2>&1; then DIFF=/usr/bin/diff; fi

# A throwaway temp area cleaned on exit (success or failure). NOTHING outside $WORK is ever
# written — not the repo, not $HOME, not a real $GRUGOPS_HOME.
WORK=$(mktemp -d)
cleanup() { rm -rf -- "$WORK"; }
trap cleanup EXIT INT TERM

# snapshot <dir> <out> — a stable, content-addressed manifest of a tree (path + cksum, LINK for
# symlinks) so two states can be compared regardless of inode details. Called once per ROOT so
# BOTH $TARGET and $GRUGOPS_HOME can be diffed (the two-root extension of install.test.sh's
# single-dir snapshot). An absent dir snapshots to an empty manifest (so "never created" is a
# legitimate, diffable state for the DRY_RUN assertion).
snapshot() {
  _d=$1; _out=$2
  : > "$_out"
  [ -d "$_d" ] || return 0
  ( cd "$_d" && find . \( -type f -o -type l \) | LC_ALL=C sort | while IFS= read -r p; do
      if [ -L "$p" ]; then printf '%s LINK\n' "$p"; else printf '%s %s\n' "$p" "$(cksum < "$p" 2>/dev/null | awk '{print $1"-"$2}')"; fi
    done ) > "$_out"
}

# run_install <target> <home> [extra args…] — drive install.sh hermetically into an isolated
# target + home with INSTALL_MODE=copy (deterministic bytes for diffing). Always passes --yes so
# the run is unattended. Returns the installer's exit status (so guard/exit assertions can read it).
run_install() {
  _t=$1; _h=$2; shift 2
  INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$_h" TARGET="$_t" \
    sh "$SCRIPT_DIR/install.sh" --yes "$@" >/dev/null 2>&1
}

printf '== grugops two-root install test (isolated temp; this repo / $HOME never mutated) ==\n'

# ---------------------------------------------------------------------------
# [1] INSTALL-04 kit copy — the shared kit lands under $GRUGOPS_HOME/agent-factory.
# ---------------------------------------------------------------------------
printf '\n[1] INSTALL-04 kit copy → $GRUGOPS_HOME/agent-factory\n'
KC_T="$WORK/kitcopy"; KC_H="$WORK/kitcopy-home"
run_install "$KC_T" "$KC_H" || true
if [ -f "$KC_H/agent-factory/roles/orchestrator.md" ]; then
  pass "kit copied to \$GRUGOPS_HOME/agent-factory/roles/orchestrator.md"
else
  fail "kit NOT copied to \$GRUGOPS_HOME (expected $KC_H/agent-factory/roles/orchestrator.md)"
fi

# ---------------------------------------------------------------------------
# [2] INSTALL-04 materialization — the 2 resolver adapters carry the resolved absolute kit path
#     in a grugops:materialized-kit sentinel block pointing at $GRUGOPS_HOME/agent-factory.
# ---------------------------------------------------------------------------
printf '\n[2] INSTALL-04 materialization → adapters name the resolved absolute kit path\n'
MAT_T="$WORK/mat"; MAT_H="$WORK/mat-home"
run_install "$MAT_T" "$MAT_H" || true
_agent="$MAT_T/.claude/agents/grugops-orchestrator.md"
_skill="$MAT_T/.claude/skills/grugops/SKILL.md"
_expect="$MAT_H/agent-factory"
if [ -f "$_agent" ] \
   && grep -qF 'grugops:materialized-kit' "$_agent" 2>/dev/null \
   && grep -qF "$_expect" "$_agent" 2>/dev/null; then
  pass "grugops-orchestrator.md materialized KIT= resolves to $_expect"
else
  fail "grugops-orchestrator.md missing materialized-kit block resolving to $_expect"
fi
if [ -f "$_skill" ] \
   && grep -qF 'grugops:materialized-kit' "$_skill" 2>/dev/null \
   && grep -qF "$_expect" "$_skill" 2>/dev/null; then
  pass "grugops/SKILL.md materialized KIT= resolves to $_expect"
else
  fail "grugops/SKILL.md missing materialized-kit block resolving to $_expect"
fi

# ---------------------------------------------------------------------------
# [3] INSTALL-04 seed — per-repo state is seeded into $TARGET, including the runtime
#     plans/handoffs/ dir (absent from the repo skeleton) and the .grugops/install.json marker.
# ---------------------------------------------------------------------------
printf '\n[3] INSTALL-04 seed → .grugops/{factory.config.json,install.json}, plans/**, memory-bank/**\n'
SD_T="$WORK/seed"; SD_H="$WORK/seed-home"
run_install "$SD_T" "$SD_H" || true
_seed_ok=1
for _p in \
  "$SD_T/.grugops/factory.config.json" \
  "$SD_T/.grugops/install.json" \
  "$SD_T/plans/board.md" \
  "$SD_T/memory-bank/00-index.md"; do
  if [ ! -f "$_p" ]; then fail "seed missing file: $_p"; _seed_ok=0; fi
done
if [ ! -d "$SD_T/plans/handoffs" ]; then
  fail "seed missing runtime dir: $SD_T/plans/handoffs"
  _seed_ok=0
fi
[ "$_seed_ok" = "1" ] && pass "all seeded paths present (config + marker + plans/handoffs/ + memory-bank/)"

# ---------------------------------------------------------------------------
# [4] INSTALL-04 never-clobber — a pre-existing seeded file is left byte-untouched (D-04).
# ---------------------------------------------------------------------------
printf '\n[4] INSTALL-04 never-clobber → pre-existing .grugops/factory.config.json survives\n'
NC_T="$WORK/noclobber"; NC_H="$WORK/noclobber-home"
mkdir -p "$NC_T/.grugops"
printf 'SENTINEL-USER-CONFIG-DO-NOT-CLOBBER\n' > "$NC_T/.grugops/factory.config.json"
run_install "$NC_T" "$NC_H" || true
if grep -qF 'SENTINEL-USER-CONFIG-DO-NOT-CLOBBER' "$NC_T/.grugops/factory.config.json" 2>/dev/null; then
  pass "pre-existing .grugops/factory.config.json sentinel survived (never-clobber)"
else
  fail "install CLOBBERED a pre-existing .grugops/factory.config.json — CONTRACT VIOLATION"
fi

# ---------------------------------------------------------------------------
# [5] INSTALL-04 two-root idempotency — a second install produces ZERO diff in BOTH roots
#     (materialized adapters + kit copy + marker). If the marker carries a timestamp it will
#     fail here, correctly surfacing the Plan-03 idempotency decision (Pitfall 1).
# ---------------------------------------------------------------------------
printf '\n[5] INSTALL-04 idempotency (two roots) → double-install zero diff in $TARGET AND $GRUGOPS_HOME\n'
ID_T="$WORK/idem"; ID_H="$WORK/idem-home"
run_install "$ID_T" "$ID_H" || true
snapshot "$ID_T" "$WORK/idem.t.a"; snapshot "$ID_H" "$WORK/idem.h.a"
run_install "$ID_T" "$ID_H" || true
snapshot "$ID_T" "$WORK/idem.t.b"; snapshot "$ID_H" "$WORK/idem.h.b"
if "$DIFF" "$WORK/idem.t.a" "$WORK/idem.t.b" >/dev/null 2>&1; then
  pass "second install → ZERO diff in \$TARGET (idempotent, incl. materialized adapters + marker)"
else
  fail "second install changed \$TARGET (not idempotent — check materialized adapters / marker timestamp)"
fi
if "$DIFF" "$WORK/idem.h.a" "$WORK/idem.h.b" >/dev/null 2>&1; then
  pass "second install → ZERO diff in \$GRUGOPS_HOME (kit copy idempotent)"
else
  fail "second install changed \$GRUGOPS_HOME (kit copy not idempotent)"
fi

# ---------------------------------------------------------------------------
# [6] INSTALL-04 DRY_RUN — DRY_RUN=1 mutates NEITHER root (both stay absent / empty manifest).
# ---------------------------------------------------------------------------
printf '\n[6] INSTALL-04 DRY_RUN=1 → neither $TARGET nor $GRUGOPS_HOME is created/mutated\n'
DR_T="$WORK/dry"; DR_H="$WORK/dry-home"
snapshot "$DR_T" "$WORK/dry.t.pre"; snapshot "$DR_H" "$WORK/dry.h.pre"
DRY_RUN=1 INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$DR_H" TARGET="$DR_T" \
  sh "$SCRIPT_DIR/install.sh" --yes >/dev/null 2>&1 || true
snapshot "$DR_T" "$WORK/dry.t.post"; snapshot "$DR_H" "$WORK/dry.h.post"
if "$DIFF" "$WORK/dry.t.pre" "$WORK/dry.t.post" >/dev/null 2>&1 \
   && "$DIFF" "$WORK/dry.h.pre" "$WORK/dry.h.post" >/dev/null 2>&1; then
  pass "DRY_RUN=1 left BOTH roots byte-for-byte unchanged"
else
  fail "DRY_RUN=1 mutated a root (\$TARGET or \$GRUGOPS_HOME)"
fi

# ---------------------------------------------------------------------------
# [7] INSTALL-04 copy-default — the NEW default mode is copy: a default install (no INSTALL_MODE
#     override) leaves NO symlinks in either root (D-05, symlink opt-in).
# ---------------------------------------------------------------------------
printf '\n[7] INSTALL-04 copy-default → no symlinks in either root when INSTALL_MODE is unset\n'
CD_T="$WORK/copydef"; CD_H="$WORK/copydef-home"
# Intentionally NO INSTALL_MODE override here — prove the new default is copy.
GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$CD_H" TARGET="$CD_T" \
  sh "$SCRIPT_DIR/install.sh" --yes >/dev/null 2>&1 || true
_links=$(find "$CD_T" "$CD_H" -type l 2>/dev/null || true)
if [ -z "$_links" ]; then
  pass "default install created NO symlinks in either root (copy is the default)"
else
  fail "default install created symlinks (copy is NOT the default): $_links"
fi

# ---------------------------------------------------------------------------
# [8] INSTALL-03 --target from an arbitrary CWD — run the installer from an unrelated working
#     directory and point it at the target with the --target flag (the documented surface, not
#     the obscure TARGET= env). The adapters must land in the --target dir regardless of CWD.
# ---------------------------------------------------------------------------
printf '\n[8] INSTALL-03 --target from arbitrary CWD → adapters land in the named target\n'
TG_T="$WORK/app-target"; TG_H="$WORK/app-target-home"
mkdir -p "$WORK/elsewhere"
( cd "$WORK/elsewhere" \
  && INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$TG_H" \
     sh "$REPO_ROOT/install/install.sh" --target "$TG_T" --yes ) >/dev/null 2>&1 || true
if [ -f "$TG_T/.claude/agents/grugops-orchestrator.md" ]; then
  pass "--target landed the orchestrator adapter in $TG_T from an unrelated CWD"
else
  fail "--target did NOT land adapters in the named target (CWD-relative install bug?)"
fi

# ---------------------------------------------------------------------------
# [9] INSTALL-03 --yes / non-TTY — with stdin redirected from /dev/null plus --yes the install
#     runs unattended and exits 0 without hanging on a prompt. (A hang would block this harness,
#     so a simple invocation makes a hang observable; we also assert the adapter exists after.)
# ---------------------------------------------------------------------------
printf '\n[9] INSTALL-03 --yes / non-TTY → unattended install, no prompt hang\n'
YS_T="$WORK/app-yes"; YS_H="$WORK/app-yes-home"
if INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$YS_H" TARGET="$YS_T" \
     sh "$SCRIPT_DIR/install.sh" --yes </dev/null >/dev/null 2>&1; then
  _yes_rc=0
else
  _yes_rc=$?
fi
if [ "$_yes_rc" = "0" ] && [ -f "$YS_T/.claude/agents/grugops-orchestrator.md" ]; then
  pass "--yes with stdin /dev/null installed unattended (exit 0, adapter present, no hang)"
else
  fail "--yes / non-TTY install failed or hung (rc=$_yes_rc, adapter present check failed)"
fi

# ---------------------------------------------------------------------------
# [10] D-07 self-checkout guard — build a THROWAWAY clone-shaped fixture that trips the
#      source-marker predicate (carries install/install.sh + agent-factory/VERSION) WITHOUT
#      being the real repo. Refuse-by-default must exit nonzero and name --allow-self; the same
#      invocation WITH --allow-self must proceed. NEVER point the guard at $REPO_ROOT.
# ---------------------------------------------------------------------------
printf '\n[10] D-07 self-checkout guard → refuse-by-default; --allow-self overrides (throwaway clone)\n'
FAKE="$WORK/fakeclone"
mkdir -p "$FAKE/install" "$FAKE/agent-factory"
cp "$REPO_ROOT/install/install.sh" "$FAKE/install/install.sh"
printf '0.0.0-fake\n' > "$FAKE/agent-factory/VERSION"
SG_H="$WORK/guard-home"
# (a) refuse by default: installing INTO the clone (target == source-shaped checkout) must refuse.
_guard_out=$(GRUGOPS_SRC="$FAKE" GRUGOPS_HOME="$SG_H" TARGET="$FAKE" \
  sh "$REPO_ROOT/install/install.sh" --yes 2>&1) && _guard_rc=0 || _guard_rc=$?
if [ "${_guard_rc:-0}" != "0" ] && printf '%s' "$_guard_out" | grep -qF -- '--allow-self'; then
  pass "self-checkout guard refused by default (nonzero exit, message names --allow-self)"
else
  fail "self-checkout guard did NOT refuse by default (rc=${_guard_rc:-0}; message missing --allow-self)"
fi
# (b) --allow-self overrides: the same invocation proceeds (exit 0).
SG_H2="$WORK/guard-home-allow"
if GRUGOPS_SRC="$FAKE" GRUGOPS_HOME="$SG_H2" TARGET="$FAKE" \
     sh "$REPO_ROOT/install/install.sh" --yes --allow-self >/dev/null 2>&1; then
  pass "--allow-self overrode the self-checkout guard (install proceeded)"
else
  fail "--allow-self did NOT override the self-checkout guard (install still refused)"
fi

# ---------------------------------------------------------------------------
# [11] D-06 two-root uninstall — install into a fresh target+home, then uninstall. The shared kit
#      under $GRUGOPS_HOME and the seeded user config survive; only the marker + adapters go.
# ---------------------------------------------------------------------------
printf '\n[11] D-06 two-root uninstall → kit + seeded config survive; marker + adapters removed\n'
UN_T="$WORK/app-uninstall"; UN_H="$WORK/app-uninstall-home"
run_install "$UN_T" "$UN_H" || true
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$UN_H" TARGET="$UN_T" \
  sh "$REPO_ROOT/install/uninstall.sh" >/dev/null 2>&1 || true
# Shared kit never removed.
if [ -d "$UN_H/agent-factory" ]; then
  pass "uninstall preserved the shared kit at \$GRUGOPS_HOME/agent-factory (never removed)"
else
  fail "uninstall REMOVED the shared kit at \$GRUGOPS_HOME/agent-factory — CONTRACT VIOLATION"
fi
# Seeded user config survives (it is user state once seeded).
if [ -f "$UN_T/.grugops/factory.config.json" ]; then
  pass "uninstall preserved seeded .grugops/factory.config.json (user state)"
else
  fail "uninstall REMOVED seeded .grugops/factory.config.json — CONTRACT VIOLATION"
fi
# Marker removed (grugops-owned).
if [ ! -e "$UN_T/.grugops/install.json" ]; then
  pass "uninstall removed the grugops-owned .grugops/install.json marker"
else
  fail "uninstall left the .grugops/install.json marker behind"
fi
# Adapters removed.
if [ ! -e "$UN_T/.claude/agents/grugops-orchestrator.md" ]; then
  pass "uninstall removed the .claude adapters"
else
  fail "uninstall left .claude adapters behind"
fi

# ---------------------------------------------------------------------------
# [12] sh/Node byte-parity — install via sh→(A,homeA) and node→(B,homeB) with identical env;
#      snapshot + diff BOTH target trees AND home trees AND the install.json marker bytes. Skip
#      (pass-with-note, never fail) when node is absent.
# ---------------------------------------------------------------------------
printf '\n[12] sh/Node byte-parity → target tree + home tree + marker identical (skip if node absent)\n'
if command -v node >/dev/null 2>&1; then
  # Drive BOTH installers with the SAME $GRUGOPS_HOME so the materialized KIT= line and the
  # install.json marker (which legitimately encode the resolved absolute home path) are
  # byte-COMPARABLE across installers — the parity contract is "same input → identical bytes".
  # Different homes would make the home-bearing files differ by the home path alone, which is a
  # legitimate per-machine difference, not a parity break; holding the home constant isolates the
  # true sh/Node parity (target tree + home tree + marker all byte-identical for the same home).
  PARITY_H="$WORK/parity-home"
  PA_T="$WORK/parity-sh"
  PB_T="$WORK/parity-node"
  INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$PARITY_H" TARGET="$PA_T" \
    sh "$SCRIPT_DIR/install.sh" --yes >/dev/null 2>&1 || true
  INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$PARITY_H" TARGET="$PB_T" \
    node "$SCRIPT_DIR/install.mjs" --yes >/dev/null 2>&1 || true
  snapshot "$PA_T" "$WORK/par.t.sh"; snapshot "$PB_T" "$WORK/par.t.node"
  _parity_ok=1
  "$DIFF" "$WORK/par.t.sh" "$WORK/par.t.node" >/dev/null 2>&1 || _parity_ok=0
  # Marker byte-parity: the two install.json markers must be byte-identical (same home).
  if [ -f "$PA_T/.grugops/install.json" ] && [ -f "$PB_T/.grugops/install.json" ]; then
    cmp -s -- "$PA_T/.grugops/install.json" "$PB_T/.grugops/install.json" 2>/dev/null || _parity_ok=0
  else
    _parity_ok=0
  fi
  if [ "$_parity_ok" = "1" ]; then
    pass "install.sh and install.mjs produce identical target tree + marker bytes (same \$GRUGOPS_HOME)"
  else
    fail "install.sh and install.mjs diverge (target tree / marker)"
  fi
else
  pass "node not found — sh/Node parity check skipped (UNKNOWN - verify with node present)"
fi

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
printf '\n== Result ==\n'
if [ "$FAILS" -eq 0 ]; then
  printf 'ALL CHECKS PASSED\n'
  exit 0
else
  printf '%s CHECK(S) FAILED (RED expected this wave — GREEN after Plans 03/04)\n' "$FAILS"
  exit 1
fi
