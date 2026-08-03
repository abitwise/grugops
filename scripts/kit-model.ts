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
// Path-traversal posture (ASVS V12, mirrors generate-catalog.ts): `agent-factory/roles`,
// `agent-factory/workflows`, `.claude/agents` and `.claude/skills` are FIXED literal subpaths joined
// onto the supplied root. None is ever taken from argv, env, or file content.
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

import { readdirSync, statSync, realpathSync } from "node:fs";
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

// The exact expected cardinality of the SPAWN-GRANT SCAN COMPOSITION below: 17 agent adapters +
// 7 standalone skill adapters + 2 packaging templates.
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
export const SPAWN_GRANT_SCAN_COUNT = 26;

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

// Read a directory, rethrowing as a NAMED error. The raw ENOENT/EACCES message does not identify
// which kit directory failed once two call sites share this helper.
function readDirOrThrow(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    throw new Error(`kit-model: cannot read kit directory ${dir}`);
  }
}

// Refuse a zero-length filtered set (D-21 tier 1). Returning [] here would let every downstream
// scan-set consumer report PASS over nothing.
function refuseEmpty(files: string[], dir: string, kind: string): string[] {
  if (files.length === 0) {
    throw new Error(
      `kit-model: no ${kind} files found in ${dir} — refusing to return an empty set (a vacuous scan set passes every guard)`,
    );
  }
  return files;
}

// The role corpus: `.md`, not `_`-prefixed, sorted. 17 files today.
export function listRoles(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
  const dir = join(kitRoot, ROLES_SUBPATH);
  const files = readDirOrThrow(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort();
  return refuseEmpty(files, dir, "role");
}

// The workflow corpus: `NN-*.md`, sorted. 19 files today (00..18).
export function listWorkflows(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
  const dir = join(kitRoot, WORKFLOWS_SUBPATH);
  const files = readDirOrThrow(dir)
    .filter((f) => /^\d{2}-.+\.md$/.test(f))
    .sort();
  return refuseEmpty(files, dir, "workflow");
}

// ---------------------------------------------------------------------------
// The adapter half (KIT-02). See the recursion policy in the module header — it is the contract,
// not an implementation detail.
// ---------------------------------------------------------------------------

// Every FILE beneath `dir`, at any depth, as a path relative to `dir`. Segments are joined with a
// literal `/` rather than the platform separator so the returned values are byte-identical on
// Windows and on Unix, and every guard message built from them is too.
//
// The recursion shape is lifted from scripts/check-kit-refs.ts's walk() — the one derivation in the
// tree that was already correct — including its use of statSync (which FOLLOWS symlinks, matching
// how the platform would resolve a symlinked adapter). Each directory level goes through the shared
// named-error helper, so an unreadable SUBdirectory throws naming that subdirectory rather than the
// root it was reached from.
//
// CYCLE TERMINATION IS THIS WALK'S CONTRACT, NOT AN ACCIDENT OF THE HOST (D-29, closing the 27-22
// deferral). The walk follows symlinks deliberately, which is what makes a cycle reachable, and it
// previously carried no cycle answer at all. Measured on darwin / node v24 before the fix, with one
// `loop -> ..` link planted under a ONE-adapter fixture: listAgentAdapters() returned THIRTY-TWO
// aliased members and terminated only because the operating system's symlink-resolution limit made
// statSync throw ELOOP; with two such links it threw `RangeError: Maximum call stack size exceeded`.
// Both are wrong sets from a walk that does not know where it has been, neither is a clean refusal,
// and the MANNER of termination belonged to the host rather than to this module.
//
// THE GUARD IS FOR BOUNDING RECURSION, NOT FOR NARROWING THE SET. `ancestors` holds the real paths
// of the directories on the CURRENT recursion path and nothing else. A directory revisited under a
// DIFFERENT path yields DIFFERENT relative paths, and every one of them is a distinct member this
// module is contracted to report — the invariant the "differing ONLY by nesting are DISTINCT
// members" case pins. Only a repeat on the SAME path is a cycle. A visited set carried across
// sibling branches, or across the whole walk, would silently delete a legitimate member; that is
// precisely the defect CR-03 reproduced in this walk's twin.
//
// ONE PREDICATE, TWO SITES, NO IMPORT. install/kit-source.ts's srcNestedAdapterFiles() answers the
// same question — "have I already walked this real path?" — and now answers it with the same
// ancestor stack. CR-03 is what happens when one predicate is answered in two places: the two gave
// two DIFFERENT wrong answers, a dropped member there and an unbounded recursion here. The two
// sites deliberately do NOT share an import: D-18 and D-28 keep the installer decoupled from the
// scripts/ layout, so the equality is bought by CASES — the same way the `source derivation`
// conformance case in install/install.test.ts buys the other half of that decoupling.
//
// A directory whose realpath cannot be resolved carries NO cycle key and falls through to
// readDirOrThrow, which throws naming that directory. The guard must never convert an unreadable
// directory into a silent [] — that is this module's fail-closed posture (D-21 tier 1), and a cycle
// guard is not licensed to weaken it.
//
// THE CYCLE ARM THROWS, NAMING THE PATH (D-36, closing WR-04). THIS AMENDS D-29's HALF OF THIS
// MODULE. D-29 required TERMINATION and got it — but termination that says nothing is this module's
// own fail-closed posture inverted. Everywhere else here, a directory this walk cannot fully
// account for throws naming that directory: readDirOrThrow does it for an unreadable directory,
// refuseEmpty does it for a vacuous result, and the MAX_WALK_ENTRIES bound above does it for an
// unbounded one. A cycle was the single remaining arm that quietly returned a SHORTER member set,
// and a short scan set passes every downstream guard exactly the way a vacuous one does. So it
// throws too, carrying the relative path it declined to descend into.
//
// THE TWIN DIVERGES BY DESIGN, NOT BY DRIFT. install/kit-source.ts's srcNestedAdapterFiles()
// answers the same cycle predicate and REPORTS the same relative path instead of throwing, because
// its documented floor is report-not-throw (a user-facing installer must finish its other classes).
// Same predicate, same named path, two different floors — that difference is the contract, so an
// equality test between the two sites asserts "both name the same relative path and neither is
// silent", never member-set equality, which is unavailable once one side throws.
//
// SCOPED HONESTLY: both sites decline the same set, so this is not an asymmetry like CR-03 and
// install/uninstall stay symmetric. It is closed as an honesty fix. Whether the platform loads the
// paths reachable only through such a cycle is `UNKNOWN - verify` and the fix does not rest on it.
//
// THE WORK BOUND IS THREADED, NOT RE-DERIVED PER LEVEL (D-35). `budget` is ONE mutable tally shared
// by the whole walk, in deliberate contrast to `ancestors`, which is per path by contract. The two
// answer different questions and are kept in different variables with different lifetimes; the old
// global-visited-set defect is what happens when one mechanism is asked to answer both.
//
// NOT exported: this is the mechanism, not the contract. Consumers ask listAgentAdapters().
interface WalkBudget {
  examined: number;
}

function walkFilesRelative(dir: string): string[] {
  return walkLevel(dir, "", [], { examined: 0 });
}

function walkLevel(
  dir: string,
  base: string,
  ancestors: readonly string[],
  budget: WalkBudget,
): string[] {
  const out: string[] = [];
  const here = join(dir, base);
  let real: string | null;
  try {
    real = realpathSync(here);
  } catch {
    real = null;
  }
  if (real !== null && ancestors.includes(real)) {
    // Cycle on THIS path — stop descending, and REFUSE BY NAME (D-36). `base` is never "" here:
    // the root call starts with no ancestors, so the first repeat is always at least one level in.
    throw new Error(
      `kit-model: symlink cycle at ${base} while walking ${dir} — this directory already appears ` +
        `on its own recursion path, so descending would not terminate. Refusing to return a member ` +
        `set that silently omits everything below it: a short scan set passes every downstream ` +
        `guard exactly the way a vacuous one does.`,
    );
  }
  const nextAncestors = real === null ? ancestors : [...ancestors, real];
  for (const name of readDirOrThrow(here)) {
    // Count the entry BEFORE deciding whether to descend into it or collect it, so the bound limits
    // WORK directly and is independent of the tree's shape. Exact integer comparison at the named
    // constant: the 10000th entry examined is still under the bound and the 10001st trips it, so
    // the threshold cannot be crossed by an off-by-one or by a rounding of any kind.
    budget.examined += 1;
    if (budget.examined > MAX_WALK_ENTRIES) {
      throw new Error(
        `kit-model: the walk of ${dir} examined more than MAX_WALK_ENTRIES=${MAX_WALK_ENTRIES} ` +
          `directory entries, reaching ${here} — refusing to continue. A symlink DAG with no cycle ` +
          `at all can still expand into exponentially many distinct relative paths, so the ` +
          `per-path cycle answer cannot bound this walk and a separate work bound does. Returning ` +
          `the members collected so far would be a silent truncation, and a truncated scan set ` +
          `passes every downstream guard.`,
      );
    }
    const rel = base === "" ? name : `${base}/${name}`;
    const full = join(dir, base, name);
    let isDir: boolean;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      // A vanished/unstattable entry between the readdir and the stat is a race, not a member.
      // Skipping it here cannot hide a real adapter: the next run's readdir either sees it or it
      // genuinely is not there. The vacuity refusal below still covers "the whole set came back
      // empty".
      continue;
    }
    if (isDir) out.push(...walkLevel(dir, rel, nextAncestors, budget));
    else out.push(rel);
  }
  return out;
}

// The agent-adapter corpus: every `.md` file beneath `.claude/agents` AT ANY DEPTH, as forward-slash
// relative paths, sorted by the full relative path. 17 files today, all top-level.
//
// Recursive ON PURPOSE (module header): Claude Code loads nested agent files, so a derivation that
// could not see them would leave every one of them outside every guard. A consumer that wants only
// the top-level entries filters `!rel.includes("/")` at its own call site — it does NOT re-derive.
export function listAgentAdapters(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
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
export function listSkillAdapters(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
  const dir = join(kitRoot, SKILLS_SUBPATH);
  const files = walkFilesRelative(dir)
    .filter((rel) => rel.split("/").pop() === "SKILL.md")
    .sort();
  return refuseEmpty(files, dir, "skill adapter");
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
export function listPackagingTemplates(
  kitRoot: string = DEFAULT_KIT_ROOT,
): string[] {
  const dir = join(kitRoot, PACKAGING_SUBPATH);
  const files = readDirOrThrow(dir)
    .filter((f) => f.endsWith(".frontmatter.md") || f.endsWith(".template.md"))
    .sort();
  return refuseEmpty(files, dir, "packaging template");
}

// THE ONE COMPOSITION ANSWERING "WHAT DOES THE SPAWN-GRANT SCAN COVER" (plan 27-33, closing CR-03).
//
// Agent adapters, standalone skill adapters and packaging templates, each prefixed back to its
// REPO-RELATIVE shape (the form every consuming guard message is built from) and sorted.
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
export function spawnGrantScan(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
  return [
    ...listAgentAdapters(kitRoot).map((rel) => `${AGENTS_SUBPATH}/${rel}`),
    ...listSkillAdapters(kitRoot).map((rel) => `${SKILLS_SUBPATH}/${rel}`),
    ...listPackagingTemplates(kitRoot).map((f) => `${PACKAGING_SUBPATH}/${f}`),
  ].sort();
}

// The repo-relative directory prefixes the composition's three parts live under. Exported so a
// consumer asserting PER-PART membership partitions the composition by the SAME literals the
// composition was built from, rather than restating them — the set-literal drift this module deletes.
export const SPAWN_GRANT_SCAN_PARTS: readonly {
  name: "agent" | "skill" | "packaging";
  prefix: string;
  list: (kitRoot?: string) => string[];
}[] = [
  { name: "agent", prefix: `${AGENTS_SUBPATH}/`, list: listAgentAdapters },
  { name: "skill", prefix: `${SKILLS_SUBPATH}/`, list: listSkillAdapters },
  {
    name: "packaging",
    prefix: `${PACKAGING_SUBPATH}/`,
    list: listPackagingTemplates,
  },
];

// The prefix of one named part, for a consumer that must partition the composition rather than
// restate a directory literal. Throws on an unknown name so a typo cannot silently return undefined
// and partition the composition into nothing.
export function spawnGrantScanPrefix(
  name: (typeof SPAWN_GRANT_SCAN_PARTS)[number]["name"],
): string {
  const part = SPAWN_GRANT_SCAN_PARTS.find((p) => p.name === name);
  if (part === undefined) {
    throw new Error(`kit-model: no spawn-grant scan part named ${name}`);
  }
  return part.prefix;
}
