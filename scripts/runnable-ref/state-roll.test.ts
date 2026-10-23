// state-roll.test.ts — the host state roll (phase 37, plans 37-10 and 37-11, SPLIT-06, SPLIT-01, D-07, D-08, D-09).
//
// Every case runs the COMMITTED state-roll.js copied ALONE into an empty temporary directory, with no
// node_modules and no sibling script reachable: the host emulation that proves the file imports `node:`
// builtins only. Every repository it writes into is an mkdtempSync directory built from the imported
// state-layout constants, never this repository's own tree. The proof and the rollback with a deliberately
// faulty io are unit cases in scripts/state-rules.test.ts (executeRoll); these cases prove the same rules
// run on a host.
//
//   exit 0 → rolled and proven, or nothing to roll; --dry-run writes nothing
//   exit 1 → a write failed part way and both files were restored (plan 37-11 drives it on a host through a
//            directory that refuses writes; the failed-proof branch is driven through executeRoll's unit cases)
//   exit 2 → could not run or refused, with nothing on stdout and nothing written

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import ts from "typescript";
import { skipEntry, skipLine, stageShapeOrSkip, stageSymlinkOrSkip } from "../check-platform-shapes.js";
import {
  ARCHIVE_REL,
  BOARD_DONE_ARCHIVE_REL,
  BOARD_REL,
  BUDGETS,
  DECISIONS_REL,
  PROGRESS_ARCHIVE_REL,
  PROGRESS_REL,
  QUEUE_DONE_REL,
} from "../../install/state-layout.js";
import { parseBoard } from "../board-model.js";
import { DONE_ARCHIVE_HEADING, PROGRESS_ARCHIVE_TITLE } from "../state-rules.js";

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

// ── Plan 37-11: the progress roll, the refusals before any write, the dry-run PLAN lines, the re-run ──────────

/** One `##` section: its heading, a blank line, `filler` x's, a blank line. */
function section(heading: string, filler: number): string {
  return `## ${heading}\n\n${"x".repeat(filler)}\n\n`;
}

/** A section padded so the whole string is exactly `bytes` bytes (the headings below are ASCII). */
function sectionOf(heading: string, bytes: number): string {
  return section(heading, 1 + bytes - Buffer.byteLength(section(heading, 1)));
}

/**
 * The plan's behavior fixture: 17,000 bytes holding dated entries 2026-10-01, 2026-09-15 and 2026-10-10 and a
 * `## Standing directive` section; moving 2026-09-15 alone leaves it over BUDGETS.progressBytes.
 */
const P_HEAD = "# Progress\n\n";
const P_OCT01 = sectionOf("2026-10-01 sweep", 5_000);
const P_STANDING = section("Standing directive", 40);
const P_SEP15 = sectionOf("2026-09-15 first pass", 400);
const P_OCT10 = sectionOf("2026-10-10 later", 17_000 - Buffer.byteLength(P_HEAD + P_OCT01 + P_STANDING + P_SEP15));
const PROGRESS_17K = P_HEAD + P_OCT01 + P_STANDING + P_SEP15 + P_OCT10;

/** A fenced example of a progress entry: its dated heading sits inside a backtick fence (plan 37-23, WR-02). */
const P_FENCED_EXAMPLE = "```markdown\n## 2020-01-01 example entry\nwhat an entry looks like\n```\n";

/** Over budget; its only dated heading is the fenced example, beside a `## Standing directive` section. */
const P_FENCED_ONLY = `# Progress\n\n${P_FENCED_EXAMPLE}\n${sectionOf("Standing directive", 17_000)}`;

/** A real dated entry holding the fenced example, then a large `## Standing directive` section. */
const P_REAL_ABOVE_FENCE = `# Progress\n\n## 2026-10-01 real entry\ndid things\n\n${P_FENCED_EXAMPLE}\n${sectionOf("Standing directive", 17_000)}`;

/** A repository holding `board` and, when given, `progress` at PROGRESS_REL. */
function repoWith(board: string, progress: string | null): string {
  const root = repo(board);
  if (progress !== null) writeFileSync(join(root, PROGRESS_REL), progress);
  return root;
}

/** Write `text` at `rel` in `root`, creating its directory. */
function plant(root: string, rel: string, text: string): void {
  mkdirSync(join(root, dirname(rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
}

/** The 1-based line of `text` that is `line`. */
function lineNo(text: string, line: string): number {
  return text.split("\n").indexOf(line) + 1;
}

describe("state-roll.js — the progress roll on a host (plan 37-11, D-09)", () => {
  it("PREMISE: the fixture is 17,000 bytes and over BUDGETS.progressBytes even without 2026-09-15", () => {
    expect(Buffer.byteLength(PROGRESS_17K)).toBe(17_000);
    expect(17_000 - Buffer.byteLength(P_SEP15)).toBeGreaterThan(BUDGETS.progressBytes);
  });

  it("moves 2026-09-15, then 2026-10-01, whole, to the end of a new archive oldest first; the standing section and 2026-10-10 stay", () => {
    const root = repoWith(boardText(1), PROGRESS_17K);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stderr).toBe("");
    expect(r.stdout).toContain("MOVED   `## 2026-09-15 first pass`\nMOVED   `## 2026-10-01 sweep`");
    // Derived independently of the roll: the old bytes with exactly the two entries cut out.
    const after = bytesAt(root, PROGRESS_REL) ?? "";
    expect(after).toBe(P_HEAD + P_STANDING + P_OCT10);
    expect(Buffer.byteLength(after)).toBeLessThanOrEqual(BUDGETS.progressBytes);
    const archive = bytesAt(root, PROGRESS_ARCHIVE_REL) ?? "";
    expect(archive.startsWith(`${PROGRESS_ARCHIVE_TITLE}\n\n<!-- `)).toBe(true);
    expect(archive.endsWith(`-->\n${P_SEP15}${P_OCT01}`)).toBe(true);
    expect(bytesAt(root, BOARD_REL)).toBe(boardText(1));
    expect(existsSync(join(root, BOARD_DONE_ARCHIVE_REL))).toBe(false);
  });

  it("over an existing archive the entries are appended after every old line", () => {
    const root = repoWith(boardText(1), PROGRESS_17K);
    const old = `${PROGRESS_ARCHIVE_TITLE}\n\n${section("2026-08-01 older", 10)}`;
    plant(root, PROGRESS_ARCHIVE_REL, old);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(bytesAt(root, PROGRESS_ARCHIVE_REL)).toBe(`${old}${P_SEP15}${P_OCT01}`);
  });

  it("a progress file over budget with only standing sections is unchanged, exit 0, with a line naming them and the decision records directory", () => {
    const standingOnly = sectionOf("Standing directive", 17_000) + section("Ruling on gates", 10);
    const root = repoWith(boardText(1), standingOnly);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain("`## Standing directive`, `## Ruling on gates`");
    expect(r.stdout).toContain(`${DECISIONS_REL}/`);
    expect(bytesAt(root, PROGRESS_REL)).toBe(standingOnly);
    expect(existsSync(join(root, ARCHIVE_REL))).toBe(false);
  });

  it("WR-02: a dated heading inside a fenced block is no entry: the file is unchanged, exit 0, `Nothing can roll` (plan 37-23)", () => {
    const root = repoWith(boardText(1), P_FENCED_ONLY);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stderr).toBe("");
    expect(r.stdout).toContain(`Nothing can roll: ${PROGRESS_REL}`);
    expect(r.stdout).toContain("`## Standing directive`");
    expect(r.stdout).toContain(`${DECISIONS_REL}/`);
    expect(bytesAt(root, PROGRESS_REL)).toBe(P_FENCED_ONLY);
    expect(existsSync(join(root, ARCHIVE_REL))).toBe(false);
  });

  it("WR-02: with a real dated entry above the fence, --dry-run plans that entry, the fence inside its line span (plan 37-23)", () => {
    const board = boardText(1);
    const root = repoWith(board, P_REAL_ABOVE_FENCE);
    const r = run(root, "--dry-run");
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const first = lineNo(P_REAL_ABOVE_FENCE, "## 2026-10-01 real entry");
    const last = lineNo(P_REAL_ABOVE_FENCE, "## Standing directive") - 1;
    const fenced = lineNo(P_REAL_ABOVE_FENCE, "## 2020-01-01 example entry");
    expect(first).toBeLessThan(fenced);
    expect(fenced).toBeLessThan(last);
    const bytes = Buffer.byteLength(`${P_REAL_ABOVE_FENCE.split("\n").slice(first - 1, last).join("\n")}\n`);
    expect(r.stdout).toContain(
      `PLAN    progress  \`## 2026-10-01 real entry\`  lines ${first}-${last}  ${bytes} bytes  -> ${PROGRESS_ARCHIVE_REL}`,
    );
    expect(r.stdout).not.toContain("2020-01-01 example entry`  line");
    expect(bytesAt(root, PROGRESS_REL)).toBe(P_REAL_ABOVE_FENCE);
    expect(existsSync(join(root, ARCHIVE_REL))).toBe(false);
  });

  it("the decision records directory the message names is install/state-layout.ts's DECISIONS_REL, typed once", () => {
    const source = readFileSync(ROLL_TS, "utf8");
    expect(source).toContain(`const DECISION_RECORDS_DIR = "${DECISIONS_REL}";`);
    expect(source.split(DECISIONS_REL).length - 1).toBe(1);
  });

  it("both surfaces roll in one run: Done first, then progress, each proven", () => {
    const root = repoWith(boardText(KEEP + 2), PROGRESS_17K);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout.indexOf(`MOVED   ${idOf(KEEP + 1)}`)).toBeLessThan(r.stdout.indexOf("MOVED   `## 2026-09-15"));
    expect(doneIds(bytesAt(root, BOARD_DONE_ARCHIVE_REL) ?? "")).toEqual([idOf(KEEP + 1), idOf(KEEP + 2)]);
    expect(bytesAt(root, PROGRESS_REL)).toBe(P_HEAD + P_STANDING + P_OCT10);
  });
});

describe("state-roll.js — --dry-run prints every planned move and writes nothing (plan 37-11)", () => {
  it("prints a PLAN line per Done row and per progress entry, with line numbers and byte counts", () => {
    const board = boardText(KEEP + 2);
    const root = repoWith(board, PROGRESS_17K);
    const r = run(root, "--dry-run");
    expect(r.status, r.stdout + r.stderr).toBe(0);
    for (const n of [KEEP + 1, KEEP + 2]) {
      expect(r.stdout).toContain(
        `PLAN    done      ${idOf(n)}  line ${lineNo(board, row(n))}  ${Buffer.byteLength(row(n)) + 1} bytes  -> ${BOARD_DONE_ARCHIVE_REL}`,
      );
    }
    const sepStart = lineNo(PROGRESS_17K, "## 2026-09-15 first pass");
    const sepLines = P_SEP15.split("\n").length - 1;
    expect(r.stdout).toContain(
      `PLAN    progress  \`## 2026-09-15 first pass\`  lines ${sepStart}-${sepStart + sepLines - 1}  400 bytes  -> ${PROGRESS_ARCHIVE_REL}`,
    );
    expect(r.stdout).toContain("PLAN    progress  `## 2026-10-01 sweep`  lines 3-6  5000 bytes");
    expect(r.stdout).toContain("nothing was written");
    expect(bytesAt(root, BOARD_REL)).toBe(board);
    expect(bytesAt(root, PROGRESS_REL)).toBe(PROGRESS_17K);
    expect(existsSync(join(root, ARCHIVE_REL))).toBe(false);
  });
});

describe("state-roll.js — every ambiguous shape is refused before the first write: exit 2, nothing written (plan 37-11)", () => {
  it("a Done column holding a prose line between rows is exit 2 naming the line", () => {
    const before = boardText(KEEP + 3).replace(`${row(4)}\n`, `${row(4)}\nThis line is prose, not a row.\n`);
    const root = repo(before);
    expectRefused(root, before, `line(s) ${lineNo(before, "This line is prose, not a row.")}`);
    expect(existsSync(join(root, ARCHIVE_REL))).toBe(false);
  });

  it("an archive holding a second column heading is exit 2, its bytes untouched", () => {
    const before = boardText(KEEP + 1);
    const root = repo(before);
    const archive = `${DONE_ARCHIVE_HEADING}\n${row(90)}\n\n## Done (WIP unlimited)\n${row(91)}\n`;
    plant(root, BOARD_DONE_ARCHIVE_REL, archive);
    expectRefused(root, before, `${BOARD_DONE_ARCHIVE_REL}: the Done archive must carry exactly one column heading`);
    expect(bytesAt(root, BOARD_DONE_ARCHIVE_REL)).toBe(archive);
  });

  it("EDGE SPLIT-01: rows 21-23 already at the top of the archive (an interrupted roll) are exit 2 naming the three, nothing doubled", () => {
    const before = boardText(KEEP + 3);
    const root = repo(before);
    // The shape an interruption after the archive write and before the board write leaves.
    const archive = `${DONE_ARCHIVE_HEADING}\n${[KEEP + 1, KEEP + 2, KEEP + 3, 90].map(row).join("\n")}\n`;
    plant(root, BOARD_DONE_ARCHIVE_REL, archive);
    expectRefused(root, before, [KEEP + 1, KEEP + 2, KEEP + 3].map(idOf).join(", "));
    expect(bytesAt(root, BOARD_DONE_ARCHIVE_REL)).toBe(archive);
  });

  it("EDGE SPLIT-06: a progress entry whose heading line is already in the progress archive is exit 2 naming it, nothing doubled", () => {
    const board = boardText(1);
    const root = repoWith(board, PROGRESS_17K);
    const archive = `${PROGRESS_ARCHIVE_TITLE}\n\n${P_SEP15}`;
    plant(root, PROGRESS_ARCHIVE_REL, archive);
    expectRefused(root, board, "`## 2026-09-15 first pass`");
    expect(bytesAt(root, PROGRESS_REL)).toBe(PROGRESS_17K);
    expect(bytesAt(root, PROGRESS_ARCHIVE_REL)).toBe(archive);
  });

  it("a progress refusal with a Done roll due writes neither surface: every refusal is found before the first write", () => {
    const board = boardText(KEEP + 2);
    const root = repoWith(board, PROGRESS_17K);
    plant(root, PROGRESS_ARCHIVE_REL, "# Not the progress archive\n");
    expectRefused(root, board, `${PROGRESS_ARCHIVE_REL}: the progress archive must start with the line`);
    expect(existsSync(join(root, BOARD_DONE_ARCHIVE_REL))).toBe(false);
    expect(bytesAt(root, PROGRESS_REL)).toBe(PROGRESS_17K);
  });

  it("rows from a CRLF board into an existing LF archive are exit 2: the archive would mix line endings", () => {
    const before = boardText(KEEP + 1, "\r\n");
    const root = repo(before);
    const archive = `${DONE_ARCHIVE_HEADING}\n${row(90)}\n`;
    plant(root, BOARD_DONE_ARCHIVE_REL, archive);
    expectRefused(root, before, "mixed LF and CRLF line endings");
    expect(bytesAt(root, BOARD_DONE_ARCHIVE_REL)).toBe(archive);
  });
});

describe("state-roll.js — the move-only surfaces are never touched (v3.0 D-7)", () => {
  it("a planted file under .grugops/queue/done/ and one under memory-bank/50-decisions/ keep their bytes and mtime through a real roll", () => {
    const root = repoWith(boardText(KEEP + 2), PROGRESS_17K);
    const planted = [`${QUEUE_DONE_REL}/task-001.md`, `${DECISIONS_REL}/0001-standing.md`];
    const past = new Date("2026-01-02T03:04:05Z");
    for (const rel of planted) {
      plant(root, rel, `kept ${rel}\n`);
      utimesSync(join(root, rel), past, past);
    }
    const before = planted.map((rel) => lstatSync(join(root, rel)).mtimeMs);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain("MOVED   `## 2026-09-15");
    planted.forEach((rel, k) => {
      expect(bytesAt(root, rel)).toBe(`kept ${rel}\n`);
      expect(lstatSync(join(root, rel)).mtimeMs).toBe(before[k]);
    });
    expect(readdirSync(join(root, QUEUE_DONE_REL))).toEqual(["task-001.md"]);
    expect(readdirSync(join(root, DECISIONS_REL))).toEqual(["0001-standing.md"]);
  });

  it("the runnable does not embed or name the move-only paths' constants", () => {
    const source = readFileSync(ROLL_TS, "utf8");
    expect(source.match(/QUEUE_DONE_REL|QUEUE_DONE_ARCHIVE_REL|DECISIONS_REL|DECISIONS_ARCHIVE_REL/g)).toBeNull();
  });
});

/**
 * Make the directory at `dir` refuse writes for the duration of `body`, or return a skip entry when this host
 * does not enforce it (root, or a platform that ignores directory modes): a probe write decides, never a guess.
 */
function withReadOnlyDir(dir: string, position: string, body: () => void): void {
  chmodSync(dir, 0o555);
  try {
    const probe = join(dir, ".write-probe");
    let enforced = false;
    try {
      writeFileSync(probe, "");
      rmSync(probe);
    } catch {
      enforced = true;
    }
    if (!enforced) {
      console.warn(skipLine(skipEntry("read-only directory", position, "this host lets the process write a 0555 directory"), "the executeRoll faulty-io cases in scripts/state-rules.test.ts"));
      return;
    }
    body();
  } finally {
    chmodSync(dir, 0o755);
  }
}

describe("state-roll.js — exit 1 on a host: a write that fails part way is rolled back (plan 37-11)", () => {
  it("a Done roll whose board write fails after the archive write is exit 1: both files hold their old bytes", () => {
    const before = boardText(KEEP + 2);
    const root = repo(before);
    mkdirSync(join(root, ARCHIVE_REL));
    const archive = `${DONE_ARCHIVE_HEADING}\n${row(90)}\n`;
    writeFileSync(join(root, BOARD_DONE_ARCHIVE_REL), archive);
    withReadOnlyDir(join(root, dirname(BOARD_REL)), "scripts/runnable-ref/state-roll.test.ts: the board directory (plan 37-11)", () => {
      const r = run(root);
      expect(r.status, r.stdout + r.stderr).toBe(1);
      expect(r.stdout).toContain("ROLLED BACK (Done)");
      expect(bytesAt(root, BOARD_REL)).toBe(before);
      expect(bytesAt(root, BOARD_DONE_ARCHIVE_REL)).toBe(archive);
    });
  });

  it("a progress roll that fails after a proven Done roll is exit 1: the Done roll stays, the progress files hold their old bytes", () => {
    const board = boardText(KEEP + 2);
    const root = repoWith(board, PROGRESS_17K);
    withReadOnlyDir(join(root, dirname(PROGRESS_REL)), "scripts/runnable-ref/state-roll.test.ts: the memory bank directory (plan 37-11)", () => {
      const r = run(root);
      expect(r.status, r.stdout + r.stderr).toBe(1);
      expect(r.stdout).toContain(`MOVED   ${idOf(KEEP + 1)}`);
      expect(r.stdout).toContain("ROLLED BACK (progress)");
      expect(doneIds(bytesAt(root, BOARD_REL) ?? "")).toHaveLength(KEEP);
      expect(doneIds(bytesAt(root, BOARD_DONE_ARCHIVE_REL) ?? "")).toEqual([idOf(KEEP + 1), idOf(KEEP + 2)]);
      expect(bytesAt(root, PROGRESS_REL)).toBe(PROGRESS_17K);
      expect(existsSync(join(root, PROGRESS_ARCHIVE_REL))).toBe(false);
    });
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
    for (const name of [
      "executeRoll",
      "checkConservation",
      "planDoneRoll",
      "planArchiveInsert",
      "planProgressRoll",
      "planProgressAppend",
      "doneDuplicateRefusal",
      "lineEndingRefusal",
      "sectionEndIndex",
      "atomicWrite",
    ]) {
      expect(source.split(`export function ${name}(`).length - 1, name).toBe(1);
    }
  });
});
