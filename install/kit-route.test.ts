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
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { HOST_TOOLS, HOST_TOOL_COUNT, KIT_ROUTE, PI_PROMPT_REL, ROUTE_POINTERS } from "./host-tools.js";
import { contentRecord } from "./install-marker.js";
import { INSTALL_JS, MARKER_REL, REPO_ROOT, makeFixture, runInstall, runUninstall, spawnBin, type Run } from "./installer-paths.test-support.js";
import { blockRecords, fileRecords, readMarkerObject, withLedger } from "./ledger.test-support.js";

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

/** Install into a fresh scratch row; the install must exit 0. */
function installed(): { target: string; kitHome: string } {
  const row = scratchRow();
  const r: Run = runInstall(row.target, row.kitHome);
  expect(r.status, r.stdout + r.stderr).toBe(0);
  return row;
}

const check = (target: string, kitHome: string): Run => spawnBin(INSTALL_JS, ["--check"], target, kitHome);
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

// ── THE NOTE FOR A USER'S CARRIER WITHOUT THE ROUTE (plan 34-28, D-26 point 3) ──────────────────────
//
// The host names are derived here from HOST_TOOLS and ROUTE_POINTERS (a host's carriers are its entry files
// and its adapter kind's pointers), never typed and never taken from host-tools.ts routeCarriers, so the
// note is checked against an independent derivation.
const carriersOf = (h: (typeof HOST_TOOLS)[number]): string[] => [...new Set([...h.entryFiles, ...ROUTE_POINTERS[h.adapter]])];
/** For AGENTS.md, the hosts whose only carrier it is; for any other file, the hosts that read it. */
const notedHosts = (rel: string): string[] =>
  HOST_TOOLS.filter((h) => (rel === "AGENTS.md" ? carriersOf(h).length === 1 && carriersOf(h)[0] === rel : carriersOf(h).includes(rel))).map((h) => h.name);
/** The note lines naming `rel` as their subject. */
const notesFor = (stdout: string, rel: string): string[] => linesUnder(stdout, "note").filter((l) => l.trim().split(/\s+/)[1] === rel);
/** The note says the file, exactly `hosts` in registry order, and KIT_ROUTE as the sentence to add. */
function expectRouteNote(stdout: string, rel: string): void {
  const hosts = notedHosts(rel);
  expect(hosts.length, `premise: some host reads ${rel}`).toBeGreaterThan(0);
  const notes = notesFor(stdout, rel);
  expect(notes.length, stdout).toBe(1);
  expect(notes[0], "the note does not name exactly the derived hosts, in registry order").toContain(`no kit route in it: ${hosts.join(", ")} get no route`);
  expect(notes[0]).toContain(`"${KIT_ROUTE}"`);
}

describe("kit route: a user's own carrier without the route gets a note naming the hosts it leaves out (plan 34-28, D-26 point 3)", () => {
  it(`a target with its own AGENTS.md without the route: one note naming AGENTS.md, ${notedHosts("AGENTS.md").join(", ")}, and KIT_ROUTE`, () => {
    const { target, kitHome } = scratchRow();
    const mine = "# My agents\n\nMy own instructions.\n";
    writeFileSync(join(target, "AGENTS.md"), mine);
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expectRouteNote(r.stdout, "AGENTS.md");
    expect(readFileSync(join(target, "AGENTS.md"), "utf8")).toBe(mine);
  });

  it("a fresh install prints no route note", () => {
    const { target, kitHome } = scratchRow();
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(linesUnder(r.stdout, "note").filter((l) => l.includes(KIT_ROUTE)), r.stdout).toEqual([]);
  });

  it("the user's own Pi template without the route, there before install: a note naming the file, the hosts that read it, and KIT_ROUTE", () => {
    const { target, kitHome } = scratchRow();
    mkdirSync(join(target, ".pi", "prompts"), { recursive: true });
    writeFileSync(piFile(target), "---\ndescription: my own grugops prompt\n---\nDo it my way: $ARGUMENTS\n");
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expectRouteNote(r.stdout, PI_PROMPT_REL);
  });

  it("a block the user edited, without the route: a note naming the file and the hosts that read it", () => {
    const { target, kitHome } = scratchRow();
    makeFixture(target);
    expect(runInstall(target, kitHome).status).toBe(0);
    const staged = stageEarlierBlock(target, "CLAUDE.md", CLAUDE_OPEN, CLAUDE_CLOSE);
    writeFileSync(join(target, "CLAUDE.md"), staged.replace(`${CLAUDE_OPEN}\n`, `${CLAUDE_OPEN}\nMy own line inside the block.\n`));
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expectRouteNote(r.stdout, "CLAUDE.md");
  });
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

  it(`the user's own AGENTS.md without the route: ${notedHosts("AGENTS.md").join(", ")} cannot reach, the others can; one WARN names AGENTS.md and KIT_ROUTE; exit 0, and 1 with --strict`, () => {
    const { target, kitHome } = scratchRow();
    writeFileSync(join(target, "AGENTS.md"), "# My agents\n\nMy own instructions.\n");
    const r = runInstall(target, kitHome);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const stranded = notedHosts("AGENTS.md");
    expect(stranded.length, "premise: some host's only carrier is AGENTS.md").toBeGreaterThan(0);
    expect(reachLines(c.stdout).length, c.stdout).toBe(HOST_TOOL_COUNT);
    for (const h of HOST_TOOLS) {
      const v = reachVerdict(c.stdout, h);
      expect(v.reaches, v.line).toBe(!stranded.includes(h.name));
      if (!v.reaches) expect(v.line).toContain("AGENTS.md");
    }
    const warns = countedRouteLines(c.stdout);
    expect(warns.length, c.stdout).toBe(1);
    expect(warns[0].startsWith("  WARN")).toBe(true);
    expect(warns[0]).toContain("AGENTS.md");
    expect(warns[0]).toContain(KIT_ROUTE);
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
// are carriersOf (this file's own derivation from HOST_TOOLS and ROUTE_POINTERS), less AGENTS.md for the
// gemini-settings host when the follower's own Gemini rule (below, plan 34-32) says Gemini CLI does not read it
// here; a carrier counts when its
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
  /** Whether `<kitRoot>/roles/orchestrator.md` is a regular file. */
  readonly routeResolves: boolean;
  /** The carriers without the route that the ledger still records as install's own, unedited. */
  readonly ownStale: readonly string[];
  /** host id → whether the host reaches the Orchestrator. */
  readonly reaches: ReadonlyMap<string, boolean>;
  /** carrier → whether its whole text (a regular file) contains KIT_ROUTE (plan 34-33). */
  readonly carries: ReadonlyMap<string, boolean>;
  /** Whether the SKILL.md KIT= line names a directory holding roles/orchestrator.md (plan 34-33). */
  readonly adapterReaches: boolean;
}

// THE FOLLOWER'S OWN GEMINI RULE (plan 34-32, D-27 point 1). Gemini CLI reads GEMINI.md by default and AGENTS.md
// only when `.gemini/settings.json` lists it in `context.fileName`. This file decides that on its own, sharing no
// code with install.ts's reader: the settings file is a regular file; its bytes are valid UTF-8 (a fatal
// TextDecoder); its text holds exactly one `"context"` and exactly one `"fileName"` by textual count (two equal
// keys are refused, because which one Gemini CLI reads is not known); JSON.parse succeeds; the root and `context`
// are objects; and `context.fileName` is `AGENTS.md`, or an array of strings that includes it (exact string
// equality). The Gemini host is found by its adapter kind, never by a typed name.
const GEMINI_SETTINGS = ".gemini/settings.json";
function geminiHost(): (typeof HOST_TOOLS)[number] {
  const g = HOST_TOOLS.filter((h) => h.adapter === "gemini-settings");
  expect(g.length, "premise: exactly one registry host has the gemini-settings adapter").toBe(1);
  return g[0];
}
const geminiFile = (target: string): string => join(target, ...GEMINI_SETTINGS.split("/"));
function geminiListsAgents(target: string): boolean {
  if (!isRegularFile(geminiFile(target))) return false;
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(geminiFile(target)));
  } catch {
    return false;
  }
  if ((text.match(/"context"/g) ?? []).length !== 1 || (text.match(/"fileName"/g) ?? []).length !== 1) return false;
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return false;
  }
  const isObject = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === "object" && !Array.isArray(x);
  if (!isObject(v) || !isObject(v.context)) return false;
  const fn = v.context.fileName;
  return fn === "AGENTS.md" || (Array.isArray(fn) && fn.every((x) => typeof x === "string") && fn.includes("AGENTS.md"));
}
/** The carriers `h` reads in `target`, by the follower's own rules (carriersOf, gated by the Gemini rule). */
const followerCarriers = (target: string, h: (typeof HOST_TOOLS)[number]): string[] =>
  carriersOf(h).filter((rel) => !(h.adapter === "gemini-settings" && rel === "AGENTS.md") || geminiListsAgents(target));

/** THE INDEPENDENT FOLLOWER: per host, from the files alone. */
function follow(target: string): Followed {
  const marker = JSON.parse(readFileSync(join(target, ...MARKER_REL.split("/")), "utf8")) as Record<string, unknown>;
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
  for (const h of HOST_TOOLS) {
    const viaCarrier = routeResolves && followerCarriers(target, h).some((rel) => carries.get(rel) === true);
    reaches.set(h.id, viaCarrier || (h.adapter === "claude-kit" && adapterReaches));
  }
  return { routeResolves, ownStale, reaches, carries, adapterReaches };
}

/** Every path the pointer carriers install writes name (ROUTE_POINTERS; a block's own lines) and KIT_ROUTE names. */
function expectNamedPathsExist(target: string): void {
  const { kitRoot, orchestrator } = followRoute(target);
  expect(lstatSync(orchestrator).isFile(), `${orchestrator} is not a regular file`).toBe(true);
  const texts: Array<[string, string]> = [["KIT_ROUTE", KIT_ROUTE]];
  for (const rel of new Set(Object.values(ROUTE_POINTERS).flat())) {
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
    uncounted: [],
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

// ── GEMINI CLI READS AGENTS.md ONLY WHEN ITS SETTINGS LIST IT (plan 34-32, D-27 point 1, CR-01) ──
//
// The class this closes (VERDICT-1, root cause AUTH-1): `--check` said Gemini CLI reaches the Orchestrator
// through AGENTS.md from the registry's static entry files, without asking whether Gemini reads AGENTS.md here.
// Gemini CLI reads GEMINI.md by default and AGENTS.md only when `.gemini/settings.json` lists it in
// `context.fileName`. The Gemini host is found by its adapter kind, never by a typed name; the settings path is
// this file's own spelling.
/** The hosts a carrier line's `(read by …)` list names, for the one carrier line about `rel`. */
function readByOf(stdout: string, rel: string): string[] {
  const hits = routeLines(stdout).filter((l) => messageOf(l).includes(` ${rel} (read by `));
  expect(hits.length, `exactly one carrier line about ${rel}:\n${stdout}`).toBe(1);
  const m = /\(read by ([^)]*)\)/.exec(hits[0]);
  expect(m, hits[0]).not.toBeNull();
  return (m as RegExpExecArray)[1].split(", ");
}
/** The doctor's gate lines for `host`: `kit route: <host name> …` lines (any label). */
const gateLines = (stdout: string, host: (typeof HOST_TOOLS)[number]): string[] =>
  stdout.split(/\r?\n/).filter((l) => /^ {2}\S+\s/.test(l) && messageOf(l).startsWith(`kit route: ${host.name} `));

/** What is at the settings path: a file's bytes (hex), a directory, or nothing. */
function settingsSnapshot(target: string): string {
  const p = geminiFile(target);
  if (!existsSync(p)) return "absent";
  const st = lstatSync(p);
  return st.isDirectory() ? "directory" : st.isFile() ? `file:${readFileSync(p).toString("hex")}` : "other";
}

interface GeminiRow {
  readonly id: string;
  readonly what: string;
  /** Change `.gemini/settings.json` after a clean install. */
  readonly stage: (target: string) => void;
  /** The row's declared verdict: whether Gemini CLI reads AGENTS.md here (the follower must agree). */
  readonly reads: boolean;
  /** For a row where it does not: whether an install run would add AGENTS.md (the remedy names Re-run install.js). */
  readonly reinstall?: boolean;
  /** The settings path is not a readable regular file: the gate reaches no verdict. */
  readonly noVerdict?: boolean;
}
const settingsText = (text: string | Buffer) => (target: string): void => writeFileSync(geminiFile(target), text);
const GEMINI_ROWS: readonly GeminiRow[] = [
  {
    id: "a",
    what: 'a duplicate "context" key whose last copy lists AGENTS.md (the verifier\'s R8 case 1; JSON.parse keeps the last)',
    stage: settingsText('{"context":{"fileName":["GEMINI.md"]},"context":{"fileName":["AGENTS.md"]}}\n'),
    reads: false,
    reinstall: false,
  },
  { id: "b", what: 'fileName ["GEMINI.md"] (the verifier\'s R8 case 2)', stage: settingsText('{"context":{"fileName":["GEMINI.md"]}}\n'), reads: false, reinstall: true },
  { id: "c", what: "an empty object {}", stage: settingsText("{}\n"), reads: false, reinstall: true },
  { id: "d", what: "fileName []", stage: settingsText('{"context":{"fileName":[]}}\n'), reads: false, reinstall: true },
  { id: "e", what: 'fileName ""', stage: settingsText('{"context":{"fileName":""}}\n'), reads: false, reinstall: true },
  { id: "f", what: 'fileName "agents.md" (exact match only)', stage: settingsText('{"context":{"fileName":"agents.md"}}\n'), reads: false, reinstall: true },
  {
    id: "g",
    what: "not strict JSON (a trailing comma)",
    stage: settingsText('{"context": {"fileName": ["AGENTS.md"]},}\n'),
    reads: false,
    reinstall: false,
  },
  {
    id: "h",
    what: "bytes that are not valid UTF-8 (0xff 0xfe first)",
    stage: settingsText(Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('{"context":{"fileName":["AGENTS.md"]}}\n', "utf8")])),
    reads: false,
    reinstall: false,
  },
  { id: "i", what: "the settings file deleted", stage: (t) => rmSync(geminiFile(t)), reads: false, reinstall: true },
  {
    id: "j",
    what: "a directory at .gemini/settings.json",
    stage: (t) => {
      rmSync(geminiFile(t));
      mkdirSync(geminiFile(t));
    },
    reads: false,
    reinstall: false,
    noVerdict: true,
  },
  { id: "k", what: 'fileName "AGENTS.md" (the string form)', stage: settingsText('{"context":{"fileName":"AGENTS.md"}}\n'), reads: true },
  { id: "l", what: 'fileName ["GEMINI.md","AGENTS.md"]', stage: settingsText('{"context":{"fileName":["GEMINI.md","AGENTS.md"]}}\n'), reads: true },
];
const GEMINI_ROWS_COUNT = 12;

describe("kit route: Gemini CLI reads AGENTS.md only when its settings list it (plan 34-32, D-27 point 1)", () => {
  it("a clean install: an ok line says Gemini CLI reads AGENTS.md here, every host reaches, no counted kit-route line", () => {
    const gemini = geminiHost();
    const { target, kitHome } = installed();
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const gates = gateLines(c.stdout, gemini);
    expect(gates.length, c.stdout).toBe(1);
    expect(gates[0].startsWith("  ok"), gates[0]).toBe(true);
    expect(messageOf(gates[0])).toContain(`${gemini.name} reads AGENTS.md here`);
    expect(messageOf(gates[0])).toContain(GEMINI_SETTINGS);
    for (const h of HOST_TOOLS) expect(reachVerdict(c.stdout, h).reaches, reachVerdict(c.stdout, h).line).toBe(true);
    expect(countedRouteLines(c.stdout), c.stdout).toEqual([]);
    expect(readByOf(c.stdout, "AGENTS.md")).toContain(gemini.name);
  });

  it('fileName ["GEMINI.md"] after a clean install (the verifier\'s R8 case 2): Gemini CANNOT reach naming .gemini/settings.json, one counted WARN naming it, the others reach, AGENTS.md (read by …) omits Gemini; exit 0, 1 with --strict', () => {
    const gemini = geminiHost();
    const { target, kitHome } = installed();
    writeFileSync(geminiFile(target), '{"context":{"fileName":["GEMINI.md"]}}\n');
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const v = reachVerdict(c.stdout, gemini);
    expect(v.reaches, v.line).toBe(false);
    expect(v.line).toContain(GEMINI_SETTINGS);
    for (const h of HOST_TOOLS) if (h !== gemini) expect(reachVerdict(c.stdout, h).reaches, reachVerdict(c.stdout, h).line).toBe(true);
    const counted = countedRouteLines(c.stdout);
    expect(counted.length, c.stdout).toBe(1);
    expect(counted[0].startsWith("  WARN"), counted[0]).toBe(true);
    expect(messageOf(counted[0]).startsWith("kit route:"), counted[0]).toBe(true);
    expect(counted[0]).toContain(GEMINI_SETTINGS);
    expect(readByOf(c.stdout, "AGENTS.md")).not.toContain(gemini.name);
    const strict = spawnBin(INSTALL_JS, ["--check", "--strict"], target, kitHome);
    expect(strict.status, strict.stdout + strict.stderr).toBe(1);
    expect(strict.stdout).not.toContain("ALL CHECKS PASSED");
  });

  // ── every Gemini settings state (plan 34-32 Task 2): rows (a)-(l), each built from a clean install ──
  for (const row of GEMINI_ROWS) {
    it(`(${row.id}) ${row.what}: Gemini ${row.reads ? "reaches" : "CANNOT reach"}; the follower agrees; ${row.reads ? "an ok gate line, no counted kit-route line" : `a counted WARN naming ${GEMINI_SETTINGS}, remedy ${row.reinstall ? "Re-run install.js, and an install run then makes Gemini reach" : "by hand, and install exits 3 leaving the file as it is"}`}`, () => {
      const gemini = geminiHost();
      const { target, kitHome } = installed();
      row.stage(target);
      // Two-sided: the row's declared verdict and the follower's own rule agree.
      expect(geminiListsAgents(target), `the follower disagrees with row (${row.id})'s declared verdict`).toBe(row.reads);
      expect(follow(target).reaches.get(gemini.id), `the follower's reach verdict for row (${row.id})`).toBe(row.reads);
      const c = check(target, kitHome);
      expect(c.status, c.stdout + c.stderr).toBe(0);
      const v = reachVerdict(c.stdout, gemini);
      expect(v.reaches, v.line).toBe(row.reads);
      for (const h of HOST_TOOLS) if (h !== gemini) expect(reachVerdict(c.stdout, h).reaches, reachVerdict(c.stdout, h).line).toBe(true);
      const gates = gateLines(c.stdout, gemini);
      expect(gates.length, c.stdout).toBe(1);
      if (row.reads) {
        expect(gates[0].startsWith("  ok"), gates[0]).toBe(true);
        expect(countedRouteLines(c.stdout), c.stdout).toEqual([]);
        expect(readByOf(c.stdout, "AGENTS.md")).toContain(gemini.name);
        return;
      }
      // CANNOT reach: the line names the settings file and is never an empty list of reasons.
      expect(v.line).toContain(GEMINI_SETTINGS);
      expect(messageOf(v.line).split("CANNOT reach the Orchestrator: ")[1]?.trim().length ?? 0, v.line).toBeGreaterThan(0);
      expect(readByOf(c.stdout, "AGENTS.md")).not.toContain(gemini.name);
      const counted = countedRouteLines(c.stdout).filter((l) => l.includes(GEMINI_SETTINGS));
      expect(counted.length, c.stdout).toBeGreaterThan(0);
      expect(gates[0].startsWith("  WARN"), gates[0]).toBe(true);
      expect(gates[0]).toContain(GEMINI_SETTINGS);
      if (row.noVerdict) expect(gates[0]).toContain("no verdict");
      expect(gates[0].includes("Re-run install.js"), `the remedy of row (${row.id}): ${gates[0]}`).toBe(row.reinstall === true);
      if (row.reinstall !== true) expect(gates[0]).toContain("by hand");
      const strict = spawnBin(INSTALL_JS, ["--check", "--strict"], target, kitHome);
      expect(strict.status, strict.stdout + strict.stderr).toBe(1);
      expect(strict.stdout).not.toContain("ALL CHECKS PASSED");
      // INSTALL AND DOCTOR AGREE: the remedy is what an install run on this state does.
      const before = settingsSnapshot(target);
      const again = runInstall(target, kitHome);
      if (row.reinstall === true) {
        expect(again.status, again.stdout + again.stderr).toBe(0);
        expect(geminiListsAgents(target), `install did not make ${GEMINI_SETTINGS} list AGENTS.md\n${again.stdout}`).toBe(true);
        const after = check(target, kitHome);
        expect(reachVerdict(after.stdout, gemini).reaches, after.stdout).toBe(true);
      } else {
        expect(again.status, again.stdout + again.stderr).toBe(3);
        expect(linesUnder(again.stdout, "verify").some((l) => l.includes(GEMINI_SETTINGS)), again.stdout).toBe(true);
        expect(settingsSnapshot(target), `install changed ${GEMINI_SETTINGS}`).toEqual(before);
        const after = check(target, kitHome);
        expect(reachVerdict(after.stdout, gemini).reaches, after.stdout).toBe(false);
      }
    });
  }

  it(`the rows cover ${GEMINI_ROWS_COUNT} settings states, both verdicts and both remedies`, () => {
    expect(GEMINI_ROWS.length).toBe(GEMINI_ROWS_COUNT);
    expect(new Set(GEMINI_ROWS.map((r) => r.id)).size).toBe(GEMINI_ROWS_COUNT);
    expect(GEMINI_ROWS.filter((r) => r.reads).length).toBeGreaterThan(0);
    expect(GEMINI_ROWS.filter((r) => !r.reads && r.reinstall === true).length).toBeGreaterThan(0);
    expect(GEMINI_ROWS.filter((r) => !r.reads && r.reinstall !== true).length).toBeGreaterThan(0);
  });
});

// ── ONE DERIVATION OF THE HOSTS A CARRIER STRANDS (plan 34-33, D-27 point 2; WR-02, WR-03; VERDICT-1, AUTH-1) ──
//
// A carrier without the route is counted only when it leaves some host without a route: a host that reads it
// here, reads no other carrier holding the route, and has no adapter route. Otherwise it is an uncounted `note`
// line. The stranded hosts are the follower's own (strandedOf below), from carriersOf, the follower's Gemini rule,
// the carriers' text and the SKILL.md KIT= line: no code is shared with host-tools.ts strandedBy.

/** The follower's own answer to "which hosts does `rel` leave without a route here", in registry order. */
function strandedOf(target: string, rel: string): string[] {
  const f = follow(target);
  if (f.carries.get(rel) === true) return [];
  return HOST_TOOLS.filter((h) => {
    const mine = followerCarriers(target, h);
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

  it("the user's own AGENTS.md without the route still gives one counted WARN naming AGENTS.md and exactly the stranded hosts; --strict exit 1", () => {
    const { target, kitHome } = scratchRow();
    writeFileSync(join(target, "AGENTS.md"), "# My agents\n\nMy own instructions.\n");
    expect(runInstall(target, kitHome).status).toBe(0);
    const stranded = strandedOf(target, "AGENTS.md");
    expect(stranded.length, "premise: AGENTS.md strands some host").toBeGreaterThan(0);
    const c = strictCheck(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(1);
    const counted = countedRouteLines(c.stdout);
    expect(counted.length, c.stdout).toBe(1);
    expect(counted[0].startsWith("  WARN"), counted[0]).toBe(true);
    expect(counted[0]).toContain(`(it leaves ${stranded.join(", ")} without a route to the Orchestrator)`);
    for (const h of HOST_TOOLS) expect(reachVerdict(c.stdout, h).reaches, reachVerdict(c.stdout, h).line).toBe(!stranded.includes(h.name));
  });
});
