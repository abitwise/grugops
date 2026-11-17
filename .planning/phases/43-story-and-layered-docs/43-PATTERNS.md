# Phase 43: Story and layered docs - Pattern Map

**Mapped:** 2026-11-17
**Files analyzed:** 34 new or modified files and groups (generated pages are counted as groups)
**Analogs found:** 31 / 34

Every analog path below was checked with `git ls-files` and is tracked source. RESEARCH.md already records most pins by line number. This map adds the code to copy and does not repeat every pin.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/generate-catalog.ts` (extend: emit `docs/reference/**`) | generator (build script) | transform, file-I/O | itself (`scripts/generate-catalog.ts`) + `scripts/generate-host-entries.ts` (multi-file output) | exact |
| `scripts/catalog-freshness.ts` (rewrite to a tree gate) | freshness gate | batch compare | `scripts/host-entries-freshness.ts` (SET then BYTES) + `scripts/guarantees-freshness.ts` (`jsImportClosure` mirror) | exact |
| `scripts/catalog-freshness.test.ts`, `scripts/generate-catalog.test.ts` (extend) | test | — | `scripts/host-entries-freshness.test.ts` | exact |
| `docs/reference/README.md`, `docs/reference/agents/*.md`, `docs/reference/skills/*.md` | generated docs | generator output | `docs/catalog/README.md` (to be retired) | exact |
| `docs/catalog/README.md` (retire or one-line pointer, D-16a) | generated docs | — | — | n/a |
| `install/kit-source.ts` (+ `shippedDocs()`, `CHECKOUT_ONLY_DOCS`) | utility (source derivation) | file-I/O walk | `srcSkillNames()` in `install/kit-source.ts:195-205` | exact |
| `install/install.ts` `copyKit` (loop over `agent-factory` and `docs`) | installer | file-I/O | `copyKit` itself, `install/install.ts:4859-4935` | exact |
| `install/install-marker.ts` (`KIT_ENTRY_PATHS`, backup name) | schema | validation | `install/install-marker.ts:912-916, 1156-1178` | exact |
| installer tests to re-pin (`installer-fs-census`, `installer-kit-home`, `installer-prune`, `installer-write-set`, `ledger`, `marker-binding`, `installer-dry-run`) | test | — | themselves | exact |
| `scripts/check-public-docs-vocabulary.ts` (new `docs` corpus part, pin) | gate | batch scan | `skillsDocMembers()` part, `:480-490` and `:510-519` | exact |
| `scripts/check-banned-claims.ts` (`BANNED_CLAIM_SCAN_COUNT` only) | gate | batch scan | 42-07 pin move history comment | exact |
| `scripts/audit-model.ts` (`CLAIM_STATUSES` + `retired`) | model | parse | `audit-model.ts:131` | exact |
| `scripts/check-claim-anchors.ts` (retired: absence check, skip bijection) | gate | batch compare | unanchorable PRESENCE check, `check-claim-anchors.ts:422-460` | exact (inverse) |
| `scripts/check-claim-anchors.test.ts`, `scripts/audit-model.test.ts` | test | — | themselves | exact |
| `scripts/check-audit-register.ts` (`SAFETY_CLAIM_HOMES` C-28-001 → `docs/concepts.md`, `CLAIM_KIND_CARDINALITY`) | gate | config pin | `check-audit-register.ts:198, 243-245` | exact |
| `docs/audit/28-claim-registry.md` (moved rows, retired rows, new C-28-048+, new "retired" section) | registry doc | — | row `C-28-002` at `:92-103`; § D-18 at `:831` | exact |
| `scripts/check-story-docs.ts` + `.test.ts` (new: GAP-D1, CLAUDE.md `/grug`, shipped links) | gate | batch scan | `scripts/vacuity.ts` `reportMeasured` + `scripts/check-public-docs-vocabulary.ts` shape | role-match |
| `package.json`, `.github/workflows/ci.yml` (wire `check:story-docs`) | config | — | `"check:public-docs"` line, `package.json:18` | exact |
| `README.md` (rewrite) | public doc | — | current `README.md` (anchor form, guarantees pointer) | exact |
| `docs/README.md`, `docs/concepts.md`, `docs/how-it-works.md`, `docs/usage.md` (new) | public doc | — | `docs/skills.md` (42-07 joined page), `agent-factory/README.md` sections that move | role-match |
| `agent-factory/README.md` (shrink to pointers, D-10, D-28) | kit doc | — | itself | exact |
| `docs/faq.md`, `docs/skills.md` (sweep, absolute URL for `.planning/` link) | public doc | — | itself | exact |
| `examples/01..05-*.md` (v3 rewrite, D-18/D-19 banner) | public doc | — | `examples/02-brownfield-bootstrap.md:1-8` (banner) | exact |
| `scripts/trace-instructions.test.ts` (add `examples/` to both listings, 80 → 85) | test | — | `scanSet()` / `secondListing()` `:76-101`, pin `:455` | exact |
| `install/host-entry-docs.test.ts` (START-1, CAUTION-1, LIVE-3 → `docs/usage.md`) | test | — | `:792-854` | exact |
| `CLAUDE.md`, `.planning/PROJECT.md:11` (`/grug` fix) | project doc | — | — (keep line 83 fixed, Pitfall 6) | n/a |
| `agent-factory/packaging/subagent.frontmatter.md:306` (only if CLAUDE.md line 83 moves) | kit doc | — | itself | exact |
| `scripts/dead-vocabulary.ts` (optional: add `"simple software factory"` to `RETIRED_PROSE_FORMS`) | config | — | `dead-vocabulary.ts:74-77` | exact |
| `.gitattributes`, `vitest.config.ts`, comments naming `docs/catalog/` | config | — | `.gitattributes:17` | exact |
| `CHANGELOG.md` `Unreleased` | doc | — | existing Unreleased block | exact |
| `brand/` cleaned art file (optional, D-26) | brand | — | `brand/wordmark.svg` siblings | partial |
| `43-UAT.md` + scratchpad UAT driver (not committed under `scripts/`) | evidence | event stream parse | `scripts/capture-live.ts` exports | role-match |
| mermaid diagram in `docs/how-it-works.md` | doc | — | none in repo | none |

## Pattern Assignments

### `scripts/generate-catalog.ts` (generator, transform)

**Analog:** itself. Keep it a top-level script that nothing imports (`frontmatter.test.ts:5320-5327`).

**Imports** (`scripts/generate-catalog.ts:88-98`): `node:fs` (`readFileSync`, `writeFileSync`, `readdirSync`), `node:path` `join`, the three frontmatter symbols only (`parseFrontmatter`, `sectionEndIndex`, `unfencedHeadingIndex`; pinned by `check-foundation-guards.test.ts:855-858`), and `isNumberedWorkflowFile` from `./kit-model.js`. New imports allowed: kit-model listers (`listRoles`, `listWorkflows`, `listRoleDisplayNames`, `listAgentAdapterSpecs`, `listPluginSkillAdapters`, `ROLE_COUNT`, `PLUGIN_SKILL_ADAPTER_COUNT`), `readRoleSkills` from `./role-skills-reader.js` (never `canonical-frontmatter.js`, Pitfall 10), `LEVELS` from `./model-tiers.js`, `HOST_TOOLS`/`launchInvoke`/`launchLiveNote` from `../install/host-tools.js`.

**Fixed literal output paths** (`:101-104`), to extend with literal `docs/reference` paths:
```ts
const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "docs/catalog/README.md");
```

**Section extraction to reuse for the six sections** (`:186-191`):
```ts
function sectionBody(text: string, heading: string): string | null {
  const at = unfencedHeadingIndex(text, `## ${heading}`);
  if (at === -1) return null;
  const end = sectionEndIndex(text, at + 1, 2);
  return text.split("\n").slice(at + 1, end).join("\n");
}
```
Also reuse `firstSentence` (`:138`) and `cell()` escaping (`:150`) for every authored table cell.

**Emit pattern** (`:417-456`): build `lines: string[]`, a provenance header first, interpolated counts (`${roles.length}`), never typed counts, and a trailing `""` for exactly one final newline:
```ts
lines.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->");
...
lines.push(`| ${cell(r.name)} | ${r.tier} | ${cell(r.summary)} | [${r.link}](../../${r.link}) |`);
...
lines.push(""); // trailing element → exactly one final "\n"
writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(`generate-catalog: wrote ${roles.length} roles and ${workflows.length} workflows to ${OUT}`);
process.exit(0);
```
Change for Phase 43: build a `Map<relPath, text>` for every page first, then delete stray `.md` under `docs/reference/`, then write. Relative links: `../../../agent-factory/roles/x.md` from `agent-factory pages`, `../../` from the index.

**Ordering and fail-closed rules to keep** (`:380-410`): duplicate workflow `order` refused with `fail(...)`; roles sorted core first, then `localeCompare` on display name; workflows by numeric `order`. Keep the `readdirSync(WORKFLOWS_DIR).filter(isNumberedWorkflowFile).sort()` call byte for byte (`kit-model.test.ts:1141`). An unknown value is `UNKNOWN - verify`.

**Header comment style:** the file header (`:1-87`) records what a number or a construct was and why it was deleted. New header paragraphs follow that style: name the mechanism, never type a count.

---

### `scripts/catalog-freshness.ts` (freshness gate, tree compare)

**Analog A, the tree shape:** `scripts/host-entries-freshness.ts`.

Temp mirror and cleanup (`:72-88`):
```ts
const tmp = mkdtempSync(join(tmpdir(), "grugops-host-entries-fresh-"));
function cleanup(): void { rmSync(tmp, { recursive: true, force: true }); }
process.on("exit", cleanup);
function die(message: string): never { cleanup(); console.log(message); process.exit(1); }
```
Child spawn with `CHECK_ROOT` stripped (`:118-127`) and the fail-closed branch (`:129-136`): a non-zero exit is "FAILED ... refusing to report the entries as fresh".

`lstatOrNull` and `walk` (`:138-163`): links listed, never followed; unreadable is a named failure.

Empty regeneration refused (`:166-171`), then SET (`:179-204`):
```ts
const extra = committedSet.filter((rel) => !rendered.includes(rel));
const missing = rendered.filter((rel) => !committedSet.includes(rel));
...
lines.push(`STALE: ${rel} — EXTRA: committed in an entry directory, but the generator does not produce it`);
lines.push(`STALE: ${rel} — MISSING: the generator produces this entry but the tree does not carry it`);
```
Then BYTES (`:207-230`) with `committed.equals(fresh)` and a non-regular-file finding, and the measured PASS line (`:237-241`):
```ts
console.log(`Host entries fresh: ${rendered.length} ... compared, 0 byte difference(s), entry set equal.`);
```
For Phase 43 the committed set is the whole `docs/reference/` tree, plus the two-sided count check (agent pages = `ROLE_COUNT`, skill pages = `PLUGIN_SKILL_ADAPTER_COUNT`).

**Analog B, the mirror set:** `scripts/guarantees-freshness.ts:131-160`. Replace the hand list (`host-entries-freshness.ts:100 MIRRORED_SCRIPTS`) with:
```ts
let closure: readonly string[];
try {
  closure = jsImportClosure(ROOT, GUARANTEES_ENTRY_JS);
} catch (e) {
  cleanupAndRefuse(`the import closure of ${GUARANTEES_ENTRY_JS} could not be derived (${(e as Error).message}) — refusing to mirror a partial module graph.`);
}
for (const rel of closure) { const dst = join(tmp, rel); mkdirSync(dirname(dst), { recursive: true }); cpSync(join(ROOT, rel), dst); }
```
Then a hand-listed DATA set (`GUARANTEES_DATA_SOURCES` pattern) for `agent-factory/roles`, `agent-factory/workflows`, `skills/`, `.claude/skills/`, `.claude-plugin/plugin.json`, with a "proved it landed" check like `configsCopied === 0` refusal. Write the mirror `package.json` `{ "type": "module" }` (host-entries `:111`).

Keep the npm script name `freshness:catalog` (`package.json:40`); CI already calls it (`ci.yml:189`).

---

### `install/kit-source.ts` (+ `shippedDocs`, `CHECKOUT_ONLY_DOCS`)

**Analog:** `srcSkillNames` (`install/kit-source.ts:195-205`):
```ts
export function srcSkillNames(srcRoot: string): string[] | null {
  const root = join(srcRoot, ".claude", "skills");
  try {
    return readdirSync(root)
      .filter((name) => isDirFollowing(join(root, name)) && existsSync(join(root, name, "SKILL.md")))
      .sort();
  } catch {
    return null;
  }
}
```
Copy the contract: sorted POSIX relative paths, `null` on an unreadable root (fail loud), `[]` on an empty one. Respect `MAX_WALK_ENTRIES` (`:169`) and use `isFileFollowing`/`isDirFollowing` (`:174, :181`). The exclusion list carries a `why` per entry (RESEARCH Pattern 4). Per D-27 the list also covers `examples/`, so the rule is "shipped user docs = `docs/**/*.md` minus `CHECKOUT_ONLY_DOCS`, plus `examples/*.md`", declared once. `install/` must not import `scripts/`; `scripts/` may import this.

---

### `install/install.ts` `copyKit` and `install/install-marker.ts`

**Analog:** `copyKit` (`install/install.ts:4859-4935`). Copy per entry: record read (`readKitHomeRecord`), `owns(kitHome.ledger, GRUGOPS_HOME, KIT_ENTRY_PATH, "kit")`, the three arms decided once:
```ts
const arm: "fresh" | "replace" | "backup" =
  atRoot === null ? "fresh" : owned !== null && owned.owned ? (retainBackup && !dirsSameContent(KIT_ROOT, source) ? "backup" : "replace") : "backup";
```
dry-run lines (`would-back-up`, `would-replace`, `would-copy`), never overwrite an existing backup, stage in `mkdtempSync(join(GRUGOPS_HOME, ".agent-factory.tmp-"))`. The docs entry stages file by file from `shippedDocs()` into `<tmp>/docs/<rel>`, not `cpSync` of `docs/`. Keep the literal `cpSync(join(GRUGOPS_SRC, "agent-factory"), ...)` source expression (`installer-fs-census.test.ts:495-498` pins it) and add a new census row for the docs copy.

**Marker schema** (`install/install-marker.ts:914-916, 1156-1178`):
```ts
export const KIT_ENTRY_PATH = "agent-factory";
const KIT_HOME_BACKUP_NAME = /^agent-factory\.bak\.\d{4}-...Z$/;
case "kit":
  if (e.path !== KIT_ENTRY_PATH) return `a kit entry may name only ${KIT_ENTRY_PATH}`;
```
Generalize to a closed `KIT_ENTRY_PATHS = ["agent-factory", "docs"]`, backups `of` one of them, named `<entry>.bak.<ISO>`. An old record that names only `agent-factory` must still parse.

---

### `scripts/check-public-docs-vocabulary.ts` (new corpus part)

**Analog:** the `skills` part from plan 42-07.

Part member function (`:480-490`), the named-member refusal:
```ts
function skillsDocMembers(): string[] {
  if (!existsSync(abs(SKILLS_DOC))) {
    DERIVATION_REFUSALS.push(`${SKILLS_DOC} is a NAMED member of the public-docs scan set and does not exist ... A missing document is not a clean one`);
    return [];
  }
  return [SKILLS_DOC];
}
```
Parts list (`:510-519`); add `{ name: "docs", members: ... }` and widen the name union. Members are `shippedDocs()` minus `docs/GUARANTEES.md` and `docs/skills.md` (already singleton parts; RESEARCH Pattern 4 overlap rule). `examples/` is already the `examples` part.

Pin move with a dated history comment read off the gate's RED line (`:610-636`):
```ts
// MOVED 11 -> 12 ON 2026-11-16 IN PLAN 42-07, AND THE ENTRANT IS NAMED: `docs/skills.md` ...
//   FAIL  the public-docs scan set derived 12 document(s), expected exactly 11
//         (root 4, examples 5, kitReadme 1, guarantees 1, skills 1)
export const PUBLIC_DOCS_SCAN_COUNT = 12;
```
Same pattern for `BANNED_CLAIM_SCAN_COUNT` in `scripts/check-banned-claims.ts:1609`.

---

### `scripts/audit-model.ts` + `scripts/check-claim-anchors.ts` (retired status, D-25)

**Status list** (`scripts/audit-model.ts:131`):
```ts
export const CLAIM_STATUSES = ["true", "overstated", "false", "dropped"] as const;
```
Add `"retired"`; write the reasoning above it in the same style as the comment at `:125-130` about why `dropped` cannot launder `false`.

**Scanned documents** (`audit-model.ts:1935-1937`): `anchoredDocs` derives files from rows. Retired rows must be excluded from the anchor bijection there or at the caller.

**Absence check:** copy the unanchorable PRESENCE loop and invert it (`check-claim-anchors.ts:438-460`):
```ts
for (const claim of unanchorable.slice().sort((a, b) => (a.id < b.id ? -1 : 1))) {
  const target = join(ROOT, claim.file);
  if (!existsSync(target)) { fail(`${claim.id} names \`${claim.file}\`, which does not exist ...`); continue; }
  const bytes = readFileSync(target);
  comparisons += 1;
  if (!bytes.includes(Buffer.from(claim.verbatim, "utf8"))) { fail(`... verbatim text is not present in the file ...`); }
}
```
For `retired`: fail when `bytes.includes(...)` is true, and fail when an anchor `<!-- claim: <id> -->` is still in the file. Count retired rows in the PASS line next to the markdown/unanchorable counts (`:552-556`). The `dropped`-on-non-safety refusal (`:305-318`) stays as is.

**Registry doc:** new section beside § "A dropped claim is replaced in place (D-18)" (`docs/audit/28-claim-registry.md:831`); update the `status` field definition at `:41`. Row form to copy (`:92-103`): `### C-28-NNN`, bullets `file`, `line`, `kind`, `depends_on`, `status`, `mechanism`, then the fenced verbatim.

---

### `scripts/check-story-docs.ts` (new gate)

**Analog:** `scripts/vacuity.ts:46-98` (`Measured<T>`, `reportMeasured`) for each of the three checks, and the derived-scan-set style of `check-public-docs-vocabulary.ts`. Each check builds:
```ts
FAILS += reportMeasured({ label, visited /* counted by the loop */, expected /* derived */, findings }, emit, render);
```
`reportMeasured` already refuses zero visited and short sets, so the gate cannot pass vacuously. Entry guard: `isEntrypoint` from `./is-entry.js` (as `check-nul-bytes.ts:174`) so the test can import pure functions. Scan sets: `publicDocsCorpus()` ∪ `install/README.md` (GAP-D1), `CLAUDE.md` (the `/grug` regex in RESEARCH Pattern 7), `shippedDocs()` ∪ `agent-factory/README.md` (links, using `fencedLineFlags`; this moves the frontmatter consumer pin in `check-foundation-guards.test.ts:813-858`).

**Wiring** (`package.json:18` form):
```json
"check:public-docs": "tsc --outDir .tmp-build && node scripts/check-public-docs-vocabulary.js",
```
Add `"check:story-docs"` the same way, a ci.yml step beside the public-docs step, and a test that reads both wirings (as `host-entries-freshness.test.ts` does). Commit the built `.js` (`npm run freshness`, `check:build-parity`).

---

### `README.md` and new `docs/*.md` pages (hand-written public docs)

**Analog:** current `README.md`. Anchor form, one line directly above the verbatim text (`README.md:3-4`; grammar `audit-model.ts:1905`):
```md
<!-- claim: C-28-001 -->
grugops is a file-based agent factory for software delivery. ...
```
Keep the generated `<!-- generated: guarantees-pointer -->` line verbatim (`POINTER_DOCS`, `generate-guarantees.ts:181-185`). Keep C-28-004..006 and C-28-009 verbatim, including leading spaces on list items. Do not type counts or name `scripts/model-tiers.ts`. Name all hosts or none (`install/host-tools-prose.test.ts`). Codex invocation is `$grugops`.

**Page-join order** (42-07 precedent, RESEARCH Pattern 5): commit N adds the corpus part and moves the pins (RED with the named-member message); commit N+1 writes the page; registry rows land in the same commit as the anchored text.

The per-host start table moves from `README.md` to `docs/usage.md` together with `install/host-entry-docs.test.ts:792-854` (START-1, CAUTION-1) and LIVE-3 (`:584`), in one commit.

---

### `examples/01..05-*.md`

**Banner analog** (`examples/02-brownfield-bootstrap.md:1-8`):
```md
# Example: Brownfield bootstrap

> Illustrative run — expected output, not a captured session
```
01 and 03 get this banner plus: "Based on a real run captured 2026-06-03 on v1.0; updated to v3 by hand." and a link to commit `ab0cda98`. Keep the four board rows transcribed in `scripts/board-corpus.ts:157-158, 1982-2023` byte-identical, or update their "source line N" notes.

### `scripts/trace-instructions.test.ts`

**Analog:** itself (`:76-101`, pin `:455`):
```ts
function scanSet(): string[] {
  return gitLsFiles([KIT_DIR, SUBSTRATE]).filter((p) => p.endsWith(".md")).sort();
}
...
files.push(...gitLsFiles([SUBSTRATE]));
...
const SCAN_SET_SIZE = 80;
```
Add `examples` to both listings in the commit after the five rewrites, move 80 → 85 with a dated history line, and mark the 37 deferred item resolved.

---

### UAT driver and `43-UAT.md`

**Analog:** `scripts/capture-live.ts` exports `parseFrames` (`:583`), `spawnObservations` (`:647`), `noteRoute` (`:898-910`), `authorStamps` (`:1182`), `redactText` (`:1311`), `homeSpellings` (`:1352`), `runCommandBuffered` (`:1668`). Import the committed `.js` from a scratchpad driver. Do not add an uncommitted `.js` under `scripts/`. `43-UAT.md` follows `.planning/phases/39-.../39-UAT.md`, starting as `pending human`.

## Shared Patterns

### Derived, never typed
**Source:** `scripts/kit-model.ts` (`ROLE_COUNT` `:122`, `PLUGIN_SKILL_ADAPTER_COUNT` `:167`, listers). Generated text interpolates `.length`; hand text types no count. **Apply to:** the generator, the freshness gate, the shipped-docs list, the story gate, every docs page.

### Fail closed, report what was visited
**Source:** `scripts/vacuity.ts:66-98` and the "refusing to report ... as fresh" `die()` form in `scripts/host-entries-freshness.ts:84-88, 129-136`. **Apply to:** all new and rewritten gates.

### Pin moves read off the RED line
**Source:** `scripts/check-public-docs-vocabulary.ts:610-636` history comment. **Apply to:** `PUBLIC_DOCS_SCAN_COUNT`, `BANNED_CLAIM_SCAN_COUNT`, `SCAN_SET_SIZE`, `CLAIM_KIND_CARDINALITY`, the frontmatter consumer pin.

### TS source, committed JS
**Source:** every `scripts/*.ts` with its `.js`; `package.json` `tsc --outDir .tmp-build && node scripts/<x>.js`. **Apply to:** each changed or new script; run `npm run freshness` and `npm run check:build-parity`.

### Comments record history, never a fresher number
**Source:** `scripts/generate-catalog.ts:14-28` ("WHAT STOOD HERE AND WAS DELETED RATHER THAN CORRECTED"). **Apply to:** header comments of the changed scripts and the registry's new section.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| Mermaid block in `docs/how-it-works.md` | doc | — | No mermaid in the repo yet. Use a GitHub fenced `mermaid` block plus the same steps as numbered text (D-12). |
| `CLAUDE.md` `/grug` edits | project doc | — | Hand edit. Keep line 83 on the same line or update `agent-factory/packaging/subagent.frontmatter.md:306` (Pitfall 6). Fix `.planning/PROJECT.md:11` too. |
| Cleaned README art (D-26) | brand | — | Source is the untracked draft `brand/readme-art.txt`; never commit it as is. |

## Metadata

**Analog search scope:** `scripts/`, `install/`, `docs/`, `examples/`, `README.md`, `package.json`, `.github/workflows/ci.yml`
**Files scanned:** about 20 opened. Most pins rely on RESEARCH.md line citations from the same day.
**Pattern extraction date:** 2026-11-17
