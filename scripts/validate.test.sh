#!/usr/bin/env sh
# validate.test.sh — VAL-01 / VAL-02 / D-45 self-test for scripts/validate-agent-factory.mjs.
#
# Proves the structure validator both PASSES and FAILS — the no-fabrication contract (spec §18/
# §19.9) demands a gate that can actually fail. It runs the validator against:
#   (a) grugops's OWN tree (D-42 self-test)        → must be GREEN
#   (b) a minimal GOOD fixture tree                  → exit 0
#   (c) six one-mutation BAD/WARN fixture trees      → nonzero + the finding naming the defect
#       (incl. bad-workflow-no-commit, which proves the per-workflow "## Commit" check fails)
#   (d) the warn-only fixture under --strict          → exit 0 bare, nonzero under --strict
#       (proves the D-44 warning-promotion path)
#   (e) TWO-ROOT split (VAL-02 / Plan 09-04): a GOOD split (separate kit + state roots) passes; a
#       BAD missing-kit (VALIDATE_KIT_ROOT → nonexistent) fails naming a missing role file; a BAD
#       unset-kit (VALIDATE_KIT_ROOT UNSET) errors with the (C3) message — the no-`.`-fallback
#       proof that the validator cannot false-green in the dev checkout (SC4).
#   (f) a three-way resolution-parity assertion (Task 3) that sh doctor = Node doctor = Node
#       validator resolve the SAME kit root for one GRUGOPS_HOME (SC4 / D-04).
#
# Two-root resolution (VAL-02 / D-08): KIT_ROOT comes ONLY from VALIDATE_KIT_ROOT (no default);
# STATE_ROOT from VALIDATE_ROOT (else repo root, back-compat). The existing single-tree fixtures
# are reused AS-IS — run_fixture now points BOTH roots at the same tree, so each fixture is both
# its kit and its state (Discretion 4). The split fixtures are built hermetically via mktemp -d
# from scripts/fixtures/good (the kit subtree vs the state subtree), so no duplicate fixture trees
# are committed. No package.json is created; invocation is bare node.
#
# House style mirrors hooks/guard.test.sh + install/install.test.sh: #!/usr/bin/env sh, set -eu,
# pass()/fail()/FAILS, printf (not echo -e), ALL CHECKS PASSED / N CHECK(S) FAILED, exit 0/1.
#
# Run from the repo root:  sh scripts/validate.test.sh
# Exit 0 = all checks PASS; exit 1 = at least one FAIL.

set -eu

VALIDATOR="scripts/validate-agent-factory.mjs"
FIX="scripts/fixtures"
FAILS=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

[ -f "$VALIDATOR" ] || { fail "validator present at $VALIDATOR"; printf '1 CHECK(S) FAILED\n'; exit 1; }
command -v node >/dev/null 2>&1 || { fail "node available on PATH"; printf '1 CHECK(S) FAILED\n'; exit 1; }

# A throwaway temp area cleaned on exit (success or failure). The split fixtures + the parity
# scratch areas live here; NOTHING outside $WORK is ever written (the real repo / $HOME are never
# mutated — T-09-09). Absolute paths so a probe run from an unrelated CWD still resolves them.
WORK=$(mktemp -d)
cleanup() { rm -rf -- "$WORK"; }
trap cleanup EXIT INT TERM

# Absolute path to the validator + the repo root (the parity check drives the installer doctors
# by absolute path, possibly from an unrelated CWD).
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
VALIDATOR_ABS="$REPO_ROOT/$VALIDATOR"

# run_fixture <root> [--strict] — run the validator against a fixture tree, print combined
# stdout+stderr, set RC. VAL-02: the validator now REQUIRES VALIDATE_KIT_ROOT (no default), so
# point BOTH roots at the same fixture tree — the single-tree fixtures are simultaneously their
# kit and their state (Discretion 4, back-compat). The `out=$(cmd) && rc=0 || rc=$?` idiom
# survives `set -eu` (cf. guard.test.sh:119, install.test.sh capture style).
run_fixture() { # run_fixture <root> [flag]
  if [ "$#" -ge 2 ] && [ -n "$2" ]; then
    OUT=$(VALIDATE_KIT_ROOT="$1" VALIDATE_ROOT="$1" node "$VALIDATOR" "$2" 2>&1) && RC=0 || RC=$?
  else
    OUT=$(VALIDATE_KIT_ROOT="$1" VALIDATE_ROOT="$1" node "$VALIDATOR" 2>&1) && RC=0 || RC=$?
  fi
}

# run_fixture_split <kit_root> <state_root> [flag] — VAL-02 two-root driver: export the kit root
# and the state root SEPARATELY, then capture rc. This is the genuine split surface (kit refs
# resolve under VALIDATE_KIT_ROOT, state refs under VALIDATE_ROOT).
run_fixture_split() { # run_fixture_split <kit_root> <state_root> [flag]
  if [ "$#" -ge 3 ] && [ -n "$3" ]; then
    OUT=$(VALIDATE_KIT_ROOT="$1" VALIDATE_ROOT="$2" node "$VALIDATOR" "$3" 2>&1) && RC=0 || RC=$?
  else
    OUT=$(VALIDATE_KIT_ROOT="$1" VALIDATE_ROOT="$2" node "$VALIDATOR" 2>&1) && RC=0 || RC=$?
  fi
}

# expect_pass_split <label> <kit_root> <state_root> — split fixture must exit 0.
expect_pass_split() {
  run_fixture_split "$2" "$3"
  if [ "$RC" -eq 0 ]; then pass "$1"; else fail "$1 (expected exit 0, got rc=$RC: $OUT)"; fi
}

# expect_fail_split <label> <kit_root> <state_root> <finding-token> — must exit nonzero + name it.
expect_fail_split() {
  run_fixture_split "$2" "$3"
  if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -qi "$4"; then
    pass "$1"
  else
    fail "$1 (expected nonzero + '$4', got rc=$RC: $OUT)"
  fi
}

# expect_pass <label> <root> — fixture must exit 0.
expect_pass() {
  run_fixture "$2"
  if [ "$RC" -eq 0 ]; then pass "$1"; else fail "$1 (expected exit 0, got rc=$RC: $OUT)"; fi
}

# expect_fail <label> <root> <finding-token> — fixture must exit nonzero AND name the defect.
expect_fail() {
  run_fixture "$2"
  if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -qi "$3"; then
    pass "$1"
  else
    fail "$1 (expected nonzero + '$3', got rc=$RC: $OUT)"
  fi
}

printf '== grugops validator self-test (GOOD/BAD fixtures + own-tree) ==\n\n'

# (a) D-42 — the validator is GREEN on grugops's own tree (bare AND --strict; zero tickets). VAL-02:
# the kit root IS the repo root here (agent-factory/ + AGENTS.md + .claude-plugin/ live there);
# the state root defaults to the repo root. Supply VALIDATE_KIT_ROOT explicitly (no default).
if VALIDATE_KIT_ROOT="$REPO_ROOT" node "$VALIDATOR" >/dev/null 2>&1; then pass "validator GREEN on grugops's own tree"
else fail "validator RED on own tree (should be green)"; fi
if VALIDATE_KIT_ROOT="$REPO_ROOT" node "$VALIDATOR" --strict >/dev/null 2>&1; then pass "validator GREEN on own tree --strict"
else fail "validator RED on own tree --strict (zero tickets → zero warnings)"; fi

# (b) GOOD fixture → exit 0.
expect_pass "GOOD fixture → exit 0" "$FIX/good"

# (c) BAD fixtures → nonzero + the finding naming the defect.
expect_fail "BAD bad-role-missing-section → nonzero + 'Hard limits'" "$FIX/bad-role-missing-section" "Hard limits"
expect_fail "BAD bad-config-no-mode → nonzero + 'mode'"               "$FIX/bad-config-no-mode"        "mode"
expect_fail "BAD bad-plugin-noname → nonzero + 'name'"                "$FIX/bad-plugin-noname"         "name"
expect_fail "BAD bad-ticket-mismatch → nonzero + 'status'"            "$FIX/bad-ticket-mismatch"       "status"
# WR-02: the column-membership branch (boardHasColumn === false) needs its OWN fixture.
# bad-ticket-mismatch uses a VALID column ("In Development"), so it only ever fires the
# status-mismatch finding — greping its output for the substring "column" was a false
# positive (that word lives inside the status message, not a distinct column error).
# bad-ticket-bad-column carries a ticket whose column is NOT a board heading and asserts
# the distinct "not a board column" finding, genuinely exercising the branch.
expect_fail "BAD bad-ticket-bad-column → nonzero + 'not a board column'" "$FIX/bad-ticket-bad-column" "not a board column"
# The role-switch / commit-convention hardening adds a per-workflow "## Commit" check. A check
# that can only pass is fabricated green — bad-workflow-no-commit is the GOOD tree minus the
# "## Commit" section in ONE workflow (04-ticket-to-pr), proving the new check can actually fail.
expect_fail "BAD bad-workflow-no-commit → nonzero + 'Commit'" "$FIX/bad-workflow-no-commit" "Commit"

# (d) warn-only-no-trace → exit 0 bare, nonzero under --strict (proves D-44 promotion).
expect_pass "WARN warn-only-no-trace bare → exit 0" "$FIX/warn-only-no-trace"
run_fixture "$FIX/warn-only-no-trace" "--strict"
if [ "$RC" -ne 0 ]; then pass "WARN warn-only-no-trace --strict → nonzero (promotion proven)"
else fail "WARN warn-only-no-trace --strict should be nonzero (rc=$RC: $OUT)"; fi

# (e) TWO-ROOT split (VAL-02 / Plan 09-04). Build the split fixtures hermetically from the
# existing GOOD fixture: KIT subtree (agent-factory/… + AGENTS.md + .claude-plugin/) vs STATE
# subtree (plans/…). No new fixture trees are committed — the split is derived (mktemp -d) so the
# kit/state classification is exercised from the SAME bytes the combined GOOD fixture proves.
printf '\n-- two-root split (VAL-02 / D-08, SC3/SC4) --\n'
GOOD_KIT="$WORK/good-split-kit"
GOOD_STATE="$WORK/good-split-state"
mkdir -p "$GOOD_KIT" "$GOOD_STATE"
# KIT root: everything the validator classifies as kit (Phase-7: agent-factory/, AGENTS.md,
# .claude-plugin/). STATE root: plans/. cp -R the relevant subtrees only.
cp -R -- "$FIX/good/agent-factory" "$GOOD_KIT/agent-factory"
cp -- "$FIX/good/AGENTS.md" "$GOOD_KIT/AGENTS.md"
[ -d "$FIX/good/.claude-plugin" ] && cp -R -- "$FIX/good/.claude-plugin" "$GOOD_KIT/.claude-plugin"
cp -R -- "$FIX/good/plans" "$GOOD_STATE/plans"

# (e.1) GOOD split — separate kit + state roots → exit 0.
expect_pass_split "SPLIT good (kit + state separate) → exit 0" "$GOOD_KIT" "$GOOD_STATE"

# (e.2) BAD missing-kit — VALIDATE_KIT_ROOT → a nonexistent dir, with a valid state root → fail
# naming a missing required role file (the kit refs all resolve under the absent kit root).
expect_fail_split "SPLIT bad-missing-kit (VALIDATE_KIT_ROOT→nonexistent) → nonzero + 'missing required'" \
  "$WORK/no-such-kit-dir" "$GOOD_STATE" "missing required"

# (e.3) BAD unset-kit (SC4 / the C3 no-`.`-fallback proof). Invoke the validator DIRECTLY with
# VALIDATE_KIT_ROOT UNSET — NOT via a driver that would set it. The `unset` subshell guarantees
# the env var is genuinely absent. The validator must exit nonzero AND name both the unset
# condition and the literal (C3) tag, proving it refuses to default the kit root to '.'.
OUT=$( ( unset VALIDATE_KIT_ROOT; node "$VALIDATOR" 2>&1 ) ) && RC=0 || RC=$?
if [ "$RC" -ne 0 ] \
   && printf '%s' "$OUT" | grep -qF 'VALIDATE_KIT_ROOT is unset' \
   && printf '%s' "$OUT" | grep -qF '(C3)'; then
  pass "SPLIT bad-unset-kit → nonzero + 'VALIDATE_KIT_ROOT is unset' + '(C3)' (no '.'-fallback)"
else
  fail "SPLIT bad-unset-kit should error with the (C3) message (rc=$RC: $OUT)"
fi

# (f) THREE-WAY RESOLUTION PARITY (Task 3 / SC4 / D-04). For ONE GRUGOPS_HOME the sh doctor, the
# Node doctor, and the Node validator must all resolve the SAME kit root — the mechanical guarantee
# that "doctor passes" and "validator passes" can never disagree about WHICH kit they validated.
# Gated on `command -v node` with a skip-with-note pass when node is absent (mirror the existing
# Node-presence pattern + install.two-root.test.sh Check 12). Hermetic: a mktemp -d GRUGOPS_HOME
# with a real kit installed; the real repo / $HOME are never mutated.
printf '\n-- three-way resolution parity (sh doctor = Node doctor = Node validator, SC4/D-04) --\n'
if command -v node >/dev/null 2>&1; then
  PARITY_H="$WORK/parity-home"
  PARITY_T="$WORK/parity-target"
  # Install a real two-root kit into the scratch GRUGOPS_HOME + target so all three programs have a
  # genuine kit to resolve (the installer is the source of truth for the one resolution rule).
  INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$PARITY_H" TARGET="$PARITY_T" \
    sh "$REPO_ROOT/install/install.sh" --yes >/dev/null 2>&1 || true

  # The one rule (installer): the kit lives at ${GRUGOPS_HOME}/agent-factory. Capture each
  # doctor's resolved kit DIR (the agent-factory directory itself) from its `kit:` line.
  # (1) sh doctor — the `kit:` line of `install.sh --check`.
  _sh_kit=$(GRUGOPS_HOME="$PARITY_H" TARGET="$PARITY_T" sh "$REPO_ROOT/install/install.sh" --check 2>&1 \
              | grep -F 'kit:' | head -n1 | sed 's/^kit:[[:space:]]*//')
  # (2) Node doctor — the `kit:` line of `install.mjs --check`.
  _mj_kit=$(GRUGOPS_HOME="$PARITY_H" TARGET="$PARITY_T" node "$REPO_ROOT/install/install.mjs" --check 2>&1 \
              | grep -F 'kit:' | head -n1 | sed 's/^kit:[[:space:]]*//')
  # (3) Node validator — it resolves kit refs as join(VALIDATE_KIT_ROOT, "agent-factory/…"), so
  #     its kit root is the PARENT that CONTAINS agent-factory/ (a deliberately different SPELLING
  #     of the same kit dir). Feed it VALIDATE_KIT_ROOT=${GRUGOPS_HOME} and it resolves the kit's
  #     agent-factory subtree to EXACTLY ${GRUGOPS_HOME}/agent-factory — the SAME directory the two
  #     doctors named. We prove that resolution AGREEMENT, not the home's full structural validity:
  #     the installer copies only agent-factory/ into the shared home (AGENTS.md/.claude-plugin/
  #     stay in the source checkout, by design), so a bare VALIDATE_KIT_ROOT=${GRUGOPS_HOME} run
  #     legitimately flags those two top-level files as missing — that is NOT a kit-root drift. The
  #     drift this guard forbids is the validator resolving agent-factory/ to a DIFFERENT path: if
  #     it resolved correctly to ${GRUGOPS_HOME}/agent-factory it finds every role/workflow/handoff
  #     there and emits NO "missing required role file" finding. So agreement = the doctors' kit dir
  #     equals ${VALIDATE_KIT_ROOT}/agent-factory AND the validator found the role tree at that path.
  _val_home="$PARITY_H"
  _val_kit_dir="$_val_home/agent-factory"   # the agent-factory subtree VALIDATE_KIT_ROOT=$_val_home resolves
  _val_out=$(VALIDATE_KIT_ROOT="$_val_home" VALIDATE_ROOT="$PARITY_T" node "$VALIDATOR" 2>&1) && _val_rc=0 || _val_rc=$?

  # All three must name the SAME kit dir (${GRUGOPS_HOME}/agent-factory) AND the validator must have
  # resolved the role tree to that path (no "missing required role file" finding) — otherwise a
  # program silently disagreed about WHICH agent-factory it validated (the SC4 false-green forbidden).
  if [ -n "$_sh_kit" ] \
     && [ "$_sh_kit" = "$_mj_kit" ] \
     && [ "$_sh_kit" = "$_val_kit_dir" ] \
     && ! printf '%s' "$_val_out" | grep -qiF 'missing required role file' \
     && ! printf '%s' "$_val_out" | grep -qiF 'missing required workflow file'; then
    pass "sh doctor = Node doctor = Node validator resolve the SAME kit ($_sh_kit)"
  else
    fail "resolution drift: sh-doctor=$_sh_kit node-doctor=$_mj_kit validator-kit-dir=$_val_kit_dir (validator rc=$_val_rc: $_val_out)"
  fi
else
  pass "node not found — three-way resolution parity skipped (UNKNOWN - verify with node present)"
fi

# ── Result ───────────────────────────────────────────────────────────────────────────────────
printf '\n'
if [ "$FAILS" -eq 0 ]; then
  printf 'ALL CHECKS PASSED\n'
  exit 0
else
  printf '%s CHECK(S) FAILED\n' "$FAILS"
  exit 1
fi
