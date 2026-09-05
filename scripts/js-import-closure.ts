// js-import-closure.ts — the ONE answer to "which committed .js does this committed .js need?".
//
// WHY THIS EXISTS. Several gates and oracles run a committed `.js` inside a TEMP MIRROR rather than
// on the real tree: the freshness gates mirror-spawn a render so the committed output is never
// touched, and the UAT / foundation-guard harnesses mirror a byte-faithful input set so a planted
// defect can be proven to red the gate. Every one of those mirrors has to carry the spawned
// artifact's IMPORTS, or the child process dies with ERR_MODULE_NOT_FOUND — and a gate that cannot
// start looks, from the outside, exactly like a gate that ran and refused.
//
// UNTIL PHASE 30 THE LISTS WERE HAND-MAINTAINED, AND THEY WERE CORRECT ONLY BY LUCK. `hooks/guard.js`
// happened to import nothing but `node:fs`, and `scripts/context-io.js` happened to import nothing
// but node builtins, so a mirror that copied one file was complete. Plan 30-01 gave the guard a
// checkpoint roster and a config reader to consult, four hand-written lists went stale at once, and
// 92 cases across seven files failed — not because the guard was wrong, but because four copies of
// a fact nobody had written down had all become false in the same commit. That is this repository's
// recorded second systemic failure class ([[grugops-set-literal-drift]]): a hand-listed set that
// rots while every gate over it stays green, except here it rotted loudly.
//
// SO THE SET IS DERIVED. A caller names ONE entry artifact and gets back its transitive closure,
// computed from the bytes of the files themselves. Adding an import to any module in the graph
// updates every mirror automatically, and a caller can never be short by one.
//
// IT REFUSES RATHER THAN RETURNS SHORT. An import specifier that cannot be resolved to a file, or
// that escapes the repository root, is a named throw. A closure that silently omitted an
// unresolvable edge would hand back a mirror that is missing exactly the file the walk could not
// see — the failure it exists to prevent, reintroduced one level up.
//
// SCOPE, STATED SO IT IS NOT MISTAKEN FOR A BUNDLER. This resolves only RELATIVE specifiers
// (`./x.js`, `../scripts/y.js`) between committed `.js` files in this repository. Bare specifiers
// are node builtins or packages: builtins need no mirroring, and this repository ships zero runtime
// dependencies, so there is nothing else to follow. A bare specifier is therefore skipped, not
// refused — but a `node_modules` import would be invisible here, and if this repository ever grows
// a runtime dependency this function's contract must be revisited rather than trusted.
//
// Node stdlib only; no dependency, in keeping with every other module under scripts/.

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

/**
 * Every relative import specifier in one JavaScript source.
 *
 * The three forms this repository's compiled output actually emits, and nothing else:
 *   `import … from "./x.js"` / `import "./x.js"`  — static ESM
 *   `export … from "./x.js"`                       — re-export
 *   `import("./x.js")`                             — dynamic
 * Both quote styles are read. A specifier inside a comment or a string literal would be a false
 * positive; that costs an extra file in a mirror, which is harmless, whereas a MISSED specifier
 * costs a crash — so this direction of imprecision is the deliberate one.
 */
export function relativeSpecifiers(source: string): readonly string[] {
  const out: string[] = [];
  const patterns = [
    /\bfrom\s*["'](\.[^"']*)["']/g,
    /\bimport\s*["'](\.[^"']*)["']/g,
    /\bimport\s*\(\s*["'](\.[^"']*)["']\s*\)/g,
  ];
  for (const re of patterns) {
    for (const m of source.matchAll(re)) out.push(m[1]);
  }
  return out;
}

/** Thrown when the walk meets an edge it cannot vouch for. Never swallowed into a short result. */
export class ImportClosureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportClosureError";
  }
}

function assertInsideRoot(root: string, abs: string, why: string): void {
  const rel = relative(root, abs);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    throw new ImportClosureError(
      `js-import-closure: ${why} resolves to ${abs}, which is outside the repository root ${root}. ` +
        `Refusing to mirror a path outside the tree.`,
    );
  }
}

/**
 * The transitive closure of `entry`'s relative imports, INCLUDING `entry` itself, as repo-relative
 * POSIX paths, sorted.
 *
 * Sorted so two callers comparing closures compare sets and not traversal order, and so a caller
 * that prints the closure prints a stable list.
 */
export function jsImportClosure(root: string, entryRel: string): readonly string[] {
  const rootAbs = resolve(root);
  const entryAbs = resolve(rootAbs, entryRel);
  assertInsideRoot(rootAbs, entryAbs, `the entry ${entryRel}`);
  if (!existsSync(entryAbs) || !statSync(entryAbs).isFile()) {
    throw new ImportClosureError(
      `js-import-closure: the entry ${entryRel} does not exist under ${rootAbs} — refusing to ` +
        `report an empty closure for a file that was never read.`,
    );
  }

  const seen = new Set<string>();
  const queue: string[] = [entryAbs];
  while (queue.length > 0) {
    const abs = queue.pop() as string;
    if (seen.has(abs)) continue;
    seen.add(abs);
    const source = readFileSync(abs, "utf8");
    for (const spec of relativeSpecifiers(source)) {
      const target = resolve(dirname(abs), spec);
      assertInsideRoot(rootAbs, target, `the import "${spec}" in ${relative(rootAbs, abs)}`);
      if (!existsSync(target) || !statSync(target).isFile()) {
        throw new ImportClosureError(
          `js-import-closure: ${relative(rootAbs, abs)} imports "${spec}", which does not resolve ` +
            `to a file at ${target}. A mirror built from a closure with an unresolvable edge would ` +
            `be missing exactly the file the walk could not see, so the walk refuses instead.`,
        );
      }
      if (!seen.has(target)) queue.push(target);
    }
  }

  return [...seen].map((abs) => relative(rootAbs, abs).split(sep).join("/")).sort();
}

/**
 * Copy `entry`'s whole import closure into `mirrorRoot`, preserving repo-relative layout, and return
 * the copied paths. The caller mirror-spawns `join(mirrorRoot, entryRel)` afterwards.
 *
 * `copyFile` is injected rather than imported so a caller that already owns a copy/normalize policy
 * for its mirror (the guard harnesses normalize some inputs) keeps that policy in one place.
 */
export function copyImportClosure(
  root: string,
  entryRel: string,
  copyFile: (rel: string) => void,
): readonly string[] {
  const closure = jsImportClosure(root, entryRel);
  for (const rel of closure) copyFile(rel);
  return closure;
}

/** Convenience for a caller that just wants the paths joined against a mirror root. */
export function closureTargets(
  root: string,
  entryRel: string,
  mirrorRoot: string,
): readonly { readonly rel: string; readonly from: string; readonly to: string }[] {
  return jsImportClosure(root, entryRel).map((rel) => ({
    rel,
    from: join(root, rel),
    to: join(mirrorRoot, rel),
  }));
}
