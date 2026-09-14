// board-model.ts — STUB (plan 32-01, RED phase). The shapes exist; the grammar does not yet.
//
// This file is committed in the RED phase of plan 32-01 so that `scripts/board-tracer.test.ts`
// fails on ASSERTIONS ABOUT BEHAVIOUR rather than on a module-resolution error. A nonzero exit
// caused by a missing module is not RED: it says nothing about the grammar, and it would authorize
// a GREEN phase that had never been described. The implementation lands in the next commit.
export const SCHEMA_VERSION = 1;
export const HEADING_SUFFIXES = [];
export const HEADING_SUFFIX_COUNT = 0;
export function stripHtmlComments(_text) {
    return "";
}
export function splitRow(_rest) {
    return { title: "", meta: null, trailer: "" };
}
export function boardColumnName(_line) {
    return null;
}
export function boardHasColumn(_model, _col) {
    return false;
}
export function kebab(_s) {
    return "";
}
export function parseBoard(_text) {
    return {
        columns: [],
        epicRows: [],
        updates: [],
        preamble: [],
        nonColumnSections: [],
        unparsed: [],
        bounds: { boardBytes: 0, longestLine: 0, exceeded: false },
    };
}
