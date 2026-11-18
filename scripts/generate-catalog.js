// generate-catalog.ts — grugops reference generator (DOCS-01; plans 43-04 and 43-05, D-13, D-15, D-16,
// D-17).
//
// Reads the finished kit (agent-factory/roles + agent-factory/workflows) and the plugin skills
// (skills/<op>/SKILL.md, with .claude-plugin/plugin.json) and emits the reference tree under
// docs/reference/:
//
//   - docs/reference/README.md — the index: one roles table, one skills table and one workflows
//     table, each row linking to its source, and each role and skill row linking to its page;
//   - docs/reference/agents/<role-stem>.md — one page per role (D-13), where the stem is the role
//     file name without `.md`;
//   - docs/reference/skills/<op>.md — one page per plugin skill (D-15), where the op is the skill's
//     directory name under skills/.
//
// (Until plan 43-04 this generator wrote one file, docs/catalog/README.md. That folder is retired:
// the index above replaces it, D-16, D-16a.)
//
// Every page is generated, never hand-maintained: re-running this script reproduces a byte-identical
// tree (the freshness gate scripts/catalog-freshness.ts depends on that). Mirrors the proven shape
// of generate-asvs-checklist.ts: fixed literal paths, fail-closed load, deterministic
// lines.join("\n") emit, provenance header, single trailing newline, clear voice.
//
// Membership: the role set is kit-model listRoles() (`.md`, not `_`-prefixed, so
// _role-switch-protocol.md is excluded, D-03), so a role added later gets a page by existing (D-17);
// the skill set is kit-model listPluginSkillAdapters(), so a plugin skill added later gets a page the
// same way; workflows/ keeps every numbered file isNumberedWorkflowFile admits, in the numeric order
// each declares. Workflows stay index rows with no page of their own (D-16).
//
// ALL PAGES ARE BUILT BEFORE ANY IS WRITTEN. The pages are collected into one map from relative
// path to text. Nothing touches the disk until every page is built and every page path has been
// checked; only then are stray `.md` pages under docs/reference/ deleted (regular files only,
// found with lstat, never through a link) and the pages written. A refusal therefore leaves every
// page under docs/reference/ byte-unchanged.
//
// HOW MANY OF EACH THERE ARE IS DELIBERATELY NOT WRITTEN IN THIS FILE (round 6, plan 29-46 — WR-03).
// The two cardinalities are held by ROLE_COUNT and WORKFLOW_COUNT in scripts/kit-model.ts, pinned
// TWO-SIDED in guard_kit_counts so that a smaller kit and a larger kit BOTH fail red. A name does not
// rot, and it points at the thing an assertion already holds; a number typed beside a mechanism is a
// second declaration of the same fact with nothing behind it, which is this repository's named second
// systemic failure mode — set-literal drift, wearing a sentence.
//
// WHAT STOOD HERE AND WAS DELETED RATHER THAN CORRECTED. Statements in this module used to give the
// workflow corpus a size and an order range, and they went stale while the range-free regex below —
// which is the actual contract — went on being right. A parenthetical here also described hand-written
// ROLES/WORKFLOWS arrays in validate-agent-factory.ts; that file derives both sets through kit-model
// now, so the construct those words described no longer exists. Both are the convention this file
// states three paragraphs down, applied to itself: a comment that outlives its construct is a defect,
// and so is one that outlives its count. The remedy for a stale number is to delete it, never to type
// a fresher one in the same place.
//
// Read-only (D-01): name from the `# Role:` / `# Workflow:` H1; one-line summary from the first
// sentence of `## One job` (roles) / `## When to use` (workflows); tier/order/cadence read through
// the ONE frontmatter authority. No edits to any kit file, no new frontmatter fields.
//
// THE FRONTMATTER GRAMMAR IS scripts/frontmatter.ts, AND THERE IS NO SECOND ONE IN THIS FILE.
// This file used to carry its own ten-line `parseFrontmatter` — a flat `key: value` slice+regex — and
// that duplicate is what gap G-29-1 named (29-UAT.md, plan 29-40, closing V-29-35-01). Its sibling
// generator `generate-role-adapters.ts` was converted to the authority in plan 27-23 (WR-03) and
// records the same eight-line duplicate in its own header; THIS file was simply missed by that
// conversion, and the two copies were the same defect. Per D-24 a duplicate is DELETED rather than
// widened, parameterised or flag-guarded: a weaker second opinion that still votes is worse than
// none, and one authority per predicate is the rule this phase was founded on.
//
// MEASURED BEFORE THE CHANGE, over the 17 roles and 19 workflows this generator reads (plan 29-40,
// in session, against the committed `scripts/frontmatter.js`): 0 keys the deleted `[A-Za-z_]+` charset
// would have skipped, 0 documents declaring any key twice, 0 empty values for a key read here, 0
// documents with no frontmatter fence, 0 CRLF documents, 0 key-set differences and 0 documents the
// authority refuses. So the divergence was LATENT, not live, and `docs/catalog/README.md` (then
// this generator's output) was byte-identical across the change. That is what makes the shape
// difference — not a rename — the thing worth holding, and it is held by three planted cases in
// scripts/generate-catalog.test.ts.
//
// WHAT THE SHAPE CHANGE BUYS. `Parsed<FrontmatterKeys>` is a discriminated result over a
// `Map<string, string[]>`, so this generator can now tell THREE facts apart that the deleted copy
// conflated into one:
//
//   1. An UNREADABLE document. The deleted fence match was anchored at byte 0 and required a closing
//      delimiter, so an unterminated block simply did not match and the parser returned an EMPTY map.
//      This generator then reported `role tier must be core|enterprise, found ""` about a file whose
//      frontmatter could not be read at all. A parse artifact is never a verdict (frontmatter.ts
//      header); the `ok: false` arm is branched on here.
//   2. A key declared TWICE. The deleted copy wrote into a plain object, so the LAST declaration won
//      and the first vanished unreported. Measured on a scratch mirror: `tier: core` followed by
//      `tier: enterprise` in `qe-e2e.md` published that CORE role in the enterprise group and exited
//      0. The authority retains every occurrence, so a count other than exactly one is refused.
//   3. A key ABSENT versus a key present and EMPTY. Absence is legal for `cadence:` and only for
//      `cadence:` (D-09) — those workflows' cell reads `UNKNOWN - verify`, never a fabricated value.
//
// (A document with NO frontmatter fence at all is NOT in that list, deliberately: the authority reads
// it as a legal success carrying no keys, exactly as the deleted copy did. Only a block that opens and
// then cannot be read is a refusal.)
//
// No fabrication (D-09): workflows 12 (release) and 13 (incident) carry no `cadence` — their cadence
// cell reads `UNKNOWN - verify`, never a fabricated `cadence: both`.
//
// Node stdlib ONLY — node:fs + node:path. ZERO npm dependencies. Invocation takes no arguments:
//
//   node scripts/generate-catalog.js    # exit 0 on success, 1 on any structural miss
//
// Read/write-only by construction (path-traversal mitigation, ASVS V12, mirrors both analogs):
// ROLES_DIR/WORKFLOWS_DIR/OUT_DIR are FIXED literal paths joined to the repo root (the script dir's
// parent). None is ever derived from argv, env, or file content.
//
// SKILL PAGES (plan 43-05, D-15). Each page says what the skill does (its frontmatter `description`),
// how to start it on each host, the workflows its body names, the roles those workflows involve plus the
// roles its body names, its `allowed-tools`, and its source. Nothing on a skill page is typed here:
//
//   - the host rows come from HOST_TOOLS in install/host-tools.ts, in registry order. For the host that
//     spawns roles (Claude Code) the row gives the standalone command, `/` plus the `name` of the one
//     `.claude/skills/*/SKILL.md` whose `description` equals the plugin skill's, and the plugin command,
//     `/` plus the plugin.json `name`, `:` and the plugin skill's `name`. A host that loads roles in turn
//     reaches every skill through the dispatcher (the plugin skill whose `name` equals the plugin.json
//     `name`), so its row gives the registry's `invoke` text, prefixed `Through the dispatcher: ` on every
//     page but the dispatcher's own. Each row's first cell is the host's registry name in plain text,
//     never bold: install/host-entry-docs.test.ts counts bold-host tables as launch tables;
//   - the workflows are the `agent-factory/workflows/<file>` paths the skill body names, each checked
//     against kit-model listWorkflows();
//   - the roles are the role display names in those workflows' `## Agents involved` bullets of the form
//     `- <Display Name> — `, plus each non-underscore `agent-factory/roles/<file>` the body names, each
//     checked against the role set.
//
// Fail closed: a kit file with no `# Role:`/`# Workflow:` H1, an UNREADABLE frontmatter block, a
// required field absent or declared twice, a directory read failure, or a page path that is a link
// or another non-regular file prints a finding to stderr and process.exit(1) WITHOUT writing — every
// page is built first, so a partial or garbled reference tree never ships. Each of those is its OWN sentence; two facts printing one message is the conflation
// plan 29-40 deleted.
import { lstatSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync, } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter, sectionEndIndex, unfencedHeadingIndex, } from "./frontmatter.js";
// The rule that decides which files in the workflow directory are corpus members. It is DECLARED in
// scripts/kit-model.ts beside WORKFLOW_COUNT and asked here; this module states no shape rule of its
// own. See that declaration for why it is range-free and why it cannot live in either consumer.
import { isNumberedWorkflowFile, listPluginSkillAdapters, listRoles, listSkillAdapters, listWorkflows, } from "./kit-model.js";
// The host registry: the one list of supported hosts, each with its display name, how it dispatches roles
// and how a user starts grugops on it. install/host-tools.ts is pure data and imports nothing, and this
// scripts-to-registry edge is the direction that module allows.
import { HOST_TOOLS } from "../install/host-tools.js";
// ── Fixed literal paths (read/write-only by construction — never argv/env/content-derived) ───
const ROOT = join(import.meta.dirname, "..");
const ROLES_DIR = join(ROOT, "agent-factory/roles");
const WORKFLOWS_DIR = join(ROOT, "agent-factory/workflows");
const OUT_DIR = join(ROOT, "docs/reference");
// The plugin manifest: its `name` is the plugin command namespace and its `repository` is the base of
// each skill page's source URL (plan 43-05). Read as data, never imported.
const PLUGIN_JSON = join(ROOT, ".claude-plugin/plugin.json");
// Page paths are relative to OUT_DIR, POSIX-spelled, and built only from these two literals and a
// role file name listRoles() returned (never from file content).
const INDEX_PAGE = "README.md";
const AGENTS_SUBDIR = "agents";
const SKILLS_SUBDIR = "skills";
// The file name every plugin skill entry carries (kit-model's shape rule for listPluginSkillAdapters).
const SKILL_FILE = "SKILL.md";
const PROVENANCE = "<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->";
// ── Fail-closed helper (a structural miss is a finding, never an unhandled throw) ─────────────
// The VARIABLE carries the `=> never` annotation, not just the arrow — copied verbatim from
// generate-role-adapters.ts:99 and for the same reason. TypeScript only lets a never-returning call
// narrow control flow when the callee is a function declaration or a const with an explicit TYPE
// annotation. That narrowing is what lets the parse-failure branches below read the authority's
// success arm without a cast, instead of a second `ok` test that would read as a fallback for a state
// that cannot be reached.
const fail = (m) => {
    console.error(`  ERROR    ${m}`);
    process.exit(1);
};
// ── The frontmatter grammar is NOT here (plan 29-40, G-29-1 / V-29-35-01) ──────────────────────
// A private flat `key: value` parser stood at this position: a fence match anchored at byte 0 and
// requiring a closing delimiter, a key line whose character class admitted letters and underscores
// only, last-wins assignment into a plain object, and an empty map returned for a document it could
// not read. It is DELETED, not moved and not renamed — see this file's header for the three facts it
// conflated and for the divergence measurement taken before it went. What replaced it is a call to
// the ONE exported authority at each of the two sites that needs it.
//
// AND THE RETIRED PATTERNS' SPELLINGS WENT WITH THE PATTERNS, DELIBERATELY. Both regex literals were
// written out here in this plan's first draft, and `scripts/frontmatter.test.ts`'s D-50 IN-05
// classifier — a SOURCE-TEXT scan with no comment stripping — went on reporting this module as a
// local frontmatter grammar site on the strength of the prose alone. The facts above are what a later
// reader needs; the pattern text is what a scanner reads as a live construct. This is the convention
// plan 29-35 set eleven lines up in this same file: a comment that outlives its construct is a defect,
// and so is one that resurrects it for a reader that cannot tell prose from code.
// ── First-sentence summary: split on ". " (period-SPACE), KEEP its period, never re-append ────
// Splitting on bare "." would truncate `AGENTS.md` (agents-md-scribe) and `OWASP ASVS 5.0`
// (security-audit). `indexOf(". ") === -1` (e.g. incident-responder's single-sentence One job) returns
// the line as-is — which already ends in `.`; appending would produce `..`.
function firstSentence(body) {
    const line = body.trim().split("\n")[0].trim(); // first non-empty line of the section body
    const dot = line.indexOf(". "); // sentence boundary = period-space
    return dot === -1 ? line : line.slice(0, dot + 1);
}
// ── Escape free-text content before it goes into a pipe-delimited table cell (WR-03) ──────────
// A literal `|` in an authored first sentence / H1 / cadence value would inject a spurious column;
// a stray newline would break the row. Backslash-escape `\` first (so we don't double-escape the
// `|` escapes we add next), then `|`, then flatten any newline to a space. Applied ONLY to authored
// content cells (name, summary, cadence) — never to the Source link column, which is constructed
// from a controlled file path and a relative URL we build ourselves.
function cell(s) {
    return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
// ── The body of a `## <heading>` section — ASKED, never answered here ──────────────────────────
// THIS MODULE DOES NOT OWN THE SECTION-EXTENT QUESTION. "Which line is this section's heading, and
// which line ends it" is asked once and answered once, in scripts/frontmatter.ts, for every module
// in this tree. This file asks it; it does not answer it.
//
// WHAT WAS DELETED HERE AND WHY (plan 29-35, LANG-07 / 29-REVIEW § WR-08). This function used to
// build a private `new RegExp` lookahead over the whole document — a THIRD grammar over bytes this
// tree has ONE parser for, duplicated byte-for-byte into scripts/generate-role-adapters.ts. It
// disagreed with the authority on two axes at once. It was FENCE-BLIND: a `## ` line quoted inside a
// fenced example terminated the capture early. And it was LEVEL-BLIND: its terminator named level
// TWO only, so a level-ONE heading did not close the section and the capture ran on into the next
// top-level section. That second half is byte-for-byte the defect scripts/voice-model.ts shipped at
// exit 0 for a whole milestone, and correcting it cost this phase two plans. Per D-24 a duplicate is
// DELETED rather than taught the two rules it was missing: a widened third copy is still a third
// copy, and one authority per predicate is the rule this phase was founded on.
//
// (The retired comment explaining that grammar's `$(?![\s\S])` branch went with the pattern it
// explained. A comment that outlives its construct is the defect one module over.)
//
// THE `-1` ANSWER IS LEGAL, AND IT IS NOT AN INDEX. It means "this document carries no such unfenced
// line", and it is handed back to the two call sites below as `null` — the value they already read
// as "section absent", so no caller changed. It is never defaulted to zero, never clamped with
// `Math.max`, and never swapped for another sentinel: `-1 + 1` is `0`, i.e. "from the top of the
// document", which is the widest possible answer to a question about a bounded section.
//
// FIVE IDENTICAL LINES ALSO LIVE IN scripts/generate-role-adapters.ts, AND THAT IS DELIBERATE — the
// reason is written here so a later reader does not merge them or duplicate them again. A shared
// wrapper would need a NEW module: both generators are top-level script code that writes files the
// moment it is imported, so neither may import the other, and adding a third exported name to
// frontmatter.ts would give one question a second name inside its own authority. Composing two
// exported authority functions at the point of use is not a duplicated grammar — it is two callers
// asking the same parser. Keep the two bodies in step; do not promote them to a fourth name.
function sectionBody(text, heading) {
    const at = unfencedHeadingIndex(text, `## ${heading}`);
    if (at === -1)
        return null;
    const end = sectionEndIndex(text, at + 1, 2);
    return text.split("\n").slice(at + 1, end).join("\n");
}
// ── Read + parse roles: the set is kit-model listRoles() (D-17; it drops `_`-prefixed files, D-03) ──
// listRoles() throws on an unreadable directory and on an empty set; either is a finding here.
let roleFiles;
try {
    roleFiles = listRoles(ROOT);
}
catch (e) {
    fail(`cannot list the role files in ${ROLES_DIR}: ${e.message}`);
}
const roles = [];
for (const file of roleFiles) {
    const path = join(ROLES_DIR, file);
    let text;
    try {
        text = readFileSync(path, "utf8");
    }
    catch {
        fail(`cannot read role file: ${path}`);
    }
    const h1 = text.match(/^# Role: (.+)$/m);
    if (!h1)
        fail(`${file}: no \`# Role:\` H1 — refusing to write a partial catalog`);
    // Tier, read through the ONE frontmatter authority (plan 29-40, G-29-1). Three distinct facts,
    // three distinct findings: an unreadable role file, a role declaring `tier:` twice, and a role whose
    // tier value is absent or outside core|enterprise are not the same problem and must not print the
    // same sentence.
    const parsed = parseFrontmatter(text);
    if (!parsed.ok) {
        // A PARSE FAILURE IS A PARSE ARTIFACT, NEVER A VERDICT (frontmatter.ts header). The deleted
        // grammar returned an EMPTY map on a block it could not read, so this generator blamed a
        // core|enterprise tier miss on a file whose frontmatter was never parsed at all.
        fail(`${file}: frontmatter is unreadable — ${parsed.reason}`);
    }
    const tiers = parsed.value.get("tier") ?? [];
    if (tiers.length > 1) {
        // The authority retains EVERY occurrence of a key. Picking one here would re-introduce the
        // last-wins reading the deleted grammar had, and a `tier:` declaration silently discarded is a
        // wrong published row: measured on a scratch mirror, `tier: core` followed by `tier: enterprise`
        // put a CORE role in the enterprise group at exit 0. The count is named so the author can see how
        // many were found rather than being told to look for "a duplicate" that may be three. This is the
        // same multiplicity rule generate-role-adapters.ts applies to `capabilities:` — the two generators
        // must not disagree about what a key declared twice means.
        fail(`${file}: ${tiers.length} \`tier:\` keys in one role frontmatter, expected exactly 1 — every occurrence is retained rather than last-wins, because silently discarding a declaration publishes the wrong tier; delete the extra key`);
    }
    // ZERO values is a MISSING key, and the refusal below is that finding — reached with an empty
    // `found ""`, which is byte-for-byte the sentence the pre-change generator printed for an absent
    // `tier:`. Wording retained VERBATIM: absence and an out-of-vocabulary value are distinguished by
    // the interpolated value, and the "unreadable" half that used to hide in here now has its own arm.
    const tier = tiers.length === 1 ? tiers[0].trim() : "";
    if (tier !== "core" && tier !== "enterprise") {
        fail(`${file}: role tier must be core|enterprise, found "${tier}"`);
    }
    const body = sectionBody(text, "One job");
    // `null` = section absent; `""`/whitespace-only = section present but empty. Guard both
    // explicitly so a `## One job\n\n<text>` layout (blank line after the heading) parses correctly
    // rather than tripping a falsy-`""` check (WR-01).
    if (body === null || body.trim() === "") {
        fail(`${file}: no \`## One job\` section — refusing to write a partial catalog`);
    }
    roles.push({
        file,
        stem: file.slice(0, -".md".length),
        name: h1[1].trim(),
        tier,
        summary: firstSentence(body),
        link: `agent-factory/roles/${file}`,
    });
}
// ── Read + parse workflows (every corpus member isNumberedWorkflowFile admits) ────────────────
let workflowFiles;
try {
    // ASK THE CONTRACT, DO NOT RESTATE IT (round 6, IN-01 — plan 29-54). The membership rule lives in
    // scripts/kit-model.ts beside WORKFLOW_COUNT, and this generator, the kit model's own lister and
    // this generator's oracle all ask that ONE declaration. A copy of the expression stood HERE and a
    // second copy stood in the oracle's corpus-cardinality case; widening one and leaving the others is
    // a disagreement that stays green for as long as the file set happens not to change, which is
    // exactly the drift class this module's header says it will not commit. A stray
    // README.md/_draft.md/note.md dropped into the dir is ignored rather than picked up and hard-failed
    // on the `# Workflow:` H1 check — mirrors the roles loop's `_`-prefix guard (WR-04, D-03).
    workflowFiles = readdirSync(WORKFLOWS_DIR).filter(isNumberedWorkflowFile).sort();
}
catch {
    fail(`cannot read workflows directory: ${WORKFLOWS_DIR}`);
}
const workflows = [];
// The declared order of each workflow, recorded against the FILENAME it was read from. The refusal
// below names files, and the filename is carried here rather than recovered from `WorkflowEntry.link`
// by stripping its directory prefix: a message assembled from a proxy for the thing it is reporting
// is one refactor away from naming the wrong file, and the fact is free at the point it is read.
const declaredOrders = [];
for (const file of workflowFiles) {
    const path = join(WORKFLOWS_DIR, file);
    let text;
    try {
        text = readFileSync(path, "utf8");
    }
    catch {
        fail(`cannot read workflow file: ${path}`);
    }
    const h1 = text.match(/^# Workflow: (.+)$/m);
    if (!h1)
        fail(`${file}: no \`# Workflow:\` H1 — refusing to write a partial catalog`);
    // Order + cadence, read through the ONE frontmatter authority — see the roles loop above for the
    // three-facts-three-findings rule this mirrors (plan 29-40, G-29-1).
    const parsed = parseFrontmatter(text);
    if (!parsed.ok) {
        fail(`${file}: frontmatter is unreadable — ${parsed.reason}`);
    }
    const orders = parsed.value.get("order") ?? [];
    if (orders.length > 1) {
        fail(`${file}: ${orders.length} \`order:\` keys in one workflow frontmatter, expected exactly 1 — every occurrence is retained rather than last-wins, because silently discarding a declaration publishes the wrong row position; delete the extra key`);
    }
    // `undefined` for a MISSING key, NOT `""`. The distinction is load-bearing and it is the one place
    // this adaptation could have changed behaviour silently: the pre-change code read `Number(fm.order)`
    // where `fm.order` was `undefined` for an absent key, and `Number(undefined)` is `NaN` → refused.
    // `Number("")` is `0` → an INTEGER, so collapsing absence to an empty string here would have turned
    // a refusal into a published `order: 0` row. The refusal's own wording is unchanged.
    //
    // DISCLOSED RESIDUAL, PRE-EXISTING AND DELIBERATELY NOT CHANGED HERE: a key that is PRESENT and
    // EMPTY (`order:`) still reaches `Number("") === 0` and publishes row 0. That is exactly what the
    // deleted grammar did, so preserving it is what makes the byte-identity claim honest rather than a
    // change hidden inside a conversion. Measured in session: 0 of the 19 workflows carry an empty
    // `order:`. Logged in the phase's deferred-items.md rather than fixed inside a gap-closure plan.
    const rawOrder = orders.length === 1 ? orders[0].trim() : undefined;
    const order = rawOrder === undefined ? Number.NaN : Number(rawOrder);
    if (!Number.isInteger(order)) {
        fail(`${file}: workflow order must be an integer, found "${rawOrder ?? ""}"`);
    }
    const body = sectionBody(text, "When to use");
    // `null` = section absent; `""`/whitespace-only = section present but empty. Guard both
    // explicitly (see the roles loop above — WR-01).
    if (body === null || body.trim() === "") {
        fail(`${file}: no \`## When to use\` section — refusing to write a partial catalog`);
    }
    const cadences = parsed.value.get("cadence") ?? [];
    if (cadences.length > 1) {
        fail(`${file}: ${cadences.length} \`cadence:\` keys in one workflow frontmatter, expected exactly 1 — every occurrence is retained rather than last-wins, because silently discarding a declaration publishes the wrong cadence; delete the extra key`);
    }
    // No fabrication (D-09): a genuinely absent cadence surfaces UNKNOWN - verify, never `both`.
    //
    // THIS IS THE ONE KEY IN THIS FILE FOR WHICH ABSENCE IS LEGAL, so it is the one place the D-09
    // no-fabrication rule is load-bearing — workflows 12 (release) and 13 (incident) declare no cadence
    // and their cell must read `UNKNOWN - verify`. Zero values is that legal absence, NOT a refusal.
    // A key that is present and EMPTY reaches the same cell by a different route: the deleted grammar
    // produced `""` and failed a truthiness test, the authority produces a one-element array holding
    // `""`. Both land on `UNKNOWN - verify`, and a conversion that quietly turned a legal absence into a
    // refusal would have broken D-09 at the only place it bites here. Held by a planted case.
    const rawCadence = cadences.length === 1 ? cadences[0].trim() : "";
    const cadence = rawCadence !== "" ? rawCadence : "UNKNOWN - verify";
    declaredOrders.push({ file, order });
    workflows.push({
        file,
        text: text,
        name: h1[1].trim(),
        order,
        cadence,
        summary: firstSentence(body),
        link: `agent-factory/workflows/${file}`,
    });
}
// ── No two workflows may declare the same `order` (round 6, IN-02 / residual 29-46 R2) ────────
// THE GATE IS AT THE POINT OF EFFECT: the property the workflow sort below depends on is enforced
// where the ordering is decided, not asserted in a comment beside it. `Array.prototype.sort` is
// stable, so two workflows sharing an order would keep the relative position readdirSync happened to
// hand them — making the published document depend on directory read order, differing between
// machines for no visible reason, with every freshness gate on the machine that wrote it green.
//
// The buckets are walked in ASCENDING VALUE order rather than in insertion order, so the refusal a
// given corpus produces is the same message on every machine — a fail-closed path whose wording
// depends on directory read order would reintroduce, in the message, the defect it refuses.
const orderBuckets = new Map();
for (const { file, order } of declaredOrders) {
    const bucket = orderBuckets.get(order);
    if (bucket)
        bucket.push(file);
    else
        orderBuckets.set(order, [file]);
}
for (const [value, files] of [...orderBuckets.entries()].sort((a, b) => a[0] - b[0])) {
    if (files.length > 1) {
        fail(`${files.join(", ")}: ${files.length} workflows declare \`order: ${value}\` — the workflows table is published in ascending order, so a shared value leaves their relative position decided by the directory read order and the generated document would differ between machines for no visible reason; give each workflow a distinct order`);
    }
}
// ── The plugin manifest: the plugin name and the repository URL (plan 43-05, D-15) ────────────
// Both are required strings. The repository is the base of every skill page's source link, so it must
// be an https URL with no trailing slash; anything else is refused rather than published as a link.
let pluginName;
let repository;
{
    let manifest;
    try {
        manifest = JSON.parse(readFileSync(PLUGIN_JSON, "utf8"));
    }
    catch (e) {
        fail(`cannot read the plugin manifest ${PLUGIN_JSON}: ${e.message}`);
    }
    const m = manifest;
    if (typeof m.name !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(m.name)) {
        fail(`.claude-plugin/plugin.json: \`name\` must be a kebab-case string, found ${JSON.stringify(m.name)}`);
    }
    if (typeof m.repository !== "string" || !/^https:\/\/\S+[^/]$/.test(m.repository)) {
        fail(`.claude-plugin/plugin.json: \`repository\` must be an https URL with no trailing slash, found ${JSON.stringify(m.repository)}`);
    }
    pluginName = m.name;
    repository = m.repository;
}
let pluginSkillFiles;
try {
    pluginSkillFiles = listPluginSkillAdapters(ROOT);
}
catch (e) {
    fail(`cannot list the plugin skills: ${e.message}`);
}
const skills = [];
for (const rel of pluginSkillFiles) {
    const sourceRel = `skills/${rel}`;
    const op = rel.slice(0, -`/${SKILL_FILE}`.length);
    if (!rel.endsWith(`/${SKILL_FILE}`) || op === "" || op.includes("/")) {
        fail(`${sourceRel}: a plugin skill must sit one directory below skills/ — refusing to guess its page name`);
    }
    let text;
    try {
        text = readFileSync(join(ROOT, "skills", ...rel.split("/")), "utf8");
    }
    catch {
        fail(`cannot read plugin skill file: ${sourceRel}`);
    }
    // Read through the ONE frontmatter authority; the three-facts-three-findings rule of the roles loop
    // applies (an unreadable block, a key declared twice, a key absent are three different findings).
    const parsed = parseFrontmatter(text);
    if (!parsed.ok) {
        fail(`${sourceRel}: frontmatter is unreadable — ${parsed.reason}`);
    }
    const one = (key) => {
        const values = parsed.value.get(key) ?? [];
        if (values.length > 1) {
            fail(`${sourceRel}: ${values.length} \`${key}:\` keys in one skill frontmatter, expected at most 1 — every occurrence is retained rather than last-wins; delete the extra key`);
        }
        return values.length === 1 ? values[0].trim() : undefined;
    };
    const name = one("name");
    if (name === undefined || name === "")
        fail(`${sourceRel}: no \`name:\` in the skill frontmatter`);
    const description = one("description");
    if (description === undefined || description === "") {
        fail(`${sourceRel}: no \`description:\` in the skill frontmatter — refusing to write a page that cannot say what the skill does`);
    }
    // No fabrication (D-09): an absent or empty allowed-tools reads UNKNOWN - verify.
    const tools = one("allowed-tools");
    skills.push({
        op,
        name: name,
        description: description,
        allowedTools: tools === undefined || tools === "" ? "UNKNOWN - verify" : tools,
        text: text,
        sourceRel,
    });
}
let twinFiles;
try {
    twinFiles = listSkillAdapters(ROOT);
}
catch (e) {
    fail(`cannot list the standalone skill twins: ${e.message}`);
}
const twins = [];
for (const rel of twinFiles) {
    const twinRel = `.claude/skills/${rel}`;
    let text;
    try {
        text = readFileSync(join(ROOT, ".claude", "skills", ...rel.split("/")), "utf8");
    }
    catch {
        fail(`cannot read standalone skill twin: ${twinRel}`);
    }
    const parsed = parseFrontmatter(text);
    if (!parsed.ok) {
        fail(`${twinRel}: frontmatter is unreadable — ${parsed.reason}`);
    }
    const names = parsed.value.get("name") ?? [];
    const descriptions = parsed.value.get("description") ?? [];
    if (names.length !== 1 || names[0].trim() === "") {
        fail(`${twinRel}: ${names.length} \`name:\` keys in the twin frontmatter, expected exactly 1 with a value`);
    }
    if (descriptions.length !== 1) {
        fail(`${twinRel}: ${descriptions.length} \`description:\` keys in the twin frontmatter, expected exactly 1`);
    }
    twins.push({ rel: twinRel, name: names[0].trim(), description: descriptions[0].trim() });
}
const twinOf = new Map();
for (const k of skills) {
    const matches = twins.filter((t) => t.description === k.description);
    if (matches.length !== 1) {
        fail(`${k.sourceRel}: ${matches.length} standalone twin(s) under .claude/skills/ carry its description${matches.length > 0 ? ` (${matches.map((t) => t.rel).join(", ")})` : ""}, expected exactly 1 — the Claude Code command name cannot be derived; run \`npm run generate:skill-twins\` or remove the duplicate`);
    }
    twinOf.set(k.op, matches[0]);
}
for (const t of twins) {
    const claimants = skills.filter((k) => twinOf.get(k.op) === t);
    if (claimants.length > 1) {
        fail(`${t.rel}: claimed by ${claimants.length} plugin skills (${claimants.map((k) => k.sourceRel).join(", ")}) that share one description, expected at most 1 — give each plugin skill its own description`);
    }
}
// ── The dispatcher: the plugin skill named after the plugin (plan 43-05, D-15) ────────────────
// A host that loads roles in turn reaches every skill through it, so exactly one must exist.
const dispatchers = skills.filter((k) => k.name === pluginName);
if (dispatchers.length !== 1) {
    fail(`${dispatchers.length} plugin skill(s) carry \`name: ${pluginName}\` (the plugin.json name), expected exactly 1 — the dispatcher the sequential hosts start cannot be identified`);
}
const dispatcher = dispatchers[0];
// ── Workflows named and roles reached, per skill (plan 43-05, D-15; T-43-17) ──────────────────
// A workflow path the body names must be a kit workflow (listWorkflows), and a role file it names must be
// a kit role (listRoles); an unknown one is refused by name, before any page is written, rather than
// published as a dead link. Role files whose name starts with `_` are protocols, not roles (D-03).
let kitWorkflows;
try {
    kitWorkflows = listWorkflows(ROOT);
}
catch (e) {
    fail(`cannot list the kit workflows: ${e.message}`);
}
const roleByName = new Map(roles.map((r) => [r.name, r]));
const roleByFile = new Map(roles.map((r) => [r.file, r]));
const workflowByFile = new Map(workflows.map((w) => [w.file, w]));
const namedFiles = (text, dir) => {
    const re = new RegExp(`agent-factory/${dir}/([A-Za-z0-9._-]+\\.md)`, "g");
    return [...new Set([...text.matchAll(re)].map((x) => x[1]))].sort();
};
const skillLinks = new Map();
for (const k of skills) {
    const wfs = [];
    for (const f of namedFiles(k.text, "workflows")) {
        const w = workflowByFile.get(f);
        if (!kitWorkflows.includes(f) || w === undefined) {
            fail(`${k.sourceRel}: names agent-factory/workflows/${f}, which is not a kit workflow (kit-model listWorkflows) — refusing to publish a dead or invented link`);
        }
        wfs.push(w);
    }
    wfs.sort((a, b) => a.order - b.order);
    const reached = new Map();
    for (const w of wfs) {
        const agents = sectionBody(w.text, "Agents involved");
        if (agents === null) {
            fail(`${w.file}: no \`## Agents involved\` section — cannot say which roles ${k.sourceRel} reaches`);
        }
        for (const line of agents.split("\n")) {
            const bullet = line.match(/^- (.+?) — /);
            const role = bullet === null ? undefined : roleByName.get(bullet[1]);
            if (role !== undefined)
                reached.set(role.file, role);
        }
    }
    for (const f of namedFiles(k.text, "roles")) {
        if (f.startsWith("_"))
            continue;
        const role = roleByFile.get(f);
        if (role === undefined) {
            fail(`${k.sourceRel}: names agent-factory/roles/${f}, which is not a kit role (kit-model listRoles) — refusing to publish a dead or invented link`);
        }
        reached.set(f, role);
    }
    skillLinks.set(k.op, {
        workflows: wfs,
        roles: [...reached.values()].sort((a, b) => a.name.localeCompare(b.name)),
    });
}
// ── Deterministic ordering (D-08, mandatory for the byte-diff) ─────────────────────────────────
// Roles: core group first, then enterprise; alphabetical (by display name) within each group.
roles.sort((a, b) => {
    if (a.tier !== b.tier)
        return a.tier === "core" ? -1 : 1;
    return a.name.localeCompare(b.name);
});
// Workflows: numeric `order` ascending, and no tie-break is needed because the refusal above has
// already rejected a corpus that would need one.
//
// WHAT STOOD HERE AND WAS REPLACED BY A MECHANISM RATHER THAN BY A FRESHER MEASUREMENT (round 6,
// IN-02 — plan 29-54). A clause on this line asserted that the values were unique and cited a one-off
// re-verification as the evidence. Nothing enforced it. That is a STANDING property resting on a
// POINT-IN-TIME measurement, which is precisely the shape of the stale cardinality this module's
// header says it deleted rather than corrected — and it was sitting one screen below that sentence.
// A property named by the mechanism that holds it cannot go stale; a property asserted from a
// measurement can do nothing else. The name above is the evidence now.
workflows.sort((a, b) => a.order - b.order);
// ── Build every page into one map before anything is written ─────────────────────────────────
const pages = new Map();
// The index: provenance header + intro + roles table + workflows table. Counts are interpolated,
// never typed.
const lines = [];
lines.push(PROVENANCE);
lines.push("# grugops reference");
lines.push("");
lines.push(`This is the generated reference for the grugops kit: ${roles.length} roles and ${skills.length} skills, each with its`);
lines.push(`own page, and ${workflows.length} workflows. The pages are generated from the role, skill and workflow files`);
lines.push("by `scripts/generate-catalog.js` and are never hand-edited; re-run the generator and commit the");
lines.push("result. Any unverified field reads `UNKNOWN - verify` rather than an invented value.");
lines.push("");
lines.push("## Roles");
lines.push("");
lines.push("| Role | Tier | One job | Page | Source |");
lines.push("| --- | --- | --- | --- | --- |");
for (const r of roles) {
    // Content cells (name, summary) are escaped (WR-03); the Page and Source link columns are not
    // (built from a role file name listRoles() returned). `tier` is constrained to core|enterprise so
    // it needs no escaping. The source link is RELATIVE from docs/reference/ (two levels up to the
    // repo root) — portable across local viewers, VS Code preview, plain CommonMark, and npm's README
    // view, not just github.com's blob renderer (WR-02).
    lines.push(`| ${cell(r.name)} | ${r.tier} | ${cell(r.summary)} | [${r.stem}](${AGENTS_SUBDIR}/${r.file}) | [${r.link}](../../${r.link}) |`);
}
lines.push("");
lines.push("## Skills");
lines.push("");
lines.push("| Skill | What it does | Page | Source |");
lines.push("| --- | --- | --- | --- |");
for (const k of skills) {
    // The description is authored content, so it is escaped (WR-03). The source is a repository URL:
    // skills/ does not ship to the kit home, so a relative link would be dead there.
    lines.push(`| ${k.op} | ${cell(k.description)} | [${k.op}](${SKILLS_SUBDIR}/${k.op}.md) | [${k.sourceRel}](${repository}/blob/main/${k.sourceRel}) |`);
}
lines.push("");
lines.push("## Workflows");
lines.push("");
lines.push("| # | Workflow | Cadence | When to use | Source |");
lines.push("| --- | --- | --- | --- | --- |");
for (const w of workflows) {
    // Content cells (name, cadence, summary) escaped (WR-03); `order` is an integer; link column raw.
    // Relative link from docs/reference/ — see the roles loop above (WR-02).
    lines.push(`| ${w.order} | ${cell(w.name)} | ${cell(w.cadence)} | ${cell(w.summary)} | [${w.link}](../../${w.link}) |`);
}
lines.push(""); // trailing element → exactly one final "\n"
pages.set(INDEX_PAGE, lines.join("\n"));
// One page per role (D-13). This plan writes the opening of each page: the provenance line, the
// display name from the `# Role:` heading, the first sentence of `## One job` and a link to the role
// source, three levels up from docs/reference/agents/. Plan 43-14 adds the header block and the
// extracted sections (D-14).
for (const r of roles) {
    pages.set(`${AGENTS_SUBDIR}/${r.file}`, [
        PROVENANCE,
        `# ${r.name}`,
        "",
        r.summary,
        "",
        `Full role: [${r.link}](../../../${r.link})`,
        "",
    ].join("\n"));
}
// One page per plugin skill (D-15): the provenance line, `# <op>`, what the skill does (its
// frontmatter description), the tools it may use, and its source as a repository URL.
for (const k of skills) {
    const isDispatcher = k === dispatcher;
    const twin = twinOf.get(k.op);
    const links = skillLinks.get(k.op);
    // One row per registry host, in registry order; the first cell is the plain host name (never bold).
    const invocation = HOST_TOOLS.map((h) => h.dispatch === "spawn"
        ? `| ${cell(h.name)} | \`/${twin.name} "<request>"\` (standalone skill) or \`/${pluginName}:${k.name} "<request>"\` (plugin) |`
        : `| ${cell(h.name)} | ${isDispatcher ? "" : "Through the dispatcher: "}${cell(h.invoke)} |`);
    const workflowLines = links.workflows.map((w) => `- ${w.name}: [agent-factory/workflows/${w.file}](../../../agent-factory/workflows/${w.file})`);
    const roleLines = links.roles.map((r) => `- [${r.name}](../${AGENTS_SUBDIR}/${r.file})`);
    pages.set(`${SKILLS_SUBDIR}/${k.op}.md`, [
        PROVENANCE,
        `# ${k.op}`,
        "",
        k.description,
        "",
        "## Invocation",
        "",
        "| Host | How to start it |",
        "| --- | --- |",
        ...invocation,
        "",
        ...(isDispatcher
            ? []
            : [
                `A host whose row says "Through the dispatcher" has no command of its own for this skill: start the dispatcher, [${dispatcher.op}](${dispatcher.op}.md), and ask for the work.`,
                "",
            ]),
        "## Workflows",
        "",
        ...(isDispatcher ? ["The Orchestrator picks the workflow for the request. The skill itself names:", ""] : []),
        ...(workflowLines.length > 0 ? workflowLines : ["The skill names no workflow."]),
        "",
        "## Roles it reaches",
        "",
        ...(isDispatcher
            ? ["The Orchestrator draws on the roles the request needs. The skill itself names, or runs a workflow that involves:", ""]
            : []),
        ...(roleLines.length > 0 ? roleLines : ["The skill names no role and no workflow that involves one."]),
        "",
        "## Allowed tools",
        "",
        k.allowedTools,
        "",
        `Source: [${k.sourceRel}](${repository}/blob/main/${k.sourceRel}). The standalone twin under \`.claude/skills/\` is generated from it and held equal by \`npm run freshness:skill-twins\`.`,
        "",
    ].join("\n"));
}
// ── Check every page path before touching the disk (T-43-13) ─────────────────────────────────
// lstat never follows a link. The output directory and the agents directory must each be absent or
// a real directory, and each page path must be absent or a regular file: writing through a link
// would write outside docs/reference/, so a link at any of these paths is refused by name, before
// anything is deleted or written.
const outRel = (rel) => (rel === "" ? "docs/reference" : `docs/reference/${rel}`);
const outAbs = (rel) => (rel === "" ? OUT_DIR : join(OUT_DIR, ...rel.split("/")));
function lstatOrNull(rel) {
    try {
        return lstatSync(outAbs(rel));
    }
    catch (e) {
        if (e.code === "ENOENT")
            return null;
        fail(`cannot inspect ${outRel(rel)} (${e.code ?? "error"}) — refusing to write`);
    }
}
for (const dir of ["", AGENTS_SUBDIR, SKILLS_SUBDIR]) {
    const st = lstatOrNull(dir);
    if (st !== null && !st.isDirectory()) {
        fail(`${outRel(dir)} is not a directory (a link or another file type) — refusing to write through it`);
    }
}
for (const rel of [...pages.keys()].sort()) {
    const st = lstatOrNull(rel);
    if (st !== null && !st.isFile()) {
        fail(`${outRel(rel)} is not a regular file (a link, directory or special file) — refusing to write through it`);
    }
}
// ── Find the stray pages: every regular `.md` file under docs/reference/ the map does not hold ──
// Walked with lstat; a link or special file is neither followed nor deleted (the freshness gate
// names it), and only regular `.md` files under the fixed literal OUT_DIR are ever removed.
function strayPages(rel) {
    const st = lstatOrNull(rel);
    if (st === null || !st.isDirectory())
        return [];
    let names;
    try {
        names = readdirSync(outAbs(rel));
    }
    catch (e) {
        fail(`cannot list ${outRel(rel)} (${e.code ?? "error"}) — refusing to write`);
    }
    const out = [];
    for (const n of names.sort()) {
        const child = rel === "" ? n : `${rel}/${n}`;
        const cst = lstatOrNull(child);
        if (cst === null)
            continue;
        if (cst.isDirectory())
            out.push(...strayPages(child));
        else if (cst.isFile() && n.endsWith(".md") && !pages.has(child))
            out.push(child);
    }
    return out;
}
const strays = strayPages("");
// ── Write: delete the strays, then write every page ──────────────────────────────────────────────
for (const rel of strays)
    unlinkSync(outAbs(rel));
mkdirSync(join(OUT_DIR, AGENTS_SUBDIR), { recursive: true });
mkdirSync(join(OUT_DIR, SKILLS_SUBDIR), { recursive: true });
for (const rel of [...pages.keys()].sort()) {
    writeFileSync(outAbs(rel), pages.get(rel), "utf8");
}
console.log(`generate-catalog: wrote ${pages.size} page(s) to docs/reference (the index, listing ${roles.length} roles, ${skills.length} skills and ${workflows.length} workflows, ${roles.length} role pages and ${skills.length} skill pages); removed ${strays.length} stray page(s)`);
process.exit(0);
