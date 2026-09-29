// host-protection-floor.test.ts — the static census of the git-host check's floor (Phase 33.1,
// plan 33.1-22, Gap A of 33.1-VERIFICATION.md, re-review CR-01, decision D-30).
//
// WHY A CENSUS. D-30 fixes the rule: anything unreadable, absent or oddly shaped is
// `UNKNOWN - verify`, never `protected`. Every round of this phase fixed the named site while a
// sibling site of the same class survived (brief 33.1-GAP-PLANNING-BRIEF.md, DC-1). Plan 33.1-22
// moved every read that can produce `held` or `binds` behind one reader, readFact(value,
// ACCEPT.<name>), and every other host field behind one accessor, hostField(value, key). This file
// holds that shape statically, so a future ad-hoc reader cannot slip past it:
//
//   1. PRODUCERS. Every string literal "held", "binds", "failed", "bypassable", "protected" or
//      "unprotected" in host-protection.ts is either non-producing (an operand of ===, !==, == or
//      !=, a `case` clause expression, inside a type node, or the key argument of hostField, which
//      names a host field and is never returned) or counted under its enclosing scope.
//      The counted multiset equals the pinned PRODUCERS table, two-sided, with counts. A new
//      producer in a row reader, or a new path to a `protected` verdict, turns this red.
//      "unknown" and "UNKNOWN - verify" are deliberately NOT pinned: they are the fail-closed
//      defaults, and a new producer of either can only lower a verdict, never raise one.
//   2. HOST_READS. A type-checked census: a ts.Program over host-protection.ts finds every read of a
//      value whose type is the host-JSON type `Record<string, unknown>` (property and element
//      access, destructuring, Object.* / Reflect.* / JSON.stringify over it, spread, `for…in`, and
//      `in`). Each read must sit inside readFact, hostField or an ACCEPT entry's predicate; the one
//      declared exception is environmentName, class `config-json`, which parses the user's
//      factory.config.json and not a host answer. Any such access on an `any`-typed value is refused
//      anywhere in the file. The census fails closed: it first asserts zero syntactic and semantic
//      diagnostics for the file, because a file it cannot type proves nothing. Reads are keyed by
//      access NODE per scope, so a new hostField(x, "k") call site adds no row (the access it makes
//      is the one inside hostField).
//      A cast or a type guard that turns an opaque value into an object type with named properties
//      is refused too, because it would move a host read out of the type the census looks for.
//   3. The readFact argument census: every readFact call passes `ACCEPT.<name>` as its second
//      argument, the names used equal the keys declared in the ACCEPT object literal, two-sided,
//      and ACCEPT is referenced nowhere else except the load-time self-check.
//   4. The source calls assertAcceptTable() at top level, after ACCEPT and the uncaughtException
//      handler, and before any gh call.
//
// This is the static half. Plan 33.1-23 adds the behavioural half (every evidence field of the
// strong fixture removed, nulled or garbled alone) to this same file.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import ts from "typescript";
import { join } from "node:path";

const HERE = import.meta.dirname;
const REPO_ROOT = join(HERE, "..", "..");
const SOURCE = join(HERE, "host-protection.ts");

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// The pinned tables.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const STATE_LITERALS = new Set(["held", "binds", "failed", "bypassable", "protected", "unprotected"]);

interface PinnedRow {
  readonly key: string;
  readonly count: number;
  readonly why: string;
}

// `<scope>:<literal>` → count. Every row names why that scope may produce the literal.
const PRODUCERS: readonly PinnedRow[] = [
  { key: "readFact:held", count: 1, why: "the one reader: held only when an ACCEPT entry accepts the value" },
  { key: "readFact:failed", count: 1, why: "the one reader: failed only when an ACCEPT entry reads the value as not shown" },
  { key: "toBinding:binds", count: 1, why: "a source binds only from a readFact `held`" },
  { key: "toBinding:bypassable", count: 1, why: "a source is bypassable only from a readFact `failed`" },
  { key: "bindSources:held", count: 1, why: "derived: at least one source both shows the item (held) and binds" },
  { key: "bindSources:failed", count: 1, why: "derived: every source was read and none shows the item and binds" },
  { key: "combineArms:held", count: 1, why: "derived: the union rule, held when either arm is held" },
  { key: "combineArms:failed", count: 1, why: "derived: the union rule, failed only when both arms are failed" },
  { key: "qualifierFact:held", count: 1, why: "derived: the qualifier is held exactly when every item row is held" },
  { key: "qualifierFact:failed", count: 1, why: "derived: an item failed and a source that would show it is bypassable" },
  {
    key: "rulesetReading:failed",
    count: 1,
    why: "a rule list read in full holds no rule of the item's type (downgraded to unknown when the list is partial)",
  },
  { key: "classicReading:failed", count: 1, why: "the host reports no classic protection (404 `Branch not protected`, or `.protected === false`)" },
  {
    key: "ENVIRONMENT_FLOOR[required_reviewer].read:failed",
    count: 1,
    why: "every readable required_reviewers rule names no reviewer; passed through downgrade(), so a garbage entry makes it unknown",
  },
  {
    key: "ENVIRONMENT_FLOOR[no_self_review].read:failed",
    count: 1,
    why: "there is no required_reviewers rule at all; passed through downgrade(), so a garbage entry makes it unknown",
  },
  { key: "branchVerdict:protected", count: 1, why: "the one branch verdict: every BRANCH_FLOOR row is held" },
  { key: "branchVerdict:unprotected", count: 1, why: "the one branch verdict: some row is failed" },
  { key: "environmentVerdict:protected", count: 1, why: "the one environment verdict: every ENVIRONMENT_FLOOR row is held" },
  { key: "environmentVerdict:unprotected", count: 1, why: "the one environment verdict: some row is failed" },
];

// The only scopes that may produce "held" or "binds", and "protected" (the plan's stated sets). A
// row outside these for those literals is refused even if someone pins it.
const HELD_BINDS_SCOPES = new Set(["readFact", "toBinding", "bindSources", "combineArms", "qualifierFact"]);
const PROTECTED_SCOPES = new Set(["branchVerdict", "environmentVerdict"]);

type ReadClass = "reader" | "config-json";

interface HostReadRow extends PinnedRow {
  readonly cls: ReadClass;
}

// `<scope>:<read kind>` → count. `reader` rows must sit in readFact, hostField or an ACCEPT
// predicate; the `config-json` row is the one declared exception.
const HOST_READS: readonly HostReadRow[] = [
  { key: "hostField:element", count: 1, cls: "reader", why: "the one accessor: value[key] after isObject(value)" },
  { key: "ACCEPT.bypassAllowances.held:property", count: 3, cls: "reader", why: "users, teams and apps must all be empty arrays" },
  { key: "ACCEPT.enforceAdmins.held:property", count: 1, cls: "reader", why: "enforce_admins.enabled === true" },
  { key: "ACCEPT.enforceAdmins.failed:property", count: 1, cls: "reader", why: "enforce_admins.enabled === false" },
  { key: "ACCEPT.disabledFlag.held:property", count: 1, cls: "reader", why: "allow_*.enabled === false" },
  { key: "ACCEPT.disabledFlag.failed:property", count: 1, cls: "reader", why: "allow_*.enabled === true" },
  { key: "ACCEPT.ruleEntry.held:property", count: 1, cls: "reader", why: "a rule entry's type must be a string" },
  {
    key: "ACCEPT.deploymentBranchPolicy.held:property",
    count: 2,
    cls: "reader",
    why: "protected_branches === true and custom_branch_policies === false",
  },
  {
    key: "environmentName:property",
    count: 4,
    cls: "config-json",
    why: "parses the user's factory.config.json `environments` list (not a host answer); plan 33.1-25 bounds this read",
  },
];

const CONFIG_JSON_SCOPES = new Set(["environmentName"]);
const isReaderScope = (scope: string): boolean => scope === "readFact" || scope === "hostField" || scope.startsWith("ACCEPT.");

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// The program, built once. Fail-closed: a file the checker cannot type proves nothing.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

function buildProgram(): { program: ts.Program; sf: ts.SourceFile; checker: ts.TypeChecker } {
  const configPath = join(REPO_ROOT, "tsconfig.json");
  const read = ts.readConfigFile(configPath, (p) => ts.sys.readFile(p));
  if (read.error !== undefined) throw new Error(`tsconfig.json could not be read: ${ts.flattenDiagnosticMessageText(read.error.messageText, "\n")}`);
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, REPO_ROOT);
  const program = ts.createProgram({ rootNames: [SOURCE], options: { ...parsed.options, noEmit: true } });
  const sf = program.getSourceFile(SOURCE);
  if (sf === undefined) throw new Error(`the program has no source file for ${SOURCE}`);
  return { program, sf, checker: program.getTypeChecker() };
}

const { program, sf: SF, checker: CHECKER } = buildProgram();

const lineOf = (node: ts.Node): number => SF.getLineAndCharacterOfPosition(node.getStart(SF)).line + 1;

function diagnosticsText(list: readonly ts.Diagnostic[]): string[] {
  return list.map((d) => {
    const where = d.file !== undefined && d.start !== undefined ? `:${d.file.getLineAndCharacterOfPosition(d.start).line + 1}` : "";
    return `host-protection.ts${where} ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// Scope naming: the path of named containers from the file root down to the node.
//   - a function declaration or method: its name
//   - a variable or object property whose (unwrapped) initializer is a function, an object literal
//     or an array literal: its name (so ACCEPT entries read `ACCEPT.<entry>.held`)
//   - an object literal inside an array literal: `[<id>]` when it has a string `id`, else `[<index>]`
//     (so table rows read `ENVIRONMENT_FLOOR[required_reviewer].read`)
// An anonymous function (a callback) adds nothing: it belongs to the scope that encloses it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

function unwrap(e: ts.Expression): ts.Expression {
  let cur = e;
  while (ts.isParenthesizedExpression(cur) || ts.isAsExpression(cur) || ts.isSatisfiesExpression(cur) || ts.isTypeAssertionExpression(cur)) {
    cur = cur.expression;
  }
  return cur;
}

function isContainer(e: ts.Expression | undefined): boolean {
  if (e === undefined) return false;
  const u = unwrap(e);
  return ts.isArrowFunction(u) || ts.isFunctionExpression(u) || ts.isObjectLiteralExpression(u) || ts.isArrayLiteralExpression(u);
}

function within(node: ts.Node, outer: ts.Node | undefined): boolean {
  return outer !== undefined && node.pos >= outer.pos && node.end <= outer.end;
}

function rowLabel(obj: ts.ObjectLiteralExpression, arr: ts.ArrayLiteralExpression): string {
  for (const p of obj.properties) {
    if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === "id" && ts.isStringLiteral(p.initializer)) {
      return `[${p.initializer.text}]`;
    }
  }
  return `[${arr.elements.indexOf(obj)}]`;
}

function scopeOf(node: ts.Node): string {
  const parts: string[] = [];
  for (let cur: ts.Node = node; cur.parent !== undefined; cur = cur.parent) {
    const p = cur.parent;
    if ((ts.isFunctionDeclaration(p) || ts.isMethodDeclaration(p)) && p.name !== undefined && cur !== p.name) {
      parts.unshift(p.name.getText(SF));
    } else if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name) && cur === p.initializer && isContainer(p.initializer)) {
      parts.unshift(p.name.text);
    } else if (ts.isPropertyAssignment(p) && cur === p.initializer && isContainer(p.initializer)) {
      parts.unshift(p.name.getText(SF));
    } else if (ts.isArrayLiteralExpression(p) && ts.isObjectLiteralExpression(cur)) {
      parts.unshift(rowLabel(cur, p));
    }
  }
  if (parts.length === 0) return "<top-level>";
  return parts.reduce((acc, part) => (acc === "" ? part : part.startsWith("[") ? `${acc}${part}` : `${acc}.${part}`), "");
}

function countBy(xs: readonly string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

function twoSided(found: Map<string, number>, pinned: readonly PinnedRow[]): string[] {
  const want = new Map(pinned.map((r) => [r.key, r.count]));
  const problems: string[] = [];
  for (const [key, n] of [...found].sort()) {
    const w = want.get(key);
    if (w === undefined) problems.push(`UNCOUNTED ${key} x${n}`);
    else if (w !== n) problems.push(`COUNT ${key}: found ${n}, pinned ${w}`);
  }
  for (const [key, n] of [...want].sort()) if (!found.has(key)) problems.push(`STALE ROW ${key} x${n} (nothing produces it)`);
  return problems;
}

function walk(node: ts.Node, visit: (n: ts.Node) => void): void {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
}

function inTypeNode(node: ts.Node): boolean {
  for (let cur: ts.Node | undefined = node.parent; cur !== undefined; cur = cur.parent) {
    if (ts.isTypeNode(cur)) return true;
    if (ts.isStatement(cur) || ts.isSourceFile(cur)) return false;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 1. PRODUCERS: where the state literals are produced.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const COMPARISONS = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
]);

function producerCensus(): string[] {
  const out: string[] = [];
  walk(SF, (node) => {
    if (!(ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) return;
    if (!STATE_LITERALS.has(node.text)) return;
    const p = node.parent;
    if (ts.isBinaryExpression(p) && COMPARISONS.has(p.operatorToken.kind)) return;
    if (ts.isCaseClause(p) && p.expression === node) return;
    if (inTypeNode(node)) return;
    // The key argument of hostField(value, key) names a host FIELD (for example the branch
    // endpoint's `protected` boolean); hostField returns the value under it, never the key.
    if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === "hostField" && p.arguments[1] === node) return;
    out.push(`${scopeOf(node)}:${node.text}`);
  });
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 2. HOST_READS: where a host-JSON value is read (type-checked).
// ═══════════════════════════════════════════════════════════════════════════════════════════════

// The host-JSON type: a string index signature of `unknown` and no named property
// (`Record<string, unknown>`, however it is spelled). A union counts when any member is one.
function isHostJson(t: ts.Type): boolean {
  if (t.isUnion()) return t.types.some(isHostJson);
  if ((t.flags & ts.TypeFlags.Object) === 0) return false;
  const index = CHECKER.getIndexInfosOfType(t).find((i) => (i.keyType.flags & ts.TypeFlags.String) !== 0);
  return index !== undefined && (index.type.flags & ts.TypeFlags.Unknown) !== 0 && t.getProperties().length === 0;
}

function isAny(t: ts.Type): boolean {
  return (t.flags & ts.TypeFlags.Any) !== 0;
}

const ENUMERATING_CALLS = new Set([
  "Object.keys",
  "Object.values",
  "Object.entries",
  "Object.getOwnPropertyNames",
  "Object.getOwnPropertyDescriptor",
  "Object.getOwnPropertyDescriptors",
  "Object.assign",
  "Object.hasOwn",
  "Reflect.get",
  "Reflect.has",
  "Reflect.ownKeys",
  "Reflect.getOwnPropertyDescriptor",
  "JSON.stringify",
]);

interface Read {
  readonly scope: string;
  readonly kind: string;
  readonly line: number;
}

// The type of the value a binding pattern destructures: the checker gives it at the pattern itself,
// for a declaration with an initializer, a `for…of` element, a parameter or a nested pattern alike.
function patternSourceType(pattern: ts.BindingPattern): ts.Type {
  return CHECKER.getTypeAtLocation(pattern);
}

function hostReadCensus(): { reads: Read[]; anyRefusals: string[] } {
  const reads: Read[] = [];
  const anyRefusals: string[] = [];
  const consider = (obj: ts.Node, kind: string, at: ts.Node): void => {
    const t = CHECKER.getTypeAtLocation(obj);
    if (isAny(t)) anyRefusals.push(`${kind} on an any-typed value at host-protection.ts:${lineOf(at)} (${scopeOf(at)}): ${at.getText(SF).slice(0, 80)}`);
    else if (isHostJson(t)) reads.push({ scope: scopeOf(at), kind, line: lineOf(at) });
  };
  walk(SF, (node) => {
    if (inTypeNode(node)) return;
    if (ts.isPropertyAccessExpression(node)) consider(node.expression, "property", node);
    else if (ts.isElementAccessExpression(node)) consider(node.expression, "element", node);
    else if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
      const t = patternSourceType(node);
      for (const el of node.elements) {
        if (!ts.isBindingElement(el)) continue;
        if (isAny(t)) anyRefusals.push(`destructure of an any-typed value at host-protection.ts:${lineOf(el)} (${scopeOf(el)})`);
        else if (isHostJson(t)) reads.push({ scope: scopeOf(el), kind: "binding", line: lineOf(el) });
      }
    } else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression)) {
      const name = `${node.expression.expression.text}.${node.expression.name.text}`;
      if (ENUMERATING_CALLS.has(name)) for (const arg of node.arguments) consider(arg, "object-call", node);
    } else if (ts.isForInStatement(node)) consider(node.expression, "for-in", node);
    else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.InKeyword) consider(node.right, "in", node);
    else if (ts.isSpreadAssignment(node) || ts.isSpreadElement(node)) consider(node.expression, "spread", node);
  });
  return { reads, anyRefusals };
}

// The census above finds reads by the host-JSON TYPE, so a host value that is given another type
// would slip past it: `(v as { enabled: boolean }).enabled`, or a type guard `v is { enabled:
// boolean }`, reads a host field on a value typed as a shape. Both are refused: no cast and no type
// predicate may turn an opaque value (`unknown`, `any` or host JSON) into an object type with named
// properties. Arrays and tuples are not shapes (an element of a host list is still `unknown`).
function isOpaque(t: ts.Type): boolean {
  if (t.isUnion()) return t.types.some(isOpaque);
  return (t.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any)) !== 0 || isHostJson(t);
}

function isShaped(t: ts.Type): boolean {
  if (t.isUnion() || t.isIntersection()) return t.types.some(isShaped);
  if ((t.flags & ts.TypeFlags.Object) === 0) return false;
  if (CHECKER.isArrayType(t) || CHECKER.isTupleType(t)) return false;
  return t.getProperties().length > 0;
}

function shapeRefusals(): string[] {
  const out: string[] = [];
  walk(SF, (node) => {
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
      if (isOpaque(CHECKER.getTypeAtLocation(node.expression)) && isShaped(CHECKER.getTypeAtLocation(node))) {
        out.push(`a cast gives an opaque value a shape at host-protection.ts:${lineOf(node)} (${scopeOf(node)}): ${node.getText(SF).slice(0, 80)}`);
      }
    }
    if (ts.isFunctionLike(node) && node.type !== undefined && ts.isTypePredicateNode(node.type)) {
      const sig = CHECKER.getSignatureFromDeclaration(node);
      const pred = sig === undefined ? undefined : CHECKER.getTypePredicateOfSignature(sig);
      if (pred?.type !== undefined && pred.parameterIndex !== undefined) {
        const param = node.parameters[pred.parameterIndex];
        const from = param === undefined ? undefined : CHECKER.getTypeAtLocation(param);
        if (from !== undefined && isOpaque(from) && isShaped(pred.type)) {
          out.push(`a type guard gives an opaque value a shape at host-protection.ts:${lineOf(node)} (${scopeOf(node)}): ${node.type.getText(SF)}`);
        }
      }
    }
  });
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 3 and 4. readFact's arguments, the ACCEPT keys, and the top-level self-check.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

function acceptDeclaration(): ts.ObjectLiteralExpression {
  let found: ts.ObjectLiteralExpression | undefined;
  for (const st of SF.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const d of st.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.name.text === "ACCEPT" && d.initializer !== undefined) {
        const init = unwrap(d.initializer);
        if (ts.isObjectLiteralExpression(init)) found = init;
      }
    }
  }
  if (found === undefined) throw new Error("host-protection.ts declares no top-level `const ACCEPT = { ... }` object literal");
  return found;
}

function acceptCensus(): { declared: string[]; used: string[]; refusals: string[] } {
  const decl = acceptDeclaration();
  const declared = decl.properties.map((p) => (p.name !== undefined ? p.name.getText(SF) : `<unnamed at :${lineOf(p)}>`));
  const used: string[] = [];
  const refusals: string[] = [];
  walk(SF, (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "readFact") {
      const arg = node.arguments[1];
      if (
        node.arguments.length === 2 &&
        arg !== undefined &&
        ts.isPropertyAccessExpression(arg) &&
        ts.isIdentifier(arg.expression) &&
        arg.expression.text === "ACCEPT"
      ) {
        used.push(arg.name.text);
      } else {
        refusals.push(`readFact called at host-protection.ts:${lineOf(node)} without ACCEPT.<name> as its second argument: ${node.getText(SF).slice(0, 80)}`);
      }
    }
    if (ts.isIdentifier(node) && node.text === "readFact") {
      const p = node.parent;
      const isCallee = ts.isCallExpression(p) && p.expression === node;
      const isDecl = ts.isFunctionDeclaration(p) && p.name === node;
      if (!isCallee && !isDecl) refusals.push(`readFact referenced other than as a callee at host-protection.ts:${lineOf(node)}`);
    }
    if (ts.isIdentifier(node) && node.text === "ACCEPT") {
      const p = node.parent;
      const isDecl = ts.isVariableDeclaration(p) && p.name === node;
      const isReadFactArg =
        ts.isPropertyAccessExpression(p) && p.expression === node && ts.isCallExpression(p.parent) && p.parent.arguments[1] === p &&
        ts.isIdentifier(p.parent.expression) && p.parent.expression.text === "readFact";
      const inSelfCheck = scopeOf(node) === "assertAcceptTable";
      if (!isDecl && !isReadFactArg && !inSelfCheck) {
        refusals.push(`ACCEPT referenced outside readFact's second argument and the self-check at host-protection.ts:${lineOf(node)}`);
      }
    }
  });
  return { declared, used, refusals };
}

function containsCallOf(node: ts.Node, names: ReadonlySet<string>): boolean {
  let hit = false;
  walk(node, (n) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && names.has(n.expression.text)) hit = true;
  });
  return hit;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// The checks.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("host-protection.ts floor census (Gap A, CR-01, D-30, plan 33.1-22)", () => {
  it("the type checker reads host-protection.ts with zero syntactic and zero semantic diagnostics (fail closed)", () => {
    const syntactic = diagnosticsText(program.getSyntacticDiagnostics(SF));
    const semantic = diagnosticsText(program.getSemanticDiagnostics(SF));
    expect(syntactic, syntactic.join("\n")).toEqual([]);
    expect(semantic, semantic.join("\n")).toEqual([]);
  });

  it("PRODUCERS: the state literals are produced only in the pinned scopes, two-sided, with counts", () => {
    const found = countBy(producerCensus());
    console.log(`host-protection floor census, PRODUCERS: ${[...found].sort().map(([k, n]) => `${k} x${n}`).join(", ")}`);
    expect(found.size, "the census found no producer at all — it is scanning nothing").toBeGreaterThan(0);
    const problems = twoSided(found, PRODUCERS);
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("PRODUCERS: every row carries a reason, and held/binds/protected come only from their stated scopes", () => {
    const keys = PRODUCERS.map((r) => r.key);
    expect(new Set(keys).size, "duplicate PRODUCERS row").toBe(keys.length);
    for (const row of PRODUCERS) {
      expect(row.why.trim().length, `${row.key}: empty why`).toBeGreaterThan(0);
      expect(row.count, `${row.key}: count`).toBeGreaterThan(0);
      const at = row.key.lastIndexOf(":");
      const scope = row.key.slice(0, at);
      const literal = row.key.slice(at + 1);
      expect(STATE_LITERALS.has(literal), `${row.key}: not a pinned state literal`).toBe(true);
      if (literal === "held" || literal === "binds") expect(HELD_BINDS_SCOPES.has(scope), `${row.key}: held/binds outside its scopes`).toBe(true);
      if (literal === "protected" || literal === "unprotected") expect(PROTECTED_SCOPES.has(scope), `${row.key}: a verdict outside the two verdict functions`).toBe(true);
    }
  });

  it("HOST_READS: no access on an any-typed value anywhere in the file", () => {
    const { anyRefusals } = hostReadCensus();
    expect(anyRefusals, anyRefusals.join("\n")).toEqual([]);
  });

  it("HOST_READS: every host-JSON read sits in readFact, hostField or an ACCEPT predicate (or the declared config-json exception), two-sided, with counts", () => {
    const { reads } = hostReadCensus();
    const found = countBy(reads.map((r) => `${r.scope}:${r.kind}`));
    console.log(`host-protection floor census, HOST_READS: ${[...found].sort().map(([k, n]) => `${k} x${n}`).join(", ")}`);
    expect(reads.length, "the census found no host-JSON read — the type test is matching nothing").toBeGreaterThan(0);
    const outside = reads
      .filter((r) => !isReaderScope(r.scope) && !CONFIG_JSON_SCOPES.has(r.scope))
      .map((r) => `OUTSIDE THE READER ${r.scope}:${r.kind} at host-protection.ts:${r.line}`);
    expect(outside, outside.join("\n")).toEqual([]);
    const problems = twoSided(found, HOST_READS);
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("HOST_READS: no cast and no type guard gives an opaque host value an object shape (the census cannot be sidestepped by retyping)", () => {
    const refusals = shapeRefusals();
    expect(refusals, refusals.join("\n")).toEqual([]);
  });

  it("HOST_READS: every pinned row carries a reason and a class that matches its scope", () => {
    const keys = HOST_READS.map((r) => r.key);
    expect(new Set(keys).size, "duplicate HOST_READS row").toBe(keys.length);
    for (const row of HOST_READS) {
      expect(row.why.trim().length, `${row.key}: empty why`).toBeGreaterThan(0);
      const scope = row.key.slice(0, row.key.lastIndexOf(":"));
      if (row.cls === "reader") expect(isReaderScope(scope), `${row.key}: a reader row outside the reader`).toBe(true);
      else expect(CONFIG_JSON_SCOPES.has(scope), `${row.key}: a config-json row outside environmentName`).toBe(true);
    }
  });

  it("readFact is only ever called with ACCEPT.<name>, and the names used equal the ACCEPT keys, two-sided", () => {
    const { declared, used, refusals } = acceptCensus();
    console.log(`host-protection floor census, ACCEPT: ${declared.length} key(s) declared, ${used.length} readFact call(s)`);
    expect(refusals, refusals.join("\n")).toEqual([]);
    expect(declared.length, "ACCEPT declares no entry").toBeGreaterThan(0);
    expect(new Set(declared).size, "duplicate ACCEPT key").toBe(declared.length);
    const usedSet = new Set(used);
    const unused = declared.filter((k) => !usedSet.has(k)).sort();
    const undeclared = [...usedSet].filter((k) => !declared.includes(k)).sort();
    expect(unused, `ACCEPT keys no readFact call uses: ${unused.join(", ")}`).toEqual([]);
    expect(undeclared, `readFact uses names ACCEPT does not declare: ${undeclared.join(", ")}`).toEqual([]);
  });

  it("assertAcceptTable() is called at top level, after ACCEPT and the uncaughtException handler, before any gh call", () => {
    const statements = [...SF.statements];
    const callAt = statements.findIndex(
      (st) =>
        ts.isExpressionStatement(st) &&
        ts.isCallExpression(st.expression) &&
        ts.isIdentifier(st.expression.expression) &&
        st.expression.expression.text === "assertAcceptTable" &&
        st.expression.arguments.length === 0,
    );
    expect(callAt, "no top-level assertAcceptTable() call").toBeGreaterThan(-1);
    const acceptAt = statements.findIndex((st) => within(acceptDeclaration(), st));
    const handlerAt = statements.findIndex((st) => st.getText(SF).startsWith('process.on("uncaughtException"'));
    const ghAt = statements.findIndex((st) => !ts.isFunctionDeclaration(st) && containsCallOf(st, new Set(["runGh", "apiGet"])));
    expect(handlerAt, "no top-level uncaughtException handler").toBeGreaterThan(-1);
    expect(acceptAt, "ACCEPT is not a top-level declaration").toBeGreaterThan(-1);
    expect(ghAt, "no top-level statement calls gh — the ordering check would be vacuous").toBeGreaterThan(-1);
    expect(handlerAt).toBeLessThan(callAt);
    expect(acceptAt).toBeLessThan(callAt);
    expect(callAt).toBeLessThan(ghAt);
  });
});
