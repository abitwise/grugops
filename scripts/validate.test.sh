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

# (g) NULL-LITERAL FAIL-CLOSED REGRESSION (CR-03 / GAP-3 / VAL-02). JSON.parse("null") is valid
# ECMAScript that returns null WITHOUT throwing, so the validator's try/catch passes silently —
# then the cfg[key] / manifest.name deref crashed with an uncaught TypeError (a Node stack trace,
# NOT the documented greppable finding), violating the file-header fail-closed invariant and
# skipping every check after the crash. These two checks feed the EXACT crashing input
# (`printf 'null' > …`) and assert the validator now degrades it to a finding: nonzero exit + a
# 'not a JSON object' finding + NO TypeError / stack trace. RED before the Task-1 guards, GREEN
# after. Hermetic: each kit tree is built under $WORK from $FIX/good (cp -R), so the real repo is
# never mutated; $WORK is already trapped for cleanup.
printf '\n-- null-literal fail-closed regression (CR-03 / GAP-3) --\n'

# (g.1) null-literal factory.config.json → finding, not a TypeError.
NULLCFG_KIT="$WORK/null-config-kit"
mkdir -p "$NULLCFG_KIT"
cp -R -- "$FIX/good/agent-factory" "$NULLCFG_KIT/agent-factory"
cp -- "$FIX/good/AGENTS.md" "$NULLCFG_KIT/AGENTS.md"
[ -d "$FIX/good/.claude-plugin" ] && cp -R -- "$FIX/good/.claude-plugin" "$NULLCFG_KIT/.claude-plugin"
printf 'null' > "$NULLCFG_KIT/agent-factory/config/factory.config.json"
OUT=$(VALIDATE_KIT_ROOT="$NULLCFG_KIT" VALIDATE_ROOT="$NULLCFG_KIT" node "$VALIDATOR" 2>&1) && RC=0 || RC=$?
if [ "$RC" -ne 0 ] \
   && printf '%s' "$OUT" | grep -qiF 'not a JSON object' \
   && ! printf '%s' "$OUT" | grep -qF 'TypeError' \
   && ! printf '%s' "$OUT" | grep -qiF 'at Object.<anonymous>'; then
  pass "null-literal factory.config.json → finding, not a TypeError"
else
  fail "null-literal factory.config.json should be a finding, not a crash (rc=$RC: $OUT)"
fi

# (g.2) null-literal plugin.json → finding, not a TypeError.
NULLPLG_KIT="$WORK/null-plugin-kit"
mkdir -p "$NULLPLG_KIT"
cp -R -- "$FIX/good/agent-factory" "$NULLPLG_KIT/agent-factory"
cp -- "$FIX/good/AGENTS.md" "$NULLPLG_KIT/AGENTS.md"
[ -d "$FIX/good/.claude-plugin" ] && cp -R -- "$FIX/good/.claude-plugin" "$NULLPLG_KIT/.claude-plugin"
mkdir -p "$NULLPLG_KIT/.claude-plugin"
printf 'null' > "$NULLPLG_KIT/.claude-plugin/plugin.json"
OUT=$(VALIDATE_KIT_ROOT="$NULLPLG_KIT" VALIDATE_ROOT="$NULLPLG_KIT" node "$VALIDATOR" 2>&1) && RC=0 || RC=$?
if [ "$RC" -ne 0 ] \
   && printf '%s' "$OUT" | grep -qiF 'not a JSON object' \
   && ! printf '%s' "$OUT" | grep -qF 'TypeError' \
   && ! printf '%s' "$OUT" | grep -qiF 'at Object.<anonymous>'; then
  pass "null-literal plugin.json → finding, not a TypeError"
else
  fail "null-literal plugin.json should be a finding, not a crash (rc=$RC: $OUT)"
fi

# (h) OPTIONAL-ENUM RECOGNITION of the 8 new v1.2 dial keys (SDLC-03 / D-14 / SC3 / SC4 /
# TINT-03 — Plan 10-04). The validator now enum-checks the 8 keys ONLY WHEN PRESENT: an invalid
# present value is err() (nonzero, even bare); a MISSING key is its lean default (no error,
# preserving zero-config SC4). All fixtures are built HERMETICALLY under $WORK from $FIX/good
# (mktemp -d, mutate one key) — NO committed bad-fixture dir is added (RESEARCH Open Question 2,
# matching the repo's null-literal/split pattern). The real repo / $HOME are never mutated.
printf '\n-- optional-enum dial keys (SDLC-03 / D-14, SC3/SC4/TINT-03) --\n'

# (h.1) INVALID-ENUM fail-proof: an out-of-enum security.asvs_level "L4" makes the validator fail
# red and NAME the key (the no-fabrication contract made mechanical — T-10-04-RT). Build a kit
# copy, add a security object carrying the illegal value, run the validator over it.
BAD_ASVS_KIT="$WORK/bad-asvs-kit"
mkdir -p "$BAD_ASVS_KIT"
cp -R -- "$FIX/good/agent-factory" "$BAD_ASVS_KIT/agent-factory"
cp -- "$FIX/good/AGENTS.md" "$BAD_ASVS_KIT/AGENTS.md"
[ -d "$FIX/good/.claude-plugin" ] && cp -R -- "$FIX/good/.claude-plugin" "$BAD_ASVS_KIT/.claude-plugin"
cp -R -- "$FIX/good/plans" "$BAD_ASVS_KIT/plans"
# Mutate ONLY the config: add a security object with an out-of-enum asvs_level (fixtures/good
# carries no security object, so add the minimal { "asvs_level": "L4" } to trigger the check).
node -e '
const fs = require("fs");
const p = process.argv[1];
const c = JSON.parse(fs.readFileSync(p, "utf8"));
c.security = { asvs_level: "L4" };
fs.writeFileSync(p, JSON.stringify(c, null, 2));
' "$BAD_ASVS_KIT/agent-factory/config/factory.config.json"
OUT=$(VALIDATE_KIT_ROOT="$BAD_ASVS_KIT" VALIDATE_ROOT="$BAD_ASVS_KIT" node "$VALIDATOR" 2>&1) && RC=0 || RC=$?
if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -qi 'asvs_level'; then
  pass "ENUM bad-asvs (security.asvs_level=L4) → nonzero + 'asvs_level'"
else
  fail "ENUM bad-asvs should fail red + name asvs_level (rc=$RC: $OUT)"
fi
# Guard against accidentally committing a bad-fixture dir for this case (RESEARCH Open Question 2).
if [ ! -d "$FIX/bad-config-bad-asvs" ]; then
  pass "ENUM bad-asvs built hermetically (no committed scripts/fixtures/bad-config-bad-asvs dir)"
else
  fail "ENUM bad-asvs should be hermetic — committed fixture dir scripts/fixtures/bad-config-bad-asvs exists"
fi

# (h.2) TINT-03 carve-out: quality.test_integrity "off" is rejected — "off" is NOT in the
# enum (warn|block), so a config trying to DISABLE trace-integrity fails red + names the key
# (T-10-04-T1, the trace-integrity safety carve-out made mechanical).
BAD_TINT_KIT="$WORK/bad-tint-kit"
mkdir -p "$BAD_TINT_KIT"
cp -R -- "$FIX/good/agent-factory" "$BAD_TINT_KIT/agent-factory"
cp -- "$FIX/good/AGENTS.md" "$BAD_TINT_KIT/AGENTS.md"
[ -d "$FIX/good/.claude-plugin" ] && cp -R -- "$FIX/good/.claude-plugin" "$BAD_TINT_KIT/.claude-plugin"
cp -R -- "$FIX/good/plans" "$BAD_TINT_KIT/plans"
node -e '
const fs = require("fs");
const p = process.argv[1];
const c = JSON.parse(fs.readFileSync(p, "utf8"));
c.quality = Object.assign({}, c.quality, { test_integrity: "off" });
fs.writeFileSync(p, JSON.stringify(c, null, 2));
' "$BAD_TINT_KIT/agent-factory/config/factory.config.json"
OUT=$(VALIDATE_KIT_ROOT="$BAD_TINT_KIT" VALIDATE_ROOT="$BAD_TINT_KIT" node "$VALIDATOR" 2>&1) && RC=0 || RC=$?
if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -qi 'test_integrity'; then
  pass "ENUM bad-tint (quality.test_integrity=off) → nonzero + 'test_integrity' (TINT-03)"
else
  fail "ENUM bad-tint should reject 'off' + name test_integrity (rc=$RC: $OUT)"
fi

# (h.2b) WR-01 safety floor: production_requires_human_confirmation=false is REJECTED — the field
# has NO false value in any mode (factory.config.md:28 "Must stay `true`"), so a config trying to
# dial off the no-agent-deploy guard fails red + names the key. Same class as the TINT-03 carve-out;
# proves the new checkConfig() safety-floor check can actually fail (a check that can only pass is
# fabricated green). Hermetic: built under $WORK from $FIX/good, real repo never mutated.
BAD_PROD_KIT="$WORK/bad-prod-confirm-kit"
mkdir -p "$BAD_PROD_KIT"
cp -R -- "$FIX/good/agent-factory" "$BAD_PROD_KIT/agent-factory"
cp -- "$FIX/good/AGENTS.md" "$BAD_PROD_KIT/AGENTS.md"
[ -d "$FIX/good/.claude-plugin" ] && cp -R -- "$FIX/good/.claude-plugin" "$BAD_PROD_KIT/.claude-plugin"
cp -R -- "$FIX/good/plans" "$BAD_PROD_KIT/plans"
node -e '
const fs = require("fs");
const p = process.argv[1];
const c = JSON.parse(fs.readFileSync(p, "utf8"));
c.production_requires_human_confirmation = false;
fs.writeFileSync(p, JSON.stringify(c, null, 2));
' "$BAD_PROD_KIT/agent-factory/config/factory.config.json"
OUT=$(VALIDATE_KIT_ROOT="$BAD_PROD_KIT" VALIDATE_ROOT="$BAD_PROD_KIT" node "$VALIDATOR" 2>&1) && RC=0 || RC=$?
if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -qi 'production_requires_human_confirmation'; then
  pass "WR-01 prod-confirm=false → nonzero + 'production_requires_human_confirmation' (safety floor)"
else
  fail "WR-01 prod-confirm=false should be rejected + name the key (rc=$RC: $OUT)"
fi

# (h.3) ABSENT-KEYS-PASS (SC4, the load-bearing zero-config assertion). fixtures/good carries
# NONE of the 8 new keys; the validator must still exit 0 because each absent key degrades to its
# lean default (T-10-04-SC4 — a required-key regression would break this). Reuse expect_pass over
# the UNMODIFIED good fixture.
expect_pass "ENUM absent-keys (fixtures/good has none of the 8) → exit 0 (SC4)" "$FIX/good"

# (h.4) BYTE-IDENTITY (Pitfall 4): the two real config JSONs (config/ + seed/.grugops/) must stay
# byte-identical so the tri-file dial edit never silently drifts. Read-only `cmp -s` over the REAL
# tree (the one sanctioned real-tree read; everything else is hermetic). Complements the same
# assertion in the foundation-guards harness (Plan 10-02) — both gates catch a JSON/JSON drift.
if cmp -s "$REPO_ROOT/agent-factory/config/factory.config.json" \
          "$REPO_ROOT/agent-factory/seed/.grugops/factory.config.json"; then
  pass "config JSONs byte-identical (config/ == seed/.grugops/) via cmp -s"
else
  fail "config JSON drift (config/ vs seed/ diverge)"
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
