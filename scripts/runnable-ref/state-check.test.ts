// state-check.test.ts — the host state checker's D-12 contract and marker severity (phase 37, plans 37-03 and
// 37-04): every BUDGETS key, `--json`, sanitized output, links that leave the root, a FIFO, and the read-only
// proof over the syntax tree of state-check.ts.
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
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { skipLine, stageNameOrSkip, stageShapeOrSkip, stageSymlinkOrSkip } from "../check-platform-shapes.js";
import {
  BOARD_REL,
  BUDGET_COUNT,
  CONTEXT_ARCHIVE_REL,
  CONTEXT_REL,
  BUDGETS,
  DECISIONS_ARCHIVE_REL,
  DECISIONS_REL,
  LAYOUT_MARKER_CONTENT,
  LAYOUT_MARKER_REL,
  NFR_CATALOG_REL,
  NFR_DIR_REL,
  PROGRESS_REL,
  QUEUE_DONE_ARCHIVE_REL,
  QUEUE_DONE_REL,
  TICKETS_REL,
  TRACE_DIR_REL,
  TRACEABILITY_REL,
} from "../../install/state-layout.js";
import { renderTraceIndex } from "../trace-model.js";
import { ciWorkflow, ubuntuBlockCommands } from "../ci-workflow.testkit.js";

/**
 * The zero-row generated index (plan 37-09): a repository with no published note renders exactly this, so a
 * fixture that plants it has a fresh trace and its cases measure only what they plant.
 */
const ZERO_ROW_INDEX = renderTraceIndex([]);

const CHECK_JS = join(import.meta.dirname, "state-check.js");
const CHECK_TS = join(import.meta.dirname, "state-check.ts");

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

/**
 * A temporary repository holding the given state files, and both index files, whose absence is a finding by
 * name since plan 37-04 (so these board cases measure the board alone).
 */
function repo(files: { board?: string; marker?: string }): string {
  const root = mkTmp("grugops-state-check-repo-");
  for (const rel of [TRACEABILITY_REL, NFR_CATALOG_REL]) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), rel === TRACEABILITY_REL ? ZERO_ROW_INDEX : "# index\n");
  }
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

/** The MOVE-ONLY count lines of a run's stdout (plan 37-05: one per move-only surface, on every run). */
function countLines(stdout: string): string[] {
  return stdout.split("\n").filter((l) => l.startsWith("MOVE-ONLY "));
}

/** stdout without its MOVE-ONLY and TRACE count lines, for the cases that are about the findings alone. */
function withoutCounts(stdout: string): string {
  return stdout
    .split("\n")
    .filter((l) => !l.startsWith("MOVE-ONLY ") && !l.startsWith("TRACE "))
    .join("\n");
}

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
    expect(withoutCounts(r.stdout).trim()).toBe("No findings.");
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

// ── Every budget, the JSON form, sanitized output, links and FIFOs (plan 37-04, SPLIT-05, D-10, D-11, D-12) ──

/** Write `rel` under `root`, creating its parent directories. */
function plant(root: string, rel: string, text: string): void {
  const p = join(root, ...rel.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
}

/** Append text to a file of the repository. */
function appendTo(root: string, rel: string, text: string): void {
  const p = join(root, ...rel.split("/"));
  writeFileSync(p, `${readFileSync(p, "utf8")}${text}`);
}

/** `text` padded with one trailing line of `x` to exactly `bytes` UTF-8 bytes. */
function paddedTo(text: string, bytes: number): string {
  const pad = bytes - Buffer.byteLength(text, "utf8");
  if (pad < 2) throw new Error("PREMISE: the text is already at the requested size");
  return `${text}${"x".repeat(pad - 1)}\n`;
}

/** The NFR catalog line for NFR-001, in the one index line form (plan 37-05, D-13). */
const NFR_LINE_001 = "- [NFR-001](nfr/NFR-001.md) Performance: p95 under 300 ms\n";

/** A board that keeps every budget: one Ready row, and an empty Done column last, where appended rows land. */
const CLEAN_BOARD = "# Board\n\n## Ready (WIP unlimited)\n\n- [ABC-001] a ready ticket\n\n## Done (WIP unlimited)\n";

/**
 * A repository that keeps every budget: a board, both index files, a `.gitkeep` keeper in the ticket, NFR and
 * trace directories, one small ticket, and a progress file. Every path comes from the state-layout constants.
 * The trace index is the zero-row generated one, so the trace is fresh (plan 37-09).
 */
function cleanRepo(marker?: string): string {
  const root = mkTmp("grugops-state-check-clean-");
  plant(root, BOARD_REL, CLEAN_BOARD);
  plant(root, TRACEABILITY_REL, ZERO_ROW_INDEX);
  plant(root, NFR_CATALOG_REL, "# NFR catalog\n");
  for (const dir of [TICKETS_REL, NFR_DIR_REL, TRACE_DIR_REL]) plant(root, `${dir}/.gitkeep`, "");
  plant(root, `${TICKETS_REL}/ABC-001.md`, "# ABC-001\n");
  plant(root, PROGRESS_REL, "# Progress\n");
  if (marker !== undefined) plant(root, LAYOUT_MARKER_REL, marker);
  return root;
}

/**
 * One planter per BUDGETS key, each breaking ONLY its own budget in a clean repository. Typed as a Record over
 * the BUDGETS keys, so a key without a planter fails typecheck, and counted against BUDGET_COUNT below, so the
 * table cannot shrink either.
 */
const planters: Record<keyof typeof BUDGETS, (root: string) => void> = {
  boardBytes: (r) => plant(r, BOARD_REL, paddedTo(CLEAN_BOARD, BUDGETS.boardBytes + 1)),
  boardRowChars: (r) => {
    const head = "- [ABC-901] ";
    appendTo(r, BOARD_REL, `\n${head}${"t".repeat(BUDGETS.boardRowChars + 1 - head.length)}\n`);
  },
  boardUpdatedLines: (r) => appendTo(r, BOARD_REL, "\n_Updated: 2026-10-21 by qe\n_Updated: 2026-10-22 by qe\n"),
  indexEntryBytes: (r) => appendTo(r, NFR_CATALOG_REL, `${"e".repeat(BUDGETS.indexEntryBytes + 1)}\n`),
  ticketBytes: (r) => plant(r, `${TICKETS_REL}/ABC-002.md`, paddedTo("# ABC-002\n", BUDGETS.ticketBytes + 1)),
  nfrBytes: (r) => {
    plant(r, `${NFR_DIR_REL}/NFR-001.md`, paddedTo("# NFR-001\n", BUDGETS.nfrBytes + 1));
    appendTo(r, NFR_CATALOG_REL, NFR_LINE_001);
  },
  traceBytes: (r) => plant(r, `${TRACE_DIR_REL}/ABC-083.md`, paddedTo("# ABC-083\n", BUDGETS.traceBytes + 1)),
  progressBytes: (r) => plant(r, PROGRESS_REL, paddedTo("# Progress\n", BUDGETS.progressBytes + 1)),
  doneRows: (r) =>
    appendTo(
      r,
      BOARD_REL,
      `\n${Array.from({ length: BUDGETS.doneRows + 1 }, (_v, i) => `- [ABC-${700 + i}] done row`).join("\n")}\n`,
    ),
};

/** The finding lines (WARN or FINDING) that name any budget constant; a ROLLABLE line is a report, not a finding. */
function budgetLines(stdout: string): string[] {
  return stdout.split("\n").filter((l) => /^(WARN|FINDING) /.test(l) && l.includes("(BUDGETS."));
}

type JsonFinding = {
  rel: string;
  key: string;
  measured: number | null;
  budget: number;
  unit: string;
  line: number | null;
};
type JsonMoveOnly = { live: string; archive: string; liveCount: number | null; archivedCount: number | null };
type JsonReport = {
  ok: boolean;
  marker: string;
  enforced: boolean;
  findings: JsonFinding[];
  rollable: string[];
  moveOnly: JsonMoveOnly[];
  trace: { compared: boolean; findings: (JsonFinding & { note: string | null })[] };
};

/** Run with `--json` and parse stdout, which must be exactly one JSON document on one line. */
function runJson(root: string): { status: number | null; report: JsonReport; stdout: string; stderr: string } {
  const r = run(root, "--json");
  const lines = r.stdout.split("\n").filter((l) => l.length > 0);
  expect(lines, `stdout: ${r.stdout} stderr: ${r.stderr}`).toHaveLength(1);
  return { ...r, report: JSON.parse(lines[0] ?? "") as JsonReport };
}

/** Every C0 code point except newline, DEL and every C1 code point. Built from numbers: no raw byte here. */
const CONTROL_EXCEPT_NEWLINE = new RegExp("[\\u0000-\\u0009\\u000b-\\u001f\\u007f-\\u009f]");

describe("state-check.js — every BUDGETS key, under the marker's severity (plan 37-04, D-04, D-05, D-10)", () => {
  it("the planter table covers every BUDGETS key: its size equals BUDGET_COUNT", () => {
    expect(Object.keys(planters).length).toBe(BUDGET_COUNT);
    expect(Object.keys(planters).sort()).toEqual(Object.keys(BUDGETS).sort());
  });

  it("CONTROL: the clean repository (a .gitkeep in the ticket, NFR and trace directories) prints `No findings.` and exits 0", () => {
    for (const marker of [undefined, LAYOUT_MARKER_CONTENT]) {
      const r = run(cleanRepo(marker));
      expect(r.status, r.stderr).toBe(0);
      expect(withoutCounts(r.stdout)).toBe("No findings.\n");
      expect(countLines(r.stdout)).toEqual([
        `MOVE-ONLY ${QUEUE_DONE_REL}: 0 live, 0 archived`,
        `MOVE-ONLY ${DECISIONS_REL}: 0 live, 0 archived`,
      ]);
      expect(r.stderr).toBe("");
    }
  });

  it.each(Object.keys(BUDGETS) as (keyof typeof BUDGETS)[])(
    "a repository with only BUDGETS.%s broken prints WARN lines naming it, and exits 0 with no marker",
    (key) => {
      const root = cleanRepo();
      planters[key](root);
      const r = run(root);
      expect(r.status, r.stderr).toBe(0);
      const lines = budgetLines(r.stdout);
      expect(lines.length, r.stdout).toBe(1);
      for (const l of lines) {
        expect(l, r.stdout).toContain(`(BUDGETS.${key})`);
        expect(l.startsWith("WARN     "), r.stdout).toBe(true);
      }
      expect(r.stdout).toMatch(/^LAYOUT /m);
      expect(r.stdout).not.toContain("FINDING");
      expect(r.stdout).not.toContain("No findings.");
    },
  );

  it.each(Object.keys(BUDGETS) as (keyof typeof BUDGETS)[])(
    "with the D-14 marker, the broken BUDGETS.%s prints a FINDING line and exits 1",
    (key) => {
      const root = cleanRepo(`${LAYOUT_MARKER_CONTENT}\n`);
      planters[key](root);
      const r = run(root);
      expect(r.status, r.stderr).toBe(1);
      const lines = budgetLines(r.stdout);
      expect(lines.length, r.stdout).toBe(1);
      for (const l of lines) {
        expect(l, r.stdout).toContain(`(BUDGETS.${key})`);
        expect(l.startsWith("FINDING  "), r.stdout).toBe(true);
      }
      expect(r.stdout).not.toContain("WARN");
      expect(r.stdout).not.toContain("No findings.");
    },
  );

  it("a missing index file is a finding by name, never a silent pass", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    rmSync(join(root, ...TRACEABILITY_REL.split("/")));
    const r = run(root);
    expect(r.status, r.stderr).toBe(1);
    expect(r.stdout).toContain(`FINDING  ${TRACEABILITY_REL}: not measured`);
  });

  it("findings print in sortFindings order, and two runs print identical output", () => {
    const root = cleanRepo();
    for (const key of Object.keys(planters) as (keyof typeof BUDGETS)[]) planters[key](root);
    const a = run(root);
    const b = run(root);
    expect(a.stdout).toBe(b.stdout);
    const rels = budgetLines(a.stdout).map((l) => l.slice("WARN     ".length).split(":")[0] ?? "");
    expect(rels.length).toBe(BUDGET_COUNT);
    const sorted = [...rels].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    expect(rels).toEqual(sorted);
  });
});

describe("state-check.js --json — one document { ok, marker, enforced, findings } and nothing else (D-12)", () => {
  it("a clean repository with no marker: ok, marker absent, not enforced, no findings, exit 0", () => {
    const r = runJson(cleanRepo());
    expect(r.status).toBe(0);
    expect(r.report).toEqual({
      ok: true,
      marker: "absent",
      enforced: false,
      findings: [],
      rollable: [],
      moveOnly: [
        { live: QUEUE_DONE_REL, archive: QUEUE_DONE_ARCHIVE_REL, liveCount: 0, archivedCount: 0 },
        { live: DECISIONS_REL, archive: DECISIONS_ARCHIVE_REL, liveCount: 0, archivedCount: 0 },
      ],
      trace: { compared: true, findings: [] },
    });
    expect(r.stderr).toBe("");
  });

  it("a broken budget with the marker: ok false exactly when the exit code is 1, and the finding carries every field", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    planters.boardRowChars(root);
    const r = runJson(root);
    expect(r.status).toBe(1);
    expect(r.report.ok).toBe(false);
    expect(r.report.marker).toBe("valid");
    expect(r.report.enforced).toBe(true);
    expect(r.report.findings).toHaveLength(1);
    const f = r.report.findings[0];
    expect(Object.keys(f ?? {})).toEqual(expect.arrayContaining(["rel", "key", "measured", "budget", "unit", "line"]));
    expect(f).toMatchObject({ rel: BOARD_REL, key: "boardRowChars", budget: BUDGETS.boardRowChars, unit: "characters" });
    expect(f?.measured).toBe(BUDGETS.boardRowChars + 1);
    expect(typeof f?.line).toBe("number");
  });

  it("the same finding with no marker is a warning: ok true, not enforced, exit 0, and no LAYOUT line on stdout", () => {
    const root = cleanRepo();
    planters.ticketBytes(root);
    const r = runJson(root);
    expect(r.status).toBe(0);
    expect(r.report.ok).toBe(true);
    expect(r.report.enforced).toBe(false);
    expect(r.report.findings.map((f) => f.key)).toEqual(["ticketBytes"]);
    expect(r.report.findings[0]?.line).toBeNull();
  });

  it("an unrecognized marker is marker invalid and not enforced", () => {
    const root = cleanRepo("layout: v2\n");
    planters.nfrBytes(root);
    const r = runJson(root);
    expect(r.status).toBe(0);
    expect(r.report).toMatchObject({ ok: true, marker: "invalid", enforced: false });
  });

  it("could-not-run with --json is exit 2 with nothing on stdout", () => {
    const r = run(join(mkTmp("grugops-state-check-gone-"), "does-not-exist"), "--json");
    expect(r.status).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain("did not run");
  });

  it("an unknown flag is exit 2 with usage on stderr, never a pass", () => {
    const r = run(cleanRepo(), "--jsno");
    expect(r.status).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain("Usage: node state-check.js <repo-root> [--json]");
  });
});

describe("state-check.js — every printed value is sanitized (T-37-07)", () => {
  const ESC = String.fromCharCode(0x1b);
  const BEL = String.fromCharCode(0x07);
  const CSI = String.fromCharCode(0x9b);
  const DEL = String.fromCharCode(0x7f);

  // A host that refuses a control character in a file name (windows-latest) is a printed, counted skip through
  // the platform-shape corpus (plan 33-05, D-16), never a pass.
  it("a ticket file named with ESC, BEL, DEL and a C1 character prints with them removed, in the text and the JSON", () => {
      const root = cleanRepo(LAYOUT_MARKER_CONTENT);
      const name = `ABC-0${ESC}[31m${CSI}0${BEL}${DEL}2.md`;
      const clean = "ABC-0[31m02.md";
      const skipped = stageNameOrSkip(
        () => plant(root, `${TICKETS_REL}/${name}`, paddedTo("# ticket\n", BUDGETS.ticketBytes + 1)),
        "scripts/runnable-ref/state-check.test.ts: a ticket named with control characters (plan 37-04)",
      );
      if (skipped !== null) {
        console.warn(skipLine(skipped, "the root-argument case beside this one (the same sanitizer)"));
        return;
      }
      const text = run(root);
      expect(text.status, text.stderr).toBe(1);
      expect(text.stdout).toContain(`FINDING  ${TICKETS_REL}/${clean}: 65,537 bytes`);
      expect(CONTROL_EXCEPT_NEWLINE.test(text.stdout), JSON.stringify(text.stdout)).toBe(false);
      const json = runJson(root);
      expect(CONTROL_EXCEPT_NEWLINE.test(json.stdout), JSON.stringify(json.stdout)).toBe(false);
      expect(json.report.findings.map((f) => f.rel)).toEqual([`${TICKETS_REL}/${clean}`]);
  });

  it("a root argument carrying control characters is echoed on stderr with them removed", () => {
    const gone = join(mkTmp("grugops-state-check-gone-"), `no${ESC}]0;title${BEL}pe${CSI}`);
    const r = run(gone);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("no]0;titlepe");
    expect(CONTROL_EXCEPT_NEWLINE.test(r.stderr), JSON.stringify(r.stderr)).toBe(false);
  });
});

describe("state-check.js — a path that resolves outside the root is refused by name, never measured", () => {
  /** Stage a link through the platform-shape corpus; a host without the privilege is a printed, counted skip. */
  function linkOrSkip(target: string, at: string, position: string): boolean {
    const skipped = stageSymlinkOrSkip(
      target,
      at,
      "symlink leaving the repository root",
      `scripts/runnable-ref/state-check.test.ts: ${position} (plan 37-04)`,
    );
    if (skipped !== null) console.warn(skipLine(skipped, "scripts/validate.test.ts's lstat cases (the same entry rule)"));
    return skipped === null;
  }

  it("a symlinked ticket directory pointing outside the repository root is reported as outside the root", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    const outside = mkTmp("grugops-state-check-outside-");
    writeFileSync(join(outside, "ABC-009.md"), paddedTo("# ABC-009\n", BUDGETS.ticketBytes + 1));
    rmSync(join(root, ...TICKETS_REL.split("/")), { recursive: true, force: true });
    if (!linkOrSkip(outside, join(root, ...TICKETS_REL.split("/")), "a ticket directory linked outside the root")) return;
    const r = run(root);
    expect(r.status, r.stderr).toBe(1);
    expect(r.stdout).toContain(`FINDING  ${TICKETS_REL}: not measured`);
    expect(r.stdout).toContain("outside the repository root");
    expect(r.stdout).not.toContain("ABC-009");
    expect(r.stdout).not.toContain("65,537");
  });

  it("a ticket entry linked to a file outside the root is reported as outside the root and not measured", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    const outside = mkTmp("grugops-state-check-outside-");
    writeFileSync(join(outside, "big.md"), paddedTo("# big\n", BUDGETS.ticketBytes + 1));
    const at = join(root, ...TICKETS_REL.split("/"), "ABC-010.md");
    if (!linkOrSkip(join(outside, "big.md"), at, "a ticket entry linked outside the root")) return;
    const r = run(root);
    expect(r.status, r.stderr).toBe(1);
    expect(r.stdout).toContain(`FINDING  ${TICKETS_REL}/ABC-010.md: not measured`);
    expect(r.stdout).toContain("outside the repository root");
    expect(r.stdout).not.toContain("65,537");
  });

  it("a board linked outside the root is a finding by name and is not read", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    const outside = mkTmp("grugops-state-check-outside-");
    writeFileSync(join(outside, "board.md"), paddedTo(CLEAN_BOARD, BUDGETS.boardBytes + 1));
    rmSync(join(root, ...BOARD_REL.split("/")));
    if (!linkOrSkip(join(outside, "board.md"), join(root, ...BOARD_REL.split("/")), "a board linked outside the root")) return;
    const r = run(root);
    expect(r.status, r.stderr).toBe(1);
    expect(r.stdout).toContain(`FINDING  ${BOARD_REL}: not measured`);
    expect(r.stdout).toContain("outside the repository root");
    expect(r.stdout).not.toContain("24,577");
  });

  it("CONTROL: a ticket entry linked inside the root is not outside the root, and is still not measured (lstat)", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    const target = join(root, ...TICKETS_REL.split("/"), "ABC-001.md");
    const at = join(root, ...TICKETS_REL.split("/"), "ABC-011.md");
    if (!linkOrSkip(target, at, "a ticket entry linked inside the root")) return;
    const r = run(root);
    expect(r.status, r.stderr).toBe(1);
    expect(r.stdout).toContain(`FINDING  ${TICKETS_REL}/ABC-011.md: not measured`);
    expect(r.stdout).toContain("not a regular file");
    expect(r.stdout).not.toContain("outside the repository root");
  });
});

/**
 * Stage a FIFO through the platform-shape corpus (plan 33-05, D-16): `mkfifo` followed by `isFIFO()`, so a
 * host that cannot make one prints a counted skip line instead of passing a case that measured nothing.
 */
function fifoAtOrSkip(at: string, position: string): boolean {
  const skipped = stageShapeOrSkip("FIFO", at, `scripts/runnable-ref/state-check.test.ts: ${position} (plan 37-04)`);
  if (skipped !== null) {
    console.warn(skipLine(skipped, "the directory-at-the-board-path case (the same stat-before-open rule)"));
    return false;
  }
  expect(statSync(at).isFIFO(), "PREMISE: the planted path is not a FIFO").toBe(true);
  return true;
}

describe("state-check.js — a FIFO at a state path never hangs the check (T-37-31)", () => {
  it("a FIFO at the board path exits 2 naming the board, in bounded time", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    rmSync(join(root, ...BOARD_REL.split("/")));
    if (!fifoAtOrSkip(join(root, ...BOARD_REL.split("/")), "a FIFO at the board path")) return;
    const r = spawnSync(process.execPath, [HOST_JS, root], { encoding: "utf8", timeout: 15_000 });
    expect(r.error, "the check did not finish in bounded time").toBeUndefined();
    expect(r.status).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain(BOARD_REL);
  });

  it("a FIFO ending .md in the ticket directory is a finding by name, never opened", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    if (!fifoAtOrSkip(join(root, ...TICKETS_REL.split("/"), "ABC-077.md"), "a FIFO in the ticket directory")) return;
    const r = spawnSync(process.execPath, [HOST_JS, root], { encoding: "utf8", timeout: 15_000 });
    expect(r.error, "the check did not finish in bounded time").toBeUndefined();
    expect(r.status).toBe(1);
    expect(r.stdout).toContain(`FINDING  ${TICKETS_REL}/ABC-077.md: not measured`);
  });
});

describe("state-check.ts is read-only: its syntax tree calls no file-mutating API (SPLIT-05 concurrency)", () => {
  const source = readFileSync(CHECK_TS, "utf8");
  const sf = ts.createSourceFile(CHECK_TS, source, ts.ScriptTarget.ES2022, true);
  const calls: ts.CallExpression[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n)) calls.push(n);
    n.forEachChild(visit);
  };
  visit(sf);

  /** The called name: the identifier, or the last property of a property access. */
  const calleeName = (c: ts.CallExpression): string => {
    const e = c.expression;
    if (ts.isIdentifier(e)) return e.text;
    if (ts.isPropertyAccessExpression(e)) return e.name.text;
    return `<${ts.SyntaxKind[e.kind]}>`;
  };

  /** Writing to the two standard streams is output, not a file write. */
  const STREAM_WRITES = new Set(["process.stdout.write", "process.stderr.write"]);
  const MUTATING =
    /^(write|writev|writeFile|appendFile|rename|unlink|rm|rmdir|mkdir|mkdtemp|copyFile|cp|symlink|link|truncate|ftruncate|chmod|lchmod|fchmod|chown|lchown|fchown|utimes|lutimes|futimes|createWriteStream|watch|watchFile)(Sync)?$/;

  it("PREMISE: the walk saw the reader's open and the output writes", () => {
    expect(calls.length).toBeGreaterThan(50);
    expect(calls.map(calleeName)).toContain("openSync");
    expect(calls.map((c) => c.expression.getText(sf))).toContain("process.stdout.write");
  });

  // 2026-10-22, plan 37-09: node:crypto joins. The embedded note reader's seal check hashes a note with
  // createHash, which reads only; every specifier is still a `node:` builtin, and no other module is imported.
  it("imports node:crypto, node:fs and node:path only", () => {
    const specifiers = sf.statements
      .filter(ts.isImportDeclaration)
      .map((d) => (d.moduleSpecifier as ts.StringLiteral).text)
      .sort();
    expect([...new Set(specifiers)]).toEqual(["node:crypto", "node:fs", "node:path"]);
  });

  it("calls no write, rename, unlink, rm, rmdir, mkdir, copyFile, symlink, truncate or appendFile API", () => {
    const hits = calls
      .filter((c) => MUTATING.test(calleeName(c)) && !STREAM_WRITES.has(c.expression.getText(sf)))
      .map((c) => c.expression.getText(sf));
    expect(hits).toEqual([]);
  });

  it("calls nothing through a computed member, so no API name can hide from the walk", () => {
    const hits = calls.filter((c) => ts.isElementAccessExpression(c.expression)).map((c) => c.getText(sf));
    expect(hits).toEqual([]);
  });

  it("opens no descriptor with a w, a or r+ flag, or with O_WRONLY, O_RDWR, O_CREAT, O_APPEND or O_TRUNC", () => {
    const opens = calls.filter((c) => /^(open|openSync)$/.test(calleeName(c)));
    expect(opens.length).toBeGreaterThan(0);
    for (const c of opens) {
      const flag = c.arguments[1];
      expect(flag, c.getText(sf)).toBeDefined();
      const text = flag?.getText(sf) ?? "";
      expect(text, c.getText(sf)).not.toMatch(/O_WRONLY|O_RDWR|O_CREAT|O_APPEND|O_TRUNC/);
      if (flag !== undefined && ts.isStringLiteral(flag)) expect(flag.text).toBe("r");
      expect(text).toMatch(/O_RDONLY|^["']r["']$/);
    }
  });
});

// ── The NFR index against the NFR files, on a host (plan 37-05, D-13, SPLIT-02) ──────────────────────

/** The stdout lines that carry an NFR integrity finding. */
function nfrLines(stdout: string): string[] {
  return stdout.split("\n").filter((l) => /\(nfr-[a-z-]+\)$/.test(l));
}

/** A clean repository whose catalog indexes NFR-001 and NFR-002 and whose nfr/ holds both files beside .gitkeep. */
function nfrRepo(marker?: string): string {
  const root = cleanRepo(marker);
  appendTo(root, NFR_CATALOG_REL, `${NFR_LINE_001}- [NFR-002](nfr/NFR-002.md) Security: TLS 1.3 on every endpoint\n`);
  plant(root, `${NFR_DIR_REL}/NFR-001.md`, "# NFR-001\n");
  plant(root, `${NFR_DIR_REL}/NFR-002.md`, "# NFR-002\n");
  return root;
}

describe("state-check.js — the NFR index and the NFR files agree, checked on a host (plan 37-05, D-13)", () => {
  it("CONTROL: an index and nfr/ that agree, with nfr/.gitkeep present, print no NFR finding", () => {
    for (const marker of [undefined, LAYOUT_MARKER_CONTENT]) {
      const r = run(nfrRepo(marker));
      expect(r.status, r.stderr).toBe(0);
      expect(nfrLines(r.stdout), r.stdout).toEqual([]);
      expect(r.stdout).toContain("No findings.");
    }
  });

  it("removing one NFR file prints one WARN finding naming that NFR, and exits 0 with no marker", () => {
    const root = nfrRepo();
    rmSync(join(root, ...`${NFR_DIR_REL}/NFR-002.md`.split("/")));
    const r = run(root);
    expect(r.status, r.stderr).toBe(0);
    const lines = nfrLines(r.stdout);
    expect(lines, r.stdout).toHaveLength(1);
    expect(lines[0]).toMatch(/^WARN {5}/);
    expect(lines[0]).toContain(`${NFR_DIR_REL}/NFR-002.md`);
    expect(lines[0]).toContain("(nfr-missing-file)");
    expect(r.stdout).not.toContain("No findings.");
  });

  it("the same with the D-14 marker prints a FINDING line and exits 1", () => {
    const root = nfrRepo(LAYOUT_MARKER_CONTENT);
    rmSync(join(root, ...`${NFR_DIR_REL}/NFR-002.md`.split("/")));
    const r = run(root);
    expect(r.status, r.stderr).toBe(1);
    const lines = nfrLines(r.stdout);
    expect(lines, r.stdout).toHaveLength(1);
    expect(lines[0]).toMatch(/^FINDING {2}/);
    expect(lines[0]).toContain("NFR-002");
  });

  it("an unindexed file, a wrong link and a malformed line are each one finding, in --json with null budget and unit", () => {
    const root = nfrRepo(LAYOUT_MARKER_CONTENT);
    plant(root, `${NFR_DIR_REL}/NFR-003.md`, "# NFR-003\n");
    appendTo(root, NFR_CATALOG_REL, "- [NFR-009](nfr/../../../etc/passwd) traversal\n- [NFR-004] no link\n");
    const r = runJson(root);
    expect(r.status, r.stderr).toBe(1);
    const nfrKeys = r.report.findings.map((f) => `${f.key}|${f.rel}`).filter((k) => k.startsWith("nfr-"));
    expect(nfrKeys.sort()).toEqual(
      [
        `nfr-link-mismatch|${NFR_CATALOG_REL}`,
        `nfr-malformed-line|${NFR_CATALOG_REL}`,
        `nfr-missing-file|${NFR_DIR_REL}/NFR-009.md`,
        `nfr-unindexed-file|${NFR_DIR_REL}/NFR-003.md`,
      ].sort(),
    );
    for (const f of r.report.findings.filter((x) => x.key.startsWith("nfr-"))) {
      expect(f.budget).toBeNull();
      expect(f.unit).toBeNull();
      expect(f.measured).toBeNull();
    }
  });

  it("an absent nfr/ directory with zero index lines prints no NFR finding", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    rmSync(join(root, ...NFR_DIR_REL.split("/")), { recursive: true });
    const r = run(root);
    expect(r.status, r.stderr).toBe(0);
    expect(nfrLines(r.stdout)).toEqual([]);
  });

  it("an absent catalog is a finding by name, and every NFR file is then unindexed", () => {
    const root = nfrRepo(LAYOUT_MARKER_CONTENT);
    rmSync(join(root, ...NFR_CATALOG_REL.split("/")));
    const r = run(root);
    expect(r.status, r.stderr).toBe(1);
    expect(r.stdout).toContain(`FINDING  ${NFR_CATALOG_REL}: not measured`);
    expect(nfrLines(r.stdout).filter((l) => l.includes("(nfr-unindexed-file)"))).toHaveLength(2);
  });
});

// ── Rollable surfaces, dated progress entries and the move-only report (plan 37-05, D-07, D-08, D-09) ──

/** The ROLLABLE lines of a run's stdout. */
function rollableLines(stdout: string): string[] {
  return stdout.split("\n").filter((l) => l.startsWith("ROLLABLE "));
}

/** `count` Done rows, appended to the clean board's Done column, which is its last column. */
function addDoneRows(root: string, count: number): void {
  appendTo(root, BOARD_REL, `\n${Array.from({ length: count }, (_v, i) => `- [ABC-${500 + i}] done row`).join("\n")}\n`);
}

/** A progress file of exactly BUDGETS.progressBytes + 1 bytes holding two dated status entries. */
const PROGRESS_TWO_DATED = paddedTo(
  "# Progress\n\n## 2026-10-20 — sweep\nswept\n\n## 2026-10-21\nswept again\n",
  BUDGETS.progressBytes + 1,
);

/** A progress file of the same size holding only standing sections. */
const PROGRESS_STANDING = paddedTo(
  "# Progress\n\n## Standing directive 2026-10-21\nkeep reading\n\n## What works\nmost\n",
  BUDGETS.progressBytes + 1,
);

describe("state-check.js — ROLLABLE: the surfaces the daily sweep rolls (plan 37-05, D-07, D-08, D-09)", () => {
  it(`${BUDGETS.doneRows + 1} Done rows print one ROLLABLE line for done naming state-roll; ${BUDGETS.doneRows} print none`, () => {
    const root = cleanRepo();
    addDoneRows(root, BUDGETS.doneRows + 1);
    const r = run(root);
    expect(r.status, r.stderr).toBe(0);
    expect(rollableLines(r.stdout)).toEqual([
      `ROLLABLE  done: 21 rows, keeps 20 rows (BUDGETS.doneRows) — run node tools/grugops/state-roll.js ${root}`,
    ]);
    const atBudget = cleanRepo();
    addDoneRows(atBudget, BUDGETS.doneRows);
    expect(rollableLines(run(atBudget).stdout)).toEqual([]);
  });

  it("a progress file over budget with two dated entries is rollable, and its finding carries no standing-section note", () => {
    const root = cleanRepo();
    plant(root, PROGRESS_REL, PROGRESS_TWO_DATED);
    const r = run(root);
    expect(rollableLines(r.stdout)).toEqual([
      `ROLLABLE  progress: 16,385 bytes, keeps 16,384 bytes (BUDGETS.progressBytes) — run node tools/grugops/state-roll.js ${root}`,
    ]);
    expect(budgetLines(r.stdout)).toEqual([`WARN     ${PROGRESS_REL}: 16,385 bytes, budget 16,384 bytes (BUDGETS.progressBytes)`]);
  });

  it("the same size with only standing sections is not rollable, and its finding names each standing heading and memory-bank/50-decisions/", () => {
    const root = cleanRepo();
    plant(root, PROGRESS_REL, PROGRESS_STANDING);
    const r = run(root);
    expect(rollableLines(r.stdout)).toEqual([]);
    const lines = budgetLines(r.stdout);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("`## Standing directive 2026-10-21`");
    expect(lines[0]).toContain("`## What works`");
    expect(lines[0]).toContain(`${DECISIONS_REL}/`);
  });

  it("--json carries rollable [\"done\", \"progress\"] in that fixed order when both apply", () => {
    const root = cleanRepo();
    plant(root, PROGRESS_REL, PROGRESS_TWO_DATED);
    addDoneRows(root, BUDGETS.doneRows + 3);
    const r = runJson(root);
    expect(r.report.rollable).toEqual(["done", "progress"]);
    const text = run(root);
    expect(rollableLines(text.stdout).map((l) => l.split(":")[0])).toEqual(["ROLLABLE  done", "ROLLABLE  progress"]);
  });

  it("a ROLLABLE line never changes the exit code by itself: the budget finding does, by the marker", () => {
    const warn = cleanRepo();
    addDoneRows(warn, BUDGETS.doneRows + 1);
    expect(run(warn).status).toBe(0);
    const enforced = cleanRepo(LAYOUT_MARKER_CONTENT);
    addDoneRows(enforced, BUDGETS.doneRows + 1);
    const r = runJson(enforced);
    expect(r.status).toBe(1);
    expect(r.report.findings.map((f) => f.key)).toEqual(["doneRows"]);
    expect(r.report.rollable).toEqual(["done"]);
  });
});

describe("state-check.js — MOVE-ONLY: a move leaves one copy (plan 37-05, SPLIT-06, v3.0 D-7)", () => {
  it("a name in both .grugops/queue/done/ and its archive folder is one finding naming both paths", () => {
    const root = cleanRepo();
    plant(root, `${QUEUE_DONE_REL}/T-1.md`, "# T-1\n");
    plant(root, `${QUEUE_DONE_ARCHIVE_REL}/T-1.md`, "# T-1\n");
    plant(root, `${QUEUE_DONE_ARCHIVE_REL}/T-0.md`, "# T-0\n");
    const r = run(root);
    expect(r.status, r.stderr).toBe(0);
    const copies = r.stdout.split("\n").filter((l) => l.endsWith("(move-only-copy)"));
    expect(copies).toHaveLength(1);
    expect(copies[0]).toMatch(/^WARN {5}/);
    expect(copies[0]).toContain(`${QUEUE_DONE_REL}/T-1.md`);
    expect(copies[0]).toContain(`${QUEUE_DONE_ARCHIVE_REL}/T-1.md`);
    expect(countLines(r.stdout)).toContain(`MOVE-ONLY ${QUEUE_DONE_REL}: 1 live, 2 archived`);
  });

  it("the same for memory-bank/50-decisions/, and with the D-14 marker it exits 1", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    plant(root, `${DECISIONS_REL}/ADR-001.md`, "# ADR-001\n");
    plant(root, `${DECISIONS_ARCHIVE_REL}/ADR-001.md`, "# ADR-001\n");
    const r = runJson(root);
    expect(r.status, r.stderr).toBe(1);
    expect(r.report.findings.map((f) => `${f.key}|${f.rel}`)).toEqual([`move-only-copy|${DECISIONS_REL}/ADR-001.md`]);
    expect(r.report.moveOnly[1]).toEqual({ live: DECISIONS_REL, archive: DECISIONS_ARCHIVE_REL, liveCount: 1, archivedCount: 1 });
  });

  it("one counts line per surface is printed on every run, and counts alone never change the exit code", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    plant(root, `${DECISIONS_REL}/ADR-001.md`, "# ADR-001\n");
    plant(root, `${DECISIONS_ARCHIVE_REL}/ADR-000.md`, "# ADR-000\n");
    const r = run(root);
    expect(r.status, r.stderr).toBe(0);
    expect(countLines(r.stdout)).toEqual([
      `MOVE-ONLY ${QUEUE_DONE_REL}: 0 live, 0 archived`,
      `MOVE-ONLY ${DECISIONS_REL}: 1 live, 1 archived`,
    ]);
    expect(r.stdout).toContain("No findings.");
  });

  it("a .gitkeep in all four folders is no finding and is never counted: a live folder with .gitkeep and one record prints 1 live", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    for (const dir of [QUEUE_DONE_REL, QUEUE_DONE_ARCHIVE_REL, DECISIONS_REL, DECISIONS_ARCHIVE_REL]) {
      plant(root, `${dir}/.gitkeep`, "");
    }
    plant(root, `${DECISIONS_REL}/ADR-template.md`, "# template\n");
    const r = run(root);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).not.toContain("(move-only-copy)");
    expect(countLines(r.stdout)).toEqual([
      `MOVE-ONLY ${QUEUE_DONE_REL}: 0 live, 0 archived`,
      `MOVE-ONLY ${DECISIONS_REL}: 1 live, 0 archived`,
    ]);
  });

  it("a live folder linked outside the root is a finding by name and is never listed", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    const outside = mkTmp("grugops-state-check-outside-");
    plant(outside, "ADR-001.md", "# ADR-001\n");
    mkdirSync(dirname(join(root, ...DECISIONS_REL.split("/"))), { recursive: true });
    const skipped = stageSymlinkOrSkip(
      outside,
      join(root, ...DECISIONS_REL.split("/")),
      "symlink leaving the repository root",
      "scripts/runnable-ref/state-check.test.ts: a decisions folder linked outside the root (plan 37-05)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the outside-root cases of plan 37-04 (the same locate rule)"));
      return;
    }
    const r = runJson(root);
    expect(r.status, r.stderr).toBe(1);
    expect(r.report.findings.map((f) => `${f.key}|${f.rel}`)).toEqual([`move-only-unlisted|${DECISIONS_REL}`]);
    expect(r.report.moveOnly[1]?.liveCount).toBeNull();
  });
});

// ── Trace freshness on a host (plan 37-09, SPLIT-05, SPLIT-03, D-01, D-03) ────────────────────────────
// state-check embeds the renderer's own trace model (collectTraceNotes, planTraceTree, compareTraceTree) and
// note reader (readRawNotesWithSkips), so it compares a host's rendered trace files with its published notes
// and writes nothing. Each repository is rendered by the COMMITTED trace-render.js, copied alone into its own
// empty directory, so the two runnables are compared as a host runs them.

const RENDER_HOST_JS = (() => {
  const host = mkTmp("grugops-state-check-render-host-");
  const js = join(host, "trace-render.js");
  copyFileSync(join(import.meta.dirname, "trace-render.js"), js);
  return js;
})();

const ctxio: typeof import("../context-io.js") = await import(
  pathToFileURL(join(import.meta.dirname, "..", "context-io.js")).href
);

/** The renderer on a repository, as a host runs it. */
function render(root: string, ...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [RENDER_HOST_JS, root, ...args], { encoding: "utf8", cwd: dirname(RENDER_HOST_JS) });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Render the repository and require the render to succeed. */
function renderOk(root: string): void {
  const r = render(root);
  expect(r.status, `render: ${r.stdout} ${r.stderr}`).toBe(0);
}

/** The text of a note carrying `refs`, sealed through the committed seal export (as trace-render.test.ts does). */
function noteText(name: string, refs: readonly string[]): string {
  const fence =
    `id: ${name}\n` +
    "kind: artifact-ref\n" +
    "by: engineer\n" +
    "at: 2026-10-22T10:00:00Z\n" +
    "verified_by: \n" +
    "confidence: high\n" +
    "refs:\n" +
    refs.map((r) => `  - ${r}`).join("\n") +
    "\n" +
    "supersedes: \n";
  const rest = "---\n\n" + "an artifact-ref note carrying trace refs.\n";
  return "---\n" + fence + `${ctxio.NOTE_SEAL_KEY}: ${ctxio.noteSeal("---\n" + fence + rest)}\n` + rest;
}

/** Plant a sealed note under `<root>/<contextRel>/<task>/notes/<name>.md`. */
function plantNote(root: string, contextRel: string, task: string, name: string, refs: readonly string[]): void {
  plant(root, `${contextRel}/${task}/notes/${name}.md`, noteText(name, refs));
}

/** A clean repository with one sealed note for ABC-001 in the live context root, rendered by the host renderer. */
function tracedRepo(marker?: string): string {
  const root = cleanRepo(marker);
  plantNote(root, CONTEXT_REL, "taskA", "n1", ["ABC-001", "NFR-002", "src/a.ts", "a.spec.ts"]);
  renderOk(root);
  return root;
}

/** The finding lines (WARN or FINDING) about the trace: every key the trace check uses begins `trace-`. */
function traceLines(stdout: string): string[] {
  return stdout.split("\n").filter((l) => /^(WARN|FINDING) /.test(l) && /\(trace-[a-z-]+\)$/.test(l));
}

/** The TRACE report line: the renderer's own --check summary, prefixed. */
function traceReportLines(stdout: string): string[] {
  return stdout.split("\n").filter((l) => l.startsWith("TRACE "));
}

const REMEDY = "node tools/grugops/trace-render.js";

describe("state-check.js — a host's rendered trace is fresh, checked with the renderer's own model (plan 37-09, D-01)", () => {
  it("a repository the renderer just rendered prints no trace finding, and --json carries trace.compared true", () => {
    for (const marker of [undefined, LAYOUT_MARKER_CONTENT]) {
      const root = tracedRepo(marker);
      const r = run(root);
      expect(r.status, `${r.stdout} ${r.stderr}`).toBe(0);
      expect(traceLines(r.stdout)).toEqual([]);
      expect(r.stdout).toContain("No findings.");
      const j = runJson(root);
      expect(j.status).toBe(0);
      expect(j.report.trace).toEqual({ compared: true, findings: [] });
    }
  });

  it("the TRACE line is the renderer's own --check summary for the same repository, read and skip counts included", () => {
    const root = tracedRepo(LAYOUT_MARKER_CONTENT);
    plant(root, `${CONTEXT_REL}/taskB/notes/broken.md`, "not a note at all\n");
    const check = render(root, "--check");
    expect(check.status, check.stdout).toBe(0);
    const summary = check.stdout.split("\n").filter((l) => l.startsWith("The trace is fresh: "));
    expect(summary).toHaveLength(1);
    expect(summary[0]).toContain("2 task(s) and 1 note(s) read");
    expect(summary[0]).toContain("unparseable 1");
    expect(traceReportLines(run(root).stdout)).toEqual([`TRACE    ${summary[0]}`]);
  });

  it("a new sealed note for a new ticket (no re-render) names the missing trace file and the changed index: WARN and exit 0 with no marker", () => {
    const root = tracedRepo();
    plantNote(root, CONTEXT_REL, "taskA", "n2", ["ABC-002", "#41"]);
    const r = run(root);
    expect(r.status, `${r.stdout} ${r.stderr}`).toBe(0);
    const lines = traceLines(r.stdout);
    expect(lines).toHaveLength(2);
    expect(lines.every((l) => l.startsWith("WARN     ") && l.endsWith("(trace-stale)"))).toBe(true);
    expect(lines.some((l) => l.startsWith(`WARN     ${TRACE_DIR_REL}/ABC-002.md: `))).toBe(true);
    expect(lines.some((l) => l.startsWith(`WARN     ${TRACEABILITY_REL}: `))).toBe(true);
    for (const l of lines) expect(l).toContain(`run ${REMEDY} ${root}`);
    expect(traceReportLines(r.stdout)).toHaveLength(1);
    expect(traceReportLines(r.stdout)[0]).toMatch(/^TRACE {4}The trace is not fresh: 2 difference\(s\); /);
  });

  it("the same with the D-14 marker is a FINDING per file and exits 1; --json names each in trace.findings", () => {
    const root = tracedRepo(LAYOUT_MARKER_CONTENT);
    plantNote(root, CONTEXT_REL, "taskA", "n2", ["ABC-002", "#41"]);
    const r = run(root);
    expect(r.status, `${r.stdout} ${r.stderr}`).toBe(1);
    expect(traceLines(r.stdout).every((l) => l.startsWith("FINDING  "))).toBe(true);
    const j = runJson(root);
    expect(j.status).toBe(1);
    expect(j.report.ok).toBe(false);
    expect(j.report.trace.compared).toBe(true);
    expect(j.report.trace.findings.map((f) => `${f.key}|${f.rel}`)).toEqual([
      `trace-stale|${TRACEABILITY_REL}`,
      `trace-stale|${TRACE_DIR_REL}/ABC-002.md`,
    ]);
    expect(j.report.findings.map((f) => `${f.key}|${f.rel}`)).toEqual(
      j.report.trace.findings.map((f) => `${f.key}|${f.rel}`),
    );
  });

  it("a note removed after the render leaves an extra generated trace file, named as trace-stale", () => {
    const root = tracedRepo(LAYOUT_MARKER_CONTENT);
    rmSync(join(root, ...`${CONTEXT_REL}/taskA/notes/n1.md`.split("/")));
    const j = runJson(root);
    expect(j.status).toBe(1);
    expect(j.report.trace.findings.map((f) => `${f.key}|${f.rel}`)).toEqual([
      `trace-stale|${TRACEABILITY_REL}`,
      `trace-stale|${TRACE_DIR_REL}/ABC-001.md`,
    ]);
    expect(j.report.trace.findings[1]?.note).toContain("a fresh render removes it");
  });

  it("D-03: a note only in the archive context root counts exactly like one in the live root", () => {
    const root = tracedRepo(LAYOUT_MARKER_CONTENT);
    const from = join(root, ...`${CONTEXT_REL}/taskA`.split("/"));
    const to = join(root, ...`${CONTEXT_ARCHIVE_REL}/taskA`.split("/"));
    plant(root, `${CONTEXT_ARCHIVE_REL}/taskA/notes/n1.md`, readFileSync(join(from, "notes", "n1.md"), "utf8"));
    rmSync(from, { recursive: true });
    expect(statSync(to).isDirectory()).toBe(true);
    const fresh = runJson(root);
    expect(fresh.status, JSON.stringify(fresh.report)).toBe(0);
    expect(fresh.report.trace).toEqual({ compared: true, findings: [] });
    plantNote(root, CONTEXT_ARCHIVE_REL, "taskC", "n3", ["ABC-003", "UAT-12"]);
    const stale = runJson(root);
    expect(stale.status).toBe(1);
    expect(stale.report.trace.findings.map((f) => f.rel)).toEqual([TRACEABILITY_REL, `${TRACE_DIR_REL}/ABC-003.md`]);
  });

  it("a hand-written traceability.md is one WARN line naming it and no compare result; --json carries trace.compared false", () => {
    const root = cleanRepo();
    plant(root, TRACEABILITY_REL, "# Traceability\n\n| Ticket | Code |\n| --- | --- |\n| ABC-001 | #41 |\n");
    plantNote(root, CONTEXT_REL, "taskA", "n1", ["ABC-001", "#41"]);
    const r = run(root);
    expect(r.status, `${r.stdout} ${r.stderr}`).toBe(0);
    const lines = traceLines(r.stdout);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(new RegExp(`^WARN {5}${TRACEABILITY_REL.replace(/[.]/g, "[.]")}: .*\\(trace-hand-written\\)$`));
    expect(r.stdout).not.toContain("(trace-stale)");
    expect(traceReportLines(r.stdout)).toEqual([]);
    const j = runJson(root);
    expect(j.status).toBe(0);
    expect(j.report.trace.compared).toBe(false);
    expect(j.report.trace.findings.map((f) => `${f.key}|${f.rel}`)).toEqual([`trace-hand-written|${TRACEABILITY_REL}`]);
  });

  it("the same hand-written index with the D-14 marker is one finding and exits 1", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    plant(root, TRACEABILITY_REL, "# Traceability\n");
    const r = run(root);
    expect(r.status, `${r.stdout} ${r.stderr}`).toBe(1);
    expect(traceLines(r.stdout)).toHaveLength(1);
    expect(traceLines(r.stdout)[0]).toMatch(/^FINDING {2}.*\(trace-hand-written\)$/);
    const j = runJson(root);
    expect(j.status).toBe(1);
    expect(j.report.trace.compared).toBe(false);
  });

  it("a hand-written file in the trace directory of a rendered tree is a finding by name, never fresh", () => {
    const root = tracedRepo(LAYOUT_MARKER_CONTENT);
    plant(root, `${TRACE_DIR_REL}/ABC-099.md`, "# my own notes\n");
    const j = runJson(root);
    expect(j.status).toBe(1);
    expect(j.report.trace.compared).toBe(true);
    expect(j.report.trace.findings.map((f) => `${f.key}|${f.rel}`)).toEqual([`trace-hand-written|${TRACE_DIR_REL}/ABC-099.md`]);
  });

  // Plan 37-22 (WR-01): this case expected one trace-collision finding naming `ABC-1, abc-1`. Under the board
  // grammar abc-1 is not a ticket, so ABC-1 with abc-1 is one ticket and no collision.
  it("two ticket identifiers that fold to one file name are a finding: ABC-1 with abc-1 is none, since abc-1 is no ticket under the board grammar", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    plantNote(root, CONTEXT_REL, "taskA", "n1", ["ABC-1", "#1"]);
    plantNote(root, CONTEXT_REL, "taskB", "n2", ["abc-1", "#2"]);
    expect(render(root).status).toBe(0);
    expect(render(root, "--check").status).toBe(0);
    const j = runJson(root);
    expect(j.status).toBe(0);
    expect(j.report.trace.findings.filter((f) => f.key === "trace-collision")).toEqual([]);
    expect(j.report.trace).toEqual({ compared: true, findings: [] });
  });

  it("CONTROL: a fresh render plus .gitkeep and .DS_Store in the trace directory yields no trace finding (the plan 37-07 owned-entry rule)", () => {
    const root = tracedRepo(LAYOUT_MARKER_CONTENT);
    plant(root, `${TRACE_DIR_REL}/.gitkeep`, "");
    plant(root, `${TRACE_DIR_REL}/.DS_Store`, "Bud1 binary metadata\n");
    const r = run(root);
    expect(r.status, `${r.stdout} ${r.stderr}`).toBe(0);
    expect(traceLines(r.stdout)).toEqual([]);
    const j = runJson(root);
    expect(j.report.trace).toEqual({ compared: true, findings: [] });
  });

  it("a context root linked outside the repository root is not compared: a finding by name and trace.compared false", () => {
    const root = cleanRepo(LAYOUT_MARKER_CONTENT);
    const outside = mkTmp("grugops-state-check-outside-context-");
    plantNote(outside, "ctx", "taskA", "n1", ["ABC-001"]);
    mkdirSync(dirname(join(root, ...CONTEXT_REL.split("/"))), { recursive: true });
    const skipped = stageSymlinkOrSkip(
      join(outside, "ctx"),
      join(root, ...CONTEXT_REL.split("/")),
      "symlink leaving the repository root",
      "scripts/runnable-ref/state-check.test.ts: a context root linked outside the root (plan 37-09)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the outside-root cases of plan 37-04 (the same locate rule)"));
      return;
    }
    const j = runJson(root);
    expect(j.status).toBe(1);
    expect(j.report.trace.compared).toBe(false);
    expect(j.report.trace.findings.map((f) => `${f.key}|${f.rel}`)).toEqual([`trace-not-compared|${CONTEXT_REL}`]);
  });

  it("a FIFO at a planned trace file is exit 2 naming it, in bounded time, with nothing on stdout (T-37-32)", () => {
    const root = tracedRepo(LAYOUT_MARKER_CONTENT);
    const at = join(root, ...`${TRACE_DIR_REL}/ABC-001.md`.split("/"));
    rmSync(at);
    if (!fifoAtOrSkip(at, "a FIFO at a planned trace file")) return;
    for (const extra of [[], ["--json"]]) {
      const r = spawnSync(process.execPath, [HOST_JS, root, ...extra], { encoding: "utf8", timeout: 15_000 });
      expect(r.error, "the check did not finish in bounded time").toBeUndefined();
      expect(r.status).toBe(2);
      expect(r.stdout).toBe("");
      expect(r.stderr).toContain(`${TRACE_DIR_REL}/ABC-001.md`);
    }
  });

  // Plan 37-21 (D-17 Gap 1, CR-01, READ-1): a task whose notes cannot be read is never a task with no notes.
  // The trace is not compared (trace.compared false), each unreadable task is one trace-not-compared finding by
  // name under the marker's severity, and no TRACE line says fresh. Both shapes: the task's notes directory at
  // mode 000, and the task directory itself (the realpath arm).
  for (const shape of [
    { name: "the notes directory", rel: `${CONTEXT_REL}/taskA/notes` },
    { name: "the task directory", rel: `${CONTEXT_REL}/taskA` },
  ] as const) {
    it.skipIf(process.platform === "win32" || process.getuid?.() === 0)(
      `CR-01: ${shape.name} at mode 000 is trace-not-compared naming the task, with and without the D-14 marker, never fresh`,
      () => {
        for (const marker of [LAYOUT_MARKER_CONTENT, undefined]) {
          const root = tracedRepo(marker);
          const at = join(root, ...shape.rel.split("/"));
          expect(statSync(at).isDirectory(), "PREMISE: the target is a real directory").toBe(true);
          chmodSync(at, 0o000);
          let text: { status: number | null; stdout: string; stderr: string };
          let j: { status: number | null; report: JsonReport; stdout: string; stderr: string };
          try {
            text = run(root);
            j = runJson(root);
          } finally {
            chmodSync(at, 0o755);
          }
          const expected = marker === undefined ? 0 : 1;
          expect(text.status, `${text.stdout} ${text.stderr}`).toBe(expected);
          expect(text.stdout).not.toContain("The trace is fresh");
          expect(traceReportLines(text.stdout)).toEqual([]);
          const lines = traceLines(text.stdout);
          expect(lines).toHaveLength(1);
          expect(lines[0]).toMatch(
            new RegExp(`^${marker === undefined ? "WARN {5}" : "FINDING {2}"}\\.grugops/context/taskA: .*\\(trace-not-compared\\)$`),
          );
          expect(j.status).toBe(expected);
          expect(j.report.trace.compared).toBe(false);
          expect(j.report.trace.findings.map((f) => `${f.key}|${f.rel}`)).toEqual([`trace-not-compared|${CONTEXT_REL}/taskA`]);
          expect(j.report.trace.findings[0]?.note).toContain("this task's notes could not be read (");
          expect(j.report.trace.findings[0]?.note).toContain("the render refuses to run until they can be read");
        }
      },
    );
  }

  it("the embedded region carries the comparison and no writer: compareTraceTree once, atomicWrite never", () => {
    const source = readFileSync(CHECK_TS, "utf8");
    expect(source.match(/export function compareTraceTree\b/g) ?? []).toHaveLength(1);
    expect(source.match(/export function readRawNotesWithSkips\b|function readRawNotesWithSkips\b/g) ?? []).toHaveLength(1);
    expect(source).not.toMatch(/function atomicWrite\b/);
  });
});

// ── grugops's own tree, in CI, in FAIL mode (plan 37-19, SPLIT-05, D-06, T-37-26) ─────────────────────────
//
// The CI line and this file are wired at both ends: ci.yml runs the committed checker against the own tree
// inside the ubuntu gate block, and this case fails the day that line is dropped, moved out of the block, or
// moved after the validator. The block is read through the one ubuntu-block authority, never a locator of
// this file's own.
describe("state-check — grugops's own tree runs it in CI (plan 37-19, SPLIT-05)", () => {
  const REPO = join(import.meta.dirname, "..", "..");
  const OWN_LINE = "node scripts/runnable-ref/state-check.js .";
  const VALIDATOR_LINE = "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js";

  it("the ubuntu gate block runs the checker against the own tree once, right before the validator line", () => {
    const commands = ubuntuBlockCommands(ciWorkflow());
    expect(commands, "PREMISE: the block is the gate block").toContain("npm run freshness:adapters");
    expect(commands.filter((c) => c === OWN_LINE)).toHaveLength(1);
    expect(commands.filter((c) => c === VALIDATOR_LINE)).toHaveLength(1);
    expect(commands.indexOf(OWN_LINE)).toBe(commands.indexOf(VALIDATOR_LINE) - 1);
  });

  it("the committed checker on the own tree: marker valid, enforced, no finding, exit 0", () => {
    const r = spawnSync(process.execPath, [HOST_JS, REPO, "--json"], {
      encoding: "utf8",
      cwd: dirname(HOST_JS),
      timeout: 60_000,
    });
    expect(r.status, `${r.stdout}${r.stderr}`).toBe(0);
    const report = JSON.parse(r.stdout) as { marker: string; enforced: boolean; findings: unknown[] };
    expect(report.marker).toBe("valid");
    expect(report.enforced).toBe(true);
    expect(report.findings).toEqual([]);
  });
});
