---
phase: 11-senior-persona-overhaul
reviewed: 2026-06-11T00:00:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - agent-factory/checklists/definition-of-ready.md
  - agent-factory/handoffs/ticket-ready-packet.md
  - agent-factory/roles/agents-md-scribe.md
  - agent-factory/roles/architect-design.md
  - agent-factory/roles/ba-pm.md
  - agent-factory/roles/brownfield-mapper.md
  - agent-factory/roles/compliance-officer.md
  - agent-factory/roles/factory-coach.md
  - agent-factory/roles/greenfield-mapper.md
  - agent-factory/roles/incident-responder.md
  - agent-factory/roles/installer.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/qe-e2e.md
  - agent-factory/roles/release-manager.md
  - agent-factory/roles/security-nfr.md
  - agent-factory/roles/software-engineer.md
  - agent-factory/roles/system-analyst.md
  - agent-factory/roles/uat-planner.md
  - agent-factory/workflows/07-backlog-refinement.md
  - scripts/check-foundation-guards.sh
  - scripts/check-foundation-guards.test.sh
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-06-11T00:00:00Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Reviewed 19 role-prompt / handoff / checklist / workflow markdown files plus the two real
code files (`scripts/check-foundation-guards.sh` and its test harness). Both shell scripts run
GREEN over the clean tree, and the test harness passes all planted-violation RED proofs — so
the gate is genuinely fail-capable, not fabricated green. Cross-references between roles,
checklists, handoff templates, and workflows all resolve (no broken pointers). Voice discipline
holds on the clean 16-role tree: no caveman markers leak into clear-voice safety lines, and the
brand-command / grug-meta neutralization is correctly narrow.

The defects are concentrated in the **guard logic's false-negative surface** — the guards are
the mechanical enforcement of grugops's two load-bearing contracts (no-spawn-grant safety, and
"senior != verbose / voice not sanded off"), so a guard that can be bypassed is a real quality
risk even though the clean tree passes today. None rises to BLOCKER (no security hole ships in
the *content*, no data loss, the scripts don't crash), but four WARNINGs weaken guards that are
supposed to be backpressure, and three INFO items are factual drift the guards do not catch.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: `guard_caveman_preserved` accepts a fully-sanded block that keeps only a `You are …` opener

**File:** `scripts/check-foundation-guards.sh:268` (and the guard at 270–298)
**Issue:** `CAVEMAN_MARKERS="$VOICE_MARKERS|^You\\b"`. The guard's entire stated purpose (D-06) is
to stop the Phase 11 senior rewrite from "sanding the grug voice off." But `^You\b` matches the
single opening line `You are <Role>.`, which every block keeps. A rewrite that flattens the body
into flowing professional prose while preserving that one opener still passes — verified:

```
block='You are the Software Engineer.
This role implements a single ticket with professional diligence, reading the
handoff packet thoroughly before making any changes ...'
# grep -qE "$CAVEMAN_MARKERS"  → MATCHES on line 1 → guard PASSES
```

The only backstop is `guard_role_size` (byte ceiling), but professional prose is frequently
*shorter* than terse caveman cadence, so a sanded block can be simultaneously under-ceiling AND
retain the opener — escaping both guards. This directly undermines the D-06 contract this guard
was written to enforce.
**Fix:** Require evidence of caveman voice beyond the universal opener — e.g. count the
second-person clipped imperatives (`^You ` lines) and require ≥2, or require ≥1 line matching the
clipped-cadence pattern that is NOT the opener. Minimal version:

```sh
# require at least TWO ^You-cadence lines OR one bare grug idiom, so a single opener is not enough
youcount=$(printf '%s\n' "$block" | grep -cE '^You\b')
if [ "$youcount" -lt 2 ] && ! printf '%s\n' "$block" | grep -qE "$VOICE_MARKERS"; then
  cav_fail="$cav_fail
$f: caveman voice sanded to prose (only the opener survives)"
fi
```

### WR-02: `guard_wr05` YAML-array pattern misses a quoted array item (`- "Agent"`) — spawn-grant bypass

**File:** `scripts/check-foundation-guards.sh:88` (`WR05_ARRAY`)
**Issue:** `WR05_ARRAY='^[[:space:]]*-[[:space:]]*(Agent|Task)\b'` anchors the tool name so it
must *immediately* follow the dash+space. A valid YAML array item that quotes the value escapes:

```
allowed-tools:
  - "Agent"      # valid YAML, real way to grant the spawn tool
  - Task         # caught
```
`printf '  - "Agent"\n' | grep -E '^[[:space:]]*-[[:space:]]*(Agent|Task)\b'` → **no match**.
The comma form (`WR05_COMMA`, with `.*`) correctly catches the quoted value, so the gap is
array-shape-only — but this is the mechanical enforcement of grugops's core "no sub-agent spawn
grant" safety contract (WR-05), and a quoted grant ships GREEN. The guard's own header comment
claims it "catches all three" grant shapes; it does not catch the quoted array item.
**Fix:** Allow an optional quote between the dash and the token (mirror the comma form's
permissiveness):

```sh
WR05_ARRAY='^[[:space:]]*-[[:space:]]*["'\'']?(Agent|Task)\b'
```

(or, simpler and consistent with `WR05_COMMA`, just match `^[[:space:]]*-.*\b(Agent|Task)\b`).
Add a planted `- "Agent"` quoted-array case to the test harness so the bypass is RED-proven.

### WR-03: `guard_voice` silently drops the rest of a file if the `## Caveman prompt` fence is malformed

**File:** `scripts/check-foundation-guards.sh:216-221`
**Issue:** The strip awk sets `skip=1` at `## Caveman prompt` and only clears it on the *second*
` ``` ` fence. If a role ever has a `## Caveman prompt` heading whose code fence is malformed
(missing/odd number of ` ``` `), `skip` never resets and **every line after the heading is
dropped from the clear-voice scan** — a silent false-negative across the whole tail of the file
(`## Hard limits`, the safety lines, etc.). Verified:

```
printf '## Caveman prompt\nYou are X.\ngrug smash here\n## Next\n' | awk '... strip ...'
# → produces NOTHING; 'grug smash here' is never scanned
```

`guard_caveman_preserved` only catches a *missing/empty* block, not an *unbalanced-fence* block,
so the two guards do not fully cover each other here.
**Fix:** Detect an unterminated caveman block and fail red instead of silently scanning nothing —
e.g. track whether `fence` reached 2 and emit a finding if the block never closed:

```sh
# in the awk END, if skip is still set, the fence never closed → flag it
END { if (skip) print "__UNCLOSED_CAVEMAN_FENCE__" }
# then: printf '%s\n' "$body" | grep -q '__UNCLOSED_CAVEMAN_FENCE__' && voice_fail=...
```

### WR-04: Missing-file test cases trip multiple guards' missing-file branches — weak attribution

**File:** `scripts/check-foundation-guards.test.sh:182-184, 224-226`
**Issue:** The `voice-missing` case removes `compliance-officer.md` and asserts the token
`compliance-officer.md`; the `caveman-missing` case removes `ba-pm.md` and asserts `ba-pm.md`.
But those files are in the **shared** `ROLE_FILES` list read by *three* guards
(`guard_voice`, `guard_caveman_preserved`, `guard_role_size`). Removing one file trips all three
missing-file branches, each printing the file name. The token assertion therefore cannot prove
that `guard_voice`'s specific presence-check (the CR-02 fix it is named for) produced the
finding — `guard_role_size`'s `… missing (role required)` line alone would satisfy the grep.
The test passes for the wrong reason and would still pass if `guard_voice`'s own presence-check
regressed.
**Fix:** Assert a guard-specific phrase, not just the bare filename — e.g. for the voice case
match `required voice file missing` (the exact string `guard_voice` emits at line 211), and for
the caveman case match `caveman prompt block missing` (line 287). This binds each test to the
code path it claims to exercise.

## Info

### IN-01: Stale role count in `agents-md-scribe.md` — says "14 roles" use the pointer, actual is 15

**File:** `agent-factory/roles/agents-md-scribe.md:40`
**Issue:** "it does not carry the generic 'Follow the 12 rules in `AGENTS.md`' pointer the other
**14** roles use." Verified count: 16 role files total (excluding `_role-switch-protocol.md`),
the Scribe correctly omits the pointer, leaving **15** roles that carry it (confirmed via
`grep -rl "Follow the 12 coding rules in" agent-factory/roles/*.md` → 15). This is exactly the
class of stale, un-recomputed number grugops's own no-fabrication discipline warns against, and
no guard checks it.
**Fix:** Change "14 roles" → "15 roles". Better: phrase it without a hard count
("the generic pointer every other role carries") so it cannot drift again.

### IN-02: Routing-matrix arrow loses its leading space on the compliance line

**File:** `agent-factory/roles/orchestrator.md:59`
**Issue:** `Need risk/security/compliance-> Security/NFR` — the `->` abuts `compliance` with no
space, unlike every other row in the matrix which uses ` -> `. Purely cosmetic (this is a
fenced code block, not parsed), but it breaks the column alignment the rest of the matrix keeps.
**Fix:** Insert the missing space: `Need risk/security/compliance -> Security/NFR` (and realign
the arrows if desired).

### IN-03: Caveman line in workflow `07` is outside guard scope — confirm it is intentional

**File:** `agent-factory/workflows/07-backlog-refinement.md:9`
**Issue:** "grug keep the larder full so dev never go hungry." sits in the clear-voice body of a
workflow. `guard_voice` scans only the 16 role files, so workflows carry no voice lint at all —
this caveman line is unguarded either way. It appears to be an intentional brand wink in a
non-safety context (allowed by the voice policy), so this is a note, not a defect: confirm the
voice policy deliberately exempts workflows, and that no *safety* line in any workflow ever
carries caveman cadence (none does in this file).
**Fix:** No change required if intentional. If workflow voice is meant to be linted, extend the
guard's scan set — but that is a scope decision for the phase owner, not a bug to fix here.

---

_Reviewed: 2026-06-11T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
