// board-read.ts — STUB (plan 32-01, task 2, RED phase).
//
// The shapes and the signatures exist so `scripts/board-tracer.test.ts` fails on ASSERTIONS ABOUT
// BEHAVIOUR rather than on a module-resolution error. A nonzero exit caused by a missing module is
// not RED. The implementation lands in the next commit.
import { SCHEMA_VERSION } from "./board-model.js";
export class BoardReadError extends Error {
    constructor(message) {
        super(message);
        this.name = "BoardReadError";
    }
}
export const SOURCE_NAMES = [];
export const SOURCE_COUNT = 0;
export const FIXED_SUBPATHS = {
    board: "",
    tickets: "",
    queue: "",
    context: "",
    traceability: "",
    config: "",
};
export function resolveRepoRoot(_repoRoot) {
    return "";
}
export function repoSubpath(_root, _relPath) {
    return "";
}
export function listDirectoryBounded(_dir) {
    return { present: true, names: [], bounded: true };
}
export function readSnapshot(_repoRoot, _previous) {
    const unavailable = { source: "unavailable", present: false };
    const config = null;
    const snapshot = {
        schemaVersion: SCHEMA_VERSION,
        repoRoot: "",
        generatedAt: "",
        board: null,
        config,
        sources: {
            board: unavailable,
            tickets: unavailable,
            queue: unavailable,
            context: unavailable,
            traceability: unavailable,
            config: unavailable,
        },
    };
    return { source: "unavailable", snapshot, conflicts: [], readErrors: [] };
}
