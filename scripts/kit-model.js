// kit-model.ts — the single authority for "which roles, workflows and ADAPTERS exist" (KIT-01 /
// KIT-02, Phase 27).
//
// Every guard, validator and generator that needs the kit's role or workflow set asks THIS module.
// Before Phase 27 the same set was hand-listed in at least four places (the guard's ROLE_FILES, the
// validator's ROLES/WORKFLOWS arrays, the guard harness's GUARD_INPUTS, the generator's own inline
// readdir). Hand-maintained sets rot silently while the suite stays green — that is the founding
// defect this milestone exists to delete. One derivation, many consumers: add role #18 and every
// consumer sees it in the same run.
//
// The derivation rules are lifted VERBATIM from scripts/generate-catalog.ts (the prior art that was
// already correct): roles are `.md` entries that do NOT start with `_` (so `_role-switch-protocol.md`
// is excluded — that exclusion is what makes the count 17 and not 18); workflows are entries matching
// the two-digit-prefix pattern `NN-*.md`. Both results are `.sort()`ed before return so two runs over
// the same tree yield identical arrays and every derived consumer's output ordering is stable
// regardless of readdirSync order.
//
// RETURN SHAPE (pinned here, relied on by every consumer): filenames WITH the `.md` extension, e.g.
// `orchestrator.md`. This matches generate-catalog.ts and the guards that build repo-relative paths
// from the result. A consumer that wants the bare stem strips the extension at its own call site.
//
// KIT ROOT IS AN EXPLICIT PARAMETER (D-22). This module reads NO environment variable. The tree
// already carries three root conventions (CHECK_ROOT, VALIDATE_ROOT, VALIDATE_KIT_ROOT); a fourth
// read from inside a derivation module would make this file a new ROOT AUTHORITY rather than a
// derived one. Callers pass their already-resolved root; the parameter defaults to the script-
// relative repo root for the common in-repo case.
//
// THE ADAPTER HALF (KIT-02, plan 27-10). The role set got an authority in this file; the ADAPTER set
// did not, and five files each answered "what is an adapter" with their own directory read. Four of
// those reads were NON-RECURSIVE. That is not a style difference, it is a hole:
//
//   Claude Code discovers `.claude/agents/` RECURSIVELY and takes agent identity ONLY from
//   frontmatter (code.claude.com/docs/en/sub-agents). A file at `.claude/agents/<subdir>/<x>.md` is
//   therefore LOADED BY THE PLATFORM while a non-recursive derivation cannot see it — so it sits
//   outside the spawn-grant guard, the adapter-body guard, the byte-ceiling guard and the
//   referential-integrity oracle simultaneously.
//
// That bypass was reproduced (27-REVIEW.md § CR-01): a second live coordinator with its own
// enumerated grant, planted one directory deeper, left the whole suite printing ALL CHECKS PASSED.
// RECURSION IS THEREFORE THE RULE HERE, not a consumer's option: this module returns everything the
// platform would load, and a consumer that wants only the top-level entries FILTERS AT ITS OWN CALL
// SITE rather than re-deriving the set. Re-deriving is what produced two disagreeing answers to one
// filesystem fact in the first place.
//
// ADAPTER RETURN SHAPE (pinned, relied on by every consumer): paths RELATIVE to the adapter
// directory, WITH the `.md` extension, joined with a literal FORWARD SLASH on every platform (never
// the platform path separator), and sorted by the full relative path. The forward slash is what makes
// the returned values — and every guard message derived from them — byte-identical on Windows and on
// Unix. Sorting by the full relative path is what gives nested and top-level entries one specified,
// stable order; two calls over the same tree are deeply equal.
//
// SHAPE RULES: an agent adapter is any `.md` file found beneath the agents directory at ANY depth. A
// skill adapter is any file NAMED `SKILL.md` found beneath the skills directory at ANY depth — the
// rule is the FILE NAME, not the directory depth, so a skill nested one level deeper is still a skill
// and is still seen.
//
// SKILL_ADAPTER_COUNT LIVES HERE; AN AGENT-ADAPTER COUNT DELIBERATELY DOES NOT, AND A LATER PHASE
// MUST NOT ADD ONE. The KIT-03 referential-integrity oracle already pins the agent number by
// comparing the adapter set against the role corpus and the coordinator's grant closure; a constant
// asserting the same fact would be a SECOND authority for it, and the whole point of this module is
// that a fact has one. The skill half is the opposite case: a skill adapter has NO role to compare
// against, so the oracle is structurally blind to a deleted skill and a count is the only deletion
// signal. A count is also not the drift class this milestone deletes — the drift class is a LIST OF
// NAMES that consumers read as truth while it rots; a count is a number that can only ever fail
// closed.
//
// THE PLUGIN-FORM HALF (KIT-02, plan 27-34, closing CR-03). grugops ships TWO distribution forms of
// the same skills: the standalone `.claude/skills/grugops-<n>/SKILL.md` tree and the PLUGIN-form
// `skills/<n>/SKILL.md` tree at the repository root, which is what Claude Code loads for every
// `/plugin install` user (the manifest declares no component-path override and the marketplace entry
// sources the repository root, so default discovery applies). The plugin tree sat in NO derivation
// and NO scan set at all, while guard_wr05's pass line asserted "no non-coordinator holds the spawn
// grant" over a set that structurally could not see it — a membership set narrower than the fact it
// claims to describe, which is this milestone's founding defect. Reproduced end to end: a grant
// planted on `skills/plan/SKILL.md` printed ALL CHECKS PASSED at exit 0.
//
// The plugin half uses the SAME shape rule and the SAME walk as the standalone skill half — one
// mechanism, never a second one written to look almost the same.
//
// Path-traversal posture (ASVS V12, mirrors generate-catalog.ts): `agent-factory/roles`,
// `agent-factory/workflows`, `.claude/agents`, `.claude/skills` and `skills` are FIXED literal
// subpaths joined onto the supplied root. None is ever taken from argv, env, or file content.
//
// FAIL-CLOSED POSTURE — tier 1 of D-21: this module THROWS. It throws naming the directory when the
// directory cannot be read, and it throws naming the directory when the filtered result is length
// zero. A library that quietly returns [] is precisely what lets every downstream guard pass
// vacuously over an empty scan set, so the library refuses rather than reports. Tier 2 — the exact
// two-sided count check — lives in a GUARD (guard_kit_counts), because there continuing is safe and
// CI going red is the right signal. This module NEVER calls process.exit: it is imported, not run.
//
// Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
// Clear professional voice throughout (CLAUDE.md hard rule — this is a build-safety surface).
import { readdirSync, statSync, realpathSync, existsSync } from "node:fs";
import { join } from "node:path";
// The exact expected cardinality of each derived set. Enforcement is two-sided (D-20): 16 roles is a
// failure and 18 roles is a failure. Bumping either number is a DELIBERATE act that obliges the
// author to walk every derived consumer first — that walk is the whole point of the constant.
export const ROLE_COUNT = 17;
export const WORKFLOW_COUNT = 19;
// The exact expected number of SKILL adapters. It sits beside the other two cardinalities because it
// is the same kind of fact; see the module header for why the skill half earns a count and the agent
// half deliberately does not.
export const SKILL_ADAPTER_COUNT = 7;
// The exact expected number of PLUGIN-FORM skill adapters (plan 27-34). It earns a count for exactly
// the reason the standalone skill count does — see the module header's argument at SKILL_ADAPTER_COUNT
// above and the paragraph it points at: the plugin tree has NO role corpus for the KIT-03 oracle to
// cross-check it against, so the oracle is structurally blind to a deleted plugin skill and a count is
// its ONLY deletion signal. It is if anything the weaker of the two surfaces: the standalone tree at
// least has a freshness gate over its siblings, and the plugin tree has nothing.
//
// AND THIS IS A COUNT, NOT A LIST OF NAMES, so it is not the drift class this milestone deletes. The
// drift class is an enumeration consumers read as truth while it rots; a number can only ever fail
// closed. The membership itself is DERIVED by listPluginSkillAdapters() below — never written down.
export const PLUGIN_SKILL_ADAPTER_COUNT = 7;
// The exact expected cardinality of the SPAWN-GRANT SCAN COMPOSITION below: 17 agent adapters +
// 7 standalone skill adapters + 7 plugin-form skill adapters + 2 packaging templates.
//
// THIS PIN IS MANDATORY, NOT NICE TO HAVE, AND THE REASON IS SPECIFIC (D-19 / D-20, plan 27-33).
// The composition exists so that check-foundation-guards.ts's spawn-grant scan and the false-red
// control in scripts/frontmatter.test.ts cannot answer "what is scanned" differently. But once both
// read THE SAME OBJECT, set equality between them compares an object with itself and can never fail —
// so it is documentation of intent, never a check, and it must never be presented as one. A COUNT is
// then the only thing that can catch a part dropped during the relocation.
//
// What the pin exists to catch, concretely: a one-line slip losing the standalone skills from the
// composition would leave the false-red control passing over a SUBSET, that tautological set equality
// still passing, the gate exiting 0, the packaging-template count unchanged and the whole suite green
// — while seven shipped skill adapters silently left the spawn-grant scan. That is CR-03's own shape
// arriving through the move that closes CR-03, and it is the third recurrence of this shape in one
// phase. Derive the set, assert the count.
//
// THE COUNT ALONE IS NOT ENOUGH, WHICH IS WHY guardKitCounts ALSO ASSERTS PER-PART MEMBERSHIP. Three
// integer comparisons pass while a decoy under `.claude/agents` displaces a real adapter; a swap
// between parts nets out to the right total. The per-part assertion is SET equality against each
// lister, never a count.
//
// RAISED 26 -> 33 BY PLAN 27-34, in the same edit that folded the PLUGIN-FORM skill tree in. Raising
// the constant is the deliberate act D-20 requires: it obliges the author to walk every consumer
// before the number moves, which is the whole point of the number. The per-part membership assertion
// was extended to ALL FOUR parts in the same edit — asserting membership of only the part being ADDED
// says nothing about the parts already there, so a widening that silently SWAPPED one part for another
// would keep the total at 33 and pass. That gap is CR-03's own shape and it has now appeared three
// times in this phase; the four-part assertion is what closes it.
export const SPAWN_GRANT_SCAN_COUNT = 33;
// MAX_WALK_ENTRIES — the recursive walk's WORK bound (D-35, closing WR-01).
//
// A SECOND MECHANISM, DELIBERATELY SEPARATE FROM THE CYCLE ANSWER. The `ancestors` stack in
// walkFilesRelative answers exactly one question — "is this directory already on THIS recursion
// path?" — and answers it correctly. It answers NOTHING about cost. A symlink DAG contains NO
// cycle and still yields exponentially many distinct relative paths: measured here on darwin /
// node v24, 15 directories each holding two forward links to their successor produced 32,767
// members in 12.2 seconds, doubling with every directory added. The ancestor stack is right at
// every step of that walk; it is simply not the mechanism that bounds it.
//
// WHY THAT MATTERS MORE ON THIS SIDE. This walk runs inside scripts/check-foundation-guards.js in
// CI. A walk that does not terminate promptly HANGS THE GATE RATHER THAN FAILING IT, and a hung
// gate is not a red gate — it is a gate with no verdict at all. So the bound exists to convert an
// unbounded cost into a loud, named refusal.
//
// EXCEEDING IT THROWS, MATCHING THIS MODULE'S FLOOR. D-21 tier 1: this module throws rather than
// reports, because a vacuous or truncated scan set here passes every downstream guard. Silently
// returning the members collected so far would be exactly that truncation. The twin in
// install/kit-source.ts carries the same constant at the same value and refuses through ITS
// documented floor, which is to report.
export const MAX_WALK_ENTRIES = 10000;
// Default kit root = this script's parent (scripts/ -> repo root). Callers with an already-resolved
// root pass it explicitly (D-22) rather than letting this module re-resolve.
const DEFAULT_KIT_ROOT = join(import.meta.dirname, "..");
// Fixed literal subpaths — never argv/env/content-derived (ASVS V12).
const ROLES_SUBPATH = "agent-factory/roles";
const WORKFLOWS_SUBPATH = "agent-factory/workflows";
const AGENTS_SUBPATH = ".claude/agents";
const SKILLS_SUBPATH = ".claude/skills";
const PACKAGING_SUBPATH = "agent-factory/packaging";
// The PLUGIN-form skill tree at the repository root (plan 27-34). Distinct from SKILLS_SUBPATH above
// and never a prefix of it, so partitioning the composition on either literal is unambiguous.
const PLUGIN_SKILLS_SUBPATH = "skills";
// The markdown extension. Named once because two rules below turn on it — "is this a frontmatter-
// bearing adapter surface" and "does the exempt directory carry an adapter" — and a second spelling
// of one fact is the drift class this module deletes even when the fact is three characters long.
const MARKDOWN_EXT = ".md";
export const PLUGIN_MANIFEST_COMPONENT_SCHEMA = [
    { manifestKey: "agents", probeDirs: ["agents"] },
    { manifestKey: "commands", probeDirs: ["commands"] },
    { manifestKey: "skills", probeDirs: [PLUGIN_SKILLS_SUBPATH] },
    { manifestKey: "hooks", probeDirs: ["hooks"] },
    { manifestKey: "mcpServers", probeDirs: ["mcpServers"] },
    { manifestKey: "lspServers", probeDirs: ["lspServers"] },
    { manifestKey: "outputStyles", probeDirs: ["outputStyles"] },
    // `UNKNOWN - verify`: the platform's default-discovery DIRECTORY NAME for the two `experimental.`
    // keys is not documented in this repository. BOTH spellings are probed — the flattened `themes/`
    // and the nested `experimental/themes/` — because probing an absent directory costs nothing while
    // missing a loaded one is the exact defect class this block closes. Probing both is the cheap
    // answer to a genuine unknown; guessing one would be the expensive one.
    {
        manifestKey: "experimental.themes",
        probeDirs: ["themes", "experimental/themes"],
    },
    {
        manifestKey: "experimental.monitors",
        probeDirs: ["monitors", "experimental/monitors"],
    },
];
// The schema's exact cardinality, enforced TWO-SIDED in guard_kit_counts exactly as ROLE_COUNT,
// WORKFLOW_COUNT, SKILL_ADAPTER_COUNT, PLUGIN_SKILL_ADAPTER_COUNT and SPAWN_GRANT_SCAN_COUNT are:
// eight entries is a failure and ten entries is a failure, only nine passes. Bumping the number is a
// DELIBERATE act that obliges the author to walk every consumer first — the bucket partition, the
// forbidden-set computation, the probe, the exemption bound and the gate's disposition line — and
// that walk is the whole point of the constant.
export const PLUGIN_MANIFEST_COMPONENT_COUNT = 9;
export const PLUGIN_COMPONENT_COVERED_ELSEWHERE = [
    {
        manifestKey: "skills",
        coverer: "listPluginSkillAdapters",
        reason: "the plugin-form skill tree is derived by listPluginSkillAdapters(), pinned two-sided by " +
            "PLUGIN_SKILL_ADAPTER_COUNT and folded into spawnGrantScan(), so every file the platform " +
            "loads from it is already inside the spawn-grant scan that guard_wr05 walks",
    },
];
export const PLUGIN_COMPONENT_EXEMPT = [
    {
        manifestKey: "hooks",
        reason: "hooks/ exists on the live tree and holds the PreToolUse prod-deploy guard; CLAUDE.md makes " +
            "that mechanical guard a hard safety constraint, so relocating it to satisfy a guard rule " +
            "would be the guard bending the product",
        bound: "every markdown (frontmatter-bearing) member of hooks/ must be inside SPAWN_GRANT_SCAN, AND " +
            "hooks/ must carry ZERO markdown adapters — the first is vacuous today (0 markdown members, a " +
            "measured number the gate prints rather than a coverage claim), the second is what fails " +
            "closed the moment a markdown adapter appears there",
    },
];
// THE FORBIDDEN SET — COMPUTED as schema minus covered minus exempt, and NEVER written down a second
// time. A reviewer reading this file finds exactly ONE enumeration of component keys, which is what
// makes the partition a derivation rather than a list with a comment beside it.
export function pluginForbiddenComponentKeys() {
    const claimed = new Set([
        ...PLUGIN_COMPONENT_COVERED_ELSEWHERE.map((c) => c.manifestKey),
        ...PLUGIN_COMPONENT_EXEMPT.map((e) => e.manifestKey),
    ]);
    return PLUGIN_MANIFEST_COMPONENT_SCHEMA.map((e) => e.manifestKey).filter((k) => !claimed.has(k));
}
export function partitionPluginComponentClaims(schemaKeys, forbiddenKeys, coveredKeys, exemptKeys) {
    const claimedKeys = [...forbiddenKeys, ...coveredKeys, ...exemptKeys];
    return {
        unclaimed: schemaKeys.filter((k) => !claimedKeys.includes(k)),
        doubleClaimed: schemaKeys.filter((k) => claimedKeys.filter((c) => c === k).length > 1),
        foreign: claimedKeys.filter((k) => !schemaKeys.includes(k)),
    };
}
// The forbidden keys' probe directories, flattened and sorted. Sorted so two gate runs over one tree
// produce byte-identical dispositions; more directories than keys, because the two `experimental.`
// keys each carry both candidate spellings of an `UNKNOWN - verify` directory name.
export function pluginForbiddenComponentSubpaths() {
    const keys = new Set(pluginForbiddenComponentKeys());
    return PLUGIN_MANIFEST_COMPONENT_SCHEMA.filter((e) => keys.has(e.manifestKey))
        .flatMap((e) => [...e.probeDirs])
        .sort();
}
// The schema entries the exemption names. Throws when an exemption names a key the schema does not
// carry: an exemption for a surface outside the schema is an exemption for nothing, and silently
// returning an empty list would make the bound vacuous in exactly the way the bound exists to
// prevent. (guard_kit_counts' partition floor names the same condition from the other side.)
function pluginExemptComponentEntries() {
    return PLUGIN_COMPONENT_EXEMPT.map((exemption) => {
        const entry = PLUGIN_MANIFEST_COMPONENT_SCHEMA.find((e) => e.manifestKey === exemption.manifestKey);
        if (entry === undefined) {
            throw new Error(`kit-model: the plugin component exemption names \`${exemption.manifestKey}\`, which is not ` +
                `in PLUGIN_MANIFEST_COMPONENT_SCHEMA — an exemption for a surface outside the schema ` +
                `bounds nothing, and returning an empty list would make the exemption's own bound vacuous`);
        }
        return { entry, exemption };
    });
}
// Read a directory, rethrowing as a NAMED error. The raw ENOENT/EACCES message does not identify
// which kit directory failed once two call sites share this helper.
function readDirOrThrow(dir) {
    try {
        return readdirSync(dir);
    }
    catch {
        throw new Error(`kit-model: cannot read kit directory ${dir}`);
    }
}
// Refuse a zero-length filtered set (D-21 tier 1). Returning [] here would let every downstream
// scan-set consumer report PASS over nothing.
function refuseEmpty(files, dir, kind) {
    if (files.length === 0) {
        throw new Error(`kit-model: no ${kind} files found in ${dir} — refusing to return an empty set (a vacuous scan set passes every guard)`);
    }
    return files;
}
// The role corpus: `.md`, not `_`-prefixed, sorted. 17 files today.
export function listRoles(kitRoot = DEFAULT_KIT_ROOT) {
    const dir = join(kitRoot, ROLES_SUBPATH);
    const files = readDirOrThrow(dir)
        .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
        .sort();
    return refuseEmpty(files, dir, "role");
}
// The workflow corpus: `NN-*.md`, sorted. 19 files today (00..18).
export function listWorkflows(kitRoot = DEFAULT_KIT_ROOT) {
    const dir = join(kitRoot, WORKFLOWS_SUBPATH);
    const files = readDirOrThrow(dir)
        .filter((f) => /^\d{2}-.+\.md$/.test(f))
        .sort();
    return refuseEmpty(files, dir, "workflow");
}
function walkFilesRelative(dir) {
    return walkLevel(dir, "", [], { examined: 0 });
}
function walkLevel(dir, base, ancestors, budget) {
    const out = [];
    const here = join(dir, base);
    let real;
    try {
        real = realpathSync(here);
    }
    catch {
        real = null;
    }
    if (real !== null && ancestors.includes(real)) {
        // Cycle on THIS path — stop descending, and REFUSE BY NAME (D-36). `base` is never "" here:
        // the root call starts with no ancestors, so the first repeat is always at least one level in.
        throw new Error(`kit-model: symlink cycle at ${base} while walking ${dir} — this directory already appears ` +
            `on its own recursion path, so descending would not terminate. Refusing to return a member ` +
            `set that silently omits everything below it: a short scan set passes every downstream ` +
            `guard exactly the way a vacuous one does.`);
    }
    const nextAncestors = real === null ? ancestors : [...ancestors, real];
    for (const name of readDirOrThrow(here)) {
        // Count the entry BEFORE deciding whether to descend into it or collect it, so the bound limits
        // WORK directly and is independent of the tree's shape. Exact integer comparison at the named
        // constant: the 10000th entry examined is still under the bound and the 10001st trips it, so
        // the threshold cannot be crossed by an off-by-one or by a rounding of any kind.
        budget.examined += 1;
        if (budget.examined > MAX_WALK_ENTRIES) {
            throw new Error(`kit-model: the walk of ${dir} examined more than MAX_WALK_ENTRIES=${MAX_WALK_ENTRIES} ` +
                `directory entries, reaching ${here} — refusing to continue. A symlink DAG with no cycle ` +
                `at all can still expand into exponentially many distinct relative paths, so the ` +
                `per-path cycle answer cannot bound this walk and a separate work bound does. Returning ` +
                `the members collected so far would be a silent truncation, and a truncated scan set ` +
                `passes every downstream guard.`);
        }
        const rel = base === "" ? name : `${base}/${name}`;
        const full = join(dir, base, name);
        let isDir;
        try {
            isDir = statSync(full).isDirectory();
        }
        catch {
            // A vanished/unstattable entry between the readdir and the stat is a race, not a member.
            // Skipping it here cannot hide a real adapter: the next run's readdir either sees it or it
            // genuinely is not there. The vacuity refusal below still covers "the whole set came back
            // empty".
            continue;
        }
        if (isDir)
            out.push(...walkLevel(dir, rel, nextAncestors, budget));
        else
            out.push(rel);
    }
    return out;
}
// The agent-adapter corpus: every `.md` file beneath `.claude/agents` AT ANY DEPTH, as forward-slash
// relative paths, sorted by the full relative path. 17 files today, all top-level.
//
// Recursive ON PURPOSE (module header): Claude Code loads nested agent files, so a derivation that
// could not see them would leave every one of them outside every guard. A consumer that wants only
// the top-level entries filters `!rel.includes("/")` at its own call site — it does NOT re-derive.
export function listAgentAdapters(kitRoot = DEFAULT_KIT_ROOT) {
    const dir = join(kitRoot, AGENTS_SUBPATH);
    const files = walkFilesRelative(dir)
        .filter((rel) => rel.endsWith(".md"))
        .sort();
    return refuseEmpty(files, dir, "agent adapter");
}
// The skill-adapter corpus: every file NAMED `SKILL.md` beneath `.claude/skills` AT ANY DEPTH, as
// forward-slash relative paths, sorted by the full relative path. 7 files today, each one level down
// (`<skill-name>/SKILL.md`).
//
// The shape rule is the FILE NAME, not the depth: `a/SKILL.md` and `a/b/SKILL.md` are both skills.
// A directory holding no SKILL.md contributes nothing, so a stray non-skill directory cannot join the
// set. Same recursive walk as the agent half — one mechanism, never a second one written to look
// almost the same.
export function listSkillAdapters(kitRoot = DEFAULT_KIT_ROOT) {
    const dir = join(kitRoot, SKILLS_SUBPATH);
    const files = walkFilesRelative(dir)
        .filter((rel) => rel.split("/").pop() === "SKILL.md")
        .sort();
    return refuseEmpty(files, dir, "skill adapter");
}
// The PLUGIN-FORM skill corpus: every file NAMED `SKILL.md` beneath the repository-root `skills`
// directory AT ANY DEPTH, as forward-slash relative paths, sorted by the full relative path. 7 files
// today, each one level down (`<skill-name>/SKILL.md`).
//
// SAME SHAPE RULE, SAME WALK, SAME FLOOR as listSkillAdapters() above — deliberately, because these
// are two distribution forms of one artifact and answering "what is a skill entry point" twice with
// two almost-identical rules is the drift class this module deletes. What differs is only WHICH
// directory is asked.
//
// WHY THIS SURFACE MATTERS (module header, the plugin-form half): this tree is what the platform
// loads for every `/plugin install` user, and until plan 27-34 it was in no derivation and no scan set
// anywhere in the repository. A rogue spawn grant planted here was live on a real user's machine while
// the whole gate printed ALL CHECKS PASSED.
export function listPluginSkillAdapters(kitRoot = DEFAULT_KIT_ROOT) {
    const dir = join(kitRoot, PLUGIN_SKILLS_SUBPATH);
    const files = walkFilesRelative(dir)
        .filter((rel) => rel.split("/").pop() === "SKILL.md")
        .sort();
    return refuseEmpty(files, dir, "plugin skill adapter");
}
// THE PLUGIN-DEFAULT COMPONENT PROBE (plan 27-34, rewritten by plan 27-37 / D-46) — an
// ABSENCE-OR-COVERAGE floor, not a corpus.
//
// WHAT CHANGED AND WHAT DID NOT. Only the SET it iterates changed: it now walks the COMPUTED
// forbidden subpaths (schema minus covered-elsewhere minus exempt) rather than the deleted
// two-element literal. Every posture below is preserved deliberately and none of it is an accident.
//
// DELIBERATELY NOT refuseEmpty AND DELIBERATELY NOT A THROW. Every other lister here refuses an empty
// result because an empty MEMBERSHIP set passes every guard vacuously. This is the opposite kind of
// question: absence is the EXPECTED and correct state for all seven forbidden surfaces on the live
// tree, and the consumer's finding is about files that exist, not about files that do not. Reporting
// `present: false` is the answer, never a failure. An unreadable directory still throws, through
// readDirOrThrow inside the shared walk — absence is the one answer the floor accepts and an
// unreadable directory is not evidence of it.
//
// Returns every file it finds, not only `.md`: the question is "would the platform load something we
// do not scan", and narrowing the probe by extension would let the next author drop a granted file
// under a name the filter cannot see.
export function listPluginDefaultComponentFiles(kitRoot = DEFAULT_KIT_ROOT) {
    return pluginForbiddenComponentSubpaths().map((subpath) => probeComponentDir(kitRoot, subpath));
}
// The one directory probe both surfaces share. Kept in one place so the forbidden floor and the
// exemption bound cannot answer "what is in this directory" two different ways.
function probeComponentDir(kitRoot, subpath) {
    const dir = join(kitRoot, subpath);
    if (!existsSync(dir))
        return { subpath, present: false, files: [] };
    return {
        subpath,
        present: true,
        files: walkFilesRelative(dir)
            .map((rel) => `${subpath}/${rel}`)
            .sort(),
    };
}
// THE EXEMPT-DIRECTORY PROBE (plan 27-37, D-46 point 3) — what makes the exemption a BOUND rather
// than a hole with a comment.
//
// Returns the exempt directory's files AND, separately, the MARKDOWN subset, so the guard can assert
// both bounds on MEASURED numbers and print them — including when they are zero — rather than
// asserting coverage before the test that could falsify it.
//
// "FRONTMATTER-BEARING" IS SPELLED AS "ENDS IN `.md`", ON PURPOSE. Every adapter surface this
// repository ships is a markdown document carrying a YAML frontmatter block, and markdown is the only
// extension the platform loads as an adapter — so the markdown subset IS the frontmatter-bearing
// subset. Deciding it by extension keeps this module free of a SECOND frontmatter grammar; the one
// authority on what a frontmatter block is lives in scripts/frontmatter.ts (D-44), and a probe that
// re-answered that question here would be the two-answers-to-one-fact shape this phase has collapsed
// four times already.
//
// Same non-throwing, absence-is-an-answer posture as the forbidden probe above; same shared walk, so
// an unreadable exempt directory still throws naming the directory.
export function listPluginExemptComponentFiles(kitRoot = DEFAULT_KIT_ROOT) {
    return pluginExemptComponentEntries().flatMap(({ entry, exemption }) => entry.probeDirs.map((subpath) => {
        const probe = probeComponentDir(kitRoot, subpath);
        return {
            manifestKey: entry.manifestKey,
            subpath: probe.subpath,
            present: probe.present,
            files: probe.files,
            markdownFiles: probe.files.filter((f) => f.endsWith(MARKDOWN_EXT)),
            reason: exemption.reason,
            bound: exemption.bound,
        };
    }));
}
// ---------------------------------------------------------------------------
// The packaging templates, and THE ONE SPAWN-GRANT SCAN COMPOSITION (plan 27-33)
// ---------------------------------------------------------------------------
// The packaging-template corpus: the entries of the FLAT packaging directory whose name ends in one
// of the two adapter-FRONTMATTER template suffixes, sorted. 2 files today.
//
// THE SHAPE RULE TRAVELLED HERE VERBATIM from check-foundation-guards.ts, including what it excludes
// and why. `agent-factory/packaging/adapters.md` is PROSE ABOUT adapters, not an adapter surface, and
// is OUT of the scan (D-09) — excluded BY THE SHAPE RULE rather than by omission from a hand list, so
// it cannot silently drift back in.
//
// FLAT, NOT RECURSIVE, and that is deliberate rather than an oversight: this is a flat literal
// directory of templates, not an adapter directory the platform discovers recursively. Packaging
// templates are also NOT derived from the adapter authority — that directory's shape rule admits only
// adapter-frontmatter templates and deriving it from the adapter walk would be a category error.
//
// FAIL-CLOSED like every other lister here (D-21 tier 1): it throws naming the directory when the
// directory cannot be read, and throws naming the directory when the filtered result is empty. A
// caller that must survive the throw wraps it — see check-foundation-guards.ts's `derive()`, which
// records the message and continues with an empty list that the count floor then NAMES.
export function listPackagingTemplates(kitRoot = DEFAULT_KIT_ROOT) {
    const dir = join(kitRoot, PACKAGING_SUBPATH);
    const files = readDirOrThrow(dir)
        .filter((f) => f.endsWith(".frontmatter.md") || f.endsWith(".template.md"))
        .sort();
    return refuseEmpty(files, dir, "packaging template");
}
// THE ONE COMPOSITION ANSWERING "WHAT DOES THE SPAWN-GRANT SCAN COVER" (plan 27-33, closing CR-03).
//
// Agent adapters, standalone skill adapters, PLUGIN-FORM skill adapters and packaging templates, each
// prefixed back to its REPO-RELATIVE shape (the form every consuming guard message is built from) and
// sorted.
//
// THE PLUGIN PART WAS FOLDED IN HERE, NOT IN THE GUARD (plan 27-34, closing CR-03). Splicing it into a
// composition local to check-foundation-guards.ts would have left the false-red control in
// scripts/frontmatter.test.ts vouching for a strict SUBSET of what the guard scans — the exact hole
// plan 27-33 closed by moving the composition here in the first place. One composition, widened once,
// and both consumers widen with it in the same run.
//
// WHY THIS EXISTS. check-foundation-guards.ts held this composition locally, and the false-red control
// that vouches for it would otherwise have had to restate it — a hand-listed directory set one
// indirection down. That is one predicate answered in two places, the exact class D-28, D-37 and D-40
// each collapsed once already inside this phase and the class CR-03 itself belongs to. A control
// restating the scan can prove safety over a set the guard no longer scans. So there is ONE
// composition and two consumers, and the guard keeps no composition of its own — a weaker duplicate
// that still votes is worse than none.
//
// AND BECAUSE BOTH CONSUMERS NOW READ ONE OBJECT, SET EQUALITY BETWEEN THEM IS A TAUTOLOGY. It
// compares an object with itself and can never fail. What actually protects this composition from a
// part silently dropped during the relocation is SPAWN_GRANT_SCAN_COUNT above, enforced two-sided,
// plus PER-PART SET equality against each lister in guardKitCounts. See the constant for the full
// argument.
export function spawnGrantScan(kitRoot = DEFAULT_KIT_ROOT) {
    return [
        ...listAgentAdapters(kitRoot).map((rel) => `${AGENTS_SUBPATH}/${rel}`),
        ...listSkillAdapters(kitRoot).map((rel) => `${SKILLS_SUBPATH}/${rel}`),
        ...listPluginSkillAdapters(kitRoot).map((rel) => `${PLUGIN_SKILLS_SUBPATH}/${rel}`),
        ...listPackagingTemplates(kitRoot).map((f) => `${PACKAGING_SUBPATH}/${f}`),
    ].sort();
}
// The repo-relative directory prefixes the composition's FOUR parts live under. Exported so a
// consumer asserting PER-PART membership partitions the composition by the SAME literals the
// composition was built from, rather than restating them — the set-literal drift this module deletes.
//
// The consumer must assert EVERY part, not only the one it just added: a claim about the new part says
// nothing about the parts already there, and a widening that swapped one part for another would hold
// the total at SPAWN_GRANT_SCAN_COUNT and pass. Iterating this array is what makes "all four" the
// default and forgetting a part impossible.
export const SPAWN_GRANT_SCAN_PARTS = [
    { name: "agent", prefix: `${AGENTS_SUBPATH}/`, list: listAgentAdapters },
    { name: "skill", prefix: `${SKILLS_SUBPATH}/`, list: listSkillAdapters },
    {
        name: "plugin-skill",
        prefix: `${PLUGIN_SKILLS_SUBPATH}/`,
        list: listPluginSkillAdapters,
    },
    {
        name: "packaging",
        prefix: `${PACKAGING_SUBPATH}/`,
        list: listPackagingTemplates,
    },
];
// The prefix of one named part, for a consumer that must partition the composition rather than
// restate a directory literal. Throws on an unknown name so a typo cannot silently return undefined
// and partition the composition into nothing.
export function spawnGrantScanPrefix(name) {
    const part = SPAWN_GRANT_SCAN_PARTS.find((p) => p.name === name);
    if (part === undefined) {
        throw new Error(`kit-model: no spawn-grant scan part named ${name}`);
    }
    return part.prefix;
}
