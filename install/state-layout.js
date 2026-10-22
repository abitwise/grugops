// state-layout.ts — the one place a per-repo state path is spelled, and the one protected root list (phase 36,
// D-13, D-14, D-17).
//
// WHAT THIS OWNS. Every per-repo state path grugops reads or writes (the board, the ticket, epic, feature,
// sprint, release and uat trees, the NFR catalog, the traceability matrix and the metrics file), the pre-v3
// state root the fallback still reads, the one fallback sentence every carrier copies, and STATE_ROOTS: the
// first-segment roots install pruning and uninstall never touch. Since Phase 37 (plan 37-01) it also owns the
// NFR and trace record directories, the progress file, the decision and queue-done directories, every
// archive path (the Done archive, the progress and decision archives, the queue-done and context archives),
// the layout marker path and content (D-04, D-05, D-14), and the nine budgets with their pinned count (D-10).
// agent-factory/contracts/board.md states the same budgets and marker in prose, and
// install/state-layout.test.ts compares the two.
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
// ── Phase 37 (plan 37-01): record directories, archives, the layout marker and the budgets ─────────
//
// Every path below is its declared parent constant plus exactly one segment, so a parent rename moves
// its children with it. None is built from LEGACY_STATE_ROOT_REL: the pre-v3 root gains no new path.
/** The memory-bank root, the first segment of STATE_ROOT_REL (which stays its own one literal). */
export const MEMORY_BANK_REL = "memory-bank";
/** The per-NFR record directory (one file per NFR, indexed by NFR_CATALOG_REL). */
export const NFR_DIR_REL = `${STATE_ROOT_REL}/nfr`;
/** The per-ticket trace file directory (rendered by tools/grugops/trace-render.js, D-01). */
export const TRACE_DIR_REL = `${STATE_ROOT_REL}/traceability`;
/** The state archive directory; files under it are outside every budget. */
export const ARCHIVE_REL = `${STATE_ROOT_REL}/archive`;
/** The Done archive: Done rows the board no longer keeps (path fixed by D-07). */
export const BOARD_DONE_ARCHIVE_REL = `${ARCHIVE_REL}/board-done.md`;
/** The progress file (dated status entries roll, D-09). */
export const PROGRESS_REL = `${MEMORY_BANK_REL}/60-progress.md`;
/** The progress archive: rolled progress entries. */
export const PROGRESS_ARCHIVE_REL = `${ARCHIVE_REL}/progress.md`;
/** The decision record directory (move-only, never rolled). */
export const DECISIONS_REL = `${MEMORY_BANK_REL}/50-decisions`;
/** The archive folder decision records move into. */
export const DECISIONS_ARCHIVE_REL = `${ARCHIVE_REL}/decisions`;
/** The per-repo machine directory. */
export const GRUGOPS_DIR_REL = ".grugops";
/** The live shared-context root. */
export const CONTEXT_REL = `${GRUGOPS_DIR_REL}/context`;
/** The task queue root. */
export const QUEUE_REL = `${GRUGOPS_DIR_REL}/queue`;
/** The finished-task queue directory (move-only). */
export const QUEUE_DONE_REL = `${QUEUE_REL}/done`;
/** The machine-state archive directory; files under it are outside every budget. */
export const GRUGOPS_ARCHIVE_REL = `${GRUGOPS_DIR_REL}/archive`;
/** The finished-ticket context archive Phase 38's MIGRATE-06 moves into and the trace render reads (D-03). */
export const CONTEXT_ARCHIVE_REL = `${GRUGOPS_ARCHIVE_REL}/context`;
/** The archive folder finished queue tasks move into. */
export const QUEUE_DONE_ARCHIVE_REL = `${GRUGOPS_ARCHIVE_REL}/queue-done`;
/** The layout marker (D-04, D-14): present with valid content, budget findings fail; otherwise they warn. */
export const LAYOUT_MARKER_REL = `${STATE_ROOT_REL}/.layout`;
/**
 * The marker's one version line (D-05, D-14). A marker is valid when, after one leading byte-order mark is
 * removed and CRLF is folded to LF, its content is exactly this line, with or without exactly one trailing
 * newline. Any other content is invalid and is reported by name.
 */
export const LAYOUT_MARKER_CONTENT = "layout: v3";
/**
 * The byte, character, line and row budgets (D-10), in the order the contract's `### Budgets` table lists
 * them. install/state-layout.test.ts compares this object with that table in both directions. No budget has
 * an exemption list (D-11). These are validator and state-check facts, never reader bounds.
 */
export const BUDGETS = Object.freeze({
    /** UTF-8 bytes of the board file (24 KiB). */
    boardBytes: 24_576,
    /** UTF-16 code units of each ticket-row line of the board. */
    boardRowChars: 160,
    /** Board lines that begin `_Updated:`, outside HTML comments. */
    boardUpdatedLines: 1,
    /** UTF-8 bytes of each line of the trace index and the NFR catalog, outside HTML comments. */
    indexEntryBytes: 200,
    /** UTF-8 bytes of each ticket `.md` file (64 KiB). */
    ticketBytes: 65_536,
    /** UTF-8 bytes of each NFR `.md` file (8 KiB). */
    nfrBytes: 8_192,
    /** UTF-8 bytes of each trace `.md` file (8 KiB). */
    traceBytes: 8_192,
    /** UTF-8 bytes of the progress file (16 KiB). */
    progressBytes: 16_384,
    /** Rows the Done column keeps; older rows move to the Done archive. */
    doneRows: 20,
});
/**
 * A pinned integer, not a derivation: install/state-layout.test.ts asserts it equals
 * Object.keys(BUDGETS).length in both directions, so a budget added or removed without moving this pin
 * fails red.
 * 2026-10-21, plan 37-01: the nine D-10 budgets.
 */
export const BUDGET_COUNT = 9;
