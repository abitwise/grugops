// ts-symbols.test-support.ts — the ONE authority over "which DECLARATION does this name resolve to,
// inside the `scripts/` sources", and over "which files are those sources" (Phase 32.1, plan 32.1-01,
// decisions D-01, D-02, D-03).
//
// WHY IT EXISTS. Three of Phase 32's round-4 findings (F-15, F-19, F-21) and two of its review
// warnings (WR-04, and the oracle half of F-17) are one defect wearing five hats: a set enumerated
// over ONE SPELLING of the thing it is about. A census that asks whether the identifier TEXT
// `TICKET_KEYS` appears decides about that spelling and says nothing about `import { TICKET_KEYS as
// K }`, about `import * as m` followed by `m.TICKET_KEYS`, or about a two-hop re-export. The remedy
// this repository has recorded for that class is a CANONICAL FORM plus a resolving instrument, never
// another arm on the matcher — so the question every later plan in this phase asks is asked HERE,
// once, of the TypeScript type checker, which answers about declarations rather than about text.
//
// THIS IS THE ONLY IMPLEMENTATION OF THAT QUESTION, AND A SECOND ONE IS A DEFECT RATHER THAN A
// DUPLICATION. The doctrine is `scripts/ci-workflow.testkit.ts:1-28`'s, restated for this subject:
// a file that resolves a name to its declaration with code of its own is not sharing a helper
// differently, it is a second grammar over one fact, and two grammars over one fact is the failure
// class this phase exists to delete.
//
// WHY THE NAME IS `*.test-support.ts` AND NOT `*.testkit.ts`, WHICH IS THE TREE'S OWN ANALOG.
// `scripts/ci-workflow.testkit.ts` is the existing test-only module under `scripts/`, and copying its
// spelling would be the obvious move. It is the WRONG move here, for a measured reason: that file IS
// emitted, and `scripts/ci-workflow.testkit.js` is TRACKED. Adding `**/*.testkit.ts` to
// `tsconfig.json`'s `exclude` array to keep THIS module out of emit would also stop emitting that
// one, turning its committed twin into an ORPHANED COMMITTED OUTPUT — a named failure class of
// `scripts/freshness.ts` — and `npm run freshness` would go red for a file nobody touched. So this
// module takes CONTEXT.md D-02's own `*.test-support.ts` spelling, and the pattern added to
// `tsconfig.json`'s `exclude` is `**/*.test-support.ts`, which matches nothing else that exists.
//
// AND WHY IT MUST NOT BE EMITTED AT ALL. It imports the TypeScript compiler API. CLAUDE.md's stack
// rule is that host machines run the committed `.js` with ZERO runtime dependencies installed, so a
// committed build output that reaches for `typescript` would break the one promise the whole
// distribution rests on. `typescript` stays a dev/CI-only concern; this module is type-checked (by
// `tsconfig.tests.json`, which declares its own `exclude` array and therefore does not inherit the
// emit target's) and never compiled into a shipped artifact.
//
// ITS BLAST RADIUS IS BOUNDED, AND THE BOUND IS A TEXT MATCH. Residual `R-31-21-04`
// (`scripts/context-io.test.ts:15406-15416`) observes `scripts/context-io-writer-set.test.ts` and
// agrees only with `by-identifier=true type-checker=false`. That observation is a TEXT match: the
// mere strings `createProgram(` or `getTypeChecker(` appearing in that file — even inside a comment —
// red it. So this module must never be imported into `scripts/context-io-writer-set.test.ts`, and
// that file must stay byte-unchanged.
//
// WHAT IT DOES NOT CLOSE, NAMED RATHER THAN IMPLIED:
//   • The file set is `scripts/`. `install/` and `hooks/` sources enter the program only through
//     `tsconfig.json`'s own `include` list, and the floor below is not asserted over them.
//   • `scripts/runnable-ref/fixtures/**` is deliberately outside the program's root names (see
//     `createScriptsProgram`), so no name declared only in a fixture resolves through this
//     instrument.
//   • A could-not-run is a NAMED cause, never an empty result — but a caller that ignores the
//     `ok: false` arm still measures nothing. Every consumer asserts `ok` as a PREMISE.

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE COMPILER SURFACE, DECLARED STRUCTURALLY OVER EXACTLY THE MEMBERS THIS MODULE CALLS.
//
// The shape is `scripts/runnable-ref/uat-spec-integrity.ts:868-1000`'s: a structural interface
// rather than a `typeof import("typescript")`, so the compiler is an ARGUMENT the caller supplies
// and this module states, in its own type, precisely which part of that very large API it depends
// on. A member added here is a decision; a member used without being declared here does not compile.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Opaque to this module: it reads no compiler option, it only forwards the parsed record. */
export type TsCompilerOptions = Record<string, unknown>;

export interface TsNode {
  readonly kind: number;
  readonly parent?: TsNode;
  getSourceFile?: () => TsSourceFile | undefined;
}

export interface TsSourceFile extends TsNode {
  readonly fileName: string;
}

export interface TsSymbol {
  readonly name: string;
  readonly flags: number;
  readonly declarations?: readonly TsNode[];
  readonly valueDeclaration?: TsNode;
}

export interface TsTypeChecker {
  getSymbolAtLocation(node: TsNode): TsSymbol | undefined;
  getAliasedSymbol(symbol: TsSymbol): TsSymbol;
}

export interface TsProgram {
  getSourceFile(fileName: string): TsSourceFile | undefined;
  getSourceFiles(): readonly TsSourceFile[];
  getTypeChecker(): TsTypeChecker;
}

/** The one host member this module overrides — so a per-file parse fault stays per-file. */
export interface TsCompilerHost {
  getSourceFile(
    fileName: string,
    languageVersionOrOptions: unknown,
    onError?: (message: string) => void,
    shouldCreateNewSourceFile?: boolean,
  ): TsSourceFile | undefined;
}

export interface TsProgramApi {
  readonly sys: {
    readonly fileExists: (path: string) => boolean;
    readonly readFile: (path: string, encoding?: string) => string | undefined;
  };
  findConfigFile(
    searchPath: string,
    fileExists: (path: string) => boolean,
    configName?: string,
  ): string | undefined;
  readConfigFile(
    path: string,
    readFile: (path: string) => string | undefined,
  ): { config?: unknown; error?: unknown };
  parseJsonConfigFileContent(
    json: unknown,
    host: unknown,
    basePath: string,
  ): { options: TsCompilerOptions; fileNames: readonly string[]; errors: readonly unknown[] };
  createCompilerHost(options: TsCompilerOptions, setParentNodes?: boolean): TsCompilerHost;
  createProgram(options: {
    readonly rootNames: readonly string[];
    readonly options: TsCompilerOptions;
    readonly host: TsCompilerHost;
  }): TsProgram;
  readonly SymbolFlags: { readonly Alias: number };
  forEachChild(node: TsNode, cb: (child: TsNode) => void): unknown;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE FILE SET — DERIVED FROM GIT, FLOORED AGAINST THE WALK.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Repo-relative, POSIX-separated, sorted — the shape both derivations below return. */
function normalize(lines: readonly string[]): readonly string[] {
  return [...new Set(lines.filter((line) => line !== ""))].sort();
}

/**
 * Every TRACKED `.ts` path under `scripts/`, repo-relative and sorted.
 *
 * THE PATHSPEC IS `scripts/*.ts` AND THE `**` SPELLING IS A BUG, NOT A STYLE CHOICE. Git's default
 * pathspec matching is `wildmatch` WITHOUT `WM_PATHNAME`, so a bare `*` crosses `/`. The
 * intuitive-looking `scripts/**\/*.ts` therefore demands at least one INTERVENING directory and
 * returns 26 of the 151 files on this tree — the 26 under `scripts/e2e/` and
 * `scripts/runnable-ref/`. A program built over those 26 makes every census over it pass while
 * covering a sixth of its subject. This is the single highest-risk line in Phase 32.1, and what
 * makes it VISIBLE rather than merely correct is the greater-than-100 floor its consumers assert:
 * the wrong spelling does not fail quietly, it fails at 26.
 *
 * GIT RATHER THAN A WALK, for the reason `scripts/board-readonly.test.ts:1819-1822` already records
 * for its own corpus: `git ls-files` excludes the untracked build mirrors a freshness check leaves
 * under `.tmp-build/`, so the set does not depend on whether a build had just run.
 */
export function trackedScriptSources(root: string): readonly string[] {
  const out = execFileSync("git", ["ls-files", "--", "scripts/*.ts"], {
    cwd: root,
    encoding: "utf8",
  });
  return normalize(out.split("\n").map((line) => line.trim()));
}

/**
 * Every `.ts` file ON DISK under `scripts/`, RECURSIVELY, in the same repo-relative shape — so the
 * two sets are directly comparable and their difference is a set of paths rather than two numbers.
 *
 * Never depth-one: `scripts/` carries subdirectories, and a file placed in one of them would sit
 * outside a depth-one glob without anything going red. That is the same defect class this module
 * exists to close, one register over.
 */
export function walkedScriptSources(root: string): readonly string[] {
  const dir = join(root, "scripts");
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  return normalize(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map((entry) => {
        const absolute = join(entry.parentPath, entry.name);
        return `scripts/${absolute.slice(dir.length + 1).split("\\").join("/")}`;
      }),
  );
}

/**
 * The fixture corpus, excluded from the program's root names.
 *
 * `scripts/runnable-ref/fixtures/` holds `*.uat.spec.ts` files that are INPUT to a checker, never
 * tooling sources: they `import "@playwright/test"`, a package this repository deliberately does not
 * depend on (the zero-shipped-runtime-dependency rule), so including them produces TS2307 on every
 * one of the 19 and buries any real diagnostic. They have their own typecheck target,
 * `tsconfig.fixtures.json`, which compiles them against a declared Playwright surface. They are
 * excluded here, not unchecked.
 */
const FIXTURE_PREFIX = "scripts/runnable-ref/fixtures/";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE PROGRAM.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

export interface ScriptsProgram {
  readonly program: TsProgram;
  readonly checker: TsTypeChecker;
  /** The absolute root names the program was built over — the set every census is decided over. */
  readonly rootNames: readonly string[];
  /** Per-file parse faults the compiler host caught, keyed by the file name it was asked for. */
  readonly parseFaults: ReadonlyMap<string, string>;
}

export type ScriptsProgramResult =
  | { readonly ok: true; readonly context: ScriptsProgram }
  | { readonly ok: false; readonly cause: string };

function describeCause(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/**
 * Build a `ts.Program` and its type checker over this repository's `scripts/` sources (D-01).
 *
 * The four load-bearing moves are `createProgramForTarget`'s
 * (`scripts/runnable-ref/uat-spec-integrity.ts:1308-1400`), copied in spirit rather than in text:
 *
 * 1. `noEmit` IS SET EXPLICITLY on the parsed options. This program exists to answer questions; it
 *    must never be able to write a `.js` next to a `.ts` and hand the freshness gate a file nobody
 *    committed.
 * 2. `host.getSourceFile` IS WRAPPED IN A TRY/CATCH that records a per-file fault and returns
 *    `undefined`. `ts.createProgram` parses every root file EAGERLY and `ts.createSourceFile` is a
 *    recursive-descent parser running on author-controlled source; without the wrapper ONE
 *    pathological file turns a red gate into a crashed one, which from the outside looks like a
 *    gate that ran.
 * 3. `rootNames` IS A UNION, NOT AN INTERSECTION, and the union is mandatory rather than cosmetic:
 *    `tsconfig.json`'s `exclude` carries `**\/*.test.ts`, so `parsed.fileNames` contains ZERO of the
 *    73 tracked test files — which are exactly the files every census in this phase is about. Built
 *    from the config's list alone, the checker reports every reference inside a `.test.ts` as
 *    unresolved and the census passes VACUOUSLY.
 * 4. `getTypeChecker()` IS INSIDE A TRY/CATCH, and every failure arm returns a NAMED cause rather
 *    than an empty result.
 */
export function createScriptsProgram(root: string, ts: TsProgramApi): ScriptsProgramResult {
  let configPath: string | undefined;
  try {
    configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  } catch (cause) {
    return {
      ok: false,
      cause: `the search for a TypeScript configuration file failed (${describeCause(cause)})`,
    };
  }
  if (configPath === undefined) {
    return { ok: false, cause: `no tsconfig.json was found at or above ${root}` };
  }

  let options: TsCompilerOptions;
  let configFileNames: readonly string[];
  try {
    const read = ts.readConfigFile(configPath, ts.sys.readFile);
    if (read.error !== undefined) {
      return { ok: false, cause: `${configPath} could not be read as a configuration file` };
    }
    const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, root);
    if (parsed.errors.length > 0) {
      return {
        ok: false,
        cause: `${configPath} did not parse (${parsed.errors.length} configuration error(s))`,
      };
    }
    options = { ...parsed.options, noEmit: true };
    configFileNames = parsed.fileNames;
  } catch (cause) {
    return { ok: false, cause: `${configPath} could not be parsed (${describeCause(cause)})` };
  }

  let tracked: readonly string[];
  try {
    tracked = trackedScriptSources(root);
  } catch (cause) {
    return { ok: false, cause: `the tracked file set could not be derived (${describeCause(cause)})` };
  }
  if (tracked.length === 0) {
    return {
      ok: false,
      cause: "the tracked file set under scripts/ is EMPTY, so the program would be built over the config's files alone and every census over a test file would resolve nothing",
    };
  }

  const rootNames = [
    ...new Set([
      ...configFileNames,
      ...tracked
        .filter((rel) => !rel.startsWith(FIXTURE_PREFIX))
        .map((rel) => join(root, rel)),
    ]),
  ];

  const parseFaults = new Map<string, string>();
  let program: TsProgram;
  try {
    const host = ts.createCompilerHost(options, true);
    const inner = host.getSourceFile.bind(host);
    host.getSourceFile = (
      fileName: string,
      languageVersion: unknown,
      onError?: (message: string) => void,
      shouldCreate?: boolean,
    ): TsSourceFile | undefined => {
      try {
        return inner(fileName, languageVersion, onError, shouldCreate);
      } catch (cause) {
        parseFaults.set(fileName, describeCause(cause));
        return undefined;
      }
    };
    program = ts.createProgram({ rootNames, options, host });
  } catch (cause) {
    return { ok: false, cause: `the program could not be created (${describeCause(cause)})` };
  }

  let checker: TsTypeChecker;
  try {
    checker = program.getTypeChecker();
  } catch (cause) {
    return { ok: false, cause: `the type checker could not be obtained (${describeCause(cause)})` };
  }

  return { ok: true, context: { program, checker, rootNames, parseFaults } };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE RESOLUTION.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Follow an import or export alias to the symbol it names. A non-alias is returned unchanged.
 *
 * Copied in shape from `scripts/runnable-ref/uat-spec-integrity.ts:1853`. THIS is the member that
 * answers F-19 / WR-04: without it, `import { TICKET_KEYS as K }` yields a symbol whose declaration
 * is the import specifier in the CONSUMING file, so a census keyed on the declaration would count
 * the consumer as its own authority. With it, the renamed import, the namespace member access and
 * the two-hop re-export all land on the single declaration the exporting module writes.
 */
export function followAlias(ts: TsProgramApi, checker: TsTypeChecker, symbol: TsSymbol): TsSymbol {
  if ((symbol.flags & ts.SymbolFlags.Alias) === 0) return symbol;
  try {
    return checker.getAliasedSymbol(symbol);
  } catch {
    return symbol;
  }
}

/** Where a name is DECLARED: the declaring file and the declared symbol's name. */
export interface Declaration {
  /** Absolute path of the file carrying the declaration, in the compiler's own spelling. */
  readonly fileName: string;
  /** The declared symbol's name AFTER alias following — the export's name, not the local's. */
  readonly name: string;
}

/**
 * Resolve one reference node to the DECLARATION its name stands for, or `null` when the checker
 * cannot decide.
 *
 * `ts` is a parameter rather than a captured import because `followAlias` needs `SymbolFlags.Alias`,
 * and this module takes the compiler as an argument throughout (see `TsProgramApi`). `null` is a
 * could-not-resolve, and a consumer that treats it as "no second authority" has made the vacuity
 * mistake this phase is about — every consumer floors the RESOLVED count before asserting anything
 * about the resolutions.
 */
export function declarationOf(
  ts: TsProgramApi,
  checker: TsTypeChecker,
  node: TsNode,
): Declaration | null {
  let symbol: TsSymbol | undefined;
  try {
    symbol = checker.getSymbolAtLocation(node);
  } catch {
    return null;
  }
  if (symbol === undefined) return null;
  const resolved = followAlias(ts, checker, symbol);
  const declaration = resolved.declarations?.[0] ?? resolved.valueDeclaration;
  if (declaration === undefined) return null;
  let sourceFile: TsSourceFile | undefined;
  try {
    sourceFile = declaration.getSourceFile?.();
  } catch {
    return null;
  }
  if (sourceFile === undefined) return null;
  return { fileName: sourceFile.fileName, name: resolved.name };
}
