#!/usr/bin/env sh
# check-kit-refs.sh — Phase 7 build gate (SHOME-03 / SC5).
#
# Proves the kit/state path rewrite is COMPLETE and cannot silently regress. It runs
# the two D-08 assertions plus the recommended third assertion and an SC2 invariant-marker
# check over an EXPLICIT file set (never a repo-wide grep):
#
#   Assertion 1 (D-08.1): ZERO 'agent-factory/config/' refs across the scan set
#                         (config fully migrated to .grugops/factory.config.json).
#   Assertion 2 (D-08.2): every surviving `agent-factory/handoffs/` ref is a known
#                         template basename, the bare template-dir form, or the
#                         template-placeholder form — a leaked instance write
#                         (agent-factory/handoffs/ABC-001-...) FAILS.
#   Assertion 3 (SC4/O3): no kit file / AGENTS.md names `$GRUGOPS_HOME` — the env var
#                         is LEGAL only in the resolver adapters and the resolver-mirroring
#                         packaging template, which are EXCLUDED from this scan.
#   SC2 marker check:     the compressed kit-vs-state invariant is present (byte-identical
#                         substring) at all four canonical sites.
#
# IMPORTANT — SC5 is "zero MISCLASSIFIED refs", NOT "zero `agent-factory/` strings". The
# ~96 intended kit-to-kit refs (D-01: roles/workflows/checklists/commit-convention/packaging)
# MUST survive bare. This gate proves the misclassified set (config + leaked instances) is
# empty; it does NOT count or remove the legitimate bare kit refs.
#
# Run from the repo root:  sh scripts/check-kit-refs.sh
# Exit 0 = all checks PASS (GREEN over the rewritten tree); exit 1 = at least one FAIL.
#
# This gate is authored AFTER the rewrite (Plans 07-01..03), so it ships GREEN at commit —
# it proves a COMPLETED rewrite, not a missing scaffold (diverges from the Phase-3/4/5
# ships-RED harness precedent).
#
# Strictly READ-ONLY: grep and test only. No writes, no in-place edits, no `--fix`. House
# style mirrors install/install.sh: #!/usr/bin/env sh, set -eu, printf not echo -e, small
# named helpers. Portable grep flags only (-r -n -l -E -F -q -v); the host grep is
# ugrep-aliased, so no -P, no -z, no --include, no reliance on default recursive globs.

set -eu

# ---------------------------------------------------------------------------
# Explicit SCAN path list — the D-08 "shipped kit + adapters + AGENTS.md". NEVER a
# repo-wide grep. By NOT listing them, this excludes scripts/fixtures/, agent-factory/
# examples/, agent-factory/README.md, install/, root README.md, CLAUDE.md, docs/,
# .planning/, and this script itself — all of which legitimately carry `agent-factory/`.
#
# D-03 exclusion: agent-factory/seed/ is INTENTIONALLY NOT listed below. Its bundled
# files are STATE TEMPLATES (the .grugops/factory.config.json config seed, plans/**,
# memory-bank/**) whose `.grugops/…` and `plans/…` refs resolve in the TARGET repo the
# installer seeds them into, NOT against the kit root. Holding them to this kit-resolution
# gate would false-fail; the explicit-allowlist design means the exclusion IS the
# not-listing, and this comment records why.
# ---------------------------------------------------------------------------
SCAN="agent-factory/roles agent-factory/workflows agent-factory/checklists agent-factory/packaging agent-factory/_commit-convention.md .claude/skills .claude/agents/grugops-orchestrator.md skills AGENTS.md"

# Assertion 3 scope — kit prose that must be FREE of $GRUGOPS_HOME. It deliberately
# EXCLUDES agent-factory/packaging/ (the resolver-mirroring subagent.frontmatter.md
# legitimately carries ${GRUGOPS_HOME:-$HOME/.grugops}, mandated by Plan 07-01 so the
# installer regenerates a matching adapter) and the .claude/skills | .claude/agents |
# skills adapter dirs (the two resolver adapters legally carry it per D-11/D-12). The
# three legal sites are exactly: .claude/agents/grugops-orchestrator.md,
# .claude/skills/grugops/SKILL.md, agent-factory/packaging/subagent.frontmatter.md.
GH_SCAN="agent-factory/roles agent-factory/workflows agent-factory/checklists agent-factory/_commit-convention.md AGENTS.md"

# The exhaustive 16-template ERE allowlist — verbatim from `ls agent-factory/handoffs/`.
ALLOW='agent-factory/handoffs/(architecture-handoff|business-handoff|implementation-handoff|implementation-ready-packet|incident-postmortem|product-handoff|qe-handoff|refinement-notes|release-handoff|retro-notes|security-nfr-handoff|sprint-plan|system-handoff|ticket-ready-packet|uat-handoff|universal-handoff)\.md'

# The four canonical sites carrying the compressed kit-vs-state invariant (SC2).
MARKER_SITES="AGENTS.md agent-factory/roles/orchestrator.md .claude/agents/grugops-orchestrator.md .claude/skills/grugops/SKILL.md"
# A stable, unique substring of the invariant blockquote (byte-identical at all 4 sites).
MARKER='If the kit dir is absent, STOP — do not hunt.'

FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

printf '== Phase 7 kit-ref gate (SHOME-03 / SC5) ==\n'

# ---------------------------------------------------------------------------
# Assertion 1 (D-08.1): ZERO agent-factory/config/ refs in the scan set.
# ---------------------------------------------------------------------------
printf '\n[Assertion 1] no agent-factory/config/ refs remain (config now .grugops/factory.config.json)\n'
cfg=$(grep -rn 'agent-factory/config/' $SCAN || true)
if [ -z "$cfg" ]; then
  pass "no agent-factory/config/ refs remain"
else
  fail "stray agent-factory/config/ ref(s) — config must be .grugops/factory.config.json:
$cfg"
fi

# ---------------------------------------------------------------------------
# Assertion 2 (D-08.2): every agent-factory/handoffs/ ref is a known template name,
# the bare template-dir form (followed by a backtick), or the template-placeholder form.
# A leaked instance write into the kit (a ticket-scoped name) FAILS because it is none
# of those.
# ---------------------------------------------------------------------------
printf '\n[Assertion 2] every agent-factory/handoffs/ ref is a known template or the template dir\n'
stray=$(grep -rn 'agent-factory/handoffs/' $SCAN \
        | grep -Ev "$ALLOW" \
        | grep -Ev 'agent-factory/handoffs/`' \
        | grep -Ev 'agent-factory/handoffs/<template>\.md' \
        || true)
if [ -z "$stray" ]; then
  pass "every agent-factory/handoffs/ ref is a known template or the template dir"
else
  fail "non-template agent-factory/handoffs/ ref (leaked instance?):
$stray"
fi

# ---------------------------------------------------------------------------
# Assertion 3 (SC4 / O3): no kit file or AGENTS.md names $GRUGOPS_HOME. The env var
# lives ONLY in the resolver adapters + the resolver-mirroring packaging template,
# all excluded from GH_SCAN above.
# ---------------------------------------------------------------------------
printf '\n[Assertion 3] no kit prose / AGENTS.md names $GRUGOPS_HOME (env var lives only in the adapters)\n'
gh=$(grep -rln 'GRUGOPS_HOME' $GH_SCAN || true)
if [ -z "$gh" ]; then
  pass "no kit prose / AGENTS.md names \$GRUGOPS_HOME"
else
  fail "kit prose names \$GRUGOPS_HOME (must live only in the resolver adapter self-heal):
$gh"
fi

# ---------------------------------------------------------------------------
# SC2: the compressed invariant marker is present at all four canonical sites.
# ---------------------------------------------------------------------------
printf '\n[SC2] kit-vs-state invariant marker present at the four canonical sites\n'
missing=
for site in $MARKER_SITES; do
  if [ ! -f "$site" ]; then
    missing="$missing $site(absent)"
  elif ! grep -qF "$MARKER" "$site"; then
    missing="$missing $site(marker-missing)"
  fi
done
if [ -z "$missing" ]; then
  pass "invariant marker present at all four canonical sites"
else
  fail "invariant marker missing from:$missing"
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
