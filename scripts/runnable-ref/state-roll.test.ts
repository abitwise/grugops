// state-roll.test.ts — the host state roll (phase 37, plan 37-10, SPLIT-06, SPLIT-01, D-07, D-08).
//
// Every case runs the COMMITTED state-roll.js copied ALONE into an empty temporary directory, with no
// node_modules and no sibling script reachable: the host emulation that proves the file imports `node:`
// builtins only. Every repository it writes into is an mkdtempSync directory built from the imported
// state-layout constants, never this repository's own tree. The proof and the rollback with a deliberately
// faulty io are unit cases in scripts/state-rules.test.ts (executeRoll); these cases prove the same rules
// run on a host.
//
//   exit 0 → rolled and proven, or nothing to roll; --dry-run writes nothing
//   exit 1 → the proof failed and both files were restored (driven through executeRoll's unit cases)
//   exit 2 → could not run or refused, with nothing on stdout and nothing written

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import ts from "typescript";
import { skipLine, stageShapeOrSkip, stageSymlinkOrSkip } from "../check-platform-shapes.js";
import { ARCHIVE_REL, BOARD_DONE_ARCHIVE_REL, BOARD_REL, BUDGETS } from "../../install/state-layout.js";
import { parseBoard } from "../board-model.js";
import { DONE_ARCHIVE_HEADING } from "../state-rules.js";

const ROLL_TS = join(import.meta.dirname, "state-roll.ts");
const ROLL_JS = join(import.meta.dirname, "state-roll.js");
const KEEP = BUDGETS.doneRows;

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

/** The committed .js, copied alone into an empty directory. */
function hostCopy(): string {
  const host = mkTmp("grugops-state-roll-host-");
  const js = join(host, "state-roll.js");
  copyFileSync(ROLL_JS, js);
  return js;
}

const HOST_JS = hostCopy();

function run(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [HOST_JS, ...args], { encoding: "utf8", cwd: dirname(HOST_JS) });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** A ticket row. */
function row(n: number): string {
  return `- [ABC-${String(n).padStart(3, "0")}] finished ticket ${n}  (engineer, 2026-10-${String((n % 28) + 1).padStart(2, "0")})`;
}

/** The identifier of row(n). */
function idOf(n: number): string {
  return `ABC-${String(n).padStart(3, "0")}`;
}

/** A board whose Done column holds `count` rows, newest first, with columns before and after it. */
function boardText(count: number, eol = "\n"): string {
  return [
    "# Board",
    "_Updated: 2026-10-22 by orchestrator_",
    "",
    "## In Development (WIP 0/3)",
    "",
    "## Done (WIP unlimited)",
    "",
    ...Array.from({ length: count }, (_, i) => row(i + 1)),
    "",
    "## Blocked (visible, time-tracked)",
    "",
  ].join(eol);
}

/** A repository holding `board` at BOARD_REL and nothing else. */
function repo(board: string): string {
  const root = mkTmp("grugops-state-roll-repo-");
  mkdirSync(join(root, dirname(BOARD_REL)), { recursive: true });
  writeFileSync(join(root, BOARD_REL), board);
  return root;
}

/** The bytes at `rel`, after an lstat confirms a regular file is there; null when nothing is. */
function bytesAt(root: string, rel: string): string | null {
  const at = join(root, rel);
  let st;
  try {
    st = lstatSync(at);
  } catch {
    return null;
  }
  if (!st.isFile()) throw new Error(`PREMISE: ${rel} is not a regular file`);
  return readFileSync(at, "utf8");
}

/** The raw bytes at `rel`, after an lstat confirms a regular file is there. */
function rawAt(root: string, rel: string): Buffer {
  const at = join(root, rel);
  if (!lstatSync(at).isFile()) throw new Error(`PREMISE: ${rel} is not a regular file`);
  return readFileSync(at);
}

/** The Done row identifiers of a board-grammar document, in order. */
function doneIds(text: string): string[] {
  return parseBoard(text)
    .columns.filter((c) => c.name === "Done")
    .flatMap((c) => c.rows.map((r) => r.id));
}

/** An exit 2 that wrote nothing: empty stdout, the message on stderr, the board unchanged, no archive. */
function expectRefused(root: string, board: string, message: string, args: readonly string[] = []): void {
  const r = run(root, ...args);
  expect(r.status, r.stdout + r.stderr).toBe(2);
  expect(r.stdout).toBe("");
  expect(r.stderr).toContain(message);
  expect(bytesAt(root, BOARD_REL)).toBe(board);
}

describe("state-roll.js — Done rows past BUDGETS.doneRows move to the archive on a host (plan 37-10, D-07, D-08)", () => {
  it(`a board with ${KEEP + 3} Done rows keeps ${KEEP}, the other 3 open a new archive, and every other board byte is unchanged`, () => {
    const before = boardText(KEEP + 3);
    const root = repo(before);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const moved = [KEEP + 1, KEEP + 2, KEEP + 3];
    expect(r.stdout).toContain(moved.map((n) => `MOVED   ${idOf(n)}`).join("\n"));
    expect(r.stdout).toContain(BOARD_DONE_ARCHIVE_REL);
    expect(r.stderr).toBe("");

    const after = bytesAt(root, BOARD_REL);
    // Derived independently of the roll: the old bytes with exactly the three row lines removed.
    let expected = before;
    for (const n of moved) expected = expected.replace(`${row(n)}\n`, "");
    expect(after).toBe(expected);
    expect(doneIds(after ?? "")).toEqual(Array.from({ length: KEEP }, (_, i) => idOf(i + 1)));

    const archive = bytesAt(root, BOARD_DONE_ARCHIVE_REL);
    expect(archive).toBe(`${DONE_ARCHIVE_HEADING}\n${moved.map(row).join("\n")}\n`);
    expect(doneIds(archive ?? "")).toEqual(moved.map(idOf));
    expect(readdirSync(join(root, ARCHIVE_REL))).toEqual(["board-done.md"]);
  });

  it("a CRLF board with a byte-order mark keeps CRLF on every remaining line and its mark, and the archive is CRLF too", () => {
    const before = `﻿${boardText(KEEP + 2, "\r\n")}`;
    const root = repo(before);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const after = bytesAt(root, BOARD_REL) ?? "";
    expect(after.startsWith("﻿# Board\r\n")).toBe(true);
    const lines = after.split("\n");
    expect(lines.slice(0, -1).every((l) => l.endsWith("\r"))).toBe(true);
    expect(lines.at(-1)).toBe("");
    let expected = before;
    for (const n of [KEEP + 1, KEEP + 2]) expected = expected.replace(`${row(n)}\r\n`, "");
    expect(after).toBe(expected);
    expect(bytesAt(root, BOARD_DONE_ARCHIVE_REL)).toBe(
      `${DONE_ARCHIVE_HEADING}\r\n${row(KEEP + 1)}\r\n${row(KEEP + 2)}\r\n`,
    );
  });

  it("over an existing archive, the moved rows go above the older ones and every old archive line is kept", () => {
    const root = repo(boardText(KEEP + 2));
    mkdirSync(join(root, ARCHIVE_REL));
    const old = `${DONE_ARCHIVE_HEADING}\n\n${row(90)}\n${row(91)}\n`;
    writeFileSync(join(root, BOARD_DONE_ARCHIVE_REL), old);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(bytesAt(root, BOARD_DONE_ARCHIVE_REL)).toBe(
      `${DONE_ARCHIVE_HEADING}\n\n${row(KEEP + 1)}\n${row(KEEP + 2)}\n${row(90)}\n${row(91)}\n`,
    );
  });

  it(`a board with exactly ${KEEP} Done rows has nothing to roll: exit 0, nothing written, no archive directory`, () => {
    const before = boardText(KEEP);
    const root = repo(before);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(`holds ${KEEP} row(s), and it keeps ${KEEP} (BUDGETS.doneRows)`);
    expect(bytesAt(root, BOARD_REL)).toBe(before);
    expect(existsSync(join(root, ARCHIVE_REL))).toBe(false);
  });

  it("--dry-run writes nothing: the board is byte-identical and no archive directory or file appears", () => {
    const before = boardText(KEEP + 3);
    const root = repo(before);
    const r = run(root, "--dry-run");
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain("Dry run: 3 Done row(s) would move");
    expect(r.stdout).toContain("nothing was written");
    expect(bytesAt(root, BOARD_REL)).toBe(before);
    expect(existsSync(join(root, ARCHIVE_REL))).toBe(false);
  });
});

describe("state-roll.js — refusals: exit 2, nothing on stdout, nothing written (plan 37-10)", () => {
  it("no argument, two roots, an unknown option and --dry-run twice are exit 2", () => {
    const root = repo(boardText(1));
    for (const args of [[], [root, root], [root, "--force"], [root, "--dry-run", "--dry-run"]]) {
      const r = run(...args);
      expect(r.status, JSON.stringify(args)).toBe(2);
      expect(r.stdout).toBe("");
    }
  });

  it("a missing board is exit 2 naming it", () => {
    const root = mkTmp("grugops-state-roll-empty-");
    mkdirSync(join(root, dirname(BOARD_REL)), { recursive: true });
    const r = run(root);
    expect(r.status).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain(`the board file ${BOARD_REL} does not exist`);
  });

  it("a moved row carrying an HTML comment is refused by identifier, and nothing moves", () => {
    const before = boardText(KEEP + 1).replace(row(KEEP + 1), `${row(KEEP + 1)} <!-- note -->`);
    const root = repo(before);
    expectRefused(root, before, `${idOf(KEEP + 1)} on line`);
    expect(existsSync(join(root, ARCHIVE_REL))).toBe(false);
  });

  it("an archive with a heading other than the one Done heading is refused, its bytes untouched, and its control bytes never printed", () => {
    const before = boardText(KEEP + 1);
    const root = repo(before);
    mkdirSync(join(root, ARCHIVE_REL));
    const archive = "## Done\u0007 (WIP 1/3)\n";
    writeFileSync(join(root, BOARD_DONE_ARCHIVE_REL), archive);
    expectRefused(root, before, `${BOARD_DONE_ARCHIVE_REL}: the Done archive must carry exactly one column heading`);
    expect(run(root).stderr).not.toContain("\u0007");
    expect(bytesAt(root, BOARD_DONE_ARCHIVE_REL)).toBe(archive);
  });

  it("a board holding bytes that are not UTF-8 is refused: a text write would not keep them", () => {
    const root = repo(boardText(KEEP + 1));
    const raw = Buffer.concat([Buffer.from(boardText(KEEP + 1)), Buffer.from([0xff, 0x0a])]);
    writeFileSync(join(root, BOARD_REL), raw);
    const r = run(root);
    expect(r.status).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain("bytes that are not UTF-8");
    expect(rawAt(root, BOARD_REL).equals(raw)).toBe(true);
  });

  it("a symlinked archive directory pointing outside the repository root is refused by name before any write (T-37-18)", () => {
    const before = boardText(KEEP + 1);
    const root = repo(before);
    const outside = mkTmp("grugops-state-roll-outside-");
    const skipped = stageSymlinkOrSkip(
      outside,
      join(root, ARCHIVE_REL),
      "symlink leaving the repository root",
      "scripts/runnable-ref/state-roll.test.ts: the archive directory (plan 37-10)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "scripts/runnable-ref/trace-render.test.ts's outside-root cases (the same rule)"));
      return;
    }
    expectRefused(root, before, `the archive directory ${ARCHIVE_REL} resolves outside the repository root`);
    expect(readdirSync(outside)).toEqual([]);
  });

  it("a symlinked board is refused: a roll would replace the link with a file", () => {
    const before = boardText(KEEP + 1);
    const root = repo(before);
    const elsewhere = join(root, "board-elsewhere.md");
    writeFileSync(elsewhere, before);
    rmSync(join(root, BOARD_REL));
    const skipped = stageSymlinkOrSkip(
      elsewhere,
      join(root, BOARD_REL),
      "symlink inside the repository root",
      "scripts/runnable-ref/state-roll.test.ts: the board (plan 37-10)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the symlinked-archive-directory case beside this one"));
      return;
    }
    const r = run(root);
    expect(r.status).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain(`${BOARD_REL} is a symbolic link`);
    expect(lstatSync(join(root, BOARD_REL)).isSymbolicLink()).toBe(true);
    expect(bytesAt(root, "board-elsewhere.md")).toBe(before);
  });

  it("a FIFO at the Done archive is exit 2 naming it, and it is never opened", () => {
    const before = boardText(KEEP + 1);
    const root = repo(before);
    mkdirSync(join(root, ARCHIVE_REL));
    const skipped = stageShapeOrSkip(
      "FIFO",
      join(root, BOARD_DONE_ARCHIVE_REL),
      "scripts/runnable-ref/state-roll.test.ts: a FIFO at the Done archive (plan 37-10)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the symlinked-board case (the same lstat-before-open rule)"));
      return;
    }
    expectRefused(root, before, `${BOARD_DONE_ARCHIVE_REL} is present and is not a regular file`);
  });
});

describe("state-roll.ts imports node: builtins only and carries its rules in the generated region (plan 37-10)", () => {
  const source = readFileSync(ROLL_TS, "utf8");
  const sf = ts.createSourceFile(ROLL_TS, source, ts.ScriptTarget.ES2022, true);

  it("every import is a node: builtin", () => {
    const specifiers = sf.statements
      .filter(ts.isImportDeclaration)
      .map((d) => (d.moduleSpecifier as ts.StringLiteral).text);
    expect(specifiers.length).toBeGreaterThan(0);
    expect(specifiers.filter((s) => !s.startsWith("node:"))).toEqual([]);
  });

  it("the region carries executeRoll, checkConservation and atomicWrite exactly once each", () => {
    for (const name of ["executeRoll", "checkConservation", "planDoneRoll", "planArchiveInsert", "atomicWrite"]) {
      expect(source.split(`export function ${name}(`).length - 1, name).toBe(1);
    }
  });
});
