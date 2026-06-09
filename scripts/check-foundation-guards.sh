#!/usr/bin/env sh
# check-foundation-guards.sh — Phase 10 build gate (SDLC-02 / SC2).
#
# The four cross-cutting v1.2 foundation guards in ONE POSIX-sh aggregator (D-04 — NOT
# TypeScript/Node; the TS pivot is HELD, this kit takes no npm deps). Each guard fails red
# on a violation and NEVER fabricates a pass — the mechanical form of grugops's
# no-fabrication contract. It stands the guards up BEFORE any v1.2 content lands (Phases
# 11–17) so every later phase writes into a guarded environment.
#
#   guard_wr05         — frontmatter spawn-grant grep over the 2 packaging templates + 2
#                        materialized adapters (D-08/D-09). Two verified EREs (comma-form +
#                        YAML-array-item, incl. scoped `Agent(worker)`). Matches the
#                        frontmatter TOKEN only — NEVER the prose word "spawn"/"sub-agent"
#                        (the templates legitimately explain the no-spawn rule with that
#                        word, D-08). `adapters.md` is deliberately OUT of this scan set
#                        (D-09 — its stale spawn prose is corrected by a doc edit, NOT added
#                        to the guard scope).
#   guard_agents_bytes — AGENTS.md byte budget, two-tier WARN 20480 / FAIL 28672 (D-07).
#                        FAIL is BELOW the 32768-byte Codex `project_doc_max_bytes` cap
#                        [CITED: developers.openai.com/codex/guides/agents-md] — the 20/28
#                        numbers are chosen for earlier signal with headroom (RESEARCH Open
#                        Question 1). A long machine-written AGENTS.md measurably lowers
#                        agent success; this guard keeps the substrate small.
#   guard_adapter_size — per-adapter byte ceiling, two-tier WARN 3072 / FAIL 4096 (D-07).
#                        Byte-based, NOT line-based — one adapter line (the kit-vs-state
#                        invariant) is ~470 chars, so a line count under-counts a bloated
#                        file. A pointer-only adapter that grows past the ceiling signals a
#                        role body was copied in, breaking single-source.
#   guard_voice        — voice-discipline lint over the curated clear-voice surfaces
#                        (security/compliance/incident roles). SECTION-scoped: strips the
#                        single fenced `## Caveman prompt` block (intentionally caveman), then
#                        greps the clear-voice remainder for caveman markers. Uses `\bgrug\b`
#                        (word-boundary — CRITICAL: bare `grug` false-positives on `.grugops/`
#                        in every role's `## Reads` section, D-10).
#
# Strictly READ-ONLY: grep / wc / awk / test only. No writes, no in-place edits, no `--fix`.
# House style mirrors scripts/check-kit-refs.sh: #!/usr/bin/env sh, set -eu, printf not
# echo -e, small named helpers, explicit SCAN lists (NEVER a repo-wide grep). Portable grep
# flags only (-r -n -l -E -F -q -v); the host grep is ugrep-aliased, so no -P, no -z, no
# --include, no reliance on default recursive globs.
#
# CI-ready (single command, clean exit codes) per D-06 — but NO .github/ workflow is added
# (held). All four guards ship in THIS aggregator; none is a "v1" or deferred.
#
# Authored AFTER the clean state, so it ships GREEN at commit (every guard PASSES over the
# clean tree). The fail-proof is scripts/check-foundation-guards.test.sh, which plants ONE
# real violation per guard and asserts each fails red — proving the gate can actually fail.
#
# Run from the repo root:  sh scripts/check-foundation-guards.sh
# Exit 0 = all four guards GREEN; exit 1 = at least one FAIL (WARNs do NOT fail the build).

set -eu

FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
# warn() is advisory only — it does NOT increment FAILS (the two size guards are two-tier
# WARN→FAIL per D-07; a WARN is the "approaching the cap" early signal, not a build break).
warn() { printf '  WARN  %s\n' "$1"; }

# ---------------------------------------------------------------------------
# guard_wr05 — no frontmatter spawn grant in the 2 templates + 2 materialized adapters.
#
# Two grant shapes exist in this repo: the comma list (`tools: Read, Grep, ...`) and the
# YAML array (`allowed-tools:\n  - Read\n  ...`). A grant can also be scoped
# (`Agent(worker)`). The two EREs catch all three; the word boundary makes `Agent(worker)`
# match (`(` is a boundary) while keeping the pattern anchored to a token, not a substring.
#
# Explicit 4-file SCAN set — NEVER a repo-wide grep. The repo legitimately carries the words
# "Agent"/"Task"/"spawn" in fixtures/, agent-factory/examples/, docs/, .planning/, README.md,
# CLAUDE.md, agent-factory/roles/, and adapters.md (conceptual prose). By listing EXACTLY the
# 4 frontmatter-bearing files, those legitimate uses are excluded. adapters.md is OUT (D-09).
# This guard matches the frontmatter TOKEN only — it NEVER greps the prose word "spawn"
# (D-08: the templates legitimately document the no-spawn rule using that word).
# ---------------------------------------------------------------------------
WR05_COMMA='^(tools|allowed-tools):.*\b(Agent|Task)\b'
WR05_ARRAY='^[[:space:]]*-[[:space:]]*(Agent|Task)\b'
WR05_SCAN="agent-factory/packaging/subagent.frontmatter.md \
agent-factory/packaging/slash-command.template.md \
.claude/skills/grugops/SKILL.md \
.claude/agents/grugops-orchestrator.md"

guard_wr05() {
  printf '\n[guard_wr05] no spawn-tool grant in packaging-template / adapter frontmatter (WR-05)\n'
  # `|| true` on each grep so `set -e` does not abort on the (expected) no-match.
  hits=$( { grep -rnE "$WR05_COMMA" $WR05_SCAN; grep -rnE "$WR05_ARRAY" $WR05_SCAN; } 2>/dev/null || true )
  if [ -z "$hits" ]; then
    pass "WR-05: no spawn grant in frontmatter"
  else
    fail "WR-05 spawn grant:
$hits"
  fi
}

# ---------------------------------------------------------------------------
# guard_agents_bytes — AGENTS.md byte budget below the Codex cap.
#
# `[CITED: developers.openai.com/codex/guides/agents-md]` — "Codex stops adding files once the
# combined size reaches the limit defined by project_doc_max_bytes (32 KiB by default)."
# Default = 32768 bytes. FAIL fires at 28672 (28 KiB) — strictly below the cap, with headroom;
# WARN at 20480 (20 KiB) for earlier signal (RESEARCH Open Question 1).
# ---------------------------------------------------------------------------
AGENTS_WARN=20480   # 20 KiB
AGENTS_FAIL=28672   # 28 KiB — headroom below the 32768 B Codex cap

guard_agents_bytes() {
  printf '\n[guard_agents_bytes] AGENTS.md byte budget (Codex cap 32768B)\n'
  b=$(wc -c < AGENTS.md | tr -d ' ')
  if   [ "$b" -ge "$AGENTS_FAIL" ]; then fail "AGENTS.md ${b}B >= ${AGENTS_FAIL}B (Codex cap 32768B)"
  elif [ "$b" -ge "$AGENTS_WARN" ]; then warn "AGENTS.md ${b}B >= ${AGENTS_WARN}B — approaching cap"
  else pass "AGENTS.md ${b}B under budget"; fi
}

# ---------------------------------------------------------------------------
# guard_adapter_size — per-adapter byte ceiling (single-source).
#
# Byte-based, NOT line-based: one adapter line is ~470 chars (the kit-vs-state invariant), so a
# line count would under-count a bloated file. FAIL at 4096 (4 KiB) names the adapter path +
# "role body copied in?"; WARN at 3072 (3 KiB) for early signal (D-07).
# ---------------------------------------------------------------------------
ADAPTERS=".claude/skills/grugops/SKILL.md .claude/agents/grugops-orchestrator.md"
AD_WARN=3072    # 3 KiB
AD_FAIL=4096    # 4 KiB

guard_adapter_size() {
  printf '\n[guard_adapter_size] adapters stay pointer-sized (single-source, byte ceiling)\n'
  for f in $ADAPTERS; do
    b=$(wc -c < "$f" | tr -d ' ')
    if   [ "$b" -ge "$AD_FAIL" ]; then fail "$f ${b}B >= ${AD_FAIL}B — adapter too large (role body copied in?)"
    elif [ "$b" -ge "$AD_WARN" ]; then warn "$f ${b}B >= ${AD_WARN}B — approaching pointer ceiling"
    else pass "$f ${b}B pointer-sized"; fi
  done
}

# ---------------------------------------------------------------------------
# guard_voice — voice-discipline lint over the curated clear-voice surfaces.
#
# Section-scoped, never whole-file: role bodies legitimately mix a fenced `## Caveman prompt`
# (intentionally caveman) with clear-voice sections. The awk strips the SINGLE fenced
# `## Caveman prompt` block, then the remainder is greped for caveman markers.
#
# Marker ERE: `\bgrug\b` word-boundary (CRITICAL — bare `grug` false-positives on `.grugops/`
# in every role's `## Reads` section; `printf '.grugops/' | grep -E '\bgrug\b'` is NO match
# because `grugops` continues with the word char `o`, so there is no word boundary, D-10),
# plus the idioms.
#
# Forward-compat (D-10, Phase 11): the anchoring is "everything EXCEPT `## Caveman prompt`".
# When Phase 11 adds clear-voice "What good looks like / When to escalate" sections to every
# role, those new sections are AUTOMATICALLY scanned — no guard change is needed. Phase 11
# must NOT re-engineer this anchor.
# ---------------------------------------------------------------------------
VOICE_FILES="agent-factory/roles/security-nfr.md \
agent-factory/roles/compliance-officer.md \
agent-factory/roles/incident-responder.md"
VOICE_MARKERS='\bgrug\b|\bclub\b|\brock\b|\bcave\b|\bsmash\b|\bshiny\b|brain hurt|me think|no think|big think'

guard_voice() {
  printf '\n[guard_voice] clear-voice surfaces free of caveman markers (section-scoped)\n'
  voice_fail=
  for f in $VOICE_FILES; do
    # Strip the single fenced `## Caveman prompt` block, then scan the clear-voice remainder.
    body=$(awk '
      /^## Caveman prompt/ {skip=1}
      skip && /^```/        {fence++; if(fence==2){skip=0;fence=0}; next}
      skip                  {next}
      {print}
    ' "$f")
    m=$(printf '%s\n' "$body" | grep -nE "$VOICE_MARKERS" || true)
    [ -n "$m" ] && voice_fail="$voice_fail
$f:
$m"
  done
  if [ -z "$voice_fail" ]; then
    pass "voice: clear-voice surfaces free of caveman markers"
  else
    fail "voice-discipline violation:$voice_fail"
  fi
}

# ---------------------------------------------------------------------------
# Run all four guards.
# ---------------------------------------------------------------------------
printf '== Phase 10 foundation-guards gate (SDLC-02 / SC2) ==\n'
guard_wr05
guard_agents_bytes
guard_adapter_size
guard_voice

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
