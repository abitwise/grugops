# Phase 14: Security Audit (OWASP ASVS) & Checklist Re-Anchor - Research

**Researched:** 2026-06-13
**Domain:** OWASP ASVS 5.0 checklist generation + workflow authoring + POSIX-sh/stdlib-Node guard extension (markdown-kit, zero-dep)
**Confidence:** HIGH (the #1 external unknown — the ASVS 5.0.0 source, tag/sha, artifact schema, level encoding — is fully pinned and verified by direct fetch at the pinned SHA; internal patterns read from source)

## Summary

The single critical unknown this research was commissioned to resolve — *where the pinned, machine-readable OWASP ASVS 5.0.0 source lives, what it ships, and how it encodes requirement IDs and L1/L2/L3 levels* — is now **fully pinned and verified by direct fetch at the exact commit SHA**. The official repo is `OWASP/ASVS`, tag **`v5.0.0_release`**, commit SHA **`5cf9b032440be53ce345ab3c130fda46ba1ce7a2`**, published **2025-05-30**. It ships both a CSV and (decisively) a **`flat.json`** with an identical 7-key flat schema — `chapter_id, chapter_name, section_id, section_name, req_id, req_description, L` — covering **345 requirements** across **17 chapters (V1–V17)**, each requirement carrying a stable `req_id` (e.g. `V1.2.4`) and a single integer `L` ∈ {`"1"`,`"2"`,`"3"`} (distribution 70 / 183 / 92). ASVS 5.0 levels are **cumulative** (L3 ⊇ L2 ⊇ L1), so the `security.asvs_level` read-time filter is "keep every requirement where `L ≤ configured level`" — fully consistent with the CONTEXT.md D-05 assumption, with no level-model mismatch to reconcile.

**The generator should parse `flat.json` with `JSON.parse`, not the CSV.** Both artifacts carry the same schema and same data, but the CSV has quoted fields, embedded commas, and 12 doubled-quote escapes (RFC-4180 quoting) that a zero-dep parser would have to hand-roll correctly — a real source of bugs. `flat.json` eliminates the parser entirely: `JSON.parse(readFileSync(...))` is stdlib Node, zero-dep, and matches the `scripts/validate-agent-factory.mjs` style exactly. This simplifies D-01/D-03 materially and removes the only fiddly part of the generator.

Everything else is internal-pattern work against well-understood, already-read files: workflow 15 mirrors `14-ui-design-to-build.md` (reference-don't-restate, cite `05-pr-quality-gate.md` by filename); the checklist is re-anchored in place; the voice guard in `check-foundation-guards.sh` is *extended* (not rebuilt) to four new security surfaces with a Caveman-fence carve-out; and the `security.asvs_level`/`security.block_on` dials already exist byte-identical and are already enum-validated by `validate-agent-factory.mjs` (no schema change). The one sharp constraint the planner must respect: **`security-nfr.md` is at 4326 B against a guard FAIL ceiling of 4576 B and WARN of 4331 B** — only ~250 B of headroom (already 5 B *over* WARN), so the D-09 severity-mapping content added to that role body is on a knife-edge and may force a per-file ceiling bump in the guard (a documented, intentional change), or extremely terse phrasing.

**Primary recommendation:** Vendor `OWASP_Application_Security_Verification_Standard_5.0.0_en.flat.json` from `OWASP/ASVS@5cf9b032440be53ce345ab3c130fda46ba1ce7a2` under `scripts/`, write a stdlib-only `scripts/generate-asvs-checklist.mjs` (JSON.parse → group by chapter → emit ID + `[L1/L2/L3]` tag + description per row, with a provenance header), commit the generated `security-nfr-checklist.md` in place, author `workflows/15-security-audit.md` on the workflow-14 skeleton, extend the voice guard to the 4 security surfaces with the Caveman carve-out, and register `security-audit`→`15-security-audit.md` in the orchestrator map.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Generate via **vendored source + committed generator**. Commit three artifacts: (a) the pinned official ASVS 5.0.0 source data (OWASP JSON/CSV at a pinned tag/sha), (b) a stdlib-only Node generator `scripts/generate-asvs-checklist.mjs` that emits the markdown, (c) the generated checklist. Reproducible in-repo and auditable.
- **D-02:** The generated checklist carries a **provenance header** (pinned ASVS version + source tag/sha + "generated — do not hand-edit; re-run `generate-asvs-checklist.mjs`").
- **D-03:** Generator obeys the tech-stack constraint: **POSIX-sh or stdlib Node only, no TypeScript** (TS pivot is HELD). Match the existing `scripts/validate-agent-factory.mjs` style (Node 18+, `node:fs`/`node:path`, ESM, zero deps).
- **D-04:** **Re-anchor `security-nfr-checklist.md` in place** (do not create a parallel file). Every role/handoff that already references this path keeps working unchanged.
- **D-05:** Ship the **FULL ASVS 5.0 set**, every item tagged **L1/L2/L3** with its **requirement ID**. `security.asvs_level` filters the **active tier at read/audit time** (L1 lean default → L2 → L3). The dial is a read-time filter — the file is not regenerated when the dial changes.
- **D-06:** Workflow 15 is a **standalone deep ASVS audit** — orchestrator-routed as a **new `security-audit` classification**, run by the **Security/NFR role** on-demand / per-phase / per-milestone. **Distinct from** the lightweight per-ticket Security/NFR check in the `In Security/NFR` column.
- **D-07:** Workflow 15 **emits severity-tagged findings**; **`security.block_on` is read at `05-pr-quality-gate.md`** to decide which severities block. **Audit produces, gate enforces.** Workflow 15 does not self-block.
- **D-08:** Workflow 15 follows the **`14-ui-design-to-build.md` pattern**: reference sibling workflows (esp. `05-pr-quality-gate.md`) **by filename**, never restate their loops.
- **D-09:** **Default-from-level + named override.** Default: **L1 fail → high, L2 fail → medium, L3 fail → low**. The auditor **MAY override** a finding's severity with a **stated reason + named owner** — reusing the role's existing "an accepted risk needs a named owner" hard limit.
- **D-10:** Extend the existing **voice-discipline guard in `scripts/check-foundation-guards.sh`** to assert clear professional voice on: **`workflows/15-security-audit.md`, the re-anchored `security-nfr-checklist.md`, the `security-nfr` role body, and the `security-nfr` handoff template.**
- **D-11:** **Carve-out:** the guard **skips the role's fenced ` ```Caveman prompt``` ` block** — that is an agent prompt and stays caveman. Everything else on a security surface is clear voice.

### Claude's Discretion
- Exact filename/heading layout of `15-security-audit.md` and the generator's output formatting, within the patterns above.
- Whether the pinned ASVS source is committed as CSV or JSON (research picks based on what the official repo ships cleanly) — D-01 only requires it be pinned + in-repo. **→ Research recommends `flat.json` (see Standard Stack & Architecture).**

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. (Gate-convergence mechanics → Phase 15; browsable docs generation → Phase 17; install migrate/update → Phase 16.)

### Carried-Forward Locks (DO NOT Re-Decide)
- `security.asvs_level` (L1/L2/L3, default L1) and `security.block_on` (none/low/medium/high, default high) already ship byte-identical in `config/factory.config.json`, the seed, and `factory.config.md` (lines 98–99). **Wire behavior; do not add/rename keys.** [VERIFIED: read all three files — keys present byte-identical, lines 48–51 in both JSONs, lines 83–84/98–99 in the .md]
- Gate is referenced **by filename** (`05-pr-quality-gate.md`), never "§14". The ROADMAP's "§14 gate" phrasing is internal narration — never write "§14" into any shipped file.
- New scripts = POSIX sh or stdlib Node, **not TypeScript** (TS pivot HELD).
- Voice split (Phase 11): clear professional voice for security/compliance/money/legal/docs; caveman only in role-prompt fences.
- Workflow numbering: new file is `15-security-audit.md`; register in `orchestrator.md` (classification + workflow-file map) **without renumbering 00–14**.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | Security-audit workflow anchored to OWASP ASVS 5.0 | Workflow-15 skeleton from `14-ui-design-to-build.md` (read); ASVS 5.0 anchor pinned (`v5.0.0_release` @ `5cf9b032…`); `security-audit` classification + workflow-map row identified in `orchestrator.md` (lines 43, 93–109). |
| SEC-02 | Checklist rewritten to ASVS 5.0 chapters + L1/L2/L3 tags + req IDs, **generated** from pinned source | `flat.json` schema fully resolved (7 keys, 345 reqs, 17 chapters, single `L` int); generator pattern = `validate-agent-factory.mjs` (stdlib, zero-dep, ESM); provenance-header (D-02) is a new repo pattern. |
| SEC-03 | ASVS level config-dialed, gate block-threshold dialed, findings in clear professional voice (voice-lint passes) | Dials already shipped + enum-validated; severity↔`block_on` vocabulary verified consistent (high/medium/low ⊂ none/low/medium/high); voice-guard extension path mapped against `check-foundation-guards.sh` + `.test.sh`. |
</phase_requirements>

## Architectural Responsibility Map

grugops ships **no runtime** — it is a markdown kit consumed by a host coding agent. "Tiers" here are the kit's artifact layers, not application runtime tiers.

| Capability | Primary Tier (kit layer) | Secondary Tier | Rationale |
|------------|--------------------------|----------------|-----------|
| ASVS requirement → checklist row | Generator script (`scripts/*.mjs`) + vendored source data | Generated checklist (`checklists/`) | "Not hand-transcribed" requires the *transformation* live in a committed script over committed source — the checklist is an artifact, not the source of truth's logic. |
| Active-level filtering (L1/L2/L3) | Role / workflow **read-time** (Security/NFR + workflow 15) | Config dial (`security.asvs_level`) | D-05: dial is a *read-time filter*; the file ships the full set and is NOT regenerated per dial. Filtering is a consumption-time behavior of the role, not a generation-time choice. |
| Deep ASVS audit orchestration | Workflow (`workflows/15-security-audit.md`) | Orchestrator routing (`security-audit` classification) | A workflow is the guardrail/sequence; the orchestrator only routes to it. |
| Severity assignment (L→sev + override) | Role body (`roles/security-nfr.md`) + handoff (`security-nfr-handoff.md`) | — | The auditor assigns/overrides; the override mechanism (named owner) is a role hard-limit. |
| Severity → block/no-block decision | Gate workflow (`05-pr-quality-gate.md`) reading `security.block_on` | Config dial (`security.block_on`) | D-07: audit produces, **gate enforces** — enforcement stays at the single visible gate. Workflow 15 never self-blocks. |
| Clear-voice enforcement on security surfaces | Mechanical guard (`scripts/check-foundation-guards.sh` `guard_voice`) | Test harness (`.test.sh`) | Voice discipline is proven mechanically, never by prose assertion. |

## Standard Stack

This phase adds **no runtime dependencies** (the kit is markdown + stdlib-only scripts; adding an npm dep is explicitly Out of Scope per REQUIREMENTS.md line 95). The "stack" is the pinned external data source + the host tooling the scripts run on.

### Core
| Item | Version / Pin | Purpose | Why Standard |
|------|---------------|---------|--------------|
| OWASP/ASVS source repo | tag `v5.0.0_release`, sha `5cf9b032440be53ce345ab3c130fda46ba1ce7a2` | The authoritative requirement set | The official OWASP repo; this is THE standard. [VERIFIED: GitHub API tags + release] |
| `...5.0.0_en.flat.json` | committed in-repo at `5.0/docs_en/` at the pinned SHA | The machine-readable artifact the generator parses | Flat 7-key schema; parses with stdlib `JSON.parse`; no CSV parser needed. [VERIFIED: fetched + schema-inspected at pinned SHA] |
| Node.js | 18+ LTS (dev box has v24.12.0) | Runs the generator + (future Phase-17) freshness check | Matches `validate-agent-factory.mjs`; `node:fs`/`node:path`, ESM, zero deps. [VERIFIED: `node --version` = v24.12.0] |
| POSIX sh + awk + grep | system (ugrep-aliased grep) | The voice-guard extension lives here | `check-foundation-guards.sh` is sh; extend in place. [VERIFIED: `command -v` sh/awk/grep all present] |

### Supporting
| Item | Pin | Purpose | When to Use |
|------|-----|---------|-------------|
| `...5.0.0_en.csv` | same SHA, `5.0/docs_en/` | Alternative vendored source | Only if a reviewer specifically wants the CSV form; otherwise prefer flat.json (avoids hand-rolled RFC-4180 parsing). |
| `0x03-What-is-the-ASVS.md`, `0x04-Assessment_and_Certification.md` | same SHA, `5.0/en/` | Authoritative level definitions to cite in the workflow/checklist provenance | When the workflow needs to state what L1/L2/L3 mean. |
| `git` | system (2.54.0) | Vendoring the source blob at the pinned SHA reproducibly | At vendoring time (one-off); record the SHA in the provenance header. [VERIFIED: `git --version`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `flat.json` (recommended) | `...5.0.0_en.csv` | CSV needs a hand-rolled RFC-4180 parser (quoted fields, embedded commas, 12 doubled-quote escapes verified). flat.json has the **identical schema** and parses with one `JSON.parse` line. CSV adds risk for zero benefit. **Strong recommendation: flat.json.** |
| `flat.json` | nested `...5.0.0_en.json` (top keys `Name/ShortName/Version/Description/Requirements`) | Nested form needs tree-walking (chapters→sections→items) and may not carry the flat `L` per leaf in the same shape. flat.json's pre-flattened rows map 1:1 to checklist rows. |
| Vendoring the artifact file | Fetching at generate-time | A fetch at generate-time breaks "reproducible in-repo / auditable" (D-01) and adds a network dependency. **Vendor the blob; never fetch at runtime.** |
| `v5.0.0_release` | the `latest` tag | `latest` auto-tracks master (bleeding edge, observed moving as recently as 2026-03). Pin the immutable release tag + its SHA. [VERIFIED: release tag is `v5.0.0_release`, the `latest` tag is the moving dev pointer] |

**Installation:** None. No `npm install`. No `package.json` (confirmed absent — the zero-dep contract). The only "install" is vendoring the JSON blob into the repo at the pinned SHA, e.g.:
```bash
# one-off vendoring (record the SHA in the provenance header + a sidecar note)
curl -fsSL \
  "https://raw.githubusercontent.com/OWASP/ASVS/5cf9b032440be53ce345ab3c130fda46ba1ce7a2/5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.flat.json" \
  -o scripts/asvs/asvs-5.0.0.flat.json   # exact path is Claude's discretion
```

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** grugops takes no npm/PyPI/crates dependencies (REQUIREMENTS.md "Out of Scope": *"Adding npm runtime dependencies to grugops itself … grugops is markdown + stdlib-only scripts"*). The only external artifact is a **data file** (`flat.json`) vendored from the official `OWASP/ASVS` GitHub repo at a pinned commit SHA — not a code dependency, not executed. Integrity is asserted by pinning the SHA in the provenance header (D-02), which is the auditable, "not hand-transcribed" proof. slopcheck/npm-view/postinstall checks are moot (no package manager involved).

## Architecture Patterns

### System Architecture Diagram

```
                          ┌─────────────────────────────────────────────┐
                          │  OWASP/ASVS @ v5.0.0_release (5cf9b03…)      │
                          │  5.0/docs_en/…_5.0.0_en.flat.json            │
                          │  (345 reqs · 17 chapters · L ∈ {1,2,3})      │
                          └───────────────────┬─────────────────────────┘
                                              │ vendor at pinned SHA (one-off, committed)
                                              ▼
                          ┌─────────────────────────────────────────────┐
   GENERATION (build)     │  scripts/asvs/asvs-5.0.0.flat.json  (vendored)│
   "not hand-transcribed" └───────────────────┬─────────────────────────┘
                                              │ JSON.parse  (stdlib, zero-dep)
                                              ▼
                          ┌─────────────────────────────────────────────┐
                          │  scripts/generate-asvs-checklist.mjs          │
                          │  group by chapter_id → emit rows:             │
                          │  "- [Vx.y.z] [L1|L2|L3] <description>"        │
                          │  + provenance header (version+tag+sha, D-02)  │
                          └───────────────────┬─────────────────────────┘
                                              │ write (in place, D-04)
                                              ▼
                          ┌─────────────────────────────────────────────┐
                          │  agent-factory/checklists/                    │
                          │       security-nfr-checklist.md  (generated)  │
                          └───────────────────┬─────────────────────────┘
                                              │ read
        ┌─────────────────────────────────────┴──────────────────────────────┐
        │ CONSUMPTION (runtime, by host agent)                                 │
        │                                                                      │
        │  asvs_level (L1/L2/L3) ──filter──►  Security/NFR role                │
        │   (read-time filter: keep L ≤ level)   • per-ticket lean check (L1)  │
        │                                        • deep audit via workflow 15  │
        │                                              │ emits severity-tagged │
        │                                              │ findings (D-07/D-09)  │
        │                                              ▼                       │
        │  L1 fail→high  L2→medium  L3→low      security-nfr-handoff.md        │
        │  (auditor MAY override + named owner)        │                       │
        │                                              ▼                       │
        │  block_on (none/low/med/high) ─────►  05-pr-quality-gate.md          │
        │            (the SINGLE gate)            decides block vs pass        │
        │                                        AUDIT PRODUCES, GATE ENFORCES │
        └──────────────────────────────────────────────────────────────────────┘

   MECHANICAL GUARD (build gate, parallel):
     scripts/check-foundation-guards.sh  guard_voice
       scan set += {15-security-audit.md, security-nfr-checklist.md,
                    security-nfr.md*, security-nfr-handoff.md}
       *security-nfr.md already scanned via ROLE_FILES; carve-out = ## Caveman prompt fence (D-11)
```

### Component Responsibilities
| File (path) | Responsibility | New / Edited |
|-------------|----------------|--------------|
| `scripts/asvs/asvs-5.0.0.flat.json` (path = discretion) | Vendored ASVS source data, pinned SHA | NEW |
| `scripts/generate-asvs-checklist.mjs` | Parse → group by chapter → emit markdown + provenance header | NEW |
| `agent-factory/checklists/security-nfr-checklist.md` | The generated full L1/L2/L3 checklist (in place, D-04) | EDITED (regenerated) |
| `agent-factory/workflows/15-security-audit.md` | Deep ASVS audit workflow; references `05-pr-quality-gate.md` by filename | NEW |
| `agent-factory/roles/security-nfr.md` | + read-time level filter note, + D-09 severity-map + override; voice-clean body | EDITED (tight byte budget) |
| `agent-factory/handoffs/security-nfr-handoff.md` | + severity/level fields for findings; voice-clean | EDITED |
| `agent-factory/roles/orchestrator.md` | + `security-audit` classification (line 43) + workflow-map row (lines 93–109) | EDITED |
| `scripts/check-foundation-guards.sh` | `guard_voice` scan set += the new security surfaces; Caveman carve-out preserved | EDITED |
| `scripts/check-foundation-guards.test.sh` | + RED fixtures proving the new surfaces fail-red on a voice regression | EDITED |

### Recommended Project Structure (additions only)
```
scripts/
├── asvs/                                  # NEW (path is discretion; keep vendored data grouped)
│   └── asvs-5.0.0.flat.json               # NEW — vendored source @ pinned SHA
├── generate-asvs-checklist.mjs            # NEW — stdlib-only generator (mirrors validate-agent-factory.mjs)
├── check-foundation-guards.sh             # EDITED — guard_voice scan-set extension
└── check-foundation-guards.test.sh        # EDITED — RED fixtures for the 4 new surfaces
agent-factory/
├── workflows/15-security-audit.md         # NEW — mirrors 14-ui-design-to-build.md
├── checklists/security-nfr-checklist.md   # EDITED — regenerated, full ASVS set
├── roles/security-nfr.md                  # EDITED — level filter + D-09 (TIGHT byte budget)
├── roles/orchestrator.md                  # EDITED — classification + workflow-map row
└── handoffs/security-nfr-handoff.md       # EDITED — severity/level fields
```

### Pattern 1: Reference-don't-restate workflow (the workflow-14 skeleton)
**What:** Workflow 15 names sibling workflows by filename and does not restate their loops.
**When to use:** Always for workflow 15 (D-08).
**Example (the exact skeleton sections to mirror, from `14-ui-design-to-build.md`):**
```markdown
---
kind: workflow
order: 15
cadence: both
---
# Workflow: Security audit (OWASP ASVS)

## When to use
## Agents involved          # Security/NFR (deep audit); role-switch protocol pointer
## Inputs required          # config (security.asvs_level, security.block_on), checklist, change under review
## Steps                    # walk the full-level checklist; emit severity-tagged findings;
                            #   reference 05-pr-quality-gate.md BY FILENAME for enforcement
## Board moves              # In Security/NFR (distinct from per-ticket check, D-06)
## Handoffs produced        # <ID>-security-nfr.md from the template
## Trace updates
## Stop conditions
## Done condition           # honor autonomy; humans hold merge/deploy
## Commit                   # branch guard first; never merge/deploy
```
Note: the validator (`validate-agent-factory.mjs`) requires the 9 §18 workflow sections **only for the frozen 00–13 list** — it does NOT iterate the directory, so it does not section-check workflow 14 or 15. The structure above is still the right pattern (consistency + future Phase-17 catalog), but it is not validator-enforced. [VERIFIED: WORKFLOWS array frozen at 00–13; functions loop that array, never `readdirSync(workflows)`]

### Pattern 2: Stdlib-only generator (the `validate-agent-factory.mjs` shape)
**What:** ESM, `node:fs`/`node:path`, try/catch around every read/parse, fail-closed, zero deps.
**When to use:** `generate-asvs-checklist.mjs` (D-03).
**Example (the load + group skeleton — JSON path, no CSV parser):**
```javascript
// generate-asvs-checklist.mjs — emits agent-factory/checklists/security-nfr-checklist.md
// from the vendored OWASP ASVS 5.0.0 flat.json. Node stdlib ONLY (node:fs/node:path), ESM,
// zero deps. Mirrors scripts/validate-agent-factory.mjs (try/catch, explicit paths, no throw).
// Source: OWASP/ASVS @ v5.0.0_release (5cf9b032440be53ce345ab3c130fda46ba1ce7a2).
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC  = join(ROOT, "scripts/asvs/asvs-5.0.0.flat.json"); // path = discretion
const OUT  = join(ROOT, "agent-factory/checklists/security-nfr-checklist.md");

const TAG = "v5.0.0_release";
const SHA = "5cf9b032440be53ce345ab3c130fda46ba1ce7a2";

const { requirements } = JSON.parse(readFileSync(SRC, "utf8")); // 345 rows, 7 keys each
// group preserving V1..V17 order (numeric sort on the "V<n>" id)
const byChapter = new Map();
for (const r of requirements) {
  if (!byChapter.has(r.chapter_id)) byChapter.set(r.chapter_id, { name: r.chapter_name, rows: [] });
  byChapter.get(r.chapter_id).rows.push(r);
}
const chapters = [...byChapter.entries()].sort(
  (a, b) => Number(a[0].slice(1)) - Number(b[0].slice(1))
);
// emit: provenance header (D-02) + per-chapter sections + "- [V1.2.4] [L1] <desc>" rows
// (exact heading/row formatting is Claude's discretion)
```
Provenance header (D-02) — a NEW pattern for this repo (no prior `generated — do not hand-edit` precedent found [VERIFIED: grep over agent-factory/ + scripts/ returned none]):
```markdown
<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-asvs-checklist.mjs
     Source: OWASP ASVS 5.0.0 · OWASP/ASVS @ v5.0.0_release
     Commit: 5cf9b032440be53ce345ab3c130fda46ba1ce7a2 -->
```

### Pattern 3: Read-time level filter (D-05)
**What:** The checklist file ships the **full** 345-item set. `security.asvs_level` is read at audit time; the role/workflow keeps requirements where `L ≤ level`. File is NOT regenerated per dial.
**Why this is correct:** ASVS levels are cumulative (L3 ⊇ L2 ⊇ L1), so "active at L2" = all L1 + all L2 = 70 + 183 = 253 items; "L3" = all 345. The single integer `L` is "the lowest level at which this requirement applies." [VERIFIED: official "What is the ASVS" doc — *"to achieve Level 2 … implement all of the L1 and L2 requirements"*; level counts 70/183/92 confirmed in both CSV and flat.json]

### Pattern 4: Severity ↔ block_on vocabulary alignment (D-09)
**What:** Default L1→high, L2→medium, L3→low. The severity vocabulary {high, medium, low} is a strict subset of `block_on`'s {none, low, medium, high}.
**Verified consistent:** `block_on` default `high` blocks only high → only L1 fails block by default; turning `block_on` down to `medium` adds L2 fails; `low` adds L3 fails; `none` blocks nothing. This is exactly the "more findings block as the bar rises" escalation in `factory.config.md` line 99. [VERIFIED: read both config files — `block_on` enum is none/low/medium/high]

### Anti-Patterns to Avoid
- **Hand-transcribing requirements into the checklist.** Defeats D-01/SEC-02. The generator + vendored source ARE the "not hand-transcribed" proof.
- **Fetching the ASVS source at generate-time.** Breaks reproducibility/auditability. Vendor the blob at the pinned SHA.
- **Writing a CSV parser.** Unnecessary — `flat.json` has the same data with a free parser. (If a reviewer insists on CSV, it needs RFC-4180 quoted-field handling: 12 doubled-quote escapes + embedded commas verified present.)
- **Making workflow 15 self-block.** D-07: audit produces, gate enforces. Only `05-pr-quality-gate.md` reads `block_on` and blocks.
- **Restating the gate loop inside workflow 15.** D-08: reference `05-pr-quality-gate.md` by filename.
- **Writing "§14" into any shipped file.** Cite `05-pr-quality-gate.md` by filename (carried-forward lock).
- **Renumbering workflows 00–14.** Append 15 only.
- **Regenerating the checklist when the dial changes.** The dial is a read-time filter (D-05).
- **Adding/renaming `security.*` config keys.** They already exist byte-identical (carried-forward lock).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parse the ASVS data | A CSV parser (RFC-4180 quoting, embedded commas, doubled-quote escapes) | `JSON.parse` over the vendored `flat.json` | flat.json carries the identical schema; the CSV's 12 `""`-escapes + quoted commas are a verified parser-bug magnet. |
| The requirement IDs / level tags | Hand-typed `[V1.2.4] [L2]` rows | Generate from `req_id` + `L` in the source | "Not hand-transcribed" (D-01); 345 rows is error-prone by hand and drifts from the standard. |
| Chapter structure | A hardcoded chapter list | `chapter_id`/`chapter_name` from the source, numeric-sorted | The source IS the chapter list (V1–V17); hardcoding drifts. |
| Voice enforcement | A new guard script | Extend `guard_voice` in `check-foundation-guards.sh` | D-10 is explicitly an *extension* of an existing guard; the fence-strip awk + word-boundary marker logic already works. |
| Level semantics | Inventing "L1 = X requirements" | Cite the official cumulative definition | The standard defines it; mis-stating it is a fabrication risk on a security surface. |

**Key insight:** Every "hand-roll" temptation here is also a *fabrication* risk on a security surface — exactly what the no-fabrication contract and the provenance header exist to prevent. The committed source + committed generator make the claim *checkable*, not asserted (CONTEXT.md "Specific Ideas").

## Common Pitfalls

### Pitfall 1: `security-nfr.md` byte ceiling is almost exhausted
**What goes wrong:** D-09 adds severity-mapping + override content to `roles/security-nfr.md`. The role is **4326 B** today; the guard FAIL ceiling is **4576 B** and WARN is **4331 B** — it is already 5 B *over* WARN with only ~250 B of FAIL headroom. A few sentences of new content will trip the guard red.
**Why it happens:** `guard_role_size` enforces a per-file byte ceiling captured at a 2026-06-10/11 baseline; the role guards (`guard_voice`, `guard_caveman_preserved`, `guard_role_size`) all read the same 17-file `ROLE_FILES` list.
**How to avoid:** The planner must EITHER (a) write the D-09 additions extremely tersely (senior judgment per token — grugops's token-economy mechanism), OR (b) bump `security-nfr.md`'s entry in the `role_ceiling()` case in `check-foundation-guards.sh` to a new documented baseline (the precedent is exactly how Phase 13 raised `orchestrator.md` to 7570/7165 with an inline comment). Option (b) is legitimate and documented — but it is a deliberate guard edit that must be called out, not silent. Prefer (a); fall back to (b) with a one-line rationale comment.
**Warning signs:** Run `wc -c agent-factory/roles/security-nfr.md` after the edit; if ≥ 4331 it WARNs, if ≥ 4576 it FAILs the build.
[VERIFIED: `wc -c` = 4326; `role_ceiling()` security-nfr.md = "4576 4331"]

### Pitfall 2: Voice guard false-positive on ASVS security prose
**What goes wrong:** The re-anchored checklist and workflow 15 contain ASVS requirement text. If any clear-voice surface contains a `VOICE_MARKERS` token (`\bgrug\b|\bclub\b|\brock\b|\bcave\b|\bsmash\b|\bshiny\b|brain hurt|me think|no think|big think`), the guard fails red.
**Why it happens:** ASVS descriptions are professional English and are very unlikely to contain caveman idioms — but `\brock\b`/`\bclub\b` could in principle appear in a description (e.g. "rock-solid", "club" in some example). The guard uses word boundaries, so `rock-solid` → `\brock\b` *matches* (hyphen is a boundary).
**How to avoid:** After regenerating, run the guard and grep the generated checklist for the marker set; if a legitimate ASVS word trips it, that is a real signal to handle (the guard's D-05 refinement precedent neutralizes specific accepted phrases via `gsub` — same mechanism extends here if needed). Most likely zero hits, but verify, don't assume.
**Warning signs:** `guard_voice` FAIL naming `security-nfr-checklist.md` or `15-security-audit.md`.
[VERIFIED: marker list + word-boundary semantics read from `check-foundation-guards.sh` lines 204, 248–254]

### Pitfall 3: New voice surfaces not added to BOTH the guard and the test harness
**What goes wrong:** D-10 adds 4 surfaces to `guard_voice`. Two of them (the checklist + the workflow + the handoff) are NOT in the current `VOICE_FILES`/`ROLE_FILES` list (only `security-nfr.md` is, via `ROLE_FILES`). If they are added to the guard but not mirrored into the test harness's `GUARD_INPUTS`, the hermetic mirror won't copy them and the smoke/planted runs break.
**Why it happens:** `check-foundation-guards.test.sh` mirrors an explicit `GUARD_INPUTS` file list into a throwaway tree; any file the guard now reads must be in that list or `cp` fails / the guard finds it missing.
**How to avoid:** When extending `guard_voice`'s scan set, add the same paths to `GUARD_INPUTS` in the `.test.sh`, AND add a RED fixture per new surface (plant a caveman marker, assert fail-red naming the file) — mirroring the existing `voice-marker` case. The harness's no-fabrication contract requires every guard *prove* it can fail.
**Warning signs:** Test harness errors `cp: … No such file`, or the smoke run fails on a "missing" file.
[VERIFIED: `GUARD_INPUTS` list + `mirror()` + `voice-marker` case read from `.test.sh` lines 57–93, 182–184]

### Pitfall 4: The checklist's current `tier: lean` frontmatter + role/handoff references
**What goes wrong:** `security-nfr-checklist.md` currently has `tier: lean` frontmatter and is referenced by `roles/security-nfr.md` (lines 23, 31, 35) and indirectly by `05-pr-quality-gate.md`'s flow. A regeneration that drops the path, renames it, or breaks the frontmatter would break those references and possibly the validator (`CHECKLISTS` list requires `security-nfr-checklist` to exist).
**Why it happens:** D-04 says re-anchor *in place* — same path, same filename. The generator must overwrite the existing file, preserving its discoverability.
**How to avoid:** Generate to the exact path `agent-factory/checklists/security-nfr-checklist.md`. Keep a `kind: checklist` frontmatter (the validator only checks existence for checklists, but `check-kit-refs.sh` scans the checklists dir for kit-ref correctness — keep refs like `plans/nfr-catalog.md` resolvable). The current file references `plans/nfr-catalog.md`; decide whether the generated full-ASVS checklist still carries that NFR pointer or whether it moves to the role (the NFR/performance items are adjacent, not ASVS — CONTEXT.md notes nfr-catalog is "adjacent, not security-finding surface").
**Warning signs:** Validator ERROR "missing required checklist file"; `check-kit-refs.sh` FAIL.
[VERIFIED: `tier: lean` frontmatter + references read from checklist + security-nfr.md; `CHECKLISTS` includes `security-nfr-checklist` in validator]

### Pitfall 5: Date/tag ambiguity in secondary sources
**What goes wrong:** Web sources disagree (one said "May 30 2024", another "May 2025"; tag variously `v5.0.0` vs `v5.0.0_release`). Picking the wrong tag/sha poisons the whole generator.
**Why it happens:** SEO content and mirrors are stale or imprecise.
**How to avoid:** Use the values verified directly against the GitHub API at research time: tag **`v5.0.0_release`**, sha **`5cf9b032440be53ce345ab3c130fda46ba1ce7a2`**, published **2025-05-30**. There is no bare `v5.0.0` tag — the only 5.x tag is `v5.0.0_release`.
**Warning signs:** A `curl` to a `v5.0.0` (no `_release`) raw path 404s.
[VERIFIED: GitHub API `repos/OWASP/ASVS/tags` returned exactly one 5.x tag: `v5.0.0_release` → `5cf9b032…`; release `published_at` = 2025-05-30T09:35:31Z]

## Code Examples

### Verified ASVS source schema (the contract the generator depends on)
```jsonc
// Source: OWASP/ASVS @ 5cf9b032440be53ce345ab3c130fda46ba1ce7a2
//   5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.flat.json
// top-level: { "requirements": [ ... 345 items ... ] }   each item:
{
  "chapter_id": "V1",
  "chapter_name": "Encoding and Sanitization",
  "section_id": "V1.1",
  "section_name": "Encoding and Sanitization Architecture",
  "req_id": "V1.1.1",
  "req_description": "Verify that input is decoded ...",
  "L": "2"            // string "1" | "2" | "3"  — single level per requirement (cumulative)
}
```
[VERIFIED: fetched + parsed at the pinned SHA; 345 items; keys exactly as above; `L` ∈ {"1","2","3"} only]

### Verified chapter list (V1–V17, ASVS 5.0 names — note these differ from 4.0)
```
V1  Encoding and Sanitization          V10 OAuth and OIDC
V2  Validation and Business Logic      V11 Cryptography
V3  Web Frontend Security              V12 Secure Communication
V4  API and Web Service                V13 Configuration
V5  File Handling                      V14 Data Protection
V6  Authentication                     V15 Secure Coding and Architecture
V7  Session Management                 V16 Security Logging and Error Handling
V8  Authorization                      V17 WebRTC
V9  Self-contained Tokens
```
[VERIFIED: distinct chapter_id/chapter_name pairs at the pinned SHA]

### Verified level distribution (for the workflow/checklist to state honestly)
```
L1: 70    L2: 183    L3: 92    total: 345
active at L1 = 70 ; active at L2 = 253 (70+183) ; active at L3 = 345 (cumulative)
```
[VERIFIED: identical counts in both CSV and flat.json at the pinned SHA]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ASVS 4.0.3 (14 chapters V1–V14, heavy L1 ≈ 131 controls) | ASVS 5.0.0 (17 chapters V1–V17, rebalanced L1 = 70) | v5.0.0_release, 2025-05-30 | Chapter numbering AND names changed; L1 deliberately lighter for adoption. The current `security-nfr-checklist.md` (10 generic bullets) predates this and is what this phase replaces. [VERIFIED: tag/date + CITED: softwaremill/cyberchief on rebalancing] |
| Hand-written 10-bullet checklist | Generated 345-item L1/L2/L3 checklist from pinned source | This phase (14) | "Not hand-transcribed" becomes provable. |

**Deprecated/outdated:**
- The legacy artifacts (`...en.legacy.json/.csv`) map 5.0 back to the 4.0 numbering — **do NOT vendor the legacy form**; use the native `flat.json`. [VERIFIED: both legacy + native exist in the release; legacy is the back-mapping form]
- ASVS 4.0.x chapter numbering (V1–V14) is superseded; any 4.0-era checklist content is outdated.

## Runtime State Inventory

> This phase is a content/generation phase (markdown + a data file + scripts), not a rename/migration. No stored runtime state, live services, OS registrations, secrets, or build artifacts are renamed. The closest analog is the *re-anchored checklist* — handled below for completeness.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — grugops ships no datastore. The vendored `flat.json` is committed source data, not runtime state. | None |
| Live service config | None — no external service. | None |
| OS-registered state | None. | None |
| Secrets/env vars | None — `security.asvs_level`/`block_on` are config keys, not secrets; already shipped, only behavior wired. | None |
| Build artifacts | The generated `security-nfr-checklist.md` is the only build output; it is committed (D-01). After regeneration, downstream readers (`security-nfr.md`, `05-pr-quality-gate.md` flow) read the same path — no stale cache. | Regenerate + commit |

**Reference integrity to check (the "what still points at the old thing" question):** the checklist path `agent-factory/checklists/security-nfr-checklist.md` is referenced by `roles/security-nfr.md` (3×) and listed in the validator `CHECKLISTS` + scanned by `check-kit-refs.sh`. Because D-04 keeps the path/filename identical, **all references survive unchanged** — verified by reading every referencing site. No reference rewrite needed.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The generator should output the checklist as flat chapter sections with `- [req_id] [L1/L2/L3] description` rows | Architecture Pattern 2 | Low — exact formatting is explicitly Claude's discretion (CONTEXT D). The row must carry req_id + level tag + text (D-05); layout is free. |
| A2 | `security.asvs_level=L2` should activate L1+L2 (cumulative), not L2-only | Pattern 3 | Low — confirmed cumulative by official docs + level math; but the planner/discuss should confirm the *display* intent (show only the active tier vs show all but mark active). D-05 says "filters the active tier" — interpret as cumulative-inclusive. |
| A3 | The vendored data path is `scripts/asvs/asvs-5.0.0.flat.json` | Standard Stack / Structure | None — path is Claude's discretion; only "pinned + in-repo" is locked (D-01). |
| A4 | The nfr-catalog pointer currently in the checklist may move to the role rather than the regenerated ASVS checklist | Pitfall 4 | Medium — the regenerated checklist is pure ASVS; the NFR/performance items are adjacent. The planner should decide where the NFR pointer lives so the role's "performance vs NFR catalog" check still resolves. Flag for planning. |

## Open Questions (RESOLVED)

1. **Where does the NFR/performance pointer live after re-anchor?**
   - What we know: the current checklist mixes ASVS-style items with `performance impact vs NFR catalog` / `reliability` / `monitoring` lines; `roles/security-nfr.md` checks performance against `plans/nfr-catalog.md`.
   - What's unclear: the regenerated checklist is pure ASVS (345 items, no NFR-catalog line). The role still must check NFR budgets.
   - Recommendation: keep the NFR/perf/reliability checks in the *role* (security-nfr.md already does, lines 30–31) and let the regenerated checklist be pure ASVS. The role already points at both the checklist and `nfr-catalog.md` separately. No data is lost. (Planner to confirm.)
   - **RESOLVED (adopted in planning):** NFR pointer stays in the role; the regenerated checklist is pure ASVS. Plan 14-01 Task 2 drops the old NFR pointer from the generated checklist; Plan 14-03 Task 1 keeps the `plans/nfr-catalog.md` pointer in `security-nfr.md`.

2. **Terse-write vs ceiling-bump for `security-nfr.md` (D-09)?**
   - What we know: ~250 B of FAIL headroom; Phase-13 precedent shows ceiling bumps are legitimate + documented.
   - What's unclear: whether the D-09 content fits in the headroom.
   - Recommendation: attempt terse first; if it WARNs/FAILs, bump the `role_ceiling()` entry with an inline rationale comment (Phase-13 style). Either is acceptable; make it explicit.
   - **RESOLVED (adopted in planning):** terse-first with documented ceiling-bump fallback — the full procedure is encoded in Plan 14-03 Task 1's action and acceptance criteria.

3. **Does workflow 15 need a `## Metrics emitted` section?**
   - What we know: `05-pr-quality-gate.md` records `Gate pass rate`; workflow 14 omits metrics.
   - What's unclear: whether a deep audit should record an audit-coverage metric.
   - Recommendation: optional; mirror workflow 14 (no metrics section) unless the planner wants an audit metric. Not validator-enforced (workflow 15 isn't in the frozen list).
   - **RESOLVED (adopted in planning):** omit the Metrics section — mirror workflow 14. Encoded in Plan 14-02 Task 1's action.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (≥18) | `generate-asvs-checklist.mjs` | ✓ | v24.12.0 | — |
| POSIX sh | `check-foundation-guards.sh` extension | ✓ | /bin/sh | — |
| awk | `guard_voice` fence-strip | ✓ | /usr/bin/awk | — |
| grep (ugrep-aliased) | guard marker scan | ✓ | present (portable flags only: -r -n -l -E -F -q -v) | — |
| git | vendoring blob at pinned SHA (one-off) | ✓ | 2.54.0 | curl to raw.githubusercontent.com at the pinned SHA |
| network (vendoring only) | one-off fetch of the ASVS blob | ✓ (research fetched it) | — | the blob can be committed from any machine with access; runtime never fetches |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None blocking — vendoring is a one-off; the runtime (host agent reading markdown) needs nothing external.

## Validation Architecture

> `workflow.nyquist_validation` is not set to `false` in `.planning/config.json` (key absent → treated as enabled). This kit has no app test runner; validation is via the existing sh/Node guard scripts (the "tests" of a markdown kit).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | POSIX-sh assertion harnesses + a stdlib-Node structure validator (no npm test runner — zero-dep kit) |
| Config file | none (scripts are self-contained; no package.json) |
| Quick run command | `sh scripts/check-foundation-guards.sh` (the build gate, ~instant) |
| Full suite command | `sh scripts/check-foundation-guards.sh && sh scripts/check-foundation-guards.test.sh && sh scripts/check-kit-refs.sh && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.mjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-02 | Generator is reproducible: re-run produces byte-identical checklist (no drift) | freshness/integrity | regenerate to temp + `cmp -s` against committed (mirror Phase-17 freshness pattern; can be a tiny check now or a `.test.sh` case) | ❌ Wave 0 (new check) |
| SEC-02 | Generator parses the vendored source + emits all 345 rows with req_id + level | smoke | `node scripts/generate-asvs-checklist.mjs` then `grep -c '^\- \[V' agent-factory/checklists/security-nfr-checklist.md` ⇒ 345 | ❌ Wave 0 (new) |
| SEC-02 | Provenance header present (D-02) | grep | `grep -q 'GENERATED — do not hand-edit' agent-factory/checklists/security-nfr-checklist.md` | ❌ Wave 0 |
| SEC-03 | Clear voice on the 4 security surfaces; caveman fence carved out | guard | `sh scripts/check-foundation-guards.sh` (extended `guard_voice`) | ✅ extend existing |
| SEC-03 | The new surfaces FAIL-RED on a planted voice regression (no-fabrication) | RED fixture | `sh scripts/check-foundation-guards.test.sh` (new cases) | ✅ extend existing |
| SEC-03 | Config dials remain valid + byte-identical across the 3 files | validator + cmp | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.mjs` + the `.test.sh` `cmp -s` case | ✅ existing |
| SEC-01 | Workflow 15 exists with the §18 sections + `## Commit`; cites `05-pr-quality-gate.md` | structural grep | `grep -q '05-pr-quality-gate.md' agent-factory/workflows/15-security-audit.md` (validator does NOT cover wf15) | ❌ Wave 0 (manual/grep — wf15 not in frozen validator list) |
| SEC-01 | `security-audit` classification + workflow-map row registered in orchestrator | grep | `grep -q 'security-audit' agent-factory/roles/orchestrator.md` and `grep -q '15-security-audit.md' agent-factory/roles/orchestrator.md` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `sh scripts/check-foundation-guards.sh` (the build gate must stay GREEN).
- **Per wave merge:** full suite (foundation guards + test harness + kit-refs + validator).
- **Phase gate:** full suite green + the SEC-02 freshness check (regenerate ⇒ no diff) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/generate-asvs-checklist.mjs` — the generator (SEC-02 core)
- [ ] `scripts/asvs/asvs-5.0.0.flat.json` — vendored source @ pinned SHA (SEC-02)
- [ ] SEC-02 freshness/integrity check — regenerate-to-temp + `cmp -s` (a `.test.sh` case or a small standalone, mirroring the Phase-17 freshness pattern); proves the committed checklist matches the generator output
- [ ] `check-foundation-guards.test.sh` — RED fixtures for the 3 NEW voice surfaces (checklist, workflow 15, handoff) + ensure they're in `GUARD_INPUTS`
- [ ] (no framework install needed — sh + Node already present)

## Security Domain

> `security_enforcement` is not `false` in config — this section applies. **Note:** this phase's "security" is *about* security tooling (it builds the ASVS audit), but the phase's own *code surface* is a generator script + markdown. The threat surface of the phase itself is small; the ASVS standard it encodes is the security content.

### Applicable ASVS Categories (for the phase's OWN scripts — the generator)
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V1 Encoding and Sanitization | yes (minor) | The generator emits markdown from trusted, vendored, pinned JSON — no untrusted input. Still: write output via `writeFileSync` to a FIXED path, never a path derived from file content (mirrors `validate-agent-factory.mjs` read-only-by-construction posture). |
| V5 File Handling | yes (minor) | Read the vendored source from a fixed relative path; do not accept a source path from argv/env without validation. |
| V13 Configuration | yes | The dials (`asvs_level`/`block_on`) are already enum-validated by the validator; do not weaken those enums. |
| V16 Security Logging and Error Handling | yes | Generator fails closed (try/catch → finding, never silent partial output), mirroring the validator's fail-closed contract. A partial/garbled checklist must error, not ship. |
| V2/V3/V4/V6/V7/V8 (auth, session, access control, etc.) | no | grugops ships no runtime, no auth, no sessions — the generator is a build-time text transform. |

### Known Threat Patterns for {stdlib-Node generator over vendored data}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Supply-chain: a poisoned/altered ASVS source slipped in | Tampering | Pin the exact commit SHA in the provenance header (D-02); the SHA is the integrity anchor. Vendoring from `latest` (moving tag) would be the vulnerability. |
| Path traversal / arbitrary write via content-derived path | Tampering | Output + source paths are FIXED literals joined to repo root (never derived from JSON content) — the `validate-agent-factory.mjs` invariant. |
| Silent partial generation (truncated/garbled output ships green) | Repudiation / Tampering | Fail-closed: try/catch around parse + a row-count sanity assert (expect 345); the freshness `cmp -s` check catches drift. |
| Fabricated "pass" on a security surface | Repudiation | No-fabrication contract: every checklist tick cites evidence or reads `UNKNOWN - verify`; the generator never invents text (it copies `req_description` verbatim). |

## Project Constraints (from CLAUDE.md)

- **Markdown for everything except installers + the one optional Node validator.** The new generator is a stdlib-Node script in the same family as `validate-agent-factory.mjs` — allowed; no npm deps.
- **Single-source:** role text lives once; adapters are pointers. The re-anchored checklist stays single-source at its canonical path (D-04).
- **Voice discipline:** caveman voice ONLY in role-prompt fences; clear professional voice in security findings/compliance. Enforced mechanically by the extended `guard_voice` (D-10/D-11).
- **No fabrication:** never fake a gate/test/citation; mark `UNKNOWN - verify`. The generated checklist's evidence-or-`UNKNOWN` rule (SEC-02 SC2) is the direct application.
- **Installers/validators: zero-dep, stdlib only.** Generator obeys (D-03).
- **TypeScript pivot is HELD** — generator is plain ESM `.mjs`, not `.ts`.
- **Brand:** lowercase `grugops`, `/grug` command shape — irrelevant to this phase's files but do not introduce `§14` (use `05-pr-quality-gate.md`).

## Sources

### Primary (HIGH confidence — verified by direct fetch at the pinned SHA)
- GitHub API `repos/OWASP/ASVS/tags` — confirmed the only 5.x tag is `v5.0.0_release` → sha `5cf9b032440be53ce345ab3c130fda46ba1ce7a2`
- GitHub API `repos/OWASP/ASVS/releases/tags/v5.0.0_release` — name "OWASP Application Security Verification Standard 5.0.0", published 2025-05-30, asset list (CSV + flat.json + json + legacy variants)
- GitHub API git tree @ `5cf9b032…` — artifact paths under `5.0/docs_en/`
- `raw.githubusercontent.com/OWASP/ASVS/5cf9b032…/5.0/docs_en/…_5.0.0_en.flat.json` — schema (7 keys), 345 requirements, 17 chapters, `L` ∈ {1,2,3}, level distribution 70/183/92
- `raw.githubusercontent.com/.../…_5.0.0_en.csv` — same data, RFC-4180 quoting, 12 `""` escapes (drove the flat.json recommendation)
- `OWASP/ASVS@5cf9b032…/5.0/en/0x03-What-is-the-ASVS.md` (via WebFetch) — level definitions + cumulative semantics ("achieve L2 → implement all L1 and L2")
- Internal source files (read directly): `14-ui-design-to-build.md`, `05-pr-quality-gate.md`, `security-nfr-checklist.md`, `security-nfr.md`, `security-nfr-handoff.md`, `check-foundation-guards.sh`, `check-foundation-guards.test.sh`, `validate-agent-factory.mjs`, `factory.config.json` (+ seed), `factory.config.md`, `orchestrator.md`, `README.md`, `AGENTS.md`, `check-kit-refs.sh`

### Secondary (MEDIUM confidence — cross-referenced, not load-bearing)
- softwaremill.com/whats-new-in-asvs-5-0/ — L1 rebalancing (70 vs 4.0's heavy L1), 17-chapter restructure
- cyberchief.ai ASVS v5 overview — level rebalancing rationale
- deepwiki.com differences 5.0 vs 4.0 — chapter/level changes

### Tertiary (LOW confidence — flagged, superseded by primary)
- Initial WebFetch of the releases page returned a conflicting "May 30 2024" date — **superseded** by the GitHub API's authoritative `published_at: 2025-05-30` (Pitfall 5).

## Metadata

**Confidence breakdown:**
- ASVS source pin (tag/sha/schema/levels/chapters): HIGH — verified by direct fetch + API at the exact SHA, cross-checked CSV vs flat.json (identical counts).
- Generator approach (stdlib JSON, zero-dep): HIGH — flat.json schema confirmed; `validate-agent-factory.mjs` pattern read in full.
- Workflow 15 / orchestrator registration: HIGH — sibling workflow + orchestrator map read; exact insertion points identified.
- Voice-guard extension + byte ceilings: HIGH — guard + test harness read in full; the `security-nfr.md` tight-budget risk quantified to the byte.
- NFR-pointer placement (Open Q 1): MEDIUM — recommendation is sound but is a planner decision.

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 (30 days) for the internal patterns; the ASVS pin is immutable (a fixed tag+SHA) and does not expire — only a deliberate decision to adopt a newer ASVS release would change it.

## RESEARCH COMPLETE

**Phase:** 14 - Security Audit (OWASP ASVS) & Checklist Re-Anchor
**Confidence:** HIGH

### Key Findings
- **The #1 unknown is fully pinned:** OWASP ASVS 5.0.0 = `OWASP/ASVS` tag **`v5.0.0_release`**, sha **`5cf9b032440be53ce345ab3c130fda46ba1ce7a2`**, published 2025-05-30. Vendor the in-repo **`flat.json`** (`5.0/docs_en/…_5.0.0_en.flat.json`).
- **flat.json beats CSV** — identical 7-key schema (`chapter_id, chapter_name, section_id, section_name, req_id, req_description, L`), **345 requirements**, **17 chapters (V1–V17)**, `L` is a single int {1,2,3} (distribution 70/183/92). JSON.parse = zero-dep; CSV would force a hand-rolled RFC-4180 parser (12 `""` escapes verified). The generator needs **no parser**.
- **No level-model mismatch with CONTEXT.md:** ASVS 5.0 keeps three **cumulative** levels (L3⊇L2⊇L1); `asvs_level=L2` ⇒ keep `L≤2` (253 items). The severity vocabulary {high,medium,low} (D-09) is a clean subset of `block_on` {none,low,medium,high} — verified consistent. Dials already ship byte-identical and are already enum-validated — wire behavior only.
- **Sharp constraint:** `security-nfr.md` is **4326 B** vs guard WARN 4331 / FAIL 4576 — ~250 B headroom for D-09 additions. Write terse or bump the `role_ceiling()` entry (Phase-13 precedent). The 3 new voice surfaces must be added to BOTH `guard_voice` AND the test harness `GUARD_INPUTS` with RED fixtures.
- **Validator does NOT cover workflow 15** (frozen 00–13 list, no directory iteration) — workflow 15's structure is pattern-driven, not validator-enforced; verify it by grep.

### File Created
`.planning/phases/14-security-audit-owasp-asvs-checklist-re-anchor/14-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack (ASVS pin + artifact) | HIGH | Verified by direct fetch + GitHub API at the exact SHA. |
| Architecture (generator + workflow + dials) | HIGH | flat.json schema confirmed; sibling patterns + dials read in full. |
| Pitfalls (byte ceiling, voice guard, refs) | HIGH | Guard + test harness + referencing sites read; risks quantified to the byte. |

### Open Questions
1. Where the NFR/perf pointer lives after re-anchor (recommend: keep in the role; checklist stays pure ASVS).
2. Terse-write vs ceiling-bump for `security-nfr.md` D-09 content (recommend: terse first, documented bump as fallback).
3. Whether workflow 15 carries a `## Metrics emitted` section (recommend: mirror wf14 — omit).

### Ready for Planning
Research complete. The planner has the exact tag/sha, the artifact path + schema, the level math, the generator pattern, the registration points, the voice-guard extension path, and the byte-budget constraint. Planner can now create PLAN.md files.
