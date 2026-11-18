// check-story-docs.test.ts — the cases for the story-docs gate (plan 43-03; D-22, D-23, D-11).
//
// Pure functions are imported from the committed `.js`; the refusal paths are run by spawning the
// committed `.js` against a hermetic CHECK_ROOT mirror under the OS temp dir, so the red is the
// shipped gate's own red and not a re-implementation of it here.

import { describe, it, expect, afterAll } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { GRUG_COMMAND_WORD, grugCommandFindings } from "./check-story-docs.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-story-docs.js");

// The commit phase 43 measured its baseline at (43-BASELINE.md, `base:`), before any phase-43 edit.
// CI checks out with `fetch-depth: 0`, so the object is reachable there too.
const BASE_COMMIT = "a067c6e6e7eb2090eb44b47a0d001e622248402e";

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

function writeIn(root: string, rel: string, text: string): void {
  const p = join(root, ...rel.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
}

function runGate(checkRoot: string): { status: number; out: string } {
  const r = spawnSync("node", [GATE_JS], { encoding: "utf8", env: { ...process.env, CHECK_ROOT: checkRoot } });
  return { status: r.status ?? -1, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

// The FAIL/PASS line of one check, picked out of the gate's output by its label.
function checkLine(out: string, labelStart: string): string {
  const line = out.split("\n").find((l) => /^\s+(PASS|FAIL)\s+/.test(l) && l.includes(labelStart));
  return line ?? "";
}

describe("check 1 — the /grug command word (D-23)", () => {
  it.each(["/grug", "`/grug`", "/grug:plan", "/grug-map", "/grug-release", "types /grug, and", "(literal `/grug`)"])(
    "matches %s",
    (s) => {
      expect(GRUG_COMMAND_WORD.test(s)).toBe(true);
    },
  );

  it.each([
    "/grugops",
    "/grugops:plan",
    "/grugops-map",
    "commands/grug.md",
    ".claude/skills/grug/SKILL.md",
    "grug:",
    "the grug plugin",
    "https://example.com/grug",
  ])("does not match %s", (s) => {
    expect(GRUG_COMMAND_WORD.test(s)).toBe(false);
  });

  it("finds the 13 /grug lines in CLAUDE.md at the phase-43 base commit", () => {
    const base = execFileSync("git", ["show", `${BASE_COMMIT}:CLAUDE.md`], { cwd: ROOT, encoding: "utf8" });
    expect(grugCommandFindings(base).map((f) => f.line)).toEqual([
      10, 22, 47, 65, 69, 91, 102, 111, 112, 129, 131, 133, 150,
    ]);
  });

  it("finds no /grug command word in the live CLAUDE.md", () => {
    const live = readFileSync(join(ROOT, "CLAUDE.md"), "utf8");
    const found = grugCommandFindings(live);
    expect(found.length, `CLAUDE.md lines naming /grug: ${found.map((f) => f.line).join(", ")}`).toBe(0);
  });

  it("refuses a mirror whose CLAUDE.md carries one planted /grug, naming the line", () => {
    const mirror = freshTmp("gops-story-grug-");
    writeIn(mirror, "CLAUDE.md", "# Project\n\nTypes `/grugops`.\nThen type `/grug` to start.\n");
    const { status, out } = runGate(mirror);
    expect(status).toBe(1);
    const line = checkLine(out, "STORY-05 /grug command word");
    expect(line).toContain("FAIL");
    expect(out).toContain("CLAUDE.md:4:");
    expect(out).not.toContain("CLAUDE.md:3:");
  });

  it("refuses a mirror with no CLAUDE.md as a check that visited nothing", () => {
    const mirror = freshTmp("gops-story-empty-");
    const { status, out } = runGate(mirror);
    expect(status).toBe(1);
    expect(checkLine(out, "STORY-05 /grug command word")).toContain("ZERO elements visited");
  });
});

describe("wiring", () => {
  it("package.json runs the gate as `check:story-docs`", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["check:story-docs"]).toBe("tsc --outDir .tmp-build && node scripts/check-story-docs.js");
  });

  it("CI runs the same gate module as `check:story-docs`, on a command line rather than in a comment", () => {
    // CI names gate modules directly (`node scripts/<gate>.js`); check-foundation-guards.test.ts derives
    // reachability from that spelling. The comment beside it names the npm script for a local run.
    const ci = readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8");
    const lines = ci.split("\n");
    const runLines = lines.filter((l) => !l.trim().startsWith("#") && l.trim() === "node scripts/check-story-docs.js");
    expect(runLines.length).toBe(1);
    expect(lines.some((l) => l.trim().startsWith("#") && l.includes("check:story-docs"))).toBe(true);
  });
});
