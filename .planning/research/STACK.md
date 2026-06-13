# Stack Research — v1.2 SDLC Depth, Quality Discipline & Browsable Docs

**Domain:** Markdown agent-factory kit — tools/frameworks/standards grugops should REFERENCE in role/checklist text and RECOMMEND to its users for v1.2 (security auditing, BDD+TDD, linting, UI/E2E, browsable docs catalog)
**Researched:** 2026-06-09
**Confidence:** HIGH (versions verified against npm / GitHub releases / official docs as of June 2026; ASVS 5.0 confirmed against owasp.org + the OWASP/ASVS repo)

> **READ THIS FIRST — framing rule.** grugops ships **no runtime, DB, queue, or app code**: it is markdown + `install.sh`/`install.mjs` + one stdlib-only Node validator. Therefore **every entry below is something grugops ENCODES into role prompts / workflow markdown / checklists / the `factory.config.json` dial / the §14 gate, and RECOMMENDS to its users — NOT something grugops installs into itself.** Each row tags the disposition: **RECOMMEND** (tell users to install in *their* project) or **REFERENCE** (name in role/checklist/gate text as the standard to follow). The only thing grugops "installs" is more markdown.
>
> This file supersedes the v1.1 STACK.md (shared-install conventions, now reflected in PROJECT.md) and is scoped to the v1.2 capabilities only.

---

## TL;DR — the locked answers this milestone needs

1. **Security anchor = OWASP ASVS 5.0.0** (May 2025; ~350 reqs, 17 chapters, cumulative L1⊂L2⊂L3). v5 deliberately rebalanced the levels — L1 is now a light, realistic entry point; L3 is meaningfully broader. Ships a **machine-readable CSV/JSON with a per-requirement level column**, so the checklist is generated/tagged from the source, not hand-transcribed. **Map L1→lean, L2→enterprise, L3→explicit high-assurance flag.** **(HIGH)**
2. **BDD = Gherkin via `playwright-bdd` 9.x** (NOT Cucumber.js) for grugops's Playwright stack — Gherkin runs on Playwright Test's runner, so visual regression / fixtures / parallelism come free. **(HIGH)**
3. **TDD = Vitest 4.x + @vue/test-utils 2.4.x** — the official Vue/Vite testing stack; esbuild-fast TS, Jest-compatible API. Requires **Vite ≥6, Node ≥20.** **(HIGH)**
4. **Lint default for the Vue stack = ESLint 9 flat config + eslint-plugin-vue + @vue/eslint-config-typescript + Prettier.** Biome is faster but its **Vue support is still experimental** — make it a conditional, non-Vue recommendation. **(HIGH)**
5. **UI/E2E + visual = Playwright 1.60.x** with `toHaveScreenshot()`; flake control = mask dynamic regions, disable animations, baselines-in-CI/Docker, wait-on-state. **(HIGH)**
6. **Docs catalog stays MARKDOWN-ONLY:** a **stdlib-only** Node generator reads role/workflow YAML frontmatter and emits a committed markdown index. No SSG, no web app, **no npm dependency added to grugops** (no `gray-matter`/`js-yaml`). **(HIGH)**

---

## Recommended Stack

### Core Technologies (standards + frameworks grugops references for v1.2)

| Technology | Version | Purpose | Why Recommended | Disposition |
|------------|---------|---------|-----------------|-------------|
| **OWASP ASVS** | **5.0.0** (2025-05-30) | The security-audit anchor: ~350 requirements in 17 chapters, three cumulative levels (L1⊂L2⊂L3) | The de-facto open standard for app security verification; v5.0 deliberately **rebalanced the levels** so L1 is a realistic, lighter entry point and L3 is meaningfully broader — a near-perfect fit for grugops's lean→enterprise dial. Ships a **machine-readable CSV/JSON/XML with a per-requirement level column**, so a checklist can be generated from the source rather than hand-transcribed. | REFERENCE (anchor the security-audit workflow + checklist); RECOMMEND the standard to users |
| **Gherkin** (Given/When/Then) | language spec; parser `@cucumber/gherkin` **39.1.0** | The BDD acceptance-scenario format for the business→engineer contract | Plain-text, business-readable; it IS the acceptance criteria, written once and executable. grugops should make Gherkin the *shape* of acceptance/UAT handoffs. Gherkin is just text — grugops can embed Given/When/Then blocks directly in handoff packets. | REFERENCE (acceptance/UAT handoff format); RECOMMEND the runner below to users |
| **playwright-bdd** | **9.0.0** (2026-06-02) | Executes Gherkin `.feature` files through the **Playwright Test** runner (not a separate Cucumber runner) | For grugops's recommended Playwright stack this is the cleaner BDD path: Gherkin scenarios become native Playwright tests, so users get auto-waiting, fixtures, parallel workers, tracing, **and visual regression (`toHaveScreenshot`) out of the box** — no second runner, no bolted-on VRT. TypeScript-native. | RECOMMEND (default BDD-on-Playwright runner for the Vue/TS stack) |
| **Vitest** | **4.x** (4.0 GA 2025-10-22; 4.1 current) | TDD unit/integration test runner for TS/Node + Vue | The standard for new Vite-based TS/Vue projects: esbuild transforms TS with zero config, Jest-compatible `expect`/snapshot/coverage API, created/maintained by Vue/Vite team members. v4 also ships stable Browser Mode + built-in visual regression. **Requires Vite ≥6 and Node ≥20.** | RECOMMEND (default TDD runner for the recommended stack) |
| **@vue/test-utils** | **2.4.x** | Official Vue 3 component-test utilities, paired with Vitest | Official Vue testing suite; `Vitest + @vue/test-utils` is the officially recommended Vue component-testing stack. | RECOMMEND (Vue component layer) |
| **Playwright** (`@playwright/test`) | **1.60.x** | UI / E2E + visual-regression engine in the §14 gate | Single API drives Chromium/Firefox/WebKit; native `toHaveScreenshot()` visual regression, auto-waiting, tracing, headless-CI-first. This is the engine the v1.2 "automated UI/E2E in the gate" capability sits on. | RECOMMEND (E2E + visual gate for users); REFERENCE (gate step text) |
| **ESLint** (flat config) | **9.x** | The portable lint baseline for JS/TS/Vue | ESLint 9 flat config (`eslint.config.mjs`) + `typescript-eslint` + `eslint-plugin-vue` + `@vue/eslint-config-typescript` is the **only** combo that fully lints Vue SFCs today (Biome's Vue support is still experimental — see What NOT to Use). Huge plugin ecosystem (a11y, security, import rules). | RECOMMEND (default linter for the Vue/TS stack); REFERENCE (lint gate step) |

### Supporting Libraries / Tools (per-stack lint + docs catalog)

| Library / Tool | Version | Purpose | When to Use | Disposition |
|---------|---------|---------|-------------|-------------|
| **Prettier** | 3.x | Opinionated formatter alongside ESLint | Pair with ESLint for JS/TS/Vue formatting (use `eslint-config-prettier` to disable conflicting stylistic rules). Skip if the user adopts Biome for non-Vue code. | RECOMMEND |
| **Biome** | **2.x** (2.3+ current; 2.0 2025-03) | Single-binary lint+format, ~10–25× faster, one config file | Recommend **only for JS/TS-heavy projects without Vue SFCs** (or as a hybrid: Biome for `.ts`/`.js`, ESLint for `.vue`). Vue/Svelte/Astro support landed **experimental** in 2.3 — not yet stable, so it is NOT the default for grugops's Vue stack. | RECOMMEND (conditional — see Stack Patterns) |
| **Ruff** | **0.15.x** (0.15.16, 2026-06-04) | Extremely fast Python linter **and** formatter (Rust) | The portable Python recommendation: replaces Flake8 + Black + isort + pyupgrade etc. with one tool (`ruff check` + `ruff format`). | RECOMMEND (Python stacks) |
| **golangci-lint** | **2.x** | Aggregated Go linters + `golangci-lint fmt` | Portable Go recommendation; v2 adds a `fmt` subcommand wrapping gofmt/gofumpt/goimports. Pair with built-in `gofmt`/`go vet`. | RECOMMEND (Go stacks) |
| **gray-matter** | latest (Node) | Parse YAML frontmatter from markdown in a generator script | The go-to JS library for batch-reading frontmatter — the engine of a markdown-only docs-catalog generator. **Only relevant as the pattern users would reach for, or a fallback if the catalog is framed as a user recommendation; the grugops self-hosted generator must stay stdlib-only (see caveat).** | REFERENCE (catalog-generator design option) — see note below |

> **Docs-catalog dependency caveat (hard constraint):** grugops's stack is "Markdown for everything except installers and one optional Node validator." The browsable-docs-catalog generator must therefore be **either** (a) a stdlib-only Node script (parse the `---`…`---` frontmatter block with a tiny hand-rolled YAML-subset reader, exactly as the existing validator avoids deps), **or** (b) folded into the existing `scripts/validate-agent-factory.ts` lineage. Do **not** add `gray-matter`, `js-yaml`, or any npm dependency to grugops itself — `gray-matter` is listed only as the pattern users would reach for. The catalog **output is markdown**; the generator is the only code, and it stays stdlib-only.

### Development Tools (what grugops references in the §14 gate + AGENTS.md commands)

| Tool | Purpose | Notes |
|------|---------|-------|
| `npx playwright test` / `--update-snapshots` | Run E2E + visual suite; refresh baselines | Gate step. Baselines must be generated **in CI / Docker**, never committed from a dev laptop (see Pitfalls). |
| `npx bddgen && npx playwright test` | playwright-bdd: generate test files from `.feature`, then run | Two-step: `bddgen` transpiles Gherkin → Playwright specs. |
| `vitest run --coverage` | Non-watch TDD run for the gate (CI mode) | Use `vitest run` (not bare `vitest`, which watches) in the gate. |
| `eslint . --max-warnings=0` | Lint gate step, fail-on-warning | The fail-on-error vs warn decision is config-dialed — see the lint-gate note. |
| `ruff check . && ruff format --check .` | Python lint+format gate | `--check` makes format a verifier, not a mutator, in the gate. |
| `claude plugin validate --strict` | (grugops's own) validate plugin/agent frontmatter | Already in grugops's toolbelt from v1.0; relevant because the docs-catalog reads the same frontmatter. |
| ASVS 5.0 CSV → checklist generator | Source-of-truth for the security checklist | `OWASP_Application_Security_Verification_Standard_5.0.0_en.csv` carries a level column; the checklist is filtered/tagged by level rather than hand-written. |

## Installation

> These are commands grugops **puts in its users' AGENTS.md `Commands` block and recommends in workflows** — NOT dependencies of grugops. grugops's own install is unchanged (`install.sh` / `install.mjs`).

```bash
# --- TDD layer (recommended Vue/TS stack) ---
npm install -D vitest @vue/test-utils

# --- BDD layer on Playwright (Gherkin → Playwright Test) ---
npm install -D @playwright/test playwright-bdd
npx playwright install            # browsers

# --- Lint/format (Vue/TS default) ---
npm install -D eslint typescript-eslint eslint-plugin-vue \
  @vue/eslint-config-typescript prettier eslint-config-prettier

# --- Lint/format (non-Vue JS/TS alternative, single binary) ---
npm install -D --save-exact @biomejs/biome

# --- Python stack (portable fallback) ---
# pip install ruff       (or: uv add --dev ruff)

# --- Go stack (portable fallback) ---
# go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

```bash
# --- ASVS source-of-truth for the security checklist (REFERENCE, not installed) ---
# CSV with a per-requirement level column (pin the v5.0.0 tag):
#   https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/docs_en/\
#     OWASP_Application_Security_Verification_Standard_5.0.0_en.csv
```

## OWASP ASVS — level → config-tier mapping (the headline deliverable)

**ASVS 5.0 facts (verified):** ~350 requirements, 17 chapters, three **cumulative** levels (L2 ⊃ L1, L3 ⊃ L2). v5.0's central change was **rebalancing**: in v4 L1 was too heavy and L2↔L3 barely differed (L3 added only ~20 reqs); v5 makes L1 a light, high-impact entry point and substantially **expands L3** (~90 distinct L3 requirements). Each requirement is tagged with its level in the official CSV/JSON.

ASVS itself does not hard-bind a level to a risk class, but its stated intent maps cleanly onto grugops's dial:

| ASVS Level | ASVS intent (v5.0) | App risk profile | grugops `factory.config` tier | Gate behavior |
|------------|--------------------|------------------|-------------------------------|---------------|
| **L1** | "First layer of defense"; fully black/grey-box penetration-testable, no source/design access required | Lower-risk apps, internal tools, MVPs, prototypes | **lean (default)** | L1 checklist subset; security-audit workflow runs in advisory mode, findings logged, gate WARNs by default |
| **L2** | Comprehensive standard security practices; the default for most commercial verification (grey/white-box) | Most production apps handling user/business data | **enterprise** (default within enterprise mode) | Full L1+L2 checklist; Critical/High findings **block** the gate (fail-on-finding); NFR/compliance role engaged |
| **L3** | Advanced, high-assurance; architecture review + deep code insight | Finance, healthcare, critical infra, regulated/PII-heavy | **enterprise + explicit `security.asvs_level: 3`** | Full L1+L2+L3 checklist; architecture-review evidence required in the handoff; release gate requires named human security sign-off |

**Recommended dial shape** (to encode in `.grugops/factory.config.json` / `.md` twin):
```jsonc
{
  "security": {
    "asvs_level": 1,               // 1 = lean default; 2/3 raise depth (enterprise)
    "block_on": "high",            // none | high | medium — gate-block threshold by finding severity
    "require_human_signoff_at": 3  // L3 demands a named human approver at the release gate
  }
}
```
- **Lean default = L1**: an MVP gets a real-but-light security pass without taxing the solo builder.
- **`mode: enterprise` raises the floor to L2** automatically; `asvs_level: 3` is the explicit high-assurance opt-in.
- The checklist file (e.g. `agent-factory/checklists/security-audit.md`) is structured **by ASVS chapter, with each item tagged `[L1]`/`[L2]`/`[L3]`**, so the security role includes only items at-or-below the active level. One source of checklist text; the dial selects depth — matching grugops's existing lean/enterprise checklist-tier pattern.
- Items grugops **cannot mechanically verify** must be marked `UNKNOWN - verify` and routed to the human/security role — never auto-passed (no-fabrication constraint).
- **Voice rule:** the security checklist and findings are a **clear-voice** topic (per the project's voice discipline) — caveman voice belongs in the role prompt framing, not in the finding text.

**Integration points:** the security-audit step plugs into the existing single-source §14 gate as a gate stage (prefetch ASVS-level subset → run audit → bounded self-fix on Low/Medium → terminal result), and reads `security.*` from the same `.grugops/factory.config.json` the rest of the dial uses. The existing security/NFR/compliance role (shipped v1.0) becomes the owner of the ASVS checklist.

## BDD + TDD without duplication (the coexistence rule)

grugops should encode a **two-layer, non-overlapping** contract:

- **BDD (Gherkin, outside-in) = the business→engineer/UAT contract.** Given/When/Then scenarios describe *observable behavior / acceptance criteria* at the feature boundary. They live in the acceptance + UAT handoff and execute as **E2E** via `playwright-bdd` (Gherkin → Playwright Test). One scenario per acceptance criterion. This is the "test-first at acceptance" half — and it directly closes the business→engineer gap the milestone targets.
- **TDD (Vitest, inside-out) = the unit/component layer.** Red-green-refactor on functions/components/modules. This is the "test-first at the unit layer" half.

**No-duplication rule to bake into the QE persona/workflow:**
- A behavior is asserted **once** at the layer that owns it: business-visible acceptance → BDD/E2E; logic/branch/edge cases → TDD unit. Do **not** re-assert the same acceptance criterion as a unit test, nor push unit-level edge cases up into Gherkin (scenario explosion).
- Gherkin scenarios stay **declarative** (what, in domain language), never imperative click-by-click — imperative detail belongs in step definitions / page objects, not the `.feature`.
- Depth is **config-dialed**: lean = a few critical-path BDD scenarios + unit tests on core logic; enterprise = full acceptance coverage + branch-coverage thresholds.
- The **test-integrity gate** (v1.2) inspects both layers: a skipped/`.skip`/`.todo`/`test.fixme` test is allowed **only** with a documented justification line; otherwise the gate fails. Never fabricate a green run.

## Playwright UI/E2E + visual regression — patterns to encode in the gate

- **Visual regression is built in**: `await expect(page).toHaveScreenshot()` — no extra VRT tool needed (this is the deciding reason `playwright-bdd` beats Cucumber.js for grugops's stack — Cucumber.js would need a separate VRT bolt-on like OpenCV).
- **Flake-resistance checklist (encode into the QE/E2E checklist):**
  1. **Disable animations** — `toHaveScreenshot({ animations: 'disabled' })`.
  2. **Mask dynamic regions** — `{ mask: [locator] }` for timestamps, avatars, ads, counters (cited as the single most important technique).
  3. **Wait on state, not time** — rely on auto-waiting / wait for a stable element or network-idle; never `waitForTimeout`.
  4. **Wait for fonts to load**; **lock the viewport**.
  5. **Generate baselines in CI/Docker, not locally** — use Playwright's official Docker image so rendering matches the CI OS/fonts. Committing laptop-generated baselines is the #1 visual-flake source.
  6. **Per-component thresholds**, not one global tolerance; prefer **component-level screenshots** over full-page (smaller diffs, precise failures).
  7. **Split CI**: Chromium/Firefox on Linux, WebKit on macOS for Safari fidelity.
- **Headless-first** in CI; `retain-on-failure` traces for debugging.
- **Automation principle alignment ("bug the user as little as needed"):** the E2E/visual run is automated inside the gate with sensible defaults; a *visual diff* is the one place a human checkpoint is genuinely warranted (a pixel change can be intended or a regression) — surface diffs for human approve/reject rather than auto-passing or hard-failing silently.

## Browsable docs catalog — MARKDOWN-ONLY approach (stays inside the boundary)

**Goal:** a navigable in-repo reference of every role + workflow, generated from their YAML frontmatter — **no web app, no SaaS, output is markdown.**

**Recommended approach — frontmatter-driven static markdown index:**
1. Ensure every role/workflow markdown file has minimal YAML frontmatter (`name`, `summary`/`description`, `category`/`stage`, `inputs`, `outputs`, `cadence`, maybe `wip_column`). grugops's plugin agent/skill files already require `name` + `description` frontmatter, so the convention exists.
2. A **stdlib-only Node generator** (sibling of `scripts/validate-agent-factory.ts`) walks `agent-factory/roles/` + `agent-factory/workflows/`, reads each file's `---`…`---` block, parses the small known key-set (hand-rolled, no `js-yaml`), and **emits a markdown catalog file** — e.g. `docs/CATALOG.md` (and/or per-section `roles/INDEX.md`) — a table grouped by category/SDLC stage with relative links to each file, summary, and inputs/outputs.
3. The catalog is **committed markdown**: browsable on GitHub, in any editor, and by the host coding agent. It links the lifecycle (BA → product → … → release) so a reader can navigate the factory.

**Why not the obvious alternatives (and why they violate the boundary):**
- Static-site generators (Hugo/Jekyll/Astro/Docusaurus/MkDocs) all produce a **web app** → out of scope (explicit "no web UI / no SaaS" constraint).
- `gray-matter`/`js-yaml` add an npm dependency → violates "markdown + installers + one optional Node validator." Use a stdlib frontmatter parse instead.

**Keep-it-honest rule:** the generator never invents metadata; a file missing required frontmatter is flagged (and can be wired into the validator) rather than guessed — same no-fabrication discipline as the existing validator.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **playwright-bdd** (Gherkin → Playwright Test) | **Cucumber.js** (`@cucumber/cucumber` 13.x) as the runner | Use Cucumber.js when the team has heavy existing Cucumber assets / multi-language (Java/Ruby) parity needs, or wants the broader Cucumber reporting ecosystem. Cost: loses Playwright Test fixtures/parallelism and needs a **separate VRT** implementation. For grugops's default Playwright stack, prefer playwright-bdd. |
| **Vitest** (TDD) | **Jest 30** | Use Jest for CommonJS-only codebases, teams deeply invested in Jest snapshots/mocks, or very large suites already tuned with Jest sharding. New Vite/TS/Vue projects → Vitest. |
| **ESLint 9 + plugins** (Vue/TS) | **Biome 2.x** | Use Biome for JS/TS projects **without Vue SFCs** (or hybrid: Biome for `.ts`/`.js`, ESLint for `.vue`) when speed/single-config matters more than the plugin ecosystem. Not the default while Vue support is experimental. |
| **ASVS 5.0** as the audit anchor | OWASP Top 10 / SAMM / NIST SSDF | Top 10 is awareness, not a verifiable checklist — fine as a lean talking point but ASVS is the testable standard. SAMM/NIST are program-maturity frameworks, complementary at enterprise tier, not a per-app gate checklist. |
| **Stdlib Node catalog generator** | **gray-matter + a tiny script** | Only if the team decides the catalog is a user-recommended pattern (in the user's project) rather than a grugops-self-hosted generator. For grugops itself, stay stdlib-only. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Adding ANY npm runtime dep to grugops** (`gray-matter`, `js-yaml`, a test runner, a linter) | Violates the hard "markdown + installers + one optional Node validator" constraint; grugops ships no runtime | Stdlib-only Node for any generator; **recommend** the tools to users, install none into grugops |
| **Biome as the default linter for the recommended (Vue) stack** | Vue/Svelte/Astro support is still **experimental** (landed 2.3, not stable); template/markup linting incomplete | ESLint 9 + `eslint-plugin-vue` + `@vue/eslint-config-typescript` for Vue; Biome only for non-Vue JS/TS |
| **Cucumber.js for grugops's default Playwright stack** | Separate runner; **no built-in VRT** (needs OpenCV/extra tooling); loses Playwright fixtures/parallelism | playwright-bdd (native Playwright Test runner + built-in `toHaveScreenshot`) |
| **Committing visual-regression baselines from a dev laptop** | OS/font/rendering differences make every CI run flake | Generate baselines in CI / Playwright Docker image; mask dynamic regions; disable animations |
| **`waitForTimeout` / sleep-based waits in E2E** | Primary flakiness source | Auto-waiting, wait-for-element/network-idle, web-first assertions |
| **A web-based docs portal (Docusaurus/MkDocs/Hugo/Astro) for the catalog** | A web app/SaaS is explicitly out of scope | Frontmatter-driven **markdown** index committed in-repo |
| **Duplicating the same acceptance assertion in both Gherkin and unit tests** | Double-maintenance, scenario explosion, false coverage | One behavior, one owning layer: business-visible → BDD/E2E; logic/edges → unit |
| **Auto-passing un-verifiable ASVS items or skipped tests** | Breaks the no-fabrication / test-integrity constraint (the trace is the proof) | Mark `UNKNOWN - verify`; require documented justification for any skip; route to human |
| **`docs.claude.com/...` links / pre-`Agent` `Task` tool prose** | (carry-over) stale | `code.claude.com/docs/en/*`; `Agent` tool name |

## Stack Patterns by Variant

**If recommended default stack (TypeScript / Node+Fastify / Vue / Postgres / Playwright):**
- TDD = **Vitest 4 + @vue/test-utils 2.4**; BDD/E2E = **playwright-bdd 9 + Playwright 1.60** (visual regression via `toHaveScreenshot`); lint = **ESLint 9 + eslint-plugin-vue + @vue/eslint-config-typescript + Prettier**.
- Because this is the only fully-supported combination for Vue SFCs today and keeps one runner for BDD+E2E+VRT.

**If JS/TS project with no Vue SFCs (e.g. pure Node/Fastify service or React):**
- Consider **Biome 2.x** as a single fast lint+format binary (one config, no Prettier needed).
- Because Biome's gap (Vue) doesn't apply; speed + single-config win.

**If Python stack:**
- Lint+format = **Ruff** (`ruff check` + `ruff format`); BDD = `pytest-bdd` (Gherkin) + TDD = `pytest`; E2E = Playwright for Python.
- Because Ruff collapses the whole legacy Python lint/format toolchain into one fast tool.

**If Go stack:**
- Lint = **golangci-lint v2** (+ `golangci-lint fmt`), built-in `gofmt`/`go vet`; tests = `go test` (table-driven); BDD = `godog` (Cucumber for Go).
- Because golangci-lint v2 is the aggregated community standard.

**Lint-gate fail-on-error vs warn (config-dialed):**
- **lean:** lint runs, errors block, warnings are advisory (don't block) → `eslint .` without `--max-warnings=0`. Don't tax solo flow.
- **enterprise:** zero-tolerance → `eslint . --max-warnings=0`; format-check (`prettier --check` / `ruff format --check`) blocks. Encode the threshold in `factory.config` (e.g. `lint.block_on: "error" | "warning"`).

**Security-audit depth (ASVS, config-dialed):** see the level→tier table above. lean→L1 advisory, enterprise→L2 blocking on High, `asvs_level: 3`→L3 + human sign-off.

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Vitest 4.x | Vite **≥6.0**, Node **≥20** | Hard floor; 4.1 adds Vite 8 support and uses the installed Vite. Flag the Node/Vite floor in the recommendation. |
| @vue/test-utils 2.4.x | Vue 3, Vitest 4.x | Vue 3 only (VTU 2 = Vue 3 line). |
| playwright-bdd 9.x | @playwright/test 1.x (recent), Node LTS | Built on Playwright Test runner; bump together. Inherits Playwright's browser-install step (`npx playwright install`). |
| @playwright/test 1.60.x | Node 18+; Chromium/Firefox/WebKit | `npx playwright install` fetches browsers; use the official Docker image for stable visual baselines. |
| ESLint 9.x | typescript-eslint (flat-config-compatible), eslint-plugin-vue 9+, `@vue/eslint-config-typescript` | **Flat config only** (`eslint.config.mjs`); ensure all plugins are flat-config-ready (eslint-plugin-vue ≥9). |
| Biome 2.x | JS/TS/JSON/CSS stable; Vue/Svelte/Astro **experimental (2.3+)** | Do not rely on Vue support yet. |
| Ruff 0.15.x | Python 3.x | `ruff check` + `ruff format`; still pre-1.0 (rules can shift between minors — pin in CI). |
| ASVS 5.0.0 CSV/JSON | n/a | Per-requirement level column; pin to the `v5.0.0` tag URL so the checklist source is reproducible. |
| grugops self | Markdown + `install.sh`/`install.mjs` + 1 stdlib-only Node validator | **None of the above are dependencies of grugops** — all are user recommendations / standard references. Any catalog generator stays stdlib-only Node. |

## Conflicts With Project Constraints — checked, none

- **Markdown-only kit (no runtime/DB/queue):** ✅ every tool above is a *user recommendation* or a *referenced standard*; the only new code is an optional stdlib-only catalog generator (same class as the existing validator).
- **Zero new deps / no `package.json` for grugops:** ✅ no `gray-matter`/`js-yaml` added; catalog generator parses frontmatter with stdlib.
- **Single-source role text + adapters are thin pointers:** ✅ the ASVS checklist, BDD/TDD guidance, and lint steps live once (in checklists/workflows/the §14 gate); adapters don't copy them.
- **Zero-config first + dial:** ✅ ASVS level, lint threshold, and test depth all default lean and rise via `factory.config`.
- **No fabrication:** ✅ un-verifiable ASVS items → `UNKNOWN - verify`; skipped tests need documented justification; the gate never fakes a pass.
- **Voice discipline:** ✅ security findings/compliance are clear-voice; caveman voice stays in role framing.
- **Safety hard limit unchanged:** ✅ none of this touches the never-merge/never-deploy guard; L3 *adds* a human sign-off, it never removes one.

## Open Questions / Flags for Requirements/Roadmap

- **`UNKNOWN - verify` (LOW):** exact column layout / field names in the ASVS 5.0.0 CSV (level column position). Resolve by downloading the pinned `v5.0.0` CSV before building the checklist generator; do not hand-transcribe.
- **Decision (human):** is the docs catalog a **grugops self-hosted generator** (stdlib-only Node, default) or a **user-facing recommendation** (then `gray-matter` is fine — in the *user's* project, never grugops)? Default to self-hosted stdlib-only.
- **Decision (human):** Biome vs ESLint as the headline lint recommendation. Recommendation: ESLint-default for the Vue stack now; revisit Biome when its Vue support exits experimental.
- **Verify during build:** playwright-bdd 9 ↔ the pinned @playwright/test version compatibility window (bump together; confirm `bddgen` against the chosen Playwright minor).

## Sources

- https://github.com/OWASP/ASVS — ASVS 5.0.0 (May 2025), formats incl. CSV (HIGH)
- https://owasp.org/www-project-application-security-verification-standard/ — ASVS 5.0.0 release confirmation 2025-05-30 (HIGH)
- https://softwaremill.com/whats-new-in-asvs-5-0/ — v4→v5 level rebalancing (L1 lighter, L3 expanded ~90 reqs) (MEDIUM)
- https://codific.com/owasp-asvs-a-comprehensive-overview/ — ~350 requirements, 17 chapters, three-tier; CSV/JSON/XML formats; CSV raw URL with level column (MEDIUM, corroborated)
- https://asvs.dev/v5.0.0/Preface/ — official ASVS 5.0.0 docs (HIGH)
- https://www.npmjs.com/package/@cucumber/cucumber — Cucumber.js 13.0.0; @cucumber/gherkin 39.1.0 (HIGH)
- https://github.com/vitalets/playwright-bdd — playwright-bdd 9.0.0 (2026-06-02), Gherkin→Playwright Test, TS, visual comparison (HIGH)
- https://www.arrangility.com/blog/playwright-cucumber-vs-playwright-bdd — Cucumber.js vs playwright-bdd tradeoffs incl. VRT (MEDIUM)
- https://vitest.dev/blog/vitest-4 + https://voidzero.dev/posts/announcing-vitest-4 — Vitest 4.0 (2025-10-22), Vite≥6/Node≥20, visual regression, browser mode stable (HIGH)
- https://vitest.dev/blog/vitest-4-1.html — Vitest 4.1 current (HIGH)
- https://www.npmjs.com/package/@vue/test-utils — @vue/test-utils 2.4.x, official Vue 3 (HIGH)
- https://vuejs.org/guide/scaling-up/testing — Vitest + Vue Test Utils as the official Vue stack (HIGH)
- https://www.npmjs.com/package/@playwright/test + https://playwright.dev/docs/release-notes — Playwright 1.60.x (2026) (HIGH)
- https://testdino.com/blog/playwright-visual-testing + https://turntrout.com/playwright-tips — flake-resistance: mask, animations:disabled, baselines-in-CI, per-component thresholds (MEDIUM)
- https://eslint.vuejs.org/user-guide/ — eslint-plugin-vue flat-config, @vue/eslint-config-typescript (HIGH)
- ESLint 9 flat config (v9 GA April 2024, eslint.config.mjs) — multiple corroborating sources (HIGH)
- https://github.com/astral-sh/ruff/releases — Ruff 0.15.16 (2026-06-04), lint+format (HIGH)
- https://golangci-lint.run/ + https://ldez.github.io/blog/2025/03/23/golangci-lint-v2/ — golangci-lint v2, `fmt` subcommand (HIGH)
- Biome 2.x (2.0 March 2025, 2.3 with experimental Vue/Svelte/Astro) — multiple corroborating sources (MEDIUM)
- https://docs.github.com/en/contributing/writing-for-github-docs/using-yaml-frontmatter + gray-matter ecosystem — frontmatter-driven static indexing (HIGH for the pattern; gray-matter NOT a grugops dep)

---
*Stack research for: grugops v1.2 — tools/standards to reference & recommend (NOT install into grugops)*
*Researched: 2026-06-09*
