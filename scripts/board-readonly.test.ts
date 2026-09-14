// board-readonly.test.ts — the board projector CANNOT WRITE, and that is decided by a MECHANISM.
//
// WHY THIS FILE EXISTS. Every comparable tool in this space is a control plane: it reads a board and
// then acts on it. grugops's projector is deliberately not one — it renders state and changes
// nothing — and CLAUDE.md's hard safety rule is that such a property is enforced mechanically rather
// than asserted in a docblock. A sentence saying "this module is read-only" is true until the next
// commit and says nothing afterwards. This file re-decides the property from the bytes on every run.
//
// WHAT IT DECIDES. Two claims, both over the transitive closure of the COMPILED artifact
// `scripts/board-dashboard.js` — the thing a host actually runs, not the `.ts` a reader sees:
//
//   1. No mutating `node:fs` / `node:fs/promises` symbol is reachable from that closure (DASH-06).
//   2. The closure imports none of the socket / process-spawning builtins (DASH-08, "no socket").
//
// BOTH SIDES ARE DERIVED, NOT TYPED OUT. This repository's recorded second systemic failure class is
// a hand-maintained set literal that rots while every gate over it stays green — the spawn defect
// shipped seven granted role names against zero adapter files, and the suite was green throughout
// ([[grugops-set-literal-drift]]). So:
//
//   • the MODULE set comes from `jsImportClosure`, computed from the bytes of the files themselves;
//   • the per-module `node:fs` SYMBOL set comes from the TypeScript AST, the way
//     `scripts/context-io-writer-set.test.ts` derives its note-writer set;
//   • the MUTATING set comes from enumerating the runtime's own `node:fs` exports against the D-21
//     write-class stems.
//
// Only ONE set in this file is hand-named: the three stem false positives, whose cardinality is
// asserted two-sided with a decision-shaped message, so a fourth exclusion is a decision somebody
// makes rather than a constant somebody bumps.
//
// EVERY EMPTINESS CLAIM IS PRECEDED BY A PREMISE. "The intersection is empty" is trivially true of an
// empty closure, and "no banned module is imported" is trivially true of an empty specifier set. This
// repository's history records six instances across four consecutive verification rounds of a harness
// producing a FALSE result because its own premise was never asserted. So the premises here are
// failing assertions carrying a `PREMISE:` message, never assumptions.
//
// WHICH PIN IS THE BLOCKING ONE, AND WHY IT IS NOT THE RUNTIME COUNT. The two-sided pin that can red
// this file is the CLOSURE'S OWN `node:fs` symbol set — the handful of read symbols the dashboard
// actually imports. That number is a function of this repository's code, so no Node upgrade can move
// it. The runtime enumeration's cardinality is a function of the Node version instead: CI pins Node
// 22 and this tree's developer machine is on Node 24, so a bare two-sided pin over it would be red on
// one and green on the other for a reason that has nothing to do with the dashboard — and a pin that
// reds for an unrelated reason gets loosened until it stops noticing. It is therefore PRINTED and
// VERSION-LABELLED on every run and asserted only to be non-empty. A mutating symbol added by a
// future Node still reds this file the moment any closure module imports it, because the closure-side
// intersection is what decides, not the count.
//
// WHAT IT DOES NOT CLOSE, NAMED RATHER THAN IMPLIED:
//   • The derivation is SYNTACTIC. An aliased re-export (`export { writeFileSync as w }` through an
//     intermediate module) or a dynamic `import()` of a COMPUTED specifier is not resolved by name.
//     Both are refused rather than ignored — an unresolvable acquisition is collected and asserted
//     absent — but a route this file cannot see is a route it cannot decide. Widening the matcher
//     once per counter-example is the failure this repository has already paid for, so the boundary
//     is written down instead.
//   • `open` and `openSync` STAY IN the mutating set. Their write-ness depends on a flag literal and
//     a name-based derivation cannot decide it, so the safe direction for a safety guard is to refuse.
//   • `jsImportClosure` follows RELATIVE specifiers only. A `node_modules` import would be invisible
//     here; this repository ships zero runtime dependencies, which is what makes that acceptable, and
//     the `dependencies === undefined` assertion in this file is what keeps it true.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, beforeAll } from "vitest";
import ts from "typescript";
import { readFileSync } from "node:fs";
import * as nodeFs from "node:fs";
import * as nodeFsPromises from "node:fs/promises";
import { join } from "node:path";

import { jsImportClosure } from "./js-import-closure.js";

const ROOT = join(import.meta.dirname, "..");

/** The compiled entry the guard walks — the artifact a host runs, never the `.ts`. */
const DASHBOARD_ENTRY = "scripts/board-dashboard.js";
/** The pure model, whose own closure must not reach `node:fs` at all (D-15, D-23). */
const MODEL_ENTRY = "scripts/board-model.js";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE AST DERIVATION — one pass per closure module, over the bytes of the committed `.js`.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Both spellings of both filesystem modules. A guard that only knew `node:fs` would miss `fs`. */
const FS_MODULE_IDENTITIES = Object.freeze(["fs", "fs/promises"]);

/** `node:net` and `net` are the same module; the ban is over identity, not over spelling. */
function normalizeSpecifier(specifier: string): string {
  return specifier.startsWith("node:") ? specifier.slice("node:".length) : specifier;
}

function isFsSpecifier(specifier: string): boolean {
  return FS_MODULE_IDENTITIES.includes(normalizeSpecifier(specifier));
}

function isBareSpecifier(specifier: string): boolean {
  return !specifier.startsWith(".") && !specifier.startsWith("/");
}

interface ModuleFacts {
  /** Top-level statement count. Zero means the parse read nothing and every claim below is vacuous. */
  readonly statements: number;
  /** Syntactic parse diagnostics. A file the parser could not read must RED the guard, never pass it. */
  readonly parseErrors: readonly string[];
  /** Every `node:fs` / `node:fs/promises` symbol imported by name or reached through a namespace. */
  readonly fsSymbols: ReadonlySet<string>;
  /** Every bare specifier — the set `jsImportClosure` deliberately skips, and the socket ban's input. */
  readonly bareSpecifiers: ReadonlySet<string>;
  /**
   * Acquisitions of a filesystem module whose symbols this syntactic pass CANNOT name: a dynamic
   * `import("node:fs")`, a `require("node:fs")`, an `export * from "node:fs"`, or a computed member
   * access on an fs namespace. Each one is a route the derivation cannot decide, so each is collected
   * and asserted absent rather than silently producing a short symbol set.
   */
  readonly opaqueFsAcquisitions: readonly string[];
  /** Module specifiers that are not string literals — a computed `import(expr)`. Same fail-closed rule. */
  readonly opaqueSpecifiers: readonly string[];
}

function analyzeModule(absPath: string, label: string): ModuleFacts {
  const source = ts.createSourceFile(label, readFileSync(absPath, "utf8"), ts.ScriptTarget.Latest, true);

  // `parseDiagnostics` is not on the public `SourceFile` type, but it is the only place the syntactic
  // errors of a standalone parse are recorded. Read defensively: absent means "this TypeScript build
  // does not expose it", which the statement-count premise still covers.
  const parseErrors = (
    (source as unknown as { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? []
  ).map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "));

  const fsSymbols = new Set<string>();
  const bareSpecifiers = new Set<string>();
  const fsNamespaceBindings = new Set<string>();
  const opaqueFsAcquisitions: string[] = [];
  const opaqueSpecifiers: string[] = [];

  const literalText = (node: ts.Node | undefined): string | null =>
    node !== undefined && ts.isStringLiteralLike(node) ? node.text : null;

  const noteSpecifier = (specifier: string): void => {
    if (isBareSpecifier(specifier)) bareSpecifiers.add(specifier);
  };

  const collectSpecifiers = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      const specifier = literalText(node.moduleSpecifier);
      if (specifier === null) {
        opaqueSpecifiers.push(node.getText());
      } else {
        noteSpecifier(specifier);
        if (isFsSpecifier(specifier)) {
          const clause = node.importClause;
          // A default import of a builtin under esModuleInterop IS the namespace object, so it is
          // treated as one rather than ignored.
          if (clause?.name) fsNamespaceBindings.add(clause.name.text);
          const bindings = clause?.namedBindings;
          if (bindings !== undefined && ts.isNamespaceImport(bindings)) {
            fsNamespaceBindings.add(bindings.name.text);
          }
          if (bindings !== undefined && ts.isNamedImports(bindings)) {
            for (const element of bindings.elements) {
              fsSymbols.add((element.propertyName ?? element.name).text);
            }
          }
        }
      }
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined) {
      const specifier = literalText(node.moduleSpecifier);
      if (specifier === null) {
        opaqueSpecifiers.push(node.getText());
      } else {
        noteSpecifier(specifier);
        if (isFsSpecifier(specifier)) {
          const clause = node.exportClause;
          if (clause !== undefined && ts.isNamedExports(clause)) {
            for (const element of clause.elements) {
              fsSymbols.add((element.propertyName ?? element.name).text);
            }
          } else {
            // `export * from "node:fs"` re-exports every symbol including every writer, and no name
            // in the source says so. Opaque, therefore refused.
            opaqueFsAcquisitions.push(node.getText());
          }
        }
      }
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (isDynamicImport || isRequire) {
        const specifier = literalText(node.arguments[0]);
        if (specifier === null) {
          opaqueSpecifiers.push(node.getText());
        } else {
          noteSpecifier(specifier);
          if (isFsSpecifier(specifier)) opaqueFsAcquisitions.push(node.getText());
        }
      }
    }
    ts.forEachChild(node, collectSpecifiers);
  };
  collectSpecifiers(source);

  const collectNamespaceMembers = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      if (fsNamespaceBindings.has(node.expression.text)) fsSymbols.add(node.name.text);
    } else if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression)) {
      if (fsNamespaceBindings.has(node.expression.text)) {
        const key = literalText(node.argumentExpression);
        if (key === null) opaqueFsAcquisitions.push(node.getText());
        else fsSymbols.add(key);
      }
    }
    ts.forEachChild(node, collectNamespaceMembers);
  };
  if (fsNamespaceBindings.size > 0) collectNamespaceMembers(source);

  return {
    statements: source.statements.length,
    parseErrors,
    fsSymbols,
    bareSpecifiers,
    opaqueFsAcquisitions,
    opaqueSpecifiers,
  };
}

interface ClosureFacts {
  readonly modules: readonly string[];
  readonly perModule: ReadonlyMap<string, ModuleFacts>;
  /** The union of every module's `node:fs` symbols, sorted. */
  readonly fsSymbols: readonly string[];
  /** The union of every module's bare specifiers, sorted. */
  readonly bareSpecifiers: readonly string[];
  readonly opaqueFsAcquisitions: readonly string[];
  readonly opaqueSpecifiers: readonly string[];
}

/**
 * THE DERIVATION: walk one entry's committed-`.js` closure and analyze every module in it.
 *
 * Takes `root` rather than closing over `ROOT` so the discrimination cases can point it at a mirror
 * built from the live sources and watch the same predicate fail.
 */
function analyzeClosure(root: string, entryRel: string): ClosureFacts {
  const modules = jsImportClosure(root, entryRel);
  const perModule = new Map<string, ModuleFacts>();
  const fsSymbols = new Set<string>();
  const bareSpecifiers = new Set<string>();
  const opaqueFsAcquisitions: string[] = [];
  const opaqueSpecifiers: string[] = [];
  for (const rel of modules) {
    const facts = analyzeModule(join(root, rel), rel);
    perModule.set(rel, facts);
    for (const symbol of facts.fsSymbols) fsSymbols.add(symbol);
    for (const specifier of facts.bareSpecifiers) bareSpecifiers.add(specifier);
    for (const text of facts.opaqueFsAcquisitions) opaqueFsAcquisitions.push(`${rel}: ${text}`);
    for (const text of facts.opaqueSpecifiers) opaqueSpecifiers.push(`${rel}: ${text}`);
  }
  return {
    modules,
    perModule,
    fsSymbols: [...fsSymbols].sort(),
    bareSpecifiers: [...bareSpecifiers].sort(),
    opaqueFsAcquisitions,
    opaqueSpecifiers,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE THREE SETS.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The modules the closure MUST contain. An absentee means the walk measured something else. */
const REQUIRED_CLOSURE_MODULES = Object.freeze([
  "scripts/board-dashboard.js",
  "scripts/board-read.js",
  "scripts/board-model.js",
]);

/**
 * The `node:fs` symbols the dashboard closure actually holds. MEASURED, not aspirational:
 *
 *   scripts/board-dashboard.js  existsSync, watch      (the watch loop and its guard)
 *   scripts/board-read.js       existsSync, readFileSync, readdirSync, realpathSync, statSync
 *   scripts/is-entry.js         realpathSync
 *   scripts/kit-model.js        existsSync, readFileSync, readdirSync, realpathSync, statSync
 *
 * Every one is a reader. THIS IS THE BLOCKING PIN: it is a function of this repository's code, so a
 * Node upgrade cannot move it, and it is the number the phase actually cares about.
 */
const EXPECTED_CLOSURE_FS_SYMBOLS = Object.freeze([
  "existsSync",
  "readFileSync",
  "readdirSync",
  "realpathSync",
  "statSync",
  "watch",
]);

/** The cardinality of that set. A seventh symbol is a decision, never a bumped constant. */
const EXPECTED_CLOSURE_FS_SYMBOL_COUNT = 6;

/**
 * D-21's write-class name stems, verbatim.
 *
 * They are hand-named because D-21 names them — a stem is the DEFINITION of "write-class", not a
 * membership list. What is derived is which of the RUNTIME's symbols they match, which is the set
 * that rots when Node adds a writer.
 */
const WRITE_CLASS_STEMS = Object.freeze([
  "write",
  "append",
  "rename",
  "unlink",
  "rm",
  "mkdir",
  "mkdtemp",
  "copy",
  "cp",
  "chmod",
  "chown",
  "truncate",
  "utimes",
  "link",
  "symlink",
  "open",
]);

/**
 * The descriptor prefixes POSIX-derived `fs` names carry in front of a stem: `f` for the
 * file-descriptor form (`ftruncate`, `futimes`, `fchmod`), `l` for the don't-follow-symlinks form
 * (`lchmod`, `lutimes`), and `create` / `file` for the stream constructors (`createWriteStream`,
 * `FileWriteStream`).
 *
 * This is a RULE rather than a hand-listed set of variants, which matters in both directions. A bare
 * substring match would also catch `readlink` and `readlinkSync` — read-only symbols that would then
 * red the guard for no reason, and a guard that reds for no reason is a guard that gets loosened.
 * Anchoring at a descriptor prefix admits `ftruncate` and refuses `readlink` by construction.
 */
const DESCRIPTOR_PREFIXES = Object.freeze(["", "f", "l", "create", "file"]);

function matchesWriteClassStem(name: string): boolean {
  const lower = name.toLowerCase();
  return WRITE_CLASS_STEMS.some((stem) => DESCRIPTOR_PREFIXES.some((d) => lower.startsWith(d + stem)));
}

/** Every symbol the RUNTIME exports from either filesystem module whose name matches a write stem. */
function stemMatchedRuntimeSymbols(): readonly string[] {
  const all = new Set<string>([...Object.keys(nodeFs), ...Object.keys(nodeFsPromises)]);
  return [...all].filter(matchesWriteClassStem).sort();
}

/**
 * The three symbols the stems catch that are NOT writers, each named with its reason:
 *
 *   opendir / opendirSync   read-only directory iterators; the bounded walk may legitimately want
 *                           `opendirSync`, and both are caught only by sharing the `open` stem
 *   openAsBlob              read-only; same stem, same accident
 *
 * `open` and `openSync` are deliberately NOT here. Their write-ness depends on a flag literal, a
 * name-based derivation cannot decide it, and the safe direction for a safety guard is to refuse.
 */
const STEM_FALSE_POSITIVES = Object.freeze(["openAsBlob", "opendir", "opendirSync"]);

/**
 * The cardinality of the exclusion set. A FOURTH exclusion is a decision: it means somebody has
 * judged a stem-matched symbol read-only, and that judgment belongs in the list above with its
 * reason, not in a bumped constant.
 */
const STEM_FALSE_POSITIVE_COUNT = 3;

/** The ambiguous pair that stays IN the mutating set, by decision rather than by omission. */
const AMBIGUOUS_RETAINED = Object.freeze(["open", "openSync"]);

const STEM_MATCHED_FS_SYMBOLS = stemMatchedRuntimeSymbols();
const MUTATING_FS_SYMBOLS = Object.freeze(
  STEM_MATCHED_FS_SYMBOLS.filter((name) => !STEM_FALSE_POSITIVES.includes(name)),
);

// The runtime-side observation, PRINTED AND VERSION-LABELLED on every run rather than pinned across
// Node majors. A reader comparing a CI log against a local log can see at a glance whether a
// disagreement is about the dashboard or about the runtime underneath it.
//
// Two shapes here were MEASURED rather than assumed, because "printed on every run" is a claim that
// is easy to make and easy to have no output behind. Against vitest 4.1.8's DEFAULT reporter:
//   • module-scope `console.log`  → printed NOTHING (collection-time console output is not surfaced)
//   • in-test / in-hook `console.log` → printed NOTHING (the default reporter surfaces console output
//     only for failing tests; `--reporter=verbose` shows it, and CI does not pass that flag)
//   • `process.stdout.write`      → printed, under the default reporter, from a hook and from a test
// So the write is direct, and it is emitted from a FILE-LEVEL `beforeAll` so that a filtered run
// (`-t "no socket"`) still carries the label.
beforeAll(() => {
  process.stdout.write(
    `board-readonly: mutating fs symbols ${MUTATING_FS_SYMBOLS.length} ` +
      `(stem-matched ${STEM_MATCHED_FS_SYMBOLS.length} minus ${STEM_FALSE_POSITIVE_COUNT} named ` +
      `exclusions) on node ${process.versions.node}\n`,
  );
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART ONE — the premises. Asserted BEFORE anything downstream is claimed empty.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32-06 — the read-only guard asserts its own premises first", () => {
  it("PREMISE: the dashboard closure is non-empty and contains the modules under test", () => {
    const { modules } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      modules.length,
      `PREMISE: jsImportClosure(ROOT, "${DASHBOARD_ENTRY}") returned an EMPTY closure, so every ` +
        "intersection claimed empty below measured nothing at all",
    ).toBeGreaterThan(0);
    const missing = REQUIRED_CLOSURE_MODULES.filter((m) => !modules.includes(m));
    expect(
      missing,
      `PREMISE: the closure is missing ${missing.join(", ") || "(nothing)"} — the walk reached ` +
        `something other than the dashboard's real module graph. It found: ${modules.join(", ")}`,
    ).toEqual([]);
  });

  it("PREMISE: every closure module parsed, and none parsed to nothing", () => {
    const { perModule } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    for (const [rel, facts] of perModule) {
      expect(
        facts.parseErrors,
        `PREMISE: ${rel} produced syntactic parse errors, so its symbol set is whatever the parser ` +
          "managed before giving up. An unreadable module must RED this guard, never pass it",
      ).toEqual([]);
      expect(
        facts.statements,
        `PREMISE: the parse of ${rel} yielded ZERO top-level statements, so its contribution to ` +
          "every derived set below is an empty set that means nothing",
      ).toBeGreaterThan(0);
    }
  });

  it("PREMISE: the runtime enumeration matched at least one write-class symbol", () => {
    expect(
      STEM_MATCHED_FS_SYMBOLS.length,
      "PREMISE: the write-class stems matched ZERO of the runtime's fs exports, so the mutating set " +
        "is empty and the intersection below is empty for a reason that has nothing to do with the " +
        "dashboard",
    ).toBeGreaterThan(0);
    expect(MUTATING_FS_SYMBOLS.length).toBeGreaterThan(0);
  });

  it("PREMISE: no closure module acquires a filesystem module by a route this pass cannot name", () => {
    const facts = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      facts.opaqueFsAcquisitions,
      "PREMISE: a closure module reaches node:fs through a dynamic import, a require, an " +
        "`export * from`, or a computed member access. The syntactic derivation cannot name the " +
        "symbols behind such a route, so it refuses rather than reporting a short set",
    ).toEqual([]);
    expect(
      facts.opaqueSpecifiers,
      "PREMISE: a closure module imports from a COMPUTED specifier. The module identity behind it " +
        "is undecidable here, so the ban below could not have been asked of it",
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART TWO — the derived sets, asserted by MEMBERS and by COUNT as two separate cases.
//
// A single `toEqual([...])` reports a member change and a cardinality change as the same failure,
// and the second is the one that means "a symbol landed that nobody weighed".
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32-06 — the closure's own fs symbol set is the blocking pin", () => {
  it("the derived closure fs symbol set has the expected MEMBERS", () => {
    expect(analyzeClosure(ROOT, DASHBOARD_ENTRY).fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
  });

  it("the derived closure fs symbol set has the expected COUNT", () => {
    expect(
      analyzeClosure(ROOT, DASHBOARD_ENTRY).fsSymbols.length,
      "a node:fs symbol entered or left the dashboard's import closure. This is the pin a Node " +
        "upgrade cannot move, so the move came from this repository's own code: weigh the new " +
        "symbol against the read-only property and name it above — it is a decision, never a " +
        "bumped constant",
    ).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT);
  });

  it("the pure model's own closure carries no node:fs specifier at all (D-15, D-23)", () => {
    // A stronger and cheaper claim than "no mutating symbol": board-model.ts is pure by
    // construction, so no board byte can reach a filesystem path from inside it.
    const facts = analyzeClosure(ROOT, MODEL_ENTRY);
    expect(facts.modules.length, "PREMISE: the model closure is empty").toBeGreaterThan(0);
    const fsSpecifiers = facts.bareSpecifiers.filter(isFsSpecifier);
    expect(
      fsSpecifiers,
      `scripts/board-model.js's closure imports ${fsSpecifiers.join(", ")}. D-15 and D-23 make the ` +
        "model pure and put every filesystem touch in scripts/board-read.ts; this is the mechanical " +
        "form of that boundary",
    ).toEqual([]);
    expect(facts.fsSymbols).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART THREE — the mutating set, and the exclusions that are decisions rather than constants.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32-06 — the mutating set is derived from the runtime, and its exclusions are named", () => {
  it("every named exclusion is actually present in the stem-matched set", () => {
    // An exclusion for a symbol the stems never matched is an exclusion silently doing nothing —
    // and it would keep the count at 3 while the reason for one of the three had evaporated.
    for (const name of STEM_FALSE_POSITIVES) {
      expect(
        STEM_MATCHED_FS_SYMBOLS,
        `the exclusion "${name}" is not in the stem-matched set on node ${process.versions.node}, ` +
          "so it excludes nothing. Either the stems changed or the runtime dropped the symbol; " +
          "either way the exclusion list below is now describing something that is not there",
      ).toContain(name);
    }
  });

  it("the exclusion set has exactly three members", () => {
    expect(
      STEM_FALSE_POSITIVES.length,
      "a fourth stem exclusion is a DECISION: it asserts that a write-stem-matched symbol is " +
        "read-only. That judgment belongs beside the other three with its reason written out, not " +
        "in a bumped constant",
    ).toBe(STEM_FALSE_POSITIVE_COUNT);
  });

  it("open and openSync remain IN the mutating set", () => {
    // Their write-ness depends on the flag literal at the call site (`"w"`, `"a"`, `O_CREAT`), which
    // a name-based derivation cannot read. A guard that cannot decide must refuse.
    for (const name of AMBIGUOUS_RETAINED) {
      expect(MUTATING_FS_SYMBOLS).toContain(name);
    }
  });

  it("the stem rule admits the descriptor forms and refuses the read-only lookalikes", () => {
    // The descriptor-prefix anchoring, exercised in both directions so the rule is a control rather
    // than a coincidence of this Node version's export list.
    for (const writer of ["ftruncate", "lchmod", "futimes", "createWriteStream", "mkdtempSync"]) {
      expect(matchesWriteClassStem(writer), `${writer} should match a write-class stem`).toBe(true);
    }
    for (const reader of ["readlink", "readlinkSync", "readFileSync", "statSync", "watch"]) {
      expect(matchesWriteClassStem(reader), `${reader} must NOT match a write-class stem`).toBe(false);
    }
  });

  it("the dashboard closure reaches NO mutating fs symbol", () => {
    const { fsSymbols } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    const reachable = fsSymbols.filter((s) => MUTATING_FS_SYMBOLS.includes(s));
    expect(
      reachable,
      `the board projector's import closure reaches the mutating node:fs symbol(s) ` +
        `${reachable.join(", ")}. The projector renders state and changes nothing (DASH-06); a ` +
        "writer in its closure makes it a control plane",
    ).toEqual([]);
  });
});
