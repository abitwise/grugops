// board-dashboard.ts — STUB (plan 32-01, task 3, RED phase).
//
// The shapes and the signatures exist so `scripts/board-tracer.test.ts` fails on ASSERTIONS ABOUT
// BEHAVIOUR rather than on a module-resolution error. The implementation lands in the next commit.

export const POLL_FLOOR_MS = 0;
export const DEBOUNCE_MS = 0;
export const INTERVAL_HARD_FLOOR_MS = 0;

export type Options = {
  readonly repoRoot: string;
  readonly once: boolean;
  readonly json: boolean;
  readonly watch: boolean;
  readonly intervalMs: number | null;
};

export type ParsedArgs =
  | { readonly kind: "options"; readonly options: Options }
  | { readonly kind: "help" }
  | { readonly kind: "usage"; readonly message: string };

export type DashboardIo = {
  readonly stdout: { write(chunk: string): unknown };
  readonly stderr: { write(chunk: string): unknown };
  readonly isTty: boolean;
};

export function parseArgs(_argv: readonly string[]): ParsedArgs {
  return { kind: "usage", message: "" };
}

export function sanitizeCell(_s: string): string {
  return "";
}

export function main(_argv: readonly string[], _io?: DashboardIo): number {
  return 2;
}
