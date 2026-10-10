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
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { KIT_ROUTE, PI_PROMPT_REL } from "./host-tools.js";
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
