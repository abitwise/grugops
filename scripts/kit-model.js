// kit-model.ts — the single authority for "which roles and workflows exist" (KIT-01, Phase 27).
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
// Path-traversal posture (ASVS V12, mirrors generate-catalog.ts): `agent-factory/roles` and
// `agent-factory/workflows` are FIXED literal subpaths joined onto the supplied root. Neither is
// ever taken from argv, env, or file content.
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
import { readdirSync } from "node:fs";
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
