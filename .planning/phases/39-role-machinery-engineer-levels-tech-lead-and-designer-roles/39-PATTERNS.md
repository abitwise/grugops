# Phase 39: Role machinery - Pattern Map

**Mapped:** 2026-10-29
**Files analyzed:** 22 (new + modified; regenerated artifacts listed separately)
**Analogs found:** 21 / 22

All analog paths below are git-tracked (verified with `git ls-files agent-factory/roles` etc.). RESEARCH.md § Derived-Set Census holds the full file:line list of count pins; this file maps patterns only.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `agent-factory/roles/tech-lead.md` (NEW) | role prompt | request-response (reads notes, publishes decision note) | `agent-factory/roles/architect-design.md` | exact |
| `agent-factory/roles/designer.md` (NEW) | role prompt | request-response (publishes decision/artifact-ref notes) | `agent-factory/roles/architect-design.md` (+ `frontend-ui.md` for UI vocabulary) | exact |
| `agent-factory/checklists/complexity-rubric.md` (NEW) | checklist | transform (score -> level) | `agent-factory/checklists/definition-of-ready.md` | exact |
| `agent-factory/checklists/00-index.md` | index | config | itself (Lean tier table) | exact |
| `agent-factory/roles/software-engineer.md` | role prompt | + `levels:` frontmatter, short `## Levels` | `architect-design.md` frontmatter shape | exact |
| `agent-factory/roles/frontend-ui.md` | role prompt | reads Designer notes | itself | self |
| `agent-factory/roles/orchestrator.md` | role prompt | routing rewrite, must net-shrink | itself | self |
| `agent-factory/workflows/04-ticket-to-pr.md` | workflow | event-driven steps | itself; checkpoint tag precedent `16-context-read-write.md:47` | self |
| `agent-factory/workflows/14-ui-design-to-build.md` | workflow | event-driven steps | itself | self |
| `agent-factory/packaging/subagent.frontmatter.md` | template doc | count-free prose | itself | self |
| `agent-factory/config/factory.config.md` | config doc | config | itself (models sections) | self |
| `scripts/kit-model.ts` | utility (set authority) | transform (fs -> names) | existing `listRoles()` / `ROLE_COUNT` in same file | exact |
| `scripts/model-tiers.ts` | resolver | transform | `TIERED` table (line 1017) / `RoleTier` (193-207) | exact |
| `scripts/generate-role-adapters.ts` | generator | file-I/O batch | itself, lines 370-380, 497-500, 573 | self |
| `scripts/canonical-frontmatter.ts` | validator | transform | `CANONICAL_SCHEMA` 196-208, `admit()` 573-576 | self |
| `scripts/check-foundation-guards.ts` | guard | batch | `roleCeiling` switch 3421-3460; KIT-03 3651-3673 | self |
| `scripts/adapters-freshness.ts` | guard | batch | lines 322, 390, 614-615 | self |
| `scripts/adapter-byte-baseline.test.ts` | test | batch | itself (pin line 82, counts 356/433/455) | self |
| `scripts/admission-protocol-docs.test.ts` | test | batch | derive `ROLE_BASENAMES` (line 29) from `listRoles()` | role-match |
| `scripts/validate-agent-factory.ts` | validator | batch | `CHECKLISTS` list line 351 | self |
| `scripts/check-imperative-lexicon.ts`, `check-banned-claims.ts`, `checkpoints.ts` | guard count pins | batch | Census A3-A7 | self |
| `docs/audit/28-disposition-register.md`, `docs/audit/29-style-dispositions/39-*.md` | audit record | file | existing register rows; 33.1-08 disposition files | role-match |
| install-side stale-adapter report (Open Question 3) | installer | file-I/O | `install/uninstall.ts` `reportUnrecordedKitPaths` | partial |

## Pattern Assignments

### `agent-factory/roles/tech-lead.md` and `designer.md` (role prompt)

**Analog:** `agent-factory/roles/architect-design.md` (whole file, ~3.8 KB). Copy its skeleton exactly; draft each at or below ~3,000 B (Pitfall 4).

**Frontmatter** (lines 1-5):
```
---
kind: role
tier: core
capabilities: read edit shell web
---
# Role: Architect/Design
```
Capabilities from closed vocabulary `read edit shell web plan admit`; never `admit` (coordinator-only). No `skills:` value (D-29).

**Section order** (required by `validate-agent-factory.ts:369-378` + generator `:446-451`): `## One job`, `## Caveman prompt` (fenced, >= 2 lexicon terms, no articles/copulas/modals), `## Reads`, `## Activates when`, `## Responsibilities`, `## Output (file + format)`, `## Board moves (...)`, `## Trace updates`, `## Hard limits`.

**Caveman fence** (lines 11-16):
```
You Architect.
You draw seam where change come. You pick rock, not shiny rock.
Gold plate rot before it pay. Grug no gold plate.
```

**Reads first line** (copy verbatim, swap nothing):
```
- `.grugops/factory.config.json` **first** — `mode` / `cadence` / ... With no config file present, this role runs lean on the documented defaults in `agent-factory/README.md`.
```

**Output via notes** (Output section): "published as typed notes per Workflow 16 ... as `decision`/`observation`/`artifact-ref` notes — each carrying the trace ids on its `refs` field". Tech Lead: `decision` note with F1-F6 scores, sum, level, adapter name, dev tasks + `## Tech Lead plan` in ticket body. Designer: `decision`/`artifact-ref` notes only (D-24).

**Board moves analog:** "the Architect/Design role owns the `In Design` exit". Tech Lead: ticket stays `Ready for Dev` (D-08); owns the exit of dev-raised `## Blocked` (D-19). Designer: no column.

**Footer** (copy verbatim; exactly one WF16 reference, guard-checked):
```
Context I/O: read and write the shared context per `agent-factory/workflows/16-context-read-write.md` — that workflow is the single source; this role references it and does not restate it.
Compaction: compact the local trajectory and promote per `agent-factory/workflows/18-context-compaction.md` — single source; this role references it and does not restate it.

Follow the 12 coding rules in `AGENTS.md`.
```
Tech Lead points to `checklists/complexity-rubric.md` rather than restating the rubric (D-12).

---

### `agent-factory/checklists/complexity-rubric.md` (checklist)

**Analog:** `agent-factory/checklists/definition-of-ready.md`
```
---
kind: checklist
tier: lean
---
# Definition of Ready

A ticket is ready to start when every check below holds. The Orchestrator applies this
checklist before handing a ticket to engineering; ...

- problem clear — the user, the pain, and the value are stated, not assumed
```
Use `tier: lean` (Tech Lead runs in both modes). Body: F1-F6 table (0/1/2), mapping, overrides, LOW-confidence label. F3=2 must list test integrity explicitly (Pitfall 9). Sentences <= 20 words procedural / 25 descriptive (lexicon gate, now governs this file: `GOVERNED_CORPUS_COUNT` 48 -> 49).

### `agent-factory/checklists/00-index.md`
Add a row to the `## Lean tier` table in the same shape:
```
| `definition-of-ready.md` | before a ticket starts (Definition of Ready) |
```
Also add `complexity-rubric` to `CHECKLISTS` in `scripts/validate-agent-factory.ts:351`.

---

### `scripts/model-tiers.ts` — `LEVELS` table and new `TIERED` rows

**Analog:** `TIERED` at line 1017:
```ts
export const TIERED: readonly RoleTier[] = [
  {
    stem: "agents-md-scribe",
    alias: "sonnet",
    rationale:
      "Writes the AGENTS.md substrate every host CLI reads. The work is transcription against a " +
      "stated shape rather than open judgment, ...",
    effortRationale:
      "Transcribes a stated shape into the substrate file every host reads. Moderate reasoning " +
      "depth suits work ...",
  },
```
- Add `tech-lead` (opus) and `designer` rows in alphabetical order; remove `software-engineer` row (line ~1186) per RESEARCH Pattern 3.
- `LEVELS`: same string-concatenation rationale style, plus explicit `effort` field (RESEARCH Code Examples). No digits, no cost/speed words (`tieredTableRefusals` 1265-1340 must run over `LEVELS`).
- `MODEL_TIERS_COUNT = ROLE_COUNT` (1244) becomes a derived preset-governed count; add `LEVEL_COUNT = 3`.
- Legal config keys: pass role stems ∪ level adapter stems to `readModelsBlock` (its `validStems.has(key)` check is the whole change).
- Export one zero-config map used by `adapters-freshness.ts` (322/390/614-615) and guard degrade targets.

### `scripts/kit-model.ts` — `listAgentAdapterNames()`
Same module as `ROLE_COUNT` (line 107) and `SPAWN_GRANT_SCAN_COUNT` (183). Read `levels:` with `parseFrontmatter` from `./frontmatter.js` (no local regex; D-50 IN-05). Throw on duplicate key / empty / duplicate token / non-kebab / case-folded collision, matching the generator's collision message style:
```ts
fail(`${file}: adapter name "${name}" collides with the one produced by ${claimed} — two roles cannot share one adapter file (names are compared case-insensitively: ...)`)
```
(generate-role-adapters.ts ~376-381). Must not import model-tiers (cycle). Moves `board-readonly.test.ts` closure table (3246-3256) and hook manifest hash.

### `scripts/generate-role-adapters.ts` — 1:N
Replace at line 375:
```ts
const stem = stemOf(file);
const name = `${AGENT_PREFIX}${stem}`;
const folded = name.toLowerCase();
const claimed = seenNames.get(folded);
```
with a loop over the role's levels (or one iteration). Keep the grant derivation `adapters.filter((a) => !a.isCoordinator).map((a) => a.name).sort()` (497-500) and the conditional `if (a.effort !== "inherit") lines.push(\`effort: ${a.effort}\`);` (573). Level description must differ per adapter. Never emit `skills:` (D-28). `git rm .claude/agents/grugops-software-engineer.md`.

### `scripts/canonical-frontmatter.ts`
Widen `CANONICAL_SCHEMA` (196-208) with `capabilities`, `levels`, `skills` as a recorded decision; export `ADAPTER_SCHEMA` = today's 11 keys as the `admit()` default (narrowing at 573-576), plus `ROLE_SCHEMA`. Grammar: space-separated kebab tokens (flow lists refused `flow-collection`, `:` refused). Test: two-sided key-union test `canonical-frontmatter.test.ts:233-288` gains role corpus + `skills` fixture.

### `scripts/check-foundation-guards.ts` — `roleCeiling`
Analog (3421-3445):
```ts
function roleCeiling(base: string): string {
  switch (base) {
    case "orchestrator.md":
      return "7570 7165"; // +Phase-13 routing; measured 6759 B
    case "architect-design.md":
      return "4243 4016"; // +Phase-22 WF18 pointer (baseline 3788 B, +12% / +6%)
```
Convert to exported `ROLE_CEILINGS` record, same "FAIL WARN" strings and comments; new rows measured, +12 % / +6 %; assert keys == `listRoles()` both ways. Switch KIT-03 (3651-3673) and `roleStemOf` (3658) to `listAgentAdapterNames()`.

### `scripts/adapter-byte-baseline.test.ts`
Self-analog: move pin at line 82 by recorded decision; replace `toBe(ROLE_COUNT)` (356/433/455) with derived adapter count; replace "no `effort:` line" with two-sided "exactly the level adapters carry D-14 effort". Literal D-14 values in the test (second opinion), not `LEVELS`.

### Workflows `04-ticket-to-pr.md`, `14-ui-design-to-build.md`
Self-analog. Step bullets verb-led, <= 20 words, no modals. Human-stop bullet reuses `checkpoint: escalate_unadjudicable_result` as in `16-context-read-write.md:47`; moves `WORKFLOW_STOP_BULLET_COUNT` (checkpoints.ts:320) and `CHECKPOINT_SITE_COUNTS`/`RECORDED_TOTAL_SITES` (750-774), then `generate:hook-manifest`.

### `orchestrator.md`, `software-engineer.md`, `frontend-ui.md`
Self-analogs under tight ceilings: orchestrator 7,359 B vs FAIL 7,570 (net-shrink); software-engineer 3,639 vs 3,906; frontend-ui 3,738 vs WARN 3,757. `## Levels` = a few lines pointing to `complexity-rubric.md` and WF04. Frontmatter gains `levels: junior mid senior` in the `capabilities` style.

## Shared Patterns

### Derived sets, two-sided pins
**Source:** `scripts/kit-model.ts` (`ROLE_COUNT`, `listRoles()`). **Apply to:** every count/name list in Census A-E. Move literals once by measured run; never loosen.

### Rationale rows
**Source:** `scripts/model-tiers.ts:1017` `TIERED`. **Apply to:** `LEVELS`, new `TIERED` rows. Quality arguments only.

### Role skeleton + WF16/WF18 footer
**Source:** `agent-factory/roles/architect-design.md`. **Apply to:** both new roles.

### Fail-closed error style
**Source:** `fail(\`${file}: ...\`)` in `generate-role-adapters.ts`. **Apply to:** levels derivation, generator expansion.

### Regeneration order
`npm run build` -> `generate:adapters` -> `generate:catalog` -> `generate:hook-manifest` -> (`generate:safety-surface`, `generate:guarantees` if moved) -> freshness gates.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| stale-adapter report in `install/install.ts` | installer | file-I/O | No install-side scan of ledger-recorded adapters the kit no longer ships; closest is `reportUnrecordedKitPaths` in `install/uninstall.ts` (partial). Deletion is an open decision (RESEARCH OQ3). |

## Metadata

**Analog search scope:** `agent-factory/roles`, `agent-factory/checklists`, `scripts/`
**Files scanned:** ~8 read directly, plus RESEARCH.md census citations
**Pattern extraction date:** 2026-10-29
