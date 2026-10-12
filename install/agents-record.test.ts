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
//     D-04's retry of a refused agent, the converse the chosen meaning deliberately does not hold);
//   - the marker-writer census, by the TypeScript parser: every call of the target write chokepoints (install.ts
//     writeTargetFile, uninstall.ts rewritePath and unlinkPath; installer-fs-census.test.ts rows
//     `install.ts:writeTargetFile:writeFileSync`, `uninstall.ts:rewritePath:writeFileSync` and
//     `uninstall.ts:unlinkPath:unlinkSync` pin them as the one whole-file writer, the one rewrite and the one removal
//     under TARGET), classed both ways against a table, with the count of each pinned;
//   - the uninstall re-run census (MSG-1): every string fragment of install/uninstall.ts that says to run uninstall
//     again sits in a string expression that prints an agentCommand-built command (rerunCommand or finishCommand),
//     so no remedy sends a per-agent run into a flag-less uninstall, which removes every agent (D-05).
//
// Hermetic: every run sets GRUGOPS_HOME (and HOME) to scratch directories removed at the end, and passes the target
// through the test support (TARGET, or `--target` for a printed command). Drives the COMMITTED install/install.js and
// install/uninstall.js (npm run build first).
//
// Clear professional voice: this is test infrastructure for an installer safety surface. Vitest `globals: false`.

import { describe, it, expect, afterAll } from "vitest";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import ts from "typescript";
import { AGENT_SKILL_REL, HOST_TOOLS, agentCommand, agentFlag, entryOwners, type HostTool } from "./host-tools.js";
import { ASK_RULES_REL, agentsToRecord, entryHolds, readLedger, type LedgerEntry } from "./install-marker.js";
import {
  INSTALL_JS,
  MARKER_REL,
  type Run,
  makeOldLayoutFixture,
  printedCommand,
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
      const flagless = agentCommand("uninstall.js", w.target, []);
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
    expect(printedCommand(real.stdout)).toBe(agentCommand("uninstall.js", w.target, [row("claude")]));
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
    const own = agentCommand("uninstall.js", w.target, [row("claude")]);
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
    const own = agentCommand("uninstall.js", w.target, [row("codex")]);
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
 * The fragments of install/uninstall.ts matching RERUN_FRAGMENT, measured 2026-10-12 (plan 34.1-14): 2. Both are in the
 * module-top unbound-marker verifies ("Otherwise re-run install.js here" and "Re-run install.js here, then uninstall"),
 * and each sits beside rerunCommand. The 6 fragments at HEAD 2e10cba9 were 4 bare re-run remedies (removeAskRules, the
 * kept `left` line, the malformed-ledger verify, the KEPT_FOR banner) that now print the command instead, and these 2.
 */
const RERUN_FRAGMENT_COUNT = 2;

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
