// generate-catalog.ts — grugops browsable docs catalog generator (DOCS-01).
//
// Reads the finished kit (agent-factory/roles + agent-factory/workflows) and emits
// docs/catalog/README.md — a single index with one roles table and one workflows table, each row
// linking to its kit source file. The catalog is generated, never hand-maintained: re-running this
// script reproduces a byte-identical file (the freshness gate depends on that). Mirrors the proven
// shape of generate-asvs-checklist.ts: fixed literal paths, fail-closed load, deterministic
// lines.join("\n") + writeFileSync emit, provenance header, single trailing newline, clear voice.
//
// Self-discovery: readdirSync the two source dirs. roles/ drops `_`-prefixed files (D-03, so
// _role-switch-protocol.md is excluded); workflows/ keeps every numbered file the regex below
// matches, in the numeric order each declares.
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
// authority refuses. So the divergence was LATENT, not live, and `docs/catalog/README.md` is
// byte-identical across the change. That is what makes the shape difference — not a rename — the
// thing worth holding, and it is held by three planted cases in scripts/generate-catalog.test.ts.
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
// ROLES_DIR/WORKFLOWS_DIR/OUT are FIXED literal paths joined to the repo root (the script dir's
// parent). None is ever derived from argv, env, or file content.
//
// Fail closed: a kit file with no `# Role:`/`# Workflow:` H1, an UNREADABLE frontmatter block, a
// required field absent or declared twice, or a directory read failure prints a finding to stderr and
// process.exit(1) WITHOUT writing — the full lines[] is built first, so a partial or garbled catalog
// never ships. Each of those is its OWN sentence; two facts printing one message is the conflation
// plan 29-40 deleted.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  parseFrontmatter,
  sectionEndIndex,
  unfencedHeadingIndex,
} from "./frontmatter.js";
// The rule that decides which files in the workflow directory are corpus members. It is DECLARED in
// scripts/kit-model.ts beside WORKFLOW_COUNT and asked here; this module states no shape rule of its
// own. See that declaration for why it is range-free and why it cannot live in either consumer.
import { isNumberedWorkflowFile } from "./kit-model.js";

// ── Fixed literal paths (read/write-only by construction — never argv/env/content-derived) ───
const ROOT = join(import.meta.dirname, "..");
const ROLES_DIR = join(ROOT, "agent-factory/roles");
const WORKFLOWS_DIR = join(ROOT, "agent-factory/workflows");
const OUT = join(ROOT, "docs/catalog/README.md");

// ── Fail-closed helper (a structural miss is a finding, never an unhandled throw) ─────────────
// The VARIABLE carries the `=> never` annotation, not just the arrow — copied verbatim from
// generate-role-adapters.ts:99 and for the same reason. TypeScript only lets a never-returning call
// narrow control flow when the callee is a function declaration or a const with an explicit TYPE
// annotation. That narrowing is what lets the parse-failure branches below read the authority's
// success arm without a cast, instead of a second `ok` test that would read as a fallback for a state
// that cannot be reached.
const fail: (m: string) => never = (m: string): never => {
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
function firstSentence(body: string): string {
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
function cell(s: string): string {
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
function sectionBody(text: string, heading: string): string | null {
  const at = unfencedHeadingIndex(text, `## ${heading}`);
  if (at === -1) return null;
  const end = sectionEndIndex(text, at + 1, 2);
  return text.split("\n").slice(at + 1, end).join("\n");
}

// ── A catalogued kit entry ────────────────────────────────────────────────────────────────────
interface RoleEntry {
  name: string;
  tier: string;
  summary: string;
  link: string;
}
interface WorkflowEntry {
  name: string;
  order: number;
  cadence: string;
  summary: string;
  link: string;
}

// ── Read + parse roles (skip `_`-prefixed → D-03 drops _role-switch-protocol.md) ──────────────
let roleFiles!: string[];
try {
  roleFiles = readdirSync(ROLES_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort();
} catch {
  fail(`cannot read roles directory: ${ROLES_DIR}`);
}

const roles: RoleEntry[] = [];
for (const file of roleFiles) {
  const path = join(ROLES_DIR, file);
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    fail(`cannot read role file: ${path}`);
  }
  const h1 = text!.match(/^# Role: (.+)$/m);
  if (!h1) fail(`${file}: no \`# Role:\` H1 — refusing to write a partial catalog`);
  // Tier, read through the ONE frontmatter authority (plan 29-40, G-29-1). Three distinct facts,
  // three distinct findings: an unreadable role file, a role declaring `tier:` twice, and a role whose
  // tier value is absent or outside core|enterprise are not the same problem and must not print the
  // same sentence.
  const parsed = parseFrontmatter(text!);
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
    fail(
      `${file}: ${tiers.length} \`tier:\` keys in one role frontmatter, expected exactly 1 — every occurrence is retained rather than last-wins, because silently discarding a declaration publishes the wrong tier; delete the extra key`,
    );
  }
  // ZERO values is a MISSING key, and the refusal below is that finding — reached with an empty
  // `found ""`, which is byte-for-byte the sentence the pre-change generator printed for an absent
  // `tier:`. Wording retained VERBATIM: absence and an out-of-vocabulary value are distinguished by
  // the interpolated value, and the "unreadable" half that used to hide in here now has its own arm.
  const tier = tiers.length === 1 ? tiers[0].trim() : "";
  if (tier !== "core" && tier !== "enterprise") {
    fail(`${file}: role tier must be core|enterprise, found "${tier}"`);
  }
  const body = sectionBody(text!, "One job");
  // `null` = section absent; `""`/whitespace-only = section present but empty. Guard both
  // explicitly so a `## One job\n\n<text>` layout (blank line after the heading) parses correctly
  // rather than tripping a falsy-`""` check (WR-01).
  if (body === null || body.trim() === "") {
    fail(`${file}: no \`## One job\` section — refusing to write a partial catalog`);
  }
  roles.push({
    name: h1![1].trim(),
    tier,
    summary: firstSentence(body!),
    link: `agent-factory/roles/${file}`,
  });
}

// ── Read + parse workflows (every corpus member isNumberedWorkflowFile admits) ────────────────
let workflowFiles!: string[];
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
} catch {
  fail(`cannot read workflows directory: ${WORKFLOWS_DIR}`);
}

const workflows: WorkflowEntry[] = [];
for (const file of workflowFiles) {
  const path = join(WORKFLOWS_DIR, file);
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    fail(`cannot read workflow file: ${path}`);
  }
  const h1 = text!.match(/^# Workflow: (.+)$/m);
  if (!h1) fail(`${file}: no \`# Workflow:\` H1 — refusing to write a partial catalog`);
  // Order + cadence, read through the ONE frontmatter authority — see the roles loop above for the
  // three-facts-three-findings rule this mirrors (plan 29-40, G-29-1).
  const parsed = parseFrontmatter(text!);
  if (!parsed.ok) {
    fail(`${file}: frontmatter is unreadable — ${parsed.reason}`);
  }
  const orders = parsed.value.get("order") ?? [];
  if (orders.length > 1) {
    fail(
      `${file}: ${orders.length} \`order:\` keys in one workflow frontmatter, expected exactly 1 — every occurrence is retained rather than last-wins, because silently discarding a declaration publishes the wrong row position; delete the extra key`,
    );
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
  const body = sectionBody(text!, "When to use");
  // `null` = section absent; `""`/whitespace-only = section present but empty. Guard both
  // explicitly (see the roles loop above — WR-01).
  if (body === null || body.trim() === "") {
    fail(`${file}: no \`## When to use\` section — refusing to write a partial catalog`);
  }
  const cadences = parsed.value.get("cadence") ?? [];
  if (cadences.length > 1) {
    fail(
      `${file}: ${cadences.length} \`cadence:\` keys in one workflow frontmatter, expected exactly 1 — every occurrence is retained rather than last-wins, because silently discarding a declaration publishes the wrong cadence; delete the extra key`,
    );
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
  workflows.push({
    name: h1![1].trim(),
    order,
    cadence,
    summary: firstSentence(body!),
    link: `agent-factory/workflows/${file}`,
  });
}

// ── Deterministic ordering (D-08, mandatory for the byte-diff) ─────────────────────────────────
// Roles: core group first, then enterprise; alphabetical (by display name) within each group.
roles.sort((a, b) => {
  if (a.tier !== b.tier) return a.tier === "core" ? -1 : 1;
  return a.name.localeCompare(b.name);
});
// Workflows: numeric `order` ascending (unique — no tie-break needed; the uniqueness claim was
// re-verified in round 5, the range that used to be typed here had not been and was stale).
workflows.sort((a, b) => a.order - b.order);

// ── Emit the document: provenance header + intro + roles table + workflows table ──────────────
const lines: string[] = [];
lines.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->");
lines.push("# grugops Catalog");
lines.push("");
lines.push(
  `This is the generated, browsable index of the grugops kit: ${roles.length} role personas and`,
);
lines.push(
  `${workflows.length} workflows. Each row links to its source file. The catalog is produced by`,
);
lines.push(
  "`scripts/generate-catalog.js` and is never hand-edited — re-run the generator and commit the",
);
lines.push("result. Any unverified field is marked `UNKNOWN - verify` rather than invented.");
lines.push("");
lines.push("## Roles");
lines.push("");
lines.push("| Role | Tier | One job | Source |");
lines.push("| --- | --- | --- | --- |");
for (const r of roles) {
  // Content cells (name, summary) are escaped (WR-03); the Source link column is not (controlled
  // path). `tier` is constrained to core|enterprise so it needs no escaping. The link is RELATIVE
  // from docs/catalog/ (two levels up to the repo root) — portable across local viewers, VS Code
  // preview, plain CommonMark, and npm's README view, not just github.com's blob renderer (WR-02).
  lines.push(`| ${cell(r.name)} | ${r.tier} | ${cell(r.summary)} | [${r.link}](../../${r.link}) |`);
}
lines.push("");
lines.push("## Workflows");
lines.push("");
lines.push("| # | Workflow | Cadence | When to use | Source |");
lines.push("| --- | --- | --- | --- | --- |");
for (const w of workflows) {
  // Content cells (name, cadence, summary) escaped (WR-03); `order` is an integer; link column raw.
  // Relative link from docs/catalog/ — see the roles loop above (WR-02).
  lines.push(
    `| ${w.order} | ${cell(w.name)} | ${cell(w.cadence)} | ${cell(w.summary)} | [${w.link}](../../${w.link}) |`,
  );
}
lines.push(""); // trailing element → exactly one final "\n"

writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(
  `generate-catalog: wrote ${roles.length} roles and ${workflows.length} workflows to ${OUT}`,
);
process.exit(0);
