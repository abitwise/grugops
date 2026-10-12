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
//     (rows R1-R17; R12-R15 are the MSG-1 remedy rows: each runs the command a line printed; R18, plan 34.1-15, is
//     D-04's retry of a refused agent, the converse the chosen meaning deliberately does not hold; R33, plan 34.1-23,
//     runs the install INCOMPLETE banner's command of a `--symlink` run as printed, D-33);
//   - the marker-writer census, by the TypeScript parser: every call of the target write chokepoints (install.ts
//     writeTargetFile, uninstall.ts rewritePath and unlinkPath; installer-fs-census.test.ts rows
//     `install.ts:writeTargetFile:writeFileSync`, `uninstall.ts:rewritePath:writeFileSync` and
//     `uninstall.ts:unlinkPath:unlinkSync` pin them as the one whole-file writer, the one rewrite and the one removal
//     under TARGET), classed both ways against a table, with the count of each pinned;
//   - the uninstall re-run census (MSG-1): every string fragment of install/uninstall.ts that says to run uninstall
//     again sits in a string expression that prints an agentCommand-built command (rerunCommand or finishCommand),
//     so no remedy sends a per-agent run into a flag-less uninstall, which removes every agent (D-05);
//   - D-32 (CR-03, plans 34.1-19 and 34.1-20): no printed alternative removes the record of an agent that stays
//     installed. R19 and R20 follow keepWithoutRecord's partial and FULL alternatives; R21 holds removeMarker's
//     malformed-ledger line on a partial and a FULL run; the by-hand remedy census finds, by the parser, every printed
//     alternative in a product module that touches .grugops/install.json, its ledger or its `agents` field, compares it
//     both ways with a classed table, checks each row against its class's rule, pins the per-class counts, and holds
//     the delete-the-marker text to keepWithoutRecord's FULL branch.
//
// Hermetic: every run sets GRUGOPS_HOME (and HOME) to scratch directories removed at the end, and passes the target
// through the test support (TARGET, or `--target` for a printed command). Drives the COMMITTED install/install.js and
// install/uninstall.js (npm run build first).
//
// Clear professional voice: this is test infrastructure for an installer safety surface. Vitest `globals: false`.

import { describe, it, expect, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import ts from "typescript";
import { AGENT_SKILL_REL, HOST_TOOLS, PI_PROMPT_REL, agentCommand, agentFlag, commandContext, entryOwners, scriptCommand, type HostTool } from "./host-tools.js";
import { ASK_RULES_REL, agentsToRecord, entryHolds, readLedger, type LedgerEntry } from "./install-marker.js";
import {
  INSTALL_JS,
  MARKER_REL,
  UNINSTALL_JS,
  type PrintedRun,
  type Run,
  commandContextFor,
  lineNamesPath,
  makeOldLayoutFixture,
  pathText,
  printedCommand,
  printedCommands,
  runInstall,
  runPrintedCommand,
  runUninstall,
  shellWords,
  snapshotTree,
  spawnBin,
} from "./installer-paths.test-support.js";
import { readMarkerObject, withLedger } from "./ledger.test-support.js";

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
/**
 * Run the uninstall command a line printed, as a user would (plan 34.1-24, D-33): runPrintedCommand, from a scratch
 * directory outside the checkout, with HOME the world's scratch home and no GRUGOPS_HOME unless the printed text sets
 * one. An uninstall.js command never sets one (scriptCommand), and the premise is asserted here.
 */
function runPrinted(w: World, stdout: string): PrintedRun {
  const r = runPrintedCommand(stdout, { home: w.home, timeoutMs: 120_000 });
  finished(r, `the printed command ${printedCommand(stdout)}`);
  expect(relative(REPO_ROOT, r.premise.cwd).startsWith(".."), `premise: the printed command ran from ${r.premise.cwd}, inside the checkout`).toBe(true);
  expect(r.premise.grugopsHome, `premise: an uninstall command sets no kit home: ${printedCommand(stdout)}`).toBeUndefined();
  return r;
}
/** The context an uninstall run in world `w` builds (its kit home and HOME); the expected side of a printed command. */
const ctxOf = (w: World): ReturnType<typeof commandContextFor> => commandContextFor({ grugopsHome: w.grugopsHome, home: w.home });
const agentsOf = (w: World): unknown => readMarkerObject(w.target).agents;
const markerGone = (w: World): boolean => !existsSync(at(w.target, MARKER_REL));
/** The marker's ledger, through the product's one reader, so entryHolds and entryOwners see typed entries. */
function ledgerEntries(w: World): readonly LedgerEntry[] {
  const read = readLedger(readMarkerObject(w.target));
  expect(read.state, `the marker's ledger is not well formed (${read.why})`).toBe("ok");
  return read.entries;
}
/**
 * Every path under `roots` that is a symbolic link (lstat), found by a walk that never follows a link, sorted. A root
 * that does not exist gives nothing.
 */
function linksUnder(roots: readonly string[]): string[] {
  const out: string[] = [];
  const walk = (p: string): void => {
    const st = lstatSync(p, { throwIfNoEntry: false });
    if (st === undefined) return;
    if (st.isSymbolicLink()) out.push(p);
    else if (st.isDirectory()) for (const name of readdirSync(p)) walk(join(p, name));
  };
  for (const r of roots) walk(r);
  return out.sort();
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

/**
 * The words of the printed uninstall command after `node <absolute uninstall.js> --target <target>`: its agent flags.
 * The script word must be this checkout's uninstall.js by its absolute path (D-33), and no GRUGOPS_HOME word may lead
 * the command.
 */
function printedFlags(stdout: string): string[] {
  const printed = printedCommand(stdout);
  const words = shellWords(printed);
  expect(words[0], `the printed command does not start with node: ${printed}`).toBe("node");
  expect(isAbsolute(words[1]), `the uninstall script is not named by its absolute path: ${printed}`).toBe(true);
  expect(pathText(words[1]), printed).toBe(pathText(UNINSTALL_JS));
  expect(words[2], printed).toBe("--target");
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
  // The invocation context (plan 34.1-22, D-33, review WR-19). Pure: no row runs an installer. Each expected command is
  // scriptCommand's words followed by the arguments, and the literal `node <DIR>/uninstall.js` is checked beside it,
  // so a defect in scriptCommand cannot hide behind an expected side built by the same function.
  const DIR = "/opt/grugops/install";
  const KIT = "/srv/kits/k";
  const DEFAULT_KIT = "/home/u/.grugops";
  const plain = commandContext(DIR, DEFAULT_KIT, DEFAULT_KIT);
  const withKit = commandContext(DIR, KIT, DEFAULT_KIT);
  const linked = commandContext(DIR, DEFAULT_KIT, DEFAULT_KIT, true);
  const everything = commandContext(DIR, KIT, DEFAULT_KIT, true);

  it("names the binary, the target and the hosts' flags in the order given", () => {
    const head = scriptCommand("uninstall.js", plain);
    expect(head).toBe(`node ${DIR}/uninstall.js`);
    expect(agentCommand("uninstall.js", "/tmp/a/t", [row("claude")], plain)).toBe(`${head} --target /tmp/a/t ${flag("claude")}`);
    expect(agentCommand("uninstall.js", "/tmp/a/t", [row("codex"), row("antigravity")], plain)).toBe(
      `${head} --target /tmp/a/t ${flag("codex")} ${flag("antigravity")}`,
    );
  });
  it("no hosts gives no flag", () => {
    expect(agentCommand("uninstall.js", "/tmp/a/t", [], plain)).toBe(`${scriptCommand("uninstall.js", plain)} --target /tmp/a/t`);
    expect(agentCommand("uninstall.js", "/tmp/a/t", [], plain)).toBe(`node ${DIR}/uninstall.js --target /tmp/a/t`);
  });
  it("a target with a space or a quote is one shell word, and shellWords reads it back as one", () => {
    for (const target of ["/tmp/my repo/t", "/tmp/it's/t", "/tmp/a;b/$x"]) {
      const cmd = agentCommand("uninstall.js", target, [row("claude")], plain);
      expect(shellWords(cmd), cmd).toEqual([...shellWords(scriptCommand("uninstall.js", plain)), "--target", target, flag("claude")]);
      expect(shellWords(cmd).slice(0, 2), cmd).toEqual(["node", `${DIR}/uninstall.js`]);
    }
  });

  it("commandContext: kitHome is null when it equals the default, and the value otherwise", () => {
    expect(plain).toEqual({ scriptDir: DIR, kitHome: null, symlink: false });
    expect(withKit).toEqual({ scriptDir: DIR, kitHome: KIT, symlink: false });
    expect(linked.symlink).toBe(true);
  });
  it("scriptCommand(install.js) with the default kit home is `node <dir>/install.js`", () => {
    expect(scriptCommand("install.js", plain)).toBe(`node ${DIR}/install.js`);
    expect(scriptCommand("install.js", commandContext(DIR + "/", DEFAULT_KIT, DEFAULT_KIT)), "a trailing / on the script directory").toBe(`node ${DIR}/install.js`);
  });
  it("scriptCommand(install.js) with another kit home starts `GRUGOPS_HOME=<home> node`", () => {
    expect(scriptCommand("install.js", withKit)).toBe(`GRUGOPS_HOME=${KIT} node ${DIR}/install.js`);
  });
  it("scriptCommand(install.js) of a symlink run ends `<dir>/install.js --symlink`", () => {
    expect(scriptCommand("install.js", linked)).toBe(`node ${DIR}/install.js --symlink`);
    expect(scriptCommand("install.js", everything)).toBe(`GRUGOPS_HOME=${KIT} node ${DIR}/install.js --symlink`);
  });
  it("scriptCommand(uninstall.js) is exactly `node <dir>/uninstall.js`, even with a kit home and symlink in the context", () => {
    expect(scriptCommand("uninstall.js", everything)).toBe(`node ${DIR}/uninstall.js`);
    expect(agentCommand("uninstall.js", "/tmp/a/t", [row("codex")], everything)).toBe(`node ${DIR}/uninstall.js --target /tmp/a/t ${flag("codex")}`);
  });
  it("a script directory or a kit home with a space or a quote is single-quoted, and shellWords reads each back as one word", () => {
    for (const odd of ["/opt/my grugops/install", "/opt/it's/install", "/opt/a;b/$x/install"]) {
      const ctx = commandContext(odd, odd + "/kit", DEFAULT_KIT, true);
      const cmd = agentCommand("install.js", "/tmp/my repo/t", [row("pi")], ctx);
      expect(shellWords(cmd), cmd).toEqual([`GRUGOPS_HOME=${odd}/kit`, "node", `${odd}/install.js`, "--symlink", "--target", "/tmp/my repo/t", agentFlag(row("pi"))]);
    }
  });
  it("agentCommand with a context appends the flags in the order given, then the modes", () => {
    expect(agentCommand("install.js", "/tmp/a/t", [row("codex"), row("claude")], withKit, ["--migrate"])).toBe(
      `GRUGOPS_HOME=${KIT} node ${DIR}/install.js --target /tmp/a/t ${flag("codex")} ${flag("claude")} --migrate`,
    );
    expect(agentCommand("install.js", "/tmp/a/t", [], plain, ["--check"])).toBe(`node ${DIR}/install.js --target /tmp/a/t --check`);
  });
  it("agentCommand throws for a combination the binary would refuse", () => {
    expect(() => agentCommand("install.js", "/tmp/a/t", [row("claude")], plain, ["--check"])).toThrow(/--check/);
    expect(() => agentCommand("install.js", "/tmp/a/t", [row("claude")], plain, ["--prune-old-kit"])).toThrow(/--prune-old-kit/);
    expect(() => agentCommand("uninstall.js", "/tmp/a/t", [], plain, ["--migrate"])).toThrow(/uninstall\.js takes no mode/);
  });
});

// ── the harness premise (plan 34.1-22, D-33; brief §4, WR-19) ─────────────────────────────────────────────────────
//
// runPrintedCommand runs a printed command in the user's environment: only the printed text sets GRUGOPS_HOME, and the
// working directory is not the checkout. These rows hold that premise against the test process's own environment.
describe("runPrintedCommand: the harness premise (D-33, WR-19)", () => {
  it("a printed command with no GRUGOPS_HOME prefix, run from a test process whose environment sets GRUGOPS_HOME, runs with no GRUGOPS_HOME and outside the checkout", () => {
    const dir = join(SCRATCH, `premise-${seq++}`);
    const home = join(dir, "home");
    const target = join(dir, "t");
    mkdirSync(home, { recursive: true });
    mkdirSync(target, { recursive: true });
    const injected = join(dir, "injected-kit");
    const ctx = commandContextFor({ grugopsHome: join(home, ".grugops"), home });
    expect(ctx.kitHome, "premise: the kit home is the default, so the printed text sets none").toBeNull();
    const text = "`" + agentCommand("install.js", target, [], ctx, ["--check"]) + "`";
    const saved = process.env.GRUGOPS_HOME;
    process.env.GRUGOPS_HOME = injected;
    try {
      const r = runPrintedCommand(text, { home, timeoutMs: 120_000 });
      expect(r.premise.grugopsHome, "the child's environment held the test process's GRUGOPS_HOME").toBeUndefined();
      expect(relative(REPO_ROOT, r.premise.cwd).startsWith(".."), `the printed command ran from ${r.premise.cwd}, inside the checkout`).toBe(true);
      expect(r.signal, r.stderr).toBeNull();
      expect(pathText(r.stdout + r.stderr), "the child names the injected kit home").not.toContain(pathText(injected));
      expect(existsSync(injected), "the child wrote into the injected kit home").toBe(false);
    } finally {
      if (saved === undefined) delete process.env.GRUGOPS_HOME;
      else process.env.GRUGOPS_HOME = saved;
    }
  });
  it("printedCommand finds no span whose script word is relative: a relative command alone is refused, and beside an absolute one it is skipped", () => {
    const relativeSpan = "`node install/uninstall.js --target /tmp/a/t`";
    expect(() => printedCommand(relativeSpan)).toThrow(/relative/);
    const absolute = agentCommand("uninstall.js", "/tmp/a/t", [], commandContextFor({ grugopsHome: join(SCRATCH, "k"), home: SCRATCH }));
    expect(printedCommand(`${relativeSpan} then \`${absolute}\``)).toBe(absolute);
  });
  it("runPrintedCommand refuses a command whose script word is relative, and a working directory inside the checkout", () => {
    const home = join(SCRATCH, `premise-${seq++}`, "home");
    mkdirSync(home, { recursive: true });
    expect(() => runPrintedCommand("`node install/uninstall.js --target /tmp/a/t`", { home })).toThrow(/relative/);
    const absolute = "`" + agentCommand("uninstall.js", "/tmp/a/t", [], commandContextFor({ grugopsHome: join(home, ".grugops"), home })) + "`";
    expect(() => runPrintedCommand(absolute, { home, cwd: REPO_ROOT })).toThrow(/inside the checkout/);
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

describe("REC-1: the `agents` field means chosen and not yet removed (D-26, IN-21; D-04's retry)", () => {
  // R18. THE CONVERSE IS DELIBERATELY NOT ASSERTED. The field records the agents chosen for the target and not yet
  // removed (install-marker.ts THE `agents` FIELD), not "the agents owning a holding entry": a chosen agent whose every
  // write was refused owns no entry and stays recorded, so a later unattended install chooses it again (D-04). The
  // invariant (every agent owning a holding entry is recorded) still holds over this row.
  it("R18: a Pi install whose template write is refused records [pi] with no entry of Pi's; a later `--yes` with no agent flag chooses Pi again, \"recorded in .grugops/install.json\"", () => {
    const w = world("r18");
    mkdirSync(at(w.target, ".pi"), { recursive: true });
    writeFileSync(at(w.target, ".pi/prompts"), "not a directory\n");
    const first = runInstall(w.target, w.grugopsHome, [flag("pi")], { home: w.home, timeoutMs: 180_000 });
    finished(first, "install --pi");
    expect(first.status, first.stdout).toBe(3);
    expect(agentsOf(w), first.stdout).toEqual(ids("pi"));
    expect(ledgerEntries(w).filter((e) => entryHolds(e) && entryOwners(e).includes(row("pi").id)), "premise: Pi owns no holding entry").toEqual([]);
    expectInvariant(w, ids("pi"), first.stdout);
    // agent-flag-census: R18 runs install.js with no agent flag on purpose, to show the recorded choice is retried (D-04)
    const again = spawnBin(INSTALL_JS, ["--yes"], w.target, w.grugopsHome, { home: w.home, timeoutMs: 180_000 });
    finished(again, "install --yes");
    const banner = again.stdout.split("\n").find((l) => l.startsWith("agents: "));
    expect(banner, again.stdout).toBe(`agents: ${row("pi").name} (recorded in ${MARKER_REL})`);
    expect(agentsOf(w), again.stdout).toEqual(ids("pi"));
    expectInvariant(w, ids("pi"), again.stdout);
  });
});

// ── the MSG-1 remedy rows: each runs the command a line printed ─────────────────────────────────────────────────

/** Why a directory mode cannot block a removal here, or null when the chmod row can run (the marker-rule tests' gate). */
const CHMOD_SKIP: string | null =
  process.platform === "win32"
    ? "win32: a directory mode does not stop a removal"
    : typeof process.getuid === "function" && process.getuid() === 0
      ? "running as root: a directory mode does not stop root's removal"
      : null;
if (CHMOD_SKIP !== null) console.log(`SKIP R12 of agents-record.test.ts — ${CHMOD_SKIP}`);

const linesWith = (stdout: string, label: string): string[] => stdout.split("\n").filter((l) => new RegExp(`^ {2}${label}\\s`).test(l));
/** A bare re-run remedy: "re-run uninstall" or "re-run the uninstaller" with no printed command on the same line. */
const BARE_RERUN = /re-?run (the )?uninstall(er)?\b/i;

describe("MSG-1: every kept arm and every re-run remedy prints a command that, run, finishes the job", () => {
  it.skipIf(CHMOD_SKIP !== null)(
    "R12: a recorded verify on a flag-less run (read-only .claude/agents) exits 3, keeps the marker, and the INCOMPLETE banner prints the flag-less command; undo the cause and run it: exit 0, the marker removed",
    () => {
      const w = world("r12");
      install(w, [flag("claude"), flag("codex")]);
      const agentsDir = at(w.target, ".claude/agents");
      chmodSync(agentsDir, 0o555); // mode-census: access-denial
      let r: Run;
      try {
        r = uninstall(w, []);
      } finally {
        chmodSync(agentsDir, 0o755); // mode-census: restore
      }
      expect(r.status, r.stdout).toBe(3);
      expect(existsSync(at(w.target, MARKER_REL)), r.stdout).toBe(true);
      expect(agentsOf(w), r.stdout).toEqual(ids("claude"));
      expectInvariant(w, ids("claude", "codex"), r.stdout);
      const flagless = agentCommand("uninstall.js", w.target, [], ctxOf(w));
      expect(r.stdout, "the INCOMPLETE banner does not print the finishing command").toContain(`  Then run \`${flagless}\` to finish the reversal.`);
      expect(printedFlags(r.stdout), r.stdout).toEqual([]);
      const fin = runPrinted(w, r.stdout);
      expect(fin.status, fin.stdout).toBe(0);
      expect(markerGone(w), fin.stdout).toBe(true);
    },
    300_000,
  );

  it("R13: the DRY_RUN preview of R4 changes zero bytes and prints the command the real run prints", () => {
    const w = world("r13");
    install(w, [flag("claude"), flag("codex")]);
    edit(w, CLAUDE_SKILL);
    const before = snapshotTree(w.target);
    const dry = uninstall(w, [flag("claude")], true);
    expect(dry.status, dry.stdout).toBe(0);
    expect(snapshotTree(w.target), `the DRY_RUN preview changed the tree\n${dry.stdout}`).toBe(before);
    const real = uninstall(w, [flag("claude")]);
    expect(real.status, real.stdout).toBe(0);
    expect(printedCommand(dry.stdout), dry.stdout).toBe(printedCommand(real.stdout));
    expect(printedCommand(real.stdout)).toBe(agentCommand("uninstall.js", w.target, [row("claude")], ctxOf(w)));
  });

  it("R14 (removeAskRules): a settings file that is not a JSON object prints this run's own command; restored, that command removes the ask rules and records [codex]", () => {
    const w = world("r14");
    install(w, [flag("claude"), flag("codex")]);
    const settings = at(w.target, ASK_RULES_REL);
    const saved = readFileSync(settings);
    const createdByInstall = (ledgerEntries(w).find((e) => e.kind === "ask-rules") as { createdFile?: boolean } | undefined)?.createdFile === true;
    writeFileSync(settings, "[]\n");
    const r = uninstall(w, [flag("claude")]);
    expect(r.status, r.stdout).toBe(3);
    const own = agentCommand("uninstall.js", w.target, [row("claude")], ctxOf(w));
    const named = linesWith(r.stdout, "verify").filter((l) => l.includes(ASK_RULES_REL));
    expect(named.length, r.stdout).toBeGreaterThan(0);
    expect(named.some((l) => l.includes(`\`${own}\``)), `the settings verify does not print ${own}\n${r.stdout}`).toBe(true);
    expect(r.stdout.split("\n").filter((l) => BARE_RERUN.test(l)), "a bare re-run remedy").toEqual([]);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex"));
    expectInvariant(w, ids("claude", "codex"), r.stdout);
    writeFileSync(settings, saved);
    const fin = runPrinted(w, r.stdout);
    expect(fin.status, fin.stdout).toBe(0);
    if (createdByInstall) {
      expect(existsSync(settings), `install created ${ASK_RULES_REL}, and it is still there\n${fin.stdout}`).toBe(false);
    } else {
      expect(readFileSync(settings, "utf8"), fin.stdout).not.toMatch(/Bash\(/);
    }
    expect(agentsOf(w), fin.stdout).toEqual(ids("codex"));
  });

  it("R15 (malformed ledger): the verify prints this run's own command; with the marker restored, that command removes Codex CLI's entry and records [claude]", () => {
    const w = world("r15");
    install(w, [flag("claude"), flag("codex")]);
    const markerPath = at(w.target, MARKER_REL);
    const saved = readFileSync(markerPath);
    writeFileSync(markerPath, JSON.stringify(withLedger(readMarkerObject(w.target), (es) => [...es, { kind: "file" }]), null, 2) + "\n");
    const r = uninstall(w, [flag("codex")]);
    expect(r.status, r.stdout).toBe(3);
    const own = agentCommand("uninstall.js", w.target, [row("codex")], ctxOf(w));
    const named = linesWith(r.stdout, "verify").filter((l) => /malformed install ledger/.test(l));
    expect(named.length, r.stdout).toBe(1);
    expect(named[0], r.stdout).toContain(`\`${own}\``);
    expect(r.stdout.split("\n").filter((l) => BARE_RERUN.test(l)), "a bare re-run remedy").toEqual([]);
    writeFileSync(markerPath, saved);
    const fin = runPrinted(w, r.stdout);
    expect(fin.status, fin.stdout).toBe(0);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
    expect(ledgerEntries(w).some((e) => e.path === AGENT_SKILL_REL), "the Codex CLI entry is still recorded").toBe(false);
    expect(agentsOf(w), fin.stdout).toEqual(ids("claude"));
  });

  // R33 (phase 34.1 gap round 2, D-33, plan 34.1-23): the install mode is carried like the kit home. A printed install
  // command of a `--symlink` run that dropped `--symlink` would run a copy install over the symlink install.
  it("R33 (D-33): a --symlink run with the Pi write refused prints a banner command that carries --symlink; run as printed from a scratch directory it finishes the install and keeps it a symlink install", () => {
    const w = world("r33");
    mkdirSync(at(w.target, ".pi"), { recursive: true });
    writeFileSync(at(w.target, ".pi/prompts"), "not a directory\n");
    const chosen = HOST_TOOLS.filter((h) => h.id === "claude" || h.id === "pi");
    expect(chosen.map((h) => h.id), "premise: the registry has both rows").toEqual(ids("claude", "pi"));
    const r = runInstall(w.target, w.grugopsHome, ["--symlink", ...chosen.map(agentFlag)], { home: w.home, timeoutMs: 180_000 });
    finished(r, "install --symlink --claude --pi");
    expect(r.status, `the Pi write is refused, so the run is incomplete\n${r.stdout}`).toBe(3);
    expect(readMarkerObject(w.target).installMode, r.stdout).toBe("symlink");
    const links = linksUnder([w.target, w.grugopsHome]);
    expect(links.length, "premise: a symlink install made some link (a Claude Code skill), so the check below is not vacuous").toBeGreaterThan(0);
    const banner = r.stdout.split("\n").filter((l) => l.startsWith("  Once each is fixed, `"));
    expect(banner, r.stdout).toHaveLength(1);
    const printed = printedCommand(banner[0]);
    expect(shellWords(printed), `the printed command of a --symlink run does not carry --symlink: ${printed}`).toContain("--symlink");
    expect(printed).toBe(agentCommand("install.js", w.target, chosen, commandContextFor({ grugopsHome: w.grugopsHome, home: w.home, symlink: true })));
    rmSync(at(w.target, ".pi/prompts"));
    const fin = runPrintedCommand(banner[0], { home: w.home, timeoutMs: 180_000 });
    finished(fin, `the printed command ${printed}`);
    expect(relative(REPO_ROOT, fin.premise.cwd).startsWith(".."), `premise: the printed command ran from ${fin.premise.cwd}, inside the checkout`).toBe(true);
    expect(fin.premise.grugopsHome, "premise: the default kit home, so the printed text sets none").toBeUndefined();
    expect(fin.status, fin.stdout + fin.stderr).toBe(0);
    expect(existsSync(at(w.target, PI_PROMPT_REL)), `the Pi template was not written\n${fin.stdout}`).toBe(true);
    expect(readMarkerObject(w.target).installMode, fin.stdout).toBe("symlink");
    const notLinks = links.filter((p) => !lstatSync(p).isSymbolicLink());
    expect(notLinks, `a link the first run made is no longer a link\n${fin.stdout}`).toEqual([]);
  }, 300_000);

  // R24 (phase 34.1 gap round 2, D-33, plan 34.1-24): uninstall.ts builds its context once (COMMAND_CONTEXT). An
  // uninstall.js command names the script by its absolute path and carries no kit home and no `--symlink`, because
  // uninstall.js removes by the install record and needs neither. This uninstall run was given no GRUGOPS_HOME, so its
  // context's kit home is the one the marker records (K), and the printed command still carries none. Run as printed
  // with no kit home from a scratch directory, it finishes the reversal and writes no kit under <HOME>/.grugops.
  it("R24 (D-33): install with another kit home, then uninstall --claude with no GRUGOPS_HOME over an edited skill prints `node <absolute uninstall.js> ...` with no kit home; restored and run as printed with no kit home, it records [codex] and writes no kit under HOME", () => {
    const w = world("r24");
    const K = join(dirname(w.home), "kit-k");
    const defaultKit = join(w.home, ".grugops");
    expect(pathText(K), "premise: the kit home is not the default").not.toBe(pathText(defaultKit));
    const i = runInstall(w.target, K, [flag("claude"), flag("codex")], { home: w.home, timeoutMs: 180_000 });
    finished(i, "install --claude --codex with kit home K");
    expect(i.status, i.stdout).toBe(0);
    expect(pathText(String(readMarkerObject(w.target).grugopsHome)), "premise: the marker records K").toBe(pathText(K));
    expect(existsSync(defaultKit), "premise: install wrote no kit under HOME").toBe(false);
    const original = edit(w, CLAUDE_SKILL);
    const r = runUninstall(w.target, K, { home: w.home, omitKitHome: true, timeoutMs: 120_000 }, [flag("claude")]);
    finished(r, "uninstall --claude with no GRUGOPS_HOME");
    expect(r.status, r.stdout).toBe(0);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex"));
    const printed = printedCommand(r.stdout);
    const words = shellWords(printed);
    // Builder-independent facts first: the expected side below is built by the builder under test.
    expect(words[0], `the printed command does not start with node: ${printed}`).toBe("node");
    expect(isAbsolute(words[1]), `the uninstall script is not named by its absolute path: ${printed}`).toBe(true);
    expect(pathText(words[1]), printed).toBe(pathText(UNINSTALL_JS));
    expect(printed, "an uninstall command carries no kit home").not.toContain("GRUGOPS_HOME=");
    expect(words, "an uninstall command carries no --symlink").not.toContain("--symlink");
    expect(printed).toBe(agentCommand("uninstall.js", w.target, [row("claude")], commandContextFor({ grugopsHome: K, home: w.home })));
    writeFileSync(at(w.target, CLAUDE_SKILL), original);
    const fin = runPrinted(w, r.stdout);
    expect(fin.premise.grugopsHome, "premise: the child had no kit home").toBeUndefined();
    expect(fin.status, fin.stdout + fin.stderr).toBe(0);
    expect(agentsOf(w), fin.stdout).toEqual(ids("codex"));
    expect(existsSync(at(w.target, CLAUDE_SKILL)), fin.stdout).toBe(false);
    expect(existsSync(defaultKit), `the printed command wrote a kit under HOME\n${fin.stdout}`).toBe(false);
  }, 300_000);
});

// ── D-33 (WR-20): the unusable-marker remedy, followed as printed (plan 34.1-25) ─────────────────────────────────────
//
// The rule (34.1-GAP-PLANNING-BRIEF.md §4, WR-20): a remedy names concrete flags from THIS run, and a test follows a
// multi-step remedy end to end. When uninstall cannot use the marker because it is another directory's record (the
// repository was moved), the verify's second remedy is two printed commands: the install command with this run's own
// agents (reinstallCommand), then this run's own uninstall command (rerunCommand). R25 is the verifier's S3 with the
// WR-19 condition added (no GRUGOPS_HOME in the uninstall run, the marker's kit home is not the default): it follows
// both steps as printed and asserts the branch the run takes. Install leaves the old Codex skill untouched and does
// not record it; the second uninstall names it on a `left` line (uninstall.ts reportUnrecordedHostEntries) and keeps
// its bytes, which is what the remedy says ("left and reported").

/** The `left` lines of a run that name `rel` as the path. */
const leftLinesNaming = (stdout: string, rel: string): string[] =>
  linesWith(stdout, "left").filter((l) => l.replace(/^ {2}left\s+/, "").startsWith(`${rel} (`));

describe("D-33 (WR-20): the unusable-marker remedy, followed as printed", () => {
  it("R25 (WR-20): install --claude --codex with kit home K, move the target, uninstall --codex with no GRUGOPS_HOME prints the install command with --codex and K, then the uninstall command; run as printed, the second uninstall reports the old Codex skill on a `left` line and keeps its bytes, and no kit appears under HOME", () => {
    const w = world("r25");
    const K = join(dirname(w.home), "kit-k");
    const defaultKit = join(w.home, ".grugops");
    expect(pathText(K), "premise: the kit home is not the default").not.toBe(pathText(defaultKit));
    const i = runInstall(w.target, K, [flag("claude"), flag("codex")], { home: w.home, timeoutMs: 180_000 });
    finished(i, "install --claude --codex with kit home K");
    expect(i.status, i.stdout).toBe(0);
    expect(existsSync(defaultKit), "premise: install wrote no kit under HOME").toBe(false);
    const b = join(dirname(w.target), "b", "target");
    mkdirSync(dirname(b), { recursive: true });
    renameSync(w.target, b);
    const moved: World = { ...w, target: b };
    const skill = at(b, AGENT_SKILL_REL);
    expect(existsSync(skill), "premise: the moved target holds the Codex skill").toBe(true);
    const skillBytes = readFileSync(skill);

    const r = runUninstall(b, K, { home: w.home, omitKitHome: true, timeoutMs: 120_000 }, [flag("codex")]);
    finished(r, "uninstall --codex in the moved target with no GRUGOPS_HOME");
    expect(r.status, r.stdout).toBe(3);
    const verifies = linesWith(r.stdout, "verify").filter((l) => l.includes(".grugops/install.json") && l.includes("not this directory's record"));
    expect(verifies.length, r.stdout).toBe(1);
    const v = verifies[0];
    expect(r.stdout, "the remedy no longer says any agent flag will do").not.toMatch(/any agent flag/);
    const cmds = printedCommands(v);
    expect(cmds.length, `premise: the verify printed commands\n${v}`).toBeGreaterThan(0);
    // Builder-independent facts about the install step first: the expected side below is built by the builder under test.
    const installSpans = cmds.filter((c) => shellWords(c).some((x) => isAbsolute(x) && pathText(x) === pathText(INSTALL_JS)));
    expect(installSpans.length, `the verify names one install command\n${v}`).toBe(1);
    const iw = shellWords(installSpans[0]);
    expect(iw[0].startsWith("GRUGOPS_HOME="), `the install command carries no kit home: ${installSpans[0]}`).toBe(true);
    expect(pathText(iw[0].slice("GRUGOPS_HOME=".length)), `the install command's kit home is not the marker's: ${installSpans[0]}`).toBe(pathText(K));
    expect(iw[1], `the install command's second word is not node: ${installSpans[0]}`).toBe("node");
    expect(isAbsolute(iw[2]) && pathText(iw[2]) === pathText(INSTALL_JS), `the install script is not this checkout's install.js by its absolute path: ${installSpans[0]}`).toBe(true);
    expect(iw, `the install command does not name this run's agent: ${installSpans[0]}`).toContain("--codex");
    expect(iw, "the install command names an agent this run did not name").not.toContain("--claude");
    const ctx = commandContextFor({ grugopsHome: K, home: w.home });
    const installCmd = agentCommand("install.js", b, [row("codex")], ctx);
    const uninstallCmd = agentCommand("uninstall.js", b, [row("codex")], ctx);
    // In order: the "same repository moved" remedy's command, then the install step, then the uninstall step.
    expect(cmds, v).toEqual([uninstallCmd, installCmd, uninstallCmd]);

    const step1 = runPrintedCommand("`" + installCmd + "`", { home: w.home, timeoutMs: 180_000 });
    finished(step1, `the printed install command ${installCmd}`);
    expect(relative(REPO_ROOT, step1.premise.cwd).startsWith(".."), `premise: the printed command ran from ${step1.premise.cwd}`).toBe(true);
    expect(pathText(String(step1.premise.grugopsHome)), "premise: the child's kit home is the printed one").toBe(pathText(K));
    expect(step1.status, step1.stdout + step1.stderr).toBe(0);
    const untouched = linesWith(step1.stdout, "skipped").filter((l) => l.includes(`${AGENT_SKILL_REL} (`) && l.includes("a file is already there — left untouched"));
    expect(untouched.length, `install did not leave the existing Codex skill untouched\n${step1.stdout}`).toBe(1);
    expect(agentsOf(moved), step1.stdout).toEqual(ids("codex"));
    expect(ledgerEntries(moved).some((e) => e.path === AGENT_SKILL_REL), "install recorded the file it left untouched").toBe(false);
    expect(existsSync(defaultKit), `the printed install command wrote a kit under HOME\n${step1.stdout}`).toBe(false);

    const step2 = runPrinted(moved, "`" + uninstallCmd + "`");
    expect(step2.status, step2.stdout + step2.stderr).toBe(0);
    expect(step2.stdout, "the second uninstall says Codex CLI is not installed").not.toMatch(/Codex CLI is not installed here/);
    expect(leftLinesNaming(step2.stdout, AGENT_SKILL_REL).length, `no left line names the old Codex skill\n${step2.stdout}`).toBe(1);
    expect(existsSync(skill) && readFileSync(skill).equals(skillBytes), `the old Codex skill was changed or removed\n${step2.stdout}`).toBe(true);
    expect(existsSync(defaultKit), `a kit appeared under HOME\n${step2.stdout}`).toBe(false);
  }, 600_000);

  // R28 (plan 34.1-26, D-31, review IN-27): over a marker this run cannot use, which agents are installed is unknown, not
  // "none". The `agents to remove` line, the per-flag note and the closing banner say so, and each points at the
  // verify line printed above it. Every shape for which installedAgents answers "none" while a marker is present is a
  // row: another directory's marker (R25's moved target), a marker with no install ledger, a marker that is not JSON,
  // and a marker with no `agents` field whose ledger is malformed.
  it("R28 (IN-27): over a marker this run cannot use, `uninstall --codex` says which agents are installed is unknown on the agents line, the per-flag note and the closing banner, and never 'is not installed here' or 'still installed: none'", () => {
    const shapes: ReadonlyArray<readonly [what: string, make: (t: string) => void]> = [
      ["another directory's marker (the target moved)", () => undefined],
      ["a marker with no install ledger", (t) => {
        const m = readMarkerObject(t);
        delete m.ledger;
        writeFileSync(at(t, MARKER_REL), JSON.stringify(m, null, 2) + "\n");
      }],
      ["a marker that is not JSON", (t) => writeFileSync(at(t, MARKER_REL), "not json\n")],
      ["a marker with no agents field and a malformed ledger", (t) => {
        const m = readMarkerObject(t);
        delete m.agents;
        m.ledger = "not a list";
        writeFileSync(at(t, MARKER_REL), JSON.stringify(m, null, 2) + "\n");
      }],
    ];
    for (const [what, make] of shapes) {
      const w = world("r28");
      install(w, [flag("claude"), flag("codex")]);
      let t = w.target;
      if (what.startsWith("another directory")) {
        t = join(dirname(w.target), "b", "target");
        mkdirSync(dirname(t), { recursive: true });
        renameSync(w.target, t);
      }
      make(t);
      const r = runUninstall(t, w.grugopsHome, { home: w.home, timeoutMs: 120_000 }, [flag("codex")]);
      finished(r, `uninstall --codex over ${what}`);
      const out = r.stdout.split("\n");
      expect(r.status, `${what}\n${r.stdout}`).toBe(3);
      // The candidate lines are printed (no vacuous pass on zero matches).
      const agentsLine = out.findIndex((l) => l.startsWith("agents to remove: "));
      expect(agentsLine, `${what}: no agents to remove line\n${r.stdout}`).toBeGreaterThanOrEqual(0);
      const notes = linesWith(r.stdout, "note").filter((l) => l.includes(`${flag("codex")}: `));
      expect(notes.length, `${what}: no per-flag note for ${flag("codex")}\n${r.stdout}`).toBe(1);
      const banners = out.filter((l) => l.startsWith("== uninstall "));
      expect(banners.length, `${what}: no closing banner\n${r.stdout}`).toBe(1);
      // What each says (literal words, not the product's own builder).
      expect(out[agentsLine], what).toBe("agents to remove: unknown (the marker cannot be used; see the verify line above)");
      expect(notes[0], what).toMatch(/--codex: whether Codex CLI is installed here is unknown \(the marker cannot be used\), so nothing is removed for it$/);
      expect(banners[0], what).toContain("no agent removed (which agents are installed here is unknown: the marker cannot be used; see the verify line above)");
      // The verify line it points at is printed above the agents line.
      const firstVerify = out.findIndex((l) => /^ {2}verify\s/.test(l));
      expect(firstVerify >= 0 && firstVerify < agentsLine, `${what}: no verify line above the agents line\n${r.stdout}`).toBe(true);
      expect(out.filter((l) => /is not installed here|still installed: none/.test(l)), `${what}: a line states an installed set the run did not read`).toEqual([]);
    }
  }, 900_000);
});

// ── D-32: printed alternatives that touch the marker or its ledger (CR-03) ───────────────────────────────────────────
//
// The rule (34.1-GAP-PLANNING-BRIEF.md §4): every remedy the installer prints, by-hand alternatives included, leaves
// every staying agent reversible. uninstall.ts keepWithoutRecord is the one wording of the alternative to finishing a
// kept reversal, asked by the kept `left` line and the KEPT_FOR banner. R19 holds its partial branch by following the
// printed alternative and then removing the staying agent; R20 holds its FULL branch.

/** The kept `left` line about the marker (removeMarker's kept arm). */
const keptMarkerLine = (stdout: string): string[] => linesWith(stdout, "left").filter((l) => l.includes(`${MARKER_REL} (kept:`));
/** The KEPT_FOR banner's second line. */
const keptBannerLine = (stdout: string): string[] => stdout.split("\n").filter((l) => l.startsWith("  To finish:"));

// ── the by-hand remedy census (plan 34.1-20, D-32; brief §2.3, §4) ──────────────────────────────────────────────────
//
// Every printed alternative that touches .grugops/install.json or its ledger, found by a TypeScript parser walk over
// the string expressions of every product module (install/*.ts that is not a test, test-support or declaration file,
// from git), never by a line regex. A string expression is maximal: a template literal with its substitutions, the
// `+` chain and parentheses around it, and a conditional whose branch it is. It is read once per VARIANT: each
// conditional (`c ? a : b`) inside it gives one reading per branch, tagged with its condition; a contradictory pair of
// tags is dropped. `${MARKER_REL}` and `${markerRel}` read as `.grugops/install.json`; any other substitution reads as
// its source text. A variant is in the census when it matches TOUCH (a remedy verb whose object reaches the marker, its
// ledger or its `agents` field before a full stop) or holds "by hand" together with one of those nouns.
//
// Each variant carries a FULL guard: "FULL" or "partial" when FULL decides it (a conditional on FULL in the expression,
// an enclosing `if (FULL)` branch, or an earlier `if (FULL) { return }` in the same block), else "either". The census
// equals CENSUS_TABLE both ways, keyed by module, enclosing function, guard and the whole normalized reading, and each
// class is asserted against what its rows say (CLASS_RULES), with the per-class counts pinned.

/** The marker's spelling in the product (MARKER_REL in both binaries, markerRel in install.ts writeMarker). */
const MARKER_SPELLINGS: ReadonlySet<string> = new Set(["MARKER_REL", "markerRel"]);
const NOUN = /\b(marker|install\.json|ledger)\b|`agents`/i;
const TOUCH = /\b(delete|remove|take|fix|set)\b[^.]*(\b(marker|install\.json|ledger)\b|`agents`)/i;
const BY_HAND = /\bby hand\b/i;
/** The delete-the-marker text: telling the user to delete the marker. "never delete" is its opposite. */
const DELETE_MARKER = /(?<!never )\bdelete (the marker|\.grugops\/install\.json)\b/i;

type Guard = "FULL" | "partial" | "either";
interface Variant {
  readonly text: string;
  readonly conds: ReadonlyMap<string, boolean>;
}
interface CensusSite {
  readonly module: string;
  readonly fn: string;
  readonly guard: Guard;
  readonly text: string;
  readonly line: number;
}

/** The source text of a condition and its polarity, with `!` and parentheses peeled. */
function condKey(e: ts.Expression): [string, boolean] {
  let pol = true;
  let x: ts.Expression = e;
  for (;;) {
    if (ts.isPrefixUnaryExpression(x) && x.operator === ts.SyntaxKind.ExclamationToken) {
      pol = !pol;
      x = x.operand;
    } else if (ts.isParenthesizedExpression(x)) x = x.expression;
    else return [x.getText(), pol];
  }
}
function joinVariants(a: Variant, b: Variant): Variant | null {
  const conds = new Map(a.conds);
  for (const [k, v] of b.conds) {
    if (conds.has(k) && conds.get(k) !== v) return null;
    conds.set(k, v);
  }
  return { text: a.text + b.text, conds };
}
function crossVariants(xs: readonly Variant[], ys: readonly Variant[]): Variant[] {
  const out: Variant[] = [];
  for (const x of xs) for (const y of ys) {
    const j = joinVariants(x, y);
    if (j !== null) out.push(j);
  }
  return out;
}
const plain = (text: string): Variant[] => [{ text, conds: new Map() }];
/** Every reading of a string expression, one per consistent choice of its conditionals' branches. */
function readingsOf(e: ts.Node): Variant[] {
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return plain(e.text);
  if (ts.isParenthesizedExpression(e)) return readingsOf(e.expression);
  if (ts.isTemplateExpression(e)) {
    let acc = plain(e.head.text);
    for (const s of e.templateSpans) acc = crossVariants(crossVariants(acc, readingsOf(s.expression)), plain(s.literal.text));
    return acc;
  }
  if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.PlusToken) return crossVariants(readingsOf(e.left), readingsOf(e.right));
  if (ts.isConditionalExpression(e)) {
    const [k, pol] = condKey(e.condition);
    const tag = (v: Variant, p: boolean): Variant | null => joinVariants({ text: "", conds: new Map([[k, p]]) }, v);
    return [
      ...readingsOf(e.whenTrue).map((v) => tag(v, pol)),
      ...readingsOf(e.whenFalse).map((v) => tag(v, !pol)),
    ].filter((v): v is Variant => v !== null);
  }
  if (ts.isIdentifier(e) && MARKER_SPELLINGS.has(e.text)) return plain(MARKER_REL);
  return plain("${" + e.getText() + "}");
}
/** The maximal string expression a string fragment sits in. */
function maximalString(n: ts.Node): ts.Node {
  let e: ts.Node = ts.isTemplateHead(n) ? n.parent : ts.isTemplateMiddle(n) || ts.isTemplateTail(n) ? n.parent.parent : n;
  for (;;) {
    const p = e.parent;
    if (ts.isTemplateSpan(p) && p.expression === e) e = p.parent;
    else if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.PlusToken) e = p;
    else if (ts.isParenthesizedExpression(p)) e = p;
    else if (ts.isConditionalExpression(p) && p.condition !== e) e = p;
    else return e;
  }
}
const alwaysLeaves = (s: ts.Statement): boolean =>
  ts.isReturnStatement(s) || ts.isThrowStatement(s) || (ts.isBlock(s) && s.statements.length > 0 && alwaysLeaves(s.statements[s.statements.length - 1]));
/** The conditions that decide whether `n` runs, within its function: enclosing if branches and earlier early returns. */
function statementGuards(n: ts.Node): Map<string, boolean> {
  const g = new Map<string, boolean>();
  let child: ts.Node = n;
  for (let p: ts.Node | undefined = n.parent; p !== undefined; child = p, p = p.parent) {
    if (ts.isIfStatement(p) && p.expression !== child) {
      const [k, pol] = condKey(p.expression);
      g.set(k, p.thenStatement === child ? pol : !pol);
    }
    if (ts.isBlock(p) || ts.isSourceFile(p)) {
      for (const s of p.statements) {
        if (s === child) break;
        if (ts.isIfStatement(s) && s.elseStatement === undefined && alwaysLeaves(s.thenStatement)) {
          const [k, pol] = condKey(s.expression);
          if (!g.has(k)) g.set(k, !pol);
        }
      }
    }
    if (ts.isFunctionLike(p)) break;
  }
  return g;
}
/** Every tracked install/*.ts that is not a test, test-support or declaration file, from git. */
function productModules(): string[] {
  const listed = execFileSync("git", ["ls-files", "--", "install"], { cwd: REPO_ROOT, encoding: "utf8" });
  return listed
    .split("\n")
    .filter((f) => /^install\/[^/]+\.ts$/.test(f) && !/\.(test|test-support|d)\.ts$/.test(f))
    .map((f) => f.slice("install/".length))
    .sort();
}
/** The census: every variant of every maximal string expression that touches the marker, its ledger or `agents`. */
function remedyCensus(): CensusSite[] {
  const out: CensusSite[] = [];
  for (const module of productModules()) {
    const sf = parse(`install/${module}`);
    const seen = new Set<ts.Node>();
    const isFragment = (n: ts.Node): boolean =>
      ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n);
    for (const f of nodesOf(sf, (n): n is ts.Node => isFragment(n))) {
      const m = maximalString(f);
      if (seen.has(m)) continue;
      seen.add(m);
      const guards = statementGuards(m);
      for (const v of readingsOf(m)) {
        const text = v.text.replace(/\s+/g, " ").trim();
        if (!TOUCH.test(text) && !(BY_HAND.test(text) && NOUN.test(text))) continue;
        const conds = new Map([...guards, ...v.conds]);
        const guard: Guard = conds.has("FULL") ? (conds.get("FULL") === true ? "FULL" : "partial") : "either";
        out.push({ module, fn: enclosing(m), guard, text, line: sf.getLineAndCharacterOfPosition(m.getStart(sf)).line + 1 });
      }
    }
  }
  return out;
}

type RemedyClass =
  | "usable record, FULL only"
  | "usable record, split by FULL"
  | "not a usable record"
  | "per entry"
  | "per field"
  | "fix"
  | "touches no record"
  | "not a printed alternative";
type CensusRow = readonly [module: string, fn: string, guard: Guard, text: string, cls: RemedyClass, why: string];

/**
 * THE TABLE (derived at execution of plan 34.1-20, after plan 34.1-19 and this plan's Task 1, by the walk above; not
 * copied from the plan's sibling table). A new or changed printed alternative fails as unclassified until it is classed
 * here, and it is classed only once it does what its class says: a breaking site is fixed in the product.
 */
const CENSUS_TABLE: readonly CensusRow[] = [
  // usable record, FULL only (U1, U2): keepWithoutRecord's FULL branch, the one place the delete-the-marker text is written.
  ["uninstall.ts", "keepWithoutRecord", "FULL", "or delete the marker by hand to keep them without a record", "usable record, FULL only", "the kept `left` line's alternative; no agent stays installed on a FULL run"],
  ["uninstall.ts", "keepWithoutRecord", "FULL", "or, to keep them, delete .grugops/install.json by hand (uninstall then has no record of them and changes nothing more)", "usable record, FULL only", "the KEPT_FOR banner's alternative; no agent stays installed on a FULL run"],
  // usable record, split by FULL (U4): install's own marker with a malformed ledger.
  ["uninstall.ts", "removeMarker", "FULL", ".grugops/install.json (its install ledger is malformed, so the record of what install did could not be used; it was left in place — fix or remove it by hand)", "usable record, split by FULL", "FULL run: no agent stays installed, so removing the marker drops no staying agent's record"],
  ["uninstall.ts", "removeMarker", "partial", ".grugops/install.json (its install ledger is malformed, so the record of what install did could not be used; it was left in place — fix the ledger field by hand: the marker is still the record of every agent installed here, so removing it would leave each of them with no record)", "usable record, split by FULL", "partial run: the marker is the record of every agent installed here, so only the field is fixed"],
  // not a usable record (U3, I1, I5, I6, and the legacy-marker verify): no run reads a record from it, before or after the remedy.
  ["uninstall.ts", "removeMarker", "either", ".grugops/install.json (it could not be read as install's marker: ${why}; it was left in place — fix or remove it by hand)", "not a usable record", "U3: not a JSON object, a damaged file, or gone when the run started; installedAgents reads no agent from it"],
  ["install.ts", "markerUnreadable", "either", "the install marker ${markerFile} is present but ${markerUnusableText(read)} — the install state of ${TARGET} is unknown, so nothing else was checked. Fix or remove the marker, then re-run install.js (then install.js --check)", "not a usable record", "I1: the doctor's unreadable marker (markerUnusableText)"],
  ["install.ts", "writeAskRules", "either", ".grugops/install.json ${markerUnusableText(previousMarker)}, so the install ledger is unknown — no ask rule was added to ${rel} and the marker was left as it was. Fix or remove the marker, then re-run the installer.", "not a usable record", "I5: readInstallMarker answered unreadable"],
  ["install.ts", "askRulesStep", "either", ".grugops/install.json ${markerUnusableText(previousMarker)}, so the install ledger is unknown — the marker was left as it was. Fix or remove the marker, then re-run the installer.", "not a usable record", "I6: readInstallMarker answered unreadable (Claude Code not chosen)"],
  ["uninstall.ts", "<module>", "either", ".grugops/install.json is install's marker, but not a record this run can use: ${MARKER_READ.why}. So none of its records is used here, and this run removes and edits nothing. Re-run install.js here, then uninstall with `${rerunCommand()}`: install, with any agent flag (every install writes the marker, whatever agents it names), writes a marker for this directory with the install ledger and carries none of these records, so what an earlier install made here is then left and reported, for you to remove by hand.", "not a usable record", "a marker written before markers were bound or before the one ledger: this build reads no record from it, so the re-install that replaces it drops none"],
  // per entry (U5, plan 34.1-19's partial-run alternative): only named ledger entries leave the record.
  ["uninstall.ts", "updateKeptMarker", "either", "it still lists what this run removed or reversed (${what}); take those entries out of its install ledger by hand, or a later run may act on them", "per entry", "U5: only the entries this run already removed or reversed"],
  ["uninstall.ts", "keepWithoutRecord", "partial", "or, to keep it, take its entry out of the install ledger in .grugops/install.json by hand${then}; never delete ${marker}: it is still the record of ${nameList(STAYING)}", "per entry", "the held entry only; the marker stays the record of the staying agents (R19)"],
  ["uninstall.ts", "keepWithoutRecord", "partial", "or, to keep them, take their entries out of the install ledger in .grugops/install.json by hand${then}; never delete ${marker}: it is still the record of ${nameList(STAYING)}", "per entry", "the held entries only; the marker stays the record of the staying agents (R19)"],
  // per field (U6): one field set to the value the run computed.
  ["uninstall.ts", "updateKeptMarker", "either", "its `agents` list still names the agents this run removed; set it to ${agentsNow} by hand, or a later install chooses them again", "per field", "U6: the value is agentsAfter's, which agentsToRecord derives"],
  // fix: the record is repaired in place and every agent's record stays.
  ["uninstall.ts", "<module>", "either", ".grugops/install.json is install's marker, but not this directory's record: ${MARKER_READ.why}. So none of its records is used here (the install ledger), and this run removes and edits nothing on it. If this is the same repository moved or renamed from ${MARKER_READ.boundTo}, set \"target\" in the marker to ${JSON.stringify(here)} and run `${rerunCommand()}` again. Otherwise run `${reinstallCommand()}`: it writes a marker for this directory and carries none of these records; then run `${rerunCommand()}`: what an earlier install made here is then left and reported, for you to remove by hand.", "fix", "U7: set \"target\"; the re-install is offered only when the records are another directory's"],
  ["uninstall.ts", "<module>", "either", ".grugops/install.json is install's marker, but not this directory's record: ${MARKER_READ.why}. So none of its records is used here (the install ledger), and this run removes and edits nothing on it. If this is the same repository moved or renamed, set \"target\" in the marker to ${JSON.stringify(here)} and run `${rerunCommand()}` again. Otherwise run `${reinstallCommand()}`: it writes a marker for this directory and carries none of these records; then run `${rerunCommand()}`: what an earlier install made here is then left and reported, for you to remove by hand.", "fix", "U7 (no boundTo recorded): as above"],
  ["install.ts", "doctor", "either", "the install marker ${markerFile} is not this directory's record: ${markerRead.why}. Uninstall uses none of its records here and changes nothing. If this is the same repository moved or renamed, set \"target\" in the marker to ${JSON.stringify(markerRead.here ?? TARGET)}; otherwise re-run install.js here, which writes a marker for this directory and carries none of these records", "fix", "the doctor's unbound marker: set \"target\"; the re-install is offered only when the records are another directory's"],
  ["install.ts", "doctor", "either", "the install marker ${markerFile} holds a malformed install ledger (${ledgerRead.why}) — install writes it back as found, uninstall uses none of it and keeps the marker, and both report a verify finding (exit 3). Fix the ledger field by hand", "fix", "I2: the doctor's malformed ledger"],
  ["install.ts", "writeMarker", "either", ".grugops/install.json — the install ledger is malformed (${previousLedger.why}), so it was written back unchanged and nothing this run did was recorded. Uninstall will remove and edit nothing on it; fix the ledger field by hand to restore the record.", "fix", "I3: writeMarker's malformed ledger"],
  ["install.ts", "writeAskRules", "either", "${rel} — the install ledger in .grugops/install.json is malformed (${previousRead.why}), so no ask rule was added and the ledger is written back unchanged. Fix the ledger field, then re-run the installer.", "fix", "I4: the ask-rules step's malformed ledger"],
  ["uninstall.ts", "<module>", "either", ".grugops/install.json holds a malformed install ledger (${LEDGER.why}), so what install created, wrote and changed here is unknown. No empty directory, no file install may have created, no grugops skill or adapter file and no pointer block is removed, .gemini/settings.json is not edited and no ask rule is removed — fix the ledger field and run `${rerunCommand()}` again, or remove them by hand once you have confirmed they are yours to remove.", "fix", "the module-top malformed-ledger verify: fix the field; the by-hand alternative is about the files, not the marker"],
  // touches no record: the by-hand remedy is about a file, a block or a rule; the marker or ledger is only named as the reason.
  ["uninstall.ts", "removeSentinelBlock", "either", "${label} (the grugops block in it no longer matches the block install recorded appending — a line inside it was added, edited or removed, its line ends or spacing changed, or a marker line is missing — so nothing was removed and the file was left as it is; remove the grugops lines by hand, keeping any line of yours)", "touches no record", "the pointer block's lines; \"marker line\" is the block's own sentinel"],
  ["uninstall.ts", "removeAskRules", "either", "${rel}: ${read.at} ${read.reason}. It was not read and was left untouched; the ${ledger.size} ask rule(s) grugops added were NOT removed. Remove them by hand.", "touches no record", "the ask rules in the settings file"],
  ["uninstall.ts", "removeAskRules", "either", "${rel} is not a JSON object — left untouched; the ${ledger.size} ask rule(s) grugops added were NOT removed. Fix the file, then run `${rerunCommand()}` again, or remove them by hand.", "touches no record", "the settings file and its ask rules"],
  ["uninstall.ts", "removeAskRules", "either", "${rel} ${doc.why} — left untouched; the ${ledger.size} ask rule(s) grugops added were NOT removed. Fix the file, then run `${rerunCommand()}` again, or remove them by hand.", "touches no record", "the settings file and its ask rules"],
  ["uninstall.ts", "removeAskRules", "either", "${rel} has more than one \"permissions\" or \"permissions.ask\" key, so which one Claude Code reads is not known — left untouched; the ${ledger.size} ask rule(s) grugops added were NOT removed. Remove them by hand.", "touches no record", "the ask rules in the settings file"],
  ["uninstall.ts", "removeAskRules", "either", "${r} (present in ${rel} but not in the install ledger — there is no record that install added this copy, so it is left in place; remove it by hand if grugops added it)", "touches no record", "one ask rule"],
  ["uninstall.ts", "unrecordedFileReason", "either", "there is no install marker, so there is no record that install wrote it — left in place; remove it by hand if grugops put it there", "touches no record", "one file; there is no marker"],
  ["uninstall.ts", "reportUnrecordedSettings", "either", "${rel} (the install ledger has no gemini entry, so there is no record of what install changed in it — left untouched; if grugops added AGENTS.md to context.fileName, remove that entry by hand)", "touches no record", "one entry of .gemini/settings.json"],
  ["uninstall.ts", "reportUnrecordedSettings", "either", "${rel} ask rules — .grugops/install.json could not be used as install's marker (${MARKER.why}), so the ledger of rules grugops added is unknown and NO ask rule was removed. Remove the grugops ask rules by hand.", "touches no record", "the ask rules in the settings file"],
  ["uninstall.ts", "rmdirIfEmpty", "either", "${d} (install created this directory and it is empty, but it could not be removed (${why}); a directory keeps neither the marker nor an agent recorded, so remove it by hand once that is fixed)", "touches no record", "a directory install created (plan 34.1-21, DI-07); the marker is named only to say the directory does not hold it"],
  ["uninstall.ts", "<module>", "either", ".grugops/install.json ${markerUnusableText(MARKER)}, so the install ledger is unknown. No empty directory, no file install may have created, no grugops skill or adapter file and no pointer block is removed, and .gemini/settings.json is not edited — remove them by hand once you have confirmed they are yours to remove.", "touches no record", "the files the line lists"],
  // not a printed alternative: this run's own (DRY_RUN) description of the rewrite it makes.
  ["uninstall.ts", "said", "either", "the entries this run would remove or reverse would be taken out of its install ledger: ${what}", "not a printed alternative", "updateKeptMarker's DRY_RUN wording of its own ledger rewrite"],
];
/** Per-class counts, measured at execution of plan 34.1-20 (31 sites: install.ts 7, uninstall.ts 24; the other 7 product modules print none).
 * 32 since plan 34.1-21 (DI-07): rmdirIfEmpty's failed-removal `left` line, "touches no record" 10 -> 11, uninstall.ts 24 -> 25. */
const CENSUS_CLASS_COUNTS: Readonly<Record<RemedyClass, number>> = {
  "usable record, FULL only": 2,
  "usable record, split by FULL": 2,
  "not a usable record": 5,
  "per entry": 3,
  "per field": 1,
  fix: 7,
  "touches no record": 11,
  "not a printed alternative": 1,
};
/** What every row of a class must say, so a row cannot be classed against its text. */
const CLASS_RULES: Readonly<Record<RemedyClass, (s: CensusSite) => string | null>> = {
  "usable record, FULL only": (s) =>
    s.guard === "FULL" && s.fn === "keepWithoutRecord" && DELETE_MARKER.test(s.text) ? null : "not keepWithoutRecord's FULL branch with the delete text",
  "usable record, split by FULL": (s) =>
    s.guard === "FULL"
      ? /\bremove it by hand\b/.test(s.text) ? null : "the FULL arm does not offer removing it"
      : s.guard === "partial" && /\bfix the ledger field by hand\b/.test(s.text) && /\bstill the record of\b/.test(s.text) && !/\b(remove|delete) it by hand\b/.test(s.text) && !DELETE_MARKER.test(s.text)
        ? null
        : "the partial arm does not say fix the field because the marker is still the record, or it offers removing it",
  "not a usable record": (s) =>
    /could not be read as install's marker|\$\{markerUnusableText\((read|previousMarker)\)\}|not a record this run can use/.test(s.text) ? null : "names no reason the record is unusable",
  "per entry": (s) => (/\bout of (its|the) install ledger\b/.test(s.text) && !DELETE_MARKER.test(s.text) ? null : "is not a per-entry ledger edit"),
  "per field": (s) => (/`agents` list\b.*\bset it to\b/.test(s.text) ? null : "is not a per-field edit of `agents`"),
  fix: (s) => (/\bfix the ledger field\b|\bset "target" in the marker\b/i.test(s.text) && !DELETE_MARKER.test(s.text) ? null : "is not a fix of the field"),
  "touches no record": (s) => (!TOUCH.test(s.text) && !DELETE_MARKER.test(s.text) ? null : "its remedy verb reaches the marker or its ledger"),
  "not a printed alternative": (s) => (s.fn === "said" && /\bwould be taken out\b/.test(s.text) ? null : "is not the DRY_RUN wording of the run's own rewrite"),
};
const censusKey = (module: string, fn: string, guard: Guard, text: string): string => `${module} :: ${fn} :: {${guard}} :: ${text}`;
function countBy<T>(items: readonly T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) out[key(i)] = (out[key(i)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

describe("D-32: printed alternatives that touch the marker or its ledger (CR-03)", () => {
  it("R19 (CR-03, partial): uninstall --codex over an edited shared skill never offers deleting the marker; following the printed alternative records [claude] and keeps the file; uninstall --claude then removes Claude Code", () => {
    const w = world("r19");
    install(w, [flag("claude"), flag("codex")]);
    const ask = ledgerEntries(w).find((e) => e.kind === "ask-rules") as { added?: readonly string[]; createdFile?: boolean } | undefined;
    expect(ask, "PREMISE: install recorded Claude Code's ask rules").toBeDefined();
    const original = edit(w, AGENT_SKILL_REL);
    const edited = readFileSync(at(w.target, AGENT_SKILL_REL));
    expect(edited.equals(original), "PREMISE: the edit changed the shared skill").toBe(false);

    const r = uninstall(w, [flag("codex")]);
    expect(r.status, r.stdout).toBe(0);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex"));
    expectInvariant(w, ids("claude", "codex"), r.stdout);
    const line = keptMarkerLine(r.stdout);
    const banner = keptBannerLine(r.stdout);
    expect(line.length, `no kept \`left\` line about the marker\n${r.stdout}`).toBe(1);
    expect(banner.length, `no KEPT_FOR banner\n${r.stdout}`).toBe(1);
    expect(line[0], r.stdout).toContain("never delete the marker");
    expect(banner[0], r.stdout).toContain(`never delete ${MARKER_REL}`);
    for (const l of [line[0], banner[0]]) {
      expect(l, `the line does not name the agent the marker still records\n${r.stdout}`).toContain(`it is still the record of ${row("claude").name}`);
      expect(l, r.stdout).toContain("out of the install ledger");
    }
    expect(r.stdout, "a partial run offers deleting the marker").not.toContain("delete the marker by hand to keep");
    expect(r.stdout, "a partial run offers deleting the marker").not.toContain(`delete ${MARKER_REL} by hand`);

    // Follow the printed alternative: take the held entry out of the ledger by hand, then run the printed command.
    const markerPath = at(w.target, MARKER_REL);
    let taken = 0;
    const next = withLedger(readMarkerObject(w.target), (es) =>
      es.filter((e) => {
        const drop = e.path === AGENT_SKILL_REL && e.kind === "file";
        if (drop) taken++;
        return !drop;
      }),
    );
    expect(taken, "PREMISE: the ledger held exactly one file entry for the shared skill").toBe(1);
    writeFileSync(markerPath, JSON.stringify(next, null, 2) + "\n");
    expect(printedFlags(r.stdout), r.stdout).toEqual([flag("codex")]);
    const fin = runPrinted(w, r.stdout);
    expect(fin.status, fin.stdout).toBe(0);
    expect(agentsOf(w), fin.stdout).toEqual(ids("claude"));
    expect(readFileSync(at(w.target, AGENT_SKILL_REL)).equals(edited), `the user's edited skill was not kept\n${fin.stdout}`).toBe(true);
    expectInvariant(w, ids("claude", "codex"), fin.stdout);

    // The staying agent is still reversible.
    const last = uninstall(w, [flag("claude")]);
    expect(last.status, last.stdout).toBe(0);
    for (const rel of [".claude/agents", ".claude/skills"]) {
      expect(existsSync(at(w.target, rel)), `${rel} is still there\n${last.stdout}`).toBe(false);
    }
    const settings = at(w.target, ASK_RULES_REL);
    if (ask?.createdFile === true) {
      expect(existsSync(settings), `install created ${ASK_RULES_REL}, and it is still there\n${last.stdout}`).toBe(false);
    } else if (existsSync(settings)) {
      const text = readFileSync(settings, "utf8");
      for (const rule of ask?.added ?? []) expect(text, `install's ask rule ${rule} is still there\n${last.stdout}`).not.toContain(rule);
    }
    expect(markerGone(w), last.stdout).toBe(true);
    expect(readFileSync(at(w.target, AGENT_SKILL_REL)).equals(edited), `the user's edited skill was not kept\n${last.stdout}`).toBe(true);
  });

  it("R20 (FULL kept): a flag-less uninstall over an edited Claude Code skill offers deleting the marker; deleted, the file stays and a further flag-less uninstall changes nothing of it", () => {
    const w = world("r20");
    install(w, [flag("claude")]);
    edit(w, CLAUDE_SKILL);
    const edited = readFileSync(at(w.target, CLAUDE_SKILL));

    const r = uninstall(w, []);
    expect(r.status, r.stdout).toBe(0);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude"));
    expectInvariant(w, ids("claude"), r.stdout);
    const line = keptMarkerLine(r.stdout);
    const banner = keptBannerLine(r.stdout);
    expect(line.length, `no kept \`left\` line about the marker\n${r.stdout}`).toBe(1);
    expect(banner.length, `no KEPT_FOR banner\n${r.stdout}`).toBe(1);
    expect(line[0], r.stdout).toContain("or delete the marker by hand to keep them without a record");
    expect(banner[0], r.stdout).toContain(`delete ${MARKER_REL} by hand (uninstall then has no record of them and changes nothing more)`);
    expect(r.stdout, "a FULL run says the marker must not be deleted").not.toContain("never delete");
    expect(r.stdout, "a FULL run names a per-entry ledger edit").not.toContain("out of the install ledger");

    // Follow the printed alternative: delete the marker by hand.
    rmSync(at(w.target, MARKER_REL));
    expect(readFileSync(at(w.target, CLAUDE_SKILL)).equals(edited), "the edited skill is not in place").toBe(true);
    const again = uninstall(w, []);
    expect(again.status, again.stdout).toBe(0);
    expect(markerGone(w), again.stdout).toBe(true);
    expect(readFileSync(at(w.target, CLAUDE_SKILL)).equals(edited), `the further uninstall changed the edited skill\n${again.stdout}`).toBe(true);
  });

  it("R21 (U4, malformed ledger): a partial uninstall says to fix the ledger field and never offers removing the marker; a flag-less uninstall over the same marker offers fixing or removing it", () => {
    const w = world("r21");
    install(w, [flag("claude"), flag("codex")]);
    const markerPath = at(w.target, MARKER_REL);
    writeFileSync(markerPath, JSON.stringify(withLedger(readMarkerObject(w.target), (es) => [...es, { kind: "file" }]), null, 2) + "\n");
    expect(readLedger(readMarkerObject(w.target)).state, "PREMISE: the ledger is malformed").toBe("malformed");
    // expectInvariant is not asked: the ledger is malformed by design, so there is no typed entry list to check it on.
    const malformedLine = (stdout: string): string[] =>
      linesWith(stdout, "left").filter((l) => l.includes(`${MARKER_REL} (its install ledger is malformed`));

    const partial = uninstall(w, [flag("codex")]);
    const p = malformedLine(partial.stdout);
    expect(p.length, `no malformed-ledger \`left\` line about the marker\n${partial.stdout}`).toBe(1);
    expect(p[0], partial.stdout).toContain("fix the ledger field by hand");
    expect(p[0], partial.stdout).toContain("the marker is still the record of every agent installed here");
    expect(p[0], "a partial run offers removing the marker").not.toContain("fix or remove it by hand");
    expect(existsSync(markerPath), partial.stdout).toBe(true);

    const full = uninstall(w, []);
    const f = malformedLine(full.stdout);
    expect(f.length, `no malformed-ledger \`left\` line about the marker\n${full.stdout}`).toBe(1);
    expect(f[0], full.stdout).toContain("fix or remove it by hand");
    expect(f[0], full.stdout).not.toContain("fix the ledger field by hand");
    expect(existsSync(markerPath), full.stdout).toBe(true);
  });

  it("the by-hand remedy census: every printed alternative that touches the marker or its ledger is classed, both ways, with per-class counts", () => {
    const sites = remedyCensus();
    const found = new Map<string, CensusSite[]>();
    for (const s of sites) {
      const k = censusKey(s.module, s.fn, s.guard, s.text);
      found.set(k, [...(found.get(k) ?? []), s]);
    }
    const want = new Map<string, number>();
    for (const r of CENSUS_TABLE) want.set(censusKey(r[0], r[1], r[2], r[3]), (want.get(censusKey(r[0], r[1], r[2], r[3])) ?? 0) + 1);
    const unclassified = sites.filter((s) => !want.has(censusKey(s.module, s.fn, s.guard, s.text))).map((s) => `${s.module}:${s.line} [${s.fn}] {${s.guard}} ${s.text}`);
    const stale = [...want.keys()].filter((k) => !found.has(k));
    const counts = [...want].filter(([k, n]) => found.has(k) && (found.get(k) ?? []).length !== n).map(([k, n]) => `${k}: table ${n}, found ${(found.get(k) ?? []).length}`);
    expect(unclassified, "a printed alternative that touches the marker or its ledger is not classed").toEqual([]);
    expect(stale, "a classed printed alternative is gone or changed").toEqual([]);
    expect(counts, "a classed printed alternative is printed a different number of times").toEqual([]);
    expect(sites.length, "the census size moved").toBe(32);
    expect(countBy(sites, (s) => s.module), "per-module counts (no other product module prints one)").toEqual({ "install.ts": 7, "uninstall.ts": 25 });
    expect(countBy(CENSUS_TABLE, (r) => r[4]), "per-class counts").toEqual(
      Object.fromEntries(Object.entries(CENSUS_CLASS_COUNTS).sort(([a], [b]) => a.localeCompare(b))),
    );
  });

  it("the by-hand remedy census: each row says what its class says (the classes are not a label)", () => {
    const sites = remedyCensus();
    const cls = new Map(CENSUS_TABLE.map((r) => [censusKey(r[0], r[1], r[2], r[3]), r[4]]));
    const wrong: string[] = [];
    for (const s of sites) {
      const c = cls.get(censusKey(s.module, s.fn, s.guard, s.text));
      if (c === undefined) continue; // unclassified: the census row above reports it
      const why = CLASS_RULES[c](s);
      if (why !== null) wrong.push(`${s.module}:${s.line} [${s.fn}] {${s.guard}} (${c}): ${why} — ${s.text}`);
    }
    expect(wrong, "a row breaks its class's rule").toEqual([]);
    // "usable record, split by FULL" comes in pairs: one FULL and one partial reading of the same expression.
    const split = sites.filter((s) => cls.get(censusKey(s.module, s.fn, s.guard, s.text)) === "usable record, split by FULL");
    const byLine = countBy(split, (s) => `${s.module}:${s.line}:${s.guard}`);
    expect(Object.values(byLine).every((n) => n === 1) && new Set(split.map((s) => `${s.module}:${s.line}`)).size * 2 === split.length, `split rows are not FULL/partial pairs: ${JSON.stringify(byLine)}`).toBe(true);
  });

  it("the delete-the-marker text is written only in keepWithoutRecord's FULL branch (by the parser)", () => {
    const deleting = remedyCensus().filter((s) => DELETE_MARKER.test(s.text));
    expect(deleting.map((s) => `${s.module} [${s.fn}] {${s.guard}} ${s.text}`), "the delete-the-marker text outside keepWithoutRecord's FULL branch").toEqual(
      CENSUS_TABLE.filter((r) => r[4] === "usable record, FULL only").map((r) => `${r[0]} [${r[1]}] {${r[2]}} ${r[3]}`),
    );
    expect(deleting.length).toBe(2);
    for (const s of deleting) {
      expect(s.fn).toBe("keepWithoutRecord");
      expect(s.guard).toBe("FULL");
    }
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

// ── the uninstall re-run census (MSG-1, TypeScript parser) ───────────────────────────────────────────────────────

/** A fragment that says to run uninstall (or the uninstaller) again. */
const RERUN_FRAGMENT = /\bre-?run\b|\bthe uninstaller\b|\bthen uninstall\b/i;
/** The builders of a printed uninstall command in install/uninstall.ts, both on agentCommand. */
const COMMAND_BUILDERS: ReadonlySet<string> = new Set(["rerunCommand", "finishCommand"]);
/**
 * The fragments of install/uninstall.ts matching RERUN_FRAGMENT, measured 2026-10-12 (plan 34.1-25): 1, the no-target
 * or no-ledger verify ("Re-run install.js here, then uninstall"), beside rerunCommand. Plan 34.1-14 measured 2: plan
 * 34.1-25 (D-33, WR-20) rewrote the other-directory verify's "Otherwise re-run install.js here, with any agent flag"
 * as "Otherwise run `reinstallCommand()` ...; then run `rerunCommand()`", which prints both commands and no longer
 * matches the fragment. The 6 fragments at HEAD 2e10cba9 were 4 bare re-run remedies (removeAskRules, the kept `left`
 * line, the malformed-ledger verify, the KEPT_FOR banner) that now print the command instead, and those 2.
 */
const RERUN_FRAGMENT_COUNT = 1;

// ── the command-context census (phase 34.1 gap round 2, D-33, the class; plan 34.1-24) ─────────────────────────────
//
// Every printed command is built by host-tools.ts agentCommand (or its scriptCommand) with the invocation context its
// module builds once, COMMAND_CONTEXT. The census walks every product module under install/ with the TypeScript
// parser (never a line regex), finds every call of agentCommand and scriptCommand, and holds that each passes the
// identifier COMMAND_CONTEXT as its context argument (agentCommand's fourth, scriptCommand's second). The modules that
// call either are derived and must equal CONTEXT_CALLS both ways, with the per-module counts pinned; each such module
// declares COMMAND_CONTEXT exactly once. host-tools.ts is the builder: its own scriptCommand call inside agentCommand
// passes agentCommand's parameter, so it is classed here by name and not counted.
//   install.ts   10 agentCommand calls (plans 34.1-22 and 34.1-23), 0 scriptCommand calls;
//   uninstall.ts  5 agentCommand calls (rerunCommand 1, finishCommand 3: FULL, UNFINISHED and NAMED, and, from plan
//                 34.1-25, reinstallCommand 1: the install step of the unusable-marker remedy, WR-20), 0 scriptCommand.
// A later plan that adds a call re-pins its count here with the reason.
const CONTEXT_CALLS: Readonly<Record<string, { readonly agentCommand: number; readonly scriptCommand: number }>> = {
  "install/install.ts": { agentCommand: 10, scriptCommand: 0 },
  "install/uninstall.ts": { agentCommand: 5, scriptCommand: 0 },
};
/** The builder module, whose own scriptCommand call passes agentCommand's context parameter. */
const BUILDER_MODULE = "install/host-tools.ts";
/** The argument index of the context in each builder call. */
const CONTEXT_ARG: Readonly<Record<string, number>> = { agentCommand: 3, scriptCommand: 1 };

describe("the command-context census (D-33): every agentCommand and scriptCommand call passes COMMAND_CONTEXT", () => {
  const productModules = readdirSync(join(REPO_ROOT, "install"))
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts") && !f.includes(".test.") && !f.includes(".test-support."))
    .map((f) => `install/${f}`)
    .sort();
  const callsByModule = new Map<string, ts.CallExpression[]>();
  for (const rel of productModules) {
    const sf = parse(rel);
    const calls = nodesOf(sf, ts.isCallExpression).filter((c) => Object.hasOwn(CONTEXT_ARG, calleeName(c) ?? ""));
    if (calls.length > 0) callsByModule.set(rel, calls);
  }

  it("the modules that call agentCommand or scriptCommand are CONTEXT_CALLS's (plus the builder), both ways", () => {
    expect(productModules.length, "premise: the product module walk found modules").toBeGreaterThan(0);
    expect(productModules, "premise: the walk sees both binaries").toEqual(expect.arrayContaining(Object.keys(CONTEXT_CALLS)));
    expect([...callsByModule.keys()].filter((m) => m !== BUILDER_MODULE).sort()).toEqual(Object.keys(CONTEXT_CALLS).sort());
  });

  it("the per-module call counts are pinned", () => {
    for (const [rel, want] of Object.entries(CONTEXT_CALLS)) {
      const calls = callsByModule.get(rel) ?? [];
      expect(calls.filter((c) => calleeName(c) === "agentCommand").length, `${rel}: agentCommand calls`).toBe(want.agentCommand);
      expect(calls.filter((c) => calleeName(c) === "scriptCommand").length, `${rel}: scriptCommand calls`).toBe(want.scriptCommand);
    }
  });

  it("every call passes the identifier COMMAND_CONTEXT as its context argument", () => {
    const off: string[] = [];
    let seen = 0;
    for (const rel of Object.keys(CONTEXT_CALLS)) {
      const sf = parse(rel);
      for (const c of callsByModule.get(rel) ?? []) {
        seen++;
        const arg = c.arguments[CONTEXT_ARG[calleeName(c) ?? ""]];
        if (arg === undefined || !ts.isIdentifier(arg) || arg.text !== "COMMAND_CONTEXT") {
          off.push(`${rel}:${sf.getLineAndCharacterOfPosition(c.getStart(sf)).line + 1} ${c.getText(sf).slice(0, 120)}`);
        }
      }
    }
    expect(seen, "premise: the census saw calls").toBe(Object.values(CONTEXT_CALLS).reduce((n, v) => n + v.agentCommand + v.scriptCommand, 0));
    expect(off, "a printed command built without the module's COMMAND_CONTEXT").toEqual([]);
  });

  it("each module declares COMMAND_CONTEXT exactly once, at module level", () => {
    for (const rel of Object.keys(CONTEXT_CALLS)) {
      const sf = parse(rel);
      const decls = nodesOf(sf, ts.isVariableDeclaration).filter((d) => ts.isIdentifier(d.name) && d.name.text === "COMMAND_CONTEXT");
      expect(decls.length, `${rel}: COMMAND_CONTEXT declarations`).toBe(1);
      expect(ts.isSourceFile(decls[0].parent.parent.parent), `${rel}: COMMAND_CONTEXT is not declared at module level`).toBe(true);
    }
  });

  it("the builder's own scriptCommand call sits in agentCommand and passes agentCommand's context parameter", () => {
    const sf = parse(BUILDER_MODULE);
    const inner = callsByModule.get(BUILDER_MODULE) ?? [];
    expect(inner.map((c) => `${calleeName(c)} in ${enclosing(c)}`)).toEqual(["scriptCommand in agentCommand"]);
    const fn = functionNamed(sf, "agentCommand");
    const ctxParam = fn.parameters[3];
    expect(ctxParam !== undefined && ts.isIdentifier(ctxParam.name) ? ctxParam.name.text : null).toBe("ctx");
    const arg = inner[0].arguments[1];
    expect(arg !== undefined && ts.isIdentifier(arg) && arg.text === "ctx", inner[0].getText(sf)).toBe(true);
  });
});

describe("the uninstall re-run census (MSG-1)", () => {
  it("every uninstall.ts fragment that says to run uninstall again sits in a string expression that prints rerunCommand or finishCommand", () => {
    const sf = parse("install/uninstall.ts");
    const fragments: ts.Node[] = nodesOf(sf, (n): n is ts.Node =>
      (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) &&
      RERUN_FRAGMENT.test((n as ts.LiteralLikeNode).text),
    );
    const bare: string[] = [];
    for (const f of fragments) {
      // The string expression holding the fragment: its template literal, then the maximal `+` chain around it.
      let expr: ts.Node = ts.isTemplateLiteralToken(f) && !ts.isNoSubstitutionTemplateLiteral(f) ? f.parent.parent : f;
      while (
        (ts.isBinaryExpression(expr.parent) && expr.parent.operatorToken.kind === ts.SyntaxKind.PlusToken) ||
        ts.isParenthesizedExpression(expr.parent)
      ) {
        expr = expr.parent;
      }
      const prints = nodesOf(expr, ts.isCallExpression).some((c) => COMMAND_BUILDERS.has(calleeName(c) ?? ""));
      if (!prints) bare.push(`uninstall.ts:${sf.getLineAndCharacterOfPosition(f.getStart(sf)).line + 1} ${JSON.stringify((f as ts.LiteralLikeNode).text.slice(0, 80))}`);
    }
    expect(bare, "a re-run remedy with no printed command").toEqual([]);
    expect(fragments.length, "the re-run fragment count moved").toBe(RERUN_FRAGMENT_COUNT);
  });

  it("rerunCommand and finishCommand are built by agentCommand", () => {
    const sf = parse("install/uninstall.ts");
    for (const name of COMMAND_BUILDERS) {
      const fn = functionNamed(sf, name);
      expect(callsOf(fn, "agentCommand").length, `${name} does not call agentCommand`).toBeGreaterThan(0);
    }
  });
});

// ── D-31 (DI-07, MSG-1): a directory that cannot be removed, and the finishing command of a partial run ──────────────
//
// DI-07 (plan 34.1-21). A recorded verify never lands on a directory entry (every `return "verify"` and verify outcome
// in uninstall.ts is in the reversal of a file, block, gemini, ask-rules or opencode-permission entry; reverseDir's
// outcomes are left, gone and removed). What a directory had instead was a silent failure: rmdirIfEmpty's rmdirSync
// catch returned `left` with no line. R22 holds the line it prints now, on a partial and a FULL run.
//
// MSG-1 and D-05 (plan 34.1-21). finishCommand never prints the flag-less command on a partial run, which removes every
// agent. Its partial branch names UNFINISHED; when that is empty (the marker rewrite failed, so the marker on disk
// still records the agents this run named), NAMED; when that is empty too, this run's own flags (rerunCommand, REMOVE's
// rows). R32 forces the empty-UNFINISHED state with a marker that cannot be rewritten and runs the printed command; R23
// is the held-entry verify (UNFINISHED not empty); the parser row holds the order and the guards.

if (CHMOD_SKIP !== null) console.log(`SKIP R22, R23 and R32 of agents-record.test.ts — ${CHMOD_SKIP}`);

/** The `left` line rmdirIfEmpty prints for recorded directory `rel` it could not remove. */
const failedRmdirLines = (w: World, stdout: string, rel: string): string[] =>
  linesWith(stdout, "left").filter((l) => lineNamesPath(l, at(w.target, rel)) && l.includes(" (install created this directory and it is empty, but it could not be removed"));

describe("D-31 (DI-07): a directory that cannot be removed, and the finishing command of a partial run", () => {
  it.skipIf(CHMOD_SKIP !== null)(
    "R22: a recorded directory uninstall cannot remove (a read-only .agents) is named on a `left` line with its error and the by-hand remedy, on a partial (--codex) and a flag-less run",
    () => {
      const SKILLS = ".agents/skills";
      const words: string[] = [];
      for (const args of [[flag("codex")], []] as const) {
        const w = world("r22");
        install(w, [flag("claude"), flag("codex")]);
        const parent = at(w.target, ".agents");
        chmodSync(parent, 0o555); // mode-census: access-denial
        let r: Run;
        try {
          r = uninstall(w, args);
        } finally {
          chmodSync(parent, 0o755); // mode-census: restore
        }
        const what = args.length === 0 ? "the flag-less run" : `uninstall ${args.join(" ")}`;
        expect(r.status, `${what}\n${r.stdout}`).toBe(0);
        expect(existsSync(at(w.target, SKILLS)), `premise: ${SKILLS} could not be removed\n${r.stdout}`).toBe(true);
        expect(existsSync(at(w.target, `${SKILLS}/grugops`)), `premise: the directory under it was removed\n${r.stdout}`).toBe(false);
        const lines = failedRmdirLines(w, r.stdout, SKILLS);
        expect(lines.length, `${what}: no \`left\` line names the directory it could not remove\n${r.stdout}`).toBe(1);
        expect(lines[0], r.stdout).toMatch(/could not be removed \((EACCES|EPERM)\)/);
        expect(lines[0], r.stdout).toContain("remove it by hand once that is fixed");
        expect(lines[0], r.stdout).toContain("a directory keeps neither the marker nor an agent recorded");
        // The run did not claim it removed the directory.
        const claimed = r.stdout.split("\n").filter((l) => /^ {2}(would-)?rmdir\s/.test(l) && lineNamesPath(l, at(w.target, SKILLS)));
        expect(claimed, r.stdout).toEqual([]);
        if (args.length === 0) {
          expect(markerGone(w), `a directory never holds the marker\n${r.stdout}`).toBe(true);
        } else {
          expect(agentsOf(w), `a directory never keeps an agent recorded\n${r.stdout}`).toEqual(ids("claude"));
          expectInvariant(w, ids("claude", "codex"), r.stdout);
        }
        words.push(lines[0].slice(lines[0].indexOf(" (install created")));
      }
      expect(words[1], "the partial and the flag-less run print the line with the same words").toBe(words[0]);
    },
    300_000,
  );
});

/** The INCOMPLETE banner's "Then run `...` to finish the reversal." line. */
const finishBannerLines = (stdout: string): string[] => stdout.split("\n").filter((l) => l.startsWith("  Then run `") && l.endsWith("` to finish the reversal."));
/**
 * Every printed uninstall command in a run's output (a backtick span whose words start `node <this checkout's
 * uninstall.js by its absolute path>`), as its agent flags. A span that does not split into shell words is skipped.
 */
const everyPrintedUninstallFlags = (stdout: string): string[][] =>
  [...stdout.matchAll(/`([^`]*)`/g)].flatMap((m) => {
    let words: string[];
    try {
      words = shellWords(m[1]);
    } catch {
      return [];
    }
    return words[0] === "node" && words[1] !== undefined && pathText(words[1]) === pathText(UNINSTALL_JS) ? [words.slice(4)] : [];
  });
/** The conditions that decide whether `n` runs within its function: statementGuards plus every enclosing conditional. */
function guardsOf(n: ts.Node): Map<string, boolean> {
  const g = statementGuards(n);
  let child: ts.Node = n;
  for (let p: ts.Node | undefined = n.parent; p !== undefined && !ts.isFunctionLike(p); child = p, p = p.parent) {
    if (ts.isConditionalExpression(p) && p.condition !== child) {
      const [k, pol] = condKey(p.condition);
      g.set(k, p.whenTrue === child ? pol : !pol);
    }
  }
  return g;
}
const within = (n: ts.Node, outer: ts.Node): boolean => {
  for (let p: ts.Node | undefined = n; p !== undefined; p = p.parent) if (p === outer) return true;
  return false;
};

describe("D-31 (MSG-1, D-05): the finishing command of a partial run is never the flag-less one", () => {
  it.skipIf(CHMOD_SKIP !== null)(
    "R32: a marker that cannot be rewritten on uninstall --codex (UNFINISHED empty): exit 3, the marker still records [claude, codex], the INCOMPLETE banner prints a command whose agent flags are exactly --codex; fixed and run, it removes Codex CLI's record and leaves Claude Code",
    () => {
      const w = world("r32");
      install(w, [flag("claude"), flag("codex")]);
      const markerPath = at(w.target, MARKER_REL);
      const before = readFileSync(markerPath);
      chmodSync(markerPath, 0o444); // mode-census: access-denial
      let r: Run;
      try {
        r = uninstall(w, [flag("codex")]);
      } finally {
        chmodSync(markerPath, 0o644); // mode-census: restore
      }
      expect(r.status, r.stdout).toBe(3);
      // The premises: the rewrite failed, so the marker on disk is the one install wrote and still records both agents;
      // this run's own entries were all removed, so no named agent is "not finished" (UNFINISHED is empty).
      expect(readFileSync(markerPath).equals(before), `the marker was rewritten\n${r.stdout}`).toBe(true);
      expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex"));
      expect(existsSync(at(w.target, AGENT_SKILL_REL)), r.stdout).toBe(false);
      expect(r.stdout, "premise: the marker outcome is kept-for-agents, not rewritten").toContain("kept for the agents still installed here, but not rewritten");
      const banner = r.stdout.split("\n").filter((l) => l.startsWith("== uninstall INCOMPLETE"));
      expect(banner.length, r.stdout).toBe(1);
      expect(banner[0], "premise: UNFINISHED is empty").toContain(`agents removed: ${row("codex").name}`);
      expect(banner[0], "premise: UNFINISHED is empty").not.toContain("not finished");
      // The guard: the printed command names exactly --codex, and no printed uninstall command is the flag-less one.
      const fin = finishBannerLines(r.stdout);
      expect(fin.length, `the INCOMPLETE banner does not print the finishing command\n${r.stdout}`).toBe(1);
      expect(printedFlags(fin[0]), fin[0]).toEqual([flag("codex")]);
      expect(everyPrintedUninstallFlags(r.stdout).length, `premise: the run printed an uninstall command\n${r.stdout}`).toBeGreaterThan(0);
      const flagless = everyPrintedUninstallFlags(r.stdout).filter((f) => f.length === 0);
      expect(flagless, `a partial run printed the flag-less uninstall command\n${r.stdout}`).toEqual([]);
      // The cause fixed (the mode restored above), the printed command finishes the reversal and keeps Claude Code.
      const done = runPrinted(w, fin[0]);
      expect(done.status, done.stdout).toBe(0);
      expect(agentsOf(w), done.stdout).toEqual(ids("claude"));
      expect(ledgerEntries(w).filter((e) => entryOwners(e).includes(row("codex").id) && !entryOwners(e).includes(row("claude").id)), done.stdout).toEqual([]);
      expect(existsSync(at(w.target, ".claude/agents")), done.stdout).toBe(true);
      expect(existsSync(at(w.target, ".claude/skills")), done.stdout).toBe(true);
      expect(existsSync(markerPath), done.stdout).toBe(true);
      expectInvariant(w, ids("claude"), done.stdout);
    },
    300_000,
  );

  it.skipIf(CHMOD_SKIP !== null)(
    "R23: a held-entry verify on uninstall --codex (a read-only .agents/skills/grugops): exit 3, `agents` [claude, codex]; the kept line names SKILL.md, and it and the INCOMPLETE banner print a command whose agent flags are exactly --codex; fixed and run: SKILL.md gone, `agents` [claude]",
    () => {
      const w = world("r23");
      install(w, [flag("claude"), flag("codex")]);
      const dir = at(w.target, ".agents/skills/grugops");
      chmodSync(dir, 0o555); // mode-census: access-denial
      let r: Run;
      try {
        r = uninstall(w, [flag("codex")]);
      } finally {
        chmodSync(dir, 0o755); // mode-census: restore
      }
      expect(r.status, r.stdout).toBe(3);
      expect(existsSync(at(w.target, AGENT_SKILL_REL)), r.stdout).toBe(true);
      expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex"));
      expectInvariant(w, ids("claude", "codex"), r.stdout);
      const kept = keptMarkerLine(r.stdout);
      expect(kept.length, r.stdout).toBe(1);
      expect(kept[0], r.stdout).toContain(AGENT_SKILL_REL);
      expect(printedFlags(kept[0]), kept[0]).toEqual([flag("codex")]);
      const fin = finishBannerLines(r.stdout);
      expect(fin.length, `the INCOMPLETE banner does not print the finishing command\n${r.stdout}`).toBe(1);
      expect(printedFlags(fin[0]), fin[0]).toEqual([flag("codex")]);
      expect(everyPrintedUninstallFlags(r.stdout).length, `premise: the run printed an uninstall command\n${r.stdout}`).toBeGreaterThan(0);
      expect(everyPrintedUninstallFlags(r.stdout).filter((f) => f.length === 0), r.stdout).toEqual([]);
      const done = runPrinted(w, fin[0]);
      expect(done.status, done.stdout).toBe(0);
      expect(existsSync(at(w.target, AGENT_SKILL_REL)), done.stdout).toBe(false);
      expect(agentsOf(w), done.stdout).toEqual(ids("claude"));
      expectInvariant(w, ids("claude"), done.stdout);
    },
    300_000,
  );

  it("the parser row: finishCommand's partial branch reads UNFINISHED, then NAMED, then REMOVE (rerunCommand), each host list guarded non-empty, and never passes an empty array literal to agentCommand", () => {
    const sf = parse("install/uninstall.ts");
    const fn = functionNamed(sf, "finishCommand");
    const body = fn.body?.statements ?? ts.factory.createNodeArray<ts.Statement>([]);
    // The FULL branch comes first and always leaves; it is the only place an empty host list may appear.
    const first = body[0];
    expect(first !== undefined && ts.isIfStatement(first) && first.expression.getText() === "FULL" && first.elseStatement === undefined && alwaysLeaves(first.thenStatement), "finishCommand does not open with `if (FULL) return ...`").toBe(true);
    const fullBranch = (first as ts.IfStatement).thenStatement;
    const empties = nodesOf(fn, ts.isArrayLiteralExpression).filter((a) => a.elements.length === 0);
    expect(empties.filter((a) => !within(a, fullBranch)).map((a) => a.getText()), "an empty array literal on the partial branch").toEqual([]);
    const partial = body.slice(1);
    // Every agentCommand call on the partial branch takes hostsOf(UNFINISHED) or hostsOf(NAMED), each guarded by that
    // list being non-empty; the chain ends in rerunCommand(), whose rows are REMOVE's.
    const calls = partial.flatMap((s) => callsOf(s, "agentCommand"));
    expect(calls.length, "the partial branch builds no command of its own").toBeGreaterThan(0);
    for (const c of calls) {
      const hosts = c.arguments[2];
      expect(hosts !== undefined && ts.isCallExpression(hosts) && calleeName(hosts) === "hostsOf", `not hostsOf(...): ${c.getText()}`).toBe(true);
      const list = (hosts as ts.CallExpression).arguments[0];
      expect(list !== undefined && ts.isIdentifier(list) && ["UNFINISHED", "NAMED"].includes(list.text), `hostsOf of something other than UNFINISHED or NAMED: ${c.getText()}`).toBe(true);
      const name = (list as ts.Identifier).text;
      expect(guardsOf(c).get(`${name}.length > 0`), `hostsOf(${name}) is not guarded by ${name}.length > 0: ${c.getText()}`).toBe(true);
    }
    const reads: string[] = [];
    const visit = (n: ts.Node): void => {
      if (ts.isIdentifier(n) && ["UNFINISHED", "NAMED", "REMOVE"].includes(n.text) && !reads.includes(n.text)) reads.push(n.text);
      if (ts.isCallExpression(n) && calleeName(n) === "rerunCommand" && !reads.includes("REMOVE")) reads.push("REMOVE");
      ts.forEachChild(n, visit);
    };
    for (const s of partial) visit(s);
    expect(reads, "the partial branch's sources, in order").toEqual(["UNFINISHED", "NAMED", "REMOVE"]);
    // The last case leaves unconditionally with this run's own command, so no path falls through to an empty list.
    const last = partial[partial.length - 1];
    expect(last !== undefined && ts.isReturnStatement(last) && last.expression !== undefined && ts.isCallExpression(last.expression) && calleeName(last.expression) === "rerunCommand", "the partial branch does not end in `return rerunCommand()`").toBe(true);
    // rerunCommand's rows are REMOVE's, which is never empty on a partial run (FULL is true when no agent flag is given).
    const rerun = functionNamed(sf, "rerunCommand");
    expect(nodesOf(rerun, ts.isIdentifier).some((i) => i.text === "REMOVE"), "rerunCommand does not read REMOVE").toBe(true);
    const fullDecl = nodesOf(sf, ts.isVariableDeclaration).filter((d) => ts.isIdentifier(d.name) && d.name.text === "FULL");
    expect(fullDecl.length).toBe(1);
    expect(fullDecl[0].initializer?.getText(), "FULL is no longer true when no agent flag is given").toMatch(/^REMOVE\.size === 0 \|\|/);
  });
});
