#!/usr/bin/env sh
# check-structure.sh — Phase 4 Wave-0 structural test harness.
#
# This is the runnable acceptance criteria for the workflows / cadence / backpressure phase.
# It is a MARKDOWN-AUTHORING test suite: structural / cross-file / cadence-tag / single-source
# / no-fabrication / frozen-path drift checks built from grep / wc / test only. No runtime
# test runner exists or is needed (D-18). It mirrors the proven Phase-3 precedent
# (.planning/phases/03-roles-agents-md-substrate/check-structure.sh) and what the Phase-6 Node
# validator (VAL-01) will later enforce, so building it now de-risks Phase 6.
#
#   The real Node validator is Phase-6/VAL-01 and is intentionally:  UNKNOWN - verify
#   (do NOT fabricate `node scripts/validate-agent-factory.mjs` here — that artifact does not
#    exist yet; D-18 forbids inventing a real command.)
#
# Run from the repo root:  sh .planning/phases/04-workflows-cadence-backpressure/check-structure.sh
# Exit 0 = all checks PASS; exit 1 = at least one FAIL.
# Every check goes RED until each authored workflow file lands — that is EXPECTED for a greenfield
# authoring phase. The checks ARE the acceptance criteria, runnable the moment each file lands.
#
# Encodes the 13 invariants V-01 .. V-13 from 04-VALIDATION.md (the "Automated Check" column).

set -eu

WF_DIR="agent-factory/workflows"
ORCH="agent-factory/roles/orchestrator.md"
FAILS=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

# The 14 exact workflow names (00-..13-), frozen Orchestrator routing table (D-20).
# `install` has NO numbered workflow — there is NO 14-*.md (research §"ZERO drift").
WORKFLOWS="00-bootstrap-greenfield 01-bootstrap-brownfield 02-idea-to-epics 03-epic-to-tickets 04-ticket-to-pr 05-pr-quality-gate 06-uat-pack 07-backlog-refinement 08-sprint-planning 09-daily-sweep 10-sprint-review 11-retro 12-release 13-incident"

# The 10 §7 v2 template headings, verbatim, in spec order (FLOW-05). Order is load-bearing.
SECTION_HEADINGS="## When to use
## Agents involved
## Inputs required
## Steps
## Board moves
## Handoffs produced
## Trace updates
## Metrics emitted
## Stop conditions
## Done condition"

# Frozen 16 handoff filenames (agent-factory/handoffs/) — used by the V-12 drift guard.
FROZEN_HANDOFFS="universal-handoff business-handoff product-handoff system-handoff architecture-handoff implementation-handoff qe-handoff security-nfr-handoff uat-handoff ticket-ready-packet implementation-ready-packet release-handoff incident-postmortem retro-notes refinement-notes sprint-plan"

printf '== Phase 4 structural check ==\n'

# ---------------------------------------------------------------------------
# (V-01) FLOW-01/02/03/04 — all 14 files exist with EXACT names; exactly 14
#         *.md (excluding .gitkeep); NO 14-*.md.
# ---------------------------------------------------------------------------
printf '\n[V-01] 14 workflow files present (exact names), no 14-*.md\n'
for w in $WORKFLOWS; do
  f="$WF_DIR/$w.md"
  if [ -f "$f" ]; then
    pass "$f present"
  else
    fail "$f missing"
  fi
done
# count *.md excluding .gitkeep (which is not a .md, so a plain *.md count is correct)
md_count=$(ls "$WF_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
md_count=${md_count:-0}
[ "$md_count" = "14" ] && pass "exactly 14 *.md files" || fail "found $md_count *.md files (want 14)"
# assert NO 14-*.md (the `install` classification has no numbered workflow, D / research)
if ls "$WF_DIR"/14-*.md >/dev/null 2>&1; then
  fail "a 14-*.md exists — install has no numbered workflow"
else
  pass "no 14-*.md (install handled by Installer role directly)"
fi

# ---------------------------------------------------------------------------
# (V-02) FLOW-05 — each file carries the 10 template sections IN ORDER.
#         grep -nF each heading; assert all present AND line numbers strictly
#         increasing (encodes order, not just presence).
# ---------------------------------------------------------------------------
printf '\n[V-02] 10 template sections present and in order, per file\n'
for w in $WORKFLOWS; do
  f="$WF_DIR/$w.md"
  if [ ! -f "$f" ]; then
    fail "$f missing — cannot check sections"
    continue
  fi
  prev=0
  order_ok=1
  missing=""
  printf '%s\n' "$SECTION_HEADINGS" | while IFS= read -r h; do
    [ -z "$h" ] && continue
    ln=$(grep -nF -- "$h" "$f" 2>/dev/null | head -n1 | cut -d: -f1)
    if [ -z "$ln" ]; then
      printf 'MISSING:%s\n' "$h"
    else
      printf 'LINE:%s\n' "$ln"
    fi
  done > /tmp/cs4_sect.$$ 2>/dev/null || true
  # evaluate the captured lines in the parent shell (the while loop above ran in a subshell)
  missing=$(grep '^MISSING:' /tmp/cs4_sect.$$ 2>/dev/null | sed 's/^MISSING://' | tr '\n' ',' | sed 's/,$//' || true)
  prev=0
  order_ok=1
  while IFS= read -r line; do
    case "$line" in
      LINE:*)
        n=${line#LINE:}
        if [ "$n" -le "$prev" ]; then order_ok=0; fi
        prev=$n
        ;;
    esac
  done < /tmp/cs4_sect.$$
  rm -f /tmp/cs4_sect.$$
  if [ -n "$missing" ]; then
    fail "$f missing section(s): $missing"
  elif [ "$order_ok" -ne 1 ]; then
    fail "$f has all 10 sections but OUT OF ORDER"
  else
    pass "$f — 10/10 sections in order"
  fi
done

# ---------------------------------------------------------------------------
# (V-03) FLOW-05 / D-27 — minimal `kind: workflow` frontmatter; the frontmatter
#         fence block (between the first two `---`) has <= 3 `^[a-z_]*:` fields.
# ---------------------------------------------------------------------------
printf '\n[V-03] minimal `kind: workflow` frontmatter (<= 3 fields)\n'
for w in $WORKFLOWS; do
  f="$WF_DIR/$w.md"
  [ -f "$f" ] || { fail "$f missing — cannot check frontmatter"; continue; }
  if ! grep -qF 'kind: workflow' "$f" 2>/dev/null; then
    fail "$f missing 'kind: workflow'"
    continue
  fi
  # extract the block between the FIRST two '---' fence lines, count [a-z_]*: field lines
  fields=$(awk 'BEGIN{infm=0;seen=0}
    /^---[[:space:]]*$/ { seen++; if(seen==1){infm=1;next} if(seen==2){infm=0} }
    infm==1 && /^[a-z_]+:/ { c++ }
    END{ print c+0 }' "$f")
  if [ "$fields" -le 3 ] && [ "$fields" -ge 1 ]; then
    pass "$f frontmatter has $fields field(s) (<= 3)"
  else
    fail "$f frontmatter has $fields field(s) (want 1..3)"
  fi
done

# ---------------------------------------------------------------------------
# (V-04) D-20 — filenames <-> Orchestrator routing table match 1:1. Every frozen
#         workflow name cited in orchestrator.md (filter comments per grep-gate
#         hygiene) must have a matching workflows/<name>.md, and no extra/missing.
# ---------------------------------------------------------------------------
printf '\n[V-04] orchestrator routing table <-> workflow files (1:1)\n'
if [ ! -f "$ORCH" ]; then
  fail "$ORCH missing — cannot cross-check routing table"
else
  miss_route=""
  for w in $WORKFLOWS; do
    # filter comment lines (grep-gate hygiene) before matching the routing reference
    if grep -v '^#' "$ORCH" 2>/dev/null | grep -qF "$w.md"; then
      :
    else
      miss_route="$miss_route $w"
    fi
  done
  if [ -n "$miss_route" ]; then
    fail "orchestrator does not cite workflow(s):$miss_route"
  else
    pass "orchestrator cites all 14 frozen workflow names"
  fi
  # no extra workflow .md beyond the frozen 14 (catches a stray/renamed file)
  extra=""
  if ls "$WF_DIR"/*.md >/dev/null 2>&1; then
    for f in "$WF_DIR"/*.md; do
      base=$(basename "$f" .md)
      echo " $WORKFLOWS " | grep -qF " $base " || extra="$extra $base"
    done
  fi
  if [ -n "$extra" ]; then
    fail "workflow dir has extra/unrecognized file(s):$extra"
  else
    pass "no extra workflow files beyond the frozen 14"
  fi
fi

# ---------------------------------------------------------------------------
# (V-05) GATE-01 — backpressure loop single-sourced in 05. `READY_FOR_HUMAN_REVIEW`
#         appears in EXACTLY 05-pr-quality-gate.md; 05 carries all 3 terminal tokens,
#         the 6 gate verbs, and `self_fix_attempts`.
# ---------------------------------------------------------------------------
printf '\n[V-05] backpressure loop single-sourced in 05-pr-quality-gate.md\n'
GATE="$WF_DIR/05-pr-quality-gate.md"
if ls "$WF_DIR"/*.md >/dev/null 2>&1; then
  loop_homes=$(grep -lF 'READY_FOR_HUMAN_REVIEW' "$WF_DIR"/*.md 2>/dev/null || true)
else
  loop_homes=""
fi
if [ "$loop_homes" = "$GATE" ]; then
  pass "READY_FOR_HUMAN_REVIEW appears only in 05-pr-quality-gate.md"
else
  fail "READY_FOR_HUMAN_REVIEW home is '$(printf '%s' "$loop_homes" | tr '\n' ' ')' (want only $GATE)"
fi
if [ -f "$GATE" ]; then
  for tok in 'READY_FOR_HUMAN_REVIEW' 'BLOCKED_NEEDS_FIX' 'SPLIT_REQUIRED' 'self_fix_attempts'; do
    grep -qF "$tok" "$GATE" 2>/dev/null && pass "05 contains '$tok'" || fail "05 missing '$tok'"
  done
  for verb in install lint typecheck unit build e2e; do
    grep -qiF "$verb" "$GATE" 2>/dev/null && pass "05 names gate verb '$verb'" || fail "05 missing gate verb '$verb'"
  done
else
  fail "$GATE missing — cannot check terminal tokens / gate verbs"
fi

# ---------------------------------------------------------------------------
# (V-06) GATE-01 / D-26 — 04 references 05 by filename and does NOT restate the loop.
# ---------------------------------------------------------------------------
printf '\n[V-06] 04-ticket-to-pr.md references 05, does NOT restate the loop\n'
TICKET="$WF_DIR/04-ticket-to-pr.md"
if [ ! -f "$TICKET" ]; then
  fail "$TICKET missing — cannot check loop reference"
else
  grep -qF '05-pr-quality-gate.md' "$TICKET" 2>/dev/null \
    && pass "04 references 05-pr-quality-gate.md" \
    || fail "04 does not reference 05-pr-quality-gate.md"
  if grep -qF 'READY_FOR_HUMAN_REVIEW' "$TICKET" 2>/dev/null; then
    fail "04 restates the loop (contains READY_FOR_HUMAN_REVIEW — should live only in 05)"
  else
    pass "04 does not restate the loop (no READY_FOR_HUMAN_REVIEW)"
  fi
fi

# ---------------------------------------------------------------------------
# (V-07) GATE-01 — no fabricated gate command: 05 pulls commands from AGENTS.md,
#         so it carries `UNKNOWN - verify` (never a hard-coded real command).
# ---------------------------------------------------------------------------
printf '\n[V-07] 05 contains `UNKNOWN - verify` (no fabricated gate command)\n'
if [ -f "$GATE" ]; then
  grep -qF 'UNKNOWN - verify' "$GATE" 2>/dev/null \
    && pass "05 contains 'UNKNOWN - verify'" \
    || fail "05 missing 'UNKNOWN - verify' (must not hard-code a real gate command)"
else
  fail "$GATE missing — cannot check no-fabrication"
fi

# ---------------------------------------------------------------------------
# (V-08) BOARD-03 — scrum cadence + SPRINT format. 08 and 10 carry `cadence=scrum`;
#         08 references plans/sprints/SPRINT-xx.md and names Goal/Committed/Velocity/Burndown.
# ---------------------------------------------------------------------------
printf '\n[V-08] scrum cadence + SPRINT-xx.md format (08, 10)\n'
PLAN="$WF_DIR/08-sprint-planning.md"
REVIEW="$WF_DIR/10-sprint-review.md"
for f in "$PLAN" "$REVIEW"; do
  [ -f "$f" ] || { fail "$f missing — cannot check cadence=scrum"; continue; }
  grep -qF 'cadence=scrum' "$f" 2>/dev/null && pass "$(basename "$f") carries cadence=scrum" || fail "$(basename "$f") missing cadence=scrum"
done
if [ -f "$PLAN" ]; then
  grep -qF 'plans/sprints/SPRINT-xx.md' "$PLAN" 2>/dev/null \
    && pass "08 references plans/sprints/SPRINT-xx.md" \
    || fail "08 missing plans/sprints/SPRINT-xx.md reference"
  for field in Goal Committed Velocity Burndown; do
    grep -qF "$field" "$PLAN" 2>/dev/null && pass "08 names '$field'" || fail "08 missing SPRINT field '$field'"
  done
fi

# ---------------------------------------------------------------------------
# (V-09) BOARD-02 — Kanban cadence works. 09-daily-sweep.md references plans/board.md,
#         plans/metrics.md, memory-bank/60-progress.md, blocked_escalation_days;
#         names Cycle time / WIP.
# ---------------------------------------------------------------------------
printf '\n[V-09] Kanban cadence — 09-daily-sweep.md references\n'
SWEEP="$WF_DIR/09-daily-sweep.md"
if [ ! -f "$SWEEP" ]; then
  fail "$SWEEP missing — cannot check Kanban references"
else
  for ref in 'plans/board.md' 'plans/metrics.md' 'memory-bank/60-progress.md' 'blocked_escalation_days' 'Cycle time' 'WIP'; do
    grep -qF "$ref" "$SWEEP" 2>/dev/null && pass "09 references '$ref'" || fail "09 missing '$ref'"
  done
fi

# ---------------------------------------------------------------------------
# (V-10) FLOW-03 — cadence tagging correct (D-25 single set). 08,10 carry
#         cadence=scrum; 07,09,11 declare BOTH cadences (grep 'both'); NO filename
#         carries a cadence suffix (no *-kanban.md / *-scrum.md); exactly 14 files.
# ---------------------------------------------------------------------------
printf '\n[V-10] cadence tagging (08/10 scrum, 07/09/11 both, single set)\n'
for f in "$PLAN" "$REVIEW"; do
  [ -f "$f" ] && { grep -qF 'cadence=scrum' "$f" 2>/dev/null && pass "$(basename "$f") cadence=scrum" || fail "$(basename "$f") missing cadence=scrum"; } || fail "$(basename "$f") missing"
done
for w in 07-backlog-refinement 09-daily-sweep 11-retro; do
  f="$WF_DIR/$w.md"
  [ -f "$f" ] || { fail "$f missing — cannot check 'both' cadence"; continue; }
  grep -qiF 'both' "$f" 2>/dev/null && pass "$w declares both cadences" || fail "$w does not declare both cadences"
done
# no cadence suffix in any filename (single set, D-25)
if ls "$WF_DIR"/*-kanban.md "$WF_DIR"/*-scrum.md >/dev/null 2>&1; then
  fail "a cadence-suffixed filename exists (*-kanban.md / *-scrum.md) — must be a single set"
else
  pass "no cadence-suffixed filenames (single config-gated set)"
fi

# ---------------------------------------------------------------------------
# (V-11) SAFE-01 — human-confirm prose in every merge/deploy-touching workflow.
#         04: autonomy=pr + 'never merge'. 05: 'recommendation' + human-review (no
#         auto-merge). 12: 'named human' + 'human-confirmed' + production_requires_human_confirmation.
# ---------------------------------------------------------------------------
printf '\n[V-11] SAFE-01 human-confirm prose (04 / 05 / 12)\n'
if [ -f "$TICKET" ]; then
  grep -qF 'autonomy=pr' "$TICKET" 2>/dev/null && pass "04 carries autonomy=pr" || fail "04 missing autonomy=pr"
  grep -qiF 'never merge' "$TICKET" 2>/dev/null && pass "04 says 'never merge'" || fail "04 missing 'never merge'"
else
  fail "$TICKET missing — cannot check SAFE-01"
fi
if [ -f "$GATE" ]; then
  grep -qiF 'recommendation' "$GATE" 2>/dev/null && pass "05 says 'recommendation'" || fail "05 missing 'recommendation'"
  grep -qiF 'human' "$GATE" 2>/dev/null && pass "05 carries human-review language" || fail "05 missing human-review language"
else
  fail "$GATE missing — cannot check SAFE-01 in 05"
fi
RELEASE="$WF_DIR/12-release.md"
if [ -f "$RELEASE" ]; then
  for pat in 'named human' 'human-confirmed' 'production_requires_human_confirmation'; do
    grep -qiF "$pat" "$RELEASE" 2>/dev/null && pass "12 contains '$pat'" || fail "12 missing '$pat'"
  done
else
  fail "$RELEASE missing — cannot check SAFE-01 in 12"
fi

# ---------------------------------------------------------------------------
# (V-12) D-24 drift guard — NO workflow cites a plans/<name>-handoff path (real
#         handoffs live under agent-factory/handoffs/). Mirrors Phase-3 block (f).
#         Also: every *-handoff.md token cited must be in the frozen 16-file list.
# ---------------------------------------------------------------------------
printf '\n[V-12] drift guard — no plans/*-handoff; cited handoffs in frozen 16\n'
if ls "$WF_DIR"/*.md >/dev/null 2>&1; then
  drift=$(grep -lE 'plans/.*-handoff' "$WF_DIR"/*.md 2>/dev/null || true)
else
  drift=""
fi
if [ -n "$drift" ]; then
  fail "plans/*-handoff cited in: $(printf '%s' "$drift" | tr '\n' ' ')"
else
  pass "no workflow cites plans/*-handoff"
fi
# every cited <name>-handoff token must be a frozen handoff name (catches invented names)
if ls "$WF_DIR"/*.md >/dev/null 2>&1; then
  bad=""
  cited=$(grep -ohE '[a-z][a-z0-9-]*-handoff' "$WF_DIR"/*.md 2>/dev/null | sort -u || true)
  for c in $cited; do
    echo " $FROZEN_HANDOFFS " | grep -qF " $c " || bad="$bad $c"
  done
  if [ -n "$bad" ]; then
    fail "non-frozen *-handoff name(s) cited:$bad"
  else
    pass "all cited *-handoff names are in the frozen 16-file list"
  fi
else
  pass "no workflow files yet — handoff-name drift guard vacuously holds"
fi

# ---------------------------------------------------------------------------
# (V-13) FLOW-04 — blameless incident path. 13-incident.md contains
#         incident-postmortem.md and 'blameless' (or 'never blames').
# ---------------------------------------------------------------------------
printf '\n[V-13] blameless incident path (13-incident.md)\n'
INC="$WF_DIR/13-incident.md"
if [ ! -f "$INC" ]; then
  fail "$INC missing — cannot check incident path"
else
  grep -qF 'incident-postmortem.md' "$INC" 2>/dev/null \
    && pass "13 references incident-postmortem.md" \
    || fail "13 missing incident-postmortem.md reference"
  if grep -qiF 'blameless' "$INC" 2>/dev/null || grep -qiF 'never blames' "$INC" 2>/dev/null; then
    pass "13 carries blameless language"
  else
    fail "13 missing 'blameless' / 'never blames' language"
  fi
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
