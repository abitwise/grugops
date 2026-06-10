#!/usr/bin/env sh
# check-foundation-guards.test.sh — SDLC-02 / SC2 fail-proof harness for
# scripts/check-foundation-guards.sh.
#
# Proves the four foundation guards both PASS and FAIL — the no-fabrication contract (a gate
# that can only ever pass is fabricated green). It plants EXACTLY ONE real violation per guard
# into a hermetic throwaway copy of the inputs, runs the guard against that copy, and asserts
# each fails red (nonzero exit AND the finding names the defect — the expect_fail shape from
# validate.test.sh). Then a smoke run proves the REAL guard is GREEN over the REAL tree, and a
# `cmp -s` assertion proves the two config JSONs stay byte-identical (the tri-file drift Plan
# 10-03 must avoid — no existing gate catches a JSON↔JSON drift, so it lives here).
#
# The guard hard-codes repo-relative input paths, so each case is run hermetically by mirroring
# the guard's input files into $WORK/<case>/, copying the guard script alongside them, planting
# the ONE violation, and invoking the guard FROM that mirror (its relative paths then resolve to
# the mutated copy). NOTHING outside $WORK is ever written — the real repo and $HOME are never
# mutated (the validate.test.sh T-09-09 invariant).
#
# House style mirrors scripts/validate.test.sh: #!/usr/bin/env sh, set -eu, pass()/fail()/FAILS,
# printf (not echo -e), hermetic mktemp -d + trap cleanup, the `out=$(cmd) && rc=0 || rc=$?`
# capture idiom that survives set -e when the command is EXPECTED to fail, ALL CHECKS PASSED /
# N CHECK(S) FAILED, exit 0/1.
#
# Run from the repo root:  sh scripts/check-foundation-guards.test.sh
# Exit 0 = all checks PASS; exit 1 = at least one FAIL.

set -eu

GUARD="scripts/check-foundation-guards.sh"
FAILS=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

# Presence preamble — without the guard there is nothing to test.
[ -f "$GUARD" ] || { fail "guard present at $GUARD"; printf '1 CHECK(S) FAILED\n'; exit 1; }

# Absolute repo root + guard path, so a case run from inside $WORK still finds the source files
# it copies from. (The guard itself, once copied into the mirror, is invoked by its mirror path.)
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

# Hermetic throwaway area, cleaned on exit (success or failure). Every planted-violation mirror
# and every scratch file lives here; the real repo / $HOME are never touched.
WORK=$(mktemp -d)
cleanup() { rm -rf -- "$WORK"; }
trap cleanup EXIT INT TERM

# The complete set of input files the guard reads (repo-relative). A mirror is a $WORK/<case>
# tree carrying byte-faithful copies of all of these plus the guard script; one file is then
# mutated to plant the violation.
#
# All 16 role files are listed (D-05/D-06/D-07 expanded the role guards from the 3 voice surfaces
# to every role): guard_voice, guard_caveman_preserved, and guard_role_size each read all 16, so
# the mirror must copy all 16 into every hermetic case or the smoke/planted runs would FAIL on a
# missing role. `_role-switch-protocol.md` is NOT one of the 16 (no caveman block) — excluded.
GUARD_INPUTS="AGENTS.md \
.claude/skills/grugops/SKILL.md \
.claude/agents/grugops-orchestrator.md \
agent-factory/packaging/subagent.frontmatter.md \
agent-factory/packaging/slash-command.template.md \
agent-factory/roles/agents-md-scribe.md \
agent-factory/roles/architect-design.md \
agent-factory/roles/ba-pm.md \
agent-factory/roles/brownfield-mapper.md \
agent-factory/roles/compliance-officer.md \
agent-factory/roles/factory-coach.md \
agent-factory/roles/greenfield-mapper.md \
agent-factory/roles/incident-responder.md \
agent-factory/roles/installer.md \
agent-factory/roles/orchestrator.md \
agent-factory/roles/qe-e2e.md \
agent-factory/roles/release-manager.md \
agent-factory/roles/security-nfr.md \
agent-factory/roles/software-engineer.md \
agent-factory/roles/system-analyst.md \
agent-factory/roles/uat-planner.md"

# mirror <case> — build $WORK/<case> with byte-faithful copies of every guard input + the guard
# script itself, recreating the relative dir layout so the guard's hard-coded paths resolve. Echo
# the mirror dir on stdout. The caller plants ONE violation, then runs the guard from the mirror.
mirror() {
  m="$WORK/$1"
  mkdir -p "$m"
  for rel in $GUARD_INPUTS; do
    mkdir -p "$m/$(dirname -- "$rel")"
    cp -- "$REPO_ROOT/$rel" "$m/$rel"
  done
  mkdir -p "$m/scripts"
  cp -- "$REPO_ROOT/$GUARD" "$m/scripts/check-foundation-guards.sh"
  printf '%s' "$m"
}

# run_in <dir> — run the guard from inside the mirror dir so its relative paths resolve to the
# mutated copy; capture combined stdout+stderr in OUT and the exit code in RC (set -e safe).
run_in() {
  OUT=$( cd -- "$1" && sh scripts/check-foundation-guards.sh 2>&1 ) && RC=0 || RC=$?
}

# expect_fail <label> <mirror-dir> <finding-token> — the planted case MUST exit nonzero AND the
# output must name the defect (case-insensitive). This is the no-fabrication assertion: a guard
# that returns 0 here, or fails without naming the defect, is itself broken.
expect_fail() {
  run_in "$2"
  if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -qi "$3"; then
    pass "$1"
  else
    fail "$1 (expected nonzero + '$3', got rc=$RC: $OUT)"
  fi
}

printf '== foundation-guards fail-proof harness (SDLC-02 / SC2) ==\n\n'

# ---------------------------------------------------------------------------
# guard_wr05 — plant a frontmatter spawn grant in a scan-set file; assert it fails red.
# Two grant SHAPES, two cases (comma-form header + YAML-array item) — both must be caught
# (T-10-02-FN: a false-negative on either shape is a regression).
# ---------------------------------------------------------------------------
printf '%s\n' '-- guard_wr05 (both grant shapes) --'

M=$(mirror wr05-comma)
# Plant the comma-form grant by appending a tools: header line carrying an Agent token.
printf '\ntools: Read, Agent\n' >> "$M/.claude/agents/grugops-orchestrator.md"
expect_fail "wr05 comma-form (tools: ... Agent) → nonzero + 'spawn grant'" "$M" "spawn grant"

M=$(mirror wr05-array)
# Plant the YAML-array-item grant.
printf '\n  - Agent\n' >> "$M/.claude/skills/grugops/SKILL.md"
expect_fail "wr05 array-item (  - Agent) → nonzero + 'spawn grant'" "$M" "spawn grant"

# ---------------------------------------------------------------------------
# guard_agents_bytes — plant a >28672 B AGENTS.md; assert it fails red naming AGENTS.md.
# `yes` + head is portable; the padding pushes the file past the FAIL threshold (28672 B).
# ---------------------------------------------------------------------------
printf '\n-- guard_agents_bytes --\n'
M=$(mirror agents-oversize)
# Overwrite AGENTS.md with a >28672-byte body (30000 'x' chars + a trailing newline).
yes x | head -c 30000 > "$M/AGENTS.md"
printf '\n' >> "$M/AGENTS.md"
expect_fail "agents-bytes oversize (>28672B) → nonzero + 'AGENTS.md'" "$M" "AGENTS.md"

# guard_agents_bytes (CR-01) — plant a MISSING AGENTS.md; assert it fails red naming AGENTS.md.
# The oversize case above is a mutated-file violation; this is the OTHER failure mode — a deleted
# input must NOT vacuous-PASS. On macOS sh a missing AGENTS.md let `wc -c <` print an empty string
# (no abort under set -eu), `b` became "", both numeric tests evaluated false, and the guard fell
# through to a spurious PASS. Removing the mirrored file points the guard at an absent AGENTS.md.
M=$(mirror agents-missing)
rm -f "$M/AGENTS.md"
expect_fail "agents-bytes missing AGENTS.md → nonzero + 'AGENTS.md missing'" "$M" "AGENTS.md missing"

# ---------------------------------------------------------------------------
# guard_adapter_size — plant a >4096 B adapter; assert it fails red naming the adapter path.
# ---------------------------------------------------------------------------
printf '\n-- guard_adapter_size --\n'
M=$(mirror adapter-oversize)
yes x | head -c 5000 > "$M/.claude/skills/grugops/SKILL.md"
printf '\n' >> "$M/.claude/skills/grugops/SKILL.md"
expect_fail "adapter-size oversize (>4096B) → nonzero + adapter path" "$M" "SKILL.md"

# guard_adapter_size (CR-01) — plant a MISSING adapter; assert it fails red naming the path.
# Same vacuous-PASS class as agents-missing: a deleted adapter must fail red naming its path, not
# pass on an empty `wc -c <` byte count.
M=$(mirror adapter-missing)
rm -f "$M/.claude/agents/grugops-orchestrator.md"
expect_fail "adapter-size missing adapter → nonzero + 'missing'" "$M" "grugops-orchestrator.md missing"

# ---------------------------------------------------------------------------
# guard_voice — plant `grug smash` into a CLEAR-VOICE surface (NOT inside ## Caveman prompt);
# assert it fails red naming the role path. Appending at end-of-file lands well after the
# fenced caveman block, in clear-voice territory (the ## Hard limits tail).
# ---------------------------------------------------------------------------
printf '\n-- guard_voice --\n'
M=$(mirror voice-marker)
printf '\ngrug smash the bug.\n' >> "$M/agent-factory/roles/security-nfr.md"
expect_fail "voice marker in clear-voice surface → nonzero + role path" "$M" "security-nfr.md"

# guard_voice (CR-02) — plant a MISSING voice file; assert a STRUCTURED fail (nonzero + a finding
# naming the missing file), NOT a raw `awk: can't open file` abort. Under set -eu a non-zero awk
# exit inside the body=$(awk … "$f") command substitution aborted the whole script before the
# FAILS counter or the `== Result ==` summary ran; the fix asserts presence first so a deleted
# voice file degrades to a guarded finding. Removing the mirrored file points the guard at an
# absent role file.
M=$(mirror voice-missing)
rm -f "$M/agent-factory/roles/compliance-officer.md"
expect_fail "voice missing file → nonzero + 'compliance-officer.md' (structured, not awk abort)" "$M" "compliance-officer.md"

# guard_voice (D-05 refinement is NARROW, not weakened — T-11-07) — plant a NEW clear-voice grug
# phrase ("grug voice" / a `/grug` brand command) into a clear-voice surface; the refinement must
# ACCEPT it (still GREEN), proving the all-16 expansion's marker-neutralization is real. The
# `voice-marker` case above already proves a BARE `grug smash` STILL fails — so the refinement
# narrows the false positives without eroding the real catch.
M=$(mirror voice-refine-accept)
printf '\nThe Scribe may add a light grug wink in Mission; route every `/grug` request to grug voice.\n' >> "$M/agent-factory/roles/security-nfr.md"
run_in "$M"
if [ "$RC" -eq 0 ] && printf '%s' "$OUT" | grep -qF 'ALL CHECKS PASSED'; then
  pass "voice refinement accepts clear-voice grug-meta + /grug (narrow, not weakened)"
else
  fail "voice refinement should accept clear-voice grug-meta (rc=$RC: $OUT)"
fi

# ---------------------------------------------------------------------------
# guard_caveman_preserved (D-06 RED) — SAND the caveman voice off a role: replace the lines INSIDE
# the fenced `## Caveman prompt` block with marker-free professional prose (fences + rest of file
# preserved). Assert guard_caveman_preserved fails red naming the role + a caveman/sanded/marker
# token. This is the no-fabrication proof that D-06 cannot only-ever-pass.
# ---------------------------------------------------------------------------
printf '\n-- guard_caveman_preserved (D-06 RED) --\n'
M=$(mirror caveman-sanded)
awk '
  /^## Caveman prompt/ {seen=1; print; next}
  seen && /^```/ {
    fence++
    print
    if (fence==1) { print "The role evaluates the repository with professional diligence."; infence=1; next }
    if (fence==2) { infence=0; seen=0; next }
  }
  infence { next }
  { print }
' "$M/agent-factory/roles/brownfield-mapper.md" > "$M/agent-factory/roles/brownfield-mapper.sanded" \
  && mv "$M/agent-factory/roles/brownfield-mapper.sanded" "$M/agent-factory/roles/brownfield-mapper.md"
expect_fail "sanded caveman block → nonzero + 'no caveman marker'" "$M" "no caveman marker"

# guard_caveman_preserved (CR-02) — plant a MISSING role; assert a STRUCTURED fail naming the path,
# not a raw awk abort (same set -eu class as voice-missing). A deleted role must fail red.
M=$(mirror caveman-missing)
rm -f "$M/agent-factory/roles/ba-pm.md"
expect_fail "caveman missing role → nonzero + 'ba-pm.md' (structured, not awk abort)" "$M" "ba-pm.md"

# ---------------------------------------------------------------------------
# guard_role_size (D-07 RED) — BLOAT a role past its locked FAIL ceiling with the yes|head idiom
# (mirrors adapter-oversize). brownfield-mapper.md's FAIL ceiling is 2487 B; pad to 6000 B so it
# trips regardless. Assert guard_role_size fails red naming the role + 'bloated'.
# ---------------------------------------------------------------------------
printf '\n-- guard_role_size (D-07 RED) --\n'
M=$(mirror role-oversize)
yes x | head -c 6000 > "$M/agent-factory/roles/brownfield-mapper.md"
printf '\n' >> "$M/agent-factory/roles/brownfield-mapper.md"
expect_fail "oversize role (>ceiling) → nonzero + 'bloated'" "$M" "bloated"

# guard_role_size (CR-01) — plant a MISSING role; assert it fails red naming the path, not a
# vacuous-PASS on an empty `wc -c <` byte count (mirrors adapter-missing).
M=$(mirror role-size-missing)
rm -f "$M/agent-factory/roles/installer.md"
expect_fail "role-size missing role → nonzero + 'installer.md missing'" "$M" "installer.md missing"

# ---------------------------------------------------------------------------
# Smoke — the REAL guard over the REAL tree must be GREEN (exit 0). Proves the guards do not
# fabricate-fail: the clean tree passes (T-10-02-FP — no prose/`.grugops` false positives).
# ---------------------------------------------------------------------------
printf '\n-- smoke (real tree) --\n'
OUT=$( cd -- "$REPO_ROOT" && sh "$GUARD" 2>&1 ) && RC=0 || RC=$?
if [ "$RC" -eq 0 ] && printf '%s' "$OUT" | grep -qF 'ALL CHECKS PASSED'; then
  pass "smoke: real guard GREEN over the real tree"
else
  fail "smoke: real guard should be GREEN (rc=$RC: $OUT)"
fi

# ---------------------------------------------------------------------------
# cmp -s — the two config JSONs must be byte-identical (the tri-file drift Plan 10-03 must
# avoid; no existing gate catches a JSON↔JSON drift, so the foundation-guards test harness owns
# it). RESEARCH Pitfall 4.
# ---------------------------------------------------------------------------
printf '\n-- config-JSON byte identity (cmp -s) --\n'
if cmp -s "$REPO_ROOT/agent-factory/config/factory.config.json" "$REPO_ROOT/agent-factory/seed/.grugops/factory.config.json"; then
  pass "config JSONs byte-identical (config/ == seed/.grugops/)"
else
  fail "config JSON drift (config/ vs seed/.grugops/ diverge)"
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
