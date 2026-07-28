# Phase 11: Senior Persona Overhaul - Pattern Map

**Mapped:** 2026-06-10
**Files analyzed:** 23 (16 role rewrites + 1 role w/ BA deepening overlap + 2 BA-layer + 1 DoR hub + 1 packet alignment + 2 guard scripts + 4 tracking docs)
**Analogs found:** 23 / 23 (every new/modified file has an in-repo analog — this is an introspective phase, no greenfield code)

> **Phase shape (from RESEARCH):** markdown-content + POSIX-sh-guard. No runtime, no npm deps, no external libraries. Every pattern below is an *extension or inversion* of a Phase-10 pattern already shipped GREEN in this repo. Risk is not in inventing — it is the verified voice false positives (Pitfall 1) the D-05 expansion surfaces.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `agent-factory/roles/*.md` (×16, in-place rewrite) | role-prompt (persona) | transform (content) | each role is its own analog — uniform skeleton | exact (self) |
| `agent-factory/roles/ba-pm.md` (+ senior BA deepening) | role-prompt | transform | `ba-pm.md` self + DoR hub | exact (self) |
| `agent-factory/workflows/07-backlog-refinement.md` | workflow (ceremony) | transform | self — pointer to DoR already in place | exact (self) |
| `agent-factory/checklists/definition-of-ready.md` | checklist (hub) | transform | self — already the terse bullet hub | exact (self) |
| `agent-factory/handoffs/ticket-ready-packet.md` (align only if D-08 adds a gated check) | handoff template | transform | self — 1:1 DoR field map already present | exact (self) |
| `scripts/check-foundation-guards.sh` → `guard_caveman_preserved` (NEW, D-06) | guard (validator) | batch / pass-fail | `guard_voice` (positive inverse) | exact |
| `scripts/check-foundation-guards.sh` → `guard_role_size` (NEW, D-07) | guard (validator) | batch / pass-fail | `guard_adapter_size` (byte-ceiling) | exact |
| `scripts/check-foundation-guards.sh` → `guard_voice` (MODIFY, D-05) | guard (validator) | batch / pass-fail | `guard_voice` self (extend `VOICE_FILES` + refine `VOICE_MARKERS`) | exact |
| `scripts/check-foundation-guards.sh` → `guard_wr05` (RE-RUN, D-10) | guard (validator) | batch / pass-fail | `guard_wr05` self (no edit — regen-safety re-run) | exact |
| `scripts/check-foundation-guards.test.sh` (sanded + oversized fixtures, D-06/D-07) | test harness (fail-proof) | batch / mirror-and-mutate | `expect_fail` / `mirror` cases self | exact |
| `.planning/{PROJECT,STATE}.md`, `v1.2-SDLC-COVERAGE-AUDIT.md`, `RETROSPECTIVE.md` (D-10 close-marker) | tracking doc | transform (prose) | each marker line is its own analog | exact (self) |

---

## Pattern Assignments

### Group A — the 16-role in-place senior rewrite (PERS-01 / D-01..D-04)

#### The uniform skeleton (preserve verbatim; D-03 contract)

Every one of the 16 roles is rewritten **inside this fixed skeleton — no section added, no section removed**. Verified across `brownfield-mapper.md` (smallest, 2220 B) and `orchestrator.md` (largest outlier, 6286 B):

```
---
kind: role
tier: core
---
# Role: <Name>
[> **Kit vs state invariant:** ...]   ← ONLY orchestrator.md carries this banner (preserve it)
## One job                             ← single responsibility — D-03: do NOT change scope
## Caveman prompt                      ← fenced ``` block, grug voice — D-06 protects this
## Reads                               ← carries `.grugops/` refs (the \bgrug\b SAFE case)
## Activates when
## Responsibilities
## Output (file + format)              ← contract section — D-03 preserve
## Board moves (which column transitions this role causes)   ← contract — D-03 preserve
## Trace updates (what it must record in plans/traceability.md) ← contract — D-03 preserve
## Hard limits                         ← CLEAR voice for safety lines (two-voice discipline)
Follow the 12 coding rules in `AGENTS.md`.   ← footer — D-03 preserve (14 of 16 carry it)
```

**Analog (small role) — `agent-factory/roles/brownfield-mapper.md`** is the cleanest skeleton reference: every section present, no deviations, `## Caveman prompt` is a tight 4-line fenced block (lines 10-16), `## Reads` carries the `.grugops/factory.config.json` ref that is the `\bgrug\b` safe case (line 19), `## Hard limits` is clear-voice safety (line 43), footer present (line 45).

**Caveman-prompt block shape to preserve** (`brownfield-mapper.md` lines 10-16) — this is what `guard_caveman_preserved` (D-06) asserts stays non-empty + markered:
```
## Caveman prompt
```
You are Brownfield Mapper.
You inspect the existing repo.
You find structure, commands, architecture, tests, risks.
You do not refactor. You do not fix. You only map.
```
```

#### Skeleton deviations the rewrite MUST respect (do not "normalize" them)

1. **`orchestrator.md`** (6286 B, 125 L — the legitimate size outlier): carries the `> **Kit vs state invariant:**` banner (line 7), plus a `### Routing matrix` (lines 51-66), `### WIP + Definition-of-Ready gate` (lines 68-70), `### XL-split` (lines 72-73), and a `## Output` workflow-mapping table (lines 91-108). These are structural extras NO other role has. D-07's ceiling must not punish it (Pitfall 2). Clear-voice safety in `## Hard limits` (lines 120-123): "Never merge to a protected branch. Never deploy to prod." — keep plain English.

2. **`agents-md-scribe.md`** (3491 B): does **NOT** carry the `Follow the 12 coding rules` footer — it *owns* the rules instead (line 40: "it does not carry the generic 'Follow the 12 rules...' pointer the other 14 roles use"). It legitimately discusses the voice rule in **clear-voice meta-prose** — line 38 "a light grug wink permitted only in Mission" and line 40 "It may echo them in grug voice inside this body". **These two lines are the D-05 false positives #2 and #3** (see Shared Pattern: Voice false positives). The no-fabrication line is clear voice (line 51).

3. **`_role-switch-protocol.md`** (2326 B): has **NO `## Caveman prompt` block** → it is the protocol, NOT a persona → it is **correctly NOT one of the 16**. Do not rewrite it as a persona, do not add it to `VOICE_FILES`, do not add it to `ROLE_FILES` for `guard_role_size`.

**The 16 role files (exact list for every guard scan set):**
`agents-md-scribe` `architect-design` `ba-pm` `brownfield-mapper` `compliance-officer` `factory-coach` `greenfield-mapper` `incident-responder` `installer` `orchestrator` `qe-e2e` `release-manager` `security-nfr` `software-engineer` `system-analyst` `uat-planner`.

---

### Group B — `guard_caveman_preserved` (NEW, D-06)

**Analog:** `guard_voice` in `scripts/check-foundation-guards.sh` (lines 171-202). D-06 is its **positive inverse** — `guard_voice` strips the `## Caveman prompt` block and greps the *remainder*; D-06 keeps the *block* and asserts it is non-empty + has ≥1 marker.

**Helpers to reuse verbatim** (`scripts/check-foundation-guards.sh` lines 52-59):
```sh
set -eu
FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
warn() { printf '  WARN  %s\n' "$1"; }   # advisory only — does NOT increment FAILS
```

**The verified awk strip to invert** (`guard_voice` body, lines 186-192) — this is the fence-counting idiom D-06 reuses:
```sh
body=$(awk '
  /^## Caveman prompt/ {skip=1}
  skip && /^```/        {fence++; if(fence==2){skip=0;fence=0}; next}
  skip                  {next}
  {print}
' "$f")
m=$(printf '%s\n' "$body" | grep -nE "$VOICE_MARKERS" || true)
```

**D-06 assertion (inverse — keep only the INSIDE-fence lines, then require non-empty + markered).** RESEARCH supplies the illustrative shape; the planner finalizes the awk against the verified fence idiom above:
```sh
block=$(awk '
  /^## Caveman prompt/ {seen=1; next}
  seen && /^```/        {fence++; if(fence==1){infence=1;next}; if(fence==2){exit}}
  infence               {print}
' "$f")
if [ -z "$block" ]; then
  fail "$f: ## Caveman prompt block missing or empty"
elif ! printf '%s\n' "$block" | grep -qE "$VOICE_MARKERS"; then
  fail "$f: ## Caveman prompt block has no caveman marker (voice sanded off?)"
else
  pass "$f: caveman voice preserved"
fi
```

**Marker set (D-06 discretion — reuse the existing `VOICE_MARKERS`):** `guard_voice` defines it at line 169:
```sh
VOICE_MARKERS='\bgrug\b|\bclub\b|\brock\b|\bcave\b|\bsmash\b|\bshiny\b|brain hurt|me think|no think|big think'
```
D-06 reuses this list as-is (the block legitimately contains `grug` / `me think` / `no think` etc., which is exactly what we want to assert is *present*).

**CR-02 missing-file structured fail (reuse the `guard_voice` presence-first guard, lines 180-184):** under `set -eu` a non-zero `awk` exit on a missing `$f` aborts the whole script before `FAILS` increments. Assert presence first:
```sh
if [ ! -f "$f" ]; then
  ... structured fail naming $f ...
  continue
fi
```

---

### Group C — `guard_role_size` (NEW, D-07)

**Analog:** `guard_adapter_size` in `scripts/check-foundation-guards.sh` (lines 133-147) — the two-tier WARN→FAIL byte-ceiling template, **byte-based not line-based** (deliberate: a bloated file can have few long lines).

**Full analog body to mirror** (lines 129-147):
```sh
ADAPTERS=".claude/skills/grugops/SKILL.md .claude/agents/grugops-orchestrator.md"
AD_WARN=3072    # 3 KiB
AD_FAIL=4096    # 4 KiB

guard_adapter_size() {
  printf '\n[guard_adapter_size] adapters stay pointer-sized (single-source, byte ceiling)\n'
  for f in $ADAPTERS; do
    # Missing-file fail-red (CR-01): a deleted adapter must fail red naming the path,
    # not silently pass via an empty `wc -c <` byte count.
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
```

**The two load-bearing patterns to copy into `guard_role_size`:**
1. **CR-01 missing-file fail-red** (lines 138-141) — a deleted role MUST fail red naming the path, never vacuous-pass on an empty `wc -c <`. RESEARCH calls this out explicitly (Code Examples).
2. **Two-tier WARN→FAIL** (lines 143-145) — `warn()` does not break the build (advisory); `fail()` does.

**Verified live size baseline (D-07 thresholds, `wc -c`/`wc -l` — re-verified against the live tree this session, matches RESEARCH exactly):**

| Role file | Bytes | Lines |
|-----------|-------|-------|
| orchestrator.md | 6286 | 125 |
| security-nfr.md | 4085 | 46 |
| compliance-officer.md | 3714 | 46 |
| release-manager.md | 3700 | 51 |
| agents-md-scribe.md | 3491 | 51 |
| architect-design.md | 3229 | 48 |
| factory-coach.md | 3053 | 46 |
| incident-responder.md | 3024 | 46 |
| installer.md | 2986 | 46 |
| software-engineer.md | 2952 | 48 |
| qe-e2e.md | 2878 | 46 |
| uat-planner.md | 2811 | 46 |
| ba-pm.md | 2745 | 47 |
| system-analyst.md | 2508 | 45 |
| greenfield-mapper.md | 2386 | 46 |
| brownfield-mapper.md | 2220 | 45 |

(`_role-switch-protocol.md` = 2326 B — **NOT** one of the 16; EXCLUDE from `ROLE_FILES`.)

**Threshold strategy (D-07 = Claude's discretion; RESEARCH Open Q1 recommendation):** prefer a **per-file-relative** ceiling — hard-code `FAIL = current_bytes + ~12%`, `WARN = current_bytes + ~6%` as *documented constants per role* (NOT computed live — a live "current size" makes the guard tautological). This holds each role flat-or-smaller against its committed baseline and keeps the orchestrator's 6286 B from punishing it OR licensing every other role to bloat to 6 KB. Document the baseline-capture date in the guard comment. **`ba-pm.md` warrants a slightly larger explicit headroom** (it is the one role getting *more* judgment woven in via PERS-02 D-08) — call it out in the guard comment but still fail a *bloated* rewrite.

**RESEARCH skeleton for `guard_role_size`** (Code Examples — mirror `guard_adapter_size`, swap the input set + thresholds):
```sh
ROLE_FILES="agent-factory/roles/agents-md-scribe.md ... (all 16, _role-switch-protocol.md EXCLUDED)"
for f in $ROLE_FILES; do
  [ -f "$f" ] || { fail "$f missing (role required)"; continue; }   # CR-01 missing-file fail-red
  b=$(wc -c < "$f" | tr -d ' ')
  if   [ "$b" -ge "$ROLE_FAIL" ]; then fail "$f ${b}B >= ${ROLE_FAIL}B — role bloated (senior != verbose)"
  elif [ "$b" -ge "$ROLE_WARN" ]; then warn "$f ${b}B >= ${ROLE_WARN}B — approaching ceiling"
  else pass "$f ${b}B within ceiling"; fi
done
```

---

### Group D — `guard_voice` expansion (MODIFY, D-05)

**Analog:** `guard_voice` self (`scripts/check-foundation-guards.sh` lines 166-202). D-05 = extend `VOICE_FILES` from 3 curated surfaces to all 16 roles, and refine `VOICE_MARKERS` for the verified false positives. **Do NOT re-engineer the awk anchor** (RESEARCH Anti-Pattern; Phase-10 CONTEXT D-10 says the "everything EXCEPT `## Caveman prompt`" anchor is forward-compatible).

**Current scan set (lines 166-168) — only 3 of the 16 roles:**
```sh
VOICE_FILES="agent-factory/roles/security-nfr.md \
agent-factory/roles/compliance-officer.md \
agent-factory/roles/incident-responder.md"
```
**Missing from `VOICE_FILES` (the 13 to add):** `agents-md-scribe` `architect-design` `ba-pm` `brownfield-mapper` `factory-coach` `greenfield-mapper` `installer` `orchestrator` `qe-e2e` `release-manager` `software-engineer` `system-analyst` `uat-planner`.

**The `\bgrug\b` word-boundary ERE (line 169 + the rationale at lines 156-159):** bare `grug` would false-positive on `.grugops/` in every role's `## Reads` section — but `\bgrug\b` does NOT match `.grugops/` because `grugops` continues with the word char `o` (no boundary). The `.grugops/` safe case is verified at `brownfield-mapper.md:19`, `orchestrator.md:28`, `ba-pm.md:19`, `agents-md-scribe.md:22`.

**⚠ THE LOAD-BEARING FINDING (RESEARCH Pitfall 1) — a naive `VOICE_FILES="all 16"` ships the guard RED on the clean tree.** `\bgrug\b` treats `/` as a word boundary, so `/grug` matches. Three verified false positives across the clean tree:

| File:line | Offending prose | Why it trips `\bgrug\b` |
|-----------|-----------------|--------------------------|
| `orchestrator.md:35` | "...every `/grug` request starts here." | `/` is a word boundary → `\bgrug\b` matches `/grug` (brand command, NOT caveman voice) |
| `agents-md-scribe.md:38` | "...a light grug wink permitted only in Mission" | clear-voice meta-line *describing* the voice rule |
| `agents-md-scribe.md:40` | "...echo them in grug voice inside this body..." | clear-voice meta-line *describing* the voice rule |

**Marker-refinement (D-05 discretion; RESEARCH Open Q2 recommendation — "tune the ERE only if a real false positive surfaces, don't weaken the guard"):** pre-filter the `/grug` brand-command literal (unambiguously not caveman voice) AND accept the Scribe's two voice-meta lines (they *describe* the rule in clear prose, e.g. exclude `grug voice|grug wink`). Keep `\bgrug\b` otherwise — bare `grug smash` in a clear-voice surface MUST still fail (that is the fixture in Group E). **A senior rewrite could introduce NEW clear-voice "grug" prose — make the refinement robust, not a 3-line patch** (RESEARCH Assumption A2).

**Sequencing (RESEARCH Primary Recommendation):** rewrite content clean FIRST → apply marker refinement → THEN assert the expansion green. The guard is authored/expanded *after* the content is clean so it ships GREEN (the Phase-10 ship-GREEN pattern, line 45).

---

### Group E — fail-proof harness fixtures (D-06 RED + D-07 RED)

**Analog:** `scripts/check-foundation-guards.test.sh` — the hermetic mirror-and-mutate harness. The three reusable primitives are `mirror` (lines 63-73), `run_in` (lines 77-79), `expect_fail` (lines 84-91).

**The existing RED-fixture pattern to copy (the `guard_voice` planted violation, lines 154-156):**
```sh
M=$(mirror voice-marker)
printf '\ngrug smash the bug.\n' >> "$M/agent-factory/roles/security-nfr.md"
expect_fail "voice marker in clear-voice surface → nonzero + role path" "$M" "security-nfr.md"
```
This appends a caveman marker at end-of-file (after the fenced block, in clear-voice `## Hard limits` territory) then asserts nonzero-exit + the finding names the role path. The two new fixtures mirror this shape.

**`GUARD_INPUTS` must grow (lines 51-58):** currently lists only the 3 voice files among the roles. The two new guards + the D-05 expansion read ALL 16 roles, so the 13 not-yet-mirrored roles must be added to `GUARD_INPUTS` so `mirror` copies them into each hermetic case (RESEARCH Wave 0 Gaps).

**Two new fixtures to plant (mirror the `voice-marker` shape):**

1. **D-06 RED — sanded-caveman role.** Mirror a role, *empty its `## Caveman prompt` block* (or strip all markers from it), assert `guard_caveman_preserved` fails red naming the role + "sanded"/"missing":
```sh
M=$(mirror caveman-sanded)
# replace the caveman block body with marker-free prose, OR delete the fenced block contents
expect_fail "sanded caveman block → nonzero + role path" "$M" "<role>.md"
```

2. **D-07 RED — oversized role.** Mirror a role, pad it past its FAIL ceiling (reuse the `yes x | head -c` idiom from the adapter-oversize case, lines 137-139), assert `guard_role_size` fails red naming the path + "bloated":
```sh
M=$(mirror role-oversize)
yes x | head -c <ceiling+pad> > "$M/agent-factory/roles/<role>.md"
printf '\n' >> "$M/agent-factory/roles/<role>.md"
expect_fail "oversize role (>ceiling) → nonzero + role path" "$M" "<role>.md"
```

**Also extend the smoke + add the expanded-voice scan** (smoke at lines 172-178 must stay GREEN over the real tree — proves no false positives after the D-05 marker refinement, the T-10-02-FP invariant). Optionally add a D-06/D-07 CR-01 missing-file case mirroring the existing `*-missing` cases (lines 128-130, 144-146, 164-166).

---

### Group F — PERS-02 senior BA deepening (D-08 / D-09, PROSE ONLY)

**Hub analog:** `agent-factory/checklists/definition-of-ready.md` — already the terse bullet checklist that both `ba-pm.md` and `07-backlog-refinement.md` point to. **This is the single home for the INVEST + measurable-NFR gates (D-08).** No new file.

**Current DoR content (the 9 terse checks, lines 13-19 + 6-9 header):**
```
A ticket is ready to start when every check below holds. The Orchestrator applies this
checklist before handing a ticket to engineering; `ticket-ready-packet.md` carries one
field per check so the two stay aligned.

- problem clear
- scope and out-of-scope clear
- acceptance criteria clear (Given/When/Then)   ← KEEP this G/W/T prose line (D-09); do NOT add Three Amigos / executable wiring (Phase 12)
- dependencies known
- security/NFR triggers marked
- test notes present
- size assigned
- priority assigned
- no major unresolved blocker
```
D-08 weaves INVEST-shaping + *measurable*-NFR rigor into these existing terse lines (keep the bullet style; keep the file terse).

**The cross-reference pattern (already in place — the deepening rides it, no new pointer needed):**
- `ba-pm.md:22` (`## Reads`): "`agent-factory/checklists/definition-of-ready.md` — the bar each ticket must meet before it exits `Ready`."
- `ba-pm.md:32` (`## Responsibilities` #4): "Take each ticket to Definition of Ready so the Orchestrator can pull it."
- `07-backlog-refinement.md:21` (`## Inputs required`): "`agent-factory/checklists/definition-of-ready.md` — the bar each item must meet before it can be promoted."
- `07-backlog-refinement.md:29` + `:32` + `:44` + `:47`: every promote/stop/done condition already gates on the DoR by name.
- `orchestrator.md:32` + `:70`: the Orchestrator already reads + gates on the DoR.

**Existing handoff fields the senior BA prose rides (no new fields — executability is Phase 12)** — `agent-factory/handoffs/product-handoff.md` lines 27-37 already carry:
```
## User value
## Acceptance criteria (Given/When/Then)    ← line 30
## Dependencies
## Risks
## Test notes
## Security/NFR triggers                     ← line 34
## Size estimate
## Priority
```

**⚠ DoR ↔ packet 1:1 alignment constraint (RESEARCH Pitfall 5).** `agent-factory/handoffs/ticket-ready-packet.md` carries **one field per DoR check with an explicit mapping comment** (lines 34-62) — e.g. line 43-44:
```
## Acceptance criteria (Given/When/Then)
<!-- DoR: acceptance criteria clear (Given/When/Then) -->
```
The packet footer (line 65): "Fields satisfy checklists/definition-of-ready.md — keep aligned with that file." **If D-08 adds a *new gated DoR check*, the packet must mirror it in the same plan** or the gate desyncs. RESEARCH Assumption A3: prefer landing the INVEST/measurable-NFR rigor *inside the existing DoR lines* so no new packet field is needed.

**`07-backlog-refinement.md` ceremony deepening (D-08):** the BA/PM bullet (line 12) and Steps 2/4/5 (lines 25-28) are where senior refinement judgment lands — leave room for Phase 12's Three Amigos substep (D-09 seam; both phases touch this file).

---

### Group G — PERS-03 WR-05 verify + close (D-10)

**Analog:** `guard_wr05` self (`scripts/check-foundation-guards.sh` lines 76-93) — **no edit; the test is a re-run after the rewrite (regen-safety).** Verified PASS on the live tree this session.

**The two frontmatter-only EREs (lines 76-77) — match the TOKEN, never the prose word "spawn":**
```sh
WR05_COMMA='^(tools|allowed-tools):.*\b(Agent|Task)\b'
WR05_ARRAY='^[[:space:]]*-[[:space:]]*(Agent|Task)\b'
```
**Verified spawn-free frontmatter (live this session):** `subagent.frontmatter.md:27` → `tools: Read, Grep, Glob, Bash, Edit, Write` (no Agent/Task); `slash-command.template.md:25/49` → `allowed-tools:` arrays carry only `Read, Write, Bash, Glob, Grep`. **Keep the explanatory "spawn"/"sub-agent" prose** — `subagent.frontmatter.md` lines 15-18, 58-63 and `slash-command.template.md` lines 98-101 document *why* there is no spawn tool; `guard_wr05` intentionally does not match these (D-08/D-10). Do NOT trim this prose (RESEARCH Anti-Pattern; D-10 — token-economy targets role prompts loaded every session, not maintainer-facing templates).

**The four locked D-10 marker locations to close (verified line numbers this session):**

| Marker | File:line | Current wording (verbatim, to flip to "retired/closed") |
|--------|-----------|----------------------------------------------------------|
| PROJECT `⚠️ Revisit` → retired | `.planning/PROJECT.md:134` | "✓ Good (D-08) — ⚠️ Revisit: the templates still carry `Agent`/"spawn" prose (WR-05 regeneration hazard, tech debt)" |
| STATE tech-debt entry → closed | `.planning/STATE.md:242` | "[v1.2] WR-05 spawn-grant regeneration hazard (carried v1.1 tech debt): the two packaging templates still prescribe the `Agent` tool / "spawn" prose. Retire it in Phase 11 AND add the mechanical grep guard in Phase 10..." |
| SDLC audit observation → resolved | `.planning/v1.2-SDLC-COVERAGE-AUDIT.md:44` (and `:191`) | L44: "...the template text itself is retired in Phase 11. Tracked, not re-scoped here." / L191: "...guarded in Phase 10, retired in Phase 11." |
| RETROSPECTIVE note → closed | `.planning/RETROSPECTIVE.md:25` | "WR-05 (packaging templates still grant `Agent`/spawn) rode from Phase 7 → 8 and remains open; carried-forward warnings need a hard owner, not just a note." |

**⚠ NOT in the locked D-10 close-list (flag to user before touching) — RESEARCH Open Q3 / Assumption A4:** `v1.2-SDLC-COVERAGE-AUDIT.md:170` carries stale **D-11** wording: the GAP-2 table row says Phase 11 does "what good looks like / when to escalate on every role" — this predates the D-01/D-11 reframe (the no-new-section decision). It is cheap to reconcile and matches the "keep the source of truth truthful" intent, but it is strictly OUT of the locked 4-marker D-10 list — **get explicit user confirmation before editing line 170.**

---

## Shared Patterns

### House style (apply to ALL guard work — `scripts/check-foundation-guards.sh` lines 36-50)
**Source:** the guard header.
```
#!/usr/bin/env sh
set -eu
printf '  PASS  %s\n'   # printf, NEVER echo -e
```
- Strictly READ-ONLY: grep / wc / awk / test only. No writes, no `--fix`.
- **Explicit SCAN lists — NEVER a repo-wide grep** (the repo legitimately carries "Agent"/"Task"/"spawn"/"grug" in fixtures, examples, docs, `.planning/`).
- **Portable grep flags only** `-r -n -l -E -F -q -v` — host grep is **ugrep 7.5.0** (verified); NO `-P`, NO `-z`, NO `--include`, NO reliance on default recursive globs (RESEARCH Pitfall 3).
- Two-tier guards: `warn()` does NOT increment `FAILS` (advisory); `fail()` does.

### Ship-GREEN + fail-on-mutation proof (apply to D-05/D-06/D-07)
**Source:** `scripts/check-foundation-guards.sh:45-47` + the whole `check-foundation-guards.test.sh`.
**Apply to:** every new/expanded guard. Author the guard AFTER the content is clean so it ships GREEN; prove it CAN fail by planting exactly ONE real violation per guard in a hermetic mirror and asserting nonzero-exit + the finding names the defect. A gate that can only ever pass is fabricated green (the no-fabrication contract).

### CR-01 / CR-02 missing-file fail-red (apply to D-06 + D-07)
**Source:** `guard_adapter_size` lines 138-141 (CR-01) + `guard_voice` lines 180-184 (CR-02).
**Apply to:** both new guards. A deleted role must fail red NAMING the path — never vacuous-pass on an empty `wc -c <` (CR-01) and never let a non-zero `awk` exit abort the script before the summary prints (CR-02). Assert presence first.

### Two-voice discipline (apply to ALL 16 role rewrites)
**Source:** the skeleton — `## Caveman prompt` block + punchy body = grug; `## Hard limits` safety/escalation lines = clear voice. Verified: `orchestrator.md:120-123`, `agents-md-scribe.md:49-51`, `brownfield-mapper.md:43`.
**Apply to:** every rewrite — deepen judgment without breaking either voice. Security/compliance/incident/release safety lines stay plain English (D-03); `guard_voice` (D-05) mechanically enforces this across all 16.

### Single-source / pointer adapters (free SC4 win)
**Source:** `guard_adapter_size` (adapters stay pointer-sized) + RESEARCH Runtime State Inventory.
**Apply to:** the rewrite touches ZERO `.claude/**` adapters (they don't copy role bodies) → the single-source adapter-size check (SC4) stays green for free. Do NOT edit the materialized adapters.

---

## No Analog Found

None. Every new/modified file in this phase has an exact in-repo analog (the two new guards invert/mirror existing Phase-10 guards; the rewrites operate within an existing uniform skeleton; the BA deepening rides existing hub + handoff fields; the marker-close edits are in-place prose flips). This is an introspective extension phase — the planner should reference the analogs above, not RESEARCH's external patterns (there are none — zero external dependencies).

---

## Metadata

**Analog search scope:** `scripts/` (both foundation-guard scripts read in full), `agent-factory/roles/` (4 representative roles read in full: brownfield-mapper, orchestrator, ba-pm, agents-md-scribe; all 16 sized via `wc`), `agent-factory/workflows/07-backlog-refinement.md`, `agent-factory/checklists/definition-of-ready.md`, `agent-factory/handoffs/{product-handoff,ticket-ready-packet}.md`, `agent-factory/packaging/{subagent.frontmatter,slash-command.template}.md` (frontmatter grep), `.planning/{PROJECT,STATE,RETROSPECTIVE}.md` + `v1.2-SDLC-COVERAGE-AUDIT.md` (WR-05 marker grep + context reads).
**Files scanned:** 12 read in full + 16 role files sized + 4 tracking docs grepped.
**Live-tree verification:** all 16 role byte/line sizes re-measured and match the RESEARCH baseline exactly; `guard_wr05` frontmatter confirmed spawn-free; WR-05 marker line numbers confirmed.
**Pattern extraction date:** 2026-06-10
```