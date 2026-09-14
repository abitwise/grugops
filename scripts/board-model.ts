// board-model.ts — STUB (plan 32-01, RED phase). The shapes exist; the grammar does not yet.
//
// This file is committed in the RED phase of plan 32-01 so that `scripts/board-tracer.test.ts`
// fails on ASSERTIONS ABOUT BEHAVIOUR rather than on a module-resolution error. A nonzero exit
// caused by a missing module is not RED: it says nothing about the grammar, and it would authorize
// a GREEN phase that had never been described. The implementation lands in the next commit.

export const SCHEMA_VERSION = 1;

export const HEADING_SUFFIXES = [] as const;

export const HEADING_SUFFIX_COUNT = 0;

export type RowParts = {
  readonly title: string;
  readonly meta: string | null;
  readonly trailer: string;
};

export type BoardRow = {
  readonly id: string;
  readonly title: string;
  readonly meta: string | null;
  readonly trailer: string;
  readonly line: number;
};

export type EpicRow = BoardRow & { readonly column: string | null };

export type BoardColumn = {
  readonly name: string;
  readonly heading: string;
  readonly kind: string;
  readonly claimedLive: number | null;
  readonly limit: number | null;
  readonly line: number;
  readonly rows: readonly BoardRow[];
};

export type UpdateEntry = {
  readonly date: string;
  readonly actor: string;
  readonly text: string;
  readonly line: number;
};

export type UnparsedLine = {
  readonly line: number;
  readonly text: string;
  readonly column: string | null;
};

export type NonColumnSection = {
  readonly heading: string;
  readonly line: number;
  readonly lines: readonly string[];
};

export type Bounds = {
  readonly boardBytes: number;
  readonly longestLine: number;
  readonly exceeded: boolean;
};

export type BoardModel = {
  readonly columns: readonly BoardColumn[];
  readonly epicRows: readonly EpicRow[];
  readonly updates: readonly UpdateEntry[];
  readonly preamble: readonly string[];
  readonly nonColumnSections: readonly NonColumnSection[];
  readonly unparsed: readonly UnparsedLine[];
  readonly bounds: Bounds;
};

export function stripHtmlComments(_text: string): string {
  return "";
}

export function splitRow(_rest: string): RowParts {
  return { title: "", meta: null, trailer: "" };
}

export function boardColumnName(_line: string): string | null {
  return null;
}

export function boardHasColumn(_model: BoardModel, _col: string): boolean {
  return false;
}

export function kebab(_s: string): string {
  return "";
}

export function parseBoard(_text: string): BoardModel {
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
