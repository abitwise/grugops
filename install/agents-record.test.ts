// agents-record.test.ts — the REC-1 class (phase 34.1 gap round 1, D-26, D-29; 34.1-GAP-PLANNING-BRIEF.md §1, §2.1).
//
// THE INVARIANT. The marker's `agents` and its install ledger never contradict each other: every holding ledger entry
// (install-marker.ts entryHolds) whose owners (host-tools.ts entryOwners) include an agent recorded at a run's start
// has an owner in the `agents` the run leaves. An agent is not dropped while it owns a held entry, so the per-agent
// command that finishes a reversal still names it and works (CR-02).
//
// ONE DERIVATION. install-marker.ts agentsToRecord gives the `agents` value of every marker write that sets the field:
// install.ts writeMarker, and uninstall.ts updateKeptMarker (through agentsAfter) on its partial-clean, partial-kept and
// flag-less-kept arms. install.ts rewriteLedger (prune, and an already-migrated --migrate) writes the marker too, sets
// no `agents`, and carries the field as read beside a change to backup entries only.
//
// WHAT IS HELD HERE.
//   - the unit tables of agentsToRecord, entryHolds and agentCommand (pure; ids taken from HOST_TOOLS, never typed);
//   - the arm table, one scratch install and uninstall per row, each asserting the expected `agents` and the invariant
//     (rows R1-R11, R16, R17; Task 3 of plan 34.1-14 adds R12-R15);
//   - the marker-writer census, by the TypeScript parser: every call of the target write chokepoints (install.ts
//     writeTargetFile, uninstall.ts rewritePath and unlinkPath; installer-fs-census.test.ts rows
//     `install.ts:writeTargetFile:writeFileSync`, `uninstall.ts:rewritePath:writeFileSync` and
//     `uninstall.ts:unlinkPath:unlinkSync` pin them as the one whole-file writer, the one rewrite and the one removal
//     under TARGET), classed both ways against a table, with the count of each pinned.
//
// Hermetic: every run sets GRUGOPS_HOME (and HOME) to scratch directories removed at the end, and passes the target
// through the test support (TARGET, or `--target` for a printed command). Drives the COMMITTED install/install.js and
// install/uninstall.js (npm run build first).
//
// Clear professional voice: this is test infrastructure for an installer safety surface. Vitest `globals: false`.

import { describe, it, expect, afterAll } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import ts from "typescript";
import { AGENT_SKILL_REL, HOST_TOOLS, agentCommand, agentFlag, entryOwners, type HostTool } from "./host-tools.js";
import { ASK_RULES_REL, agentsToRecord, entryHolds, readLedger, type LedgerEntry } from "./install-marker.js";
import {
  MARKER_REL,
  type Run,
  makeOldLayoutFixture,
  printedCommand,
  runInstall,
  runPrintedCommand,
  runUninstall,
  shellWords,
} from "./installer-paths.test-support.js";
import { readMarkerObject } from "./ledger.test-support.js";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-agents-record-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;

const NO_STACK = /^\s+at .+\(.+:\d+:\d+\)$/m;
const at = (root: string, rel: string): string => join(root, ...rel.split("/"));

/** The registry row of `id`; throws for an id the registry does not know. */
function row(id: string): HostTool {
  const h = HOST_TOOLS.find((x) => x.id === id);
  if (h === undefined) throw new Error(`no registry row ${id}`);
  return h;
}
const flag = (id: string): string => agentFlag(row(id));
const ids = (...xs: string[]): string[] => xs.map((x) => row(x).id);

interface World {
  readonly target: string;
  readonly home: string;
  readonly grugopsHome: string;
}
function world(tag: string): World {
  const root = join(SCRATCH, `${tag}-${seq++}`);
  const target = join(root, "target");
  const home = join(root, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  return { target, home, grugopsHome: join(home, ".grugops") };
}
function finished(r: Run, what: string): void {
  expect(r.error, `${what}: did not finish (${r.error?.message})`).toBeUndefined();
  expect(r.signal, `${what}: killed by ${r.signal}`).toBeNull();
  expect(r.stderr, `${what}: uncaught throw\n${r.stderr}`).not.toMatch(NO_STACK);
}
function install(w: World, args: readonly string[]): Run {
  const r = runInstall(w.target, w.grugopsHome, args, { home: w.home, timeoutMs: 180_000 });
  finished(r, `install ${args.join(" ")}`);
  expect(r.status, `install ${args.join(" ")}: exit ${r.status}\n${r.stdout}`).toBe(0);
  return r;
}
function uninstall(w: World, args: readonly string[], dryRun = false): Run {
  const r = runUninstall(w.target, w.grugopsHome, { home: w.home, dryRun, timeoutMs: 120_000 }, args);
  finished(r, `uninstall ${args.join(" ")}`);
  return r;
}
function runPrinted(w: World, stdout: string): Run {
  const r = runPrintedCommand(stdout, { grugopsHome: w.grugopsHome, home: w.home, timeoutMs: 120_000 });
  finished(r, `the printed command ${printedCommand(stdout)}`);
  return r;
}
const agentsOf = (w: World): unknown => readMarkerObject(w.target).agents;
const markerGone = (w: World): boolean => !existsSync(at(w.target, MARKER_REL));
/** The marker's ledger, through the product's one reader, so entryHolds and entryOwners see typed entries. */
function ledgerEntries(w: World): readonly LedgerEntry[] {
  const read = readLedger(readMarkerObject(w.target));
  expect(read.state, `the marker's ledger is not well formed (${read.why})`).toBe("ok");
  return read.entries;
}
/** Append a line to an installed file and return its bytes as install wrote them. */
function edit(w: World, rel: string): Buffer {
  const p = at(w.target, rel);
  const original = readFileSync(p);
  writeFileSync(p, Buffer.concat([original, Buffer.from("\na line the user added\n")]));
  return original;
}

/**
 * THE INVARIANT (REC-1): every holding ledger entry whose owners include an agent recorded at the run's start has an
 * owner in the `agents` the marker records now. Returns the entries that break it, for the message.
 */
function invariantBreaks(w: World, atStart: readonly string[]): string[] {
  const agents = agentsOf(w);
  expect(Array.isArray(agents), `the marker has no agents list: ${JSON.stringify(agents)}`).toBe(true);
  const recorded = agents as readonly string[];
  const breaks: string[] = [];
  for (const e of ledgerEntries(w)) {
    if (!entryHolds(e)) continue;
    const owners = entryOwners(e).filter((id) => atStart.includes(id));
    if (owners.length > 0 && !owners.some((id) => recorded.includes(id))) breaks.push(`${e.path}#${e.kind} (owners ${owners.join(", ")})`);
  }
  return breaks;
}
function expectInvariant(w: World, atStart: readonly string[], out: string): void {
  expect(invariantBreaks(w, atStart), `held entries whose owners left the record\n${out}`).toEqual([]);
}

/** The words of the printed command after `node install/<binary> --target <target>`: its agent flags. */
function printedFlags(stdout: string): string[] {
  const words = shellWords(printedCommand(stdout));
  expect(words.slice(0, 3), printedCommand(stdout)).toEqual(["node", "install/uninstall.js", "--target"]);
  return words.slice(4);
}

// ── the unit tables (pure) ───────────────────────────────────────────────────────────────────────────────────────

const fileEntry = (path: string): LedgerEntry => ({ path, kind: "file", content: "sha256:0", kit: false });
const CLAUDE_SKILL = ".claude/skills/grugops-gate/SKILL.md";
const askNothing = { path: ASK_RULES_REL, kind: "ask-rules", added: [], createdFile: false, createdPermissions: false, createdAsk: false, askContent: null } as LedgerEntry;
const askAdded = { path: ASK_RULES_REL, kind: "ask-rules", added: ["Bash(git push *)"], createdFile: false, createdPermissions: false, createdAsk: false, askContent: null } as LedgerEntry;
const backupEntry = { path: "plans/handoffs.bak.x", kind: "backup", origin: "handoffs", of: "plans/handoffs", content: null } as LedgerEntry;
const blockEntry = { path: "CLAUDE.md", kind: "block", block: "x", separator: "blank-line" } as unknown as LedgerEntry;

describe("agentsToRecord: the one derivation of `agents` (D-26, D-29)", () => {
  const rows: ReadonlyArray<{ name: string; known: string[]; keep: string[]; unknown?: string[]; entries: LedgerEntry[]; want: string[] }> = [
    { name: "a held Claude Code skill keeps Claude Code beside the kept Codex CLI", known: ids("claude", "codex"), keep: ids("codex"), entries: [fileEntry(CLAUDE_SKILL)], want: ids("claude", "codex") },
    { name: "nothing kept and no entries gives no agent", known: ids("claude", "codex"), keep: [], entries: [], want: [] },
    { name: "the shared agent skill held while Antigravity CLI stays drops Codex CLI", known: ids("codex", "antigravity"), keep: ids("antigravity"), entries: [fileEntry(AGENT_SKILL_REL)], want: ids("antigravity") },
    { name: "the shared agent skill held while neither owner stays keeps both", known: ids("claude", "codex", "antigravity"), keep: ids("claude"), entries: [fileEntry(AGENT_SKILL_REL)], want: ids("claude", "codex", "antigravity") },
    { name: "antigravity is not invented: an owner outside `known` is never added", known: ids("codex"), keep: [], entries: [fileEntry(AGENT_SKILL_REL)], want: ids("codex") },
    { name: "an AGENTS.md file entry (no owner) adds nothing", known: ids("claude", "codex"), keep: [], entries: [fileEntry("AGENTS.md")], want: [] },
    { name: "a dir entry adds nothing", known: ids("claude"), keep: [], entries: [{ path: ".claude", kind: "dir" }], want: [] },
    { name: "a backup entry adds nothing", known: ids("claude"), keep: [], entries: [backupEntry], want: [] },
    { name: "an ask-rules entry that claims nothing adds nothing", known: ids("claude"), keep: [], entries: [askNothing], want: [] },
    { name: "an ask-rules entry that records an added rule keeps Claude Code", known: ids("claude"), keep: [], entries: [askAdded], want: ids("claude") },
    { name: "an unknown recorded id is appended after the registry ids", known: ids("claude", "codex"), keep: ids("codex"), unknown: ["zed"], entries: [fileEntry(CLAUDE_SKILL)], want: [...ids("claude", "codex"), "zed"] },
    { name: "output is in registry order whatever order the inputs are in", known: ids("pi", "claude"), keep: ids("pi", "claude"), entries: [], want: HOST_TOOLS.filter((h) => h.id === "claude" || h.id === "pi").map((h) => h.id) },
  ];
  for (const r of rows) {
    it(r.name, () => {
      expect(agentsToRecord({ known: r.known, keep: r.keep, unknown: r.unknown ?? [], entries: r.entries })).toEqual(r.want);
    });
  }
});

describe("entryHolds: the marker rule's holding set (moved from uninstall.ts)", () => {
  const rows: ReadonlyArray<[string, LedgerEntry, boolean]> = [
    ["file", fileEntry(CLAUDE_SKILL), true],
    ["block", blockEntry, true],
    ["dir", { path: ".claude", kind: "dir" }, false],
    ["backup", backupEntry, false],
    ["ask-rules claiming nothing", askNothing, false],
    ["ask-rules with an added rule", askAdded, true],
  ];
  for (const [name, e, want] of rows) it(`${name} → ${want}`, () => expect(entryHolds(e)).toBe(want));
});

describe("agentCommand: the one builder of a printed command that names agents (MSG-1)", () => {
  it("names the binary, the target and the hosts' flags in the order given", () => {
    expect(agentCommand("uninstall.js", "/tmp/a/t", [row("claude")])).toBe(`node install/uninstall.js --target /tmp/a/t ${flag("claude")}`);
    expect(agentCommand("uninstall.js", "/tmp/a/t", [row("codex"), row("antigravity")])).toBe(
      `node install/uninstall.js --target /tmp/a/t ${flag("codex")} ${flag("antigravity")}`,
    );
  });
  it("no hosts gives no flag", () => {
    expect(agentCommand("uninstall.js", "/tmp/a/t", [])).toBe("node install/uninstall.js --target /tmp/a/t");
  });
  it("a target with a space or a quote is one shell word, and shellWords reads it back as one", () => {
    for (const target of ["/tmp/my repo/t", "/tmp/it's/t", "/tmp/a;b/$x"]) {
      const cmd = agentCommand("uninstall.js", target, [row("claude")]);
      expect(shellWords(cmd), cmd).toEqual(["node", "install/uninstall.js", "--target", target, flag("claude")]);
    }
  });
});

// ── the arm table (scratch runs) ─────────────────────────────────────────────────────────────────────────────────

describe("REC-1: every marker-writing arm leaves `agents` consistent with its ledger", () => {
  it("R1: install --claude --codex records [claude, codex]", () => {
    const w = world("r1");
    const r = install(w, [flag("claude"), flag("codex")]);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex"));
    expectInvariant(w, ids("claude", "codex"), r.stdout);
  });

  it("R2: a second install --pi adds Pi: [claude, codex, pi]", () => {
    const w = world("r2");
    install(w, [flag("claude"), flag("codex")]);
    const r = install(w, [flag("pi")]);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex", "pi"));
    expectInvariant(w, ids("claude", "codex", "pi"), r.stdout);
  });

  it("R3: uninstall --claude with nothing edited (partial clean) records [codex]", () => {
    const w = world("r3");
    install(w, [flag("claude"), flag("codex")]);
    const r = uninstall(w, [flag("claude")]);
    expect(r.status, r.stdout).toBe(0);
    expect(agentsOf(w), r.stdout).toEqual(ids("codex"));
    expectInvariant(w, ids("claude", "codex"), r.stdout);
  });

  it("R4: uninstall --claude over an edited Claude Code skill (partial kept) records [claude, codex]; restored, the printed command records [codex]", () => {
    const w = world("r4");
    install(w, [flag("claude"), flag("codex")]);
    const original = edit(w, CLAUDE_SKILL);
    const r = uninstall(w, [flag("claude")]);
    expect(r.status, r.stdout).toBe(0);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex"));
    expectInvariant(w, ids("claude", "codex"), r.stdout);
    expect(printedFlags(r.stdout), r.stdout).toEqual([flag("claude")]);
    writeFileSync(at(w.target, CLAUDE_SKILL), original);
    const fin = runPrinted(w, r.stdout);
    expect(fin.status, fin.stdout).toBe(0);
    expect(agentsOf(w), fin.stdout).toEqual(ids("codex"));
    expect(existsSync(at(w.target, CLAUDE_SKILL)), fin.stdout).toBe(false);
  });

  it("R5: a flag-less uninstall over an edited Claude Code skill (FULL kept) records [claude], not []; restored, the flag-less printed command removes the marker", () => {
    const w = world("r5");
    install(w, [flag("claude"), flag("codex")]);
    const original = edit(w, CLAUDE_SKILL);
    const r = uninstall(w, []);
    expect(r.status, r.stdout).toBe(0);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude"));
    expectInvariant(w, ids("claude", "codex"), r.stdout);
    expect(printedFlags(r.stdout), r.stdout).toEqual([]);
    writeFileSync(at(w.target, CLAUDE_SKILL), original);
    const fin = runPrinted(w, r.stdout);
    expect(fin.status, fin.stdout).toBe(0);
    expect(markerGone(w), fin.stdout).toBe(true);
  });

  it("R6 (D-29): a flag-less uninstall over an edited AGENTS.md only (a held entry no agent owns) records []; restored, the flag-less printed command removes the marker", () => {
    const w = world("r6");
    install(w, [flag("claude"), flag("codex")]);
    expect(entryOwners({ path: "AGENTS.md", kind: "file" }), "PREMISE: AGENTS.md is shared").toEqual([]);
    const original = edit(w, "AGENTS.md");
    const r = uninstall(w, []);
    expect(r.status, r.stdout).toBe(0);
    expect(existsSync(at(w.target, MARKER_REL)), `the marker was removed beside a held AGENTS.md\n${r.stdout}`).toBe(true);
    expect(agentsOf(w), r.stdout).toEqual([]);
    expectInvariant(w, ids("claude", "codex"), r.stdout);
    expect(printedFlags(r.stdout), r.stdout).toEqual([]);
    writeFileSync(at(w.target, "AGENTS.md"), original);
    const fin = runPrinted(w, r.stdout);
    expect(fin.status, fin.stdout).toBe(0);
    expect(markerGone(w), fin.stdout).toBe(true);
  });

  it("R7: uninstall --codex while Antigravity CLI stays, over an edited shared skill (out of scope, kept), records [claude, antigravity]", () => {
    const w = world("r7");
    install(w, [flag("codex"), flag("antigravity"), flag("claude")]);
    edit(w, AGENT_SKILL_REL);
    const r = uninstall(w, [flag("codex")]);
    expect(r.status, r.stdout).toBe(0);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), r.stdout).toBe(true);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude", "antigravity"));
    expectInvariant(w, ids("claude", "codex", "antigravity"), r.stdout);
  });

  it("R8: uninstall --codex --antigravity over an edited shared skill records both; restored, the printed command removes it and records [claude]", () => {
    const w = world("r8");
    install(w, [flag("codex"), flag("antigravity"), flag("claude")]);
    const original = edit(w, AGENT_SKILL_REL);
    const r = uninstall(w, [flag("codex"), flag("antigravity")]);
    expect(r.status, r.stdout).toBe(0);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex", "antigravity"));
    expectInvariant(w, ids("claude", "codex", "antigravity"), r.stdout);
    expect(printedFlags(r.stdout), r.stdout).toEqual([flag("codex"), flag("antigravity")]);
    writeFileSync(at(w.target, AGENT_SKILL_REL), original);
    const fin = runPrinted(w, r.stdout);
    expect(fin.status, fin.stdout).toBe(0);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
    expect(agentsOf(w), fin.stdout).toEqual(ids("claude"));
  });

  it("R9: Antigravity CLI never installed: uninstall --codex over an edited shared skill records [claude, codex], and Antigravity CLI is not added", () => {
    const w = world("r9");
    install(w, [flag("claude"), flag("codex")]);
    edit(w, AGENT_SKILL_REL);
    const r = uninstall(w, [flag("codex")]);
    expect(r.status, r.stdout).toBe(0);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex"));
    expectInvariant(w, ids("claude", "codex"), r.stdout);
  });

  it("R10: uninstall --pi on an install without Pi leaves the marker byte for byte", () => {
    const w = world("r10");
    install(w, [flag("claude"), flag("codex")]);
    const before = readFileSync(at(w.target, MARKER_REL));
    const r = uninstall(w, [flag("pi")]);
    expect(r.status, r.stdout).toBe(0);
    expect(readFileSync(at(w.target, MARKER_REL)).equals(before), r.stdout).toBe(true);
    expect(agentsOf(w)).toEqual(ids("claude", "codex"));
  });

  it("R11: a malformed ledger: uninstall writes nothing to the marker", () => {
    const w = world("r11");
    install(w, [flag("claude"), flag("codex")]);
    const p = at(w.target, MARKER_REL);
    writeFileSync(p, JSON.stringify({ ...readMarkerObject(w.target), ledger: "not a list" }, null, 2) + "\n");
    const before = readFileSync(p);
    const r = uninstall(w, [flag("codex")]);
    expect(readFileSync(p).equals(before), `the marker changed beside a malformed ledger\n${r.stdout}`).toBe(true);
  });

  /** The holding entries of the marker (entryHolds), serialized in order, for an equality across a rewriteLedger run. */
  const holding = (w: World): string => JSON.stringify(ledgerEntries(w).filter(entryHolds));
  const nonBackup = (w: World): string => JSON.stringify(ledgerEntries(w).filter((e) => e.kind !== "backup"));
  const backups = (w: World): string[] => ledgerEntries(w).filter((e) => e.kind === "backup").map((e) => e.path).sort();

  it("R16 (rewriteLedger, prune): --prune-old-kit rewrites the marker; `agents` is byte-identical, the holding entries are identical, only backup entries changed", () => {
    const w = world("r16");
    makeOldLayoutFixture(w.target, { rootConfig: true });
    install(w, [flag("claude"), flag("codex"), "--migrate", "--backup-edited-kit"]);
    const agentsBefore = JSON.stringify(agentsOf(w));
    const holdingBefore = holding(w);
    const nonBackupBefore = nonBackup(w);
    const backupsBefore = backups(w);
    expect(backupsBefore.length, "PREMISE: the migrate recorded backups").toBeGreaterThan(0);
    const r = runInstall(w.target, w.grugopsHome, ["--prune-old-kit"], { home: w.home, timeoutMs: 120_000 });
    finished(r, "--prune-old-kit");
    expect(r.status, r.stdout).toBe(0);
    expect(backups(w).length, `PREMISE: prune took no backup out of the marker\n${r.stdout}`).toBeLessThan(backupsBefore.length);
    expect(JSON.stringify(agentsOf(w)), r.stdout).toBe(agentsBefore);
    expect(holding(w), r.stdout).toBe(holdingBefore);
    expect(nonBackup(w), "an entry that is not a backup changed").toBe(nonBackupBefore);
    expectInvariant(w, ids("claude", "codex"), r.stdout);
  });

  it("R17 (rewriteLedger, already-migrated --migrate): the handoffs backup is recorded; `agents` is byte-identical, the holding entries are identical, only backup entries changed", () => {
    const w = world("r17");
    install(w, [flag("claude"), flag("codex")]);
    mkdirSync(at(w.target, "plans/handoffs"), { recursive: true });
    writeFileSync(at(w.target, "plans/handoffs/h1.md"), "a user's handoff\n");
    const agentsBefore = JSON.stringify(agentsOf(w));
    const holdingBefore = holding(w);
    const nonBackupBefore = nonBackup(w);
    const backupsBefore = backups(w);
    const r = install(w, [flag("claude"), flag("codex"), "--migrate"]);
    expect(r.stdout, "PREMISE: not the already-migrated arm").toMatch(/already migrated to the two-root layout/);
    expect(backups(w).length, `PREMISE: no backup was recorded\n${r.stdout}`).toBe(backupsBefore.length + 1);
    expect(JSON.stringify(agentsOf(w)), r.stdout).toBe(agentsBefore);
    expect(holding(w), r.stdout).toBe(holdingBefore);
    expect(nonBackup(w), "an entry that is not a backup changed").toBe(nonBackupBefore);
    expectInvariant(w, ids("claude", "codex"), r.stdout);
  });
});

// ── the marker-writer census (TypeScript parser) ─────────────────────────────────────────────────────────────────

/** A parsed product module. */
function parse(rel: string): ts.SourceFile {
  return ts.createSourceFile(rel, readFileSync(join(REPO_ROOT, rel), "utf8"), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
}
function nodesOf<T extends ts.Node>(root: ts.Node, test: (n: ts.Node) => n is T): T[] {
  const out: T[] = [];
  const visit = (n: ts.Node): void => {
    if (test(n)) out.push(n);
    ts.forEachChild(n, visit);
  };
  visit(root);
  return out;
}
/** The name of the function a node sits in (a function declaration, or an arrow or function bound to a const). */
function enclosing(n: ts.Node): string {
  for (let p: ts.Node | undefined = n.parent; p !== undefined; p = p.parent) {
    if (ts.isFunctionDeclaration(p) && p.name !== undefined) return p.name.text;
    if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && ts.isVariableDeclaration(p.parent) && ts.isIdentifier(p.parent.name)) return p.parent.name.text;
  }
  return "<module>";
}
const calleeName = (c: ts.CallExpression): string | null => (ts.isIdentifier(c.expression) ? c.expression.text : null);
const callsOf = (root: ts.Node, name: string): ts.CallExpression[] => nodesOf(root, ts.isCallExpression).filter((c) => calleeName(c) === name);
function functionNamed(sf: ts.SourceFile, name: string): ts.FunctionDeclaration {
  const found = nodesOf(sf, ts.isFunctionDeclaration).filter((f) => f.name?.text === name);
  expect(found.length, `${sf.fileName}: function ${name}`).toBe(1);
  return found[0];
}

type WriterClass = "writes the marker" | "removes the marker" | "never the marker";
/**
 * Every call of a target write chokepoint, keyed `module:function:callee`, with its class and its count. "never the
 * marker" rows say what they write. A new call of a chokepoint turns the table red until it is classed here.
 */
const CHOKEPOINT_TABLE: Readonly<Record<string, { readonly cls: WriterClass; readonly count: number; readonly what: string }>> = {
  "install.ts:writeMarker:writeTargetFile": { cls: "writes the marker", count: 1, what: "the marker, `agents` from agentsToRecord" },
  "install.ts:rewriteLedger:writeTargetFile": { cls: "writes the marker", count: 1, what: "the marker (scope target) with only its ledger replaced; `agents` carried as read" },
  "install.ts:migratePreSteps:writeTargetFile": { cls: "never the marker", count: 1, what: "the seeded per-repo config from a legacy file" },
  "install.ts:ensureBlock:writeTargetFile": { cls: "never the marker", count: 2, what: "the CLAUDE.md or Copilot pointer block" },
  "install.ts:writeWholeFileEntry:writeTargetFile": { cls: "never the marker", count: 1, what: "a whole-file host entry" },
  "install.ts:refreshOwnFile:writeTargetFile": { cls: "never the marker", count: 1, what: "a refresh of an owned whole file (host entry or AGENTS.md)" },
  "install.ts:linkOrCopy:writeTargetFile": { cls: "never the marker", count: 1, what: "AGENTS.md" },
  "install.ts:materializeAdapter:writeTargetFile": { cls: "never the marker", count: 1, what: "a Claude Code adapter" },
  "install.ts:copyKitFile:writeTargetFile": { cls: "never the marker", count: 1, what: "a Claude Code skill" },
  "install.ts:seedFile:writeTargetFile": { cls: "never the marker", count: 1, what: "seeded per-repo state" },
  "install.ts:materializeRunnable:writeTargetFile": { cls: "never the marker", count: 1, what: "a tools/grugops runnable" },
  "install.ts:writeAskRules:writeTargetFile": { cls: "never the marker", count: 1, what: ".claude/settings.json" },
  "install.ts:writeOpenCodePermission:writeTargetFile": { cls: "never the marker", count: 2, what: "opencode.json" },
  "uninstall.ts:updateKeptMarker:rewritePath": { cls: "writes the marker", count: 1, what: "the kept marker, `agents` from agentsAfter → agentsToRecord" },
  "uninstall.ts:removeMarker:unlinkPath": { cls: "removes the marker", count: 1, what: "the marker, once its record is discharged" },
  "uninstall.ts:removeFile:unlinkPath": { cls: "never the marker", count: 1, what: "a recorded file" },
  "uninstall.ts:removeSentinelBlock:rewritePath": { cls: "never the marker", count: 1, what: "a pointer block taken out of its file" },
  "uninstall.ts:removeOwnedEmptyFile:unlinkPath": { cls: "never the marker", count: 1, what: "a file install created, empty after the block removal" },
  "uninstall.ts:unmergeGemini:unlinkPath": { cls: "never the marker", count: 2, what: ".gemini/settings.json" },
  "uninstall.ts:unmergeGemini:rewritePath": { cls: "never the marker", count: 1, what: ".gemini/settings.json" },
  "uninstall.ts:removeAskRules:unlinkPath": { cls: "never the marker", count: 1, what: ".claude/settings.json" },
  "uninstall.ts:removeAskRules:rewritePath": { cls: "never the marker", count: 1, what: ".claude/settings.json" },
  "uninstall.ts:removeOpenCodePermission:unlinkPath": { cls: "never the marker", count: 1, what: "opencode.json" },
  "uninstall.ts:removeOpenCodePermission:rewritePath": { cls: "never the marker", count: 1, what: "opencode.json" },
};
/** The chokepoints, per module: the one whole-file writer, the one rewrite and the one removal under TARGET. */
const CHOKEPOINTS: Readonly<Record<string, readonly string[]>> = {
  "install.ts": ["writeTargetFile"],
  "uninstall.ts": ["rewritePath", "unlinkPath"],
};
/** Pinned call counts per chokepoint (measured 2026-10-12, plan 34.1-14): install.ts 15 writeTargetFile calls; uninstall.ts 5 rewritePath and 7 unlinkPath calls. */
const CHOKEPOINT_CALLS: Readonly<Record<string, number>> = { writeTargetFile: 15, rewritePath: 5, unlinkPath: 7 };

describe("the marker-writer census (REC-1, derived over every chokepoint call)", () => {
  const found = new Map<string, number>();
  const perCallee = new Map<string, number>();
  for (const [mod, callees] of Object.entries(CHOKEPOINTS)) {
    const sf = parse(`install/${mod}`);
    for (const callee of callees) {
      for (const c of callsOf(sf, callee)) {
        const key = `${mod}:${enclosing(c)}:${callee}`;
        found.set(key, (found.get(key) ?? 0) + 1);
        perCallee.set(callee, (perCallee.get(callee) ?? 0) + 1);
      }
    }
  }

  it("every chokepoint call is classed, and every classed row is a call (equal both ways, with counts)", () => {
    const want = Object.fromEntries(Object.entries(CHOKEPOINT_TABLE).map(([k, v]) => [k, v.count]));
    expect(Object.fromEntries([...found].sort()), "a chokepoint call is not classed, or a classed call is gone").toEqual(
      Object.fromEntries(Object.entries(want).sort()),
    );
    expect(Object.fromEntries(perCallee), "the chokepoint call counts moved").toEqual(CHOKEPOINT_CALLS);
  });

  it("the marker class is exactly install.ts writeMarker and rewriteLedger and uninstall.ts updateKeptMarker (3 call sites); the removal class is exactly removeMarker (1)", () => {
    const of = (cls: WriterClass): string[] => Object.entries(CHOKEPOINT_TABLE).filter(([, v]) => v.cls === cls).map(([k]) => k).sort();
    const sites = (cls: WriterClass): number => Object.values(CHOKEPOINT_TABLE).filter((v) => v.cls === cls).reduce((n, v) => n + v.count, 0);
    expect(of("writes the marker")).toEqual(["install.ts:rewriteLedger:writeTargetFile", "install.ts:writeMarker:writeTargetFile", "uninstall.ts:updateKeptMarker:rewritePath"]);
    expect(sites("writes the marker")).toBe(3);
    expect(of("removes the marker")).toEqual(["uninstall.ts:removeMarker:unlinkPath"]);
    expect(sites("removes the marker")).toBe(1);
  });

  it("writeMarker: the `agents` property of the marker object is a call to agentsToRecord", () => {
    const fn = functionNamed(parse("install/install.ts"), "writeMarker");
    const props = nodesOf(fn, ts.isPropertyAssignment).filter((p) => (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && p.name.text === "agents");
    expect(props.length, "writeMarker sets `agents` once").toBe(1);
    const init = props[0].initializer;
    expect(ts.isCallExpression(init) && calleeName(init), `writeMarker's agents is ${init.getText()}`).toBe("agentsToRecord");
  });

  it("updateKeptMarker: the one withAgentsAndLedger call takes agentsAfter(), whose body returns agentsToRecord(...); updateKeptMarker has 3 call sites", () => {
    const sf = parse("install/uninstall.ts");
    const calls = callsOf(sf, "withAgentsAndLedger");
    expect(calls.length, "withAgentsAndLedger calls in uninstall.ts").toBe(1);
    expect(enclosing(calls[0])).toBe("updateKeptMarker");
    const arg = calls[0].arguments[1];
    expect(ts.isCallExpression(arg) && calleeName(arg), `the agents argument is ${arg.getText()}`).toBe("agentsAfter");
    const after = functionNamed(sf, "agentsAfter");
    const returns = nodesOf(after, ts.isReturnStatement);
    expect(returns.length, "agentsAfter has one return").toBe(1);
    const ret = returns[0].expression;
    expect(ret !== undefined && ts.isCallExpression(ret) && calleeName(ret), `agentsAfter returns ${ret?.getText()}`).toBe("agentsToRecord");
    const kept = callsOf(sf, "updateKeptMarker");
    expect(kept.length, "updateKeptMarker call sites").toBe(3);
    for (const c of kept) expect(enclosing(c)).toBe("removeMarker");
  });

  it("rewriteLedger: the record it serializes is one spread and one `ledger` property, no `agents`; its 2 callers are recordBackupsInMarker and rewriteLedgerWithout", () => {
    const sf = parse("install/install.ts");
    const fn = functionNamed(sf, "rewriteLedger");
    const literals = nodesOf(fn, ts.isObjectLiteralExpression).filter((o) => o.properties.some(ts.isSpreadAssignment));
    expect(literals.length, "rewriteLedger serializes one record literal").toBe(1);
    const props = literals[0].properties;
    expect(props.filter(ts.isSpreadAssignment).length, "one spread (the record as read)").toBe(1);
    const named = props.filter((p) => !ts.isSpreadAssignment(p)).map((p) => (p.name !== undefined && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : p.getText()));
    expect(named, "rewriteLedger sets only `ledger` beside the spread").toEqual(["ledger"]);
    expect(callsOf(sf, "rewriteLedger").map(enclosing).sort()).toEqual(["recordBackupsInMarker", "rewriteLedgerWithout"]);
  });

  it("neither binary assigns AGENTS_FIELD or an `agents` property anywhere else", () => {
    const sites: string[] = [];
    for (const mod of ["install.ts", "uninstall.ts"]) {
      const sf = parse(`install/${mod}`);
      const isAgentsName = (nm: ts.PropertyName): boolean =>
        ((ts.isIdentifier(nm) || ts.isStringLiteral(nm)) && nm.text === "agents") ||
        (ts.isComputedPropertyName(nm) && ts.isIdentifier(nm.expression) && nm.expression.text === "AGENTS_FIELD");
      for (const p of nodesOf(sf, (n): n is ts.PropertyAssignment | ts.ShorthandPropertyAssignment => ts.isPropertyAssignment(n) || ts.isShorthandPropertyAssignment(n))) {
        if (ts.isObjectLiteralExpression(p.parent) && isAgentsName(p.name)) sites.push(`${mod}:${enclosing(p)}:property`);
      }
      for (const b of nodesOf(sf, ts.isBinaryExpression)) {
        if (b.operatorToken.kind !== ts.SyntaxKind.EqualsToken) continue;
        const l = b.left;
        if (ts.isElementAccessExpression(l) && ((ts.isIdentifier(l.argumentExpression) && l.argumentExpression.text === "AGENTS_FIELD") || (ts.isStringLiteral(l.argumentExpression) && l.argumentExpression.text === "agents"))) {
          sites.push(`${mod}:${enclosing(b)}:element`);
        }
        if (ts.isPropertyAccessExpression(l) && l.name.text === "agents") sites.push(`${mod}:${enclosing(b)}:member`);
      }
    }
    // install.ts writeMarker's one property (agentsToRecord, above), and uninstall.ts withAgentsAndLedger's two
    // assignments of its `agents` parameter, which its one caller passes agentsAfter() (above). Pinned: 3.
    expect(sites.sort()).toEqual(["install.ts:writeMarker:property", "uninstall.ts:withAgentsAndLedger:element", "uninstall.ts:withAgentsAndLedger:element"]);
  });
});
