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
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { KIT_ROUTE, PI_PROMPT_REL } from "./host-tools.js";
import { contentRecord } from "./install-marker.js";
import { INSTALL_JS, MARKER_REL, runInstall, spawnBin, type Run } from "./installer-paths.test-support.js";
import { readMarkerObject, withLedger } from "./ledger.test-support.js";

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

  it("a user's edit drops the route from the template: --check WARNs, naming the file and quoting the sentence to add", () => {
    const { target, kitHome } = installed();
    const before = readFileSync(piFile(target), "utf8");
    writeFileSync(piFile(target), before.replace(` ${KIT_ROUTE}`, ""));
    expect(readFileSync(piFile(target), "utf8").includes(KIT_ROUTE), "premise: the edit removed the route").toBe(false);
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const warns = routeLines(c.stdout).filter((l) => l.startsWith("  WARN") && l.includes(PI_PROMPT_REL));
    expect(warns.length, c.stdout).toBe(1);
    expect(warns[0]).toContain(KIT_ROUTE);
    expect(c.stdout).not.toMatch(/FAILURE\(S\)/);
  });

  it("install's own template from an earlier install, with no route: --check FAILs and names the file", () => {
    const { target, kitHome } = installed();
    // An earlier install's template: the same bytes without the route, recorded in the ledger as install's.
    const old = readFileSync(piFile(target), "utf8").replace(` ${KIT_ROUTE}`, "");
    writeFileSync(piFile(target), old);
    const markerPath = join(target, ...MARKER_REL.split("/"));
    const rewritten = withLedger(readMarkerObject(target), (entries) => {
      const e = entries.find((x) => x.kind === "file" && x.path === PI_PROMPT_REL);
      expect(e, "premise: the ledger records the Pi template").toBeDefined();
      (e as Record<string, unknown>).content = contentRecord(old);
    });
    writeFileSync(markerPath, JSON.stringify(rewritten, null, 2) + "\n");
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(1);
    const fails = routeLines(c.stdout).filter((l) => l.startsWith("  FAIL") && l.includes(PI_PROMPT_REL));
    expect(fails.length, c.stdout).toBe(1);
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

  it("an absent template: --check WARNs that Pi has no /grugops template", () => {
    const { target, kitHome } = installed();
    rmSync(piFile(target));
    const c = check(target, kitHome);
    expect(c.status, c.stdout + c.stderr).toBe(0);
    const warns = routeLines(c.stdout).filter((l) => l.startsWith("  WARN") && l.includes(PI_PROMPT_REL));
    expect(warns.length, c.stdout).toBe(1);
  });
});
