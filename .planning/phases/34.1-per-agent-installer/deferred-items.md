# Phase 34.1 — Deferred items (for human triage)

Items found during execution that are outside the executing plan's scope. Each names where it was
found, what was measured, and the remedy proposed. None was fixed in the plan that found it.

## From plan 34.1-01 (2026-10-11)

### DI-01: the three generated host entries are excluded from the banned-claims gate by name, not admitted

- **Found during:** plan 34.1-01, task 3 (full regression).
- **What:** `scripts/check-banned-claims.ts` asks that every tracked text path be scanned or excluded
  by name. The committed entries `.agents/skills/grugops/SKILL.md`, `.opencode/commands/grugops.md`
  and `.pi/prompts/grugops.md` are shipped markdown. Plan 34.1-01 added them to
  `BANNED_CLAIM_EXCLUDED_LOCATIONS` as exact paths, with the cost written beside the entry: the
  pointer sentence is read through `agent-factory/packaging/host-entry.pointer.md` (a `kit` member),
  but the frontmatter and arguments line typed in `scripts/generate-host-entries.ts` are read by no
  gate. The module's own `.claude/` paragraph refutes that transitive-coverage argument for generated
  output.
- **Measured:** 0 banned-claim occurrences in each of the three files with the gate's own matcher
  (`countBannedClaimOccurrences`), 2026-10-11, with a control line reading 3.
- **Proposed remedy:** admit them as a derived part (`hostEntries`) with its own disk walk, vacuity
  floor and a moved `BANNED_CLAIM_SCAN_COUNT`, as `.claude/` and `.claude-plugin/` were admitted. That
  touches the gate's test harness (mirror plants, part overrides, PASS-line arithmetic), which is why
  it was not done inside plan 34.1-01.

### DI-02: plan 34.1-02 names the template path `host-entry.template.md`; the file is `host-entry.pointer.md`

- **Found during:** plan 34.1-01, task 3 (full regression).
- **What:** `scripts/kit-model.ts` `listPackagingTemplates` admits every `*.template.md` and
  `*.frontmatter.md` under `agent-factory/packaging/` into the one spawn-grant scan composition, whose
  members must carry a frontmatter block. A frontmatter-less pointer file named
  `host-entry.template.md` turned about 40 tests red (canonical-frontmatter, frontmatter, kit-model,
  check-foundation-guards). Plan 34.1-01 renamed it `agent-factory/packaging/host-entry.pointer.md`.
- **Action for plan 34.1-02:** read the path from `TEMPLATE_REL`, exported by
  `scripts/generate-host-entries.ts`, instead of typing `host-entry.template.md` in
  `scripts/host-entries-freshness.ts`.

### DI-03: five suite reds that predate plan 34.1-01 (Node 26 on this machine)

- **Found during:** the baseline run before plan 34.1-01 changed anything (2026-10-11, 5 failed of
  7717 on HEAD e17b1ba5, Node v26.11.0; the project targets Node 22+).
- **What:** `install/installer-fs-census.test.ts` (node:fs export `openAsBlobSync` unclassified),
  `scripts/check-foundation-guards.test.ts` (2 cases: a `MODULE_TYPELESS_PACKAGE_JSON` warning on
  stderr of a mirror without a package.json), `scripts/generate-catalog.test.ts` (2 cases: the same
  warning). Both causes come from Node 26, not from repository code.
- **Not fixed:** out of scope for plan 34.1-01. Whether CI on Node 22 shows them is
  `UNKNOWN - verify`.
