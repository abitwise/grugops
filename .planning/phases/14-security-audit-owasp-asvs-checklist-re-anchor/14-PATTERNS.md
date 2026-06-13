# Phase 14: Security Audit (OWASP ASVS) & Checklist Re-Anchor - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 9 (3 new, 6 modified-in-place)
**Analogs found:** 8 / 9 (1 vendored data file has no code analog)

> grugops is a markdown agent-factory kit, not an app. "Role" below = the kit artifact type
> (workflow / generator-script / checklist / role-prompt / handoff-template / guard-script /
> orchestrator-map). "Data flow" = the transform shape (file-I/O text-transform / read-time
> filter / reference-and-route). Analogs are sibling files in the same kit family.

## File Classification

| New/Modified File | Role (kit artifact) | Data Flow | Closest Analog | Match Quality |
|-------------------|---------------------|-----------|----------------|---------------|
| `agent-factory/workflows/15-security-audit.md` | workflow (reference-don't-restate) | reference-and-route | `agent-factory/workflows/14-ui-design-to-build.md` | exact |
| `scripts/generate-asvs-checklist.mjs` | generator script (stdlib Node) | file-I/O transform (JSON→md) | `scripts/validate-agent-factory.mjs` | role-match (read+parse+fail-closed; new is read+write) |
| `scripts/asvs/asvs-5.0.0.flat.json` | vendored data (pinned source) | data-at-rest | — none — | NO ANALOG (data file, not code) |
| `agent-factory/checklists/security-nfr-checklist.md` | checklist (generated, in place) | generated artifact | its own current "before" body | self-analog (drop-in compatible rewrite) |
| `scripts/check-foundation-guards.sh` | guard aggregator (POSIX sh) | text-scan lint | its own `guard_voice` (extend) | self-analog (extend existing guard) |
| `scripts/check-foundation-guards.test.sh` | guard fail-proof harness | hermetic RED fixture | its own `voice-marker` case | self-analog (mirror existing case) |
| `agent-factory/roles/orchestrator.md` | role + routing map | reference-and-route | its own classification list + workflow-map table | self-analog (append one row) |
| `agent-factory/roles/security-nfr.md` | role prompt (TIGHT byte budget) | reference-and-route | its own `## Hard limits` + `## Reads` | self-analog (terse insert) |
| `agent-factory/handoffs/security-nfr-handoff.md` | handoff template | fill-in fields | its own current `## Result` block | self-analog (add severity/level fields) |

---

## Pattern Assignments

### `agent-factory/workflows/15-security-audit.md` (NEW — workflow, reference-and-route)

**Analog:** `agent-factory/workflows/14-ui-design-to-build.md` (4672 B — copy the skeleton; wf15 has roughly the same budget room, no validator ceiling).

**Frontmatter + title pattern** (analog lines 1-6):
```markdown
---
kind: workflow
order: 14
cadence: both
---
# Workflow: UI design to build
```
→ For wf15: `order: 15`, title `# Workflow: Security audit (OWASP ASVS)`. **Do NOT renumber 00–14** (carried-forward lock). The validator does NOT section-check wf14/wf15 (its `WORKFLOWS` array is frozen at 00–13 — see `validate-agent-factory.mjs` lines 107-122 and the loops at lines 233, 278, 509 which iterate that array, never `readdirSync`), so wf15's structure is pattern-driven, not validator-enforced. Still mirror the section set for consistency + the future Phase-17 catalog.

**Reference-don't-restate pattern — the load-bearing precedent for D-08** (analog lines 26 and 30, verbatim):
```markdown
The Software Engineer builds the components against the contract per
`agent-factory/workflows/04-ticket-to-pr.md`. The engineering loop, the inner red-green
cycle, and the bounded self-fix live there — this workflow references that build and does
not restate it.
...
Verify the built UI against the contract per `agent-factory/workflows/05-pr-quality-gate.md`.
The gate loop, the bounded self-fix, and the terminal result live there — this workflow
references that gate and does not restate it.
```
→ wf15 names `agent-factory/workflows/05-pr-quality-gate.md` **by filename** for enforcement (D-07/D-08), never "§14", never restating the gate loop. The exact phrasing to copy: *"… live there — this workflow references that gate and does not restate it."*

**Agents-involved cross-reference shape** (analog lines 11-16):
```markdown
## Agents involved
- Frontend/UI — authors the UI/design contract once (writes `plans/handoffs/<TICKET-ID>-frontend.md`).
- Software Engineer — builds the components against the contract (see `agent-factory/workflows/04-ticket-to-pr.md`).

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`):
one window, drop prior context, the handoff is the only memory.
```
→ For wf15: single agent = **Security/NFR** (deep audit); writes `plans/handoffs/<TICKET-ID>-security-nfr.md`; same role-switch-protocol pointer line verbatim.

**Done condition — autonomy + humans-hold-merge pattern** (analog line 42, verbatim shape):
```markdown
This workflow honors `autonomy=pr` — the agent opens a branch and a PR; it never merges.
Humans hold merge and deploy.
```

**Commit section — branch-guard-first pattern** (analog lines 44-45, verbatim shape):
```markdown
## Commit
Commit the artifacts this workflow wrote (...) per `agent-factory/_commit-convention.md` —
branch guard first (never a protected branch; switch to `grugops/ui-design-to-build-<id>`),
then `type(scope): summary`. Never merge, never deploy; humans hold both.
```
→ wf15 branch slug: `grugops/security-audit-<id>`.

**Section skeleton to emit** (the 14-ui section order, all present in the analog):
`## When to use` · `## Agents involved` · `## Inputs required` · `## Steps` · `## Board moves` · `## Handoffs produced` · `## Trace updates` · `## Done condition` · `## Commit`.
- `## Inputs required` MUST name `security.asvs_level` + `security.block_on` from `.grugops/factory.config.json`, the checklist `agent-factory/checklists/security-nfr-checklist.md`, and the change under review (mirror analog lines 18-23 which name `accessibility-checklist.md` + the `autonomy` setting).
- `## Steps` MUST: walk the full-level checklist filtered to `asvs_level` (read-time, cumulative — keep `L ≤ level`); emit severity-tagged findings (D-09 default L1→high / L2→medium / L3→low); reference `05-pr-quality-gate.md` by filename for enforcement; **never self-block** (D-07).
- `## Board moves`: `In Security/NFR` column (distinct from the per-ticket check — D-06).
- `## Metrics emitted` is OPTIONAL — analog wf14 OMITS it; wf15 may follow (RESEARCH Open Q3, recommend omit).

**Constraints:** D-08 reference-don't-restate; D-07 audit-produces-gate-enforces (no self-block); cite `05-pr-quality-gate.md` by filename never "§14" (carried-forward lock); order=15, no renumbering.

---

### `scripts/generate-asvs-checklist.mjs` (NEW — generator script, file-I/O transform)

**Analog:** `scripts/validate-agent-factory.mjs` (the stdlib-Node ESM, zero-dep, fail-closed family member). The generator READS + WRITES (the validator only reads), so the write half follows the validator's *read-only-by-construction* invariant inverted: a single FIXED output path, never derived from content.

**File-header doc-comment pattern** (analog lines 1-13, 37-41): a top block stating purpose, the stdlib-ONLY / ZERO-deps / no-package.json contract, and the fail-closed invariant. Copy this convention — it is the house style for every `.mjs` in `scripts/`. The provenance/SHA belongs here too.

**Imports pattern** (analog lines 42-44, extend with write+url helpers):
```javascript
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
```
→ generator adds `writeFileSync`; RESEARCH Pattern 2 (RESEARCH lines 228-251) gives the exact load+group skeleton — copy it verbatim as the starting point:
```javascript
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC  = join(ROOT, "scripts/asvs/asvs-5.0.0.flat.json"); // path = discretion
const OUT  = join(ROOT, "agent-factory/checklists/security-nfr-checklist.md");
const TAG = "v5.0.0_release";
const SHA = "5cf9b032440be53ce345ab3c130fda46ba1ce7a2";
```

**Root-resolution pattern** (analog lines 51, 61 — `dirname(fileURLToPath(import.meta.url))` then `join`/`resolve` to repo root). The validator uses env-var roots (`VALIDATE_KIT_ROOT`); the generator needs no env root — it has FIXED literal source + output paths joined to the script dir's parent (RESEARCH Security V5/V13: never accept a source/output path from argv/env — read-only-by-construction).

**Fail-closed parse pattern** (analog lines 67-73, 292-305 — every read/parse in try/catch; reject a non-object/null parse result before dereferencing):
```javascript
const kitRead = (rel) => { try { return readFileSync(join(KIT_ROOT, rel), "utf8"); } catch { return null; } };
...
let cfg;
try { cfg = JSON.parse(raw); } catch { err(`${rel}: not valid JSON`); return; }
if (cfg === null || typeof cfg !== "object" || Array.isArray(cfg)) { err(`${rel}: not a JSON object`); return; }
```
→ generator wraps `JSON.parse(readFileSync(SRC))` the same way; on parse failure or a non-object/empty `requirements` array it must **fail closed (nonzero exit, no partial write)** — never ship a truncated checklist (RESEARCH Security: "Silent partial generation" → fail-closed + a row-count sanity assert: expect 345 rows).

**Error-collect + exit pattern** (analog lines 99-102, 532-541):
```javascript
const errors = [];
const err = (m) => errors.push(m);
...
for (const e of errors) console.error(`  ERROR    ${e}`);
if (failed === 0) { console.log("ALL CHECKS PASSED"); process.exit(0); }
console.error(`...`); process.exit(1);
```
→ generator: on success print a one-line confirmation + `process.exit(0)`; on any failure `console.error` + `process.exit(1)`.

**Provenance-header pattern — NEW to this repo** (no prior `generated — do not hand-edit` precedent; verified absent). Emit at the top of the generated `.md` (RESEARCH lines 254-257):
```markdown
<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-asvs-checklist.mjs
     Source: OWASP ASVS 5.0.0 · OWASP/ASVS @ v5.0.0_release
     Commit: 5cf9b032440be53ce345ab3c130fda46ba1ce7a2 -->
```

**Source schema the generator depends on** (RESEARCH lines 334-344 — VERIFIED at the pinned SHA): top-level `{ "requirements": [ … 345 items … ] }`, each item 7 keys: `chapter_id` (e.g. `"V1"`), `chapter_name`, `section_id`, `section_name`, `req_id` (e.g. `"V1.1.1"`), `req_description`, `L` (string `"1"|"2"|"3"`). Group by `chapter_id`, numeric-sort on `Number(id.slice(1))` (V1..V17). Emit rows `- [<req_id>] [L<n>] <req_description>` (exact formatting = discretion). Copy `req_description` VERBATIM — never invent text (no-fabrication on a security surface).

**Constraints:** D-03 stdlib Node only, no TS, no npm deps, no package.json; output to the EXACT path `agent-factory/checklists/security-nfr-checklist.md` (D-04 in place); FIXED literal source+output paths (RESEARCH Security V5); row-count assert (expect 345); fail-closed, no partial write; provenance header (D-02).

---

### `scripts/asvs/asvs-5.0.0.flat.json` (NEW — vendored data, NO CODE ANALOG)

No code pattern. Vendor the blob `OWASP_Application_Security_Verification_Standard_5.0.0_en.flat.json` from `OWASP/ASVS@5cf9b032440be53ce345ab3c130fda46ba1ce7a2`, path `5.0/docs_en/` (RESEARCH lines 98-104). 7-key flat schema above; 345 requirements; 17 chapters (V1–V17); `L` distribution 70/183/92. **Do NOT vendor the `latest` tag or the `.legacy.json` form** (RESEARCH lines 96, 375). Vendor at the pinned SHA, never fetch at runtime (RESEARCH line 95). Path under `scripts/asvs/` is discretion (D-01 only requires pinned + in-repo).

---

### `agent-factory/checklists/security-nfr-checklist.md` (MODIFIED — generated in place; self-analog)

**The "before" to stay drop-in compatible with** (current full file, 715 B):
```markdown
---
kind: checklist
tier: lean
---
# Security / NFR Checklist

Apply this checklist whenever a ticket touches authentication, data handling, or a
non-functional concern. ...The "performance impact vs NFR catalog" check references
`plans/nfr-catalog.md` — cite the catalog's targets; do not redefine them here.

- auth + permissions checked
- input validation checked
... (10 generic bullets)
- GDPR/compliance notes when relevant
```

**Drop-in-compatibility constraints the generated "after" MUST preserve** (RESEARCH Pitfall 4):
- **Exact path + filename** `agent-factory/checklists/security-nfr-checklist.md` (D-04). Referenced 3× by `roles/security-nfr.md` (lines 22, 31, 35) and listed in the validator `CHECKLISTS` array (`validate-agent-factory.mjs` line 170 → existence-checked at line 241-243). A rename/move breaks both.
- **Keep `kind: checklist` frontmatter** — validator existence-checks the file; `check-kit-refs.sh` scans the checklists dir for kit-ref correctness (keep any kit refs resolvable).
- **Voice surface** — the generated body is scanned by the extended `guard_voice` (D-10). ASVS `req_description` text is professional English; verify no `VOICE_MARKERS` token (`\bgrug\b|\bclub\b|\brock\b|\bcave\b|\bsmash\b|\bshiny\b|...`) survives generation — `rock-solid` would trip `\brock\b` (hyphen = word boundary). RESEARCH Pitfall 2: most likely zero hits, but grep after generating.
- **The NFR/perf pointer** currently in this file (`performance impact vs NFR catalog` → `plans/nfr-catalog.md`, line 9 + line 18) is ADJACENT, not ASVS. RESEARCH Open Q1 + A4 (MEDIUM risk): recommend the regenerated checklist be **pure ASVS** and the NFR/perf/reliability checks stay in the ROLE (`security-nfr.md` already points at `nfr-catalog.md` separately, line 22). **Planner must confirm** where the NFR pointer lives so the role's "performance vs NFR catalog" check still resolves.
- **Provenance header** (D-02) replaces the hand-written intro; the level-filter semantics (cumulative, `L ≤ asvs_level`) should be stated honestly (RESEARCH Pattern 3: L1=70, L2=253, L3=345).

---

### `scripts/check-foundation-guards.sh` (MODIFIED — extend `guard_voice`; self-analog)

**Extend, do NOT rebuild** (D-10 is an *extension*; RESEARCH "Don't Hand-Roll"). The `guard_voice` machinery is correct — add the 3 new non-role surfaces to its scan set.

**The scan-set pattern to extend** (current lines 186-203). `security-nfr.md` is ALREADY scanned via `ROLE_FILES` (line 199) — its Caveman-fence carve-out (D-11) is already handled by the fence-strip awk. The 3 NEW surfaces (checklist, workflow 15, handoff) are NOT roles, so add a SEPARATE list and union it into `VOICE_FILES`:
```sh
ROLE_FILES="agent-factory/roles/agents-md-scribe.md \
... (17 roles, incl. security-nfr.md at line 199) ..."
VOICE_FILES="$ROLE_FILES"          # ← line 203: extend to add the 3 security surfaces
VOICE_MARKERS='\bgrug\b|\bclub\b|\brock\b|\bcave\b|\bsmash\b|\bshiny\b|brain hurt|me think|no think|big think'
```
→ Add e.g. `SEC_VOICE_FILES="agent-factory/workflows/15-security-audit.md agent-factory/checklists/security-nfr-checklist.md agent-factory/handoffs/security-nfr-handoff.md"` then `VOICE_FILES="$ROLE_FILES $SEC_VOICE_FILES"`. The 3 new surfaces have NO `## Caveman prompt` fence, so the fence-strip awk (lines 230-236) is a harmless no-op on them — they get scanned whole, which is correct (everything on a security surface is clear voice, D-10/D-11).

**Caveman-fence carve-out pattern** (D-11; current lines 230-236, the awk that strips the single fenced `## Caveman prompt` block before the marker grep). This is the load-bearing carve-out: `security-nfr.md`'s caveman fence (role lines 10-16, the ` ```You are Security/NFR. … ``` ` block) stays caveman and is skipped; the rest of the role body is clear-voice-scanned. **Do NOT re-engineer this anchor** (D-10 forward-compat note, lines 177-180). The new D-09 severity content goes in the role's CLEAR-voice sections (e.g. `## Hard limits`), so it IS scanned — write it in clear professional voice.

**Per-file missing-file fail-red pattern** (current lines 215-219 — assert `[ ! -f "$f" ]` before the awk, so a missing file is a structured finding not a `set -eu` abort). The 3 new surfaces inherit this automatically by being in `VOICE_FILES`.

**TIGHT-BUDGET interaction — `role_ceiling()` may need a bump** (RESEARCH Pitfall 1). `security-nfr.md` is **4326 B** today vs its `role_ceiling()` entry `"4576 4331"` (line 369: FAIL 4576 / WARN 4331) — already 5 B OVER WARN, ~250 B FAIL headroom. The D-09 additions to the role body (next section) may trip this guard. The Phase-13 precedent for a documented bump is line 368:
```sh
orchestrator.md)       echo "7570 7165" ;;  # +Phase-13 routing (...); measured 6759 B
security-nfr.md)       echo "4576 4331" ;;   # ← may need a documented Phase-14 bump for D-09
```
→ Planner: attempt terse-write first; if `wc -c security-nfr.md` ≥ 4331 (WARN) or ≥ 4576 (FAIL), bump this entry with a one-line `# +Phase-14 D-09 severity-map; measured <N> B` rationale comment (RESEARCH Open Q2). Either is acceptable — make it explicit.

**Constraints:** POSIX sh only (D-04 / carried-forward lock); portable grep flags only (`-r -n -l -E -F -q -v` — no `-P -z --include`, host grep is ugrep-aliased, line 51); extend not rebuild; preserve the Caveman carve-out (D-11); do NOT re-engineer the fence anchor.

---

### `scripts/check-foundation-guards.test.sh` (MODIFIED — RED fixtures; self-analog)

**Two-step extension** (RESEARCH Pitfall 3 — both steps required or the hermetic mirror breaks):

**1. Add the 3 new surfaces to `GUARD_INPUTS`** (current lines 57-78). The `mirror()` function (lines 83-93) copies every `GUARD_INPUTS` path into the throwaway tree; any file the extended `guard_voice` now reads MUST be in this list or `cp` fails / the guard finds it missing:
```sh
GUARD_INPUTS="AGENTS.md \
.claude/skills/grugops/SKILL.md \
... (17 roles, incl. security-nfr.md) ..."
# ← append: 15-security-audit.md, security-nfr-checklist.md, security-nfr-handoff.md
```

**2. Add one RED fixture per new surface** — mirror the existing `voice-marker` case (current lines 182-184):
```sh
M=$(mirror voice-marker)
printf '\ngrug smash the bug.\n' >> "$M/agent-factory/roles/security-nfr.md"
expect_fail "voice marker in clear-voice surface → nonzero + role path" "$M" "security-nfr.md"
```
→ Add three analogous cases planting a caveman marker into each new surface and asserting fail-red naming that file:
- `>> "$M/agent-factory/workflows/15-security-audit.md"` → `expect_fail … "15-security-audit.md"`
- `>> "$M/agent-factory/checklists/security-nfr-checklist.md"` → `expect_fail … "security-nfr-checklist.md"`
- `>> "$M/agent-factory/handoffs/security-nfr-handoff.md"` → `expect_fail … "security-nfr-handoff.md"`

**The `expect_fail` no-fabrication assertion to reuse** (current lines 104-111): nonzero exit AND output names the defect (case-insensitive grep). This is the contract — every guard must PROVE it can fail.

**The smoke + cmp-s tail stays** (lines 310-328): after extending, the smoke run (real guard over real tree) must still be GREEN — so the generated checklist + wf15 + handoff must be clean clear-voice at commit. The config-JSON `cmp -s` byte-identity case (lines 324-327) is unaffected (no config keys change — carried-forward lock).

**Optional SEC-02 freshness case** (RESEARCH Validation Architecture, Wave-0 gap): a `cmp -s` between the committed checklist and a temp regeneration proves no drift — mirror the existing `cmp -s` idiom (line 324). Planner decides whether it lives here or as a standalone check.

**Constraints:** POSIX sh; hermetic `$WORK` only (never mutate the real repo/$HOME); mirror the `voice-marker` shape exactly; every new surface needs BOTH a `GUARD_INPUTS` entry AND a RED fixture.

---

### `agent-factory/roles/orchestrator.md` (MODIFIED — register wf15; self-analog)

**TWO insertion points, both in this file** (carried-forward lock — both the classification list and the workflow map are inside orchestrator.md; the README map is a third, separate site).

**1. Classification list** (current lines 41-43 — the pipe-delimited request types):
```
   `greenfield-bootstrap` | `brownfield-bootstrap` | `idea-to-epics` | `epic-to-tickets` |
   `ticket-to-pr` | `quality-gate` | `uat` | `refinement` | `sprint-planning` | `daily-sweep` |
   `sprint-review` | `retro` | `release` | `incident` | `install` | `ui-build`
```
→ Append `| `security-audit`` to this list.

**2. Routing matrix** (current lines 51-67) already has the security line at line 59:
```
Need risk/security/compliance-> Security/NFR (and Compliance Officer if regime set)
```
→ This line exists; the new `security-audit` classification routes to the same Security/NFR role. May add a clarifying note (deep audit vs per-ticket check, D-06) but the routing target is unchanged.

**3. Workflow-map table** (current lines 93-109 — the classification→workflow-file table; note line 91 says it "must stay consistent with `agent-factory/README.md`"):
```markdown
| Classification | Workflow file (named, not inlined) |
|----------------|-------------------------------------|
| greenfield-bootstrap | `00-bootstrap-greenfield.md` |
...
| ui-build | `14-ui-design-to-build.md` |
```
→ Append one row: `| security-audit | `15-security-audit.md` |`. Do NOT renumber 00–14.

**Byte budget:** orchestrator.md is 6759 B vs `role_ceiling()` `"7570 7165"` (guard line 368, Phase-13 baseline) — ~400 B headroom to WARN. A one-row + one-list-token addition is well within budget; no bump needed (verify with `wc -c`).

**Constraints:** append only, no renumber; keep the orchestrator map and the README map consistent (line 91); register in BOTH this file's classification list AND its workflow-map table.

---

### `agent-factory/roles/security-nfr.md` (MODIFIED — D-09 content, TIGHT byte budget; self-analog)

**SHARPEST CONSTRAINT IN THE PHASE: 4326 B vs WARN 4331 / FAIL 4576** (~250 B FAIL headroom, already 5 B over WARN). Write the D-09 additions in the FEWEST tokens (grugops token-economy = sharper judgment per token, not more prose), OR bump `role_ceiling()` (see guard section above, RESEARCH Pitfall 1 / Open Q2).

**D-09 reuses the EXISTING "named owner" hard limit** (current line 44, verbatim — this is the home for the override mechanism):
```markdown
## Hard limits
Find real risk; do not gold-plate or add controls the change does not warrant. An accepted
risk needs a named owner — an unowned one is a finding nobody fixes. Report findings exactly
as observed ... mark anything unverified `UNKNOWN - verify`. Security and compliance findings
are written in clear language, never softened.
```
→ The D-09 severity override ("MAY override default severity with a stated reason + named owner") attaches to the existing "an accepted risk needs a named owner" sentence — minimal new bytes by extending what's there rather than adding a new section.

**The default severity map (D-09)** to state tersely somewhere clear-voice: **L1 fail → high, L2 fail → medium, L3 fail → low** (inverted on purpose — a missing baseline control is most dangerous). RESEARCH Pattern 4: severity vocab {high,medium,low} ⊂ `block_on` {none,low,medium,high} — consistent.

**Read-time level-filter note (D-05)** belongs near the checklist reference (current line 22):
```markdown
- `agent-factory/checklists/security-nfr-checklist.md` — the security/NFR gate checklist this
  role works through; `plans/nfr-catalog.md` — the NFR budgets to check performance and
  reliability against.
```
→ Add a terse note: filter the full checklist to `security.asvs_level` at read time (cumulative, keep `L ≤ level`); the file is NOT regenerated per dial.

**Caveman-fence is at lines 10-16** (` ```You are Security/NFR. … ``` `) — the carve-out the guard skips (D-11). ALL new D-09 content goes in CLEAR-voice sections (`## Hard limits`, `## Responsibilities`, `## Reads`) — written in clear professional voice (it IS scanned by `guard_voice`). Do NOT touch the caveman fence.

**Constraints:** tight byte budget (terse-or-bump); D-09 override reuses the existing named-owner hard limit; clear voice on all new content; do NOT add/rename config keys (read `security.asvs_level`/`security.block_on`, both already shipped); do NOT touch the caveman fence.

---

### `agent-factory/handoffs/security-nfr-handoff.md` (MODIFIED — add severity/level fields; self-analog)

**The "before" (current full file, 650 B)** — the universal header + the security-nfr-specific finding sections + `## Result`:
```markdown
---
kind: handoff
stage: security-nfr
---
# Handoff: security-nfr
... universal header (## Source / ## Goal / ## Scope / ## Risks / ## Trace updates / ...) ...
---
## Scope reviewed
## Threat notes
## Auth/permission
...
## Required fixes
## Accepted risks
## Result
PASS | PASS_WITH_RISKS | BLOCKED
```

**Pattern to extend** — the `## Result` enum block (current lines 40-41) and the `## Required fixes` / `## Accepted risks` sections (lines 38-39) are where D-09 severity/level fields attach. Add a severity tag (high/medium/low) + ASVS level (L1/L2/L3) + req-id to findings, and the named-owner override field for accepted risks (mirroring the role's hard limit). Keep the existing section names so anything that fills/reads this template stays compatible.

**Voice surface (D-10):** this handoff is now scanned by the extended `guard_voice` — keep all field labels + guidance in clear professional voice (it has no caveman fence; it is scanned whole). The frozen-handoffs validator (`validate-agent-factory.mjs` line 133, `security-nfr-handoff`) existence-checks it only — no section assertion — but keep the `kind: handoff` frontmatter.

**Constraints:** add severity/level/req-id + named-owner override fields; preserve existing section names (compatibility); clear voice (D-10, scanned whole); keep `kind: handoff` frontmatter.

---

## Shared Patterns

### Reference-don't-restate (cite siblings by filename)
**Source:** `agent-factory/workflows/14-ui-design-to-build.md` lines 26, 30.
**Apply to:** `15-security-audit.md` (cite `05-pr-quality-gate.md` by filename, never restate the gate loop, never write "§14").
```markdown
... live there — this workflow references that gate and does not restate it.
```

### Fail-closed stdlib-Node (try/catch every parse, reject non-object, exit nonzero)
**Source:** `scripts/validate-agent-factory.mjs` lines 67-73, 292-305, 532-541.
**Apply to:** `generate-asvs-checklist.mjs` (parse the vendored JSON in try/catch; row-count assert = 345; no partial write; `process.exit(1)` on any failure).

### Read-only / write-only-by-construction (FIXED literal paths)
**Source:** `scripts/validate-agent-factory.mjs` lines 37-40 ("every path is join(ROOT, <fixed literal rel>); no write path is ever derived from file content").
**Apply to:** `generate-asvs-checklist.mjs` — SRC + OUT are fixed literals; never accept a path from argv/env (RESEARCH Security V5/V13).

### No-fabrication on a security surface
**Source:** `agent-factory/roles/security-nfr.md` line 44 ("mark anything unverified `UNKNOWN - verify`"); `validate-agent-factory.mjs` header ("a missing or garbled file becomes a finding, never an unhandled throw").
**Apply to:** the generator (copy `req_description` verbatim, never invent), the checklist (every tick cites evidence or `UNKNOWN - verify`), the guard (must PROVE it can fail via the RED fixture).

### Mechanical voice-discipline guard + matching RED fixture
**Source:** `scripts/check-foundation-guards.sh` `guard_voice` (lines 206-264, fence-strip awk lines 230-236, markers line 204); `scripts/check-foundation-guards.test.sh` `voice-marker` case (lines 182-184) + `GUARD_INPUTS` (lines 57-78) + `expect_fail` (lines 104-111).
**Apply to:** every D-10 surface — extend `VOICE_FILES` AND `GUARD_INPUTS`, add one RED fixture each; preserve the Caveman-fence carve-out (D-11) for `security-nfr.md` only.

### Documented per-file byte-ceiling bump (when terse isn't enough)
**Source:** `scripts/check-foundation-guards.sh` `role_ceiling()` line 368 (orchestrator's Phase-13 bump with inline `# +Phase-13 routing … measured 6759 B` rationale).
**Apply to:** `security-nfr.md` IF the D-09 content trips WARN/FAIL — bump line 369 with a one-line Phase-14 rationale (RESEARCH Open Q2). Prefer terse-write first.

### Config dial = read-time filter, lean default when absent
**Source:** Phase-10 contract (RESEARCH lines 41, 260-265); `validate-agent-factory.mjs` lines 329-373 already enum-validate `security.asvs_level` (L1/L2/L3) + `security.block_on` (none/low/medium/high), presence-guarded.
**Apply to:** wf15 + the role read `asvs_level` at audit time (cumulative `L ≤ level`); `05-pr-quality-gate.md` reads `block_on`. **Do NOT add/rename any `security.*` key** — they ship byte-identical across all three config files (carried-forward lock; the `.test.sh` `cmp -s` at line 324 enforces JSON↔JSON identity).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/asvs/asvs-5.0.0.flat.json` | vendored data | data-at-rest | A pinned external data blob, not code. No transform/pattern to copy — vendor verbatim from `OWASP/ASVS@5cf9b032…` at `5.0/docs_en/`. Integrity = the pinned SHA in the provenance header (D-02). |

**Partial-precedent note:** the **provenance-header** pattern (`<!-- GENERATED — do not hand-edit … -->`) is NEW to this repo — no prior `generated — do not hand-edit` precedent exists (RESEARCH line 252, verified by grep). Use the RESEARCH-supplied form (lines 254-257). The future Phase-17 browsable-docs catalog will be a sibling generated artifact — keep the generator pattern clean, but do NOT build for Phase 17 now.

---

## Metadata

**Analog search scope:** `agent-factory/workflows/`, `agent-factory/roles/`, `agent-factory/checklists/`, `agent-factory/handoffs/`, `agent-factory/config/`, `scripts/`, `agent-factory/README.md`.
**Files scanned (read in full or targeted):** `14-ui-design-to-build.md`, `validate-agent-factory.mjs`, `security-nfr-checklist.md`, `check-foundation-guards.sh`, `check-foundation-guards.test.sh`, `security-nfr.md`, `security-nfr-handoff.md`, `orchestrator.md` (lines 1-130), `05-pr-quality-gate.md` (targeted), `README.md` (targeted). Byte sizes verified via `wc -c`.
**Pattern extraction date:** 2026-06-13
**Carried-forward locks honored:** POSIX-sh / stdlib-Node only (no TS); no add/rename config keys; no renumber 00–14; cite `05-pr-quality-gate.md` by filename never "§14".

## PATTERN MAPPING COMPLETE

**Phase:** 14 - security-audit-owasp-asvs-checklist-re-anchor
**Files classified:** 9
**Analogs found:** 8 / 9

### Coverage
- Files with exact/strong analog: 2 (workflow 15 ← wf14; generator ← validator)
- Files with self-analog (extend/regenerate in place): 6 (checklist, guard.sh, guard.test.sh, orchestrator, security-nfr role, handoff)
- Files with no analog: 1 (vendored `flat.json` data blob)

### Key Patterns Identified
- **Reference-don't-restate** — wf15 copies wf14's skeleton and cites `05-pr-quality-gate.md` by filename (lines 26/30 verbatim), never restates the gate loop, never writes "§14".
- **Fail-closed stdlib-Node generator** — `generate-asvs-checklist.mjs` mirrors `validate-agent-factory.mjs` (try/catch parse, reject non-object, fixed literal SRC/OUT paths, row-count assert 345, `process.exit(1)` on failure, zero deps, no package.json).
- **Extend-not-rebuild the voice guard** — add 3 surfaces to `VOICE_FILES` + `GUARD_INPUTS` + one RED `expect_fail` each, preserving the Caveman-fence carve-out (D-11) on `security-nfr.md` only; do NOT re-engineer the fence anchor.
- **Generated artifact stays drop-in compatible** — same path, `kind: checklist` frontmatter, all references survive (D-04); provenance header is a NEW repo pattern.
- **Two registration sites in orchestrator.md** (classification list line 43 + workflow-map table lines 93-109) plus the README map — append one `security-audit | 15-security-audit.md` row, no renumber.
- **Tight byte budget** on `security-nfr.md` (4326 B vs WARN 4331 / FAIL 4576) — terse-write the D-09 severity map first (reuse the existing named-owner hard limit, line 44), bump `role_ceiling()` line 369 with a Phase-13-style rationale comment only if it trips.

### File Created
`.planning/phases/14-security-audit-owasp-asvs-checklist-re-anchor/14-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Each new/modified file has its analog, concrete excerpts with line numbers, and the constraints (byte budgets, fence carve-out, frozen config keys, no-renumber) the planner must honor. Planner can reference these directly in PLAN.md action sections.
