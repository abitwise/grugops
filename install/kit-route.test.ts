// kit-route.test.ts — after a scripted install whose kit lives in a separate kit home, the words a
// non-Claude host reads lead to the Orchestrator (plan 34-27, D-26, gap G-34-2).
//
// THE GAP (34-UAT.md test 2). Pi expanded `/grugops`, read `<repo>/agent-factory/roles/orchestrator.md`,
// got ENOENT and stopped: a scripted install puts the kit only in the kit home, and the template named a
// repository-relative path with no route to it. `--check` printed ALL CHECKS PASSED all the same. The
// existing Pi template block in install.test.ts pins the template to the Copilot pointer's bytes (parity)
// and never asks whether the path it names exists.
//
// THE ORACLE IS AN INDEPENDENT ROUTE FOLLOWER, NOT THE INSTALLER'S OUTPUT. This file reads
// `.grugops/install.json` with readFileSync and JSON.parse, takes its `kitRoot` string, and checks on disk
// that `<kitRoot>/roles/orchestrator.md` is a regular file outside the target — what an agent that obeys
// KIT_ROUTE does. It shares no code with the doctor's route check, so a doctor that lies is caught here.
//
// Drives the COMMITTED install/install.js (npm run build first). Every target and kit home
// (GRUGOPS_HOME) is a scratch directory under one per-file root, removed in afterAll.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, renameSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { HOST_TOOLS, HOST_TOOL_COUNT, KIT_ROUTE, PI_PROMPT_REL, ROUTE_POINTERS, agentCommand, agentFlag, entryOwners, hostForFlag, launchInvoke, launchSession } from "./host-tools.js";
import { KIT_HOME_RECORD_REL, contentRecord, readKitHomeRecord } from "./install-marker.js";
import { realTargetPath } from "./user-file.js";
import {
  INSTALL_JS,
  MARKER_REL,
  REPO_ROOT,
  commandContextFor,
  lineNamesPath,
  makeFixture,
  pathText,
  printedCommand,
  printedCommands,
  printedInvocation,
  runInstall,
  runPrintedCommand,
  runUninstall,
  snapshotTree,
  spawnBin,
  statedModeWords,
  statedSpelling,
  statedWords,
  type Run,
  type StatedRun,
} from "./installer-paths.test-support.js";
import { blockRecords, fileRecords, readMarkerObject, withLedger, withoutAgentsField } from "./ledger.test-support.js";

const ROOT = mkdtempSync(join(tmpdir(), "gkroute-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

let n = 0;
/** A fresh scratch row: an empty git repository and a separate kit home, both under ROOT. */
function scratchRow(): { target: string; kitHome: string } {
  const dir = join(ROOT, `r${n++}`);
  const target = join(dir, "t");
  const kitHome = join(dir, "kit");
  mkdirSync(target, { recursive: true });
  spawnSync("git", ["init", "-q", target], { encoding: "utf8" });
  return { target, kitHome };
}

/** Install into a fresh scratch row (every agent, or the agent flags in `args`); the install must exit 0. */
function installed(args: readonly string[] = []): { target: string; kitHome: string } {
  const row = scratchRow();
  const r: Run = runInstall(row.target, row.kitHome, args);
  expect(r.status, r.stdout + r.stderr).toBe(0);
  return row;
}

const check = (target: string, kitHome: string, opts: { readonly home?: string } = {}): Run => spawnBin(INSTALL_JS, ["--check"], target, kitHome, opts);
const piFile = (target: string): string => join(target, ...PI_PROMPT_REL.split("/"));
/** Install into a fresh scratch row that already holds the user's own AGENTS.md, with no route in it. */
function installedWithOwnAgents(): { target: string; kitHome: string } {
  const row = scratchRow();
  writeFileSync(join(row.target, "AGENTS.md"), "# My agents\n\nMy own instructions.\n");
  const r: Run = runInstall(row.target, row.kitHome);
  expect(r.status, r.stdout + r.stderr).toBe(0);
  return row;
}
/** The registry host whose adapter kind is `pi-prompt-template`, found by kind, never by a typed name. */
function piHost(): (typeof HOST_TOOLS)[number] {
  const p = HOST_TOOLS.filter((h) => h.adapter === "pi-prompt-template");
  expect(p.length, "premise: exactly one registry host has the pi-prompt-template adapter").toBe(1);
  return p[0];
}
/** The registry host whose adapter kind is `copilot-pointer`, found by kind, never by a typed name. */
function copilotHost(): (typeof HOST_TOOLS)[number] {
  const c = HOST_TOOLS.filter((h) => h.adapter === "copilot-pointer");
  expect(c.length, "premise: exactly one registry host has the copilot-pointer adapter").toBe(1);
  return c[0];
}
// THE LAUNCH FILE OF A ROW (quick task 261018-hs8). Pi and GitHub Copilot CLI each get a launch file of their own beside
// their kind's entry (the row's launchAgent field, read from the registry data, never hostPointers). It is NOT a route
// carrier (D-06, human 2026-10-18, review CR-01; this reverses planner decision PD-1): a default session never reads
// it, so a case whose premise is "this row has no route" leaves it as install wrote it. A case whose premise is
// "nothing of install's for this row" (an ownership premise, not a route one) still acts on it, because install writes
// and records it.
/** The launch file of row `h`: its launchAgent, asserted present. */
function launchRelOf(h: (typeof HOST_TOOLS)[number]): string {
  expect(h.launchAgent, `premise: ${h.id} has a launch agent`).not.toBeNull();
  return h.launchAgent!;
}
const launchPath = (target: string, h: (typeof HOST_TOOLS)[number]): string => join(target, ...launchRelOf(h).split("/"));
/** A user edit after install: the route sentence removed from row `h`'s launch file (install's copy, now edited). */
function dropRouteFromLaunch(target: string, h: (typeof HOST_TOOLS)[number]): void {
  const p = launchPath(target, h);
  const text = readFileSync(p, "utf8");
  expect(text.includes(` ${KIT_ROUTE}`), `premise: ${launchRelOf(h)} carries the route`).toBe(true);
  writeFileSync(p, text.replace(` ${KIT_ROUTE}`, ""));
}
/** Before install: the user's own file at row `h`'s launch path, with no route in it (install leaves it, unrecorded). */
function ownLaunchWithoutRoute(target: string, h: (typeof HOST_TOOLS)[number]): void {
  const p = launchPath(target, h);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, "# My own agent\n\nMy own instructions.\n");
}
/** Before install: a directory at row `h`'s launch path, so install's write of the launch file is refused. */
function blockLaunch(target: string, h: (typeof HOST_TOOLS)[number]): string {
  const p = launchPath(target, h);
  mkdirSync(p, { recursive: true });
  return p;
}

/**
 * THE ROUTE FOLLOWER: what an agent obeying KIT_ROUTE does. Read the marker as JSON, take `kitRoot`,
 * and return it with the Orchestrator path under it. Throws a legible assertion when a step fails.
 */
function followRoute(target: string): { kitRoot: string; orchestrator: string } {
  const marker: unknown = JSON.parse(readFileSync(join(target, ...MARKER_REL.split("/")), "utf8"));
  expect(marker !== null && typeof marker === "object" && !Array.isArray(marker), "the marker is not a JSON object").toBe(true);
  const kitRoot = (marker as Record<string, unknown>).kitRoot;
  expect(typeof kitRoot, "the marker has no string kitRoot").toBe("string");
  return { kitRoot: kitRoot as string, orchestrator: join(kitRoot as string, "roles", "orchestrator.md") };
}

/** The backticked tokens of `text`, in order. */
const backticked = (text: string): string[] => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

/**
 * Whether a backticked token is a path: it holds a `/`, or it ends in a file extension. A field name
 * such as `kitRoot` is neither. A token holding `<` (a placeholder such as `<kitRoot>/…`) or `…` (a
 * pattern standing for every path under a directory) names no single file and is not resolved.
 */
const isPathToken = (t: string): boolean => (t.includes("/") || /\.[A-Za-z0-9]+$/.test(t)) && !t.includes("<") && !t.includes("…");

/** The doctor lines (label + message) whose message starts with `kit route`. */
const routeLines = (stdout: string): string[] => stdout.split("\n").filter((l) => /^ {2}\S+\s+kit route/.test(l));

describe("kit route: Pi's /grugops names a route that resolves after a scripted install (plan 34-27, D-26, G-34-2)", () => {
  it("premise: the target holds no agent-factory/roles/orchestrator.md, and the kit home does", () => {
    const { target, kitHome } = installed();
    expect(existsSync(join(target, "agent-factory", "roles", "orchestrator.md"))).toBe(false);
    expect(lstatSync(join(kitHome, "agent-factory", "roles", "orchestrator.md")).isFile()).toBe(true);
  });

  it("the route follower: the marker's kitRoot is absolute, outside the target, and <kitRoot>/roles/orchestrator.md is a regular file", () => {
    const { target } = installed();
    const { kitRoot, orchestrator } = followRoute(target);
    expect(isAbsolute(kitRoot), `kitRoot is not absolute: ${kitRoot}`).toBe(true);
    expect(relative(target, kitRoot).startsWith(".."), `kitRoot is inside the target: ${kitRoot}`).toBe(true);
    expect(lstatSync(orchestrator).isFile(), `${orchestrator} is not a regular file`).toBe(true);
  });

  it("the Pi template carries KIT_ROUTE, and every path it names resolves: agent-factory/ paths under kitRoot, the others under the target", () => {
    const { target } = installed();
    const text = readFileSync(piFile(target), "utf8");
    expect(text.includes(KIT_ROUTE), "the template does not carry the kit route").toBe(true);
    const { kitRoot } = followRoute(target);
    const paths = backticked(text).filter(isPathToken);
    // Vacuity floor: the template names the Orchestrator path and the marker at least.
    expect(paths).toContain("agent-factory/roles/orchestrator.md");
    expect(paths).toContain(".grugops/install.json");
    for (const p of paths) {
      const where = p.startsWith("agent-factory/")
        ? join(kitRoot, ...p.slice("agent-factory/".length).split("/"))
        : join(target, ...p.split("/"));
      expect(existsSync(where), `the template names \`${p}\`, which does not resolve (${where})`).toBe(true);
    }
  });

  it("--check follows the route: exit 0, an ok line for the route and an ok line for the Pi template", () => {
    const { target, kitHome } = installed();
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const lines = routeLines(c.stdout);
    const { orchestrator } = followRoute(target);
    expect(lines.filter((l) => l.startsWith("  ok") && l.includes(orchestrator)).length, c.stdout).toBe(1);
    expect(lines.filter((l) => l.startsWith("  ok") && l.includes(PI_PROMPT_REL)).length, c.stdout).toBe(1);
    expect(lines.filter((l) => !l.startsWith("  ok")), c.stdout).toEqual([]);
  });

  // Plan 34-33 (D-27 point 2): the template without the route strands no host while AGENTS.md carries it (Pi reads
  // both), so it is an uncounted note that still quotes the sentence to add. The intent (a template without the
  // route that leaves Pi without one is counted) is kept by the variant below it.
  it("a user's edit drops the route from the template: an uncounted note naming the file and quoting the sentence to add; Pi reaches through AGENTS.md; --strict exit 0", () => {
    const { target, kitHome } = installed();
    const before = readFileSync(piFile(target), "utf8");
    writeFileSync(piFile(target), before.replace(` ${KIT_ROUTE}`, ""));
    expect(readFileSync(piFile(target), "utf8").includes(KIT_ROUTE), "premise: the edit removed the route").toBe(false);
    const c = spawnBin(INSTALL_JS, ["--check", "--strict"], target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    expect(routeLines(c.stdout).filter((l) => /^ {2}(WARN|FAIL)\s/.test(l)), c.stdout).toEqual([]);
    const notes = routeLines(c.stdout).filter((l) => l.startsWith("  note") && l.includes(PI_PROMPT_REL));
    expect(notes.length, c.stdout).toBe(1);
    expect(notes[0]).toContain(KIT_ROUTE);
    expect(c.stdout).not.toMatch(/FAILURE\(S\)/);
  });

  it("variant: the same edit while the user's own AGENTS.md has no route either: --check WARNs for the template, naming Pi and quoting the sentence to add", () => {
    const { target, kitHome } = installedWithOwnAgents();
    const before = readFileSync(piFile(target), "utf8");
    writeFileSync(piFile(target), before.replace(` ${KIT_ROUTE}`, ""));
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const warns = routeLines(c.stdout).filter((l) => l.startsWith("  WARN") && l.includes(PI_PROMPT_REL));
    expect(warns.length, c.stdout).toBe(1);
    expect(warns[0]).toContain(KIT_ROUTE);
    expect(warns[0]).toContain(`(it leaves ${piHost().name} without a route to the Orchestrator)`);
    expect(c.stdout).not.toMatch(/FAILURE\(S\)/);
  });

  // Plan 34-33 (D-27 point 2): install's own stale template strands no host while AGENTS.md carries the route, so it
  // is an uncounted note that still names `Re-run install.js`; the remedy run still makes it ok. The intent (install's
  // own stale template that leaves Pi without a route FAILs) is kept by the variant below it.
  /** Stage the Pi template as an earlier install's copy, without the route. */
  const stageOldTemplate = (target: string): void => {
    const old = readFileSync(piFile(target), "utf8").replace(` ${KIT_ROUTE}`, "");
    writeFileSync(piFile(target), old);
    const markerPath = join(target, ...MARKER_REL.split("/"));
    const rewritten = withLedger(readMarkerObject(target), (entries) => {
      const e = entries.find((x) => x.kind === "file" && x.path === PI_PROMPT_REL);
      expect(e, "premise: the ledger records the Pi template").toBeDefined();
      (e as Record<string, unknown>).content = contentRecord(old);
    });
    writeFileSync(markerPath, JSON.stringify(rewritten, null, 2) + "\n");
  };

  it("install's own template from an earlier install, with no route: an uncounted note naming the file and `Re-run install.js`; the re-run makes it ok", () => {
    const { target, kitHome } = installed();
    stageOldTemplate(target);
    const c = spawnBin(INSTALL_JS, ["--check", "--strict"], target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    expect(routeLines(c.stdout).filter((l) => /^ {2}(WARN|FAIL)\s/.test(l)), c.stdout).toEqual([]);
    const notes = routeLines(c.stdout).filter((l) => l.startsWith("  note") && l.includes(PI_PROMPT_REL));
    expect(notes.length, c.stdout).toBe(1);
    // The remedy (DOC-1, plan 34-28): re-running install.js refreshes the template, and --check says ok.
    expect(notes[0]).toContain("Re-run install.js");
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    const after = check(target, kitHome);
    expect(after.status, after.stdout + after.stderr).toBe(0);
    expect(routeLines(after.stdout).filter((l) => l.startsWith("  ok") && l.includes(PI_PROMPT_REL)).length, after.stdout).toBe(1);
  });

  it("variant: install's own template and install's own AGENTS.md, both from an earlier install without the route: --check FAILs for the template, naming Pi and `Re-run install.js`; the re-run makes both ok", () => {
    const { target, kitHome } = installed();
    stageOldTemplate(target);
    stageEarlierFile(target, "AGENTS.md", staleOf(readFileSync(join(target, "AGENTS.md"), "utf8")));
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(1);
    const fails = routeLines(c.stdout).filter((l) => l.startsWith("  FAIL") && l.includes(PI_PROMPT_REL));
    expect(fails.length, c.stdout).toBe(1);
    expect(fails[0]).toContain("Re-run install.js");
    expect(fails[0]).toContain(`(it leaves ${piHost().name} without a route to the Orchestrator)`);
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    const after = check(target, kitHome);
    expect(after.status, after.stdout + after.stderr).toBe(0);
    for (const rel of [PI_PROMPT_REL, "AGENTS.md"]) {
      expect(routeLines(after.stdout).filter((l) => l.startsWith("  ok") && l.slice(17).startsWith(`kit route carried by ${rel} (read by `)).length, after.stdout).toBe(1);
    }
  });

  it("a route that does not resolve: --check FAILs naming the Orchestrator path under kitRoot", () => {
    const { target, kitHome } = installed();
    const { orchestrator } = followRoute(target);
    rmSync(orchestrator);
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(1);
    const fails = routeLines(c.stdout).filter((l) => l.startsWith("  FAIL") && l.includes(orchestrator));
    expect(fails.length, c.stdout).toBe(1);
  });

  it("the AGENTS.md install copies into an empty target carries KIT_ROUTE, and the route it names resolves", () => {
    const { target } = installed();
    const agents = readFileSync(join(target, "AGENTS.md"), "utf8");
    expect(agents.includes(KIT_ROUTE), "the installed AGENTS.md does not carry the kit route").toBe(true);
    const { kitRoot, orchestrator } = followRoute(target);
    expect(relative(target, kitRoot).startsWith(".."), `kitRoot is inside the target: ${kitRoot}`).toBe(true);
    expect(lstatSync(orchestrator).isFile(), `${orchestrator} is not a regular file`).toBe(true);
    // Every agent-factory/ path the route sentence itself names resolves under kitRoot.
    for (const p of backticked(KIT_ROUTE).filter(isPathToken).filter((t) => t.startsWith("agent-factory/"))) {
      const where = join(kitRoot, ...p.slice("agent-factory/".length).split("/"));
      expect(existsSync(where), `the route names \`${p}\`, which does not resolve (${where})`).toBe(true);
    }
  });

  // Plan 34-33 (D-27 point 2, WR-03): an absent template strands no host while AGENTS.md carries the route, so it is
  // an uncounted note; the variant keeps the intent (an absent template that leaves Pi without a route WARNs).
  it("an absent template: an uncounted note; --strict exit 0", () => {
    const { target, kitHome } = installed();
    rmSync(piFile(target));
    const c = spawnBin(INSTALL_JS, ["--check", "--strict"], target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    expect(routeLines(c.stdout).filter((l) => /^ {2}(WARN|FAIL)\s/.test(l)), c.stdout).toEqual([]);
    expect(routeLines(c.stdout).filter((l) => l.startsWith("  note") && l.includes(PI_PROMPT_REL)).length, c.stdout).toBe(1);
  });

  it("variant: an absent template while the user's own AGENTS.md has no route: --check WARNs that Pi has no /grugops template", () => {
    const { target, kitHome } = installedWithOwnAgents();
    rmSync(piFile(target));
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const warns = routeLines(c.stdout).filter((l) => l.startsWith("  WARN") && l.includes(PI_PROMPT_REL));
    expect(warns.length, c.stdout).toBe(1);
    expect(warns[0]).toContain(`(it leaves ${piHost().name} without a route to the Orchestrator)`);
  });
});

// ── THE REFRESH OF INSTALL'S OWN ROUTE CARRIERS (plan 34-28, D-26 point 2, closes deferred IN-03) ──────
//
// Every install made before plan 34-27 holds carriers with no route. A re-install replaces a carrier only
// when the previous install ledger's record still holds (install's own, unedited) and the text is not the
// current one; the new bytes are recorded, so uninstall still removes exactly what install wrote.
//
// THE STAGING IS THE TEST'S OWN. An earlier install is made by writing the stale bytes (the current text
// with ` ` + KIT_ROUTE removed) over the installed file and rewriting the marker's record for it with a
// sha256 this file computes itself (node:crypto), keeping the entry's `;mode=` suffix, so no code under
// test produces the record the refresh decision reads.

/** `sha256:<hex>` of `bytes`, computed here, independent of install-marker.ts. */
const sha256Of = (bytes: string | Buffer): string => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
/** The stale text of an earlier install: `text` with its one ` ` + KIT_ROUTE removed. */
function staleOf(text: string): string {
  expect(text.includes(` ${KIT_ROUTE}`), "premise: the current text carries the route after a space").toBe(true);
  return text.replace(` ${KIT_ROUTE}`, "");
}
/** Write `marker` back as install does (two-space indent, final newline). */
const writeMarkerObject = (target: string, marker: Record<string, unknown>): void =>
  writeFileSync(join(target, ...MARKER_REL.split("/")), JSON.stringify(marker, null, 2) + "\n");

/**
 * Make `rel` look like an earlier install's copy: `staleBytes` over the installed file, and the ledger's
 * `file` entry for rel set to the record of those bytes, keeping its `;mode=` suffix.
 */
function stageEarlierFile(target: string, rel: string, staleBytes: string): void {
  writeFileSync(join(target, ...rel.split("/")), staleBytes);
  writeMarkerObject(
    target,
    withLedger(readMarkerObject(target), (entries) => {
      const e = entries.find((x) => x.kind === "file" && x.path === rel);
      expect(e, `premise: the ledger records ${rel} as a file install created`).toBeDefined();
      const content = String((e as Record<string, unknown>).content);
      const at = content.indexOf(";mode=");
      (e as Record<string, unknown>).content = sha256Of(staleBytes) + (at === -1 ? "" : content.slice(at));
    }),
  );
}

/** The report lines of `stdout` under `label`: two-space indent, then the label as the first token. */
const linesUnder = (stdout: string, label: string): string[] =>
  stdout.split(/\r?\n/).filter((l) => l.startsWith("  ") && l.trim().split(/\s+/)[0] === label);
/** Whether some line under `label` names `rel` as its subject (the token after the label). */
const reports = (stdout: string, label: string, rel: string): boolean =>
  linesUnder(stdout, label).some((l) => l.trim().split(/\s+/)[1] === rel);

describe("kit route: a re-install refreshes install's own unedited route carriers, and nothing else (plan 34-28, D-26 point 2)", () => {
  it("the Pi template of an earlier install is refreshed: `refreshed`, the current bytes, the new record, and uninstall removes `.pi/`", () => {
    const { target, kitHome } = installed();
    const current = readFileSync(piFile(target), "utf8");
    stageEarlierFile(target, PI_PROMPT_REL, staleOf(current));
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(reports(again.stdout, "refreshed", PI_PROMPT_REL), again.stdout).toBe(true);
    const now = readFileSync(piFile(target), "utf8");
    expect(now.includes(KIT_ROUTE), "the refreshed template does not carry the route").toBe(true);
    expect(now).toBe(current);
    expect(fileRecords(readMarkerObject(target))[PI_PROMPT_REL]?.split(";")[0]).toBe(sha256Of(current));
    const u = runUninstall(target, kitHome);
    expect(u.status, u.stdout + u.stderr).toBe(0);
    expect(existsSync(join(target, ".pi")), u.stdout).toBe(false);
  });

  it("an AGENTS.md copy install created in an empty target is refreshed the same way, and uninstall removes it", () => {
    const { target, kitHome } = installed();
    const agents = join(target, "AGENTS.md");
    const current = readFileSync(agents, "utf8");
    expect(current).toBe(readFileSync(join(REPO_ROOT, "AGENTS.md"), "utf8"));
    stageEarlierFile(target, "AGENTS.md", staleOf(current));
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(reports(again.stdout, "refreshed", "AGENTS.md"), again.stdout).toBe(true);
    expect(readFileSync(agents, "utf8")).toBe(current);
    expect(fileRecords(readMarkerObject(target))["AGENTS.md"]?.split(";")[0]).toBe(sha256Of(current));
    const u = runUninstall(target, kitHome);
    expect(u.status, u.stdout + u.stderr).toBe(0);
    expect(existsSync(agents), u.stdout).toBe(false);
  });

  it("a template the user edited since install is never written: the re-install leaves its bytes and reports it skipped", () => {
    const { target, kitHome } = installed();
    const edited = staleOf(readFileSync(piFile(target), "utf8")) + "Also: run the gate first.\n";
    writeFileSync(piFile(target), edited);
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(reports(again.stdout, "skipped", PI_PROMPT_REL), again.stdout).toBe(true);
    expect(reports(again.stdout, "refreshed", PI_PROMPT_REL), again.stdout).toBe(false);
    expect(readFileSync(piFile(target), "utf8")).toBe(edited);
  });

  it("the user's own template, there before the first install, is never written and never claimed", () => {
    const { target, kitHome } = scratchRow();
    mkdirSync(join(target, ".pi", "prompts"), { recursive: true });
    const mine = "---\ndescription: my own grugops prompt\n---\nDo it my way: $ARGUMENTS\n";
    writeFileSync(piFile(target), mine);
    for (let i = 0; i < 2; i++) {
      const r = runInstall(target, kitHome);
      expect(r.status, r.stdout + r.stderr).toBe(0);
      expect(reports(r.stdout, "refreshed", PI_PROMPT_REL), r.stdout).toBe(false);
      expect(readFileSync(piFile(target), "utf8")).toBe(mine);
      expect(fileRecords(readMarkerObject(target))[PI_PROMPT_REL], "the user's template was claimed").toBeUndefined();
    }
  });

  it("a DRY_RUN re-install over an earlier install's template says `would-refresh` and writes nothing", () => {
    const { target, kitHome } = installed();
    const stale = staleOf(readFileSync(piFile(target), "utf8"));
    stageEarlierFile(target, PI_PROMPT_REL, stale);
    const markerBefore = readFileSync(join(target, ...MARKER_REL.split("/")), "utf8");
    const dry = runInstall(target, kitHome, [], { dryRun: true });
    expect(dry.status, dry.stdout + dry.stderr).toBe(0);
    expect(reports(dry.stdout, "would-refresh", PI_PROMPT_REL), dry.stdout).toBe(true);
    expect(reports(dry.stdout, "refreshed", PI_PROMPT_REL), dry.stdout).toBe(false);
    expect(readFileSync(piFile(target), "utf8")).toBe(stale);
    expect(readFileSync(join(target, ...MARKER_REL.split("/")), "utf8")).toBe(markerBefore);
  });

  it("a --symlink install's AGENTS.md link is never refreshed: a link is current by construction", () => {
    const { target, kitHome } = scratchRow();
    const first = runInstall(target, kitHome, ["--symlink"]);
    expect(first.status, first.stdout + first.stderr).toBe(0);
    const agents = join(target, "AGENTS.md");
    expect(lstatSync(agents).isSymbolicLink(), "premise: the --symlink install linked AGENTS.md").toBe(true);
    const linkBefore = readlinkSync(agents);
    const again = runInstall(target, kitHome, ["--symlink"]);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(reports(again.stdout, "refreshed", "AGENTS.md"), again.stdout).toBe(false);
    expect(lstatSync(agents).isSymbolicLink()).toBe(true);
    expect(readlinkSync(agents)).toBe(linkBefore);
  });
});

// ── THE BLOCK REFRESH: CLAUDE.md AND THE COPILOT POINTER (plan 34-28, D-26 points 1 and 2) ────────────
//
// The sentinels are spelled here, as uninstall-removal.test.ts and sentinel-block-record.test.ts spell
// them, so the test does not read them from the code under test.
const CLAUDE_OPEN = "<!-- GSD:grugops-start-here -->";
const CLAUDE_CLOSE = "<!-- GSD:grugops-start-here-end -->";
const COPILOT_OPEN = "<!-- GSD:grugops-copilot-start-here -->";
const COPILOT_CLOSE = "<!-- GSD:grugops-copilot-start-here-end -->";
const COPILOT_REL = ".github/copilot-instructions.md";

/** The one block-lines span of `text` (`<open>\n…\n<close>\n`, the open at a line start); the test's own finder. */
function blockLines(text: string, open: string, close: string): { start: number; end: number; lines: string } {
  const start = text.indexOf(`${open}\n`);
  expect(start, `premise: the file holds the ${open} block`).not.toBe(-1);
  expect(start === 0 || text[start - 1] === "\n", "premise: the open sentinel starts a line").toBe(true);
  const tail = `\n${close}\n`;
  const at = text.indexOf(tail, start);
  expect(at, `premise: the ${open} block is closed`).not.toBe(-1);
  const end = at + tail.length;
  return { start, end, lines: text.slice(start, end) };
}

/**
 * Make the block in `rel` look like an earlier install's: its lines become the current lines with
 * ` ` + KIT_ROUTE removed, the ledger's `block` entry the sha256 of those lines, and, when the ledger has a
 * `file` entry for rel (install created the file), that entry the record of the whole new file with its
 * `;mode=` suffix kept. Returns the staged file text.
 */
function stageEarlierBlock(target: string, rel: string, open: string, close: string): string {
  const path = join(target, ...rel.split("/"));
  const text = readFileSync(path, "utf8");
  const b = blockLines(text, open, close);
  const staleLines = b.lines.replace(` ${KIT_ROUTE}`, "");
  const staged = text.slice(0, b.start) + staleLines + text.slice(b.end);
  writeFileSync(path, staged);
  writeMarkerObject(
    target,
    withLedger(readMarkerObject(target), (entries) => {
      const blk = entries.find((x) => x.kind === "block" && x.path === rel);
      expect(blk, `premise: the ledger records the ${rel} block`).toBeDefined();
      (blk as Record<string, unknown>).block = sha256Of(staleLines);
      const file = entries.find((x) => x.kind === "file" && x.path === rel);
      if (file !== undefined) {
        const content = String((file as Record<string, unknown>).content);
        const at = content.indexOf(";mode=");
        (file as Record<string, unknown>).content = sha256Of(staged) + (at === -1 ? "" : content.slice(at));
      }
    }),
  );
  expect(staged.includes(KIT_ROUTE), "premise: the staged file carries no route").toBe(false);
  return staged;
}

/** The block entry and (when install created the file) the file entry for `rel` hold for the file as it is now. */
function blockAndFileHold(target: string, rel: string, open: string, close: string, created: boolean): void {
  const text = readFileSync(join(target, ...rel.split("/")), "utf8");
  const marker = readMarkerObject(target);
  expect(blockRecords(marker)[rel]?.block, `the ${rel} block entry does not hold`).toBe(sha256Of(blockLines(text, open, close).lines));
  const file = fileRecords(marker, false)[rel];
  if (created) expect(file?.split(";")[0], `the ${rel} file entry does not hold`).toBe(sha256Of(text));
  else expect(file, `${rel} is the user's file and must have no file entry`).toBeUndefined();
}

describe("kit route: a re-install refreshes install's own unedited CLAUDE.md and Copilot blocks (plan 34-28, D-26 points 1 and 2)", () => {
  it("a fresh install's CLAUDE.md block carries KIT_ROUTE", () => {
    const { target } = installed();
    const b = blockLines(readFileSync(join(target, "CLAUDE.md"), "utf8"), CLAUDE_OPEN, CLAUDE_CLOSE);
    expect(b.lines.includes(KIT_ROUTE), "the CLAUDE.md block does not carry the kit route").toBe(true);
  });

  it("CLAUDE.md that install created: refreshed, the block carries the route, both entries hold, and uninstall deletes CLAUDE.md", () => {
    const { target, kitHome } = installed();
    stageEarlierBlock(target, "CLAUDE.md", CLAUDE_OPEN, CLAUDE_CLOSE);
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(reports(again.stdout, "refreshed", "CLAUDE.md"), again.stdout).toBe(true);
    const text = readFileSync(join(target, "CLAUDE.md"), "utf8");
    expect(blockLines(text, CLAUDE_OPEN, CLAUDE_CLOSE).lines.includes(KIT_ROUTE)).toBe(true);
    blockAndFileHold(target, "CLAUDE.md", CLAUDE_OPEN, CLAUDE_CLOSE, true);
    const u = runUninstall(target, kitHome);
    expect(u.status, u.stdout + u.stderr).toBe(0);
    expect(existsSync(join(target, "CLAUDE.md")), u.stdout).toBe(false);
  });

  it("the user's own CLAUDE.md with install's block: refreshed, every user byte kept, and uninstall gives back the user's original bytes", () => {
    const { target, kitHome } = scratchRow();
    makeFixture(target);
    const original = readFileSync(join(target, "CLAUDE.md"));
    const first = runInstall(target, kitHome);
    expect(first.status, first.stdout + first.stderr).toBe(0);
    const staged = stageEarlierBlock(target, "CLAUDE.md", CLAUDE_OPEN, CLAUDE_CLOSE);
    const userPart = staged.slice(0, blockLines(staged, CLAUDE_OPEN, CLAUDE_CLOSE).start);
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(reports(again.stdout, "refreshed", "CLAUDE.md"), again.stdout).toBe(true);
    const text = readFileSync(join(target, "CLAUDE.md"), "utf8");
    expect(text.startsWith(userPart), "a user byte before the block changed").toBe(true);
    expect(blockLines(text, CLAUDE_OPEN, CLAUDE_CLOSE).lines.includes(KIT_ROUTE)).toBe(true);
    blockAndFileHold(target, "CLAUDE.md", CLAUDE_OPEN, CLAUDE_CLOSE, false);
    const u = runUninstall(target, kitHome);
    expect(u.status, u.stdout + u.stderr).toBe(0);
    expect(readFileSync(join(target, "CLAUDE.md")).equals(original), u.stdout).toBe(true);
  });

  it("the Copilot block in a file install created: refreshed, and uninstall removes the file", () => {
    const { target, kitHome } = installed();
    stageEarlierBlock(target, COPILOT_REL, COPILOT_OPEN, COPILOT_CLOSE);
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(reports(again.stdout, "refreshed", COPILOT_REL), again.stdout).toBe(true);
    const text = readFileSync(join(target, ...COPILOT_REL.split("/")), "utf8");
    expect(blockLines(text, COPILOT_OPEN, COPILOT_CLOSE).lines.includes(KIT_ROUTE)).toBe(true);
    blockAndFileHold(target, COPILOT_REL, COPILOT_OPEN, COPILOT_CLOSE, true);
    const u = runUninstall(target, kitHome);
    expect(u.status, u.stdout + u.stderr).toBe(0);
    expect(existsSync(join(target, ...COPILOT_REL.split("/"))), u.stdout).toBe(false);
  });

  it("a block the user edited (a line added inside it) is left byte-identical and reported skipped; uninstall leaves it", () => {
    const { target, kitHome } = scratchRow();
    makeFixture(target);
    expect(runInstall(target, kitHome).status).toBe(0);
    const staged = stageEarlierBlock(target, "CLAUDE.md", CLAUDE_OPEN, CLAUDE_CLOSE);
    const edited = staged.replace(`${CLAUDE_OPEN}\n`, `${CLAUDE_OPEN}\nMy own line inside the block.\n`);
    writeFileSync(join(target, "CLAUDE.md"), edited);
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(reports(again.stdout, "skipped", "CLAUDE.md"), again.stdout).toBe(true);
    expect(reports(again.stdout, "refreshed", "CLAUDE.md"), again.stdout).toBe(false);
    expect(readFileSync(join(target, "CLAUDE.md"), "utf8")).toBe(edited);
    const u = runUninstall(target, kitHome);
    expect([0, 3], u.stdout + u.stderr).toContain(u.status);
    expect(readFileSync(join(target, "CLAUDE.md"), "utf8")).toBe(edited);
  });

  it("two copies matching the recorded block: nothing is written", () => {
    const { target, kitHome } = scratchRow();
    makeFixture(target);
    expect(runInstall(target, kitHome).status).toBe(0);
    const staged = stageEarlierBlock(target, "CLAUDE.md", CLAUDE_OPEN, CLAUDE_CLOSE);
    const twice = staged + blockLines(staged, CLAUDE_OPEN, CLAUDE_CLOSE).lines;
    writeFileSync(join(target, "CLAUDE.md"), twice);
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(reports(again.stdout, "refreshed", "CLAUDE.md"), again.stdout).toBe(false);
    expect(readFileSync(join(target, "CLAUDE.md"), "utf8")).toBe(twice);
  });

  it("a DRY_RUN re-install over an earlier install's block says `would-refresh` and writes nothing", () => {
    const { target, kitHome } = installed();
    const staged = stageEarlierBlock(target, "CLAUDE.md", CLAUDE_OPEN, CLAUDE_CLOSE);
    const markerBefore = readFileSync(join(target, ...MARKER_REL.split("/")), "utf8");
    const dry = runInstall(target, kitHome, [], { dryRun: true });
    expect(dry.status, dry.stdout + dry.stderr).toBe(0);
    expect(reports(dry.stdout, "would-refresh", "CLAUDE.md"), dry.stdout).toBe(true);
    expect(readFileSync(join(target, "CLAUDE.md"), "utf8")).toBe(staged);
    expect(readFileSync(join(target, ...MARKER_REL.split("/")), "utf8")).toBe(markerBefore);
  });
});

// ── THE NOTE FOR A CARRIER INSTALL LEAVES WITHOUT THE ROUTE (plan 34-28, D-26 point 3; plan 34-33, D-27 point 2) ──
//
// Install's route-note pass (noteStrandingCarriers) runs once, after every carrier write, over the state the run
// leaves (under DRY_RUN, the state the real run would leave), and names a carrier only when it leaves some host
// without a route: the same strandedBy the doctor asks. The hosts are checked against the follower's own stranded
// derivation (strandedOf, below), computed from the files the real install left, which shares no code with
// strandedBy. A host's carriers are derived here from HOST_TOOLS and ROUTE_POINTERS (its entry files and its
// adapter kind's pointers), never typed and never taken from host-tools.ts routeCarriers. A row's launch file is not
// one of them (D-06, quick task 261018-hs8): a default session never reads it.
/** The launch agent of row `h`, read from the registry data (quick task 261018-hs8): [] when it has none. */
const launchOf = (h: (typeof HOST_TOOLS)[number]): string[] => (h.launchAgent === null ? [] : [h.launchAgent]);
const carriersOf = (h: (typeof HOST_TOOLS)[number]): string[] => [...new Set([...h.entryFiles, ...ROUTE_POINTERS[h.adapter]])];
/** The hosts a note for `rel` must name after an install into `target`: the follower's own stranded hosts. */
const notedHosts = (target: string, rel: string): string[] => strandedOf(target, rel);
/** The note lines naming `rel` as their subject. */
const notesFor = (stdout: string, rel: string): string[] => linesUnder(stdout, "note").filter((l) => l.trim().split(/\s+/)[1] === rel);
/** The install note lines about a route carrier (the subject token is one of the derived carriers). */
const routeNotes = (stdout: string): string[] => {
  const rels = new Set(HOST_TOOLS.flatMap(carriersOf));
  return linesUnder(stdout, "note").filter((l) => rels.has(l.trim().split(/\s+/)[1]));
};
/** The note's exact sentence for a carrier left as it is with no route in it (no "get" or "gets"). */
const noteSentence = (rel: string, hosts: readonly string[]): string =>
  `${rel} (left as it is, with no kit route in it: it leaves ${hosts.join(", ")} without a route to the kit after a scripted install; ` +
  `to give them one, add this sentence to it: "${KIT_ROUTE}")`;
/** The note for `rel` is the one sentence, naming exactly the follower's stranded hosts, in registry order. */
function expectRouteNote(stdout: string, target: string, rel: string): void {
  const hosts = notedHosts(target, rel);
  expect(hosts.length, `premise: ${rel} strands some host after the install`).toBeGreaterThan(0);
  const notes = notesFor(stdout, rel);
  expect(notes.length, stdout).toBe(1);
  expect(messageOf(notes[0]), "the note is not the one sentence naming exactly the stranded hosts, in registry order").toBe(noteSentence(rel, hosts));
}

/** A starting state for the note rows: built on a fresh scratch row (it may run a first install itself). */
interface NoteRow {
  readonly id: string;
  readonly what: string;
  readonly stage: (row: { target: string; kitHome: string }) => void;
  /** The carriers the install notes, in registry carrier order. */
  readonly notes: readonly string[];
  /** Extra checks on the real install's output and target. */
  readonly also?: (stdout: string, target: string) => void;
}
const OWN_AGENTS = "# My agents\n\nMy own instructions.\n";
const ownAgents = (row: { target: string }): void => writeFileSync(join(row.target, "AGENTS.md"), OWN_AGENTS);
/**
 * The shared agent skill (the one ROUTE_POINTERS pointer of the `agent-skill` kind), read from the registry data.
 * Since plan 34.1-03 (D-12, D-20) every registry row has an entry of its own beside AGENTS.md, so a user's AGENTS.md
 * without the route strands no host by itself. The cases that need AGENTS.md to strand a host make the user's own
 * agent skill without the route too: then the `agent-skill` rows read no carrier holding the route.
 */
const SHARED_SKILL_REL = ROUTE_POINTERS["agent-skill"][0];
const ownSkillWithoutRoute = (row: { target: string }): void => {
  const p = join(row.target, ...SHARED_SKILL_REL.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, "# My own skill\n\nMy own instructions.\n");
};
const ownPiTemplate = (row: { target: string }): void => {
  mkdirSync(join(row.target, ".pi", "prompts"), { recursive: true });
  writeFileSync(piFile(row.target), "---\ndescription: my own grugops prompt\n---\nDo it my way: $ARGUMENTS\n");
};
/** After a first install, a user edit removes the route from inside the block of `rel` (a block carrier). */
const dropRouteFromBlock = (row: { target: string; kitHome: string }, rel: string): void => {
  const first = runInstall(row.target, row.kitHome);
  expect(first.status, first.stdout + first.stderr).toBe(0);
  const path = join(row.target, ...rel.split("/"));
  const text = readFileSync(path, "utf8");
  expect(text.includes(` ${KIT_ROUTE}`), `premise: ${rel} carries the route`).toBe(true);
  writeFileSync(path, text.replace(` ${KIT_ROUTE}`, ""));
};
const NOTE_ROWS: readonly NoteRow[] = [
  // n1 and n9: notes ["AGENTS.md"] -> [] on 2026-10-11 (plan 34.1-03, D-12, D-20): AGENTS.md was the only carrier of
  // the `.gemini`-detected row; that row now reads the shared agent skill too, so the user's AGENTS.md without the
  // route strands no host and install prints no note for it (the counting rule). n11 keeps a row whose note is
  // AGENTS.md's, by making the shared agent skill the user's own without the route as well.
  {
    id: "n1",
    what: "the user's own AGENTS.md without the route, before install",
    stage: ownAgents,
    notes: [],
    also: (stdout, target) => expect(readFileSync(join(target, "AGENTS.md"), "utf8"), stdout).toBe(OWN_AGENTS),
  },
  {
    id: "n2",
    what: "R10, the install half: a user edit removes the route from the CLAUDE.md block, then re-install",
    stage: (row) => dropRouteFromBlock(row, "CLAUDE.md"),
    notes: [],
    also: (stdout) => expect(reports(stdout, "skipped", "CLAUDE.md"), stdout).toBe(true),
  },
  {
    id: "n3",
    what: "a Copilot block the user edited to drop the route, while AGENTS.md carries it, then re-install",
    stage: (row) => dropRouteFromBlock(row, COPILOT_REL),
    notes: [],
    also: (stdout) => expect(reports(stdout, "skipped", COPILOT_REL), stdout).toBe(true),
  },
  {
    id: "n4",
    what: "the user's own Pi template without the route and the user's own AGENTS.md without it, before install",
    stage: (row) => {
      ownAgents(row);
      ownPiTemplate(row);
    },
    notes: ["AGENTS.md", PI_PROMPT_REL],
  },
  {
    id: "n5",
    what: "the user's own Pi template without the route while install's AGENTS.md carries it, before install",
    stage: ownPiTemplate,
    notes: [],
  },
  {
    id: "n6",
    what: "the user's own AGENTS.md without the route, and a Copilot block the user edited to drop it, then re-install",
    stage: (row) => {
      ownAgents(row);
      dropRouteFromBlock(row, COPILOT_REL);
    },
    notes: ["AGENTS.md", COPILOT_REL],
  },
  {
    id: "n7",
    what: "every carrier an earlier install's stale copy, then re-install (each is refreshed)",
    stage: (row) => {
      const first = runInstall(row.target, row.kitHome);
      expect(first.status, first.stdout + first.stderr).toBe(0);
      stageAllEarlier(row.target);
    },
    notes: [],
  },
  { id: "n8", what: "a fresh install", stage: () => undefined, notes: [] },
  {
    id: "n9",
    what: "R10 with the user's own AGENTS.md without the route: a user edit removes the route from the CLAUDE.md block, then re-install (Claude Code keeps its adapter route)",
    stage: (row) => {
      ownAgents(row);
      dropRouteFromBlock(row, "CLAUDE.md");
    },
    notes: [],
    also: (stdout) => expect(reports(stdout, "skipped", "CLAUDE.md"), stdout).toBe(true),
  },
  {
    id: "n10",
    what: "(edge: empty, PI-02) a 0-byte Pi template that is not install's own, with the user's own AGENTS.md without the route, before install",
    stage: (row) => {
      ownAgents(row);
      mkdirSync(join(row.target, ".pi", "prompts"), { recursive: true });
      writeFileSync(piFile(row.target), "");
    },
    notes: ["AGENTS.md", PI_PROMPT_REL],
    also: (stdout, target) => expect(readFileSync(piFile(target)).length, stdout).toBe(0),
  },
  {
    id: "n11",
    what: "the user's own AGENTS.md and shared agent skill, both without the route, before install",
    stage: (row) => {
      ownAgents(row);
      ownSkillWithoutRoute(row);
    },
    notes: ["AGENTS.md", SHARED_SKILL_REL],
    also: (stdout, target) => expect(readFileSync(join(target, ...SHARED_SKILL_REL.split("/")), "utf8"), stdout).toBe("# My own skill\n\nMy own instructions.\n"),
  },
];
// 10 -> 11 on 2026-10-11 (plan 34.1-03): n11, see the note above n1.
const NOTE_ROWS_COUNT = 11;

describe("kit route: install notes a carrier exactly when it leaves a host without a route, as the doctor does (plan 34-33, D-27 point 2)", () => {
  it(`the rows cover ${NOTE_ROWS_COUNT} starting states, with and without a note`, () => {
    expect(NOTE_ROWS.length).toBe(NOTE_ROWS_COUNT);
    expect(new Set(NOTE_ROWS.map((r) => r.id)).size).toBe(NOTE_ROWS_COUNT);
    expect(NOTE_ROWS.filter((r) => r.notes.length > 0).length).toBeGreaterThan(0);
    expect(NOTE_ROWS.filter((r) => r.notes.length === 0).length).toBeGreaterThan(0);
  });

  for (const row of NOTE_ROWS) {
    it(`(${row.id}) ${row.what}: ${row.notes.length > 0 ? `one note each for ${row.notes.join(", ")}` : "no route note"}; the note's hosts are the follower's stranded hosts and the --check CANNOT hosts that read it; a DRY_RUN prints the same notes and writes nothing`, () => {
      // The same starting state, built twice: one for the real install, one for the DRY_RUN.
      const real = scratchRow();
      row.stage(real);
      const dry = scratchRow();
      row.stage(dry);
      const r = runInstall(real.target, real.kitHome);
      expect(r.status, r.stdout + r.stderr).toBe(0);
      const noted = HOST_TOOLS.flatMap(carriersOf).filter((rel, i, all) => all.indexOf(rel) === i && notesFor(r.stdout, rel).length > 0);
      expect(noted, r.stdout).toEqual([...row.notes]);
      for (const rel of row.notes) expectRouteNote(r.stdout, real.target, rel);
      for (const l of routeNotes(r.stdout)) expect(l, "a note makes a claim about how many hosts it names").not.toMatch(/\bgets? no route\b/);
      row.also?.(r.stdout, real.target);
      // AGREEMENT: for every carrier, the hosts its note names are exactly the hosts whose reach line in a --check
      // right after the install says CANNOT and which read that carrier here.
      const c = check(real.target, real.kitHome);
      const cannot = HOST_TOOLS.filter((h) => !reachVerdict(c.stdout, h).reaches);
      for (const rel of new Set(HOST_TOOLS.flatMap(carriersOf))) {
        const named = row.notes.includes(rel) ? notedHosts(real.target, rel) : [];
        const fromCheck = cannot.filter((h) => followerCarriers(h).includes(rel)).map((h) => h.name);
        expect(named, `${rel}: the note's hosts vs the --check CANNOT hosts that read it\n${r.stdout}\n${c.stdout}`).toEqual(fromCheck);
      }
      // DRY_RUN EQUALITY: the same route-note lines, and the target byte-identical.
      const before = snapshotTree(dry.target);
      const d = runInstall(dry.target, dry.kitHome, [], { dryRun: true });
      expect(d.status, d.stdout + d.stderr).toBe(0);
      expect(snapshotTree(dry.target), `the DRY_RUN changed the target\n${d.stdout}`).toBe(before);
      expect([...routeNotes(d.stdout)].sort(), `DRY_RUN route notes vs the real install's\n${d.stdout}`).toEqual([...routeNotes(r.stdout)].sort());
    });
  }
});

// ── --check SAYS, FOR EVERY HOST, WHETHER IT REACHES THE ORCHESTRATOR (plan 34-29, D-26 point 4, G-34-2) ──
//
// AGENTS.md's STOP rule sends the agent to `install.js --check`, which printed ALL CHECKS PASSED while Pi
// could not reach the Orchestrator. The doctor now asks every route carrier the registry derives and prints
// one `reach` line per HOST_TOOLS row, in registry order: `<host name>: reaches the Orchestrator through …`
// or `<host name>: CANNOT reach the Orchestrator: …`. The host names are read from HOST_TOOLS here, never
// typed, and the carriers a host reads are this file's own derivation (carriersOf, above).

/** The doctor's `reach` lines, in printed order. */
const reachLines = (stdout: string): string[] => stdout.split(/\r?\n/).filter((l) => /^ {2}reach\s/.test(l));
/** The message of a doctor line: the text after the padded label. */
const messageOf = (line: string): string => line.slice(2 + 14 + 1);
/** The doctor's verdict for `host`: the one reach line naming it, and whether it says the host reaches. */
function reachVerdict(stdout: string, host: (typeof HOST_TOOLS)[number]): { line: string; reaches: boolean } {
  const mine = reachLines(stdout).filter((l) => messageOf(l).startsWith(`${host.name}: `));
  expect(mine.length, `exactly one reach line for ${host.name}:\n${stdout}`).toBe(1);
  const rest = messageOf(mine[0]).slice(host.name.length + 2);
  const reaches = rest.startsWith("reaches the Orchestrator");
  expect(reaches || rest.startsWith("CANNOT reach the Orchestrator"), `an unparsable reach line: ${mine[0]}`).toBe(true);
  return { line: mine[0], reaches };
}
/** The counted doctor findings (FAIL and WARN lines) whose message is about the kit route. */
const countedRouteLines = (stdout: string): string[] => routeLines(stdout).filter((l) => /^ {2}(FAIL|WARN)\s/.test(l));

describe("kit route: --check prints, for every registry host, whether it reaches the Orchestrator (plan 34-29, D-26 point 4)", () => {
  it(`a fresh install with a separate kit home: ${HOST_TOOL_COUNT} reach lines in registry order, every host reaches, each line names its carriers; exit 0`, () => {
    expect(HOST_TOOLS.length, "premise: the registry pin").toBe(HOST_TOOL_COUNT);
    const { target, kitHome } = installed();
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const lines = reachLines(c.stdout);
    expect(lines.length, c.stdout).toBe(HOST_TOOL_COUNT);
    expect(lines.map((l) => messageOf(l).split(": ")[0])).toEqual(HOST_TOOLS.map((h) => h.name));
    for (const h of HOST_TOOLS) {
      const v = reachVerdict(c.stdout, h);
      expect(v.reaches, v.line).toBe(true);
      for (const rel of carriersOf(h)) expect(v.line, `the reach line does not name ${rel}`).toContain(rel);
    }
    expect(countedRouteLines(c.stdout), c.stdout).toEqual([]);
  });

  // Re-derived 2026-10-11 (plan 34.1-03, D-12, D-20): the hosts AGENTS.md strands are the follower's, never assumed
  // non-empty. Every registry row now has an entry of its own beside AGENTS.md, so they are none, and AGENTS.md's line
  // is an uncounted `note` that still carries the remedy (KIT_ROUTE). The next case keeps the counted arm.
  it("the user's own AGENTS.md without the route: the hosts it strands (derived) cannot reach, the others can; its line names KIT_ROUTE and is a WARN exactly when it strands a host; --strict exits 1 exactly then", () => {
    const { target, kitHome } = scratchRow();
    writeFileSync(join(target, "AGENTS.md"), "# My agents\n\nMy own instructions.\n");
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const stranded = notedHosts(target, "AGENTS.md");
    expect(reachLines(c.stdout).length, c.stdout).toBe(HOST_TOOL_COUNT);
    for (const h of HOST_TOOLS) {
      const v = reachVerdict(c.stdout, h);
      expect(v.reaches, v.line).toBe(!stranded.includes(h.name));
      if (!v.reaches) expect(v.line).toContain("AGENTS.md");
    }
    const line = carrierLines(c.stdout, "AGENTS.md");
    expect(line.length, c.stdout).toBe(1);
    expect(line[0].startsWith(stranded.length > 0 ? "  WARN" : "  note"), line[0]).toBe(true);
    expect(line[0]).toContain(KIT_ROUTE);
    expect(countedRouteLines(c.stdout), c.stdout).toEqual(stranded.length > 0 ? line : []);
    const strict = spawnBin(INSTALL_JS, ["--check", "--strict"], target, kitHome);
    expect(strict.status, strict.stdout + strict.stderr).toBe(stranded.length > 0 ? 1 : 0);
  });

  it("the user's own AGENTS.md and shared agent skill without the route: the agent-skill rows cannot reach, the others can; AGENTS.md and the skill each give one WARN naming KIT_ROUTE; exit 0, and 1 with --strict", () => {
    const { target, kitHome } = scratchRow();
    writeFileSync(join(target, "AGENTS.md"), "# My agents\n\nMy own instructions.\n");
    ownSkillWithoutRoute({ target });
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const stranded = notedHosts(target, "AGENTS.md");
    const skillRows = HOST_TOOLS.filter((h) => carriersOf(h).includes(SHARED_SKILL_REL)).map((h) => h.name);
    expect(stranded, "the hosts AGENTS.md strands are the agent-skill rows (derived)").toEqual(skillRows);
    expect(stranded.length, "premise: AGENTS.md strands some host").toBeGreaterThan(0);
    for (const h of HOST_TOOLS) expect(reachVerdict(c.stdout, h).reaches, reachVerdict(c.stdout, h).line).toBe(!stranded.includes(h.name));
    const warns = countedRouteLines(c.stdout);
    expect(warns.length, c.stdout).toBe(2);
    for (const rel of ["AGENTS.md", SHARED_SKILL_REL]) {
      const mine = warns.filter((l) => messageOf(l).startsWith(`kit route missing from ${rel} `));
      expect(mine.length, `${rel}\n${c.stdout}`).toBe(1);
      expect(mine[0].startsWith("  WARN"), mine[0]).toBe(true);
      expect(mine[0]).toContain(`(it leaves ${stranded.join(", ")} without a route to the Orchestrator)`);
      expect(mine[0]).toContain(KIT_ROUTE);
    }
    const strict = spawnBin(INSTALL_JS, ["--check", "--strict"], target, kitHome);
    expect(strict.status, strict.stdout + strict.stderr).toBe(1);
  });
});

// ── THE PER-HOST MATRIX: THE DOCTOR AGAINST AN INDEPENDENT FOLLOWER (plan 34-29, D-26 point 4, D-25, G-34-2) ──
//
// The class this closes: a checker that never asks the question its remedy depends on. For every scenario
// that broke or could break a host's route, and for every HOST_TOOLS host, the doctor's reach verdict must
// equal the verdict this file works out from the files alone.
//
// THE FOLLOWER SHARES NO CODE WITH THE DOCTOR. It reads the marker with readFileSync and JSON.parse, takes
// `kitRoot`, and asks statSync whether `<kitRoot>/roles/orchestrator.md` is a regular file. A host's carriers
// are carriersOf (this file's own derivation from HOST_TOOLS and ROUTE_POINTERS): every host reads every carrier
// of its row that is present (phase 34.1, D-12 deleted the one entry gate, Gemini CLI's AGENTS.md through
// `.gemini/settings.json`, and the follower's own Gemini rule with it); a carrier counts when its
// whole text contains KIT_ROUTE and the route resolves. A host whose adapter kind is `claude-kit` also reaches
// when the KIT= line inside the materialized block of `.claude/skills/grugops/SKILL.md` names a directory
// holding `roles/orchestrator.md`. "Own stale" is the follower's own ledger read: a `file` entry whose sha256
// equals the file's sha256 (node:crypto), or a `block` record equal to the sha256 of exactly one block span
// this file finds itself. The sentinels are spelled here (above, and the materialized-kit pair below).
const MAT_OPEN = "# <!-- grugops:materialized-kit -->";
const MAT_CLOSE = "# <!-- /grugops:materialized-kit -->";
const SKILL_REL = ".claude/skills/grugops/SKILL.md";
/** The carriers install writes as a sentinel block, with their sentinels (the test's own spelling). */
const BLOCK_SENTINELS: ReadonlyMap<string, { open: string; close: string }> = new Map([
  ["CLAUDE.md", { open: CLAUDE_OPEN, close: CLAUDE_CLOSE }],
  [COPILOT_REL, { open: COPILOT_OPEN, close: COPILOT_CLOSE }],
]);

/** Every block-lines span of `text`: an open line at a line start through the first `\n<close>\n` after it. */
function allBlockSpans(text: string, open: string, close: string): string[] {
  const out: string[] = [];
  for (let i = text.indexOf(`${open}\n`); i !== -1; i = text.indexOf(`${open}\n`, i + 1)) {
    if (i > 0 && text[i - 1] !== "\n") continue;
    const at = text.indexOf(`\n${close}\n`, i + open.length);
    if (at === -1) break;
    out.push(text.slice(i, at + close.length + 2));
  }
  return out;
}

/** The text of a regular file at `path`, or null when nothing readable as a regular file is there. */
function regularText(path: string): string | null {
  try {
    if (!statSync(path).isFile()) return null;
  } catch {
    return null;
  }
  return readFileSync(path, "utf8");
}

const isRegularFile = (path: string): boolean => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

interface Followed {
  /**
   * The agents the doctor speaks for, as the follower reads them itself (plan 34.1-10, D-07; plan 34.1-15, D-26 IN-21):
   * the registry rows named by the marker's `agents` field, read with JSON.parse here (never install-marker.ts
   * installedAgents), in registry order, that have something installed here: an entry of the marker's ledger (read
   * with JSON.parse) that records content install wrote and that the row owns (host-tools.ts entryOwners), or a
   * present entry path (an lstat of each ROUTE_POINTERS path of its adapter kind). Reach, reads and stranded hosts are
   * about these rows only.
   */
  readonly installed: readonly (typeof HOST_TOOLS)[number][];
  /** The route carriers the installed agents read (carriersOf over `installed`, first-seen registry order). */
  readonly installedCarriers: readonly string[];
  /** Whether `<kitRoot>/roles/orchestrator.md` is a regular file. */
  readonly routeResolves: boolean;
  /** The carriers without the route that the ledger still records as install's own, unedited. */
  readonly ownStale: readonly string[];
  /** installed host id → whether the host reaches the Orchestrator (no entry for an agent not installed). */
  readonly reaches: ReadonlyMap<string, boolean>;
  /** carrier → whether its whole text (a regular file) contains KIT_ROUTE (plan 34-33). */
  readonly carries: ReadonlyMap<string, boolean>;
  /** Whether the SKILL.md KIT= line names a directory holding roles/orchestrator.md (plan 34-33). */
  readonly adapterReaches: boolean;
}

/** The carriers `h` reads, by the follower's own rule: every carrier of its row (carriersOf). */
const followerCarriers = (h: (typeof HOST_TOOLS)[number]): string[] => carriersOf(h);

/**
 * The follower's own rule for "a ledger entry that records content install wrote" (phase 34.1 D-26, IN-21), spelled
 * here from the entry shapes, never from install-marker.ts entryHolds: a file, block or opencode-permission entry; an
 * ask-rules entry that added a rule or created the file or one of its objects; a gemini entry that added the entry or
 * created the file. Directory and backup entries never count.
 */
function followerHolds(e: Record<string, unknown>): boolean {
  if (e.kind === "file" || e.kind === "block" || e.kind === "opencode-permission") return true;
  if (e.kind === "ask-rules") return (Array.isArray(e.added) && e.added.length > 0) || e.createdFile === true || e.createdPermissions === true || e.createdAsk === true;
  if (e.kind === "gemini") return e.addedEntry === true || e.createdFile === true;
  return false;
}
/** Whether something is at `path` (an lstat; a link is not followed, a special file counts). */
const lstatPresent = (path: string): boolean => {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
};
/**
 * Whether the follower counts registry row `h` as having something installed in `target`: it owns (entryOwners) a
 * ledger entry that followerHolds, or one of its entry paths (its kind's ROUTE_POINTERS, then its row's launchAgent)
 * is present. A marker whose `ledger` is not a
 * list contributes no entry.
 */
function hasSomethingInstalled(target: string, marker: Record<string, unknown>, h: (typeof HOST_TOOLS)[number]): boolean {
  const ledger = Array.isArray(marker.ledger) ? (marker.ledger as unknown[]) : [];
  const owns = ledger.some(
    (e) =>
      e !== null && typeof e === "object" && typeof (e as Record<string, unknown>).path === "string" && typeof (e as Record<string, unknown>).kind === "string" &&
      followerHolds(e as Record<string, unknown>) && entryOwners(e as { path: string; kind: string }).includes(h.id),
  );
  return owns || [...ROUTE_POINTERS[h.adapter], ...launchOf(h)].some((rel) => lstatPresent(join(target, ...rel.split("/"))));
}

/** THE INDEPENDENT FOLLOWER: per host, from the files alone. */
function follow(target: string): Followed {
  const marker = JSON.parse(readFileSync(join(target, ...MARKER_REL.split("/")), "utf8")) as Record<string, unknown>;
  const agents = marker.agents;
  expect(Array.isArray(agents) && agents.every((a) => typeof a === "string"), `premise: the marker records the installed agents (${JSON.stringify(agents)})`).toBe(true);
  const installed = HOST_TOOLS.filter((h) => (agents as string[]).includes(h.id) && hasSomethingInstalled(target, marker, h));
  const installedCarriers = [...new Set(installed.flatMap(carriersOf))];
  const kitRoot = typeof marker.kitRoot === "string" ? marker.kitRoot : "";
  const routeResolves = kitRoot !== "" && isRegularFile(join(kitRoot, "roles", "orchestrator.md"));
  const files = fileRecords(marker);
  const blocks = blockRecords(marker);
  const carries = new Map<string, boolean>();
  const ownStale: string[] = [];
  for (const rel of new Set(HOST_TOOLS.flatMap(carriersOf))) {
    const text = regularText(join(target, ...rel.split("/")));
    carries.set(rel, text !== null && text.includes(KIT_ROUTE));
    if (text === null || text.includes(KIT_ROUTE)) continue;
    const s = BLOCK_SENTINELS.get(rel);
    const own =
      s === undefined
        ? files[rel] !== undefined && files[rel].split(";")[0] === sha256Of(readFileSync(join(target, ...rel.split("/"))))
        : blocks[rel] !== undefined && allBlockSpans(text, s.open, s.close).filter((sp) => sha256Of(sp) === blocks[rel].block).length === 1;
    if (own) ownStale.push(rel);
  }
  // The Claude Code adapters' KIT= line, read from the materialized block of the skill adapter.
  let kitLine = "";
  const skill = regularText(join(target, ...SKILL_REL.split("/")));
  if (skill !== null) {
    let inBlock = false;
    for (const l of skill.split("\n")) {
      if (l === MAT_OPEN) inBlock = true;
      else if (l === MAT_CLOSE) inBlock = false;
      else if (inBlock && l.startsWith('KIT="')) kitLine = l.slice('KIT="'.length, l.endsWith('"') ? -1 : undefined);
    }
  }
  const adapterReaches = kitLine !== "" && isRegularFile(join(kitLine, "roles", "orchestrator.md"));
  const reaches = new Map<string, boolean>();
  for (const h of installed) {
    const viaCarrier = routeResolves && followerCarriers(h).some((rel) => carries.get(rel) === true);
    reaches.set(h.id, viaCarrier || (h.adapter === "claude-kit" && adapterReaches));
  }
  return { installed, installedCarriers, routeResolves, ownStale, reaches, carries, adapterReaches };
}

/** Every path the pointer carriers install writes name (ROUTE_POINTERS and each row's launchAgent; a block's own lines) and KIT_ROUTE names. */
function expectNamedPathsExist(target: string): void {
  const { kitRoot, orchestrator } = followRoute(target);
  expect(lstatSync(orchestrator).isFile(), `${orchestrator} is not a regular file`).toBe(true);
  const texts: Array<[string, string]> = [["KIT_ROUTE", KIT_ROUTE]];
  for (const rel of new Set([...Object.values(ROUTE_POINTERS).flat(), ...HOST_TOOLS.flatMap(launchOf)])) {
    const text = readFileSync(join(target, ...rel.split("/")), "utf8");
    const s = BLOCK_SENTINELS.get(rel);
    texts.push([rel, s === undefined ? text : blockLines(text, s.open, s.close).lines]);
  }
  let named = 0;
  for (const [what, text] of texts) {
    for (const p of backticked(text).filter(isPathToken)) {
      named += 1;
      const where = p.startsWith("agent-factory/") ? join(kitRoot, ...p.slice("agent-factory/".length).split("/")) : join(target, ...p.split("/"));
      expect(existsSync(where), `${what} names \`${p}\`, which does not exist (${where})`).toBe(true);
    }
  }
  // Vacuity floor: the in-repository paths the plan names are among them, in every pointer.
  expect(named).toBeGreaterThanOrEqual(texts.length * 2);
  for (const [what, text] of texts.slice(1)) {
    expect(backticked(text), `${what} names AGENTS.md`).toContain("AGENTS.md");
    expect(backticked(text), `${what} names the marker`).toContain(".grugops/install.json");
  }
}

interface Scenario {
  readonly name: string;
  /** Build the scenario; returns the target and kit home `--check` runs against. */
  readonly build: () => { target: string; kitHome: string };
  /** The doctor's expected exit status. */
  readonly exit: 0 | 1;
  /** Whether every path the carriers name is asserted to exist (after a clean install). */
  readonly pathsExist: boolean;
  /** The carriers without the route that leave no host without one: one uncounted note each (plan 34-33). */
  readonly uncounted: readonly string[];
}

/** Stage every route carrier as an earlier install's copy, without the route (S3). */
function stageAllEarlier(target: string): void {
  stageEarlierFile(target, "AGENTS.md", staleOf(readFileSync(join(target, "AGENTS.md"), "utf8")));
  stageEarlierFile(target, PI_PROMPT_REL, staleOf(readFileSync(piFile(target), "utf8")));
  stageEarlierBlock(target, "CLAUDE.md", CLAUDE_OPEN, CLAUDE_CLOSE);
  stageEarlierBlock(target, COPILOT_REL, COPILOT_OPEN, COPILOT_CLOSE);
}

const SCENARIOS: readonly Scenario[] = [
  { name: "S1 a fresh install", build: installed, exit: 0, pathsExist: true, uncounted: [] },
  {
    name: "S2 the user's own AGENTS.md without the route",
    build: () => {
      const row = scratchRow();
      writeFileSync(join(row.target, "AGENTS.md"), "# My agents\n\nMy own instructions.\n");
      expect(runInstall(row.target, row.kitHome).status).toBe(0);
      return row;
    },
    exit: 0,
    pathsExist: false,
    // [] -> ["AGENTS.md"] on 2026-10-11 (plan 34.1-03, D-12, D-20): every host has an entry of its own beside
    // AGENTS.md now, so AGENTS.md without the route strands no host and is an uncounted note.
    uncounted: ["AGENTS.md"],
  },
  {
    name: "S3 every carrier an earlier install's stale copy, before re-install",
    build: () => {
      const row = installed();
      stageAllEarlier(row.target);
      return row;
    },
    exit: 1,
    pathsExist: false,
    uncounted: ["CLAUDE.md"],
  },
  {
    name: "S4 the same after re-install",
    build: () => {
      const row = installed();
      stageAllEarlier(row.target);
      const again = runInstall(row.target, row.kitHome);
      expect(again.status, again.stdout + again.stderr).toBe(0);
      return row;
    },
    exit: 0,
    pathsExist: true,
    uncounted: [],
  },
  {
    name: "S5 the Pi template edited by the user, without the route",
    build: () => {
      const row = installed();
      writeFileSync(piFile(row.target), staleOf(readFileSync(piFile(row.target), "utf8")) + "Also: run the gate first.\n");
      return row;
    },
    exit: 0,
    pathsExist: false,
    uncounted: [PI_PROMPT_REL],
  },
  {
    name: "S6 the marker's kitRoot changed to an empty scratch directory",
    build: () => {
      const row = installed();
      const empty = join(ROOT, `empty${n++}`);
      mkdirSync(empty);
      writeMarkerObject(row.target, { ...readMarkerObject(row.target), kitRoot: empty });
      return row;
    },
    exit: 1,
    pathsExist: false,
    uncounted: [],
  },
  {
    name: "S7 the Pi template deleted",
    build: () => {
      const row = installed();
      rmSync(piFile(row.target));
      return row;
    },
    exit: 0,
    pathsExist: false,
    uncounted: [PI_PROMPT_REL],
  },
];

describe("kit route: --check and an independent follower agree, host by host, on who reaches the Orchestrator (plan 34-29, D-26, G-34-2)", () => {
  it(`the matrix covers 7 scenarios and ${HOST_TOOL_COUNT} registry hosts`, () => {
    expect(SCENARIOS.length).toBe(7);
    expect(HOST_TOOLS.length).toBe(HOST_TOOL_COUNT);
  });

  for (const sc of SCENARIOS) {
    it(`${sc.name}: every host's reach verdict equals the follower's; a stranded host has a counted finding; a route FAIL exactly on an own-stale carrier that strands a host, or an unresolved route; uncounted ${sc.uncounted.join(", ") || "none"}; exit ${sc.exit}`, () => {
      const { target, kitHome } = sc.build();
      const followed = follow(target);
      const c = check(target, kitHome);
      expect(c.status, c.stdout + c.stderr).toBe(sc.exit);
      expect(reachLines(c.stdout).length, c.stdout).toBe(HOST_TOOL_COUNT);
      expect(reachLines(c.stdout).map((l) => messageOf(l).split(": ")[0])).toEqual(HOST_TOOLS.map((h) => h.name));
      const counted = countedRouteLines(c.stdout);
      for (const h of HOST_TOOLS) {
        const v = reachVerdict(c.stdout, h);
        expect(v.reaches, `${h.name}: the doctor and the follower disagree\n${v.line}`).toBe(followed.reaches.get(h.id));
        if (!followed.reaches.get(h.id)) {
          const behind = counted.filter((l) => carriersOf(h).some((rel) => messageOf(l).includes(` ${rel} `)) || (!followed.routeResolves && l.startsWith("  FAIL")));
          expect(behind.length, `${h.name} cannot reach, and no counted WARN or FAIL is behind it\n${c.stdout}`).toBeGreaterThan(0);
        }
      }
      // VERDICT-1 (plan 34-33): a counted kit-route finding exists exactly when some host cannot reach.
      expect(counted.length > 0, `counted kit-route lines vs hosts that cannot reach\n${c.stdout}`).toBe(HOST_TOOLS.some((h) => !followed.reaches.get(h.id)));
      // D-27 point 2: a FAIL exactly for an own-stale carrier the follower says leaves a host without a route, or an
      // unresolved route.
      const routeFails = counted.filter((l) => l.startsWith("  FAIL"));
      const strandingStale = followed.ownStale.filter((rel) => strandedOf(target, rel).length > 0);
      const expectFail = strandingStale.length > 0 || !followed.routeResolves;
      expect(routeFails.length > 0, `route FAIL lines vs the follower (own stale that strands: ${strandingStale.join(", ") || "none"}; route resolves: ${followed.routeResolves})\n${c.stdout}`).toBe(expectFail);
      for (const rel of followed.ownStale) {
        expect(routeFails.filter((l) => messageOf(l).startsWith(`kit route missing from ${rel} `)).length, `FAILs for install's own stale ${rel}\n${c.stdout}`).toBe(strandingStale.includes(rel) ? 1 : 0);
      }
      // Every carrier without the route: counted exactly when the follower says it strands a host, else one note.
      const uncounted: string[] = [];
      for (const rel of new Set(HOST_TOOLS.flatMap(carriersOf))) {
        if (followed.carries.get(rel) === true) continue;
        const mine = carrierLines(c.stdout, rel);
        const stranded = strandedOf(target, rel);
        expect(mine.filter((l) => /^ {2}(WARN|FAIL)\s/.test(l)).length, `${rel}: counted lines vs the follower's stranded hosts (${stranded.join(", ") || "none"})\n${c.stdout}`).toBe(stranded.length > 0 ? 1 : 0);
        expect(mine.filter((l) => l.startsWith("  note")).length, `${rel}: note lines\n${c.stdout}`).toBe(stranded.length > 0 ? 0 : 1);
        if (stranded.length === 0) uncounted.push(rel);
        else expect(mine.join("\n")).toContain(`(it leaves ${stranded.join(", ")} without a route to the Orchestrator)`);
      }
      expect(uncounted, `the scenario's declared uncounted carriers`).toEqual([...sc.uncounted]);
      if (sc.pathsExist) expectNamedPathsExist(target);
    });
  }
});

// ── ONE DERIVATION OF THE HOSTS A CARRIER STRANDS (plan 34-33, D-27 point 2; WR-02, WR-03; VERDICT-1, AUTH-1) ──
//
// A carrier without the route is counted only when it leaves some host without a route: a host that reads it
// here, reads no other carrier holding the route, and has no adapter route. Otherwise it is an uncounted `note`
// line. The stranded hosts are the follower's own (strandedOf below), from carriersOf, the carriers' text and the SKILL.md KIT= line: no code is shared with host-tools.ts strandedBy.

/** The follower's own answer to "which hosts does `rel` leave without a route here", in registry order. */
function strandedOf(target: string, rel: string): string[] {
  const f = follow(target);
  if (f.carries.get(rel) === true) return [];
  // Among the agents installed in the target only (plan 34.1-10, D-07).
  return f.installed.filter((h) => {
    const mine = followerCarriers(h);
    if (!mine.includes(rel)) return false;
    return !mine.some((c) => f.carries.get(c) === true) && !(h.adapter === "claude-kit" && f.adapterReaches);
  }).map((h) => h.name);
}
/** The doctor's `note` lines about carrier `rel` (`kit route: <rel> …`). */
const carrierNotes = (stdout: string, rel: string): string[] =>
  linesUnder(stdout, "note").filter((l) => messageOf(l).startsWith(`kit route: ${rel} `));
/** The doctor's lines (any label) about carrier `rel`: its carrier line, whatever its label. */
const carrierLines = (stdout: string, rel: string): string[] =>
  routeLines(stdout).filter((l) => messageOf(l).startsWith(`kit route: ${rel} `) || messageOf(l).startsWith(`kit route missing from ${rel} `) || messageOf(l).startsWith(`kit route carried by ${rel} `));
const strictCheck = (target: string, kitHome: string): Run => spawnBin(INSTALL_JS, ["--check", "--strict"], target, kitHome);

describe("kit route: one derivation of the hosts a carrier strands (plan 34-33, D-27 point 2)", () => {
  it("R9: the Copilot pointer and the Pi template deleted after a clean install: two uncounted notes, every host reaches, no counted kit-route line; --strict exit 0", () => {
    const { target, kitHome } = installed();
    rmSync(join(target, ...COPILOT_REL.split("/")));
    rmSync(piFile(target));
    for (const rel of [COPILOT_REL, PI_PROMPT_REL]) expect(strandedOf(target, rel), `premise: the follower says ${rel} strands nobody`).toEqual([]);
    const c = strictCheck(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    expect(c.stdout).toContain("ALL CHECKS PASSED");
    for (const h of HOST_TOOLS) expect(reachVerdict(c.stdout, h).reaches, reachVerdict(c.stdout, h).line).toBe(true);
    expect(countedRouteLines(c.stdout), c.stdout).toEqual([]);
    for (const rel of [COPILOT_REL, PI_PROMPT_REL]) {
      const notes = carrierNotes(c.stdout, rel);
      expect(notes.length, c.stdout).toBe(1);
      expect(notes[0]).toContain("is not present");
      expect(notes[0]).toContain("no host is left without a route by it");
      // It names how each host that reads it here reaches: through AGENTS.md, which carries the route.
      for (const h of HOST_TOOLS.filter((x) => carriersOf(x).includes(rel))) expect(notes[0], `${rel}: ${h.name} not named`).toContain(`${h.name} through AGENTS.md`);
    }
  });

  it("R10, the doctor half: a user edit drops the route from the CLAUDE.md block: one uncounted note for CLAUDE.md, Claude Code reaches through AGENTS.md and its adapters' KIT= line; --strict exit 0", () => {
    const { target, kitHome } = installed();
    const claude = join(target, "CLAUDE.md");
    writeFileSync(claude, readFileSync(claude, "utf8").replace(` ${KIT_ROUTE}`, ""));
    expect(readFileSync(claude, "utf8").includes(KIT_ROUTE), "premise: the edit removed the route").toBe(false);
    expect(strandedOf(target, "CLAUDE.md"), "premise: the follower says CLAUDE.md strands nobody").toEqual([]);
    const c = strictCheck(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    expect(countedRouteLines(c.stdout), c.stdout).toEqual([]);
    const notes = carrierNotes(c.stdout, "CLAUDE.md");
    expect(notes.length, c.stdout).toBe(1);
    expect(notes[0]).toContain(KIT_ROUTE);
    const claudeHost = HOST_TOOLS.filter((h) => h.adapter === "claude-kit");
    expect(claudeHost.length, "premise: one claude-kit host").toBe(1);
    const v = reachVerdict(c.stdout, claudeHost[0]);
    expect(v.reaches, v.line).toBe(true);
    expect(v.line).toContain("AGENTS.md");
    expect(v.line).toContain("its adapters' KIT= line");
  });

  // Plan 34.1-03 (D-12, D-20): AGENTS.md strands a host only together with the shared agent skill, so the case makes
  // the user's own skill without the route too; AGENTS.md and the skill are then the counted lines, CLAUDE.md is not.
  it("R10 with the user's own AGENTS.md and agent skill without the route: CLAUDE.md is still an uncounted note, because Claude Code's adapters give the route; AGENTS.md and the skill are the counted WARNs", () => {
    const { target, kitHome } = installedWithOwnAgents();
    ownSkillWithoutRoute({ target });
    const claude = join(target, "CLAUDE.md");
    writeFileSync(claude, readFileSync(claude, "utf8").replace(` ${KIT_ROUTE}`, ""));
    expect(readFileSync(claude, "utf8").includes(KIT_ROUTE), "premise: the edit removed the route").toBe(false);
    expect(strandedOf(target, "CLAUDE.md"), "premise: the follower says CLAUDE.md strands nobody (the adapter route)").toEqual([]);
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    expect(carrierNotes(c.stdout, "CLAUDE.md").length, c.stdout).toBe(1);
    const counted = countedRouteLines(c.stdout);
    expect(counted.length, c.stdout).toBe(2);
    expect(messageOf(counted[0]).startsWith("kit route missing from AGENTS.md "), counted[0]).toBe(true);
    expect(messageOf(counted[1]).startsWith(`kit route missing from ${SHARED_SKILL_REL} `), counted[1]).toBe(true);
    const claudeHost = HOST_TOOLS.filter((h) => h.adapter === "claude-kit")[0];
    const v = reachVerdict(c.stdout, claudeHost);
    expect(v.reaches, v.line).toBe(true);
    expect(v.line).toContain("its adapters' KIT= line");
    expect(v.line).not.toContain("AGENTS.md");
  });

  // Plan 34.1-03 (D-12, D-20): AGENTS.md strands a host only together with the shared agent skill now; the case makes
  // the user's own skill without the route too, and asks AGENTS.md's one counted WARN.
  it("the user's own AGENTS.md (and agent skill) without the route still gives one counted WARN naming AGENTS.md and exactly the stranded hosts; --strict exit 1", () => {
    const { target, kitHome } = scratchRow();
    writeFileSync(join(target, "AGENTS.md"), "# My agents\n\nMy own instructions.\n");
    ownSkillWithoutRoute({ target });
    expect(runInstall(target, kitHome).status).toBe(0);
    const stranded = strandedOf(target, "AGENTS.md");
    expect(stranded.length, "premise: AGENTS.md strands some host").toBeGreaterThan(0);
    const c = strictCheck(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(1);
    const counted = countedRouteLines(c.stdout).filter((l) => messageOf(l).startsWith("kit route missing from AGENTS.md "));
    expect(counted.length, c.stdout).toBe(1);
    expect(counted[0].startsWith("  WARN"), counted[0]).toBe(true);
    expect(counted[0]).toContain(`(it leaves ${stranded.join(", ")} without a route to the Orchestrator)`);
    expect(countedRouteLines(c.stdout).length, "every counted line is about a carrier that strands a host").toBe(
      allCarriers().filter((rel) => strandedOf(target, rel).length > 0).length,
    );
    for (const h of HOST_TOOLS) expect(reachVerdict(c.stdout, h).reaches, reachVerdict(c.stdout, h).line).toBe(!stranded.includes(h.name));
  });
});

// ── ONE REFRESHABLE PREDICATE DECIDES REFRESH FOR INSTALL AND THE DOCTOR (plan 34-34, D-27 point 3; WR-01; AUTH-1, VERDICT-1) ──
//
// Before plan 34-34 the doctor called a carrier "install's own, stale" on owns alone and told the user to re-run
// install.js, while install refreshes only when more holds: a `sha256:` file record (not a link record), a regular
// file at the path (readForWrite `ok`: not a link, not a hard link) and a readable kit text. On a link the remedy was
// false and the FAIL never cleared (WR-01). Every row here runs the doctor, then a re-install, then the doctor again,
// and asserts the agreement: the doctor names `Re-run install.js` for a carrier exactly when the re-install reports
// `refreshed` or `created` for it.

/** The install's `verify` lines whose subject is `rel` (the token after the label, with or without a trailing colon). */
const verifiesFor = (stdout: string, rel: string): string[] =>
  linesUnder(stdout, "verify").filter((l) => {
    const t = l.trim().split(/\s+/)[1];
    return t === rel || t === `${rel}:`;
  });
/** The re-install wrote `rel`: a `refreshed` or `created` line names it. */
const installWrote = (stdout: string, rel: string): boolean => reports(stdout, "refreshed", rel) || reports(stdout, "created", rel);
/** The doctor named `Re-run install.js` on a line about carrier `rel`. */
const rerunNamed = (stdout: string, rel: string): boolean => carrierLines(stdout, rel).some((l) => l.includes("Re-run install.js"));

/** Every route carrier, derived from HOST_TOOLS and ROUTE_POINTERS (carriersOf), never typed. */
const allCarriers = (): string[] => [...new Set(HOST_TOOLS.flatMap(carriersOf))];

/**
 * Doctor, re-install (with `args`), doctor. For every route carrier (derived, count asserted non-zero), the doctor's
 * `Re-run install.js` on a line about it appears exactly when the re-install reports `refreshed` or `created` for it;
 * `rel` is the carrier the row is about, which must be among them.
 */
function doctorInstallDoctor(row: { target: string; kitHome: string }, rel: string, args: readonly string[] = []): { before: Run; again: Run; after: Run } {
  const before = check(row.target, row.kitHome);
  const again = runInstall(row.target, row.kitHome, [...args]);
  const after = check(row.target, row.kitHome);
  const carriers = allCarriers();
  expect(carriers.length, "premise: the registry derives some route carrier").toBeGreaterThan(0);
  expect(carriers, `premise: ${rel} is a route carrier`).toContain(rel);
  for (const c of carriers) {
    expect(
      rerunNamed(before.stdout, c),
      `the doctor and install disagree on ${c}.\n--check said:\n${carrierLines(before.stdout, c).join("\n")}\nthe re-install said:\n${again.stdout}`,
    ).toBe(installWrote(again.stdout, c));
  }
  return { before, again, after };
}

/**
 * Point the link install made at `rel` to `to` instead, and set install's ledger record for it to the record of the new
 * link: the record install wrote, with its link target replaced (the record format is read from the ledger, never typed).
 */
function relinkOwn(target: string, rel: string, to: string): void {
  const path = join(target, ...rel.split("/"));
  expect(lstatSync(path).isSymbolicLink(), `premise: ${rel} is a link`).toBe(true);
  const old = readlinkSync(path);
  rmSync(path);
  symlinkSync(to, path);
  writeMarkerObject(
    target,
    withLedger(readMarkerObject(target), (entries) => {
      const e = entries.find((x) => x.kind === "file" && x.path === rel);
      expect(e, `premise: the ledger records ${rel} as a file install created`).toBeDefined();
      const content = String((e as Record<string, unknown>).content);
      expect(content.includes(old), `premise: install's record for ${rel} names the link's target`).toBe(true);
      (e as Record<string, unknown>).content = content.split(old).join(to);
    }),
  );
}

/**
 * The reason and the remedy the doctor and install give for a link a --symlink install made (phase 34.1, D-16, WR-16),
 * and the by-hand remedy for any other carrier without the route (D-17, IN-17). Spelled here, from the decisions, never
 * imported from the product.
 */
const LINK_OWN_REASON = "it is a link a --symlink install made";
const linkOwnRemedy = (rel: string): string => `Remove the link at ${rel} and re-run install.js, which links or copies the current kit ${rel}`;
const BY_HAND_REMEDY = "Add this sentence (after the start-here sentence, if the file has one):";

/** Move the file at `rel` out of the target and put a link to it in its place; returns where it now is. */
function moveOutAndLink(target: string, rel: string): string {
  const path = join(target, ...rel.split("/"));
  const out = join(dirname(target), `elsewhere-${rel.replace(/[/.]/g, "_")}`);
  renameSync(path, out);
  symlinkSync(out, path);
  return out;
}

describe("kit route: one refreshable predicate decides refresh for install and the doctor (plan 34-34, D-27 point 3)", () => {
  it("WR-01 (re-pointed by phase 34.1 D-16): AGENTS.md is a link install made, now to a file holding an earlier install's text with no route, and the link record matches it: a WARN with linkOwnership's reason and remedy, no `Re-run install.js`; the re-install verifies with the same reason and remedy and refreshes nothing; a second --check prints the same WARN", () => {
    const { target, kitHome } = scratchRow();
    const first = runInstall(target, kitHome, ["--symlink"]);
    expect(first.status, first.stdout + first.stderr).toBe(0);
    const agents = join(target, "AGENTS.md");
    const elsewhere = join(dirname(target), "earlier-AGENTS.md");
    const stale = staleOf(readFileSync(join(REPO_ROOT, "AGENTS.md"), "utf8"));
    writeFileSync(elsewhere, stale);
    relinkOwn(target, "AGENTS.md", elsewhere);
    // Plan 34.1-03 (D-12, D-20): AGENTS.md strands a host only together with the shared agent skill now.
    ownSkillWithoutRoute({ target });
    const stranded = strandedOf(target, "AGENTS.md");
    expect(stranded.length, "premise: AGENTS.md strands some host").toBeGreaterThan(0);
    const { before, again, after } = doctorInstallDoctor({ target, kitHome }, "AGENTS.md", ["--symlink"]);
    const lines = carrierLines(before.stdout, "AGENTS.md");
    expect(lines.filter((l) => l.startsWith("  FAIL")), before.stdout).toEqual([]);
    const warns = lines.filter((l) => l.startsWith("  WARN"));
    expect(warns.length, before.stdout).toBe(1);
    expect(warns[0]).toContain(`(it leaves ${stranded.join(", ")} without a route to the Orchestrator)`);
    // Phase 34.1, D-16 (WR-16): the reason and the remedy are linkOwnership's, never an edit of the file the link
    // points to (which is outside the target).
    expect(warns[0]).toContain(`(${LINK_OWN_REASON})`);
    expect(warns[0]).toContain(linkOwnRemedy("AGENTS.md"));
    expect(warns[0]).not.toContain("in the file the link points to");
    expect(warns[0]).not.toContain(KIT_ROUTE);
    expect(warns[0]).not.toContain("Re-run install.js");
    expect(again.status, again.stdout + again.stderr).toBe(3);
    expect(verifiesFor(again.stdout, "AGENTS.md").length, again.stdout).toBe(1);
    expect(verifiesFor(again.stdout, "AGENTS.md")[0]).toContain(LINK_OWN_REASON);
    expect(verifiesFor(again.stdout, "AGENTS.md")[0]).toContain(linkOwnRemedy("AGENTS.md"));
    expect(verifiesFor(again.stdout, "AGENTS.md")[0]).not.toContain("a link it did not create");
    expect(reports(again.stdout, "refreshed", "AGENTS.md"), again.stdout).toBe(false);
    expect(readlinkSync(agents)).toBe(elsewhere);
    expect(readFileSync(elsewhere, "utf8")).toBe(stale);
    expect(carrierLines(after.stdout, "AGENTS.md"), after.stdout).toEqual(lines);
  });

  it("control: install's own regular-file AGENTS.md holding an earlier install's text: the FAIL names `Re-run install.js`, the re-install refreshes it, and --check then says every host reaches", () => {
    const row = installed();
    stageEarlierFile(row.target, "AGENTS.md", staleOf(readFileSync(join(row.target, "AGENTS.md"), "utf8")));
    // Plan 34.1-03 (D-12, D-20): AGENTS.md strands a host (and so is a FAIL, not a note) only together with the shared
    // agent skill now; the user's own skill without the route makes the agent-skill rows read AGENTS.md alone for it.
    ownSkillWithoutRoute(row);
    expect(strandedOf(row.target, "AGENTS.md").length, "premise: AGENTS.md strands some host").toBeGreaterThan(0);
    const { before, again, after } = doctorInstallDoctor(row, "AGENTS.md");
    expect(before.status, before.stdout + before.stderr).toBe(1);
    const fails = carrierLines(before.stdout, "AGENTS.md").filter((l) => l.startsWith("  FAIL"));
    expect(fails.length, before.stdout).toBe(1);
    expect(fails[0]).toContain("Re-run install.js");
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(reports(again.stdout, "refreshed", "AGENTS.md"), again.stdout).toBe(true);
    expect(after.status, after.stdout + after.stderr).toBe(0);
    for (const h of HOST_TOOLS) expect(reachVerdict(after.stdout, h).reaches, reachVerdict(after.stdout, h).line).toBe(true);
    expect(countedRouteLines(after.stdout), after.stdout).toEqual([]);
  });

  it("CLAUDE.md link: install's own earlier block, moved out of the target and linked back (a link install did not make): an uncounted note with the link reason and the by-hand remedy, no `Re-run install.js`; the re-install verifies and leaves the file byte-identical", () => {
    const row = installed();
    stageEarlierBlock(row.target, "CLAUDE.md", CLAUDE_OPEN, CLAUDE_CLOSE);
    const out = moveOutAndLink(row.target, "CLAUDE.md");
    const bytes = readFileSync(out);
    expect(strandedOf(row.target, "CLAUDE.md"), "premise: Claude Code reaches through AGENTS.md and its adapters").toEqual([]);
    const { before, again, after } = doctorInstallDoctor(row, "CLAUDE.md");
    const lines = carrierLines(before.stdout, "CLAUDE.md");
    expect(lines.length, before.stdout).toBe(1);
    expect(lines[0].startsWith("  note"), lines[0]).toBe(true);
    expect(lines[0]).toContain("is a symbolic link");
    expect(lines[0]).toContain(`${BY_HAND_REMEDY} ${KIT_ROUTE}`);
    expect(lines[0]).not.toContain("Re-run install.js");
    expect(again.status, again.stdout + again.stderr).toBe(3);
    expect(verifiesFor(again.stdout, "CLAUDE.md").length, again.stdout).toBe(1);
    expect(reports(again.stdout, "refreshed", "CLAUDE.md"), again.stdout).toBe(false);
    expect(readlinkSync(join(row.target, "CLAUDE.md"))).toBe(out);
    expect(readFileSync(out).equals(bytes), "the file the link points to changed").toBe(true);
    expect(carrierLines(after.stdout, "CLAUDE.md"), after.stdout).toEqual(lines);
  });

  it("Copilot link, counted: install's own earlier block linked from outside the target, with the user's own AGENTS.md without the route: a counted WARN for the Copilot file (not a FAIL) and one for AGENTS.md; the re-install verifies and refreshes nothing", () => {
    const row = installedWithOwnAgents();
    stageEarlierBlock(row.target, COPILOT_REL, COPILOT_OPEN, COPILOT_CLOSE);
    const out = moveOutAndLink(row.target, COPILOT_REL);
    const bytes = readFileSync(out);
    const stranded = strandedOf(row.target, COPILOT_REL);
    expect(stranded.length, "premise: the Copilot file strands some host").toBeGreaterThan(0);
    const { before, again, after } = doctorInstallDoctor(row, COPILOT_REL);
    const lines = carrierLines(before.stdout, COPILOT_REL);
    expect(lines.length, before.stdout).toBe(1);
    expect(lines[0].startsWith("  WARN"), lines[0]).toBe(true);
    expect(lines[0]).toContain(`(it leaves ${stranded.join(", ")} without a route to the Orchestrator)`);
    expect(lines[0]).toContain("is a symbolic link");
    expect(lines[0]).toContain(`${BY_HAND_REMEDY} ${KIT_ROUTE}`);
    expect(lines[0]).not.toContain("Re-run install.js");
    const agents = carrierLines(before.stdout, "AGENTS.md");
    expect(agents.length, before.stdout).toBe(1);
    expect(agents[0].startsWith("  WARN"), agents[0]).toBe(true);
    expect(again.status, again.stdout + again.stderr).toBe(3);
    expect(verifiesFor(again.stdout, COPILOT_REL).length, again.stdout).toBe(1);
    expect(reports(again.stdout, "refreshed", COPILOT_REL), again.stdout).toBe(false);
    expect(readFileSync(out).equals(bytes), "the file the link points to changed").toBe(true);
    expect(carrierLines(after.stdout, COPILOT_REL), after.stdout).toEqual(lines);
  });

  it("absent through a link: `.github` is a link to an empty directory outside the target: the Copilot line gives readForWrite's reason and no `Re-run install.js`, uncounted (AGENTS.md carries the route); the re-install verifies and creates nothing", () => {
    const row = installed();
    const gh = join(row.target, ".github");
    rmSync(gh, { recursive: true, force: true });
    const empty = join(dirname(row.target), "elsewhere-github");
    mkdirSync(empty);
    symlinkSync(empty, gh);
    expect(strandedOf(row.target, COPILOT_REL), "premise: AGENTS.md gives Copilot the route").toEqual([]);
    const { before, again, after } = doctorInstallDoctor(row, COPILOT_REL);
    const lines = carrierLines(before.stdout, COPILOT_REL);
    expect(lines.length, before.stdout).toBe(1);
    expect(lines[0].startsWith("  note"), lines[0]).toBe(true);
    expect(lines[0]).toContain("is not present");
    expect(lines[0]).toContain("will not write it");
    expect(lines[0]).toContain(`${gh} is a symbolic link`);
    expect(lines[0]).not.toContain("Re-run install.js");
    expect(again.status, again.stdout + again.stderr).toBe(3);
    expect(verifiesFor(again.stdout, COPILOT_REL).length, again.stdout).toBe(1);
    expect(reports(again.stdout, "created", COPILOT_REL), again.stdout).toBe(false);
    expect(readdirSync(empty), "install created something through the link").toEqual([]);
    expect(carrierLines(after.stdout, COPILOT_REL), after.stdout).toEqual(lines);
  });

  it("absent, plain: the Pi template deleted: the line names `Re-run install.js, which writes it where nothing is`, and the re-install reports `created` for it", () => {
    const row = installed();
    rmSync(piFile(row.target));
    const { before, again, after } = doctorInstallDoctor(row, PI_PROMPT_REL);
    const lines = carrierLines(before.stdout, PI_PROMPT_REL);
    expect(lines.length, before.stdout).toBe(1);
    expect(lines[0]).toContain("Re-run install.js, which writes it where nothing is");
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(reports(again.stdout, "created", PI_PROMPT_REL), again.stdout).toBe(true);
    expect(carrierLines(after.stdout, PI_PROMPT_REL).filter((l) => l.startsWith("  ok")).length, after.stdout).toBe(1);
  });
});

// ── ONE OWNER OF WHAT INSTALL WOULD WRITE INTO A ROUTE CARRIER (phase 34.1, D-15, WR-13; AUTH-1, VERDICT-1) ──
//
// Before phase 34.1 the doctor asked only "would install refresh X". A block carrier whose install block the user had
// removed was reported as one install leaves as it is, with a by-hand remedy, while the re-install appended a fresh
// block, route included, and the line cleared. installWouldWrite (refresh, append, create, or none) is now the one owner
// both ask. Each row: doctor, re-install, doctor; doctorInstallDoctor asserts the agreement over every carrier.
describe("kit route: one owner answers what install would write into a route carrier, and one answers whose link it is (phase 34.1, D-15, D-16, D-17)", () => {
  for (const rel of [...BLOCK_SENTINELS.keys()]) {
    it(`WR-13: a block carrier without install's block (${rel}): the doctor names the append, the re-install appends the block, and the next --check reports the carrier ok`, () => {
      const row = installed();
      const s = BLOCK_SENTINELS.get(rel) as { open: string; close: string };
      const path = join(row.target, ...rel.split("/"));
      const user = rel === "CLAUDE.md" ? "# Claude notes\nUse tabs.\n" : "# Copilot notes\nUse tabs.\n";
      writeFileSync(path, user);
      const { before, again, after } = doctorInstallDoctor(row, rel);
      const lines = carrierLines(before.stdout, rel);
      expect(lines.length, before.stdout).toBe(1);
      expect(lines[0], before.stdout).toContain("Re-run install.js: it appends install's start-here block, which carries the route");
      expect(lines[0], before.stdout).not.toContain("install will not");
      expect(again.status, again.stdout + again.stderr).toBe(0);
      expect(reports(again.stdout, "created", rel), again.stdout).toBe(true);
      const text = readFileSync(path, "utf8");
      expect(text.startsWith(user), "the user's bytes were kept, first").toBe(true);
      const b = blockLines(text, s.open, s.close);
      expect(b.end, "the file ends with the appended block").toBe(text.length);
      expect(b.lines).toContain(KIT_ROUTE);
      expect(carrierLines(after.stdout, rel), after.stdout).toEqual([expect.stringMatching(new RegExp(`^ {2}ok\\s+kit route carried by ${rel.replace(/[.]/g, "\\.")} `))]);
    });
  }

  it("WR-13, counted: the Copilot pointer without install's block while the user's own AGENTS.md has no route: a counted WARN naming the stranded hosts and the append remedy (not the by-hand one); the re-install appends, and every host reaches", () => {
    const row = installedWithOwnAgents();
    writeFileSync(join(row.target, ...COPILOT_REL.split("/")), "# Copilot notes\nUse tabs.\n");
    const stranded = strandedOf(row.target, COPILOT_REL);
    expect(stranded.length, "premise: the Copilot file strands some host").toBeGreaterThan(0);
    const { before, again, after } = doctorInstallDoctor(row, COPILOT_REL);
    const lines = carrierLines(before.stdout, COPILOT_REL);
    expect(lines.length, before.stdout).toBe(1);
    expect(lines[0].startsWith("  WARN"), lines[0]).toBe(true);
    expect(lines[0]).toContain(`(it leaves ${stranded.join(", ")} without a route to the Orchestrator)`);
    expect(lines[0]).toContain("Re-run install.js: it appends install's start-here block, which carries the route");
    expect(lines[0]).not.toContain(BY_HAND_REMEDY);
    expect(reports(again.stdout, "created", COPILOT_REL), again.stdout).toBe(true);
    expect(carrierLines(after.stdout, COPILOT_REL)[0]?.startsWith("  ok"), after.stdout).toBe(true);
    for (const name of stranded) {
      const h = HOST_TOOLS.find((x) => x.name === name) as (typeof HOST_TOOLS)[number];
      expect(reachVerdict(after.stdout, h).reaches, reachVerdict(after.stdout, h).line).toBe(true);
    }
  });

  // Phase 34.1, D-16 (WR-16): "whose link is this" has one answer, from the ledger's link record (linkOwnership), and
  // the doctor and install give its reason and remedy. The realistic case: a target installed with --symlink from a
  // checkout that has since moved, so AGENTS.md links to another checkout's AGENTS.md, and the ledger's link record
  // names that file. Following the remedy (remove the link, re-run install.js) leaves AGENTS.md carrying the route.
  it("WR-16: install's own --symlink AGENTS.md link, re-pointed at an AGENTS.md outside the target without the route: --check and the re-install give one reason and one remedy (remove the link and re-run), never `a link it did not create`; following the remedy makes AGENTS.md ok", () => {
    const { target, kitHome } = scratchRow();
    const first = runInstall(target, kitHome, ["--symlink"]);
    expect(first.status, first.stdout + first.stderr).toBe(0);
    const agents = join(target, "AGENTS.md");
    const elsewhere = join(dirname(target), "other-checkout-AGENTS.md");
    writeFileSync(elsewhere, "# Agents of another checkout\n\nNo route here.\n");
    relinkOwn(target, "AGENTS.md", elsewhere);
    const { before, again } = doctorInstallDoctor({ target, kitHome }, "AGENTS.md", ["--symlink"]);
    const lines = carrierLines(before.stdout, "AGENTS.md");
    expect(lines.length, before.stdout).toBe(1);
    expect(lines[0]).toContain(`(${LINK_OWN_REASON})`);
    expect(lines[0]).toContain(linkOwnRemedy("AGENTS.md"));
    expect(lines[0]).not.toContain("in the file the link points to");
    expect(lines[0]).not.toContain("Re-run install.js");
    expect(again.status, again.stdout + again.stderr).toBe(3);
    const v = verifiesFor(again.stdout, "AGENTS.md");
    expect(v.length, again.stdout).toBe(1);
    expect(v[0]).toContain(LINK_OWN_REASON);
    expect(v[0]).toContain(linkOwnRemedy("AGENTS.md"));
    expect(v[0]).not.toContain("a link it did not create");
    // Every line install printed about AGENTS.md gives the same remedy, and none tells the user to edit the linked file.
    for (const l of linesNaming(again.stdout, "AGENTS.md").filter((x) => x.includes(KIT_ROUTE))) expect(l, again.stdout).toContain(linkOwnRemedy("AGENTS.md"));
    expect(readlinkSync(agents)).toBe(elsewhere);
    expect(readFileSync(elsewhere, "utf8")).toBe("# Agents of another checkout\n\nNo route here.\n");
    // Follow the remedy.
    rmSync(agents);
    const fixed = runInstall(target, kitHome, ["--symlink"]);
    expect(fixed.status, fixed.stdout + fixed.stderr).toBe(0);
    const after = check(target, kitHome);
    expect(carrierLines(after.stdout, "AGENTS.md"), after.stdout).toEqual([expect.stringMatching(/^ {2}ok\s+kit route carried by AGENTS\.md /)]);
    expect(readFileSync(elsewhere, "utf8"), "the other checkout's file was never written").toBe("# Agents of another checkout\n\nNo route here.\n");
  });

  // Phase 34.1, D-17 (IN-16): no host reads a file that is not there.
  it("IN-16: the Pi template deleted: its uncounted note speaks of the hosts that would read it, not the hosts that read it here", () => {
    const row = installed();
    rmSync(piFile(row.target));
    const c = check(row.target, row.kitHome);
    const lines = carrierLines(c.stdout, PI_PROMPT_REL);
    expect(lines.length, c.stdout).toBe(1);
    expect(lines[0].startsWith("  note"), lines[0]).toBe(true);
    expect(lines[0]).toContain("the hosts that would read it have the route another way");
    expect(lines[0]).not.toContain("the hosts that read it here");
  });

  // Phase 34.1, D-17 (IN-17): the user's own AGENTS.md has no start-here sentence to put the route after.
  it("IN-17: the user's own AGENTS.md without the route: the by-hand remedy says after the start-here sentence only if the file has one", () => {
    const row = installedWithOwnAgents();
    const c = check(row.target, row.kitHome);
    const lines = carrierLines(c.stdout, "AGENTS.md");
    expect(lines.length, c.stdout).toBe(1);
    expect(lines[0]).toContain(`${BY_HAND_REMEDY} ${KIT_ROUTE}`);
    expect(lines[0]).not.toContain("after its start-here sentence");
    expect(lines[0]).not.toContain("Re-run install.js");
  });
});

// ── THE CLASS MATRIX (plan 34-35, D-27 points 1, 2 and 3; brief §4; classes VERDICT-1 and AUTH-1) ──
//
// Plans 34-32 to 34-34 each fixed one owner (hostReadsCarrier, strandedBy, refreshable) and
// tested its own rows. In every earlier round the next finding was a member of the class next to the fixed site, so
// this matrix asks the class question over every state at once. One describe drives `--check` and install over the
// derived axes below and, in every cell and for every HOST_TOOLS host, holds:
//   (1)-(4) the doctor to the independent follower: one reach line per host in registry order, every verdict equal to
//           the follower's, a counted kit-route finding exactly when some host cannot reach, every counted carrier
//           line about a carrier that leaves some host without a route (naming exactly those hosts), every uncounted
//           carrier note about one that leaves none;
//   (5)     the doctor's `Re-run install.js` to what the install run on the same state does (a carrier line names it
//           exactly when the install writes that carrier; the route-target FAIL only when the route resolves after);
//   (6)-(7) a DRY_RUN on the same state to the real install: the same files written (would-* against
//           created/copied/linked/refreshed) and the same route notes, with the target byte-identical;
//   (8)     the real install's route notes to the follower's stranded hosts after the run, and every matrix file the
//           install did not report writing to its bytes before the run;
//   (9)     `--check` after the install to the follower again, by the rules of (1)-(4);
//   (10)    a block carrier in state user-without-block to the decision (phase 34.1, D-15): the install appends its
//           block and the follower finds the route in it after.
//
// THE FOLLOWER SHARES NO DERIVATION WITH THE PRODUCT. It imports only data from host-tools.js (HOST_TOOLS,
// ROUTE_POINTERS, KIT_ROUTE, HOST_TOOL_COUNT) and
// computes reads, holds, adapter reach and stranded hosts itself (follow, followerCarriers, strandedOf above). Every
// staging step writes files only; no product code is called to build a cell.
//
// THE AXES ARE DERIVED OR CHECKED AGAINST A DERIVATION, AND THE CELLS ARE GENERATED. CLASS_CARRIERS is carriersOf over
// HOST_TOOLS, checked against the carriers a clean `--check` prints `kit route carried by` lines for. The cell count is
// a formula over the axes, asserted against the generated list, and every cell is its own `it`, so the passed count
// shows how many ran.

/**
 * The states a route carrier is put in: the seven of plan 34-35, and `user-without-block` (phase 34.1, D-15, WR-13): a
 * block carrier the user rewrote with neither install's open sentinel nor KIT_ROUTE, so a re-install appends the block.
 * It applies to block carriers only (BLOCK_ONLY_STATES); a whole file has no block to remove.
 */
const CARRIER_STATES = ["current", "own-stale", "user-without-route", "user-with-route", "absent", "link-to-stale", "unreadable", "user-without-block"] as const;
type CarrierState = (typeof CARRIER_STATES)[number];
/** The text of a block carrier in state user-without-block: the user's own, with no install block and no route. */
const userWithoutBlockText = (rel: string): string => `# My own notes for ${rel}\n\nUse tabs.\n`;
/** The states that apply to a block carrier only. */
const BLOCK_ONLY_STATES: readonly CarrierState[] = ["user-without-block"];
/** The states route carrier `rel` is put in: every state, less the block-only ones for a whole-file carrier. */
const statesFor = (rel: string): readonly CarrierState[] => CARRIER_STATES.filter((st) => BLOCK_SENTINELS.has(rel) || !BLOCK_ONLY_STATES.includes(st));
/** The two states of Claude Code's adapters: as installed, or every materialized KIT= line under `.claude/` pointed at an empty directory. */
const ADAPTER_STATES = ["reaches", "kit-line-to-empty-dir"] as const;
type AdapterState = (typeof ADAPTER_STATES)[number];
/**
 * The two route-target states: the marker's kitRoot pointed at an empty directory, and roles/orchestrator.md removed from
 * the row's own kit home. A marker with no kitRoot is not one: the doctor stops before the kit-route section with its
 * unreadable-marker FAIL, whose remedy is the owner's never-remove wording (install-marker.ts markerFixText of
 * markerRemedy's answer: the marker is fixed by hand and never removed, whatever the read; re-pinned by plan 34.1-44,
 * 2026-10-13, D-37).
 */
const ROUTE_STATES = ["kit-root-to-empty-dir", "orchestrator-removed"] as const;
type RouteState = (typeof ROUTE_STATES)[number];

/** Every route carrier, derived (carriersOf over HOST_TOOLS, first-seen registry order). */
const CLASS_CARRIERS: readonly string[] = allCarriers();

interface CellSpec {
  /** The generating group of the cell, (a) to (d). */
  readonly group: "a" | "b" | "c" | "d";
  /** The one agent the install is for (group (d), its registry row's id), or undefined for every agent. */
  readonly agent?: string;
  /** Every route carrier's state. */
  readonly carriers: ReadonlyMap<string, CarrierState>;
  readonly adapter: AdapterState;
  readonly route: RouteState | "resolves";
}

/** A cell's name: its group and every axis that is not the clean value. */
function cellName(spec: CellSpec): string {
  const moved = [...spec.carriers].filter(([, s]) => s !== "current").map(([rel, s]) => `${rel} ${s}`);
  return [
    `(${spec.group})`,
    moved.length > 0 ? moved.join(", ") : "every carrier current",
    `× adapter ${spec.adapter}`,
    `× route ${spec.route}`,
    ...(spec.agent === undefined ? [] : [`× installed ${spec.agent} only`]),
  ].join(" ");
}

/** The carrier → state map with `over` applied and every other carrier current. */
const carrierStates = (over: Readonly<Record<string, CarrierState>>): ReadonlyMap<string, CarrierState> => {
  for (const rel of Object.keys(over)) expect(CLASS_CARRIERS, `premise: ${rel} is a derived route carrier`).toContain(rel);
  return new Map(CLASS_CARRIERS.map((rel) => [rel, over[rel] ?? "current"]));
};

/** The link record install writes for a --symlink AGENTS.md, as a function of its link target (read once from a real --symlink install's ledger). */
let linkRecordOf: ((to: string) => string) | null = null;
function linkRecordFor(to: string): string {
  if (linkRecordOf === null) {
    const { target, kitHome } = scratchRow();
    const r = runInstall(target, kitHome, ["--symlink"]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const agents = join(target, "AGENTS.md");
    expect(lstatSync(agents).isSymbolicLink(), "premise: the --symlink install linked AGENTS.md").toBe(true);
    const old = readlinkSync(agents);
    const record = fileRecords(readMarkerObject(target))["AGENTS.md"];
    expect(record !== undefined && record.includes(old), `premise: install's record for its AGENTS.md link names the link's target (${record})`).toBe(true);
    linkRecordOf = (t) => record.split(old).join(t);
  }
  return linkRecordOf(to);
}

/** Put route carrier `rel` of an installed target into `state`, by writing files only. */
function stageCarrier(target: string, rel: string, state: CarrierState): void {
  const path = join(target, ...rel.split("/"));
  const s = BLOCK_SENTINELS.get(rel);
  const userLine = (text: string, open: string): string => text.replace(`${open}\n`, `${open}\nMy own line inside the block.\n`);
  switch (state) {
    case "current":
      return;
    case "own-stale":
      if (s === undefined) stageEarlierFile(target, rel, staleOf(readFileSync(path, "utf8")));
      else stageEarlierBlock(target, rel, s.open, s.close);
      return;
    case "user-without-route":
      // A file the user rewrote, so no install record holds it; for a block carrier, a user line inside the block and
      // KIT_ROUTE removed.
      writeFileSync(path, s === undefined ? `# My own ${rel}\n\nMy own instructions.\n` : userLine(readFileSync(path, "utf8"), s.open).replace(` ${KIT_ROUTE}`, ""));
      expect(readFileSync(path, "utf8").includes(KIT_ROUTE), `premise: ${rel} holds no route`).toBe(false);
      return;
    case "user-with-route":
      writeFileSync(path, s === undefined ? `# My own ${rel}\n\n${KIT_ROUTE}\n` : userLine(readFileSync(path, "utf8"), s.open));
      expect(readFileSync(path, "utf8").includes(KIT_ROUTE), `premise: ${rel} holds the route`).toBe(true);
      return;
    case "user-without-block": {
      // Phase 34.1, D-15 (WR-13): the user replaced the file's text and install's block went with it.
      expect(s, `premise: ${rel} is a block carrier (user-without-block applies to block carriers only)`).toBeDefined();
      writeFileSync(path, userWithoutBlockText(rel));
      const text = readFileSync(path, "utf8");
      expect(text.includes((s as { open: string }).open) || text.includes(KIT_ROUTE), `premise: ${rel} holds neither the open sentinel nor the route`).toBe(false);
      return;
    }
    case "absent":
      rmSync(path);
      return;
    case "link-to-stale": {
      // Install's stale copy, moved to a scratch path under ROOT, and a link to it at the carrier's path. For a whole-file
      // carrier the ledger record becomes the link record install writes, with its target replaced (as plan 34-34 did).
      if (s === undefined) stageEarlierFile(target, rel, staleOf(readFileSync(path, "utf8")));
      else stageEarlierBlock(target, rel, s.open, s.close);
      const out = moveOutAndLink(target, rel);
      if (s === undefined) {
        const record = linkRecordFor(out);
        writeMarkerObject(
          target,
          withLedger(readMarkerObject(target), (entries) => {
            const e = entries.find((x) => x.kind === "file" && x.path === rel);
            expect(e, `premise: the ledger records ${rel} as a file install created`).toBeDefined();
            (e as Record<string, unknown>).content = record;
          }),
        );
      }
      expect(lstatSync(path).isSymbolicLink(), `premise: ${rel} is a link`).toBe(true);
      return;
    }
    case "unreadable":
      rmSync(path);
      mkdirSync(path);
      return;
  }
}

/** Point every materialized KIT= line of every regular file under `.claude/` at an empty scratch directory. */
function breakAdapters(target: string): void {
  const empty = join(ROOT, `empty${n++}`);
  mkdirSync(empty);
  let changed = 0;
  const walk = (dir: string): void => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.isFile()) {
        let inBlock = false;
        let mine = 0;
        const lines = readFileSync(p, "utf8")
          .split("\n")
          .map((l) => {
            if (l === MAT_OPEN) inBlock = true;
            else if (l === MAT_CLOSE) inBlock = false;
            else if (inBlock && l.startsWith('KIT="')) {
              mine += 1;
              return `KIT="${empty}"`;
            }
            return l;
          });
        if (mine > 0) writeFileSync(p, lines.join("\n"));
        changed += mine;
      }
    }
  };
  walk(join(target, ".claude"));
  expect(changed, "premise: some materialized KIT= line was rewritten").toBeGreaterThan(0);
  expect(follow(target).adapterReaches, "premise: the adapters no longer reach a kit").toBe(false);
}

/** Put the route target into `state`. */
function stageRoute(target: string, kitHome: string, state: RouteState | "resolves"): void {
  if (state === "resolves") return;
  if (state === "kit-root-to-empty-dir") {
    const empty = join(ROOT, `empty${n++}`);
    mkdirSync(empty);
    writeMarkerObject(target, { ...readMarkerObject(target), kitRoot: empty });
  } else {
    const { orchestrator } = followRoute(target);
    expect(relative(kitHome, orchestrator).startsWith(".."), `premise: the Orchestrator is under the row's own kit home (${orchestrator})`).toBe(false);
    rmSync(orchestrator);
  }
  expect(follow(target).routeResolves, "premise: the route no longer resolves").toBe(false);
}

/** A clean install into a fresh scratch row, then the staging the spec names (files only). */
/** The agent flags a cell's installs pass: the one agent's flag, or none (every agent, through withAgentFlags). */
function cellArgs(spec: CellSpec): string[] {
  if (spec.agent === undefined) return [];
  const h = HOST_TOOLS.find((x) => x.id === spec.agent);
  expect(h, `premise: ${spec.agent} is a registry row`).toBeDefined();
  return [agentFlag(h!)];
}

function buildCell(spec: CellSpec): { target: string; kitHome: string } {
  const row = installed(cellArgs(spec));
  for (const [rel, state] of spec.carriers) stageCarrier(row.target, rel, state);
  if (spec.adapter === "kit-line-to-empty-dir") breakAdapters(row.target);
  stageRoute(row.target, row.kitHome, spec.route);
  return row;
}

/** The follower's whole answer for a target as it is now: kept, because the files change when install runs. */
interface FollowerView {
  readonly f: Followed;
  /** Whether host `h` reads `rel`, by the follower's own rule (every carrier of its row; an installed host only). */
  readonly reads: (h: (typeof HOST_TOOLS)[number], rel: string) => boolean;
  /** THE FOLLOWER'S strandedHosts(rel): the hosts that read rel here, read no other carrier holding the route and have no adapter route. */
  readonly strandedHosts: (rel: string) => readonly string[];
}
function followerView(target: string): FollowerView {
  const f = follow(target);
  const reads = new Map(f.installed.map((h) => [h.id, followerCarriers(h)]));
  const stranded = new Map(CLASS_CARRIERS.map((rel) => [rel, strandedOf(target, rel)]));
  return {
    f,
    reads: (h, rel) => reads.get(h.id)?.includes(rel) === true,
    strandedHosts: (rel) => stranded.get(rel) ?? [],
  };
}

/** What is at `path` (never followed for the kind; a link also records what it points to). */
function pathState(path: string): string {
  const lstatOrNull = (p: string) => {
    try {
      return lstatSync(p);
    } catch {
      return null;
    }
  };
  const st = lstatOrNull(path);
  if (st === null) return "absent";
  if (st.isSymbolicLink()) return `link ${readlinkSync(path)} → ${regularText(path) === null ? "no regular file" : sha256Of(readFileSync(path))}`;
  if (st.isDirectory()) return "directory";
  return st.isFile() ? `file ${sha256Of(readFileSync(path))}` : "other";
}

/**
 * `.gemini/settings.json`: install no longer reads, creates or edits it (phase 34.1, D-12). It stays a matrix file so
 * that (6) and (8) hold, in every cell, that neither the DRY_RUN nor the install names it as written and that it is
 * as it was before the run (absent, since no install creates it).
 */
const GEMINI_SETTINGS = ".gemini/settings.json";
/** Every report line (any label) that names `rel` anywhere in its message. */
const linesNaming = (stdout: string, rel: string): string[] => stdout.split(/\r?\n/).filter((l) => /^ {2}\S+\s/.test(l) && l.includes(rel));
/** The files the matrix is about: every route carrier and the Gemini settings file install must never write. */
const MATRIX_FILES: readonly string[] = [...CLASS_CARRIERS, GEMINI_SETTINGS];
/** The labels of an install line that wrote its subject, and of a DRY_RUN line that would. */
const WRITE_LABELS = ["created", "copied", "copied(verify)", "linked", "refreshed"] as const;
const DRY_WRITE_LABELS = ["would-add", "would-copy", "would-link", "would-refresh"] as const;
const wroteUnder = (stdout: string, labels: readonly string[], rel: string): boolean => labels.some((label) => reports(stdout, label, rel));

/** The doctor's route-target line: the one kit-route line about the marker's kitRoot. */
const routeTargetLines = (stdout: string): string[] => routeLines(stdout).filter((l) => messageOf(l).startsWith("kit route: the `kitRoot` field "));
const isCounted = (line: string): boolean => /^ {2}(FAIL|WARN)\s/.test(line);

/**
 * Assertions (1)-(4) for one `--check` run against the follower's view of the same files. `what` names the cell and
 * the run in every message; `exit` asks the exit-status rule too (cells whose other doctor checks do not FAIL).
 */
function expectDoctorAgrees(what: string, c: Run, view: FollowerView, exit: boolean): void {
  const out = `${what}\n${c.stdout}`;
  // (1) one reach line per installed agent (the follower's own read of the marker), in registry order (D-07).
  expect(reachLines(c.stdout).length, `(1) reach lines: ${out}`).toBe(view.f.installed.length);
  expect(reachLines(c.stdout).map((l) => messageOf(l).split(": ")[0]), `(1) reach-line order: ${out}`).toEqual(view.f.installed.map((h) => h.name));
  // (2) every installed host's verdict equals the follower's.
  for (const h of view.f.installed) {
    const v = reachVerdict(c.stdout, h);
    expect(v.reaches, `(2) ${h.name}: the doctor and the follower disagree: ${v.line}\n${out}`).toBe(view.f.reaches.get(h.id));
  }
  const cannot = view.f.installed.filter((h) => view.f.reaches.get(h.id) !== true);
  // (3) a counted kit-route line exists exactly when some host cannot reach.
  const counted = countedRouteLines(c.stdout);
  expect(counted.length > 0, `(3) counted kit-route lines vs hosts that cannot reach (${cannot.map((h) => h.name).join(", ") || "none"}): ${out}`).toBe(cannot.length > 0);
  // (4) every kit-route line is the route-target line or a carrier line, and each says what the follower says.
  const target = routeTargetLines(c.stdout);
  expect(target.length, `(4) one route-target line: ${out}`).toBe(1);
  expect(target[0].startsWith(view.f.routeResolves ? "  ok" : "  FAIL"), `(4) the route-target line vs the follower (resolves: ${view.f.routeResolves}): ${target[0]}\n${out}`).toBe(true);
  let classified = target.length;
  // Every carrier an installed agent reads has one line; a carrier no installed agent reads has none (D-07).
  for (const rel of CLASS_CARRIERS.filter((r) => !view.f.installedCarriers.includes(r))) {
    expect(carrierLines(c.stdout, rel), `(4) ${rel} is read by no installed agent, and --check reports it: ${out}`).toEqual([]);
  }
  for (const rel of view.f.installedCarriers) {
    const mine = carrierLines(c.stdout, rel);
    expect(mine.length, `(4) one carrier line for ${rel}: ${out}`).toBe(1);
    classified += 1;
    if (view.f.carries.get(rel) === true) {
      expect(mine[0].startsWith("  ok") && messageOf(mine[0]).startsWith(`kit route carried by ${rel} `), `(4) ${rel} carries the route (follower): ${mine[0]}\n${out}`).toBe(true);
      continue;
    }
    const stranded = view.strandedHosts(rel);
    expect(isCounted(mine[0]), `(4) ${rel} is counted exactly when it leaves some host without a route (follower: ${stranded.join(", ") || "none"}): ${mine[0]}\n${out}`).toBe(stranded.length > 0);
    if (stranded.length > 0) expect(mine[0], `(4) ${rel}: the counted line names exactly the follower's stranded hosts\n${out}`).toContain(`(it leaves ${stranded.join(", ")} without a route to the Orchestrator)`);
    else expect(mine[0].startsWith("  note"), `(4) ${rel} leaves no host without a route: an uncounted note: ${mine[0]}\n${out}`).toBe(true);
  }
  expect(routeLines(c.stdout).length, `(4) every kit-route line is the route-target line or a carrier line: ${out}`).toBe(classified);
  if (exit) {
    // No counted finding outside the kit route in these cells, so the exit status is the kit-route FAIL's.
    const all = c.stdout.split(/\r?\n/).filter(isCounted);
    expect(all, `every counted line is a kit-route line: ${out}`).toEqual(counted);
    expect(c.status, `the doctor's exit status: ${out}`).toBe(counted.some((l) => l.startsWith("  FAIL")) ? 1 : 0);
  }
}

/** The hosts an install route note for `rel` names, from its sentence. */
function noteHosts(stdout: string, rel: string): string[] {
  const notes = notesFor(stdout, rel);
  expect(notes.length, `one route note for ${rel}\n${stdout}`).toBe(1);
  const m = /it leaves (.+?) without a route to the kit after a scripted install/.exec(messageOf(notes[0]));
  expect(m, `an unparsable route note: ${notes[0]}`).not.toBeNull();
  return (m as RegExpExecArray)[1].split(", ");
}

interface CellResult {
  readonly row: { target: string; kitHome: string };
  readonly before: FollowerView;
  readonly after: FollowerView;
  readonly doc: Run;
  readonly dry: Run;
  readonly real: Run;
  readonly docAfter: Run;
}

/**
 * Build the cell, then: the doctor, a DRY_RUN install on the same state (the target unchanged), the real install, the
 * doctor again. Each output is collected once and asserts (1)-(9) are made from it, in order.
 */
function checkCell(spec: CellSpec): CellResult {
  const name = cellName(spec);
  const row = buildCell(spec);
  const { target, kitHome } = row;
  const exitAsked = spec.adapter === "reaches" && spec.route === "resolves";
  const before = followerView(target);
  const doc = check(target, kitHome);
  // (1)-(4) the doctor against the follower, before the install.
  expectDoctorAgrees(`${name}: --check before the install`, doc, before, exitAsked);
  const states = new Map(MATRIX_FILES.map((rel) => [rel, pathState(join(target, ...rel.split("/")))]));
  const tree = snapshotTree(target);
  const dry = runInstall(target, kitHome, cellArgs(spec), { dryRun: true });
  expect([0, 3], `${name}: the DRY_RUN exit status\n${dry.stdout}${dry.stderr}`).toContain(dry.status);
  expect(snapshotTree(target), `${name}: the DRY_RUN changed the target\n${dry.stdout}`).toBe(tree);
  const real = runInstall(target, kitHome, cellArgs(spec));
  expect([0, 3], `${name}: the install exit status\n${real.stdout}${real.stderr}`).toContain(real.status);
  const after = followerView(target);
  const docAfter = check(target, kitHome);
  const both = `\n--check said:\n${doc.stdout}\nthe install said:\n${real.stdout}`;
  // (5) every `Re-run install.js` is a remedy the install carries out, and every write the install makes was named.
  for (const rel of CLASS_CARRIERS) {
    expect(rerunNamed(doc.stdout, rel), `(5) ${name}: the doctor names \`Re-run install.js\` for ${rel} exactly when the install writes it${both}`).toBe(
      wroteUnder(real.stdout, WRITE_LABELS, rel),
    );
  }
  const routeLine = routeTargetLines(doc.stdout)[0];
  if (routeLine.includes("Re-run install.js")) expect(after.f.routeResolves, `(5) ${name}: the route-target line names \`Re-run install.js\`, and the route resolves after the install${both}`).toBe(true);
  if (!before.f.routeResolves && after.f.routeResolves) expect(routeLine, `(5) ${name}: the install made the route resolve, so the FAIL named the remedy`).toContain("Re-run install.js");
  // (6) the DRY_RUN reports would-* for exactly the matrix files the real install writes.
  for (const rel of MATRIX_FILES) {
    expect(wroteUnder(dry.stdout, DRY_WRITE_LABELS, rel), `(6) ${name}: DRY_RUN would-* vs the real install's write for ${rel}\nDRY_RUN said:\n${dry.stdout}${both}`).toBe(
      wroteUnder(real.stdout, WRITE_LABELS, rel),
    );
  }
  // (7) the same route notes.
  expect([...routeNotes(dry.stdout)].sort(), `(7) ${name}: DRY_RUN route notes vs the real install's\n${dry.stdout}${both}`).toEqual([...routeNotes(real.stdout)].sort());
  // (8) the install's notes name the follower's stranded hosts after the run; a matrix file it did not write is as it was.
  for (const rel of CLASS_CARRIERS) {
    const stranded = after.strandedHosts(rel);
    expect(notesFor(real.stdout, rel).length, `(8) ${name}: a route note for ${rel} exactly when the follower says it strands a host after the run (${stranded.join(", ") || "none"})${both}`).toBe(stranded.length > 0 ? 1 : 0);
    if (stranded.length > 0) expect(noteHosts(real.stdout, rel), `(8) ${name}: the hosts the note for ${rel} names`).toEqual([...stranded]);
  }
  expect(routeNotes(real.stdout).length, `(8) ${name}: every route note is about a derived carrier${both}`).toBe(CLASS_CARRIERS.filter((rel) => after.strandedHosts(rel).length > 0).length);
  for (const rel of MATRIX_FILES) {
    if (wroteUnder(real.stdout, WRITE_LABELS, rel)) continue;
    expect(pathState(join(target, ...rel.split("/"))), `(8) ${name}: the install did not report writing ${rel}, and it changed${both}`).toBe(states.get(rel));
  }
  // (9) --check after the install agrees with the follower again.
  expectDoctorAgrees(`${name}: --check after the install`, docAfter, after, exitAsked);
  // (10) phase 34.1 D-15 (WR-13), an oracle from the decision, not from the product: a block carrier without install's
  // block gets the block appended. The install reports writing it, the bytes it held before the run are kept as the
  // head of the file, and the follower finds the route in it after. (5) then holds that the doctor named the re-run.
  for (const [rel, st] of spec.carriers) {
    if (st !== "user-without-block") continue;
    expect(wroteUnder(real.stdout, WRITE_LABELS, rel), `(10) ${name}: the install appends its block to ${rel}${both}`).toBe(true);
    expect(after.f.carries.get(rel), `(10) ${name}: ${rel} carries the route after the install${both}`).toBe(true);
    expect(readFileSync(join(target, ...rel.split("/")), "utf8").startsWith(userWithoutBlockText(rel)), `(10) ${name}: the user's bytes of ${rel} are kept as its head`).toBe(true);
  }
  return { row, before, after, doc, dry, real, docAfter };
}

/** A cell's per-test timeout: about five spawns, each well under a second. */
const CELL_TIMEOUT_MS = 120_000;

// THE CELLS, GENERATED FROM THE AXES (never a typed cell list):
//   (a) every carrier × every carrier state but the current copy; the adapters reach, the route resolves;
//   (b) the adapters' KIT= lines broken × CLAUDE.md ∈ D_CARRIER × AGENTS.md ∈ D_CARRIER;
//   (c) each route state, everything else current.
// CLAUDE.md and AGENTS.md are the carriers the plan names for (b); carrierStates asserts each is derived.
// Phase 34.1 D-12 (plan 34.1-03) deleted the Gemini settings axis with the Gemini merge and its entry gate: the old
// group (b) (every carrier current × every Gemini state) and the old group (c) (AGENTS.md ∈ C_AGENTS × Gemini ∈
// C_GEMINI). Without the Gemini axis the old group (c) is AGENTS.md ∈ {user-without-route, own-stale} with everything
// else clean, which is exactly two cells of group (a), so it was removed rather than run twice; the tracer below keeps
// the user's own AGENTS.md cell as its own case. The old groups (d) and (e) are now (b) and (c).
const D_CARRIER: readonly CarrierState[] = ["current", "user-without-route"];
// (d) THE INSTALLED-SET AXIS (plan 34.1-10, D-07; the plan's "group (f)": the groups were relettered by plan 34.1-03):
// for each HOST_TOOLS row, a clean install with only that agent's flag, and the same with AGENTS.md in state
// user-without-route; the DRY_RUN and the re-install pass the same one flag. The follower reads the installed agents
// from the marker's `agents` field itself, so every assertion (1)-(9) holds restricted to that agent: one reach line,
// no line for a carrier only other agents read, and notes only about the installed agent.
const D_AGENTS_MD_STATES: readonly CarrierState[] = ["current", "user-without-route"];
const D_ADAPTER: readonly AdapterState[] = ADAPTER_STATES.filter((a) => a !== "reaches");
function generateCells(): CellSpec[] {
  const clean = { adapter: "reaches", route: "resolves" } as const;
  const cells: CellSpec[] = [];
  for (const rel of CLASS_CARRIERS) {
    for (const state of statesFor(rel)) if (state !== "current") cells.push({ group: "a", carriers: carrierStates({ [rel]: state }), ...clean });
  }
  for (const adapter of D_ADAPTER) {
    for (const claude of D_CARRIER) for (const agents of D_CARRIER) cells.push({ ...clean, group: "b", carriers: carrierStates({ "CLAUDE.md": claude, "AGENTS.md": agents }), adapter });
  }
  for (const route of ROUTE_STATES) cells.push({ ...clean, group: "c", carriers: carrierStates({}), route });
  for (const h of HOST_TOOLS) for (const agents of D_AGENTS_MD_STATES) cells.push({ ...clean, group: "d", carriers: carrierStates({ "AGENTS.md": agents }), agent: h.id });
  return cells;
}
const CELLS: readonly CellSpec[] = generateCells();
/** The block carriers among the derived route carriers (the ones BLOCK_SENTINELS spells). */
const CLASS_BLOCK_CARRIERS: readonly string[] = CLASS_CARRIERS.filter((rel) => BLOCK_SENTINELS.has(rel));
/**
 * The cell count, a formula over the axes: the per-carrier applicable states summed, |CARRIERS|×(|CARRIER_STATES|−1−
 * |BLOCK_ONLY_STATES|) + |BLOCK_CARRIERS|×|BLOCK_ONLY_STATES| (phase 34.1, D-15: the block-only states join group (a)
 * for block carriers only); + |D_ADAPTER|×|D_CARRIER|² + |ROUTE_STATES| + |D_AGENTS_MD_STATES|×HOST_TOOL_COUNT (group
 * (d), the installed-set axis, plan 34.1-10). Written over the axes, not over statesFor, so the generator is checked.
 */
const CELL_COUNT =
  CLASS_CARRIERS.length * (CARRIER_STATES.length - 1 - BLOCK_ONLY_STATES.length) +
  CLASS_BLOCK_CARRIERS.length * BLOCK_ONLY_STATES.length +
  D_ADAPTER.length * D_CARRIER.length * D_CARRIER.length +
  ROUTE_STATES.length +
  D_AGENTS_MD_STATES.length * HOST_TOOL_COUNT;

describe("kit route: the class matrix — reach, counted findings and install agreement over every carrier, adapter and route state (plan 34-35, D-27)", () => {
  it(
    "tracer: the user's own AGENTS.md without the route: all nine assertions, and the follower's stranded hosts before and after the install, derived from HOST_TOOLS",
    () => {
      const spec: CellSpec = { group: "a", carriers: carrierStates({ "AGENTS.md": "user-without-route" }), adapter: "reaches", route: "resolves" };
      const r = checkCell(spec);
      // The hosts whose only carrier is AGENTS.md, taken from HOST_TOOLS (never typed; no host is special-cased). Every
      // host reads every carrier of its row (phase 34.1, D-12), so these are the hosts AGENTS.md strands, before and
      // after the install, which leaves the user's own AGENTS.md alone. Since plan 34.1-03 (D-20) every row has an entry
      // of its own beside AGENTS.md, so the set is derived to be empty and AGENTS.md's line is an uncounted `note`; the
      // expected label and note count are derived from the same set rather than typed (the counting rule, plan 34-33).
      const onlyAgents = HOST_TOOLS.filter((h) => carriersOf(h).length === 1 && carriersOf(h)[0] === "AGENTS.md");
      const names = onlyAgents.map((h) => h.name);
      expect(r.before.strandedHosts("AGENTS.md")).toEqual(names);
      for (const h of HOST_TOOLS) expect(r.before.f.reaches.get(h.id), h.name).toBe(!onlyAgents.includes(h));
      const line = carrierLines(r.doc.stdout, "AGENTS.md")[0];
      expect(line.startsWith(onlyAgents.length > 0 ? "  WARN" : "  note"), line).toBe(true);
      expect(line).not.toContain("Re-run install.js");
      // (6) the DRY_RUN says nothing about AGENTS.md being written, and nothing about the Gemini settings (D-12).
      expect(wroteUnder(r.dry.stdout, DRY_WRITE_LABELS, "AGENTS.md"), r.dry.stdout).toBe(false);
      expect(linesNaming(r.dry.stdout, GEMINI_SETTINGS), r.dry.stdout).toEqual([]);
      // (8) the install left AGENTS.md alone and created no .gemini/; its note names the after-run stranded hosts.
      expect(readFileSync(join(r.row.target, "AGENTS.md"), "utf8")).toBe("# My own AGENTS.md\n\nMy own instructions.\n");
      expect(existsSync(join(r.row.target, ".gemini")), r.real.stdout).toBe(false);
      expect(linesNaming(r.real.stdout, GEMINI_SETTINGS), r.real.stdout).toEqual([]);
      expect(r.after.strandedHosts("AGENTS.md")).toEqual(names);
      expect(notesFor(r.real.stdout, "AGENTS.md").length, r.real.stdout).toBe(onlyAgents.length > 0 ? 1 : 0);
      if (onlyAgents.length > 0) expect(noteHosts(r.real.stdout, "AGENTS.md")).toEqual(names);
    },
    CELL_TIMEOUT_MS,
  );

  it("the carrier axis: the carriers derived from HOST_TOOLS and ROUTE_POINTERS are exactly those a clean --check prints `kit route carried by` lines for, in its order", () => {
    const { target, kitHome } = installed();
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const printed = routeLines(c.stdout)
      .map(messageOf)
      .filter((m) => m.startsWith("kit route carried by "))
      .map((m) => m.slice("kit route carried by ".length).split(" (read by ")[0]);
    expect(printed, c.stdout).toEqual([...CLASS_CARRIERS]);
    expect(HOST_TOOLS.length, "premise: the registry pin").toBe(HOST_TOOL_COUNT);
  });

  it(`the matrix has ${CELL_COUNT} cells, the formula over the axes (${CLASS_CARRIERS.length} carriers × ${CARRIER_STATES.length - 1 - BLOCK_ONLY_STATES.length} states + ${CLASS_BLOCK_CARRIERS.length} block carriers × ${BLOCK_ONLY_STATES.length} block-only, ${D_ADAPTER.length * D_CARRIER.length ** 2} adapter, ${ROUTE_STATES.length} route, ${D_AGENTS_MD_STATES.length} × ${HOST_TOOL_COUNT} installed-set), each named once`, () => {
    expect(CELLS.length).toBe(CELL_COUNT);
    // The block carriers the block-only states apply to: derived, every one BLOCK_SENTINELS spells, and some.
    expect(CLASS_BLOCK_CARRIERS.length, "premise: some derived carrier is a block carrier").toBeGreaterThan(0);
    expect([...CLASS_BLOCK_CARRIERS].sort(), "every block carrier the test spells is a derived carrier").toEqual([...BLOCK_SENTINELS.keys()].sort());
    for (const rel of CLASS_BLOCK_CARRIERS) {
      expect(CELLS.filter((c) => c.group === "a" && c.carriers.get(rel) === "user-without-block").length, `${rel} × user-without-block`).toBe(1);
    }
    // The installed-set axis (group (d)): 2 × HOST_TOOL_COUNT cells, one pair per registry row, derived.
    expect(HOST_TOOLS.length, "premise: the registry pin").toBe(HOST_TOOL_COUNT);
    const d = CELLS.filter((c) => c.group === "d");
    expect(d.length).toBe(2 * HOST_TOOL_COUNT);
    for (const h of HOST_TOOLS) expect(d.filter((c) => c.agent === h.id).length, `group (d) cells for ${h.id}`).toBe(2);
    expect(new Set(CELLS.map(cellName)).size, "two cells share a name").toBe(CELL_COUNT);
    // Every state of every axis occurs in some cell.
    for (const s of CARRIER_STATES) expect(CELLS.some((c) => [...c.carriers.values()].includes(s)), `carrier state ${s}`).toBe(true);
    for (const a of ADAPTER_STATES) expect(CELLS.some((c) => c.adapter === a), `adapter state ${a}`).toBe(true);
    for (const r of ROUTE_STATES) expect(CELLS.some((c) => c.route === r), `route state ${r}`).toBe(true);
    for (const rel of CLASS_CARRIERS) {
      for (const s of CARRIER_STATES) expect(CELLS.some((c) => c.carriers.get(rel) === s), `${rel} × ${s}`).toBe(statesFor(rel).includes(s));
    }
  });

  for (const spec of CELLS) {
    it(`${cellName(spec)}: assertions (1)-(10)`, () => void checkCell(spec), CELL_TIMEOUT_MS);
  }
});

// ── WR-17 (phase 34.1, D-26; brief MSG-1): A ROUTE NOTE NEVER POINTS AT A LINE THE RUN DID NOT PRINT ─────────────────
//
// noteStrandingCarriers asks about every agent installed after the run (AGENTS_AFTER), which holds agents installed
// earlier and not chosen now. No writer of this run visits such an agent's carrier, so no line about it is printed;
// the note for it names the command that writes it (agentCommand), and the test runs exactly that printed command.
// When this run's writer did visit the carrier (row B), the note's "line above" is checked against the same stdout.
describe("WR-17: a route note never points at a line the run did not print (D-26)", () => {
  const opencodeHost = (): (typeof HOST_TOOLS)[number] => {
    const o = HOST_TOOLS.filter((h) => h.adapter === "opencode-command");
    expect(o.length, "premise: exactly one registry host has the opencode-command adapter").toBe(1);
    return o[0];
  };

  it("row A (the review's reproduction): a Pi template deleted, then an OpenCode-only install: the note names the command that writes it, the command run as printed writes it, and the next install notes nothing about it", () => {
    const row = scratchRow();
    const home = join(dirname(row.target), "home");
    mkdirSync(home, { recursive: true });
    ownAgents(row);
    const first = runInstall(row.target, row.kitHome, [agentFlag(piHost())], { home });
    expect(first.status, first.stdout + first.stderr).toBe(0);
    rmSync(piFile(row.target));
    const second = runInstall(row.target, row.kitHome, [agentFlag(opencodeHost())], { home });
    expect(second.status, second.stdout + second.stderr).toBe(0);
    const notes = notesFor(second.stdout, PI_PROMPT_REL);
    expect(notes.length, second.stdout).toBe(1);
    const command = agentCommand("install.js", row.target, [piHost()], commandContextFor({ grugopsHome: row.kitHome }));
    expect(notes[0], "the note does not name the command that writes the carrier").toContain(`\`${command}\` writes it`);
    for (const l of second.stdout.split("\n")) expect(l, "a line points at a line this run never printed").not.toContain(`the line above about ${PI_PROMPT_REL}`);
    const others = second.stdout.split("\n").filter((l) => l.includes(PI_PROMPT_REL) && !notes.includes(l));
    expect(others, "premise: no other line of this run names the Pi template").toEqual([]);
    // Run as printed in the user's environment (D-33, WR-19): only the printed text names the kit home.
    const ran = runPrintedCommand(notes[0], { home });
    expect(relative(REPO_ROOT, ran.premise.cwd).startsWith(".."), `premise: the printed command ran from ${ran.premise.cwd}, inside the checkout`).toBe(true);
    expect(pathText(ran.premise.grugopsHome ?? ""), "premise: the printed text set the run's kit home").toBe(pathText(row.kitHome));
    expect(ran.status, ran.stdout + ran.stderr).toBe(0);
    expect(lstatSync(piFile(row.target)).isFile(), "the printed command did not write the Pi template").toBe(true);
    const third = runInstall(row.target, row.kitHome, [agentFlag(opencodeHost())], { home });
    expect(third.status, third.stdout + third.stderr).toBe(0);
    expect(notesFor(third.stdout, PI_PROMPT_REL), third.stdout).toEqual([]);
  });

  it("row B (the carrier's writer ran): the Pi template write refused: the note says `the line above about` the template, and an earlier line of the same stdout names it", () => {
    const row = scratchRow();
    ownAgents(row);
    mkdirSync(join(row.target, ".pi"), { recursive: true });
    writeFileSync(join(row.target, ".pi", "prompts"), "not a directory\n");
    const r = runInstall(row.target, row.kitHome, [agentFlag(piHost())]);
    const lines = r.stdout.split("\n");
    const at = lines.findIndex((l) => notesFor(l, PI_PROMPT_REL).length === 1);
    expect(at, r.stdout).toBeGreaterThan(-1);
    expect(lines[at]).toContain(`the line above about ${PI_PROMPT_REL} says why and what to do`);
    expect(lines.slice(0, at).some((l) => l.includes(PI_PROMPT_REL)), "no earlier line of the run names the Pi template").toBe(true);
  });
});

// ── IN-21 (phase 34.1, D-26; brief REC-1): --check AND A RECORDED AGENT WITH NOTHING INSTALLED ───────────────────────
//
// The `agents` field records the agents chosen for the target and not yet removed (install-marker.ts THE `agents`
// FIELD), so a chosen agent whose every write was refused stays recorded (D-04's retry). The doctor gives such an agent
// no reach line and no counted finding: it owns no holding ledger entry and none of its entry paths is present. One
// uncounted note names it with the command that writes its entry; the test runs exactly that printed command.
/** The doctor's note lines that name `name` as recorded with nothing installed (doctorHosts' nothingInstalled). */
const nothingNotes = (stdout: string, name: string): string[] =>
  linesUnder(stdout, "note").filter((l) => messageOf(l).startsWith(`${name} is recorded in .grugops/install.json as chosen, but nothing is installed for it here`));
/** The doctor's note lines that name `name` with nothing installed when the agent set is `legacy` (plan 34.1-29, D-31,
 *  IN-24): a marker with no `agents` field records nothing as chosen, so the note says where the agent came from. */
const legacyNothingNotes = (stdout: string, name: string): string[] =>
  linesUnder(stdout, "note").filter((l) => messageOf(l).startsWith(`${name} is counted as installed by an install made before this release`));
/** The registry host whose adapter kind is `claude-kit`, found by kind, never by a typed name. */
function claudeHost(): (typeof HOST_TOOLS)[number] {
  const c = HOST_TOOLS.filter((h) => h.adapter === "claude-kit");
  expect(c.length, "premise: exactly one registry host has the claude-kit adapter").toBe(1);
  return c[0];
}

describe("IN-21: --check and a recorded agent with nothing installed (D-26)", () => {
  it("a Pi install whose template and launch-file writes are refused records Pi; --check gives Pi no reach line and no counted finding, and one note with the command; that command, run once the cause is gone, gives Pi a reach line", () => {
    const row = scratchRow();
    const home = join(dirname(row.target), "home");
    mkdirSync(home, { recursive: true });
    // Pi's launch file is one of the entry paths install writes for Pi (quick task 261018-hs8), directly under `.pi/`:
    // the blocker is `.pi` itself as a file, so both of Pi's writes (the template and the launch file) are refused and
    // neither entry path is present (a directory planted at the launch path would be a present entry path). This is
    // the "nothing installed" premise (install-side ownership), which D-06 left as it was: D-06 took launch files out
    // of the route verdicts only.
    const blocker = join(row.target, ".pi");
    writeFileSync(blocker, "not a directory\n");
    expect(existsSync(piFile(row.target)) || existsSync(launchPath(row.target, piHost())), "premise: no Pi entry path is present").toBe(false);
    const r = runInstall(row.target, row.kitHome, [agentFlag(piHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(3);
    const marker = readMarkerObject(row.target);
    expect(marker.agents, "the chosen agent is recorded (D-04)").toEqual([piHost().id]);
    const c = check(row.target, row.kitHome, { home });
    expect(reachLines(c.stdout).filter((l) => messageOf(l).startsWith(`${piHost().name}: `)), c.stdout).toEqual([]);
    expect(c.stdout.split("\n").filter((l) => /^ {2}(FAIL|WARN)\s/.test(l) && l.includes(PI_PROMPT_REL)), c.stdout).toEqual([]);
    expect(countedRouteLines(c.stdout), c.stdout).toEqual([]);
    const notes = nothingNotes(c.stdout, piHost().name);
    expect(notes.length, c.stdout).toBe(1);
    expect(notes[0]).toContain(`\`${agentCommand("install.js", row.target, [piHost()], commandContextFor({ grugopsHome: row.kitHome }))}\``);
    expect(notes[0]).toContain(PI_PROMPT_REL);
    rmSync(blocker);
    const ran = runPrintedCommand(notes[0], { home });
    expect(ran.status, ran.stdout + ran.stderr).toBe(0);
    const after = check(row.target, row.kitHome, { home });
    expect(reachVerdict(after.stdout, piHost()).reaches, after.stdout).toBe(true);
    expect(nothingNotes(after.stdout, piHost().name), after.stdout).toEqual([]);
  });

  it("an installed Pi template deleted: the ledger still holds Pi's entry, so --check prints Pi's reach line (CANNOT reach) and not the note", () => {
    const row = scratchRow();
    ownAgents(row);
    const r = runInstall(row.target, row.kitHome, [agentFlag(piHost())]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    rmSync(piFile(row.target));
    const c = check(row.target, row.kitHome);
    const v = reachVerdict(c.stdout, piHost());
    expect(v.reaches, v.line).toBe(false);
    expect(nothingNotes(c.stdout, piHost().name), c.stdout).toEqual([]);
  });

  it("the user's own Pi template and launch file at Pi's entry paths, with nothing of install's for Pi: Pi keeps its reach line", () => {
    const row = scratchRow();
    ownAgents(row);
    ownPiTemplate(row);
    // Pi's launch file is one of the entry paths install writes for Pi (quick task 261018-hs8): the user's own too, so
    // nothing is install's (an ownership premise; D-06 changed the route verdicts only).
    ownLaunchWithoutRoute(row.target, piHost());
    const r = runInstall(row.target, row.kitHome, [agentFlag(piHost())]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const ledger = readMarkerObject(row.target).ledger as Array<{ path: string; kind: string }>;
    expect(ledger.some((e) => e.path === PI_PROMPT_REL), "premise: install recorded nothing at the user's own template").toBe(false);
    expect(ledger.some((e) => e.path === launchRelOf(piHost())), "premise: install recorded nothing at the user's own launch file").toBe(false);
    const c = check(row.target, row.kitHome);
    expect(reachVerdict(c.stdout, piHost()).line, c.stdout).toContain(PI_PROMPT_REL);
    expect(nothingNotes(c.stdout, piHost().name), c.stdout).toEqual([]);
  });

  // IN-24 (phase 34.1 gap round 2, plan 34.1-29, D-31; DOC-1): the note says only what the doctor read. A `legacy`
  // agent set (a marker with an install ledger and no `agents` field) records nothing as chosen, so the note says the
  // agent is counted as installed by an install made before this release, never "recorded ... as chosen".
  it("IN-24 legacy: a marker with an install ledger and no `agents` field, nothing of Pi's in the ledger and no Pi template: Pi's note says it is counted as installed by an earlier install, not recorded as chosen", () => {
    const row = scratchRow();
    const r = runInstall(row.target, row.kitHome, [agentFlag(claudeHost())]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    withoutAgentsField(row.target);
    const marker = readMarkerObject(row.target);
    expect(Object.prototype.hasOwnProperty.call(marker, "agents"), "premise: the marker has no `agents` field").toBe(false);
    const ledger = marker.ledger as Array<{ path: string }>;
    expect(Array.isArray(ledger) && ledger.length > 0, "premise: the marker keeps its install ledger").toBe(true);
    expect(ledger.some((e) => e.path === PI_PROMPT_REL), "premise: the ledger holds nothing at Pi's entry").toBe(false);
    expect(existsSync(piFile(row.target)), "premise: no Pi template").toBe(false);
    const c = check(row.target, row.kitHome);
    const notes = legacyNothingNotes(c.stdout, piHost().name);
    expect(notes.length, c.stdout).toBe(1);
    expect(notes[0]).toContain("(its marker has no `agents` list)");
    expect(notes[0]).toContain(PI_PROMPT_REL);
    expect(notes[0]).toContain(`\`${agentCommand("install.js", row.target, [piHost()], commandContextFor({ grugopsHome: row.kitHome }))}\``);
    expect(nothingNotes(c.stdout, piHost().name), "a legacy agent is not \"recorded ... as chosen\"").toEqual([]);
    expect(c.stdout).not.toContain(`${piHost().name} is recorded in .grugops/install.json as chosen`);
  });

  // IN-24, the malformed ledger: the doctor cannot tell what install wrote, and it already FAILs on the ledger, so no
  // agent is put in the nothing-installed set. Pi's template and CLAUDE.md are deleted, so neither has an entry path
  // present: only the null answer keeps them on the reach side, and the Claude Code checks still run (the kit-root line
  // reads the adapter KIT= source).
  it("IN-24 malformed: install --claude --pi, a malformed install ledger, Pi's template and CLAUDE.md deleted: the malformed FAIL, no nothing-installed note, a reach line for Pi and for Claude Code, and the kit-root line reads the adapter KIT= source", () => {
    const row = scratchRow();
    const r = runInstall(row.target, row.kitHome, [agentFlag(claudeHost()), agentFlag(piHost())]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const markerPath = join(row.target, ...MARKER_REL.split("/"));
    writeFileSync(markerPath, JSON.stringify(withLedger(readMarkerObject(row.target), (l) => [...l, { kind: "not-a-kind", path: "x" }]), null, 2) + "\n");
    rmSync(piFile(row.target));
    rmSync(join(row.target, "CLAUDE.md"));
    const c = check(row.target, row.kitHome);
    expect(linesUnder(c.stdout, "FAIL").filter((l) => /malformed install ledger/.test(l)).length, c.stdout).toBe(1);
    for (const h of HOST_TOOLS) {
      expect(nothingNotes(c.stdout, h.name), `${h.name}: a nothing-installed note on a ledger the doctor could not read`).toEqual([]);
      expect(legacyNothingNotes(c.stdout, h.name), `${h.name}: a nothing-installed note on a ledger the doctor could not read`).toEqual([]);
    }
    reachVerdict(c.stdout, piHost());
    reachVerdict(c.stdout, claudeHost());
    const kitRoot = linesUnder(c.stdout, "ok").filter((l) => messageOf(l).startsWith("kit-root sources agree ("));
    expect(kitRoot.length, c.stdout).toBe(1);
    expect(kitRoot[0], "the Claude Code checks did not run: no adapter KIT= line was read").not.toContain("no Claude Code adapter is installed here");
  });
});

// ── WR-19 (phase 34.1 gap round 2, D-33; brief §4): A PRINTED COMMAND CARRIES THE KIT HOME THE RUN USED ──────────────
//
// agentCommand takes the run's invocation context (host-tools.ts CommandContext): the absolute script path, and the
// kit home when it is not the default `~/.grugops`. The row is the verifier's reproduction: a kit home other than the
// default, Pi refused, `--check`, and the doctor's printed install command run as printed by runPrintedCommand, from a
// scratch directory outside the checkout with no GRUGOPS_HOME in the inherited environment. Only the printed text can
// name the kit home, so a command that dropped it would write a second kit into `<HOME>/.grugops`.
describe("WR-19 (D-33): a printed command carries the kit home the run used and runs from any directory", () => {
  it("the verifier's reproduction: GRUGOPS_HOME=<K> (not the default), Pi refused, --check; the note's install command, run as printed outside the checkout with no inherited kit home, writes the Pi template, records K and writes no kit under <HOME>/.grugops", () => {
    const row = scratchRow();
    const home = join(dirname(row.target), "home");
    mkdirSync(home, { recursive: true });
    const kitHome = row.kitHome;
    const defaultKit = join(home, ".grugops");
    expect(pathText(kitHome), "premise: the kit home is not the default under HOME").not.toBe(pathText(defaultKit));
    // Pi's launch file is one of the entry paths install writes for Pi (quick task 261018-hs8), directly under `.pi/`:
    // the blocker is `.pi` itself as a file, so both of Pi's writes are refused and neither entry path is present (the
    // "nothing installed" premise, which D-06 left as it was).
    const blocker = join(row.target, ".pi");
    writeFileSync(blocker, "not a directory\n");
    const r = runInstall(row.target, kitHome, [agentFlag(piHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(3);
    const c = check(row.target, kitHome, { home });
    const notes = nothingNotes(c.stdout, piHost().name);
    expect(notes.length, c.stdout).toBe(1);
    const expected = agentCommand("install.js", row.target, [piHost()], commandContextFor({ grugopsHome: kitHome }));
    expect(expected.startsWith("GRUGOPS_HOME="), `premise: the kit home is not the default, so the command carries it: ${expected}`).toBe(true);
    expect(notes[0], "the note does not print the command with the run's kit home").toContain(`\`${expected}\``);
    rmSync(blocker);
    const ran = runPrintedCommand(notes[0], { home });
    expect(relative(REPO_ROOT, ran.premise.cwd).startsWith(".."), `premise: the printed command ran from ${ran.premise.cwd}, inside the checkout`).toBe(true);
    expect(ran.premise.grugopsHome, "premise: the child's GRUGOPS_HOME came from the printed text").toBeDefined();
    expect(pathText(ran.premise.grugopsHome ?? ""), "premise: the printed text set the run's kit home").toBe(pathText(kitHome));
    expect(ran.status, ran.stdout + ran.stderr).toBe(0);
    expect(lstatSync(piFile(row.target)).isFile(), "the printed command did not write the Pi template").toBe(true);
    const marker = readMarkerObject(row.target);
    expect(pathText(String(marker.grugopsHome)), "the marker does not record the run's kit home").toBe(pathText(kitHome));
    expect(existsSync(join(kitHome, "agent-factory")), "the kit home the run used holds no kit").toBe(true);
    expect(existsSync(defaultKit), "a second kit was written into the default kit home <HOME>/.grugops").toBe(false);
  });
});

// ── WR-21 (phase 34.1 gap round 3, D-36; brief §5): THE DOCTOR'S PRINTED COMMANDS CARRY THE RECORD'S KIT HOME ────────
//
// install.ts builds its COMMAND_CONTEXT through host-tools.ts commandContextFromRecord, the one owner. Under `--check`
// the record is the marker the doctor checks: when it reads `ok`, a printed command carries the kit home and install
// mode the marker records, whatever kit home or mode the `--check` run was given. The rows are the verifier's
// reproduction: an install with a kit home K other than the default, AGENTS.md deleted, `--check` run with NO
// GRUGOPS_HOME (so its own kit home is the default under a scratch HOME), and the AGENTS.md remedy's install command
// run as printed by runPrintedCommand, from a scratch directory outside the checkout with no inherited GRUGOPS_HOME.
// Only the printed text can name K, so a command built from the `--check` run would write a second kit into
// `<HOME>/.grugops` and rewrite the marker's kit home there.
/** The registry row with id `codex`, found by id and asserted unique (the WR-21 and WR-25 rows). */
const codexHost = (): (typeof HOST_TOOLS)[number] => {
  const c = HOST_TOOLS.filter((h) => h.id === "codex");
  expect(c.length, "premise: exactly one registry row has the id codex").toBe(1);
  return c[0];
};
/**
 * The words of the AGENTS.md remedy's install command, checked without the builder (plan 34.1-48, D-38): its leading
 * assignments are the ones the tests' own statement of the rule gives an install command for `stated` (statedWords),
 * then `node`, this checkout's install.js, the stated mode words (statedModeWords), `--target <target>`, and no more (no
 * agent flag, no mode). Returns the words from `node` on.
 */
const expectStatedRemedy = (line: string, stated: StatedRun, target: string): readonly string[] => {
  const { assigned, words } = printedInvocation(printedCommand(line));
  expect(statedSpelling(assigned), `the printed command's assignments are not the stated ones: ${line}`).toEqual(statedWords("install.js", stated));
  expect(words[0], line).toBe("node");
  expect(pathText(words[1] ?? ""), line).toBe(pathText(INSTALL_JS));
  const mode = statedModeWords("install.js", stated);
  expect(words.slice(2, 2 + mode.length), `the printed command does not state the install mode the rule gives: ${line}`).toEqual(mode);
  expect(words[2 + mode.length], line).toBe("--target");
  expect(pathText(words[3 + mode.length] ?? ""), line).toBe(pathText(target));
  expect(words.length, `the printed command carries more than the target (an agent flag or a mode): ${line}`).toBe(4 + mode.length);
  return words;
};
/** The one line of --check's output that carries the AGENTS.md absent remedy (install.ts absentRemedy, `create`). */
const agentsRemedyLine = (stdout: string): string => {
  const lines = stdout.split("\n").filter((l) => l.includes("which writes it where nothing is") && l.includes("AGENTS.md"));
  expect(lines.length, `premise: --check printed the AGENTS.md absent remedy once:\n${stdout}`).toBe(1);
  return lines[0];
};
describe("WR-21 (D-36): the doctor's printed commands carry the record's kit home and install mode", () => {
  /** A scratch row and a scratch HOME beside it, with the premise that the row's kit home is not the default. */
  const rowWithHome = (): { target: string; kitHome: string; home: string; defaultKit: string } => {
    const row = scratchRow();
    const home = join(dirname(row.target), "home");
    mkdirSync(home, { recursive: true });
    const defaultKit = join(home, ".grugops");
    expect(pathText(row.kitHome), "premise: the kit home is not the default under HOME").not.toBe(pathText(defaultKit));
    return { ...row, home, defaultKit };
  };

  it("row 1, the verifier's reproduction: install --codex with K, AGENTS.md deleted, --check WITHOUT GRUGOPS_HOME; the AGENTS.md remedy starts GRUGOPS_HOME=<K>, and run as printed outside the checkout it exits 0, writes no default kit and leaves the marker's kit home and kit root as they were", () => {
    const { target, kitHome, home, defaultKit } = rowWithHome();
    const r = runInstall(target, kitHome, [agentFlag(codexHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const before = readMarkerObject(target);
    const recordedHome = String(before.grugopsHome);
    const recordedRoot = String(before.kitRoot);
    expect(pathText(recordedHome), "premise: the marker records K").toBe(pathText(kitHome));
    rmSync(join(target, "AGENTS.md"));
    const c = spawnBin(INSTALL_JS, ["--check"], target, kitHome, { home, omitKitHome: true });
    // Premise inverted by plan 34.1-50 (2026-10-13, D-38, review WR-24): the --check run's own kit home is the default,
    // and the doctor now reads the recorded kit home K for its checks too, the one its printed commands state, so it
    // reports no kit-root disagreement (before, it FAILed "kit-root sources DISAGREE (stale/moved install)" here).
    expect(c.stdout, "the --check run reports a kit-root disagreement on an install that is neither stale nor moved").not.toContain("DISAGREE");
    const line = agentsRemedyLine(c.stdout);
    // Word by word, builder-independent (routed through the tests' statement of the rule by plan 34.1-48, 2026-10-13,
    // D-38): the stated assignments for the record's kit home K and copy mode, node, this checkout's install.js, the
    // stated mode words, --target <target>, no more.
    const words = expectStatedRemedy(line, { kitHome, home }, target);
    expect(words.filter((w) => hostForFlag(w) !== null), line).toEqual([]);
    const ran = runPrintedCommand(line, { home });
    expect(relative(REPO_ROOT, ran.premise.cwd).startsWith(".."), `premise: the printed command ran from ${ran.premise.cwd}, inside the checkout`).toBe(true);
    expect(ran.premise.grugopsHome, "premise: the child's GRUGOPS_HOME came from the printed text").toBeDefined();
    expect(pathText(ran.premise.grugopsHome ?? ""), "premise: the printed text set K").toBe(pathText(kitHome));
    expect(ran.status, ran.stdout + ran.stderr).toBe(0);
    expect(lstatSync(join(target, "AGENTS.md")).isFile(), "the printed command did not write AGENTS.md again").toBe(true);
    expect(existsSync(defaultKit), "a second kit was written into the default kit home <HOME>/.grugops").toBe(false);
    const after = readMarkerObject(target);
    expect(String(after.grugopsHome), "the printed command moved the marker's kit home").toBe(recordedHome);
    expect(String(after.kitRoot), "the printed command moved the marker's kit root").toBe(recordedRoot);
  });

  it("row 2, the install-mode half: install --symlink --codex with K, AGENTS.md deleted, --check WITHOUT --symlink and WITHOUT GRUGOPS_HOME; the AGENTS.md remedy states GRUGOPS_HOME=<K> and INSTALL_MODE=symlink (no --symlink; plan 34.1-48, D-38), and run as printed it exits 0, keeps installMode symlink and the kit home K, and writes no default kit", () => {
    const { target, kitHome, home, defaultKit } = rowWithHome();
    const r = runInstall(target, kitHome, ["--symlink", agentFlag(codexHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const before = readMarkerObject(target);
    expect(before.installMode, "premise: the marker records a symlink install").toBe("symlink");
    expect(pathText(String(before.grugopsHome)), "premise: the marker records K").toBe(pathText(kitHome));
    rmSync(join(target, "AGENTS.md"));
    // spawnBin sets INSTALL_MODE=copy and the arguments carry no --symlink, so this --check run is a copy-mode run.
    const c = spawnBin(INSTALL_JS, ["--check"], target, kitHome, { home, omitKitHome: true });
    const line = agentsRemedyLine(c.stdout);
    // Builder-independent (routed through the tests' statement of the rule by plan 34.1-48, 2026-10-13, D-38): the
    // stated words for the record's kit home K and its symlink mode, so the printed install command states the recorded
    // symlink mode the way the rule says.
    const words = expectStatedRemedy(line, { kitHome, home, installMode: "symlink" }, target);
    // Plan 34.1-48 (2026-10-13, D-38, review WR-25): the mode is stated as INSTALL_MODE=symlink, never as --symlink.
    expect(printedInvocation(printedCommand(line)).assigned.INSTALL_MODE, `the printed command does not state INSTALL_MODE=symlink: ${line}`).toBe("symlink");
    expect(words, `the printed command carries --symlink: ${line}`).not.toContain("--symlink");
    const ran = runPrintedCommand(line, { home });
    expect(relative(REPO_ROOT, ran.premise.cwd).startsWith(".."), `premise: the printed command ran from ${ran.premise.cwd}, inside the checkout`).toBe(true);
    expect(pathText(ran.premise.grugopsHome ?? ""), "premise: the printed text set K").toBe(pathText(kitHome));
    expect(ran.status, ran.stdout + ran.stderr).toBe(0);
    expect(existsSync(join(target, "AGENTS.md")), "the printed command did not write AGENTS.md again").toBe(true);
    const after = readMarkerObject(target);
    expect(after.installMode, "the printed command changed the install mode").toBe("symlink");
    expect(String(after.grugopsHome), "the printed command moved the marker's kit home").toBe(String(before.grugopsHome));
    expect(existsSync(defaultKit), "a second kit was written into the default kit home <HOME>/.grugops").toBe(false);
  });
});

// ── WR-25 (phase 34.1 gap round 4, D-38; brief §6): A PRINTED COMMAND STATES ITS KIT HOME AND INSTALL MODE ───────────
//
// A printed command with no GRUGOPS_HOME word does not mean "the default kit home": it means "whatever GRUGOPS_HOME the
// shell exports". WR-25 reproduced that: a default-home install, AGENTS.md deleted, `--check` run in a shell exporting
// GRUGOPS_HOME to another directory printed an install command with no kit home word, and following it in that shell
// wrote a second kit and moved the install there. D-38 makes every printed command state its kit home
// (`GRUGOPS_HOME=<dir>`, the default included). R49 is WR-25's reproduction, kit-home half (plan 34.1-47), and R50 its
// install-mode half (plan 34.1-48: every printed install command states INSTALL_MODE and GRUGOPS_SRC): the remedy's
// words are checked without the builder, and it is followed by runPrintedCommand, whose child environment holds a
// conflicting GRUGOPS_HOME, INSTALL_MODE, GRUGOPS_SRC and TARGET that only the printed text can override.
describe("WR-25 (D-38): a printed command states its kit home and install mode", () => {
  it("R49 (WR-25, the kit-home half): a default-home copy install --codex, AGENTS.md deleted, --check with GRUGOPS_HOME exported to another directory; the AGENTS.md remedy starts GRUGOPS_HOME=<HOME>/.grugops, and run as printed under a conflicting GRUGOPS_HOME it exits 0, rewrites AGENTS.md, keeps the marker's kit home and kit root, and creates neither the exported nor the conflicting kit home", () => {
    const row = scratchRow();
    const home = join(dirname(row.target), "home");
    mkdirSync(home, { recursive: true });
    const defaultKit = join(home, ".grugops");
    const exported = join(dirname(row.target), "other-kit");
    const r = runInstall(row.target, defaultKit, [agentFlag(codexHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const before = readMarkerObject(row.target);
    expect(pathText(String(before.grugopsHome)), "premise: the marker records the default kit home <HOME>/.grugops").toBe(pathText(defaultKit));
    expect(before.installMode, "premise: a copy install").toBe("copy");
    rmSync(join(row.target, "AGENTS.md"));
    // The --check run's own GRUGOPS_HOME is the exported directory, as in a shell that exports it.
    const c = spawnBin(INSTALL_JS, ["--check"], row.target, exported, { home });
    const line = agentsRemedyLine(c.stdout);
    // Word by word, builder-independent: GRUGOPS_HOME=<HOME>/.grugops, node, this checkout's install.js, --target
    // <target>, no more. Routed through the tests' statement of the rule by plan 34.1-48 (2026-10-13, D-38): the stated
    // assignments for the recorded default kit home and copy mode, then the stated mode words.
    const { assigned } = printedInvocation(printedCommand(line));
    expect(pathText(assigned.GRUGOPS_HOME ?? ""), `the printed GRUGOPS_HOME is not the recorded default <HOME>/.grugops: ${line}`).toBe(pathText(defaultKit));
    expectStatedRemedy(line, { kitHome: defaultKit, home }, row.target);
    expect(existsSync(exported), "premise: the --check run created the exported kit home").toBe(false);
    const ran = runPrintedCommand(line, { home });
    expect(relative(REPO_ROOT, ran.premise.cwd).startsWith(".."), `premise: the printed command ran from ${ran.premise.cwd}, inside the checkout`).toBe(true);
    expect(pathText(ran.premise.grugopsHome), "premise: the child's GRUGOPS_HOME is the printed one").toBe(pathText(defaultKit));
    expect(pathText(ran.premise.conflictingKitHome), "premise: the conflicting GRUGOPS_HOME is the printed one").not.toBe(pathText(defaultKit));
    expect(ran.premise.conflictingKitHomeCreated, "the conflicting kit home was created: the printed command took its kit home from the environment").toBe(false);
    expect(ran.status, ran.stdout + ran.stderr).toBe(0);
    expect(lstatSync(join(row.target, "AGENTS.md")).isFile(), "the printed command did not write AGENTS.md again").toBe(true);
    const after = readMarkerObject(row.target);
    expect(String(after.grugopsHome), "the printed command moved the marker's kit home").toBe(String(before.grugopsHome));
    expect(String(after.kitRoot), "the printed command moved the marker's kit root").toBe(String(before.kitRoot));
    expect(existsSync(exported), "the exported kit home was created").toBe(false);
  });

  // R50 (plan 34.1-48, D-38; review WR-25, the install-mode half): WR-25's reproduction showed that a shell exporting
  // INSTALL_MODE=symlink turned a printed copy-mode remedy, which stated no mode, into a symlink install. The remedy's
  // words are checked without the builder, and it is followed by runPrintedCommand, whose child environment holds a
  // conflicting INSTALL_MODE (symlink), GRUGOPS_SRC (an empty scratch directory) and TARGET (an empty scratch directory)
  // that only the printed text can override.
  it("R50 (WR-25, the mode half): a default-home copy install --codex, AGENTS.md deleted, --check with INSTALL_MODE=symlink exported; the AGENTS.md remedy states INSTALL_MODE=copy and GRUGOPS_SRC=<this checkout> and no --symlink, and run as printed under a conflicting INSTALL_MODE, GRUGOPS_SRC and TARGET it exits 0, keeps the copy install and the kit home, and leaves the conflicting TARGET untouched", () => {
    const row = scratchRow();
    const home = join(dirname(row.target), "home");
    mkdirSync(home, { recursive: true });
    const defaultKit = join(home, ".grugops");
    const r = runInstall(row.target, defaultKit, [agentFlag(codexHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const before = readMarkerObject(row.target);
    expect(pathText(String(before.grugopsHome)), "premise: the marker records the default kit home <HOME>/.grugops").toBe(pathText(defaultKit));
    expect(before.installMode, "premise: a copy install").toBe("copy");
    rmSync(join(row.target, "AGENTS.md"));
    // The --check run is given no GRUGOPS_HOME (its kit home is the default) and INSTALL_MODE=symlink, as in a shell
    // that exports it.
    const c = spawnBin(INSTALL_JS, ["--check"], row.target, defaultKit, { home, omitKitHome: true, installMode: "symlink" });
    const line = agentsRemedyLine(c.stdout);
    // Word by word, builder-independent: exactly the three assignments, each with the value the record and this run
    // give, then node, this checkout's install.js, --target <target>, and no more (no --symlink).
    const { assigned, words } = printedInvocation(printedCommand(line));
    expect(Object.keys(assigned).sort(), `the printed command does not state exactly GRUGOPS_HOME, INSTALL_MODE and GRUGOPS_SRC: ${line}`).toEqual(["GRUGOPS_HOME", "GRUGOPS_SRC", "INSTALL_MODE"]);
    expect(pathText(assigned.GRUGOPS_HOME ?? ""), `the printed GRUGOPS_HOME is not the recorded default: ${line}`).toBe(pathText(defaultKit));
    expect(assigned.INSTALL_MODE, `the printed command does not state the recorded copy mode: ${line}`).toBe("copy");
    expect(pathText(assigned.GRUGOPS_SRC ?? ""), `the printed GRUGOPS_SRC is not this checkout: ${line}`).toBe(pathText(REPO_ROOT));
    expect(words[0], line).toBe("node");
    expect(pathText(words[1] ?? ""), line).toBe(pathText(INSTALL_JS));
    expect(words[2], line).toBe("--target");
    expect(pathText(words[3] ?? ""), line).toBe(pathText(row.target));
    expect(words.length, `the printed command carries more than the target (an agent flag, a mode or --symlink): ${line}`).toBe(4);
    expect(words, `the printed command carries --symlink: ${line}`).not.toContain("--symlink");

    const ran = runPrintedCommand(line, { home });
    expect(relative(REPO_ROOT, ran.premise.cwd).startsWith(".."), `premise: the printed command ran from ${ran.premise.cwd}, inside the checkout`).toBe(true);
    expect(ran.premise.conflictingInstallMode, "premise: the conflicting INSTALL_MODE is not symlink").toBe("symlink");
    expect(ran.premise.installModeBeforePrinted, "premise: the child's environment did not hold INSTALL_MODE=symlink before the printed assignments").toBe("symlink");
    expect(ran.premise.installMode, "premise: the child's INSTALL_MODE is not the printed copy").toBe("copy");
    expect(ran.premise.srcBeforePrinted, "premise: the child's environment did not hold the conflicting GRUGOPS_SRC before the printed assignments").toBe(ran.premise.conflictingSrc);
    expect(pathText(ran.premise.conflictingSrc), "premise: the conflicting GRUGOPS_SRC is this checkout").not.toBe(pathText(REPO_ROOT));
    expect(pathText(ran.premise.grugopsSrc), "premise: the child's GRUGOPS_SRC is not this checkout").toBe(pathText(REPO_ROOT));
    expect(ran.premise.targetBeforeRun, "premise: the child's environment did not hold the conflicting TARGET").toBe(ran.premise.conflictingTarget);
    expect(pathText(ran.premise.grugopsHome), "premise: the child's GRUGOPS_HOME is not the printed one").toBe(pathText(defaultKit));
    expect(ran.status, ran.stdout + ran.stderr).toBe(0);
    expect(ran.premise.conflictingTargetEmpty, "the printed command wrote into the conflicting TARGET").toBe(true);
    expect(ran.premise.conflictingKitHomeCreated, "the printed command created the conflicting kit home").toBe(false);
    const agents = lstatSync(join(row.target, "AGENTS.md"));
    expect(agents.isSymbolicLink(), "the printed command made AGENTS.md a link: it ran as a symlink install").toBe(false);
    expect(agents.isFile(), "the printed command did not write AGENTS.md again").toBe(true);
    const after = readMarkerObject(row.target);
    expect(after.installMode, "the printed command changed the install mode").toBe("copy");
    expect(String(after.grugopsHome), "the printed command moved the marker's kit home").toBe(String(before.grugopsHome));
    expect(String(after.kitRoot), "the printed command moved the marker's kit root").toBe(String(before.kitRoot));
  });

  // R51 (plan 34.1-49, D-38; DI-16): the doctor's no-marker FAIL (install.ts notInstalled) printed an install command
  // without its kit home. Since plan 34.1-47 every printed command states it; this row follows that FAIL as printed. The
  // other DI-16 arm, the unreadable-marker FAIL, prints no install command since plan 34.1-44 (D-37). A fresh target with
  // a `.claude/` directory, so install detects Claude Code unattended, gets `--check` with kit home K: the FAIL's install
  // command is checked word by word without the builder, then run as printed in a child environment that holds a
  // conflicting GRUGOPS_HOME, INSTALL_MODE, GRUGOPS_SRC and TARGET; then the FAIL's check command is run as printed.
  it("R51 (DI-16): `--check` with kit home K in a target with no marker prints a 'not installed' FAIL whose install command states GRUGOPS_HOME=<K>, INSTALL_MODE=copy and GRUGOPS_SRC; run as printed under conflicting values it installs with kit home K in copy mode, and the FAIL's check command run as printed then exits 0 with no FAIL", () => {
    const row = scratchRow();
    const home = join(dirname(row.target), "home");
    mkdirSync(home, { recursive: true });
    const defaultKit = join(home, ".grugops");
    expect(pathText(row.kitHome), "premise: the kit home K is not the default <HOME>/.grugops").not.toBe(pathText(defaultKit));
    mkdirSync(join(row.target, ".claude"));
    expect(existsSync(join(row.target, MARKER_REL)), "premise: the target holds no marker").toBe(false);
    const c = check(row.target, row.kitHome, { home });
    expect(c.status, c.stdout + c.stderr).toBe(1);
    const fails = c.stdout.split("\n").filter((l) => l.includes("FAIL") && l.includes("grugops not installed in"));
    expect(fails.length, `premise: --check printed the 'not installed' FAIL once:\n${c.stdout}`).toBe(1);
    const fail = fails[0];
    const spans = printedCommands(fail);
    expect(spans.length, `the FAIL does not carry exactly an install command and a check command: ${fail}`).toBe(2);
    // Word by word, without the builder: the stated assignments for K and copy (statedWords), node, this checkout's
    // install.js, the stated mode words, --target <target>, and no more; the check command the same with --check last.
    const stated: StatedRun = { kitHome: row.kitHome, home };
    const installWords = expectStatedRemedy(`\`${spans[0]}\``, stated, row.target);
    expect(installWords.filter((w) => hostForFlag(w) !== null), spans[0]).toEqual([]);
    const { assigned } = printedInvocation(spans[0]);
    expect(pathText(assigned.GRUGOPS_HOME ?? ""), `the printed GRUGOPS_HOME is not K: ${spans[0]}`).toBe(pathText(row.kitHome));
    expect(assigned.INSTALL_MODE, `the printed command does not state copy: ${spans[0]}`).toBe("copy");
    expect(pathText(assigned.GRUGOPS_SRC ?? ""), `the printed GRUGOPS_SRC is not this checkout: ${spans[0]}`).toBe(pathText(REPO_ROOT));
    const checkInv = printedInvocation(spans[1]);
    expect(statedSpelling(checkInv.assigned), `the check command's assignments are not the stated ones: ${spans[1]}`).toEqual(statedWords("install.js", stated));
    expect(checkInv.words[0], spans[1]).toBe("node");
    expect(pathText(checkInv.words[1] ?? ""), spans[1]).toBe(pathText(INSTALL_JS));
    expect(checkInv.words.slice(2).map((w, i) => (i === 1 ? pathText(w) : w)), spans[1]).toEqual(["--target", pathText(row.target), "--check"]);

    // The install command, followed as printed (runPrintedCommand runs the first printed command in the text).
    const ran = runPrintedCommand(fail, { home });
    expect(relative(REPO_ROOT, ran.premise.cwd).startsWith(".."), `premise: the printed command ran from ${ran.premise.cwd}, inside the checkout`).toBe(true);
    expect(ran.premise.kitHomeBeforePrinted, "premise: the child's environment did not hold the conflicting GRUGOPS_HOME before the printed assignments").toBe(ran.premise.conflictingKitHome);
    expect(pathText(ran.premise.grugopsHome), "premise: the child's GRUGOPS_HOME is not the printed K").toBe(pathText(row.kitHome));
    expect(ran.premise.installModeBeforePrinted, "premise: the child's environment did not hold the conflicting INSTALL_MODE").toBe("symlink");
    expect(ran.premise.installMode, "premise: the child's INSTALL_MODE is not the printed copy").toBe("copy");
    expect(ran.premise.srcBeforePrinted, "premise: the child's environment did not hold the conflicting GRUGOPS_SRC").toBe(ran.premise.conflictingSrc);
    expect(ran.premise.targetBeforeRun, "premise: the child's environment did not hold the conflicting TARGET").toBe(ran.premise.conflictingTarget);
    expect(ran.status, ran.stdout + ran.stderr).toBe(0);
    expect(ran.premise.conflictingKitHomeCreated, "the conflicting kit home was created: the printed command took its kit home from the environment").toBe(false);
    expect(ran.premise.conflictingTargetEmpty, "the printed command wrote into the conflicting TARGET").toBe(true);
    expect(existsSync(defaultKit), "a kit was written into the default kit home <HOME>/.grugops").toBe(false);
    const marker = readMarkerObject(row.target);
    expect(pathText(String(marker.grugopsHome)), "the marker does not record the kit home K").toBe(pathText(row.kitHome));
    expect(marker.installMode, "the marker does not record copy mode").toBe("copy");
    expect(lstatSync(join(row.target, "AGENTS.md")).isSymbolicLink(), "AGENTS.md is a link: the printed command ran as a symlink install").toBe(false);

    // The FAIL's check command, followed as printed: it now finds the install and reports no FAIL.
    const checked = runPrintedCommand(`\`${spans[1]}\``, { home });
    expect(pathText(checked.premise.grugopsHome), "premise: the check's GRUGOPS_HOME is not the printed K").toBe(pathText(row.kitHome));
    expect(checked.premise.kitHomeBeforePrinted, "premise: the check's environment did not hold the conflicting GRUGOPS_HOME").toBe(checked.premise.conflictingKitHome);
    expect(checked.status, checked.stdout + checked.stderr).toBe(0);
    expect(checked.stdout.split("\n").filter((l) => /\bFAIL\b/.test(l)), checked.stdout).toEqual([]);
    expect(checked.premise.conflictingKitHomeCreated, "the check created the conflicting kit home").toBe(false);
    expect(existsSync(defaultKit), "the check wrote the default kit home <HOME>/.grugops").toBe(false);
  });

  // ── R52 (plan 34.1-50, D-38; review WR-24): ONE KIT HOME PER --check RUN ──────────────────────────────────────────
  //
  // WR-24: since gap round 3 the doctor's printed commands take the kit home from the record (commandContextFromRecord),
  // while its header, the kit-root cross-check's rule source, the stat checks and the stale-adapter wording took the
  // run's own. A plain `--check` (no GRUGOPS_HOME, so the run's kit home is the default under HOME) on an install with
  // kit home K therefore FAILed "kit-root sources DISAGREE (stale/moved install)", and following the printed remedy did
  // not clear it. These rows run that plain `--check` and assert it reads one kit home, the recorded K, everywhere.
  /** The value of the doctor's header line `<label>:` (the one line of stdout that starts with it), in pathText's spelling. */
  const headerValue = (stdout: string, label: string): string => {
    const lines = stdout.split(/\r?\n/).filter((l) => l.startsWith(`${label}:`));
    expect(lines.length, `premise: the doctor printed one \`${label}:\` header line:\n${stdout}`).toBe(1);
    return pathText(lines[0].slice(label.length + 1).trim());
  };
  /** The doctor's FAIL lines. */
  const failLines = (stdout: string): string[] => stdout.split(/\r?\n/).filter((l) => /\bFAIL\b/.test(l));
  /** A scratch row with a scratch HOME beside it, the premise that K is not the default kit home, and an install --codex with K. */
  const codexWithOwnKitHome = (): { target: string; kitHome: string; home: string; defaultKit: string } => {
    const row = scratchRow();
    const home = join(dirname(row.target), "home");
    mkdirSync(home, { recursive: true });
    const defaultKit = join(home, ".grugops");
    expect(pathText(row.kitHome), "premise: the kit home K is not the default <HOME>/.grugops").not.toBe(pathText(defaultKit));
    const r = runInstall(row.target, row.kitHome, [agentFlag(codexHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(pathText(String(readMarkerObject(row.target).grugopsHome)), "premise: the marker records K").toBe(pathText(row.kitHome));
    return { ...row, home, defaultKit };
  };
  /** `--check` with no GRUGOPS_HOME in its environment (its own kit home is <HOME>/.grugops): the user's plain `--check`. */
  const plainCheck = (target: string, kitHome: string, home: string, extra: readonly string[] = []): Run =>
    spawnBin(INSTALL_JS, ["--check", ...extra], target, kitHome, { home, omitKitHome: true });

  it("R52 (WR-24): install --codex with kit home K, then a plain --check with no GRUGOPS_HOME: exit 0, no FAIL and no DISAGREE; the home: and kit: header lines name K and its agent-factory; one header line names <HOME>/.grugops as this run's kit home, not used; the kit-root ok line names K's agent-factory. After AGENTS.md is deleted its printed remedy, run as printed, exits 0 and the same plain --check then passes; a malformed-ledger FAIL's printed check command, run as printed after the by-hand fix, exits 0 with no FAIL; <HOME>/.grugops is never created", () => {
    const { target, kitHome, home, defaultKit } = codexWithOwnKitHome();
    const kitRoot = join(kitHome, "agent-factory");

    const c = plainCheck(target, kitHome, home);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    expect(failLines(c.stdout), c.stdout).toEqual([]);
    expect(c.stdout.split(/\r?\n/).filter((l) => l.includes("DISAGREE")), c.stdout).toEqual([]);
    expect(headerValue(c.stdout, "home"), "the home: header does not name the recorded kit home K").toBe(pathText(kitHome));
    expect(headerValue(c.stdout, "kit"), "the kit: header does not name K's agent-factory").toBe(pathText(kitRoot));
    const naming = c.stdout.split(/\r?\n/).filter((l) => l.includes(pathText(defaultKit)));
    expect(naming.length, `one line names this run's own kit home <HOME>/.grugops:\n${c.stdout}`).toBe(1);
    expect(naming[0].startsWith("given:"), `the line naming this run's kit home is not a header line: ${naming[0]}`).toBe(true);
    expect(naming[0], "the header line does not say the run's kit home is this run's").toContain("this run's kit home");
    expect(naming[0], "the header line does not say the run's kit home is not used").toContain("not used");
    const agree = linesUnder(c.stdout, "ok").filter((l) => messageOf(l).startsWith("kit-root sources agree ("));
    expect(agree.length, c.stdout).toBe(1);
    expect(agree[0], "the kit-root ok line does not name K's agent-factory").toContain(pathText(kitRoot));
    expect(existsSync(defaultKit), "the plain --check created <HOME>/.grugops").toBe(false);

    // AGENTS.md deleted: the plain --check prints its remedy; the remedy run as printed restores it, and the same plain
    // --check passes again.
    rmSync(join(target, "AGENTS.md"));
    const d = plainCheck(target, kitHome, home);
    expect(failLines(d.stdout), d.stdout).toEqual([]);
    const ran = runPrintedCommand(agentsRemedyLine(d.stdout), { home });
    expect(relative(REPO_ROOT, ran.premise.cwd).startsWith(".."), `premise: the printed command ran from ${ran.premise.cwd}, inside the checkout`).toBe(true);
    expect(pathText(ran.premise.grugopsHome), "premise: the printed command states K").toBe(pathText(kitHome));
    expect(ran.status, ran.stdout + ran.stderr).toBe(0);
    expect(lstatSync(join(target, "AGENTS.md")).isFile(), "the printed command did not write AGENTS.md again").toBe(true);
    const again = plainCheck(target, kitHome, home);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    expect(failLines(again.stdout), again.stdout).toEqual([]);

    // The doctor's printed check command: a malformed install ledger gives a FAIL whose remedy is a by-hand fix and
    // then the check command. The fix applied by hand (the marker's bytes restored), the check command run as printed
    // exits 0 with no FAIL.
    const markerPath = join(target, ...MARKER_REL.split("/"));
    const good = readFileSync(markerPath);
    writeFileSync(markerPath, JSON.stringify(withLedger(readMarkerObject(target), (l) => [...l, { kind: "not-a-kind", path: "x" }]), null, 2) + "\n");
    const m = plainCheck(target, kitHome, home);
    const malformed = linesUnder(m.stdout, "FAIL").filter((l) => l.includes("malformed install ledger"));
    expect(malformed.length, m.stdout).toBe(1);
    expect(failLines(m.stdout).filter((l) => l.includes("DISAGREE")), m.stdout).toEqual([]);
    const spans = printedCommands(malformed[0]);
    const checkSpan = spans[spans.length - 1] ?? "";
    expect(printedInvocation(checkSpan).words.slice(-1), `premise: the FAIL's last printed command is the check command: ${malformed[0]}`).toEqual(["--check"]);
    writeFileSync(markerPath, good);
    const checked = runPrintedCommand(`\`${checkSpan}\``, { home });
    expect(pathText(checked.premise.grugopsHome), "premise: the printed check command states K").toBe(pathText(kitHome));
    expect(checked.premise.kitHomeBeforePrinted, "premise: the check's environment held the conflicting GRUGOPS_HOME").toBe(checked.premise.conflictingKitHome);
    expect(checked.status, checked.stdout + checked.stderr).toBe(0);
    expect(failLines(checked.stdout), checked.stdout).toEqual([]);
    expect(existsSync(defaultKit), "<HOME>/.grugops was created").toBe(false);
  });

  // R52 control (plan 34.1-50, D-38): reading the recorded kit home must not hide a real stale or moved install. The
  // marker's kitRoot is set by hand to a directory that holds no kit (the marker still reads `ok`), so the recorded kit
  // home and the recorded kit root disagree: the plain --check FAILs naming that directory. Its printed remedy (the kit
  // route FAIL's install command, then its check command) is followed as printed and clears it.
  it("R52 control (a moved kit): install --codex with K, the marker's kitRoot set by hand to a directory with no kit: a plain --check exits 1 and FAILs 'kit-root sources DISAGREE (stale/moved install)' naming that directory; the kit route FAIL's install command and then its check command, run as printed, re-record K's kit root and exit 0", () => {
    const { target, kitHome, home, defaultKit } = codexWithOwnKitHome();
    const moved = join(dirname(target), "moved", "agent-factory");
    const markerPath = join(target, ...MARKER_REL.split("/"));
    writeFileSync(markerPath, JSON.stringify({ ...readMarkerObject(target), kitRoot: moved }, null, 2) + "\n");
    expect(existsSync(moved), "premise: the hand-set kitRoot holds no kit").toBe(false);
    const c = plainCheck(target, kitHome, home);
    expect(c.status, c.stdout + c.stderr).toBe(1);
    expect(headerValue(c.stdout, "home"), "premise: the marker still reads ok, so the doctor reads its kit home K").toBe(pathText(kitHome));
    const disagree = linesUnder(c.stdout, "FAIL").filter((l) => messageOf(l).startsWith("kit-root sources DISAGREE (stale/moved install)"));
    expect(disagree.length, c.stdout).toBe(1);
    expect(disagree[0], "the DISAGREE FAIL does not name the moved directory").toContain(`marker=${pathText(moved)}`);
    expect(disagree[0], "the DISAGREE FAIL does not name the recorded kit root as the rule").toContain(`rule=${pathText(join(kitHome, "agent-factory"))}`);

    const route = linesUnder(c.stdout, "FAIL").filter((l) => messageOf(l).startsWith("kit route: the `kitRoot` field"));
    expect(route.length, c.stdout).toBe(1);
    const spans = printedCommands(route[0]);
    expect(spans.length, `premise: the kit route FAIL prints an install command and a check command: ${route[0]}`).toBe(2);
    const ran = runPrintedCommand(`\`${spans[0]}\``, { home });
    expect(pathText(ran.premise.grugopsHome), "premise: the printed install command states K").toBe(pathText(kitHome));
    expect(ran.status, ran.stdout + ran.stderr).toBe(0);
    expect(pathText(String(readMarkerObject(target).kitRoot)), "the printed install command did not re-record K's kit root").toBe(pathText(join(kitHome, "agent-factory")));
    const checked = runPrintedCommand(`\`${spans[1]}\``, { home });
    expect(checked.status, checked.stdout + checked.stderr).toBe(0);
    expect(failLines(checked.stdout), checked.stdout).toEqual([]);
    expect(existsSync(defaultKit), "<HOME>/.grugops was created").toBe(false);
  });

  // R52b (plan 34.1-50, D-38): over a marker the doctor cannot use, nothing is recorded to read, so the header and the
  // checks keep the run's kit home, which is also the kit home its printed commands state (commandContextFromRecord
  // falls back to the run's). A trailing comma makes the marker unreadable; --check is given GRUGOPS_HOME=K2.
  it("R52b (an unusable marker): a marker with a trailing comma, --check with GRUGOPS_HOME=K2: the home: header names K2 (the run's), no line names a kit home as not used, and the FAIL's printed check command states GRUGOPS_HOME=<K2>", () => {
    const { target, kitHome, home } = codexWithOwnKitHome();
    const k2 = join(dirname(target), "kit2");
    expect(pathText(k2), "premise: K2 is not the recorded K").not.toBe(pathText(kitHome));
    const markerPath = join(target, ...MARKER_REL.split("/"));
    const text = readFileSync(markerPath, "utf8");
    const at = text.lastIndexOf("}");
    writeFileSync(markerPath, `${text.slice(0, at).trimEnd()},\n}\n`);
    expect(() => JSON.parse(readFileSync(markerPath, "utf8")), "premise: the marker is not valid JSON").toThrow();
    const c = spawnBin(INSTALL_JS, ["--check"], target, k2, { home });
    expect(c.status, c.stdout + c.stderr).toBe(1);
    expect(headerValue(c.stdout, "home"), "the home: header does not name the run's kit home K2 over an unusable marker").toBe(pathText(k2));
    expect(headerValue(c.stdout, "kit"), "the kit: header does not name K2's agent-factory").toBe(pathText(join(k2, "agent-factory")));
    expect(c.stdout.split(/\r?\n/).filter((l) => l.startsWith("given:")), "a kit home is named as not used, but nothing recorded is read").toEqual([]);
    const fails = linesUnder(c.stdout, "FAIL");
    expect(fails.length, c.stdout).toBe(1);
    const spans = printedCommands(fails[0]);
    const checkSpan = spans[spans.length - 1] ?? "";
    const inv = printedInvocation(checkSpan);
    expect(inv.words.slice(-1), `premise: the FAIL's last printed command is the check command: ${fails[0]}`).toEqual(["--check"]);
    expect(pathText(inv.assigned.GRUGOPS_HOME ?? ""), `the FAIL's check command does not state the run's kit home K2: ${checkSpan}`).toBe(pathText(k2));
  });

  // R52c (plan 34.1-50, D-38; the WR-24 sibling the line search over doctor() missed, found by the WR-24 census in
  // install/agents-record.test.ts): the doctor's stale-adapter compare renders each adapter through transformAdapter,
  // which wrote this run's KIT_ROOT into the adapter's KIT= line. Under a plain --check on a Claude Code install with
  // kit home K, every adapter then read as stale (a FAIL under --strict), and the printed re-install, which writes K's
  // kit root, could not clear it. The doctor's render now writes the kit root the doctor reads (the recorded one).
  it("R52c (WR-24, the stale-adapter render): a Claude Code install with kit home K, then a plain --check with no GRUGOPS_HOME prints no 'stale adapter' line and exits 0 with no FAIL; --check --strict the same", () => {
    const row = scratchRow();
    const home = join(dirname(row.target), "home");
    mkdirSync(home, { recursive: true });
    const defaultKit = join(home, ".grugops");
    expect(pathText(row.kitHome), "premise: the kit home K is not the default <HOME>/.grugops").not.toBe(pathText(defaultKit));
    const r = runInstall(row.target, row.kitHome, [agentFlag(claudeHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const agents = readdirSync(join(row.target, ".claude", "agents")).filter((f) => f.endsWith(".md"));
    expect(agents.length, "premise: the install laid Claude Code adapters down, so the compare has something to compare").toBeGreaterThan(0);
    for (const extra of [[], ["--strict"]] as const) {
      const c = plainCheck(row.target, row.kitHome, home, extra);
      expect(c.stdout.split(/\r?\n/).filter((l) => l.includes("stale adapter")), `--check ${extra.join(" ")}: an adapter reads as stale`).toEqual([]);
      expect(c.stdout, `--check ${extra.join(" ")}: the staleness compare reached no verdict`).not.toContain("NO VERDICT on adapter staleness");
      expect(failLines(c.stdout), c.stdout).toEqual([]);
      expect(c.status, `--check ${extra.join(" ")}\n${c.stdout}${c.stderr}`).toBe(0);
    }
    expect(existsSync(defaultKit), "<HOME>/.grugops was created").toBe(false);
  });

  // ── R54 (plan 34.1-56, D-40 item 1 as narrowed by D-42; review WR-37): A KIT HOME MOVED BY HAND ─────────────────────
  //
  // WR-37: since WR-24 all three kit-root sources come from the record, so a kit home the user moved by hand read
  // "kit-root sources agree" right above a FAIL on the absent kit, and every install command the doctor printed copied a
  // second kit to the old recorded home. D-42: when the `--check` run is given a kit home (GRUGOPS_HOME) other than the
  // recorded one, the recorded kit root holds no kit and the given kit home's agent-factory holds one, the cross-check
  // prints one FAIL naming both kit homes. Its remedy is by hand and writes no kit (move the kit home back, then the
  // printed check command); the line says the install commands on the doctor's other lines copy a kit to the recorded
  // kit home. A plain `--check` (no GRUGOPS_HOME) does not detect a moved kit home. Kit homes are counted with the same
  // test the doctor's kitReal makes: `<kit home>/agent-factory/roles/orchestrator.md` exists.
  /** Whether `kitHome/agent-factory` holds a kit, by the doctor's own test (install.ts kitReal). */
  const holdsKit = (kitHome: string): boolean => existsSync(join(kitHome, "agent-factory", "roles", "orchestrator.md"));
  /** The doctor's `kit home moved:` FAIL lines. */
  const movedLines = (stdout: string): string[] => linesUnder(stdout, "FAIL").filter((l) => messageOf(l).startsWith("kit home moved:"));
  /** The doctor's `kit-root sources agree` ok lines. */
  const agreeLines = (stdout: string): string[] => linesUnder(stdout, "ok").filter((l) => messageOf(l).startsWith("kit-root sources agree"));
  /** Every printed installer command of a run's output, line by line. */
  const commandsOf = (stdout: string): string[] => stdout.split(/\r?\n/).flatMap((l) => printedCommands(l));

  it("R54 (WR-37, D-42): install --codex with kit home A, A moved by hand to B, --check with GRUGOPS_HOME=B: exit 1, one 'kit home moved:' FAIL naming A and B whose only printed command is the check command (GRUGOPS_HOME=<A>) and which says the other lines' install commands copy a kit to A, no 'kit-root sources agree' line, every other printed install command states A. B moved back to A by hand, the check command run as printed exits 0 with no FAIL, and exactly one kit exists: A's, with no backup copy, no B and no <HOME>/.grugops", () => {
    const { target, kitHome, home, defaultKit } = codexWithOwnKitHome();
    const moved = join(dirname(target), "moved-kit");
    expect(holdsKit(kitHome), "premise: the install put a kit in A").toBe(true);
    renameSync(kitHome, moved);
    expect(holdsKit(moved) && !existsSync(kitHome), "premise: the kit home moved by hand from A to B").toBe(true);

    const c = spawnBin(INSTALL_JS, ["--check"], target, moved, { home });
    expect(c.status, c.stdout + c.stderr).toBe(1);
    expect(headerValue(c.stdout, "home"), "premise: the marker reads ok, so the doctor reads its recorded kit home A").toBe(pathText(kitHome));
    const lines = movedLines(c.stdout);
    expect(lines.length, `one 'kit home moved:' FAIL:\n${c.stdout}`).toBe(1);
    const line = lines[0];
    expect(lineNamesPath(line, kitHome), `the moved-kit FAIL does not name the recorded kit home A: ${line}`).toBe(true);
    expect(lineNamesPath(line, moved), `the moved-kit FAIL does not name the given kit home B: ${line}`).toBe(true);
    expect(agreeLines(c.stdout), "a 'kit-root sources agree' line beside a moved kit home").toEqual([]);
    const spans = printedCommands(line);
    expect(spans.length, `the moved-kit FAIL prints exactly one command: ${line}`).toBe(1);
    const inv = printedInvocation(spans[0]);
    expect(inv.words.slice(-1), `the moved-kit FAIL's command is not the check command: ${line}`).toEqual(["--check"]);
    expect(pathText(inv.assigned.GRUGOPS_HOME ?? ""), `the moved-kit FAIL's check command does not state A: ${line}`).toBe(pathText(kitHome));
    expect(pathText(line), "the moved-kit FAIL does not say the other lines' install commands copy a kit to A").toContain(`copy a kit to ${pathText(kitHome)}.`);
    const installs = commandsOf(c.stdout).filter((s) => printedInvocation(s).words.slice(-1)[0] !== "--check");
    expect(installs.length, `premise: the run printed an install command on another line (the kit route FAIL's):\n${c.stdout}`).toBeGreaterThan(0);
    for (const s of installs) expect(pathText(printedInvocation(s).assigned.GRUGOPS_HOME ?? ""), `a printed install command does not state A: ${s}`).toBe(pathText(kitHome));

    // The by-hand step, then the check command as printed.
    renameSync(moved, kitHome);
    const ran = runPrintedCommand(line, { home });
    expect(relative(REPO_ROOT, ran.premise.cwd).startsWith(".."), `premise: the printed command ran from ${ran.premise.cwd}, inside the checkout`).toBe(true);
    expect(ran.premise.kitHomeBeforePrinted, "premise: the child's environment held the conflicting GRUGOPS_HOME").toBe(ran.premise.conflictingKitHome);
    expect(ran.premise.installModeBeforePrinted, "premise: the child's environment held the conflicting INSTALL_MODE").toBe(ran.premise.conflictingInstallMode);
    expect(pathText(ran.premise.grugopsHome), "premise: the printed check command states A").toBe(pathText(kitHome));
    expect(ran.status, ran.stdout + ran.stderr).toBe(0);
    expect(failLines(ran.stdout), ran.stdout).toEqual([]);
    expect(ran.premise.conflictingKitHomeCreated, "the conflicting kit home was created").toBe(false);
    // Exactly one kit: A's.
    expect(holdsKit(kitHome), "A holds no kit after the move back").toBe(true);
    expect(existsSync(moved), "B still exists after the move back").toBe(false);
    expect(existsSync(defaultKit), "<HOME>/.grugops was created").toBe(false);
    expect(readdirSync(kitHome).filter((e) => e.startsWith("agent-factory.bak.")), "A holds a backup copy of the kit").toEqual([]);
  });

  it("R54 with Claude Code (WR-37, D-42): install --claude --codex with kit home A (an adapter KIT= line present), A moved to B, --check with GRUGOPS_HOME=B: exit 1, one 'kit home moved:' FAIL and no 'kit-root sources agree' line", () => {
    const row = scratchRow();
    const home = join(dirname(row.target), "home");
    mkdirSync(home, { recursive: true });
    const r = runInstall(row.target, row.kitHome, [agentFlag(claudeHost()), agentFlag(codexHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(readdirSync(join(row.target, ".claude", "agents")).some((f) => f.endsWith(".md")), "premise: Claude Code adapters (with their KIT= line) are installed").toBe(true);
    const moved = join(dirname(row.target), "moved-kit");
    renameSync(row.kitHome, moved);
    const c = spawnBin(INSTALL_JS, ["--check"], row.target, moved, { home });
    expect(c.status, c.stdout + c.stderr).toBe(1);
    const lines = movedLines(c.stdout);
    expect(lines.length, `one 'kit home moved:' FAIL:\n${c.stdout}`).toBe(1);
    expect(lineNamesPath(lines[0], row.kitHome) && lineNamesPath(lines[0], moved), `the moved-kit FAIL does not name A and B: ${lines[0]}`).toBe(true);
    expect(printedCommands(lines[0]).length, `the moved-kit FAIL prints exactly one command: ${lines[0]}`).toBe(1);
    expect(agreeLines(c.stdout), "a 'kit-root sources agree' line beside a moved kit home").toEqual([]);
  });

  it("R54 control (not given, D-42): with another repository's kit at the default <HOME>/.grugops, the moved install under a plain --check (no GRUGOPS_HOME) prints no 'kit home moved:' line, never tells the user to move <HOME>/.grugops, and exits 1 with a FAIL naming <A>/agent-factory", () => {
    const { target, kitHome, home, defaultKit } = codexWithOwnKitHome();
    const other = scratchRow();
    const seeded = runInstall(other.target, defaultKit, [agentFlag(codexHost())], { home, omitKitHome: true });
    expect(seeded.status, seeded.stdout + seeded.stderr).toBe(0);
    expect(holdsKit(defaultKit), "premise: the default kit home <HOME>/.grugops holds another repository's kit").toBe(true);
    const moved = join(dirname(target), "moved-kit");
    renameSync(kitHome, moved);
    const c = plainCheck(target, kitHome, home);
    expect(c.status, c.stdout + c.stderr).toBe(1);
    expect(movedLines(c.stdout), "a plain --check detected a moved kit home (D-42: not detected without GRUGOPS_HOME)").toEqual([]);
    const moveDefault = c.stdout.split(/\r?\n/).filter((l) => /\bmove\b/i.test(l) && lineNamesPath(l, defaultKit));
    expect(moveDefault, "a line tells the user to move the shared default kit home").toEqual([]);
    const kitRoot = join(kitHome, "agent-factory");
    expect(failLines(c.stdout).some((l) => lineNamesPath(l, kitRoot)), `no FAIL names <A>/agent-factory:\n${c.stdout}`).toBe(true);
  });

  it("R54 control (given, no kit, D-42): the moved install, --check given a third kit home that holds no kit: no 'kit home moved:' line", () => {
    const { target, kitHome, home } = codexWithOwnKitHome();
    const moved = join(dirname(target), "moved-kit");
    renameSync(kitHome, moved);
    const third = join(dirname(target), "third-kit");
    expect(holdsKit(third), "premise: the third kit home holds no kit").toBe(false);
    const c = spawnBin(INSTALL_JS, ["--check"], target, third, { home });
    expect(c.status, c.stdout + c.stderr).toBe(1);
    expect(movedLines(c.stdout), "a moved-kit line for a given kit home that holds no kit").toEqual([]);
    expect(existsSync(third), "the --check run created the third kit home").toBe(false);
  });

  it("R54 control (both hold a kit, D-42): kit home A not moved, another repository installed with kit home K2, --check on the first given GRUGOPS_HOME=K2: no 'kit home moved:' line, one 'kit-root sources agree' line naming A's agent-factory, and the given: header names K2 as not used", () => {
    const { target, kitHome, home } = codexWithOwnKitHome();
    const other = scratchRow();
    const r = runInstall(other.target, other.kitHome, [agentFlag(codexHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(holdsKit(kitHome) && holdsKit(other.kitHome), "premise: both A and K2 hold a kit").toBe(true);
    const c = spawnBin(INSTALL_JS, ["--check"], target, other.kitHome, { home });
    expect(c.status, c.stdout + c.stderr).toBe(0);
    expect(movedLines(c.stdout), "a moved-kit line while the recorded kit home still holds its kit").toEqual([]);
    const agree = agreeLines(c.stdout);
    expect(agree.length, c.stdout).toBe(1);
    expect(lineNamesPath(agree[0], join(kitHome, "agent-factory")), `the agree line does not name A's agent-factory: ${agree[0]}`).toBe(true);
    const given = c.stdout.split(/\r?\n/).filter((l) => l.startsWith("given:"));
    expect(given.length, c.stdout).toBe(1);
    expect(lineNamesPath(given[0], other.kitHome), `the given: header does not name K2: ${given[0]}`).toBe(true);
    expect(given[0], "the given: header does not say K2 is not used").toContain("not used");
  });

  // ── R54 under D-45 (plan 34.1-58; review CR-08, UAT gap G-34.1-15): A MOVE THE GIVEN KIT HOME'S OWN RECORD PROVES ─────
  //
  // CR-08: plan 34.1-56's predicate said "kit home moved" whenever the recorded kit root held no kit and the given one
  // did. That is also true when the recorded kit home was deleted and GRUGOPS_HOME names another repository's kit home;
  // following the printed "Move <K2> back to <A>" then broke the second repository. D-45: the doctor says "moved" only
  // when the given kit home's own kit-home record is `unbound` and names the recorded kit home (by real path), and
  // nothing is at the recorded kit home; otherwise the observed FAIL on the absent kit stands.
  /** The lines of a run that tell the user to move `kitHome` (a `move` word on a line naming it). */
  const moveLines = (stdout: string, kitHome: string): string[] => stdout.split(/\r?\n/).filter((l) => /\bmove\b/i.test(l) && lineNamesPath(l, kitHome));

  it("R54 control (recorded kit home deleted, the given kit home another repository's, D-45): install --codex with kit home A, a second repository installed with kit home K2 (bound to itself), A deleted, --check on the first given GRUGOPS_HOME=K2: exit 1, no 'kit home moved:' line, no line telling the user to move K2, a FAIL naming <A>/agent-factory; the second repository's own --check still exits 0 with no FAIL", () => {
    const { target, kitHome, home } = codexWithOwnKitHome();
    const other = scratchRow();
    const r = runInstall(other.target, other.kitHome, [agentFlag(codexHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(readKitHomeRecord(other.kitHome).state, "premise: K2's kit-home record is bound to K2 itself").toBe("ok");
    expect(holdsKit(other.kitHome), "premise: K2 holds a kit").toBe(true);
    rmSync(kitHome, { recursive: true, force: true });
    expect(existsSync(kitHome), "premise: A was deleted").toBe(false);

    const c = spawnBin(INSTALL_JS, ["--check"], target, other.kitHome, { home });
    expect(c.status, c.stdout + c.stderr).toBe(1);
    expect(movedLines(c.stdout), `a 'kit home moved:' line for a deleted kit home:\n${c.stdout}`).toEqual([]);
    expect(moveLines(c.stdout, other.kitHome), "a line tells the user to move the second repository's kit home K2").toEqual([]);
    expect(failLines(c.stdout).some((l) => lineNamesPath(l, join(kitHome, "agent-factory"))), `no FAIL names <A>/agent-factory:\n${c.stdout}`).toBe(true);

    const after = spawnBin(INSTALL_JS, ["--check"], other.target, other.kitHome, { home });
    expect(after.status, after.stdout + after.stderr).toBe(0);
    expect(failLines(after.stdout), after.stdout).toEqual([]);
  });

  /** The real path of an existing directory, by user-file.ts realTargetPath (what install writes as a kit-home record's grugopsHome). */
  const realText = (p: string): string => {
    const real = realTargetPath(p);
    expect(real, `premise: ${p} has a real path`).not.toBeNull();
    return pathText(real as string);
  };
  /** Whatever is at `p` removed (a directory tree, a file, or a symbolic link, one to nothing included); nothing there is fine. */
  const clearAt = (p: string): void => {
    let isLink = false;
    try {
      isLink = lstatSync(p).isSymbolicLink();
    } catch {
      return;
    }
    if (isLink) unlinkSync(p);
    else rmSync(p, { recursive: true, force: true });
  };
  /** What lstat finds at `p`: `nothing`, `directory`, `link` or `other`. */
  const entryAt = (p: string): "nothing" | "directory" | "link" | "other" => {
    try {
      const st = lstatSync(p);
      return st.isSymbolicLink() ? "link" : st.isDirectory() ? "directory" : "other";
    } catch {
      return "nothing";
    }
  };
  /** The assertions of a run where the recorded kit home A is not shown to have moved to B: the observed FAIL on A's absent kit, and no move. */
  const notMoved = (c: Run, kitHome: string, given: string, cell: string): void => {
    expect(c.status, `${cell}\n${c.stdout}${c.stderr}`).toBe(1);
    expect(movedLines(c.stdout), `${cell}: a 'kit home moved:' line:\n${c.stdout}`).toEqual([]);
    expect(moveLines(c.stdout, given), `${cell}: a line tells the user to move the given kit home`).toEqual([]);
    expect(failLines(c.stdout).some((l) => lineNamesPath(l, join(kitHome, "agent-factory"))), `${cell}: no FAIL names <A>/agent-factory:\n${c.stdout}`).toBe(true);
  };

  it("R54 control (recorded kit home present without its kit, D-45): install --codex with kit home A, B a recursive copy of A (its kit-home record written for A), A/agent-factory removed and A kept as a directory, --check with GRUGOPS_HOME=B: exit 1, no 'kit home moved:' line, no line telling the user to move B, a FAIL naming <A>/agent-factory", () => {
    const { target, kitHome, home } = codexWithOwnKitHome();
    const copy = join(dirname(target), "copied-kit");
    cpSync(kitHome, copy, { recursive: true });
    const rec = readKitHomeRecord(copy);
    expect(rec.state, "premise: B's kit-home record is unbound (it was written for A)").toBe("unbound");
    expect(pathText(rec.boundTo ?? ""), "premise: B's kit-home record names A's real path").toBe(realText(kitHome));
    rmSync(join(kitHome, "agent-factory"), { recursive: true, force: true });
    expect(entryAt(kitHome), "premise: A is still a directory").toBe("directory");
    expect(holdsKit(kitHome) || !holdsKit(copy), "premise: A holds no kit and B holds one").toBe(false);

    notMoved(spawnBin(INSTALL_JS, ["--check"], target, copy, { home }), kitHome, copy, "A present without its agent-factory");
  });

  it("R54 class (CR-08, D-45): A renamed to B; over B's kit-home record (the move's own, bound to B itself, written for a third kit home, absent, not JSON) x what is at A (nothing, an empty directory, a symbolic link to nothing), only the cell (the move's own record, nothing at A) prints the moved-kit FAIL; every other cell exits 1 with no move and the FAIL on <A>/agent-factory; 15 cells", () => {
    const { target, kitHome, home } = codexWithOwnKitHome();
    const realA = realText(kitHome);
    const moved = join(dirname(target), "moved-kit");
    renameSync(kitHome, moved);
    const recordFile = join(moved, KIT_HOME_RECORD_REL);
    const ownBytes = readFileSync(recordFile);
    const own = readKitHomeRecord(moved);
    expect(own.state, "premise: the moved kit home's own record is unbound").toBe("unbound");
    expect(pathText(own.boundTo ?? ""), "premise: the moved kit home's own record names A's real path").toBe(realA);
    const third = join(dirname(target), "third-kit");
    const withHome = (grugopsHome: string): string => {
      const doc = JSON.parse(ownBytes.toString("utf8")) as Record<string, unknown>;
      return `${JSON.stringify({ ...doc, grugopsHome }, null, 2)}\n`;
    };
    const realB = realTargetPath(moved);
    expect(realB, "premise: B has a real path").not.toBeNull();

    const RECORDS: readonly { readonly name: string; readonly apply: () => void; readonly premise: () => void }[] = [
      { name: "the move's own record", apply: () => writeFileSync(recordFile, ownBytes), premise: () => expect(pathText(readKitHomeRecord(moved).boundTo ?? "")).toBe(realA) },
      { name: "bound to B itself", apply: () => writeFileSync(recordFile, withHome(realB as string)), premise: () => expect(readKitHomeRecord(moved).state).toBe("ok") },
      {
        name: "written for a third kit home",
        apply: () => writeFileSync(recordFile, withHome(pathText(third))),
        premise: () => {
          const r = readKitHomeRecord(moved);
          expect(r.state).toBe("unbound");
          expect(pathText(r.boundTo ?? "")).toBe(pathText(third));
        },
      },
      { name: "absent", apply: () => rmSync(recordFile), premise: () => expect(readKitHomeRecord(moved).state).toBe("absent") },
      { name: "not JSON", apply: () => writeFileSync(recordFile, "{ not json\n"), premise: () => expect(readKitHomeRecord(moved).state).toBe("unreadable") },
    ];
    const AT_A: readonly { readonly name: string; readonly apply: () => void; readonly entry: "nothing" | "directory" | "link" }[] = [
      { name: "nothing", apply: () => undefined, entry: "nothing" },
      { name: "an empty directory", apply: () => mkdirSync(kitHome), entry: "directory" },
      { name: "a symbolic link to nothing", apply: () => symlinkSync(join(dirname(target), "nowhere"), kitHome), entry: "link" },
    ];

    // Every cell runs, and the cells whose outcome differs from the expected one are listed together, so a broken clause
    // names every cell it turns (the premises are asserted at once: a premise that fails is the harness's, not a cell's).
    const wrong: string[] = [];
    let cells = 0;
    for (const record of RECORDS) {
      for (const atA of AT_A) {
        const cell = `B's record ${record.name}, at A ${atA.name}`;
        record.apply();
        atA.apply();
        try {
          record.premise();
          expect(entryAt(kitHome), `premise (${cell}): what is at A`).toBe(atA.entry);
          expect(holdsKit(moved), `premise (${cell}): B holds the kit`).toBe(true);
          const c = spawnBin(INSTALL_JS, ["--check"], target, moved, { home });
          const lines = movedLines(c.stdout);
          const observed = {
            status: c.status,
            moved: lines.length,
            namesBoth: lines.length === 1 && lineNamesPath(lines[0], kitHome) && lineNamesPath(lines[0], moved),
            moveB: moveLines(c.stdout, moved).length,
            failOnKit: failLines(c.stdout).some((l) => lineNamesPath(l, join(kitHome, "agent-factory"))),
          };
          const realMove = record.name === "the move's own record" && atA.name === "nothing";
          const ok = realMove
            ? observed.status === 1 && observed.moved === 1 && observed.namesBoth
            : observed.status === 1 && observed.moved === 0 && observed.moveB === 0 && observed.failOnKit;
          if (!ok) wrong.push(`${cell} (${realMove ? "a real move" : "not a move"}): ${JSON.stringify(observed)}`);
        } finally {
          writeFileSync(recordFile, ownBytes);
          clearAt(kitHome);
        }
        cells++;
      }
    }
    expect(cells, "the class matrix runs 5 record shapes x 3 shapes at A").toBe(15);
    expect(wrong, "cells whose --check outcome is wrong (a real move must print one 'kit home moved:' FAIL naming A and B; every other cell exits 1 with no move and a FAIL on <A>/agent-factory)").toEqual([]);
  });

  it("R54 through a linked parent (CR-08, D-45): install --codex with kit home <via>/A, where `via` is a symbolic link to a directory `real`; the marker records <via>/A while the kit-home record names its real path through `real`; <via>/A renamed to <via>/B by hand, --check with GRUGOPS_HOME=<via>/B prints exactly one 'kit home moved:' FAIL naming <via>/A and <via>/B", () => {
    const row = scratchRow();
    const dir = dirname(row.target);
    const home = join(dir, "home");
    mkdirSync(home, { recursive: true });
    const real = join(dir, "real");
    mkdirSync(real);
    const via = join(dir, "via");
    symlinkSync(real, via);
    const a = join(via, "A");
    const r = runInstall(row.target, a, [agentFlag(codexHost())], { home });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(pathText(String(readMarkerObject(row.target).grugopsHome)), "premise: the marker records <via>/A as spelled").toBe(pathText(a));
    const boundTo = readKitHomeRecord(a).boundTo ?? "";
    expect(pathText(boundTo), "premise: the kit-home record names A's real path, through `real`").toBe(realText(join(real, "A")));
    expect(pathText(boundTo), "premise: the record's spelling and the marker's differ").not.toBe(pathText(a));
    const b = join(via, "B");
    renameSync(a, b);
    const c = spawnBin(INSTALL_JS, ["--check"], row.target, b, { home });
    expect(c.status, c.stdout + c.stderr).toBe(1);
    const lines = movedLines(c.stdout);
    expect(lines.length, `one 'kit home moved:' FAIL:\n${c.stdout}`).toBe(1);
    expect(lineNamesPath(lines[0], a) && lineNamesPath(lines[0], b), `the moved-kit FAIL does not name <via>/A and <via>/B: ${lines[0]}`).toBe(true);
  });
});

// ── D-06 (quick task 261018-hs8, human 2026-10-18, review CR-01; reverses planner decision PD-1) ──────────────────────
//
// A launch file (a row's launchAgent) is read only by a session the user starts with it: a default session (plain
// `pi`, plain `copilot`, a typed `/grugops`) never reads it. So it is not a route carrier: a default session's entry
// that lacks the route is reported as it was before the launch files existed, whatever the launch file holds. These
// cases are the property PD-1 lost; under PD-1 each printed an uncounted note and `--strict` passed.
describe("D-06: a launch file is not a route carrier, so a default session's missing route is counted", () => {
  it("Pi: the template absent, Pi's launch file present with the route, the user's own AGENTS.md without it: a counted WARN for the template naming Pi; Pi CANNOT reach; exit 0, and 1 with --strict", () => {
    const { target, kitHome } = installedWithOwnAgents();
    const launch = piHost().launchAgent;
    expect(launch, "premise: Pi has a launch file").not.toBeNull();
    rmSync(piFile(target));
    expect(readFileSync(join(target, ...launch!.split("/")), "utf8").includes(KIT_ROUTE), "premise: Pi's launch file holds the route").toBe(true);
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const warns = countedRouteLines(c.stdout).filter((l) => l.includes(PI_PROMPT_REL));
    expect(warns.length, c.stdout).toBe(1);
    expect(warns[0].startsWith("  WARN"), warns[0]).toBe(true);
    expect(warns[0]).toContain(`(it leaves ${piHost().name} without a route to the Orchestrator)`);
    const v = reachVerdict(c.stdout, piHost());
    expect(v.reaches, v.line).toBe(false);
    expect(v.line, "the reach line names the launch file").not.toContain(launch!);
    const strict = strictCheck(target, kitHome);
    expect(strict.status, strict.stdout + strict.stderr).toBe(1);
  });

  it("GitHub Copilot CLI: the Copilot instructions without install's block, Copilot CLI's launch file present with the route, the user's own AGENTS.md without it: a counted WARN for the instructions naming Copilot CLI; Copilot CLI CANNOT reach; exit 0, and 1 with --strict", () => {
    const { target, kitHome } = installedWithOwnAgents();
    const launch = copilotHost().launchAgent;
    expect(launch, "premise: Copilot CLI has a launch file").not.toBeNull();
    writeFileSync(join(target, ...COPILOT_REL.split("/")), "# Copilot notes\nUse tabs.\n");
    expect(readFileSync(join(target, ...launch!.split("/")), "utf8").includes(KIT_ROUTE), "premise: Copilot CLI's launch file holds the route").toBe(true);
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const warns = countedRouteLines(c.stdout).filter((l) => l.includes(COPILOT_REL));
    expect(warns.length, c.stdout).toBe(1);
    expect(warns[0].startsWith("  WARN"), warns[0]).toBe(true);
    expect(warns[0]).toContain(`(it leaves ${copilotHost().name} without a route to the Orchestrator)`);
    const v = reachVerdict(c.stdout, copilotHost());
    expect(v.reaches, v.line).toBe(false);
    expect(v.line, "the reach line names the launch file").not.toContain(launch!);
    const strict = strictCheck(target, kitHome);
    expect(strict.status, strict.stdout + strict.stderr).toBe(1);
  });
});

// ── D-06: each launch file has its own `--check` finding ──────────────────────────────────────────────────────────────
// One line per launch file of an installed agent, worded by the registry's launchSession, never typed here: "a session
// started with <command>" for a command form, "a session where you pick <agent> in the panel" for a panel form (quick
// task 261018-vfm, human 2026-10-18): install's file with the route → ok; install's own earlier copy without it → FAIL;
// a file install will not write the route into → WARN; absent → an uncounted note; not readable → WARN. None of them
// is a kit-route carrier line or a reach-line carrier.
/** The doctor's lines (any label) whose message starts with `launch file <rel> `. */
const launchLines = (stdout: string, rel: string): string[] =>
  stdout.split(/\r?\n/).filter((l) => /^ {2}\S+\s/.test(l) && messageOf(l).startsWith(`launch file ${rel} `));
const LAUNCH_HOSTS = HOST_TOOLS.filter((h) => h.launchAgent !== null);
/** The one launch line for row `h`, asserted, with the registry's launch form in it. */
function launchLineOf(stdout: string, h: (typeof HOST_TOOLS)[number]): string {
  const mine = launchLines(stdout, launchRelOf(h));
  expect(mine.length, `exactly one launch line for ${h.name}:\n${stdout}`).toBe(1);
  const session = launchSession(h);
  expect(session, `premise: ${h.id} has a launch form`).not.toBeNull();
  expect(mine[0], "the launch line does not word the registry's launch form by its kind").toContain(session ?? "");
  return mine[0];
}
/** The text of row `h`'s launch form, asserted present (never the LaunchForm object itself, which would coerce). */
function formText(h: (typeof HOST_TOOLS)[number]): string {
  const form = h.launchForm;
  expect(form, `premise: ${h.id} has a launch form`).not.toBeNull();
  return form === null ? "" : form.text;
}

describe("D-06: --check reports each launch file on its own line, never as a route carrier", () => {
  it("premise: some rows have a launch file, and each has a launch form (a command or a panel pick) exactly when it has a launch file", () => {
    expect(LAUNCH_HOSTS.length).toBeGreaterThan(0);
    for (const h of HOST_TOOLS) expect(h.launchForm === null, h.id).toBe(h.launchAgent === null);
  });

  it("a fresh install for every agent: one ok launch line per launch file; no kit-route line and no reach line names a launch file; --strict exit 0", () => {
    const { target, kitHome } = installed();
    const c = strictCheck(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    for (const h of LAUNCH_HOSTS) {
      expect(launchLineOf(c.stdout, h).startsWith("  ok"), c.stdout).toBe(true);
      const rel = launchRelOf(h);
      expect(routeLines(c.stdout).filter((l) => l.includes(rel)), `a kit-route line names ${rel}`).toEqual([]);
      expect(reachLines(c.stdout).filter((l) => l.includes(rel)), `a reach line names ${rel}`).toEqual([]);
    }
  });

  it("install's own launch file from an earlier install, without the route: a counted FAIL naming `Re-run install.js`; Pi still reaches; the re-run makes it ok", () => {
    const { target, kitHome } = installed();
    const rel = launchRelOf(piHost());
    stageEarlierFile(target, rel, staleOf(readFileSync(launchPath(target, piHost()), "utf8")));
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(1);
    const line = launchLineOf(c.stdout, piHost());
    expect(line.startsWith("  FAIL"), line).toBe(true);
    expect(line).toContain("Re-run install.js");
    expect(countedRouteLines(c.stdout), c.stdout).toEqual([]);
    expect(reachVerdict(c.stdout, piHost()).reaches, c.stdout).toBe(true);
    const again = runInstall(target, kitHome);
    expect(again.status, again.stdout + again.stderr).toBe(0);
    const after = strictCheck(target, kitHome);
    expect(after.status, after.stdout + after.stderr).toBe(0);
    expect(launchLineOf(after.stdout, piHost()).startsWith("  ok"), after.stdout).toBe(true);
  });

  it("a user's edit drops the route from Copilot CLI's launch file: a counted WARN quoting KIT_ROUTE; Copilot CLI still reaches; exit 0, and 1 with --strict", () => {
    const { target, kitHome } = installed();
    dropRouteFromLaunch(target, copilotHost());
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const line = launchLineOf(c.stdout, copilotHost());
    expect(line.startsWith("  WARN"), line).toBe(true);
    expect(line).toContain(KIT_ROUTE);
    expect(countedRouteLines(c.stdout), c.stdout).toEqual([]);
    expect(reachVerdict(c.stdout, copilotHost()).reaches, c.stdout).toBe(true);
    const strict = strictCheck(target, kitHome);
    expect(strict.status, strict.stdout + strict.stderr).toBe(1);
  });

  it("the user's own file at Pi's launch path before install: install leaves it; a counted WARN; Pi still reaches through its template", () => {
    const row = scratchRow();
    ownLaunchWithoutRoute(row.target, piHost());
    const r = runInstall(row.target, row.kitHome, [agentFlag(piHost())]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const c = check(row.target, row.kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const line = launchLineOf(c.stdout, piHost());
    expect(line.startsWith("  WARN"), line).toBe(true);
    expect(reachVerdict(c.stdout, piHost()).reaches, c.stdout).toBe(true);
    expect(strictCheck(row.target, row.kitHome).status).toBe(1);
  });

  it("OpenCode's launch file deleted: an uncounted note with the re-install remedy; OpenCode still reaches; --strict exit 0", () => {
    const { target, kitHome } = installed();
    const oc = HOST_TOOLS.filter((h) => h.adapter === "opencode-command");
    expect(oc.length, "premise: one opencode-command row").toBe(1);
    rmSync(launchPath(target, oc[0]));
    const c = strictCheck(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const line = launchLineOf(c.stdout, oc[0]);
    expect(line.startsWith("  note"), line).toBe(true);
    expect(line).toContain("Re-run install.js");
    expect(reachVerdict(c.stdout, oc[0]).reaches, c.stdout).toBe(true);
  });

  it("a directory at Pi's launch path: install refuses the write; --check gives a counted WARN with no verdict; Pi still reaches", () => {
    const row = scratchRow();
    blockLaunch(row.target, piHost());
    const r = runInstall(row.target, row.kitHome, [agentFlag(piHost())]);
    expect([0, 3], r.stdout + r.stderr).toContain(r.status);
    const c = check(row.target, row.kitHome);
    const line = launchLineOf(c.stdout, piHost());
    expect(line.startsWith("  WARN"), line).toBe(true);
    expect(line).toContain("NO VERDICT");
    expect(reachVerdict(c.stdout, piHost()).reaches, c.stdout).toBe(true);
  });
});

// ── WR-03 (quick task 261018-hs8): the closing line offers a launch form only for a launch file install owns ─────────
// The closing line ends with the row's invoke text, then `; or <launchInvoke>` when install wrote or owns the launch
// file this run leaves, else the reason the form is not offered. A user's own file at the launch path and a refused
// write are the two arms that must not be offered: the printed form would start the user's file (or, on Pi, append the
// literal path text), not the Orchestrator.
/** The closing line of row `h` in an install's output. */
function closingLineOf(stdout: string, h: (typeof HOST_TOOLS)[number]): string {
  const mine = stdout.split(/\r?\n/).filter((l) => l.startsWith(`  ${h.name}: `) && l.includes(` — ${h.invoke}`));
  expect(mine.length, `exactly one closing line for ${h.name}:\n${stdout}`).toBe(1);
  return mine[0];
}
const NOT_OFFERED = "no launch form is offered, because install neither wrote nor owns";

describe("WR-03: install's closing line names a launch form only when install wrote or owns the launch file", () => {
  it("a fresh install for every agent: each launch row's closing line ends with its invoke text and `; or <launchInvoke>`", () => {
    const row = scratchRow();
    const r = runInstall(row.target, row.kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    for (const h of LAUNCH_HOSTS) {
      const line = closingLineOf(r.stdout, h);
      expect(line.endsWith(` — ${h.invoke}; or ${launchInvoke(h)}`), line).toBe(true);
      expect(line).toContain(formText(h));
    }
  });

  it("under DRY_RUN, a fresh target: the form is offered for every launch row (the real run would write each file)", () => {
    const row = scratchRow();
    const r = runInstall(row.target, row.kitHome, [], { dryRun: true });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    for (const h of LAUNCH_HOSTS) expect(closingLineOf(r.stdout, h).endsWith(`; or ${launchInvoke(h)}`), r.stdout).toBe(true);
  });

  it("the user's own file at every launch path: no closing line names a launch form; each gives the reason; DRY_RUN says the same", () => {
    const row = scratchRow();
    for (const h of LAUNCH_HOSTS) ownLaunchWithoutRoute(row.target, h);
    const dry = runInstall(row.target, row.kitHome, [], { dryRun: true });
    expect(dry.status, dry.stdout + dry.stderr).toBe(0);
    const r = runInstall(row.target, row.kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    for (const out of [dry.stdout, r.stdout]) {
      for (const h of LAUNCH_HOSTS) {
        const line = closingLineOf(out, h);
        expect(line, `${h.name}: the form is offered for the user's own file`).not.toContain(formText(h));
        expect(line, `${h.name}: the launch clause is offered for the user's own file`).not.toContain(launchInvoke(h) ?? "");
        expect(line.endsWith(` — ${h.invoke}; ${NOT_OFFERED} ${launchRelOf(h)} here`), line).toBe(true);
      }
    }
  });

  it("Pi's launch write refused (a directory there): the closing line names no launch form and gives the reason", () => {
    const row = scratchRow();
    blockLaunch(row.target, piHost());
    const r = runInstall(row.target, row.kitHome, [agentFlag(piHost())]);
    const line = closingLineOf(r.stdout, piHost());
    expect(line).not.toContain(formText(piHost()));
    expect(line).not.toContain(launchInvoke(piHost()) ?? "");
    expect(line.endsWith(`; ${NOT_OFFERED} ${launchRelOf(piHost())} here`), line).toBe(true);
  });
});
