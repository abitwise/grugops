#!/usr/bin/env sh
# check-structure.sh — Phase 5 Wave-0 structural test harness.
#
# This is the runnable acceptance criteria for the packaging / adapters / install /
# distribution phase. It is a MARKDOWN-AND-SCRIPT-PRESENCE test suite: structural / schema-
# presence / single-source / no-fabrication checks built from grep / wc / test only. It
# mirrors the proven Phase-3/4 precedent
# (.planning/phases/04-workflows-cadence-backpressure/check-structure.sh) and what the
# Phase-6 Node validator (VAL-01) will later enforce, so building it now de-risks Phase 6.
#
#   The real Node validator is Phase-6/VAL-01 and is intentionally:  UNKNOWN - verify
#   (do NOT fabricate `node scripts/validate-agent-factory.mjs` here — that artifact does
#    not exist yet; D-18 forbids inventing a real command. Likewise the authoritative plugin
#    schema gate `claude plugin validate ./ --strict` is a Phase gate, not invoked here.)
#
# Run from the repo root:  sh .planning/phases/05-packaging-adapters-install-distribution/check-structure.sh
# Exit 0 = all checks PASS; exit 1 = at least one FAIL.
#
# This harness SHIPS RED. After Plan 05-01 (Tasks 1-2) only the PKG-01 and PKG-02 checks
# pass; the CLAUDE / SAFE / INSTALL checks FAIL because Waves 2-3 have not landed yet. That
# is EXPECTED and by design — the checks ARE the acceptance criteria, runnable the moment
# each artifact lands. RED here is a missing-artifact signal, never a shell error.
#
# Encodes one structural check per Phase-5 requirement from 05-VALIDATION.md
# § Requirement → Test Map: PKG-01, PKG-02, CLAUDE-01, CLAUDE-02, CLAUDE-03, SAFE-02,
# INSTALL-01, INSTALL-02.

set -eu

PKG_DIR="agent-factory/packaging"
ADAPTERS="$PKG_DIR/adapters.md"
SUBAGENT="$PKG_DIR/subagent.frontmatter.md"
SLASHCMD="$PKG_DIR/slash-command.template.md"
ORCH="agent-factory/roles/orchestrator.md"
FAILS=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

printf '== Phase 5 structural check (ships RED until Waves 2-3 land) ==\n'

# ---------------------------------------------------------------------------
# (PKG-01) agent-factory/packaging/adapters.md maps 5 tools, restates the
#          "only the dispatch differs" slogan, flags every row "verify against
#          current tool docs" (>= 5), cites orchestrator.md + autonomy=pr, and
#          uses no docs.claude.com link. Count gate filters comment lines first.
# ---------------------------------------------------------------------------
printf '\n[PKG-01] adapters.md 5-tool dispatch map + slogans + verify flags\n'
if [ ! -f "$ADAPTERS" ]; then
  fail "$ADAPTERS missing"
else
  grep -qF 'only the dispatch differs' "$ADAPTERS" 2>/dev/null \
    && pass "adapters.md restates 'only the dispatch differs'" \
    || fail "adapters.md missing 'only the dispatch differs'"
  # count "verify ... docs" flags on non-comment lines (>= 5, one per tool row)
  vcount=$(grep -v '^#' "$ADAPTERS" 2>/dev/null | grep -c 'verify against current' || true)
  vcount=${vcount:-0}
  [ "$vcount" -ge 5 ] && pass "adapters.md flags >= 5 rows 'verify against current ... docs' ($vcount)" \
    || fail "adapters.md flags only $vcount rows 'verify against current ... docs' (want >= 5)"
  grep -qF 'orchestrator.md' "$ADAPTERS" 2>/dev/null \
    && pass "adapters.md cites the orchestrator.md entry rule" \
    || fail "adapters.md missing orchestrator.md entry rule"
  grep -qF 'autonomy=pr' "$ADAPTERS" 2>/dev/null \
    && pass "adapters.md documents the autonomy=pr fallback" \
    || fail "adapters.md missing autonomy=pr fallback"
  if grep -qF 'docs.claude.com' "$ADAPTERS" 2>/dev/null; then
    fail "adapters.md cites the redirecting docs.claude.com host (use code.claude.com)"
  else
    pass "adapters.md uses only the code.claude.com doc host"
  fi
fi

# ---------------------------------------------------------------------------
# (PKG-02) the wrapper templates use `Agent` (not the legacy `Task`), carry
#          `model: inherit`, and the skill template names + points at orchestrator.md.
# ---------------------------------------------------------------------------
printf '\n[PKG-02] wrapper templates use Agent (not Task) + model: inherit\n'
if [ ! -f "$SUBAGENT" ]; then
  fail "$SUBAGENT missing"
else
  grep -qF 'Agent' "$SUBAGENT" 2>/dev/null \
    && pass "subagent template uses Agent" \
    || fail "subagent template missing Agent"
  if grep -qw 'Task' "$SUBAGENT" 2>/dev/null; then
    fail "subagent template contains the legacy 'Task' token (use Agent)"
  else
    pass "subagent template has no legacy 'Task' token"
  fi
  grep -qF 'model: inherit' "$SUBAGENT" 2>/dev/null \
    && pass "subagent template carries model: inherit" \
    || fail "subagent template missing model: inherit"
fi
if [ ! -f "$SLASHCMD" ]; then
  fail "$SLASHCMD missing"
else
  grep -qF 'name:' "$SLASHCMD" 2>/dev/null \
    && pass "skill template has a name: frontmatter key" \
    || fail "skill template missing name: frontmatter key"
  grep -qF 'orchestrator.md' "$SLASHCMD" 2>/dev/null \
    && pass "skill template points at orchestrator.md" \
    || fail "skill template missing orchestrator.md pointer"
fi

# ---------------------------------------------------------------------------
# (PKG single-source dup-check) no distinctive Orchestrator role-body sentence
#          appears in any packaging file (pointer-only, T-05-01).
# ---------------------------------------------------------------------------
printf '\n[PKG dup-check] packaging files are pointer-only (no copied role body)\n'
DISTINCT='demands a handoff packet from each'
if ls "$PKG_DIR"/*.md >/dev/null 2>&1; then
  dup=$(grep -lF "$DISTINCT" "$PKG_DIR"/*.md 2>/dev/null || true)
  if [ -n "$dup" ]; then
    fail "packaging file copies a distinctive role sentence: $(printf '%s' "$dup" | tr '\n' ' ')"
  else
    pass "no packaging file copies the distinctive Orchestrator role sentence"
  fi
else
  fail "no packaging *.md files present"
fi

# ---------------------------------------------------------------------------
# (CLAUDE-01) standalone dash skills: exactly 7 .claude/skills/grugops*/SKILL.md.
#             Ships RED until Wave 2 lands the standalone form.
# ---------------------------------------------------------------------------
printf '\n[CLAUDE-01] 7 standalone dash skills (.claude/skills/grugops*/SKILL.md)\n'
skill_count=$(ls .claude/skills/grugops*/SKILL.md 2>/dev/null | wc -l | tr -d ' ')
skill_count=${skill_count:-0}
[ "$skill_count" -eq 7 ] \
  && pass "exactly 7 standalone grugops* skills present" \
  || fail "found $skill_count standalone grugops* skills (want 7) — Wave 2 not landed"

# ---------------------------------------------------------------------------
# (CLAUDE-02) plugin manifest: .claude-plugin/plugin.json with name grugops;
#             skills/ and hooks/ at the plugin ROOT; .claude-plugin/ holds ONLY
#             plugin.json + marketplace.json (the #1 plugin mistake guard).
#             Ships RED until Wave 2 lands the plugin form.
# ---------------------------------------------------------------------------
printf '\n[CLAUDE-02] plugin.json (name grugops) + root skills/ & hooks/ + clean .claude-plugin/\n'
if [ ! -f ".claude-plugin/plugin.json" ]; then
  fail ".claude-plugin/plugin.json missing — Wave 2 not landed"
else
  grep -qF '"name"' ".claude-plugin/plugin.json" 2>/dev/null \
    && grep -qF 'grugops' ".claude-plugin/plugin.json" 2>/dev/null \
    && pass "plugin.json declares name grugops" \
    || fail "plugin.json missing name grugops"
fi
[ -d "skills" ] && pass "skills/ exists at plugin root" || fail "skills/ missing at plugin root — Wave 2 not landed"
[ -d "hooks" ] && pass "hooks/ exists at plugin root" || fail "hooks/ missing at plugin root — Wave 2/3 not landed"
# .claude-plugin/ must hold only plugin.json + marketplace.json (ignore .gitkeep)
if [ -d ".claude-plugin" ]; then
  stray=$(ls .claude-plugin 2>/dev/null | grep -v '^\.gitkeep$' | grep -vx 'plugin.json' | grep -vx 'marketplace.json' || true)
  if [ -n "$stray" ]; then
    fail ".claude-plugin/ holds non-manifest file(s): $(printf '%s' "$stray" | tr '\n' ' ')"
  else
    pass ".claude-plugin/ holds only plugin.json + marketplace.json (no stray components)"
  fi
else
  fail ".claude-plugin/ dir missing"
fi

# ---------------------------------------------------------------------------
# (CLAUDE-03) hooks/hooks.json references ${CLAUDE_PLUGIN_ROOT} and contains no
#             hardcoded absolute /Users/ or /home/ path. Ships RED until Wave 3.
# ---------------------------------------------------------------------------
printf '\n[CLAUDE-03] hooks.json uses ${CLAUDE_PLUGIN_ROOT}, no hardcoded abs paths\n'
if [ ! -f "hooks/hooks.json" ]; then
  fail "hooks/hooks.json missing — Wave 3 (SAFE-02) not landed"
else
  grep -qF 'CLAUDE_PLUGIN_ROOT' "hooks/hooks.json" 2>/dev/null \
    && pass "hooks.json references \${CLAUDE_PLUGIN_ROOT}" \
    || fail "hooks.json missing \${CLAUDE_PLUGIN_ROOT}"
  if grep -qE '/Users/|/home/' "hooks/hooks.json" 2>/dev/null; then
    fail "hooks.json contains a hardcoded /Users/ or /home/ path"
  else
    pass "hooks.json has no hardcoded /Users/ or /home/ path"
  fi
fi

# ---------------------------------------------------------------------------
# (SAFE-02) the pure-Node deploy guard exists at hooks/guard.mjs.
#           Ships RED until Wave 3 lands the guard.
# ---------------------------------------------------------------------------
printf '\n[SAFE-02] pure-Node prod-deploy guard present (hooks/guard.mjs)\n'
[ -f "hooks/guard.mjs" ] \
  && pass "hooks/guard.mjs present" \
  || fail "hooks/guard.mjs missing — Wave 3 (SAFE-02) not landed"

# ---------------------------------------------------------------------------
# (INSTALL-01) installers present: install/install.sh + install/install.mjs.
#              Ships RED until Wave 3/4 lands the installers.
# ---------------------------------------------------------------------------
printf '\n[INSTALL-01] installers present (install/install.sh + install/install.mjs)\n'
[ -f "install/install.sh" ] \
  && pass "install/install.sh present" \
  || fail "install/install.sh missing — INSTALL wave not landed"
[ -f "install/install.mjs" ] \
  && pass "install/install.mjs present" \
  || fail "install/install.mjs missing — INSTALL wave not landed"

# ---------------------------------------------------------------------------
# (INSTALL-02) reversibility + docs present: install/uninstall.sh + install/README.md.
#              Ships RED until the INSTALL wave lands.
# ---------------------------------------------------------------------------
printf '\n[INSTALL-02] uninstall + install docs present (install/uninstall.sh + install/README.md)\n'
[ -f "install/uninstall.sh" ] \
  && pass "install/uninstall.sh present" \
  || fail "install/uninstall.sh missing — INSTALL wave not landed"
[ -f "install/README.md" ] \
  && pass "install/README.md present" \
  || fail "install/README.md missing — INSTALL wave not landed"

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
printf '\n== Result ==\n'
if [ "$FAILS" -eq 0 ]; then
  printf 'ALL CHECKS PASSED\n'
  exit 0
else
  printf '%s CHECK(S) FAILED (RED is EXPECTED until Waves 2-3 land)\n' "$FAILS"
  exit 1
fi
