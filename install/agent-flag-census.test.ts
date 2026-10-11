// agent-flag-census.test.ts — every spawn of install.js in the tree names its agents (phase 34.1, D-01).
//
// WHY. Plan 34.1-06 makes an unattended install with no agent flag, into a target with no install record and no
// detected host, refuse (D-03). Before that refusal lands, every caller of install.js in the tests and in the product
// scripts must name the agents it installs (research Pitfall 2). This census holds that over the syntax tree of every
// tracked TypeScript module directly under install/ and scripts/, so a new spawn that names no agent fails here,
// named by file:line, instead of turning red later as an unexplained refusal.
//
// WHAT A SPAWN SITE IS. Two shapes, found by the TypeScript parser, never by a line regex:
//   A. an array literal that holds the installer path as an element (an identifier named INSTALL_JS or INSTALLER
//      anywhere inside the element, or an element whose text ends with `install.js` but not `uninstall.js`), when the
//      array is an argument of a spawning call (SPAWNERS) or is an argv vector (the installer element follows a
//      `"node"` literal or `process.execPath`). Its arguments are the array's other elements.
//   B. a call to a spawning function that passes INSTALL_JS or INSTALLER directly (spawnBin(INSTALL_JS, args, ...)).
//      Its arguments are the call's next argument.
// A WRAPPER IS THE INSTALLER TOO (plan 34.1-06). A test that pins the clock writes a small module that imports
// install.js (`writeFileSync(wrapper, … pathToFileURL(INSTALL_JS) …)`) and spawns that module: install.js then reads
// the wrapper's own argv. So an identifier passed as the destination of a writeFileSync call whose content names
// INSTALL_JS or INSTALLER counts, in that module, as naming the installer in shape A. Three such spawns in
// install/install.test.ts named no agent and were outside the census until D-03's refusal turned one red.
// A site PASSES when its arguments name the agents: they contain a withAgentFlags call, ALL_AGENT_FLAGS, a reference
// to agentFlag (the one spelling, install/host-tools.ts), a string literal equal to agentFlag of a registry row, or a
// MODE_FLAGS literal (a mode that writes no agent's files and takes no agent flag, D-25). A site that deliberately
// exits at argument parsing carries the line comment `agent-flag-census: <reason>` directly above it; those are
// counted and the count is pinned two-sided, so each new exemption is argued in the commit that adds it.
//
// THE FLOOR. The site count is printed and must be at least SITE_FLOOR, the count measured when this census landed,
// so the census can never pass by matching nothing. Later plans may add sites freely; they raise the count, not the
// floor.
//
// Clear professional voice: this is test infrastructure for an installer safety surface.

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { HOST_TOOLS, HOST_TOOL_COUNT, agentFlag } from "./host-tools.js";
import { ALL_AGENT_FLAGS, MODE_FLAGS, withAgentFlags } from "./installer-paths.test-support.js";

const REPO_ROOT = resolve(import.meta.dirname, "..");

/** The functions that start a process. `spawnBin` is the test support's one wrapper over spawnSync. */
const SPAWNERS: ReadonlySet<string> = new Set(["spawn", "spawnSync", "execFile", "execFileSync", "fork", "spawnBin"]);
/** The identifiers the tree uses for the installer path. */
const INSTALLER_NAMES: ReadonlySet<string> = new Set(["INSTALL_JS", "INSTALLER"]);
/** The identifiers that name agents in an argument list. */
const AGENT_NAMERS: ReadonlySet<string> = new Set(["withAgentFlags", "ALL_AGENT_FLAGS", "agentFlag"]);
const AGENT_FLAGS: ReadonlySet<string> = new Set(HOST_TOOLS.map(agentFlag));
const MODE_FLAG_SET: ReadonlySet<string> = new Set(MODE_FLAGS);
const EXEMPT_MARK = "agent-flag-census:";

/**
 * Measured 2026-10-11 (plan 34.1-05) when the census landed: 64 spawn sites. A floor, not a pin: the census can never
 * pass by matching nothing, and later plans add sites freely.
 */
const SITE_FLOOR = 64;
/**
 * The sites that name no agent on purpose, pinned two-sided. Three exit at argument parsing (plan 34.1-05):
 *   - install/install.test.ts, unknown-arg D-12 contract: `--bad-arg-xyz` exits 2 before any selection
 *   - install/install.test.ts, unknown-arg Phase-17 case: `--yes --bad-arg-xyz` exits 2 the same way
 *   - install/record-truth.test.ts, L4: `--target` with no value exits 2 in both binaries
 * One more since plan 34.1-06 (D-03): install/install.test.ts runUnattended, the one spawn the "agent selection (D-03)"
 * cases run with no agent flag, because the flag-less unattended chain (recorded, detected, refuse) is what they test.
 */
const EXEMPT_COUNT = 4;

/** Every tracked TypeScript module directly under install/ or scripts/ (no declaration files), from git. */
function modules(): string[] {
  const listed = execFileSync("git", ["ls-files", "--", "install", "scripts"], { cwd: REPO_ROOT, encoding: "utf8" });
  return listed
    .split("\n")
    .filter((f) => /^(install|scripts)\/[^/]+\.ts$/.test(f) && !f.endsWith(".d.ts"))
    .sort();
}

function descendants(node: ts.Node): ts.Node[] {
  const out: ts.Node[] = [];
  const visit = (n: ts.Node): void => {
    out.push(n);
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}

function namesInstaller(e: ts.Node, wrappers: ReadonlySet<string>): boolean {
  if (ts.isIdentifier(e) && wrappers.has(e.text)) return true;
  if (descendants(e).some((n) => ts.isIdentifier(n) && INSTALLER_NAMES.has(n.text))) return true;
  const text = e.getText().replace(/[)"'`\s]+$/, "");
  return text.endsWith("install.js") && !text.endsWith("uninstall.js");
}

function calleeName(call: ts.CallExpression): string {
  const c = call.expression;
  if (ts.isIdentifier(c)) return c.text;
  if (ts.isPropertyAccessExpression(c)) return c.name.text;
  return "";
}

function namesAgents(args: readonly ts.Node[]): boolean {
  for (const a of args) {
    for (const n of descendants(a)) {
      if (ts.isIdentifier(n) && AGENT_NAMERS.has(n.text)) return true;
      if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && (AGENT_FLAGS.has(n.text) || MODE_FLAG_SET.has(n.text))) {
        return true;
      }
    }
  }
  return false;
}

function isArgvLead(e: ts.Expression | undefined): boolean {
  if (e === undefined) return false;
  if (ts.isStringLiteral(e) && e.text === "node") return true;
  return e.getText() === "process.execPath";
}

interface Site {
  readonly where: string;
  readonly verdict: "names-agents" | "exempt" | "unnamed";
}

/** Every spawn site in one module, with its verdict. */
function sitesIn(rel: string, text: string): Site[] {
  const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const lines = text.split("\n");
  const out: Site[] = [];
  // The wrapper modules this module writes: the destination identifier of a writeFileSync whose content names the
  // installer (see A WRAPPER IS THE INSTALLER TOO above).
  const wrappers = new Set<string>();
  for (const node of descendants(sf)) {
    if (!ts.isCallExpression(node) || calleeName(node) !== "writeFileSync" || node.arguments.length < 2) continue;
    const [dest, content] = node.arguments;
    if (ts.isIdentifier(dest) && descendants(content).some((n) => ts.isIdentifier(n) && INSTALLER_NAMES.has(n.text))) wrappers.add(dest.text);
  }
  const record = (at: ts.Node, args: readonly ts.Node[]): void => {
    const line = sf.getLineAndCharacterOfPosition(at.getStart(sf)).line; // 0-based
    const above = line > 0 ? lines[line - 1] : "";
    const mark = above.indexOf(EXEMPT_MARK);
    const exempt = /^\s*\/\//.test(above) && mark !== -1 && above.slice(mark + EXEMPT_MARK.length).trim().length > 0;
    out.push({
      where: `${rel}:${line + 1}`,
      verdict: namesAgents(args) ? "names-agents" : exempt ? "exempt" : "unnamed",
    });
  };
  for (const node of descendants(sf)) {
    // Shape A: an argv array holding the installer path.
    if (ts.isArrayLiteralExpression(node)) {
      const els = node.elements;
      const at = els.findIndex((e) => !ts.isSpreadElement(e) && namesInstaller(e, wrappers));
      if (at === -1) continue;
      const parent = node.parent;
      const spawnArg = ts.isCallExpression(parent) && SPAWNERS.has(calleeName(parent)) && parent.arguments.includes(node);
      if (!spawnArg && !isArgvLead(els[at - 1])) continue;
      record(node, els.filter((_, i) => i !== at));
      continue;
    }
    // Shape B: a spawning call that passes the installer path directly; its arguments are the next argument.
    if (ts.isCallExpression(node) && SPAWNERS.has(calleeName(node))) {
      const at = node.arguments.findIndex((a) => ts.isIdentifier(a) && INSTALLER_NAMES.has(a.text));
      if (at === -1) continue;
      const next = node.arguments[at + 1];
      record(node, next === undefined ? [] : [next]);
    }
  }
  return out;
}

describe("agent-flag census: every spawn of install.js names its agents (phase 34.1, D-01)", () => {
  const MODULES = modules();
  const SITES = MODULES.flatMap((rel) => sitesIn(rel, readFileSync(join(REPO_ROOT, rel), "utf8")));

  it("the module list is derived from git and is not empty", () => {
    expect(MODULES.length).toBeGreaterThan(0);
    expect(MODULES).toContain("install/install.test.ts");
    expect(MODULES).toContain("install/installer-paths.test-support.ts");
  });

  it("every spawn site names its agents, or carries an argued agent-flag-census exemption", () => {
    const unnamed = SITES.filter((s) => s.verdict === "unnamed").map((s) => s.where);
    console.log(
      `agent-flag census: ${SITES.length} spawn sites in ${MODULES.length} modules ` +
        `(${SITES.filter((s) => s.verdict === "names-agents").length} name agents, ` +
        `${SITES.filter((s) => s.verdict === "exempt").length} exempt)`,
    );
    expect(unnamed, "these install.js spawns name no agent: route them through withAgentFlags or pass an agent flag").toEqual([]);
  });

  it(`the site count is at least the floor measured when the census landed (${SITE_FLOOR})`, () => {
    expect(SITES.length).toBeGreaterThanOrEqual(SITE_FLOOR);
  });

  it(`the exemptions are exactly ${EXEMPT_COUNT}, each argued in the commit that adds it`, () => {
    const exempt = SITES.filter((s) => s.verdict === "exempt").map((s) => s.where);
    expect(`exempt sites: ${exempt.length} ${JSON.stringify(exempt)}`).toBe(`exempt sites: ${EXEMPT_COUNT} ${JSON.stringify(exempt)}`);
  });

  // The census's own premise: a site with no agent flag is found and named, a site through withAgentFlags passes, and
  // an argued comment exempts. Without this, a parser change that matched nothing would leave every case above green.
  it("premise: the census finds an unnamed site (directly or through a wrapper module), passes a named one, and honours an argued exemption", () => {
    const probe = [
      'spawnSync("node", [INSTALL_JS, "--yes"], {});',
      'spawnSync("node", [INSTALL_JS, "--yes", ...withAgentFlags(args)], {});',
      "spawnBin(INSTALL_JS, [\"--yes\"], t, h);",
      "spawnBin(INSTALL_JS, [\"--check\"], t, h);",
      "// agent-flag-census: exits at argument parsing",
      'spawnSync(process.execPath, [INSTALL_JS, "--bad"]);',
      'spawnSync("node", [UNINSTALL_JS, "--yes"]);',
      'const x = ["install.js", INSTALL_JS];',
      "writeFileSync(wrapper, `await import(${JSON.stringify(pathToFileURL(INSTALL_JS).href)});`);",
      'spawnSync("node", [wrapper, "--yes"], {});',
      'spawnSync("node", [wrapper, "--yes", ...withAgentFlags(args)], {});',
    ].join("\n");
    const got = sitesIn("probe.ts", probe).map((s) => `${s.where} ${s.verdict}`);
    expect(got).toEqual([
      "probe.ts:1 unnamed",
      "probe.ts:2 names-agents",
      "probe.ts:3 unnamed",
      "probe.ts:4 names-agents",
      "probe.ts:6 exempt",
      "probe.ts:10 unnamed",
      "probe.ts:11 names-agents",
    ]);
  });

  it("ALL_AGENT_FLAGS is the registry's flag set, and withAgentFlags adds it only when no agent or mode is named", () => {
    expect(ALL_AGENT_FLAGS).toEqual(HOST_TOOLS.map(agentFlag));
    expect(ALL_AGENT_FLAGS).toHaveLength(HOST_TOOL_COUNT);
    expect(withAgentFlags([])).toEqual([...ALL_AGENT_FLAGS]);
    expect(withAgentFlags(["--symlink"])).toEqual([...ALL_AGENT_FLAGS, "--symlink"]);
    for (const mode of MODE_FLAGS) expect(withAgentFlags([mode])).toEqual([mode]);
    const one = agentFlag(HOST_TOOLS[0]);
    expect(withAgentFlags([one, "--symlink"])).toEqual([one, "--symlink"]);
  });
});

// ── the product scripts (D-01) ─────────────────────────────────────────────────────────────────────────────
// The two product scripts that run a scratch install exercise the Claude Code adapters, so each passes one agent flag.
// They spell it as a literal and do not import install/host-tools.js; this case binds that literal to the registry:
// it must equal agentFlag of the one row whose adapter is `claude-kit`. A renamed id turns this red.
const PRODUCT_SCRIPTS: readonly string[] = ["scripts/coordinator-resolution-precheck.ts", "scripts/capture-live.ts"];

describe("agent-flag census: the product scripts' installer flag is the registry's claude-kit flag (D-01)", () => {
  const claudeRows = HOST_TOOLS.filter((h) => h.adapter === "claude-kit");

  it("exactly one registry row lays down the claude-kit adapter", () => {
    expect(claudeRows.map((h) => h.id)).toHaveLength(1);
  });

  for (const rel of PRODUCT_SCRIPTS) {
    it(`${rel}: its one installer spawn passes agentFlag of the claude-kit row and no other agent flag`, () => {
      const text = readFileSync(join(REPO_ROOT, rel), "utf8");
      const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      const spawns = descendants(sf).filter(
        (n): n is ts.ArrayLiteralExpression =>
          ts.isArrayLiteralExpression(n) && n.elements.some((e) => ts.isIdentifier(e) && e.text === "INSTALLER"),
      );
      expect(spawns, `${rel}: installer spawns`).toHaveLength(1);
      const literals = spawns[0].elements.filter(ts.isStringLiteral).map((e) => e.text);
      // Every literal that is not one of the script's two mode-free arguments is an agent flag.
      const flags = literals.filter((l) => l !== "--target" && l !== "--yes");
      expect(flags).toEqual([agentFlag(claudeRows[0])]);
      expect(literals).toContain("--claude");
    });
  }
});

// ── the flag-collision census (research Pitfall 6) ──────────────────────────────────────────────────────────
// An agent flag is `--` + a registry id. A row whose id equalled a flag either binary already parses (`check`,
// `update`, `target`, ...) would never reach hostForFlag: the earlier arm would take it, and the agent could not be
// named. The parsed flags are read from the argument loops by the syntax tree, not typed here: every string literal
// the loop variable is compared with (`a === "--check"`) or tested as a prefix of (`a.startsWith("--target=")`).
const ARG_LOOP_MODULES: readonly string[] = ["install/install.ts", "install/uninstall.ts"];

/** The flags one binary's argument loop parses, leading dashes and a trailing `=` stripped. */
function parsedFlagStems(rel: string, text: string = readFileSync(join(REPO_ROOT, rel), "utf8")): string[] {
  const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  // The loop variable: `const <name> = argv[<index>]` inside a for statement.
  const loops = descendants(sf).filter(
    (n): n is ts.ForStatement =>
      ts.isForStatement(n) &&
      descendants(n.statement).some(
        (d) =>
          ts.isVariableDeclaration(d) &&
          d.initializer !== undefined &&
          ts.isElementAccessExpression(d.initializer) &&
          d.initializer.expression.getText(sf) === "argv",
      ),
  );
  expect(loops, `${rel}: the argument loop`).toHaveLength(1);
  const decl = descendants(loops[0].statement).find(
    (d): d is ts.VariableDeclaration =>
      ts.isVariableDeclaration(d) && d.initializer !== undefined && ts.isElementAccessExpression(d.initializer),
  ) as ts.VariableDeclaration;
  const loopVar = decl.name.getText(sf);
  const stems = new Set<string>();
  const isLoopVar = (e: ts.Expression): boolean => ts.isIdentifier(e) && e.text === loopVar;
  for (const n of descendants(loops[0].statement)) {
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) {
      const lit = isLoopVar(n.left) ? n.right : isLoopVar(n.right) ? n.left : null;
      if (lit !== null && ts.isStringLiteral(lit)) stems.add(lit.text);
    }
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      isLoopVar(n.expression.expression) &&
      n.expression.name.text === "startsWith" &&
      n.arguments.length === 1 &&
      ts.isStringLiteral(n.arguments[0])
    ) {
      stems.add(n.arguments[0].text);
    }
  }
  return [...new Set([...stems].map((f) => f.replace(/^-+/, "").replace(/=$/, "")))].sort();
}

describe("agent-flag census: no registry id collides with a flag either binary already parses (Pitfall 6)", () => {
  for (const rel of ARG_LOOP_MODULES) {
    it(`${rel}: the parsed flags hold no registry id`, () => {
      const stems = parsedFlagStems(rel);
      console.log(`${rel} parses: ${stems.join(" ")}`);
      // The census's premise: the loop was found and read. Both binaries parse --target and --allow-self.
      expect(stems).toContain("target");
      expect(stems).toContain("allow-self");
      const collisions = HOST_TOOLS.filter((h) => stems.includes(h.id)).map((h) => h.id);
      expect(collisions, `${rel}: a registry id equals a parsed flag`).toEqual([]);
    });
  }

  // The census's own premise: a loop that parses a registry id as an earlier flag is caught. The probe spells the
  // colliding flag through agentFlag, so it tracks the registry.
  it("premise: a loop comparing its variable with a registry flag is reported as a collision", () => {
    const flag = agentFlag(HOST_TOOLS[0]);
    const probe = [
      "const argv = process.argv.slice(2);",
      "for (let i = 0; i < argv.length; i++) {",
      "  const arg = argv[i];",
      '  if (arg === "--target" || arg.startsWith("--target=")) {} else if (arg === "--allow-self") {}',
      `  else if (arg === ${JSON.stringify(flag)}) {}`,
      "}",
    ].join("\n");
    const stems = parsedFlagStems("probe.ts", probe);
    expect(stems).toEqual(["allow-self", HOST_TOOLS[0].id, "target"].sort());
    expect(HOST_TOOLS.filter((h) => stems.includes(h.id)).map((h) => h.id)).toEqual([HOST_TOOLS[0].id]);
  });

  it("install.ts's parsed flags include the three modes an agent flag cannot be combined with (D-25)", () => {
    const stems = parsedFlagStems("install/install.ts");
    for (const mode of MODE_FLAGS) expect(stems).toContain(mode.replace(/^-+/, ""));
  });
});
