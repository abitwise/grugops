// check-role-rules.ts — the derived role-rule inventory (Phase 40, PLAIN-03; decisions D-27, D-28,
// D-31, D-35).
//
// WHAT THIS IS. Phase 40 rewrites every role file. A rewrite can drop a load-bearing rule without any
// existing guard noticing, because the rules are prose. This script derives, per role-corpus file, a
// set of FACTS (anchor tokens and derived reference sets) and compares it with a committed baseline
// taken BEFORE any role prose changed. A fact the baseline holds and the file no longer carries is a
// named finding. The prose around a token may be reworded; the token must survive (D-28). The meaning
// is checked at plan review, not here.
//
// THE CORPUS. The 19 roles (`listRoles`) plus the `.md` members of the roles directory's named
// exemptions (`ROLE_DIR_EXEMPT`, which holds `_role-switch-protocol.md`), so 20 files. The count is
// asserted against ROLE_COUNT + 1, an independent number, and fails closed naming every member.
//
// THE FACTS (D-28, closed list). Fenced lines are excluded from every fact, so deleting a caveman
// fence changes no fact:
//   unknown-verify   the file contains `UNKNOWN - verify`
//   wf16 wf17 wf18   the file names `16-context-read-write.md`, `17-task-claim.md`, `18-context-compaction.md`
//   absent-config    the file contains `documented defaults` and `agent-factory/README.md`
//   blocked          the file contains `BLOCKED`
//   failed-attempt   the file contains `failed-attempt`
//   no-fabrication   a line in `## Hard limits` uses fake / invent / fabricate (word forms, not "inventory")
//   coding-rules     the file contains `12 coding rules` and `AGENTS.md` (the D-13 line)
//   junior:<tag>     each risk tag of the complexity rubric's F3 = 2 cell that `## Levels` names (derived)
//   kit-ref:<path>   each workflow / checklist / contract file the role names (derived from the kit's files)
//   board-from:<col> each column the role's `## Board moves` claims to exit (derived from the seed board)
//   announce exit    the protocol's `▶ entering <ROLE>` and `■ exiting <ROLE>` lines
// and stopWhenItems, the number of list items under `## Stop when`.
//
// MODES. `--write-baseline` writes docs/audit/40-role-rule-inventory.json once (plan 40-01, before any
// role prose changed). The default `--check` reads it, refuses to run without it, and never writes.
//
// Node stdlib only. Run the committed .js; CHECK_ROOT points it at a hermetic mirror in the tests.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, basename } from "node:path";
import { isEntrypoint } from "./is-entry.js";
import { BOARD_REL } from "../install/state-layout.js";
// The ONE fence state machine and the ONE section-end authority. This module declares no fence loop.
import { fencedLineFlags, unfencedHeadingIndex, sectionEndIndex } from "./frontmatter.js";
import { listRoles, ROLE_COUNT, ROLE_DIR_EXEMPT_NAMES, ROLES_SUBPATH } from "./kit-model.js";
import { reportMeasured } from "./vacuity.js";

// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror. The truthiness ternary, not
// `??`: `CHECK_ROOT=""` must degrade to the repo root, exactly as every sibling gate does.
const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");

const abs = (rel: string): string => join(ROOT, rel);

let FAILS = 0;
const pass = (m: string): void => {
  process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m: string): void => {
  process.stdout.write(`  FAIL  ${m}\n`);
  FAILS++;
};

export const BASELINE_REL = "docs/audit/40-role-rule-inventory.json";
export const GENERATED_BY = "node scripts/check-role-rules.js --write-baseline";

// THE ONE RECORDED DECISION CONSTANT (D-13, confirmed by D-35). These are the roles that write code
// or config and so keep "Follow the 12 coding rules in `AGENTS.md`". Every other fact in this file is
// DERIVED from the kit; this list alone is a human decision. It is checked two ways: every member
// must be a role basename and must still carry the line, and a non-member that drops the line is
// reported as intended (D-13), never as a loss.
export const D13_CODING_ROLES: readonly string[] = [
  "agents-md-scribe.md",
  "frontend-ui.md",
  "greenfield-mapper.md",
  "installer.md",
  "orchestrator.md",
  "qe-e2e.md",
  "software-engineer.md",
  "tech-lead.md",
];

const BOARD = `agent-factory/seed/${BOARD_REL}`;
const BOARD_TABLE_HEADER = "| Column | Entry means | Exit owner | WIP (default) |";
const RUBRIC = "agent-factory/checklists/complexity-rubric.md";
const RUBRIC_TABLE_HEADER = "| Factor | 0 | 1 | 2 | How to measure |";
const KIT_REF_DIRS = ["agent-factory/workflows", "agent-factory/checklists", "agent-factory/contracts"];
const SEED_MEMORY_BANK = "agent-factory/seed/memory-bank";

export interface KitFile {
  readonly rel: string;
  readonly base: string;
  // A basename counts as a reference only when it is unique across the three kit directories and
  // equals no seed memory-bank basename (so `memory-bank/plans/board.md` never reads as contracts/board.md).
  readonly basenameCounts: boolean;
}

export interface FactContext {
  readonly columns: ReadonlySet<string>;
  readonly juniorTags: readonly string[];
  readonly kitFiles: readonly KitFile[];
}

export interface RoleFacts {
  readonly facts: string[];
  readonly stopWhenItems: number;
}

export interface Baseline {
  readonly generated_by: string;
  readonly source_commit: string;
  readonly files: Record<string, RoleFacts>;
}

const normalizeText = (raw: string): string => raw.replace(/\r\n/g, "\n");

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Split a markdown table row into trimmed cells (the cells between the outer pipes). */
function cells(row: string): string[] {
  const parts = row.trim().split("|");
  return parts.slice(1, parts.length - 1).map((c) => c.trim());
}

const isTableRule = (trimmed: string): boolean => trimmed.startsWith("|") && /^[\s:|-]+$/.test(trimmed);

/**
 * The unfenced lines of the section whose heading line STARTS WITH `prefix` (the validator's prefix
 * rule: `## Board moves` matches both today's suffixed heading and the D-12 bare heading). The first
 * such unfenced heading wins; the section ends where `sectionEndIndex` says. `[]` when absent.
 */
function sectionLines(text: string, flags: readonly boolean[], prefix: string): string[] {
  const lines = text.split("\n");
  let at = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!flags[i] && lines[i].startsWith(prefix)) {
      at = i;
      break;
    }
  }
  if (at === -1) return [];
  const end = sectionEndIndex(text, at + 1, 2);
  const out: string[] = [];
  for (let i = at + 1; i < end; i++) if (!flags[i]) out.push(lines[i]);
  return out;
}

const FABRICATION_WORD = /\b(?:fake|fakes|faked|faking|invent|invents|invented|inventing|fabricat\w*)\b/i;
const LIST_ITEM = /^(?:[-*+]|\d+[.)])\s+\S/;
const tagId = (tag: string): string => tag.toLowerCase().replace(/[\s-]+/g, "-");
const normalizeForTag = (s: string): string => s.toLowerCase().replace(/[\s-]+/g, " ");

/**
 * Derive the fact set of one role-corpus file. Pure: the caller supplies the derived context.
 * Returns the facts sorted, plus the `## Stop when` list-item count.
 */
export function deriveRoleFacts(raw: string, ctx: FactContext): RoleFacts {
  const text = normalizeText(raw);
  const flags = fencedLineFlags(text);
  const lines = text.split("\n");
  const unfenced = lines.filter((_, i) => !flags[i]).join("\n");
  const facts = new Set<string>();
  const has = (s: string): boolean => unfenced.includes(s);

  if (has("UNKNOWN - verify")) facts.add("unknown-verify");
  if (has("16-context-read-write.md")) facts.add("wf16");
  if (has("17-task-claim.md")) facts.add("wf17");
  if (has("18-context-compaction.md")) facts.add("wf18");
  if (has("documented defaults") && has("agent-factory/README.md")) facts.add("absent-config");
  if (has("BLOCKED")) facts.add("blocked");
  if (has("failed-attempt")) facts.add("failed-attempt");
  if (has("12 coding rules") && has("AGENTS.md")) facts.add("coding-rules");
  if (has("▶ entering <ROLE>")) facts.add("announce");
  if (has("■ exiting <ROLE>")) facts.add("exit");

  if (sectionLines(text, flags, "## Hard limits").some((l) => FABRICATION_WORD.test(l))) {
    facts.add("no-fabrication");
  }

  const levels = normalizeForTag(sectionLines(text, flags, "## Levels").join("\n"));
  for (const tag of ctx.juniorTags) {
    const re = new RegExp(`(?<![a-z0-9])${escapeRe(normalizeForTag(tag))}(?![a-z0-9])`);
    if (re.test(levels)) facts.add(`junior:${tagId(tag)}`);
  }

  for (const k of ctx.kitFiles) {
    if (unfenced.includes(k.rel)) {
      facts.add(`kit-ref:${k.rel}`);
      continue;
    }
    if (!k.basenameCounts) continue;
    const re = new RegExp(`(?<![A-Za-z0-9_.-])${escapeRe(k.base)}(?![A-Za-z0-9_-])`);
    if (re.test(unfenced)) facts.add(`kit-ref:${k.rel}`);
  }

  const moves = sectionLines(text, flags, "## Board moves").join("\n");
  const fromOf = (span: string): string => (span.includes("→") ? span.split("→")[0].trim() : span.trim());
  for (const m of moves.matchAll(/`([^`\n]+)`/g)) {
    if (!m[1].includes("→")) continue;
    const x = fromOf(m[1]);
    if (ctx.columns.has(x)) facts.add(`board-from:${x}`);
  }
  for (const m of moves.matchAll(/owns the `([^`\n]+)` exit/g)) {
    const x = fromOf(m[1]);
    if (ctx.columns.has(x)) facts.add(`board-from:${x}`);
  }

  const stopWhenItems = sectionLines(text, flags, "## Stop when").filter((l) => LIST_ITEM.test(l)).length;
  return { facts: [...facts].sort(), stopWhenItems };
}

/** The seed board's column set, read from its `| Column | … |` table (the boardColumns reading pattern). */
export function boardColumns(root: string): string[] {
  const p = join(root, BOARD);
  if (!existsSync(p)) throw new Error(`${BOARD} does not exist at ${p}`);
  const text = normalizeText(readFileSync(p, "utf8"));
  const flags = fencedLineFlags(text);
  const lines = text.split("\n");
  const at = unfencedHeadingIndex(text, BOARD_TABLE_HEADER);
  if (at === -1) throw new Error(`${BOARD} carries no \`${BOARD_TABLE_HEADER}\` header row`);
  const out: string[] = [];
  for (let i = at + 1; i < lines.length; i++) {
    if (flags[i]) continue;
    const row = lines[i].trim();
    if (!row.startsWith("|")) break;
    if (isTableRule(row)) continue;
    const cell = (cells(lines[i])[0] ?? "").replace(/`([^`]*)`/g, "$1").replace(/\*\*([^*]*)\*\*/g, "$1").trim();
    if (cell !== "") out.push(cell);
  }
  if (out.length === 0) throw new Error(`${BOARD}: the column table has no rows`);
  return out;
}

/** The complexity rubric's F3 = 2 risk tags, read from the rubric row, never typed. */
export function juniorTags(root: string): string[] {
  const p = join(root, RUBRIC);
  if (!existsSync(p)) throw new Error(`${RUBRIC} does not exist at ${p}`);
  const text = normalizeText(readFileSync(p, "utf8"));
  const flags = fencedLineFlags(text);
  const lines = text.split("\n");
  const at = unfencedHeadingIndex(text, RUBRIC_TABLE_HEADER);
  if (at === -1) throw new Error(`${RUBRIC} carries no \`${RUBRIC_TABLE_HEADER}\` header row`);
  const col = cells(lines[at]).indexOf("2");
  for (let i = at + 1; i < lines.length; i++) {
    if (flags[i]) continue;
    const row = lines[i].trim();
    if (!row.startsWith("|")) break;
    if (isTableRule(row)) continue;
    const c = cells(lines[i]);
    if (/^F3\b/.test(c[0] ?? "")) {
      const tags = (c[col] ?? "").split(",").map((t) => t.trim()).filter((t) => t !== "");
      if (tags.length === 0) throw new Error(`${RUBRIC}: the F3 row's 2 cell is empty`);
      return tags;
    }
  }
  throw new Error(`${RUBRIC}: no F3 row in the factor table`);
}

function walkBasenames(dir: string): string[] {
  if (!existsSync(dir)) throw new Error(`${dir} does not exist`);
  return (readdirSync(dir, { recursive: true }) as string[]).map((e) => basename(String(e)));
}

/** Every `.md` file under the three kit directories, with whether its bare basename counts. */
export function kitFiles(root: string): KitFile[] {
  const all: { rel: string; base: string }[] = [];
  for (const d of KIT_REF_DIRS) {
    const dir = join(root, d);
    if (!existsSync(dir)) throw new Error(`${d} does not exist at ${dir}`);
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".md")).sort()) {
      all.push({ rel: `${d}/${f}`, base: f });
    }
  }
  if (all.length === 0) throw new Error(`no kit file under ${KIT_REF_DIRS.join(", ")}`);
  const seedBases = new Set(walkBasenames(join(root, SEED_MEMORY_BANK)));
  return all.map((k) => ({
    ...k,
    basenameCounts: all.filter((o) => o.base === k.base).length === 1 && !seedBases.has(k.base),
  }));
}

/** The role corpus: every role plus the `.md` members of the roles directory's named exemptions. */
export function roleCorpus(root: string): string[] {
  const exemptMd = ROLE_DIR_EXEMPT_NAMES.filter((n) => n.endsWith(".md"));
  return [...listRoles(root), ...exemptMd].sort();
}

export function buildContext(root: string): FactContext {
  return { columns: new Set(boardColumns(root)), juniorTags: juniorTags(root), kitFiles: kitFiles(root) };
}

/** Derive every corpus file's facts. Throws naming the file on an unreadable member. */
export function deriveAll(root: string): Record<string, RoleFacts> {
  const ctx = buildContext(root);
  const out: Record<string, RoleFacts> = {};
  for (const f of roleCorpus(root)) {
    const p = join(root, ROLES_SUBPATH, f);
    if (!existsSync(p)) throw new Error(`${ROLES_SUBPATH}/${f} is in the role corpus but does not exist`);
    out[f] = deriveRoleFacts(readFileSync(p, "utf8"), ctx);
  }
  return out;
}

/**
 * The D-13 set check, side one: every member must be a role basename. Side two (when `carries` is
 * supplied): every member must still carry the coding-rules line. Returns the findings.
 */
export function checkCodingRoleSet(
  members: readonly string[],
  roles: readonly string[],
  carries?: (role: string) => boolean,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of members) {
    if (seen.has(m)) out.push(`D13_CODING_ROLES lists ${m} twice`);
    seen.add(m);
    if (!roles.includes(m)) {
      out.push(`D13_CODING_ROLES member ${m} is not a role basename (D-35)`);
      continue;
    }
    if (carries && !carries(m)) {
      out.push(`${m}: lost fact coding-rules — a D13_CODING_ROLES member must keep "Follow the 12 coding rules in \`AGENTS.md\`" (D-13, D-35)`);
    }
  }
  return out;
}

/** Serialize with every object key sorted, two-space indent, trailing newline. */
export function serializeBaseline(b: Baseline): string {
  const sortKeys = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v !== null && typeof v === "object") {
      const o = v as Record<string, unknown>;
      return Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortKeys(o[k])]));
    }
    return v;
  };
  return `${JSON.stringify(sortKeys(b), null, 2)}\n`;
}

function parseBaseline(raw: string): Baseline {
  const j = JSON.parse(raw) as Partial<Baseline>;
  if (typeof j.source_commit !== "string" || !/^[0-9a-f]{40}$/.test(j.source_commit)) {
    throw new Error("source_commit is not a 40-character commit id");
  }
  if (j.files === null || typeof j.files !== "object") throw new Error("files is not an object");
  for (const [k, v] of Object.entries(j.files)) {
    if (!v || !Array.isArray(v.facts) || typeof v.stopWhenItems !== "number") {
      throw new Error(`files.${k} is not { facts: string[], stopWhenItems: number }`);
    }
  }
  return j as Baseline;
}

function corpusCountFinding(corpus: readonly string[]): string | null {
  if (corpus.length === ROLE_COUNT + 1) return null;
  return (
    `role corpus has ${corpus.length} file(s), expected ROLE_COUNT + 1 = ${ROLE_COUNT + 1}: ` +
    corpus.join(", ")
  );
}

function writeBaseline(): void {
  process.stdout.write("\n[check-role-rules --write-baseline] deriving the role-rule inventory (D-27)\n");
  let files: Record<string, RoleFacts>;
  try {
    const corpus = roleCorpus(ROOT);
    const bad = corpusCountFinding(corpus);
    if (bad !== null) throw new Error(bad);
    files = deriveAll(ROOT);
  } catch (e) {
    fail(`derivation failed: ${(e as Error).message}`);
    return;
  }
  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  const out = serializeBaseline({ generated_by: GENERATED_BY, source_commit: sourceCommit, files });
  writeFileSync(abs(BASELINE_REL), out);
  pass(`wrote ${BASELINE_REL}: ${Object.keys(files).length} file(s) at ${sourceCommit}`);
}

function check(): void {
  process.stdout.write("\n[check-role-rules] every baseline role fact still holds (D-27, D-28, D-31, D-35)\n");
  const bp = abs(BASELINE_REL);
  if (!existsSync(bp)) {
    fail(`${BASELINE_REL} is missing — the inventory check refuses to run without its baseline (D-27)`);
    return;
  }
  let baseline: Baseline;
  try {
    baseline = parseBaseline(readFileSync(bp, "utf8"));
  } catch (e) {
    fail(`${BASELINE_REL} is unparseable: ${(e as Error).message}`);
    return;
  }
  let corpus: string[];
  let roles: string[];
  let current: Record<string, RoleFacts>;
  try {
    corpus = roleCorpus(ROOT);
    roles = listRoles(ROOT);
    current = deriveAll(ROOT);
  } catch (e) {
    fail(`derivation failed: ${(e as Error).message}`);
    return;
  }
  const bad = corpusCountFinding(corpus);
  if (bad !== null) fail(bad);

  const findings: string[] = [];
  let visited = 0;
  for (const f of Object.keys(baseline.files).sort()) {
    if (!(f in current)) findings.push(`${f}: in the baseline but not on disk`);
  }
  for (const f of corpus) {
    if (!(f in baseline.files)) findings.push(`${f}: on disk but not in the baseline`);
  }
  for (const f of corpus) {
    const before = baseline.files[f];
    const now = current[f];
    if (!before || !now) continue;
    visited++;
    let intended = 0;
    for (const fact of before.facts) {
      if (now.facts.includes(fact)) continue;
      if (fact === "coding-rules" && !D13_CODING_ROLES.includes(f)) {
        intended++;
        process.stdout.write(`  NOTE  ${f}: coding-rules removed — intended (D-13)\n`);
        continue;
      }
      findings.push(`${f}: lost fact ${fact}`);
    }
    const n = before.facts.length + before.stopWhenItems;
    const m = now.facts.length + now.stopWhenItems;
    const floor = n - intended;
    process.stdout.write(
      `  INFO  ${f}: facts before ${n} / after ${m}` +
        (intended > 0 ? ` (floor ${floor} after ${intended} intended D-13 removal(s))` : "") +
        "\n",
    );
    if (m < floor) findings.push(`${f}: fact count fell from ${n} to ${m} (floor ${floor}) — "more detail" requires at least as many (D-31)`);
  }
  findings.push(...checkCodingRoleSet(D13_CODING_ROLES, roles, (r) => current[r]?.facts.includes("coding-rules") ?? false));

  FAILS += reportMeasured(
    {
      label: "role-rule inventory",
      visited,
      expected: ROLE_COUNT + 1,
      findings,
    },
    { pass, fail: (s) => process.stdout.write(`  FAIL  ${s}\n`) },
    (s) => `        - ${s}`,
  );
}

export function runAll(argv: readonly string[] = process.argv.slice(2)): void {
  if (argv.includes("--write-baseline")) writeBaseline();
  else check();
  process.stdout.write("\n== Result ==\n");
  if (FAILS === 0) {
    process.stdout.write("ALL CHECKS PASSED\n");
    process.exit(0);
  } else {
    process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
    process.exit(1);
  }
}

const isEntry = isEntrypoint(import.meta.url);

if (isEntry) {
  runAll();
}
