# Phase 6: Validation, Brand & Dogfood - Pattern Map

**Mapped:** 2026-06-03
**Files analyzed:** 14 net-new deliverable files/dirs (validator, self-test harness + fixtures, 5 examples, 4 brand/legal docs, 5 SVGs)
**Analogs found:** 9 with strong analog / 14 (5 SVGs have NO code analog by design)

> All Phase-6 files are **additive** — they create new top-level paths and read the frozen Phase 1–5 tree read-only. No source under `agent-factory/`, `hooks/`, `install/`, `plans/`, `.claude*/`, or `docs/initial/` is modified. The validator is the only executable; everything else is markdown/SVG.

## File Classification

| New file | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `scripts/validate-agent-factory.mjs` | utility (Node ESM CLI) | file-I/O + transform (read tree → findings → exit code) | `install/install.mjs` (primary) + `hooks/guard.mjs` (secondary) | role-match (exact idiom: stdlib-only ESM, no `package.json`) |
| `scripts/validate.test.sh` | test (POSIX sh harness) | request-response (run validator on fixture → assert exit code + finding text) | `hooks/guard.test.sh` (primary) + `install/install.test.sh` (secondary) | exact (same `pass()`/`fail()`/`ALL CHECKS PASSED`/`mktemp -d`+`trap` idiom) |
| `scripts/fixtures/good/` | test fixture (minimal valid tree) | file-I/O (read-only input to validator) | `install/install.test.sh` `make_fixture()` (lines 38–44) | role-match (tiny throwaway tree pattern) |
| `scripts/fixtures/bad-*/` | test fixture (one-mutation-each) | file-I/O | `.planning/.../04/check-structure.sh` assertion targets | role-match (each BAD = GOOD minus one invariant) |
| `examples/01-greenfield-bootstrap.md` | doc (narration, REAL capture) | event-driven narration | `agent-factory/workflows/00-bootstrap-greenfield.md` | role-match (renders that flow) |
| `examples/02-brownfield-bootstrap.md` | doc (narration, ILLUSTRATIVE) | event-driven narration | `agent-factory/workflows/01-bootstrap-brownfield.md` | role-match |
| `examples/03-ticket-to-pr.md` | doc (narration, REAL = dogfood report) | event-driven narration | `agent-factory/workflows/04-ticket-to-pr.md` + `05-pr-quality-gate.md` | role-match |
| `examples/04-sprint-cycle.md` | doc (narration, ILLUSTRATIVE) | event-driven narration | `agent-factory/workflows/07→11` (+ `plans/board.md` headings, `plans/metrics.md`) | role-match |
| `examples/05-release-run.md` | doc (narration, ILLUSTRATIVE) | event-driven narration | `agent-factory/workflows/12-release.md` (+ `plans/traceability.md` row shape) | role-match |
| `README.md` | doc (brand/public face) | static | `agent-factory/README.md` (tone/structure; root README *links to* it, D-51) + brand manual §8.6/§10.4 (content source) | role-match |
| `NOTICE` | doc (legal, verbatim) | static | brand manual §10.4-C (content source — no in-repo prose analog) | content-source only |
| `CONTRIBUTING.md` | doc (legal/contributor rules, verbatim) | static | brand manual §10.3 (content source) | content-source only |
| `docs/faq.md` | doc (FAQ, verbatim) | static | brand manual §8.8 (content source); `docs/` dir already exists | content-source only |
| `brand/wordmark*.svg` + `brand/icon.svg` | static asset (SVG XML) | static | **NO code analog in repo** — source is `docs/initial/grugops_brand_manual.md` §6.3/§6.4 | NO ANALOG (see "No Analog Found") |

---

## Pattern Assignments

### `scripts/validate-agent-factory.mjs` (utility, file-I/O + transform)

**Primary analog:** `install/install.mjs` — read first. **Secondary:** `hooks/guard.mjs` (for the fail-closed `JSON.parse`-in-try/catch posture).

**Read first:** `install/install.mjs:1-40`, `install/install.mjs:84-90`, `install/install.mjs:147-188`; `hooks/guard.mjs:83-133`.

**Imports / repo-root resolution pattern** — copy from `install/install.mjs:23-40`. The validator needs the `dirname(fileURLToPath(import.meta.url))` idiom so it self-validates grugops's tree regardless of cwd, with an env-overridable root so the harness can point it at a fixture (mirrors `GRUGOPS_SRC`/`TARGET`):
```javascript
// derived from install.mjs:33-40 — env-overridable root + script-relative default
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));         // scripts/
const ROOT = process.env.VALIDATE_ROOT
  ? resolve(process.env.VALIDATE_ROOT)                             // harness points at a fixture
  : resolve(SCRIPT_DIR, "..");                                    // default: repo root (D-42 self-validate)
const read   = (rel) => readFileSync(join(ROOT, rel), "utf8");
const exists = (rel) => existsSync(join(ROOT, rel));
const list   = (rel) => (exists(rel) ? readdirSync(join(ROOT, rel)) : []);
```

**Safe-read helper pattern (try/catch → false, never throw)** — copy from `install/install.mjs:84-90` (`sameContent`). The validator wraps every read so a missing/garbled file becomes a *finding*, not a crash:
```javascript
// install.mjs:84-90 idiom — never let a read throw
const safeRead = (rel) => { try { return readFileSync(join(ROOT, rel), "utf8"); } catch { return null; } };
```

**Fail-closed `JSON.parse` pattern** — copy from `install/install.mjs:163-169` (mergeGemini) and `hooks/guard.mjs:100-108`. A parse failure of `factory.config.json` / `plugin.json` is itself an ERROR finding (D-44 ERROR; guard.mjs's fail-closed posture). Idiom from `install.mjs:164-169`:
```javascript
let json;
try { json = JSON.parse(read("agent-factory/config/factory.config.json")); }
catch { err("factory.config.json: not valid JSON"); }
// on success assert mode/cadence/autonomy present (non-empty strings)
```
Verified targets present: `factory.config.json` has `"mode": "lean"`, `"cadence": "kanban"`, `"autonomy": "pr"` (lines 3–5); `.claude-plugin/plugin.json` has `"name": "grugops"` (line 2). `[VERIFIED: grep]`

**Report-rendering pattern** — mirror `install/install.mjs:70` (`report` helper) into a two-tier collector. The house render is left-padded label + message; adapt to ERROR/WARNING (D-44):
```javascript
// install.mjs:70 report() → two-tier errors[]/warnings[] collector (D-44)
const errors = [], warnings = [];
const STRICT = process.argv.includes("--strict");           // cf. guard.mjs argv-style flags
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
// ...checks push into err()/warn()...
for (const e of errors)   console.error(`  ERROR    ${e}`);
for (const w of warnings) console.error(`  WARNING  ${w}`);
const failed = errors.length + (STRICT ? warnings.length : 0);
if (failed === 0) { console.log("ALL CHECKS PASSED"); process.exit(0); }
process.exit(1);
```
> Note: `--strict` is read off `process.argv` (guard.mjs reads its trigger off stdin JSON, install.mjs off `process.env` — argv is the natural flag channel here; the *posture* of explicit env/argv flags is the shared idiom).

**Section-presence check (PREFIX match, never exact, never uniqueness)** — this is the load-bearing correctness rule. The validator must match `^## Output` (not `## Output (file + format)`) and assert presence ≥1 (the duplicate `## Scope`/`## Risks` in handoffs must not false-fail; PROJECT.md line 96). The exact section-name lists and the prefix-vs-exact table are in `06-RESEARCH.md` "Validator Assertion Contract" §2–3. The frozen name lists to reuse verbatim are in the Phase-4 harness:
- 14 workflow names: `.planning/.../04/check-structure.sh:33` (`WORKFLOWS=...`)
- 16 handoff names: `.planning/.../04/check-structure.sh:48` (`FROZEN_HANDOFFS=...`)
- 10 workflow section headings (use the 9 §18-named ones, prefix-matched): `.planning/.../04/check-structure.sh:36-45` (`SECTION_HEADINGS`)

**Vacuous-on-empty ticket loop (D-43)** — iterate `plans/tickets/*.md`; the dir holds only `.gitkeep` `[VERIFIED: ls -A plans/tickets]`, so zero iterations → zero violations → green on a fresh install. The board↔ticket contract the loop checks is documented at `plans/board.md:33-45` (`status:` = kebab-case of `column:`); board column headings are `^## <Column> (WIP ...)` at `plans/board.md:76-98` `[VERIFIED]`. Front-matter extraction is a ~10-line regex (`/^column:\s*(.+)$/m`) — **NO yaml/gray-matter dep** (would force a forbidden `package.json`).

**Verified always-on assertion targets** (codify these — all present on 2026-06-03 `[VERIFIED: grep/ls]`):
- board columns: `plans/board.md:76-98` (12 `## … (WIP …)` headings)
- traceability header: `plans/traceability.md:36-37` (`| Ticket | Title | Epic | … | Status |`)
- config keys: `agent-factory/config/factory.config.json:3-5`
- plugin name: `.claude-plugin/plugin.json:2`

**Security posture** (V5/V12 in research): read-only by construction — never derive a write path from file content; wrap every `JSON.parse`/read in try/catch (DoS-of-the-gate mitigation, mirrors guard.mjs fail-closed).

---

### `scripts/validate.test.sh` (test, POSIX sh harness)

**Primary analog:** `hooks/guard.test.sh` — read first. **Secondary:** `install/install.test.sh` (for `mktemp -d` + `trap cleanup` temp-fixture isolation and the env-override invocation).

**Read first:** `hooks/guard.test.sh:16-54`, `hooks/guard.test.sh:118-139`; `install/install.test.sh:18-35`.

**Header + `pass()`/`fail()`/`FAILS` counter** — copy verbatim shape from `hooks/guard.test.sh:16-26`:
```sh
#!/usr/bin/env sh
set -eu
VALIDATOR="scripts/validate-agent-factory.mjs"
FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
command -v node >/dev/null 2>&1 || { fail "node on PATH"; printf '1 CHECK(S) FAILED\n'; exit 1; }
```

**Run + assert-on-exit-code + assert-on-finding-text pattern** — adapt `guard.test.sh`'s `run`/`expect_deny`/`expect_allow` (lines 30–54) to "run validator on a fixture, capture rc AND stdout, grep the finding." The capture idiom that survives `set -eu` is `out=$(cmd) && rc=0 || rc=$?` (cf. `guard.test.sh:119` `_out=$(...); _rc=$?`):
```sh
# self-validate grugops's own tree (D-42) — must be green
if node "$VALIDATOR" >/dev/null 2>&1; then pass "validator GREEN on own tree"
else fail "validator RED on own tree (should be green)"; fi

# GOOD fixture → exit 0
if VALIDATE_ROOT=scripts/fixtures/good node "$VALIDATOR" >/dev/null 2>&1; then pass "GOOD → 0"
else fail "GOOD fixture did not pass"; fi

# BAD fixture → nonzero AND correct finding text (cf. guard.test.sh expect_deny grep)
out=$(VALIDATE_ROOT=scripts/fixtures/bad-plugin-noname node "$VALIDATOR" 2>&1) && rc=0 || rc=$?
if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -qi 'name'; then
  pass "BAD (plugin.json no name) → nonzero + correct finding"
else fail "BAD (plugin.json no name) wrong (rc=$rc)"; fi
```

**Env-override invocation** — `VALIDATE_ROOT=scripts/fixtures/...` mirrors `install.test.sh`'s `GRUGOPS_SRC=... TARGET=... sh ...` (lines 62, 100, 128). Lets one validator script run against many fixture trees without copying it.

**Result footer (`ALL CHECKS PASSED` / `N CHECK(S) FAILED` + exit 0/1)** — copy verbatim from `hooks/guard.test.sh:133-139` (identical block also at `install/install.test.sh:238-244`):
```sh
if [ "$FAILS" -eq 0 ]; then printf 'ALL CHECKS PASSED\n'; exit 0
else printf '%s CHECK(S) FAILED\n' "$FAILS"; exit 1; fi
```

> If the harness needs throwaway trees rather than committed fixtures, reuse `install.test.sh:31-34`'s `WORK=$(mktemp -d); cleanup(){ rm -rf -- "$WORK"; }; trap cleanup EXIT INT TERM`. The simpler path (and what D-45 implies) is committed `scripts/fixtures/good` + `scripts/fixtures/bad-*` trees referenced by `VALIDATE_ROOT`.

---

### `scripts/fixtures/good/` and `scripts/fixtures/bad-*/` (test fixtures, file-I/O)

**Analog:** `install/install.test.sh:38-44` (`make_fixture` — the "minimal fake tree" idiom) for *shape*; `.planning/.../04/check-structure.sh` (V-01..V-13) for *which invariants each BAD tree violates*.

**GOOD tree** = smallest tree passing every always-on check: a couple role `*.md` (each carrying the 8 `## ` sections — prefix names per research §2), a couple workflow `*.md` (9 sections), a valid `factory.config.json` (`mode`/`cadence`/`autonomy`), `plans/board.md` with `## <Col> (WIP …)` headings, `plans/traceability.md` header row, `agent-factory/packaging/adapters.md`, `.claude-plugin/plugin.json` with a `name`, and **zero `plans/tickets/*.md`** (ticket checks vacuous, D-43).

**BAD trees** = GOOD with exactly one mutation each (each must exit ≠0 + emit a finding naming the defect):
| Fixture | Mutation | Expected finding contains |
|---------|----------|---------------------------|
| `bad-role-missing-section` | a role file drops `## Hard limits` | `Hard limits` / `missing required section` |
| `bad-config-no-mode` | `factory.config.json` lacks `mode` | `mode` |
| `bad-plugin-noname` | `plugin.json` lacks `name` | `name` |
| `bad-ticket-mismatch` | a ticket whose `status:` ≠ kebab(`column:`) | `status` / `column` |
| (optional, `--strict`) `warn-only` | a ticket with no traceability row | passes bare, fails under `--strict` |

> Each BAD fixture proves the validator *can fail* (D-45 / no-fabrication). The `--strict` warning-promotion case wants a warning-only fixture (e.g. missing traceability row) that exits 0 bare and ≠0 with `--strict`.

---

### `examples/01..05-*.md` (docs, event-driven narration)

**Analog (per file):** the frozen workflow body the example renders. Read first the matching workflow, then narrate `input → Orchestrator decision/routing → board moves → handoffs (representative snippets) → trace/metrics line` (D-48 structure).

| Example | Read-first workflow analog(s) | Real/Illustrative | Banner (D-47) |
|---------|-------------------------------|-------------------|---------------|
| `01-greenfield-bootstrap.md` | `agent-factory/workflows/00-bootstrap-greenfield.md` | **REAL** (dogfood capture) | "Real run — captured 2026-06-03" |
| `02-brownfield-bootstrap.md` | `agent-factory/workflows/01-bootstrap-brownfield.md` | ILLUSTRATIVE | "Illustrative run — expected output, not a captured session" + `ABC-001` placeholders |
| `03-ticket-to-pr.md` | `agent-factory/workflows/04-ticket-to-pr.md` + `05-pr-quality-gate.md` | **REAL = dogfood report** | "Real run — captured 2026-06-03"; live-CC checks marked **"pending human"** |
| `04-sprint-cycle.md` | `agent-factory/workflows/07..11-*.md` | ILLUSTRATIVE | banner + board snapshots + velocity line |
| `05-release-run.md` | `agent-factory/workflows/12-release.md` | ILLUSTRATIVE | banner + `REL-0007` placeholder + completed traceability rows |

**Concrete renders to copy from frozen sources:**
- Board-move sentence shape: `04-ticket-to-pr.md:30-31` — `Ready for Dev -> In Development -> In Review (-> In Security/NFR)`.
- Board-snapshot headings (use the REAL column names verbatim): `plans/board.md:76-98` — e.g. `## In Development (WIP 1/3)`.
- Handoff filenames cited per flow (never invent): `04-ticket-to-pr.md:33-34` — `implementation-handoff.md`, `qe-handoff.md`, `security-nfr-handoff.md`.
- Gate terminal token for the verdict: `READY_FOR_HUMAN_REVIEW` (lives only in `05-pr-quality-gate.md`).
- Traceability row shape: `plans/traceability.md:36-37` header → render rows as `| ABC-012 | … | Done |`.
- Metrics line vocabulary: `04-ticket-to-pr.md:39-40` (`Cycle time`, `WIP`) → `plans/metrics.md` for Throughput/Velocity.

**Hard rule (D-49):** every example renders `/grugops "<request>"` (dash standalone) and `/grugops:<op>` (plugin colon where install is discussed) — **never literal `/grug`**. Grep new files: `! grep -rE '/grug([^o]|$)' examples/`.

---

### `README.md` (doc, brand/public face)

**Tone/structure analog:** `agent-factory/README.md` (read first — the internal start-here the root README *links to* per D-51; it stays **untouched**). **Content source:** brand manual ready-to-paste blocks (verbatim + `/grug`→`/grugops` swap).

**Read first:** `agent-factory/README.md:1-30` (opener + start-here tone); `docs/initial/grugops_brand_manual.md:375-405` (§8.6 hero), `:532+` (§10.4-A/B Acknowledgements + non-affiliation).

**Hero block** — copy brand manual §8.6 (anchor `docs/initial/grugops_brand_manual.md:375`), apply D-49 swap. The reconciled block is already rendered in `06-RESEARCH.md` "README hero (§8.6) — RECONCILED" (lines 511-528): clear-voice opener → `> grug keep it simple.` wink, install line `sh install/install.sh` then `/grugops "bootstrap this repo and propose safe first tickets"`.

**Acknowledgements + non-affiliation footer** — copy verbatim from §10.4-A/B (`grugops_brand_manual.md:532+`), rendered in `06-RESEARCH.md:530-542`. grugbrain.dev / Carson Gross attribution + non-affiliation footer ship **verbatim** (legal text — clear voice, no caveman).

**Link to internal README** (D-51): root README links to `agent-factory/README.md` for the deep entry; never overwrites it.

---

### `NOTICE`, `CONTRIBUTING.md`, `docs/faq.md` (docs, legal/verbatim)

**No in-repo prose analog** — these are assembled verbatim from the brand manual's pre-written, legally-reviewed blocks. The only systematic edit is the D-49 `/grug`→`/grugops` swap (FAQ/NOTICE/CONTRIBUTING contain no commands, so even that is moot — confirm with grep).

| File | Content source (read first) | Notes |
|------|------------------------------|-------|
| `NOTICE` | `docs/initial/grugops_brand_manual.md` §10.4-C (rendered verbatim in `06-RESEARCH.md:544-558`) | set `<year>/<name>` = `2026 Olger Oeselg` (from `plugin.json` author + current date); `license: MIT` |
| `CONTRIBUTING.md` | brand manual §10.3 (anchor `grugops_brand_manual.md:523`) | contributor art/legal rules; original-art enforcement |
| `docs/faq.md` | brand manual §8.8 (anchor `grugops_brand_manual.md:406`) | clear voice; `docs/` dir already exists (additive) |

> **Don't re-author.** Re-writing legal/disclaimer prose risks drift and IP errors. Copy the blocks; apply only the `/grug`→`/grugops` swap; grep to confirm no stray `/grug`.

---

### `brand/wordmark*.svg` + `brand/icon.svg` (static assets) — see "No Analog Found"

---

## Shared Patterns

### No-fabrication / fail-closed
**Source:** `hooks/guard.mjs:96-133` (fail-closed `try/catch`, deny-with-message), `.planning/.../04/check-structure.sh:11-13` (`UNKNOWN - verify`, never invent a command).
**Apply to:** the validator (parse failures → findings, never crashes), the dogfood report (`examples/03`), every example. Live-CC-session steps (marketplace install, hook firing, sub-agent spawn) are marked **"pending human"** — never simulated.

### POSIX harness house style
**Source:** `hooks/guard.test.sh:16-26,133-139` (`set -eu`, `pass()`/`fail()`, `printf` not `echo -e`, `ALL CHECKS PASSED`/`N CHECK(S) FAILED`, exit 0/1).
**Apply to:** `scripts/validate.test.sh`.

### Node stdlib-only, zero-dependency, no `package.json`
**Source:** `install/install.mjs:1-34` (header declares "Node stdlib ONLY — ZERO npm dependencies"; imports only `node:fs`/`node:path`/`node:url`).
**Apply to:** `scripts/validate-agent-factory.mjs`. Front-matter parsing is a hand-rolled regex — **never add gray-matter/yaml** (forces a forbidden `package.json`). `[VERIFIED: find -name package.json → empty]`

### Env-overridable hermetic root
**Source:** `install/install.mjs:37-40` (`GRUGOPS_SRC`/`TARGET`); `install/install.test.sh:62,100,128` (env-prefixed invocation).
**Apply to:** validator's `VALIDATE_ROOT`; harness fixture invocation.

### Frozen name lists (reuse, never re-derive)
**Source:** `.planning/.../04/check-structure.sh:33` (14 `WORKFLOWS`), `:48` (16 `FROZEN_HANDOFFS`), `:36-45` (10 `SECTION_HEADINGS`).
**Apply to:** validator's required-file / required-section lists; examples' handoff-filename references.

### Two-voice discipline (D-21/D-49)
**Source:** brand manual; `hooks/guard.mjs:8` ("all clear-voice, no caveman voice in safety output").
**Apply to:** README opener/pitch + all legal/NOTICE/FAQ/CONTRIBUTING = clear professional English; grug wink only in framing prose; `/grugops` everywhere, never literal `/grug`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `brand/wordmark.svg` (+ `-mono-dark`, `-mono-light`, `-lockup`) | static asset (SVG XML) | static | No SVG/art file exists anywhere in the repo. **Source is `docs/initial/grugops_brand_manual.md` §6.3** (color wordmark drop-in, anchor line 251) — full SVG reproduced in `06-RESEARCH.md:469-478`. Derivation is **mechanical** (D-50): mono-dark = all `fill` → `#2C2A28`; mono-light = all `fill` → `#F3ECE0`; lockup = `icon.svg` placed left of wordmark in one horizontal `viewBox`. **No new concept.** |
| `brand/icon.svg` | static asset (SVG XML) | static | No analog. **Source is brand manual §6.4** (club-on-stone icon, anchor line 266) — full SVG in `06-RESEARCH.md:486-497`. Light cleanup (viewBox/alignment/a11y) allowed; no concept change. |

**Palette (the only allowed hex, BRAND-03):** Charcoal `#2C2A28`, Bone `#F3ECE0`, Granite `#6B6B6B`, Ochre `#C8642D` (manual §6.1, anchor line 227; full list `06-RESEARCH.md:500-509`). Validator/QE check: `grep -L` for any off-palette hex. Lowercase `grugops`; never resemble the children's-book character.

> The planner should treat the SVGs as a **copy-from-spec** task (`docs/initial/grugops_brand_manual.md` §6.3/§6.4 + the recolor recipe), not a copy-from-codebase task — there is no in-repo art to pattern-match.

## Metadata

**Analog search scope:** `install/`, `hooks/`, `.planning/phases/0{3,4,5}/check-structure.sh`, `agent-factory/{workflows,README.md,config,handoffs}/`, `plans/`, `.claude-plugin/`, `docs/initial/`.
**Files scanned (read in full):** `install/install.mjs`, `hooks/guard.mjs`, `hooks/guard.test.sh`, `install/install.test.sh`, `.planning/.../04/check-structure.sh`, `agent-factory/README.md`, `agent-factory/workflows/04-ticket-to-pr.md`; targeted greps across `plans/board.md`, `plans/traceability.md`, `agent-factory/config/factory.config.json`, `.claude-plugin/plugin.json`, `docs/initial/grugops_brand_manual.md`.
**Pattern extraction date:** 2026-06-03
