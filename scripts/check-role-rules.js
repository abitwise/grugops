// check-role-rules.ts — the derived role-rule inventory and the board-move partition (Phase 40,
// PLAIN-02, PLAIN-03; decisions D-08, D-10, D-27, D-28, D-29, D-31, D-33, D-35, D-36).
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
// THE BOARD-MOVE PARTITION (D-29, D-33). `--check` also runs a second named check on the current tree
// only: each role's exact `(from, to)` pairs, read from the `X → Y` code spans in `## Board moves`, must
// partition the seed board's flow (five rules, listed above checkPartition). The flow order, the Exit
// owners and the terminal column come from the seed board table; BOARD_MOVE_EXCEPTIONS is the one
// declared list. It adds no fact kind to the baseline derivation.
//
// THE END-STATE CHECKS (D-08, D-10, D-35, D-36). `--check` also holds the 19 roles to the rewrite's
// end state: the D-13 set two-sided (a non-member carrying the coding-rules line is red), the
// `unknown-verify` and `no-fabrication` facts in every role, at least one `## Stop when` list item, and
// the D-08 heading order. The protocol keeps its own shape and is outside them.
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
import { listRoles, listRoleDisplayNames, ROLE_COUNT, ROLE_DIR_EXEMPT_NAMES, ROLES_SUBPATH } from "./kit-model.js";
import { reportMeasured } from "./vacuity.js";
// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror. The truthiness ternary, not
// `??`: `CHECK_ROOT=""` must degrade to the repo root, exactly as every sibling gate does.
const ROOT = process.env.CHECK_ROOT
    ? process.env.CHECK_ROOT
    : join(import.meta.dirname, "..");
const abs = (rel) => join(ROOT, rel);
let FAILS = 0;
const pass = (m) => {
    process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m) => {
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
export const D13_CODING_ROLES = [
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
const normalizeText = (raw) => raw.replace(/\r\n/g, "\n");
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Split a markdown table row into trimmed cells (the cells between the outer pipes). */
function cells(row) {
    const parts = row.trim().split("|");
    return parts.slice(1, parts.length - 1).map((c) => c.trim());
}
const isTableRule = (trimmed) => trimmed.startsWith("|") && /^[\s:|-]+$/.test(trimmed);
/**
 * The unfenced lines of the section whose heading line STARTS WITH `prefix` (the validator's prefix
 * rule: `## Board moves` matches both today's suffixed heading and the D-12 bare heading). The first
 * such unfenced heading wins; the section ends where `sectionEndIndex` says. `[]` when absent.
 */
function sectionLines(text, flags, prefix) {
    const lines = text.split("\n");
    let at = -1;
    for (let i = 0; i < lines.length; i++) {
        if (!flags[i] && lines[i].startsWith(prefix)) {
            at = i;
            break;
        }
    }
    if (at === -1)
        return [];
    const end = sectionEndIndex(text, at + 1, 2);
    const out = [];
    for (let i = at + 1; i < end; i++)
        if (!flags[i])
            out.push(lines[i]);
    return out;
}
const FABRICATION_WORD = /\b(?:fake|fakes|faked|faking|invent|invents|invented|inventing|fabricat\w*)\b/i;
const LIST_ITEM = /^(?:[-*+]|\d+[.)])\s+\S/;
const tagId = (tag) => tag.toLowerCase().replace(/[\s-]+/g, "-");
const normalizeForTag = (s) => s.toLowerCase().replace(/[\s-]+/g, " ");
/**
 * Derive the fact set of one role-corpus file. Pure: the caller supplies the derived context.
 * Returns the facts sorted, plus the `## Stop when` list-item count.
 */
export function deriveRoleFacts(raw, ctx) {
    const text = normalizeText(raw);
    const flags = fencedLineFlags(text);
    const lines = text.split("\n");
    const unfenced = lines.filter((_, i) => !flags[i]).join("\n");
    const facts = new Set();
    const has = (s) => unfenced.includes(s);
    if (has("UNKNOWN - verify"))
        facts.add("unknown-verify");
    if (has("16-context-read-write.md"))
        facts.add("wf16");
    if (has("17-task-claim.md"))
        facts.add("wf17");
    if (has("18-context-compaction.md"))
        facts.add("wf18");
    if (has("documented defaults") && has("agent-factory/README.md"))
        facts.add("absent-config");
    if (has("BLOCKED"))
        facts.add("blocked");
    if (has("failed-attempt"))
        facts.add("failed-attempt");
    if (has("12 coding rules") && has("AGENTS.md"))
        facts.add("coding-rules");
    if (has("▶ entering <ROLE>"))
        facts.add("announce");
    if (has("■ exiting <ROLE>"))
        facts.add("exit");
    if (sectionLines(text, flags, "## Hard limits").some((l) => FABRICATION_WORD.test(l))) {
        facts.add("no-fabrication");
    }
    const levels = normalizeForTag(sectionLines(text, flags, "## Levels").join("\n"));
    for (const tag of ctx.juniorTags) {
        const re = new RegExp(`(?<![a-z0-9])${escapeRe(normalizeForTag(tag))}(?![a-z0-9])`);
        if (re.test(levels))
            facts.add(`junior:${tagId(tag)}`);
    }
    for (const k of ctx.kitFiles) {
        if (unfenced.includes(k.rel)) {
            facts.add(`kit-ref:${k.rel}`);
            continue;
        }
        if (!k.basenameCounts)
            continue;
        const re = new RegExp(`(?<![A-Za-z0-9_.-])${escapeRe(k.base)}(?![A-Za-z0-9_-])`);
        if (re.test(unfenced))
            facts.add(`kit-ref:${k.rel}`);
    }
    const moves = sectionLines(text, flags, "## Board moves").join("\n");
    const fromOf = (span) => (span.includes("→") ? span.split("→")[0].trim() : span.trim());
    for (const m of moves.matchAll(/`([^`\n]+)`/g)) {
        if (!m[1].includes("→"))
            continue;
        const x = fromOf(m[1]);
        if (ctx.columns.has(x))
            facts.add(`board-from:${x}`);
    }
    for (const m of moves.matchAll(/owns the `([^`\n]+)` exit/g)) {
        const x = fromOf(m[1]);
        if (ctx.columns.has(x))
            facts.add(`board-from:${x}`);
    }
    const stopWhenItems = sectionLines(text, flags, "## Stop when").filter((l) => LIST_ITEM.test(l)).length;
    return { facts: [...facts].sort(), stopWhenItems };
}
const plainCell = (c) => c.replace(/`([^`]*)`/g, "$1").replace(/\*\*([^*]*)\*\*/g, "$1").trim();
/**
 * The seed board's column table rows in order, read from its `| Column | … | Exit owner | … |` table
 * (the boardColumns reading pattern, extended to the `Exit owner` cell for the partition, D-29).
 */
export function boardRows(root) {
    const p = join(root, BOARD);
    if (!existsSync(p))
        throw new Error(`${BOARD} does not exist at ${p}`);
    const text = normalizeText(readFileSync(p, "utf8"));
    const flags = fencedLineFlags(text);
    const lines = text.split("\n");
    const at = unfencedHeadingIndex(text, BOARD_TABLE_HEADER);
    if (at === -1)
        throw new Error(`${BOARD} carries no \`${BOARD_TABLE_HEADER}\` header row`);
    const ownerCol = cells(lines[at]).indexOf("Exit owner");
    const out = [];
    for (let i = at + 1; i < lines.length; i++) {
        if (flags[i])
            continue;
        const row = lines[i].trim();
        if (!row.startsWith("|"))
            break;
        if (isTableRule(row))
            continue;
        const c = cells(lines[i]);
        const column = plainCell(c[0] ?? "");
        if (column !== "")
            out.push({ column, exitOwner: plainCell(c[ownerCol] ?? "") });
    }
    if (out.length === 0)
        throw new Error(`${BOARD}: the column table has no rows`);
    return out;
}
/** The seed board's column set, in table order. */
export function boardColumns(root) {
    return boardRows(root).map((r) => r.column);
}
/** The complexity rubric's F3 = 2 risk tags, read from the rubric row, never typed. */
export function juniorTags(root) {
    const p = join(root, RUBRIC);
    if (!existsSync(p))
        throw new Error(`${RUBRIC} does not exist at ${p}`);
    const text = normalizeText(readFileSync(p, "utf8"));
    const flags = fencedLineFlags(text);
    const lines = text.split("\n");
    const at = unfencedHeadingIndex(text, RUBRIC_TABLE_HEADER);
    if (at === -1)
        throw new Error(`${RUBRIC} carries no \`${RUBRIC_TABLE_HEADER}\` header row`);
    const col = cells(lines[at]).indexOf("2");
    for (let i = at + 1; i < lines.length; i++) {
        if (flags[i])
            continue;
        const row = lines[i].trim();
        if (!row.startsWith("|"))
            break;
        if (isTableRule(row))
            continue;
        const c = cells(lines[i]);
        if (/^F3\b/.test(c[0] ?? "")) {
            const tags = (c[col] ?? "").split(",").map((t) => t.trim()).filter((t) => t !== "");
            if (tags.length === 0)
                throw new Error(`${RUBRIC}: the F3 row's 2 cell is empty`);
            return tags;
        }
    }
    throw new Error(`${RUBRIC}: no F3 row in the factor table`);
}
function walkBasenames(dir) {
    if (!existsSync(dir))
        throw new Error(`${dir} does not exist`);
    return readdirSync(dir, { recursive: true }).map((e) => basename(String(e)));
}
/** Every `.md` file under the three kit directories, with whether its bare basename counts. */
export function kitFiles(root) {
    const all = [];
    for (const d of KIT_REF_DIRS) {
        const dir = join(root, d);
        if (!existsSync(dir))
            throw new Error(`${d} does not exist at ${dir}`);
        for (const f of readdirSync(dir).filter((x) => x.endsWith(".md")).sort()) {
            all.push({ rel: `${d}/${f}`, base: f });
        }
    }
    if (all.length === 0)
        throw new Error(`no kit file under ${KIT_REF_DIRS.join(", ")}`);
    const seedBases = new Set(walkBasenames(join(root, SEED_MEMORY_BANK)));
    return all.map((k) => ({
        ...k,
        basenameCounts: all.filter((o) => o.base === k.base).length === 1 && !seedBases.has(k.base),
    }));
}
/** The role corpus: every role plus the `.md` members of the roles directory's named exemptions. */
export function roleCorpus(root) {
    const exemptMd = ROLE_DIR_EXEMPT_NAMES.filter((n) => n.endsWith(".md"));
    return [...listRoles(root), ...exemptMd].sort();
}
export function buildContext(root) {
    return { columns: new Set(boardColumns(root)), juniorTags: juniorTags(root), kitFiles: kitFiles(root) };
}
/** Derive every corpus file's facts. Throws naming the file on an unreadable member. */
export function deriveAll(root) {
    const ctx = buildContext(root);
    const out = {};
    for (const f of roleCorpus(root)) {
        const p = join(root, ROLES_SUBPATH, f);
        if (!existsSync(p))
            throw new Error(`${ROLES_SUBPATH}/${f} is in the role corpus but does not exist`);
        out[f] = deriveRoleFacts(readFileSync(p, "utf8"), ctx);
    }
    return out;
}
/**
 * The D-13 set check, side one: every member must be a role basename. Side two (when `carries` is
 * supplied): every member must still carry the coding-rules line. Returns the findings.
 */
export function checkCodingRoleSet(members, roles, carries) {
    const out = [];
    const seen = new Set();
    for (const m of members) {
        if (seen.has(m))
            out.push(`D13_CODING_ROLES lists ${m} twice`);
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
// THE DECLARED EXCEPTIONS (D-33, approved by the human in plan 40-02's checkpoint). These are the only
// moves a role may claim out of a column it does not own. Adding an entry needs a recorded human
// decision; every entry has its own test, and rule 5 turns an entry its role no longer claims red.
export const BOARD_MOVE_EXCEPTIONS = [
    {
        role: "tech-lead.md",
        from: "Ready for Dev",
        to: "In Design",
        reason: "F2 = 2 return: the plan needs design work before development (D-33)",
    },
    {
        role: "tech-lead.md",
        from: "Blocked",
        to: "Ready for Dev",
        reason: "exit of a dev-raised block, Workflow 04 step 15 (D-33)",
    },
    {
        role: "tech-lead.md",
        from: "Blocked",
        to: "Backlog",
        reason: "exit of a dev-raised block, Workflow 04 step 15 (D-33)",
    },
    {
        role: "tech-lead.md",
        from: "Blocked",
        to: "In Design",
        reason: "exit of a dev-raised block, Workflow 04 step 15 (D-33)",
    },
];
const ARROW = " → ";
export const pairKey = (p) => `${p.from}${ARROW}${p.to}`;
/** The `(from, to)` pairs one role file claims in its unfenced `## Board moves` code spans. */
export function claimedPairs(raw, columns) {
    const text = normalizeText(raw);
    const flags = fencedLineFlags(text);
    const moves = sectionLines(text, flags, "## Board moves").join("\n");
    const out = [];
    const seen = new Set();
    for (const m of moves.matchAll(/`([^`\n]+)`/g)) {
        if (!m[1].includes(ARROW))
            continue;
        const parts = m[1].split(ARROW);
        if (parts.length !== 2)
            continue;
        const pair = { from: parts[0].trim(), to: parts[1].trim() };
        if (!columns.has(pair.from) || !columns.has(pair.to))
            continue;
        if (seen.has(pairKey(pair)))
            continue;
        seen.add(pairKey(pair));
        out.push(pair);
    }
    return out;
}
/**
 * The partition model, derived from the seed board table and the roles' `# Role: ` headings. An Exit
 * owner in parentheses (`(raiser)`) is outside the flow; any other owner must be a role display name,
 * or the derivation throws naming it (a misspelt owner must never silently shrink the flow).
 */
export function partitionModel(root) {
    const rows = boardRows(root);
    const files = listRoles(root);
    const names = listRoleDisplayNames(root);
    const byName = new Map();
    names.forEach((n, i) => byName.set(n, files[i]));
    const owners = new Map();
    const flow = [];
    for (const r of rows) {
        if (/^\(.*\)$/.test(r.exitOwner))
            continue;
        const f = byName.get(r.exitOwner);
        if (f === undefined) {
            throw new Error(`${BOARD}: column ${r.column} has Exit owner "${r.exitOwner}", which is no role's \`# Role: \` name`);
        }
        owners.set(r.column, f);
        flow.push(r.column);
    }
    if (flow.length < 2)
        throw new Error(`${BOARD}: fewer than two role-owned columns, so there is no flow`);
    return { flow, owners, terminal: flow[flow.length - 1], columns: new Set(rows.map((r) => r.column)) };
}
/** The five partition rules over the claimed pairs. Returns the findings, each naming role, pair and rule. */
export function checkPartition(model, claims, exceptions = BOARD_MOVE_EXCEPTIONS) {
    const out = [];
    const roles = Object.keys(claims).sort();
    const claimsOf = (r) => claims[r] ?? [];
    const claimsPair = (r, p) => claimsOf(r).some((q) => pairKey(q) === pairKey(p));
    // rule 1
    const holders = new Map();
    for (const r of roles)
        for (const p of claimsOf(r))
            holders.set(pairKey(p), [...(holders.get(pairKey(p)) ?? []), r]);
    for (const [k, rs] of [...holders.entries()].sort()) {
        if (rs.length > 1)
            out.push(`${rs.join(", ")}: rule 1: \`${k}\` is claimed by ${rs.length} roles — a pair has one owner (D-29)`);
    }
    // rule 2
    for (let i = 0; i + 1 < model.flow.length; i++) {
        const p = { from: model.flow[i], to: model.flow[i + 1] };
        const owner = model.owners.get(p.from);
        if (!claimsPair(owner, p)) {
            out.push(`${owner}: rule 2: owns the ${p.from} exit but does not claim its forward pair \`${pairKey(p)}\` (D-29)`);
        }
    }
    // rule 3
    const terminalOwner = model.owners.get(model.terminal);
    if (!claimsOf(terminalOwner).some((p) => p.to === model.terminal)) {
        out.push(`${terminalOwner}: rule 3: owns the terminal column ${model.terminal} but claims no pair into it (D-29)`);
    }
    // rule 4
    const declared = (r, p) => exceptions.some((e) => e.role === r && e.from === p.from && e.to === p.to);
    for (const r of roles) {
        for (const p of claimsOf(r)) {
            const fromOwner = model.owners.get(p.from);
            if (fromOwner === r)
                continue;
            if (declared(r, p))
                continue;
            if (p.to === model.terminal && r === terminalOwner)
                continue;
            const why = fromOwner === undefined ? `${p.from} has no role as its Exit owner` : `${p.from} is owned by ${fromOwner}`;
            out.push(`${r}: rule 4: claims \`${pairKey(p)}\` but ${why}, and the pair is not in BOARD_MOVE_EXCEPTIONS (D-29, D-33)`);
        }
    }
    // rule 5
    for (const e of exceptions) {
        if (!claimsPair(e.role, e)) {
            out.push(`${e.role}: rule 5: BOARD_MOVE_EXCEPTIONS declares \`${pairKey(e)}\` but the role no longer claims it (D-33)`);
        }
    }
    return out;
}
function checkBoardPartition() {
    process.stdout.write("\n[check-role-rules] board-move ownership is a partition of the seed board (D-29, D-33)\n");
    let model;
    let roles;
    const claims = {};
    try {
        model = partitionModel(ROOT);
        roles = listRoles(ROOT);
        for (const r of roles)
            claims[r] = claimedPairs(readFileSync(join(ROOT, ROLES_SUBPATH, r), "utf8"), model.columns);
    }
    catch (e) {
        fail(`board-move partition: derivation failed: ${e.message}`);
        return;
    }
    const pairs = roles.reduce((n, r) => n + claims[r].length, 0);
    process.stdout.write(`  INFO  board-move partition: ${pairs} claimed pair(s) over ${model.flow.length} flow column(s), ` +
        `terminal ${model.terminal}, ${BOARD_MOVE_EXCEPTIONS.length} declared exception(s)\n`);
    FAILS += reportMeasured({ label: "board-move partition", visited: roles.length, expected: ROLE_COUNT, findings: checkPartition(model, claims) }, { pass, fail: (s) => process.stdout.write(`  FAIL  ${s}\n`) }, (s) => `        - ${s}`);
}
// ---------------------------------------------------------------------------
// THE END-STATE ROLE CHECKS (D-08, D-10, D-35, D-36). Run on the current tree only, over the 19 roles
// in listRoles(); the protocol keeps its own shape (D-15) and is outside them. They add no fact kind to
// the baseline derivation, so the source_commit equality test is untouched.
// ---------------------------------------------------------------------------
/** The D-08 required role headings, in order. Any other `## ` heading may sit only between Responsibilities and Output. */
export const ROLE_HEADING_ORDER = [
    "## One job",
    "## Activates when",
    "## Reads",
    "## Responsibilities",
    "## Output",
    "## Board moves",
    "## Trace updates",
    "## Hard limits",
    "## Stop when",
];
/** Every fact each role must carry after the rewrite (D-36). */
export const D36_REQUIRED_FACTS = ["unknown-verify", "no-fabrication"];
/** The D-08 order findings for one role file: required headings in order, optional ones only in the open slot. */
export function checkHeadingOrder(role, raw) {
    const text = normalizeText(raw);
    const flags = fencedLineFlags(text);
    const headings = text
        .split("\n")
        .filter((l, i) => !flags[i] && l.startsWith("## "))
        .map((l) => l.trimEnd());
    const out = [];
    const required = headings.filter((h) => ROLE_HEADING_ORDER.includes(h));
    if (required.join("|") !== ROLE_HEADING_ORDER.join("|")) {
        out.push(`${role}: required headings out of order (D-08): found ${required.join(", ") || "none"}; ` +
            `expected ${ROLE_HEADING_ORDER.join(", ")}`);
        return out;
    }
    const open = headings.indexOf("## Responsibilities");
    const close = headings.indexOf("## Output");
    headings.forEach((h, i) => {
        if (ROLE_HEADING_ORDER.includes(h))
            return;
        if (i > open && i < close)
            return;
        out.push(`${role}: \`${h}\` sits outside \`## Responsibilities\` .. \`## Output\` (D-08)`);
    });
    return out;
}
/** The four end-state findings over the roles, given each role's current facts and raw text. */
export function checkEndState(roles, current, rawOf) {
    const out = [];
    for (const r of roles) {
        const now = current[r];
        if (!now) {
            out.push(`${r}: no derived facts`);
            continue;
        }
        if (now.facts.includes("coding-rules") && !D13_CODING_ROLES.includes(r)) {
            out.push(`${r}: carries the coding-rules line but is not a D13_CODING_ROLES member (D-35)`);
        }
        for (const fact of D36_REQUIRED_FACTS) {
            if (!now.facts.includes(fact))
                out.push(`${r}: missing fact ${fact} — every role must carry it (D-36)`);
        }
        if (now.stopWhenItems < 1)
            out.push(`${r}: \`## Stop when\` holds no list item (D-10)`);
        out.push(...checkHeadingOrder(r, rawOf(r)));
    }
    return out;
}
/** Serialize with every object key sorted, two-space indent, trailing newline. */
export function serializeBaseline(b) {
    const sortKeys = (v) => {
        if (Array.isArray(v))
            return v.map(sortKeys);
        if (v !== null && typeof v === "object") {
            const o = v;
            return Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortKeys(o[k])]));
        }
        return v;
    };
    return `${JSON.stringify(sortKeys(b), null, 2)}\n`;
}
function parseBaseline(raw) {
    const j = JSON.parse(raw);
    if (typeof j.source_commit !== "string" || !/^[0-9a-f]{40}$/.test(j.source_commit)) {
        throw new Error("source_commit is not a 40-character commit id");
    }
    if (j.files === null || typeof j.files !== "object")
        throw new Error("files is not an object");
    for (const [k, v] of Object.entries(j.files)) {
        if (!v || !Array.isArray(v.facts) || typeof v.stopWhenItems !== "number") {
            throw new Error(`files.${k} is not { facts: string[], stopWhenItems: number }`);
        }
    }
    return j;
}
function corpusCountFinding(corpus) {
    if (corpus.length === ROLE_COUNT + 1)
        return null;
    return (`role corpus has ${corpus.length} file(s), expected ROLE_COUNT + 1 = ${ROLE_COUNT + 1}: ` +
        corpus.join(", "));
}
function writeBaseline() {
    process.stdout.write("\n[check-role-rules --write-baseline] deriving the role-rule inventory (D-27)\n");
    let files;
    try {
        const corpus = roleCorpus(ROOT);
        const bad = corpusCountFinding(corpus);
        if (bad !== null)
            throw new Error(bad);
        files = deriveAll(ROOT);
    }
    catch (e) {
        fail(`derivation failed: ${e.message}`);
        return;
    }
    const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
    const out = serializeBaseline({ generated_by: GENERATED_BY, source_commit: sourceCommit, files });
    writeFileSync(abs(BASELINE_REL), out);
    pass(`wrote ${BASELINE_REL}: ${Object.keys(files).length} file(s) at ${sourceCommit}`);
}
function check() {
    process.stdout.write("\n[check-role-rules] every baseline role fact still holds (D-27, D-28, D-31, D-35)\n");
    const bp = abs(BASELINE_REL);
    if (!existsSync(bp)) {
        fail(`${BASELINE_REL} is missing — the inventory check refuses to run without its baseline (D-27)`);
        return;
    }
    let baseline;
    try {
        baseline = parseBaseline(readFileSync(bp, "utf8"));
    }
    catch (e) {
        fail(`${BASELINE_REL} is unparseable: ${e.message}`);
        return;
    }
    let corpus;
    let roles;
    let current;
    try {
        corpus = roleCorpus(ROOT);
        roles = listRoles(ROOT);
        current = deriveAll(ROOT);
    }
    catch (e) {
        fail(`derivation failed: ${e.message}`);
        return;
    }
    const bad = corpusCountFinding(corpus);
    if (bad !== null)
        fail(bad);
    const findings = [];
    let visited = 0;
    for (const f of Object.keys(baseline.files).sort()) {
        if (!(f in current))
            findings.push(`${f}: in the baseline but not on disk`);
    }
    for (const f of corpus) {
        if (!(f in baseline.files))
            findings.push(`${f}: on disk but not in the baseline`);
    }
    for (const f of corpus) {
        const before = baseline.files[f];
        const now = current[f];
        if (!before || !now)
            continue;
        visited++;
        let intended = 0;
        for (const fact of before.facts) {
            if (now.facts.includes(fact))
                continue;
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
        process.stdout.write(`  INFO  ${f}: facts before ${n} / after ${m}` +
            (intended > 0 ? ` (floor ${floor} after ${intended} intended D-13 removal(s))` : "") +
            "\n");
        if (m < floor)
            findings.push(`${f}: fact count fell from ${n} to ${m} (floor ${floor}) — "more detail" requires at least as many (D-31)`);
    }
    findings.push(...checkCodingRoleSet(D13_CODING_ROLES, roles, (r) => current[r]?.facts.includes("coding-rules") ?? false));
    FAILS += reportMeasured({
        label: "role-rule inventory",
        visited,
        expected: ROLE_COUNT + 1,
        findings,
    }, { pass, fail: (s) => process.stdout.write(`  FAIL  ${s}\n`) }, (s) => `        - ${s}`);
    process.stdout.write("\n[check-role-rules] every role holds its end state (D-08, D-10, D-35, D-36)\n");
    let endFindings;
    try {
        endFindings = checkEndState(roles, current, (r) => readFileSync(join(ROOT, ROLES_SUBPATH, r), "utf8"));
    }
    catch (e) {
        fail(`role end state: derivation failed: ${e.message}`);
        return;
    }
    FAILS += reportMeasured({ label: "role end state", visited: roles.filter((r) => r in current).length, expected: ROLE_COUNT, findings: endFindings }, { pass, fail: (s) => process.stdout.write(`  FAIL  ${s}\n`) }, (s) => `        - ${s}`);
}
export function runAll(argv = process.argv.slice(2)) {
    if (argv.includes("--write-baseline"))
        writeBaseline();
    else {
        check();
        checkBoardPartition();
    }
    process.stdout.write("\n== Result ==\n");
    if (FAILS === 0) {
        process.stdout.write("ALL CHECKS PASSED\n");
        process.exit(0);
    }
    else {
        process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
        process.exit(1);
    }
}
const isEntry = isEntrypoint(import.meta.url);
if (isEntry) {
    runAll();
}
