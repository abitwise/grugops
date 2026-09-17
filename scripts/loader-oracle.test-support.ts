// loader-oracle.test-support.ts — the ONE authority over "which modules did Node's OWN resolver
// actually acquire while this entry loaded" (Phase 32.1, plan 32.1-01, decision D-09).
//
// WHY IT EXISTS. `scripts/board-readonly.test.ts` already carries a two-sided oracle: the shared
// regex scanner `moduleSpecifiers` is asserted equal, in both directions, to a real TypeScript
// parse. Two sides is better than one, and it is still two PARSERS. Finding F-17 is precisely that
// the oracle shared the scanner's blind spot — both sides read the same bytes with the same idea of
// what an import looks like, so a shape neither of them recognises is invisible to both and the
// equality is green. The independent third side cannot be another parser. It has to be the runtime:
// what Node's ESM resolver was ASKED FOR while the corpus loaded for real.
//
// THIS IS ALSO THE RUNTIME PROBE ROW 208 ASKS FOR, and it hands D-10 a second, independent authority
// over `ALLOWED_BUILTIN_SPECIFIERS` for free: the builtins the loader was asked to resolve are a
// runtime fact about the same allow-list the static census pins by reading source.
//
// ── THE INERTNESS ARGUMENT, AND WHY IT IS ASSERTED RATHER THAN RESTED ON ──────────────────────────
//
// Loading a corpus FOR REAL means executing it, and this repository's whole safety posture is that a
// property enforced by an argument is a property nobody enforces. The argument is sound as far as it
// goes: the corpus is the repository's own dashboard closure; its entry `scripts/board-dashboard.js`
// is guarded by `is-entry`, so importing it as a NON-ENTRY runs no `main`; and no module in that
// closure performs a top-level write. But the argument is a sentence, and a sentence is true until
// the next commit. So `recordRuntimeAcquisitions` snapshots `git status --porcelain` immediately
// before and immediately after the load and RETURNS BOTH, and its consumer asserts they are equal.
// That equality is what turns the argument into evidence, and it is also what covers the DASH-04 /
// DASH-08 concurrency edge: an interrupted or concurrent run mutates nothing, and the guarantee is
// the measured before/after equality rather than a claim about the corpus's shape.
//
// ── WHY THE RECORDING HAPPENS ON THE `resolve` SIDE, IN A CHILD PROCESS ───────────────────────────
//
// TWO MEASURED FACTS SHAPE THIS MODULE, and both of them rule out the shaping an author reaches for
// first. They are recorded here because each one produces a VACUOUS oracle that passes.
//
// FACT 1 — "record and refuse" records exactly ONE edge. A `load` hook that short-circuits with an
// inert body (`return { format: "module", shortCircuit: true, source: "export {};" }`) does prevent
// any writer from running. It also DELETES the module's import statements, so nothing beyond the
// entry is ever resolved and the walk stops at one edge. Measured in 32.1-RESEARCH.md § D-09 probe
// 2: one recorded event, against a real closure of five modules. An oracle shaped that way agrees
// with any closure of size one and proves nothing. So the corpus loads for real and the hook only
// OBSERVES, on `resolve`.
//
// FACT 2 — a hook registered inside a vitest file sees NOTHING. `module.registerHooks` observes
// Node's own ESM loader. Vitest loads test files through Vite's transform pipeline and rewrites
// their dynamic `import()` into its own module runner, which never reaches Node's resolver. Measured
// on this tree, 2026-09-17: a probe registering the hook inside a `*.test.ts` and awaiting
// `import(pathToFileURL(...).href)` of `scripts/board-dashboard.js` recorded ZERO events, while the
// identical script run as a plain `node` entry recorded 13. The oracle therefore runs in a CHILD
// `node` process, where "Node's own resolver" is the only resolver there is.
//
// AND WHY THE CHILD IS A FILE RATHER THAN `node --input-type=module -e`. With `-e` there is no script
// path, so `process.argv[1]` becomes the first user argument — the entry path we pass. `is-entry`
// compares exactly that, concludes the dashboard IS the entry, and RUNS ITS MAIN. Measured: the
// board rendered to stdout. A real script file keeps `argv[1]` pointing at the oracle, which is what
// keeps the corpus inert. The script is written into an OS temp directory, outside the repository,
// so it can never appear in the working-tree snapshots it exists to compare, and it is removed in a
// `finally`.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** One thing Node's resolver was asked for: the specifier, who asked, and what it resolved to. */
export interface RuntimeAcquisition {
  readonly specifier: string;
  readonly parent: string | null;
  readonly resolved: string;
}

export interface RuntimeAcquisitions {
  /** Every resolve event, in the order Node's loader produced them. */
  readonly events: readonly RuntimeAcquisition[];
  /** The file-backed modules the loader resolved, repo-relative, POSIX-separated, sorted. */
  readonly modules: readonly string[];
  /** The builtins the loader resolved, reduced to identity (no `node:` prefix), sorted. */
  readonly builtins: readonly string[];
  /** `git status --porcelain` immediately BEFORE the corpus loaded. */
  readonly treeBefore: string;
  /** `git status --porcelain` immediately AFTER the corpus loaded. */
  readonly treeAfter: string;
}

/**
 * The child. It registers a synchronous in-process `resolve` hook, imports the entry ONCE, and
 * writes the recorded events as JSON to the path given as its second argument.
 *
 * The result goes to a FILE rather than to stdout on purpose: if the corpus ever did print — which
 * is exactly what a main that should not have run looks like — stdout would no longer be parseable
 * and the failure would arrive as a JSON syntax error instead of as the assertion that names it.
 *
 * Held as an array of lines rather than a template literal so that nothing in it can be read as an
 * interpolation by the TypeScript that carries it.
 */
const ORACLE_SCRIPT: string = [
  'import { registerHooks } from "node:module";',
  'import { writeFileSync } from "node:fs";',
  'import { pathToFileURL } from "node:url";',
  "",
  "const entry = process.argv[2];",
  "const out = process.argv[3];",
  "const events = [];",
  "const hooks = registerHooks({",
  "  resolve(specifier, context, nextResolve) {",
  "    const resolved = nextResolve(specifier, context);",
  "    events.push({",
  "      specifier,",
  "      parent: context.parentURL ?? null,",
  "      resolved: resolved.url,",
  "    });",
  "    return resolved;",
  "  },",
  "});",
  "try {",
  "  await import(pathToFileURL(entry).href);",
  "} finally {",
  "  hooks.deregister();",
  "}",
  "writeFileSync(out, JSON.stringify(events));",
  "",
].join("\n");

function porcelain(root: string): string {
  return execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
}

function toPosix(path: string): string {
  return path.split(sep).join("/");
}

/**
 * Load `entryRel` in a child `node` process and record everything that process's ESM resolver was
 * asked for, with the working tree snapshotted on both sides of the load.
 *
 * `entryRel` is repo-relative and is resolved against `root`. The corpus this was built for is
 * `scripts/board-dashboard.js`, whose measured shape on this tree is 13 resolve events, 5 modules
 * and the three builtins `fs`, `path`, `url` — but nothing here is specialised to it, and none of
 * those numbers is typed into this module. Every expectation about them lives in the consumer,
 * derived from THIS recording.
 */
export function recordRuntimeAcquisitions(root: string, entryRel: string): RuntimeAcquisitions {
  const scratch = mkdtempSync(join(tmpdir(), "grugops-loader-oracle-"));
  const scriptPath = join(scratch, "oracle.mjs");
  const resultPath = join(scratch, "events.json");
  let raw: string;
  let treeBefore: string;
  let treeAfter: string;
  try {
    writeFileSync(scriptPath, ORACLE_SCRIPT);
    treeBefore = porcelain(root);
    execFileSync(process.execPath, [scriptPath, join(root, entryRel), resultPath], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    treeAfter = porcelain(root);
    raw = readFileSync(resultPath, "utf8");
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  const events = JSON.parse(raw) as RuntimeAcquisition[];

  // A `file://` resolution is relativised against the repository root and NOT filtered. A path that
  // lands outside the root would come back spelled `../…` and red the consumer's equality by name,
  // which is the loud outcome; silently dropping it is how an oracle stops noticing.
  const modules = [
    ...new Set(
      events
        .filter((event) => event.resolved.startsWith("file://"))
        .map((event) => toPosix(relative(root, fileURLToPath(event.resolved)))),
    ),
  ].sort();

  const builtins = [
    ...new Set(
      events
        .filter((event) => event.resolved.startsWith("node:"))
        .map((event) => event.resolved.slice("node:".length)),
    ),
  ].sort();

  return { events, modules, builtins, treeBefore, treeAfter };
}
