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
// THE CLASS OF A SPECIFIER IS A TOTAL PARTITION, AND IT LIVES HERE (32-31, gap-closure round 3).
// Until this plan the two authorities that decided a specifier's class were a COMPLEMENT rather
// than a partition, and they disagreed about the same prefix:
//
//     scripts/board-readonly.test.ts   isBareSpecifier = !startsWith(".") && !startsWith("/")
//     scripts/js-import-closure.ts     three patterns, each requiring a leading "."
//
// A specifier beginning with `/` that is not `./` or `../` was SUBTRACTED by the first and never
// ADDED by the second, so it was neither censused nor walked. `32-24-RED-baseline.txt` measured
// three such spellings — `/abs/writer.mjs`, `//localhost/<abs path>` and `//host/<path>` — leaving
// `npm run check:dashboard-readonly` at exit 0 with its full 89/89 over a writer that ran and
// created a file. `classifySpecifier` below is now the ONE authority both consumers ask, and its
// third bucket exists so no spelling can fall outside all three.
//
// WHAT DECIDES "THIS IS A MODULE SPECIFIER" IS A REAL TOKENIZER (32.1-06, D-08). Until this plan it
// was a hand-written scanner: a blanking pass that tried to erase everything that was not code, three
// regular expressions over the blanked bytes, and a side table that recovered each literal's text by
// offset. That is a SECOND GRAMMAR for JavaScript, maintained here, disagreeing with the real one —
// and round 4 of Phase 32's review measured three separate disagreements, each a counter-example
// rather than a rough edge (F-16/WR-02, WR-03, F-17; all three are reproduced in
// `32.1-06-RED-baseline.txt` § 2 against the committed build output). This repository's recorded
// answer to a fourth counter-example is to define the canonical form and DELETE the second grammar,
// not to add a fourth arm, so the scanner is gone and `moduleSpecifiers` walks a parse.
//
// THE NODE SET IS STATED, AND EVERYTHING OUTSIDE IT IS REFUSED RATHER THAN GUESSED AT:
//
//   import declaration  → `moduleSpecifier`            export declaration → `moduleSpecifier`
//   `import(x)`         → first argument               `require(x)`       → first argument
//
// A specifier's VALUE is read through the parser's string-literal-LIKE predicate, so a
// no-substitution template resolves to what it means rather than to how it is spelled, and an escape
// sequence resolves to the character it denotes. Any other argument shape is recorded, by NODE KIND,
// in `ModuleSpecifierFacts.unreadable` — the seam a named refusal attaches to (D-11) — and is never
// silently treated as "no edge here".
//
// THE PARSER IS ACQUIRED LAZILY, AND THAT IS A CONSTRAINT RATHER THAN A STYLE (D-20). CLAUDE.md's
// stack rule is that host machines run the committed `.js` with ZERO runtime dependencies installed.
// A top-level `import ts from "typescript"` here would put a bare, non-builtin specifier into the
// STATIC import graph of a committed, production build output — and this repository has already
// ruled on exactly that question once, at `scripts/runnable-ref/uat-spec-integrity.ts:729-734`.
// So: the STATIC import graph of `js-import-closure.js` is node builtins and relative specifiers
// only, and the parser arrives at RUN TIME through `createRequire`, memoized, inside a try/catch
// whose failure is a NAMED refusal rather than a crash. Do not read "builtins only" as "this module
// touches nothing else" — it reaches for `typescript` the moment anyone calls `moduleSpecifiers`.
// What it never does is oblige a host to have it: the six consumers are development and
// continuous-integration gates, run from a checkout where `node_modules` is present, and no closure
// this repository mirrors contains this module (measured in `32.1-06-RED-baseline.txt` § 5).

import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

/**
 * The three classes a module specifier can have. There is no fourth, and no "unclassified".
 *
 *   `relative` — resolved against the importing file and FOLLOWED into the closure.
 *   `bare`     — a node builtin or a package. SKIPPED, by the written rule in this module's
 *                docblock: builtins need no mirroring and this repository ships zero runtime
 *                dependencies.
 *   `foreign`  — everything else. REFUSED.
 */
export type SpecifierClass = "bare" | "relative" | "foreign";

/**
 * The partition's members, as a value rather than a shape a reader has to infer from a union type.
 *
 * Held as data so a caller can assert its CARDINALITY: a fourth class is a decision somebody makes
 * here with its reason, never a branch that quietly appears in one consumer and not the other.
 */
export const SPECIFIER_CLASSES: readonly SpecifierClass[] = Object.freeze([
  "bare",
  "relative",
  "foreign",
]);

/**
 * THE ONE AUTHORITY ON A MODULE SPECIFIER'S CLASS.
 *
 * Every arm is a POSITIVE test. That is the whole point of the cutover: the predicate this replaced
 * was a chain of negations (`!startsWith(".") && !startsWith("/")`), and a chain of negations
 * admits every spelling nobody thought to subtract. Here `bare` and `relative` each state what they
 * ARE, and `foreign` is the complement of those two statements — so the partition is total by
 * construction rather than by enumeration.
 *
 * `relative`: the specifier begins `./` or `../`. Nothing else is resolved against the importing
 * file, and `.` and `..` are deliberately NOT relative — they name a directory, which this walk
 * cannot read as a module, so they are refused rather than followed into an unresolvable edge.
 *
 * `bare`: the specifier is non-empty and its first character is not a PATH OR URL INTRODUCER
 * (`.`, `/`, `\`, `#`, `%`), AND the specifier contains no backslash, AND it either carries no `:`
 * at all or its scheme — the run before the first `:` — is exactly `node`. `node:` is the one
 * builtin scheme Node's ESM loader admits as a bare identifier, and `normalizeSpecifier` in the
 * read-only guard already treats `node:fs` and `fs` as one identity. The backslash clause is what
 * puts `C:\x\writer.mjs` outside this arm: a drive-letter path begins with a letter and would
 * otherwise read as a package called `C`.
 *
 * THE TEST IS ON THE INTRODUCER, NOT ON THE ALPHABET (review WR-06). It used to require an ASCII
 * letter or `@`, which refused members of the class this module says it SKIPS — `7zip-bin` is a
 * real npm package name, npm permits a leading digit, legacy names may lead with `_`, and a package
 * name may be non-ASCII. Those were hard throws out of `jsImportClosure`, so the module's two
 * statements about the same class disagreed and the narrow one governed.
 *
 * `foreign`: EVERYTHING ELSE, and it exists so that no spelling can fall outside all three. It is
 * the bucket the six spellings `32-24-RED-baseline.txt` measured land in — an absolute POSIX path,
 * `//localhost/…`, `//host/…`, a `file://` URL, a Windows drive-letter path and a `data:` URL —
 * plus `#`-prefixed subpath imports, which resolve through the package manifest's import map that
 * this pass does not read and are therefore refused rather than admitted. A foreign specifier is
 * never followed and never skipped: the walk records it and `jsImportClosure` refuses on it.
 */
export function classifySpecifier(specifier: string): SpecifierClass {
  if (specifier.startsWith("./") || specifier.startsWith("../")) return "relative";
  // `bare` IS A POSITIVE TEST, matching the sentence the docblock above makes (review WR-06). It
  // used to be an ASCII-letter-or-`@` test, which REFUSED members of the class it says it skips:
  // `7zip-bin` is a real npm package name, npm permits a leading digit, legacy names may lead with
  // an underscore, and a non-ASCII name is a package too. Each of those was a hard throw out of
  // `jsImportClosure` rather than a skip — the same "a gate that cannot start" shape as CR-01.
  //
  // WHAT STAYS FOREIGN IS UNCHANGED, because the introducers are what the foreign bucket is FOR: a
  // path (`/`, `\`), a subpath import (`#`), a percent-escape (`%`). The backslash clause below
  // still puts `C:\x\writer.mjs` outside this arm, and the scheme clause still puts `file:`,
  // `data:` and every other non-`node:` scheme outside it.
  const firstChar = specifier.charAt(0);
  const startsBare = firstChar !== "" && !"./\\#%".includes(firstChar);
  if (startsBare && !specifier.includes("\\")) {
    const colon = specifier.indexOf(":");
    if (colon === -1 || specifier.slice(0, colon) === "node") return "bare";
  }
  return "foreign";
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// THE PARSER: A STRUCTURAL VIEW, A MEMOIZED LAZY ACQUISITION, AND A NAMED REFUSAL (32.1-06, D-20).
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/** A parse tree node, reduced to the one member this walk reads off every node. */
interface TsNode {
  readonly kind: number;
}

/** A string literal or a no-substitution template literal — the two shapes that carry a VALUE. */
interface TsStringLiteralLike extends TsNode {
  readonly text: string;
}

/** An identifier, read at ONE site: to tell a `require(…)` call from every other call. */
interface TsIdentifier extends TsNode {
  readonly text: string;
}

/** An import or export declaration. `export { x }` carries no specifier, hence the optional. */
interface TsModuleSpecifierHolder extends TsNode {
  readonly moduleSpecifier?: TsNode;
}

/** A call expression: `import(x)` and `require(x)` are both read through this shape. */
interface TsCallExpression extends TsNode {
  readonly expression: TsNode;
  readonly arguments: readonly TsNode[];
}

/**
 * EXACTLY THE MEMBERS THIS MODULE CALLS, declared structurally so the module's own TYPES do not
 * depend on the parser's package.
 *
 * The form is `scripts/runnable-ref/uat-spec-integrity.ts:868-1000`'s, and the reason is the same one
 * that file gives: the parser is loaded at run time, so a top-level `import type … from "typescript"`
 * would tie this module — a committed, production build output — to a package the host was promised
 * it does not need. Declaring the surface here also makes the node set AUDITABLE: what this walk can
 * ask of a parse is the list below and nothing else.
 *
 * EXPORTED so a caller can INJECT a parser instead of taking the lazily acquired one. A test does,
 * to assert the injected route and the acquired route read one corpus identically — which is what
 * keeps the seam from becoming a second implementation nobody compares. No production call site
 * passes one.
 */
export interface SpecifierParserApi {
  createSourceFile(
    fileName: string,
    text: string,
    languageVersion: number,
    setParentNodes: boolean,
    scriptKind: number,
  ): TsNode;
  forEachChild(node: TsNode, cb: (child: TsNode) => void): unknown;
  isImportDeclaration(node: TsNode): node is TsModuleSpecifierHolder;
  isExportDeclaration(node: TsNode): node is TsModuleSpecifierHolder;
  isCallExpression(node: TsNode): node is TsCallExpression;
  isIdentifier(node: TsNode): node is TsIdentifier;
  isStringLiteralLike(node: TsNode): node is TsStringLiteralLike;
  readonly ScriptTarget: { readonly Latest: number };
  /** `JS`, not `TS`: the corpus is COMPILED BUILD OUTPUT, never the `.ts` a reader sees. */
  readonly ScriptKind: { readonly JS: number };
  readonly SyntaxKind: { readonly ImportKeyword: number };
}

/** The module the extractor asks for, named once so the refusal below and the reader agree. */
const PARSER_MODULE = "typescript";

/**
 * The members validated at acquisition, in ONE place.
 *
 * A module that resolves but cannot answer one of these is as unusable as an absent one, and both
 * are the same named refusal — never a `TypeError` thrown from the middle of a walk, which would
 * reach a gate's caller as a crash rather than as a reason.
 */
const REQUIRED_PARSER_FUNCTIONS: readonly string[] = Object.freeze([
  "createSourceFile",
  "forEachChild",
  "isImportDeclaration",
  "isExportDeclaration",
  "isCallExpression",
  "isIdentifier",
  "isStringLiteralLike",
]);

/**
 * The memo. `undefined` means "not yet attempted"; `null` means "attempted and unavailable", which
 * is remembered so a repository-wide walk does not re-attempt a failing resolution per file.
 */
let parserMemo: SpecifierParserApi | null | undefined;

/** The lazy acquisition itself. Node builtin in, parser or `null` out, never a throw. */
function acquireParser(): SpecifierParserApi | null {
  if (parserMemo !== undefined) return parserMemo;
  parserMemo = null;
  try {
    // RESOLVED FROM THIS MODULE'S OWN LOCATION, not from the caller's working directory: the six
    // consumers are run from a checkout, and a gate invoked from elsewhere must still find the
    // checkout's own parser rather than whatever sits above the directory a shell happened to be in.
    const requireFromHere = createRequire(import.meta.url);
    const candidate = requireFromHere(PARSER_MODULE) as Partial<SpecifierParserApi>;
    const record = candidate as unknown as Record<string, unknown>;
    for (const member of REQUIRED_PARSER_FUNCTIONS) {
      if (typeof record[member] !== "function") return parserMemo;
    }
    if (
      candidate.ScriptTarget === undefined ||
      candidate.ScriptKind === undefined ||
      candidate.SyntaxKind === undefined ||
      typeof candidate.ScriptTarget.Latest !== "number" ||
      typeof candidate.ScriptKind.JS !== "number" ||
      typeof candidate.SyntaxKind.ImportKeyword !== "number"
    ) {
      return parserMemo;
    }
    parserMemo = candidate as SpecifierParserApi;
  } catch {
    parserMemo = null; // fail-closed → a NAMED refusal at the call site, never a pass
  }
  return parserMemo;
}

/**
 * THE NAMED REFUSAL, in the posture this module already takes for an unresolvable edge and for one
 * that escapes the root. It says which module could not be acquired, which function needed it, and
 * what kind of program this is — because the reader who meets it is most likely running a gate from
 * a checkout whose dependencies were never installed, and "cannot find module" alone does not tell
 * them that installing them is the whole fix.
 */
function requireParser(): SpecifierParserApi {
  const api = acquireParser();
  if (api === null) {
    throw new ImportClosureError(
      `js-import-closure: the module specifier extractor could not acquire "${PARSER_MODULE}", so ` +
        `moduleSpecifiers cannot read a source and the closure walk cannot start. This module is a ` +
        `DEVELOPMENT and CONTINUOUS-INTEGRATION tool — it is run from a checkout by the freshness ` +
        `gates, the hook-manifest generator and the platform-shape check, never by a host running ` +
        `the installed kit — so the fix is to install this repository's dev dependencies. It ` +
        `refuses rather than falling back to a pattern match: a second grammar for JavaScript is ` +
        `exactly what 32.1-06 deleted, and a fallback that reads SOME imports hands back a closure ` +
        `missing precisely the file the walk could not see.`,
    );
  }
  return api;
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// FOUR DELETIONS, EACH WITH THE MEASUREMENT THAT DISPROVED THE CLAIM THAT KEPT IT (32.1-06, D-08).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
//
// 1. THE REGULAR-EXPRESSION ARM of `scanSource` WAS DELETED HERE (review WR-02, finding F-16). It
//    walked to a regex literal's closing `/`, consumed the flags and skipped — deliberately WITHOUT
//    blanking the pattern interior. The claim that kept it was this module's own sentence: *"a `from
//    "…"` written inside prose has had its `from` keyword blanked along with everything else and
//    matches nothing. Only a specifier in a real POSITION survives to be matched."* DISPROVED by
//    F-16's reproduction, re-run against the committed build output and recorded in
//    `32.1-06-RED-baseline.txt` § 2: `const re = /from "x/; import y from "./real.js";` scanned to
//    `["x/; import y from " : bare]` while a real parse read `["./real.js"]` — the scanner
//    FABRICATED a specifier out of a pattern interior AND SWALLOWED the real import on the same
//    line, and because the fabrication classified `bare` the walk skipped it in silence. A regex
//    literal is a token, and only a tokenizer knows where one ends.
//
// 2. `SPECIFIER_PATTERNS` WAS DELETED HERE (finding F-17). Three regular expressions —
//    `\bfrom\s*["']…`, `\bimport\s*["']…`, `\bimport\s*\(\s*["']…` — whose accepted quote alphabet
//    was exactly `["']`. The claim that kept it was that those are *"the three emitted forms a module
//    specifier appears in, and NOTHING else"*. DISPROVED by F-17's reproduction
//    (`32.1-06-RED-baseline.txt` § 2): `export const load = async () => (await import(`./tpl.js`)).name;`
//    scanned to `[]` while a real parse read `["./tpl.js"]` — and F-17's own listing records Node
//    resolving and RUNNING that module. A backtick is not in the alphabet, so the edge was invisible,
//    and a mirror built from that closure is short by exactly the file it could not see.
//
// 3. THE LITERAL RECOVERY TABLE WAS DELETED HERE (review WR-03). `scanSource` recorded
//    `literals.set(textStart, source.slice(textStart, textEnd))` and `moduleSpecifiers` read the
//    specifier back out of it. The claim that kept it was that blanking could then be TOTAL without
//    destroying the text the patterns exist to capture — *"the literal's text is recorded here and
//    recovered by offset"*. DISPROVED by WR-03's reproduction (`32.1-06-RED-baseline.txt` § 2):
//    `import a from "./mod.js";` recovered `./mod.js` where the parse read `./mod.js`, so
//    the walk resolved a path nobody wrote and threw over a module that exists. A string literal's
//    TEXT is not its VALUE; the table stored bytes and the question was about meaning.
//
// 4. `scanSource` AND ITS EXPORTED VIEW `stripNonCode` WERE DELETED HERE, and this one is a DECISION
//    rather than a consequence, because deleting a scanner does not by itself oblige deleting a
//    separately exported view over it. The claim to test was RESEARCH assumption A4, flagged there as
//    an assumption: *"`stripNonCode` has no caller outside `board-readonly.test.ts` and can be deleted
//    with `scanSource`."* MEASURED rather than taken, repository-wide across `.ts`, `.js`, `.mjs` and
//    `.md` (`32.1-06-RED-baseline.txt` § 1): `stripNonCode` had TWO code referents, both its own
//    definition and its build twin, and SIX referents in `board-readonly.test.ts` — one test NAME,
//    four comments and one failure message. It is in no import list in the repository; the cases the
//    research calls "its own tests" call `moduleSpecifiers`. `scanSource` was module-private with two
//    callers, both in this file, one of them the extractor now deleted. So the view was an export
//    nobody read, and the blanking pass it viewed has no consumer once a tokenizer decides for itself
//    what is prose. The three behavioural cases whose prose named it — a specifier written only in a
//    comment, only in a template literal, and one written inside a template SUBSTITUTION that must
//    still be SEEN — are KEPT and re-homed onto the parse, because each still decides a real property.

/** One module specifier as this pass read it, with the class the one authority gave it. */
export interface ClassifiedSpecifier {
  readonly specifier: string;
  readonly cls: SpecifierClass;
}

/**
 * A position where this walk found a module-specifier SLOT whose contents it cannot reduce to a
 * value — `import(someVariable)`, `require(a + b)`, `import(cond ? x : y)`.
 *
 * IT IS RECORDED RATHER THAN IGNORED, and that is the whole difference between this and the scanner.
 * The scanner had no notion of a slot: a shape it did not match was indistinguishable from a line of
 * prose. A parse knows the difference, so "there is an edge here and I cannot read it" is a fact with
 * a position and a node kind — the seam D-11's named refusal attaches to. Nothing in this module
 * refuses on it yet; recording it is what makes refusing on it possible without widening a matcher.
 */
export interface UnreadableSpecifierSite {
  readonly form: "dynamic-import" | "require";
  readonly nodeKind: number;
  readonly nodeKindName: string;
}

/** What one parse of one source found: the specifiers it read, and the slots it could not read. */
export interface ModuleSpecifierFacts {
  readonly specifiers: readonly ClassifiedSpecifier[];
  readonly unreadable: readonly UnreadableSpecifierSite[];
}

/**
 * The parser's own name for a node kind, looked up defensively.
 *
 * The kind table is a reverse-mapped enum, which is an implementation detail of how the parser emits
 * its enums rather than a documented member — so a number that is not in it yields the number itself,
 * and a refusal built on this can never be a `TypeError` about an absent lookup.
 */
function nodeKindName(api: SpecifierParserApi, kind: number): string {
  const table = api.SyntaxKind as unknown as Record<number, string | undefined>;
  return table[kind] ?? `kind ${kind}`;
}

/**
 * Every module specifier one JavaScript source carries, each with its class, PLUS every specifier
 * slot whose contents could not be reduced to a value.
 *
 * ONE TOKENIZER, ONE STATED NODE SET. There is no blanking pass, no pattern list and no recovery
 * table, because a parse answers all three questions the three of them together were trying to
 * answer: a comment is a comment, a regular-expression literal is one token, and a string literal's
 * value is a value. The `parser` argument is an OPTIONAL trailing seam for tests; every production
 * call site omits it and gets the lazily acquired, memoized parser.
 *
 * `ScriptKind.JS` is not optional and not cosmetic: the corpus is compiled build output. Asking for
 * a TypeScript parse of a `.js` file would admit syntax the corpus can never contain and read some
 * of what it does contain differently.
 */
export function moduleSpecifierFacts(
  source: string,
  parser?: SpecifierParserApi,
): ModuleSpecifierFacts {
  const api = parser ?? requireParser();
  const sourceFile = api.createSourceFile(
    "js-import-closure-scan.js",
    source,
    api.ScriptTarget.Latest,
    true,
    api.ScriptKind.JS,
  );

  const specifiers: ClassifiedSpecifier[] = [];
  const unreadable: UnreadableSpecifierSite[] = [];

  const readValue = (node: TsNode): void => {
    if (api.isStringLiteralLike(node)) {
      // THE VALUE, NOT THE SPELLING. `isStringLiteralLike` is what admits a no-substitution template
      // (F-17's shape) and `.text` is what decodes an escape (WR-03's shape). The two findings have
      // one answer because they were one mistake: asking about bytes where the question was meaning.
      specifiers.push({ specifier: node.text, cls: classifySpecifier(node.text) });
    }
  };

  const readCallArgument = (node: TsCallExpression, form: UnreadableSpecifierSite["form"]): void => {
    const argument = node.arguments[0];
    // A call with no argument is a syntax error rather than an edge, and inventing an unreadable slot
    // for it would put a position into the D-11 seam that no program can reach.
    if (argument === undefined) return;
    if (api.isStringLiteralLike(argument)) {
      readValue(argument);
      return;
    }
    // REFUSED BY NODE KIND, NOT WIDENED BY ANOTHER ARM. This is the canonical form: one admitted
    // shape, and everything else named by what it actually is.
    unreadable.push({
      form,
      nodeKind: argument.kind,
      nodeKindName: nodeKindName(api, argument.kind),
    });
  };

  const visit = (node: TsNode): void => {
    if (api.isImportDeclaration(node) || api.isExportDeclaration(node)) {
      // `export { x }` and `export default x` carry no module specifier at all. That is an absent
      // slot rather than an unreadable one, so it contributes nothing in either direction.
      const specifier = node.moduleSpecifier;
      if (specifier !== undefined) readValue(specifier);
    } else if (api.isCallExpression(node)) {
      if (node.expression.kind === api.SyntaxKind.ImportKeyword) {
        readCallArgument(node, "dynamic-import");
      } else if (api.isIdentifier(node.expression) && node.expression.text === "require") {
        readCallArgument(node, "require");
      }
    }
    api.forEachChild(node, visit);
  };
  visit(sourceFile);

  return { specifiers, unreadable };
}

/**
 * Every module specifier one JavaScript source carries, each with its class.
 *
 * The shape every existing caller uses, kept exactly: `moduleSpecifierFacts` is the fuller answer and
 * this is the projection of it that the walk and the read-only guard's census both want.
 */
export function moduleSpecifiers(
  source: string,
  parser?: SpecifierParserApi,
): readonly ClassifiedSpecifier[] {
  return moduleSpecifierFacts(source, parser).specifiers;
}

// `relativeSpecifiers` WAS DELETED HERE (review WR-07). 32-31 kept it "so every existing caller is
// unaffected" — a sentence with no referent: a repository-wide search across `.ts`, `.js`, `.mjs`
// and `.md` found the symbol only at its own two definition sites, and it had no test of its own.
// `jsImportClosureFacts` walks `moduleSpecifiers` directly. Dead code carrying a false claim about
// why it is kept is worse than dead code, because the next reader takes the sentence as evidence
// that the export is load-bearing and preserves it again.

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

/** One edge the walk refused to follow: the module that carries it and the specifier it carries. */
export interface ForeignEdge {
  readonly module: string;
  readonly specifier: string;
}

/** What one walk of an entry's closure found: the modules it reached and the edges it refused. */
export interface ImportClosureFacts {
  readonly modules: readonly string[];
  readonly foreignEdges: readonly ForeignEdge[];
}

/**
 * The walk itself: `entry`'s transitive closure, plus every FOREIGN edge it met on the way.
 *
 * WHY THE WALK AND THE REFUSAL ARE SPLIT (32-31). A walk that threw the instant it met a foreign
 * specifier would make the read-only guard's own foreign-specifier census UNREACHABLE — the guard
 * calls this to get the module set it then analyses, so a throw here means the census never runs and
 * the specifier is never recorded at the position the guard decides from. A predicate that is never
 * ASKED cannot refuse. So the walk REPORTS the third bucket at a named position and `jsImportClosure`
 * — the entry point every existing caller uses — carries the refusal, unchanged in signature and
 * strictly stronger in contract.
 *
 * Each class is handled by its own named rule, and there is no fall-through:
 *   `relative` — resolved, containment-checked, existence-checked and followed, exactly as before.
 *   `bare`     — skipped, by this module's written scope rule (builtins and a package set that is
 *                empty in this repository).
 *   `foreign`  — recorded into `foreignEdges` and NOT followed. Never skipped.
 *
 * `modules` is sorted so two callers comparing closures compare sets and not traversal order, and so
 * a caller that prints the closure prints a stable list.
 */
export function jsImportClosureFacts(root: string, entryRel: string): ImportClosureFacts {
  const rootAbs = resolve(root);
  const entryAbs = resolve(rootAbs, entryRel);
  assertInsideRoot(rootAbs, entryAbs, `the entry ${entryRel}`);
  if (!existsSync(entryAbs) || !statSync(entryAbs).isFile()) {
    throw new ImportClosureError(
      `js-import-closure: the entry ${entryRel} does not exist under ${rootAbs} — refusing to ` +
        `report an empty closure for a file that was never read.`,
    );
  }

  const relPosix = (abs: string): string => relative(rootAbs, abs).split(sep).join("/");
  const seen = new Set<string>();
  const foreignEdges: ForeignEdge[] = [];
  const queue: string[] = [entryAbs];
  while (queue.length > 0) {
    const abs = queue.pop() as string;
    if (seen.has(abs)) continue;
    seen.add(abs);
    const source = readFileSync(abs, "utf8");
    for (const { specifier, cls } of moduleSpecifiers(source)) {
      if (cls === "bare") continue;
      if (cls === "foreign") {
        foreignEdges.push({ module: relPosix(abs), specifier });
        continue;
      }
      const target = resolve(dirname(abs), specifier);
      assertInsideRoot(rootAbs, target, `the import "${specifier}" in ${relPosix(abs)}`);
      if (!existsSync(target) || !statSync(target).isFile()) {
        throw new ImportClosureError(
          `js-import-closure: ${relPosix(abs)} imports "${specifier}", which does not resolve ` +
            `to a file at ${target}. A mirror built from a closure with an unresolvable edge would ` +
            `be missing exactly the file the walk could not see, so the walk refuses instead.`,
        );
      }
      if (!seen.has(target)) queue.push(target);
    }
  }

  return { modules: [...seen].map(relPosix).sort(), foreignEdges };
}

/**
 * The transitive closure of `entry`'s relative imports, INCLUDING `entry` itself, as repo-relative
 * POSIX paths, sorted.
 *
 * Unchanged in signature and in every legitimate result. What it gained in 32-31 is the FOREIGN
 * refusal: an edge whose specifier is in neither the relative nor the bare arm is now named in a
 * throw, in exactly the posture this module already takes for an unresolvable edge and for an edge
 * that escapes the root. Every foreign edge is named, not just the first, because a caller who fixes
 * one and re-runs should not discover the next one a build later.
 */
export function jsImportClosure(root: string, entryRel: string): readonly string[] {
  const { modules, foreignEdges } = jsImportClosureFacts(root, entryRel);
  if (foreignEdges.length > 0) {
    const named = foreignEdges.map((e) => `${e.module} imports "${e.specifier}"`).join("; ");
    throw new ImportClosureError(
      `js-import-closure: ${named}. A specifier that is neither RELATIVE (./…, ../…) nor BARE (a ` +
        `node builtin or a package) names a module this walk cannot read, cannot mirror and cannot ` +
        `vouch for — an absolute or protocol-relative path, a file:/data: URL, a drive-letter path ` +
        `or a #-prefixed subpath import. Following it would mirror a file from outside the tree; ` +
        `skipping it would hand back a closure missing exactly the module the walk could not see. ` +
        `So the walk refuses instead.`,
    );
  }
  return modules;
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
