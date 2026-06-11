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
#   guard_voice        — voice-discipline lint over ALL 17 role files (D-05 expansion from the
#                        3 curated security/compliance/incident surfaces). SECTION-scoped: strips
#                        the single fenced `## Caveman prompt` block (intentionally caveman), then
#                        greps the clear-voice remainder for caveman markers. Uses `\bgrug\b`
#                        (word-boundary — CRITICAL: bare `grug` false-positives on `.grugops/`
#                        in every role's `## Reads` section, D-10).
#                        D-05 marker refinement (verified false positives across the clean 16-role
#                        tree, RESEARCH Pitfall 1): `\bgrug\b` treats `/` as a word boundary, so
#                        the `/grug` BRAND COMMAND (orchestrator.md) matches; and the Scribe
#                        legitimately DESCRIBES the voice rule in clear prose ("grug wink" /
#                        "grug voice", agents-md-scribe.md). The refinement NEUTRALIZES exactly
#                        these three clear-voice phrasings (`/grug`, `grug voice`, `grug wink`)
#                        before the marker grep — pattern-based so a senior rewrite introducing
#                        NEW clear-voice grug prose stays green, while a bare `grug smash` in a
#                        clear-voice surface STILL fails (the neutralization is per-phrase, not
#                        per-line: a real violation on the SAME line as an accepted phrase still
#                        trips). The awk fence anchor is NOT re-engineered (D-10 forward-compat).
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
# WR-02 fix: allow an optional quote (single or double) between the dash and the token so a
# QUOTED YAML array item (`- "Agent"`, `- 'Agent'`) — valid YAML, a real spawn-grant shape —
# is caught, not just the bare `- Agent`. Mirrors WR05_COMMA's permissiveness. Without the
# optional-quote class the anchor required the token to IMMEDIATELY follow dash+space, so a
# quoted grant shipped GREEN (a false-negative on grugops's core no-spawn-grant safety contract).
WR05_ARRAY='^[[:space:]]*-[[:space:]]*["'\'']?(Agent|Task)\b'
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
  # Missing-file fail-red (CR-01): on macOS sh a missing AGENTS.md lets `wc -c <` print an empty
  # string WITHOUT aborting the command substitution, so `b` becomes "", both `[ "$b" -ge … ]`
  # tests evaluate false (with a stderr integer-expression warning), and the guard fell through to
  # a spurious PASS — vacuous green that silently skipped the check. Assert presence first.
  if [ ! -f AGENTS.md ]; then
    fail "AGENTS.md missing (required for Codex cap check)"
    return
  fi
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
    # Missing-file fail-red (CR-01, same vacuous-PASS class as guard_agents_bytes): a deleted
    # adapter must fail red naming the path, not silently pass via an empty `wc -c <` byte count.
    if [ ! -f "$f" ]; then
      fail "$f missing (adapter required)"
      continue
    fi
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
# The 17 role files (D-05 expansion + Phase 13 frontend-ui). `_role-switch-protocol.md` is the
# protocol, NOT a persona — it has no `## Caveman prompt` block, so it is correctly EXCLUDED from
# the 17 (and from ROLE_FILES in guard_role_size + guard_caveman_preserved). This same 17-file list
# is the scan set for all three role guards (guard_voice, guard_caveman_preserved, guard_role_size).
ROLE_FILES="agent-factory/roles/agents-md-scribe.md \
agent-factory/roles/architect-design.md \
agent-factory/roles/ba-pm.md \
agent-factory/roles/brownfield-mapper.md \
agent-factory/roles/compliance-officer.md \
agent-factory/roles/factory-coach.md \
agent-factory/roles/frontend-ui.md \
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
VOICE_FILES="$ROLE_FILES"
VOICE_MARKERS='\bgrug\b|\bclub\b|\brock\b|\bcave\b|\bsmash\b|\bshiny\b|brain hurt|me think|no think|big think'

guard_voice() {
  printf '\n[guard_voice] clear-voice surfaces free of caveman markers (section-scoped)\n'
  voice_fail=
  for f in $VOICE_FILES; do
    # Missing-file structured fail (CR-02): under `set -eu` a non-zero `awk` exit (its
    # "can't open file" on a missing $f) inside a command substitution ABORTS the whole script —
    # the FAILS counter never increments, no `== Result ==` / `N CHECK(S) FAILED` summary prints,
    # and CI sees awk's raw error instead of the guard's structured finding. Assert presence first
    # so a missing voice file produces a nonzero-exit finding that NAMES the file, not a raw abort.
    if [ ! -f "$f" ]; then
      voice_fail="$voice_fail
$f: required voice file missing"
      continue
    fi
    # Strip the single fenced `## Caveman prompt` block, then scan the clear-voice remainder.
    # (D-10 forward-compat: this anchor is NOT re-engineered for the D-05 expansion.)
    #
    # WR-03 fix: if the caveman fence is MALFORMED (missing/odd number of ```), `skip` never
    # resets and EVERY line after the heading is silently dropped from the clear-voice scan — a
    # false-negative across the whole file tail (## Hard limits, the safety lines, etc.). The
    # END block emits a sentinel when `skip` is still set at EOF so an unterminated block fails
    # RED instead of scanning nothing. The sentinel carries no VOICE_MARKER, so it is detected by
    # its own grep below, not confused with a caveman marker. (This adds an END action only — it
    # does NOT re-engineer the fence anchor, honoring D-10 forward-compat.)
    body=$(awk '
      /^## Caveman prompt/ {skip=1}
      skip && /^```/        {fence++; if(fence==2){skip=0;fence=0}; next}
      skip                  {next}
      {print}
      END { if (skip) print "__UNCLOSED_CAVEMAN_FENCE__" }
    ' "$f")
    # WR-03: an unterminated caveman block fails red NAMING the file — the tail was never scanned.
    if printf '%s\n' "$body" | grep -qF '__UNCLOSED_CAVEMAN_FENCE__'; then
      voice_fail="$voice_fail
$f: unterminated ## Caveman prompt fence — clear-voice tail not scanned (malformed fence)"
      continue
    fi
    # D-05 marker refinement (a SEPARATE pass — does NOT touch the fence anchor above): neutralize
    # the three verified clear-voice grug phrasings so the all-16 scan ships GREEN. `/grug` is the
    # brand command; "grug voice" / "grug wink" are the Scribe's clear-voice descriptions of the
    # voice rule. Per-phrase gsub (NOT a per-line grep -v) so a bare `grug smash` on the SAME line
    # as an accepted phrase STILL trips. `BRANDCMD`/`voice-meta`/`wink-meta` are marker-free fillers.
    body=$(printf '%s\n' "$body" | awk '{
      gsub(/\/grug/, "BRANDCMD")
      gsub(/grug voice/, "voice-meta")
      gsub(/grug wink/, "wink-meta")
      print
    }')
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
# guard_caveman_preserved — the POSITIVE INVERSE of guard_voice (D-06).
#
# guard_voice strips the `## Caveman prompt` block and asserts the REMAINDER is marker-free;
# this guard keeps ONLY the block and asserts it is non-empty AND carries >=1 caveman marker —
# so the senior-persona rewrite (Phase 11) cannot SAND THE GRUG VOICE OFF. The terse caveman
# prompt is grugops's token-economy mechanism; a rewrite that flattens it into verbose
# professional prose must fail red, not pass silently. Scans the SAME 16 ROLE_FILES.
#
# The fence-counting awk is the verified guard_voice idiom INVERTED — print only the lines
# INSIDE the fenced block (between the first and second ``` after `## Caveman prompt`).
#
# CAVEMAN_MARKERS (D-06 discretion — ALIGNED WITH, then extended from, guard_voice's
# VOICE_MARKERS): the explicit grug idioms PLUS `^You\b`. The clean-tree caveman blocks are
# written as clipped second-person imperatives ("You are <Role>.", "You do not refactor.") and
# do NOT carry a literal `grug`/`me think` idiom — so VOICE_MARKERS alone would fail RED on the
# clean tree (verified). `^You\b` is the universal caveman cadence that distinguishes a real
# grug block from a SANDED professional-prose rewrite (verified: all 16 clean blocks hit, a
# flowing professional-prose block does not). A bare grug idiom (`grug smash` etc.) also counts.
#
# CR-02 presence-first (same class as guard_voice): a missing role must fail red NAMING the path,
# never let a non-zero awk exit abort the script under set -eu before the summary prints.
#
# WR-01 fix: a SINGLE `You are <Role>.` opener is NOT enough evidence of caveman voice. Every
# block — sanded or not — keeps that one opener, so the old single-marker grep (which OR'd
# `^You\b` into the markers) PASSED a block flattened into flowing professional prose that kept
# only the opener, defeating the D-06 "voice not sanded off" contract (professional prose is
# often SHORTER than terse caveman cadence, so guard_role_size's byte ceiling is no backstop).
# The fix requires evidence BEYOND the universal opener: at least TWO `^You`-cadence lines OR at
# least one bare grug idiom (VOICE_MARKERS). All 16 clean blocks carry >=4 `^You` lines (verified
# 2026-06-11), so the threshold keeps the clean tree GREEN while rejecting a single-opener sand.
# ---------------------------------------------------------------------------

guard_caveman_preserved() {
  printf '\n[guard_caveman_preserved] every role keeps a non-empty caveman prompt block (D-06)\n'
  cav_fail=
  for f in $ROLE_FILES; do
    if [ ! -f "$f" ]; then
      cav_fail="$cav_fail
$f: required role file missing (caveman prompt block missing or empty)"
      continue
    fi
    # Keep ONLY the lines INSIDE the fenced `## Caveman prompt` block (inverse of guard_voice).
    block=$(awk '
      /^## Caveman prompt/ {seen=1; next}
      seen && /^```/        {fence++; if(fence==1){infence=1; next}; if(fence==2){exit}}
      infence               {print}
    ' "$f")
    if [ -z "$block" ]; then
      cav_fail="$cav_fail
$f: caveman prompt block missing or empty"
    else
      # WR-01: require >=2 `^You`-cadence lines OR >=1 bare grug idiom — a single opener fails.
      # `|| true` keeps the assignment safe under set -e: `grep -c` exits 1 on a zero count, which
      # would otherwise abort the script inside the command substitution (a fully-sanded block has
      # zero `^You` lines — exactly the case this guard must FLAG, not crash on).
      youcount=$(printf '%s\n' "$block" | grep -cE '^You\b' || true)
      if [ "$youcount" -lt 2 ] && ! printf '%s\n' "$block" | grep -qE "$VOICE_MARKERS"; then
        cav_fail="$cav_fail
$f: caveman voice sanded to prose (only the opener survives — no caveman marker)"
      fi
    fi
  done
  if [ -z "$cav_fail" ]; then
    pass "caveman: all 17 roles keep a non-empty markered caveman prompt block"
  else
    fail "caveman-preserved violation:$cav_fail"
  fi
}

# ---------------------------------------------------------------------------
# guard_role_size — per-role byte ceiling, byte-for-byte mirror of guard_adapter_size (D-07).
#
# Enforces the D-04 token-economy invariant in code: the terse caveman voice is grugops's
# cost mechanism, so "senior" must mean SHARPER JUDGMENT PER TOKEN, not more prose. A rewrite
# that bloats a role into verbose professional English fails red.
#
# PER-FILE documented constants (NOT a flat number, NOT computed live):
#   - a flat ceiling either punishes orchestrator's legitimate 6286 B outlier (routing matrix +
#     WIP/DoR gate + XL-split + workflow table that NO other role has) OR licenses every other
#     role to bloat to 6 KB;
#   - a live-computed `current size` ceiling is tautological — it can never fail.
# So each role gets its OWN two-tier WARN->FAIL ceiling, hard-coded from the 2026-06-10 baseline:
#   FAIL = baseline + 12%, WARN = baseline + 6%. Byte-based (mirrors guard_adapter_size): a
#   bloated file can carry few long lines, so a line count under-counts it.
#
# ba-pm.md gets EXTRA headroom (FAIL = baseline +20%, WARN = +12%): it legitimately gains senior
# BA judgment via PERS-02 (INVEST, measurable acceptance + NFR, DoR rigor). It still fails a
# *bloated* rewrite — the larger headroom is documented, not a blank cheque.
#
# `_role-switch-protocol.md` (2326 B) is the protocol, NOT a persona — EXCLUDED (uses ROLE_FILES,
# the 17-file list shared with guard_voice + guard_caveman_preserved).
#
# CR-01 missing-file fail-red (mirrors guard_adapter_size): a deleted role must fail red NAMING
# the path, never vacuous-pass on an empty `wc -c <` byte count.
# ---------------------------------------------------------------------------
# Per-role FAIL/WARN ceilings keyed by basename. Baseline captured 2026-06-10; FAIL = +12% /
# WARN = +6% off baseline (ba-pm.md = +20% / +12% PERS-02 headroom). Looked up via `case` since
# POSIX sh has no associative arrays.
role_ceiling() {
  # $1 = role basename → echoes "FAIL WARN"
  case "$1" in
    orchestrator.md)       echo "7041 6664" ;;
    security-nfr.md)       echo "4576 4331" ;;
    compliance-officer.md) echo "4160 3937" ;;
    release-manager.md)    echo "4144 3922" ;;
    agents-md-scribe.md)   echo "3910 3701" ;;
    architect-design.md)   echo "3617 3423" ;;
    ba-pm.md)              echo "3294 3075" ;;  # PERS-02 BA headroom (+20% / +12%)
    factory-coach.md)      echo "3420 3237" ;;
    frontend-ui.md)        echo "3969 3757" ;;  # Phase 13 — 17th role (UI-01)
    incident-responder.md) echo "3387 3206" ;;
    installer.md)          echo "3345 3166" ;;
    software-engineer.md)  echo "3307 3130" ;;
    qe-e2e.md)             echo "3224 3051" ;;
    uat-planner.md)        echo "3149 2980" ;;
    system-analyst.md)     echo "2809 2659" ;;
    greenfield-mapper.md)  echo "2673 2530" ;;
    brownfield-mapper.md)  echo "2487 2354" ;;
    *)                     echo "" ;;
  esac
}

guard_role_size() {
  printf '\n[guard_role_size] roles stay terse — senior != verbose (per-file byte ceiling, D-07)\n'
  for f in $ROLE_FILES; do
    # CR-01 missing-file fail-red: a deleted role must fail red naming the path, not pass on an
    # empty `wc -c <` byte count.
    if [ ! -f "$f" ]; then
      fail "$f missing (role required)"
      continue
    fi
    base=$(basename -- "$f")
    ceil=$(role_ceiling "$base")
    if [ -z "$ceil" ]; then
      fail "$f has no documented ceiling (unknown role — update role_ceiling)"
      continue
    fi
    rfail=${ceil%% *}
    rwarn=${ceil##* }
    b=$(wc -c < "$f" | tr -d ' ')
    if   [ "$b" -ge "$rfail" ]; then fail "$f ${b}B >= ${rfail}B — role bloated (senior != verbose)"
    elif [ "$b" -ge "$rwarn" ]; then warn "$f ${b}B >= ${rwarn}B — approaching ceiling"
    else pass "$f ${b}B within ceiling"; fi
  done
}

# ---------------------------------------------------------------------------
# Run all guards.
# ---------------------------------------------------------------------------
printf '== Phase 10 foundation-guards gate (SDLC-02 / SC2) ==\n'
guard_wr05
guard_agents_bytes
guard_adapter_size
guard_voice
guard_caveman_preserved
guard_role_size

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
