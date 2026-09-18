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
//
// ── THE THREE FAILURE-MODE DEFECTS THIS MODULE HAD, AND WHAT EACH ONE IS NOW (32.1-14) ───────────
//
// All three were defects in how this oracle FAILS rather than in what it answers. On the tree as it
// stood it gave the right answer; when it stopped being able to, it did not say so.
//
// 1. THE CHILD HAD NO BOUND (review WR-03). `execFileSync` with no `timeout` waits forever, and the
//    assertion that protects this oracle's premise — the before/after tree equality in the consumer
//    — is reachable only AFTER that call returns. So if `is-entry` ever mis-detects, which is the
//    very case the paragraph above discusses, the dashboard's watch loop runs, the worker hangs, and
//    the run reports a timeout naming nothing. A guard whose failure mode is silence is the shape
//    this repository's ledger records repeatedly: A HUNG GATE IS NOT A RED GATE. Reproduced under a
//    bound of the harness's own in `32.1-14-RED-baseline.txt` § 2.2 — the pre-change shape did not
//    return within 5000 ms and had to be killed from outside, AND the non-returning grandchild was
//    left orphaned and running when it was. The bound is on the invocation now, and the consumer
//    turns a bounded-out child into a named premise failure.
//
// 2. THE REGISTRATION FUNCTION WAS ASSUMED PRESENT (review IN-04). `module.registerHooks` arrived in
//    Node 22.15; `package.json` promises `>=22`. On 22.0 through 22.14 the child died at LINK time
//    with a SyntaxError about a missing named export, which reaches the consumer as an opaque
//    `execFileSync` throw naming nothing a contributor can act on. The import is a NAMESPACE import
//    now — a named one is itself the link-time error, so it cannot be the thing that checks — and
//    the absence is a named refusal at the fact. THE DECLARED ENGINES FLOOR IS DELIBERATELY NOT
//    RAISED: the review offered both, and a named refusal costs every contributor nothing while
//    raising the floor costs the ones on an older 22.x their whole checkout.
//
// 3. THE RECORDED SET WAS RELATIVISED AGAINST AN UNRESOLVED ROOT (review IN-07). Node's ESM resolver
//    reports REAL paths; `relative(root, ...)` used the caller's SPELLING of the root. A checkout
//    under a symbolic link — macOS `/tmp` and `/var` are both one — produced leading-parent entries
//    for every module and reddened the three-authority equality for a reason unrelated to the
//    closure. Measured: 5 of 5 entries (`32.1-14-RED-baseline.txt` § 2.3). The root is realpath-
//    resolved ONCE now. THE LOUD OUTCOME IS NOT REMOVED, only the false one: a path that genuinely
//    escapes the real root still comes back spelled `../...` and still reds by name.

import { execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync, writeFileSync, readFileSync } from "node:fs";
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

/** The function the child needs, named ONCE so the refusal, the guard and the reader agree. */
export const ORACLE_REGISTRATION_FUNCTION = "module.registerHooks";

/** The release it arrived in. Stated so the refusal can say what to do, never enforced by `engines`. */
export const ORACLE_REGISTRATION_MINIMUM = "Node 22.15";

/**
 * THE SENTENCE THE CHILD REFUSES WITH WHEN THE REGISTRATION FUNCTION IS ABSENT (32.1-14, IN-04).
 *
 * Held here rather than typed into the child's source, so there is ONE authority for it: a consumer
 * asserting the refusal asks this constant, and a constant that drifted from the shipped text would
 * make the assertion about a second sentence nobody runs. It is spliced into the guard below through
 * `JSON.stringify`, which is a DELIBERATE TypeScript-side interpolation — not the accidental kind the
 * line-array shaping further down exists to prevent.
 */
export const ORACLE_REGISTRATION_REFUSAL: string =
  `does not provide ${ORACLE_REGISTRATION_FUNCTION}, so the runtime-acquisition oracle cannot ` +
  `observe Node's own ESM resolver and refuses rather than loading the corpus with nothing ` +
  `watching. It is available from ${ORACLE_REGISTRATION_MINIMUM} onward. The declared engines floor ` +
  `is deliberately NOT raised to match: a named refusal at the fact is the cheaper and more honest ` +
  `of the two fixes, because it costs a contributor on a supported runtime nothing.`;

/**
 * THE GUARD, AS THE CHILD RUNS IT. Exported so a consumer can execute EXACTLY these bytes against a
 * stub namespace rather than assert something about them — the absence it refuses cannot be created
 * on a runtime that has the function, so the only honest proof is to run the guard itself.
 *
 * It reads the member off a NAMESPACE object. A named import of an absent export is a LINK-time
 * SyntaxError, so a named import can never be the thing that checks whether the export is there.
 */
const ORACLE_REGISTRATION_GUARD_LINES: readonly string[] = [
  "const registerHooks = nodeModule.registerHooks;",
  'if (typeof registerHooks !== "function") {',
  "  throw new Error(",
  `    "loader-oracle: this runtime (" + process.version + ") " + ${JSON.stringify(
    ORACLE_REGISTRATION_REFUSAL,
  )},`,
  "  );",
  "}",
];

/** The guard's source, as one string. The child below is BUILT from this, so they cannot diverge. */
export const ORACLE_REGISTRATION_GUARD: string = ORACLE_REGISTRATION_GUARD_LINES.join("\n");

/**
 * THE BOUND ON THE CHILD LOAD, AND THE SIGNAL THAT ENFORCES IT (32.1-14, review WR-03).
 *
 * Frozen and exported as ONE object that the invocation SPREADS, so a consumer asserting the bound
 * is asserting the value actually passed rather than a second copy of it. Sixty seconds is far
 * beyond any honest load of this corpus (measured in the hundreds of milliseconds) and far short of
 * forever, which is the only other value the invocation had.
 */
export const ORACLE_CHILD_OPTIONS = Object.freeze({
  timeout: 60_000,
  killSignal: "SIGKILL" as const,
});

/**
 * THE SENTENCE A BOUNDED-OUT CHILD BECOMES. It names the cause rather than the symptom: a load that
 * does not return most likely means the entry's `main` RAN, and that is the `is-entry` premise this
 * whole oracle rests on — so the honest report is that the premise failed, not that something was
 * slow.
 */
export const ORACLE_LOAD_DID_NOT_RETURN: string =
  `the corpus load did not return within ${ORACLE_CHILD_OPTIONS.timeout} ms and was killed with ` +
  `${ORACLE_CHILD_OPTIONS.killSignal}. The entry's main most likely RAN — which is the is-entry ` +
  `premise this oracle rests on — so the recording proves nothing. Reported here, by name, rather ` +
  `than as a worker that hangs and a run that times out naming nothing.`;

/**
 * Whether a caught error is a child that was BOUNDED OUT rather than one that failed.
 *
 * The two fields are the two the platform sets, measured rather than assumed
 * (`32.1-14-RED-baseline.txt` § 2.2): `code === "ETIMEDOUT"` and `signal === "SIGKILL"`. Asked as
 * one predicate so the consumer's arm and any later consumer read the same question; a second
 * hand-typed field test beside this one is the drift class this repository's ledger is full of.
 */
export function loadDidNotReturn(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const shaped = error as { readonly code?: unknown; readonly signal?: unknown };
  return shaped.code === "ETIMEDOUT" || shaped.signal === ORACLE_CHILD_OPTIONS.killSignal;
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
export const ORACLE_SCRIPT: string = [
  'import * as nodeModule from "node:module";',
  'import { writeFileSync } from "node:fs";',
  'import { pathToFileURL } from "node:url";',
  "",
  ORACLE_REGISTRATION_GUARD,
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
      // BOUNDED, AND BOUNDED FROM THE ONE AUTHORITY (32.1-14, WR-03). Spread rather than typed, so
      // a consumer asserting the bound asserts the value this call really carries.
      ...ORACLE_CHILD_OPTIONS,
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
  //
  // AGAINST THE ROOT'S REAL PATH, RESOLVED ONCE (32.1-14, review IN-07). Node's ESM resolver reports
  // real paths unless `--preserve-symlinks`; relativising against the CALLER'S spelling made every
  // module of a symlinked checkout come back `../…` — 5 of 5, measured — so the loud outcome fired
  // on the ordinary case and told the reader something false. Resolving the root removes the FALSE
  // escape and keeps the true one: a path outside the real root still relativises to `../…`.
  const realRoot = realpathSync(root);
  const modules = [
    ...new Set(
      events
        .filter((event) => event.resolved.startsWith("file://"))
        .map((event) => toPosix(relative(realRoot, fileURLToPath(event.resolved)))),
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
