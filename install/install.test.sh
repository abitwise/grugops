#!/usr/bin/env sh
# install.test.sh — the INSTALL-01 / INSTALL-02 behavioral gate.
#
# Proves the installer contract WITHOUT mutating this repo: every check runs against a
# throwaway temp FIXTURE target (a tiny fake user repo) using GRUGOPS_SRC pointed at the real
# checkout as the adapter source. Tests use INSTALL_MODE=copy so the laid-down files are real
# bytes (deterministic for diffing), never source-dependent symlinks.
#
# Checks (from 05-VALIDATION.md § Requirement → Test Map):
#   1. (INSTALL-01) double-install → zero diff      — running install.sh twice is idempotent
#   2. (INSTALL-01) DRY_RUN=1      → no fs change    — preview mutates nothing
#   3. (INSTALL-02) install→uninstall → restored     — fixture returns to pristine AND a
#                   guarded "frozen core" sentinel survives (proves uninstall never deletes it)
#   4. (parity)    install.sh tree == install.mjs tree (functional identity of the two installers)
#
# House style: #!/usr/bin/env sh, set -eu, pass()/fail(), exit 0 = all green / 1 = any fail.

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
FAILS=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

# Portable recursive diff: prefer a real diff(1); the env's `diff` may be git's no-index shim.
DIFF=diff
if command -v /usr/bin/diff >/dev/null 2>&1; then DIFF=/usr/bin/diff; fi

# A throwaway temp area cleaned on exit (success or failure).
WORK=$(mktemp -d)
cleanup() { rm -rf -- "$WORK"; }
trap cleanup EXIT INT TERM

# make_fixture <dir> — a minimal fake user repo: a user-owned CLAUDE.md (to prove additive),
# plus a stand-in "frozen core" file under agent-factory/ (to prove uninstall never deletes it).
make_fixture() {
  _d=$1
  mkdir -p "$_d/agent-factory/roles" "$_d/plans"
  printf '# User Project\n\nMy own dev instructions — must be preserved.\n' > "$_d/CLAUDE.md"
  printf 'FROZEN CORE — uninstall must never delete this.\n' > "$_d/agent-factory/roles/orchestrator.md"
  printf 'user board\n' > "$_d/plans/board.md"
}

# snapshot <dir> <out> — a stable, content-addressed manifest of a tree (path + sha) so two
# states can be compared regardless of inode/symlink details.
snapshot() {
  _d=$1; _out=$2
  ( cd "$_d" && find . \( -type f -o -type l \) | LC_ALL=C sort | while IFS= read -r p; do
      if [ -L "$p" ]; then printf '%s LINK\n' "$p"; else printf '%s %s\n' "$p" "$(cksum < "$p" 2>/dev/null | awk '{print $1"-"$2}')"; fi
    done ) > "$_out"
}

printf '== grugops install test (isolated temp fixtures; this repo is never mutated) ==\n'

# ---------------------------------------------------------------------------
# Check 1 — INSTALL-01: double install is idempotent (zero diff).
# ---------------------------------------------------------------------------
printf '\n[1] double-install → zero diff (idempotent)\n'
T1="$WORK/double"; make_fixture "$T1"
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$T1" sh "$SCRIPT_DIR/install.sh" >/dev/null 2>&1
snapshot "$T1" "$WORK/snap1a"
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$T1" sh "$SCRIPT_DIR/install.sh" >/dev/null 2>&1
snapshot "$T1" "$WORK/snap1b"
if "$DIFF" "$WORK/snap1a" "$WORK/snap1b" >/dev/null 2>&1; then
  pass "second install produced ZERO diff (idempotent)"
else
  fail "second install changed the tree (not idempotent)"
fi
# the user's CLAUDE.md keeps its own content + exactly one grugops sentinel block
ublk=$(grep -c '<!-- GSD:grugops-start-here -->' "$T1/CLAUDE.md" 2>/dev/null || printf 0)
if grep -qF 'My own dev instructions' "$T1/CLAUDE.md" && [ "$ublk" = "1" ]; then
  pass "user CLAUDE.md preserved + exactly one grugops sentinel block (additive)"
else
  fail "user CLAUDE.md not preserved or sentinel block count != 1 (got $ublk)"
fi

# ---------------------------------------------------------------------------
# Check 2 — INSTALL-01: DRY_RUN=1 changes nothing.
# ---------------------------------------------------------------------------
printf '\n[2] DRY_RUN=1 → no filesystem change\n'
T2="$WORK/dry"; make_fixture "$T2"
snapshot "$T2" "$WORK/snap2pre"
DRY_RUN=1 INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$T2" sh "$SCRIPT_DIR/install.sh" >/dev/null 2>&1
snapshot "$T2" "$WORK/snap2post"
if "$DIFF" "$WORK/snap2pre" "$WORK/snap2post" >/dev/null 2>&1; then
  pass "DRY_RUN=1 left the fixture byte-for-byte unchanged"
else
  fail "DRY_RUN=1 mutated the filesystem"
fi

# ---------------------------------------------------------------------------
# Check 3 — INSTALL-02: install → uninstall restores the fixture AND never deletes the
#            frozen core (agent-factory/ survives).
# ---------------------------------------------------------------------------
printf '\n[3] install → uninstall → fixture restored AND agent-factory/ survives\n'
T3="$WORK/cycle"; make_fixture "$T3"
snapshot "$T3" "$WORK/snap3pre"
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$T3" sh "$SCRIPT_DIR/install.sh" >/dev/null 2>&1
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$T3" sh "$SCRIPT_DIR/uninstall.sh" >/dev/null 2>&1
snapshot "$T3" "$WORK/snap3post"
if "$DIFF" "$WORK/snap3pre" "$WORK/snap3post" >/dev/null 2>&1; then
  pass "fixture restored to its exact pre-install state after uninstall"
else
  printf '    (diff pre vs post-uninstall:)\n'
  "$DIFF" "$WORK/snap3pre" "$WORK/snap3post" 2>&1 | sed 's/^/    /'
  fail "uninstall did not cleanly restore the fixture"
fi
if [ -f "$T3/agent-factory/roles/orchestrator.md" ] && grep -qF 'FROZEN CORE' "$T3/agent-factory/roles/orchestrator.md"; then
  pass "agent-factory/ frozen core survived uninstall (never deleted)"
else
  fail "uninstall DELETED the frozen core — CONTRACT VIOLATION"
fi
if [ -f "$T3/plans/board.md" ] && grep -qF 'user board' "$T3/plans/board.md"; then
  pass "plans/ user data survived uninstall"
else
  fail "uninstall touched plans/ user data — CONTRACT VIOLATION"
fi

# ---------------------------------------------------------------------------
# Check 4 — install.sh and install.mjs produce the same tree (functional identity). Skipped
#            (not failed) if node is unavailable.
# ---------------------------------------------------------------------------
printf '\n[4] install.sh tree == install.mjs tree (functional parity)\n'
if command -v node >/dev/null 2>&1; then
  TSH="$WORK/psh"; TMJ="$WORK/pmj"; make_fixture "$TSH"; make_fixture "$TMJ"
  INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$TSH" sh "$SCRIPT_DIR/install.sh" >/dev/null 2>&1
  INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$TMJ" node "$SCRIPT_DIR/install.mjs" >/dev/null 2>&1
  snapshot "$TSH" "$WORK/snap4sh"; snapshot "$TMJ" "$WORK/snap4mj"
  if "$DIFF" "$WORK/snap4sh" "$WORK/snap4mj" >/dev/null 2>&1; then
    pass "install.sh and install.mjs produce identical trees"
  else
    printf '    (sh vs mjs tree diff:)\n'
    "$DIFF" "$WORK/snap4sh" "$WORK/snap4mj" 2>&1 | sed 's/^/    /'
    fail "install.sh and install.mjs diverge"
  fi
else
  pass "node not found — parity check skipped (UNKNOWN - verify with node present)"
fi

# ---------------------------------------------------------------------------
# Check 4b — WR-03 parity: with a PRE-EXISTING .gemini/settings.json (no AGENTS.md entry),
#             install.sh and install.mjs must produce an IDENTICAL tree — i.e. install.sh now
#             delegates the JSON merge to Node and matches install.mjs byte-for-byte, instead
#             of deferring (the case the old Check 4 never exercised). Skipped if node absent.
# ---------------------------------------------------------------------------
printf '\n[4b] pre-existing .gemini/settings.json → install.sh tree == install.mjs tree (WR-03)\n'
if command -v node >/dev/null 2>&1; then
  PSH="$WORK/gemsh"; PMJ="$WORK/gemmj"; make_fixture "$PSH"; make_fixture "$PMJ"
  for d in "$PSH" "$PMJ"; do
    mkdir -p "$d/.gemini"
    printf '{\n  "theme": "dark"\n}\n' > "$d/.gemini/settings.json"
  done
  INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$PSH" sh "$SCRIPT_DIR/install.sh" >/dev/null 2>&1
  INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$PMJ" node "$SCRIPT_DIR/install.mjs" >/dev/null 2>&1
  snapshot "$PSH" "$WORK/snap4bsh"; snapshot "$PMJ" "$WORK/snap4bmj"
  if "$DIFF" "$WORK/snap4bsh" "$WORK/snap4bmj" >/dev/null 2>&1; then
    pass "pre-existing settings.json: install.sh and install.mjs merged AGENTS.md identically"
  else
    printf '    (sh vs mjs tree diff:)\n'
    "$DIFF" "$WORK/snap4bsh" "$WORK/snap4bmj" 2>&1 | sed 's/^/    /'
    fail "pre-existing settings.json: installers diverge (WR-03 parity broken)"
  fi
  # The merged file must preserve the user's own key AND gain AGENTS.md (additive, not clobbered).
  if grep -qF '"theme"' "$PSH/.gemini/settings.json" && grep -qF 'AGENTS.md' "$PSH/.gemini/settings.json"; then
    pass "pre-existing settings.json: user's own key preserved + AGENTS.md merged (additive)"
  else
    fail "pre-existing settings.json: install.sh clobbered the user key or skipped the merge"
  fi
else
  pass "node not found — pre-existing-settings parity check skipped (UNKNOWN - verify with node present)"
fi

# ---------------------------------------------------------------------------
# Check 5 — INSTALL-02 / CR-01: uninstall must NEVER delete a user-owned AGENTS.md that
#            happens to be a symlink into the user's own content. Only a symlink that resolves
#            to the grugops source AGENTS.md is grugops-owned and removable.
# ---------------------------------------------------------------------------
printf '\n[5] uninstall preserves a user-owned AGENTS.md symlink (CR-01)\n'
T5="$WORK/usersymlink"; make_fixture "$T5"
# User's own AGENTS.md is a symlink into their own content (common monorepo pattern).
printf 'USER-OWNED AGENTS — uninstall must never delete this.\n' > "$T5/my-real-agents.md"
( cd "$T5" && ln -s my-real-agents.md AGENTS.md )
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$T5" sh "$SCRIPT_DIR/uninstall.sh" >/dev/null 2>&1
if [ -L "$T5/AGENTS.md" ] && grep -qF 'USER-OWNED AGENTS' "$T5/AGENTS.md" 2>/dev/null; then
  pass "user-owned AGENTS.md symlink survived uninstall (not grugops-owned)"
else
  fail "uninstall DELETED a user-owned AGENTS.md symlink — DATA LOSS / CONTRACT VIOLATION"
fi
# Conversely: a symlink that resolves to the grugops source IS grugops-owned and is removed.
T5b="$WORK/grugopssymlink"; make_fixture "$T5b"
( cd "$T5b" && ln -s "$REPO_ROOT/AGENTS.md" AGENTS.md )
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$T5b" sh "$SCRIPT_DIR/uninstall.sh" >/dev/null 2>&1
if [ ! -e "$T5b/AGENTS.md" ] && [ ! -L "$T5b/AGENTS.md" ]; then
  pass "grugops-source AGENTS.md symlink removed by uninstall (correctly grugops-owned)"
else
  fail "uninstall left a grugops-owned AGENTS.md symlink behind"
fi

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
printf '\n== Result ==\n'
if [ "$FAILS" -eq 0 ]; then
  printf 'ALL CHECKS PASSED\n'
  exit 0
else
  printf '%s CHECK(S) FAILED\n' "$FAILS"
  exit 1
fi
