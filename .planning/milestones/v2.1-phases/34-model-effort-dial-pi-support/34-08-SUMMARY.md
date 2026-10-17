---
phase: 34-model-effort-dial-pi-support
plan: 08
subsystem: docs/install-guide
tags: [pi, install-guide, host-registry, claim-registry, browser-uat, vitest, docs]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "34-02 PI_PROMPT_REL and HOST_TOOLS; 34-04 the unconditional, ledger-recorded Pi template write; 34-06 the Pi conventions section in adapters.md; 34-07 the section 'Host-CLI scope of the model and effort dials'"
provides:
  - "install/README.md: Pi touch-list bullet, a 'Using grugops on Pi' section, a Pi Undo sentence, a cited section 5 Pi safety bullet, count-free section 5 lead, section 6 Degraded list and section 7 browser lines"
  - "install/host-tools.test.ts: 'install guide covers Pi (plan 34-08)' oracle held to PI_PROMPT_REL and the registry's Pi name and sequential host set"
  - "README.md (C-28-001, C-28-008), browser-UAT recipe (Pi MCP registration), slash-command template, bootstrap example, FAQ, CLAUDE.md and PROJECT.md name Pi with no host count"
affects: [34-09, 34-10]

actuals:
  tokens: 4420
  tasks: 3
  commits: 3
plan_head_before: 46999b56e0feca58ecf5d573c9760dd758db6276
plan_head_after: c638e2e21a4284d00e5cde2646cdcc320862875b

tech-stack:
  added: []
  patterns:
    - "A doc oracle reads sections by heading (exactly one) and holds them to registry values (PI_PROMPT_REL, the Pi row's name, the sequential host set), never to retyped strings"
    - "A captured real-run example is not rewritten to claim what the run did not do; a dated note states what an install does today"

key-files:
  created: []
  modified:
    - install/README.md
    - install/host-tools.test.ts
    - README.md
    - docs/audit/28-claim-registry.md
    - agent-factory/checklists/browser-uat-recipe.md
    - agent-factory/packaging/slash-command.template.md
    - examples/01-greenfield-bootstrap.md
    - docs/faq.md
    - CLAUDE.md
    - .planning/PROJECT.md

key-decisions:
  - "The install guide gets a dedicated '### Using grugops on Pi' heading rather than an inline paragraph, so the oracle can bound the Pi usage text by heading"
  - "The bootstrap example is a captured real run (2026-06-03) that predates the Pi template, so a dated note was added instead of adding Pi to the list of what that run laid down (CLAUDE.md No fabrication)"
  - "The section 5 lead sentence says Pi has no approval mode, instead of the old 'each has its own approval mode', which would have been false for Pi"

patterns-established:
  - "Every backticked `.pi/prompts/...` token in the install guide is PI_PROMPT_REL itself; directory mentions are written `.pi/prompts` with no trailing slash"

requirements-completed: [PI-02, PI-04]

coverage:
  - id: D1
    description: "The install guide's per-repo touch list has a Pi bullet for .pi/prompts/grugops.md (written in every install, ledger-recorded, a user file left untouched, would-add under DRY_RUN)"
    requirement: PI-02
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#install guide covers Pi (plan 34-08) > the per-repo touch list has a bullet for PI_PROMPT_REL that names the ledger and the dry-run line"
        status: pass
    human_judgment: false
  - id: D2
    description: "'Using grugops on Pi' states /grugops <request>, start from the repository root, project trust (cited, retrieved 2026-10-06), what grugops never writes, and points to the dial scope section without restating it"
    requirement: PI-02
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#install guide covers Pi (plan 34-08) > the Pi usage section names the path, the command, the repository root, project trust, and points at the dial scope section"
        status: pass
    human_judgment: false
  - id: D3
    description: "Section 5 Pi bullet in clear voice: Pi does not ask for approval before every tool call (security.md cited), the git host is the only hard control, a Pi extension can block a call but grugops ships none"
    requirement: PI-04
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#install guide covers Pi (plan 34-08) > § 5 has a bullet for the registry's Pi name that says Pi asks for no approval per tool call and names the git host, with a source"
        status: pass
    human_judgment: false
  - id: D4
    description: "Section 5 lead sentence and section 6 Degraded paragraph name every sequential registry host; every `.pi/prompts/` token in the guide is PI_PROMPT_REL"
    requirement: PI-02
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#install guide covers Pi (plan 34-08) > the § 5 lead sentence and the § 6 Degraded paragraph name every sequential host in the registry"
        status: pass
      - kind: unit
        ref: "install/host-tools.test.ts#install guide covers Pi (plan 34-08) > every backticked token in the guide that starts with `.pi/prompts/` is PI_PROMPT_REL"
        status: pass
    human_judgment: false
  - id: D5
    description: "README host list names Pi and 'Go deep' is count-free, with C-28-001 and C-28-008 verbatim blocks updated in the same commit"
    verification:
      - kind: other
        ref: "node scripts/check-claim-anchors.js"
        status: pass
    human_judgment: false
  - id: D6
    description: "Browser-UAT recipe gives Pi's MCP registration at the recipe's pinned Playwright MCP version, cited to Pi cli.md; headings count-free"
    verification:
      - kind: other
        ref: "node scripts/check-foundation-guards.js (playwright MCP pin `0.0.78`, 0 findings)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Wording quality of the new Pi prose (clear voice in safety text, readability for a Pi user)"
    verification: []
    human_judgment: true
    rationale: "No test asserts that the guide reads clearly to a Pi user; the gates check vocabulary, claims and registry agreement only"

duration: 32min
completed: 2026-10-06
status: complete
---

# Phase 34 Plan 08: Pi user documentation Summary

**The install guide now tells a Pi user what install writes (`.pi/prompts/grugops.md`), how to run `/grugops <request>` from the repository root, why Pi asks for project trust, what uninstall removes, and that on Pi the git host is the only hard control (cited to Pi's security.md). A registry-derived oracle holds the guide to `PI_PROMPT_REL`. README, the FAQ, the browser-UAT recipe (with `pi mcp add playwright -- npx @playwright/mcp@0.0.78`), the slash-command template, CLAUDE.md and PROJECT.md now name Pi and use no host count.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-10-06T15:32:20Z
- **Completed:** 2026-10-06T16:04:38Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- install/README.md:
  - A Pi bullet in "What the installer touches". It says the template is written in every install whether or not Pi is used (D-17), what the pointer does, the ledger record, that an existing file is never overwritten (D-13), and that DRY_RUN prints `would-add`.
  - A new "### Using grugops on Pi" section (D-16). Install Pi from pi.dev (link only). Start Pi from the repository root. Project trust, and the print/JSON/RPC skip, cited to prompt-templates.md, security.md and configuration.md with the retrieval date 2026-10-06. What grugops never writes. A pointer to "Host-CLI scope of the model and effort dials" rather than a restatement (D-07, D-12).
  - One sentence in Undo.
  - § 5: a cited Pi bullet in clear voice (T-34-25). The lead sentence names Pi and says Pi has no approval mode.
  - § 6 Degraded list and § 7 browser lines name Pi and use no count.
- install/host-tools.test.ts adds "install guide covers Pi (plan 34-08)", 6 cases. It reads sections by heading and checks:
  - PI_PROMPT_REL, `/grugops <request>`, "repository root", "project trust", pi.dev and the retrieval date;
  - that the scope section it points to exists in subagent.frontmatter.md;
  - the § 5 bullet, found by the registry's Pi `name`;
  - every sequential registry host in the § 5 lead and the § 6 Degraded paragraph;
  - every `.pi/prompts/` token equals PI_PROMPT_REL (at least 3 occurrences).
- README.md:
  - line 4 lists Pi (C-28-001);
  - line 65 now reads "any supported host tool" (C-28-008);
  - both verbatim registry blocks were updated in the same commit, and the C-28-008 mechanism sentence was refreshed.
- browser-uat-recipe.md:
  - heading changes: "The host-CLI registrations" and "Absence on the hosts other than Claude Code";
  - "every supported host";
  - a Pi registration row at pin 0.0.78, cited to Pi cli.md § MCP commands.
- slash-command.template.md:
  - Pi gets a plain pointer prompt template, not a resolver adapter, so the two-adapter rule holds;
  - the non-spawning host line no longer carries a count.
- docs/faq.md, CLAUDE.md and .planning/PROJECT.md list Pi. The Single-source constraint line now reads "avoid drift across the supported host tools", byte-identical in both files.

## Task Commits

1. **Task 1 (tracer): install guide Pi section + oracle**: `8ef4dbfc` (docs). Tracer gate: the verify was re-run (end-of-phase mode, automated-only) and passed. Tracer verified end to end, then expanded.
2. **Task 2: README, recipe, template, example, claim registry**: `4e7c02cc` (docs)
3. **Task 3: FAQ, CLAUDE.md, PROJECT.md**: `c638e2e2` (docs)

## Files Created/Modified

- `install/README.md`: Pi touch-list bullet, "Using grugops on Pi" section, Undo sentence, § 5 Pi bullet and lead, § 6 and § 7 host lists
- `install/host-tools.test.ts`: install-guide Pi oracle
- `README.md`, `docs/audit/28-claim-registry.md`: C-28-001 and C-28-008 text and verbatim blocks
- `agent-factory/checklists/browser-uat-recipe.md`: Pi MCP row and count-free headings
- `agent-factory/packaging/slash-command.template.md`: Pi plain-pointer sentence, count-free line
- `examples/01-greenfield-bootstrap.md`: dated note about the Pi pointer
- `docs/faq.md`, `CLAUDE.md`, `.planning/PROJECT.md`: Pi in the host lists, no host count

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

**1. [CLAUDE.md No fabrication] Bootstrap example: a dated note instead of adding Pi to the run's list**
- **Found during:** Task 2.
- **Issue:** The plan says to add the Pi template where line 31 lists what install wrote. That paragraph describes a captured real run from 2026-06-03, and that run did not write a Pi template.
- **Fix:** A separate note says the run predates the template and that an install today also writes `.pi/prompts/grugops.md`.
- **Commit:** `4e7c02cc`

**2. [Rule 2 - correctness] § 5 lead sentence reworded beyond "add Pi"**
- **Found during:** Task 1.
- **Issue:** The old text "Each has its own approval mode" would be false once Pi joins the list.
- **Fix:** The sentence now reads "Each of them except Pi has its own approval mode … Pi has none (see its entry below)".
- **Commit:** `8ef4dbfc`

**3. [Rule 1 - stale record] C-28-008 `line:` field recomputed from its anchor (51 → 65)**
- **Found during:** Task 2.
- **Issue:** The field was stale before this plan; the anchor is at line 64 and the claim is at line 65. The anchor gate does not read this field.
- **Fix:** Field set to 65. A one-sentence Pi note was also added to the C-28-001 mechanism; its three measured assertions are unchanged.
- **Commit:** `4e7c02cc`

**4. [Must-have scope] CLAUDE.md version table "All 5 target CLIs" → "All supported host CLIs"**
- **Found during:** Task 3.
- **Issue:** The plan's truth says CLAUDE.md carries no host count, and this table cell was a remaining one. Pi reading AGENTS.md is verified in 34-RESEARCH § B.
- **Fix:** Cell reworded with no count.
- **Commit:** `c638e2e2`

**Total deviations:** 4 (1 CLAUDE.md-driven, 1 correctness, 1 stale record, 1 must-have scope). **Impact:** wording only, and no file outside files_modified was touched.

## Issues Encountered

- The project paragraph and the Constraints block in CLAUDE.md and PROJECT.md already differed before this plan (other wording, extra constraints in PROJECT.md). Only the lines this plan edits were made byte-identical. Diff commands used:
  - `diff <(grep -o "a coding-agent CLI you already use ([^)]*)" CLAUDE.md) <(grep -o "..." .planning/PROJECT.md)` gives no output;
  - `diff <(grep "^- \*\*Single-source\*\*" CLAUDE.md) <(grep "^- \*\*Single-source\*\*" .planning/PROJECT.md)` gives no output.

  A whole-block regeneration of CLAUDE.md from PROJECT.md would still change other lines. That was true before this plan and is out of scope.
- Oracle mutation proof. Each case was mutated against the real guide and the guide was then restored byte for byte, checked with `cmp`:
  - removing Pi from the § 6 Degraded list turned the sequential-host case red;
  - swapping the § 5 "only hard control" clause turned the § 5 case red;
  - respelling the template path turned the usage-section case and the token case red;
  - one weak mutation ("project trust first" → "trust first") stayed green, because the phrase also appears elsewhere in the section. That is a limit of the mutation, not a gap in the test.

## Verification

- `npm run build`, `npm run check:build-parity` and `npm run typecheck` passed.
- `npx vitest run --exclude '**/scripts/e2e/**'`: 99 files passed, 7315 tests passed, 2 skipped, exit 0 (957 s).
- check-claim-anchors, check-banned-claims, check-public-docs-vocabulary, check-imperative-lexicon, check-foundation-guards (Playwright pin 0.0.78, 0 findings) and check-kit-refs: all ALL CHECKS PASSED. `npm run freshness:catalog` passed. `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` passed.
- `grep -n "pi mcp add playwright" agent-factory/checklists/browser-uat-recipe.md` prints one line, at pin 0.0.78.

## User Setup Required

None.

## Next Phase Readiness

- 34-09 (derived prose count-word scan): README, the install guide, the recipe, the slash-command template, the FAQ and CLAUDE.md lines this plan touched carry no host count. install/README.md line 3 ("grug not install it five different hard ways") is caveman prose about install methods, not hosts, and was left. adapters.md line 7 is still listed in deferred-items.md.
- No stubs. No new security surface beyond documentation. T-34-25, T-34-26, T-34-27 and T-34-SC are mitigated as planned; no package was installed and Pi is linked only.

## Self-Check: PASSED

- All 10 modified files exist on disk.
- Commits 8ef4dbfc, 4e7c02cc and c638e2e2 are ancestors of HEAD.
