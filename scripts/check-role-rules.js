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
// CR-01 gap closure (plan 40-11). The D-30 stand-in admits every changed role clause when this check
// exits 0, so the project's hard safety rules are facts too (SAFETY_RULE_FACTS). They are read from the
// sentences of the unfenced lines of `## Hard limits` followed by `## Stop when`: a rule moved between
// those two sections keeps its fact, a rule moved anywhere else loses it:
//   no-merge no-deploy human-merge-deploy named-human production-human   CLAUDE.md Safety (hard)
//   no-overwrite dry-run                                                 CLAUDE.md Installers, T-40-16
//   no-relay wip-limit claim-cap only-spawner                            the coordinator rules, T-40-13
//   self-sign                                                            the sign-off rule, T-40-18
// CR-01 round 2 (plan 40-19): carriesSafetyFact is the table's some(), the one predicate the stand-in
// asks about a changed clause, and the parity case proves it sees every derived safety fact on the
// clauses voice-model.ts normalizes, at HEAD and at PHASE_40_START_COMMIT.
//
// THE BOARD-MOVE PARTITION (D-29, D-33). `--check` also runs a second named check on the current tree
// only: each role's exact `(from, to)` pairs, read from the `X → Y` code spans in `## Board moves`, must
// partition the seed board's flow (six rules: rules 1 to 5 in checkPartition, rule 6 in moveSpanFindings).
// The flow order, the Exit owners and the terminal column come from the seed board table.
// BOARD_MOVE_EXCEPTIONS and D33_NON_FORWARD_PAIRS are the two declared lists, each entry a recorded human
// decision. Rule 6 also refuses a move spelled with an ASCII arrow (`->`, `=>`) in a code span and a
// move between two board columns written outside a code span, so a move has one spelling (WR-02). It adds
// no fact kind to the baseline derivation.
//
// THE END-STATE CHECKS (D-08, D-10, D-35, D-36). `--check` also holds the 19 roles to the rewrite's
// end state: the D-13 set two-sided (a non-member carrying the coding-rules line is red), the
// `unknown-verify` and `no-fabrication` facts in every role, at least one `## Stop when` list item, and
// the D-08 heading order. The protocol keeps its own shape and is outside them.
//
// MODES. `--write-baseline` writes docs/audit/40-role-rule-inventory.json, deriving ONLY from git objects
// at PHASE_40_START_COMMIT (the pre-rewrite roles), never from the working tree; so re-running it after a
// role loses a fact writes the same bytes and cannot forgive the loss (WR-05). Every writer failure,
// including a run outside a git repository, is one named FAIL. The default `--check` reads the baseline,
// refuses to run without it, refuses one whose source_commit is not PHASE_40_START_COMMIT (WR-05), and
// never writes. `--check` also compares the committed baseline with a git derivation when the objects at
// PHASE_40_START_COMMIT are reachable, and says in a NOTE line when they are not (IN-01).
//
// Node stdlib only. Run the committed .js; CHECK_ROOT points it at a hermetic mirror in the tests.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, basename, dirname } from "node:path";
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
// The Phase 40 start commit, recorded by plan 40-01 as the baseline's source_commit and as base_commit
// in docs/audit/29-style-dispositions/00-base.md. The inventory is pinned to it by this constant, not by
// reading 00-base.md, so a later base move cannot re-point the inventory (WR-05).
export const PHASE_40_START_COMMIT = "e8d7802ccf8ebf428a47703f6001327325e3aea3";
// The kit paths the derivation reads. deriveAllAt materializes exactly these from git objects.
export const DERIVATION_PATHS = [
    "agent-factory/roles",
    "agent-factory/workflows",
    "agent-factory/checklists",
    "agent-factory/contracts",
    "agent-factory/seed/memory-bank",
];
// THE SAFETY-RULE FACTS (CR-01, plan 40-11). Each holds when at least one sentence of the role's
// `## Hard limits` + `## Stop when` text satisfies it. Adding or removing an entry changes the D-28
// closed list of kinds (FACT_KINDS) and needs a re-derived baseline.
export const SAFETY_RULE_FACTS = [
    // CLAUDE.md Safety (hard): agents never merge a protected branch.
    { fact: "no-merge", holds: (s) => /\bnever merge/i.test(s) },
    // CLAUDE.md Safety (hard): agents never deploy to production.
    { fact: "no-deploy", holds: (s) => /\bnever deploy/i.test(s) },
    // CLAUDE.md Safety (hard): humans hold merge and deploy.
    { fact: "human-merge-deploy", holds: (s) => /\bmerge and deploy (?:stay|remain)\b/i.test(s) },
    // CLAUDE.md Safety (hard): named human confirmation.
    { fact: "named-human", holds: (s) => /\bnamed human/i.test(s) },
    // CLAUDE.md Safety (hard): a production action needs a human.
    { fact: "production-human", holds: (s) => /\bproduction action/i.test(s) && /\bhuman/i.test(s) },
    // CLAUDE.md Installers / 40-SECURITY.md T-40-16: never overwrite or delete user content.
    { fact: "no-overwrite", holds: (s) => /\bnever overwrite/i.test(s) },
    // CLAUDE.md Installers / 40-SECURITY.md T-40-16: dry-run capable.
    { fact: "dry-run", holds: (s) => /\bdry[- ]run\b/i.test(s) },
    // 40-SECURITY.md T-40-13: no agent hands data to another.
    { fact: "no-relay", holds: (s) => /\b(?:never|not) relay/i.test(s) },
    // 40-SECURITY.md T-40-13: the coordinator's WIP limit (raw or normalized spelling, CR-01 round 2).
    { fact: "wip-limit", holds: (s) => /\bqueue[._ ]wip[_ ]limit\b/i.test(s) },
    // 40-SECURITY.md T-40-13: the per-delegation claim cap (raw or normalized spelling, CR-01 round 2).
    { fact: "claim-cap", holds: (s) => /\bqueue[._ ]claim[_ ]cap\b/i.test(s) },
    // 40-SECURITY.md T-40-13: only the Orchestrator spawns.
    { fact: "only-spawner", holds: (s) => /\bonly role that may spawn/i.test(s) },
    // 40-SECURITY.md T-40-18: an agent never signs off its own work (raw or normalized spelling, CR-01 round 2).
    { fact: "self-sign", holds: (s) => /\bself[- ]sign/i.test(s) },
];
/**
 * The one predicate the D-30 stand-in uses to refuse a changed role clause that carries a safety fact on
 * either side (human decision 2026-11-02, CR-01). It is the SAFETY_RULE_FACTS table's own some(), so no
 * fact pattern exists outside the table. It accepts a raw sentence or a clause normalized by
 * voice-model.ts (lowercase, punctuation folded to spaces, code spans unwrapped), which the parity case
 * in check-role-rules.test.ts proves for every corpus file at HEAD and at PHASE_40_START_COMMIT.
 */
export function carriesSafetyFact(text) {
    return SAFETY_RULE_FACTS.some((r) => r.holds(text));
}
// THE FACT KINDS (D-28, closed list). Every kind the derivation can emit: the exact facts, the three
// derived prefixes, and the twelve SAFETY_RULE_FACTS names (read from the table, never retyped). A kind
// removed from the derivation must also leave this list, which the kind-floor test makes visible: each
// kind here must occur at least once in the committed baseline. The kind-floor test also holds every
// derived fact, in the baseline and in deriveAll, inside this list, so a new kind needs an entry (IN-02).
export const FACT_KINDS = [
    "unknown-verify",
    "wf16",
    "wf17",
    "wf18",
    "absent-config",
    "blocked",
    "failed-attempt",
    "no-fabrication",
    "coding-rules",
    "announce",
    "exit",
    "junior:",
    "kit-ref:",
    "board-from:",
    ...SAFETY_RULE_FACTS.map((r) => r.fact),
];
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
export function sectionLines(text, flags, prefix) {
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
    const hardLimits = sectionLines(text, flags, "## Hard limits");
    if (hardLimits.some((l) => FABRICATION_WORD.test(l))) {
        facts.add("no-fabrication");
    }
    // CR-01: the safety-rule facts, read from the sentences of `## Hard limits` then `## Stop when`.
    const ruleText = [...hardLimits, ...sectionLines(text, flags, "## Stop when")].join(" ").replace(/\s+/g, " ").trim();
    const sentences = ruleText.split(/(?<=[.;:!?])\s+/);
    for (const rule of SAFETY_RULE_FACTS) {
        if (sentences.some((x) => rule.holds(x)))
            facts.add(rule.fact);
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
 * Derive every corpus file's facts from the git objects at `sha`, never from the working tree (WR-05).
 * Materializes DERIVATION_PATHS into a temp directory, derives, and removes the directory. Throws an
 * Error naming the sha, the root and the git command on any git failure.
 */
export function deriveAllAt(root, sha) {
    const git = (args) => {
        try {
            return execFileSync("git", ["-C", root, ...args], {
                maxBuffer: 64 * 1024 * 1024,
                stdio: ["ignore", "pipe", "pipe"],
            });
        }
        catch (e) {
            const stderr = String(e.stderr ?? "").trim();
            throw new Error(`git objects at ${sha} are unreadable under ${root}: \`git ${args.join(" ")}\` failed` +
                (stderr !== "" ? ` (${stderr.split("\n")[0]})` : ` (${e.message.split("\n")[0]})`));
        }
    };
    const paths = git(["ls-tree", "-r", "--name-only", sha, "--", ...DERIVATION_PATHS])
        .toString("utf8")
        .split("\n")
        .filter((p) => p !== "");
    if (paths.length === 0)
        throw new Error(`git objects at ${sha} under ${root} hold no file under ${DERIVATION_PATHS.join(", ")}`);
    const tmp = mkdtempSync(join(tmpdir(), "role-rules-at-"));
    try {
        for (const p of paths) {
            const blob = git(["show", `${sha}:${p}`]);
            const dst = join(tmp, p);
            mkdirSync(dirname(dst), { recursive: true });
            writeFileSync(dst, blob);
        }
        return deriveAll(tmp);
    }
    finally {
        rmSync(tmp, { recursive: true, force: true });
    }
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
// THE DECLARED EXCEPTIONS (D-33, approved by the human in plan 40-02's checkpoint). With the lean close in
// D33_NON_FORWARD_PAIRS, these are the only moves a role may claim out of a column it does not own. Adding an entry needs a recorded human
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
// THE APPROVED NON-FORWARD PAIRS (D-33, WR-01). Owned moves the human approved in the D-33 pair table at
// plan 40-02's checkpoint whose target is not the next flow column. Rule 4 admits them for their role
// only. An addition needs a recorded human decision, like BOARD_MOVE_EXCEPTIONS, and rule 5 turns an
// entry its role no longer claims red.
export const D33_NON_FORWARD_PAIRS = [
    {
        role: "orchestrator.md",
        from: "In UAT",
        to: "Done",
        reason: "the lean-mode close into the terminal column, in the D-33 pair table approved at the 40-02 checkpoint",
    },
    {
        role: "qe-e2e.md",
        from: "In Review",
        to: "Ready for UAT",
        reason: "no Security/NFR review triggered, in the D-33 pair table approved at the 40-02 checkpoint",
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
 * Rule 6: the span and spelling rule over the unfenced `## Board moves` lines. A board move has one
 * spelling, the code span `X → Y`, because that is the only spelling claimedPairs reads and rule 4 judges.
 *   (a) WR-02: a code span that holds `->` or `=>` is one finding (checked first, so it yields exactly one).
 *   (b) IN-02: a code span that holds `→` but does not split on " → " into exactly two board columns.
 *   (c) WR-02: with every code span blanked, a line that names two board columns around `→`, `->` or `=>`
 *       is a move written outside a code span. The columns come from the argument (the seed board), each
 *       matched whole, longest first, case-insensitive; a prose arrow between other words is no finding.
 * Reads the spans exactly as claimedPairs does; deriveRoleFacts and its lenient bare-`→` split are left as
 * they are, because the baseline was derived with them.
 */
export function moveSpanFindings(raw, columns, role) {
    const text = normalizeText(raw);
    const flags = fencedLineFlags(text);
    const lines = sectionLines(text, flags, "## Board moves");
    const moves = lines.join("\n");
    const out = [];
    for (const m of moves.matchAll(/`([^`\n]+)`/g)) {
        if (m[1].includes("->") || m[1].includes("=>")) {
            out.push(`${role}: rule 6: \`${m[1]}\` spells a board move with an ASCII arrow; write it as \`X → Y\` (WR-02)`);
            continue;
        }
        if (!m[1].includes("→"))
            continue;
        const parts = m[1].split(ARROW).map((x) => x.trim());
        if (parts.length === 2 && columns.has(parts[0]) && columns.has(parts[1]))
            continue;
        out.push(`${role}: rule 6: \`${m[1]}\` holds → but is not a \`column → column\` pair (IN-02)`);
    }
    if (columns.size === 0)
        return out;
    const col = `(?<![A-Za-z0-9])(?:${[...columns].sort((a, b) => b.length - a.length).map(escapeRe).join("|")})(?![A-Za-z0-9])`;
    const prose = new RegExp(`${col}\\s*(?:→|->|=>)\\s*${col}`, "gi");
    for (const line of lines) {
        for (const m of line.replace(/`[^`\n]+`/g, " ").matchAll(prose)) {
            out.push(`${role}: rule 6: \`${m[0]}\` is a board move written outside a code span; write it as \`X → Y\` in a code span (WR-02)`);
        }
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
/**
 * The partition rules 1 to 5 over the claimed pairs (rule 6, the span and spelling rule, is
 * moveSpanFindings). Returns the findings, each naming role, pair and rule.
 */
export function checkPartition(model, claims, exceptions = BOARD_MOVE_EXCEPTIONS, approved = D33_NON_FORWARD_PAIRS) {
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
    const declared = (r, p) => [...exceptions, ...approved].some((e) => e.role === r && e.from === p.from && e.to === p.to);
    const outsideFlow = (c) => model.columns.has(c) && !model.flow.includes(c);
    for (const r of roles) {
        for (const p of claimsOf(r)) {
            if (declared(r, p))
                continue;
            const fromOwner = model.owners.get(p.from);
            if (fromOwner === r) {
                const next = model.flow[model.flow.indexOf(p.from) + 1];
                if (p.to === next || outsideFlow(p.to))
                    continue;
                out.push(`${r}: rule 4: claims \`${pairKey(p)}\` out of its own column, but ${p.to} is neither the next flow column ` +
                    `(${next ?? "none"}) nor outside the flow, and the pair is not declared (WR-01, D-33)`);
                continue;
            }
            const why = fromOwner === undefined ? `${p.from} has no role as its Exit owner` : `${p.from} is owned by ${fromOwner}`;
            out.push(`${r}: rule 4: claims \`${pairKey(p)}\` but ${why}, and the pair is not in BOARD_MOVE_EXCEPTIONS (D-29, D-33)`);
        }
    }
    // rule 5
    for (const [name, list] of [
        ["BOARD_MOVE_EXCEPTIONS", exceptions],
        ["D33_NON_FORWARD_PAIRS", approved],
    ]) {
        for (const e of list) {
            if (!claimsPair(e.role, e)) {
                out.push(`${e.role}: rule 5: ${name} declares \`${pairKey(e)}\` but the role no longer claims it (D-33)`);
            }
        }
    }
    return out;
}
function checkBoardPartition() {
    process.stdout.write("\n[check-role-rules] board-move ownership is a partition of the seed board (D-29, D-33)\n");
    let model;
    let roles;
    const claims = {};
    const spanFindings = [];
    try {
        model = partitionModel(ROOT);
        roles = listRoles(ROOT);
        for (const r of roles) {
            const raw = readFileSync(join(ROOT, ROLES_SUBPATH, r), "utf8");
            claims[r] = claimedPairs(raw, model.columns);
            spanFindings.push(...moveSpanFindings(raw, model.columns, r));
        }
    }
    catch (e) {
        fail(`board-move partition: derivation failed: ${e.message}`);
        return;
    }
    const pairs = roles.reduce((n, r) => n + claims[r].length, 0);
    process.stdout.write(`  INFO  board-move partition: ${pairs} claimed pair(s) over ${model.flow.length} flow column(s), ` +
        `terminal ${model.terminal}, ${BOARD_MOVE_EXCEPTIONS.length} declared exception(s), ` +
        `${D33_NON_FORWARD_PAIRS.length} approved non-forward pair(s)\n`);
    FAILS += reportMeasured({ label: "board-move partition", visited: roles.length, expected: ROLE_COUNT, findings: [...checkPartition(model, claims), ...spanFindings] }, { pass, fail: (s) => process.stdout.write(`  FAIL  ${s}\n`) }, (s) => `        - ${s}`);
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
    const open = headings.findIndex((h) => h === "## Responsibilities");
    const close = headings.findIndex((h) => h === "## Output");
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
    process.stdout.write(`\n[check-role-rules --write-baseline] deriving the role-rule inventory from git objects at ${PHASE_40_START_COMMIT} (D-27, WR-05)\n`);
    let out;
    let count;
    try {
        const files = deriveAllAt(ROOT, PHASE_40_START_COMMIT);
        const bad = corpusCountFinding(Object.keys(files).sort());
        if (bad !== null)
            throw new Error(bad);
        count = Object.keys(files).length;
        out = serializeBaseline({ generated_by: GENERATED_BY, source_commit: PHASE_40_START_COMMIT, files });
    }
    catch (e) {
        fail(`derivation at PHASE_40_START_COMMIT ${PHASE_40_START_COMMIT} failed, so ${BASELINE_REL} was not written (WR-05): ` +
            e.message);
        return;
    }
    try {
        writeFileSync(abs(BASELINE_REL), out);
    }
    catch (e) {
        fail(`could not write ${BASELINE_REL}: ${e.message}`);
        return;
    }
    pass(`wrote ${BASELINE_REL}: ${count} file(s) at ${PHASE_40_START_COMMIT}`);
}
/** True when the commit `sha` is readable from `root`'s git objects; false on any git error (IN-01). */
function gitObjectsReachable(root, sha) {
    try {
        execFileSync("git", ["-C", root, "cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * What differs between the committed baseline and a fresh derivation (IN-01): the sorted names of the
 * files whose facts or stopWhenItems differ (or that only one side holds), then any top-level key that
 * differs. Empty when only the formatting differs.
 */
function baselineDifferences(committed, fresh) {
    const out = [];
    const names = [...new Set([...Object.keys(committed.files), ...Object.keys(fresh.files)])].sort();
    for (const f of names) {
        const a = committed.files[f];
        const b = fresh.files[f];
        if (!a || !b || JSON.stringify(a.facts) !== JSON.stringify(b.facts) || a.stopWhenItems !== b.stopWhenItems)
            out.push(f);
    }
    const c = committed;
    const d = fresh;
    const keys = [...new Set([...Object.keys(c), ...Object.keys(d)])].filter((k) => k !== "files").sort();
    for (const k of keys)
        if (JSON.stringify(c[k]) !== JSON.stringify(d[k]))
            out.push(`top-level key ${k}`);
    return out;
}
function check() {
    process.stdout.write("\n[check-role-rules] every baseline role fact still holds (D-27, D-28, D-31, D-35)\n");
    const bp = abs(BASELINE_REL);
    if (!existsSync(bp)) {
        fail(`${BASELINE_REL} is missing — the inventory check refuses to run without its baseline (D-27)`);
        return;
    }
    let baseline;
    let baselineRaw;
    try {
        baselineRaw = readFileSync(bp, "utf8");
        baseline = parseBaseline(baselineRaw);
    }
    catch (e) {
        fail(`${BASELINE_REL} is unparseable: ${e.message}`);
        return;
    }
    if (baseline.source_commit !== PHASE_40_START_COMMIT) {
        fail(`${BASELINE_REL}: the baseline was derived at ${baseline.source_commit}, but the inventory is pinned to ` +
            `PHASE_40_START_COMMIT ${PHASE_40_START_COMMIT} (WR-05)`);
        return;
    }
    // IN-01: the stand-in trusts this check, so the baseline's contents are checked against git whenever
    // git can disprove them. A difference is a FAIL, and losses are then judged against the git-derived
    // facts, so a fact dropped from the JSON together with its rule is still named.
    if (gitObjectsReachable(ROOT, PHASE_40_START_COMMIT)) {
        let fresh;
        try {
            fresh = deriveAllAt(ROOT, PHASE_40_START_COMMIT);
        }
        catch (e) {
            fail(`${BASELINE_REL} could not be compared with a fresh derivation out of git (IN-01): ${e.message}`);
            return;
        }
        const expected = { generated_by: GENERATED_BY, source_commit: PHASE_40_START_COMMIT, files: fresh };
        if (serializeBaseline(expected) === baselineRaw) {
            pass(`${BASELINE_REL} equals a fresh derivation out of git objects at ${PHASE_40_START_COMMIT.slice(0, 7)} (IN-01)`);
        }
        else {
            const diffs = baselineDifferences(baseline, expected);
            fail(`${BASELINE_REL} differs from a fresh derivation out of git objects at ${PHASE_40_START_COMMIT}: ` +
                (diffs.length > 0 ? diffs.join(", ") : "formatting only") +
                " — losses below are judged against the git-derived facts (IN-01)");
            baseline = expected;
        }
    }
    else {
        process.stdout.write(`  NOTE  git objects at ${PHASE_40_START_COMMIT} are not reachable under ${ROOT}, so ${BASELINE_REL} was read ` +
            "as written and not compared with git (IN-01)\n");
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
