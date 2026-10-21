// state-layout.ts — the one place a per-repo state path is spelled, and the one protected root list (phase 36,
// D-13, D-14, D-17).
//
// WHAT THIS OWNS. Every per-repo state path grugops reads or writes (the board, the ticket, epic, feature,
// sprint, release and uat trees, the NFR catalog, the traceability matrix and the metrics file), the pre-v3
// state root the fallback still reads, the one fallback sentence every carrier copies, and STATE_ROOTS: the
// first-segment roots install pruning and uninstall never touch. Budgets join this module in Phase 37; none
// are exported now, because a number with no consumer would be a fabricated budget.
//
// A NEW STATE PATH IS ADDED HERE FIRST, as one constant, and every reader, writer, the validator, the
// installer and the uninstaller import it. A state path spelled anywhere else is the drift the old-spelling
// gate (scripts/state-path-scan.ts, wired in plan 36-14) counts.
//
// IMPORT EDGES. This module is constants only: it imports nothing, declares no function and no class, and
// does no I/O (install/state-layout.test.ts asserts all four on its syntax tree). install/ never imports
// scripts/; the reverse edge is allowed and deliberate: a scripts/*.ts module may import
// ../install/state-layout.js to read these constants.
//
// ENCODING. Every *_REL value is a POSIX-relative string: no leading slash, no trailing slash, no
// backslash, no empty segment. A consumer joins it with node:path join(root, rel). STATE_ROOT_REL is one
// string and is never split into two segment literals.
/** The per-repo state root (v3.0 layout). */
export const STATE_ROOT_REL = "memory-bank/plans";
/**
 * The pre-v3 state root. Read only by the fallback, the install refusal, the doctor and the Phase 38
 * migrate arm. The fallback is a declared v3.x transition and this constant is removed in v4.0 (D-04).
 */
export const LEGACY_STATE_ROOT_REL = "plans";
/** The board file. */
export const BOARD_REL = `${STATE_ROOT_REL}/board.md`;
/** The ticket tree. */
export const TICKETS_REL = `${STATE_ROOT_REL}/tickets`;
/** The epic tree. */
export const EPICS_REL = `${STATE_ROOT_REL}/epics`;
/** The feature tree. */
export const FEATURES_REL = `${STATE_ROOT_REL}/features`;
/** The sprint tree. */
export const SPRINTS_REL = `${STATE_ROOT_REL}/sprints`;
/** The release tree. */
export const RELEASES_REL = `${STATE_ROOT_REL}/releases`;
/** The UAT tree (D-17: LAYOUT-01's uat subpath). */
export const UAT_REL = `${STATE_ROOT_REL}/uat`;
/** The NFR catalog. */
export const NFR_CATALOG_REL = `${STATE_ROOT_REL}/nfr-catalog.md`;
/** The traceability matrix. */
export const TRACEABILITY_REL = `${STATE_ROOT_REL}/traceability.md`;
/** The metrics file. */
export const METRICS_REL = `${STATE_ROOT_REL}/metrics.md`;
/** The board file at the pre-v3 root (layout detection, D-01). */
export const LEGACY_BOARD_REL = `${LEGACY_STATE_ROOT_REL}/board.md`;
/** The pre-v3 handoff relay directory (the --migrate two-root arm backs it up where it lies). */
export const LEGACY_HANDOFFS_REL = `${LEGACY_STATE_ROOT_REL}/handoffs`;
/**
 * Every first-segment root install pruning (install.ts isPruneProtected) and uninstall (uninstall.ts
 * isProtected) never touch: the per-repo state roots plus the user-owned trees the installer never writes.
 * The order is the order uninstall's preserved banner prints.
 */
export const STATE_ROOTS = Object.freeze([
    "agent-factory",
    LEGACY_STATE_ROOT_REL,
    ".planning",
    ".grugops",
    "docs",
    "src",
    "memory-bank",
]);
/**
 * A pinned integer, not a derivation: install/state-layout.test.ts asserts it equals STATE_ROOTS.length in
 * both directions, so a root added or removed without moving this pin fails red.
 * 2026-10-21, plan 36-01: the six roots of the two retired hand-typed lists plus memory-bank.
 */
export const STATE_ROOT_COUNT = 7;
/**
 * The one fallback sentence (D-14, final wording per D-06; the D-01 old-layout case and the D-02 both case).
 * Every carrier (INVARIANT, AGENTS.md § Kit vs state, the packaging copies, the skill sources and the
 * kit-home Orchestrator) copies it verbatim, and the old-spelling gate subtracts exact occurrences of it
 * before counting (D-15).
 */
export const LEGACY_FALLBACK_CLAUSE = "If `memory-bank/plans/board.md` is absent and `plans/board.md` exists, use `plans/` and say once: run `install --migrate`. If both exist, use `memory-bank/plans/` and say once that `plans/` is stale.";
