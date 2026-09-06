// is-entry.ts — the ONE answer to "is this module being run rather than imported"
// (plan 30-11 round 4, `RA6-1`).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// WHY THIS IS ONE FUNCTION AND NOT A LINE EACH SCRIPT WRITES.
//
// `import.meta.url` is realpath-resolved by Node; `process.argv[1]` is not. A script invoked through
// a path containing a symlink — `/tmp` is one on macOS, and so is any kit reached through a symlinked
// install — therefore compares FALSE, and the script **exits 0 having printed nothing and done
// nothing**. A caller reading the exit code reads a pass.
//
// Round 3 fixed exactly this in `scripts/context-io.ts` after reviewer 4 hit it as a false harness
// premise, and then reintroduced the unfixed spelling verbatim in `scripts/check-residual-citations.ts`
// — the file it created one commit later. Reviewer 6 measured three entry points still carrying it:
// `check-residual-citations.js`, `admission-server.js` and `generate-guarantees.js`. The predicate had
// four spellings in four files; a fix applied to one of them is not a fix.
//
// So it exists once. `scripts/check-foundation-guards.test.ts` refuses any `import.meta.url ===`
// comparison outside this file, which is what stops the fifth spelling.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { realpathSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";

/** `realpathSync` that falls back to the raw path rather than throwing on something not yet present. */
function resolvedHref(p: string): string {
  try {
    return pathToFileURL(realpathSync(p)).href;
  } catch {
    return pathToFileURL(p).href;
  }
}

/**
 * Is `moduleUrl` the module Node was asked to run?
 *
 * Both sides are realpath-resolved, so a symlinked invocation path is the same answer as a direct
 * one — the silent-no-op shape is unreachable.
 */
export function isEntrypoint(moduleUrl: string): boolean {
  const argv1 = process.argv[1];
  if (argv1 === undefined) return false;
  return resolvedHref(fileURLToPath(moduleUrl)) === resolvedHref(argv1);
}
