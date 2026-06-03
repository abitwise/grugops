#!/usr/bin/env sh
# guard.test.sh — SAFE-02 behavioral test harness for hooks/guard.mjs.
#
# This is the HIGH-severity gate for the grugops prod-deploy guard. It exercises the
# deny / allow / refuse-self-set triad as real shell+node fixtures: each fixture pipes a
# PreToolUse stdin JSON into `node hooks/guard.mjs` and asserts on the emitted deny JSON.
# A prompt cannot override a PreToolUse hook deny — so this harness proves the mechanism
# actually blocks, rather than trusting prose.
#
# It mirrors the repo's POSIX house style (Phase 3/4 check-structure.sh): `#!/usr/bin/env sh`,
# `set -eu`, small named helpers, `printf` not `echo -e`, `grep -qF`/`grep -q` for matching.
#
# Run from the repo root:  sh hooks/guard.test.sh
# Exit 0 = all checks PASS; exit 1 = at least one FAIL.

set -eu

GUARD="hooks/guard.mjs"
APPROVAL="GRUGOPS_PROD_DEPLOY_APPROVED"
FAILS=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

[ -f "$GUARD" ] || { fail "guard.mjs present at $GUARD"; printf '1 CHECK(S) FAILED\n'; exit 1; }
command -v node >/dev/null 2>&1 || { fail "node available on PATH"; printf '1 CHECK(S) FAILED\n'; exit 1; }

# Run the guard with the given stdin JSON; print stdout. Second arg, when set, is an env
# assignment passed to the guard process (e.g. the human-set approval var).
run() { # run <json> [envassign]
  if [ "$#" -ge 2 ] && [ -n "$2" ]; then
    printf '%s' "$1" | env "$2" node "$GUARD"
  else
    printf '%s' "$1" | node "$GUARD"
  fi
}

expect_deny() { # expect_deny <label> <json> [envassign]
  _out=$(run "$2" "${3:-}")
  if printf '%s' "$_out" | grep -q '"permissionDecision":"deny"'; then
    pass "$1"
  else
    fail "$1 (expected deny, got: $_out)"
  fi
}

expect_allow() { # expect_allow <label> <json> [envassign]
  _out=$(run "$2" "${3:-}")
  if printf '%s' "$_out" | grep -q '"deny"'; then
    fail "$1 (expected allow, got deny: $_out)"
  else
    pass "$1"
  fi
}

# ── The SAFE-02 behavioral triad ────────────────────────────────────────────────────────
# Fixture 1 — deploy, NO approval var present → DENY (fails closed).
expect_deny  "deny: matched deploy with no human approval" \
  '{"tool_input":{"command":"kubectl apply -f deploy.yaml"}}'

# Fixture 2 — deploy, approval var present in the hook's process env → ALLOW.
expect_allow "allow: matched deploy with human-set ${APPROVAL}" \
  '{"tool_input":{"command":"kubectl apply -f deploy.yaml"}}' "${APPROVAL}=1"

# Fixture 3 — command inline-sets the approval var → DENY even with the var also in env
# (the agent can never self-approve).
expect_deny  "refuse-self-set: inline export of ${APPROVAL}" \
  '{"tool_input":{"command":"export '"${APPROVAL}"'=1 && kubectl apply -f deploy.yaml"}}' "${APPROVAL}=1"

# ── Reinforcing checks (round out the safety surface) ─────────────────────────────────────
# Assignment-prefix self-set (no `export`) is also refused.
expect_deny  "refuse-self-set: assignment-prefix ${APPROVAL}=1 <deploy>" \
  '{"tool_input":{"command":"'"${APPROVAL}"'=1 helm upgrade rel ./chart"}}'

# Non-deploy command is allowed.
expect_allow "allow: non-deploy command (ls)" \
  '{"tool_input":{"command":"ls -la"}}'

# Default deploy-pattern set coverage (each must deny absent approval).
expect_deny  "deny: terraform apply"  '{"tool_input":{"command":"terraform apply -auto-approve"}}'
expect_deny  "deny: npm publish"      '{"tool_input":{"command":"npm publish"}}'
expect_deny  "deny: vercel --prod"    '{"tool_input":{"command":"vercel deploy --prod"}}'

# Fail-closed on malformed / empty stdin: never throws, never errors, allows only non-deploys.
_out=$(printf 'not json at all' | node "$GUARD" 2>&1); _rc=$?
if [ "$_rc" -eq 0 ] && ! printf '%s' "$_out" | grep -qi error; then
  pass "fail-closed: malformed stdin does not crash"
else
  fail "fail-closed: malformed stdin (rc=$_rc out=$_out)"
fi
_out=$(printf '' | node "$GUARD" 2>&1); _rc=$?
if [ "$_rc" -eq 0 ] && ! printf '%s' "$_out" | grep -qi error; then
  pass "fail-closed: empty stdin does not crash"
else
  fail "fail-closed: empty stdin (rc=$_rc out=$_out)"
fi

# ── Result ───────────────────────────────────────────────────────────────────────────────
if [ "$FAILS" -eq 0 ]; then
  printf 'ALL CHECKS PASSED\n'
  exit 0
else
  printf '%s CHECK(S) FAILED\n' "$FAILS"
  exit 1
fi
