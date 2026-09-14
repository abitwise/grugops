// board-read.ts — STUB (plan 32-01, task 2, RED phase).
//
// The shapes and the signatures exist so `scripts/board-tracer.test.ts` fails on ASSERTIONS ABOUT
// BEHAVIOUR rather than on a module-resolution error. A nonzero exit caused by a missing module is
// not RED. The implementation lands in the next commit.

import { SCHEMA_VERSION } from "./board-model.js";
import type {
  FactoryConfigView,
  FactorySnapshot,
  SourceName,
  SourceState,
} from "./board-model.js";

export type { SourceState, SourceName } from "./board-model.js";

export class BoardReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoardReadError";
  }
}

export const SOURCE_NAMES = [] as readonly SourceName[];

export const SOURCE_COUNT = 0;

export const FIXED_SUBPATHS: Readonly<Record<SourceName, string>> = {
  board: "",
  tickets: "",
  queue: "",
  context: "",
  traceability: "",
  config: "",
};

export type ReadError = {
  readonly source: SourceName;
  readonly path: string;
  readonly code: string;
  readonly message: string;
};

export type Conflict = {
  readonly kind: string;
  readonly ticketId?: string;
  readonly column?: string;
  readonly expected: string;
  readonly actual: string;
  readonly source: SourceName;
};

export type SnapshotResult = {
  readonly source: "ok" | "stale" | "unavailable";
  readonly snapshot: FactorySnapshot;
  readonly conflicts: readonly Conflict[];
  readonly readErrors: readonly ReadError[];
};

export type BoundedListing = {
  readonly present: boolean;
  readonly names: readonly string[];
  readonly bounded: boolean;
};

export function resolveRepoRoot(_repoRoot: string): string {
  return "";
}

export function repoSubpath(_root: string, _relPath: string): string {
  return "";
}

export function listDirectoryBounded(_dir: string): BoundedListing {
  return { present: true, names: [], bounded: true };
}

export function readSnapshot(
  _repoRoot: string,
  _previous?: SnapshotResult,
): SnapshotResult {
  const unavailable: SourceState<unknown> = { source: "unavailable", present: false };
  const config: FactoryConfigView | null = null;
  const snapshot: FactorySnapshot = {
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
