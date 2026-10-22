// state-check.test.ts — the host state checker's D-12 contract and marker severity (phase 37, plan 37-03).
//
// Every case runs the COMMITTED state-check.js copied ALONE into an empty temporary directory, with no
// node_modules and no sibling script reachable: the host-emulation that proves the file imports `node:`
// builtins only. Each temporary repository is built from the imported state-layout constants, never from a
// spelled path.
//
//   exit 0 → no enforced finding (none at all, or warnings because the marker is not valid)
//   exit 1 → the marker is valid and at least one finding exists
//   exit 2 → could not run, with no pass line on stdout

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { BOARD_REL, BUDGETS, LAYOUT_MARKER_CONTENT, LAYOUT_MARKER_REL } from "../../install/state-layout.js";

const CHECK_JS = join(import.meta.dirname, "state-check.js");

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) {
    try {
      chmodSync(d, 0o755);
    } catch {
      // already removable
    }
    rmSync(d, { recursive: true, force: true });
  }
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

/** The committed .js, copied alone into an empty directory. */
function hostCopy(): string {
  const host = mkTmp("grugops-state-check-host-");
  const js = join(host, "state-check.js");
  copyFileSync(CHECK_JS, js);
  return js;
}

const HOST_JS = hostCopy();

function run(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [HOST_JS, ...args], { encoding: "utf8", cwd: dirname(HOST_JS) });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** A board of exactly `bytes` UTF-8 bytes whose only content is preamble lines, so only boardBytes can break. */
function boardOfBytes(bytes: number): string {
  const head = "# Board\n";
  let body = "";
  while (head.length + body.length + 80 <= bytes) body += `${"x".repeat(79)}\n`;
  const rest = bytes - head.length - body.length;
  if (rest > 0) body += rest === 1 ? "\n" : `${"y".repeat(rest - 1)}\n`;
  const text = head + body;
  expect(Buffer.byteLength(text, "utf8")).toBe(bytes);
  return text;
}

/** A temporary repository holding the given state files. */
function repo(files: { board?: string; marker?: string }): string {
  const root = mkTmp("grugops-state-check-repo-");
  if (files.board !== undefined) {
    mkdirSync(dirname(join(root, BOARD_REL)), { recursive: true });
    writeFileSync(join(root, BOARD_REL), files.board);
  }
  if (files.marker !== undefined) {
    mkdirSync(dirname(join(root, LAYOUT_MARKER_REL)), { recursive: true });
    writeFileSync(join(root, LAYOUT_MARKER_REL), files.marker);
  }
  return root;
}

const OVER = BUDGETS.boardBytes + 1;

describe("state-check.js — the board budget under the marker's severity (D-04, D-05, D-12)", () => {
  it("PREMISE: the copy sits alone in its directory and imports node: builtins only", () => {
    const src = readFileSync(HOST_JS, "utf8");
    const specifiers = [...src.matchAll(/^import [^;]*? from "([^"]+)";/gm)].map((m) => m[1]);
    expect(specifiers.length).toBeGreaterThan(0);
    expect(specifiers.filter((s) => !(s ?? "").startsWith("node:"))).toEqual([]);
  });

  it(`a ${OVER.toLocaleString("en-US")}-byte board with no marker prints a WARN line naming BUDGETS.boardBytes and exits 0`, () => {
    const r = run(repo({ board: boardOfBytes(OVER) }));
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toMatch(/^WARN {5}.*\(BUDGETS\.boardBytes\)$/m);
    expect(r.stdout).toContain(`${BOARD_REL}: 24,577 bytes, budget 24,576 bytes (BUDGETS.boardBytes)`);
    expect(r.stdout).toMatch(/^LAYOUT /m);
    expect(r.stdout).not.toContain("FINDING");
    expect(r.stdout).not.toContain("No findings.");
  });

  it("the same board with the D-14 marker prints a FINDING line and exits 1", () => {
    const r = run(repo({ board: boardOfBytes(OVER), marker: `${LAYOUT_MARKER_CONTENT}\n` }));
    expect(r.status, r.stderr).toBe(1);
    expect(r.stdout).toMatch(/^FINDING {2}.*\(BUDGETS\.boardBytes\)$/m);
    expect(r.stdout).not.toContain("WARN");
    expect(r.stdout).not.toContain("No findings.");
  });

  it("a board at the budget with the marker exits 0 with `No findings.`", () => {
    const r = run(repo({ board: boardOfBytes(BUDGETS.boardBytes), marker: LAYOUT_MARKER_CONTENT }));
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout.trim()).toBe("No findings.");
  });

  it("an unrecognized marker is a WARN naming it, and the over-budget board stays a warning with exit 0", () => {
    const r = run(repo({ board: boardOfBytes(OVER), marker: "layout: v2\n" }));
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain(`WARN     ${LAYOUT_MARKER_REL}: layout marker not recognized`);
    expect(r.stdout).toMatch(/^WARN {5}.*\(BUDGETS\.boardBytes\)$/m);
    expect(r.stdout).not.toContain("FINDING");
  });

  it("a missing board is a finding by name: a warning with no marker, exit 1 with the marker", () => {
    const warn = run(repo({}));
    expect(warn.status, warn.stderr).toBe(0);
    expect(warn.stdout).toContain(`WARN     ${BOARD_REL}: not measured`);
    const fail = run(repo({ marker: LAYOUT_MARKER_CONTENT }));
    expect(fail.status, fail.stderr).toBe(1);
    expect(fail.stdout).toContain(`FINDING  ${BOARD_REL}: not measured`);
  });
});

describe("state-check.js — exit 2 is could-not-run, never paired with a pass line", () => {
  const expectCouldNotRun = (r: { status: number | null; stdout: string; stderr: string }): void => {
    expect(r.status, r.stdout).toBe(2);
    expect(r.stdout, "exit 2 prints nothing on stdout").toBe("");
    expect(r.stderr).toMatch(/^Error: /);
    expect(r.stderr).toContain("did not run");
  };

  it("no argument exits 2 and prints usage on stderr", () => {
    const r = run();
    expectCouldNotRun(r);
    expect(r.stderr).toContain("Usage: node state-check.js <repo-root>");
  });

  it("a root that does not exist exits 2", () => {
    expectCouldNotRun(run(join(mkTmp("grugops-state-check-gone-"), "does-not-exist")));
  });

  it("a root that is a file exits 2", () => {
    const dir = mkTmp("grugops-state-check-file-");
    const file = join(dir, "not-a-dir");
    writeFileSync(file, "x");
    expectCouldNotRun(run(file));
  });

  it("a directory at the board path exits 2 naming the board file, and is never treated as absent", () => {
    const root = repo({ marker: LAYOUT_MARKER_CONTENT });
    mkdirSync(join(root, BOARD_REL), { recursive: true });
    const r = run(root);
    expectCouldNotRun(r);
    expect(r.stderr).toContain(BOARD_REL);
  });

  // Skipped on win32, which keeps only a read-only attribute and still reads a mode-000 file, and as root, which
  // reads it anyway: on both there is no unreadable file to build.
  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("a board that is present and unreadable exits 2 naming it", () => {
    const root = repo({ board: boardOfBytes(100) });
    chmodSync(join(root, BOARD_REL), 0o000);
    const r = run(root);
    chmodSync(join(root, BOARD_REL), 0o644);
    expectCouldNotRun(r);
    expect(r.stderr).toContain(BOARD_REL);
  });
});
