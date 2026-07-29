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
// SHAPE RULE: an agent adapter is any `.md` file found beneath the agents directory at ANY depth.
//
// Path-traversal posture (ASVS V12, mirrors generate-catalog.ts): `agent-factory/roles`,
// `agent-factory/workflows` and `.claude/agents` are FIXED literal subpaths joined onto the supplied
// root. None is ever taken from argv, env, or file content.
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

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// The exact expected cardinality of each derived set. Enforcement is two-sided (D-20): 16 roles is a
// failure and 18 roles is a failure. Bumping either number is a DELIBERATE act that obliges the
// author to walk every derived consumer first — that walk is the whole point of the constant.
export const ROLE_COUNT = 17;
export const WORKFLOW_COUNT = 19;

// Default kit root = this script's parent (scripts/ -> repo root). Callers with an already-resolved
// root pass it explicitly (D-22) rather than letting this module re-resolve.
const DEFAULT_KIT_ROOT = join(import.meta.dirname, "..");

// Fixed literal subpaths — never argv/env/content-derived (ASVS V12).
const ROLES_SUBPATH = "agent-factory/roles";
const WORKFLOWS_SUBPATH = "agent-factory/workflows";
const AGENTS_SUBPATH = ".claude/agents";

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
// NOT exported: this is the mechanism, not the contract. Consumers ask listAgentAdapters().
function walkFilesRelative(dir: string, base = ""): string[] {
  const out: string[] = [];
  for (const name of readDirOrThrow(join(dir, base))) {
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
    if (isDir) out.push(...walkFilesRelative(dir, rel));
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
