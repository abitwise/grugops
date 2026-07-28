# Phase 10: SDLC-Coverage Audit & Foundation Guards - Pattern Map

**Mapped:** 2026-06-09
**Files analyzed:** 8 created/modified + 8 read-only scan targets
**Analogs found:** 8 / 8 (every created/modified file has an in-repo analog)

This phase invents NO new mechanism. Every deliverable clones a pattern already proven in
the repo. The two load-bearing analogs are `scripts/check-kit-refs.sh` (the POSIX-sh gate
house style) and `scripts/validate.test.sh` (the hermetic fail-red harness). Excerpts below
are concrete (file path + line numbers) so the planner can copy them directly into plan actions.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/check-foundation-guards.sh` | test/guard (build gate) | file-I/O (read-only grep/wc) | `scripts/check-kit-refs.sh` | exact (same role + flow) |
| `scripts/check-foundation-guards.test.sh` | test (fail-proof harness) | file-I/O (hermetic mktemp fixtures) | `scripts/validate.test.sh` | exact |
| `scripts/validate-agent-factory.mjs` (MODIFY) | utility (validator) | transform (JSON parse → enum-check) | itself — `checkConfig()` lines 280-305 | exact (extend in place) |
| `agent-factory/config/factory.config.json` (MODIFY) | config | transform (schema) | itself (existing `quality`/`security` shape) | exact |
| `agent-factory/seed/.grugops/factory.config.json` (MODIFY) | config | transform (schema) | byte-identical twin of the above | exact |
| `agent-factory/config/factory.config.md` (MODIFY) | config (human twin) | transform (doc table) | itself (existing field-reference table) | exact |
| `agent-factory/packaging/adapters.md` (MODIFY) | config (doc) | transform (prose fix) | itself (lines 33, 39-42) | exact (in-place edit) |
| `.planning/v1.2-SDLC-COVERAGE-AUDIT.md` (NEW) | doc (internal audit) | transform (matrix) | `.planning/milestones/v1.1-MILESTONE-AUDIT.md` | role-match (audit precedent) |

**Read-only scan targets** (the guards read them; no modification — confirm clean):
`agent-factory/packaging/subagent.frontmatter.md`, `agent-factory/packaging/slash-command.template.md`,
`.claude/skills/grugops/SKILL.md`, `.claude/agents/grugops-orchestrator.md` (WR-05 scan set);
`AGENTS.md` (byte budget, 6051 B); `agent-factory/roles/{security-nfr,compliance-officer,incident-responder}.md` (voice-lint).

---

## Pattern Assignments

### `scripts/check-foundation-guards.sh` (test/guard, file-I/O read-only)

**Analog:** `scripts/check-kit-refs.sh` — clone its full skeleton. It is the canonical
"ship GREEN + fail-on-violation proof" gate: explicit SCAN lists, `pass()/fail()` + `FAILS`
counter, `set -eu`, `printf` not `echo -e`, portable grep flags only, READ-ONLY.

**Shebang + house-style header** (`check-kit-refs.sh` lines 1, 32-37):
```sh
#!/usr/bin/env sh
# ... header comment documenting each assertion + WHY it ships GREEN with a fail-proof ...
# Strictly READ-ONLY: grep and test only. No writes, no in-place edits, no `--fix`. House
# style mirrors install/install.sh: #!/usr/bin/env sh, set -eu, printf not echo -e, small
# named helpers. Portable grep flags only (-r -n -l -E -F -q -v); the host grep is
# ugrep-aliased, so no -P, no -z, no --include, no reliance on default recursive globs.
set -eu
```

**Explicit SCAN list + the WHY-not-repo-wide comment** (`check-kit-refs.sh` lines 39-52) —
copy this discipline verbatim; the new guard's four SCAN sets each get their own literal list:
```sh
# Explicit SCAN path list — NEVER a repo-wide grep. By NOT listing them, this excludes
# scripts/fixtures/, agent-factory/examples/, docs/, .planning/, README.md, CLAUDE.md ...
# all of which legitimately carry `agent-factory/` / `Agent` / spawn / caveman words.
SCAN="agent-factory/roles agent-factory/workflows ... AGENTS.md"
```

**`pass()/fail()` + `FAILS` counter + exit idiom** (`check-kit-refs.sh` lines 71-73, 143-150) —
copy exactly; reuse the same `printf 'ALL CHECKS PASSED'` / `'%s CHECK(S) FAILED'` strings:
```sh
FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
# ... guards run here ...
printf '\n== Result ==\n'
if [ "$FAILS" -eq 0 ]; then
  printf 'ALL CHECKS PASSED\n'; exit 0
else
  printf '%s CHECK(S) FAILED\n' "$FAILS"; exit 1
fi
```

**Add a `warn()` helper** (NEW this phase — the two size guards are two-tier WARN→FAIL, D-07).
`check-kit-refs.sh` has only `pass/fail`; mirror the validator's WARN tier in shell:
```sh
warn() { printf '  WARN  %s\n' "$1"; }   # WARN does NOT increment FAILS — advisory only
```

**Single-assertion block shape** (`check-kit-refs.sh` lines 77-87) — each of the four guard
functions follows this `capture → test empty → pass/fail` shape:
```sh
printf '\n[Assertion N] <what>\n'
hits=$(grep -rn '<pattern>' $SCAN || true)   # `|| true` so set -e does not abort on no-match
if [ -z "$hits" ]; then pass "<msg>"; else fail "<msg>:\n$hits"; fi
```

**The four guard bodies** — RESEARCH.md already pins the verified patterns; the planner copies
them in. Sources within RESEARCH.md:
- **guard_wr05** — RESEARCH Pattern 1 (lines 195-209). Two EREs (comma-form + YAML-array-form).
  `WR05_COMMA='^(tools|allowed-tools):.*\b(Agent|Task)\b'`,
  `WR05_ARRAY='^[[:space:]]*-[[:space:]]*(Agent|Task)\b'`. Scan set is EXACTLY the 4 files
  (D-09 keeps `adapters.md` OUT). Match frontmatter token only, NEVER prose "spawn".
- **guard_agents_bytes** — RESEARCH Pattern 2 (lines 219-225). `wc -c < AGENTS.md`; WARN 20480,
  FAIL 28672 (below the 32768 Codex cap).
- **guard_adapter_size** — RESEARCH Pattern 4 (lines 272-280). `wc -c` each adapter; WARN 3072,
  FAIL 4096. Byte-based (one adapter line is ~470 chars; line count under-counts).
- **guard_voice** — RESEARCH Pattern 3 (lines 240-262). Section-scoped: strip the
  `## Caveman prompt` fenced block with `awk`, then grep `\bgrug\b` + idioms over the remainder.

**Verified inputs the planner can trust** (`[VERIFIED: Bash]` this session):
AGENTS.md = 6051 B; SKILL.md = 1552 B; grugops-orchestrator.md = 1736 B; the 3 voice roles
are 4085/3714/3024 B with only `## Caveman prompt` fenced and caveman-voiced (the fence opens
immediately after the heading: `## Caveman prompt\n```\nYou are ...`). All four guards ship
GREEN today.

---

### `scripts/check-foundation-guards.test.sh` (test, hermetic fixtures)

**Analog:** `scripts/validate.test.sh` — the fail-red harness. Clone its hermetic
`mktemp -d` + `trap cleanup` isolation and its `expect_pass`/`expect_fail` helpers. Each guard
must be proven to fail red on ONE planted violation in a throwaway copy of the tree.

**Hermetic temp area + trap** (`validate.test.sh` lines 44-49) — copy verbatim; NOTHING outside
`$WORK` is ever written (the real repo and `$HOME` are never mutated):
```sh
WORK=$(mktemp -d)
cleanup() { rm -rf -- "$WORK"; }
trap cleanup EXIT INT TERM
```

**`pass()/fail()` + presence preamble** (`validate.test.sh` lines 36-42):
```sh
FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
[ -f "$GUARD" ] || { fail "guard present at $GUARD"; printf '1 CHECK(S) FAILED\n'; exit 1; }
```

**`out=$(cmd) && rc=0 || rc=$?` capture under `set -eu`** (`validate.test.sh` lines 63, 257) —
the idiom that survives `set -e` when the command is EXPECTED to fail:
```sh
OUT=$(... node "$VALIDATOR" 2>&1) && RC=0 || RC=$?
```

**`expect_fail` shape — nonzero exit AND the finding names the defect** (`validate.test.sh`
lines 103-110). The new harness asserts `RC != 0` AND the output greps the finding token
(e.g. `"spawn grant"`, the adapter path, `"AGENTS.md"`, the planted `grug` marker):
```sh
expect_fail() {
  run_fixture "$2"
  if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -qi "$3"; then
    pass "$1"
  else
    fail "$1 (expected nonzero + '$3', got rc=$RC: $OUT)"
  fi
}
```

**Plant-one-violation-in-a-copy pattern** (`validate.test.sh` lines 250-257) — copy the clean
tree into `$WORK`, mutate exactly ONE file, run the guard against the copy, assert it fails red:
```sh
NULLCFG_KIT="$WORK/null-config-kit"
mkdir -p "$NULLCFG_KIT"
cp -R -- "$FIX/good/agent-factory" "$NULLCFG_KIT/agent-factory"
printf 'null' > "$NULLCFG_KIT/agent-factory/config/factory.config.json"   # the ONE mutation
OUT=$(... node "$VALIDATOR" 2>&1) && RC=0 || RC=$?
# ... assert nonzero + finding token, AND NO crash/TypeError ...
```

**Per-guard planted violations** (from RESEARCH Phase-Requirements→Test map, lines 549-559):
- WR-05: plant `tools: Agent` (or a `  - Agent` array item) into a copy of one scan-set file → assert nonzero + "spawn grant".
- adapter-size: plant a >4096 B copy of an adapter → assert nonzero + adapter path.
- AGENTS.md byte: plant a >28672 B AGENTS.md copy → assert nonzero + "AGENTS.md".
- voice: plant `grug smash` into a clear-voice surface of a role copy → assert nonzero + the role path.
- smoke: the real `scripts/check-foundation-guards.sh` over the real tree → exit 0 (GREEN).

**Add a `cmp -s` byte-identity assertion** (RESEARCH Pitfall 4, lines 353-358) — prove the two
JSON config files stay byte-identical after the edit (no existing gate catches a JSON/JSON drift):
```sh
if cmp -s agent-factory/config/factory.config.json agent-factory/seed/.grugops/factory.config.json; then
  pass "config JSONs byte-identical"
else fail "config JSON drift (config/ vs seed/ diverge)"; fi
```

**Result block** — same `ALL CHECKS PASSED` / `%s CHECK(S) FAILED` + `exit 0/1` as `validate.test.sh:285-293`.

---

### `scripts/validate-agent-factory.mjs` (utility, transform) — MODIFY in place

**Analog:** itself. Extend `checkConfig()` (lines 280-305). Stdlib-only, read-only, no
`package.json` — do NOT change those invariants (file header lines 9-14, 31-34).

**The existing required-string loop to mirror the STRUCTURE of** (lines 300-304):
```js
for (const key of ["mode", "cadence", "autonomy"]) {
  if (typeof cfg[key] !== "string" || cfg[key].trim() === "") {
    err(`${rel}: missing or empty required key "${key}"`);
  }
}
```
**Critical difference (D-14, RESEARCH Pitfall 5):** the existing loop is *required-and-string*
(a missing key errors). The 8 new keys are *optional-and-enum* — a MISSING key is its lean
default (NOT an error, preserves SC4 zero-config); only an INVALID PRESENT value errors. So the
new checks use `if (key in cfg)` / `if (cfg.quality && 'tdd' in cfg.quality)` guards, NOT the
unconditional loop above.

**The fail-closed null-guard already in place to reuse** (lines 296-299) — keep it; it protects
the new `cfg.quality` / `cfg.security` derefs from a `null`/array/primitive parse:
```js
if (cfg === null || typeof cfg !== "object" || Array.isArray(cfg)) {
  err(`${rel}: not a JSON object`);
  return;
}
```

**The two-tier collector to emit through** (lines 92-97) — use the existing `err()`; an invalid
enum is an ERROR (always nonzero, even without `--strict` — RESEARCH Security Domain row 5):
```js
const errors = [];
const warnings = [];
const STRICT = process.argv.includes("--strict");
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
```

**The new enum-check block to add** — RESEARCH Code Examples (lines 371-419) gives the full
verbatim extension: a top-level `bdd` check, a `quality.*` enum loop (`tdd`, `ui_e2e`,
`test_integrity`, `gate_enforcement`) guarded by `cfg.quality && typeof === "object"`, a
`quality.lint` object shape-check (`{strict:bool, autofix:bool}`), and a `security.*` enum loop
(`asvs_level`, `block_on`). Each gated by `if (key in obj)`. `test_integrity` enum is
`["warn","block"]` — `"off"` is deliberately EXCLUDED (TINT-03 safety carve-out).

**Header comment to update** (line 6 + lines 26-29) — currently says "config parses with
mode/cadence/autonomy"; extend the doc comment to note the new optional-enum keys (the header
is the spec; keep it honest).

---

### `agent-factory/config/factory.config.json` + `seed/.grugops/factory.config.json` (config) — MODIFY (byte-identical twins, D-15)

**Analog:** itself. Both files are currently byte-identical (`cmp -s` confirmed this session)
and share this exact `quality` block — the slot the new keys extend:

**Current `quality` block** (both files, lines 32-37):
```json
  "quality": {
    "coverage_threshold": 0.8,
    "self_fix_attempts": 2,
    "mandatory_gates": ["lint", "typecheck", "unit", "build"],
    "e2e_when": "ui-or-critical-path"
  },
```

**Target shape** (RESEARCH Code Examples lines 424-444) — rename `e2e_when`→`ui_e2e`, add 4
`quality.*` keys + `quality.lint` object, add top-level `bdd`, add a new top-level `security`
object. Land identically in BOTH JSON files:
```json
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
```
**Placement note:** `bdd` is TOP-LEVEL (e.g. after `"autonomy"` or `"priority_scheme"`);
`security` is a NEW top-level object (e.g. after `nfr`). Keep BOTH `"lint"` in `mandatory_gates`
AND the new `quality.lint` object (D-13: gate-presence vs strictness — complementary, not duplicate).

**After editing, re-run `cmp -s` on the two JSONs** — they must stay byte-identical (Pitfall 4).

---

### `agent-factory/config/factory.config.md` (config, human twin) — MODIFY

**Analog:** itself. The existing field-reference table is the pattern. Two edit sites:

**The top-level `quality` row to update** (line 22) — change the key list `e2e_when`→`ui_e2e`:
```
| `quality` | object | see below | Quality gate settings (keys: `coverage_threshold`, `self_fix_attempts`, `mandatory_gates`, `e2e_when`). |
```

**The `quality` sub-fields table to extend** (lines 56-63) — rename the `e2e_when` row, add 5
rows. This is the table-row pattern to clone (`| Key | Default | Meaning |`):
```
### `quality` sub-fields

| Key | Default | Meaning |
|-----|---------|---------|
| `coverage_threshold` | `0.8` | Minimum test-coverage fraction required to pass the gate. |
| `self_fix_attempts` | `2` | Bounded number of automatic fix attempts before a work item is reported blocked. |
| `mandatory_gates` | `["lint","typecheck","unit","build"]` | Gates that must pass for every change. |
| `e2e_when` | `ui-or-critical-path` | When end-to-end tests run. |
```

**Add the "Enterprise escalation" column/section (D-11)** — this is NEW; no existing column.
The planner adds an `Enterprise escalation` column to each new key's row (or a parallel section)
documenting the lean default ↔ enterprise-escalation contract per key. The 8 keys' allowed
values + lean defaults are locked in D-12 (CONTEXT lines 55-63 / RESEARCH lines 23-31).

**Update the "Zero-config defaults" prose** (lines 73-81) if needed to note the new keys all
degrade to their documented lean defaults when absent (SC4).

---

### `agent-factory/packaging/adapters.md` (config/doc) — MODIFY (D-09 stale-prose fix)

**Analog:** itself. Two sites carry the stale "spawns role agents with the `Agent` tool" prose
that contradicts the frozen single-window no-spawn design. Both MUST change to sequential
role-load language. (This file is NOT added to the WR-05 guard scope — D-09.)

**Offending site 1 — the Claude Code "Dispatch mode" table cell** (line 33):
```
| **Claude Code** | `CLAUDE.md` one-line pointer + portable `AGENTS.md` | Native sub-agents — the Orchestrator runs as the **main thread** (plugin `settings.json` `agent:`) and spawns role agents with the `Agent` tool (sub-agents cannot nest, so it must be main-thread) | ... |
```
Rewrite the "Dispatch mode" cell to match the other four rows' wording: **"Sequential
role-load — no spawn"** (see Codex/Gemini/OpenCode/Copilot cells at lines 34-37 for the exact
target phrasing to mirror).

**Offending site 2 — the prose paragraph** (lines 39-42):
```
Where a tool supports real sub-agents (Claude Code), the Orchestrator spawns a role agent
when it would otherwise "wake" that role. Where it does not, the Orchestrator is a single
agent that *loads the relevant role file into context* at that moment. **Only the dispatch
differs, never the content.**
```
Rewrite so Claude Code uses the SAME single-window sequential role-load as the other four CLIs
(the frozen Phase-7/8 design). Per RESEARCH (lines 482-483): re-examine the "Only the dispatch
differs" framing — the dispatch is now UNIFORM across all five tools, so that sentence may no
longer hold and should be reworded to "the dispatch is uniform; only the entry file differs."

**Correct target voice already in the file** (lines 15-18) — the framing prose already mostly
states the design; align both sites to it:
```
The single thing that changes from tool to tool is *how the Orchestrator reaches its
specialist roles* — whether the host can **spawn** sub-agents or must **load** role files
into one context in sequence.
```
Note: the word "spawn" appearing in CONCEPTUAL prose is fine (the WR-05 guard matches
frontmatter tokens only, never prose). The fix is about the FACTUAL claim that Claude Code
*does* spawn — that is what is stale.

---

### `.planning/v1.2-SDLC-COVERAGE-AUDIT.md` (doc, internal audit) — NEW

**Analog:** `.planning/milestones/v1.1-MILESTONE-AUDIT.md` — the naming + structured-audit
precedent. NOT shipped in the kit, NOT in `docs/` (D-01). Mirror its YAML-frontmatter +
markdown-tables + per-gap-narrative + verdict shape.

**Frontmatter shape to mirror** (`v1.1-MILESTONE-AUDIT.md` lines 1-12) — adapt for an SDLC-coverage
audit (milestone v1.2, the 16-role/14-workflow scope, the 9-stage lifecycle):
```yaml
---
milestone: v1.2
milestone_name: SDLC Coverage & Foundation Guards
audited: <ISO8601>
status: <coverage verdict>
scores:
  ...
gaps:
  ...
---
```

**Matrix shape (D-02)** — RESEARCH Code Examples (lines 471-477) gives the exact table skeleton.
Columns = the 9 PROJECT.md lifecycle stages; rows = the 16 roles + 14 workflows; cells =
● covered / ◐ partial / — gap:
```markdown
| Role / Workflow | 1 BA | 2 Prod | 3 SysA | 4 Arch | 5 Eng | 6 QE | 7 Sec | 8 UAT | 9 Rel |
|-----------------|------|--------|--------|--------|-------|------|-------|-------|-------|
| ba-pm           | ●    | ●      | ◐      | —      | —     | —    | —     | ◐     | —     |
```

**The actual 16 roles + 14 workflows + 9 stages** (RESEARCH lines 451-467, `[VERIFIED: Bash]`):
- **16 ROLES** (`agent-factory/roles/` minus `_role-switch-protocol.md`): orchestrator,
  agents-md-scribe, brownfield-mapper, greenfield-mapper, ba-pm, system-analyst,
  architect-design, software-engineer, qe-e2e, security-nfr, uat-planner, release-manager,
  compliance-officer, incident-responder, factory-coach, installer.
- **14 WORKFLOWS** (`agent-factory/workflows/`): 00-bootstrap-greenfield, 01-bootstrap-brownfield,
  02-idea-to-epics, 03-epic-to-tickets, 04-ticket-to-pr, 05-pr-quality-gate, 06-uat-pack,
  07-backlog-refinement, 08-sprint-planning, 09-daily-sweep, 10-sprint-review, 11-retro,
  12-release, 13-incident.
- **9 LIFECYCLE STAGES** (PROJECT.md canonical): 1 business analysis · 2 product · 3 system
  analysis · 4 architecture · 5 engineering · 6 QE/E2E · 7 security/NFR/compliance · 8 UAT · 9 release.

**Gap→phase mapping table (D-03)** — after the matrix, add a table mapping each gap to the v1.2
phase (11-17) that addresses it, with a flag column for any gap the roadmap does NOT cover.
Call out the business→engineer handoff explicitly (the milestone's named focus). The audit
CONFIRMS roadmap sufficiency; it does NOT re-scope (D-03). Mirror the v1.1 audit's
"Requirements Coverage" + "Verdict" sections (lines 61-131) for the narrative structure.

---

## Shared Patterns

### POSIX-sh gate house style
**Source:** `scripts/check-kit-refs.sh` lines 32-37, 71-73, 143-150
**Apply to:** both new `.sh` files
- `#!/usr/bin/env sh` + `set -eu`; `printf` never `echo -e`.
- `pass()/fail()` + `FAILS` counter; `ALL CHECKS PASSED` / `%s CHECK(S) FAILED`; `exit 0/1`.
- Portable grep flags ONLY: `-r -n -l -E -F -q -v`. NO `-P`, `-z`, `--include` (host grep is ugrep 7.5.0).
- Capture-then-test with `|| true` so `set -e` does not abort on an expected no-match.

### Explicit scan lists, never repo-wide grep
**Source:** `scripts/check-kit-refs.sh` lines 39-52 (the WHY-not comment)
**Apply to:** every guard in `check-foundation-guards.sh`
`fixtures/`, `examples/`, `docs/`, `.planning/`, `README.md`, `CLAUDE.md` all legitimately
carry `Agent`/`spawn`/caveman words. Each guard lists its EXACT files inline; the not-listing
IS the exclusion, and a comment records why (mirror the D-03 seed-exclusion comment at lines 44-50).

### Hermetic fixture isolation
**Source:** `scripts/validate.test.sh` lines 44-49, 250-257
**Apply to:** `check-foundation-guards.test.sh`
`mktemp -d` + `trap cleanup EXIT INT TERM` + `cp -R` the clean tree, mutate ONE file, run the
guard against the copy. NEVER mutate the real repo or `$HOME`.

### Two-tier severity (WARN → FAIL / err → warn)
**Source:** `scripts/validate-agent-factory.mjs` lines 92-97 (validator); D-07 (shell size guards)
**Apply to:** the two size guards (`guard_agents_bytes`, `guard_adapter_size`) + the validator extension
- Shell: WARN does not increment `FAILS`; FAIL does. WARN at the lower threshold, FAIL at the higher.
- Node: an invalid enum is `err()` (always nonzero); only traceability hygiene is `warn()` (--strict promotes).

### No fabrication — the fail-proof IS the proof
**Source:** `scripts/validate.test.sh` lines 103-110 (`expect_fail`); RESEARCH Security Domain (lines 588-596)
**Apply to:** `check-foundation-guards.test.sh`
Every guard must be proven to fail RED on a real planted violation (nonzero exit AND the finding
names the defect). A guard that can only pass is fabricated green — forbidden by the whole value prop.

### Tri-file config atomicity
**Source:** RESEARCH Pattern 6 (lines 289-291) + Pitfall 4 (lines 353-358)
**Apply to:** the three config-file edits
The 8 keys + the `e2e_when→ui_e2e` rename land in ONE change across all three files; the two
JSONs stay byte-identical (`cmp -s`); the `.md` twin documents them + the enterprise contract.

---

## No Analog Found

None. Every created/modified file has a concrete in-repo analog. The phase applies proven
patterns; it designs no new infrastructure.

---

## Critical Findings for the Planner

1. **`e2e_when` reference sweep is INCOMPLETE in RESEARCH.** RESEARCH (lines 328, 519) lists
   `e2e_when` only in the 3 config files. This session's `grep -rn 'e2e_when' agent-factory/ AGENTS.md`
   found a 4th site the research missed:
   **`agent-factory/workflows/05-pr-quality-gate.md:31`** —
   `... `e2e_when` (`"ui-or-critical-path"`) decides when e2e runs.`
   The `e2e_when→ui_e2e` rename (D-13/D-15) MUST update this workflow line too, or it orphans the
   reference. Re-run the sweep at execution time to catch any further hits.

2. **WR-05 scan-set frontmatter shapes are split** (`[VERIFIED: Bash]`):
   - comma-form `tools:` — `.claude/agents/grugops-orchestrator.md:4` (`tools: Read, Grep, Glob, Bash, Edit, Write`) and the `subagent.frontmatter.md` template body (line 27).
   - YAML-array `allowed-tools:` — `.claude/skills/grugops/SKILL.md:5-11` and `slash-command.template.md:25-31`.
   Both shapes carry NO `Agent`/`Task` token today (the guard ships GREEN). The two-ERE design
   (RESEARCH Pattern 1) is required to cover both shapes.

3. **The voice-lint fence is consistent across all 3 named roles** (`[VERIFIED: Bash]`): each has
   exactly one `## Caveman prompt` section, fenced with ```` ``` ```` opening on the line
   immediately after the heading, and that is the ONLY caveman-voiced section. The `awk`
   strip-then-scan (RESEARCH Pattern 3) works as written. Role sizes: 4085 / 3714 / 3024 B.

4. **The packaging templates legitimately use the WORD "spawn"** to explain the no-spawn rule
   (`subagent.frontmatter.md:15` "grants **no spawn tool**"; `slash-command.template.md:98`
   "No spawn tool in `allowed-tools`"). The WR-05 guard MUST NOT grep the word — only the
   frontmatter token (D-08, RESEARCH Pitfall 1). A `grep spawn` would fail red on the very files
   that correctly document the design.

---

## Metadata

**Analog search scope:** `scripts/`, `agent-factory/config/`, `agent-factory/seed/`,
`agent-factory/packaging/`, `agent-factory/roles/`, `.claude/agents/`, `.claude/skills/`,
`.planning/milestones/`, `AGENTS.md`.
**Files scanned:** 13 read + 3 grep/wc verification passes.
**Pattern extraction date:** 2026-06-09
