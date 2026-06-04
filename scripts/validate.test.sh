#!/usr/bin/env sh
# validate.test.sh — VAL-01 / D-45 self-test for scripts/validate-agent-factory.mjs.
#
# Proves the structure validator both PASSES and FAILS — the no-fabrication contract (spec §18/
# §19.9) demands a gate that can actually fail. It runs the validator against:
#   (a) grugops's OWN tree (D-42 self-test)        → must be GREEN
#   (b) a minimal GOOD fixture tree                  → exit 0
#   (c) five one-mutation BAD/WARN fixture trees     → nonzero + the finding naming the defect
#   (d) the warn-only fixture under --strict          → exit 0 bare, nonzero under --strict
#       (proves the D-44 warning-promotion path)
#
# Each fixture is a committed tree under scripts/fixtures/ pointed at via VALIDATE_ROOT — the
# env-override idiom that lets one validator script run against many trees (mirrors
# install.test.sh's GRUGOPS_SRC/TARGET). No package.json is created; invocation is bare node.
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

# run_fixture <root> [--strict] — run the validator against a fixture tree, print combined
# stdout+stderr, set RC. The `out=$(cmd) && rc=0 || rc=$?` idiom survives `set -eu`
# (cf. guard.test.sh:119, install.test.sh capture style).
run_fixture() { # run_fixture <root> [flag]
  if [ "$#" -ge 2 ] && [ -n "$2" ]; then
    OUT=$(VALIDATE_ROOT="$1" node "$VALIDATOR" "$2" 2>&1) && RC=0 || RC=$?
  else
    OUT=$(VALIDATE_ROOT="$1" node "$VALIDATOR" 2>&1) && RC=0 || RC=$?
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

# (a) D-42 — the validator is GREEN on grugops's own tree (bare AND --strict; zero tickets).
if node "$VALIDATOR" >/dev/null 2>&1; then pass "validator GREEN on grugops's own tree"
else fail "validator RED on own tree (should be green)"; fi
if node "$VALIDATOR" --strict >/dev/null 2>&1; then pass "validator GREEN on own tree --strict"
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

# (d) warn-only-no-trace → exit 0 bare, nonzero under --strict (proves D-44 promotion).
expect_pass "WARN warn-only-no-trace bare → exit 0" "$FIX/warn-only-no-trace"
run_fixture "$FIX/warn-only-no-trace" "--strict"
if [ "$RC" -ne 0 ]; then pass "WARN warn-only-no-trace --strict → nonzero (promotion proven)"
else fail "WARN warn-only-no-trace --strict should be nonzero (rc=$RC: $OUT)"; fi

# ── Result ───────────────────────────────────────────────────────────────────────────────────
printf '\n'
if [ "$FAILS" -eq 0 ]; then
  printf 'ALL CHECKS PASSED\n'
  exit 0
else
  printf '%s CHECK(S) FAILED\n' "$FAILS"
  exit 1
fi
