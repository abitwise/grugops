#!/usr/bin/env sh
# check-structure.sh — Phase 3 Wave-0 structural test harness.
#
# This is the runnable acceptance criteria for the roles + AGENTS.md substrate phase.
# It is a MARKDOWN-AUTHORING test suite: structural / verbatim-fidelity / size-cap /
# no-fabrication / frozen-path drift checks built from grep / wc / test only. No runtime
# test runner exists or is needed (D-18). It mirrors what the Phase-6 Node validator
# (VAL-01) will later enforce, so building it now de-risks Phase 6.
#
#   The real Node validator is Phase-6/VAL-01 and is intentionally:  UNKNOWN - verify
#   (do NOT fabricate `node scripts/validate-agent-factory.mjs` here — that artifact
#    does not exist yet; D-18 forbids inventing a real command).
#
# Run from the repo root:  sh .planning/phases/03-roles-agents-md-substrate/check-structure.sh
# Exit 0 = all checks PASS; exit 1 = at least one FAIL.
# Every check goes RED until each authored file lands — that is expected for a greenfield
# authoring phase. The checks ARE the acceptance criteria, runnable the moment each file lands.

set -eu

ROLES_DIR="agent-factory/roles"
AGENTS="AGENTS.md"
FAILS=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

# All 16 role files (11 core + 5 enterprise), authored build-order (D-20).
CORE_ROLES="orchestrator agents-md-scribe brownfield-mapper greenfield-mapper ba-pm system-analyst architect-design software-engineer qe-e2e security-nfr uat-planner"
ENTERPRISE_ROLES="release-manager compliance-officer incident-responder factory-coach installer"
ALL_ROLES="$CORE_ROLES $ENTERPRISE_ROLES"

# The 9 §5 skeleton headings (verbatim, in order). grep against the bare names so the
# parenthetical forms (`## Output (file + format)` etc.) still match.
SKELETON_HEADINGS="## One job
## Caveman prompt
## Reads
## Activates when
## Responsibilities
## Output
## Board moves
## Trace updates
## Hard limits"

# The 15-item request-type classification tokens (responsibility 3, D-20).
CLASSIFICATION_TOKENS="greenfield-bootstrap brownfield-bootstrap idea-to-epics epic-to-tickets ticket-to-pr quality-gate uat refinement sprint-planning daily-sweep sprint-review retro release incident install"

printf '== Phase 3 structural check ==\n'

# ---------------------------------------------------------------------------
# (a) all 16 role files present, each containing the 9 §5 skeleton headings.
#     grep -L prints any file MISSING the pattern → any printed path = a fail.
# ---------------------------------------------------------------------------
printf '\n[a] 16 role files present, 9 skeleton headings each\n'
for r in $ALL_ROLES; do
  f="$ROLES_DIR/$r.md"
  if [ ! -f "$f" ]; then
    fail "$f missing"
    continue
  fi
  missing=""
  # iterate the 9 headings; grep -L $f prints $f when the heading is absent
  printf '%s\n' "$SKELETON_HEADINGS" | while IFS= read -r h; do
    [ -z "$h" ] && continue
    out=$(grep -L -F -- "$h" "$f" 2>/dev/null || true)
    [ -n "$out" ] && printf '%s\n' "$h"
  done > /tmp/cs_missing.$$ || true
  missing=$(cat /tmp/cs_missing.$$ 2>/dev/null || true)
  rm -f /tmp/cs_missing.$$
  if [ -n "$missing" ]; then
    fail "$f missing section(s): $(printf '%s' "$missing" | tr '\n' ',' | sed 's/,$//')"
  else
    pass "$f — 9/9 sections"
  fi
done

# ---------------------------------------------------------------------------
# (b) frontmatter tier counts: tier: core == 11, tier: enterprise == 5 (D-16).
# ---------------------------------------------------------------------------
printf '\n[b] frontmatter tier counts (11 core / 5 enterprise)\n'
core_count=$(grep -l 'tier: core' "$ROLES_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
ent_count=$(grep -l 'tier: enterprise' "$ROLES_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
[ "$core_count" = "11" ] && pass "tier: core == 11" || fail "tier: core == $core_count (want 11)"
[ "$ent_count" = "5" ] && pass "tier: enterprise == 5" || fail "tier: enterprise == $ent_count (want 5)"

# ---------------------------------------------------------------------------
# (c) three D-17 universal lines present in EVERY role file:
#     factory.config.json (Reads first), plans/board.md (Board moves),
#     plans/traceability.md (Trace updates). grep -L over all roles must be empty.
# ---------------------------------------------------------------------------
printf '\n[c] D-17 universal lines in every role (config-first / board / trace)\n'
for pat in 'factory.config.json' 'plans/board.md' 'plans/traceability.md'; do
  if ls "$ROLES_DIR"/*.md >/dev/null 2>&1; then
    miss=$(grep -L -F -- "$pat" "$ROLES_DIR"/*.md 2>/dev/null || true)
  else
    miss="(no role files yet)"
  fi
  if [ -n "$miss" ]; then
    fail "'$pat' missing from: $(printf '%s' "$miss" | tr '\n' ' ')"
  else
    pass "'$pat' present in all roles"
  fi
done

# ---------------------------------------------------------------------------
# (d) Orchestrator content: SPLIT_REQUIRED, definition-of-ready, Never merge,
#     all 15 classification tokens, and the 00-..13- workflow-name references.
# ---------------------------------------------------------------------------
printf '\n[d] orchestrator.md routing contract content\n'
ORCH="$ROLES_DIR/orchestrator.md"
if [ ! -f "$ORCH" ]; then
  fail "$ORCH missing — cannot check routing contract"
else
  for pat in 'SPLIT_REQUIRED' 'definition-of-ready' 'Never merge'; do
    if grep -q -F -- "$pat" "$ORCH" 2>/dev/null; then
      pass "orchestrator contains '$pat'"
    else
      fail "orchestrator missing '$pat'"
    fi
  done
  # 15 classification tokens
  missing_tokens=""
  for t in $CLASSIFICATION_TOKENS; do
    grep -q -F -- "$t" "$ORCH" 2>/dev/null || missing_tokens="$missing_tokens $t"
  done
  if [ -n "$missing_tokens" ]; then
    fail "orchestrator missing classification token(s):$missing_tokens"
  else
    pass "orchestrator carries all 15 classification tokens"
  fi
  # Workflow-name references 00-..13-. Filter comment/quote-fence noise first so prose
  # cannot self-invalidate the count (grep-gate hygiene). Count distinct 00-..13- refs.
  wf_count=$(grep -v '^#' "$ORCH" 2>/dev/null \
    | grep -o -E '(0[0-9]|1[0-3])-[a-z]' 2>/dev/null \
    | sort -u | wc -l | tr -d ' ')
  if [ "$wf_count" -ge 14 ]; then
    pass "orchestrator names $wf_count workflow files (00-..13-)"
  else
    fail "orchestrator names only $wf_count workflow files (want >= 14)"
  fi
fi

# ---------------------------------------------------------------------------
# (e) AGENTS.md: exists, §17.1 headings present, < 32768 bytes (Codex cap),
#     UNKNOWN - verify count >= the 7 Commands slots (no fabricated command).
# ---------------------------------------------------------------------------
printf '\n[e] root AGENTS.md substrate (shape / 32 KiB cap / UNKNOWN-verify)\n'
if [ ! -f "$AGENTS" ]; then
  fail "$AGENTS missing"
else
  pass "$AGENTS exists"
  # §17.1 headings (verbatim from spec L399-442)
  for h in '## Mission' '## How to work here' '## Commands' '## Safety rules' '## When uncertain'; do
    if grep -q -F -- "$h" "$AGENTS" 2>/dev/null; then
      pass "AGENTS.md has '$h'"
    else
      fail "AGENTS.md missing '$h'"
    fi
  done
  # 32 KiB Codex cap (project_doc_max_bytes)
  bytes=$(wc -c < "$AGENTS" | tr -d ' ')
  if [ "$bytes" -lt 32768 ]; then
    pass "AGENTS.md $bytes bytes < 32768"
  else
    fail "AGENTS.md $bytes bytes >= 32768 (over Codex cap)"
  fi
  # No fabricated command: every Commands slot ships 'UNKNOWN - verify'. The 7 §17.1
  # subheadings (Install/Development/Test/Lint/Typecheck/Build/E2E) each need a slot.
  uv_count=$(grep -c -F 'UNKNOWN - verify' "$AGENTS" 2>/dev/null || true)
  uv_count=${uv_count:-0}
  if [ "$uv_count" -ge 7 ]; then
    pass "AGENTS.md UNKNOWN - verify count == $uv_count (>= 7 slots)"
  else
    fail "AGENTS.md UNKNOWN - verify count == $uv_count (want >= 7)"
  fi
fi

# ---------------------------------------------------------------------------
# (f) drift guard: NO role cites a plans/<name>-handoff path. The real handoffs
#     live under agent-factory/handoffs/. grep -l must be empty.
# ---------------------------------------------------------------------------
printf '\n[f] drift guard — no role cites plans/*-handoff\n'
if ls "$ROLES_DIR"/*.md >/dev/null 2>&1; then
  drift=$(grep -l -E 'plans/.*-handoff' "$ROLES_DIR"/*.md 2>/dev/null || true)
else
  drift=""
fi
if [ -n "$drift" ]; then
  fail "plans/*-handoff cited in: $(printf '%s' "$drift" | tr '\n' ' ')"
else
  pass "no role cites plans/*-handoff"
fi

# ---------------------------------------------------------------------------
# (g) single-source 12-rules: only AGENTS.md / agents-md-scribe carry rule text.
#     No OTHER role restates a distinctive rule phrase (D-19). Use distinctive
#     phrases from the 12 rules; any non-Scribe role containing them = drift.
# ---------------------------------------------------------------------------
printf '\n[g] single-source 12 rules (no non-Scribe role restates rule text)\n'
RULE_PHRASES="No single-use abstractions
No unrequested flexibility
Preserve adjacent code
Match existing style"
restate=""
for r in $ALL_ROLES; do
  # the Scribe owns/echoes the rules; AGENTS.md is the single source — both exempt
  [ "$r" = "agents-md-scribe" ] && continue
  f="$ROLES_DIR/$r.md"
  [ -f "$f" ] || continue
  printf '%s\n' "$RULE_PHRASES" | while IFS= read -r p; do
    [ -z "$p" ] && continue
    grep -q -F -- "$p" "$f" 2>/dev/null && printf '%s ' "$f"
  done >> /tmp/cs_restate.$$ 2>/dev/null || true
done
restate=$(cat /tmp/cs_restate.$$ 2>/dev/null | tr -s ' ' || true)
rm -f /tmp/cs_restate.$$
if [ -n "$restate" ]; then
  fail "non-Scribe role(s) restate 12-rules text: $restate"
else
  pass "12 rules single-sourced (no non-Scribe restatement)"
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
