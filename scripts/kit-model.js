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
import { readdirSync, readFileSync, statSync, realpathSync, existsSync, } from "node:fs";
import { join } from "node:path";
// The exact expected cardinality of each derived set. Enforcement is two-sided (D-20): 16 roles is a
// failure and 18 roles is a failure. Bumping either number is a DELIBERATE act that obliges the
// author to walk every derived consumer first — that walk is the whole point of the constant.
export const ROLE_COUNT = 17;
export const WORKFLOW_COUNT = 19;
// ── THE RULE THAT DECIDES THE WORKFLOW CORPUS (round 6, IN-01 — plan 29-54) ────────────────────
//
// This is the rule that decides which files in agent-factory/workflows are part of the corpus: a
// two-digit prefix, a hyphen, at least one more character, and a `.md` suffix. It is RANGE-FREE on
// purpose — no upper number is expressed anywhere, because a range would be a second declaration of
// a set this expression already decides, and only the second copy can rot. It sits beside
// WORKFLOW_COUNT so a reader meets the corpus's two constraints together: this decides WHICH files
// are members, and WORKFLOW_COUNT pins HOW MANY there are.
//
// IT LIVES HERE BECAUSE THREE CONSUMERS ASK IT, AND A RULE ASKED BY THREE CONSUMERS MUST BE DECLARED
// BY NONE OF THEM. Until this plan the expression was TYPED OUT THREE TIMES — in listWorkflows
// below, in scripts/generate-catalog.ts's directory read, and in scripts/generate-catalog.test.ts's
// corpus-cardinality case. The generator is top-level script code that writes a file the moment it is
// imported and exports nothing, so its copy could not be imported and the other two could only be
// retyped. Three hand-maintained copies of one rule is this repository's named second systemic
// failure class — a literal that rots while the suite stays green — and the third copy was sitting
// INSIDE the case plan 29-46 added as the remedy for the first two. Widening one copy and leaving
// the others is a silent disagreement that stays green for as long as the file set happens not to
// change.
//
// A PREDICATE RATHER THAN AN EXPORTED REGEX, deliberately. A shared mutable RegExp object is a
// shared object; a function that answers one question can only be asked. The name states the
// decision, so a call site reads as the question it is asking rather than as a pattern match whose
// intent the reader has to reconstruct.
export function isNumberedWorkflowFile(filename) {
    return /^\d{2}-.+\.md$/.test(filename);
}
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
//
// ROLES_SUBPATH and WORKFLOWS_SUBPATH are EXPORTED (Phase 29 / plan 29-04). The listers return bare
// filenames, so every consumer that needs a repo-relative path has to join one of these on — and
// audit-prepass.ts had already answered that by re-declaring both literals locally, which is the
// set-literal drift class one level down: two spellings of one path, either free to move. Exporting
// the existing declaration is strictly fewer literals than letting a third copy appear; the two
// local copies in audit-prepass.ts were deleted in the same commit.
export const ROLES_SUBPATH = "agent-factory/roles";
export const WORKFLOWS_SUBPATH = "agent-factory/workflows";
const AGENTS_SUBPATH = ".claude/agents";
const SKILLS_SUBPATH = ".claude/skills";
const PACKAGING_SUBPATH = "agent-factory/packaging";
// The PLUGIN-form skill tree at the repository root (plan 27-34). Distinct from SKILLS_SUBPATH above
// and never a prefix of it, so partitioning the composition on either literal is unambiguous.
const PLUGIN_SKILLS_SUBPATH = "skills";
// The markdown extension, and it is now REACHED by every rule that states it.
//
// (27-50, IN-01 — 27-REVIEW-GAPS-8 § IN-01, round 9 — D-56 item 5) WHAT THE COMMENT HERE USED TO
// CLAIM, AND WHY THE CORRECTION IS THE FINDING. It read "Named once because two rules below turn on
// it", naming "is this a frontmatter-bearing adapter surface" and "does the exempt directory carry
// an adapter". The constant was referenced at exactly ONE site, and the literal `".md"` was spelled
// at two OTHERS — `listRoles` and `listAgentAdapters`. The anti-drift device had drifted from
// itself, in the file whose thesis is that a fact has one statement. That is a small instance of
// this repository's second systemic failure class, and it is small only by accident.
//
// THE THREE RULES THAT TURN ON IT, ENUMERATED SO THE CLAIM IS CHECKABLE RATHER THAN REMEMBERED:
//
//   • `listRoles`            — "is this directory entry a role file"
//   • `listAgentAdapters`    — "is this walked entry a frontmatter-bearing agent adapter"
//   • the exempt-directory probe — "does the exempt directory carry an adapter"
//
// AND THE CLAIM IS ASSERTED, NOT NARRATED. `scripts/kit-model.test.ts` DERIVES the occurrence count
// of the exact literal in this module's comment-filtered source and asserts it is EXACTLY ONE — the
// declaration on the line below. Two-sided, so it fails both when a new spelling appears and when
// this declaration is renamed away. A comment claiming a property never ships here without the
// assertion that makes it true.
//
// DELIBERATELY NOT WIDENED TO EVERY `.md` SUBSTRING IN THE FILE. `"SKILL.md"`, `".frontmatter.md"`
// and `".template.md"` are DIFFERENT facts — a file NAME and two template suffixes — and
// isNumberedWorkflowFile above states the workflow shape in one expression. Collapsing those into this
// constant would be one statement of four facts, which is the mirror image of the defect above.
const MARKDOWN_EXT = ".md";
// ---------------------------------------------------------------------------
// THE TWO SHARED ADAPTER-BODY BLOCKS (plan 27-64, D-64 Part B) — ONE STATEMENT, TWO GENERATORS
// ---------------------------------------------------------------------------
//
// WHY THEY LIVE HERE AND NOT IN A GENERATOR. Both constants used to be private to
// scripts/generate-role-adapters.ts. That file is TOP-LEVEL SCRIPT CODE — it writes seventeen files
// the moment it is imported — so a second generator cannot import from it, and the only way to reuse
// its text would be to RETYPE it. Retyping ten lines of shell and a 400-byte blockquote into a second
// generator is precisely this repository's second systemic failure class (a hand-maintained literal
// that rots while the suite stays green), and this phase exists because that class has already been
// paid for twice. So the two blocks move to the kit authority — the module whose whole thesis is that
// a kit fact has exactly one statement — and BOTH generators import them.
//
// THE MOVE IS PROVABLY BEHAVIOR-PRESERVING, not asserted to be. `npm run freshness:adapters`
// regenerates all seventeen agent adapters into a temp mirror and compares them BYTE for BYTE against
// the committed ones; it was run immediately after this move and exited 0. A refactor of generated
// output that is not byte-checked is a claim, not a change.
//
// NEITHER IS A POLICY. They are the literal bytes two generated artifacts must contain, and the
// guards that reason ABOUT them (check-kit-refs Assertion 3's resolver-slot derivation,
// check-foundation-guards' invariant-marker sites) deliberately keep their own independent spellings
// of the marker substrings they key on — a guard that imported the thing it judges would be checking
// a constant against itself.
// The kit-vs-state invariant blockquote. Byte-identical in all 17 agent adapters and all 14 SKILL.md
// files (7 plugin-form sources + 7 standalone twins) — verified by exact line equality across all
// seven skill sources when this constant moved.
export const INVARIANT = "> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)";
// The resolver block (D-06) — byte-identical in all 17 agent adapters and in the ONE standalone skill
// twin that carries it (.claude/skills/grugops/SKILL.md).
//
// Line 1 is the installer's materialization slot (install/install.ts MAT_SLOT): the installer writes
// the absolute kit path ABOVE it, so every adapter has a target to inject into. Carrying this line is
// also what makes a file a legal site for the kit-root environment variable under check-kit-refs
// Assertion 3 — the predicate is two-sided, so the slot and the variable travel together or the gate
// fails red.
export const RESOLVER = [
    "Resolve the kit root (this adapter is the sole resolver):",
    "",
    "```sh",
    "# 1. (installed) the absolute kit path the installer wrote above this line.",
    "# 2. if absent, self-heal:",
    'KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"',
    '# 3. if "$KIT" still does not exist: STOP. Print:',
    '#    "grugops kit not found at $KIT. Run node install/install.js (or node install/install.js --check) to install the kit."',
    "#    Do NOT hunt the repo for agent-factory/… .",
    "```",
];
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
        coverer: listPluginSkillAdapters,
        reason: "the plugin-form skill tree is derived by listPluginSkillAdapters(), pinned two-sided by " +
            "PLUGIN_SKILL_ADAPTER_COUNT and folded into spawnGrantScan(), so every file the platform " +
            "loads from it is already inside the spawn-grant scan that guard_wr05 walks",
    },
];
// The covered-elsewhere bucket's exact cardinality, enforced TWO-SIDED in guard_kit_counts exactly as
// ROLE_COUNT, WORKFLOW_COUNT, SKILL_ADAPTER_COUNT, PLUGIN_SKILL_ADAPTER_COUNT, SPAWN_GRANT_SCAN_COUNT
// and PLUGIN_MANIFEST_COMPONENT_COUNT are: zero entries is a failure and two entries is a failure,
// only one passes.
//
// WHY IT MOVED FROM VITEST INTO THE GATE (plan 27-42, D-50). This cardinality was pinned only in
// scripts/kit-model.test.ts while all six sibling counts were pinned in the GUARD. A count that fires
// in CI but not in the gate does not fire on the surface that stops a release, and every entry in this
// bucket EXCLUDES a plugin-root component key from the forbidden set — the set whose members the
// platform would load unprobed. Measured on a hermetic mirror of the committed build before this
// change: adding a second covered-elsewhere entry left the gate at exit 0 printing ALL CHECKS PASSED.
//
// Bumping this number is a DELIBERATE act that obliges the author to walk every consumer first: the
// bucket partition, the forbidden-set computation, the coverer resolution in guard_kit_counts and
// guard_wr05's plugin-root component probe.
export const PLUGIN_COMPONENT_COVERED_ELSEWHERE_COUNT = 1;
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
// The exempt bucket's exact cardinality, enforced TWO-SIDED in guard_kit_counts exactly as its six
// siblings are: zero entries is a failure and two entries is a failure, only one passes.
//
// THIS CONSTANT AND THE PROMOTE TRIGGER RECORDED ABOVE ARE ONE DECISION (plan 27-42, D-50). The block
// comment on PLUGIN_COMPONENT_EXEMPT records that a SECOND directory needing exemption is what forces
// a promote from this by-name list to a derived predicate — and until this plan that trigger fired
// only in scripts/kit-model.test.ts, so it fired in CI and not on the surface that stops a release.
// Measured on a hermetic mirror of the committed build before this change: adding a second exemption
// left the gate at exit 0 printing ALL CHECKS PASSED with `2 exempt by name (outputStyles, hooks)`.
// The zero direction is the other half — an emptied bucket printed `0 exempt by name ()` from a
// PASSING guard_kit_counts, which is the vacuous pass D-21 names.
//
// Bumping this number is a DELIBERATE act that obliges the author to walk every consumer first: the
// bucket partition, the forbidden-set computation, pluginExemptComponentEntries()' schema-membership
// throw, and guard_wr05's exemption bounds (every markdown member inside the spawn-grant scan, and
// zero markdown adapters) — and, per the trigger above, to decide whether a hand-listed bucket is
// still the right shape at all.
export const PLUGIN_COMPONENT_EXEMPT_COUNT = 1;
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
    // THE TWO ARMS SHARE ONE DE-DUPLICATION DISCIPLINE (plan 27-46, D-53, closing IN-04).
    //
    // The double-claimed arm below de-duplicates IMPLICITLY: it filters over a domain in which each
    // key appears once, so each key it names is named once however many buckets claimed it. This arm
    // filters over `claimedKeys` and therefore INHERITED their multiplicity — a key claimed by two
    // buckets AND absent from the schema was interpolated into guard_kit_counts' failure message
    // twice. The arm's consumer is a human reading that message, where a key printed twice reads as
    // two findings. Both arms now answer the membership question the same way.
    //
    // THE MULTIPLICITY IS DROPPED, NOT PRESERVED IN A SECOND FIELD. Reporting the key once AND how
    // many buckets claimed it is two statements of one fact — the two-independent-facts shape round 8
    // deleted twice, and the sibling arm answers membership without it.
    //
    // `claimedKeys.indexOf(k) === i` keeps the FIRST occurrence, so the order is STATED IN THE
    // EXPRESSION rather than inherited from an iteration order that happens to be insertion-ordered
    // today. A de-duplication whose order is an implementation detail makes the guard's message
    // non-reproducible across two runs over one tree — a new defect traded for a cosmetic one — and
    // every derivation in this module either sorts or preserves a stated order for exactly this
    // reason.
    //
    // THIS CHANGES A FAILURE MESSAGE AND NEVER A VERDICT. The arm is non-empty only for inputs
    // today's computed forbidden set cannot produce; the gate's `kit counts:` PASS line is
    // byte-identical before and after on the live tree.
    const foreign = claimedKeys.filter((k, i) => !schemaKeys.includes(k) && claimedKeys.indexOf(k) === i);
    // (27-50, IN-02 — 27-REVIEW-GAPS-8 § IN-02, round 9 — D-56 item 6) THE DOUBLE-CLAIM ARM'S DOMAIN
    // IS THE UNION OF THE SCHEMA AND THE CLAIMS, BECAUSE FILTERED OVER THE SCHEMA ALONE IT COULD NOT
    // EXPRESS THE THING IT IS FOR.
    //
    // WHAT WAS WRONG, AND IT WAS OPENED BY THE FIX ABOVE. `doubleClaimed` filtered over `schemaKeys`,
    // so it could only ever name a SCHEMA key claimed twice. Before 27-46 the foreign arm's inherited
    // multiplicity was the ONLY visible trace of a non-schema key claimed by two buckets; the
    // de-duplication removed that trace and nothing replaced it, so the multiplicity became
    // UNREPORTABLE rather than reported once. The comment above said "both arms now answer the
    // membership question the same way" — true of de-duplication, and false of the DOMAIN, which is
    // the half that decides what each arm can express at all.
    //
    // WHY THAT MATTERS TO THE ONE CONSUMER. This arm's reader is a human looking at
    // guard_kit_counts' failure message with two buckets to fix. Told only that a key is "claimed but
    // outside the schema", they fix one bucket and the other keeps its claim. Both facts are true of
    // the same key at once, and each arm answers a different question about it, so it belongs in both.
    //
    // THE ORDER IS STATED, NOT INHERITED. Schema keys first, in the SCHEMA's order — the order the
    // guard's message is read in, and the order this arm has always reported — then the non-schema
    // ones in the foreign arm's own FIRST-OCCURRENCE order. The domain is built from `foreign`, which
    // is already de-duplicated and disjoint from `schemaKeys` by construction, so the widening cannot
    // introduce a duplicate and cannot double-report the schema key it already handled. Two runs over
    // one tree stay byte-identical.
    //
    // NOT A SECOND MEMBERSHIP RULE. `claimedTwice` is stated once and applied to one domain; the arm
    // did not gain a second predicate, it gained the rest of its subject.
    const claimedTwice = (k) => claimedKeys.filter((c) => c === k).length > 1;
    return {
        unclaimed: schemaKeys.filter((k) => !claimedKeys.includes(k)),
        doubleClaimed: [...schemaKeys, ...foreign].filter(claimedTwice),
        foreign,
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
        .filter((f) => f.endsWith(MARKDOWN_EXT) && !f.startsWith("_"))
        .sort();
    return refuseEmpty(files, dir, "role");
}
// The workflow corpus: the members isNumberedWorkflowFile admits, sorted. The membership rule is
// declared once, above beside WORKFLOW_COUNT, and this lister asks it rather than restating it.
export function listWorkflows(kitRoot = DEFAULT_KIT_ROOT) {
    const dir = join(kitRoot, WORKFLOWS_SUBPATH);
    const files = readDirOrThrow(dir)
        .filter(isNumberedWorkflowFile)
        .sort();
    return refuseEmpty(files, dir, "workflow");
}
// ---------------------------------------------------------------------------
// THE DISPLAY-NAME DERIVATIONS (Phase 29 / D-40, correcting D-13 additively).
//
// D-13 specifies deriving the project's Technical Names from `listRoles()` and `listWorkflows()`.
// Those return FILENAMES — `ba-pm.md`, `qe-e2e.md` — and the Technical Names actually used in the
// governed prose are DISPLAY names: `BA/PM`, `QE/E2E`, `Architect/Design`. Deriving from the
// filenames would produce a Technical Names set that matches NOTHING in the corpus, so the
// consumer would report a clean run over a set it could never hit.
//
// The correction stays inside D-13's spirit — derived, never listed — by reading the display name
// off the heading line each file already carries, and pinning the cardinality two-sided in
// guard_kit_counts. It is NOT a second corpus derivation: each lister below enumerates its members
// through the EXISTING lister rather than re-walking the directory, because deriving membership
// twice is exactly how two derivations come to disagree about what a role is.
//
// The vacuity refusal is therefore INHERITED rather than restated: an empty or unreadable roles
// directory throws out of `listRoles()` with its existing wording, before a single file is read.
// ---------------------------------------------------------------------------
// The heading prefixes the display names are read from. Declared once, beside their two consumers.
const ROLE_HEADING_PREFIX = "# Role: ";
const WORKFLOW_HEADING_PREFIX = "# Workflow: ";
// Read one display name off a kit file's heading line. THROWS naming the file when the heading is
// absent or carries an empty name — never yields a short array, because a short array IS the
// vacuous set the D-21 tier-1 refusal exists to prevent, arriving one element at a time.
function readDisplayName(path, prefix, kind) {
    let text;
    try {
        text = readFileSync(path, "utf8");
    }
    catch {
        throw new Error(`kit-model: cannot read ${kind} file ${path}`);
    }
    for (const line of text.split("\n")) {
        if (line.startsWith(prefix)) {
            const name = line.slice(prefix.length).trim();
            if (name !== "")
                return name;
        }
    }
    throw new Error(`kit-model: ${path} carries no non-empty \`${prefix}\` heading — a ${kind} display name cannot ` +
        `be invented, and skipping the file would return a silently SHORT set that every downstream ` +
        `consumer would read as complete. Add the heading to the file`);
}
// The role DISPLAY names, one per in-set role file's `# Role: ` heading, in listRoles() order.
// 17 today.
export function listRoleDisplayNames(kitRoot = DEFAULT_KIT_ROOT) {
    return listRoles(kitRoot).map((f) => readDisplayName(join(kitRoot, ROLES_SUBPATH, f), ROLE_HEADING_PREFIX, "role"));
}
// The workflow DISPLAY names, one per in-set workflow file's `# Workflow: ` heading, in
// listWorkflows() order. 19 today.
//
// RECORDED FOR THE REWRITE PLANS, NOT FIXED HERE — a one-term-per-concept defect this derivation
// surfaces the moment it runs. Three of the nineteen display names are lowercase (`context
// compaction`, `context read/write`, `task claim + schedule`) while the other sixteen are
// sentence-case. That is WP-09 drift on the kit's own Technical Names, and the fix belongs in plans
// 29-08 through 29-10, which rewrite the workflow bodies: the heading IS that text, and moving it
// here would edit kit prose from inside a derivation library. Named so the rewrite plans meet it.
export function listWorkflowDisplayNames(kitRoot = DEFAULT_KIT_ROOT) {
    return listWorkflows(kitRoot).map((f) => readDisplayName(join(kitRoot, WORKFLOWS_SUBPATH, f), WORKFLOW_HEADING_PREFIX, "workflow"));
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
        .filter((rel) => rel.endsWith(MARKDOWN_EXT))
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
// `list` carries the SpawnGrantScanLister type declared beside the covered-elsewhere bucket, so the
// lister signature is stated ONCE and the covered-elsewhere resolution (`p.list === coverer`) is an
// identity comparison the type system already agrees is well-formed.
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
