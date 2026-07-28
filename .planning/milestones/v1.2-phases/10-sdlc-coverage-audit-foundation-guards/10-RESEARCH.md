# Phase 10: SDLC-Coverage Audit & Foundation Guards - Research

**Researched:** 2026-06-09
**Domain:** POSIX-sh mechanical build guards + JSON config-dial schema evolution + a self-introspective SDLC-coverage audit over a markdown agent kit
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Audit lives in `.planning/` (internal planning artifact, NOT shipped, NOT `docs/`). Suggested filename `.planning/v1.2-SDLC-COVERAGE-AUDIT.md`, mirroring `.planning/milestones/v1.1-MILESTONE-AUDIT.md`.
- **D-02:** Format = a lifecycle-stage × role/workflow coverage matrix (each cell: covered / partial / gap) + a short narrative per real gap. Business→engineer handoff called out explicitly. Audit against the canonical PROJECT.md lifecycle: business analysis → product → system analysis → architecture → engineering → QE/E2E → security/NFR/compliance → UAT → release.
- **D-03:** Records each gap AND maps it to the v1.2 phase (11–17) that addresses it; flags any gap the roadmap does NOT cover. Confirms roadmap sufficiency; does NOT re-scope/rewrite the roadmap.
- **D-04:** Four guards in ONE POSIX-sh aggregator `scripts/check-foundation-guards.sh`, four named guard functions, one command runs all four, each fails red independently, a single fail-proof test file covers them.
- **D-05:** Language is POSIX sh. ⚑ The TypeScript pivot is HELD (project-level decision); do NOT action it here.
- **D-06:** Local-only — no `.github/` CI. Aggregator stays CI-ready (single command, clean exit codes).
- **D-07:** Size guards are two-tier WARN→FAIL with a safety margin. AGENTS.md FAILs BELOW the 32 KiB cap (headroom). Adapters capped at a pointer-sized ceiling. Exact numbers → Claude's Discretion (locked below).
- **D-08:** WR-05 guard matches an actual spawn grant in frontmatter ONLY — a `tools:` / `allowed-tools:` list containing `Agent` or `Task`. Does NOT match the prose word "spawn"/"sub-agent".
- **D-09:** Fix `agent-factory/packaging/adapters.md` now (stale "Orchestrator spawns role agents with the `Agent` tool" prose). The WR-05 guard's scan set stays exactly at: 2 packaging templates + 2 materialized adapters. `adapters.md` fix is recorded in the audit; NOT added to guard scope.
- **D-10:** Voice-discipline lint = a curated caveman-marker word list scanned section-scoped over curated clear-voice surfaces only (NOT whole-file). Initial surfaces: `security-nfr`, `compliance-officer`, `incident-responder` roles; the safety lines; security/compliance/warning sections of workflows + checklists. Forward-compatible with Phase 11's "What good looks like / When to escalate" clear-voice sections. Exact surface list + anchoring mechanism + marker word list → Claude's Discretion (locked below).
- **D-11:** Lean→enterprise contract lives by extending `agent-factory/config/factory.config.md` with an "Enterprise escalation" column/section per key. NOT in AGENTS.md.
- **D-12:** The 8 new keys + shapes + lean defaults (LOCKED):
  - `bdd`: `"off" | "lean" | "strict"` — lean default `"lean"` (TOP-LEVEL key)
  - `quality.tdd`: `"off" | "encouraged" | "required"` — lean default `"encouraged"`
  - `quality.lint`: object `{ "strict": false, "autofix": true }` — lean default strict off, autofix on
  - `quality.ui_e2e`: `"off" | "ui-or-critical-path" | "always"` — lean default `"ui-or-critical-path"`
  - `quality.test_integrity`: `"warn" | "block"` (NEVER `off` — TINT-03 carve-out) — lean default `"warn"`
  - `quality.gate_enforcement`: `"advisory" | "blocking"` — lean default `"blocking"`
  - `security.asvs_level`: `"L1" | "L2" | "L3"` — lean default `"L1"`
  - `security.block_on`: `"none" | "low" | "medium" | "high"` — lean default `"high"`
- **D-13:** No behavior double-owned. `quality.ui_e2e` REPLACES the existing `quality.e2e_when` (same enum; rename across all three config files + the twin + any references). Keep `"lint"` in `mandatory_gates` AND add `quality.lint` (complementary).
- **D-14:** Validator is active-when-present, lenient-when-absent: recognizes the new keys and enum-checks values WHEN PRESENT (invalid value → error); a MISSING key = its lean default (NOT an error). Two-tier. Stdlib-only, read-only, no `package.json`.
- **D-15:** The 8 keys land atomically across `agent-factory/config/factory.config.json`, the `.md` twin, and `agent-factory/seed/.grugops/factory.config.json`. The two JSON files stay byte-identical; the `e2e_when→ui_e2e` rename applies to all three.

### Claude's Discretion (locked by this research — see body for full rationale)

- **AGENTS.md byte thresholds:** WARN at 20480 bytes (20 KiB), FAIL at 28672 bytes (28 KiB). Current size 6051 bytes. (See Open Question 1 for the alternative WARN-24/FAIL-28 framing — recommend 20/28 for earlier signal.)
- **Adapter pointer ceiling:** byte-based, FAIL at 4096 bytes (4 KiB) per materialized adapter; WARN at 3072 bytes (3 KiB). Current: SKILL.md 1552 B, grugops-orchestrator.md 1736 B. (Byte-based, not line-based — see § Architecture Patterns Pattern 4.)
- **WR-05 regex:** TWO ERE patterns (comma-form + YAML-array-form), verified below. Comma: `^(tools|allowed-tools):.*\b(Agent|Task)\b`; array-item: `^[[:space:]]*-[[:space:]]*(Agent|Task)\b`.
- **Voice-lint:** marker list uses `\bgrug\b` (word-boundary, NOT bare `grug` — critical to avoid `.grugops` false-positive), plus a curated caveman-idiom list; anchoring is a curated file+section allowlist driven by the shared role skeleton (`## Caveman prompt` is the ONLY caveman section).
- **Audit filename:** `.planning/v1.2-SDLC-COVERAGE-AUDIT.md`. Lifecycle stage columns: the 9 PROJECT.md stages (see Code Examples).
- **Guard test strategy:** GREEN-at-commit + planted-violation fail-proof fixtures (the tree is already clean on all four guards). Confirmed below.

### Deferred Ideas (OUT OF SCOPE)

- ⚑ TypeScript pivot (project-level, HELD). Do NOT smuggle into Phase 10.
- GitHub Actions CI (`.github/`). Held — aggregator stays CI-ready.
- Adding `adapters.md` (or other docs) to the WR-05 guard scope. Not done.
- Wiring the behavior behind the 8 new keys — BDD/TDD (Phase 12), UI (13), ASVS (14), §14 gate convergence: lint/UI-E2E/test-integrity (15). Phase 10 only seeds keys + contract.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SDLC-01 | Ship an SDLC-coverage audit reviewing every role + workflow for full-lifecycle completeness (esp. business→engineer handoff) + records gaps | § Code Examples: the 16-role/14-workflow enumeration + the 9-stage lifecycle matrix template; § Architecture Pattern 5 (audit-as-internal-artifact) |
| SDLC-02 | Mechanical foundation guards in the build gate (WR-05 grep, adapter-size, AGENTS.md byte-budget, voice-lint), each fails red, never fabricated | § Standard Stack (the sh aggregator + test harness); § Architecture Patterns 1–4 (one guard each); § Validation Architecture (fail-proof fixtures); § Code Examples (verified regexes) |
| SDLC-03 | Documented config-dial contract (lean default + enterprise escalation per capability), 8 keys atomic across 3 files, validator-recognized, zero-config lean | § Architecture Pattern 6 (the tri-file atomic write); § Code Examples (the JSON shapes + the validator Check-4 extension); § Validation Architecture (zero-config degradation test) |

</phase_requirements>

## Summary

Phase 10 is a self-introspective foundation phase over grugops's own markdown kit. There are zero external dependencies, zero new packages, and no novel framework. Everything is built from two patterns already proven in the repo: the POSIX-sh `check-kit-refs.sh` gate (explicit scan list, `pass()/fail()`, ships GREEN with a fail-on-mutation proof) and the stdlib-only Node `validate-agent-factory.mjs` validator (two-tier `errors[]`/`warnings[]` + `--strict`, fail-closed JSON parsing). The phase has three deliverables — (1) an internal `.planning/` audit artifact, (2) a four-guard POSIX-sh aggregator `scripts/check-foundation-guards.sh` plus its fail-proof test, and (3) eight new config keys landed atomically across three files with validator recognition.

The single highest-value research finding is the false-positive geometry of the two text-scanning guards. The WR-05 guard must match a frontmatter tool-grant (`Agent`/`Task`) and NEVER the prose word "spawn" — both packaging templates and both materialized adapters legitimately *explain* the no-spawn rule using "spawn"/"sub-agent". A verified two-ERE pattern (comma-form + YAML-array-form) catches all three grant shapes (comma list, YAML list item, scoped `Agent(worker)`) and matches none of the prose. The voice-lint has a subtler trap: a naive `grep grug` false-positives on `.grugops/` paths that appear in the clear-voice `## Reads` section of every role. The word-boundary ERE `\bgrug\b` excludes `.grugops` (because `grugops` continues with a word character), and confirmed the three named roles carry zero standalone `grug` outside their fenced `## Caveman prompt` block. The shared role skeleton makes section-anchoring deterministic: `## Caveman prompt` is the ONLY caveman-voiced section; every other `##` section is clear voice.

All four guards ship GREEN today (verified: scan set has zero `Agent`/`Task` tokens; AGENTS.md is 6051 B = 18% of the 32768-byte Codex cap; adapters are 1552 B and 1736 B; the three roles are clear-voice). So the strategy is GREEN-at-commit + planted-violation fail-proof fixtures, exactly mirroring `check-kit-refs.sh` + `validate.test.sh`.

**Primary recommendation:** Build `scripts/check-foundation-guards.sh` as a four-function POSIX-sh aggregator cloned from `check-kit-refs.sh` house style (explicit scan lists, two-tier WARN/FAIL for the size guards, portable grep flags only), with a sibling `scripts/check-foundation-guards.test.sh` that proves each guard fails red against a planted mutation. Extend the validator's `checkConfig()` (lines 280–305) to enum-check the 8 new keys only-when-present. Land the 8 keys + the `e2e_when→ui_e2e` rename atomically across the three config files, with the enterprise-escalation contract added as a new column/section in the `.md` twin.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| WR-05 spawn-grant detection | Build-gate script (POSIX sh) | — | A grep over frontmatter is a text check; no Node needed; keeps the Node-free gate path |
| Adapter-size check | Build-gate script (POSIX sh) | — | `wc -c` byte check; pure shell |
| AGENTS.md byte-budget | Build-gate script (POSIX sh) | — | `wc -c` byte check; pure shell |
| Voice-discipline lint | Build-gate script (POSIX sh) | — | Section-scoped grep; pure shell |
| Config-key recognition / enum-check | Node validator (stdlib) | — | JSON parse + value validation already lives in `validate-agent-factory.mjs` Check 4 |
| Config-dial contract doc | Kit markdown (`factory.config.md` twin) | — | Human-readable single source; the JSON is the machine twin |
| Config schema (8 keys) | Kit JSON (`factory.config.json`) + seed JSON | — | Two byte-identical JSON companions + the documented twin |
| SDLC-coverage audit | `.planning/` internal artifact | — | An engineering input over grugops's own kit; never shipped, never user-facing |

**Tier note:** All guard logic is dev/maintainer-side (it runs over grugops's own repo), NOT the end-user install path. That is why D-05's POSIX-sh choice is about keeping a *Node-free gate*, distinct from the user-side install portability concern.

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| POSIX `sh` | n/a (`#!/usr/bin/env sh`) | The four-guard aggregator + its test harness | `[VERIFIED: codebase]` Matches `check-kit-refs.sh` / `validate.test.sh` house style; no Node on the gate path |
| `grep` (ugrep 7.5.0, host) | host-provided | Frontmatter + voice scanning | `[VERIFIED: Bash]` `grep --version` → `ugrep 7.5.0`; portable flags only (`-r -n -l -E -F -q -v`); NO `-P`/`-z`/`--include` per house style |
| `wc -c` | host-provided | Byte-budget + adapter-size measurement | `[VERIFIED: codebase]` Byte counting is deterministic and locale-independent |
| Node.js (ESM, stdlib only) | 18+ LTS (host has v24.12.0) | Extend `validate-agent-factory.mjs` Check 4 | `[VERIFIED: codebase]` Validator is `node:fs`/`node:path`/`node:url` only; no `package.json` |

### Supporting

| Convention | Purpose | When to Use |
|---------|---------|-------------|
| `pass()` / `fail()` + `FAILS` counter + `exit 0/1` | Two-state guard result | `[VERIFIED: codebase]` Every `.sh` checker in `scripts/` uses this exact idiom |
| Two-tier `errors[]` / `warnings[]` + `--strict` | Validator severity model | `[VERIFIED: codebase]` `validate-agent-factory.mjs:92-97` |
| WARN→FAIL two-tier for size guards (D-07) | Headroom before a hard cap | New this phase; mirrors the validator's two-tier model in shell |
| `mktemp -d` + `trap cleanup EXIT` hermetic fixtures | Plant a violation without touching the real tree | `[VERIFIED: codebase]` `validate.test.sh:47-49` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| POSIX sh aggregator | Node (TypeScript) guard | The user's TS-pivot intent is HELD (D-05); a Node guard abandons the deliberate Node-free gate path and needs the project-level pivot decision first. Out of scope. |
| New standalone `scripts/check-foundation-guards.sh` | Fold guards into `check-kit-refs.sh` | D-04 mandates a separate aggregator (least coupling); `check-kit-refs.sh` is the Phase-7 kit-ref gate, a different concern. |
| Byte-based adapter ceiling | Line-based ceiling | Bytes are more robust to long single lines (the adapters have one very long kit-vs-state invariant line ~470 chars); line count would let a verbose adapter pass. Recommend bytes. |
| `\bgrug\b` voice marker | bare `grug` substring | Bare `grug` false-positives on `.grugops/` in every role's `## Reads` section. `[VERIFIED: Bash]` — word boundary is load-bearing. |

**Installation:** None. No packages installed. The only "install" is `chmod +x` not required (scripts run via `sh scripts/...`). No npm, no PyPI, no crates — `[VERIFIED: codebase]` the kit is markdown + POSIX-sh + one stdlib Node validator, no `package.json`.

## Package Legitimacy Audit

**Not applicable.** This phase installs ZERO external packages. The deliverables are POSIX-sh scripts, JSON config edits, markdown doc edits, and an extension to an existing stdlib-only Node script. No npm/PyPI/crates dependency is added or referenced. `[VERIFIED: codebase]` no `package.json` exists; CLAUDE.md hard-constraint + REQUIREMENTS "Out of Scope" both forbid npm runtime deps in grugops itself.

## Architecture Patterns

### System Architecture Diagram

```
  DEV / CI invocation
        │
        ├─►  sh scripts/check-foundation-guards.sh   (D-04 aggregator, ONE command)
        │         │
        │         ├─ guard_wr05()        ── grep -rnE  ──►  [2 templates + 2 adapters]  ──► PASS/FAIL
        │         │     (frontmatter Agent|Task token only; never prose "spawn")
        │         │
        │         ├─ guard_adapter_size()── wc -c  ──►  [.claude/skills/grugops/SKILL.md,
        │         │                                       .claude/agents/grugops-orchestrator.md]
        │         │                                       ──► WARN ≥3KiB / FAIL ≥4KiB
        │         │
        │         ├─ guard_agents_bytes()── wc -c AGENTS.md ──► WARN ≥20KiB / FAIL ≥28KiB
        │         │                                              (hard Codex cap = 32768 B)
        │         │
        │         └─ guard_voice()       ── grep section-scoped ──►  [3 named roles' clear
        │               (\bgrug\b + idioms over clear-voice          surfaces; safety lines;
        │                surfaces ONLY; skip ## Caveman prompt)       sec/compliance workflows]
        │                                                             ──► PASS/FAIL
        │         │
        │         └─►  FAILS counter ──► exit 0 (all green) | exit 1 (≥1 fail)
        │
        ├─►  sh scripts/check-foundation-guards.test.sh   (fail-proof harness)
        │         └─ plants ONE violation per guard in a mktemp -d copy ──► asserts nonzero + finding
        │
        └─►  node scripts/validate-agent-factory.mjs   (extended Check 4)
                  └─ checkConfig(): parse JSON ──► enum-check 8 new keys WHEN PRESENT
                                                   (absent key = lean default, NOT an error → SC4)

  CONFIG-DIAL TRI-FILE CONTRACT (atomic, D-15)
        agent-factory/config/factory.config.json    ─┐ byte-identical
        agent-factory/seed/.grugops/factory.config.json ─┘ companions
        agent-factory/config/factory.config.md   ── human twin + "Enterprise escalation" column (D-11)
```

### Recommended File Layout (additive — no renames except the e2e_when key)

```
scripts/
├── check-kit-refs.sh                    # EXISTING — the template; do NOT modify
├── check-foundation-guards.sh           # NEW (D-04) — four-guard aggregator
├── check-foundation-guards.test.sh      # NEW — fail-proof harness for the four guards
├── validate-agent-factory.mjs           # EDIT — extend checkConfig() (lines ~280-305)
├── validate.test.sh                     # EDIT (optional) — add 8-key fixtures' assertions
└── fixtures/
    ├── good/                            # EXISTING — reuse for validator key tests
    └── bad-config-bad-asvs/             # NEW (optional) — invalid enum value fixture
agent-factory/config/
├── factory.config.json                  # EDIT — +8 keys, e2e_when→ui_e2e
└── factory.config.md                    # EDIT — +8 rows, +enterprise-escalation column
agent-factory/seed/.grugops/
└── factory.config.json                  # EDIT — byte-identical to config/ twin
agent-factory/packaging/
└── adapters.md                          # EDIT (D-09) — fix stale spawn prose (lines 33, 39)
.planning/
└── v1.2-SDLC-COVERAGE-AUDIT.md          # NEW (D-01/D-02) — the audit artifact
```

### Pattern 1: WR-05 spawn-grant guard (frontmatter-only, two ERE patterns)

**What:** Fail red if any of the 4 scan-set files grants a spawn tool in frontmatter. Two grant shapes exist in this repo — the comma list (`tools: Read, Grep, ...` in `grugops-orchestrator.md` and `subagent.frontmatter.md`) and the YAML array (`allowed-tools:\n  - Read\n  ...` in `SKILL.md` and `slash-command.template.md`). A grant can also be scoped (`Agent(worker)`). All three must be caught.

**When to use:** This phase, as one of the four guards. Scan set is EXACTLY the 4 files in SC2 (D-09 keeps `adapters.md` out of scope).

**Verified patterns** `[VERIFIED: Bash]` (all 5 tests passed: GREEN on clean files; catches comma, array, and scoped grants; ignores prose):

```sh
# Comma-form: a tools:/allowed-tools: header line carrying an Agent/Task token.
WR05_COMMA='^(tools|allowed-tools):.*\b(Agent|Task)\b'
# YAML-array item form: a list item that IS Agent or Task (incl. scoped Agent(worker)).
WR05_ARRAY='^[[:space:]]*-[[:space:]]*(Agent|Task)\b'

WR05_SCAN="agent-factory/packaging/subagent.frontmatter.md \
agent-factory/packaging/slash-command.template.md \
.claude/skills/grugops/SKILL.md \
.claude/agents/grugops-orchestrator.md"

hits=$( { grep -rnE "$WR05_COMMA" $WR05_SCAN; grep -rnE "$WR05_ARRAY" $WR05_SCAN; } 2>/dev/null || true )
if [ -z "$hits" ]; then pass "WR-05: no spawn grant in frontmatter"; else fail "WR-05 spawn grant:
$hits"; fi
```

**Why `\b(Agent|Task)\b` and not just `Agent`:** the word boundary makes `Agent(worker)` match (`(` is a boundary) while keeping the pattern anchored to a token, not a substring inside another word.

### Pattern 2: AGENTS.md byte-budget guard (two-tier WARN/FAIL below the cap)

**What:** `wc -c AGENTS.md` and compare against two thresholds strictly below the 32768-byte Codex `project_doc_max_bytes` cap.

**Thresholds (locked):** WARN at 20480 B (20 KiB), FAIL at 28672 B (28 KiB). Current 6051 B → GREEN with huge headroom.

```sh
AGENTS_WARN=20480   # 20 KiB
AGENTS_FAIL=28672   # 28 KiB — headroom below the 32768 B Codex cap
b=$(wc -c < AGENTS.md | tr -d ' ')
if   [ "$b" -ge "$AGENTS_FAIL" ]; then fail "AGENTS.md ${b}B ≥ ${AGENTS_FAIL}B (Codex cap 32768B)"
elif [ "$b" -ge "$AGENTS_WARN" ]; then warn "AGENTS.md ${b}B ≥ ${AGENTS_WARN}B — approaching cap"
else pass "AGENTS.md ${b}B under budget"; fi
```

**`[CITED: developers.openai.com/codex/guides/agents-md]`** — "Codex stops adding files once the combined size reaches the limit defined by `project_doc_max_bytes` (32 KiB by default)." Default = 32768 bytes, confirmed.

### Pattern 3: Voice-discipline lint (section-scoped, word-boundary markers)

**What:** Grep curated clear-voice surfaces for caveman markers; fail red if a marker appears in a clear-voice surface. The scan is SECTION-scoped, never whole-file, because role bodies legitimately mix a fenced `## Caveman prompt` (intentionally caveman) with clear-voice sections.

**Anchoring mechanism (locked): curated file + section allowlist.** The shared role skeleton is deterministic `[VERIFIED: Bash]`: the three named roles have headings `## One job`, `## Caveman prompt`, `## Reads`, `## Activates when`, `## Responsibilities`, `## Output`, `## Board moves`, `## Trace updates`, `## Hard limits`. Only `## Caveman prompt` is caveman-voiced; every other section is clear voice. The clean mechanism is: read each named file, strip the `## Caveman prompt` fenced block, scan the remainder.

**Marker list (locked):** `\bgrug\b` (word-boundary — critical), plus idioms `\bclub\b`, `\brock\b`, `\bcave\b`, `\bsmash\b`, `\bshiny\b`, `brain hurt`, `me think`, `no think`, `big think`. Use ERE alternation; NEVER bare `grug` (false-positives on `.grugops/`).

**Critical verified fact** `[VERIFIED: Bash]`: `printf '.grugops/...' | grep -E '\bgrug\b'` produces NO match (because `grugops` continues with the word char `o`, so there is no word boundary after `grug`). The three named roles carry zero standalone `\bgrug\b` outside their caveman block. So the guard ships GREEN.

```sh
VOICE_FILES="agent-factory/roles/security-nfr.md \
agent-factory/roles/compliance-officer.md \
agent-factory/roles/incident-responder.md"
MARKERS='\bgrug\b|\bclub\b|\brock\b|\bcave\b|\bsmash\b|\bshiny\b|brain hurt|me think|no think|big think'

voice_fail=
for f in $VOICE_FILES; do
  # Strip the single fenced ## Caveman prompt block, then scan the clear-voice remainder.
  body=$(awk '
    /^## Caveman prompt/ {skip=1}
    skip && /^```/        {fence++; if(fence==2){skip=0;fence=0}; next}
    skip                  {next}
    {print}
  ' "$f")
  m=$(printf '%s\n' "$body" | grep -nE "$MARKERS" || true)
  [ -n "$m" ] && voice_fail="$voice_fail
$f:
$m"
done
[ -z "$voice_fail" ] && pass "voice: clear-voice surfaces free of caveman markers" \
  || fail "voice-discipline violation:$voice_fail"
```

**Forward-compat (D-10, Phase 11):** Phase 11 adds a clear-voice "What good looks like / When to escalate" section to every role. Because the anchoring is an allowlist of clear-voice surfaces (everything except `## Caveman prompt`), those new sections are automatically scanned — no guard change needed when Phase 11 lands them. Document this explicitly so Phase 11 doesn't re-engineer the anchor.

### Pattern 4: Adapter single-source size guard (byte ceiling)

**What:** `wc -c` each of the two materialized adapters; FAIL if a pointer-only adapter grows past a ceiling (signals a role body was copied in, breaking single-source). Byte-based, not line-based (one adapter line is ~470 chars — the kit-vs-state invariant — so line count would under-count a bloated file).

**Thresholds (locked):** WARN 3072 B (3 KiB), FAIL 4096 B (4 KiB). Current: SKILL.md 1552 B, grugops-orchestrator.md 1736 B → GREEN with ~2.3× headroom.

```sh
ADAPTERS=".claude/skills/grugops/SKILL.md .claude/agents/grugops-orchestrator.md"
AD_WARN=3072; AD_FAIL=4096
for f in $ADAPTERS; do
  b=$(wc -c < "$f" | tr -d ' ')
  if   [ "$b" -ge "$AD_FAIL" ]; then fail "$f ${b}B ≥ ${AD_FAIL}B — adapter too large (role body copied in?)"
  elif [ "$b" -ge "$AD_WARN" ]; then warn "$f ${b}B ≥ ${AD_WARN}B — approaching pointer ceiling"
  else pass "$f ${b}B pointer-sized"; fi
done
```

### Pattern 5: SDLC-coverage audit as an internal `.planning/` artifact

**What:** A markdown file `.planning/v1.2-SDLC-COVERAGE-AUDIT.md` with a lifecycle-stage × role/workflow matrix + a per-gap narrative + a gap→phase mapping table. NOT shipped in the kit, NOT in `docs/`. Mirrors `.planning/milestones/v1.1-MILESTONE-AUDIT.md`.

**When to use:** This phase, SDLC-01. It is an engineering input that scopes the rest of v1.2; it confirms roadmap sufficiency (D-03) and does NOT re-scope.

### Pattern 6: Atomic tri-file config update

**What:** The 8 keys + the `e2e_when→ui_e2e` rename land in the SAME change across `agent-factory/config/factory.config.json`, `agent-factory/seed/.grugops/factory.config.json` (byte-identical to the first), and the `.md` twin (which gains the rows + the enterprise-escalation column). `[VERIFIED: Bash]` the two JSON files are currently byte-identical (`cmp -s` confirms).

### Anti-Patterns to Avoid

- **Repo-wide grep for any guard.** `fixtures/`, `examples/`, `docs/`, `.planning/`, `README.md`, `CLAUDE.md` all legitimately carry `Agent`/`spawn`/caveman words. Use explicit scan lists ONLY (the `check-kit-refs.sh` discipline).
- **Bare `grep grug` in the voice-lint.** False-positives on `.grugops/` in every role's `## Reads`. Use `\bgrug\b`.
- **Whole-file voice scan.** Role bodies legitimately carry caveman voice in `## Caveman prompt`. Section-scope.
- **`grep -P` / `-z` / `--include`.** Non-portable; host is ugrep-aliased. Stick to `-r -n -l -E -F -q -v`.
- **Failing AGENTS.md exactly at 32768 B.** D-07 mandates headroom; FAIL below the cap (28672 B).
- **Keeping `e2e_when` alongside `ui_e2e`.** D-13 is a RENAME (no double-ownership); delete `e2e_when` in all three files.
- **Making a missing config key an error.** D-14: absent = lean default; only an invalid *present* value errors (preserves SC4 zero-config).
- **Adding `adapters.md` to the WR-05 scan set.** D-09: the scan set is fixed at 4 files; the `adapters.md` prose fix is a separate one-time edit recorded in the audit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Guard result reporting | A new logging framework | The `pass()/fail()`/`FAILS`/`exit 0|1` idiom from `check-kit-refs.sh` | `[VERIFIED: codebase]` Every checker in `scripts/` uses it; consistency = greppable, fail-closed |
| Hermetic fixture isolation | Editing the real tree to test fail-red | `mktemp -d` + `trap cleanup EXIT INT TERM` + `cp -R` | `[VERIFIED: codebase]` `validate.test.sh:47-49` — never mutate the real repo or `$HOME` |
| JSON config parsing in the validator | A new parser / a regex over JSON | Extend the existing `JSON.parse` + null-guard in `checkConfig()` | `[VERIFIED: codebase]` `validate-agent-factory.mjs:286-299` already fail-closes `null`/array/primitive |
| Two-tier severity | A new severity enum | The existing `errors[]`/`warnings[]` + `--strict` (validator) and WARN/FAIL (shell) | `[VERIFIED: codebase]` `validate-agent-factory.mjs:92-97` |
| Codex byte cap value | Guessing the cap | The documented `project_doc_max_bytes` = 32768 B | `[CITED: developers.openai.com/codex/guides/agents-md]` |

**Key insight:** This phase invents no new mechanism. Both proof patterns (sh gate + Node validator) exist and are battle-tested across Phases 5–9. The work is *applying* them to four new assertions and eight new keys, not designing infrastructure.

## Runtime State Inventory

> This phase has a rename component (`e2e_when→ui_e2e`, D-13) — so the inventory applies, scoped to config-key state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `e2e_when` is a config-schema key in the kit's seed/template JSON, not a runtime datastore key. The end-user's `.grugops/factory.config.json` is seeded at install time; if a user already installed v1.1 and set `e2e_when`, an `--update`/`--migrate` (Phase 16, NOT this phase) would reconcile it. | Code/text rename in the 3 kit files; the user-side migration is explicitly Phase 16's job (out of scope here). |
| Live service config | None — grugops has no live service; config is file-based markdown/JSON in the repo. | None — verified: the kit is files only, no daemon/DB. |
| OS-registered state | None. | None — verified: no OS registration; scripts run on demand via `sh`. |
| Secrets/env vars | None renamed. (`GRUGOPS_HOME`, `GRUGOPS_PROD_DEPLOY_APPROVED` exist but are untouched this phase.) | None. |
| Build artifacts / installed packages | None — no compiled artifacts, no installed packages, no `package.json`. | None — verified: markdown + sh + one stdlib Node validator. |

**Rename reference sweep:** Before renaming, grep the kit for every `e2e_when` reference so none is orphaned. `[VERIFIED: Bash]` `e2e_when` currently appears in: `agent-factory/config/factory.config.json:36`, `agent-factory/seed/.grugops/factory.config.json` (byte-identical companion), and `agent-factory/config/factory.config.md:22` (the `quality` row note) + `:63` (the `quality` sub-field row). The planner must grep `grep -rn 'e2e_when' agent-factory/` at execution time to catch any role/workflow reference (none found in this research, but re-verify — roles read `quality` as an object, not the sub-key by name).

## Common Pitfalls

### Pitfall 1: WR-05 prose false-positive (the headline trap)

**What goes wrong:** A guard authored as `grep spawn` or `grep Agent` (substring) fails red on the very files that correctly *document* the no-spawn rule. `subagent.frontmatter.md` says "The wrapper grants **no spawn tool**" and "NOT sub-agent spawning"; `slash-command.template.md` says "No spawn tool in `allowed-tools`". A naive guard turns these correct files into violations.
**Why it happens:** Conflating the *concept* (prose explanation) with the *grant* (a frontmatter tool token).
**How to avoid:** Match frontmatter tool-grant tokens ONLY — the two verified EREs in Pattern 1. Never grep the word "spawn"/"sub-agent".
**Warning signs:** The guard fails on first run against a clean tree. `[VERIFIED: Bash]` the two-ERE design produces zero matches on the clean scan set.

### Pitfall 2: `.grugops` voice false-positive

**What goes wrong:** `grep -F grug` over a role file matches `.grugops/factory.config.json` in the `## Reads` section of every role — a clear-voice line — flagging it as a caveman-voice violation.
**Why it happens:** The brand token `grugops` contains the substring `grug`.
**How to avoid:** Use `\bgrug\b`. `[VERIFIED: Bash]` it does not match `.grugops` (no word boundary after `grug` in `grugops`).
**Warning signs:** Voice-lint fails on the `## Reads` section.

### Pitfall 3: Whole-file voice scan flags legitimate caveman bodies

**What goes wrong:** Scanning a whole role file flags the intentional caveman voice in `## Caveman prompt` (and Phase 11's `## Caveman prompt` bodies generally).
**Why it happens:** Voice discipline is *two-voice by design* — caveman in prompt bodies, clear voice in safety/security/compliance.
**How to avoid:** Section-scope to clear-voice surfaces; strip the `## Caveman prompt` fenced block before scanning (Pattern 3 `awk`).
**Warning signs:** Guard fails on a `You are <Role>. You look for danger.` caveman line.

### Pitfall 4: Non-atomic tri-file config drift

**What goes wrong:** Editing `factory.config.json` but forgetting the byte-identical seed companion, or the `.md` twin, leaves the three files disagreeing — and `check-kit-refs.sh`'s seed-exclusion means no existing gate catches a JSON/JSON drift.
**Why it happens:** Three files, one logical change.
**How to avoid:** Land all three in one change (D-15). Recommend the planner add a quick `cmp -s` assertion (the two JSONs must stay byte-identical) to the test harness, mirroring the existing byte-parity discipline.
**Warning signs:** `cmp -s config/factory.config.json seed/.grugops/factory.config.json` is non-zero.

### Pitfall 5: Making a missing key an error breaks zero-config (SC4)

**What goes wrong:** A validator that requires the 8 keys would fail a zero-config user who has no `factory.config.json` or an older config — breaking SC4.
**Why it happens:** Treating "recognized" as "required."
**How to avoid:** D-14 — enum-check WHEN PRESENT; a missing key is its lean default, never an error. The existing `mode/cadence/autonomy` loop (lines 300–304) is required-and-string; the new keys must be *optional-and-enum* (a different branch — only validate `if (key in cfg)` / `if (cfg.quality && 'tdd' in cfg.quality)`).
**Warning signs:** `validate.test.sh` warn-only/good fixtures fail after the edit.

## Code Examples

### Validator Check-4 extension (enum-check only-when-present, D-14)

```js
// Source: extends scripts/validate-agent-factory.mjs checkConfig() (lines 280-305)
// After the existing required-string loop for mode/cadence/autonomy, add optional enum checks.
// Each: validate ONLY if the key is present; a missing key is the documented lean default (SC4).

const ENUMS = {
  bdd: ["off", "lean", "strict"],
};
const Q_ENUMS = {
  tdd: ["off", "encouraged", "required"],
  ui_e2e: ["off", "ui-or-critical-path", "always"],
  test_integrity: ["warn", "block"],          // NEVER "off" (TINT-03 carve-out)
  gate_enforcement: ["advisory", "blocking"],
};
const SEC_ENUMS = {
  asvs_level: ["L1", "L2", "L3"],
  block_on: ["none", "low", "medium", "high"],
};

// top-level bdd
if ("bdd" in cfg && !ENUMS.bdd.includes(cfg.bdd)) {
  err(`${rel}: invalid "bdd" value "${cfg.bdd}" (allowed: ${ENUMS.bdd.join("|")})`);
}
// quality.* enums (only if quality is an object)
if (cfg.quality && typeof cfg.quality === "object" && !Array.isArray(cfg.quality)) {
  for (const [k, allowed] of Object.entries(Q_ENUMS)) {
    if (k in cfg.quality && !allowed.includes(cfg.quality[k])) {
      err(`${rel}: invalid "quality.${k}" value "${cfg.quality[k]}" (allowed: ${allowed.join("|")})`);
    }
  }
  // quality.lint is an OBJECT { strict:bool, autofix:bool } — shape-check, not enum.
  if ("lint" in cfg.quality) {
    const l = cfg.quality.lint;
    if (l === null || typeof l !== "object" || Array.isArray(l)) {
      err(`${rel}: "quality.lint" must be an object { strict, autofix }`);
    } else {
      if ("strict" in l && typeof l.strict !== "boolean") err(`${rel}: "quality.lint.strict" must be boolean`);
      if ("autofix" in l && typeof l.autofix !== "boolean") err(`${rel}: "quality.lint.autofix" must be boolean`);
    }
  }
}
// security.* enums (only if security is an object)
if (cfg.security && typeof cfg.security === "object" && !Array.isArray(cfg.security)) {
  for (const [k, allowed] of Object.entries(SEC_ENUMS)) {
    if (k in cfg.security && !allowed.includes(cfg.security[k])) {
      err(`${rel}: invalid "security.${k}" value "${cfg.security[k]}" (allowed: ${allowed.join("|")})`);
    }
  }
}
```

### The 8 keys in factory.config.json (D-12) — slots into the existing structure

```json
// Add `bdd` at top level (e.g. after "autonomy"); extend the existing "quality" object
// (rename e2e_when→ui_e2e, add 5 keys); add a new top-level "security" object.
{
  "...": "existing keys unchanged",
  "bdd": "lean",
  "quality": {
    "coverage_threshold": 0.8,
    "self_fix_attempts": 2,
    "mandatory_gates": ["lint", "typecheck", "unit", "build"],
    "ui_e2e": "ui-or-critical-path",
    "tdd": "encouraged",
    "lint": { "strict": false, "autofix": true },
    "test_integrity": "warn",
    "gate_enforcement": "blocking"
  },
  "security": {
    "asvs_level": "L1",
    "block_on": "high"
  }
}
```

**Note:** `quality.ui_e2e` REPLACES `quality.e2e_when` (same value `"ui-or-critical-path"`). Both `"lint"` in `mandatory_gates` AND `quality.lint` coexist (D-13: gate-presence vs strictness — complementary).

### The 16 roles + 14 workflows for the audit matrix (SDLC-01) `[VERIFIED: Bash]`

```
16 ROLES (agent-factory/roles/ minus _role-switch-protocol.md):
  orchestrator, agents-md-scribe, brownfield-mapper, greenfield-mapper, ba-pm,
  system-analyst, architect-design, software-engineer, qe-e2e, security-nfr,
  uat-planner, release-manager, compliance-officer, incident-responder,
  factory-coach, installer

14 WORKFLOWS (agent-factory/workflows/):
  00-bootstrap-greenfield, 01-bootstrap-brownfield, 02-idea-to-epics,
  03-epic-to-tickets, 04-ticket-to-pr, 05-pr-quality-gate, 06-uat-pack,
  07-backlog-refinement, 08-sprint-planning, 09-daily-sweep, 10-sprint-review,
  11-retro, 12-release, 13-incident

9 LIFECYCLE STAGES (PROJECT.md canonical, D-02 — the matrix columns):
  1 business analysis  2 product  3 system analysis  4 architecture
  5 engineering  6 QE/E2E  7 security/NFR/compliance  8 UAT  9 release
```

**Suggested audit matrix shape (D-02):**

```markdown
| Role / Workflow | 1 BA | 2 Prod | 3 SysA | 4 Arch | 5 Eng | 6 QE | 7 Sec | 8 UAT | 9 Rel |
|-----------------|------|--------|--------|--------|-------|------|-------|-------|-------|
| ba-pm           | ●    | ●      | ◐      | —      | —     | —    | —     | ◐     | —     |
| ...             |      |        |        |        |       |      |       |       |       |
```
(● covered · ◐ partial · — gap). Then a "Gaps → addressing phase" table: each gap row maps to Phase 11–17 per D-03, with a flag column for any gap the roadmap does NOT cover (the audit confirms there are none, or names them).

### adapters.md stale-prose fix (D-09) `[VERIFIED: Bash]`

Two sites carry the contradiction, both must change to sequential-load language:
- **Line 33** (Claude Code "Dispatch mode" cell): "…the Orchestrator runs as the **main thread** (plugin `settings.json` `agent:`) and spawns role agents with the `Agent` tool (sub-agents cannot nest, so it must be main-thread)" → rewrite to sequential role-load (no spawn), matching the other four rows ("Sequential role-load — no spawn").
- **Lines 39–42** (the prose paragraph): "Where a tool supports real sub-agents (Claude Code), the Orchestrator spawns a role agent when it would otherwise 'wake' that role." → rewrite so Claude Code uses the same single-window sequential role-load as the other four (the frozen Phase-7/8 design); keep "Only the dispatch differs, never the content" only if it still holds after the rewrite (it may no longer — the dispatch is now uniform).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `quality.e2e_when` config key | `quality.ui_e2e` (same enum) | This phase (D-13) | Rename across 3 files; no behavior change; config is pre-1.0 (v0.1.0) so safe |
| Adapters carried an `Agent` spawn grant | No spawn grant (single-window sequential role-load) | Phase 8 (08-01) | This phase adds the *guard* that keeps them clean |
| `adapters.md` says Claude Code spawns role agents | Sequential role-load uniform across all 5 CLIs | This phase (D-09) | One-time doc fix; recorded in the audit |

**Deprecated/outdated:**
- The `Agent`/`Task` spawn-tool grant in packaging templates — retired (debt, not a feature). REQUIREMENTS "Out of Scope" forbids re-introducing it.
- Bare `grep grug` and substring `grep spawn`/`grep Agent` as guard patterns — known false-positive traps; use the verified word-boundary / frontmatter-anchored EREs.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `## Caveman prompt` section is the ONLY caveman-voiced section across all 16 roles (so stripping it leaves a pure clear-voice remainder). Verified for the 3 named roles + the heading appears in all 16 `[VERIFIED: Bash]`, but the *body* voice of the other 13 roles' non-Caveman sections was not exhaustively read. | Pattern 3, Pitfall 3 | If another section in some role is caveman-voiced by design and that role is later added to the voice-lint surface set, the guard would false-fail. Mitigation: the initial surface set is only the 3 named roles (all confirmed clear outside the Caveman block); Phase 11 adds clear-voice sections only. LOW risk this phase. |
| A2 | The user-side `.grugops/factory.config.json` migration for the `e2e_when→ui_e2e` rename is Phase 16's job, not Phase 10's. | Runtime State Inventory | If a v1.1 user's existing config must be migrated in Phase 10, an extra task is needed. Mitigation: CONTEXT explicitly defers migrate/update to Phase 16; Phase 10 edits only the kit's seed/template, which a fresh install seeds. LOW. |
| A3 | WARN-20/FAIL-28 for AGENTS.md (vs CONTEXT's suggested WARN-24/FAIL-28). | Discretion lock / Open Q1 | Either is defensible; 20/28 gives earlier signal. Planner may pick 24/28 to match CONTEXT's literal suggestion. LOW — both are well above current 6 KB. |
| A4 | Byte-based (not line-based) adapter ceiling at 4096 B FAIL / 3072 B WARN. | Pattern 4 | A different ceiling is defensible; bytes chosen because the adapters have one ~470-char line. LOW — current files are ≤1736 B, ~2.3× under. |

## Open Questions

1. **AGENTS.md WARN threshold: 20 KiB vs 24 KiB?**
   - What we know: FAIL should be 28 KiB (headroom below the 32768-byte cap, D-07). Current size 6051 B.
   - What's unclear: CONTEXT suggests "WARN ~24 KiB / FAIL ~28 KiB"; this research recommends WARN 20 KiB for earlier signal (more runway between WARN and FAIL).
   - Recommendation: WARN 20480 / FAIL 28672. If the planner prefers literal CONTEXT fidelity, WARN 24576 / FAIL 28672 is equally valid. Document whichever number is chosen in the guard header.

2. **Should the new validator key-checks get dedicated bad-fixtures, or inline assertions in `validate.test.sh`?**
   - What we know: `validate.test.sh` already runs good + 6 bad fixtures with `expect_fail`. The cleanest fail-proof for the enum checks is a `bad-config-bad-asvs/` fixture (e.g. `asvs_level: "L4"`) asserting nonzero + "asvs_level".
   - What's unclear: whether to add a committed bad-fixture dir or build it hermetically via `mktemp -d` (as `validate.test.sh` does for the split/null cases).
   - Recommendation: hermetic (mktemp -d from `fixtures/good`, mutate one key) — matches the repo's newer pattern (`validate.test.sh:248-283`) and avoids committing a near-duplicate fixture tree. Plus a good-fixture assertion that an absent key still passes (SC4).

3. **Does any role/workflow body reference `e2e_when` by name (beyond the config files)?**
   - What we know: `[VERIFIED: Bash]` grep found `e2e_when` only in the 2 JSON files + the `.md` twin (2 rows). Roles read `quality` as an object, not the sub-key by literal name.
   - Recommendation: re-run `grep -rn 'e2e_when' agent-factory/ AGENTS.md` at execution time before the rename to confirm zero orphans. Treat any hit as a rename target.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| POSIX `sh` | All four guards + test harness | ✓ | host sh | — |
| `grep` | WR-05 + voice guards | ✓ | ugrep 7.5.0 (portable flags only) | — |
| `wc`, `awk`, `tr`, `cmp`, `mktemp`, `cp` | size guards + hermetic fixtures | ✓ | host coreutils | — |
| Node.js (stdlib ESM) | validator extension | ✓ | v24.12.0 (≥18 LTS required) | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None — all tooling is host-standard; no packages installed.

## Validation Architecture

> nyquist_validation is ENABLED (config.json `workflow.nyquist_validation: true`). The fail-on-violation fixtures ARE the validation harness — each guard's fail-proof is its test.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | POSIX-sh self-test harnesses (`pass()/fail()`/`exit 0|1`) + bare `node` for the validator — NO test runner, no npm |
| Config file | none — scripts are invoked directly (`sh scripts/<x>.test.sh`) |
| Quick run command | `sh scripts/check-foundation-guards.sh` (the aggregator itself, GREEN over a clean tree) |
| Full suite command | `sh scripts/check-foundation-guards.test.sh && sh scripts/validate.test.sh && sh scripts/check-kit-refs.sh` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SDLC-02 | WR-05 guard fails red on a planted `tools: Agent` grant | unit (fail-proof) | `sh scripts/check-foundation-guards.test.sh` (asserts nonzero + "spawn grant") | ❌ Wave 0 |
| SDLC-02 | Adapter-size guard fails red when an adapter exceeds the ceiling | unit | same harness (plant a >4 KiB adapter copy) | ❌ Wave 0 |
| SDLC-02 | AGENTS.md byte guard fails red when AGENTS.md exceeds FAIL | unit | same harness (plant a >28 KiB AGENTS.md copy) | ❌ Wave 0 |
| SDLC-02 | Voice-lint fails red on a planted `\bgrug\b` in a clear-voice surface | unit | same harness (plant `grug smash` into a stripped-body copy) | ❌ Wave 0 |
| SDLC-02 | All four guards GREEN over the real tree | smoke | `sh scripts/check-foundation-guards.sh` (exit 0) | ❌ Wave 0 |
| SDLC-03 | Validator errors on an invalid enum (`asvs_level: "L4"`) | unit | `node scripts/validate-agent-factory.mjs` over a mutated fixture → nonzero + "asvs_level" | ⚠️ extend `validate.test.sh` |
| SDLC-03 (SC4) | A config MISSING the 8 keys still passes (lean default) | unit | validator over `fixtures/good` (no new keys) → exit 0 | ✅ reuses good fixture |
| SDLC-03 (SC4) | Zero-config (no `factory.config.json`) still passes | unit | existing validator behavior (missing-file already a separate finding) — assert the new keys add NO new failure | ✅ existing path |
| SDLC-03 | The two JSON config files stay byte-identical after the edit | unit | `cmp -s config/factory.config.json seed/.grugops/factory.config.json` | ❌ Wave 0 (add to harness) |

### Sampling Rate

- **Per task commit:** `sh scripts/check-foundation-guards.sh` (the four guards over the real tree — <1 s).
- **Per wave merge:** `sh scripts/check-foundation-guards.test.sh && sh scripts/validate.test.sh`.
- **Phase gate:** Full suite green (all three scripts) before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `scripts/check-foundation-guards.sh` — the four-guard aggregator (SDLC-02). The validation target itself.
- [ ] `scripts/check-foundation-guards.test.sh` — the fail-proof harness (one planted violation per guard; hermetic via `mktemp -d` + `trap cleanup`).
- [ ] Extend `scripts/validate.test.sh` — add: (a) an invalid-enum hermetic fixture asserting nonzero + the bad key name; (b) a good-fixture assertion that absent keys pass (SC4); (c) a `cmp -s` byte-identity assertion for the two JSONs.
- [ ] Framework install: NONE — no test runner needed; the harness is plain POSIX sh.

## Security Domain

> `security_enforcement: true` in config.json — section required.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | This phase ships no auth surface (sh scripts + JSON + markdown) |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No access-control surface |
| V5 Input Validation | yes (light) | The guards read fixed, repo-relative file paths only (no content-derived paths) — the `validate-agent-factory.mjs` "read-only by construction" invariant. The new enum checks validate config *values* before any downstream consumer trusts them. |
| V6 Cryptography | no | No crypto in this phase |

### Known Threat Patterns for {POSIX-sh guards over a markdown kit}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| A guard that fabricates a pass (false green) | Repudiation / Tampering | The fail-proof test plants a real violation and asserts the guard fails red — the no-fabrication contract made mechanical (`[VERIFIED: codebase]` the `validate.test.sh` precedent) |
| Path injection via content-derived file paths | Tampering | Read-only by construction: every guard path is a fixed literal in an explicit SCAN list, never derived from file content (the `check-kit-refs.sh` / validator invariant) |
| Re-arming the spawn tool (privilege escalation of the agent) | Elevation of Privilege | The WR-05 guard fails red on any frontmatter `Agent`/`Task` grant; combined with the existing prod-deploy PreToolUse hook, the "humans decide, agents execute" boundary stays mechanical |
| Config value smuggling (`test_integrity: "off"` to disable the trace-integrity gate) | Tampering | The validator rejects `test_integrity` outside `{warn, block}` — "off" is NOT in the enum (TINT-03 carve-out), so a config that tries to disable trace integrity errors out |
| `--strict`-only severity used to hide a real finding | Repudiation | Two-tier model: invalid enum is an `err` (always nonzero), not a `warn` — so a bad value fails the gate even without `--strict` |

## Sources

### Primary (HIGH confidence)
- `[VERIFIED: codebase]` `scripts/check-kit-refs.sh` — the aggregator template (house style, explicit SCAN list, `pass()/fail()`, ships-GREEN-with-fail-proof, portable grep flags).
- `[VERIFIED: codebase]` `scripts/validate.test.sh` — the fail-red harness pattern (`mktemp -d` + `trap`, `expect_pass`/`expect_fail`, hermetic mutation fixtures).
- `[VERIFIED: codebase]` `scripts/validate-agent-factory.mjs` lines 36–55 (two-root resolution, stdlib imports), 92–97 (two-tier collector), 280–305 (Check 4 config parse + null-guard + required-key loop).
- `[VERIFIED: codebase]` `agent-factory/config/factory.config.json`, `factory.config.md`, `seed/.grugops/factory.config.json` — the tri-file contract; `cmp -s` confirms the two JSONs are byte-identical; `e2e_when` is at `factory.config.json:36`.
- `[VERIFIED: codebase]` `agent-factory/packaging/subagent.frontmatter.md`, `slash-command.template.md`, `.claude/skills/grugops/SKILL.md`, `.claude/agents/grugops-orchestrator.md` — the WR-05 scan set; zero `Agent`/`Task` tokens (grep confirmed); comma-form vs YAML-array-form grant shapes.
- `[VERIFIED: codebase]` `agent-factory/roles/{security-nfr,compliance-officer,incident-responder}.md` — shared skeleton; only `## Caveman prompt` is caveman-voiced; zero standalone `\bgrug\b` outside it.
- `[VERIFIED: codebase]` `agent-factory/packaging/adapters.md` lines 33 + 39 — the stale spawn prose D-09 fixes.
- `[VERIFIED: Bash]` byte/regex measurements: AGENTS.md 6051 B; SKILL.md 1552 B; grugops-orchestrator.md 1736 B; the five-test WR-05 ERE validation; the `\bgrug\b` vs `.grugops` false-positive test; ugrep 7.5.0 host grep.
- `[CITED: developers.openai.com/codex/guides/agents-md]` — Codex `project_doc_max_bytes` default = 32 KiB (32768 bytes); Codex stops adding files once the combined size reaches the limit.

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` Pitfall 1 (WR-05 regeneration hazard) + the anti-pattern/integration-gotcha tables — corroborate the frontmatter-anchored grep guard + the 32 KiB cap.
- `.planning/STATE.md` lines 118–127 — the key-nesting design (top-level `bdd`+`security.*`; `quality.*` for the rest) and the front-loaded-guards rationale.

### Tertiary (LOW confidence)
- None. Every load-bearing claim was verified against the codebase or official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every tool verified present; patterns cloned from existing, proven repo scripts.
- Architecture: HIGH — all four guard patterns + the validator extension + the tri-file write verified against actual file contents and measurements.
- Pitfalls: HIGH — the two headline false-positive traps (WR-05 prose, `.grugops`) were verified empirically with grep, not assumed.

**Research date:** 2026-06-09
**Valid until:** 2026-07-09 (30 days — stable; the only external fact, the Codex 32 KiB cap, is a long-standing documented default).
