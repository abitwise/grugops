# Phase 11: Senior Persona Overhaul - Research

**Researched:** 2026-06-10
**Domain:** In-place senior rewrite of markdown role prompts + three POSIX-sh mechanical guards (grugops agent-factory kit; introspective phase — no runtime, no external libraries)
**Confidence:** HIGH (all findings verified against the live codebase; the guard scripts were executed, the voice-lint expansion was simulated empirically)

## Summary

Phase 11 is a **markdown-content + POSIX-sh-guard** phase, not a software build. There are no external libraries to research, no package legitimacy audit, no version pins — every finding here comes from reading and running the existing repo. The work has three independent tracks: (PERS-01) a holistic senior rewrite of 16 role prompts *in place* preserving the terse caveman voice, protected by three mechanical guards; (PERS-02) a prose-only senior deepening of the business-analysis layer (`ba-pm.md` + workflow 07 + the `definition-of-ready.md` hub); and (PERS-03) verify-and-close of the already-retired WR-05 spawn grant.

The single most load-bearing finding is a **guard hazard the planner must design around**: the Phase-10 `guard_voice` uses a `\bgrug\b` marker that, when D-05 expands the scan to all 16 roles, **already trips two false positives on the clean tree** — `orchestrator.md` (the `/grug` brand command; `/` is a word boundary so `\bgrug\b` matches) and `agents-md-scribe.md` (clear-voice meta-references to "grug wink" / "grug voice"). A naive `VOICE_FILES="all 16"` change ships the guard RED. The planner must include a marker-refinement task (e.g. exclude `/grug`, exclude the Scribe's voice-meta lines, or refine the ERE to require a caveman *idiom context*) BEFORE the expansion is asserted green. This is verified, not theoretical — I ran the simulation.

**Primary recommendation:** Sequence the phase as (1) the senior rewrite of all 16 roles + the BA-layer deepening as content, (2) author the two new guards (`guard_caveman_preserved`, `guard_role_size`) and the D-05 voice expansion *after* the content is clean and the false-positive marker refinement is in place, shipping GREEN-with-fail-proof per the Phase-10 pattern, (3) verify WR-05 and close the four tracking markers. All guard work stays POSIX sh / `set -eu` / `printf` / ugrep-portable flags — the TS pivot is HELD.

## Architectural Responsibility Map

grugops has no application tiers; its "tiers" are kit artifact classes. Mapping each capability to the artifact that owns it:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Senior persona judgment (PERS-01) | Role prompt body (`agent-factory/roles/*.md`) | — | Single-source: persona lives once under `agent-factory/`; adapters are pointers and are NOT touched (SC4 stays green for free) |
| Caveman voice preservation (D-04/D-06) | Role prompt `## Caveman prompt` block | Guard script (`guard_caveman_preserved`) | The block is the token-economy mechanism; the guard mechanically protects it |
| Token-economy / no-bloat (D-04/D-07) | Guard script (`guard_role_size`) | Role prompt body | Enforced in code, not convention — a bloated rewrite fails red |
| Voice discipline (D-05) | Guard script (`guard_voice`) | Role prompt clear-voice sections | Clear voice in safety/security lines; caveman in the prompt block + punchy body |
| Senior BA prose (PERS-02) | `definition-of-ready.md` (hub) | `ba-pm.md`, `07-backlog-refinement.md` (pointers) | Single-source: DoR is the one home; role + workflow point to it, no duplication |
| WR-05 no-spawn (PERS-03) | Packaging templates (`subagent.frontmatter.md`, `slash-command.template.md`) | Guard script (`guard_wr05`), tracking docs | Frontmatter token absent (verified); explanatory prose intentionally kept; guard re-run is regen-safety |
| Mechanical proof (all) | Fail-proof harness (`check-foundation-guards.test.sh`) | — | Each guard ships GREEN with a planted-violation proof it fails RED |

## Standard Stack

**No external libraries, no package installs, no version pins.** This phase ships markdown + POSIX-sh edits to grugops's own repo. The "stack" is the existing kit toolchain, all verified present on this host:

| Tool | Version (verified) | Purpose | Why Standard |
|------|--------------------|---------|--------------|
| POSIX sh | system `/bin/sh` | Guard scripts (`set -eu`, `printf`, no bashisms) | `[VERIFIED: scripts/check-foundation-guards.sh ran green]` — kit house style; no npm deps (TS pivot HELD) |
| ugrep (grep) | 7.5.0 aarch64 | All guard greps | `[VERIFIED: grep --version on this host]` — host grep is **ugrep-aliased**; portability constraint is real (see Pitfall 3) |
| awk | system awk | Strip the `## Caveman prompt` block in `guard_voice` | `[VERIFIED: guard_voice ran green]` — already used; D-06 reuses the same strip logic inverted |
| wc / tr / test | POSIX coreutils | Byte counts for size guards | `[VERIFIED: guard_adapter_size template ran green]` |
| Markdown (CommonMark + YAML frontmatter) | n/a | All role/workflow/checklist/handoff content | `[CITED: CLAUDE.md tech stack]` — the whole kit is markdown |

**Installation:** None. No `npm install`, no `pip install`. Adding any npm runtime dep to grugops is explicitly **Out of Scope** `[CITED: REQUIREMENTS.md § Out of Scope]`.

### Alternatives Considered (and rejected by locked constraints)
| Instead of | Could Use | Why rejected |
|------------|-----------|--------------|
| POSIX sh guards | TypeScript/Node guards | TS pivot is HELD `[CITED: 11-CONTEXT.md deferred, MEMORY ts-pivot-held]` — do not smuggle it in |
| `\bgrug\b` ERE | `grep -P` PCRE lookahead | Host is ugrep; `-P` is non-portable per guard header `[VERIFIED: scripts/check-foundation-guards.sh L40]` |
| New DoR/INVEST checklist file | A standalone `invest-checklist.md` | D-08 locks single-source: `definition-of-ready.md` is the one hub, no new file |
| New role section (What good looks like / When to escalate) | Enumerated quality section | D-01 killed this — model already carries generic quality knowledge; value is the persona |

## Package Legitimacy Audit

**Not applicable.** This phase installs **zero external packages** — it edits grugops's own markdown and POSIX-sh files. No npm/PyPI/crates registry interaction occurs. The slopcheck/registry-verification protocol has no inputs. (Adding npm deps to grugops is a standing Out-of-Scope boundary.)

## Architecture Patterns

### System Diagram — how a senior rewrite flows through the guards

```
                      ┌─────────────────────────────────────────────┐
   16 role files ────▶│  PERS-01: holistic senior rewrite IN PLACE   │
   (2220–6286 B)      │  • deepen judgment in existing skeleton       │
                      │  • preserve One job, contract sections,        │
                      │    ## Caveman prompt, pointer discipline,      │
                      │    AGENTS.md footer  (D-02/D-03)               │
                      │  • flat-or-smaller bytes  (D-04)               │
                      └───────────────┬─────────────────────────────┘
                                      │ (content must be clean FIRST)
                                      ▼
        ┌─────────────────────────────────────────────────────────────┐
        │  Author guards AFTER clean state (ship GREEN + fail-proof)    │
        │                                                               │
        │  guard_voice  (D-05: VOICE_FILES → all 16)                    │
        │     strip ## Caveman prompt block → grep remainder for         │
        │     VOICE_MARKERS.  ⚠ MUST refine markers first (see Pitfall 1)│
        │                                                               │
        │  guard_caveman_preserved (D-06: positive inverse)             │
        │     assert block exists + non-empty + ≥1 marker, per role     │
        │                                                               │
        │  guard_role_size (D-07: mirror guard_adapter_size)            │
        │     per-file byte ceiling, two-tier WARN→FAIL                 │
        └───────────────┬───────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────────────┐
        │  check-foundation-guards.test.sh (fail-proof)   │
        │  mirror-and-mutate: plant sanded-caveman role    │
        │  (D-06 RED) + oversized role (D-07 RED) +        │
        │  expanded voice scan; smoke green on real tree   │
        └───────────────────────────────────────────────┘

   PERS-02 (parallel, prose-only):  ba-pm.md ─┐
                                    07-refine ─┼──▶ definition-of-ready.md (HUB)
                                               │     + INVEST + measurable-NFR lines
                            (pointers, no copy) ┘     (keep ticket-ready-packet.md aligned!)

   PERS-03 (parallel, verify+close):  guard_wr05 re-run AFTER rewrite ─▶ GREEN
                                      close 4 markers: PROJECT.md L134, STATE.md L242,
                                      audit L44/170/191, RETROSPECTIVE.md L25
```

### The 16-role uniform skeleton (verified across 3 sampled roles + structurally across all 16)

```
---
kind: role
tier: core
---
# Role: <Name>
[> Kit vs state invariant: ...]   ← ONLY orchestrator.md carries this banner
## One job                         ← single responsibility (D-03: do NOT change scope)
## Caveman prompt                  ← fenced ``` block, grug voice (D-06 protects this)
## Reads                           ← contains `.grugops/` refs (the \bgrug\b safe case)
## Activates when
## Responsibilities
## Output (file + format)          ← contract section (D-03 preserve)
## Board moves ...                 ← contract section (D-03 preserve)
## Trace updates ...               ← contract section (D-03 preserve)
## Hard limits                     ← clear voice for safety lines
Follow the 12 coding rules in `AGENTS.md`.   ← footer (D-03 preserve; 14 of 16 carry it)
```

**Skeleton deviations the planner must know:**
- **`orchestrator.md`** — largest (6286 B, 125 L), carries the `> Kit vs state invariant` banner at top, adds a Routing matrix, WIP/DoR gate, XL-split, and a workflow-mapping table. It is the **legitimate size outlier** (D-07 ceiling must not punish it).
- **`agents-md-scribe.md`** — does NOT carry the `Follow the 12 coding rules` footer (it *owns* the rules instead of inheriting them); legitimately discusses "grug voice" in clear-voice prose.
- **`_role-switch-protocol.md`** — has **no `## Caveman prompt` block** (verified: 0 matches) → it is the protocol, NOT a persona → it is correctly NOT one of the 16. Do not add it to any guard scan set, do not rewrite it as a persona.

### Pattern 1: Ship GREEN + fail-on-mutation proof (the Phase-10 guard pattern — reuse verbatim)
**What:** Author the new guards AFTER the content is clean so they ship passing; prove they *can* fail by planting one real violation per guard in a hermetic mirror and asserting nonzero-exit + the finding names the defect.
**When to use:** Every new guard in this phase (D-06, D-07) and the D-05 expansion.
**Example (the existing fail-proof shape, to extend):**
```sh
# Source: scripts/check-foundation-guards.test.sh (verified, runs green)
M=$(mirror voice-marker)
printf '\ngrug smash the bug.\n' >> "$M/agent-factory/roles/security-nfr.md"
expect_fail "voice marker in clear-voice surface → nonzero + role path" "$M" "security-nfr.md"
```

### Pattern 2: Section-scoped voice strip (the awk that D-05 extends and D-06 inverts)
**What:** Strip the single fenced `## Caveman prompt` block, then operate on the remainder.
**Example (verified — this is the live `guard_voice` strip):**
```sh
# Source: scripts/check-foundation-guards.sh guard_voice (verified, runs green)
body=$(awk '
  /^## Caveman prompt/ {skip=1}
  skip && /^```/        {fence++; if(fence==2){skip=0;fence=0}; next}
  skip                  {next}
  {print}
' "$f")
m=$(printf '%s\n' "$body" | grep -nE "$VOICE_MARKERS" || true)
```
**D-06 is the positive inverse:** instead of greping the *remainder* for markers, grep the *stripped block* and assert it is non-empty AND contains ≥1 marker. The awk can be inverted (print only while `skip` is set, between fences) or a second small awk added.

### Pattern 3: Single-source pointer hub (PERS-02)
**What:** `definition-of-ready.md` is the one home for the INVEST/NFR gates; `ba-pm.md` and `07-backlog-refinement.md` *point to* it (they already do — both read `definition-of-ready.md`). No duplication, no new file.
**Critical alignment constraint:** `ticket-ready-packet.md` carries **one field per DoR check, one-to-one** (verified: each `## field` has a `<!-- DoR: ... -->` comment mapping to a DoR line). If D-08 adds checks to `definition-of-ready.md`, the packet must stay aligned or the gate desyncs. The packet's own footer says "keep aligned with that file."

### Anti-Patterns to Avoid
- **Re-engineering the `guard_voice` awk anchor (D-05):** Phase 10's CONTEXT explicitly says the anchor "everything EXCEPT `## Caveman prompt`" is forward-compatible and Phase 11 must NOT re-engineer it. Extend `VOICE_FILES`; refine `VOICE_MARKERS` only for a real false positive.
- **A flat single byte ceiling for `guard_role_size`:** would either punish the legitimately-large orchestrator (6286 B) or be so high it lets every other role bloat to 6 KB. Use per-file-relative or a single ceiling set just above orchestrator (see Open Question 1).
- **Adding a new role section or new capability:** D-01/D-03 forbid both. Persona + voice deepen; scope does not.
- **Trimming the WR-05 explanatory "spawn" prose in the templates:** D-10 keeps it — it documents *why* there is no spawn tool, and `guard_wr05` intentionally matches only the frontmatter token, never the prose word.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Strip the caveman block | A new fence parser | The existing `guard_voice` awk (verified) | Already handles the single fenced block + nested fences correctly |
| Hermetic guard testing | A new test scaffold | The `mirror`/`run_in`/`expect_fail` harness (verified) | Already mirrors inputs, plants one violation, asserts RED, never touches the real repo/$HOME |
| Byte-ceiling guard | A line-count check | The `guard_adapter_size` byte template (verified) | Byte-based is deliberate — line count under-counts a bloated file; mirror this for `guard_role_size` |
| Two-tier WARN→FAIL | A single hard fail | The `WARN`/`FAIL` helper pattern (verified) | `warn()` does NOT increment FAILS (advisory early signal); `fail()` does — already correct |
| DoR ↔ packet sync | A second checklist | `definition-of-ready.md` as hub + the existing one-to-one packet mapping | D-08 single-source; the packet already mirrors the DoR field-for-field |

**Key insight:** Phase 11 adds almost no new mechanism — it *extends* three proven Phase-10 patterns (`guard_voice` scan set, the byte-ceiling guard, the mirror-and-mutate harness) and inverts one (the caveman strip → caveman-preserved assert). The risk is not in inventing; it is in the voice-marker false positives that the expansion surfaces.

## Runtime State Inventory

> This is a rewrite/refactor phase (in-place senior rewrite of role prompts). After every role file is rewritten, what runtime/registered/stored state still references the old content?

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None** — grugops ships no runtime, no DB, no datastore. Role prompts are read fresh by the host agent each session. Verified: the kit is markdown-only `[CITED: CLAUDE.md]`. | None |
| Live service config | **None** — no external service holds role-prompt content. Verified: no service integration in the kit. | None |
| OS-registered state | **None** — no scheduled tasks, no daemons. The host coding-agent CLI reads files at session start. | None |
| Secrets/env vars | **None for content.** `${GRUGOPS_HOME}` env var exists but is a *path resolver* named only in the two resolver adapters + `subagent.frontmatter.md` — the rewrite does not touch path resolution `[VERIFIED: slash-command.template.md Notes]`. | None |
| Build artifacts / materialized adapters | **The two materialized adapters** (`.claude/skills/grugops/SKILL.md` 1552 B, `.claude/agents/grugops-orchestrator.md` 1736 B) are pointer-only and do NOT copy role bodies `[VERIFIED: guard_adapter_size green, both pointer-sized]`. The senior rewrite does NOT touch them → single-source adapter check (SC4) stays green for free. | None for the rewrite. **But** PERS-03 must verify the adapters' frontmatter stays spawn-free (already verified green) after any regeneration. |

**The canonical question — after every role file is rewritten, what still carries stale content?** Nothing. There is no cache, no DB, no registered task. The only "downstream copy" risk is regenerating adapters from the packaging templates (the WR-05 hazard) — which is exactly why PERS-03 re-runs `guard_wr05` after the rewrite. `[VERIFIED: PITFALLS.md Pitfall 1]`

## Common Pitfalls

### Pitfall 1: D-05 voice expansion ships the guard RED on the clean tree (THE load-bearing finding)
**What goes wrong:** Setting `VOICE_FILES` to all 16 roles makes `guard_voice` FAIL immediately — before any rewrite — because two roles legitimately use the word "grug" in clear voice and `\bgrug\b` matches them.
**Why it happens:** `\bgrug\b` treats `/` as a word boundary, so `/grug` (the brand command in `orchestrator.md`) matches. And `agents-md-scribe.md` discusses the voice discipline itself ("a light grug wink permitted only in Mission", "echo them in grug voice") in clear-voice prose.
**Verified evidence (I ran this):**
```
!! orchestrator.md:35  — "...every `/grug` request starts here."        → \bgrug\b matches /grug
!! agents-md-scribe.md:28 — "...a light grug wink permitted only in Mission"  → matches
!! agents-md-scribe.md:30 — "...echo them in grug voice inside this body..."  → matches
```
(`.grugops/` correctly does NOT match — `grugops` continues with a word char, no boundary.)
**How to avoid:** Refine `VOICE_MARKERS` or add a narrow exclusion BEFORE the expansion is asserted green. Options for the planner to choose (Claude's discretion per D-05, "tune the marker ERE only if a real false-positive surfaces — don't weaken the guard"):
  1. Exclude the `/grug` literal: pre-filter lines matching `/grug` (the brand command is not caveman voice).
  2. Exclude the Scribe's voice-meta lines, OR keep the Scribe's two lines as accepted clear-voice (they describe the voice rule, they are not written *in* caveman voice).
  3. Tighten `\bgrug\b` to require a caveman idiom context (riskier — could weaken the catch; the existing markers already include idioms like `me think`/`no think` that don't false-positive).
**Warning signs:** `guard_voice` FAILs on orchestrator.md or agents-md-scribe.md with a `/grug` or "grug voice/wink" finding — that is a false positive, not a real violation.

### Pitfall 2: D-07 size ceiling punishes the orchestrator or licenses bloat
**What goes wrong:** A flat byte ceiling either fails the legitimately-large `orchestrator.md` (6286 B vs the next-largest 4085 B) or, set above 6286 B, lets every other role bloat 50%+.
**Why it happens:** The 16 roles are NOT uniform in size — orchestrator carries a routing matrix + workflow table the others don't.
**How to avoid:** Prefer a **per-file-relative** ceiling (current bytes + a small headroom %, e.g. +10–15%) so each role is held flat-or-smaller against ITS OWN current size; or a single ceiling set just above orchestrator's 6286 B with per-file WARN at current+%. D-04 wants "re-sharpen in place, not expand." Capture current sizes (table below) so thresholds are deterministic + documented.
**Warning signs:** A rewrite that grows a 2800 B role to 4000 B passes; or orchestrator fails for being orchestrator.

**Current role-file sizes (verified `wc -c`/`wc -l`, the D-07 baseline):**

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

(`_role-switch-protocol.md` = 2326 B — NOT one of the 16, exclude from the size guard.)

**Note on PERS-02 tension:** `ba-pm.md` (2745 B) gets a senior BA deepening (D-08). Per D-04 the deepening must be *sharper judgment per token*, not expansion — but BA is the one role explicitly getting *more* judgment woven in. The planner should set ba-pm's ceiling with awareness that a modest, justified growth here is acceptable while still failing a *bloated* rewrite. This is the one place D-07 thresholds and PERS-02 interact.

### Pitfall 3: A non-portable grep flag breaks the guard on the ugrep host
**What goes wrong:** Using `-P`, `-z`, `--include`, or relying on default recursive globbing breaks because the host grep is **ugrep 7.5.0** (verified).
**Why it happens:** The guard header explicitly restricts to `-r -n -l -E -F -q -v` and forbids `-P`/`-z`/`--include` `[VERIFIED: scripts/check-foundation-guards.sh L40]`.
**How to avoid:** Stay within the documented flag set; use explicit SCAN lists, never a repo-wide grep (the repo legitimately carries "Agent"/"spawn"/"grug" in fixtures, docs, examples, .planning).
**Warning signs:** Guard works on dev machine but the house-style constraint is violated; a repo-wide grep picks up legitimate prose hits.

### Pitfall 4: WR-05 regeneration silently re-arms spawn
**What goes wrong:** Touching the packaging templates during the persona overhaul (or regenerating adapters from them) re-introduces a spawn grant.
**Why it happens:** Source-of-truth confusion — adapters correct, templates assumed-fixed-but-not-re-read `[VERIFIED: PITFALLS.md Pitfall 1]`.
**Current state (verified — already safe):** Both templates carry NO `Agent`/`Task` token in frontmatter. `subagent.frontmatter.md` `tools:` = `Read, Grep, Glob, Bash, Edit, Write`; `slash-command.template.md` `allowed-tools:` = `Read, Write, Bash, Glob, Grep`. `guard_wr05` PASSES. The explanatory "spawn"/"sub-agent" prose is intentionally present (D-08/D-10).
**How to avoid:** PERS-03 re-runs `guard_wr05` AFTER the rewrite (regen-safety); do not edit the templates' frontmatter; keep the explanatory prose.
**Warning signs:** Any diff adding `tools: Agent` or `- Agent` to a template/adapter.

### Pitfall 5: Breaking the DoR ↔ ticket-ready-packet one-to-one mapping
**What goes wrong:** D-08 adds INVEST/NFR lines to `definition-of-ready.md` but `ticket-ready-packet.md` is not updated, desyncing the gate.
**Why it happens:** The packet mirrors the DoR field-for-field (verified: each `## field` has a `<!-- DoR: ... -->` comment); they are coupled by contract.
**How to avoid:** If D-08 adds a DoR check that the Orchestrator gates on, mirror it in the packet (or confirm the new INVEST/NFR rigor lands inside *existing* DoR lines so no new field is needed). The packet footer says "keep aligned with that file."

## Code Examples

### The D-06 caveman-preserved assertion (inverse of the verified strip)
```sh
# Pattern: assert the ## Caveman prompt block exists, is non-empty, has ≥1 marker.
# Reuses VOICE_MARKERS (D-06 discretion: align markers with the existing list).
# Print ONLY the lines INSIDE the fenced block, then assert non-empty + markered.
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
*(Illustrative — the planner finalizes the awk; the existing `guard_voice` awk is the verified reference for the fence-counting idiom.)*

### The D-07 size ceiling (mirror of the verified guard_adapter_size)
```sh
# Source pattern: scripts/check-foundation-guards.sh guard_adapter_size (verified)
# Per-file-relative or single-ceiling — see Open Question 1 for the threshold decision.
ROLE_FILES="agent-factory/roles/agents-md-scribe.md ... (all 16, _role-switch-protocol.md EXCLUDED)"
for f in $ROLE_FILES; do
  [ -f "$f" ] || { fail "$f missing (role required)"; continue; }   # CR-01 missing-file fail-red
  b=$(wc -c < "$f" | tr -d ' ')
  if   [ "$b" -ge "$ROLE_FAIL" ]; then fail "$f ${b}B >= ${ROLE_FAIL}B — role bloated (senior != verbose)"
  elif [ "$b" -ge "$ROLE_WARN" ]; then warn "$f ${b}B >= ${ROLE_WARN}B — approaching ceiling"
  else pass "$f ${b}B within ceiling"; fi
done
```
**Critical:** mirror the CR-01 missing-file fail-red guard (a deleted role must fail red naming the path, not vacuous-pass on an empty `wc -c <`).

### The WR-05 verify (already green; PERS-03 re-runs this exact guard)
```sh
# Source: scripts/check-foundation-guards.sh guard_wr05 (verified PASS)
WR05_COMMA='^(tools|allowed-tools):.*\b(Agent|Task)\b'
WR05_ARRAY='^[[:space:]]*-[[:space:]]*(Agent|Task)\b'
# Matches the frontmatter TOKEN only — never the prose word "spawn" (D-08/D-10 keep that prose).
```

## State of the Art

Not applicable in the usual sense — no external library evolution drives this phase. The relevant "state of the art" is internal: the Phase-10 guard patterns are current (shipped 2026-06-10) and are the canonical templates to extend.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PERS-01 = "add a What-good-looks-like / When-to-escalate section" | In-place persona deepening, NO new section | discuss-phase 2026-06-10 (D-01/D-11) | ROADMAP SC1 + REQUIREMENTS PERS-01 amended; the verifier checks the new bar. **Stale wording remains in `v1.2-SDLC-COVERAGE-AUDIT.md` L170** ("what good looks like / when to escalate on every role") — flag for the planner: this audit line predates the reframe; closing the WR-05 marker is a natural moment to reconcile it too, but it is NOT in the locked D-10 marker-close list. |
| Voice-lint over 3 curated surfaces | Voice-lint over all 16 roles | Phase 11 (D-05) | Surfaces the false-positive hazard (Pitfall 1) |

**Deprecated/outdated:** The "section exists" success bar for PERS-01 is dead (D-11). Any plan that adds a new role section contradicts the locked decision.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A per-file-relative or just-above-orchestrator size ceiling is the right D-07 strategy | Pitfall 2 / Open Q1 | If a flat number is chosen instead, either orchestrator fails or bloat is licensed — the planner/user picks the exact numbers (D-07 is Claude's discretion) |
| A2 | The 3 false-positive lines (orchestrator `/grug`, scribe ×2) are the ONLY clean-tree voice false positives across 16 roles | Pitfall 1 | LOW risk — I ran the full 16-role simulation; but a senior rewrite could *introduce* new clear-voice "grug" prose, so the marker refinement must be robust, not just patch these 3 lines |
| A3 | PERS-02's BA deepening lands inside existing DoR lines / handoff fields, needing no new packet field | Pitfall 5 | If a new gated DoR check is added, `ticket-ready-packet.md` must be updated in the same plan or the gate desyncs |
| A4 | Audit L170 stale wording is out of the locked D-10 close-list and need not be touched | State of the Art | LOW — flagged for planner awareness; D-10 enumerates exactly 4 marker locations (PROJECT/STATE/audit-observation/RETRO), and the audit *observation* lines are 44/191, not the GAP-2 table row 170 |

## Open Questions

1. **D-07 exact byte/line thresholds (Claude's discretion, must lock in the plan).**
   - What we know: current sizes (table above); orchestrator 6286 B is the legit outlier; next-largest 4085 B; D-04 wants flat-or-smaller; `guard_adapter_size` uses byte-based two-tier WARN 3072 / FAIL 4096.
   - What's unclear: per-file-relative (current+%) vs single ceiling above 6286 B; the exact headroom %.
   - Recommendation: **per-file-relative** ceiling = `current_bytes + ~12%` headroom as FAIL, `current_bytes + ~6%` as WARN, computed once and **hard-coded as documented constants** (not computed live — a live "current size" makes the guard tautological). This holds each role flat-or-smaller against its committed baseline. Document the baseline-capture date. ba-pm.md (PERS-02) may warrant a slightly larger explicit headroom — call it out in the guard comment.

2. **D-05 marker-refinement choice (Claude's discretion).**
   - What we know: 3 clean-tree false positives (Pitfall 1); D-05 says "don't weaken the guard."
   - What's unclear: pre-filter `/grug` vs accept the Scribe lines vs tighten the ERE.
   - Recommendation: pre-filter the `/grug` brand-command literal (it is unambiguously not caveman voice) AND treat the Scribe's two voice-meta lines as accepted (they *describe* the voice rule in clear prose; an inline `# voice-meta: accepted` style allowlist or excluding `grug voice|grug wink` phrases). Keep `\bgrug\b` otherwise — bare `grug smash` must still fail.

3. **Should `v1.2-SDLC-COVERAGE-AUDIT.md` L170 stale "what good looks like" wording be reconciled?**
   - What we know: it predates the D-11 reframe; D-10 locks 4 marker locations and L170 (the GAP-2 table row) is not among them.
   - What's unclear: whether the user wants source-of-truth consistency extended here.
   - Recommendation: flag to the user during planning; reconciling it is cheap and matches the D-11 "keep the source of truth truthful" intent, but it is strictly out of the locked D-10 close-list — get explicit confirmation before editing.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| POSIX sh | Guard scripts | ✓ | system | — |
| grep (ugrep) | All guard greps | ✓ | 7.5.0 | — (portability constraint: no `-P`/`-z`) |
| awk | Caveman-block strip | ✓ | system | — |
| wc / tr / test / cmp | Size guards + harness | ✓ | system | — |
| mktemp | Hermetic harness | ✓ | system | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None. All guard tools verified present (the guards and harness both ran green this session).

## Validation Architecture

> nyquist_validation is not disabled in config — section included. This phase *ships* mechanical verification, so the testable surface is unusually large.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | POSIX-sh fail-proof harness (no external test runner — npm deps Out of Scope) |
| Config file | none — scripts are self-contained |
| Quick run command | `sh scripts/check-foundation-guards.sh` (read-only gate; exit 0 = all green) |
| Full suite command | `sh scripts/check-foundation-guards.test.sh` (fail-proof harness: each guard proven RED on a planted violation + smoke-green on the real tree) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERS-01 | All 16 roles free of caveman markers in clear-voice body | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_voice`, VOICE_FILES expanded) | ✅ guard exists; ❌ expansion + marker-refinement = this phase |
| PERS-01 | Every role keeps a non-empty `## Caveman prompt` block with ≥1 marker | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_caveman_preserved`) | ❌ NEW guard — this phase |
| PERS-01 | No role file bloats past its ceiling | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_role_size`) | ❌ NEW guard — this phase |
| PERS-01 | Each guard provably fails RED on a sanded/oversized role | mechanical | `sh scripts/check-foundation-guards.test.sh` (new fixtures) | ✅ harness exists; ❌ 2 new fixtures + expanded voice case = this phase |
| PERS-01 | One job / contract sections / pointer discipline / footer preserved | **prose-judgment** | human/spot review per role (NOT mechanically verifiable) | n/a — manual |
| PERS-01 | Senior depth (long-term experience + forward-thinking) actually landed | **prose-judgment** | human/spot review per role | n/a — manual |
| PERS-02 | INVEST / measurable-NFR gates present in `definition-of-ready.md`; ba-pm + workflow 07 point to it | **prose-judgment** (+ optional grep that the pointers exist) | human review; optional `grep -l definition-of-ready.md` pointer check | partial |
| PERS-02 | DoR ↔ ticket-ready-packet stay one-to-one aligned | mechanical-ish | spot-check / optional field-count diff | manual |
| PERS-03 | No spawn grant in template/adapter frontmatter, after the rewrite | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_wr05`) | ✅ guard exists + PASSES — re-run is the test |
| PERS-03 | WR-05 marker closed in PROJECT/STATE/audit/RETRO | doc-check | `grep -n "WR-05" .planning/{PROJECT,STATE}.md ...` shows retired wording | manual diff |
| (SC4) | Adapters stay pointer-sized (single-source) | mechanical | `sh scripts/check-foundation-guards.sh` (`guard_adapter_size`) | ✅ PASSES for free (rewrite doesn't touch adapters) |
| (config) | config JSONs byte-identical | mechanical | `sh scripts/check-foundation-guards.test.sh` (`cmp -s`) | ✅ PASSES |

### Sampling Rate
- **Per task commit:** `sh scripts/check-foundation-guards.sh` (fast, read-only — must stay GREEN after every role rewrite + guard edit).
- **Per wave merge:** `sh scripts/check-foundation-guards.test.sh` (full fail-proof — proves the new guards can fail RED).
- **Phase gate:** both green + a human/spot review of senior depth across the 16 roles (the prose-judgment surface that no guard can check) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `guard_caveman_preserved` added to `scripts/check-foundation-guards.sh` — covers PERS-01 (D-06)
- [ ] `guard_role_size` added to `scripts/check-foundation-guards.sh` — covers PERS-01 (D-07); thresholds locked per Open Q1
- [ ] `guard_voice` `VOICE_FILES` expanded to all 16 + `VOICE_MARKERS` refined for the 3 false positives — covers PERS-01 (D-05)
- [ ] `check-foundation-guards.test.sh` fixtures: a sanded-caveman role (D-06 RED), an oversized role (D-07 RED), and the expanded-voice scan — adds to `GUARD_INPUTS` the 13 not-yet-mirrored roles
- [ ] No new framework install needed (POSIX sh; the harness exists)

## Security Domain

**Not applicable in the ASVS sense** — this phase ships no auth, no data handling, no cryptography, no input from untrusted sources. The relevant "security" property is grugops's own safety invariant, which this phase touches indirectly:

| Property | Applies | Control |
|----------|---------|---------|
| No-spawn single-window (WR-05) | yes | `guard_wr05` re-run after the rewrite; frontmatter token absent (verified) — preserves the portability/safety design across 5 host CLIs |
| Humans hold merge/deploy | unchanged | The rewrite preserves every role's `Hard limits` clear-voice safety lines (D-03); the orchestrator/release safety lines stay plain English |
| No fabrication | yes | Guards never fabricate a pass; `UNKNOWN - verify` discipline preserved in the rewrite |
| Two-voice discipline (security/compliance findings in clear voice) | yes | `guard_voice` mechanically enforces clear voice on security-nfr/compliance/incident surfaces; D-05 extends the net |

OWASP ASVS anchoring is **Phase 14** (SEC-01/02/03), explicitly deferred — do not pull it forward.

## Sources

### Primary (HIGH confidence — live codebase, executed)
- `scripts/check-foundation-guards.sh` — read in full; executed (ALL CHECKS PASSED). Source of `guard_voice` strip, `guard_adapter_size` template, `guard_wr05` EREs, the ugrep flag constraint.
- `scripts/check-foundation-guards.test.sh` — read in full; executed (ALL CHECKS PASSED). Source of the mirror-and-mutate harness, `GUARD_INPUTS`, `expect_fail`.
- `agent-factory/roles/*.md` — sizes captured for all 16 (`wc -c`/`wc -l`); ba-pm/security-nfr/brownfield-mapper/orchestrator read in full; skeleton confirmed; D-05 expansion simulated empirically across all 16.
- `agent-factory/packaging/{subagent.frontmatter.md,slash-command.template.md}` — read in full; WR-05 frontmatter confirmed spawn-free, explanatory prose confirmed present.
- `agent-factory/{workflows/07-backlog-refinement.md, checklists/definition-of-ready.md, handoffs/product-handoff.md, handoffs/ticket-ready-packet.md}` — read in full; single-source pointer + DoR↔packet one-to-one mapping confirmed.
- `grep --version` → ugrep 7.5.0 (host grep identity verified).
- `.planning/11-CONTEXT.md`, `REQUIREMENTS.md`, `ROADMAP.md` — read in full (locked decisions D-01..D-11, amended SC1/PERS-01).
- `.planning/research/PITFALLS.md` Pitfall 1, `.planning/PROJECT.md` L134, `.planning/STATE.md` L242, `.planning/v1.2-SDLC-COVERAGE-AUDIT.md` L44/170/191, `.planning/RETROSPECTIVE.md` L25 — exact marker locations for D-10 close.

### Secondary / Tertiary
- None. No web search or external docs were needed or used — this phase has no external dependencies.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — there is no external stack; the kit toolchain was executed.
- Architecture / patterns: HIGH — patterns read from working, executed guard scripts.
- Pitfalls: HIGH — Pitfall 1 (the voice false positives) and Pitfall 4 (WR-05 state) were verified empirically, not assumed.
- D-07 thresholds / D-05 marker choice: MEDIUM — the strategy is recommended and the inputs (sizes, false positives) are verified, but the exact numbers/ERE are Claude's-discretion decisions the plan must lock.

**Research date:** 2026-06-10
**Valid until:** Stable — internal codebase research; valid until the guard scripts or role skeleton change (no external-dependency decay).
