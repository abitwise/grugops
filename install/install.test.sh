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
# Check 3 — INSTALL-02 (two-root contract, Phase-8 D-06): install → uninstall removes ONLY the
#            grugops-OWNED artifacts (the .claude adapters, the CLAUDE.md / Copilot sentinel
#            wiring, the .grugops/install.json marker) while the SEEDED user state plane
#            (.grugops/factory.config.json, plans/**, memory-bank/**) SURVIVES — because once
#            grugops seeds per-repo state into the target it becomes the user's content, and
#            uninstall must never delete user content (D-06).
#
#            This is the deliberate, human-approved (Option A) reconciliation of the FORMER
#            byte-restore round-trip assertion with two-root reality: under the two-root seed
#            model the fixture can no longer return to its exact pre-install bytes, because
#            seeded user state is meant to persist. It is an approved pull-forward of a slice of
#            Phase 9 / VAL-02 (the broader install.test.sh split-rewrite remains Phase 9). The
#            marker (.grugops/install.json) removal is Plan 08-04's deliverable; this check does
#            NOT assert on the marker.
# ---------------------------------------------------------------------------
printf '\n[3] install → uninstall: grugops-owned wiring removed; seeded user state + frozen core survive (D-06)\n'
T3="$WORK/cycle"; make_fixture "$T3"
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$T3" sh "$SCRIPT_DIR/install.sh" >/dev/null 2>&1
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$T3" sh "$SCRIPT_DIR/uninstall.sh" >/dev/null 2>&1
# --- ASSERT REMOVED: grugops-owned adapters + sentinel wiring the installer added ---
if [ ! -e "$T3/.claude/agents/grugops-orchestrator.md" ] && [ ! -e "$T3/.claude/skills/grugops/SKILL.md" ]; then
  pass "grugops-owned .claude adapters removed by uninstall"
else
  fail "uninstall left grugops-owned .claude adapters behind"
fi
# The CLAUDE.md grugops sentinel block is gone, but the user's own CLAUDE.md content survives.
if grep -qF 'My own dev instructions' "$T3/CLAUDE.md" 2>/dev/null \
   && ! grep -qF '<!-- GSD:grugops-start-here -->' "$T3/CLAUDE.md" 2>/dev/null; then
  pass "CLAUDE.md grugops sentinel block removed; user content preserved"
else
  fail "uninstall did not cleanly strip the CLAUDE.md grugops sentinel block (or lost user content)"
fi
# --- ASSERT SURVIVES: the SEEDED user state plane (D-06 — seeded state is user content) ---
if [ -f "$T3/.grugops/factory.config.json" ]; then
  pass "seeded .grugops/factory.config.json survived uninstall (user state — D-06)"
else
  fail "uninstall DELETED seeded .grugops/factory.config.json — D-06 CONTRACT VIOLATION"
fi
if [ -f "$T3/memory-bank/00-index.md" ]; then
  pass "seeded memory-bank/** survived uninstall (user state — D-06)"
else
  fail "uninstall DELETED seeded memory-bank/** — D-06 CONTRACT VIOLATION"
fi
# --- ASSERT SURVIVES: the frozen core + the user's own plans/ data (unchanged contract) ---
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
# Check 6 — WR-05: the Copilot pointer block uses its OWN distinct sentinel and is removed
#            independently of the CLAUDE.md block. Seed a pre-existing .github/copilot-instructions.md
#            with user content, install, then uninstall, and assert: the user content survives,
#            the grugops Copilot block is gone, and exactly one grugops Copilot sentinel was added.
# ---------------------------------------------------------------------------
printf '\n[6] Copilot pointer block round-trip with a distinct sentinel (WR-05)\n'
T6="$WORK/copilot"; make_fixture "$T6"
mkdir -p "$T6/.github"
printf '# Copilot Instructions\n\nUser-owned Copilot guidance — must be preserved.\n' > "$T6/.github/copilot-instructions.md"
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$T6" sh "$SCRIPT_DIR/install.sh" >/dev/null 2>&1
# Count occurrences with a set -e-safe pipeline: `grep | wc -l` always exits 0 (the count is on
# stdout), avoiding both grep -c's non-zero-on-zero exit (which set -e would treat as fatal) and
# the double-0 artifact a `|| printf 0` fallback produces.
cblk=$(grep -cF '<!-- GSD:grugops-copilot-start-here -->' "$T6/.github/copilot-instructions.md" 2>/dev/null | head -n1 || true)
cblk=${cblk:-0}
# The Copilot block's sentinel must be DISTINCT from the CLAUDE.md sentinel (no collision). Match
# the CLAUDE.md sentinel as a whole line so the copilot sentinel (a superstring) is not counted.
collide=$(grep -c '^<!-- GSD:grugops-start-here -->$' "$T6/.github/copilot-instructions.md" 2>/dev/null | head -n1 || true)
collide=${collide:-0}
if [ "$cblk" = "1" ] && [ "$collide" = "0" ]; then
  pass "Copilot block added with its own distinct sentinel (no CLAUDE.md sentinel collision)"
else
  fail "Copilot sentinel wrong (copilot-start-here=$cblk, claude-start-here=$collide)"
fi
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" TARGET="$T6" sh "$SCRIPT_DIR/uninstall.sh" >/dev/null 2>&1
if grep -qF 'User-owned Copilot guidance' "$T6/.github/copilot-instructions.md" 2>/dev/null \
   && ! grep -qF 'GSD:grugops-copilot-start-here' "$T6/.github/copilot-instructions.md" 2>/dev/null; then
  pass "uninstall removed the Copilot block by its distinct sentinel; user content preserved"
else
  fail "uninstall did not cleanly strip the Copilot block (distinct-sentinel removal broken)"
fi

# ===========================================================================
# Checks 7-12 — INSTALL-05 doctor (`--check`). Added in Plan 09-04 (SC1/SC2/SC5).
#
# These EXTEND install.test.sh with the doctor surface while install.two-root.test.sh stays the
# deep two-root harness (D-09 / D-10: two harnesses, some overlap accepted, neither edits the
# other or the Phase-7 grep gate). Every check runs under a hermetic mktemp -d kit-home + target
# (the real repo and $HOME are never mutated) and uses the capture-rc idiom
# (`_out=$(... --check 2>&1) && _rc=0 || _rc=$?`) so `set -eu` never aborts on the doctor's
# nonzero exit. The hermetic two-root install driver is borrowed from install.two-root.test.sh.
# ---------------------------------------------------------------------------

# run_install <target> <home> [extra args…] — drive install.sh hermetically into an isolated
# target + kit-home with INSTALL_MODE=copy (deterministic bytes). Always --yes (unattended).
run_install() {
  _t=$1; _h=$2; shift 2
  INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$_h" TARGET="$_t" \
    sh "$SCRIPT_DIR/install.sh" --yes "$@" >/dev/null 2>&1
}

# doctor <target> <home> [extra args…] — run the non-mutating doctor on a target+home, capture
# the combined output in DOC_OUT and the exit status in DOC_RC (capture-rc idiom; survives set -e).
doctor() {
  _t=$1; _h=$2; shift 2
  DOC_OUT=$(GRUGOPS_HOME="$_h" TARGET="$_t" sh "$SCRIPT_DIR/install.sh" --check "$@" 2>&1) \
    && DOC_RC=0 || DOC_RC=$?
}

# ---------------------------------------------------------------------------
# Check 7 — INSTALL-05 (SC5): a good split install → doctor exits 0 with ALL CHECKS PASSED.
# ---------------------------------------------------------------------------
printf '\n[7] doctor: good split install → --check exits 0 (ALL CHECKS PASSED)\n'
D7_T="$WORK/doc-good"; D7_H="$WORK/doc-good-home"
run_install "$D7_T" "$D7_H" || true
doctor "$D7_T" "$D7_H"
if [ "$DOC_RC" -eq 0 ] && printf '%s' "$DOC_OUT" | grep -qF 'ALL CHECKS PASSED'; then
  pass "good split → --check exits 0 with ALL CHECKS PASSED"
else
  fail "good split --check did not pass cleanly (rc=$DOC_RC: $DOC_OUT)"
fi

# ---------------------------------------------------------------------------
# Check 8 — INSTALL-05 (SC5): missing kit → loud FAIL naming the kit. After a good install,
#            `rm -rf "$GRUGOPS_HOME/agent-factory"` (RESEARCH Discretion 3) → --check exits
#            nonzero AND the first-failure line names the missing kit (agent-factory) + the
#            referencing artifact the installer wrote (.grugops/install.json).
# ---------------------------------------------------------------------------
printf '\n[8] doctor: missing kit (rm -rf $GRUGOPS_HOME/agent-factory) → --check FAILS naming the kit\n'
D8_T="$WORK/doc-nokit"; D8_H="$WORK/doc-nokit-home"
run_install "$D8_T" "$D8_H" || true
rm -rf -- "$D8_H/agent-factory"
doctor "$D8_T" "$D8_H"
if [ "$DOC_RC" -ne 0 ] \
   && printf '%s' "$DOC_OUT" | grep -qF 'agent-factory' \
   && printf '%s' "$DOC_OUT" | grep -qF 'referenced by'; then
  pass "missing kit → --check nonzero, names the missing kit + its referencing file"
else
  fail "missing-kit --check did not fail loudly naming the kit (rc=$DOC_RC: $DOC_OUT)"
fi

# ---------------------------------------------------------------------------
# Check 9 — SC1: deterministic first-failure. Two --check runs on the SAME broken target produce
#            a BYTE-IDENTICAL first-failure line (the ordered stat set is deterministic).
# ---------------------------------------------------------------------------
printf '\n[9] doctor: first-failure line is byte-identical across two runs (deterministic order)\n'
# Reuse the broken (missing-kit) target from Check 8 — its first failure is stable.
doctor "$D8_T" "$D8_H"; _ff1=$(printf '%s\n' "$DOC_OUT" | grep -F 'FAIL' | head -n1)
doctor "$D8_T" "$D8_H"; _ff2=$(printf '%s\n' "$DOC_OUT" | grep -F 'FAIL' | head -n1)
if [ -n "$_ff1" ] && [ "$_ff1" = "$_ff2" ]; then
  pass "first-failure line identical across runs (deterministic): $_ff1"
else
  fail "first-failure line differs across runs (ff1='$_ff1' ff2='$_ff2')"
fi

# ---------------------------------------------------------------------------
# Check 10 — SC2: the full exit-code matrix. pass=0 (Check 7), FAIL≠0 (Check 8), and the two
#             WARN arms here: a WARN-only condition exits 0 bare, nonzero under --strict. The WARN
#             is induced by bumping $GRUGOPS_HOME/agent-factory/VERSION (kit-version skew vs the
#             marker) — a detect-only WARN, not a FAIL.
# ---------------------------------------------------------------------------
printf '\n[10] doctor: exit-code matrix — pass=0, FAIL!=0, WARN-only->0, WARN+--strict->!=0\n'
D10_T="$WORK/doc-warn"; D10_H="$WORK/doc-warn-home"
run_install "$D10_T" "$D10_H" || true
printf '9.9.9-skew\n' > "$D10_H/agent-factory/VERSION"   # kit-version skew → a WARN finding
# pass=0 (re-assert from a fresh good install for completeness of the matrix in ONE place).
doctor "$D7_T" "$D7_H"; _rc_pass=$DOC_RC
# FAIL≠0 (the missing-kit target).
doctor "$D8_T" "$D8_H"; _rc_fail=$DOC_RC
# WARN-only → 0 bare.
doctor "$D10_T" "$D10_H"; _rc_warn=$DOC_RC; _warn_out=$DOC_OUT
# WARN + --strict → nonzero.
doctor "$D10_T" "$D10_H" --strict; _rc_warn_strict=$DOC_RC
if [ "$_rc_pass" -eq 0 ] \
   && [ "$_rc_fail" -ne 0 ] \
   && [ "$_rc_warn" -eq 0 ] && printf '%s' "$_warn_out" | grep -qiF 'WARN' \
   && [ "$_rc_warn_strict" -ne 0 ]; then
  pass "exit-code matrix holds: pass=$_rc_pass FAIL=$_rc_fail WARN=$_rc_warn WARN+strict=$_rc_warn_strict"
else
  fail "exit-code matrix broken (pass=$_rc_pass FAIL=$_rc_fail WARN=$_rc_warn WARN+strict=$_rc_warn_strict; warn-out=$_warn_out)"
fi

# ---------------------------------------------------------------------------
# Check 11 — SC1: dangling symlink → FAIL with a symlink-specific line. Replace a load-bearing
#             resolved path (plans/handoffs) with a symlink whose target does not exist; the
#             doctor's `[ -L ] && [ ! -e ]` branch fires a distinct "dangling symlink:" finding.
# ---------------------------------------------------------------------------
printf '\n[11] doctor: dangling symlink in the resolved set → FAIL (symlink-specific message)\n'
D11_T="$WORK/doc-dangling"; D11_H="$WORK/doc-dangling-home"
run_install "$D11_T" "$D11_H" || true
rm -rf -- "$D11_T/plans/handoffs"
( cd "$D11_T" && ln -s "$D11_T/this-target-does-not-exist" "plans/handoffs" )
doctor "$D11_T" "$D11_H"
if [ "$DOC_RC" -ne 0 ] && printf '%s' "$DOC_OUT" | grep -qiF 'dangling symlink'; then
  pass "dangling symlink → --check FAILS with a symlink-specific message"
else
  fail "dangling symlink not caught with a symlink-specific FAIL (rc=$DOC_RC: $DOC_OUT)"
fi

# ---------------------------------------------------------------------------
# Check 12 — SC5 (read-only by construction, T-09-02): a DOUBLE --check mutates NOTHING. Snapshot
#             the target before and after two consecutive --check runs and assert zero diff.
# ---------------------------------------------------------------------------
printf '\n[12] doctor: double --check is read-only (target snapshot unchanged)\n'
D12_T="$WORK/doc-ro"; D12_H="$WORK/doc-ro-home"
run_install "$D12_T" "$D12_H" || true
snapshot "$D12_T" "$WORK/doc-ro.pre"
doctor "$D12_T" "$D12_H"
doctor "$D12_T" "$D12_H"
snapshot "$D12_T" "$WORK/doc-ro.post"
if "$DIFF" "$WORK/doc-ro.pre" "$WORK/doc-ro.post" >/dev/null 2>&1; then
  pass "double --check left the target byte-for-byte unchanged (doctor mutates nothing)"
else
  printf '    (pre vs post diff:)\n'
  "$DIFF" "$WORK/doc-ro.pre" "$WORK/doc-ro.post" 2>&1 | sed 's/^/    /'
  fail "--check mutated the target (NOT read-only) — T-09-02 VIOLATION"
fi

# ---------------------------------------------------------------------------
# Check 13 — sh<->Node doctor parity. install.sh --check and install.mjs --check on the SAME
#             target+home must agree on the exit code AND the first-failure line. Gated on
#             `command -v node` with a skip-with-note pass when node is absent (mirror Check 4).
# ---------------------------------------------------------------------------
printf '\n[13] doctor parity: install.sh --check == install.mjs --check (rc + first-failure)\n'
if command -v node >/dev/null 2>&1; then
  P_T="$WORK/doc-parity"; P_H="$WORK/doc-parity-home"
  run_install "$P_T" "$P_H" || true
  rm -rf -- "$P_H/agent-factory"   # induce a FAIL so the first-failure line is non-empty + comparable
  _sh_out=$(GRUGOPS_HOME="$P_H" TARGET="$P_T" sh "$SCRIPT_DIR/install.sh" --check 2>&1) && _sh_rc=0 || _sh_rc=$?
  _mj_out=$(GRUGOPS_HOME="$P_H" TARGET="$P_T" node "$SCRIPT_DIR/install.mjs" --check 2>&1) && _mj_rc=0 || _mj_rc=$?
  _sh_ff=$(printf '%s\n' "$_sh_out" | grep -F 'FAIL' | head -n1)
  _mj_ff=$(printf '%s\n' "$_mj_out" | grep -F 'FAIL' | head -n1)
  if [ "$_sh_rc" = "$_mj_rc" ] && [ -n "$_sh_ff" ] && [ "$_sh_ff" = "$_mj_ff" ]; then
    pass "sh and Node doctors agree (rc=$_sh_rc, first-failure identical)"
  else
    printf '    sh : rc=%s ff=%s\n    mjs: rc=%s ff=%s\n' "$_sh_rc" "$_sh_ff" "$_mj_rc" "$_mj_ff"
    fail "sh and Node doctors diverge (rc or first-failure line)"
  fi
else
  pass "node not found — sh/Node doctor parity skipped (UNKNOWN - verify with node present)"
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
