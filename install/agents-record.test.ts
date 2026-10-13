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
//     runs the install INCOMPLETE banner's command of a `--symlink` run as printed, D-33; R29, plan 34.1-29, D-31,
//     IN-23: install's closing notes name a recorded agent with nothing installed apart, never "Left installed", and
//     its printed uninstall command, run, takes it out of the record; R30, R31 and R35, plan 34.1-30, D-31, IN-26:
//     install's write of `agents` reads the ledger it writes, so an agent left out of `agents` by a hand edit while the
//     ledger holds its files is recorded again (R30), both owners of the held shared agent skill are recorded and a
//     per-agent uninstall of both removes it (R31), and an agent owning only a directory entry is not (R35));
//   - the unusable-marker remedies, followed as printed (D-33, WR-20): R25 (plan 34.1-25, a moved target, --codex),
//     R26 (plan 34.1-26, a moved target, flag-less, with the no-agent-flag clause), R27 (plan 34.1-26, a marker with no
//     install ledger, --codex and flag-less) and R34 (plan 34.1-26, a moved `--symlink` install); and R28 (plan
//     34.1-26, D-31, IN-27): over a marker the run cannot use, which agents are installed is unknown, not "none".
//     Plan 34.1-36 (D-36, review WR-22) reshapes R25 and R34 to "nothing from an `unbound` marker reaches a printed
//     command" and adds R39 (a cloned repository's marker naming another person's kit home, against both binaries);
//   - the marker-writer census, by the TypeScript parser: every call of the target write chokepoints (install.ts
//     writeTargetFile, uninstall.ts rewritePath and unlinkPath; installer-fs-census.test.ts rows
//     `install.ts:writeTargetFile:writeFileSync`, `uninstall.ts:rewritePath:writeFileSync` and
//     `uninstall.ts:unlinkPath:unlinkSync` pin them as the one whole-file writer, the one rewrite and the one removal
//     under TARGET), classed both ways against a table, with the count of each pinned;
//   - the uninstall re-run census (MSG-1): every string fragment of install/uninstall.ts that says to run uninstall
//     again sits in a string expression that prints an agentCommand-built command (rerunCommand or finishCommand),
//     so no remedy sends a per-agent run into a flag-less uninstall, which removes every agent (D-05);
//   - D-32 (CR-03, plans 34.1-19 and 34.1-20): no printed alternative removes the record of an agent that stays
//     installed. R19 and R20 follow keepWithoutRecord's partial and FULL alternatives (since plan 34.1-42, D-37, both
//     the per-entry ledger edit; neither offers deleting the marker); R21 holds removeMarker's malformed-ledger line on
//     a partial and a FULL run; the by-hand remedy census finds, by the parser, every printed alternative in a product
//     module that touches .grugops/install.json, its ledger or its `agents` field, compares it both ways with a classed
//     table, checks each row against its class's rule, pins the per-class counts, and (since plan 34.1-42, D-37) finds
//     the delete-the-marker text at zero sites.
//   - D-35 (34.1 review CR-04, plan 34.1-33): install-marker.ts markerRemedy is the one owner of whether a printed remedy
//     may offer removing the marker, never while a well-formed install ledger is present. R36 follows the doctor's FAIL
//     over a marker with a malformed `agents` field (fix by hand, run the printed check command, then a flag-less
//     uninstall removes grugops' files), with a not-JSON control row; R37 does the same for install's verify. Plan
//     34.1-34: uninstall.ts's unreadable-marker verify, removeMarker's arms and keepWithoutRecord read the same owner;
//     R38 follows the uninstaller's never-remove verify (flag-less and --codex) as printed; the by-hand remedy census
//     tags each reading with the owner's answer, and every printed offer to remove the marker sits under its yes. Plan
//     34.1-40: the markerRemedy call-site census (MARKER_REMEDY_CALLS, by the parser, both ways, counts pinned) and its
//     converse derived from the census owner tags; markerRemedy's unit table, 12 read shapes (real marker files read
//     through readInstallMarker) times 3 runs, with markerFixText of every never-remove answer.
//   - D-37 (34.1 review CR-05, plan 34.1-42): no printed text offers deleting the marker, whatever the read. Every
//     `unreadable` read of readInstallMarker carries problems naming its cause and by-hand fix (none echoing a byte of
//     the file); markerFixText is worded for every reader state; the uninstaller's module-top unreadable verify has one
//     reading (markerFixText, then this run's command), and removeMarker's lines over a marker it could not use point at
//     it. R41a and R41b follow the reviewer's CR-05 reproduction (one trailing comma inside `agents`) as printed, then
//     uninstall; the unit table has 13 shapes (a blocked read added) and asks markerFixText of every cell.
//   - D-37 (34.1 review CR-06, plan 34.1-43): install's own marker (`ok`) with a malformed install ledger is the record of
//     every agent installed here on every run kind. markerRemedy's `ok` arm answers no removal for it and a fix entry
//     naming readLedger's why; the uninstaller's module-top malformed-ledger verify prints markerFixText of it and this
//     run's command, and removeMarker's U4 line points at that verify. R21 is inverted (both run kinds say fix by hand
//     and never delete the marker); R43a and R43b follow the reviewer's reproduction (one ledger entry's kind set to
//     banana) as printed, on the flag-less and the --codex run. The doctor's malformed-ledger FAIL and install's two
//     malformed-ledger verifies (writeMarker, writeAskRules) print the same never-remove wording; R43c follows the
//     doctor's FAIL (its check command, run as printed after the hand fix, passes) and install's verifies. The unit
//     table has 14 shapes (the banana ledger added).
//   - D-37 (34.1 review CR-05, plan 34.1-44): the doctor's unreadable-marker FAIL and install's two unreadable-marker
//     verifies have one never-remove reading each; R36 control follows the trailing-comma marker through --check as
//     printed (then a flag-less uninstall removes grugops' files), and R37d over install. The owner has no removal
//     answer: markerRemedy(read) is { defect, fix } or null, every unreadable read carries its MARKER_DEFECTS member, and
//     the unit table is enumerated from MARKER_DEFECTS. The census test "D-37: no reading in any product module offers
//     removing the marker" holds the zero.
//   - D-37 (plan 34.1-45, 34.1 review IN-34 and WR-26): over a marker the uninstaller cannot use, the ask-rules and
//     unrecorded-block reports point at the marker's verify line and never send the user to remove anything by hand (R45
//     follows it as printed until the recorded ask rules and the CLAUDE.md block are gone); the reader names every
//     duplicated key with its count (R46 follows a duplicate `ledger` key as printed). The unusable-marker census, derived
//     by search, holds the class: every reading that says the marker or its ledger could not be used carries the owner's
//     wording, points at the line that does, or names a cause only, and none removes anything by hand.
//
// Hermetic: every run sets GRUGOPS_HOME (and HOME) to scratch directories removed at the end, and passes the target
// through the test support (TARGET, or `--target` for a printed command). Drives the COMMITTED install/install.js and
// install/uninstall.js (npm run build first).
//
// Clear professional voice: this is test infrastructure for an installer safety surface. Vitest `globals: false`.

import { describe, it, expect, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import ts from "typescript";
import {
  AGENT_SKILL_REL,
  HOST_TOOLS,
  PI_PROMPT_REL,
  agentCommand,
  agentFlag,
  commandContextFromRecord,
  entryOwners,
  scriptCommand,
  type HostTool,
  type RecordRead,
} from "./host-tools.js";
import {
  ASK_RULES_REL,
  agentsToRecord,
  entryHolds,
  MARKER_DEFECTS,
  markerDefectText,
  markerFixText,
  markerRemedy,
  readInstallMarker,
  readLedger,
  type InstallMarkerRead,
  type LedgerEntry,
  type MarkerDefect,
} from "./install-marker.js";
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
import { memberNamed, readJsonText } from "./json-text.js";

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
  // The running script's checkout (DIR's parent), and another kit checkout a run may name in GRUGOPS_SRC (plan
  // 34.1-37, D-36, WR-23).
  const CHECKOUT = "/opt/grugops";
  const OTHER_SRC = "/srv/checkouts/s";
  // Plan 34.1-36 (D-36): every context is built by the one constructor, commandContextFromRecord, with no record, so
  // the run's values decide it. Plan 34.1-37: the run's kit checkout is the script's own unless `src` names another.
  const runContext = (scriptDir: string, kitHome: string, defaultKitHome: string, symlink = false, src = CHECKOUT) =>
    commandContextFromRecord(null, { scriptDir, kitHome, defaultKitHome, symlink, src, checkout: CHECKOUT });
  const plain = runContext(DIR, DEFAULT_KIT, DEFAULT_KIT);
  const withKit = runContext(DIR, KIT, DEFAULT_KIT);
  const linked = runContext(DIR, DEFAULT_KIT, DEFAULT_KIT, true);
  const everything = runContext(DIR, KIT, DEFAULT_KIT, true);

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

  // commandContextFromRecord (phase 34.1 gap round 3, D-36, WR-21): the one derivation of a printed command's kit home
  // and install mode. Only an `ok` record whose grugopsHome is a non-empty string and whose installMode is copy or
  // symlink gives its values; every other record gives the run's. The unbound row carries a marker object with a kit
  // home and symlink on purpose: an owner that read an `unbound` record would take them (M2). Each row names which
  // side it takes, and the expected context is built from that side by hand, so the rule is not computed twice.
  describe("commandContextFromRecord: the record's kit home and mode only from an ok marker, the run's otherwise (D-36)", () => {
    const REC_KIT = "/srv/kits/recorded";
    const RUN_KIT = "/srv/kits/run";
    const records: ReadonlyArray<{ readonly name: string; readonly record: RecordRead | null; readonly takes: "record" | "run"; readonly home?: string; readonly symlink?: boolean }> = [
      { name: "no record (null)", record: null, takes: "run" },
      { name: "absent", record: { state: "absent", marker: null }, takes: "run" },
      { name: "unreadable", record: { state: "unreadable", marker: null }, takes: "run" },
      { name: "unbound, carrying a kit home and symlink", record: { state: "unbound", marker: { grugopsHome: REC_KIT, installMode: "symlink" } }, takes: "run" },
      { name: "ok, kit home K, symlink", record: { state: "ok", marker: { grugopsHome: REC_KIT, installMode: "symlink" } }, takes: "record", home: REC_KIT, symlink: true },
      { name: "ok, the default kit home, copy", record: { state: "ok", marker: { grugopsHome: DEFAULT_KIT, installMode: "copy" } }, takes: "record", home: DEFAULT_KIT, symlink: false },
      { name: "ok, a non-string grugopsHome", record: { state: "ok", marker: { grugopsHome: 42, installMode: "symlink" } }, takes: "run" },
      { name: "ok, an installMode that is neither copy nor symlink", record: { state: "ok", marker: { grugopsHome: REC_KIT, installMode: "banana" } }, takes: "run" },
    ];
    const runs: ReadonlyArray<{ readonly name: string; readonly kitHome: string; readonly symlink: boolean }> = [
      { name: "run: default kit home, copy", kitHome: DEFAULT_KIT, symlink: false },
      { name: "run: default kit home, symlink", kitHome: DEFAULT_KIT, symlink: true },
      { name: "run: another kit home, copy", kitHome: RUN_KIT, symlink: false },
      { name: "run: another kit home, symlink", kitHome: RUN_KIT, symlink: true },
    ];
    it("premise: the table holds 8 record shapes times 4 runs, and two of the shapes take the record", () => {
      expect(records.length * runs.length).toBe(32);
      expect(records.filter((r) => r.takes === "record").length).toBe(2);
    });
    for (const rec of records) {
      for (const run of runs) {
        it(`${rec.name} / ${run.name} -> the ${rec.takes}'s values`, () => {
          const got = commandContextFromRecord(rec.record, { scriptDir: DIR, kitHome: run.kitHome, defaultKitHome: DEFAULT_KIT, symlink: run.symlink, src: CHECKOUT, checkout: CHECKOUT });
          const home = rec.takes === "record" ? rec.home : run.kitHome;
          const symlink = rec.takes === "record" ? rec.symlink : run.symlink;
          expect(got.scriptDir).toBe(DIR);
          expect(got.kitHome, "kitHome is null exactly when the chosen kit home is the default").toBe(home === DEFAULT_KIT ? null : home);
          expect(got.symlink).toBe(symlink);
        });
      }
    }
  });

  it("commandContextFromRecord with no record: kitHome is null when it equals the default, and the value otherwise", () => {
    expect(plain).toEqual({ scriptDir: DIR, kitHome: null, symlink: false, src: null });
    expect(withKit).toEqual({ scriptDir: DIR, kitHome: KIT, symlink: false, src: null });
    expect(linked.symlink).toBe(true);
  });
  it("scriptCommand(install.js) with the default kit home is `node <dir>/install.js`", () => {
    expect(scriptCommand("install.js", plain)).toBe(`node ${DIR}/install.js`);
    expect(scriptCommand("install.js", runContext(DIR + "/", DEFAULT_KIT, DEFAULT_KIT)), "a trailing / on the script directory").toBe(`node ${DIR}/install.js`);
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
      const ctx = runContext(odd, odd + "/kit", DEFAULT_KIT, true);
      const cmd = agentCommand("install.js", "/tmp/my repo/t", [row("pi")], ctx);
      expect(shellWords(cmd), cmd).toEqual([`GRUGOPS_HOME=${odd}/kit`, "node", `${odd}/install.js`, "--symlink", "--target", "/tmp/my repo/t", agentFlag(row("pi"))]);
    }
  });
  // `src` (plan 34.1-37, D-36, WR-23): the kit checkout the run used (GRUGOPS_SRC), null when it is the running
  // script's own. Every expected command here is a literal, so the rows do not lean on scriptCommand to check itself.
  it("commandContextFromRecord: src is null when the run's checkout is the script's own, and the run's GRUGOPS_SRC otherwise, whatever the record", () => {
    expect(runContext(DIR, DEFAULT_KIT, DEFAULT_KIT).src).toBeNull();
    expect(runContext(DIR, DEFAULT_KIT, DEFAULT_KIT, false, OTHER_SRC).src).toBe(OTHER_SRC);
    const ok: RecordRead = { state: "ok", marker: { grugopsHome: KIT, installMode: "symlink" } };
    const run = { scriptDir: DIR, kitHome: DEFAULT_KIT, defaultKitHome: DEFAULT_KIT, symlink: false, checkout: CHECKOUT };
    expect(commandContextFromRecord(ok, { ...run, src: CHECKOUT }).src, "an ok record names no checkout").toBeNull();
    expect(commandContextFromRecord(ok, { ...run, src: OTHER_SRC }).src, "an ok record names no checkout").toBe(OTHER_SRC);
  });
  it("scriptCommand(install.js) with src set carries `GRUGOPS_SRC=<src>` after any GRUGOPS_HOME word, before `node`", () => {
    expect(scriptCommand("install.js", runContext(DIR, DEFAULT_KIT, DEFAULT_KIT, false, OTHER_SRC))).toBe(`GRUGOPS_SRC=${OTHER_SRC} node ${DIR}/install.js`);
    expect(scriptCommand("install.js", runContext(DIR, KIT, DEFAULT_KIT, true, OTHER_SRC))).toBe(`GRUGOPS_HOME=${KIT} GRUGOPS_SRC=${OTHER_SRC} node ${DIR}/install.js --symlink`);
  });
  it("scriptCommand(uninstall.js) with src set is `GRUGOPS_SRC=<src> node <dir>/uninstall.js` (its report of unrecorded files reads the kit source)", () => {
    expect(scriptCommand("uninstall.js", runContext(DIR, KIT, DEFAULT_KIT, true, OTHER_SRC))).toBe(`GRUGOPS_SRC=${OTHER_SRC} node ${DIR}/uninstall.js`);
    expect(agentCommand("uninstall.js", "/tmp/a/t", [row("codex")], runContext(DIR, DEFAULT_KIT, DEFAULT_KIT, false, OTHER_SRC))).toBe(
      `GRUGOPS_SRC=${OTHER_SRC} node ${DIR}/uninstall.js --target /tmp/a/t ${flag("codex")}`,
    );
  });
  it("with src equal to the script's checkout, neither binary's command carries a GRUGOPS_SRC word", () => {
    const ctx = runContext(DIR, KIT, DEFAULT_KIT, false, CHECKOUT);
    expect(scriptCommand("install.js", ctx)).toBe(`GRUGOPS_HOME=${KIT} node ${DIR}/install.js`);
    expect(scriptCommand("uninstall.js", ctx)).toBe(`node ${DIR}/uninstall.js`);
  });
  it("a src with a space or a quote is one shell word, and shellWords reads it back as one", () => {
    for (const odd of ["/srv/my checkouts/s", "/srv/it's/s", "/srv/a;b/$x"]) {
      const ctx = runContext(DIR, KIT, DEFAULT_KIT, false, odd);
      for (const binary of ["install.js", "uninstall.js"] as const) {
        const cmd = agentCommand(binary, "/tmp/a/t", [row("codex")], ctx);
        const words = shellWords(cmd);
        const lead = binary === "install.js" ? [`GRUGOPS_HOME=${KIT}`, `GRUGOPS_SRC=${odd}`] : [`GRUGOPS_SRC=${odd}`];
        expect(words, cmd).toEqual([...lead, "node", `${DIR}/${binary}`, "--target", "/tmp/a/t", flag("codex")]);
      }
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
  // H1-H3 (plan 34.1-37, D-36, WR-23): a printed GRUGOPS_SRC reaches the child only on a call that opts in with
  // `expectSrc: true`. Every earlier follow-as-printed row runs without it, so a command that starts carrying
  // GRUGOPS_SRC unexpectedly fails those rows (the harness throws) instead of passing them. The texts are written by
  // hand, so these rows do not depend on the builder.
  it("H1: a printed GRUGOPS_SRC on a call without `expectSrc: true` throws, naming GRUGOPS_SRC, before anything runs", () => {
    const dir = join(SCRATCH, `premise-${seq++}`);
    const home = join(dir, "home");
    const target = join(dir, "t");
    mkdirSync(home, { recursive: true });
    mkdirSync(target, { recursive: true });
    const src = join(dir, "checkout-link");
    symlinkSync(REPO_ROOT, src);
    const text = "`GRUGOPS_SRC=" + src + " node " + INSTALL_JS + " --target " + target + " " + flag("codex") + "`";
    expect(() => runPrintedCommand(text, { home, timeoutMs: 120_000 })).toThrow(/GRUGOPS_SRC/);
    expect(() => runPrintedCommand(text, { home, timeoutMs: 120_000, expectSrc: false })).toThrow(/GRUGOPS_SRC/);
    expect(readdirSync(target), "the command ran: the target holds files").toEqual([]);
    expect(existsSync(join(home, ".grugops")), "the command ran: a kit appeared under HOME").toBe(false);
  });
  it("H2: with `expectSrc: true` a printed GRUGOPS_SRC reaches the child; a text that sets none gives the child none, whatever the test process sets", () => {
    const dir = join(SCRATCH, `premise-${seq++}`);
    const home = join(dir, "home");
    const target = join(dir, "t");
    mkdirSync(home, { recursive: true });
    mkdirSync(target, { recursive: true });
    const printedSrc = join(dir, "printed-src");
    const injectedSrc = join(dir, "injected-src");
    mkdirSync(printedSrc, { recursive: true });
    mkdirSync(injectedSrc, { recursive: true });
    const withSrc = "`GRUGOPS_SRC=" + printedSrc + " node " + INSTALL_JS + " --target " + target + " --check`";
    const r = runPrintedCommand(withSrc, { home, timeoutMs: 120_000, expectSrc: true });
    expect(r.signal, r.stderr).toBeNull();
    expect(r.premise.grugopsSrc, "the printed GRUGOPS_SRC did not reach the child").toBeDefined();
    expect(pathText(r.premise.grugopsSrc ?? "")).toBe(pathText(printedSrc));
    const saved = process.env.GRUGOPS_SRC;
    process.env.GRUGOPS_SRC = injectedSrc;
    try {
      const none = "`node " + INSTALL_JS + " --target " + target + " --check`";
      const q = runPrintedCommand(none, { home, timeoutMs: 120_000, expectSrc: true });
      expect(q.signal, q.stderr).toBeNull();
      expect(q.premise.grugopsSrc, "the child's environment held the test process's GRUGOPS_SRC").toBeUndefined();
    } finally {
      if (saved === undefined) delete process.env.GRUGOPS_SRC;
      else process.env.GRUGOPS_SRC = saved;
    }
  });
  it("H3: a printed assignment to any other name (INSTALL_MODE) throws with or without `expectSrc`", () => {
    const home = join(SCRATCH, `premise-${seq++}`, "home");
    mkdirSync(home, { recursive: true });
    const text = "`INSTALL_MODE=symlink node " + INSTALL_JS + " --target /tmp/a/t`";
    expect(() => runPrintedCommand(text, { home })).toThrow(/INSTALL_MODE/);
    expect(() => runPrintedCommand(text, { home, expectSrc: true })).toThrow(/INSTALL_MODE/);
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

// ── D-31 (IN-23): install's closing notes read the record ───────────────────────────────────────────────────────────
// R29 (phase 34.1 gap round 2, plan 34.1-29; the review's S4). Install's closing notes split the agents recorded before
// the run and not chosen in it with install.ts installedSplit, the one answer the doctor asks too: an agent with nothing
// installed here (no holding ledger entry, nothing at its entry path) is never "Left installed"; it is named on its own
// line with the command that installs it and the command that takes it out of the record. The second is run as
// printed. The control holds that an agent with files keeps the "Left installed" line and no "Recorded as chosen" line
// is printed. The expected commands are built in the test with agentCommand; the agent names and flags are also
// checked without the builder (the registry's name, agentFlag), so a builder defect cannot hide behind them.
const LEFT_PREFIX = "  Left installed, not chosen in this run";
const RECORDED_PREFIX = "  Recorded as chosen, not chosen in this run, and nothing is installed for it here";

describe("D-31 (IN-23): install's closing notes read the record", () => {
  it("R29 (IN-23): Pi refused, then install --claude: Pi is never \"Left installed\"; the \"Recorded as chosen\" line gives Pi's install and uninstall commands, and the uninstall command run as printed leaves `agents` [claude]", () => {
    const w = world("r29");
    writeFileSync(at(w.target, ".pi"), "a regular file where Pi's directory would go\n");
    const first = runInstall(w.target, w.grugopsHome, [flag("claude"), flag("pi")], { home: w.home, timeoutMs: 180_000 });
    finished(first, "install --claude --pi");
    expect(first.status, first.stdout).toBe(3);
    expect(agentsOf(w), "premise (R18): the refused Pi stays recorded").toEqual(ids("claude", "pi"));
    expect(ledgerEntries(w).filter((e) => entryHolds(e) && entryOwners(e).includes(row("pi").id)), "premise: Pi owns no holding entry").toEqual([]);

    const r = install(w, [flag("claude")]);
    const out = r.stdout.split("\n");
    const left = out.filter((l) => l.startsWith(LEFT_PREFIX));
    for (const l of left) expect(l, "Pi has nothing installed, so it is not \"Left installed\"").not.toContain(row("pi").name);
    const recorded = out.filter((l) => l.startsWith(RECORDED_PREFIX));
    expect(recorded, r.stdout).toHaveLength(1);
    const ctx = ctxOf(w);
    const installCmd = agentCommand("install.js", w.target, [row("pi")], ctx);
    const dropCmd = agentCommand("uninstall.js", w.target, [row("pi")], ctx);
    expect(recorded[0]).toContain(`: ${row("pi").name}. To install one: `);
    expect(recorded[0]).toContain(`\`${installCmd}\` (${row("pi").name})`);
    expect(recorded[0]).toContain(`to take one out of the record: \`${dropCmd}\` (${row("pi").name})`);
    // Builder-independent: each command ends with Pi's flag, and the install one names install.js, the other uninstall.js.
    expect(shellWords(installCmd).at(-1)).toBe(flag("pi"));
    expect(shellWords(dropCmd).at(-1)).toBe(flag("pi"));
    expect(shellWords(installCmd).some((x) => x.endsWith("/install.js")), installCmd).toBe(true);
    expect(shellWords(dropCmd).some((x) => x.endsWith("/uninstall.js")), dropCmd).toBe(true);
    expect(agentsOf(w), "install never removes an agent from the record (D-04)").toEqual(ids("claude", "pi"));

    const dropped = runPrinted(w, `\`${printedCommands(recorded[0]).find((c) => c === dropCmd) ?? "(no drop command printed)"}\``);
    expect(dropped.status, dropped.stdout + dropped.stderr).toBe(0);
    expect(agentsOf(w), dropped.stdout).toEqual(ids("claude"));
    expectInvariant(w, ids("claude"), dropped.stdout);
  });

  it("R29 control: install --claude --codex, then install --claude: the \"Left installed\" line names Codex CLI, and no \"Recorded as chosen\" line is printed", () => {
    const w = world("r29c");
    install(w, [flag("claude"), flag("codex")]);
    const r = install(w, [flag("claude")]);
    const out = r.stdout.split("\n");
    const left = out.filter((l) => l.startsWith(LEFT_PREFIX));
    expect(left, r.stdout).toHaveLength(1);
    expect(left[0]).toContain(row("codex").name);
    expect(left[0]).toContain(`\`${agentCommand("uninstall.js", w.target, [row("codex")], ctxOf(w))}\` (${row("codex").name})`);
    expect(out.filter((l) => l.startsWith(RECORDED_PREFIX)), r.stdout).toEqual([]);
  });
});

// ── D-31 (IN-26): install's derivation reads the ledger it writes ───────────────────────────────────────────────────
// R30, R31 (phase 34.1 gap round 2, plan 34.1-30; brief §4: the install call site is exercised with a held entry).
// install.ts writeMarker passes agentsToRecord `known` = this run's agents plus the owners of every holding entry of
// the ledger the marker carries, and `keep` = this run's agents. A marker whose `agents` leaves out an agent whose
// files the ledger still holds (a hand edit, or a marker written by the unreleased round-0 uninstall) is put right by
// the next install: the agent is recorded again. For the shared agent skill held with no recorded owner, both owners
// are recorded (the ledger cannot tell which one install wrote it for; install-marker.ts WHY A RECORDED FIELD), and a
// per-agent uninstall of both then removes it. Each row asserts the strict invariant: every holding entry with an
// owner has an owner in `agents` (invariantBreaks over every registry id).

/** Rewrite the marker's `agents` by hand, every other field kept as read. */
function handEditAgents(w: World, agents: readonly string[]): void {
  writeFileSync(at(w.target, MARKER_REL), JSON.stringify({ ...readMarkerObject(w.target), agents }, null, 2) + "\n");
  expect(agentsOf(w), "premise: the hand edit took").toEqual(agents);
}
const ALL_IDS: readonly string[] = HOST_TOOLS.map((h) => h.id);

describe("D-31 (IN-26): install's derivation reads the ledger it writes", () => {
  it("R30 (IN-26): install --claude --codex, `agents` edited to [codex], install --codex: Claude Code is recorded again, [claude, codex]", () => {
    const w = world("r30");
    install(w, [flag("claude"), flag("codex")]);
    handEditAgents(w, ids("codex"));
    const held = ledgerEntries(w).filter((e) => entryHolds(e) && entryOwners(e).includes(row("claude").id));
    expect(held.length, "premise: the ledger holds an entry Claude Code owns").toBeGreaterThan(0);
    expect(invariantBreaks(w, ALL_IDS).length, "premise: the hand edit contradicts the ledger").toBeGreaterThan(0);

    const r = install(w, [flag("codex")]);
    expect(ledgerEntries(w).filter((e) => entryHolds(e) && entryOwners(e).includes(row("claude").id)).length, "premise: the ledger after the run still holds Claude Code's entries").toBe(held.length);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex"));
    expectInvariant(w, ALL_IDS, r.stdout);
  });

  it("R31 (IN-26, the shared agent skill): install --claude --codex, `agents` edited to [claude], install --claude: [claude, codex, antigravity]; uninstall --codex --antigravity then removes the shared skill and leaves [claude]", () => {
    const w = world("r31");
    install(w, [flag("claude"), flag("codex")]);
    handEditAgents(w, ids("claude"));
    const sharedHeld = (): LedgerEntry[] => ledgerEntries(w).filter((e) => e.path === AGENT_SKILL_REL && entryHolds(e));
    expect(sharedHeld().length, "premise: the ledger holds the shared agent skill").toBe(1);
    expect(entryOwners(sharedHeld()[0]), "premise: Codex CLI and Antigravity CLI both own it").toEqual(ids("codex", "antigravity"));

    const r = install(w, [flag("claude")]);
    expect(sharedHeld().length, "premise: the ledger after the run still holds the shared agent skill").toBe(1);
    // ids() keeps the order typed here; the registry lists Claude Code, Codex CLI, Antigravity CLI in this order.
    expect(agentsOf(w), r.stdout).toEqual(ids("claude", "codex", "antigravity"));
    expectInvariant(w, ALL_IDS, r.stdout);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), "premise: the shared agent skill is on disk").toBe(true);

    const u = uninstall(w, [flag("codex"), flag("antigravity")]);
    expect(u.status, u.stdout).toBe(0);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), u.stdout).toBe(false);
    expect(agentsOf(w), u.stdout).toEqual(ids("claude"));
    expectInvariant(w, ALL_IDS, u.stdout);
  });

  // R35: a directory entry never records its owner again. Pi's template is deleted (its file entry is no longer
  // carried) while `.pi/prompts/` holds a user file (its directory entries are carried); with Pi edited out of
  // `agents`, the next install leaves Pi out. Directory entries do not hold (install-marker.ts entryHolds).
  it("R35 (IN-26, a directory entry): install --claude --pi, Pi's template deleted and a user file in .pi/prompts/, `agents` edited to [claude], install --claude: [claude], and the ledger still records Pi's directories", () => {
    const w = world("r35");
    install(w, [flag("claude"), flag("pi")]);
    rmSync(at(w.target, PI_PROMPT_REL));
    writeFileSync(at(w.target, ".pi/prompts/mine.md"), "a prompt the user made\n");
    handEditAgents(w, ids("claude"));

    const r = install(w, [flag("claude")]);
    const piEntries = ledgerEntries(w).filter((e) => entryOwners(e).includes(row("pi").id));
    expect(piEntries.filter((e) => e.kind === "dir").length, "premise: the ledger still records a directory Pi owns").toBeGreaterThan(0);
    expect(piEntries.filter(entryHolds), "premise: Pi owns no holding entry").toEqual([]);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude"));
    expectInvariant(w, ALL_IDS, r.stdout);
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
// marker's kit home not the default: it follows both steps as printed and asserts the branch the run takes. Install
// leaves the old Codex skill untouched and does not record it; the second uninstall names it on a `left` line
// (uninstall.ts reportUnrecordedHostEntries) and keeps its bytes, which is what the remedy says ("left and reported").
// Plan 34.1-26 adds R26 (the flag-less form, whose install step carries uninstall.ts NO_FLAG_INSTALL_CLAUSE), R27 (the
// no-target or no-ledger verify, which prints the same two steps), R28 (IN-27: the agents line, the per-flag note and
// the banner say the installed set is unknown) and R34 (a `--symlink` install's remedy, run as printed).
// D-36 (plan 34.1-36, review WR-22): the install step takes nothing from the unusable marker. Its kit home is the
// uninstall run's (the GRUGOPS_HOME it was given, else the default) and it is a copy-mode install, because an
// uninstall run has no install mode; R25 and R34 are reshaped to that rule, and R39 is WR-22's reproduction (a cloned
// repository's marker naming another person's kit home), run against both binaries.

/** The `left` lines of a run that name `rel` as the path. */
const leftLinesNaming = (stdout: string, rel: string): string[] =>
  linesWith(stdout, "left").filter((l) => l.replace(/^ {2}left\s+/, "").startsWith(`${rel} (`));

/** The words before the kit home an unusable-marker remedy names for its printed install step (plan 34.1-41, D-36). */
const KIT_HOME_CLAUSE = "copies the kit into ";
/**
 * The kit home a remedy line says its printed install step copies the kit into (plan 34.1-41, D-36, review WR-22), in
 * pathText's spelling, or a `<...>` text saying why none was read: the clause must appear once, and the path runs to the
 * next `, ` (the clause ends there in every remedy that prints it). Read from the line, never from the product's builder.
 */
function namedKitHome(line: string): string {
  const at = line.indexOf(KIT_HOME_CLAUSE);
  if (at === -1) return "<no kit-home clause>";
  if (line.indexOf(KIT_HOME_CLAUSE, at + 1) !== -1) return "<the kit-home clause twice>";
  const rest = line.slice(at + KIT_HOME_CLAUSE.length);
  const end = rest.indexOf(", ");
  return end === -1 ? "<no end to the kit-home clause>" : pathText(rest.slice(0, end));
}

describe("D-33 (WR-20): the unusable-marker remedy, followed as printed", () => {
  // R25 (plan 34.1-25, D-33; reshaped by plan 34.1-36 to D-36, review WR-22): the moved marker is another directory's
  // record, so its kit home K never reaches a printed command. The first uninstall run, given no GRUGOPS_HOME, prints an
  // install command with no kit home (not followed: it would install from the default kit home). The second, given
  // GRUGOPS_HOME=K, prints the install command with K; both steps are followed as printed.
  it("R25 (WR-20, D-36): install --claude --codex with kit home K, move the target; uninstall --codex with no GRUGOPS_HOME prints an install command with no kit home (not K: the moved marker is another directory's record); with GRUGOPS_HOME=K it prints the install command with --codex and K, then the uninstall command; run as printed, the second uninstall reports the old Codex skill on a `left` line and keeps its bytes, and no kit appears under HOME", () => {
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
    const movedVerify = (r: Run): string => {
      const verifies = linesWith(r.stdout, "verify").filter((l) => l.includes(".grugops/install.json") && l.includes("not this directory's record"));
      expect(verifies.length, r.stdout).toBe(1);
      expect(r.stdout, "the remedy no longer says any agent flag will do").not.toMatch(/any agent flag/);
      return verifies[0];
    };
    const installSpansOf = (v: string): string[] =>
      printedCommands(v).filter((c) => shellWords(c).some((x) => isAbsolute(x) && pathText(x) === pathText(INSTALL_JS)));

    // First run, no GRUGOPS_HOME: the moved marker's K is another directory's record and never reaches the command.
    const r0 = runUninstall(b, K, { home: w.home, omitKitHome: true, timeoutMs: 120_000 }, [flag("codex")]);
    finished(r0, "uninstall --codex in the moved target with no GRUGOPS_HOME");
    expect(r0.status, r0.stdout).toBe(3);
    const spans0 = installSpansOf(movedVerify(r0));
    expect(spans0.length, `the verify names one install command\n${r0.stdout}`).toBe(1);
    expect(shellWords(spans0[0]).filter((x) => x.startsWith("GRUGOPS_HOME=")), `the install command carries a kit home from the moved marker: ${spans0[0]}`).toEqual([]);
    // Plan 34.1-41 (2026-10-13, D-36): the line says where that step puts the kit, this run's default kit home, not K.
    expect(namedKitHome(movedVerify(r0)), `the verify does not name the kit home its install step copies into\n${r0.stdout}`).toBe(pathText(defaultKit));

    // Second run, GRUGOPS_HOME=K given: the install command carries this run's kit home.
    const r = runUninstall(b, K, { home: w.home, timeoutMs: 120_000 }, [flag("codex")]);
    finished(r, "uninstall --codex in the moved target with GRUGOPS_HOME=K");
    expect(r.status, r.stdout).toBe(3);
    const v = movedVerify(r);
    const cmds = printedCommands(v);
    expect(cmds.length, `premise: the verify printed commands\n${v}`).toBeGreaterThan(0);
    // Builder-independent facts about the install step first: the expected side below is built by the builder under test.
    const installSpans = installSpansOf(v);
    expect(installSpans.length, `the verify names one install command\n${v}`).toBe(1);
    const iw = shellWords(installSpans[0]);
    expect(iw[0].startsWith("GRUGOPS_HOME="), `the install command carries no kit home: ${installSpans[0]}`).toBe(true);
    expect(pathText(iw[0].slice("GRUGOPS_HOME=".length)), `the install command's kit home is not the run's: ${installSpans[0]}`).toBe(pathText(K));
    expect(iw[1], `the install command's second word is not node: ${installSpans[0]}`).toBe("node");
    expect(isAbsolute(iw[2]) && pathText(iw[2]) === pathText(INSTALL_JS), `the install script is not this checkout's install.js by its absolute path: ${installSpans[0]}`).toBe(true);
    expect(iw, `the install command does not name this run's agent: ${installSpans[0]}`).toContain("--codex");
    expect(iw, "the install command names an agent this run did not name").not.toContain("--claude");
    // Plan 34.1-41 (2026-10-13, D-36): the line names K as the kit home the install step copies into.
    expect(namedKitHome(v), `the verify does not name K as the kit home its install step copies into\n${v}`).toBe(pathText(K));
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

  // R26 (plan 34.1-26, D-33, the flag-less form): a flag-less uninstall over a moved target prints the flag-less install
  // command with the one clause that says what install does with no agent flag, then the flag-less uninstall command.
  // Followed as printed, the install chooses Claude Code because `.claude` is there, and the uninstall names the earlier
  // Claude Code skills on `left` lines and keeps them.
  it("R26 (D-33, flag-less): install --claude, move the target, flag-less uninstall prints the flag-less install command with the no-agent-flag clause, then the flag-less uninstall command; run as printed, install chooses Claude Code (detected) and the uninstall reports the earlier Claude Code skills as left", () => {
    const w = world("r26");
    install(w, [flag("claude")]);
    const b = join(dirname(w.target), "b", "target");
    mkdirSync(dirname(b), { recursive: true });
    renameSync(w.target, b);
    const moved: World = { ...w, target: b };
    const skill = at(b, CLAUDE_SKILL);
    expect(existsSync(skill), "premise: the moved target holds a Claude Code skill").toBe(true);
    const skillBytes = readFileSync(skill);
    // The clause is written in one place in the product source, which both unusable-marker verifies use.
    const source = readFileSync(join(REPO_ROOT, "install", "uninstall.ts"), "utf8");
    expect(source.split(NO_FLAG_CLAUSE).length - 1, "the no-agent-flag clause is not written exactly once in uninstall.ts").toBe(1);

    const r = uninstall(moved, []);
    expect(r.status, r.stdout).toBe(3);
    const verifies = linesWith(r.stdout, "verify").filter((l) => l.includes("not this directory's record"));
    expect(verifies.length, r.stdout).toBe(1);
    const v = verifies[0];
    const cmds = printedCommands(v);
    expect(cmds.length, `premise: the verify printed commands\n${v}`).toBeGreaterThan(0);
    // Builder-independent facts first: the install span is `node <abs install.js> --target <b>` and nothing else.
    const installSpans = cmds.filter((c) => shellWords(c).some((x) => isAbsolute(x) && pathText(x) === pathText(INSTALL_JS)));
    expect(installSpans.length, `the verify names one install command\n${v}`).toBe(1);
    const iw = shellWords(installSpans[0]);
    expect(iw.length, `the flag-less install command carries more than node, the script and --target: ${installSpans[0]}`).toBe(4);
    expect([iw[0], iw[2]], installSpans[0]).toEqual(["node", "--target"]);
    expect(pathText(iw[3]), installSpans[0]).toBe(pathText(b));
    expect(v, "the clause does not follow the flag-less install command").toContain(`\`${installSpans[0]}\`${NO_FLAG_CLAUSE}`);
    // Plan 34.1-41 (2026-10-13, D-36): the line names the run's default kit home as where the install step puts the kit.
    expect(namedKitHome(v), `the verify does not name the kit home its install step copies into\n${v}`).toBe(pathText(join(w.home, ".grugops")));
    const installCmd = agentCommand("install.js", b, [], ctxOf(w));
    const uninstallCmd = agentCommand("uninstall.js", b, [], ctxOf(w));
    expect(cmds, v).toEqual([uninstallCmd, installCmd, uninstallCmd]);

    const step1 = runPrintedCommand("`" + installCmd + "`", { home: w.home, timeoutMs: 180_000 });
    finished(step1, `the printed install command ${installCmd}`);
    expect(relative(REPO_ROOT, step1.premise.cwd).startsWith(".."), `premise: the printed command ran from ${step1.premise.cwd}`).toBe(true);
    expect(step1.premise.grugopsHome, "premise: the default kit home, so the printed text sets none").toBeUndefined();
    expect(step1.status, step1.stdout + step1.stderr).toBe(0);
    expect(step1.stdout, "install did not choose Claude Code because .claude is there").toMatch(/^agents: Claude Code \(detected: \.claude\)$/m);
    expect(agentsOf(moved), step1.stdout).toEqual(ids("claude"));

    const step2 = runPrinted(moved, "`" + uninstallCmd + "`");
    expect(step2.status, step2.stdout + step2.stderr).toBe(0);
    expect(leftLinesNaming(step2.stdout, CLAUDE_SKILL).length, `no left line names the earlier Claude Code skill\n${step2.stdout}`).toBe(1);
    expect(existsSync(skill) && readFileSync(skill).equals(skillBytes), `the earlier Claude Code skill was changed or removed\n${step2.stdout}`).toBe(true);
  }, 600_000);

  // R27 (plan 34.1-26, D-33, WR-20's other branch): a marker with no install ledger. The verify prints this run's install
  // command (reinstallCommand), then this run's uninstall command, and no line says any agent flag will do. The
  // flag-less form of the same verify carries the no-agent-flag clause; a per-agent run does not. The --codex form is
  // followed as printed: install records [codex] and leaves the old Codex skill unrecorded, and the uninstall reports it
  // as left.
  it("R27 (D-33, no-ledger marker): --codex prints the --codex install command then the --codex uninstall command, never 'any agent flag'; the flag-less form carries the no-agent-flag clause; the --codex steps, run as printed, report the old Codex skill as left", () => {
    for (const args of [[flag("codex")], []] as const) {
      const w = world("r27");
      install(w, [flag("claude"), flag("codex")]);
      const m = readMarkerObject(w.target);
      delete m.ledger;
      writeFileSync(at(w.target, MARKER_REL), JSON.stringify(m, null, 2) + "\n");
      const skill = at(w.target, AGENT_SKILL_REL);
      const skillBytes = readFileSync(skill);
      const r = uninstall(w, args);
      const what = args.length === 0 ? "flag-less" : args.join(" ");
      expect(r.status, `${what}\n${r.stdout}`).toBe(3);
      const verifies = linesWith(r.stdout, "verify").filter((l) => l.includes("not a record this run can use") && l.includes("no install ledger"));
      expect(verifies.length, `${what}\n${r.stdout}`).toBe(1);
      const anyFlag = r.stdout.split("\n").filter((l) => /any agent flag/.test(l));
      expect(anyFlag.length, `${what}: a remedy says any agent flag will do: ${anyFlag.join(" | ")}`).toBe(0);
      const v = verifies[0];
      const cmds = printedCommands(v);
      expect(cmds.length, `premise: the verify printed commands\n${v}`).toBeGreaterThan(0);
      const hosts = args.length === 0 ? [] : [row("codex")];
      const installCmd = agentCommand("install.js", w.target, hosts, ctxOf(w));
      const uninstallCmd = agentCommand("uninstall.js", w.target, hosts, ctxOf(w));
      // Builder-independent: the install span names this checkout's install.js by its absolute path and this run's flags.
      const iw = shellWords(cmds[0]);
      expect(iw.some((x) => isAbsolute(x) && pathText(x) === pathText(INSTALL_JS)), `the first printed command is not install.js: ${cmds[0]}`).toBe(true);
      expect(iw.filter((x) => /^--(?!target$)/.test(x)), `the install command's agent flags are not this run's: ${cmds[0]}`).toEqual([...args]);
      expect(cmds, v).toEqual([installCmd, uninstallCmd]);
      // Plan 34.1-41 (2026-10-13, D-36): the line names the run's default kit home as where the install step puts the kit.
      expect(namedKitHome(v), `${what}: the verify does not name the kit home its install step copies into\n${v}`).toBe(pathText(join(w.home, ".grugops")));
      if (args.length === 0) {
        expect(v, "the flag-less form does not carry the no-agent-flag clause after the install command").toContain(`\`${installCmd}\`${NO_FLAG_CLAUSE}`);
        // Plan 34.1-41 (2026-10-13, D-36): the doctor's no-target or no-ledger WARN over the same marker prints the same
        // install command and names the same kit home as where it puts the kit.
        const d = spawnBin(INSTALL_JS, ["--check"], w.target, w.grugopsHome, { home: w.home, timeoutMs: 120_000 });
        finished(d, "--check over a marker with no install ledger");
        const dw = d.stdout.split("\n").filter((l) => /^ {2}WARN\s/.test(l) && l.includes("not a record uninstall can use"));
        expect(dw.length, d.stdout).toBe(1);
        expect(printedCommands(dw[0])[0], `the doctor's WARN does not print the uninstaller's install command first\n${dw[0]}`).toBe(installCmd);
        expect(namedKitHome(dw[0]), `the doctor's WARN does not name the kit home its install step copies into\n${dw[0]}`).toBe(pathText(join(w.home, ".grugops")));
        continue;
      }
      expect(v, "a per-agent run carries the no-agent-flag clause").not.toContain(NO_FLAG_CLAUSE);

      const step1 = runPrintedCommand("`" + installCmd + "`", { home: w.home, timeoutMs: 180_000 });
      finished(step1, `the printed install command ${installCmd}`);
      expect(relative(REPO_ROOT, step1.premise.cwd).startsWith(".."), `premise: the printed command ran from ${step1.premise.cwd}`).toBe(true);
      expect(step1.status, step1.stdout + step1.stderr).toBe(0);
      expect(agentsOf(w), step1.stdout).toEqual(ids("codex"));
      expect(ledgerEntries(w).some((e) => e.path === AGENT_SKILL_REL), "install recorded the file it left untouched").toBe(false);
      const step2 = runPrinted(w, "`" + uninstallCmd + "`");
      expect(step2.status, step2.stdout + step2.stderr).toBe(0);
      expect(step2.stdout, "the second uninstall says Codex CLI is not installed").not.toMatch(/Codex CLI is not installed here/);
      expect(leftLinesNaming(step2.stdout, AGENT_SKILL_REL).length, `no left line names the old Codex skill\n${step2.stdout}`).toBe(1);
      expect(existsSync(skill) && readFileSync(skill).equals(skillBytes), `the old Codex skill was changed or removed\n${step2.stdout}`).toBe(true);
    }
  }, 900_000);

  // R34 (plan 34.1-26, D-33, the install mode; reshaped by plan 34.1-36 to D-36, review WR-22): after a `--symlink`
  // install with kit home K, the target moves. The moved marker is another directory's record, so neither its kit home
  // nor its install mode reaches the printed install command, and an uninstall run has no install mode: the install step
  // is a copy-mode install with the kit home the uninstall run was given (GRUGOPS_HOME=K here). Plan 34.1-36 Task 1 step
  // 0 ran that step over a moved `--symlink` install before any edit and observed one outcome, arm (i): exit 0, the
  // marker records installMode copy and grugopsHome K, and no kit under HOME. This row pins that outcome only.
  it("R34 (D-33, D-36, --symlink): install --symlink --codex with kit home K, move the target, uninstall --codex with GRUGOPS_HOME=K prints an install command with GRUGOPS_HOME=K and no --symlink (the moved marker's install mode is another directory's record); run as printed it exits 0, the new marker records installMode copy and kit home K, and no kit appears under HOME", () => {
    const w = world("r34");
    const K = join(dirname(w.home), "kit-k");
    const i = runInstall(w.target, K, ["--symlink", flag("codex")], { home: w.home, timeoutMs: 180_000 });
    finished(i, "install --symlink --codex with kit home K");
    expect(i.status, i.stdout).toBe(0);
    expect(readMarkerObject(w.target).installMode, "premise: a symlink install").toBe("symlink");
    const b = join(dirname(w.target), "b", "target");
    mkdirSync(dirname(b), { recursive: true });
    renameSync(w.target, b);
    const moved: World = { ...w, target: b };

    const r = runUninstall(b, K, { home: w.home, timeoutMs: 120_000 }, [flag("codex")]);
    finished(r, "uninstall --codex in the moved target with GRUGOPS_HOME=K");
    expect(r.status, r.stdout).toBe(3);
    const verifies = linesWith(r.stdout, "verify").filter((l) => l.includes("not this directory's record"));
    expect(verifies.length, r.stdout).toBe(1);
    const v = verifies[0];
    expect(v, "a per-agent run carries the no-agent-flag clause").not.toContain(NO_FLAG_CLAUSE);
    const installSpans = printedCommands(v).filter((c) => shellWords(c).some((x) => isAbsolute(x) && pathText(x) === pathText(INSTALL_JS)));
    expect(installSpans.length, `the verify names one install command\n${v}`).toBe(1);
    const iw = shellWords(installSpans[0]);
    // Builder-independent facts first.
    expect(iw[0].startsWith("GRUGOPS_HOME="), `the install command carries no kit home: ${installSpans[0]}`).toBe(true);
    expect(pathText(iw[0].slice("GRUGOPS_HOME=".length)), installSpans[0]).toBe(pathText(K));
    expect(iw, `the install command takes --symlink from the moved marker: ${installSpans[0]}`).not.toContain("--symlink");
    expect(iw, installSpans[0]).toContain("--codex");
    // Plan 34.1-41 (2026-10-13, D-36): the line names K as the kit home the install step copies into.
    expect(namedKitHome(v), `the verify does not name K as the kit home its install step copies into\n${v}`).toBe(pathText(K));
    expect(installSpans[0]).toBe(agentCommand("install.js", b, [row("codex")], commandContextFor({ grugopsHome: K, home: w.home })));

    const step1 = runPrintedCommand("`" + installSpans[0] + "`", { home: w.home, timeoutMs: 180_000 });
    finished(step1, `the printed install command ${installSpans[0]}`);
    expect(relative(REPO_ROOT, step1.premise.cwd).startsWith(".."), `premise: the printed command ran from ${step1.premise.cwd}`).toBe(true);
    expect(pathText(String(step1.premise.grugopsHome)), "premise: the child's kit home is the printed one").toBe(pathText(K));
    expect(existsSync(join(w.home, ".grugops")), `the printed install wrote a kit under HOME\n${step1.stdout}`).toBe(false);
    // The one outcome plan 34.1-36 Task 1 step 0 observed (arm (i)).
    expect(step1.status, step1.stdout + step1.stderr).toBe(0);
    const after = readMarkerObject(moved.target);
    expect(after.installMode, `the printed copy-mode install did not record a copy install\n${step1.stdout}`).toBe("copy");
    expect(pathText(String(after.grugopsHome)), step1.stdout).toBe(pathText(K));
  }, 600_000);

  // R39 (plan 34.1-36, D-36, review WR-22): another directory's marker contributes nothing to a printed command. A
  // cloned repository's marker names another person's kit home F; the uninstaller's other-directory verify used to
  // print `GRUGOPS_HOME=<F> node .../install.js`, and disagreed with the doctor for the same marker. (a) with no
  // GRUGOPS_HOME the uninstaller's install span carries no kit home and no word holding F; (b) the doctor's unbound
  // WARN prints the same install span for the same marker and environment; (c) with GRUGOPS_HOME X the span carries X
  // and not F. (a)'s span, run as printed, chooses Claude Code (detected by `.claude`), writes nothing under F, and
  // leaves a marker for this directory with the run's default kit home.
  it("R39 (WR-22, D-36): over another directory's marker naming a foreign kit home F, the uninstaller's printed install command carries no GRUGOPS_HOME word and no F, equals the doctor's, carries the run's own GRUGOPS_HOME when given; run as printed it exits 0 and writes nothing under F", () => {
    const w = world("r39");
    install(w, [flag("claude")]);
    const root = dirname(w.target);
    const other = join(root, "elsewhere", "target");
    const F = join(root, "alice", ".grugops");
    const m = readMarkerObject(w.target);
    m.target = other;
    m.grugopsHome = F;
    m.kitRoot = join(F, "agent-factory");
    writeFileSync(at(w.target, MARKER_REL), JSON.stringify(m, null, 2) + "\n");
    const read = readInstallMarker(w.target);
    expect(read.state, "premise: the hand-edited marker reads unbound").toBe("unbound");
    expect(read.state === "unbound" && read.unboundBy, "premise: unbound because it names another directory").toBe("other-directory");
    expect(existsSync(F), "premise: the foreign kit home does not exist").toBe(false);
    const installSpanOf = (text: string): string => {
      const spans = printedCommands(text).filter((c) => shellWords(c).some((x) => isAbsolute(x) && pathText(x) === pathText(INSTALL_JS)));
      expect(spans.length, `the line names one install command\n${text}`).toBe(1);
      return spans[0];
    };

    // (a) flag-less uninstall with no GRUGOPS_HOME.
    const a = runUninstall(w.target, w.grugopsHome, { home: w.home, omitKitHome: true, timeoutMs: 120_000 });
    finished(a, "flag-less uninstall over another directory's marker with no GRUGOPS_HOME");
    expect(a.status, a.stdout).toBe(3);
    const av = linesWith(a.stdout, "verify").filter((l) => l.includes("not this directory's record"));
    expect(av.length, a.stdout).toBe(1);
    const aSpan = installSpanOf(av[0]);
    const aw = shellWords(aSpan);
    expect(aw.filter((x) => x.startsWith("GRUGOPS_HOME=")), `the install command carries a kit home: ${aSpan}`).toEqual([]);
    expect(aw.filter((x) => x.includes(pathText(F))), `a word of the install command holds the foreign kit home: ${aSpan}`).toEqual([]);
    expect(aw[0], aSpan).toBe("node");
    // Plan 34.1-41 (2026-10-13, D-36): the line names the run's default kit home as where the install step puts the kit.
    const defaultKitHome = pathText(join(w.home, ".grugops"));
    expect(namedKitHome(av[0]), `the verify does not name the kit home its install step copies into\n${av[0]}`).toBe(defaultKitHome);

    // (b) the doctor, same target, same environment: the same install span.
    const b = spawnBin(INSTALL_JS, ["--check"], w.target, w.grugopsHome, { home: w.home, omitKitHome: true, timeoutMs: 120_000 });
    finished(b, "--check over another directory's marker with no GRUGOPS_HOME");
    const bw = b.stdout.split("\n").filter((l) => l.includes("WARN") && l.includes("not this directory's record"));
    expect(bw.length, b.stdout).toBe(1);
    expect(installSpanOf(bw[0]), "the doctor and the uninstaller print different install commands for one marker").toBe(aSpan);
    expect(namedKitHome(bw[0]), `the doctor's WARN does not name the kit home its install step copies into\n${bw[0]}`).toBe(defaultKitHome);

    // (c) GRUGOPS_HOME X given to the uninstall run: the span carries X, never F.
    const X = join(root, "kit-x");
    expect(pathText(X), "premise: X is not the default kit home").not.toBe(pathText(join(w.home, ".grugops")));
    const c = runUninstall(w.target, X, { home: w.home, timeoutMs: 120_000 });
    finished(c, "flag-less uninstall over another directory's marker with GRUGOPS_HOME X");
    expect(c.status, c.stdout).toBe(3);
    const cv = linesWith(c.stdout, "verify").filter((l) => l.includes("not this directory's record"));
    expect(cv.length, c.stdout).toBe(1);
    const cSpan = installSpanOf(cv[0]);
    const cw = shellWords(cSpan);
    expect(cw[0].startsWith("GRUGOPS_HOME="), `the install command does not carry the run's kit home: ${cSpan}`).toBe(true);
    expect(pathText(cw[0].slice("GRUGOPS_HOME=".length)), cSpan).toBe(pathText(X));
    expect(cw.filter((x) => x.includes(pathText(F))), `a word of the install command holds the foreign kit home: ${cSpan}`).toEqual([]);
    expect(namedKitHome(cv[0]), `the verify does not name X as the kit home its install step copies into\n${cv[0]}`).toBe(pathText(X));

    // (a)'s install span, followed as printed.
    const step = runPrintedCommand("`" + aSpan + "`", { home: w.home, timeoutMs: 180_000 });
    finished(step, `the printed install command ${aSpan}`);
    expect(relative(REPO_ROOT, step.premise.cwd).startsWith(".."), `premise: the printed command ran from ${step.premise.cwd}`).toBe(true);
    expect(step.premise.grugopsHome, "premise: the printed text sets no kit home").toBeUndefined();
    expect(step.status, step.stdout + step.stderr).toBe(0);
    expect(step.stdout, "install did not choose Claude Code because .claude is there").toMatch(/^agents: Claude Code \(detected: \.claude\)$/m);
    expect(existsSync(F), `the printed install wrote under the foreign kit home\n${step.stdout}`).toBe(false);
    const after = readMarkerObject(w.target);
    expect(pathText(String(after.target)), step.stdout).toBe(pathText(w.target));
    expect(pathText(String(after.grugopsHome)), step.stdout).toBe(pathText(join(w.home, ".grugops")));
  }, 600_000);
});

/** The one clause both unusable-marker verifies print after a flag-less install command (plan 34.1-26, D-33). */
const NO_FLAG_CLAUSE =
  " (with no agent flag, install chooses the agents detected here, shows the agent list at a terminal, or refuses and names the agent flags)";

// ── D-32: printed alternatives that touch the marker or its ledger (CR-03) ───────────────────────────────────────────
//
// The rule (34.1-GAP-PLANNING-BRIEF.md §4): every remedy the installer prints, by-hand alternatives included, leaves
// every staying agent reversible. uninstall.ts keepWithoutRecord is the one wording of the alternative to finishing a
// kept reversal, asked by the kept `left` line and the KEPT_FOR banner. R19 holds its partial branch by following the
// printed alternative and then removing the staying agent; R20 holds its FULL branch (since plan 34.1-42, D-37, the
// same per-entry ledger edit, finished by the flag-less command; it never offers deleting the marker).

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
//
// The OWNER tag each variant carried from plan 34.1-34 (which removal answer of the owner decided it) was deleted by plan
// 34.1-44 (2026-10-13, D-37): the owner has no removal answer, so nothing decides a variant by it. The rule D-37 holds
// over every product module instead: no variant offers removing the marker (DELETE_MARKER or MARKER_REMOVAL), under any
// condition.

/** The marker's spelling in the product (MARKER_REL in both binaries, markerRel in install.ts writeMarker). */
const MARKER_SPELLINGS: ReadonlySet<string> = new Set(["MARKER_REL", "markerRel"]);
const NOUN = /\b(marker|install\.json|ledger)\b|`agents`/i;
const TOUCH = /\b(delete|remove|take|fix|set)\b[^.]*(\b(marker|install\.json|ledger)\b|`agents`)/i;
const BY_HAND = /\bby hand\b/i;
/** The delete-the-marker text: telling the user to delete the marker. "never delete" is its opposite. */
const DELETE_MARKER = /(?<!never )\bdelete (the marker|\.grugops\/install\.json)\b/i;
/** Any other offer to remove the marker, in the spellings a remedy has used (plan 34.1-34, D-35). */
const MARKER_REMOVAL = /\b(fix or remove the marker|fix or remove it by hand|remove the marker)\b/i;
/** Whether a reading offers removing the marker (D-37's zero-offer rule reads this). */
const offersRemoval = (text: string): boolean => DELETE_MARKER.test(text) || MARKER_REMOVAL.test(text);

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
  | "not a usable record"
  | "never remove the marker"
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
  // The class "usable record, FULL only" (U1, U2: keepWithoutRecord's FULL delete-the-marker text) was retired by plan
  // 34.1-42 (2026-10-13, D-37, which amends D-32): its two rows left, and keepWithoutRecord's FULL readings are the
  // per-entry ledger edit (class "per entry" below, guard FULL).
  // The class "split by the owner" (U4: removeMarker's line over install's own marker with a malformed ledger, split by
  // markerRemedy's mayRemove into a fix-or-remove reading on a FULL run and a fix-the-field reading on a partial one) was
  // retired by plan 34.1-43 (2026-10-13, D-37, 34.1 review CR-06): U4 has one line, which points at the module-top
  // verify for a malformed ledger ("see the verify line above") and names no remedy verb aimed at the marker, so the
  // walk no longer reports it; its two rows left.
  // The class "no well-formed ledger: fix or remove" (I1: the doctor's unreadable-marker FAIL; I5 and I6: writeAskRules'
  // and askRulesStep's unreadable-marker verifies; U3 left it at plan 34.1-42) was retired by plan 34.1-44 (2026-10-13,
  // D-37, 34.1 review CR-05): each of the three has one reading, the cause then markerFixText of the owner's answer (a
  // substitution, whose own row is "never remove the marker" below), so its own text names no remedy verb aimed at the
  // marker and the walk no longer reports it (R36 control and R37d follow the trailing-comma marker as printed).
  // not a usable record (the legacy-marker verify): no run reads a record from it, before or after the remedy, and it
  // offers no removal of the marker (markerRemedy answers no for an unbound read; the remedy is a re-install).
  ["uninstall.ts", "<module>", "either", ".grugops/install.json is install's marker, but not a record this run can use: ${MARKER_READ.why}. So none of its records is used here, and this run removes and edits nothing. Run `${reinstallCommand()}`${NO_FLAG_INSTALL_CLAUSE}, then `${rerunCommand()}`: install copies the kit into ${contextKitHome(COMMAND_CONTEXT, DEFAULT_KIT_HOME)}, writes a marker for this directory with the install ledger and carries none of these records, so what an earlier install made here is then left and reported, for you to remove by hand.", "not a usable record", "a marker written before markers were bound or before the one ledger: this build reads no record from it, so the re-install that replaces it drops none (re-pinned by plan 34.1-41, 2026-10-13, D-36: the line names the kit home its printed install step copies the kit into, this run's, never the unusable marker's)"],
  // never remove the marker (plan 34.1-33, D-35, 34.1 review CR-04; plan 34.1-42, D-37, 34.1 review CR-05): the one
  // never-remove wording. Re-pinned by plan 34.1-42 (2026-10-13, D-37): true for every reader state, it names the read's
  // problems (`named`, empty when there are none) and says the marker is the one record install keeps of the agents
  // installed here, claiming nothing about the install ledger; the class was "never remove while a well-formed ledger is
  // present" until D-37 made the rule hold whatever the read.
  ["install-marker.ts", "markerFixText", "either", "Fix .grugops/install.json by hand${named}; never delete the marker: it is the one record install keeps of the agents installed here, so without it no uninstall can undo what install made", "never remove the marker", "the uninstaller's module-top verify prints it over every unreadable read (R41, R38), and install.ts where markerRemedy answers no removal (R36, R37); since plan 34.1-43 (2026-10-13, D-37, 34.1 review CR-06) also over a malformed install ledger, in the uninstaller's module-top verify (R21, R43a, R43b), the doctor's FAIL and install's writeMarker and writeAskRules verifies (R43c)"],
  // per entry (U5, plan 34.1-19's partial-run alternative): only named ledger entries leave the record.
  ["uninstall.ts", "updateKeptMarker", "either", "it still lists what this run removed or reversed (${what}); take those entries out of its install ledger by hand, or a later run may act on them", "per entry", "U5: only the entries this run already removed or reversed"],
  ["uninstall.ts", "keepWithoutRecord", "partial", "or, to keep it, take its entry out of the install ledger in .grugops/install.json by hand${then}; never delete ${marker}: it is still the record of ${nameList(STAYING)}", "per entry", "the held entry only; the marker stays the record of the staying agents (R19)"],
  ["uninstall.ts", "keepWithoutRecord", "partial", "or, to keep them, take their entries out of the install ledger in .grugops/install.json by hand${then}; never delete ${marker}: it is still the record of ${nameList(STAYING)}", "per entry", "the held entries only; the marker stays the record of the staying agents (R19)"],
  // Plan 34.1-42 (2026-10-13, D-37): keepWithoutRecord's FULL readings, the same per-entry edit finished by the flag-less
  // command (the step-0 probe showed it finishes; R20 follows it), naming what install made here (STAYING is empty).
  ["uninstall.ts", "keepWithoutRecord", "FULL", "or, to keep it, take its entry out of the install ledger in .grugops/install.json by hand${then}; never delete ${marker}: it is still the record of what install made here", "per entry", "the held entry only, on a FULL run; the marker stays the record a later run needs (R20)"],
  ["uninstall.ts", "keepWithoutRecord", "FULL", "or, to keep them, take their entries out of the install ledger in .grugops/install.json by hand${then}; never delete ${marker}: it is still the record of what install made here", "per entry", "the held entries only, on a FULL run; the marker stays the record a later run needs (R20)"],
  // per field (U6): one field set to the value the run computed.
  ["uninstall.ts", "updateKeptMarker", "either", "its `agents` list still names the agents this run removed; set it to ${agentsNow} by hand, or a later install chooses them again", "per field", "U6: the value is agentsAfter's, which agentsToRecord derives"],
  // fix: the record is repaired in place and every agent's record stays.
  ["uninstall.ts", "<module>", "either", ".grugops/install.json is install's marker, but not this directory's record: ${MARKER_READ.why}. So none of its records is used here (the install ledger), and this run removes and edits nothing on it. If this is the same repository moved or renamed from ${MARKER_READ.boundTo}, set \"target\" in the marker to ${JSON.stringify(here)} and run `${rerunCommand()}` again. Otherwise run `${reinstallCommand()}`${NO_FLAG_INSTALL_CLAUSE}: it copies the kit into ${contextKitHome(COMMAND_CONTEXT, DEFAULT_KIT_HOME)}, writes a marker for this directory and carries none of these records; then run `${rerunCommand()}`: what an earlier install made here is then left and reported, for you to remove by hand.", "fix", "U7: set \"target\"; the re-install is offered only when the records are another directory's (re-pinned by plan 34.1-41, 2026-10-13, D-36: the line names the kit home its printed install step copies the kit into, this run's, never the unusable marker's)"],
  ["uninstall.ts", "<module>", "either", ".grugops/install.json is install's marker, but not this directory's record: ${MARKER_READ.why}. So none of its records is used here (the install ledger), and this run removes and edits nothing on it. If this is the same repository moved or renamed, set \"target\" in the marker to ${JSON.stringify(here)} and run `${rerunCommand()}` again. Otherwise run `${reinstallCommand()}`${NO_FLAG_INSTALL_CLAUSE}: it copies the kit into ${contextKitHome(COMMAND_CONTEXT, DEFAULT_KIT_HOME)}, writes a marker for this directory and carries none of these records; then run `${rerunCommand()}`: what an earlier install made here is then left and reported, for you to remove by hand.", "fix", "U7 (no boundTo recorded): as above (re-pinned by plan 34.1-41, 2026-10-13, D-36: the line names the kit home its printed install step copies the kit into, this run's, never the unusable marker's)"],
  ["install.ts", "doctor", "either", "the install marker ${markerFile} is not this directory's record: ${markerRead.why}. Uninstall uses none of its records here and changes nothing. If this is the same repository moved or renamed, set \"target\" in the marker to ${JSON.stringify(markerRead.here ?? TARGET)}; otherwise re-run install.js here, `${doctorInstallCommand()}` (${DOCTOR_NO_FLAG_CLAUSE}), which copies the kit into ${contextKitHome(COMMAND_CONTEXT, DEFAULT_KIT_HOME)}, writes a marker for this directory and carries none of these records", "fix", "the doctor's unbound marker: set \"target\"; the re-install is offered only when the records are another directory's (plan 34.1-27: with the doctor's install command and the no-agent-flag clause) (re-pinned by plan 34.1-41, 2026-10-13, D-36: the line names the kit home its printed install step copies the kit into, this run's, never the unusable marker's)"],
  // I2 (the doctor's malformed-ledger FAIL), I3 (writeMarker's verify) and I4 (writeAskRules' verify) left this class at
  // plan 34.1-43 (2026-10-13, D-37, 34.1 review CR-06): each keeps its opening and prints markerFixText of the owner's
  // answer (a substitution, whose own row is "never remove the marker"), so its own text names no remedy verb aimed at
  // the marker and the walk no longer reports it (R43c follows the doctor's FAIL and install's verifies).
  // The module-top malformed-ledger verify left this class at plan 34.1-43 (2026-10-13, D-37, 34.1 review CR-06): its
  // one reading is the cause, then markerFixText of the owner's answer (a substitution, whose own row is "never remove
  // the marker" above), then this run's command; its files-by-hand alternative is deleted. Its own text names no remedy
  // verb aimed at the marker, so the walk no longer reports it (R21, R43a and R43b follow it as printed).
  // touches no record: the by-hand remedy is about a file, a block or a rule; the marker or ledger is only named as the reason.
  ["uninstall.ts", "removeSentinelBlock", "either", "${label} (the grugops block in it no longer matches the block install recorded appending — a line inside it was added, edited or removed, its line ends or spacing changed, or a marker line is missing — so nothing was removed and the file was left as it is; remove the grugops lines by hand, keeping any line of yours)", "touches no record", "the pointer block's lines; \"marker line\" is the block's own sentinel"],
  ["uninstall.ts", "removeAskRules", "either", "${rel}: ${read.at} ${read.reason}. It was not read and was left untouched; the ${ledger.size} ask rule(s) grugops added were NOT removed. Remove them by hand.", "touches no record", "the ask rules in the settings file"],
  ["uninstall.ts", "removeAskRules", "either", "${rel} is not a JSON object — left untouched; the ${ledger.size} ask rule(s) grugops added were NOT removed. Fix the file, then run `${rerunCommand()}` again, or remove them by hand.", "touches no record", "the settings file and its ask rules"],
  ["uninstall.ts", "removeAskRules", "either", "${rel} ${doc.why} — left untouched; the ${ledger.size} ask rule(s) grugops added were NOT removed. Fix the file, then run `${rerunCommand()}` again, or remove them by hand.", "touches no record", "the settings file and its ask rules"],
  ["uninstall.ts", "removeAskRules", "either", "${rel} has more than one \"permissions\" or \"permissions.ask\" key, so which one Claude Code reads is not known — left untouched; the ${ledger.size} ask rule(s) grugops added were NOT removed. Remove them by hand.", "touches no record", "the ask rules in the settings file"],
  ["uninstall.ts", "removeAskRules", "either", "${r} (present in ${rel} but not in the install ledger — there is no record that install added this copy, so it is left in place; remove it by hand if grugops added it)", "touches no record", "one ask rule"],
  ["uninstall.ts", "unrecordedFileReason", "either", "there is no install marker, so there is no record that install wrote it — left in place; remove it by hand if grugops put it there", "touches no record", "one file; there is no marker"],
  ["uninstall.ts", "reportUnrecordedSettings", "either", "${rel} (the install ledger has no gemini entry, so there is no record of what install changed in it — left untouched; if grugops added AGENTS.md to context.fileName, remove that entry by hand)", "touches no record", "one entry of .gemini/settings.json"],
  // reportUnrecordedSettings' ask-rules verify over an unusable marker ("... Remove the grugops ask rules by hand.") left
  // this class at plan 34.1-45 (2026-10-13, D-37, 34.1 review IN-34): it is a `left` line pointing at the module-top
  // verify, "ask rules (the install marker could not be used — see the verify line above; nothing removed)", which names
  // no remedy verb and no by-hand removal, so the walk no longer reports it (R45 follows it as printed).
  ["uninstall.ts", "rmdirIfEmpty", "either", "${d} (install created this directory and it is empty, but it could not be removed (${why}); a directory keeps neither the marker nor an agent recorded, so remove it by hand once that is fixed)", "touches no record", "a directory install created (plan 34.1-21, DI-07); the marker is named only to say the directory does not hold it"],
  // not a printed alternative: this run's own (DRY_RUN) description of the rewrite it makes.
  ["uninstall.ts", "said", "either", "the entries this run would remove or reverse would be taken out of its install ledger: ${what}", "not a printed alternative", "updateKeptMarker's DRY_RUN wording of its own ledger rewrite"],
];
/** Per-class counts, measured at execution of plan 34.1-20 (31 sites: install.ts 7, uninstall.ts 24; the other 7 product modules print none).
 * 32 since plan 34.1-21 (DI-07): rmdirIfEmpty's failed-removal `left` line, "touches no record" 10 -> 11, uninstall.ts 24 -> 25.
 * 33 since plan 34.1-33 (2026-10-13, D-35): install-marker.ts markerFixText, the owner's never-remove wording, is the one
 * site in install-marker.ts (0 -> 1), class "never remove while a well-formed ledger is present" (0 -> 1); I1's other
 * reading prints it through a substitution, so it adds no install.ts site.
 * Still 33 since plan 34.1-34 (2026-10-13, D-35), reclassed under the owner: "usable record, split by FULL" (2) is
 * retired and its two U4 rows are "split by the owner" (2); I1, I5, I6 and U3 leave "not a usable record" (5 -> 1) for
 * "no well-formed ledger: fix or remove" (4). The never-remove readings plan 34.1-34 added to uninstall.ts (the
 * module-top verify, U3, the JSON-object arm) name no remedy verb aimed at the marker in their own text (markerFixText
 * is a substitution), so they add no site.
 * 31 since plan 34.1-42 (2026-10-13, D-37, 34.1 review CR-05): the uninstaller's module-top unreadable-marker verify has
 * one reading (its files-by-hand reading leaves, "touches no record" 11 -> 10) and removeMarker's U3 line points at it
 * (its fix-or-remove reading leaves, "no well-formed ledger: fix or remove" 4 -> 3); uninstall.ts 25 -> 23. The class
 * "never remove while a well-formed ledger is present" is renamed "never remove the marker" (D-37: whatever the read).
 * Still 31 after plan 34.1-42 Task 2 (2026-10-13, D-37, amends D-32): "usable record, FULL only" (2) is retired and
 * keepWithoutRecord's two FULL readings are "per entry" (3 -> 5).
 * 28 since plan 34.1-43 (2026-10-13, D-37, 34.1 review CR-06): "split by the owner" (2, U4) is retired, and the
 * module-top malformed-ledger verify leaves "fix" (7 -> 6); neither new reading names a remedy verb aimed at the marker
 * in its own text, so the walk no longer reports them. uninstall.ts 23 -> 20.
 * 25 since plan 34.1-43 Task 2 (2026-10-13, D-37): I2, I3 and I4 leave "fix" (6 -> 3) for the same reason; install.ts
 * 7 -> 4.
 * 22 since plan 34.1-44 (2026-10-13, D-37, 34.1 review CR-05): I1, I5 and I6 have one never-remove reading each, so
 * "no well-formed ledger: fix or remove" (3) is retired; install.ts 4 -> 1.
 * 21 since plan 34.1-45 (2026-10-13, D-37, 34.1 review IN-34): reportUnrecordedSettings' ask-rules verify over an
 * unusable marker is a pointer with no by-hand removal, so it leaves "touches no record" (10 -> 9); uninstall.ts 20 -> 19. */
const CENSUS_CLASS_COUNTS: Readonly<Record<RemedyClass, number>> = {
  "not a usable record": 1,
  "never remove the marker": 1,
  "per entry": 5,
  "per field": 1,
  fix: 3,
  "touches no record": 9,
  "not a printed alternative": 1,
};
/** What every row of a class must say, so a row cannot be classed against its text. */
const CLASS_RULES: Readonly<Record<RemedyClass, (s: CensusSite) => string | null>> = {
  "not a usable record": (s) =>
    /not a record this run can use/.test(s.text) && !offersRemoval(s.text) ? null : "names no reason the record is unusable, or offers removing the marker",
  "never remove the marker": (s) =>
    s.text.includes("never delete the marker") && BY_HAND.test(s.text) && !DELETE_MARKER.test(s.text) && !/\b(fix or remove|remove (it|the marker))\b/i.test(s.text)
      ? null
      : "does not say to fix it by hand and never delete the marker, or offers removing it",
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

// ── D-36 (34.1 review WR-23, plan 34.1-37): an uninstall command carries the kit checkout the run used ──────────────
//
// uninstall.js reads GRUGOPS_SRC for its report of files grugops did not record, so a command it prints carries
// `GRUGOPS_SRC=<dir>` when the run used a checkout other than its script's own (host-tools.ts scriptCommand, the
// context's `src`). With GRUGOPS_SRC equal to this checkout the command is unchanged: R19 and every earlier row follow
// it through runPrinted without the harness opt-in, and the harness throws on a printed GRUGOPS_SRC there (H1).
describe("D-36 (WR-23): an uninstall command carries the kit checkout the run used", () => {
  it("R40: uninstall --codex with GRUGOPS_SRC set to another spelling of this checkout prints its finishing command with `GRUGOPS_SRC=<that dir>`; restored and run as printed, the child sees that GRUGOPS_SRC and the reversal finishes with [claude]", () => {
    const w = world("r40");
    const link = join(dirname(w.target), "checkout-link");
    symlinkSync(REPO_ROOT, link);
    expect(pathText(link), "premise: the link is another spelling of this checkout").not.toBe(pathText(REPO_ROOT));
    expect(pathText(process.env.GRUGOPS_SRC ?? ""), "premise: the test process sets GRUGOPS_SRC to the link").not.toBe(pathText(link));
    install(w, [flag("claude"), flag("codex")]);
    const original = edit(w, AGENT_SKILL_REL);

    const r = runUninstall(w.target, w.grugopsHome, { home: w.home, timeoutMs: 120_000, src: link }, [flag("codex")]);
    finished(r, "uninstall --codex with GRUGOPS_SRC set to the link");
    expect(r.status, r.stdout).toBe(0);
    const kept = keptMarkerLine(r.stdout);
    expect(kept.length, `no kept \`left\` line about the marker\n${r.stdout}`).toBe(1);
    const words = shellWords(printedCommand(kept[0]));
    const nodeAt = words.indexOf("node");
    expect(nodeAt, `the kept line's command has no node word: ${kept[0]}`).toBeGreaterThan(0);
    expect(words.slice(0, nodeAt), `the kept line's command does not carry the run's GRUGOPS_SRC before node: ${kept[0]}`).toEqual([`GRUGOPS_SRC=${link}`]);
    expect(pathText(words[nodeAt + 1]), kept[0]).toBe(pathText(UNINSTALL_JS));
    expect(words.slice(nodeAt + 2), kept[0]).toEqual(["--target", w.target, flag("codex")]);

    writeFileSync(at(w.target, AGENT_SKILL_REL), original);
    const fin = runPrintedCommand(kept[0], { home: w.home, timeoutMs: 120_000, expectSrc: true });
    finished(fin, `the printed command ${printedCommand(kept[0])}`);
    expect(relative(REPO_ROOT, fin.premise.cwd).startsWith(".."), `premise: the printed command ran from ${fin.premise.cwd}, inside the checkout`).toBe(true);
    expect(fin.premise.grugopsHome, "premise: an uninstall command sets no kit home").toBeUndefined();
    expect(fin.premise.grugopsSrc, "premise: the child saw no GRUGOPS_SRC").toBeDefined();
    expect(pathText(fin.premise.grugopsSrc ?? ""), "premise: the child's GRUGOPS_SRC is not the printed link").toBe(pathText(link));
    expect(fin.status, fin.stdout).toBe(0);
    expect(agentsOf(w), fin.stdout).toEqual(ids("claude"));
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
  });
});

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

  it("R20 (FULL kept, D-37): a flag-less uninstall over an edited Claude Code skill never offers deleting the marker; its kept line and banner name the per-entry ledger edit and the flag-less command; followed (the entry taken out by hand, the printed command run), the edited skill stays byte for byte and the marker is gone", () => {
    const w = world("r20");
    install(w, [flag("claude")]);
    edit(w, CLAUDE_SKILL);
    const edited = readFileSync(at(w.target, CLAUDE_SKILL));
    const recorded = recordedPaths(w);

    const r = uninstall(w, []);
    expect(r.status, r.stdout).toBe(0);
    expect(markerGone(w), r.stdout).toBe(false);
    expect(agentsOf(w), r.stdout).toEqual(ids("claude"));
    expectInvariant(w, ids("claude"), r.stdout);
    for (const l of [...r.stdout.split("\n"), ...r.stderr.split("\n")]) {
      expect(l, "a FULL run tells the user to delete the marker").not.toMatch(DELETE_MARKER);
      expect(l, "a FULL run offers removing the marker").not.toMatch(MARKER_REMOVAL);
      expect(l, "a FULL run offers removing the marker").not.toMatch(REMOVAL_OFFER);
    }
    const line = keptMarkerLine(r.stdout);
    const banner = keptBannerLine(r.stdout);
    expect(line.length, `no kept \`left\` line about the marker\n${r.stdout}`).toBe(1);
    expect(banner.length, `no KEPT_FOR banner\n${r.stdout}`).toBe(1);
    // D-37 (amends D-32): the alternative is the per-entry ledger edit (the step-0 probe of plan 34.1-42 showed it
    // finishes), finished by the flag-less command, and the marker is never to be deleted.
    expect(line[0], r.stdout).toContain("never delete the marker");
    expect(banner[0], r.stdout).toContain(`never delete ${MARKER_REL}`);
    for (const l of [line[0], banner[0]]) {
      expect(l, r.stdout).toContain("its entry out of the install ledger");
      expect(l, r.stdout).toContain("it is still the record of what install made here");
    }
    expect(printedFlags(line[0]), line[0]).toEqual([]);
    expect(printedFlags(banner[0]), banner[0]).toEqual([]);

    // Follow the printed alternative: take the skill's entry out of the ledger by hand, then run the printed command.
    let taken = 0;
    const next = withLedger(readMarkerObject(w.target), (es) =>
      es.filter((e) => {
        const drop = e.path === CLAUDE_SKILL && e.kind === "file";
        if (drop) taken++;
        return !drop;
      }),
    );
    expect(taken, "PREMISE: the ledger held exactly one file entry for the edited skill").toBe(1);
    writeFileSync(at(w.target, MARKER_REL), JSON.stringify(next, null, 2) + "\n");
    const fin = runPrinted(w, line[0]);
    expect(fin.status, fin.stdout).toBe(0);
    expect(markerGone(w), fin.stdout).toBe(true);
    expect(readFileSync(at(w.target, CLAUDE_SKILL)).equals(edited), `the user's edited skill was not kept\n${fin.stdout}`).toBe(true);
    const chain = new Set([CLAUDE_SKILL, dirname(CLAUDE_SKILL), dirname(dirname(CLAUDE_SKILL)), ".claude"]);
    expect(leftRecorded(fin.stdout, recorded.filter((p) => !chain.has(p))), `a path the ledger recorded was left\n${fin.stdout}`).toEqual([]);
  });

  // R21 (U4, malformed ledger; inverted by plan 34.1-43, 2026-10-13, D-37, 34.1 review CR-06): install's own marker with
  // a malformed install ledger is still the record of every agent installed here, on every run kind. Until plan 34.1-43
  // the flag-less run offered "fix or remove it by hand" although it removed nothing, and following "remove" left every
  // agent installed with no record (CR-06 reproduced 32 items no later uninstall could remove).
  it("R21 (U4, malformed ledger, D-37): a partial and a flag-less uninstall over the same malformed ledger each print one verify that names the ledger problem, says fix it by hand and never delete the marker; the marker's `left` line points at it; no line offers removing the marker or removing files by hand, and the marker stays", () => {
    const w = world("r21");
    install(w, [flag("claude"), flag("codex")]);
    const markerPath = at(w.target, MARKER_REL);
    writeFileSync(markerPath, JSON.stringify(withLedger(readMarkerObject(w.target), (es) => [...es, { kind: "file" }]), null, 2) + "\n");
    const ledger = readLedger(readMarkerObject(w.target));
    expect(ledger.state, "PREMISE: the ledger is malformed").toBe("malformed");
    expect(readInstallMarker(w.target).state, "PREMISE: the marker itself reads ok").toBe("ok");
    const why = ledger.why ?? "";
    expect(why, "PREMISE: readLedger names the ledger problem").not.toBe("");
    // expectInvariant is not asked: the ledger is malformed by design, so there is no typed entry list to check it on.
    for (const args of [[flag("codex")], []] as const) {
      const what = `uninstall ${args.join(" ") || "(flag-less)"}`;
      const r = uninstall(w, args);
      expect(r.status, `${what}: exit\n${r.stdout}`).toBe(3);
      const about = linesWith(r.stdout, "verify").filter((l) => l.replace(/^ {2}verify\s+/, "").startsWith(MARKER_REL));
      expect(about.length, `${what}: one verify line about the marker\n${r.stdout}`).toBe(1);
      expect(about[0], what).toContain(why);
      expect(about[0], what).toContain("by hand");
      expect(about[0], what).toContain("never delete the marker");
      const u4 = linesWith(r.stdout, "left").filter((l) => l.includes(`${MARKER_REL} (its install ledger is malformed`));
      expect(u4.length, `${what}: no malformed-ledger \`left\` line about the marker\n${r.stdout}`).toBe(1);
      expect(u4[0], what).toContain("see the verify line above");
      for (const l of [...r.stdout.split("\n"), ...r.stderr.split("\n")]) {
        expect(l, `${what}: a line tells the user to delete the marker`).not.toMatch(DELETE_MARKER);
        expect(l, `${what}: a line offers removing the marker`).not.toMatch(MARKER_REMOVAL);
        expect(l, `${what}: a line offers removing the marker`).not.toMatch(REMOVAL_OFFER);
        expect(l, `${what}: a line offers removing files by hand`).not.toContain("remove them by hand");
      }
      expect(existsSync(markerPath), r.stdout).toBe(true);
    }
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
    // 32 -> 33 (plan 34.1-33, D-35): install-marker.ts markerFixText, the owner's never-remove wording. Still 33 after
    // plan 34.1-34 (2026-10-13, D-35): the uninstaller's new readings are never-remove ones whose own text names no
    // remedy verb aimed at the marker. 33 -> 31 (plan 34.1-42, 2026-10-13, D-37): the module-top unreadable verify's
    // files-by-hand reading and U3's fix-or-remove reading leave uninstall.ts (25 -> 23). 31 -> 28 (plan 34.1-43,
    // 2026-10-13, D-37, 34.1 review CR-06): U4's two readings and the module-top malformed-ledger verify leave (23 -> 20).
    // 28 -> 25 (plan 34.1-43 Task 2, D-37): I2, I3 and I4 print markerFixText and leave install.ts (7 -> 4).
    // 25 -> 22 (plan 34.1-44, 2026-10-13, D-37, 34.1 review CR-05): I1, I5 and I6 print markerFixText on every read and
    // leave install.ts (4 -> 1).
    // 22 -> 21 (plan 34.1-45, 2026-10-13, D-37, 34.1 review IN-34): reportUnrecordedSettings' ask-rules verify over an
    // unusable marker became a `left` line pointing at the marker's verify, with no by-hand removal (20 -> 19).
    expect(sites.length, "the census size moved").toBe(21);
    expect(countBy(sites, (s) => s.module), "per-module counts (no other product module prints one)").toEqual({ "install-marker.ts": 1, "install.ts": 1, "uninstall.ts": 19 });
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
    // The yes/no pair check of the class "split by the owner" left with the class (plan 34.1-43, 2026-10-13, D-37): no
    // uninstall.ts reading is decided by markerRemedy's mayRemove any more. The premise: the rules were asked of rows.
    expect(sites.filter((s) => cls.has(censusKey(s.module, s.fn, s.guard, s.text))).length, "PREMISE: classed rows were checked").toBeGreaterThan(0);
  });

  // D-37 (plan 34.1-44, 2026-10-13, 34.1 review CR-05; replaces D-35's "every offer sits under markerRemedy's yes"): no
  // printed reading in any product module offers removing the marker, under any condition. The premise: the walk read
  // all nine product modules and found census sites in both binaries.
  it("D-37: no reading in any product module offers removing the marker", () => {
    const sites = remedyCensus();
    expect(productModules().length, "PREMISE: the walk reads the nine product modules").toBe(9);
    expect(sites.some((s) => s.module === "install.ts"), "PREMISE: the census found a site in install.ts").toBe(true);
    expect(sites.some((s) => s.module === "uninstall.ts"), "PREMISE: the census found a site in uninstall.ts").toBe(true);
    const offers = sites.filter((s) => offersRemoval(s.text)).map((s) => `${s.module}:${s.line} [${s.fn}] {${s.guard}} ${s.text}`);
    expect(offers, "a printed reading offers removing the marker").toEqual([]);
  });

  it("D-37 (34.1 review CR-05): the delete-the-marker text is found at zero sites in every product module (by the parser)", () => {
    const sites = remedyCensus();
    // The premise: the walk read every product module's printed alternatives (the census size is pinned above).
    expect(sites.length, "PREMISE: the census found the printed alternatives").toBeGreaterThan(0);
    const deleting = sites.filter((s) => DELETE_MARKER.test(s.text));
    expect(deleting.map((s) => `${s.module}:${s.line} [${s.fn}] {${s.guard}} ${s.text}`), "a printed text tells the user to delete the marker").toEqual([]);
  });
});

// ── D-35 (34.1 review CR-04): the marker remedy has one owner ────────────────────────────────────────────────────────
//
// install-marker.ts markerRemedy decides, from the marker read the binary just made, whether a printed remedy may offer
// removing .grugops/install.json: never while its bytes hold a well-formed install ledger, because that marker is the
// record of every agent installed here and fixing one field gives the whole ledger back (34.1 review CR-04 reproduced 57
// ledger entries becoming 1, and a later uninstall leaving 87 items with no record). The rows follow each printed remedy
// as a user would, then uninstall, and assert grugops' files are removed.

/** The malformed `agents` value of the reviewer's reproduction: two ids that fail AGENT_ID_SHAPE. */
const BAD_AGENTS = ["Codex", "claude-code"];
/** A removal offer for the marker, in any of the spellings a remedy has used. */
const REMOVAL_OFFER = /\bremove the marker\b|\bfix or remove\b/i;
/** Write `agents` into the marker by hand (handEditAgents writes valid ids only), keeping every other field. */
function setAgentsByHand(w: World, agents: readonly string[]): void {
  const o = readMarkerObject(w.target);
  writeFileSync(at(w.target, MARKER_REL), JSON.stringify({ ...o, agents }, null, 2) + "\n");
}
/** The ledger's entry paths before a run, read through the product's one reader. */
const recordedPaths = (w: World): string[] => [...new Set(ledgerEntries(w).map((e) => e.path))];
/**
 * The `left` lines of an uninstall that name a path the ledger recorded. A `left` line names its path relative to the
 * target, as its first word (a directory with a trailing `/`). The one by-design exception is `tools/`: install records
 * creating it, and uninstall leaves the directory itself because grugops owns only tools/grugops/ (uninstall.ts prints
 * that reason on the line); a clean flag-less uninstall prints it too, so it is no sign of a lost record.
 */
function leftRecorded(stdout: string, recorded: readonly string[]): string[] {
  const set = new Set(recorded);
  return linesWith(stdout, "left").filter((l) => {
    const path = l.replace(/^ {2}left\s+/, "").split(" ")[0].replace(/\/+$/, "");
    if (path === "tools" && l.includes("(grugops owns tools/grugops/ only")) return false;
    return set.has(path);
  });
}

describe("D-35 (34.1 review CR-04): no marker remedy offers removal while a well-formed install ledger is present", () => {
  it("R36 (the doctor): `agents` set to [Codex, claude-code] over a well-formed ledger: --check names the field, says never delete the marker and offers no removal; fixed by hand and checked as printed from outside the checkout, no FAIL; a flag-less uninstall then removes grugops' files and the marker", () => {
    const w = world("r36");
    install(w, [flag("claude"), flag("codex")]);
    const before = readLedger(readMarkerObject(w.target));
    expect(before.state, `PREMISE: the ledger is well formed (${before.why})`).toBe("ok");
    expect(before.entries.length, "PREMISE: the ledger records what install did").toBeGreaterThan(0);

    setAgentsByHand(w, BAD_AGENTS);
    expect(readInstallMarker(w.target).state, "PREMISE: the marker is unusable").toBe("unreadable");
    expect(readLedger(readMarkerObject(w.target)).state, "PREMISE: its ledger still reads ok").toBe("ok");

    const check = spawnBin(INSTALL_JS, ["--check"], w.target, w.grugopsHome, { home: w.home, timeoutMs: 120_000 });
    finished(check, "--check");
    expect(check.status, check.stdout).toBe(1);
    const fails = linesWith(check.stdout, "FAIL");
    expect(fails.length, `one FAIL line\n${check.stdout}`).toBe(1);
    const failLine = fails[0];
    expect(failLine, check.stdout).toContain(MARKER_REL);
    expect(failLine, check.stdout).toContain("agents is not a list of agent ids");
    expect(failLine, check.stdout).toContain("by hand");
    expect(failLine, check.stdout).toContain("never delete the marker");
    expect(failLine, "the FAIL tells the user to delete the marker").not.toMatch(DELETE_MARKER);
    expect(failLine, "the FAIL offers removing the marker").not.toMatch(REMOVAL_OFFER);
    const words = shellWords(printedCommand(failLine));
    expect(words[words.length - 1], failLine).toBe("--check");
    const flags = HOST_TOOLS.map(agentFlag);
    expect(words.filter((x) => flags.includes(x)), `the printed check command names an agent flag: ${failLine}`).toEqual([]);

    // Follow it: fix the field the line named, by hand, then run the printed check command as printed.
    setAgentsByHand(w, ids("claude", "codex"));
    const again = runPrintedCommand(failLine, { home: w.home, timeoutMs: 120_000 });
    finished(again, `the printed check command ${printedCommand(failLine)}`);
    expect(relative(REPO_ROOT, again.premise.cwd).startsWith(".."), `premise: the printed command ran from ${again.premise.cwd}, inside the checkout`).toBe(true);
    expect(again.premise.grugopsHome, `premise: the printed check command sets no kit home: ${printedCommand(failLine)}`).toBeUndefined();
    expect(linesWith(again.stdout, "FAIL"), again.stdout).toEqual([]);
    expect(again.status, again.stdout).toBe(0);

    const recorded = recordedPaths(w);
    const r = uninstall(w, []);
    expect(r.status, r.stdout).toBe(0);
    expect(markerGone(w), r.stdout).toBe(true);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), r.stdout).toBe(false);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), r.stdout).toBe(false);
    expect(recorded, "PREMISE: the ledger names the skills the run must remove").toEqual(expect.arrayContaining([AGENT_SKILL_REL, ".claude/skills/grugops/SKILL.md"]));
    expect(leftRecorded(r.stdout, recorded), `a path the ledger recorded was left\n${r.stdout}`).toEqual([]);
  });

  // R36 control (inverted by plan 34.1-44, 2026-10-13, D-37, 34.1 review CR-05): until plan 34.1-44 a marker that is not
  // JSON got the fix-or-remove FAIL with an install command, and following "remove" left every agent installed with no
  // record. The reviewer's reproduction (one trailing comma inside `agents`) now gets the never-remove FAIL, and the row
  // follows it as printed: the comma taken out by hand, the check command run from outside the checkout, then a
  // flag-less uninstall that removes grugops' files.
  it("R36 control (D-37, 34.1 review CR-05): the doctor over a trailing comma: --check names the cause and its place, says fix by hand and never delete the marker, offers no removal and prints only the check command; with the comma taken out by hand, that command run as printed from outside the checkout exits 0 with no FAIL, and a flag-less uninstall removes grugops' files and the marker", () => {
    const w = world("r36c");
    install(w, [flag("claude"), flag("codex")]);
    const recorded = recordedPaths(w);
    expect(recorded, "PREMISE: the ledger names both skills").toEqual(expect.arrayContaining([AGENT_SKILL_REL, ".claude/skills/grugops/SKILL.md"]));
    const original = addTrailingComma(w);
    const check = spawnBin(INSTALL_JS, ["--check"], w.target, w.grugopsHome, { home: w.home, timeoutMs: 120_000 });
    finished(check, "--check");
    expect(check.status, check.stdout).toBe(1);
    const fails = linesWith(check.stdout, "FAIL");
    expect(fails.length, check.stdout).toBe(1);
    const failLine = fails[0];
    expect(failLine, check.stdout).toContain(MARKER_REL);
    expect(failLine, check.stdout).toContain("not valid JSON");
    expect(failLine, `the FAIL names no place in the file: ${failLine}`).toMatch(/\bline \d+/);
    expect(failLine, check.stdout).toContain("by hand");
    expect(failLine, check.stdout).toContain("never delete the marker");
    expect(failLine, "the FAIL tells the user to delete the marker").not.toMatch(DELETE_MARKER);
    expect(failLine, "the FAIL offers removing the marker").not.toMatch(MARKER_REMOVAL);
    expect(failLine, "the FAIL offers removing the marker").not.toMatch(REMOVAL_OFFER);
    const spans = printedCommands(failLine);
    expect(spans.length, `only the check command\n${failLine}`).toBe(1);
    const words = shellWords(spans[0]);
    expect(words[words.length - 1], failLine).toBe("--check");

    // Follow it: take the comma out by hand (the fix the line named), then run the printed check command as printed.
    writeFileSync(at(w.target, MARKER_REL), original);
    const again = runPrintedCommand(failLine, { home: w.home, timeoutMs: 120_000 });
    finished(again, `the printed check command ${printedCommand(failLine)}`);
    expect(relative(REPO_ROOT, again.premise.cwd).startsWith(".."), `premise: the printed command ran from ${again.premise.cwd}, inside the checkout`).toBe(true);
    expect(linesWith(again.stdout, "FAIL"), again.stdout).toEqual([]);
    expect(again.status, again.stdout).toBe(0);

    const r = uninstall(w, []);
    expect(r.status, r.stdout).toBe(0);
    expect(markerGone(w), r.stdout).toBe(true);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), r.stdout).toBe(false);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), r.stdout).toBe(false);
    expect(leftRecorded(r.stdout, recorded), `a path the ledger recorded was left\n${r.stdout}`).toEqual([]);
  });

  /** Install over the marker as it is: the run exits 3 when the marker is unusable, so the `install` helper (exit 0) is not used. */
  const installOver = (w: World, args: readonly string[]): Run => {
    const r = runInstall(w.target, w.grugopsHome, args, { home: w.home, timeoutMs: 180_000 });
    finished(r, `install ${args.join(" ")}`);
    return r;
  };
  /** The never-remove verify of R37: one verify line about the marker that names the field and offers no removal. */
  function expectNeverRemoveVerify(r: Run, what: string): void {
    expect(r.status, `${what}: exit\n${r.stdout}`).toBe(3);
    const about = linesWith(r.stdout, "verify").filter((l) => l.includes(MARKER_REL));
    expect(about.length, `${what}: one verify line about the marker\n${r.stdout}`).toBe(1);
    expect(about[0], what).toContain("agents is not a list of agent ids");
    expect(about[0], what).toContain("by hand");
    expect(about[0], what).toContain("never delete the marker");
    expect(about[0], `${what}: the verify tells the user to delete the marker`).not.toMatch(DELETE_MARKER);
    expect(about[0], `${what}: the verify offers removing the marker`).not.toMatch(REMOVAL_OFFER);
    const skipped = linesWith(r.stdout, "skipped").filter((l) => l.includes(`${MARKER_REL} (left unchanged`));
    expect(skipped.length, `${what}: the marker's skipped line\n${r.stdout}`).toBe(1);
    expect(skipped[0], what).toContain("see the verify line above");
    expect(skipped[0], `${what}: the skipped line says the marker is not install's`).not.toMatch(/not install's/);
  }

  it("R37 (install): over `agents` set to [Codex, claude-code], install --claude (writeAskRules) and install --codex (askRulesStep) each print the never-remove verify, exit 3 and leave the marker byte for byte; fixed by hand, install --claude exits 0 and records [claude, codex] with an ask-rules entry, and a flag-less uninstall removes the marker and both agents' skills", () => {
    const w = world("r37");
    install(w, [flag("claude"), flag("codex")]);
    setAgentsByHand(w, BAD_AGENTS);
    expect(readInstallMarker(w.target).state, "PREMISE: the marker is unusable").toBe("unreadable");
    expect(readLedger(readMarkerObject(w.target)).state, "PREMISE: its ledger still reads ok").toBe("ok");
    const bytes = readFileSync(at(w.target, MARKER_REL));

    // R37a: Claude Code chosen, the writeAskRules arm.
    const a = installOver(w, [flag("claude")]);
    expectNeverRemoveVerify(a, "R37a install --claude");
    expect(readFileSync(at(w.target, MARKER_REL)).equals(bytes), `R37a: the marker changed\n${a.stdout}`).toBe(true);

    // R37b: Claude Code not chosen, the askRulesStep arm.
    const b = installOver(w, [flag("codex")]);
    expectNeverRemoveVerify(b, "R37b install --codex");
    expect(readFileSync(at(w.target, MARKER_REL)).equals(bytes), `R37b: the marker changed\n${b.stdout}`).toBe(true);

    // R37c: follow the remedy: fix the field the line named by hand, then re-run the install.
    setAgentsByHand(w, ids("claude", "codex"));
    install(w, [flag("claude")]);
    expect(agentsOf(w)).toEqual(ids("claude", "codex"));
    expect(ledgerEntries(w).some((e) => e.kind === "ask-rules"), "the ledger holds no ask-rules entry").toBe(true);
    const recorded = recordedPaths(w);
    const r = uninstall(w, []);
    expect(r.status, r.stdout).toBe(0);
    expect(markerGone(w), r.stdout).toBe(true);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), r.stdout).toBe(false);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), r.stdout).toBe(false);
    expect(existsSync(at(w.target, CLAUDE_SKILL)), r.stdout).toBe(false);
    expect(leftRecorded(r.stdout, recorded), `a path the ledger recorded was left\n${r.stdout}`).toEqual([]);

    // R37d (plan 34.1-44, 2026-10-13, D-37, 34.1 review CR-05): the same two arms over the reviewer's trailing comma, a
    // marker that is not JSON. Until plan 34.1-44 both offered "Fix or remove the marker".
    const c = world("r37d");
    install(c, [flag("claude"), flag("codex")]);
    addTrailingComma(c);
    const commaBytes = readFileSync(at(c.target, MARKER_REL));
    for (const args of [[flag("claude")], [flag("codex")]] as const) {
      const what = `R37d install ${args.join(" ")} over a trailing comma`;
      const run = installOver(c, args);
      expect(run.status, `${what}: exit\n${run.stdout}`).toBe(3);
      const about = linesWith(run.stdout, "verify").filter((l) => l.includes(MARKER_REL));
      expect(about.length, `${what}: one verify line about the marker\n${run.stdout}`).toBe(1);
      expect(about[0], what).toContain("not valid JSON");
      expect(about[0], what).toContain("by hand");
      expect(about[0], what).toContain("never delete the marker");
      for (const l of [...run.stdout.split("\n"), ...run.stderr.split("\n")]) {
        expect(l, `${what}: a line tells the user to delete the marker`).not.toMatch(DELETE_MARKER);
        expect(l, `${what}: a line offers removing the marker`).not.toMatch(MARKER_REMOVAL);
        expect(l, `${what}: a line offers removing the marker`).not.toMatch(REMOVAL_OFFER);
      }
      expect(readFileSync(at(c.target, MARKER_REL)).equals(commaBytes), `${what}: the marker changed\n${run.stdout}`).toBe(true);
    }
  });

  /**
   * R38's first half (plan 34.1-34, D-35): install Claude Code and Codex CLI, set `agents` to [Codex, claude-code] by
   * hand, and uninstall with `args`. The run exits 3 with one verify line about the marker that names the field, says
   * fix it by hand and never delete the marker, and offers no removal anywhere in the run; the marker's `left` line
   * does not call it not install's, and the marker is left byte for byte. Returns the world, the verify line and the
   * paths the ledger recorded.
   */
  function neverRemoveUninstall(tag: string, args: readonly string[]): { w: World; verifyLine: string; recorded: string[] } {
    const w = world(tag);
    install(w, [flag("claude"), flag("codex")]);
    const recorded = recordedPaths(w);
    expect(recorded, "PREMISE: the ledger names both skills").toEqual(expect.arrayContaining([AGENT_SKILL_REL, ".claude/skills/grugops/SKILL.md"]));
    setAgentsByHand(w, BAD_AGENTS);
    expect(readInstallMarker(w.target).state, "PREMISE: the marker is unusable").toBe("unreadable");
    expect(readLedger(readMarkerObject(w.target)).state, "PREMISE: its ledger still reads ok").toBe("ok");
    const bytes = readFileSync(at(w.target, MARKER_REL));

    const r = uninstall(w, args);
    const what = `uninstall ${args.join(" ") || "(flag-less)"}`;
    expect(r.status, `${what}: exit\n${r.stdout}`).toBe(3);
    const about = linesWith(r.stdout, "verify").filter((l) => l.replace(/^ {2}verify\s+/, "").startsWith(MARKER_REL));
    expect(about.length, `${what}: one verify line about the marker\n${r.stdout}`).toBe(1);
    const verifyLine = about[0];
    expect(verifyLine, what).toContain("agents is not a list of agent ids");
    expect(verifyLine, what).toContain("by hand");
    expect(verifyLine, what).toContain("never delete the marker");
    for (const l of r.stdout.split("\n")) {
      expect(l, `${what}: a line tells the user to delete the marker`).not.toMatch(DELETE_MARKER);
      expect(l, `${what}: a line offers removing the marker`).not.toMatch(REMOVAL_OFFER);
    }
    const markerLeft = linesWith(r.stdout, "left").filter((l) => l.includes(`${MARKER_REL} (`));
    expect(markerLeft.length, `${what}: the marker's \`left\` line\n${r.stdout}`).toBe(1);
    expect(markerLeft[0], `${what}: the \`left\` line says the marker is not install's`).not.toMatch(/not install's/);
    expect(markerLeft[0], what).toContain("see the verify line above");
    expect(readFileSync(at(w.target, MARKER_REL)).equals(bytes), `${what}: the marker changed\n${r.stdout}`).toBe(true);
    // The verify says this run removes nothing here: both agents' skills are still in place.
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), `${what}: the Codex CLI skill was removed\n${r.stdout}`).toBe(true);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), `${what}: the Claude Code skill was removed\n${r.stdout}`).toBe(true);
    return { w, verifyLine, recorded };
  }

  it("R38a (uninstall, flag-less): over `agents` set to [Codex, claude-code], the verify names the field, says never delete the marker and offers no removal; fixed by hand and run as printed from outside the checkout, it exits 0 and removes the marker and both agents' skills, with no recorded path left", () => {
    const { w, verifyLine, recorded } = neverRemoveUninstall("r38a", []);
    expect(printedFlags(verifyLine), verifyLine).toEqual([]);

    // Follow it: fix the field the line named, by hand, then run the printed uninstall command as printed.
    setAgentsByHand(w, ids("claude", "codex"));
    const fin = runPrinted(w, verifyLine);
    expect(fin.status, fin.stdout).toBe(0);
    expect(markerGone(w), fin.stdout).toBe(true);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), fin.stdout).toBe(false);
    expect(leftRecorded(fin.stdout, recorded), `a path the ledger recorded was left\n${fin.stdout}`).toEqual([]);
  });

  it("R38b (uninstall --codex): the same verify prints a --codex command; fixed by hand and run as printed, it removes Codex CLI only: its skill is gone, Claude Code's stays, `agents` is [claude] and the marker stays", () => {
    const { w, verifyLine } = neverRemoveUninstall("r38b", [flag("codex")]);
    expect(printedFlags(verifyLine), verifyLine).toEqual([flag("codex")]);

    setAgentsByHand(w, ids("claude", "codex"));
    const fin = runPrinted(w, verifyLine);
    expect(fin.status, fin.stdout).toBe(0);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), fin.stdout).toBe(true);
    expect(agentsOf(w), fin.stdout).toEqual(ids("claude"));
    expect(markerGone(w), fin.stdout).toBe(false);
    expectInvariant(w, ids("claude", "codex"), fin.stdout);
  });

  // The owner's unit table (plan 34.1-40, D-35; rewritten by plan 34.1-44, 2026-10-13, D-37, brief §6): the rows are
  // enumerated from the READER's states, not from known cases. Every defect readInstallMarker reports (MARKER_DEFECTS)
  // has at least one shape, in a table typed Record<MarkerDefect, ...>, so a new defect is a compile error until it has
  // shapes; the shapes the owner answers null for (absent, unbound, an `ok` read with a well-formed ledger) sit beside
  // it. Each shape is built as a real file in a scratch target and read through readInstallMarker, the one reader both
  // binaries use. markerRemedy(read) must EQUAL { defect, fix } exactly (no other member: D-37 deleted the removal
  // answer rather than set it to a constant): fix is the read's problems for every unreadable read, and one entry naming
  // readLedger's why for an `ok` read with a malformed ledger. markerFixText of every non-null answer names each fix
  // entry, says by hand and never delete the marker, and offers no removal.
  it("markerRemedy over every reader defect: each of the 8 MARKER_DEFECTS has a shape, each shape a real marker file read through readInstallMarker; the answer is exactly { defect, fix } with fix the read's problems (or readLedger's why for a malformed ledger), null for absent, unbound and a well-formed ok read; markerFixText of every answer names its fix entries, says by hand and never delete the marker, and offers no removal", () => {
    type Shape = {
      readonly name: string;
      /** The marker file's bytes, from the scratch target's real path; null writes no file. */
      readonly bytes: ((here: string) => Buffer) | null;
      /** Plants something other than a file at the marker path (the row's bytes are then null). */
      readonly plant?: (target: string) => void;
      readonly state: InstallMarkerRead["state"];
      /** For an `unreadable` row: whether readInstallMarker parsed a JSON object. */
      readonly object?: boolean;
      /** For a duplicate-key row: every duplicated key the reader names (plan 34.1-45, D-37, WR-26). */
      readonly duplicateKeys?: readonly string[];
    };
    const kit = join(SCRATCH, "unit-kit");
    const fields = (here: string): string =>
      `"grugopsHome": ${JSON.stringify(kit)}, "kitRoot": ${JSON.stringify(join(kit, "kit"))}, "installMode": "copy", "target": ${JSON.stringify(here)}`;
    const text = (s: string): Buffer => Buffer.from(s, "utf8");
    const elsewhere = realpathSync(mkdtempSync(join(SCRATCH, "unit-elsewhere-")));
    const CANARY = "CANARY-d37";
    // The CANARY rows (T-34.1-80): V8's JSON.parse message quotes the file's text (all of a text this short), so a
    // problem built from it would carry the canary; the reader reads only the position digits.
    const BY_DEFECT: Readonly<Record<MarkerDefect, readonly Shape[]>> = {
      blocked: [
        // A symbolic link at the marker path, to a well-formed marker elsewhere (plan 34.1-42).
        {
          name: "a symbolic link at the marker path",
          bytes: null,
          plant: (t) => {
            const real = join(elsewhere, `linked-${CANARY}.json`);
            writeFileSync(real, `{${fields(t)}, "agents": ["claude"], "ledger": []}\n`);
            mkdirSync(join(t, ".grugops"));
            symlinkSync(real, at(t, MARKER_REL));
          },
          state: "unreadable",
          object: false,
        },
        // A FIFO at the marker path (plan 34.1-44): readForWrite refuses it without opening it, so nothing blocks.
        {
          name: "a FIFO at the marker path",
          bytes: null,
          plant: (t) => {
            mkdirSync(join(t, ".grugops"));
            execFileSync("mkfifo", [at(t, MARKER_REL)]);
          },
          state: "unreadable",
          object: false,
        },
      ],
      "not-json": [{ name: "not json", bytes: () => text(`${CANARY}\n`), state: "unreadable", object: false }],
      "not-object": [
        { name: "a JSON array", bytes: () => text(`["${CANARY}"]\n`), state: "unreadable", object: false },
        { name: "an empty JSON array", bytes: () => text("[]\n"), state: "unreadable", object: false },
      ],
      // A byte that is not UTF-8 inside a string: JSON.parse of the decoded text accepts it, the strict reader does not.
      bytes: [{ name: "a byte the strict reader refuses, ledger []", bytes: (h) => Buffer.concat([text(`{${fields(h)}, "note": "`), Buffer.from([0xff]), text(`", "ledger": []}\n`)]), state: "unreadable", object: true }],
      "duplicate-key": [
        { name: "a duplicate `agents` key, ledger []", bytes: (h) => text(`{${fields(h)}, "agents": ["claude"], "agents": ["codex"], "ledger": []}\n`), state: "unreadable", object: true, duplicateKeys: ["agents"] },
        { name: "a duplicate `ledger` key", bytes: (h) => text(`{${fields(h)}, "ledger": [], "ledger": "x"}\n`), state: "unreadable", object: true, duplicateKeys: ["ledger"] },
        // Plan 34.1-45 (2026-10-13, D-37, 34.1 review WR-26): the reviewer's two probes. Until plan 34.1-45 the reader named
        // the first duplicate only, so the fix of the first row named `agents` and never `ledger`.
        { name: "duplicate `agents` and `ledger` keys", bytes: (h) => text(`{${fields(h)}, "agents": ["claude"], "agents": ["codex"], "ledger": [], "ledger": 7}\n`), state: "unreadable", object: true, duplicateKeys: ["agents", "ledger"] },
        { name: "a duplicate `ledger` key whose two values are both garbage", bytes: (h) => text(`{${fields(h)}, "agents": ["claude"], "ledger": 5, "ledger": "x"}\n`), state: "unreadable", object: true, duplicateKeys: ["ledger"] },
      ],
      field: [
        { name: "`agents` malformed, ledger []", bytes: (h) => text(`{${fields(h)}, "agents": ["Codex", "claude-code"], "ledger": []}\n`), state: "unreadable", object: true },
        { name: "`agents` malformed, ledger \"x\"", bytes: (h) => text(`{${fields(h)}, "agents": ["Codex", "claude-code"], "ledger": "x"}\n`), state: "unreadable", object: true },
      ],
      "retired-record": [{ name: "a retired record next to ledger []", bytes: (h) => text(`{${fields(h)}, "createdFiles": [], "ledger": []}\n`), state: "unreadable", object: true }],
      ledger: [
        { name: "ok, ledger \"x\"", bytes: (h) => text(`{${fields(h)}, "agents": ["claude"], "ledger": "x"}\n`), state: "ok" },
        { name: "ok, one ledger entry's kind banana", bytes: (h) => text(`{${fields(h)}, "agents": ["claude"], "ledger": [{"path": ".claude", "kind": "banana"}]}\n`), state: "ok" },
      ],
    };
    /** The shapes the owner answers null for: no remedy is printed over them. */
    const NO_REMEDY: readonly Shape[] = [
      { name: "absent", bytes: null, state: "absent" },
      { name: "ok, ledger []", bytes: (h) => text(`{${fields(h)}, "agents": ["claude"], "ledger": []}\n`), state: "ok" },
      { name: "unbound (another directory's target), ledger []", bytes: () => text(`{${fields(elsewhere)}, "agents": ["claude"], "ledger": []}\n`), state: "unbound" },
    ];

    // The premise: the table's keys are exactly the reader's defects, and there are eight of them.
    expect(MARKER_DEFECTS.length, "MARKER_DEFECTS has 8 members").toBe(8);
    expect(Object.keys(BY_DEFECT).sort(), "the table's keys are MARKER_DEFECTS").toEqual([...MARKER_DEFECTS].sort());
    for (const d of MARKER_DEFECTS) expect(BY_DEFECT[d].length, `the defect ${d} has no shape`).toBeGreaterThan(0);

    const readOf = (s: Shape): InstallMarkerRead => {
      const target = realpathSync(mkdtempSync(join(SCRATCH, "unit-remedy-")));
      if (s.bytes !== null) {
        mkdirSync(join(target, ".grugops"));
        writeFileSync(at(target, MARKER_REL), s.bytes(target));
      }
      s.plant?.(target);
      const read = readInstallMarker(target);
      // The premise: the file reads as the shape the row names, through the product's reader.
      expect(read.state, `PREMISE: ${s.name} reads ${s.state}${read.state === "unreadable" ? ` (${read.why})` : ""}`).toBe(s.state);
      if (read.state === "unreadable") {
        expect(read.object !== undefined, `PREMISE: ${s.name}: a parsed object`).toBe(s.object === true);
        expect(read.duplicateKeys, `PREMISE: ${s.name}: the duplicated keys`).toEqual(s.duplicateKeys);
      }
      if (read.state === "unbound") expect(read.unboundBy, `PREMISE: ${s.name}`).toBe("other-directory");
      return read;
    };

    const cells: string[] = [];
    const answers: { name: string; fix: readonly string[]; text: string }[] = [];
    for (const d of MARKER_DEFECTS) {
      for (const s of BY_DEFECT[d]) {
        const read = readOf(s);
        let want: { defect: MarkerDefect; fix: readonly string[] };
        if (read.state === "unreadable") {
          // D-37: every unreadable read names its defect, a non-empty list of problems, none echoing the planted canary.
          expect(read.defect, `${s.name}: the read's defect`).toBe(d);
          expect(read.problems.length, `${s.name}: the unreadable read names no problem`).toBeGreaterThan(0);
          for (const p of read.problems) expect(p, `${s.name}: a problem echoes the file's bytes`).not.toContain(CANARY);
          want = { defect: d, fix: read.problems };
        } else {
          expect(read.state, `PREMISE: ${s.name}: an ok read`).toBe("ok");
          const ledger = readLedger(read.state === "ok" ? read.marker : null);
          expect(ledger.state, `PREMISE: ${s.name}: the ledger is malformed`).toBe("malformed");
          expect(ledger.why ?? "", `PREMISE: ${s.name}: readLedger names the problem`).not.toBe("");
          // The ledger's fix is one entry naming readLedger's why; its exact wording is the owner's (ledgerFixEntry).
          const fix = markerRemedy(read)?.fix ?? [];
          if (fix.length !== 1 || !fix[0].includes(ledger.why ?? "") || fix[0].includes(CANARY)) {
            cells.push(`${s.name}: fix ${JSON.stringify(fix)}, want one entry naming ${JSON.stringify(ledger.why)}`);
          }
          want = { defect: "ledger", fix };
        }
        const got = markerRemedy(read);
        // Exact equality: an answer with any other member (a removal answer back) breaks the row.
        if (JSON.stringify(got) !== JSON.stringify(want)) cells.push(`${s.name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
        if (got !== null) answers.push({ name: s.name, fix: got.fix, text: markerFixText(got) });
      }
    }
    for (const s of NO_REMEDY) {
      const got = markerRemedy(readOf(s));
      if (got !== null) cells.push(`${s.name}: got ${JSON.stringify(got)}, want null`);
    }
    const shapes = MARKER_DEFECTS.reduce((n, d) => n + BY_DEFECT[d].length, 0);
    // 13 -> 15 defect shapes (plan 34.1-45, 2026-10-13, D-37, WR-26): duplicate `agents` and `ledger` keys, and a
    // duplicate `ledger` key whose two values are both garbage.
    expect(shapes + NO_REMEDY.length, "the table is 15 defect shapes and 3 no-remedy shapes").toBe(18);
    expect(cells, "markerRemedy's answer breaks the rule").toEqual([]);

    // markerFixText of every answer names each of its fix entries, says by hand and never delete the marker, and offers
    // no removal. The premise: every defect shape gave an answer with a fix to name.
    expect(answers.filter((n) => n.fix.length > 0).length, "PREMISE: answers with a fix to name").toBe(shapes);
    const badText = answers
      .filter(
        (n) =>
          !n.text.includes("never delete the marker") ||
          !BY_HAND.test(n.text) ||
          n.fix.some((f) => !n.text.includes(f)) ||
          offersRemoval(n.text) ||
          REMOVAL_OFFER.test(n.text) ||
          n.text.includes(CANARY),
      )
      .map((n) => `${n.name}: ${n.text}`);
    expect(badText, "markerFixText of an answer").toEqual([]);

    // WR-26 (plan 34.1-45, D-37): a duplicate-key answer has one fix entry per duplicated key, naming the key and how many
    // times it appears; markerFixText of the agents-and-ledger row names both keys, and no duplicate-key answer claims
    // anything about the install ledger being intact (the garbage-ledger row has no ledger to claim).
    const dupRows = BY_DEFECT["duplicate-key"].map((s) => ({ s, got: markerRemedy(readOf(s)) }));
    const dupBad: string[] = [];
    for (const { s, got } of dupRows) {
      const keys = s.duplicateKeys ?? [];
      if (got === null) {
        dupBad.push(`${s.name}: no remedy`);
        continue;
      }
      if (got.fix.length !== keys.length) dupBad.push(`${s.name}: ${got.fix.length} fix entries for ${keys.length} duplicated keys: ${JSON.stringify(got.fix)}`);
      keys.forEach((k, i) => {
        const f = got.fix[i] ?? "";
        if (!f.includes(JSON.stringify(k)) || !/\b2 times\b/.test(f)) dupBad.push(`${s.name}: fix entry ${i} does not name ${JSON.stringify(k)} and its count: ${f}`);
      });
      const t = markerFixText(got);
      for (const k of keys) if (!t.includes(JSON.stringify(k))) dupBad.push(`${s.name}: markerFixText does not name ${JSON.stringify(k)}: ${t}`);
      if (/\bledger is (still|intact|well[- ]formed)\b|\bstill the record of every agent\b/i.test(t)) dupBad.push(`${s.name}: markerFixText claims the install ledger is intact: ${t}`);
    }
    expect(dupBad, "the duplicate-key answers (WR-26)").toEqual([]);
  });
});

// ── D-37 (34.1 review CR-05): no printed text offers deleting the marker, whatever the read ─────────────────────────
//
// The uninstaller never offers deleting or removing .grugops/install.json, for any marker read (D-37, which amends D-32
// and D-35). Over a marker it cannot use, its module-top verify names the cause it saw, says to fix the file by hand
// and never delete the marker (the one record install keeps of the agents installed here), and prints this run's own
// command. R41 follows the reviewer's CR-05 reproduction as printed: one trailing comma added inside `agents`, the
// printed fix applied by hand (the comma taken out), and the printed command run from outside the checkout.

/**
 * Add exactly one comma after the last element of the `agents` array in the marker text install wrote, and return the
 * original bytes. The premise is asserted: the read is `unreadable`, not a JSON object, with why "it is not valid JSON",
 * and JSON.parse of the original bytes equals the marker object read before the edit.
 */
function addTrailingComma(w: World): Buffer {
  const path = at(w.target, MARKER_REL);
  const original = readFileSync(path);
  const before = readMarkerObject(w.target);
  const text = original.toString("utf8");
  const key = text.indexOf('"agents"');
  expect(key, `PREMISE: the marker install wrote has an agents field\n${text}`).toBeGreaterThan(0);
  const open = text.indexOf("[", key);
  const close = text.indexOf("]", open);
  expect(open > key && close > open, `PREMISE: the agents field is an array\n${text}`).toBe(true);
  let last = close - 1;
  while (/\s/.test(text[last])) last--;
  expect(text[last], `PREMISE: the agents array ends with a string element\n${text}`).toBe('"');
  writeFileSync(path, text.slice(0, last + 1) + "," + text.slice(last + 1));
  const read = readInstallMarker(w.target);
  expect(read.state, "PREMISE: the marker with one trailing comma is unreadable").toBe("unreadable");
  if (read.state === "unreadable") {
    expect(read.jsonObject, "PREMISE: the marker is not read as a JSON object").toBe(false);
    expect(read.why, "PREMISE: the read's cause").toBe("it is not valid JSON");
  }
  expect(JSON.parse(original.toString("utf8")), "PREMISE: the original bytes are the marker read before").toEqual(before);
  return original;
}

/**
 * CR-06's hand edit (plan 34.1-43, D-37): set the `kind` of the install ledger's first entry to "banana" and keep every
 * other byte's meaning, and return the original bytes. The premise is asserted: readInstallMarker still answers `ok`
 * (the marker is install's own, for this directory), and readLedger answers `malformed` with a why that names the entry.
 * Returns the why too, so a row can assert the printed text names it.
 */
function setLedgerKindByHand(w: World): { original: Buffer; why: string } {
  const path = at(w.target, MARKER_REL);
  const original = readFileSync(path);
  const o = readMarkerObject(w.target);
  const ledger = o.ledger;
  expect(Array.isArray(ledger) && ledger.length > 0, "PREMISE: the marker install wrote holds a ledger entry").toBe(true);
  const entries = (ledger as Record<string, unknown>[]).map((e, i) => (i === 0 ? { ...e, kind: "banana" } : e));
  writeFileSync(path, JSON.stringify({ ...o, ledger: entries }, null, 2) + "\n");
  expect(readInstallMarker(w.target).state, "PREMISE: the marker with one banana kind still reads ok").toBe("ok");
  const read = readLedger(readMarkerObject(w.target));
  expect(read.state, "PREMISE: its install ledger is malformed").toBe("malformed");
  expect(read.why ?? "", "PREMISE: readLedger names the bad entry").toMatch(/^entry 0: /);
  expect(JSON.parse(original.toString("utf8")), "PREMISE: the original bytes are the marker read before").toEqual(o);
  return { original, why: read.why ?? "" };
}

/**
 * WR-26's hand edit (plan 34.1-45, D-37): insert a second member `"<key>": <valueJson>` right after the real `key` member
 * of the marker text install wrote, and return the original bytes. The real member's end is found by the product's strict
 * tokenizer (json-text.ts), so the edit adds exactly one member and changes no other byte. The premise is asserted: the
 * original has exactly one `key` member, and JSON.parse of the original bytes equals the marker object read before.
 */
function addDuplicateMember(w: World, key: string, valueJson: string): Buffer {
  const path = at(w.target, MARKER_REL);
  const original = readFileSync(path);
  const before = readMarkerObject(w.target);
  const doc = readJsonText(original);
  expect(doc.ok, "PREMISE: the marker install wrote reads as strict JSON").toBe(true);
  if (!doc.ok) return original;
  const member = memberNamed(doc.root, key);
  expect(member, `PREMISE: the marker install wrote has a ${key} member`).not.toBeNull();
  if (member === null) return original;
  const text = original.toString("utf8");
  writeFileSync(path, `${text.slice(0, member.value.end)},\n  ${JSON.stringify(key)}: ${valueJson}${text.slice(member.value.end)}`);
  expect(JSON.parse(text), "PREMISE: the original bytes are the marker read before").toEqual(before);
  return original;
}

describe("D-37 (34.1 review CR-05): no printed text offers deleting the marker, whatever the read", () => {
  /**
   * R41's first half: install Claude Code and Codex CLI, add one trailing comma inside `agents`, uninstall with `args`.
   * The run exits 3 with one verify line about the marker that names the cause and its place, says fix it by hand and
   * never delete the marker, and no line offers removal; nothing is removed, the marker is byte for byte as the comma
   * left it, and its `left` line points at the verify line and never says it is not install's.
   */
  function trailingCommaUninstall(tag: string, args: readonly string[]): { w: World; verifyLine: string; original: Buffer; recorded: string[] } {
    const w = world(tag);
    install(w, [flag("claude"), flag("codex")]);
    const recorded = recordedPaths(w);
    expect(recorded, "PREMISE: the ledger names both skills").toEqual(expect.arrayContaining([AGENT_SKILL_REL, ".claude/skills/grugops/SKILL.md"]));
    const original = addTrailingComma(w);
    const bytes = readFileSync(at(w.target, MARKER_REL));

    const r = uninstall(w, args);
    const what = `uninstall ${args.join(" ") || "(flag-less)"}`;
    expect(r.status, `${what}: exit\n${r.stdout}`).toBe(3);
    const about = linesWith(r.stdout, "verify").filter((l) => l.replace(/^ {2}verify\s+/, "").startsWith(MARKER_REL));
    expect(about.length, `${what}: one verify line about the marker\n${r.stdout}`).toBe(1);
    const verifyLine = about[0];
    expect(verifyLine, what).toContain("not valid JSON");
    expect(verifyLine, `${what}: the verify names no place in the file`).toMatch(/\bline \d+, column \d+\b/);
    expect(verifyLine, what).toContain("by hand");
    expect(verifyLine, what).toContain("never delete the marker");
    for (const l of [...r.stdout.split("\n"), ...r.stderr.split("\n")]) {
      expect(l, `${what}: a line tells the user to delete the marker`).not.toMatch(DELETE_MARKER);
      expect(l, `${what}: a line offers removing the marker`).not.toMatch(MARKER_REMOVAL);
      expect(l, `${what}: a line offers removing the marker`).not.toMatch(REMOVAL_OFFER);
    }
    expect(linesWith(r.stdout, "removed"), `${what}: something was removed\n${r.stdout}`).toEqual([]);
    expect(readFileSync(at(w.target, MARKER_REL)).equals(bytes), `${what}: the marker changed\n${r.stdout}`).toBe(true);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), `${what}: the Codex CLI skill was removed\n${r.stdout}`).toBe(true);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), `${what}: the Claude Code skill was removed\n${r.stdout}`).toBe(true);
    const markerLeft = linesWith(r.stdout, "left").filter((l) => l.includes(`${MARKER_REL} (`));
    expect(markerLeft.length, `${what}: the marker's \`left\` line\n${r.stdout}`).toBe(1);
    expect(markerLeft[0], what).toContain("see the verify line above");
    expect(markerLeft[0], `${what}: the \`left\` line says the marker is not install's`).not.toMatch(/not install's/);
    return { w, verifyLine, original, recorded };
  }

  it("R41a (flag-less): one trailing comma inside `agents`; the verify names the cause and its place, says fix it by hand and never delete the marker, and nothing offers removal or is removed; with the comma taken out by hand, the printed command run from outside the checkout exits 0 and removes the marker and both agents' skills, with no recorded path left", () => {
    const { w, verifyLine, original, recorded } = trailingCommaUninstall("r41a", []);
    expect(printedFlags(verifyLine), verifyLine).toEqual([]);

    // Follow it: take the comma out by hand (the fix the line named), then run the printed command as printed.
    writeFileSync(at(w.target, MARKER_REL), original);
    const fin = runPrinted(w, verifyLine);
    expect(fin.status, fin.stdout).toBe(0);
    expect(markerGone(w), fin.stdout).toBe(true);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), fin.stdout).toBe(false);
    expect(leftRecorded(fin.stdout, recorded), `a path the ledger recorded was left\n${fin.stdout}`).toEqual([]);
  });

  it("R41b (--codex): the same marker; the verify prints a --codex command; with the comma taken out by hand and the command run as printed, it removes Codex CLI only: its skill is gone, Claude Code's stays, `agents` is [claude] and the marker stays", () => {
    const { w, verifyLine, original } = trailingCommaUninstall("r41b", [flag("codex")]);
    expect(printedFlags(verifyLine), verifyLine).toEqual([flag("codex")]);

    writeFileSync(at(w.target, MARKER_REL), original);
    const fin = runPrinted(w, verifyLine);
    expect(fin.status, fin.stdout).toBe(0);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), fin.stdout).toBe(true);
    expect(agentsOf(w), fin.stdout).toEqual(ids("claude"));
    expect(markerGone(w), fin.stdout).toBe(false);
    expectInvariant(w, ids("claude", "codex"), fin.stdout);
  });

  /**
   * R43's first half (plan 34.1-43, D-37, 34.1 review CR-06, the reviewer's reproduction): install Claude Code and Codex
   * CLI, set one ledger entry's kind to "banana" by hand, uninstall with `args`. The run exits 3 and removes nothing; one
   * verify line about the marker names the ledger problem, says fix it by hand and never delete the marker; the
   * marker's `left` line points at it; no line offers removing the marker or removing files by hand; both skills stay.
   */
  function bananaUninstall(tag: string, args: readonly string[]): { w: World; verifyLine: string; original: Buffer; recorded: string[] } {
    const w = world(tag);
    install(w, [flag("claude"), flag("codex")]);
    const recorded = recordedPaths(w);
    expect(recorded, "PREMISE: the ledger names both skills").toEqual(expect.arrayContaining([AGENT_SKILL_REL, ".claude/skills/grugops/SKILL.md"]));
    const { original, why } = setLedgerKindByHand(w);
    const bytes = readFileSync(at(w.target, MARKER_REL));

    const r = uninstall(w, args);
    const what = `uninstall ${args.join(" ") || "(flag-less)"}`;
    expect(r.status, `${what}: exit\n${r.stdout}`).toBe(3);
    const about = linesWith(r.stdout, "verify").filter((l) => l.replace(/^ {2}verify\s+/, "").startsWith(MARKER_REL));
    expect(about.length, `${what}: one verify line about the marker\n${r.stdout}`).toBe(1);
    const verifyLine = about[0];
    expect(verifyLine, what).toContain(why);
    expect(verifyLine, what).toContain("by hand");
    expect(verifyLine, what).toContain("never delete the marker");
    for (const l of [...r.stdout.split("\n"), ...r.stderr.split("\n")]) {
      expect(l, `${what}: a line tells the user to delete the marker`).not.toMatch(DELETE_MARKER);
      expect(l, `${what}: a line offers removing the marker`).not.toMatch(MARKER_REMOVAL);
      expect(l, `${what}: a line offers removing the marker`).not.toMatch(REMOVAL_OFFER);
      expect(l, `${what}: a line offers removing files by hand`).not.toContain("remove them by hand");
    }
    expect(linesWith(r.stdout, "removed"), `${what}: something was removed\n${r.stdout}`).toEqual([]);
    expect(readFileSync(at(w.target, MARKER_REL)).equals(bytes), `${what}: the marker changed\n${r.stdout}`).toBe(true);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), `${what}: the Codex CLI skill was removed\n${r.stdout}`).toBe(true);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), `${what}: the Claude Code skill was removed\n${r.stdout}`).toBe(true);
    const markerLeft = linesWith(r.stdout, "left").filter((l) => l.includes(`${MARKER_REL} (`));
    expect(markerLeft.length, `${what}: the marker's \`left\` line\n${r.stdout}`).toBe(1);
    expect(markerLeft[0], what).toContain("see the verify line above");
    return { w, verifyLine, original, recorded };
  }

  it("R43a (flag-less, CR-06 followed as printed): one ledger entry's kind set to banana; the uninstall exits 3, removes nothing and says fix the ledger by hand and never delete the marker; with the entry restored by hand, the printed command run from outside the checkout exits 0 and removes the marker and both agents' skills, with no recorded path left", () => {
    const { w, verifyLine, original, recorded } = bananaUninstall("r43a", []);
    expect(printedFlags(verifyLine), verifyLine).toEqual([]);

    // Follow it: restore the entry by hand (the fix the line named), then run the printed command as printed.
    writeFileSync(at(w.target, MARKER_REL), original);
    const fin = runPrinted(w, verifyLine);
    expect(fin.status, fin.stdout).toBe(0);
    expect(markerGone(w), fin.stdout).toBe(true);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), fin.stdout).toBe(false);
    expect(leftRecorded(fin.stdout, recorded), `a path the ledger recorded was left\n${fin.stdout}`).toEqual([]);
  });

  it("R43b (--codex): the same banana entry; the verify prints a --codex command; with the entry restored by hand and the command run as printed, it removes Codex CLI only: its skill is gone, Claude Code's stays, `agents` is [claude] and the marker stays", () => {
    const { w, verifyLine, original } = bananaUninstall("r43b", [flag("codex")]);
    expect(printedFlags(verifyLine), verifyLine).toEqual([flag("codex")]);

    writeFileSync(at(w.target, MARKER_REL), original);
    const fin = runPrinted(w, verifyLine);
    expect(fin.status, fin.stdout).toBe(0);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), fin.stdout).toBe(true);
    expect(agentsOf(w), fin.stdout).toEqual(ids("claude"));
    expect(markerGone(w), fin.stdout).toBe(false);
    expectInvariant(w, ids("claude", "codex"), fin.stdout);
  });

  // R43c (plan 34.1-43, D-37, 34.1 review CR-06): the installer and the doctor say what the uninstaller says over the
  // same banana ledger (I2: the doctor's FAIL; I3: writeMarker's verify; I4: writeAskRules' verify).
  it("R43c (the doctor): over the banana ledger, --check exits 1 with one FAIL about the marker that keeps its opening, names the ledger problem, says fix by hand and never delete the marker, offers no removal and ends with the check command; with the entry restored by hand, that command run as printed from outside the checkout exits 0 with no FAIL", () => {
    const w = world("r43c-doctor");
    install(w, [flag("claude"), flag("codex")]);
    const { original, why } = setLedgerKindByHand(w);

    const check = spawnBin(INSTALL_JS, ["--check"], w.target, w.grugopsHome, { home: w.home, timeoutMs: 120_000 });
    finished(check, "--check");
    expect(check.status, check.stdout).toBe(1);
    const fails = linesWith(check.stdout, "FAIL").filter((l) => l.includes(MARKER_REL));
    expect(fails.length, `one FAIL line about the marker\n${check.stdout}`).toBe(1);
    const failLine = fails[0];
    expect(failLine, "the FAIL's opening").toContain(`${MARKER_REL} holds a malformed install ledger (${why})`);
    expect(failLine, check.stdout).toContain("by hand");
    expect(failLine, check.stdout).toContain("never delete the marker");
    for (const l of [...check.stdout.split("\n"), ...check.stderr.split("\n")]) {
      expect(l, "--check: a line tells the user to delete the marker").not.toMatch(DELETE_MARKER);
      expect(l, "--check: a line offers removing the marker").not.toMatch(MARKER_REMOVAL);
      expect(l, "--check: a line offers removing the marker").not.toMatch(REMOVAL_OFFER);
    }
    const printed = printedCommand(failLine);
    expect(printed, failLine).toBe(agentCommand("install.js", w.target, [], ctxOf(w), ["--check"]));
    expect(failLine.trimEnd().endsWith(`\`${printed}\``), `the FAIL does not end with the check command: ${failLine}`).toBe(true);

    // Follow it: restore the entry by hand (the fix the line named), then run the printed check command as printed.
    writeFileSync(at(w.target, MARKER_REL), original);
    const again = runPrintedCommand(failLine, { home: w.home, timeoutMs: 120_000 });
    finished(again, `the printed check command ${printed}`);
    expect(relative(REPO_ROOT, again.premise.cwd).startsWith(".."), `premise: the printed command ran from ${again.premise.cwd}, inside the checkout`).toBe(true);
    expect(linesWith(again.stdout, "FAIL"), again.stdout).toEqual([]);
    expect(again.status, again.stdout).toBe(0);
  });

  it("R43c (install): over the banana ledger, install --claude exits 3; every verify line naming .grugops/install.json says fix by hand and never delete the marker, no line offers removing the marker, and the ledger is written back unchanged with the banana entry; with the entry restored by hand, install --claude exits 0", () => {
    const w = world("r43c-install");
    install(w, [flag("claude"), flag("codex")]);
    const { original, why } = setLedgerKindByHand(w);
    const banana = readMarkerObject(w.target).ledger;

    const r = runInstall(w.target, w.grugopsHome, [flag("claude")], { home: w.home, timeoutMs: 180_000 });
    finished(r, "install --claude over the banana ledger");
    expect(r.status, r.stdout).toBe(3);
    const about = linesWith(r.stdout, "verify").filter((l) => l.includes(MARKER_REL));
    // writeAskRules' verify (I4) and writeMarker's verify (I3), each naming the ledger problem.
    expect(about.length, `the verify lines naming the marker\n${r.stdout}`).toBe(2);
    for (const l of about) {
      expect(l, r.stdout).toContain(why);
      expect(l, r.stdout).toContain("by hand");
      expect(l, r.stdout).toContain("never delete the marker");
    }
    for (const l of [...r.stdout.split("\n"), ...r.stderr.split("\n")]) {
      expect(l, "install: a line tells the user to delete the marker").not.toMatch(DELETE_MARKER);
      expect(l, "install: a line offers removing the marker").not.toMatch(MARKER_REMOVAL);
      expect(l, "install: a line offers removing the marker").not.toMatch(REMOVAL_OFFER);
    }
    const after = readLedger(readMarkerObject(w.target));
    expect(after.state, r.stdout).toBe("malformed");
    expect(after.why, r.stdout).toBe(why);
    expect(readMarkerObject(w.target).ledger, "the ledger was not written back unchanged").toEqual(banana);

    // Follow it: restore the entry by hand, then re-run the installer.
    writeFileSync(at(w.target, MARKER_REL), original);
    install(w, [flag("claude")]);
    expect(readLedger(readMarkerObject(w.target)).state, "the ledger is well formed again").toBe("ok");
  });

  // R44 (plan 34.1-44, 2026-10-13, D-37, 34.1 review IN-33): the skipped line of install and the `left` line of a
  // flag-less uninstall over a marker this run cannot use word the cause the reader saw, from the read's defect, through
  // one wording (install-marker.ts markerDefectText). Until plan 34.1-44 writeMarker said "a field in it holds a value
  // install never writes" for a duplicate key or a byte the strict reader refuses. One shape per defect, each made from
  // the marker install wrote by one hand edit, the premise asserted through the product's reader.
  it("R44 (IN-33): over one shape per unreadable defect (duplicate key, a byte the strict reader refuses, a field problem, a retired record, not valid JSON), install --codex's skipped line and a flag-less uninstall's `left` line for the marker word the defect's cause through markerDefectText and point at the verify line above; only the field shape says a field holds a value install never writes, and no line says the marker is not install's", () => {
    const FIELD_CLAUSE = "a field in it holds a value install never writes";
    /** Each shape's hand edit of the marker text install wrote. */
    const SHAPES: readonly { readonly defect: Exclude<MarkerDefect, "ledger">; readonly edit: (w: World) => void }[] = [
      {
        defect: "duplicate-key",
        edit: (w) => {
          const t = readFileSync(at(w.target, MARKER_REL), "utf8");
          expect(t.startsWith("{\n"), "PREMISE: the marker install wrote opens an object on its own line").toBe(true);
          writeFileSync(at(w.target, MARKER_REL), `{\n  "agents": [],${t.slice(1)}`);
        },
      },
      {
        defect: "bytes",
        edit: (w) => {
          const t = readFileSync(at(w.target, MARKER_REL));
          writeFileSync(at(w.target, MARKER_REL), Buffer.concat([Buffer.from('{\n  "note": "', "utf8"), Buffer.from([0xff]), Buffer.from('",', "utf8"), t.subarray(1)]));
        },
      },
      { defect: "field", edit: (w) => setAgentsByHand(w, BAD_AGENTS) },
      {
        defect: "retired-record",
        edit: (w) => writeFileSync(at(w.target, MARKER_REL), JSON.stringify({ ...readMarkerObject(w.target), createdFiles: [] }, null, 2) + "\n"),
      },
      { defect: "not-json", edit: (w) => void addTrailingComma(w) },
    ];
    for (const { defect, edit } of SHAPES) {
      const clause = markerDefectText(defect);
      const w = world(`r44-${defect}`);
      install(w, [flag("codex")]);
      edit(w);
      const read = readInstallMarker(w.target);
      expect(read.state === "unreadable" ? read.defect : read.state, `PREMISE: the ${defect} shape reads unreadable with that defect`).toBe(defect);

      const a = runInstall(w.target, w.grugopsHome, [flag("codex")], { home: w.home, timeoutMs: 180_000 });
      finished(a, `install --codex over the ${defect} shape`);
      expect(a.status, `${defect}: install exit\n${a.stdout}`).toBe(3);
      const skipped = linesWith(a.stdout, "skipped").filter((l) => l.includes(`${MARKER_REL} (`));
      expect(skipped.length, `${defect}: the marker's skipped line\n${a.stdout}`).toBe(1);
      expect(skipped[0], `${defect}: install`).toContain(`${MARKER_REL} (left unchanged — ${clause}; see the verify line above)`);

      const u = uninstall(w, []);
      expect(u.status, `${defect}: uninstall exit\n${u.stdout}`).toBe(3);
      const left = linesWith(u.stdout, "left").filter((l) => l.includes(`${MARKER_REL} (`));
      expect(left.length, `${defect}: the marker's left line\n${u.stdout}`).toBe(1);
      expect(left[0], `${defect}: uninstall`).toContain(`${MARKER_REL} (left in place — ${clause}; see the verify line above)`);

      for (const l of [skipped[0], left[0]]) {
        expect(l.includes(FIELD_CLAUSE), `${defect}: only the field shape says a field holds a value install never writes: ${l}`).toBe(defect === "field");
      }
      for (const l of [...a.stdout.split("\n"), ...u.stdout.split("\n")]) {
        expect(l, `${defect}: a line says the marker is not install's`).not.toMatch(/not install's/);
      }
    }
  });

  // R45 (plan 34.1-45, 2026-10-13, D-37, 34.1 review IN-34): over a marker this run cannot use, the ask-rules report and
  // the unrecorded-block report point at the marker's verify line. Neither is a second verify for the one cause, and
  // neither sends the user to remove the grugops ask rules or block lines by hand: fixing the marker gives the record
  // back, and the record reverses them. Until plan 34.1-45 the ask-rules report was a verify that said "Remove the
  // grugops ask rules by hand", and the block report said to remove the grugops lines by hand.
  it("R45 (IN-34, CR-04's scenario with ask rules): install --claude --codex, `agents` set to malformed ids; a flag-less uninstall exits 3 with one verify, about the marker; the ask-rules line is `left` and points at it; no line but that verify says `by hand`; nothing is removed; with `agents` fixed by hand, the printed command run as printed removes every recorded ask rule, the CLAUDE.md block, both skills and the marker", () => {
    const w = world("r45");
    install(w, [flag("claude"), flag("codex")]);
    const recorded = recordedPaths(w);
    const ask = ledgerEntries(w).find((e) => e.kind === "ask-rules");
    expect(ask?.kind, "PREMISE: the ledger records the ask rules install added").toBe("ask-rules");
    const added: readonly string[] = ask?.kind === "ask-rules" ? ask.added : [];
    expect(added.length, "PREMISE: install added at least one ask rule").toBeGreaterThan(0);
    const BLOCK_OPEN = "<!-- GSD:grugops-start-here -->";
    const claudeMd = (): string => (existsSync(at(w.target, "CLAUDE.md")) ? readFileSync(at(w.target, "CLAUDE.md"), "utf8") : "");
    expect(claudeMd(), "PREMISE: CLAUDE.md holds the grugops block").toContain(BLOCK_OPEN);
    setAgentsByHand(w, BAD_AGENTS);
    const read = readInstallMarker(w.target);
    expect(read.state === "unreadable" ? read.defect : read.state, "PREMISE: the marker reads unreadable with a field defect").toBe("field");
    const bytes = readFileSync(at(w.target, MARKER_REL));

    const r = uninstall(w, []);
    expect(r.status, r.stdout).toBe(3);
    const verifies = linesWith(r.stdout, "verify");
    expect(verifies.filter((l) => l.includes(ASK_RULES_REL)), `a verify line names ${ASK_RULES_REL}\n${r.stdout}`).toEqual([]);
    const about = verifies.filter((l) => l.replace(/^ {2}verify\s+/, "").startsWith(MARKER_REL));
    expect(about.length, `one verify line about the marker\n${r.stdout}`).toBe(1);
    expect(verifies.length, `the one cause counts one verify\n${r.stdout}`).toBe(1);
    const askLine = linesWith(r.stdout, "left").filter((l) => l.includes(`${ASK_RULES_REL} ask rules`));
    expect(askLine.length, `the ask-rules \`left\` line\n${r.stdout}`).toBe(1);
    expect(askLine[0], r.stdout).toContain("see the verify line above");
    expect(askLine[0], r.stdout).toContain("nothing removed");
    const blockLine = linesWith(r.stdout, "left").filter((l) => l.includes("CLAUDE.md start-here pointer"));
    for (const l of blockLine) expect(l, r.stdout).toContain("see the verify line above");
    for (const l of [...r.stdout.split("\n"), ...r.stderr.split("\n")]) {
      if (l === about[0]) continue;
      expect(l, `a line other than the marker's verify says to do something by hand\n${r.stdout}`).not.toMatch(/\bby hand\b/i);
      expect(l, "a line offers removing the marker").not.toMatch(REMOVAL_OFFER);
    }
    expect(linesWith(r.stdout, "removed"), `something was removed\n${r.stdout}`).toEqual([]);
    expect(readFileSync(at(w.target, MARKER_REL)).equals(bytes), `the marker changed\n${r.stdout}`).toBe(true);
    expect(claudeMd(), "the CLAUDE.md block was touched").toContain(BLOCK_OPEN);

    // Follow it: fix `agents` by hand (the fix the verify named), then run the printed command as printed.
    setAgentsByHand(w, ids("claude", "codex"));
    const fin = runPrinted(w, about[0]);
    expect(fin.status, fin.stdout).toBe(0);
    const settings = at(w.target, ASK_RULES_REL);
    if (existsSync(settings)) {
      const text = readFileSync(settings, "utf8");
      for (const rule of added) expect(text.includes(JSON.stringify(rule)), `a recorded ask rule is still in ${ASK_RULES_REL}: ${rule}\n${fin.stdout}`).toBe(false);
    }
    expect(claudeMd(), `CLAUDE.md still holds the grugops block\n${fin.stdout}`).not.toContain(BLOCK_OPEN);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), fin.stdout).toBe(false);
    expect(markerGone(w), fin.stdout).toBe(true);
    expect(leftRecorded(fin.stdout, recorded), `a path the ledger recorded was left\n${fin.stdout}`).toEqual([]);
  });

  // R46 (plan 34.1-45, 2026-10-13, D-37, 34.1 review WR-26): D-37's duplicate `ledger` follow row. A second `ledger`
  // member holding garbage, added after the real one: the reader names the duplicated key with its count, the uninstaller
  // removes nothing and offers no removal, and with the extra member taken out by hand the printed command finishes.
  it("R46 (WR-26, the duplicate `ledger` key followed as printed): install --claude --codex, a second `ledger` member holding garbage added after the real one; a flag-less uninstall exits 3, removes nothing, offers no removal and names the duplicated key with its count; with the extra member taken out by hand, the printed command run as printed removes the marker and both agents' skills, with no recorded path left", () => {
    const w = world("r46");
    install(w, [flag("claude"), flag("codex")]);
    const recorded = recordedPaths(w);
    expect(recorded, "PREMISE: the ledger names both skills").toEqual(expect.arrayContaining([AGENT_SKILL_REL, ".claude/skills/grugops/SKILL.md"]));
    const original = addDuplicateMember(w, "ledger", '"x"');
    const read = readInstallMarker(w.target);
    expect(read.state === "unreadable" ? read.defect : read.state, "PREMISE: the marker reads unreadable with defect duplicate-key").toBe("duplicate-key");
    expect(read.state === "unreadable" ? read.duplicateKeys : undefined, "PREMISE: the reader names the duplicated key").toEqual(["ledger"]);
    const bytes = readFileSync(at(w.target, MARKER_REL));

    const r = uninstall(w, []);
    expect(r.status, r.stdout).toBe(3);
    for (const l of [...r.stdout.split("\n"), ...r.stderr.split("\n")]) {
      expect(l, "a line tells the user to delete the marker").not.toMatch(DELETE_MARKER);
      expect(l, "a line offers removing the marker").not.toMatch(MARKER_REMOVAL);
      expect(l, "a line offers removing the marker").not.toMatch(REMOVAL_OFFER);
    }
    const about = linesWith(r.stdout, "verify").filter((l) => l.replace(/^ {2}verify\s+/, "").startsWith(MARKER_REL));
    expect(about.length, `one verify line about the marker\n${r.stdout}`).toBe(1);
    const verifyLine = about[0];
    expect(verifyLine, r.stdout).toContain('"ledger"');
    expect(verifyLine, r.stdout).toMatch(/\b2 times\b/);
    expect(verifyLine, r.stdout).toContain("by hand");
    expect(verifyLine, r.stdout).toContain("never delete the marker");
    expect(printedFlags(verifyLine), verifyLine).toEqual([]);
    expect(linesWith(r.stdout, "removed"), `something was removed\n${r.stdout}`).toEqual([]);
    expect(readFileSync(at(w.target, MARKER_REL)).equals(bytes), `the marker changed\n${r.stdout}`).toBe(true);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), r.stdout).toBe(true);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), r.stdout).toBe(true);

    // Follow it: take the extra member out by hand (the fix the verify named), then run the printed command as printed.
    writeFileSync(at(w.target, MARKER_REL), original);
    const fin = runPrinted(w, verifyLine);
    expect(fin.status, fin.stdout).toBe(0);
    expect(markerGone(w), fin.stdout).toBe(true);
    expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
    expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), fin.stdout).toBe(false);
    expect(leftRecorded(fin.stdout, recorded), `a path the ledger recorded was left\n${fin.stdout}`).toEqual([]);
  });

  // R47 (plan 34.1-46, 2026-10-13, D-37): the blocked read D-37 names, a mode 000 marker, followed as printed. The reader
  // answers `blocked` with the cause EACCES; the uninstaller removes nothing, names the cause, says fix the file by hand
  // and never delete the marker, and offers no removal; with read permission restored by hand (the fix the line names),
  // the printed command finishes the reversal. Gated like R12: a mode does not stop a read on win32 or as root.
  it.skipIf(CHMOD_SKIP !== null)(
    "R47 (D-37, a mode 000 marker followed as printed): install --claude --codex, the marker made unreadable; a flag-less uninstall exits 3, removes nothing, names the cause (EACCES), says fix by hand and never delete the marker, and offers no removal; with read permission restored by hand, the printed command run as printed removes the marker and both agents' skills, with no recorded path left",
    () => {
      const w = world("r47");
      install(w, [flag("claude"), flag("codex")]);
      const recorded = recordedPaths(w);
      expect(recorded, "PREMISE: the ledger names both skills").toEqual(expect.arrayContaining([AGENT_SKILL_REL, ".claude/skills/grugops/SKILL.md"]));
      const marker = at(w.target, MARKER_REL);
      const bytes = readFileSync(marker);
      let r: Run;
      chmodSync(marker, 0o000); // mode-census: access-denial
      try {
        const read = readInstallMarker(w.target);
        expect(read.state === "unreadable" ? read.defect : read.state, "PREMISE: a mode 000 marker reads unreadable with defect blocked").toBe("blocked");
        expect(read.state === "unreadable" ? read.why : "", "PREMISE: the read's cause names EACCES").toContain("EACCES");
        r = uninstall(w, []);
      } finally {
        chmodSync(marker, 0o644); // mode-census: restore
      }
      expect(r.status, r.stdout).toBe(3);
      const about = linesWith(r.stdout, "verify").filter((l) => l.replace(/^ {2}verify\s+/, "").startsWith(MARKER_REL));
      expect(about.length, `one verify line about the marker\n${r.stdout}`).toBe(1);
      const verifyLine = about[0];
      expect(verifyLine, r.stdout).toContain("EACCES");
      expect(verifyLine, r.stdout).toContain("by hand");
      expect(verifyLine, r.stdout).toContain("never delete the marker");
      expect(printedFlags(verifyLine), verifyLine).toEqual([]);
      for (const l of [...r.stdout.split("\n"), ...r.stderr.split("\n")]) {
        expect(l, "a line tells the user to delete the marker").not.toMatch(DELETE_MARKER);
        expect(l, "a line offers removing the marker").not.toMatch(MARKER_REMOVAL);
        expect(l, "a line offers removing the marker").not.toMatch(REMOVAL_OFFER);
      }
      expect(linesWith(r.stdout, "removed"), `something was removed\n${r.stdout}`).toEqual([]);
      expect(readFileSync(marker).equals(bytes), `the marker changed\n${r.stdout}`).toBe(true);
      expect(existsSync(at(w.target, AGENT_SKILL_REL)), r.stdout).toBe(true);
      expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), r.stdout).toBe(true);

      // Follow it: read permission is back (the `finally` above is the fix the line named), then run the printed command.
      const fin = runPrinted(w, verifyLine);
      expect(fin.status, fin.stdout).toBe(0);
      expect(markerGone(w), fin.stdout).toBe(true);
      expect(existsSync(at(w.target, AGENT_SKILL_REL)), fin.stdout).toBe(false);
      expect(existsSync(at(w.target, ".claude/skills/grugops/SKILL.md")), fin.stdout).toBe(false);
      expect(leftRecorded(fin.stdout, recorded), `a path the ledger recorded was left\n${fin.stdout}`).toEqual([]);
    },
    300_000,
  );
});

// ── D-37: every reading that says the marker cannot be used carries the owner's wording or points at it ─────────────
//
// The converse of the owner (plan 34.1-45, 2026-10-13, D-37; it replaces the census-owner converse plan 34.1-44
// deleted). CR-04, CR-05 and CR-06 each came back one arm over because a site beside the owner spoke about the marker
// without asking it; IN-34 was a fourth. So the class rule is held by a census DERIVED BY SEARCH, not by a list of known
// sites: the walk reads every maximal string expression of every product module (the by-hand remedy census's walk:
// productModules, maximalString, readingsOf) and selects each reading that says the marker or its install ledger could
// not be used (UNUSABLE_SAYS). Each selected reading is one of three classes, by its own text:
//   owner wording  it carries a markerFixText substitution (the one never-remove wording, install-marker.ts);
//   pointer        it points at the line that carries it ("see the verify line", "see the FAIL", or "the verify line
//                  about .grugops/install.json");
//   cause only     it names the cause and no remedy verb at all (UNUSABLE_REMEDY_VERB).
// And none tells the user to remove or delete anything by hand (BY_HAND_REMOVAL): over a marker whose record a fix gives
// back, a by-hand removal makes a later reversal by record impossible (T-34.1-84). The selected readings equal
// UNUSABLE_TABLE both ways, with per-class and per-module counts pinned. A reading that fits no class is a finding: the
// product is fixed, never classed to pass.

/** A reading that says the marker or its install ledger could not be used: a cause substitution, or one of the phrases. */
const UNUSABLE_SAYS =
  /\$\{(markerUnusableText|markerDefectText)\(|could not be used as install's marker|install marker could not be (used|read)\b|could not be read as a JSON object|holds a malformed install ledger|install ledger (in \S+ )?is (malformed|unknown)|install ledger could not be used/i;
const OWNER_WORDING = /\$\{markerFixText\(/;
const POINTER = /\bsee the verify line\b|\bsee the FAIL\b|\bthe verify line about \.grugops\/install\.json\b/;
/** A remedy verb, as an instruction: "run" only before a printed command (this run, a run, are nouns). */
const UNUSABLE_REMEDY_VERB = /\b(remove|delete|fix|set|take|restore|correct|edit|re-?run)\b|\brun `/i;
/** Telling the user to remove or delete something by hand. */
const BY_HAND_REMOVAL = /\b(remove|delete)\b[^.]*\bby hand\b/i;

type UnusableClass = "owner wording" | "pointer" | "cause only";
interface UnusableSite {
  readonly module: string;
  readonly fn: string;
  readonly text: string;
  readonly line: number;
}
type UnusableRow = readonly [module: string, fn: string, text: string, cls: UnusableClass, why: string];

/**
 * Whether `fn` in install-marker.ts is one of the owner's own fix-entry builders: a function whose every call in every
 * product module sits inside markerRemedy, so what it returns is printed only as markerRemedy's `fix`, inside
 * markerFixText. Derived by the parser, not listed (ledgerFixEntry is the one such function at plan 34.1-45).
 */
function ownerFixBuilder(module: string, fn: string): boolean {
  if (module !== "install-marker.ts") return false;
  const calls: string[] = [];
  for (const m of productModules()) {
    const sf = parse(`install/${m}`);
    for (const c of nodesOf(sf, ts.isCallExpression)) if (ts.isIdentifier(c.expression) && c.expression.text === fn) calls.push(enclosing(c));
  }
  return calls.length > 0 && calls.every((e) => e === "markerRemedy");
}
/** The class a selected reading's own text (or, for the owner's fix-entry builders, the parser) puts it in, or null. */
function unusableClass(s: UnusableSite): UnusableClass | null {
  if (OWNER_WORDING.test(s.text) || ownerFixBuilder(s.module, s.fn)) return "owner wording";
  if (POINTER.test(s.text)) return "pointer";
  if (!UNUSABLE_REMEDY_VERB.test(s.text)) return "cause only";
  return null;
}
/** Every reading of every maximal string expression in every product module that says the marker cannot be used. */
function unusableCensus(): UnusableSite[] {
  const out: UnusableSite[] = [];
  for (const module of productModules()) {
    const sf = parse(`install/${module}`);
    const seen = new Set<ts.Node>();
    const isFragment = (n: ts.Node): boolean =>
      ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n);
    for (const f of nodesOf(sf, (n): n is ts.Node => isFragment(n))) {
      const m = maximalString(f);
      if (seen.has(m)) continue;
      seen.add(m);
      for (const v of readingsOf(m)) {
        const text = v.text.replace(/\s+/g, " ").trim();
        if (!UNUSABLE_SAYS.test(text)) continue;
        out.push({ module, fn: enclosing(m), text, line: sf.getLineAndCharacterOfPosition(m.getStart(sf)).line + 1 });
      }
    }
  }
  return out;
}

/**
 * THE TABLE (derived at execution of plan 34.1-45, after its Tasks 1 and 2, by the walk above; not copied from the plan's
 * sibling list, which named install.ts's pointer and cause-only sites by line). The walk found 33 readings: install.ts 15,
 * uninstall.ts 11, install-marker.ts 7; the other six product modules print none. A cause-only reading is a value another
 * message interpolates (pruneRoots' note, kitPreflight's edited reason, the owner's cause clauses); that consumer's own
 * text is not followed here, and the by-hand remedy census above reads it when it touches the marker or its ledger.
 */
const UNUSABLE_TABLE: readonly UnusableRow[] = [
  ["install-marker.ts", "markerUnusableText", "is a JSON object but could not be used as install's marker (${read.why})", "cause only", "the owner module's cause clause, printed only as a substitution inside a reading that carries markerFixText (I1, I5, I6, the uninstaller's module-top verify) or as pruneRoots' cause"],
  ["install-marker.ts", "markerUnusableText", "could not be read as a JSON object (${read.why})", "cause only", "the owner module's cause clause, printed only as a substitution inside a reading that carries markerFixText (I1, I5, I6, the uninstaller's module-top verify) or as pruneRoots' cause"],
  ["install-marker.ts", "ledgerFixEntry", "the install ledger is malformed, ${why}: correct that entry or field of the install ledger to what install wrote, for example from version control or a backup", "owner wording", "the owner's fix entry for a malformed ledger: markerRemedy returns it as `fix`, printed only inside markerFixText (the parser row below asserts its one caller)"],
  ["install-marker.ts", "<module>", "it could not be read as a JSON object", "cause only", "MARKER_DEFECT_TEXT, the one cause clause of a skipped or left line (markerDefectText); its readers point at the verify line"],
  ["install-marker.ts", "<module>", "it could not be read as a JSON object", "cause only", "MARKER_DEFECT_TEXT, the one cause clause of a skipped or left line (markerDefectText); its readers point at the verify line"],
  ["install-marker.ts", "<module>", "it could not be read as a JSON object", "cause only", "MARKER_DEFECT_TEXT, the one cause clause of a skipped or left line (markerDefectText); its readers point at the verify line"],
  ["install-marker.ts", "<module>", "its install ledger is malformed", "cause only", "MARKER_DEFECT_TEXT, the one cause clause of a skipped or left line (markerDefectText); its readers point at the verify line"],
  ["install.ts", "markerUnreadable", "the install marker ${markerFile} is present but ${markerUnusableText(read)} — the install state of ${TARGET} is unknown, so nothing else was checked. ${markerFixText(remedy)}; then run `${doctorCheckCommand()}`", "owner wording", "I1, the doctor's FAIL over an unreadable marker (R36 control)"],
  ["install.ts", "doctor", "the install marker ${markerFile} holds a malformed install ledger (${ledgerRead.why}) — install writes it back as found, uninstall uses none of it and keeps the marker, and both report a verify finding (exit 3). ${markerFixText(remedy)}; then run `${doctorCheckCommand()}`", "owner wording", "I2, the doctor's FAIL over a malformed ledger (R43c)"],
  ["install.ts", "doctor", ".grugops/install.json could not be read as a JSON object — the install ledger is unknown, so the ask rules were not checked", "cause only", "the doctor's ask-rules WARN over an unreadable re-read (reached only if the marker changed after DOCTOR_MARKER_READ: markerUnreadable returns first); names no remedy (its wrong-cause wording is deferred-items.md DI-19)"],
  ["install.ts", "doctor", "the install ledger in .grugops/install.json is malformed (see the FAIL above) — the ask rules were not checked, and neither the installer nor the uninstaller will change them until the field is fixed", "pointer", "the doctor's ask-rules info over a malformed ledger: points at the malformed-ledger FAIL (I2)"],
  ["install.ts", "pruneRoots", ".grugops/install.json ${markerUnusableText(marker)}", "cause only", "--prune-old-kit's note: why there is no record to prune by; no remedy"],
  ["install.ts", "pruneRoots", "the install ledger in .grugops/install.json is malformed (${targetLedger.why})", "cause only", "--prune-old-kit's note: why there is no record to prune by; no remedy"],
  ["install.ts", "kitPreflight", "the install marker could not be read", "cause only", "why a kit file is treated as edited (backed up before it is overwritten); no remedy"],
  ["install.ts", "kitPreflight", "the install ledger is malformed", "cause only", "why a kit file is treated as edited (backed up before it is overwritten); no remedy"],
  ["install.ts", "writeMarker", ".grugops/install.json (left unchanged — ${markerDefectText(previousMarker.defect)}; see the verify line above)", "pointer", "writeMarker's skipped line (IN-33, R44): points at the never-remove verify"],
  ["install.ts", "writeMarker", ".grugops/install.json — the install ledger is malformed (${previousLedger.why}), so it was written back unchanged and nothing this run did was recorded. Uninstall will remove and edit nothing on it; ${markerFixText(remedy)}; then re-run the installer.", "owner wording", "I3, writeMarker's verify over a malformed ledger (R43c)"],
  ["install.ts", "writeAskRules", ".grugops/install.json ${markerUnusableText(previousMarker)}, so this run uses none of its records — no ask rule was added to ${rel} and the marker was left as it was. ${markerFixText(remedy)}; then re-run the installer.", "owner wording", "I5, writeAskRules' verify over an unreadable marker (R37d)"],
  ["install.ts", "writeAskRules", "${rel} — the install ledger in .grugops/install.json is malformed (${previousRead.why}), so no ask rule was added and the ledger is written back unchanged. ${markerFixText(remedy)}; then re-run the installer.", "owner wording", "I4, writeAskRules' verify over a malformed ledger (R43c)"],
  ["install.ts", "askRulesStep", ".grugops/install.json ${markerUnusableText(previousMarker)}, so this run uses none of its records — the marker was left as it was. ${markerFixText(remedy)}; then re-run the installer.", "owner wording", "I6, askRulesStep's verify over an unreadable marker (R37)"],
  ["install.ts", "writeOpenCodePermission", "the install marker could not be used (see the verify line about .grugops/install.json), so the rule could not be recorded for uninstall", "pointer", "the OpenCode note: points at the verify line about the marker"],
  ["install.ts", "writeOpenCodePermission", "the install ledger is malformed (see the verify line about .grugops/install.json), so the rule could not be recorded for uninstall", "pointer", "the OpenCode note: points at the verify line about the marker"],
  ["uninstall.ts", "noBlockRecordReason", "the install marker could not be used (see the verify line above), so this run could not tell whether install appended this block — left in place", "pointer", "the unrecorded-block report (IN-34's sibling, plan 34.1-45 Task 1): points at the module-top verify; no by-hand removal (R45)"],
  ["uninstall.ts", "noBlockRecordReason", "the install ledger could not be used (see the verify line above), so this run could not tell whether install appended this block — left in place", "pointer", "the unrecorded-block report (IN-34's sibling, plan 34.1-45 Task 1): points at the module-top verify; no by-hand removal (R45)"],
  ["uninstall.ts", "removeMarker", ".grugops/install.json (left in place — ${markerDefectText(MARKER_READ.defect)}; see the verify line above)", "pointer", "U3, removeMarker's line over an unreadable marker (IN-33, R44)"],
  ["uninstall.ts", "removeMarker", ".grugops/install.json (its install ledger is malformed, so the record of what install did could not be used; it was left in place — see the verify line above)", "pointer", "U4, removeMarker's line over a malformed ledger (R43a)"],
  ["uninstall.ts", "unrecordedFileReason", "the install ledger could not be used (see the verify line above) — left in place", "pointer", "an unrecorded grugops-shaped file's left line: points at the module-top verify"],
  ["uninstall.ts", "reportUnrecordedSettings", "${rel} (the install marker could not be used (see the verify line above), so there is no usable record of what install changed in it — left untouched)", "pointer", "the Gemini settings left line: points at the module-top verify"],
  ["uninstall.ts", "reportUnrecordedSettings", "${rel} (the install ledger could not be used — see the verify line above; left untouched)", "pointer", "the Gemini settings left line: points at the module-top verify"],
  ["uninstall.ts", "reportUnrecordedSettings", "${rel} ask rules (the install marker could not be used — see the verify line above; nothing removed)", "pointer", "IN-34 (plan 34.1-45 Task 1): the ask-rules left line points at the marker's verify; it was a second verify saying to remove the rules by hand (R45)"],
  ["uninstall.ts", "reportUnrecordedSettings", "${rel} ask rules (the install ledger could not be used — see the verify line above; nothing removed)", "pointer", "the ask-rules left line over a malformed ledger: points at the module-top verify"],
  ["uninstall.ts", "<module>", ".grugops/install.json ${markerUnusableText(MARKER)}, so this run uses none of its records and removes and edits nothing here. ${markerFixText(remedy)}; then run `${rerunCommand()}` again.", "owner wording", "the module-top verify over an unreadable (or unbound-folded) marker (R41, R45)"],
  ["uninstall.ts", "<module>", ".grugops/install.json holds a malformed install ledger (${LEDGER.why}), so this run uses none of its records and removes and edits nothing here. ${markerFixText(remedy)}; then run `${rerunCommand()}` again.", "owner wording", "the module-top verify over a malformed ledger (R43a)"],
];
const UNUSABLE_CLASS_COUNTS: Readonly<Record<UnusableClass, number>> = { "owner wording": 9, pointer: 13, "cause only": 11 };
const unusableKey = (module: string, fn: string, text: string): string => `${module} :: ${fn} :: ${text}`;

describe("D-37: every reading that says the marker cannot be used carries the owner's wording or points at it", () => {
  it("the walk reads all nine product modules and finds readings in both binaries and the owner's module (premise)", () => {
    expect(productModules().length, "PREMISE: the walk reads the nine product modules").toBe(9);
    const sites = unusableCensus();
    for (const m of ["install.ts", "uninstall.ts", "install-marker.ts"]) {
      expect(sites.some((s) => s.module === m), `PREMISE: the walk found a reading in ${m}`).toBe(true);
    }
    // The owner's fix-entry builder is derived by the parser, and the derivation finds the one at this plan.
    expect(ownerFixBuilder("install-marker.ts", "ledgerFixEntry"), "PREMISE: ledgerFixEntry is called only inside markerRemedy").toBe(true);
    expect(ownerFixBuilder("install-marker.ts", "markerUnusableText"), "PREMISE: markerUnusableText is not an owner fix builder").toBe(false);
  });

  it("the census equals UNUSABLE_TABLE both ways, with per-class and per-module counts", () => {
    const sites = unusableCensus();
    const found = new Map<string, number>();
    for (const s of sites) found.set(unusableKey(s.module, s.fn, s.text), (found.get(unusableKey(s.module, s.fn, s.text)) ?? 0) + 1);
    const want = new Map<string, number>();
    for (const r of UNUSABLE_TABLE) want.set(unusableKey(r[0], r[1], r[2]), (want.get(unusableKey(r[0], r[1], r[2])) ?? 0) + 1);
    const unclassified = sites.filter((s) => !want.has(unusableKey(s.module, s.fn, s.text))).map((s) => `${s.module}:${s.line} [${s.fn}] ${s.text}`);
    const stale = [...want.keys()].filter((k) => !found.has(k));
    const counts = [...want].filter(([k, n]) => found.has(k) && found.get(k) !== n).map(([k, n]) => `${k}: table ${n}, found ${found.get(k)}`);
    expect(unclassified, "a reading that says the marker cannot be used is not classed").toEqual([]);
    expect(stale, "a classed reading is gone or changed").toEqual([]);
    expect(counts, "a classed reading is printed a different number of times").toEqual([]);
    expect(sites.length, "the census size moved").toBe(33);
    expect(countBy(sites, (s) => s.module), "per-module counts").toEqual({ "install-marker.ts": 7, "install.ts": 15, "uninstall.ts": 11 });
    expect(countBy(UNUSABLE_TABLE, (r) => r[3]), "per-class counts").toEqual(
      Object.fromEntries(Object.entries(UNUSABLE_CLASS_COUNTS).sort(([a], [b]) => a.localeCompare(b))),
    );
  });

  it("each reading is in the class its own text puts it in, and none tells the user to remove or delete anything by hand or offers removing the marker", () => {
    const sites = unusableCensus();
    const cls = new Map(UNUSABLE_TABLE.map((r) => [unusableKey(r[0], r[1], r[2]), r[3]]));
    const wrong: string[] = [];
    for (const s of sites) {
      const where = `${s.module}:${s.line} [${s.fn}] ${s.text}`;
      const got = unusableClass(s);
      if (got === null) wrong.push(`fits no class (no owner wording, no pointer, and a remedy verb): ${where}`);
      const row = cls.get(unusableKey(s.module, s.fn, s.text));
      if (row !== undefined && got !== null && row !== got) wrong.push(`classed ${row}, but its text is ${got}: ${where}`);
      if (BY_HAND_REMOVAL.test(s.text)) wrong.push(`tells the user to remove or delete something by hand: ${where}`);
      if (offersRemoval(s.text)) wrong.push(`offers removing the marker: ${where}`);
    }
    expect(sites.length, "PREMISE: the rules were asked of readings").toBeGreaterThan(0);
    expect(wrong, "a reading that says the marker cannot be used breaks the class rule (D-37)").toEqual([]);
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

  // D-31 (IN-26, plan 34.1-30): install's own call reads the ledger it writes. Its `known` is not its `keep`, and it
  // reads nextEntries through entryHolds and entryOwners; `keep` is AGENTS_AFTER's registry ids (knownAfter). The
  // agentsToRecord calls are derived over every product module under install/ (the walk is asserted to read them).
  it("writeMarker: agentsToRecord's `known` is not its `keep` and reads nextEntries (D-31, IN-26); the product modules hold 3 agentsToRecord calls: writeMarker, installedSplit, agentsAfter", () => {
    const mods = readdirSync(join(REPO_ROOT, "install"))
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts") && !f.endsWith(".test.ts") && !f.endsWith(".test-support.ts"))
      .sort();
    expect(mods, "premise: the walk read the installer's product modules").toEqual(expect.arrayContaining(["install-marker.ts", "install.ts", "uninstall.ts"]));
    const calls = mods.flatMap((m) => callsOf(parse(`install/${m}`), "agentsToRecord").map((c) => ({ site: `${m}:${enclosing(c)}`, c })));
    expect(calls.map((x) => x.site).sort()).toEqual(["install.ts:installedSplit", "install.ts:writeMarker", "uninstall.ts:agentsAfter"]);
    const arg = calls.find((x) => x.site === "install.ts:writeMarker")?.c.arguments[0];
    expect(arg !== undefined && ts.isObjectLiteralExpression(arg), `writeMarker's agentsToRecord argument is ${arg?.getText()}`).toBe(true);
    const prop = (name: string): ts.Expression => {
      const p = (arg as ts.ObjectLiteralExpression).properties.filter(ts.isPropertyAssignment).filter((x) => ts.isIdentifier(x.name) && x.name.text === name);
      expect(p.length, `writeMarker's agentsToRecord argument sets \`${name}\` once`).toBe(1);
      return p[0].initializer;
    };
    const known = prop("known");
    const keep = prop("keep");
    expect(keep.getText(), "keep is this run's agents").toBe("knownAfter");
    expect(known.getText(), "known is the same expression as keep: it never reads the ledger").not.toBe(keep.getText());
    const read = new Set(nodesOf(known, ts.isIdentifier).map((i) => i.text));
    for (const name of ["knownAfter", "nextEntries", "entryHolds", "entryOwners"]) expect(read.has(name), `known does not read ${name}: ${known.getText()}`).toBe(true);
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
 * The fragments of install/uninstall.ts matching RERUN_FRAGMENT, measured 2026-10-12 (plan 34.1-26): 0. Plan 34.1-26
 * (D-33, WR-20's other branch) rewrote the no-target or no-ledger verify's "Re-run install.js here, then uninstall
 * with `rerunCommand()`" as "Run `reinstallCommand()`, then `rerunCommand()`", which prints both commands and no longer
 * matches the fragment. Plan 34.1-25 measured 1 (that verify); plan 34.1-14 measured 2 (it and the other-directory
 * verify's "Otherwise re-run install.js here, with any agent flag", which plan 34.1-25 rewrote the same way). The 6
 * fragments at HEAD 2e10cba9 were 4 bare re-run remedies (removeAskRules, the kept `left` line, the malformed-ledger
 * verify, the KEPT_FOR banner) that now print the command instead, and those 2. The pin at 0 still fails on any new
 * fragment, and the census asserts that its walk read uninstall.ts's string fragments, so 0 is a measurement.
 */
const RERUN_FRAGMENT_COUNT = 0;

// ── the command-context census (phase 34.1 gap round 2, D-33, the class; plan 34.1-24) ─────────────────────────────
//
// Every printed command is built by host-tools.ts agentCommand (or its scriptCommand) with the invocation context its
// module builds once, COMMAND_CONTEXT. The census walks every product module under install/ with the TypeScript
// parser (never a line regex), finds every call of agentCommand and scriptCommand, and holds that each passes the
// identifier COMMAND_CONTEXT as its context argument (agentCommand's fourth, scriptCommand's second). The modules that
// call either are derived and must equal CONTEXT_CALLS both ways, with the per-module counts pinned; each such module
// declares COMMAND_CONTEXT exactly once. host-tools.ts is the builder: its own scriptCommand call inside agentCommand
// passes agentCommand's parameter, so it is classed here by name and not counted.
//   install.ts   15 agentCommand calls (plans 34.1-22 and 34.1-23: 10; plan 34.1-27: doctorInstallCommand and
//                 doctorCheckCommand, the doctor's flag-less install and check commands, 2, and the example with one
//                 agent's flag in the doctor's no-agent-recorded-or-detected WARN, 1; plan 34.1-28: migrateCommand, the
//                 --migrate same-run command both migrate INCOMPLETE banners and the handoffs abort print, 1 -> 14;
//                 plan 34.1-28 task 2: the prune INCOMPLETE banner's command, --prune-old-kit with no agent flag,
//                 1 -> 15; plan 34.1-29, D-31, IN-23: the closing notes' "Recorded as chosen" line, which gives a
//                 recorded agent with nothing installed its install command and its uninstall command, 2 -> 17),
//                 2 scriptCommand calls (plan 34.1-28 task 2, D-33: the update INCOMPLETE banner's
//                 `--update` command and the --update success hint's `--check --target <repo>` command; --update takes
//                 no target and no agent flag, so its commands are the invocation words and a mode);
//   uninstall.ts  5 agentCommand calls (rerunCommand 1, finishCommand 3: FULL, UNFINISHED and NAMED, and, from plan
//                 34.1-25, reinstallCommand 1: the install step of the unusable-marker remedy, WR-20), 0 scriptCommand.
// A later plan that adds a call re-pins its count here with the reason.
const CONTEXT_CALLS: Readonly<Record<string, { readonly agentCommand: number; readonly scriptCommand: number }>> = {
  "install/install.ts": { agentCommand: 17, scriptCommand: 2 },
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

// ── D-36: one CommandContext constructor (phase 34.1 gap round 3, reviews WR-21 and WR-22; plan 34.1-36) ─────────────
//
// WR-21 and WR-22 were two derivations of one invocation context: install.ts built it from the run, uninstall.ts from
// the marker, an `unbound` one included, so the two binaries printed different install commands for one marker and the
// uninstaller printed another person's kit home. D-36 gives the context one owner, host-tools.ts
// commandContextFromRecord, and this census holds it by the TypeScript parser over every product module (productModules:
// git ls-files, no test, test-support or declaration file):
//   - the object literals that build a context (property names include scriptDir, kitHome and symlink) number exactly
//     one, and it sits inside commandContextFromRecord in host-tools.ts. The `run` argument of a commandContextFromRecord
//     call (a RunInvocation, which carries the same three names and defaultKitHome) is the owner's input, not a
//     context, and is not counted;
//   - no product function other than commandContextFromRecord declares CommandContext as its return type;
//   - in each binary the initializer of COMMAND_CONTEXT is a call of commandContextFromRecord whose first argument is
//     the binary's one marker read (install.ts DOCTOR_MARKER_READ, uninstall.ts MARKER_READ);
//   - commandContextFromRecord is called exactly once per binary and nowhere else in the product modules.
// A later plan that adds a constructor re-pins CONTEXT_CONSTRUCTORS here with the reason.
const CONTEXT_CONSTRUCTORS = {
  owner: { module: "install/host-tools.ts", fn: "commandContextFromRecord" },
  literals: 1,
  returnTypeFunctions: 1,
  initializers: { "install/install.ts": "DOCTOR_MARKER_READ", "install/uninstall.ts": "MARKER_READ" } as Readonly<Record<string, string>>,
} as const;

/** The property names of an object literal (plain and shorthand assignments). */
const literalNames = (o: ts.ObjectLiteralExpression): string[] =>
  o.properties.flatMap((p) => ((ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && ts.isIdentifier(p.name) ? [p.name.text] : []));
/** The name a function-like node is known by (its declared name, or the const it is bound to), or `<anonymous>`. */
function functionLikeName(f: ts.SignatureDeclaration): string {
  if (f.name !== undefined && ts.isIdentifier(f.name)) return f.name.text;
  if (ts.isVariableDeclaration(f.parent) && ts.isIdentifier(f.parent.name)) return f.parent.name.text;
  return "<anonymous>";
}

describe("D-36: one CommandContext constructor (WR-21, WR-22)", () => {
  const modules = productModules().map((m) => `install/${m}`);
  const parsed = new Map(modules.map((rel) => [rel, parse(rel)] as const));
  const where = (rel: string, n: ts.Node): string => `${rel}:${parsed.get(rel)!.getLineAndCharacterOfPosition(n.getStart(parsed.get(rel)!)).line + 1}`;

  it("premise: the walk sees the owner's module and both binaries", () => {
    expect(modules, "premise: the walk found product modules").toEqual(
      expect.arrayContaining([CONTEXT_CONSTRUCTORS.owner.module, ...Object.keys(CONTEXT_CONSTRUCTORS.initializers)]),
    );
  });

  it("exactly one object literal builds a context, inside commandContextFromRecord", () => {
    const found: string[] = [];
    for (const [rel, sf] of parsed) {
      for (const o of nodesOf(sf, ts.isObjectLiteralExpression)) {
        const names = literalNames(o);
        const runArgument = ts.isCallExpression(o.parent) && calleeName(o.parent) === CONTEXT_CONSTRUCTORS.owner.fn && o.parent.arguments[1] === o;
        if (!runArgument && ["scriptDir", "kitHome", "symlink"].every((n) => names.includes(n))) found.push(`${where(rel, o)} in ${enclosing(o)}`);
      }
    }
    expect(found.length, `context-building object literals:\n${found.join("\n")}`).toBe(CONTEXT_CONSTRUCTORS.literals);
    expect(found[0]?.replace(/:\d+ in /, " in ")).toBe(`${CONTEXT_CONSTRUCTORS.owner.module} in ${CONTEXT_CONSTRUCTORS.owner.fn}`);
  });

  it("no product function other than commandContextFromRecord declares CommandContext as its return type", () => {
    const found: string[] = [];
    for (const [rel, sf] of parsed) {
      const fns = nodesOf(sf, ts.isFunctionLike);
      for (const f of fns) {
        if (f.type !== undefined && ts.isTypeReferenceNode(f.type) && ts.isIdentifier(f.type.typeName) && f.type.typeName.text === "CommandContext") {
          found.push(`${rel}:${functionLikeName(f)}`);
        }
      }
    }
    expect(found.length, found.join("\n")).toBe(CONTEXT_CONSTRUCTORS.returnTypeFunctions);
    expect(found).toEqual([`${CONTEXT_CONSTRUCTORS.owner.module}:${CONTEXT_CONSTRUCTORS.owner.fn}`]);
  });

  it("each binary's COMMAND_CONTEXT is commandContextFromRecord called on its one marker read, and the owner is called nowhere else", () => {
    for (const [rel, read] of Object.entries(CONTEXT_CONSTRUCTORS.initializers)) {
      const sf = parsed.get(rel)!;
      const decls = nodesOf(sf, ts.isVariableDeclaration).filter((d) => ts.isIdentifier(d.name) && d.name.text === "COMMAND_CONTEXT");
      expect(decls.length, `${rel}: COMMAND_CONTEXT declarations`).toBe(1);
      const init = decls[0].initializer;
      expect(init !== undefined && ts.isCallExpression(init) && calleeName(init) === CONTEXT_CONSTRUCTORS.owner.fn, `${rel}: COMMAND_CONTEXT is not the owner's call: ${init?.getText(sf).slice(0, 120)}`).toBe(true);
      const first = (init as ts.CallExpression).arguments[0];
      expect(first !== undefined && ts.isIdentifier(first) ? first.text : first?.getText(sf), `${rel}: the owner's first argument`).toBe(read);
    }
    const calls: string[] = [];
    for (const [rel, sf] of parsed) for (const c of callsOf(sf, CONTEXT_CONSTRUCTORS.owner.fn)) calls.push(`${rel}:${enclosing(c)}`);
    expect(calls.sort()).toEqual(Object.keys(CONTEXT_CONSTRUCTORS.initializers).map((rel) => `${rel}:<module>`).sort());
  });
});

// ── the markerRemedy call sites (phase 34.1 gap round 3, D-35, 34.1 review CR-04; plan 34.1-40) ────────────────────
//
// Every remedy site that reads .grugops/install.json asks install-marker.ts markerRemedy, the one owner (brief §5). The
// census walks every product module (productModules: git ls-files, no test, test-support or declaration file) with the
// TypeScript parser, finds every call of markerRemedy and keys it by module and enclosing function. The result must
// equal MARKER_REMEDY_CALLS both ways, with the per-function and per-module counts pinned. A site that reads the marker
// in place of the owner (for example `previousMarker.jsonObject`) drops a call and turns the count red (mutation M4 of
// plan 34.1-40). Every other mention of the name must be its declaration or an import, so no alias or namespace call
// can sit outside the count.
//
// The converse derived from the census owner tags was deleted by plan 34.1-44 (2026-10-13, D-37): no reading is decided
// by the owner's answer any more (see the end of this describe).

/**
 * The markerRemedy calls per product module and enclosing function, measured at execution of plan 34.1-40
 * (2026-10-13, HEAD 9d9d9c9a) by the walk below.
 *   install.ts    4 (plan 34.1-33): markerUnreadable (the doctor's FAIL, I1), writeAskRules (I5), askRulesStep (I6) and
 *                 writeMarker (its skipped line reads ledgerWellFormed), one call each. 7 since plan 34.1-43 (2026-10-13,
 *                 D-37, 34.1 review CR-06): the doctor's malformed-ledger FAIL (I2, doctor 0 -> 1), writeMarker's
 *                 malformed-ledger verify (I3, writeMarker 1 -> 2) and writeAskRules' (I4, writeAskRules 1 -> 2) each ask
 *                 the owner for markerFixText's fix. 6 since plan 34.1-44 (2026-10-13, D-37, 34.1 review CR-05):
 *                 writeMarker's skipped line asks the owner nothing (one line for every unreadable read), writeMarker
 *                 2 -> 1;
 *   uninstall.ts  4 (plan 34.1-34): the module-top unreadable-marker verify (`<module>`, 1), removeMarker (2: one call
 *                 at the top of its not-owned block, which the JSON-object arm and U3 both read, and one for U4) and
 *                 keepWithoutRecord (1). 3 since plan 34.1-42 (2026-10-13, D-37): removeMarker's not-owned block asks the
 *                 owner nothing (its lines point at the module-top verify), so removeMarker 2 -> 1 (U4's call); the
 *                 module-top verify still asks it, for the read's problems as `fix`. 2 since plan 34.1-42 Task 2
 *                 (2026-10-13, D-37, amends D-32): keepWithoutRecord offers no removal on any run kind, so it asks the
 *                 owner nothing (keepWithoutRecord 1 -> 0, its key deleted). Since plan 34.1-43 (2026-10-13, D-37, 34.1
 *                 review CR-06): removeMarker's U4 line points at the module-top verify and asks the owner nothing
 *                 (removeMarker 1 -> 0, its key deleted), and the module-top malformed-ledger verify asks it for the
 *                 ledger's fix entry (`<module>` 1 -> 2: one call in each module-top verify arm).
 * Re-pinned by plan 34.1-44 Task 2 (2026-10-13, D-37): every call takes the read alone (the run-kind argument is
 * deleted) and is guarded by noMarkerRemedy; the functions and counts are unchanged (install.ts 6, uninstall.ts 2).
 * install-marker.ts declares markerRemedy and calls it nowhere; no other product module calls it.
 */
const MARKER_REMEDY_CALLS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  "install.ts": { askRulesStep: 1, doctor: 1, markerUnreadable: 1, writeAskRules: 2, writeMarker: 1 },
  "uninstall.ts": { "<module>": 2 },
};

/** Every markerRemedy call in the product modules, and every other mention of the name, by the TypeScript parser. */
function markerRemedyWalk(): { calls: Map<string, Map<string, number>>; other: string[]; modules: string[] } {
  const calls = new Map<string, Map<string, number>>();
  const other: string[] = [];
  const modules = productModules();
  for (const module of modules) {
    const sf = parse(`install/${module}`);
    for (const id of nodesOf(sf, ts.isIdentifier).filter((i) => i.text === "markerRemedy")) {
      const p = id.parent;
      if (ts.isCallExpression(p) && p.expression === id) {
        const fns = calls.get(module) ?? new Map<string, number>();
        fns.set(enclosing(p), (fns.get(enclosing(p)) ?? 0) + 1);
        calls.set(module, fns);
      } else if (module === "install-marker.ts" && ts.isFunctionDeclaration(p) && p.name === id) {
        // the owner's own declaration
      } else if (ts.isImportSpecifier(p) && p.propertyName === undefined) {
        // `import { markerRemedy } from "./install-marker.js"`: a plain import, the name is not rebound
      } else {
        other.push(`${module}:${sf.getLineAndCharacterOfPosition(id.getStart(sf)).line + 1} ${ts.SyntaxKind[p.kind]}: ${p.getText(sf).slice(0, 120)}`);
      }
    }
  }
  return { calls, other, modules };
}
const sortedRecord = (m: ReadonlyMap<string, ReadonlyMap<string, number>>): Record<string, Record<string, number>> =>
  Object.fromEntries([...m].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, Object.fromEntries([...v].sort(([a], [b]) => a.localeCompare(b)))]));

describe("D-35: the markerRemedy call sites (34.1 review CR-04)", () => {
  it("every markerRemedy call in the product modules equals MARKER_REMEDY_CALLS, both ways, with the counts pinned", () => {
    const { calls, other, modules } = markerRemedyWalk();
    expect(modules, "PREMISE: the walk read the owner's module and both binaries").toEqual(expect.arrayContaining(["install-marker.ts", "install.ts", "uninstall.ts"]));
    expect(sortedRecord(calls), "a markerRemedy call site is not pinned, or a pinned one is gone").toEqual(
      sortedRecord(new Map(Object.entries(MARKER_REMEDY_CALLS).map(([k, v]) => [k, new Map(Object.entries(v))]))),
    );
    const perModule = Object.fromEntries([...calls].map(([m, fns]) => [m, [...fns.values()].reduce((n, c) => n + c, 0)]).sort(([a], [b]) => String(a).localeCompare(String(b))));
    // uninstall.ts 4 -> 3 -> 2 (plan 34.1-42, 2026-10-13, D-37): removeMarker's not-owned block and keepWithoutRecord no
    // longer ask the owner. Still 2 since plan 34.1-43 (2026-10-13, D-37): U4's call moved to the module-top
    // malformed-ledger verify.
    // install.ts 4 -> 7 (plan 34.1-43 Task 2, 2026-10-13, D-37): I2, I3 and I4 ask the owner. 7 -> 6 (plan 34.1-44,
    // 2026-10-13, D-37): writeMarker's skipped line no longer asks it.
    expect(perModule, "the per-module markerRemedy call counts moved").toEqual({ "install.ts": 6, "uninstall.ts": 2 });
    expect(other, "markerRemedy is named somewhere other than its declaration, a plain import or a call").toEqual([]);
  });

  // The converse ("every function holding a reading decided by markerRemedy's answer holds a markerRemedy call") was
  // deleted by plan 34.1-44 (2026-10-13, D-37, 34.1 review CR-05): no product function holds a reading the owner's answer
  // decides any more (I1, I5 and I6 have one reading each). Plan 34.1-45 replaces it with the unusable-marker converse.
});

describe("the uninstall re-run census (MSG-1)", () => {
  it("every uninstall.ts fragment that says to run uninstall again sits in a string expression that prints rerunCommand or finishCommand", () => {
    const sf = parse("install/uninstall.ts");
    const strings: ts.Node[] = nodesOf(sf, (n): n is ts.Node =>
      ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n),
    );
    // Premise: the walk read uninstall.ts's string fragments, so a count of 0 below is a measurement, not an empty walk.
    expect(strings.length, "premise: the walk found uninstall.ts's string fragments").toBeGreaterThan(500);
    expect(strings.some((n) => (n as ts.LiteralLikeNode).text.includes("is install's marker, but not a record this run can use")), "premise: the walk sees the no-target or no-ledger verify").toBe(true);
    const fragments: ts.Node[] = strings.filter((n) => RERUN_FRAGMENT.test((n as ts.LiteralLikeNode).text));
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
