// fault-inject.test-support.ts — the ONE fault-injection harness of this tree (phase 37, plan 37-20, D-17,
// 37-GAP-PLANNING-BRIEF.md EXIT-1 and READ-1).
//
// WHAT IT IS. A test harness that makes one call inside a committed runnable fail, from OUTSIDE the program: it
// writes a generic ES-module preload into a scratch directory and runs the program under test with
// `node --import <preload>`. The preload patches node:fs (or process.stdout.write) before the program loads, so
// the fault reaches the program exactly as a real one would, through the same import the program already makes.
//
// NO SHIPPED PROGRAM READS ITS SWITCHES. The two environment names below, GRUGOPS_FAULT_SPEC and
// GRUGOPS_FAULT_LOG, are read only by the generated preload. A runnable that read them would be a test hook in a
// shipped file, which plan 37-20 forbids; scripts/runnable-ref/runnable-exit-contract.test.ts asserts that none of
// the three phase-37 runnables names either.
//
// NOT EMITTED. tsconfig.json excludes `**/*.test-support.ts` from emit and tsconfig.tests.json type-checks it, so
// no host ever receives this file.
//
// WHAT A FAULT MATCHES. An `fs` fault names one node:fs function, a SITE (a script URL and a line) and optionally
// a VIA frame. The wrapper captures a stack with Error.stackTraceLimit raised to Infinity for that one capture
// (restored at once, so the program keeps its own limit) and throws an Error carrying `code` only when the stack
// holds `<site.url>:<site.line>:` and, when `via` is set, also `<via.url>:<via.line>:`. existsSync returns false
// instead of throwing. Every other call goes to the original. At exit the preload logs how many calls matched the
// site but not the via, so a row that fired no fault says which half of the match failed: a harness mismatch to
// fix, never a reason to call the site unreached. syncBuiltinESMExports() makes a namespace call
// (`nodeFs.readdirSync`) and a named-import call (`readdirSync`) both reach the wrapper.
//
// BOUNDED. Every run has a 30 s timeout, and treeDigest never opens anything that is not a regular file (DC-3).
//
// WHERE THE READ SITES COME FROM (plan 37-25, D-17, READ-1). deriveReadSites parses a committed .js with the
// TypeScript compiler (createSourceFile only: no program, no type checker) and returns every call whose callee
// resolves through the file's OWN node:fs import bindings to a member of FS_READ_FNS: a namespace member
// (`nodeFs.readdirSync`) or a named import (`readdirSync`, an alias resolved to its imported name). A site's line
// is the line of the callee's name token, which is where V8 reports the frame. callingSites says through which
// call expressions control enters a function, so a shared reader can be failed under every caller (the `via`
// half of a fault). Both refuse, by throwing with the file and line, any shape they cannot account for: a
// namespace used as a value, a read function used as a value, or a function reference that is neither a call nor
// a call argument. A new indirection therefore fails red until the derivation handles it, and is never dropped.
// The compiler is a dev dependency; this module is never emitted, so no host ever loads it.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

/** The node:fs functions READ-1 treats as reads. Plans 37-25 and 37-26 import this list. */
export const FS_READ_FNS = Object.freeze([
  "readdirSync",
  "openSync",
  "readFileSync",
  "lstatSync",
  "realpathSync",
  "statSync",
  "existsSync",
  "fstatSync",
  "readSync",
  "accessSync",
] as const);

/** One node:fs read function. */
export type FsReadFn = (typeof FS_READ_FNS)[number];

/**
 * The node:fs names the three state runnables use that are not reads (plan 37-25). Every node:fs name a runnable
 * uses is in FS_READ_FNS or here, and every name here is used by at least one runnable: read-sites.test.ts holds
 * both directions, so a new read function cannot sit outside the read table.
 */
export const FS_OTHER_FNS = Object.freeze([
  "closeSync", // releases a descriptor
  "constants", // flag values
  "mkdirSync", // creates
  "renameSync", // moves
  "rmdirSync", // removes
  "unlinkSync", // removes
  "writeFileSync", // writes
] as const);

/** One read call of a program: its node:fs function, its line, its enclosing function and its stable key. */
export interface ReadSite {
  /** `<enclosing>:<fn>#<ordinal>`, the ordinal counted among the same enclosing and fn in source order. */
  readonly key: string;
  readonly fn: FsReadFn;
  /** The 1-based line of the callee's name token, where V8 reports the frame. */
  readonly line: number;
  /** The nearest named function, `<object variable>.<property>`, `<Class>.<method>`, or `<top>`. */
  readonly enclosing: string;
}

/** One call expression through which control enters a function. */
export interface CallingSite {
  /** The enclosing name of the call, by the rule ReadSite.enclosing uses. */
  readonly scope: string;
  /** The 1-based line V8 reports for the frame of `scope` while the function runs. */
  readonly line: number;
  /** `direct`: the call's callee names the function; `passed`: the function is an argument value of the call. */
  readonly kind: "direct" | "passed";
}

/** The parsed program text of a .js file, for the derivations below. */
function parseJs(jsPath: string): ts.SourceFile {
  return ts.createSourceFile(jsPath, readFileSync(jsPath, "utf8"), ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
}

/** The 1-based line of a node's first token. */
function lineOf(sf: ts.SourceFile, node: ts.Node): number {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

/** A derivation refusal: the file, the line and the shape it cannot account for. */
function refuse(what: string, sf: ts.SourceFile, node: ts.Node, shape: string): never {
  throw new Error(`${what}: ${sf.fileName}:${lineOf(sf, node)}: ${shape}; add the shape to the derivation`);
}

/** The text of a property or method name, or null for a computed one. */
function nameText(name: ts.PropertyName): string | null {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isPrivateIdentifier(name) ? name.text : null;
}

/** The name of the variable an object literal is bound to, or null. */
function objectVariable(obj: ts.ObjectLiteralExpression): string | null {
  const q = obj.parent;
  return ts.isVariableDeclaration(q) && q.initializer === obj && ts.isIdentifier(q.name) ? q.name.text : null;
}

/** The name an arrow or function expression is bound to, or null when it is not bound (an argument value). */
function boundName(fn: ts.ArrowFunction | ts.FunctionExpression): string | null {
  if (ts.isFunctionExpression(fn) && fn.name !== undefined) return fn.name.text;
  const q = fn.parent;
  if (ts.isVariableDeclaration(q) && q.initializer === fn && ts.isIdentifier(q.name)) return q.name.text;
  if (ts.isPropertyAssignment(q) && q.initializer === fn && ts.isObjectLiteralExpression(q.parent)) {
    const holder = objectVariable(q.parent);
    const prop = nameText(q.name);
    if (holder !== null && prop !== null) return `${holder}.${prop}`;
  }
  return null;
}

/** The name of a method or constructor: `<object variable>.<name>` or `<Class>.<name>`, or null. */
function methodName(m: ts.MethodDeclaration | ts.ConstructorDeclaration): string | null {
  const own = ts.isConstructorDeclaration(m) ? "constructor" : nameText(m.name);
  if (own === null) return null;
  const holder = ts.isClassLike(m.parent)
    ? (m.parent.name?.text ?? null)
    : ts.isObjectLiteralExpression(m.parent)
      ? objectVariable(m.parent)
      : null;
  return holder === null ? null : `${holder}.${own}`;
}

/**
 * The enclosing name of `node`: the nearest named function declaration, the name an arrow or function expression
 * is bound to, `<object variable>.<property>` for a function in an object literal, `<Class>.<method>`, or `<top>`.
 * An unbound arrow (an argument value such as a `.map` callback) is passed through to the scope around it.
 */
export function enclosingName(node: ts.Node): string {
  for (let p = node.parent; p !== undefined; p = p.parent) {
    if (ts.isFunctionDeclaration(p) && p.name !== undefined) return p.name.text;
    if (ts.isArrowFunction(p) || ts.isFunctionExpression(p)) {
      const bound = boundName(p);
      if (bound !== null) return bound;
    }
    if (ts.isMethodDeclaration(p) || ts.isConstructorDeclaration(p)) {
      const m = methodName(p);
      if (m !== null) return m;
    }
  }
  return "<top>";
}

/** A file's node:fs import bindings: namespace local names, and named locals mapped to their imported names. */
interface FsBindings {
  readonly namespaces: ReadonlySet<string>;
  readonly named: ReadonlyMap<string, string>;
}

/** The node:fs import bindings of `sf`; a promises import or a require/dynamic import of node:fs is refused. */
function fsBindings(sf: ts.SourceFile): FsBindings {
  const namespaces = new Set<string>();
  const named = new Map<string, string>();
  const isFs = (s: string): boolean => s === "node:fs" || s === "fs";
  const isFsPromises = (s: string): boolean => s === "node:fs/promises" || s === "fs/promises";
  const visit = (n: ts.Node): void => {
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      const spec = n.moduleSpecifier.text;
      if (isFsPromises(spec)) refuse("fsBindings", sf, n, `an import of ${spec}`);
      if (isFs(spec) && n.importClause !== undefined) {
        const c = n.importClause;
        if (c.name !== undefined) namespaces.add(c.name.text);
        const b = c.namedBindings;
        if (b !== undefined && ts.isNamespaceImport(b)) namespaces.add(b.name.text);
        if (b !== undefined && ts.isNamedImports(b)) {
          for (const e of b.elements) named.set(e.name.text, (e.propertyName ?? e.name).text);
        }
      }
    }
    if (ts.isCallExpression(n) && n.arguments.length > 0) {
      const a = n.arguments[0] as ts.Expression;
      const callee = n.expression;
      const loads =
        callee.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(callee) && callee.text === "require");
      if (loads && ts.isStringLiteral(a) && (isFs(a.text) || isFsPromises(a.text))) {
        refuse("fsBindings", sf, n, `a ${ts.isIdentifier(callee) ? "require" : "dynamic import"} of ${a.text}`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { namespaces, named };
}

/** True when `id` is the callee of the call expression around it. */
function isCallee(id: ts.Node): boolean {
  return ts.isCallExpression(id.parent) && id.parent.expression === id;
}

/**
 * Every node:fs use of `sf`, as [imported name, the node that names it, whether it is a callee]. A namespace
 * binding used other than as `<ns>.<member>`, or as `<ns>[...]`, is refused: a read could escape the derivation.
 */
function fsUses(sf: ts.SourceFile): { name: string; node: ts.Node; called: boolean }[] {
  const { namespaces, named } = fsBindings(sf);
  const out: { name: string; node: ts.Node; called: boolean }[] = [];
  const inImport = (n: ts.Node): boolean => {
    for (let p: ts.Node | undefined = n; p !== undefined; p = p.parent) if (ts.isImportDeclaration(p)) return true;
    return false;
  };
  const visit = (n: ts.Node): void => {
    if (ts.isIdentifier(n) && !inImport(n)) {
      const p = n.parent;
      const isMemberName = ts.isPropertyAccessExpression(p) && p.name === n;
      const isKey = (ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p) || ts.isPropertyDeclaration(p)) && p.name === n;
      if (namespaces.has(n.text) && !isMemberName && !isKey) {
        if (!ts.isPropertyAccessExpression(p) || p.expression !== n) {
          refuse("deriveReadSites", sf, n, `the node:fs namespace ${n.text} is used as a value (${ts.SyntaxKind[p.kind]})`);
        }
        out.push({ name: p.name.text, node: p.name, called: isCallee(p) });
      } else if (named.has(n.text) && !isMemberName && !isKey) {
        out.push({ name: named.get(n.text) as string, node: n, called: isCallee(n) });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

/** True when `name` is one of FS_READ_FNS. */
function isReadFn(name: string): name is FsReadFn {
  return (FS_READ_FNS as readonly string[]).includes(name);
}

/**
 * Every read site of the .js at `jsPath`: one per call whose callee resolves through the file's own node:fs
 * import bindings to a member of FS_READ_FNS, in source order. A read function used other than as a callee (passed,
 * stored) is refused by line, because a call through that value would be a site the derivation cannot see.
 */
export function deriveReadSites(jsPath: string): readonly ReadSite[] {
  const sf = parseJs(jsPath);
  const ordinals = new Map<string, number>();
  const sites: ReadSite[] = [];
  for (const use of fsUses(sf)) {
    if (!isReadFn(use.name)) continue;
    if (!use.called) refuse("deriveReadSites", sf, use.node, `the read function ${use.name} is used as a value`);
    const enclosing = enclosingName(use.node);
    const stem = `${enclosing}:${use.name}`;
    const ordinal = ordinals.get(stem) ?? 0;
    ordinals.set(stem, ordinal + 1);
    sites.push({ key: `${stem}#${ordinal}`, fn: use.name, line: lineOf(sf, use.node), enclosing });
  }
  return sites;
}

/** Every node:fs name the .js at `jsPath` uses (imported or referenced), sorted, each once. */
export function classifiedFsCalls(jsPath: string): readonly string[] {
  const sf = parseJs(jsPath);
  const { named } = fsBindings(sf);
  const names = new Set<string>([...named.values(), ...fsUses(sf).map((u) => u.name)]);
  return [...names].sort();
}

/** The line V8 reports for the frame of the scope that runs `call`: the line of its callee's name token. */
function calleeNameLine(sf: ts.SourceFile, call: ts.CallExpression): number {
  const c = call.expression;
  if (ts.isIdentifier(c)) return lineOf(sf, c);
  if (ts.isPropertyAccessExpression(c)) return lineOf(sf, c.name);
  return refuse("callingSites", sf, call, `a call whose callee is a ${ts.SyntaxKind[c.kind]}`);
}

/** The call expression `obj` is an argument value of, or null. */
function callTakingArgument(obj: ts.Node): ts.CallExpression | null {
  const p = obj.parent;
  return ts.isCallExpression(p) && p.arguments.some((a) => a === obj) ? p : null;
}

/**
 * Every call expression through which control enters the function `name` in the .js at `jsPath`, in source order.
 * `direct`: the call's callee is the identifier `name`, or a property access whose name is `name` (an `io.readText`
 * call into a function handed on as an object property); `line` is the line of that callee's name token. `passed`:
 * `name` is an argument value of a call, directly or as a property (shorthand or not) of an object literal argument;
 * `line` is the line of that outer call's callee name token. The function's own declaration and its self-calls are
 * not entries. Any other reference to `name` (stored, assigned, returned, exported), a property read of a member
 * called `name` that is not a call, or a second declaration of `name`, throws naming the file and the line.
 */
export function callingSites(jsPath: string, name: string): readonly CallingSite[] {
  const sf = parseJs(jsPath);
  const declarations: (ts.FunctionDeclaration | ts.VariableDeclaration)[] = [];
  const visitDecl = (n: ts.Node): void => {
    if (ts.isFunctionDeclaration(n) && n.name?.text === name) declarations.push(n);
    if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.name.text === name &&
      n.initializer !== undefined &&
      (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))
    ) {
      declarations.push(n);
    }
    ts.forEachChild(n, visitDecl);
  };
  visitDecl(sf);
  if (declarations.length !== 1) {
    throw new Error(
      `callingSites: ${jsPath}: ${name} has ${declarations.length} function declaration(s)` +
        `${declarations.length === 0 ? "" : ` (lines ${declarations.map((d) => lineOf(sf, d)).join(", ")})`}; ` +
        "it must have exactly one",
    );
  }
  const decl = declarations[0] as ts.FunctionDeclaration | ts.VariableDeclaration;
  const declName = decl.name as ts.Identifier;
  const body = ts.isFunctionDeclaration(decl) ? decl.body : (decl.initializer as ts.ArrowFunction | ts.FunctionExpression).body;
  const insideOwnBody = (n: ts.Node): boolean =>
    body !== undefined && n.getStart(sf) >= body.getStart(sf) && n.getEnd() <= body.getEnd();
  const out: CallingSite[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isIdentifier(n) && n.text === name && n !== declName) {
      const p = n.parent;
      if (ts.isPropertyAccessExpression(p) && p.name === n) {
        if (!isCallee(p)) refuse("callingSites", sf, n, `a property read of a member named ${name} that is not a call`);
        out.push({ scope: enclosingName(p), line: lineOf(sf, n), kind: "direct" });
      } else if ((ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p)) && p.name === n) {
        // A property key, not a reference to the binding.
      } else if (isCallee(n)) {
        if (!insideOwnBody(n)) out.push({ scope: enclosingName(n), line: lineOf(sf, n), kind: "direct" });
      } else {
        const call =
          callTakingArgument(n) ??
          ((ts.isShorthandPropertyAssignment(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.initializer === n)
            ? ts.isObjectLiteralExpression(p.parent)
              ? callTakingArgument(p.parent)
              : null
            : null);
        if (call === null) refuse("callingSites", sf, n, `${name} is referenced as a ${ts.SyntaxKind[p.kind]}, not a call or a call argument`);
        out.push({ scope: enclosingName(call), line: calleeNameLine(sf, call), kind: "passed" });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

/** A frame position: the script's file URL (as V8 prints it) and a 1-based line. */
export interface FrameSite {
  readonly url: string;
  readonly line: number;
}

/** What the preload injects: a throwing stdout write, or one failing node:fs call at one site. */
export type FaultSpec =
  | { readonly kind: "stdout-throw" }
  | { readonly kind: "fs"; readonly fn: FsReadFn; readonly site: FrameSite; readonly via?: FrameSite; readonly code: string };

/** The environment name the preload reads its spec from (JSON). Never read by a shipped program. */
export const FAULT_SPEC_ENV = "GRUGOPS_FAULT_SPEC";
/** The environment name of the file the preload appends its log lines to. Never read by a shipped program. */
export const FAULT_LOG_ENV = "GRUGOPS_FAULT_LOG";

/** The message of the injected stdout failure, for assertions. */
export const INJECTED_STDOUT_MESSAGE = "injected stdout failure";

const PRELOAD_SOURCE = `// fault-preload.mjs — generated by scripts/fault-inject.test-support.ts. Test-only; never shipped.
import { createRequire, syncBuiltinESMExports } from "node:module";
const require = createRequire(import.meta.url);
const fs = require("node:fs");
const appendLog = fs.appendFileSync.bind(fs);
const specText = process.env.${FAULT_SPEC_ENV};
const logPath = process.env.${FAULT_LOG_ENV};
let logging = false;
function log(line) {
  if (!logPath) return;
  logging = true;
  try {
    appendLog(logPath, line + "\\n");
  } finally {
    logging = false;
  }
}
const spec = specText ? JSON.parse(specText) : null;
if (spec !== null && spec.kind === "stdout-throw") {
  process.stdout.write = function injectedStdoutWrite() {
    log("fired stdout-throw");
    throw new Error(${JSON.stringify(INJECTED_STDOUT_MESSAGE)});
  };
} else if (spec !== null && spec.kind === "fs") {
  const original = fs[spec.fn];
  if (typeof original !== "function") throw new Error("fault-preload: node:fs has no function " + spec.fn);
  const siteKey = spec.site.url + ":" + spec.site.line + ":";
  const viaKey = spec.via ? spec.via.url + ":" + spec.via.line + ":" : null;
  let siteNotVia = 0;
  const wrapper = function (...args) {
    if (logging) return original.apply(this, args);
    const previous = Error.stackTraceLimit;
    let stack = "";
    try {
      Error.stackTraceLimit = Infinity;
      stack = new Error().stack ?? "";
    } finally {
      Error.stackTraceLimit = previous;
    }
    if (stack.includes(siteKey)) {
      if (viaKey === null || stack.includes(viaKey)) {
        log("fired " + spec.fn + " " + spec.code);
        if (spec.fn === "existsSync") return false;
        const err = new Error(spec.code + ": injected fault, " + spec.fn);
        err.code = spec.code;
        err.syscall = spec.fn;
        throw err;
      }
      siteNotVia += 1;
    }
    return original.apply(this, args);
  };
  Object.assign(wrapper, original);
  fs[spec.fn] = wrapper;
  syncBuiltinESMExports();
  process.on("exit", () => log("summary site-not-via " + siteNotVia));
}
`;

/** Write the one generic preload into `dir` (a scratch directory) and return its file URL. */
export function writeFaultPreload(dir: string): string {
  const at = join(dir, "fault-preload.mjs");
  writeFileSync(at, PRELOAD_SOURCE, "utf8");
  return pathToFileURL(at).href;
}

/** The file URL V8 prints in a stack frame for the script at `path` (its real path: /var vs /private/var). */
export function scriptUrl(path: string): string {
  return pathToFileURL(realpathSync(path)).href;
}

/** What one faulted run reports. */
export interface FaultedRun {
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
  /** How many faults the preload fired. */
  readonly fired: number;
  /** How many calls of the named function matched the site but not the via (fs faults only). */
  readonly siteNotVia: number;
}

/**
 * Run `node --import <preload> <js> ...args` with `spec` injected. `opts.scratch` is an mkdtempSync directory
 * that holds the preload and a per-run log; `opts.cwd` defaults to it.
 */
export function runFaulted(
  js: string,
  args: readonly string[],
  spec: FaultSpec,
  opts: { readonly scratch: string; readonly cwd?: string },
): FaultedRun {
  const preload = writeFaultPreload(opts.scratch);
  const logDir = mkdtempSync(join(opts.scratch, "fault-log-"));
  const logPath = join(logDir, "fault.log");
  writeFileSync(logPath, "", "utf8");
  const r = spawnSync(process.execPath, ["--import", preload, js, ...args], {
    encoding: "utf8",
    cwd: opts.cwd ?? opts.scratch,
    timeout: 30_000,
    env: { ...process.env, [FAULT_SPEC_ENV]: JSON.stringify(spec), [FAULT_LOG_ENV]: logPath },
  });
  const lines = readFileSync(logPath, "utf8").split("\n").filter((l) => l !== "");
  const summary = lines.find((l) => l.startsWith("summary site-not-via "));
  return {
    status: r.status,
    signal: r.signal,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    fired: lines.filter((l) => l.startsWith("fired ")).length,
    siteNotVia: summary === undefined ? 0 : Number(summary.slice("summary site-not-via ".length)),
  };
}

/**
 * Every entry under `root`, by repository-relative path with `/` separators, sorted by code units: `dir`,
 * `link:<target>`, `file:<size>:<sha256>` or `other`. It uses lstat only and opens nothing but a regular file,
 * so a FIFO is never opened (DC-3) and a link is never followed.
 */
export function treeDigest(root: string): ReadonlyMap<string, string> {
  const entries: [string, string][] = [];
  const walk = (dir: string, rel: string): void => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const r = rel === "" ? name : `${rel}/${name}`;
      const st = lstatSync(abs);
      if (st.isDirectory()) {
        entries.push([r, "dir"]);
        walk(abs, r);
      } else if (st.isSymbolicLink()) {
        entries.push([r, `link:${readlinkSync(abs)}`]);
      } else if (st.isFile()) {
        entries.push([r, `file:${st.size}:${createHash("sha256").update(readFileSync(abs)).digest("hex")}`]);
      } else {
        entries.push([r, "other"]);
      }
    }
  };
  walk(root, "");
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return new Map(entries);
}

/** A V8 stack frame line, as Node prints an uncaught throw. */
const V8_FRAME = /^\s+at .+:\d+:\d+\)?$/m;

/** True when any line of `stderr` is a V8 stack frame: the program let a throw reach Node. */
export function hasNodeStack(stderr: string): boolean {
  return V8_FRAME.test(stderr);
}
